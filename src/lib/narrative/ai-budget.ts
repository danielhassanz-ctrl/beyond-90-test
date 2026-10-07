/**
 * PRESUPUESTO DE IA POR CARRERA. Cada escena escrita por la IA cuesta dinero
 * real, y en las pruebas una carrera completa pedía ~500 llamadas (~14 US$
 * por jugador), la mitad de ellas crónicas de partidos rutinarios. El gasto en
 * texto tiene que ser pequeño y predecible: la IA se reserva para los momentos
 * que de verdad lo merecen y el resto lo cubren las escenas escritas a mano y
 * las crónicas generadas en código (que ya existían como red de seguridad).
 *
 * Funciona sin tocar a los llamadores: callEventTool (ai.ts) consulta aquí
 * antes de llamar a la API y, si no hay presupuesto, devuelve null, que es
 * justo lo que ya esperan todos para caer a su alternativa sin IA. El estado
 * de la petición en curso va en un AsyncLocalStorage para que dos jugadores a
 * la vez en el mismo servidor no se mezclen.
 */
import { AsyncLocalStorage } from "node:async_hooks";

export type AiPriority = "high" | "normal" | "low";

/** Llamadas de IA de texto por carrera completa (modo Pro). Se puede ajustar con AI_CAREER_BUDGET. */
const DEFAULT_TOTAL = 60;
/** Segunda vida: pocas escenas, todas importantes. */
export const SECOND_LIFE_BUDGET = 14;

interface BudgetStore {
  used: number;
  total: number;
  week: number;
  targetWeeks: number;
}

const storage = new AsyncLocalStorage<BudgetStore>();

export function careerBudgetTotal(mode: string | undefined): number {
  const envTotal = Number(process.env.AI_CAREER_BUDGET);
  const base = Number.isFinite(envTotal) && envTotal > 0 ? envTotal : DEFAULT_TOTAL;
  if (mode === "express") return Math.max(8, Math.round(base * 0.3));
  if (mode === "standard") return Math.round(base * 0.6);
  return base;
}

/** Prioridad por tipo de escena: lo emocional y lo memorable manda; la rutina espera. */
export function priorityFor(idPrefix: string, explicit?: AiPriority): AiPriority {
  if (explicit) return explicit;
  if (/^(echo|hilo|segunda-vida|inicio-fichaje|eleccion-representante|contrato|debut-pretemp|decline|adversity)/.test(idPrefix)) return "high";
  if (/^(matchday|partido)/.test(idPrefix)) return "low";
  return "normal";
}

/** ¿Hay presupuesto para esta llamada? Sin contexto de jugador (scripts, otros usos) siempre se permite. */
export function aiBudgetAllows(priority: AiPriority): boolean {
  const s = storage.getStore();
  if (!s) return true;
  if (s.used >= s.total) return false;
  // Ritmo: no gastarlo todo al principio de la carrera.
  const pace = Math.ceil(s.total * Math.min(1, s.week / Math.max(1, s.targetWeeks))) + 6;
  if (priority === "high") return true;
  if (priority === "normal") return s.used < pace && s.used < s.total * 0.85;
  return s.used < pace * 0.5 && Math.random() < 0.2;
}

export function recordAiCall(): void {
  const s = storage.getStore();
  if (s) s.used += 1;
}

/**
 * Ejecuta `fn` con el presupuesto del jugador y devuelve cuántas llamadas
 * lleva gastadas, para guardarlo en flags.ai_used.
 */
export async function runWithAiBudget<T>(
  opts: { used: number; total: number; week: number; targetWeeks: number },
  fn: () => Promise<T>,
): Promise<{ result: T; used: number }> {
  const store: BudgetStore = { ...opts };
  const result = await storage.run(store, fn);
  return { result, used: store.used };
}

/** Llamadas gastadas hasta ahora en la petición en curso (para guardarlas en flags.ai_used). */
export function currentAiUsed(): number | null {
  return storage.getStore()?.used ?? null;
}
