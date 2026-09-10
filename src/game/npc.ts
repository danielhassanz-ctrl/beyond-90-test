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

export function hash(seed: number, text: string): number {
  let h = (2166136261 ^ (seed >>> 0)) >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return h & 0x7fffffff;
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
  social: { role: "Contacto de redes", female: true },
  adviser: { role: "Representante" },
  scout: { role: "Ojeador" },
};

type CastPerson = { name: string; relation?: number; role?: string };
type CastMemory = GameState["memory"] & {
  careerCast?: {
    adviserKind?: "agent" | "father" | "friend";
    adviser?: CastPerson;
    coach?: CastPerson;
    physio?: CastPerson;
    captain?: CastPerson;
    teammate?: CastPerson;
    social?: CastPerson;
  };
};

function castPerson(s: GameState, key: string): { name: string; role: string; mood: number } | null {
  const cast = (s.memory as CastMemory).careerCast;
  if (!cast) return null;
  const map: Record<string, CastPerson | undefined> = {
    coach: cast.coach,
    physio: cast.physio,
    captain: cast.captain,
    friend: cast.teammate,
    social: cast.social,
    partner: cast.social,
    adviser: cast.adviser,
  };
  const p = map[key];
  if (!p?.name) return null;
  let role = ROLES[key]?.role ?? "Conocido";
  if (key === "adviser") {
    role = cast.adviserKind === "father" ? "Padre y asesor" : cast.adviserKind === "friend" ? "Amigo y asesor" : "Representante";
  }
  return { name: p.name, role, mood: typeof p.relation === "number" ? p.relation : 50 };
}

/** Devuelve (creando si hace falta) el NPC persistente de un rol. */
export function npc(s: GameState, key: keyof typeof ROLES | string): { name: string; role: string; mood: number } {
  if (!s.memory.npcs || typeof s.memory.npcs !== "object") s.memory.npcs = {};
  const cast = castPerson(s, key);
  if (cast) {
    const existing = s.memory.npcs[key];
    if (!existing || existing.name !== cast.name) s.memory.npcs[key] = cast;
    return s.memory.npcs[key]!;
  }
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
  const cast = (s.memory as CastMemory).careerCast;
  const map: Record<string, CastPerson | undefined> = {
    coach: cast?.coach,
    physio: cast?.physio,
    captain: cast?.captain,
    friend: cast?.teammate,
    social: cast?.social,
    partner: cast?.social,
    adviser: cast?.adviser,
  };
  const p = map[key];
  if (p && typeof p.relation === "number") p.relation = n.mood;
}

/** "Nombre, rol" para que el jugador nunca tenga que adivinar quién habla. */
export function who(s: GameState, key: string): string {
  const n = npc(s, key);
  return `${n.name}, ${n.role.toLowerCase()}`;
}
