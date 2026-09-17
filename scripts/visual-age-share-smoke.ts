import assert from "node:assert/strict";
import { milestoneGenerationBrief, playerVisualProfile } from "../src/game/milestone-visual.ts";

const cases = [[16, "academy"], [18, "academy"], [19, "young-pro"], [23, "young-pro"], [24, "prime"], [30, "prime"], [31, "veteran"], [35, "veteran"], [36, "legacy"], [42, "legacy"]] as const;
for (const [age, stage] of cases) {
  const profile = playerVisualProfile(age);
  assert.equal(profile.age, age, `visual age must preserve career age ${age}`);
  assert.equal(profile.stage, stage, `${age} should map to ${stage}`);
  assert.ok(profile.ageDirection.length > 20, `${age} needs usable image-backend direction`);
}
assert.equal(playerVisualProfile(12).age, 16, "visual age must never regress below career start");
assert.equal(playerVisualProfile(70).age, 50, "visual age must stay inside renderer-safe bounds");
assert.equal(playerVisualProfile(Number.NaN).age, 16, "invalid save age must fail safe");

const profile = playerVisualProfile(32);
const signing = milestoneGenerationBrief({ kind: "signing", label: "Nuevo capítulo", scene: "presentation" }, profile, "Real Betis");
assert.match(signing.identityRule, /persisted uploaded player photo/i, "generation must anchor identity to uploaded photo");
assert.match(signing.ageRule, /career age 32/i, "generation must carry exact career age");
assert.match(signing.composition, /signing presentation/i, "signing must request presentation context");
assert.match(signing.clubRule, /Real Betis/, "generation brief must carry current club");
assert.match(signing.clubRule, /Do not invent or reproduce an official crest/i, "rights-safe generation must forbid uncleared official crests");
assert.ok(signing.prohibited.includes("identity drift"), "identity drift must be explicitly forbidden");

const debut = milestoneGenerationBrief({ kind: "debut", label: "Debut", scene: "pitch" }, playerVisualProfile(18), "Villarreal CF");
assert.match(debut.composition, /on the pitch with the ball/i, "debut must request an on-pitch football scene");
assert.match(debut.ageRule, /career age 18/i, "debut must use current career age");

console.log("visual-age share QA passed: deterministic continuity and backend briefs are identity/rights safe");
