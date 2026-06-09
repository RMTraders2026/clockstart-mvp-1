insert into public.workplaces (name, address, latitude, longitude, allowed_radius_meters, active)
select 'Roma Yard', '222 Raglan Street, Roma QLD 4455', -26.5733, 148.7869, 200, true
where not exists (
  select 1 from public.workplaces where name = 'Roma Yard'
);
