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
