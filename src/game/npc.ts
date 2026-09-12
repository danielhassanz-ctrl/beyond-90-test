import { installPeopleEvents } from "./events-people";
import type { GameState } from "./types";

/* =========================================================================
 * NPCs persistentes por carrera. El asesor y los contactos personales siguen
 * al jugador durante toda su carrera; el reparto ligado al club se mantiene
 * estable dentro de ese club y rota cuando el jugador cambia de equipo.
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
  // Install after the ESM graph has initialized; event selection calls careerSeed
  // before hashing narrative candidates, so persistent-people scenes enter the
  // same live registry as the rest of the career bank.
  installPeopleEvents();
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

function distinctFemaleNameFor(s: GameState, key: string, avoid: string): string {
  const start = hash(careerSeed(s), key) % FEMALE.length;
  for (let offset = 0; offset < FEMALE.length; offset++) {
    const candidate = FEMALE[(start + offset) % FEMALE.length]!;
    if (candidate !== avoid) return candidate;
  }
  return `${avoid} II`;
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

export type AdviserKind = "agent" | "father" | "friend";

export interface CastPerson {
  id: string;
  name: string;
  relation: number;
  role: string;
  met: boolean;
  lastContactScene: number;
}

export interface CareerCast {
  adviserKind: AdviserKind;
  adviser: CastPerson;
  coach: CastPerson;
  physio: CastPerson;
  captain: CastPerson;
  teammate: CastPerson;
  social: CastPerson;
  partner: CastPerson;
  /** Club whose staff/teammate identities are currently represented. */
  clubScope?: string;
}

type LegacyCastPerson = Partial<CastPerson> & { name?: string };
type LegacyCareerCast = Partial<Omit<CareerCast, "adviser" | "coach" | "physio" | "captain" | "teammate" | "social" | "partner">> & {
  adviser?: LegacyCastPerson;
  coach?: LegacyCastPerson;
  physio?: LegacyCastPerson;
  captain?: LegacyCastPerson;
  teammate?: LegacyCastPerson;
  social?: LegacyCastPerson;
  partner?: LegacyCastPerson;
};
type CastMemory = GameState["memory"] & { careerCast?: CareerCast | LegacyCareerCast };
type CastKey = "adviser" | "coach" | "physio" | "captain" | "teammate" | "social" | "partner";

function adviserRole(kind: AdviserKind | undefined): string {
  if (kind === "father") return "Padre y asesor";
  if (kind === "friend") return "Amigo y asesor";
  return "Representante";
}

function normalizePerson(
  s: GameState,
  key: CastKey,
  stored: LegacyCastPerson | undefined,
  fallbackName: string,
  fallbackRole: string,
  fallbackRelation: number,
): CastPerson {
  return {
    id: typeof stored?.id === "string" && stored.id ? stored.id : `${key}-${hash(careerSeed(s), `cast-${key}`)}`,
    name: typeof stored?.name === "string" && stored.name ? stored.name : fallbackName,
    relation: typeof stored?.relation === "number" && Number.isFinite(stored.relation) ? stored.relation : fallbackRelation,
    role: typeof stored?.role === "string" && stored.role ? stored.role : fallbackRole,
    met: stored?.met === true,
    lastContactScene: typeof stored?.lastContactScene === "number" && Number.isFinite(stored.lastContactScene) ? stored.lastContactScene : -99,
  };
}

function scopedPerson(
  s: GameState,
  key: "coach" | "physio" | "captain" | "teammate",
  clubId: string,
  role: string,
  relation: number,
): CastPerson {
  const scope = clubId || "unattached";
  return {
    id: `${key}-${hash(careerSeed(s), `cast-${key}|${scope}`)}`,
    name: nameFor(s, `career-${key}|${scope}`),
    relation,
    role,
    met: false,
    lastContactScene: -99,
  };
}

function isPersonComplete(p: LegacyCastPerson | undefined): p is CastPerson {
  return !!p
    && typeof p.id === "string" && p.id.length > 0
    && typeof p.name === "string" && p.name.length > 0
    && typeof p.relation === "number" && Number.isFinite(p.relation)
    && typeof p.role === "string" && p.role.length > 0
    && typeof p.met === "boolean"
    && typeof p.lastContactScene === "number" && Number.isFinite(p.lastContactScene);
}

function isCastComplete(cast: CareerCast | LegacyCareerCast | undefined): cast is CareerCast {
  return !!cast
    && (cast.adviserKind === "agent" || cast.adviserKind === "father" || cast.adviserKind === "friend")
    && isPersonComplete(cast.adviser)
    && isPersonComplete(cast.coach)
    && isPersonComplete(cast.physio)
    && isPersonComplete(cast.captain)
    && isPersonComplete(cast.teammate)
    && isPersonComplete(cast.social)
    && isPersonComplete(cast.partner)
    && cast.partner.id !== cast.social.id
    && cast.partner.name !== cast.social.name;
}

function syncNpc(s: GameState, key: string, person: CastPerson, role = person.role): void {
  if (!s.memory.npcs || typeof s.memory.npcs !== "object") s.memory.npcs = {};
  const existing = s.memory.npcs[key];
  s.memory.npcs[key] = {
    name: person.name,
    role,
    mood: typeof existing?.mood === "number" ? existing.mood : person.relation,
  };
}

function rotateClubScopeIfNeeded(s: GameState, cast: CareerCast): void {
  const currentClub = typeof s.clubId === "string" ? s.clubId : "";

  // Migration rule: old saves did not persist a scope marker. Adopt whatever
  // club they are already in without changing a single name. Only a future
  // actual club change is allowed to rotate the club-bound cast.
  if (typeof cast.clubScope !== "string") {
    cast.clubScope = currentClub;
    return;
  }

  // During the life-first opening the cast may exist before a club is chosen.
  // Binding that same initial cast to the first club is not a transfer.
  if (!cast.clubScope && currentClub) {
    cast.clubScope = currentClub;
    return;
  }

  if (!currentClub || cast.clubScope === currentClub) return;

  cast.coach = scopedPerson(s, "coach", currentClub, "Entrenador", s.rel.coach || 48);
  cast.physio = scopedPerson(s, "physio", currentClub, "Fisioterapeuta", 50);
  cast.captain = scopedPerson(s, "captain", currentClub, "Capitán", s.rel.dressing || 46);
  cast.teammate = scopedPerson(s, "teammate", currentClub, "Compañero de confianza", s.rel.dressing || 46);
  cast.clubScope = currentClub;

  // Club-specific unresolved threads belong to the old dressing room. Personal
  // adviser/family/social threads survive the move and continue normally.
  if (Array.isArray(s.threads)) {
    s.threads = s.threads.filter((thread) => thread.kind !== "coach_upset" && thread.kind !== "teammate_jealous");
  }
}

/**
 * ÚNICA fuente de verdad del reparto persistente de una carrera. El asesor y
 * los contactos personales acompañan al jugador. Entrenador, capitán, fisio y
 * compañero permanecen estables dentro de un club y se regeneran solo tras un
 * cambio real de `clubId`.
 */
export function ensureCast(s: GameState): CareerCast {
  const memory = s.memory as CastMemory;
  const stored = memory.careerCast;
  let cast: CareerCast;

  if (isCastComplete(stored)) {
    cast = stored;
  } else {
    const seed = careerSeed(s);
    const adviserKind: AdviserKind = stored?.adviserKind ?? (["agent", "father", "friend"] as const)[hash(seed, "adviser-kind") % 3]!;
    const adviserName = adviserKind === "father"
      ? "Papá"
      : adviserKind === "friend"
        ? nameFor(s, "career-friend")
        : nameFor(s, "career-adviser");
    const socialName = typeof stored?.social?.name === "string" && stored.social.name
      ? stored.social.name
      : nameFor(s, "career-social", true);
    const storedPartnerName = typeof stored?.partner?.name === "string" ? stored.partner.name : "";
    const partnerName = storedPartnerName && storedPartnerName !== socialName
      ? storedPartnerName
      : distinctFemaleNameFor(s, "career-partner", socialName);

    cast = {
      adviserKind,
      adviser: normalizePerson(s, "adviser", stored?.adviser, adviserName, adviserRole(adviserKind), 50),
      coach: normalizePerson(s, "coach", stored?.coach, nameFor(s, "career-coach"), "Entrenador", s.rel.coach || 45),
      physio: normalizePerson(s, "physio", stored?.physio, nameFor(s, "career-physio"), "Fisioterapeuta", 50),
      captain: normalizePerson(s, "captain", stored?.captain, nameFor(s, "career-captain"), "Capitán", s.rel.dressing || 45),
      teammate: normalizePerson(s, "teammate", stored?.teammate, nameFor(s, "career-teammate"), "Compañero de confianza", s.rel.dressing || 45),
      social: normalizePerson(s, "social", stored?.social, socialName, "Contacto de redes", 50),
      partner: normalizePerson(s, "partner", stored?.partner, partnerName, "Pareja", 50),
      ...(typeof stored?.clubScope === "string" ? { clubScope: stored.clubScope } : {}),
    };
    if (cast.partner.name === cast.social.name) cast.partner.name = distinctFemaleNameFor(s, "career-partner-fallback", cast.social.name);
    memory.careerCast = cast;
  }

  rotateClubScopeIfNeeded(s, cast);

  syncNpc(s, "adviser", cast.adviser, adviserRole(cast.adviserKind));
  syncNpc(s, "coach", cast.coach);
  syncNpc(s, "physio", cast.physio);
  syncNpc(s, "captain", cast.captain);
  syncNpc(s, "friend", cast.teammate);
  syncNpc(s, "social", cast.social);
  syncNpc(s, "partner", cast.partner);

  s.hasAgent = true;
  s.agent.present = true;
  s.agent.name = cast.adviser.name;
  s.agentName = cast.adviser.name;
  if (s.rel.agent <= 0) s.rel.agent = cast.adviser.relation;
  const marker = `adviser:${cast.adviserKind}`;
  if (!s.agent.memories.includes(marker)) s.agent.memories.unshift(marker);

  return cast;
}

function castPerson(s: GameState, key: string): { name: string; role: string; mood: number } | null {
  const cast = ensureCast(s);
  const map: Record<string, CastPerson | undefined> = {
    coach: cast.coach,
    physio: cast.physio,
    captain: cast.captain,
    friend: cast.teammate,
    social: cast.social,
    partner: cast.partner,
    adviser: cast.adviser,
  };
  const p = map[key];
  if (!p?.name) return null;
  const role = key === "adviser" ? adviserRole(cast.adviserKind) : (ROLES[key]?.role ?? p.role ?? "Conocido");
  return { name: p.name, role, mood: p.relation };
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
  const cast = ensureCast(s);
  const map: Record<string, CastPerson | undefined> = {
    coach: cast.coach,
    physio: cast.physio,
    captain: cast.captain,
    friend: cast.teammate,
    social: cast.social,
    partner: cast.partner,
    adviser: cast.adviser,
  };
  const p = map[key];
  if (p) p.relation = n.mood;
}

/** "Nombre, rol" para que el jugador nunca tenga que adivinar quién habla. */
export function who(s: GameState, key: string): string {
  const n = npc(s, key);
  return `${n.name}, ${n.role.toLowerCase()}`;
}
