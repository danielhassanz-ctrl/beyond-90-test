/**
 * Cuánto avanza el calendario al resolver un evento. Antes vivía dentro de
 * resolveEvent (carrera/actions.ts), imposible de probar sin base de datos;
 * extraído tal cual para que el motor y una simulación local usen EXACTAMENTE
 * la misma regla.
 */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { WEEKS_PER_SEASON } from "@/types/career";
import { getMatchesInWeek, matchKey, parseMatchDone, addMatchDone } from "@/lib/calendar/match-calendar";
import { getSeasonProgress } from "@/lib/calendar/competition-progress";
import { nextWeekGap } from "@/lib/narrative/engine";

/**
 * La secuencia garantizada de arranque (elegir representante, ofertas,
 * firma del contrato, pretemporada, filial hasta el debut oficial) es TODA
 * pretemporada narrativamente — no debe adelantar el calendario real, o la
 * edad (que es una función pura de la semana) sube antes de que el jugador
 * llegue siquiera a debutar. Solo dos saltos deliberados de una semana: al
 * cerrar la pretemporada con el amistoso, y al debutar de verdad.
 */
const CALENDAR_LOCKED_EVENT_IDS = new Set([
  "inicio-fichaje-agente",
  "pretemp-bienvenida",
  "pretemp-fisico",
  "pretemp-competencia",
  "pretemp-tactica",
  "pretemp-capitan",
  "pretemp-pasado",
  "rookie-reserva-introduccion",
  "rookie-reserva-partido",
  "rookie-tactica-mister",
  "rookie-debut-anuncio",
]);
const SEASON_CHECKPOINT_EVENT_IDS = new Set(["pretemp-amistoso", "rookie-debut-oficial"]);

/** Prefijos de eventos que NUNCA avanzan el calendario (se cuelan entre partidos, o forman parte de uno). */
const LOCKED_PREFIXES = [
  "first-signing-",
  "contrato-debut",
  // La jugada decisiva es parte del MISMO partido que se resuelve después.
  "match-decision-",
  // Rumores de mercado, ofertas, redes, vida de pretemporada.
  "mercado-",
  "oferta-",
  "social-dm-",
  "preseason-ev-",
  // Torneo de selecciones: llegada, concentración y partidos ocurren "en verano".
  "sel-mundial-s",
  "sel-eurocopa-s",
  "sel-copa-america-s",
  "torneo-life-",
  "matchday-torneo-",
  // Escenas con el fisio durante una lesión.
  "fisio-",
  // Arcos de varios capítulos.
  "arco-rival-",
  "arco-hermano-",
  "arco-patrocinador-",
  "arco-salto-",
];

export function isCalendarLockedEvent(eventId: string): boolean {
  return CALENDAR_LOCKED_EVENT_IDS.has(eventId) || LOCKED_PREFIXES.some((p) => eventId.startsWith(p));
}

export function computeWeekAdvance(
  player: Player,
  event: Pick<GameEvent, "id" | "matchKey">,
): { newWeek: number; matchDoneFlag?: string } {
  const isMatchdayEvent = event.id.startsWith("matchday-");
  const isSeasonCheckpoint = SEASON_CHECKPOINT_EVENT_IDS.has(event.id) || isMatchdayEvent;

  // Un mes puede traer varios partidos clave (ver buildMatchCalendar): el mes
  // solo avanza cuando se han jugado todos. Mientras quede alguno por jugar,
  // ni siquiera una escena de vida normal puede adelantar la semana.
  const doneMatchKeys = parseMatchDone(player.flags, player.week);
  let matchDoneFlag: string | undefined;
  if (isMatchdayEvent && event.matchKey && !doneMatchKeys.includes(event.matchKey)) {
    matchDoneFlag = addMatchDone(player.flags, player.week, event.matchKey);
    doneMatchKeys.push(event.matchKey);
  }
  const weekMatches = getMatchesInWeek(
    player.week,
    player.club,
    getSeasonProgress(player, Math.floor((player.week - 1) / WEEKS_PER_SEASON)),
  );
  const weekHasPendingMatches =
    (!isMatchdayEvent || Boolean(event.matchKey)) && weekMatches.some((m) => !doneMatchKeys.includes(matchKey(m)));

  let newWeek: number;
  if (isCalendarLockedEvent(event.id)) newWeek = player.week;
  else if (isMatchdayEvent) newWeek = weekHasPendingMatches ? player.week : player.week + 1;
  else if (weekHasPendingMatches) newWeek = player.week;
  else if (isSeasonCheckpoint) newWeek = player.week + 1;
  else newWeek = player.week + nextWeekGap(player.media, player.mode);

  return { newWeek, matchDoneFlag };
}
