import type {
  CareerMode,
  CareerState,
  Consequences,
  EventOption,
  GameEvent,
  ResolutionOutcome,
} from "@/types/career";
import { generateAiEvent, generateMatchResult, generateNextEventDynamic, callEventTool, COMMON_RULES, type HistoryItem } from "./ai";
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
import { shouldExcludeEvent, weirdEventByRarity, suggestNextEventType, type EventHistory } from "@/lib/narrative/event-tracking";
import { getNextMatch, isMatchWeekNext, getMatchThisWeek } from "@/lib/calendar/match-calendar";
import { calculateCareerArc, naturalFormaDegradation, calculateMediaPressure, deteriorateRelationships, shouldTriggerDeclineReflection, handleOngoingInjury, ageBasedMediaDecline } from "@/lib/narrative/career-dynamics";
import { detectCareerTransition, buildEnteringPeakEvent, buildExitingPeakEvent, buildEnteringDeclineEvent, buildReadyToRetireEvent } from "@/lib/narrative/career-transitions";
import { buildSecondCareerChoiceEvent } from "@/lib/narrative/second-career-events";
import { shouldTriggerGolChilena, buildGolChilenaEvent, markGolChilenaTriggered } from "@/lib/narrative/gol-chilena";

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
 * vivirse "la misma semana"), así que el número de situaciones que caben
 * en una temporada (10 semanas) NO es un número fijo — varía con la media
 * del jugador y con el modo, y ninguna partida tiene por qué tener la
 * misma cantidad de decisiones por temporada que otra.
 */
export function nextWeekGap(media = 50, mode: "express" | "standard" | "pro" = "standard") {
  // Los tres modos viven temporadas con densidad narrativa parecida
  // (aprox. 13-20 situaciones/temporada, depende de las decisiones): lo
  // que los diferencia de verdad es cuántas temporadas dura la carrera
  // (MODE_TARGET_WEEKS), no cuántos eventos caben en cada una.
  // Express avanza el calendario un poco más rápido (menos "relleno" por
  // semana, encaja con una carrera corta); Pro se recrea un poco más en
  // cada semana (más textura, encaja con una carrera larga).
  const modeMultipliers: Record<string, number> = {
    express: 1.2,
    standard: 1.0,
    pro: 0.85,
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
 * Genera evento narrativo pre-partido.
 * Contextualizado al rival, competición, y situación del jugador.
 */
async function generatePreMatchEvent(
  player: Player,
  match: any, // MatchWeek type
  history: HistoryItem[]
): Promise<GameEvent | null> {
  const age = playerAge(player.week);

  // Contexto específico del rival
  const rivalContext: Record<string, string> = {
    "Real Madrid": "gigante histórico, equipo con más títulos, rival de referencia absoluta",
    "FC Barcelona": "otra potencia mundial, clásico emocional en El Clásico, presión máxima",
    "Atlético de Madrid": "batalla táctica feroz, rival de ciudad, derbi intenso y defensivo",
    "Sevilla FC": "equipo europeo de nivel, experiencia en competiciones, táctica madura",
    "Real Betis": "rival madrileño de nivel, fútbol atractivo, buen equipo defensivo",
    "Valencia CF": "escuela histórica, buen nivel, rival competitivo",
    "Villarreal CF": "equipo compacto, táctica defensiva, difícil de romper",
    "Real Sociedad": "elegancia táctica, buen juego de posición, rival técnico",
    "Athletic Club": "identidad clara, gran afición, intensidad defensiva enorme",
    "Getafe CF": "rival defensivo, táctica de bloque cerrado, marcaje agresivo",
  };

  const compContext = {
    liga: `La Liga - Lucha por puntos cruciales. ${rivalContext[match.rivalClub] || "Rival de la liga"}.`,
    copa: "Copa del Rey - Eliminatoria directa. No hay segundo partido: o pasas o te elimina.",
    champions: "Champions League - El escenario más grande. Nivel élite europeo. Portadas internacionales. Presión máxima.",
    europa: "Europa League - Competición europea importante. Experiencia internacional.",
    amistoso: "Amistoso - Menos presión, pero oportunidad de mostrar nivel. Evaluación física.",
    internacional: "Partido internacional - Representar al país. Mayor presión colectiva.",
  };

  const prompt = `Eres el director narrativo de "Beyond 90", simulador de carrera de futbolista profesional.

PRÓXIMO PARTIDO (semana ${match.week}):
- Jornada: ${match.description}
- Rival: ${match.rivalClub}
- Contexto: ${match.homeTeam === player.club ? `Local, en tu estadio` : `Visitante, en ${match.awayTeam}`}
- Competición: ${compContext[match.competition as keyof typeof compContext] || "Partido importante"}

TU SITUACIÓN ACTUAL:
- Jugador: ${player.last_name}, ${age} años
- Media: ${player.media}/100
- Forma física: ${player.forma}/100
- Moral/ánimo: ${player.moral}/100
- Relación entrenador: ${player.rel_entrenador}/100

EVENTO NARRATIVO:
Genera un evento PRE-PARTIDO (días o horas antes del encuentro).
Es sobre PREPARACIÓN MENTAL/EMOCIONAL, no el partido en sí.

Ejemplos de escenas válidas:
- Charla emocional del entrenador en el vestuario
- Tu reacción nerviosa/confiada viendo el vídeo del rival
- Conversación con pareja/familia sobre cómo te sientes
- Momento de reflexión personal antes de dormir
- Interacción con compañeros en el hotel
- Ánimo de afición o presión mediática pre-partido
- Recuerdo de un partido anterior contra este rival

REGLAS CRÍTICAS:
- NO describas el partido, solo la preparación
- 2-3 opciones sobre cómo afrontarás el partido
- Las opciones deben generar consecuencias emocionales reales:
  * Opción 1: confianza/agresividad → puede mejorar forma pero riesgo de lesión
  * Opción 2: cautela/pragmatismo → estabilidad pero menos oportunidades
  * Opción 3: algo intermedio o único
- Consecuencias típicas tocan: forma, moral, rel_entrenador, rel_vestuario
- is_milestone: false (pre-partidos NO son hitos, solo preparación)
- allow_free_text: true (el jugador puede escribir cómo se siente)
- TONO: emocional, realista, tensión futbolística pura`;

  return callEventTool(prompt, "entrenamiento", `prematch-${match.week}`);
}

/**
 * Genera el partido en sí, con marcador y rendimiento personal — a
 * diferencia de generatePreMatchEvent (la víspera), esto es el resultado
 * real, y usa el MISMO rival/competición programados para que no se
 * contradigan entre la previa y el partido.
 *
 * Sin esto, el motor solo generaba "la noche antes del partido" jornada
 * tras jornada sin que el partido llegara a jugarse nunca — encontrado
 * jugando una carrera real de principio a fin.
 */
async function generateMatchDayEvent(
  player: Player,
  match: any, // MatchWeek type
  history: HistoryItem[]
): Promise<GameEvent | null> {
  const age = playerAge(player.week);

  const compLabel: Record<string, string> = {
    liga: "La Liga",
    copa: "Copa del Rey",
    champions: "Champions League",
    europa: "Europa League",
    amistoso: "Amistoso",
    internacional: "Partido internacional",
  };

  const prompt = `Eres el director narrativo de "Beyond 90", simulador de carrera de futbolista profesional.

EL PARTIDO YA SE HA JUGADO. Genera su ficha con resultado real.

PARTIDO (semana ${match.week}) — ESTOS DATOS SON FIJOS, NO SE INVENTAN:
- Rival: ${match.rivalClub}
- Competición: ${compLabel[match.competition as keyof typeof compLabel] ?? "Partido importante"}
- Jornada: ${match.description}
- Contexto: ${match.homeTeam === player.club ? "Jugaste en tu estadio" : `Jugaste como visitante en ${match.awayTeam}`}

TU SITUACIÓN:
- Jugador: ${player.last_name}, ${age} años, ${player.position}
- Media: ${player.media}/99, Forma: ${player.forma}/100, Moral: ${player.moral}/100

REGLAS CRÍTICAS:
${COMMON_RULES}
- PROHIBIDO ABSOLUTO: mencionar cualquier rival o competición que NO sea "${match.rivalClub}" en "${compLabel[match.competition as keyof typeof compLabel] ?? match.competition}". No inventes otro equipo, otra jornada ni otro torneo — es EL PARTIDO PROGRAMADO, no uno libre. rival_club debe ser exactamente "${match.rivalClub}".
- OBLIGATORIO en la descripción, en este orden: (1) "${match.rivalClub}" y "${compLabel[match.competition as keyof typeof compLabel] ?? match.competition}" tal cual, (2) marcador EXACTO (ej "2-1"), (3) minutos jugados, (4) tu nota (0-10, decimal), (5) GOLES exactos (0, 1, 2+), (6) asistencias. Crónica corta (3-5 frases) — que quede clarísimo si metiste gol o no, es el dato más importante de todo el evento.
- FORMATO RECOMENDADO: "Ante ${match.rivalClub} en ${compLabel[match.competition as keyof typeof compLabel] ?? match.competition}, jugaste [X] minutos. Nota: [X.X]/10. Goles: [0/1/2+]. Asistencias: [X]. Marcador: [X-X]."
- El resultado y rendimiento deben ser coherentes con forma ${player.forma}/100 y media ${player.media}/99 — a veces se pierde, a veces juegas mal o no sales, variación realista. No siempre eres el héroe.
- Las opciones son sobre cómo reaccionas DESPUÉS (prensa, vestuario, redes, autocrítica), no sobre cómo jugar — el partido ya pasó.
- OBLIGATORIO: cada opción lleva el MISMO cambio de media en consequences (el partido ya ocurrió, no depende de la opción elegida). Nota 8+/gol decisivo → +2 a +5. Nota <6 → -1 a -3. Discreto → 0 a +1.
- is_milestone true SOLO si fue excepcional (hat-trick, gol decisivo en el descuento, debut soñado, lesión grave) — no en partidos normales. Si true, escribe image_scene específico de esa acción.`;

  const event = await callEventTool(prompt, "partido", `matchday-${match.week}`);
  if (!event) return null;

  // No confiar en que la IA respete el rival/competición del prompt: se
  // fuerzan aquí a los datos reales del calendario, pase lo que pase con
  // el texto libre que haya escrito.
  return { ...event, rivalClub: match.rivalClub };
}

/**
 * Genera TODOS los eventos con IA, nunca repitiendo premisa.
 * Reemplaza el pool de 40 eventos fijos con generación dinámica contextualizada.
 */
/**
 * Aplica cambios automáticos de carrera (forma degrada, relaciones sufren, presión mediática).
 * Se llama al principio de cada turno.
 */
function applyCareerDynamics(player: Player): Player {
  let updated = { ...player };

  // Aplicar degradación de forma si no ha jugado
  updated.forma = naturalFormaDegradation(updated);

  // Aplicar declive por edad (si >32 años)
  const mediaAfterAge = ageBasedMediaDecline(updated);
  if (mediaAfterAge < updated.media) {
    updated.media = mediaAfterAge;
  }

  // Manejar lesiones en curso
  updated = handleOngoingInjury(updated);

  // Aplicar deterioro de relaciones
  const relChanges = deteriorateRelationships(updated);
  Object.assign(updated, relChanges);

  // Presión mediática afecta moral
  const { mortalAfect } = calculateMediaPressure(updated);
  if (mortalAfect < 0) {
    updated.moral = Math.max(0, (updated.moral || 50) + mortalAfect);
  }

  return updated;
}

export async function pickNextEventDynamic(
  player: Player,
  history: HistoryItem[],
  usedEventIds: string[] = [],
): Promise<GameEvent> {
  // PRIMERO: Aplicar dinámica de carrera automáticamente
  const playerWithDynamics = applyCareerDynamics(player);

  console.log(`[pickNextEventDynamic] Starting for ${playerWithDynamics.last_name}, week=${playerWithDynamics.week}, fama=${playerWithDynamics.fama}, forma=${playerWithDynamics.forma}`);

  // Detecta si estamos en pretemporada (inicio de nueva temporada)
  // Pretemporada ocurre en las semanas 1, 11, 21, 31... (inicio de cada temporada)
  const weekInSeason = ((playerWithDynamics.week - 1) % 10) + 1;
  const season = Math.floor((playerWithDynamics.week - 1) / 10);
  const age = playerAge(playerWithDynamics.week);

  // Si el jugador está esperando elegir segunda carrera, mostrar ese evento primero
  if (playerWithDynamics.status === "awaiting_second_life") {
    console.log(`[pickNextEventDynamic] Player awaiting_second_life: offering second career choice`);
    return maybeAddFreeText(buildSecondCareerChoiceEvent(playerWithDynamics));
  }

  // Si el jugador está en segunda vida, generar eventos específicos de esa carrera con IA
  if (playerWithDynamics.status === "second_life" && playerWithDynamics.second_career) {
    console.log(`[pickNextEventDynamic] Generating second life event for ${playerWithDynamics.second_career}`);
    const { generateSecondLifeEvent } = await import("./ai");
    const secondLifeEvent = await generateSecondLifeEvent(playerWithDynamics, playerWithDynamics.second_career, history);

    if (secondLifeEvent) {
      console.log(`[pickNextEventDynamic] Second life event: "${secondLifeEvent.title}"`);
      return maybeAddFreeText(secondLifeEvent);
    }
  }

  // Verificar TRANSICIONES DE CARRERA AUTOMÁTICAS (pico, decline, retiro)
  const careerTransition = detectCareerTransition(playerWithDynamics);
  if (careerTransition) {
    console.log(`[pickNextEventDynamic] Career transition detected: ${careerTransition}`);
    let transitionEvent: GameEvent | null = null;

    switch (careerTransition) {
      case "entering_peak":
        transitionEvent = buildEnteringPeakEvent();
        break;
      case "exiting_peak":
        transitionEvent = buildExitingPeakEvent();
        break;
      case "entering_decline":
        transitionEvent = buildEnteringDeclineEvent();
        break;
      case "ready_to_retire":
        transitionEvent = buildReadyToRetireEvent();
        break;
    }

    if (transitionEvent) {
      return maybeAddFreeText(transitionEvent);
    }
  }

  // Verificar si el partido programado es ESTA semana — tiene que
  // comprobarse ANTES que "la próxima semana", o el partido nunca llega
  // a jugarse (el motor solo generaba la víspera una y otra vez).
  const matchThisWeek = getMatchThisWeek(playerWithDynamics.week, playerWithDynamics.club);
  if (matchThisWeek) {
    console.log(
      `[pickNextEventDynamic] This week IS match week (${matchThisWeek.competition}): ${matchThisWeek.description}. Resolving the match.`
    );
    const matchDayEvent = await generateMatchDayEvent(playerWithDynamics, matchThisWeek, history);
    if (matchDayEvent) {
      return maybeAddFreeText(addMatchContext(matchDayEvent, playerWithDynamics));
    }
  }

  // Verificar si hay un partido importante próximo (la próxima semana)
  // Si es así, generar un evento pre-partido narrativo
  if (isMatchWeekNext(playerWithDynamics.week, playerWithDynamics.club)) {
    const nextMatch = getNextMatch(playerWithDynamics.week, playerWithDynamics.club);
    if (nextMatch) {
      console.log(
        `[pickNextEventDynamic] Next week is match week (${nextMatch.competition}): ${nextMatch.description}. Generating pre-match narrative.`
      );
      // Generar evento pre-partido contextualizado
      const preMatchEvent = await generatePreMatchEvent(playerWithDynamics, nextMatch, history);
      if (preMatchEvent) {
        return maybeAddFreeText(preMatchEvent);
      }
    }
  }

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

  // Gol de chilena: puede repetirse (más probable cuanto más figura eres),
  // hecho a mano porque dispara la portada "WARCA" (composición especial,
  // no una foto normal). markGolChilenaTriggered anota el cooldown en
  // player.flags — page.tsx ya persiste esa mutación tras esta llamada.
  if (shouldTriggerGolChilena(player)) {
    console.log(`[pickNextEventDynamic] Triggering gol de chilena for ${player.last_name}`);
    markGolChilenaTriggered(player);
    return maybeAddFreeText(buildGolChilenaEvent(player.club));
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

  // Convertir usedEventIds a EventHistory para tracking
  const eventHistory: EventHistory[] = history.map((h, idx) => ({
    eventId: `event-${idx}`,
    category: "partido", // Por defecto, será actualizado si tenemos más info
    title: h.title,
    week: player.week - (history.length - idx), // Aproximación de semana
  }));

  // Generar evento con IA, pero con validación de no-repetición
  const event = await generateNextEventDynamic(player, history);
  if (event && !shouldExcludeEvent(event.id, event.category, eventHistory, player.week)) {
    console.log(`[pickNextEventDynamic] Got event from AI: "${event.title}"`);
    return maybeAddFreeText(addMatchContext(event, player));
  }

  // Si el evento generado fue excluido, reintentar una sola vez
  if (event && shouldExcludeEvent(event.id, event.category, eventHistory, player.week)) {
    console.warn(
      `[pickNextEventDynamic] Excluded event "${event.title}" due to recency. Retrying...`
    );
    const retryEvent = await generateNextEventDynamic(player, history);
    if (retryEvent && !shouldExcludeEvent(retryEvent.id, retryEvent.category, eventHistory, player.week)) {
      console.log(`[pickNextEventDynamic] Got event from AI (retry): "${retryEvent.title}"`);
      return maybeAddFreeText(addMatchContext(retryEvent, player));
    }
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
