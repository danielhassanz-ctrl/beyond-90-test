import { ensureCareerCast } from "../src/game/career-life";
import { chooseClub, createGame, resolveEvent } from "../src/game/engine";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening, OPENING_DONE, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
import type { GameState, Player } from "../src/game/types";

const MODES: CareerMode[] = ["express", "standard", "pro"];
const SEEDS = [101, 2026, 31337, 90909];
const expected = [
  "opening_home_family",
  "opening_adviser_choice",
  "opening_first_agreement",
  "opening_signing_day",
  "opening_named_coach",
  "opening_preseason_adaptation",
  "opening_named_captain",
  "opening_named_teammate",
  "opening_named_physio",
];

const player: Player = {
  name: "QA Prospect",
  nickname: "",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["ambicioso", "familiar"],
};

function eventId(s: GameState): string {
  if (s.pending?.type === "match") throw new Error(`match leaked before opening completed at phase ${s.flags[OPENING_PHASE]}`);
  if (s.pending?.type !== "event") return "";
  return s.pending.eventId;
}

function answerAndAdvance(s: GameState, choice = "family"): GameState {
  if (s.pending?.type !== "event") throw new Error(`expected opening event, got ${s.pending?.type ?? "nothing"}`);
  const event = s.pending.eventId;
  const choiceByEvent: Record<string, string> = {
    opening_home_family: choice,
    opening_adviser_choice: "agent",
    opening_first_agreement: "minutes",
    opening_signing_day: "family",
    opening_named_coach: "listen",
    opening_preseason_adaptation: "extra",
    opening_named_captain: "respect",
    opening_named_teammate: "friend",
    opening_named_physio: "trust",
  };
  const resolved = resolveEvent(s, event, choiceByEvent[event] ?? "family");
  return forceOpeningPending(resolved) ?? resolved;
}

for (const mode of MODES) {
  for (const seed of SEEDS) {
    let state = createGame(player);
    state.careerSeed = seed;
    setCareerMode(state, mode);
    ensureCareerCast(state);
    initializeOpening(state);

    if (eventId(state) !== expected[0]) throw new Error(`${mode}/${seed}: first decision is not home/family`);
    state = answerAndAdvance(state);
    if (eventId(state) !== expected[1]) throw new Error(`${mode}/${seed}: second decision is not adviser choice`);
    if (state.pending?.type === "match") throw new Error(`${mode}/${seed}: decision #2 is a football match`);

    // Adviser resolution must stop at club choice instead of leaking into the scheduler.
    const adviserResolved = resolveEvent(state, "opening_adviser_choice", "agent");
    state = forceOpeningPending(adviserResolved) ?? adviserResolved;
    if (state.flags[OPENING_PHASE] !== OpeningPhase.CLUB_CHOICE || state.pending) {
      throw new Error(`${mode}/${seed}: adviser choice did not lead to club evaluation gate`);
    }

    const firstOffer = state.offers[0]?.clubId;
    if (!firstOffer) throw new Error(`${mode}/${seed}: no initial club offers`);
    state = afterOpeningClubChoice(chooseClub(state, firstOffer));

    for (let i = 2; i < expected.length; i++) {
      const actual = eventId(state);
      if (actual !== expected[i]) throw new Error(`${mode}/${seed}: expected ${expected[i]}, got ${actual || "nothing"}`);
      state = answerAndAdvance(state);
    }

    if ((state.flags[OPENING_PHASE] ?? -1) !== OPENING_DONE || state.flags["opening_completed"] !== 1) {
      throw new Error(`${mode}/${seed}: opening did not complete`);
    }

    const cast = ensureCareerCast(state);
    if (!cast.adviser.met || !cast.coach.met || !cast.captain.met || !cast.teammate.met || !cast.physio.met) {
      throw new Error(`${mode}/${seed}: persistent named cast was not actually introduced`);
    }
  }
}

console.log(`Opening flow QA OK: ${MODES.length} modes x ${SEEDS.length} seeds; decision #2 adviser, 0 matches before phase ${OPENING_DONE}.`);
