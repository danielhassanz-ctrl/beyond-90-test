import assert from "node:assert/strict";
import { confederationFor, continentalTournament, eligibleKeyMatchKinds } from "../src/game/competition-calendar";
import { createGame } from "../src/game/engine";
import { applyCareerPacing, decisionTarget, keyMatchTarget, narrativeRotationFor, narrativeTarget, setCareerMode } from "../src/game/pacing";
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
  const cases: Array<[string, ReturnType<typeof confederationFor>, string]> = [
    ["Canada", "CONCACAF", "Copa Oro"],
    ["Cameroon", "CAF", "Copa Africana de Naciones"],
    ["Egypt", "CAF", "Copa Africana de Naciones"],
    ["Ivory Coast", "CAF", "Copa Africana de Naciones"],
    ["Saudi Arabia", "AFC", "Copa Asiática"],
    ["Iran", "AFC", "Copa Asiática"],
    ["United Arab Emirates", "AFC", "Copa Asiática"],
    ["New Zealand", "OFC", "Copa de Naciones de la OFC"],
    ["Fiji", "OFC", "Copa de Naciones de la OFC"],
  ];
  for (const [nationality, confederation, tournament] of cases) {
    assert.equal(confederationFor(nationality), confederation, `${nationality} mapped to the wrong confederation`);
    assert.equal(continentalTournament(nationality), tournament, `${nationality} mapped to the wrong continental tournament`);
  }
}

{
  const s = base();
  s.clubId = "real-madrid";
  s.tablePosition = 2;
  s.queue = [{ kind: "match", tag: "decisive" }, { kind: "sim", matches: 33 }];
  applyCareerPacing(s);
  const matches = s.queue.filter((slot) => slot.kind === "match");
  assert.ok(matches.some((slot) => slot.tag === "euro"), "elite European club must receive a European key match when pacing adds matches");
  assert.equal(matches.find((slot) => slot.tag === "euro")?.competition, "UEFA Champions League");
}

{
  const s = base();
  s.clubId = "malaga";
  s.tablePosition = 8;
  s.queue = [{ kind: "match", tag: "decisive" }, { kind: "sim", matches: 33 }];
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
  s.queue = [{ kind: "match", tag: "debut" }, { kind: "sim", matches: 33 }];

  const eligible = eligibleKeyMatchKinds(s);
  assert.deepEqual(eligible, ["debut", "derby"], "academy context must not expose senior Cup/title/Europe/international beats");
  applyCareerPacing(s);
  const matches = s.queue.filter((slot) => slot.kind === "match");
  assert.ok(!matches.some((slot) => slot.tag === "euro"), "unknown 16-year-old academy player must never get a senior European match");
  assert.ok(!matches.some((slot) => slot.tag === "cup" || slot.tag === "decisive"), "academy pacing must not fabricate senior Cup/title matches");
  assert.ok(matches.length <= 3, "academy Pro season must shift density into story decisions instead of inflating key matches");
  assert.equal(matches.length, keyMatchTarget(s), "academy key-match plan must match the contextual target");
  assert.equal(narrativeTarget(s) + keyMatchTarget(s), decisionTarget(s), "reduced academy matches must be replaced by narrative decisions");
  assert.ok(narrativeTarget(s) >= 24, "Pro academy mode must preserve deep non-match decision density");

  const youthMix = narrativeRotationFor(s);
  assert.ok(youthMix.includes("training") && youthMix.includes("agent") && youthMix.includes("life"));
  assert.ok(!youthMix.includes("medical"), "healthy academy pacing should not be dominated by veteran medical themes");
}

{
  const s = base();
  s.age = 19;
  s.stage = "reserves";
  s.clubId = "real-madrid";
  s.queue = [{ kind: "match", tag: "debut" }, { kind: "sim", matches: 33 }];
  applyCareerPacing(s);
  const matches = s.queue.filter((slot) => slot.kind === "match");
  assert.ok(matches.length <= 4, "reserve season must not be padded to senior key-match density");
  assert.ok(!matches.some((slot) => slot.tag === "cup" || slot.tag === "decisive" || slot.tag === "euro"), "reserve season leaked senior competition beats");
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

console.log("COMPETITION_PACING_SMOKE_OK: nationality aliases map to the correct confederation/tournament; key matches respect competition/stage context; youth/reserves shift excess match density into narrative decisions; narrative mix changes with career age.");
