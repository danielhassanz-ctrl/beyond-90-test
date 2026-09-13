import fs from "node:fs";

const path = "src/game/director.ts";
let src = fs.readFileSync(path, "utf8");

const marker = `export function directorCard(s: GameState): DynamicCard | null {`;
if (!src.includes("function injuryNarrativeCompatible(")) {
  const helper = `function injuryNarrativeCompatible(\n  s: GameState,\n  family: string,\n  image: SceneKey,\n  category: EventCategory,\n  title: string,\n  text: string,\n): boolean {\n  if (!s.injury) return true;\n  if (category === \"medical\" || image === \"injury\") return true;\n  if (image === \"match\" || image === \"training\" || category === \"training\" || family === \"partido\" || family === \"revelacion\") return false;\n  const copy = \\`${title} ${text}\\`.toLowerCase();\n  return !/(te cambian en|sales? de titular|entras? al campo|debutas?|partidillo|dos actuaciones|rivales? te preparan|te silban al cambiarte|marcas? (?:un )?gol|doble marca|faltas tácticas)/i.test(copy);\n}\n\n`;
  if (!src.includes(marker)) throw new Error("directorCard marker not found");
  src = src.replace(marker, helper + marker);
}

src = src.replace(
  `const preBeats = BEATS.filter((b) => b.family === "pretemporada" && !seen(s, b.id) && b.requires(s));`,
  `const preBeats = BEATS.filter((b) => {\n      if (b.family !== "pretemporada" || seen(s, b.id) || !b.requires(s)) return false;\n      const built = b.build(s);\n      return injuryNarrativeCompatible(s, b.family, b.image, b.category, built.title, built.text);\n    });`,
);

src = src.replace(
  `if (seen(s, \\`${a.id}_c${a.chapter}\\`)) return false;\n    if (a.chapter === 0 && familyBlocked(s, ch.family)) return false;`,
  `if (seen(s, \\`${a.id}_c${a.chapter}\\`)) return false;\n    const c = ctxOf(s, a);\n    if (!injuryNarrativeCompatible(s, ch.family, ch.image, ch.category, ch.title(c), ch.text(c))) return false;\n    if (a.chapter === 0 && familyBlocked(s, ch.family)) return false;`,
);

src = src.replace(
  `if (opened) {\n      d.lastArcBeat = beatNow;\n      return arcCard(opened);\n    }`,
  `if (opened) {\n      const arc = arcById(opened.id);\n      const ch = arc?.chapters[opened.chapter];\n      if (arc && ch) {\n        const c = ctxOf(s, opened);\n        if (!injuryNarrativeCompatible(s, ch.family, ch.image, ch.category, ch.title(c), ch.text(c))) {\n          d.active = d.active.filter((a) => a.id !== opened.id);\n          return null;\n        }\n      }\n      d.lastArcBeat = beatNow;\n      return arcCard(opened);\n    }`,
);

src = src.replace(
  `if (seen(s, b.id) || familyBlocked(s, b.family) || !statusOk(s, b.family) || !b.requires(s)) return false;\n    if (!earlyCareer) return true;`,
  `if (seen(s, b.id) || familyBlocked(s, b.family) || !statusOk(s, b.family) || !b.requires(s)) return false;\n    const built = b.build(s);\n    if (!injuryNarrativeCompatible(s, b.family, b.image, b.category, built.title, built.text)) return false;\n    if (!earlyCareer) return true;`,
);

fs.writeFileSync(path, src);
console.log("Applied Story Director injury-availability chronology guard.");
