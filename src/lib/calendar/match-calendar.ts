/**
 * Sistema de calendario de partidos para un futbolista.
 *
 * NOTA: El juego usa 10 semanas por temporada (no 52 como el fútbol real).
 * Esto es un compromiso entre realismo y jugabilidad rápida.
 * Se adapta a la escala del juego:
 * - 10 semanas/temporada = ~2.6 años por 26 weeks de juego
 * - Partidos cada 1-2 semanas en temporada (no cada 3-7 días como realidad)
 *
 * Un jugador en modo carrera típicamente juega:
 * - 6-8 partidos de liga por temporada (en escala 10 semanas)
 * - 2-3 de copa
 * - 2-3 europeos
 * Total: ~10-15 partidos/temporada virtual
 */

export type CompetitionType = "liga" | "copa" | "champions" | "europa" | "amistoso" | "internacional";

export interface MatchWeek {
  week: number;
  season: number;
  matchday: number; // 1-8 para Liga en escala 10 semanas, etc
  competition: CompetitionType;
  homeTeam: string;
  awayTeam: string;
  rivalClub: string;
  mandatory: boolean; // si es obligatorio (jornada de liga) o opcional (amistoso)
  description: string; // "Jornada 15", "Cuartos de Copa", etc
}

/**
 * Estructura del calendario de una temporada (escala 10 semanas).
 * Semana 1-2: Pretemporada
 * Semana 3-8: Temporada regular (6 jornadas Liga, espaciadas)
 * Semana 9-10: Copa + Europeo
 */
export function buildMatchCalendar(playerClub: string, season: number): MatchWeek[] {
  const WEEKS_PER_SEASON = 10;
  const calendar: MatchWeek[] = [];
  const baseWeek = season * WEEKS_PER_SEASON;

  // Semana 1-2: Pretemporada (amistosos opcionales)
  for (let i = 1; i <= 2; i++) {
    calendar.push({
      week: baseWeek + i,
      season,
      matchday: i,
      competition: "amistoso",
      homeTeam: playerClub,
      awayTeam: `Rival Pretemporada ${i}`,
      rivalClub: `Rival Pretemporada ${i}`,
      mandatory: false,
      description: `Amistoso pretemporada ${i}`,
    });
  }

  // Semanas 3-8: Jornadas de Liga (6 jornadas en escala de 10 semanas)
  // En realidad la Liga tiene 38, pero en escala simplificada jugamos 6
  const laLigaRivals = generateLaLigaFixture(playerClub);
  const ligaMatchdays = [3, 4, 5, 6, 7, 8]; // Una jornada cada semana aprox
  for (let i = 0; i < ligaMatchdays.length; i++) {
    const rival = laLigaRivals[i % laLigaRivals.length];
    const isHome = i % 2 === 0;

    calendar.push({
      week: baseWeek + ligaMatchdays[i],
      season,
      matchday: i + 1,
      competition: "liga",
      homeTeam: isHome ? playerClub : rival,
      awayTeam: isHome ? rival : playerClub,
      rivalClub: rival,
      mandatory: true,
      description: `La Liga - Jornada ${(season * 6 + i + 1)}`,
    });
  }

  // Semana 9: Copa del Rey
  calendar.push({
    week: baseWeek + 9,
    season,
    matchday: 1,
    competition: "copa",
    homeTeam: playerClub,
    awayTeam: `Rival Copa`,
    rivalClub: `Rival Copa`,
    mandatory: false,
    description: `Copa del Rey - Fase`,
  });

  // Semana 10: Champions/Europa (si aplica)
  calendar.push({
    week: baseWeek + 10,
    season,
    matchday: 1,
    competition: "champions",
    homeTeam: playerClub,
    awayTeam: "Rival Champions",
    rivalClub: "Rival Champions",
    mandatory: false,
    description: "Champions League / Europa League",
  });

  return calendar;
}

/**
 * Genera fixture realista de La Liga para una temporada.
 * En la vida real cada equipo juega contra los otros 19 dos veces (38 jornadas).
 */
function generateLaLigaFixture(playerClub: string): string[] {
  const laLigaTeams = [
    "Real Madrid",
    "FC Barcelona",
    "Atlético de Madrid",
    "Sevilla FC",
    "Real Betis",
    "Valencia CF",
    "Villarreal CF",
    "Real Sociedad",
    "Athletic Club",
    "Getafe CF",
    "Rayo Vallecano",
    "Cádiz CF",
    "Osasuna",
    "Girona FC",
    "Las Palmas",
    "Almería",
    "Celta de Vigo",
    "Real Valladolid",
    "Mallorca",
    "Elche CF",
  ];

  // Remover el club del jugador de la lista
  return laLigaTeams.filter((team) => team !== playerClub);
}

/**
 * Obtiene el próximo partido del jugador desde la semana actual.
 * Retorna null si no hay más partidos en la temporada.
 */
export function getNextMatch(currentWeek: number, playerClub: string): MatchWeek | null {
  const season = Math.floor((currentWeek - 1) / 52);
  const calendar = buildMatchCalendar(playerClub, season);

  // Buscar el próximo partido que no haya pasado
  return calendar.find((match) => match.week > currentWeek) ?? null;
}

/**
 * Obtiene todos los partidos de una temporada específica.
 */
export function getSeasonMatches(season: number, playerClub: string): MatchWeek[] {
  return buildMatchCalendar(playerClub, season);
}

/**
 * Retorna si en la próxima semana hay un partido importante.
 * Usado por el narrativa engine para determinar si generar un evento pre-partido.
 */
export function isMatchWeekNext(currentWeek: number, playerClub: string): boolean {
  const nextMatch = getNextMatch(currentWeek, playerClub);
  return nextMatch !== null && nextMatch.week === currentWeek + 1;
}

/**
 * Obtiene estadísticas de partidos jugados hasta una semana.
 */
export function getMatchStats(playerClub: string, upToWeek: number) {
  const season = Math.floor((upToWeek - 1) / 52);
  const calendar = buildMatchCalendar(playerClub, season);

  const played = calendar.filter((m) => m.week <= upToWeek);
  const liga = played.filter((m) => m.competition === "liga").length;
  const copa = played.filter((m) => m.competition === "copa").length;
  const champions = played.filter((m) => m.competition === "champions").length;

  return {
    totalMatches: played.length,
    ligaMatches: liga,
    copaMatches: copa,
    championsMatches: champions,
    nextMatch: getNextMatch(upToWeek, playerClub),
  };
}
