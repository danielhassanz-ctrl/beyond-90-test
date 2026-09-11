import { createGame } from "../src/game/engine";
import { closeThread, dueThread, maybeSpawnThreads, spawnThread, type ThreadKind } from "../src/game/threads";
import type { Player } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const player: Player = {
  name: "Thread Anti Repeat QA",
  nickname: "",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["familiar", "profesional"],
};

const kinds: ThreadKind[] = [
  "club_interest",
  "coach_upset",
  "teammate_jealous",
  "press_digging",
  "sponsor_call",
  "national_call",
  "family_worry",
];

for (const kind of kinds) {
  const s = createGame(player);
  s.threads = [];
  s.memory.threads = {};

  const first = spawnThread(s, kind, {}, 1);
  assert(first, `${kind}: first generic thread did not spawn`);
  assert(s.memory.threads[kind] === 1, `${kind}: generic thread was not recorded in narrative memory`);

  closeThread(s, first.id);
  assert(s.threads.length === 0, `${kind}: first thread did not close cleanly`);

  const repeated = spawnThread(s, kind, {}, 1);
  assert(repeated === null, `${kind}: repeated generic narrative setup was allowed after resolution`);
  assert(s.memory.threads[kind] === 1, `${kind}: repeat attempt mutated the occurrence counter`);
}

// An exhausted high-priority setup must not consume the cadence or block a
// different eligible story. This catches the subtle failure where an already
// used coach thread returned early and silently prevented club/family threads.
{
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    const s = createGame(player);
    s.threads = [];
    s.sceneCount = 20;
    s.flags["ultimo_hilo"] = -99;
    s.memory.threads = { coach_upset: 1 };
    s.rel.coach = 10;
    s.agent.present = true;
    s.hasAgent = true;
    s.fame = 50;

    maybeSpawnThreads(s);
    assert(s.threads.length === 1, "exhausted coach thread blocked all later eligible threads");
    assert(s.threads[0]!.kind === "club_interest", `expected club_interest fallback, got ${s.threads[0]!.kind}`);
    assert(s.flags["ultimo_hilo"] === 20, "successful fallback did not consume thread cadence at the actual spawn scene");
  } finally {
    Math.random = originalRandom;
  }
}

// Long-term callbacks are different: they are consequences of a remembered
// player decision, so consuming a generic family/coach thread must not suppress
// a later callback with new context.
{
  const s = createGame(player);
  s.threads = [];
  s.memory.threads = { family_worry: 1 };
  s.memory.promises = ["Prometiste a tu padre que hablaríais antes de aceptar una mudanza importante"];
  s.memory.conflicts = [];
  s.seasonIndex = 2;
  s.sceneCount = 18;
  s.flags["ultimo_hilo"] = -99;
  s.flags["memory_thread_season"] = -1;

  const callback = dueThread(s);
  assert(callback, "remembered family decision did not create a long-term callback");
  assert(callback.id.startsWith("memory-"), "remembered decision was not emitted as a memory callback");
  assert(callback.payload["remembered"], "memory callback lost the original player decision");
}

console.log(`THREAD_REPETITION_SMOKE_OK genericKinds=${kinds.length} repeatBlocked=ok exhaustedFallback=ok memoryCallbacks=ok`);
