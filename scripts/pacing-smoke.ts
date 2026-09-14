import assert from "node:assert/strict";
import { careerEra, ensureCareerCast } from "../src/game/career-life";
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

function stateAtAge(age: number): GameState {
  const s = createGame(player);
  s.age = age;
  return s;
}

assert.deepEqual(
  [16, 18, 19, 21, 22, 25, 26, 30, 31, 34, 35, 39].map((age) => [age, careerEra(stateAtAge(age))]),
  [
    [16, "academy"], [18, "academy"],
    [19, "breakthrough"], [21, "breakthrough"],
    [22, "established"], [25, "established"],
    [26, "prime"], [30, "prime"],
    [31, "veteran"], [34, "veteran"],
    [35, "legacy"], [39, "legacy"],
  ],
  "career era boundaries must match the Story Director chronology",
);

function assertAdviser(seed: number) {
  const s = createGame(player);
  s.careerSeed = seed;
  const cast = ensureCareerCast(s);
  assert.ok(["agent", "father", "friend"].includes(cast.adviserKind), `${seed}: invalid adviser kind`);
  assert.ok(cast.adviser.name.length > 0, `${seed}: adviser must have a persistent name`);
  assert.equal(s.agent.present, true, `${seed}: adviser must participate from scene one`);
  assert.equal(s.hasAgent, true, `${seed}: legacy adviser flag must stay in sync`);
  assert.equal(s.agent.name, cast.adviser.name, `${seed}: AgentState must route through the career adviser`);
  assert.equal(s.agentName, cast.adviser.name, `${seed}: visible adviser name must stay in sync`);
  assert.ok(s.rel.agent > 0, `${seed}: adviser relationship must be initialized`);
  assert.equal(s.memory.npcs.adviser?.name, cast.adviser.name, `${seed}: adviser must be persisted as an NPC`);
  const again = ensureCareerCast(s);
  assert.equal(again.adviser.name, cast.adviser.name, `${seed}: adviser identity must not reroll`);
  assert.equal(again.adviserKind, cast.adviserKind, `${seed}: adviser role must not reroll`);
}

function assertMode(mode: CareerMode, seed: number) {
  let s = createGame(player);
  s.careerSeed = seed;
  ensureCareerCast(s);
  setCareerMode(s, mode);
  const firstOffer = s.offers[0];
  assert.ok(firstOffer, "new career must have a club offer");
  s = chooseClub(s, firstOffer.clubId);
  ensureCareerCast(s);
  setCareerMode(s, mode);

  const before = countPlan(s);
  applyCareerPacing(s);

  const cfg = careerModeConfig(mode);
  const actual = countPlan(s);
  // Density targets are ceilings. The scheduler may compress excess material,
  // but it must never manufacture generic narrative slots just to hit a quota.
  assert.ok(actual.narrative <= narrativeTarget(s), `${mode}/${seed}: narrative exceeded mode ceiling`);
  assert.ok(actual.narrative <= before.narrative, `${mode}/${seed}: pacing manufactured filler narrative slots`);
  assert.ok(actual.matches <= keyMatchTarget(s), `${mode}/${seed}: key matches exceeded contextual ceiling`);
  assert.ok(actual.decisions <= decisionTarget(s), `${mode}/${seed}: decisions exceeded mode ceiling`);
  assert.ok(actual.decisions <= cfg.decisions[1], `${mode}/${seed}: decisions outside promised maximum`);
  if (s.stage === "first") {
    assert.ok(actual.matches <= cfg.keyMatches[1], `${mode}/${seed}: senior key matches outside cap`);
  } else {
    assert.ok(actual.matches <= 4, `${mode}/${seed}: youth/reserve season is being inflated with key matches`);
  }
  assert.equal(s.agent.present, true, `${mode}/${seed}: adviser must survive club selection`);
  const queueAfterFirstApply = JSON.stringify(s.queue);
  applyCareerPacing(s);
  assert.equal(JSON.stringify(s.queue), queueAfterFirstApply, `${mode}/${seed}: pacing must be idempotent`);
}

function assertSimulationFlashesDoNotConsumeBudget(mode: CareerMode, seed: number) {
  let s = createGame(player);
  s.careerSeed = seed;
  setCareerMode(s, mode);
  const firstOffer = s.offers[0];
  assert.ok(firstOffer, `${mode}/${seed}: new career must have a club offer`);
  s = chooseClub(s, firstOffer.clubId);
  setCareerMode(s, mode);

  // Recreate the exact legacy class that triggered issue #45: a generic
  // match_flash can exist in an old save while ordinary sim slots remain in
  // the season queue. Neither is a meaningful player decision and therefore
  // neither may reduce Express/Standard/Pro ceilings or cause replacement
  // filler to be synthesized.
  s.pending = {
    kind: "match_flash",
    data: { title: "Tarjeta roja", text: "Flash genérico legado de simulación" },
  } as GameState["pending"];
  s.queue.unshift({ kind: "sim" }, { kind: "sim" });
  delete s.flags["career_pacing_season"];
  const narrativeBefore = countPlan(s).narrative;

  applyCareerPacing(s);
  const actual = countPlan(s);
  assert.ok(actual.narrative <= narrativeTarget(s), `${mode}/${seed}: narrative exceeded ceiling with legacy match_flash`);
  assert.ok(actual.narrative <= narrativeBefore, `${mode}/${seed}: legacy match_flash caused replacement narrative filler`);
  assert.ok(actual.matches <= keyMatchTarget(s), `${mode}/${seed}: simulation flash caused key-match inflation`);
  assert.ok(actual.decisions <= decisionTarget(s), `${mode}/${seed}: generic simulation inflated meaningful-decision budget`);
  assert.ok(s.queue.some((slot) => slot.kind === "sim"), `${mode}/${seed}: regression fixture lost all background sim slots`);
}

function assertEmptyNarrativeQueueStaysEmpty(mode: CareerMode, seed: number) {
  let s = createGame(player);
  s.careerSeed = seed;
  setCareerMode(s, mode);
  const firstOffer = s.offers[0];
  assert.ok(firstOffer, `${mode}/${seed}: new career must have a club offer`);
  s = chooseClub(s, firstOffer.clubId);
  setCareerMode(s, mode);

  // Isolate the original quota-filler failure. If a season has only background
  // simulation available, pacing must not turn the missing narrative target into
  // anonymous event/agent/life decisions. Distinct contextual key matches may
  // still be inserted when eligible, but narrative must remain exactly zero.
  s.pending = null;
  s.queue = [{ kind: "sim" }, { kind: "sim" }, { kind: "sim" }];
  delete s.flags["career_pacing_season"];

  applyCareerPacing(s);
  assert.equal(
    s.queue.filter(isNarrativeSlot).length,
    0,
    `${mode}/${seed}: empty authored narrative queue was padded with generic decisions`,
  );
}

for (const seed of [11, 29, 47, 83, 131, 251, 509, 1021]) assertAdviser(seed);
for (const { id } of CAREER_MODES) for (const seed of [11, 29, 47, 83, 131, 251, 509, 1021]) assertMode(id, seed);
for (const { id } of CAREER_MODES) for (const seed of [45, 4500, 450045]) assertSimulationFlashesDoNotConsumeBudget(id, seed);
for (const { id } of CAREER_MODES) for (const seed of [45, 2026, 450045]) assertEmptyNarrativeQueueStaysEmpty(id, seed);
console.log("Career pacing QA passed: era boundaries; pacing targets are ceilings rather than filler quotas; empty authored narrative queues stay empty; youth/reserve match density contextual; adviser active/persistent; generic simulation flashes excluded from meaningful-decision budgets.");