/**
 * DILEMAS DE VERDAD. En 222 de las 795 escenas del banco una opción (casi siempre la amable, la sensata) era mejor que las demás en TODAS las barras:
 * no había nada que decidir. Aquí se les da un contrapeso mínimo y automático: a las otras opciones, un respiro (más forma o más ánimo: la
 * comodidad de no complicarse, el tiempo para ti) justo por encima de lo que da la opción dominante en esa barra. No toca los textos ni las
 * consecuencias grandes: solo hace que elegir tenga un precio, que es lo que pide el principio «emocionante».
 */
import type { EventOption } from "@/types/career";
import type { BankScene } from "./types";

const KEYS = ["moral", "fama", "reputacion", "rel_entrenador", "rel_vestuario", "rel_aficion", "rel_representante", "forma", "media", "patrimonio"] as const;
type Vec = Record<(typeof KEYS)[number], number>;

type Cons = Record<string, unknown> & { flags?: unknown };

const asCons = (c: unknown): Cons => (c ?? {}) as Cons;

const vecOf = (o: EventOption): Vec => {
  const v = {} as Vec;
  const p = o.resolve ? o.resolve.baseChance : 1;
  const win = asCons(o.resolve ? o.resolve.success.consequences : o.consequences);
  const lose = asCons(o.resolve ? o.resolve.fail.consequences : {});
  for (const k of KEYS) {
    const a = Number(win[k] ?? 0) || 0;
    const b = Number(lose[k] ?? 0) || 0;
    const e = a * p + b * (1 - p);
    // El dinero se compara en escala logarítmica (3.000 € no pesan como 3 puntos de moral).
    v[k] = k === "patrimonio" ? (Math.sign(e) * Math.log10(1 + Math.abs(e))) / 2 : e;
  }
  return v;
};

const dominates = (a: Vec, b: Vec) => KEYS.every((k) => a[k] >= b[k]) && KEYS.some((k) => a[k] > b[k]);

function perkFor(options: BankScene["event"]["options"], winner: number, index: number): { stat: "forma" | "moral"; amount: number } {
  const w = vecOf(options[winner]);
  const mine = vecOf(options[index]);
  // Se elige la barra donde la opción dominante da menos (el respiro más barato) y se supera lo que da ella.
  const stat: "forma" | "moral" = w.forma <= w.moral ? "forma" : "moral";
  return { stat, amount: Math.max(1, Math.ceil(w[stat] - mine[stat]) + 1) };
}

export function balanceDilemmas(scenes: BankScene[]): BankScene[] {
  return scenes.map((scene) => {
    const opts = scene.event.options;
    if (opts.length < 2 || scene.event.dm) return scene;
    const vs = opts.map(vecOf);
    const winner = vs.findIndex((v, i) => vs.every((w, j) => i === j || dominates(v, w)));
    if (winner < 0) return scene;
    const options = opts.map((o, i) => {
      if (i === winner) return o;
      const { stat, amount } = perkFor(opts, winner, i);
      const bump = (c: unknown): Cons => ({ ...asCons(c), [stat]: (Number(asCons(c)[stat] ?? 0) || 0) + amount });
      if (o.resolve) {
        return { ...o, resolve: { ...o.resolve, success: { ...o.resolve.success, consequences: bump(o.resolve.success.consequences) }, fail: { ...o.resolve.fail, consequences: bump(o.resolve.fail.consequences) } } } as typeof o;
      }
      return { ...o, consequences: bump(o.consequences) } as typeof o;
    });
    return { ...scene, event: { ...scene.event, options } };
  });
}
