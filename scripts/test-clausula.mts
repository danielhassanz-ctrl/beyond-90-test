/** Prueba sin IA: las escenas de renovación dicen las cifras (cláusula antes/después, ficha antes/después, prima) y el contrato guardado cambia de verdad. */
import { buildMarketRumorEvent, buildOwnMoveEvent, shouldTriggerOwnMoveDecision } from "../src/lib/narrative/market-window";
import { buildContractRenewalEvent } from "../src/lib/narrative/contract-renewal";
import { releaseClauseM, marketValueM, playerAnnualGross, eurFee, eur } from "../src/lib/narrative/transfer-terms";
import { fillBankEvent } from "../src/lib/narrative/bank/select";
import { BANK_SCENES } from "../src/lib/narrative/bank/scenes";
import { resolveOption } from "../src/lib/narrative/engine";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const mk = (flags: any = {}): any => ({
  id: "t", last_name: "Hassan", agent_name: "Iñaki Zubiaurre", club: "Bayern de Múnich", week: 130, media: 84, fama: 80, forma: 75, moral: 70, patrimonio: 2_000_000,
  rel_entrenador: 60, rel_vestuario: 60, rel_aficion: 60, reputacion: 60, status: "active", mode: "pro",
  flags: { club_since: "90", salary_club: "Bayern de Múnich", salary_fixed: "2400000", salary_fix_v: "2", salary_mult: "1.000", contract_until: "170", contract_clause_m: "40", ...flags },
});
const apply = (p: any, c: any) => { p.patrimonio += c.patrimonio ?? 0; for (const [k, v] of Object.entries(c.flags ?? {})) p.flags[k] = v; };
const opt = (e: any, id: string) => e.options.find((o: any) => o.id === id);
const clean = (e: any) => !/undefined|NaN|\[object/.test(JSON.stringify(e));

const p0 = mk();
const clause0 = releaseClauseM(p0), value0 = marketValueM(p0), salary0 = playerAnnualGross(p0);
console.log("1) Tu cláusula y tu valor");
ok(clause0 === 40, `cláusula guardada: ${eurFee(clause0)}`);
ok(value0 > clause0, `vales ${eurFee(value0)}: la cláusula es una ganga`);
ok(releaseClauseM(mk({ salary_club: "Otro club" })) !== 40, "una cláusula de otro club no cuenta (se estima)");

console.log("2) Escena de la cláusula filtrada");
let rumor: any = null;
for (let i = 0; i < 800 && !rumor; i++) {
  const e: any = buildMarketRumorEvent(mk());
  if (/cláusula de rescisión/.test(e.title)) rumor = e;
}
ok(!!rumor, "sale la escena");
ok(clean(rumor) && rumor.description.includes(eurFee(clause0)) && /ganga/.test(rumor.description), "dice cuál es tu cláusula y que es una ganga");
const ask = opt(rumor, "renovar-subir");
ok(/M€/.test(ask.label) && /al año/.test(ask.label) && ask.label.includes(eurFee(clause0)), `la opción lo dice: «${ask.label}»`);
let good = 0, bad = 0, wrong = 0;
for (let i = 0; i < 300; i++) {
  const p = mk();
  const r = resolveOption(ask, p)!;
  if (r.success) {
    good++;
    apply(p, r.consequences);
    const newClause = releaseClauseM(p), newSalary = playerAnnualGross(p);
    if (!(newClause > clause0 && newSalary > salary0 && Number(p.flags.contract_until) > p.week + 10 && p.patrimonio > 2_000_000)) wrong++;
    if (!(r.text.includes(eurFee(clause0)) && r.text.includes(eurFee(newClause)) && r.text.includes(eur(salary0)) && r.text.includes(eur(newSalary)))) wrong++;
  } else {
    bad++;
    if (!(r.text.includes(eurFee(clause0)) && r.text.includes(eur(salary0)))) wrong++;
    const before = JSON.stringify(mk().flags); const p2 = mk(); apply(p2, r.consequences); if (JSON.stringify(p2.flags) !== before) wrong++;
  }
}
ok(good > 80 && bad > 80, `se reparte entre acierto (${good}) y fallo (${bad})`);
ok(wrong === 0, "si cede: cláusula, ficha, años y prima cambian de verdad y el texto lo cuenta con las cifras; si no, todo igual y el texto dice cuánto era");

console.log("3) «¿Te quedas o mueves ficha?» también renueva con cifras");
const shortContract = { contract_until: "135", contract_signed: "80" };
const own: any = buildOwnMoveEvent(mk(shortContract));
const stay = opt(own, "renovar");
ok(/M€/.test(stay.label) && /al año/.test(stay.label), `«${stay.label}»`);
let ownWrong = 0, ownGood = 0;
for (let i = 0; i < 300; i++) {
  const p = mk(shortContract); const r = resolveOption(stay, p)!;
  if (r.success) { ownGood++; apply(p, r.consequences); if (!(releaseClauseM(p) > clause0 && playerAnnualGross(p) > salary0 && /M€/.test(r.text) && r.text.includes(eur(playerAnnualGross(p))))) ownWrong++; }
}
ok(ownGood > 80 && ownWrong === 0, `si cede (${ownGood} veces): sube la cláusula y la ficha, con las cifras en el texto`);

console.log("4) La renovación del contrato dice la cláusula");
const ren: any = buildContractRenewalEvent(mk({ contract_until: "135" }));
const a = opt(ren, "a");
ok(/cláusula/.test(a.subtitle) && a.subtitle.includes(eurFee(clause0)), `«${a.subtitle}»`);
const p3 = mk({ contract_until: "135" }); apply(p3, a.consequences);
ok(releaseClauseM(p3) > clause0 && /cláusula de rescisión sube/.test(a.outcomeText), `la cláusula pasa de ${eurFee(clause0)} a ${eurFee(releaseClauseM(p3))}`);

console.log("5) Escenas del banco con tus cifras");
const prom = BANK_SCENES.find((s) => s.id === "bank-m4-promesa-clausula")!;
const filled: any = fillBankEvent(prom.event as any, mk());
ok(filled.description.includes(eurFee(clause0)) && !/\{/.test(filled.description), "«{clausula}» se sustituye por la cifra real");
const dud = BANK_SCENES.find((s) => s.id === "bank-m4-renovar-dudas")!;
const f2: any = fillBankEvent(dud.event as any, mk());
ok(f2.description.includes(eur(salary0)) && f2.description.includes(eurFee(clause0)), "la escena de las dudas dice tu ficha y tu cláusula");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
