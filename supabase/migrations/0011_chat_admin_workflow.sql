alter table if exists public.chat_conversations
add column if not exists attachment_requested boolean not null default false;

alter table if exists public.chat_messages
add column if not exists attachment_url text,
add column if not exists attachment_name text;
