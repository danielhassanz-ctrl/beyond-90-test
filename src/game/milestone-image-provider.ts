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

function isSafeGeneratedImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  // The current server contract returns a PNG data URL. Allow HTTPS as well so
  // a future object-storage/CDN implementation can replace large data URLs
  // without weakening the client to javascript:, blob: or other schemes.
  return value.startsWith("data:image/png;base64,") || value.startsWith("https://");
}

const CLIENT_TIMEOUT_MS = 60_000;

/**
 * Browser client for the same-origin server endpoint. This deliberately sends
 * only the persisted player photo plus the rights-safe generation brief; no
 * provider secret is stored in the Vite client.
 */
export class HttpMilestoneImageProvider implements MilestoneImageProvider {
  constructor(private readonly endpoint = "/api/milestone-image") {}

  async generate(request: MilestoneImageRequest): Promise<MilestoneImageResult> {
    if (!request.playerPhoto) throw new MilestoneImageUnavailableError("Player photo is required for identity-preserving generation");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
    } catch (error) {
      const reason = error instanceof Error && error.name === "AbortError" ? "timed out" : "is unreachable";
      throw new MilestoneImageUnavailableError(`Milestone image backend ${reason}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new MilestoneImageUnavailableError(`Milestone image backend returned ${response.status}`);
    }

    let data: Partial<MilestoneImageResult>;
    try {
      data = (await response.json()) as Partial<MilestoneImageResult>;
    } catch {
      throw new MilestoneImageUnavailableError("Milestone image backend returned invalid JSON");
    }
    if (!isSafeGeneratedImageUrl(data.imageUrl) || data.generated !== true || typeof data.provider !== "string" || !data.provider.trim()) {
      throw new MilestoneImageUnavailableError("Milestone image backend returned an invalid payload");
    }

    return { imageUrl: data.imageUrl, provider: data.provider, generated: true };
  }
}
