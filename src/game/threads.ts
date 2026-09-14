import { ensureCareerCast } from "./career-life";
import { careerSeed, hash } from "./npc";
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

/**
 * Player-visible setup for a delayed thread. The old bank said "el míster",
 * "alguien del vestuario" or "un patrocinador" even after the career already
 * had persistent people. A thread should begin with somebody the player knows
 * whenever the situation belongs to that relationship.
 */
function teaserFor(s: GameState, kind: ThreadKind): string {
  const cast = ensureCareerCast(s);
  switch (kind) {
    case "club_interest":
      return choose(s, kind, [
        `${cast.adviser.name} te escribe: un club ha pedido tus últimos partidos completos, no un vídeo de highlights. No te dice cuál todavía.`,
        `${cast.adviser.name} te llama al salir de entrenar. Dos ojeadores han preguntado por tu situación contractual y quiere que no cambies nada por el rumor.`,
      ]);
    case "coach_upset":
      return choose(s, kind, [
        `${cast.coach.name} lleva dos sesiones sin corregirte. Después del entrenamiento te pide que mañana pases por su despacho antes que nadie.`,
        `El segundo entrenador te avisa de que ${cast.coach.name} quiere hablar contigo a solas. No te adelanta si es por minutos, actitud o las dos cosas.`,
      ]);
    case "teammate_jealous":
      return choose(s, kind, [
        `${cast.teammate.name} apenas te ha dirigido la palabra esta semana. Hoy una broma sobre tus minutos deja de sonar a broma delante del vestuario.`,
        `${cast.captain.name} te frena al salir: ha notado tensión entre tú y ${cast.teammate.name} y te pide que no la dejes crecer sola.`,
      ]);
    case "press_digging":
      return choose(s, kind, [
        `Un periodista local está preguntando por tu entorno, pero esta vez ha llamado también al club. La historia ya no se va a quedar fuera de la ciudad deportiva.`,
        `La oficina de prensa avisa de que están preparando un perfil sobre ti: barrio, familia, cantera y el dinero que empieza a moverse alrededor de tu nombre.`,
      ]);
    case "sponsor_call":
      return choose(s, kind, [
        `${cast.adviser.name} te reenvía un correo de una marca de botas. No habla de una foto: pide una reunión y propone cifras.`,
        `${cast.adviser.name} te dice que una marca quiere vincularse a ti antes de que suba tu caché. Su primera pregunta no es cuánto pagan, sino cuánto te van a exigir.`,
      ]);
    case "national_call":
      return choose(s, kind, [
        `Un ojeador federativo ha vuelto a verte y el club te avisa de que la próxima lista de tu categoría sale en pocos días.`,
        `${cast.coach.name} te menciona al terminar la sesión que desde la federación han pedido informes tuyos. Te pide que no juegues la convocatoria antes de recibirla.`,
      ]);
    case "family_worry":
      return choose(s, kind, [
        `En casa llevan dos llamadas cortas y demasiados "luego te cuento". Esta noche te piden que no hagas planes al salir de entrenar.`,
        `Tu familia ha intentado que no te llegue, pero hay un problema que ya está afectando a decisiones de casa. Quieren hablar contigo antes de que te enteres por otra persona.`,
      ]);
  }
}

function memoryRecallKey(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `recall:${(h >>> 0).toString(36)}`;
}

function memoryThreadKind(text: string): ThreadKind | null {
  const lower = text.toLowerCase();
  const hasAny = (...terms: string[]) => terms.some((term) => lower.includes(term));

  if (hasAny("entrenador", "míster", "mister", "técnico", "tecnico")) return "coach_upset";
  if (hasAny("vestuario", "compañ", "capitán", "capitan", "rival", "jerarquía", "jerarquia")) return "teammate_jealous";
  if (hasAny("familia", "madre", "padre", "casa", "pareja", "hijo", "herman")) return "family_worry";

  // No inventamos una categoría para recuerdos ambiguos. Si el texto no
  // identifica a quién afecta, esperamos a otra memoria en vez de convertir
  // cualquier conflicto en un problema familiar.
  return null;
}

function kindAlreadyUsed(s: GameState, kind: ThreadKind): boolean {
  return (s.memory.threads?.[kind] ?? 0) > 0;
}

export function hasThread(s: GameState, kind: ThreadKind): boolean {
  return (s.threads ?? []).some((t) => t.kind === kind);
}

export function spawnThread(
  s: GameState,
  kind: ThreadKind,
  payload: Record<string, string | number> = {},
  delay?: number,
): Thread | null {
  if (!Array.isArray(s.threads)) s.threads = [];
  // Un hilo genérico es una situación, no una ruleta reutilizable. Una vez
  // vivido, ese conflicto solo puede volver como callback escrito con contexto
  // nuevo, nunca como la misma tarjeta/título/opciones otra vez.
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
  s.memory.threads[kind] = 1;
  return thread;
}

export function dueThread(s: GameState): Thread | null {
  if (!Array.isArray(s.threads)) s.threads = [];
  const due = s.threads.find((t) => (s.sceneCount ?? 0) >= t.dueScene);
  if (due) return due;

  const scene = s.sceneCount ?? 0;
  // Un recuerdo de largo recorrido no puede aparecer en la misma temporada en
  // la que el jugador acaba de tomar la decisión. Eso convertía decisiones de
  // cantera recientes en falsos "hace tiempo" pocas escenas después.
  if (scene < 6 || s.seasonIndex < 1 || (s.flags["memory_thread_season"] ?? -1) === s.seasonIndex) return null;
  if (scene - (s.flags["ultimo_hilo"] ?? -99) < 4) return null;

  const entries = [...new Set([
    ...(Array.isArray(s.memory.promises) ? s.memory.promises : []),
    ...(Array.isArray(s.memory.conflicts) ? s.memory.conflicts : []),
  ])].filter((entry): entry is string => {
    if (typeof entry !== "string" || entry.trim().length < 12) return false;
    const kind = memoryThreadKind(entry);
    if (!kind) return false;
    // THREAD_VIEWS tiene un título/opciones por kind. Reusar el mismo kind,
    // aunque cambie el teaser, produce exactamente la repetición que percibe
    // el jugador. Reservamos cada plantilla una sola vez por carrera.
    return !kindAlreadyUsed(s, kind) && (s.memory.threads[memoryRecallKey(entry)] ?? 0) === 0;
  });
  if (entries.length === 0) return null;

  const remembered = entries[Math.abs((s.careerSeed ?? 1) + s.seasonIndex * 13 + scene * 5) % entries.length]!;
  const kind = memoryThreadKind(remembered);
  if (!kind || kindAlreadyUsed(s, kind)) return null;

  // Persistimos el hilo antes de devolverlo. Si se pierde `pending` durante una
  // recuperación, dueThread vuelve a ofrecer el mismo hilo hasta cerrarlo.
  const thread: Thread = {
    id: `memory-${s.seasonIndex}-${scene}`,
    kind,
    teaser: `Hace tiempo quedó esto anotado: ${remembered}. Ahora vuelve a tener consecuencias.`,
    dueScene: scene,
    payload: { remembered: remembered.slice(0, 240) },
  };
  s.threads.push(thread);
  s.memory.threads[kind] = 1;
  s.memory.threads[memoryRecallKey(remembered)] = 1;
  s.flags["memory_thread_season"] = s.seasonIndex;
  s.flags["ultimo_hilo"] = scene;
  return thread;
}

export function closeThread(s: GameState, id: string): void {
  s.threads = (s.threads ?? []).filter((t) => t.id !== id);
}

export function openTeasers(s: GameState): Thread[] {
  return (s.threads ?? []).filter((t) => (s.sceneCount ?? 0) < t.dueScene);
}

/** Genera hilos según el estado real de la carrera. Máximo 2 abiertos. */
export function maybeSpawnThreads(s: GameState): void {
  if (!Array.isArray(s.threads)) s.threads = [];
  if (s.threads.length >= 2) return;

  const scene = s.sceneCount ?? 0;
  const last = s.flags["ultimo_hilo"] ?? -99;
  if (scene - last < 4) return;

  // Crucial: no gastamos el cooldown hasta que nace un hilo de verdad. Un
  // conflicto ya consumido puede seguir cumpliendo su condición (por ejemplo
  // relación mala con el entrenador), pero no debe bloquear historias nuevas.
  const attempt = (kind: ThreadKind): boolean => {
    const created = spawnThread(s, kind);
    if (!created) return false;
    s.flags["ultimo_hilo"] = scene;
    return true;
  };

  if (s.rel.coach <= 34 && chance(s, "coach_upset", 0.55) && attempt("coach_upset")) return;
  if (s.agent.present && s.fame >= 28 && chance(s, "club_interest", 0.4) && attempt("club_interest")) return;
  if (s.fame >= 34 && chance(s, "public_attention", 0.3)) {
    const first: ThreadKind = chance(s, "public_attention_order", 0.5) ? "press_digging" : "sponsor_call";
    const second: ThreadKind = first === "press_digging" ? "sponsor_call" : "press_digging";
    if (attempt(first) || attempt(second)) return;
  }
  if (s.stage !== "youth" && s.overall >= 68 && s.age <= 21 && chance(s, "national_call", 0.28) && attempt("national_call")) return;
  if (s.rel.dressing <= 42 && chance(s, "teammate_jealous", 0.35) && attempt("teammate_jealous")) return;
  if (s.rel.family <= 45 && chance(s, "family_worry", 0.3)) attempt("family_worry");
}
