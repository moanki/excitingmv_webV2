-- Security hardening: enable RLS broadly and keep public reads limited to published content.
-- This migration is additive and does not delete policies, tables, columns, or data.

create or replace function public.has_role(role_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name in ('super_admin', 'admin', 'content_manager')
  );
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'agents',
    'roles',
    'permissions',
    'role_permissions',
    'user_roles',
    'property',
    'rooms',
    'resort_media',
    'resort_documents',
    'resources',
    'protected_resources',
    'newsletter_submissions',
    'chat_conversations',
    'chat_messages',
    'import_batches',
    'resort_staging',
    'media_staging',
    'audit_logs',
    'site_settings'
  ] loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = table_name
        and c.relkind in ('r', 'p')
    ) then
      execute format('alter table public.%I enable row level security', table_name);
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.property') is not null then
    drop policy if exists "Public can read published properties" on public.property;
    create policy "Public can read published properties"
      on public.property
      for select
      to anon, authenticated
      using (status = 'published');

    drop policy if exists "Admins can manage properties" on public.property;
    create policy "Admins can manage properties"
      on public.property
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if to_regclass('public.rooms') is not null and to_regclass('public.property') is not null then
    drop policy if exists "Public can read rooms for published properties" on public.rooms;
    create policy "Public can read rooms for published properties"
      on public.rooms
      for select
      to anon, authenticated
      using (
        exists (
          select 1 from public.property p
          where p.id = rooms.resort_id
            and p.status = 'published'
        )
      );

    drop policy if exists "Admins can manage rooms" on public.rooms;
    create policy "Admins can manage rooms"
      on public.rooms
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if to_regclass('public.resort_media') is not null and to_regclass('public.property') is not null then
    drop policy if exists "Public can read media for published properties" on public.resort_media;
    create policy "Public can read media for published properties"
      on public.resort_media
      for select
      to anon, authenticated
      using (
        exists (
          select 1 from public.property p
          where p.id = resort_media.resort_id
            and p.status = 'published'
        )
      );

    drop policy if exists "Admins can manage resort media" on public.resort_media;
    create policy "Admins can manage resort media"
      on public.resort_media
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if to_regclass('public.resort_documents') is not null then
    drop policy if exists "Admins can manage resort documents" on public.resort_documents;
    create policy "Admins can manage resort documents"
      on public.resort_documents
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$
begin
  if to_regclass('public.site_settings') is not null then
    drop policy if exists "Admins can manage site settings" on public.site_settings;
    create policy "Admins can manage site settings"
      on public.site_settings
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if to_regclass('public.roles') is not null then
    drop policy if exists "Admins can read roles" on public.roles;
    create policy "Admins can read roles"
      on public.roles
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if to_regclass('public.user_roles') is not null then
    drop policy if exists "Users can read own roles" on public.user_roles;
    create policy "Users can read own roles"
      on public.user_roles
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin());
  end if;
end $$;
