import { ensureCareerCast } from "../src/game/career-life";
import { ALL_EVENTS } from "../src/game/events";
import { createGame, resolveEvent } from "../src/game/engine";
import { initializeOpening, forceOpeningPending } from "../src/game/opening";
import type { GameEvent, GameState, Player } from "../src/game/types";

const player: Player = {
  name: "Narrative QA",
  nationality: "España",
  position: "MCO",
  age: 16,
  traits: ["Talentoso", "Competitivo"],
};

function event(id: string): GameEvent {
  const found = ALL_EVENTS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`missing event ${id}`);
  return found;
}

function text(e: GameEvent, s: GameState): string {
  return typeof e.text === "function" ? e.text(s) : e.text;
}

function resolveOpeningPhysio(choice: "trust" | "tough" | "learn"): GameState {
  let s = initializeOpening(createGame(player));
  // This smoke isolates the final opening decision: the earlier opening chain is
  // covered by opening-flow-smoke. We intentionally preserve the same cast.
  ensureCareerCast(s);
  s.flags.opening_phase = 9;
  s.flags.people_physio_intro = 0;
  s = forceOpeningPending(s) ?? s;
  if (s.pending?.type !== "event" || s.pending.eventId !== "opening_named_physio") {
    throw new Error(`expected opening_named_physio, got ${s.pending?.type === "event" ? s.pending.eventId : s.pending?.type ?? "nothing"}`);
  }
  return resolveEvent(s, choice);
}

const callback = event("people_physio_injury_callback");
const cases = [
  { choice: "trust" as const, expected: "me hiciste caso" },
  { choice: "tough" as const, expected: "seguiste entrenando" },
  { choice: "learn" as const, expected: "rutina" },
];

for (const probe of cases) {
  const s = resolveOpeningPhysio(probe.choice);
  s.injury = { label: "Sobrecarga muscular", weeks: 3 } as GameState["injury"];
  const rendered = text(callback, s).toLowerCase();
  if (!rendered.includes(probe.expected.toLowerCase())) {
    throw new Error(`opening physio choice ${probe.choice} was forgotten by injury callback: ${rendered}`);
  }
}

console.log("Opening physio memory QA OK: all three opening choices produce distinct injury callbacks.");
