CREATE OR REPLACE FUNCTION public.get_public_booking_slots(
  _slug text,
  _barber_id uuid,
  _service_id uuid,
  _date date
)
RETURNS TABLE(slot_time text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_shop_id uuid;
  v_duration integer;
  v_now_local timestamp;
BEGIN
  IF _slug IS NULL OR length(trim(_slug)) < 2 OR length(_slug) > 120
     OR _date IS NULL OR _date < (now() AT TIME ZONE 'America/Sao_Paulo')::date
     OR _date > (now() AT TIME ZONE 'America/Sao_Paulo')::date + 60 THEN
    RETURN;
  END IF;

  SELECT b.id INTO v_shop_id
  FROM public.barbershops b WHERE b.slug = lower(trim(_slug));
  IF v_shop_id IS NULL THEN RETURN; END IF;

  SELECT s.duration_minutes INTO v_duration
  FROM public.services s
  WHERE s.id = _service_id AND s.barbershop_id = v_shop_id AND s.active = true;
  IF v_duration IS NULL OR v_duration < 5 OR v_duration > 480 THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.barbers b
    WHERE b.id = _barber_id AND b.barbershop_id = v_shop_id AND b.active = true
  ) THEN RETURN; END IF;

  v_now_local := now() AT TIME ZONE 'America/Sao_Paulo';

  RETURN QUERY
  SELECT to_char(g.slot_start, 'HH24:MI') AS slot_time
  FROM public.barber_weekly_hours h
  CROSS JOIN LATERAL generate_series(
    (_date + h.start_time)::timestamp,
    (_date + h.end_time - make_interval(mins => v_duration))::timestamp,
    interval '15 minutes'
  ) AS g(slot_start)
  WHERE h.barbershop_id = v_shop_id
    AND h.barber_id = _barber_id
    AND h.day_of_week = extract(dow from _date)::integer
    AND g.slot_start > v_now_local
    AND NOT EXISTS (
      SELECT 1 FROM public.barber_time_blocks tb
      WHERE tb.barber_id = _barber_id
        AND tstzrange(tb.starts_at, tb.ends_at, '[)') &&
            tstzrange(g.slot_start AT TIME ZONE 'America/Sao_Paulo',
                      (g.slot_start + make_interval(mins => v_duration)) AT TIME ZONE 'America/Sao_Paulo', '[)')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.barber_id = _barber_id
        AND a.status <> 'cancelado'
        AND tstzrange(a.starts_at, a.ends_at, '[)') &&
            tstzrange(g.slot_start AT TIME ZONE 'America/Sao_Paulo',
                      (g.slot_start + make_interval(mins => v_duration)) AT TIME ZONE 'America/Sao_Paulo', '[)')
    )
  ORDER BY g.slot_start
  LIMIT 80;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_public_booking(
  _slug text,
  _barber_id uuid,
  _service_id uuid,
  _date date,
  _time text,
  _customer_name text,
  _customer_phone text
)
RETURNS TABLE(appointment_id uuid, starts_at timestamptz, ends_at timestamptz, barber_name text, service_name text, price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_shop_id uuid;
  v_duration integer;
  v_price numeric(10,2);
  v_service_name text;
  v_barber_name text;
  v_phone_digits text;
  v_customer_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_local_start timestamp;
  v_local_end timestamp;
BEGIN
  IF _slug IS NULL OR length(trim(_slug)) < 2 OR length(_slug) > 120 THEN
    RAISE EXCEPTION 'Barbearia inválida.' USING ERRCODE = '22023';
  END IF;
  IF _customer_name IS NULL OR length(trim(_customer_name)) < 2 OR length(trim(_customer_name)) > 100 THEN
    RAISE EXCEPTION 'Informe seu nome (2 a 100 caracteres).' USING ERRCODE = '22023';
  END IF;
  v_phone_digits := regexp_replace(coalesce(_customer_phone, ''), '[^0-9]', '', 'g');
  IF length(v_phone_digits) < 10 OR length(v_phone_digits) > 13 THEN
    RAISE EXCEPTION 'Informe um telefone válido com DDD.' USING ERRCODE = '22023';
  END IF;
  IF _date IS NULL OR _date < (now() AT TIME ZONE 'America/Sao_Paulo')::date
     OR _date > (now() AT TIME ZONE 'America/Sao_Paulo')::date + 60
     OR _time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'Data ou horário inválido.' USING ERRCODE = '22023';
  END IF;

  SELECT b.id INTO v_shop_id
  FROM public.barbershops b WHERE b.slug = lower(trim(_slug));
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'Barbearia não encontrada.' USING ERRCODE = 'P0002';
  END IF;

  SELECT s.duration_minutes, s.price, s.name
    INTO v_duration, v_price, v_service_name
  FROM public.services s
  WHERE s.id = _service_id AND s.barbershop_id = v_shop_id AND s.active = true;
  IF v_duration IS NULL OR v_duration < 5 OR v_duration > 480 THEN
    RAISE EXCEPTION 'Serviço indisponível.' USING ERRCODE = 'P0002';
  END IF;

  SELECT b.name INTO v_barber_name
  FROM public.barbers b
  WHERE b.id = _barber_id AND b.barbershop_id = v_shop_id AND b.active = true;
  IF v_barber_name IS NULL THEN
    RAISE EXCEPTION 'Profissional indisponível.' USING ERRCODE = 'P0002';
  END IF;

  v_local_start := _date + _time::time;
  v_local_end := v_local_start + make_interval(mins => v_duration);
  IF v_local_end::date <> _date THEN
    RAISE EXCEPTION 'O atendimento precisa terminar no mesmo dia.' USING ERRCODE = '22023';
  END IF;
  v_start := v_local_start AT TIME ZONE 'America/Sao_Paulo';
  v_end := v_local_end AT TIME ZONE 'America/Sao_Paulo';
  IF v_start <= now() THEN
    RAISE EXCEPTION 'Escolha um horário futuro.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_barber_id::text, 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.barber_weekly_hours h
    WHERE h.barbershop_id = v_shop_id AND h.barber_id = _barber_id
      AND h.day_of_week = extract(dow from _date)::integer
      AND h.start_time <= _time::time AND h.end_time >= v_local_end::time
  ) THEN
    RAISE EXCEPTION 'Este horário não está disponível no expediente.' USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.barber_time_blocks tb
    WHERE tb.barber_id = _barber_id
      AND tstzrange(tb.starts_at, tb.ends_at, '[)') && tstzrange(v_start, v_end, '[)')
  ) THEN
    RAISE EXCEPTION 'Este horário está bloqueado. Escolha outro.' USING ERRCODE = '23P01';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.barber_id = _barber_id AND a.status <> 'cancelado'
      AND tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(v_start, v_end, '[)')
  ) THEN
    RAISE EXCEPTION 'Este horário acabou de ser reservado. Escolha outro.' USING ERRCODE = '23P01';
  END IF;

  SELECT c.id INTO v_customer_id
  FROM public.customers c
  WHERE c.barbershop_id = v_shop_id
    AND regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') = v_phone_digits
  ORDER BY c.created_at
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers(barbershop_id, name, phone)
    VALUES(v_shop_id, trim(_customer_name), v_phone_digits)
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET name = trim(_customer_name), phone = v_phone_digits
    WHERE id = v_customer_id AND barbershop_id = v_shop_id;
  END IF;

  INSERT INTO public.appointments(
    barbershop_id, customer_id, barber_id, service_id,
    starts_at, ends_at, status, price, notes
  ) VALUES (
    v_shop_id, v_customer_id, _barber_id, _service_id,
    v_start, v_end, 'confirmado', v_price, 'Agendamento realizado pela página pública.'
  )
  RETURNING id INTO appointment_id;

  starts_at := v_start;
  ends_at := v_end;
  barber_name := v_barber_name;
  service_name := v_service_name;
  price := v_price;
  RETURN NEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_public_booking_slots(text, uuid, uuid, date) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_booking_slots(text, uuid, uuid, date) TO anon;
REVOKE ALL ON FUNCTION public.create_public_booking(text, uuid, uuid, date, text, text, text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_booking(text, uuid, uuid, date, text, text, text) TO anon;
