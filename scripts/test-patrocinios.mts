/** Prueba sin IA: un patrocinio vencido vuelve con una oferta de renovación que depende de tu momento, y cada decisión tiene efecto. */
import { expiredSponsorship, buildSponsorRenewalEvent, renewalFactor } from "../src/lib/narrative/sponsor-renewal";
import { readSponsorships, activeSponsorships } from "../src/lib/finance/sponsorship-income";
import { resolveOption } from "../src/lib/narrative/engine";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const mk = (week: number, fama: number, forma = 70): any => ({
  id: "t", last_name: "Hassan", agent_name: "Iñaki Zubiaurre", club: "Real Madrid", week, media: 80, fama, moral: 70, forma, patrimonio: 100000, reputacion: 60, rel_representante: 60,
  flags: { patrocinio_nike: JSON.stringify({ name: "Marca Atlas", monthly: 2000, since: 11, until: 20 }) }, status: "active", mode: "pro",
});
const apply = (p: any, c: any) => { p.patrimonio += c.patrimonio ?? 0; for (const [k, v] of Object.entries(c.flags ?? {})) p.flags[k] = v; };

console.log("1) Cuándo sale");
ok(expiredSponsorship(mk(18, 50)) === null, "con el contrato vigente no sale");
ok(expiredSponsorship(mk(21, 50)) !== null, "al vencer sale");
ok(expiredSponsorship(mk(30, 50)) === null, "pasada la ventana ya no sale");

console.log("2) La cifra depende de cómo te haya ido");
const fHi = renewalFactor(mk(21, 90)), fLo = renewalFactor(mk(21, 5, 30));
ok(fHi > 1.05 && fLo < 0.95, `fama alta ×${fHi.toFixed(2)} · fama baja y mala forma ×${fLo.toFixed(2)}`);
let ev: any = buildSponsorRenewalEvent(mk(21, 90));
ok(/Marca Atlas/.test(ev.description) && !/undefined|NaN|\[object/.test(JSON.stringify(ev)), "texto con la marca y sin undefined");

console.log("3) Renovar deja un contrato nuevo de una temporada y no vuelve a salir");
let p = mk(21, 90); ev = buildSponsorRenewalEvent(p);
apply(p, ev.options.find((o: any) => o.id === "a").consequences);
const s = readSponsorships(p.flags)[0];
ok(s.monthly > 2000 && s.until === 31 && s.since === 22, `nuevo: ${s.monthly} €/mes de la sem ${s.since} a la ${s.until}`);
ok(activeSponsorships(p.flags, 23).length === 1, "vuelve a pagar cada turno");
ok(expiredSponsorship(p) === null, "ya tratado: no repite");
p.week = 33; ok(expiredSponsorship(p) !== null, "al vencer el nuevo contrato, vuelve a salir");

console.log("4) No renovar: el contrato sigue vencido y no vuelve");
p = mk(21, 50); ev = buildSponsorRenewalEvent(p);
apply(p, ev.options.find((o: any) => o.id === "c").consequences);
ok(activeSponsorships(p.flags, 23).length === 0 && expiredSponsorship(p) === null, "no cobra y no repite");

console.log("5) Pedir más es una tirada con efecto real");
let w = 0, l = 0;
for (let i = 0; i < 300; i++) {
  const q = mk(21, 60); const e: any = buildSponsorRenewalEvent(q);
  const res = resolveOption(e.options.find((o: any) => o.id === "b"), q)!;
  apply(q, res.consequences);
  const act = activeSponsorships(q.flags, 23);
  if (res.success) { w++; if (!(act.length === 1 && act[0].monthly > 2000 * 1.2)) fails++; } else { l++; if (act.length !== 0) fails++; }
}
ok(w > 40 && l > 40, `éxito ${w} (mejor contrato) · fracaso ${l} (la marca se va)`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
