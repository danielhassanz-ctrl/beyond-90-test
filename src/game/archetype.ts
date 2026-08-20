import { hasTrait } from "./mutate";
import { careerSeed, hash, npc } from "./npc";
import type { EventCategory, GameEvent, GameState } from "./types";

/* =========================================================================
 * ARQUETIPOS DE CARRERA. Cada partida recibe un arquetipo persistente que
 * cambia QUÉ historias aparecen (no solo el orden), con quién se vive el
 * conflicto y qué ecos recuerda el juego de tus decisiones.
 * ========================================================================= */

export type ArchetypeId =
  | "canterano_humilde"
  | "perla_mediatica"
  | "obrero"
  | "rebelde"
  | "tecnico_frio"
  | "callejero";

type Meta = {
  label: string;
  blurb: string;
  /** NPC con el que gira el conflicto central del arquetipo. */
  anchor: string;
  bias: Partial<Record<EventCategory, number>>;
};

export const ARCHETYPES: Record<ArchetypeId, Meta> = {
  canterano_humilde: {
    label: "Canterano de casa",
    blurb: "Todo el mundo conoce a tu familia. Cada paso se comenta en el barrio.",
    anchor: "captain",
    bias: { life: 1.7, club: 1.3, gossip: 0.5, agent: 0.6, press: 0.7 },
  },
  perla_mediatica: {
    label: "Perla mediática",
    blurb: "Llegaste con etiqueta de futuro crack y con foco encima.",
    anchor: "press",
    bias: { press: 2, gossip: 1.8, agent: 1.6, market: 1.4, training: 0.6 },
  },
  obrero: {
    label: "Obrero del campo",
    blurb: "Nadie te regala nada: vives del entrenamiento y de la repetición.",
    anchor: "assistant",
    bias: { training: 2, medical: 1.4, press: 0.5, gossip: 0.4, club: 1.1 },
  },
  rebelde: {
    label: "Carácter difícil",
    blurb: "Tu talento nunca se discute; tu forma de estar, siempre.",
    anchor: "coach",
    bias: { gossip: 1.9, club: 1.4, press: 1.3, training: 0.7, life: 1.1 },
  },
  tecnico_frio: {
    label: "Cerebro táctico",
    blurb: "Lees el juego antes que nadie y lo dices en voz alta.",
    anchor: "coach",
    bias: { club: 1.7, training: 1.4, press: 1.2, gossip: 0.5 },
  },
  callejero: {
    label: "Fútbol de calle",
    blurb: "Te formaste en pistas de cemento y eso se te nota en todo.",
    anchor: "friend",
    bias: { life: 1.6, gossip: 1.5, training: 0.8, medical: 1.2, agent: 1.2 },
  },
};

const IDS = Object.keys(ARCHETYPES) as ArchetypeId[];

type Stateful = GameState & { archetype?: ArchetypeId };

/** Arquetipo de la carrera: semilla + rasgos. Se persiste en el estado. */
export function archetypeOf(s: GameState): ArchetypeId {
  const st = s as Stateful;
  if (st.archetype && ARCHETYPES[st.archetype]) return st.archetype;
  const w: Record<ArchetypeId, number> = {
    canterano_humilde: 1,
    perla_mediatica: 1,
    obrero: 1,
    rebelde: 1,
    tecnico_frio: 1,
    callejero: 1,
  };
  if (hasTrait(s, "rebelde")) { w.rebelde *= 2.6; w.canterano_humilde *= 0.5; }
  if (hasTrait(s, "familiar")) w.canterano_humilde *= 2.2;
  if (hasTrait(s, "profesional")) { w.obrero *= 2; w.tecnico_frio *= 1.6; w.callejero *= 0.6; }
  if (hasTrait(s, "carismatico")) { w.perla_mediatica *= 2; w.callejero *= 1.4; }
  if (hasTrait(s, "ambicioso")) w.perla_mediatica *= 1.6;
  if (s.overall >= 62) w.perla_mediatica *= 1.5;
  if (s.overall <= 58) w.obrero *= 1.5;

  const total = IDS.reduce((a, id) => a + w[id], 0);
  let r = ((hash(careerSeed(s), "archetype") % 10000) / 10000) * total;
  let chosen: ArchetypeId = "obrero";
  for (const id of IDS) {
    r -= w[id];
    if (r <= 0) { chosen = id; break; }
  }
  st.archetype = chosen;
  return chosen;
}

export const archetypeMeta = (s: GameState): Meta => ARCHETYPES[archetypeOf(s)];

/** NPC ancla del arquetipo: da una cara reconocible al conflicto. */
export function anchorNpc(s: GameState): { name: string; role: string } {
  const n = npc(s, archetypeMeta(s).anchor);
  return { name: n.name, role: n.role };
}

/** Peso de un evento según el arquetipo (sesga el reparto real de escenas). */
export function archetypeWeight(s: GameState, e: GameEvent): number {
  if ((e.priority ?? 0) >= 100) return 1;
  return archetypeMeta(s).bias[e.category ?? "life"] ?? 1;
}

/**
 * Silenciado extra por arquetipo: dos carreras con arquetipos distintos ven
 * bancos de escenas distintos, no el mismo banco reordenado.
 */
export function archetypeMuted(s: GameState, e: GameEvent): boolean {
  if ((e.priority ?? 0) >= 100) return false;
  const bias = archetypeMeta(s).bias[e.category ?? "life"] ?? 1;
  const threshold = bias >= 1.5 ? 8 : bias <= 0.7 ? 45 : 22;
  return hash(careerSeed(s), `arq:${archetypeOf(s)}:${e.id}`) % 100 < threshold;
}

/* ---------------- Callbacks baratos: ecos de tus decisiones -------------- */

type WithBeats = { beats?: string[] };

/** Guarda un eco corto de la última decisión (máx. 6). */
export function rememberBeat(s: GameState, text: string): void {
  if (!text) return;
  const mem = s.memory as unknown as WithBeats;
  const list = Array.isArray(mem.beats) ? mem.beats : [];
  mem.beats = [text.slice(0, 90), ...list.filter((t) => t !== text)].slice(0, 6);
}

/** Eco reciente para el feed: recuerda algo que el jugador ya eligió. */
export function beatEcho(s: GameState): string | null {
  const mem = s.memory as unknown as WithBeats;
  const list = Array.isArray(mem.beats) ? mem.beats : [];
  const pick = list[1] ?? list[0];
  if (!pick) return null;
  const a = anchorNpc(s);
  return `${a.name} (${a.role.toLowerCase()}) no ha olvidado que eligieras: “${pick}”.`;
}
