import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import { createServiceClient } from "@/lib/supabase/service";
import { patchFlagsFresh } from "@/lib/supabase/flags";

/**
 * Modelo freemium por carrera: las primeras FREE_IMAGES_PER_CAREER fotos
 * generadas por IA para un jugador son gratis; a partir de ahí hace falta
 * comprar un pack (ver checkout.ts / api/stripe/webhook). Esto es
 * INDEPENDIENTE del freno de gasto por mes de quota.ts (que sigue
 * existiendo como red de seguridad absoluta) — este sistema decide
 * cuándo pedirle dinero a un jugador concreto; quota.ts decide cuándo el
 * JUEGO ENTERO deja de gastar pase lo que pase.
 *
 * Además, solo los primeros FREE_TIER_PLAYER_LIMIT jugadores (sin contar
 * al dueño del proyecto) tienen derecho a las gratis — pasado ese número,
 * un jugador nuevo empieza directamente sin ninguna gratis, solo con la
 * opción de comprar. Pedido explícito tras simular el coste a escala: sin
 * este tope, regalar fotos a cientos de jugadores podía costar más de lo
 * que entra por los packs de pago.
 *
 * Todo vive en player.flags (mismo patrón que el resto del proyecto:
 * cesiones, mercado, arcos...), salvo el recuento de jugadores totales,
 * que necesita mirar la tabla entera.
 * - img_free_used: cuántas de las gratis ya se han gastado (tope 5).
 * - img_paid_credits: cuántas compradas quedan sin usar todavía.
 * - free_tier_eligible: "yes"/"no", cacheado la primera vez que se
 *   calcula para no repetir la consulta de recuento en cada foto.
 */
export const FREE_IMAGES_PER_CAREER = 5;

/** Cuántos jugadores (sin contar al dueño) tienen derecho a las fotos gratis. */
export const FREE_TIER_PLAYER_LIMIT = 100;

/**
 * El dueño del proyecto no cuenta para el tope de arriba ni consume su
 * propio cupo — necesita poder seguir jugando/probando sin límite. Se
 * identifica por email porque es lo único disponible sin la service role
 * key de Supabase (aparcada junto con Stripe): con esa clave se podría
 * hacer un recuento más preciso excluyendo sus jugadores exactos del
 * total; sin ella, el recuento de abajo cuenta TODOS los jugadores
 * (incluidos los de prueba del propio dueño) — un margen de error de
 * unas pocas carreras de prueba sobre 100 es aceptable, no crítico.
 */
const OWNER_EMAIL = (process.env.OWNER_EMAIL || "danielhassanz@gmail.com").toLowerCase();

/**
 * Cuántas fotos concede cada pack comprado y su precio, en céntimos de
 * euro. Subido de 2,00€ a 2,99€ al cambiar el motor de imágenes a Nano
 * Banana Pro (~0,14€/foto frente a ~0,05€ del pipeline anterior): a 2,00€
 * el margen se quedaba en ~0,32€ por pack (16%) tras la comisión de
 * Stripe; a 2,99€ sube a ~1,29€ (43%), sano de verdad. Pedido explícito
 * del usuario tras ver los números.
 */
export const CREDIT_PACK = {
  images: 10,
  priceCents: 299,
  currency: "eur",
  label: "10 fotos más",
};

/**
 * Las fotos gratis son de la CUENTA, no del personaje: borrar el jugador y crear otro daba otras 5. El gasto se apunta también en
 * account_photo_usage (tabla solo para la service role, ver supabase/migrations/20261017_account_photo_usage.sql) y el personaje
 * nuevo hereda lo ya gastado. Si la tabla aún no existe, no hace nada (el resto del sistema sigue como antes).
 */
async function recordAccountFreeUse(userId: string, used: number): Promise<void> {
  try {
    const service = createServiceClient();
    const { data } = await service.from("account_photo_usage").select("free_used").eq("user_id", userId).maybeSingle();
    const current = Number(data?.free_used ?? 0) || 0;
    if (used > current) await service.from("account_photo_usage").upsert({ user_id: userId, free_used: Math.min(FREE_IMAGES_PER_CAREER, used), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  } catch {
    // sin tabla o sin service role: se ignora
  }
}

/** Tras crear un personaje nuevo: hereda las gratis que la cuenta ya gastó con los anteriores. */
export async function carryAccountFreeUsage(userId: string, playerId: string): Promise<void> {
  try {
    const service = createServiceClient();
    const { data } = await service.from("account_photo_usage").select("free_used").eq("user_id", userId).maybeSingle();
    const used = Number(data?.free_used ?? 0) || 0;
    if (used <= 0) return;
    await patchFlagsFresh(service, playerId, (f) => {
      const now = parseInt(String(f.img_free_used ?? "0"), 10) || 0;
      if (used > now) f.img_free_used = String(used);
    });
  } catch {
    // sin tabla o sin service role: se ignora
  }
}

export function getFreeImagesUsed(player: Pick<Player, "flags">): number {
  return parseInt(String(player.flags?.img_free_used ?? "0"), 10) || 0;
}

export function getPaidCredits(player: Pick<Player, "flags">): number {
  return parseInt(String(player.flags?.img_paid_credits ?? "0"), 10) || 0;
}

export function getFreeImagesRemaining(player: Pick<Player, "flags">): number {
  return Math.max(0, FREE_IMAGES_PER_CAREER - getFreeImagesUsed(player));
}

/**
 * true si este email es el del dueño del proyecto (exento de todos los
 * límites de fotos, tanto el cupo gratis por carrera como el tope de los
 * primeros 100 jugadores).
 */
export function isOwnerEmail(email: string | null | undefined): boolean {
  return Boolean(email) && email!.toLowerCase() === OWNER_EMAIL;
}

/**
 * Decide si ESTE jugador entra dentro de los primeros 100 con derecho a
 * fotos gratis. Cachea el resultado en player.flags la primera vez (una
 * sola consulta de recuento por jugador en toda su carrera, no una por
 * foto). El dueño del proyecto siempre es elegible, sin consultar nada.
 */
export async function isEligibleForFreeTier(
  supabase: SupabaseClient,
  player: Pick<Player, "id" | "flags">,
  userEmail: string | null | undefined,
): Promise<boolean> {
  if (isOwnerEmail(userEmail)) return true;

  const cached = player.flags?.free_tier_eligible;
  if (cached === "yes") return true;
  if (cached === "no") return false;

  let eligible = true;
  try {
    // Con el cliente del jugador, RLS solo deja contar SU fila (count = 1 siempre): el tope nunca se aplicaba.
    // Con la service role el recuento es el real; sin ella se cae al cliente normal.
    let counter: SupabaseClient = supabase;
    try {
      counter = createServiceClient();
    } catch {
      // sin SUPABASE_SERVICE_ROLE_KEY (local): recuento con el cliente del jugador
    }
    const { count, error } = await counter.from("players").select("id", { count: "exact", head: true });
    if (error) {
      console.error("[isEligibleForFreeTier] recuento falló, se deja pasar como elegible:", error.message);
    } else {
      eligible = (count ?? 0) <= FREE_TIER_PLAYER_LIMIT;
    }
  } catch (err) {
    console.error("[isEligibleForFreeTier] threw, se deja pasar como elegible:", err instanceof Error ? err.message : err);
  }

  try {
    // Con la service role (la migración 20261017 impide que el jugador cree o cambie esta bandera desde su sesión); sin ella, con la del jugador.
    let writer: SupabaseClient = supabase;
    try {
      writer = createServiceClient();
    } catch {
      // sin SUPABASE_SERVICE_ROLE_KEY (local)
    }
    await patchFlagsFresh(writer, player.id, (f) => {
      f.free_tier_eligible = eligible ? "yes" : "no";
    });
  } catch (err) {
    console.error("[isEligibleForFreeTier] no se pudo cachear el resultado:", err instanceof Error ? err.message : err);
  }
  if (!player.flags) player.flags = {};
  player.flags.free_tier_eligible = eligible ? "yes" : "no";

  return eligible;
}

/** true si a este jugador le queda alguna foto disponible, gratis o comprada. */
export async function hasImageCredit(
  supabase: SupabaseClient,
  player: Pick<Player, "id" | "flags">,
  userEmail: string | null | undefined,
): Promise<boolean> {
  if (getPaidCredits(player) > 0) return true;
  const eligible = await isEligibleForFreeTier(supabase, player, userEmail);
  return eligible && getFreeImagesRemaining(player) > 0;
}

/**
 * RESERVA ATÓMICA DE UN CRÉDITO. Antes se comprobaba al empezar (hasImageCredit) y se descontaba al terminar (consumeImageCredit): con un crédito y
 * N peticiones a la vez (varios «Rehacer» en paralelo) todas pasaban la comprobación y salían N fotos por el precio de una. Ahora se descuenta ANTES de
 * generar, con una escritura condicional (solo si las dos cifras siguen como se leyeron: si otra petición se adelantó, se vuelve a leer y se reintenta) y
 * se devuelve si la generación falla (refundImageCredit). El dueño no gasta nada.
 */
export interface ImageReservation {
  kind: "owner" | "free" | "paid";
  playerId: string;
}

const asInt = (v: unknown) => parseInt(String(v ?? "0"), 10) || 0;

export async function reserveImageCredit(
  supabase: SupabaseClient,
  player: Pick<Player, "id" | "flags">,
  userEmail: string | null | undefined,
): Promise<ImageReservation | null> {
  if (isOwnerEmail(userEmail)) return { kind: "owner", playerId: player.id };
  const eligible = await isEligibleForFreeTier(supabase, player, userEmail);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data } = await supabase.from("players").select("flags").eq("id", player.id).maybeSingle();
    if (!data) return null;
    const flags = { ...((data.flags ?? {}) as Record<string, string | boolean>) };
    const free = asInt(flags.img_free_used);
    const paid = asInt(flags.img_paid_credits);
    const next = { ...flags };
    let kind: "free" | "paid";
    if (eligible && free < FREE_IMAGES_PER_CAREER) {
      next.img_free_used = String(free + 1);
      kind = "free";
    } else if (paid > 0) {
      next.img_paid_credits = String(paid - 1);
      kind = "paid";
    } else {
      return null;
    }
    let q = supabase.from("players").update({ flags: next }).eq("id", player.id);
    q = flags.img_free_used === undefined ? q.is("flags->>img_free_used", null) : q.eq("flags->>img_free_used", String(flags.img_free_used));
    q = flags.img_paid_credits === undefined ? q.is("flags->>img_paid_credits", null) : q.eq("flags->>img_paid_credits", String(flags.img_paid_credits));
    const { data: rows } = await q.select("id");
    if (rows && rows.length === 1) {
      if (kind === "free") {
        try {
          const { data: auth } = await supabase.auth.getUser();
          if (auth.user) await recordAccountFreeUse(auth.user.id, asInt(next.img_free_used));
        } catch {
          // no bloquea
        }
      }
      return { kind, playerId: player.id };
    }
  }
  return null;
}

/** Devuelve el crédito reservado cuando la generación no llegó a producir una foto. Con la service role (el trigger de la base de datos no deja devolver créditos desde la sesión del jugador). */
export async function refundImageCredit(supabase: SupabaseClient, reservation: ImageReservation | null | undefined): Promise<void> {
  if (!reservation || reservation.kind === "owner") return;
  let writer: SupabaseClient = supabase;
  try {
    writer = createServiceClient();
  } catch {
    // sin SUPABASE_SERVICE_ROLE_KEY (local)
  }
  await patchFlagsFresh(writer, reservation.playerId, (f) => {
    if (reservation.kind === "free") f.img_free_used = String(Math.max(0, asInt(f.img_free_used) - 1));
    else f.img_paid_credits = String(asInt(f.img_paid_credits) + 1);
  });
}
