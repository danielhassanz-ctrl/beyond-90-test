import {
  ensureCast,
  type AdviserKind as NpcAdviserKind,
  type CareerCast as NpcCareerCast,
  type CastPerson,
} from "./npc";
import type { GameState } from "./types";

export type CareerEra = "academy" | "breakthrough" | "established" | "prime" | "veteran" | "legacy";
export type CareerStatus = "prospect" | "squad" | "starter" | "star" | "elite" | "legend";
export type AdviserKind = NpcAdviserKind;
export type CareerPerson = CastPerson;
export type CareerCast = NpcCareerCast;

/**
 * Fachada narrativa del reparto persistente. La creación y migración viven
 * exclusivamente en npc.ts para que todo el juego comparta exactamente las
 * mismas identidades durante una carrera completa.
 */
export function ensureCareerCast(s: GameState): CareerCast {
  return ensureCast(s);
}

/**
 * Etapas cronológicas del Football Career Story Director.
 * 16-18 promesa · 19-21 irrupción · 22-25 consolidación · 26-30 plenitud ·
 * 31-34 veterano · 35+ legado. Mantener estos límites en un único lugar evita
 * que escenas de estrella consolidada aparezcan un año antes de tiempo.
 */
export function careerEra(s: GameState): CareerEra {
  if (s.age <= 18) return "academy";
  if (s.age <= 21) return "breakthrough";
  if (s.age <= 25) return "established";
  if (s.age <= 30) return "prime";
  if (s.age <= 34) return "veteran";
  return "legacy";
}

export function careerStatus(s: GameState): CareerStatus {
  const titles = s.titles?.length ?? 0;
  const awards = s.awards?.length ?? 0;

  // Age is a hard narrative prerequisite, not just another stat. An exceptional
  // academy player may already be a star, but must not unlock established-elite
  // or legend scenes before the career has actually reached those eras.
  if (s.age <= 18) {
    if (s.overall >= 83 || s.fame >= 75 || awards >= 1) return "star";
    if (s.overall >= 76 || s.fame >= 45) return "starter";
    if (s.overall >= 70) return "squad";
    return "prospect";
  }

  if (s.age >= 27 && s.overall >= 89 && (titles >= 4 || awards >= 2)) return "legend";
  if (s.overall >= 88 || awards >= 1) return "elite";
  if (s.overall >= 83 || s.fame >= 75) return "star";
  if (s.overall >= 76 || s.fame >= 45) return "starter";
  if (s.overall >= 70) return "squad";
  return "prospect";
}

export function plausibleMoneyScale(s: GameState): "youth" | "pro" | "star" | "superstar" {
  const status = careerStatus(s);
  if (s.age <= 18 || status === "prospect") return "youth";
  if (status === "squad" || status === "starter") return "pro";
  if (status === "star") return "star";
  return "superstar";
}

export function canReceiveSocialDm(s: GameState): boolean {
  return s.age >= 17 && s.fame >= 18 && !s.flags["social_dm_intro"];
}

export function touch(person: CareerPerson, s: GameState, delta = 0): void {
  person.met = true;
  person.lastContactScene = s.sceneCount;
  person.relation = Math.max(0, Math.min(100, person.relation + delta));
}
