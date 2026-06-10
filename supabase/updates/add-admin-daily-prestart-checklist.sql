create table if not exists public.prestart_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.prestart_item_responses (
  id uuid primary key default gen_random_uuid(),
  prestart_id uuid not null references public.prestarts(id) on delete cascade,
  prestart_item_id uuid not null references public.prestart_items(id),
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (prestart_id, prestart_item_id)
);

alter table public.prestart_items enable row level security;
alter table public.prestart_item_responses enable row level security;

drop policy if exists "prestarts own update" on public.prestarts;
create policy "prestarts own update" on public.prestarts
  for update using (employee_id = auth.uid()) with check (employee_id = auth.uid());

drop policy if exists "prestart items active read" on public.prestart_items;
create policy "prestart items active read" on public.prestart_items
  for select using (active = true or public.is_admin());

drop policy if exists "prestart items admin write" on public.prestart_items;
create policy "prestart items admin write" on public.prestart_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "prestart responses own insert" on public.prestart_item_responses;
create policy "prestart responses own insert" on public.prestart_item_responses
  for insert with check (
    exists (
      select 1 from public.prestarts
      where prestarts.id = prestart_item_responses.prestart_id
        and prestarts.employee_id = auth.uid()
    )
  );

drop policy if exists "prestart responses own update" on public.prestart_item_responses;
create policy "prestart responses own update" on public.prestart_item_responses
  for update using (
    exists (
      select 1 from public.prestarts
      where prestarts.id = prestart_item_responses.prestart_id
        and prestarts.employee_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.prestarts
      where prestarts.id = prestart_item_responses.prestart_id
        and prestarts.employee_id = auth.uid()
    )
  );

drop policy if exists "prestart responses own or admin read" on public.prestart_item_responses;
create policy "prestart responses own or admin read" on public.prestart_item_responses
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.prestarts
      where prestarts.id = prestart_item_responses.prestart_id
        and prestarts.employee_id = auth.uid()
    )
  );

insert into public.prestart_items (label, sort_order)
select seed.label, seed.sort_order
from (
  values
    ('I am fit for work', 1),
    ('I am not affected by drugs or alcohol', 2),
    ('I have the required PPE', 3),
    ('I understand today''s work area and hazards', 4),
    ('I will follow site rules, SWMS, and WHS directions', 5),
    ('I will report hazards, incidents, injuries, or unsafe conditions', 6),
    ('I understand I must only operate equipment I am licensed or authorised to use', 7)
) as seed(label, sort_order)
where not exists (
  select 1 from public.prestart_items
  where prestart_items.label = seed.label
);
