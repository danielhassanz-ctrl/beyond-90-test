import { ensureCareerCast } from "../src/game/career-life";
import { CLUB_POOL } from "../src/game/clubs";
import { moveToClub } from "../src/game/career";
import { chooseClub, createGame } from "../src/game/engine";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
import type { GameState, Player } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function player(seed: number): Player {
  const positions: Player["position"][] = ["DC", "MC", "MCO", "EXT", "DFC", "LAT"];
  return {
    name: `Cast QA ${seed}`,
    nickname: "",
    position: positions[seed % positions.length]!,
    nationality: "España",
    city: seed % 2 ? "Sevilla" : "Madrid",
    avatar: null,
    traits: seed % 2 ? ["familiar", "leal"] : ["ambicioso", "profesional"],
  };
}

function hydrate(state: GameState): GameState {
  // Saves are persisted as JSON in the browser. Use the same serialization boundary
  // here so continuity cannot pass only because every assertion reads one live object.
  return JSON.parse(JSON.stringify(state)) as GameState;
}

type Snapshot = ReturnType<typeof snapshot>;
function snapshot(s: GameState) {
  const cast = ensureCareerCast(s);
  return {
    adviser: cast.adviser.id,
    social: cast.social.id,
    partner: cast.partner.id,
    coach: cast.coach.id,
    captain: cast.captain.id,
    physio: cast.physio.id,
    teammate: cast.teammate.id,
    clubScope: cast.clubScope ?? "",
  };
}

function assertPersonalStable(label: string, before: Snapshot, after: Snapshot) {
  for (const key of ["adviser", "social", "partner"] as const) {
    assert(after[key] === before[key], `${label}: career-scoped ${key} drifted (${before[key]} -> ${after[key]})`);
  }
}

function assertClubStable(label: string, before: Snapshot, after: Snapshot) {
  for (const key of ["coach", "captain", "physio", "teammate"] as const) {
    assert(after[key] === before[key], `${label}: club-scoped ${key} drifted without transfer (${before[key]} -> ${after[key]})`);
  }
}

function assertClubRotated(label: string, before: Snapshot, after: Snapshot) {
  for (const key of ["coach", "captain", "physio", "teammate"] as const) {
    assert(after[key] !== before[key], `${label}: club-scoped ${key} incorrectly followed the player through a transfer`);
  }
}

function run(mode: CareerMode, seed: number) {
  let s = createGame(player(seed));
  s.careerSeed = seed;
  setCareerMode(s, mode);

  const preClub = snapshot(s);
  const openingCast = ensureCareerCast(s);
  assert(openingCast.adviser.name.length > 1, `${mode}/${seed}: adviser has no persistent identity`);
  assert(openingCast.social.name.length > 1, `${mode}/${seed}: social contact has no persistent identity`);
  assert(openingCast.partner.name.length > 1, `${mode}/${seed}: partner has no persistent identity`);
  assert(openingCast.social.id !== openingCast.partner.id, `${mode}/${seed}: partner/social identities collided`);
  assert(openingCast.social.name !== openingCast.partner.name, `${mode}/${seed}: partner/social names collided`);

  const firstClubId = s.offers[0]?.clubId;
  assert(firstClubId, `${mode}/${seed}: no opening club offer`);
  s = chooseClub(s, firstClubId);
  const firstClub = snapshot(s);

  // Binding the pre-club opening cast to the first club is not a transfer. The
  // names introduced during the life-first opening must remain the same.
  assertPersonalStable(`${mode}/${seed} first-club bind`, preClub, firstClub);
  assertClubStable(`${mode}/${seed} first-club bind`, preClub, firstClub);
  assert(firstClub.clubScope === firstClubId, `${mode}/${seed}: first club scope was not bound to ${firstClubId}`);

  // The first-15 window must survive the browser save/hydration boundary, not just
  // repeated reads of one in-memory object. Rehydrate after every simulated beat.
  for (let decision = 1; decision <= 15; decision++) {
    s.sceneCount = decision;
    s = hydrate(s);
    const again = snapshot(s);
    assertPersonalStable(`${mode}/${seed} decision ${decision} hydration`, firstClub, again);
    assertClubStable(`${mode}/${seed} decision ${decision} hydration`, firstClub, again);
  }

  const destination = CLUB_POOL.find((club) => club.id !== firstClubId);
  assert(destination, `${mode}/${seed}: no transfer destination available`);
  moveToClub(s, destination.id, Math.max(250, s.salary || 0), 3, false);
  const transferred = snapshot(s);
  assertPersonalStable(`${mode}/${seed} transfer`, firstClub, transferred);
  assertClubRotated(`${mode}/${seed} transfer`, firstClub, transferred);
  assert(transferred.clubScope === destination.id, `${mode}/${seed}: transfer scope did not move to ${destination.id}`);

  s = hydrate(s);
  const hydratedAgain = snapshot(s);
  assertPersonalStable(`${mode}/${seed} post-transfer hydration`, transferred, hydratedAgain);
  assertClubStable(`${mode}/${seed} post-transfer hydration`, transferred, hydratedAgain);
  assert(hydratedAgain.clubScope === destination.id, `${mode}/${seed}: hydrated transfer scope drifted from ${destination.id}`);
}

const modes: CareerMode[] = ["express", "standard", "pro"];
const seeds = [101, 2026, 31337, 90909];
for (const mode of modes) {
  for (const seed of seeds) run(mode, seed + modes.indexOf(mode) * 100000);
}

console.log("FIRST15_CAST_CONTINUITY_OK: 12 deterministic Express/Standard/Pro careers preserve adviser/social/partner and club staff across JSON save hydration through the first-15 window; club staff rotate only on a real transfer and remain stable after post-transfer hydration.");
