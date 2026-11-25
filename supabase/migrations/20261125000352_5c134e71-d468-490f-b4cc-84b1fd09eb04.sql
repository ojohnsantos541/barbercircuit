CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name') ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.barbershops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  phone text,
  address text,
  owner_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_barbershops_owner ON public.barbershops(owner_user_id);
GRANT SELECT ON public.barbershops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barbershops TO authenticated;
GRANT ALL ON public.barbershops TO service_role;
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view barbershops" ON public.barbershops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner inserts barbershop" ON public.barbershops FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owner updates barbershop" ON public.barbershops FOR UPDATE TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owner deletes barbershop" ON public.barbershops FOR DELETE TO authenticated USING (auth.uid() = owner_user_id);
CREATE TRIGGER trg_barbershops_updated BEFORE UPDATE ON public.barbershops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_shop_owner(_shop uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.barbershops WHERE id = _shop AND owner_user_id = auth.uid())
$$;

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  price numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_services_shop ON public.services(barbershop_id);

CREATE TABLE IF NOT EXISTS public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialty text,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_barbers_shop ON public.barbers(barbershop_id);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON public.customers(barbershop_id);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  barber_id uuid REFERENCES public.barbers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'confirmado',
  price numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appointments_shop_start ON public.appointments(barbershop_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_start ON public.appointments(barber_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON public.appointments(customer_id);

CREATE OR REPLACE FUNCTION public.validate_appointment_status() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('confirmado','em_andamento','concluido','cancelado') THEN RAISE EXCEPTION 'Status inválido: %', NEW.status; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_appointments_status BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_status();

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  description text NOT NULL,
  category text,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_shop_date ON public.expenses(barbershop_id, expense_date);

GRANT SELECT ON public.services, public.barbers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services, public.barbers, public.customers, public.appointments, public.expenses TO authenticated;
GRANT ALL ON public.services, public.barbers, public.customers, public.appointments, public.expenses TO service_role;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public views active services" ON public.services FOR SELECT TO anon, authenticated USING (active OR public.is_shop_owner(barbershop_id));
CREATE POLICY "Owner manages services" ON public.services FOR ALL TO authenticated USING (public.is_shop_owner(barbershop_id)) WITH CHECK (public.is_shop_owner(barbershop_id));
CREATE POLICY "Public views active barbers" ON public.barbers FOR SELECT TO anon, authenticated USING (active OR public.is_shop_owner(barbershop_id));
CREATE POLICY "Owner manages barbers" ON public.barbers FOR ALL TO authenticated USING (public.is_shop_owner(barbershop_id)) WITH CHECK (public.is_shop_owner(barbershop_id));
CREATE POLICY "Owner manages customers" ON public.customers FOR ALL TO authenticated USING (public.is_shop_owner(barbershop_id)) WITH CHECK (public.is_shop_owner(barbershop_id));
CREATE POLICY "Owner manages appointments" ON public.appointments FOR ALL TO authenticated USING (public.is_shop_owner(barbershop_id)) WITH CHECK (public.is_shop_owner(barbershop_id));
CREATE POLICY "Owner manages expenses" ON public.expenses FOR ALL TO authenticated USING (public.is_shop_owner(barbershop_id)) WITH CHECK (public.is_shop_owner(barbershop_id));

CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_barbers_updated BEFORE UPDATE ON public.barbers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();