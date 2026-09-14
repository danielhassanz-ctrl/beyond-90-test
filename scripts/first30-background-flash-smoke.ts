import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { scrubDisallowedNarrative } from "../src/game/narrative-safety";
import {
  afterOpeningClubChoice,
  forceOpeningPending,
  initializeOpening,
  OPENING_DONE,
  OPENING_PHASE,
  OpeningPhase,
} from "../src/game/opening";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
import type { GameState, Player } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

function player(seed: number): Player {
  const positions: Player["position"][] = ["DC", "MC", "MCO", "EXT", "DFC", "LAT"];
  return {
    name: `First30 QA ${seed}`,
    nickname: "",
    position: positions[seed % positions.length]!,
    nationality: "España",
    city: seed % 2 ? "Sevilla" : "Madrid",
    avatar: null,
    traits: seed % 2 ? ["familiar", "leal"] : ["ambicioso", "profesional"],
  };
}

function resolveOpeningEvent(s: GameState, seed: number): GameState {
  assert(s.pending?.type === "event", "opening resolver called without event");
  const id = s.pending.eventId;
  const choices: Record<string, string> = {
    opening_home_family: "familia",
    opening_adviser_choice: seed % 3 === 0 ? "father" : seed % 3 === 1 ? "agent" : "friend",
    opening_first_agreement: "minutes",
    opening_signing_day: "family",
    opening_named_coach: "listen",
    opening_preseason_adaptation: "extra",
    opening_named_captain: "respect",
    opening_named_teammate: "friend",
    opening_named_physio: "trust",
  };
  const ev = eventById(id);
  assert(ev, `missing opening event ${id}`);
  const next = resolveEvent(s, id, choices[id] ?? ev.choices[0]!.id);
  return forceOpeningPending(next) ?? next;
}

function resolveCurrent(s: GameState): GameState {
  if (s.lastOutcome) return advance(s);
  const p = s.pending;
  if (!p || p.type === "season") return advance(s);
  if (p.type === "event") {
    const ev = eventById(p.eventId);
    assert(ev, `missing event ${p.eventId}`);
    return resolveEvent(s, p.eventId, ev.choices[0]!.id);
  }
  if (p.type === "match") {
    return resolveMatch(s, p.match, p.match.keyMoment?.options[0]?.id);
  }
  const view = renderDynamic(s, p);
  assert(view.choices[0], `dynamic ${p.kind} has no choice`);
  return resolveDynamicCard(s, p, view.choices[0]!.id);
}

function run(mode: CareerMode, seed: number) {
  const originalRandom = Math.random;
  Math.random = rng(seed);
  try {
    let s = createGame(player(seed));
    s.careerSeed = seed;
    setCareerMode(s, mode);
    initializeOpening(s);

    let playable = 0;
    let guard = 0;
    let openingFinishedAt = -1;

    while (playable < 30 && guard++ < 1500) {
      if ((s.flags[OPENING_PHASE] ?? OpeningPhase.DONE) === OpeningPhase.CLUB_CHOICE && !s.clubId) {
        const offer = s.offers[0]?.clubId;
        assert(offer, `${mode}/${seed}: no club offer`);
        s = afterOpeningClubChoice(chooseClub(s, offer));
        playable += 1;
        continue;
      }

      s = scrubDisallowedNarrative(s);
      const p = s.pending;
      if (!p) {
        s = advance(s);
        continue;
      }

      if (p.type === "dynamic") {
        assert(p.kind !== "match_flash", `${mode}/${seed}: playable match_flash leaked at decision ${playable + 1}: ${JSON.stringify(p.data)}`);
      }

      if (Boolean(s.injury) && p.type === "match") {
        throw new Error(`${mode}/${seed}: injured player received playable match at decision ${playable + 1}`);
      }

      if (p.type !== "season" && !(p.type === "match" && !p.match.keyMoment)) playable += 1;

      if ((s.flags["opening_completed"] ?? 0) === 1 && openingFinishedAt < 0) openingFinishedAt = playable;

      if (p.type === "event" && (s.flags[OPENING_PHASE] ?? OPENING_DONE) < OPENING_DONE) {
        s = resolveOpeningEvent(s, seed);
      } else {
        s = resolveCurrent(s);
      }
    }

    assert(playable === 30, `${mode}/${seed}: only ${playable}/30 playable decisions reached`);
    assert((s.flags["opening_completed"] ?? 0) === 1, `${mode}/${seed}: opening never completed`);
    assert(openingFinishedAt >= 0 && openingFinishedAt < 30, `${mode}/${seed}: opening consumed entire first-30 window`);
    console.log(`${mode}/${seed}: first30 clean; opening completed by decision ${openingFinishedAt}`);
  } finally {
    Math.random = originalRandom;
  }
}

const modes: CareerMode[] = ["express", "standard", "pro"];
const seeds = [118, 2026, 450045, 90909];
for (const mode of modes) {
  const offset = modes.indexOf(mode) * 100000;
  for (const seed of seeds) run(mode, seed + offset);
}

console.log("FIRST30_BACKGROUND_FLASH_OK: 12 deterministic careers x first 30 playable decisions contain no match_flash filler and no playable match while injured.");
