import { careerStatus, plausibleMoneyScale } from "../src/game/career-life";
import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening, OPENING_DONE, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
import type { GameState, Player, Stage } from "../src/game/types";

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
    name: `Chronology QA ${seed}`,
    nickname: "",
    position: positions[seed % positions.length]!,
    nationality: "España",
    city: seed % 2 ? "Sevilla" : "Madrid",
    avatar: null,
    traits: seed % 2 ? ["familiar", "leal"] : ["ambicioso", "profesional"],
  };
}

const stageRank: Record<Stage, number> = { youth: 0, reserves: 1, first: 2 };
const seniorCompetition = /(champions|europa league|conference|uefa|copa del rey|supercopa)/i;

type Snapshot = {
  age: number;
  seasonIndex: number;
  stage: Stage;
  salary: number;
  cash: number;
  fame: number;
  status: ReturnType<typeof careerStatus>;
  moneyScale: ReturnType<typeof plausibleMoneyScale>;
  pendingType: string;
  competition: string;
  specialTag: string;
};

function snapshot(s: GameState): Snapshot {
  const p = s.pending;
  const match = p?.type === "match" ? p.match : null;
  const cash = s.finance?.cash ?? 0;
  return {
    age: s.age,
    seasonIndex: s.seasonIndex,
    stage: s.stage,
    salary: s.salary,
    cash,
    fame: s.fame,
    status: careerStatus(s),
    moneyScale: plausibleMoneyScale(s),
    pendingType: p?.type === "dynamic" ? `dynamic:${p.kind}` : (p?.type ?? "none"),
    competition: match?.ctx.competition ?? "",
    specialTag: match?.ctx.specialTag ?? "",
  };
}

function isPlayable(s: GameState): boolean {
  const p = s.pending;
  if (!p || p.type === "season") return false;
  if (p.type === "match") return Boolean(p.match.keyMoment);
  if (p.type === "dynamic") {
    assert(p.kind !== "match_flash", `match_flash leaked into playable chronology: ${JSON.stringify(p.data)}`);
  }
  return true;
}

function resolveCurrent(s: GameState): GameState {
  if (s.lastOutcome) return advance(s);
  const p = s.pending;
  if (!p || p.type === "season") return advance(s);
  if (p.type === "event") {
    const e = eventById(p.eventId);
    assert(e, `missing event ${p.eventId}`);
    return resolveEvent(s, p.eventId, e.choices[0]!.id);
  }
  if (p.type === "match") return resolveMatch(s, p.match, p.match.keyMoment?.options[0]?.id);
  const view = renderDynamic(s, p);
  assert(view.choices[0], `dynamic ${p.kind} has no choices`);
  return resolveDynamicCard(s, p, view.choices[0]!.id);
}

function assertSnapshot(mode: CareerMode, seed: number, snap: Snapshot, previous: Snapshot | null) {
  assert(Number.isFinite(snap.salary) && snap.salary >= 0, `${mode}/${seed}: invalid salary ${snap.salary}`);
  assert(Number.isFinite(snap.cash) && snap.cash >= 0, `${mode}/${seed}: invalid cash ${snap.cash}`);
  assert(Number.isFinite(snap.fame) && snap.fame >= 0 && snap.fame <= 100, `${mode}/${seed}: invalid fame ${snap.fame}`);

  if (snap.age <= 18) {
    assert(snap.moneyScale === "youth", `${mode}/${seed}: age ${snap.age} escaped youth money scale (${snap.moneyScale})`);
    assert(snap.status !== "elite" && snap.status !== "legend", `${mode}/${seed}: age ${snap.age} reached impossible status ${snap.status}`);
    assert(snap.salary <= 250, `${mode}/${seed}: age ${snap.age} has implausible annual salary ${snap.salary}.000 EUR`);
    assert(snap.cash <= 1000, `${mode}/${seed}: age ${snap.age} has implausible liquid cash ${snap.cash}.000 EUR`);
  }

  if (snap.stage !== "first" && snap.pendingType === "match") {
    assert(!seniorCompetition.test(snap.competition), `${mode}/${seed}: ${snap.stage} player leaked senior competition ${snap.competition}`);
    assert(!/(cup|final|euro|decisive)/i.test(snap.specialTag), `${mode}/${seed}: ${snap.stage} player leaked senior match tag ${snap.specialTag}`);
  }

  if (previous) {
    assert(snap.age >= previous.age, `${mode}/${seed}: age regressed ${previous.age} -> ${snap.age}`);
    assert(snap.seasonIndex >= previous.seasonIndex, `${mode}/${seed}: season regressed ${previous.seasonIndex} -> ${snap.seasonIndex}`);
    assert(stageRank[snap.stage] >= stageRank[previous.stage], `${mode}/${seed}: stage regressed ${previous.stage} -> ${snap.stage}`);
    assert(snap.age - previous.age <= 1, `${mode}/${seed}: age jumped ${previous.age} -> ${snap.age} between playable decisions`);
    assert(snap.seasonIndex - previous.seasonIndex <= 1, `${mode}/${seed}: season jumped ${previous.seasonIndex} -> ${snap.seasonIndex} between playable decisions`);
  }
}

function run(mode: CareerMode, seed: number) {
  const oldRandom = Math.random;
  Math.random = rng(seed);
  try {
    let s = createGame(player(seed));
    s.careerSeed = seed;
    setCareerMode(s, mode);
    initializeOpening(s);

    const snapshots: Snapshot[] = [];
    let guard = 0;
    while (snapshots.length < 15 && guard++ < 600) {
      if ((s.flags[OPENING_PHASE] ?? OpeningPhase.DONE) === OpeningPhase.CLUB_CHOICE && !s.clubId) {
        const offer = s.offers[0]?.clubId;
        assert(offer, `${mode}/${seed}: no opening club offer`);
        const snap = snapshot(s);
        assertSnapshot(mode, seed, snap, snapshots.at(-1) ?? null);
        snapshots.push(snap);
        s = afterOpeningClubChoice(chooseClub(s, offer));
        continue;
      }

      if (isPlayable(s)) {
        const snap = snapshot(s);
        assertSnapshot(mode, seed, snap, snapshots.at(-1) ?? null);
        snapshots.push(snap);
      }

      if (s.pending?.type === "event" && (s.flags[OPENING_PHASE] ?? OPENING_DONE) < OPENING_DONE) {
        const id = s.pending.eventId;
        const openingChoices: Record<string, string> = {
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
        const event = eventById(id);
        assert(event, `missing opening event ${id}`);
        const resolved = resolveEvent(s, id, openingChoices[id] ?? event.choices[0]!.id);
        s = forceOpeningPending(resolved) ?? resolved;
      } else {
        s = resolveCurrent(s);
      }
    }

    assert(snapshots.length === 15, `${mode}/${seed}: only ${snapshots.length} playable decisions found`);
    assert((s.flags["opening_completed"] ?? 0) === 1, `${mode}/${seed}: opening did not complete`);
    console.log(`${mode}/${seed}: ${snapshots.map((x, i) => `${i + 1}:${x.age}/${x.stage}/S${x.seasonIndex}/€${x.salary}k/${x.status}${x.competition ? `/${x.competition}` : ""}`).join(" | ")}`);
  } finally {
    Math.random = oldRandom;
  }
}

const modes: CareerMode[] = ["express", "standard", "pro"];
const seeds = [701, 2026, 31337, 90909];
for (const mode of modes) {
  for (const seed of seeds) run(mode, seed + modes.indexOf(mode) * 100000);
}

console.log("FIRST15_CHRONOLOGY_OK: 12 deterministic careers reject age/stage regression, senior-competition leakage and implausible youth money/status jumps across the first 15 playable decisions.");
