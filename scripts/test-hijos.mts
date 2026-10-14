/** Prueba sin IA: los hijos llegan a partir de los 27-29, con ritmo propio por carrera (cada 2-3 temporadas, 1-4 en total, algunos mellizos). */
import { childPlan, childStage, buildChildEvent, readChildren, childCount, firstChildPatch } from "../src/lib/narrative/children";
import { playerAge } from "../src/types/career";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

console.log("1) El ritmo cambia de una carrera a otra");
const plans = Array.from({ length: 200 }, (_, i) => childPlan(`player-${i}`));
ok(plans.every((p) => p.startAge >= 27 && p.startAge <= 29 && p.total >= 1 && p.total <= 4 && p.gaps.every((g) => g >= 20 && g <= 30)), "primer hijo a los 27-29, de 1 a 4 en total, huecos de 20-30 turnos (2-3 temporadas)");
const totals = new Set(plans.map((p) => p.total));
ok(totals.size === 4, `salen carreras con 1, 2, 3 y 4 hijos (${[...totals].sort().join(", ")})`);

console.log("2) Simulación de carreras completas");
const mk = (id: string, week: number, flags: any): any => ({ id, last_name: "Hassan", club: "Real Madrid", week, status: "active", media: 88, fama: 90, moral: 70, forma: 80, position: "Delantero", nation: "España", flags: { pareja: "Marta Vidal", pareja_rel: "80", pareja_rel_de: "Marta Vidal", club_since: "20", ...flags } });
const resumen: number[] = [];
let primerEdad = 99, gapMin = 999, mellizos = 0, rotos = 0;
for (let c = 0; c < 120; c++) {
  const id = `carrera-${c}`;
  let flags: any = {};
  const births: number[] = [];
  for (let week = 100; week < 260; week++) {
    const p = mk(id, week, flags);
    const stage = childStage(p);
    if (!stage) continue;
    const ev = buildChildEvent(p, stage);
    if (/undefined|NaN|\[object/.test(JSON.stringify(ev))) rotos++;
    const f = ev.options[0].consequences.flags as any;
    flags = { ...flags, ...f };
    if (stage === "embarazo") continue;
    births.push(week);
    if (readChildren(flags).length - readChildren(mk(id, week, flags).flags).length === 0 && childCount(flags) > births.length) mellizos++;
    primerEdad = Math.min(primerEdad, playerAge(births[0]));
  }
  for (let i = 1; i < births.length; i++) gapMin = Math.min(gapMin, births[i] - births[i - 1]);
  resumen.push(childCount(flags));
}
ok(rotos === 0, "ningún embarazo ni nacimiento sale con textos rotos");
ok(primerEdad >= 27, `el primer hijo nunca llega antes de los 27 (el más temprano: ${primerEdad})`);
ok(gapMin >= 20, `entre hijos pasan al menos 20 turnos / 2 temporadas (el mínimo visto: ${gapMin})`);
const dist = [0, 1, 2, 3, 4].map((n) => resumen.filter((x) => x === n).length);
ok(dist[0] > 0 || dist[1] > 0, `reparto de hijos por carrera (0/1/2/3/4+): ${dist.join(" / ")}`);
ok(dist.filter((x) => x > 0).length >= 3, "no todas las carreras acaban igual: salen al menos tres totales distintos");
ok(resumen.every((x) => x <= 5), "nunca más de 4-5 hijos (con mellizos)");

console.log("3) Sin pareja o con la relación rota, no hay hijos");
ok(childStage(mk("x", 130, { pareja: "" })) === null, "sin pareja, no");
ok(childStage(mk("x", 130, { pareja_rel: "30", pareja_rel_de: "Marta Vidal" })) === null, "con la relación fría, no");
ok(childStage(mk("x", 80, {})) === null, "antes de los 27, no");

console.log("4) El primer hijo del banco registra nombre y fecha");
const fp = firstChildPatch({ id: "p-1", week: 120, flags: {} } as any);
ok(JSON.parse(fp.hijos_info as string)[0].w === 120 && fp.hijos_n === "1" && fp.hijo_last_week === "120", `se anota: ${fp.hijos_info}`);
ok(Object.keys(firstChildPatch({ id: "p-1", week: 140, flags: { hijos: true, hijos_n: "1", hijos_info: fp.hijos_info } } as any)).length === 0, "no se duplica");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
