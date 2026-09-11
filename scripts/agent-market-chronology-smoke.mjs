import fs from "node:fs";

const engine = fs.readFileSync("src/game/engine.ts", "utf8");

const required = [
  'const marketReady = s.stage !== "youth" && s.age >= 18 && totalApps(s) >= 10;',
  's.flags["agent_teaser_season"] !== s.seasonIndex',
  's.flags["agent_offer_season"] === s.seasonIndex',
  's.flags["agent_commission_season"] !== s.seasonIndex',
  's.flags["volvio_pendiente"] = recoveredSeverity === "minor" ? 0 : 1;',
  'if (s.stage !== "first") {',
  'const developmental: KeySpec[] = [',
];
for (const token of required) {
  if (!engine.includes(token)) throw new Error(`Missing P0 chronology/anti-repeat guard: ${token}`);
}

const matchFlashGuard = 'if (s.pending?.type === "dynamic" && s.pending.kind === "match_flash") s.pending = null;';
const occurrences = engine.split(matchFlashGuard).length - 1;
if (occurrences !== 1) throw new Error(`Expected exactly one legacy match_flash migration guard, found ${occurrences}`);

if (engine.includes('playable_match_streak')) {
  throw new Error("Authored key matches are still being silently suppressed by playable_match_streak state");
}

const nonSeniorBlock = engine.slice(engine.indexOf('if (s.stage !== "first") {'), engine.indexOf('const specs: KeySpec[] = [', engine.indexOf('if (s.stage !== "first") {')));
if (/tag:\s*"(cup|euro|final)"/.test(nonSeniorBlock)) {
  throw new Error("Youth/reserve key-match plan still contains senior cup/europe/final tags");
}

console.log("P0_CHRONOLOGY_OK youthTransferCalls=blocked seasonalTeaser=one seasonalOffer=one minorReturnCards=background keyMatches=preserved youthSeniorCompetitions=blocked migrationGuard=deduped");
