import { CLUB_POOL } from "../src/game/clubs";
import { moveToClub } from "../src/game/career";
import { createGame } from "../src/game/engine";
import { eventById } from "../src/game/events";
import { ensureCareerCast } from "../src/game/career-life";
import type { Player } from "../src/game/types";

const player: Player = {
  name: "Transfer Relationship QA",
  nickname: "TRQA",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["ambicioso", "profesional"],
};

const s = createGame(player);
s.careerSeed = 730073;
s.age = 18;
const source = CLUB_POOL[0]!;
const destination = CLUB_POOL.find((club) => club.id !== source.id)!;
s.clubId = source.id;
const sourceCast = ensureCareerCast(s);

// Simulate the player having already lived the relationship beats at club A.
for (const flag of [
  "people_coach_intro",
  "people_captain_intro",
  "people_captain_callback",
  "people_teammate_intro",
  "people_teammate_callback",
  "people_physio_intro",
  "people_physio_injury_callback",
  "people_adviser_intro",
  "people_adviser_first_plan",
  "social_dm_intro",
  "social_dm_replied",
  "people_social_dm_followup",
]) {
  s.flags[flag] = 1;
}

const adviserId = sourceCast.adviser.id;
const socialId = sourceCast.social.id;
moveToClub(s, destination.id, 320, 4, false);
const destinationCast = ensureCareerCast(s);

if (destinationCast.coach.id === sourceCast.coach.id) throw new Error("coach did not rotate on transfer");
if (destinationCast.captain.id === sourceCast.captain.id) throw new Error("captain did not rotate on transfer");
if (destinationCast.teammate.id === sourceCast.teammate.id) throw new Error("teammate did not rotate on transfer");
if (destinationCast.physio.id === sourceCast.physio.id) throw new Error("physio did not rotate on transfer");
if (destinationCast.adviser.id !== adviserId) throw new Error("adviser must remain personal across transfer");
if (destinationCast.social.id !== socialId) throw new Error("social/personal contact must remain personal across transfer");

// Club-scoped story completion belongs to the old club and must be reset.
for (const flag of [
  "people_coach_intro",
  "people_captain_intro",
  "people_captain_callback",
  "people_teammate_intro",
  "people_teammate_callback",
  "people_physio_intro",
  "people_physio_injury_callback",
]) {
  if (s.flags[flag]) throw new Error(`${flag} survived transfer and blocks the new club relationship arc`);
}

// Personal history must not be erased merely because the shirt changed.
for (const flag of ["people_adviser_intro", "people_adviser_first_plan", "social_dm_intro", "social_dm_replied", "people_social_dm_followup"]) {
  if (!s.flags[flag]) throw new Error(`${flag} was incorrectly reset by club transfer`);
}

const coachIntro = eventById("people_coach_intro");
const captainIntro = eventById("people_captain_intro");
const teammateIntro = eventById("people_teammate_intro");
const physioIntro = eventById("people_physio_intro");
if (!coachIntro?.requires(s)) throw new Error("new club coach introduction is not eligible after transfer");
if (!captainIntro?.requires(s)) throw new Error("new club captain introduction is not eligible after transfer");
if (!teammateIntro?.requires(s)) throw new Error("new club teammate introduction is not eligible after transfer");
if (!physioIntro?.requires(s)) throw new Error("new club physio introduction is not eligible after transfer");

console.log(`Transfer relationship arc QA OK: ${source.name} -> ${destination.name}; club cast refreshed and new introductions unlocked while personal history persisted.`);
