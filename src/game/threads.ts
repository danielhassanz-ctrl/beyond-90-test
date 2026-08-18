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

const TEASERS: Record<ThreadKind, string[]> = {
  club_interest: [
    "Un club ha pedido tus últimos partidos en vídeo. Nadie dice qué club.",
    "Dos hombres con acreditación de invitados preguntaron por ti en la ciudad deportiva.",
  ],
  coach_upset: [
    "El míster llevas dos sesiones sin corregirte. Eso, en él, es mala señal.",
    "El segundo entrenador te ha pedido que te quedes un día a hablar. No dice de qué.",
  ],
  teammate_jealous: [
    "Alguien del vestuario ha dejado de saludarte por la mañana.",
    "En el grupo de WhatsApp del equipo hay un pique que va contigo.",
  ],
  press_digging: [
    "Un periodista local está preguntando por tu entorno.",
    "Han pedido tu ficha y tus datos de cantera a la oficina de prensa.",
  ],
  sponsor_call: [
    "Una marca de botas ha escrito al club preguntando por tu talla.",
    "Un patrocinador quiere una reunión de quince minutos.",
  ],
  national_call: [
    "Se habla de una lista de la selección en tu categoría.",
    "Un ojeador federativo ha estado en el último partido con carpeta.",
  ],
  family_worry: [
    "En casa hay un tema que nadie te cuenta del todo.",
    "Tu madre te ha llamado dos veces sin dejar mensaje.",
  ],
};

function rid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function hasThread(s: GameState, kind: ThreadKind): boolean {
  return (s.threads ?? []).some((t) => t.kind === kind);
}

export function spawnThread(
  s: GameState,
  kind: ThreadKind,
  payload: Record<string, string | number> = {},
  delay = 1 + Math.floor(Math.random() * 4),
): Thread | null {
  if (!Array.isArray(s.threads)) s.threads = [];
  if (hasThread(s, kind)) return null;
  if (s.threads.length >= 3) return null;
  const pool = TEASERS[kind];
  const thread: Thread = {
    id: `${kind}-${rid()}`,
    kind,
    teaser: pool[Math.floor(Math.random() * pool.length)]!,
    dueScene: (s.sceneCount ?? 0) + delay,
    payload,
  };
  s.threads.push(thread);
  s.memory.threads[kind] = (s.memory.threads[kind] ?? 0) + 1;
  return thread;
}

export function dueThread(s: GameState): Thread | null {
  if (!Array.isArray(s.threads)) return null;
  return s.threads.find((t) => (s.sceneCount ?? 0) >= t.dueScene) ?? null;
}

export function closeThread(s: GameState, id: string): void {
  s.threads = (s.threads ?? []).filter((t) => t.id !== id);
}

export function openTeasers(s: GameState): Thread[] {
  return (s.threads ?? []).filter((t) => (s.sceneCount ?? 0) < t.dueScene);
}

/** Genera hilos según el estado real de la carrera. Máximo 3 abiertos. */
export function maybeSpawnThreads(s: GameState): void {
  if (!Array.isArray(s.threads)) s.threads = [];
  if (s.threads.length >= 2) return;
  // Cadencia: como mucho un hilo nuevo cada 4 escenas.
  const last = s.flags["ultimo_hilo"] ?? -99;
  if ((s.sceneCount ?? 0) - last < 4) return;
  s.flags["ultimo_hilo"] = s.sceneCount ?? 0;

  if (s.rel.coach <= 34 && Math.random() < 0.55) {
    spawnThread(s, "coach_upset");
    return;
  }
  if (s.agent.present && s.fame >= 28 && Math.random() < 0.4) {
    spawnThread(s, "club_interest");
    return;
  }
  if (s.fame >= 34 && Math.random() < 0.3) {
    spawnThread(s, Math.random() < 0.5 ? "press_digging" : "sponsor_call");
    return;
  }
  if (s.stage !== "youth" && s.overall >= 68 && s.age <= 21 && Math.random() < 0.28) {
    spawnThread(s, "national_call");
    return;
  }
  if (s.rel.dressing <= 42 && Math.random() < 0.35) {
    spawnThread(s, "teammate_jealous");
    return;
  }
  if (s.rel.family <= 45 && Math.random() < 0.3) {
    spawnThread(s, "family_worry");
  }
}
