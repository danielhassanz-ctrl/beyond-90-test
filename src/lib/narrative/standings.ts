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
 * tabla durante toda la temporada, cambia de una temporada a otra), con
 * tu posición influida por tu media — cuanto mejor rindas, más arriba
 * apareces. Prioriza sentirse real y dar contexto visual sobre simular
 * cada jornada de cada rival, que sería un sistema aparte mucho mayor.
 */

export interface StandingsRow {
  club: string;
  points: number;
  played: number;
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

function mixSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  return h >>> 0;
}

/** Tabla de 8 con el club del jugador insertado — posición sesgada por media, puntos estables por temporada. */
function buildTable(seed: string, playerClub: string, pool: string[], media: number, matchdayGuess: number, label: string): TableStandings {
  const others = pool.filter((c) => c !== playerClub);
  const shuffled = [...others].sort((a, b) => mixSeed(`${seed}:${a}`) - mixSeed(`${seed}:${b}`));
  const rivals = shuffled.slice(0, 7);

  const played = Math.max(1, Math.min(matchdayGuess, 12));
  // Puntos estables por rival (2.2 puntos/partido de media, con algo de ruido por semilla).
  const rivalPoints = rivals.map((club) => {
    const noise = (mixSeed(`${seed}:${club}:pts`) % 100) / 100 - 0.5; // -0.5..0.5
    return { club, points: Math.max(0, Math.round(played * (2.0 + noise * 1.6))), played };
  });

  // Posición del jugador según media (40-99 -> últimos-primeros), con un punto de ruido propio.
  const mediaFrac = Math.max(0, Math.min(1, (media - 40) / 59));
  const ownNoise = (mixSeed(`${seed}:${playerClub}:pos`) % 100) / 100 - 0.5;
  const targetIdx = Math.round((1 - mediaFrac) * 7 + ownNoise);
  const sortedRivals = [...rivalPoints].sort((a, b) => b.points - a.points);
  const neighborPoints = sortedRivals[Math.max(0, Math.min(7, targetIdx))]?.points ?? Math.round(played * 2);
  const ownPoints = Math.max(0, neighborPoints + (mixSeed(`${seed}:${playerClub}:adj`) % 3) - 1);

  const rows: StandingsRow[] = [...sortedRivals, { club: playerClub, points: ownPoints, played, isPlayer: false }]
    .sort((a, b) => b.points - a.points)
    .map((r) => ({ ...r, isPlayer: r.club === playerClub }));

  return { type: "table", label, rows };
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
): { primary: TableStandings | null; secondary: TableStandings | null; copa: KnockoutStandings | null } {
  if (player.club === NO_CLUB_YET) return { primary: null, secondary: null, copa: null };

  const season = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const matchdayGuess = ((player.week - 1) % WEEKS_PER_SEASON) + 1;
  const seed = `${player.id}:${season}`;

  const torneo = player.flags?.torneo_activo;
  if (typeof torneo === "string" && torneo) {
    const pool = torneo === "mundial" ? MUNDIAL_POOL : torneo === "eurocopa" ? EUROCOPA_POOL : COPA_AMERICA_POOL;
    const label = torneo === "mundial" ? "Mundial · Fase de grupos" : torneo === "eurocopa" ? "Eurocopa · Fase de grupos" : "Copa América · Fase de grupos";
    return { primary: buildTable(`${seed}:${torneo}`, player.nation, pool, player.media, matchdayGuess, label), secondary: null, copa: null };
  }

  const rookieChainStarted = usedEventIds.includes("pretemp-amistoso");
  const rookieChainFinished = usedEventIds.includes("rookie-debut-oficial");
  const inFilial = rookieChainStarted && !rookieChainFinished;

  const primary = inFilial
    ? buildTable(`${seed}:filial`, player.club, RESERVE_RIVALS, player.media, matchdayGuess, "Segunda RFEF · Filial")
    : buildTable(`${seed}:liga`, player.club, LIGA_POOL, player.media, matchdayGuess, "LaLiga");

  if (inFilial) return { primary, secondary: null, copa: null };

  const european = getEuropeanCompetitionFor(player.club);
  const secondary = european ? buildTable(`${seed}:${european.competition}`, player.club, european.rivals, player.media, matchdayGuess, european.label) : null;

  const copaProgress = getCopaProgress(player, season);
  const copa: KnockoutStandings | null =
    copaProgress.round > 0 && copaProgress.alive
      ? { type: "knockout", label: "Copa del Rey", roundLabel: copaRoundName(copaProgress.round), alive: true }
      : null;

  return { primary, secondary, copa };
}
