-- PDF-only public downloads, with no bucket-specific file size restriction.
-- Supabase's project-level and upload-method limits still apply.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resort-brochures', 'resort-brochures', true, null, array['application/pdf']::text[])
on conflict (id) do nothing;
