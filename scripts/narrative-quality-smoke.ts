import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import type { GameState, Player } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

function player(seed: number): Player {
  return {
    name: `Narrative QA ${seed}`,
    nickname: "",
    position: seed % 4 === 0 ? "DC" : seed % 4 === 1 ? "MC" : seed % 4 === 2 ? "DFC" : "POR",
    nationality: "España",
    city: seed % 2 === 0 ? "Madrid" : "Sevilla",
    avatar: null,
    traits: seed % 2 === 0 ? ["ambicioso", "profesional"] : ["leal", "familiar"],
  };
}

type NarrativeObservation = {
  key: string;
  title: string;
  category: string;
  scene: number;
  strictTitle: boolean;
};

function resolvePending(s: GameState): GameState {
  if (s.lastOutcome) return advance(s);
  if (!s.pending) return advance(s);
  if (s.pending.type === "season") return advance(s);

  if (s.pending.type === "match") {
    const key = s.pending.match.keyMoment?.options[0]?.id;
    return resolveMatch(s, s.pending.match, key);
  }

  if (s.pending.type === "event") {
    const event = eventById(s.pending.eventId);
    assert(event, `Missing event ${s.pending.eventId}`);
    assert(event.choices.length === 3, `Event ${event.id} has ${event.choices.length} choices; expected 3`);
    return resolveEvent(s, event.id, event.choices[0]!.id);
  }

  const view = renderDynamic(s, s.pending);
  const informational = new Set(["promotion", "growth", "career_end"]);
  if (!informational.has(s.pending.kind)) {
    assert(view.choices.length === 3, `Dynamic ${s.pending.kind} (${view.title}) has ${view.choices.length} choices; expected 3`);
  }
  const choice = view.choices[0];
  assert(choice, `Dynamic ${s.pending.kind} (${view.title}) has no actionable choice`);
  return resolveDynamicCard(s, s.pending, choice.id);
}

function narrativeObservation(s: GameState): NarrativeObservation | null {
  if (s.pending?.type !== "dynamic") return null;
  const kind = s.pending.kind;
  const authored = kind === "arc" || kind === "arc_beat" || kind === "arc_callback" || kind.startsWith("cons_");
  if (!authored) return null;

  const view = renderDynamic(s, s.pending);
  let key = kind;
  let strictTitle = true;
  if (kind === "arc") {
    key = `${String(s.pending.data["arcId"] ?? "arc")}:${String(s.pending.data["chapter"] ?? "0")}`;
  } else if (kind === "arc_beat") {
    key = String(s.pending.data["beatId"] ?? "beat");
  } else if (kind === "arc_callback") {
    key = `callback:${String(s.pending.data["cbId"] ?? "callback")}`;
    // Callback headings intentionally come from a small editorial palette; the
    // decision text/key must be unique, but the heading may recur years later.
    strictTitle = false;
  }

  return { key, title: view.title.trim(), category: view.category, scene: s.sceneCount ?? 0, strictTitle };
}

function assertNoDuplicateMemory(s: GameState, seed: number) {
  const buckets: [string, string[]][] = [
    ["promises", s.memory.promises ?? []],
    ["conflicts", s.memory.conflicts ?? []],
    ["agent memories", s.agent.memories ?? []],
  ];
  for (const [name, values] of buckets) {
    assert(new Set(values).size === values.length, `Seed ${seed}: duplicate entries in ${name}`);
  }
}

function run(seed: number) {
  const originalRandom = Math.random;
  Math.random = rng(seed);
  try {
    let s = createGame(player(seed));
    assert(s.offers.length === 4, `Seed ${seed}: onboarding has ${s.offers.length} club offers; expected exactly 4`);
    s = chooseClub(s, s.offers[seed % s.offers.length]!.clubId);

    const observations: NarrativeObservation[] = [];
    const seenKeys = new Set<string>();
    const seenTitles = new Map<string, string>();
    let steps = 0;

    while (steps < 5000) {
      if (s.pending?.type === "dynamic" && s.pending.kind === "career_end") break;

      const obs = narrativeObservation(s);
      if (obs) {
        assert(!seenKeys.has(obs.key), `Seed ${seed}: repeated narrative scene key ${obs.key} at scene ${obs.scene}`);
        seenKeys.add(obs.key);

        if (obs.strictTitle) {
          const previousKey = seenTitles.get(obs.title);
          assert(!previousKey || previousKey === obs.key, `Seed ${seed}: repeated narrative title '${obs.title}' across ${previousKey} and ${obs.key}`);
          seenTitles.set(obs.title, obs.key);
        }
        observations.push(obs);
      }

      s = resolvePending(s);
      assertNoDuplicateMemory(s, seed);
      steps += 1;
    }

    assert(s.retired, `Seed ${seed}: career did not retire within ${steps} actions`);
    // This gate measures the authored director/consequence layer only. Agent,
    // finance, threads, matches and other interactive dynamics are validated by
    // the broader gameplay suites, so requiring dozens here would double-count
    // narrative density rather than expose repetition.
    assert(observations.length >= 12, `Seed ${seed}: only ${observations.length} authored narrative scenes observed`);

    const distinctCategories = new Set(observations.map((o) => o.category));
    assert(distinctCategories.size >= 4, `Seed ${seed}: narrative collapsed to ${distinctCategories.size} categories`);

    const early = observations.filter((o) => o.scene <= 35);
    assert(early.length >= 3, `Seed ${seed}: early career produced only ${early.length} authored scenes`);

    return {
      seed,
      authoredScenes: observations.length,
      distinctTitles: seenTitles.size,
      categories: distinctCategories.size,
      earlyScenes: early.length,
      memory: (s.memory.promises?.length ?? 0) + (s.memory.conflicts?.length ?? 0) + (s.agent.memories?.length ?? 0),
    };
  } finally {
    Math.random = originalRandom;
  }
}

const results = [3101, 3203, 3307, 3413, 3517, 3623].map(run);
const diversity = new Set(results.map((r) => `${r.authoredScenes}:${r.distinctTitles}:${r.categories}`));
assert(diversity.size >= 3, "Narrative careers are converging too strongly across seeds");

console.table(results);
console.log(`NARRATIVE_QUALITY_SMOKE_OK careers=${results.length} antiRepeat=ok onboarding=4 memoryDedup=ok diversity=${diversity.size}`);
