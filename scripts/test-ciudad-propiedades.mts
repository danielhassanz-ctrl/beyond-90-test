/** Prueba sin IA: las propiedades conservan su ciudad al cambiar de club. */
import { stampPropertyCities, repairPropertyCities } from "../src/lib/finance/property-city";
import { readProperties, serializeProperty } from "../src/lib/finance/mortgage";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

const yate = { name: "Yate de lujo", price: 1150000, downPayment: 300000, since: 45, kind: "yate" as const };
const piso = { name: "Piso", price: 120000, downPayment: 24000, since: 20, city: "Múnich" };
const flags: any = { club_since: "42", propiedad_a: JSON.stringify(yate), propiedad_b: serializeProperty({ key: "propiedad_b", ...piso }) };

console.log("1) Al dejar el Liverpool se anota la ciudad de lo comprado allí");
const patch = stampPropertyCities(flags, "Liverpool FC");
ok(Object.keys(patch).length === 1 && JSON.parse(String(patch.propiedad_a)).city === "Liverpool", "el yate (comprado en el Liverpool) queda en Liverpool; el piso, que ya tenía ciudad, no se toca");

console.log("2) Recuperar la ciudad de compras antiguas con los fichajes");
const rows = [
  { week: 1, consequences: { club: "Bayern de Múnich" } },
  { week: 41, consequences: { club: "Liverpool FC" } },
  { week: 56, consequences: { club: "Real Madrid" } },
];
let saved: any = null;
const fake: any = {
  from: () => {
    const chain: any = new Proxy({}, {
      get: (_t, prop) => {
        if (prop === "range") return () => Promise.resolve({ data: rows, error: null });
        if (prop === "maybeSingle") return () => Promise.resolve({ data: { flags }, error: null });
        if (prop === "update") return (v: any) => { saved = v; return chain; };
        if (prop === "select") return () => chain;
        if (prop === "then") return undefined;
        return () => chain;
      },
    });
    chain.select = () => Object.assign(Promise.resolve({ data: [{ id: "p" }], error: null }), { eq: () => chain });
    return chain;
  },
};
const player: any = { id: "p", club: "Real Madrid", flags: { ...flags, club_since: "56", clubs_history: "Bayern de Múnich|Liverpool FC" } };
const okRepair = await repairPropertyCities(fake, player);
void okRepair;
const props = readProperties(saved?.flags ?? player.flags);
const y = props.find((p) => p.name === "Yate de lujo");
ok(y?.city === "Liverpool", `el yate comprado en la semana 45 estando en el Liverpool: ${y?.city}`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
