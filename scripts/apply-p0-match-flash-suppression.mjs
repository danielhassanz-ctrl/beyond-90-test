import fs from "node:fs";

const file = "src/game/engine.ts";
let src = fs.readFileSync(file, "utf8");

const before = src;

// A simulated block is background. It may update state/logs, but it must never
// become a reusable generic decision card. Authored consequences belong in the
// Story Director / relationship consequence systems instead.
src = src.replace(
  /    if \(slot\.kind === "sim"\) \{[\s\S]*?      continue; \/\/ sin escena: el siguiente clic lleva a una decisión real\n    \}/,
  `    if (slot.kind === "sim") {\n      const run = applyRun(s, slot.matches ?? 3);\n      if (run.notable) {\n        note(s, run.notable.text, ["red", "snub", "crisis", "bad", "injury"].includes(run.notable.kind) ? "bad" : "good");\n      }\n      // Los bloques simulados son contexto estadístico, no decisiones.\n      continue;\n    }`,
);

// Give the scheduler enough room to find an authored decision after skipping
// passive simulation slots. This avoids falling back to filler cards.
src = src.replace("for (let guard = 0; guard < 16; guard++) {", "for (let guard = 0; guard < 64; guard++) {");

// Remove the final generic match_flash fallback entirely. If an unusually long
// stretch contains only passive slots, keep advancing internally until a real
// decision or season boundary is reached.
src = src.replace(
  /  \/\/ RITMO: con el director dosificado,[\s\S]*?  if \(s\.queue\.length > 0\) \{[\s\S]*?    return touch\(s\);\n  \}\n\n  s\.pending = \{ type: "season", summary: closeSeason\(s\) \};/,
  `  // Sin decisión narrativa válida no fabricamos una tarjeta de resumen.\n  // Consumimos calendario y seguimos buscando una decisión real.\n  if (s.queue.length > 0) {\n    applyRun(s, 3);\n    return advance(s);\n  }\n\n  s.pending = { type: "season", summary: closeSeason(s) };`,
);

// Old saves can contain a pending legacy match_flash. Scrub it during migration
// so a fixed build cannot reopen the repetitive card after reload.
src = src.replace(
  '  if (s.pending?.type === "match" && !s.pending.match?.ctx) s.pending = null;\n',
  '  if (s.pending?.type === "match" && !s.pending.match?.ctx) s.pending = null;\n  if (s.pending?.type === "dynamic" && s.pending.kind === "match_flash") s.pending = null;\n',
);

if (src === before) {
  console.log("P0 match-flash suppression already applied or anchors changed.");
  process.exit(0);
}

if (src.includes('s.pending = dyn("match_flash"')) {
  throw new Error("Generic match_flash emission still exists in engine.ts after patch");
}

fs.writeFileSync(file, src);
console.log("Applied P0: simulated runs are background-only; generic match_flash emission removed.");
