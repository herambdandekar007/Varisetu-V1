-- Phase 3: stale / expired alert lifecycle.
alter table public.alerts add column if not exists status text not null default 'ACTIVE' check (status in ('ACTIVE','STALE','EXPIRED'));
alter table public.alerts add column if not exists is_stale boolean not null default false;
alter table public.alerts add column if not exists acknowledged_at timestamptz;

-- Sweep: promote unacknowledged alerts to STALE, then anything past its expiry to EXPIRED.
create or replace function public.sweep_stale_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.alerts
    set status = 'STALE', is_stale = true
    where status = 'ACTIVE'
      and acknowledged = false
      and created_at < now() - interval '2 hours';
  update public.alerts
    set status = 'EXPIRED', is_stale = true
    where status in ('ACTIVE','STALE')
      and expires_at is not null
      and expires_at < now();
end
$$;

-- Trigger: sweep every time a new alert is inserted, so staleness resolves live without a UI reload.
create or replace function public.trg_sweep_alerts_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sweep_stale_alerts();
  return new;
end
$$;

grant execute on function public.sweep_stale_alerts() to authenticated;
revoke all on function public.sweep_stale_alerts() from public, anon;

drop trigger if exists trg_sweep_alerts_on_insert on public.alerts;
create trigger trg_sweep_alerts_on_insert
  after insert on public.alerts
  for each row execute function public.trg_sweep_alerts_on_insert();

select cron.schedule('sweep-stale-alerts', '*/15 * * * *', $$select public.sweep_stale_alerts()$$);

-- Note: PG cron was newly enabled; also ensure the crowd-cell aggregation runs.
select cron.schedule('aggregate-cell-counts', '*/30 * * * *', $$select public.aggregate_cell_counts()$$);

revoke all on function public.trg_sweep_alerts_on_insert() from public, anon, authenticated;
