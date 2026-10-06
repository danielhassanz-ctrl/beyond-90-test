/**
 * Los partidos que no se juegan como escena. Una temporada tiene ~40 partidos
 * reales pero solo 8-12 "clave" se viven como escena; el contador de
 * estadísticas solo veía esos, y la narración (que habla de "una temporada
 * completa") decía cosas como "4 partidos y 1 gol" que no cuadraban con lo
 * jugado. Aquí se estiman, al avanzar cada mes, las apariciones y los goles
 * del resto de partidos según tu rol, tu posición y tu media; se suman a los
 * totales de carrera y quedan en flags.sim_stats_<temporada> para la tarjeta
 * de temporada.
 */
import type { Player } from "@/types/player";
import { computeRole } from "@/lib/narrative/role";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";

export interface OffScreenStats {
  matches: number;
  goals: number;
  assists: number;
  minutes: number;
}

const ZERO: OffScreenStats = { matches: 0, goals: 0, assists: 0, minutes: 0 };

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

/** Semana dentro de la temporada: la pretemporada (turno 1) no tiene partidos de competición. */
function inCompetitionMonth(week: number): boolean {
  return ((week - 1) % 10) + 1 >= 2;
}

export function simulateOffScreenMatches(player: Player, turnsAdvanced: number): OffScreenStats {
  if (turnsAdvanced <= 0 || !inCompetitionMonth(player.week)) return ZERO;
  if (getInjuryRemaining(player.flags) > 0) return ZERO;
  const share = ROLE_SHARE[computeRole(player).role] ?? ROLE_SHARE.rotacion;
  const slots = Math.round(OFF_SCREEN_PER_TURN * turnsAdvanced);
  let appearances = 0;
  for (let i = 0; i < slots; i++) if (Math.random() < share.appear) appearances++;
  if (appearances === 0) return ZERO;

  const quality = Math.max(0.3, Math.min(1.6, ((player.media ?? 60) - 45) / 35));
  const per90 = goalsPer90(player.position) * quality;
  let goals = 0;
  let assists = 0;
  for (let i = 0; i < appearances; i++) {
    const minutes = share.minutes;
    goals += poisson((per90 * minutes) / 90);
    assists += poisson((per90 * 0.6 * minutes) / 90);
  }
  return { matches: appearances, goals, assists, minutes: appearances * share.minutes };
}

/** Lee lo acumulado de una temporada (flags.sim_stats_<n> = "partidos,goles,asistencias,minutos"). */
export function readSimSeasonStats(
  flags: Record<string, string | boolean> | null | undefined,
  season: number,
): OffScreenStats {
  const raw = String(flags?.[`sim_stats_${season}`] ?? "");
  const [matches, goals, assists, minutes] = raw.split(",").map((n) => parseInt(n, 10) || 0);
  return { matches: matches ?? 0, goals: goals ?? 0, assists: assists ?? 0, minutes: minutes ?? 0 };
}

export function addSimSeasonStats(
  flags: Record<string, string | boolean>,
  season: number,
  add: OffScreenStats,
): Record<string, string | boolean> {
  const cur = readSimSeasonStats(flags, season);
  return {
    ...flags,
    [`sim_stats_${season}`]: [cur.matches + add.matches, cur.goals + add.goals, cur.assists + add.assists, cur.minutes + add.minutes].join(","),
  };
}
