-- ============================================================
-- ENDURECIMIENTO DE SEGURIDAD (auditoría del 12-oct-2026)
--
-- Hay que aplicarla a mano en el SQL Editor de Supabase (como la política de
-- UPDATE de milestones). Es idempotente: se puede ejecutar más de una vez.
-- ANTES de ejecutarla, correr supabase/audit-rls.sql y comprobar que
-- players.flags es de tipo jsonb (si no, el bloque 1 avisa y no hace nada).
-- ============================================================

-- ------------------------------------------------------------
-- 0) Helper: ¿la petición viene de un jugador (o anónimo) y no de la service role / SQL Editor?
-- ------------------------------------------------------------
create or replace function public.is_end_user()
returns boolean
language sql
stable
as $$
  -- Sin sesión (SQL Editor, tareas internas) el rol es nulo: eso NO es un jugador, así que el resultado es false y no
  -- se restringe nada. Solo se restringe a quien llega como 'authenticated' o 'anon' (el navegador del jugador).
  select coalesce(
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
      nullif(current_setting('request.jwt.claim.role', true), '')
    ) in ('authenticated', 'anon'),
    false
  );
$$;

-- ------------------------------------------------------------
-- 1) CRÉDITOS DE FOTOS: players.flags lo puede escribir el propio jugador desde el navegador (RLS no
--    distingue claves dentro del JSON), así que cualquiera podía ponerse img_paid_credits = 9999 y generar
--    fotos de pago gratis (cada una cuesta ~0,14 €). El trigger hace que un jugador solo pueda GASTAR
--    créditos (bajar img_paid_credits, subir img_free_used); aumentarlos solo lo hace la service role
--    (el webhook de Stripe) o el SQL Editor.
-- ------------------------------------------------------------
do $$
begin
  if (select data_type from information_schema.columns
        where table_schema = 'public' and table_name = 'players' and column_name = 'flags') is distinct from 'jsonb' then
    raise notice 'players.flags no es jsonb: el trigger de créditos NO se ha creado. Revisar el tipo de la columna.';
    return;
  end if;

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
      -- Un jugador nuevo nunca nace con créditos concedidos desde el cliente.
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

    -- Quien ya quedó fuera del cupo gratuito no puede volver a entrar.
    if old.flags ->> 'free_tier_eligible' = 'no' and coalesce(new.flags ->> 'free_tier_eligible', '') <> 'no' then
      new.flags := jsonb_set(new.flags, '{free_tier_eligible}', '"no"');
    end if;

    return new;
  end;
  $fn$;

  drop trigger if exists trg_protect_player_credits on public.players;
  create trigger trg_protect_player_credits
    before insert or update on public.players
    for each row execute function public.protect_player_credits();
end
$$;

-- ------------------------------------------------------------
-- 2) image_generation_log: cada jugador solo puede apuntar sus propias generaciones, pero sin tope podía
--    insertar miles de filas y agotar el techo de gasto GLOBAL de imágenes para todos. Máx. 60 al día por jugador.
-- ------------------------------------------------------------
drop policy if exists "Users can only log their own generation" on public.image_generation_log;
create policy "Users can only log their own generation"
  on public.image_generation_log for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (select count(*) from public.image_generation_log l
          where l.user_id = auth.uid() and l.created_at > now() - interval '1 day') < 60
  );

-- ------------------------------------------------------------
-- 3) app_errors: cualquiera podía escribir filas ilimitadas y de cualquier tamaño, a nombre de otro usuario.
-- ------------------------------------------------------------
-- (Las políticas se evalúan con RLS: como solo el dueño puede LEER app_errors, un count(*) dentro de la política
-- siempre daría 0. Por eso el conteo va en una función security definer.)
create or replace function public.recent_app_error_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.app_errors where created_at > now() - interval '1 minute';
$$;

drop policy if exists "Authenticated users can log errors" on public.app_errors;
create policy "Authenticated users can log errors"
  on public.app_errors for insert
  to authenticated
  with check (
    (user_id is null or user_id = auth.uid())
    and length(message) <= 2000
    and (detail is null or pg_column_size(detail) <= 16000)
    and public.recent_app_error_count() < 200
  );

-- ------------------------------------------------------------
-- 4) image_templates: es una caché COMPARTIDA entre todos los jugadores. Cualquier autenticado podía insertar la
--    plantilla de una clave aún libre con la URL que quisiera (y se la serviría a los demás). Solo se admiten
--    imágenes del bucket de fotos de la propia app.
-- ------------------------------------------------------------
drop policy if exists "Authenticated users can create templates" on public.image_templates;
create policy "Authenticated users can create templates"
  on public.image_templates for insert
  to authenticated
  with check (image_url ~ '^https://[a-z0-9.-]+\.supabase\.co/storage/v1/object/public/player-photos/');

-- ------------------------------------------------------------
-- 5) public_career_cards: es pública por diseño; se acota lo que un jugador puede publicar (texto corto,
--    foto solo por https, cifras no negativas). NOT VALID: no revisa filas antiguas, solo las nuevas.
-- ------------------------------------------------------------
alter table public.public_career_cards drop constraint if exists public_career_cards_sane;
alter table public.public_career_cards
  add constraint public_career_cards_sane check (
    length(display_name) <= 60
    and length(club) <= 60
    and (nation is null or length(nation) <= 60)
    and (photo_url is null or photo_url ~ '^https://')
    and media between 0 and 100
    and age between 0 and 80
    and stats_matches_played >= 0 and stats_goals >= 0 and stats_assists >= 0 and stats_titles >= 0
  ) not valid;
