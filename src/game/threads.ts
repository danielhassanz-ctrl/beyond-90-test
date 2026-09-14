import { ensureCareerCast } from "./career-life";
import { clubById } from "./data";
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

function teaserFor(s: GameState, kind: ThreadKind): string {
  const cast = ensureCareerCast(s);
  const club = clubById(s.clubId).short;
  switch (kind) {
    case "club_interest": return choose(s, kind, [
      `${cast.adviser.name} te escribe al salir de ${club}: un club ha pedido tus últimos partidos completos y también tu situación contractual. No te dice cuál todavía porque quiere saber primero si tu prioridad sigue siendo jugar o dar el salto.`,
      `${cast.adviser.name} te llama después de entrenar con ${club}. Dos ojeadores han preguntado por tus minutos, tu contrato y cuánto costaría sacarte. Te pide que no cambies nada por el rumor hasta hablar los dos.`,
    ]);
    case "coach_upset": return choose(s, kind, [
      `${cast.coach.name} lleva dos sesiones sin corregirte. Después del entrenamiento con ${club} te pide que mañana pases por su despacho antes que nadie. Esta vez no parece una charla rutinaria sobre forma.`,
      `El segundo entrenador te avisa de que ${cast.coach.name} quiere hablar contigo a solas. En ${club} ya se ha notado que vuestra relación se ha enfriado y nadie te adelanta si la conversación irá de minutos, actitud o futuro.`,
    ]);
    case "teammate_jealous": return choose(s, kind, [
      `${cast.teammate.name} apenas te ha dirigido la palabra esta semana. Hoy, delante del vestuario de ${club}, una broma sobre tus minutos deja de sonar a broma y ${cast.captain.name} corta la conversación en seco.`,
      `${cast.captain.name} te frena al salir del vestuario de ${club}: ha notado tensión entre tú y ${cast.teammate.name} y te pide que no la dejes crecer sola. Mañana volvéis a entrenar juntos.`,
    ]);
    case "press_digging": return choose(s, kind, [
      `Un periodista local está preguntando por tu etapa en ${club}, pero esta vez ha llamado también a gente de ${s.player.city}. La historia ya no va solo de fútbol ni se va a quedar fuera de la ciudad deportiva.`,
      `La oficina de prensa de ${club} avisa de que están preparando un perfil sobre ti: ${s.player.city}, familia, cantera y el dinero que empieza a moverse alrededor de tu nombre. Quieren una respuesta antes de publicarlo.`,
    ]);
    case "sponsor_call": return choose(s, kind, [
      `${cast.adviser.name} te reenvía un correo de una marca de botas. Han puesto sobre la mesa una cifra que pesa de verdad frente a tu ficha actual de ${Math.max(0, s.salary)}.000 € y piden una reunión esta semana.`,
      `${cast.adviser.name} te dice que una marca quiere vincularse a ti antes de que suba tu caché. Su primera pregunta no es cuánto pagan: es qué te obligan a hacer y si encaja con el momento real de tu carrera en ${club}.`,
    ]);
    case "national_call": return choose(s, kind, [
      `Un ojeador federativo ha vuelto a verte con ${club} y la próxima lista de tu categoría sale en pocos días. ${cast.coach.name} te lo cuenta, pero te pide que no conviertas una posibilidad en una convocatoria antes de tiempo.`,
      `${cast.coach.name} te menciona al terminar la sesión que desde la federación han pedido informes tuyos y tus últimos minutos con ${club}. Te recuerda que todavía no hay nada ganado.`,
    ]);
    case "family_worry": return choose(s, kind, [
      `En casa llevan dos llamadas cortas y demasiados "luego te cuento". Entre entrenamientos, desplazamientos y decisiones de carrera, algo se ha quedado fuera de tus conversaciones y esta noche te piden que no hagas planes.`,
      `Tu familia ha intentado que no te llegue, pero hay un problema que ya está afectando a decisiones de casa. Quieren hablar contigo antes de que el fútbol vuelva a obligaros a decidir deprisa.`,
    ]);
  }
}

function memoryRecallKey(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `recall:${(h >>> 0).toString(36)}`;
}

function memoryThreadKind(text: string): ThreadKind | null {
  const lower = text.toLowerCase();
  const hasAny = (...terms: string[]) => terms.some((term) => lower.includes(term));
  // Career-market memories take precedence over generic family wording. This
  // matters when the adviser is the player's father: "padre + contrato" is a
  // career callback, not an unrelated family crisis.
  if (hasAny("representante", "agente", "contrato", "renov", "cesión", "cesion", "fichaje", "oferta", "rechaz", "club", "salir")) return "club_interest";
  if (hasAny("entrenador", "míster", "mister", "técnico", "tecnico")) return "coach_upset";
  if (hasAny("vestuario", "compañ", "capitán", "capitan", "rival", "jerarquía", "jerarquia")) return "teammate_jealous";
  if (hasAny("familia", "madre", "padre", "casa", "pareja", "hijo", "herman")) return "family_worry";
  return null;
}

/** A remembered decision returns through the person who owns that history. */
function memoryTeaser(s: GameState, kind: ThreadKind, remembered: string): string {
  const cast = ensureCareerCast(s);
  const club = clubById(s.clubId).short;
  const memory = remembered.replace(/[.]+$/, "");
  switch (kind) {
    case "coach_upset":
      return `${cast.coach.name} te espera al terminar la sesión. Saca una conversación que creías cerrada: «${memory}». No quiere recordártela por nostalgia; quiere saber si sigues sosteniendo aquella decisión ahora que tu situación en ${club} ha cambiado.`;
    case "teammate_jealous":
      return `${cast.captain.name} te aparta del grupo antes de entrar al vestuario. Lo que pasó entonces sigue circulando entre compañeros: «${memory}». Esta vez no basta con dejar pasar los días; ${cast.teammate.name} también está implicado y habrá que tomar posición.`;
    case "family_worry":
      return `${cast.adviser.name} te llama antes de que llegues a casa. Tu familia ha vuelto a hablar de una decisión que marcó aquella etapa: «${memory}». Ahora afecta a una elección nueva y quieren saber si el fútbol sigue estando por encima de lo que decidiste entonces.`;
    case "club_interest":
      return `${cast.adviser.name} abre una nota vieja antes de hablarte del mercado: «${memory}». Aquello dejó una posición clara sobre tu carrera. Ahora hay movimiento alrededor de ${club} y te pregunta si sigues pensando igual o si ha llegado el momento de cambiar de rumbo.`;
    default:
      return `Una decisión antigua vuelve con consecuencias: «${memory}». Esta vez el contexto ha cambiado y no puedes responder como si fuera la primera vez.`;
  }
}

function kindAlreadyUsed(s: GameState, kind: ThreadKind): boolean { return (s.memory.threads?.[kind] ?? 0) > 0; }
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
    payload: {
      ...payload,
      originClub: clubById(s.clubId).short,
      originAge: s.age,
      originSeason: s.seasonIndex,
    },
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
  if (scene < 6 || s.seasonIndex < 1 || (s.flags["memory_thread_season"] ?? -1) === s.seasonIndex) return null;
  if (scene - (s.flags["ultimo_hilo"] ?? -99) < 4) return null;

  // Personal memories are intentionally independent from generic thread-kind
  // history. A generic market rumour at 18 must not prevent a specific choice
  // from 16 (loan, rejected club, contract promise...) returning at 21. The
  // exact memory itself remains one-shot through memoryRecallKey, and we never
  // stack two live threads of the same family.
  const entries = [...new Set([
    ...(Array.isArray(s.memory.promises) ? s.memory.promises : []),
    ...(Array.isArray(s.memory.conflicts) ? s.memory.conflicts : []),
    ...(Array.isArray(s.agent.memories) ? s.agent.memories : []),
  ])].filter((entry): entry is string => {
    if (typeof entry !== "string" || entry.trim().length < 12) return false;
    const kind = memoryThreadKind(entry);
    if (!kind) return false;
    return (s.memory.threads[memoryRecallKey(entry)] ?? 0) === 0 && !hasThread(s, kind);
  });
  if (entries.length === 0) return null;
  const remembered = entries[Math.abs((s.careerSeed ?? 1) + s.seasonIndex * 13 + scene * 5) % entries.length]!;
  const kind = memoryThreadKind(remembered);
  if (!kind || hasThread(s, kind)) return null;
  const thread: Thread = {
    id: `memory-${s.seasonIndex}-${scene}-${memoryRecallKey(remembered).slice(7)}`,
    kind,
    teaser: memoryTeaser(s, kind, remembered),
    dueScene: scene,
    payload: {
      remembered: remembered.slice(0, 240),
      originClub: clubById(s.clubId).short,
      originAge: s.age,
      originSeason: s.seasonIndex,
    },
  };
  s.threads.push(thread);
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
