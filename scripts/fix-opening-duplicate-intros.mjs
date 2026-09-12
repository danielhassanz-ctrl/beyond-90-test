import fs from "node:fs";

const openingPath = "src/game/opening.ts";
const qaPath = "scripts/opening-flow-smoke.ts";

let opening = fs.readFileSync(openingPath, "utf8");
const oldPhase = [
  "function setPhase(s: GameState, value: number): void {",
  "  s.flags[OPENING_MARKER] = 1;",
  "  s.flags[OPENING_PHASE] = value;",
  '  if (value >= OpeningPhase.DONE) s.flags["opening_completed"] = 1;',
  "}",
].join("\n");
const newPhase = [
  "function setPhase(s: GameState, value: number): void {",
  "  s.flags[OPENING_MARKER] = 1;",
  "  s.flags[OPENING_PHASE] = value;",
  "",
  "  // The mandatory opening is the canonical first introduction for the persistent",
  "  // people system. Consume the equivalent legacy intro flag at the moment that",
  "  // introduction has actually completed, so normal scheduling cannot introduce",
  "  // the same adviser/coach/captain/teammate/physio a second time. Club-scoped",
  "  // flags may be cleared later by a real transfer; adviser continuity never is.",
  '  if (value === OpeningPhase.CLUB_CHOICE) s.flags["people_adviser_intro"] = 1;',
  '  if (value === OpeningPhase.PRESEASON) s.flags["people_coach_intro"] = 1;',
  '  if (value === OpeningPhase.TEAMMATE) s.flags["people_captain_intro"] = 1;',
  '  if (value === OpeningPhase.PHYSIO) s.flags["people_teammate_intro"] = 1;',
  "  if (value >= OpeningPhase.DONE) {",
  '    s.flags["people_physio_intro"] = 1;',
  '    s.flags["opening_completed"] = 1;',
  "  }",
  "}",
].join("\n");

if (opening.includes(oldPhase)) opening = opening.replace(oldPhase, newPhase);
else if (!opening.includes('s.flags["people_adviser_intro"] = 1')) throw new Error("opening setPhase anchor not found");
fs.writeFileSync(openingPath, opening);

let qa = fs.readFileSync(qaPath, "utf8");
const importAnchor = 'import { ensureCareerCast } from "../src/game/career-life";\n';
const peopleImport = 'import { PEOPLE_EVENTS } from "../src/game/events-people";\n';
if (!qa.includes(peopleImport)) {
  if (!qa.includes(importAnchor)) throw new Error("opening QA import anchor not found");
  qa = qa.replace(importAnchor, importAnchor + peopleImport);
}

if (!qa.includes("canonicalIntroFlags")) {
  const insertBefore = "    // Regression for the user-reported repetitive card:";
  if (!qa.includes(insertBefore)) throw new Error("opening QA regression anchor not found");
  const regression = [
    "    // The life-first opening is the canonical introduction. The persistent-people",
    "    // bank may continue with callbacks, but its five intro cards must already be",
    "    // consumed and remain ineligible later in the same club.",
    "    const canonicalIntroFlags = [",
    '      "people_adviser_intro",',
    '      "people_coach_intro",',
    '      "people_captain_intro",',
    '      "people_teammate_intro",',
    '      "people_physio_intro",',
    "    ] as const;",
    "    for (const introFlag of canonicalIntroFlags) {",
    "      if (state.flags[introFlag] !== 1) throw new Error(`${mode}/${seed}: opening did not consume ${introFlag}`);",
    "    }",
    "",
    "    const laterSameClub = { ...state, sceneCount: state.sceneCount + 20 };",
    "    for (const introId of canonicalIntroFlags) {",
    "      const intro = PEOPLE_EVENTS.find((event) => event.id === introId);",
    "      if (!intro) throw new Error(`${mode}/${seed}: missing persistent-people intro fixture ${introId}`);",
    "      if (intro.requires(state) || intro.requires(laterSameClub)) {",
    "        throw new Error(`${mode}/${seed}: duplicate intro ${introId} remains eligible after canonical opening`);",
    "      }",
    "    }",
    "",
  ].join("\n");
  qa = qa.replace(insertBefore, regression + insertBefore);
}
fs.writeFileSync(qaPath, qa);

console.log("Patched canonical opening continuity: duplicate persistent NPC introductions are consumed once.");
