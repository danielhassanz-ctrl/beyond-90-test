-- Pipeline de imágenes asíncrono: la generación ya no bloquea el turno del
-- jugador. El hito se crea al instante con image_status='pending' cuando
-- toca imagen, se genera en segundo plano (Next.js after()), y cuando
-- termina pasa a 'ready' (o 'failed' si algo se tuerce) para que el aviso
-- en la app sepa cuándo mostrar "tu foto está lista".
alter table milestones
  add column if not exists image_status text not null default 'none'
    check (image_status in ('none', 'pending', 'ready', 'failed'));

alter table milestones
  add column if not exists notified boolean not null default false;

-- Caché de plantillas reutilizables: la primera vez que un evento
-- (fichaje, debut...) ocurre para un club dado, se genera una escena
-- completa una vez (más lento, más caro) y se guarda aquí. A partir de
-- ahí, cualquier otro jugador que viva ese mismo evento con ese mismo
-- club solo necesita un face-swap barato y rápido sobre esa plantilla,
-- en vez de generar la escena entera cada vez.
create table if not exists image_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table image_templates enable row level security;

-- Las plantillas no son datos de un usuario concreto (son la base
-- reutilizable de todos), así que cualquier autenticado puede leerlas y
-- escribir una nueva si no existe todavía.
create policy "Authenticated users can read templates"
  on image_templates for select
  to authenticated
  using (true);

create policy "Authenticated users can create templates"
  on image_templates for insert
  to authenticated
  with check (true);
