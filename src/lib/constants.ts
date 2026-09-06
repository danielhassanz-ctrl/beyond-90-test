/**
 * Añade el enlace de vuelta al juego al final de un texto de compartir.
 * Sin esto, la persona que recibe la carta no tiene dónde ir a jugar — sin
 * NEXT_PUBLIC_APP_URL configurado (todavía no hay despliegue público) se
 * omite el enlace en vez de mandar uno roto.
 */
export function withShareLink(text: string): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  return url ? `${text}\n${url}` : text;
}

/**
 * Clubes modestos que puede ofrecer el representante en el primer evento de
 * la carrera. Se sortean 3 de esta lista cada vez (ver pickStartingClubOffers)
 * para que dos carreras nuevas no arranquen siempre con las mismas opciones.
 */
export const STARTING_CLUB_OFFERS = [
  {
    club: "Real Betis",
    pitch: "Afición pasional y con recorrido, pero mucha competencia en tu posición.",
  },
  {
    club: "Villarreal CF",
    pitch: "Proyecto formativo y paciente: te dan tiempo, aunque el foco mediático es menor.",
  },
  {
    club: "Málaga CF",
    pitch: "Menos presión y minutos casi asegurados, a cambio de menos escaparate.",
  },
  {
    club: "Real Valladolid",
    pitch: "Un vestuario joven y hambriento, en una ciudad donde el fútbol lo es todo.",
  },
  {
    club: "Cádiz CF",
    pitch: "Un estadio pequeño que aprieta como uno grande, y una plantilla corta.",
  },
  {
    club: "Sporting de Gijón",
    pitch: "Cantera con mucha historia, pero también mucha exigencia desde el primer día.",
  },
  {
    club: "Levante UD",
    pitch: "Proyecto discreto de la capital del Turia, lejos del foco mediático de Madrid.",
  },
  {
    club: "Rayo Vallecano",
    pitch: "Un barrio entero pendiente de ti, con un presupuesto que no da para lujos.",
  },
  {
    club: "Real Zaragoza",
    pitch: "Un club histórico venido a menos, con hambre de volver a lo grande.",
  },
  {
    club: "UD Almería",
    pitch: "Proyecto joven en plena costa, con dueños ambiciosos detrás.",
  },
  {
    club: "Real Oviedo",
    pitch: "Ciudad pequeña, afición entregada, cero anonimato posible.",
  },
] as const;

/**
 * Cantera de un grande: posibilidad rara (no garantizada) de arrancar la
 * carrera en la Fábrica del Real Madrid o La Masia del Barça en vez de un
 * club modesto. Mucho más prestigio desde el minuto uno, pero también
 * mucha más competencia por hacerse un hueco.
 */
const GIANT_ACADEMY_OFFERS = [
  {
    club: "Real Madrid",
    pitch: "La Fábrica te abre la puerta, pero la competencia es brutal y solo unos pocos suben al primer equipo.",
  },
  {
    club: "FC Barcelona",
    pitch: "La Masia, la cantera con más historia de Europa, exige nivel desde el primer entrenamiento.",
  },
] as const;

/**
 * Sortea 3 clubes para las primeras ofertas. Casi siempre son 3 modestos de
 * STARTING_CLUB_OFFERS, pero hay una posibilidad pequeña (15%) de que uno
 * de los tres sea la cantera de un grande — no garantizado, para que siga
 * siendo una sorpresa cuando toca.
 */
export function pickStartingClubOffers(): { club: string; pitch: string }[] {
  const shuffled = [...STARTING_CLUB_OFFERS].sort(() => Math.random() - 0.5);
  const picks: { club: string; pitch: string }[] = shuffled.slice(0, 3);

  if (Math.random() < 0.15) {
    const giant = GIANT_ACADEMY_OFFERS[Math.floor(Math.random() * GIANT_ACADEMY_OFFERS.length)];
    const slot = Math.floor(Math.random() * picks.length);
    picks[slot] = giant;
  }

  return picks;
}

/** Pool de agentes ficticios para variar quién puede representarte al arrancar la carrera. */
export const STARTING_AGENTS = [
  { name: "Álvaro Montes", article: "un agente conocido", pitch: "Contactos y experiencia en la cantera, a cambio de una comisión", fee: 500 },
  { name: "Nuria Ibáñez", article: "una agente conocida", pitch: "Agente joven y ambiciosa que quiere hacerse un nombre contigo", fee: 300 },
  { name: "Fran Cortés", article: "un agente conocido", pitch: "Veterano del gremio con una cartera de jugadores consolidados", fee: 700 },
  { name: "Marina Roldán", article: "una agente conocida", pitch: "Especialista en jóvenes promesas, fama de negociar duro", fee: 450 },
] as const;

export const NO_CLUB_YET = "Agente libre";

export const POSITIONS = ["Portero", "Defensa", "Centrocampista", "Delantero"] as const;

export const FEET = ["Derecho", "Izquierdo"] as const;

export const PERSONALITIES = [
  "Trabajador",
  "Carismático",
  "Rebelde",
  "Frío y calculador",
  "Ambicioso",
  "Tranquilo",
  "Estrella",
  "Humilde",
  "Perfeccionista",
  "Bromista",
  "Leal",
  "Impulsivo",
] as const;

export const MODE_OPTIONS = [
  { value: "express", label: "Carrera corta", hint: "~15 eventos" },
  { value: "standard", label: "Carrera media", hint: "~25 eventos" },
  { value: "pro", label: "Carrera larga", hint: "~35 eventos" },
] as const;

/**
 * Clubes que puede coger o comprar el jugador al empezar su segunda vida
 * como presidente. "propio" reutiliza el club en el que se retiró (gratis,
 * carga emocional); el resto cuestan patrimonio y dan opción a un proyecto
 * distinto, más ambicioso cuanto más caro.
 */
export const PRESIDENT_CLUB_OPTIONS = [
  {
    value: "propio",
    label: "Coger las riendas de tu club de siempre",
    description: "El club en el que te retiraste. Los socios confían en tu nombre: no cuesta nada.",
    cost: 0,
  },
  {
    value: "modesto",
    label: "Rescatar un club histórico en apuros",
    club: "Real Oviedo",
    description: "Un equipo con solera a punto de desaparecer. Barato, entrañable, mucho trabajo por delante.",
    cost: 8000,
  },
  {
    value: "ambicioso",
    label: "Comprar un proyecto con gran afición mal gestionado",
    club: "Deportivo de La Coruña",
    description: "Estadio lleno, cuentas rotas. Si lo enderezas, te conviertes en leyenda del club.",
    cost: 40000,
  },
  {
    value: "extranjero",
    label: "Lanzarte a un proyecto en el extranjero",
    club: "US Lecce",
    description: "Un club fuera de España busca un dueño con visión internacional y bolsillo profundo.",
    cost: 90000,
  },
] as const;

/**
 * Banquillos que le ofrecen al jugador al empezar su segunda vida como
 * entrenador. Son ofertas de trabajo, no compras: no cuestan patrimonio,
 * pero a más nivel del club, más presión desde el primer día.
 */
export const COACH_CLUB_OPTIONS = [
  {
    value: "filial",
    label: "Empezar en el filial de tu último club",
    description: "Poca presión, mucho margen para aprender el oficio antes de dar el salto.",
  },
  {
    value: "modesto",
    label: "Coger un proyecto modesto y con paciencia",
    club: "Villarreal CF",
    description: "Plantilla corta, presupuesto ajustado. Cada punto que sumes vale el doble.",
  },
  {
    value: "liga",
    label: "Dirigir un histórico de Primera con afición exigente",
    club: "Real Betis",
    description: "Un vestuario asequible en un club con historia de sobra. Cualquier título sabe a gloria.",
  },
  {
    value: "europeo",
    label: "Coger galones en Europa con una plantilla cara y mal gestionada",
    club: "Sevilla FC",
    description: "Talento de sobra, vestuario roto. Si lo ordenas, tu nombre suena en toda Europa.",
  },
  {
    value: "grande",
    label: "Sentarte en el banquillo de un grande",
    club: "Atlético de Madrid",
    description: "Presión máxima desde el primer entrenamiento. Ganar es la única opción aceptada.",
  },
] as const;

/**
 * Especialización con la que arranca la segunda vida como agente. No tiene
 * coste ni club asociado: es puro enfoque de carrera, y queda guardado en
 * flags para que la IA lo tenga en cuenta en los eventos siguientes.
 */
export const AGENT_SPECIALTY_OPTIONS = [
  {
    value: "jovenes",
    label: "Especializarte en jóvenes promesas de cantera",
    description: "Menos dinero al principio, pero construyes una cartera a largo plazo.",
  },
  {
    value: "estrellas",
    label: "Ir a por estrellas ya consagradas",
    description: "Comisiones enormes, pero competir por ellas contra agentes con más contactos.",
  },
  {
    value: "patrocinios",
    label: "Centrarte en patrocinios, no solo en traspasos",
    description: "Menos volatilidad, ingresos más constantes fuera del mercado de fichajes.",
  },
] as const;

const REST_RIVALS = [
  "Real Betis Deportivo",
  "Cádiz CF",
  "Real Valladolid",
  "Sporting de Gijón",
  "Levante UD",
  "UD Almería",
  "Real Oviedo",
  "CD San Fernando",
  "Atlético Sanluqueño",
];

const MID_RIVALS = [
  "Sevilla FC",
  "Villarreal CF",
  "Real Zaragoza",
  "Rayo Vallecano",
  "Málaga CF",
  "Deportivo de La Coruña",
  "Real Sociedad",
  "Athletic Club",
];

const ELITE_RIVALS = [
  "Real Madrid",
  "FC Barcelona",
  "Atlético de Madrid",
  "Liverpool FC",
  "Manchester City",
  "Borussia Dortmund",
  "Atalanta",
  "Bayern de Múnich",
];

const REST_COMPETITIONS = [
  "un partido del filial en Segunda RFEF",
  "un amistoso de pretemporada",
  "un partido de la Copa Federación",
  "un duelo de la Youth League contra el filial rival",
];

const MID_COMPETITIONS = [
  "una jornada de Liga",
  "un partido de la Copa del Rey",
  "una jornada de mitad de tabla que no perdona errores",
];

const ELITE_COMPETITIONS = [
  "una jornada de Liga con el título en juego",
  "un partido de la Champions League",
  "una eliminatoria de Copa a partido único",
  "un derbi que paraliza a toda la ciudad",
];

const STADIUM_NOTES = [
  "con el estadio a rebosar",
  "con las gradas medio vacías por la hora del partido",
  "bajo una lluvia que no da tregua",
  "con un calor húmedo que pesa en las piernas",
  "con el ambiente más tenso de lo habitual tras los últimos resultados",
  "con cientos de aficionados rivales haciéndose notar en la grada visitante",
];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Contexto real para cualquier escena de partido que no lo traiga ya de
 * fábrica (un evento escrito a mano no sabe, en el momento de escribirlo,
 * contra quién vas a jugar): rival, competición y ambiente, escalados a
 * la media del jugador para que un canterano de 16 años no aparezca de
 * repente jugando una final de Champions.
 */
export function buildMatchContext(club: string, media: number): { rival: string; competition: string; stadium: string } {
  const tier = media < 55 ? "rest" : media < 78 ? "mid" : "elite";
  const rivalPool = tier === "rest" ? REST_RIVALS : tier === "mid" ? MID_RIVALS : ELITE_RIVALS;
  const competitionPool = tier === "rest" ? REST_COMPETITIONS : tier === "mid" ? MID_COMPETITIONS : ELITE_COMPETITIONS;

  const candidates = rivalPool.filter((r) => r !== club);
  return {
    rival: pick(candidates.length > 0 ? candidates : rivalPool),
    competition: pick(competitionPool),
    stadium: pick(STADIUM_NOTES),
  };
}
