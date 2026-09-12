import { createGame } from "../src/game/engine";
import { ensureFinance, netWorth } from "../src/game/finance";
import { choosePostCareerPath, choosePostCareerStyle, postCareerStatus } from "../src/game/postcareer";
import type { Player } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const player: Player = {
  name: "Postcareer Finance QA",
  nickname: "",
  position: "MC",
  nationality: "España",
  city: "Madrid",
  avatar: null,
  traits: ["profesional"],
};

function retiredState() {
  const s = createGame(player);
  s.retired = true;
  s.age = 38;
  s.stage = "first";
  const finance = ensureFinance(s);
  finance.cash = 1_000;
  s.wealth = netWorth(s);
  return s;
}

// Agent path: the €350k reward must land in the same Finance ledger that
// Patrimony and Legacy render, not only in the compatibility wealth field.
{
  const base = retiredState();
  const withPath = choosePostCareerPath(base, "agent");
  const completed = choosePostCareerStyle(withPath, "b");
  const finance = ensureFinance(completed);
  assert(finance.cash === 1_350, `Agent reward missing from Finance cash: ${finance.cash}`);
  assert(netWorth(completed) === 1_350, `Agent reward missing from net worth: ${netWorth(completed)}`);
  assert(completed.wealth === 1_350, `Compatibility wealth not synchronized: ${completed.wealth}`);
  assert(finance.history[0]?.amount === 350, "Agent reward missing from Finance history");
  assert(postCareerStatus(completed).complete, "Post-career state did not complete after style choice");

  const fameAfter = completed.fame;
  const replay = choosePostCareerStyle(completed, "b");
  assert(replay === completed, "Completed post-career style should be idempotent");
  assert(ensureFinance(replay).cash === 1_350, "Repeated style minted cash twice");
  assert(replay.fame === fameAfter, "Repeated style applied fame twice");

  const changedPath = choosePostCareerPath(completed, "president");
  assert(changedPath === completed, "Completed post-career path was mutable after final choice");
}

// President/investor path: the €500k reward must use the same persistent ledger.
{
  const base = retiredState();
  const withPath = choosePostCareerPath(base, "president");
  const completed = choosePostCareerStyle(withPath, "b");
  const finance = ensureFinance(completed);
  assert(finance.cash === 1_500, `President reward missing from Finance cash: ${finance.cash}`);
  assert(netWorth(completed) === 1_500, `President reward missing from net worth: ${netWorth(completed)}`);
  assert(completed.wealth === 1_500, "President compatibility wealth not synchronized");
  assert(finance.history[0]?.amount === 500, "President reward missing from Finance history");
}

// Active players cannot trigger post-career rewards through stale/direct actions.
{
  const active = createGame(player);
  active.retired = false;
  const financeBefore = ensureFinance(active).cash;
  const rejectedPath = choosePostCareerPath(active, "agent");
  assert(rejectedPath === active, "Active player was allowed to choose a post-career path");
  const rejectedStyle = choosePostCareerStyle(active, "b");
  assert(rejectedStyle === active, "Active player was allowed to choose a post-career style");
  assert(ensureFinance(active).cash === financeBefore, "Active-player post-career action mutated cash");
}

console.log("post-career finance integration smoke: OK");
