/**
 * Tope de media según la edad. Sin él, un jugador de 19 años llegaba a 87 de
 * media solo con partidos y escenas buenas. Es un tope con margen: un joven
 * prodigio que destaca (mucha fama) puede ir por encima del tope normal de su
 * edad, hasta +6; a partir de los 25 ya no hay tope de edad.
 */
import { playerAge } from "@/types/career";

const BASE_CAP: Record<number, number> = { 16: 68, 17: 72, 18: 76, 19: 80, 20: 83, 21: 86, 22: 88, 23: 90, 24: 92 };

export function maxMediaForAge(week: number, fama: number): number {
  const age = playerAge(week);
  if (age >= 25) return 99;
  const base = BASE_CAP[Math.max(16, age)] ?? 68;
  const prodigy = Math.max(0, Math.min(6, Math.floor((fama - 45) / 8)));
  return Math.min(99, base + prodigy);
}
