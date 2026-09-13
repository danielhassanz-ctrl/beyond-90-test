import { ensureCareerCast } from "../src/game/career-life";
import { createGame, resolveEvent } from "../src/game/engine";
import { eventById } from "../src/game/events";
import { forceOpeningPending, initializeOpening, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
import type { Player } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function player(seed: number): Player {
  return {
    name: `Adviser QA ${seed}`,
    nickname: "",
    position: "MC",
    nationality: "España",
    city: "Sevilla",
    avatar: null,
    traits: ["familiar", "leal"],
  };
}

function advanceOpeningEvent(state: ReturnType<typeof createGame>, eventId: string, choiceId: string) {
  assert(state.pending?.type === "event", `expected ${eventId}, got ${state.pending?.type ?? "none"}`);
  assert(state.pending.eventId === eventId, `expected ${eventId}, got ${state.pending.eventId}`);
  assert(eventById(eventId)?.choices.some((choice) => choice.id === choiceId), `missing choice ${eventId}/${choiceId}`);
  const resolved = resolveEvent(state, eventId, choiceId);
  return forceOpeningPending(resolved) ?? resolved;
}

let reproducedFatherSeed = false;
for (let seed = 1; seed <= 500; seed += 1) {
  let state = createGame(player(seed));
  state.careerSeed = seed;
  initializeOpening(state);
  const provisional = ensureCareerCast(state);
  if (provisional.adviserKind !== "father") continue;

  reproducedFatherSeed = true;
  state = advanceOpeningEvent(state, "opening_home_family", "familia");
  assert((state.flags[OPENING_PHASE] ?? -1) === OpeningPhase.ADVISER, `seed ${seed}: adviser phase not reached`);
  state = advanceOpeningEvent(state, "opening_adviser_choice", "agent");

  const selected = ensureCareerCast(state);
  assert(selected.adviserKind === "agent", `seed ${seed}: professional choice did not persist`);
  assert(selected.adviser.role === "Representante", `seed ${seed}: wrong professional adviser role ${selected.adviser.role}`);
  assert(selected.adviser.name !== "Papá", `seed ${seed}: professional representative is still named Papá`);
  assert(selected.adviser.name !== "Álex Romero", `seed ${seed}: professional representative leaked friend placeholder`);
  assert(state.agent.name === selected.adviser.name, `seed ${seed}: agent state/cast name drift`);
  assert(state.agentName === selected.adviser.name, `seed ${seed}: legacy agentName/cast drift`);

  const hydrated = JSON.parse(JSON.stringify(state));
  const afterReload = ensureCareerCast(hydrated);
  assert(afterReload.adviserKind === "agent", `seed ${seed}: adviser kind changed after hydration`);
  assert(afterReload.adviser.name === selected.adviser.name, `seed ${seed}: adviser name changed after hydration`);
  assert(afterReload.adviser.role === "Representante", `seed ${seed}: adviser role changed after hydration`);
  break;
}

assert(reproducedFatherSeed, "could not find deterministic seed with provisional father adviser");
console.log("ADVISER_CHOICE_IDENTITY_OK: choosing a professional representative cannot retain father/friend placeholder identity and survives save hydration.");
