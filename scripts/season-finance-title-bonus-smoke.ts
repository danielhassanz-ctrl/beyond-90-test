import { createGame } from "../src/game/engine";
import { emptyFinance, seasonFinance } from "../src/game/finance";
import type { GameState, Player, SeasonRecord } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const player: Player = {
  name: "Finance QA",
  nickname: "",
  position: "MC",
  nationality: "España",
  city: "Madrid",
  avatar: null,
  traits: ["profesional"],
};

function season(): SeasonRecord {
  return {
    season: "2030/31",
    age: 26,
    club: "QA Club",
    stage: "first",
    overall: 82,
    apps: 0,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    ratingSum: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    milestones: [],
  };
}

function state(): GameState {
  const s = createGame(player);
  s.age = 26;
  s.stage = "first";
  s.overall = 82;
  s.salary = 100;
  s.agent.present = false;
  s.fame = 0;
  s.seasons = [season()];
  s.titles = ["LaLiga", "Copa del Rey", "UEFA Champions League"];
  s.awards = [];
  s.finance = emptyFinance(100);
  return s;
}

// Historical honours must never be paid again in a later trophyless season.
const trophyless = state();
seasonFinance(trophyless, 0);
assert(trophyless.finance?.bonuses === 0, `Historical titles leaked into current bonus: ${trophyless.finance?.bonuses}`);

// Current-season honours are paid exactly once and only for that season.
const doubleWinner = state();
seasonFinance(doubleWinner, 2);
assert(doubleWinner.finance?.bonuses === 30, `Expected 30k current-season title bonus, got ${doubleWinner.finance?.bonuses}`);

// Re-running a new trophyless year with the same career palmares cannot repay those titles.
doubleWinner.seasons = [season()];
seasonFinance(doubleWinner, 0);
assert(doubleWinner.finance?.bonuses === 0, `Title bonus was repaid in a later season: ${doubleWinner.finance?.bonuses}`);

// This focused smoke stays intentionally tiny; the PR gates run full-career,
// narrative, build and WebKit persistence checks against the same patched tree.
console.log("season finance title bonus smoke: OK");
