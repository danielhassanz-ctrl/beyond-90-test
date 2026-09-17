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

  // Semana 1-2: Pretemporada (amistosos opcionales). En la temporada 0
  // esto queda tapado por la secuencia guionada de fichaje/debut (que no
  // consulta el calendario), pero a partir de la temporada 1 SÍ es lo
  // que ve el jugador de verdad cada preseason — antes salía como
  // "Rival Pretemporada 1", un nombre de relleno con escudo genérico en
  // vez de un rival real. Visto en vivo jugando.
  const friendlyRandom = seededRandom(hashString(`${playerClub}:${season}:amistosos`));
  const friendlyPool = PRESEASON_FRIENDLY_OPPONENTS.filter((team) => team !== playerClub);
  const friendlyRivals: string[] = [];
  while (friendlyRivals.length < 2) {
    const candidate = friendlyPool[Math.floor(friendlyRandom() * friendlyPool.length)];
    if (!friendlyRivals.includes(candidate)) friendlyRivals.push(candidate);
  }
  for (let i = 1; i <= 2; i++) {
    const rival = friendlyRivals[i - 1];
    calendar.push({
      week: baseWeek + i,
      season,
      matchday: i,
      competition: "amistoso",
      homeTeam: playerClub,
      awayTeam: rival,
      rivalClub: rival,
      mandatory: false,
      description: `Amistoso de pretemporada ante ${rival}`,
    });
  }

  // Semanas 3-10: antes esto metía UN partido en cada una de las 6
  // semanas seguidas (3,4,5,6,7,8) más copa en la 9 y europa en la 10 —
  // el resto de la temporada quedaba con CERO semanas libres, así que el
  // jugador vivía 8 partidos seguidos sin un solo evento de vida, prensa
  // o entrenamiento entre medias. Visto en vivo jugando: "6-7 eventos de
  // partido seguidos, no pasa nada más". Ahora los partidos se reparten
  // con huecos reales, dejando semanas sueltas para que
  // pickNextEventDynamic meta narrativa normal entre partido y partido.
  const laLigaRivals = generateLaLigaFixture(playerClub, season);
  // La 3ª jornada va en la semana 8, no la 9: la 9 tiene que quedar libre
  // de verdad como respiro antes del partido europeo de cierre en la 10
  // (ver más abajo) — con un 9 aquí, esa "semana libre a propósito" tenía
  // en realidad un partido de Liga, y encima consecutivo con el europeo
  // de la semana siguiente, justo el problema que este reparto quería evitar.
  const ligaMatchdays = [3, 5, 8]; // 3 jornadas con huecos reales entre medias, no 6 semanas seguidas
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
      description: `La Liga - Jornada ${(season * 3 + i + 1)}`,
    });
  }

  // Semana 7: Copa del Rey — sorpresa clásica del torneo: un equipo de
  // categoría inferior que le pone las cosas difíciles al grande. Cae
  // justo en medio del hueco entre las jornadas 5 y 9 de Liga.
  const copaRivals = [
    "CD Mirandés",
    "Racing de Ferrol",
    "UD Ibiza",
    "CD Eldense",
    "SD Ponferradina",
    "Real Unión",
    "CD Tenerife",
    "Cultural Leonesa",
  ];
  const copaRandom = seededRandom(hashString(`${playerClub}:${season}:copa`));
  const copaRival = copaRivals[Math.floor(copaRandom() * copaRivals.length)];
  calendar.push({
    week: baseWeek + 7,
    season,
    matchday: 1,
    competition: "copa",
    homeTeam: playerClub,
    awayTeam: copaRival,
    rivalClub: copaRival,
    mandatory: false,
    description: `Copa del Rey - Eliminatoria ante ${copaRival}`,
  });

  // Semana 10: Europa — cierre de temporada. La semana 9 queda libre a
  // propósito (igual que la 4), como respiro narrativo real antes del
  // último partido del año.
  //
  // Antes esto metía Champions League a CUALQUIER club sin ningún
  // filtro: un Málaga CF de la parte baja de la tabla se plantaba en
  // fase de grupos como si nada — cero lógica futbolística. Ahora solo
  // los clubes que de verdad son habituales de Champions juegan
  // Champions; el resto (si tiene algo de nivel europeo real) juega
  // Europa League; los clubes modestos simplemente no tienen partido
  // europeo — esa semana queda libre para narrativa normal, coherente
  // con el nivel del club.
  const europeanCompetition = getEuropeanCompetitionFor(playerClub);
  if (europeanCompetition) {
    const europeanRandom = seededRandom(hashString(`${playerClub}:${season}:${europeanCompetition.competition}`));
    const europeanPool = europeanCompetition.rivals.filter((c) => c !== playerClub);
    const europeanRival = europeanPool[Math.floor(europeanRandom() * europeanPool.length)];
    calendar.push({
      week: baseWeek + 10,
      season,
      matchday: 1,
      competition: europeanCompetition.competition,
      homeTeam: playerClub,
      awayTeam: europeanRival,
      rivalClub: europeanRival,
      mandatory: false,
      description: `${europeanCompetition.label} ante ${europeanRival}`,
    });
  }

  return calendar;
}

/**
 * PRNG determinista (mulberry32): buildMatchCalendar se recalcula desde
 * cero cada vez que se llama (no hay calendario guardado en la base de
 * datos), así que si el orden de rivales se barajara con Math.random()
 * normal, dos llamadas distintas para la MISMA semana del MISMO club
 * podrían dar un rival diferente cada vez — el aviso de "la semana que
 * viene juegas contra X" podría no coincidir con el partido que de
 * verdad se resuelve después. Semillando por club+temporada, el orden
 * sale siempre igual para ese club en esa temporada, pero varía entre
 * clubes y entre temporadas.
 */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rivales típicos de amistosos de pretemporada: filiales, equipos de categoría inferior o giras. */
const PRESEASON_FRIENDLY_OPPONENTS = [
  "CD Leganés",
  "Racing de Santander",
  "Burgos CF",
  "SD Huesca",
  "AD Alcorcón",
  "CD Castellón",
  "FC Cartagena",
  "UD Las Palmas Atlético",
  "Deportivo Alavés",
  "Sporting de Gijón B",
];

/** Clubes que son habituales de fase de grupos de Champions League de verdad. */
const CHAMPIONS_REGULARS = new Set([
  "Real Madrid",
  "FC Barcelona",
  "Atlético de Madrid",
  "Bayern de Múnich",
  "Bayern Múnich",
  "Bayern Munich",
  "Manchester City",
  "Liverpool FC",
  "Paris Saint-Germain",
  "PSG",
  "Inter de Milán",
  "Juventus",
  "Borussia Dortmund",
]);

/** Clubes con nivel europeo real, pero no de Champions habitual: juegan Europa League. */
const EUROPA_REGULARS = new Set([
  "Sevilla FC",
  "Real Betis",
  "Villarreal CF",
  "Real Sociedad",
  "Athletic Club",
  "Valencia CF",
  "Girona FC",
  "Real Zaragoza",
  "Deportivo de La Coruña",
]);

const CHAMPIONS_RIVALS = [
  "Bayern Múnich",
  "Manchester City",
  "Paris Saint-Germain",
  "Inter de Milán",
  "Liverpool FC",
  "Borussia Dortmund",
  "Juventus",
  "Benfica",
];

const EUROPA_RIVALS = ["AS Roma", "Ajax", "Sporting CP", "Feyenoord", "Olympiacos", "Rangers FC", "Fenerbahçe", "Slavia Praga"];

/**
 * Antes CUALQUIER club jugaba Champions League en la semana 10, sin
 * ningún filtro — un Málaga CF de media tabla se plantaba en fase de
 * grupos como si nada, cero lógica futbolística. Ahora depende de qué
 * tipo de club es: los grandes de verdad juegan Champions, los de nivel
 * europeo real juegan Europa League, y el resto simplemente no tiene
 * partido europeo esa semana — queda libre para narrativa normal, que es
 * lo coherente para un club modesto.
 */
export function getEuropeanCompetitionFor(
  playerClub: string,
): { competition: "champions" | "europa"; label: string; rivals: string[] } | null {
  if (CHAMPIONS_REGULARS.has(playerClub)) {
    return { competition: "champions", label: "Champions League - Fase de grupos", rivals: CHAMPIONS_RIVALS };
  }
  if (EUROPA_REGULARS.has(playerClub)) {
    return { competition: "europa", label: "Europa League - Fase de grupos", rivals: EUROPA_RIVALS };
  }
  return null;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Genera fixture realista de La Liga para una temporada.
 * En la vida real cada equipo juega contra los otros 19 dos veces (38 jornadas).
 *
 * El orden se baraja (antes salía siempre tal cual la lista fija, así
 * que TODOS los clubes del juego, sin excepción, empezaban la temporada
 * jugando Real Madrid → Barcelona → Atlético de Madrid en ese orden
 * exacto — ni variedad entre partidas ni realismo alguno para un club
 * modesto recién ascendido).
 */
function generateLaLigaFixture(playerClub: string, season: number): string[] {
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
  const rivals = laLigaTeams.filter((team) => team !== playerClub);

  const random = seededRandom(hashString(`${playerClub}:${season}`));
  for (let i = rivals.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rivals[i], rivals[j]] = [rivals[j], rivals[i]];
  }
  return rivals;
}

/**
 * Obtiene el próximo partido del jugador desde la semana actual.
 * Retorna null si no hay más partidos en la temporada.
 */
export function getNextMatch(currentWeek: number, playerClub: string): MatchWeek | null {
  const WEEKS_PER_SEASON = 10;
  const season = Math.floor((currentWeek - 1) / WEEKS_PER_SEASON);
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
 * El partido programado para ESTA semana exacta (no la próxima). Se
 * comprueba antes que isMatchWeekNext en el motor narrativo: sin esto,
 * el juego solo generaba "la noche antes del partido" una y otra vez,
 * jornada tras jornada, sin que el partido en sí llegara a jugarse nunca
 * — un fallo real, encontrado jugando una carrera de principio a fin.
 */
export function getMatchThisWeek(currentWeek: number, playerClub: string): MatchWeek | null {
  const WEEKS_PER_SEASON = 10;
  const season = Math.floor((currentWeek - 1) / WEEKS_PER_SEASON);
  const calendar = buildMatchCalendar(playerClub, season);
  return calendar.find((match) => match.week === currentWeek) ?? null;
}

/**
 * Obtiene estadísticas de partidos jugados hasta una semana.
 */
export function getMatchStats(playerClub: string, upToWeek: number) {
  const WEEKS_PER_SEASON = 10;
  const season = Math.floor((upToWeek - 1) / WEEKS_PER_SEASON);
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
