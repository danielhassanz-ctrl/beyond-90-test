import { createGame } from "../src/game/engine";
import { maybeSpawnThreads } from "../src/game/threads";
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

function eligibleFallbackState(): GameState {
  const s = createGame(player);
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

const first = eligibleFallbackState();
maybeSpawnThreads(first);
assert(first.threads.length === 1, "consumed high-priority thread suppressed all later eligible threads");
const spawnedKind = first.threads[0]!.kind;
assert(spawnedKind !== "coach_upset", "scheduler reused an exhausted story kind");
assert(first.flags["ultimo_hilo"] === 20, "actual spawned fallback did not consume cadence at the correct scene");

// The scheduler is career-seeded. A fresh copy of the same career state must
// choose the same fallback without depending on global Math.random.
const replay = eligibleFallbackState();
maybeSpawnThreads(replay);
assert(replay.threads.length === 1, "deterministic replay failed to spawn a fallback thread");
assert(replay.threads[0]!.kind === spawnedKind, `scheduler was not deterministic: ${spawnedKind} vs ${replay.threads[0]!.kind}`);
assert(replay.threads[0]!.teaser === first.threads[0]!.teaser, "deterministic replay changed player-visible teaser copy");

// A second call at the same scene must respect the cooldown created by the
// real spawn rather than opening another narrative thread immediately.
maybeSpawnThreads(first);
assert(first.threads.length === 1, "thread cooldown did not hold after the successful fallback spawn");

console.log(`THREAD_SCHEDULER_SMOKE_OK exhaustedFallback=${spawnedKind} deterministicReplay=ok cooldownOnRealSpawn=ok`);
