import fs from "node:fs";

const narrativeSources = [
  "../src/game/dynamic.ts",
  "../src/game/opening.ts",
  "../src/game/career-life.ts",
  "../src/game/threads.ts",
];

const weekday = /\b(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/giu;
const allowedCalendarEvidence = /calendar|calendario|weekday|dayOfWeek|fecha|date/iu;

const hits: string[] = [];
for (const relativePath of narrativeSources) {
  const url = new URL(relativePath, import.meta.url);
  if (!fs.existsSync(url)) continue;
  const source = fs.readFileSync(url, "utf8");
  source.split("\n").forEach((line, index) => {
    if (weekday.test(line) && !allowedCalendarEvidence.test(line)) {
      hits.push(`${relativePath}:${index + 1}: ${line.trim()}`);
    }
    weekday.lastIndex = 0;
  });
}

if (hits.length) {
  throw new Error(
    "Narrative chronology names a weekday without explicit calendar evidence:\n" +
      hits.join("\n"),
  );
}

console.log("Narrative weekday chronology smoke passed across narrative sources.");
