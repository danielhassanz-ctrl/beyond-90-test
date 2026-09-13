import { chooseClub, createGame } from "../src/game/engine";
import { isDisallowedNarrative, scrubDisallowedNarrative } from "../src/game/narrative-safety";
import type { GameState, Player } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const player: Player = {
  name: "Betis Injury Regression QA",
  nickname: "",
  position: "MC",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["familiar", "leal"],
};

function injuredBetisYouth(): GameState {
  let state = createGame(player);
  state = chooseClub(state, "betis");
  state.age = 16;
  state.flags["opening_v1"] = 1;
  state.flags["opening_completed"] = 1;
  state.injury = {
    label: "Lesión muscular",
    severity: "medium",
    matchesOut: 5,
    treated: true,
  };
  return state;
}

// Reproduce the concrete failure reported by the player: a 16-year-old Betis
// career, currently unavailable with a muscular injury, repeatedly receives a
// generic playable match/red-card flash. The payload details deliberately vary
// so this gate protects the *family*, not one exact historical string.
for (let attempt = 1; attempt <= 3; attempt += 1) {
  const state = injuredBetisYouth();
  state.pending = {
    type: "dynamic",
    kind: "match_flash",
    data: {
      title: attempt === 1 ? "Tarjeta roja" : attempt === 2 ? "Roja directa" : "Expulsión en el partido",
      prompt: "Una acción de partido exige una decisión inmediata.",
      attempt,
    },
  } as GameState["pending"];

  assert(isDisallowedNarrative(state), `attempt ${attempt}: injured Betis match_flash was not classified as disallowed`);
  const scrubbed = scrubDisallowedNarrative(state);
  assert(
    !(scrubbed.pending?.type === "dynamic" && scrubbed.pending.kind === "match_flash"),
    `attempt ${attempt}: injured Betis match_flash survived the shipped safety scrub`,
  );
  assert(
    scrubbed.injury !== null,
    `attempt ${attempt}: safety scrub incorrectly cleared the muscular injury while suppressing filler`,
  );
}

console.log("BETIS_INJURY_MATCH_FLASH_REGRESSION_OK: repeated red/disciplinary match_flash filler is blocked for an injured 16-year-old Betis career.");
