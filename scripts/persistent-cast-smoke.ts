import { canReceiveSocialDm, careerStatus, ensureCareerCast } from "../src/game/career-life";
import { CLUB_POOL } from "../src/game/clubs";
import { moveToClub } from "../src/game/career";
import { createGame } from "../src/game/engine";
import { eventById } from "../src/game/events";
import { npcMood, who } from "../src/game/npc";
import { closeThread, dueThread } from "../src/game/threads";
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
  "people_adviser_first_plan",
  "people_adviser_first_money",
  "people_coach_intro",
  "people_captain_intro",
  "people_captain_callback",
  "people_teammate_intro",
  "people_teammate_callback",
  "people_physio_intro",
  "people_physio_injury_callback",
  "people_social_dm_intro",
  "people_social_dm_followup",
];
for (const id of requiredLiveScenes) {
  if (!eventById(id)) throw new Error(`${id} exists in source but is not installed in the live event registry`);
}

const adviserIntro = eventById("people_adviser_intro")!;
if (!adviserIntro.requires(state)) throw new Error("adviser introduction is not eligible at the start of a 16-year-old career");

state.flags["people_adviser_intro"] = 1;
state.sceneCount = 3;
const adviserPlan = eventById("people_adviser_first_plan")!;
if (!adviserPlan.requires(state)) throw new Error("early adviser career-plan follow-up is not eligible after the introduction");

state.flags["people_adviser_first_plan"] = 1;
state.sceneCount = 7;
state.salary = 20;
const adviserMoney = eventById("people_adviser_first_money")!;
if (!adviserMoney.requires(state)) throw new Error("early adviser money follow-up is not eligible once salary becomes meaningful");

state.flags["people_coach_intro"] = 1;
state.flags["people_captain_intro"] = 1;
state.sceneCount = 8;
const captainCallback = eventById("people_captain_callback")!;
if (!captainCallback.requires(state)) throw new Error("captain does not return after his introduction");

state.flags["people_teammate_intro"] = 1;
state.sceneCount = 10;
const teammateCallback = eventById("people_teammate_callback")!;
if (!teammateCallback.requires(state)) throw new Error("teammate does not develop into a second scene");

state.flags["people_physio_intro"] = 1;
state.injury = { label: "esguince de tobillo", severity: "medium", matchesOut: 3, treated: false };
const physioCallback = eventById("people_physio_injury_callback")!;
if (!physioCallback.requires(state)) throw new Error("known physio does not return when a real injury occurs");

state.flags["social_dm_intro"] = 1;
state.flags["social_dm_replied"] = 1;
state.sceneCount = 10;
const socialFollowup = eventById("people_social_dm_followup")!;
if (!socialFollowup.requires(state)) throw new Error("replied social DM does not open a later personal scene");

state.age = 25;
if (socialFollowup.requires(state)) throw new Error("early social-DM follow-up leaks into a late career stage");
state.age = 22;
if (adviserMoney.requires(state)) throw new Error("first-money adviser scene leaks into an implausibly late career stage");

// The first social-attention beat must stay in the early career. A player who
// only becomes visible later can receive other mature social/press stories,
// but not dialogue pretending it followed one of his first matches.
delete state.flags["social_dm_intro"];
state.fame = 40;
state.age = 24;
if (!canReceiveSocialDm(state)) throw new Error("social-DM intro is incorrectly blocked inside its early-career window");
state.age = 25;
if (canReceiveSocialDm(state)) throw new Error("first social-DM scene can leak into consolidation/prime years");

// Narrative status must respect age as a hard prerequisite. A wonderkid can be
// a star, but a 16-year-old cannot unlock established-elite or legend scenes.
state.age = 16;
state.overall = 95;
state.fame = 95;
state.awards = ["Golden Boy", "MVP"];
state.titles = ["Liga", "Copa", "Europa", "Supercopa"];
if (careerStatus(state) !== "star") {
  throw new Error(`16-year-old wonderkid leaked into ${careerStatus(state)} status`);
}
state.age = 19;
if (careerStatus(state) !== "elite") {
  throw new Error(`19-year-old elite breakthrough was over-capped as ${careerStatus(state)}`);
}
state.age = 27;
if (careerStatus(state) !== "legend") {
  throw new Error(`proven 27-year-old elite career failed to unlock legend status: ${careerStatus(state)}`);
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

// Club-scoped continuity: adviser and social contact follow the player, but
// coach/captain/physio/current teammate belong to the club and must rotate on a
// real transfer. Repeated lookups inside each club must stay stable.
const transferState = createGame(player);
transferState.careerSeed = 880055;
const sourceClub = CLUB_POOL[0]!;
const destinationClub = CLUB_POOL.find((club) => club.id !== sourceClub.id)!;
const thirdClub = CLUB_POOL.find((club) => club.id !== sourceClub.id && club.id !== destinationClub.id)!;
transferState.clubId = sourceClub.id;
const sourceCast = ensureCareerCast(transferState);
const sourceSnapshot = {
  adviser: sourceCast.adviser.id,
  social: sourceCast.social.id,
  coach: sourceCast.coach.id,
  captain: sourceCast.captain.id,
  physio: sourceCast.physio.id,
  teammate: sourceCast.teammate.id,
};
const sourceAgain = ensureCareerCast(transferState);
if (sourceAgain.coach.id !== sourceSnapshot.coach || sourceAgain.captain.id !== sourceSnapshot.captain) {
  throw new Error("club-scoped cast drifted without a transfer");
}

moveToClub(transferState, destinationClub.id, 300, 4, false);
const destinationCast = ensureCareerCast(transferState);
for (const key of ["coach", "captain", "physio", "teammate"] as const) {
  if (destinationCast[key].id === sourceSnapshot[key]) {
    throw new Error(`${key} incorrectly followed player from ${sourceClub.name} to ${destinationClub.name}`);
  }
}
if (destinationCast.adviser.id !== sourceSnapshot.adviser) throw new Error("adviser identity changed on club transfer");
if (destinationCast.social.id !== sourceSnapshot.social) throw new Error("long-term social identity changed on club transfer");
const destinationAgain = ensureCareerCast(transferState);
for (const key of ["coach", "captain", "physio", "teammate"] as const) {
  if (destinationAgain[key].id !== destinationCast[key].id) throw new Error(`${key} is unstable after transfer`);
}

// Legacy saves have no clubScope marker. Loading one must adopt its current
// club without silently recasting staff; only the next future transfer rotates.
const legacyCast = destinationCast as typeof destinationCast & { clubScope?: string };
delete legacyCast.clubScope;
const legacyNames = [legacyCast.coach.id, legacyCast.captain.id, legacyCast.physio.id, legacyCast.teammate.id];
const migratedLegacy = ensureCareerCast(transferState);
const migratedNames = [migratedLegacy.coach.id, migratedLegacy.captain.id, migratedLegacy.physio.id, migratedLegacy.teammate.id];
if (legacyNames.join("|") !== migratedNames.join("|")) throw new Error("legacy save recast staff merely by loading");
moveToClub(transferState, thirdClub.id, 340, 3, false);
const postLegacyTransfer = ensureCareerCast(transferState);
if (postLegacyTransfer.coach.id === migratedLegacy.coach.id) throw new Error("legacy-migrated coach did not rotate on the next real transfer");
if (postLegacyTransfer.adviser.id !== sourceSnapshot.adviser) throw new Error("legacy migration broke adviser continuity");

// Long-memory callbacks are cross-season history, not filler inside the same
// rookie year. Once generated they must also survive a lost `pending` value:
// dueThread should reconstruct the same persisted thread until it is resolved.
const memoryState = createGame(player);
memoryState.careerSeed = 31337;
memoryState.sceneCount = 9;
memoryState.memory.promises = ["Prometiste al entrenador que volverías a ganarte el puesto"];
memoryState.flags["ultimo_hilo"] = -99;
if (dueThread(memoryState) !== null) {
  throw new Error("long-memory callback can fire in the same season as the remembered decision");
}
memoryState.seasonIndex = 1;
const memoryThread = dueThread(memoryState);
if (!memoryThread || !memoryThread.id.startsWith("memory-")) {
  throw new Error("remembered decision did not return in a later season");
}
if (!(memoryState.threads ?? []).some((thread) => thread.id === memoryThread.id)) {
  throw new Error("memory callback was marked consumed without being persisted as a recoverable thread");
}
const recoveredMemoryThread = dueThread(memoryState);
if (recoveredMemoryThread?.id !== memoryThread.id) {
  throw new Error("persisted memory callback cannot be reconstructed after pending-state loss");
}
closeThread(memoryState, memoryThread.id);
if ((memoryState.threads ?? []).some((thread) => thread.id === memoryThread.id)) {
  throw new Error("resolved memory callback remains stuck in the persistent thread queue");
}

console.log(`Persistent cast QA OK: live people scenes=${requiredLiveScenes.length}; club staff rotate on transfers while adviser/social persist; legacy saves adopt current club before future rotation; age-gated status=academy-star/breakthrough-elite/proven-legend; social-intro window=17-24; recurring threads=adviser+captain+teammate+physio+social+cross-season-memory; adviser=${cast.adviser.name}; coach=${cast.coach.name}; captain=${cast.captain.name}; physio=${cast.physio.name}; teammate=${cast.teammate.name}; social=${cast.social.name}`);
