import fs from "node:fs";

const path = "src/game/threads.ts";
let src = fs.readFileSync(path, "utf8");

const before = `export function dueThread(s: GameState): Thread | null {
  if (!Array.isArray(s.threads)) return null;
  return s.threads.find((t) => (s.sceneCount ?? 0) >= t.dueScene) ?? null;
}`;

const after = `export function dueThread(s: GameState): Thread | null {
  if (!Array.isArray(s.threads)) s.threads = [];
  const due = s.threads.find((t) => (s.sceneCount ?? 0) >= t.dueScene);
  if (due) return due;

  // Once per season, let a recorded promise/conflict return through an
  // existing relationship thread. Old choices stop behaving like dead text.
  const scene = s.sceneCount ?? 0;
  if (scene < 6 || (s.flags["memory_thread_season"] ?? -1) === s.seasonIndex) return null;
  if (scene - (s.flags["ultimo_hilo"] ?? -99) < 4) return null;

  const promises = Array.isArray(s.memory.promises) ? s.memory.promises : [];
  const conflicts = Array.isArray(s.memory.conflicts) ? s.memory.conflicts : [];
  const entries = [...promises, ...conflicts].filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length >= 12,
  );
  if (entries.length === 0) return null;

  const remembered = entries[Math.abs((s.careerSeed ?? 1) + s.seasonIndex * 13 + scene * 5) % entries.length]!;
  const lower = remembered.toLowerCase();
  const kind: ThreadKind =
    lower.includes("entrenador") || lower.includes("míster")
      ? "coach_upset"
      : lower.includes("vestuario") || lower.includes("compañ")
        ? "teammate_jealous"
        : "family_worry";

  s.flags["memory_thread_season"] = s.seasonIndex;
  s.flags["ultimo_hilo"] = scene;
  return {
    id: \`memory-\${s.seasonIndex}-\${scene}\`,
    kind,
    teaser: \`Hace tiempo quedó esto anotado: \${remembered}. Ahora vuelve a tener consecuencias.\`,
    dueScene: scene,
    payload: { remembered: remembered.slice(0, 240) },
  };
}`;

if (!src.includes(before)) {
  if (src.includes('memory_thread_season')) {
    console.log("memory continuity patch already applied");
    process.exit(0);
  }
  throw new Error("dueThread source anchor not found");
}
src = src.replace(before, after);
fs.writeFileSync(path, src);
console.log("memory continuity patch applied");
