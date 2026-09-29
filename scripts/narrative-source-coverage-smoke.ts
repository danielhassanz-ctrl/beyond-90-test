import fs from "node:fs";

const gameDir = new URL("../src/game/", import.meta.url);
const sources = fs.readdirSync(gameDir).filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"));

const narrativePrefixes = [
  "archetype", "bank-", "events-", "events.ts", "director", "dynamic", "opening",
  "career", "threads", "consequences", "engine", "story", "match", "finance",
  "postcareer", "memory-return", "interpret", "money-gating", "mutate",
  "narrative-safety", "npc", "pacing",
];
const explicitlyNonNarrative = new Set([
  "club-identity.ts", "clubs.ts", "competition-calendar.ts", "data.ts",
  "milestone-image-provider.ts", "milestone-visual.ts", "store.tsx", "types.ts",
]);

const unclassified = sources.filter(
  (name) => !narrativePrefixes.some((prefix) => name.startsWith(prefix)) && !explicitlyNonNarrative.has(name),
);

if (unclassified.length) {
  throw new Error(
    "New game sources bypass narrative chronology QA; classify them explicitly:\n" +
      unclassified.join("\n"),
  );
}

console.log(`Narrative source coverage smoke passed across ${sources.length} game sources.`);
