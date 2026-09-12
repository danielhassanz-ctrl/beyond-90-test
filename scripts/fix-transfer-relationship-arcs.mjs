import fs from "node:fs";

const npcFile = "src/game/npc.ts";
let npc = fs.readFileSync(npcFile, "utf8");

const sourceAnchor = `  cast.teammate = scopedPerson(s, "teammate", currentClub, "Compañero de confianza", s.rel.dressing || 46);\n  cast.clubScope = currentClub;\n\n  // Club-specific unresolved threads belong to the old dressing room. Personal\n`;

const sourceReplacement = `  cast.teammate = scopedPerson(s, "teammate", currentClub, "Compañero de confianza", s.rel.dressing || 46);\n  cast.clubScope = currentClub;\n\n  // Relationship scenes tied to the previous club must become eligible again\n  // with the new staff and dressing room. Personal/adviser/social history is\n  // deliberately preserved: only the club-scoped relationship arc is reset.\n  for (const key of [\n    "people_coach_intro",\n    "people_captain_intro",\n    "people_captain_callback",\n    "people_teammate_intro",\n    "people_teammate_callback",\n    "people_physio_intro",\n    "people_physio_injury_callback",\n  ] as const) {\n    delete s.flags[key];\n  }\n\n  // Club-specific unresolved threads belong to the old dressing room. Personal\n`;

if (!npc.includes("people_physio_injury_callback")) {
  if (!npc.includes(sourceAnchor)) throw new Error("npc.ts transfer rotation anchor not found");
  npc = npc.replace(sourceAnchor, sourceReplacement);
  fs.writeFileSync(npcFile, npc);
  console.log("Patched npc.ts club-scoped relationship reset");
} else {
  console.log("npc.ts already patched");
}

const qaFile = "scripts/persistent-cast-smoke.ts";
let qa = fs.readFileSync(qaFile, "utf8");

const qaAnchor = `moveToClub(transferState, destinationClub.id, 300, 4, false);\nconst destinationCast = ensureCareerCast(transferState);\n`;
const qaReplacement = `for (const key of [\n  "people_coach_intro",\n  "people_captain_intro",\n  "people_captain_callback",\n  "people_teammate_intro",\n  "people_teammate_callback",\n  "people_physio_intro",\n  "people_physio_injury_callback",\n  "people_adviser_intro",\n  "people_social_dm_intro",\n] as const) transferState.flags[key] = 1;\n\nmoveToClub(transferState, destinationClub.id, 300, 4, false);\nconst destinationCast = ensureCareerCast(transferState);\nfor (const key of [\n  "people_coach_intro",\n  "people_captain_intro",\n  "people_captain_callback",\n  "people_teammate_intro",\n  "people_teammate_callback",\n  "people_physio_intro",\n  "people_physio_injury_callback",\n] as const) {\n  if (transferState.flags[key]) throw new Error(\`club-scoped relationship flag survived transfer: \${key}\`);\n}\nif (transferState.flags["people_adviser_intro"] !== 1) throw new Error("adviser relationship history was reset on transfer");\nif (transferState.flags["people_social_dm_intro"] !== 1) throw new Error("social relationship history was reset on transfer");\n`;

if (!qa.includes("club-scoped relationship flag survived transfer")) {
  if (!qa.includes(qaAnchor)) throw new Error("persistent-cast transfer QA anchor not found");
  qa = qa.replace(qaAnchor, qaReplacement);
  fs.writeFileSync(qaFile, qa);
  console.log("Patched persistent-cast transfer relationship assertions");
} else {
  console.log("persistent-cast QA already patched");
}
