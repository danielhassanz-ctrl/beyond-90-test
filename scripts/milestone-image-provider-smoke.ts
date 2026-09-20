import assert from "node:assert/strict";
import { HttpMilestoneImageProvider, MilestoneImageUnavailableError } from "../src/game/milestone-image-provider";
import type { MilestoneGenerationBrief } from "../src/game/milestone-visual";

const brief: MilestoneGenerationBrief = {
  scene: "presentation",
  identityRule: "Preserve the exact recognisable identity of the persisted uploaded player photo.",
  ageRule: "Render the same person at career age 23 with gradual identity-preserving maturation.",
  clubRule: "Use configured club colours only; no uncleared crest or sponsor artwork.",
  composition: "professional football signing presentation",
  prohibited: ["identity drift", "official crest without cleared rights"],
};

async function main() {
  const originalFetch = globalThis.fetch;
  try {
    const provider = new HttpMilestoneImageProvider("/api/milestone-image");
    await assert.rejects(
      provider.generate({ playerPhoto: "", brief }),
      (error: unknown) => error instanceof MilestoneImageUnavailableError && /Player photo is required/.test(error.message),
    );

    let captured: RequestInit | undefined;
    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      captured = init;
      return new Response(JSON.stringify({ imageUrl: "https://example.invalid/generated.png", provider: "test-provider", generated: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const result = await provider.generate({ playerPhoto: "data:image/jpeg;base64,player", brief, output: { width: 1080, height: 1920 } });
    assert.equal(result.generated, true);
    assert.equal(result.provider, "test-provider");
    assert.ok(captured?.body);
    const body = JSON.parse(String(captured?.body));
    assert.equal(body.playerPhoto, "data:image/jpeg;base64,player");
    assert.deepEqual(body.brief, brief);
    assert.equal(body.apiKey, undefined, "browser request must never contain provider credentials");

    globalThis.fetch = (async () => new Response(JSON.stringify({ provider: "broken", generated: true }), { status: 200 })) as typeof fetch;
    await assert.rejects(provider.generate({ playerPhoto: "photo", brief }), MilestoneImageUnavailableError);

    // Generated image transports are an explicit trust boundary: reject active/non-HTTPS
    // schemes, credential-bearing URLs and malformed PNG data before rendering/caching them.
    for (const imageUrl of [
      "javascript:alert(1)",
      "http://example.invalid/generated.png",
      "https://user:secret@example.invalid/generated.png",
      "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
      "data:image/png;base64,not-valid-***",
    ]) {
      globalThis.fetch = (async () => new Response(JSON.stringify({ imageUrl, provider: "unsafe-provider", generated: true }), { status: 200 })) as typeof fetch;
      await assert.rejects(
        provider.generate({ playerPhoto: `unsafe-photo-${imageUrl}`, brief }),
        (error: unknown) => error instanceof MilestoneImageUnavailableError && /invalid payload/.test(error.message),
      );
    }

    const tinyPngDataUrl = "data:image/png;base64,iVBORw0KGgo=";
    globalThis.fetch = (async () => new Response(JSON.stringify({ imageUrl: tinyPngDataUrl, provider: "safe-data-provider", generated: true }), { status: 200 })) as typeof fetch;
    const dataResult = await provider.generate({ playerPhoto: "safe-data-photo", brief });
    assert.equal(dataResult.imageUrl, tinyPngDataUrl, "well-formed PNG data transport should remain supported");

    globalThis.fetch = (async () => new Response("unavailable", { status: 503 })) as typeof fetch;
    await assert.rejects(
      provider.generate({ playerPhoto: "photo-503", brief }),
      (error: unknown) => error instanceof MilestoneImageUnavailableError && /503/.test(error.message),
    );

    console.log("milestone image provider smoke: OK");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void main();
