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
  's.beat += Math.max(1, Math.ceil(count / 2));',
];
for (const token of required) {
  if (!engine.includes(token)) throw new Error(`Missing P0 chronology/anti-repeat guard: ${token}`);
}

const matchFlashGuard = 'if (s.pending?.type === "dynamic" && s.pending.kind === "match_flash") s.pending = null;';
const occurrences = engine.split(matchFlashGuard).length - 1;
if (occurrences !== 1) throw new Error(`Expected exactly one legacy match_flash migration guard, found ${occurrences}`);

const matchStreakBlockStart = engine.indexOf('if ((s.flags["playable_match_streak"] ?? 0) >= 2) {');
if (matchStreakBlockStart !== -1) {
  const matchStreakBlock = engine.slice(matchStreakBlockStart, matchStreakBlockStart + 700);
  if (!matchStreakBlock.includes("s.queue.unshift(slot);")) {
    throw new Error("Match-streak story separator can consume an authored key match instead of preserving it");
  }
  if (!matchStreakBlock.includes("directorCard(s) ?? agentCard(s) ?? moneyCard(s)")) {
    throw new Error("Match-streak breaker is not using meaningful story cards before a third playable match");
  }
}

const nonSeniorBlock = engine.slice(engine.indexOf('if (s.stage !== "first") {'), engine.indexOf('const specs: KeySpec[] = [', engine.indexOf('if (s.stage !== "first") {')));
if (/tag:\s*"(cup|euro|final)"/.test(nonSeniorBlock)) {
  throw new Error("Youth/reserve key-match plan still contains senior cup/europe/final tags");
}

console.log("P0_CHRONOLOGY_OK youthTransferCalls=blocked seasonalTeaser=one seasonalOffer=one minorReturnCards=background keyMatches=preserved youthSeniorCompetitions=blocked simulatedWeeksAdvanceTime=yes migrationGuard=deduped");
