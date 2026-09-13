import fs from "node:fs";

const path = "src/game/director.ts";
let src = fs.readFileSync(path, "utf8");

const replaceOnce = (before, after, label) => {
  if (src.includes(after)) return;
  if (!src.includes(before)) throw new Error(`Missing patch target: ${label}`);
  src = src.replace(before, after);
};

const marker = "export function directorCard(s: GameState): DynamicCard | null {";
if (!src.includes("function injuryNarrativeCompatible(")) {
  const helper = `function injuryNarrativeCompatible(
  s: GameState,
  family: string,
  image: SceneKey,
  category: EventCategory,
  title: string,
  text: string,
): boolean {
  if (!s.injury) return true;
  if (category === "medical" || image === "injury") return true;
  if (image === "match" || image === "training" || category === "training" || family === "partido" || family === "revelacion") return false;
  const copy = (title + " " + text).toLowerCase();
  return !/(te cambian en|sales? de titular|entras? al campo|debutas?|partidillo|dos actuaciones|rivales? te preparan|te silban al cambiarte|marcas? (?:un )?gol|doble marca|faltas tácticas)/i.test(copy);
}

`;
  if (!src.includes(marker)) throw new Error("directorCard marker not found");
  src = src.replace(marker, helper + marker);
}

replaceOnce(
  'const preBeats = BEATS.filter((b) => b.family === "pretemporada" && !seen(s, b.id) && b.requires(s));',
  `const preBeats = BEATS.filter((b) => {
      if (b.family !== "pretemporada" || seen(s, b.id) || !b.requires(s)) return false;
      const built = b.build(s);
      return injuryNarrativeCompatible(s, b.family, b.image, b.category, built.title, built.text);
    });`,
  "preseason beats",
);

replaceOnce(
  'if (seen(s, `${a.id}_c${a.chapter}`)) return false;\n    if (a.chapter === 0 && familyBlocked(s, ch.family)) return false;',
  `if (seen(s, \`${a.id}_c${a.chapter}\`)) return false;
    const c = ctxOf(s, a);
    if (!injuryNarrativeCompatible(s, ch.family, ch.image, ch.category, ch.title(c), ch.text(c))) return false;
    if (a.chapter === 0 && familyBlocked(s, ch.family)) return false;`,
  "active arc chapter",
);

replaceOnce(
  `if (opened) {
      d.lastArcBeat = beatNow;
      return arcCard(opened);
    }`,
  `if (opened) {
      const arc = arcById(opened.id);
      const ch = arc?.chapters[opened.chapter];
      if (arc && ch) {
        const c = ctxOf(s, opened);
        if (!injuryNarrativeCompatible(s, ch.family, ch.image, ch.category, ch.title(c), ch.text(c))) {
          d.active = d.active.filter((a) => a.id !== opened.id);
          return null;
        }
      }
      d.lastArcBeat = beatNow;
      return arcCard(opened);
    }`,
  "new arc opening",
);

replaceOnce(
  `if (seen(s, b.id) || familyBlocked(s, b.family) || !statusOk(s, b.family) || !b.requires(s)) return false;
    if (!earlyCareer) return true;`,
  `if (seen(s, b.id) || familyBlocked(s, b.family) || !statusOk(s, b.family) || !b.requires(s)) return false;
    const built = b.build(s);
    if (!injuryNarrativeCompatible(s, b.family, b.image, b.category, built.title, built.text)) return false;
    if (!earlyCareer) return true;`,
  "contextual beats",
);

fs.writeFileSync(path, src);
console.log("Applied Story Director injury-availability chronology guard.");
