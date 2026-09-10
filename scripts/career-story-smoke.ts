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
import { adviserContactEveryScenes, footballCareerStoryContext } from "../src/game/football-career-story";
import { setCareerMode } from "../src/game/pacing";
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
  s.age = 16;
  assert.equal(careerEra(s), "academy");
  s.age = 20;
  assert.equal(careerEra(s), "breakthrough");
  s.age = 23;
  assert.equal(careerEra(s), "established");
  s.age = 28;
  assert.equal(careerEra(s), "prime");
  s.age = 33;
  assert.equal(careerEra(s), "veteran");
  s.age = 36;
  assert.equal(careerEra(s), "legacy");
}

{
  const s = state();
  const cast = ensureCareerCast(s);
  assert.ok(cast.adviser.name);
  assert.ok(cast.coach.name);
  assert.ok(cast.physio.name);
  assert.ok(cast.captain.name);
  assert.ok(cast.teammate.name);
  assert.ok(cast.social.name);
  assert.equal(s.memory.npcs.coach?.name, cast.coach.name);
  assert.equal(s.memory.npcs.physio?.name, cast.physio.name);
  assert.equal(s.memory.npcs.captain?.name, cast.captain.name);
  assert.equal(s.memory.npcs.friend?.name, cast.teammate.name);
  assert.deepEqual(ensureCareerCast(s), cast, "cast must persist rather than reroll");
}

{
  const s = state();
  s.age = 16;
  s.stage = "youth";
  s.overall = 68;
  s.fame = 8;
  assert.equal(careerStatus(s), "prospect");
  assert.equal(seniorInternationalEligible(s), false, "unknown academy players cannot reach senior tournaments");
  assert.equal(europeanStoryEligible(s), false, "academy players cannot receive European-night stories");
  const ctx = footballCareerStoryContext(s);
  assert.ok(ctx.themes.includes("adviser"));
  assert.ok(ctx.themes.includes("coach"));
  assert.ok(ctx.themes.includes("captain"));
  assert.ok(ctx.themes.includes("teammate"));
  assert.ok(ctx.themes.includes("family"));
  assert.ok(!ctx.themes.includes("sponsor"), "unknown 16-year-olds cannot receive superstar sponsorship arcs");
  assert.ok(!ctx.themes.includes("property"), "unknown 16-year-olds cannot receive luxury property arcs");
  assert.equal(adviserContactEveryScenes(s), 2, "the adviser must be a frequent early-career voice");
}

{
  const s = state();
  s.age = 28;
  s.stage = "first";
  s.overall = 91;
  s.fame = 92;
  s.salary = 1500;
  s.wealth = 5000;
  s.titles = ["Liga", "Champions", "Copa", "Supercopa", "Mundial de Clubes"];
  s.awards = ["Balón de Oro", "The Best"];
  const ctx = footballCareerStoryContext(s);
  assert.equal(ctx.era, "prime");
  assert.equal(ctx.status, "legend");
  assert.ok(ctx.themes.includes("sponsor"));
  assert.ok(ctx.themes.includes("property"));
  assert.ok(ctx.themes.includes("leadership"));
  assert.ok(ctx.themes.includes("national_team"));
  assert.ok(!ctx.themes.includes("legacy"), "retirement/legacy arcs should not dominate a 28-year-old legend");
}

{
  const s = state();
  setCareerMode(s, "express");
  assert.deepEqual(footballCareerStoryContext(s).seasonDecisionRange, [10, 15]);
  setCareerMode(s, "standard");
  assert.deepEqual(footballCareerStoryContext(s).seasonDecisionRange, [20, 25]);
  setCareerMode(s, "pro");
  assert.deepEqual(footballCareerStoryContext(s).seasonDecisionRange, [30, 40]);
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
  s.seasonIndex = 1; // 2027/28 -> tournament in 2028
  assert.equal(majorInternationalTournament(s), "Eurocopa");
  s.seasonIndex = 3; // 2029/30 -> World Cup in 2030
  assert.equal(majorInternationalTournament(s), "Copa Mundial de la FIFA");
}

console.log("CAREER_STORY_SMOKE_OK: ordered age/status story context, persistent cast, pacing, Europe and nationality-aware tournament chronology are guarded.");