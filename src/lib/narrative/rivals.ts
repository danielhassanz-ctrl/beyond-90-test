/**
 * El reparto de rivales de tu generación, estable durante toda la carrera:
 *  - 2 compañeros de tu edad en tu club que te hacen la competencia (cambian
 *    cuando cambias de club, como los compañeros de verdad);
 *  - 3 megacracks de tu quinta en otros clubes grandes, que van a la suya,
 *    dicen cosas de ti y se pican. Cambian de camiseta cada pocas temporadas.
 * Todo sale de semillas: mismo jugador, mismos rivales, sin guardar nada.
 */
import type { Player } from "@/types/player";
import { fictionalPlayerName } from "@/lib/narrative/npcs";
import { maxMediaForAge } from "@/lib/narrative/media-cap";

export interface Rival {
  key: "peer1" | "peer2" | "mega1" | "mega2" | "mega3";
  kind: "peer" | "mega";
  name: string;
  club: string;
  media: number;
  position: string;
}

const MEGA_CLUBS = [
  "Real Madrid",
  "FC Barcelona",
  "Manchester City",
  "Bayern Múnich",
  "Paris Saint-Germain",
  "Liverpool FC",
  "Inter de Milán",
  "Borussia Dortmund",
  "Juventus",
  "Atlético de Madrid",
];
const POSITIONS = ["Delantero", "Mediocentro", "Extremo", "Defensa central", "Mediapunta", "Lateral"];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0;
}
/** Entero estable en [lo, hi]. */
const between = (seed: string, lo: number, hi: number) => lo + (hash(seed) % (hi - lo + 1));

export function getRivals(player: Player): Rival[] {
  const season = Math.floor((player.week - 1) / 10);
  const cap = (fama: number) => maxMediaForAge(player.week, fama);
  const out: Rival[] = [];

  // Compañeros de tu edad: rinden cerca de ti, el primero juega donde tú.
  for (const [i, key] of (["peer1", "peer2"] as const).entries()) {
    const seed = `${player.id}:${player.club}:${key}`;
    const media = Math.max(52, Math.min(cap(60), Math.round((player.media ?? 60) + between(`${seed}:m`, -6, 3))));
    out.push({
      key,
      kind: "peer",
      name: fictionalPlayerName(seed, player.club, player.last_name),
      club: player.club,
      media,
      position: i === 0 ? player.position || "Delantero" : POSITIONS[hash(`${seed}:p`) % POSITIONS.length],
    });
  }

  // Megacracks: mejores que casi todos a su edad, en otros grandes (cambian cada 3 temporadas).
  const used = new Set<string>([player.club]);
  for (const key of ["mega1", "mega2", "mega3"] as const) {
    const seed = `${player.id}:${key}`;
    let idx = hash(`${seed}:club:${Math.floor(season / 3)}`) % MEGA_CLUBS.length;
    while (used.has(MEGA_CLUBS[idx])) idx = (idx + 1) % MEGA_CLUBS.length;
    used.add(MEGA_CLUBS[idx]);
    out.push({
      key,
      kind: "mega",
      name: fictionalPlayerName(seed, MEGA_CLUBS[idx], player.last_name),
      club: MEGA_CLUBS[idx],
      media: Math.min(97, cap(85) + between(`${seed}:m:${season}`, -2, 3)),
      position: POSITIONS[hash(`${seed}:p`) % POSITIONS.length],
    });
  }
  return out;
}
