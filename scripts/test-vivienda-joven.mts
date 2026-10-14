/** Prueba sin IA ni red: de joven se elige residencia, piso compartido, estudio o casa de los padres; deja alquiler real y no se pregunta dos veces. */
import { shouldTriggerYouthHousing, buildYouthHousingEvent, youthHousingId, STUDENT_RESIDENCES, SHARED_FLATS, YOUTH_FLATS } from "../src/lib/narrative/youth-housing";
import { readRent } from "../src/lib/finance/rent";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const chain: any = new Proxy({}, { get: (_t, prop) => (prop === "then" ? undefined : prop === "maybeSingle" || prop === "single" ? () => Promise.resolve({ data: null, error: null }) : () => chain) });
const mk = (over: any = {}, flags: any = {}): any => ({ id: "p-joven", user_id: "u", last_name: "Hassan", club: "Real Madrid", week: 20, patrimonio: 4000, media: 62, fama: 20, status: "active", agent_name: "Julia Rovira", flags: { club_since: "15", club_changes: "1", ...flags }, ...over });

console.log("1) Cuándo sale");
ok(shouldTriggerYouthHousing(mk(), []), "con 17 años, unos turnos después de llegar al club: sí");
ok(!shouldTriggerYouthHousing(mk({ week: 120 }), []), "con 28 años: no");
ok(!shouldTriggerYouthHousing(mk({}, { vivienda_joven_club: "Real Madrid" }), []), "ya elegido en este club: no");
ok(!shouldTriggerYouthHousing(mk(), [youthHousingId("Real Madrid")]), "ya vivida esta escena: no");
ok(!shouldTriggerYouthHousing(mk({}, { alquiler: JSON.stringify({ name: "x", monthly: 500, city: "Madrid", since: 12 }) }), []), "ya tienes un alquiler: no");
ok(!shouldTriggerYouthHousing(mk({ week: 15 }, { club_since: "15" }), []), "el mismo turno de llegar: no (primero la presentación)");
ok(shouldTriggerYouthHousing(mk({ club: "Liverpool FC" }, { vivienda_joven_club: "Real Madrid" }), []), "en un club nuevo, otra vez");

console.log("2) La escena");
const ev = await buildYouthHousingEvent(mk(), chain);
ok(ev.options.length === 5 && ["club", "resi", "compartido", "propio", "padres"].every((id) => ev.options.some((o) => o.id === id)), "ofrece residencia del club, residencia de estudiantes, piso compartido, estudio propio y casa de tus padres");
ok(!/undefined|NaN|\[object|\{[a-z]+\}/.test(JSON.stringify(ev)), "sin textos rotos");
const resi = ev.options.find((o) => o.id === "resi")!;
const rent = readRent({ alquiler: String(resi.consequences.flags?.alquiler) });
ok(!!rent && rent.monthly > 0 && rent.monthly <= 650 && /Madrid/.test(rent.city), `la residencia deja un alquiler real: ${rent?.name} · ${rent?.monthly} €/mes`);
ok(ev.options.find((o) => o.id === "club")!.consequences.flags?.alquiler === "", "la residencia del club no cuesta nada");
ok(ev.options.every((o) => o.consequences.flags?.vivienda_joven_club === "Real Madrid"), "cualquier elección anota el club para no preguntar dos veces");
const adulto = await buildYouthHousingEvent(mk({ week: 40 }, { club_changes: "3" }), chain);
ok(!adulto.options.some((o) => o.id === "padres"), "con varios clubes a cuestas ya no se ofrece seguir con tus padres");
const caro = await buildYouthHousingEvent(mk({}, {}), chain);
const baratas = [...STUDENT_RESIDENCES, ...SHARED_FLATS].every((l) => l.min >= 250 && l.max <= 700);
ok(baratas && YOUTH_FLATS.every((l) => l.min >= 500 && l.max <= 1000), "los precios son de chaval: residencias y pisos compartidos de 250 a 700 €, estudios de 500 a 1.000 €");
void caro;

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
