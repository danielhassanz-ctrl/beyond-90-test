import { playerAge } from "@/types/career";
import { getConfederation } from "@/lib/nations";

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

/**
 * Detecta si ese año hay un gran torneo internacional — exportada (antes
 * privada de este archivo) para que engine.ts pueda usar EXACTAMENTE el
 * mismo cálculo al decidir si el hito real de Mundial/Eurocopa/Copa
 * América es elegible esta temporada, en vez de duplicar la cuenta de
 * años por su cuenta y arriesgarse a que diverja. Antes el texto generado
 * por IA (ver generatePreseasoneEvent) sí usaba esta cuenta de años, pero
 * los eventos reales de selección (sel-mundial, sel-eurocopa...) no tenían
 * ninguna restricción de año — podían salir en cualquier temporada al
 * azar, así que el texto podía anunciar "año de Eurocopa" sin que el
 * propio juego lo considerase tal, o al revés.
 */
export function hasMajorTournament(
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

  // Copa América: casi cada año (años impares), pero solo para
  // sudamericanos. Antes esto mantenía su PROPIA lista de países sin
  // normalizar, comparada tal cual contra el texto libre que escribe el
  // jugador — "Perú" sin tilde o "argentina" en minúsculas (ambas formas
  // muy probables de escribir) no coincidían nunca. Reutiliza
  // getConfederation (ya normaliza acentos/mayúsculas) en vez de
  // duplicar la lista con su propio bug aparte.
  if (getConfederation(playerNation) === "CONMEBOL" && startYear % 2 === 1) {
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

/**
 * Pedido explícito tras un fallo real: el texto decía "año de Eurocopa...
 * cada entrenamiento de julio cuenta doble" en plena pretemporada, como si
 * el torneo todavía estuviera por llegar mientras se entrena — pero un
 * torneo de selecciones se juega en junio-julio, ANTES de que arranque la
 * pretemporada de club (agosto). Las frases dejan clara esa secuencia:
 * el torneo ya ha pasado para cuando empieza esta escena, se haya vivido
 * en persona (convocado) o solo como aficionado más.
 */
export function formatTournamentContext(tournament?: "mundial" | "eurocopa" | "copa_america"): string {
  if (!tournament) return "";
  const labels: Record<string, string> = {
    mundial: "Este verano, justo antes de esta pretemporada, se ha disputado el MUNDIAL — si el jugador fue convocado, llega de vivirlo; si no, lo ha visto desde fuera, con la sensación de que el fútbol mundial giró unas semanas sin él.",
    eurocopa:
      "Este verano, justo antes de esta pretemporada, se ha disputado la EUROCOPA — si el jugador fue convocado, llega de vivirla; si no, la ha visto desde fuera, con la sensación de que el fútbol europeo giró unas semanas sin él.",
    copa_america:
      "Este verano, justo antes de esta pretemporada, se ha disputado la COPA AMÉRICA — si el jugador fue convocado, llega de vivirla; si no, la ha visto desde fuera, con la sensación de que el continente giró unas semanas sin él.",
  };
  return labels[tournament] || "";
}
