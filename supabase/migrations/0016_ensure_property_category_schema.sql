alter table public.resorts
  add column if not exists slug text,
  add column if not exists property_type text not null default 'resort';

with slug_source as (
  select
    id,
    coalesce(
      nullif(
        regexp_replace(
          regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'),
          '(^-+|-+$)',
          '',
          'g'
        ),
        ''
      ),
      'property'
    ) as base_slug
  from public.resorts
  where slug is null or trim(slug) = ''
),
deduped as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by id) as slug_position
  from slug_source
)
update public.resorts as resorts
set slug = case
  when deduped.slug_position = 1 then deduped.base_slug
  else deduped.base_slug || '-' || deduped.slug_position::text
end
from deduped
where resorts.id = deduped.id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'resorts_property_type_check'
      and conrelid = 'public.resorts'::regclass
  ) then
    alter table public.resorts
      add constraint resorts_property_type_check
      check (property_type in ('resort', 'liveaboard', 'hotel'));
  end if;
end $$;

create index if not exists resorts_property_type_idx
  on public.resorts(property_type);

create unique index if not exists resorts_slug_unique_idx
  on public.resorts(slug)
  where slug is not null;

update public.resorts
set property_type = 'liveaboard'
where lower(trim(name)) in ('maldives legend x', 'luxury liveaboard')
  and property_type <> 'liveaboard';
