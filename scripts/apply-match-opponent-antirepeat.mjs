import fs from "node:fs";

const file = "src/game/match.ts";
let src = fs.readFileSync(file, "utf8");
const oldLine = '  const ctx = makeContext(state, slot, index);';
const replacement = `  let ctx = makeContext(state, slot, index);\n  // Key matches should not feel like the fixture generator is stuck. Avoid\n  // surfacing the same opponent twice in the same season when an alternative\n  // valid context exists. Real repeat meetings remain possible in later years.\n  for (let retry = 0; retry < 6 && state.seenEvents.includes(\`match_opponent:\${state.seasonIndex}:\${ctx.opponent}\`); retry += 1) {\n    ctx = makeContext(state, slot, index + retry + 1);\n  }\n  const opponentMarker = \`match_opponent:\${state.seasonIndex}:\${ctx.opponent}\`;\n  if (!state.seenEvents.includes(opponentMarker)) state.seenEvents.push(opponentMarker);`;

if (src.includes(replacement)) {
  console.log("Match-opponent anti-repeat already applied");
  process.exit(0);
}
if (!src.includes(oldLine)) throw new Error("Expected match context selector not found");
src = src.replace(oldLine, replacement);
fs.writeFileSync(file, src);
console.log("Applied same-season key-match opponent anti-repeat.");
