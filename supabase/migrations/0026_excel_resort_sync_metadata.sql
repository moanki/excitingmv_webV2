-- Additive metadata for authoritative Excel resort synchronization.
-- Existing property, rooms, resort_media, and storage schemas are unchanged.

create table if not exists public.excel_resort_sync_mappings (
  id uuid primary key default gen_random_uuid(),
  source_identifier text not null,
  source_filename text,
  property_type text not null default 'resort',
  resort_id uuid,
  confidence text not null check (confidence in ('exact', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_identifier, property_type)
);

create index if not exists excel_resort_sync_mappings_resort_id_idx
  on public.excel_resort_sync_mappings (resort_id);

create index if not exists import_batches_source_type_created_at_idx
  on public.import_batches (source_type, created_at desc);

create index if not exists resort_staging_review_status_idx
  on public.resort_staging (review_status);

alter table public.excel_resort_sync_mappings enable row level security;

drop policy if exists excel_resort_sync_mappings_admin_access on public.excel_resort_sync_mappings;
create policy excel_resort_sync_mappings_admin_access
  on public.excel_resort_sync_mappings
  for all
  using (public.is_admin())
  with check (public.is_admin());
