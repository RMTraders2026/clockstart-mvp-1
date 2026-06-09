create extension if not exists "pgcrypto";

create type public.user_role as enum ('employee', 'admin');
create type public.timesheet_status as enum ('active', 'submitted', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'employee',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.workplaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  allowed_radius_meters integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.prestarts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id),
  workplace_id uuid not null references public.workplaces(id),
  date date not null,
  fit_for_work boolean not null,
  not_under_influence boolean not null,
  ppe_available boolean not null,
  hazards_understood boolean not null,
  site_rules_acknowledged boolean not null,
  report_issues_acknowledged boolean not null,
  authorised_equipment_acknowledged boolean not null,
  signature_name text not null,
  comments text,
  gps_latitude double precision,
  gps_longitude double precision,
  gps_accuracy double precision,
  submitted_at timestamptz not null default now(),
  unique (employee_id, workplace_id, date)
);

create table public.timesheets (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id),
  workplace_id uuid not null references public.workplaces(id),
  date date not null,
  clock_in_time timestamptz not null,
  clock_out_time timestamptz,
  break_minutes integer,
  total_hours numeric(8, 2),
  work_notes text,
  clock_in_latitude double precision,
  clock_in_longitude double precision,
  clock_in_accuracy double precision,
  clock_out_latitude double precision,
  clock_out_longitude double precision,
  clock_out_accuracy double precision,
  clock_in_outside_radius boolean,
  clock_out_outside_radius boolean,
  status public.timesheet_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint break_minutes_non_negative check (break_minutes is null or break_minutes >= 0),
  constraint notes_required_on_submit check (status = 'active' or coalesce(length(trim(work_notes)), 0) > 0),
  constraint clock_out_required_on_submit check (status = 'active' or clock_out_time is not null)
);

create unique index one_active_timesheet_per_employee
  on public.timesheets(employee_id)
  where status = 'active';

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  action text not null,
  table_name text not null,
  record_id uuid not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and active = true
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_timesheets_updated_at
before update on public.timesheets
for each row execute function public.touch_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'employee')
  );
  return new;
end;
$$;

create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.workplaces enable row level security;
alter table public.prestarts enable row level security;
alter table public.timesheets enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles own read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles admin write" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "workplaces active read" on public.workplaces
  for select using (active = true or public.is_admin());
create policy "workplaces admin write" on public.workplaces
  for all using (public.is_admin()) with check (public.is_admin());

create policy "prestarts own insert" on public.prestarts
  for insert with check (employee_id = auth.uid());
create policy "prestarts own or admin read" on public.prestarts
  for select using (employee_id = auth.uid() or public.is_admin());
create policy "prestarts admin write" on public.prestarts
  for update using (public.is_admin()) with check (public.is_admin());

create policy "timesheets own insert" on public.timesheets
  for insert with check (employee_id = auth.uid());
create policy "timesheets own or admin read" on public.timesheets
  for select using (employee_id = auth.uid() or public.is_admin());
create policy "timesheets own active update" on public.timesheets
  for update using (employee_id = auth.uid() and status = 'active')
  with check (employee_id = auth.uid());
create policy "timesheets admin update" on public.timesheets
  for update using (public.is_admin()) with check (public.is_admin());

create policy "audit admin read" on public.audit_logs
  for select using (public.is_admin());
create policy "audit admin insert" on public.audit_logs
  for insert with check (public.is_admin());

insert into public.workplaces (name, address, latitude, longitude, allowed_radius_meters)
values
  ('Main Yard', 'Brisbane QLD', -27.4705, 153.0260, 250),
  ('North Civil Site', 'North Brisbane QLD', -27.3810, 153.0234, 300);
