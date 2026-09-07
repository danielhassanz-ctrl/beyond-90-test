/**
 * Sistema de calendario de partidos REALISTA para un futbolista.
 *
 * La Liga: 38 jornadas (Sept-May)
 * Copa del Rey: 4-6 partidos (Oct-May)
 * Champions/Europa: 8-13 partidos (Sept-May)
 *
 * Un jugador activo típicamente juega:
 * - 25-35 partidos de liga por temporada
 * - 3-5 de copa
 * - 5-10 europeos
 * Total: ~40-50 partidos/año para un titular
 */

export type CompetitionType = "liga" | "copa" | "champions" | "europa" | "amistoso" | "internacional";

export interface MatchWeek {
  week: number;
  season: number;
  matchday: number; // 1-38 para Liga, etc
  competition: CompetitionType;
  homeTeam: string;
  awayTeam: string;
  rivalClub: string;
  mandatory: boolean; // si es obligatorio (jornada de liga) o opcional (amistoso)
  description: string; // "Jornada 15", "Cuartos de Copa", etc
}

/**
 * Estructura del calendario de una temporada.
 * Semana 1-4: Pretemporada
 * Semana 5-42: Temporada regular (38 jornadas Liga)
 * Semana 43-52: Período de transición/playoffs/segunda vuelta
 */
export function buildMatchCalendar(playerClub: string, season: number): MatchWeek[] {
  const calendar: MatchWeek[] = [];
  const baseWeek = season * 52;

  // Semanas 1-4: Pretemporada (amistosos opcionales)
  for (let i = 1; i <= 4; i++) {
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

  // Semanas 5-42: Jornadas de Liga (38 jornadas en ~38 semanas)
  const laLigaRivals = generateLaLigaFixture(playerClub);
  for (let jornada = 1; jornada <= 38; jornada++) {
    const rival = laLigaRivals[(jornada - 1) % laLigaRivals.length];
    const isHome = jornada % 2 === 1; // Alternancia simple

    calendar.push({
      week: baseWeek + 4 + jornada,
      season,
      matchday: jornada,
      competition: "liga",
      homeTeam: isHome ? playerClub : rival,
      awayTeam: isHome ? rival : playerClub,
      rivalClub: rival,
      mandatory: true,
      description: `La Liga - Jornada ${jornada}`,
    });
  }

  // Semanas 43-48: Copa del Rey (4-6 partidos típico)
  const copaDates = [baseWeek + 43, baseWeek + 45, baseWeek + 47];
  const copaMoments = ["Dieciseisavos", "Octavos", "Cuartos"];
  for (let i = 0; i < copaMoments.length; i++) {
    calendar.push({
      week: copaDates[i],
      season,
      matchday: i + 1,
      competition: "copa",
      homeTeam: playerClub,
      awayTeam: `Rival ${copaMoments[i]}`,
      rivalClub: `Rival ${copaMoments[i]}`,
      mandatory: false, // No todos los equipos llegan a todos los turnos
      description: `Copa del Rey - ${copaMoments[i]}`,
    });
  }

  // Semanas 49-52: Champions/Europa (si el club está en competición)
  // Simplificado: 2-3 partidos en grupo + posibilidad de KO
  calendar.push({
    week: baseWeek + 49,
    season,
    matchday: 1,
    competition: "champions",
    homeTeam: playerClub,
    awayTeam: "Rival Champions 1",
    rivalClub: "Rival Champions 1",
    mandatory: false,
    description: "Champions League - Jornada 1",
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
