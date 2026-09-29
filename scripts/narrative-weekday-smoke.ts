import fs from "node:fs";
import path from "node:path";

const gameDir = new URL("../src/game/", import.meta.url);
// Cover every source that can directly emit player-facing story, match, life,
// finance or post-career copy. Calendar/data helpers stay excluded because
// weekday names there can be legitimate implementation data.
const narrativeFile = /^(?:bank-|events-|director|dynamic|opening|career-life|threads|consequences|engine|story(?:-alt)?|match|finance|postcareer|memory-return).*\.ts$/u;
const narrativeSources = fs
  .readdirSync(gameDir)
  .filter((name) => narrativeFile.test(name))
  .map((name) => `../src/game/${name}`);

const weekday = /\b(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/giu;
const calendarEvidence = /\b(?:calendar|calendario|weekday|dayOfWeek|fecha|date)\b/iu;
const nonPlayerText = /^\s*(?:\/\/|\*|\/\*|const\s+\w*(?:weekday|calendar|date)|type\s+|interface\s+)/iu;

const hits: string[] = [];
for (const relativePath of narrativeSources) {
  const url = new URL(relativePath, import.meta.url);
  const source = fs.readFileSync(url, "utf8");
  source.split("\n").forEach((line, index) => {
    weekday.lastIndex = 0;
    const namesWeekday = weekday.test(line);
    weekday.lastIndex = 0;
    if (namesWeekday && !calendarEvidence.test(line) && !nonPlayerText.test(line)) {
      hits.push(`${relativePath}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (hits.length) {
  throw new Error(
    "Narrative chronology names a weekday without explicit calendar evidence:\n" +
      hits.join("\n"),
  );
}

console.log(
  `Narrative weekday chronology smoke passed across ${narrativeSources.length} narrative-bearing sources under ${path.basename(new URL("../src/game/", import.meta.url).pathname)}.`,
);
