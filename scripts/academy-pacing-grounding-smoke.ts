import assert from "node:assert/strict";
import { createGame } from "../src/game/engine";
import { narrativeRotationFor } from "../src/game/pacing";
import type { Player } from "../src/game/types";

const player: Player = {
  name: "QA Academy Player",
  nickname: "",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["familiar", "ambicioso"],
};

const state = createGame(player);
state.age = 16;
state.stage = "youth";

const rotation = narrativeRotationFor(state);
assert.ok(rotation.includes("life"), "academy pacing must reserve space for ordinary life/family context");
assert.ok(rotation.includes("agent"), "academy pacing must keep the adviser present");
assert.ok(rotation.includes("training"), "academy pacing must keep football-development context");
assert.equal(rotation.includes("gossip"), false, "unknown academy players must not reserve pacing beats for celebrity gossip");
assert.equal(rotation.includes("press"), false, "unknown academy players must not reserve pacing beats for press cycles");
assert.equal(rotation.includes("market"), false, "academy pacing must not behave like an established-player transfer market loop");

console.log("Academy pacing grounding QA passed: life/adviser/development preserved; gossip/press/market celebrity loops excluded.");
