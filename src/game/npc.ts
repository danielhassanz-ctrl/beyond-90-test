import type { GameState } from "./types";

/* =========================================================================
 * NPCs persistentes por carrera. Se generan una sola vez a partir de
 * careerSeed y se guardan en state.memory.npcs, así reaparecen con el mismo
 * nombre durante toda la carrera y cambian entre partidas.
 * ========================================================================= */

const FIRST = [
  "Quique", "Manolo", "Íñigo", "Rubén", "Óscar", "Julen", "Toni", "Paco", "Aitor", "Nacho",
  "Sergio", "Dani", "Álex", "Bruno", "Iker", "Mateo", "Hugo", "Pau", "Lucas", "Adrián",
  "Marcos", "Iván", "Gonzalo", "Javi", "Cristian", "Unai", "Yeray", "Samu", "Borja", "Kevin",
];
const LAST = [
  "Sanchís", "Berdún", "Otaegui", "Ferrer", "Molina", "Ibáñez", "Cazorla", "Rojas", "Vidal",
  "Cañete", "Peralta", "Salas", "Requena", "Duarte", "Mendoza", "Aguado", "Bermejo", "Nieto",
  "Camacho", "Andrade", "Zamora", "Quintana", "Vergara", "Lozano", "Feijóo", "Barragán",
];
const FEMALE = ["Lucía", "Carla", "Marta", "Irene", "Nerea", "Paula", "Alba", "Sara", "Elena", "Noa"];

export function careerSeed(s: GameState): number {
  const anyS = s as GameState & { careerSeed?: number };
  if (typeof anyS.careerSeed !== "number" || !Number.isFinite(anyS.careerSeed)) {
    anyS.careerSeed = Math.floor(Math.random() * 1_000_000) + 1;
  }
  return anyS.careerSeed;
}

/** Hash determinista y estable (sin dependencias). */
export function hash(seed: number, text: string): number {
  let h = (seed % 2147483647) || 1;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 2147483647;
  return h;
}

function nameFor(s: GameState, key: string, female = false): string {
  const h = hash(careerSeed(s), key);
  const first = female ? FEMALE[h % FEMALE.length]! : FIRST[h % FIRST.length]!;
  if (female) return first;
  return `${first} ${LAST[Math.floor(h / 7) % LAST.length]!}`;
}

const ROLES: Record<string, { role: string; female?: boolean }> = {
  coach: { role: "Entrenador" },
  assistant: { role: "Segundo entrenador" },
  captain: { role: "Capitán" },
  friend: { role: "Compañero de confianza" },
  rival: { role: "Rival por el puesto" },
  press: { role: "Periodista" },
  physio: { role: "Fisioterapeuta" },
  partner: { role: "Pareja", female: true },
  scout: { role: "Ojeador" },
};

/** Devuelve (creando si hace falta) el NPC persistente de un rol. */
export function npc(s: GameState, key: keyof typeof ROLES | string): { name: string; role: string; mood: number } {
  if (!s.memory.npcs || typeof s.memory.npcs !== "object") s.memory.npcs = {};
  const existing = s.memory.npcs[key];
  if (existing && typeof existing.name === "string") return existing;
  const meta = ROLES[key] ?? { role: "Conocido" };
  const created = { name: nameFor(s, key, meta.female === true), role: meta.role, mood: 50 };
  s.memory.npcs[key] = created;
  return created;
}

export const npcName = (s: GameState, key: string): string => npc(s, key).name;

/** Ajusta el humor de un NPC: condiciona interacciones posteriores. */
export function npcMood(s: GameState, key: string, delta: number): void {
  const n = npc(s, key);
  n.mood = Math.max(0, Math.min(100, Math.round(n.mood + delta)));
}

/** "Nombre, rol" para que el jugador nunca tenga que adivinar quién habla. */
export function who(s: GameState, key: string): string {
  const n = npc(s, key);
  return `${n.name}, ${n.role.toLowerCase()}`;
}
