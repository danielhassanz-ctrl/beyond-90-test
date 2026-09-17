import type { Player } from "@/types/player";

export interface CareerStats {
  ovr: number;
  valueM: number;
  games: number;
  goals: number;
  assists: number;
  titles: string[];
}

/**
 * Antes esto ESTIMABA partidos/goles/asistencias con una fórmula (temporadas
 * jugadas × calidad del jugador) porque el juego no llevaba la cuenta real.
 * Eso dejó de ser cierto: update-stats.ts sí extrae y acumula las cifras
 * reales de cada partido narrado (stats_matches_played/goals/assists). Usar
 * la fórmula en vez de esas cifras significaba que la tarjeta que de verdad
 * se comparte mostraba números inventados, no los del jugador — justo lo
 * contrario de lo que alguien espera ver en su propia tarjeta de stats.
 */
export function computeCareerStats(player: Player): CareerStats {
  const games = player.stats_matches_played ?? 0;
  const goals = player.stats_goals ?? 0;
  const assists = player.stats_assists ?? 0;

  const ovr = player.media;

  // El valor de mercado de un futbolista lo marca su nivel deportivo
  // (media/OVR), no sus ahorros — la fórmula anterior ignoraba `media`
  // por completo (valor = solo patrimonio + fama), así que un canterano
  // de 16 años sin debutar (media 50, 0€ ahorrados) podía salir con
  // "Valor €9M" solo por tener algo de fama, y un veterano forrado con
  // media mediocre valía más que un crack joven sin ahorros todavía —
  // justo al revés que en el mercado real. Aquí el nivel manda, con una
  // curva creciente (de mediocre a crack el valor no sube en línea
  // recta, como en Transfermarkt) y la fama solo aporta un extra por
  // marca personal. El patrimonio (ahorros del jugador) no entra: es una
  // cifra personal, no lo que pagaría un club por su ficha.
  const qualityValue = Math.max(0, player.media - 40) ** 2.2 / 90;
  const valueM = Math.round(Math.max(0.3, qualityValue + player.fama * 0.15) * 10) / 10;

  const titles: string[] = [];
  if (player.flags?.title_liga) titles.push("Liga");
  if (player.flags?.title_champions) titles.push("Champions League");
  if (player.flags?.title_balon_oro) titles.push("Balón de Oro");

  return { ovr, valueM, games, goals, assists, titles };
}
