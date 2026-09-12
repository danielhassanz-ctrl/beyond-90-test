import fs from "node:fs";

const openingPath = "src/game/opening.ts";
const qaPath = "scripts/opening-flow-smoke.ts";

let opening = fs.readFileSync(openingPath, "utf8");
const oldPhase = `function setPhase(s: GameState, value: number): void {\n  s.flags[OPENING_MARKER] = 1;\n  s.flags[OPENING_PHASE] = value;\n  if (value >= OpeningPhase.DONE) s.flags["opening_completed"] = 1;\n}`;
const newPhase = `function setPhase(s: GameState, value: number): void {\n  s.flags[OPENING_MARKER] = 1;\n  s.flags[OPENING_PHASE] = value;\n\n  // The mandatory opening is the canonical first introduction for the persistent\n  // people system. Consume the equivalent legacy intro flag at the moment that\n  // introduction has actually completed, so normal scheduling cannot introduce\n  // the same adviser/coach/captain/teammate/physio a second time. Club-scoped\n  // flags may be cleared later by a real transfer; adviser continuity never is.\n  if (value === OpeningPhase.CLUB_CHOICE) s.flags["people_adviser_intro"] = 1;\n  if (value === OpeningPhase.PRESEASON) s.flags["people_coach_intro"] = 1;\n  if (value === OpeningPhase.TEAMMATE) s.flags["people_captain_intro"] = 1;\n  if (value === OpeningPhase.PHYSIO) s.flags["people_teammate_intro"] = 1;\n  if (value >= OpeningPhase.DONE) {\n    s.flags["people_physio_intro"] = 1;\n    s.flags["opening_completed"] = 1;\n  }\n}`;

if (opening.includes(oldPhase)) opening = opening.replace(oldPhase, newPhase);
else if (!opening.includes('s.flags["people_adviser_intro"] = 1')) throw new Error("opening setPhase anchor not found");
fs.writeFileSync(openingPath, opening);

let qa = fs.readFileSync(qaPath, "utf8");
const importAnchor = `import { ensureCareerCast } from "../src/game/career-life";\n`;
const peopleImport = `import { PEOPLE_EVENTS } from "../src/game/events-people";\n`;
if (!qa.includes(peopleImport)) {
  if (!qa.includes(importAnchor)) throw new Error("opening QA import anchor not found");
  qa = qa.replace(importAnchor, importAnchor + peopleImport);
}

const castAnchor = `    if (!cast.adviser.met || !cast.coach.met || !cast.captain.met || !cast.teammate.met || !cast.physio.met) {\n      throw new Error(\`${"${mode}/${seed}