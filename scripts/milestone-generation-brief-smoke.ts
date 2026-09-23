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

// Premium signing imagery must belong to the player's own career. Mentions of
// teammates, rivals or transfer-market news must remain ordinary career cards
// so they cannot trigger a paid image generation request for the wrong person.
for (const headline of [
  "Tu compañero completa su fichaje por el Valencia",
  "Un rival es fichado por el Sevilla",
  "Otro jugador negocia su traspaso al Villarreal",
  "El nuevo compañero posa en su presentación con el club",
  "El nuevo fichaje del club firma por tres temporadas",
  "Fichaje rival: presentación en el estadio",
  "Mercado: traspaso cerrado por el próximo rival",
]) {
  const ordinaryCard = milestoneVisualSpec(share(headline));
  assert.equal(ordinaryCard.kind, "career", headline);
  assert.equal(ordinaryCard.scene, "portrait", headline);
}

const debut = milestoneVisualSpec(share("Debut con el primer equipo"));
const debutBrief = milestoneGenerationBrief(debut, playerVisualProfile(18), "Real Betis", identity);
assert.equal(debut.scene, "pitch");
assert.match(debutBrief.composition, /on the pitch with the ball/i);
assert.match(debutBrief.ageRule, /career age 18/i);
assertRightsSafe(debutBrief.composition);

for (const headline of [
  "Debut con el juvenil",
  "Debut con el filial",
  "Debut con el equipo B",
  "Debut en la cantera",
  "Primer partido con el sub-19",
  "Primer partido con el equipo reserva",
  "Debut del juvenil en Liga",
  "Primer partido del filial en Copa",
  "Estreno del equipo B en Liga",
  "Debut de la nueva camiseta",
  "Estreno de tus nuevas botas",
  "Estreno de la campaña publicitaria",
]) {
  const ordinaryCard = milestoneVisualSpec(share(headline));
  assert.equal(ordinaryCard.kind, "career", headline);
  assert.equal(ordinaryCard.scene, "portrait", headline);
}

for (const headline of ["Debut en Liga con el primer equipo", "Primer partido profesional", "Estreno como titular en Copa"]) {
  const seniorDebut = milestoneVisualSpec(share(headline));
  assert.equal(seniorDebut.kind, "debut", headline);
  assert.equal(seniorDebut.scene, "pitch", headline);
}

const trophy = milestoneVisualSpec(share("Campeón de Liga"));
const trophyBrief = milestoneGenerationBrief(trophy, playerVisualProfile(29), "Real Betis", identity);
assert.equal(trophy.scene, "celebration");
assert.match(trophyBrief.composition, /emotional celebration/i);
assertRightsSafe(trophyBrief.composition);

for (const headline of ["Ganas la Copa", "Levantas la Champions", "Conquistas el Mundial", "Ganas el Balón de Oro", "Ganas un título", "Levantas un trofeo", "Campeón de Liga", "Campeona de la Copa", "Campeones de Champions", "Campeón del Mundial", "Campeona de la Eurocopa", "Campeón de la Supercopa"]) {
  assert.equal(milestoneVisualSpec(share(headline)).kind, "trophy", headline);
}

for (const headline of [
  "Próximo partido de Liga ante el Sevilla",
  "Convocado para la Copa del Rey",
  "Viaje de Champions a Milán",
  "La final de Copa se acerca",
  "Objetivo: clasificar al Mundial",
  "Pierdes la final de Copa",
  "Subcampeón de Liga",
  "Eliminado de la Champions",
  "No ganas ningún título esta temporada",
  "Te quedas sin el Balón de Oro",
  "Nominado al Balón de Oro",
  "Sueñas con ganar el Balón de Oro",
  "Eres finalista del The Best",
  "Segundo en el Balón de Oro: ganas el premio al mejor joven",
  "Balón de Oro: terminas tercero pese a ganar la Liga",
  "Favorito al Balón de Oro después de ganar la Champions",
  "Celebras la clasificación a Champions",
  "Ganas el partido que certifica tu clasificación al Mundial",
  "Billete a la Europa League tras ganar la última jornada",
  "Ganas 2-0 en Liga ante el Sevilla",
  "Victoria: ganas al Milan en Champions",
  "Celebras un 3-1 en Copa del Rey",
  "Campeón de invierno tras una gran primera vuelta",
  "Campeón moral pese a perder la final",
  "Campeón del vestuario por cómo has arropado a los jóvenes",
  "Campeona de la afición tras volver de la lesión",
  "Campeones de la prensa por vuestra transparencia",
  "Campeón del mercado por renovar a tiempo",
  "Campeona de las redes tras una semana viral",
  "Campeón de la paciencia durante la recuperación",
  "Te sientes campeón después de volver a entrenar",
  "Tu padre te llama campeón tras superar la lesión",
  "El míster dice que eres un campeón fuera del campo",
  "Campeones de pretemporada tras tres amistosos",
  "Campeón del torneo de pretemporada",
  "Campeona del torneo amistoso",
  "Campeones del trofeo de invierno",
  "Campeonas del trofeo de amistosas",
  "Campeón de verano tras tres amistosos",
  "Campeona del torneo de verano",
  "Campeones del trofeo veraniego",
  "Campeonas del torneo veraniego",
  "El trofeo espera al ganador de la final",
  "Visitas la sala de trofeos del club",
  "El título de Liga es el gran objetivo del vestuario",
  "Hablas con tu familia sobre el próximo título",
]) {
  const ordinaryCard = milestoneVisualSpec(share(headline));
  assert.equal(ordinaryCard.kind, "career", headline);
  assert.equal(ordinaryCard.scene, "portrait", headline);
}

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
