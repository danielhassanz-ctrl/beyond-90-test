/**
 * Jugadas decisivas nuevas + aperturas y cierres variables. Se mezclan con las
 * antiguas (engine.ts) para que, jugando muchas temporadas, dos partidos
 * seguidos no repitan ni la jugada, ni las opciones, ni la frase final.
 */
import type { NewDecision } from "./dsl";
import { ATTACKER_NEW } from "./attackers";
import { MIDFIELDER_NEW, DEFENDER_NEW } from "./midfield-defense";
import { GOALKEEPER_NEW } from "./keepers";

export type { NewDecision } from "./dsl";

export function newDecisionsFor(position: string): NewDecision[] {
  if (position === "Portero") return GOALKEEPER_NEW;
  if (position === "Defensa") return DEFENDER_NEW;
  if (position === "Centrocampista") return MIDFIELDER_NEW;
  return ATTACKER_NEW;
}

const CLOSERS = [
  "Decides en un instante.",
  "Todo pasa demasiado deprisa.",
  "El estadio contiene la respiración.",
  "No hay tiempo para dudar.",
  "El míster grita algo desde la banda que no llegas a entender.",
  "Los segundos se hacen eternos.",
  "Todo el mundo espera tu decisión.",
  "Lo que hagas ahora se recordará.",
  "Tu cuerpo decide antes que tu cabeza.",
  "El rival te mira. La grada también.",
  "Late el corazón en las sienes.",
  "Es ahora o nunca.",
  "Mides la distancia, el espacio, el tiempo.",
  "En la banda, tus compañeros se levantan.",
  "Un segundo, solo un segundo.",
  "Se hace un silencio raro en el campo.",
  "Notas el peso del partido en las piernas.",
  "Lo has hecho mil veces en el entrenamiento. Pero esto no es un entrenamiento.",
  "Tu pie ya sabe lo que quiere hacer.",
  "",
  "",
  "",
];

/** Frase final variable (a veces ninguna: no siempre hace falta apretar). */
export function decisionCloser(): string {
  const c = CLOSERS[Math.floor(Math.random() * CLOSERS.length)];
  return c ? ` ${c}` : "";
}

/** Elige una jugada nueva evitando las usadas hace poco. `recentRaw` = "3,7,12" (índices). */
export function pickNewDecision(position: string, recentRaw: unknown): { index: number; keep: number; decision: NewDecision } {
  const list = newDecisionsFor(position);
  const recent = String(recentRaw ?? "")
    .split(",")
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n));
  const keep = Math.max(2, Math.min(14, Math.floor(list.length / 2)));
  const banned = new Set(recent.slice(-keep));
  const candidates = list.map((_, i) => i).filter((i) => !banned.has(i));
  const pool = candidates.length > 0 ? candidates : list.map((_, i) => i);
  const index = pool[Math.floor(Math.random() * pool.length)];
  return { index, keep, decision: list[index] };
}

export function pushRecentNew(recentRaw: unknown, index: number, keep: number): string {
  const recent = String(recentRaw ?? "")
    .split(",")
    .filter(Boolean);
  recent.push(String(index));
  return recent.slice(-keep).join(",");
}
