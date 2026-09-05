import type {
  CareerMode,
  CareerState,
  Consequences,
  EventOption,
  GameEvent,
  ResolutionOutcome,
} from "@/types/career";
import { generateAiEvent, generateMatchResult, type HistoryItem } from "./ai";
import type { Player } from "@/types/player";
import { getConfederation } from "@/lib/nations";

const PERCENT_FIELDS = [
  "forma",
  "moral",
  "fama",
  "rel_entrenador",
  "rel_vestuario",
  "rel_aficion",
  "rel_representante",
  "reputacion",
] as const;

export function pickNextEvent(
  events: GameEvent[],
  week: number,
  usedEventIds: string[],
  mode?: CareerMode,
): GameEvent {
  const eligible = events.filter(
    (event) =>
      (event.minWeek ?? 1) <= week && (!event.modes || (mode && event.modes.includes(mode))),
  );
  const notUsed = eligible.filter((event) => !usedEventIds.includes(event.id));
  const pool = notUsed.length > 0 ? notUsed : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Elige el próximo evento combinando las escenas guionadas (fichajes,
 * momentos de partido, retiro) con narrativa generada por IA para todo
 * lo demás. Las escenas guionadas tienen prioridad cuando están
 * disponibles, pero no salen todas seguidas: hay una chance de que el
 * turno igual sea narrativa nueva.
 */
export async function pickNextEventSmart(
  events: GameEvent[],
  player: Player,
  usedEventIds: string[],
  history: HistoryItem[],
): Promise<GameEvent> {
  const playerConfederation = getConfederation(player.nation);
  const eligible = events.filter(
    (event) =>
      (event.minWeek ?? 1) <= player.week &&
      (!event.modes || event.modes.includes(player.mode)) &&
      (!event.requiresFlag || Boolean(player.flags?.[event.requiresFlag])) &&
      (!event.requiresConfederation ||
        (playerConfederation !== null &&
          event.requiresConfederation.includes(playerConfederation))) &&
      !usedEventIds.includes(event.id),
  );

  const priorityEligible = eligible.filter((event) => event.priority);
  const flavorEligible = eligible.filter((event) => !event.priority);

  if (priorityEligible.length > 0 && Math.random() < 0.3) {
    return priorityEligible[Math.floor(Math.random() * priorityEligible.length)];
  }

  // De vez en cuando, en lugar de narrativa genérica, se muestra la ficha
  // de un partido jugado (rival, marcador, rendimiento personal).
  if (Math.random() < 0.25) {
    const matchEvent = await generateMatchResult(player, history);
    if (matchEvent) return matchEvent;
  }

  // El contenido escrito a mano (vestuario, fama, vida, momentos curiosos)
  // necesita hueco propio: como generateAiEvent casi nunca falla, si no se
  // reserva una franja fija aquí, todo ese contenido queda como respaldo
  // que casi no se llega a ver nunca. Se sortea ANTES de intentar la IA.
  if (flavorEligible.length > 0 && Math.random() < 0.35) {
    return flavorEligible[Math.floor(Math.random() * flavorEligible.length)];
  }

  const aiEvent = await generateAiEvent(player, history);
  if (aiEvent) return aiEvent;

  const fallbackPool = flavorEligible.length > 0 ? flavorEligible : eligible;
  if (fallbackPool.length === 0) return events[0];
  return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
}

/**
 * El calendario no avanza de a una semana: entre una decisión relevante y
 * la siguiente pasan varias semanas "en silencio" (pretemporada, partidos
 * de rutina, entrenamientos). Solo se muestra lo que importa.
 */
export function nextWeekGap() {
  return 3 + Math.floor(Math.random() * 5); // 3 a 7 semanas
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** La media futbolística usa una escala de videojuego de fútbol: suelo 40, techo 99. */
function clampMedia(value: number) {
  return Math.max(40, Math.min(99, Math.round(value)));
}

export function applyConsequences(
  state: CareerState,
  consequences: Consequences,
): Partial<CareerState> {
  const patch: Partial<CareerState> = {};

  for (const field of PERCENT_FIELDS) {
    const delta = consequences[field];
    if (delta !== undefined) {
      patch[field] = clampPercent(state[field] + delta);
    }
  }

  if (consequences.media !== undefined) {
    patch.media = clampMedia(state.media + consequences.media);
  }

  if (consequences.patrimonio !== undefined) {
    patch.patrimonio = Math.max(0, state.patrimonio + consequences.patrimonio);
  }

  if (consequences.club) {
    patch.club = consequences.club;
  }

  return patch;
}

/**
 * Qué está en juego en un evento: recorre todas las opciones (y sus
 * posibles desenlaces) y junta qué dimensiones puede tocar, para
 * mostrarlo como vista previa antes de decidir.
 */
export function whatIsAtStake(event: GameEvent): string[] {
  const keys = new Set<string>();

  const collect = (c: Consequences) => {
    for (const key of Object.keys(c)) {
      if (key === "club" || key === "agent_name" || key === "flags") continue;
      keys.add(key);
    }
  };

  for (const option of event.options) {
    collect(option.consequences);
    if (option.resolve) {
      collect(option.resolve.success.consequences);
      collect(option.resolve.fail.consequences);
    }
  }

  return Array.from(keys);
}

export interface Resolution {
  text: string;
  consequences: Consequences;
  success: boolean;
}

/**
 * Resuelve una opción con incertidumbre: el entrenador te habla o te
 * ignora, metes el penalti o lo fallas, el fichaje se concreta o se cae.
 * La forma/moral/fama del jugador empujan la probabilidad, pero nunca
 * la garantizan.
 */
export function resolveOption(option: EventOption, state: CareerState): Resolution | null {
  if (!option.resolve) return null;

  const { baseChance, statModifier, success, fail } = option.resolve;
  const statValue = statModifier ? state[statModifier] : 50;
  const nudge = (statValue - 50) / 250; // pequeño empujón, nunca decisivo
  const chance = Math.max(0.1, Math.min(0.9, baseChance + nudge));

  const isSuccess = Math.random() < chance;
  const outcome: ResolutionOutcome = isSuccess ? success : fail;

  return {
    text: outcome.text,
    consequences: outcome.consequences,
    success: isSuccess,
  };
}
