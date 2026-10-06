/**
 * Los partidos que no se juegan como escena. Una temporada tiene ~40 partidos
 * reales pero solo 8-12 "clave" se viven como escena; el contador de
 * estadísticas solo veía esos, y la narración (que habla de "una temporada
 * completa") decía cosas como "4 partidos y 1 gol" que no cuadraban con lo
 * jugado ni con la clasificación del equipo (14 jornadas en diciembre).
 *
 * Aquí se estiman, al avanzar cada mes, las apariciones y los goles del resto
 * de partidos según tu rol, tu posición y tu media, repartidos por
 * competición (Liga, Champions/Europa, Copa). Quedan en
 * flags.sim_stats_<temporada> (JSON) y se suman a los totales de carrera, a la
 * tarjeta de temporada y a las tablas por competición: todo sale de la MISMA
 * cuenta, así que cabecera, tablas e historial siempre suman lo mismo.
 */
import type { Player } from "@/types/player";
import { computeRole } from "@/lib/narrative/role";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";
import { getEuropeanCompetitionFor } from "@/lib/calendar/match-calendar";

export interface SimStat {
  matches: number;
  goals: number;
  assists: number;
  minutes: number;
}

export type SimComp = "liga" | "champions" | "europa" | "copa";
export type SimByComp = Record<SimComp, SimStat>;

const emptyStat = (): SimStat => ({ matches: 0, goals: 0, assists: 0, minutes: 0 });
export const emptySim = (): SimByComp => ({ liga: emptyStat(), champions: emptyStat(), europa: emptyStat(), copa: emptyStat() });

export function sumSim(s: SimByComp): SimStat {
  return (Object.values(s) as SimStat[]).reduce(
    (n, x) => ({ matches: n.matches + x.matches, goals: n.goals + x.goals, assists: n.assists + x.assists, minutes: n.minutes + x.minutes }),
    emptyStat(),
  );
}

function addInto(target: SimByComp, source: SimByComp) {
  for (const k of Object.keys(target) as SimComp[]) {
    target[k].matches += source[k].matches;
    target[k].goals += source[k].goals;
    target[k].assists += source[k].assists;
    target[k].minutes += source[k].minutes;
  }
}

/** Partidos no clave por turno (un turno = un mes con ~4 partidos, uno de ellos es clave). */
const OFF_SCREEN_PER_TURN = 3;

const ROLE_SHARE: Record<string, { appear: number; minutes: number }> = {
  titular: { appear: 0.9, minutes: 84 },
  rotacion: { appear: 0.6, minutes: 58 },
  suplente: { appear: 0.3, minutes: 24 },
  apartado: { appear: 0, minutes: 0 },
};

function goalsPer90(position: string): number {
  const p = (position ?? "").toLowerCase();
  if (p.includes("delantero")) return 0.5;
  if (p.includes("centro")) return 0.12;
  if (p.includes("defensa")) return 0.04;
  return 0;
}

function poisson(lambda: number): number {
  const limit = Math.exp(-lambda);
  let n = 0;
  let prod = Math.random();
  while (prod > limit && n < 6) {
    n++;
    prod *= Math.random();
  }
  return n;
}

const weekInSeason = (week: number) => ((week - 1) % 10) + 1;

/** A qué competición pertenece un partido estimado de este mes. */
function pickCompetition(club: string, week: number): SimComp {
  const wis = weekInSeason(week);
  const euro = getEuropeanCompetitionFor(club);
  const r = Math.random();
  if (euro && wis >= 3 && r < 0.15) return euro.competition;
  if (wis >= 5 && r > 0.9) return "copa";
  return "liga";
}

/** Un solo turno (mes) en la semana `week`. */
function simulateTurn(player: Player, week: number, ignoreInjury: boolean): SimByComp {
  const out = emptySim();
  if (weekInSeason(week) < 2) return out; // la pretemporada no tiene competición
  if (!ignoreInjury && getInjuryRemaining(player.flags) > 0) return out;
  const share = ROLE_SHARE[computeRole(player).role] ?? ROLE_SHARE.rotacion;
  if (share.appear === 0) return out;

  const quality = Math.max(0.3, Math.min(1.6, ((player.media ?? 60) - 45) / 35));
  const per90 = goalsPer90(player.position) * quality;
  for (let i = 0; i < OFF_SCREEN_PER_TURN; i++) {
    if (Math.random() >= share.appear) continue;
    const c = out[pickCompetition(player.club, week)];
    c.matches += 1;
    c.minutes += share.minutes;
    c.goals += poisson((per90 * share.minutes) / 90);
    c.assists += poisson((per90 * 0.6 * share.minutes) / 90);
  }
  return out;
}

/** Los turnos que avanza el calendario al resolver una escena (de player.week a newWeek). */
export function simulateOffScreenMatches(player: Player, turnsAdvanced: number): SimByComp {
  const out = emptySim();
  for (let i = 0; i < turnsAdvanced; i++) addInto(out, simulateTurn(player, player.week + i, false));
  return out;
}

/**
 * Relleno de lo ya jugado antes de que existiera esta cuenta: por cada
 * temporada anterior (desde la primera con equipo, la 1) y los turnos ya
 * transcurridos de la actual. Se hace UNA vez (flags.sim_backfill) y devuelve
 * lo estimado por temporada.
 */
export function backfillOffScreen(player: Player): Map<number, SimByComp> {
  const out = new Map<number, SimByComp>();
  const current = Math.floor((player.week - 1) / 10);
  for (let s = 1; s <= current; s++) {
    const acc = emptySim();
    for (let t = 2; t <= 10; t++) {
      const week = s * 10 + t;
      if (week >= player.week) break;
      addInto(acc, simulateTurn(player, week, true));
    }
    out.set(s, acc);
  }
  return out;
}

type Flags = Record<string, string | boolean>;

/** Lee lo acumulado de una temporada (flags.sim_stats_<n>, JSON; el formato antiguo "m,g,a,min" cuenta como Liga). */
export function readSimSeason(flags: Flags | null | undefined, season: number): SimByComp {
  const raw = String(flags?.[`sim_stats_${season}`] ?? "");
  const out = emptySim();
  if (!raw) return out;
  try {
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw) as Partial<Record<SimComp, number[]>>;
      for (const k of Object.keys(out) as SimComp[]) {
        const [m, g, a, min] = parsed[k] ?? [];
        out[k] = { matches: m ?? 0, goals: g ?? 0, assists: a ?? 0, minutes: min ?? 0 };
      }
    } else {
      const [m, g, a, min] = raw.split(",").map((n) => parseInt(n, 10) || 0);
      out.liga = { matches: m ?? 0, goals: g ?? 0, assists: a ?? 0, minutes: min ?? 0 };
    }
  } catch {
    // flag corrupto: se ignora
  }
  return out;
}

/** Todas las temporadas con cuenta estimada. */
export function readAllSim(flags: Flags | null | undefined): Map<number, SimByComp> {
  const out = new Map<number, SimByComp>();
  for (const key of Object.keys(flags ?? {})) {
    const m = key.match(/^sim_stats_(\d+)$/);
    if (m) out.set(Number(m[1]), readSimSeason(flags, Number(m[1])));
  }
  return out;
}

export function addSimSeason(flags: Flags, season: number, add: SimByComp): Flags {
  const cur = readSimSeason(flags, season);
  addInto(cur, add);
  const enc = Object.fromEntries((Object.keys(cur) as SimComp[]).map((k) => [k, [cur[k].matches, cur[k].goals, cur[k].assists, cur[k].minutes]]));
  return { ...flags, [`sim_stats_${season}`]: JSON.stringify(enc) };
}
