-- Notificaciones push: una fila por dispositivo suscrito. Cada usuario solo ve y borra las suyas;
-- el envío lo hace el servidor con la service role (ver src/app/api/cron/recordatorios/route.ts).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_select_own" on public.push_subscriptions;
create policy "push_select_own" on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "push_delete_own" on public.push_subscriptions;
create policy "push_delete_own" on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

-- Sin política de INSERT/UPDATE para usuarios: las altas pasan por la server action con la service role,
-- que fija user_id con el usuario de la sesión (evita suscribir dispositivos a nombre de otra persona).
