import assert from "node:assert/strict";
import handler from "../api/milestone-image";

type Captured = { status?: number; body?: unknown; headers?: Record<string, string> };

function response(captured: Captured) {
  captured.headers = {};
  return {
    status(code: number) { captured.status = code; return this; },
    json(body: unknown) { captured.body = body; },
    setHeader(name: string, value: string) { captured.headers![name.toLowerCase()] = value; },
  };
}

function assertPrivatePhotoHeaders(captured: Captured) {
  assert.equal(captured.headers?.["cache-control"], "private, no-store, max-age=0", "personalized player photos must never be cacheable");
  assert.equal(captured.headers?.pragma, "no-cache");
  assert.equal(captured.headers?.["x-content-type-options"], "nosniff");
}

const validBody = {
  playerPhoto: "data:image/jpeg;base64,/9j/AAAA",
  brief: {
    scene: "presentation",
    identityRule: "Preserve the exact recognisable identity, ethnicity and core facial features of the persisted uploaded player photo; do not substitute another person.",
    ageRule: "Render the same person at career age 23 with gradual identity-preserving maturation.",
    clubRule: "Use club name and configured club colours only; do not reproduce uncleared protected artwork.",
    composition: "Professional football signing presentation using only rights-safe club colours.",
    prohibited: ["identity drift", "different person", "official crest without cleared rights", "sponsor logo without cleared rights", "wrong career age", "unearned trophy or award"],
  },
  output: { width: 1024, height: 1536 },
};

const validGeneratedPng = "iVBORw0KGgoAAA==";

async function main() {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    const missingKey: Captured = {};
    await handler({ method: "POST", body: validBody }, response(missingKey));
    assert.equal(missingKey.status, 503);
    assert.deepEqual(missingKey.body, { error: "image_backend_not_configured" });
    assertPrivatePhotoHeaders(missingKey);

    process.env.OPENAI_API_KEY = "test-key";

    const crossSite: Captured = {};
    await handler({ method: "POST", body: validBody, headers: { "sec-fetch-site": "cross-site", origin: "https://attacker.example", host: "beyond90.example" } }, response(crossSite));
    assert.equal(crossSite.status, 403, "cross-site browsers must not be able to spend milestone image credits");
    assert.deepEqual(crossSite.body, { error: "cross_site_generation_forbidden" });
    assertPrivatePhotoHeaders(crossSite);

    const mismatchedOrigin: Captured = {};
    await handler({ method: "POST", body: validBody, headers: { origin: "https://attacker.example", host: "beyond90.example", "x-forwarded-proto": "https" } }, response(mismatchedOrigin));
    assert.equal(mismatchedOrigin.status, 403, "origin mismatch must be rejected even when Sec-Fetch-Site is absent");
    assertPrivatePhotoHeaders(mismatchedOrigin);

    const invalid: Captured = {};
    await handler({ method: "POST", body: { ...validBody, playerPhoto: "https://example.com/player.jpg" } }, response(invalid));
    assert.equal(invalid.status, 400, "remote player-photo URLs must not enter the generation endpoint");
    assertPrivatePhotoHeaders(invalid);

    const mislabeled: Captured = {};
    await handler({ method: "POST", body: { ...validBody, playerPhoto: "data:image/jpeg;base64,cGxheWVy" } }, response(mislabeled));
    assert.equal(mislabeled.status, 400, "mislabeled base64 must be rejected before a paid generation call");
    assertPrivatePhotoHeaders(mislabeled);

    let upstreamInit: RequestInit | undefined;
    let providerResult = validGeneratedPng;
    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      upstreamInit = init;
      return new Response(JSON.stringify({ output: [{ type: "image_generation_call", result: providerResult }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const ok: Captured = {};
    await handler({ method: "POST", body: validBody, headers: { origin: "https://beyond90.example", host: "beyond90.example", "x-forwarded-proto": "https", "sec-fetch-site": "same-origin" } }, response(ok));
    assert.equal(ok.status, 200, "same-origin milestone generation must remain playable");
    assert.deepEqual(ok.body, {
      imageUrl: `data:image/png;base64,${validGeneratedPng}`,
      provider: "openai:gpt-image-2",
      generated: true,
    });
    assertPrivatePhotoHeaders(ok);
    assert.ok(upstreamInit?.body);
    const upstream = JSON.parse(String(upstreamInit?.body));
    assert.equal(upstream.model, "gpt-5.6-luna");
    assert.equal(upstream.tools?.[0]?.type, "image_generation");
    assert.equal(upstream.tools?.[0]?.model, "gpt-image-2");
    assert.equal(upstream.tools?.[0]?.action, "edit");
    assert.equal(upstream.tools?.[0]?.input_fidelity, "high");
    assert.equal(upstream.tools?.[0]?.quality, "high");
    assert.equal(upstream.tools?.[0]?.size, "1024x1536");
    const serialized = JSON.stringify(upstream);
    assert.ok(serialized.includes(validBody.playerPhoto));
    assert.ok(serialized.includes("Do not add text, watermarks, sponsor marks or unofficial/official crests"));

    providerResult = "ZmFrZS1wbmc=";
    const malformedProviderImage: Captured = {};
    await handler({ method: "POST", body: validBody }, response(malformedProviderImage));
    assert.equal(malformedProviderImage.status, 502, "non-PNG provider payload must never be persisted as a milestone photo");
    assert.deepEqual(malformedProviderImage.body, { error: "image_generation_invalid_result" });
    assertPrivatePhotoHeaders(malformedProviderImage);
    providerResult = validGeneratedPng;

    const png: Captured = {};
    await handler({ method: "POST", body: { ...validBody, playerPhoto: "data:image/png;base64,iVBORw0KGgoAAA==" } }, response(png));
    assert.equal(png.status, 200, "PNG player photos with a real PNG signature must remain supported");
    assertPrivatePhotoHeaders(png);

    const webp: Captured = {};
    await handler({ method: "POST", body: { ...validBody, playerPhoto: "data:image/webp;base64,UklGRgAAAABXRUJQ" } }, response(webp));
    assert.equal(webp.status, 200, "WebP player photos with RIFF/WEBP signature must remain supported");
    assertPrivatePhotoHeaders(webp);

    console.log("milestone image endpoint smoke: OK");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
}

void main();
