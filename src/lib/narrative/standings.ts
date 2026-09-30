import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getEuropeanCompetitionFor } from "@/lib/calendar/match-calendar";
import { getCopaProgress, copaRoundName } from "@/lib/calendar/competition-progress";
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
  // puntos tenga sentido (no "tú llevas 3 partidos, ellos 12").
  const played = hasRealRecord ? record!.played : Math.max(1, Math.min(matchdayGuess, 12));

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
const SEPARATE_COMPETITION_LABELS = ["Champions League", "Europa League", "Copa del Rey"];

export async function getSeasonMatchRecord(
  supabase: SupabaseClient,
  player: Pick<Player, "id" | "week">,
  opts?: { onlyLabels?: string[] },
): Promise<SeasonMatchRecord> {
  const season = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const seasonStartWeek = season * WEEKS_PER_SEASON + 1;

  const record: SeasonMatchRecord = { wins: 0, draws: 0, losses: 0, played: 0 };

  try {
    const { data, error } = await supabase
      .from("career_events")
      .select("title, description, category, event_id")
      .eq("player_id", player.id)
      .gte("week", seasonStartWeek)
      .lte("week", player.week);

    if (error || !data) return record;

    for (const row of data) {
      const eventId = (row.event_id as string) ?? "";
      const isMatch = row.category === "partido" && !eventId.startsWith("match-decision-") && eventId !== "pretemp-amistoso";
      if (!isMatch) continue;

      const text = `${row.title ?? ""} ${row.description ?? ""}`;
      if (opts?.onlyLabels) {
        if (!opts.onlyLabels.some((label) => text.includes(label))) continue;
      } else if (SEPARATE_COMPETITION_LABELS.some((label) => text.includes(label))) {
        continue;
      }

      const scoreMatch = text.match(/marcador[^0-9]{0,20}(\d{1,2})\s*-\s*(\d{1,2})/i);
      if (!scoreMatch) continue;

      const ownGoals = parseInt(scoreMatch[1], 10);
      const rivalGoals = parseInt(scoreMatch[2], 10);
      record.played += 1;
      if (ownGoals > rivalGoals) record.wins += 1;
      else if (ownGoals === rivalGoals) record.draws += 1;
      else record.losses += 1;
    }
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
): { primary: TableStandings | null; secondary: TableStandings | null; copa: KnockoutStandings | null } {
  if (player.club === NO_CLUB_YET) return { primary: null, secondary: null, copa: null };

  const season = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const matchdayGuess = ((player.week - 1) % WEEKS_PER_SEASON) + 1;
  const seed = `${player.id}:${season}`;

  const torneo = player.flags?.torneo_activo;
  if (typeof torneo === "string" && torneo) {
    const pool = torneo === "mundial" ? MUNDIAL_POOL : torneo === "eurocopa" ? EUROCOPA_POOL : COPA_AMERICA_POOL;
    const label = torneo === "mundial" ? "Mundial · Fase de grupos" : torneo === "eurocopa" ? "Eurocopa · Fase de grupos" : "Copa América · Fase de grupos";
    return { primary: buildTable(`${seed}:${torneo}`, player.nation, pool, matchdayGuess, label, record), secondary: null, copa: null };
  }

  const rookieChainStarted = usedEventIds.includes("pretemp-amistoso");
  const rookieChainFinished = usedEventIds.includes("rookie-debut-oficial");
  const inFilial = rookieChainStarted && !rookieChainFinished;

  const primary = inFilial
    ? buildTable(`${seed}:filial`, player.club, RESERVE_RIVALS, matchdayGuess, "Segunda RFEF · Filial", record)
    : buildTable(`${seed}:liga`, player.club, LIGA_POOL, matchdayGuess, "LaLiga", record);

  if (inFilial) return { primary, secondary: null, copa: null };

  // La tabla europea NO usa tu racha real: mezclaría resultados de liga y
  // de Champions/Europa League en la misma cuenta de puntos, dos
  // competiciones distintas con sus propias tablas reales. Se queda como
  // simulación estable — el progreso real en esa competición concreta ya
  // se cuenta aparte, en el propio evento de eliminatoria cuando toca.
  const european = getEuropeanCompetitionFor(player.club);
  const secondary = european
    ? buildTable(`${seed}:${european.competition}`, player.club, european.rivals, matchdayGuess, european.label)
    : null;

  const copaProgress = getCopaProgress(player, season);
  const copa: KnockoutStandings | null =
    copaProgress.round > 0 && copaProgress.alive
      ? { type: "knockout", label: "Copa del Rey", roundLabel: copaRoundName(copaProgress.round), alive: true }
      : null;

  return { primary, secondary, copa };
}
