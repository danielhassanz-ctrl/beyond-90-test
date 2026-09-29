import type { SupabaseClient } from "@supabase/supabase-js";
import { generatePlayerImage } from "@/lib/images/replicate";

/**
 * Con el pipeline anterior (Flux Kontext Pro + face-swap encadenados),
 * reutilizar una escena ya generada para un mismo hito+club vía un
 * face-swap barato (~0,006€) tenía sentido: era MUCHO más barato que
 * repetir la generación completa (~0,045€).
 *
 * Con Nano Banana Pro (ver replicate.ts) esa diferencia de precio ya no
 * existe: cada llamada cuesta lo mismo (~0,14€) haga lo que haga, así que
 * "reutilizar una plantilla" no ahorra nada — solo añadía complejidad y
 * un paso extra que podía fallar. Esta función ahora es un envoltorio
 * fino que simplemente genera la imagen directamente; se mantiene la
 * misma firma para no tocar los sitios que la llaman (actions.ts).
 */
export interface TemplateGenerationResult {
  buffer: Buffer;
  isFreshGeneration: boolean;
}

export async function generateFromTemplate(
  _supabase: SupabaseClient,
  _templateKey: string,
  playerPhotoUrl: string,
  fallbackPrompt: string,
): Promise<TemplateGenerationResult | null> {
  const buffer = await generatePlayerImage(playerPhotoUrl, fallbackPrompt);
  if (!buffer) return null;
  return { buffer, isFreshGeneration: false };
}

/**
 * Ya no se guarda ninguna plantilla (ver arriba) — se deja como no-op en
 * vez de borrar la función para no tener que tocar actions.ts, que sigue
 * llamándola tras cada generación fresca.
 */
export async function saveAsTemplateIfMissing(
  _supabase: SupabaseClient,
  _templateKey: string,
  _imageUrl: string,
): Promise<void> {
  return;
}
