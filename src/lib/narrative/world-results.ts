/**
 * Lo que pasa en el resto del mundo del fútbol, decidido en código y estable para cada partida: quién gana la
 * Champions cuando no eres tú, y quién gana un Mundial, una Eurocopa o una Copa América cuando tu selección cae.
 * Sirve para que los premios (Golden Boy, Balón de Oro) tengan finalistas de los equipos que de verdad han ganado, y
 * para la escena de la final que ves desde casa cuando te eliminan.
 */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { readTrofeos } from "@/lib/honours";
import { TORNEO_NAMES, TORNEO_POOLS, nationTier, torneoYear, type TorneoType } from "@/lib/narrative/torneo";

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

/** Clubes con más opciones de ganar la Champions, con su peso. */
export const CLUB_WEIGHTS: [string, number][] = [
  ["Real Madrid", 3], ["FC Barcelona", 2.6], ["Manchester City", 3], ["Bayern de Múnich", 3], ["Paris Saint-Germain", 2.2], ["Liverpool FC", 2.4], ["Arsenal", 2],
  ["Inter de Milán", 2], ["Juventus", 1.4], ["Atlético de Madrid", 1.4], ["Borussia Dortmund", 1.3], ["Chelsea", 1.4], ["AC Milan", 1.3], ["SSC Nápoles", 1],
  ["Bayer Leverkusen", 1], ["Manchester United", 1], ["Tottenham Hotspur", 0.9], ["Benfica", 0.5], ["Ajax", 0.3], ["Sporting CP", 0.3], ["AS Roma", 0.5], ["Newcastle United", 0.5],
];

/** Elige sin repetir, por peso, de forma estable según la semilla. */
export function weightedPick(seed: string, items: [string, number][], exclude: Set<string> = new Set()): string {
  const pool = items.filter(([c]) => !exclude.has(c));
  const total = pool.reduce((n, [, w]) => n + w, 0);
  let r = ((hash(seed) % 100000) / 100000) * total;
  for (const [c, w] of pool) {
    r -= w;
    if (r <= 0) return c;
  }
  return pool[pool.length - 1][0];
}

/** Ganador y finalista de la Champions de la temporada `s`: si la ganaste tú, tu club de entonces. */
export function championsPodium(player: Pick<Player, "id" | "flags">, s: number): { winner: string; runnerUp: string; byPlayer: boolean } {
  const mine = readTrofeos(player.flags).find((t) => t.k === "champions" && t.s === s);
  const winner = mine?.c ?? weightedPick(`${player.id}:cl:${s}:w`, CLUB_WEIGHTS);
  const runnerUp = weightedPick(`${player.id}:cl:${s}:r`, CLUB_WEIGHTS, new Set([winner]));
  return { winner, runnerUp, byPlayer: Boolean(mine) };
}

/** Final de un torneo de selecciones: quién gana y contra quién, para cuando tu selección ya no está. */
export function tournamentFinal(player: Pick<Player, "id" | "nation">, type: TorneoType, season: number): { winner: string; runnerUp: string; score: string } {
  const weights: [string, number][] = TORNEO_POOLS[type].filter((n) => n !== player.nation).map((n) => [n, nationTier(n) ** 2]);
  const winner = weightedPick(`${player.id}:${type}:${season}:final:w`, weights);
  const runnerUp = weightedPick(`${player.id}:${type}:${season}:final:r`, weights, new Set([winner]));
  const scores = ["1-0", "2-1", "2-0", "3-1", "1-1 (4-3 en penaltis)", "0-0 (5-4 en penaltis)", "3-2", "2-2 (5-3 en penaltis)"];
  return { winner, runnerUp, score: scores[hash(`${player.id}:${type}:${season}:final:s`) % scores.length] };
}

const OUTCOME_FROM: Record<string, string> = {
  fase_de_grupos: "Te quedaste en la fase de grupos y la final te pilla ya en casa, con la maleta deshecha",
  octavos: "Caíste en octavos y has seguido el torneo desde el sofá",
  cuartos: "Caíste en cuartos, y desde entonces ver los partidos duele de una manera muy concreta",
  semifinal: "Te quedaste a un paso de la final, y verla desde fuera es una cosa rara entre la rabia y la curiosidad",
};

/** La final de un torneo de selecciones, vista desde casa tras caer eliminado (outcome del torneo del jugador). */
export function buildTorneoFinalEvent(player: Player, type: TorneoType, season: number, outcome: string): GameEvent {
  const name = `${TORNEO_NAMES[type]} ${torneoYear(season)}`;
  const f = tournamentFinal(player, type, season);
  const lead = OUTCOME_FROM[outcome] ?? "Ya no estás en el torneo";
  const pens = /penaltis/.test(f.score);
  return {
    id: `torneo-final-${type}-${season}`,
    category: "especial",
    title: `La final del ${name}, desde casa`,
    description: `${lead}. Esta noche es la final: ${f.winner} y ${f.runnerUp}. ${f.winner} acaba levantando el trofeo (${f.score}${pens ? "" : ""}). En la tele sacan imágenes de ellos celebrando y, por un segundo, la cámara pasa por un banquillo vacío que podía ser el tuyo.`,
    options: [
      {
        id: "a",
        label: "Verla con tus amigos y tu familia, con el bocadillo de siempre",
        subtitle: "Compartir la pena",
        consequences: { moral: 4, fama: 0 },
        outcomeText: `Gritáis, os lamentáis, os reís de algún fallo del portero. Cuando ${f.winner} levanta la copa, tu padre dice con la boca llena: «Vosotros habríais jugado mejor». No es verdad, pero se agradece.`,
      },
      {
        id: "b",
        label: "Verla solo, tomando nota de todo lo que habrías hecho distinto",
        subtitle: "Aprender de los mejores",
        consequences: { moral: -1, media: 0, forma: 2 },
        outcomeText: `Ves la final con la libreta de siempre. Apuntas tres jugadas de ${f.winner} que te quedan en la cabeza. La próxima vez, piensas, no me van a ganar en eso.`,
      },
      {
        id: "c",
        label: "No verla: apagar la tele y salir a correr",
        subtitle: "Pasar página",
        consequences: { forma: 3, moral: 1 },
        outcomeText: `Sales a correr con el móvil en silencio. Cuando vuelves, ya hay campeón: ${f.winner}. Te enteras por un mensaje de tu agente: «Vaya final». Y tú, sudado y sin aliento, te ríes sin saber muy bien por qué.`,
      },
    ],
  };
}
