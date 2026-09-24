/**
 * Progreso persistente de Copa y competición europea dentro de una
 * temporada — hasta ahora no existía en absoluto: cada temporada tenía
 * UN único partido de Copa fijo ("Eliminatoria", sin ronda real) y UNO
 * europeo, sin memoria de si seguías vivo o eliminado. Eso producía el
 * bug reportado en vivo (un evento de "Cuartos de Copa" apareciendo
 * después de que el jugador ya estuviera eliminado) y, más de fondo,
 * hacía que ninguna carrera tuviera un run de Copa/Champions real: nunca
 * había más partidos aunque siguieras ganando.
 *
 * El estado se guarda en player.flags (JSON), igual que el resto de
 * trackers del juego (loan_active, gol_chilena_tracker...) — no hace
 * falta ninguna columna nueva en la base de datos.
 */
import type { Player } from "@/types/player";

export interface CupProgress {
  season: number;
  round: number; // 1 = primera eliminatoria de la temporada, 2 = segunda...
  alive: boolean;
}

const COPA_ROUND_NAMES = ["Dieciseisavos de Copa del Rey", "Octavos de Copa del Rey"];
const EURO_ROUND_NAMES = ["Fase de grupos", "Octavos de final"];

function parseProgress(raw: string | boolean | undefined, season: number): CupProgress {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as CupProgress;
      if (parsed.season === season) return parsed;
    } catch {
      // ignora JSON corrupto, empieza de cero
    }
  }
  return { season, round: 0, alive: true };
}

export function getCopaProgress(player: Player, season: number): CupProgress {
  return parseProgress(player.flags?.copa_progress, season);
}

export function getEuroProgress(player: Player, season: number): CupProgress {
  return parseProgress(player.flags?.euro_progress, season);
}

export function copaRoundName(round: number): string {
  return COPA_ROUND_NAMES[round - 1] ?? "Copa del Rey";
}

export function euroRoundName(round: number): string {
  return EURO_ROUND_NAMES[round - 1] ?? "Fase de grupos";
}

/**
 * Se llama justo después de resolver el partido (generateMatchDayEvent)
 * cuando la competición es de eliminación directa — actualiza si el
 * jugador sigue vivo para la siguiente ronda de esa misma temporada.
 */
export function advanceCupProgress(
  player: Player,
  key: "copa_progress" | "euro_progress",
  season: number,
  round: number,
  won: boolean,
): void {
  if (!player.flags) player.flags = {};
  const next: CupProgress = { season, round: won ? round + 1 : round, alive: won };
  player.flags[key] = JSON.stringify(next);
}

/**
 * Resultado decidido en CÓDIGO (no por la IA) para que la crónica del
 * partido tenga que ajustarse a un marcador real y consistente, y para
 * poder actualizar el progreso de la eliminatoria de forma fiable — antes
 * el "resultado" solo existía como prosa libre de la IA, imposible de
 * usar para decidir si el jugador sigue vivo en el torneo.
 *
 * Favorece ligeramente al jugador en la primera ronda de Copa (equipo de
 * categoría superior contra un rival modesto) pero dejando sitio real a
 * la sorpresa clásica del torneo; en rondas siguientes el rival ya es
 * más fuerte y las opciones se igualan. Cuanto mejor la media del
 * jugador, más probable avanzar.
 */
export function decideKnockoutResult(
  playerMedia: number,
  round: number,
): { win: boolean; scoreLine: string; wentToPenalties: boolean } {
  const mediaFactor = Math.min(0.2, Math.max(-0.15, (playerMedia - 60) / 200));
  const baseChance = round === 1 ? 0.66 : 0.5;
  const winChance = Math.min(0.88, Math.max(0.25, baseChance + mediaFactor));

  const roll = Math.random();
  if (roll < winChance * 0.7) {
    // Victoria clara dentro del tiempo reglamentario
    const scores = ["2-0", "3-1", "2-1", "3-0", "1-0"];
    return { win: true, scoreLine: scores[Math.floor(Math.random() * scores.length)], wentToPenalties: false };
  }
  if (roll < winChance) {
    // Empate que se decide en la tanda de penaltis
    const scores = ["1-1 (5-4 en penaltis)", "0-0 (4-3 en penaltis)", "2-2 (6-5 en penaltis)"];
    return { win: true, scoreLine: scores[Math.floor(Math.random() * scores.length)], wentToPenalties: true };
  }
  if (roll < winChance + (1 - winChance) * 0.3) {
    const scores = ["1-1 (3-4 en penaltis)", "0-0 (2-4 en penaltis)"];
    return { win: false, scoreLine: scores[Math.floor(Math.random() * scores.length)], wentToPenalties: true };
  }
  const scores = ["0-1", "1-2", "0-2", "1-3"];
  return { win: false, scoreLine: scores[Math.floor(Math.random() * scores.length)], wentToPenalties: false };
}
