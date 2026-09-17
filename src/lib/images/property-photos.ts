import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fotos de propiedades (casas, mansiones, yates, avión privado) para las
 * decisiones tipo catálogo. A diferencia de las fotos de jugador, aquí NO
 * hay cara que editar — es la misma foto para cualquier jugador que vea
 * ese mismo listado, así que se genera UNA VEZ con un modelo de
 * texto-a-imagen barato (~0,003€, Flux Schnell) y se reutiliza siempre
 * desde image_templates, la misma tabla de caché que ya usan las escenas
 * de jugador.
 */
const MODEL_VERSION = "c846a69991daf4c0e5d016514849d14ee5b2e6846ce6b9d6f21369e564cfe51e"; // black-forest-labs/flux-schnell

/**
 * Mismo arreglo que en replicate.ts y faceswap.ts: sin timeout, una
 * llamada de red colgada podía dejar la generación pendiente para
 * siempre, sin llegar nunca a marcarse como fallida (verificado en vivo
 * con un caso real de más de 9 minutos sin resolverse).
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function generatePropertyImage(prompt: string): Promise<Buffer | null> {
  if (!process.env.REPLICATE_API_TOKEN) return null;

  try {
    const res = await fetchWithTimeout(
      "https://api.replicate.com/v1/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          version: MODEL_VERSION,
          input: { prompt, aspect_ratio: "4:3", output_format: "jpg", go_fast: true },
        }),
      },
      70_000,
    );
    if (!res.ok) return null;

    let data = (await res.json()) as { status: string; output: string[] | string | null; urls?: { get: string } };
    const getUrl = data.urls?.get;
    if (data.status !== "succeeded" && getUrl) {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const poll = await fetchWithTimeout(getUrl, { headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` } }, 15_000);
          data = await poll.json();
        } catch (err) {
          console.error("[generatePropertyImage] poll fetch timed out or failed, retrying:", err instanceof Error ? err.message : err);
          continue;
        }
        if (data.status === "succeeded" || data.status === "failed") break;
      }
    }
    if (data.status !== "succeeded" || !data.output) return null;

    const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    const imageRes = await fetchWithTimeout(outputUrl, {}, 30_000);
    if (!imageRes.ok) return null;
    return Buffer.from(await imageRes.arrayBuffer());
  } catch (err) {
    console.error("[generatePropertyImage] threw", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Devuelve la URL de la foto para este listado (por nombre exacto), del
 * caché si ya existe o generándola y guardándola si es la primera vez.
 */
export async function getOrCreatePropertyPhoto(
  supabase: SupabaseClient,
  userId: string,
  listingName: string,
  prompt: string,
): Promise<string | null> {
  const templateKey = `propiedad:${listingName}`;

  const { data: existing } = await supabase
    .from("image_templates")
    .select("image_url")
    .eq("template_key", templateKey)
    .maybeSingle();

  if (existing?.image_url) return existing.image_url;

  const buffer = await generatePropertyImage(prompt);
  if (!buffer) return null;

  // La política de Storage del bucket exige que la ruta empiece por el
  // uid del usuario autenticado (mismo esquema que las fotos de
  // jugador) — de ahí que vaya "bajo" el usuario que la disparó primero,
  // aunque el bucket es de lectura pública y cualquier otro jugador la
  // reutiliza igual desde image_templates. Sin este prefijo, Storage
  // rechazaba la subida con "row-level security policy" (visto en vivo).
  const path = `${userId}/properties/${templateKey.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("player-photos")
    .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
  if (uploadError) {
    console.error("[getOrCreatePropertyPhoto] upload failed:", uploadError.message);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("player-photos").getPublicUrl(path);

  const { data: raceCheck } = await supabase
    .from("image_templates")
    .select("image_url")
    .eq("template_key", templateKey)
    .maybeSingle();
  if (raceCheck?.image_url) return raceCheck.image_url;

  await supabase.from("image_templates").insert({ template_key: templateKey, image_url: publicUrl });
  return publicUrl;
}
