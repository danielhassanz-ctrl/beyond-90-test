import fs from "node:fs";
import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening, OPENING_DONE, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
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
  text: string;
  choices: string[];
  category: string;
  scene: number;
  strictTitle: boolean;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\d+/g, "#")
    .replace(/[^a-zñ#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): Set<string> {
  return new Set(normalize(value).split(" ").filter((x) => x.length >= 3));
}

function jaccard(a: string, b: string): number {
  const aa = tokens(a);
  const bb = tokens(b);
  if (aa.size === 0 || bb.size === 0) return 0;
  let intersection = 0;
  for (const word of aa) if (bb.has(word)) intersection += 1;
  return intersection / (aa.size + bb.size - intersection);
}

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

  assert(s.pending.kind !== "agent_check", "Banned generic agent_check reached the engine runtime");
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
  if (s.pending?.type === "event") {
    const event = eventById(s.pending.eventId);
    if (!event) return null;
    const text = typeof event.text === "function" ? event.text(s) : event.text;
    return {
      key: `event:${event.id}`,
      title: event.title.trim(),
      text: text.trim(),
      choices: event.choices.map((choice) => choice.label.trim()),
      category: event.category ?? "life",
      scene: s.sceneCount ?? 0,
      strictTitle: true,
    };
  }

  if (s.pending?.type !== "dynamic") return null;
  const kind = s.pending.kind;
  const authored = kind === "arc" || kind === "arc_beat" || kind === "arc_callback" || kind === "thread" || kind.startsWith("cons_");
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
    strictTitle = false;
  } else if (kind === "thread") {
    key = `thread:${String(s.pending.data["threadId"] ?? "thread")}`;
  }

  return {
    key,
    title: view.title.trim(),
    text: view.text.trim(),
    choices: view.choices.map((choice) => choice.label.trim()),
    category: view.category,
    scene: s.sceneCount ?? 0,
    strictTitle,
  };
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

function assertSourceHasNoLegacyAgentCheck() {
  const engine = fs.readFileSync("src/game/engine.ts", "utf8");
  const dynamic = fs.readFileSync("src/game/dynamic.ts", "utf8");
  assert(!engine.includes('dyn("agent_check"'), "engine.ts can still emit the banned generic agent_check card");
  assert(!dynamic.includes('case "agent_check"'), "dynamic.ts still contains an agent_check render/resolve path");
  assert(!dynamic.includes("AGENT_TOPICS"), "dynamic.ts still contains the generic adviser copy bank");
}

function assertNarrativeNotRepeated(observations: NarrativeObservation[], seed: number) {
  const exact = new Map<string, NarrativeObservation>();
  const titleChoices = new Map<string, NarrativeObservation>();

  for (const obs of observations) {
    const fingerprint = [normalize(obs.title), normalize(obs.text), obs.choices.map(normalize).join("|")].join("::");
    const previousExact = exact.get(fingerprint);
    assert(!previousExact, `Seed ${seed}: exact narrative repeated at scenes ${previousExact?.scene} and ${obs.scene}: '${obs.title}'`);
    exact.set(fingerprint, obs);

    if (obs.strictTitle) {
      const tc = `${normalize(obs.title)}::${obs.choices.map(normalize).join("|")}`;
      const previous = titleChoices.get(tc);
      assert(!previous, `Seed ${seed}: same narrative setup/options repeated at scenes ${previous?.scene} and ${obs.scene}: '${obs.title}'`);
      titleChoices.set(tc, obs);
    }
  }

  for (let i = 0; i < observations.length; i += 1) {
    const a = observations[i]!;
    for (let j = i + 1; j < observations.length; j += 1) {
      const b = observations[j]!;
      if (a.category !== b.category) continue;
      if (normalize(a.title) !== normalize(b.title)) continue;
      const similarity = jaccard(a.text, b.text);
      assert(similarity < 0.96, `Seed ${seed}: near-identical '${a.title}' narrative repeated at scenes ${a.scene}/${b.scene} (similarity ${similarity.toFixed(2)})`);
    }
  }
}

function resolveOpening(s: GameState, seed: number, observations: NarrativeObservation[]): GameState {
  initializeOpening(s);
  let guard = 0;
  while ((s.flags[OPENING_PHASE] ?? OPENING_DONE) < OPENING_DONE && guard < 20) {
    const phase = s.flags[OPENING_PHASE] ?? OpeningPhase.HOME;
    if (phase === OpeningPhase.CLUB_CHOICE) {
      const offer = s.offers[seed % s.offers.length];
      assert(offer, `Seed ${seed}: no opening club offer available`);
      s = afterOpeningClubChoice(chooseClub(s, offer.clubId));
      guard += 1;
      continue;
    }

    s = forceOpeningPending(s) ?? s;
    assert(s.pending?.type === "event", `Seed ${seed}: opening phase ${phase} did not surface an authored event`);
    const obs = narrativeObservation(s);
    assert(obs, `Seed ${seed}: opening event could not be observed`);
    observations.push(obs);

    const event = eventById(s.pending.eventId);
    assert(event, `Seed ${seed}: missing opening event ${s.pending.eventId}`);
    const choice = event.choices[0];
    assert(choice, `Seed ${seed}: opening event ${event.id} has no choice`);
    s = resolveEvent(s, event.id, choice.id);
    s = forceOpeningPending(s) ?? s;
    guard += 1;
  }
  assert((s.flags[OPENING_PHASE] ?? -1) === OPENING_DONE, `Seed ${seed}: mandatory opening did not complete`);
  return s;
}

function run(seed: number) {
  const originalRandom = Math.random;
  Math.random = rng(seed);
  try {
    let s = createGame(player(seed));
    s.careerSeed = seed;
    assert(s.offers.length === 4, `Seed ${seed}: onboarding has ${s.offers.length} club offers; expected exactly 4`);

    const observations: NarrativeObservation[] = [];
    s = resolveOpening(s, seed, observations);

    const seenKeys = new Set<string>();
    const seenTitles = new Map<string, string>();
    for (const obs of observations) {
      assert(!seenKeys.has(obs.key), `Seed ${seed}: repeated opening narrative key ${obs.key}`);
      seenKeys.add(obs.key);
      seenTitles.set(obs.title, obs.key);
    }

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
    assert(observations.length >= 12, `Seed ${seed}: only ${observations.length} authored narrative scenes observed`);
    assertNarrativeNotRepeated(observations, seed);

    const distinctCategories = new Set(observations.map((o) => o.category));
    assert(distinctCategories.size >= 4, `Seed ${seed}: narrative collapsed to ${distinctCategories.size} categories`);

    const early = observations.filter((o) => o.scene <= 35);
    assert(early.length >= 9, `Seed ${seed}: mandatory opening/early career produced only ${early.length} authored scenes`);

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

assertSourceHasNoLegacyAgentCheck();
const results = [3101, 3203, 3307, 3413, 3517, 3623, 3727, 3821, 3923].map(run);
const diversity = new Set(results.map((r) => `${r.authoredScenes}:${r.distinctTitles}:${r.categories}`));
assert(diversity.size >= 3, "Narrative careers are converging too strongly across seeds");

console.table(results);
console.log(`NARRATIVE_QUALITY_SMOKE_OK careers=${results.length} sourceBan=agent_check antiRepeat=opening+events+exact+setup+near memoryDedup=ok diversity=${diversity.size}`);
