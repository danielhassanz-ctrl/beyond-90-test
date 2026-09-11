import fs from "node:fs";

const file = "src/game/engine.ts";
let src = fs.readFileSync(file, "utf8");

function replaceOnce(oldText, newText, label) {
  if (src.includes(newText)) return;
  if (!src.includes(oldText)) throw new Error(`Missing ${label}`);
  src = src.replace(oldText, newText);
}

replaceOnce(
`    if (slot.kind === "match") {
      if (s.injury) {
        applyRun(s, 3);
        continue;
      }
      s.pending = { type: "match", match: simulateMatch(s, slot, s.beat) };
      return touch(s);
    }`,
`    if (slot.kind === "match") {
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
    }`,
"match presentation gate",
);

replaceOnce(
`    const cons = consequenceCard(s);
    if (cons) {
      s.pending = cons;
      return touch(s);
    }`,
`    const cons = consequenceCard(s);
    if (cons) {
      s.pending = cons;
      s.flags["playable_match_streak"] = 0;
      return touch(s);
    }`,
"consequence reset",
);

replaceOnce(
`    const thread = dueThread(s);
    if (thread) {
      s.pending = dyn("thread", {`,
`    const thread = dueThread(s);
    if (thread) {
      s.flags["playable_match_streak"] = 0;
      s.pending = dyn("thread", {`,
"thread reset",
);

replaceOnce(
`    const dirCard = directorCard(s);
    if (dirCard) {
      s.pending = dirCard;
      return touch(s);
    }`,
`    const dirCard = directorCard(s);
    if (dirCard) {
      s.pending = dirCard;
      s.flags["playable_match_streak"] = 0;
      return touch(s);
    }`,
"director reset",
);

replaceOnce(
`    const card = agentCard(s);
    if (card) {
      s.pending = card;
      return touch(s);
    }`,
`    const card = agentCard(s);
    if (card) {
      s.pending = card;
      s.flags["playable_match_streak"] = 0;
      return touch(s);
    }`,
"agent reset",
);

fs.writeFileSync(file, src);
console.log("Applied max-two consecutive playable match gate.");
