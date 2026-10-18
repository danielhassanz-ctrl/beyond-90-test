import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCouplePhoto, PAPARAZZI_RESTAURANT_SCENE } from "@/lib/images/replicate";
import { checkImageGenerationQuota, logImageGeneration } from "@/lib/images/quota";
import { hasImageCredit, reserveImageCredit, refundImageCredit } from "@/lib/images/credits";
import { getAppUrl } from "@/lib/constants";

/**
 * La foto de los dos (tú y ella) que va arriba en la tarjeta de un mensaje directo, como si la hubiera sacado un
 * paparazzi desde la calle. Cuesta una foto (la misma que cualquier otra): si no te queda ninguna, si no hay foto de
 * ella, o si la generación falla, devuelve null y la tarjeta se dibuja igual, sin foto arriba.
 */
export async function maybeDmScenePhoto(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
  player: { id: string; photo_url?: string | null; flags?: Record<string, string | boolean> | null },
  herAvatar: string | undefined,
): Promise<Buffer | null> {
  if (!herAvatar || !player.photo_url) return null;
  try {
    if (!(await hasImageCredit(supabase, player as never, user.email))) return null;
    const quota = await checkImageGenerationQuota(supabase, user.id);
    if (!quota.allowed) return null;
    // El crédito se reserva ANTES de generar (atómico) y se devuelve si no sale foto.
    const reservation = await reserveImageCredit(supabase, player as never, user.email);
    if (!reservation) return null;
    const herUrl = /^https?:\/\//.test(herAvatar) ? herAvatar : `${getAppUrl() ?? "https://beyond-90.vercel.app"}${herAvatar}`;
    let buffer: Buffer | null = null;
    try {
      buffer = await generateCouplePhoto(player.photo_url, herUrl, PAPARAZZI_RESTAURANT_SCENE);
    } catch (err) {
      await refundImageCredit(supabase, reservation);
      throw err;
    }
    if (!buffer) {
      await refundImageCredit(supabase, reservation);
      return null;
    }
    await logImageGeneration(supabase, user.id);
    return buffer;
  } catch (err) {
    console.error("[maybeDmScenePhoto] falló:", err instanceof Error ? err.message : err);
    return null;
  }
}
