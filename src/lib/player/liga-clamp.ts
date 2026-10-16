/**
 * Tus partidos de Liga no pueden ser más que las jornadas que ha jugado tu equipo: la tabla dice «jornada 19» y la tarjeta de
 * estadísticas decía 20 partidos tuyos, porque los partidos estimados (los que no se viven como escena) y los vividos se contaban
 * por separado y a veces sumaban uno de más. Aquí se recorta lo de la Liga a las jornadas jugadas y se descuenta del total.
 */
import type { CompetitionStats } from "@/lib/player/competition-stats";

export function clampLigaToTable<S extends CompetitionStats, T extends { matches_played: number; minutes_played: number }>(season: S, totals: T, playedByTeam: number): { season: S; totals: T } {
  const liga = season.liga;
  if (playedByTeam <= 0 || liga.matches <= playedByTeam) return { season, totals };
  const keep = playedByTeam / liga.matches;
  const minutes = Math.round(liga.minutes * keep);
  const droppedMatches = liga.matches - playedByTeam;
  const droppedMinutes = liga.minutes - minutes;
  return {
    season: { ...season, liga: { ...liga, matches: playedByTeam, minutes } },
    totals: { ...totals, matches_played: Math.max(0, totals.matches_played - droppedMatches), minutes_played: Math.max(0, totals.minutes_played - droppedMinutes) },
  };
}
