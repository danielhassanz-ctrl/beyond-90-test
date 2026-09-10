import assert from "node:assert/strict";
import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { CAREER_MODES, careerModeConfig, setCareerMode, type CareerMode } from "../src/game/pacing";
import type { GameState, Player } from "../src/game/types";

function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

const player: Player = {
  name: "Runtime Pacing QA",
  nickname: "",
  position: "MC",
  nationality: "España",
  city: "Madrid",
  avatar: null,
  traits: ["ambicioso", "profesional"],
};

const informationalDynamic = new Set(["promotion", "growth", "career_end"]);

function isDecision(s: GameState): boolean {
  if (!s.pending) return false;
  if (s.pending.type === "event" || s.pending.type === "match") return true;
  if (s.pending.type !== "dynamic" || informationalDynamic.has(s.pending.kind)) return false;
  return renderDynamic(s, s.pending).choices.length > 0;
}

function resolvePending(s: GameState): GameState {
  if (s.lastOutcome) return advance(s);
  if (!s.pending || s.pending.type === "season") return advance(s);
  if (s.pending.type === "match") {
    const key = s.pending.match.keyMoment?.options[0]?.id;
    return resolveMatch(s, s.pending.match, key);
  }
  if (s.pending.type === "event") {
    const event = eventById(s.pending.eventId);
    assert.ok(event, `Missing event ${s.pending.eventId}`);
    const choice = event.choices[0];
    assert.ok(choice, `Event ${event.id} has no choice`);
    return resolveEvent(s, event.id, choice.id);
  }
  const view = renderDynamic(s, s.pending);
  const choice = view.choices[0];
  if (!choice) return advance(s);
  return resolveDynamicCard(s, s.pending, choice.id);
}

function runFirstSeason(mode: CareerMode, seed: number) {
  const originalRandom = Math.random;
  Math.random = rng(seed);
  try {
    let s = createGame(player);
    s.careerSeed = seed;
    setCareerMode(s, mode);
    const offer = s.offers[0];
    assert.ok(offer, `${mode}/${seed}: no initial club offer`);
    s = chooseClub(s, offer.clubId);

    const startAge = s.age;
    let decisions = 0;
    let matches = 0;
    let steps = 0;
    const kinds: string[] = [];

    while (s.age === startAge && steps < 600) {
      if (isDecision(s)) {
        decisions += 1;
        if (s.pending?.type === "match") matches += 1;
        kinds.push(s.pending?.type === "dynamic" ? `dynamic:${s.pending.kind}` : s.pending?.type ?? "none");
      }
      s = resolvePending(s);
      steps += 1;
    }

    assert.ok(s.age > startAge, `${mode}/${seed}: season did not close after ${steps} steps`);
    const config = careerModeConfig(mode);
    assert.ok(
      decisions >= config.decisions[0] && decisions <= config.decisions[1],
      `${mode}/${seed}: player actually saw ${decisions} decisions, expected ${config.decisions[0]}-${config.decisions[1]}. ${kinds.join(", ")}`,
    );
    assert.ok(
      matches >= config.keyMatches[0] && matches <= config.keyMatches[1],
      `${mode}/${seed}: player actually saw ${matches} key matches, expected ${config.keyMatches[0]}-${config.keyMatches[1]}`,
    );
    return { mode, seed, decisions, matches, steps };
  } finally {
    Math.random = originalRandom;
  }
}

const rows = [];
for (const { id } of CAREER_MODES) {
  for (const seed of [101, 211, 307, 401, 503]) rows.push(runFirstSeason(id, seed));
}
console.table(rows);
console.log("RUNTIME_PACING_SMOKE_OK: advertised pacing matches decisions actually shown to the player.");
