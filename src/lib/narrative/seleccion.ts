/**
 * La selección entre torneos: Nations League, clasificatorias del Mundial y de
 * la Eurocopa, amistosos internacionales. Antes un jugador titular en un grande
 * podía pasar años sin jugar un solo partido con su país: solo existían los
 * torneos finales. Ahora, dos veces por temporada (ventanas de octubre y de
 * marzo), si te convocan, se vive un partido clave con la selección.
 *
 * Quién es convocado se decide una vez por temporada según la media: un jugador
 * de 87 casi siempre, uno de 70 de vez en cuando. Cuenta en las estadísticas
 * como partido con la selección.
 */
import type { Player } from "@/types/player";
import type { MatchWeek } from "@/lib/calendar/match-calendar";
import { hasMajorTournament } from "@/lib/calendar/season";
import { getConfederation } from "@/lib/nations";
import { NO_CLUB_YET } from "@/lib/constants";
import { TORNEO_POOLS, nationTier } from "@/lib/narrative/torneo";

export interface SelWindowPlan {
  /** 0 = ventana de octubre, 1 = ventana de marzo. */
  idx: 0 | 1;
  season: number;
  kind: "clasificatoria" | "nations" | "amistoso";
  /** "Clasificatoria Mundial", "Nations League", "Amistoso internacional"... */
  label: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

export function selWindowKey(season: number, idx: number): string {
  return `sel.${season}.${idx}`;
}

/** ¿Toca partido con la selección este turno? (null si no). Decide también si te convocan esta temporada. */
export function selWindowPlan(player: Player, weekInSeason: number, injured: boolean, torneoActive: boolean): SelWindowPlan | null {
  if (injured || torneoActive || player.club === NO_CLUB_YET || !player.nation) return null;
  const idx = weekInSeason === 4 ? 0 : weekInSeason === 8 ? 1 : -1;
  if (idx < 0) return null;
  const season = Math.floor((player.week - 1) / 10);
  const age = 16 + season;
  if (age < 18 || player.week < 20) return null;
  const flags = (player.flags ??= {});
  if (flags[`sel_win_${season}_${idx}`]) return null;

  // Convocatoria de esta temporada: se decide una vez.
  const callKey = `sel_call_${season}`;
  if (flags[callKey] === undefined) {
    const p = clamp(((player.media ?? 60) - 66) / 20, 0.04, 0.97);
    flags[callKey] = Math.random() < p ? "1" : "0";
  }
  if (flags[callKey] !== "1") return null;

  const conf = getConfederation(player.nation);
  const next = hasMajorTournament(season + 1, age, player.nation);
  let kind: SelWindowPlan["kind"];
  let label: string;
  if (next.has && next.type === "mundial") {
    kind = "clasificatoria";
    label = "Clasificatoria Mundial";
  } else if (next.has && next.type === "eurocopa" && conf === "UEFA") {
    kind = "clasificatoria";
    label = "Clasificatoria Eurocopa";
  } else if (conf === "UEFA") {
    kind = "nations";
    label = "Nations League";
  } else {
    kind = "amistoso";
    label = "Amistoso internacional";
  }
  return { idx: idx as 0 | 1, season, kind, label };
}

/** El partido de la ventana como un MatchWeek (rival estable para esa temporada y ventana). */
export function buildSelMatch(player: Player, plan: SelWindowPlan): MatchWeek {
  const conf = getConfederation(player.nation);
  const pool = (conf === "CONMEBOL" ? TORNEO_POOLS.copa_america : conf === "UEFA" ? TORNEO_POOLS.eurocopa : TORNEO_POOLS.mundial).filter((n) => n !== player.nation);
  const rival = [...pool].sort((a, b) => hash(`${player.id}:${plan.season}:${plan.idx}:${a}`) - hash(`${player.id}:${plan.season}:${plan.idx}:${b}`))[0];
  const home = hash(`${player.id}:${plan.season}:${plan.idx}:home`) % 2 === 0;
  const window = plan.idx === 0 ? "ventana de octubre" : "ventana de marzo";
  return {
    week: player.week,
    slot: 1,
    season: plan.season,
    matchday: plan.idx + 1,
    competition: "internacional",
    homeTeam: home ? player.nation : rival,
    awayTeam: home ? rival : player.nation,
    rivalClub: rival,
    mandatory: true,
    description: `${plan.label} · ${window} ante ${rival}`,
    stakes: "importante",
    selKey: selWindowKey(plan.season, plan.idx),
  };
}

/** Resultado decidido en código antes de pedir la crónica. */
export function decideSelResult(player: Player, rival: string): { win: boolean; draw: boolean; scoreLine: string } {
  const diff = nationTier(player.nation) - nationTier(rival);
  const mediaBonus = clamp(((player.media ?? 60) - 70) / 250, -0.08, 0.1);
  const pWin = clamp(0.5 + diff * 0.1 + mediaBonus, 0.15, 0.85);
  const roll = Math.random();
  const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
  if (roll < pWin) return { win: true, draw: false, scoreLine: pick(["2-0", "1-0", "3-1", "2-1", "3-0", "4-1"]) };
  if (roll < pWin + 0.2) return { win: false, draw: true, scoreLine: pick(["1-1", "0-0", "2-2"]) };
  return { win: false, draw: false, scoreLine: pick(["0-1", "1-2", "0-2", "1-3"]) };
}
