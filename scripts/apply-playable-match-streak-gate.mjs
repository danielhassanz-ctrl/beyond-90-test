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
      return touch(s);
    }`,
"match presentation gate",
);

replaceOnce(
`  finishScene(s, event.title, outcomeText, before);
  return touch(s);`,
`  finishScene(s, event.title, outcomeText, before);
  s.flags["playable_match_streak"] = 0;
  return touch(s);`,
"resolveEvent streak reset",
);

replaceOnce(
`  finishScene(s, event.title, `${'${reaction} (${interp.label})'}`, before);
  return touch(s);`,
`  finishScene(s, event.title, `${'${reaction} (${interp.label})'}`, before);
  s.flags["playable_match_streak"] = 0;
  return touch(s);`,
"resolveEventFree streak reset",
);

replaceOnce(
`  note(s, `${'${result.title}: ${result.text}'}`, result.tone === "gold" ? "gold" : result.tone);
  return touch(s);`,
`  note(s, `${'${result.title}: ${result.text}'}`, result.tone === "gold" ? "gold" : result.tone);
  s.flags["playable_match_streak"] = 0;
  return touch(s);`,
"resolveDynamic streak reset",
);

replaceOnce(
`  note(
    s,
    `${'${final.ctx.competition} · ${final.ctx.homeTeam} ${final.ctx.isHome ? final.goalsFor : final.goalsAgainst}-${final.ctx.isHome ? final.goalsAgainst : final.goalsFor} ${final.ctx.awayTeam}${final.minutes ? ` (${final.minutes}\', ${final.rating.toFixed(1)})` : " (sin minutos)"}'}`,
    won ? "good" : drew ? "neutral" : "bad",
  );
  return touch(s);`,
`  note(
    s,
    `${'${final.ctx.competition} · ${final.ctx.homeTeam} ${final.ctx.isHome ? final.goalsFor : final.goalsAgainst}-${final.ctx.isHome ? final.goalsAgainst : final.goalsFor} ${final.ctx.awayTeam}${final.minutes ? ` (${final.minutes}\', ${final.rating.toFixed(1)})` : " (sin minutos)"}'}`,
    won ? "good" : drew ? "neutral" : "bad",
  );
  s.flags["playable_match_streak"] = (s.flags["playable_match_streak"] ?? 0) + 1;
  return touch(s);`,
"resolveMatch streak increment",
);

fs.writeFileSync(file, src);
console.log("Applied max-two consecutive playable match gate.");
