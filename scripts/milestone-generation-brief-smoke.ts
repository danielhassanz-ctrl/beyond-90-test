import assert from "node:assert/strict";
import { clubVisualIdentity } from "../src/game/club-identity";
import { milestoneGenerationBrief, milestoneVisualSpec, playerVisualProfile } from "../src/game/milestone-visual";
import type { ShareData } from "../src/game/types";

function share(headline: string): ShareData {
  return { headline, kicker: "Temporada 2034/35", lines: [] };
}

function assertRightsSafe(text: string): void {
  assert.doesNotMatch(text, /official (?:club )?(?:crest|badge|logo)/i);
  assert.doesNotMatch(text, /sponsor(?:ship)? (?:logo|mark)/i);
}

const identity = clubVisualIdentity("betis");
const signing = milestoneVisualSpec(share("Fichas por el Real Betis"));
const signingBrief = milestoneGenerationBrief(signing, playerVisualProfile(24), "Real Betis", identity);
assert.equal(signing.scene, "presentation");
assert.match(signingBrief.composition, /posing naturally/i);
assert.match(signingBrief.clubRule, /configured club colours only/i);
assert.match(signingBrief.clubRule, new RegExp(identity.primary.replace("#", "#"), "i"));
assert.ok(signingBrief.prohibited.includes("official crest without cleared rights"));
assert.ok(signingBrief.prohibited.includes("identity drift"));
assert.match(signingBrief.identityRule, /persisted uploaded player photo/i);
assertRightsSafe(signingBrief.composition);

const debut = milestoneVisualSpec(share("Debut con el primer equipo"));
const debutBrief = milestoneGenerationBrief(debut, playerVisualProfile(18), "Real Betis", identity);
assert.equal(debut.scene, "pitch");
assert.match(debutBrief.composition, /on the pitch with the ball/i);
assert.match(debutBrief.ageRule, /career age 18/i);
assertRightsSafe(debutBrief.composition);

const trophy = milestoneVisualSpec(share("Campeón de Liga"));
const trophyBrief = milestoneGenerationBrief(trophy, playerVisualProfile(29), "Real Betis", identity);
assert.equal(trophy.scene, "celebration");
assert.match(trophyBrief.composition, /emotional celebration/i);
assertRightsSafe(trophyBrief.composition);

const retirement = milestoneVisualSpec(share("Despedida: fin de carrera"));
const retirementBrief = milestoneGenerationBrief(retirement, playerVisualProfile(38), "Real Betis", identity);
assert.equal(retirement.scene, "farewell");
assert.match(retirementBrief.composition, /stadium goodbye/i);
assert.match(retirementBrief.ageRule, /career age 38/i);
assert.match(retirementBrief.ageRule, /identity-preserving/i);
assertRightsSafe(retirementBrief.composition);

for (const brief of [signingBrief, debutBrief, trophyBrief, retirementBrief]) {
  assert.match(brief.clubRule, /Do not invent or reproduce an official crest/i);
  assert.match(brief.clubRule, /sponsor mark/i);
  assert.ok(brief.prohibited.includes("official crest without cleared rights"));
  assert.ok(brief.prohibited.includes("sponsor logo without cleared rights"));
}

console.log("milestone generation brief smoke: OK");
