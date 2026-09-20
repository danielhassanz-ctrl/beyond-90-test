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

const MAX_GENERATED_DATA_URL_CHARS = 12_000_000;
const MAX_GENERATED_REMOTE_URL_CHARS = 4_096;
const PNG_DATA_URL_PREFIX = "data:image/png;base64,";

function isSafeGeneratedImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.startsWith(PNG_DATA_URL_PREFIX)) {
    if (value.length > MAX_GENERATED_DATA_URL_CHARS) return false;
    const payload = value.slice(PNG_DATA_URL_PREFIX.length);
    return payload.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(payload) && payload.length % 4 === 0;
  }
  if (value.length > MAX_GENERATED_REMOTE_URL_CHARS) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

const CLIENT_TIMEOUT_MS = 60_000;
const PERSISTENT_CACHE_NAME = "beyond90-milestone-images-v2";
const LEGACY_CACHE_NAME = "beyond90-milestone-images-v1";

/** Fast page-lifetime cache. Keys are compact fingerprints, never raw player photos. */
const successfulRequestCache = new Map<string, MilestoneImageResult>();
const inFlightRequestCache = new Map<string, Promise<MilestoneImageResult>>();

function requestCacheKey(request: MilestoneImageRequest): string {
  return JSON.stringify(request);
}

/** 128-bit deterministic cache id; request/photo contents never enter the URL or Map keys. */
function compactCacheKey(value: string): string {
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  let c = 0x85ebca6b;
  let d = 0xc2b2ae35;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    a ^= code; a = Math.imul(a, 0x01000193) >>> 0;
    b ^= code + i; b = Math.imul(b, 0x85ebca6b) >>> 0;
    c ^= code + (i << 1); c = Math.imul(c, 0xc2b2ae35) >>> 0;
    d ^= code + (i << 2); d = Math.imul(d, 0x27d4eb2f) >>> 0;
  }
  return [a, b, c, d].map((lane) => lane.toString(16).padStart(8, "0")).join("");
}

/** Exact legacy key retained only to migrate already-paid v1 scenes. */
function legacyCompactCacheKey(value: string): string {
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    a ^= code; a = Math.imul(a, 0x01000193) >>> 0;
    b ^= code + i; b = Math.imul(b, 0x85ebca6b) >>> 0;
  }
  return `${a.toString(16).padStart(8, "0")}${b.toString(16).padStart(8, "0")}`;
}

function persistentRequestUrl(cacheKey: string, legacy = false): string {
  const origin = typeof location !== "undefined" ? location.origin : "https://beyond90.local";
  const compact = legacy ? legacyCompactCacheKey(cacheKey) : compactCacheKey(cacheKey);
  return `${origin}/__b90_milestone_cache__/${compact}`;
}

function parsePersistentResult(data: Partial<MilestoneImageResult>): MilestoneImageResult | null {
  if (!isSafeGeneratedImageUrl(data.imageUrl) || data.generated !== true || typeof data.provider !== "string" || !data.provider.trim()) return null;
  return { imageUrl: data.imageUrl, provider: data.provider, generated: true };
}

async function readPersistentResult(cacheKey: string): Promise<MilestoneImageResult | null> {
  if (typeof caches === "undefined") return null;
  try {
    const current = await caches.open(PERSISTENT_CACHE_NAME);
    const response = await current.match(persistentRequestUrl(cacheKey));
    if (response) return parsePersistentResult((await response.json()) as Partial<MilestoneImageResult>);

    // A paid scene generated before the stronger cache key shipped must be
    // restored, not regenerated and charged again. Migrate it lazily to v2.
    const legacy = await caches.open(LEGACY_CACHE_NAME);
    const legacyResponse = await legacy.match(persistentRequestUrl(cacheKey, true));
    if (!legacyResponse) return null;
    const migrated = parsePersistentResult((await legacyResponse.json()) as Partial<MilestoneImageResult>);
    if (migrated) await writePersistentResult(cacheKey, migrated);
    return migrated;
  } catch {
    return null;
  }
}

async function writePersistentResult(cacheKey: string, result: MilestoneImageResult): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(PERSISTENT_CACHE_NAME);
    await cache.put(
      persistentRequestUrl(cacheKey),
      new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } }),
    );
  } catch {
    // Storage pressure/private browsing must never break the playable fallback.
  }
}

/** Browser client. Provider credentials remain exclusively server-side. */
export class HttpMilestoneImageProvider implements MilestoneImageProvider {
  constructor(private readonly endpoint = "/api/milestone-image") {}

  /** Restore an already-paid generated scene without ever contacting the backend. */
  async cached(request: MilestoneImageRequest): Promise<MilestoneImageResult | null> {
    const cacheKey = requestCacheKey(request);
    const memoryKey = compactCacheKey(cacheKey);
    const memory = successfulRequestCache.get(memoryKey);
    if (memory) return memory;
    const persisted = await readPersistentResult(cacheKey);
    if (persisted) successfulRequestCache.set(memoryKey, persisted);
    return persisted;
  }

  async generate(request: MilestoneImageRequest, options: MilestoneImageGenerateOptions = {}): Promise<MilestoneImageResult> {
    if (!request.playerPhoto) throw new MilestoneImageUnavailableError("Player photo is required for identity-preserving generation");
    if (options.signal?.aborted) throw new MilestoneImageUnavailableError("Milestone image request was cancelled");

    const cacheKey = requestCacheKey(request);
    const memoryKey = compactCacheKey(cacheKey);
    const cached = await this.cached(request);
    if (cached) return cached;

    if (!options.signal) {
      const inFlight = inFlightRequestCache.get(memoryKey);
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
      successfulRequestCache.set(memoryKey, result);
      await writePersistentResult(cacheKey, result);
      return result;
    };

    const pending = performRequest();
    if (!options.signal) inFlightRequestCache.set(memoryKey, pending);
    try {
      return await pending;
    } finally {
      if (!options.signal && inFlightRequestCache.get(memoryKey) === pending) inFlightRequestCache.delete(memoryKey);
    }
  }
}
