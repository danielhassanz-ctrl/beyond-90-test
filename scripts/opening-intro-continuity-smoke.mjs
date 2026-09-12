import fs from "node:fs";

const opening = fs.readFileSync("src/game/opening.ts", "utf8");
const people = fs.readFileSync("src/game/events-people.ts", "utf8");

const continuity = [
  ["opening_adviser_choice", "people_adviser_intro"],
  ["opening_named_coach", "people_coach_intro"],
  ["opening_named_captain", "people_captain_intro"],
  ["opening_named_teammate", "people_teammate_intro"],
  ["opening_named_physio", "people_physio_intro"],
];

const missing = [];
for (const [openingId, peopleFlag] of continuity) {
  if (!opening.includes(`id: \"${openingId}\"`)) missing.push(`missing opening event ${openingId}`);
  if (!people.includes(`id: \"${peopleFlag}\"`)) missing.push(`missing people event ${peopleFlag}`);
  const openingBlockStart = opening.indexOf(`id: \"${openingId}\"`);
  const nextBlock = opening.indexOf("\n  {\n    id:", openingBlockStart + 10);
  const block = opening.slice(openingBlockStart, nextBlock === -1 ? opening.length : nextBlock);
  if (!block.includes(`flags[\"${peopleFlag}\"]`) && !block.includes(`flag(s,\"${peopleFlag}\"`)) {
    missing.push(`${openingId} does not consume ${peopleFlag}; duplicate introduction remains eligible`);
  }
}

if (missing.length) {
  console.error("Opening intro continuity regression:\n- " + missing.join("\n- "));
  process.exit(1);
}

console.log("opening-intro-continuity-smoke: OK — mandatory opening consumes all duplicate people intro flags");
