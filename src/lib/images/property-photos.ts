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
import { after } from "next/server";

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
    let res: Response | null = null;
    // Replicate limita las peticiones en ráfaga (429): tres fotos a la vez dejaban una sin generar y la propiedad se quedaba sin foto.
    for (let attempt = 0; attempt < 4; attempt++) {
      res = await fetchWithTimeout(
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
      if (res.status !== 429) break;
      let wait = 3000;
      try {
        const body = (await res.clone().json()) as { retry_after?: number };
        if (typeof body.retry_after === "number") wait = Math.min(10_000, Math.max(1000, body.retry_after * 1000 + 300));
      } catch {
        // sin cuerpo legible: espera por defecto
      }
      await new Promise((r) => setTimeout(r, wait));
    }
    if (!res || !res.ok) return null;

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
  /** "propiedad" = foto exterior del listado; "interior" = foto de dentro (salón, cabina…). */
  kind: "propiedad" | "interior" = "propiedad",
): Promise<string | null> {
  const templateKey = `${kind}:${listingName}`;

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

/**
 * Como getOrCreatePropertyPhoto, pero sin hacerte esperar: si la foto no está lista en `ms` (generarla puede tardar
 * medio minuto), devuelve null y la generación sigue en segundo plano, de modo que queda guardada para la próxima vez
 * (Patrimonio la recoge de la caché). Antes cada escena de casa, coche o yate esperaba a que se generaran sus tres fotos.
 */
export async function getPropertyPhotoWithin(
  supabase: SupabaseClient,
  userId: string,
  listingName: string,
  prompt: string,
  kind: "propiedad" | "interior" = "propiedad",
  ms = 7000,
): Promise<string | null> {
  const job = getOrCreatePropertyPhoto(supabase, userId, listingName, prompt, kind).catch(() => null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), ms);
  });
  const result = await Promise.race([job, timeout]);
  if (timer) clearTimeout(timer);
  if (result !== "timeout") return result;
  try {
    after(async () => {
      await job;
    });
  } catch {
    // fuera de una petición: la generación sigue mientras viva la función
  }
  return null;
}
