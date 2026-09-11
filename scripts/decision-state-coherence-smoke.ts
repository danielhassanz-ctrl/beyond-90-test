import { ensureCareerCast } from "../src/game/career-life";
import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening, OPENING_DONE, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
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

function player(seed: number): Player {
  const positions: Player["position"][] = ["DC", "MC", "MCO", "EXT", "DFC", "LAT"];
  return {
    name: `State Coherence ${seed}`,
    nickname: "",
    position: positions[seed % positions.length]!,
    nationality: "España",
    city: seed % 2 ? "Sevilla" : "Madrid",
    avatar: null,
    traits: seed % 2 ? ["familiar", "leal"] : ["ambicioso", "profesional"],
  };
}

function visibleCopy(s: GameState): string {
  const p = s.pending;
  if (!p) return "";
  if (p.type === "event") {
    const e = eventById(p.eventId);
    if (!e) return "";
    const text = typeof e.text === "function" ? e.text(s) : e.text;
    return `${e.title} ${text}`;
  }
  if (p.type === "match") {
    return `${p.match.ctx.storyLabel} ${p.match.ctx.competition} ${p.match.opponent} ${p.match.keyMoment?.prompt ?? ""}`;
  }
  if (p.type === "dynamic") {
    const v = renderDynamic(s, p);
    return `${v.title} ${v.text}`;
  }
  return "";
}

function assertStateCoherence(s: GameState, mode: CareerMode, seed: number, decision: number) {
  const p = s.pending;
  if (!p || p.type === "season") return;
  const tag = `${mode}/${seed}/decision-${decision}`;

  if (p.type === "match") {
    assert(!s.injury, `${tag}: match surfaced while injured (${s.injury?.label ?? "unknown injury"})`);
    assert((s.flags["opening_completed"] ?? 0) === 1, `${tag}: match surfaced before mandatory opening completed`);
    if (s.stage === "youth") {
      assert(!/champions|europa league|conference|copa del rey|supercopa|selecci[oó]n absoluta/i.test(`${p.match.ctx.competition} ${p.match.ctx.storyLabel}`), `${tag}: senior competition leaked into youth career`);
    }
  }

  if (p.type === "dynamic") {
    assert(p.kind !== "match_flash", `${tag}: banned match_flash reached playable state`);
  }

  if (s.age <= 17) {
    const copy = visibleCopy(s);
    assert(!/bal[oó]n de oro|champions|selecci[oó]n absoluta|contrato millonario|salario millonario|cobra(?:s)? millones|arabia/i.test(copy), `${tag}: elite/status copy leaked at age ${s.age}: ${copy.slice(0, 180)}`);
  }
}

function resolveCurrent(s: GameState): GameState {
  if (s.lastOutcome) return advance(s);
  const p = s.pending;
  if (!p) return advance(s);
  if (p.type === "season") return advance(s);
  if (p.type === "event") {
    const e = eventById(p.eventId)!;
    return resolveEvent(s, p.eventId, e.choices[0]!.id);
  }
  if (p.type === "match") return resolveMatch(s, p.match, p.match.keyMoment?.options[0]?.id);
  const v = renderDynamic(s, p);
  assert(v.choices[0], `dynamic ${p.kind} has no choice`);
  return resolveDynamicCard(s, p, v.choices[0]!.id);
}

function run(mode: CareerMode, seed: number) {
  const oldRandom = Math.random;
  Math.random = rng(seed);
  try {
    let s = createGame(player(seed));
    s.careerSeed = seed;
    setCareerMode(s, mode);
    ensureCareerCast(s);
    initializeOpening(s);

    let expectedAdviser = ensureCareerCast(s).adviser.name;
    const fixedCast = ensureCareerCast(s);
    const expectedCoach = fixedCast.coach.name;
    const expectedCaptain = fixedCast.captain.name;
    const expectedPhysio = fixedCast.physio.name;

    let meaningful = 0;
    let guard = 0;
    while (meaningful < 15 && guard++ < 600) {
      if ((s.flags[OPENING_PHASE] ?? OpeningPhase.DONE) === OpeningPhase.CLUB_CHOICE && !s.clubId) {
        const offer = s.offers[0]?.clubId;
        assert(offer, `${mode}/${seed}: no opening club offer`);
        meaningful += 1;
        s = afterOpeningClubChoice(chooseClub(s, offer));
        continue;
      }

      if (s.pending && s.pending.type !== "season") {
        const isMeaningful = s.pending.type !== "match" || !!s.pending.match.keyMoment;
        if (isMeaningful) {
          meaningful += 1;
          assertStateCoherence(s, mode, seed, meaningful);
        } else if (s.pending.type === "match") {
          // Passive fixtures still must obey physical and chronological state.
          assertStateCoherence(s, mode, seed, meaningful + 1);
        }
      }

      if (s.pending?.type === "event" && (s.flags[OPENING_PHASE] ?? OPENING_DONE) < OPENING_DONE) {
        const id = s.pending.eventId;
        const choiceMap: Record<string, string> = {
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
        let next = resolveEvent(s, id, choiceMap[id] ?? eventById(id)!.choices[0]!.id);
        if (id === "opening_adviser_choice") expectedAdviser = ensureCareerCast(next).adviser.name;
        next = forceOpeningPending(next) ?? next;
        s = next;
      } else {
        s = resolveCurrent(s);
      }

      const cast = ensureCareerCast(s);
      assert(cast.adviser.name === expectedAdviser, `${mode}/${seed}: adviser drift ${expectedAdviser} -> ${cast.adviser.name}`);
      assert(cast.coach.name === expectedCoach, `${mode}/${seed}: coach drift ${expectedCoach} -> ${cast.coach.name}`);
      assert(cast.captain.name === expectedCaptain, `${mode}/${seed}: captain drift ${expectedCaptain} -> ${cast.captain.name}`);
      assert(cast.physio.name === expectedPhysio, `${mode}/${seed}: physio drift ${expectedPhysio} -> ${cast.physio.name}`);
    }

    assert(meaningful === 15, `${mode}/${seed}: only ${meaningful} meaningful decisions reached`);
  } finally {
    Math.random = oldRandom;
  }
}

const modes: CareerMode[] = ["express", "standard", "pro"];
const seeds = [71, 808, 4096, 65537];
for (const mode of modes) for (const seed of seeds) run(mode, seed + modes.indexOf(mode) * 100000);
console.log("DECISION_STATE_COHERENCE_OK: 12 deterministic careers keep injury, age/status, competition and persistent-cast state coherent for the first 15 meaningful decisions.");
