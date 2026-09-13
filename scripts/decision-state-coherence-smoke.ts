import { ensureCareerCast, plausibleMoneyScale } from "../src/game/career-life";
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

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenSimilarity(a: string, b: string): number {
  const left = new Set(normalize(a).split(" ").filter(Boolean));
  const right = new Set(normalize(b).split(" ").filter(Boolean));
  if (left.size < 8 || right.size < 8) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / Math.max(left.size, right.size);
}

interface PlayableSignature {
  title: string;
  copy: string;
  family: string;
  choiceTriple: string;
}

function playableSignature(s: GameState): PlayableSignature | null {
  const p = s.pending;
  if (!p || p.type === "season") return null;
  if (p.type === "event") {
    const e = eventById(p.eventId);
    if (!e) return null;
    const text = typeof e.text === "function" ? e.text(s) : e.text;
    return {
      title: e.title,
      copy: `${e.title} ${text}`,
      family: e.family ?? `event:${e.id}`,
      choiceTriple: e.choices.map((choice) => normalize(choice.label)).join(" | "),
    };
  }
  if (p.type === "match") {
    if (!p.match.keyMoment) return null;
    return {
      title: p.match.ctx.storyLabel,
      copy: `${p.match.ctx.storyLabel} ${p.match.ctx.competition} ${p.match.opponent} ${p.match.keyMoment.prompt}`,
      family: `match:${p.match.ctx.specialTag ?? p.match.ctx.storyLabel}`,
      choiceTriple: p.match.keyMoment.options.map((choice) => normalize(choice.label)).join(" | "),
    };
  }
  const v = renderDynamic(s, p);
  return {
    title: v.title,
    copy: `${v.title} ${v.text}`,
    family: `dynamic:${p.kind}`,
    choiceTriple: v.choices.map((choice) => normalize(choice.label)).join(" | "),
  };
}

function assertFirst15Novelty(history: PlayableSignature[], next: PlayableSignature, tag: string) {
  const title = normalize(next.title);
  assert(title.length > 0, `${tag}: playable decision has an empty title`);
  assert(!history.some((entry) => normalize(entry.title) === title), `${tag}: repeated playable title: ${next.title}`);

  if (next.choiceTriple) {
    assert(!history.some((entry) => entry.choiceTriple && entry.choiceTriple === next.choiceTriple), `${tag}: repeated identical choice triple: ${next.choiceTriple}`);
  }

  for (const previous of history) {
    const similarity = tokenSimilarity(previous.copy, next.copy);
    assert(similarity < 0.86, `${tag}: near-duplicate setup text (${similarity.toFixed(2)}): "${previous.title}" -> "${next.title}"`);
  }

  if (history.length >= 2) {
    const previous = history[history.length - 1]!;
    const beforePrevious = history[history.length - 2]!;
    assert(!(previous.family === next.family && beforePrevious.family === next.family), `${tag}: more than two consecutive decisions from family ${next.family}`);
  }
}

function assertStateCoherence(s: GameState, mode: CareerMode, seed: number, decision: number) {
  const p = s.pending;
  if (!p || p.type === "season") return;
  const tag = `${mode}/${seed}/decision-${decision}`;
  const copy = visibleCopy(s);

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

  if (s.injury && /expulsi[oó]n|tarjeta roja|roja directa|marcaste|gol decisivo|entraste al campo|saltas al campo|titular|sustituci[oó]n|duelo t[aá]ctico/i.test(copy)) {
    assert(false, `${tag}: on-field/disciplinary copy surfaced while unavailable through ${s.injury.label}: ${copy.slice(0, 180)}`);
  }

  if (s.age <= 17) {
    assert(!/bal[oó]n de oro|champions|selecci[oó]n absoluta|contrato millonario|salario millonario|cobra(?:s)? millones|arabia/i.test(copy), `${tag}: elite/status copy leaked at age ${s.age}: ${copy.slice(0, 180)}`);
  }

  const moneyScale = plausibleMoneyScale(s);
  if (moneyScale === "youth" || moneyScale === "pro") {
    assert(!/contrato millonario|salario millonario|cobra(?:s)? (?:varios )?millones|mansi[oó]n de \d+ millones|patrimonio de \d+ millones/i.test(copy), `${tag}: money/status copy exceeds ${moneyScale} scale: ${copy.slice(0, 180)}`);
  }

  assert(Number.isFinite(s.salary) && s.salary >= 0, `${tag}: impossible salary ${s.salary}`);
  if (typeof s.wealth === "number") assert(Number.isFinite(s.wealth) && s.wealth >= 0, `${tag}: impossible wealth ${s.wealth}`);
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
    const expectedTeammate = fixedCast.teammate.name;
    const expectedSocial = fixedCast.social.name;
    const expectedPartner = fixedCast.partner.name;
    const playableHistory: PlayableSignature[] = [];

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
          const signature = playableSignature(s);
          if (signature) {
            assertFirst15Novelty(playableHistory, signature, `${mode}/${seed}/decision-${meaningful}`);
            playableHistory.push(signature);
          }
        } else if (s.pending.type === "match") {
          // Passive fixtures still must obey physical and chronological state, but never consume a meaningful-decision slot.
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
      assert(cast.teammate.name === expectedTeammate, `${mode}/${seed}: teammate drift ${expectedTeammate} -> ${cast.teammate.name}`);
      assert(cast.social.name === expectedSocial, `${mode}/${seed}: social-contact drift ${expectedSocial} -> ${cast.social.name}`);
      assert(cast.partner.name === expectedPartner, `${mode}/${seed}: partner drift ${expectedPartner} -> ${cast.partner.name}`);
      assert(cast.social.name !== cast.partner.name, `${mode}/${seed}: social contact and partner collapsed to the same identity (${cast.social.name})`);
    }

    assert(meaningful === 15, `${mode}/${seed}: only ${meaningful} meaningful decisions reached`);
    assert(playableHistory.length >= 14, `${mode}/${seed}: only ${playableHistory.length} rendered playable decisions recorded alongside opening club choice`);
  } finally {
    Math.random = oldRandom;
  }
}

const modes: CareerMode[] = ["express", "standard", "pro"];
const seeds = [71, 808, 4096, 65537];
for (const mode of modes) for (const seed of seeds) run(mode, seed + modes.indexOf(mode) * 100000);
console.log("DECISION_STATE_COHERENCE_OK: 12 deterministic careers keep injury, age/status, money, competition, full persistent-cast state, titles, setup text, choice triples and decision families coherent for the first 15 meaningful decisions.");
