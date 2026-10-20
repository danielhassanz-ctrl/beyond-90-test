-- ============================================================
-- BEYOND 90 · TODO LO DE SUPABASE EN UN SOLO PASTE (18-oct-2026)
-- Pegar entero en Supabase > SQL Editor > Run. Es seguro repetirlo.
-- Requiere que ya estén aplicadas 20261012_harden_rls.sql y 20261016_storage_limits.sql (de antes).
-- ============================================================

-- ───── 1/3 · Cupo gratis y contadores de IA protegidos ─────
-- El cupo de fotos gratis (5 por carrera, primeros 100 jugadores) se decide en el servidor y lo escribe la service role.
-- Hasta ahora la política de 20261012 solo impedía pasar de «no» a otro valor: un jugador podía CREAR free_tier_eligible = 'yes'
-- desde su navegador antes de su primera foto y saltarse el tope. Ahora, desde una sesión de jugador, la bandera no se puede
-- crear ni cambiar (solo la service role: ver isEligibleForFreeTier en src/lib/images/credits.ts, que ya escribe con ella).
--
-- IMPORTANTE: aplicar DESPUÉS de desplegar la versión que escribe la bandera con la service role (ya desplegada junto a este fichero).
create or replace function public.protect_player_credits()
returns trigger
language plpgsql
as $fn$
declare
  old_paid int; new_paid int; old_free int; new_free int;
begin
  if not public.is_end_user() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.flags := coalesce(new.flags, '{}'::jsonb) - 'img_paid_credits' - 'img_free_used' - 'free_tier_eligible';
    return new;
  end if;

  new.flags := coalesce(new.flags, '{}'::jsonb);
  old_paid := coalesce(nullif(old.flags ->> 'img_paid_credits', '')::int, 0);
  new_paid := coalesce(nullif(new.flags ->> 'img_paid_credits', '')::int, 0);
  if new_paid > old_paid then
    if old.flags ? 'img_paid_credits' then
      new.flags := jsonb_set(new.flags, '{img_paid_credits}', to_jsonb(old_paid::text));
    else
      new.flags := new.flags - 'img_paid_credits';
    end if;
  end if;

  old_free := coalesce(nullif(old.flags ->> 'img_free_used', '')::int, 0);
  new_free := coalesce(nullif(new.flags ->> 'img_free_used', '')::int, 0);
  if new_free < old_free then
    new.flags := jsonb_set(new.flags, '{img_free_used}', to_jsonb(old_free::text));
  end if;

  -- (la elegibilidad del cupo gratis no la toca el jugador)
  -- La elegibilidad del cupo gratis no la toca el jugador: ni crearla ni cambiarla.
  if old.flags ? 'free_tier_eligible' then
    new.flags := jsonb_set(new.flags, '{free_tier_eligible}', to_jsonb(old.flags ->> 'free_tier_eligible'));
  else
    new.flags := new.flags - 'free_tier_eligible';
  end if;

  -- Los contadores del presupuesto de IA (ai_used, ai_used_sl) solo pueden SUBIR desde una sesión de jugador: poner ai_used = 0 desde el navegador
  -- reiniciaba el tope de coste por jugador y permitía forzar llamadas a Claude sin límite.
  declare
    k text;
    old_n int;
    new_n int;
  begin
    foreach k in array array['ai_used', 'ai_used_sl'] loop
      old_n := coalesce(nullif(old.flags ->> k, '')::int, 0);
      new_n := coalesce(nullif(new.flags ->> k, '')::int, 0);
      if new_n < old_n then
        new.flags := jsonb_set(new.flags, array[k], to_jsonb(old_n::text));
      end if;
    end loop;
  end;

  return new;
end;
$fn$;

-- ───── 2/3 · Fotos gratis por cuenta ─────
-- Las fotos gratis (5 por carrera, primeros 100 jugadores) eran por PERSONAJE: borrar y recrear daba otras 5. Ahora el gasto se apunta por CUENTA
-- y el personaje nuevo hereda lo ya gastado. Solo la service role lee y escribe esta tabla (RLS activada y sin políticas para usuarios).
create table if not exists public.account_photo_usage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  free_used int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.account_photo_usage enable row level security;
-- (sin políticas: ni leer ni escribir desde una sesión de jugador)

-- ───── 3/3 · Avisos push (dispositivos suscritos) ─────
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
