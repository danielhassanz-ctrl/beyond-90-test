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

// The old smoke searched from the first textual occurrence of each OpeningPhase
// token. Those tokens also exist in EVENT_BY_PHASE, so harmless edits could make
// the gate fail even while setPhase() correctly consumed every legacy intro.
// Inspect the canonical phase-transition function itself instead.
const setPhaseStart = opening.indexOf("function setPhase(");
const setPhaseEnd = opening.indexOf("\nfunction ", setPhaseStart + 10);
const setPhaseBlock = setPhaseStart === -1
  ? ""
  : opening.slice(setPhaseStart, setPhaseEnd === -1 ? opening.length : setPhaseEnd);

if (!setPhaseBlock) failures.push("missing canonical setPhase function");

const expectedPhaseConsumption = [
  ["OpeningPhase.CLUB_CHOICE", "people_adviser_intro", "==="],
  ["OpeningPhase.PRESEASON", "people_coach_intro", "==="],
  ["OpeningPhase.TEAMMATE", "people_captain_intro", "==="],
  ["OpeningPhase.PHYSIO", "people_teammate_intro", "==="],
  ["OpeningPhase.DONE", "people_physio_intro", ">="],
];

for (const [phase, flag, operator] of expectedPhaseConsumption) {
  const condition = `value ${operator} ${phase}`;
  const conditionIndex = setPhaseBlock.indexOf(condition);
  const flagIndex = setPhaseBlock.indexOf(`s.flags["${flag}"]`, conditionIndex);
  if (conditionIndex === -1 || flagIndex === -1 || flagIndex - conditionIndex > 180) {
    failures.push(`${flag} is not consumed by canonical setPhase at ${phase}`);
  }
}

if (!setPhaseBlock.includes('s.flags["opening_completed"] = 1')) {
  failures.push("opening_completed is not persisted by canonical setPhase");
}

if (failures.length) {
  console.error("Opening intro continuity regression:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("opening-intro-continuity-smoke: OK — mandatory opening owns first introductions and consumes duplicate people intro eligibility");
