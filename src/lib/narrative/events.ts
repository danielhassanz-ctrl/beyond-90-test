import type { GameEvent } from "@/types/career";
import { PRO_RETIREMENT_MIN_WEEK } from "@/types/career";
import type { Player } from "@/types/player";
import { STARTING_AGENTS, pickStartingClubOffers } from "@/lib/constants";
import { describeKit } from "@/lib/clubColors";

/**
 * Muy primer evento de toda carrera: elegir quién negocia por ti. Sin esto
 * definido no hay narrativa de representante coherente después. El agente
 * se sortea entre unos pocos ficticios para que no sea siempre el mismo
 * nombre en cada carrera nueva.
 */
export function buildEleccionRepresentanteEvent(): GameEvent {
  const agent = STARTING_AGENTS[Math.floor(Math.random() * STARTING_AGENTS.length)];

  return {
    id: "eleccion-representante",
    category: "representante",
    title: "¿Quién negocia por ti?",
    description:
      "Antes de firmar nada, alguien tiene que sentarse a hablar con los clubes en tu nombre. Tienes 16 años: es tu primera gran decisión fuera del campo.",
    options: [
      {
        id: "padre",
        label: "Que tu padre lleve las negociaciones",
        subtitle: "Confianza total, pero sin experiencia en el mundo del fútbol",
        consequences: { agent_name: "Tu padre", moral: 4 },
      },
      {
        id: "agente",
        label: `Firmar con ${agent.name}, ${agent.article} en la cantera`,
        subtitle: agent.pitch,
        consequences: { agent_name: agent.name, patrimonio: -agent.fee },
      },
    ],
  };
}

/**
 * Segundo evento, siempre igual y siempre justo después de elegir
 * representante: 2-3 ofertas de clubes modestos para arrancar. No hay
 * "gran club" todavía, eso se gana jugando.
 */
/** Reserva por si la escena de contrato generada por IA falla (sin crédito, error de red, etc.) */
export function buildFallbackContractEvent(
  club: string,
  agentName: string,
  isFirstSigning: boolean,
): GameEvent {
  const salary = isFirstSigning
    ? `${(Math.round((600 + Math.random() * 1900) / 50) * 50).toLocaleString("es")} € al mes`
    : `${(Math.round((12000 + Math.random() * 40000) / 500) * 500).toLocaleString("es")} € a la semana`;
  const minutosClause = isFirstSigning
    ? "sin ninguna promesa de minutos: tendrás que ganarte el puesto en pretemporada"
    : "titular indiscutible desde el primer partido";

  return {
    id: `contrato-${isFirstSigning ? "debut" : "fallback"}-${Date.now()}`,
    category: "representante",
    title: "Firma del contrato",
    description: `Te sientas con el entrenador, el presidente del ${club} y ${agentName} para cerrar los términos: ${salary} de salario y ${minutosClause}.`,
    milestoneType: "contrato",
    imageScene: `Photorealistic photo of the photographed man holding up a ${describeKit(club)} football jersey with both hands at an official club unveiling event, a club president in a suit next to him extending a handshake, camera flashes, stadium or press room backdrop, official club photo style`,
    options: [
      {
        id: "a",
        label: "Aceptar las condiciones tal cual las trae el club",
        subtitle: "Rápido y sin fricción",
        consequences: { moral: 3, rel_entrenador: 3 },
      },
      {
        id: "b",
        label: `Dejar que ${agentName} presione por mejores condiciones`,
        subtitle: "Puede tensar la negociación",
        consequences: { patrimonio: isFirstSigning ? 300 : 3000, rel_representante: 4, moral: -1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Algo que quieras dejar claro antes de firmar?",
  };
}

export function buildInicioFichajeEvent(agentName: string): GameEvent {
  const offers = pickStartingClubOffers();
  const hasGiant = offers.some((o) => o.club === "Real Madrid" || o.club === "FC Barcelona");

  return {
    id: "inicio-fichaje-agente",
    category: "representante",
    title: "Las primeras ofertas",
    description: hasGiant
      ? `${agentName} se reúne contigo con una noticia enorme: uno de los clubes interesados en ti es un auténtico gigante. Los otros dos son puertas de entrada más modestas, pero esta vez hay una oportunidad que casi nunca llega.`
      : `${agentName} se reúne contigo con dos o tres clubes modestos interesados en darte tu primer contrato profesional. Ninguno es un gigante, pero todos son una puerta de entrada.`,
    milestoneType: "debut",
    options: offers.map((offer) => ({
      id: offer.club,
      label: `Firmar por el ${offer.club}`,
      subtitle: offer.pitch,
      consequences: { club: offer.club, moral: 5 },
    })),
  };
}

function randomPrice(min: number, max: number, roundTo: number): number {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / roundTo) * roundTo;
}

function pickThree<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, 3);
}

const HOME_LISTINGS = [
  { name: "Piso de dos habitaciones cerca de la ciudad deportiva", min: 90000, max: 130000 },
  { name: "Ático con terraza en pleno centro", min: 140000, max: 190000 },
  { name: "Casa a las afueras, cerca de donde creciste", min: 100000, max: 150000 },
  { name: "Dúplex nuevo en una zona residencial tranquila", min: 110000, max: 160000 },
  { name: "Piso reformado junto al estadio", min: 95000, max: 135000 },
];

const MANSION_LISTINGS = [
  { name: "Mansión con piscina en una urbanización exclusiva", min: 1800000, max: 2600000 },
  { name: "Ático de lujo con vistas a toda la ciudad", min: 1200000, max: 1900000 },
  { name: "Finca con terreno propio y zona de entrenamiento personal", min: 2200000, max: 3400000 },
  { name: "Villa moderna junto al mar", min: 1600000, max: 2400000 },
  { name: "Casa histórica reformada en el barrio más exclusivo", min: 1900000, max: 2800000 },
];

/**
 * Comprar la primera vivienda: 3 opciones sorteadas de un catálogo, cada
 * una con un precio real que se descuenta del patrimonio tal cual, no una
 * cifra aproximada fija. Si el jugador ya tiene pareja, su opinión entra
 * en la decisión en vez de comprar en solitario.
 */
export function buildCasaEvent(player: Player): GameEvent {
  const listings = pickThree(HOME_LISTINGS).map((l) => ({
    ...l,
    price: randomPrice(l.min, l.max, 5000),
  }));
  const partner = typeof player.flags?.pareja === "string" ? player.flags.pareja : null;

  return {
    id: "vid-casa",
    category: "vida",
    title: "Tu primer contrato importante",
    description: partner
      ? `Con el nuevo sueldo, tu representante te enseña tres opciones de vivienda. Se las enseñas también a ${partner}, que tiene bastante claro cuál le gusta más — aunque la decisión final es tuya. El precio es el de venta; lo que pagas ahora es la entrada, el resto se financia con hipoteca.`
      : "Con el nuevo sueldo, tu representante te sugiere invertir en una vivienda propia y te enseña tres opciones. El precio es el de venta; lo que pagas ahora es la entrada, el resto se financia con hipoteca.",
    options: [
      ...listings.map((l, i) => {
        const downPayment = Math.round((l.price * 0.2) / 500) * 500;
        return {
          id: `casa-${i}`,
          label: `${l.name} — ${l.price.toLocaleString("es")} €`,
          subtitle: `Entrada: ${downPayment.toLocaleString("es")} €`,
          consequences: { patrimonio: -downPayment, moral: 5 },
        };
      }),
      {
        id: "esperar",
        label: "Esperar y seguir alquilando",
        subtitle: "Conservador",
        consequences: { patrimonio: 0 },
      },
    ],
    minWeek: 8,
  };
}

/**
 * La segunda vivienda, ya con la carrera consolidada: mismo mecanismo que
 * buildCasaEvent pero con un catálogo de lujo.
 */
export function buildMansionEvent(player: Player): GameEvent {
  const listings = pickThree(MANSION_LISTINGS).map((l) => ({
    ...l,
    price: randomPrice(l.min, l.max, 50000),
  }));
  const partner = typeof player.flags?.pareja === "string" ? player.flags.pareja : null;

  return {
    id: "vid-mansion-lujo",
    category: "vida",
    title: "La casa con la que soñabas de pequeño",
    description: partner
      ? `Con la carrera en su mejor momento, tu representante os enseña tres propiedades a ti y a ${partner}. La típica casa que veías desde fuera de la verja cuando eras un chaval sin nada, y ahora te la pueden vender a ti — si los dos os ponéis de acuerdo. El precio es el de venta; lo que pagas ahora es la entrada.`
      : "Con la carrera en su mejor momento, tu representante te enseña tres propiedades. La típica casa que veías desde fuera de la verja cuando eras un chaval sin nada. Ahora te la pueden vender a ti. El precio es el de venta; lo que pagas ahora es la entrada.",
    options: [
      ...listings.map((l, i) => {
        const downPayment = Math.round((l.price * 0.3) / 10000) * 10000;
        return {
          id: `mansion-${i}`,
          label: `${l.name} — ${l.price.toLocaleString("es")} €`,
          subtitle: `Entrada: ${downPayment.toLocaleString("es")} €`,
          consequences: { patrimonio: -downPayment, moral: 8, fama: 3 },
        };
      }),
      {
        id: "descartar",
        label: "Descartarlo, sigues prefiriendo algo discreto",
        subtitle: "Perfil bajo pese al dinero",
        consequences: { moral: 2 },
      },
    ],
    minWeek: 65,
  };
}

/**
 * La oferta de Arabia Saudí, en la recta final de la carrera: si el
 * jugador tiene pareja, la decisión se habla con ella antes de nada
 * (igual que la partida original que inspiró Beyond 90), no se decide en
 * solitario.
 */
export function buildOfertaArabiaEvent(player: Player): GameEvent {
  const partner = typeof player.flags?.pareja === "string" ? player.flags.pareja : null;
  const tieneHijos = Boolean(player.flags?.hijos);

  const description = partner
    ? `Un club de la liga saudí pone sobre la mesa una cifra que no se parece a nada de lo que has visto en Europa. Antes de responder nada, te sientas a hablarlo con ${partner}${tieneHijos ? ", con los niños ya en la ecuación" : ""}: significa dejar la élite competitiva en su momento más alto, cambiar de país y empezar de cero fuera del campo también.`
    : "Un club de la liga saudí pone sobre la mesa una cifra que no se parece a nada de lo que has visto en Europa. Tu representante te avisa: esto no se va a repetir, pero también significa dejar la élite competitiva en su momento más alto.";

  const options: GameEvent["options"] = partner
    ? [
        {
          id: "a",
          label: `Aceptar, con ${partner} de acuerdo en dar el salto juntos`,
          subtitle: "+Patrimonio enorme, sales de la élite competitiva",
          consequences: {
            club: "Al-Nassr FC",
            patrimonio: 900000,
            fama: 4,
            moral: 8,
            rel_aficion: -10,
          },
        },
        {
          id: "b",
          label: `Aceptar aunque a ${partner} le cueste dejar atrás su vida aquí`,
          subtitle: "+Patrimonio enorme, tensión en casa",
          consequences: {
            club: "Al-Nassr FC",
            patrimonio: 900000,
            fama: 4,
            moral: -4,
            rel_aficion: -10,
          },
        },
        {
          id: "c",
          label: "Rechazarla: la vida que tenéis construida pesa más",
          subtitle: "Prioridad: la familia y el legado deportivo, no el dinero",
          consequences: { reputacion: 10, moral: 5 },
        },
      ]
    : [
        {
          id: "a",
          label: "Aceptar, es el contrato de tu vida",
          subtitle: "+Patrimonio enorme, sales de la élite competitiva",
          consequences: {
            club: "Al-Nassr FC",
            patrimonio: 900000,
            fama: 4,
            moral: 6,
            rel_aficion: -10,
          },
        },
        {
          id: "b",
          label: "Rechazarla y seguir compitiendo en Europa",
          subtitle: "Prioridad: el legado deportivo, no el dinero",
          consequences: { reputacion: 10, moral: 3 },
        },
      ];

  return {
    id: "fork-oferta-arabia",
    category: "representante",
    priority: true,
    title: partner ? `Hablarlo con ${partner} antes de decidir` : "La oferta que cambia los números para siempre",
    description,
    milestoneType: "contrato",
    allowFreeText: true,
    freeTextPrompt: partner ? `¿Qué le dices a ${partner} para convencerla o para dejarlo pasar?` : "¿Qué es lo primero que piensas al leer la cifra?",
    imageScene:
      "Photorealistic photo of the photographed man in a tailored suit shaking hands with club executives in a luxurious modern office, Middle Eastern architecture visible through large windows, official signing photo style",
    options,
    minWeek: 155,
    minMedia: 60,
  };
}

/**
 * Secuencia de pretemporada, garantizada y encadenada, justo después de la
 * firma del primer contrato ("contrato-debut-*"): entrenamiento con los
 * mayores → lesión con el fisio → mensaje de una ex del instituto. Después
 * de esto la carrera cae en el pool normal.
 */
/** Variantes de cómo arranca el primer entrenamiento, para que no sea siempre la misma escena. */
const DEBUT_PRETEMP1_INTROS = (club: string) => [
  `Llegas a la ciudad deportiva del ${club} antes del amanecer, con las manos sudando. Los veteranos ya están estirando cuando entras al vestuario — nadie te mira dos veces todavía. El primer rondo te deja sin aire: esto no se parece en nada a lo que jugabas hace un mes.`,
  `Llegas tarde a tu primer día en la ciudad deportiva del ${club} por los nervios de la noche anterior. El vestuario ya está casi lleno; un veterano te lanza una camiseta de entrenamiento sin decir nada. En el primer sprint te dejan atrás como si corrieras con las piernas de otro.`,
  `El entrenador te presenta al grupo por tu nombre completo delante de toda la plantilla del ${club}. Se hace un silencio incómodo de dos segundos antes de que alguien diga "bienvenido" sin mucha convicción. El primer ejercicio de posesión te hace parecer un niño perdido entre profesionales.`,
];

export function buildDebutPretemp1(club: string): GameEvent {
  const intros = DEBUT_PRETEMP1_INTROS(club);
  const description = intros[Math.floor(Math.random() * intros.length)];

  return {
    id: "debut-pretemp-1",
    category: "entrenamiento",
    title: "Primer entrenamiento con los mayores",
    description,
    options: [
      {
        id: "a",
        label: "Meterte de lleno aunque no puedas seguirles el ritmo",
        subtitle: "+Forma, te ganas una primera mirada",
        consequences: { forma: 6, rel_vestuario: 3, moral: 3 },
      },
      {
        id: "b",
        label: "Ir con cabeza, observar antes de forzar",
        subtitle: "+Relación con el entrenador",
        consequences: { rel_entrenador: 5, forma: 2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "El primer veterano que te dirige la palabra te pregunta de dónde sales. ¿Qué le dices?",
  };
}

/** Variantes de la primera lesión leve de pretemporada, para que no sea siempre la misma escena. */
const DEBUT_PRETEMP2_VARIANTS = [
  {
    title: "El fisio del club se presenta",
    description:
      'En un ejercicio de cambios de ritmo sientes un pinchazo seco en el isquiotibial. Marta Solís, la fisioterapeuta del primer equipo, te hace tumbarte en la camilla y te palpa la zona sin prisa. "Bienvenido. Vamos a conocernos bien tú y yo este año — mejor que sea lo menos posible, pero para eso tienes que hacerme caso", te dice con media sonrisa. No es grave, pero te frena unos días.',
  },
  {
    title: "Un tobillo hinchado el segundo día",
    description:
      'Un mal apoyo en un ejercicio de velocidad y el tobillo se te hincha en minutos. El fisio del club, Javier Ruano, te lo venda sin dramatizar: "Esto es del pack de bienvenida, a todos os pasa. Dame unos días y estás como nuevo." No es grave, pero te frena unos días.',
  },
  {
    title: "La sobrecarga que nadie te avisó",
    description:
      'Llevas dos días exigiéndote al máximo para causar buena impresión, y el cuerpo pasa factura: una sobrecarga muscular te obliga a parar en pleno rondo. El preparador físico te mira con media sonrisa cansada: "Novato que se mata a entrenar la primera semana. Clásico. Vamos a frenar antes de que sea peor."',
  },
];

export function buildDebutPretemp2(): GameEvent {
  const variant =
    DEBUT_PRETEMP2_VARIANTS[Math.floor(Math.random() * DEBUT_PRETEMP2_VARIANTS.length)];

  return {
    id: "debut-pretemp-2",
    category: "entrenamiento",
    title: variant.title,
    description: variant.description,
    options: [
      {
        id: "a",
        label: "Seguir su plan de recuperación al pie de la letra",
        subtitle: "Más lento, pero seguro",
        consequences: { moral: 4, rel_entrenador: 2 },
      },
      {
        id: "b",
        label: "Pedirle que te deje volver antes de tiempo",
        subtitle: "Quieres no perderte nada de la pretemporada",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "forma",
          success: {
            text: "Marta cede y te deja volver antes. Aguantas bien y no pasa nada — esta vez.",
            consequences: { forma: 4, moral: 5 },
          },
          fail: {
            text: "Vuelves demasiado pronto y la molestia regresa, peor que antes. Marta no dice \"te lo dije\", pero se le nota.",
            consequences: { forma: -10, moral: -4 },
          },
        },
      },
    ],
    minWeek: 2,
  };
}

/** Variantes de quién te escribe tras el fichaje, para que no sea siempre la misma persona. */
const DEBUT_PRETEMP3_VARIANTS = [
  {
    who: "Carla",
    title: "Un mensaje del instituto",
    description:
      'Entre entrenamientos te llega un mensaje que no esperabas: Carla, con quien saliste un tiempo en el instituto y con la que no hablas desde hace más de un año. "Te vi en el periódico de la ciudad, fichaste por el equipo de aquí. Me alegro muchísimo por ti, en serio." Vuelves a leerlo dos veces.',
  },
  {
    who: "Diego",
    title: "Tu mejor amigo de la infancia",
    description:
      'Diego, con quien creciste jugando en la calle antes de que él dejara el fútbol, te escribe nada más verte en las redes del club: "No me lo puedo creer, tío. En serio, no me lo puedo creer. Te lo has ganado." Hace meses que no hablabais.',
  },
  {
    who: "tu antiguo entrenador",
    title: "Un antiguo entrenador de la cantera",
    description:
      'El primer entrenador que te dio minutos de verdad, cuando nadie más confiaba en ti, te manda un audio de casi dos minutos. Se le entrecorta la voz al final: "Ya sabía yo que ibas a llegar. Que no se te olvide de dónde vienes."',
  },
];

export function buildDebutPretemp3(): GameEvent {
  const variant =
    DEBUT_PRETEMP3_VARIANTS[Math.floor(Math.random() * DEBUT_PRETEMP3_VARIANTS.length)];

  return {
    id: "debut-pretemp-3",
    category: "vida",
    title: variant.title,
    description: variant.description,
    options: [
      {
        id: "a",
        label: "Responderle con cariño y ponerte al día",
        subtitle: "+Moral",
        consequences: { moral: 6 },
      },
      {
        id: "b",
        label: "Responder cordial y dejarlo ahí",
        subtitle: "Página pasada",
        consequences: { moral: 2 },
      },
      {
        id: "c",
        label: "No responder todavía",
        subtitle: "Necesitas pensarlo",
        consequences: { moral: -1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: `¿Qué le respondes a ${variant.who}?`,
    minWeek: 3,
  };
}

export const EVENTS: GameEvent[] = [
  // ── ENTRENAMIENTO ──────────────────────────────────────────────
  {
    id: "ent-primer-dia",
    category: "entrenamiento",
    title: "Primer día de pretemporada",
    description:
      "Llegas al centro de entrenamiento sin conocer a nadie. El preparador físico te mira de arriba abajo antes de darte el plan de la semana.",
    options: [
      {
        id: "a",
        label: "Dar el máximo desde el primer minuto",
        subtitle: "+Forma, riesgo de sobrecarga",
        consequences: { forma: 6, moral: 2 },
      },
      {
        id: "b",
        label: "Ir de menor a mayor",
        subtitle: "Progresión segura",
        consequences: { forma: 2, moral: 1 },
      },
      {
        id: "c",
        label: "Presentarte a todos antes de entrenar",
        subtitle: "+Vestuario",
        consequences: { rel_vestuario: 5, forma: 1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "Si te presentas al grupo, ¿qué dices?",
  },
  {
    id: "ent-sesion-extra",
    category: "entrenamiento",
    title: "El mister propone una sesión extra",
    description:
      "Después del entrenamiento oficial, el entrenador se queda a trabajar remates contigo. Nadie más está invitado.",
    options: [
      {
        id: "a",
        label: "Quedarte",
        subtitle: "+Relación con el entrenador, -Forma",
        consequences: { rel_entrenador: 8, forma: -3, moral: 2 },
      },
      {
        id: "b",
        label: "Agradecer pero descansar",
        subtitle: "Cuidas el cuerpo",
        consequences: { forma: 3, rel_entrenador: -2 },
      },
    ],
    minWeek: 2,
  },
  {
    id: "ent-lesion-susto",
    category: "entrenamiento",
    title: "Un tirón en un ejercicio de velocidad",
    description:
      "Sientes un pinchazo en el isquiotibial durante un sprint. El fisio te pregunta si puedes seguir.",
    options: [
      {
        id: "a",
        label: "Parar ya",
        subtitle: "Evitas una lesión grave",
        consequences: { forma: -2, moral: -1 },
      },
      {
        id: "b",
        label: "Seguir, no quiero parecer blando",
        subtitle: "Jugada de riesgo",
        consequences: { forma: -10, rel_vestuario: 3 },
      },
    ],
    minWeek: 3,
  },
  {
    id: "ent-video-analisis",
    category: "entrenamiento",
    title: "Sesión de vídeo",
    description:
      "El cuerpo técnico te muestra tus errores posicionales de la última semana frente a todo el equipo.",
    options: [
      {
        id: "a",
        label: "Tomar nota en silencio",
        subtitle: "Profesionalismo",
        consequences: { rel_entrenador: 4, moral: -1 },
      },
      {
        id: "b",
        label: "Defender tu posición delante de todos",
        subtitle: "Puede sonar a excusa",
        consequences: { rel_entrenador: -4, rel_vestuario: 2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al cuerpo técnico?",
  },
  {
    id: "ent-descanso",
    category: "entrenamiento",
    title: "Día libre inesperado",
    description: "El club cancela el entrenamiento por lluvia. Tienes el día para ti.",
    options: [
      {
        id: "a",
        label: "Entrenar por tu cuenta igual",
        subtitle: "+Forma, +Relación entrenador",
        consequences: { forma: 4, rel_entrenador: 2 },
      },
      {
        id: "b",
        label: "Descansar de verdad",
        subtitle: "+Moral",
        consequences: { moral: 5 },
      },
    ],
  },

  // ── PARTIDO ────────────────────────────────────────────────────
  {
    id: "par-debut",
    category: "partido",
    title: "Minutos en el amistoso de pretemporada",
    description: "El entrenador te da los últimos 20 minutos contra un rival de categoría superior.",
    options: [
      {
        id: "a",
        label: "Arriesgar para destacar",
        subtitle: "Todo o nada",
        consequences: { forma: 3, fama: 2, rel_entrenador: 3 },
      },
      {
        id: "b",
        label: "Jugar simple y no fallar",
        subtitle: "Seguro",
        consequences: { rel_entrenador: 5, forma: 1 },
      },
    ],
  },
  {
    id: "par-titular",
    category: "partido",
    title: "Te confirman como titular",
    description: "El entrenador te da la titularidad para el próximo partido de liga. Es tu oportunidad.",
    options: [
      {
        id: "a",
        label: "Aceptar la responsabilidad",
        subtitle: "+Moral, +Fama",
        consequences: { moral: 6, fama: 4, rel_entrenador: 3 },
      },
      {
        id: "b",
        label: "Pedirle que confíe en la rotación",
        subtitle: "Prudente",
        consequences: { rel_vestuario: 4, moral: -2 },
      },
    ],
    minWeek: 3,
  },
  {
    id: "par-mal-partido",
    category: "partido",
    title: "Un partido para el olvido",
    description: "Fallaste un penalti decisivo y las redes ya están hablando de ti.",
    options: [
      {
        id: "a",
        label: "Salir a hablar con la prensa igual",
        subtitle: "Da la cara",
        consequences: { fama: 3, moral: -3, rel_aficion: 4 },
      },
      {
        id: "b",
        label: "No hacer declaraciones",
        subtitle: "Bajas el ruido",
        consequences: { moral: 2, rel_aficion: -3 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices a la prensa después del partido?",
    minWeek: 4,
  },
  {
    id: "par-gol-decisivo",
    category: "partido",
    title: "Gol en el último minuto",
    description: "Metes el gol de la victoria en el descuento. El estadio explota con tu nombre.",
    options: [
      {
        id: "a",
        label: "Correr a festejar con la hinchada",
        subtitle: "+Afición, +Fama",
        consequences: { rel_aficion: 10, fama: 8, moral: 6 },
      },
      {
        id: "b",
        label: "Festejo discreto, mirando al banco",
        subtitle: "+Entrenador",
        consequences: { rel_entrenador: 6, fama: 3 },
      },
    ],
    minWeek: 5,
  },
  {
    id: "par-banco",
    category: "partido",
    title: "Tres partidos seguidos en el banco",
    description: "El entrenador no te está dando minutos y no te explica por qué.",
    options: [
      {
        id: "a",
        label: "Pedirle una charla cara a cara",
        subtitle: "Directo",
        consequences: { rel_entrenador: -2, moral: 3 },
      },
      {
        id: "b",
        label: "Callar y seguir entrenando fuerte",
        subtitle: "Profesionalidad",
        consequences: { forma: 4, moral: -3 },
      },
      {
        id: "c",
        label: "Comentárselo a tu representante",
        subtitle: "Mueve hilos por fuera",
        consequences: { rel_representante: 5, rel_entrenador: -3 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "Si pides la charla cara a cara, ¿qué le dices al entrenador?",
    minWeek: 6,
  },

  // ── VESTUARIO ──────────────────────────────────────────────────
  {
    id: "ves-novato",
    category: "vestuario",
    title: "La broma de novato",
    description: "Los veteranos de la plantilla te hacen cantar delante de todos en el vestuario, como es tradición.",
    options: [
      {
        id: "a",
        label: "Cantar sin problema",
        subtitle: "+Vestuario",
        consequences: { rel_vestuario: 8, moral: 3 },
      },
      {
        id: "b",
        label: "Negarte con humor",
        subtitle: "Arriesgado pero con personalidad",
        consequences: { rel_vestuario: -2, fama: 2 },
      },
    ],
  },
  {
    id: "ves-capitan",
    category: "vestuario",
    title: "El capitán te pide un favor",
    description: "El capitán del equipo te pide que cubras un entrenamiento suyo con un patrocinador porque él no puede ir.",
    options: [
      {
        id: "a",
        label: "Hacerlo sin pedir nada a cambio",
        subtitle: "+Vestuario, +Fama",
        consequences: { rel_vestuario: 6, fama: 3 },
      },
      {
        id: "b",
        label: "Decir que no tienes tiempo",
        subtitle: "Cuidas tu agenda",
        consequences: { rel_vestuario: -4, moral: 1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes al capitán?",
    minWeek: 3,
  },
  {
    id: "ves-conflicto",
    category: "vestuario",
    title: "Discusión en un entrenamiento",
    description: "Un compañero te reclama fuerte una jugada en un rondo. Todo el grupo está mirando.",
    options: [
      {
        id: "a",
        label: "Responder con la misma intensidad",
        subtitle: "No te achicas",
        consequences: { rel_vestuario: -3, fama: 1 },
      },
      {
        id: "b",
        label: "Bajar el tono y seguir",
        subtitle: "Madurez",
        consequences: { rel_vestuario: 3, moral: -1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes?",
  },
  {
    id: "ves-cena-equipo",
    category: "vestuario",
    title: "Cena de equipo",
    description: "La plantilla organiza una cena para conocerse fuera del campo. No es obligatoria.",
    options: [
      {
        id: "a",
        label: "Ir e integrarte",
        subtitle: "+Vestuario, +Moral",
        consequences: { rel_vestuario: 6, moral: 4 },
      },
      {
        id: "b",
        label: "Faltar para descansar",
        subtitle: "+Forma",
        consequences: { forma: 3, rel_vestuario: -3 },
      },
    ],
  },
  {
    id: "ves-nuevo-fichaje",
    category: "vestuario",
    title: "Llega un fichaje en tu posición",
    description: "El club ficha a un jugador para tu misma posición. La competencia por el puesto se pone difícil.",
    options: [
      {
        id: "a",
        label: "Recibirlo bien y ayudarlo a adaptarse",
        subtitle: "+Vestuario",
        consequences: { rel_vestuario: 5, moral: -2 },
      },
      {
        id: "b",
        label: "Mantener las distancias",
        subtitle: "Es competencia directa",
        consequences: { forma: 3, rel_vestuario: -2 },
      },
    ],
    minWeek: 5,
  },

  // ── REPRESENTANTE ──────────────────────────────────────────────
  {
    id: "rep-primera-oferta",
    category: "representante",
    title: "Un agente quiere representarte",
    description: "Después de un buen partido, un representante se acerca a tu familia para ofrecerte sus servicios.",
    options: [
      {
        id: "a",
        label: "Aceptar la oferta",
        subtitle: "+Relaciones y oportunidades",
        consequences: { rel_representante: 10, fama: 2 },
      },
      {
        id: "b",
        label: "Seguir con tu padre manejando todo",
        subtitle: "Confianza en la familia",
        consequences: { moral: 3 },
      },
    ],
  },
  {
    id: "rep-comision",
    category: "representante",
    title: "Tu representante pide subir su comisión",
    description: "Alega que con tu progresión reciente el trabajo que hace vale más. Tu familia no está de acuerdo.",
    options: [
      {
        id: "a",
        label: "Aceptar sin discutir",
        subtitle: "Confianza total",
        consequences: { rel_representante: 8, patrimonio: -3000 },
      },
      {
        id: "b",
        label: "Negociar la mitad de la subida",
        subtitle: "Negociación limpia",
        consequences: { rel_representante: 2, patrimonio: -1000 },
      },
      {
        id: "c",
        label: "Romper la relación",
        subtitle: "Te quedas sin representante",
        consequences: { rel_representante: -30, moral: -2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices sobre el dinero?",
    minWeek: 6,
  },
  {
    id: "rep-oferta-fichaje",
    category: "representante",
    title: "Interés de otro club",
    description: "Tu representante te cuenta que otro club de mayor nivel preguntó por ti. No es una oferta formal todavía.",
    options: [
      {
        id: "a",
        label: "Escuchar y dejar avanzar la operación",
        subtitle: "Ambición y ruido: puede quedar en nada o convertirse en oferta real",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "fama",
          success: {
            text: "La operación se activa de verdad: llega una oferta formal sobre la mesa.",
            consequences: { rel_representante: 8, fama: 5 },
          },
          fail: {
            text: "El interés se enfría. El club nunca llega a formalizar nada.",
            consequences: { moral: -3, rel_representante: 1 },
          },
        },
      },
      {
        id: "b",
        label: "Cerrar la puerta: aquí estás bien",
        subtitle: "Vestuario y afición lo valoran",
        consequences: { rel_vestuario: 5, rel_aficion: 5 },
      },
    ],
    minWeek: 7,
  },
  {
    id: "rep-patrocinio",
    category: "representante",
    title: "Primera oferta de patrocinio",
    description: "Una marca deportiva te ofrece un contrato de imagen menor, tu primer ingreso fuera del fútbol.",
    options: [
      {
        id: "a",
        label: "Firmar",
        subtitle: "+Patrimonio, +Fama",
        consequences: { patrimonio: 5000, fama: 4 },
      },
      {
        id: "b",
        label: "Esperar una oferta mejor",
        subtitle: "Apuesta a futuro",
        consequences: { moral: -1 },
      },
    ],
    minWeek: 4,
  },
  {
    id: "rep-consejo",
    category: "representante",
    title: "Tu representante te sugiere un cambio de estilo",
    description: 'Te dice que "vendes" mejor con una imagen más pública, más redes, más presencia.',
    options: [
      {
        id: "a",
        label: "Seguirle el consejo",
        subtitle: "+Fama, -Vestuario",
        consequences: { fama: 6, rel_vestuario: -3 },
      },
      {
        id: "b",
        label: "Seguir siendo discreto",
        subtitle: "Perfil bajo",
        consequences: { rel_vestuario: 2, fama: -1 },
      },
    ],
    minWeek: 5,
  },

  // ── PRENSA ─────────────────────────────────────────────────────
  {
    id: "pre-primera-entrevista",
    category: "prensa",
    title: "Tu primera entrevista",
    description: "Un medio local te pide unas palabras después del entrenamiento.",
    options: [
      {
        id: "a",
        label: "Hablar con confianza",
        subtitle: "+Fama",
        consequences: { fama: 4, rel_vestuario: 1 },
      },
      {
        id: "b",
        label: "Responder con generalidades",
        subtitle: "Bajo perfil",
        consequences: { rel_entrenador: 2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le cuentas al periodista?",
  },
  {
    id: "pre-rumor-falso",
    category: "prensa",
    title: "Un rumor falso sobre ti",
    description: "Un portal de rumores publica que estás en conflicto con el entrenador. No hay nada de cierto.",
    options: [
      {
        id: "a",
        label: "Desmentirlo públicamente",
        subtitle: "Corta el ruido",
        consequences: { rel_entrenador: 3, fama: 2 },
      },
      {
        id: "b",
        label: "Ignorarlo",
        subtitle: "No le das aire",
        consequences: { moral: -1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "Si decides desmentirlo, ¿qué dices exactamente?",
    minWeek: 4,
  },
  {
    id: "pre-paparazzi",
    category: "prensa",
    title: "Cazado por los paparazzi",
    description: "Una revista publica fotos tuyas cenando con alguien en un restaurante de la ciudad. La reputación está en juego.",
    options: [
      {
        id: "a",
        label: "Negarlo todo",
        subtitle: '"No tengo nada que ocultar"',
        consequences: { fama: 2, moral: -2 },
      },
      {
        id: "b",
        label: "Admitir y aclarar",
        subtitle: '"Fue una cena con amigos"',
        consequences: { fama: 4, rel_aficion: 1 },
      },
      {
        id: "c",
        label: "Guardar silencio",
        subtitle: "No respondes a nadie",
        consequences: { moral: 1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Cómo lo manejas?",
    minWeek: 8,
  },
  {
    id: "pre-cronica-elogio",
    category: "prensa",
    title: "Un cronista histórico te elogia",
    description: 'Un periodista reconocido escribe que eres "lo mejor que vio en años" en la categoría.',
    options: [
      {
        id: "a",
        label: "Compartirlo en tus redes",
        subtitle: "+Fama, -Vestuario",
        consequences: { fama: 6, rel_vestuario: -2 },
      },
      {
        id: "b",
        label: "No darle importancia en público",
        subtitle: "Humildad",
        consequences: { rel_vestuario: 3, moral: 2 },
      },
    ],
    minWeek: 6,
  },
  {
    id: "pre-polemica",
    category: "prensa",
    title: "Declaración sacada de contexto",
    description: "Un medio recorta una frase tuya y la vuelve polémica. Empieza a circular.",
    options: [
      {
        id: "a",
        label: "Salir a aclarar de inmediato",
        subtitle: "Control de daños",
        consequences: { fama: -1, moral: 1 },
      },
      {
        id: "b",
        label: "Dejar que se apague solo",
        subtitle: "Riesgoso",
        consequences: { fama: 2, moral: -3 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué aclaración das exactamente?",
    minWeek: 7,
  },

  // ── VIDA ───────────────────────────────────────────────────────
  {
    id: "vid-familia",
    category: "vida",
    title: "Cena en casa",
    description: "Tu familia te recuerda que fuera del club sigues siendo el mismo de siempre.",
    options: [
      {
        id: "a",
        label: "Seguir enfocado en lo profesional",
        subtitle: "Profesionalidad",
        consequences: { forma: 2, moral: -1 },
      },
      {
        id: "b",
        label: "Desconectar de verdad esta noche",
        subtitle: "+Moral",
        consequences: { moral: 5 },
      },
    ],
  },
  {
    id: "vid-nueva-relacion",
    category: "vida",
    title: "Conoces a alguien",
    description: "En una salida con amigos conoces a una persona con la que hay buena onda desde el primer momento.",
    options: [
      {
        id: "a",
        label: "Dar el paso",
        subtitle: "+Moral, riesgo de prensa",
        consequences: { moral: 6, fama: 1 },
      },
      {
        id: "b",
        label: "Mantenerlo en privado por ahora",
        subtitle: "Prudente",
        consequences: { moral: 2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué haces?",
    minWeek: 4,
  },
  {
    id: "vid-amigos-infancia",
    category: "vida",
    title: "Tus amigos de siempre te visitan",
    description: "El grupo con el que creciste viene a verte jugar por primera vez desde que eres profesional.",
    options: [
      {
        id: "a",
        label: "Pasar el día entero con ellos",
        subtitle: "+Moral",
        consequences: { moral: 6, forma: -2 },
      },
      {
        id: "b",
        label: "Verlos un rato y volver a la rutina",
        subtitle: "Equilibrio",
        consequences: { moral: 3, forma: 1 },
      },
    ],
    minWeek: 5,
  },
  {
    id: "vid-presion-familiar",
    category: "vida",
    title: "Tu padre quiere opinar sobre tu carrera",
    description: "Después de años acompañándote, tu padre no está de acuerdo con una decisión reciente de tu representante.",
    options: [
      {
        id: "a",
        label: "Escucharlo y darle su lugar",
        subtitle: "+Moral",
        consequences: { moral: 4, rel_representante: -2 },
      },
      {
        id: "b",
        label: "Decirle que ahora las decisiones son tuyas",
        subtitle: "Independencia",
        consequences: { moral: -2, rel_representante: 3 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes a tu padre?",
    minWeek: 6,
  },

  {
    id: "esp-leyenda-tunel",
    category: "especial",
    title: "Una leyenda se cruza contigo en el túnel",
    description:
      'Rui Cardoso, el 7 que marcó una generación entera y sigue compitiendo a los 39 años, te para antes de salir al campo. "Chaval, júntate a mí y aprenderás", te dice mirándote fijo.',
    imageScene:
      "Photorealistic photo in a stadium tunnel, the photographed man standing face to face with a veteran footballer legend, both in different club kits, intense respectful eye contact, dramatic tunnel lighting, sports photography style",
    options: [
      {
        id: "a",
        label: "Aceptar y pegarte a él",
        subtitle: "+Forma, +Relación con el entrenador",
        consequences: { forma: 6, moral: 6, rel_entrenador: 4 },
      },
      {
        id: "b",
        label: "Agradecer pero seguir tu propio camino",
        subtitle: "Independencia",
        consequences: { moral: 3, fama: 2 },
      },
      {
        id: "c",
        label: '"Ya estás mayor para darme lecciones"',
        subtitle: "Arrogancia, +Fama, -Vestuario",
        consequences: { fama: 8, rel_vestuario: -6, moral: -2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes?",
    minWeek: 20,
  },
  {
    id: "vid-paparazzi-cita",
    category: "vida",
    title: "Cazado por los paparazzi",
    description:
      "Nadia Solaris, una influencer de moda que conociste hace poco, te invita a cenar. Nadie tenía por qué enterarse... hasta que un fotógrafo os reconoce desde la calle.",
    imageScene:
      "Paparazzi-style candid photo taken through a restaurant window at night, grainy flash photography, tabloid magazine aesthetic, the photographed man sitting at a table across from a stylish young woman with long dark hair, both caught off guard mid-conversation, warm restaurant lighting, subtle motion blur suggesting a hidden photographer, photorealistic",
    options: [
      {
        id: "a",
        label: "Sonreír y saludar a las cámaras",
        subtitle: "+Fama, lo asumes en público",
        consequences: { fama: 8, rel_aficion: 4, moral: 2 },
      },
      {
        id: "b",
        label: "Taparte la cara y salir rápido",
        subtitle: "Proteges tu privacidad",
        consequences: { fama: -2, moral: 4 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Cómo lo manejas al día siguiente?",
    minWeek: 9,
  },

  // ── ESPECIAL / SURREALISTA ───────────────────────────────────────
  {
    id: "esp-cantante",
    category: "especial",
    title: "Un cantante famoso te menciona en una canción",
    description: 'Malume Baby, el artista del momento, saca un tema nuevo y en un verso dice tu nombre. Se vuelve tendencia en minutos.',
    options: [
      {
        id: "a",
        label: "Responderle en redes con humor",
        subtitle: "Momento viral",
        consequences: { fama: 10, moral: 3 },
      },
      {
        id: "b",
        label: "No decir nada y disfrutarlo en privado",
        subtitle: "Perfil bajo",
        consequences: { fama: 4, moral: 4 },
      },
    ],
    minWeek: 6,
  },
  {
    id: "esp-influencer",
    category: "especial",
    title: "Una influencer te invita a su podcast",
    description: "Marta Diass, con millones de seguidores, te propone grabar un episodio random hablando de cualquier cosa menos fútbol.",
    options: [
      {
        id: "a",
        label: "Ir y soltarte del todo",
        subtitle: "+Fama, imprevisible",
        consequences: { fama: 8, rel_vestuario: -2 },
      },
      {
        id: "b",
        label: "Rechazar la invitación",
        subtitle: "Foco en lo deportivo",
        consequences: { forma: 2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "Si vas, ¿qué cuentas en el podcast?",
    minWeek: 7,
  },
  {
    id: "esp-desafio-viral",
    category: "especial",
    title: "Te retan a un desafío viral",
    description: "Un jugador de otro club te reta públicamente a un duelo de gambeta grabado para redes.",
    options: [
      {
        id: "a",
        label: "Aceptar el desafío",
        subtitle: "Todo o nada en redes",
        consequences: { fama: 7, rel_vestuario: 2 },
      },
      {
        id: "b",
        label: "Ignorarlo con clase",
        subtitle: "No entras en el juego",
        consequences: { moral: 2 },
      },
    ],
    minWeek: 5,
  },
  {
    id: "esp-mascota",
    category: "especial",
    title: "La mascota del club te elige como su favorito",
    description: "En la previa de un partido, la mascota del club se cuelga literalmente de tu espalda frente a las cámaras y no te suelta.",
    options: [
      {
        id: "a",
        label: "Seguirle el juego en cámara",
        subtitle: "Momento gracioso y compartible",
        consequences: { fama: 5, rel_aficion: 6 },
      },
      {
        id: "b",
        label: "Sacártela de encima disimuladamente",
        subtitle: "Incómodo pero discreto",
        consequences: { rel_aficion: -1 },
      },
    ],
  },
  {
    id: "esp-doble",
    category: "especial",
    title: "Aparece un sosías tuyo en otro país",
    description: "Se viraliza un video de alguien idéntico a ti jugando en una liga amateur al otro lado del mundo.",
    options: [
      {
        id: "a",
        label: "Compartirlo en tus redes",
        subtitle: "Lo conviertes en chiste propio",
        consequences: { fama: 6, moral: 3 },
      },
      {
        id: "b",
        label: "No hacerle ni caso",
        subtitle: "Perfil bajo",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 3,
  },
  {
    id: "esp-anuncio",
    category: "especial",
    title: "Te ofrecen protagonizar un anuncio surrealista",
    description: "Una marca de bebidas te propone una publicidad absurda: apareces jugando al fútbol en el espacio.",
    options: [
      {
        id: "a",
        label: "Aceptar, total es una locura divertida",
        subtitle: "+Patrimonio, +Fama",
        consequences: { patrimonio: 8000, fama: 6 },
      },
      {
        id: "b",
        label: "Rechazarlo, no encaja con tu imagen",
        subtitle: "Cuidas tu marca",
        consequences: { rel_representante: -2 },
      },
    ],
    minWeek: 8,
  },
  {
    id: "esp-paloma",
    category: "entrenamiento",
    title: "La paloma que no se va",
    description:
      "Una paloma se instala en mitad del círculo central durante el calentamiento y se niega a moverse ni con balones cerca. El cuerpo técnico, muy serio, decide reorganizar el rondo alrededor de ella.",
    options: [
      {
        id: "a",
        label: "Intentar ahuyentarla tú mismo, como sea",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "moral",
          success: {
            text: "Consigues que se vaya tras una persecución ridícula que graban tres móviles. Te aplauden como si hubieras metido un gol.",
            consequences: { fama: 3, rel_vestuario: 5, moral: 4 },
          },
          fail: {
            text: "La paloma esquiva todos tus intentos y hasta parece burlarse. El vestuario no te va a dejar olvidarlo en semanas.",
            consequences: { rel_vestuario: 2, moral: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Dejarla en paz y entrenar alrededor",
        subtitle: "Aceptar lo inevitable",
        consequences: { rel_vestuario: 3, moral: 1 },
      },
    ],
    minWeek: 15,
  },
  {
    id: "esp-confusion-identidad",
    category: "prensa",
    title: "Te confunden con otro jugador",
    description:
      "Un cámara de televisión te para en la calle emocionadísimo pidiendo una entrevista — y te llama por el nombre de otro futbolista durante los primeros veinte segundos, sin que nadie lo corrija.",
    options: [
      {
        id: "a",
        label: "Seguirle la corriente un rato, total qué más da",
        subtitle: "Situación absurda, +Fama",
        consequences: { fama: 3, moral: 2 },
      },
      {
        id: "b",
        label: "Sacarlo de su error enseguida",
        subtitle: "Menos gracioso, más honesto",
        consequences: { moral: -1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al cámara cuando se da cuenta del error?",
    minWeek: 30,
  },
  {
    id: "esp-nino-sincero",
    category: "vida",
    title: "El niño sincero",
    description:
      'En una clínica de fútbol para chavales, un crío de ocho años te mira fijamente y suelta, delante de todos los padres: "Mi padre dice que ya no eres tan bueno como antes." Se hace un silencio muy largo.',
    options: [
      {
        id: "a",
        label: "Reírte y preguntarle qué más dice su padre",
        subtitle: "Le quitas hierro, +Fama",
        consequences: { fama: 4, moral: 3 },
      },
      {
        id: "b",
        label: "Cambiar de tema rápido",
        subtitle: "Momento incómodo",
        consequences: { moral: -1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes al crío?",
    minWeek: 25,
  },
  {
    id: "esp-camiseta-pirata",
    category: "prensa",
    title: "Tu nombre, mal escrito",
    description:
      "Un puesto callejero cerca del estadio vende camisetas piratas con tu apellido... con una letra de más. Alguien te manda la foto por privado con cuarenta emojis de risa.",
    options: [
      {
        id: "a",
        label: "Comprarte una y colgarla en redes",
        subtitle: "Le sacas partido al fallo, +Fama",
        consequences: { fama: 6, moral: 4 },
      },
      {
        id: "b",
        label: "Ignorarlo, no darle más bombo",
        subtitle: "Perfil bajo",
        consequences: {},
      },
    ],
    minWeek: 35,
  },
  {
    id: "esp-meme",
    category: "especial",
    title: "Te conviertes en meme",
    description:
      "Una foto tuya con una cara rarísima en pleno festejo de gol se hace viral. En menos de un día, la gente la usa para hablar de absolutamente cualquier cosa menos de fútbol.",
    imageScene:
      "Photorealistic candid sports photo of the photographed man mid-celebration with an exaggerated, funny facial expression, stadium crowd blurred in the background, flash photography style",
    options: [
      {
        id: "a",
        label: "Reírte tú también y compartirlo",
        subtitle: "+Fama, cae bien",
        consequences: { fama: 8, rel_aficion: 5, moral: 3 },
      },
      {
        id: "b",
        label: "Que no te haga ni pizca de gracia",
        subtitle: "Se nota que te molesta",
        consequences: { fama: 2, moral: -3 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "Si lo compartes tú también, ¿qué pie de foto le pones?",
    minWeek: 40,
  },
  {
    id: "esp-patrocinio-chorizo",
    category: "representante",
    title: "Una oferta de patrocinio de lo más rara",
    description:
      'Una fábrica de embutidos de un pueblo pequeño te ofrece ser la imagen de su nueva línea de chorizo "edición futbolista". El cheque no está nada mal para lo poco que piden.',
    options: [
      {
        id: "a",
        label: "Aceptar, totalmente en serio",
        subtitle: "+Patrimonio, +Fama rara",
        consequences: { patrimonio: 4000, fama: 3, moral: 2 },
      },
      {
        id: "b",
        label: "Rechazar educadamente, no pega con tu imagen",
        subtitle: "Cuidas tu marca",
        consequences: { rel_representante: 2 },
      },
    ],
    minWeek: 20,
  },
  {
    id: "vid-dorsal-homenaje",
    category: "vestuario",
    title: "El dorsal que vas a llevar",
    description:
      "El utillero te pregunta qué número quieres llevar esta temporada. Es tu oportunidad de convertirlo en algo con significado, no solo un número más en la espalda.",
    allowFreeText: true,
    freeTextPrompt: "¿A quién se lo dedicas, si es que se lo dedicas a alguien?",
    options: [
      {
        id: "a",
        label: "Elegir el número de un ídolo de tu infancia",
        subtitle: "Carga emocional, expectativas altas",
        consequences: { moral: 5, fama: 2 },
      },
      {
        id: "b",
        label: "Pedir un número libre, sin dedicarlo a nadie",
        subtitle: "Empezar tu propia historia desde cero",
        consequences: { moral: 2 },
      },
      {
        id: "c",
        label: "No darle ninguna importancia al número",
        subtitle: "Indiferente",
        consequences: {},
      },
    ],
    minWeek: 2,
  },
  {
    id: "esp-broma-vestuario",
    category: "vestuario",
    title: "La broma del vestuario",
    description:
      "Llegas a tu taquilla y la encuentras completamente forrada de papel de aluminio, botas incluidas. Los veteranos observan de reojo, aguantando la risa, esperando tu reacción.",
    options: [
      {
        id: "a",
        label: "Reírte y devolverles la broma la semana que viene",
        subtitle: "+Vestuario",
        consequences: { rel_vestuario: 8, moral: 4 },
      },
      {
        id: "b",
        label: "Fingir que te ha sentado mal, solo para preocuparlos",
        subtitle: "Contrabroma",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "moral",
          success: {
            text: "Te lo tomas tan en serio que el vestuario entero se disculpa avergonzado, hasta que revelas que era broma. Los tienes comiendo de tu mano.",
            consequences: { rel_vestuario: 10, fama: 2, moral: 6 },
          },
          fail: {
            text: "Se lo creen tanto que la cosa se pone tensa de verdad y cuesta arreglarlo.",
            consequences: { rel_vestuario: -5, moral: -3 },
          },
        },
      },
    ],
    minWeek: 10,
  },
  {
    id: "esp-excompanero-negocio",
    category: "vida",
    title: "Tu excompañero de clase tiene un plan",
    description:
      'Un chico con el que ibas a clase en el instituto, con el que no hablas desde hace años, te escribe de la nada: tiene "la oportunidad de tu vida", algo entre criptomonedas y un local de hamburguesas. Solo necesita un empujón inicial.',
    options: [
      {
        id: "a",
        label: "Escuchar la propuesta, aunque sea por curiosidad",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.35,
          statModifier: "fama",
          success: {
            text: "Sorprendentemente, el negocio funciona mejor de lo esperado y recuperas la inversión con creces.",
            consequences: { patrimonio: 6000, moral: 3 },
          },
          fail: {
            text: "Como te temías, el dinero desaparece en menos de un año sin explicación clara.",
            consequences: { patrimonio: -5000, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "Decir que no, con educación",
        subtitle: "Prudente",
        consequences: { moral: 1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes?",
    minWeek: 30,
  },

  // ── FAMOSEO (el mundo de la fama, más allá del fútbol) ──────────────
  {
    id: "fama-revista-corazon",
    category: "prensa",
    title: 'La revista del corazón te "caza"',
    description:
      'Una revista de cotilleos publica una foto tuya comiendo en una terraza con alguien que no identifican, con el titular "¿Nuevo amor a la vista?". El móvil no para de vibrar.',
    options: [
      {
        id: "a",
        label: "Aclararlo tú mismo en redes",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: {
            text: "Tu aclaración calma las aguas y hasta te ríes del titular en una entrevista.",
            consequences: { fama: 6, moral: 3 },
          },
          fail: {
            text: "Tu respuesta alimenta aún más el rumor. La revista saca una segunda portada.",
            consequences: { fama: 2, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "No decir nada y dejar que se apague solo",
        subtitle: "Perfil bajo",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 20,
  },
  {
    id: "fama-gala-benefica",
    category: "especial",
    title: "Te piden ser padrino de una gala benéfica",
    description:
      "Una fundación local te propone ser la cara visible de su gala anual contra el hambre infantil. Alfombra roja, esmoquin, fotos con la alta sociedad de la ciudad.",
    imageScene:
      "Photorealistic photo of the photographed man on a charity gala red carpet, wearing a tuxedo, camera flashes, elegant evening atmosphere",
    options: [
      {
        id: "a",
        label: "Aceptar e implicarte de verdad",
        subtitle: "+Fama, +Reputación pública",
        consequences: { fama: 8, rel_aficion: 5, patrimonio: -500 },
      },
      {
        id: "b",
        label: "Aceptar solo la foto, sin más compromiso",
        subtitle: "Cínico pero cómodo",
        consequences: { fama: 4, moral: -2 },
      },
      {
        id: "c",
        label: "Rechazar, no es lo tuyo",
        subtitle: "Perfil bajo",
        consequences: { moral: 2 },
      },
    ],
    minWeek: 35,
  },
  {
    id: "fama-influencer-unboxing",
    category: "prensa",
    title: "Un influencer te etiqueta sin avisar",
    description:
      'Marta Diass sube un vídeo abriendo una caja de regalos "de tu parte" que tú nunca le mandaste, etiquetándote como si fuerais íntimos.',
    options: [
      {
        id: "a",
        label: "Seguirle el rollo en los comentarios",
        subtitle: "+Fama, algo surrealista",
        consequences: { fama: 5, moral: 2 },
      },
      {
        id: "b",
        label: "Pedirle en privado que lo quite",
        subtitle: "Prudente",
        consequences: { moral: 1 },
      },
      {
        id: "c",
        label: "Ignorarlo del todo",
        subtitle: "No alimentar el ruido",
        consequences: {},
      },
    ],
    minWeek: 25,
  },
  {
    id: "fama-reality-show",
    category: "representante",
    title: "Un reality show quiere ficharte",
    description:
      "La productora de un programa de telerrealidad muy popular te ofrece una cantidad importante por participar como concursante durante el parón de pretemporada.",
    options: [
      {
        id: "a",
        label: "Aceptar, la exposición merece la pena",
        subtitle: "+Patrimonio, +Fama, riesgo de imagen",
        consequences: { patrimonio: 12000, fama: 10, rel_entrenador: -5 },
      },
      {
        id: "b",
        label: "Rechazar, prioriza el fútbol",
        subtitle: "Perfil serio",
        consequences: { rel_entrenador: 4 },
      },
    ],
    minWeek: 45,
  },
  {
    id: "fama-videoclip",
    category: "especial",
    title: "Un artista te quiere en su videoclip",
    description:
      "Malume Baby te propone un cameo de pocos segundos en el videoclip de su próximo single: aparecer marcando un gol imaginario en un escenario surrealista.",
    imageScene:
      "Photorealistic photo of the photographed man on a colorful music video set, dramatic stage lighting, mid football celebration pose, surreal artistic backdrop",
    options: [
      {
        id: "a",
        label: "Aceptar y meterte en el papel",
        subtitle: "+Fama, momento surrealista",
        consequences: { fama: 9, moral: 5 },
      },
      {
        id: "b",
        label: "Rechazar, prefieres mantener perfil futbolístico",
        subtitle: "Serio",
        consequences: { rel_entrenador: 2 },
      },
    ],
    minWeek: 30,
  },
  {
    id: "fama-relojes-lujo",
    category: "representante",
    title: "Una marca de relojes de lujo te quiere de imagen",
    description:
      "Un fabricante de relojes suizo de gama muy alta ofrece un contrato de varios años a cambio de llevar sus piezas en cada aparición pública.",
    options: [
      {
        id: "a",
        label: "Firmar el contrato",
        subtitle: "+Patrimonio alto, exclusividad total",
        consequences: { patrimonio: 20000, fama: 5, rel_representante: 3 },
      },
      {
        id: "b",
        label: "Negociar sin exclusividad",
        subtitle: "Menos dinero, más libertad",
        consequences: { patrimonio: 9000, rel_representante: 5 },
      },
      {
        id: "c",
        label: "Rechazar, no te representa",
        subtitle: "Fiel a tu estilo",
        consequences: { moral: 2 },
      },
    ],
    minWeek: 60,
  },
  {
    id: "fama-reportaje-hogar",
    category: "prensa",
    title: "Una revista quiere fotografiar tu casa",
    description:
      'Una revista de estilo de vida te propone un reportaje a página completa mostrando tu casa por dentro: "así vive la nueva promesa del fútbol".',
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al periodista sobre enseñar tu vida privada?",
    options: [
      {
        id: "a",
        label: "Aceptar, con algunas zonas fuera de cámara",
        subtitle: "+Fama, algo de exposición",
        consequences: { fama: 6, moral: -1 },
      },
      {
        id: "b",
        label: "Rechazar, la casa es sagrada",
        subtitle: "Privacidad ante todo",
        consequences: { moral: 3 },
      },
    ],
    minWeek: 50,
  },
  {
    id: "fama-rumor-falso",
    category: "prensa",
    title: "Un rumor falso se hace viral",
    description:
      'Un perfil anónimo asegura tener "pruebas" de que estás saliendo con una persona famosa a la que ni conoces. El rumor se hace tendencia en un par de horas.',
    options: [
      {
        id: "a",
        label: "Desmentirlo con humor en redes",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "fama",
          success: {
            text: "Tu respuesta se hace viral por lo ingeniosa que es. Sales ganando fama.",
            consequences: { fama: 8, moral: 4 },
          },
          fail: {
            text: "Nadie te cree del todo y el rumor sigue circulando semanas.",
            consequences: { fama: 1, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "No decir nada, que se apague solo",
        subtitle: "Perfil bajo",
        consequences: { moral: -1 },
      },
    ],
    minWeek: 40,
  },
  {
    id: "fama-fan-club",
    category: "vida",
    title: "Un fan club se organiza sin tu permiso",
    description:
      'Un grupo de aficionados crea una cuenta "oficial" en tu nombre con miles de seguidores, sin haberte preguntado nunca. Empiezan a vender merchandising con tu cara.',
    options: [
      {
        id: "a",
        label: "Contactarles y darles tu bendición",
        subtitle: "+Afición, gesto generoso",
        consequences: { rel_aficion: 8, moral: 3 },
      },
      {
        id: "b",
        label: "Pedir que lo cierren por temas legales",
        subtitle: "Jugada fría",
        consequences: { rel_aficion: -6, patrimonio: 1000 },
      },
      {
        id: "c",
        label: "Ignorarlo, no le das importancia",
        subtitle: "",
        consequences: {},
      },
    ],
    minWeek: 22,
  },
  {
    id: "fama-videojuego",
    category: "representante",
    title: "Un videojuego de fútbol quiere tu cara",
    description:
      "Los desarrolladores de un popular videojuego de fútbol te piden licencia para incluir tu imagen y tus estadísticas reales en la próxima edición.",
    options: [
      {
        id: "a",
        label: "Firmar la licencia",
        subtitle: "+Patrimonio, +Fama entre gamers",
        consequences: { patrimonio: 7000, fama: 7 },
      },
      {
        id: "b",
        label: "Pedir condiciones mejores antes de firmar",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: {
            text: "Consigues mejores condiciones de las esperadas.",
            consequences: { patrimonio: 15000, fama: 6 },
          },
          fail: {
            text: "Pierdes margen de negociación y el trato queda peor de lo que esperabas.",
            consequences: { patrimonio: 4000 },
          },
        },
      },
    ],
    minWeek: 55,
  },
  {
    id: "fama-coleccion-ropa",
    category: "representante",
    title: "Una marca urbana te propone una colección cápsula",
    description:
      "Una marca de ropa urbana en auge te ofrece diseñar junto a ellos una pequeña colección con tu nombre.",
    options: [
      {
        id: "a",
        label: "Involucrarte de verdad en el diseño",
        subtitle: "+Fama, +Patrimonio, tiempo invertido",
        consequences: { fama: 6, patrimonio: 6000, forma: -2 },
      },
      {
        id: "b",
        label: "Dejar que usen solo tu nombre e imagen",
        subtitle: "Menos esfuerzo, menos autenticidad",
        consequences: { patrimonio: 4000 },
      },
    ],
    minWeek: 48,
  },
  {
    id: "fama-desfile-moda",
    category: "especial",
    title: "Primera fila en la semana de la moda",
    description:
      "Una firma de moda te invita a sentarte en primera fila de su desfile durante la semana de la moda. Cámaras por todas partes, un mundo que no es el tuyo.",
    imageScene:
      "Photorealistic photo of the photographed man seated front row at a fashion week runway show, camera flashes, elegant outfit, runway blurred in background",
    options: [
      {
        id: "a",
        label: "Ir y disfrutarlo a fondo",
        subtitle: "+Fama, mundo nuevo",
        consequences: { fama: 7, moral: 4 },
      },
      {
        id: "b",
        label: "Ir por compromiso, sin más",
        subtitle: "Neutral",
        consequences: { fama: 3 },
      },
      {
        id: "c",
        label: "Rechazar la invitación",
        subtitle: "No es tu ambiente",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 65,
  },
  {
    id: "fama-tiktok-trend",
    category: "prensa",
    title: "Un trend viral usa tu nombre",
    description:
      "De la noche a la mañana, miles de vídeos usan un sonido que imita tu forma de celebrar los goles. El trend se vuelve masivo y ni tú entiendes bien por qué.",
    imageScene:
      "Photorealistic candid photo of the photographed man laughing while looking at his phone, casual setting, warm natural lighting",
    options: [
      {
        id: "a",
        label: "Subir tu propio vídeo sumándote al trend",
        subtitle: "+Fama, te ríes de ti mismo",
        consequences: { fama: 10, moral: 5 },
      },
      {
        id: "b",
        label: "No participar, dejar que siga solo",
        subtitle: "Perfil bajo",
        consequences: { fama: 3 },
      },
    ],
    minWeek: 18,
  },
  {
    id: "fama-periodista-finanzas",
    category: "prensa",
    title: "Un periodista pregunta por tus finanzas",
    description:
      "Un periodista de investigación te aborda con preguntas incómodas sobre en qué inviertes tu dinero y si es verdad lo que se rumorea sobre tus gastos.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes?",
    options: [
      {
        id: "a",
        label: "Responder con transparencia total",
        subtitle: "Arriesgado pero honesto",
        consequences: { fama: 4, patrimonio: -1 },
      },
      {
        id: "b",
        label: "Remitirle a tu representante",
        subtitle: "Evitas el tema",
        consequences: { rel_representante: 3 },
      },
      {
        id: "c",
        label: "Negarte a responder ahí mismo",
        subtitle: "Tensión inmediata",
        consequences: { fama: -3, moral: -2 },
      },
    ],
    minWeek: 58,
  },
  {
    id: "fama-cancelacion-injusta",
    category: "representante",
    title: "Una marca cancela tu contrato por una polémica ajena",
    description:
      'Una marca con la que trabajas rescinde tu contrato de imagen tras la polémica de otro deportista al que también patrocinan, "por precaución", aunque tú no tengas nada que ver.',
    options: [
      {
        id: "a",
        label: "Denunciarlo públicamente como injusto",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "fama",
          success: {
            text: "Tu queja pública gana apoyo y la marca acaba pidiendo disculpas.",
            consequences: { fama: 8, patrimonio: 3000 },
          },
          fail: {
            text: "Tu queja no cala y quedas como alguien conflictivo.",
            consequences: { fama: -5, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "Aceptarlo con elegancia y seguir adelante",
        subtitle: "Profesional",
        consequences: { moral: 2, rel_representante: 2 },
      },
    ],
    minWeek: 52,
  },
  {
    id: "fama-documental",
    category: "especial",
    title: "Una plataforma quiere hacer un documental sobre ti",
    description:
      "Una plataforma de streaming te propone un documental de varios capítulos contando tu historia, desde la cantera hasta ahora. Acceso total a tu vida durante meses.",
    imageScene:
      "Photorealistic photo of the photographed man being filmed by a documentary crew, cameras and boom microphone visible, candid behind-the-scenes atmosphere",
    options: [
      {
        id: "a",
        label: "Aceptar y abrir las puertas de verdad",
        subtitle: "+Fama enorme, cero privacidad",
        consequences: { fama: 15, patrimonio: 10000, moral: -3 },
      },
      {
        id: "b",
        label: "Aceptar con condiciones muy limitadas",
        subtitle: "Control sobre tu imagen",
        consequences: { fama: 8, patrimonio: 5000 },
      },
      {
        id: "c",
        label: "Rechazar la propuesta",
        subtitle: "Tu vida es tuya",
        consequences: { moral: 3 },
      },
    ],
    minWeek: 75,
  },
  {
    id: "fama-indirectas-rival",
    category: "prensa",
    title: "Un rival te tira indirectas en redes",
    description:
      "Un jugador de otro equipo, conocido por su lengua afilada en redes, publica una indirecta que todo el mundo interpreta como dirigida a ti.",
    options: [
      {
        id: "a",
        label: "Responder con otra indirecta ingeniosa",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: {
            text: "Tu respuesta gana la batalla de las redes por goleada. Los memes son todos a tu favor.",
            consequences: { fama: 9, rel_aficion: 5 },
          },
          fail: {
            text: "Tu respuesta no termina de aterrizar y la cosa se vuelve incómoda.",
            consequences: { fama: -2, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "No entrar al trapo",
        subtitle: "Perfil maduro",
        consequences: { moral: 2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "Si respondes con una indirecta, ¿cuál exactamente?",
    minWeek: 33,
  },
  {
    id: "fama-cantar-himno",
    category: "vida",
    title: "Te piden cantar el himno antes de un partido especial",
    description:
      "Antes de un partido conmemorativo, el club te pide que seas tú quien entone el himno del equipo frente a todo el estadio, micrófono en mano.",
    options: [
      {
        id: "a",
        label: "Aceptar y lanzarte, cantes bien o mal",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "moral",
          success: {
            text: "Te sale mejor de lo que esperabas y el estadio entero canta contigo.",
            consequences: { fama: 8, rel_aficion: 10, moral: 6 },
          },
          fail: {
            text: "Desafinas bastante, pero la grada lo celebra con cariño y risas.",
            consequences: { fama: 3, rel_aficion: 4, moral: -1 },
          },
        },
      },
      {
        id: "b",
        label: "Rechazar educadamente, no es lo tuyo",
        subtitle: "Evitas el ridículo",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 15,
  },
  {
    id: "fama-fiesta-exclusiva",
    category: "vida",
    title: "Fiesta exclusiva de fin de temporada",
    description:
      "Te invitan a una fiesta muy exclusiva tras el último partido de la temporada, de esas donde se junta gente del deporte, la música y el cine. Ambiente de tentación total.",
    options: [
      {
        id: "a",
        label: "Ir con cabeza, disfrutar con medida",
        subtitle: "+Fama, +Ánimo",
        consequences: { fama: 5, moral: 6 },
      },
      {
        id: "b",
        label: "Ir a saco, vivirlo sin frenos",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "moral",
          success: {
            text: "Vives una noche legendaria sin que pase factura al día siguiente.",
            consequences: { fama: 8, moral: 10 },
          },
          fail: {
            text: "Al día siguiente pagas caro los excesos de la noche anterior.",
            consequences: { forma: -8, moral: -5 },
          },
        },
      },
      {
        id: "c",
        label: "No ir, prioriza el descanso",
        subtitle: "Responsable",
        consequences: { forma: 3 },
      },
    ],
    minWeek: 42,
  },
  {
    id: "fama-camiseta-nino",
    category: "vida",
    title: "Le regalas tu camiseta a un niño",
    description:
      "A la salida del estadio, un niño con un hospital bordado en la manga de la sudadera te espera junto a su padre. No pide autógrafo, solo verte de cerca un segundo.",
    imageScene:
      "Photorealistic photo of the photographed man kneeling down to hand his match jersey to a child outside a stadium, warm emotional moment, soft evening light",
    options: [
      {
        id: "a",
        label: "Quitarte la camiseta y dársela ahí mismo",
        subtitle: "+Fama, +Afición, momento viral",
        consequences: { fama: 12, rel_aficion: 10, moral: 8 },
      },
      {
        id: "b",
        label: "Prometerle una camiseta firmada para más adelante",
        subtitle: "Más discreto, igual de sincero",
        consequences: { rel_aficion: 5, moral: 4 },
      },
    ],
    minWeek: 28,
  },
  {
    id: "fama-perfil-falso",
    category: "prensa",
    title: "Un perfil falso se hace pasar por ti",
    description:
      'Una cuenta con tu nombre y tus fotos empieza a pedir dinero a fans a cambio de "videollamadas exclusivas". Varios caen en la estafa antes de que nadie se dé cuenta.',
    options: [
      {
        id: "a",
        label: "Denunciarlo públicamente cuanto antes",
        subtitle: "+Fama, proteges a tus fans",
        consequences: { fama: 5, rel_aficion: 6, patrimonio: -500 },
      },
      {
        id: "b",
        label: "Dejar que el club se encargue en privado",
        subtitle: "Más lento, menos ruido",
        consequences: { rel_representante: 3 },
      },
    ],
    minWeek: 26,
  },
  {
    id: "fama-fragancia-propia",
    category: "representante",
    title: "Una marca de perfumes te ofrece tu propia fragancia",
    description:
      "Una casa de perfumes reconocida propone lanzar un perfume con tu nombre y tu cara en el frasco.",
    options: [
      {
        id: "a",
        label: "Aceptar e implicarte en el proceso creativo",
        subtitle: "+Fama, +Patrimonio, tiempo invertido",
        consequences: { fama: 6, patrimonio: 9000, forma: -1 },
      },
      {
        id: "b",
        label: "Aceptar solo cediendo la imagen",
        subtitle: "Más rápido, menos personal",
        consequences: { patrimonio: 6000 },
      },
      {
        id: "c",
        label: "Rechazar, no encaja contigo",
        subtitle: "",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 62,
  },
  {
    id: "fama-podcast-estrella",
    category: "prensa",
    title: "Un podcast deportivo te quiere como entrevistado estrella",
    description:
      "Uno de los podcasts de deporte más escuchados del país te pide una entrevista de más de una hora, sin límite de temas.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué tema quieres tocar tú mismo en la entrevista?",
    options: [
      {
        id: "a",
        label: "Ir y hablar con total sinceridad",
        subtitle: "+Fama, te expones de verdad",
        consequences: { fama: 9, moral: 3 },
      },
      {
        id: "b",
        label: "Ir con respuestas medidas y prudentes",
        subtitle: "Seguro pero menos memorable",
        consequences: { fama: 4 },
      },
    ],
    minWeek: 38,
  },
  {
    id: "fama-actor-foto",
    category: "especial",
    title: "Un actor de cine te pide una foto",
    description:
      "En un evento, un actor conocido —de esos que salen en las carteleras de todo el mundo— se acerca él primero a pedirte una foto contigo. El mundo al revés.",
    imageScene:
      "Photorealistic candid photo of the photographed man posing for a photo with a generic well-dressed celebrity figure at an elegant event, camera flashes, warm ambient lighting",
    options: [
      {
        id: "a",
        label: "Aceptar encantado, es surrealista",
        subtitle: "+Fama, momento para enmarcar",
        consequences: { fama: 7, moral: 5 },
      },
      {
        id: "b",
        label: "Aceptarlo con timidez, sin darle más vueltas",
        subtitle: "",
        consequences: { fama: 3, moral: 2 },
      },
    ],
    minWeek: 47,
  },
  {
    id: "fama-coche-lujo",
    category: "representante",
    title: "Una marca de coches te regala un modelo de lujo",
    description:
      "A cambio de que lo enseñes de vez en cuando en tus redes, una marca de coches de alta gama te cede un modelo exclusivo durante toda la temporada.",
    options: [
      {
        id: "a",
        label: "Aceptar el coche",
        subtitle: "+Patrimonio simbólico, +Fama",
        consequences: { patrimonio: 5000, fama: 4 },
      },
      {
        id: "b",
        label: "Rechazarlo, prefieres pasar desapercibido",
        subtitle: "",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 24,
  },
  {
    id: "fama-portada-revista",
    category: "prensa",
    title: "Portada de una revista deportiva importante",
    description:
      "Te llaman para protagonizar la portada de una de las revistas deportivas más leídas del país, con un reportaje a fondo sobre tu progresión.",
    imageScene:
      "Photorealistic magazine cover style photo of the photographed man in his club kit, dramatic studio lighting, confident pose, professional sports magazine aesthetic",
    options: [
      {
        id: "a",
        label: "Aprovechar para hablar de tus objetivos a largo plazo",
        subtitle: "+Fama, ambicioso",
        consequences: { fama: 10, rel_representante: 4 },
      },
      {
        id: "b",
        label: "Mantener un tono humilde en toda la entrevista",
        subtitle: "+Afición, +Vestuario",
        consequences: { fama: 6, rel_aficion: 6, rel_vestuario: 4 },
      },
    ],
    minWeek: 44,
  },
  {
    id: "fama-parodia-humor",
    category: "especial",
    title: "Un programa de humor quiere parodiarte",
    description:
      "Un programa de humor muy popular te invita a participar en una parodia sobre ti mismo, riéndose con cariño de tus manías más conocidas.",
    options: [
      {
        id: "a",
        label: "Participar y reírte de ti mismo",
        subtitle: "+Fama, +Afición, te ganas al público",
        consequences: { fama: 8, rel_aficion: 7, moral: 4 },
      },
      {
        id: "b",
        label: "Declinar la invitación",
        subtitle: "Prefieres no exponerte así",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 53,
  },
  {
    id: "fama-borrar-publicacion",
    category: "representante",
    title: "Un patrocinador te pide borrar una publicación",
    description:
      'Subes algo espontáneo a tus redes y, a los pocos minutos, uno de tus patrocinadores te llama pidiendo que lo borres porque "no encaja con la marca".',
    options: [
      {
        id: "a",
        label: "Borrarlo, prioriza el contrato",
        subtitle: "+Relación con el patrocinador, -Autenticidad",
        consequences: { rel_representante: 4, moral: -3 },
      },
      {
        id: "b",
        label: "Dejarlo publicado, es tu vida",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "fama",
          success: {
            text: "El patrocinador acaba entendiéndolo y no pasa nada.",
            consequences: { moral: 5, fama: 2 },
          },
          fail: {
            text: "El patrocinador se lo toma mal y la relación se enfría notablemente.",
            consequences: { rel_representante: -8, patrimonio: -2000 },
          },
        },
      },
    ],
    minWeek: 36,
  },
  {
    id: "fama-merchandising-falso",
    category: "prensa",
    title: "Aparece merchandising falsificado con tu nombre",
    description:
      "En los alrededores del estadio, unos vendedores ambulantes ofrecen camisetas y bufandas falsificadas con tu nombre y dorsal, sin ningún permiso.",
    options: [
      {
        id: "a",
        label: "Denunciarlo ante el club",
        subtitle: "Protege tu marca",
        consequences: { patrimonio: 1000, rel_representante: 2 },
      },
      {
        id: "b",
        label: "Dejarlo pasar, son aficionados humildes",
        subtitle: "+Afición",
        consequences: { rel_aficion: 6 },
      },
    ],
    minWeek: 20,
  },
  {
    id: "fama-cena-empresarios",
    category: "vida",
    title: "Te invitan a cenar con grandes empresarios",
    description:
      "Un grupo de empresarios influyentes de la ciudad te invita a una cena privada, buscando más una conexión de imagen que una conversación real.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices cuando te preguntan por tus planes de futuro?",
    options: [
      {
        id: "a",
        label: "Ir y hacer contactos con cabeza",
        subtitle: "+Patrimonio a futuro, +Fama",
        consequences: { fama: 4, patrimonio: 2000 },
      },
      {
        id: "b",
        label: "Rechazar la invitación",
        subtitle: "Prefieres mantenerte al margen",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 57,
  },
  {
    id: "fama-streamer-directo",
    category: "vida",
    title: "El streamer más visto del país te invita a un directo",
    description:
      'Ibán Gómez, el streamer con más audiencia del país, te invita a su plató para un directo con casi un millón de personas conectadas a la vez. Antes de empezar te avisa: "Aquí hacemos retos, ¿eh? Nada de venir solo a hablar bien de ti mismo."',
    options: [
      {
        id: "a",
        label: "Aceptar cualquier reto que proponga",
        subtitle: "Jugada arriesgada, pero el público lo adora",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "fama",
          success: {
            text: 'Encajas el reto (comer algo carísimo y carísimamente picante frente a cámara) sin pestañear. El clip se hace viral en horas: "El futbolista que no tiene miedo a nada".',
            consequences: { fama: 9, media: 2, moral: 4 },
          },
          fail: {
            text: "Terminas escupiendo agua por la nariz en directo. Es humillante, pero también el meme de la semana.",
            consequences: { fama: 5, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Ir a lo seguro, hablar del equipo y nada más",
        subtitle: "Perfil profesional",
        consequences: { fama: 2, rel_representante: 2 },
      },
    ],
    minWeek: 25,
  },
  {
    id: "fama-streamer-fichaje-broma",
    category: "prensa",
    title: '"Te ficho para mi equipo", dice el streamer en directo',
    description:
      'En pleno directo, Ibán suelta de broma: "Este fichaje lo hago yo, te quiero en mi equipo amateur el finde que viene." Lo dice de coña, pero los clips ya están circulando como si fuera un fichaje real. Tu móvil empieza a arder.',
    options: [
      {
        id: "a",
        label: "Seguirle la broma y apuntarte al partido amateur",
        subtitle: "Contenido puro, la afición lo va a flipar",
        consequences: { fama: 7, media: 1, rel_aficion: 5, moral: 3 },
      },
      {
        id: "b",
        label: "Aclarar rápido que es broma antes de que se líe más",
        subtitle: "Evitar el malentendido con tu club",
        consequences: { fama: 2, rel_entrenador: 2 },
      },
    ],
    minWeek: 28,
  },
  {
    id: "fama-leyenda-vestuario",
    category: "vestuario",
    title: "Una leyenda visita el vestuario antes del partido",
    description:
      "Emiliano Rosso, el mejor futbolista de su generación ya retirado, aparece de improviso en el túnel de vestuarios antes del calentamiento. Se para justo delante de ti y te mira de arriba abajo un segundo eterno.",
    imageScene:
      "Photorealistic photo of the photographed man in a stadium tunnel shaking hands with an older distinguished football legend figure, respectful atmosphere, warm stadium lighting",
    options: [
      {
        id: "a",
        label: 'Pedirle un consejo sin rodeos',
        subtitle: "Aprovechar el momento",
        consequences: {},
        resolve: {
          baseChance: 0.7,
          statModifier: "moral",
          success: {
            text: 'Te pone la mano en el hombro: "Disfrútalo, chaval, esto dura menos de lo que crees." Sales al campo con otra cabeza.',
            consequences: { moral: 8, media: 2, fama: 3 },
          },
          fail: {
            text: 'Te suelta un "ya veremos" seco y se va a saludar a otro. Te quedas con las ganas.',
            consequences: { moral: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Quedarte callado, demasiado impresionado para hablar",
        subtitle: "El momento te supera",
        consequences: { moral: 2 },
      },
    ],
    minWeek: 40,
  },
  {
    id: "fama-leyenda-confusion",
    category: "prensa",
    title: "La leyenda te confunde con otro jugador",
    description:
      'En un evento benéfico, Emiliano Rosso se acerca sonriente, te da un abrazo y te dice: "Qué golazo el del otro día contra el Espanyol." El problema: tú no jugaste ese partido, ni siquiera estabas convocado. Hay veinte cámaras apuntando.',
    options: [
      {
        id: "a",
        label: "Seguirle la corriente para no dejarle mal delante de todos",
        subtitle: "Gesto noble, pero raro si alguien se entera",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: {
            text: "Nadie se entera del lío y las fotos con él inundan tus redes igualmente. Un golpe de fama fácil.",
            consequences: { fama: 6, media: 1, moral: 2 },
          },
          fail: {
            text: 'Un periodista graba el intercambio y sale el titular: "Momento incómodo: la leyenda confunde al canterano." Te ríes, pero escuece.',
            consequences: { fama: 3, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Corregirle con humor, sin darle importancia",
        subtitle: "Más honesto, menos arriesgado",
        consequences: { moral: 2, fama: 2 },
      },
    ],
    minWeek: 40,
  },
  {
    id: "fama-reto-viral-vendado",
    category: "especial",
    title: "El reto viral: marcar a portería vacía con los ojos vendados",
    description:
      'Una cuenta con millones de seguidores te propone participar en su reto de moda: marcar tres veces con los ojos vendados y solo guiado por la voz de tus compañeros. Han montado cámaras por todo el campo de entrenamiento.',
    options: [
      {
        id: "a",
        label: "Grabarlo y subirlo tal cual salga",
        subtitle: "Sin red, lo que pase se publica",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "fama",
          success: {
            text: "Encajas los tres disparos entre gritos de tus compañeros. El vídeo supera los diez millones de vistas en dos días.",
            consequences: { fama: 10, media: 2, moral: 5 },
          },
          fail: {
            text: "Te chocas con un poste que ni sabías que estaba ahí. También se hace viral, pero por otro motivo.",
            consequences: { fama: 6, moral: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Grabarlo pero pedir quedarte con el derecho de no publicarlo si sale mal",
        subtitle: "Cabeza fría",
        consequences: { fama: 2, moral: 1 },
      },
    ],
    minWeek: 22,
  },
  {
    id: "fama-doble-viral",
    category: "prensa",
    title: "Aparece un doble tuyo haciendo el ridículo en un centro comercial",
    description:
      "Un vídeo se vuelve viral: un hombre que se parece muchísimo a ti monta un pollo en un centro comercial por no encontrar aparcamiento, gritando tu apellido a los de seguridad para colarse. Media ciudad cree que eres tú.",
    allowFreeText: true,
    freeTextPrompt: "¿Cómo lo desmientes en redes?",
    options: [
      {
        id: "a",
        label: "Responder con humor y compartir el vídeo tú mismo",
        subtitle: "Convertirlo en broma antes de que se te escape de las manos",
        consequences: { fama: 6, media: 1, moral: 3 },
      },
      {
        id: "b",
        label: "Ignorarlo por completo y dejar que se aclare solo",
        subtitle: "Perfil bajo, riesgo de que quede la duda",
        consequences: { moral: -1 },
      },
    ],
    minWeek: 33,
  },
  {
    id: "fama-anuncio-surreal",
    category: "vida",
    title: "Te ofrecen protagonizar el anuncio más absurdo del año",
    description:
      "Una marca de colonia te propone un anuncio a caballo entre lo épico y lo ridículo: apareces surgiendo de una piscina de pétalos vestido de gladiador mientras suena música orquestal. El guion es, literalmente, así.",
    imageScene:
      "Photorealistic photo of the photographed man dressed as a gladiator emerging dramatically from a pool of flower petals, cinematic lighting, over-the-top commercial photoshoot atmosphere",
    options: [
      {
        id: "a",
        label: "Grabarlo con toda la seriedad del mundo",
        subtitle: "+Patrimonio, se convierte en meme instantáneo",
        consequences: { fama: 8, media: 1, patrimonio: 4000, moral: 2 },
      },
      {
        id: "b",
        label: "Rechazar el guion, es demasiado ridículo",
        subtitle: "Dignidad intacta, oportunidad perdida",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 35,
  },
  {
    id: "fama-mascota-viral",
    category: "vida",
    title: "Tu nueva mascota se hace más famosa que tú",
    description:
      'Adoptas una iguana como mascota más por capricho que por otra cosa, y a la semana tiene más seguidores en redes que tú. Tu representante te llama entre risas: "Nos están pidiendo colaboraciones... para ella."',
    options: [
      {
        id: "a",
        label: "Dejar que la iguana tenga su propia cuenta y sacarle partido",
        subtitle: "Contenido gracioso, +Fama compartida",
        consequences: { fama: 5, media: 1, patrimonio: 800, moral: 3 },
      },
      {
        id: "b",
        label: "Mantenerla lejos de las cámaras, es solo tu mascota",
        subtitle: "Vida privada por delante",
        consequences: { moral: 2 },
      },
    ],
    minWeek: 30,
  },
  {
    id: "fama-cancion-dedicada",
    category: "prensa",
    title: "Un cantante de moda te dedica una canción sin avisar",
    description:
      'Yeimy Rosales, que arrasa en las listas, saca un tema nuevo con tu apellido metido en el estribillo. No te ha pedido permiso ni avisado. La canción ya suena en todas las radios y los aficionados la cantan en la grada.',
    options: [
      {
        id: "a",
        label: "Aprovechar el momento y aparecer en su videoclip",
        subtitle: "Sinergia total, aunque algo forzada",
        consequences: {},
        resolve: {
          baseChance: 0.6,
          statModifier: "fama",
          success: {
            text: "El videoclip es un éxito y la canción se convierte en el himno extraoficial de la afición.",
            consequences: { fama: 8, media: 2, rel_aficion: 6 },
          },
          fail: {
            text: "El resultado queda forzado y hasta un poco vergonzoso. Los memes tardan poco en llegar.",
            consequences: { fama: 3, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "No mezclarte con eso, que la canción vaya por su lado",
        subtitle: "Distancia prudente",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 38,
  },
  {
    id: "fama-hackeo-cuenta",
    category: "prensa",
    title: "Hackean tu cuenta y publican una locura",
    description:
      'Te despiertas con cien notificaciones: alguien ha entrado en tu cuenta esta noche y ha publicado que fichas por el eterno rival "por amor de verdad". La captura ya la tiene medio país. Tu representante no contesta al teléfono, está literalmente corriendo hacia tu casa.',
    options: [
      {
        id: "a",
        label: "Salir en directo de inmediato a aclararlo con humor",
        subtitle: "Rápido y transparente",
        consequences: { fama: 5, media: 1, moral: 2 },
      },
      {
        id: "b",
        label: "Publicar un comunicado formal y cambiar la contraseña sin más",
        subtitle: "Más serio, menos viral",
        consequences: { fama: 2, moral: -1 },
      },
    ],
    minWeek: 24,
  },
  {
    id: "fama-reality-cocina",
    category: "especial",
    title: "Te apuntas a un reality de cocina para famosos",
    description:
      "Entre risas aceptaste hace semanas participar en un programa de cocina para famosos, y hoy toca grabar en directo delante de un jurado exigente. Tu plato: una tortilla de patatas que tiene que decidir si eres de las que llevan cebolla.",
    imageScene:
      "Photorealistic photo of the photographed man wearing a chef apron in a TV cooking show set, cameras and studio lights around, playful competitive atmosphere",
    options: [
      {
        id: "a",
        label: "Arriesgarte con una receta ambiciosa",
        subtitle: "Todo o nada delante de las cámaras",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "fama",
          success: {
            text: 'El jurado se queda boquiabierto: "Nunca pensé que un futbolista me sorprendería así en una cocina." Titular asegurado.',
            consequences: { fama: 9, media: 2, moral: 6 },
          },
          fail: {
            text: "El plato termina literalmente quemado y el jurado no se corta al decírtelo en directo. Es incómodo, pero divertido para todos menos para ti.",
            consequences: { fama: 4, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "Ir a lo seguro con la tortilla de siempre",
        subtitle: "Sin sorpresas",
        consequences: { fama: 3, moral: 1 },
      },
    ],
    minWeek: 45,
  },
  {
    id: "fama-fiesta-piscina",
    category: "vida",
    title: "La fiesta en la piscina de un famoso se descontrola",
    description:
      "Te invitan a la fiesta de cumpleaños de Ibán Gómez, junto a una piscina rodeada de gente que no para de sacar el móvil. A medianoche, alguien decide que es buena idea tirar al agua a todo el que se acerque al borde, empezando por ti.",
    options: [
      {
        id: "a",
        label: "Reírte y unirte al caos",
        subtitle: "Contenido para todos, riesgo de titular ridículo",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "moral",
          success: {
            text: "El vídeo de la fiesta se hace viral por lo divertido que sales en él. Ganas simpatía a raudales.",
            consequences: { fama: 6, media: 1, moral: 5 },
          },
          fail: {
            text: 'Sales empapado justo cuando un fotógrafo capta el peor ángulo posible. Al día siguiente eres el titular de cotilleos: "Noche loca."',
            consequences: { fama: 3, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Salir discretamente antes de que la fiesta se te vaya de las manos",
        subtitle: "Prudencia ante todo",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 26,
  },
  {
    id: "fama-paparazzi-cena",
    category: "prensa",
    title: "Cazado por los paparazzi",
    description:
      "Cenas tranquilo con alguien especial en un restaurante discreto de la ciudad. Al día siguiente, una revista publica las fotos: os habían fotografiado desde la calle durante toda la cena sin que os dierais cuenta.",
    imageScene:
      "Photorealistic paparazzi-style photo taken through a restaurant window at night, the photographed man having a candlelit dinner with a blurred anonymous companion, grainy telephoto lens look, tabloid magazine aesthetic",
    options: [
      {
        id: "a",
        label: "No hacer ninguna declaración",
        subtitle: "Dejar que se apague solo",
        consequences: { fama: 5, moral: -2 },
      },
      {
        id: "b",
        label: "Confirmarlo con humor en redes",
        subtitle: "+Fama, quitarle hierro",
        consequences: { fama: 8, moral: 3 },
      },
      {
        id: "c",
        label: "Quejarte públicamente de la falta de privacidad",
        subtitle: "Postura seria",
        consequences: { fama: 2, moral: 1 },
      },
    ],
    minWeek: 22,
  },
  {
    id: "fama-post-viral-propio",
    category: "prensa",
    title: "Tu propia publicación se vuelve viral",
    description:
      "Subes una foto random a tus redes, sin pensarlo demasiado, y por algún motivo que no llegas a entender del todo se convierte en el contenido más comentado del día en todo el país.",
    imageScene:
      "Photorealistic photo styled as a phone screen showing a social media post going viral, the photographed man casually smiling in a selfie-style photo, likes and comments counters visible but blurred/illegible, warm natural lighting",
    options: [
      {
        id: "a",
        label: "Aprovechar el momento y publicar más",
        subtitle: "+Fama, arriesgas sobreexposición",
        consequences: { fama: 9, moral: 2 },
      },
      {
        id: "b",
        label: "Dejar que hable por sí sola, sin insistir",
        subtitle: "Perfil más comedido",
        consequences: { fama: 5, moral: 3 },
      },
    ],
    minWeek: 12,
  },
  {
    id: "fama-portada-warca",
    category: "prensa",
    title: "Portada de Warca",
    description:
      'El diario deportivo más leído del país te pone en portada bajo un titular enorme. Tu representante te manda la foto de la portada antes incluso de que salga a los quioscos: "Esto no tiene precio."',
    imageScene:
      "Photorealistic photo of a sports newspaper front cover on a newsstand, the photographed man featured in a dramatic action pose, bold generic headline text, tabloid sports press style, other blurred magazines around it",
    options: [
      {
        id: "a",
        label: "Enmarcar la portada para casa",
        subtitle: "Momento para guardar",
        consequences: { fama: 6, moral: 5 },
      },
      {
        id: "b",
        label: "Restarle importancia ante la prensa",
        subtitle: "Perfil humilde",
        consequences: { fama: 4, rel_vestuario: 2 },
      },
    ],
    minWeek: 30,
  },
  {
    id: "fama-leyenda-dorsal",
    category: "vestuario",
    title: "La leyenda te pide que lleves su número",
    description:
      'Coincides de nuevo con Emiliano Rosso, esta vez en una cena de homenaje. Te suelta, medio en broma medio en serio: "Deberías llevar mi número algún día, a ver si le sacas más partido del que le saqué yo." La prensa que hay alrededor lo apunta todo.',
    options: [
      {
        id: "a",
        label: 'Decir que sí, sin pensarlo, delante de todos',
        subtitle: "Promesa pública con mucho peso encima",
        consequences: { fama: 7, media: 1, rel_aficion: 4, moral: 3 },
      },
      {
        id: "b",
        label: "Reírte y quitarle hierro al comentario",
        subtitle: "No comprometerte a nada todavía",
        consequences: { moral: 2, fama: 2 },
      },
    ],
    minWeek: 42,
  },

  // ── MOMENTOS DE TENSIÓN (resultado incierto) ──────────────────────
  {
    id: "ent-mister-pretemporada",
    category: "entrenamiento",
    title: "El entrenador recorre el campo",
    description:
      "En la pretemporada el míster se pasea entre los grupos de trabajo. No sabes si te vio o no.",
    options: [
      {
        id: "a",
        label: "Buscar que te vea, subir la intensidad",
        subtitle: "Puede notarlo o pasar de largo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: {
            text: "El míster se detiene, te mira jugar un par de minutos y asiente. \"Sigue así\", te dice antes de irse.",
            consequences: { rel_entrenador: 8, moral: 4 },
          },
          fail: {
            text: "El míster pasa de largo sin mirarte, con la cabeza en otra cosa.",
            consequences: { moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Seguir tu rutina sin forzar nada",
        subtitle: "Profesionalidad silenciosa",
        consequences: { forma: 2 },
      },
    ],
  },
  {
    id: "par-mano-a-mano",
    category: "partido",
    priority: true,
    title: "Solo ante el portero",
    description: "Recibes el pase filtrado y quedas mano a mano con el portero. El estadio contiene la respiración.",
    options: [
      {
        id: "a",
        label: "Rematar fuerte al primer palo",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "forma",
          success: {
            text: "¡GOOOL! El balón entra pegado al palo. El estadio explota con tu nombre.",
            consequences: { fama: 8, rel_aficion: 10, moral: 6, media: 4 },
          },
          fail: {
            text: "El portero la ataja sin problemas. Te llevas las manos a la cabeza.",
            consequences: { moral: -4, rel_aficion: -2, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Amagar y definir cruzado",
        subtitle: "Más elegante, más riesgo de resbalar",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "forma",
          success: {
            text: "El amague deja al portero tirado. Definición cruzada, gol de categoría.",
            consequences: { fama: 10, rel_aficion: 8, moral: 7, media: 5 },
          },
          fail: {
            text: "Se te va largo el balón tras el amague. Ocasión perdida.",
            consequences: { moral: -5, media: -2 },
          },
        },
      },
      {
        id: "c",
        label: "Pasarla al compañero mejor posicionado",
        subtitle: "Menos gloria, más seguro",
        consequences: { rel_vestuario: 6, moral: 2 },
      },
    ],
    minWeek: 6,
  },
  {
    id: "par-penal",
    category: "partido",
    priority: true,
    title: "Penalti a favor en el último minuto",
    description: "El árbitro señala el punto de penalti. El resultado del partido depende de este balón. ¿Lo tiras tú?",
    options: [
      {
        id: "a",
        label: "Pedirlo y tirarlo",
        subtitle: "Te la juegas",
        consequences: {},
        resolve: {
          baseChance: 0.65,
          statModifier: "moral",
          success: {
            text: "¡GOL! Lo clavas en la escuadra. Eres el héroe de la noche.",
            consequences: { fama: 10, rel_aficion: 12, moral: 8, media: 4 },
          },
          fail: {
            text: "El portero adivina el lado y lo ataja. Silencio total en el estadio.",
            consequences: { moral: -8, rel_aficion: -4, rel_vestuario: -2, media: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Cedérsela al pateador habitual",
        subtitle: "No arriesgas tu momento",
        consequences: { rel_vestuario: 4 },
      },
    ],
    minWeek: 8,
  },
  {
    id: "par-roja-injusta",
    category: "partido",
    priority: true,
    title: "Expulsión injusta",
    description:
      "El árbitro te enseña la roja directa tras una entrada que ni siquiera tocó al rival. Te quedas mirando la tarjeta sin poder creerlo, con diez compañeros que ahora tienen que remar sin ti.",
    options: [
      {
        id: "a",
        label: "Protestar la decisión con todo",
        subtitle: "Riesgo de sanción extra",
        consequences: {},
        resolve: {
          baseChance: 0.3,
          statModifier: "moral",
          success: {
            text: "El cuarto árbitro te frena a tiempo, pero el vídeo demuestra después que tenías razón. La federación no actúa, pero la prensa sí te respalda.",
            consequences: { fama: 4, moral: 2, media: -1 },
          },
          fail: {
            text: "Te ganas una segunda amonestación y una sanción extra de partidos por tus protestas.",
            consequences: { moral: -6, rel_entrenador: -4, media: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Salir del campo en silencio, tragándotelo",
        subtitle: "+Relación entrenador",
        consequences: { rel_entrenador: 5, moral: -5, media: -1 },
      },
    ],
    minWeek: 12,
  },
  {
    id: "par-hat-trick",
    category: "partido",
    priority: true,
    title: "Noche de hat-trick",
    description:
      "Llevas dos goles en el marcador y el partido sigue abierto. En el descuento, un balón suelto en el área te deja solo con la portería vacía para completar el triplete.",
    milestoneType: "gol_decisivo",
    imageScene:
      "Photorealistic sports photography of the photographed man celebrating a goal on the pitch, arms raised, teammates running to embrace him, stadium crowd roaring in the background, dramatic floodlights",
    options: [
      {
        id: "a",
        label: "Rematar a la portería vacía sin pensarlo",
        subtitle: "El hat-trick está ahí",
        consequences: {},
        resolve: {
          baseChance: 0.7,
          statModifier: "forma",
          success: {
            text: "¡Hat-trick! El estadio entero corea tu nombre. Es una noche que no vas a olvidar.",
            consequences: { fama: 15, rel_aficion: 12, moral: 10, media: 6 },
          },
          fail: {
            text: "En el último segundo, un defensa aparece de la nada y despeja sobre la línea. Te quedas con dos goles, que ya está muy bien, pero se queda la espina.",
            consequences: { fama: 5, moral: -2, media: 3 },
          },
        },
      },
      {
        id: "b",
        label: "Pasarla a un compañero que pide el balón a gritos",
        subtitle: "Generosidad, menos protagonismo",
        consequences: { rel_vestuario: 8, moral: 3, media: 2 },
      },
    ],
    minWeek: 65,
  },
  {
    id: "par-etiqueta-fichaje-caro",
    category: "partido",
    priority: true,
    title: "El peso del dorsal",
    description:
      "El club pagó una cifra enorme por ti y todo el mundo lo sabe. Sales de titular en un partido cualquiera de Liga y notas que cada balón que tocas se juzga con otra vara: no basta con jugar bien, hay que parecer que vales lo que costaste.",
    options: [
      {
        id: "a",
        label: "Jugar simple, sin intentar justificar el precio en una sola jugada",
        subtitle: "Paciencia con el proceso",
        consequences: { rel_entrenador: 5, moral: 3 },
      },
      {
        id: "b",
        label: "Forzar la jugada vistosa para callar bocas",
        subtitle: "Todo o nada con la presión encima",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "media",
          success: {
            text: "La jugada sale perfecta. Por primera vez sientes que el vestuario y la grada dejan de mirarte como \"el fichaje\" y empiezan a verte como uno más.",
            consequences: { fama: 8, media: 5, rel_aficion: 6 },
          },
          fail: {
            text: "La jugada se tuerce y el error se magnifica por lo que costaste. Un titular al día siguiente lo deja claro: \"otra vez el fichaje caro\".",
            consequences: { moral: -6, media: -4, fama: -2 },
          },
        },
      },
    ],
    minWeek: 20,
    minMedia: 60,
  },
  {
    id: "par-cesion-revancha",
    category: "partido",
    priority: true,
    title: "El club que te dejó marchar, enfrente",
    description:
      "El sorteo del calendario te pone cara a cara contra el club que te cedió sin apenas darte una oportunidad. Nadie lo dice en voz alta en la rueda de prensa previa, pero todos en el vestuario saben que este partido es distinto para ti.",
    imageScene:
      "Photorealistic sports photography of the photographed man celebrating an emotional goal with a restrained, pointed celebration, looking toward the opposing bench, stadium atmosphere, dramatic lighting",
    options: [
      {
        id: "a",
        label: "Guardarte las ganas de revancha y jugar con la cabeza fría",
        subtitle: "Profesionalidad por delante de todo",
        consequences: { moral: 4, rel_entrenador: 4 },
      },
      {
        id: "b",
        label: "Salir a demostrarles exactamente lo que se perdieron",
        subtitle: "Motivación extra, riesgo de precipitarte",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: {
            text: "Marcas y decides no celebrarlo por respeto, aunque el mensaje llega alto y claro a todo el estadio. La prensa habla de tu partido durante días.",
            consequences: { fama: 10, media: 5, moral: 8 },
          },
          fail: {
            text: "Las ganas te pueden y terminas forzando decisiones que no son propias de tu juego. El partido se te escapa de las manos.",
            consequences: { moral: -5, media: -3 },
          },
        },
      },
    ],
    minWeek: 25,
    requiresFlag: "cedido_antes",
  },

  // ── VESTUARIO Y PRENSA (momentos guionados) ───────────────────────
  {
    id: "ves-conflicto-capitan",
    category: "vestuario",
    priority: true,
    title: "Choque con el capitán",
    description:
      "El capitán te corta en pleno entrenamiento delante de todos: cree que juegas para la grada, no para el equipo. No es la primera vez que lo piensa, solo la primera que lo dice en voz alta.",
    options: [
      {
        id: "a",
        label: "Responderle ahí mismo, sin bajar la cabeza",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "moral",
          success: {
            text: "El vestuario se pone de tu lado — llevabas razón y todos lo sabían.",
            consequences: { rel_vestuario: 8, moral: 5 },
          },
          fail: {
            text: "Se arma una discusión fea que dos compañeros tienen que cortar. El entrenador se entera.",
            consequences: { rel_vestuario: -8, rel_entrenador: -3, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Hablarlo con él en privado más tarde",
        subtitle: "+Relación vestuario, sin escándalo",
        consequences: { rel_vestuario: 5, moral: 1 },
      },
    ],
    minWeek: 25,
  },
  {
    id: "prensa-polemica",
    category: "prensa",
    priority: true,
    title: "Una frase que se hace viral",
    description:
      "Una frase tuya en zona mixta, sacada de contexto, se convierte en trending topic en minutos. Los titulares dicen que criticaste al club; tú solo hablabas de la presión mediática en general.",
    options: [
      {
        id: "a",
        label: "Aclararlo tú mismo en redes, sin filtros",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: {
            text: "Tu aclaración se entiende bien y hasta gana simpatías por lo directa que fue.",
            consequences: { fama: 8, rel_aficion: 4 },
          },
          fail: {
            text: "Tu respuesta suena defensiva y aviva más la polémica.",
            consequences: { fama: -4, rel_aficion: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Dejar que el club emita un comunicado oficial",
        subtitle: "Perfil bajo, el control queda en otras manos",
        consequences: { rel_representante: 3, fama: -1 },
      },
    ],
    minWeek: 35,
  },

  // ── DECISIONES DE CLUB (elección directa, no azar) ────────────────
  {
    id: "fork-cesion",
    category: "representante",
    priority: true,
    title: "¿Pelear tu lugar o salir a jugar?",
    description:
      "No estás teniendo los minutos que esperabas. Tu representante te trae una alternativa: salir a préstamo a un club donde serías titular.",
    lookEvolution:
      "Same person, a bit older now, slightly more defined jawline, still young and fresh-faced, natural light, photorealistic athlete portrait, keep facial identity and skin tone unchanged",
    options: [
      {
        id: "a",
        label: "Quedarte y pelear tu lugar",
        subtitle: "Apuesta a largo plazo en el mismo club",
        consequences: { rel_vestuario: 6, moral: -2, media: -2 },
      },
      {
        id: "b",
        label: "Salir cedido para jugar todos los minutos",
        subtitle: "Menos exposición, más minutos",
        consequences: {
          club: "Real Zaragoza",
          forma: 10,
          fama: -3,
          moral: 5,
          media: 4,
          flags: { cedido_antes: "Real Zaragoza" },
        },
      },
    ],
    minWeek: 15,
  },
  {
    id: "fork-fuera-de-planes",
    category: "representante",
    priority: true,
    title: "El entrenador ya no cuenta contigo",
    description:
      "Te lo dice sin rodeos en su despacho: no entras en sus planes, ni ahora ni la temporada que viene. El club prefiere que salgas cedido o traspasado antes de que se cumpla tu contrato sin jugar.",
    imageScene:
      "Photorealistic photo of the photographed man sitting across a desk from a coach in a small, sparse office, tense body language, harsh overhead lighting, difficult conversation atmosphere",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al entrenador en ese despacho?",
    options: [
      {
        id: "a",
        label: "Aceptar la salida a un club más modesto",
        subtitle: "Bajar el nivel para volver a jugar",
        consequences: {},
        resolve: {
          baseChance: 0.6,
          statModifier: "media",
          success: {
            text: "El cambio de aires te sienta bien: vuelves a disfrutar del fútbol en un club que sí cuenta contigo.",
            consequences: { moral: 6, media: 3 },
          },
          fail: {
            text: "El nuevo club tampoco te da lo que buscabas, y la sensación de estancamiento vuelve enseguida.",
            consequences: { moral: -5, media: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Quedarte a pelear tu sitio pese a todo",
        subtitle: "Orgullo, riesgo de pudrirte en el banquillo",
        consequences: { moral: -4, rel_entrenador: -3, media: -3 },
      },
    ],
    minWeek: 30,
    maxMedia: 52,
  },
  {
    id: "fork-no-renovacion",
    category: "representante",
    priority: true,
    title: "El club no te renueva",
    description:
      "Termina la temporada y, con ella, tu contrato. El club te comunica que no va a renovarte: los números no acompañan, y hay jugadores más jóvenes esperando el sitio. Te quedas libre, sin garantías de nada.",
    allowFreeText: true,
    freeTextPrompt: "¿Cómo te tomas la noticia, en tus propias palabras?",
    options: [
      {
        id: "a",
        label: "Aceptar la primera oferta modesta que llegue",
        subtitle: "Seguir jugando, cueste lo que cueste",
        consequences: { club: "UD Almería", moral: -2, media: -2, patrimonio: -2000 },
      },
      {
        id: "b",
        label: "Esperar una oferta mejor, aunque tarde meses sin equipo",
        subtitle: "Riesgo de quedarte mucho tiempo sin jugar",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "media",
          success: {
            text: "La espera merece la pena: un club con más ambición se fija en ti al final del mercado.",
            consequences: { club: "Real Valladolid", moral: 5, media: 2 },
          },
          fail: {
            text: "Nadie más llama. Terminas firmando meses después por un club modesto, muy por debajo de donde creías que estarías a estas alturas.",
            consequences: { club: "Sporting de Gijón", moral: -8, media: -5, patrimonio: -5000 },
          },
        },
      },
    ],
    minWeek: 70,
    maxMedia: 50,
  },
  {
    id: "vid-aceptar-la-realidad",
    category: "vida",
    title: "Hacer las paces con la carrera que tienes",
    description:
      "Una noche cualquiera te das cuenta de que la superestrella que soñabas ser a los 16 años no va a llegar. No has fracasado, pero tampoco es la carrera de las revistas. Toca decidir con qué te quedas de todo esto.",
    allowFreeText: true,
    freeTextPrompt: "Si tuvieras que explicárselo a tu yo de 16 años, ¿qué le dirías?",
    options: [
      {
        id: "a",
        label: "Encontrar orgullo en lo que sí has construido",
        subtitle: "+Moral, paz con tu propia historia",
        consequences: { moral: 10 },
      },
      {
        id: "b",
        label: "Empezar ya a pensar en tu vida después del fútbol",
        subtitle: "Mirar hacia delante en vez de hacia atrás",
        consequences: { moral: 4, patrimonio: 2000 },
      },
    ],
    minWeek: 90,
    maxMedia: 58,
  },
  {
    id: "esp-espiral-alcohol",
    category: "vida",
    priority: true,
    title: "Lo que empezó como una copa de más",
    description:
      "Llevas meses sin apenas jugar y las noches de fiesta para desconectar se han convertido en algo casi diario. Tu representante te lo dice a la cara, muy serio: la gente del club ya habla de ello, y no en buen sentido.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes a tu representante?",
    options: [
      {
        id: "a",
        label: "Reconocerlo y pedir ayuda profesional",
        subtitle: "El camino difícil, pero real",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "moral",
          success: {
            text: "Cuesta un mundo, pero sales adelante. Meses después vuelves a sentirte dueño de tu vida, aunque el club ya no cuenta contigo como antes.",
            consequences: { moral: 12, rel_vestuario: 5, media: 2 },
          },
          fail: {
            text: "Lo intentas, pero recaes más de una vez. El club decide no arriesgar más contigo y empieza a buscarte salida.",
            consequences: { moral: -6, media: -6, rel_entrenador: -8 },
          },
        },
      },
      {
        id: "b",
        label: "Negarlo todo, tú controlas la situación",
        subtitle: "Jugada de alto riesgo",
        consequences: { moral: -10, media: -8, rel_entrenador: -10, rel_vestuario: -5 },
      },
    ],
    minWeek: 60,
    maxMedia: 55,
  },
  {
    id: "fork-salto-internacional",
    category: "representante",
    priority: true,
    title: "Una liga distinta te llama",
    description:
      "Terminaste destacando y aparece la chance de dar el salto fuera de tu país por primera vez.",
    lookEvolution:
      "Same person, now with light short stubble beard, slightly more mature confident look, natural light, photorealistic athlete portrait, keep facial identity and skin tone unchanged",
    options: [
      {
        id: "a",
        label: "Quedarte donde ya eres importante",
        subtitle: "Comodidad conocida",
        consequences: { rel_aficion: 5, rel_vestuario: 4 },
      },
      {
        id: "b",
        label: "Aceptar el salto a Italia",
        subtitle: "Empezar de nuevo, fuera",
        consequences: { club: "Atalanta", fama: 6, moral: 3, rel_vestuario: -5 },
      },
    ],
    minWeek: 40,
    minMedia: 62,
  },
  {
    id: "fork-gigante-europeo",
    category: "representante",
    priority: true,
    title: "Llama un gigante europeo",
    description:
      "Tu nombre ya suena en toda Europa. Un club histórico presenta una oferta que puede cambiar tu carrera para siempre.",
    lookEvolution:
      "Same person, now with a fuller well-groomed beard, confident mature elite footballer look, natural light, photorealistic athlete portrait, keep facial identity and skin tone unchanged",
    options: [
      {
        id: "a",
        label: "Quedarte como figura del proyecto actual",
        subtitle: "Ser el líder de un equipo más modesto",
        consequences: { rel_vestuario: 8, rel_aficion: 8 },
      },
      {
        id: "b",
        label: "Fichar por el gigante",
        subtitle: "Máxima exigencia, máxima exposición",
        consequences: { club: "Real Madrid", fama: 15, patrimonio: 20000, rel_vestuario: -6 },
      },
    ],
    minWeek: 80,
    minMedia: 78,
  },
  {
    id: "fork-nuevo-reto",
    category: "representante",
    priority: true,
    title: "¿Ya lo ganaste todo aquí?",
    description:
      "Después de años en la élite, tu carrera corre el riesgo de volverse previsible. Aparece un reto distinto en otra liga.",
    lookEvolution:
      "Same person, veteran elite footballer look, some grey hairs starting to show in the beard, more weathered mature face, natural light, photorealistic athlete portrait, keep facial identity and skin tone unchanged",
    options: [
      {
        id: "a",
        label: "Quedarte donde ya eres leyenda",
        subtitle: "Legado asegurado",
        consequences: { rel_aficion: 10 },
      },
      {
        id: "b",
        label: "Ir a la Premier League con el Liverpool FC",
        subtitle: "Volver a demostrar todo desde cero",
        consequences: {
          club: "Liverpool FC",
          fama: 10,
          moral: 5,
          rel_vestuario: -8,
          flags: { en_premier: true },
        },
      },
      {
        id: "c",
        label: "Ir a la Premier League con el Manchester City",
        subtitle: "Un proyecto ganador desde el primer día",
        consequences: {
          club: "Manchester City",
          fama: 10,
          moral: 5,
          rel_vestuario: -8,
          flags: { en_premier: true },
        },
      },
    ],
    minWeek: 130,
    minMedia: 82,
  },
  {
    id: "fork-premier-segundo-club",
    category: "representante",
    priority: true,
    title: "Otro gigante de la Premier pregunta por ti",
    description:
      "Tras consolidarte en Inglaterra, un rival directo de tu club se interesa en ti para pelear el título la próxima temporada.",
    options: [
      {
        id: "a",
        label: "Seguir en tu club actual",
        subtitle: "Lealtad al proyecto",
        consequences: { rel_aficion: 8, rel_vestuario: 5 },
      },
      {
        id: "b",
        label: "Cambiar de aires dentro de la Premier",
        subtitle: "Nuevo reto, mismo país",
        consequences: {
          club: "Manchester City",
          fama: 8,
          moral: 4,
          rel_aficion: -10,
          rel_vestuario: -5,
        },
      },
    ],
    minWeek: 150,
    requiresFlag: "en_premier",
    minMedia: 84,
  },
  {
    id: "especial-mentor-joven",
    category: "especial",
    priority: true,
    title: "El chaval que te recuerda a ti",
    description:
      "Un canterano de dieciocho años llega al primer equipo con la misma hambre que tenías tú a su edad. El club te pide, sin decirlo del todo, que lo ayudes a asentarse — sabiendo que en unos años puede quitarte el sitio.",
    options: [
      {
        id: "a",
        label: "Volcarte en enseñarle todo lo que sabes",
        subtitle: "Legado por encima del ego",
        consequences: { reputacion: 8, rel_vestuario: 6, moral: 4 },
      },
      {
        id: "b",
        label: "Ayudarlo lo justo, sin ponérselo demasiado fácil",
        subtitle: "Sigues siendo tú quien compite por el puesto",
        consequences: { moral: 2, rel_vestuario: -2 },
      },
    ],
    minWeek: 145,
  },

  // ── VIDA ADULTA Y CARRERA MAYOR ────────────────────────────────
  {
    id: "rep-patrocinio-marca",
    category: "representante",
    title: "Puma o Adidas",
    description:
      "Las dos marcas se pelean por tus botas. Puma ofrece un contrato menor pero con libertad total de imagen; Adidas ofrece más dinero y más exposición, pero exige exclusividad total.",
    options: [
      {
        id: "puma",
        label: "Firmar con Puma",
        subtitle: "Menos dinero, más libertad",
        consequences: { patrimonio: 15000, fama: 3 },
      },
      {
        id: "adidas",
        label: "Firmar con Adidas",
        subtitle: "Más dinero, exclusividad total",
        consequences: { patrimonio: 35000, fama: 6, rel_representante: 3 },
      },
      {
        id: "esperar",
        label: "Esperar, todavía puede aparecer algo mejor",
        subtitle: "Apuesta a futuro",
        consequences: { moral: -1 },
      },
    ],
    minWeek: 25,
  },
  {
    id: "pat-bota-firma",
    category: "representante",
    title: "Adidas quiere una bota con tu nombre",
    description:
      "Tu representante entra por videollamada casi sin aliento: Adidas quiere ir más allá del contrato de imagen y sacar un modelo de bota firmado por ti, con tu nombre grabado en el talón y edición limitada en tiendas de medio mundo.",
    imageScene:
      "Photorealistic product photo of a premium signature football boot with the player's surname embroidered on the heel, dramatic studio lighting, sponsor-style advertising shot",
    options: [
      {
        id: "a",
        label: "Involucrarte en el diseño, aunque lleve tiempo",
        subtitle: "+Patrimonio alto, +Fama",
        consequences: { patrimonio: 40000, fama: 8, moral: 4 },
      },
      {
        id: "b",
        label: "Firmar rápido y dejarles el diseño a ellos",
        subtitle: "Menos esfuerzo, algo menos de dinero",
        consequences: { patrimonio: 22000, fama: 4 },
      },
      {
        id: "c",
        label: "Rechazarlo, no quieres tu nombre en un producto",
        subtitle: "Prioridad: la imagen, no el dinero",
        consequences: { rel_representante: -2, moral: 1 },
      },
    ],
    minWeek: 55,
  },
  {
    id: "rep-inversion-startup",
    category: "representante",
    title: "Tu representante te habla de una startup",
    description:
      'Tu representante te presenta a los fundadores de una startup tecnológica: "He visto muchos jugadores meter dinero en tonterías. Esta gente tiene cabeza, y entrar ahora, a este precio, no se va a repetir." Piden una cantidad seria para las siguientes rondas.',
    imageScene:
      "Photorealistic photo of a business magazine cover feature, the photographed man in smart casual clothing photographed in a modern tech office, generic bold headline text about a successful investment, financial press style, confident pose",
    options: [
      {
        id: "a",
        label: "Invertir fuerte, confiando en tu representante",
        subtitle: "Riesgo alto, recompensa alta",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "reputacion",
          success: {
            text: "La startup despega mucho más rápido de lo esperado y una ronda posterior multiplica tu inversión por varias veces. La prensa económica se hace eco de la operación.",
            consequences: { patrimonio: 60000, moral: 5, rel_representante: 4 },
          },
          fail: {
            text: "La startup no llega a levantar la siguiente ronda y cierra dos años después. El dinero no vuelve.",
            consequences: { patrimonio: -18000, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "Entrar solo con una cantidad simbólica",
        subtitle: "Riesgo bajo, recompensa baja",
        consequences: { patrimonio: -3000, rel_representante: 2 },
      },
      {
        id: "c",
        label: "No invertir, el fútbol ya es suficiente riesgo",
        subtitle: "Conservador",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 40,
  },
  {
    id: "vid-lucia-conoce",
    category: "vida",
    title: "Lucía",
    description:
      "La conoces en la presentación de un patrocinador, casi por casualidad. No tiene nada que ver con el fútbol y eso, de entrada, te gusta. Seguís hablando semanas después.",
    options: [
      {
        id: "a",
        label: "Dejar que la relación avance con calma",
        subtitle: "+Moral",
        consequences: { moral: 6, flags: { pareja: "Lucía" } },
      },
      {
        id: "b",
        label: "Mantenerlo en privado, sin prisa por definir nada",
        subtitle: "Prudente",
        consequences: { moral: 3 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le cuentas de tu vida cuando pregunta?",
    minWeek: 20,
  },
  {
    id: "vid-lucia-formalizar",
    category: "vida",
    title: "Un año con Lucía",
    description:
      "Lleváis un año juntos y la pregunta empieza a rondar la relación: ¿os vais a vivir juntos, ahora que tu contrato ya te lo permite? Lucía no presiona, pero tampoco lo esconde.",
    requiresFlag: "pareja",
    options: [
      {
        id: "a",
        label: "Proponerle irse a vivir juntos",
        subtitle: "+Moral, la vida se estabiliza",
        consequences: { moral: 8, patrimonio: -8000, flags: { convivencia: true } },
      },
      {
        id: "b",
        label: "Pedir un poco más de tiempo",
        subtitle: "La carrera sigue siendo la prioridad",
        consequences: { moral: -2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Cómo se lo explicas a Lucía?",
    minWeek: 45,
  },
  {
    id: "vid-embarazo",
    category: "vida",
    title: "Una noticia que lo cambia todo",
    description:
      "Lucía te lo dice una noche cualquiera, sin previo aviso: está embarazada. Te quedas en silencio unos segundos que a ella se le hacen eternos.",
    requiresFlag: "pareja",
    options: [
      {
        id: "a",
        label: "Reorganizar tu vida en torno a la familia que empieza",
        subtitle: "+Moral a largo plazo",
        consequences: { moral: 10, forma: -2, flags: { hijos: "en camino" } },
      },
      {
        id: "b",
        label: "Intentar que nada cambie en tu rutina como profesional",
        subtitle: "Riesgo de distancia en casa",
        consequences: { moral: 2, rel_representante: -1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué es lo primero que le dices?",
    minWeek: 70,
  },
  {
    id: "vid-boda",
    category: "vida",
    title: "El día de la boda",
    description:
      "Después de años juntos, hoy te casas con Lucía. Media plantilla está entre los invitados, tu entrenador incluido, y hay más cámaras fuera esperando la salida que en la puerta de algunos estadios.",
    isMilestone: true,
    milestoneType: "boda",
    imageScene:
      "Photorealistic wedding photo of the photographed man in a formal suit, smiling, with a few teammates and a coach figure visible in the background, elegant wedding venue, warm golden hour light, joyful atmosphere",
    allowFreeText: true,
    freeTextPrompt: "¿Qué dices en tu discurso?",
    options: [
      {
        id: "a",
        label: "Un discurso emotivo delante de todos",
        subtitle: "+Moral, momento para el recuerdo",
        consequences: { moral: 12, fama: 4 },
      },
      {
        id: "b",
        label: "Una celebración discreta, sin grandes gestos",
        subtitle: "Perfil bajo, igual de especial en privado",
        consequences: { moral: 10 },
      },
    ],
    requiresFlag: "convivencia",
    minWeek: 55,
  },
  {
    id: "rep-renovacion-contrato",
    category: "representante",
    priority: true,
    title: "El club quiere que sigas",
    description:
      "El club te ofrece una renovación antes de que expire tu contrato actual: quieren dejar claro que cuentan contigo a largo plazo. Tu representante ya se ha sentado a hablar números con el director deportivo.",
    isMilestone: true,
    milestoneType: "contrato",
    imageScene:
      "Photorealistic photo of the photographed man holding up a club jersey with a new contract on the table, sitting next to a club director in a suit, official club office, camera flashes, warm lighting",
    options: [
      {
        id: "a",
        label: "Firmar sin dilatarlo, quieres seguir aquí",
        subtitle: "+Relación con la afición",
        consequences: { rel_aficion: 8, moral: 6 },
      },
      {
        id: "b",
        label: "Usar el interés de otros clubes para mejorar las condiciones",
        subtitle: "+Patrimonio, jugada más fría",
        consequences: { patrimonio: 20000, rel_representante: 5, rel_aficion: -2 },
      },
      {
        id: "c",
        label: "Pedir una cláusula de salida más baja, por si acaso",
        subtitle: "Te cubres las espaldas",
        consequences: { rel_representante: 3 },
      },
    ],
    minWeek: 45,
    minMedia: 58,
  },
  {
    id: "fork-ascenso-division",
    category: "partido",
    priority: true,
    title: "Partido de ascenso",
    description:
      "Última jornada de la temporada regular: ganar significa subir de categoría con el club, algo que la afición lleva años esperando. El ambiente en la ciudad no habla de otra cosa desde hace una semana.",
    isMilestone: true,
    milestoneType: "ascenso",
    imageScene:
      "Photorealistic sports photography of the photographed man celebrating promotion on the pitch, teammates jumping together, fans invading the field in the background, confetti, dramatic stadium lighting",
    options: [
      {
        id: "a",
        label: "Jugar el partido de tu vida por el ascenso",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: {
            text: "¡Ascenso conseguido! La afición invade el campo al pitido final. Llevarán tu nombre en la memoria de este club durante años.",
            consequences: { fama: 14, rel_aficion: 15, moral: 12, media: 6 },
          },
          fail: {
            text: "El ascenso se escapa en el último suspiro. El vestidero queda en silencio; habrá que intentarlo otra temporada más.",
            consequences: { moral: -8, rel_aficion: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con cabeza, sin forzar de más",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, rel_entrenador: 4 },
      },
    ],
    minWeek: 30,
    maxMedia: 70,
  },
  {
    id: "par-mvp-partido-clave",
    category: "partido",
    priority: true,
    title: "El mejor sobre el campo",
    description:
      "Terminas el partido más importante de la temporada como la gran figura: decisivo de principio a fin. Al pitido final, el speaker del estadio anuncia tu nombre como el mejor jugador del partido.",
    isMilestone: true,
    milestoneType: "mvp",
    imageScene:
      "Photorealistic sports photography of the photographed man receiving a man-of-the-match award trophy on the pitch after a game, stadium lights, teammates applauding in the background, camera flashes",
    options: [
      {
        id: "a",
        label: "Dedicar el premio a la afición",
        subtitle: "+Relación con la afición",
        consequences: { rel_aficion: 8, fama: 6, moral: 6 },
      },
      {
        id: "b",
        label: "Dedicarlo al vestuario, fue un trabajo de equipo",
        subtitle: "+Vestuario",
        consequences: { rel_vestuario: 8, fama: 4, moral: 4 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué dices al recoger el premio?",
    minWeek: 30,
    minMedia: 62,
  },
  {
    id: "vid-hermano-pequeno",
    category: "vida",
    title: "Tu hermano pequeño quiere ser como tú",
    description:
      "Tu hermano pequeño se ha apuntado a fútbol en el colegio y no para de repetir que quiere llegar donde has llegado tú. Tus padres te piden, entre risas, que le bajes un poco las expectativas... o que le eches una mano de verdad.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices cuando te pregunta cómo hacerlo?",
    options: [
      {
        id: "a",
        label: "Involucrarte de verdad: llevarlo a entrenar contigo un día",
        subtitle: "+Moral, momento familiar bonito",
        consequences: { moral: 7, patrimonio: -500 },
      },
      {
        id: "b",
        label: "Darle ánimo desde la distancia, sin más",
        subtitle: "Cariño con límites",
        consequences: { moral: 3 },
      },
    ],
    minWeek: 15,
  },
  {
    id: "vid-diego-reaparece",
    category: "vida",
    title: "Diego reaparece",
    description:
      "Años después de aquel mensaje de felicitación, Diego —tu mejor amigo de la infancia, el que dejó el fútbol cuando tú seguiste— te escribe otra vez. No pide nada al principio, solo pregunta cómo estás de verdad, no la versión de las entrevistas.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le cuentas a Diego que no le contarías a nadie más?",
    options: [
      {
        id: "a",
        label: "Abrirte del todo, como cuando erais chavales",
        subtitle: "+Moral, recuperas una amistad real",
        consequences: { moral: 8 },
      },
      {
        id: "b",
        label: "Responder con cariño pero sin bajar la guardia",
        subtitle: "Prudente",
        consequences: { moral: 3 },
      },
    ],
    minWeek: 60,
  },
  {
    id: "vid-llamada-madre",
    category: "vida",
    title: "La llamada de tu madre",
    description:
      "Te llama un domingo cualquiera, sin motivo especial. Pregunta si comes bien, si duermes, si estás cuidándote... y, al final, sin poder evitarlo, si has visto lo que dicen de ti en la televisión.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le cuentas de verdad?",
    options: [
      {
        id: "a",
        label: "Contarle todo tal cual está pasando",
        subtitle: "+Moral, te desahogas de verdad",
        consequences: { moral: 6 },
      },
      {
        id: "b",
        label: "Tranquilizarla y quitarle importancia a lo malo",
        subtitle: "Protegerla a ella antes que a ti",
        consequences: { moral: 3 },
      },
    ],
    minWeek: 8,
  },
  {
    id: "sel-primera-convocatoria",
    category: "especial",
    title: "La selección te llama por primera vez",
    description:
      "El seleccionador nacional marca tu número personalmente. No es una entrevista ni un rumor: es una convocatoria oficial para la próxima ventana internacional.",
    priority: true,
    isMilestone: true,
    milestoneType: "seleccion",
    options: [
      {
        id: "a",
        label: "Vivirlo como la confirmación de que vas por buen camino",
        subtitle: "+Moral, +Fama",
        consequences: { moral: 8, fama: 6 },
      },
      {
        id: "b",
        label: "Quitarle importancia hasta debutar de verdad",
        subtitle: "Cautela",
        consequences: { moral: 3, fama: 2 },
      },
    ],
    minWeek: 50,
    minMedia: 58,
  },
  {
    id: "especial-lesion-grave",
    category: "especial",
    priority: true,
    title: "La lesión que lo para todo",
    description:
      "Un mal apoyo en un partido cualquiera y sientes que la rodilla cede. La resonancia lo confirma esa misma noche: rotura de ligamento, meses fuera. De un momento a otro, tu carrera se detiene.",
    isMilestone: true,
    imageScene:
      "Photorealistic photo of the photographed man sitting on a hospital bed or physio table wearing a knee brace, using crutches nearby, somber lighting, medical clinic setting, realistic and emotional but not graphic",
    options: [
      {
        id: "a",
        label: "Afrontar la recuperación con toda la disciplina posible",
        subtitle: "El camino largo, pero seguro",
        consequences: { forma: -15, moral: -4, rel_entrenador: 3 },
      },
      {
        id: "b",
        label: "Buscar una segunda opinión médica, aunque tarde más en operarte",
        subtitle: "Jugada de riesgo con tu cuerpo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: {
            text: "El segundo especialista encuentra un tratamiento alternativo que acorta el plazo. Vuelves antes de lo previsto.",
            consequences: { forma: -8, moral: 2 },
          },
          fail: {
            text: "La segunda opinión no cambia nada, y perder esas semanas retrasa aún más la vuelta.",
            consequences: { forma: -18, moral: -6 },
          },
        },
      },
    ],
    minWeek: 55,
  },
  {
    id: "premio-balon-oro",
    category: "especial",
    title: "Nominado al Balón de Oro",
    description:
      "Tu nombre está entre los finalistas del premio individual más importante del fútbol mundial. La gala es en unas semanas, en París.",
    priority: true,
    isMilestone: true,
    milestoneType: "premio",
    imageScene:
      "Photorealistic photo of the photographed man on a red carpet in a formal tuxedo, award show lighting, flashes from photographers, elegant gala atmosphere, sports awards ceremony style",
    options: [
      {
        id: "a",
        label: "Ir a la gala a jugármela",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.35,
          statModifier: "fama",
          success: {
            text: "Dicen tu nombre. Te quedas en blanco un segundo antes de levantarte: has ganado el Balón de Oro.",
            consequences: { fama: 20, moral: 15, patrimonio: 10000, media: 10, flags: { title_balon_oro: true } },
          },
          fail: {
            text: "El premio se lo lleva otro. Aplaudes de pie, sonríes para las cámaras, y por dentro ya estás pensando en el año que viene.",
            consequences: { fama: 5, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "Restarle importancia: los títulos colectivos son lo que cuenta",
        subtitle: "Perfil bajo",
        consequences: { moral: 3, rel_vestuario: 4 },
      },
    ],
    minWeek: 90,
    minMedia: 90,
  },
  {
    id: "fork-titulo-liga",
    category: "partido",
    priority: true,
    title: "Se decide la Liga",
    description:
      "Última jornada. Vuestro equipo depende de sí mismo: ganar y sois campeones. El estadio lleva toda la semana sin hablar de otra cosa.",
    isMilestone: true,
    milestoneType: "titulo",
    imageScene:
      "Photorealistic sports photography of the photographed man celebrating winning a league title on the pitch, confetti falling, teammates and trophy nearby, huge crowd, dramatic stadium lighting",
    options: [
      {
        id: "a",
        label: "Pedir el balón en cada jugada decisiva",
        subtitle: "Quieres cargar con la responsabilidad",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "forma",
          success: {
            text: "¡Sois campeones de Liga! El campo se llena de gente, confeti y lágrimas. Nada se parece a esto.",
            consequences: { fama: 18, rel_aficion: 15, moral: 15, media: 8, flags: { title_liga: true } },
          },
          fail: {
            text: "El título se escapa en los últimos minutos. El vestuario queda en silencio bajo la ducha.",
            consequences: { moral: -10, rel_aficion: -3, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Confiar en el plan del entrenador, sin forzar de más",
        subtitle: "Menos protagonismo, más disciplina táctica",
        consequences: { rel_entrenador: 6, moral: 2 },
      },
    ],
    minWeek: 40,
    minMedia: 66,
  },
  {
    id: "fork-champions",
    category: "partido",
    priority: true,
    title: "Final continental",
    description:
      "La final del torneo más grande de clubes de Europa. Millones de personas en todo el mundo viendo el mismo partido que vas a jugar tú.",
    isMilestone: true,
    milestoneType: "titulo",
    imageScene:
      "Photorealistic sports photography of the photographed man lifting a large European club trophy on the pitch after winning a continental final, fireworks and confetti, massive stadium crowd, dramatic lighting",
    options: [
      {
        id: "a",
        label: "Jugar el partido de tu vida, sin miedo a fallar",
        subtitle: "Todo o nada en el escenario más grande",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "forma",
          success: {
            text: "¡Campeones de Europa! Levantas el trofeo más grande del continente. Este momento te acompaña para siempre.",
            consequences: { fama: 25, rel_aficion: 18, moral: 20, patrimonio: 15000, media: 10, flags: { title_champions: true } },
          },
          fail: {
            text: "La final se pierde en la tanda de penaltis. El silencio en el vestuario dura horas.",
            consequences: { moral: -12, fama: 5, media: -1 },
          },
        },
      },
      {
        id: "b",
        label: "Priorizar no cometer errores, jugar con la cabeza fría",
        subtitle: "Gestión de la presión",
        consequences: { moral: 3, rel_entrenador: 5 },
      },
    ],
    minWeek: 95,
    minMedia: 74,
  },
  {
    id: "sel-capitania",
    category: "especial",
    title: "El brazalete",
    description:
      "El seleccionador te reúne aparte del grupo antes del próximo partido. Quiere que seas tú quien lleve el brazalete de capitán a partir de ahora.",
    priority: true,
    isMilestone: true,
    milestoneType: "capitania",
    options: [
      {
        id: "a",
        label: "Aceptar y asumir el liderazgo de lleno",
        subtitle: "Responsabilidad total",
        consequences: { moral: 8, fama: 8, rel_aficion: 6 },
      },
      {
        id: "b",
        label: "Aceptar, pero liderar desde el ejemplo y no desde los discursos",
        subtitle: "Perfil bajo",
        consequences: { moral: 5, rel_vestuario: 6 },
      },
    ],
    minWeek: 100,
    minMedia: 72,
  },
  {
    id: "sel-mundial",
    category: "especial",
    title: "El Mundial",
    description:
      "Después de años de carrera, llegas a tu primer Mundial como una pieza clave de la selección. Todo lo que has construido se mide ahora también aquí.",
    priority: true,
    isMilestone: true,
    milestoneType: "mundial",
    allowFreeText: true,
    freeTextPrompt: "¿Qué dices en la rueda de prensa previa al torneo?",
    imageScene:
      "Photorealistic sports photography of the photographed man in his national team kit, celebrating passionately on a World Cup stadium pitch, huge crowd and confetti in the background, dramatic stadium lighting",
    options: [
      {
        id: "a",
        label: "Jugar cada partido a todo o nada",
        subtitle: "Asumir riesgos para liderar al equipo",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "forma",
          success: {
            text: "El equipo llega hasta el final y levantas el trofeo del Mundial. Es, hasta ahora, la noche más grande de tu carrera.",
            consequences: { fama: 25, moral: 20, rel_aficion: 15 },
          },
          fail: {
            text: "El equipo cae eliminado antes de lo que esperabais. Vuelves a casa con la sensación de que la oportunidad estuvo cerca.",
            consequences: { fama: 6, moral: -8 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con la cabeza, priorizando no arriesgar de más",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, fama: 4 },
      },
    ],
    minWeek: 110,
    minMedia: 66,
  },
  {
    id: "sel-clasificacion-mundial",
    category: "especial",
    priority: true,
    title: "Partido decisivo de clasificación al Mundial",
    description:
      "Última jornada de clasificación. Tu selección se juega el billete al Mundial en un partido que no admite errores. El estadio entero sabe lo que hay en juego esta noche.",
    isMilestone: true,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al grupo antes de saltar al campo?",
    imageScene:
      "Photorealistic sports photography of the photographed man in his national team kit, intense moment on the pitch during a decisive qualifying match, huge tension in the stadium, dramatic lighting",
    minMedia: 65,
    options: [
      {
        id: "a",
        label: "Pedir responsabilidad y salir a por el partido",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "fama",
          success: {
            text: "¡Clasificados! El campo entero explota. Habrá Mundial, y tú vas a estar en él.",
            consequences: { fama: 14, moral: 12, media: 4 },
          },
          fail: {
            text: "El partido se escapa y la clasificación queda en el aire. La selección necesitará un milagro en otro lado.",
            consequences: { moral: -10, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con cabeza, sin asumir riesgos innecesarios",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, fama: 2 },
      },
    ],
    minWeek: 85,
  },
  {
    id: "sel-clasificacion-eurocopa",
    category: "especial",
    priority: true,
    title: "Partido decisivo de clasificación a la Eurocopa",
    description:
      "Tu selección necesita puntuar sí o sí para asegurar la plaza en la Eurocopa. Es el partido más tenso de toda la fase de clasificación.",
    isMilestone: true,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al grupo antes de saltar al campo?",
    imageScene:
      "Photorealistic sports photography of the photographed man in his national team kit, intense moment on the pitch during a decisive European qualifying match, huge tension in the stadium, dramatic lighting",
    requiresConfederation: ["UEFA"],
    minMedia: 65,
    options: [
      {
        id: "a",
        label: "Pedir responsabilidad y salir a por el partido",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "fama",
          success: {
            text: "¡Clasificados a la Eurocopa! El vestuario se viene abajo de la emoción.",
            consequences: { fama: 12, moral: 10, media: 3 },
          },
          fail: {
            text: "El resultado no llega y la clasificación se complica muchísimo de cara a la última jornada.",
            consequences: { moral: -8, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con cabeza, sin asumir riesgos innecesarios",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, fama: 2 },
      },
    ],
    minWeek: 85,
  },
  {
    id: "sel-clasificacion-copa-america",
    category: "especial",
    priority: true,
    title: "Partido decisivo de clasificación a la Copa América",
    description:
      "La selección se juega la clasificación a la Copa América en un partido que puede definir toda la campaña. La presión en el vestuario es máxima.",
    isMilestone: true,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al grupo antes de saltar al campo?",
    imageScene:
      "Photorealistic sports photography of the photographed man in his national team kit, intense moment on the pitch during a decisive South American qualifying match, huge tension in the stadium, dramatic lighting",
    requiresConfederation: ["CONMEBOL"],
    minMedia: 65,
    options: [
      {
        id: "a",
        label: "Pedir responsabilidad y salir a por el partido",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "fama",
          success: {
            text: "¡Clasificados a la Copa América! La afición celebra en las calles de todo el país.",
            consequences: { fama: 12, moral: 10, media: 3 },
          },
          fail: {
            text: "El resultado no llega y la clasificación se complica muchísimo de cara a la última jornada.",
            consequences: { moral: -8, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con cabeza, sin asumir riesgos innecesarios",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, fama: 2 },
      },
    ],
    minWeek: 85,
  },
  {
    id: "sel-eurocopa",
    category: "especial",
    priority: true,
    title: "La Eurocopa",
    description:
      "Llegas a la Eurocopa como una pieza importante de tu selección. Semanas de convivencia, presión mediática constante y un torneo entero por delante.",
    isMilestone: true,
    milestoneType: "eurocopa",
    allowFreeText: true,
    freeTextPrompt: "¿Qué dices en la rueda de prensa previa al torneo?",
    imageScene:
      "Photorealistic sports photography of the photographed man in his national team kit, celebrating passionately on a European Championship stadium pitch, huge crowd and confetti in the background, dramatic stadium lighting",
    requiresConfederation: ["UEFA"],
    minMedia: 68,
    options: [
      {
        id: "a",
        label: "Jugar cada partido a todo o nada",
        subtitle: "Asumir riesgos para liderar al equipo",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "forma",
          success: {
            text: "El equipo llega hasta el final y levantas el trofeo de la Eurocopa. Un torneo entero de tu país parado para ver esto.",
            consequences: { fama: 22, moral: 18, rel_aficion: 12 },
          },
          fail: {
            text: "La selección cae eliminada antes de lo esperado. El torneo termina con más preguntas que respuestas.",
            consequences: { fama: 5, moral: -7 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con la cabeza, priorizando no arriesgar de más",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, fama: 3 },
      },
    ],
    minWeek: 115,
  },
  {
    id: "sel-copa-america",
    category: "especial",
    priority: true,
    title: "La Copa América",
    description:
      "Llegas a la Copa América como una pieza importante de tu selección. Todo un continente pendiente del torneo, y tú en medio de él.",
    isMilestone: true,
    milestoneType: "copa_america",
    allowFreeText: true,
    freeTextPrompt: "¿Qué dices en la rueda de prensa previa al torneo?",
    imageScene:
      "Photorealistic sports photography of the photographed man in his national team kit, celebrating passionately on a Copa America stadium pitch, huge crowd and confetti in the background, dramatic stadium lighting",
    requiresConfederation: ["CONMEBOL"],
    minMedia: 68,
    options: [
      {
        id: "a",
        label: "Jugar cada partido a todo o nada",
        subtitle: "Asumir riesgos para liderar al equipo",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "forma",
          success: {
            text: "El equipo llega hasta el final y levantas el trofeo de la Copa América. Todo el continente habla de esto.",
            consequences: { fama: 22, moral: 18, rel_aficion: 12 },
          },
          fail: {
            text: "La selección cae eliminada antes de lo esperado. El torneo termina con más preguntas que respuestas.",
            consequences: { fama: 5, moral: -7 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con la cabeza, priorizando no arriesgar de más",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, fama: 3 },
      },
    ],
    minWeek: 115,
  },
  // ── RETIRO (solo modo Pro) ─────────────────────────────────────
  {
    id: "fork-retiro-pro",
    category: "especial",
    priority: true,
    title: "¿Cuándo parar?",
    description:
      "Ya no eres el mismo de los primeros años. La pregunta dejó de ser dónde jugar para pasar a ser cuánto más te queda.",
    lookEvolution:
      "Same person, distinguished older look, greying hair and beard, elegant retired athlete portrait, natural light, photorealistic, keep facial identity and skin tone unchanged",
    modes: ["pro"],
    minWeek: PRO_RETIREMENT_MIN_WEEK,
    options: [
      {
        id: "jugar_mas",
        label: "Jugar una temporada más",
        subtitle: "Exprimir un poco más la carrera",
        consequences: { forma: -3, moral: 3 },
      },
      {
        id: "retirarse",
        label: "Colgar las botas",
        subtitle: "Cerrar la etapa de jugador para siempre",
        consequences: {},
      },
    ],
  },
];
