alter table public.agents add column if not exists resource_password_hash text;
alter table public.agents add column if not exists resource_access_version bigint not null default 0;
update public.agents set resource_password_hash = substring(notes from '(?m)^\[resource_password_hash\]:([^\r\n]+)')
where resource_password_hash is null and notes like '%[resource_password_hash]:%';
update public.agents set notes = trim(regexp_replace(notes, '(?m)^\[resource_password_hash\]:[^\r\n]*[\r\n]*', '', 'g'))
where notes like '%[resource_password_hash]:%';
create table public.partner_resource_sessions (
 token_hash text primary key, agent_id uuid not null references public.agents(id) on delete cascade,
 access_version bigint not null, expires_at timestamptz not null
);
create index partner_resource_sessions_expiry on public.partner_resource_sessions(expires_at);
alter table public.partner_resource_sessions enable row level security;
revoke all on public.partner_resource_sessions from anon, authenticated;
grant all on public.partner_resource_sessions to service_role;
create or replace function public.bump_resource_access_version() returns trigger
language plpgsql set search_path = '' as $$
begin
 if new.status is distinct from old.status or new.resource_password_hash is distinct from old.resource_password_hash then
  new.resource_access_version := old.resource_access_version+1;
 end if;
 return new;
end $$;
revoke all on function public.bump_resource_access_version() from public;
create trigger agents_resource_access_version before update on public.agents
for each row execute function public.bump_resource_access_version();
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.request_limits (key_hash text primary key,count integer not null,reset_at timestamptz not null);
create index request_limits_expiry on private.request_limits(reset_at);
alter table private.request_limits enable row level security;
create or replace function public.check_request_limit(p_key text,p_limit integer,p_window_ms integer)
returns table(allowed boolean,remaining integer,reset_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_count integer; v_reset timestamptz; v_now timestamptz := clock_timestamp();
begin
 if p_limit < 1 or p_limit > 1000 or p_window_ms < 1000 or p_window_ms > 86400000 or length(p_key) <> 64 then
  raise exception 'Invalid rate limit configuration';
 end if;
 delete from private.request_limits l where l.reset_at <= v_now;
 insert into private.request_limits as l values(p_key,1,v_now+p_window_ms*interval '1 millisecond')
 on conflict(key_hash) do update set count=least(l.count+1,p_limit+1)
 returning l.count,l.reset_at into v_count,v_reset;
 return query select v_count<=p_limit,greatest(p_limit-v_count,0),v_reset;
end $$;
revoke all on function public.check_request_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.check_request_limit(text,integer,integer) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('partner-resources','partner-resources',false,52428800,
array['application/pdf','image/png','image/jpeg','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','text/csv'])
on conflict(id) do update set public=false;
drop policy if exists "Admins can manage email configuration" on public.email_configurations;
create policy "Admins can manage email configuration" on public.email_configurations for all to authenticated
using (public.has_role('super_admin') or public.has_role('admin'))
with check (public.has_role('super_admin') or public.has_role('admin'));
