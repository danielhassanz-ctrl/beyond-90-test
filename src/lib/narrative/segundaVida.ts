import type { GameEvent, SecondCareerRole } from "@/types/career";

function buildEntrenadorPrimerDia(club: string | null): GameEvent {
  return {
    id: "sv-ent-primer-dia",
    category: "segunda_vida",
    title: "Primer día como entrenador",
    description: `Te presentan a la plantilla del ${club ?? "club"} como cuerpo técnico. Algunos jugadores son casi tan mayores como tú cuando te retiraste.`,
    options: [
      {
        id: "a",
        label: "Ganarte el respeto por lo que fuiste",
        subtitle: "Apelas a tu carrera",
        consequences: { reputacion: 5 },
      },
      {
        id: "b",
        label: "Empezar de cero, sin apoyarte en el pasado",
        subtitle: "Más lento, más genuino",
        consequences: { reputacion: 2, patrimonio: 0 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué les dices en la primera charla?",
  };
}

const ENTRENADOR_EVENTS: GameEvent[] = [
  {
    id: "sv-ent-estrella",
    category: "segunda_vida",
    title: "Un jugador estrella cuestiona tus métodos",
    description: "El capitán del equipo no está de acuerdo con tu sistema táctico y lo dice en una entrevista.",
    options: [
      {
        id: "a",
        label: "Hablarlo en privado con firmeza",
        subtitle: "Puede funcionar o generar más ruido",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "reputacion",
          success: {
            text: "La charla funciona: el capitán da la cara por ti en la próxima rueda de prensa.",
            consequences: { reputacion: 10 },
          },
          fail: {
            text: "La relación se tensa todavía más. Los rumores de vestuario roto empiezan a circular.",
            consequences: { reputacion: -8 },
          },
        },
      },
      {
        id: "b",
        label: "Ignorarlo y seguir con tu plan",
        subtitle: "Autoridad a toda costa",
        consequences: { reputacion: -3 },
      },
    ],
  },
  {
    id: "sv-ent-directiva",
    category: "segunda_vida",
    title: "La directiva pide resultados ya",
    description: "Llevas varios partidos sin ganar y el presidente del club te lo hace saber directamente.",
    options: [
      {
        id: "a",
        label: "Pedir paciencia y tiempo",
        subtitle: "Jugada arriesgada",
        consequences: { reputacion: -2 },
      },
      {
        id: "b",
        label: "Cambiar el sistema de juego para dar un golpe de efecto",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "reputacion",
          success: {
            text: "El cambio funciona. El equipo gana con autoridad y la directiva respira.",
            consequences: { reputacion: 12 },
          },
          fail: {
            text: "El experimento sale mal. La presión sobre tu continuidad aumenta.",
            consequences: { reputacion: -10 },
          },
        },
      },
    ],
    minWeek: 5,
  },
  {
    id: "sv-ent-fichaje",
    category: "segunda_vida",
    title: "Recomiendas un fichaje",
    description: "El club te pide un nombre para reforzar el equipo en el próximo mercado.",
    options: [
      {
        id: "a",
        label: "Apostar por un juvenil de tu confianza",
        subtitle: "Riesgo con proyección",
        consequences: { patrimonio: -2000, reputacion: 3 },
      },
      {
        id: "b",
        label: "Pedir un nombre consagrado, aunque sea caro",
        subtitle: "Seguridad inmediata",
        consequences: { patrimonio: -8000, reputacion: 5 },
      },
    ],
    minWeek: 8,
  },
  {
    id: "sv-ent-oferta-otro-club",
    category: "segunda_vida",
    title: "Otro club pregunta por ti",
    description: "Tras una buena racha, un club de mayor nivel se interesa en tu perfil como entrenador.",
    isMilestone: true,
    milestoneType: "ascenso_entrenador",
    options: [
      {
        id: "a",
        label: "Escuchar la oferta",
        subtitle: "Ambición, aunque implique volver a demostrar todo",
        consequences: { reputacion: 8, patrimonio: 10000 },
      },
      {
        id: "b",
        label: "Quedarte con el proyecto actual",
        subtitle: "Lealtad",
        consequences: { reputacion: 6 },
      },
    ],
    minWeek: 12,
  },
  {
    id: "sv-ent-rueda-prensa",
    category: "segunda_vida",
    title: "La rueda de prensa se te va de las manos",
    description:
      'Un periodista insiste en preguntarte por un rumor de crisis en el vestuario que tú sabes que es cierto. Las cámaras están grabando en directo.',
    allowFreeText: true,
    freeTextPrompt: "¿Qué respondes exactamente?",
    options: [
      {
        id: "a",
        label: "Negarlo todo con firmeza",
        subtitle: "Proteges al grupo, aunque no sea del todo cierto",
        consequences: { reputacion: -2, patrimonio: 0 },
      },
      {
        id: "b",
        label: "Admitir que hay tensión, sin dar nombres",
        subtitle: "Transparencia calculada",
        consequences: { reputacion: 4 },
      },
    ],
    minWeek: 7,
  },
  {
    id: "sv-ent-motin",
    category: "segunda_vida",
    title: "Amago de motín en el vestuario",
    description:
      "Tres titulares indiscutibles se plantan ante ti: no están de acuerdo con la rotación que preparas para el partido más importante de la temporada.",
    options: [
      {
        id: "a",
        label: "Mantener tu decisión pase lo que pase",
        subtitle: "Autoridad, riesgo de motín real",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "reputacion",
          success: {
            text: "El equipo traga y sale a competir con todo. Ganan el partido y tu autoridad queda reforzada para siempre.",
            consequences: { reputacion: 14 },
          },
          fail: {
            text: "El vestuario juega desganado y sin conexión. La derrota se nota más en el ambiente que en el marcador.",
            consequences: { reputacion: -12 },
          },
        },
      },
      {
        id: "b",
        label: "Ceder y dar entrada a los tres",
        subtitle: "Paz interna, pierdes algo de autoridad",
        consequences: { reputacion: -3 },
      },
    ],
    minWeek: 16,
  },
  {
    id: "sv-ent-canterano",
    category: "segunda_vida",
    title: "Un canterano te pide una oportunidad",
    description:
      "El chico más prometedor de la cantera lleva meses entrenando a un nivel altísimo con el filial. Te pide, cara a cara, una oportunidad real en el primer equipo.",
    isMilestone: true,
    milestoneType: "canterano",
    imageScene:
      "Photorealistic photo of the photographed man wearing a tracksuit as a football coach, giving instructions from the touchline, stadium atmosphere in the background",
    options: [
      {
        id: "a",
        label: "Darle minutos ya, aunque sea un riesgo",
        subtitle: "Apuesta arriesgada por el futuro",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "reputacion",
          success: {
            text: "El chaval responde con un partidazo. La prensa empieza a hablar de él como el nuevo gran valor de la casa, y de ti como el entrenador que se atrevió.",
            consequences: { reputacion: 13, patrimonio: 4000 },
          },
          fail: {
            text: "Los nervios le pueden y el partido se le hace grande. La directiva te pregunta por qué te precipitaste.",
            consequences: { reputacion: -6 },
          },
        },
      },
      {
        id: "b",
        label: "Pedirle paciencia, todavía no está listo",
        subtitle: "Conservador",
        consequences: { reputacion: 1 },
      },
    ],
    minWeek: 18,
  },
  {
    id: "sv-ent-oferta-seleccion",
    category: "segunda_vida",
    title: "La selección nacional pregunta por ti",
    description:
      "La federación te sondea de forma discreta para hacerte cargo del banquillo de la selección absoluta tras el próximo torneo. Es la oferta más grande de tu carrera como entrenador.",
    isMilestone: true,
    milestoneType: "seleccion",
    options: [
      {
        id: "a",
        label: "Abrir la negociación",
        subtitle: "El sueño máximo del oficio",
        consequences: { reputacion: 12, patrimonio: 20000 },
      },
      {
        id: "b",
        label: "Rechazar por ahora, tu proyecto de club no está terminado",
        subtitle: "Lealtad al proceso actual",
        consequences: { reputacion: 5 },
      },
    ],
    minWeek: 20,
  },
  {
    id: "sv-ent-final-champions",
    category: "segunda_vida",
    title: "Una final de Champions League",
    description:
      "Has llevado al equipo hasta la final de la competición más importante de clubes del mundo. La previa está llena de presión, focos y una plantilla que sabe que esta noche entra en la historia o se queda a las puertas.",
    isMilestone: true,
    milestoneType: "final_champions",
    imageScene:
      "Photorealistic photo of the photographed man in a formal coaching outfit on the touchline of a packed European final, dramatic stadium lighting, intense expression",
    options: [
      {
        id: "a",
        label: "Plantear un partido valiente, ir a ganarla",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "reputacion",
          success: {
            text: "El equipo gana la Champions League bajo tus órdenes. Tu nombre queda escrito para siempre en la historia del banquillo.",
            consequences: { reputacion: 25, patrimonio: 30000 },
          },
          fail: {
            text: "La final se pierde en los últimos minutos. El equipo entero se derrumba en el césped, y tú con ellos.",
            consequences: { reputacion: -10 },
          },
        },
      },
      {
        id: "b",
        label: "Plantear un partido conservador, no perderla por dentro",
        subtitle: "Gestión del miedo",
        consequences: { reputacion: 3 },
      },
    ],
    minWeek: 20,
  },
];

const AGENTE_EVENTS: GameEvent[] = [
  {
    id: "sv-age-primer-cliente",
    category: "segunda_vida",
    title: "Tu primer cliente",
    description: "Un juvenil prometedor te pide que lo representes. Todavía no tiene nombre en el mercado.",
    options: [
      {
        id: "a",
        label: "Firmarlo",
        subtitle: "Apuesta a futuro",
        consequences: { reputacion: 4 },
      },
      {
        id: "b",
        label: "Buscar un perfil más consolidado",
        subtitle: "Menos riesgo",
        consequences: { patrimonio: -1000 },
      },
    ],
  },
  {
    id: "sv-age-negociacion",
    category: "segunda_vida",
    title: "Negocias un contrato importante",
    description: "Tienes la chance de cerrar el traspaso de tu mejor cliente a un club grande.",
    isMilestone: true,
    milestoneType: "fichaje_agente",
    options: [
      {
        id: "a",
        label: "Presionar por el máximo beneficio para ti",
        subtitle: "Codicia",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "reputacion",
          success: {
            text: "El club acepta tus condiciones. Ganas una comisión enorme y tu nombre suena en el ambiente.",
            consequences: { patrimonio: 25000, reputacion: 8 },
          },
          fail: {
            text: "El club se cansa de tu postura y la operación se cae por completo.",
            consequences: { reputacion: -10 },
          },
        },
      },
      {
        id: "b",
        label: "Cerrar rápido y en buenos términos",
        subtitle: "Menos dinero, más confianza",
        consequences: { patrimonio: 10000, reputacion: 6 },
      },
    ],
    minWeek: 4,
  },
  {
    id: "sv-age-robo-cliente",
    category: "segunda_vida",
    title: "Un colega intenta robarte un cliente",
    description: "Otro agente le ofrece a tu mejor jugador representarlo con mejores condiciones.",
    options: [
      {
        id: "a",
        label: "Igualar la oferta",
        subtitle: "-Patrimonio, +Relación",
        consequences: { patrimonio: -5000, reputacion: 5 },
      },
      {
        id: "b",
        label: "Dejarlo ir con dignidad",
        subtitle: "Pierdes al cliente",
        consequences: { reputacion: -4 },
      },
    ],
    minWeek: 6,
  },
  {
    id: "sv-age-comision",
    category: "segunda_vida",
    title: "Una comisión que genera ruido en la prensa",
    description: 'Un medio deportivo publica el porcentaje que cobraste en tu última operación y lo llama "excesivo".',
    allowFreeText: true,
    freeTextPrompt: "¿Cómo respondes públicamente?",
    options: [
      {
        id: "a",
        label: "Defender tu trabajo abiertamente",
        subtitle: "Confrontar",
        consequences: { reputacion: 3, patrimonio: 0 },
      },
      {
        id: "b",
        label: "No hacer declaraciones",
        subtitle: "Dejar que se apague",
        consequences: { reputacion: -2 },
      },
    ],
    minWeek: 9,
  },
  {
    id: "sv-age-retiro-cliente",
    category: "segunda_vida",
    title: "Tu cliente quiere retirarse antes de tiempo",
    description: "Uno de tus jugadores, todavía en su mejor nivel, te dice que está cansado y quiere dejar el fútbol.",
    options: [
      {
        id: "a",
        label: "Convencerlo de seguir un año más",
        subtitle: "Priorizas el negocio",
        consequences: { patrimonio: 5000, reputacion: -3 },
      },
      {
        id: "b",
        label: "Apoyar su decisión",
        subtitle: "Priorizas a la persona",
        consequences: { reputacion: 8 },
      },
    ],
    minWeek: 12,
  },
  {
    id: "sv-age-guerra-pujas",
    category: "segunda_vida",
    title: "Dos gigantes se pelean por tu cliente",
    description:
      "Dos de los clubes más grandes de Europa quieren a tu mejor jugador a la vez. Cada uno te ofrece condiciones distintas, y tú decides cómo jugar la negociación.",
    isMilestone: true,
    milestoneType: "puja_agente",
    options: [
      {
        id: "a",
        label: "Filtrar la puja a la prensa para presionar al alza",
        subtitle: "Jugada agresiva, puede salir cara",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "reputacion",
          success: {
            text: "La presión mediática dispara la oferta final. Cierras la comisión más grande de tu carrera.",
            consequences: { patrimonio: 45000, reputacion: 10 },
          },
          fail: {
            text: "Los dos clubes se sienten manipulados y ambos se retiran de la negociación por orgullo.",
            consequences: { reputacion: -12 },
          },
        },
      },
      {
        id: "b",
        label: "Negociar en privado con el que ofrece más garantías",
        subtitle: "Menos ruido, más seguridad",
        consequences: { patrimonio: 20000, reputacion: 6 },
      },
    ],
    minWeek: 8,
  },
  {
    id: "sv-age-escandalo-cliente",
    category: "segunda_vida",
    title: "Tu cliente monta un escándalo la noche antes de un partidazo",
    description:
      "Salen fotos de tu jugador estrella de fiesta hasta la madrugada, horas antes del partido más importante del año. Tu teléfono no para de sonar.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué comunicado preparas?",
    options: [
      {
        id: "a",
        label: "Salir a defenderlo públicamente sin fisuras",
        subtitle: "Lealtad total, riesgo de imagen",
        consequences: { reputacion: -4 },
      },
      {
        id: "b",
        label: "Distanciarte y dejar que el club gestione la sanción",
        subtitle: "Proteges tu marca personal",
        consequences: { reputacion: 2, patrimonio: -3000 },
      },
    ],
    minWeek: 10,
  },
  {
    id: "sv-age-robo-inverso",
    category: "segunda_vida",
    title: "Te ofrecen robarle un crack a otro agente",
    description:
      'Un jugador top, representado por un colega con el que tienes buena relación, te llama en secreto: "Quiero que me representes tú. Con él ya no confío." La operación es turbia, pero muy rentable.',
    options: [
      {
        id: "a",
        label: "Aceptarlo, los negocios son los negocios",
        subtitle: "+Patrimonio, quema puentes en el gremio",
        consequences: { patrimonio: 30000, reputacion: -6 },
      },
      {
        id: "b",
        label: "Rechazarlo por respeto profesional",
        subtitle: "Tu palabra vale más que esta operación",
        consequences: { reputacion: 7 },
      },
    ],
    minWeek: 13,
  },
  {
    id: "sv-age-agencia-propia",
    category: "segunda_vida",
    title: "Montas tu propia agencia",
    description:
      "Tienes suficiente cartera de clientes y suficiente nombre para dar el salto: dejar de trabajar para otros y montar tu propia agencia con tu apellido en la puerta.",
    isMilestone: true,
    milestoneType: "agencia",
    imageScene:
      "Photorealistic photo of the photographed man in a sharp suit standing in a modern sports agency office, glass walls, city skyline in the background, confident pose",
    options: [
      {
        id: "a",
        label: "Invertir fuerte en oficinas y equipo propio",
        subtitle: "-Patrimonio, +Reputación a largo plazo",
        consequences: { patrimonio: -25000, reputacion: 12 },
      },
      {
        id: "b",
        label: "Empezar pequeño, sin grandes gastos",
        subtitle: "Crecimiento lento pero seguro",
        consequences: { patrimonio: -4000, reputacion: 5 },
      },
    ],
    minWeek: 16,
  },
  {
    id: "sv-age-perla-cantera",
    category: "segunda_vida",
    title: "Una perla de cantera te elige a ti",
    description:
      'Un chaval de 16 años, la gran promesa de la cantera de uno de los grandes de España, te llama en persona: "Mi padre dice que usted fue de los buenos. Quiero que sea usted, nadie más." Todos los agentes grandes del país lo están rondando.',
    isMilestone: true,
    milestoneType: "cantera",
    imageScene:
      "Photorealistic photo of the photographed man in a sharp suit shaking hands with a young football talent in a training ground, proud and hopeful atmosphere",
    options: [
      {
        id: "a",
        label: "Ir a por él en persona, cueste lo que cueste",
        subtitle: "Apuesta a largo plazo, gran comisión futura",
        consequences: { patrimonio: -6000, reputacion: 10 },
      },
      {
        id: "b",
        label: "Dejar que decida él solo, sin presionarlo",
        subtitle: "Menos vistoso, pero honesto",
        consequences: { reputacion: 6 },
      },
    ],
    minWeek: 3,
  },
  {
    id: "sv-age-excompanero",
    category: "segunda_vida",
    title: "Un excompañero de vestuario te pide que lo representes",
    description:
      "Alguien con quien compartiste vestuario en tus últimos años como jugador te llama: está en un momento clave de su carrera y no confía en su representante actual. Confía en ti, no en un desconocido con traje caro.",
    options: [
      {
        id: "a",
        label: "Aceptarlo, la confianza mutua vale más que cualquier contrato",
        subtitle: "+Reputación, vínculo genuino",
        consequences: { reputacion: 9, patrimonio: 3000 },
      },
      {
        id: "b",
        label: "Ser sincero: tu agencia no puede darle lo que necesita ahora mismo",
        subtitle: "Honestidad por delante del negocio",
        consequences: { reputacion: 4 },
      },
    ],
    minWeek: 6,
  },
];

function buildPresidenteAsumir(club: string | null): GameEvent {
  return {
    id: "sv-pres-asumir",
    category: "segunda_vida",
    title: "Asumes la presidencia del club",
    description: `Tu nombre y tu carrera te abrieron la puerta a dirigir el ${club ?? "club"}. Los socios esperan mucho.`,
    options: [
      {
        id: "a",
        label: "Prometer un proyecto ambicioso",
        subtitle: "Expectativas altas",
        consequences: { reputacion: 6 },
      },
      {
        id: "b",
        label: "Pedir paciencia desde el primer día",
        subtitle: "Gestión realista",
        consequences: { reputacion: 2 },
      },
    ],
  };
}

const PRESIDENTE_EVENTS: GameEvent[] = [
  {
    id: "sv-pres-entrenador",
    category: "segunda_vida",
    title: "Eliges al nuevo entrenador",
    description: "El club necesita un técnico. Tienes dos perfiles sobre la mesa.",
    options: [
      {
        id: "a",
        label: "Un nombre reconocido y caro",
        subtitle: "Seguridad, cuesta patrimonio",
        consequences: { patrimonio: -15000, reputacion: 5 },
      },
      {
        id: "b",
        label: "Una apuesta joven y barata",
        subtitle: "Riesgo, ahorro",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "reputacion",
          success: {
            text: "La apuesta sale perfecta: el técnico joven revoluciona al equipo.",
            consequences: { reputacion: 12, patrimonio: 5000 },
          },
          fail: {
            text: "El experimento no funciona y los resultados no acompañan.",
            consequences: { reputacion: -8 },
          },
        },
      },
    ],
    minWeek: 3,
  },
  {
    id: "sv-pres-presupuesto",
    category: "segunda_vida",
    title: "Presupuesto ajustado: ¿fichajes o cantera?",
    description: "Las cuentas del club no dan para todo. Hay que elegir dónde invertir la próxima temporada.",
    options: [
      {
        id: "a",
        label: "Invertir fuerte en fichajes",
        subtitle: "Resultados inmediatos",
        consequences: { patrimonio: -20000, reputacion: 4 },
      },
      {
        id: "b",
        label: "Apostar por las divisiones inferiores",
        subtitle: "Proyecto a largo plazo",
        consequences: { patrimonio: -5000, reputacion: 2 },
      },
    ],
    minWeek: 6,
  },
  {
    id: "sv-pres-socios",
    category: "segunda_vida",
    title: "Los socios piden tu renuncia",
    description: "Una mala racha de resultados enciende las alarmas y un sector de los socios pide que dejes el cargo.",
    options: [
      {
        id: "a",
        label: "Dar la cara en una asamblea",
        subtitle: "Todo se define ahí",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "reputacion",
          success: {
            text: "Tu discurso convence a la mayoría. Los socios te renuevan la confianza.",
            consequences: { reputacion: 15 },
          },
          fail: {
            text: "La asamblea es hostil. Tu continuidad queda muy debilitada.",
            consequences: { reputacion: -15 },
          },
        },
      },
      {
        id: "b",
        label: "Ignorar el ruido y seguir gestionando",
        subtitle: "Perfil bajo",
        consequences: { reputacion: -5 },
      },
    ],
    minWeek: 10,
  },
  {
    id: "sv-pres-fondo",
    category: "segunda_vida",
    title: "Un fondo de inversión ofrece comprar el club",
    description: "Te ofrecen una cifra enorme por una parte mayoritaria del club que ayudaste a construir.",
    isMilestone: true,
    milestoneType: "oferta_fondo",
    options: [
      {
        id: "a",
        label: "Aceptar la oferta",
        subtitle: "+Patrimonio, pierdes el control",
        consequences: { patrimonio: 80000, reputacion: -10 },
      },
      {
        id: "b",
        label: "Rechazarla, el club no se vende",
        subtitle: "Los socios te ovacionan",
        consequences: { reputacion: 15 },
      },
    ],
    minWeek: 14,
  },
  {
    id: "sv-pres-fichaje-galactico",
    category: "segunda_vida",
    title: "La oportunidad de fichar a una estrella mundial",
    description:
      "Un agente te llama con una operación que puede cambiar la historia del club: una estrella mundial, en el último año de contrato, está dispuesta a escuchar tu oferta.",
    isMilestone: true,
    milestoneType: "fichaje_galactico",
    imageScene:
      "Photorealistic photo of the photographed man in a suit presenting a new football signing at a packed stadium press conference, flashes and fans in the background",
    options: [
      {
        id: "a",
        label: "Romper la hucha del club para ficharlo",
        subtitle: "-Patrimonio muy alto, +Reputación enorme si sale bien",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "reputacion",
          success: {
            text: "El fichaje es un éxito total: camisetas agotadas, estadio lleno cada semana. Entras en la historia del club.",
            consequences: { reputacion: 20, patrimonio: -60000 },
          },
          fail: {
            text: "El jugador nunca rinde al nivel esperado. Los socios te recuerdan el gasto en cada asamblea.",
            consequences: { reputacion: -14, patrimonio: -60000 },
          },
        },
      },
      {
        id: "b",
        label: "Declinar, es demasiado riesgo financiero",
        subtitle: "Prudencia por delante del titular",
        consequences: { reputacion: 1 },
      },
    ],
    minWeek: 17,
  },
  {
    id: "sv-pres-escandalo-directiva",
    category: "segunda_vida",
    title: "Un escándalo salpica a tu directiva",
    description:
      "La prensa publica que un miembro de tu junta directiva cobró una comisión irregular en un fichaje reciente. Los focos apuntan directamente al club que presides.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué comunicado oficial haces?",
    options: [
      {
        id: "a",
        label: "Destituirlo de inmediato y hacerlo público",
        subtitle: "Transparencia total, división interna",
        consequences: { reputacion: 9 },
      },
      {
        id: "b",
        label: "Gestionarlo puertas adentro sin hacer ruido",
        subtitle: "Menos escándalo, más sospechas",
        consequences: { reputacion: -5 },
      },
    ],
    minWeek: 18,
  },
  {
    id: "sv-pres-estadio",
    category: "segunda_vida",
    title: "El estadio necesita una reforma que no puedes aplazar",
    description:
      "Los informes técnicos son claros: sin una reforma seria, parte del estadio tendrá que cerrarse por seguridad. Es la decisión de infraestructura más cara de tu presidencia.",
    options: [
      {
        id: "a",
        label: "Acometer la reforma completa, endeudando al club",
        subtitle: "-Patrimonio alto, +Reputación a largo plazo",
        consequences: { patrimonio: -70000, reputacion: 10 },
      },
      {
        id: "b",
        label: "Hacer solo el arreglo mínimo obligatorio",
        subtitle: "Ahorras, pero queda pendiente",
        consequences: { patrimonio: -15000, reputacion: -2 },
      },
    ],
    minWeek: 19,
  },
  {
    id: "sv-pres-titulo",
    category: "segunda_vida",
    title: "El club gana un título bajo tu mandato",
    description:
      "Después de años de trabajo, el equipo levanta un título importante. Los socios celebran en las calles con tu nombre en las pancartas junto al del equipo.",
    isMilestone: true,
    milestoneType: "titulo_presidente",
    imageScene:
      "Photorealistic photo of the photographed man in a suit celebrating on a stadium balcony holding up a trophy alongside players, confetti falling, huge crowd below",
    options: [
      {
        id: "a",
        label: "Vivirlo como la culminación de tu proyecto",
        subtitle: "+Reputación",
        consequences: { reputacion: 18 },
      },
      {
        id: "b",
        label: "Usarlo para pedir más presupuesto a los socios",
        subtitle: "Aprovechar el momento con cabeza fría",
        consequences: { reputacion: 10, patrimonio: 15000 },
      },
    ],
    minWeek: 20,
  },
  {
    id: "sv-pres-politica-galactica",
    category: "segunda_vida",
    title: "Un galáctico cada verano",
    description:
      "Tu director deportivo te lo dice sin rodeos: los socios ya esperan un fichaje de portada cada verano, tenga o no sentido táctico. Es la política de club que tú mismo empezaste a construir.",
    options: [
      {
        id: "a",
        label: "Mantener la política, un nombre enorme cada mercado",
        subtitle: "-Patrimonio muy alto, +Reputación mediática",
        consequences: { patrimonio: -50000, reputacion: 9 },
      },
      {
        id: "b",
        label: "Frenarla, el vestuario necesita equilibrio, no titulares",
        subtitle: "Menos ruido, más criterio deportivo",
        consequences: { reputacion: 5 },
      },
    ],
    minWeek: 9,
  },
  {
    id: "sv-pres-inversor-externo",
    category: "segunda_vida",
    title: "Un magnate quiere financiar el club sin comprarlo",
    description:
      "Un empresario con una fortuna descomunal te propone algo distinto a vender: inyectar dinero ilimitado en fichajes durante años, a cambio de tener la última palabra en cada operación importante.",
    isMilestone: true,
    milestoneType: "inversor",
    options: [
      {
        id: "a",
        label: "Aceptar, el club nunca volverá a tener límite de presupuesto",
        subtitle: "+Patrimonio enorme, cedes poder de decisión",
        consequences: { patrimonio: 100000, reputacion: -8 },
      },
      {
        id: "b",
        label: "Rechazarlo, las decisiones del club se quedan en el club",
        subtitle: "Menos dinero, control total",
        consequences: { reputacion: 12 },
      },
    ],
    minWeek: 11,
  },
  {
    id: "sv-pres-asamblea-socios",
    category: "segunda_vida",
    title: "Una candidatura rival te reta en la asamblea",
    description:
      "Un grupo de socios descontentos presenta una candidatura alternativa contra ti, prometiendo un proyecto deportivo distinto. La votación se acerca y tienes que salir a defender tu gestión en público.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué prometes en tu discurso de campaña?",
    options: [
      {
        id: "a",
        label: "Prometer gasto ambicioso para ganar la votación",
        subtitle: "Arriesgado si luego no se puede cumplir",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "reputacion",
          success: {
            text: "Ganas la asamblea con claridad. Los socios te dan un nuevo mandato y máxima confianza.",
            consequences: { reputacion: 16 },
          },
          fail: {
            text: "La candidatura rival gana terreno y tu gestión queda muy debilitada de cara al futuro.",
            consequences: { reputacion: -14 },
          },
        },
      },
      {
        id: "b",
        label: "Defender tu gestión con datos, sin grandes promesas",
        subtitle: "Menos vistoso, más honesto",
        consequences: { reputacion: 7 },
      },
    ],
    minWeek: 13,
  },
];

export function getSecondLifeEvents(role: SecondCareerRole, club: string | null): GameEvent[] {
  if (role === "entrenador") return [buildEntrenadorPrimerDia(club), ...ENTRENADOR_EVENTS];
  if (role === "agente") return AGENTE_EVENTS;
  return [buildPresidenteAsumir(club), ...PRESIDENTE_EVENTS];
}
