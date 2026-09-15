import { careerStatus, ensureCareerCast } from "./career-life";
import { careerSeed, hash, npc } from "./npc";
import type { GameState, Thread } from "./types";

/* =========================================================================
 * HILOS NARRATIVOS: teaser hoy, resolución 1-4 escenas después.
 * Son el motor del "quiero ver qué pasa luego".
 * ========================================================================= */

export type ThreadKind =
  | "club_interest"
  | "coach_upset"
  | "teammate_jealous"
  | "press_digging"
  | "sponsor_call"
  | "national_call"
  | "family_worry";

function seeded(s: GameState, key: string): number {
  return hash(careerSeed(s), `thread|${key}|${s.seasonIndex}|${s.sceneCount ?? 0}`) >>> 0;
}

function chance(s: GameState, key: string, probability: number): boolean {
  return (seeded(s, key) % 10_000) < Math.round(Math.max(0, Math.min(1, probability)) * 10_000);
}

function choose<T>(s: GameState, key: string, values: readonly T[]): T {
  return values[seeded(s, key) % values.length]!;
}

function familyVoice(s: GameState): string {
  // Family must not become an anonymous narrative device while coaches, agents
  // and teammates all have persistent identities. This deterministic NPC lives
  // in narrative memory, survives club changes and gives family callbacks a
  // recognisable human owner throughout the career.
  return npc(s, "family_voice").name;
}

function teaserFor(s: GameState, kind: ThreadKind): string {
  const cast = ensureCareerCast(s);
  switch (kind) {
    case "club_interest": return choose(s, kind, [
      `${cast.adviser.name} te escribe: un club ha pedido tus últimos partidos completos, no un vídeo de highlights. No te dice cuál todavía.`,
      `${cast.adviser.name} te llama al salir de entrenar. Dos ojeadores han preguntado por tu situación contractual y quiere que no cambies nada por el rumor.`,
    ]);
    case "coach_upset": return choose(s, kind, [
      `${cast.coach.name} lleva dos sesiones sin corregirte. Después del entrenamiento te pide que mañana pases por su despacho antes que nadie.`,
      `El segundo entrenador te avisa de que ${cast.coach.name} quiere hablar contigo a solas. No te adelanta si es por minutos, actitud o las dos cosas.`,
    ]);
    case "teammate_jealous": return choose(s, kind, [
      `${cast.teammate.name} apenas te ha dirigido la palabra esta semana. Hoy una broma sobre tus minutos deja de sonar a broma delante del vestuario.`,
      `${cast.captain.name} te frena al salir: ha notado tensión entre tú y ${cast.teammate.name} y te pide que no la dejes crecer sola.`,
    ]);
    case "press_digging": return choose(s, kind, [
      `Un periodista local está preguntando por tu entorno, pero esta vez ha llamado también al club. La historia ya no se va a quedar fuera de la ciudad deportiva.`,
      `La oficina de prensa avisa de que están preparando un perfil sobre ti: barrio, familia, cantera y el dinero que empieza a moverse alrededor de tu nombre.`,
    ]);
    case "sponsor_call": return choose(s, kind, [
      `${cast.adviser.name} te reenvía un correo de una marca de botas. No habla de una foto: pide una reunión y propone cifras.`,
      `${cast.adviser.name} te dice que una marca quiere vincularse a ti antes de que suba tu caché. Su primera pregunta no es cuánto pagan, sino cuánto te van a exigir.`,
    ]);
    case "national_call": return choose(s, kind, [
      `Un ojeador federativo ha vuelto a verte y el club te avisa de que la próxima lista de tu categoría sale en pocos días.`,
      `${cast.coach.name} te menciona al terminar la sesión que desde la federación han pedido informes tuyos. Te pide que no juegues la convocatoria antes de recibirla.`,
    ]);
    case "family_worry": {
      const family = familyVoice(s);
      return choose(s, kind, [
        `${family} te ha llamado dos veces y las dos ha terminado con un "luego te cuento". Esta noche te pide que no hagas planes al salir de entrenar.`,
        `${family} intentó que el problema no te llegara en plena temporada, pero ya está afectando a decisiones de casa. Quiere contártelo antes de que te enteres por otra persona.`,
      ]);
    }
  }
}

function memoryRecallKey(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `recall:${(h >>> 0).toString(36)}`;
}

function rememberedPartner(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes("pareja") || lower.includes("novia") || lower.includes("novio");
}

function memoryThreadKind(text: string): ThreadKind | null {
  const lower = text.toLowerCase();
  const hasAny = (...terms: string[]) => terms.some((term) => lower.includes(term));
  // Relationship ownership outranks subject-matter keywords. A promise made to
  // a partner about a transfer is still a relationship memory and must return
  // through that persistent partner, not be hijacked by the adviser because it
  // happens to contain words such as "fichaje" or "mercado".
  if (rememberedPartner(text)) return "family_worry";
  // Career-management promises are some of the most consequential decisions in
  // a footballer's life. They must be eligible to come back through the same
  // persistent adviser who helped make them, instead of disappearing from the
  // story once the original transfer/contract card is resolved.
  if (hasAny("agente", "representante", "asesor", "contrato", "renov", "cesión", "cesion", "fichaje", "oferta", "mercado")) return "club_interest";
  if (hasAny("entrenador", "míster", "mister", "técnico", "tecnico")) return "coach_upset";
  if (hasAny("vestuario", "compañ", "capitán", "capitan", "rival", "jerarquía", "jerarquia")) return "teammate_jealous";
  if (hasAny("familia", "madre", "padre", "casa", "hijo", "herman")) return "family_worry";
  return null;
}

/** A remembered decision returns through the person who owns that history. */
function memoryTeaser(s: GameState, kind: ThreadKind, remembered: string): string {
  const cast = ensureCareerCast(s);
  const memory = remembered.replace(/[.]+$/, "");
  switch (kind) {
    case "club_interest":
      return `${cast.adviser.name} recupera una conversación que no había olvidado: «${memory}». No te la repite para darte la razón; ahora hay una decisión de mercado encima de la mesa y quiere saber si aquella prioridad sigue mandando o si tu carrera ya ha cambiado.`;
    case "coach_upset":
      return `${cast.coach.name} te espera al terminar la sesión. Saca una conversación que creías cerrada: «${memory}». No quiere recordártela por nostalgia; quiere saber si sigues sosteniendo aquella decisión ahora que tu situación ha cambiado.`;
    case "teammate_jealous":
      return `${cast.captain.name} te aparta del grupo antes de entrar al vestuario. Lo que pasó entonces sigue circulando entre compañeros: «${memory}». Esta vez no basta con dejar pasar los días; ${cast.teammate.name} también está implicado y habrá que tomar posición.`;
    case "family_worry": {
      if (s.flags["partner_active"] === 1 && rememberedPartner(remembered)) {
        return `${cast.partner.name} espera a que estéis solos para sacar una conversación que no ha olvidado: «${memory}». No la menciona para ganar una discusión; ahora vuestra vida vuelve a exigir una decisión y quiere saber si aquello sigue siendo verdad o si el fútbol ha cambiado el acuerdo entre los dos.`;
      }
      const family = familyVoice(s);
      return `${family} te espera despierto cuando llegas a casa. No empieza por el fútbol: vuelve a una decisión que la familia recuerda perfectamente, «${memory}». Ahora esa promesa choca con algo nuevo en casa y quiere saber si vas a sostenerla, renegociarla o admitir que tu vida ha cambiado.`;
    }
    default:
      return `Una decisión antigua vuelve con consecuencias: «${memory}». Esta vez el contexto ha cambiado y no puedes responder como si fuera la primera vez.`;
  }
}

function seasonKindKey(kind: ThreadKind, season: number): string {
  return `thread-season:${season}:${kind}`;
}

/**
 * Story families are reusable across a career, but never as duplicate filler in
 * the same season. Older saves used memory.threads[kind] as a permanent lock;
 * migrate that lock into the current season so relationships can evolve again
 * next year without replaying immediately after load.
 */
function kindAlreadyUsed(s: GameState, kind: ThreadKind): boolean {
  const key = seasonKindKey(kind, s.seasonIndex);
  if ((s.memory.threads?.[key] ?? 0) > 0) return true;
  if ((s.memory.threads?.[kind] ?? 0) > 0) {
    s.memory.threads[key] = 1;
    delete s.memory.threads[kind];
    return true;
  }
  // One authored follow-up is enough to prove that a relationship evolves.
  // A third pass would turn the mechanism back into renewable filler.
  const careerUses = Object.keys(s.memory.threads ?? {}).filter((usedKey) =>
    usedKey.startsWith("thread-season:") && usedKey.endsWith(`:${kind}`) && (s.memory.threads[usedKey] ?? 0) > 0
  ).length;
  return careerUses >= 2;
}

function markKindUsed(s: GameState, kind: ThreadKind): void {
  s.memory.threads[seasonKindKey(kind, s.seasonIndex)] = 1;
  // Remove the legacy permanent lock if an old save still carries it.
  if (Object.prototype.hasOwnProperty.call(s.memory.threads, kind)) delete s.memory.threads[kind];
}

export function hasThread(s: GameState, kind: ThreadKind): boolean { return (s.threads ?? []).some((t) => t.kind === kind); }

export function spawnThread(s: GameState, kind: ThreadKind, payload: Record<string, string | number> = {}, delay?: number): Thread | null {
  if (!Array.isArray(s.threads)) s.threads = [];
  if (hasThread(s, kind) || kindAlreadyUsed(s, kind)) return null;
  if (s.threads.length >= 3) return null;
  const scene = s.sceneCount ?? 0;
  const resolvedDelay = delay ?? 1 + (seeded(s, `${kind}|delay`) % 4);
  const thread: Thread = {
    id: `${kind}-${s.seasonIndex}-${scene}-${seeded(s, `${kind}|id`).toString(36)}`,
    kind,
    teaser: teaserFor(s, kind),
    dueScene: scene + Math.max(1, resolvedDelay),
    payload,
  };
  s.threads.push(thread);
  markKindUsed(s, kind);
  return thread;
}

export function dueThread(s: GameState): Thread | null {
  if (!Array.isArray(s.threads)) s.threads = [];
  const due = s.threads.find((t) => (s.sceneCount ?? 0) >= t.dueScene);
  if (due) return due;
  const scene = s.sceneCount ?? 0;
  if (scene < 6 || s.seasonIndex < 1 || (s.flags["memory_thread_season"] ?? -1) === s.seasonIndex) return null;
  if (scene - (s.flags["ultimo_hilo"] ?? -99) < 4) return null;
  const entries = [...new Set([
    ...(Array.isArray(s.memory.promises) ? s.memory.promises : []),
    ...(Array.isArray(s.memory.conflicts) ? s.memory.conflicts : []),
  ])].filter((entry): entry is string => {
    if (typeof entry !== "string" || entry.trim().length < 12) return false;
    const kind = memoryThreadKind(entry);
    if (!kind) return false;
    return !kindAlreadyUsed(s, kind) && (s.memory.threads[memoryRecallKey(entry)] ?? 0) === 0;
  });
  if (entries.length === 0) return null;
  const remembered = entries[Math.abs((s.careerSeed ?? 1) + s.seasonIndex * 13 + scene * 5) % entries.length]!;
  const kind = memoryThreadKind(remembered);
  if (!kind || kindAlreadyUsed(s, kind)) return null;
  const thread: Thread = {
    id: `memory-${s.seasonIndex}-${scene}`,
    kind,
    teaser: memoryTeaser(s, kind, remembered),
    dueScene: scene,
    payload: { remembered: remembered.slice(0, 240) },
  };
  s.threads.push(thread);
  markKindUsed(s, kind);
  s.memory.threads[memoryRecallKey(remembered)] = 1;
  s.flags["memory_thread_season"] = s.seasonIndex;
  s.flags["ultimo_hilo"] = scene;
  return thread;
}

export function closeThread(s: GameState, id: string): void { s.threads = (s.threads ?? []).filter((t) => t.id !== id); }
export function openTeasers(s: GameState): Thread[] { return (s.threads ?? []).filter((t) => (s.sceneCount ?? 0) < t.dueScene); }

export function maybeSpawnThreads(s: GameState): void {
  if (!Array.isArray(s.threads)) s.threads = [];
  if (s.threads.length >= 2) return;
  const scene = s.sceneCount ?? 0;
  const last = s.flags["ultimo_hilo"] ?? -99;
  if (scene - last < 4) return;
  const attempt = (kind: ThreadKind): boolean => {
    const created = spawnThread(s, kind);
    if (!created) return false;
    s.flags["ultimo_hilo"] = scene;
    return true;
  };
  if (s.rel.coach <= 34 && chance(s, "coach_upset", 0.55) && attempt("coach_upset")) return;

  // Fame alone must never fast-forward a sixteen-year-old into transfer-market,
  // press or sponsorship life. Those threads are earned only after the life-first
  // year has established football status. A strong prospect can attract clubs at
  // 17, while commercial/public attention waits for a genuine starter profile.
  const status = careerStatus(s);
  const establishedStarter = status === "starter" || status === "star" || status === "elite" || status === "legend";
  if (s.age >= 17 && s.agent.present && s.fame >= 28 && chance(s, "club_interest", 0.4) && attempt("club_interest")) return;
  if (s.age >= 18 && establishedStarter && s.fame >= 34 && chance(s, "public_attention", 0.3)) {
    const first: ThreadKind = chance(s, "public_attention_order", 0.5) ? "press_digging" : "sponsor_call";
    const second: ThreadKind = first === "press_digging" ? "sponsor_call" : "press_digging";
    if (attempt(first) || attempt(second)) return;
  }
  if (s.stage !== "youth" && s.overall >= 68 && s.age <= 21 && chance(s, "national_call", 0.28) && attempt("national_call")) return;
  if (s.rel.dressing <= 42 && chance(s, "teammate_jealous", 0.35) && attempt("teammate_jealous")) return;
  if (s.rel.family <= 45 && chance(s, "family_worry", 0.3)) attempt("family_worry");
}