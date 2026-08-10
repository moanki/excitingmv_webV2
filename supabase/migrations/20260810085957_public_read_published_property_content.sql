alter table public.property enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'property'
      and policyname = 'public read published property'
  ) then
    create policy "public read published property"
      on public.property
      for select
      to anon, authenticated
      using (status = 'published');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rooms'
      and policyname = 'public read published property rooms'
  ) then
    create policy "public read published property rooms"
      on public.rooms
      for select
      to anon, authenticated
      using (
        exists (
          select 1
          from public.property
          where property.id = rooms.resort_id
            and property.status = 'published'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'resort_media'
      and policyname = 'public read published property media'
  ) then
    create policy "public read published property media"
      on public.resort_media
      for select
      to anon, authenticated
      using (
        exists (
          select 1
          from public.property
          where property.id = resort_media.resort_id
            and property.status = 'published'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'resort_documents'
      and policyname = 'public read published property documents'
  ) then
    create policy "public read published property documents"
      on public.resort_documents
      for select
      to anon, authenticated
      using (
        exists (
          select 1
          from public.property
          where property.id = resort_documents.resort_id
            and property.status = 'published'
        )
      );
  end if;
end $$;
