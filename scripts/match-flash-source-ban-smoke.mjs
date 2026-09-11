import fs from "node:fs";

const engine = fs.readFileSync("src/game/engine.ts", "utf8");

const banned = [
  'dyn("match_flash"',
  "dyn('match_flash'",
  'kind: "match_flash"',
  "kind: 'match_flash'",
];

for (const token of banned) {
  if (engine.includes(token)) {
    throw new Error(`Playable match_flash emission returned to engine.ts: ${token}`);
  }
}

const simStart = engine.indexOf('if (slot.kind === "sim")');
const matchStart = engine.indexOf('if (slot.kind === "match")', simStart);
if (simStart < 0 || matchStart < 0) throw new Error("Could not locate simulated-block scheduler section");
const simSection = engine.slice(simStart, matchStart);
if (!simSection.includes("continue;")) throw new Error("Simulated blocks must remain background-only");
if (simSection.includes("s.pending =")) throw new Error("Simulated blocks may not create playable pending cards");

console.log("MATCH_FLASH_SOURCE_BAN_OK: simulated blocks cannot emit playable match_flash cards.");
