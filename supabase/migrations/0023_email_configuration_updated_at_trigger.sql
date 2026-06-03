-- Ensure email configuration audit timestamps are maintained even if the
-- original email migration was interrupted before trigger creation.

create or replace function public.set_email_configurations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.email_configurations') is not null then
    drop trigger if exists email_configurations_updated_at on public.email_configurations;
    create trigger email_configurations_updated_at
    before update on public.email_configurations
    for each row execute function public.set_email_configurations_updated_at();
  end if;
end $$;
