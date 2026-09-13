import fs from "node:fs";

const path = "src/game/consequences.ts";
const source = fs.readFileSync(path, "utf8");

const before = `    case "cons_family_break": {\n      const partner = ensureCareerCast(s).partner;\n      const familyPressure = partner.met\n        ? \`Tres meses sin aparecer por casa. Tu madre deja de llamar y \${partner.name} te dice lo que nadie del club se atreve a decirte.\`\n        : "Tres meses sin aparecer por casa. Tu madre deja de llamar y tu familia termina diciéndote claramente que el fútbol no puede justificar desaparecer de sus vidas.";`;

const after = `    case "cons_family_break": {\n      const partner = ensureCareerCast(s).partner;\n      const clubCity = clubById(s.clubId).city;\n      const normalizePlace = (value: string) =>\n        value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim().toLowerCase();\n      const movedAway = normalizePlace(s.player.city) !== normalizePlace(clubCity);\n      const familyBase =\n        s.age <= 18 && !movedAway\n          ? "Llevas semanas llegando tarde a casa, comiendo con prisas y contestando con monosílabos. Tu familia termina diciéndote claramente que el fútbol no puede justificar desaparecer incluso cuando sigues viviendo con ellos."\n          : s.age <= 18\n            ? \`Desde que te mudaste de \${s.player.city} a \${clubCity}, las llamadas a casa duran cada vez menos y empiezas a evitar contar cómo estás de verdad. Tu familia te dice que la distancia no puede convertirse en silencio.\`\n            : "Tres meses sin aparecer por casa. Tu madre deja de llamar y tu familia termina diciéndote claramente que el fútbol no puede justificar desaparecer de sus vidas.";\n      const familyPressure = partner.met\n        ? \`\${familyBase} \${partner.name} también te dice lo que nadie del club se atreve a decirte.\`\n        : familyBase;`;

if (!source.includes(before)) {
  throw new Error("family chronology target block not found; refusing unsafe rewrite");
}

const next = source.replace(before, after);
fs.writeFileSync(path, next);
console.log("Applied youth/home-vs-relocation family consequence chronology fix.");
