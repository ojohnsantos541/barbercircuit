-- Keep the completion rule in sync with the server and reporting layer.
CREATE OR REPLACE FUNCTION public.validate_appointment_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('confirmado', 'em_andamento', 'concluido', 'cancelado') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;

  IF NEW.status = 'concluido'
     AND NEW.starts_at > now()
     AND (
       TG_OP = 'INSERT'
       OR OLD.status IS DISTINCT FROM NEW.status
       OR OLD.starts_at IS DISTINCT FROM NEW.starts_at
     ) THEN
    RAISE EXCEPTION 'Um atendimento futuro não pode ser marcado como concluído.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
