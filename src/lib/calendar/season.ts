import { playerAge } from "@/types/career";

export type SeasonPeriod =
  | "pretemporada"
  | "liga_inicio"
  | "champions_grupos"
  | "copa_rey"
  | "mercado_invierno"
  | "liga_final"
  | "eliminatorias"
  | "final_temporada"
  | "mercado_verano";

export interface SeasonContext {
  period: SeasonPeriod;
  week: number;
  season: number;
  age: number;
  monthApprox: string;
  description: string;
  hasMajorTournament: boolean; // Fue mundial, Eurocopa o Copa América ese año
  majorTournament?: "mundial" | "eurocopa" | "copa_america";
}

/** Mapea semanas de la temporada a períodos. 10 semanas por temporada. */
function getSeasonPeriod(weekInSeason: number): SeasonPeriod {
  // Semana 1-2: Pretemporada
  if (weekInSeason <= 2) return "pretemporada";

  // Semana 3-4: Inicio de Liga
  if (weekInSeason === 3) return "liga_inicio";

  // Semana 4-5: Champions Grupos (si hay)
  if (weekInSeason === 4 || weekInSeason === 5) return "champions_grupos";

  // Semana 6: Copa del Rey
  if (weekInSeason === 6) return "copa_rey";

  // Semana 7: Mercado de Invierno
  if (weekInSeason === 7) return "mercado_invierno";

  // Semana 8: Liga en Invierno
  if (weekInSeason === 8) return "liga_final";

  // Semana 9: Eliminatorias Champions / Finales Copa
  if (weekInSeason === 9) return "eliminatorias";

  // Semana 10: Final de Temporada / Mercado de Verano
  return "final_temporada";
}

function getMonthApprox(weekInSeason: number): string {
  const months = [
    "Julio", // Semana 1
    "Agosto", // Semana 2
    "Septiembre", // Semana 3
    "Octubre", // Semana 4
    "Noviembre", // Semana 5
    "Diciembre", // Semana 6
    "Enero", // Semana 7
    "Febrero", // Semana 8
    "Marzo", // Semana 9
    "Junio", // Semana 10
  ];
  return months[weekInSeason - 1] || "Mes desconocido";
}

/** Detecta si ese año hay un gran torneo internacional */
function hasMajorTournament(
  season: number,
  playerAge: number,
  playerNation: string,
): { has: boolean; type?: "mundial" | "eurocopa" | "copa_america" } {
  const startYear = 2026 + season;

  // Mundiales: cada 4 años (2026, 2030, 2034...)
  if (startYear % 4 === 2) {
    return { has: true, type: "mundial" };
  }

  // Eurocopa: años pares que NO son mundiales (2028, 2032, 2036...)
  if (startYear % 4 === 0 && startYear % 2 === 0) {
    return { has: true, type: "eurocopa" };
  }

  // Copa América: casi cada año (años impares), pero solo para sudamericanos
  const sudamericanNations = [
    "Argentina",
    "Brasil",
    "Chile",
    "Colombia",
    "Ecuador",
    "Paraguay",
    "Perú",
    "Uruguay",
    "Venezuela",
    "Bolivia",
  ];
  if (sudamericanNations.includes(playerNation) && startYear % 2 === 1) {
    return { has: true, type: "copa_america" };
  }

  return { has: false };
}

export function getSeasonContext(
  week: number,
  playerNation: string,
): SeasonContext {
  const age = playerAge(week);
  const season = Math.floor((week - 1) / 10);
  const weekInSeason = ((week - 1) % 10) + 1;
  const period = getSeasonPeriod(weekInSeason);
  const monthApprox = getMonthApprox(weekInSeason);

  const tournament = hasMajorTournament(season, age, playerNation);

  const descriptions: Record<SeasonPeriod, string> = {
    pretemporada:
      "Pretemporada: entrenamientos intensos, amistosos de preparación, adaptación al equipo.",
    liga_inicio:
      "Inicio de Liga: primeras jornadas oficiales, ritmo de competición, presión por resultados.",
    champions_grupos:
      "Fase de Grupos de Champions: encuentros europeos, presión mediática, rivales de élite.",
    copa_rey:
      "Copa del Rey: competición nacional, encuentros eliminatorios, oportunidad de títulos.",
    mercado_invierno:
      "Mercado de Invierno: fichajes de refuerzo, movimientos entre equipos, negociaciones.",
    liga_final: "Recta final de Liga: se define la pelea por puestos, intensidad máxima.",
    eliminatorias:
      "Fase Eliminatoria: Champions League y/o Copa del Rey en cuartos/semis/finales.",
    final_temporada:
      "Final de Temporada: últimas jornadas, definición de títulos, evaluación anual.",
    mercado_verano:
      "Mercado de Verano: fichajes estivales, renovaciones, planificación de siguiente temporada.",
  };

  return {
    period,
    week,
    season,
    age,
    monthApprox,
    description: descriptions[period],
    hasMajorTournament: tournament.has,
    majorTournament: tournament.type,
  };
}

export function formatTournamentContext(tournament?: "mundial" | "eurocopa" | "copa_america"): string {
  if (!tournament) return "";
  const labels: Record<string, string> = {
    mundial: "Año de MUNDIAL — presión de selección, oportunidad de gloria internacional.",
    eurocopa:
      "Año de EUROCOPA — competición de élite europea, máxima presión en selección.",
    copa_america:
      "Año de COPA AMÉRICA — torneo continental sudamericano, gran oportunidad.",
  };
  return labels[tournament] || "";
}
