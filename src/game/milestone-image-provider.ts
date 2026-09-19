import type { MilestoneGenerationBrief } from "./milestone-visual";

/** Provider-neutral request for a real identity-preserving milestone edit. */
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

export interface MilestoneImageGenerateOptions {
  /** Cancels the browser request when the milestone is no longer current. */
  signal?: AbortSignal;
}

export interface MilestoneImageProvider {
  generate(request: MilestoneImageRequest, options?: MilestoneImageGenerateOptions): Promise<MilestoneImageResult>;
}

export class MilestoneImageUnavailableError extends Error {
  constructor(message = "Milestone image generation backend is not configured") {
    super(message);
    this.name = "MilestoneImageUnavailableError";
  }
}

function isSafeGeneratedImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return value.startsWith("data:image/png;base64,") || value.startsWith("https://");
}

const CLIENT_TIMEOUT_MS = 60_000;

/**
 * Successful edits are cached for the lifetime of the page. This is deliberately
 * memory-only: generated data URLs can be several MB and must not silently fill
 * localStorage. It also prevents a remount/re-render of the same earned milestone
 * from causing another paid provider request.
 */
const successfulRequestCache = new Map<string, MilestoneImageResult>();
const inFlightRequestCache = new Map<string, Promise<MilestoneImageResult>>();

function requestCacheKey(request: MilestoneImageRequest): string {
  return JSON.stringify(request);
}

/** Browser client. Provider credentials remain exclusively server-side. */
export class HttpMilestoneImageProvider implements MilestoneImageProvider {
  constructor(private readonly endpoint = "/api/milestone-image") {}

  async generate(request: MilestoneImageRequest, options: MilestoneImageGenerateOptions = {}): Promise<MilestoneImageResult> {
    if (!request.playerPhoto) throw new MilestoneImageUnavailableError("Player photo is required for identity-preserving generation");
    if (options.signal?.aborted) throw new MilestoneImageUnavailableError("Milestone image request was cancelled");

    const cacheKey = requestCacheKey(request);
    const cached = successfulRequestCache.get(cacheKey);
    if (cached) return cached;

    // Do not share a cancellable in-flight request with a caller that supplied a
    // signal: one story transition must never abort another caller's valid edit.
    if (!options.signal) {
      const inFlight = inFlightRequestCache.get(cacheKey);
      if (inFlight) return inFlight;
    }

    const performRequest = async (): Promise<MilestoneImageResult> => {
      const controller = new AbortController();
      const abortFromCaller = () => controller.abort();
      options.signal?.addEventListener("abort", abortFromCaller, { once: true });
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
        const cancelled = options.signal?.aborted;
        const reason = cancelled ? "was cancelled" : error instanceof Error && error.name === "AbortError" ? "timed out" : "is unreachable";
        throw new MilestoneImageUnavailableError(`Milestone image backend ${reason}`);
      } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener("abort", abortFromCaller);
      }

      if (!response.ok) throw new MilestoneImageUnavailableError(`Milestone image backend returned ${response.status}`);

      let data: Partial<MilestoneImageResult>;
      try {
        data = (await response.json()) as Partial<MilestoneImageResult>;
      } catch {
        throw new MilestoneImageUnavailableError("Milestone image backend returned invalid JSON");
      }
      if (!isSafeGeneratedImageUrl(data.imageUrl) || data.generated !== true || typeof data.provider !== "string" || !data.provider.trim()) {
        throw new MilestoneImageUnavailableError("Milestone image backend returned an invalid payload");
      }

      const result: MilestoneImageResult = { imageUrl: data.imageUrl, provider: data.provider, generated: true };
      successfulRequestCache.set(cacheKey, result);
      return result;
    };

    const pending = performRequest();
    if (!options.signal) inFlightRequestCache.set(cacheKey, pending);
    try {
      return await pending;
    } finally {
      if (!options.signal && inFlightRequestCache.get(cacheKey) === pending) inFlightRequestCache.delete(cacheKey);
    }
  }
}
