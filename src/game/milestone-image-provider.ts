import type { MilestoneGenerationBrief } from "./milestone-visual";

/**
 * Provider-neutral contract for real milestone image generation/editing.
 *
 * IMPORTANT: provider credentials must live server-side. The browser must never
 * receive an OpenAI/provider API key. Until a server endpoint is configured the
 * game must keep using the deterministic local milestone/share-card fallback.
 */
export interface MilestoneImageRequest {
  playerPhoto: string;
  brief: MilestoneGenerationBrief;
  output?: { width: number; height: number };
}

export interface MilestoneImageResult {
  imageUrl: string;
  provider: string;
  generated: true;
}

export interface MilestoneImageProvider {
  generate(request: MilestoneImageRequest): Promise<MilestoneImageResult>;
}

export class MilestoneImageUnavailableError extends Error {
  constructor(message = "Milestone image generation backend is not configured") {
    super(message);
    this.name = "MilestoneImageUnavailableError";
  }
}

/**
 * Browser client for a future same-origin server endpoint. This deliberately
 * sends only the persisted player photo plus the rights-safe generation brief;
 * no secret is stored in the Vite client.
 */
export class HttpMilestoneImageProvider implements MilestoneImageProvider {
  constructor(private readonly endpoint = "/api/milestone-image") {}

  async generate(request: MilestoneImageRequest): Promise<MilestoneImageResult> {
    if (!request.playerPhoto) throw new MilestoneImageUnavailableError("Player photo is required for identity-preserving generation");

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new MilestoneImageUnavailableError(`Milestone image backend returned ${response.status}`);
    }

    const data = (await response.json()) as Partial<MilestoneImageResult>;
    if (!data.imageUrl || data.generated !== true || !data.provider) {
      throw new MilestoneImageUnavailableError("Milestone image backend returned an invalid payload");
    }

    return { imageUrl: data.imageUrl, provider: data.provider, generated: true };
  }
}
