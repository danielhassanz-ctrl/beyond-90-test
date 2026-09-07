/**
 * Sistema para actualizar estadísticas del jugador basándose en eventos.
 * Se llama después de resolver un evento para registrar logros.
 */

import type { Player } from "@/types/player";
import type { GameEvent } from "@/types/career";

export interface StatUpdate {
  matches_played?: number;
  goals?: number;
  assists?: number;
  minutes_played?: number;
  red_cards?: number;
  yellow_cards?: number;
  titles?: number;
}

/**
 * Detecta cambios de stats basándose en el contenido del evento.
 * Escanea la descripción y title buscando palabras clave.
 */
export function extractStatsFromEvent(event: GameEvent): StatUpdate {
  const update: StatUpdate = {};

  const text = `${event.title} ${event.description}`.toLowerCase();

  // Detectar si fue un partido (increment matches)
  if (
    event.category === "partido" ||
    text.includes("partido") ||
    text.includes("jornada") ||
    text.includes("match") ||
    text.includes("gol")
  ) {
    update.matches_played = 1;
  }

  // Detectar goles
  const goalMatches = text.match(/(\d+)\s*gol|gol.*(\d+)|hat[\s-]*trick|triplete/gi);
  if (goalMatches) {
    if (text.includes("hat") || text.includes("triplete")) {
      update.goals = 3;
    } else if (text.includes("doblete") || text.includes("dos goles")) {
      update.goals = 2;
    } else if (text.includes("gol") && !text.includes("0 gol")) {
      update.goals = 1;
    }
  }

  // Detectar asistencias
  if (text.includes("asistencia") || text.includes("pase gol")) {
    update.assists = 1;
  }

  // Detectar tarjetas
  if (text.includes("roja") || text.includes("red card")) {
    update.red_cards = 1;
  } else if (text.includes("amarilla") || text.includes("yellow")) {
    update.yellow_cards = 1;
  }

  // Detectar títulos
  if (
    text.includes("campeón") ||
    text.includes("título") ||
    text.includes("copa") ||
    text.includes("champions") ||
    text.includes("championship") ||
    text.includes("ganador")
  ) {
    update.titles = 1;
  }

  // Detectar minutos (parsing crude)
  const minutesMatch = text.match(/(\d+)\s*minutos/i);
  if (minutesMatch) {
    update.minutes_played = parseInt(minutesMatch[1], 10);
  } else if (text.includes("90") || text.includes("full match")) {
    update.minutes_played = 90;
  } else if (text.includes("entrada") || text.includes("entra")) {
    update.minutes_played = 45; // Aproximación para entrada en segundo tiempo
  }

  return update;
}

/**
 * Aplica los cambios de stats al jugador.
 * Retorna el jugador actualizado.
 */
export function applyStatUpdate(player: Player, update: StatUpdate): Player {
  return {
    ...player,
    stats_matches_played: (player.stats_matches_played ?? 0) + (update.matches_played ?? 0),
    stats_goals: (player.stats_goals ?? 0) + (update.goals ?? 0),
    stats_assists: (player.stats_assists ?? 0) + (update.assists ?? 0),
    stats_minutes_played: (player.stats_minutes_played ?? 0) + (update.minutes_played ?? 0),
    stats_red_cards: (player.stats_red_cards ?? 0) + (update.red_cards ?? 0),
    stats_yellow_cards: (player.stats_yellow_cards ?? 0) + (update.yellow_cards ?? 0),
    stats_titles: (player.stats_titles ?? 0) + (update.titles ?? 0),
  };
}

/**
 * Ajusta la media futbolística de forma incremental a partir de lo que pasó
 * en ESTE evento — no la recalcula desde cero cada vez. Recalcularla como
 * promedio absoluto de stats acumuladas machacaba a cualquier jugador que
 * aún no tuviera partidos jugados (p.ej. media 100 en forma pero 0 partidos
 * caía a ~25, porque forma pesaba 0-100 pero los otros tres factores solo
 * sumaban hasta 20-30 sobre el mismo divisor de 4). Con un ajuste pequeño
 * anclado a la media actual, un evento sin relevancia estadística real
 * (firmar un contrato, una entrevista) no mueve la media en absoluto.
 */
export function recalculateMedia(player: Player, statUpdate: StatUpdate): number {
  const currentMedia = player.media ?? 50;

  if (!statUpdate.matches_played && !statUpdate.goals && !statUpdate.titles && !statUpdate.red_cards) {
    return currentMedia;
  }

  let delta = 0;
  if (statUpdate.goals) delta += statUpdate.goals * 2;
  if (statUpdate.assists) delta += statUpdate.assists;
  if (statUpdate.matches_played && !statUpdate.goals) delta += 0.5;
  if (statUpdate.titles) delta += 5;
  if (statUpdate.red_cards) delta -= 3;

  // La forma empuja un poco la dirección: buena forma acelera la progresión
  delta += ((player.forma ?? 50) - 50) / 50;

  return Math.max(40, Math.min(99, Math.round(currentMedia + delta)));
}
