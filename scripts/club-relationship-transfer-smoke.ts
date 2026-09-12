import { ensureCareerCast } from "../src/game/career-life";
import { CLUB_POOL } from "../src/game/clubs";
import { moveToClub } from "../src/game/career";
import { createGame } from "../src/game/engine";
import { eventById } from "../src/game/events";
import type { Player } from "../src/game/types";

const player: Player = {
  name: "Transfer QA",
  nickname: "TQA",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["ambicioso", "profesional"],
};

const state = createGame(player);
state.careerSeed = 908172;
state.age = 18;
state.clubId = "betis";
state.stage = "first";
state.sceneCount = 12;
const sourceCast = ensureCareerCast(state);

const clubFlags = [
  "people_coach_intro",
  "people_captain_intro",
  "people_captain_callback",
  "people_teammate_intro",
  "people_teammate_callback",
  "people_physio_intro",
  "people_physio_injury_callback",
];
for (const key of clubFlags) state.flags[key] = 1;

const personalFlags = [
  "people_adviser_intro",
  "people_adviser_first_plan",
  "social_dm_intro",
  "social_dm_replied",
];
for (const key of personalFlags) state.flags[key] = 1;

state.seenEvents.push(...clubFlags, "people_adviser_intro", "people_social_dm_intro");
state.eventHistory.push(
  ...clubFlags.map((id) => ({ id, category: "club" as const, scene: 8 })),
  { id: "people_adviser_intro", category: "agent", scene: 1 },
);

const destination = CLUB_POOL.find((club) => club.id !== state.clubId)!;
moveToClub(state, destination.id, 320, 4, false);
const destinationCast = ensureCareerCast(state);

if (destinationCast.coach.id === sourceCast.coach.id) throw new Error("coach did not rotate after transfer");
if (destinationCast.captain.id === sourceCast.captain.id) throw new Error("captain did not rotate after transfer");
if (destinationCast.physio.id === sourceCast.physio.id) throw new Error("physio did not rotate after transfer");
if (destinationCast.teammate.id === sourceCast.teammate.id) throw new Error("teammate did not rotate after transfer");
if (destinationCast.adviser.id !== sourceCast.adviser.id) throw new Error("adviser continuity broke on transfer");
if (destinationCast.social.id !== sourceCast.social.id) throw new Error("social continuity broke on transfer");

for (const key of clubFlags) {
  if (state.flags[key]) throw new Error(`${key} survived transfer and blocks the new club relationship arc`);
  if (state.seenEvents.includes(key)) throw new Error(`${key} stayed in seenEvents after transfer`);
  if (state.eventHistory.some((entry) => entry.id === key)) throw new Error(`${key} stayed in eventHistory after transfer`);
}
for (const key of personalFlags) {
  if (!state.flags[key]) throw new Error(`${key} was incorrectly erased by a club transfer`);
}
if (!state.seenEvents.includes("people_adviser_intro")) throw new Error("adviser history was incorrectly erased from seenEvents");

// The new club must be able to introduce its staff again while the player's
// adviser history remains continuous.
const coachIntro = eventById("people_coach_intro")!;
if (!coachIntro.requires(state)) throw new Error("new club coach introduction did not unlock after transfer");

console.log(`Club relationship transfer QA OK: ${sourceCast.coach.name} -> ${destinationCast.coach.name}; club arcs reset, adviser/social history preserved.`);
