import { ensureCareerCast } from "../src/game/career-life";
import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening, OPENING_DONE, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
import type { DynamicCard, GameState, Player } from "../src/game/types";

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
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

type Decision = { title: string; text: string; choices: string[]; family: string; kind: string; injured: boolean };

function player(seed: number): Player {
  const positions: Player["position"][] = ["DC", "MC", "MCO", "EXT", "DFC", "LAT"];
  return {
    name: `Season QA ${seed}`,
    nickname: "",
    position: positions[seed % positions.length]!,
    nationality: "España",
    city: seed % 2 ? "Sevilla" : "Madrid",
    avatar: null,
    traits: seed % 2 ? ["familiar", "leal"] : ["ambicioso", "profesional"],
  };
}

function dynamicFamily(card: DynamicCard, fallback: string): string {
  if (card.kind === "arc") return `arc:${String(card.data["arcId"] ?? fallback)}`;
  if (card.kind === "arc_callback") return "callback";
  if (card.kind === "thread") return `thread:${String(card.data["threadKind"] ?? fallback)}`;
  if (card.kind === "arc_beat") {
    const id = String(card.data["beatId"] ?? fallback);
    if (id.startsWith("beat_pos_")) return "beat:position";
    if (id.includes("pretemporada")) return "beat:preseason";
    if (id.startsWith("beat_early_")) return "beat:early-life";
    if (id.startsWith("beat_lane_")) return "beat:origin-lane";
    return `beat:${id}`;
  }
  if (card.kind.startsWith("cons_")) return `consequence:${card.kind}`;
  return `${fallback}:${card.kind}`;
}

function describe(s: GameState): Decision | null {
  const p = s.pending;
  if (!p || p.type === "season") return null;
  const injured = !!s.injury;
  if (p.type === "event") {
    const e = eventById(p.eventId);
    assert(e, `missing event ${p.eventId}`);
    const text = typeof e.text === "function" ? e.text(s) : e.text;
    return { title: e.title, text, choices: e.choices.map((c) => c.label), family: e.family ?? e.category, kind: `event:${e.id}`, injured };
  }
  if (p.type === "match") {
    assert(!injured, `on-field match surfaced while player is injured: ${p.match.opponent}`);
    if (!p.match.keyMoment) return null;
    return {
      title: `${p.match.ctx.storyLabel} · ${p.match.opponent}`,
      text: `${p.match.ctx.competition} · ${p.match.ctx.venue} · ${p.match.keyMoment.prompt}`,
      choices: p.match.keyMoment.options.map((o) => o.label),
      family: "match",
      kind: "match",
      injured,
    };
  }
  assert(p.kind !== "match_flash", `BANNED match_flash surfaced during full season: ${JSON.stringify(p.data)}`);
  const v = renderDynamic(s, p);
  return { title: v.title, text: v.text, choices: v.choices.map((c) => c.label), family: dynamicFamily(p, v.category), kind: `dynamic:${p.kind}`, injured };
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

function assertSeason(mode: CareerMode, seed: number, decisions: Decision[]) {
  const authoredTitles = new Set<string>();
  const authoredChoices = new Set<string>();
  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i]!;
    if (d.kind !== "match") {
      const title = norm(d.title);
      assert(!authoredTitles.has(title), `${mode}/${seed}: repeated authored title in season: ${d.title}`);
      authoredTitles.add(title);
      if (d.choices.length >= 3) {
        const key = d.choices.map(norm).join("|");
        assert(!authoredChoices.has(key), `${mode}/${seed}: repeated authored choice triple in season: ${d.choices.join(" / ")}`);
        authoredChoices.add(key);
      }
    }
    if (i >= 2) {
      assert(!(decisions[i - 2]!.family === d.family && decisions[i - 1]!.family === d.family), `${mode}/${seed}: three consecutive ${d.family} decisions`);
    }
  }
  assert(decisions.some((d) => /life|family|opening_home|early-life|origin|arc:familia|thread:family/.test(d.family)), `${mode}/${seed}: no personal-life decision in first season`);
  assert(decisions.some((d) => /training|preseason|club|match|position|jerarquia/.test(d.family)), `${mode}/${seed}: no football-development decision in first season`);
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
    const decisions: Decision[] = [];
    const startSeason = s.seasonIndex;
    let guard = 0;

    while (s.seasonIndex === startSeason && guard++ < 1200) {
      if ((s.flags[OPENING_PHASE] ?? OpeningPhase.DONE) === OpeningPhase.CLUB_CHOICE && !s.clubId) {
        const offer = s.offers[0]?.clubId;
        assert(offer, `${mode}/${seed}: no opening offer`);
        decisions.push({ title: "Elegir primer club", text: `Comparas cuatro caminos y eliges ${offer}`, choices: s.offers.slice(0, 4).map((o) => o.clubId), family: "club_choice", kind: "club_choice", injured: false });
        s = afterOpeningClubChoice(chooseClub(s, offer));
        continue;
      }

      const d = describe(s);
      if (d) decisions.push(d);

      if (s.pending?.type === "season") {
        s = advance(s);
        continue;
      }

      if (s.pending?.type === "event" && (s.flags[OPENING_PHASE] ?? OPENING_DONE) < OPENING_DONE) {
        const e = s.pending.eventId;
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
        const resolved = resolveEvent(s, e, openingChoices[e] ?? eventById(e)!.choices[0]!.id);
        s = forceOpeningPending(resolved) ?? resolved;
      } else {
        s = resolveCurrent(s);
      }
    }

    assert(guard < 1200, `${mode}/${seed}: first season did not terminate`);
    assert(decisions.length >= 8, `${mode}/${seed}: only ${decisions.length} meaningful decisions in first season`);
    assertSeason(mode, seed, decisions);
    console.log(`${mode}/${seed}: first season ${decisions.length} meaningful decisions; ${new Set(decisions.map((d) => d.family)).size} families`);
  } finally {
    Math.random = oldRandom;
  }
}

for (const [modeIndex, mode] of (["express", "standard", "pro"] as CareerMode[]).entries()) {
  for (const seed of [101, 2026, 31337, 90909]) run(mode, seed + modeIndex * 100000);
}
console.log("FULL_SEASON_BOREDOM_OK: 12 deterministic first seasons without match_flash filler, repeated authored setups, three-card semantic-family loops, or injury/match contradictions.");