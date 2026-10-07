/**
 * HILOS ABIERTOS: la marca que dura. Una decisión puede dejar un favor que
 * debes (o que te deben), una deuda, un rencor, una promesa o un secreto con
 * una persona concreta. Se guarda con nombre y apellidos y, semanas o
 * temporadas después, esa persona REAPARECE a cobrarlo (ver
 * generateThreadPayoffEvent en ai.ts). El libro de decisiones (ledger.ts)
 * recuerda qué elegiste; los hilos recuerdan a QUIÉN le debes qué.
 *
 * Todo vive en player.flags.hilos (JSON), sin columnas nuevas.
 */
import type { Player } from "@/types/player";

export type ThreadKind = "favor" | "deuda" | "rencor" | "promesa" | "secreto";
export const THREAD_KINDS: ThreadKind[] = ["favor", "deuda", "rencor", "promesa", "secreto"];

export interface Thread {
  /** Semana en que nació. */
  w: number;
  k: ThreadKind;
  /** Persona (nombre y apellidos). */
  who: string;
  /** Qué quedó pendiente, en una frase. */
  t: string;
  /** 1 si ya se cobró / se resolvió. */
  u?: 1;
}

const MAX_THREADS = 10;
/** Turnos mínimos antes de que un hilo pueda cobrarse, y máximo de antigüedad. */
export const THREAD_MIN_AGE = 6;
export const THREAD_MAX_AGE = 100;
const THREAD_COOLDOWN = 6;

export const THREAD_LABELS: Record<ThreadKind, string> = {
  favor: "Favor pendiente",
  deuda: "Deuda",
  rencor: "Rencor",
  promesa: "Promesa",
  secreto: "Secreto",
};

export function readThreads(flags: Record<string, string | boolean> | null | undefined): Thread[] {
  const raw = flags?.hilos;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as Thread[];
    return Array.isArray(parsed) ? parsed.filter((t) => t && THREAD_KINDS.includes(t.k) && t.who && t.t) : [];
  } catch {
    return [];
  }
}

/** Devuelve el JSON actualizado, o null si el hilo no es válido o ya existe. */
export function appendThread(
  flags: Record<string, string | boolean> | null | undefined,
  thread: { kind: string; who: string; text: string },
  week: number,
): string | null {
  const kind = THREAD_KINDS.find((k) => k === thread.kind);
  const who = thread.who?.trim();
  const text = thread.text?.trim();
  if (!kind || !who || !text) return null;
  const list = readThreads(flags);
  // El mismo vínculo con la misma persona no se duplica.
  if (list.some((t) => !t.u && t.who === who && t.k === kind)) return null;
  list.push({ w: week, k: kind, who: who.slice(0, 60), t: text.slice(0, 160) });
  while (list.length > MAX_THREADS) {
    const closed = list.findIndex((t) => t.u);
    list.splice(closed >= 0 ? closed : 0, 1);
  }
  return JSON.stringify(list);
}

export function openThreads(flags: Record<string, string | boolean> | null | undefined): Thread[] {
  return readThreads(flags).filter((t) => !t.u);
}

/** El hilo más antiguo que ya ha madurado (ni demasiado reciente ni olvidado). */
export function pickThreadDue(player: Pick<Player, "flags" | "week">): Thread | null {
  const ripe = openThreads(player.flags).filter((t) => player.week - t.w >= THREAD_MIN_AGE && player.week - t.w <= THREAD_MAX_AGE);
  return ripe.length > 0 ? ripe[0] : null;
}

export function shouldTriggerThreadPayoff(player: Player): boolean {
  const last = parseInt(String(player.flags?.thread_last_week ?? "0"), 10) || 0;
  if (last > 0 && player.week - last < THREAD_COOLDOWN) return false;
  if (!pickThreadDue(player)) return false;
  return Math.random() < 0.6;
}

/** Marca el hilo como cobrado (devuelve el JSON actualizado). */
export function consumeThread(flags: Record<string, string | boolean> | null | undefined, thread: Thread): string {
  return JSON.stringify(
    readThreads(flags).map((t) => (t.w === thread.w && t.who === thread.who && t.k === thread.k ? { ...t, u: 1 as const } : t)),
  );
}

/** Para el resumen de estado de la IA. */
export function describeOpenThreads(flags: Record<string, string | boolean> | null | undefined, week: number): string[] {
  return openThreads(flags).map((t) => `${THREAD_LABELS[t.k]} con ${t.who} (hace ${Math.max(1, week - t.w)} turnos): ${t.t}`);
}

/** En la segunda vida: ¿toca que reaparezca un asunto pendiente de la carrera? (cada 3 turnos como mínimo) */
export function shouldTriggerSecondLifePayoff(player: Pick<Player, "flags" | "second_week">): boolean {
  if (openThreads(player.flags).length === 0) return false;
  const last = parseInt(String(player.flags?.thread_last_second_week ?? "0"), 10) || 0;
  if (player.second_week < 2 || player.second_week - last < 3) return false;
  return Math.random() < 0.5;
}
