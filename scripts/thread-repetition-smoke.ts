import { createGame } from "../src/game/engine";
import { closeThread, dueThread, spawnThread, type ThreadKind } from "../src/game/threads";
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

console.log(`THREAD_REPETITION_SMOKE_OK genericKinds=${kinds.length} repeatBlocked=ok memoryCallbacks=ok`);
