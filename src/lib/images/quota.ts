import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Frenos de gasto en generación de imágenes (Replicate cobra por llamada).
 * Dos capas independientes:
 * - Por usuario: generoso a propósito, solo frena el abuso (borrar jugador
 *   y volver a crear en bucle para generar gratis sin jugar de verdad).
 *   Una carrera real usa 25-30 imágenes (tras conectar el pool de
 *   famosos/virales, que añade hasta 13 hitos más de un solo uso cada
 *   uno); 40/mes cubre una carrera completa de sobra sin que nadie lo note.
 * - Global: techo absoluto de gasto mensual de todo el juego junto. Es la
 *   red de seguridad real: si el juego se viraliza, esto es lo único que
 *   impide una factura sin fin. Al llegar al techo, el juego sigue
 *   funcionando exactamente igual (el hito se crea igual), solo que la
 *   tarjeta cae al fallback ya existente (foto propia sin editar por IA)
 *   en vez de generar una nueva imagen.
 */
const PER_USER_MONTHLY_LIMIT = 40;

/** ~30€/mes a ~0,05€/imagen (precio real de Flux Kontext Pro en Replicate). */
const GLOBAL_MONTHLY_LIMIT = 600;

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export type QuotaCheck =
  | { allowed: true }
  | { allowed: false; reason: "user_limit" | "global_limit" };

/**
 * A diferencia del resto del pipeline de imágenes (que corre en segundo
 * plano dentro de after()), checkImageGenerationQuota se llama en el
 * camino PRINCIPAL de resolveEvent, antes de responder al jugador — un
 * fallo de red aquí sin capturar no solo perdería la imagen, rompería el
 * turno entero. Mismo hueco encontrado y arreglado en uploadGeneratedImage
 * (ver upload.ts): sin try/catch, un fallo de red (no un error normal de
 * Supabase) se escapaba sin control en vez de caer al "allowed: true" ya
 * pensado para cuando la tabla de tracking falla.
 */
export async function checkImageGenerationQuota(
  supabase: SupabaseClient,
  userId: string,
): Promise<QuotaCheck> {
  const since = startOfMonthISO();

  try {
    const [{ count: globalCount, error: globalError }, { count: userCount, error: userError }] =
      await Promise.all([
        supabase
          .from("image_generation_log")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
        supabase
          .from("image_generation_log")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since),
      ]);

    // Si la tabla de tracking falla (p.ej. no se ha creado todavía), no
    // bloqueamos la generación por eso — es un freno de gasto, no una
    // dependencia dura del juego.
    if (globalError || userError) {
      console.error(
        "[checkImageGenerationQuota] tracking query failed, allowing generation:",
        (globalError ?? userError)?.message,
      );
      return { allowed: true };
    }

    if ((globalCount ?? 0) >= GLOBAL_MONTHLY_LIMIT) {
      return { allowed: false, reason: "global_limit" };
    }
    if ((userCount ?? 0) >= PER_USER_MONTHLY_LIMIT) {
      return { allowed: false, reason: "user_limit" };
    }
    return { allowed: true };
  } catch (err) {
    console.error("[checkImageGenerationQuota] threw, allowing generation:", err instanceof Error ? err.message : err);
    return { allowed: true };
  }
}

export async function logImageGeneration(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    const { error } = await supabase.from("image_generation_log").insert({ user_id: userId });
    if (error) {
      console.error("[logImageGeneration] failed to log usage:", error.message);
    }
  } catch (err) {
    console.error("[logImageGeneration] threw:", err instanceof Error ? err.message : err);
  }
}
