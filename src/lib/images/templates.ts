import type { SupabaseClient } from "@supabase/supabase-js";
import { generatePlayerImage } from "@/lib/images/replicate";
import { swapFaceIntoTemplate } from "@/lib/images/faceswap";

/**
 * Genera la imagen final de un evento reutilizando plantillas: la primera
 * vez que un templateKey (p.ej. "primera-firma:Real Madrid") ocurre, se
 * genera la escena completa con Flux Kontext Pro a partir de la foto de
 * ESE jugador (lento, ~0,045€) y se guarda como plantilla para siempre.
 * Cualquier jugador siguiente que viva ese mismo evento con ese mismo
 * club solo paga un face-swap barato y rápido (~0,006€) sobre esa
 * plantilla ya existente, en vez de repetir la generación completa.
 *
 * No hay "coste perdido" por ser el primero: la plantilla resultante
 * tiene la cara de ESE jugador, pero el face-swap la sustituye limpio en
 * cada uso posterior — la propia plantilla es simplemente el punto de
 * partida, no algo que se vea nunca "genérico" ni sin cara.
 */
export interface TemplateGenerationResult {
  buffer: Buffer;
  /** true si tocó generar la escena de cero — el caller debe guardarla como plantilla tras subirla. */
  isFreshGeneration: boolean;
}

export async function generateFromTemplate(
  supabase: SupabaseClient,
  templateKey: string,
  playerPhotoUrl: string,
  fallbackPrompt: string,
): Promise<TemplateGenerationResult | null> {
  // La consulta de la plantilla no tenía try/catch (mismo hueco encontrado
  // y arreglado en upload.ts/quota.ts) — un fallo de red aquí abortaba el
  // hito entero antes incluso de intentar la generación completa de
  // respaldo, que es justo lo que este bloque intenta evitar más abajo.
  let existing: { image_url: string } | null = null;
  try {
    const { data, error: lookupError } = await supabase
      .from("image_templates")
      .select("image_url")
      .eq("template_key", templateKey)
      .maybeSingle();
    if (lookupError) {
      console.error(`[generateFromTemplate] template lookup failed for ${templateKey}:`, lookupError.message);
    }
    existing = data;
  } catch (err) {
    console.error(`[generateFromTemplate] template lookup threw for ${templateKey}:`, err instanceof Error ? err.message : err);
  }

  if (existing?.image_url) {
    const swapped = await swapFaceIntoTemplate(existing.image_url, playerPhotoUrl);
    if (swapped) return { buffer: swapped, isFreshGeneration: false };
    // Si el face-swap falla puntualmente (p.ej. Replicate caído), no
    // renunciamos a la imagen: caemos a generar la escena completa igual
    // que si no hubiera plantilla.
    console.warn(`[generateFromTemplate] face-swap failed for ${templateKey}, falling back to full generation`);
  }

  const buffer = await generatePlayerImage(playerPhotoUrl, fallbackPrompt);
  if (!buffer) return null;

  return { buffer, isFreshGeneration: true };
}

/**
 * Guarda el resultado de una generación completa como plantilla nueva,
 * para que la próxima vez que ocurra ese mismo templateKey sea un
 * face-swap barato en vez de otra generación completa. Se llama solo
 * cuando `generateFromTemplate` tuvo que generar de cero (no cuando ya
 * reutilizó una plantilla existente vía face-swap).
 */
export async function saveAsTemplateIfMissing(
  supabase: SupabaseClient,
  templateKey: string,
  imageUrl: string,
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from("image_templates")
      .select("id")
      .eq("template_key", templateKey)
      .maybeSingle();

    if (existing) return; // otro jugador ya la creó mientras tanto, no duplicar

    const { error } = await supabase.from("image_templates").insert({ template_key: templateKey, image_url: imageUrl });
    if (error) {
      console.error(`[saveAsTemplateIfMissing] failed to save template ${templateKey}:`, error.message);
    }
  } catch (err) {
    console.error(`[saveAsTemplateIfMissing] threw for ${templateKey}:`, err instanceof Error ? err.message : err);
  }
}
