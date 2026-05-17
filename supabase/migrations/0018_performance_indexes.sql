do $$
begin
  if to_regclass('public.property') is not null then
    execute 'create index if not exists property_type_status_updated_idx on public.property (property_type, status, updated_at desc)';
    execute 'create index if not exists property_status_updated_idx on public.property (status, updated_at desc)';
    execute 'create index if not exists property_slug_idx on public.property (slug)';

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'property' and column_name = 'category'
    ) then
      execute 'create index if not exists property_category_idx on public.property (category)';
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'property' and column_name = 'is_featured_homepage'
    ) then
      execute 'create index if not exists property_featured_homepage_idx on public.property (is_featured_homepage)';
    end if;
  end if;

  if to_regclass('public.resorts') is not null then
    execute 'create index if not exists resorts_status_updated_idx on public.resorts (status, updated_at desc)';
    execute 'create index if not exists resorts_slug_idx on public.resorts (slug)';

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'resorts' and column_name = 'property_type'
    ) then
      execute 'create index if not exists resorts_type_status_updated_idx on public.resorts (property_type, status, updated_at desc)';
    end if;
  end if;

  if to_regclass('public.resort_media') is not null then
    execute 'create index if not exists resort_media_resort_sort_idx on public.resort_media (resort_id, sort_order)';
    execute 'create index if not exists resort_media_room_idx on public.resort_media (room_id)';
    execute 'create index if not exists resort_media_hero_idx on public.resort_media (resort_id, is_hero)';
  end if;

  if to_regclass('public.rooms') is not null then
    execute 'create index if not exists rooms_resort_sort_idx on public.rooms (resort_id, sort_order)';
  end if;

  if to_regclass('public.site_settings') is not null then
    execute 'create index if not exists site_settings_key_mode_idx on public.site_settings (key, mode)';
  end if;
end $$;
