/**
 * Jugadas decisivas escritas a mano, en grande: cada una es una situación
 * concreta y tres opciones con su riesgo, su éxito y su fallo ya narrados y
 * etiquetados (gol, asistencia, parada, entrada limpia, penalti en contra...)
 * para que la crónica del partido cuente EXACTAMENTE lo que pasó en esa
 * jugada. Se combinan con aperturas y cierres variables (ver index.ts) para
 * que dos partidos seguidos no se parezcan.
 */
import type { Consequences, EventOption } from "@/types/career";

/** Función que anota el resultado de la jugada para la crónica (la define el motor). */
export type FlagsFn = (outcome: string, style: string) => Record<string, string | boolean>;

export interface NewDecision {
  text: string;
  options: (flags: FlagsFn) => EventOption[];
}

/** Resultados que entiende la crónica. */
export const G = "goal";
export const W = "wondergoal";
export const A = "assist";
export const M = "miss";
export const MB = "miss_bad";
export const S = "save";
export const C = "concede";
export const CT = "clean_tackle";
export const K = "contained";
export const B = "beaten";
export const F = "foul_committed";
export const P = "penalty_conceded";

/** [etiqueta, subtítulo, probabilidad de éxito, [texto éxito, resultado], [texto fallo, resultado], efecto extra si sale bien] */
export type Opt = [label: string, subtitle: string, chance: number, ok: [string, string], ko: [string, string], extra?: Consequences];

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 28);

export const dec = (text: string, opts: Opt[]): NewDecision => ({
  text,
  options: (flags) =>
    opts.map(([label, subtitle, chance, ok, ko, extra], i) => {
      const style = `${i}_${slug(label)}`;
      return {
        id: `${i}-${slug(label)}`,
        label,
        subtitle,
        consequences: {},
        resolve: {
          baseChance: chance,
          statModifier: "media" as const,
          success: { text: ok[0], consequences: { ...(extra ?? {}), flags: flags(ok[1], style) } },
          fail: { text: ko[0], consequences: { flags: flags(ko[1], style) } },
        },
      } as EventOption;
    }),
});
