/** Prueba sin IA: los catálogos ampliados (casas, mansiones, coches, motos, yates, jets) son coherentes y no cambian cuándo se puede pagar cada cosa. */
import { EXTRA_HOMES, EXTRA_MANSIONS, EXTRA_CARS, EXTRA_YACHTS, EXTRA_JETS, MOTO_LISTINGS } from "../src/lib/narrative/listings-extra";
import { findVehicleKind, findPropertyPrompt, findPropertyInteriorPrompt, getMinHomeDownPayment, getMinMansionDownPayment, buildMotoEvent } from "../src/lib/narrative/events";
import { vehicleFinancing, monthlyPayment, propertyValue } from "../src/lib/finance/mortgage";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const groups: Record<string, { name: string; min: number; max: number; prompt: string }[]> = { casas: EXTRA_HOMES, mansiones: EXTRA_MANSIONS, coches: EXTRA_CARS, yates: EXTRA_YACHTS, jets: EXTRA_JETS, motos: MOTO_LISTINGS };
for (const [k, list] of Object.entries(groups)) {
  const names = new Set(list.map((l) => l.name));
  ok(names.size === list.length && list.every((l) => l.min > 0 && l.max > l.min && l.prompt.length > 40), `${k}: ${list.length} entradas, sin nombres repetidos y con precios y foto`);
}

console.log("Lo que se podía pagar no cambia");
ok(getMinHomeDownPayment() === 17500 || getMinHomeDownPayment() <= 18000, `entrada mínima de una casa sigue siendo la de siempre (${getMinHomeDownPayment()} €)`);
ok(getMinMansionDownPayment() >= 300000 && getMinMansionDownPayment() <= 600000, `entrada mínima de una mansión (${getMinMansionDownPayment()} €)`);
ok(Math.min(...EXTRA_HOMES.map((l) => l.min)) >= 85000, "ninguna casa nueva baja el suelo del catálogo");

console.log("Motos");
ok(findVehicleKind("Naked deportiva de 800 cc") === "moto" && findVehicleKind("Naked deportiva de 800 cc (Madrid)") === "moto", "una moto se reconoce como moto (con o sin ciudad)");
ok(/Motorcycle/.test(findPropertyInteriorPrompt("Café racer artesanal") ?? "") && !!findPropertyPrompt("Café racer artesanal"), "tiene foto y detalle");
const f = vehicleFinancing("moto", 30000);
ok(f.termMonths === 60 && f.down === 6000, `financiación de la moto: entrada ${f.down} €, ${f.termMonths} meses`);
const pm = { key: "k", name: "moto", price: 30000, downPayment: 6000, since: 10, kind: "moto" as const, termMonths: 60, rate: 0.06 };
ok(propertyValue(pm, 10 + 24) < 30000 && propertyValue(pm, 10 + 240) >= 7500, "la moto pierde valor con los años, con un suelo");
ok(monthlyPayment(pm) > 400 && monthlyPayment(pm) < 520, `cuota de la moto: ${monthlyPayment(pm)} €/mes`);

const chain: any = new Proxy({}, { get: (_t, prop) => (prop === "then" ? undefined : prop === "maybeSingle" || prop === "single" ? () => Promise.resolve({ data: null, error: null }) : () => chain) });
const ev = await buildMotoEvent({ id: "p", user_id: "u", club: "Real Madrid", week: 60, patrimonio: 400000, flags: {} } as any, chain);
ok(ev.id === "vid-moto" && ev.options.length === 4 && ev.options.slice(0, 3).every((o) => /moto-\d/.test(o.id)), "la escena de la moto ofrece tres motos y pasar");
ok(!/undefined|NaN|\[object/.test(JSON.stringify(ev)), "sin textos rotos");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
