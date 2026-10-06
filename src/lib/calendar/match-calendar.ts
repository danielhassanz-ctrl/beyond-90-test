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

/**
 * Antes todo partido real recibía el mismo tratamiento narrativo, jugara
 * quien jugara contra quien — un amistoso de pretemporada, una jornada
 * cualquiera de mitad de tabla y una final de Copa se sentían exactamente
 * igual de "importantes". `stakes` deja que el motor narrativo (ver
 * generateMatchDayEvent/buildMatchDecisionMoment en engine.ts) escale la
 * tensión de verdad: más opciones, más en juego, mejor rival cuanto más
 * alto el nivel.
 */
export type MatchStakes = "rutina" | "importante" | "decisivo";

/**
 * Semanas (dentro de una temporada de 10) en las que cae cada tipo de
 * partido según buildMatchCalendar más abajo — exportadas para que otros
 * sitios (como la clasificación de standings.ts) puedan saber "cuántas
 * jornadas de esta competición han pasado ya" sin tener que reconstruir
 * el calendario entero ni duplicar estos números a mano. Pedido explícito
 * tras un bug real: la clasificación de Champions mostraba "1 partido
 * jugado" en plena pretemporada, cuando la Champions real no empieza
 * hasta la semana 6.
 */
/**
 * La temporada del juego tiene 10 turnos (uno por mes, de julio a mayo) pero
 * representa una temporada real de 38 jornadas: cada partido que se narra es
 * un PARTIDO CLAVE de ese tramo. Un mismo mes puede tener 2 (o 3 en mayo)
 * partidos clave, como en el fútbol real — el número total depende del
 * nivel del club (un grande juega Champions y llega más lejos en las copas;
 * un club modesto, bastantes menos).
 *
 * Jornada real de Liga (de 38) que representa el partido clave de cada semana.
 * La clasificación (standings.ts) usa estos números para mostrar "PJ" real.
 */
export const LIGA_JORNADA_BY_WEEK: Record<number, number> = { 3: 4, 4: 9, 5: 14, 6: 19, 7: 24, 8: 29, 9: 34, 10: 38 };
export const LIGA_TOTAL_JORNADAS = 38;
/** Semanas con partido clave de Liga según el nivel del club. */
const LIGA_WEEKS_BY_TIER: Record<ClubLevel, number[]> = {
  grande: [3, 4, 5, 6, 7, 8, 9, 10],
  europeo: [3, 4, 6, 7, 9, 10],
  modesto: [3, 5, 7, 9, 10],
};
/** Fase de grupos europea: dos partidos clave que representan las jornadas 3 y 6 de 6. */
export const EURO_GROUP_WEEKS = [4, 6];
export const EURO_GROUP_JORNADAS = [3, 6];
/** Copa: dieciseisavos, octavos, cuartos, semifinal y final (solo mientras sigas vivo). */
export const COPA_ROUND_WEEKS = [5, 7, 8, 9, 10];
/** Eliminatorias europeas (si pasas de grupos): octavos, cuartos, semifinal y final. */
export const EURO_KO_WEEKS = [8, 9, 10, 10];
const COPA_ROUND_LABELS = ["Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Final"];
const EURO_KO_LABELS = ["Octavos de final", "Cuartos de final", "Semifinal", "Final"];
/** Máximo de partidos que caben en un mes antes de dejar fuera el de Liga. */
const MAX_MATCHES_PER_WEEK = 2;

export type ClubLevel = "grande" | "europeo" | "modesto";

export interface MatchWeek {
  week: number;
  /** Orden dentro de la semana (1, 2, 3): un mes puede traer varios partidos clave. */
  slot: number;
  season: number;
  matchday: number; // 1-8 para Liga en escala 10 semanas, etc
  competition: CompetitionType;
  homeTeam: string;
  awayTeam: string;
  rivalClub: string;
  mandatory: boolean; // si es obligatorio (jornada de liga) o opcional (amistoso)
  description: string; // "Jornada 15", "Cuartos de Copa", etc
  stakes: MatchStakes;
  /** Solo copa: la ronda dentro de esta temporada, para decidir si sigue habiendo partido después. */
  cupRound?: number;
  /** Solo Liga: jornada real (de 38) que representa este partido clave. */
  jornada?: number;
  /** Solo Champions/Europa: ronda de eliminatoria (1 = octavos...). Sin valor en la fase de grupos. */
  euroKoRound?: number;
  /** Solo fase de grupos europea: 1 o 2 (último partido de grupo = 2). */
  euroGroupIndex?: number;
  /** Solo torneos de selecciones: partido 0-6 (3 de grupos, octavos, cuartos, semifinal, final). */
  torneoStage?: number;
}

/** Progreso de competiciones de eliminación, para poder generar la SIGUIENTE ronda si el jugador sigue vivo. */
export interface SeasonProgress {
  copa?: { round: number; alive: boolean };
  euro?: { round: number; alive: boolean };
}

/** Rivales con peso suficiente para que repetirlos en otro torneo (Liga y Copa) tenga sentido. */
const BIG_RIVALS = new Set(["Real Madrid", "FC Barcelona", "Atlético de Madrid"]);

/** Rivales de Copa para la segunda eliminatoria (solo si se sobrevive a la primera): ya no es un equipo modesto, es un rival de Liga hecho y derecho. */
const COPA_ROUND_2_RIVALS = [
  "Real Sociedad",
  "Athletic Club",
  "Real Betis",
  "Sevilla FC",
  "Valencia CF",
  "Villarreal CF",
  "Celta de Vigo",
  "Osasuna",
];

/**
 * Identificador estable de un partido clave dentro de su semana — se guarda
 * en player.flags al jugarlo (match_done_week) para saber cuáles quedan, aunque
 * el calendario se recalcule con otro progreso de eliminatorias.
 */
export function matchKey(m: Pick<MatchWeek, "competition" | "jornada" | "cupRound" | "euroKoRound" | "euroGroupIndex" | "torneoStage">): string {
  if (m.torneoStage !== undefined) return `torneo.${m.torneoStage}`;
  if (m.competition === "liga") return `liga.${m.jornada ?? 0}`;
  if (m.competition === "copa") return `copa.${m.cupRound ?? 0}`;
  if (m.euroKoRound) return `euro.k${m.euroKoRound}`;
  if (m.euroGroupIndex) return `euro.g${m.euroGroupIndex}`;
  return `${m.competition}.0`;
}

/** Partidos de la semana `week` ya resueltos (flag match_done_week = "semana|clave,clave"). */
export function parseMatchDone(flags: Record<string, string | boolean> | null | undefined, week: number): string[] {
  const raw = String(flags?.match_done_week ?? "");
  const [w, keys] = raw.split("|");
  if (parseInt(w, 10) !== week || !keys) return [];
  return keys.split(",").filter(Boolean);
}

/** Valor del flag match_done_week tras resolver el partido `key` de la semana `week`. */
export function addMatchDone(flags: Record<string, string | boolean> | null | undefined, week: number, key: string): string {
  const done = parseMatchDone(flags, week);
  if (!done.includes(key)) done.push(key);
  return `${week}|${done.join(",")}`;
}

/**
 * Nivel del club a efectos de calendario: los grandes juegan Champions y
 * pelean todo; los europeos, Europa League; los modestos, solo Liga y Copa.
 */
export function getClubLevel(club: string): ClubLevel {
  if (CHAMPIONS_REGULARS.has(club)) return "grande";
  if (EUROPA_REGULARS.has(club)) return "europeo";
  return "modesto";
}

/** Rivales para las rondas finales de Copa: ya no hay sorpresas de categoría inferior. */
const COPA_LATE_RIVALS = [...COPA_ROUND_2_RIVALS, "FC Barcelona", "Atlético de Madrid", "Real Madrid"];

/**
 * Calendario de partidos clave de una temporada (10 turnos/meses):
 *  - Semanas 1-2: pretemporada (amistosos, no generan turno).
 *  - Liga: 8 / 6 / 5 partidos clave según el nivel del club (grande /
 *    europeo / modesto), cada uno con su jornada real de 38.
 *  - Copa: dieciseisavos en la semana 5 y, mientras sigas vivo, octavos,
 *    cuartos, semifinal y final en las semanas 7, 8, 9 y 10.
 *  - Europa (solo grande/europeo): 2 partidos de fase de grupos y, si
 *    pasas, octavos, cuartos, semifinal y final.
 * Un mes admite como mucho 2 partidos clave de Liga+resto: si las copas
 * ocupan el mes, el partido de Liga de esa semana se omite (esa jornada se
 * simula). Las eliminatorias nunca se omiten (hasta 3 en mayo).
 *
 * `progress` es el estado de eliminatorias YA jugadas esta temporada
 * (competition-progress.ts, leído de player.flags). Se incluye la ronda r
 * si r === 1 (Copa) o r <= progress.round: así el calendario que se
 * recalcula en cada turno coincide siempre con lo que de verdad se jugó.
 */
export function buildMatchCalendar(playerClub: string, season: number, progress?: SeasonProgress): MatchWeek[] {
  const WEEKS_PER_SEASON = 10;
  const baseWeek = season * WEEKS_PER_SEASON;
  const level = getClubLevel(playerClub);
  const entries: Omit<MatchWeek, "slot">[] = [];

  // Pretemporada (amistosos opcionales). En la temporada 0 esto queda
  // tapado por la secuencia guionada de fichaje/debut; a partir de la 1 SÍ
  // es lo que ve el jugador cada preseason.
  const friendlyRandom = seededRandom(hashString(`${playerClub}:${season}:amistosos`));
  const friendlyPool = PRESEASON_FRIENDLY_OPPONENTS.filter((team) => team !== playerClub);
  const friendlyRivals: string[] = [];
  while (friendlyRivals.length < 2) {
    const candidate = friendlyPool[Math.floor(friendlyRandom() * friendlyPool.length)];
    if (!friendlyRivals.includes(candidate)) friendlyRivals.push(candidate);
  }
  for (let i = 1; i <= 2; i++) {
    const rival = friendlyRivals[i - 1];
    entries.push({
      week: baseWeek + i,
      season,
      matchday: i,
      competition: "amistoso",
      homeTeam: playerClub,
      awayTeam: rival,
      rivalClub: rival,
      mandatory: false,
      description: `Amistoso de pretemporada ante ${rival}`,
      stakes: "rutina",
    });
  }

  // Rivales de Liga que aparecerán como partido clave esta temporada (los
  // primeros del sorteo): la Copa los evita, ver más abajo.
  const ligaPool = generateLaLigaFixture(playerClub, season).slice(0, 8);

  // --- Copa del Rey -------------------------------------------------------
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
  const copaRound1Rival = copaRivals[Math.floor(copaRandom() * copaRivals.length)];
  const copaUsed = new Set<string>([copaRound1Rival]);
  const copaMaxRound = Math.min(COPA_ROUND_WEEKS.length, Math.max(1, progress?.copa?.round ?? 1));
  for (let r = 1; r <= copaMaxRound; r++) {
    let rival = copaRound1Rival;
    if (r > 1) {
      // Un rival "normal" no se repite en la misma temporada entre Liga y
      // Copa (salía el mismo equipo en turnos consecutivos); solo los
      // grandes de verdad, que sí tiene sentido volver a ver en otro torneo.
      const pool = COPA_LATE_RIVALS.filter(
        (c) => c !== playerClub && !copaUsed.has(c) && (BIG_RIVALS.has(c) || !ligaPool.includes(c)),
      );
      const rr = seededRandom(hashString(`${playerClub}:${season}:copa-r${r}`));
      rival = pool[Math.floor(rr() * pool.length)];
      copaUsed.add(rival);
    }
    entries.push({
      week: baseWeek + COPA_ROUND_WEEKS[r - 1],
      season,
      matchday: r,
      competition: "copa",
      homeTeam: playerClub,
      awayTeam: rival,
      rivalClub: rival,
      mandatory: false,
      description: `Copa del Rey - ${COPA_ROUND_LABELS[r - 1]} ante ${rival}`,
      stakes: r === 1 ? "importante" : "decisivo",
      cupRound: r,
    });
  }

  // --- Competición europea (fase de grupos + eliminatorias) ---------------
  const europeanCompetition = getEuropeanCompetitionFor(playerClub);
  if (europeanCompetition) {
    const europeanRandom = seededRandom(hashString(`${playerClub}:${season}:${europeanCompetition.competition}`));
    const europeanPool = europeanCompetition.rivals.filter((c) => c !== playerClub);
    const europeanStakes: MatchStakes = europeanCompetition.competition === "champions" ? "decisivo" : "importante";
    const euroUsed = new Set<string>();
    const pickEuroRival = (rand: () => number): string => {
      const free = europeanPool.filter((c) => !euroUsed.has(c));
      const pool = free.length > 0 ? free : europeanPool;
      const rival = pool[Math.floor(rand() * pool.length)];
      euroUsed.add(rival);
      return rival;
    };

    for (let g = 0; g < EURO_GROUP_WEEKS.length; g++) {
      const rival = pickEuroRival(europeanRandom);
      entries.push({
        week: baseWeek + EURO_GROUP_WEEKS[g],
        season,
        matchday: g + 1,
        competition: europeanCompetition.competition,
        homeTeam: playerClub,
        awayTeam: rival,
        rivalClub: rival,
        mandatory: false,
        description: `${europeanCompetition.label} ante ${rival}`,
        stakes: europeanStakes,
        euroGroupIndex: g + 1,
      });
    }

    const koMaxRound = Math.min(EURO_KO_WEEKS.length, progress?.euro?.round ?? 0);
    const compName = europeanCompetition.competition === "champions" ? "Champions League" : "Europa League";
    for (let r = 1; r <= koMaxRound; r++) {
      const rival = pickEuroRival(seededRandom(hashString(`${playerClub}:${season}:euro-ko${r}`)));
      entries.push({
        week: baseWeek + EURO_KO_WEEKS[r - 1],
        season,
        matchday: 2 + r,
        competition: europeanCompetition.competition,
        homeTeam: playerClub,
        awayTeam: rival,
        rivalClub: rival,
        mandatory: false,
        description: `${compName} - ${EURO_KO_LABELS[r - 1]} ante ${rival}`,
        stakes: "decisivo",
        euroKoRound: r,
      });
    }
  }

  // --- Liga: partidos clave según el nivel del club -----------------------
  const laLigaRivals = generateLaLigaFixture(playerClub, season);
  const ligaWeeks = LIGA_WEEKS_BY_TIER[level];
  const nonLigaPerWeek = new Map<number, number>();
  for (const e of entries) {
    if (e.competition === "amistoso") continue;
    nonLigaPerWeek.set(e.week, (nonLigaPerWeek.get(e.week) ?? 0) + 1);
  }
  let ligaIndex = 0;
  for (const w of ligaWeeks) {
    if ((nonLigaPerWeek.get(baseWeek + w) ?? 0) >= MAX_MATCHES_PER_WEEK) continue;
    const rival = laLigaRivals[ligaIndex % laLigaRivals.length];
    const isHome = ligaIndex % 2 === 0;
    const isFinalMatchday = w === 10;
    let stakes: MatchStakes = "rutina";
    let angle = "";
    if (isFinalMatchday) {
      if (level === "grande") {
        stakes = "decisivo";
        angle = " · Se decide el liderato de Liga";
      } else if (level === "europeo") {
        stakes = "importante";
        angle = " · En juego la clasificación europea";
      } else {
        stakes = "importante";
        angle = " · Batalla directa por la permanencia";
      }
    }
    const jornada = LIGA_JORNADA_BY_WEEK[w];
    entries.push({
      week: baseWeek + w,
      season,
      matchday: ligaIndex + 1,
      competition: "liga",
      homeTeam: isHome ? playerClub : rival,
      awayTeam: isHome ? rival : playerClub,
      rivalClub: rival,
      mandatory: true,
      description: `La Liga - Jornada ${jornada}${angle}`,
      stakes,
      jornada,
    });
    ligaIndex++;
  }

  // Orden dentro del mes: Liga, luego Copa, luego Europa.
  const order: Record<CompetitionType, number> = { amistoso: 0, liga: 1, internacional: 1, copa: 2, europa: 3, champions: 3 };
  entries.sort((a, b) => a.week - b.week || order[a.competition] - order[b.competition] || a.matchday - b.matchday);
  const slotCounter = new Map<number, number>();
  return entries.map((e) => {
    const slot = (slotCounter.get(e.week) ?? 0) + 1;
    slotCounter.set(e.week, slot);
    return { ...e, slot };
  });
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
const LIGA_FIXTURE_CACHE = new Map<string, string[]>();

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
  const key = `${playerClub}:${season}`;
  const cached = LIGA_FIXTURE_CACHE.get(key);
  if (cached) return [...cached];
  const rivals = laLigaTeams.filter((team) => team !== playerClub);
  const random = seededRandom(hashString(`${playerClub}:${season}`));
  for (let i = rivals.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rivals[i], rivals[j]] = [rivals[j], rivals[i]];
  }

  // Cambio de temporada: los rivales con los que acabaste la anterior (sus
  // partidos clave) no pueden ser los primeros de esta — se veía el mismo
  // equipo dos veces seguidas con apenas unos meses de por medio. Se parte
  // del calendario REAL de la temporada anterior (ya con su propio ajuste).
  if (season > 0) {
    const justPlayed = new Set(generateLaLigaFixture(playerClub, season - 1).slice(0, 8));
    for (let i = 0; i < 3; i++) {
      if (!justPlayed.has(rivals[i])) continue;
      const swapWith = rivals.findIndex((c, idx) => idx >= 8 && !justPlayed.has(c));
      if (swapWith === -1) break;
      [rivals[i], rivals[swapWith]] = [rivals[swapWith], rivals[i]];
    }
  }
  LIGA_FIXTURE_CACHE.set(key, rivals);
  return rivals;
}

/**
 * Obtiene el próximo partido del jugador desde la semana actual.
 * Retorna null si no hay más partidos en la temporada.
 */
export function getNextMatch(currentWeek: number, playerClub: string, progress?: SeasonProgress): MatchWeek | null {
  const WEEKS_PER_SEASON = 10;
  const season = Math.floor((currentWeek - 1) / WEEKS_PER_SEASON);
  const calendar = buildMatchCalendar(playerClub, season, progress);

  // Buscar el próximo partido que no haya pasado
  return calendar.find((match) => match.week > currentWeek) ?? null;
}

/**
 * Obtiene todos los partidos de una temporada específica.
 */
export function getSeasonMatches(season: number, playerClub: string, progress?: SeasonProgress): MatchWeek[] {
  return buildMatchCalendar(playerClub, season, progress);
}

/**
 * Retorna si en la próxima semana hay un partido importante.
 * Usado por el narrativa engine para determinar si generar un evento pre-partido.
 */
export function isMatchWeekNext(currentWeek: number, playerClub: string, progress?: SeasonProgress): boolean {
  const nextMatch = getNextMatch(currentWeek, playerClub, progress);
  return nextMatch !== null && nextMatch.week === currentWeek + 1;
}

/**
 * Partidos OFICIALES (sin amistosos) programados para esta semana exacta,
 * en orden. Un mes puede traer varios partidos clave.
 */
export function getMatchesInWeek(currentWeek: number, playerClub: string, progress?: SeasonProgress): MatchWeek[] {
  const WEEKS_PER_SEASON = 10;
  const season = Math.floor((currentWeek - 1) / WEEKS_PER_SEASON);
  return buildMatchCalendar(playerClub, season, progress).filter(
    (match) => match.week === currentWeek && match.competition !== "amistoso",
  );
}

/**
 * El partido programado para ESTA semana exacta (no la próxima) que aún no
 * se ha jugado: `doneKeys` son los partidos de esta semana ya resueltos
 * (ver matchKey). Se comprueba antes que isMatchWeekNext en el motor
 * narrativo: sin esto, el juego solo generaba "la noche antes del partido"
 * una y otra vez, jornada tras jornada, sin que el partido en sí llegara a
 * jugarse nunca — un fallo real, encontrado jugando una carrera de
 * principio a fin. Las semanas de pretemporada devuelven los amistosos.
 */
export function getMatchThisWeek(
  currentWeek: number,
  playerClub: string,
  progress?: SeasonProgress,
  doneKeys: string[] = [],
): MatchWeek | null {
  const WEEKS_PER_SEASON = 10;
  const season = Math.floor((currentWeek - 1) / WEEKS_PER_SEASON);
  const calendar = buildMatchCalendar(playerClub, season, progress).filter((match) => match.week === currentWeek);
  const official = calendar.filter((match) => match.competition !== "amistoso");
  if (official.length === 0) return calendar[0] ?? null;
  return official.find((match) => !doneKeys.includes(matchKey(match))) ?? null;
}

/**
 * Obtiene estadísticas de partidos jugados hasta una semana.
 */
export function getMatchStats(playerClub: string, upToWeek: number, progress?: SeasonProgress) {
  const WEEKS_PER_SEASON = 10;
  const season = Math.floor((upToWeek - 1) / WEEKS_PER_SEASON);
  const calendar = buildMatchCalendar(playerClub, season, progress);

  const played = calendar.filter((m) => m.week <= upToWeek);
  const liga = played.filter((m) => m.competition === "liga").length;
  const copa = played.filter((m) => m.competition === "copa").length;
  const champions = played.filter((m) => m.competition === "champions").length;

  return {
    totalMatches: played.length,
    ligaMatches: liga,
    copaMatches: copa,
    championsMatches: champions,
    nextMatch: getNextMatch(upToWeek, playerClub, progress),
  };
}
