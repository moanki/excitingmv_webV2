do $$
begin
  if exists (
    select 1
    from pg_class class
    join pg_namespace namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname = 'resorts'
      and class.relkind in ('v', 'm')
  ) then
    drop view public.resorts;
  end if;

  if to_regclass('public.property') is null and to_regclass('public.resorts') is not null then
    alter table public.resorts rename to property;
  end if;
end $$;

create table if not exists public.property (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  property_type text not null default 'resort',
  name text not null,
  atoll text,
  category text,
  transfer_type text,
  description text,
  highlights jsonb not null default '[]'::jsonb,
  meal_plans jsonb not null default '[]'::jsonb,
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
  add column if not exists slug text,
  add column if not exists property_type text not null default 'resort',
  add column if not exists name text,
  add column if not exists atoll text,
  add column if not exists category text,
  add column if not exists transfer_type text,
  add column if not exists description text,
  add column if not exists highlights jsonb not null default '[]'::jsonb,
  add column if not exists meal_plans jsonb not null default '[]'::jsonb,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_summary text,
  add column if not exists meta_keywords text[],
  add column if not exists status text not null default 'draft',
  add column if not exists is_featured_homepage boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if to_regclass('public.resorts') is not null and to_regclass('public.property') is not null then
    insert into public.property (
      id,
      slug,
      property_type,
      name,
      atoll,
      category,
      transfer_type,
      description,
      highlights,
      meal_plans,
      seo_title,
      seo_description,
      seo_summary,
      meta_keywords,
      status,
      is_featured_homepage,
      published_at,
      created_at,
      updated_at
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
    where not exists (
      select 1 from public.property canonical where canonical.id = legacy.id
    )
      and not exists (
        select 1 from public.property canonical where canonical.slug = legacy.slug
      );
  end if;
exception
  when undefined_column then
    null;
end $$;

update public.property
set property_type = case
  when lower(trim(coalesce(property_type, 'resort'))) in ('liveaboard', 'liveaboards') then 'liveaboards'
  when lower(trim(coalesce(property_type, 'resort'))) in ('hotel', 'hotels') then 'hotels'
  else 'resort'
end;

update public.property
set property_type = 'liveaboards'
where lower(trim(name)) in ('maldives legend x', 'luxury liveaboard')
  and property_type <> 'liveaboards';

alter table public.property
  alter column property_type set default 'resort',
  alter column status set default 'draft',
  alter column is_featured_homepage set default false,
  drop constraint if exists resorts_status_check,
  drop constraint if exists property_status_check,
  drop constraint if exists resorts_property_type_check,
  drop constraint if exists property_property_type_check,
  add constraint property_status_check check (status in ('draft', 'published', 'archived')),
  add constraint property_property_type_check check (property_type in ('resort', 'hotels', 'liveaboards'));

do $$
declare
  constraint_record record;
begin
  if to_regclass('public.resorts') is not null then
    for constraint_record in
      select conrelid::regclass as table_name, conname
      from pg_constraint
      where confrelid = 'public.resorts'::regclass
        and conrelid in ('public.rooms'::regclass, 'public.resort_media'::regclass, 'public.resort_documents'::regclass)
    loop
      execute format('alter table %s drop constraint if exists %I', constraint_record.table_name, constraint_record.conname);
    end loop;
  end if;
end $$;

alter table public.rooms
  drop constraint if exists rooms_resort_id_fkey,
  add constraint rooms_resort_id_fkey
    foreign key (resort_id) references public.property(id) on delete cascade;

alter table public.resort_media
  drop constraint if exists resort_media_resort_id_fkey,
  add constraint resort_media_resort_id_fkey
    foreign key (resort_id) references public.property(id) on delete cascade;

alter table public.resort_documents
  drop constraint if exists resort_documents_resort_id_fkey,
  add constraint resort_documents_resort_id_fkey
    foreign key (resort_id) references public.property(id) on delete cascade;

do $$
begin
  if to_regclass('public.resorts') is not null then
    alter table public.resorts rename to resorts_legacy_before_property_final;
  end if;
exception
  when duplicate_table then
    drop table if exists public.resorts cascade;
end $$;

create or replace view public.resorts
with (security_invoker = true) as
select * from public.property;

create index if not exists property_property_type_idx on public.property(property_type);
create index if not exists property_type_status_updated_idx on public.property(property_type, status, updated_at desc);
create index if not exists property_slug_idx on public.property(slug);
create unique index if not exists property_slug_unique_idx on public.property(slug) where slug is not null;
