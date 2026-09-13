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

const failures = [];
for (const [openingId, peopleFlag] of continuity) {
  if (!opening.includes(`id: "${openingId}"`)) failures.push(`missing opening event ${openingId}`);
  if (!people.includes(`id: "${peopleFlag}"`)) failures.push(`missing people event ${peopleFlag}`);

  const openingBlockStart = opening.indexOf(`id: "${openingId}"`);
  const nextBlock = opening.indexOf("\n  {\n    id:", openingBlockStart + 10);
  const block = opening.slice(openingBlockStart, nextBlock === -1 ? opening.length : nextBlock);
  if (!block.includes("setPhase(")) failures.push(`${openingId} does not advance the canonical opening phase`);
}

const expectedPhaseConsumption = [
  ["OpeningPhase.CLUB_CHOICE", "people_adviser_intro"],
  ["OpeningPhase.PRESEASON", "people_coach_intro"],
  ["OpeningPhase.TEAMMATE", "people_captain_intro"],
  ["OpeningPhase.PHYSIO", "people_teammate_intro"],
  ["OpeningPhase.DONE", "people_physio_intro"],
];

for (const [phase, flag] of expectedPhaseConsumption) {
  const phaseIndex = opening.indexOf(phase);
  const flagIndex = opening.indexOf(`s.flags["${flag}"]`, phaseIndex);
  if (phaseIndex === -1 || flagIndex === -1 || flagIndex - phaseIndex > 260) {
    failures.push(`${flag} is not consumed when the mandatory opening completes ${phase}`);
  }
}

if (failures.length) {
  console.error("Opening intro continuity regression:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("opening-intro-continuity-smoke: OK — mandatory opening owns first introductions and consumes duplicate people intro eligibility");
