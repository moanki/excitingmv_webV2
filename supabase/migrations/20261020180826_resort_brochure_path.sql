-- A single current brochure per resort; files stay in resort-brochures/resorts/<id>/brochures/.
alter table public.property add column if not exists brochure_path text;
