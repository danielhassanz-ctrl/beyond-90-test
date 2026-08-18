import { clubById } from "./data";
import { flag, hasTrait, injure, milestone, note, rel, stat } from "./mutate";
import { npcMood, npcName } from "./npc";
import type { GameEvent, GameState } from "./types";

const nick = (s: GameState) => s.player.nickname || s.player.name.split(" ")[0] || s.player.name;
const club = (s: GameState) => clubById(s.clubId).name;
const short = (s: GameState) => clubById(s.clubId).short;

function conflict(s: GameState, text: string) {
  if (!s.memory.conflicts.includes(text)) s.memory.conflicts.push(text);
}
function promise(s: GameState, text: string) {
  if (!s.memory.promises.includes(text)) s.memory.promises.push(text);
}

/* =========================================================================
 * PRETEMPORADA · escenas de arranque de temporada, variables entre partidas
 * ========================================================================= */
const PRESEASON: GameEvent[] = [
  {
    id: "ps_objetivos",
    kicker: "Pretemporada",
    title: "Objetivos sobre la pizarra",
    image: "office",
    category: "preseason",
    requires: () => true,
    text: (s) =>
      `${npcName(s, "coach")} reúne al grupo el primer día. Pizarra, tres líneas y una pregunta directa: "¿Cuál es tu objetivo esta temporada, ${nick(s)}?"`,
    choices: [
      { id: "minutos", label: "\"Sumar minutos y no fallar cuando me toque.\"", hint: "Realista", outcome: "Asiente. Es la respuesta que espera de alguien que va a jugar.", apply: (s) => { rel(s, "coach", 6); stat(s, "discipline", 3); promise(s, "Prometiste rendir cuando te toque"); } },
      { id: "titular", label: "\"Ser titular indiscutible.\"", hint: "Ambición pública", outcome: "\"Bien. Entonces ya sabes con quién compites.\"", apply: (s) => { rel(s, "coach", 2); stat(s, "morale", 7); npcMood(s, "rival", -8); promise(s, "Prometiste pelear la titularidad"); } },
      { id: "equipo", label: "\"Lo que el equipo necesite.\"", hint: "Vestuario", outcome: "Dos veteranos te miran y aprueban.", apply: (s) => { rel(s, "dressing", 8); rel(s, "coach", 3); } },
    ],
  },
  {
    id: "ps_competencia",
    kicker: "Pretemporada",
    title: "El que juega en tu puesto",
    image: "training",
    category: "preseason",
    requires: () => true,
    text: (s) =>
      `${npcName(s, "rival")} lleva dos años en tu posición y no piensa moverse. En el primer partido de preparación os ponen media parte a cada uno.`,
    choices: [
      { id: "aprender", label: "Pedirle consejo antes del partido", outcome: "Se sorprende, te explica dos detalles y se le quita algo de recelo.", apply: (s) => { npcMood(s, "rival", 12); rel(s, "dressing", 6); stat(s, "overall", 1); } },
      { id: "duelo", label: "Ir a comértelo en los 45 minutos", outcome: "Haces mejor parte. Él lo sabe y no te lo perdona.", apply: (s) => { stat(s, "form", 7); rel(s, "coach", 4); npcMood(s, "rival", -15); conflict(s, "Duelo abierto por el puesto"); } },
      { id: "adaptar", label: "Ofrecerte al míster para otra posición", outcome: "Versatilidad apuntada en la carpeta.", apply: (s) => { rel(s, "coach", 7); flag(s, "polivalente"); } },
    ],
  },
  {
    id: "ps_rumor_fichaje",
    kicker: "Mercado",
    title: "El club busca un fichaje en tu puesto",
    image: "office",
    category: "preseason",
    requires: () => true,
    text: (s) =>
      `La prensa local dice que el ${short(s)} negocia con un futbolista para tu demarcación. Nadie del club te ha dicho nada.`,
    choices: [
      { id: "preguntar", label: "Preguntar directamente al entrenador", outcome: "\"Si viene, compites. Si te sale bien, se sienta él.\" Al menos es honesto.", apply: (s) => { rel(s, "coach", 4); stat(s, "morale", -3); } },
      { id: "agente", label: "Que lo aclare tu representante", outcome: "Llamadas cruzadas. El club se molesta un poco por la presión.", apply: (s) => { rel(s, "agent", 6); rel(s, "coach", -4); } },
      { id: "callar", label: "Callar y responder en el campo", outcome: "Doble sesión durante diez días. El cuerpo técnico lo ve.", apply: (s) => { stat(s, "form", 6); stat(s, "fitness", -4); rel(s, "coach", 5); } },
    ],
    freeform: {
      prompt: "El míster te pregunta qué opinas del posible fichaje. ¿Qué respondes?",
      placeholder: "Escribe tu respuesta…",
      reactions: {
        professional: "Respondes con calma: quien venga, que compita. Nota mental positiva.",
        defiant: "Dejas claro que ese puesto es tuyo. Se hace un silencio raro.",
        humorous: "Lo despachas con una broma. El míster sonríe a medias.",
      },
    },
    applyFree: (s, i) => {
      if (i.intent === "professional" || i.intent === "loyal") rel(s, "coach", 6);
      else if (i.intent === "defiant" || i.intent === "aggressive") { rel(s, "coach", -5); stat(s, "morale", 4); conflict(s, "Discutiste un fichaje en tu puesto"); }
      else stat(s, "morale", 2);
    },
  },
  {
    id: "ps_capitan",
    kicker: "Vestuario",
    title: "La charla del capitán",
    image: "locker",
    category: "preseason",
    requires: (s) => s.age >= 17,
    text: (s) =>
      `${npcName(s, "captain")}, capitán desde hace seis años, te sienta a su lado en el autobús de la gira. "Aquí se sobrevive de dos maneras: currando o cayendo bien. Elige."`,
    choices: [
      { id: "currar", label: "\"Currando.\"", outcome: "\"Buena elección. Mañana a las ocho conmigo en el gimnasio.\"", apply: (s) => { stat(s, "fitness", 7); rel(s, "dressing", 5); npcMood(s, "captain", 10); } },
      { id: "ambas", label: "\"Las dos.\"", outcome: "Se ríe. \"Listo el chaval.\"", apply: (s) => { rel(s, "dressing", 9); stat(s, "morale", 4); npcMood(s, "captain", 6); } },
      { id: "silencio", label: "Encogerte de hombros", outcome: "Se pone los cascos. Primera impresión desperdiciada.", apply: (s) => { rel(s, "dressing", -5); npcMood(s, "captain", -8); } },
    ],
  },
  {
    id: "ps_gira",
    kicker: "Pretemporada",
    title: "Gira de verano",
    image: "travel",
    category: "preseason",
    requires: (s) => s.stage !== "youth",
    text: (s) => `Cinco días de gira con el ${short(s)}: aviones, hoteles y tres amistosos en climas imposibles. También cámaras del club grabando todo.`,
    choices: [
      { id: "profesional", label: "Rutina de descanso estricta", outcome: "Llegas fino a los tres partidos.", apply: (s) => { stat(s, "fitness", 9); rel(s, "coach", 4); rel(s, "dressing", -2); } },
      { id: "grupo", label: "Hacer grupo con los nuevos", outcome: "Cenas largas y un vestuario más unido.", apply: (s) => { rel(s, "dressing", 10); stat(s, "fitness", -3); } },
      { id: "camaras", label: "Aprovechar las cámaras del club", outcome: "Tu clip de la gira acumula visitas.", apply: (s) => { stat(s, "fame", 9); rel(s, "fans", 5); rel(s, "dressing", -3); } },
    ],
  },
  {
    id: "ps_dorsal",
    kicker: "Club",
    title: "El dorsal",
    image: "locker",
    category: "preseason",
    requires: (s) => s.stage !== "youth",
    text: () => `El delegado te da a elegir: un dorsal alto y discreto, o uno bajo que dejó libre un ídolo que se ha marchado.`,
    choices: [
      { id: "historico", label: "Coger el dorsal del ídolo", hint: "Presión y foco", outcome: "Titulares y comparaciones desde el primer día.", apply: (s) => { stat(s, "fame", 10); rel(s, "fans", 6); stat(s, "morale", -4); flag(s, "dorsal_historico"); } },
      { id: "discreto", label: "Un número alto, sin ruido", outcome: "Nadie habla de ti. Perfecto para trabajar.", apply: (s) => { stat(s, "discipline", 4); stat(s, "form", 3); } },
    ],
  },
  {
    id: "ps_fisico",
    kicker: "Pretemporada",
    title: "Tests físicos",
    image: "gym",
    category: "preseason",
    requires: () => true,
    text: (s) => `Primera mañana: yoyó test, saltos, composición corporal. ${npcName(s, "physio")} apunta cada número en una tablet.`,
    choices: [
      { id: "vaciarse", label: "Vaciarte para marcar el mejor registro", outcome: "Récord de la plantilla y agujetas de tres días.", apply: (s) => { stat(s, "fitness", 10); rel(s, "coach", 6); stat(s, "form", -3); } },
      { id: "dosificar", label: "Dosificar para llegar entero a agosto", outcome: "Números medios. Nadie se fija en ti.", apply: (s) => { stat(s, "fitness", 4); } },
      { id: "gimnasio", label: "Pedir un plan individual de fuerza", outcome: "El preparador te diseña algo a medida.", apply: (s) => { stat(s, "overall", 1); stat(s, "fitness", 6); npcMood(s, "physio", 8); } },
    ],
  },
  {
    id: "ps_agente_plan",
    kicker: "Representante",
    title: "Plan de temporada con tu agente",
    image: "agent",
    category: "preseason",
    requires: (s) => s.agent.present,
    text: (s) => `${s.agent.name} abre el portátil en una cafetería: "Este año hay que decidir. O minutos aquí, o buscamos salida en invierno".`,
    choices: [
      { id: "quedarme", label: "\"Me quedo y me lo gano aquí.\"", outcome: "Lo apunta. No le encanta, pero lo respeta.", apply: (s) => { rel(s, "coach", 4); rel(s, "fans", 4); rel(s, "agent", -3); promise(s, "Prometiste ganarte el sitio en el club"); } },
      { id: "escuchar", label: "\"Escucha ofertas, sin ruido.\"", outcome: "Empieza a mover el teléfono con discreción.", apply: (s) => { rel(s, "agent", 8); flag(s, "mercado_abierto"); } },
      { id: "renovar", label: "\"Quiero mejorar contrato.\"", outcome: "Sonríe: es su terreno favorito.", apply: (s) => { rel(s, "agent", 6); flag(s, "quiere_renovar"); } },
    ],
  },
];

/* =========================================================================
 * FÚTBOL · titularidad, rachas, sanciones, cuerpo técnico, club
 * ========================================================================= */
const FOOTBALL: GameEvent[] = [
  {
    id: "f5_suplencia",
    kicker: "Once inicial",
    title: "Fuera del once",
    image: "locker",
    category: "club",
    requires: (s) => s.rel.coach <= 55 && s.stage !== "youth",
    text: (s) => `Pizarra del sábado. Tu nombre no está. ${npcName(s, "rival")} sí. El míster no da explicaciones a nadie.`,
    choices: [
      { id: "hablar", label: "Pedir explicaciones en privado", outcome: "\"Te falta un punto de intensidad sin balón.\" Duro, pero concreto.", apply: (s) => { rel(s, "coach", 3); stat(s, "morale", -3); flag(s, "aviso_intensidad"); } },
      { id: "entrenar", label: "Tragar y entrenar como un animal", outcome: "El sábado siguiente estás en la lista.", apply: (s) => { stat(s, "form", 6); rel(s, "coach", 6); stat(s, "fitness", -4); } },
      { id: "molestar", label: "Mostrar el enfado en el entrenamiento", outcome: "Entrada dura al rondo y bronca delante de todos.", apply: (s) => { rel(s, "coach", -9); rel(s, "dressing", -3); conflict(s, "Enfado público por la suplencia"); } },
    ],
  },
  {
    id: "f5_titular_sorpresa",
    kicker: "Once inicial",
    title: "Titular por sorpresa",
    image: "tunnel",
    category: "club",
    requires: (s) => s.rel.coach >= 55,
    text: (s) => `Charla previa: el míster dice tu nombre en el once. ${npcName(s, "rival")} se queda mirando el suelo. Quedan cuarenta minutos para salir.`,
    choices: [
      { id: "concentrar", label: "Aislarte con los cascos", outcome: "Sales enchufado desde el primer balón.", apply: (s) => { stat(s, "form", 8); stat(s, "morale", 5); } },
      { id: "hablar_rival", label: "Ir a hablar con el que se queda fuera", outcome: "\"Rómpela.\" No lo dice del todo en serio, pero lo dice.", apply: (s) => { rel(s, "dressing", 8); npcMood(s, "rival", 8); stat(s, "form", 3); } },
      { id: "familia", label: "Llamar a casa antes de salir", outcome: "Tu madre no coge el teléfono: ya está en el estadio.", apply: (s) => { rel(s, "family", 8); stat(s, "morale", 6); } },
    ],
  },
  {
    id: "f5_sancion",
    kicker: "Disciplina",
    title: "Expulsión y sanción",
    image: "match",
    category: "club",
    requires: (s) => s.discipline <= 60 && s.stage !== "youth",
    text: () => `Roja directa por una entrada a destiempo en el 71'. Dos partidos de sanción y una llamada del director deportivo.`,
    choices: [
      { id: "disculpa", label: "Pedir perdón públicamente", outcome: "El club agradece la humildad; la afición también.", apply: (s) => { rel(s, "fans", 6); rel(s, "coach", 5); stat(s, "discipline", 5); } },
      { id: "recurso", label: "Que el club recurra la tarjeta", outcome: "El recurso no prospera y queda cara de excusa.", apply: (s) => { rel(s, "coach", -4); stat(s, "fame", 3); } },
      { id: "defender", label: "Defender que fue un lance del juego", outcome: "El vestuario te apoya; el míster no tanto.", apply: (s) => { rel(s, "dressing", 7); rel(s, "coach", -6); stat(s, "discipline", -4); } },
    ],
  },
  {
    id: "f5_capitania",
    kicker: "Vestuario",
    title: "Brazalete inesperado",
    image: "locker",
    category: "club",
    requires: (s) => s.rel.dressing >= 66 && s.age >= 19,
    text: (s) => `Con ${npcName(s, "captain")} lesionado y el segundo capitán fuera de la lista, el míster te pone el brazalete a ti, el más joven del once.`,
    choices: [
      { id: "aceptar", label: "Aceptarlo y tirar del grupo", outcome: "Hablas poco, corres mucho. Suficiente.", apply: (s) => { rel(s, "dressing", 10); rel(s, "coach", 7); stat(s, "morale", 8); milestone(s, "Llevaste el brazalete por primera vez."); } },
      { id: "ceder", label: "Cedérselo a un veterano", outcome: "Gesto muy bien leído en el vestuario.", apply: (s) => { rel(s, "dressing", 12); stat(s, "morale", 3); } },
    ],
  },
  {
    id: "f5_bronca_media_parte",
    kicker: "Vestuario",
    title: "Bronca en el descanso",
    image: "locker",
    category: "club",
    requires: (s) => s.form <= 55,
    text: (s) => `0-2 al descanso. ${npcName(s, "coach")} lanza una botella contra la pared y señala tu banda: "Ahí se está perdiendo el partido".`,
    choices: [
      { id: "aguantar", label: "Aguantar la mirada y salir a por todas", outcome: "Segunda parte de otro nivel. Él no lo reconoce, pero lo apunta.", apply: (s) => { stat(s, "form", 8); rel(s, "coach", 6); } },
      { id: "responder", label: "Responderle delante del grupo", outcome: "Silencio absoluto. Al minuto 46 estás cambiado.", apply: (s) => { rel(s, "coach", -12); rel(s, "dressing", 4); conflict(s, "Contestaste al entrenador en el descanso"); } },
      { id: "hundirse", label: "Bajar la cabeza", outcome: "Sales encogido y te sustituyen en el 60'.", apply: (s) => { stat(s, "form", -7); stat(s, "morale", -6); } },
    ],
  },
  {
    id: "f5_analista",
    kicker: "Cuerpo técnico",
    title: "Sesión de vídeo individual",
    image: "office",
    category: "training",
    requires: () => true,
    text: (s) => `El analista te enseña 22 clips tuyos: en 14 tomas la decisión tarde. ${npcName(s, "assistant")} espera tu reacción.`,
    choices: [
      { id: "aceptar", label: "Pedir una sesión semanal fija", outcome: "En un mes tu primer control mira hacia delante.", apply: (s) => { stat(s, "overall", 2); rel(s, "coach", 5); } },
      { id: "matizar", label: "Explicar por qué decidiste así", outcome: "Discusión táctica sana. Te ganas respeto.", apply: (s) => { rel(s, "coach", 3); stat(s, "morale", 3); } },
      { id: "pasar", label: "Escuchar y olvidarlo", outcome: "Los mismos errores en noviembre.", apply: (s) => { rel(s, "coach", -5); stat(s, "form", -3); } },
    ],
  },
  {
    id: "f5_penaltis",
    kicker: "Entrenamiento",
    title: "¿Quién tira los penaltis?",
    image: "training",
    category: "training",
    requires: (s) => s.player.position !== "POR" && s.stage !== "youth",
    text: () => `El míster hace una tanda para decidir el orden de lanzadores. Tú metes cinco de cinco. El especialista actual falla dos.`,
    choices: [
      { id: "pedirlo", label: "Pedir ser el lanzador", outcome: "Te lo dan. Ahora la presión es tuya.", apply: (s) => { flag(s, "lanzador"); stat(s, "fame", 5); stat(s, "morale", 5); npcMood(s, "rival", -5); } },
      { id: "no", label: "Dejar que siga el de siempre", outcome: "El vestuario respeta la jerarquía.", apply: (s) => { rel(s, "dressing", 7); } },
    ],
  },
  {
    id: "f5_afición_pancarta",
    kicker: "Afición",
    title: "Una pancarta con tu nombre",
    image: "stadium",
    category: "club",
    requires: (s) => s.rel.fans >= 55,
    text: (s) => `En el fondo aparece una pancarta enorme: "${nick(s)}, uno de los nuestros". La cámara la enfoca durante el himno.`,
    choices: [
      { id: "saludar", label: "Ir a aplaudir al fondo al acabar", outcome: "Se convierte en costumbre. Ellos ya son tuyos.", apply: (s) => { rel(s, "fans", 10); stat(s, "morale", 7); } },
      { id: "foco", label: "No darle importancia y centrarte", outcome: "Partido serio, sin gestos.", apply: (s) => { stat(s, "form", 5); rel(s, "coach", 3); } },
    ],
  },
  {
    id: "f5_pitos",
    kicker: "Afición",
    title: "Te pitan al ser sustituido",
    image: "stadium",
    category: "club",
    requires: (s) => s.rel.fans <= 45 && s.stage !== "youth",
    text: (s) => `Minuto 63, cambio. Una parte del ${short(s)} silba. No sabes si te silban a ti o al equipo, pero duele igual.`,
    choices: [
      { id: "aplaudir", label: "Aplaudir a la grada al salir", outcome: "Los silbidos bajan. Alguno hasta se avergüenza.", apply: (s) => { rel(s, "fans", 8); stat(s, "morale", -2); } },
      { id: "gesto", label: "Hacer un gesto de desaprobación", outcome: "Portada al día siguiente. El club te pide contención.", apply: (s) => { rel(s, "fans", -12); stat(s, "fame", 8); rel(s, "coach", -4); conflict(s, "Gesto a la grada tras un cambio"); } },
      { id: "banquillo", label: "Sentarte y taparte con la sudadera", outcome: "Nadie dice nada. Duermes mal.", apply: (s) => { stat(s, "morale", -8); stat(s, "form", -3); } },
    ],
  },
  {
    id: "f5_seleccion",
    kicker: "Selección",
    title: "Llamada de la selección",
    image: "tunnel",
    category: "club",
    requires: (s) => s.overall >= 68 && s.age >= 17,
    text: (s) => `Un correo del club: ${nick(s)}, convocado con la selección sub-21 para la próxima ventana. Dos partidos y 3.000 kilómetros.`,
    choices: [
      { id: "ir", label: "Ir con todo", outcome: "Debutas y vuelves con confianza nueva.", apply: (s) => { stat(s, "fame", 12); stat(s, "morale", 10); stat(s, "fitness", -8); milestone(s, "Convocatoria con la selección."); } },
      { id: "molestia", label: "Alegar una molestia y quedarte", outcome: "El club respira; el seleccionador toma nota.", apply: (s) => { stat(s, "fitness", 6); rel(s, "coach", 6); stat(s, "fame", -3); flag(s, "rechazo_seleccion"); } },
    ],
  },
  {
    id: "f5_renovacion",
    kicker: "Despacho",
    title: "Mesa de renovación",
    image: "office",
    category: "market",
    requires: (s) => !!s.contract && s.overall >= 66,
    text: (s) => `El director deportivo del ${short(s)} pone una propuesta de renovación sobre la mesa. Tu representante lee la cláusula dos veces.`,
    choices: [
      { id: "firmar", label: "Firmar sin discutir", outcome: "Fotos con bufanda y titular de club: 'compromiso'.", apply: (s) => { rel(s, "fans", 8); rel(s, "coach", 5); rel(s, "agent", -4); s.salary = Math.round(s.salary * 1.4) + 60; } },
      { id: "negociar", label: "Negociar mejora y cláusula alta", outcome: "Dos semanas de tira y afloja. Sale mejor contrato.", apply: (s) => { rel(s, "agent", 9); s.salary = Math.round(s.salary * 1.8) + 90; rel(s, "fans", -3); } },
      { id: "esperar", label: "Esperar a ver cómo va la temporada", outcome: "El club guarda la carpeta sin decir nada. Mala señal.", apply: (s) => { rel(s, "coach", -5); flag(s, "renovacion_aplazada"); } },
    ],
    freeform: {
      prompt: "El director deportivo te pregunta qué necesitas para firmar. ¿Qué respondes?",
      placeholder: "Escribe tu respuesta…",
    },
    applyFree: (s, i) => {
      if (i.intent === "ambitious" || i.intent === "defiant") { s.salary = Math.round(s.salary * 1.6) + 70; rel(s, "agent", 6); rel(s, "coach", -2); }
      else if (i.intent === "loyal" || i.intent === "conciliatory") { rel(s, "fans", 8); rel(s, "coach", 6); s.salary = Math.round(s.salary * 1.3) + 40; }
      else stat(s, "morale", 2);
    },
  },
  {
    id: "f5_cesion_invierno",
    kicker: "Mercado",
    title: "Mercado de invierno",
    image: "office",
    category: "market",
    requires: (s) => s.age >= 18 && s.stage !== "youth",
    text: (s) => `31 de enero. Dos clubes preguntan por ti: uno de Segunda que ofrece jugarlo todo, otro de Primera que ofrece banquillo y escaparate.`,
    choices: [
      { id: "segunda", label: "Cesión a Segunda con minutos", outcome: "Barro, viajes largos y treinta partidos.", apply: (s) => { stat(s, "overall", 2); stat(s, "fitness", -4); rel(s, "agent", 6); flag(s, "cedido"); milestone(s, "Cesión de invierno para jugar."); } },
      { id: "primera", label: "Ir a Primera aunque sea suplente", outcome: "Entrenas con jugadores que veías por la tele.", apply: (s) => { stat(s, "fame", 8); stat(s, "overall", 1); rel(s, "coach", -2); } },
      { id: "quedarse", label: "Quedarte y pelear tu sitio", outcome: "El míster valora que no huyas.", apply: (s) => { rel(s, "coach", 8); rel(s, "fans", 5); rel(s, "agent", -5); } },
    ],
  },
  {
    id: "f5_exjugador",
    kicker: "Club",
    title: "Un ídolo en la ciudad deportiva",
    image: "training",
    category: "club",
    requires: (s) => s.stage !== "youth",
    text: (s) => `Un exjugador histórico del ${short(s)} pasa por el entrenamiento y se queda mirando tu sesión de finalización.`,
    choices: [
      { id: "preguntar", label: "Acercarte a preguntarle", outcome: "Media hora de charla y un consejo que no olvidarás.", apply: (s) => { stat(s, "overall", 2); stat(s, "morale", 8); } },
      { id: "impresionar", label: "Intentar impresionarle", outcome: "Fallas tres claras seguidas. Se ríe y te dice que respires.", apply: (s) => { stat(s, "form", -3); rel(s, "dressing", 4); } },
    ],
  },
];

/* =========================================================================
 * PRENSA, PATROCINIO Y VIDA
 * ========================================================================= */
const LIFE: GameEvent[] = [
  {
    id: "l5_rueda_prensa",
    kicker: "Prensa",
    title: "Tu primera rueda de prensa",
    image: "press",
    category: "press",
    requires: (s) => s.fame >= 15,
    text: (s) => `Sala de prensa del ${short(s)}. ${npcName(s, "press")} levanta la mano primero: "¿Te ves preparado para un club más grande?"`,
    choices: [
      { id: "humilde", label: "\"Estoy donde quiero estar.\"", outcome: "Titular limpio y club contento.", apply: (s) => { rel(s, "fans", 7); rel(s, "coach", 5); } },
      { id: "ambicioso", label: "\"Quiero llegar lo más alto posible.\"", outcome: "Se interpreta como aviso de salida.", apply: (s) => { stat(s, "fame", 8); rel(s, "fans", -5); rel(s, "agent", 5); } },
      { id: "esquivar", label: "Esquivar la pregunta con una frase hecha", outcome: "Aburres a la sala. Nadie te cita.", apply: (s) => { stat(s, "fame", -2); rel(s, "coach", 2); } },
    ],
    freeform: {
      prompt: "¿Qué contestas exactamente al periodista?",
      placeholder: "Escribe tu respuesta…",
    },
    applyFree: (s, i) => {
      if (i.intent === "aggressive") { rel(s, "fans", -8); stat(s, "fame", 10); conflict(s, "Encaro a un periodista en rueda de prensa"); }
      else if (i.intent === "humorous") { stat(s, "fame", 7); rel(s, "fans", 5); }
      else if (i.intent === "professional" || i.intent === "loyal") { rel(s, "coach", 6); rel(s, "fans", 5); }
      else stat(s, "fame", 3);
    },
  },
  {
    id: "l5_periodista_critico",
    kicker: "Prensa",
    title: "La columna que te destroza",
    image: "press",
    category: "press",
    requires: (s) => s.fame >= 25,
    text: (s) => `${npcName(s, "press")} publica una columna titulada "Mucho ruido y pocas nueces". Cita tus últimos tres partidos con datos que duelen porque son verdad.`,
    choices: [
      { id: "llamar", label: "Llamarle y pedirle un café", outcome: "Hablas dos horas. La siguiente columna es distinta.", apply: (s) => { npcMood(s, "press", 15); stat(s, "fame", 4); stat(s, "morale", 3); } },
      { id: "redes", label: "Responder en redes", outcome: "Tu respuesta es más comentada que la columna.", apply: (s) => { stat(s, "fame", 12); rel(s, "coach", -5); npcMood(s, "press", -15); } },
      { id: "ignorar", label: "No leerla siquiera", outcome: "Tres compañeros te la reenvían igualmente.", apply: (s) => { stat(s, "morale", -4); stat(s, "discipline", 3); } },
    ],
  },
  {
    id: "l5_patrocinio",
    kicker: "Marca",
    title: "Contrato de botas",
    image: "office",
    category: "market",
    requires: (s) => s.fame >= 30 && s.agent.present,
    text: (s) => `${s.agent.name} trae una oferta de una marca deportiva: material gratis, dinero decente y cuatro días de rodaje en verano.`,
    choices: [
      { id: "firmar", label: "Firmar el contrato completo", outcome: "Dinero, botas y una sesión de fotos eterna.", apply: (s) => { stat(s, "fame", 10); rel(s, "agent", 8); s.salary += 40; stat(s, "fitness", -3); } },
      { id: "material", label: "Aceptar solo el material", outcome: "Menos dinero, cero obligaciones.", apply: (s) => { stat(s, "fame", 3); rel(s, "agent", -3); stat(s, "form", 3); } },
      { id: "rechazar", label: "Rechazar: aún no toca", outcome: "Tu agente pone los ojos en blanco.", apply: (s) => { rel(s, "agent", -7); rel(s, "coach", 4); } },
    ],
  },
  {
    id: "l5_barrio",
    kicker: "Vida",
    title: "Vuelta al barrio",
    image: "family",
    category: "life",
    requires: () => true,
    text: (s) => `En el campo de tierra donde empezaste te piden que des una charla a los alevines. Nadie va a pagarte y el sábado juegas fuera.`,
    choices: [
      { id: "ir", label: "Ir aunque sea contrarreloj", outcome: "Cincuenta niños y un nudo en la garganta.", apply: (s) => { rel(s, "fans", 9); rel(s, "family", 7); stat(s, "morale", 8); stat(s, "fitness", -3); } },
      { id: "video", label: "Grabarles un vídeo", outcome: "Lo ponen en la pantalla del club. Aplauden igual.", apply: (s) => { rel(s, "fans", 4); stat(s, "fame", 3); } },
      { id: "no", label: "Decir que no puedes", outcome: "Lo entienden. Tu tío no tanto.", apply: (s) => { rel(s, "family", -6); stat(s, "fitness", 4); } },
    ],
  },
  {
    id: "l5_pareja",
    kicker: "Vida",
    title: "Una relación y un calendario imposible",
    image: "family",
    category: "life",
    requires: (s) => s.age >= 18,
    text: (s) => `${npcName(s, "partner")} lleva meses aguantando concentraciones, viajes y cenas canceladas. Hoy te lo dice claro: "¿Yo dónde estoy en tu lista?"`,
    choices: [
      { id: "priorizar", label: "Bloquear dos días a la semana pase lo que pase", outcome: "Vives mejor. Duermes mejor. Juegas mejor.", apply: (s) => { rel(s, "family", 12); stat(s, "morale", 10); stat(s, "fitness", -2); promise(s, "Prometiste tiempo a tu pareja"); } },
      { id: "sincerar", label: "Ser honesto: este año toca sacrificarlo todo", outcome: "Lo acepta a medias. La distancia crece.", apply: (s) => { rel(s, "family", -8); stat(s, "form", 5); } },
      { id: "cortar", label: "Dejarlo", outcome: "Semana horrible, cabeza despejada después.", apply: (s) => { rel(s, "family", -12); stat(s, "morale", -10); stat(s, "form", 6); flag(s, "soltero"); } },
    ],
    freeform: {
      prompt: "¿Qué le dices?",
      placeholder: "Escribe tu respuesta…",
    },
    applyFree: (s, i) => {
      if (i.intent === "conciliatory" || i.intent === "loyal") { rel(s, "family", 10); stat(s, "morale", 6); }
      else if (i.intent === "aggressive" || i.intent === "defiant") { rel(s, "family", -12); stat(s, "morale", -6); }
      else if (i.intent === "evasive" || i.intent === "empty") { rel(s, "family", -5); }
      else rel(s, "family", 3);
    },
  },
  {
    id: "l5_dinero",
    kicker: "Vida",
    title: "El primer dinero de verdad",
    image: "family",
    category: "life",
    requires: (s) => s.salary >= 80,
    text: () => `Primera nómina con varios ceros. Tu padre sugiere ahorrar; un amigo, invertir en un negocio de un conocido; tú miras coches por la noche.`,
    choices: [
      { id: "ahorrar", label: "Ahorrar casi todo", outcome: "Aburrido y sensato. Tu familia respira.", apply: (s) => { rel(s, "family", 9); stat(s, "discipline", 4); } },
      { id: "coche", label: "Comprarte el coche", outcome: "Cuatro fotos en redes y bromas en el vestuario.", apply: (s) => { stat(s, "fame", 7); rel(s, "dressing", 4); rel(s, "family", -5); } },
      { id: "invertir", label: "Invertir en el negocio del amigo", outcome: "Puede salir bien. O muy mal.", apply: (s) => { if (Math.random() < 0.45) { note(s, "La inversión sale bien: tranquilidad económica.", "good"); stat(s, "morale", 8); } else { note(s, "La inversión se hunde y te llevas un disgusto caro.", "bad"); stat(s, "morale", -10); rel(s, "family", -6); } } },
    ],
  },
  {
    id: "l5_paparazzi_playa",
    kicker: "Prensa rosa",
    title: "Fotos en la playa",
    image: "press",
    category: "gossip",
    requires: (s) => s.fame >= 38,
    text: () => `Un programa emite imágenes tuyas en la playa en pleno mes de febrero. Era tu día libre y estabas con familia, pero el rótulo dice "vacaciones en plena crisis".`,
    choices: [
      { id: "aclarar", label: "Aclararlo con el club por delante", outcome: "El club emite un comunicado seco y el tema muere.", apply: (s) => { rel(s, "coach", 5); stat(s, "fame", 3); } },
      { id: "humor", label: "Publicar una foto tuya en el gimnasio a las 7:00", outcome: "Zasca perfecto. El vestuario lo celebra.", apply: (s) => { stat(s, "fame", 10); rel(s, "dressing", 6); rel(s, "fans", 5); } },
      { id: "nada", label: "No hacer nada", outcome: "Tres días de ruido y a otra cosa.", apply: (s) => { stat(s, "morale", -3); } },
    ],
  },
  {
    id: "l5_mascota",
    kicker: "WTF",
    title: "La mascota del club te muerde",
    image: "stadium",
    category: "gossip",
    requires: (s) => s.fame >= 18,
    text: () => `Acto promocional. El becario dentro del disfraz de la mascota tropieza, cae encima de ti y te deja un moratón absurdo en el gemelo.`,
    choices: [
      { id: "reir", label: "Subirlo tú mismo a redes", outcome: "Vídeo del mes. El becario se hace famoso.", apply: (s) => { stat(s, "fame", 9); rel(s, "fans", 6); stat(s, "fitness", -3); } },
      { id: "medico", label: "Ir directo al médico", outcome: "Nada grave, pero pierdes la sesión del día.", apply: (s) => { stat(s, "fitness", -2); rel(s, "coach", 2); } },
    ],
  },
  {
    id: "l5_movil_perdido",
    kicker: "WTF",
    title: "Tu móvil aparece en el césped",
    image: "locker",
    category: "gossip",
    requires: (s) => s.rel.dressing >= 45,
    text: () => `Alguien ha enterrado tu móvil en el área pequeña, dentro de una bolsa hermética, con nota: "Estaba sonando en la charla táctica".`,
    choices: [
      { id: "asumir", label: "Asumirlo y pagar la multa del vestuario", outcome: "Cena a cuenta tuya y tema cerrado.", apply: (s) => { rel(s, "dressing", 8); stat(s, "discipline", 3); } },
      { id: "buscar", label: "Buscar al culpable", outcome: "Nadie lo confiesa. Te quedas con cara de novato.", apply: (s) => { rel(s, "dressing", -5); } },
    ],
  },
];

/* =========================================================================
 * MÉDICO / RECUPERACIÓN
 * ========================================================================= */
const MEDICAL: GameEvent[] = [
  {
    id: "m5_molestia",
    kicker: "Servicios médicos",
    title: "Una molestia que no se va",
    image: "gym",
    category: "medical",
    requires: (s) => !s.injury && s.fitness <= 68,
    text: (s) => `${npcName(s, "physio")} te mira el isquio: "Esto, si sigues forzando, revienta. Y si paras dos semanas, no pasa nada".`,
    choices: [
      { id: "parar", label: "Parar dos semanas", outcome: "Pierdes el sitio un tiempo, salvas la temporada.", apply: (s) => { stat(s, "fitness", 14); rel(s, "coach", -3); stat(s, "form", -4); npcMood(s, "physio", 10); } },
      { id: "infiltrar", label: "Jugar con infiltración", outcome: "Juegas. El isquio pasa factura después.", apply: (s) => { stat(s, "form", 5); rel(s, "coach", 6); stat(s, "fitness", -12); if (Math.random() < 0.35) injure(s, 6, "Rotura del isquiotibial"); } },
      { id: "gestion", label: "Gestionar cargas con el preparador", outcome: "Menos minutos, cero riesgo.", apply: (s) => { stat(s, "fitness", 8); rel(s, "coach", 2); } },
    ],
  },
  {
    id: "m5_rehab",
    kicker: "Recuperación",
    title: "Solo en el gimnasio",
    image: "gym",
    category: "medical",
    requires: (s) => !!s.injury,
    text: (s) => `Mientras el grupo entrena fuera, tú llevas 40 minutos de bicicleta mirando la pared. ${npcName(s, "physio")} te corrige la postura sin decir nada.`,
    choices: [
      { id: "disciplina", label: "Cumplir el plan al milímetro", outcome: "Vuelves antes de lo previsto y sin secuelas.", apply: (s) => { stat(s, "fitness", 10); stat(s, "discipline", 6); npcMood(s, "physio", 12); if (s.injury) s.injury.matchesOut = Math.max(1, s.injury.matchesOut - 1); } },
      { id: "forzar", label: "Adelantar plazos por tu cuenta", outcome: "Recaída pequeña y bronca médica.", apply: (s) => { stat(s, "fitness", -8); npcMood(s, "physio", -12); if (s.injury) s.injury.matchesOut += 2; } },
      { id: "cabeza", label: "Trabajar la cabeza con el psicólogo", outcome: "Sales del pozo mental antes que del físico.", apply: (s) => { stat(s, "morale", 12); stat(s, "fitness", 4); } },
    ],
  },
];

export const PHASE5_EVENTS: GameEvent[] = [...PRESEASON, ...FOOTBALL, ...LIFE, ...MEDICAL];
export const PRESEASON_IDS = PRESEASON.map((e) => e.id);

/** Rasgos: pequeño sesgo narrativo reutilizable por el selector. */
export function traitAffinity(s: GameState, category: string): number {
  if (hasTrait(s, "ambicioso") && (category === "market" || category === "agent")) return 1.35;
  if (hasTrait(s, "leal") && category === "club") return 1.3;
  if (hasTrait(s, "rebelde") && category === "gossip") return 1.35;
  if (hasTrait(s, "familiar") && category === "life") return 1.3;
  if (hasTrait(s, "profesional") && category === "training") return 1.3;
  if (hasTrait(s, "carismatico") && category === "press") return 1.3;
  return 1;
}
