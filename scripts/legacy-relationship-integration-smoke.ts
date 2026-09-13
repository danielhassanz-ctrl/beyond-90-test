import { ensureCareerCast, legacyRelationshipHighlight } from "../src/game/career-life";
import { createGame } from "../src/game/engine";
import type { GameState, Player } from "../src/game/types";

const player: Player = {
  name: "Legacy Relationship QA",
  nickname: "LRQA",
  position: "MC",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["familiar", "leal"],
};

function hydrate(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

const state = createGame(player);
state.careerSeed = 909013;
const cast = ensureCareerCast(state);

cast.adviser.relation = 72;
cast.coach.relation = 63;
cast.captain.relation = 68;
cast.physio.relation = 61;
cast.teammate.relation = 70;
cast.partner.relation = 99;
state.flags["partner_active"] = 0;

const withoutPartner = legacyRelationshipHighlight(state);
if (withoutPartner.name !== cast.adviser.name || withoutPartner.role !== cast.adviser.role || withoutPartner.value !== 72) {
  throw new Error(`inactive partner leaked into Legacy highlight: ${JSON.stringify(withoutPartner)}`);
}
if (["Entrenador", "Agente", "Representante", "Vestuario", "Familia", "Afición"].includes(withoutPartner.name)) {
  throw new Error(`Legacy fell back to a generic relationship label: ${withoutPartner.name}`);
}

state.flags["partner_active"] = 1;
const withPartner = legacyRelationshipHighlight(state);
if (withPartner.name !== cast.partner.name || withPartner.role !== "Pareja" || withPartner.value !== 99) {
  throw new Error(`active persistent partner was not eligible for Legacy highlight: ${JSON.stringify(withPartner)}`);
}

const saved = hydrate(state);
const savedCast = ensureCareerCast(saved);
const afterHydration = legacyRelationshipHighlight(saved);
if (afterHydration.name !== savedCast.partner.name || afterHydration.name !== cast.partner.name) {
  throw new Error(`Legacy relationship identity drifted across save hydration: before=${cast.partner.name}; after=${afterHydration.name}`);
}
if (afterHydration.value !== 99) {
  throw new Error(`Legacy relationship strength drifted across save hydration: ${afterHydration.value}`);
}

savedCast.coach.relation = 100;
saved.flags["partner_active"] = 0;
const namedCoach = legacyRelationshipHighlight(saved);
if (namedCoach.name !== savedCast.coach.name || namedCoach.role !== "Entrenador" || namedCoach.value !== 100) {
  throw new Error(`club-bound persistent coach did not surface by name: ${JSON.stringify(namedCoach)}`);
}

console.log(`Legacy relationship integration QA OK: adviser=${cast.adviser.name}; partner=${cast.partner.name}; coach=${savedCast.coach.name}`);
