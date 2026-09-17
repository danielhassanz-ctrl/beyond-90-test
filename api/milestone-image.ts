type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status(code: number): ApiResponse;
  json(body: unknown): void;
};

type GenerationBrief = {
  scene: string;
  identityRule: string;
  ageRule: string;
  clubRule: string;
  composition: string;
  prohibited: string[];
};

type RequestBody = {
  playerPhoto?: string;
  brief?: GenerationBrief;
  output?: { width?: number; height?: number };
};

const MAX_PHOTO_CHARS = 8_000_000;

function validBrief(value: unknown): value is GenerationBrief {
  if (!value || typeof value !== "object") return false;
  const brief = value as Partial<GenerationBrief>;
  return typeof brief.scene === "string"
    && typeof brief.identityRule === "string"
    && typeof brief.ageRule === "string"
    && typeof brief.clubRule === "string"
    && typeof brief.composition === "string"
    && Array.isArray(brief.prohibited)
    && brief.prohibited.every((item) => typeof item === "string");
}

function promptFor(brief: GenerationBrief): string {
  return [
    "Create one cinematic, photorealistic football-career milestone image using the supplied player photo as the identity reference.",
    brief.identityRule,
    brief.ageRule,
    brief.clubRule,
    brief.composition,
    `Scene type: ${brief.scene}.`,
    `Never include: ${brief.prohibited.join(", ")}.`,
    "Keep the same recognisable person. Do not add text, watermarks, sponsor marks or unofficial/official crests. Use only generic kit shapes and the supplied rights-safe colour direction.",
  ].join("\n");
}

/**
 * Server-only Vercel-compatible endpoint. OPENAI_API_KEY must be configured in
 * the deployment environment; it is never sent to the browser.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "image_backend_not_configured" });
    return;
  }

  const body = (req.body ?? {}) as RequestBody;
  if (typeof body.playerPhoto !== "string" || !body.playerPhoto.startsWith("data:image/") || body.playerPhoto.length > MAX_PHOTO_CHARS || !validBrief(body.brief)) {
    res.status(400).json({ error: "invalid_milestone_image_request" });
    return;
  }

  const size = body.output?.height && body.output.height > (body.output?.width ?? 0) ? "1024x1536" : "1024x1024";

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: promptFor(body.brief) },
            { type: "input_image", image_url: body.playerPhoto, detail: "high" },
          ],
        }],
        tools: [{
          type: "image_generation",
          model: "gpt-image-2",
          action: "edit",
          input_fidelity: "high",
          quality: "medium",
          size,
          background: "opaque",
        }],
        tool_choice: { type: "image_generation" },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("milestone image generation failed", response.status, detail.slice(0, 1000));
      res.status(response.status >= 500 ? 502 : response.status).json({ error: "image_generation_failed" });
      return;
    }

    const payload = await response.json() as { output?: Array<{ type?: string; result?: string }> };
    const image = payload.output?.find((item) => item.type === "image_generation_call" && typeof item.result === "string")?.result;
    if (!image) {
      res.status(502).json({ error: "image_generation_missing_result" });
      return;
    }

    res.status(200).json({
      imageUrl: `data:image/png;base64,${image}`,
      provider: "openai:gpt-image-2",
      generated: true,
    });
  } catch (error) {
    console.error("milestone image endpoint error", error);
    res.status(502).json({ error: "image_generation_unavailable" });
  }
}
