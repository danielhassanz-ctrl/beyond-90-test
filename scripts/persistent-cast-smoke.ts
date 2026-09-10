import { ensureCareerCast } from "../src/game/career-life";
import { createGame } from "../src/game/engine";
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

const before = cast.coach.relation;
npcMood(state, "coach", 7);
if (cast.coach.relation !== Math.min(100, before + 7)) {
  throw new Error(`coach mood did not propagate to persistent cast: ${before} -> ${cast.coach.relation}`);
}

const repeated = who(state, "coach");
if (!repeated.startsWith(`${cast.coach.name}, `)) {
  throw new Error("coach identity changed across repeated Director lookups");
}

console.log(`Persistent cast QA OK: adviser=${cast.adviser.name}; coach=${cast.coach.name}; captain=${cast.captain.name}; physio=${cast.physio.name}; teammate=${cast.teammate.name}; social=${cast.social.name}`);
