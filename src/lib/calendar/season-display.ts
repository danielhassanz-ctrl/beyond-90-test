/**
 * Qué temporada se enseña como «la actual». El calendario cambia de temporada en el turno 1 (julio), pero la temporada NO
 * se da por cerrada hasta que se vive la escena de cierre: el 1 de julio, o justo después del torneo de selecciones del
 * verano (Mundial, Eurocopa, Copa América...). Mientras tanto —la convocatoria, el torneo— las cifras, la clasificación y la
 * etiqueta siguen siendo las de la temporada que acaba de terminar, no un contador a cero de la siguiente.
 *
 * Devuelve la semana con la que hay que calcular lo que se enseña (la última de la temporada anterior, o la actual).
 */
import { WEEKS_PER_SEASON } from "@/types/career";

export function displayWeek(week: number, usedEventIds: readonly string[]): number {
  const season = Math.floor((week - 1) / WEEKS_PER_SEASON);
  const inSeason = ((week - 1) % WEEKS_PER_SEASON) + 1;
  // Misma ventana que el cierre de temporada del motor (turnos 1-4 sin la escena «preseason-N» vivida).
  if (season > 0 && inSeason <= 4 && !usedEventIds.includes(`preseason-${season}`)) return season * WEEKS_PER_SEASON;
  return week;
}
