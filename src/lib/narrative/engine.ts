import type {
  CareerMode,
  CareerState,
  Consequences,
  EventOption,
  GameEvent,
  ResolutionOutcome,
} from "@/types/career";
import { generateAiEvent, generateMatchResult, generateNextEventDynamic, generateEchoEvent, generateThreadPayoffEvent, callEventTool, COMMON_RULES, type HistoryItem } from "./ai";
import type { Player } from "@/types/player";
import { getConfederation } from "@/lib/nations";
import { hasMajorTournament } from "@/lib/calendar/season";
import { buildMatchContext, NO_CLUB_YET } from "@/lib/constants";
import { playerAge, WEEKS_PER_SEASON } from "@/types/career";
import { shouldGenerateAdversity, pickAdversityType, describeAdversity, buildAdversityPrompt, updateAdversityTracker, getAdversityTracker } from "@/lib/narrative/adversity";
import { detectDeclineSignals, buildDeclinePrompt } from "@/lib/narrative/decline";
import { pickCharacterToReappear, describeCharacterReappearance, updateCharacterLastSeen } from "@/lib/narrative/secondary-characters";
import { shouldBeeFunnyMoment, pickRandomFunnyMoment, isSurrealMoment } from "@/lib/narrative/funny-surreal";
import { isEligibleForSponsorship, SPONSORSHIP_EVENTS } from "@/lib/narrative/sponsorships";
import { pickSponsorEvent } from "@/lib/narrative/brands";
import { shouldExcludeEvent, type EventHistory } from "@/lib/narrative/event-tracking";
import { getNextMatch, isMatchWeekNext, getMatchThisWeek, getEuropeanCompetitionFor, getClubLevel, matchKey, parseMatchDone, type MatchWeek } from "@/lib/calendar/match-calendar";
import { childStage as childStageOf, buildChildEvent } from "@/lib/narrative/children";
import { settleOffscreenMatch } from "@/lib/calendar/offscreen-progress";
import { getSeasonProgress, advanceCupProgress, decideKnockoutResult, decideTwoLegResult, resolveEuroGroupStage, decisionNeedsGoal } from "@/lib/calendar/competition-progress";
import { getInjuryRemaining, naturalFormaDegradation, calculateMediaPressure, deteriorateRelationships, shouldTriggerDeclineReflection, ageBasedMediaDecline } from "@/lib/narrative/career-dynamics";
import { detectCareerTransition, buildEnteringPeakEvent, buildExitingPeakEvent, buildEnteringDeclineEvent, buildReadyToRetireEvent } from "@/lib/narrative/career-transitions";
import { shouldTriggerGolChilena, buildGolChilenaEvent, markGolChilenaTriggered } from "@/lib/narrative/gol-chilena";
import { EVENTS } from "@/lib/narrative/events";
import { describeKnownCast as describeCast } from "@/lib/narrative/cast";
import {
  buildAgentDialogueEvent,
  shouldTriggerAgentDialogue,
  pickEligibleAgentTrigger,
  markAgentDialogueTriggered,
} from "@/lib/narrative/agent-events";
import {
  shouldTriggerMarketRumor,
  maybeSeedTransferInterest,
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
import { shouldTriggerPreseasonLife, buildPreseasonLifeEvent } from "@/lib/narrative/preseason-life";
import { settleShootout, shootoutInstruction, isPenaltyShootout } from "@/lib/narrative/shootout";
import { playerMonthlyNet } from "@/lib/narrative/transfer-terms";
import { monthlyRent } from "@/lib/finance/rent";
import { getNpcName, nationalSquadView } from "@/lib/narrative/npcs";
import { buildTorneoFinalEvent } from "@/lib/narrative/world-results";
import { buildOlympicArrival, buildOlympicCallUp, shouldTriggerOlympicPreview, buildOlympicPreviewEvent } from "@/lib/narrative/olympics";
import { applyExClubTouch } from "@/lib/narrative/ex-club";
import { trophyCelebrationOptions } from "@/lib/narrative/trophy-celebration";
import { applyStateTick, stateRollNudge, hasState } from "@/lib/narrative/states";
import { CHICAS } from "@/lib/narrative/bank/scenes/chicas";
import { PAREJA } from "@/lib/narrative/bank/scenes/pareja";
import { PAREJA2 } from "@/lib/narrative/bank/scenes/pareja2";
import { PAREJA3 } from "@/lib/narrative/bank/scenes/pareja3";
import { PAREJA4 } from "@/lib/narrative/bank/scenes/pareja4";
import { shouldTriggerPartnerLife, buildPartnerLifeEvent } from "@/lib/narrative/partner-life";
import { DISCIPLINA } from "@/lib/narrative/bank/scenes/disciplina";
import { ESTADOS } from "@/lib/narrative/bank/scenes/estados";
import { ESTADOS2 } from "@/lib/narrative/bank/scenes/estados2";
import { DISCIPLINA2 } from "@/lib/narrative/bank/scenes/disciplina2";
import { DISCIPLINA3 } from "@/lib/narrative/bank/scenes/disciplina3";
import { CONVIVENCIA } from "@/lib/narrative/bank/scenes/convivencia";
import { VIDA2 } from "@/lib/narrative/bank/scenes/vida2";
import { CLUB3 } from "@/lib/narrative/bank/scenes/club3";
import { ligaLabel, copaLabel, leagueOf, continentalName } from "@/lib/calendar/leagues";
import { buildTorneoLifeEvent } from "@/lib/narrative/torneo-life";
import { buildStateBrief } from "@/lib/narrative/state-brief";
import { shouldTriggerEcho, pickEchoCandidate, consumeEcho } from "@/lib/narrative/ledger";
import { maxMediaForAge } from "@/lib/narrative/media-cap";
import { awardDue, buildAwardEvent, buildConvocatoriaEvent } from "@/lib/narrative/awards";
import { trofeoLabel, type TrofeoKind } from "@/lib/honours";
import { firstLegFor } from "@/lib/calendar/match-calendar";
import { pickNewDecision, pushRecentNew, decisionCloser } from "@/lib/narrative/match-decisions";
import { selWindowPlan, buildSelMatch, decideSelResult, selWindowKey } from "@/lib/narrative/seleccion";
import { BANK_SCENES } from "@/lib/narrative/bank/scenes";
import { fillBankEvent } from "@/lib/narrative/bank/select";
import { pickBankScene, recycleBankScenes } from "@/lib/narrative/bank/select";
import { shouldTriggerInvestmentReview, buildInvestmentReviewEvent } from "@/lib/narrative/investment-review";
import { shouldTriggerContractRenewal, buildContractRenewalEvent } from "@/lib/narrative/contract-renewal";
import { shouldTriggerArrivalIntro, buildArrivalIntroEvent } from "@/lib/narrative/arrival-intro";
import { buildSeasonCloseEvent } from "@/lib/narrative/season-close";
import { shouldTriggerSeasonAwards, buildSeasonAwardsEvent } from "@/lib/narrative/season-awards";
import { shouldTriggerSeasonGoals, buildSeasonGoalsEvent, shouldTriggerGoalsReview, buildGoalsReviewEvent } from "@/lib/narrative/season-goals";
import { shouldTriggerTrainingPlan, buildTrainingPlanEvent } from "@/lib/narrative/training-plan";
import { newAchievements, markAchievements, buildAchievementEvent } from "@/lib/narrative/achievements";
import { shouldTriggerLockerScene, buildLockerScene } from "@/lib/narrative/locker-room";
import { dueFollowersMilestone, buildFollowersMilestone, shouldTriggerCover, buildCoverEvent, shouldTriggerPressScene, buildPressScene, applyPressTick } from "@/lib/narrative/press-system";
import { shouldTriggerClubKit, buildClubKitEvent, shouldTriggerNationalKit, buildNationalKitEvent } from "@/lib/narrative/kit-presentation";
import { shouldTriggerSeriousInjury, shouldTriggerSagaStage, buildSeriousInjuryEvent, buildSagaStageEvent } from "@/lib/narrative/injury-saga";
import { shouldTriggerSponsorRenewal, buildSponsorRenewalEvent } from "@/lib/narrative/sponsor-renewal";
import { shouldTriggerPropertyReview, buildPropertyReviewEvent } from "@/lib/narrative/property-review";
import { shouldTriggerThreadPayoff, pickThreadDue, consumeThread } from "@/lib/narrative/threads";
import { totalMonthlyPayments, totalRentalIncome } from "@/lib/finance/mortgage";
import { monthlySponsorshipIncome } from "@/lib/finance/sponsorship-income";
import { shouldTriggerSalto, buildSaltoEvent } from "@/lib/narrative/arco-salto";
import { buildFallbackMatchReport } from "@/lib/narrative/match-fallback";
import { shouldTriggerDebtTrouble, buildDebtTroubleEvent } from "@/lib/finance/finance-events";
import { isEventCoherentWithState } from "@/lib/narrative/state-rules";
import { shouldTriggerPhysioScene, buildPhysioEvent } from "@/lib/narrative/injury-events";
import { computeRole, roleInstruction, roleMinuteRange, type PlayerRole } from "@/lib/narrative/role";
import { buildBenchedMatchEvent, shouldTriggerBenchEscape, buildBenchEscapeEvent } from "@/lib/narrative/role-events";
import {
  getTorneoProgress,
  saveTorneoProgress,
  shouldStartTorneo,
  shouldStartOlympics,
  torneoLabel,
  startTorneoProgress,
  buildTorneoMatch,
  decideTorneoResult,
  advanceTorneo,
  torneoYear,
  TORNEO_NAMES,
  torneoStageLabels,
  torneoStages,
  torneoFinalStage,
} from "@/lib/narrative/torneo";
import { shouldTriggerSocialDm, buildSocialDmEvent } from "@/lib/narrative/social-dm";
import { shouldTriggerArcoRival, buildArcoRivalEvent } from "@/lib/narrative/arco-rival";
import { shouldTriggerArcoHermano, buildArcoHermanoEvent } from "@/lib/narrative/arco-hermano";
import { shouldTriggerArcoPatrocinador, buildArcoPatrocinadorEvent } from "@/lib/narrative/arco-patrocinador";
import { shouldTriggerArcoReencuentro, buildArcoReencuentroEvent } from "@/lib/narrative/arco-reencuentro";
import { shouldTriggerLoanFork, buildLoanForkEvent, markLoanForkTriggered, shouldEndLoan, buildLoanEndEvent } from "@/lib/narrative/loan-fork";
import { pickDetailedLifeScenario, markDetailedLifeUsed } from "@/lib/narrative/life-events-detailed";
import { Mode, Situation, ATTACKER_DECISION_SITUATIONS, MIDFIELDER_DECISION_SITUATIONS, DEFENDER_DECISION_SITUATIONS, GOALKEEPER_DECISION_SITUATIONS, DecisionFlagsFn, rollOpt, GOALKEEPER_OPTION_SETS, DEFENDER_OPTION_SETS, MIDFIELDER_OPTION_SETS, OptionSet, ATTACKER_OPTION_SETS } from "@/lib/narrative/match-moments-data";

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
  // Encontrados en una auditoría de huérfanos: 21 escenas graciosas/
  // surrealistas completas (prensa, famoseo, redes) que llevaban
  // escritas en events.ts desde hace tiempo pero nunca estuvieron en
  // NINGÚN pool de selección — ninguna partida podía llegar a vivirlas
  // nunca, pese a estar listas. El usuario pidió explícitamente "más
  // acciones graciosas y surrealistas"; esto añade 21 de golpe sin
  // escribir una sola línea de narrativa nueva, solo conectándolas.
  "esp-confusion-identidad",
  "esp-camiseta-pirata",
  "fama-revista-corazon",
  "fama-influencer-unboxing",
  "fama-reportaje-hogar",
  "fama-rumor-falso",
  "fama-tiktok-trend",
  "fama-periodista-finanzas",
  "fama-indirectas-rival",
  "fama-perfil-falso",
  "fama-podcast-estrella",
  "fama-portada-revista",
  "fama-merchandising-falso",
  "fama-streamer-fichaje-broma",
  "fama-leyenda-confusion",
  "fama-doble-viral",
  "fama-cancion-dedicada",
  "fama-hackeo-cuenta",
  "fama-paparazzi-cena",
  "fama-post-viral-propio",
  "fama-portada-warca",
]);
const FAME_EVENTS: GameEvent[] = EVENTS.filter((event) => FAME_EVENT_IDS.has(event.id));

/**
 * Hay un representante de verdad (una persona ajena a la familia): ni sin
 * representante todavía, ni "Tu padre/madre/hermano/tía". Las escenas donde
 * "tu representante" pide algo o negocia solo tienen sentido con uno real
 * (reportado en vivo: te pedía subir la comisión alguien que no existía).
 */
function hasExternalAgent(player: Player): boolean {
  const name = player.agent_name;
  return !!name && !/^(Tu |Sin |Nueva )/.test(name);
}

/**
 * Igual que pickScriptedLifeEvent, para el pool de famosos/virales/surreal.
 */
function pickFameEvent(player: Player, usedEventIds: string[]): GameEvent | null {
  const eligible = FAME_EVENTS.filter(
    (event) =>
      (event.minWeek ?? 1) <= player.week &&
      (!event.requiresFlag || Boolean(player.flags?.[event.requiresFlag])) &&
      (!event.requiresExternalAgent || hasExternalAgent(player)) &&
      isEventCoherentWithState(event, player) &&
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
      (!event.requiresExternalAgent || hasExternalAgent(player)) &&
      isEventCoherentWithState(event, player) &&
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
  "sel-clasificacion-mundial",
  "sel-clasificacion-eurocopa",
  "sel-clasificacion-copa-america",
  "premio-pichichi",
  "premio-mvp-torneo",
  "especial-lesion-grave",
  // Añadidos por la skill narrativas-futbol: patrones reales de carrera
  // (fichaje caro que no cuaja, choque cultural, lesión de rodilla,
  // marginado por cambio de entrenador, cesión sin hueco al volver,
  // suplente que explota tarde, veterano que vuelve a su club de debut).
  "esp-fichaje-caro-presion",
  "vid-choque-cultural-extranjero",
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
  // Skill narrativas-futbol, tanda 2: dos decisiones de carrera lo bastante
  // grandes (pedir salir del club, quedarte fuera de una convocatoria pese
  // a tu buen momento) como para vivir aquí en vez del pool genérico.
  "rep-pedir-carta-libertad",
  "sel-convocatoria-snub",
  // Guiños a leyendas reales sin nombrarlas ni recrear su cara (ver
  // comentario junto a estos eventos en events.ts).
  "esp-guino-saludo-leyenda",
  "esp-guino-rondo-imposible",
  "esp-guino-comparacion-prensa",
  "esp-guino-capitan-eterno",
  "rep-consejo-inversion",
  "rep-consejo-vivienda",
]);

/**
 * "La boda equivocada" y "El reality por error" (events.ts) NO viven en
 * GRAND_MOMENT_EVENT_IDS a propósito: ese pool se revisa con un 35% de
 * probabilidad CADA turno elegible durante toda la carrera, así que en
 * una partida larga casi cualquier evento ahí dentro acaba ocurriendo
 * tarde o temprano — correcto para el Balón de Oro o la capitanía
 * (deben pasar en toda carrera exitosa), pero no para un despiste
 * surrealista, que tiene que sentirse como una rareza que le pasa a
 * ALGUNOS jugadores, no a todos. Pedido explícito: "que no salga siempre
 * a todos los usuarios".
 *
 * Aquí se resuelve en dos capas: primero, si esta partida en concreto
 * siquiera "tiene" alguna vez la posibilidad (un ~15% de los jugadores,
 * decidido de forma determinista por su id — mismo jugador, mismo
 * resultado siempre, sin necesidad de guardar nada hasta que ocurra); y
 * solo si la tiene, una probabilidad baja por turno de que ocurra de
 * verdad, una única vez en toda la carrera.
 */
const RARE_MISHAP_IDS = ["esp-boda-equivocada", "esp-reality-error"];

function isEligibleForRareMishap(player: Player): boolean {
  return mixHash(`${player.id}:rare-mishap-eligible`) % 100 < 15;
}

function mixHash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  return (h >>> 0) % 1000;
}

function shouldTriggerRareMishap(player: Player, usedEventIds: string[]): boolean {
  if (player.week < 30) return false;
  if (RARE_MISHAP_IDS.some((id) => usedEventIds.includes(id))) return false;
  if (!isEligibleForRareMishap(player)) return false;
  return Math.random() < 0.03;
}

function pickRareMishapEvent(usedEventIds: string[]): GameEvent | null {
  const eligible = RARE_MISHAP_IDS.filter((id) => !usedEventIds.includes(id));
  if (eligible.length === 0) return null;
  const id = eligible[Math.floor(Math.random() * eligible.length)];
  return EVENTS.find((e) => e.id === id) ?? null;
}
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

/**
 * Comprueba si el año de calendario del jugador (misma cuenta que usa el
 * texto de pretemporada generado por IA, ver hasMajorTournament en
 * calendar/season.ts) coincide de verdad con el torneo que pide el
 * evento — "this_season" para vivir el torneo en sí, "season_before" para
 * la clasificatoria de la temporada anterior. Sin esto, sel-mundial podía
 * salir en una temporada que el propio juego no consideraba año de
 * Mundial, contradiciendo el texto ambiental que sí hace bien la cuenta.
 */
function isMajorTournamentDue(
  requirement: NonNullable<GameEvent["requiresMajorTournament"]>,
  player: Player,
): boolean {
  const currentSeason = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const seasonToCheck = requirement.timing === "season_before" ? currentSeason + 1 : currentSeason;
  const tournament = hasMajorTournament(seasonToCheck, playerAge(player.week), player.nation);
  return tournament.has && tournament.type === requirement.type;
}

function pickGrandMomentEvent(player: Player, usedEventIds: string[]): GameEvent | null {
  const playerConfederation = getConfederation(player.nation);
  const eligible = GRAND_MOMENT_EVENTS.filter(
    (event) =>
      isEventCoherentWithClub(event.id, player) &&
      (event.minWeek ?? 1) <= player.week &&
      (!event.requiresFlag || Boolean(player.flags?.[event.requiresFlag])) &&
      (!event.requiresExternalAgent || hasExternalAgent(player)) &&
      isEventCoherentWithState(event, player) &&
      (event.minMedia === undefined || player.media >= event.minMedia) &&
      (event.maxMedia === undefined || player.media <= event.maxMedia) &&
      (!event.requiresConfederation ||
        (playerConfederation !== null && event.requiresConfederation.includes(playerConfederation))) &&
      (!event.requiresMajorTournament || isMajorTournamentDue(event.requiresMajorTournament, player)) &&
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
 *
 * Auditoría posterior (sesión "sigue puliendo cosas"): dos casos más de
 * la misma familia, encontrados repasando de nuevo qué ids de events.ts
 * no caía ningún selector. Se dejan también fuera a propósito, no son
 * huérfanos sin más — cada uno tiene un sistema dinámico más nuevo que lo
 * sustituye por completo:
 * - fork-cesion: superado por loan-fork.ts, que genera su propio evento
 *   de cesión con id `fork-cesion-<timestamp>` (mismo prefijo, pero es
 *   un objeto distinto y sí está conectado — ver shouldTriggerLoanFork).
 * - fork-retiro-pro: superado por transition-ready-to-retire
 *   (career-transitions.ts / buildReadyToRetireEvent). Su id sigue
 *   apareciendo a propósito en actions.ts/retiro/page.tsx/
 *   event-tracking.ts junto al nuevo — compatibilidad hacia atrás por si
 *   algún jugador real se retiró con el sistema viejo antes del cambio,
 *   no una referencia rota.
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
  // Skill narrativas-futbol, tanda 2: patrones reales no cubiertos todavía
  // (afición propia pitando, amigos de repente, asesor de cripto, perder
  // la capitanía, un compañero con una crisis personal). No van en
  // category "prensa" (auto-incluida) ni son "grandes momentos" de
  // carrera, así que necesitan su propio hueco aquí para ser alcanzables.
  "ves-pitada-propia-aficion", "vid-amigos-de-repente", "rep-asesor-financiero-cripto",
  "esp-comparado-nueva-joya", "ves-perder-capitania", "ent-jugar-con-dolor",
  "ves-companero-crisis-personal",
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
      (!event.requiresExternalAgent || hasExternalAgent(player)) &&
      isEventCoherentWithState(event, player) &&
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
      (!event.requiresExternalAgent || hasExternalAgent(player)) &&
      isEventCoherentWithState(event, player) &&
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
const INJURY_LONG_DURATION_WEEKS = 3;

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
    options: event.options.map((option) => {
      const injuryFlags = { [injuryFlagKey]: String(INJURY_LONG_DURATION_WEEKS), physio_stage: "0" };
      const withInjury = (c: Consequences): Consequences => ({ ...c, flags: { ...c.flags, ...injuryFlags } });
      return {
        ...option,
        consequences: withInjury(option.consequences),
        // Las opciones con tirada (segunda opinión...) resuelven con su propio
        // desenlace: la lesión tiene que arrancar también ahí, no solo en las fijas.
        resolve: option.resolve
          ? {
              ...option.resolve,
              success: { ...option.resolve.success, consequences: withInjury(option.resolve.success.consequences) },
              fail: { ...option.resolve.fail, consequences: withInjury(option.resolve.fail.consequences) },
            }
          : undefined,
      };
    }),
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
      (!event.requiresExternalAgent || hasExternalAgent(player)) &&
      isEventCoherentWithState(event, player) &&
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

/**
 * Un título ganado: el evento lleva el trofeo (el palmarés lo registra al resolverse),
 * se cuenta con claridad en el texto y pasa a ser un hito compartible.
 */
function withTrophy(event: GameEvent, kind: TrofeoKind, team: string, detail?: string, scene?: string): GameEvent {
  const label = trofeoLabel({ k: kind, c: team });
  const already = /campe[oó]n|levant\w+ (el|la) (trofeo|copa)/i.test(event.description);
  const cup =
    kind === "champions" && leagueOf(team).id === "sa"
      ? "the large silver Asian Champions League trophy with big handles"
      : kind === "champions"
      ? "the large silver Champions League trophy with big handles"
      : kind === "europa"
        ? "the Europa League trophy"
        : kind === "mundial"
          ? "the golden World Cup trophy"
          : `the ${label} trophy`;
  const national = kind === "mundial" || kind === "eurocopa" || kind === "copa_america";
  return {
    ...event,
    trophy: { kind, detail },
    isMilestone: true,
    milestoneType: "titulo",
    // Ganar un título se celebra: la noche con el vestuario, el desfile, la familia, la dedicatoria.
    options: trophyCelebrationOptions(label, { national, team }),
    imageScene:
      event.imageScene ??
      scene ??
      `Photorealistic photo of a footballer holding ${cup} high above his head with both hands on the pitch after winning the final, teammates hugging around him, confetti and fireworks, packed stadium at night, emotional celebration, no readable text`,
    description: already ? event.description : `${event.description} ¡Te proclamas campeón de ${label} con ${team}! Levantas el trofeo mientras el estadio entero se viene abajo.`,
  };
}

/** La celebración de la Liga ganada: sale al empezar la temporada siguiente, con el puesto ya decidido en código. */
function pickLigaChampionEvent(player: Player): GameEvent | null {
  const raw = player.flags?.liga_campeon_pendiente;
  if (typeof raw !== "string" || !raw) return null;
  const [seasonStr, ptsStr, secondStr] = raw.split("|");
  const season = parseInt(seasonStr, 10);
  const pts = parseInt(ptsStr, 10);
  const second = parseInt(secondStr, 10);
  if (!Number.isFinite(season)) return null;
  player.flags.liga_campeon_pendiente = "";
  const gap = pts - (Number.isFinite(second) ? second : pts);
  const role = computeRole(player).role;
  const yearLabel = `${2026 + season}/${String(2027 + season).slice(2)}`;
  const gapText = gap > 0 ? `${gap} puntos más que el segundo` : "los mismos que el segundo, pero con ventaja en los desempates";
  const roleText =
    role === "titular"
      ? "Has sido pieza clave en cada tramo de la temporada, y el vestuario te lo dice con abrazos y con cerveza."
      : role === "rotacion"
        ? "No has sido imprescindible todos los meses, pero cada minuto tuyo ha sumado, y todos lo saben."
        : "Desde un segundo plano has empujado cada semana, y el vestuario no se olvida de quién aguanta cuando no juega.";
  const club = player.club;
  const league = leagueOf(club);
  return {
    id: `liga-campeon-${season}`,
    category: "especial",
    title: league.id === "es" ? "¡Campeones de Liga!" : `¡Campeones de la ${league.name}!`,
    description: `Tras ${league.jornadas === 34 ? "treinta y cuatro" : "treinta y ocho"} jornadas, ${club} termina la ${league.id === "es" ? "Liga" : league.name} ${yearLabel} con ${pts} puntos: ${gapText}. La ciudad entera se echa a la calle; hay bufandas, bocinas y gente llorando en los balcones. ${roleText}`,
    isMilestone: true,
    milestoneType: "titulo",
    trophy: { kind: "liga", season },
    imageScene: "Photorealistic photo of a footballer celebrating a league title on the pitch with teammates, trophy raised, confetti and fireworks, packed stadium, emotional smile, no logos or readable text",
    options: [
      { id: "a", label: "Celebrarlo con la afición en la plaza", subtitle: "Compartir el título con la ciudad", consequences: { fama: 6, rel_aficion: 6, moral: 8, rel_vestuario: 2 }, outcomeText: "Subes al autobús descubierto con el trofeo entre las manos. La gente canta tu nombre durante horas. Cuando bajas, tienes la voz rota y la sensación de que nada volverá a ser tan grande." },
      { id: "b", label: "Una cena íntima con tu familia y tus amigos de siempre", subtitle: "Volver a casa", consequences: { moral: 9, reputacion: 3, rel_aficion: 2 }, outcomeText: "Reservas una mesa pequeña en el bar del barrio. Tu madre llora, tu padre brinda con un vaso de plástico, y alguien trae una camiseta firmada por todos. Esa es tu foto favorita del año." },
      { id: "c", label: "Entrenar ya mañana: esto es solo el primer título", subtitle: "Hambre de más", consequences: { forma: 3, rel_entrenador: 3, moral: 4, media: 1 }, outcomeText: "Al día siguiente apareces el primero en el campo. El míster te mira, sonríe y dice solo: «Pareces tonto». Los dos sabéis que te ha encantado." },
    ],
  };
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
      // Rendimientos decrecientes: subir de 55 a 70 es fácil, de 90 a 100 casi imposible.
      // Sin esto todas las barras acababan clavadas en 100 y dejaban de significar nada.
      // La fama y el ánimo cuestan mucho más de llenar, sobre todo en el prime (25-28 años en adelante): cuanto más arriba, menos
      // sube cada buena noticia (casi nada por encima de 85) y a partir de los 25 todo cuesta un cuarto más, y a los 28 casi la mitad.
      const hard = field === "fama" || field === "moral";
      const age = playerAge(state.week);
      const prime = hard ? (age >= 28 ? 0.55 : age >= 25 ? 0.75 : 1) : 1;
      const room = hard ? Math.max(0.06, Math.min(1, (90 - state[field]) / 45)) : Math.max(0.12, Math.min(1, (100 - state[field]) / 45));
      const gain = delta > 0 ? delta * room * prime * (field === "fama" ? 0.5 : 1) : delta;
      patch[field] = clampPercent(state[field] + gain);
    }
  }

  if (consequences.media !== undefined) {
    // Tope por edad: solo frena las subidas (ver media-cap.ts).
    const grown = clampMedia(state.media + consequences.media);
    patch.media = consequences.media > 0 ? Math.min(grown, Math.max(state.media, maxMediaForAge(state.week, state.fama))) : grown;
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

  // La postura del entrenador (coachStance) mueve la relación con él en
  // cualquier opción, aunque ninguna lo declare — que se vea en "En juego".
  if (event.coachStance) keys.add("rel_entrenador");

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
export function resolveOption(
  option: EventOption,
  state: CareerState & { flags?: Record<string, string | boolean> | null },
): Resolution | null {
  if (!option.resolve) return null;

  const { baseChance, statModifier, success, fail } = option.resolve;
  const statValue = statModifier ? state[statModifier] : 50;
  const nudge = (statValue - 50) / 250 + stateRollNudge(state.flags, state.week); // pequeño empujón, nunca decisivo (más los estados activos)
  // Jugadas decisivas de partido: tras varias malas seguidas la suerte
  // "compensa" (+7 puntos por fallo acumulado, hasta +25) y hay un pequeño
  // plus base. Reportado en vivo: 4-5 partidos sin acertar ni una, y así
  // nadie se engancha — se sigue pudiendo fallar, pero no eternamente.
  const isMatchMoment = Object.keys(success.consequences.flags ?? {}).some((k) => k.startsWith("match_decision_"));
  const missStreak = isMatchMoment ? parseInt(String(state.flags?.match_miss_streak ?? "0"), 10) || 0 : 0;
  const mercy = isMatchMoment ? 0.04 + Math.min(0.25, missStreak * 0.07) : 0;
  const chance = Math.max(0.1, Math.min(0.9, baseChance + nudge + mercy));

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
    liga: `${ligaLabel(player.club)} - Lucha por puntos cruciales. ${rivalContext[match.rivalClub] || "Rival de la liga"}.`,
    copa: `${copaLabel(player.club)} - Eliminatoria directa. No hay segundo partido: o pasas o te elimina.`,
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

${buildStateBrief(player, history)}

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

/**
 * Antes de esto, cualquier partido real — una jornada de mitad de tabla,
 * una eliminatoria de Copa o una noche de Champions — arrancaba con
 * exactamente el mismo "Partido [importante/decisivo] en marcha, ante
 * X": la única diferencia entre competiciones era la intensidad
 * (stakes), nunca el SABOR. `match` ya traía `competition` y
 * `description` (match-calendar.ts los calcula para cada semana), pero
 * esta función solo miraba `stakes` — pedido explícito: que Liga, Copa,
 * Champions, Europa y amistoso se sientan distintos de verdad, no solo
 * "más o menos importantes".
 */
/**
 * `description` en copa/champions/europa ya viene como "Champions League -
 * Fase de grupos ante {rival}" (match-calendar.ts) — el rival va incluido
 * porque otras pantallas del juego lo necesitan tal cual. Pero el propio
 * `buildMatchDecisionMoment` de abajo SIEMPRE añade su propio "ante
 * {rival}." al final de la frase (para las 4 posiciones), así que usar
 * `description` entero aquí duplicaba el rival y a veces la competición
 * dos veces seguidas. Esto se queda solo con la ronda ("Fase de grupos",
 * "Dieciseisavos"), sin el "ante X" que ya viene después.
 */
function roundLabel(description: string): string {
  return description.split(" ante ")[0];
}

function competitionFraming(match: MatchWeek): { title: string; lead: string } {
  const decisivo = match.stakes === "decisivo";
  switch (match.competition) {
    case "champions":
      return {
        title: decisivo ? "Noche de Champions, sin margen de error" : "Noche de Champions",
        lead: `${roundLabel(match.description)}, `,
      };
    case "europa":
      return { title: "Noche europea", lead: `${roundLabel(match.description)}, ` };
    case "copa":
      return {
        title: decisivo ? "La sorpresa que nadie quiere ser" : "Eliminatoria de Copa, a partido único",
        lead: `${roundLabel(match.description)}, a vida o muerte, `,
      };
    case "amistoso":
      return { title: "Primer contacto con el nuevo vestuario", lead: `Amistoso de pretemporada, ` };
    case "internacional":
      return {
        title: decisivo ? "Con la selección, en el partido que lo decide todo" : "Con la selección",
        lead: `${roundLabel(match.description)}, con la camiseta de tu país, `,
      };
    default:
      if (/Clásico/.test(match.description)) return { title: "El Clásico: la jugada que lo decide", lead: "Clásico en marcha, " };
      if (/Derbi/.test(match.description)) return { title: "Derbi: la jugada que lo decide", lead: "Derbi en marcha, " };
      return {
        title: decisivo ? "El momento que lo decide todo" : "El momento decisivo",
        lead: decisivo ? "Partido decisivo de la temporada en marcha, " : match.stakes === "importante" ? "Partido importante en marcha, " : "Partido en marcha ",
      };
  }
}

/**
 * Elige un índice al azar evitando los usados en los últimos partidos.
 * Reportado en vivo: dos partidos seguidos con la misma jugada, las mismas
 * opciones y el mismo resultado — antes era Math.random() pelado, sin
 * ninguna memoria. Las últimas elecciones viajan en player.flags
 * (match_recent_sit / match_recent_set) y se guardan con la consecuencia
 * de la opción elegida, ver `flags` más abajo.
 */
const NEGATIVE_DECISION_OUTCOMES = new Set(["miss", "miss_bad", "concede", "penalty_conceded", "foul_committed", "beaten"]);

/**
 * Minuto de la jugada decisiva, como etiqueta ("38", "90+3"). Cubre el
 * partido entero: los primeros minutos, el tramo central y, con más peso
 * dramático del que tendría un reparto uniforme, el final y el descuento
 * (en el fútbol real se decide mucho ahí).
 */
function pickMatchMinute(role: PlayerRole = "titular"): string {
  if (role === "suplente" || role === "rotacion") {
    const { from, to } = roleMinuteRange(role);
    return String(from + Math.floor(Math.random() * (to - from + 1)));
  }
  const r = Math.random();
  if (r < 0.07) return String(1 + Math.floor(Math.random() * 5)); // 1-5
  if (r < 0.77) return String(6 + Math.floor(Math.random() * 79)); // 6-84
  if (r < 0.9) return String(85 + Math.floor(Math.random() * 6)); // 85-90
  return `90+${1 + Math.floor(Math.random() * 5)}`; // descuento
}

function parseRecentIdx(raw: unknown): number[] {
  return String(raw ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

function pickIndexAvoiding(count: number, recent: number[], keep: number, allowed?: number[]): number {
  const candidates = allowed ?? Array.from({ length: count }, (_, i) => i);
  const avoid = new Set(recent.slice(-keep));
  const fresh = candidates.filter((i) => !avoid.has(i));
  const pool = fresh.length > 0 ? fresh : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pushRecentIdx(recent: number[], idx: number, keep: number): string {
  return [...recent, idx].slice(-keep).join(",");
}

export function buildMatchDecisionMoment(player: Player, match: MatchWeek): GameEvent {
  const decisionFlagKey = `match_decision_${match.week}_${matchKey(match)}`;
  const recentSit = parseRecentIdx(player.flags?.match_recent_sit);
  const recentSet = parseRecentIdx(player.flags?.match_recent_set);
  const missStreak = parseInt(String(player.flags?.match_miss_streak ?? "0"), 10) || 0;
  // El rol manda sobre CUÁNDO cae la jugada: un suplente solo entra al final.
  const minuteRole: PlayerRole = match.competition === "internacional" ? "titular" : computeRole(player).role;
  const makeFlags =
    (sitIdx: number, setIdx: number, sitKeep: number, setKeep: number, sitText: string) => (outcome: string, style: string) => ({
      // `sit` viaja con el resultado para que la crónica cuente ESTA jugada
      // y no una inventada: sin ella la IA rellenaba siempre el hueco con
      // "solo ante el portero, la mandaste a las nubes" (reportado en vivo).
      // `min` lo fija el código: si lo elige la IA, siempre cae en el mismo
      // (reportado en vivo: "el minuto 38" partido tras partido).
      [decisionFlagKey]: JSON.stringify({ outcome, style, sit: sitText, min: pickMatchMinute(minuteRole) }),
      // Racha de jugadas malas seguidas (ver resolveOption: compensa la suerte).
      match_miss_streak: NEGATIVE_DECISION_OUTCOMES.has(outcome) ? String(missStreak + 1) : "0",
      match_recent_sit: pushRecentIdx(recentSit, sitIdx, sitKeep),
      match_recent_set: pushRecentIdx(recentSet, setIdx, setKeep),
    });
  const keepFor = (size: number, max: number) => Math.max(1, Math.min(max, Math.floor(size / 2)));

  const { title: decisionTitle, lead: stakesLead } = competitionFraming(match);

  // Jugadas nuevas escritas a mano (match-decisions/): mayoría de las veces,
  // para que la jugada, las opciones y la frase final casi nunca se repitan.
  if (Math.random() < 0.8) {
    const picked = pickNewDecision(player.position, player.flags?.match_recent_new);
    const newFlags: DecisionFlagsFn = (outcome, style) => ({
      [decisionFlagKey]: JSON.stringify({ outcome, style, sit: picked.decision.text, min: pickMatchMinute(minuteRole) }),
      match_miss_streak: NEGATIVE_DECISION_OUTCOMES.has(outcome) ? String(missStreak + 1) : "0",
      match_recent_new: pushRecentNew(player.flags?.match_recent_new, picked.index, picked.keep),
    });
    return {
      id: `match-decision-${match.week}-${Date.now()}`,
      category: "partido",
      rivalClub: match.rivalClub,
      title: decisionTitle,
      description: `${stakesLead}ante ${match.rivalClub}. ${picked.decision.text}${decisionCloser()}`,
      allowFreeText: true,
      freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
      options: picked.decision.options(newFlags),
    };
  }

  if (player.position === "Portero") {
    const sitKeep = keepFor(GOALKEEPER_DECISION_SITUATIONS.length, 5);
    const setKeep = keepFor(GOALKEEPER_OPTION_SETS.length, 3);
    const sitIdx = pickIndexAvoiding(GOALKEEPER_DECISION_SITUATIONS.length, recentSit, sitKeep);
    const setIdx = pickIndexAvoiding(GOALKEEPER_OPTION_SETS.length, recentSet, setKeep);
    const situation = GOALKEEPER_DECISION_SITUATIONS[sitIdx];
    const optionSet = GOALKEEPER_OPTION_SETS[setIdx](makeFlags(sitIdx, setIdx, sitKeep, setKeep, situation));
    return {
      id: `match-decision-${match.week}-${Date.now()}`,
      category: "partido",
      rivalClub: match.rivalClub,
      title: decisionTitle,
      description: `${stakesLead}ante ${match.rivalClub}. ${situation}${decisionCloser()}`,
      allowFreeText: true,
      freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
      options: optionSet,
    };
  }

  if (player.position === "Defensa") {
    const sitKeep = keepFor(DEFENDER_DECISION_SITUATIONS.length, 5);
    const setKeep = keepFor(DEFENDER_OPTION_SETS.length, 3);
    const sitIdx = pickIndexAvoiding(DEFENDER_DECISION_SITUATIONS.length, recentSit, sitKeep);
    const setIdx = pickIndexAvoiding(DEFENDER_OPTION_SETS.length, recentSet, setKeep);
    const situation = DEFENDER_DECISION_SITUATIONS[sitIdx];
    const optionSet = DEFENDER_OPTION_SETS[setIdx](makeFlags(sitIdx, setIdx, sitKeep, setKeep, situation));
    return {
      id: `match-decision-${match.week}-${Date.now()}`,
      category: "partido",
      rivalClub: match.rivalClub,
      title: decisionTitle,
      description: `${stakesLead}ante ${match.rivalClub}. ${situation}${decisionCloser()}`,
      allowFreeText: true,
      freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
      options: optionSet,
    };
  }

  if (player.position === "Centrocampista") {
    const sitKeep = keepFor(MIDFIELDER_DECISION_SITUATIONS.length, 5);
    const setKeep = keepFor(MIDFIELDER_OPTION_SETS.length, 3);
    const sitIdx = pickIndexAvoiding(MIDFIELDER_DECISION_SITUATIONS.length, recentSit, sitKeep);
    const setIdx = pickIndexAvoiding(MIDFIELDER_OPTION_SETS.length, recentSet, setKeep);
    const situation = MIDFIELDER_DECISION_SITUATIONS[sitIdx];
    const optionSet = MIDFIELDER_OPTION_SETS[setIdx](makeFlags(sitIdx, setIdx, sitKeep, setKeep, situation));
    return {
      id: `match-decision-${match.week}-${Date.now()}`,
      category: "partido",
      rivalClub: match.rivalClub,
      title: decisionTitle,
      description: `${stakesLead}ante ${match.rivalClub}. ${situation}${decisionCloser()}`,
      allowFreeText: true,
      freeTextPrompt: "¿Qué piensas en el segundo antes de decidir?",
      options: optionSet,
    };
  }

  // Delantero (y cualquier posición no reconocida, como red de seguridad).
  // La situación y el conjunto de opciones se emparejan por `mode`
  // (suelo/aéreo) — antes se elegían del todo independientes y podían
  // no tener sentido juntos (ver comentario junto a Situation arriba).
  const sitKeep = keepFor(ATTACKER_DECISION_SITUATIONS.length, 5);
  const sitIdx = pickIndexAvoiding(ATTACKER_DECISION_SITUATIONS.length, recentSit, sitKeep);
  const situation = ATTACKER_DECISION_SITUATIONS[sitIdx];
  const matchingIdx = ATTACKER_OPTION_SETS.map((s, i) => (s.mode === situation.mode ? i : -1)).filter((i) => i >= 0);
  const allowedSets = matchingIdx.length > 0 ? matchingIdx : ATTACKER_OPTION_SETS.map((_, i) => i);
  const setKeep = keepFor(allowedSets.length, 3);
  const setIdx = pickIndexAvoiding(ATTACKER_OPTION_SETS.length, recentSet, setKeep, allowedSets);
  const optionSet = ATTACKER_OPTION_SETS[setIdx].build(makeFlags(sitIdx, setIdx, sitKeep, setKeep, situation.text));
  return {
    id: `match-decision-${match.week}-${Date.now()}`,
    category: "partido",
    rivalClub: match.rivalClub,
    title: decisionTitle,
    description: `${stakesLead}ante ${match.rivalClub}. ${situation.text}${decisionCloser()}`,
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
  let decision: { outcome: string; style: string; sit?: string; min?: string | number };
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
  // La jugada concreta que vivió el jugador, para que la crónica la cuente
  // tal cual. Sin esto, "tuvo una ocasión clara y la falló" se rellenaba
  // siempre igual (solo ante el portero, a las nubes) partido tras partido.
  const playLine = decision.sit
    ? ` La jugada fue exactamente esta: "${decision.sit}" — cuéntala con ESTOS hechos (el lugar, el tipo de jugada), sin cambiarla por otra. Si el resultado fue fallo, varía CÓMO se falló (poste, paradón, despeje, bloqueo, disparo desviado...) y NO uses la fórmula "solo ante el portero / la mandaste a las nubes" salvo que la jugada diga eso literalmente.`
    : "";
  const minLine = decision.min ? ` Ocurrió en el minuto ${decision.min} (úsalo tal cual; estabas en el campo en ese momento, así que los minutos jugados deben llegar al menos hasta ahí — si es en el descuento, jugaste el partido completo o casi).` : "";
  return `- MOMENTO DECISIVO YA VIVIDO Y FIJO, NO LO CONTRADIGAS: ${line}${playLine}${minLine}`;
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
/**
 * Partido con la selección entre torneos (ver seleccion.ts): primero, la primera
 * vez, la escena de la convocatoria; después la jugada decisiva y la crónica.
 * No avanza el calendario (ids "match-decision-" y "matchday-sel-").
 */
/** ¿Es el primer partido oficial del jugador con su selección? (partidas anteriores: si ya jugó un torneo o una ventana, no). */
function isSelDebut(player: Player): boolean {
  const f = player.flags ?? {};
  if (f.sel_debut_played) return false;
  return !Object.keys(f).some((k) => k.startsWith("torneo_started_") || k.startsWith("sel_win_") || k.startsWith("torneo_result_"));
}

function debutLine(player: Player): string {
  const keeper = (player.position ?? "").toLowerCase().includes("portero");
  return keeper
    ? `- ES TU DEBUT OFICIAL CON ${player.nation}: haces una parada decisiva que la grada recordará. Es un HITO COMPARTIBLE: is_milestone true y image_scene del jugador con la camiseta de ${player.nation} celebrando (sin logos).`
    : `- ES TU DEBUT OFICIAL CON ${player.nation} Y MARCAS UN GOL (Goles: 1 como mínimo, aunque el equipo pierda): cuéntalo con emoción, el himno, la familia en casa. Es un HITO COMPARTIBLE: is_milestone true y image_scene del jugador celebrando su gol con la camiseta de ${player.nation} (sin logos).`;
}

const DEBUT_IMAGE = (nation: string) =>
  `Photorealistic photo of a young footballer celebrating his goal on his national team debut, wearing the ${nation} national team kit, arms wide open, packed stadium roaring behind him, tears of joy, no logos or readable text`;

async function pickSeleccionWindowEvent(
  player: Player,
  history: HistoryItem[],
  weekInSeason: number,
  injured: boolean,
): Promise<GameEvent | null> {
  const plan = selWindowPlan(player, weekInSeason, injured, Boolean(getTorneoProgress(player)));
  if (!plan) return null;
  if (!player.flags) player.flags = {};

  // La primera vez, la escena de la primera convocatoria (banco de escenas).
  if (!player.flags.sel_debut) {
    const callUp = BANK_SCENES.find((b) => b.id === "bank-sel-amistoso-convocatoria");
    if (callUp) return maybeAddFreeText({ ...fillBankEvent(callUp.event, player), id: callUp.id });
  }

  const match = buildSelMatch(player, plan);
  const key = selWindowKey(plan.season, plan.idx);
  const decisionOutcome = player.flags[`match_decision_${match.week}_${key}`] as string | undefined;
  if (!decisionOutcome) {
    console.log(`[pickNextEventDynamic] Selección (${plan.label}): momento decisivo.`);
    return { ...maybeAddFreeText(buildMatchDecisionMoment(player, match)), ownTeam: player.nation, matchKey: key };
  }

  const result = decideSelResult(player, match.rivalClub, decisionOutcome);
  const nation = player.nation;
  const verdict = result.win ? "victoria" : result.draw ? "empate" : "derrota";
  const debut = isSelDebut(player);
  const lines = [
    ...(debut ? [debutLine(player)] : []),
    `- MARCADOR YA DECIDIDO, ÚSALO EXACTAMENTE Y NO LO CAMBIES: "${result.scoreLine}" en formato ${nation}-${match.rivalClub} (${verdict} de ${nation}).`,
    `- Es un partido de ${plan.label} con la camiseta de ${nation}. Es un partido oficial entre torneos, no una fase final: sin títulos ni eliminatorias. NUNCA nombres el club (${player.club}) como tu equipo en este partido.`,
    `- is_milestone solo si hay un gol o una actuación realmente histórica; si no, false.`,
  ];
  const event =
    (await generateMatchDayEvent(player, match, history, decisionOutcome, undefined, lines.join("\n"), plan.label)) ??
    buildFallbackMatchReport({
      player,
      match,
      decisionRaw: decisionOutcome,
      forcedScoreLine: result.scoreLine,
      team: nation,
      competitionNote: plan.label,
      debut,
    });
  player.flags[`sel_win_${plan.season}_${plan.idx}`] = true;
  if (debut) player.flags.sel_debut_played = true;
  return {
    ...event,
    ...(debut ? { isMilestone: true, milestoneType: "seleccion", imageScene: DEBUT_IMAGE(nation) } : {}),
    id: `matchday-sel-${match.week}-${plan.idx}-${Date.now()}`,
    ownTeam: nation,
    rivalClub: match.rivalClub,
    matchKey: key,
  };
}

/**
 * Torneo de selecciones (Mundial, Eurocopa, Copa América) partido a partido.
 * Orden de cada vuelta: llegada → escena de concentración → jugada decisiva
 * → crónica → escena de concentración → … hasta eliminación o final. Todo
 * ocurre "en verano": ninguno de estos eventos avanza la semana (ver
 * carrera/actions.ts), así que al terminar sigue la pretemporada normal.
 */
async function pickTorneoEvent(
  player: Player,
  history: HistoryItem[],
  weekInSeason: number,
  injured: boolean,
): Promise<GameEvent | null> {
  const progress = getTorneoProgress(player);

  if (!progress) {
    const type = shouldStartTorneo(player, weekInSeason, injured) ?? shouldStartOlympics(player, weekInSeason, injured);
    if (!type) return null;
    // Primero la lista de convocados (hito); el torneo arranca en cuanto se resuelve.
    const seasonT = Math.floor((player.week - 1) / 10);
    if (!player.flags?.[`conv_${type}_${seasonT}`]) {
      console.log(`[pickNextEventDynamic] Convocatoria ${type}.`);
      return type === "olimpico" ? buildOlympicCallUp(player, seasonT) : buildConvocatoriaEvent(player, type, seasonT);
    }
    startTorneoProgress(player, type);
    const base = type === "olimpico" ? buildOlympicArrival(player, seasonT) : EVENTS.find((e) => e.id === `sel-${type === "copa_america" ? "copa-america" : type}`);
    if (!base) return null;
    console.log(`[pickNextEventDynamic] Torneo ${type}: llegada.`);
    return maybeAddFreeText({ ...base, id: `${base.id}-s${Math.floor((player.week - 1) / 10)}` });
  }

  // Escena de concentración antes del siguiente partido.
  if (progress.lifeDue && progress.alive) {
    const lifeEvent = buildTorneoLifeEvent(player, progress);
    saveTorneoProgress(player, { ...progress, lifeDue: false, lifeCount: progress.lifeCount + 1 });
    console.log(`[pickNextEventDynamic] Torneo life: "${lifeEvent.title}"`);
    return maybeAddFreeText(lifeEvent);
  }

  // Red de seguridad: un torneo ya terminado no debe quedarse abierto.
  if (!progress.alive || progress.stage >= torneoStages(progress.type)) {
    saveTorneoProgress(player, null);
    return null;
  }

  const match = buildTorneoMatch(player, progress);
  const stageKey = matchKey(match);
  const decisionOutcome = player.flags?.[`match_decision_${match.week}_${stageKey}`] as string | undefined;

  if (!decisionOutcome) {
    console.log(`[pickNextEventDynamic] Torneo ${progress.type}: ${torneoStageLabels(progress.type)[progress.stage]} — momento decisivo.`);
    return { ...maybeAddFreeText(buildMatchDecisionMoment(player, match)), ownTeam: player.nation, matchKey: stageKey };
  }

  // Crónica del partido: el resultado y lo que implica (pasar de fase,
  // eliminación, título) se deciden en código ANTES de pedírsela a la IA.
  let result = decideTorneoResult(player, progress, match.rivalClub, decisionOutcome);
  const tName = torneoLabel(progress.type, progress.season);
  const nation = player.nation;
  const lines: string[] = [];
  // Si la eliminatoria se va a los penaltis, se vive como escena propia (tira el jugador) y su desenlace
  // inclina el resultado final de la tanda.
  let torneoShootoutYo: string | null = null;
  if (result.kind === "ko") {
    const settled = settleShootout(
      player,
      stageKey,
      { win: result.win, scoreLine: result.scoreLine },
      {
        key: stageKey,
        team: nation,
        rival: match.rivalClub,
        comp: tName,
        regular: "",
        round: torneoStageLabels(progress.type)[progress.stage],
        decisive: progress.stage >= torneoFinalStage(progress.type) - 1,
        national: true,
        scored: decisionNeedsGoal(decisionOutcome),
      },
    );
    if ("scene" in settled) return settled.scene;
    result = { ...result, win: settled.win, scoreLine: settled.scoreLine };
    torneoShootoutYo = settled.yo;
  }
  const adv = advanceTorneo(progress, result);
  if (result.kind === "ko" && isPenaltyShootout(result.scoreLine)) {
    lines.push(shootoutInstruction(torneoShootoutYo, result.win, (player.position ?? "").toLowerCase().includes("portero"), nation));
  }
  if (result.kind === "group") {
    const verdict = result.win ? "victoria" : result.draw ? "empate" : "derrota";
    lines.push(
      `- MARCADOR YA DECIDIDO, ÚSALO EXACTAMENTE Y NO LO CAMBIES: "${result.scoreLine}" en formato ${nation}-${match.rivalClub} (${verdict} de ${nation}). Puntos de grupo de tu selección tras este partido: ${adv.next.groupPts}.`,
    );
    if (progress.stage === 2) {
      lines.push(
        adv.qualified
          ? `- Era el último partido de grupo: con este resultado ${nation} SE CLASIFICA para ${progress.type === "mundial" ? "los dieciseisavos" : "octavos"} de final. Que quede claro.`
          : `- Era el último partido de grupo: con este resultado ${nation} QUEDA ELIMINADA del torneo en la fase de grupos. Que quede claro, con el peso emocional que tiene.`,
      );
    }
  }
  if (progress.stage === torneoFinalStage(progress.type)) {
    lines.push(
      result.win
        ? `- Es la FINAL de ${tName} y ${nation} la GANA: es un TÍTULO. Escribe con claridad que "te proclamas campeón" y "levantas el trofeo".`
        : `- Es la FINAL de ${tName} y ${nation} la PIERDE: queda la espina clavada del subcampeón, sin título. NO uses las palabras "campeón" ni "título" para tu selección.`,
    );
  }
  const hito = progress.stage === 0 || progress.stage >= torneoFinalStage(progress.type) - 1 || adv.finished;
  lines.push(
    hito
      ? `- Este partido es un HITO COMPARTIBLE: is_milestone debe ser true y image_scene una foto realista del jugador con la camiseta de la selección de ${nation} en ${tName} (sin logos ni nombres reales, escena concreta de este partido: ${progress.stage === 0 ? "su debut en el torneo" : adv.finished && !adv.champion ? "la eliminación, con el vestuario roto o consolándose" : result.win && progress.stage === torneoFinalStage(progress.type) ? "levantando el trofeo" : "un momento clave del partido"}).`
      : `- is_milestone solo si hay un gol o una actuación realmente histórica; si no, false.`,
  );
  const debutT = progress.stage === 0 && isSelDebut(player);
  if (debutT) lines.unshift(debutLine(player));
  const styleByKey: Record<string, string> = {
    riesgo: "salió dispuesto a arriesgarlo todo en cada partido",
    cabeza: "juega con la cabeza, priorizando no arriesgar de más",
    lider: "asumió el papel de líder del vestuario",
  };
  const style = styleByKey[String(player.flags?.torneo_style ?? "")];
  if (style) lines.push(`- Tu planteamiento en este torneo: ${style}. Puedes reflejarlo con una pincelada.`);
  lines.push(`- Esto es ${tName} con la camiseta de ${nation}: la camiseta, el himno y el país pendiente deben notarse. NUNCA nombres el club (${player.club}) como tu equipo en este partido.`);

  const forcedResult = result.kind === "ko" ? { win: result.win, scoreLine: result.scoreLine } : undefined;
  const event = await generateMatchDayEvent(
    player,
    match,
    history,
    decisionOutcome,
    forcedResult,
    lines.join("\n"),
    tName,
  ) ?? buildFallbackMatchReport({
    player,
    match,
    decisionRaw: decisionOutcome,
    forcedScoreLine: result.scoreLine,
    forcedWin: result.kind === "ko" ? result.win : undefined,
    team: nation,
    competitionNote: tName,
    debut: debutT,
  });
  if (debutT) {
    if (!player.flags) player.flags = {};
    player.flags.sel_debut_played = true;
  }

  // En los Juegos, quien cae en semifinales juega por el bronce (la mitad de las veces lo gana: medalla).
  const olympicBronze = progress.type === "olimpico" && adv.finished && adv.outcome === "semifinal" && Math.random() < 0.5;
  const finalOutcome = olympicBronze ? "bronce" : adv.outcome;
  if (adv.finished) {
    if (!player.flags) player.flags = {};
    player.flags[`torneo_result_${progress.type}_${progress.season}`] = finalOutcome;
    // Eliminado antes de la final: más adelante verás quién la gana (escena torneo-final-*).
    if (!adv.champion && adv.outcome !== "subcampeon") player.flags.torneo_final_pending = `${progress.type}|${progress.season}|${finalOutcome}`;
    saveTorneoProgress(player, null);
  } else {
    saveTorneoProgress(player, adv.next);
  }
  const torneoEvent: GameEvent = {
    ...event,
    ...(debutT ? { isMilestone: true, milestoneType: "seleccion", imageScene: DEBUT_IMAGE(nation) } : {}),
    id: `matchday-torneo-${match.week}-${progress.stage}-${Date.now()}`,
    ownTeam: nation,
    rivalClub: match.rivalClub,
    matchKey: stageKey,
  };
  if (adv.champion) return withTrophy(torneoEvent, progress.type, nation, `${tName}`);
  // Medallas olímpicas que no son oro: cuentan como trofeo (plata en la final perdida, bronce en el partido por el tercer puesto).
  if (progress.type === "olimpico" && (adv.outcome === "subcampeon" || olympicBronze)) {
    return { ...torneoEvent, trophy: { kind: "olimpico", detail: `${tName} · ${adv.outcome === "subcampeon" ? "plata" : "bronce"}` } };
  }
  return torneoEvent;
}

/**
 * Partido del equipo con el jugador de baja: el club juega igual (la
 * clasificación cuenta el resultado) pero el jugador lo ve desde la grada —
 * sin jugada decisiva, sin minutos ni nota. Sin esto, con el ligamento roto
 * seguías saliendo de titular. Todo en código: cero llamadas a la IA.
 */
function buildInjuredMatchEvent(player: Player, match: MatchWeek, monthsLeft: number): GameEvent {
  const compLabel: Record<string, string> = {
    liga: ligaLabel(player.club),
    copa: copaLabel(player.club),
    champions: "Champions League",
    europa: "Europa League",
    internacional: "Partido internacional",
  };
  let h = 0;
  for (const ch of `${player.id}:${match.week}:baja`) h = (h * 31 + ch.charCodeAt(0)) % 1000003;
  const roll = (h % 100) / 100;
  let own = roll < 0.5 ? 2 + (h % 2) : roll < 0.75 ? 1 : h % 2;
  let rival = roll < 0.5 ? h % 2 : roll < 0.75 ? 1 : 2 + (h % 2);
  // Copa y Europa siguen su curso aunque no juegues: el partido se decide en código y mueve la eliminatoria (ver offscreen-progress.ts).
  const off = settleOffscreenMatch(player, match);
  let scoreText = `${own}-${rival}`;
  let verdict = own > rival ? "gana" : own === rival ? "empata" : "pierde";
  if (off.scoreLine) {
    scoreText = off.scoreLine;
    const m = off.scoreLine.match(/^(\d+)-(\d+)/);
    if (m) {
      own = parseInt(m[1], 10);
      rival = parseInt(m[2], 10);
    }
    verdict = off.win ? "gana" : "pierde";
  }
  const comp = compLabel[match.competition] ?? "partido oficial";
  const left = `${monthsLeft} ${monthsLeft === 1 ? "mes" : "meses"}`;
  const baseEvent: GameEvent = {
    id: `matchday-baja-${match.week}-${Date.now()}`,
    category: "partido",
    rivalClub: match.rivalClub,
    title: `Desde la grada: ${player.club} ${verdict} ante ${match.rivalClub}`,
    description: `${comp} ante ${match.rivalClub}. No juegas: sigues de baja (te quedan unos ${left}). Marcador: ${scoreText} (${player.club}-${match.rivalClub}). ${off.note ? `${off.note} ` : ""}Lo ves desde fuera, con la rodilla vendada y el partido pasando sin ti.`,
    options: [
      {
        id: "a",
        label: "Animar al equipo desde la grada",
        subtitle: "Estar presente aunque no juegues",
        consequences: { moral: 2, rel_vestuario: 3 },
        outcomeText: "Los compañeros te buscan con la mirada al acabar. Un abrazo rápido: se nota que cuentan contigo.",
      },
      {
        id: "b",
        label: "Verlo en casa y centrarte en la rehabilitación",
        subtitle: "Cabeza fría, sin distracciones",
        consequences: { forma: 2, moral: -1 },
        outcomeText: "Apagas la tele con el pitido final y vuelves a los ejercicios. Cada día cuenta.",
      },
      {
        id: "c",
        label: "Escribir un mensaje de ánimo al vestuario",
        subtitle: "Liderar sin pisar el campo",
        consequences: { rel_vestuario: 4, fama: 1 },
        outcomeText: "El mensaje llega al grupo en segundos. Alguien lo comparte en redes y la afición lo aplaude.",
      },
    ],
  };
  // El título cuenta aunque lo veas desde la grada (sin foto de celebración: no estás en el campo).
  return off.trophy ? { ...baseEvent, trophy: { kind: off.trophy, detail: `${scoreText} a ${match.rivalClub}` } } : baseEvent;
}

export async function generateMatchDayEvent(
  player: Player,
  match: MatchWeek,
  history: HistoryItem[],
  decisionRaw?: string,
  forcedResult?: { win: boolean; scoreLine: string },
  extraInstruction?: string,
  torneoLabel?: string,
): Promise<GameEvent | null> {
  const age = playerAge(player.week);
  // En un torneo de selecciones el "club" del partido es la selección.
  const team = match.competition === "internacional" ? player.nation : player.club;

  const compLabel: Record<string, string> = {
    liga: ligaLabel(player.club),
    copa: copaLabel(player.club),
    champions: "Champions League",
    europa: "Europa League",
    amistoso: "Amistoso",
    internacional: torneoLabel ? `Partido internacional (${torneoLabel})` : "Partido internacional",
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
    ? `- MARCADOR YA DECIDIDO, ÚSALO EXACTAMENTE Y NO LO CAMBIES NI LO CONTRADIGAS: "${forcedResult.scoreLine}" en formato ${team}-${match.rivalClub}. Tu equipo ${forcedResult.win ? "GANA y AVANZA de ronda" : `PIERDE y QUEDA ELIMINADO de ${compLabel[match.competition as keyof typeof compLabel] ?? "la competición"} (di claramente de qué competición y en qué ronda)`} — que el titular y la crónica lo dejen clarísimo, sin ambigüedad. Tu propio rendimiento personal (minutos, nota, goles) sí es libre, siempre que sea coherente con ese marcador.`
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
- Tu club: ${team}
- Rival: ${match.rivalClub}
- Competición: ${compLabel[match.competition as keyof typeof compLabel] ?? "Partido importante"}
- Jornada: ${match.description}
- Contexto: ${match.competition === "internacional" ? "Sede neutral del torneo, con tu país representado por la selección" : match.homeTeam === team ? "Jugaste en tu estadio" : `Jugaste como visitante en ${match.awayTeam}`}

TU SITUACIÓN:
- Jugador: ${player.last_name}, ${age} años, ${player.position}
- Media: ${player.media}/99, Forma: ${player.forma}/100, Moral: ${player.moral}/100
- Partidos jugados como profesional hasta ahora (SIN contar este): ${player.stats_matches_played ?? 0}
${buildDecisionInstruction(decisionRaw)}

PERSONAJES FIJOS (si mencionas a alguien de tu entorno, usa estos nombres y apellidos exactos):
${describeCast(match.competition === "internacional" ? nationalSquadView(player) : player)}
${match.competition === "internacional" ? `- EN ESTE PARTIDO juegas con la SELECCIÓN de ${player.nation}: tu entrenador es el seleccionador ${getNpcName(nationalSquadView(player), "entrenador")} y tu capitán es ${getNpcName(nationalSquadView(player), "capitan")}. NUNCA menciones al entrenador ni a los compañeros de tu club.` : ""}

REGLAS CRÍTICAS:
${COMMON_RULES}
${resultInstruction}
${extraInstruction ?? ""}
${stakesInstruction}
- PROHIBIDO ABSOLUTO: mencionar cualquier rival o competición que NO sea "${match.rivalClub}" en "${compLabel[match.competition as keyof typeof compLabel] ?? match.competition}". No inventes otro equipo, otra jornada ni otro torneo — es EL PARTIDO PROGRAMADO, no uno libre. rival_club debe ser exactamente "${match.rivalClub}".
- En el título y la descripción, tu equipo se llama SIEMPRE "${team}" tal cual — NUNCA un nombre genérico o inventado como "Real Club", "tu equipo" o similar.
- El marcador se escribe SIEMPRE en el orden "${team} - ${match.rivalClub}" (tu equipo primero, sin importar si juegas en casa o fuera), y el relato (quién ganó/perdió/empató) tiene que cuadrar aritméticamente con ese marcador — un marcador donde tu primer número es mayor es VICTORIA tuya, no derrota, y viceversa. Revísalo antes de escribir el texto final.
- OBLIGATORIO en la descripción, en este orden: (1) "${match.rivalClub}" y "${compLabel[match.competition as keyof typeof compLabel] ?? match.competition}" tal cual, (2) marcador EXACTO en el orden indicado arriba (ej "2-1"), (3) minutos jugados, (4) tu nota (0-10, decimal), (5) GOLES exactos (0, 1, 2+), (6) asistencias. Crónica MUY corta: 2-3 frases en total y máximo ~60 palabras tras los datos (jugada clave + ambiente + una pincelada del entrenador o la grada, no las tres cosas largas) — que quede clarísimo si metiste gol o no, y si tu equipo ganó, perdió o empató, es el dato más importante de todo el evento.
- FORMATO RECOMENDADO: "Ante ${match.rivalClub} en ${compLabel[match.competition as keyof typeof compLabel] ?? match.competition}, jugaste [X] minutos. Nota: [X.X]/10. Goles: [0/1/2+]. Asistencias: [X]. Marcador: [X-X] (${team}-${match.rivalClub})."
- ${
    (player.stats_matches_played ?? 0) > 0
      ? `PROHIBIDO llamar a esto "debut" o "primer partido" de ninguna forma — ya lleva ${player.stats_matches_played} partido(s) jugados como profesional. Trátalo como un partido más de una carrera en marcha, con el peso narrativo que corresponda a ese momento (racha, presión, rutina, rivalidad concreta), nunca como una primera vez.`
      : `Este SÍ es su primer partido como profesional — aquí sí cabe la palabra "debut".`
  }
- El resultado y rendimiento deben ser coherentes con forma ${player.forma}/100 y media ${player.media}/99 — a veces se pierde, a veces juegas mal o no sales, variación realista. No siempre eres el héroe.
- Las opciones son sobre cómo reaccionas DESPUÉS (prensa, vestuario, redes, autocrítica), no sobre cómo jugar — el partido ya pasó. NO reutilices siempre el mismo cuarteto de reacciones (rueda de prensa / redes / entrenador / entrenar solo) — varía el tipo de reacción según lo que pasó en ESTE partido concreto (un compañero, la familia, un rival directo, la afición local, algo que dijiste tú mismo en el campo...).
- OBLIGATORIO: cada opción lleva el MISMO cambio de media en consequences (el partido ya ocurrió, no depende de la opción elegida). Nota 8+/gol decisivo → +2 a +5. Nota <6 → -1 a -3. Discreto → 0 a +1.
- is_milestone true SOLO si fue excepcional (hat-trick, gol decisivo en el descuento, debut soñado, lesión grave) — no en partidos normales. Si true, escribe image_scene específico de esa acción.`;

  // Solo los partidos que de verdad lo merecen gastan IA (final, ronda decisiva,
  // eliminatoria avanzada, una jugada memorable): el resto se cuenta con la
  // crónica generada en código. Ver ai-budget.ts.
  const importantMatch =
    match.stakes === "decisivo" ||
    (match.cupRound ?? 0) >= 4 ||
    (match.euroKoRound ?? 0) >= 3 ||
    /wondergoal|penalty_conceded|red_card/.test(decisionRaw ?? "") ||
    (match.competition === "internacional" && /FINAL|SEMIFINAL|campe/i.test(extraInstruction ?? ""));
  const event = await callEventTool(prompt, "partido", `matchday-${match.week}`, 1, importantMatch ? "high" : "low");
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
export function weeklySalary(media: number, flags?: Record<string, string | boolean> | null): number {
  const mult = Math.min(6, Math.max(0.1, parseFloat(String(flags?.salary_mult ?? "1")) || 1));
  return Math.round((Math.max(150, Math.max(0, media - 40) ** 2 * 8) * mult) / 10) * 10;
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
    player.patrimonio = (player.patrimonio ?? 0) + playerMonthlyNet(player);
  }
  // Patrocinios firmados: la marca paga cada turno mientras dura el contrato.
  const sponsorIncome = monthlySponsorshipIncome(player.flags, player.week);
  if (sponsorIncome > 0) player.patrimonio = (player.patrimonio ?? 0) + sponsorIncome;
  // Propiedades puestas en alquiler: la renta neta entra cada turno.
  const rentalIncome = totalRentalIncome(player.flags, player.week);
  if (rentalIncome > 0) player.patrimonio = (player.patrimonio ?? 0) + rentalIncome;
  // Cuotas de las hipotecas (finance/mortgage.ts): se descuentan solas cada
  // turno, igual que el sueldo se ingresa. Si no hay dinero, se quedan a 0 y
  // el banco acaba llamando (ver buildDebtTroubleEvent).
  const mortgagePayments = totalMonthlyPayments(player.flags);
  if (mortgagePayments > 0) player.patrimonio = Math.max(0, (player.patrimonio ?? 0) - mortgagePayments);
  // El alquiler de la vivienda en la ciudad del club se paga cada turno.
  const rentPayment = monthlyRent(player.flags);
  if (rentPayment > 0) player.patrimonio = Math.max(0, (player.patrimonio ?? 0) - rentPayment);

  // Aplicar degradación de forma si no ha jugado
  player.forma = naturalFormaDegradation(player);
  // Complicaciones y rachas buenas en curso (states.ts): restan o suman cada turno.
  applyStateTick(player);
  // La prensa devuelve algo cada turno (ver press-system.ts): la tertulia aprieta si vas mal, el diario afín te da fama si vas bien.
  applyPressTick(player);

  // Aplicar declive por edad (si >32 años): UNA vez por temporada (flag age_decl_s), no en cada semana.
  const seasonNow = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  if (String(player.flags?.age_decl_s ?? "") !== String(seasonNow)) {
    if (!player.flags) player.flags = {};
    player.flags.age_decl_s = String(seasonNow);
    const mediaAfterAge = ageBasedMediaDecline(player);
    if (mediaAfterAge < player.media) {
      player.media = mediaAfterAge;
    }
  }
  // Autocorrección: un bug ya corregido en ageBasedMediaDecline dejó
  // partidas reales con media en 0 (por debajo del suelo de 40 que rige
  // en todo el resto del juego). Este clamp repara ese valor corrupto en
  // cuanto la carrera vuelve a pasar por aquí, sin necesitar tocar la
  // base de datos a mano.
  player.media = Math.max(40, Math.min(99, Math.min(player.media, maxMediaForAge(player.week, player.fama ?? 0))));

  // Aplicar deterioro de relaciones
  const relChanges = deteriorateRelationships(player);
  Object.assign(player, relChanges);

  // Presión mediática afecta moral
  const { mortalAfect } = calculateMediaPressure(player);
  if (mortalAfect < 0) {
    player.moral = Math.max(0, (player.moral ?? 50) + mortalAfect);
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
        transitionEvent = buildReadyToRetireEvent(player);
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

  // Liga ganada: la celebración llega en cuanto empieza la temporada siguiente.
  const ligaTitle = pickLigaChampionEvent(playerWithDynamics);
  if (ligaTitle) return ligaTitle;

  // Golden Boy (menores de 21) y Balón de Oro: la gala de invierno, con la lista de diez finalistas.
  const awardKind = awardDue(playerWithDynamics, weekInSeason);
  if (awardKind) {
    const seasonA = Math.floor((playerWithDynamics.week - 1) / 10);
    if (!playerWithDynamics.flags) playerWithDynamics.flags = {};
    playerWithDynamics.flags[`award_${awardKind === "golden_boy" ? "gb" : "bo"}_${seasonA}`] = true;
    return buildAwardEvent(playerWithDynamics, awardKind);
  }

  // Torneo de selecciones (Mundial/Eurocopa/Copa América) al arrancar la
  // temporada de un año de torneo: llega ANTES que la pretemporada, que solo
  // empieza cuando el torneo termina.
  const torneoEvent = await pickTorneoEvent(
    playerWithDynamics,
    history,
    weekInSeason,
    getInjuryRemaining(playerWithDynamics.flags) > 0,
  );
  if (torneoEvent) return torneoEvent;

  // La final de un torneo de selecciones que viste desde casa tras caer eliminado.
  const finalPending = player.flags?.torneo_final_pending;
  if (typeof finalPending === "string" && finalPending) {
    const [ftype, fseason, foutcome] = finalPending.split("|");
    player.flags.torneo_final_pending = "";
    if (ftype === "mundial" || ftype === "eurocopa" || ftype === "copa_america") {
      return buildTorneoFinalEvent(playerWithDynamics, ftype, parseInt(fseason, 10) || 0, foutcome ?? "");
    }
  }

  // Selección entre torneos: Nations League, clasificatorias, amistosos.
  const selEvent = await pickSeleccionWindowEvent(
    playerWithDynamics,
    history,
    weekInSeason,
    getInjuryRemaining(playerWithDynamics.flags) > 0,
  );
  if (selEvent) return selEvent;

  // Lesión en curso: el fisio va tratándote y la cosa se complica o mejora
  // (injury-events.ts) — escenas que cambian los meses de baja que quedan.
  if (shouldTriggerPhysioScene(playerWithDynamics)) {
    const physio = buildPhysioEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Fisio: "${physio.title}"`);
    return physio;
  }

  // Mercado de fichajes (verano y enero): SIEMPRE hay rumor al abrirse
  // cada ventana — ver market-window.ts. Va antes de la pretemporada y
  // de los partidos porque estos eventos no avanzan la semana (ver
  // carrera/actions.ts), así que no se salta ningún partido. Si un rumor
  // resultó ser real, después llega la oferta formal.
  clearStaleTransferInterest(playerWithDynamics);
  maybeSeedTransferInterest(playerWithDynamics);
  // No colarse entre la jugada decisiva y la crónica del MISMO partido.
  const matchDoneKeys = parseMatchDone(playerWithDynamics.flags, playerWithDynamics.week);
  const decisionPrefix = `match_decision_${playerWithDynamics.week}_`;
  const midMatch = Object.keys(playerWithDynamics.flags ?? {}).some(
    (k) => k.startsWith(decisionPrefix) && !matchDoneKeys.includes(k.slice(decisionPrefix.length)),
  );
  // EL CIERRE DE TEMPORADA. Las temporadas se cierran el 1 de julio (turno 1 de la nueva) o, si hay torneo de selecciones
  // en verano, justo cuando acaba el torneo. Tiene que ir ANTES que cualquier otra escena de verano (mercado, fichajes,
  // presentaciones, escenas sueltas): si no, la primera semana se la llevaba otra escena y el resumen salía en septiembre
  // (visto en vivo). Vale durante las primeras semanas de la temporada hasta que se viva, y espera a que acabe un torneo.
  // También va antes que "hay partido esta semana": la primera semana siempre trae un amistoso programado.
  const closingId = `preseason-${season}`;
  const closingPending = weekInSeason <= 4 && season > 0 && age >= 17 && !usedEventIds.includes(closingId) && !getTorneoProgress(playerWithDynamics);
  if (closingPending) {
    console.log(`[pickNextEventDynamic] Cierre de temporada ${season} (turno ${weekInSeason}) para ${player.last_name}, ${age} años`);
    const { generatePreseasoneEvent } = await import("./ai");
    // Sin IA (sin presupuesto o sin respuesta) se usa la versión escrita en código: el cierre no puede faltar nunca.
    let preseasoneEvent = await generatePreseasoneEvent(player, season, history, usedEventIds);
    // La IA no tiene los datos de la temporada que se cierra: si se inventa un partido, un doblete o un resultado, se descarta.
    if (preseasoneEvent) {
      const text = [preseasoneEvent.title, preseasoneEvent.description, ...preseasoneEvent.options.flatMap((o) => [o.label, o.subtitle, o.outcomeText ?? ""])].join(" ");
      // Si el jugador disputó el torneo de selecciones de este verano, la escena no puede decir que lo vio desde casa.
      const playedTorneo = Object.keys(playerWithDynamics.flags ?? {}).some((k) => k === `torneo_started_${season}` || (k.endsWith(`_${season}`) && k.startsWith("torneo_result_")));
      if (playedTorneo && /desde el sofá|desde casa|por televisión|por la tele|como un aficionado|mientras españa|viendo el torneo/i.test(text)) {
        console.log("[pickNextEventDynamic] Cierre de temporada descartado: dice que vio desde casa un torneo que sí jugó");
        preseasoneEvent = null;
      }
      if (preseasoneEvent && /doblete|triplete|hat-?trick|\b\d{1,2}\s*-\s*\d{1,2}\b|semifinal|cuartos de final|la final\b|nos eliminaron|campeones de/i.test(text)) {
        console.log("[pickNextEventDynamic] Cierre de temporada descartado: la IA inventó un partido o resultado");
        preseasoneEvent = null;
      }
    }
    preseasoneEvent = preseasoneEvent ?? buildSeasonCloseEvent(player, season);
    console.log(`[pickNextEventDynamic] Preseason event: "${preseasoneEvent.title}"`);
    return maybeAddFreeText(addMatchContext(preseasoneEvent, player));
  }

  // Los premios de la temporada que se acaba de cerrar (Pichichi, Zamora, mejor jugador…): justo después del resumen de temporada.
  if (!midMatch && !getTorneoProgress(playerWithDynamics) && shouldTriggerSeasonAwards(playerWithDynamics, usedEventIds)) {
    const awardsEvent = buildSeasonAwardsEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Premios de la temporada: "${awardsEvent.title}"`);
    return awardsEvent;
  }
  // El balance de los objetivos de la temporada que se cierra y, después, los de la nueva.
  if (!midMatch && !getTorneoProgress(playerWithDynamics) && shouldTriggerGoalsReview(playerWithDynamics, usedEventIds)) {
    const review = buildGoalsReviewEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Balance de objetivos: "${review.title}"`);
    return review;
  }
  if (!midMatch && !getTorneoProgress(playerWithDynamics) && shouldTriggerSeasonGoals(playerWithDynamics, usedEventIds)) {
    const goalsEvent = buildSeasonGoalsEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Objetivos de temporada: "${goalsEvent.title}"`);
    return goalsEvent;
  }
  // El plan de entrenamiento de la temporada: en qué trabajar (mejora un atributo del perfil).
  if (!midMatch && !getTorneoProgress(playerWithDynamics) && shouldTriggerTrainingPlan(playerWithDynamics, usedEventIds)) {
    const plan = buildTrainingPlanEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Plan de entrenamiento: "${plan.title}"`);
    return plan;
  }
  // Prensa y redes: hitos de seguidores y la primera portada, y de vez en cuando una escena con tus tres medios de siempre.
  if (!midMatch && !getTorneoProgress(playerWithDynamics)) {
    const step = dueFollowersMilestone(playerWithDynamics);
    if (step) {
      console.log(`[pickNextEventDynamic] Seguidores: ${step}`);
      return buildFollowersMilestone(playerWithDynamics, step);
    }
    if (shouldTriggerCover(playerWithDynamics)) {
      console.log("[pickNextEventDynamic] Portada de revista");
      return buildCoverEvent(playerWithDynamics);
    }
    if (shouldTriggerPressScene(playerWithDynamics)) {
      const pressEvent = buildPressScene(playerWithDynamics);
      if (pressEvent) {
        console.log(`[pickNextEventDynamic] Prensa: "${pressEvent.title}"`);
        return pressEvent;
      }
    }
  }
  // Vestuario: una escena con tus compañeros de verdad (el capitán, el rival por tu puesto, el polémico…).
  if (!midMatch && !getTorneoProgress(playerWithDynamics) && shouldTriggerLockerScene(playerWithDynamics)) {
    const lockerEvent = buildLockerScene(playerWithDynamics);
    if (lockerEvent) {
      console.log(`[pickNextEventDynamic] Vestuario: "${lockerEvent.title}"`);
      return lockerEvent;
    }
  }
  // Logros: los de bronce se anotan sin ruido y los de plata y oro salen como una escena breve y compartible.
  if (!midMatch && !getTorneoProgress(playerWithDynamics)) {
    const fresh = newAchievements(playerWithDynamics);
    if (fresh.length > 0) {
      markAchievements(playerWithDynamics, fresh);
      const achievementEvent = buildAchievementEvent(playerWithDynamics, fresh);
      if (achievementEvent) {
        console.log(`[pickNextEventDynamic] Logro: "${achievementEvent.title}"`);
        return achievementEvent;
      }
    }
  }

  // Recién fichado por otro club: lo primero es conocer al míster, al capitán y a alguien del cuerpo técnico.
  if (!midMatch && shouldTriggerArrivalIntro(playerWithDynamics)) {
    const intro = buildArrivalIntroEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Presentación en el club nuevo: "${intro.title}"`);
    return maybeAddFreeText(intro);
  }
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
  // Las escenas cotidianas que ya viviste hace años pueden volver a pasar (bank/select.ts).
  const usedBank = recycleBankScenes(playerWithDynamics, usedEventIds);
  // Las cosas pasan: cada pocos turnos, una complicación (o una racha buena) con efecto real, y alguien que te escribe por redes.
  if (!midMatch && !getTorneoProgress(playerWithDynamics)) {
    const f = (playerWithDynamics.flags ??= {});
    const wk = playerWithDynamics.week;
    const age = playerAge(wk);
    // Los hijos: embarazo y nacimiento (a partir de los 27-29 años, con pareja estable; ver children.ts).
    const childStage = childStageOf(playerWithDynamics);
    if (childStage) {
      const childEvent = buildChildEvent(playerWithDynamics, childStage);
      console.log(`[pickNextEventDynamic] Hijos: "${childEvent.title}"`);
      return maybeAddFreeText(childEvent);
    }
    // Los Juegos Olímpicos del verano que viene (cada cuatro años): aviso para quien puede ir (olympics.ts).
    if (shouldTriggerOlympicPreview(playerWithDynamics, usedEventIds)) {
      const preview = buildOlympicPreviewEvent(playerWithDynamics);
      console.log(`[pickNextEventDynamic] Juegos Olímpicos (aviso): "${preview.title}"`);
      return maybeAddFreeText(preview);
    }
    // Tu pareja está presente: cada pocos turnos, una escena con ella (primero las historias del banco que ya tocan, si no, la vida
    // de cada día: cena, día duro, visita de su madre, cumpleaños…). Ver partner-life.ts.
    if (shouldTriggerPartnerLife(playerWithDynamics)) {
      if (Math.random() < 0.5) {
        const bankPartner = pickBankScene(playerWithDynamics, usedBank, [...PAREJA, ...PAREJA2, ...PAREJA3, ...PAREJA4]);
        if (bankPartner) {
          f.pa_scene_last = String(wk);
          console.log(`[pickNextEventDynamic] Pareja (banco): "${bankPartner.title}"`);
          return maybeAddFreeText(bankPartner);
        }
      }
      const lifeEvent = buildPartnerLifeEvent(playerWithDynamics);
      if (lifeEvent) {
        console.log(`[pickNextEventDynamic] Pareja (vida): "${lifeEvent.title}"`);
        return maybeAddFreeText(lifeEvent);
      }
    }
    // Historia con una chica ya empezada (cita, rumor, «¿qué somos?»): sus escenas tienen prioridad para que la
    // historia no se quede a medias; si lleva demasiados turnos sin avanzar, se enfría y deja paso a otras.
    if (f.ch_en_curso && !f.pareja) {
      const next = pickBankScene(playerWithDynamics, usedBank, CHICAS.filter((s) => !/-dm$/.test(s.id)));
      if (next) {
        f.ch_last_scene = String(wk);
        console.log(`[pickNextEventDynamic] Historia con una chica: "${next.title}"`);
        return maybeAddFreeText(next);
      }
      const lastCh = Math.max(parseInt(String(f.ch_last_dm ?? "0"), 10) || 0, parseInt(String(f.ch_last_scene ?? "0"), 10) || 0);
      if (lastCh > 0 && wk - lastCh > 45) {
        const who = String(f.ch_en_curso);
        f.ch_en_curso = "";
        f[`ch_${who}`] = "";
        f[`ch_${who}_no`] = true;
      }
    }
    // Una chica de las redes: sin pareja ni historia en curso, cada ~7 turnos.
    const lastGirl = parseInt(String(f.ch_last_dm ?? "0"), 10) || 0;
    if (!f.pareja && !f.ch_en_curso && age >= 18 && (playerWithDynamics.fama ?? 0) >= 20 && wk - lastGirl >= 7 && Math.random() < 0.55) {
      const dm = pickBankScene(playerWithDynamics, usedBank, CHICAS.filter((s) => /-dm$/.test(s.id)));
      if (dm) {
        f.ch_last_dm = String(wk);
        console.log(`[pickNextEventDynamic] Chica por redes: "${dm.title}"`);
        return maybeAddFreeText(dm);
      }
    }
    // Una complicación o una racha, si no hay ya un estado en curso.
    const lastEstado = parseInt(String(f.estado_last_week ?? "0"), 10) || 0;
    if (!hasState(f, wk) && wk - lastEstado >= 3 && Math.random() < 0.65) {
      const pool = Math.random() < 0.45 ? [...DISCIPLINA, ...DISCIPLINA2, ...DISCIPLINA3, ...CONVIVENCIA, ...VIDA2, ...CLUB3, ...ESTADOS, ...ESTADOS2] : [...ESTADOS, ...ESTADOS2];
      const ev = pickBankScene(playerWithDynamics, usedBank, pool);
      if (ev) {
        f.estado_last_week = String(wk);
        console.log(`[pickNextEventDynamic] Complicación/racha: "${ev.title}"`);
        return maybeAddFreeText(ev);
      }
    }
  }
  // Lesión grave con decisiones (diagnóstico, mitad de la rehabilitación, el alta y las secuelas): ver injury-saga.ts.
  if (!midMatch && !getTorneoProgress(playerWithDynamics)) {
    if (shouldTriggerSagaStage(playerWithDynamics)) {
      const stage = buildSagaStageEvent(playerWithDynamics);
      console.log(`[pickNextEventDynamic] Lesión grave, fase: "${stage.title}"`);
      return stage;
    }
    if (shouldTriggerSeriousInjury(playerWithDynamics)) {
      const injury = buildSeriousInjuryEvent(playerWithDynamics);
      console.log(`[pickNextEventDynamic] Lesión grave: "${injury.title}"`);
      return injury;
    }
  }
  // El contrato del club: última temporada (renovar, pedir más o salir libre) y fin de contrato.
  if (!midMatch && !getTorneoProgress(playerWithDynamics) && shouldTriggerContractRenewal(playerWithDynamics)) {
    const contract = buildContractRenewalEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Contrato: "${contract.title}"`);
    return contract;
  }
  // Una inversión que ya lleva una temporada: tu representante te dice qué vale hoy y decides mantenerla, venderla o meter más.
  if (!midMatch && !getTorneoProgress(playerWithDynamics) && shouldTriggerInvestmentReview(playerWithDynamics)) {
    const review = buildInvestmentReviewEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Seguimiento de inversión: "${review.title}"`);
    return review;
  }
  // Un patrocinio que acaba de vencer: la marca propone renovar (más o menos según cómo te haya ido) o te dejas ir.
  if (!midMatch && !getTorneoProgress(playerWithDynamics) && shouldTriggerSponsorRenewal(playerWithDynamics)) {
    const renewal = buildSponsorRenewalEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Renovación de patrocinio: "${renewal.title}"`);
    return renewal;
  }
  // Una propiedad con un par de temporadas: tasación al día y decides quedártela, venderla o reformarla.
  if (!midMatch && !getTorneoProgress(playerWithDynamics) && shouldTriggerPropertyReview(playerWithDynamics)) {
    const review = buildPropertyReviewEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Seguimiento de propiedad: "${review.title}"`);
    return review;
  }
  // Una oferta formal ya en marcha (interés de un club + mercado abierto) va antes que cualquier escena suelta: si no, el banco se la comía.
  if (!midMatch && shouldTriggerTransferOffer(playerWithDynamics)) {
    const offer = buildTransferOfferEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Formal transfer offer (prioridad): "${offer.title}"`);
    return maybeAddFreeText(offer);
  }
  // El banco de escenas, antes que el resto del "sabor" (pretemporada, DMs, rarezas): como mucho una por semana
  // (lo limita pickBankScene). Sin este primer intento, el sabor antiguo se llevaba casi todos los huecos y el
  // banco, con cientos de escenas, solo salía ~35 veces por carrera.
  if (!midMatch && !getTorneoProgress(playerWithDynamics) && Math.random() < 0.75) {
    const bankedEarly = pickBankScene(playerWithDynamics, usedBank);
    if (bankedEarly) {
      console.log(`[pickNextEventDynamic] Banco de escenas (prioridad): "${bankedEarly.title}"`);
      return maybeAddFreeText(bankedEarly);
    }
  }
  // La presentación de la camiseta nueva (club en pretemporada; selección el verano antes de un gran torneo): un hito con compañeros.
  if (!midMatch && !getTorneoProgress(playerWithDynamics)) {
    const kit = shouldTriggerNationalKit(playerWithDynamics) ? buildNationalKitEvent(playerWithDynamics) : shouldTriggerClubKit(playerWithDynamics) ? buildClubKitEvent(playerWithDynamics) : null;
    if (kit) {
      console.log(`[pickNextEventDynamic] Camiseta nueva: "${kit.title}"`);
      return kit;
    }
  }
  if (!midMatch && shouldTriggerPreseasonLife(playerWithDynamics)) {
    const pre = buildPreseasonLifeEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Preseason life: "${pre.title}"`);
    return pre;
  }
  if (!midMatch && shouldTriggerRareMishap(playerWithDynamics, usedEventIds)) {
    const mishap = pickRareMishapEvent(usedEventIds);
    if (mishap) {
      console.log(`[pickNextEventDynamic] Rare mishap: "${mishap.title}"`);
      return maybeAddFreeText(mishap);
    }
  }
  // Arcos narrativos de varios capítulos (skill narrativas-futbol): se
  // comprueban antes que los DM/pretemporada normales porque son más
  // escasos y significativos — cada uno solo avanza un capítulo por vez
  // y guarda su propio progreso en player.flags (ver arco-*.ts).
  if (!midMatch && shouldTriggerSalto(playerWithDynamics)) {
    const salto = buildSaltoEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Arco salto: "${salto.title}"`);
    return maybeAddFreeText(salto);
  }
  if (!midMatch && shouldTriggerArcoRival(playerWithDynamics)) {
    const arco = buildArcoRivalEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Arco rival: "${arco.title}"`);
    return maybeAddFreeText(arco);
  }
  if (!midMatch && shouldTriggerArcoHermano(playerWithDynamics)) {
    const arco = buildArcoHermanoEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Arco hermano: "${arco.title}"`);
    return maybeAddFreeText(arco);
  }
  if (!midMatch && shouldTriggerArcoPatrocinador(playerWithDynamics)) {
    const arco = buildArcoPatrocinadorEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Arco patrocinador: "${arco.title}"`);
    return maybeAddFreeText(arco);
  }
  if (!midMatch && shouldTriggerArcoReencuentro(playerWithDynamics)) {
    const arco = buildArcoReencuentroEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Arco reencuentro: "${arco.title}"`);
    return maybeAddFreeText(arco);
  }
  if (!midMatch && shouldTriggerSocialDm(playerWithDynamics)) {
    const dmEvent = buildSocialDmEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Social DM: "${dmEvent.title}"`);
    return dmEvent;
  }
  if (!midMatch && shouldTriggerTransferOffer(playerWithDynamics)) {
    const offer = buildTransferOfferEvent(playerWithDynamics);
    console.log(`[pickNextEventDynamic] Formal transfer offer: "${offer.title}"`);
    return maybeAddFreeText(offer);
  }

  // El progreso de Copa de ESTA temporada (competition-progress.ts) decide
  // si hoy toca una segunda eliminatoria o esa semana queda libre — sin
  // pasarlo aquí, el calendario no tendría forma de saber si el jugador
  // sigue vivo en el torneo.
  const currentSeason = Math.floor((playerWithDynamics.week - 1) / 10);
  let seasonProgress = getSeasonProgress(playerWithDynamics, currentSeason);
  // Red de seguridad: si pasó la fase de grupos europea sin que se decidiera (no jugaste ese partido, un cambio de club…), se decide ahora.
  {
    const weekInSeasonNow = ((playerWithDynamics.week - 1) % 10) + 1;
    if (weekInSeasonNow > 6 && seasonProgress.euro.round === 0 && seasonProgress.euro.alive && !seasonProgress.euro.tied && getEuropeanCompetitionFor(playerWithDynamics.club)) {
      resolveEuroGroupStage(playerWithDynamics, currentSeason, getClubLevel(playerWithDynamics.club));
      seasonProgress = getSeasonProgress(playerWithDynamics, currentSeason);
    }
  }

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
  const scheduledMatch = getMatchThisWeek(playerWithDynamics.week, playerWithDynamics.club, seasonProgress, matchDoneKeys);
  let matchThisWeek = scheduledMatch && scheduledMatch.competition !== "amistoso" ? scheduledMatch : null;
  // Un mes puede traer varios partidos clave: entre el primero y el
  // siguiente se deja pasar UNA escena de vida (el partido no se pierde, ver
  // el bloqueo de semana en carrera/actions.ts), para no encadenar cuatro
  // escenas de partido seguidas.
  const breatherKey = `match_breather_${playerWithDynamics.week}`;
  const matchesPendingThisWeek = matchThisWeek !== null;
  if (matchThisWeek && matchDoneKeys.length > 0 && !playerWithDynamics.flags?.[breatherKey]) {
    if (!playerWithDynamics.flags) playerWithDynamics.flags = {};
    playerWithDynamics.flags[breatherKey] = true;
    matchThisWeek = null;
  }
  // Con una lesión larga en curso el jugador no pisa el campo: el equipo
  // juega igual, pero él lo ve desde la grada (sin jugada ni crónica de IA).
  const injuryMonthsLeft = getInjuryRemaining(playerWithDynamics.flags);
  // ROL en el equipo (role.ts): lo que decides con el entrenador manda sobre
  // lo que juegas. Solo con el primer equipo (no en la cadena de debut).
  const firstTeam = usedEventIds.includes("rookie-debut-oficial");
  const roleInfo = computeRole(playerWithDynamics);
  if (!playerWithDynamics.flags) playerWithDynamics.flags = {};
  if (roleInfo.role !== "apartado" && playerWithDynamics.flags.bench_streak && playerWithDynamics.flags.bench_streak !== "0") {
    playerWithDynamics.flags.bench_streak = "0";
  }
  if (firstTeam && !midMatch && injuryMonthsLeft === 0 && shouldTriggerBenchEscape(playerWithDynamics)) {
    console.log("[pickNextEventDynamic] Rol apartado dos partidos seguidos — el club te pide que busques salida.");
    return buildBenchEscapeEvent(playerWithDynamics);
  }
  if (matchThisWeek && firstTeam && injuryMonthsLeft === 0 && roleInfo.role === "apartado") {
    console.log(`[pickNextEventDynamic] Rol apartado (score ${roleInfo.score.toFixed(1)}) — fuera de la convocatoria.`);
    return { ...buildBenchedMatchEvent(playerWithDynamics, matchThisWeek), matchKey: matchKey(matchThisWeek) };
  }
  if (matchThisWeek && injuryMonthsLeft > 0) {
    console.log(`[pickNextEventDynamic] Match week but player is injured (${injuryMonthsLeft} left) — partido sin él.`);
    return { ...buildInjuredMatchEvent(playerWithDynamics, matchThisWeek, injuryMonthsLeft), matchKey: matchKey(matchThisWeek) };
  }
  if (matchThisWeek) {
    // Antes el partido se resolvía entero de golpe (marcador ya decidido)
    // y el jugador solo podía reaccionar DESPUÉS — nunca decidir nada
    // mientras el balón seguía en juego. Ahora primero se vive el momento
    // decisivo (rematar/pasar/floritura) y solo cuando ya está resuelto
    // se genera la crónica del partido, coherente con esa jugada.
    const decisionFlagKey = `match_decision_${matchThisWeek.week}_${matchKey(matchThisWeek)}`;
    const decisionOutcome = playerWithDynamics.flags?.[decisionFlagKey] as string | undefined;

    // Las jornadas de rutina (nada en juego) solo llevan jugada decisiva en
    // la mitad de los casos — decidido por (jugador, semana) para que sea
    // estable entre turnos; los partidos importantes y decisivos siempre.
    let routineParity = 0;
    for (const ch of `${playerWithDynamics.id}:${matchThisWeek.week}:${matchKey(matchThisWeek)}`) routineParity = (routineParity * 31 + ch.charCodeAt(0)) % 1000003;
    // Un suplente solo vive la jugada decisiva en la minoría de partidos en que entra con peso.
    // Las jornadas de rutina NO llevan jugada decisiva: solo los partidos clave
    // (un grande, un derbi, Copa, Europa, finales) piden una decisión.
    const skipDecisiveMoment =
      matchThisWeek.stakes === "rutina" ||
      (firstTeam && roleInfo.role === "suplente" && matchThisWeek.stakes !== "decisivo" && routineParity % 5 < 3);

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
              { ...specialMoment, id: `matchday-special-${matchThisWeek.week}-${Date.now()}`, rivalClub: matchThisWeek.rivalClub, matchKey: matchKey(matchThisWeek) },
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
    // Copa y las eliminatorias europeas necesitan un resultado decidido en
    // código (ver generateMatchDayEvent): son las competiciones de
    // eliminación directa, donde "seguir vivo" es algo que el juego tiene
    // que recordar entre meses. El nivel del club inclina la balanza.
    const level = getClubLevel(playerWithDynamics.club);
    const levelBonus = level === "grande" ? 0.1 : level === "europeo" ? 0.04 : -0.06;
    const koRound = matchThisWeek.cupRound ?? (matchThisWeek.euroKoRound ? matchThisWeek.euroKoRound + 1 : 0);
    // Octavos, cuartos y semifinal europeos son a doble partido: aquí se juega la
    // VUELTA y el pase se decide por el global, con la ida ya conocida.
    const twoLegRound = matchThisWeek.euroKoRound && matchThisWeek.euroKoRound <= 3 ? matchThisWeek.euroKoRound : 0;
    const leg1 = twoLegRound ? firstLegFor(playerWithDynamics.club, currentSeason, twoLegRound) : null;
    const twoLegRaw = leg1 ? decideTwoLegResult(playerWithDynamics.media, leg1, levelBonus, decisionOutcome) : null;
    let forcedResult: { win: boolean; scoreLine: string } | undefined = twoLegRaw
      ? { win: twoLegRaw.win, scoreLine: twoLegRaw.scoreLine }
      : koRound
        ? decideKnockoutResult(playerWithDynamics.media, koRound, levelBonus, decisionOutcome)
        : undefined;
    const isFinal = matchThisWeek.cupRound === 5 || matchThisWeek.euroKoRound === 4;
    // Tanda de penaltis: escena propia (tira el jugador) y su desenlace inclina el resultado de la tanda.
    let shootoutNote: string | undefined;
    if (forcedResult) {
      const koKey = `${matchThisWeek.week}_${matchKey(matchThisWeek)}`;
      const compName =
        matchThisWeek.competition === "champions" || matchThisWeek.competition === "europa" ? continentalName(playerWithDynamics.club, matchThisWeek.competition) : copaLabel(playerWithDynamics.club);
      const round = isFinal
        ? "Final"
        : matchThisWeek.euroKoRound
          ? (["Octavos de final", "Cuartos de final", "Semifinal"][matchThisWeek.euroKoRound - 1] ?? "Eliminatoria")
          : "Eliminatoria de Copa";
      const settled = settleShootout(playerWithDynamics, koKey, forcedResult, {
        key: koKey,
        team: playerWithDynamics.club,
        rival: matchThisWeek.rivalClub,
        comp: compName,
        regular: "",
        round,
        decisive: isFinal || matchThisWeek.euroKoRound === 3,
        scored: decisionNeedsGoal(decisionOutcome),
      });
      if ("scene" in settled) return settled.scene;
      forcedResult = { win: settled.win, scoreLine: settled.scoreLine };
      if (isPenaltyShootout(settled.scoreLine)) {
        shootoutNote = shootoutInstruction(settled.yo, settled.win, (playerWithDynamics.position ?? "").toLowerCase().includes("portero"), playerWithDynamics.club);
      }
    }
    const twoLeg = twoLegRaw && forcedResult ? { ...twoLegRaw, win: forcedResult.win, scoreLine: forcedResult.scoreLine } : null;
    const tieNote =
      leg1 && twoLeg
        ? `Ida: ${leg1.text}. Global: ${twoLeg.aggregate}${twoLeg.wentToPenalties ? " (a penaltis)" : ""}. ${twoLeg.win ? "Tu equipo pasa de ronda." : "Tu equipo queda eliminado."}`
        : undefined;
    // Último partido de la fase de grupos europea: se decide aquí si pasas
    // de fase, y la crónica tiene que cuadrar con ello.
    let extraInstruction: string | undefined = shootoutNote;
    if (matchThisWeek.euroGroupIndex === 2) {
      const groupQualified = resolveEuroGroupStage(playerWithDynamics, currentSeason, level);
      const compName = continentalName(playerWithDynamics.club, matchThisWeek.competition === "champions" ? "champions" : "europa");
      extraInstruction = groupQualified
        ? `- Era el ÚLTIMO partido de la fase de grupos de la ${compName}: con este resultado tu equipo SE CLASIFICA para las eliminatorias (octavos de final). Que la crónica lo deje claro.`
        : `- Era el ÚLTIMO partido de la fase de grupos de la ${compName}: con este resultado tu equipo QUEDA ELIMINADO de la competición europea. Que la crónica lo deje claro.`;
    }
    if (leg1 && twoLeg && !isPenaltyShootout(twoLeg.scoreLine)) {
      extraInstruction = [extraInstruction, "- NO hubo tanda de penaltis: el pase se decide por el global, no menciones penaltis."].filter(Boolean).join("\n");
    }
    if (leg1 && twoLeg) {
      extraInstruction = [
        extraInstruction,
        `- Es la VUELTA de una eliminatoria a doble partido. En la IDA (${leg1.text}) el resultado fue ${leg1.own}-${leg1.rival} para tu equipo. Esta vuelta termina ${twoLeg.scoreLine} y el GLOBAL es ${twoLeg.aggregate}: tu equipo ${twoLeg.win ? "PASA DE RONDA" : "QUEDA ELIMINADO"}. Cuéntalo con claridad (menciona la ida y el global) aunque el resultado de esta vuelta, por sí solo, parezca decir otra cosa.`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    // Finales (Copa o europea): ganar es un TÍTULO — el contador de títulos lo
    // detecta por el texto, así que se pide expresarlo claramente.
    if (isFinal && forcedResult) {
      extraInstruction = [shootoutNote, forcedResult.win
        ? `- Es una FINAL y tu equipo la GANA: es un TÍTULO. Escribe con claridad que "te proclamas campeón" y "levantas el trofeo". is_milestone debe ser true, con image_scene del momento de levantar el trofeo.`
        : `- Es una FINAL y tu equipo la PIERDE: queda la espina clavada del subcampeón, sin ningún título. NO uses las palabras "campeón" ni "título" para tu equipo.`].filter(Boolean).join("\n");
    }
    if (firstTeam) {
      const roleLine = roleInstruction(roleInfo.role, playerWithDynamics.rel_entrenador ?? 50);
      if (roleLine) extraInstruction = [extraInstruction, roleLine].filter(Boolean).join("\n");
    }
    // Si la IA falla, el partido se resuelve igual con una crónica escrita en
    // código (match-fallback.ts): sin esto la semana se quedaba atascada.
    const matchDayEventRaw =
      (await generateMatchDayEvent(playerWithDynamics, matchThisWeek, history, decisionOutcome, forcedResult, extraInstruction)) ??
      buildFallbackMatchReport({
        player: playerWithDynamics,
        match: matchThisWeek,
        decisionRaw: decisionOutcome,
        forcedScoreLine: forcedResult?.scoreLine,
        forcedWin: forcedResult?.win,
        team: playerWithDynamics.club,
        tieNote,
        firstLeg: leg1 && twoLeg ? { own: leg1.own, rival: leg1.rival, text: leg1.text } : undefined,
      });
    // Contra un antiguo club: la crónica lo nota y, si marcas, no lo celebras (hito).
    const matchDayEvent = matchDayEventRaw ? applyExClubTouch(matchDayEventRaw, playerWithDynamics, matchThisWeek.rivalClub) : matchDayEventRaw;
    if (matchDayEvent) {
      if (forcedResult && matchThisWeek.cupRound) {
        advanceCupProgress(playerWithDynamics, "copa_progress", currentSeason, matchThisWeek.cupRound, forcedResult.win, { opp: matchThisWeek.rivalClub, score: forcedResult.scoreLine });
      } else if (forcedResult && matchThisWeek.euroKoRound) {
        advanceCupProgress(playerWithDynamics, "euro_progress", currentSeason, matchThisWeek.euroKoRound, forcedResult.win, {
          opp: matchThisWeek.rivalClub,
          score: twoLeg ? `${forcedResult.scoreLine} (global ${twoLeg.aggregate})` : forcedResult.scoreLine,
        });
      }
      let finalEvent: GameEvent = { ...matchDayEvent, matchKey: matchKey(matchThisWeek) };
      if (isFinal && forcedResult?.win) {
        const kind: TrofeoKind = matchThisWeek.cupRound === 5 ? "copa" : matchThisWeek.competition === "champions" ? "champions" : "europa";
        finalEvent = withTrophy(finalEvent, kind, playerWithDynamics.club, `${forcedResult.scoreLine} a ${matchThisWeek.rivalClub}`);
      }
      return maybeAddFreeText(addMatchContext(finalEvent, playerWithDynamics));
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
  // La víspera de un partido solo tiene sentido si vas a jugarlo: lesionado o apartado no hay "noche antes".
  const canPlayNextMatch = injuryMonthsLeft === 0 && roleInfo.role !== "apartado";
  if (canPlayNextMatch && !matchesPendingThisWeek && isMatchWeekNext(playerWithDynamics.week, playerWithDynamics.club, seasonProgress)) {
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

  // Apuros con las cuotas de la hipoteca: el banco llama cuando el dinero no da para unos meses.
  if (!midMatch && shouldTriggerDebtTrouble(playerWithDynamics)) {
    console.log("[pickNextEventDynamic] El banco llama por las cuotas.");
    return maybeAddFreeText(buildDebtTroubleEvent(playerWithDynamics));
  }

  // COBRO de un hilo abierto (threads.ts): el favor, la deuda, el rencor, la
  // promesa o el secreto que dejó una decisión vuelve con nombre y apellidos.
  // Va antes que el eco: es más concreto. Sustituye a una escena de IA normal.
  if (!midMatch && injuryMonthsLeft === 0 && !getTorneoProgress(playerWithDynamics) && shouldTriggerThreadPayoff(playerWithDynamics)) {
    const due = pickThreadDue(playerWithDynamics);
    if (due) {
      const payoff = await generateThreadPayoffEvent(playerWithDynamics, due, history);
      if (payoff) {
        console.log(`[pickNextEventDynamic] Cobro de hilo (${due.k} con ${due.who}): "${payoff.title}"`);
        if (!playerWithDynamics.flags) playerWithDynamics.flags = {};
        playerWithDynamics.flags.thread_last_week = String(playerWithDynamics.week);
        playerWithDynamics.flags.hilos = consumeThread(playerWithDynamics.flags, due);
        return maybeAddFreeText({ ...payoff, id: `hilo-${Date.now()}` });
      }
    }
  }

  // ECO de una decisión pasada (ledger.ts): lo que decidiste hace tiempo vuelve
  // a cobrarse. Sustituye a una escena normal de IA (no suma llamadas).
  if (!midMatch && injuryMonthsLeft === 0 && !getTorneoProgress(playerWithDynamics) && shouldTriggerEcho(playerWithDynamics)) {
    const candidate = pickEchoCandidate(playerWithDynamics);
    if (candidate) {
      const echo = await generateEchoEvent(playerWithDynamics, candidate, history);
      if (echo) {
        console.log(`[pickNextEventDynamic] Eco de "${candidate.t}": "${echo.title}"`);
        if (!playerWithDynamics.flags) playerWithDynamics.flags = {};
        playerWithDynamics.flags.echo_last_week = String(playerWithDynamics.week);
        playerWithDynamics.flags.decisiones = consumeEcho(playerWithDynamics.flags, candidate);
        return maybeAddFreeText({ ...echo, id: `echo-${Date.now()}` });
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

  // BANCO DE ESCENAS ENCADENADAS (narrative/bank): escenas escritas a mano que
  // solo salen si encajan con el estado real del jugador y que se desbloquean
  // unas a otras según lo que decidió (corto, medio y largo plazo). Cero coste
  // de IA y la fuente preferida de escenas de vida antes de recurrir a la IA.
  if (!midMatch && !getTorneoProgress(playerWithDynamics)) {
    const banked = pickBankScene(playerWithDynamics, usedBank);
    if (banked) {
      console.log(`[pickNextEventDynamic] Banco de escenas: "${banked.title}"`);
      return maybeAddFreeText(banked);
    }
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
    // Mayoría de las veces: marcas del catálogo (ofertas, pujas, productos con tu nombre, pantallas gigantes). Resto: las escenas fijas de siempre.
    const brandEvent = !midMatch && Math.random() < 0.75 ? pickSponsorEvent(player, usedEventIds) : null;
    if (brandEvent) {
      console.log(`[pickNextEventDynamic] Marcas para ${player.last_name}: "${brandEvent.title}"`);
      return maybeAddFreeText(brandEvent);
    }
    const availableSponsorships = Object.values(SPONSORSHIP_EVENTS).filter(
      (event) => !usedEventIds.includes(event.id) && (event.minFama === undefined || player.fama >= event.minFama)
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

  // Fallback si la IA falla (raramente debería pasar). Antes era un único
  // texto fijo ("Momento de reflexión") — si la IA fallaba varias veces
  // seguidas (un rate limit, una caída puntual), el jugador podía ver
  // literalmente la misma pantalla calcada turno tras turno, justo lo
  // contrario del pilar "nunca texto genérico o de relleno". Con varias
  // variantes, aunque sea un parche de emergencia, no se repite igual dos
  // veces seguidas.
  console.error(
    `[pickNextEventDynamic] CRITICAL: IA generation returned null for ${player.last_name}, returning placeholder fallback`
  );
  // Antes de caer en el relleno genérico, una escena escrita a mano que no se
  // haya vivido y encaje con el estado del jugador (siempre hay decenas).
  const emergencyPool = EVENTS.filter(
    (e) =>
      e.category !== "partido" &&
      !e.priority &&
      !e.requiresFlag &&
      !e.requiresMajorTournament &&
      !usedEventIds.includes(e.id) &&
      (e.minWeek ?? 1) <= playerWithDynamics.week &&
      (e.minMedia === undefined || playerWithDynamics.media >= e.minMedia) &&
      (e.maxMedia === undefined || playerWithDynamics.media <= e.maxMedia) &&
      !e.requiresExternalAgent &&
      isEventCoherentWithState(e, playerWithDynamics),
  );
  if (emergencyPool.length > 0) {
    return maybeAddFreeText(emergencyPool[Math.floor(Math.random() * emergencyPool.length)]);
  }
  const FALLBACK_VARIANTS: GameEvent[] = [
    {
      id: "fallback-reflexion",
      category: "vida",
      title: "Un momento de calma",
      description: "Entre entrenamiento y entrenamiento, te paras un segundo a pensar en dónde estás de tu carrera y hacia dónde quieres llevarla.",
      options: [
        { id: "0", label: "Seguir adelante", subtitle: "Concentrarte en el siguiente partido", consequences: {} },
        { id: "1", label: "Tomarte un respiro", subtitle: "Recuperar antes de seguir", consequences: { moral: 3 } },
      ],
    },
    {
      id: "fallback-rutina",
      category: "entrenamiento",
      title: "Una semana sin sobresaltos",
      description: "No pasa nada digno de mención: entrenas, descansas, cuidas los detalles. A veces una carrera también se construye en las semanas tranquilas.",
      options: [
        { id: "0", label: "Aprovechar para pulir detalles técnicos", subtitle: "Constancia", consequences: { forma: 2 } },
        { id: "1", label: "Desconectar del todo unos días", subtitle: "Cargar pilas", consequences: { moral: 3 } },
      ],
    },
    {
      id: "fallback-vestuario",
      category: "vestuario",
      title: "Una tarde tranquila en el vestuario",
      description: "Nada urgente que resolver hoy: solo el runrún habitual del vestuario, bromas de siempre y la rutina de cualquier semana normal.",
      options: [
        { id: "0", label: "Sumarte al ambiente del grupo", subtitle: "Cohesión", consequences: { rel_vestuario: 2 } },
        { id: "1", label: "Quedarte al margen, concentrado en lo tuyo", subtitle: "A tu rollo", consequences: { forma: 1 } },
      ],
    },
    {
      id: "fallback-casa",
      category: "vida",
      title: "Una noche tranquila en casa",
      description: "Un día sin partido ni entrevistas: por una vez, tu vida se parece a la de cualquiera. Aprovechas para desconectar del fútbol un rato.",
      options: [
        { id: "0", label: "Ponerte al día con la gente que quieres", subtitle: "Vida fuera del campo", consequences: { moral: 3 } },
        { id: "1", label: "Ver vídeos de tu próximo rival", subtitle: "Nunca del todo desconectado", consequences: { media: 1 } },
      ],
    },
  ];
  const variant = FALLBACK_VARIANTS[Math.floor(Math.random() * FALLBACK_VARIANTS.length)];
  return { ...variant, id: `${variant.id}-${Date.now()}` };
}
