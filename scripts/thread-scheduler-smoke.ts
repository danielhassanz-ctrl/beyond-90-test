import { ensureCareerCast } from "../src/game/career-life";
import { createGame } from "../src/game/engine";
import { dueThread, maybeSpawnThreads } from "../src/game/threads";
import type { GameState, Player } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const player: Player = {
  name: "Thread Scheduler QA",
  nickname: "",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["familiar", "profesional"],
};

function eligibleFallbackState(seed: number): GameState {
  const s = createGame(player);
  s.careerSeed = seed;
  s.threads = [];
  s.sceneCount = 20;
  s.flags["ultimo_hilo"] = -99;

  // coach_upset has already happened, but its condition remains strong. The
  // scheduler must skip that exhausted story and keep looking instead of
  // spending the cadence on a thread that cannot be created.
  s.memory.threads = { coach_upset: 1 };
  s.rel.coach = 10;
  s.agent.present = true;
  s.hasAgent = true;
  s.fame = 50;
  return s;
}

// Probabilities are career-seeded. It is valid for a scene to spawn no thread,
// so probe deterministic seeds until one of the later eligible stories passes.
let first: GameState | null = null;
let chosenSeed = 0;
for (let seed = 1; seed <= 10_000; seed += 1) {
  const candidate = eligibleFallbackState(seed);
  maybeSpawnThreads(candidate);
  if (candidate.threads.length === 1) {
    first = candidate;
    chosenSeed = seed;
    break;
  }
}
assert(first, "no deterministic seed produced an eligible fallback thread");
const spawnedKind = first.threads[0]!.kind;
assert(spawnedKind !== "coach_upset", "scheduler reused an exhausted story kind");
assert(first.flags["ultimo_hilo"] === 20, "actual spawned fallback did not consume cadence at the correct scene");

// A fresh copy of the same career state must choose the same fallback without
// depending on global Math.random.
const replay = eligibleFallbackState(chosenSeed);
maybeSpawnThreads(replay);
assert(replay.threads.length === 1, "deterministic replay failed to spawn the same fallback thread");
assert(replay.threads[0]!.kind === spawnedKind, `scheduler was not deterministic: ${spawnedKind} vs ${replay.threads[0]!.kind}`);
assert(replay.threads[0]!.teaser === first.threads[0]!.teaser, "deterministic replay changed player-visible teaser copy");

// A second call at the same scene must respect the cooldown created by the
// real spawn rather than opening another narrative thread immediately.
maybeSpawnThreads(first);
assert(first.threads.length === 1, "thread cooldown did not hold after the successful fallback spawn");

// Long-term personal memories must return through the person who owns the
// relationship. A partner decision coming back a season later should be voiced
// by that established partner, not generically by the representative.
const personal = createGame(player);
personal.careerSeed = 4242;
personal.seasonIndex = 1;
personal.sceneCount = 20;
personal.threads = [];
personal.flags["ultimo_hilo"] = -99;
personal.flags["partner_active"] = 1;
personal.memory.threads = {};
personal.memory.promises = ["Prometiste a tu pareja que la próxima decisión importante se hablaría en casa"];
personal.memory.conflicts = [];
const partnerName = ensureCareerCast(personal).partner.name;
const recalled = dueThread(personal);
assert(recalled, "personal long-term memory did not surface");
assert(recalled.kind === "family_worry", `personal memory routed to unexpected kind ${recalled.kind}`);
assert(recalled.teaser.includes(partnerName), `partner memory callback lost the established partner identity: ${recalled.teaser}`);
assert(!recalled.teaser.includes(personal.agent.name), "partner memory callback was incorrectly voiced by the representative");

console.log(`THREAD_SCHEDULER_SMOKE_OK seed=${chosenSeed} exhaustedFallback=${spawnedKind} deterministicReplay=ok cooldownOnRealSpawn=ok personalMemorySpeaker=${partnerName}`);
