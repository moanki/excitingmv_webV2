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
