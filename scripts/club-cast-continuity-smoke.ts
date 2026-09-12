import { ensureCareerCast } from "../src/game/career-life";
import { moveToClub } from "../src/game/career";
import { createGame } from "../src/game/engine";
import type { Player } from "../src/game/types";

const player: Player = {
  name: "QA Transfer Player",
  nickname: "QA",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["ambicioso", "profesional"],
};

const state = createGame(player);
state.careerSeed = 681204;
state.clubId = "betis";
state.stage = "first";
state.age = 22;
state.salary = 240;
state.contract = "3 temporadas";
state.contractYears = 3;

const first = ensureCareerCast(state);
const firstNames = {
  adviser: first.adviser.name,
  social: first.social.name,
  coach: first.coach.name,
  captain: first.captain.name,
  physio: first.physio.name,
  teammate: first.teammate.name,
};

const repeated = ensureCareerCast(state);
for (const key of ["adviser", "social", "coach", "captain", "physio", "teammate"] as const) {
  if (repeated[key].name !== firstNames[key]) {
    throw new Error(`${key} changed without a club move: ${firstNames[key]} -> ${repeated[key].name}`);
  }
}

moveToClub(state, "real-madrid", 650, 4, false);
const afterTransfer = ensureCareerCast(state);

for (const key of ["adviser", "social"] as const) {
  if (afterTransfer[key].name !== firstNames[key]) {
    throw new Error(`${key} should survive a club move: ${firstNames[key]} -> ${afterTransfer[key].name}`);
  }
}

for (const key of ["coach", "captain", "physio", "teammate"] as const) {
  if (afterTransfer[key].name === firstNames[key]) {
    throw new Error(`${key} incorrectly followed the player from Betis to Real Madrid: ${afterTransfer[key].name}`);
  }
}

const stableAtDestination = ensureCareerCast(state);
for (const key of ["adviser", "social", "coach", "captain", "physio", "teammate"] as const) {
  if (stableAtDestination[key].name !== afterTransfer[key].name) {
    throw new Error(`${key} is not stable after transfer: ${afterTransfer[key].name} -> ${stableAtDestination[key].name}`);
  }
}

console.log(
  `Club cast continuity QA OK: adviser=${afterTransfer.adviser.name}; social=${afterTransfer.social.name}; ` +
    `new coach=${afterTransfer.coach.name}; captain=${afterTransfer.captain.name}; physio=${afterTransfer.physio.name}; teammate=${afterTransfer.teammate.name}`,
);
