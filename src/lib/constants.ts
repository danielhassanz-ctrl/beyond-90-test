/**
 * URL pública del juego, para que cualquier tarjeta compartida lleve un
 * sitio real al que ir a jugar. NEXT_PUBLIC_APP_URL requiere configurarlo
 * a mano tras desplegar — algo fácil de olvidar, y sin ello ANTES se
 * omitía el enlace por completo. Vercel ya inyecta automáticamente, sin
 * configuración ninguna, el dominio de producción del proyecto
 * (VERCEL_PROJECT_PRODUCTION_URL) y el de este despliegue concreto
 * (VERCEL_URL) — se usan como red de seguridad antes de rendirse y no
 * mandar enlace. Ninguna de las dos trae el prefijo "https://".
 */
export function getAppUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercelHost ? `https://${vercelHost}` : null;
}

/** Igual que getAppUrl(), pero sin protocolo ni barra final — para imprimir en un pie de foto o una tarjeta, donde una URL completa con "https://" queda raro. */
export function getAppUrlLine(): string | null {
  const url = getAppUrl();
  return url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
}

/**
 * Añade el enlace de vuelta al juego al final de un texto de compartir.
 * Sin URL disponible (ni configurada ni inyectada por la plataforma), se
 * omite el enlace en vez de mandar uno roto.
 */
export function withShareLink(text: string): string {
  const url = getAppUrl();
  return url ? `${text}\n${url}` : text;
}

/**
 * Clubes modestos que puede ofrecer el representante en el primer evento de
 * la carrera. Se sortean 3 de esta lista cada vez (ver pickStartingClubOffers)
 * para que dos carreras nuevas no arranquen siempre con las mismas opciones.
 */
/**
 * El nivel (1-5) y el desglose desarrollo/competencia/minutos/riesgo
 * inspiran las tarjetas de club de un prototipo de referencia que el
 * usuario pidió replicar — más informativo que una sola frase al elegir
 * algo tan importante como el primer club de la carrera.
 */
export const STARTING_CLUB_OFFERS = [
  {
    club: "Real Betis",
    pitch: "Afición pasional y con recorrido, pero mucha competencia en tu posición.",
    nivel: 4,
    desarrollo: "Cantera con buena formación técnica, aunque no es la más laureada del país.",
    competencia: "Alta — el club ya trae gente de fuera para tu demarcación.",
    minutos: "Limitados al principio; el filial es el camino más realista.",
    riesgo: "Bajo. Club estable, con proyecto consolidado en Primera.",
  },
  {
    club: "Villarreal CF",
    pitch: "Proyecto formativo y paciente: te dan tiempo, aunque el foco mediático es menor.",
    nivel: 4,
    desarrollo: "Una de las mejores canteras de España, foco total en la formación.",
    competencia: "Alta — el filial amarillo produce jugadores cada año.",
    minutos: "Escasos al inicio, pero el camino al primer equipo existe de verdad.",
    riesgo: "Bajo. Proyecto estable y paciente, poco dado a decisiones bruscas.",
  },
  {
    club: "Málaga CF",
    pitch: "Menos presión y minutos casi asegurados, a cambio de menos escaparate.",
    nivel: 2,
    desarrollo: "Trabajo diario correcto, sin grandes lujos ni presión añadida.",
    competencia: "Baja — pocos canteranos por delante en tu puesto.",
    minutos: "Altos y tempranos: el club apuesta claramente por la casa.",
    riesgo: "Medio. Historia reciente inestable a nivel económico.",
  },
  {
    club: "Real Valladolid",
    pitch: "Un vestuario joven y hambriento, en una ciudad donde el fútbol lo es todo.",
    nivel: 3,
    desarrollo: "Formación sólida, con un primer equipo que sí mira a la cantera.",
    competencia: "Media. Hay hueco real si rindes desde ya.",
    minutos: "Progresivos, sin prisa pero sin freno.",
    riesgo: "Medio. El vaivén entre categorías afecta al proyecto deportivo.",
  },
  {
    club: "Cádiz CF",
    pitch: "Un estadio pequeño que aprieta como uno grande, y una plantilla corta.",
    nivel: 2,
    desarrollo: "Plantilla corta: aprendizaje acelerado por pura necesidad.",
    competencia: "Baja. Pocas alternativas reales para tu posición.",
    minutos: "Altos, casi garantizados si respondes en pretemporada.",
    riesgo: "Alto. Presupuesto ajustado, la permanencia nunca está asegurada.",
  },
  {
    club: "Sporting de Gijón",
    pitch: "Cantera con mucha historia, pero también mucha exigencia desde el primer día.",
    nivel: 3,
    desarrollo: "Cantera histórica, exigente desde el primer entrenamiento.",
    competencia: "Media-alta. La cultura del club pide nivel constante.",
    minutos: "Hay que ganárselos: aquí no se regala nada.",
    riesgo: "Medio. Fuera de Primera, con presión de la afición por volver.",
  },
  {
    club: "Levante UD",
    pitch: "Proyecto discreto de la capital del Turia, lejos del foco mediático de Madrid.",
    nivel: 2,
    desarrollo: "Trabajo discreto, sin la exposición mediática de los grandes.",
    competencia: "Baja-media. Hay margen real para hacerte un hueco.",
    minutos: "Razonables, con oportunidades reales a corto plazo.",
    riesgo: "Medio. Proyecto modesto, sujeto a vaivenes de categoría.",
  },
  {
    club: "Rayo Vallecano",
    pitch: "Un barrio entero pendiente de ti, con un presupuesto que no da para lujos.",
    nivel: 3,
    desarrollo: "Identidad de juego muy marcada: aprendes un estilo concreto de verdad.",
    competencia: "Media. Depende de encajar en el sistema del entrenador.",
    minutos: "Ligados a lo bien que encajes táctica y físicamente.",
    riesgo: "Medio. Presupuesto corto, el barrio exige carácter cada domingo.",
  },
  {
    club: "Real Zaragoza",
    pitch: "Un club histórico venido a menos, con hambre de volver a lo grande.",
    nivel: 2,
    desarrollo: "Cantera con historia, aunque con recursos limitados hoy.",
    competencia: "Baja. El primer equipo necesita gente de la casa.",
    minutos: "Altos — pocas alternativas mejores en tu posición.",
    riesgo: "Alto. Inestabilidad institucional y económica de fondo.",
  },
  {
    club: "UD Almería",
    pitch: "Proyecto joven en plena costa, con dueños ambiciosos detrás.",
    nivel: 3,
    desarrollo: "Proyecto joven con inversión real detrás, en plena construcción.",
    competencia: "Media. Todavía no está todo decidido en la plantilla.",
    minutos: "Buenos si convences pronto al cuerpo técnico.",
    riesgo: "Medio. Proyecto ambicioso pero todavía sin recorrido largo.",
  },
  {
    club: "Real Oviedo",
    pitch: "Ciudad pequeña, afición entregada, cero anonimato posible.",
    nivel: 2,
    desarrollo: "Formación práctica: pocos analistas, muchos partidos y muchos golpes.",
    competencia: "Media. Compites con canteranos formados, pero hay hueco real.",
    minutos: "Progresivos y bien medidos. Nada regalado, nada quemado.",
    riesgo: "Medio. Club inestable: un cambio de dueño lo altera todo.",
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
    nivel: 5,
    desarrollo: "La Fábrica, cantera de referencia mundial en formación de talento.",
    competencia: "Brutal. Los mejores canteranos del país compiten contigo.",
    minutos: "Casi nulos al principio; la cesión es el camino habitual.",
    riesgo: "Bajo económicamente, altísimo en presión y exposición mediática.",
  },
  {
    club: "FC Barcelona",
    pitch: "La Masia, la cantera con más historia de Europa, exige nivel desde el primer entrenamiento.",
    nivel: 5,
    desarrollo: "La Masia, la cantera con más historia y prestigio de Europa.",
    competencia: "Brutal. Talento internacional compitiendo por muy pocos sitios.",
    minutos: "Mínimos: muy pocos canteranos suben directos al primer equipo.",
    riesgo: "Bajo económicamente, altísimo en presión mediática constante.",
  },
] as const;

/**
 * Sortea 3 clubes para las primeras ofertas. Casi siempre son 3 modestos de
 * STARTING_CLUB_OFFERS, pero hay una posibilidad pequeña (15%) de que uno
 * de los tres sea la cantera de un grande — no garantizado, para que siga
 * siendo una sorpresa cuando toca.
 */
export type ClubOffer = (typeof STARTING_CLUB_OFFERS)[number] | (typeof GIANT_ACADEMY_OFFERS)[number];

export function pickStartingClubOffers(): ClubOffer[] {
  const shuffled = [...STARTING_CLUB_OFFERS].sort(() => Math.random() - 0.5);
  const picks: ClubOffer[] = shuffled.slice(0, 3);

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

// El hint mostraba un TOTAL de la carrera entera ("~35 eventos" en Pro)
// que no tenía relación real con lo que de verdad pasaba jugando (varios
// cientos, ver nextWeekGap en engine.ts) — mejor decir la densidad por
// temporada, que es un número que el jugador puede sentir de verdad
// turno a turno, en vez de un total abstracto (y enorme) de toda la carrera.
export const MODE_OPTIONS = [
  {
    value: "express",
    label: "Carrera corta",
    hint: "10-14 eventos/temporada",
    description: "Vive los grandes giros de una carrera sin alargar los capítulos secundarios.",
  },
  {
    value: "standard",
    label: "Carrera media",
    hint: "14-19 eventos/temporada",
    description: "Equilibrio entre fútbol, vestuario, vida personal y mercado de fichajes.",
  },
  {
    value: "pro",
    label: "Carrera larga",
    hint: "20-25 eventos/temporada",
    description: "Una carrera profunda, con relaciones, vida y decisiones económicas de peso.",
  },
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
