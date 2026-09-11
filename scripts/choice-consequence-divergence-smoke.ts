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
    name: `Consequence QA ${seed}`,
    nickname: "",
    position: positions[seed % positions.length]!,
    nationality: "España",
    city: seed % 2 ? "Sevilla" : "Madrid",
    avatar: null,
    traits: seed % 2 ? ["familiar", "leal"] : ["ambicioso", "profesional"],
  };
}

function fingerprint(s: GameState): string {
  const cast = ensureCareerCast(s);
  return JSON.stringify({
    outcome: s.lastOutcome ? { title: s.lastOutcome.title, text: s.lastOutcome.text, tone: s.lastOutcome.tone } : null,
    overall: s.overall,
    form: s.form,
    fitness: s.fitness,
    morale: s.morale,
    discipline: s.discipline,
    fame: s.fame,
    rel: s.rel,
    contract: s.contract,
    salary: s.salary,
    stage: s.stage,
    clubId: s.clubId,
    adviser: { kind: cast.adviserKind, name: cast.adviser.name },
    flags: Object.fromEntries(Object.entries(s.flags).filter(([k]) => /opening|agente|contrato|quiere|riesgo|conflicto|cedido|negocio/.test(k))),
  });
}

function resolveChoice(s: GameState, choiceId: string, randomSeed: number): GameState {
  const old = Math.random;
  Math.random = rng(randomSeed);
  try {
    const p = s.pending;
    assert(p && p.type !== "season", "cannot resolve empty/season pending card");
    if (p.type === "event") return resolveEvent(s, p.eventId, choiceId);
    if (p.type === "match") return resolveMatch(s, p.match, choiceId);
    return resolveDynamicCard(s, p, choiceId);
  } finally {
    Math.random = old;
  }
}

function choiceIds(s: GameState): string[] {
  const p = s.pending;
  if (!p || p.type === "season") return [];
  if (p.type === "event") return eventById(p.eventId)?.choices.map((c) => c.id) ?? [];
  if (p.type === "match") return p.match.keyMoment?.options.map((o) => o.id) ?? [];
  return renderDynamic(s, p).choices.map((c) => c.id);
}

function advanceOne(s: GameState, seed: number, decision: number): GameState {
  if (s.lastOutcome) return advance(s);
  const p = s.pending;
  if (!p || p.type === "season") return advance(s);
  const ids = choiceIds(s);
  if (ids.length === 0) return p.type === "match" ? resolveMatch(s, p.match) : advance(s);
  const idx = Math.abs(seed * 13 + decision * 7) % ids.length;
  const next = resolveChoice(s, ids[idx]!, seed * 1000 + decision);
  if (p.type === "event" && (s.flags[OPENING_PHASE] ?? OPENING_DONE) < OPENING_DONE) return forceOpeningPending(next) ?? next;
  return next;
}

function run(mode: CareerMode, seed: number) {
  const old = Math.random;
  Math.random = rng(seed);
  try {
    let s = createGame(player(seed));
    s.careerSeed = seed;
    setCareerMode(s, mode);
    ensureCareerCast(s);
    initializeOpening(s);

    let decisions = 0;
    let multiChoice = 0;
    let divergent = 0;
    let guard = 0;

    while (decisions < 15 && guard++ < 700) {
      if ((s.flags[OPENING_PHASE] ?? OpeningPhase.DONE) === OpeningPhase.CLUB_CHOICE && !s.clubId) {
        const offers = s.offers.slice(0, 4);
        assert(offers.length >= 2, `${mode}/${seed}: fewer than two opening club offers`);
        const a = afterOpeningClubChoice(chooseClub(s, offers[0]!.clubId));
        const b = afterOpeningClubChoice(chooseClub(s, offers[1]!.clubId));
        multiChoice += 1;
        assert(fingerprint(a) !== fingerprint(b), `${mode}/${seed}: choosing different opening clubs produced the same consequence state`);
        divergent += 1;
        decisions += 1;
        const idx = Math.abs(seed + decisions) % offers.length;
        s = afterOpeningClubChoice(chooseClub(s, offers[idx]!.clubId));
        continue;
      }

      const p = s.pending;
      if (!p || p.type === "season" || s.lastOutcome) {
        s = advance(s);
        continue;
      }
      if (p.type === "match" && !p.match.keyMoment) {
        s = resolveMatch(s, p.match);
        continue;
      }
      if (p.type === "dynamic") assert(p.kind !== "match_flash", `${mode}/${seed}: banned match_flash reached consequence QA`);

      const ids = choiceIds(s);
      assert(ids.length > 0, `${mode}/${seed}: playable decision without choices`);
      decisions += 1;

      if (ids.length >= 2 && p.type !== "match") {
        multiChoice += 1;
        const branchSeed = seed * 10000 + decisions * 97;
        const a = resolveChoice(s, ids[0]!, branchSeed);
        const b = resolveChoice(s, ids[1]!, branchSeed);
        const differs = fingerprint(a) !== fingerprint(b);
        assert(differs, `${mode}/${seed}: decorative choices at decision ${decisions}; ${ids[0]} and ${ids[1]} produce the same outcome/state`);
        divergent += 1;
      }

      s = advanceOne(s, seed, decisions);
    }

    assert(decisions === 15, `${mode}/${seed}: reached only ${decisions} meaningful decisions`);
    assert(multiChoice >= 8, `${mode}/${seed}: only ${multiChoice} multi-choice decisions in first 15`);
    assert(divergent === multiChoice, `${mode}/${seed}: ${divergent}/${multiChoice} multi-choice decisions actually diverged`);
    console.log(`${mode}/${seed}: ${divergent}/${multiChoice} early multi-choice decisions have distinct consequences`);
  } finally {
    Math.random = old;
  }
}

const modes: CareerMode[] = ["express", "standard", "pro"];
const seeds = [53, 911, 20261, 47017];
for (const mode of modes) {
  for (const seed of seeds) run(mode, seed + modes.indexOf(mode) * 100000);
}

console.log("CHOICE_CONSEQUENCE_DIVERGENCE_OK: 12 deterministic careers verify that early non-match alternatives are not decorative duplicates.");
