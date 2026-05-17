create extension if not exists "pgcrypto";

alter table public.chat_conversations
  add column if not exists access_token text,
  add column if not exists last_message text,
  add column if not exists last_message_at timestamptz,
  add column if not exists unread_admin_count integer not null default 0,
  add column if not exists unread_guest_count integer not null default 0,
  add column if not exists attachment_requested boolean not null default false,
  add column if not exists last_read_by_admin_at timestamptz,
  add column if not exists last_read_by_guest_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by text;

alter table public.chat_messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text,
  add column if not exists attachment_size integer,
  add column if not exists read_by_admin_at timestamptz,
  add column if not exists read_by_guest_at timestamptz;

update public.chat_conversations
set access_token = encode(gen_random_bytes(32), 'hex')
where access_token is null or trim(access_token) = '';

update public.chat_conversations
set status = case
  when status = 'resolved' then 'closed'
  when status in ('open', 'waiting_admin', 'waiting_guest', 'closed') then status
  else 'open'
end;

update public.chat_conversations conversation
set
  last_message = latest.body,
  last_message_at = latest.created_at
from (
  select distinct on (conversation_id)
    conversation_id,
    body,
    created_at
  from public.chat_messages
  order by conversation_id, created_at desc
) latest
where conversation.id = latest.conversation_id
  and (conversation.last_message is null or conversation.last_message_at is null);

update public.chat_conversations
set
  unread_admin_count = coalesce(unread_admin_count, 0),
  unread_guest_count = coalesce(unread_guest_count, 0),
  attachment_requested = coalesce(attachment_requested, false),
  last_message_at = coalesce(last_message_at, updated_at, created_at),
  last_message = coalesce(last_message, ''),
  closed_at = case when status = 'closed' then coalesce(closed_at, updated_at, now()) else closed_at end,
  closed_by = case when status = 'closed' then coalesce(closed_by, 'system') else closed_by end;

alter table public.chat_conversations
  alter column access_token set not null,
  alter column unread_admin_count set default 0,
  alter column unread_guest_count set default 0,
  alter column attachment_requested set default false,
  drop constraint if exists chat_conversations_status_check,
  drop constraint if exists chat_conversations_closed_by_check,
  add constraint chat_conversations_status_check
    check (status in ('open', 'waiting_admin', 'waiting_guest', 'closed')),
  add constraint chat_conversations_closed_by_check
    check (closed_by is null or closed_by in ('admin', 'guest', 'system'));

alter table public.chat_messages
  drop constraint if exists chat_messages_sender_type_check,
  add constraint chat_messages_sender_type_check
    check (sender_type in ('guest', 'admin', 'system'));

create index if not exists chat_conversations_status_idx on public.chat_conversations(status);
create index if not exists chat_conversations_updated_at_idx on public.chat_conversations(updated_at desc);
create index if not exists chat_conversations_last_message_at_idx on public.chat_conversations(last_message_at desc);
create index if not exists chat_conversations_email_idx on public.chat_conversations(email);
create index if not exists chat_conversations_unread_admin_count_idx
  on public.chat_conversations(unread_admin_count)
  where unread_admin_count > 0;

create index if not exists chat_messages_conversation_id_idx on public.chat_messages(conversation_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at);
create index if not exists chat_messages_sender_type_idx on public.chat_messages(sender_type);
create index if not exists chat_messages_conversation_created_idx on public.chat_messages(conversation_id, created_at);
