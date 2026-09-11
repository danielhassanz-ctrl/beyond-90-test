import { ensureCareerCast } from "../src/game/career-life";
import { createGame } from "../src/game/engine";
import { eventById } from "../src/game/events";
import { npcMood, who } from "../src/game/npc";
import type { Player } from "../src/game/types";

const player: Player = {
  name: "QA Player",
  nickname: "QA",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["ambicioso", "profesional"],
};

const state = createGame(player);
state.careerSeed = 424242;
const cast = ensureCareerCast(state);

const expectations: Array<[string, string]> = [
  ["coach", cast.coach.name],
  ["captain", cast.captain.name],
  ["physio", cast.physio.name],
  ["friend", cast.teammate.name],
  ["social", cast.social.name],
  ["adviser", cast.adviser.name],
];

for (const [role, name] of expectations) {
  const rendered = who(state, role);
  if (!rendered.startsWith(`${name}, `)) {
    throw new Error(`${role} resolved as ${rendered}; expected persistent cast member ${name}`);
  }
}

const requiredLiveScenes = [
  "people_adviser_intro",
  "people_coach_intro",
  "people_captain_intro",
  "people_teammate_intro",
  "people_physio_intro",
  "people_social_dm_intro",
];
for (const id of requiredLiveScenes) {
  if (!eventById(id)) throw new Error(`${id} exists in source but is not installed in the live event registry`);
}

const adviserIntro = eventById("people_adviser_intro")!;
if (!adviserIntro.requires(state)) throw new Error("adviser introduction is not eligible at the start of a 16-year-old career");

const before = cast.coach.relation;
npcMood(state, "coach", 7);
if (cast.coach.relation !== Math.min(100, before + 7)) {
  throw new Error(`coach mood did not propagate to persistent cast: ${before} -> ${cast.coach.relation}`);
}

const repeated = who(state, "coach");
if (!repeated.startsWith(`${cast.coach.name}, `)) {
  throw new Error("coach identity changed across repeated Director lookups");
}

console.log(`Persistent cast QA OK: live introductions=6; adviser=${cast.adviser.name}; coach=${cast.coach.name}; captain=${cast.captain.name}; physio=${cast.physio.name}; teammate=${cast.teammate.name}; social=${cast.social.name}`);