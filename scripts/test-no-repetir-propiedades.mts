/** Prueba sin IA: lo que ya es tuyo (casa, coche, moto…) no se te vuelve a ofrecer, ni con el nombre de otra ciudad. */
import { withoutOwned, localizeListing, HOME_LISTINGS, CAR_LISTINGS } from "../src/lib/narrative/events";
import { MOTO_LISTINGS } from "../src/lib/narrative/listings-extra";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const own = (names: string[]): any => ({
  flags: Object.fromEntries(names.map((n, i) => [`propiedad_${i}`, JSON.stringify({ name: n, price: 100000, downPayment: 20000, since: 10 })])),
});

console.log("1) Sin propiedades no cambia nada");
ok(withoutOwned(CAR_LISTINGS, { flags: {} }).length === CAR_LISTINGS.length, "catálogo entero");

console.log("2) Un coche que ya tienes desaparece de la oferta, también si lo compraste con el sello de otra ciudad");
const car = CAR_LISTINGS[0];
const withCar = own([localizeListing(car, "Liverpool").name]);
const left = withoutOwned(CAR_LISTINGS, withCar);
ok(left.length === CAR_LISTINGS.length - 1 && !left.some((l) => l.name === car.name), "el coche de Liverpool ya no sale como «" + car.name + "» en Madrid");
const localizedLeft = withoutOwned(CAR_LISTINGS.map((l) => localizeListing(l, "Madrid")), withCar);
ok(!localizedLeft.some((l) => l.name.startsWith(car.name)), "ni con el sello de Madrid");

console.log("3) Casas y motos igual");
const home = HOME_LISTINGS[3];
ok(!withoutOwned(HOME_LISTINGS, own([home.name])).some((l) => l.name === home.name), "la casa que tienes no vuelve");
ok(!withoutOwned(MOTO_LISTINGS, own([MOTO_LISTINGS[0].name])).some((l) => l.name === MOTO_LISTINGS[0].name), "la moto que tienes no vuelve");

console.log("4) Si no queda nada que ofrecer, se deja el catálogo (no se queda la escena vacía)");
const all = own(HOME_LISTINGS.map((l) => l.name));
ok(withoutOwned(HOME_LISTINGS, all, 3).length === HOME_LISTINGS.length, "con todo comprado vuelve al catálogo");
const almost = own(HOME_LISTINGS.slice(0, HOME_LISTINGS.length - 2).map((l) => l.name));
ok(withoutOwned(HOME_LISTINGS, almost, 3).length === HOME_LISTINGS.length, "si quedan menos de las que pide la escena, también");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
