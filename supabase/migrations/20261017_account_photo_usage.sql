-- Las fotos gratis (5 por carrera, primeros 100 jugadores) eran por PERSONAJE: borrar y recrear daba otras 5. Ahora el gasto se apunta por CUENTA
-- y el personaje nuevo hereda lo ya gastado. Solo la service role lee y escribe esta tabla (RLS activada y sin políticas para usuarios).
create table if not exists public.account_photo_usage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  free_used int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.account_photo_usage enable row level security;
-- (sin políticas: ni leer ni escribir desde una sesión de jugador)
