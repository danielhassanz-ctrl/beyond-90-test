import assert from "node:assert/strict";
import { HttpMilestoneImageProvider, MilestoneImageUnavailableError } from "../src/game/milestone-image-provider";
import type { MilestoneImageRequest } from "../src/game/milestone-image-provider";

const request: MilestoneImageRequest = {
  playerPhoto: "data:image/png;base64,ZmFrZQ==",
  brief: {
    scene: "pitch",
    identityRule: "preserve identity",
    ageRule: "same player at 19",
    clubRule: "club colours only",
    composition: "debut on pitch",
    prohibited: ["identity drift"],
  },
};

const originalFetch = globalThis.fetch;

try {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    throw new Error("fetch must not run for an already-aborted request");
  }) as typeof fetch;

  const alreadyAborted = new AbortController();
  alreadyAborted.abort();
  await assert.rejects(
    () => new HttpMilestoneImageProvider("/api/test").generate(request, { signal: alreadyAborted.signal }),
    (error: unknown) => error instanceof MilestoneImageUnavailableError && /cancelled/.test(error.message),
  );
  assert.equal(calls, 0, "an already-cancelled milestone must never reach the paid backend");

  let backendSawAbort = false;
  globalThis.fetch = ((_: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    calls += 1;
    const signal = init?.signal;
    if (!signal) return reject(new Error("provider request must carry an AbortSignal"));
    signal.addEventListener("abort", () => {
      backendSawAbort = true;
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  })) as typeof fetch;

  const controller = new AbortController();
  const pending = new HttpMilestoneImageProvider("/api/test").generate(request, { signal: controller.signal });
  controller.abort();
  await assert.rejects(
    () => pending,
    (error: unknown) => error instanceof MilestoneImageUnavailableError && /cancelled/.test(error.message),
  );
  assert.equal(backendSawAbort, true, "story advance must abort the in-flight browser request");
  assert.equal(calls, 1, "cancellation smoke should issue exactly one live backend request");

  console.log("milestone image cancellation smoke: passed");
} finally {
  globalThis.fetch = originalFetch;
}
