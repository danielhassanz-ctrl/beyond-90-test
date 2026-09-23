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
import { buildMatchContext, NO_CLUB_YET } from "@/lib/constants";
import { playerAge } from "@/types/career";
import { shouldGenerateAdversity, pickAdversityType, describeAdversity, buildAdversityPrompt, updateAdversityTracker, getAdversityTracker } from "@/lib/narrative/adversity";
import { detectDeclineSignals, buildDeclinePrompt } from "@/lib/narrative/decline";
import { pickCharacterToReappear, describeCharacterReappearance, updateCharacterLastSeen } from "@/lib/narrative/secondary-characters";
import { shouldBeeFunnyMoment, pickRandomFunnyMoment, isSurrealMoment } from "@/lib/narrative/funny-surreal";
import { isEligibleForSponsorship, SPONSORSHIP_EVENTS } from "@/lib/narrative/sponsorships";
import { shouldExcludeEvent, type EventHistory } from "@/lib/narrative/event-tracking";
import { getNextMatch, isMatchWeekNext, getMatchThisWeek, type MatchWeek } from "@/lib/calendar/match-calendar";
import { naturalFormaDegradation, calculateMediaPressure, deteriorateRelationships, shouldTriggerDeclineReflection, ageBasedMediaDecline } from "@/lib/narrative/career-dynamics";
import { detectCareerTransition, buildEnteringPeakEvent, buildExitingPeakEvent, buildEnteringDeclineEvent, buildReadyToRetireEvent } from "@/lib/narrative/career-transitions";
import { shouldTriggerGolChilena, buildGolChilenaEvent, markGolChilenaTriggered } from "@/lib/narrative/gol-chilena";
import { EVENTS } from "@/lib/narrative/events";
import {
  buildAgentDialogueEvent,
  shouldTriggerAgentDialogue,
  pickEligibleAgentTrigger,
  markAgentDialogueTriggered,
} from "@/lib/narrative/agent-events";
import { shouldTriggerLoanFork, buildLoanForkEvent, markLoanForkTriggered } from "@/lib/narrative/loan-fork";
import { pickDetailedLifeScenario, markDetailedLifeUsed } from "@/lib/narrative/life-events-detailed";

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

/**
 * La saga de pareja/hijos y los eventos de prensa con consecuencias fijas
 * vivían escritos en events.ts pero en un array (EVENTS) que ningún
 * camino activo del juego llegaba a recorrer — pickNextEventDynamic es lo
 * único que se llama de verdad desde /carrera, y no lo importaba. Aquí se
 * recupera solo ese subconjunto (no las ~40 categorías completas de
 * EVENTS, que la IA ya cubre mejor) para que sí aparezcan en partida real.
 */
const FAMILY_AND_PRESS_EVENT_IDS = new Set([
  "vid-lucia-conoce",
  "vid-lucia-formalizar",
  "vid-embarazo",
  "vid-boda",
  // No es prensa ni pareja, pero es el mismo caso de contenido guionado con
  // consecuencias fijas que vivía en el EVENTS muerto: un arco de crisis
  // (espiral de alcohol en un bache de la carrera) que merece aparecer sin
  // depender de que la IA decida escribir algo parecido por su cuenta.
  "esp-espiral-alcohol",
]);
const SCRIPTED_LIFE_EVENTS: GameEvent[] = EVENTS.filter(
  (event) => FAMILY_AND_PRESS_EVENT_IDS.has(event.id) || event.category === "prensa",
);

/**
 * El resto del pool "esp-*"/"fama-*" de events.ts: cameos de famosos
 * (cantantes, influencers, actores), momentos virales (retos, memes,
 * mascotas que se hacen virales) y algún surrealista (anuncio de colonia
 * de gladiador, doble corporal). Solo la porción con category "prensa" se
 * recuperaba antes (ver SCRIPTED_LIFE_EVENTS); estos ~40 con category
 * "especial"/"vida"/"vestuario"/"representante"/"entrenamiento" seguían en
 * el mismo EVENTS muerto — con el pool de famosos completo pero invisible
 * en partida real, pese a que hay contenido de sobra escrito para ello.
 */
const FAME_EVENT_IDS = new Set([
  "esp-leyenda-tunel",
  "esp-cantante",
  "esp-influencer",
  "esp-desafio-viral",
  "esp-mascota",
  "esp-doble",
  "esp-anuncio",
  "esp-paloma",
  "esp-nino-sincero",
  "esp-meme",
  "esp-patrocinio-chorizo",
  "esp-broma-vestuario",
  "esp-excompanero-negocio",
  "fama-gala-benefica",
  "fama-reality-show",
  "fama-videoclip",
  "fama-relojes-lujo",
  "fama-fan-club",
  "fama-videojuego",
  "fama-coleccion-ropa",
  "fama-desfile-moda",
  "fama-cancelacion-injusta",
  "fama-documental",
  "fama-cantar-himno",
  "fama-fiesta-exclusiva",
  "fama-camiseta-nino",
  "fama-fragancia-propia",
  "fama-actor-foto",
  "fama-coche-lujo",
  "fama-parodia-humor",
  "fama-borrar-publicacion",
  "fama-cena-empresarios",
  "fama-streamer-directo",
  "fama-leyenda-vestuario",
  "fama-reto-viral-vendado",
  "fama-anuncio-surreal",
  "fama-mascota-viral",
  "fama-reality-cocina",
  "fama-fiesta-piscina",
  "fama-leyenda-dorsal",
  // Añadidos por la skill narrativas-futbol: vestuario/prensa graciosos
  // o surrealistas, cortos y con gancho concreto (ver events.ts).
  "ves-corte-pelo-obsesivo",
  "ves-equipacion-prestada",
  "ves-guerra-bromas-vestuario",
  "ves-supersticion-ridicula",
]);
const FAME_EVENTS: GameEvent[] = EVENTS.filter((event) => FAME_EVENT_IDS.has(event.id));

/**
 * Igual que pickScriptedLifeEvent, para el pool de famosos/virales/surreal.
 */
function pickFameEvent(player: Player, usedEventIds: string[]): GameEvent | null {
  const eligible = FAME_EVENTS.filter(
    (event) =>
      (event.minWeek ?? 1) <= player.week &&
      (!event.requiresFlag || Boolean(player.flags?.[event.requiresFlag])) &&
      (event.minMedia === undefined || player.media >= event.minMedia) &&
      (event.maxMedia === undefined || player.media <= event.maxMedia) &&
      !usedEventIds.includes(event.id),
  );
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Elige un evento del pool guionado de pareja/prensa si hay alguno
 * elegible ahora mismo (mismo criterio de minWeek/requiresFlag/media que
 * el resto del motor). Devuelve null si no hay ninguno o si el sorteo no
 * toca, para dejar sitio a la narrativa generada por IA la mayoría de
 * turnos — esto es sabor recurrente, no el grueso de la carrera.
 */
function pickScriptedLifeEvent(player: Player, usedEventIds: string[]): GameEvent | null {
  const eligible = SCRIPTED_LIFE_EVENTS.filter(
    (event) =>
      (event.minWeek ?? 1) <= player.week &&
      (!event.requiresFlag || Boolean(player.flags?.[event.requiresFlag])) &&
      (event.minMedia === undefined || player.media >= event.minMedia) &&
      (event.maxMedia === undefined || player.media <= event.maxMedia) &&
      !usedEventIds.includes(event.id),
  );
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Los grandes momentos de una carrera de leyenda de verdad — primera
 * convocatoria a la selección, capitanía, Mundial, Eurocopa/Copa
 * América, Balón de Oro, títulos de Liga y Champions — estaban escritos
 * con el mismo nivel que la carrera de referencia que inspiró Beyond 90
 * (ver el documento "Beyond 90 Carrera Ejemplo Completa"), pero vivían
 * en el mismo EVENTS muerto que la saga de pareja. Sin ellos, ninguna
 * carrera podía llegar a sentirse como esa referencia: nunca había
 * convocatoria, nunca Mundial, nunca Balón de Oro, nunca título — solo
 * partidos sueltos generados por IA sin ningún techo narrativo.
 */
const GRAND_MOMENT_EVENT_IDS = new Set([
  "sel-primera-convocatoria",
  "sel-capitania",
  "sel-mundial",
  "sel-clasificacion-mundial",
  "sel-clasificacion-eurocopa",
  "sel-clasificacion-copa-america",
  "sel-eurocopa",
  "sel-copa-america",
  "premio-balon-oro",
  "premio-pichichi",
  "premio-mvp-torneo",
  "fork-titulo-liga",
  "fork-champions",
  "especial-lesion-grave",
  // Añadidos por la skill narrativas-futbol: patrones reales de carrera
  // (fichaje caro que no cuaja, choque cultural, lesión de rodilla,
  // marginado por cambio de entrenador, cesión sin hueco al volver,
  // suplente que explota tarde, veterano que vuelve a su club de debut).
  "esp-fichaje-caro-presion",
  "vid-choque-cultural-extranjero",
  "esp-lesion-ligamento-cruzado",
  "ent-marginado-nuevo-entrenador",
  "rep-cesion-exito-sin-hueco",
  "ves-suplente-explota-tarde",
  "esp-veterano-vuelve-debut",
]);
const GRAND_MOMENT_EVENTS: GameEvent[] = EVENTS.filter((event) => GRAND_MOMENT_EVENT_IDS.has(event.id));

/**
 * Igual que pickScriptedLifeEvent pero para los grandes hitos, que
 * además pueden exigir confederación (Eurocopa solo tiene sentido para
 * una selección UEFA, Copa América para una CONMEBOL).
 */
function pickGrandMomentEvent(player: Player, usedEventIds: string[]): GameEvent | null {
  const playerConfederation = getConfederation(player.nation);
  const eligible = GRAND_MOMENT_EVENTS.filter(
    (event) =>
      (event.minWeek ?? 1) <= player.week &&
      (!event.requiresFlag || Boolean(player.flags?.[event.requiresFlag])) &&
      (event.minMedia === undefined || player.media >= event.minMedia) &&
      (event.maxMedia === undefined || player.media <= event.maxMedia) &&
      (!event.requiresConfederation ||
        (playerConfederation !== null && event.requiresConfederation.includes(playerConfederation))) &&
      !usedEventIds.includes(event.id),
  );
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

/** Semanas que dura una lesión larga real (ver tickInjury en career-dynamics.ts). */
const INJURY_LONG_DURATION_WEEKS = 8;

/**
 * La IA nunca escribe flags en sus consecuencias (sanitizeConsequences
 * las descarta, ver ai.ts) — así que el inicio de una lesión larga no
 * puede depender de que la IA lo marque, hay que forzarlo aquí. Cualquier
 * opción que elija el jugador para reaccionar arranca la misma cuenta
 * atrás: la lesión ya pasó, lo único que se decide es cómo se lleva.
 */
function attachInjuryStart(event: GameEvent): GameEvent {
  const injuryFlagKey = `injury_duration_${Date.now()}`;
  return {
    ...event,
    options: event.options.map((option) => ({
      ...option,
      consequences: {
        ...option.consequences,
        flags: { ...option.consequences.flags, [injuryFlagKey]: String(INJURY_LONG_DURATION_WEEKS) },
      },
    })),
  };
}

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
  // Los multiplicadores de abajo estaban calibrados a ojo, sin hacer la
  // cuenta real: con baseChance × multiplier como probabilidad de avanzar
  // una semana, el número ESPERADO de eventos por temporada de 10 semanas
  // es 10 / chanceOfAdvance — y con los valores antiguos (0.85/1.0/1.2)
  // esa cuenta daba ~24-39 eventos/temporada en Pro, no los "13-20" que
  // decía este mismo comentario. Sobre las 20 temporadas de Pro
  // (MODE_TARGET_WEEKS), eso son 480-780 eventos en una carrera
  // completa — una carrera Pro real hasta los 34-36 años (no se acorta:
  // retirarse antes de los 34 no es lo normal) se sentía interminable en
  // vez de "adictiva". Recalibrado para que Pro ronde 18-25
  // eventos/temporada (~360-500 en total), Estándar 14-19, Express
  // 10-14 — igual de diferenciados entre sí, pero jugables de verdad.
  const modeMultipliers: Record<string, number> = {
    express: 2.2,
    standard: 1.65,
    pro: 1.35,
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
  match: MatchWeek,
  history: HistoryItem[]
): Promise<GameEvent | null> {
  const age = playerAge(player.week);

  // El parámetro history se recibía pero nunca se usaba en el prompt — a
  // diferencia de casi cualquier otra generación de ai.ts (que sí incluye
  // "ÚLTIMOS EVENTOS"), esta escena se generaba a ciegas, sin ver qué
  // acababa de pasarle al jugador. La propia lista de ejemplos de arriba
  // sugiere "recuerdo de un partido anterior contra este rival" como
  // escena válida, algo imposible de escribir de verdad sin historial.
  const historyText = history.length
    ? history.map((h) => `- "${h.title}" → eligió: "${h.chosen}"`).join("\n")
    : "(todavía no vivió ningún evento)";

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

ÚLTIMOS EVENTOS (no repitas tema ni premisa; si encaja, dale continuidad):
${historyText}

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

const ATTACKER_DECISION_SITUATIONS = [
  "Recibes un balón filtrado y te plantas solo ante el portero.",
  "Un rechace te cae a los pies dentro del área, con la portería a tiro.",
  "Roban el balón: contragolpe, dos contra uno, la pelota es tuya.",
  "Te llega un centro raso al segundo palo, sin marca encima.",
  "Recibes de espaldas a la portería, con un defensa pegado a ti.",
  "Ganas la posición en el área pequeña tras un córner en el último minuto.",
];

const MIDFIELDER_DECISION_SITUATIONS = [
  "Recibes entre líneas con el área rival a un pase de distancia.",
  "Ves un hueco para filtrar el balón a tu delantero, si el pase sale bien.",
  "Robas el balón en el centro del campo con espacio para lanzar la contra.",
  "El rival te presiona en salida de balón, pegado a tu área.",
  "Te llega un balón dividido justo en la frontal del área.",
];

const DEFENDER_DECISION_SITUATIONS = [
  "El extremo rival te encara en velocidad, uno contra uno, cerca de tu área.",
  "Un balón dividido cae entre tú y el delantero rival dentro del área.",
  "El equipo rival sale a la contra y solo tú puedes evitarlo.",
  "Ganan un balón por alto en el área y el rechace te queda a ti, con un rival encima.",
  "Es el último minuto: un centro peligroso cruza tu área con dos rivales al acecho.",
];

const GOALKEEPER_DECISION_SITUATIONS = [
  "Un delantero rival se planta solo ante ti tras un error de tu defensa.",
  "Un disparo lejano viene ajustado a la escuadra, casi sin tiempo de reacción.",
  "Pitan un penalti a favor del rival en un momento clave del partido.",
  "Un centro raso cruza tu área pequeña con dos rivales al acecho.",
  "Sale un balón dividido fuera del área y un rival llega primero a por él.",
];

/**
 * El momento decisivo dentro del partido: antes esto no existía en
 * absoluto — el partido se resolvía entero de golpe y el jugador solo
 * podía reaccionar DESPUÉS (rueda de prensa, redes), nunca decidir algo
 * mientras el balón todavía estaba en juego. No hace falta IA aquí: son
 * siempre decisiones futbolísticas de verdad, con su propio riesgo/
 * recompensa vía el mecanismo `resolve` que ya usa el resto del juego.
 * El resultado se guarda en un flag y generateMatchDayEvent lo lee justo
 * después para que la crónica del partido sea coherente con lo que de
 * verdad pasó en esa jugada, no algo inventado aparte.
 *
 * Antes esto era SIEMPRE la misma terna (disparar/pasar/floritura),
 * fuera cual fuera la posición del jugador — un central o un portero
 * recibían literalmente "te plantas solo ante el portero" como si
 * fueran delanteros, partido tras partido. Visto en vivo jugando: con
 * varios partidos por temporada, esto se sentía como "el mismo evento
 * una y otra vez" mucho antes de lo que debería. Ahora la escena y las
 * tres opciones dependen de la posición real.
 */
export function buildMatchDecisionMoment(player: Player, match: { week: number; rivalClub: string }): GameEvent {
  const decisionFlagKey = `match_decision_${match.week}`;
  const flags = (outcome: string, style: string) => ({ [decisionFlagKey]: JSON.stringify({ outcome, style }) });

  if (player.position === "Portero") {
    const situation = GOALKEEPER_DECISION_SITUATIONS[Math.floor(Math.random() * GOALKEEPER_DECISION_SITUATIONS.length)];
    return {
      id: `match-decision-${match.week}-${Date.now()}`,
      category: "partido",
      rivalClub: match.rivalClub,
      title: "El momento decisivo",
      description: `Partido en marcha ante ${match.rivalClub}. ${situation} No hay tiempo para pensar demasiado — tienes que decidir ya.`,
      allowFreeText: true,
      freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
      options: [
        {
          id: "salir",
          label: "Salir a cerrar el ángulo",
          subtitle: "Agresivo: o paras el gol o dejas la portería vacía",
          consequences: {},
          resolve: {
            baseChance: 0.4,
            statModifier: "media",
            success: {
              text: "Achicas el ángulo a la perfección — el rival no tiene hueco. ¡Paradón!",
              consequences: { fama: 2, flags: flags("save", "salida") },
            },
            fail: {
              text: "Sales, pero te la pica por encima. Gol rival.",
              consequences: { flags: flags("concede", "salida") },
            },
          },
        },
        {
          id: "linea",
          label: "Quedarte en la línea y cubrir el palo corto",
          subtitle: "Más seguro, menos espectacular",
          consequences: {},
          resolve: {
            baseChance: 0.55,
            statModifier: "media",
            success: {
              text: "Te mantienes firme y sacas el disparo con una buena estirada.",
              consequences: { flags: flags("save", "linea") },
            },
            fail: {
              text: "El disparo pasa ajustado a tu palo. No llegas.",
              consequences: { flags: flags("concede", "linea") },
            },
          },
        },
        {
          id: "puños",
          label: "Anticipar y despejar con los puños",
          subtitle: "Todo o nada en el choque aéreo",
          consequences: {},
          resolve: {
            baseChance: 0.32,
            statModifier: "media",
            success: {
              text: "Sales a por todas y despejas el peligro con autoridad total.",
              consequences: { fama: 2, flags: flags("save", "puños") },
            },
            fail: {
              text: "Falla el cálculo: derribas al rival. El árbitro señala el punto de penalti.",
              consequences: { forma: -2, flags: flags("penalty_conceded", "puños") },
            },
          },
        },
      ],
    };
  }

  if (player.position === "Defensa") {
    const situation = DEFENDER_DECISION_SITUATIONS[Math.floor(Math.random() * DEFENDER_DECISION_SITUATIONS.length)];
    return {
      id: `match-decision-${match.week}-${Date.now()}`,
      category: "partido",
      rivalClub: match.rivalClub,
      title: "El momento decisivo",
      description: `Partido en marcha ante ${match.rivalClub}. ${situation} No hay tiempo para pensar demasiado — tienes que decidir ya.`,
      allowFreeText: true,
      freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
      options: [
        {
          id: "entrada",
          label: "Entrar fuerte al balón",
          subtitle: "Alto riesgo de falta, pero robo limpio si sale bien",
          consequences: {},
          resolve: {
            baseChance: 0.42,
            statModifier: "media",
            success: {
              text: "Entrada perfecta: te llevas el balón limpio y cortas el peligro de raíz.",
              consequences: { fama: 1, flags: flags("clean_tackle", "entrada") },
            },
            fail: {
              text: "Llegas tarde. El árbitro no duda: falta y tarjeta.",
              consequences: { forma: -2, flags: flags("foul_committed", "entrada") },
            },
          },
        },
        {
          id: "contener",
          label: "Contener sin arriesgar, llevarlo hacia fuera",
          subtitle: "Menos vistoso, pero mucho más seguro",
          consequences: {},
          resolve: {
            baseChance: 0.58,
            statModifier: "media",
            success: {
              text: "Le quitas los espacios con paciencia hasta que pierde el balón por su cuenta.",
              consequences: { flags: flags("contained", "contener") },
            },
            fail: {
              text: "Te desborda igualmente. El peligro sigue vivo.",
              consequences: { flags: flags("beaten", "contener") },
            },
          },
        },
        {
          id: "anticipar",
          label: "Anticipar con lectura de juego",
          subtitle: "Todo o nada: adelantarte al pase antes de que llegue",
          consequences: {},
          resolve: {
            baseChance: 0.3,
            statModifier: "media",
            success: {
              text: "Lees la jugada a la perfección y te llevas el balón antes de que nadie lo espere.",
              consequences: { fama: 2, flags: flags("clean_tackle", "anticipar") },
            },
            fail: {
              text: "Fallas el cálculo y te quedas completamente fuera de la jugada.",
              consequences: { forma: -2, flags: flags("beaten", "anticipar") },
            },
          },
        },
      ],
    };
  }

  if (player.position === "Centrocampista") {
    const situation = MIDFIELDER_DECISION_SITUATIONS[Math.floor(Math.random() * MIDFIELDER_DECISION_SITUATIONS.length)];
    return {
      id: `match-decision-${match.week}-${Date.now()}`,
      category: "partido",
      rivalClub: match.rivalClub,
      title: "El momento decisivo",
      description: `Partido en marcha ante ${match.rivalClub}. ${situation} No hay tiempo para pensar demasiado — tienes que decidir ya.`,
      allowFreeText: true,
      freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
      options: [
        {
          id: "disparo",
          label: "Probar el disparo lejano",
          subtitle: "Vas a por el gol directo desde fuera del área",
          consequences: {},
          resolve: {
            baseChance: 0.32,
            statModifier: "media",
            success: {
              text: "El balón se cuela pegado a la escuadra. ¡Golazo desde fuera del área!",
              consequences: { fama: 2, flags: flags("goal", "disparo") },
            },
            fail: {
              text: "El disparo se marcha alto, por encima del larguero.",
              consequences: { flags: flags("miss", "disparo") },
            },
          },
        },
        {
          id: "pase",
          label: "Filtrar el pase al delantero",
          subtitle: "Menos gloria, más seguro",
          consequences: {},
          resolve: {
            baseChance: 0.55,
            statModifier: "media",
            success: {
              text: "El pase es perfecto: tu compañero no perdona.",
              consequences: { flags: flags("assist", "pase") },
            },
            fail: {
              text: "El pase se queda corto y el rival despeja el peligro.",
              consequences: { flags: flags("miss", "pase") },
            },
          },
        },
        {
          id: "proteger",
          label: "Proteger el balón y reiniciar la jugada",
          subtitle: "Sin riesgo: mantener la posesión del equipo",
          consequences: {},
          resolve: {
            baseChance: 0.7,
            statModifier: "media",
            success: {
              text: "Proteges el balón con inteligencia y das tiempo a que el equipo suba.",
              consequences: { flags: flags("contained", "proteger") },
            },
            fail: {
              text: "Te presionan entre dos rivales y pierdes el balón en una zona comprometida.",
              consequences: { forma: -1, flags: flags("beaten", "proteger") },
            },
          },
        },
      ],
    };
  }

  // Delantero (y cualquier posición no reconocida, como red de seguridad).
  const situation = ATTACKER_DECISION_SITUATIONS[Math.floor(Math.random() * ATTACKER_DECISION_SITUATIONS.length)];
  return {
    id: `match-decision-${match.week}-${Date.now()}`,
    category: "partido",
    rivalClub: match.rivalClub,
    title: "El momento decisivo",
    description: `Partido en marcha ante ${match.rivalClub}. ${situation} No hay tiempo para pensar demasiado — tienes que decidir ya.`,
    allowFreeText: true,
    freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
    options: [
      {
        id: "disparo",
        label: "Disparar a puerta",
        subtitle: "Vas a por el gol directo",
        consequences: {},
        resolve: {
          baseChance: 0.42,
          statModifier: "media",
          success: {
            text: "El balón entra pegado al palo. ¡Gol!",
            consequences: { flags: flags("goal", "disparo") },
          },
          fail: {
            text: "El portero saca una mano providencial. No hay gol.",
            consequences: { flags: flags("miss", "disparo") },
          },
        },
      },
      {
        id: "pase",
        label: "Pasar a un compañero mejor colocado",
        subtitle: "Menos gloria, más seguro",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "media",
          success: {
            text: "El pase es perfecto: tu compañero no perdona.",
            consequences: { flags: flags("assist", "pase") },
          },
          fail: {
            text: "El pase se queda corto y el rival despeja el peligro.",
            consequences: { flags: flags("miss", "pase") },
          },
        },
      },
      {
        id: "floritura",
        label: "Intentar una jugada de calidad (regate, túnel, sombrero...)",
        subtitle: "Todo o nada, para la galería",
        consequences: {},
        resolve: {
          baseChance: 0.28,
          statModifier: "media",
          success: {
            text: "Sale perfecta. El estadio entero se levanta de sus asientos.",
            consequences: { fama: 3, flags: flags("wondergoal", "floritura") },
          },
          fail: {
            text: "No sale — pierdes el balón y el rival sale a la contra.",
            consequences: { forma: -2, flags: flags("miss_bad", "floritura") },
          },
        },
      },
    ],
  };
}

/**
 * Traduce el resultado ya fijado del momento decisivo (ver
 * buildMatchDecisionMoment) a una instrucción concreta para la crónica
 * del partido, para que el marcador/goles/asistencias que escriba la IA
 * sean coherentes con la jugada que el jugador ya vivió y decidió — no
 * algo inventado aparte que podría contradecirla.
 */
function buildDecisionInstruction(decisionRaw?: string): string {
  if (!decisionRaw) return "";
  let decision: { outcome: string; style: string };
  try {
    decision = JSON.parse(decisionRaw);
  } catch {
    return "";
  }
  const byOutcome: Record<string, string> = {
    goal: `Antes tuvo una ocasión clarísima y LA METIÓ de disparo directo — ESE es uno de sus goles en este partido (Goles debe ser 1 o más, nunca 0).`,
    assist: `Antes tuvo una ocasión y decidió dar el pase a un compañero, que SÍ marcó — ESA es una de sus asistencias en este partido (Asistencias debe ser 1 o más). Esa jugada concreta NO cuenta como gol propio.`,
    wondergoal: `Antes intentó una jugada de mucha calidad (regate/túnel/sombrero) en un momento decisivo y LE SALIÓ — fue un gol o jugada de mérito especial que la prensa recuerda; cuenta como uno de sus goles (Goles debe ser 1 o más).`,
    miss: `Antes tuvo una ocasión clara y la FALLÓ — esa jugada concreta no es gol ni asistencia (puede seguir sin marcar el resto del partido, o anotar en otra jugada distinta si encaja con el relato).`,
    miss_bad: `Antes intentó una jugada arriesgada en un momento decisivo y la PERDIÓ, dejando a su equipo con menos gente atrás en la jugada siguiente — un momento negativo puntual que puede haber costado un gol en contra.`,
    // Portero: no fuerces "Goles"/"Asistencias" para estos, son acciones
    // defensivas — el marcador y el resto del partido son libres de
    // escribir con normalidad alrededor de este momento.
    save: `Antes tuvo una intervención decisiva bajo palos (parada, salida o despeje) y LA RESOLVIÓ BIEN — evitó un gol rival prácticamente cantado. No es un gol ni una asistencia propia.`,
    concede: `Antes tuvo una intervención decisiva bajo palos y NO llegó a tiempo — ese gol rival concreto entra en el marcador final a favor del rival, aunque el resto del partido sea libre de escribir.`,
    penalty_conceded: `Antes, en una salida arriesgada, derribó a un rival dentro del área — el árbitro señaló penalti en contra. Asume que ese penalti se transforma en gol rival salvo que quieras narrar una parada del propio penalti como giro dramático adicional.`,
    // Defensa: acciones defensivas, tampoco fuerces goles/asistencias propias.
    clean_tackle: `Antes tuvo una acción defensiva decisiva (entrada o anticipación) y la resolvió LIMPIA — cortó una ocasión clara del rival sin sufrir consecuencias. No es un gol ni una asistencia propia.`,
    foul_committed: `Antes tuvo una acción defensiva decisiva pero llegó tarde — cometió una falta clara (tarjeta amarilla lógica en esa jugada) que puede haber dado pie a un peligro añadido para su equipo.`,
    contained: `Antes tuvo una acción defensiva o de posesión y la resolvió con solvencia, sin sobresaltos — no genera gol ni asistencia propia, simplemente mantiene el orden del equipo.`,
    beaten: `Antes tuvo una acción defensiva o de posesión decisiva y fue superado por el rival — ese momento concreto puede haber derivado en una ocasión o gol en contra, aunque el resto del partido es libre de escribir.`,
  };
  const line = byOutcome[decision.outcome];
  if (!line) return "";
  return `- MOMENTO DECISIVO YA VIVIDO Y FIJO, NO LO CONTRADIGAS: ${line}`;
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
export async function generateMatchDayEvent(
  player: Player,
  match: MatchWeek,
  history: HistoryItem[],
  decisionRaw?: string,
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
- Tu club: ${player.club}
- Rival: ${match.rivalClub}
- Competición: ${compLabel[match.competition as keyof typeof compLabel] ?? "Partido importante"}
- Jornada: ${match.description}
- Contexto: ${match.homeTeam === player.club ? "Jugaste en tu estadio" : `Jugaste como visitante en ${match.awayTeam}`}

TU SITUACIÓN:
- Jugador: ${player.last_name}, ${age} años, ${player.position}
- Media: ${player.media}/99, Forma: ${player.forma}/100, Moral: ${player.moral}/100
- Partidos jugados como profesional hasta ahora (SIN contar este): ${player.stats_matches_played ?? 0}
${buildDecisionInstruction(decisionRaw)}

REGLAS CRÍTICAS:
${COMMON_RULES}
- PROHIBIDO ABSOLUTO: mencionar cualquier rival o competición que NO sea "${match.rivalClub}" en "${compLabel[match.competition as keyof typeof compLabel] ?? match.competition}". No inventes otro equipo, otra jornada ni otro torneo — es EL PARTIDO PROGRAMADO, no uno libre. rival_club debe ser exactamente "${match.rivalClub}".
- En el título y la descripción, tu equipo se llama SIEMPRE "${player.club}" tal cual — NUNCA un nombre genérico o inventado como "Real Club", "tu equipo" o similar.
- El marcador se escribe SIEMPRE en el orden "${player.club} - ${match.rivalClub}" (tu equipo primero, sin importar si juegas en casa o fuera), y el relato (quién ganó/perdió/empató) tiene que cuadrar aritméticamente con ese marcador — un marcador donde tu primer número es mayor es VICTORIA tuya, no derrota, y viceversa. Revísalo antes de escribir el texto final.
- OBLIGATORIO en la descripción, en este orden: (1) "${match.rivalClub}" y "${compLabel[match.competition as keyof typeof compLabel] ?? match.competition}" tal cual, (2) marcador EXACTO en el orden indicado arriba (ej "2-1"), (3) minutos jugados, (4) tu nota (0-10, decimal), (5) GOLES exactos (0, 1, 2+), (6) asistencias. Crónica corta (3-5 frases) — que quede clarísimo si metiste gol o no, y si tu equipo ganó, perdió o empató, es el dato más importante de todo el evento.
- FORMATO RECOMENDADO: "Ante ${match.rivalClub} en ${compLabel[match.competition as keyof typeof compLabel] ?? match.competition}, jugaste [X] minutos. Nota: [X.X]/10. Goles: [0/1/2+]. Asistencias: [X]. Marcador: [X-X] (${player.club}-${match.rivalClub})."
- ${
    (player.stats_matches_played ?? 0) > 0
      ? `PROHIBIDO llamar a esto "debut" o "primer partido" de ninguna forma — ya lleva ${player.stats_matches_played} partido(s) jugados como profesional. Trátalo como un partido más de una carrera en marcha, con el peso narrativo que corresponda a ese momento (racha, presión, rutina, rivalidad concreta), nunca como una primera vez.`
      : `Este SÍ es su primer partido como profesional — aquí sí cabe la palabra "debut".`
  }
- El resultado y rendimiento deben ser coherentes con forma ${player.forma}/100 y media ${player.media}/99 — a veces se pierde, a veces juegas mal o no sales, variación realista. No siempre eres el héroe.
- Las opciones son sobre cómo reaccionas DESPUÉS (prensa, vestuario, redes, autocrítica), no sobre cómo jugar — el partido ya pasó. NO reutilices siempre el mismo cuarteto de reacciones (rueda de prensa / redes / entrenador / entrenar solo) — varía el tipo de reacción según lo que pasó en ESTE partido concreto (un compañero, la familia, un rival directo, la afición local, algo que dijiste tú mismo en el campo...).
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
 * Aplica cambios automáticos de carrera (forma degrada, relaciones sufren,
 * presión mediática, declive por edad). Antes esta función devolvía una
 * COPIA del jugador que nadie guardaba nunca — page.tsx solo persiste
 * pending_event y flags tras llamar a pickNextEventDynamic, así que todo
 * este cálculo se tiraba a la basura en cada turno y la forma jamás
 * degradaba de verdad por inactividad. Ahora muta el propio objeto
 * `player` (mismo patrón ya usado por el cooldown del gol de chilena o el
 * tracker de adversidad) para que page.tsx lo persista junto al resto.
 *
 * Se aplica como mucho una vez por número de semana real (no una vez por
 * turno/evento, que puede haber varios en la misma semana): sin este
 * guardado en flags, una carrera con muchos eventos por semana degradaría
 * la forma varias veces seguidas y la dejaría siempre pegada al suelo.
 */
/**
 * Sueldo semanal derivado de la media futbolística — sin un campo de
 * salario propio en el jugador, esta es la única fuente de verdad. Antes
 * el "sueldo" solo existía como cifra suelta en el texto de la firma del
 * contrato (ver randomSalaryFigure en ai.ts) y nunca se aplicaba de
 * verdad al patrimonio: un profesional podía llevar temporadas jugando
 * en un club de Primera y seguir con 0€ salvo que le tocara algún evento
 * puntual de dinero — justo lo contrario de cómo funciona el fútbol real,
 * donde el sueldo es la fuente de ingresos constante, no algo ocasional.
 * Misma curva que usa careerStats.ts para el valor de mercado (exponente
 * sobre media-40), escalada para que una carrera Pro completa (~200
 * semanas) acumule un patrimonio alto pero no absurdo.
 */
export function weeklySalary(media: number): number {
  return Math.round(Math.max(150, Math.max(0, media - 40) ** 2 * 8) / 10) * 10;
}

function applyCareerDynamics(player: Player): Player {
  const lastDynamicsWeek = parseInt(String(player.flags?.dynamics_last_week ?? "0"), 10) || 0;
  if (player.week <= lastDynamicsWeek) {
    return player;
  }
  if (!player.flags) player.flags = {};
  player.flags.dynamics_last_week = String(player.week);

  // El sueldo solo corre si hay club real (un agente libre no cobra de
  // nadie) — se aplica ANTES del resto de dinámicas para usar la media
  // de esta semana, igual que el resto de esta función.
  if (player.club !== NO_CLUB_YET) {
    player.patrimonio = (player.patrimonio ?? 0) + weeklySalary(player.media);
  }

  // Aplicar degradación de forma si no ha jugado
  player.forma = naturalFormaDegradation(player);

  // Aplicar declive por edad (si >32 años)
  const mediaAfterAge = ageBasedMediaDecline(player);
  if (mediaAfterAge < player.media) {
    player.media = mediaAfterAge;
  }
  // Autocorrección: un bug ya corregido en ageBasedMediaDecline dejó
  // partidas reales con media en 0 (por debajo del suelo de 40 que rige
  // en todo el resto del juego). Este clamp repara ese valor corrupto en
  // cuanto la carrera vuelve a pasar por aquí, sin necesitar tocar la
  // base de datos a mano.
  player.media = Math.max(40, Math.min(99, player.media));

  // Aplicar deterioro de relaciones
  const relChanges = deteriorateRelationships(player);
  Object.assign(player, relChanges);

  // Presión mediática afecta moral
  const { mortalAfect } = calculateMediaPressure(player);
  if (mortalAfect < 0) {
    player.moral = Math.max(0, (player.moral || 50) + mortalAfect);
  }

  return player;
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

  // NOTA: pickNextEventDynamic solo se llama desde /carrera/page.tsx, que
  // ya redirige fuera (a /carrera/segunda-vida/elegir o /carrera/segunda-vida)
  // antes de llegar aquí cuando el status es awaiting_second_life o
  // second_life — esos dos estados nunca llegan a este punto. La página
  // de segunda vida real genera sus propios eventos directamente con
  // generateSecondLifeEvent (ver src/app/carrera/segunda-vida/page.tsx).

  // Verificar TRANSICIONES DE CARRERA AUTOMÁTICAS (pico, decline, retiro)
  const careerTransition = detectCareerTransition(playerWithDynamics);
  // "ready_to_retire" se activa con una condición amplia (edad > 34, o
  // 32+ con media baja) que sigue siendo cierta turno tras turno si el
  // jugador elige "continuar" — sin un enfriamiento, "¿Hasta cuándo vas
  // a jugar?" se repetía EN CADA TURNO sin parar nunca, potencialmente
  // durante cientos de turnos seguidos. Se recuerda como mucho una vez
  // cada 15 semanas, no cada vez que se genera un evento nuevo.
  const retireReminderCooldownOk =
    careerTransition !== "ready_to_retire" ||
    player.week - parseInt(String(player.flags?.retire_reminder_last_week ?? "-999"), 10) >= 15;

  if (careerTransition && retireReminderCooldownOk) {
    console.log(`[pickNextEventDynamic] Career transition detected: ${careerTransition}`);
    let transitionEvent: GameEvent | null = null;

    switch (careerTransition) {
      case "entering_peak":
        transitionEvent = buildEnteringPeakEvent();
        break;
      case "exiting_peak":
        transitionEvent = buildExitingPeakEvent(playerAge(player.week));
        break;
      case "entering_decline":
        transitionEvent = buildEnteringDeclineEvent();
        break;
      case "ready_to_retire":
        transitionEvent = buildReadyToRetireEvent();
        if (!player.flags) player.flags = {};
        player.flags.retire_reminder_last_week = String(player.week);
        break;
    }

    if (transitionEvent) {
      return maybeAddFreeText(transitionEvent);
    }
  }

  // El cierre de una temporada y el arranque de la siguiente (edad+1,
  // stats del año que se cierra) tiene que tener su propio momento
  // narrativo — comprobarlo ANTES que "hay partido esta semana", porque
  // la primera semana de cada temporada nueva SIEMPRE tiene un amistoso
  // programado (ver match-calendar.ts) y ese check ganaba siempre,
  // dejando la temporada pasar sin que se notara nunca el cambio de año
  // (el jugador solo se daba cuenta porque de golpe tenía un año más).
  // Visto en vivo jugando.
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

  // Verificar si el partido programado es ESTA semana — tiene que
  // comprobarse ANTES que "la próxima semana", o el partido nunca llega
  // a jugarse (el motor solo generaba la víspera una y otra vez).
  const matchThisWeek = getMatchThisWeek(playerWithDynamics.week, playerWithDynamics.club);
  if (matchThisWeek) {
    // Antes el partido se resolvía entero de golpe (marcador ya decidido)
    // y el jugador solo podía reaccionar DESPUÉS — nunca decidir nada
    // mientras el balón seguía en juego. Ahora primero se vive el momento
    // decisivo (rematar/pasar/floritura) y solo cuando ya está resuelto
    // se genera la crónica del partido, coherente con esa jugada.
    const decisionFlagKey = `match_decision_${matchThisWeek.week}`;
    const decisionOutcome = playerWithDynamics.flags?.[decisionFlagKey] as string | undefined;

    if (!decisionOutcome) {
      console.log(
        `[pickNextEventDynamic] This week IS match week (${matchThisWeek.competition}) — momento decisivo primero.`
      );
      return maybeAddFreeText(buildMatchDecisionMoment(playerWithDynamics, matchThisWeek));
    }

    console.log(
      `[pickNextEventDynamic] This week IS match week (${matchThisWeek.competition}): ${matchThisWeek.description}. Resolving the match.`
    );
    const matchDayEvent = await generateMatchDayEvent(playerWithDynamics, matchThisWeek, history, decisionOutcome);
    if (matchDayEvent) {
      return maybeAddFreeText(addMatchContext(matchDayEvent, playerWithDynamics));
    }
  }

  // Verificar si hay un partido importante próximo (la próxima semana)
  // Si es así, generar un evento pre-partido narrativo — pero solo UNA
  // vez por partido: nextWeekGap puede tocar "no avanzar semana" varias
  // veces seguidas mientras sigue siendo cierto que "el partido es la
  // semana que viene", y sin este freno, la víspera del mismo partido se
  // repetía turno tras turno (visto en vivo: 5 veces seguidas "La noche
  // antes del Getafe", cada una con texto distinto pero la misma premisa
  // — no tiene sentido narrativo vivir varias vísperas del mismo partido).
  if (isMatchWeekNext(playerWithDynamics.week, playerWithDynamics.club)) {
    const nextMatch = getNextMatch(playerWithDynamics.week, playerWithDynamics.club);
    const prematchFlagKey = `prematch_shown_${nextMatch?.week}`;
    if (nextMatch && !player.flags?.[prematchFlagKey]) {
      console.log(
        `[pickNextEventDynamic] Next week is match week (${nextMatch.competition}): ${nextMatch.description}. Generating pre-match narrative.`
      );
      // Generar evento pre-partido contextualizado
      const preMatchEvent = await generatePreMatchEvent(playerWithDynamics, nextMatch, history);
      if (preMatchEvent) {
        if (!player.flags) player.flags = {};
        player.flags[prematchFlagKey] = true;
        return maybeAddFreeText(preMatchEvent);
      }
    }
  }

  // Declive emocional: reflexión sobre fin de carrera (edad 30+)
  // Momento profundo sobre transición, legado, segunda vida. Antes el gate
  // era un proxy tosco ("semana > 150"), que ni miraba el estado real del
  // jugador — shouldTriggerDeclineReflection() estaba escrita (fase de
  // decline sostenida, media cayendo con 34+, o crisis de forma+moral) pero
  // nunca se llamaba desde aquí, así que ese criterio más fiel nunca se
  // aplicaba de verdad. Con esto, la reflexión llega cuando el jugador de
  // verdad está en declive, no solo cuando el reloj lo dice.
  if (playerAge(player.week) >= 30 && shouldTriggerDeclineReflection(player) && Math.random() < 0.08) {
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
    const adversityDesc = describeAdversity(adversityType);
    const adversityPrompt = buildAdversityPrompt(player, adversityType, adversityDesc);

    const adversityEvent = await callEventTool(adversityPrompt, "especial", `adversity-${adversityType}`);

    if (adversityEvent) {
      // Antes se creaba siempre un tracker nuevo con adversitiesCount: 0
      // en vez de partir del guardado — updateAdversityTracker lo subía
      // a 1 y ahí se quedaba para siempre, por muchas adversidades que
      // viviera el jugador en el resto de la carrera.
      const tracker = getAdversityTracker(player);
      updateAdversityTracker(player, tracker);
      const finalAdversityEvent: GameEvent = {
        ...adversityEvent,
        id: `adversity-${adversityType}-${Date.now()}`,
        category: "especial",
        isMilestone: Math.random() < 0.3, // 30% de las adversidades son hitos
      };
      // La lesión larga necesita su propia cuenta atrás persistente (ver
      // tickInjury, aplicado turno a turno en resolveEvent) — sin esto,
      // "injury_long" es solo un golpe puntual como cualquier otra
      // adversidad, y una rotura grave no debería curarse en un turno.
      return maybeAddFreeText(
        adversityType === "injury_long" ? attachInjuryStart(finalAdversityEvent) : finalAdversityEvent,
      );
    }
  }

  // Grandes momentos de leyenda (selección, Mundial, Balón de Oro,
  // títulos): más probabilidad que el sabor normal en cuanto el jugador
  // cumple los requisitos, porque son los hitos que de verdad dan forma
  // a una carrera memorable — no deberían quedar a la misma suerte que
  // una escena de vestuario cualquiera.
  if (Math.random() < 0.35) {
    const grandMomentEvent = pickGrandMomentEvent(player, usedEventIds);
    if (grandMomentEvent) {
      console.log(`[pickNextEventDynamic] Grand moment event: "${grandMomentEvent.title}"`);
      return maybeAddFreeText(
        grandMomentEvent.id === "especial-lesion-grave" ? attachInjuryStart(grandMomentEvent) : grandMomentEvent,
      );
    }
  }

  // La cesión: decisión que define carreras jóvenes de verdad (ver el
  // documento de referencia de la partida original) y que el juego no
  // tenía en absoluto — un jugador joven sin minutos solo generaba
  // vestuario/entrenamiento genérico para siempre. Una única vez por
  // carrera (marcado con loan_fork_seen), y con resultado real: puede
  // salir redondo o puede ser un año perdido, nunca garantizado.
  if (shouldTriggerLoanFork(player)) {
    console.log(`[pickNextEventDynamic] Loan fork event for ${player.last_name}`);
    markLoanForkTriggered(player);
    return maybeAddFreeText(buildLoanForkEvent(player));
  }

  // Llamadas del representante: ofertas de otros clubes, otro agente
  // queriendo robártelo, consejos de inversión, avisos sobre un club que
  // huele mal. Este bloque existía en agent-events.ts desde hace tiempo
  // pero nunca se llamaba desde aquí — el representante literalmente no
  // hacía nada en toda la carrera salvo aparecer en la firma de contrato.
  // Reportado en vivo: "tu repre no te llama para nada ni para
  // oportunidad de inversión".
  if (shouldTriggerAgentDialogue(player)) {
    const trigger = pickEligibleAgentTrigger(player);
    const agentEvent = trigger ? buildAgentDialogueEvent(player, trigger, player.agent_name ?? "Tu representante") : null;
    if (agentEvent) {
      console.log(`[pickNextEventDynamic] Agent dialogue event: "${agentEvent.title}"`);
      markAgentDialogueTriggered(player);
      return maybeAddFreeText(agentEvent);
    }
  }

  // Saga de pareja/hijos y eventos de prensa con consecuencias fijas: un
  // hueco pequeño (como el de sponsorships/momentos raros de más abajo),
  // no la fuente principal de narrativa.
  if (Math.random() < 0.12) {
    const scriptedEvent = pickScriptedLifeEvent(player, usedEventIds);
    if (scriptedEvent) {
      console.log(`[pickNextEventDynamic] Scripted life/press event: "${scriptedEvent.title}"`);
      return maybeAddFreeText(scriptedEvent);
    }
  }

  // Cameos de famosos, momentos virales y algún surrealista (ver
  // FAME_EVENT_IDS más arriba) — contenido ya escrito que llevaba muerto.
  // 16% para que aparezca con cierta frecuencia sin comerse el resto del
  // sabor normal generado por IA.
  if (Math.random() < 0.16) {
    const fameEvent = pickFameEvent(player, usedEventIds);
    if (fameEvent) {
      console.log(`[pickNextEventDynamic] Fame/viral/surreal event: "${fameEvent.title}"`);
      return maybeAddFreeText(fameEvent);
    }
  }

  // Banco de vida detallada (boda, nacimiento, muerte de un familiar,
  // traición, escándalo, premio individual, instituto, familia,
  // contraportada de prensa...) — ver life-events-detailed.ts. Llevaba
  // escrito sin que nadie lo recorriera; aquí se elige una escena
  // concreta según edad/estadísticas y se le pide a la IA que la
  // desarrolle con su propio detalle. Subido de 15% a 22%: con el banco
  // de instituto/familia recién añadido, un jugador joven tiene ahora
  // muchas más categorías elegibles a la vez — a un 16 años recién
  // empezado, antes de que haya club/fichajes/hitos de sobra, esto era
  // justo lo que hacía sentir vacías las primeras semanas de carrera.
  if (Math.random() < 0.22) {
    const detailedScenario = pickDetailedLifeScenario(player);
    if (detailedScenario) {
      const { generateDetailedLifeEvent } = await import("./ai");
      const detailedEvent = await generateDetailedLifeEvent(
        player,
        detailedScenario.category,
        detailedScenario.scenario,
        history,
      );
      if (detailedEvent) {
        console.log(
          `[pickNextEventDynamic] Detailed life event (${detailedScenario.category}) for ${player.last_name}: "${detailedEvent.title}"`
        );
        markDetailedLifeUsed(player, detailedScenario.category);
        return maybeAddFreeText(detailedEvent);
      }
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

  // Al principio de la carrera el jugador no sabe nada del negocio del
  // fútbol — es cuando más necesita que su representante le llame con
  // novedades (interés de otro club, una marca, una inversión) en vez de
  // aparecer solo en los momentos mecánicos de fichaje. Sin gate de fama
  // alta a propósito: es justo lo contrario del patrocinio de abajo,
  // pensado para una estrella ya consolidada.
  if (playerAge(player.week) < 20 && Math.random() < 0.18) {
    const { generateAgentGuidanceCall } = await import("./ai");
    const guidanceEvent = await generateAgentGuidanceCall(player, history);
    if (guidanceEvent) {
      console.log(`[pickNextEventDynamic] Agent guidance call for ${player.last_name}: "${guidanceEvent.title}"`);
      return maybeAddFreeText(guidanceEvent);
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
      // Los momentos "surreal" rompen la física a propósito (gravedad
      // invertida, un balón con una ciudad dentro...) — precisamente lo
      // que un modelo de edición de imagen fotorrealista no puede
      // representar de forma coherente sobre una foto real. Sin esta
      // exclusión, un 4% de todos los eventos del juego podían intentar
      // generar una imagen imposible de renderizar bien.
      const canHaveImage = !isSurrealMoment(funnyMoment);
      return maybeAddFreeText({
        ...funnyEvent,
        id: `funny-${Date.now()}`,
        category: "especial",
        isMilestone: canHaveImage && Math.random() < 0.4,
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
