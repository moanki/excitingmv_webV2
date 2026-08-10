-- Canonical content storage for resorts, hotels, and liveaboards.
-- public.property is the only runtime content table. The old public.resorts
-- table/view is retired only after rows and foreign keys are preserved.

create table if not exists public.property (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  property_type text not null default 'resort',
  name text not null,
  atoll text,
  category text,
  transfer_type text,
  description text,
  accommodation_summary text,
  highlights jsonb not null default '[]'::jsonb,
  meal_plans jsonb not null default '[]'::jsonb,
  curated_moments jsonb not null default '[]'::jsonb,
  butler_service jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  seo_summary text,
  meta_keywords text[],
  status text not null default 'draft',
  is_featured_homepage boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.property
  add column if not exists property_type text not null default 'resort',
  add column if not exists accommodation_summary text,
  add column if not exists curated_moments jsonb not null default '[]'::jsonb,
  add column if not exists butler_service jsonb not null default '{}'::jsonb,
  add column if not exists is_featured_homepage boolean not null default false;

do $$
declare
  legacy_kind "char";
begin
  select c.relkind into legacy_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'resorts';

  if legacy_kind in ('r', 'p') then
    alter table public.resorts
      add column if not exists property_type text not null default 'resort',
      add column if not exists is_featured_homepage boolean not null default false;

    if exists (
      select 1
      from public.resorts legacy
      where not exists (select 1 from public.property canonical where canonical.id = legacy.id)
        and exists (select 1 from public.property canonical where canonical.slug = legacy.slug)
    ) then
      raise exception 'Cannot canonicalize property schema: legacy resort slug conflicts with a different property id';
    end if;

    insert into public.property (
      id, slug, property_type, name, atoll, category, transfer_type,
      description, highlights, meal_plans, seo_title, seo_description,
      seo_summary, meta_keywords, status, is_featured_homepage,
      published_at, created_at, updated_at
    )
    select
      legacy.id,
      legacy.slug,
      case
        when lower(trim(coalesce(legacy.property_type, 'resort'))) in ('liveaboard', 'liveaboards') then 'liveaboards'
        when lower(trim(coalesce(legacy.property_type, 'resort'))) in ('hotel', 'hotels') then 'hotels'
        else 'resort'
      end,
      legacy.name,
      legacy.atoll,
      legacy.category,
      legacy.transfer_type,
      legacy.description,
      coalesce(legacy.highlights, '[]'::jsonb),
      coalesce(legacy.meal_plans, '[]'::jsonb),
      legacy.seo_title,
      legacy.seo_description,
      legacy.seo_summary,
      legacy.meta_keywords,
      coalesce(legacy.status, 'draft'),
      coalesce(legacy.is_featured_homepage, false),
      legacy.published_at,
      coalesce(legacy.created_at, now()),
      coalesce(legacy.updated_at, now())
    from public.resorts legacy
    where not exists (select 1 from public.property canonical where canonical.id = legacy.id);
  end if;
end $$;

update public.property
set property_type = case
  when lower(trim(coalesce(property_type, 'resort'))) in ('liveaboard', 'liveaboards') then 'liveaboards'
  when lower(trim(coalesce(property_type, 'resort'))) in ('hotel', 'hotels') then 'hotels'
  else 'resort'
end;

alter table public.property
  drop constraint if exists property_property_type_check,
  add constraint property_property_type_check check (property_type in ('resort', 'hotels', 'liveaboards'));

do $$
declare
  legacy_kind "char";
  constraint_record record;
begin
  select c.relkind into legacy_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'resorts';

  if legacy_kind in ('r', 'p') then
    for constraint_record in
      select child.oid::regclass as table_name, con.conname
      from pg_constraint con
      join pg_class child on child.oid = con.conrelid
      where con.confrelid = 'public.resorts'::regclass
    loop
      execute format('alter table %s drop constraint if exists %I', constraint_record.table_name, constraint_record.conname);
    end loop;
  end if;

  if to_regclass('public.rooms') is not null then
    alter table public.rooms drop constraint if exists rooms_resort_id_fkey;
    alter table public.rooms add constraint rooms_resort_id_fkey
      foreign key (resort_id) references public.property(id) on delete cascade;
  end if;

  if to_regclass('public.resort_media') is not null then
    alter table public.resort_media drop constraint if exists resort_media_resort_id_fkey;
    alter table public.resort_media add constraint resort_media_resort_id_fkey
      foreign key (resort_id) references public.property(id) on delete cascade;
  end if;

  if to_regclass('public.resort_documents') is not null then
    alter table public.resort_documents drop constraint if exists resort_documents_resort_id_fkey;
    alter table public.resort_documents add constraint resort_documents_resort_id_fkey
      foreign key (resort_id) references public.property(id) on delete cascade;
  end if;

  if legacy_kind in ('r', 'p') then
    drop table public.resorts;
  elsif legacy_kind = 'v' then
    drop view public.resorts;
  elsif legacy_kind = 'm' then
    drop materialized view public.resorts;
  end if;
end $$;

create index if not exists property_property_type_idx on public.property(property_type);
create index if not exists property_type_status_updated_idx on public.property(property_type, status, updated_at desc);
