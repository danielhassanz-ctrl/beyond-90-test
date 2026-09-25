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
import { getNextMatch, isMatchWeekNext, getMatchThisWeek, getEuropeanCompetitionFor, type MatchWeek, type MatchStakes } from "@/lib/calendar/match-calendar";
import { getCopaProgress, advanceCupProgress, decideKnockoutResult } from "@/lib/calendar/competition-progress";
import { naturalFormaDegradation, calculateMediaPressure, deteriorateRelationships, shouldTriggerDeclineReflection, ageBasedMediaDecline } from "@/lib/narrative/career-dynamics";
import { detectCareerTransition, buildEnteringPeakEvent, buildExitingPeakEvent, buildEnteringDeclineEvent, buildReadyToRetireEvent } from "@/lib/narrative/career-transitions";
import { shouldTriggerGolChilena, buildGolChilenaEvent, markGolChilenaTriggered } from "@/lib/narrative/gol-chilena";
import { EVENTS } from "@/lib/narrative/events";
import { describeCast } from "@/lib/narrative/npcs";
import {
  buildAgentDialogueEvent,
  shouldTriggerAgentDialogue,
  pickEligibleAgentTrigger,
  markAgentDialogueTriggered,
} from "@/lib/narrative/agent-events";
import {
  shouldTriggerMarketRumor,
  markMarketRumorShown,
  buildMarketRumorEvent,
  shouldTriggerTransferOffer,
  buildTransferOfferEvent,
  clearStaleTransferInterest,
  shouldTriggerOwnMoveDecision,
  buildOwnMoveEvent,
  shouldTriggerDeadlineDay,
  buildDeadlineDayEvent,
} from "@/lib/narrative/market-window";
import { shouldTriggerLoanFork, buildLoanForkEvent, markLoanForkTriggered, shouldEndLoan, buildLoanEndEvent } from "@/lib/narrative/loan-fork";
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
  // Encontrados en la auditoría de eventos huérfanos: llevaban escritos
  // en events.ts con `priority: true`, un campo que solo leía
  // pickNextEventSmart — una función alternativa que nadie llama desde
  // ningún sitio (pickNextEventDynamic es la que de verdad se usa). Entre
  // ellos estaban justo los saltos de carrera que pide el documento de
  // referencia (salto internacional, gigante europeo, Premier League) sin
  // que pudieran salir NUNCA en una partida real.
  "fork-fuera-de-planes",
  "fork-no-renovacion",
  "fork-premier-segundo-club",
  "especial-mentor-joven",
  "rep-renovacion-contrato",
  "ves-conflicto-capitan",
  "fork-salto-internacional",
  "fork-gigante-europeo",
  "fork-nuevo-reto",
  "fork-ascenso-division",
]);
const GRAND_MOMENT_EVENTS: GameEvent[] = EVENTS.filter((event) => GRAND_MOMENT_EVENT_IDS.has(event.id));

/**
 * Igual que pickScriptedLifeEvent pero para los grandes hitos, que
 * además pueden exigir confederación (Eurocopa solo tiene sentido para
 * una selección UEFA, Copa América para una CONMEBOL).
 */
const FOREIGN_CLUBS = new Set([
  "Atalanta", "AS Roma", "Inter de Milán", "Juventus", "Borussia Dortmund", "Bayern de Múnich", "Bayern Múnich",
  "Bayern Munich", "Paris Saint-Germain", "PSG", "Liverpool FC", "Manchester City", "Benfica", "Ajax",
  "Sporting CP", "Al-Nassr FC",
]);
const SEGUNDA_CLUBS = new Set([
  "Real Zaragoza", "Deportivo de La Coruña", "Racing de Santander", "Real Sporting de Gijón", "Sporting de Gijón",
  "SD Eibar", "Burgos CF", "CD Mirandés", "CD Tenerife",
]);

/**
 * Un fork de traspaso ya escrito no sabe en qué club estás: sin este
 * filtro, un simulador de carrera dio "aceptar el salto a Italia" a un
 * jugador del Real Madrid, "llama un gigante europeo" (el Real Madrid) al
 * propio Real Madrid, "choque cultural en el extranjero" a alguien en un
 * club español y "partido de ascenso" a un equipo de Primera.
 */
function isEventCoherentWithClub(eventId: string, player: Player): boolean {
  const club = player.club;
  const foreign = FOREIGN_CLUBS.has(club);
  const isGrande = getEuropeanCompetitionFor(club)?.competition === "champions";
  const clubChanges = parseInt(String(player.flags?.club_changes ?? "0"), 10) || 0;
  switch (eventId) {
    case "fork-salto-internacional":
      return !foreign && !isGrande;
    case "fork-gigante-europeo":
      return !isGrande && club !== "Real Madrid" && club !== "FC Barcelona";
    case "fork-nuevo-reto":
      return !player.flags?.en_premier && club !== "Liverpool FC" && club !== "Manchester City" && club !== "Al-Nassr FC";
    case "vid-choque-cultural-extranjero":
      return foreign;
    case "fork-ascenso-division":
      return SEGUNDA_CLUBS.has(club);
    case "esp-fichaje-caro-presion":
      return clubChanges >= 2;
    case "esp-veterano-vuelve-debut":
      return clubChanges >= 3;
    default:
      return true;
  }
}

function pickGrandMomentEvent(player: Player, usedEventIds: string[]): GameEvent | null {
  const playerConfederation = getConfederation(player.nation);
  const eligible = GRAND_MOMENT_EVENTS.filter(
    (event) =>
      isEventCoherentWithClub(event.id, player) &&
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

/**
 * Momentos especiales DENTRO de un partido (penalti decisivo, roja
 * injusta, noche de hat-trick, mano a mano, revancha contra el club que
 * te cedió...) — encontrados en la misma auditoría de eventos huérfanos:
 * llevaban `priority: true` en events.ts pero, igual que los forks de
 * arriba, ningún selector real los llamaba nunca. A diferencia de esos
 * forks (categoría "representante"/"especial"), estos son categoría
 * "partido" — así que SOLO se pueden usar en una semana con partido real
 * programado (ver el uso de esta función en pickNextEventDynamic), nunca
 * sueltos un turno cualquiera: hacerlo de otra forma habría reintroducido
 * el mismo bug de "partido inventado sin conexión con el calendario" que
 * se corrigió antes esta noche.
 */
const MATCH_SPECIAL_MOMENT_IDS = new Set([
  "par-mano-a-mano",
  "par-penal",
  "par-roja-injusta",
  "par-hat-trick",
  "par-etiqueta-fichaje-caro",
  "par-cesion-revancha",
  "par-mvp-partido-clave",
]);
const MATCH_SPECIAL_MOMENTS: GameEvent[] = EVENTS.filter((event) => MATCH_SPECIAL_MOMENT_IDS.has(event.id));

/**
 * Segunda auditoría: 38 eventos de events.ts (vida familiar, vestuario,
 * entrenamiento, representante, dorsal, "Puma o Adidas"...) no los
 * llamaba ningún selector — contenido de "vida fuera del campo" que se
 * echaba en falta y llevaba escrito todo el tiempo. Se conectan aquí 25;
 * se dejan fuera a propósito los que chocarían con sistemas actuales:
 * los par-* antiguos (inventan resultados de partido fuera del
 * calendario), ent-primer-dia/ent-mister-pretemporada (ya cubiertos por
 * preseason-expanded.ts), vid-primer-coche (ya hay evento de coche en
 * page.tsx), vid-nueva-relacion (la saga de pareja ya tiene su propio
 * inicio), vid-paparazzi-cita (duplica pre-paparazzi), vid-diego-reaparece
 * (depende de otro evento previo), rep-primera-oferta (el representante
 * ya se elige al empezar) y pat-bota-firma (ya está en sponsorships.ts).
 */
const LEGACY_LIFE_EVENT_IDS = new Set([
  "ent-sesion-extra", "ent-lesion-susto", "ent-video-analisis", "ent-descanso",
  "ves-novato", "ves-capitan", "ves-conflicto", "ves-cena-equipo", "ves-nuevo-fichaje",
  "rep-comision", "rep-oferta-fichaje", "rep-patrocinio", "rep-consejo",
  "rep-patrocinio-marca", "rep-inversion-startup",
  "vid-familia", "vid-amigos-infancia", "vid-presion-familiar", "vid-dorsal-homenaje",
  "vid-aceptar-la-realidad", "vid-hermano-pequeno", "vid-llamada-madre",
  "vid-fiesta-familia", "vid-charla-entrenador", "vid-compañeros-colegio",
  // Salseo cotidiano: el míster te habla, vestuario, familia.
  "ent-bronca-tarde", "ent-elogio-publico", "ent-cambio-posicion", "ent-grada-sin-avisar",
  "ent-concentracion-hotel", "ves-cumple-sorpresa", "ves-masajista-cotilla", "ves-companero-cobra-mas",
  "ves-himno-equipo", "vid-entradas-primos", "vid-ex-escribe", "esp-utillero-leyenda",
  "vid-cunado-negocio", "vid-cunado-tactico", "vid-cunado-agente",
]);
/** Escenas que solo tienen sentido al empezar (colegio, novato, primer contrato, dorsal). */
const LEGACY_EARLY_ONLY_IDS = new Set([
  "ves-novato", "vid-compañeros-colegio", "vid-fiesta-familia", "vid-dorsal-homenaje",
  "vid-amigos-infancia", "vid-hermano-pequeno",
]);
const LEGACY_LIFE_EVENTS: GameEvent[] = EVENTS.filter((event) => LEGACY_LIFE_EVENT_IDS.has(event.id));

function pickLegacyLifeEvent(player: Player, usedEventIds: string[]): GameEvent | null {
  const eligible = LEGACY_LIFE_EVENTS.filter(
    (event) =>
      (event.minWeek ?? 1) <= player.week &&
      (!LEGACY_EARLY_ONLY_IDS.has(event.id) || player.week <= 60) &&
      (!event.requiresFlag || Boolean(player.flags?.[event.requiresFlag])) &&
      (event.minMedia === undefined || player.media >= event.minMedia) &&
      (event.maxMedia === undefined || player.media <= event.maxMedia) &&
      (!event.modes || event.modes.includes(player.mode)) &&
      !usedEventIds.includes(event.id),
  );
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Estos eventos se devuelven con un id "matchday-special-*" (para que la
 * semana avance como en cualquier partido resuelto), así que el id
 * original NUNCA llega a career_events y usedEventIds no sirve para saber
 * si ya salieron — sin un registro propio, el mismo penalti "en el último
 * minuto" podía repetirse en cada partido. Se anota en un flag.
 */
function pickMatchSpecialMoment(player: Player, usedEventIds: string[]): GameEvent | null {
  const usedSpecial = String(player.flags?.match_special_used ?? "").split(",");
  const eligible = MATCH_SPECIAL_MOMENTS.filter(
    (event) =>
      (event.minWeek ?? 1) <= player.week &&
      (!event.requiresFlag || Boolean(player.flags?.[event.requiresFlag])) &&
      (event.minMedia === undefined || player.media >= event.minMedia) &&
      (event.maxMedia === undefined || player.media <= event.maxMedia) &&
      !usedSpecial.includes(event.id) &&
      isEventCoherentWithClub(event.id === "par-etiqueta-fichaje-caro" ? "esp-fichaje-caro-presion" : event.id, player) &&
      !usedEventIds.includes(event.id),
  );
  if (eligible.length === 0) return null;
  const chosen = eligible[Math.floor(Math.random() * eligible.length)];
  if (!player.flags) player.flags = {};
  player.flags.match_special_used = [...usedSpecial.filter(Boolean), chosen.id].join(",");
  return chosen;
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
- Nivel de lo que está en juego: ${match.stakes === "decisivo" ? "DECISIVO — de este partido depende algo grande de la temporada (liderato, ronda avanzada, fase europea de máximo nivel)." : match.stakes === "importante" ? "IMPORTANTE — no es una jornada cualquiera." : "Rutina de temporada, sin presión especial más allá de sumar puntos."}

TU SITUACIÓN ACTUAL:
- Jugador: ${player.last_name}, ${age} años
- Media: ${player.media}/100
- Forma física: ${player.forma}/100
- Moral/ánimo: ${player.moral}/100
- Relación entrenador: ${player.rel_entrenador}/100

PERSONAJES FIJOS (si mencionas a alguien de tu entorno, usa estos nombres y apellidos exactos):
${describeCast(player)}

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
  "Un compañero te deja un balón de tacón en plena área pequeña.",
  "El portero rival sale mal y te queda la portería medio vacía desde fuera del área.",
  "Recibes en carrera por banda, con el lateral rival ya tarde para cubrirte.",
  "Un rebote en el larguero te cae de nuevo a los pies, con todo el mundo caído.",
  "Recibes un pase al hueco entre el lateral y el central, con solo el portero por delante.",
  "El balón te llega botando en el área, en un ángulo incómodo para rematar.",
  "Te quedas mano a mano con el central que te marca, dentro del área pequeña.",
];

const MIDFIELDER_DECISION_SITUATIONS = [
  "Recibes entre líneas con el área rival a un pase de distancia.",
  "Ves un hueco para filtrar el balón a tu delantero, si el pase sale bien.",
  "Robas el balón en el centro del campo con espacio para lanzar la contra.",
  "El rival te presiona en salida de balón, pegado a tu área.",
  "Te llega un balón dividido justo en la frontal del área.",
  "Un córner a favor te deja solo en el borde del área para rematar de primeras.",
  "El equipo pide un cambio de ritmo y tú tienes el balón para decidirlo.",
  "Recibes de espaldas con dos rivales cerrándote las dos únicas líneas de pase.",
  "Ves a tu lateral desmarcado por banda, pero el pase tiene que ser perfecto.",
  "Recibes un balón suelto tras un rechace, a 25 metros de la portería rival.",
  "El equipo lleva minutos sin ocasión y tú tienes que inventar algo desde el centro.",
  "Ganas un balón dividido en el círculo central con el partido apretado.",
];

const DEFENDER_DECISION_SITUATIONS = [
  "El extremo rival te encara en velocidad, uno contra uno, cerca de tu área.",
  "Un balón dividido cae entre tú y el delantero rival dentro del área.",
  "El equipo rival sale a la contra y solo tú puedes evitarlo.",
  "Ganan un balón por alto en el área y el rechace te queda a ti, con un rival encima.",
  "Es el último minuto: un centro peligroso cruza tu área con dos rivales al acecho.",
  "El delantero rival se prepara para rematar un penalti y tú eres el capitán en el campo.",
  "Un compañero pierde el balón en salida y el rival encara tu área con ventaja numérica.",
  "Te llega un balón suelto en tu propia área, con el portero adelantado y fuera de posición.",
  "El árbitro deja seguir una jugada dudosa y el rival avanza hacia tu área.",
  "Un rival se planta en el área pequeña tras un pase filtrado que nadie cortó.",
  "El extremo rival centra desde la línea de fondo con varios compañeros esperando el remate.",
  "Recibes bajo presión en tu propia área, con dos rivales cerrándote las salidas.",
];

const GOALKEEPER_DECISION_SITUATIONS = [
  "Un delantero rival se planta solo ante ti tras un error de tu defensa.",
  "Un disparo lejano viene ajustado a la escuadra, casi sin tiempo de reacción.",
  "Pitan un penalti a favor del rival en un momento clave del partido.",
  "Un centro raso cruza tu área pequeña con dos rivales al acecho.",
  "Sale un balón dividido fuera del área y un rival llega primero a por él.",
  "Un córner cerrado al primer palo te obliga a decidir en una décima de segundo.",
  "Un rechace de tu propio compañero te deja el balón suelto dentro del área pequeña.",
  "El rival remata de volea desde la frontal, sin apenas ángulo de reacción para ti.",
  "Un rival se queda solo tras un rechace en el área pequeña, con la portería medio vacía.",
  "El balón te llega con efecto en un centro cerrado, difícil de calcular.",
  "Quedan segundos de partido y un córner final pone toda tu área patas arriba.",
];

/**
 * Antes cada posición tenía exactamente UNA terna de opciones fija — la
 * escena (arriba) variaba, pero las tres decisiones en sí eran siempre
 * las mismas tres, partido tras partido (reportado en vivo: "las mismas
 * opciones siempre" en dos partidos de Liga distintos). Ahora cada
 * posición tiene varios conjuntos de opciones y se elige uno al azar,
 * independiente de qué escena tocó — mismo mecanismo `resolve` y mismo
 * vocabulario de resultados que ya lee generateMatchDayEvent (save/
 * concede/penalty_conceded, clean_tackle/foul_committed/contained/beaten,
 * goal/assist/wondergoal/miss/miss_bad), solo cambia CÓMO se llega ahí.
 */
type DecisionFlagsFn = (outcome: string, style: string) => { [key: string]: string };

const GOALKEEPER_OPTION_SETS: ((flags: DecisionFlagsFn) => EventOption[])[] = [
  (flags) => [
    {
      id: "salir",
      label: "Salir a cerrar el ángulo",
      subtitle: "Agresivo: o paras el gol o dejas la portería vacía",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Achicas el ángulo a la perfección — el rival no tiene hueco. ¡Paradón!", consequences: { fama: 2, flags: flags("save", "salida") } },
        fail: { text: "Sales, pero te la pica por encima. Gol rival.", consequences: { flags: flags("concede", "salida") } },
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
        success: { text: "Te mantienes firme y sacas el disparo con una buena estirada.", consequences: { flags: flags("save", "linea") } },
        fail: { text: "El disparo pasa ajustado a tu palo. No llegas.", consequences: { flags: flags("concede", "linea") } },
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
        success: { text: "Sales a por todas y despejas el peligro con autoridad total.", consequences: { fama: 2, flags: flags("save", "puños") } },
        fail: { text: "Falla el cálculo: derribas al rival. El árbitro señala el punto de penalti.", consequences: { forma: -2, flags: flags("penalty_conceded", "puños") } },
      },
    },
  ],
  (flags) => [
    {
      id: "primer-palo",
      label: "Tirarte al primer palo, anticipando el remate cruzado",
      subtitle: "Apuestas por dónde va a chutar",
      consequences: {},
      resolve: {
        baseChance: 0.38,
        statModifier: "media",
        success: { text: "Lees la intención perfectamente y sacas el disparo con el cuerpo.", consequences: { fama: 2, flags: flags("save", "primer_palo") } },
        fail: { text: "Adivinas mal el lado — el disparo va al palo contrario. Gol.", consequences: { flags: flags("concede", "primer_palo") } },
      },
    },
    {
      id: "centrado",
      label: "Quedarte centrado, sin comprarte el amago",
      subtitle: "Paciencia: esperar a que decida el rival",
      consequences: {},
      resolve: {
        baseChance: 0.52,
        statModifier: "media",
        success: { text: "No te mueves antes de tiempo y reaccionas justo cuando dispara. Gran parada.", consequences: { flags: flags("save", "centrado") } },
        fail: { text: "El rival espera tu reacción y te la coloca por el otro lado.", consequences: { flags: flags("concede", "centrado") } },
      },
    },
    {
      id: "salida-desesperada",
      label: "Salir en estirada desesperada a cortar el centro",
      subtitle: "Todo o nada antes de que remate",
      consequences: {},
      resolve: {
        baseChance: 0.3,
        statModifier: "media",
        success: { text: "Llegas justo a tiempo y despejas el centro antes del remate. Salvada providencial.", consequences: { fama: 2, flags: flags("save", "salida_desesperada") } },
        fail: { text: "No llegas a tiempo y derribas al rival en la salida. Penalti señalado.", consequences: { forma: -2, flags: flags("penalty_conceded", "salida_desesperada") } },
      },
    },
  ],
  (flags) => [
    {
      id: "rechazar-corto",
      label: "Rechazar el balón lejos, sin arriesgar el control",
      subtitle: "Despejar como sea, sin dárselas de listo",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "Despejas con contundencia. El peligro queda lejos de tu portería.", consequences: { flags: flags("save", "rechazar_corto") } },
        fail: { text: "El rechace le cae de rebote a un rival que no perdona.", consequences: { flags: flags("concede", "rechazar_corto") } },
      },
    },
    {
      id: "jugar-corto",
      label: "Jugar corto con el central en vez de despejar",
      subtitle: "Confiar en tu equipo bajo presión",
      consequences: {},
      resolve: {
        baseChance: 0.45,
        statModifier: "media",
        success: { text: "El pase corto sale limpio y el equipo sube jugando desde atrás sin sobresaltos.", consequences: { flags: flags("save", "jugar_corto") } },
        fail: { text: "El rival presiona bien y te roba el pase. Ocasión clarísima en contra.", consequences: { flags: flags("concede", "jugar_corto") } },
      },
    },
    {
      id: "gritar-linea",
      label: "Gritar para adelantar la línea defensiva en vez de intervenir",
      subtitle: "Confiar en el fuera de juego",
      consequences: {},
      resolve: {
        baseChance: 0.34,
        statModifier: "media",
        success: { text: "La defensa sube a tiempo. Fuera de juego señalado, peligro anulado sin ni rozar el balón.", consequences: { flags: flags("save", "gritar_linea") } },
        fail: { text: "La línea no sube a tiempo: el rival queda solo y no perdona.", consequences: { flags: flags("concede", "gritar_linea") } },
      },
    },
  ],
  (flags) => [
    {
      id: "blocaje-seguro",
      label: "Blocar el balón contra el cuerpo, sin arriesgar el rechace",
      subtitle: "Seguridad ante todo, aunque pierdas tiempo de reacción",
      consequences: {},
      resolve: {
        baseChance: 0.58,
        statModifier: "media",
        success: { text: "El balón se queda pegado a tu cuerpo. Peligro totalmente controlado.", consequences: { flags: flags("save", "blocaje_seguro") } },
        fail: { text: "El balón se te escapa de las manos en el peor momento posible.", consequences: { flags: flags("concede", "blocaje_seguro") } },
      },
    },
    {
      id: "cortar-centro-aereo",
      label: "Salir a por el centro por alto antes de que remate nadie",
      subtitle: "Anticiparte al choque en el área",
      consequences: {},
      resolve: {
        baseChance: 0.36,
        statModifier: "media",
        success: { text: "Ganas la posición por arriba y despejas el peligro con autoridad.", consequences: { fama: 1, flags: flags("save", "cortar_centro_aereo") } },
        fail: { text: "No llegas al balón y un rival remata libre de marca.", consequences: { flags: flags("concede", "cortar_centro_aereo") } },
      },
    },
    {
      id: "achicar-poco-a-poco",
      label: "Achicar distancia poco a poco, sin comprometerte",
      subtitle: "Esperar al último instante para moverte",
      consequences: {},
      resolve: {
        baseChance: 0.46,
        statModifier: "media",
        success: { text: "Le robas tiempo y espacio hasta que el disparo sale débil y lo atajas sin problema.", consequences: { flags: flags("save", "achicar_poco_a_poco") } },
        fail: { text: "El rival dispara antes de lo esperado y te pilla a medio camino.", consequences: { flags: flags("concede", "achicar_poco_a_poco") } },
      },
    },
  ],
  (flags) => [
    {
      id: "farolillo",
      label: "Quedarte plantado, sin tirarte antes de tiempo",
      subtitle: "Paciencia total: que decida él primero",
      consequences: {},
      resolve: {
        baseChance: 0.42,
        statModifier: "media",
        success: { text: "No te compras el amague y reaccionas justo cuando dispara de verdad.", consequences: { flags: flags("save", "farolillo") } },
        fail: { text: "Esperas demasiado y el disparo te sorprende sin reacción.", consequences: { flags: flags("concede", "farolillo") } },
      },
    },
    {
      id: "reflejos-cerca",
      label: "Cerrar distancias al máximo antes del disparo",
      subtitle: "Reducir el ángulo aunque te la puedan picar",
      consequences: {},
      resolve: {
        baseChance: 0.44,
        statModifier: "media",
        success: { text: "Le tapas todo el ángulo posible. Al final dispara fuera, sin espacio.", consequences: { flags: flags("save", "reflejos_cerca") } },
        fail: { text: "Te la pica por encima con la portería casi vacía. Gol rival.", consequences: { flags: flags("concede", "reflejos_cerca") } },
      },
    },
    {
      id: "despeje-cualquier-forma",
      label: "Despejar como sea, sin importar la forma",
      subtitle: "Feo pero efectivo: sacar el peligro de en medio",
      consequences: {},
      resolve: {
        baseChance: 0.53,
        statModifier: "media",
        success: { text: "El despeje sale feo pero efectivo. El peligro queda completamente resuelto.", consequences: { flags: flags("save", "despeje_cualquier_forma") } },
        fail: { text: "El despeje sale mal y el balón le cae de nuevo a un rival solo.", consequences: { flags: flags("concede", "despeje_cualquier_forma") } },
      },
    },
  ],
  (flags) => [
    {
      id: "leer-trayectoria",
      label: "Leer la trayectoria y colocarte antes del disparo",
      subtitle: "Todo depende de acertar la posición",
      consequences: {},
      resolve: {
        baseChance: 0.48,
        statModifier: "media",
        success: { text: "Te colocas exactamente donde tenía que ir el balón. Parada cómoda.", consequences: { flags: flags("save", "leer_trayectoria") } },
        fail: { text: "Te colocas mal y el disparo va justo al lado contrario.", consequences: { flags: flags("concede", "leer_trayectoria") } },
      },
    },
    {
      id: "gritar-cambio-marca",
      label: "Gritar el cambio de marca en vez de intervenir tú",
      subtitle: "Confiar en que un compañero llegue antes",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Tu grito llega a tiempo: un compañero corta el peligro antes de que llegue a ti.", consequences: { flags: flags("save", "gritar_cambio_marca") } },
        fail: { text: "Nadie reacciona a tiempo y el rival remata sin oposición.", consequences: { flags: flags("concede", "gritar_cambio_marca") } },
      },
    },
    {
      id: "reves-instintivo",
      label: "Reaccionar de puro instinto, sin pensarlo",
      subtitle: "Todo o nada: fiarlo todo a los reflejos",
      consequences: {},
      resolve: {
        baseChance: 0.36,
        statModifier: "media",
        success: { text: "El instinto te sale perfecto: una parada felina que nadie esperaba.", consequences: { fama: 2, flags: flags("save", "reves_instintivo") } },
        fail: { text: "El instinto falla esta vez y el balón se cuela sin que puedas hacer nada.", consequences: { flags: flags("concede", "reves_instintivo") } },
      },
    },
  ],
  (flags) => [
    {
      id: "cortar-pase-clave",
      label: "Adelantarte varios metros para cortar el pase clave",
      subtitle: "Salir de tu área, arriesgando quedarte sin portería",
      consequences: {},
      resolve: {
        baseChance: 0.34,
        statModifier: "media",
        success: { text: "Llegas primero al balón, lejos de tu portería. Peligro cortado de raíz.", consequences: { fama: 2, flags: flags("save", "cortar_pase_clave") } },
        fail: { text: "No llegas a tiempo y dejas la portería completamente vacía.", consequences: { flags: flags("concede", "cortar_pase_clave") } },
      },
    },
    {
      id: "cuerpo-a-tierra",
      label: "Tirarte a bloquear el balón raso, cuerpo a tierra",
      subtitle: "Sacrificio total para no dejar rechace",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "Te tiras al suelo y bloqueas el disparo raso sin dejar ningún rechace peligroso.", consequences: { flags: flags("save", "cuerpo_a_tierra") } },
        fail: { text: "El balón se te escapa entre las piernas. Gol evitable.", consequences: { flags: flags("concede", "cuerpo_a_tierra") } },
      },
    },
  ],
  (flags) => [
    {
      id: "calma-bajo-presion",
      label: "Mantener la calma y esperar el remate sin precipitarte",
      subtitle: "Confiar en tus reflejos hasta el último instante",
      consequences: {},
      resolve: {
        baseChance: 0.47,
        statModifier: "media",
        success: { text: "Tu calma se nota: reaccionas justo cuando remata, sin haberte movido antes de tiempo.", consequences: { flags: flags("save", "calma_bajo_presion") } },
        fail: { text: "Esperas demasiado y el disparo te sorprende sin reacción posible.", consequences: { flags: flags("concede", "calma_bajo_presion") } },
      },
    },
    {
      id: "juego-de-pies",
      label: "Resolver con los pies en vez de con las manos",
      subtitle: "Arriesgado, pero evita el rechace suelto",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Despejas con los pies con más precisión de la esperada. Peligro resuelto sin rechace.", consequences: { fama: 1, flags: flags("save", "juego_de_pies") } },
        fail: { text: "El control con los pies te sale mal y regalas el balón al rival dentro del área.", consequences: { flags: flags("concede", "juego_de_pies") } },
      },
    },
  ],
];

const DEFENDER_OPTION_SETS: ((flags: DecisionFlagsFn) => EventOption[])[] = [
  (flags) => [
    {
      id: "entrada",
      label: "Entrar fuerte al balón",
      subtitle: "Alto riesgo de falta, pero robo limpio si sale bien",
      consequences: {},
      resolve: {
        baseChance: 0.42,
        statModifier: "media",
        success: { text: "Entrada perfecta: te llevas el balón limpio y cortas el peligro de raíz.", consequences: { fama: 1, flags: flags("clean_tackle", "entrada") } },
        fail: { text: "Llegas tarde. El árbitro no duda: falta y tarjeta.", consequences: { forma: -2, flags: flags("foul_committed", "entrada") } },
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
        success: { text: "Le quitas los espacios con paciencia hasta que pierde el balón por su cuenta.", consequences: { flags: flags("contained", "contener") } },
        fail: { text: "Te desborda igualmente. El peligro sigue vivo.", consequences: { flags: flags("beaten", "contener") } },
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
        success: { text: "Lees la jugada a la perfección y te llevas el balón antes de que nadie lo espere.", consequences: { fama: 2, flags: flags("clean_tackle", "anticipar") } },
        fail: { text: "Fallas el cálculo y te quedas completamente fuera de la jugada.", consequences: { forma: -2, flags: flags("beaten", "anticipar") } },
      },
    },
  ],
  (flags) => [
    {
      id: "cabezazo",
      label: "Despejar de cabeza como sea, sin filigranas",
      subtitle: "Simplicidad ante todo: fuera de tu área",
      consequences: {},
      resolve: {
        baseChance: 0.6,
        statModifier: "media",
        success: { text: "Despejas con contundencia. Balón lejos de tu portería, peligro cortado.", consequences: { flags: flags("clean_tackle", "cabezazo") } },
        fail: { text: "El despeje sale mal calculado y el balón le cae de nuevo al rival dentro del área.", consequences: { flags: flags("beaten", "cabezazo") } },
      },
    },
    {
      id: "cortar-pase",
      label: "Cortar la línea de pase antes de que llegue el balón",
      subtitle: "Anticiparte a la jugada, no al rival",
      consequences: {},
      resolve: {
        baseChance: 0.45,
        statModifier: "media",
        success: { text: "Interceptas el pase justo a tiempo. Ni siquiera necesitas entrar al choque.", consequences: { fama: 1, flags: flags("clean_tackle", "cortar_pase") } },
        fail: { text: "Calculas mal la trayectoria y el balón pasa por delante de ti.", consequences: { flags: flags("beaten", "cortar_pase") } },
      },
    },
    {
      id: "carga",
      label: "Cargar con el hombro dentro del reglamento",
      subtitle: "Físico, al límite de la falta",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "La carga es limpia y reglamentaria: el rival pierde el equilibrio y el balón.", consequences: { flags: flags("clean_tackle", "carga") } },
        fail: { text: "El árbitro interpreta que te pasas de fuerte. Falta señalada.", consequences: { forma: -1, flags: flags("foul_committed", "carga") } },
      },
    },
  ],
  (flags) => [
    {
      id: "marcaje-hombre",
      label: "Pegarte al rival al hombre, sin dejarle un centímetro",
      subtitle: "Marcaje estrecho, riesgo de que te gane la espalda",
      consequences: {},
      resolve: {
        baseChance: 0.44,
        statModifier: "media",
        success: { text: "No le dejas ni girarse. Robas el balón pegado a su cuerpo.", consequences: { flags: flags("clean_tackle", "marcaje_hombre") } },
        fail: { text: "Te gana la espalda con un cambio de ritmo y te deja completamente atrás.", consequences: { forma: -1, flags: flags("beaten", "marcaje_hombre") } },
      },
    },
    {
      id: "cubrir-espacio",
      label: "Cubrir el espacio en vez de marcar al jugador",
      subtitle: "Prioridad: que no llegue el balón, no el hombre",
      consequences: {},
      resolve: {
        baseChance: 0.56,
        statModifier: "media",
        success: { text: "Tapas la línea de pase y el rival no encuentra ningún hueco.", consequences: { flags: flags("contained", "cubrir_espacio") } },
        fail: { text: "El rival encuentra el hueco que dejaste libre. Peligro real.", consequences: { flags: flags("beaten", "cubrir_espacio") } },
      },
    },
    {
      id: "salir-jugando",
      label: "Salir jugando desde atrás en vez de despejar",
      subtitle: "Arriesgar con el balón en tu propia área",
      consequences: {},
      resolve: {
        baseChance: 0.35,
        statModifier: "media",
        success: { text: "El pase sale limpio bajo presión y tu equipo sale jugando con ventaja.", consequences: { fama: 1, flags: flags("contained", "salir_jugando") } },
        fail: { text: "Te presionan y pierdes el balón en tu propia área. Ocasión clarísima en contra.", consequences: { forma: -2, flags: flags("beaten", "salir_jugando") } },
      },
    },
  ],
  (flags) => [
    {
      id: "barrida",
      label: "Ir a la barrida como último recurso",
      subtitle: "Todo o nada: o robas limpio o dejas al rival solo",
      consequences: {},
      resolve: {
        baseChance: 0.33,
        statModifier: "media",
        success: { text: "La barrida sale perfecta: te llevas solo el balón, ni rozas al rival.", consequences: { fama: 1, flags: flags("clean_tackle", "barrida") } },
        fail: { text: "Llegas tarde a la barrida y el árbitro no duda: tarjeta y falta peligrosa.", consequences: { forma: -2, flags: flags("foul_committed", "barrida") } },
      },
    },
    {
      id: "retrasar-linea",
      label: "Retrasar tu posición para no dejar espacio a la espalda",
      subtitle: "Priorizar la cobertura sobre el robo inmediato",
      consequences: {},
      resolve: {
        baseChance: 0.6,
        statModifier: "media",
        success: { text: "Cierras bien el espacio y el rival no encuentra ningún hueco para progresar.", consequences: { flags: flags("contained", "retrasar_linea") } },
        fail: { text: "El rival aprovecha igualmente el hueco y te supera con un pase entre líneas.", consequences: { flags: flags("beaten", "retrasar_linea") } },
      },
    },
    {
      id: "achique-lateral",
      label: "Achicar por fuera, obligándole a ir hacia dentro",
      subtitle: "Dirigir la jugada hacia donde tienes ayuda",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "Le cierras la banda y un compañero le roba el balón nada más entrar hacia dentro.", consequences: { flags: flags("clean_tackle", "achique_lateral") } },
        fail: { text: "Se va por dentro con más facilidad de la esperada y genera peligro real.", consequences: { flags: flags("beaten", "achique_lateral") } },
      },
    },
  ],
  (flags) => [
    {
      id: "doblar-marca",
      label: "Pedir ayuda y doblar la marca entre dos",
      subtitle: "No ir solo: cerrarle todas las salidas",
      consequences: {},
      resolve: {
        baseChance: 0.55,
        statModifier: "media",
        success: { text: "Entre los dos no le dejáis ni un hueco. Pierde el balón sin remedio.", consequences: { flags: flags("clean_tackle", "doblar_marca") } },
        fail: { text: "Se revuelve entre los dos y sale limpio de la doble marca.", consequences: { flags: flags("beaten", "doblar_marca") } },
      },
    },
    {
      id: "despejar-como-sea",
      label: "Despejar como sea, sin pensarlo dos veces",
      subtitle: "Prioridad absoluta: sacar el balón de tu área",
      consequences: {},
      resolve: {
        baseChance: 0.62,
        statModifier: "media",
        success: { text: "Despejas con contundencia. El peligro queda completamente resuelto.", consequences: { flags: flags("clean_tackle", "despejar_como_sea") } },
        fail: { text: "El despeje sale mal calculado y el balón le cae de nuevo a un rival.", consequences: { flags: flags("beaten", "despejar_como_sea") } },
      },
    },
    {
      id: "leer-intencion",
      label: "Leer la intención del pase antes de que salga",
      subtitle: "Anticiparte al pase, no al balón",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Lees la jugada perfectamente y cortas el pase antes de que llegue a nadie.", consequences: { fama: 1, flags: flags("clean_tackle", "leer_intencion") } },
        fail: { text: "Te adelantas mal y dejas un hueco enorme a tu espalda.", consequences: { forma: -1, flags: flags("beaten", "leer_intencion") } },
      },
    },
  ],
  (flags) => [
    {
      id: "empujon-reglamentario",
      label: "Usar el cuerpo para sacarlo de la jugada, sin pasarte",
      subtitle: "Físico dentro del límite del reglamento",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "El cuerpo a cuerpo es limpio: el rival pierde el equilibrio y el balón.", consequences: { flags: flags("clean_tackle", "empujon_reglamentario") } },
        fail: { text: "El árbitro interpreta que ha sido empujón. Falta señalada.", consequences: { forma: -1, flags: flags("foul_committed", "empujon_reglamentario") } },
      },
    },
    {
      id: "esperar-error",
      label: "No entrar, esperar a que el rival se equivoque solo",
      subtitle: "Paciencia total, cero riesgo de falta",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "El rival se precipita y pierde el balón él solo, sin que hayas arriesgado nada.", consequences: { flags: flags("contained", "esperar_error") } },
        fail: { text: "El rival no se precipita y te supera con calma, sin ni un roce.", consequences: { flags: flags("beaten", "esperar_error") } },
      },
    },
    {
      id: "salida-rapida",
      label: "Salir rápido de tu posición a cortar antes de que controle",
      subtitle: "Anticiparte al control, no al disparo",
      consequences: {},
      resolve: {
        baseChance: 0.37,
        statModifier: "media",
        success: { text: "Llegas antes de que controle y te llevas el balón limpio.", consequences: { fama: 1, flags: flags("clean_tackle", "salida_rapida") } },
        fail: { text: "Calculas mal el tiempo y le dejas controlar con ventaja.", consequences: { flags: flags("beaten", "salida_rapida") } },
      },
    },
  ],
  (flags) => [
    {
      id: "recorte-propio",
      label: "Salir jugando con un recorte antes de que te presionen",
      subtitle: "Arriesgar en tu propio campo para romper líneas",
      consequences: {},
      resolve: {
        baseChance: 0.33,
        statModifier: "media",
        success: { text: "El recorte deja a dos rivales atrás y tu equipo sale jugando con ventaja.", consequences: { fama: 1, flags: flags("contained", "recorte_propio") } },
        fail: { text: "Te presionan y pierdes el balón en tu propio campo. Ocasión clara en contra.", consequences: { forma: -2, flags: flags("beaten", "recorte_propio") } },
      },
    },
    {
      id: "sacrificio-cuerpo",
      label: "Meter el cuerpo al disparo, sacrificándote",
      subtitle: "Bloquear como sea, cueste lo que cueste",
      consequences: {},
      resolve: {
        baseChance: 0.55,
        statModifier: "media",
        success: { text: "Bloqueas el disparo con el cuerpo. Duele, pero el peligro queda resuelto.", consequences: { flags: flags("clean_tackle", "sacrificio_cuerpo") } },
        fail: { text: "El bloqueo sale mal y el balón se desvía justo hacia la portería.", consequences: { flags: flags("beaten", "sacrificio_cuerpo") } },
      },
    },
  ],
  (flags) => [
    {
      id: "vigilar-espalda",
      label: "Quedarte atrás vigilando el espacio a tu espalda",
      subtitle: "Prioridad: no dejar que te ganen la posición",
      consequences: {},
      resolve: {
        baseChance: 0.52,
        statModifier: "media",
        success: { text: "No te ganan la espalda en ningún momento. Peligro controlado sin sobresaltos.", consequences: { flags: flags("contained", "vigilar_espalda") } },
        fail: { text: "Te ganan la posición justo cuando bajas la guardia. Ocasión clara en contra.", consequences: { flags: flags("beaten", "vigilar_espalda") } },
      },
    },
    {
      id: "salto-anticipado",
      label: "Saltar antes de tiempo para ganar el primer cabezazo",
      subtitle: "Todo o nada en el juego aéreo",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Ganas el salto con claridad y despejas el peligro de cabeza.", consequences: { fama: 1, flags: flags("clean_tackle", "salto_anticipado") } },
        fail: { text: "Saltas antes de tiempo y el rival te gana la posición en el aire.", consequences: { flags: flags("beaten", "salto_anticipado") } },
      },
    },
  ],
];

const MIDFIELDER_OPTION_SETS: ((flags: DecisionFlagsFn) => EventOption[])[] = [
  (flags) => [
    {
      id: "disparo",
      label: "Probar el disparo lejano",
      subtitle: "Vas a por el gol directo desde fuera del área",
      consequences: {},
      resolve: {
        baseChance: 0.32,
        statModifier: "media",
        success: { text: "El balón se cuela pegado a la escuadra. ¡Golazo desde fuera del área!", consequences: { fama: 2, flags: flags("goal", "disparo") } },
        fail: { text: "El disparo se marcha alto, por encima del larguero.", consequences: { flags: flags("miss", "disparo") } },
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
        success: { text: "El pase es perfecto: tu compañero no perdona.", consequences: { flags: flags("assist", "pase") } },
        fail: { text: "El pase se queda corto y el rival despeja el peligro.", consequences: { flags: flags("miss", "pase") } },
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
        success: { text: "Proteges el balón con inteligencia y das tiempo a que el equipo suba.", consequences: { flags: flags("contained", "proteger") } },
        fail: { text: "Te presionan entre dos rivales y pierdes el balón en una zona comprometida.", consequences: { forma: -1, flags: flags("beaten", "proteger") } },
      },
    },
  ],
  (flags) => [
    {
      id: "cambio-orientacion",
      label: "Cambiar la orientación del juego al otro costado",
      subtitle: "Paciencia: mover el balón, no el riesgo",
      consequences: {},
      resolve: {
        baseChance: 0.68,
        statModifier: "media",
        success: { text: "El cambio de orientación pilla desubicado al rival y abre space por el otro lado.", consequences: { flags: flags("contained", "cambio_orientacion") } },
        fail: { text: "El pase largo se va directo al rival: pérdida de balón peligrosa.", consequences: { forma: -1, flags: flags("beaten", "cambio_orientacion") } },
      },
    },
    {
      id: "conduccion",
      label: "Encarar en conducción vertical hacia el área",
      subtitle: "Ir tú mismo, todo o nada",
      consequences: {},
      resolve: {
        baseChance: 0.36,
        statModifier: "media",
        success: { text: "Encaras a los centrales, aguantas el equilibrio y bates al portero desde la frontal.", consequences: { fama: 2, flags: flags("goal", "conduccion") } },
        fail: { text: "Te cierran bien los espacios y pierdes el balón en la conducción.", consequences: { flags: flags("miss", "conduccion") } },
      },
    },
    {
      id: "pase-espacio",
      label: "Buscar el pase al espacio entre líneas",
      subtitle: "Pase de riesgo con mucha recompensa",
      consequences: {},
      resolve: {
        baseChance: 0.48,
        statModifier: "media",
        success: { text: "El balón pasa entre dos rivales justo a la carrera de tu compañero. Asistencia de manual.", consequences: { flags: flags("assist", "pase_espacio") } },
        fail: { text: "El pase se intercepta antes de llegar a su destino.", consequences: { flags: flags("miss", "pase_espacio") } },
      },
    },
  ],
  (flags) => [
    {
      id: "regate-central",
      label: "Intentar el regate corto en el centro del campo",
      subtitle: "Romper líneas tú mismo, riesgo de pérdida",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "El regate sale limpio y dejas a dos rivales atrás en la misma jugada.", consequences: { fama: 1, flags: flags("contained", "regate_central") } },
        fail: { text: "Te roban el balón en zona peligrosa y el rival sale a la contra.", consequences: { forma: -1, flags: flags("beaten", "regate_central") } },
      },
    },
    {
      id: "pase-muerte",
      label: "Buscar el pase de la muerte al área",
      subtitle: "Todo o nada por la asistencia",
      consequences: {},
      resolve: {
        baseChance: 0.42,
        statModifier: "media",
        success: { text: "El pase raso cruza el área y tu compañero solo tiene que empujarla. Asistencia clara.", consequences: { flags: flags("assist", "pase_muerte") } },
        fail: { text: "El pase se marcha directo a un defensa rival. Jugada cortada.", consequences: { flags: flags("miss", "pase_muerte") } },
      },
    },
    {
      id: "temporizar",
      label: "Temporizar y esperar a que suban tus compañeros",
      subtitle: "Sin riesgo: no perder la posesión",
      consequences: {},
      resolve: {
        baseChance: 0.68,
        statModifier: "media",
        success: { text: "Manejas los tiempos con calma y el equipo se reorganiza en ataque.", consequences: { flags: flags("contained", "temporizar") } },
        fail: { text: "El rival te presiona entre varios y pierdes el balón sin ni siquiera intentarlo.", consequences: { forma: -1, flags: flags("beaten", "temporizar") } },
      },
    },
  ],
  (flags) => [
    {
      id: "un-dos",
      label: "Buscar el uno-dos con el delantero",
      subtitle: "Pared rápida para entrar solo al área",
      consequences: {},
      resolve: {
        baseChance: 0.38,
        statModifier: "media",
        success: { text: "La pared sale perfecta: entras solo al área y defines con calma. ¡Gol!", consequences: { fama: 2, flags: flags("goal", "un_dos") } },
        fail: { text: "El rival lee la pared y corta la jugada antes de que se complete.", consequences: { flags: flags("miss", "un_dos") } },
      },
    },
    {
      id: "disparo-cruzado",
      label: "Buscar el disparo cruzado desde la media distancia",
      subtitle: "Sorprender antes de que se cierre el hueco",
      consequences: {},
      resolve: {
        baseChance: 0.3,
        statModifier: "media",
        success: { text: "El disparo cruzado se cuela lejos del alcance del portero. ¡Golazo!", consequences: { fama: 2, flags: flags("goal", "disparo_cruzado") } },
        fail: { text: "El disparo se marcha fuera, lejos del marco.", consequences: { flags: flags("miss", "disparo_cruzado") } },
      },
    },
    {
      id: "recular",
      label: "Recular con el balón controlado, sin forzar nada",
      subtitle: "Renunciar al riesgo, mantener el orden",
      consequences: {},
      resolve: {
        baseChance: 0.72,
        statModifier: "media",
        success: { text: "Manejas el balón con calma y das tiempo a que el equipo se reorganice sin sobresaltos.", consequences: { flags: flags("contained", "recular") } },
        fail: { text: "Dudas demasiado y el rival te quita el balón sin apenas esfuerzo.", consequences: { forma: -1, flags: flags("beaten", "recular") } },
      },
    },
  ],
  (flags) => [
    {
      id: "pase-largo-diagonal",
      label: "Buscar el pase largo en diagonal al espacio",
      subtitle: "Cambio de ritmo repentino, todo o nada",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "El pase llega perfecto al espacio: tu compañero se planta solo ante el portero.", consequences: { flags: flags("assist", "pase_largo_diagonal") } },
        fail: { text: "El pase se pasa de largo y termina en fuera de banda.", consequences: { flags: flags("miss", "pase_largo_diagonal") } },
      },
    },
    {
      id: "doble-contacto",
      label: "Amagar con el cuerpo y salir por el otro lado",
      subtitle: "Ganarte el espacio con un solo gesto",
      consequences: {},
      resolve: {
        baseChance: 0.35,
        statModifier: "media",
        success: { text: "El amago deja sentado al defensa. Espacio libre para definir. ¡Gol!", consequences: { fama: 2, flags: flags("goal", "doble_contacto") } },
        fail: { text: "El defensa no se la compra y te cierra el hueco a tiempo.", consequences: { flags: flags("miss", "doble_contacto") } },
      },
    },
    {
      id: "bajar-a-recibir",
      label: "Bajar a recibir de espaldas para conectar con el equipo",
      subtitle: "Sacrificar posición por sumar al juego colectivo",
      consequences: {},
      resolve: {
        baseChance: 0.66,
        statModifier: "media",
        success: { text: "Enlazas el juego con sencillez y das tiempo a que el equipo suba en bloque.", consequences: { flags: flags("contained", "bajar_a_recibir") } },
        fail: { text: "Te presionan nada más recibir y pierdes el balón de espaldas a portería.", consequences: { forma: -1, flags: flags("beaten", "bajar_a_recibir") } },
      },
    },
  ],
  (flags) => [
    {
      id: "doble-paso",
      label: "Doble paso para ganar la línea de fondo",
      subtitle: "Ir directo a por el fondo, sin mirar atrás",
      consequences: {},
      resolve: {
        baseChance: 0.44,
        statModifier: "media",
        success: { text: "Ganas la línea de fondo con un doble paso limpio y centras al corazón del área.", consequences: { flags: flags("assist", "doble_paso") } },
        fail: { text: "El lateral rival te corta antes de llegar a la línea de fondo.", consequences: { flags: flags("miss", "doble_paso") } },
      },
    },
    {
      id: "disparo-primer-toque",
      label: "Disparar de primer toque, sin controlar antes",
      subtitle: "No dar tiempo a que se cierre el defensa",
      consequences: {},
      resolve: {
        baseChance: 0.3,
        statModifier: "media",
        success: { text: "El disparo de primeras sorprende a todos, portero incluido. ¡Gol!", consequences: { fama: 2, flags: flags("goal", "disparo_primer_toque") } },
        fail: { text: "El disparo sale descontrolado, muy desviado.", consequences: { flags: flags("miss", "disparo_primer_toque") } },
      },
    },
    {
      id: "buscar-penalti",
      label: "Encarar buscando el contacto dentro del área",
      subtitle: "Arriesgar la caída para forzar el penalti",
      consequences: {},
      resolve: {
        baseChance: 0.32,
        statModifier: "media",
        success: { text: "El contacto es claro y el árbitro no duda: penalti a tu favor.", consequences: { fama: 1, flags: flags("assist", "buscar_penalti") } },
        fail: { text: "El árbitro no ve nada claro y sigue el juego. Ocasión perdida.", consequences: { flags: flags("miss", "buscar_penalti") } },
      },
    },
  ],
  (flags) => [
    {
      id: "pase-diagonal-corto",
      label: "Buscar el triángulo corto con el interior",
      subtitle: "Paciencia: progresar metro a metro",
      consequences: {},
      resolve: {
        baseChance: 0.6,
        statModifier: "media",
        success: { text: "El triángulo funciona a la perfección y el equipo avanza con el balón controlado.", consequences: { flags: flags("contained", "pase_diagonal_corto") } },
        fail: { text: "El rival lee el triángulo y corta el pase antes de completarlo.", consequences: { flags: flags("beaten", "pase_diagonal_corto") } },
      },
    },
    {
      id: "disparo-parabola",
      label: "Probar el globo por encima del portero adelantado",
      subtitle: "Sorprender con la parábola exacta",
      consequences: {},
      resolve: {
        baseChance: 0.26,
        statModifier: "media",
        success: { text: "La parábola cae justo bajo el larguero. El portero solo puede mirar. ¡Golazo!", consequences: { fama: 3, flags: flags("wondergoal", "disparo_parabola") } },
        fail: { text: "El globo se pasa de largo y sale por encima del larguero.", consequences: { flags: flags("miss_bad", "disparo_parabola") } },
      },
    },
  ],
  (flags) => [
    {
      id: "cambio-frente-largo",
      label: "Buscar el cambio de frente con un pase largo",
      subtitle: "Sorprender al rival atacando por el otro lado",
      consequences: {},
      resolve: {
        baseChance: 0.46,
        statModifier: "media",
        success: { text: "El cambio de frente pilla mal colocado al rival y genera peligro inmediato.", consequences: { flags: flags("assist", "cambio_frente_largo") } },
        fail: { text: "El pase se va largo y termina directamente en fuera de banda.", consequences: { flags: flags("miss", "cambio_frente_largo") } },
      },
    },
    {
      id: "faltar-al-choque",
      label: "Entrar al choque con decisión para recuperar el balón",
      subtitle: "Físico, sin miedo a la tarjeta",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Ganas el choque con contundencia y te llevas el balón limpio.", consequences: { flags: flags("clean_tackle", "faltar_al_choque") } },
        fail: { text: "El árbitro interpreta que ha sido falta. Amarilla para ti.", consequences: { forma: -1, flags: flags("foul_committed", "faltar_al_choque") } },
      },
    },
  ],
];

const ATTACKER_OPTION_SETS: ((flags: DecisionFlagsFn) => EventOption[])[] = [
  (flags) => [
    {
      id: "disparo",
      label: "Disparar a puerta",
      subtitle: "Vas a por el gol directo",
      consequences: {},
      resolve: {
        baseChance: 0.42,
        statModifier: "media",
        success: { text: "El balón entra pegado al palo. ¡Gol!", consequences: { flags: flags("goal", "disparo") } },
        fail: { text: "El portero saca una mano providencial. No hay gol.", consequences: { flags: flags("miss", "disparo") } },
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
        success: { text: "El pase es perfecto: tu compañero no perdona.", consequences: { flags: flags("assist", "pase") } },
        fail: { text: "El pase se queda corto y el rival despeja el peligro.", consequences: { flags: flags("miss", "pase") } },
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
        success: { text: "Sale perfecta. El estadio entero se levanta de sus asientos.", consequences: { fama: 3, flags: flags("wondergoal", "floritura") } },
        fail: { text: "No sale — pierdes el balón y el rival sale a la contra.", consequences: { forma: -2, flags: flags("miss_bad", "floritura") } },
      },
    },
  ],
  (flags) => [
    {
      id: "primer-toque",
      label: "Rematar de primeras sin controlar",
      subtitle: "No le das tiempo al portero a colocarse",
      consequences: {},
      resolve: {
        baseChance: 0.38,
        statModifier: "media",
        success: { text: "El remate de primeras sale ajustado, sin que el portero pueda reaccionar. ¡Gol!", consequences: { fama: 2, flags: flags("goal", "primer_toque") } },
        fail: { text: "El control-remate te sale mal y el balón se marcha desviado.", consequences: { flags: flags("miss", "primer_toque") } },
      },
    },
    {
      id: "linea-fondo",
      label: "Ganar la línea de fondo y centrar atrás",
      subtitle: "Buscar el pase de la muerte en vez del gol propio",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "Te vas de tu marcador y pones un centro atrás perfecto que remata un compañero.", consequences: { flags: flags("assist", "linea_fondo") } },
        fail: { text: "El centro se marcha directo al portero rival. Jugada cortada.", consequences: { flags: flags("miss", "linea_fondo") } },
      },
    },
    {
      id: "aguantar",
      label: "Aguantar el balón de espaldas y pedir apoyo",
      subtitle: "Sin riesgo: dar tiempo a que suba el equipo",
      consequences: {},
      resolve: {
        baseChance: 0.65,
        statModifier: "media",
        success: { text: "Proteges el balón de espaldas hasta que llega apoyo y reinicias la jugada con calma.", consequences: { flags: flags("contained", "aguantar") } },
        fail: { text: "El central rival te roba el balón limpiamente por la espalda.", consequences: { forma: -1, flags: flags("beaten", "aguantar") } },
      },
    },
  ],
  (flags) => [
    {
      id: "cabezazo",
      label: "Rematar de cabeza al primer palo",
      subtitle: "Anticiparte al central en el salto",
      consequences: {},
      resolve: {
        baseChance: 0.36,
        statModifier: "media",
        success: { text: "Ganas el salto y el remate de cabeza se cuela ajustado al palo. ¡Gol!", consequences: { flags: flags("goal", "cabezazo") } },
        fail: { text: "El central salta más alto y despeja el peligro con autoridad.", consequences: { flags: flags("miss", "cabezazo") } },
      },
    },
    {
      id: "abrir-lateral",
      label: "Abrir el balón para el lateral que sube por banda",
      subtitle: "Ceder el protagonismo, buscar el centro después",
      consequences: {},
      resolve: {
        baseChance: 0.52,
        statModifier: "media",
        success: { text: "El balón llega perfecto a la carrera del lateral, que centra para el segundo palo.", consequences: { flags: flags("assist", "abrir_lateral") } },
        fail: { text: "El pase se queda corto y el rival corta la jugada antes de que llegue.", consequences: { flags: flags("miss", "abrir_lateral") } },
      },
    },
    {
      id: "recorte-interior",
      label: "Recortar hacia dentro buscando el ángulo de disparo",
      subtitle: "Todo o nada, sin pasar el balón",
      consequences: {},
      resolve: {
        baseChance: 0.3,
        statModifier: "media",
        success: { text: "El recorte deja sin sitio al defensa y el disparo se cuela ajustado. ¡Gol!", consequences: { fama: 2, flags: flags("wondergoal", "recorte_interior") } },
        fail: { text: "El recorte no sale limpio y pierdes el balón en el intento.", consequences: { forma: -1, flags: flags("miss_bad", "recorte_interior") } },
      },
    },
  ],
  (flags) => [
    {
      id: "vaselina",
      label: "Probar la vaselina por encima del portero adelantado",
      subtitle: "Todo o nada, para la galería",
      consequences: {},
      resolve: {
        baseChance: 0.27,
        statModifier: "media",
        success: { text: "La vaselina sale perfecta y el balón cae justo bajo el larguero. ¡Golazo!", consequences: { fama: 3, flags: flags("wondergoal", "vaselina") } },
        fail: { text: "Se te va larga, por encima del larguero. Ocasión desperdiciada.", consequences: { flags: flags("miss_bad", "vaselina") } },
      },
    },
    {
      id: "ceder-atras",
      label: "Cederla atrás para el que llega desde segunda línea",
      subtitle: "Confiar en que remate mejor colocado",
      consequences: {},
      resolve: {
        baseChance: 0.58,
        statModifier: "media",
        success: { text: "El compañero que llega desde atrás la manda dentro sin oposición. Asistencia perfecta.", consequences: { flags: flags("assist", "ceder_atras") } },
        fail: { text: "El pase atrás sale débil y el rival despeja antes de que llegue nadie.", consequences: { flags: flags("miss", "ceder_atras") } },
      },
    },
    {
      id: "proteger-esquina",
      label: "Proteger el balón pegado a la banda hasta ganar la falta",
      subtitle: "Sin riesgo: buscar los segundos, no el gol",
      consequences: {},
      resolve: {
        baseChance: 0.62,
        statModifier: "media",
        success: { text: "Proteges el balón con el cuerpo hasta que el rival comete falta. Buena gestión del tiempo.", consequences: { flags: flags("contained", "proteger_esquina") } },
        fail: { text: "Te presionan entre dos y pierdes el balón cerca de tu propio campo.", consequences: { forma: -1, flags: flags("beaten", "proteger_esquina") } },
      },
    },
  ],
  (flags) => [
    {
      id: "definicion-rasa",
      label: "Definir raso, pegado al palo contrario",
      subtitle: "Buscar la precisión antes que la potencia",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "El disparo raso se cuela pegado al palo, sin opción para el portero. ¡Gol!", consequences: { flags: flags("goal", "definicion_rasa") } },
        fail: { text: "El portero llega justo para desviar el disparo a córner.", consequences: { flags: flags("miss", "definicion_rasa") } },
      },
    },
    {
      id: "bajar-la-pelota",
      label: "Bajar el balón de pecho antes de decidir",
      subtitle: "Ganar un segundo extra pensando la jugada",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "Controlas con calma y sirves un pase preciso a un compañero mejor colocado.", consequences: { flags: flags("assist", "bajar_la_pelota") } },
        fail: { text: "El control se te escapa un poco y el defensa aprovecha para despejar.", consequences: { flags: flags("miss", "bajar_la_pelota") } },
      },
    },
    {
      id: "simular-centro",
      label: "Amagar el centro y quedarte con el balón",
      subtitle: "Sorprender a la defensa con un cambio de idea",
      consequences: {},
      resolve: {
        baseChance: 0.33,
        statModifier: "media",
        success: { text: "El amago desconcierta a toda la defensa y te deja mano a mano con el portero. ¡Gol!", consequences: { fama: 2, flags: flags("wondergoal", "simular_centro") } },
        fail: { text: "Nadie se la compra y el rival corta la jugada sin problema.", consequences: { flags: flags("miss_bad", "simular_centro") } },
      },
    },
  ],
  (flags) => [
    {
      id: "picar-al-hueco",
      label: "Picar al hueco entre los dos centrales",
      subtitle: "Buscar el desmarque justo antes del pase",
      consequences: {},
      resolve: {
        baseChance: 0.38,
        statModifier: "media",
        success: { text: "Te vas al hueco justo a tiempo y te plantas solo ante el portero. ¡Gol!", consequences: { flags: flags("goal", "picar_al_hueco") } },
        fail: { text: "El linier levanta el banderín: fuera de juego.", consequences: { flags: flags("miss", "picar_al_hueco") } },
      },
    },
    {
      id: "bicicleta",
      label: "Intentar la chilena si el balón te queda en el aire",
      subtitle: "Todo o nada, jugada para el recuerdo",
      consequences: {},
      resolve: {
        baseChance: 0.22,
        statModifier: "media",
        success: { text: "La chilena sale perfecta. El estadio entero enmudece antes de explotar en gritos. ¡Golazo histórico!", consequences: { fama: 4, flags: flags("wondergoal", "bicicleta") } },
        fail: { text: "No conectas bien y el balón se marcha muy desviado. El banquillo se lleva las manos a la cabeza.", consequences: { forma: -2, flags: flags("miss_bad", "bicicleta") } },
      },
    },
    {
      id: "tocar-atras-primero",
      label: "Tocar atrás para reiniciar antes de atacar de nuevo",
      subtitle: "Sin riesgo: guardar la posesión del equipo",
      consequences: {},
      resolve: {
        baseChance: 0.7,
        statModifier: "media",
        success: { text: "El toque atrás es sencillo y el equipo reorganiza el ataque con calma.", consequences: { flags: flags("contained", "tocar_atras_primero") } },
        fail: { text: "El pase atrás sale mal y el rival roba el balón en una zona peligrosa.", consequences: { forma: -1, flags: flags("beaten", "tocar_atras_primero") } },
      },
    },
  ],
  (flags) => [
    {
      id: "remate-palomita",
      label: "Rematar en palomita, estirándote al máximo",
      subtitle: "Todo o nada por llegar al balón",
      consequences: {},
      resolve: {
        baseChance: 0.34,
        statModifier: "media",
        success: { text: "Te estiras al límite y conectas el remate. ¡Gol de palomita!", consequences: { fama: 2, flags: flags("goal", "remate_palomita") } },
        fail: { text: "No llegas por poco y el balón pasa rozando el larguero.", consequences: { flags: flags("miss", "remate_palomita") } },
      },
    },
    {
      id: "bajar-para-compañero",
      label: "Bajar a por el balón y servirlo de espaldas al área",
      subtitle: "Sacrificar tu ocasión por la de un compañero",
      consequences: {},
      resolve: {
        baseChance: 0.54,
        statModifier: "media",
        success: { text: "El taco de espaldas sale perfecto y un compañero remata solo. Asistencia de lujo.", consequences: { flags: flags("assist", "bajar_para_companero") } },
        fail: { text: "El taco se va desviado y el rival despeja sin problemas.", consequences: { flags: flags("miss", "bajar_para_companero") } },
      },
    },
  ],
  (flags) => [
    {
      id: "buscar-rebote",
      label: "Quedarte cerca esperando un posible rebote",
      subtitle: "Paciencia: estar en el sitio correcto",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "El rechace te cae perfecto y no perdonas desde cerca. ¡Gol!", consequences: { flags: flags("goal", "buscar_rebote") } },
        fail: { text: "El rechace se va lejos de ti, hacia un defensa rival.", consequences: { flags: flags("miss", "buscar_rebote") } },
      },
    },
    {
      id: "simular-quiebro",
      label: "Amagar el cuerpo hacia un lado y salir por el otro",
      subtitle: "Ganarte medio metro con un solo gesto",
      consequences: {},
      resolve: {
        baseChance: 0.37,
        statModifier: "media",
        success: { text: "El quiebro deja completamente sentado al defensa. Definición con toda tranquilidad. ¡Gol!", consequences: { fama: 2, flags: flags("goal", "simular_quiebro") } },
        fail: { text: "El defensa no se la compra y te cierra el disparo justo a tiempo.", consequences: { flags: flags("miss", "simular_quiebro") } },
      },
    },
  ],
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
export function buildMatchDecisionMoment(
  player: Player,
  match: { week: number; rivalClub: string; stakes?: MatchStakes },
): GameEvent {
  const decisionFlagKey = `match_decision_${match.week}`;
  const flags = (outcome: string, style: string) => ({ [decisionFlagKey]: JSON.stringify({ outcome, style }) });

  // Antes CUALQUIER partido real (una jornada 1 cualquiera o la final de
  // la temporada) generaba exactamente el mismo "El momento decisivo" —
  // ahora el título y la tensión del arranque escalan según lo que
  // match-calendar.ts (stakes) diga que hay en juego esta semana.
  const decisionTitle = match.stakes === "decisivo" ? "El momento que lo decide todo" : "El momento decisivo";
  const stakesLead =
    match.stakes === "decisivo"
      ? "Partido decisivo de la temporada en marcha, "
      : match.stakes === "importante"
        ? "Partido importante en marcha, "
        : "Partido en marcha ";

  if (player.position === "Portero") {
    const situation = GOALKEEPER_DECISION_SITUATIONS[Math.floor(Math.random() * GOALKEEPER_DECISION_SITUATIONS.length)];
    const optionSet = GOALKEEPER_OPTION_SETS[Math.floor(Math.random() * GOALKEEPER_OPTION_SETS.length)](flags);
    return {
      id: `match-decision-${match.week}-${Date.now()}`,
      category: "partido",
      rivalClub: match.rivalClub,
      title: decisionTitle,
      description: `${stakesLead}ante ${match.rivalClub}. ${situation} No hay tiempo para pensar demasiado — tienes que decidir ya.`,
      allowFreeText: true,
      freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
      options: optionSet,
    };
  }

  if (player.position === "Defensa") {
    const situation = DEFENDER_DECISION_SITUATIONS[Math.floor(Math.random() * DEFENDER_DECISION_SITUATIONS.length)];
    const optionSet = DEFENDER_OPTION_SETS[Math.floor(Math.random() * DEFENDER_OPTION_SETS.length)](flags);
    return {
      id: `match-decision-${match.week}-${Date.now()}`,
      category: "partido",
      rivalClub: match.rivalClub,
      title: decisionTitle,
      description: `${stakesLead}ante ${match.rivalClub}. ${situation} No hay tiempo para pensar demasiado — tienes que decidir ya.`,
      allowFreeText: true,
      freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
      options: optionSet,
    };
  }

  if (player.position === "Centrocampista") {
    const situation = MIDFIELDER_DECISION_SITUATIONS[Math.floor(Math.random() * MIDFIELDER_DECISION_SITUATIONS.length)];
    const optionSet = MIDFIELDER_OPTION_SETS[Math.floor(Math.random() * MIDFIELDER_OPTION_SETS.length)](flags);
    return {
      id: `match-decision-${match.week}-${Date.now()}`,
      category: "partido",
      rivalClub: match.rivalClub,
      title: decisionTitle,
      description: `${stakesLead}ante ${match.rivalClub}. ${situation} No hay tiempo para pensar demasiado — tienes que decidir ya.`,
      allowFreeText: true,
      freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
      options: optionSet,
    };
  }

  // Delantero (y cualquier posición no reconocida, como red de seguridad).
  const situation = ATTACKER_DECISION_SITUATIONS[Math.floor(Math.random() * ATTACKER_DECISION_SITUATIONS.length)];
  const optionSet = ATTACKER_OPTION_SETS[Math.floor(Math.random() * ATTACKER_OPTION_SETS.length)](flags);
  return {
    id: `match-decision-${match.week}-${Date.now()}`,
    category: "partido",
    rivalClub: match.rivalClub,
    title: decisionTitle,
    description: `${stakesLead}ante ${match.rivalClub}. ${situation} No hay tiempo para pensar demasiado — tienes que decidir ya.`,
    allowFreeText: true,
    freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
    options: optionSet,
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
  forcedResult?: { win: boolean; scoreLine: string },
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

  // Solo Copa es eliminación directa de verdad en este calendario — el
  // resultado se decide en código (decideKnockoutResult) ANTES de pedirle
  // la crónica a la IA, para poder actualizar de forma fiable si el
  // jugador sigue vivo en el torneo (ver competition-progress.ts). Sin
  // esto, "seguir vivo en la Copa" no era más que prosa libre de la IA,
  // imposible de usar para decidir si hay partido la semana siguiente —
  // la causa raíz de que apareciera un "Cuartos de Copa" después de que
  // el jugador ya estuviera eliminado esa misma temporada.
  const resultInstruction = forcedResult
    ? `- MARCADOR YA DECIDIDO, ÚSALO EXACTAMENTE Y NO LO CAMBIES NI LO CONTRADIGAS: "${forcedResult.scoreLine}" en formato ${player.club}-${match.rivalClub}. Tu equipo ${forcedResult.win ? "GANA y AVANZA de ronda" : "PIERDE y QUEDA ELIMINADO de la Copa"} — que el titular y la crónica lo dejen clarísimo, sin ambigüedad. Tu propio rendimiento personal (minutos, nota, goles) sí es libre, siempre que sea coherente con ese marcador.`
    : "";
  const stakesInstruction =
    match.stakes === "decisivo"
      ? "- Este es un partido DECISIVO de la temporada (se juega el liderato de Liga, una ronda avanzada de Copa, o la fase europea de más nivel) — la tensión, la prensa y el peso de las opciones de reacción tienen que sentirse a la altura, no como una jornada cualquiera."
      : match.stakes === "importante"
        ? "- Este partido es IMPORTANTE (no una jornada rutinaria) — dale algo más de peso narrativo de lo normal."
        : "";

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

PERSONAJES FIJOS (si mencionas a alguien de tu entorno, usa estos nombres y apellidos exactos):
${describeCast(player)}

REGLAS CRÍTICAS:
${COMMON_RULES}
${resultInstruction}
${stakesInstruction}
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
  // entering_peak / exiting_peak / entering_decline tenían el mismo
  // problema sin ningún freno: detectCareerTransition compara la EDAD
  // exacta (25, 31-32, 32), y como un año son 10 semanas, la condición se
  // cumplía en varios turnos seguidos — un simulador de 150 turnos sacó
  // "Tu momento llegó: ERES UN FUTBOLISTA DE ÉLITE" 10 veces en una sola
  // carrera. Son momentos únicos por definición: una vez por carrera.
  const transitionSeenKey = `transition_seen_${careerTransition}`;
  const oneTimeTransitionOk =
    careerTransition === "ready_to_retire" || !careerTransition || !player.flags?.[transitionSeenKey];
  const retireReminderCooldownOk =
    (careerTransition !== "ready_to_retire" ||
      player.week - parseInt(String(player.flags?.retire_reminder_last_week ?? "-999"), 10) >= 15) &&
    oneTimeTransitionOk;

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
      if (careerTransition !== "ready_to_retire") {
        if (!player.flags) player.flags = {};
        player.flags[transitionSeenKey] = true;
      }
      return maybeAddFreeText(transitionEvent);
    }
  }

  // Mercado de fichajes (verano y enero): SIEMPRE hay rumor al abrirse
  // cada ventana — ver market-window.ts. Va antes de la pretemporada y
  // de los partidos porque estos eventos no avanzan la semana (ver
  // carrera/actions.ts), así que no se salta ningún partido. Si un rumor
  // resultó ser real, después llega la oferta formal.
  clearStaleTransferInterest(playerWithDynamics);
  // No colarse entre la jugada decisiva y la crónica del MISMO partido.
  const midMatch = Boolean(playerWithDynamics.flags?.[`match_decision_${playerWithDynamics.week}`]);
  if (!midMatch && shouldTriggerMarketRumor(playerWithDynamics)) {
    markMarketRumorShown(playerWithDynamics);
    const rumor = buildMarketRumorEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Market rumor: "${rumor.title}"`);
    return maybeAddFreeText(rumor);
  }
  if (!midMatch && shouldTriggerDeadlineDay(playerWithDynamics)) {
    const deadline = buildDeadlineDayEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Deadline day: "${deadline.title}"`);
    return maybeAddFreeText(deadline);
  }
  if (!midMatch && shouldTriggerOwnMoveDecision(playerWithDynamics)) {
    const own = buildOwnMoveEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Own move decision`);
    return maybeAddFreeText(own);
  }
  if (!midMatch && shouldTriggerTransferOffer(playerWithDynamics)) {
    const offer = buildTransferOfferEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Formal transfer offer: "${offer.title}"`);
    return maybeAddFreeText(offer);
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

  // El progreso de Copa de ESTA temporada (competition-progress.ts) decide
  // si hoy toca una segunda eliminatoria o esa semana queda libre — sin
  // pasarlo aquí, el calendario no tendría forma de saber si el jugador
  // sigue vivo en el torneo.
  const currentSeason = Math.floor((playerWithDynamics.week - 1) / 10);
  const copaProgress = getCopaProgress(playerWithDynamics, currentSeason);
  const seasonProgress = { copa: { round: copaProgress.round, alive: copaProgress.alive } };

  // Verificar si el partido programado es ESTA semana — tiene que
  // comprobarse ANTES que "la próxima semana", o el partido nunca llega
  // a jugarse (el motor solo generaba la víspera una y otra vez).
  // Los amistosos de pretemporada ya no generan turnos: cada partido
  // consume DOS turnos (jugada decisiva + crónica) y, con los amistosos,
  // más de la mitad de los turnos de una carrera eran partidos (medido
  // con un simulador del motor real) — justo la queja de "solo hay
  // partidos, apenas vida fuera del campo". Esas semanas quedan libres
  // para vida, mercado y vestuario, y se ahorra una llamada de IA por
  // amistoso.
  const scheduledMatch = getMatchThisWeek(playerWithDynamics.week, playerWithDynamics.club, seasonProgress);
  const matchThisWeek = scheduledMatch && scheduledMatch.competition !== "amistoso" ? scheduledMatch : null;
  if (matchThisWeek) {
    // Antes el partido se resolvía entero de golpe (marcador ya decidido)
    // y el jugador solo podía reaccionar DESPUÉS — nunca decidir nada
    // mientras el balón seguía en juego. Ahora primero se vive el momento
    // decisivo (rematar/pasar/floritura) y solo cuando ya está resuelto
    // se genera la crónica del partido, coherente con esa jugada.
    const decisionFlagKey = `match_decision_${matchThisWeek.week}`;
    const decisionOutcome = playerWithDynamics.flags?.[decisionFlagKey] as string | undefined;

    // Las jornadas de rutina (nada en juego) solo llevan jugada decisiva en
    // la mitad de los casos — decidido por (jugador, semana) para que sea
    // estable entre turnos; los partidos importantes y decisivos siempre.
    let routineParity = 0;
    for (const ch of `${playerWithDynamics.id}:${matchThisWeek.week}`) routineParity = (routineParity * 31 + ch.charCodeAt(0)) % 1000003;
    const skipDecisiveMoment = matchThisWeek.stakes === "rutina" && routineParity % 2 === 1;

    if (!decisionOutcome && !skipDecisiveMoment) {
      // De vez en cuando, en vez del "momento decisivo" genérico según
      // posición, se vive un momento especial ya escrito a mano (penalti
      // en el último minuto, roja injusta, noche de hat-trick, revancha
      // contra el club que te cedió...) — encontrados huérfanos en la
      // auditoría de esta sesión, nunca alcanzables hasta ahora. A
      // diferencia del momento decisivo normal, estos SON el partido
      // entero (no solo una jugada seguida de crónica), así que se les da
      // el mismo tratamiento que a un "matchday-*" real: el id se
      // renombra con ese prefijo para que la semana avance siempre igual
      // que tras cualquier partido resuelto (ver isSeasonCheckpoint en
      // carrera/actions.ts) — sin esto, la misma semana de partido podría
      // volver a ofrecer otro momento decisivo por no haber tocado nunca
      // el flag match_decision_*.
      if (Math.random() < 0.2) {
        const specialMoment = pickMatchSpecialMoment(playerWithDynamics, usedEventIds);
        if (specialMoment) {
          console.log(
            `[pickNextEventDynamic] This week IS match week (${matchThisWeek.competition}) — momento especial: "${specialMoment.title}".`
          );
          return maybeAddFreeText(
            addMatchContext(
              { ...specialMoment, id: `matchday-special-${matchThisWeek.week}-${Date.now()}`, rivalClub: matchThisWeek.rivalClub },
              playerWithDynamics,
            ),
          );
        }
      }

      console.log(
        `[pickNextEventDynamic] This week IS match week (${matchThisWeek.competition}) — momento decisivo primero.`
      );
      return maybeAddFreeText(buildMatchDecisionMoment(playerWithDynamics, matchThisWeek));
    }

    console.log(
      `[pickNextEventDynamic] This week IS match week (${matchThisWeek.competition}): ${matchThisWeek.description}. Resolving the match.`
    );
    // Solo Copa necesita un resultado decidido en código (ver
    // generateMatchDayEvent): es la única competición de eliminación
    // directa de este calendario, así que es la única donde "seguir vivo"
    // significa algo que el juego tiene que recordar entre semanas.
    const forcedResult = matchThisWeek.competition === "copa" && matchThisWeek.cupRound
      ? decideKnockoutResult(playerWithDynamics.media, matchThisWeek.cupRound)
      : undefined;
    const matchDayEvent = await generateMatchDayEvent(playerWithDynamics, matchThisWeek, history, decisionOutcome, forcedResult);
    if (matchDayEvent) {
      if (forcedResult && matchThisWeek.cupRound) {
        advanceCupProgress(playerWithDynamics, "copa_progress", currentSeason, matchThisWeek.cupRound, forcedResult.win);
      }
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
  if (isMatchWeekNext(playerWithDynamics.week, playerWithDynamics.club, seasonProgress)) {
    const nextMatch = getNextMatch(playerWithDynamics.week, playerWithDynamics.club, seasonProgress);
    const prematchFlagKey = `prematch_shown_${nextMatch?.week}`;
    if (nextMatch && nextMatch.competition !== "amistoso" && !player.flags?.[prematchFlagKey]) {
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
  // Fin de la cesión: sin esto el jugador se quedaba para siempre en el
  // club de destino (ver shouldEndLoan en loan-fork.ts).
  if (shouldEndLoan(player)) {
    console.log(`[pickNextEventDynamic] Loan end event for ${player.last_name}`);
    return maybeAddFreeText(buildLoanEndEvent(player));
  }

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

  // Vida familiar, vestuario, entrenamiento y representante ya escritos
  // (dorsal, "Puma o Adidas", llamada de tu madre, tu hermano pequeño...):
  // ver LEGACY_LIFE_EVENT_IDS — llevaban sin selector desde siempre.
  if (Math.random() < 0.14) {
    const legacyEvent = pickLegacyLifeEvent(player, usedEventIds);
    if (legacyEvent) {
      console.log(`[pickNextEventDynamic] Legacy life/locker-room event: "${legacyEvent.title}"`);
      return maybeAddFreeText(legacyEvent);
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
