import { readFileSync } from "node:fs";
import { advance, chooseClub, clone, createGame, resolveDynamicCard } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { simulateMatch } from "../src/game/match";
import type { DynamicCard, GameState, Player, Slot } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const directorSource = readFileSync("src/game/director.ts", "utf8");
assert(!directorSource.includes("Buscas una tercera vía"), "Narrative director still contains generic third-way outcome copy");
assert(!directorSource.includes("Alternativa prudente con consecuencias propias"), "Narrative director still contains generic third-way hint copy");
assert(directorSource.includes("function thirdWayResult(s: GameState): Res"), "Narrative third-way variation helper is missing");
const consultBranches = directorSource.match(/if \(choiceId === "consultar"\)/g)?.length ?? 0;
assert(consultBranches === 1, `Expected one arc_callback consultar resolver, found ${consultBranches}`);

const player: Player = {
  name: "Branch QA",
  nickname: "",
  position: "DC",
  nationality: "España",
  city: "Madrid",
  avatar: null,
  traits: ["ambicioso", "profesional"],
};

let base = createGame(player);
assert(base.offers.length >= 3, "Expected at least three initial club offers");
base = chooseClub(base, base.offers[0]!.clubId);

function assertThree(card: DynamicCard, label = card.kind): void {
  const view = renderDynamic(base, card);
  assert(view.choices.length === 3, `${label}: expected exactly 3 choices, got ${view.choices.length}`);
  assert(new Set(view.choices.map((c) => c.id)).size === 3, `${label}: choice ids are not unique`);
}

const callback: DynamicCard = {
  type: "dynamic",
  kind: "arc_callback",
  data: { cbId: "qa_callback", text: "La promesa que hiciste al vestuario vuelve a la mesa" },
};
const callbackView = renderDynamic(base, callback);
assert(callbackView.choices.length === 3, `arc_callback: expected 3 choices, got ${callbackView.choices.length}`);
const callbackOutcomes = callbackView.choices.map((choice) => {
  const state = clone(base);
  return resolveDynamicCard(state, callback, choice.id).lastOutcome;
});
assert(callbackOutcomes.every(Boolean), "arc_callback: one choice produced no outcome");
assert(new Set(callbackOutcomes.map((o) => o!.title)).size === 3, "arc_callback: choices do not produce three distinct outcomes");

const decisionCards: DynamicCard[] = [
  { type: "dynamic", kind: "injury_diagnosis", data: { label: "Esguince", severity: "medium", matchesOut: 5 } },
  { type: "dynamic", kind: "return", data: { label: "Esguince" } },
  { type: "dynamic", kind: "agent_intro", data: { commission: 8 } },
  { type: "dynamic", kind: "agent_teaser", data: { teaser: "Ha llamado un club" } },
  { type: "dynamic", kind: "agent_offer", data: { clubName: "Real Sociedad", salary: 300 } },
  { type: "dynamic", kind: "agent_commission", data: { commission: 10 } },
  { type: "dynamic", kind: "contract", data: { years: 3, salary: 150 } },
  { type: "dynamic", kind: "match_flash", data: { kind: "slump", text: "Tres jornadas malas", matches: 3, wins: 0, draws: 1, losses: 2 } },
  { type: "dynamic", kind: "agent_check", data: { topic: "minutos", hour: "23:17" } },
  { type: "dynamic", kind: "market_offer", data: { kind: "transfer", clubName: "Valencia CF", salary: 500, years: 4, reason: "Quieren apostar por ti" } },
  { type: "dynamic", kind: "retirement", data: { age: 36, tier: "élite" } },
  { type: "dynamic", kind: "thread", data: { threadKind: "coach_upset", teaser: "El míster quería hablar" } },
];
for (const card of decisionCards) assertThree(card);

const retired = clone(base);
retired.retired = true;
retired.age = 36;
retired.pending = null;
retired.lastOutcome = null;
const end = advance(retired);
assert(end.pending?.type === "dynamic" && end.pending.kind === "career_end", "retired state did not produce career_end");
const endView = renderDynamic(end, end.pending);
assert(endView.choices.length === 1 && endView.choices[0]?.id === "ok", "career_end must remain informational, not a fake three-choice decision");

const matchState = clone(base);
matchState.stage = "first";
matchState.age = 24;
matchState.overall = 82;
matchState.form = 70;
matchState.fitness = 85;
matchState.rel.coach = 75;
const tags: NonNullable<Slot["tag"]>[] = ["debut", "derby", "cup", "scouts", "decisive", "euro", "final"];
let keyMoments = 0;
for (let i = 0; i < 80; i++) {
  const tag = tags[i % tags.length]!;
  const match = simulateMatch(matchState, { kind: "match", tag, ...(tag === "cup" || tag === "euro" || tag === "final" ? { tie: true } : {}) }, i + 1);
  if (match.keyMoment) {
    keyMoments += 1;
    assert(match.keyMoment.options.length === 3, `match key moment ${tag}: expected 3 options, got ${match.keyMoment.options.length}`);
    assert(new Set(match.keyMoment.options.map((o) => o.id)).size === 3, `match key moment ${tag}: duplicate option ids`);
  }
}
assert(keyMoments >= 10, `Expected broad key-moment coverage, observed only ${keyMoments}`);

console.log(`BRANCH_COVERAGE_SMOKE_OK dynamic=${decisionCards.length + 1} keyMoments=${keyMoments} careerEnd=ok genericCopy=0`);
