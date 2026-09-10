import assert from "node:assert/strict";
import {
  CAREER_MODES,
  DEFAULT_CAREER_MODE,
  applyCareerPacing,
  careerModeConfig,
  careerModeOf,
  keyMatchTarget,
  narrativeTarget,
  setCareerMode,
  type CareerMode,
} from "../src/game/pacing";
import type { GameState, Slot } from "../src/game/types";

function state(mode?: CareerMode): GameState {
  const queue: Slot[] = [
    { kind: "event", category: "preseason" },
    { kind: "match", tag: "debut" },
    { kind: "sim", matches: 5 },
    { kind: "event", category: "training" },
    { kind: "match", tag: "scouts" },
    { kind: "sim", matches: 5 },
    { kind: "event", category: "life" },
    { kind: "match", tag: "euro" },
    { kind: "sim", matches: 5 },
    { kind: "event", category: "agent" },
    { kind: "match", tag: "cup" },
    { kind: "sim", matches: 5 },
    { kind: "event", category: "press" },
    { kind: "match", tag: "decisive" },
    { kind: "sim", matches: 5 },
    { kind: "event", category: "story" },
    { kind: "match", tag: "scouts" },
    { kind: "sim", matches: 4 },
    { kind: "event", category: "life" },
  ];
  const s = {
    careerSeed: 12345,
    seasonIndex: 3,
    clubId: "real-madrid",
    queue,
    flags: {},
    director: { budget: 7 },
  } as unknown as GameState;
  if (mode) setCareerMode(s, mode);
  return s;
}

assert.equal(careerModeOf(state()), DEFAULT_CAREER_MODE, "legacy saves must default to Standard");
assert.deepEqual(CAREER_MODES.map((m) => [m.id, ...m.decisions]), [
  ["express", 10, 15],
  ["standard", 20, 25],
  ["pro", 30, 40],
]);

for (const mode of ["express", "standard", "pro"] as const) {
  const s = state(mode);
  const config = careerModeConfig(mode);
  const n = narrativeTarget(s);
  const k = keyMatchTarget(s);
  assert.ok(n >= config.narrative[0] && n <= config.narrative[1], `${mode}: narrative target outside range`);
  assert.ok(k >= config.keyMatches[0] && k <= config.keyMatches[1], `${mode}: key-match target outside range`);

  applyCareerPacing(s);
  assert.equal(s.director?.budget, n, `${mode}: director budget not updated`);
  const interactive = s.queue.filter((x) => x.kind === "event" || x.kind === "agent" || x.kind === "life").length;
  const matches = s.queue.filter((x) => x.kind === "match").length;
  assert.ok(interactive >= n, `${mode}: not enough interactive narrative slots`);
  assert.ok(matches <= Math.max(k, 3), `${mode}: too many key matches after pacing`);

  const before = JSON.stringify(s.queue);
  applyCareerPacing(s);
  assert.equal(JSON.stringify(s.queue), before, `${mode}: pacing must be idempotent within a season`);
}

console.log("Career pacing smoke: Express / Standard / Pro ranges, legacy default and idempotence OK");
