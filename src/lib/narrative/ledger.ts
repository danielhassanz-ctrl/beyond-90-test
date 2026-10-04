/**
 * Libro de decisiones: lo que decides deja huella y VUELVE. Antes solo
 * algunas escenas guardaban un "hilo" a mano (memorableThread) y la IA veía
 * únicamente las últimas 4 decisiones: una promesa hecha hace seis meses
 * desaparecía sin más. Ahora cada decisión con peso se anota (título, qué
 * elegiste, qué cambió y cómo reaccionó el mundo) y, pasado un tiempo, una
 * escena de ECO la cobra: alguien reaparece, la promesa se cumple o se
 * rompe, el rencor pasa factura (ver pickEcho en engine.ts).
 *
 * Todo vive en player.flags.decisiones (JSON), sin columnas nuevas.
 */
import type { Consequences, EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { summarizeEffects } from "@/lib/narrative/effects";

export interface LedgerEntry {
  /** Semana de la decisión. */
  w: number;
  /** Título de la escena. */
  t: string;
  /** Lo que elegiste. */
  c: string;
  /** Efectos en números ("ánimo +5, entrenador −3"). */
  f: string | null;
  /** Reacción que viste (recortada). */
  o: string | null;
  /** Categoría de la escena. */
  k: string;
  /** 1 si ya tuvo su eco. */
  u?: 1;
}

const MAX_ENTRIES = 24;
/** Semanas mínimas antes de que una decisión pueda tener su eco, y máximo de antigüedad. */
export const ECHO_MIN_AGE = 4;
export const ECHO_MAX_AGE = 60;
const ECHO_COOLDOWN = 4;

/** Eventos técnicos o de rutina: nunca se anotan. */
const IGNORED_PREFIXES = ["match-decision-", "torneo-life-", "fisio-", "matchday-", "mercado-", "oferta-", "preseason-ev-", "agent-"];
const TECH_FLAGS = new Set([
  "bench_streak", "coach_bench", "physio_stage", "physio_diligent", "torneo_activo", "torneo_style", "torneo_life_recent",
  "dm_last_week", "dm_last_key", "transfer_interest", "transfer_interest_week", "transfer_interest_source", "match_done_week",
]);

function isWeighty(event: Pick<GameEvent, "id" | "isMilestone">, consequences: Consequences, freeText: string | null): boolean {
  if (IGNORED_PREFIXES.some((p) => event.id.startsWith(p))) return false;
  if (event.isMilestone) return true;
  if (typeof consequences.club === "string" && consequences.club) return true;
  if (freeText && freeText.trim().length > 3) return true;
  if (Math.abs(consequences.patrimonio ?? 0) >= 5000) return true;
  if (Math.abs(consequences.fama ?? 0) >= 8) return true;
  for (const key of ["rel_entrenador", "rel_vestuario", "rel_aficion", "rel_representante", "reputacion"] as const) {
    if (Math.abs(consequences[key] ?? 0) >= 6) return true;
  }
  const meaningful = Object.keys(consequences.flags ?? {}).some((k) => !TECH_FLAGS.has(k) && !k.startsWith("hilo_") && !k.startsWith("propiedad_"));
  return meaningful;
}

export function buildLedgerEntry(
  event: GameEvent,
  option: EventOption,
  consequences: Consequences,
  outcomeText: string | null,
  freeText: string | null,
  week: number,
): LedgerEntry | null {
  if (!isWeighty(event, consequences, freeText)) return null;
  return {
    w: week,
    t: event.title.slice(0, 90),
    c: option.label.slice(0, 120) + (freeText && freeText.trim() ? ` (y escribiste: "${freeText.trim().slice(0, 100)}")` : ""),
    f: summarizeEffects(consequences as Record<string, unknown>),
    o: outcomeText ? outcomeText.slice(0, 160) : null,
    k: event.category,
  };
}

export function readLedger(flags: Record<string, string | boolean> | null | undefined): LedgerEntry[] {
  const raw = flags?.decisiones;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as LedgerEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendLedger(flags: Record<string, string | boolean> | null | undefined, entry: LedgerEntry): string {
  const list = readLedger(flags);
  list.push(entry);
  // Si se llena, caen primero las que ya tuvieron su eco, luego las más antiguas.
  while (list.length > MAX_ENTRIES) {
    const consumedIdx = list.findIndex((e) => e.u);
    list.splice(consumedIdx >= 0 ? consumedIdx : 0, 1);
  }
  return JSON.stringify(list);
}

/** Decisiones aún sin eco, de más reciente a más antigua. */
export function pendingEchoes(player: Pick<Player, "flags">): LedgerEntry[] {
  return readLedger(player.flags)
    .filter((e) => !e.u)
    .sort((a, b) => b.w - a.w);
}

export function shouldTriggerEcho(player: Player): boolean {
  const last = parseInt(String(player.flags?.echo_last_week ?? "0"), 10) || 0;
  if (last > 0 && player.week - last < ECHO_COOLDOWN) return false;
  const candidate = pickEchoCandidate(player);
  if (!candidate) return false;
  return Math.random() < 0.5;
}

/** La decisión más antigua que ya ha madurado (ni demasiado reciente ni olvidada). */
export function pickEchoCandidate(player: Pick<Player, "flags" | "week">): LedgerEntry | null {
  const ripe = pendingEchoes(player).filter((e) => player.week - e.w >= ECHO_MIN_AGE && player.week - e.w <= ECHO_MAX_AGE);
  if (ripe.length === 0) return null;
  return ripe[ripe.length - 1];
}

/** Marca esa decisión como ya cobrada (devuelve el JSON del libro actualizado). */
export function consumeEcho(flags: Record<string, string | boolean> | null | undefined, entry: LedgerEntry): string {
  const list = readLedger(flags).map((e) => (e.w === entry.w && e.t === entry.t ? { ...e, u: 1 as const } : e));
  return JSON.stringify(list);
}

export function describeAgeWeeks(weeks: number): string {
  if (weeks < 12) return "hace unos meses";
  if (weeks < 25) return "hace casi una temporada";
  if (weeks < 45) return "hace más de una temporada";
  return "hace varias temporadas";
}
