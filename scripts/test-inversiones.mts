/** Prueba sin IA: las inversiones vuelven a los ~10 turnos con su valor real y cada decisión cambia de verdad el patrimonio y el activo. */
import { dueInvestment, buildInvestmentReviewEvent } from "../src/lib/narrative/investment-review";
import { readInvestments, investmentValue, investmentFlag } from "../src/lib/finance/investments";
import { resolveOption } from "../src/lib/narrative/engine";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const base = (flags: any): any => ({ id: "t", last_name: "Hassan", agent_name: "Iñaki Zubiaurre", nation: "España", club: "Real Madrid", position: "Delantero", week: 20, media: 80, fama: 60, moral: 70, forma: 80, patrimonio: 400000, rel_entrenador: 60, rel_vestuario: 60, rel_aficion: 60, rel_representante: 60, reputacion: 60, flags, status: "active", mode: "pro" });
const flagsFor = (slug: string, rec: any, since: number) => {
  const f: any = investmentFlag(slug, rec);
  return { [`inversion_${slug}`]: f[`inversion_${slug}`].replace('"@WEEK"', String(since)) };
};
function apply(p: any, cons: any) {
  p.patrimonio += cons.patrimonio ?? 0;
  for (const [k, v] of Object.entries(cons.flags ?? {})) p.flags[k] = v;
}
const textOk = (ev: any) => JSON.stringify(ev).match(/undefined|\[object|NaN/) === null;

console.log("1) No toca antes de tiempo");
let p = base(flagsFor("fondo", { name: "Fondo global", detail: "d", amount: 50000, annualRate: 0.06 }, 15));
ok(dueInvestment(p) === null, "a 5 turnos de invertir no hay revisión");
p.week = 25;
ok(dueInvestment(p) !== null, "a 10 turnos sí");

console.log("2) Inversión que va bien: vender cobra el valor real y borra el activo");
const inv0 = readInvestments(p.flags)[0];
const value = investmentValue(inv0, p.week);
let ev: any = buildInvestmentReviewEvent(p);
ok(textOk(ev), "texto sin undefined/NaN");
ok(ev.options.length >= 2, `opciones: ${ev.options.map((o: any) => o.label).join(" | ")}`);
const sell = ev.options.find((o: any) => o.id === "b");
const before = p.patrimonio;
apply(p, sell.consequences);
ok(p.patrimonio === before + value, `vender suma ${value} € (patrimonio ${before} → ${p.patrimonio})`);
ok(readInvestments(p.flags).length === 0, "el activo desaparece de Patrimonio");
ok(dueInvestment(p) === null, "no vuelve a pedir revisión de lo vendido");

console.log("3) Mantener aplaza la siguiente revisión 10 turnos");
p = base(flagsFor("piso", { name: "Piso", detail: "d", amount: 50000, annualRate: 0.045 }, 10)); p.week = 22;
ev = buildInvestmentReviewEvent(p);
apply(p, ev.options.find((o: any) => o.id === "a").consequences);
ok(readInvestments(p.flags).length === 1, "sigue en Patrimonio");
p.week = 26; ok(dueInvestment(p) === null, "4 turnos después no vuelve");
p.week = 33; ok(dueInvestment(p) !== null, "11 turnos después vuelve");

console.log("4) Meter más reinvierte: sube el importe y resta dinero");
p = base(flagsFor("cartera", { name: "Cartera", detail: "d", amount: 100000, annualRate: 0.065 }, 5)); p.week = 20;
const v4 = investmentValue(readInvestments(p.flags)[0], p.week);
ev = buildInvestmentReviewEvent(p);
const more = ev.options.find((o: any) => /Meter/.test(o.label));
ok(!!more, "hay opción de meter más");
const m0 = p.patrimonio; apply(p, more.consequences);
const after = readInvestments(p.flags)[0];
ok(after.amount > v4 && p.patrimonio < m0, `importe ${v4} → ${after.amount}, dinero ${m0} → ${p.patrimonio}`);
ok(Math.abs(investmentValue(after, p.week) - after.amount) <= 1, "el valor arranca igual que el importe nuevo (sin salto)");

console.log("5) Inversión en pérdidas: tirada de aguantar y apostar doble, con efectos reales");
const loss = (): any => base(flagsFor("startup", { name: "Startup tecnológica (en pérdidas)", detail: "d", amount: 50000, annualRate: -0.8 }, 5));
p = loss(); p.week = 20;
ev = buildInvestmentReviewEvent(p);
ok(/van|cuentas|por debajo/i.test(ev.description + ev.title), "el tono es de pérdida");
const hold = ev.options.find((o: any) => o.id === "c");
ok(!!hold?.resolve, "aguantar es una tirada");
let wins = 0, loses = 0;
for (let i = 0; i < 200; i++) {
  const q = loss(); q.week = 20;
  const e: any = buildInvestmentReviewEvent(q);
  const res = resolveOption(e.options.find((o: any) => o.id === "c"), q)!;
  apply(q, res.consequences);
  const rec = readInvestments(q.flags)[0];
  if (res.success) { wins++; ok(rec.annualRate > 0 || i > 0, "") ; if (rec.annualRate <= 0) fails++; } else { loses++; if (rec.annualRate >= 0) fails++; }
}
ok(wins > 40 && loses > 40, `se reparte entre remontar (${wins}) y hundirse (${loses})`);
const dbl = ev.options.find((o: any) => o.id === "d");
ok(!!dbl, "hay opción de promediar (apostar doble)");
const sellLoss = ev.options.find((o: any) => o.id === "b");
const pl = loss(); pl.week = 20; const vl = investmentValue(readInvestments(pl.flags)[0], 20); const bl = pl.patrimonio;
apply(pl, sellLoss.consequences);
ok(pl.patrimonio === bl + vl && vl < 50000, `vender en pérdidas cobra ${vl} (< 50.000)`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
