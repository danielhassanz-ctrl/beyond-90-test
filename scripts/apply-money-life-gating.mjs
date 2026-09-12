import fs from "node:fs";

const file = "src/game/finance.ts";
let src = fs.readFileSync(file, "utf8");

// Keep one source of truth for age/status chronology. finance.ts should consume
// money-gating.ts instead of duplicating scale tables and age rules locally.
if (!src.includes('import { moneyOfferAllowed, sponsorshipAllowed } from "./money-gating";')) {
  src = src.replace(
    'import { clubById } from "./data";\n',
    'import { clubById } from "./data";\nimport { moneyOfferAllowed, sponsorshipAllowed } from "./money-gating";\n',
  );
}

// Remove the temporary duplicated helper if an earlier run injected it.
const duplicateStart = src.indexOf('const MONEY_SCALE_OFFERS:');
const sponsorsMarker = 'const SPONSORS = ["Puma", "Adidas", "Nike", "New Balance", "Under Armour"];';
if (duplicateStart >= 0) {
  const sponsorsAt = src.indexOf(sponsorsMarker, duplicateStart);
  if (sponsorsAt < 0) throw new Error("SPONSORS marker not found after duplicated helper");
  src = src.slice(0, duplicateStart) + src.slice(sponsorsAt);
}
src = src.replace('import { plausibleMoneyScale } from "./career-life";\n', '');

const sponsorOld = 'if (!f.sponsorName && s.fame >= 32 && s.stage !== "youth" && Math.random() < 0.5) {';
const sponsorNew = 'if (!f.sponsorName && s.fame >= 32 && sponsorshipAllowed(s) && Math.random() < 0.5) {';
if (src.includes(sponsorOld)) src = src.replace(sponsorOld, sponsorNew);
else if (!src.includes('sponsorshipAllowed(s)')) throw new Error("sponsorship gate not found");

const oldFilter = `  const candidates = OFFERS.filter((o) => {\n    const minimumUpfront = o.financeable ? Math.round(o.price / 2) : o.price;\n    return !f.boughtIds.includes(o.id) && f.cash >= Math.max(o.minCash, minimumUpfront) && (!o.requires || o.requires(s));\n  });`;
const duplicatedFilter = `  const candidates = OFFERS.filter((o) => {\n    const minimumUpfront = o.financeable ? Math.round(o.price / 2) : o.price;\n    return (\n      lifestyleOfferAllowed(s, o.id) &&\n      !f.boughtIds.includes(o.id) &&\n      f.cash >= Math.max(o.minCash, minimumUpfront) &&\n      (!o.requires || o.requires(s))\n    );\n  });`;
const newFilter = `  const candidates = OFFERS.filter((o) => {\n    const minimumUpfront = o.financeable ? Math.round(o.price / 2) : o.price;\n    return (\n      moneyOfferAllowed(s, o.id) &&\n      !f.boughtIds.includes(o.id) &&\n      f.cash >= Math.max(o.minCash, minimumUpfront) &&\n      (!o.requires || o.requires(s))\n    );\n  });`;

if (src.includes(oldFilter)) src = src.replace(oldFilter, newFilter);
else if (src.includes(duplicatedFilter)) src = src.replace(duplicatedFilter, newFilter);
else if (!src.includes("moneyOfferAllowed(s, o.id)")) throw new Error("moneyCard candidate filter not found");

fs.writeFileSync(file, src);
console.log("Applied canonical age/status gates to Life/Patrimony and sponsorship offers.");
