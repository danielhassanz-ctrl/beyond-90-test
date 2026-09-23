const MODEL = "black-forest-labs/flux-kontext-pro";

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
 * nunca resuelve), el límite de 180s en pollUntilDone no sirve de nada —
 * ese límite solo se comprueba ENTRE llamadas a fetch, nunca corta una
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

/**
 * `Prefer: wait` sin más espera hasta 60s a que Replicate resuelva la
 * predicción SÍNCRONAMENTE y punto — si Kontext Pro no ha terminado en
 * ese margen (algo habitual: 9-173s medidos en pruebas reales, hasta ~3
 * min en frío), la respuesta llega con status "processing"/"starting",
 * output null y logs vacíos. El código anterior trataba eso como un
 * fallo definitivo y se rendía ahí mismo, sin comprobar nunca si la
 * predicción SÍ terminaba bien un poco después — esto descartaba como
 * "fallidas" generaciones que en realidad solo iban lentas, y era la
 * causa real de por qué casi ninguna foto de jugador llegaba a
 * completarse. swapFaceIntoTemplate (faceswap.ts) y
 * getOrCreatePropertyPhoto (property-photos.ts) ya hacían este mismo
 * sondeo correctamente; a este módulo, el más usado de los tres, nunca
 * se le aplicó el mismo arreglo.
 */
async function pollUntilDone(getUrl: string, token: string, maxWaitMs = 180_000): Promise<ReplicatePrediction | null> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    let res: Response;
    try {
      res = await fetchWithTimeout(getUrl, { headers: { Authorization: `Bearer ${token}` } }, 15_000);
    } catch (err) {
      console.error("[pollUntilDone] fetch timed out or failed, retrying:", err instanceof Error ? err.message : err);
      await new Promise((r) => setTimeout(r, 2500));
      continue;
    }
    if (!res.ok) return null;
    const data = (await res.json()) as ReplicatePrediction;
    if (data.status === "succeeded" || data.status === "failed" || data.status === "canceled") {
      return data;
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return null;
}

/**
 * Kontext Pro es un modelo de EDICIÓN (parte de una foto real), pero
 * cuando el prompt describe una escena entera con otras personas (p.ej.
 * "dos directivos se dan la mano con la camiseta en medio"), el modelo
 * tiene libertad para alejarse del sujeto original y generar una escena
 * genérica donde la cara del jugador ya ni aparece — visto en pruebas
 * reales: la foto salía perfecta de colores pero sin el jugador. Esta
 * envoltura fuerza en cada llamada que la persona de la foto de entrada
 * sea la protagonista intocable, sin importar qué describa el resto del
 * prompt.
 */
/**
 * "Misma identidad" se refería a no sustituir a la persona por otra —
 * pero un modelo de edición puede leer "same face" de forma demasiado
 * literal y resistirse a cambios de pelo/barba que el propio prompt pide
 * explícitamente (el look evoluciona con la edad, ver playerLook.ts). La
 * aclaración de la última frase evita que esta protección anule esos
 * cambios de estilo.
 *
 * Reforzado tras ver en vivo una generación real donde la cara SÍ
 * cambiaba de forma notable (usuario: "me ha cambiado la cara entera").
 * Kontext Pro no tiene ningún parámetro numérico de "fuerza de edición"
 * (comprobado contra su esquema real) — el prompt es el único mando
 * disponible. Dos cambios: (1) rasgos concretos (tono de piel, forma de
 * cara, complexión) en vez de la frase genérica "facial identity and
 * bone structure", más fácil de ignorar cuanta más gente describe el
 * resto de la escena (un presidente de club, compañeros, público). (2)
 * la instrucción de identidad se repite AL FINAL del prompt, no solo al
 * principio — con escenas largas, lo último que lee el modelo pesa más
 * que una frase de apertura que puede diluirse.
 */
function withIdentityPreserved(prompt: string): string {
  return `Edit this exact photo. The person already in the input image is the one and only main subject — preserve their exact face shape, skin tone, eye color, nose, and overall likeness pixel-faithfully, as if this were the same photograph continued. Do not generate a different person, a stock model, or a lookalike, even if the rest of the scene below describes other people around them. Apply only these changes: ${prompt} Before finishing: double-check the main subject's face against the original input photo — it must be immediately recognizable as the exact same individual, not just someone of similar age and build. Hairstyle or facial hair may change only if explicitly instructed above.`;
}

async function runFluxKontextOnce(inputImageUrl: string, prompt: string): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error("[runFluxKontext] no REPLICATE_API_TOKEN set");
    return null;
  }

  try {
    const res = await fetchWithTimeout(
      `https://api.replicate.com/v1/models/${MODEL}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: {
            prompt: withIdentityPreserved(prompt),
            input_image: inputImageUrl,
            output_format: "png",
          },
        }),
      },
      70_000,
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[runFluxKontext] HTTP ${res.status}`, body.slice(0, 500));
      return null;
    }

    let data = (await res.json()) as ReplicatePrediction;
    if (data.status !== "succeeded" && data.urls?.get) {
      const polled = await pollUntilDone(data.urls.get, token);
      if (polled) data = polled;
    }

    if (data.status !== "succeeded" || !data.output) {
      // Antes se registraba JSON.stringify(data).slice(0, 500) — con el
      // input_image y el prompt completo dentro del objeto, el `error`
      // real (p.ej. "(E005) input/output flagged as sensitive") casi
      // siempre quedaba cortado fuera del log, obligando a ir a la API de
      // Replicate a mano para ver por qué falló de verdad.
      console.error(`[runFluxKontext] prediction did not succeed: status=${data.status} error=${data.error ?? "(sin detalle)"}`);
      return null;
    }

    return Array.isArray(data.output) ? data.output[0] : data.output;
  } catch (err) {
    console.error("[runFluxKontext] threw", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Flux Kontext Pro modera tanto la imagen de entrada como la generada, y
 * ese filtro es ruidoso: visto en vivo un caso donde el propio Replicate
 * reintentó internamente con otra semilla y AÚN ASÍ volvió a marcar el
 * resultado como "sensible" (E005) las dos veces — sin que hubiera nada
 * problemático en la foto real. No hay ningún parámetro para relajar esa
 * moderación (safety_tolerance ya está en su máximo permitido, 2, cuando
 * se manda una imagen de entrada). Un segundo intento independiente
 * (nueva predicción completa, no solo otra semilla dentro de la misma)
 * es la única palanca real, y solo se paga si el primero falla.
 */
async function runFluxKontext(inputImageUrl: string, prompt: string): Promise<string | null> {
  const first = await runFluxKontextOnce(inputImageUrl, prompt);
  if (first) return first;

  console.error("[runFluxKontext] first attempt failed, retrying once more");
  return runFluxKontextOnce(inputImageUrl, prompt);
}

/**
 * Genera (o edita) una imagen a partir de una foto real del jugador.
 * Devuelve los bytes de la imagen, o null si algo falla (sin foto, sin
 * crédito, error de red) — quien llame debe tener un fallback sin imagen.
 */
export async function generatePlayerImage(
  inputImageUrl: string,
  prompt: string,
): Promise<Buffer | null> {
  const outputUrl = await runFluxKontext(inputImageUrl, prompt);
  if (!outputUrl) return null;

  try {
    const imageRes = await fetchWithTimeout(outputUrl, {}, 30_000);
    if (!imageRes.ok) {
      console.error(`[generatePlayerImage] fetching output failed: HTTP ${imageRes.status}`);
      return null;
    }
    const arrayBuffer = await imageRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("[generatePlayerImage] threw fetching output", err instanceof Error ? err.message : err);
    return null;
  }
}
