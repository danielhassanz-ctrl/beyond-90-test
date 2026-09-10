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
type WithCareerMode = GameState & { careerMode?: CareerMode };

export function careerModeOf(s: GameState): CareerMode {
  const mode = (s as WithCareerMode).careerMode;
  return mode === "express" || mode === "pro" || mode === "standard" ? mode : DEFAULT_CAREER_MODE;
}
export function setCareerMode(s: GameState, mode: CareerMode): void { (s as WithCareerMode).careerMode = mode; }
export function careerModeConfig(mode: CareerMode): CareerModeConfig { return CAREER_MODES.find((x) => x.id === mode) ?? CAREER_MODES[1]!; }
function seededRange(s: GameState, key: string, range: readonly [number, number]): number {
  const [min, max] = range;
  if (max <= min) return min;
  return min + (hash(careerSeed(s), `${key}|${s.seasonIndex}|${careerModeOf(s)}`) % (max - min + 1));
}
export function narrativeTarget(s: GameState): number { return seededRange(s, "narrative-target", careerModeConfig(careerModeOf(s)).narrative); }
export function keyMatchTarget(s: GameState): number { return seededRange(s, "key-match-target", careerModeConfig(careerModeOf(s)).keyMatches); }
/** Exact number of meaningful choices targeted for this season. */
export function decisionTarget(s: GameState): number { return narrativeTarget(s) + keyMatchTarget(s); }

/** Decision mix ages with the player instead of repeating the same season forever. */
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
const queueMatchUnits = (slots: Slot[]): number => slots.reduce((sum, slot) => sum + (slot.kind === "match" ? 1 : slot.kind === "sim" ? (slot.matches ?? 0) : 0), 0);

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

function reduceSimulatedMatches(slots: Slot[], amount: number): number {
  let left = amount;
  for (let i = slots.length - 1; i >= 0 && left > 0; i--) {
    const slot = slots[i];
    if (slot?.kind !== "sim") continue;
    const current = slot.matches ?? 0;
    const reducible = Math.max(0, current - 1);
    const cut = Math.min(left, reducible);
    if (cut > 0) { slot.matches = current - cut; left -= cut; }
  }
  return amount - left;
}
function addSimulatedMatches(slots: Slot[], amount: number): void {
  if (amount <= 0) return;
  const sims = slots.filter((slot) => slot.kind === "sim");
  if (sims.length) { const target = sims[sims.length - 1]!; target.matches = (target.matches ?? 0) + amount; return; }
  slots.push({ kind: "sim", matches: amount });
}
/** Preserve the football calendar: pacing changes interaction density, never the number of fixtures. */
function restoreSeasonMatchUnits(slots: Slot[], target: number): void {
  const current = queueMatchUnits(slots);
  if (current < target) { addSimulatedMatches(slots, target - current); return; }
  if (current > target) {
    const cut = reduceSimulatedMatches(slots, current - target);
    if (cut < current - target) throw new Error(`Career pacing cannot preserve season calendar: target ${target}, current ${current}`);
  }
}

/**
 * Return only key matches that are justified by this exact career state.
 * No fallback "decisive/cup/scouts" matches are manufactured to satisfy a
 * pacing quota. If the football calendar cannot support the target, the mode
 * spends the remaining interaction budget on narrative decisions instead.
 */
function contextualKeySlots(s: GameState, amount: number): Slot[] {
  if (amount <= 0) return [];
  const eligible = eligibleKeyMatchKinds(s);
  const candidates: Slot[] = [];
  const euro = europeanCompetition(s);
  const existing = s.queue.filter((slot) => slot.kind === "match");
  const hasTag = (tag: NonNullable<Slot["tag"]>) => existing.some((slot) => slot.tag === tag) || candidates.some((slot) => slot.tag === tag);
  const push = (slot: Slot) => { if (candidates.length < amount) candidates.push(slot); };

  if (eligible.includes("europe") && euro && !hasTag("euro")) push({ kind: "match", tag: "euro", tie: true, competition: euro });
  if (eligible.includes("exclub") && !hasTag("exclub")) push({ kind: "match", tag: "exclub" });
  if (eligible.includes("derby") && !hasTag("derby")) push({ kind: "match", tag: "derby" });
  if (eligible.includes("cup") && !hasTag("cup")) push({ kind: "match", tag: "cup", tie: true });
  if (eligible.includes("title_decider") && !hasTag("decisive")) push({ kind: "match", tag: "decisive" });
  if (eligible.includes("debut") && !hasTag("debut")) push({ kind: "match", tag: "debut" });

  return candidates.slice(0, amount);
}

function addKeyMatches(s: GameState, slots: Slot[], amount: number): { slots: Slot[]; added: number } {
  if (amount <= 0) return { slots, added: 0 };
  const out = [...slots];
  const additions = contextualKeySlots({ ...s, queue: out }, amount);
  additions.forEach((slot, n) => {
    const insertAt = Math.max(1, Math.round(((n + 1) * out.length) / (additions.length + 1)));
    out.splice(insertAt, 0, slot);
  });
  return { slots: out, added: additions.length };
}

function addNarrativeSlots(s: GameState, slots: Slot[], amount: number): Slot[] {
  if (amount <= 0) return slots;
  const rotation = narrativeRotationFor(s);
  const expanded: Slot[] = [];
  let added = 0;
  const insertEvery = Math.max(1, Math.floor(Math.max(1, slots.length) / amount));
  for (let i = 0; i < slots.length; i++) {
    expanded.push(slots[i]!);
    if (added < amount && (i + 1) % insertEvery === 0 && slots[i]?.kind !== "match") {
      expanded.push({ kind: "event", category: rotation[(i + added) % rotation.length]! });
      added += 1;
    }
  }
  while (added < amount) { expanded.push({ kind: "event", category: rotation[added % rotation.length]! }); added += 1; }
  return expanded;
}

export function applyCareerPacing(s: GameState): void {
  if (!s.clubId || !Array.isArray(s.queue)) return;
  const marker = 10_000 + s.seasonIndex;
  if (s.flags["career_pacing_season"] === marker) return;

  const originalQueueMatchUnits = queueMatchUnits(s.queue);
  const totalTarget = decisionTarget(s);
  const preferredNarrative = narrativeTarget(s);
  const preferredMatches = keyMatchTarget(s);
  const wantedQueuedMatches = Math.max(0, preferredMatches - pendingMatchDecisions(s));

  // Remove surplus optional key matches first; sacred story matches stay.
  let removeMatches = Math.max(0, s.queue.filter((slot) => slot.kind === "match").length - wantedQueuedMatches);
  if (removeMatches > 0) {
    const next: Slot[] = [];
    for (const slot of s.queue) {
      if (slot.kind === "match" && removeMatches > 0 && slot.tag !== "debut" && slot.tag !== "final" && slot.tag !== "euro") { removeMatches -= 1; continue; }
      next.push(slot);
    }
    s.queue = next;
  }

  const beforePlayable = s.queue.filter((slot) => slot.kind === "match").length;
  const added = addKeyMatches(s, s.queue, Math.max(0, wantedQueuedMatches - beforePlayable));
  s.queue = added.slots;
  const actualMatchDecisions = pendingMatchDecisions(s) + s.queue.filter((slot) => slot.kind === "match").length;

  // Any unavailable key-match budget becomes real narrative interaction.
  const wantedNarrative = Math.max(preferredNarrative, totalTarget - actualMatchDecisions);
  if (s.director) s.director.budget = wantedNarrative;
  const wantedQueuedNarrative = Math.max(0, wantedNarrative - pendingNarrativeDecisions(s));
  s.queue = compressNarrative(s.queue, wantedQueuedNarrative);
  const existingQueuedNarrative = s.queue.filter(isNarrativeSlot).length;
  s.queue = addNarrativeSlots(s, s.queue, Math.max(0, wantedQueuedNarrative - existingQueuedNarrative));

  restoreSeasonMatchUnits(s.queue, originalQueueMatchUnits);
  s.flags["career_pacing_season"] = marker;
}
