SELECT setval(
  pg_get_serial_sequence('public.taches', 'idtaches'),
  COALESCE(MAX(idtaches), 1),
  true
)
FROM public.taches;