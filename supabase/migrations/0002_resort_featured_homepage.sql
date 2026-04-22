alter table if exists public.resorts
add column if not exists is_featured_homepage boolean not null default false;

create index if not exists resorts_featured_homepage_idx
on public.resorts (is_featured_homepage)
where is_featured_homepage = true;
