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
 * Todo vive en player.flags (mismo patrón que el resto del proyecto:
 * cesiones, mercado, arcos...), sin migración de esquema:
 * - img_free_used: cuántas de las gratis ya se han gastado (tope 10).
 * - img_paid_credits: cuántas compradas quedan sin usar todavía.
 */
export const FREE_IMAGES_PER_CAREER = 10;

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

/** true si a este jugador le queda alguna foto disponible, gratis o comprada. */
export function hasImageCredit(player: Pick<Player, "flags">): boolean {
  return getFreeImagesRemaining(player) > 0 || getPaidCredits(player) > 0;
}

/**
 * Se llama SOLO tras una generación que de verdad tuvo éxito — igual que
 * `logImageGeneration` en quota.ts, que también cuenta al final y no al
 * intentarlo, para no cobrarle a nadie una foto que falló por un error de
 * red o de Replicate. Consume primero las gratis, luego las compradas.
 */
export async function consumeImageCredit(
  supabase: SupabaseClient,
  player: Pick<Player, "id" | "flags">,
): Promise<void> {
  const freeUsed = getFreeImagesUsed(player);
  const paid = getPaidCredits(player);
  const flags = { ...(player.flags ?? {}) };

  if (freeUsed < FREE_IMAGES_PER_CAREER) {
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
