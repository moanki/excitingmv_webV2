update public.resorts
set property_type = 'liveaboard'
where (
    lower(trim(name)) = 'maldives legend x'
    or lower(trim(slug)) = 'maldives-legend-x'
  )
  and property_type <> 'liveaboard';
