import fs from "node:fs";

const file = "src/game/match.ts";
let src = fs.readFileSync(file, "utf8");
const oldLine = '  const keyMoment = minutes >= 30 && Math.random() < 0.6 ? { ...pick(KEY_MOMENTS) } : undefined;';
const replacement = `  // A key-match decision is authored narrative, not renewable filler. Once a\n  // choice set has appeared in this career it cannot be selected again. If the\n  // small authored pool is exhausted, the match simply has no key decision.\n  let keyMoment: KeyMoment | undefined;\n  if (minutes >= 30 && Math.random() < 0.6) {\n    const unseen = KEY_MOMENTS\n      .map((moment, index) => ({ moment, index }))\n      .filter(({ index }) => !state.seenEvents.includes(\`key_moment_\${index}\`));\n    if (unseen.length > 0) {\n      const chosen = pick(unseen);\n      state.seenEvents.push(\`key_moment_\${chosen.index}\`);\n      keyMoment = { ...chosen.moment, options: chosen.moment.options.map((option) => ({ ...option })) };\n    }\n  }`;

if (src.includes(replacement)) {
  console.log("Key-moment anti-repeat already applied");
  process.exit(0);
}
if (!src.includes(oldLine)) throw new Error("Expected keyMoment selector not found");
src = src.replace(oldLine, replacement);
fs.writeFileSync(file, src);
console.log("Applied lifetime anti-repeat to generic key-match decision templates.");
