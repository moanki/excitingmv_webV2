-- Role-policy helpers only inspect the caller's own roles. They are required by
-- authenticated RLS policies but do not need an anonymous RPC interface.
alter function public.has_role(text) set search_path = '';
alter function public.is_admin() set search_path = '';
alter function public.set_email_configurations_updated_at() set search_path = '';
revoke execute on function public.has_role(text), public.is_admin() from public, anon;
grant execute on function public.has_role(text), public.is_admin() to authenticated, service_role;

-- Sessions are accessible exclusively through the validated server-side client.
create policy partner_sessions_server_only on public.partner_resource_sessions
as restrictive for all to anon, authenticated using (false) with check (false);
