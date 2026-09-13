import { directorCard, directorNewSeason } from "../src/game/director";
import { renderDynamic } from "../src/game/dynamic";
import { chooseClub, createGame, resolveDynamicCard } from "../src/game/engine";
import type { GameState, Player } from "../src/game/types";

function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const onFieldCopy = /(te cambian en|sales? de titular|entras? al campo|debutas?|partidillo|dos actuaciones|rivales? te preparan|te silban al cambiarte|marcas? (?:un )?gol|doble marca|faltas tácticas)/i;

function player(seed: number): Player {
  return {
    name: `Injury QA ${seed}`,
    nickname: "",
    position: seed % 2 ? "MC" : "EXT",
    nationality: "España",
    city: seed % 2 ? "Sevilla" : "Madrid",
    avatar: null,
    traits: ["profesional", "familiar"],
  };
}

function prepare(seed: number, senior: boolean): GameState {
  const oldRandom = Math.random;
  Math.random = rng(seed);
  try {
    let s = createGame(player(seed));
    s.careerSeed = seed;
    const club = s.offers[0]?.clubId;
    assert(club, `seed ${seed}: no opening club`);
    s = chooseClub(s, club);
    s.pending = null;
    s.lastOutcome = null;
    s.flags["opening_completed"] = 1;
    if (senior) {
      s.stage = "first";
      s.age = 22;
      s.overall = 78;
      s.potential = Math.max(s.potential, 82);
      s.fame = 52;
      s.salary = 240;
      s.contract = "Primer equipo";
      s.hasAgent = true;
      s.agent.present = true;
      if (s.seasons[0]) s.seasons[0].apps = 24;
    }
    s.director = undefined;
    directorNewSeason(s);
    s.injury = { label: "Lesión muscular QA", severity: "medium", matchesOut: 8, treated: true };
    return s;
  } finally {
    Math.random = oldRandom;
  }
}

function probe(seed: number, senior: boolean) {
  let s = prepare(seed, senior);
  let surfaced = 0;
  for (let i = 0; i < 90; i++) {
    s.beat += 4;
    const card = directorCard(s);
    if (!card) continue;
    const view = renderDynamic(s, card);
    const copy = `${view.title} ${view.text}`;
    assert(view.category === "medical" || view.image === "injury" || (view.image !== "match" && view.image !== "training" && view.category !== "training"), `${seed}/${senior ? "senior" : "youth"}: injured player received ${view.image}/${view.category}: ${view.title}`);
    assert(view.category === "medical" || view.image === "injury" || !onFieldCopy.test(copy), `${seed}/${senior ? "senior" : "youth"}: injured player received on-field narrative: ${view.title} — ${view.text}`);
    const choice = view.choices[0];
    assert(choice, `${seed}: card ${card.kind} has no choice`);
    s = resolveDynamicCard(s, card, choice.id);
    s.pending = null;
    s.lastOutcome = null;
    s.injury = { label: "Lesión muscular QA", severity: "medium", matchesOut: 8, treated: true };
    surfaced += 1;
  }
  assert(surfaced >= 2, `${seed}/${senior ? "senior" : "youth"}: insufficient Director coverage while injured (${surfaced})`);
}

for (const seed of [45, 101, 2026, 31337, 90909, 77123]) {
  probe(seed, false);
  probe(seed + 100000, true);
}

console.log("INJURY_DIRECTOR_CHRONOLOGY_OK: 12 deterministic injured-career probes surfaced no on-field/training Story Director decisions.");
