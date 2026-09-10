import assert from "node:assert/strict";
import { createGame } from "../src/game/engine";
import { applyCareerPacing, narrativeRotationFor, setCareerMode } from "../src/game/pacing";
import type { GameState, Player } from "../src/game/types";

const player: Player = {
  name: "Competition QA",
  nickname: "",
  position: "MCO",
  nationality: "España",
  city: "Madrid",
  avatar: null,
  traits: ["ambicioso", "profesional"],
};

function base(): GameState {
  const s = createGame(player);
  s.careerSeed = 901026;
  s.flags = {};
  s.pending = null;
  s.stage = "first";
  s.age = 25;
  s.overall = 86;
  s.fame = 78;
  setCareerMode(s, "pro");
  return s;
}

{
  const s = base();
  s.clubId = "real-madrid";
  s.tablePosition = 2;
  s.queue = [
    { kind: "match", tag: "decisive" },
    { kind: "sim", matches: 33 },
  ];
  applyCareerPacing(s);
  const matches = s.queue.filter((slot) => slot.kind === "match");
  assert.ok(matches.some((slot) => slot.tag === "euro"), "elite European club must receive a European key match when pacing adds matches");
  const euro = matches.find((slot) => slot.tag === "euro");
  assert.equal(euro?.competition, "UEFA Champions League");
}

{
  const s = base();
  s.clubId = "malaga";
  s.tablePosition = 8;
  s.queue = [
    { kind: "match", tag: "decisive" },
    { kind: "sim", matches: 33 },
  ];
  applyCareerPacing(s);
  const matches = s.queue.filter((slot) => slot.kind === "match");
  assert.ok(!matches.some((slot) => slot.tag === "euro"), "non-qualified club must never get a fabricated European key match");
}

{
  const s = base();
  s.age = 16;
  s.stage = "youth";
  s.overall = 62;
  s.fame = 4;
  s.clubId = "real-madrid";
  s.tablePosition = 1;
  s.queue = [
    { kind: "match", tag: "debut" },
    { kind: "sim", matches: 33 },
  ];
  applyCareerPacing(s);
  const matches = s.queue.filter((slot) => slot.kind === "match");
  assert.ok(!matches.some((slot) => slot.tag === "euro"), "unknown 16-year-old academy player must never get a senior European match");
  const youthMix = narrativeRotationFor(s);
  assert.ok(youthMix.includes("training") && youthMix.includes("agent") && youthMix.includes("life"));
  assert.ok(!youthMix.includes("medical"), "healthy academy pacing should not be dominated by veteran medical themes");
}

{
  const s = base();
  s.age = 29;
  const primeMix = narrativeRotationFor(s);
  assert.ok(primeMix.includes("market") && primeMix.includes("press") && primeMix.includes("life"));
  assert.notDeepEqual(primeMix, narrativeRotationFor({ ...s, age: 17 }), "a 29-year-old star cannot receive the same seasonal decision mix as a 17-year-old prospect");
}

{
  const s = base();
  s.age = 35;
  const legacyMix = narrativeRotationFor(s);
  assert.ok(legacyMix.includes("medical") && legacyMix.includes("life") && legacyMix.includes("agent"));
}

console.log("COMPETITION_PACING_SMOKE_OK: key matches respect competition context and narrative density changes with career age.");
