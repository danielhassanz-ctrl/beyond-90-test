import { chooseClub, createGame } from "../src/game/engine";
import { moveToClub } from "../src/game/career";
import { ensureCareerCast } from "../src/game/career-life";
import type { Player } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const player: Player = {
  name: "Cast QA",
  nickname: "",
  position: "MC",
  nationality: "España",
  city: "Madrid",
  avatar: null,
  traits: ["profesional", "familiar"],
};

let state = createGame(player);
state.careerSeed = 680068;
state = chooseClub(state, state.offers[0]!.clubId);

const initialClub = state.clubId;
const first = ensureCareerCast(state);
const initial = {
  adviser: first.adviser.name,
  social: first.social.name,
  coach: first.coach.name,
  captain: first.captain.name,
  physio: first.physio.name,
  teammate: first.teammate.name,
};

const firstAgain = ensureCareerCast(state);
assert(firstAgain.coach.name === initial.coach, "Coach drifted inside the same club");
assert(firstAgain.captain.name === initial.captain, "Captain drifted inside the same club");
assert(firstAgain.physio.name === initial.physio, "Physio drifted inside the same club");
assert(firstAgain.teammate.name === initial.teammate, "Teammate drifted inside the same club");
assert(firstAgain.adviser.name === initial.adviser, "Adviser drifted inside the same club");
assert(firstAgain.social.name === initial.social, "Social contact drifted inside the same club");

const destination = state.offers.map((o) => o.clubId).find((id) => id !== initialClub) ?? "real-madrid";
moveToClub(state, destination, 350, 4, false);
assert(state.clubId !== initialClub, "Transfer QA did not change club");

const afterTransfer = ensureCareerCast(state);
assert(afterTransfer.adviser.name === initial.adviser, "Adviser must survive a club transfer");
assert(afterTransfer.social.name === initial.social, "Long-term social contact must survive a club transfer");
assert(afterTransfer.coach.name !== initial.coach, "Coach incorrectly followed player to new club");
assert(afterTransfer.captain.name !== initial.captain, "Captain incorrectly followed player to new club");
assert(afterTransfer.physio.name !== initial.physio, "Physio incorrectly followed player to new club");
assert(afterTransfer.teammate.name !== initial.teammate, "Current teammate incorrectly followed player to new club");

const afterTransferAgain = ensureCareerCast(state);
assert(afterTransferAgain.coach.name === afterTransfer.coach.name, "New-club coach is not stable");
assert(afterTransferAgain.captain.name === afterTransfer.captain.name, "New-club captain is not stable");
assert(afterTransferAgain.physio.name === afterTransfer.physio.name, "New-club physio is not stable");
assert(afterTransferAgain.teammate.name === afterTransfer.teammate.name, "New-club teammate is not stable");

console.log("club-scoped cast smoke passed");
