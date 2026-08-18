import { clubById } from "./data";
import { flag, note, rel, stat } from "./mutate";
import type { GameEvent, GameState, Interpretation } from "./types";

const nick = (s: GameState) => s.player.nickname || s.player.name.split(" ")[0] || s.player.name;
const club = (s: GameState) => clubById(s.clubId).name;

function conflict(s: GameState, text: string) {
  if (!s.memory.conflicts.includes(text)) s.memory.conflicts.push(text);
}
function promise(s: GameState, text: string) {
  if (!s.memory.promises.includes(text)) s.memory.promises.push(text);
}

/* =========================================================
 * GOSSIP / WTF (dosificado: exige notoriedad)
 * ========================================================= */
const GOSSIP: GameEvent[] = [
  {
    id: "gz_paparazzi",
    kicker: "Prensa rosa",
    title: "Un teleobjetivo en la terraza",
    image: "family",
    category: "gossip",
    requires: (s) => s.fame >= 28,
    text: (s) => `Una revista publica fotos tuyas cenando con amigos a las dos de la mañana. El titular: "La nueva perla del ${club(s)} se relaja demasiado".`,
    choices: [
      { id: "ignorar", label: "Ignorarlo por completo", outcome: "En tres días nadie se acuerda. Casi nadie.", apply: (s) => { stat(s, "fame", 4); rel(s, "coach", -2); } },
      { id: "explicar", label: "Explicar al club que era una cena de cumpleaños", outcome: "El club emite una nota escueta. El míster te cree.", apply: (s) => { rel(s, "coach", 4); stat(s, "fame", 2); } },
      { id: "responder", label: "Responder públicamente al fotógrafo", outcome: "Se convierte en tendencia. La mitad te aplaude; el club, no.", apply: (s) => { stat(s, "fame", 12); rel(s, "fans", 5); rel(s, "coach", -6); conflict(s, "Enfado del club por responder a la prensa"); } },
    ],
  },
  {
    id: "gz_suegra",
    kicker: "WTF",
    title: "La tortilla de la suegra",
    image: "family",
    category: "gossip",
    requires: (s) => s.age >= 18 && s.rel.family >= 40,
    text: () => `Comida familiar el día antes de un partido. La tortilla llevaba doce horas fuera de la nevera. A las cuatro de la mañana tu estómago declara la guerra.`,
    choices: [
      { id: "avisar", label: "Llamar al médico del club de madrugada", outcome: "Suero, cama y baja para el partido. El club lo entiende; la prensa se ríe una semana.", apply: (s) => { stat(s, "fitness", -14); rel(s, "coach", 2); stat(s, "fame", 3); } },
      { id: "callar", label: "Callarte y jugar como puedas", outcome: "Aguantas 38 minutos. Luego el mundo gira demasiado rápido.", apply: (s) => { stat(s, "fitness", -18); stat(s, "form", -10); rel(s, "coach", -5); } },
      { id: "culpar", label: "Contar en el vestuario de quién fue la tortilla", outcome: "Te quedas con el mote de por vida. El grupo llora de risa.", apply: (s) => { rel(s, "dressing", 10); rel(s, "family", -8); stat(s, "morale", 4); } },
    ],
  },
  {
    id: "gz_pelotas",
    kicker: "Vestuario",
    title: "Doscientas pelotas en tu coche",
    image: "locker",
    category: "gossip",
    requires: (s) => s.rel.dressing >= 50 && s.age >= 17,
    text: (s) => `Sales del entrenamiento y tu coche está lleno hasta el techo de balones. En el parabrisas, una nota: "Bienvenido al club, ${nick(s)}".`,
    choices: [
      { id: "risa", label: "Grabarte riéndote y subirlo", outcome: "Dos millones de visualizaciones. Hasta el presidente lo comparte.", apply: (s) => { rel(s, "dressing", 8); stat(s, "fame", 10); stat(s, "morale", 6); } },
      { id: "venganza", label: "Planear una venganza mejor", outcome: "Una semana después, el capitán encuentra su ropa congelada. Leyenda interna.", apply: (s) => { rel(s, "dressing", 12); stat(s, "discipline", -3); } },
      { id: "enfado", label: "Enfadarte de verdad", outcome: "Se hace un silencio incómodo. El grupo aprende a no bromear contigo.", apply: (s) => { rel(s, "dressing", -10); conflict(s, "Reaccionaste mal a una broma del vestuario"); } },
    ],
  },
  {
    id: "gz_mensaje_pareja",
    kicker: "WTF",
    title: "Un mensaje que no era para ti",
    image: "locker",
    category: "gossip",
    requires: (s) => s.fame >= 35 && s.age >= 18,
    text: () => `Te llega un mensaje ambiguo de la pareja de un compañero: "Ayer te vi entrenar. Deberíamos hablar de algo, a solas".`,
    choices: [
      { id: "cortar", label: "Cortarlo de inmediato y contárselo a tu compañero", outcome: "Incómodo durante dos días, respeto para siempre.", apply: (s) => { rel(s, "dressing", 9); stat(s, "discipline", 4); } },
      { id: "ignorar", label: "No contestar y hacer como que no existió", outcome: "Nadie sabe nada. Tú sí.", apply: (s) => { stat(s, "morale", -3); } },
      { id: "quedar", label: "Quedar a escuchar de qué se trata", outcome: "Era para pedirte ayuda con una sorpresa de cumpleaños. Pero alguien os vio y ya hay rumor.", apply: (s) => { stat(s, "fame", 8); rel(s, "dressing", -8); conflict(s, "Rumor con la pareja de un compañero"); } },
    ],
    freeform: {
      prompt: "¿Qué le respondes exactamente?",
      placeholder: "Escribe tu respuesta…",
      reactions: {
        professional: "Contestas con educación y cortando cualquier ambigüedad. Impecable.",
        aggressive: "Le respondes fatal. Capturas de pantalla, vestuario revuelto.",
        humorous: "Le sigues la broma. Se malinterpreta a medias.",
        evasive: "Respondes con vaguedades. El asunto queda abierto.",
      },
    },
    applyFree: (s, i) => {
      if (i.intent === "professional" || i.intent === "conciliatory" || i.intent === "loyal") {
        rel(s, "dressing", 7);
        stat(s, "discipline", 3);
      } else if (i.intent === "aggressive") {
        rel(s, "dressing", -10);
        stat(s, "fame", 6);
        conflict(s, "Mensaje agresivo filtrado");
      } else {
        stat(s, "fame", 4);
        rel(s, "dressing", -3);
      }
    },
  },
  {
    id: "gz_robo",
    kicker: "WTF",
    title: "Te han entrado en casa",
    image: "family",
    category: "gossip",
    requires: (s) => s.fame >= 45,
    text: () => `Vuelves de un desplazamiento y la puerta está forzada. Se han llevado relojes, la consola y, curiosamente, tus botas de estreno.`,
    choices: [
      { id: "denuncia", label: "Denunciar y llevarlo con discreción", outcome: "El club te ayuda con la seguridad. Duermes mal una semana.", apply: (s) => { stat(s, "morale", -8); rel(s, "coach", 2); } },
      { id: "publico", label: "Contarlo públicamente pidiendo respeto", outcome: "Recibes miles de mensajes de apoyo y algún gracioso ofreciéndote botas usadas.", apply: (s) => { stat(s, "fame", 8); rel(s, "fans", 8); stat(s, "morale", -4); } },
    ],
  },
  {
    id: "gz_influencer",
    kicker: "Redes",
    title: "Una influencer te escribe",
    image: "family",
    category: "gossip",
    requires: (s) => s.fame >= 40 && s.age >= 18,
    text: () => `Una creadora con cuatro millones de seguidores te propone aparecer en un vídeo. El club prefiere que no. Tu representante ve dinero.`,
    choices: [
      { id: "aceptar", label: "Aceptar", outcome: "El vídeo revienta. Tu nombre sale de la sección de deportes.", apply: (s) => { stat(s, "fame", 16); rel(s, "coach", -6); rel(s, "agent", 5); } },
      { id: "rechazar", label: "Rechazar por foco deportivo", outcome: "El míster se entera de que dijiste no. Le encanta.", apply: (s) => { rel(s, "coach", 8); stat(s, "discipline", 4); rel(s, "agent", -4); } },
      { id: "aplazar", label: "Aplazarlo a final de temporada", outcome: "Todos contentos y nadie del todo.", apply: (s) => { stat(s, "fame", 4); } },
    ],
  },
  {
    id: "gz_fiesta",
    kicker: "Fuera del campo",
    title: "Fiesta a mitad de temporada",
    image: "locker",
    category: "gossip",
    requires: (s) => s.age >= 18 && s.fame >= 20,
    text: () => `Cumple de un compañero, reservado en un local del centro, dos días antes de un partido importante. Habrá móviles grabando.`,
    choices: [
      { id: "ir_pronto", label: "Ir una hora y marcharte", outcome: "Cumples con el grupo sin comprometerte. Nadie te graba haciendo el ridículo.", apply: (s) => { rel(s, "dressing", 5); stat(s, "discipline", 2); } },
      { id: "quedarse", label: "Quedarte hasta el final", outcome: "Aparecen vídeos a las 5:40 de la mañana. El míster los ve antes que tú.", apply: (s) => { rel(s, "dressing", 8); rel(s, "coach", -10); stat(s, "fitness", -10); stat(s, "fame", 10); conflict(s, "Fiesta filtrada antes de un partido"); } },
      { id: "no_ir", label: "No ir y avisar al capitán", outcome: "Te llaman aburrido. El cuerpo técnico lo apunta en positivo.", apply: (s) => { rel(s, "dressing", -4); rel(s, "coach", 6); } },
    ],
  },
  {
    id: "gz_declaracion",
    kicker: "Prensa",
    title: "Una frase sacada de contexto",
    image: "tunnel",
    category: "press",
    requires: (s) => s.fame >= 30,
    text: (s) => `Dijiste "aquí se aprende mucho, pero uno siempre sueña con más". El titular de mañana: "${nick(s)} admite que quiere irse".`,
    choices: [
      { id: "aclarar", label: "Pedir un directo para aclararlo", outcome: "Lo explicas mirando a cámara. La afición te compra la versión.", apply: (s) => { rel(s, "fans", 6); rel(s, "coach", 3); } },
      { id: "silencio", label: "Silencio absoluto", outcome: "El ruido crece dos días y luego muere solo.", apply: (s) => { rel(s, "fans", -5); stat(s, "fame", 4); } },
    ],
    freeform: {
      prompt: "¿Qué declaras exactamente ante los micrófonos?",
      placeholder: "Escribe lo que dirías en sala de prensa…",
      reactions: {
        professional: "Frases medidas, cero titulares. El jefe de prensa respira.",
        aggressive: "Te encaras con el periodista. Mañana eres portada por otra cosa.",
        loyal: "Reivindicas el escudo. El fondo lo agradece.",
        ambitious: "Reconoces que aspiras a más. Honesto y peligroso a la vez.",
        evasive: "No dices nada concreto. Se interpreta como que hay algo.",
      },
    },
    applyFree: (s, i) => {
      if (i.intent === "loyal") { rel(s, "fans", 12); rel(s, "coach", 5); }
      else if (i.intent === "professional" || i.intent === "conciliatory") { rel(s, "coach", 6); rel(s, "fans", 4); }
      else if (i.intent === "aggressive") { rel(s, "fans", -8); rel(s, "coach", -8); stat(s, "fame", 10); conflict(s, "Bronca pública con la prensa"); }
      else if (i.intent === "ambitious") { stat(s, "fame", 8); rel(s, "fans", -4); rel(s, "agent", 6); }
      else { stat(s, "fame", 3); rel(s, "fans", -2); }
    },
  },
  {
    id: "gz_conflicto_companero",
    kicker: "Vestuario",
    title: "El veterano que no te pasa el balón",
    image: "locker",
    category: "life",
    requires: (s) => s.age >= 17,
    text: () => `Llevas tres partidos desmarcándote y Iván Losada, capitán y 33 años, no te mira ni por casualidad. Hoy te ha gritado por una pérdida que no era tuya.`,
    choices: [
      { id: "hablar", label: "Hablar con él a solas", outcome: "Te escucha en silencio y acaba dándote la mano. Algo cambia.", apply: (s) => { rel(s, "dressing", 8); s.memory.npcs["losada"] = { name: "Iván Losada", role: "Capitán", mood: 60 }; } },
      { id: "encarar", label: "Encararte delante de todos", outcome: "El vestuario se parte en dos bandos. Tú en el pequeño.", apply: (s) => { rel(s, "dressing", -12); rel(s, "coach", -4); conflict(s, "Enfrentamiento con el capitán Iván Losada"); s.memory.npcs["losada"] = { name: "Iván Losada", role: "Capitán", mood: 15 }; } },
      { id: "campo", label: "Callarte y responder jugando", outcome: "Dos asistencias después, te pasa el balón sin mirar.", apply: (s) => { stat(s, "form", 6); stat(s, "discipline", 4); s.memory.npcs["losada"] = { name: "Iván Losada", role: "Capitán", mood: 45 }; } },
    ],
  },
];

/* =========================================================
 * RESPUESTAS LIBRES (mezcladas con opciones cerradas)
 * ========================================================= */
const FREEFORM: GameEvent[] = [
  {
    id: "ff_coach_talk",
    kicker: "Despacho",
    title: "El míster quiere oírte",
    image: "training",
    category: "story",
    priority: 60,
    requires: (s) => s.age >= 16,
    text: (s) => `El entrenador cierra la puerta del despacho. "Antes de decidir el once, quiero saber una cosa: ¿qué crees que puedes darme tú que no me dé otro?" Y se calla, esperando a ${nick(s)}.`,
    choices: [
      { id: "trabajo", label: "Responder con trabajo y humildad", outcome: "Asiente. No promete nada, pero te apunta.", apply: (s) => { rel(s, "coach", 6); stat(s, "discipline", 3); } },
    ],
    freeform: {
      prompt: "¿Qué le respondes al entrenador?",
      placeholder: "Escribe lo que quieras…",
      reactions: {
        professional: "Le hablas de detalles concretos de tu juego. Le gusta que hayas visto vídeo.",
        ambitious: "Le dices que puedes ser el mejor del vestuario. Levanta una ceja.",
        aggressive: "Le contestas mal. La puerta del despacho se abre muy rápido.",
        defiant: "Le exiges minutos. Respeta el carácter, no el momento.",
        conciliatory: "Le dices que aceptas cualquier rol. Cómodo para él, tibio para ti.",
        humorous: "Sueltas una broma. Se ríe, pero no era el día.",
        evasive: "No concretas nada. Se queda igual que estaba.",
      },
    },
    applyFree: (s, i) => {
      if (i.intent === "professional") { rel(s, "coach", 9); stat(s, "form", 3); }
      else if (i.intent === "ambitious") { rel(s, "coach", 3); stat(s, "morale", 6); flag(s, "ambicion_declarada"); }
      else if (i.intent === "defiant") { rel(s, "coach", -4); stat(s, "morale", 4); conflict(s, "Exigiste minutos al entrenador"); }
      else if (i.intent === "aggressive") { rel(s, "coach", -12); flag(s, "nolist"); conflict(s, "Bronca con el entrenador en su despacho"); }
      else if (i.intent === "conciliatory") { rel(s, "coach", 5); }
      else if (i.intent === "humorous") { rel(s, "coach", 1); rel(s, "dressing", 4); }
      else { rel(s, "coach", -2); }
    },
  },
  {
    id: "ff_family_doubt",
    kicker: "Casa",
    title: "La pregunta de tu madre",
    image: "family",
    category: "life",
    requires: (s) => s.age >= 16,
    text: () => `Domingo, cocina, silencio raro. Tu madre deja el paño y pregunta: "¿Y si esto no sale? ¿Qué plan tienes?"`,
    choices: [
      { id: "estudios", label: "Contarle que sigues con los estudios", outcome: "Se queda tranquila. Tú también, aunque no lo digas.", apply: (s) => { rel(s, "family", 8); stat(s, "discipline", 4); } },
    ],
    freeform: {
      prompt: "¿Qué le contestas?",
      placeholder: "Habla con ella…",
      reactions: {
        professional: "Le explicas tu plan con calma. Se apoya en la encimera y respira.",
        loyal: "Le prometes que nunca dejarás de ser el de casa. Se le humedecen los ojos.",
        ambitious: "Le dices que vas a llegar. Te cree a medias, te abraza del todo.",
        aggressive: "Le contestas de mala manera. Se hace un silencio que dura días.",
        evasive: "Cambias de tema. Ella lo nota.",
      },
    },
    applyFree: (s, i) => {
      if (i.intent === "aggressive") { rel(s, "family", -12); stat(s, "morale", -6); conflict(s, "Discusión fuerte en casa"); }
      else if (i.intent === "loyal" || i.intent === "conciliatory") { rel(s, "family", 12); stat(s, "morale", 6); promise(s, "Prometiste a tu familia no olvidar de dónde vienes"); }
      else if (i.intent === "ambitious") { rel(s, "family", 6); stat(s, "morale", 8); }
      else if (i.intent === "evasive") { rel(s, "family", -4); }
      else { rel(s, "family", 8); }
    },
  },
  {
    id: "ff_press_debut",
    kicker: "Sala de prensa",
    title: "Tu primera rueda de prensa",
    image: "tunnel",
    category: "press",
    requires: (s) => s.stage !== "youth" || s.fame >= 25,
    text: () => `Micrófonos, focos y una primera pregunta con trampa: "¿Te ves ya para ser titular indiscutible?"`,
    choices: [
      { id: "humilde", label: "Respuesta de manual: paso a paso", outcome: "Aburrida y perfecta. Nadie escribe nada malo.", apply: (s) => { rel(s, "coach", 4); stat(s, "fame", 3); } },
    ],
    freeform: {
      prompt: "¿Qué contestas al periodista?",
      placeholder: "Tu respuesta en directo…",
      reactions: {
        professional: "Respuesta impecable. El jefe de prensa asiente desde el fondo.",
        ambitious: "Dices que te ves capaz. Titular grande mañana.",
        humorous: "Bromeas y la sala se ríe. Caes bien.",
        aggressive: "Te pones bordado. La sala se queda helada.",
        evasive: "Escapas de la pregunta sin decir nada.",
      },
    },
    applyFree: (s, i) => {
      if (i.intent === "professional") { rel(s, "coach", 6); stat(s, "fame", 5); }
      else if (i.intent === "ambitious") { stat(s, "fame", 12); rel(s, "coach", -3); rel(s, "fans", 4); }
      else if (i.intent === "humorous") { stat(s, "fame", 8); rel(s, "fans", 8); }
      else if (i.intent === "aggressive") { stat(s, "fame", 10); rel(s, "coach", -8); rel(s, "fans", -6); conflict(s, "Mala rueda de prensa"); }
      else { stat(s, "fame", 2); }
    },
  },
  {
    id: "ff_captain_challenge",
    kicker: "Vestuario",
    title: "El grupo espera que hables",
    image: "locker",
    category: "life",
    requires: (s) => s.rel.dressing >= 55 && s.age >= 17,
    text: () => `Tras una derrota fea, el capitán te señala: "El chaval también tiene boca. Di algo tú".`,
    choices: [
      { id: "callar", label: "Bajar la cabeza y no hablar", outcome: "Nadie te lo reprocha. Nadie te recuerda tampoco.", apply: (s) => { stat(s, "morale", -3); } },
    ],
    freeform: {
      prompt: "¿Qué dices delante de todo el vestuario?",
      placeholder: "Habla al grupo…",
      reactions: {
        professional: "Hablas de detalles y de trabajo. Te escuchan de verdad.",
        aggressive: "Repartes culpas a gritos. Dos compañeros no te lo perdonan.",
        conciliatory: "Bajas la tensión y pides unión. Funciona.",
        humorous: "Rompes el ambiente con una broma. Arriesgado, pero cuela.",
        defiant: "Prometes que esto no se repite. Ahora hay que cumplirlo.",
      },
    },
    applyFree: (s, i) => {
      if (i.intent === "aggressive") { rel(s, "dressing", -12); conflict(s, "Repartiste culpas en el vestuario"); }
      else if (i.intent === "conciliatory" || i.intent === "professional") { rel(s, "dressing", 10); rel(s, "coach", 4); }
      else if (i.intent === "defiant") { rel(s, "dressing", 6); promise(s, "Prometiste al vestuario una reacción inmediata"); }
      else if (i.intent === "humorous") { rel(s, "dressing", 5); rel(s, "coach", -2); }
      else { rel(s, "dressing", 1); }
    },
  },
];

export const EXTRA_EVENTS: GameEvent[] = [...GOSSIP, ...FREEFORM];

export function applyFreeFallback(s: GameState, i: Interpretation): void {
  if (i.intent === "aggressive") { stat(s, "discipline", -4); note(s, "Tu respuesta no ayuda.", "bad"); }
  else if (i.intent === "professional") stat(s, "discipline", 2);
}
