create table if not exists image_generation_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_image_generation_log_created_at
  on image_generation_log (created_at);

create index if not exists idx_image_generation_log_user_created_at
  on image_generation_log (user_id, created_at);

alter table image_generation_log enable row level security;

-- El conteo GLOBAL (todas las filas, de todos los usuarios) es el que
-- protege el techo de gasto mensual del juego entero, así que cualquier
-- usuario autenticado tiene que poder contarlas todas -- la tabla solo
-- guarda un id de usuario y una fecha, nada sensible.
create policy "Authenticated users can read generation counts"
  on image_generation_log for select
  to authenticated
  using (true);

-- Pero solo puede insertar una fila a su propio nombre.
create policy "Users can only log their own generation"
  on image_generation_log for insert
  to authenticated
  with check (auth.uid() = user_id);
