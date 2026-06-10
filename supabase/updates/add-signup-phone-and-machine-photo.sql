alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists job_role text;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, job_role, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'job_role',
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'employee')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    job_role = excluded.job_role;
  return new;
end;
$$;

alter table public.machine_prestarts add column if not exists hour_meter numeric(10, 2);
alter table public.machine_prestarts add column if not exists photo_url text;
alter table public.machine_prestarts add column if not exists safe_to_operate_status text;
alter table public.machine_prestarts add column if not exists fluids_checked_status text;
alter table public.machine_prestarts add column if not exists tyres_tracks_checked_status text;
alter table public.machine_prestarts add column if not exists guards_checked_status text;
alter table public.machine_prestarts add column if not exists brakes_steering_checked_status text;
alter table public.machine_prestarts add column if not exists faults_reported_status text;

insert into storage.buckets (id, name, public)
values ('machine-prestart-photos', 'machine-prestart-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "machine photos public read" on storage.objects;
create policy "machine photos public read" on storage.objects
  for select using (bucket_id = 'machine-prestart-photos');

drop policy if exists "machine photos authenticated upload" on storage.objects;
create policy "machine photos authenticated upload" on storage.objects
  for insert with check (bucket_id = 'machine-prestart-photos' and auth.role() = 'authenticated');
