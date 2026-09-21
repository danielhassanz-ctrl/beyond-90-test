import assert from "node:assert/strict";
import { clubVisualIdentity, hasExactClubVisualIdentity, hasReadablePrimary } from "../src/game/club-identity";
import { CLUB_POOL, EURO_POOL } from "../src/game/clubs";
import { milestoneGenerationBrief, milestoneVisualSpec, playerVisualProfile } from "../src/game/milestone-visual";
import type { ShareData } from "../src/game/types";

function share(headline: string): ShareData {
  return { headline, kicker: "Temporada 2034/35", lines: [] };
}

function assertRightsSafe(text: string): void {
  assert.doesNotMatch(text, /official (?:club )?(?:crest|badge|logo)/i);
  assert.doesNotMatch(text, /sponsor(?:ship)? (?:logo|mark)/i);
}

for (const club of [...CLUB_POOL, ...EURO_POOL]) {
  assert.ok(hasExactClubVisualIdentity(club.id), `${club.id}: missing exact milestone palette`);
  const visual = clubVisualIdentity(club.id);
  assert.match(visual.primary, /^#[0-9a-f]{6}$/i, `${club.id}: invalid primary colour`);
  assert.match(visual.secondary, /^#[0-9a-f]{6}$/i, `${club.id}: invalid secondary colour`);
  assert.match(visual.text, /^#[0-9a-f]{6}$/i, `${club.id}: invalid text colour`);
  assert.equal(visual.crestAsset, null, `${club.id}: official crest assets are not rights-cleared`);
  assert.ok(hasReadablePrimary(visual), `${club.id}: milestone primary surface is not readable`);
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

const presentationSigning = milestoneVisualSpec(share("Presentación en el Real Betis"));
assert.equal(presentationSigning.kind, "signing");
assert.equal(presentationSigning.scene, "presentation");

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

const ligamentInjury = milestoneVisualSpec(share("Lesión de ligamento: seis meses fuera"));
assert.equal(ligamentInjury.kind, "career");
assert.equal(ligamentInjury.scene, "portrait");

for (const headline of ["Ficha médica tras la lesión", "Actualizamos tu ficha técnica"]) {
  const ordinaryCard = milestoneVisualSpec(share(headline));
  assert.equal(ordinaryCard.kind, "career", headline);
  assert.equal(ordinaryCard.scene, "portrait", headline);
}

for (const headline of ["Presentación ante la prensa", "Presentación de la nueva campaña", "Presentación médica de pretemporada"]) {
  const ordinaryCard = milestoneVisualSpec(share(headline));
  assert.equal(ordinaryCard.kind, "career", headline);
  assert.equal(ordinaryCard.scene, "portrait", headline);
}

const retirement = milestoneVisualSpec(share("Despedida: fin de carrera"));
const retirementBrief = milestoneGenerationBrief(retirement, playerVisualProfile(38), "Real Betis", identity);
assert.equal(retirement.scene, "farewell");
assert.match(retirementBrief.composition, /stadium goodbye/i);
assert.match(retirementBrief.ageRule, /career age 38/i);
assert.match(retirementBrief.ageRule, /identity-preserving/i);
assertRightsSafe(retirementBrief.composition);

// Regression: `retirada` is common outside career retirement. These cards must
// stay ordinary portraits so we never spend a generated farewell on an injury,
// cash action or transfer-market withdrawal.
for (const headline of [
  "Retirada por lesión en el minuto 32",
  "Retirada de efectivo para la entrada de la casa",
  "El club confirma la retirada de la oferta de fichaje",
  "Retirada del mercado de traspasos",
]) {
  const ordinaryCard = milestoneVisualSpec(share(headline));
  assert.equal(ordinaryCard.kind, "career", headline);
  assert.equal(ordinaryCard.scene, "portrait", headline);
}

for (const headline of ["Anuncias tu retirada", "Te retiras del fútbol", "Cuelgas las botas"]) {
  const farewell = milestoneVisualSpec(share(headline));
  assert.equal(farewell.kind, "retirement", headline);
  assert.equal(farewell.scene, "farewell", headline);
}

for (const brief of [signingBrief, debutBrief, trophyBrief, retirementBrief]) {
  assert.match(brief.clubRule, /Do not invent or reproduce an official crest/i);
  assert.match(brief.clubRule, /sponsor mark/i);
  assert.ok(brief.prohibited.includes("official crest without cleared rights"));
  assert.ok(brief.prohibited.includes("sponsor logo without cleared rights"));
}

console.log("milestone generation brief smoke: OK");
