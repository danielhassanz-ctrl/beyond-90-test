import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/game/director.ts", import.meta.url), "utf8");

assert.ok(
  !/Math\.random\s*\(/.test(source),
  "Story Director must not use Math.random(): narrative outcomes must be reproducible from careerSeed/state so regressions can be replayed exactly",
);
assert.ok(
  /function deterministicChance\s*\(/.test(source),
  "Story Director must keep a career-seeded probability helper for authored uncertain outcomes",
);
assert.ok(
  /hash\(careerSeed\(s\)/.test(source),
  "Story Director deterministic chance must be grounded in the persisted career seed",
);

console.log("Story Director determinism QA passed: no unseeded Math.random() remains in narrative outcome selection.");
