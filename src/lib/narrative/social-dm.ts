import type { Consequences, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getPersonName, getTeammateName } from "@/lib/narrative/npcs";

/**
 * Mensajes directos por redes: chicas (y fans) ficticias que escriben al
 * jugador cuando empieza a sonar. El evento es un HITO cuya imagen es una
 * captura de la conversación dibujada en código (src/lib/images/dmCard.ts):
 * cero coste de IA y muy compartible.
 *
 * Id "social-dm-*": carrera/actions.ts lo trata como evento que NO avanza
 * la semana, así que puede colarse en una semana de partido sin saltarla.
 * El enfriamiento va en el flag `dm_last_week` (lo escribe el propio evento).
 */

const COOLDOWN_WEEKS = 8;

export function shouldTriggerSocialDm(player: Player): boolean {
  if (player.club === NO_CLUB_YET) return false;
  if ((player.fama ?? 0) < 8) return false;
  const last = Number(player.flags?.dm_last_week ?? 0);
  if (last > 0 && player.week - last < COOLDOWN_WEEKS) return false;
  return Math.random() < 0.2;
}

function handleFor(name: string, salt: number): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(" ")
    .slice(0, 2);
  const sep = ["_", ".", ""][salt % 3];
  const tail = ["", "_", "x", String(90 + (salt % 9))][salt % 4];
  return "@" + base.join(sep) + tail;
}

interface DmOption {
  label: string;
  subtitle: string;
  reply: string;
  followUp?: string;
  consequences: Consequences;
  resolve?: {
    baseChance: number;
    success: { text: string; consequences: Consequences };
    fail: { text: string; consequences: Consequences };
  };
}

interface DmCtx {
  name: string;
  first: string;
  mate: string;
  club: string;
}

interface DmScenario {
  key: string;
  title: string;
  /** Escenas con tonteo: no salen si ya tienes pareja. */
  flirty?: boolean;
  intro: (ctx: DmCtx) => string;
  message: (ctx: DmCtx) => string;
  options: DmOption[];
}

const SCENARIOS: DmScenario[] = [
  {
    key: "cafe",
    title: "Un mensaje que no esperabas",
    flirty: true,
    intro: ({ name }) => `Vibra el móvil en plena concentración. ${name}, una chica que no conoces de nada, te ha escrito por Instagram.`,
    message: () => "Oye, no sé si me vas a leer jaja. Te vi el sábado en el estadio y desde entonces no puedo dejar de pensar en ese control. ¿Un café cuando descanses?",
    options: [
      {
        label: "Aceptar el café",
        subtitle: "Un café es solo un café… ¿no?",
        reply: "Te leo, te leo. Un café me viene genial. ¿Jueves por la tarde?",
        followUp: "Jueves. Y ojo, invitas tú que eres el famoso",
        consequences: { fama: 2, moral: 3 },
        resolve: {
          baseChance: 0.6,
          success: { text: "El café sale genial: risas, cero fotos y una historia que contar en el vestuario.", consequences: { moral: 4, fama: 2 } },
          fail: { text: "Alguien os hizo una foto desde la mesa de al lado. A la mañana siguiente está en todos los canales de cotilleo.", consequences: { fama: 3, moral: -3, reputacion: -1 } },
        },
      },
      {
        label: "Contestar con humor y ya",
        subtitle: "Simpático, sin quedar",
        reply: "Jaja gracias, me alegro de que te gustara el control. Yo también lo repetiría mil veces.",
        followUp: "Pues mucho ánimo el domingo, campeón",
        consequences: { fama: 1, moral: 2 },
      },
      {
        label: "Dejarlo en visto",
        subtitle: "Prioridad: el partido",
        reply: "",
        consequences: { moral: 1, reputacion: 1 },
      },
    ],
  },
  {
    key: "bufanda",
    title: "La chica de la bufanda",
    flirty: true,
    intro: ({ name }) => `Un mensaje de ${name} te descoloca: dice que te dejaste algo en un sitio donde ni recuerdas haber estado.`,
    message: ({ club }) => `Hola, ¿eres tú el del ${club} que estuvo ayer en la cafetería del centro? Te dejaste la bufanda en la silla. La tengo aquí, huele a suavizante y a derrota.`,
    options: [
      {
        label: "Pedirle que te la guarde",
        subtitle: "Ya pasarás a por ella",
        reply: "Jajaja, seguro que era mía. Guárdamela, que voy a por ella esta semana. Y gracias por lo de la derrota, qué finura.",
        followUp: "Trato hecho. Pero la próxima ganad, por favor",
        consequences: { moral: 3, fama: 1 },
      },
      {
        label: "Decirle que se la quede",
        subtitle: "Un souvenir por un ídolo",
        reply: "Quédatela, que seguro que te queda mejor que a mí. Gracias por avisar!",
        followUp: "Ya la tengo puesta en la story",
        consequences: { fama: 3 },
      },
      {
        label: "Sospechar que es una broma",
        subtitle: "¿Tú en esa cafetería?",
        reply: "Yo ayer estaba entrenando, nunca he pisado esa cafetería. ¿Quién te ha pasado mi cuenta?",
        followUp: "Vaya, pues entonces era su doble. Lo siento!",
        consequences: { moral: 1 },
      },
    ],
  },
  {
    key: "catfish",
    title: "Demasiado bonito para ser verdad",
    flirty: true,
    intro: ({ name }) => `${name} tiene una foto de perfil de revista, 312 seguidores y una insistencia sospechosa.`,
    message: () => "Hola guapo. Soy modelo y me encantaría conocerte. Estoy en la puerta de tu hotel, ¿bajas un segundo? Es urgente jiji",
    options: [
      {
        label: "Bajar a ver",
        subtitle: "Curiosidad, nada más",
        reply: "¿En la puerta? Ahora bajo, dame dos minutos.",
        consequences: { fama: 1 },
        resolve: {
          baseChance: 0.35,
          success: { text: "Resulta que era real y muy amable. Foto rápida, autógrafo y cada uno a su camino.", consequences: { fama: 3, moral: 2 } },
          fail: { text: "Era una cámara oculta de tus compañeros con la ayuda de un utillero. Lo vas a oír hasta fin de temporada.", consequences: { moral: -2, rel_vestuario: 3, fama: 1 } },
        },
      },
      {
        label: "Enseñar el chat al mister",
        subtitle: "Por si acaso",
        reply: "Le voy a enseñar este mensaje al míster, por si acaso. ¿Cómo te llamas de verdad?",
        followUp: "Este usuario ha restringido los mensajes",
        consequences: { rel_entrenador: 3, reputacion: 2 },
      },
      {
        label: "Bloquear y seguir con lo tuyo",
        subtitle: "Cero riesgo",
        reply: "Gracias, pero prefiero conocer a la gente en persona y con luz de día.",
        followUp: "Este usuario ha restringido los mensajes",
        consequences: { moral: 1, reputacion: 1 },
      },
    ],
  },
  {
    key: "hermana",
    title: "La hermana de tu compañero",
    intro: ({ name, mate }) => `Te escribe ${name}, hermana de tu compañero ${mate}, con ganas de vengarse de él.`,
    message: ({ mate }) => `Hola, soy la hermana de ${mate}. Mi hermano dice que eres un roñoso y que nunca invitas. ¿Es verdad? Necesito pruebas para la cena de Navidad.`,
    options: [
      {
        label: "Invitar a todo el equipo a cenar",
        subtitle: "Que se le corte el hilo",
        reply: "Mentira cochina. Esta semana cena para todo el equipo, la primera ronda la pago yo. Que lo sepa tu hermano.",
        followUp: "JAJAJA le voy a enseñar este chat. Eres un crack",
        consequences: { patrimonio: -1500, rel_vestuario: 6, moral: 3 },
      },
      {
        label: "Devolvérsela con humor",
        subtitle: "Tu hermano tiene más morro que espalda",
        reply: "Tu hermano tiene más morro que espalda. Dile que pague él la próxima o le escondo las botas.",
        followUp: "Jajaja se lo digo tal cual",
        consequences: { rel_vestuario: 3, moral: 2 },
      },
      {
        label: "Confesarlo todo",
        subtitle: "Ahora no hay marcha atrás",
        reply: "Vale, me pillaste. Pero es que me ha salido carísimo el fisio este año.",
        followUp: "Comprensible. Lo mantendré en secreto… nunca",
        consequences: { moral: 1, rel_vestuario: 1 },
      },
    ],
  },
  {
    key: "padre",
    title: "El mensaje que sí importa",
    intro: ({ name }) => `Entre tantos mensajes tontos, el de ${name} es distinto. Lo lees dos veces.`,
    message: () => "Hola. Perdona la molestia. Mi padre no sale de casa desde hace meses, pero no se pierde ni un partido tuyo. Se ha puesto a llorar con tu último gol. ¿Podrías mandarle un saludo?",
    options: [
      {
        label: "Grabar un vídeo para su padre",
        subtitle: "Cinco minutos que valen mucho",
        reply: "Claro que sí. Te mando ahora un vídeo para él y te firmo una camiseta. Dile que lo voy a mirar en el próximo partido.",
        followUp: "No sé cómo darte las gracias. Se le ha iluminado la cara.",
        consequences: { moral: 5, fama: 3, rel_aficion: 4, reputacion: 2 },
      },
      {
        label: "Mandar una camiseta firmada",
        subtitle: "Un detalle que se queda en casa",
        reply: "Ahora mismo pido que le lleven una camiseta firmada por todo el equipo. Que se ponga bueno pronto.",
        followUp: "Nos ha hecho llorar a todos. Gracias de corazón.",
        consequences: { moral: 4, rel_aficion: 4, fama: 2, patrimonio: -200 },
      },
      {
        label: "Contestar en otro momento",
        subtitle: "Ahora no encuentras cabeza",
        reply: "Mucho ánimo a tu padre. Lo miro con calma esta semana.",
        consequences: { moral: -1 },
      },
    ],
  },
  {
    key: "estafa",
    title: "Un mensaje demasiado generoso",
    intro: ({ name }) => `${name} te escribe con una propuesta que huele a chamusquina desde el primer renglón.`,
    message: () => "Hola! Soy de una marca de moda y te queremos como embajador con un pago de 5.000 € por anticipado. Solo necesito tu IBAN y el código que te llegará por SMS.",
    options: [
      {
        label: "Pasar los datos al agente",
        subtitle: "Que él lo revise todo",
        reply: "Encantado. Escríbele directamente a mi agente y él te dará todo lo que necesites.",
        followUp: "Este usuario ha restringido los mensajes",
        consequences: { rel_representante: 3, reputacion: 1 },
      },
      {
        label: "Darle el IBAN por si acaso",
        subtitle: "5.000 € son 5.000 €",
        reply: "Uf, genial. Te paso el IBAN ahora mismo. ¿Qué código necesitas?",
        consequences: { moral: -3 },
        resolve: {
          baseChance: 0.15,
          success: { text: "Sorprendentemente, era una marca real que quería cerrar rápido. Cobras sin problemas.", consequences: { patrimonio: 5000, fama: 2 } },
          fail: { text: "Era una estafa y te vacían una parte de la cuenta antes de que el banco reaccione. Tu agente no para de repetir que te lo dijo.", consequences: { patrimonio: -8000, moral: -6, rel_representante: -2 } },
        },
      },
      {
        label: "Denunciar la cuenta",
        subtitle: "Que no lo intente con otro",
        reply: "Gracias, pero esto huele a estafa. He reportado tu cuenta y avisado a mi club.",
        followUp: "Este usuario ha restringido los mensajes",
        consequences: { reputacion: 2, moral: 2 },
      },
    ],
  },
  {
    key: "colegio",
    title: "Alguien de tu pasado",
    intro: ({ name }) => `Ves el nombre de ${name} y tarda un segundo en encajarte: iba dos cursos por debajo, en el colegio.`,
    message: () => "¿Te acuerdas de mí? Yo era la que te animaba desde la valla del patio cuando eras el pequeñajo que hacía todos los goles. ¡Qué orgullo verte en la tele!",
    options: [
      {
        label: "Recordar viejos tiempos",
        subtitle: "Del patio a los focos",
        reply: "¡Claro que me acuerdo! Eras la única que se sabía todos mis regates. Cuando pase por el barrio te invito a un helado.",
        followUp: "Ahora sí puedo decir que lo conocí antes de que fuera famoso",
        consequences: { moral: 4, fama: 1 },
      },
      {
        label: "Darle unas entradas",
        subtitle: "Un palco desde el que animar",
        reply: "Te dejo dos entradas para el próximo partido en casa. Grita fuerte, como en el patio.",
        followUp: "Vamos a montar un escándalo. Gracias, campeón.",
        consequences: { moral: 3, rel_aficion: 3, patrimonio: -150 },
      },
      {
        label: "Contestar con una foto de infancia",
        subtitle: "Por si le sirve para recordar",
        reply: "Mira lo que me encontré el otro día en casa de mis padres. Sigo teniendo la misma cara de bueno.",
        followUp: "JAJAJA con ese flequillo. Esto va a la story.",
        consequences: { fama: 2, moral: 2 },
      },
    ],
  },
  {
    key: "influencer",
    title: "Una colaboración con gancho",
    intro: ({ name }) => `${name}, con miles de seguidores, quiere sacarte en su contenido. Tu agente diría que lo mires bien.`,
    message: () => "Holaaa! Hago contenido de lifestyle y me encantaría grabar un vídeo contigo: un día en la vida de un futbolista. Te pago la sesión y sacamos fotos brutales. ¿Te animas?",
    options: [
      {
        label: "Aceptar la colaboración",
        subtitle: "Más fama, menos descanso",
        reply: "Me apunto. Solo pido que me dejen elegir la música. Dime día y hora.",
        followUp: "Perfecto, te mando el calendario. Vas a salir guapísimo",
        consequences: { fama: 5, patrimonio: 2500, forma: -2 },
      },
      {
        label: "Pasarlo por el club antes",
        subtitle: "Permiso del departamento de comunicación",
        reply: "Me encantaría, pero primero tengo que pasarlo por el club. Te contesto en cuanto me dejen.",
        followUp: "Sin problema, yo espero!",
        consequences: { rel_entrenador: 2, reputacion: 2, fama: 1 },
      },
      {
        label: "Rechazarlo con educación",
        subtitle: "Ahora solo cuenta el campo",
        reply: "Muchas gracias por pensar en mí, pero ahora mismo quiero estar solo pensando en el campo. Otra vez será.",
        followUp: "Total respeto. Mucha suerte, crack",
        consequences: { moral: 1, rel_entrenador: 2 },
      },
    ],
  },
  {
    key: "reto",
    title: "Te retan por redes",
    intro: ({ name }) => `${name} te ha etiquetado en un reto viral. Ya tiene medio millón de vistas y todos esperan tu respuesta.`,
    message: () => "Te reto a meter tres toques y un gol de volea a la papelera desde el círculo central. Si lo logras, te doy un cuarto de millón de vistas para tu cuenta. ¡Vamos, no seas gallina!",
    options: [
      {
        label: "Aceptar el reto",
        subtitle: "Solo se vive una vez",
        reply: "Trato hecho. Mañana después del entrenamiento lo grabo. Prepara esas vistas.",
        followUp: "Lo tengo apuntado en mi calendario! Va a ser leyenda",
        consequences: { fama: 2 },
        resolve: {
          baseChance: 0.5,
          success: { text: "Se te da a la primera y el vídeo se vuelve viral. Todo el vestuario lo comparte.", consequences: { fama: 6, moral: 4, rel_vestuario: 2 } },
          fail: { text: "Fallas doce veces seguidas y el míster te ve por la ventana. Te hace repetirlo en el entrenamiento… pero como castigo.", consequences: { fama: 1, moral: -2, rel_entrenador: -2 } },
        },
      },
      {
        label: "Devolver el reto a un compañero",
        subtitle: "Que lo intente otro",
        reply: "Acepto, pero el que lo hará es mi compañero. Él dice que es más portero que delantero, veremos quién gana.",
        followUp: "JAJA cuento con el vídeo. Voy a comprar palomitas",
        consequences: { rel_vestuario: 3, moral: 2 },
      },
      {
        label: "Pasar del reto",
        subtitle: "Hay cosas más importantes",
        reply: "Gracias, pero mejor me guardo esas fuerzas para el sábado.",
        consequences: { moral: 1, reputacion: 1 },
      },
    ],
  },
  {
    key: "periodista",
    title: "La periodista que insiste",
    intro: ({ name }) => `${name} lleva días intentando hablar contigo y ha decidido probar por mensaje directo.`,
    message: ({ club }) => `Hola! Soy periodista y estoy preparando un reportaje sobre la nueva generación del ${club}. Tres preguntas, cinco minutos, sin micrófonos. Prometo no sacar nada que no me digas.`,
    options: [
      {
        label: "Concederle la entrevista",
        subtitle: "Hablar también es jugar",
        reply: "Vale, pero solo cinco minutos y sin trampas. Escríbeme por aquí y te digo cuándo.",
        followUp: "Trato hecho, te lo agradezco un montón",
        consequences: { fama: 3, moral: 1 },
        resolve: {
          baseChance: 0.65,
          success: { text: "El reportaje sale bonito y sin trampas: un titular cariñoso que gusta a la afición.", consequences: { fama: 4, rel_aficion: 3 } },
          fail: { text: "Sacó una frase tuya sin contexto y ahora todos hablan de eso. Tu agente suspira por teléfono.", consequences: { fama: 2, moral: -3, rel_representante: -1 } },
        },
      },
      {
        label: "Derivarla al club",
        subtitle: "Para eso hay un departamento",
        reply: "Mejor habla con el departamento de comunicación del club, ellos te organizan todo.",
        followUp: "Perfecto, así lo haré. Gracias!",
        consequences: { reputacion: 2, rel_entrenador: 1 },
      },
      {
        label: "Ignorarla",
        subtitle: "Cero prensa fuera del campo",
        reply: "",
        consequences: { moral: 1 },
      },
    ],
  },
  {
    key: "fan_gol",
    title: "Tu mayor fan escribe",
    intro: ({ name }) => `Te llega un mensaje larguísimo de ${name}, con muchos signos de exclamación.`,
    message: () => "He visto tu último gol veinte veces. VEINTE. Mi novio dice que exagero, pero que sepas que ya tengo tu camiseta en la pared. ¿Puedes decirme si el gol fue con la izquierda? Es para ganar una apuesta.",
    options: [
      {
        label: "Confirmar y añadir una broma",
        subtitle: "La apuesta es sagrada",
        reply: "Con la izquierda, palabra. Dile a tu novio que pague la apuesta y que se compre otra camiseta.",
        followUp: "JAJAJA GANÉ! Te debo una cerveza. Eres un mito",
        consequences: { fama: 3, moral: 3, rel_aficion: 2 },
      },
      {
        label: "Contestar con la verdad",
        subtitle: "Fue con la derecha",
        reply: "Pues ha sido con la derecha. Pero me halaga que lo hayas visto veinte veces.",
        followUp: "Nooo, pues he perdido la apuesta. Pero valió la pena. Gracias!",
        consequences: { fama: 2, moral: 1 },
      },
      {
        label: "Mandar un audio y ya",
        subtitle: "Cinco segundos de voz",
        reply: "Te mando un audio y lo confirmas tú misma.",
        followUp: "TE ESCUCHO. TE ESCUCHO. Me muero",
        consequences: { fama: 2, moral: 2, rel_aficion: 1 },
      },
    ],
  },
  {
    key: "chisme",
    title: "Alguien sabe algo",
    intro: ({ name }) => `${name} dice tener información sobre tu vestuario. Ojo con esto.`,
    message: ({ mate }) => `Hola. Tengo capturas de un chat privado donde ${mate} habla mal de ti. No quiero dinero, solo que sepas quién te da la espalda. ¿Te las mando?`,
    options: [
      {
        label: "Pedirle las capturas",
        subtitle: "Mejor saberlo todo",
        reply: "Mándamelas, prefiero verlo con mis ojos.",
        consequences: { moral: -1 },
        resolve: {
          baseChance: 0.4,
          success: { text: "Eran reales y hablas con tu compañero cara a cara. Os decís las cosas claras y salís reforzados.", consequences: { rel_vestuario: 4, moral: 3 } },
          fail: { text: "Estaban falsificadas: alguien quería enfrentaros. Cuando lo descubres, ya has discutido con tu compañero.", consequences: { rel_vestuario: -4, moral: -4 } },
        },
      },
      {
        label: "Decirle que hable con él en persona",
        subtitle: "Las cosas, a la cara",
        reply: "Gracias, pero si tiene algo que decirme, me lo dirá a la cara. No quiero capturas.",
        followUp: "Vaya, qué madurez. Suerte con eso.",
        consequences: { reputacion: 3, rel_vestuario: 2 },
      },
      {
        label: "Bloquear y avisar al capitán",
        subtitle: "Que lo controle él",
        reply: "No voy a entrar en esto. Se lo cuento al capitán y que lo hablen entre todos.",
        followUp: "Este usuario ha restringido los mensajes",
        consequences: { rel_vestuario: 3, reputacion: 2 },
      },
    ],
  },
  {
    key: "madre",
    title: "La madre de un canterano",
    intro: ({ name }) => `Te escribe ${name}, madre de un chaval de la cantera que te tiene de ídolo.`,
    message: () => "Hola! Mi hijo tiene 12 años y te ve como un dios. Mañana tiene un partido importante y está muy nervioso. ¿Podrías mandarle un audio de ánimo? Se lo pondría antes de salir.",
    options: [
      {
        label: "Grabar un audio con cariño",
        subtitle: "Diez segundos que él no olvidará",
        reply: "Dile que se divierta, que el miedo es normal y que yo también me pongo nervioso. Y que marque uno por mí.",
        followUp: "Le acabo de poner el audio y no para de saltar. Muchas gracias!",
        consequences: { moral: 4, fama: 2, rel_aficion: 3, reputacion: 2 },
      },
      {
        label: "Ir a verlo al partido",
        subtitle: "Un sorpresón de los buenos",
        reply: "Estaré en el campo. No le digas nada, que sea sorpresa.",
        followUp: "Voy a llorar. Va a ser el día de su vida",
        consequences: { moral: 5, fama: 4, rel_aficion: 5, forma: -2 },
      },
      {
        label: "Mandarle una foto firmada",
        subtitle: "Rápido y con detalle",
        reply: "Te mando una foto firmada para que se la lleve de amuleto. Mucha suerte para mañana.",
        followUp: "Gracias! Se la va a enmarcar",
        consequences: { moral: 2, rel_aficion: 2 },
      },
    ],
  },
  {
    key: "rival",
    title: "Un mensaje con mala idea",
    intro: ({ name }) => `${name} dice ser fan… del equipo rival. Tu bandeja de entrada huele a provocación.`,
    message: () => "Eres bueno, pero el sábado te vamos a callar la boca. Mi novio ya ha comprado entradas para pitarte cada vez que toques el balón. Que sepas que voy a llevar una pancarta contigo.",
    options: [
      {
        label: "Contestar con humor",
        subtitle: "Reírse de todo es ganar",
        reply: "Pues llévala bien grande y con buena letra, que si no, no sale en la tele. Nos vemos el sábado.",
        followUp: "Jajaja ok, tienes mi respeto. Pero no te pienso animar",
        consequences: { fama: 3, moral: 2, rel_aficion: 1 },
      },
      {
        label: "Devolver la provocación",
        subtitle: "Si me buscan, me encuentran",
        reply: "Trae dos pancartas, una para consolarte cuando te metamos tres.",
        followUp: "Eso lo veremos. Te quiero ver sudar el sábado.",
        consequences: { fama: 4, moral: 1, reputacion: -1 },
      },
      {
        label: "No entrar al trapo",
        subtitle: "El campo hablará",
        reply: "",
        consequences: { reputacion: 2, moral: 1 },
      },
    ],
  },
];

export function buildSocialDmEvent(player: Player): GameEvent {
  const week = player.week;
  const hasPartner = typeof player.flags?.pareja === "string";
  const lastKey = String(player.flags?.dm_last_key ?? "");
  let pool = SCENARIOS.filter((s) => !(s.flirty && hasPartner) && s.key !== lastKey);
  if (pool.length === 0) pool = SCENARIOS.filter((s) => !s.flirty);
  const scenario = pool[Math.floor(Math.random() * pool.length)];

  const name = getPersonName(player, `dm-girl-${week}-${scenario.key}`, "f");
  const first = name.split(" ")[0];
  const mate = getTeammateName(player, `dm-mate-${week}`);
  const ctx: DmCtx = { name, first, mate, club: player.club };
  const dmFlags = { dm_last_week: String(week), dm_last_key: scenario.key };

  return {
    id: `social-dm-${scenario.key}-${week}`,
    category: "vida",
    title: scenario.title,
    description: scenario.intro(ctx),
    isMilestone: true,
    milestoneType: "dm_instagram",
    dm: { handle: handleFor(name, week), name, message: scenario.message(ctx) },
    options: scenario.options.map((o, i) => ({
      id: String(i),
      label: o.label,
      subtitle: o.subtitle,
      dmReply: o.reply || undefined,
      dmFollowUp: o.followUp,
      consequences: { ...o.consequences, flags: dmFlags },
      resolve: o.resolve
        ? {
            baseChance: o.resolve.baseChance,
            success: { ...o.resolve.success, consequences: { ...o.resolve.success.consequences, flags: dmFlags } },
            fail: { ...o.resolve.fail, consequences: { ...o.resolve.fail.consequences, flags: dmFlags } },
          }
        : undefined,
    })),
  };
}
