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

function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const A = new Set(norm(a).split(" ").filter((x) => x.length > 3));
  const B = new Set(norm(b).split(" ").filter((x) => x.length > 3));
  if (!A.size || !B.size) return 0;
  let hits = 0;
  for (const token of A) if (B.has(token)) hits += 1;
  return hits / Math.min(A.size, B.size);
}

function player(seed: number): Player {
  const positions: Player["position"][] = ["DC", "MC", "MCO", "EXT", "DFC", "LAT"];
  return {
    name: `Branch QA ${seed}`,
    nickname: "",
    position: positions[seed % positions.length]!,
    nationality: "España",
    city: seed % 2 ? "Sevilla" : "Madrid",
    avatar: null,
    traits: seed % 2 ? ["familiar", "leal"] : ["ambicioso", "profesional"],
  };
}

function choiceIndex(length: number, seed: number, decision: number): number {
  if (length <= 1) return 0;
  return Math.abs(seed * 17 + decision * 7 + 3) % length;
}

type SeenDecision = {
  title: string;
  text: string;
  choices: string[];
  family: string;
  kind: string;
};

function describe(s: GameState): SeenDecision | null {
  const p = s.pending;
  if (!p || p.type === "season") return null;
  if (p.type === "match") {
    if (!p.match.keyMoment) return null;
    return {
      title: `${p.match.ctx.storyLabel} · ${p.match.opponent}`,
      text: `${p.match.ctx.competition} · ${p.match.ctx.venue} · ${p.match.keyMoment.prompt}`,
      choices: p.match.keyMoment.options.map((o) => o.label),
      family: "match",
      kind: "match",
    };
  }
  if (p.type === "event") {
    const e = eventById(p.eventId);
    assert(e, `missing event ${p.eventId}`);
    return {
      title: e.title,
      text: typeof e.text === "function" ? e.text(s) : e.text,
      choices: e.choices.map((c) => c.label),
      family: e.family ?? e.category,
      kind: `event:${e.id}`,
    };
  }
  assert(p.kind !== "match_flash", `BANNED match_flash reached alternative-branch playtest: ${JSON.stringify(p.data)}`);
  const view = renderDynamic(s, p);
  const family = p.kind === "arc"
    ? `arc:${String(p.data["arcId"] ?? view.category)}`
    : p.kind === "thread"
      ? `thread:${String(p.data["threadKind"] ?? view.category)}`
      : p.kind === "arc_callback"
        ? "callback"
        : p.kind === "arc_beat"
          ? `beat:${String(p.data["beatId"] ?? view.category)}`
          : `${view.category}:${p.kind}`;
  return { title: view.title, text: view.text, choices: view.choices.map((c) => c.label), family, kind: `dynamic:${p.kind}` };
}

function assertAlternateBranchVariety(mode: CareerMode, seed: number, seen: SeenDecision[]): void {
  const titles = new Set<string>();
  const choiceTriples = new Set<string>();
  for (let i = 0; i < seen.length; i += 1) {
    const current = seen[i]!;
    const titleKey = current.kind === "match"
      ? `${norm(current.title)}|${norm(current.text.split(" · ").slice(0, 2).join(" · "))}`
      : norm(current.title);
    assert(!titles.has(titleKey), `${mode}/${seed}: repeated setup after alternate choices: ${current.title}`);
    titles.add(titleKey);

    if (current.choices.length >= 3) {
      const choicesKey = current.choices.map(norm).join("|");
      assert(!choiceTriples.has(choicesKey), `${mode}/${seed}: repeated choice triple after alternate choices: ${current.choices.join(" / ")}`);
      choiceTriples.add(choicesKey);
    }

    for (let j = 0; j < i; j += 1) {
      const previous = seen[j]!;
      if (current.text.length > 60 && previous.text.length > 60) {
        assert(similarity(current.text, previous.text) < 0.82, `${mode}/${seed}: near-duplicate branch narrative: "${previous.title}" vs "${current.title}"`);
      }
    }

    if (i >= 2) {
      assert(
        !(seen[i - 2]!.family === current.family && seen[i - 1]!.family === current.family),
        `${mode}/${seed}: >2 consecutive decisions from family ${current.family} after alternate choices`,
      );
    }
  }

  assert(new Set(seen.map((x) => x.family)).size >= 5, `${mode}/${seed}: only ${new Set(seen.map((x) => x.family)).size} families after alternate choices`);
  assert(seen.filter((x) => x.kind === "match").length <= 5, `${mode}/${seed}: alternate branch became too match-heavy`);
}

function isMeaningful(s: GameState): boolean {
  return describe(s) !== null;
}

function resolvePending(s: GameState, seed: number, decision: number): { state: GameState; alternate: boolean } {
  if (s.lastOutcome) return { state: advance(s), alternate: false };
  const p = s.pending;
  if (!p || p.type === "season") return { state: advance(s), alternate: false };

  if (p.type === "event") {
    const e = eventById(p.eventId);
    assert(e && e.choices.length > 0, `missing choices for ${p.eventId}`);
    const idx = choiceIndex(e.choices.length, seed, decision);
    const next = resolveEvent(s, p.eventId, e.choices[idx]!.id);
    const opening = (s.flags[OPENING_PHASE] ?? OPENING_DONE) < OPENING_DONE;
    return { state: opening ? (forceOpeningPending(next) ?? next) : next, alternate: idx > 0 };
  }

  if (p.type === "match") {
    assert(!s.injury, `match surfaced while injured: ${p.match.opponent}`);
    if (!p.match.keyMoment) return { state: resolveMatch(s, p.match), alternate: false };
    const options = p.match.keyMoment.options;
    assert(options.length > 0, "key match has no options");
    const idx = choiceIndex(options.length, seed, decision);
    return { state: resolveMatch(s, p.match, options[idx]!.id), alternate: idx > 0 };
  }

  assert(p.kind !== "match_flash", `BANNED match_flash reached playable state: ${JSON.stringify(p.data)}`);
  const view = renderDynamic(s, p);
  assert(view.choices.length > 0, `dynamic ${p.kind} has no choices`);
  const idx = choiceIndex(view.choices.length, seed, decision);
  return { state: resolveDynamicCard(s, p, view.choices[idx]!.id), alternate: idx > 0 };
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

    let meaningful = 0;
    let alternateChoices = 0;
    let openingFinished = false;
    let stableCast: { coach: string; captain: string; physio: string; adviser: string } | null = null;
    const seen: SeenDecision[] = [];
    let guard = 0;

    while (meaningful < 15 && guard++ < 700) {
      if ((s.flags[OPENING_PHASE] ?? OpeningPhase.DONE) === OpeningPhase.CLUB_CHOICE && !s.clubId) {
        const offers = s.offers.slice(0, 4);
        assert(offers.length > 0, `${mode}/${seed}: no opening club offers`);
        const idx = choiceIndex(offers.length, seed, meaningful);
        if (idx > 0) alternateChoices += 1;
        meaningful += 1;
        seen.push({
          title: "Elegir primer club",
          text: `Comparas cuatro proyectos con tu entorno antes de elegir ${offers[idx]!.clubId}.`,
          choices: offers.map((o) => o.clubId),
          family: "club_choice",
          kind: "club_choice",
        });
        s = afterOpeningClubChoice(chooseClub(s, offers[idx]!.clubId));
        continue;
      }

      const decision = describe(s);
      if (decision) {
        if ((s.flags["opening_completed"] ?? 0) !== 1 && s.pending?.type === "match") {
          throw new Error(`${mode}/${seed}: match before opening completion`);
        }
        meaningful += 1;
        seen.push(decision);
      }

      const resolved = resolvePending(s, seed, meaningful);
      if (resolved.alternate) alternateChoices += 1;
      s = resolved.state;

      if (!openingFinished && (s.flags["opening_completed"] ?? 0) === 1) {
        openingFinished = true;
        const cast = ensureCareerCast(s);
        stableCast = {
          coach: cast.coach.name,
          captain: cast.captain.name,
          physio: cast.physio.name,
          adviser: cast.adviser.name,
        };
      }
    }

    assert(meaningful === 15, `${mode}/${seed}: only ${meaningful} meaningful decisions reached`);
    assert(seen.length === 15, `${mode}/${seed}: trace captured ${seen.length}/15 meaningful decisions`);
    assert(openingFinished, `${mode}/${seed}: opening never completed`);
    assert(alternateChoices >= 5, `${mode}/${seed}: only ${alternateChoices} non-default branches exercised`);
    assert(stableCast, `${mode}/${seed}: persistent cast was never captured`);
    assertAlternateBranchVariety(mode, seed, seen);

    const cast = ensureCareerCast(s);
    assert(cast.coach.name === stableCast.coach, `${mode}/${seed}: coach drift after alternate choices`);
    assert(cast.captain.name === stableCast.captain, `${mode}/${seed}: captain drift after alternate choices`);
    assert(cast.physio.name === stableCast.physio, `${mode}/${seed}: physio drift after alternate choices`);
    assert(cast.adviser.name === stableCast.adviser, `${mode}/${seed}: adviser drift after alternate choices`);

    console.log(`${mode}/${seed}: ${seen.map((d, i) => `${i + 1}.${d.title}`).join(" | ")} · ${alternateChoices} non-default choices`);
  } finally {
    Math.random = oldRandom;
  }
}

const modes: CareerMode[] = ["express", "standard", "pro"];
const seeds = [41, 808, 12026, 65537];
for (const mode of modes) {
  for (const seed of seeds) run(mode, seed + modes.indexOf(mode) * 100000);
}

console.log("FIRST15_BRANCH_DIVERSITY_OK: 12 deterministic careers exercise non-default choices under the same repetition, pacing, chronology and cast-continuity quality floor.");
