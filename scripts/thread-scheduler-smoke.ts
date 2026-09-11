import { createGame } from "../src/game/engine";
import { maybeSpawnThreads } from "../src/game/threads";
import type { Player } from "../src/game/types";

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

const originalRandom = Math.random;
Math.random = () => 0;
try {
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

  maybeSpawnThreads(s);
  assert(s.threads.length === 1, "consumed high-priority thread suppressed all later eligible threads");
  assert(s.threads[0]!.kind === "club_interest", `expected club_interest fallback, got ${s.threads[0]!.kind}`);
  assert(s.flags["ultimo_hilo"] === 20, "actual spawned fallback did not consume cadence at the correct scene");

  // A second call at the same scene must respect the cooldown created by the
  // real spawn rather than opening another narrative thread immediately.
  maybeSpawnThreads(s);
  assert(s.threads.length === 1, "thread cooldown did not hold after the successful fallback spawn");
} finally {
  Math.random = originalRandom;
}

console.log("THREAD_SCHEDULER_SMOKE_OK exhaustedFallback=ok cooldownOnRealSpawn=ok");
