import fs from "node:fs";
import path from "node:path";

const gameDir = new URL("../src/game/", import.meta.url);
// Cover every source that can directly emit player-facing story, match, life,
// finance, career progression or post-career copy. Calendar/data helpers stay
// excluded because weekday names there can be legitimate implementation data.
const narrativeFile = /^(?:archetype|bank-|events-|director|dynamic|opening|career(?:-life)?|threads|consequences|engine|story(?:-alt)?|match|finance|postcareer|memory-return|interpret|money-gating|mutate|narrative-safety|npc|pacing).*\.tsx?$/u;
const narrativeSources = fs
  .readdirSync(gameDir)
  .filter((name) => narrativeFile.test(name))
  .map((name) => `../src/game/${name}`);

if (narrativeSources.length === 0) {
  throw new Error("Narrative chronology gate scanned zero sources; source discovery has drifted.");
}

// Beyond 90 is Spanish-first, but English copy can enter through helpers or
// future content. A named weekday in either language is equally dangerous if
// the engine has no calendar evidence to support it.
const weekday = /\b(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/giu;
const calendarEvidence = /\b(?:calendar|calendario|weekday|dayOfWeek|fecha|date)\b/iu;
// Only syntax that cannot itself become player-facing copy is exempt. Do not
// exempt constants merely because their identifier contains "date", "weekday"
// or "calendar": a dateCopy-style constant can still contain unsupported
// narrative such as "el viernes" and must be caught by this gate.
const nonPlayerText = /^\s*(?:\/\/|\*|\/\*|type\s+|interface\s+)/iu;

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
