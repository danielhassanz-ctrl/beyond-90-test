-- ============================================================
-- 1) REGISTRO DE ERRORES — para dejar de depender de tirar de logs
--    de Vercel a mano cuando algo falla en segundo plano. Cualquier
--    sesión autenticada puede escribir (igual que ya hace el resto
--    del pipeline de imágenes con sus propias tablas); solo el
--    dueño del proyecto puede leer.
-- ============================================================
create table if not exists app_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  context text not null,
  message text not null,
  detail jsonb,
  user_id uuid references auth.users(id) on delete set null,
  player_id uuid references players(id) on delete set null
);

create index if not exists idx_app_errors_created_at on app_errors (created_at desc);

alter table app_errors enable row level security;

create policy "Authenticated users can log errors"
  on app_errors for insert
  to authenticated
  with check (true);

create policy "Owner can read errors"
  on app_errors for select
  to authenticated
  using ((auth.jwt() ->> 'email') in ('danihs_@hotmail.com', 'danielhassanz@gmail.com'));

-- ============================================================
-- 2) RACHA DE DÍAS JUGADOS — gancho de vuelta diaria.
-- ============================================================
alter table players
  add column if not exists last_active_at timestamptz,
  add column if not exists streak_days integer not null default 0;

-- ============================================================
-- 3) TARJETA PÚBLICA PARA COMPARAR CARRERAS — tabla aparte con
--    SOLO los campos pensados para enseñarse, nunca la fila entera
--    de `players` (que sigue siendo privada). El propio jugador
--    decide qué hay aquí cada vez que comparte su enlace.
-- ============================================================
create table if not exists public_career_cards (
  share_code text primary key,
  player_id uuid not null references players(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  club text not null,
  nation text,
  media integer not null,
  age integer not null,
  stats_matches_played integer not null default 0,
  stats_goals integer not null default 0,
  stats_assists integer not null default 0,
  stats_titles integer not null default 0,
  photo_url text,
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_public_career_cards_player on public_career_cards (player_id);

alter table public_career_cards enable row level security;

create policy "Anyone can view public career cards"
  on public_career_cards for select
  to anon, authenticated
  using (true);

create policy "Users can create their own public career card"
  on public_career_cards for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own public career card"
  on public_career_cards for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
