/**
 * Revisión lógica del banco de escenas (sin IA): títulos repetidos, opciones inertes,
 * consecuencias desproporcionadas, banderas que nadie lee y cadenas a corto/medio/largo plazo.
 */
import { BANK_SCENES } from "../src/lib/narrative/bank/scenes";

const scenes = BANK_SCENES as any[];
const titles = new Map<string, string[]>();
for (const s of scenes) titles.set(s.event.title, [...(titles.get(s.event.title) ?? []), s.id]);
const dupTitles = [...titles.entries()].filter(([, ids]) => ids.length > 1);

const setFlags = new Map<string, number>();
const readFlags = new Set<string>();
let inert = 0;
let options = 0;
const big: string[] = [];
const STAT = ["forma", "moral", "fama", "media", "rel_entrenador", "rel_vestuario", "rel_aficion", "rel_representante", "reputacion"];
for (const s of scenes) {
  for (const f of s.when.flags ?? []) readFlags.add(f);
  for (const f of s.when.notFlags ?? []) readFlags.add(f);
  for (const o of s.event.options) {
    options++;
    const cs = [o.consequences, o.resolve?.success?.consequences, o.resolve?.fail?.consequences].filter(Boolean);
    let marked = false;
    for (const c of cs) {
      for (const k of Object.keys(c.flags ?? {})) {
        setFlags.set(k, (setFlags.get(k) ?? 0) + 1);
        marked = true;
      }
      const sum = STAT.reduce((n, k) => n + Math.max(0, c[k] ?? 0), 0);
      if (sum > 22) big.push(`${s.id}/${o.id}: +${sum}`);
    }
    const hasEffect = cs.some((c) => STAT.some((k) => (c[k] ?? 0) !== 0) || (c.patrimonio ?? 0) !== 0);
    if (!hasEffect && !marked) { inert++; console.log("INERTE", s.id, o.id); }
  }
}
const chainTargets = new Set<string>();
for (const s of scenes) for (const a of s.when.after ?? []) chainTargets.add(a.scene);
const dead = [...setFlags.keys()].filter((f) => !readFlags.has(f) && !f.startsWith("bk_"));
const chained = scenes.filter((s) => (s.when.after ?? []).length > 0);
const long = chained.filter((s) => (s.when.after ?? []).some((a: any) => (a.minGap ?? 0) >= 20));
const mid = chained.filter((s) => (s.when.after ?? []).some((a: any) => (a.minGap ?? 0) >= 6 && (a.minGap ?? 0) < 20));
const short = chained.filter((s) => (s.when.after ?? []).every((a: any) => (a.minGap ?? 0) < 6));
console.log(`ESCENAS ${scenes.length} · OPCIONES ${options} · inertes ${inert}`);
console.log(`CADENAS ${chained.length}: corto plazo ${short.length} · medio ${mid.length} · largo (≥20 turnos) ${long.length}`);
console.log(`Escenas que abren cadena: ${chainTargets.size}`);
console.log(`BANDERAS puestas ${setFlags.size} · leídas por alguna escena ${setFlags.size - dead.length}`);
console.log(`Títulos repetidos: ${dupTitles.length}`, dupTitles.slice(0, 5));
console.log(`Opciones con subidas >22 en una sola decisión: ${big.length}`, big.slice(0, 8));
