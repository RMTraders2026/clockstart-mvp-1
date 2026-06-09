create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  asset_number text,
  workplace_id uuid references public.workplaces(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.machine_prestarts (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id),
  employee_id uuid not null references public.profiles(id),
  date date not null,
  safe_to_operate boolean not null,
  fluids_checked boolean not null,
  tyres_tracks_checked boolean not null,
  guards_checked boolean not null,
  brakes_steering_checked boolean not null,
  faults_reported boolean not null,
  start_hour_meter numeric(10, 2) not null,
  finish_hour_meter numeric(10, 2),
  machine_hours numeric(10, 2),
  comments text,
  submitted_at timestamptz not null default now(),
  constraint finish_after_start check (finish_hour_meter is null or finish_hour_meter >= start_hour_meter)
);

alter table public.machines enable row level security;
alter table public.machine_prestarts enable row level security;

drop policy if exists "machines active read" on public.machines;
create policy "machines active read" on public.machines
  for select using (active = true or public.is_admin());

drop policy if exists "machines admin write" on public.machines;
create policy "machines admin write" on public.machines
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "machine prestarts own insert" on public.machine_prestarts;
create policy "machine prestarts own insert" on public.machine_prestarts
  for insert with check (employee_id = auth.uid());

drop policy if exists "machine prestarts own or admin read" on public.machine_prestarts;
create policy "machine prestarts own or admin read" on public.machine_prestarts
  for select using (employee_id = auth.uid() or public.is_admin());

drop policy if exists "machine prestarts admin update" on public.machine_prestarts;
create policy "machine prestarts admin update" on public.machine_prestarts
  for update using (public.is_admin()) with check (public.is_admin());

insert into public.machines (name, asset_number, workplace_id)
select 'Scrap Handler', 'RMT-001', id
from public.workplaces
where name = 'Roma Yard'
  and not exists (select 1 from public.machines where asset_number = 'RMT-001')
limit 1;
