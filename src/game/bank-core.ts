import { clubById } from "./data";
import { flag, milestone, note, rel, stat } from "./mutate";
import { npcMood, who } from "./npc";
import { ensureFinance } from "./finance";
import type { GameEvent, GameState } from "./types";

/* =========================================================================
 * BANCO NÚCLEO (reconstrucción narrativa)
 * Escenas de una sola vez por carrera (oncePerCareer vía flag), organizadas
 * en familias y arcos de 2-4 capítulos: puesto en disputa, cesión, renovación,
 * primer país extranjero, afición en contra, agente como personaje, dinero,
 * familia y humor. Los NPC siempre aparecen con nombre + rol.
 * ========================================================================= */

const nick = (s: GameState) => s.player.nickname || s.player.name.split(" ")[0] || s.player.name;
const club = (s: GameState) => clubById(s.clubId).name;
const short = (s: GameState) => clubById(s.clubId).short;
const on = (s: GameState, k: string) => (s.flags[k] ?? 0) === 1;
const cash = (s: GameState) => ensureFinance(s).cash;
const conflict = (s: GameState, t: string) => {
  if (!s.memory.conflicts.includes(t)) s.memory.conflicts.push(t);
};
const promise = (s: GameState, t: string) => {
  if (!s.memory.promises.includes(t)) s.memory.promises.push(t);
};

export const BANK_CORE: GameEvent[] = [
  /* ================= ARCO · EL RIVAL POR EL PUESTO ================= */
  {
    id: "bc_rival_1",
    kicker: "Vestuario · Capítulo 1",
    title: "Alguien más para tu puesto",
    image: "training",
    category: "club",
    family: "arc_rival",
    requires: (s) => s.age >= 17 && !on(s, "rival_1"),
    text: (s) =>
      `El club ha firmado a un jugador de tu posición. ${who(s, "rival")} llega con dos años más, un vídeo de recopilatorio en internet y el saludo demasiado firme. En el primer rondo ya está pidiendo el balón donde lo pides tú.`,
    choices: [
      {
        id: "medir",
        label: "Medirte con él en cada ejercicio",
        hint: "Competir de frente",
        outcome: "Terminas el entrenamiento reventado y el cuerpo técnico toma nota de los dos.",
        apply: (s) => { flag(s, "rival_1"); flag(s, "rival_competir"); stat(s, "form", 5); stat(s, "fitness", -6); npcMood(s, "rival", -10); },
      },
      {
        id: "acoger",
        label: "Enseñarle la ciudad y ayudarle a instalarse",
        hint: "Ganar el vestuario",
        outcome: "Se lo cuenta al grupo. Ahora competir contra ti le cuesta un poco más.",
        apply: (s) => { flag(s, "rival_1"); flag(s, "rival_amistad"); rel(s, "dressing", 9); npcMood(s, "rival", 14); },
      },
      {
        id: "hablar",
        label: `Preguntar a ${who(s, "coach")} qué significa esa firma`,
        hint: "Directo al despacho",
        outcome: "\"Significa que hay competencia. Eso no es un castigo\", responde sin apartar la vista del portátil.",
        apply: (s) => { flag(s, "rival_1"); flag(s, "rival_pregunta"); rel(s, "coach", 3); stat(s, "morale", -4); },
      },
    ],
  },
  {
    id: "bc_rival_2",
    kicker: "Vestuario · Capítulo 2",
    title: "El once del sábado",
    image: "locker",
    category: "club",
    family: "arc_rival",
    requires: (s) => on(s, "rival_1") && !on(s, "rival_2"),
    text: (s) =>
      `La pizarra está escrita. Tu nombre no está entre los once y el de ${who(s, "rival")} sí. Nadie dice nada, todos lo han leído. Quedan cuarenta minutos de charla y toda una semana por delante.`,
    choices: [
      {
        id: "aplaudir",
        label: "Aplaudir el trabajo del equipo y callar",
        outcome: "Tu silencio se interpreta como madurez. Por ahora.",
        apply: (s) => { flag(s, "rival_2"); rel(s, "coach", 5); rel(s, "dressing", 4); stat(s, "morale", -6); },
      },
      {
        id: "encarar",
        label: "Pedir explicaciones delante de todos",
        outcome: "El míster corta la charla. Lo que has dicho ya no se puede recoger.",
        apply: (s) => { flag(s, "rival_2"); flag(s, "rival_ruptura"); rel(s, "coach", -12); rel(s, "dressing", -5); conflict(s, "Encaraste al entrenador por el once"); },
      },
      {
        id: "entrenar",
        label: "Quedarte a tirar cincuenta balones al acabar",
        outcome: "El utillero apaga las luces cuando te vas. Alguien lo cuenta.",
        apply: (s) => { flag(s, "rival_2"); flag(s, "rival_trabajo"); stat(s, "form", 6); stat(s, "discipline", 8); rel(s, "coach", 4); },
      },
    ],
  },
  {
    id: "bc_rival_3",
    kicker: "Vestuario · Capítulo 3",
    title: "Se lesiona él",
    image: "injury",
    category: "club",
    family: "arc_rival",
    requires: (s) => on(s, "rival_2") && !on(s, "rival_3"),
    text: (s) =>
      `${who(s, "rival")} se queda en el suelo en un rondo tonto. Rodilla. Se lo llevan en coche y el vestuario se queda mudo. Tú tienes el puesto y una sensación difícil de nombrar.`,
    choices: [
      {
        id: "clinica",
        label: "Ir a la clínica a esperar el resultado con él",
        outcome: "Sales de allí a las once de la noche. Él no lo va a olvidar.",
        apply: (s) => { flag(s, "rival_3"); rel(s, "dressing", 10); npcMood(s, "rival", 20); stat(s, "morale", 3); promise(s, `Acompañaste a ${who(s, "rival")} en su lesión`); },
      },
      {
        id: "aprovechar",
        label: "Centrarte en aprovechar tu momento",
        outcome: "Marcas el sábado. Nadie te reprocha nada en voz alta.",
        apply: (s) => { flag(s, "rival_3"); flag(s, "rival_frio"); stat(s, "form", 8); rel(s, "dressing", -6); },
      },
      {
        id: "dedicar",
        label: "Dedicarle el próximo gol en público",
        outcome: "La imagen da la vuelta a las redes y a la sala de prensa.",
        apply: (s) => { flag(s, "rival_3"); stat(s, "fame", 7); rel(s, "fans", 8); npcMood(s, "rival", 12); },
      },
    ],
  },

  /* ================= ARCO · CESIÓN ================= */
  {
    id: "bc_loan_1",
    kicker: "Mercado · Capítulo 1",
    title: "Te ofrecen salir cedido",
    image: "office",
    category: "market",
    family: "arc_cesion",
    requires: (s) => s.age >= 18 && s.stage !== "youth" && !on(s, "loan_1") && (s.rel.coach < 55 || s.overall < 66),
    text: (s) =>
      `El director deportivo del ${club(s)} lo dice sin rodeos: aquí vas a jugar poco. Hay un equipo de Segunda que te quiere todo el año y garantiza minutos. Es un paso al lado que puede ser un paso adelante o el principio de desaparecer.`,
    choices: [
      {
        id: "aceptar",
        label: "Aceptar la cesión y jugar",
        hint: "Minutos por encima del escudo",
        outcome: "Firmas y haces la maleta. La ciudad no sale en los reportajes bonitos.",
        apply: (s) => { flag(s, "loan_1"); flag(s, "cedido"); stat(s, "morale", -3); rel(s, "agent", 5); note(s, "Aceptas salir cedido para jugar.", "neutral"); },
      },
      {
        id: "quedarme",
        label: "Quedarte y pelear el puesto aquí",
        hint: "Riesgo de temporada en blanco",
        outcome: "\"Es tu decisión, pero no te voy a regalar nada\", te avisan.",
        apply: (s) => { flag(s, "loan_1"); flag(s, "rechazo_cesion"); rel(s, "coach", -4); stat(s, "discipline", 5); },
      },
      {
        id: "condicion",
        label: "Aceptar solo si el club te garantiza el regreso",
        hint: "Negociar por escrito",
        outcome: "Lo ponen en un anexo. Un papel no es una promesa, pero ayuda.",
        apply: (s) => { flag(s, "loan_1"); flag(s, "cedido"); flag(s, "regreso_pactado"); rel(s, "agent", 8); promise(s, "El club te prometió el regreso tras la cesión"); },
      },
    ],
  },
  {
    id: "bc_loan_2",
    kicker: "Mercado · Capítulo 2",
    title: "Un vestuario que no es el tuyo",
    image: "locker",
    category: "club",
    family: "arc_cesion",
    requires: (s) => on(s, "cedido") && !on(s, "loan_2"),
    text: (s) =>
      `Aquí nadie te debe nada. Hay tres jugadores de treinta y cinco años que llevan media vida salvando la categoría y miran a los cedidos como turistas. ${who(s, "captain")} te espera en la puerta del gimnasio.`,
    choices: [
      {
        id: "humilde",
        label: "Pedirle que te cuente cómo se sobrevive aquí",
        outcome: "Te habla veinte minutos. Se te quita algo de tontería de encima.",
        apply: (s) => { flag(s, "loan_2"); rel(s, "dressing", 10); stat(s, "discipline", 6); npcMood(s, "captain", 12); },
      },
      {
        id: "demostrar",
        label: "Demostrar en el campo antes de hablar",
        outcome: "Dos entrenamientos brutales y un moratón. Empiezan a llamarte por tu nombre.",
        apply: (s) => { flag(s, "loan_2"); stat(s, "form", 7); stat(s, "fitness", -5); rel(s, "dressing", 5); },
      },
      {
        id: "distancia",
        label: "Mantener la distancia: solo estás de paso",
        outcome: "Comes solo. Rindes igual, pero la temporada se hace muy larga.",
        apply: (s) => { flag(s, "loan_2"); flag(s, "cesion_aislado"); rel(s, "dressing", -10); stat(s, "morale", -6); },
      },
    ],
  },

  /* ================= ARCO · RENOVACIÓN ================= */
  {
    id: "bc_renew_1",
    kicker: "Contrato · Capítulo 1",
    title: "El club quiere renovarte",
    image: "office",
    category: "market",
    family: "arc_renovacion",
    requires: (s) => s.stage !== "youth" && s.overall >= 64 && !on(s, "renew_1"),
    text: (s) =>
      `Reunión a las nueve en las oficinas del ${short(s)}. Mejora de ficha, cláusula alta y dos años más. Sobre la mesa hay una carpeta y, dentro, la primera cifra de tu vida con muchos ceros.`,
    choices: [
      {
        id: "firmar",
        label: "Firmar lo que hay",
        hint: "Seguridad ahora",
        outcome: "Foto con la bufanda y tu madre llorando en el móvil.",
        apply: (s) => { flag(s, "renew_1"); s.salary = Math.round(s.salary * 1.5 + 60); s.contractYears = 3; rel(s, "coach", 4); milestone(s, "Renovación con el club."); },
      },
      {
        id: "cláusula",
        label: "Pedir cláusula más baja para poder salir",
        hint: "Libertad futura",
        outcome: "El club se incomoda: entienden que ya piensas en irte.",
        apply: (s) => { flag(s, "renew_1"); flag(s, "clausula_baja"); s.salary = Math.round(s.salary * 1.25 + 30); s.contractYears = 3; rel(s, "coach", -3); rel(s, "agent", 8); },
      },
      {
        id: "esperar",
        label: "Esperar a ver cómo acaba la temporada",
        hint: "Apostar por ti mismo",
        outcome: "Te levantas sin firmar. En el pasillo notas que has cruzado una línea.",
        apply: (s) => { flag(s, "renew_1"); flag(s, "renovacion_aplazada"); stat(s, "morale", -4); rel(s, "fans", -3); },
      },
    ],
  },
  {
    id: "bc_renew_2",
    kicker: "Contrato · Capítulo 2",
    title: "La apuesta que hiciste",
    image: "press",
    category: "press",
    family: "arc_renovacion",
    requires: (s) => on(s, "renovacion_aplazada") && !on(s, "renew_2"),
    text: (s) =>
      `Ha salido en la radio que no renovaste. En la sala de prensa te preguntan si te quieres ir del ${club(s)} y treinta móviles esperan la respuesta. ${who(s, "press")} sonríe porque sabe que cualquier palabra vale titular.`,
    choices: [
      {
        id: "compromiso",
        label: "Decir que solo piensas en el próximo partido",
        outcome: "Titular tibio. La afición respira, tu representante bufa.",
        apply: (s) => { flag(s, "renew_2"); rel(s, "fans", 6); rel(s, "agent", -5); },
      },
      {
        id: "sincero",
        label: "Reconocer que quieres ver otras opciones",
        outcome: "Portada. Y una pañolada esperándote el domingo.",
        apply: (s) => { flag(s, "renew_2"); flag(s, "aficion_dolida"); rel(s, "fans", -14); stat(s, "fame", 8); rel(s, "agent", 8); },
      },
      {
        id: "agente",
        label: "Remitirlo todo a tu representante",
        outcome: "\"De eso se encarga él\". Cinco palabras y ninguna herida.",
        apply: (s) => { flag(s, "renew_2"); rel(s, "agent", 5); stat(s, "discipline", 4); },
      },
    ],
  },

  /* ================= ARCO · AFICIÓN EN CONTRA ================= */
  {
    id: "bc_fans_1",
    kicker: "Grada",
    title: "Silbado en tu propio campo",
    image: "stadium",
    category: "club",
    family: "arc_afición",
    requires: (s) => s.stage !== "youth" && s.rel.fans < 42 && !on(s, "fans_1"),
    text: (s) =>
      `Pides el balón en el lateral y una parte del fondo silba antes de que llegue. No es un grito puntual: es un sonido de fondo que ya no se va. Al acabar hay diez personas esperando en la valla.`,
    choices: [
      {
        id: "acercarse",
        label: "Ir a la valla y escuchar lo que tengan que decir",
        outcome: "Te caen tres reproches y dos abrazos. Sales confuso pero limpio.",
        apply: (s) => { flag(s, "fans_1"); rel(s, "fans", 12); stat(s, "morale", -3); },
      },
      {
        id: "orejas",
        label: "Señalarte las orejas después del siguiente pase bueno",
        outcome: "Media grada se enciende. La otra media también, en tu contra.",
        apply: (s) => { flag(s, "fans_1"); flag(s, "guerra_grada"); rel(s, "fans", -12); stat(s, "fame", 9); rel(s, "dressing", -4); },
      },
      {
        id: "trabajar",
        label: "Bajar la cabeza y correr más que nadie",
        outcome: "Acabas con calambres y con un aplauso pequeño al ser sustituido.",
        apply: (s) => { flag(s, "fans_1"); rel(s, "fans", 6); stat(s, "fitness", -8); rel(s, "coach", 5); },
      },
    ],
  },

  /* ================= ARCO · PRIMER PAÍS EXTRANJERO ================= */
  {
    id: "bc_abroad_1",
    kicker: "Extranjero · Capítulo 1",
    title: "Un idioma que no entiendes",
    image: "travel",
    category: "life",
    family: "arc_extranjero",
    requires: (s) => s.age >= 20 && s.overall >= 70 && !on(s, "abroad_1"),
    text: (s) =>
      `Primera charla táctica fuera de España. Veinte minutos de pizarra en un idioma del que pillas tres palabras y tu nombre. ${who(s, "assistant")} te traduce lo justo y el resto lo adivinas por las flechas.`,
    choices: [
      {
        id: "clases",
        label: "Pedir clases de idioma cada mañana",
        outcome: "Dos meses después entiendes las broncas. No sabes si es un premio.",
        apply: (s) => { flag(s, "abroad_1"); flag(s, "idioma_ok"); rel(s, "coach", 8); rel(s, "dressing", 6); stat(s, "discipline", 6); },
      },
      {
        id: "traductor",
        label: "Apoyarte solo en el compañero que habla español",
        outcome: "Funciona hasta que él se lesiona y te quedas sordo en el campo.",
        apply: (s) => { flag(s, "abroad_1"); rel(s, "dressing", 4); rel(s, "coach", -4); },
      },
      {
        id: "gestos",
        label: "Tirar de gestos y de fútbol",
        outcome: "En el rondo nadie necesita subtítulos. En la charla, sí.",
        apply: (s) => { flag(s, "abroad_1"); stat(s, "form", 4); stat(s, "morale", -4); },
      },
    ],
  },
  {
    id: "bc_abroad_2",
    kicker: "Extranjero · Capítulo 2",
    title: "Domingo de nadie",
    image: "family",
    category: "life",
    family: "arc_extranjero",
    requires: (s) => on(s, "abroad_1") && !on(s, "abroad_2"),
    text: (s) =>
      `Día libre, piso enorme, lluvia. Nueve grados fuera y una videollamada con tu madre en la que los dos hacéis como que todo va bien. Te ofrecen dos planes: vuelo relámpago a casa o cena con el grupo del vestuario.`,
    choices: [
      {
        id: "casa",
        label: "Coger el primer vuelo a casa 36 horas",
        outcome: "Comida de tu madre, sofá y vuelta con los ojos rojos.",
        apply: (s) => { flag(s, "abroad_2"); rel(s, "family", 12); stat(s, "morale", 8); stat(s, "fitness", -4); },
      },
      {
        id: "cena",
        label: "Cenar con el vestuario aunque no entiendas la mitad",
        outcome: "Te ríes por contagio y aprendes dos tacos nuevos. Sirve.",
        apply: (s) => { flag(s, "abroad_2"); rel(s, "dressing", 10); stat(s, "morale", 5); },
      },
      {
        id: "solo",
        label: "Quedarte solo viendo partidos de la liga española",
        outcome: "Cuatro partidos seguidos y una tristeza que no cuentas a nadie.",
        apply: (s) => { flag(s, "abroad_2"); flag(s, "soledad_extranjero"); stat(s, "morale", -8); stat(s, "form", -3); },
      },
    ],
  },

  /* ================= AGENTE COMO PERSONAJE ================= */
  {
    id: "bc_agent_agency",
    kicker: "Representante",
    title: "Una agencia grande quiere a tu agente",
    image: "agent",
    category: "agent",
    family: "agente_agencia",
    requires: (s) => s.agent.present && s.overall >= 68 && !on(s, "agente_agencia"),
    text: (s) =>
      `${s.agent.name}, tu representante, te lo cuenta con el café a medias: una macroagencia le ofrece integrarse. Ganarías puertas y perderías su teléfono a cualquier hora.`,
    choices: [
      {
        id: "adelante",
        label: "Decirle que acepte: quieres esas puertas",
        outcome: "Ahora te atienden tres personas y ninguna se llama como él.",
        apply: (s) => { flag(s, "agente_agencia"); flag(s, "macroagencia"); s.agent.trust = Math.max(0, s.agent.trust - 8); stat(s, "fame", 5); },
      },
      {
        id: "quedate",
        label: "Pedirle que siga contigo, solo contigo",
        outcome: "Lo rechaza. Te lo va a recordar cada vez que discutáis.",
        apply: (s) => { flag(s, "agente_agencia"); s.agent.trust = Math.min(100, s.agent.trust + 14); rel(s, "agent", 10); promise(s, "Tu representante rechazó una macroagencia por ti"); },
      },
      {
        id: "libre",
        label: "Dejarle libre y valorar quedarte sin representante",
        outcome: "Cuelgas y te das cuenta de que ahora los papeles los lees tú.",
        apply: (s) => { flag(s, "agente_agencia"); s.agent.present = false; s.hasAgent = false; rel(s, "agent", -10); conflict(s, "Te quedaste sin representante"); },
      },
    ],
  },
  {
    id: "bc_agent_error",
    kicker: "Representante",
    title: "Tu agente se ha equivocado",
    image: "agent",
    category: "agent",
    family: "agente_error",
    requires: (s) => s.agent.present && s.sceneCount > 24 && !on(s, "agente_error"),
    text: (s) =>
      `${s.agent.name} ha filtrado a un periodista que estabas cerca de otro club para presionar. Era mentira. Ahora el ${club(s)} está molesto contigo y tú no habías dado permiso para nada.`,
    choices: [
      {
        id: "cubrir",
        label: "Cubrirle delante del club",
        outcome: "Te comes el marrón entero. Él lo sabe y te debe una gorda.",
        apply: (s) => { flag(s, "agente_error"); rel(s, "coach", -8); s.agent.trust = Math.min(100, s.agent.trust + 16); rel(s, "agent", 8); },
      },
      {
        id: "desmentir",
        label: "Desmentirlo públicamente y dejarle solo",
        outcome: "El club respira. Tu representante deja de contarte cosas.",
        apply: (s) => { flag(s, "agente_error"); rel(s, "coach", 6); rel(s, "fans", 4); s.agent.trust = Math.max(0, s.agent.trust - 18); },
      },
      {
        id: "despedir",
        label: "Despedirle en ese mismo momento",
        outcome: "Doce años de teléfono se apagan en una frase.",
        apply: (s) => { flag(s, "agente_error"); s.agent.present = false; s.hasAgent = false; s.agent.firedCount += 1; rel(s, "agent", -20); conflict(s, "Despediste a tu representante por una filtración"); },
      },
    ],
  },

  /* ================= FAMILIA Y VIDA ================= */
  {
    id: "bc_dad_624",
    kicker: "Familia",
    title: "624 kilómetros",
    image: "family",
    category: "life",
    family: "familia_padre",
    requires: (s) => s.age <= 22 && !on(s, "padre_624"),
    text: (s) =>
      `Tu padre ha conducido 624 kilómetros para verte veinte minutos en un campo sin grada. Te espera apoyado en el coche, con el bocadillo del viaje en el salpicadero, y dice que no está cansado.`,
    choices: [
      {
        id: "comer",
        label: "Pedirle que se quede a comer contigo",
        outcome: "Dos horas en un menú de trece euros. Lo vas a recordar toda la vida.",
        apply: (s) => { flag(s, "padre_624"); flag(s, "padre_comida"); rel(s, "family", 14); stat(s, "morale", 8); promise(s, "Tu padre conduce 624 km para verte jugar"); },
      },
      {
        id: "gasolina",
        label: "Meterle dinero en la guantera sin decírselo",
        outcome: "Te llama a mitad de camino, enfadado y con la voz temblona.",
        apply: (s) => { flag(s, "padre_624"); flag(s, "padre_gasolina"); rel(s, "family", 10); },
      },
      {
        id: "vuelta",
        label: "Volver al autobús del equipo: hay protocolo",
        outcome: "Te dice \"ve, ve\" y se queda mirando el autobús salir.",
        apply: (s) => { flag(s, "padre_624"); rel(s, "coach", 4); rel(s, "family", -8); stat(s, "morale", -5); },
      },
    ],
  },
  {
    id: "bc_studies",
    kicker: "Vida · 16 años",
    title: "Estudios o fútbol",
    image: "family",
    category: "life",
    family: "familia_estudios",
    requires: (s) => s.age <= 18 && !on(s, "estudios_16"),
    text: (s) =>
      `Reunión en el instituto. La orientadora dice que puedes con todo si eliges bien; tu madre asiente. Los entrenamientos son a las cuatro y las prácticas también.`,
    choices: [
      {
        id: "seguir",
        label: "Mantener los estudios aunque cueste dormir",
        outcome: "Duermes cinco horas y apruebas todo. Tu madre lo cuenta en la peluquería.",
        apply: (s) => { flag(s, "estudios_16"); flag(s, "estudia"); rel(s, "family", 12); stat(s, "fitness", -5); stat(s, "discipline", 8); },
      },
      {
        id: "todo",
        label: "Apostarlo todo al fútbol",
        outcome: "Ganas dos horas al día y pierdes la red debajo del alambre.",
        apply: (s) => { flag(s, "estudios_16"); flag(s, "sin_plan_b"); stat(s, "form", 6); rel(s, "family", -6); },
      },
      {
        id: "online",
        label: "Buscar una modalidad a distancia",
        outcome: "Menos clases, más pantalla de madrugada. Compensa.",
        apply: (s) => { flag(s, "estudios_16"); flag(s, "estudia"); rel(s, "family", 6); stat(s, "discipline", 4); },
      },
    ],
  },
  {
    id: "bc_friend_business",
    kicker: "Dinero",
    title: "Tu amigo del barrio quiere que entres",
    image: "office",
    category: "life",
    family: "dinero_amigo",
    requires: (s) => cash(s) >= 120 && !on(s, "amigo_negocio"),
    text: (s) =>
      `Un amigo de siempre trae un dossier hecho en el móvil: un local, una carta de tres platos y muchas ganas. Pide 90.000 € y te promete que en dos años vais a reíros los dos. Tienes ${cash(s)}.000 € en la cuenta.`,
    choices: [
      {
        id: "entrar",
        label: "Entrar como socio (90.000 €)",
        hint: "Puede salir bien o muy mal",
        outcome: "Firmáis en una servilleta y luego, con abogado.",
        apply: (s) => {
          flag(s, "amigo_negocio"); flag(s, "negocio_amigo");
          const f = ensureFinance(s);
          f.cash = Math.max(0, f.cash - 90);
          f.properties.push({ name: "Local con un amigo", value: 80, debt: 0 });
          rel(s, "family", 4);
        },
      },
      {
        id: "prestar",
        label: "Prestarle 30.000 € sin entrar en el negocio",
        outcome: "Él insiste en firmar un papel. Tú insistes en que no hace falta.",
        apply: (s) => { flag(s, "amigo_negocio"); flag(s, "amigo_prestamo"); const f = ensureFinance(s); f.cash = Math.max(0, f.cash - 30); rel(s, "family", 6); },
      },
      {
        id: "no",
        label: "Decir que no y explicarle por qué",
        outcome: "Lo entiende con la boca y no con la cara. Tardáis meses en escribiros.",
        apply: (s) => { flag(s, "amigo_negocio"); flag(s, "amigo_distancia"); stat(s, "morale", -4); },
      },
    ],
  },
  {
    id: "bc_parents_house",
    kicker: "Familia",
    title: "La casa de tus padres",
    image: "family",
    category: "life",
    family: "familia_dinero",
    requires: (s) => cash(s) >= 200 && !on(s, "casa_padres") && !on(s, "familia_ayudada"),
    text: (s) =>
      `Se ha vuelto a romper la caldera y tu madre lo cuenta como una anécdota. Podrías cambiarles la vida con una transferencia y ni notarlo en el saldo (${cash(s)}.000 €).`,
    choices: [
      {
        id: "reforma",
        label: "Pagar la reforma entera",
        outcome: "Tu padre te enseña las obras por videollamada tres veces por semana.",
        apply: (s) => { flag(s, "casa_padres"); flag(s, "familia_ayudada"); const f = ensureFinance(s); f.cash = Math.max(0, f.cash - 60); rel(s, "family", 14); stat(s, "morale", 6); },
      },
      {
        id: "sueldo",
        label: "Pasarles una cantidad fija cada mes",
        outcome: "Tu madre te dice que es demasiado y no lo toca durante meses.",
        apply: (s) => { flag(s, "casa_padres"); const f = ensureFinance(s); f.commitments.push({ name: "Ayuda familiar", yearly: 24, seasonsLeft: 6 }); rel(s, "family", 11); },
      },
      {
        id: "caldera",
        label: "Arreglar solo la caldera y no hacer ruido",
        outcome: "Discreto, suficiente y muy tú.",
        apply: (s) => { flag(s, "casa_padres"); const f = ensureFinance(s); f.cash = Math.max(0, f.cash - 6); rel(s, "family", 6); },
      },
    ],
  },

  /* ================= HUMOR CONTEXTUAL ================= */
  {
    id: "bc_whatsapp",
    kicker: "Humor",
    title: "Grupo equivocado",
    image: "locker",
    category: "gossip",
    family: "humor_movil",
    requires: (s) => !on(s, "whatsapp_grupo"),
    text: (s) =>
      `Querías mandar al grupo de amigos una queja sobre el entrenamiento de hoy. La has mandado al grupo del equipo, donde también está ${who(s, "coach")}. Dos personas ya han puesto 😂 y una ha puesto 👀.`,
    choices: [
      {
        id: "eliminar",
        label: "Eliminar para todos y rezar",
        outcome: "\"Este mensaje fue eliminado\" es la confesión más elocuente del mundo.",
        apply: (s) => { flag(s, "whatsapp_grupo"); rel(s, "coach", -4); rel(s, "dressing", 5); },
      },
      {
        id: "doblar",
        label: "Doblarla: escribir que lo mantienes",
        outcome: "El vestuario alucina. El míster te espera mañana a las ocho.",
        apply: (s) => { flag(s, "whatsapp_grupo"); rel(s, "dressing", 10); rel(s, "coach", -9); stat(s, "fame", 3); },
      },
      {
        id: "broma",
        label: "Convertirlo en broma y pagar el desayuno",
        outcome: "Veinticuatro cafés y un mote nuevo. Barato.",
        apply: (s) => { flag(s, "whatsapp_grupo"); rel(s, "dressing", 8); const f = ensureFinance(s); f.cash = Math.max(0, f.cash - 1); },
      },
    ],
  },
  {
    id: "bc_fantasy",
    kicker: "Humor",
    title: "Vales 4,5 en el Fantasy",
    image: "locker",
    category: "gossip",
    family: "humor_redes",
    requires: (s) => s.stage !== "youth" && !on(s, "fantasy"),
    text: (s) =>
      `${who(s, "captain")} ha descubierto que en el Fantasy vales 4,5 millones y lo ha proyectado en la tele del comedor. Hay un grupo del club donde te han fichado tres personas "por si acaso".`,
    choices: [
      {
        id: "apuntarse",
        label: "Apuntarte a la liga del vestuario y ficharte a ti",
        outcome: "Te fichas y no sumas ni un punto ese fin de semana. Perfecto.",
        apply: (s) => { flag(s, "fantasy"); rel(s, "dressing", 8); stat(s, "morale", 4); },
      },
      {
        id: "reto",
        label: "Prometer marcar para que los que no te ficharon lloren",
        outcome: "Promesa pública en el comedor. Ahora hay que cumplirla.",
        apply: (s) => { flag(s, "fantasy"); promise(s, "Prometiste marcar por el Fantasy del vestuario"); stat(s, "form", 4); rel(s, "dressing", 5); },
      },
      {
        id: "pasar",
        label: "Decir que no juegas a eso",
        outcome: "Te llaman abuelo el resto de la temporada.",
        apply: (s) => { flag(s, "fantasy"); rel(s, "dressing", -3); stat(s, "discipline", 4); },
      },
    ],
  },
  {
    id: "bc_mother_press",
    kicker: "Humor",
    title: "Tu madre contesta al periodista",
    image: "press",
    category: "press",
    family: "humor_prensa",
    requires: (s) => s.fame >= 25 && !on(s, "madre_prensa"),
    text: (s) =>
      `Un periodista ha escrito que estás sobrevalorado. Tu madre, con su nombre y su foto de perfil de flores, le ha contestado en público: "¿Y usted qué hacía a los ${s.age}?". Lleva 40.000 likes.`,
    choices: [
      {
        id: "orgullo",
        label: "Citarla con un corazón",
        outcome: "Se convierte en el meme de la semana y en camiseta de aficionados.",
        apply: (s) => { flag(s, "madre_prensa"); stat(s, "fame", 10); rel(s, "fans", 8); rel(s, "family", 6); },
      },
      {
        id: "pedir",
        label: "Pedirle en privado que no vuelva a hacerlo",
        outcome: "Te dice que sí y cambia la foto de perfil por una tuya de niño.",
        apply: (s) => { flag(s, "madre_prensa"); rel(s, "family", -3); stat(s, "discipline", 5); },
      },
      {
        id: "llamar",
        label: "Llamar al periodista y hablarlo de frente",
        outcome: "Charla incómoda de nueve minutos y un respeto raro que aparece.",
        apply: (s) => { flag(s, "madre_prensa"); npcMood(s, "press", 15); rel(s, "fans", 3); },
      },
    ],
  },

  /* ================= RAREZAS (dosificadas) ================= */
  {
    id: "bc_rare_horse",
    kicker: "Surrealismo",
    title: "El caballo del contrato",
    image: "office",
    category: "market",
    family: "raro_caballo",
    rare: true,
    requires: (s) => s.overall >= 72 && !on(s, "raro_caballo"),
    text: () =>
      `Una oferta desde el Golfo incluye, cláusula 14.3, "un ejemplar equino de pura raza" como parte del pago. El intermediario insiste en que es una muestra de respeto y te manda un vídeo del animal trotando.`,
    choices: [
      {
        id: "aceptar",
        label: "Preguntar seriamente dónde se aparca un caballo",
        outcome: "Descubres que mantenerlo cuesta más que tu primer coche.",
        apply: (s) => { flag(s, "raro_caballo"); const f = ensureFinance(s); f.commitments.push({ name: "Cuadra del caballo", yearly: 18, seasonsLeft: 4 }); f.properties.push({ name: "Caballo pura raza", value: 120, debt: 0 }); stat(s, "fame", 6); },
      },
      {
        id: "dinero",
        label: "Pedir que la cláusula se pague en dinero",
        outcome: "Aceptan sin pestañear. El caballo sigue su vida sin ti.",
        apply: (s) => { flag(s, "raro_caballo"); const f = ensureFinance(s); f.cash += 110; },
      },
      {
        id: "contar",
        label: "Contarlo en el vestuario y morir de risa",
        outcome: "Durante un mes te reciben con relinchos al entrar.",
        apply: (s) => { flag(s, "raro_caballo"); rel(s, "dressing", 10); stat(s, "fame", 4); },
      },
    ],
  },
  {
    id: "bc_rare_statue",
    kicker: "Surrealismo",
    title: "Una estatua horrible",
    image: "celebration",
    category: "gossip",
    family: "raro_estatua",
    rare: true,
    requires: (s) => s.fame >= 55 && !on(s, "raro_estatua"),
    text: (s) =>
      `Tu pueblo te ha hecho una estatua. La cara no es tu cara, la pierna izquierda apunta a un sitio imposible y el alcalde está esperando con una sábana y un micrófono. Hay ochocientas personas en la plaza del ${short(s)} de tu infancia.`,
    choices: [
      {
        id: "abrazar",
        label: "Abrazarla y decir que es preciosa",
        outcome: "La foto se hace viral y la estatua se convierte en atracción turística.",
        apply: (s) => { flag(s, "raro_estatua"); stat(s, "fame", 12); rel(s, "fans", 10); rel(s, "family", 8); },
      },
      {
        id: "bromear",
        label: "Bromear con el escultor delante de todos",
        outcome: "El escultor no se ríe. El pueblo, sí.",
        apply: (s) => { flag(s, "raro_estatua"); stat(s, "fame", 8); rel(s, "fans", -4); },
      },
      {
        id: "otra",
        label: "Pagar tú una nueva en secreto",
        outcome: "Nadie lo sabe. Tú la miras distinto cada verano.",
        apply: (s) => { flag(s, "raro_estatua"); const f = ensureFinance(s); f.cash = Math.max(0, f.cash - 40); rel(s, "family", 5); },
      },
    ],
  },
  {
    id: "bc_rare_gas",
    kicker: "Surrealismo",
    title: "Olvidado en una gasolinera",
    image: "travel",
    category: "club",
    family: "raro_gasolinera",
    rare: true,
    requires: (s) => !on(s, "raro_gasolinera"),
    text: (s) =>
      `Parada técnica en un viaje de cinco horas. Sales a por agua, tardas seis minutos y el autobús del ${short(s)} ya no está. Nadie contesta al teléfono. Hay un señor con un tractor que te ofrece acercarte.`,
    choices: [
      {
        id: "tractor",
        label: "Subirte al tractor",
        outcome: "Llegas al estadio en tractor. La imagen es historia del club.",
        apply: (s) => { flag(s, "raro_gasolinera"); stat(s, "fame", 9); rel(s, "dressing", 8); },
      },
      {
        id: "taxi",
        label: "Pagar un taxi de 180 km y no decir nada",
        outcome: "Aparaces sereno, con la bolsa al hombro y 240 € menos.",
        apply: (s) => { flag(s, "raro_gasolinera"); const f = ensureFinance(s); f.cash = Math.max(0, f.cash - 1); stat(s, "discipline", 6); rel(s, "coach", 4); },
      },
      {
        id: "enfado",
        label: "Llamar al delegado y montar el escándalo",
        outcome: "Vuelven a por ti. El delegado no te mira en dos semanas.",
        apply: (s) => { flag(s, "raro_gasolinera"); rel(s, "coach", -5); rel(s, "dressing", -3); },
      },
    ],
  },
];
