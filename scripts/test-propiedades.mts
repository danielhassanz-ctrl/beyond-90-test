/** Prueba sin IA: las propiedades se revalorizan (casas) o pierden valor (vehículos) y la escena de seguimiento cambia de verdad el patrimonio y la propiedad. */
import { propertyValue, readProperties, remainingLoan, serializeProperty, canRent, propertyRentMonthly, totalRentalIncome, saleProceeds } from "../src/lib/finance/mortgage";
import { dueProperty, buildPropertyReviewEvent } from "../src/lib/narrative/property-review";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const prop = (o: any) => serializeProperty({ key: "", name: "Casa en La Moraleja", price: 400000, downPayment: 80000, since: 10, ...o });
const mk = (week: number, flags: any, patrimonio = 300000): any => ({ id: "t", last_name: "Hassan", agent_name: "Iñaki Zubiaurre", club: "Real Madrid", week, patrimonio, media: 80, fama: 60, flags, status: "active", mode: "pro" });
const apply = (p: any, c: any) => { p.patrimonio += c.patrimonio ?? 0; for (const [k, v] of Object.entries(c.flags ?? {})) p.flags[k] = v; };

console.log("1) Valor en el tiempo");
const casa = readProperties({ propiedad_a: prop({}) })[0];
const coche = readProperties({ propiedad_b: prop({ name: "Coche deportivo", kind: "coche", price: 100000, downPayment: 20000 }) })[0];
ok(propertyValue(casa, 10) === 400000, "el día de la compra vale lo que costó");
ok(propertyValue(casa, 30) > 400000, `la casa sube: ${propertyValue(casa, 30)} € a los 20 turnos`);
ok(propertyValue(coche, 30) < 100000 && propertyValue(coche, 30) > 70000, `el coche baja: ${propertyValue(coche, 30)} €`);
ok(propertyValue(coche, 1000) >= 25000, "el valor del coche tiene suelo (25 %)");

console.log("2) Cuándo sale la revisión");
ok(dueProperty(mk(20, { propiedad_a: prop({}) })) === null, "a 10 turnos de comprar, no");
ok(dueProperty(mk(31, { propiedad_a: prop({}) })) !== null, "a 21 turnos, sí");

console.log("3) Vender: cobra valor − gastos − deuda y la propiedad desaparece");
let p = mk(31, { propiedad_a: prop({}) });
let ev: any = buildPropertyReviewEvent(p);
ok(!/undefined|NaN|\[object/.test(JSON.stringify(ev)), `texto limpio · "${ev.title}"`);
const sell = ev.options.find((o: any) => o.id === "b");
const expected = Math.round(propertyValue(casa, 31) * 0.95) - remainingLoan(casa, 31);
ok(sell.consequences.patrimonio === expected, `venta = ${expected} €`);
const before = p.patrimonio; apply(p, sell.consequences);
ok(p.patrimonio === before + expected && readProperties(p.flags).length === 0, "el dinero entra y la propiedad desaparece");

console.log("4) Reformar: cuesta dinero y sube el valor");
p = mk(31, { propiedad_a: prop({}) }); ev = buildPropertyReviewEvent(p);
const reform = ev.options.find((o: any) => o.id === "c");
ok(!!reform, "hay opción de reformar una casa");
const v0 = propertyValue(readProperties(p.flags)[0], 31); const m0 = p.patrimonio;
apply(p, reform.consequences);
const v1 = propertyValue(readProperties(p.flags)[0], 31);
ok(v1 > v0 * 1.07 && p.patrimonio < m0, `valor ${v0} → ${v1}, dinero ${m0} → ${p.patrimonio}`);

console.log("5) Vehículo: sin reforma, tono de pérdida de valor");
p = mk(40, { propiedad_b: prop({ name: "Coche deportivo", kind: "coche", price: 100000, downPayment: 20000, since: 10 }) }); ev = buildPropertyReviewEvent(p);
ok(!ev.options.some((o: any) => o.id === "c") && /menos|pierden valor/.test(ev.description), "sin opción de reformar, explica la depreciación");

console.log("6) Mantener aplaza la siguiente revisión");
p = mk(31, { propiedad_a: prop({}) }); ev = buildPropertyReviewEvent(p); apply(p, ev.options.find((o: any) => o.id === "a").consequences);
p.week = 40; ok(dueProperty(p) === null, "9 turnos después no vuelve");
p.week = 52; ok(dueProperty(p) !== null, "21 turnos después, sí");

console.log("7) Alquilar y vender");
const piso = readProperties({ propiedad_a: prop({ city: "Múnich" }) })[0];
ok(piso.city === "Múnich", "la propiedad recuerda su ciudad");
ok(canRent(piso) && !canRent(coche), "una casa se alquila; un coche no");
ok(propertyRentMonthly(piso, 30) === 0, "sin poner en alquiler no entra nada");
const alquilada = { ...piso, rented: true };
const renta = propertyRentMonthly(alquilada, 30);
ok(renta > 0 && Math.abs(renta - (propertyValue(piso, 30) * 0.032) / 12) < 10, `en alquiler entra una renta neta de ${renta} €/mes (3,2 % anual del valor)`);
ok(propertyRentMonthly({ ...coche, rented: true }, 30) === 0, "un coche no genera renta aunque se marque");
const flagsRent = { propiedad_a: serializeProperty(alquilada), propiedad_b: prop({ name: "Otra", price: 200000, downPayment: 200000, rented: true }) };
ok(totalRentalIncome(flagsRent, 30) > renta, `la renta total suma todas las alquiladas (${totalRentalIncome(flagsRent, 30)} €/mes)`);
const venta = saleProceeds(piso, 30);
ok(venta === Math.round(propertyValue(piso, 30) * 0.95) - remainingLoan(piso, 30), `vender: valor − 5 % de gastos − deuda = ${venta} €`);
ok(saleProceeds(readProperties({ propiedad_x: prop({ price: 100000, downPayment: 0, since: 30 }) })[0], 30) < 0, "recién comprada con toda la hipoteca, vender cuesta dinero (gastos + deuda)");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
