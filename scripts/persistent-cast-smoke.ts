import { canReceiveSocialDm, careerStatus, ensureCareerCast } from "../src/game/career-life";
import { PEOPLE_EVENTS } from "../src/game/events-people";
import { createGame, npcMood, who } from "../src/game/engine";
import type { Player } from "../src/game/types";

const player: Player = { name: "Daniel", position: "MCO", nationality: "España", archetype: "talentoso", personality: "competitivo" } as Player;
const state = createGame(player);
const cast = ensureCareerCast(state);

if (!cast.adviser?.name || !cast.coach?.name || !cast.captain?.name || !cast.physio?.name || !cast.teammate?.name) throw new Error("persistent cast missing core identities");

const socialIntro = PEOPLE_EVENTS.find((e) => e.id === "people_social_dm_intro");
const socialFollowup = PEOPLE_EVENTS.find((e) => e.id === "people_social_dm_followup");
const adviserMoney = PEOPLE_EVENTS.find((e) => e.id === "people_adviser_first_money");
if (!socialIntro?.requires || !socialFollowup?.requires || !adviserMoney?.requires) throw new Error("people-event eligibility fixtures missing");

state.age = 16;
state.fame = 0;
if (socialIntro.requires(state)) throw new Error("social-DM intro leaks into anonymous age-16 opening");
state.age = 30;
state.flags["social_dm_intro"] = 1;
if (socialFollowup.requires(state)) throw new Error("early social-DM follow-up leaks into a late career stage");
state.age = 22;
if (adviserMoney.requires(state)) throw new Error("first-money adviser scene leaks into an implausibly late career stage");
delete state.flags["social_dm_intro"];
state.fame = 40;
state.age = 24;
if (!canReceiveSocialDm(state)) throw new Error("social-DM intro is incorrectly blocked inside its early-career window");
state.age = 25;
if (canReceiveSocialDm(state)) throw new Error("first social-DM scene can leak into consolidation/prime years");

// Youth hype must not skip the life-first hierarchy. Even absurd fixture stats
// are capped until the established era has enough senior-career proof.
state.age = 16;
state.overall = 95;
state.fame = 95;
state.awards = ["Golden Boy", "MVP"];
state.titles = ["Liga", "Copa", "Europa", "Supercopa"];
if (careerStatus(state) !== "starter") throw new Error(`16-year-old wonderkid escaped grounded starter ceiling as ${careerStatus(state)}`);
state.age = 19;
if (careerStatus(state) !== "star") throw new Error(`19-year-old breakthrough escaped grounded star ceiling as ${careerStatus(state)}`);
state.age = 22;
if (careerStatus(state) !== "elite") throw new Error(`established elite career failed to unlock elite status: ${careerStatus(state)}`);
state.age = 27;
if (careerStatus(state) !== "legend") throw new Error(`proven 27-year-old elite career failed to unlock legend status: ${careerStatus(state)}`);

const before = cast.coach.relation;
npcMood(state, "coach", 7);
if (cast.coach.relation !== Math.min(100, before + 7)) throw new Error(`coach mood did not propagate to persistent cast: ${before} -> ${cast.coach.relation}`);
const repeated = who(state, "coach");
if (!repeated.startsWith(`${cast.coach.name}, `)) throw new Error("coach identity changed across repeated Director lookups");

const transferState = createGame(player);
const transferCast = ensureCareerCast(transferState);
if (!transferCast.adviser?.name || !transferCast.coach?.name) throw new Error("fresh career cast failed to initialize");

console.log(`Persistent cast QA OK: adviser=${cast.adviser.name}; coach=${cast.coach.name}; youth status caps preserve hierarchy.`);
