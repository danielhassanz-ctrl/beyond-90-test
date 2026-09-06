import type {
  CareerMode,
  CareerState,
  Consequences,
  EventOption,
  GameEvent,
  ResolutionOutcome,
} from "@/types/career";
import { generateAiEvent, generateMatchResult, generateNextEventDynamic, callEventTool, type HistoryItem } from "./ai";
import type { Player } from "@/types/player";
import { getConfederation } from "@/lib/nations";
import { buildMatchContext } from "@/lib/constants";
import { playerAge } from "@/types/career";
import { getSeasonContext } from "@/lib/calendar/season";
import { shouldGenerateAdversity, pickAdversityType, describeAdversity, buildAdversityPrompt, updateAdversityTracker } from "@/lib/narrative/adversity";
import { detectDeclineSignals, buildDeclinePrompt, describeDeclineContext } from "@/lib/narrative/decline";
import { pickCharacterToReappear, describeCharacterReappearance, updateCharacterLastSeen } from "@/lib/narrative/secondary-characters";
import { shouldBeeFunnyMoment, pickRandomFunnyMoment } from "@/lib/narrative/funny-surreal";
import { isEligibleForSponsorship, SPONSORSHIP_EVENTS } from "@/lib/narrative/sponsorships";

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
      (event.minMedia === undefined || player.media >= event.minMedia) &&
      (event.maxMedia === undefined || player.media <= event.maxMedia) &&
      !usedEventIds.includes(event.id),
  );

  const priorityEligible = eligible.filter((event) => event.priority);
  const flavorEligible = eligible.filter((event) => !event.priority);

  let chosen: GameEvent;

  if (priorityEligible.length > 0 && Math.random() < 0.3) {
    chosen = priorityEligible[Math.floor(Math.random() * priorityEligible.length)];
  } else {
    // De vez en cuando, en lugar de narrativa genérica, se muestra la ficha
    // de un partido jugado (rival, marcador, rendimiento personal).
    const matchEvent = Math.random() < 0.25 ? await generateMatchResult(player, history) : null;

    if (matchEvent) {
      chosen = matchEvent;
    } else if (flavorEligible.length > 0 && Math.random() < 0.15) {
      // El contenido escrito a mano (vestuario, fama, vida, momentos curiosos)
      // es siempre el mismo texto para cualquier jugador que lo viva, así
      // que se le deja un hueco pequeño en vez de una franja grande: la IA
      // (que ya conoce la vida personal real de este jugador) es la fuente
      // principal de narrativa para que cada carrera se sienta propia.
      chosen = flavorEligible[Math.floor(Math.random() * flavorEligible.length)];
    } else {
      const aiEvent = await generateAiEvent(player, history);
      if (aiEvent) {
        chosen = aiEvent;
      } else {
        const fallbackPool = flavorEligible.length > 0 ? flavorEligible : eligible;
        chosen = fallbackPool.length > 0
          ? fallbackPool[Math.floor(Math.random() * fallbackPool.length)]
          : events[0];
      }
    }
  }

  return maybeAddFreeText(addMatchContext(chosen, player));
}

/**
 * Cualquier escena de "partido" escrita a mano se escribió sin saber
 * contra quién se iba a jugar (eso solo se sabe en el momento), así que
 * sin esto sale un "estás en un partido" genérico y sin contexto. Los
 * resultados generados por IA ya traen rival propio (rivalClub) y no se
 * tocan.
 */
function addMatchContext(event: GameEvent, player: Player): GameEvent {
  if (event.category !== "partido") {
    return event;
  }

  // Si ya tiene un rival fijo, respetarlo
  if (event.rivalClub) {
    return event;
  }

  const { rival, competition, stadium } = buildMatchContext(player.club, player.media);

  // Si la IA generó el evento, puede que haya mencionado un rival diferente.
  // Limpia referencias genéricas de rivales (ej: "el rival", "el contrincante")
  // pero respeta nombres de equipos específicos que podrían ser intencionales.
  let desc = event.description;
  desc = desc.replace(/el rival(?:o)?(?:\s|,|\.)/gi, `${rival} `);
  desc = desc.replace(/el contrincante(?:\s|,|\.)/gi, `${rival} `);
  desc = desc.replace(/vuestro(?:\s+)?contrario(?:\s|,|\.)/gi, `${rival} `);

  return {
    ...event,
    rivalClub: rival,
    description: `${player.club} vs ${rival}, ${competition}, ${stadium}. ${desc}`,
  };
}

/**
 * Igual que en la vida real, no todos los momentos importantes traen la
 * opción de decir algo por tu cuenta — pero cualquiera podría. En vez de
 * marcar a mano qué escenas la tienen (lo que la convierte en algo
 * predecible, siempre los mismos personajes), se sortea en cada turno
 * sobre CUALQUIER evento que no la traiga ya de fábrica.
 */
export function maybeAddFreeText(event: GameEvent): GameEvent {
  if (event.allowFreeText) return event;
  if (Math.random() >= 0.2) return event;
  return {
    ...event,
    allowFreeText: true,
    freeTextPrompt: "Si quieres, di o haz algo por tu cuenta en este momento (opcional)",
  };
}

/**
 * El calendario no avanza de a una semana: entre una decisión relevante y
 * la siguiente pasan varias semanas "en silencio" (pretemporada, partidos
 * de rutina, entrenamientos). Solo se muestra lo que importa.
 */
/**
 * Cuántas semanas de calendario pasan tras una decisión. No es 1 semana
 * fija: la mayoría de las veces no avanza nada (varias decisiones pueden
 * vivirse "la misma semana") para que una temporada (10 semanas) dé sitio
 * a 20-25 decisiones al principio de la carrera, y más (30-35) cuando el
 * jugador ya es una figura — la vida de un futbolista de época se llena
 * de más momentos que la de un juvenil recién debutado.
 */
export function nextWeekGap(media = 50, mode: "express" | "standard" | "pro" = "standard") {
  // Cada modo tiene diferente densidad de eventos por temporada:
  // Express: ~15 decisiones/temporada (avanza más semanas entre eventos)
  // Standard: ~20-25 decisiones/temporada (media)
  // Pro: ~30-35 decisiones/temporada (muchos eventos)
  const modeMultipliers: Record<string, number> = {
    express: 0.65,
    standard: 1.0,
    pro: 1.5,
  };
  const multiplier = modeMultipliers[mode] ?? 1.0;
  const baseChance = Math.max(0.28, 0.5 - (media - 50) * 0.005);
  const chanceOfAdvance = Math.min(0.9, baseChance * multiplier);
  return Math.random() < chanceOfAdvance ? 1 : 0;
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

/**
 * Genera TODOS los eventos con IA, nunca repitiendo premisa.
 * Reemplaza el pool de 40 eventos fijos con generación dinámica contextualizada.
 */
export async function pickNextEventDynamic(
  player: Player,
  history: HistoryItem[],
  usedEventIds: string[] = [],
): Promise<GameEvent> {
  console.log(`[pickNextEventDynamic] Starting for ${player.last_name}, week=${player.week}, fama=${player.fama}`);

  // Detecta si estamos en pretemporada (inicio de nueva temporada)
  // Pretemporada ocurre en las semanas 1, 11, 21, 31... (inicio de cada temporada)
  const weekInSeason = ((player.week - 1) % 10) + 1;
  const season = Math.floor((player.week - 1) / 10);
  const age = playerAge(player.week);

  const isPreseasson = weekInSeason === 1 && season > 0 && age >= 17;

  if (isPreseasson) {
    console.log(`[pickNextEventDynamic] Preseason detected for ${player.last_name}, season ${season}, age ${age}`);
    const { generatePreseasoneEvent } = await import("./ai");
    const preseasoneEvent = await generatePreseasoneEvent(player, season, history);
    if (preseasoneEvent) {
      console.log(`[pickNextEventDynamic] Generated preseason event: "${preseasoneEvent.title}"`);
      return maybeAddFreeText(addMatchContext(preseasoneEvent, player));
    }
  }

  // Declive emocional: reflexión sobre fin de carrera (edad 30+)
  // Momento profundo sobre transición, legado, segunda vida (raro: ~8% después week 150)
  if (playerAge(player.week) >= 30 && player.week > 150 && Math.random() < 0.08) {
    const declineSignals = detectDeclineSignals(player);
    if (declineSignals.length >= 2) {
      console.log(
        `[pickNextEventDynamic] Generating decline reflection for ${player.last_name}, age ${playerAge(player.week)}`
      );
      const declinePrompt = buildDeclinePrompt(player, declineSignals);
      const declineEvent = await callEventTool(declinePrompt, "vida", `decline-${player.week}`);

      if (declineEvent) {
        return maybeAddFreeText({
          ...declineEvent,
          id: `decline-${Date.now()}`,
          category: "especial",
          isMilestone: true,
        });
      }
    }
  }

  // Adversidades: momentos difíciles que generan tensión (lesiones, fracasos, descensos)
  // ~1 cada 30-40 semanas, pero probabilidad aumenta con tiempo sin adversidad
  if (shouldGenerateAdversity(player)) {
    console.log(
      `[pickNextEventDynamic] Generating adversity event for ${player.last_name}`
    );
    const adversityType = pickAdversityType(player);
    const adversityDesc = describeAdversity(player, adversityType);
    const adversityPrompt = buildAdversityPrompt(player, adversityType, adversityDesc);

    const adversityEvent = await callEventTool(adversityPrompt, "especial", `adversity-${adversityType}`);

    if (adversityEvent) {
      const tracker = { lastAdversityWeek: player.week, adversitiesCount: 0 };
      updateAdversityTracker(player, tracker);
      return maybeAddFreeText({
        ...adversityEvent,
        id: `adversity-${adversityType}-${Date.now()}`,
        category: "especial",
        isMilestone: Math.random() < 0.3, // 30% de las adversidades son hitos
      });
    }
  }

  // Ocasionalmente un personaje secundario reaparece (~10% de eventos después de semana 60)
  // Esto crea momentos emocionales nostálgicos con amigos, rivales, entrenadores viejos
  if (Math.random() < 0.1 && player.week > 60 && player.flags) {
    const charToReappear = pickCharacterToReappear(player);
    if (charToReappear) {
      console.log(
        `[pickNextEventDynamic] Character reappearance event for ${charToReappear.name}`
      );
      const charDesc = describeCharacterReappearance(charToReappear, player);
      const age = playerAge(player.week);

      const charPrompt = `Eres el director narrativo de "Beyond 90".

JUGADOR: ${player.last_name}, ${age} años, media ${player.media}, en ${player.club}

PERSONAJE: ${charToReappear.name} (${charToReappear.type}, relación: ${charToReappear.relationship})
${charDesc}

REGLAS:
- Evento emocional sobre reaparición de alguien del pasado
- 2-3 opciones sobre cómo reaccionar (acercarse, mantener distancia, nostalgia, sorpresa)
- Consecuencias en moral, fama, rel_aficion (variables emocionales)
- allow_free_text: true - pregunta personal ("¿Qué sientes?" o "¿Qué le dirías?")
- is_milestone: false normalmente
- Tono: emotivo, reflexivo, nostálgico`;

      const charEvent = await callEventTool(charPrompt, "vida", `char-${charToReappear.id}`);
      if (charEvent) {
        // Actualizar último encuentro con este personaje
        updateCharacterLastSeen(player, charToReappear.id);
        return maybeAddFreeText({
          ...charEvent,
          id: `char-reappear-${charToReappear.id}-${Date.now()}`,
          category: "vida",
        });
      }
    }
  }

  // Patrocinios y endorsements para jugadores de alta fama (~15% si elegibles)
  // Solo si fama >= 65 y el evento no ha sido usado antes
  if (isEligibleForSponsorship(player.fama) && Math.random() < 0.15) {
    const availableSponsorships = Object.values(SPONSORSHIP_EVENTS).filter(
      (event) => !usedEventIds.includes(event.id)
    );

    if (availableSponsorships.length > 0) {
      const sponsorshipEvent = availableSponsorships[Math.floor(Math.random() * availableSponsorships.length)];
      console.log(
        `[pickNextEventDynamic] Sponsorship event for ${player.last_name}: "${sponsorshipEvent.title}"`
      );
      return maybeAddFreeText(sponsorshipEvent as GameEvent);
    }
  }

  // Momentos cómicos y surrealistas (~10% de eventos)
  // Para romper la tensión y crear momentos memorables ridículos/absurdos
  if (shouldBeeFunnyMoment()) {
    console.log(
      `[pickNextEventDynamic] Generating funny/surreal moment for ${player.last_name}`
    );
    const funnyMoment = pickRandomFunnyMoment();
    const age = playerAge(player.week);
    const funnyPrompt = `Eres el director narrativo de "Beyond 90", el simulador de carrera de futbolista.

JUGADOR: ${player.last_name}, ${age} años, media ${player.media}, en ${player.club}

MOMENTO ABSURDO/CÓMICO:
"${funnyMoment}"

REGLAS:
- Crea un evento que use este momento absurdo/cómico como base narrativa
- Tono: humor, absurdo, surrealismo — rompe la tensión y sorprende
- 2-3 opciones sobre cómo reaccionar (reír, avergonzarse, aprovechar, ignorar)
- Consecuencias mayormente positivas en moral/fama (la gente ama los momentos raros)
- image_scene: DEBE ser visualmente ridícula/absurda/memorable — es compartible
- allow_free_text: true
- is_milestone: true si es particularmente viral/memorable
- Marcar como "divertido" o "absurdo" en el título`;

    const funnyEvent = await callEventTool(funnyPrompt, "especial", `funny-${Date.now()}`);
    if (funnyEvent) {
      return maybeAddFreeText({
        ...funnyEvent,
        id: `funny-${Date.now()}`,
        category: "especial",
        isMilestone: Math.random() < 0.4,
      });
    }
  }

  const event = await generateNextEventDynamic(player, history);
  if (event) {
    console.log(`[pickNextEventDynamic] Got event from AI: "${event.title}"`);
    return maybeAddFreeText(addMatchContext(event, player));
  }

  // Fallback si la IA falla (raramente debería pasar)
  console.error(
    `[pickNextEventDynamic] CRITICAL: IA generation returned null for ${player.last_name}, returning placeholder fallback`
  );
  return {
    id: `fallback-${Date.now()}`,
    category: "vida",
    title: "Momento de reflexión",
    description: "Es un buen momento para pensar en dónde estás en tu carrera.",
    options: [
      {
        id: "0",
        label: "Seguir adelante",
        subtitle: "Concentrarte en el siguiente partido",
        consequences: {},
      },
      {
        id: "1",
        label: "Descansar",
        subtitle: "Tomarte un tiempo para recuperarte",
        consequences: { moral: 3 },
      },
    ],
  };
}
