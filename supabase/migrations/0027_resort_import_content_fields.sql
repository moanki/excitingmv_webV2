-- Additive resort content fields used by the normalized document importer.
-- Existing values, IDs, slugs, rooms, media, and storage objects are untouched.
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'property' and c.relkind in ('r', 'p')
  ) then
    alter table public.property
      add column if not exists accommodation_summary text,
      add column if not exists curated_moments jsonb not null default '[]'::jsonb,
      add column if not exists butler_service jsonb not null default '{}'::jsonb;
  end if;

  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'resorts' and c.relkind in ('r', 'p')
  ) then
    alter table public.resorts
      add column if not exists accommodation_summary text,
      add column if not exists curated_moments jsonb not null default '[]'::jsonb,
      add column if not exists butler_service jsonb not null default '{}'::jsonb;
  end if;
end $$;
