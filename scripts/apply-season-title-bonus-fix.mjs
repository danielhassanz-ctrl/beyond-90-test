import fs from "node:fs";

const financePath = "src/game/finance.ts";
const enginePath = "src/game/engine.ts";

let finance = fs.readFileSync(financePath, "utf8");
let engine = fs.readFileSync(enginePath, "utf8");

const oldSignature = "export function seasonFinance(s: GameState): { income: number; spend: number; net: number; text: string } {";
const newSignature = "export function seasonFinance(s: GameState, seasonTitleCount = 0): { income: number; spend: number; net: number; text: string } {";
const oldBonus = "const bonuses = Math.round(apps * (2 + s.overall / 40) + goals * 4 + (s.titles?.length ?? 0) * 15);";
const newBonus = "const bonuses = Math.round(apps * (2 + s.overall / 40) + goals * 4 + Math.max(0, seasonTitleCount) * 15);";
const oldCall = "const fin = seasonFinance(s);";
const newCall = "const fin = seasonFinance(s, honours.titles.length);";

if (!finance.includes(newSignature)) {
  if (!finance.includes(oldSignature)) throw new Error("seasonFinance signature marker not found");
  finance = finance.replace(oldSignature, newSignature);
}
if (!finance.includes(newBonus)) {
  if (!finance.includes(oldBonus)) throw new Error("season bonus marker not found");
  finance = finance.replace(oldBonus, newBonus);
}
if (!engine.includes(newCall)) {
  if (!engine.includes(oldCall)) throw new Error("seasonFinance call marker not found");
  engine = engine.replace(oldCall, newCall);
}

fs.writeFileSync(financePath, finance);
fs.writeFileSync(enginePath, engine);
console.log("Applied current-season-only title bonus accounting.");
