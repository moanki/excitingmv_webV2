alter table public.property
  add column if not exists villa_type_count integer
  check (villa_type_count >= 0);

comment on column public.property.villa_type_count is
  'Optional Villas fact count. Null uses the number of saved room types; does not change room records.';
