update public.resorts
set property_type = 'liveaboard'
where lower(name) = 'maldives legend x'
  and property_type <> 'liveaboard';
