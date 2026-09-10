import assert from "node:assert/strict";
import { chooseClub, createGame } from "../src/game/engine";
import {
  CAREER_MODES,
  DEFAULT_CAREER_MODE,
  applyCareerPacing,
  careerModeConfig,
  careerModeOf,
  decisionTarget,
  keyMatchTarget,
  narrativeTarget,
  setCareerMode,
  type CareerMode,
} from "../src/game/pacing";
import type { GameState, Player, Slot } from "../src/game/types";

const player: Player = {
  name: "QA Player",
  nickname: "",
  position: "MC",
  nationality: "España",
  city: "Madrid",
  avatar: null,
  traits: ["ambicioso", "profesional"],
};

const isNarrativeSlot = (slot: Slot) => slot.kind === "event" || slot.kind === "agent" || slot.kind === "life";

function countPlan(s: GameState) {
  const openNarrative = s.pending?.type === "event" ? 1 : 0;
  const openMatches = s.pending?.type === "match" ? 1 : 0;
  const narrative = openNarrative + s.queue.filter(isNarrativeSlot).length;
  const matches = openMatches + s.queue.filter((x) => x.kind === "match").length;
  const simulated = s.queue.reduce((sum, slot) => sum + (slot.kind === "sim" ? (slot.matches ?? 0) : 0), 0);
  return { narrative, matches, decisions: narrative + matches, simulated, seasonMatches: matches + simulated };
}

assert.equal(careerModeOf(createGame(player)), DEFAULT_CAREER_MODE, "legacy/new states without a mode must default to Standard");
assert.deepEqual(CAREER_MODES.map((m) => [m.id, ...m.decisions]), [
  ["express", 10, 15],
  ["standard", 20, 25],
  ["pro", 30, 40],
]);

function assertMode(mode: CareerMode, seed: number) {
  let s = createGame(player);
  s.careerSeed = seed;
  setCareerMode(s, mode);
  const firstOffer = s.offers[0];
  assert.ok(firstOffer, "a new career must have an initial club offer");

  // chooseClub opens the first card immediately. The open card MUST count in
  // the advertised season budget; this protects Nueva carrera from +1 drift.
  s = chooseClub(s, firstOffer.clubId);
  setCareerMode(s, mode);
  applyCareerPacing(s);

  const config = careerModeConfig(mode);
  const expectedNarrative = narrativeTarget(s);
  const expectedMatches = keyMatchTarget(s);
  const expectedDecisions = decisionTarget(s);
  const actual = countPlan(s);

  assert.equal(actual.narrative, expectedNarrative, `${mode}/${seed}: wrong narrative decision count`);
  assert.equal(actual.matches, expectedMatches, `${mode}/${seed}: wrong key-match count`);
  assert.equal(actual.decisions, expectedDecisions, `${mode}/${seed}: wrong total decision count`);
  assert.ok(
    actual.decisions >= config.decisions[0] && actual.decisions <= config.decisions[1],
    `${mode}/${seed}: ${actual.decisions} outside ${config.decisions[0]}-${config.decisions[1]}`,
  );
  assert.ok(
    actual.matches >= config.keyMatches[0] && actual.matches <= config.keyMatches[1],
    `${mode}/${seed}: ${actual.matches} key matches outside ${config.keyMatches[0]}-${config.keyMatches[1]}`,
  );
  assert.equal(actual.seasonMatches, 34, `${mode}/${seed}: pacing must keep the football calendar at 34 matches, got ${actual.seasonMatches}`);

  const before = JSON.stringify(s.queue);
  applyCareerPacing(s);
  assert.equal(JSON.stringify(s.queue), before, `${mode}/${seed}: pacing must be idempotent within a season`);
}

for (const { id } of CAREER_MODES) {
  for (const seed of [11, 29, 47, 83, 131, 251, 509, 1021]) assertMode(id, seed);
}

console.log("Career pacing QA passed: Express 10-15, Standard 20-25, Pro 30-40; open cards count, key matches stay capped, and seasons stay at 34 matches.");