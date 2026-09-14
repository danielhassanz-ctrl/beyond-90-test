import { ensureCareerCast } from "../src/game/career-life";
import { ALL_EVENTS } from "../src/game/events";
import { PEOPLE_EVENTS } from "../src/game/events-people";
import { chooseClub, createGame, resolveEvent } from "../src/game/engine";
import { isDisallowedNarrative, scrubDisallowedNarrative } from "../src/game/narrative-safety";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening, OPENING_DONE, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
import type { GameEvent, GameState, Player } from "../src/game/types";

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

function eventById(id: string): GameEvent {
  const event = ALL_EVENTS.find((candidate) => candidate.id === id);
  if (!event) throw new Error(`missing event ${id}`);
  return event;
}

function renderedText(s: GameState, id = eventId(s)): string {
  const event = eventById(id);
  return typeof event.text === "function" ? event.text(s) : event.text;
}

function expectText(s: GameState, fragment: string, label: string): void {
  const text = renderedText(s);
  if (!text.toLowerCase().includes(fragment.toLowerCase())) {
    throw new Error(`${label}: expected later scene to remember "${fragment}", got: ${text}`);
  }
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

    // The opening must not merely store flags: the next people in the chain must
    // actually speak from what the player already chose. These are deliberately
    // player-visible phrases from the default QA route.
    if (eventId(state) !== "opening_first_agreement") throw new Error(`${mode}/${seed}: contract scene missing after club choice`);
    state = answerAndAdvance(state);
    if (eventId(state) !== "opening_signing_day") throw new Error(`${mode}/${seed}: signing scene missing`);
    state = answerAndAdvance(state);
    if (eventId(state) !== "opening_named_coach") throw new Error(`${mode}/${seed}: coach scene missing`);
    expectText(state, "camino real hacia minutos", `${mode}/${seed}: contract priority became cosmetic`);

    state = answerAndAdvance(state);
    if (eventId(state) !== "opening_preseason_adaptation") throw new Error(`${mode}/${seed}: preseason scene missing`);
    expectText(state, "primeros pasos se decidirían en familia", `${mode}/${seed}: family priority became cosmetic`);
    expectText(state, "dos objetivos concretos", `${mode}/${seed}: coach choice became cosmetic`);

    state = answerAndAdvance(state);
    if (eventId(state) !== "opening_named_captain") throw new Error(`${mode}/${seed}: captain scene missing`);
    expectText(state, "veinte minutos extra", `${mode}/${seed}: preseason choice became cosmetic`);

    state = answerAndAdvance(state);
    if (eventId(state) !== "opening_named_teammate") throw new Error(`${mode}/${seed}: teammate scene missing`);
    expectText(state, "guardó su número", `${mode}/${seed}: captain choice became cosmetic`);

    state = answerAndAdvance(state);
    if (eventId(state) !== "opening_named_physio") throw new Error(`${mode}/${seed}: physio scene missing`);
    expectText(state, "primer aliado", `${mode}/${seed}: teammate choice became cosmetic`);
    state = answerAndAdvance(state);

    if ((state.flags[OPENING_PHASE] ?? -1) !== OPENING_DONE || state.flags["opening_completed"] !== 1) {
      throw new Error(`${mode}/${seed}: opening did not complete`);
    }

    const cast = ensureCareerCast(state);
    if (!cast.adviser.met || !cast.coach.met || !cast.captain.met || !cast.teammate.met || !cast.physio.met) {
      throw new Error(`${mode}/${seed}: persistent named cast was not actually introduced`);
    }

    // The life-first opening is the canonical introduction. The persistent-people
    // bank may continue with callbacks, but its five intro cards must already be
    // consumed and remain ineligible later in the same club.
    const canonicalIntroFlags = [
      "people_adviser_intro",
      "people_coach_intro",
      "people_captain_intro",
      "people_teammate_intro",
      "people_physio_intro",
    ] as const;
    for (const introFlag of canonicalIntroFlags) {
      if (state.flags[introFlag] !== 1) throw new Error(`${mode}/${seed}: opening did not consume ${introFlag}`);
    }

    const laterSameClub = { ...state, sceneCount: state.sceneCount + 20 };
    for (const introId of canonicalIntroFlags) {
      const intro = PEOPLE_EVENTS.find((event) => event.id === introId);
      if (!intro) throw new Error(`${mode}/${seed}: missing persistent-people intro fixture ${introId}`);
      if (intro.requires(state) || intro.requires(laterSameClub)) {
        throw new Error(`${mode}/${seed}: duplicate intro ${introId} remains eligible after canonical opening`);
      }
    }
    // Regression for the user-reported repetitive card: even if an old save or
    // the legacy scheduler produces it, the playable state must scrub it
    // without resolving its generic copy or mutating it as a seen decision.
    state.pending = { type: "dynamic", kind: "agent_check", data: { topic: "prensa", hour: "23:17" } };
    if (!isDisallowedNarrative(state)) throw new Error(`${mode}/${seed}: QA fixture did not create the banned adviser call`);
    const beforeScenes = state.sceneCount;
    state = scrubDisallowedNarrative(state);
    if (isDisallowedNarrative(state)) throw new Error(`${mode}/${seed}: agent_check leaked through narrative safety`);
    if (state.sceneCount !== beforeScenes) {
      throw new Error(`${mode}/${seed}: hidden agent_check incorrectly counted as a played narrative scene`);
    }
  }
}

console.log(`Opening flow QA OK: ${MODES.length} modes x ${SEEDS.length} seeds; life-first opening preserves causal choice continuity and repetitive agent_check is unplayable.`);
