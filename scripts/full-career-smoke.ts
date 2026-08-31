import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import type { GameState, Player } from "../src/game/types";

function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function finiteState(s: GameState) {
  const nums = [s.age, s.seasonIndex, s.overall, s.potential, s.form, s.fitness, s.morale, s.discipline, s.fame];
  assert(nums.every(Number.isFinite), `Non-finite state detected at age ${s.age}`);
  assert(s.age >= 16 && s.age <= 45, `Impossible age ${s.age}`);
  assert(s.overall >= 0 && s.overall <= 100, `Invalid overall ${s.overall}`);
}

function player(seed: number): Player {
  return {
    name: `QA Player ${seed}`,
    nickname: "",
    position: seed % 3 === 0 ? "DC" : seed % 3 === 1 ? "MC" : "DFC",
    nationality: "España",
    city: seed % 2 === 0 ? "Madrid" : "Sevilla",
    avatar: null,
    traits: seed % 2 === 0 ? ["ambicioso", "profesional"] : ["leal", "familiar"],
  };
}

function resolvePending(s: GameState): GameState {
  if (s.lastOutcome) return advance(s);
  if (!s.pending) return advance(s);

  if (s.pending.type === "season") return advance(s);

  if (s.pending.type === "match") {
    const key = s.pending.match.keyMoment?.options[0]?.id;
    if (s.pending.match.keyMoment) {
      assert(s.pending.match.keyMoment.options.length === 3, `Match key moment has ${s.pending.match.keyMoment.options.length} choices; expected 3`);
    }
    return resolveMatch(s, s.pending.match, key);
  }

  if (s.pending.type === "event") {
    const event = eventById(s.pending.eventId);
    assert(event, `Missing event ${s.pending.eventId}`);
    assert(event.choices.length === 3, `Event ${event.id} (${event.title}) has ${event.choices.length} choices; expected 3`);
    return resolveEvent(s, event.id, event.choices[0]!.id);
  }

  const view = renderDynamic(s, s.pending);
  const informational = new Set(["promotion", "growth", "career_end"]);
  if (!informational.has(s.pending.kind)) {
    assert(
      view.choices.length === 3,
      `Dynamic ${s.pending.kind} (${view.title}) has ${view.choices.length} choices [${view.choices.map((x) => x.id).join(", ")}]; expected 3`,
    );
  }
  const choice = view.choices[0];
  assert(choice, `Dynamic ${s.pending.kind} (${view.title}) has no actionable choice`);
  return resolveDynamicCard(s, s.pending, choice.id);
}

function runCareer(seed: number) {
  const originalRandom = Math.random;
  Math.random = rng(seed);
  try {
    let s = createGame(player(seed));
    assert(s.offers.length >= 3, `Seed ${seed}: fewer than 3 club offers`);
    s = chooseClub(s, s.offers[0]!.clubId);

    let steps = 0;
    let reachedEndCard = false;
    let lastAge = s.age;
    let seasonsObserved = 0;

    while (steps < 5000) {
      finiteState(s);
      if (s.pending?.type === "dynamic" && s.pending.kind === "career_end") {
        reachedEndCard = true;
        break;
      }
      s = resolvePending(s);
      steps += 1;
      if (s.age > lastAge) {
        seasonsObserved += s.age - lastAge;
        lastAge = s.age;
      }
    }

    assert(reachedEndCard, `Seed ${seed}: career stalled before career_end after ${steps} actions (age ${s.age})`);
    assert(s.retired === true, `Seed ${seed}: career_end reached without retired=true`);
    assert(seasonsObserved >= 12, `Seed ${seed}: career ended too early after ${seasonsObserved} seasons`);
    assert(s.age >= 30 && s.age <= 42, `Seed ${seed}: implausible retirement age ${s.age}`);
    assert(s.seasons.length >= 13, `Seed ${seed}: insufficient season history ${s.seasons.length}`);

    return {
      seed,
      steps,
      age: s.age,
      overall: s.overall,
      peak: Math.max(...s.seasons.map((x) => x.overall), s.overall),
      seasons: s.seasons.length,
      stage: s.stage,
      retired: s.retired,
    };
  } finally {
    Math.random = originalRandom;
  }
}

const results = Array.from({ length: 12 }, (_, i) => runCareer(1001 + i * 97));
const peaks = new Set(results.map((r) => r.peak));
const retirementAges = new Set(results.map((r) => r.age));

assert(peaks.size >= 3, `Careers converge too strongly: only ${peaks.size} distinct peak overalls`);
assert(retirementAges.size >= 2, `Retirement ages converge completely: ${[...retirementAges].join(", ")}`);

console.table(results);
console.log(`FULL_CAREER_SMOKE_OK careers=${results.length} distinctPeaks=${peaks.size} retirementAges=${retirementAges.size}`);
