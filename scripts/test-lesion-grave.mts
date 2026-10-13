/** Prueba sin IA: la lesión grave es una historia (diagnóstico, rehabilitación, alta, secuelas) y cada decisión cambia la baja, el dinero y el riesgo. */
import {
  injuryChance, shouldTriggerSeriousInjury, buildSeriousInjuryEvent, sagaStage, shouldTriggerSagaStage, buildSagaStageEvent, KINDS, SAGA_KEY,
} from "../src/lib/narrative/injury-saga";
import { getInjuryRemaining, tickInjury } from "../src/lib/narrative/career-dynamics";
import { shouldTriggerPhysioScene } from "../src/lib/narrative/injury-events";
import { STATES } from "../src/lib/narrative/states";
import { resolveOption } from "../src/lib/narrative/engine";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const mk = (week = 100, o: any = {}): any => ({
  id: "t", last_name: "Hassan", club: "Real Madrid", position: "Delantero", week, media: 80, fama: 60, forma: 70, moral: 70, patrimonio: 600000,
  rel_entrenador: 55, rel_vestuario: 55, rel_aficion: 55, reputacion: 55, status: "active", mode: "pro", flags: { club_since: "40" }, ...o,
});
const apply = (p: any, c: any) => {
  p.patrimonio += c.patrimonio ?? 0; p.media += c.media ?? 0; p.moral += c.moral ?? 0; p.forma += c.forma ?? 0;
  for (const [k, v] of Object.entries(c.flags ?? {})) p.flags[k] = v;
};
const turn = (p: any) => { // un turno: baja que avanza y semana que pasa
  const t = tickInjury(p.flags);
  if (t) { if (t.newValue === null) delete p.flags[t.flagKey]; else p.flags[t.flagKey] = t.newValue; }
  p.week += 1;
};
const clean = (e: any) => !/undefined|NaN|\[object/.test(JSON.stringify(e));
const opt = (e: any, id: string) => e.options.find((o: any) => o.id === id);
const pick = (kindRng: number) => () => kindRng; // sorteo fijo del tipo de lesión

console.log("1) Cuándo se lesiona");
ok(injuryChance(mk(150)) > injuryChance(mk(80)), "con más edad, más probabilidad");
ok(injuryChance(mk(100, { forma: 40 })) > injuryChance(mk(100)), "cansado, más probabilidad");
ok(injuryChance(mk(100, { flags: { secuela_rodilla: "50" } })) > injuryChance(mk(100)), "con una secuela previa, más probabilidad");
ok(!shouldTriggerSeriousInjury(mk(20), () => 0), "no antes de la semana 25");
ok(!shouldTriggerSeriousInjury(mk(100, { flags: { injury_duration_x: "2" } }), () => 0), "no si ya estás lesionado");
ok(!shouldTriggerSeriousInjury(mk(100, { flags: { lg_last: "90" } }), () => 0), "no dentro del enfriamiento de 30 turnos");
ok(shouldTriggerSeriousInjury(mk(100), () => 0) && !shouldTriggerSeriousInjury(mk(100), () => 0.999), "depende del sorteo");

console.log("2) Diagnóstico: cada tipo con su baja");
for (const [r, kind] of [[0, "cruzado"], [0.31, "menisco"], [0.56, "fractura"], [0.72, "pubalgia"], [0.9, "aquiles"]] as const) {
  const e: any = buildSeriousInjuryEvent(mk(150), pick(r));
  const a = opt(e, "a");
  ok(clean(e) && a.consequences.flags.lg_kind === kind && a.consequences.flags[SAGA_KEY] === String(KINDS[kind].months), `${kind}: "${e.title}" · baja ${a.consequences.flags[SAGA_KEY]} turnos`);
}
let e: any = buildSeriousInjuryEvent(mk(100), pick(0));
ok(e.isMilestone === true && !!e.imageScene && e.priority, "el diagnóstico es un hito compartible");
ok(e.options.length === 3 && !!opt(e, "b") && !!opt(e, "c"), "tres caminos: operar, segunda opinión, conservador");
ok(!opt(buildSeriousInjuryEvent(mk(100, { patrimonio: 5000 }), pick(0)), "b"), "sin dinero no hay segunda opinión");

console.log("3) Las tiradas del diagnóstico");
let bOk = 0, bKo = 0, cOk = 0, cKo = 0, bad = 0;
for (let i = 0; i < 300; i++) {
  const p = mk(100); const ev: any = buildSeriousInjuryEvent(p, pick(0));
  const rb = resolveOption(opt(ev, "b"), p)!; const before = p.patrimonio; apply(p, rb.consequences);
  if (!(p.patrimonio < before)) bad++;
  if (rb.success) { bOk++; if (p.flags[SAGA_KEY] !== "6" || p.flags.lg_calidad !== "alta") bad++; } else { bKo++; if (p.flags[SAGA_KEY] !== "7") bad++; }
  const q = mk(100); const ev2: any = buildSeriousInjuryEvent(q, pick(0));
  const rc = resolveOption(opt(ev2, "c"), q)!; apply(q, rc.consequences);
  if (rc.success) { cOk++; if (Number(q.flags[SAGA_KEY]) >= 7) bad++; } else { cKo++; if (q.flags[SAGA_KEY] !== "9") bad++; }
}
ok(bad === 0, "segunda opinión: cobra siempre; sale 6 meses (con calidad alta) o 7; conservador: acorta o suma 2 meses");
ok(bOk > 150 && cOk < 120 && cKo > 150, `éxito de la segunda opinión ${bOk}/300 · del conservador en un cruzado ${cOk}/300`);

console.log("4) Historia completa: operar, rehabilitación, alta");
const p = mk(100); e = buildSeriousInjuryEvent(p, pick(0)); apply(p, opt(e, "a").consequences);
ok(getInjuryRemaining(p.flags) === 7 && p.flags.lg_stage === "1", "baja de 7 turnos y fase 1");
ok(!shouldTriggerPhysioScene(p), "el fisio de siempre no se mete en una lesión grave");
let sawRehab = false, rehabAt = 0;
for (let i = 0; i < 12 && getInjuryRemaining(p.flags) > 0; i++) {
  turn(p);
  if (!sawRehab && shouldTriggerSagaStage(p)) { sawRehab = true; rehabAt = getInjuryRemaining(p.flags); break; }
}
ok(sawRehab && rehabAt <= 4 && rehabAt >= 2, `a mitad de la rehabilitación (quedan ${rehabAt} turnos) sale la escena`);
const rehab: any = buildSagaStageEvent(p);
ok(clean(rehab) && rehab.options.length === 4, `cuatro opciones: ${rehab.options.map((o: any) => o.id).join(",")}`);
const left0 = getInjuryRemaining(p.flags); const risk0 = Number(p.flags.lg_riesgo);
const clinic = { ...p, flags: { ...p.flags } }; apply(clinic, opt(rehab, "b").consequences);
ok(getInjuryRemaining(clinic.flags) === left0 - 1 && Number(clinic.flags.lg_riesgo) < risk0 && clinic.patrimonio < p.patrimonio, "clínica privada: un mes menos, menos riesgo y cuesta dinero");
const psico = { ...p, flags: { ...p.flags } }; apply(psico, opt(rehab, "d").consequences);
ok(psico.flags.lg_psico === "1" && Number(psico.flags.lg_riesgo) < risk0, "psicólogo: baja el riesgo de secuelas");
let relapse = 0, fast = 0;
for (let i = 0; i < 300; i++) {
  const q: any = { ...p, flags: { ...p.flags } }; const rr = resolveOption(opt(rehab, "c"), q)!; apply(q, rr.consequences);
  if (rr.success) { if (getInjuryRemaining(q.flags) < left0) fast++; } else if (getInjuryRemaining(q.flags) > left0 && Number(q.flags.lg_riesgo) > risk0) relapse++;
}
ok(fast > 80 && relapse > 100, `forzar: ${fast} veces acorta · ${relapse} veces recaída con más riesgo`);
apply(p, opt(rehab, "a").consequences);
ok(p.flags.lg_stage === "2", "seguir el plan pasa a la fase del alta");
while (getInjuryRemaining(p.flags) > 0) turn(p);
ok(sagaStage(p) === "vuelta", "al curarte toca el alta");

console.log("5) El alta: secuelas o no");
const withSeq = { ...p, flags: { ...p.flags } }; const noSeq = { ...p, flags: { ...p.flags } };
const rS: any = buildSagaStageEvent(withSeq, () => 0); const rN: any = buildSagaStageEvent(noSeq, () => 0.999);
ok(clean(rS) && rS.isMilestone === true && !!rS.imageScene, "el alta es un hito compartible");
ok(!!opt(rS, "a") && !!opt(rS, "b") && !!opt(rS, "c"), "tres formas de volver (con homenaje porque tienes fama)");
const m0 = withSeq.media; apply(withSeq, opt(rS, "a").consequences);
ok(withSeq.media === m0 - 2 && !!withSeq.flags.secuela_rodilla && withSeq.flags.lg_stage === "", "con secuela: media -2, queda marca y se cierra la fase");
const n0 = noSeq.media; apply(noSeq, opt(rN, "a").consequences);
ok(noSeq.media >= n0 && !noSeq.flags.secuela_rodilla && noSeq.flags.lg_last === String(noSeq.week), "sin secuela: la media no baja y arranca el enfriamiento");
ok(typeof opt(rS, "a").consequences.flags.estado_regreso === "string" && !!STATES.regreso, "volver poco a poco deja el estado «volviendo de la lesión»");
ok(!shouldTriggerSeriousInjury(noSeq, () => 0), "tras el alta no hay otra lesión grave durante 30 turnos");

console.log("6) Volver ya: recaída y límite");
let rel = 0;
for (let i = 0; i < 200; i++) {
  const q: any = { ...p, flags: { ...p.flags } }; const ev: any = buildSagaStageEvent(q, () => 0.999);
  const rr = resolveOption(opt(ev, "b"), q)!; apply(q, rr.consequences);
  if (!rr.success) { if (q.flags.lg_stage === "2" && q.flags.lg_recaidas === "1" && getInjuryRemaining(q.flags) === 2) rel++; }
}
ok(rel > 60, `si sale mal: dos meses más de baja, recaída anotada (${rel} veces)`);
const q2: any = { ...p, flags: { ...p.flags, lg_recaidas: "2" } };
ok(!opt(buildSagaStageEvent(q2, () => 0.999), "b"), "tras dos recaídas ya no se puede pedir ser titular de entrada");

console.log("7) La secuela avisa meses después");
const s = mk(150, { flags: { secuela_rodilla: "100" } });
ok(sagaStage(s) === "secuela", "a los 15+ turnos con secuela, toca el aviso");
ok(sagaStage(mk(110, { flags: { secuela_rodilla: "100" } })) === null, "antes de tiempo, no");
const sev: any = buildSagaStageEvent(s);
ok(clean(sev) && sev.options.length === 3, "tres opciones: gestionar cargas, ignorar, limpieza");
const g = { ...s, flags: { ...s.flags } }; apply(g, opt(sev, "a").consequences);
ok(g.flags.lg_gestion === "1" && sagaStage(g) === null, "gestionar cargas: baja el riesgo futuro y no vuelve el aviso");
ok(injuryChance(g) < injuryChance(mk(150, { flags: { secuela_rodilla: "100" } })) + 0.0001, "con gestión, menos probabilidad que sin ella");
let cleaned = 0;
for (let i = 0; i < 300; i++) {
  const q: any = { ...s, flags: { ...s.flags } }; const rr = resolveOption(opt(sev, "c"), q)!; apply(q, rr.consequences);
  if (rr.success && !q.flags.secuela_rodilla && q.flags[SAGA_KEY] === "2") cleaned++;
}
ok(cleaned > 160, `operación de limpieza: quita la secuela en ${cleaned}/300`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
