import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import {
  getEuropeanCompetitionFor,
  LIGA_JORNADA_BY_WEEK,
  LIGA_TOTAL_JORNADAS,
  EURO_GROUP_WEEKS,
  EURO_GROUP_JORNADAS,
} from "@/lib/calendar/match-calendar";
import { getCopaProgress, getEuroProgress, copaRoundName, euroRoundName } from "@/lib/calendar/competition-progress";
import { WEEKS_PER_SEASON } from "@/types/career";

/**
 * Mini clasificación con tu club señalado, y el cuadro de "eliminatoria"
 * de Copa — pedido explícito: "así ves si estás en el filial, cuando
 * subes, pues cambia la clasificación". No es una simulación real de
 * liga (no hay partido a partido de cada rival): es una tabla estable y
 * verosímil, generada de forma determinista (misma semilla → misma
 * tabla durante toda la temporada, cambia de una temporada a otra).
 *
 * La posición del EQUIPO depende del NIVEL DEL CLUB (1-5, el mismo dato
 * que ya usan las ofertas de fichaje en constants.ts), no de tu media
 * personal — corregido tras una confusión real del usuario ("una cosa
 * eres tú y otra el equipo donde estés"): el Real Madrid está arriba
 * porque es el Real Madrid, no porque tú rindas bien o mal ese día. Tu
 * rendimiento individual ya se cuenta aparte, en la tarjeta de
 * estadísticas de la temporada (goles, asistencias...), y en qué clubes
 * te quieren fichar — no debería mover también la clasificación entera
 * del equipo.
 */

export interface StandingsRow {
  club: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  isPlayer: boolean;
}

export interface TableStandings {
  type: "table";
  label: string;
  rows: StandingsRow[];
}

export interface KnockoutStandings {
  type: "knockout";
  label: string;
  roundLabel: string;
  alive: boolean;
}

export type Standings = TableStandings | KnockoutStandings;

const RESERVE_RIVALS = [
  "Recreativo Granada B",
  "Cádiz CF Mirandilla",
  "Real Valladolid Promesas",
  "Sporting de Gijón B",
  "Levante UD B",
  "UD Almería B",
  "Real Oviedo Vetusta",
];

const LIGA_POOL = [
  "Real Madrid", "FC Barcelona", "Atlético de Madrid", "Sevilla FC", "Real Betis", "Villarreal CF",
  "Athletic Club", "Real Sociedad", "Valencia CF", "Real Valladolid", "Celta de Vigo", "Rayo Vallecano",
  "CA Osasuna", "RCD Mallorca", "Getafe CF", "Girona FC",
];

/** Los 20 equipos de la tabla completa de LaLiga (38 jornadas). */
const LIGA_FULL_POOL = [...LIGA_POOL, "Elche CF", "UD Almería", "UD Las Palmas", "Cádiz CF"];

const MUNDIAL_POOL = ["Brasil", "Francia", "Argentina", "Inglaterra", "Alemania", "Portugal", "Países Bajos", "Italia"];
const EUROCOPA_POOL = ["Alemania", "Francia", "Inglaterra", "Italia", "Portugal", "Países Bajos", "Bélgica", "Croacia"];
const COPA_AMERICA_POOL = ["Brasil", "Argentina", "Uruguay", "Colombia", "Chile", "Ecuador", "Perú", "Paraguay"];

/**
 * Nivel de club 1-5 — mismo dato que ya usan las ofertas de fichaje
 * (constants.ts) para los clubes que aparecen ahí; ampliado con el resto
 * de equipos que pueden salir en las tablas (rivales de Champions/
 * Europa/selecciones) que no vienen de esa lista. Cualquier club no
 * mapeado (un canterano rival del filial, un club al que te traspasan
 * más adelante en la carrera...) cae en el nivel medio (3) por defecto.
 */
const CLUB_TIER: Record<string, number> = {
  // Grandes de LaLiga / Champions habituales
  "Real Madrid": 5, "FC Barcelona": 5, "Atlético de Madrid": 5,
  "Manchester City": 5, "Bayern Múnich": 5, "Paris Saint-Germain": 5, "Liverpool FC": 5,
  "Borussia Dortmund": 5, "Inter de Milán": 5, "Juventus": 5,
  // Europeos habituales / buenos
  "Sevilla FC": 4, "Real Betis": 4, "Villarreal CF": 4, "Athletic Club": 4, "Real Sociedad": 4,
  "Valencia CF": 4, "Benfica": 4, "AS Roma": 4, Ajax: 4, "Sporting CP": 4,
  "FC Schalke 04": 4, "Bayer Leverkusen": 4, Feyenoord: 4, "Rangers FC": 4, Fenerbahçe: 4, "Slavia Praga": 4,
  // Media tabla
  "Celta de Vigo": 3, "Rayo Vallecano": 3, "CA Osasuna": 3, "RCD Mallorca": 3, "Getafe CF": 3, "Girona FC": 3,
  "Real Valladolid": 3, "Sporting de Gijón": 3, "UD Almería": 3,
  // Modestos
  "Málaga CF": 2, "Cádiz CF": 2, "Levante UD": 2, "Real Zaragoza": 2, "Real Oviedo": 2,
  // Selecciones (Mundial/Eurocopa/Copa América)
  Brasil: 5, Francia: 5, Argentina: 5, Alemania: 5, Inglaterra: 5,
  Portugal: 4, "Países Bajos": 4, Italia: 4, Bélgica: 4, Uruguay: 4, Croacia: 4, Colombia: 4,
  Chile: 3, Ecuador: 3, Perú: 3, Paraguay: 3,
};

function clubTier(club: string): number {
  return CLUB_TIER[club] ?? 3;
}

function mixSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Racha real de la temporada — victorias/empates/derrotas de TUS
 * partidos de verdad, sacados de career_events (ver getSeasonMatchRecord
 * más abajo). Pedido explícito: "lo lógico es que si gana partidos vayas
 * escalando o te mantengas 1" — antes la tabla era una foto fija por
 * semilla, sin memoria de si ganabas o perdías tus partidos.
 */
export interface SeasonMatchRecord {
  wins: number;
  draws: number;
  losses: number;
  played: number;
  /**
   * Resultado de cada partido clave doméstico, con el mes (1-10) en que se
   * jugó: sirve para saber a qué jornada real de las 38 corresponde.
   */
  results: { inSeasonWeek: number; r: "W" | "D" | "L" }[];
}

/**
 * Simula victorias/empates/derrotas partido a partido (no una media de
 * puntos directa) para que el resultado sea SIEMPRE matemáticamente
 * coherente: puntos = victorias×3 + empates, y victorias+empates+derrotas
 * = partidos jugados, por construcción — imposible que salga "7 puntos
 * en 2 partidos" o "24 puntos en 7 partidos" (bug real reportado por el
 * usuario con capturas: el cálculo anterior sacaba una media de puntos
 * por partido directamente, sin pasar por resultados reales, y para
 * clubes de nivel alto con ruido a favor podía superar el máximo
 * matemático de 3 puntos por partido). La probabilidad de victoria sube
 * con el nivel del club; el empate es una probabilidad fija realista.
 */
function simulateRecord(seed: string, tier: number, played: number): { won: number; drawn: number; lost: number; points: number } {
  const qualityNoise = ((mixSeed(`${seed}:quality`) % 1000) / 1000 - 0.5) * 0.08; // -0.04..0.04
  const winProb = Math.max(0.1, Math.min(0.78, 0.14 + tier * 0.115 + qualityNoise));
  const drawProb = 0.24;
  let won = 0;
  let drawn = 0;
  let lost = 0;
  for (let i = 0; i < played; i++) {
    const r = (mixSeed(`${seed}:m${i}`) % 10000) / 10000;
    if (r < winProb) won++;
    else if (r < winProb + drawProb) drawn++;
    else lost++;
  }
  return { won, drawn, lost, points: won * 3 + drawn };
}

/**
 * Tabla de 8 con el club del jugador insertado. Los RIVALES siguen una
 * simulación estable por semilla (nivel de club 1-5, ver comentario de
 * arriba del todo) porque no hay partido a partido real de cada uno de
 * ellos. TU fila, en cambio, usa resultados reales (victoria/empate/
 * derrota de verdad) en cuanto `record` trae algún partido jugado esta
 * temporada — así que si ganas, subes; si pierdes o empatas mucho, te
 * quedas atrás, con consecuencia de verdad en vez de ser cosmético.
 */
function buildTable(
  seed: string,
  playerClub: string,
  pool: string[],
  matchdayGuess: number,
  label: string,
  record?: SeasonMatchRecord,
): TableStandings {
  const others = pool.filter((c) => c !== playerClub);
  const shuffled = [...others].sort((a, b) => mixSeed(`${seed}:${a}`) - mixSeed(`${seed}:${b}`));
  const rivals = shuffled.slice(0, 7);
  const allClubs = [playerClub, ...rivals];

  const hasRealRecord = !!record && record.played > 0;
  // Los rivales usan tu mismo número de jornadas jugadas cuando ya hay
  // partidos reales tuyos esta temporada, para que la comparación de
  // puntos tenga sentido (no "tú llevas 3 partidos, ellos 12"). Sin
  // racha real, `matchdayGuess` ahora puede ser 0 (antes se forzaba un
  // mínimo de 1 siempre) — necesario para que una tabla de Champions no
  // pueda mostrar "1 partido jugado" en plena pretemporada, cuando esa
  // competición ni ha empezado todavía (ver cómo se calcula más abajo en
  // getActiveStandings, con los huecos reales del calendario).
  const played = hasRealRecord ? record!.played : Math.max(0, Math.min(matchdayGuess, 12));

  const rows: StandingsRow[] = allClubs
    .map((club) => {
      const isPlayer = club === playerClub;
      if (isPlayer && hasRealRecord) {
        const { wins, draws, losses } = record!;
        return { club, points: wins * 3 + draws, played, won: wins, drawn: draws, lost: losses, isPlayer };
      }
      const tier = clubTier(club);
      const sim = simulateRecord(`${seed}:${club}`, tier, played);
      return { club, points: sim.points, played, won: sim.won, drawn: sim.drawn, lost: sim.lost, isPlayer };
    })
    .sort((a, b) => b.points - a.points);

  return { type: "table", label, rows };
}

/** Resultado simulado (estable por semilla) del partido número `g` de un club. */
function simulateGame(seed: string, tier: number, g: number): "W" | "D" | "L" {
  const qualityNoise = ((mixSeed(`${seed}:quality`) % 1000) / 1000 - 0.5) * 0.08;
  const winProb = Math.max(0.1, Math.min(0.78, 0.14 + tier * 0.115 + qualityNoise));
  const r = (mixSeed(`${seed}:m${g}`) % 10000) / 10000;
  return r < winProb ? "W" : r < winProb + 0.24 ? "D" : "L";
}

/**
 * Tabla completa de LaLiga (20 equipos, 38 jornadas). Tus partidos clave
 * son partidos reales de jornadas concretas (4, 9, 14...); las demás
 * jornadas de tu equipo se simulan de forma estable. Así "PJ" es siempre
 * la jornada real en la que estás, y puntos = 3·G + E con G+E+P = PJ.
 */
function buildLigaTable(seed: string, playerClub: string, record?: SeasonMatchRecord): TableStandings {
  const keyByJornada = new Map<number, "W" | "D" | "L">();
  for (const res of record?.results ?? []) {
    const jornada = LIGA_JORNADA_BY_WEEK[res.inSeasonWeek];
    if (jornada) keyByJornada.set(jornada, res.r);
  }
  const jornadaNow = keyByJornada.size > 0 ? Math.max(...keyByJornada.keys()) : 0;

  const others = LIGA_FULL_POOL.filter((c) => c !== playerClub)
    .sort((a, b) => mixSeed(`${seed}:${a}`) - mixSeed(`${seed}:${b}`))
    .slice(0, 19);
  const rows: StandingsRow[] = [playerClub, ...others]
    .map((club) => {
      const isPlayer = club === playerClub;
      let won = 0;
      let drawn = 0;
      let lost = 0;
      const tier = clubTier(club);
      for (let g = 1; g <= jornadaNow; g++) {
        const res = isPlayer && keyByJornada.has(g) ? keyByJornada.get(g)! : simulateGame(`${seed}:${club}`, tier, g);
        if (res === "W") won++;
        else if (res === "D") drawn++;
        else lost++;
      }
      return { club, points: won * 3 + drawn, played: jornadaNow, won, drawn, lost, isPlayer };
    })
    .sort((a, b) => b.points - a.points || b.won - a.won);

  const label = jornadaNow > 0 ? `LaLiga · Jornada ${jornadaNow} de ${LIGA_TOTAL_JORNADAS}` : "LaLiga";
  return { type: "table", label, rows };
}

/**
 * Racha real de tus partidos de esta temporada, leída de career_events —
 * mismo criterio de "qué cuenta como partido real" que ya usa
 * getCurrentSeasonStats (categoría "partido", sin contar match-decision-*
 * ni el amistoso de pretemporada). El marcador se parsea del texto: el
 * proyecto garantiza en el prompt de generación que siempre se escribe
 * "tu equipo - rival" en ese orden, así que el primer número es el tuyo.
 */
// Las etiquetas son literales exactos que el prompt de generateMatchDayEvent
// obliga a incluir en la descripción (compLabel en engine.ts) — Champions,
// Europa League y Copa del Rey ya tienen su propio seguimiento real (tabla
// europea aparte, cuadro de eliminatoria), así que por defecto se excluyen
// de la racha "doméstica" para no mezclar dos competiciones en una tabla.
const SEPARATE_COMPETITION_LABELS = ["Champions League", "Europa League", "Copa del Rey", "Partido internacional"];

export async function getSeasonMatchRecord(
  supabase: SupabaseClient,
  player: Pick<Player, "id" | "week">,
  opts?: {
    onlyLabels?: string[];
    /**
     * El evento que el jugador tiene delante ahora mismo (player.pending_event).
     * Si es un partido con marcador, ese resultado YA lo está leyendo — la
     * clasificación tiene que reflejarlo ya, no esperar a que pulse
     * continuar. Reportado en vivo: perdió un partido, la tabla decía
     * "1 partido, 3 puntos" hasta pasar de escena. Al resolverse, el evento
     * pasa a career_events y deja de ser pending, así que no se cuenta dos veces.
     */
    pendingEvent?: { id?: string; category?: string; title?: string; description?: string } | null;
  },
): Promise<SeasonMatchRecord> {
  const season = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const seasonStartWeek = season * WEEKS_PER_SEASON + 1;

  const record: SeasonMatchRecord = { wins: 0, draws: 0, losses: 0, played: 0, results: [] };

  const countRow = (eventId: string, category: string | undefined, title: string, description: string, week: number) => {
    const isMatch = category === "partido" && !eventId.startsWith("match-decision-") && eventId !== "pretemp-amistoso";
    if (!isMatch) return;

    const text = `${title} ${description}`;
    if (opts?.onlyLabels) {
      if (!opts.onlyLabels.some((label) => text.includes(label))) return;
    } else if (SEPARATE_COMPETITION_LABELS.some((label) => text.includes(label))) {
      return;
    }

    const scoreMatch = text.match(/marcador[^0-9]{0,20}(\d{1,2})\s*-\s*(\d{1,2})/i);
    if (!scoreMatch) return;

    const ownGoals = parseInt(scoreMatch[1], 10);
    const rivalGoals = parseInt(scoreMatch[2], 10);
    record.played += 1;
    const r = ownGoals > rivalGoals ? "W" : ownGoals === rivalGoals ? "D" : "L";
    if (r === "W") record.wins += 1;
    else if (r === "D") record.draws += 1;
    else record.losses += 1;
    record.results.push({ inSeasonWeek: week - seasonStartWeek + 1, r });
  };

  try {
    const { data, error } = await supabase
      .from("career_events")
      .select("title, description, category, event_id, week")
      .eq("player_id", player.id)
      .gte("week", seasonStartWeek)
      .lte("week", player.week)
      .order("week", { ascending: true });

    if (!error && data) {
      for (const row of data) {
        countRow(
          (row.event_id as string) ?? "",
          row.category as string | undefined,
          (row.title as string) ?? "",
          (row.description as string) ?? "",
          (row.week as number) ?? player.week,
        );
      }
    }

    const pending = opts?.pendingEvent;
    if (pending) countRow(pending.id ?? "", pending.category, pending.title ?? "", pending.description ?? "", player.week);
  } catch (err) {
    console.error("[getSeasonMatchRecord] threw:", err instanceof Error ? err.message : err);
  }

  return record;
}

/**
 * Qué clasificación(es) mostrar ahora mismo — como mucho 2 (liga/filial +
 * europea, "adicional" tal como se pidió) más el cuadro de Copa aparte,
 * salvo que haya un torneo de selección activo, que sustituye TODO lo
 * anterior mientras dure (no juegas con el club mientras estás con la
 * selección). `usedEventIds` decide si ya pasaste por la cadena de
 * filial (ver rookie-progression.ts / el mismo criterio que la etiqueta
 * "Con el filial" en carrera/page.tsx).
 */
export function getActiveStandings(
  player: Player,
  usedEventIds: string[],
  record?: SeasonMatchRecord,
): { primary: TableStandings | null; secondary: TableStandings | null; copa: KnockoutStandings | null; euro: KnockoutStandings | null } {
  if (player.club === NO_CLUB_YET) return { primary: null, secondary: null, copa: null, euro: null };

  const season = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const inSeasonWeek = ((player.week - 1) % WEEKS_PER_SEASON) + 1;
  const seed = `${player.id}:${season}`;

  // Cuántas jornadas de CADA competición ya han pasado según el propio
  // calendario del juego (ver LIGA_MATCHDAY_OFFSETS/EUROPEAN_MATCHDAY_OFFSETS
  // en match-calendar.ts: Liga en las semanas 3/5/8, Champions/Europa en
  // la 6/10 de cada temporada) — reportado por el usuario con captura: la
  // tabla de Champions marcaba "1 partido jugado" en plena pretemporada,
  // cuando esa competición real no empieza hasta la semana 6. Antes se
  // usaba un "matchdayGuess" genérico (semana actual, sin más) para
  // cualquier tabla, sin mirar si esa competición concreta ya había
  // arrancado.
  // Estrictamente ANTES de esta semana: el partido de la semana en curso
  // todavía no se ha jugado hasta que el jugador resuelve su escena (si ya
  // está leyendo el resultado, entra por el pendingEvent de
  // getSeasonMatchRecord). Antes se contaba como jugado de antemano y la
  // tabla se inventaba un resultado que luego contradecía a la narración.
  // Fase de grupos europea: dos partidos clave que representan las jornadas
  // 3 y 6 de 6 (ver EURO_GROUP_JORNADAS en match-calendar.ts).
  const euroGroupsPlayed = EURO_GROUP_WEEKS.filter((w) => w < inSeasonWeek).length;
  const europeanMatchdayGuess = euroGroupsPlayed === 0 ? 0 : EURO_GROUP_JORNADAS[euroGroupsPlayed - 1];
  // Filial y torneos de selección no tienen un calendario de jornadas
  // fijas definido en match-calendar.ts (son narrativa, no partidos
  // programados semana a semana) — se quedan con la estimación genérica
  // de antes, proporcional a en qué semana de la temporada/torneo estás.
  const matchdayGuess = inSeasonWeek;

  const torneo = player.flags?.torneo_activo;
  if (typeof torneo === "string" && torneo) {
    const pool = torneo === "mundial" ? MUNDIAL_POOL : torneo === "eurocopa" ? EUROCOPA_POOL : COPA_AMERICA_POOL;
    const label = torneo === "mundial" ? "Mundial · Fase de grupos" : torneo === "eurocopa" ? "Eurocopa · Fase de grupos" : "Copa América · Fase de grupos";
    return { primary: buildTable(`${seed}:${torneo}`, player.nation, pool, matchdayGuess, label, record), secondary: null, copa: null, euro: null };
  }

  const rookieChainStarted = usedEventIds.includes("pretemp-amistoso");
  const rookieChainFinished = usedEventIds.includes("rookie-debut-oficial");
  const inFilial = rookieChainStarted && !rookieChainFinished;

  const primary = inFilial
    ? buildTable(`${seed}:filial`, player.club, RESERVE_RIVALS, matchdayGuess, "Segunda RFEF · Filial", record)
    : buildLigaTable(`${seed}:liga`, player.club, record);

  if (inFilial) return { primary, secondary: null, copa: null, euro: null };

  // La tabla europea NO usa tu racha real: mezclaría resultados de liga y
  // de Champions/Europa League en la misma cuenta de puntos, dos
  // competiciones distintas con sus propias tablas reales. Se queda como
  // simulación estable — el progreso real en esa competición concreta ya
  // se cuenta aparte, en el propio evento de eliminatoria cuando toca.
  const european = getEuropeanCompetitionFor(player.club);
  const secondary = european
    ? buildTable(`${seed}:${european.competition}`, player.club, european.rivals, europeanMatchdayGuess, european.label)
    : null;

  const copaProgress = getCopaProgress(player, season);
  const copa: KnockoutStandings | null =
    copaProgress.round > 0 && copaProgress.alive
      ? { type: "knockout", label: "Copa del Rey", roundLabel: copaRoundName(copaProgress.round), alive: true }
      : null;

  const euroProgress = getEuroProgress(player, season);
  const euro: KnockoutStandings | null =
    european && euroProgress.round > 0 && euroProgress.alive
      ? { type: "knockout", label: european.competition === "champions" ? "Champions League" : "Europa League", roundLabel: euroRoundName(euroProgress.round), alive: true }
      : null;

  return { primary, secondary, copa, euro };
}
