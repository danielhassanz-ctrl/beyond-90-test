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
    "Tu agente ha recibido una llamada y, por primera vez, no te ha dicho de quién era.",
    "En la grada había un ojeador tomando notas solo cuando tocabas el balón.",
  ],
  coach_upset: [
    "El míster lleva dos sesiones sin corregirte. Eso, en él, es mala señal.",
    "El segundo entrenador te ha pedido que te quedes un día a hablar. No dice de qué.",
    "Al terminar el entrenamiento, el míster ha borrado tu nombre de la pizarra sin mirarte.",
    "Hoy has salido del rondo y el cuerpo técnico se ha quedado hablando de ti a veinte metros.",
  ],
  teammate_jealous: [
    "Alguien del vestuario ha dejado de saludarte por la mañana.",
    "En el grupo de WhatsApp del equipo hay un pique que va contigo.",
    "Tu sitio en el vestuario ha aparecido cambiado. Nadie admite haberlo hecho.",
    "Un compañero ha cortado la conversación en cuanto has entrado en la sala de fisio.",
  ],
  press_digging: [
    "Un periodista local está preguntando por tu entorno.",
    "Han pedido tu ficha y tus datos de cantera a la oficina de prensa.",
    "Un redactor que nunca cubre entrenamientos lleva dos días esperando a la salida.",
    "Tu agente te ha reenviado una pregunta de un periodista que sabe demasiado sobre tu semana.",
  ],
  sponsor_call: [
    "Una marca de botas ha escrito al club preguntando por tu talla.",
    "Un patrocinador quiere una reunión de quince minutos.",
    "Te han mandado unas botas sin remitente, con tus iniciales grabadas.",
    "El responsable comercial del club quiere verte antes del próximo entrenamiento.",
  ],
  national_call: [
    "Se habla de una lista de la selección en tu categoría.",
    "Un ojeador federativo ha estado en el último partido con carpeta.",
    "El delegado te ha preguntado, como quien no quiere la cosa, si tienes el pasaporte en regla.",
    "En el vestuario corre el rumor de que la federación ha pedido informes sobre dos jugadores. Uno podrías ser tú.",
  ],
  family_worry: [
    "En casa hay un tema que nadie te cuenta del todo.",
    "Tu madre te ha llamado dos veces sin dejar mensaje.",
    "En el grupo familiar han escrito 'luego hablamos' y nadie ha vuelto a decir nada.",
    "Alguien de tu familia ha preguntado cuándo vuelves a casa sin explicar por qué.",
  ],
};

function rid(): string {
  return Math.random().toString(36).slice(2, 9);
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

function recallTeaser(s: GameState, kind: ThreadKind, remembered: string): string {
  const clean = remembered.trim().replace(/[.!?]+$/, "");
  const seed = Math.abs((s.careerSeed ?? 1) + s.seasonIndex * 17 + (s.sceneCount ?? 0) * 7 + clean.length);
  const variants: Record<Extract<ThreadKind, "coach_upset" | "teammate_jealous" | "family_worry">, string[]> = {
    coach_upset: [
      `El cuerpo técnico no lo ha olvidado: ${clean}. Hoy el míster vuelve a poner aquel episodio encima de la mesa.`,
      `Creías que aquello había muerto: ${clean}. Esta mañana el entrenador te ha pedido que cierres la puerta al entrar.`,
      `Una decisión antigua regresa al despacho del míster: ${clean}. Lo que pase ahora puede cambiar tu sitio en el equipo.`,
      `El entrenador ha esperado hasta hoy para cobrarse aquella conversación: ${clean}. Ya no es un detalle del pasado.`,
    ],
    teammate_jealous: [
      `El vestuario tiene memoria: ${clean}. Hoy notas que aquella historia ha cambiado de bando a varios compañeros.`,
      `Parecía enterrado, pero alguien ha vuelto a sacar esto delante del grupo: ${clean}. El silencio posterior dice bastante.`,
      `Aquello que pasó con el vestuario —${clean}— vuelve justo cuando más necesitas al grupo de tu lado.`,
      `Un compañero te recuerda, palabra por palabra, algo que dabas por cerrado: ${clean}. La conversación se pone seria.`,
    ],
    family_worry: [
      `En casa seguían dándole vueltas aunque tú no lo supieras: ${clean}. Hoy ya no pueden seguir aplazando la conversación.`,
      `Tu familia vuelve a un asunto que parecía resuelto: ${clean}. Esta vez esperan una respuesta distinta de ti.`,
      `El fútbol te había permitido escapar de esto: ${clean}. Una llamada desde casa te obliga a mirarlo de frente otra vez.`,
      `Pensabas que aquello no tendría segunda parte: ${clean}. Tu familia acaba de demostrarte lo contrario.`,
    ],
  };
  const pool = variants[kind as keyof typeof variants];
  return pool ? pool[seed % pool.length]! : `Algo que hiciste vuelve a perseguirte: ${clean}.`;
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
  if (!Array.isArray(s.threads)) s.threads = [];
  const due = s.threads.find((t) => (s.sceneCount ?? 0) >= t.dueScene);
  if (due) return due;

  const scene = s.sceneCount ?? 0;
  if (scene < 6 || (s.flags["memory_thread_season"] ?? -1) === s.seasonIndex) return null;
  if (scene - (s.flags["ultimo_hilo"] ?? -99) < 4) return null;

  const entries = [...new Set([
    ...(Array.isArray(s.memory.promises) ? s.memory.promises : []),
    ...(Array.isArray(s.memory.conflicts) ? s.memory.conflicts : []),
  ])].filter(
    (entry): entry is string =>
      typeof entry === "string" &&
      entry.trim().length >= 12 &&
      memoryThreadKind(entry) !== null &&
      (s.memory.threads[memoryRecallKey(entry)] ?? 0) === 0,
  );
  if (entries.length === 0) return null;

  const remembered = entries[Math.abs((s.careerSeed ?? 1) + s.seasonIndex * 13 + scene * 5) % entries.length]!;
  s.memory.threads[memoryRecallKey(remembered)] = 1;
  const kind = memoryThreadKind(remembered);
  if (!kind) return null;

  s.flags["memory_thread_season"] = s.seasonIndex;
  s.flags["ultimo_hilo"] = scene;
  return {
    id: `memory-${s.seasonIndex}-${scene}`,
    kind,
    teaser: recallTeaser(s, kind, remembered),
    dueScene: scene,
    payload: { remembered: remembered.slice(0, 240) },
  };
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
