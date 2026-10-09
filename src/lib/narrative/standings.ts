import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import {
  getEuropeanCompetitionFor,
  EURO_GROUP_WEEKS,
  EURO_GROUP_JORNADAS,
} from "@/lib/calendar/match-calendar";
import { leagueOf, leagueTier, ligaJornadaByWeek, canonicalClub } from "@/lib/calendar/leagues";
import { getCopaProgress, getEuroProgress, copaRoundName, euroRoundName } from "@/lib/calendar/competition-progress";
import { WEEKS_PER_SEASON } from "@/types/career";
import { getTorneoProgress, torneoGroupRivals, TORNEO_NAMES, TORNEO_STAGE_LABELS, torneoYear, type TorneoType } from "@/lib/narrative/torneo";

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
  /** Si caíste: cómo (ronda, rival y marcador) para dejarlo visible el resto de la temporada. */
  result?: string;
  /** Texto de la etiqueta (por defecto "Sigues vivo" / "Eliminado"). */
  badge?: string;
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
  return CLUB_TIER[club] ?? leagueTier(club) ?? 3;
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
    const jornada = ligaJornadaByWeek(playerClub)[res.inSeasonWeek];
    if (jornada) keyByJornada.set(jornada, res.r);
  }
  const jornadaNow = keyByJornada.size > 0 ? Math.max(...keyByJornada.keys()) : 0;

  const league = leagueOf(playerClub);
  const others = league.teams.filter((c) => c !== playerClub)
    .sort((a, b) => mixSeed(`${seed}:${a}`) - mixSeed(`${seed}:${b}`))
    .slice(0, league.teams.length - 1);
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

  const label = jornadaNow > 0 ? `${league.short} · Jornada ${jornadaNow} de ${league.jornadas}` : league.short;
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
const SEPARATE_COMPETITION_LABELS = ["Champions League", "Europa League", "Copa del Rey", "FA Cup", "DFB-Pokal", "Copa de Italia", "Copa de Francia", "Copa del Rey saudí", "Partido internacional"];

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
  const progress = getTorneoProgress(player);
  if (typeof torneo === "string" && torneo && progress) {
    const type = progress.type;
    const name = `${TORNEO_NAMES[type]} ${torneoYear(progress.season)}`;
    const rivals = torneoGroupRivals(player, type, progress.season);
    const playedGroup = Math.min(progress.stage, 3);
    // Tus resultados reales de grupo. En partidas anteriores a guardarlos se reconstruyen desde los puntos.
    let mine = (progress.res ?? "").split("").filter((c) => c === "W" || c === "D" || c === "L").slice(0, playedGroup);
    if (mine.length < playedGroup) {
      const w = Math.min(playedGroup, Math.floor(progress.groupPts / 3));
      const d = Math.min(playedGroup - w, progress.groupPts - w * 3);
      mine = [...Array(w).fill("W"), ...Array(d).fill("D"), ...Array(Math.max(0, playedGroup - w - d)).fill("L")];
    }
    // Grupo de 4 con partidos de verdad: en cada jornada juegas contra un rival y los otros dos se enfrentan entre sí.
    const teams = [player.nation, ...rivals];
    const tally = new Map<string, { won: number; drawn: number; lost: number }>(teams.map((c) => [c, { won: 0, drawn: 0, lost: 0 }]));
    const book = (club: string, r: "W" | "D" | "L") => {
      const row = tally.get(club)!;
      if (r === "W") row.won++;
      else if (r === "D") row.drawn++;
      else row.lost++;
    };
    const pairings: [string, string, string, string][] = [
      // [tu rival, otro A, otro B] por jornada
      [rivals[0], rivals[1], rivals[2], ""],
      [rivals[1], rivals[0], rivals[2], ""],
      [rivals[2], rivals[0], rivals[1], ""],
    ];
    for (let j = 0; j < playedGroup; j++) {
      const [opp, x, y] = pairings[j];
      const r = mine[j] as "W" | "D" | "L";
      book(player.nation, r);
      book(opp, r === "W" ? "L" : r === "L" ? "W" : "D");
      // Los otros dos: resultado estable según su nivel.
      const pX = Math.max(0.15, Math.min(0.7, 0.4 + (clubTier(x) - clubTier(y)) * 0.1));
      const roll = (mixSeed(`${seed}:${type}:${x}:${y}:j${j}`) % 10000) / 10000;
      const rx: "W" | "D" | "L" = roll < pX ? "W" : roll < pX + 0.24 ? "D" : "L";
      book(x, rx);
      book(y, rx === "W" ? "L" : rx === "L" ? "W" : "D");
    }
    const rows: StandingsRow[] = teams
      .map((club) => {
        const s = tally.get(club)!;
        return { club, points: s.won * 3 + s.drawn, played: playedGroup, won: s.won, drawn: s.drawn, lost: s.lost, isPlayer: club === player.nation };
      })
      .sort((p, q) => q.points - p.points || q.won - p.won);
    const letter = "ABCDEFGH"[mixSeed(`${seed}:${type}:grupo`) % 8];
    const table: TableStandings = { type: "table", label: `${name} · Grupo ${letter}`, rows };
    if (progress.stage < 3) return { primary: table, secondary: null, copa: null, euro: null };
    const ko: KnockoutStandings = {
      type: "knockout",
      label: name,
      roundLabel: TORNEO_STAGE_LABELS[Math.min(progress.stage, TORNEO_STAGE_LABELS.length - 1)],
      alive: progress.alive,
    };
    return { primary: table, secondary: null, copa: null, euro: ko };
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
  const eliminatedText = (roundName: string, p: { elim?: { opp: string; score: string; club: string } }) =>
    p.elim ? `${p.elim.club} ${p.elim.score} ${p.elim.opp}` : roundName;
  const copa: KnockoutStandings | null =
    copaProgress.round > 0 && copaProgress.alive
      ? { type: "knockout", label: leagueOf(player.club).cup, roundLabel: copaRoundName(copaProgress.round, player.club), alive: true }
      : copaProgress.round > 0
        ? { type: "knockout", label: leagueOf(player.club).cup, roundLabel: `Eliminado en ${shortRound(copaRoundName(copaProgress.round, player.club))}`, alive: false, result: eliminatedText("", copaProgress) || undefined }
        : null;

  const euroProgress = getEuroProgress(player, season);
  const euroLabel = european ? (european.competition === "champions" ? "Champions League" : "Europa League") : "";
  const euro: KnockoutStandings | null = !european
    ? null
    : euroProgress.round > 0 && euroProgress.alive
      ? { type: "knockout", label: euroLabel, roundLabel: euroRoundName(euroProgress.round), alive: true }
      : euroProgress.round > 0
        ? { type: "knockout", label: euroLabel, roundLabel: `Eliminado en ${shortRound(euroRoundName(euroProgress.round))}`, alive: false, result: eliminatedText("", euroProgress) || undefined }
        : !euroProgress.alive && euroGroupsPlayed >= 2
          ? { type: "knockout", label: euroLabel, roundLabel: "Eliminado en la fase de grupos", alive: false }
          : null;

  const torneoDone = lastTorneoResult(player, season);
  return { primary, secondary, copa, euro: torneoDone ?? euro };
}

const TORNEO_RESULT_TEXT: Record<string, string> = {
  fase_de_grupos: "Eliminado en la fase de grupos",
  octavos: "Eliminado en octavos de final",
  cuartos: "Eliminado en cuartos de final",
  semifinal: "Eliminado en semifinales",
  subcampeon: "Subcampeón, a un paso de la gloria",
  campeon: "¡Campeón!",
};

/** Cómo acabó el torneo de selecciones de esta temporada, si ya se jugó. */
function lastTorneoResult(player: Player, season: number): KnockoutStandings | null {
  for (const type of ["mundial", "eurocopa", "copa_america"] as TorneoType[]) {
    const v = player.flags?.[`torneo_result_${type}_${season}`];
    if (typeof v === "string" && TORNEO_RESULT_TEXT[v]) {
      return { type: "knockout", label: `${TORNEO_NAMES[type]} ${torneoYear(season)}`, roundLabel: TORNEO_RESULT_TEXT[v], alive: v === "campeon" || v === "subcampeon", badge: v === "campeon" ? "Campeón" : v === "subcampeon" ? "Subcampeón" : "Eliminado" };
    }
  }
  return null;
}

/** "Octavos de Copa del Rey" → "octavos"; "Final" → "la final". */
function shortRound(name: string): string {
  const n = name.toLowerCase();
  if (n.startsWith("dieciseisavos")) return "dieciseisavos";
  if (n.startsWith("octavos")) return "octavos";
  if (n.startsWith("cuartos")) return "cuartos";
  if (n.startsWith("semifinal")) return "semifinales";
  if (n.startsWith("final")) return "la final";
  return n;
}

/**
 * Cómo ha acabado la Liga esta temporada para tu club: puesto y puntos de la MISMA tabla
 * que ves en Clasificación (tus resultados reales + los demás simulados). null si no hay
 * una temporada completa que juzgar (club fuera de LaLiga o menos de 30 jornadas).
 */
export function leagueFinish(
  player: Pick<Player, "id" | "club" | "week">,
  record: SeasonMatchRecord,
): { rank: number; points: number; secondPoints: number; leaderPoints: number } | null {
  if (!leagueOf(player.club).teams.includes(canonicalClub(player.club))) return null;
  const season = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const table = buildLigaTable(`${player.id}:${season}:liga`, player.club, record);
  const played = table.rows[0]?.played ?? 0;
  if (played < 30) return null;
  const idx = table.rows.findIndex((r) => r.isPlayer);
  if (idx < 0) return null;
  const other = table.rows.filter((r) => !r.isPlayer).sort((a, b) => b.points - a.points)[0];
  return { rank: idx + 1, points: table.rows[idx].points, secondPoints: other?.points ?? 0, leaderPoints: table.rows[0].points };
}
