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
  {
    id: "express",
    label: "Express",
    description: "10–15 decisiones por temporada. Vive los grandes giros sin alargar los capítulos secundarios.",
    decisions: [10, 15],
    narrative: [6, 9],
    keyMatches: [4, 6],
  },
  {
    id: "standard",
    label: "Standard",
    description: "20–25 decisiones por temporada. Equilibrio entre fútbol, vestuario, vida, agente y mercado.",
    decisions: [20, 25],
    narrative: [15, 18],
    keyMatches: [5, 7],
  },
  {
    id: "pro",
    label: "Pro",
    description: "30–40 decisiones por temporada. Carrera profunda, con relaciones, vida, dinero y callbacks largos.",
    decisions: [30, 40],
    narrative: [24, 32],
    keyMatches: [6, 8],
  },
] as const;

export const DEFAULT_CAREER_MODE: CareerMode = "standard";

type WithCareerMode = GameState & { careerMode?: CareerMode };

export function careerModeOf(s: GameState): CareerMode {
  const mode = (s as WithCareerMode).careerMode;
  return mode === "express" || mode === "pro" || mode === "standard" ? mode : DEFAULT_CAREER_MODE;
}

export function setCareerMode(s: GameState, mode: CareerMode): void {
  (s as WithCareerMode).careerMode = mode;
}

export function careerModeConfig(mode: CareerMode): CareerModeConfig {
  return CAREER_MODES.find((x) => x.id === mode) ?? CAREER_MODES[1]!;
}

function seededRange(s: GameState, key: string, range: readonly [number, number]): number {
  const [min, max] = range;
  if (max <= min) return min;
  return min + (hash(careerSeed(s), `${key}|${s.seasonIndex}|${careerModeOf(s)}`) % (max - min + 1));
}

export function narrativeTarget(s: GameState): number {
  return seededRange(s, "narrative-target", careerModeConfig(careerModeOf(s)).narrative);
}

export function keyMatchTarget(s: GameState): number {
  return seededRange(s, "key-match-target", careerModeConfig(careerModeOf(s)).keyMatches);
}

const ROTATION: EventCategory[] = ["life", "training", "agent", "story", "press", "life", "gossip", "market", "club"];

/**
 * Applies the selected pacing to an already-created season plan.
 * It is intentionally idempotent per season. Informational/sim slots never
 * count as decisions. Extra density is made of interactive narrative slots,
 * not fake match cards.
 */
export function applyCareerPacing(s: GameState): void {
  if (!s.clubId || !Array.isArray(s.queue)) return;
  const marker = 10_000 + s.seasonIndex;
  if (s.flags["career_pacing_season"] === marker) return;

  const wantedNarrative = narrativeTarget(s);
  const wantedMatches = keyMatchTarget(s);
  if (s.director) s.director.budget = wantedNarrative;

  const matchIndices = s.queue.map((slot, i) => ({ slot, i })).filter((x) => x.slot.kind === "match");
  let removeMatches = Math.max(0, matchIndices.length - wantedMatches);
  if (removeMatches > 0) {
    const next: Slot[] = [];
    for (const slot of s.queue) {
      if (slot.kind === "match" && removeMatches > 0 && slot.tag !== "debut" && slot.tag !== "final" && slot.tag !== "euro") {
        removeMatches -= 1;
        continue;
      }
      next.push(slot);
    }
    s.queue = next;
  }

  const existingInteractive = s.queue.filter((x) => x.kind === "event" || x.kind === "agent" || x.kind === "life").length;
  const missing = Math.max(0, wantedNarrative - existingInteractive);
  if (missing > 0) {
    const insertEvery = Math.max(1, Math.floor(s.queue.length / missing));
    const expanded: Slot[] = [];
    let added = 0;
    for (let i = 0; i < s.queue.length; i++) {
      expanded.push(s.queue[i]!);
      if (added < missing && (i + 1) % insertEvery === 0 && s.queue[i]?.kind !== "match") {
        expanded.push({ kind: "event", category: ROTATION[(i + added) % ROTATION.length]! });
        added += 1;
      }
    }
    while (added < missing) {
      expanded.push({ kind: "event", category: ROTATION[added % ROTATION.length]! });
      added += 1;
    }
    s.queue = expanded;
  }

  s.flags["career_pacing_season"] = marker;
}
