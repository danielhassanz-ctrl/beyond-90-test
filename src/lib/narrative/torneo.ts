/**
 * Torneos de selecciones (Mundial, Eurocopa, Copa América) jugados partido a
 * partido. Antes eran UNA sola escena con el resultado ya decidido ("levantas
 * el trofeo" o "caes eliminado"): ahora hay fase de grupos (3 partidos) y
 * eliminatorias (octavos, cuartos, semifinal y final) con su jugada decisiva
 * y su crónica, y entre partido y partido, vida de concentración
 * (torneo-life.ts).
 *
 * El estado vive en player.flags.torneo_progress (JSON) y el resultado de cada
 * partido se decide en CÓDIGO antes de pedirle la crónica a la IA, igual que
 * la Copa (competition-progress.ts).
 */
import type { Player } from "@/types/player";
import { WEEKS_PER_SEASON } from "@/types/career";
import type { MatchWeek } from "@/lib/calendar/match-calendar";
import { decideKnockoutResult } from "@/lib/calendar/competition-progress";
import { hasMajorTournament } from "@/lib/calendar/season";
import { getConfederation } from "@/lib/nations";

export type TorneoType = "mundial" | "eurocopa" | "copa_america";

export interface TorneoProgress {
  type: TorneoType;
  season: number;
  /** Siguiente partido por jugar: 0-2 grupos, 3 octavos, 4 cuartos, 5 semifinal, 6 final. */
  stage: number;
  alive: boolean;
  /** Puntos en la fase de grupos. */
  groupPts: number;
  /** Toca una escena de concentración antes del siguiente partido. */
  lifeDue: boolean;
  /** Escenas de concentración ya vividas (para no agotar las plantillas). */
  lifeCount: number;
}

export const TORNEO_NAMES: Record<TorneoType, string> = {
  mundial: "Mundial",
  eurocopa: "Eurocopa",
  copa_america: "Copa América",
};

export const TORNEO_STAGE_LABELS = [
  "Fase de grupos · Jornada 1",
  "Fase de grupos · Jornada 2",
  "Fase de grupos · Jornada 3",
  "Octavos de final",
  "Cuartos de final",
  "Semifinal",
  "Final",
];
export const TORNEO_STAGES = TORNEO_STAGE_LABELS.length;

export const TORNEO_POOLS: Record<TorneoType, string[]> = {
  mundial: ["Brasil", "Francia", "Argentina", "Inglaterra", "Alemania", "Portugal", "Países Bajos", "Italia", "Bélgica", "Croacia", "Uruguay", "Marruecos", "España"],
  eurocopa: ["Alemania", "Francia", "Inglaterra", "Italia", "Portugal", "Países Bajos", "Bélgica", "Croacia", "Dinamarca", "Suiza", "Polonia", "España"],
  copa_america: ["Brasil", "Argentina", "Uruguay", "Colombia", "Chile", "Ecuador", "Perú", "Paraguay", "Venezuela", "Bolivia", "México", "Estados Unidos"],
};

/** Nivel de selección 1-5 (por defecto, 3). */
const NATION_TIER: Record<string, number> = {
  Brasil: 5, Francia: 5, Argentina: 5, Alemania: 5, Inglaterra: 5, España: 5,
  Portugal: 4, "Países Bajos": 4, Italia: 4, Bélgica: 4, Uruguay: 4, Croacia: 4, Colombia: 4, Marruecos: 4,
  Chile: 3, Ecuador: 3, Perú: 3, Paraguay: 3, Dinamarca: 3, Suiza: 3, México: 3, "Estados Unidos": 3, Polonia: 3,
  Venezuela: 2, Bolivia: 2,
};

export function nationTier(nation: string): number {
  return NATION_TIER[nation] ?? 3;
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

export function getTorneoProgress(player: Pick<Player, "flags">): TorneoProgress | null {
  const raw = player.flags?.torneo_progress;
  if (typeof raw !== "string" || !raw) return null;
  try {
    return JSON.parse(raw) as TorneoProgress;
  } catch {
    return null;
  }
}

export function saveTorneoProgress(player: Pick<Player, "flags">, progress: TorneoProgress | null): void {
  const p = player as { flags: Record<string, string | boolean> | null };
  if (!p.flags) p.flags = {};
  p.flags.torneo_progress = progress ? JSON.stringify(progress) : "";
  p.flags.torneo_activo = progress ? progress.type : "";
}

/** Año natural del torneo: junio-julio del año en que arranca la temporada. */
export function torneoYear(season: number): number {
  return 2026 + season;
}

/**
 * ¿Toca vivir un torneo al arrancar esta temporada? Sí si es año de gran
 * torneo para la selección del jugador, rinde lo bastante como para estar
 * convocado, no está lesionado y aún no lo ha vivido.
 */
export function shouldStartTorneo(player: Player, weekInSeason: number, injured: boolean): TorneoType | null {
  if (weekInSeason !== 1 || injured) return null;
  if (getTorneoProgress(player)) return null;
  const season = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  if (player.flags?.[`torneo_started_${season}`]) return null;
  if (player.week < 30) return null;
  const age = 16 + season;
  const tournament = hasMajorTournament(season, age, player.nation);
  if (!tournament.has || !tournament.type) return null;
  const minMedia = tournament.type === "mundial" ? 66 : 68;
  if ((player.media ?? 0) < minMedia) return null;
  if (tournament.type === "eurocopa" && getConfederation(player.nation) !== "UEFA") return null;
  if (tournament.type === "copa_america" && getConfederation(player.nation) !== "CONMEBOL") return null;
  return tournament.type;
}

export function startTorneoProgress(player: Player, type: TorneoType): TorneoProgress {
  const season = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const progress: TorneoProgress = { type, season, stage: 0, alive: true, groupPts: 0, lifeDue: true, lifeCount: 0 };
  if (!player.flags) player.flags = {};
  player.flags[`torneo_started_${season}`] = true;
  saveTorneoProgress(player, progress);
  return progress;
}

/** El partido del torneo `stage` como un MatchWeek (rival distinto en cada ronda). */
export function buildTorneoMatch(player: Player, progress: TorneoProgress): MatchWeek {
  const pool = TORNEO_POOLS[progress.type].filter((n) => n !== player.nation);
  const ordered = [...pool].sort((a, b) => hash(`${player.id}:${progress.season}:${progress.type}:${a}`) - hash(`${player.id}:${progress.season}:${progress.type}:${b}`));
  const rival = ordered[progress.stage % ordered.length];
  const name = `${TORNEO_NAMES[progress.type]} ${torneoYear(progress.season)}`;
  return {
    week: player.week,
    slot: 1,
    season: progress.season,
    matchday: progress.stage + 1,
    competition: "internacional",
    homeTeam: player.nation,
    awayTeam: rival,
    rivalClub: rival,
    mandatory: true,
    description: `${name} - ${TORNEO_STAGE_LABELS[progress.stage]} ante ${rival}`,
    stakes: progress.stage < 2 ? "importante" : "decisivo",
    torneoStage: progress.stage,
  };
}

export interface TorneoResult {
  kind: "group" | "ko";
  win: boolean;
  draw: boolean;
  scoreLine: string;
  /** Solo grupos: puntos que suma este partido. */
  points: number;
}

/** Decide el resultado del partido (en código, antes de la crónica de la IA). */
export function decideTorneoResult(player: Player, progress: TorneoProgress, rival: string): TorneoResult {
  const diff = nationTier(player.nation) - nationTier(rival);
  const mediaBonus = Math.min(0.1, Math.max(-0.08, ((player.media ?? 60) - 70) / 250));
  if (progress.stage >= 3) {
    const res = decideKnockoutResult(player.media ?? 60, 2, diff * 0.05);
    return { kind: "ko", win: res.win, draw: false, scoreLine: res.scoreLine, points: 0 };
  }
  const pWin = Math.max(0.15, Math.min(0.8, 0.44 + diff * 0.1 + mediaBonus));
  const pDraw = 0.22;
  const roll = Math.random();
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  if (roll < pWin) return { kind: "group", win: true, draw: false, scoreLine: pick(["1-0", "2-0", "2-1", "3-1", "3-0"]), points: 3 };
  if (roll < pWin + pDraw) return { kind: "group", win: false, draw: true, scoreLine: pick(["0-0", "1-1", "2-2"]), points: 1 };
  return { kind: "group", win: false, draw: false, scoreLine: pick(["0-1", "1-2", "0-2", "1-3"]), points: 0 };
}

/**
 * Aplica el resultado al estado del torneo y devuelve el siguiente estado.
 * `finished` es true si el torneo se acaba aquí (eliminado, o final jugada).
 */
export function advanceTorneo(
  progress: TorneoProgress,
  result: TorneoResult,
): { next: TorneoProgress; finished: boolean; qualified?: boolean; champion?: boolean; outcome: string } {
  const next: TorneoProgress = { ...progress, lifeDue: true };
  if (result.kind === "group") {
    next.groupPts += result.points;
    next.stage = progress.stage + 1;
    if (progress.stage === 2) {
      const qualified = next.groupPts >= 4 || (next.groupPts === 3 && Math.random() < 0.45);
      next.alive = qualified;
      if (!qualified) return { next, finished: true, qualified, outcome: "fase_de_grupos" };
      return { next, finished: false, qualified, outcome: "octavos" };
    }
    return { next, finished: false, outcome: "grupos" };
  }
  if (!result.win) {
    next.alive = false;
    const labels = ["octavos", "cuartos", "semifinal", "subcampeon"];
    return { next, finished: true, outcome: labels[progress.stage - 3] };
  }
  next.stage = progress.stage + 1;
  if (progress.stage === 6) return { next, finished: true, champion: true, outcome: "campeon" };
  return { next, finished: false, outcome: "ko" };
}
