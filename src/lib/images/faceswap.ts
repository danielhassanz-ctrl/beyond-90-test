/**
 * Face-swap barato y rápido (~0,006€/imagen, ~7-9x más barato que Flux
 * Kontext Pro) para reutilizar plantillas de escena ya generadas: en vez
 * de recrear la escena entera con IA generativa cada vez (lento, caro,
 * y a veces con errores como texto ilegible), solo se sustituye la cara
 * sobre una plantilla ya validada.
 *
 * Verificado a mano antes de integrarlo: con dos caras claramente
 * distintas, el resultado cambia de verdad los rasgos (no es un no-op)
 * y mantiene camiseta, pose y luz de la plantilla sin artefactos raros.
 */
const MODEL_VERSION = "278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34"; // codeplugtech/face-swap

interface ReplicatePrediction {
  status: string;
  output: string | string[] | null;
  error: string | null;
  urls?: { get: string };
}

/**
 * Ninguna llamada de red aquí tenía timeout — el mismo bug encontrado y
 * arreglado en replicate.ts (una generación real se quedó "pendiente"
 * más de 9 minutos sin éxito NI fallo, porque el límite de maxWaitMs solo
 * se comprueba ENTRE llamadas a fetch, nunca corta una que ya está en
 * curso). Mismo arreglo aquí.
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

async function pollUntilDone(getUrl: string, token: string, maxWaitMs = 120_000): Promise<ReplicatePrediction | null> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    let res: Response;
    try {
      res = await fetchWithTimeout(getUrl, { headers: { Authorization: `Bearer ${token}` } }, 15_000);
    } catch (err) {
      console.error("[pollUntilDone] fetch timed out or failed, retrying:", err instanceof Error ? err.message : err);
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    if (!res.ok) return null;
    const data = (await res.json()) as ReplicatePrediction;
    if (data.status === "succeeded" || data.status === "failed" || data.status === "canceled") {
      return data;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

/**
 * @param targetSceneUrl La plantilla ya generada (la escena completa: camiseta, fondo, pose).
 * @param newFaceUrl La foto real del jugador cuya cara se inserta en la escena.
 * @returns Bytes de la imagen resultante, o null si falla.
 */
export async function swapFaceIntoTemplate(
  targetSceneUrl: string,
  newFaceUrl: string,
): Promise<Buffer | null> {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("[swapFaceIntoTemplate] no REPLICATE_API_TOKEN set");
    return null;
  }

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
          input: { input_image: targetSceneUrl, swap_image: newFaceUrl },
        }),
      },
      70_000,
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[swapFaceIntoTemplate] HTTP ${res.status}`, body.slice(0, 500));
      return null;
    }

    let data = (await res.json()) as ReplicatePrediction;
    if (data.status !== "succeeded" && data.urls?.get) {
      const polled = await pollUntilDone(data.urls.get, process.env.REPLICATE_API_TOKEN);
      if (polled) data = polled;
    }

    if (data.status !== "succeeded" || !data.output) {
      console.error("[swapFaceIntoTemplate] prediction did not succeed", JSON.stringify(data).slice(0, 500));
      return null;
    }

    const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    const imageRes = await fetchWithTimeout(outputUrl, {}, 30_000);
    if (!imageRes.ok) return null;
    return Buffer.from(await imageRes.arrayBuffer());
  } catch (err) {
    console.error("[swapFaceIntoTemplate] threw", err instanceof Error ? err.message : err);
    return null;
  }
}
