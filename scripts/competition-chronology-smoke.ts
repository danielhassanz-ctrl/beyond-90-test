import assert from "node:assert/strict";
import { createGame } from "../src/game/engine";
import { confederationFor, continentalTournament, majorInternationalTournament, seniorInternationalEligible } from "../src/game/competition-calendar";
import type { Player } from "../src/game/types";

function state(nationality: string) {
  const player: Player = { name: "QA Player", nickname: "", position: "MC", nationality, city: "Madrid", avatar: null, traits: ["profesional", "ambicioso"] };
  return createGame(player);
}

assert.equal(confederationFor("España"), "UEFA");
assert.equal(confederationFor("Argentina"), "CONMEBOL");
assert.equal(confederationFor("Marruecos"), "CAF");
assert.equal(confederationFor("Japón"), "AFC");
assert.equal(continentalTournament("España"), "Eurocopa");
assert.equal(continentalTournament("Argentina"), "Copa América");

const teen = state("España");
teen.age = 16; teen.stage = "youth"; teen.overall = 72; teen.fame = 5;
assert.equal(seniorInternationalEligible(teen), false, "an unknown 16-year-old must not enter senior tournament stories");

const spain2028 = state("España");
spain2028.seasonIndex = 1;
assert.equal(majorInternationalTournament(spain2028), "Eurocopa", "Spain should reach Euro 2028 on the correct cycle");
const spain2030 = state("España");
spain2030.seasonIndex = 3;
assert.equal(majorInternationalTournament(spain2030), "Copa Mundial de la FIFA", "2030 must be a World Cup year");
const spain2029 = state("España");
spain2029.seasonIndex = 2;
assert.equal(majorInternationalTournament(spain2029), null, "major tournaments must not appear in arbitrary years");

const argentina2028 = state("Argentina"); argentina2028.seasonIndex = 1;
assert.equal(majorInternationalTournament(argentina2028), "Copa América");
const morocco2029 = state("Marruecos"); morocco2029.seasonIndex = 2;
assert.equal(majorInternationalTournament(morocco2029), "Copa Africana de Naciones");

console.log("Competition chronology QA passed: nationality mapping, continental cups, World Cup cycles and teenage merit gate are coherent.");
