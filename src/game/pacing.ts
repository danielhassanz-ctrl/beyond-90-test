import { europeanCompetition } from "./career";
import { careerEra } from "./career-life";
import { eligibleKeyMatchKinds } from "./competition-calendar";
import { careerSeed, hash } from "./npc";
import type { EventCategory, GameState, Slot } from "./types";

export type CareerMode = "express" | "standard" | "pro";

export interface CareerModeConfig {
  id: CareerMode;
  label: string;
  description: string;
  decisions: readonly [number, number];
  narrative: readonly [number, number];
  keyMatches: readonly [number, number];
}

export const CAREER_MODES: readonly CareerModeConfig[] = [
  { id: "express", label: "Express", description: "10–15 decisiones por temporada. Vive los grandes giros sin alargar los capítulos secundarios.", decisions: [10, 15], narrative: [6, 9], keyMatches: [4, 6] },
  { id: "standard", label: "Standard", description: "20–25 decisiones por temporada. Equilibrio entre fútbol, vestuario, vida, agente y mercado.", decisions: [20, 25], narrative: [15, 18], keyMatches: [5, 7] },
  { id: "pro", label: "Pro", description: "30–40 decisiones por temporada. Carrera profunda, con relaciones, vida, dinero y callbacks largos.", decisions: [30, 40], narrative: [24, 32], keyMatches: [6, 8] },
] as const;

export const DEFAULT_CAREER_MODE: CareerMode = "standard";

export function careerModeOf(s: Pick<GameState, "careerMode">): CareerMode {
  const mode = s.careerMode;
  return mode === "express" || mode === "pro" || mode === "standard" ? mode : DEFAULT_CAREER_MODE;
}
export function setCareerMode(s: GameState, mode: CareerMode): void { s.careerMode = mode; }
export function careerModeConfig(mode: CareerMode): CareerModeConfig { return CAREER_MODES.find((x) => x.id === mode) ?? CAREER_MODES[1]!; }

function seededRange(s: GameState, key: string, range: readonly [number, number]): number {
  const [min, max] = range;
  if (max <= min) return min;
  return min + (hash(careerSeed(s), `${key}|${s.seasonIndex}|${careerModeOf(s)}`) % (max - min + 1));
}
export function narrativeTarget(s: GameState): number { return seededRange(s, "narrative-target", careerModeConfig(careerModeOf(s)).narrative); }
export function keyMatchTarget(s: GameState): number { return seededRange(s, "key-match-target", careerModeConfig(careerModeOf(s)).keyMatches); }
export function decisionTarget(s: GameState): number { return narrativeTarget(s) + keyMatchTarget(s); }

export function narrativeRotationFor(s: GameState): EventCategory[] {
  switch (careerEra(s)) {
    case "academy": return ["agent", "training", "club", "life", "training", "agent", "gossip", "story", "club"];
    case "breakthrough": return ["club", "training", "agent", "market", "press", "life", "gossip", "agent", "story"];
    case "established": return ["club", "market", "press", "agent", "life", "training", "gossip", "market", "story"];
    case "prime": return ["market", "press", "club", "agent", "life", "story", "press", "medical", "market"];
    case "veteran": return ["medical", "club", "agent", "life", "press", "market", "story", "medical", "life"];
    case "legacy": return ["life", "agent", "medical", "press", "story", "market", "life", "club", "medical"];
  }
}

const isNarrativeSlot = (slot: Slot): boolean => slot.kind === "event" || slot.kind === "agent" || slot.kind === "life";
const pendingNarrativeDecisions = (s: GameState): number => s.pending?.type === "event" ? 1 : 0;
const pendingMatchDecisions = (s: GameState): number => s.pending?.type === "match" ? 1 : 0;

function compressNarrative(slots: Slot[], keepCount: number): Slot[] {
  const indices = slots.map((slot, i) => ({ slot, i })).filter((x) => isNarrativeSlot(x.slot)).map((x) => x.i);
  if (indices.length <= keepCount) return slots;
  if (keepCount <= 0) return slots.filter((slot) => !isNarrativeSlot(slot));
  const keep = new Set<number>();
  if (keepCount === 1) keep.add(indices[0]!);
  else for (let n = 0; n < keepCount; n++) keep.add(indices[Math.round((n * (indices.length - 1)) / (keepCount - 1))]!);

  const adviserIndex = indices.find((i) => slots[i]?.kind === "agent");
  if (adviserIndex !== undefined && !keep.has(adviserIndex)) {
    const replaceable = [...keep].reverse().find((i) => slots[i]?.kind === "event" && slots[i]?.category !== "preseason");
    if (replaceable !== undefined) keep.delete(replaceable);
    keep.add(adviserIndex);
  }
  return slots.filter((slot, i) => !isNarrativeSlot(slot) || keep.has(i));
}

function contextualKeySlots(s: GameState, missing: number): Slot[] {
  if (missing <= 0) return [];
  const eligible = eligibleKeyMatchKinds(s);
  const euro = europeanCompetition(s);
  const additions: Slot[] = [];
  const hasTag = (tag: NonNullable<Slot["tag"]>) => s.queue.some((slot) => slot.kind === "match" && slot.tag === tag);
  const push = (slot: Slot) => { if (additions.length < missing) additions.push(slot); };

  if (eligible.includes("europe") && euro && !hasTag("euro")) push({ kind: "match", tag: "euro", tie: true, competition: euro });
  if (eligible.includes("exclub") && !hasTag("exclub")) push({ kind: "match", tag: "exclub" });
  if (eligible.includes("derby") && !hasTag("derby")) push({ kind: "match", tag: "derby" });
  if (eligible.includes("cup")) push({ kind: "match", tag: "cup", tie: true });
  if (eligible.includes("title_decider")) push({ kind: "match", tag: "decisive" });
  if (eligible.includes("debut") && !hasTag("debut")) push({ kind: "match", tag: "debut" });

  const fallback: Slot[] = [
    { kind: "match", tag: "decisive", label: "Partido clave de la temporada" },
    { kind: "match", tag: "cup", tie: true },
    { kind: "match", tag: "scouts" },
  ];
  let i = 0;
  while (additions.length < missing) additions.push(fallback[i++ % fallback.length]!);
  return additions;
}

function addMissingKeyMatches(s: GameState, slots: Slot[], missing: number): Slot[] {
  if (missing <= 0) return slots;
  const out = [...slots];
  const additions = contextualKeySlots({ ...s, queue: out }, missing);
  additions.forEach((addition, n) => {
    const candidates = out
      .map((slot, i) => ({ slot, i }))
      .filter(({ slot }) => slot.kind === "sim" || isNarrativeSlot(slot))
      .map(({ i }) => i);
    const fallback = Math.max(0, out.length - 1);
    const pickIndex = candidates.length
      ? candidates[Math.floor(((n + 1) * candidates.length) / (additions.length + 1))]!
      : fallback;
    out.splice(pickIndex + 1, 0, addition);
  });
  return out;
}

export function applyCareerPacing(s: GameState): void {
  if (!s.clubId || !Array.isArray(s.queue)) return;
  const marker = 10_000 + s.seasonIndex;
  if (s.flags["career_pacing_season"] === marker) return;

  const wantedNarrative = narrativeTarget(s);
  const wantedMatches = keyMatchTarget(s);
  if (s.director) s.director.budget = wantedNarrative;

  const wantedQueuedMatches = Math.max(0, wantedMatches - pendingMatchDecisions(s));
  let removeMatches = Math.max(0, s.queue.filter((slot) => slot.kind === "match").length - wantedQueuedMatches);
  if (removeMatches > 0) {
    const next: Slot[] = [];
    for (const slot of s.queue) {
      if (slot.kind === "match" && removeMatches > 0 && slot.tag !== "debut" && slot.tag !== "final" && slot.tag !== "euro") { removeMatches -= 1; continue; }
      next.push(slot);
    }
    s.queue = next;
  }

  const currentQueuedMatches = s.queue.filter((slot) => slot.kind === "match").length;
  s.queue = addMissingKeyMatches(s, s.queue, Math.max(0, wantedQueuedMatches - currentQueuedMatches));

  const wantedQueuedNarrative = Math.max(0, wantedNarrative - pendingNarrativeDecisions(s));
  s.queue = compressNarrative(s.queue, wantedQueuedNarrative);
  const existingQueuedNarrative = s.queue.filter(isNarrativeSlot).length;
  const missing = Math.max(0, wantedQueuedNarrative - existingQueuedNarrative);
  if (missing > 0) {
    const rotation = narrativeRotationFor(s);
    const insertEvery = Math.max(1, Math.floor(Math.max(1, s.queue.length) / missing));
    const expanded: Slot[] = [];
    let added = 0;
    for (let i = 0; i < s.queue.length; i++) {
      expanded.push(s.queue[i]!);
      if (added < missing && (i + 1) % insertEvery === 0 && s.queue[i]?.kind !== "match") {
        expanded.push({ kind: "event", category: rotation[(i + added) % rotation.length]! });
        added += 1;
      }
    }
    while (added < missing) { expanded.push({ kind: "event", category: rotation[added % rotation.length]! }); added += 1; }
    s.queue = expanded;
  }
  s.flags["career_pacing_season"] = marker;
}
