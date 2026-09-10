import assert from "node:assert/strict";
import { createGame } from "../src/game/engine";
import { careerEra, careerStatus, ensureCareerCast } from "../src/game/career-life";
import {
  confederationFor,
  continentalTournament,
  europeanStoryEligible,
  majorInternationalTournament,
  seniorInternationalEligible,
} from "../src/game/competition-calendar";
import type { GameState, Player } from "../src/game/types";

const basePlayer: Player = {
  name: "Story QA",
  nickname: "",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["ambicioso", "profesional"],
};

function state(): GameState {
  const s = createGame(basePlayer);
  s.careerSeed = 20260910;
  s.clubId = s.offers[0]?.clubId ?? "";
  return s;
}

{
  const s = state();
  s.age = 16; assert.equal(careerEra(s), "academy");
  s.age = 20; assert.equal(careerEra(s), "breakthrough");
  s.age = 23; assert.equal(careerEra(s), "established");
  s.age = 28; assert.equal(careerEra(s), "prime");
  s.age = 33; assert.equal(careerEra(s), "veteran");
  s.age = 36; assert.equal(careerEra(s), "legacy");
}

{
  const s = state();
  const cast = ensureCareerCast(s);
  assert.ok(cast.adviser.name && cast.coach.name && cast.physio.name && cast.captain.name && cast.teammate.name && cast.social.name);
  assert.equal(s.memory.npcs.coach?.name, cast.coach.name);
  assert.equal(s.memory.npcs.physio?.name, cast.physio.name);
  assert.equal(s.memory.npcs.captain?.name, cast.captain.name);
  assert.equal(s.memory.npcs.friend?.name, cast.teammate.name);
  assert.deepEqual(ensureCareerCast(s), cast, "cast must persist rather than reroll");
}

{
  const s = state();
  s.age = 16; s.stage = "youth"; s.overall = 68; s.fame = 8;
  assert.equal(careerStatus(s), "prospect");
  assert.equal(seniorInternationalEligible(s), false, "unknown academy players cannot reach senior tournaments");
  assert.equal(europeanStoryEligible(s), false, "academy players cannot receive European-night stories");
}

{
  assert.equal(confederationFor("España"), "UEFA");
  assert.equal(continentalTournament("España"), "Eurocopa");
  assert.equal(confederationFor("Argentina"), "CONMEBOL");
  assert.equal(continentalTournament("Argentina"), "Copa América");
  assert.equal(confederationFor("Marruecos"), "CAF");
  assert.equal(continentalTournament("Marruecos"), "Copa Africana de Naciones");
  assert.equal(confederationFor("Japón"), "AFC");
  assert.equal(continentalTournament("Japón"), "Copa Asiática");
}

{
  const s = state();
  s.player.nationality = "España";
  s.seasonIndex = 1;
  assert.equal(majorInternationalTournament(s), "Eurocopa");
  s.seasonIndex = 3;
  assert.equal(majorInternationalTournament(s), "Copa Mundial de la FIFA");
}

console.log("CAREER_STORY_SMOKE_OK: age/status, persistent cast, Europe and nationality-aware tournament chronology are guarded.");
