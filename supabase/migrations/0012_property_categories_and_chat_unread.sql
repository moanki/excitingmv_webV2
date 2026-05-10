alter table public.resorts
  add column if not exists property_type text not null default 'resort';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'resorts_property_type_check'
      and conrelid = 'public.resorts'::regclass
  ) then
    alter table public.resorts
      add constraint resorts_property_type_check
      check (property_type in ('resort', 'liveaboard', 'hotel'));
  end if;
end $$;

create index if not exists resorts_property_type_idx on public.resorts(property_type);

update public.resorts
set property_type = 'liveaboard'
where lower(name) = 'luxury liveaboard'
  and property_type = 'resort';

alter table public.chat_conversations
  add column if not exists unread_admin_count integer not null default 0,
  add column if not exists last_read_by_admin_at timestamptz;

create index if not exists chat_conversations_unread_admin_count_idx
  on public.chat_conversations(unread_admin_count)
  where unread_admin_count > 0;
