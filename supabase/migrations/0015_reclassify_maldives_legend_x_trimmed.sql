alter table public.resorts
  add column if not exists property_type text not null default 'resort';

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

create index if not exists resorts_property_type_idx on public.resorts(property_type);

update public.resorts
set property_type = 'liveaboard'
where lower(trim(name)) = 'maldives legend x'
  and property_type <> 'liveaboard';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'resorts'
      and column_name = 'slug'
  ) then
    execute $sql$
      update public.resorts
      set property_type = 'liveaboard'
      where lower(trim(slug)) = 'maldives-legend-x'
        and property_type <> 'liveaboard'
    $sql$;
  end if;
end $$;
