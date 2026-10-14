/** Prueba sin IA ni red: las casas y los coches de cada ciudad son distintos (otro listado, otro nombre y otra foto) y se siguen reconociendo. */
import { buildCityCarEvent, buildCityHousingEvent, findVehicleKind, findPropertyPrompt, findPropertyInteriorPrompt, baseListingName } from "../src/lib/narrative/events";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const chain: any = new Proxy({}, { get: (_t, prop) => (prop === "then" ? undefined : prop === "maybeSingle" || prop === "single" ? () => Promise.resolve({ data: null, error: null }) : () => chain) });
const mk = (club: string): any => ({ id: "p-casas", user_id: "u", last_name: "Hassan", club, week: 60, patrimonio: 9000000, media: 90, fama: 90, status: "active", flags: { club_changes: "3", club_since: "56" } });

const nombresCoche = (club: string) => async () => (await buildCityCarEvent(mk(club), chain)).options.filter((o: any) => /^coche-/.test(o.id)).map((o: any) => String(o.label).split(" — ")[0]);
const liverpool = await nombresCoche("Liverpool FC")();
const madrid = await nombresCoche("Real Madrid")();
ok(liverpool.length === 3 && madrid.length === 3, `3 coches en cada ciudad: Liverpool ${liverpool.length}, Madrid ${madrid.length}`);
ok(liverpool.every((n: string) => /\(Liverpool\)/.test(n)) && madrid.every((n: string) => /\(Madrid\)/.test(n)), "los coches llevan su ciudad");
const baseL = liverpool.map((n: string) => baseListingName(n.replace(/^Comprar: /, "")));
const baseM = madrid.map((n: string) => baseListingName(n.replace(/^Comprar: /, "")));
ok(new Set([...baseL, ...baseM]).size >= 5, `casi nunca coinciden los modelos entre ciudades: ${[...new Set([...baseL, ...baseM])].length} distintos entre 6`);
const otra = await nombresCoche("Real Madrid")();
ok(JSON.stringify(otra) === JSON.stringify(madrid), "volver a Madrid enseña los mismos coches (es estable por ciudad)");

const casaL = (await buildCityHousingEvent(mk("Liverpool FC"), chain)).options.find((o: any) => o.id === "comprar")!;
const casaM = (await buildCityHousingEvent(mk("Real Madrid"), chain)).options.find((o: any) => o.id === "comprar")!;
ok(!!casaL && !!casaM && casaL.label !== casaM.label && /Liverpool/.test(casaL.label) && /Madrid/.test(casaM.label), `casas distintas: «${casaL?.label.slice(0, 60)}» / «${casaM?.label.slice(0, 60)}»`);

console.log("Las propiedades con ciudad siguen reconociéndose");
ok(findVehicleKind("Coupé deportivo alemán (Madrid)") === "coche" && findVehicleKind("Coupé deportivo alemán") === "coche", "tipo de vehículo");
ok(/set in Madrid/.test(findPropertyPrompt("Ático con terraza en pleno centro (Madrid)") ?? "") && /set in Madrid/.test(findPropertyPrompt("Coupé deportivo alemán (Madrid)") ?? ""), "la foto lleva el sello de la ciudad");
ok(!!findPropertyInteriorPrompt("Ático con terraza en pleno centro (Madrid)") && /penthouse/.test(findPropertyInteriorPrompt("Ático con terraza en pleno centro (Madrid)") ?? ""), "el interior se deduce igual");
ok(baseListingName("Piso (con vistas) (Sevilla)") === "Piso (con vistas)", "el nombre base solo quita la última ciudad");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
