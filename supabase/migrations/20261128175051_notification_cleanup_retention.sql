create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'Shop owners can delete notifications'
  ) then
    create policy "Shop owners can delete notifications"
      on public.notifications
      for delete
      to authenticated
      using (public.is_shop_owner(barbershop_id));
  end if;
end;
$$;

grant delete on public.notifications to authenticated;

select cron.unschedule(jobid)
from cron.job
where jobname = 'barbercircuit-notification-retention';

select cron.schedule(
  'barbercircuit-notification-retention',
  '0 3 * * *',
  $$delete from public.notifications where created_at < now() - interval '30 days'$$
);
