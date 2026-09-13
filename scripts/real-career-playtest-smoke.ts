import { ensureCareerCast } from "../src/game/career-life";
import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { scrubDisallowedNarrative } from "../src/game/narrative-safety";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening, OPENING_DONE, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
import type { DynamicCard, EventCategory, GameState, Player, SceneKey } from "../src/game/types";

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

function similarity(a: string, b: string): number {
  const A = new Set(norm(a).split(" ").filter((x) => x.length > 3));
  const B = new Set(norm(b).split(" ").filter((x) => x.length > 3));
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const x of A) if (B.has(x)) hit += 1;
  return hit / Math.min(A.size, B.size);
}

type SeenDecision = {
  title: string;
  text: string;
  choices: string[];
  family: string;
  kind: string;
  category: EventCategory | "match" | "club_choice";
  image: SceneKey | "match" | "club_choice";
  age: number;
  injured: boolean;
};

const onFieldCopy = /(calienta(?:s)?\b|entras? t[uú]\b|te cambian en|sales? de titular|entras? al campo|debutas?|partidillo|dos actuaciones|rivales? te preparan|te silban al cambiarte|marcas? (?:un )?gol|gol decisivo|doble marca|faltas t[aá]cticas|tarjeta roja|roja directa|expulsi[oó]n|sustituci[oó]n|duelo t[aá]ctico)/i;

function eventText(s: GameState, id: string): string {
  const e = eventById(id);
  if (!e) return "";
  return typeof e.text === "function" ? e.text(s) : e.text;
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

function describe(s: GameState): SeenDecision | null {
  const p = s.pending;
  if (!p) return null;
  if (p.type === "season") return null;
  const chronology = { age: s.age, injured: Boolean(s.injury) };
  if (p.type === "event") {
    const e = eventById(p.eventId);
    assert(e, `missing event ${p.eventId}`);
    return {
      title: e.title,
      text: eventText(s, e.id),
      choices: e.choices.map((c) => c.label),
      family: e.family ?? e.category,
      kind: `event:${e.id}`,
      category: e.category,
      image: e.image,
      ...chronology,
    };
  }
  if (p.type === "match") {
    if (!p.match.keyMoment) return null;
    return {
      title: `${p.match.ctx.storyLabel} · ${p.match.opponent}`,
      text: `${p.match.ctx.competition} · ${p.match.ctx.venue} · ${p.match.keyMoment.prompt}`,
      choices: p.match.keyMoment.options.map((o) => o.label),
      family: "match",
      kind: "match",
      category: "match",
      image: "match",
      ...chronology,
    };
  }
  assert(p.kind !== "match_flash", `BANNED match_flash reached playable state: ${JSON.stringify(p.data)}`);
  const v = renderDynamic(s, p);
  return {
    title: v.title,
    text: v.text,
    choices: v.choices.map((c) => c.label),
    family: dynamicFamily(p, v.category),
    kind: `dynamic:${p.kind}`,
    category: v.category,
    image: v.image,
    ...chronology,
  };
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
  if (p.type === "match") {
    const key = p.match.keyMoment?.options[0]?.id;
    return resolveMatch(s, p.match, key);
  }
  const v = renderDynamic(s, p);
  assert(v.choices[0], `dynamic ${p.kind} has no choice`);
  return resolveDynamicCard(s, p, v.choices[0]!.id);
}

function player(seed: number): Player {
  const positions: Player["position"][] = ["DC", "MC", "MCO", "EXT", "DFC", "LAT"];
  return {
    name: `Real Career QA ${seed}`,
    nickname: "",
    position: positions[seed % positions.length]!,
    nationality: "España",
    city: seed % 2 ? "Sevilla" : "Madrid",
    avatar: null,
    traits: seed % 2 ? ["familiar", "leal"] : ["ambicioso", "profesional"],
  };
}

function assertVariety(mode: CareerMode, seed: number, seen: SeenDecision[]) {
  const titles = new Set<string>();
  const choiceSets = new Set<string>();
  for (let i = 0; i < seen.length; i++) {
    const d = seen[i]!;
    const t = d.kind === "match" ? `${norm(d.title)}|${norm(d.text.split(" · ").slice(0, 2).join(" · "))}` : norm(d.title);
    assert(!titles.has(t), `${mode}/${seed}: repeated playable setup in first 15: ${d.title}${d.kind === "match" ? ` (${d.text})` : ""}`);
    titles.add(t);
    const choiceKey = d.choices.map(norm).join("|");
    if (d.choices.length >= 3) {
      assert(!choiceSets.has(choiceKey), `${mode}/${seed}: repeated choice triple: ${d.choices.join(" / ")}`);
      choiceSets.add(choiceKey);
    }
    for (let j = 0; j < i; j++) {
      const prev = seen[j]!;
      if (d.text.length > 60 && prev.text.length > 60) {
        assert(similarity(d.text, prev.text) < 0.82, `${mode}/${seed}: near-duplicate narrative: "${prev.title}" vs "${d.title}"`);
      }
    }
    if (i >= 2) {
      assert(!(seen[i - 2]!.family === d.family && seen[i - 1]!.family === d.family), `${mode}/${seed}: >2 consecutive decisions from family ${d.family}`);
    }
    if (d.injured) {
      assert(d.kind !== "match", `${mode}/${seed}: injured player received a playable match: ${d.title}`);
      const isMedical = d.category === "medical";
      assert(isMedical || (d.category !== "training" && d.image !== "training" && d.image !== "match"), `${mode}/${seed}: injured player received structurally on-field/training narrative (${d.kind}, ${d.category}/${d.image}): ${d.title}`);
      assert(isMedical || !onFieldCopy.test(`${d.title} ${d.text}`), `${mode}/${seed}: injured player received on-field narrative: ${d.title}`);
    }
    if (d.age <= 17) {
      assert(!/bal[oó]n de oro|champions|selecci[oó]n absoluta|contrato millonario|salario millonario|cobra(?:s)? millones/i.test(`${d.title} ${d.text}`), `${mode}/${seed}: elite/status leakage at age ${d.age}: ${d.title}`);
    }
  }
  assert(seen.filter((x) => x.kind === "dynamic:match_flash").length === 0, `${mode}/${seed}: match_flash leaked`);
  assert(new Set(seen.map((x) => x.family)).size >= 5, `${mode}/${seed}: only ${new Set(seen.map((x) => x.family)).size} decision families in first 15`);
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
    const initialCast = ensureCareerCast(s);
    const names = { adviser: initialCast.adviser.name, coach: initialCast.coach.name, captain: initialCast.captain.name, physio: initialCast.physio.name };
    const seen: SeenDecision[] = [];

    let guard = 0;
    while (seen.length < 15 && guard++ < 500) {
      if ((s.flags[OPENING_PHASE] ?? OpeningPhase.DONE) === OpeningPhase.CLUB_CHOICE && !s.clubId) {
        const offer = s.offers[0]?.clubId;
        assert(offer, `${mode}/${seed}: no club offer at opening gate`);
        seen.push({
          title: "Elegir primer club",
          text: `Comparas las ofertas iniciales y eliges ${offer}.`,
          choices: s.offers.slice(0, 4).map((o) => o.clubId),
          family: "club_choice",
          kind: "club_choice",
          category: "club_choice",
          image: "club_choice",
          age: s.age,
          injured: Boolean(s.injury),
        });
        s = afterOpeningClubChoice(chooseClub(s, offer));
        continue;
      }

      // GameProvider runs the same final safety scrub before a pending card can
      // reach the shipped UI. Keep this human-style playthrough on that path.
      s = scrubDisallowedNarrative(s);
      const d = describe(s);
      if (d) {
        if ((s.flags["opening_completed"] ?? 0) !== 1 && d.kind === "match") {
          throw new Error(`${mode}/${seed}: match before opening completion`);
        }
        seen.push(d);
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

    assert(seen.length === 15, `${mode}/${seed}: only ${seen.length} meaningful decisions found`);
    assert((s.flags["opening_completed"] ?? 0) === 1, `${mode}/${seed}: opening never completed`);
    assertVariety(mode, seed, seen);

    const cast = ensureCareerCast(s);
    assert(cast.coach.name === names.coach, `${mode}/${seed}: coach drift ${names.coach} -> ${cast.coach.name}`);
    assert(cast.captain.name === names.captain, `${mode}/${seed}: captain drift ${names.captain} -> ${cast.captain.name}`);
    assert(cast.physio.name === names.physio, `${mode}/${seed}: physio drift ${names.physio} -> ${cast.physio.name}`);
    assert(cast.adviser.name.length > 1, `${mode}/${seed}: adviser missing after opening`);

    console.log(`${mode}/${seed}: ${seen.map((x, i) => `${i + 1}.${x.title}[${x.age}${x.injured ? "/inj" : ""};${x.kind};${x.category}/${x.image}]`).join(" | ")}`);
  } finally {
    Math.random = oldRandom;
  }
}

function assertForcedInjurySuppression() {
  for (const id of ["extra_youth_cup_sub", "st_youth_debut", "st_bench", "am_fans_whistle"]) {
    const event = eventById(id);
    assert(event, `forced injury regression event missing: ${id}`);
    let s = createGame(player(450045));
    s.careerSeed = 450045;
    const clubId = s.offers[0]?.clubId;
    assert(clubId, `forced injury regression has no club offer`);
    s = chooseClub(s, clubId);
    s.flags["opening_v1"] = 1;
    s.flags["opening_completed"] = 1;
    s.injury = { label: "Sobrecarga muscular QA", severity: "medium", matchesOut: 5, treated: true };
    s.pending = { type: "event", eventId: id };
    const scrubbed = scrubDisallowedNarrative(s);
    assert(!(scrubbed.pending?.type === "event" && scrubbed.pending.eventId === id), `injured player still sees ${id}: ${event.title}`);
  }
}

assertForcedInjurySuppression();
const modes: CareerMode[] = ["express", "standard", "pro"];
const seeds = [101, 2026, 31337, 90909];
for (const mode of modes) for (const seed of seeds) run(mode, seed + modes.indexOf(mode) * 100000);
console.log("REAL_CAREER_PLAYTEST_OK: forced injury event suppression plus 12 deterministic careers x first 15 meaningful decisions through the shipped safety path; passive match screens excluded and no generic match_flash filler.");
