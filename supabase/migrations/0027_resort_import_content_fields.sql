-- Additive resort content fields used by the normalized document importer.
-- Existing values, IDs, slugs, rooms, media, and storage objects are untouched.
do $$
begin
  if to_regclass('public.property') is not null then
    alter table public.property
      add column if not exists accommodation_summary text,
      add column if not exists curated_moments jsonb not null default '[]'::jsonb,
      add column if not exists butler_service jsonb not null default '{}'::jsonb;
  end if;

  if to_regclass('public.resorts') is not null then
    alter table public.resorts
      add column if not exists accommodation_summary text,
      add column if not exists curated_moments jsonb not null default '[]'::jsonb,
      add column if not exists butler_service jsonb not null default '{}'::jsonb;
  end if;
end $$;
