import assert from "node:assert/strict";
import { playerVisualProfile } from "../src/game/milestone-visual.ts";

const cases = [
  [16, "academy"],
  [18, "academy"],
  [19, "young-pro"],
  [23, "young-pro"],
  [24, "prime"],
  [30, "prime"],
  [31, "veteran"],
  [35, "veteran"],
  [36, "legacy"],
  [42, "legacy"],
] as const;

for (const [age, stage] of cases) {
  const profile = playerVisualProfile(age);
  assert.equal(profile.age, age, `visual age must preserve career age ${age}`);
  assert.equal(profile.stage, stage, `${age} should map to ${stage}`);
  assert.ok(profile.ageDirection.length > 20, `${age} needs usable image-backend direction`);
}

assert.equal(playerVisualProfile(12).age, 16, "visual age must never regress below career start");
assert.equal(playerVisualProfile(70).age, 50, "visual age must stay inside renderer-safe bounds");
assert.equal(playerVisualProfile(Number.NaN).age, 16, "invalid save age must fail safe");

console.log("visual-age share QA passed: deterministic career-age continuity is renderer-safe");
