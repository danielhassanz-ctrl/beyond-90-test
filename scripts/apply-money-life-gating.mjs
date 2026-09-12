import fs from "node:fs";

const file = "src/game/finance.ts";
let src = fs.readFileSync(file, "utf8");

if (!src.includes('import { plausibleMoneyScale } from "./career-life";')) {
  src = src.replace(
    'import { clubById } from "./data";\n',
    'import { plausibleMoneyScale } from "./career-life";\nimport { clubById } from "./data";\n',
  );
}

const marker = 'const SPONSORS = ["Puma", "Adidas", "Nike", "New Balance", "Under Armour"];';
const helper = `const MONEY_SCALE_OFFERS: Record<ReturnType<typeof plausibleMoneyScale>, ReadonlySet<string>> = {\n  youth: new Set(["piso_alquiler"]),\n  pro: new Set(["piso_alquiler", "coche", "piso_propio", "ayuda_familia", "fondo"]),\n  star: new Set(["piso_alquiler", "coche", "piso_propio", "ayuda_familia", "negocio_amigo", "casa_grande", "coche_absurdo", "restaurante", "fondo"]),\n  superstar: new Set(["piso_alquiler", "coche", "piso_propio", "ayuda_familia", "negocio_amigo", "casa_grande", "mansion", "coche_absurdo", "restaurante", "fondo"]),\n};\n\nfunction lifestyleOfferAllowed(s: GameState, offerId: string): boolean {\n  const scale = plausibleMoneyScale(s);\n  if (!MONEY_SCALE_OFFERS[scale].has(offerId)) return false;\n\n  // Age is a hard chronology gate. Rich academy saves and corrupted/high-stat\n  // test states must still live like minors instead of buying adult assets.\n  if (s.age < 18 && offerId !== "piso_alquiler") return false;\n  if (s.age < 19 && ["piso_propio", "ayuda_familia", "fondo"].includes(offerId)) return false;\n  if (s.age < 21 && ["negocio_amigo", "casa_grande", "coche_absurdo", "restaurante", "mansion"].includes(offerId)) return false;\n  if (offerId === "mansion" && scale !== "superstar") return false;\n  return true;\n}\n\n${marker}`;

if (!src.includes("const MONEY_SCALE_OFFERS:")) {
  if (!src.includes(marker)) throw new Error("SPONSORS marker not found");
  src = src.replace(marker, helper);
}

const oldFilter = `  const candidates = OFFERS.filter((o) => {\n    const minimumUpfront = o.financeable ? Math.round(o.price / 2) : o.price;\n    return !f.boughtIds.includes(o.id) && f.cash >= Math.max(o.minCash, minimumUpfront) && (!o.requires || o.requires(s));\n  });`;
const newFilter = `  const candidates = OFFERS.filter((o) => {\n    const minimumUpfront = o.financeable ? Math.round(o.price / 2) : o.price;\n    return (\n      lifestyleOfferAllowed(s, o.id) &&\n      !f.boughtIds.includes(o.id) &&\n      f.cash >= Math.max(o.minCash, minimumUpfront) &&\n      (!o.requires || o.requires(s))\n    );\n  });`;

if (src.includes(oldFilter)) src = src.replace(oldFilter, newFilter);
else if (!src.includes("lifestyleOfferAllowed(s, o.id)")) throw new Error("moneyCard candidate filter not found");

fs.writeFileSync(file, src);
console.log("Applied career-status and age gates to Life/Patrimony offers.");
