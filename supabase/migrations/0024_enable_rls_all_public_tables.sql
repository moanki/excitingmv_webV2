-- Resolve Supabase Security Advisor warning: rls_disabled_in_public.
-- Enable RLS on every table currently exposed through the public schema.
-- Existing policies are preserved. Tables without policies become private to
-- privileged server-side roles until an explicit least-privilege policy is added.

do $$
declare
  public_table record;
begin
  for public_table in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format(
      'alter table public.%I enable row level security',
      public_table.table_name
    );
  end loop;
end
$$;

-- Fail the migration if any public table remains without RLS.
do $$
declare
  unprotected_tables text;
begin
  select string_agg(format('public.%I', c.relname), ', ' order by c.relname)
  into unprotected_tables
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and not c.relrowsecurity;

  if unprotected_tables is not null then
    raise exception 'RLS remains disabled on: %', unprotected_tables;
  end if;
end
$$;
