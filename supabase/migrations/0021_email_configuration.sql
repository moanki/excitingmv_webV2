create table if not exists public.email_configurations (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default false,
  provider text not null default 'google_workspace',
  smtp_host text,
  smtp_port integer,
  smtp_secure boolean not null default false,
  smtp_require_tls boolean not null default true,
  smtp_username text,
  smtp_password_encrypted text,
  smtp_password_iv text,
  smtp_password_auth_tag text,
  from_name text,
  from_email text,
  reply_to_email text,
  general_recipients text,
  contact_recipients text,
  enquiry_recipients text,
  newsletter_recipients text,
  cc_recipients text,
  bcc_recipients text,
  last_test_status text,
  last_test_message text,
  last_tested_at timestamptz,
  last_successful_test_at timestamptz,
  last_successful_email_at timestamptz,
  last_error_summary text,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_configurations_provider_check check (provider in ('google_workspace', 'microsoft_365', 'custom_smtp')),
  constraint email_configurations_singleton check (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

alter table public.email_configurations enable row level security;

drop policy if exists "Admins can manage email configuration" on public.email_configurations;
create policy "Admins can manage email configuration"
  on public.email_configurations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.set_email_configurations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists email_configurations_updated_at on public.email_configurations;
create trigger email_configurations_updated_at
before update on public.email_configurations
for each row execute function public.set_email_configurations_updated_at();
