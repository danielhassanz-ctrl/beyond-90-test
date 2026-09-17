-- Segunda forma de generar imágenes, más robusta que esperar dentro del
-- propio servidor (ver comentario largo en src/lib/images/webhook.ts):
-- Replicate avisa por webhook cuando termina, en vez de que el servidor
-- tenga que quedarse "despierto" sondeando 2-3 minutos. Esta tabla guarda
-- qué hacer con cada predicción en curso cuando llegue ese aviso.
create table if not exists pending_image_generations (
  id uuid primary key default gen_random_uuid(),
  prediction_id text not null unique,
  milestone_id uuid not null references milestones(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_gol_chilena boolean not null default false,
  club text,
  player_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pending_image_generations_prediction_id
  on pending_image_generations (prediction_id);

alter table pending_image_generations enable row level security;

-- El webhook lo llama Replicate directamente (sin sesión de usuario), así
-- que las operaciones normales las hace el propio server action con el
-- cliente autenticado del jugador (insert), y el endpoint de webhook usa
-- la service role para leer/borrar sin depender de una sesión.
create policy "Users can create their own pending generations"
  on pending_image_generations for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read their own pending generations"
  on pending_image_generations for select
  to authenticated
  using (auth.uid() = user_id);
