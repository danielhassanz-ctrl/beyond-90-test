import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";

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

/** Cuántas fotos concede cada pack comprado y su precio, en céntimos de euro. */
export const CREDIT_PACK = {
  images: 10,
  priceCents: 200,
  currency: "eur",
  label: "10 fotos más",
};

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
    const { count, error } = await supabase.from("players").select("id", { count: "exact", head: true });
    if (error) {
      console.error("[isEligibleForFreeTier] recuento falló, se deja pasar como elegible:", error.message);
    } else {
      eligible = (count ?? 0) <= FREE_TIER_PLAYER_LIMIT;
    }
  } catch (err) {
    console.error("[isEligibleForFreeTier] threw, se deja pasar como elegible:", err instanceof Error ? err.message : err);
  }

  try {
    await supabase
      .from("players")
      .update({ flags: { ...(player.flags ?? {}), free_tier_eligible: eligible ? "yes" : "no" } })
      .eq("id", player.id);
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
 * Se llama SOLO tras una generación que de verdad tuvo éxito — igual que
 * `logImageGeneration` en quota.ts, que también cuenta al final y no al
 * intentarlo, para no cobrarle a nadie una foto que falló por un error de
 * red o de Replicate. Consume primero las gratis (si el jugador tiene
 * derecho a ellas), luego las compradas. Al dueño no se le resta nada.
 */
export async function consumeImageCredit(
  supabase: SupabaseClient,
  player: Pick<Player, "id" | "flags">,
  userEmail: string | null | undefined,
): Promise<void> {
  if (isOwnerEmail(userEmail)) return;

  const freeUsed = getFreeImagesUsed(player);
  const paid = getPaidCredits(player);
  const eligible = await isEligibleForFreeTier(supabase, player, userEmail);
  const flags = { ...(player.flags ?? {}) };

  if (eligible && freeUsed < FREE_IMAGES_PER_CAREER) {
    flags.img_free_used = String(freeUsed + 1);
  } else if (paid > 0) {
    flags.img_paid_credits = String(paid - 1);
  }
  // Si no quedaba ni gratis ni comprado, no debería haberse llegado aquí
  // (hasImageCredit se comprueba antes) — no restamos nada por debajo de 0.

  try {
    await supabase.from("players").update({ flags }).eq("id", player.id);
  } catch (err) {
    console.error("[consumeImageCredit] failed to persist credit usage:", err instanceof Error ? err.message : err);
  }
  // Reflejar el cambio también en el objeto en memoria, por si el mismo
  // `player` se sigue usando después en la misma petición.
  player.flags = flags;
}
