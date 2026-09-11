import fs from "node:fs";

const file = "src/game/engine.ts";
let src = fs.readFileSync(file, "utf8");
const oldBlock = `    if (s.injury && !s.injury.treated) {
      s.pending = dyn("injury_diagnosis", {
        label: s.injury.label,
        severity: s.injury.severity,
        matchesOut: s.injury.matchesOut,
      });
      return touch(s);
    }`;
const newBlock = `    if (s.injury && !s.injury.treated) {
      // A second minor knock in the same season is medical routine, not another
      // identical player decision. Surface the first diagnosis; subsequent minor
      // injuries are treated in the background unless severity escalates.
      if (s.injury.severity === "minor" && s.flags["minor_injury_card_season"] === s.seasonIndex) {
        s.injury.treated = true;
        note(s, \`Parte médico: \${s.injury.label}. Tratamiento rutinario, sin nueva decisión.\`, "neutral");
        continue;
      }
      if (s.injury.severity === "minor") s.flags["minor_injury_card_season"] = s.seasonIndex;
      s.pending = dyn("injury_diagnosis", {
        label: s.injury.label,
        severity: s.injury.severity,
        matchesOut: s.injury.matchesOut,
      });
      s.flags["playable_match_streak"] = 0;
      return touch(s);
    }`;
if (src.includes(newBlock)) {
  console.log("Minor injury card dedupe already applied");
  process.exit(0);
}
if (!src.includes(oldBlock)) throw new Error("Expected injury diagnosis block not found");
src = src.replace(oldBlock, newBlock);
fs.writeFileSync(file, src);
console.log("Applied same-season minor injury decision dedupe.");
