const MODEL_OWNER = "google";
const MODEL_NAME = "nano-banana-pro";

interface ReplicatePrediction {
  status: string;
  output: string | string[] | null;
  error: string | null;
  urls?: { get: string };
}

/**
 * Ninguno de los fetch de este archivo tenía timeout — verificado en vivo:
 * una generación real se quedó "pendiente" más de 9 minutos sin éxito NI
 * fallo, sin ningún error en los logs. Causa: si la llamada de red se
 * queda colgada (Replicate con carga, o simplemente una petición que
 * nunca resuelve), el límite de tiempo de sondeo no sirve de nada — ese
 * límite solo se comprueba ENTRE llamadas a fetch, nunca corta una
 * llamada que ya está en curso. Con esto, ninguna llamada de red puede
 * bloquear la generación más allá de su propio timeout explícito.
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
 * Recordatorio explícito de identidad — Nano Banana Pro ya es mucho más
 * fiel a la cara real que el pipeline anterior (Flux Kontext + face-swap
 * encadenados) sin necesitar ningún paso aparte, pero seguir pidiendo
 * expresamente "es la MISMA persona, no un parecido" ayuda a que no se
 * desvíe en escenas con poses o luces muy distintas a la foto de entrada.
 */
function withIdentityPreserved(prompt: string): string {
  return `Using the person in the reference photo as the one and only subject, generate: ${prompt} It must be immediately recognizable as the exact same individual from the reference photo — same face shape, skin tone, eye color, nose and overall likeness — not a similar-looking stock model. Keep his hairstyle and facial hair the same unless the description above explicitly says otherwise.`;
}

/**
 * Genera la foto de un momento del jugador con Nano Banana Pro (modelo de
 * imagen de Google): una única llamada que entiende la foto real de
 * entrada y genera la escena entera respetando la cara, sin necesitar un
 * segundo paso de face-swap encima. Sustituye al pipeline anterior (Flux
 * Kontext Pro + face-swap encadenados) tras compararlos lado a lado con
 * la misma foto real — pedido explícito: "las imágenes tienen que ser
 * perfectas... lo más parecido posible". Además de un parecido muy
 * superior, una sola llamada de ~25s en vez de dos encadenadas también
 * elimina de raíz el riesgo de agotar el límite duro de 300s de Vercel
 * Hobby que causó varios hitos atascados "pending" para siempre.
 *
 * Coste real: ~0,14€/imagen (frente a ~0,05€ del pipeline anterior) — ver
 * src/lib/images/credits.ts para cómo se ajustó el precio del pack de
 * pago para mantener margen con este coste más alto.
 */
export async function generatePlayerImage(
  inputImageUrl: string,
  prompt: string,
  lite = false,
): Promise<Buffer | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error("[generatePlayerImage] no REPLICATE_API_TOKEN set");
    return null;
  }

  try {
    const res = await fetchWithTimeout(
      `https://api.replicate.com/v1/models/${MODEL_OWNER}/${MODEL_NAME}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait=60",
        },
        body: JSON.stringify({
          input: {
            prompt: lite ? `Photo of the exact same man from the reference photo. ${prompt}` : withIdentityPreserved(prompt),
            image_input: [inputImageUrl],
            aspect_ratio: "4:5",
            resolution: "2K",
          },
        }),
      },
      70_000,
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[generatePlayerImage] HTTP ${res.status}`, body.slice(0, 500));
      // Un único reintento con un prompt más corto: si el motivo fue
      // moderación o un prompt demasiado largo/complejo, repetir tal
      // cual casi siempre vuelve a fallar igual.
      if (!lite) return generatePlayerImage(inputImageUrl, prompt, true);
      return null;
    }

    let data = (await res.json()) as ReplicatePrediction;
    if (data.status !== "succeeded" && data.urls?.get) {
      const polled = await pollUntilDone(data.urls.get, token);
      if (polled) data = polled;
    }

    if (data.status !== "succeeded" || !data.output) {
      console.error(`[generatePlayerImage] prediction did not succeed: status=${data.status} error=${data.error ?? "(sin detalle)"}`);
      if (!lite) return generatePlayerImage(inputImageUrl, prompt, true);
      return null;
    }

    const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    const imageRes = await fetchWithTimeout(outputUrl, {}, 30_000);
    if (!imageRes.ok) {
      console.error(`[generatePlayerImage] fetching output failed: HTTP ${imageRes.status}`);
      return null;
    }
    return Buffer.from(await imageRes.arrayBuffer());
  } catch (err) {
    console.error("[generatePlayerImage] threw", err instanceof Error ? err.message : err);
    return null;
  }
}
