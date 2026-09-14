import { createGame } from "../src/game/engine";
import { npc } from "../src/game/npc";
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

// Long-term football-career decisions must not vanish after the original card.
// A contract/market promise from an earlier season should come back through the
// persistent adviser and quote the exact remembered priority.
const adviserMemory = createGame(player);
adviserMemory.careerSeed = 90909;
adviserMemory.seasonIndex = 2;
adviserMemory.sceneCount = 40;
adviserMemory.threads = [];
adviserMemory.flags["ultimo_hilo"] = -99;
adviserMemory.memory.threads = {};
adviserMemory.memory.promises = ["Le dijiste a tu representante que el próximo contrato debía priorizar minutos antes que salario."];
adviserMemory.memory.conflicts = [];
const recalled = dueThread(adviserMemory);
assert(recalled, "contract/adviser promise was not eligible for long-term recall");
assert(recalled.kind === "club_interest", `contract/adviser promise returned through wrong story owner: ${recalled.kind}`);
assert(recalled.teaser.includes("próximo contrato debía priorizar minutos antes que salario"), "adviser callback did not quote the remembered career priority");
assert(recalled.payload.remembered === adviserMemory.memory.promises[0], "adviser callback did not preserve the exact remembered decision in payload");

// Consuming one market/adviser memory must not permanently silence every later
// promise owned by that same adviser. A distinct promise may return in a later
// season, while the exact first memory remains protected by its recall key.
adviserMemory.threads = [];
adviserMemory.seasonIndex = 3;
adviserMemory.sceneCount = 62;
adviserMemory.flags["ultimo_hilo"] = -99;
adviserMemory.memory.promises.unshift("Acordaste con tu representante que una futura cesión solo tendría sentido con un rol claro y minutos reales.");
const secondAdviserRecall = dueThread(adviserMemory);
assert(secondAdviserRecall, "a second distinct adviser promise was incorrectly silenced after the first recall");
assert(secondAdviserRecall.kind === "club_interest", `second adviser promise returned through wrong story owner: ${secondAdviserRecall.kind}`);
assert(secondAdviserRecall.teaser.includes("futura cesión solo tendría sentido"), "later-season adviser callback did not quote the new remembered promise");
assert(secondAdviserRecall.payload.remembered === adviserMemory.memory.promises[0], "later-season adviser callback recalled the wrong promise");

// Family history must return through a recognisable family person, not through
// the agent just because the agent is the strongest persistent contact. The same
// deterministic name must survive a club change because home life is career-scoped.
const familyMemory = createGame(player);
familyMemory.careerSeed = 424242;
familyMemory.seasonIndex = 3;
familyMemory.sceneCount = 52;
familyMemory.threads = [];
familyMemory.flags["ultimo_hilo"] = -99;
familyMemory.memory.threads = {};
familyMemory.memory.promises = ["Prometiste a tu familia que volverías a casa siempre que el calendario lo permitiera."];
familyMemory.memory.conflicts = [];
const familyName = npc(familyMemory, "family_voice").name;
const familyRecalled = dueThread(familyMemory);
assert(familyRecalled, "family promise was not eligible for long-term recall");
assert(familyRecalled.kind === "family_worry", `family promise returned through wrong story owner: ${familyRecalled.kind}`);
assert(familyRecalled.teaser.startsWith(familyName), "family callback did not open with the persistent family voice");
assert(familyRecalled.teaser.includes("Prometiste a tu familia"), "family callback did not quote the remembered family promise");
familyMemory.clubId = familyMemory.clubId === "betis" ? "villarreal" : "betis";
assert(npc(familyMemory, "family_voice").name === familyName, "family identity drifted after a club transfer");

// Partner history belongs to the persistent partner, not to the family narrator.
// This prevents a serious relationship decision from returning years later in
// the mouth of a parent or an unrelated generic home-life character.
const partnerMemory = createGame(player);
partnerMemory.careerSeed = 818181;
partnerMemory.seasonIndex = 4;
partnerMemory.sceneCount = 70;
partnerMemory.threads = [];
partnerMemory.flags["ultimo_hilo"] = -99;
partnerMemory.flags["partner_active"] = 1;
partnerMemory.memory.threads = {};
partnerMemory.memory.promises = ["Prometiste a tu pareja que el siguiente fichaje también tendría en cuenta vuestra vida fuera del fútbol."];
partnerMemory.memory.conflicts = [];
const partnerName = npc(partnerMemory, "partner").name;
const partnerRecalled = dueThread(partnerMemory);
assert(partnerRecalled, "partner promise was not eligible for long-term recall");
assert(partnerRecalled.kind === "family_worry", `partner promise returned through wrong narrative family: ${partnerRecalled.kind}`);
assert(partnerRecalled.teaser.startsWith(partnerName), "partner callback was misattributed to the family voice");
assert(partnerRecalled.teaser.includes("siguiente fichaje"), "partner callback did not quote the remembered shared-life promise");

console.log(`THREAD_SCHEDULER_SMOKE_OK seed=${chosenSeed} exhaustedFallback=${spawnedKind} deterministicReplay=ok cooldownOnRealSpawn=ok adviserMemoryRecall=ok secondAdviserRecall=ok familyMemoryOwner=ok partnerMemoryOwner=ok`);
