import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Única llamada de red de todo el pipeline de imágenes sin try/catch —
 * el resto (replicate.ts, faceswap.ts, property-photos.ts) sí lo tiene,
 * precisamente por fallos de red reales vistos en esta misma sesión. Si
 * el .upload() de Supabase revienta a nivel de red (timeout, conexión
 * cortada) en vez de devolver limpiamente un `error`, la excepción se
 * escapaba sin control — y como esta función siempre se llama dentro de
 * un Promise.all junto a la otra subida (ver carrera/actions.ts), un
 * fallo así hacía perder TAMBIÉN el resultado de la otra subida que sí
 * había ido bien, sin dejar ningún rastro en los logs de cuál de las dos
 * falló.
 */
export async function uploadGeneratedImage(
  supabase: SupabaseClient,
  userId: string,
  buffer: Buffer,
  prefix: string,
): Promise<string | null> {
  const path = `${userId}/${prefix}-${Date.now()}.png`;

  try {
    const { error } = await supabase.storage
      .from("player-photos")
      .upload(path, buffer, { contentType: "image/png", upsert: true });

    if (error) {
      console.error(`[uploadGeneratedImage:${prefix}] storage upload failed`, error.message);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("player-photos").getPublicUrl(path);

    return publicUrl;
  } catch (err) {
    console.error(`[uploadGeneratedImage:${prefix}] threw`, err instanceof Error ? err.message : err);
    return null;
  }
}
