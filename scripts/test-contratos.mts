/** Prueba sin IA: el contrato vence de verdad y su renovación / salida libre cambian sueldo, club y fecha de fin. */
import { contractUntil, contractPhase, shouldTriggerContractRenewal, buildContractRenewalEvent, TURNS_PER_YEAR } from "../src/lib/narrative/contract-renewal";
import { playerAnnualGross } from "../src/lib/narrative/transfer-terms";
import { resolveOption } from "../src/lib/narrative/engine";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const mk = (week: number, flags: any = {}, o: any = {}): any => ({
  id: "t", last_name: "Hassan", agent_name: "Iñaki Zubiaurre", club: "Real Betis", week, media: 74, fama: 55, forma: 70, moral: 70, rel_entrenador: 55, rel_vestuario: 55, rel_aficion: 55,
  patrimonio: 100000, reputacion: 55, status: "active", mode: "pro", flags: { club_since: "0", ...flags }, ...o,
});
const apply = (p: any, c: any) => {
  p.patrimonio += c.patrimonio ?? 0;
  if (typeof c.club === "string") p.club = c.club;
  for (const [k, v] of Object.entries(c.flags ?? {})) p.flags[k] = v;
};
const stored = (until: number, club = "Real Betis") => ({ contract_until: String(until), salary_club: club, salary_fixed: "300000", salary_fix_v: "2" });

console.log("1) Cuándo salen las escenas");
ok(contractPhase(mk(20)) === null, "carrera sin contrato registrado: a 20 turnos del fin derivado, nada");
ok(contractPhase(mk(32)) === "ultima", "derivado (4 años desde que llegaste): a 8 turnos del fin sale la última temporada");
ok(contractUntil(mk(32, stored(80))) === 80 && contractPhase(mk(32, stored(80))) === null, "con contrato guardado hasta la 80, la semana 32 no toca");
ok(contractPhase(mk(71, stored(80))) === "ultima", "a 9 turnos del fin: última temporada");
ok(contractPhase(mk(80, stored(80))) === "fin", "el día que vence: fin de contrato");
ok(contractPhase(mk(71, stored(80, "Otro Club"))) !== "ultima" || contractUntil(mk(71, stored(80, "Otro Club"))) !== 80, "un contrato de otro club no cuenta para éste");
ok(contractPhase(mk(71, { ...stored(80), loan_active: true })) === null, "cedido: no salen escenas de contrato");

console.log("2) Renovar: nuevo contrato, sueldo fijo y no vuelve a salir");
let p = mk(71, stored(80));
let ev: any = buildContractRenewalEvent(p);
ok(!/undefined|NaN|\[object/.test(JSON.stringify(ev)), `texto limpio · "${ev.title}"`);
ok(ev.options.length === 3, `3 opciones: ${ev.options.map((o: any) => o.id).join(",")}`);
const before = p.patrimonio;
apply(p, ev.options.find((o: any) => o.id === "a").consequences);
ok(Number(p.flags.contract_until) > 71 + 2 * TURNS_PER_YEAR - 1, `vence en la semana ${p.flags.contract_until}`);
ok(p.patrimonio > before && playerAnnualGross(p) === Number(p.flags.salary_fixed), `prima cobrada y sueldo fijo ${playerAnnualGross(p)} €`);
ok(!shouldTriggerContractRenewal(p), "no repite en seguida");
p.week = Number(p.flags.contract_until) - 8;
ok(contractPhase(p) === "ultima", "una temporada antes del nuevo fin vuelve a salir");

console.log("3) Pedir más: tirada con efecto real");
let w = 0, l = 0, better = true, cooledOk = true;
for (let i = 0; i < 300; i++) {
  const q = mk(71, stored(80)); const e: any = buildContractRenewalEvent(q);
  const base = Number(e.options.find((o: any) => o.id === "a").consequences.flags.salary_fixed);
  const res = resolveOption(e.options.find((o: any) => o.id === "b"), q)!;
  apply(q, res.consequences);
  if (res.success) { w++; if (!(Number(q.flags.salary_fixed) > base)) better = false; }
  else { l++; if (!q.flags.ctr_enfriado || q.flags.contract_until !== "80") cooledOk = false; }
}
ok(w > 60 && l > 60, `se reparte: ${w} aciertos / ${l} fallos`);
ok(better, "si cede, el sueldo es mayor que el de renovar sin más");
ok(cooledOk, "si falla, el club se enfría y el contrato sigue vencimiento en la 80");
p = mk(71, stored(80), {}); p.flags.ctr_enfriado = "1"; p.flags.ctr_ult_80 = ""; p.flags.ctr_last = "60";
const coldOffer = Number((buildContractRenewalEvent(p).options[0].consequences.flags as Record<string, string>).salary_fixed);
p.flags.ctr_enfriado = "";
const normalOffer = Number((buildContractRenewalEvent(p).options[0].consequences.flags as Record<string, string>).salary_fixed);
ok(coldOffer < normalOffer, `tras enfriarse ofrecen menos (${coldOffer} < ${normalOffer})`);

console.log("4) No renovar: abre el mercado y al vencer eres libre");
p = mk(71, stored(80)); ev = buildContractRenewalEvent(p);
const no = ev.options.find((o: any) => o.id === "c");
ok(no.consequences.flags["@interest"] === "agente" && no.consequences.rel_entrenador < 0, "interés de un club y se enfría el míster");
apply(p, no.consequences);
p.week = 80;
ok(contractPhase(p) === "fin", "al vencer sale el fin de contrato");
ev = buildContractRenewalEvent(p);
ok(/libre/i.test(ev.title), `título: "${ev.title}"`);
const stay = ev.options.find((o: any) => o.id === "a"); const go = ev.options.find((o: any) => o.id === "c");
ok(!!go && /libre/.test(go.label), `marcharte: ${go?.label}`);
const m0 = p.patrimonio; const oldClub = p.club;
apply(p, go.consequences);
ok(p.club !== oldClub && p.patrimonio > m0, `ficha por ${p.club} y cobra prima (${p.patrimonio - m0} €)`);
ok(p.flags.salary_club === p.club && Number(p.flags.contract_until) > 80, `contrato nuevo hasta la ${p.flags.contract_until}, sueldo fijo ${p.flags.salary_fixed}`);
ok(!shouldTriggerContractRenewal(p) || contractPhase(p) !== "fin", "tras firmar, el viejo contrato no vuelve a saltar");

console.log("5) Dejar que se agote sin avisar sale más caro");
p = mk(80, { ...stored(80), ctr_salida: "80" }); const offerAvisado = Number((buildContractRenewalEvent(p).options[0].consequences.flags as Record<string, string>).salary_fixed);
p = mk(80, stored(80)); const offerSinAviso = Number((buildContractRenewalEvent(p).options[0].consequences.flags as Record<string, string>).salary_fixed);
ok(offerSinAviso < offerAvisado * 0.95, `misma semana: ${offerSinAviso} € si se agota sin avisar frente a ${offerAvisado} € si avisaste`);
const fin = buildContractRenewalEvent(p);
ok(fin.options.length === 2 && fin.options.some((o: any) => o.id === "c"), "al vencer: quedarte o marcharte libre");

console.log("6) Frecuencia");
p = mk(71, { ...stored(80), ctr_last: "70" });
ok(!shouldTriggerContractRenewal(p), "no sale dos veces seguidas (enfriamiento de 3 turnos)");
p.week = 74; ok(shouldTriggerContractRenewal(p), "pasados 3 turnos, sí");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
