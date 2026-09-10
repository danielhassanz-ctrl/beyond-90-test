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
  const narrative = (s.pending?.type === "event" ? 1 : 0) + s.queue.filter(isNarrativeSlot).length;
  const matches = (s.pending?.type === "match" ? 1 : 0) + s.queue.filter((x) => x.kind === "match").length;
  return { narrative, matches, decisions: narrative + matches };
}

assert.equal(careerModeOf(createGame(player)), DEFAULT_CAREER_MODE, "states without a mode must default to Standard");
assert.deepEqual(CAREER_MODES.map((m) => [m.id, ...m.decisions]), [
  ["express", 10, 15], ["standard", 20, 25], ["pro", 30, 40],
]);

function assertMode(mode: CareerMode, seed: number) {
  let s = createGame(player);
  s.careerSeed = seed;
  setCareerMode(s, mode);
  const firstOffer = s.offers[0];
  assert.ok(firstOffer, "new career must have a club offer");
  s = chooseClub(s, firstOffer.clubId);
  setCareerMode(s, mode);
  applyCareerPacing(s);

  const cfg = careerModeConfig(mode);
  const actual = countPlan(s);
  assert.equal(actual.narrative, narrativeTarget(s), `${mode}/${seed}: wrong narrative count`);
  assert.equal(actual.matches, keyMatchTarget(s), `${mode}/${seed}: wrong key-match count`);
  assert.equal(actual.decisions, decisionTarget(s), `${mode}/${seed}: wrong decision count`);
  assert.ok(actual.decisions >= cfg.decisions[0] && actual.decisions <= cfg.decisions[1], `${mode}/${seed}: decisions outside promised range`);
  assert.ok(actual.matches >= cfg.keyMatches[0] && actual.matches <= cfg.keyMatches[1], `${mode}/${seed}: key matches outside cap`);
  const before = JSON.stringify(s.queue);
  applyCareerPacing(s);
  assert.equal(JSON.stringify(s.queue), before, `${mode}/${seed}: pacing must be idempotent`);
}

for (const { id } of CAREER_MODES) for (const seed of [11, 29, 47, 83, 131, 251, 509, 1021]) assertMode(id, seed);
console.log("Career pacing QA passed: Express 10-15, Standard 20-25, Pro 30-40; current open decision counts and key matches stay capped.");
