import fs from "node:fs";

const file = "src/game/engine.ts";
let src = fs.readFileSync(file, "utf8");

const gatedMatch = `    if (slot.kind === "match") {
      if (s.injury) {
        applyRun(s, 3);
        continue;
      }
      // Two football decisions in a row is enough. If narrative has not had
      // room to breathe yet, this fixture happens in the background instead
      // of becoming a third consecutive match card.
      if ((s.flags["playable_match_streak"] ?? 0) >= 2) {
        applyRun(s, 1);
        continue;
      }
      s.pending = { type: "match", match: simulateMatch(s, slot, s.beat) };
      s.flags["playable_match_streak"] = (s.flags["playable_match_streak"] ?? 0) + 1;
      return touch(s);
    }`;

const keyMatch = `    if (slot.kind === "match") {
      if (s.injury) {
        applyRun(s, 3);
        continue;
      }
      // Slots marked as key matches are already sparse and separated by
      // narrative/simulation slots in makeSeasonPlan. Do not silently erase
      // them just because an optional narrative slot failed to surface a card.
      // Repetition is controlled by one-shot key moments and opponent guards.
      s.pending = { type: "match", match: simulateMatch(s, slot, s.beat) };
      return touch(s);
    }`;

if (src.includes(gatedMatch)) src = src.replace(gatedMatch, keyMatch);
else if (!src.includes(keyMatch)) throw new Error("Expected playable-match gate not found");

// Streak bookkeeping existed only to suppress authored key matches. Remove it
// from narrative branches so it cannot become stale state in old/new saves.
src = src.replaceAll('      s.flags["playable_match_streak"] = 0;\n', '');

fs.writeFileSync(file, src);
console.log("Applied P0: preserve 6-7 authored key matches; repetition remains controlled by key-moment/opponent anti-repeat.");
