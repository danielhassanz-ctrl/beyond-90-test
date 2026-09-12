import { ensureCareerCast, touch } from "./career-life";
import { clubDef } from "./data";
import { ALL_EVENTS } from "./events";
import { note, rel, stat } from "./mutate";
import type { GameEvent, GameState } from "./types";

/**
 * P0 career opening spine.
 *
 * This is deliberately NOT a weighted narrative pool. A 16-year-old has to
 * move through ordinary life, family, representation, signing and adaptation
 * before the football scheduler is allowed to surface a match. The phase is
 * persisted in flags so old saves are not rewound and new saves recover safely.
 */
export const OPENING_MARKER = "opening_v1";
export const OPENING_PHASE = "opening_phase";
export const OPENING_DONE = 10;

export const OpeningPhase = {
  HOME: 0,
  ADVISER: 1,
  CLUB_CHOICE: 2,
  CONTRACT: 3,
  SIGNING: 4,
  COACH: 5,
  PRESEASON: 6,
  CAPTAIN: 7,
  TEAMMATE: 8,
  PHYSIO: 9,
  DONE: OPENING_DONE,
} as const;

const EVENT_BY_PHASE: Partial<Record<number, string>> = {
  [OpeningPhase.HOME]: "opening_home_family",
  [OpeningPhase.ADVISER]: "opening_adviser_choice",
  [OpeningPhase.CONTRACT]: "opening_first_agreement",
  [OpeningPhase.SIGNING]: "opening_signing_day",
  [OpeningPhase.COACH]: "opening_named_coach",
  [OpeningPhase.PRESEASON]: "opening_preseason_adaptation",
  [OpeningPhase.CAPTAIN]: "opening_named_captain",
  [OpeningPhase.TEAMMATE]: "opening_named_teammate",
  [OpeningPhase.PHYSIO]: "opening_named_physio",
};

function phase(s: GameState): number {
  return typeof s.flags[OPENING_PHASE] === "number" ? s.flags[OPENING_PHASE]! : OpeningPhase.DONE;
}

function setPhase(s: GameState, value: number): void {
  s.flags[OPENING_MARKER] = 1;
  s.flags[OPENING_PHASE] = value;

  // The mandatory opening is the canonical first introduction for the persistent
  // people system. Consume the equivalent legacy intro flag at the moment that
  // introduction has actually completed, so normal scheduling cannot introduce
  // the same adviser/coach/captain/teammate/physio a second time. Club-scoped
  // flags may be cleared later by a real transfer; adviser continuity never is.
  if (value === OpeningPhase.CLUB_CHOICE) s.flags["people_adviser_intro"] = 1;
  if (value === OpeningPhase.PRESEASON) s.flags["people_coach_intro"] = 1;
  if (value === OpeningPhase.TEAMMATE) s.flags["people_captain_intro"] = 1;
  if (value === OpeningPhase.PHYSIO) s.flags["people_teammate_intro"] = 1;
  if (value >= OpeningPhase.DONE) {
    s.flags["people_physio_intro"] = 1;
    s.flags["opening_completed"] = 1;
  }
}

function adviserLabel(s: GameState): string {
  const cast = ensureCareerCast(s);
  if (cast.adviserKind === "father") return "tu padre";
  if (cast.adviserKind === "friend") return `${cast.adviser.name}, tu persona de confianza`;
  return `${cast.adviser.name}, tu representante`;
}

function selectAdviser(s: GameState, kind: "agent" | "father" | "friend"): void {
  const cast = ensureCareerCast(s);
  cast.adviserKind = kind;
  if (kind === "father") {
    cast.adviser.name = "Papá";
    cast.adviser.role = "Padre y asesor";
    s.agent.commission = 0;
  } else if (kind === "friend") {
    cast.adviser.name = "Álex Romero";
    cast.adviser.role = "Amigo y asesor";
    s.agent.commission = 0;
  } else {
    if (cast.adviser.name === "Papá" || cast.adviser.name === "Álex Romero") cast.adviser.name = s.agent.name;
    cast.adviser.role = "Representante";
    s.agent.commission = Math.max(7, s.agent.commission || 8);
  }
  cast.adviser.met = true;
  cast.adviser.lastContactScene = s.sceneCount;
  s.agent.present = true;
  s.hasAgent = true;
  s.agent.name = cast.adviser.name;
  s.agentName = cast.adviser.name;
  s.rel.agent = Math.max(s.rel.agent, 48);
}

const OPENING_EVENTS: GameEvent[] = [
  {
    id: "opening_home_family",
    kicker: "Capítulo 1 · Una noche normal",
    title: "Antes del fútbol está tu vida",
    image: "family",
    category: "life",
    family: "opening_home",
    requires: (s) => s.flags[OPENING_MARKER] === 1 && phase(s) === OpeningPhase.HOME,
    text: (s) => `Tienes 16 años y mañana hay clase. En la mesa de casa se habla de notas, horarios y de que varios clubes han preguntado por ti. Tu madre insiste en que una llamada no es una carrera; tu padre recuerda que todavía dependes de ellos para casi todo. Por primera vez el fútbol puede cambiar la vida de toda la familia, pero todavía no ha cambiado nada.`,
    choices: [
      { id: "familia", label: "Decir que no darás ningún paso sin hablarlo en casa", hint: "La familia será una voz fuerte al principio", outcome: "En casa respiran. La oportunidad sigue ahí, pero deja de ser solo tuya.", apply: (s) => { rel(s, "family", 9); stat(s, "discipline", 2); note(s, "Prometiste decidir los primeros pasos junto a tu familia."); setPhase(s, OpeningPhase.ADVISER); } },
      { id: "ambicion", label: "Decir que quieres intentarlo en serio", hint: "Ambición, todavía sin garantías", outcome: "Tu padre asiente, pero te recuerda que querer ser futbolista y serlo son dos cosas distintas.", apply: (s) => { stat(s, "morale", 5); stat(s, "discipline", 1); note(s, "A los 16 dijiste en casa que querías intentarlo de verdad."); setPhase(s, OpeningPhase.ADVISER); } },
      { id: "estudios", label: "Pedir mantener estudios y fútbol mientras sea posible", hint: "Una transición más prudente", outcome: "Acordáis no quemar ninguna puerta todavía. Habrá que cuadrar viajes, clases y entrenamientos.", apply: (s) => { rel(s, "family", 6); stat(s, "discipline", 4); note(s, "Decidiste proteger tu vida normal mientras dabas los primeros pasos."); setPhase(s, OpeningPhase.ADVISER); } },
    ],
  },
  {
    id: "opening_adviser_choice",
    kicker: "Dos días después · Salón de casa",
    title: "¿Quién va a cuidar tu carrera?",
    image: "agent",
    category: "agent",
    family: "opening_adviser",
    requires: (s) => s.flags[OPENING_MARKER] === 1 && phase(s) === OpeningPhase.ADVISER,
    text: (s) => { const c = ensureCareerCast(s); return `${c.adviser.name === "Papá" ? s.agent.name : c.adviser.name} ha preguntado por ti y quiere hablar de los clubes que están llamando. En casa aparece una duda más importante que cualquier escudo: con 16 años, ¿dejas esto en manos de un representante profesional, prefieres que tu padre controle cada paso o eliges a una persona de confianza que crezca contigo?`; },
    choices: [
      { id: "agent", label: "Trabajar con un representante profesional", hint: "Experiencia en contratos y mercado; cobrará comisión", outcome: "Aceptas ayuda profesional, pero dejas claro que la decisión final seguirá siendo tuya y de tu familia.", apply: (s) => { selectAdviser(s, "agent"); const p=ensureCareerCast(s).adviser; touch(p,s,6); note(s, `${p.name} empezó a llevar tu carrera con 16 años.`); setPhase(s, OpeningPhase.CLUB_CHOICE); } },
      { id: "father", label: "Que tu padre lleve tus primeros pasos", hint: "Máxima confianza, menos experiencia profesional", outcome: "Tu padre acepta con una condición: si la carrera crece, pedirá ayuda antes de fingir que sabe lo que no sabe.", apply: (s) => { selectAdviser(s, "father"); rel(s,"family",8); note(s, "Tu padre asumió el papel de asesor al comienzo de tu carrera."); setPhase(s, OpeningPhase.CLUB_CHOICE); } },
      { id: "friend", label: "Confiar en alguien cercano a la familia", hint: "Relación personal; tendrá que demostrar que está preparado", outcome: "Elegís confianza y cercanía. No habrá traje ni gran agencia detrás: tendrá que aprender contigo.", apply: (s) => { selectAdviser(s, "friend"); rel(s,"family",4); note(s, `${ensureCareerCast(s).adviser.name} se convirtió en tu persona de confianza para la carrera.`); setPhase(s, OpeningPhase.CLUB_CHOICE); } },
    ],
  },
  {
    id: "opening_first_agreement",
    kicker: "La oferta sobre la mesa",
    title: "No firmas hasta entenderlo",
    image: "office",
    category: "agent",
    family: "opening_contract",
    requires: (s) => s.flags[OPENING_MARKER] === 1 && phase(s) === OpeningPhase.CONTRACT && !!s.clubId,
    text: (s) => `${adviserLabel(s)} se sienta contigo y abre el acuerdo del ${clubDef(s.clubId).name}. No hay millones: formación, residencia o desplazamientos, objetivos académicos, una pequeña ayuda y la promesa de revisar tu situación si progresas. Te señala tres cosas que sí importan ahora: minutos, plan de desarrollo y facilidad para salir cedido si te atascas.`,
    choices: [
      { id:"minutes", label:"Pedir garantías sobre el plan de minutos", hint:"Prioridad deportiva", outcome:"El club no promete titularidades, pero concreta el camino y las revisiones trimestrales.", apply:(s)=>{s.contract="Acuerdo formativo · prioridad minutos";s.contractYears=2;s.salary=6;rel(s,"agent",5);note(s,"En tu primer acuerdo priorizaste un camino claro hacia minutos.");setPhase(s,OpeningPhase.SIGNING);} },
      { id:"development", label:"Priorizar entrenadores y desarrollo aunque juegues menos", hint:"Más paciencia a corto plazo", outcome:"Aceptas que el primer año puede ser incómodo si el entorno te hace mejor futbolista.", apply:(s)=>{s.contract="Acuerdo formativo · prioridad desarrollo";s.contractYears=2;s.salary=5;stat(s,"discipline",3);note(s,"En tu primer acuerdo priorizaste desarrollo por encima de protagonismo inmediato.");setPhase(s,OpeningPhase.SIGNING);} },
      { id:"exit", label:"Pedir una salida sencilla si el proyecto no funciona", hint:"Proteges tu siguiente paso", outcome:"La cláusula queda anotada. Nadie quiere hablar de marcharse el día que llega, pero alguien tiene que hacerlo.", apply:(s)=>{s.contract="Acuerdo formativo · salida flexible";s.contractYears=2;s.salary=5;rel(s,"agent",4);note(s,"Protegiste una salida futura en tu primer acuerdo.");setPhase(s,OpeningPhase.SIGNING);} },
    ],
  },
  {
    id: "opening_signing_day",
    kicker: "Día de la firma",
    title: "Tu nombre en un papel del club",
    image: "office",
    category: "life",
    family: "opening_signing",
    requires: (s) => s.flags[OPENING_MARKER] === 1 && phase(s) === OpeningPhase.SIGNING && !!s.clubId,
    text: (s) => `No hay presentación ni estadio lleno. Una sala pequeña, una carpeta con el escudo del ${clubDef(s.clubId).name}, una foto para archivo y ${adviserLabel(s)} sentado a tu lado. Tu familia mira más tu cara que el contrato. Esto no te convierte en profesional: solo te abre una puerta.`,
    choices: [
      { id:"family", label:"Pedir una foto solo con tu familia", outcome:"La foto no sale en ningún periódico. En casa acaba enmarcada.", apply:(s)=>{rel(s,"family",8);note(s,"Guardaste la primera firma como un momento familiar, no mediático.");setPhase(s,OpeningPhase.COACH);} },
      { id:"quiet", label:"Firmar y marcharte sin darle más importancia", outcome:"Sales con la carpeta bajo el brazo. Mañana empieza lo difícil.", apply:(s)=>{stat(s,"discipline",3);setPhase(s,OpeningPhase.COACH);} },
      { id:"promise", label:"Decir en casa que esto solo es el principio", outcome:"Suena ambicioso. También te obliga a recordarlo cuando lleguen los primeros meses malos.", apply:(s)=>{stat(s,"morale",4);note(s,"El día de tu primera firma dijiste que aquello solo era el principio.");setPhase(s,OpeningPhase.COACH);} },
    ],
  },
  {
    id: "opening_named_coach",
    kicker: "Primer día · Despacho",
    title: "El entrenador te recibe por tu nombre",
    image: "office",
    category: "club",
    family: "opening_coach",
    requires: (s) => s.flags[OPENING_MARKER] === 1 && phase(s) === OpeningPhase.COACH && !!s.clubId,
    text: (s) => { const c=ensureCareerCast(s); return `${c.coach.name}, entrenador de tu equipo, te espera antes de que pises el césped. "Aquí no me importa quién te representa ni quién te quería. Empiezas detrás de chicos que llevan años en el club. Quiero ver cómo entrenas cuando no eres importante". Por fin tienes una cara y un nombre delante, no una barra de relación.`; },
    choices: [
      { id:"listen", label:"Preguntarle exactamente qué espera de ti", outcome:"Te marca dos objetivos simples para las primeras semanas y promete revisarlos contigo.", apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,7);rel(s,"coach",6);stat(s,"discipline",3);note(s,`${p.name} te dio tus primeros objetivos dentro del club.`);setPhase(s,OpeningPhase.PRESEASON);} },
      { id:"ambitious", label:"Decirle que vienes a competir por un puesto", outcome:"No te frena. Solo responde: “entonces empieza mañana”.", apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,1);stat(s,"morale",3);note(s,`Le dijiste a ${p.name} que no querías pasar por el club de puntillas.`);setPhase(s,OpeningPhase.PRESEASON);} },
      { id:"patient", label:"Decir que tendrás paciencia y aprenderás", outcome:"Valora que no vendas humo. Eso tampoco te garantiza un minuto.", apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,6);rel(s,"coach",5);setPhase(s,OpeningPhase.PRESEASON);} },
    ],
  },
  {
    id: "opening_preseason_adaptation",
    kicker: "Pretemporada · Primera semana",
    title: "Todavía no hay partidos importantes",
    image: "training",
    category: "preseason",
    family: "opening_preseason",
    requires: (s) => s.flags[OPENING_MARKER] === 1 && phase(s) === OpeningPhase.PRESEASON,
    text: (s) => `Tu rutina cambia antes que tu estatus: madrugar, material, gimnasio, rondos, comidas rápidas y volver a casa cansado. El ritmo del entrenamiento te sorprende y el cuerpo técnico corrige detalles que antes nadie miraba. Aún no has jugado un partido oficial y eso es exactamente lo normal.`,
    choices: [
      { id:"extra", label:"Quedarte veinte minutos más a trabajar", outcome:"No te convierte en mejor jugador en una tarde, pero el cuerpo técnico registra el hábito.", apply:(s)=>{stat(s,"discipline",4);stat(s,"fitness",1);rel(s,"coach",3);setPhase(s,OpeningPhase.CAPTAIN);} },
      { id:"observe", label:"Observar a los mayores y preguntar poco", outcome:"Empiezas a entender códigos que nadie explica en una charla.", apply:(s)=>{rel(s,"dressing",3);stat(s,"discipline",2);setPhase(s,OpeningPhase.CAPTAIN);} },
      { id:"home", label:"Irte a casa y recuperar: mañana hay otra sesión", outcome:"Descansar también es parte de empezar bien. En casa vuelves a ser el mismo de hace una semana.", apply:(s)=>{stat(s,"fitness",4);rel(s,"family",3);setPhase(s,OpeningPhase.CAPTAIN);} },
    ],
  },
  {
    id: "opening_named_captain",
    kicker: "Vestuario · Segunda semana",
    title: "El capitán te explica dónde estás",
    image: "locker",
    category: "club",
    family: "opening_captain",
    requires: (s) => s.flags[OPENING_MARKER] === 1 && phase(s) === OpeningPhase.CAPTAIN,
    text: (s) => { const c=ensureCareerCast(s); return `${c.captain.name}, capitán del equipo, mueve tu mochila porque has ocupado el sitio de un veterano. Luego se ríe y se presenta. "Aquí hay bromas, jerarquías y días malos. Si algún día tienes un problema de vestuario, habla antes de montar una película". Ya sabes quién manda cuando el entrenador no está delante.`; },
    choices: [
      { id:"respect", label:"Agradecerle que te lo explique", outcome:"Te guarda su número. No sois amigos todavía, pero ya tienes una puerta dentro del vestuario.", apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,8);rel(s,"dressing",6);note(s,`${p.name} fue el primer veterano que te tendió la mano.`);setPhase(s,OpeningPhase.TEAMMATE);} },
      { id:"joke", label:"Responder con una broma y quitar tensión", outcome:"Se ríe. Dos compañeros que no sabían tu nombre empiezan a usarlo.", apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,5);rel(s,"dressing",7);stat(s,"morale",2);setPhase(s,OpeningPhase.TEAMMATE);} },
      { id:"compete", label:"Decir que has venido a ganarte un sitio, no privilegios", outcome:"Te mira un segundo y asiente. El mensaje le gusta; el tono, ya veremos.", apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,1);stat(s,"discipline",2);setPhase(s,OpeningPhase.TEAMMATE);} },
    ],
  },
  {
    id: "opening_named_teammate",
    kicker: "Comedor · Después de entrenar",
    title: "Aparece tu primer compañero de verdad",
    image: "training",
    category: "life",
    family: "opening_teammate",
    requires: (s) => s.flags[OPENING_MARKER] === 1 && phase(s) === OpeningPhase.TEAMMATE,
    text: (s) => { const c=ensureCareerCast(s); return `${c.teammate.name} se sienta contigo porque también llegó al club sin conocer a casi nadie. Juega cerca de tu zona y algún día puede competir contigo por minutos. Hoy solo te pregunta de dónde eres y si sabes qué autobús vuelve al centro.`; },
    choices: [
      { id:"friend", label:"Hacer piña desde el principio", outcome:"Empieza una relación que podrá sobrevivir —o no— a la competencia por jugar.", apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,9);rel(s,"dressing",6);note(s,`${p.name} fue tu primer aliado de vestuario.`);setPhase(s,OpeningPhase.PHYSIO);} },
      { id:"professional", label:"Ser amable pero mantener distancia", outcome:"Coméis juntos y nada más. Todavía no sabes quién será amigo y quién rival.", apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,2);setPhase(s,OpeningPhase.PHYSIO);} },
      { id:"compete", label:"Decirle que seguramente acabaréis compitiendo", outcome:"Se ríe, aunque la frase queda guardada para cuando lleguen las convocatorias.", apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,-1);note(s,`Desde el principio dijiste a ${p.name} que la amistad no eliminaría la competencia.`);setPhase(s,OpeningPhase.PHYSIO);} },
    ],
  },
  {
    id: "opening_named_physio",
    kicker: "Ciudad deportiva · Reconocimiento",
    title: "El fisio te conoce antes de que te lesiones",
    image: "injury",
    category: "medical",
    family: "opening_physio",
    requires: (s) => s.flags[OPENING_MARKER] === 1 && phase(s) === OpeningPhase.PHYSIO,
    text: (s) => { const c=ensureCareerCast(s); return `${c.physio.name}, fisioterapeuta del equipo, anota movilidad, molestias antiguas y cómo recuperas después de las cargas. "Nos conoceremos mucho si las cosas van mal; prefiero que nos conozcamos ahora que estás sano". Te explica qué señales no debes ocultar por miedo a perder un entrenamiento.`; },
    choices: [
      { id:"trust", label:"Prometer que avisarás cuando algo no vaya bien", outcome:"Empiezas la carrera entendiendo que jugar también depende de saber parar a tiempo.", apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,8);stat(s,"discipline",3);note(s,`${p.name} fijó contigo una rutina de prevención desde la primera pretemporada.`);setPhase(s,OpeningPhase.DONE);} },
      { id:"tough", label:"Decir que prefieres entrenar siempre que puedas", outcome:"No discute. Solo te responde que valentía y estupidez se parecen mucho desde fuera.", apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,-2);stat(s,"morale",2);setPhase(s,OpeningPhase.DONE);} },
      { id:"learn", label:"Pedirle una rutina corta de prevención", outcome:"Te da cinco ejercicios aburridos. Serán más importantes que muchas escenas espectaculares.", apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,10);stat(s,"fitness",4);stat(s,"discipline",3);setPhase(s,OpeningPhase.DONE);} },
    ],
  },
];

let installed = false;
export function installOpeningEvents(): void {
  if (installed) return;
  const ids = new Set(ALL_EVENTS.map((e) => e.id));
  const missing = OPENING_EVENTS.filter((e) => !ids.has(e.id));
  if (missing.length) ALL_EVENTS.unshift(...missing);
  installed = true;
}

/** Called only for a newly-created career. Existing saves never get rewound. */
export function initializeOpening(s: GameState): GameState {
  installOpeningEvents();
  s.flags[OPENING_MARKER] = 1;
  s.flags[OPENING_PHASE] = OpeningPhase.HOME;
  s.flags["opening_completed"] = 0;
  s.pending = { type: "event", eventId: EVENT_BY_PHASE[OpeningPhase.HOME]! };
  s.lastOutcome = null;
  return s;
}

export function openingNeedsClubChoice(s: GameState): boolean {
  return s.flags[OPENING_MARKER] === 1 && phase(s) === OpeningPhase.CLUB_CHOICE && !s.clubId;
}

export function openingInProgress(s: GameState): boolean {
  return s.flags[OPENING_MARKER] === 1 && phase(s) < OpeningPhase.DONE;
}

/**
 * Returns a cloned state with the mandatory next opening event, or null when
 * normal engine scheduling may resume. CLUB_CHOICE intentionally returns a
 * state with no pending card so the shell routes to the offer screen.
 */
export function forceOpeningPending(state: GameState): GameState | null {
  installOpeningEvents();
  if (!openingInProgress(state)) return null;
  const s = JSON.parse(JSON.stringify(state)) as GameState;
  s.lastOutcome = null;
  s.beat = (s.beat ?? 0) + 1;
  const p = phase(s);
  if (p === OpeningPhase.CLUB_CHOICE) {
    s.pending = null;
    return s;
  }
  const eventId = EVENT_BY_PHASE[p];
  if (!eventId) return null;
  s.pending = { type: "event", eventId };
  return s;
}

/**
 * chooseClub() currently advances the generic engine immediately. We discard
 * that speculative pending card, mark the season for a clean replan, and place
 * the first agreement scene in front of the player. No hidden match can survive.
 */
export function afterOpeningClubChoice(s: GameState): GameState {
  installOpeningEvents();
  s.flags[OPENING_MARKER] = 1;
  s.flags[OPENING_PHASE] = OpeningPhase.CONTRACT;
  s.flags["opening_completed"] = 0;
  s.flags["replan"] = 1;
  s.beat = 0;
  s.pending = { type: "event", eventId: EVENT_BY_PHASE[OpeningPhase.CONTRACT]! };
  s.lastOutcome = null;
  return s;
}
