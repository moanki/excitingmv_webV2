-- Ensure the email configuration RLS policy has the helper functions it needs.
-- This is safe to run after 0021_email_configuration on databases that did not
-- receive 0020_security_hardening_rls.

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
begin
  if to_regclass('public.email_configurations') is not null then
    drop policy if exists "Admins can manage email configuration" on public.email_configurations;
    create policy "Admins can manage email configuration"
      on public.email_configurations
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;
