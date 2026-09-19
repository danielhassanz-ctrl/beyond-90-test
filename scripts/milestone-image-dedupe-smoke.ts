import assert from "node:assert/strict";
import { HttpMilestoneImageProvider } from "../src/game/milestone-image-provider";
import type { MilestoneImageRequest } from "../src/game/milestone-image-provider";

const request: MilestoneImageRequest = {
  playerPhoto: "data:image/png;base64,cGxheWVy",
  brief: {
    scene: "presentation",
    identityRule: "Preserve the exact recognisable identity of the persisted player photo.",
    ageRule: "Render the same person at career age 21.",
    clubRule: "Use configured club colours only.",
    composition: "football signing presentation",
    prohibited: ["identity drift"],
  },
  output: { width: 1200, height: 800 },
};

const originalFetch = globalThis.fetch;
let calls = 0;

globalThis.fetch = (async () => {
  calls += 1;
  await new Promise((resolve) => setTimeout(resolve, 20));
  return new Response(JSON.stringify({
    imageUrl: "data:image/png;base64,Z2VuZXJhdGVk",
    provider: "qa-provider",
    generated: true,
  }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

try {
  const provider = new HttpMilestoneImageProvider("/api/qa-milestone-image");
  const [first, second] = await Promise.all([
    provider.generate(request),
    provider.generate(request),
  ]);

  assert.equal(calls, 1, "identical concurrent requests must share one paid provider call");
  assert.deepEqual(first, second, "deduped callers must receive the same generated result");

  const cached = await provider.generate(request);
  assert.equal(calls, 1, "a successful identical request must be served from the page-lifetime cache");
  assert.deepEqual(cached, first);

  console.log("milestone image dedupe smoke passed");
} finally {
  globalThis.fetch = originalFetch;
}
