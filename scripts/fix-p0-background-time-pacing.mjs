import fs from "node:fs";

const file = "src/game/engine.ts";
let src = fs.readFileSync(file, "utf8");

const oldHead = `function applyRun(s: GameState, count: number): SimRun {
  const run = simulateRun(s, count);`;
const newHead = `function applyRun(s: GameState, count: number): SimRun {
  // A simulated block represents real weeks of calendar, not zero-time glue.
  // Advancing narrative time here lets the Story Director surface life/club
  // beats between sparse key matches instead of producing football-card runs.
  s.beat += Math.max(1, Math.ceil(count / 2));
  const run = simulateRun(s, count);`;

if (src.includes(newHead)) {
  console.log("Background calendar pacing already applied");
  process.exit(0);
}
if (!src.includes(oldHead)) throw new Error("Expected applyRun head not found");
src = src.replace(oldHead, newHead);
fs.writeFileSync(file, src);
console.log("Applied P0: simulated weeks now advance Story Director time between key matches.");
