const MODEL = "black-forest-labs/flux-kontext-pro";

interface ReplicatePrediction {
  status: string;
  output: string | string[] | null;
  error: string | null;
}

async function runFluxKontext(inputImageUrl: string, prompt: string): Promise<string | null> {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("[runFluxKontext] no REPLICATE_API_TOKEN set");
    return null;
  }

  try {
    const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          prompt,
          input_image: inputImageUrl,
          output_format: "png",
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[runFluxKontext] HTTP ${res.status}`, body.slice(0, 500));
      return null;
    }

    const data = (await res.json()) as ReplicatePrediction;
    if (data.status !== "succeeded" || !data.output) {
      console.error("[runFluxKontext] prediction did not succeed", JSON.stringify(data).slice(0, 500));
      return null;
    }

    return Array.isArray(data.output) ? data.output[0] : data.output;
  } catch (err) {
    console.error("[runFluxKontext] threw", err instanceof Error ? err.message : err);
    return null;
  }
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
    const imageRes = await fetch(outputUrl);
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
