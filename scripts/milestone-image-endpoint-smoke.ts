import assert from "node:assert/strict";
import handler from "../api/milestone-image";

type Captured = { status?: number; body?: unknown };

function response(captured: Captured) {
  return {
    status(code: number) { captured.status = code; return this; },
    json(body: unknown) { captured.body = body; },
  };
}

const validBody = {
  playerPhoto: "data:image/jpeg;base64,cGxheWVy",
  brief: {
    scene: "presentation",
    identityRule: "Preserve the exact recognisable identity, ethnicity and core facial features of the persisted uploaded player photo; do not substitute another person.",
    ageRule: "Render the same person at career age 23 with gradual identity-preserving maturation.",
    clubRule: "Use club name and configured club colours only; do not reproduce uncleared protected artwork.",
    composition: "Professional football signing presentation using only rights-safe club colours.",
    prohibited: [
      "identity drift",
      "different person",
      "official crest without cleared rights",
      "sponsor logo without cleared rights",
      "wrong career age",
      "unearned trophy or award",
    ],
  },
  output: { width: 1024, height: 1536 },
};

async function main() {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    const missingKey: Captured = {};
    await handler({ method: "POST", body: validBody }, response(missingKey));
    assert.equal(missingKey.status, 503);
    assert.deepEqual(missingKey.body, { error: "image_backend_not_configured" });

    process.env.OPENAI_API_KEY = "test-key";
    const invalid: Captured = {};
    await handler({ method: "POST", body: { ...validBody, playerPhoto: "https://example.com/player.jpg" } }, response(invalid));
    assert.equal(invalid.status, 400, "remote player-photo URLs must not enter the generation endpoint");

    let upstreamInit: RequestInit | undefined;
    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      upstreamInit = init;
      return new Response(JSON.stringify({ output: [{ type: "image_generation_call", result: "ZmFrZS1wbmc=" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const ok: Captured = {};
    await handler({ method: "POST", body: validBody }, response(ok));
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.body, {
      imageUrl: "data:image/png;base64,ZmFrZS1wbmc=",
      provider: "openai:gpt-image-2",
      generated: true,
    });
    assert.ok(upstreamInit?.body);
    const upstream = JSON.parse(String(upstreamInit?.body));
    assert.equal(upstream.model, "gpt-5.6-luna");
    assert.equal(upstream.tools?.[0]?.type, "image_generation");
    assert.equal(upstream.tools?.[0]?.model, "gpt-image-2");
    assert.equal(upstream.tools?.[0]?.action, "edit");
    assert.equal(upstream.tools?.[0]?.input_fidelity, "high");
    assert.equal(upstream.tools?.[0]?.size, "1024x1536");
    const serialized = JSON.stringify(upstream);
    assert.ok(serialized.includes(validBody.playerPhoto));
    assert.ok(serialized.includes("Do not add text, watermarks, sponsor marks or unofficial/official crests"));

    console.log("milestone image endpoint smoke: OK");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
}

void main();
