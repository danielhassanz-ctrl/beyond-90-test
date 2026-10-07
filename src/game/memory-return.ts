import type { DynamicCard, GameState } from "./types";

/**
 * Makes an older player decision come back later instead of letting every
 * scene reset the world. At most one memory return is scheduled per season.
 *
 * The card intentionally reuses Narrative Director's callback renderer and
 * resolver so it gets the same three-way choice flow and relationship effects.
 */
export function memoryReturnCard(s: GameState): DynamicCard | null {
  const scene = s.sceneCount ?? 0;
  if (scene < 6) return null;
  if ((s.flags["memory_return_season"] ?? -1) === s.seasonIndex) return null;

  const promises = Array.isArray(s.memory.promises) ? s.memory.promises : [];
  const conflicts = Array.isArray(s.memory.conflicts) ? s.memory.conflicts : [];
  const alreadyReturned = new Set(
    (s.seenEvents ?? [])
      .filter((id) => id.startsWith("memory_return:"))
      .map((id) => id.slice("memory_return:".length)),
  );
  const pool = [...promises, ...conflicts].filter(
    (entry): entry is string =>
      typeof entry === "string" &&
      entry.trim().length >= 12 &&
      !alreadyReturned.has(entry.trim()),
  );
  if (pool.length === 0) return null;

  // Do not fire immediately after another consequence/scene. The return should
  // feel delayed, not like a duplicate result screen.
  const lastConsequence = s.flags["cons_last"] ?? -99;
  if (scene - lastConsequence < 4) return null;

  const index = Math.abs((s.careerSeed ?? 1) + s.seasonIndex * 17 + scene * 7) % pool.length;
  const remembered = pool[index]!.trim();
  s.flags["memory_return_season"] = s.seasonIndex;
  // A specific old decision gets one deliberate comeback, not an annual rerun.
  if (!Array.isArray(s.seenEvents)) s.seenEvents = [];
  s.seenEvents.push(`memory_return:${remembered}`);

  return {
    type: "dynamic",
    kind: "arc_callback",
    data: {
      cbId: `memory_${s.seasonIndex}_${scene}`,
      text: `Hace tiempo tomaste una decisión que sigue pesando: ${remembered}`,
    },
  };
}
