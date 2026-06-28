do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'property'
      and c.relkind in ('r', 'p')
  ) then
    alter table public.property
      add column if not exists is_featured_homepage boolean not null default false;

    create index if not exists property_featured_homepage_idx
      on public.property (is_featured_homepage)
      where is_featured_homepage = true;
  elsif exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'resorts'
      and c.relkind in ('r', 'p')
  ) then
    alter table public.resorts
      add column if not exists is_featured_homepage boolean not null default false;

    create index if not exists resorts_featured_homepage_idx
      on public.resorts (is_featured_homepage)
      where is_featured_homepage = true;
  else
    raise exception 'Neither public.property nor public.resorts is available';
  end if;
end $$;

notify pgrst, 'reload schema';
