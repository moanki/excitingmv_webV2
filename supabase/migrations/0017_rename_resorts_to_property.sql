do $$
begin
  if to_regclass('public.property') is null and to_regclass('public.resorts') is not null then
    alter table public.resorts rename to property;
  end if;
end $$;

alter table public.property
  add column if not exists slug text,
  add column if not exists property_type text not null default 'resort';

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
end $$;

alter table public.property
  drop constraint if exists resorts_property_type_check,
  drop constraint if exists property_property_type_check;

update public.property
set property_type = case
  when lower(trim(property_type)) in ('liveaboard', 'liveaboards') then 'liveaboards'
  when lower(trim(property_type)) in ('hotel', 'hotels') then 'hotels'
  else 'resort'
end;

update public.property
set property_type = 'liveaboards'
where lower(trim(name)) in ('maldives legend x', 'luxury liveaboard')
  and property_type <> 'liveaboards';

alter table public.property
  alter column property_type set default 'resort',
  add constraint property_property_type_check
    check (property_type in ('resort', 'hotels', 'liveaboards'));

create index if not exists property_property_type_idx
  on public.property(property_type);

create unique index if not exists property_slug_unique_idx
  on public.property(slug)
  where slug is not null;

create or replace view public.resorts
with (security_invoker = true) as
select * from public.property;
