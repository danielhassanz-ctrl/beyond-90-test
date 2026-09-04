import type { Player } from "@/types/player";

const WEEKS_PER_SEASON = 10;

const POSITION_RATES: Record<string, { goals: number; assists: number }> = {
  Delantero: { goals: 0.5, assists: 0.15 },
  Centrocampista: { goals: 0.15, assists: 0.25 },
  Defensa: { goals: 0.04, assists: 0.08 },
  Portero: { goals: 0.001, assists: 0.01 },
};

export interface CareerStats {
  ovr: number;
  valueM: number;
  games: number;
  goals: number;
  assists: number;
  titles: string[];
}

/**
 * El juego no simula partido a partido (solo narra momentos sueltos), así
 * que para la tarjeta de resumen de carrera se estiman partidos/goles/
 * asistencias a partir de las temporadas jugadas y la calidad del
 * jugador — igual que un resumen de carrera real, no un contador literal
 * de las pocas escenas de partido que se llegaron a narrar.
 */
export function computeCareerStats(player: Player): CareerStats {
  const seasons = Math.max(0, Math.floor((player.week - 1) / WEEKS_PER_SEASON));
  const starterFactor = 0.5 + (player.forma / 100) * 0.5;
  const gamesPerSeason = Math.round(20 + starterFactor * 30);
  const games = seasons * gamesPerSeason;

  const rate = POSITION_RATES[player.position] ?? POSITION_RATES.Centrocampista;
  const quality = 0.5 + (player.fama / 100) * 0.9;
  const goals = Math.round(games * rate.goals * quality);
  const assists = Math.round(games * rate.assists * quality);

  const ovr = player.media;

  const valueM =
    Math.round(Math.max(0.5, player.patrimonio / 2000 + player.fama * 1.8) * 10) / 10;

  const titles: string[] = [];
  if (player.flags?.title_liga) titles.push("Liga");
  if (player.flags?.title_champions) titles.push("Champions League");
  if (player.flags?.title_balon_oro) titles.push("Balón de Oro");

  return { ovr, valueM, games, goals, assists, titles };
}
