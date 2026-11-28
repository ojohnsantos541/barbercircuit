CREATE OR REPLACE FUNCTION public.prevent_weekly_hours_delete_with_future_appointments()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF pg_catalog.pg_trigger_depth() > 1 THEN RETURN OLD; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(OLD.barber_id::text, 0));
  IF EXISTS (
    SELECT 1 FROM public.appointments AS a
    WHERE a.barbershop_id = OLD.barbershop_id
      AND a.barber_id = OLD.barber_id
      AND a.status <> 'cancelado'
      AND a.starts_at > now()
      AND extract(dow FROM a.starts_at AT TIME ZONE 'America/Sao_Paulo')::integer = OLD.day_of_week
      AND NOT EXISTS (
        SELECT 1 FROM public.barber_weekly_hours AS h
        WHERE h.id <> OLD.id
          AND h.barbershop_id = OLD.barbershop_id
          AND h.barber_id = OLD.barber_id
          AND h.day_of_week = OLD.day_of_week
          AND h.start_time <= (a.starts_at AT TIME ZONE 'America/Sao_Paulo')::time
          AND h.end_time >= (a.ends_at AT TIME ZONE 'America/Sao_Paulo')::time
      )
  ) THEN
    RAISE EXCEPTION 'Não é possível remover este horário: existem agendamentos futuros que dependem dele. Ajuste ou remaneje os agendamentos primeiro.' USING ERRCODE = '23514';
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_weekly_hours_delete_with_appointments ON public.barber_weekly_hours;
CREATE TRIGGER trg_prevent_weekly_hours_delete_with_appointments BEFORE DELETE ON public.barber_weekly_hours FOR EACH ROW EXECUTE FUNCTION public.prevent_weekly_hours_delete_with_future_appointments();
