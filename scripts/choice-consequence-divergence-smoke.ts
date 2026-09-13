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

/**
 * Player-visible fingerprint. Useful for proving two branches do not simply
 * render the exact same consequence card.
 */
function fingerprint(s: GameState): string {
  const cast = ensureCareerCast(s);
  return JSON.stringify({
    outcome: s.lastOutcome ? { title: s.lastOutcome.title, text: s.lastOutcome.text, tone: s.lastOutcome.tone } : null,
    consequence: consequenceFingerprint(s),
    adviser: { kind: cast.adviserKind, name: cast.adviser.name },
  });
}

/**
 * Durable consequence fingerprint deliberately excludes lastOutcome copy.
 * A choice is not meaningful merely because its title/text changes: at least
 * one persistent football/life/relationship/memory fact must diverge.
 */
function consequenceFingerprint(s: GameState): string {
  const cast = ensureCareerCast(s);
  return JSON.stringify({
    overall: s.overall,
    form: s.form,
    fitness: s.fitness,
    morale: s.morale,
    discipline: s.discipline,
    fame: s.fame,
    xp: s.xp,
    rel: s.rel,
    contract: s.contract,
    contractYears: s.contractYears,
    salary: s.salary,
    stage: s.stage,
    clubId: s.clubId,
    injury: s.injury,
    adviser: { kind: cast.adviserKind, name: cast.adviser.name, role: cast.adviser.role },
    promises: [...(s.memory.promises ?? [])].slice(0, 8),
    conflicts: [...(s.memory.conflicts ?? [])].slice(0, 8),
    rejectedClubs: [...(s.memory.rejectedClubs ?? [])].slice(0, 8),
    agentMemories: [...(s.agent.memories ?? [])].slice(0, 8),
    flags: Object.fromEntries(
      Object.entries(s.flags).filter(([k]) =>
        /opening|agente|contrato|quiere|riesgo|conflicto|cedido|negocio|promesa|familia|coach|vestuario|salida|minutos|desarrollo/.test(k),
      ),
    ),
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

function assertAllBranchesDiverge(mode: CareerMode, seed: number, decision: number, branches: { id: string; state: GameState }[]): number {
  const visibleFingerprints = branches.map((branch) => fingerprint(branch.state));
  const consequenceFingerprints = branches.map((branch) => consequenceFingerprint(branch.state));
  let checked = 0;
  for (let i = 0; i < branches.length; i += 1) {
    for (let j = i + 1; j < branches.length; j += 1) {
      checked += 1;
      assert(
        visibleFingerprints[i] !== visibleFingerprints[j],
        `${mode}/${seed}: duplicate branch at decision ${decision}; ${branches[i]!.id} and ${branches[j]!.id} produce the same visible outcome/state`,
      );
      assert(
        consequenceFingerprints[i] !== consequenceFingerprints[j],
        `${mode}/${seed}: copy-only choice at decision ${decision}; ${branches[i]!.id} and ${branches[j]!.id} change wording but leave the same durable consequence state`,
      );
    }
  }
  return checked;
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
    let fullyDivergent = 0;
    let branchPairsChecked = 0;
    let guard = 0;

    while (decisions < 15 && guard++ < 700) {
      if ((s.flags[OPENING_PHASE] ?? OpeningPhase.DONE) === OpeningPhase.CLUB_CHOICE && !s.clubId) {
        const offers = s.offers.slice(0, 4);
        assert(offers.length >= 2, `${mode}/${seed}: fewer than two opening club offers`);
        const branches = offers.map((offer) => ({ id: offer.clubId, state: afterOpeningClubChoice(chooseClub(s, offer.clubId)) }));
        branchPairsChecked += assertAllBranchesDiverge(mode, seed, decisions + 1, branches);
        multiChoice += 1;
        fullyDivergent += 1;
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
        const branches = ids.map((id) => ({ id, state: resolveChoice(s, id, branchSeed) }));
        branchPairsChecked += assertAllBranchesDiverge(mode, seed, decisions, branches);
        fullyDivergent += 1;
      }

      s = advanceOne(s, seed, decisions);
    }

    assert(decisions === 15, `${mode}/${seed}: reached only ${decisions} meaningful decisions`);
    assert(multiChoice >= 8, `${mode}/${seed}: only ${multiChoice} multi-choice decisions in first 15`);
    assert(fullyDivergent === multiChoice, `${mode}/${seed}: ${fullyDivergent}/${multiChoice} multi-choice decisions have all alternatives divergent`);
    assert(branchPairsChecked >= multiChoice, `${mode}/${seed}: insufficient pairwise branch coverage`);
    console.log(`${mode}/${seed}: ${fullyDivergent}/${multiChoice} early multi-choice decisions have durable divergence across every alternative (${branchPairsChecked} branch pairs checked)`);
  } finally {
    Math.random = old;
  }
}

const modes: CareerMode[] = ["express", "standard", "pro"];
const seeds = [53, 911, 20261, 47017];
for (const mode of modes) {
  for (const seed of seeds) run(mode, seed + modes.indexOf(mode) * 100000);
}

console.log("CHOICE_CONSEQUENCE_DIVERGENCE_OK: 12 deterministic careers verify that every early non-match alternative changes durable career state, not only consequence copy.");
