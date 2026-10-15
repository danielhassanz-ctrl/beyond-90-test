/**
 * LOS PREMIOS DE LA TEMPORADA. Al cerrarse cada temporada sale una escena con las listas de los premios grandes: Pichichi
 * (máximo goleador), Zamora (portero menos goleado), mejor jugador de la Liga, mejor jugador de la Champions y, si hubo torneo de
 * selecciones este verano (Mundial, Eurocopa, Copa América, Juegos), el mejor jugador del torneo. Cada lista tiene diez nombres
 * (los demás son inventados y estables para esa partida y ese año) y tu puesto sale de lo que has hecho de verdad: goles y
 * asistencias, partidos, bajas por lesión, títulos y hasta dónde llegó tu equipo. Todo en código, sin llamadas a la IA.
 */
import type { GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { leagueOf } from "@/lib/calendar/leagues";
import { getEuropeanCompetitionFor } from "@/lib/calendar/match-calendar";
import { getEuroProgress } from "@/lib/calendar/competition-progress";
import { fictionalPlayerName } from "@/lib/narrative/npcs";
import { readTrofeos } from "@/lib/honours";
import { TORNEO_POOLS, torneoLabel, type TorneoType } from "@/lib/narrative/torneo";

export type SeasonAwardKind = "pichichi" | "zamora" | "mejor_liga" | "mvp_champions" | "mvp_torneo";

export const SEASON_AWARD_NAMES: Record<SeasonAwardKind, string> = {
  pichichi: "Pichichi",
  zamora: "Zamora",
  mejor_liga: "Mejor jugador de la Liga",
  mvp_champions: "Mejor jugador de la Champions",
  mvp_torneo: "Mejor jugador del torneo",
};

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return h >>> 0;
}
/** Decimal estable en [-1, 1]. */
const jitter = (seed: string) => ((hash(seed) % 2001) - 1000) / 1000;
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const isKeeper = (player: Pick<Player, "position">) => (player.position ?? "").toLowerCase().includes("portero");

/** La temporada que se cierra al llegar a `season` (la anterior). */
export const closedSeason = (player: Pick<Player, "week">) => Math.floor((player.week - 1) / 10) - 1;

export const seasonAwardsId = (closed: number) => `premios-temporada-${closed}`;

/** ¿Toca la escena de premios? Cuando ya se ha vivido el cierre de temporada y todavía no se han dado. */
export function shouldTriggerSeasonAwards(player: Player, usedEventIds: readonly string[]): boolean {
  if (player.club === NO_CLUB_YET || player.status !== "active" || player.club.startsWith("SELECCIÓN:")) return false;
  const season = Math.floor((player.week - 1) / 10);
  const closed = season - 1;
  const turn = ((player.week - 1) % 10) + 1;
  if (closed < 1 || turn > 5 || playerAge(player.week) < 17) return false;
  if (!usedEventIds.includes(`preseason-${season}`) || usedEventIds.includes(seasonAwardsId(closed))) return false;
  // Sin partidos jugados con el club esa temporada no hay nada que premiar.
  return seasonStats(player, closed).matches >= 3;
}

interface SeasonStats {
  goals: number;
  assists: number;
  matches: number;
  cleanSheets: number;
}

/** Lo que hiciste esa temporada: el total acumulado menos lo que llevabas al empezarla (sb_<temporada>_*). */
export function seasonStats(player: Pick<Player, "flags" | "stats_goals" | "stats_assists" | "stats_matches_played" | "stats_clean_sheets">, closed: number): SeasonStats {
  const f = player.flags ?? {};
  const at = (s: number, k: string): number | null => (f[`sb_${s}_${k}`] === undefined ? null : num(f[`sb_${s}_${k}`]));
  // Sin marca de inicio (partidas anteriores a esta función) se reparte el total entre las temporadas jugadas.
  const fallback = (total: number, s: number) => Math.round(total / Math.max(1, s));
  const pair = (total: number, k: string) => {
    const start = at(closed, k);
    const end = at(closed + 1, k);
    if (start === null) return fallback(total, closed);
    return Math.max(0, (end ?? total) - start);
  };
  return {
    goals: pair(player.stats_goals ?? 0, "g"),
    assists: pair(player.stats_assists ?? 0, "a"),
    matches: pair(player.stats_matches_played ?? 0, "m"),
    cleanSheets: pair(player.stats_clean_sheets ?? 0, "c"),
  };
}

interface Row {
  name: string;
  club: string;
  value: number;
  text: string;
  isPlayer: boolean;
}

const fmtList = (rows: Row[]) => rows.map((r, i) => `${i + 1}. ${r.name}${r.isPlayer ? " (tú)" : ""} · ${r.club} · ${r.text}`).join("\n");

/** Clubes de la liga del jugador para los rivales de las listas. */
function leagueClubs(player: Player): string[] {
  return leagueOf(player.club).teams.filter((c) => c !== player.club);
}

function rivalNames(player: Player, seed: string, n: number, pool: string[]): { name: string; club: string }[] {
  const out: { name: string; club: string }[] = [];
  for (let i = 0; i < n; i++) {
    const club = pool[hash(`${seed}:club:${i}`) % pool.length];
    out.push({ name: fictionalPlayerName(`${seed}:${i}`, club, player.last_name), club });
  }
  return out;
}

/** Ordena y devuelve el top 10 con tu puesto (aunque quedes fuera, `rank` lo dice). */
function ranked(rows: Row[], higherIsBetter: boolean): { top: Row[]; rank: number } {
  const sorted = [...rows].sort((a, b) => (higherIsBetter ? b.value - a.value : a.value - b.value));
  const rank = sorted.findIndex((r) => r.isPlayer) + 1;
  return { top: sorted.slice(0, 10), rank };
}

interface AwardResult {
  kind: SeasonAwardKind;
  title: string;
  top: Row[];
  rank: number;
  /** Frase sobre cómo te ha ido en esta lista. */
  line: string;
  won: boolean;
}

function finishLine(rank: number, kind: SeasonAwardKind): string {
  const name = SEASON_AWARD_NAMES[kind];
  if (rank === 1) return `¡Eres el ${name}!`;
  if (rank <= 3) return `Terminas en el podio del ${name} (puesto ${rank}).`;
  if (rank <= 10) return `Entras entre los diez del ${name} (puesto ${rank}).`;
  return `Esta vez no entras entre los diez del ${name} (puesto ${rank}).`;
}

function pichichi(player: Player, closed: number, st: SeasonStats): AwardResult | null {
  if (isKeeper(player)) return null;
  const seed = `${player.id}:pichichi:${closed}`;
  // Los partidos clave son una muestra de la temporada: se proyecta tu ritmo a la liga entera, descontando lo que estuviste de baja.
  const available = Math.max(0.2, 1 - Math.min(10, num(player.flags?.[`inj_${closed}`])) / 10);
  const rate = st.matches > 0 ? st.goals / st.matches : 0;
  const mine = Math.round(Math.min(48, rate * 38 * available * 0.85));
  if (mine < 2 && st.matches < 6) return null;
  const topGoals = 24 + (hash(seed) % 9);
  const rows: Row[] = rivalNames(player, seed, 12, leagueClubs(player)).map((r, i) => {
    const goals = Math.max(5, Math.round(topGoals - i * 1.6 - Math.abs(jitter(`${seed}:g:${i}`)) * 2));
    return { name: r.name, club: r.club, value: goals + (i === 0 ? 0 : 0), text: `${goals} goles`, isPlayer: false };
  });
  rows.push({ name: displayName(player), club: player.club, value: mine + 0.01, text: `${mine} goles`, isPlayer: true });
  const { top, rank } = ranked(rows, true);
  return { kind: "pichichi", title: "Pichichi (máximo goleador)", top, rank, line: finishLine(rank, "pichichi"), won: rank === 1 };
}

function zamora(player: Player, closed: number, st: SeasonStats): AwardResult | null {
  if (!isKeeper(player) || st.matches < 3) return null;
  const seed = `${player.id}:zamora:${closed}`;
  const cleanRate = st.matches > 0 ? st.cleanSheets / st.matches : 0;
  const injTurns = num(player.flags?.[`inj_${closed}`]);
  // Goles encajados por partido estimados: más porterías a cero y más nivel, menos goles.
  const mine = Math.max(0.35, Math.min(1.6, 1.2 - cleanRate * 1.05 - ((player.media ?? 70) - 70) * 0.007 + injTurns * 0.03));
  const base = 0.6 + (hash(seed) % 8) / 100;
  const rows: Row[] = rivalNames(player, seed, 12, leagueClubs(player)).map((r, i) => {
    const v = Math.round((base + i * 0.04 + Math.abs(jitter(`${seed}:v:${i}`)) * 0.03) * 100) / 100;
    return { name: r.name, club: r.club, value: v, text: `${v.toFixed(2)} goles por partido`, isPlayer: false };
  });
  const m = Math.round(mine * 100) / 100;
  rows.push({ name: displayName(player), club: player.club, value: m - 0.0001, text: `${m.toFixed(2)} goles por partido`, isPlayer: true });
  const { top, rank } = ranked(rows, false);
  return { kind: "zamora", title: "Zamora (portero menos goleado)", top, rank, line: finishLine(rank, "zamora"), won: rank === 1 };
}

function mejorLiga(player: Player, closed: number, st: SeasonStats): AwardResult | null {
  if (st.matches < 3) return null;
  const seed = `${player.id}:mejor_liga:${closed}`;
  const lg = leagueOf(player.club);
  const trofeos = readTrofeos(player.flags).filter((t) => t.s === closed);
  const title = trofeos.some((t) => t.k === "liga") ? 2.2 : 0;
  const goalBonus = isKeeper(player) ? Math.min(2, st.cleanSheets * 0.3) : Math.min(3, (st.goals + st.assists * 0.6) * 0.25);
  const injTurns = num(player.flags?.[`inj_${closed}`]);
  const mine = (player.media ?? 60) + title + goalBonus - injTurns * 2 + jitter(`${seed}:yo`) * 3;
  const top = 88 + (lg.id === "es" ? 3 : 1) + (hash(seed) % 4);
  const rows: Row[] = rivalNames(player, seed, 12, [...leagueClubs(player), ...lg.champions.filter((c) => c !== player.club)]).map((r, i) => {
    const v = top - i * 0.9 + jitter(`${seed}:v:${i}`) * 2;
    return { name: r.name, club: r.club, value: v, text: i === 0 ? "el más decisivo de su liga" : "una temporada de nivel", isPlayer: false };
  });
  rows.push({ name: displayName(player), club: player.club, value: mine, text: goalBonus > 1 || title ? "la temporada más completa" : "una temporada de nivel", isPlayer: true });
  const { top: list, rank } = ranked(rows, true);
  return { kind: "mejor_liga", title: `Mejor jugador de ${lg.id === "es" ? "la Liga" : lg.name}`, top: list, rank, line: finishLine(rank, "mejor_liga"), won: rank === 1 };
}

function mvpChampions(player: Player, closed: number, st: SeasonStats): AwardResult | null {
  const euro = getEuropeanCompetitionFor(player.club);
  if (!euro || euro.competition !== "champions" || st.matches < 3) return null;
  const prog = getEuroProgress(player, closed);
  const champion = readTrofeos(player.flags).some((t) => t.k === "champions" && t.s === closed);
  if (prog.round < 2 && !champion) return null; // sin pasar de grupos no se entra en la lista
  const seed = `${player.id}:mvp_champions:${closed}`;
  const injTurns = num(player.flags?.[`inj_${closed}`]);
  const reached = champion ? 5 : prog.round;
  const mine = (player.media ?? 60) + (reached - 1) * 1.3 + (champion ? 2.5 : 0) + Math.min(2.5, (st.goals + st.assists * 0.6) * 0.15) - injTurns * 1.8 + jitter(`${seed}:yo`) * 3;
  const top = 90 + (hash(seed) % 4);
  const pool = euro.rivals.filter((c) => c !== player.club);
  const rows: Row[] = rivalNames(player, seed, 12, pool.length > 0 ? pool : leagueClubs(player)).map((r, i) => {
    const v = top - i * 0.9 + jitter(`${seed}:v:${i}`) * 2;
    return { name: r.name, club: r.club, value: v, text: i < 2 ? "protagonista de las noches europeas" : "gran Champions", isPlayer: false };
  });
  rows.push({ name: displayName(player), club: player.club, value: mine, text: champion ? "campeón de Europa" : "una gran Champions", isPlayer: true });
  const { top: list, rank } = ranked(rows, true);
  return { kind: "mvp_champions", title: "Mejor jugador de la Champions", top: list, rank, line: finishLine(rank, "mvp_champions"), won: rank === 1 };
}

const OUTCOME_POINTS: Record<string, number> = { campeon: 4.5, subcampeon: 3, bronce: 2.2, semifinal: 1.8, cuartos: 0.8, dieciseisavos: 0.2, octavos: 0.4, fase_de_grupos: 0 };

function mvpTorneo(player: Player, season: number): (AwardResult & { type: TorneoType }) | null {
  const types: TorneoType[] = ["mundial", "eurocopa", "copa_america", "olimpico"];
  for (const type of types) {
    const outcome = player.flags?.[`torneo_result_${type}_${season}`];
    if (typeof outcome !== "string" || !outcome) continue;
    const seed = `${player.id}:mvp_torneo:${type}:${season}`;
    let stars = 0;
    for (const [k, v] of Object.entries(player.flags ?? {})) {
      if (k.startsWith(`match_decision_${season * 10 + 1}_torneo.`) && (v === "goal" || v === "wondergoal" || v === "assist")) stars++;
    }
    const mine = (player.media ?? 60) + (OUTCOME_POINTS[outcome] ?? 0) + Math.min(3.5, stars * 0.9) + jitter(`${seed}:yo`) * 3 - (type === "olimpico" ? 3 : 0);
    const top = 91 + (hash(seed) % 4) - (type === "olimpico" ? 4 : 0);
    const nations = TORNEO_POOLS[type].filter((n) => n !== player.nation);
    const rows: Row[] = rivalNames(player, seed, 12, nations).map((r, i) => {
      const v = top - i * 0.9 + jitter(`${seed}:v:${i}`) * 2;
      return { name: r.name, club: r.club, value: v, text: i < 2 ? "figura del torneo" : "gran torneo", isPlayer: false };
    });
    rows.push({ name: displayName(player), club: player.nation, value: mine, text: outcome === "campeon" ? "campeón del torneo" : "un torneo destacado", isPlayer: true });
    const { top: list, rank } = ranked(rows, true);
    return { kind: "mvp_torneo", type, title: `Mejor jugador de ${torneoLabel(type, season)}`, top: list, rank, line: finishLine(rank, "mvp_torneo"), won: rank === 1 };
  }
  return null;
}

/** Todos los premios de la temporada que se cierra y que aplican a este jugador. */
export function computeSeasonAwards(player: Player): (AwardResult & { type?: TorneoType })[] {
  const closed = closedSeason(player);
  const st = seasonStats(player, closed);
  const season = closed + 1;
  const list: (AwardResult & { type?: TorneoType })[] = [];
  for (const r of [pichichi(player, closed, st), zamora(player, closed, st), mejorLiga(player, closed, st), mvpChampions(player, closed, st), mvpTorneo(player, season)]) {
    if (r) list.push(r);
  }
  return list;
}

const yearLabel = (closed: number) => `${2026 + closed}/${String(2027 + closed).slice(2)}`;

export function buildSeasonAwardsEvent(player: Player): GameEvent {
  const closed = closedSeason(player);
  const awards = computeSeasonAwards(player);
  const won = awards.filter((a) => a.won);
  const placed = awards.filter((a) => !a.won && a.rank <= 3);
  const sections = awards.map((a) => `${a.title.toUpperCase()}\n${fmtList(a.top.slice(0, a.rank <= 10 ? 10 : 5))}\n${a.rank > 10 ? `${a.line}\n` : ""}`).join("\n");
  const headline =
    won.length > 0
      ? `Esta temporada te llevas ${won.length === 1 ? "un premio" : `${won.length} premios`}: ${won.map((a) => SEASON_AWARD_NAMES[a.kind]).join(", ")}.`
      : placed.length > 0
        ? "No te llevas ningún premio, pero apareces en el podio de alguna lista."
        : "Esta vez los premios son para otros, pero tu nombre se ha mirado con atención.";
  const flags: Record<string, string | boolean> = { [`sa_done_${closed}`]: true };
  for (const a of won) flags[`award_won_${a.kind}`] = `${a.title}${a.type ? "" : ""} ${yearLabel(closed)}`;
  const n = won.length;
  const base = n > 0 ? { fama: 4 + n * 3, moral: 5 + n * 3, reputacion: 2 + n, rel_aficion: 2 + n } : placed.length > 0 ? { fama: 2, moral: 2 } : { moral: 0 };
  const first = won[0];
  return {
    id: seasonAwardsId(closed),
    category: "especial",
    title: `Premios de la temporada ${yearLabel(closed)}`,
    description: `Se cierra la temporada ${yearLabel(closed)} y llegan las listas de los premios. ${headline}\n\n${sections}`,
    options: [
      {
        id: "a",
        label: "Celebrarlo con los tuyos",
        subtitle: n > 0 ? "Un año para enmarcar" : "Brindar por lo conseguido",
        consequences: { ...base, flags },
        outcomeText: n > 0 ? `Lo celebras en casa, con la mesa llena y el trofeo en el centro. ${first ? `Lo de ${SEASON_AWARD_NAMES[first.kind]} te hace más ilusión de la que esperabas.` : ""} Tu madre guarda el recorte del periódico antes de que acabe la cena.` : "Lo celebras con los tuyos igualmente: un año completo ya es mucho. En la mesa se habla del próximo, con más hambre.",
      },
      {
        id: "b",
        label: n > 0 ? "Dedicárselo al vestuario" : "Tomártelo como combustible para la próxima",
        subtitle: n > 0 ? "Un gesto de equipo" : "Hambre de más",
        consequences: { ...base, rel_vestuario: n > 0 ? 3 : 1, moral: (base.moral ?? 0) + 1, flags },
        outcomeText: n > 0 ? "Subes una foto con tus compañeros: «Esto es de todos». El vestuario te lo agradece con un abrazo colectivo en el entrenamiento del lunes." : "Apuntas en una libreta lo que te ha faltado. Al lunes siguiente, eres el primero en llegar a la ciudad deportiva.",
      },
    ],
    ...(n > 0 ? { isMilestone: true, milestoneType: "premio", imageScene: "Photorealistic photo of a footballer in a dark suit holding an individual season award trophy at a gala, flashbulbs, elegant audience, proud smile, no logos or readable text" } : {}),
  };
}
