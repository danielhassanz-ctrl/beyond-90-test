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

  // Detectar si fue un partido REAL resuelto — nunca por texto suelto:
  // casi cualquier escena de fútbol (vestuario, prensa, la víspera de un
  // partido) menciona la palabra "partido" o "jornada" sin que se haya
  // jugado nada. Con ese criterio, CUALQUIER evento de sabor contaba
  // como partido jugado de verdad, inflando partidos/goles y hasta la
  // media (recalculateMedia suma +0.5 solo por matches_played). Visto en
  // vivo jugando: una carrera con un puñado de partidos reales terminó
  // con "100 partidos, 62 goles" en la ficha de retiro. category
  // "partido" es suficiente por sí solo: todo evento de partido real
  // (guionado o generado por IA) ya lo trae.
  // "match-decision-*" también es categoría "partido" (para que se vea
  // el marcador con el rival durante la jugada) pero es solo UN momento
  // dentro del partido que resuelve matchday-* justo después — contarlo
  // aparte duplicaría partidos jugados y, si tocó gol, también el gol.
  // Un amistoso de pretemporada (pretemp-amistoso) tiene categoría
  // "partido" y hasta su propio "Nota: X/10. Goles: 0." en el texto, pero
  // un amistoso NUNCA cuenta como partido oficial en el fútbol real —
  // sin esta exclusión, stats_matches_played empezaba en 1 antes incluso
  // del debut de verdad, inflando el PJ de la tarjeta compartible y
  // adelantando un turno los hitos de partidos redondos (ver
  // career-milestones.ts).
  const isMatch =
    (event.category === "partido" || event.id?.startsWith("matchday-")) &&
    !event.id?.startsWith("match-decision-") &&
    event.id !== "pretemp-amistoso";
  if (isMatch) {
    update.matches_played = 1;
  }

  // Los eventos de partido (a mano y generados por IA) siguen todos el
  // mismo formato "Goles: N. Asistencias: N. ... jugaste N minutos" —
  // parsear el número exacto es mucho más fiable que buscar la palabra
  // "gol" suelta. Antes, "Goles: 0" contaba como gol marcado porque
  // "Goles" contiene literalmente "gol": todo partido sin goles se
  // registraba igualmente como gol anotado, disparando la Media sin que
  // el jugador hubiera marcado nunca (visto en una partida real: Media 99
  // a los 17 años tras varios partidos con "Goles: 0").
  // Goles, asistencias, minutos y tarjetas solo pueden salir de un
  // partido REAL (isMatch) — una escena de vestuario o la víspera de un
  // partido puede mencionar "gol" o "asistencia" hablando en general
  // ("necesitamos que metas goles") sin que eso sea un gol anotado de
  // verdad. Antes esto se comprobaba sin mirar isMatch en absoluto.
  if (isMatch) {
    const goalsMatch = text.match(/goles?:\s*(\d+)/);
    const assistsMatch = text.match(/asistencias?:\s*(\d+)/);
    const minutesMatch = text.match(/(\d+)\s*minutos/);

    if (goalsMatch) {
      const n = parseInt(goalsMatch[1], 10);
      if (n > 0) update.goals = n;
    } else if (/\bhat[\s-]*trick\b|\btriplete\b/.test(text)) {
      update.goals = 3;
    } else if (text.includes("doblete") || text.includes("dos goles")) {
      update.goals = 2;
    } else if (/\bmarc[oó] (un |el )?gol\b|\banot[oó] (un |el )?gol\b|\bmete(s)? (un )?gol\b/.test(text)) {
      update.goals = 1;
    }

    if (assistsMatch) {
      const n = parseInt(assistsMatch[1], 10);
      if (n > 0) update.assists = n;
    } else if (/\bdas? una asistencia\b|\bpase de gol\b/.test(text)) {
      update.assists = 1;
    }

    if (minutesMatch) {
      update.minutes_played = parseInt(minutesMatch[1], 10);
    } else if (text.includes("partido completo") || text.includes("los 90 minutos")) {
      update.minutes_played = 90;
    }

    // Tarjetas: frases concretas, no la palabra suelta (evita falsos
    // positivos con "amarilla"/"roja" usadas fuera de contexto de tarjeta)
    if (/tarjeta roja|expulsad[oa]/.test(text)) {
      update.red_cards = 1;
    } else if (/tarjeta amarilla/.test(text)) {
      update.yellow_cards = 1;
    }
  }

  // Títulos: exige lenguaje explícito de VICTORIA, no solo mencionar el
  // nombre de una competición — jugar una eliminatoria de Copa o un
  // partido de Champions NO es ganar un título, y antes contaba como uno.
  if (
    /\bcampeón(es)?\b|\bganas? el título\b|\blevantas? (el|la) (trofeo|copa)\b|\bte proclamas campeón\b|\bconquistas? (la|el) (liga|copa|champions)\b/.test(
      text,
    )
  ) {
    update.titles = 1;
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
