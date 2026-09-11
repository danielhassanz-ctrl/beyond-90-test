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

type SeenDecision = { title: string; text: string; choices: string[]; family: string; kind: string };

function eventText(s: GameState, id: string): string {
  const e = eventById(id);
  if (!e) return "";
  return typeof e.text === "function" ? e.text(s) : e.text;
}

function describe(s: GameState): SeenDecision | null {
  const p = s.pending;
  if (!p) return null;
  if (p.type === "season") return null;
  if (p.type === "event") {
    const e = eventById(p.eventId);
    assert(e, `missing event ${p.eventId}`);
    return { title: e.title, text: eventText(s, e.id), choices: e.choices.map((c) => c.label), family: e.family ?? e.category, kind: `event:${e.id}` };
  }
  if (p.type === "match") {
    return {
      title: `${p.match.ctx.competition} · ${p.match.opponent}`,
      text: `${p.match.ctx.storyLabel} ${p.match.ctx.venue}`,
      choices: p.match.keyMoment?.options.map((o) => o.label) ?? ["Jugar el partido"],
      family: "match",
      kind: "match",
    };
  }
  assert(p.kind !== "match_flash", `BANNED match_flash reached playable state: ${JSON.stringify(p.data)}`);
  const v = renderDynamic(s, p);
  return { title: v.title, text: v.text, choices: v.choices.map((c) => c.label), family: v.category, kind: `dynamic:${p.kind}` };
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
    const t = norm(d.title);
    assert(!titles.has(t), `${mode}/${seed}: repeated title in first 15: ${d.title}`);
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
        seen.push({ title: "Elegir primer club", text: `Comparas las ofertas iniciales y eliges ${offer}.`, choices: s.offers.slice(0, 4).map((o) => o.clubId), family: "club_choice", kind: "club_choice" });
        s = afterOpeningClubChoice(chooseClub(s, offer));
        continue;
      }

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

    assert(seen.length === 15, `${mode}/${seed}: only ${seen.length} playable decisions found`);
    assert((s.flags["opening_completed"] ?? 0) === 1, `${mode}/${seed}: opening never completed`);
    assertVariety(mode, seed, seen);

    const cast = ensureCareerCast(s);
    assert(cast.coach.name === names.coach, `${mode}/${seed}: coach drift ${names.coach} -> ${cast.coach.name}`);
    assert(cast.captain.name === names.captain, `${mode}/${seed}: captain drift ${names.captain} -> ${cast.captain.name}`);
    assert(cast.physio.name === names.physio, `${mode}/${seed}: physio drift ${names.physio} -> ${cast.physio.name}`);
    // Adviser may legitimately become Papá/Álex when the player explicitly chose them.
    assert(cast.adviser.name.length > 1, `${mode}/${seed}: adviser missing after opening`);

    for (const d of seen) {
      if (s.age <= 17) {
        assert(!/bal[oó]n de oro|champions|selecci[oó]n absoluta|contrato millonario|salario millonario|cobra(?:s)? millones/i.test(`${d.title} ${d.text}`), `${mode}/${seed}: elite/status leakage in teenage opening: ${d.title}`);
      }
    }

    console.log(`${mode}/${seed}: ${seen.map((x, i) => `${i + 1}.${x.title}`).join(" | ")}`);
  } finally {
    Math.random = oldRandom;
  }
}

const modes: CareerMode[] = ["express", "standard", "pro"];
const seeds = [101, 2026, 31337, 90909];
for (const mode of modes) for (const seed of seeds) run(mode, seed + modes.indexOf(mode) * 100000);
console.log("REAL_CAREER_PLAYTEST_OK: 12 deterministic careers x first 15 playable decisions; no generic match_flash filler.");
