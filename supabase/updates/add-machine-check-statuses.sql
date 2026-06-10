alter table public.machine_prestarts add column if not exists safe_to_operate_status text;
alter table public.machine_prestarts add column if not exists fluids_checked_status text;
alter table public.machine_prestarts add column if not exists tyres_tracks_checked_status text;
alter table public.machine_prestarts add column if not exists guards_checked_status text;
alter table public.machine_prestarts add column if not exists brakes_steering_checked_status text;
alter table public.machine_prestarts add column if not exists faults_reported_status text;
