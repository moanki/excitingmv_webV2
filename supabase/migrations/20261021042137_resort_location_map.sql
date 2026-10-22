alter table public.property
  add column if not exists map_embed_url text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'property_location_coordinates_pair_check' and conrelid = 'public.property'::regclass) then
    alter table public.property add constraint property_location_coordinates_pair_check
      check ((latitude is null) = (longitude is null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'property_location_latitude_check' and conrelid = 'public.property'::regclass) then
    alter table public.property add constraint property_location_latitude_check
      check (latitude between -90 and 90);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'property_location_longitude_check' and conrelid = 'public.property'::regclass) then
    alter table public.property add constraint property_location_longitude_check
      check (longitude between -180 and 180);
  end if;
end $$;
