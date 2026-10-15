/** Prueba sin IA: atributos visibles por demarcación, plan de entrenamiento que los mejora de verdad y envejecimiento. */
import { getAttributes, posGroup, trainableFor, trainedKey, MAX_TRAINED } from "../src/lib/narrative/attributes";
import { shouldTriggerTrainingPlan, buildTrainingPlanEvent, trainingPlanId } from "../src/lib/narrative/training-plan";
import { goalsEventId } from "../src/lib/narrative/season-goals";
import { resolveOption } from "../src/lib/narrative/engine";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

const mk = (o: any = {}): any => ({
  id: "p1", last_name: "Hassan", nickname: null, club: "Real Madrid", nation: "España", position: "Delantero", personality: "Trabajador, Rebelde", week: 62, media: 85, fama: 80, forma: 75, moral: 70,
  status: "active", mode: "pro", flags: {}, ...o,
});
const val = (attrs: any[], k: string) => attrs.find((a) => a.key === k)!.value;

console.log("1) Atributos por demarcación");
const fw = getAttributes(mk());
ok(fw.length === 6 && fw.map((a) => a.key).join() === "ritmo,tiro,pase,regate,defensa,fisico", "un delantero ve ritmo, tiro, pase, regate, defensa y físico");
ok(val(fw, "tiro") > val(fw, "defensa") + 10, `un delantero tira mucho mejor de lo que defiende (${val(fw, "tiro")} frente a ${val(fw, "defensa")})`);
const df = getAttributes(mk({ position: "Defensa" }));
ok(val(df, "defensa") > val(df, "tiro") + 15, "un defensa es justo al revés");
const mf = getAttributes(mk({ position: "Centrocampista" }));
ok(val(mf, "pase") >= val(mf, "tiro") + 7, "un centrocampista destaca en el pase");
const gk = getAttributes(mk({ position: "Portero" }));
ok(gk.map((a) => a.key).join() === "reflejos,estirada,saque,salidas,colocacion,fisico" && gk.some((a) => a.label === "Reflejos"), "un portero ve reflejos, estirada, saque, salidas, colocación y físico");
ok(posGroup("Extremo derecho") === "extremo" && posGroup("Lateral izquierdo") === "defensa", "las demarcaciones se agrupan bien");

console.log("2) Los atributos explican la media");
for (const media of [60, 75, 90]) {
  const a = getAttributes(mk({ media }));
  const avg = a.reduce((n, x) => n + x.value, 0) / a.length;
  ok(Math.abs(avg - media) <= 4, `con media ${media}, el promedio de atributos es ${avg.toFixed(1)}`);
}
ok(JSON.stringify(getAttributes(mk())) === JSON.stringify(getAttributes(mk())), "son estables (no cambian al recargar)");

console.log("3) Entrenar mejora; el tope existe");
const base = val(getAttributes(mk()), "ritmo");
const trained = val(getAttributes(mk({ flags: { [trainedKey("ritmo")]: "4" } })), "ritmo");
ok(trained === base + 4, `4 puntos entrenados suben el ritmo de ${base} a ${trained}`);
const low = val(getAttributes(mk({ media: 60 })), "ritmo");
ok(val(getAttributes(mk({ media: 60, flags: { [trainedKey("ritmo")]: "99" } })), "ritmo") === low + MAX_TRAINED, `el entrenamiento tiene tope (+${MAX_TRAINED})`);

console.log("4) Con los años se pierde");
const young = val(getAttributes(mk({ week: 61 })), "ritmo"), old = val(getAttributes(mk({ week: 161 })), "ritmo");
ok(old < young - 8, `el ritmo cae con la edad (a los 22: ${young}; a los 32: ${old})`);
const oldFis = val(getAttributes(mk({ week: 161 })), "fisico"), youngFis = val(getAttributes(mk({ week: 61 })), "fisico");
ok(oldFis < youngFis - 4 && val(getAttributes(mk({ week: 161 })), "pase") > old, "el físico también, pero el pase se conserva mejor que el ritmo");

console.log("5) Cuándo sale el plan");
ok(shouldTriggerTrainingPlan(mk(), [`preseason-6`, goalsEventId(6)]), "tras el resumen y los objetivos, sale");
ok(shouldTriggerTrainingPlan(mk({ week: 64 }), [`preseason-6`]), "si no hubo objetivos, sale a partir del turno 4");
ok(!shouldTriggerTrainingPlan(mk(), []), "no antes del cierre de temporada");
ok(!shouldTriggerTrainingPlan(mk(), [`preseason-6`, goalsEventId(6), trainingPlanId(6)]), "una vez por temporada");
ok(!shouldTriggerTrainingPlan(mk({ flags: { tp_6: true } }), [`preseason-6`, goalsEventId(6)]), "si ya lo elegiste, no");

console.log("6) La escena y sus opciones");
const ev = buildTrainingPlanEvent(mk());
ok(!bad(ev) && ev.options.length === 4 && ev.options.map((o) => o.id).join() === "a,b,c,d", "cuatro caminos: punto débil, punto fuerte, intensivo y mantenimiento");
const a = ev.options.find((o) => o.id === "a")!;
const focus = String(a.consequences.flags!.tp_foco);
ok(trainableFor(mk()).some((t) => t.key === focus), `el primer plan trabaja un atributo real (${focus})`);
ok(Number(a.consequences.flags![trainedKey(focus as any)]) === 4, "el punto débil gana +4");
const b = ev.options.find((o) => o.id === "b")!;
ok(Number(b.consequences.flags![trainedKey(String(b.consequences.flags!.tp_foco) as any)]) >= 3 && b.consequences.flags!.tp_foco !== focus, "el punto fuerte gana +3 en otro atributo");
const d = ev.options.find((o) => o.id === "d")!;
ok((d.consequences.forma ?? 0) > 0 && !Object.keys(d.consequences.flags!).some((k) => k.startsWith("tr_")), "el año de mantenimiento da forma y no entrena nada");
let ok1 = 0, ko1 = 0, badInt = 0;
for (let i = 0; i < 300; i++) {
  const e = buildTrainingPlanEvent(mk({ id: `p${i}` }));
  const r = resolveOption(e.options.find((o) => o.id === "c")!, mk())!;
  const f = r.consequences.flags!;
  if (r.success) { ok1++; if (!(Object.keys(f).filter((k) => k.startsWith("tr_")).length >= 1) || (r.consequences.media ?? 0) !== 1) badInt++; } else { ko1++; if (!f.estado_bache || (r.consequences.forma ?? 0) >= 0) badInt++; }
}
ok(badInt === 0 && ok1 > 100 && ko1 > 40, `el plan intensivo sale bien (${ok1}) o provoca una sobrecarga con bache de forma (${ko1})`);
const capped = buildTrainingPlanEvent(mk({ flags: { [trainedKey("ritmo")]: String(MAX_TRAINED), [trainedKey("tiro")]: String(MAX_TRAINED) } }));
ok(!bad(capped) && capped.options.every((o) => Object.entries(o.consequences.flags ?? {}).every(([k, v]) => !k.startsWith("tr_") || Number(v) <= MAX_TRAINED)), "nunca se pasa del tope aunque ya estés al máximo en algo");
const keeper = buildTrainingPlanEvent(mk({ position: "Portero" }));
ok(!bad(keeper) && /reflejos|estirada|saque|salidas|colocación/i.test(keeper.options[0].label + keeper.description), "un portero trabaja atributos de portero");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
