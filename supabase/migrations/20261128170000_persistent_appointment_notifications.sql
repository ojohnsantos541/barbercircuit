create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  event_type text not null default 'appointment_created',
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_shop_created_idx
  on public.notifications (barbershop_id, created_at desc);
create index if not exists notifications_shop_unread_idx
  on public.notifications (barbershop_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Shop owners can read notifications" on public.notifications;
create policy "Shop owners can read notifications"
  on public.notifications for select to authenticated
  using (public.is_shop_owner(barbershop_id));

drop policy if exists "Shop owners can update notifications" on public.notifications;
create policy "Shop owners can update notifications"
  on public.notifications for update to authenticated
  using (public.is_shop_owner(barbershop_id))
  with check (public.is_shop_owner(barbershop_id));

revoke all on public.notifications from anon, authenticated;
grant select, update on public.notifications to authenticated;

create or replace function public.create_appointment_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    barbershop_id, appointment_id, event_type, title, message
  ) values (
    new.barbershop_id,
    new.id,
    'appointment_created',
    'Novo agendamento',
    'Um cliente realizou um novo agendamento pela página da barbearia.'
  );
  return new;
end;
$$;

drop trigger if exists appointments_create_notification on public.appointments;
create trigger appointments_create_notification
  after insert on public.appointments
  for each row execute function public.create_appointment_notification();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
