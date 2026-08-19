import { hasTrait } from "./mutate";
import { careerSeed, hash } from "./npc";
import type { GameState } from "./types";

/* =========================================================================
 * RUTAS NARRATIVAS. La historia principal ya no es una cadena obligatoria:
 * cada carrera recibe una ruta (persistida) que pondera qué hitos aparecen,
 * en qué orden y con qué variantes de texto.
 * ========================================================================= */

export const STORY_ROUTES = [
  "confianza", // el entrenador confía rápido
  "desprecio", // el entrenador no te quiere
  "competencia", // competencia feroz por el puesto
  "lesion_temprana",
  "vestuario", // conflicto de vestuario
  "familia", // familia y estudios en primer plano
  "agente", // agente agresivo desde el principio
  "cesion", // cesión temprana
  "cohete", // buena pretemporada y ascenso rápido
  "lento", // progresión lenta pero sólida
] as const;

export type StoryRoute = (typeof STORY_ROUTES)[number];

type Stateful = GameState & { storyRoute?: StoryRoute };

/** Ruta de la carrera: semilla + rasgos + estado inicial. Se persiste. */
export function storyRoute(s: GameState): StoryRoute {
  const st = s as Stateful;
  if (st.storyRoute && STORY_ROUTES.includes(st.storyRoute)) return st.storyRoute;
  const seed = careerSeed(s);
  const weights: Record<StoryRoute, number> = {
    confianza: 1,
    desprecio: 1,
    competencia: 1.1,
    lesion_temprana: 0.8,
    vestuario: 0.9,
    familia: 0.9,
    agente: 0.9,
    cesion: 0.7,
    cohete: 0.8,
    lento: 1,
  };
  if (hasTrait(s, "ambicioso")) { weights.agente *= 1.8; weights.cohete *= 1.5; weights.lento *= 0.6; }
  if (hasTrait(s, "rebelde")) { weights.vestuario *= 2; weights.desprecio *= 1.7; weights.confianza *= 0.5; }
  if (hasTrait(s, "leal")) { weights.confianza *= 1.5; weights.cesion *= 0.5; }
  if (hasTrait(s, "familiar")) { weights.familia *= 2.2; }
  if (hasTrait(s, "profesional")) { weights.confianza *= 1.5; weights.lento *= 1.4; weights.vestuario *= 0.6; }
  if (hasTrait(s, "carismatico")) { weights.vestuario *= 1.4; weights.agente *= 1.3; }
  if (s.overall >= 63) { weights.cohete *= 1.6; weights.competencia *= 1.3; }
  if (s.overall <= 58) { weights.lento *= 1.5; weights.desprecio *= 1.3; }

  const total = STORY_ROUTES.reduce((a, r) => a + weights[r], 0);
  let r = ((hash(seed, "route") % 10000) / 10000) * total;
  let chosen: StoryRoute = "lento";
  for (const route of STORY_ROUTES) {
    r -= weights[route];
    if (r <= 0) { chosen = route; break; }
  }
  st.storyRoute = chosen;
  return chosen;
}

export const routeIs = (s: GameState, ...rs: StoryRoute[]): boolean => rs.includes(storyRoute(s));

/** Variante determinista de un hito: misma carrera, mismo texto; carreras distintas, textos distintos. */
export function variantOf(s: GameState, key: string, n: number): number {
  return hash(careerSeed(s), `${storyRoute(s)}:${key}`) % n;
}

export const seenAny = (s: GameState, ids: string[]): boolean =>
  Array.isArray(s.seenEvents) && ids.some((id) => s.seenEvents.includes(id));

/* Grupos de hitos equivalentes (base + variantes). */
export const TRAIN_IDS = ["st_first_training", "st_train_v2", "st_train_v3"];
export const TALK_IDS = ["st_coach_talk", "st_talk_v2", "st_talk_v3"];
export const CALL_IDS = ["st_first_call", "st_call_v2"];
export const BENCH_IDS = ["st_bench", "st_bench_v2", "st_alt_freeze", "st_alt_rival"];
export const DEBUT_IDS = ["st_youth_debut", "st_debut_v2", "st_debut_v3"];

/** Peso narrativo de un hito según la ruta y las decisiones ya tomadas. */
export function storyWeight(s: GameState, id: string): number {
  const route = storyRoute(s);
  let w = 1;
  if (id === "st_studies") w *= route === "familia" ? 2.4 : hasTrait(s, "familiar") ? 1.4 : 0.55;
  if (BENCH_IDS.includes(id)) w *= route === "confianza" || route === "cohete" ? 0.45 : 1.3;
  if (id === "st_alt_freeze") w *= route === "desprecio" ? 3 : 0.2;
  if (id === "st_alt_rival") w *= route === "competencia" ? 3 : 0.25;
  if (id === "st_alt_loan") w *= route === "cesion" ? 3.2 : 0.15;
  if (id === "st_alt_early_injury") w *= route === "lesion_temprana" ? 3.2 : 0.2;
  if (id === "st_agent" || id === "st_agent_return") w *= route === "agente" ? 2.2 : 1;
  if (id === "st_starter") w *= route === "cohete" ? 1.8 : route === "lento" ? 0.7 : 1;
  if (s.rel.coach < 45 && (id === "st_starter" || DEBUT_IDS.includes(id))) w *= 0.5;
  if (s.rel.dressing < 42 && id === "st_alt_freeze") w *= 1.6;
  // Sesgo estable por carrera para desordenar el guion sin perder coherencia.
  w *= 0.6 + (hash(careerSeed(s), `sw:${id}`) % 90) / 100;
  return Math.max(0.05, w);
}
