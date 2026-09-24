import assert from "node:assert/strict";
import { clubVisualIdentity, hasExactClubVisualIdentity, hasReadablePrimary } from "../src/game/club-identity";
import { CLUB_POOL, EURO_POOL } from "../src/game/clubs";
import { milestoneGenerationBrief, milestoneVisualSpec, playerVisualProfile } from "../src/game/milestone-visual";
import type { ShareData } from "../src/game/types";

function share(headline: string): ShareData {
  return { headline, kicker: "Temporada 2034/35", lines: [] };
}
function contextualShare(headline: string, lines: ShareData["lines"]): ShareData {
  return { headline, kicker: "Temporada 2034/35", lines };
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
assert.equal(milestoneVisualSpec(share("Presentación en el Real Betis")).kind, "signing");
for (const headline of ["Tu compañero completa su fichaje por el Valencia", "Un rival es fichado por el Sevilla", "Otro jugador negocia su traspaso al Villarreal", "El nuevo compañero posa en su presentación con el club", "El nuevo fichaje del club firma por tres temporadas", "Fichaje rival: presentación en el estadio", "Mercado: traspaso cerrado por el próximo rival"]) assert.equal(milestoneVisualSpec(share(headline)).kind, "career", headline);

const debut = milestoneVisualSpec(share("Debut con el primer equipo"));
const debutBrief = milestoneGenerationBrief(debut, playerVisualProfile(18), "Real Betis", identity);
assert.equal(debut.scene, "pitch");
assert.match(debutBrief.composition, /on the pitch with the ball/i);
assert.match(debutBrief.ageRule, /career age 18/i);
assertRightsSafe(debutBrief.composition);
for (const headline of ["Debut con el juvenil", "Debut con el filial", "Debut con el equipo B", "Debut en la cantera", "Primer partido con el sub-19", "Primer partido con el equipo reserva", "Debut del juvenil en Liga", "Primer partido del filial en Copa", "Estreno del equipo B en Liga", "Debut de la nueva camiseta", "Estreno de tus nuevas botas", "Estreno de la campaña publicitaria", "Debut de tu compañero con el primer equipo", "Un rival debuta en Liga", "Primer partido profesional de otro jugador", "El nuevo fichaje debuta en Copa", "Debut del club en Champions", "Estreno del equipo en Europa League", "Tu padre recuerda su debut con el primer equipo", "Tu madre habla de su primer partido profesional", "Tu hermano debuta en Liga con el primer equipo", "Tu hermana recuerda su estreno como titular en Copa", "Tu hijo sueña con su debut profesional", "Tu hija cuenta su primer partido con la selección absoluta", "Tu pareja recuerda su debut en Liga", "Tu novio habla de su primer partido profesional", "Tu novia celebra su estreno como titular en Copa", "Tu amigo debuta con el primer equipo", "Tu amiga recuerda su primer partido profesional"]) assert.equal(milestoneVisualSpec(share(headline)).kind, "career", headline);
for (const headline of ["Debut en Liga con el primer equipo", "Primer partido profesional", "Estreno como titular en Copa"]) assert.equal(milestoneVisualSpec(share(headline)).kind, "debut", headline);

const trophy = milestoneVisualSpec(share("Campeón de Liga"));
const trophyBrief = milestoneGenerationBrief(trophy, playerVisualProfile(29), "Real Betis", identity);
assert.equal(trophy.scene, "celebration");
assert.match(trophyBrief.composition, /emotional celebration/i);
assertRightsSafe(trophyBrief.composition);
for (const headline of ["Ganas la Copa", "Levantas la Champions", "Conquistas el Mundial", "Ganas el Balón de Oro", "Ganas un título", "Levantas un trofeo", "Campeón de Liga", "Campeona de la Copa", "Campeones de Champions", "Campeón del Mundial", "Campeona de la Eurocopa", "Campeón de la Supercopa"]) assert.equal(milestoneVisualSpec(share(headline)).kind, "trophy", headline);
// Youth/academy team honours are deliberately not paid/generated senior milestones.
for (const headline of ["Campeón de Liga juvenil", "Ganas la Copa con el filial", "Levantas un trofeo sub-19", "Campeón de Liga con el equipo B", "Conquistas el título de cantera", "Campeón de Copa con el equipo reserva"]) assert.equal(milestoneVisualSpec(share(headline)).kind, "career", headline);
// Named individual awards are genuine major milestones even when the award itself is age-limited.
for (const headline of ["Ganas el Golden Boy sub-21", "Ganador del Golden Boy sub-21"]) assert.equal(milestoneVisualSpec(share(headline)).kind, "trophy", headline);
// Awards belonging to another person must never trigger a paid/generated player milestone.
for (const headline of ["Premian a tu compañero con el Balón de Oro", "Entregan el Golden Boy a un rival", "Dan el The Best al capitán", "La prensa entrega la Bota de Oro a otro jugador"]) assert.equal(milestoneVisualSpec(share(headline)).kind, "career", headline);

const retirement = milestoneVisualSpec(share("Despedida: fin de carrera"));
const retirementBrief = milestoneGenerationBrief(retirement, playerVisualProfile(38), "Real Betis", identity);
assert.equal(retirement.scene, "farewell");
assert.match(retirementBrief.composition, /stadium goodbye/i);
assert.match(retirementBrief.ageRule, /career age 38/i);
assert.match(retirementBrief.ageRule, /identity-preserving/i);
assertRightsSafe(retirementBrief.composition);
for (const headline of ["Anuncias tu retirada", "Te retiras del fútbol", "Cuelgas las botas"]) assert.equal(milestoneVisualSpec(share(headline)).kind, "retirement", headline);

const contextualMilestones: Array<[ShareData, string]> = [
  [contextualShare("Fichas por el Real Betis", [{ label: "Familia", value: "Tu padre te acompaña a la presentación" }]), "signing"],
  [contextualShare("Debut en Liga con el primer equipo", [{ label: "Vestuario", value: "El capitán te entrega el balón del partido" }]), "debut"],
  [contextualShare("Ganas la Copa", [{ label: "Entrenador", value: "El míster te abraza tras la final" }]), "trophy"],
  [contextualShare("Anuncias tu retirada", [{ label: "Historia", value: "Tu antiguo club y tu familia estarán en la despedida" }]), "retirement"],
  [contextualShare("Debut en Liga con el primer equipo: la afición corea tu nombre", [{ label: "Grada", value: "Los aficionados celebran tu estreno" }]), "debut"],
  [contextualShare("Ganas la Copa ante tu afición", [{ label: "Grada", value: "Los seguidores celebran contigo" }]), "trophy"],
  [contextualShare("Fichas por el Real Betis ante miles de aficionados", [{ label: "Presentación", value: "La grada te recibe" }]), "signing"],
  [contextualShare("Anuncias tu retirada ante la afición", [{ label: "Despedida", value: "Los seguidores te ovacionan" }]), "retirement"],
];
for (const [card, expected] of contextualMilestones) assert.equal(milestoneVisualSpec(card).kind, expected, card.headline);

for (const brief of [signingBrief, debutBrief, trophyBrief, retirementBrief]) {
  assert.match(brief.clubRule, /Do not invent or reproduce an official crest/i);
  assert.match(brief.clubRule, /sponsor mark/i);
  assert.ok(brief.prohibited.includes("official crest without cleared rights"));
  assert.ok(brief.prohibited.includes("sponsor logo without cleared rights"));
}
console.log("milestone generation brief smoke: OK");
