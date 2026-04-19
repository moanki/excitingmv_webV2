create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  unique (role_id, permission_id)
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  unique (user_id, role_id)
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  agency_name text not null,
  contact_name text not null,
  email text not null,
  market text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  notes text,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.resorts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  atoll text,
  category text,
  transfer_type text,
  description text,
  highlights jsonb not null default '[]'::jsonb,
  meal_plans jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  seo_summary text,
  meta_keywords text[],
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  name text not null,
  short_description text,
  size_label text,
  max_occupancy integer,
  bed_type text,
  features jsonb not null default '[]'::jsonb,
  seo_summary text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.resort_media_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.resort_media (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  category_id uuid references public.resort_media_categories(id) on delete set null,
  file_path text not null,
  alt_text text,
  is_hero boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.resort_documents (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  title text not null,
  file_path text not null,
  document_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_path text not null,
  resource_type text,
  audience_type text not null default 'all_partners' check (audience_type in ('all_partners', 'selected_partners')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.protected_resources (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (resource_id, agent_id)
);

create table if not exists public.newsletter_submissions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  status text default 'new',
  exported_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete set null,
  guest_name text,
  email text,
  subject text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  assigned_admin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_profile_id uuid references public.profiles(id) on delete set null,
  sender_type text not null check (sender_type in ('guest', 'partner', 'admin')),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_name text not null,
  source_type text not null,
  file_path text,
  status text not null default 'uploaded',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.resort_staging (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  raw_payload jsonb not null default '{}'::jsonb,
  extracted_payload jsonb not null default '{}'::jsonb,
  review_status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.media_staging (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  file_path text not null,
  category_guess text,
  review_status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.resorts enable row level security;
alter table public.resources enable row level security;
alter table public.newsletter_submissions enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.import_batches enable row level security;
alter table public.resort_staging enable row level security;
alter table public.media_staging enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_settings enable row level security;

create policy "published resorts are viewable publicly"
on public.resorts
for select
using (status = 'published');

create policy "published resources hidden from public by default"
on public.resources
for select
using (false);
