/** Prueba sin IA: marcas (reales e inventadas), pujas, productos con tu nombre y pantallas gigantes. */
import { buildBrandOffer, buildBrandBidding, buildMerchOffer, buildMerchResult, buildBillboardEvent, pickSponsorEvent, CATEGORIES, BILLBOARDS, dueMerchResult } from "../src/lib/narrative/brands";
import { sponsorshipFlagFor, readSponsorships } from "../src/lib/finance/sponsorship-income";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const mk = (week: number, fama: number, flags: Record<string, string> = {}): any => ({
  id: "t", last_name: "Hassan", nickname: null, agent_name: "Iñaki Zubiaurre", club: "Real Madrid", week, media: 82, fama, moral: 70, forma: 70,
  patrimonio: 100000, reputacion: 60, rel_representante: 60, flags, status: "active", mode: "pro",
});
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));
let seed = 7;
const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

console.log("1) Catálogo");
const all = Object.values(CATEGORIES).flatMap((c) => c.brands.map((b) => b.name));
for (const real of ["Nike", "Adidas", "Under Armour", "On", "Kelme", "Asics"]) ok(all.includes(real), `incluye ${real}`);
ok(new Set(all).size >= 50, `${new Set(all).size} marcas distintas`);

console.log("2) Ofertas de una marca (miles de jugadores)");
let offers = 0, badCount = 0, noOptions = 0; const cats = new Set<string>(); const brandsSeen = new Set<string>();
for (let i = 0; i < 3000; i++) {
  const p = mk(20 + (i % 150), 65 + (i % 36));
  const ev = buildBrandOffer(p, rng);
  if (!ev) continue;
  offers++; cats.add(ev.id.split("-")[2]); brandsSeen.add(ev.title.split(" quiere")[0]);
  if (bad(ev) || /\bHassan\b.*\bHassan\b/.test(ev.description)) badCount++;
  if (ev.options.length < 3) noOptions++;
  const firmar = ev.options.find((o) => o.id === "firmar");
  if (!firmar || (firmar.consequences.patrimonio ?? 0) <= 0) badCount++;
}
ok(offers > 2500, `salen ofertas (${offers})`);
ok(badCount === 0, "ningún texto con undefined/NaN/[object ni prima inválida");
ok(noOptions === 0, "todas con 3 opciones");
ok(cats.size >= 10, `${cats.size} categorías distintas`);
ok(brandsSeen.size >= 40, `${brandsSeen.size} marcas distintas vistas`);

console.log("3) Prima crece con la fama y la firma deja un contrato mensual");
const lo = buildBrandOffer(mk(30, 66), () => 0.5)!, hi = buildBrandOffer(mk(30, 98), () => 0.5)!;
ok((hi.options[0].consequences.patrimonio ?? 0) > (lo.options[0].consequences.patrimonio ?? 0) * 1.5, "más fama, más prima");
const flag = sponsorshipFlagFor(lo.id, "Nike", lo.options[0].consequences.patrimonio ?? 0, 30);
ok(!!flag && readSponsorships(flag as any)[0].monthly > 0, "paga cada mes");
const nameFlag = Object.entries(lo.options[0].consequences.flags ?? {}).find(([k, v]) => k.startsWith("sponsor_") && typeof v === "string");
ok(!!nameFlag && isNaN(Number(nameFlag[1])), `el primer flag sponsor_ es el nombre de la marca (${nameFlag?.[1]})`);

console.log("4) Sin fama no hay marcas; con contrato en vigor, esa categoría no repite");
ok(buildBrandOffer(mk(30, 40), rng) === null, "fama 40: nada");
const busy = mk(30, 95, { patrocinio_x: JSON.stringify({ name: "Nike", monthly: 2000, since: 25, until: 40 }) });
let repeated = 0;
for (let i = 0; i < 500; i++) { const e = buildBrandOffer(busy, rng); if (e && e.id.startsWith("sponsor-oferta-botas")) repeated++; }
ok(repeated === 0, "con Nike en vigor no ofrece otras botas");

console.log("5) Pujas: tres marcas distintas que se pelean");
let pujas = 0, pujaBad = 0, realTrio = 0;
for (let i = 0; i < 1500; i++) {
  const ev = buildBrandBidding(mk(40 + (i % 100), 86 + (i % 14)), rng);
  if (!ev) continue; pujas++;
  const names = ev.options.slice(0, 3).map((o) => o.label.split(":")[0]);
  if (bad(ev) || new Set(names).size !== 3 || ev.options.length !== 4) pujaBad++;
  if (["Nike", "Adidas", "Puma"].every((n) => names.includes(n))) realTrio++;
}
ok(pujas > 1000 && pujaBad === 0, `${pujas} pujas correctas`);
ok(buildBrandBidding(mk(30, 70), rng) === null, "con fama 70 no hay puja");
console.log(`    (con los tres gigantes de las botas a la vez: ${realTrio})`);

console.log("6) Productos con tu nombre");
let merch = 0, merchBad = 0; const prods = new Set<string>();
for (let i = 0; i < 800; i++) { const ev = buildMerchOffer(mk(30, 70 + (i % 30)), rng); if (!ev) continue; merch++; prods.add(ev.id.split("-")[1]); if (bad(ev) || ev.options.length !== 3 || /^sponsor-/.test(ev.id)) merchBad++; }
ok(merch > 700 && merchBad === 0, `${merch} ofertas de producto sin fallos`);
ok(prods.size >= 6, `${prods.size} productos distintos`);
const withMerch = mk(80, 90, { merch_colonia: "30", merch_colonia_modo: "propio", merch_colonia_inversion: "20000", merch_colonia_nombre: "Colonia Hassan" });
ok(dueMerchResult(mk(35, 90, withMerch.flags)) === null, "antes de tiempo no hay resultado");
let results = 0, wins = 0, resBad = 0;
for (let i = 0; i < 400; i++) { const ev = buildMerchResult(mk(45, 90, { ...withMerch.flags }), rng); if (!ev) continue; results++; if (bad(ev)) resBad++; if ((ev.options[0].consequences.patrimonio ?? 0) > 0) wins++; }
ok(results === 400 && resBad === 0, "el resultado de ventas sale y es válido");
ok(wins > 100 && wins < 400, `a veces gana y a veces no (${wins}/400)`);
ok(buildMerchResult(mk(45, 90, { ...withMerch.flags, merch_colonia_resultado: "45" }), rng) === null, "no repite el resultado");

console.log("7) Pantallas gigantes");
ok(buildBillboardEvent(mk(50, 70), [], rng) === null, "con fama 70 no sale");
const mid = buildBillboardEvent(mk(50, 80), [], rng)!;
ok(!!mid && /Piccadilly|Gran Vía|Shibuya|Potsdamer/.test(mid.title) && mid.isMilestone === true && !!mid.imageScene, "con fama 80: pantalla de ciudad con hito e imagen");
const star = new Set<string>();
for (let i = 0; i < 400; i++) { const e = buildBillboardEvent(mk(50, 99), [], rng); if (e) star.add(e.id); }
ok(star.has("sponsor-pantalla-times-square") && star.has("sponsor-pantalla-burj"), "con fama 99 sale Times Square y Burj Khalifa");
ok(buildBillboardEvent(mk(50, 99), BILLBOARDS.map((b) => `sponsor-pantalla-${b.key}`), rng) === null, "cada pantalla solo una vez");
ok(!bad(mid) && mid.options.length === 3, "texto limpio y 3 opciones");

console.log("8) Selector general");
let n = 0; const kinds = new Set<string>();
for (let i = 0; i < 600; i++) { const ev = pickSponsorEvent(mk(30 + i, 95), [], rng); if (ev) { n++; kinds.add(ev.id.split("-")[0] + "-" + ev.id.split("-")[1]); } }
ok(n > 300, `salen escenas (${n})`);
ok(kinds.size >= 3, `varios tipos: ${[...kinds].join(", ")}`);
ok(pickSponsorEvent(mk(30, 95, { marcas_evento_last: "29" }), [], rng) === null, "enfriamiento de 3 turnos tras una escena de marcas");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
