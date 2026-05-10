update public.resorts
set property_type = 'liveaboard'
where lower(name) = 'luxury liveaboard'
  and property_type = 'resort';
