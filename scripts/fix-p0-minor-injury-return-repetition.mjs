import fs from "node:fs";

const file = "src/game/engine.ts";
let src = fs.readFileSync(file, "utf8");

const oldBlock = `    if (s.injury.matchesOut <= 0) {
      s.flags["volvio_pendiente"] = 1;
      note(s, \`Alta médica: \${s.injury.label} superada.\`, "good");
      s.injury = null;
    }`;

const newBlock = `    if (s.injury.matchesOut <= 0) {
      const recoveredSeverity = s.injury.severity;
      // Routine minor knocks resolve in the background. Repeating an identical
      // "Alta médica" choice after every overload is filler, not narrative.
      // Only medium/severe injuries earn a playable comeback scene.
      s.flags["volvio_pendiente"] = recoveredSeverity === "minor" ? 0 : 1;
      note(s, \`Alta médica: \${s.injury.label} superada.\`, "good");
      s.injury = null;
    }`;

if (src.includes(newBlock)) {
  console.log("Minor-injury return suppression already applied");
  process.exit(0);
}
if (!src.includes(oldBlock)) throw new Error("Expected injury recovery block not found");
src = src.replace(oldBlock, newBlock);
fs.writeFileSync(file, src);
console.log("Applied P0: routine minor injuries no longer generate repeated playable return cards.");
