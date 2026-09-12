import fs from "node:fs";

const file = "src/game/career.ts";
let src = fs.readFileSync(file, "utf8");

const helperMarker = "/** Aplica un cambio de club manteniendo coherencia de etapa y plantilla. */";
if (!src.includes(helperMarker)) throw new Error("moveToClub marker not found");

if (!src.includes("function resetClubScopedRelationshipNarrative")) {
  const helper = `function resetClubScopedRelationshipNarrative(s: GameState): void {\n  const prefixes = [\"people_coach_\", \"people_captain_\", \"people_teammate_\", \"people_physio_\"] as const;\n  const clubScoped = (id: string): boolean => prefixes.some((prefix) => id.startsWith(prefix));\n\n  // A new dressing room must be allowed to introduce its own coach, captain,\n  // teammate and physio. Personal continuity (adviser, family, social, partner)\n  // is deliberately untouched.\n  for (const key of Object.keys(s.flags)) {\n    if (clubScoped(key)) delete s.flags[key];\n  }\n  if (Array.isArray(s.seenEvents)) s.seenEvents = s.seenEvents.filter((id) => !clubScoped(id));\n  if (Array.isArray(s.eventHistory)) s.eventHistory = s.eventHistory.filter((entry) => !clubScoped(entry.id));\n}\n\n`;
  src = src.replace(helperMarker, helper + helperMarker);
}

const oldHead = `export function moveToClub(s: GameState, clubId: string, salary: number, years: number, loan = false): void {\n  const dest = defById(clubId);\n  if (!dest) return;\n  const old = clubDef(s.clubId).name;`;
const newHead = `export function moveToClub(s: GameState, clubId: string, salary: number, years: number, loan = false): void {\n  const dest = defById(clubId);\n  if (!dest) return;\n  const previousClubId = s.clubId;\n  const old = clubDef(previousClubId).name;\n  if (previousClubId && previousClubId !== clubId) resetClubScopedRelationshipNarrative(s);`;

if (src.includes(oldHead)) src = src.replace(oldHead, newHead);
else if (!src.includes("resetClubScopedRelationshipNarrative(s);")) throw new Error("moveToClub head not found");

fs.writeFileSync(file, src);
console.log("Club-scoped relationship narrative reset is installed.");
