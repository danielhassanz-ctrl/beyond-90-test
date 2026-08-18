import type { ClubInfo, MatchContext, Slot, Stage } from "./types";

/* =========================================================================
 * BANCO DE CLUBES REALES (beta: España).
 * Fuente única de verdad de nombre, ciudad, estadio, rivalidades y nivel.
 * ========================================================================= */

export type Region =
  | "andalucia"
  | "madrid"
  | "levante"
  | "norte"
  | "cataluna"
  | "noroeste"
  | "centro"
  | "islas";

export interface ClubDef {
  id: string;
  name: string;
  short: string;
  city: string;
  stadium: string;
  colors: string;
  region: Region;
  /** 1 = Primera, 2 = Segunda */
  tier: 1 | 2;
  /** 1-5 */
  prestige: number;
  /** 1-5 calidad formativa */
  dev: number;
  /** -3..3 facilidad para tener minutos jóvenes */
  minutes: number;
}

export const CLUB_POOL: ClubDef[] = [
  // ---------------- Primera ----------------
  { id: "real-madrid", name: "Real Madrid", short: "Real Madrid", city: "Madrid", stadium: "Santiago Bernabéu", colors: "Blanco", region: "madrid", tier: 1, prestige: 5, dev: 5, minutes: -3 },
  { id: "barcelona", name: "FC Barcelona", short: "Barcelona", city: "Barcelona", stadium: "Spotify Camp Nou", colors: "Blaugrana", region: "cataluna", tier: 1, prestige: 5, dev: 5, minutes: -2 },
  { id: "atletico", name: "Atlético de Madrid", short: "Atlético", city: "Madrid", stadium: "Riyadh Air Metropolitano", colors: "Rojiblanco", region: "madrid", tier: 1, prestige: 5, dev: 4, minutes: -3 },
  { id: "athletic", name: "Athletic Club", short: "Athletic", city: "Bilbao", stadium: "San Mamés", colors: "Rojiblanco", region: "norte", tier: 1, prestige: 4, dev: 5, minutes: 1 },
  { id: "real-sociedad", name: "Real Sociedad", short: "Real Sociedad", city: "San Sebastián", stadium: "Reale Arena", colors: "Txuri-urdin", region: "norte", tier: 1, prestige: 4, dev: 5, minutes: 1 },
  { id: "betis", name: "Real Betis", short: "Betis", city: "Sevilla", stadium: "Benito Villamarín", colors: "Verdiblanco", region: "andalucia", tier: 1, prestige: 4, dev: 4, minutes: -1 },
  { id: "sevilla", name: "Sevilla FC", short: "Sevilla", city: "Sevilla", stadium: "Ramón Sánchez-Pizjuán", colors: "Blanquirrojo", region: "andalucia", tier: 1, prestige: 4, dev: 4, minutes: -2 },
  { id: "villarreal", name: "Villarreal CF", short: "Villarreal", city: "Vila-real", stadium: "Estadio de la Cerámica", colors: "Amarillo", region: "levante", tier: 1, prestige: 4, dev: 5, minutes: 0 },
  { id: "valencia", name: "Valencia CF", short: "Valencia", city: "Valencia", stadium: "Mestalla", colors: "Blanquinegro", region: "levante", tier: 1, prestige: 4, dev: 5, minutes: 1 },
  { id: "celta", name: "Celta de Vigo", short: "Celta", city: "Vigo", stadium: "Balaídos", colors: "Celeste", region: "noroeste", tier: 1, prestige: 3, dev: 4, minutes: 2 },
  { id: "osasuna", name: "CA Osasuna", short: "Osasuna", city: "Pamplona", stadium: "El Sadar", colors: "Rojillo", region: "norte", tier: 1, prestige: 3, dev: 4, minutes: 2 },
  { id: "rayo", name: "Rayo Vallecano", short: "Rayo", city: "Madrid", stadium: "Campo de Vallecas", colors: "Franjirrojo", region: "madrid", tier: 1, prestige: 3, dev: 3, minutes: 2 },
  { id: "getafe", name: "Getafe CF", short: "Getafe", city: "Getafe", stadium: "Coliseum", colors: "Azulón", region: "madrid", tier: 1, prestige: 3, dev: 2, minutes: 1 },
  { id: "espanyol", name: "RCD Espanyol", short: "Espanyol", city: "Barcelona", stadium: "RCDE Stadium", colors: "Blanquiazul", region: "cataluna", tier: 1, prestige: 3, dev: 4, minutes: 1 },
  { id: "girona", name: "Girona FC", short: "Girona", city: "Girona", stadium: "Montilivi", colors: "Rojiblanco", region: "cataluna", tier: 1, prestige: 3, dev: 3, minutes: 1 },
  { id: "alaves", name: "Deportivo Alavés", short: "Alavés", city: "Vitoria", stadium: "Mendizorroza", colors: "Albiazul", region: "norte", tier: 1, prestige: 3, dev: 3, minutes: 2 },
  { id: "mallorca", name: "RCD Mallorca", short: "Mallorca", city: "Palma", stadium: "Son Moix", colors: "Bermellón", region: "islas", tier: 1, prestige: 3, dev: 3, minutes: 2 },
  { id: "las-palmas", name: "UD Las Palmas", short: "Las Palmas", city: "Las Palmas", stadium: "Gran Canaria", colors: "Amarillo", region: "islas", tier: 1, prestige: 3, dev: 4, minutes: 3 },
  { id: "valladolid", name: "Real Valladolid", short: "Valladolid", city: "Valladolid", stadium: "José Zorrilla", colors: "Violeta", region: "centro", tier: 1, prestige: 3, dev: 3, minutes: 2 },
  { id: "leganes", name: "CD Leganés", short: "Leganés", city: "Leganés", stadium: "Butarque", colors: "Pepinero", region: "madrid", tier: 1, prestige: 2, dev: 2, minutes: 3 },

  // ---------------- Segunda ----------------
  { id: "deportivo", name: "RC Deportivo", short: "Dépor", city: "A Coruña", stadium: "Riazor", colors: "Blanquiazul", region: "noroeste", tier: 2, prestige: 3, dev: 4, minutes: 2 },
  { id: "sporting", name: "Sporting de Gijón", short: "Sporting", city: "Gijón", stadium: "El Molinón", colors: "Rojiblanco", region: "norte", tier: 2, prestige: 3, dev: 5, minutes: 3 },
  { id: "oviedo", name: "Real Oviedo", short: "Oviedo", city: "Oviedo", stadium: "Carlos Tartiere", colors: "Azul", region: "norte", tier: 2, prestige: 3, dev: 3, minutes: 2 },
  { id: "zaragoza", name: "Real Zaragoza", short: "Zaragoza", city: "Zaragoza", stadium: "La Romareda", colors: "Blanquiazul", region: "centro", tier: 2, prestige: 3, dev: 4, minutes: 3 },
  { id: "racing", name: "Racing de Santander", short: "Racing", city: "Santander", stadium: "El Sardinero", colors: "Verdiblanco", region: "norte", tier: 2, prestige: 3, dev: 4, minutes: 3 },
  { id: "malaga", name: "Málaga CF", short: "Málaga", city: "Málaga", stadium: "La Rosaleda", colors: "Blanquiazul", region: "andalucia", tier: 2, prestige: 3, dev: 3, minutes: 3 },
  { id: "granada", name: "Granada CF", short: "Granada", city: "Granada", stadium: "Los Cármenes", colors: "Rojiblanco", region: "andalucia", tier: 2, prestige: 3, dev: 3, minutes: 2 },
  { id: "cadiz", name: "Cádiz CF", short: "Cádiz", city: "Cádiz", stadium: "Nuevo Mirandilla", colors: "Amarillo", region: "andalucia", tier: 2, prestige: 3, dev: 3, minutes: 2 },
  { id: "almeria", name: "UD Almería", short: "Almería", city: "Almería", stadium: "Power Horse Stadium", colors: "Rojiblanco", region: "andalucia", tier: 2, prestige: 3, dev: 4, minutes: 3 },
  { id: "cordoba", name: "Córdoba CF", short: "Córdoba", city: "Córdoba", stadium: "El Arcángel", colors: "Blanquiverde", region: "andalucia", tier: 2, prestige: 2, dev: 3, minutes: 3 },
  { id: "huesca", name: "SD Huesca", short: "Huesca", city: "Huesca", stadium: "El Alcoraz", colors: "Azulgrana", region: "centro", tier: 2, prestige: 2, dev: 3, minutes: 3 },
  { id: "elche", name: "Elche CF", short: "Elche", city: "Elche", stadium: "Martínez Valero", colors: "Franjiverde", region: "levante", tier: 2, prestige: 2, dev: 3, minutes: 3 },
  { id: "levante", name: "Levante UD", short: "Levante", city: "Valencia", stadium: "Ciutat de València", colors: "Granota", region: "levante", tier: 2, prestige: 3, dev: 4, minutes: 2 },
  { id: "eibar", name: "SD Eibar", short: "Eibar", city: "Eibar", stadium: "Ipurua", colors: "Armero", region: "norte", tier: 2, prestige: 2, dev: 4, minutes: 3 },
  { id: "mirandes", name: "CD Mirandés", short: "Mirandés", city: "Miranda de Ebro", stadium: "Anduva", colors: "Rojinegro", region: "norte", tier: 2, prestige: 2, dev: 4, minutes: 3 },
  { id: "burgos", name: "Burgos CF", short: "Burgos", city: "Burgos", stadium: "El Plantío", colors: "Blanquinegro", region: "centro", tier: 2, prestige: 2, dev: 2, minutes: 3 },
  { id: "albacete", name: "Albacete Balompié", short: "Albacete", city: "Albacete", stadium: "Carlos Belmonte", colors: "Blanco", region: "centro", tier: 2, prestige: 2, dev: 3, minutes: 3 },
  { id: "castellon", name: "CD Castellón", short: "Castellón", city: "Castellón", stadium: "Castalia", colors: "Albinegro", region: "levante", tier: 2, prestige: 2, dev: 3, minutes: 3 },
  { id: "tenerife", name: "CD Tenerife", short: "Tenerife", city: "Santa Cruz", stadium: "Heliodoro Rodríguez", colors: "Blanquiazul", region: "islas", tier: 2, prestige: 2, dev: 3, minutes: 3 },
  { id: "cartagena", name: "FC Cartagena", short: "Cartagena", city: "Cartagena", stadium: "Cartagonova", colors: "Albinegro", region: "levante", tier: 2, prestige: 2, dev: 2, minutes: 3 },
  { id: "sabadell", name: "CE Sabadell", short: "Sabadell", city: "Sabadell", stadium: "Nova Creu Alta", colors: "Arlequinado", region: "cataluna", tier: 2, prestige: 2, dev: 3, minutes: 3 },
  { id: "andorra", name: "FC Andorra", short: "Andorra", city: "Andorra la Vella", stadium: "Estadi Nacional", colors: "Tricolor", region: "cataluna", tier: 2, prestige: 2, dev: 3, minutes: 3 },
];

/** Rivalidades reales (derbis). */
const DERBIES: Record<string, string[]> = {
  betis: ["sevilla"],
  sevilla: ["betis"],
  "real-madrid": ["atletico", "barcelona"],
  atletico: ["real-madrid"],
  barcelona: ["espanyol", "real-madrid"],
  espanyol: ["barcelona"],
  athletic: ["real-sociedad", "alaves"],
  "real-sociedad": ["athletic", "osasuna"],
  osasuna: ["real-sociedad", "zaragoza"],
  valencia: ["levante", "villarreal"],
  levante: ["valencia"],
  villarreal: ["valencia", "castellon"],
  castellon: ["villarreal"],
  malaga: ["granada", "cadiz"],
  granada: ["malaga", "cordoba"],
  cadiz: ["malaga", "sevilla"],
  cordoba: ["granada", "sevilla"],
  deportivo: ["celta", "sporting"],
  celta: ["deportivo"],
  sporting: ["oviedo", "racing"],
  oviedo: ["sporting"],
  racing: ["sporting", "oviedo"],
  zaragoza: ["huesca", "osasuna"],
  huesca: ["zaragoza"],
  almeria: ["granada", "cartagena"],
  elche: ["levante", "cartagena"],
  cartagena: ["elche", "almeria"],
  rayo: ["getafe", "leganes"],
  getafe: ["leganes", "rayo"],
  leganes: ["getafe", "rayo"],
  mallorca: ["las-palmas", "tenerife"],
  "las-palmas": ["tenerife", "mallorca"],
  tenerife: ["las-palmas"],
  girona: ["espanyol", "sabadell"],
  valladolid: ["burgos", "zaragoza"],
  burgos: ["valladolid", "mirandes"],
  mirandes: ["burgos"],
  eibar: ["athletic", "alaves"],
  alaves: ["athletic", "eibar"],
  albacete: ["elche", "huesca"],
  sabadell: ["andorra", "girona"],
  andorra: ["sabadell"],
  almeria2: [],
};

export function defById(id: string): ClubDef | undefined {
  return CLUB_POOL.find((c) => c.id === id);
}

export function defByName(name: string): ClubDef | undefined {
  const n = name.trim().toLowerCase();
  return CLUB_POOL.find((c) => c.name.toLowerCase() === n || c.short.toLowerCase() === n);
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}

function pickBy<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length]!;
}

/* ============ Descripción editorial derivada del club (determinista) ============ */

export function clubInfoFor(def: ClubDef): ClubInfo {
  const h = hash(def.id);
  const development =
    def.dev >= 5
      ? pickBy(
          [
            `Metodología de élite: plan individual, vídeo y gimnasio desde el primer día en ${def.city}.`,
            `Cantera de referencia nacional. Aquí se forman jugadores, no se fichan atajos.`,
            `Fútbol de posición, entrenadores formadores y una escalera clara hasta el primer equipo.`,
          ],
          h,
        )
      : def.dev >= 4
        ? pickBy(
            [
              `Buen trabajo formativo con identidad propia: mucho balón y mucha exigencia técnica.`,
              `Estructura seria, coordinadores con criterio y una idea de juego reconocible.`,
              `Trabajo diario cuidado y seguimiento individual, sin lujos pero sin descuidos.`,
            ],
            h,
          )
        : pickBy(
            [
              `Menos recursos, más responsabilidad: aquí se aprende jugando y equivocándose.`,
              `Club de trabajo, campo duro y entrenadores que exigen carácter antes que técnica.`,
              `Formación práctica: pocos analistas, muchos partidos y muchos golpes.`,
            ],
            h,
          );

  const competition =
    def.prestige >= 5
      ? "Brutal. Cada verano llegan los mejores de media Europa a tu puesto."
      : def.prestige >= 4
        ? "Alta. Hay dos chicos muy valorados en tu demarcación."
        : def.prestige >= 3
          ? "Media. Compites con canteranos formados, pero hay hueco real."
          : "Baja. El club necesita gente de casa y lo sabe.";

  const minutes =
    def.minutes >= 3
      ? "Muchos y pronto: con 17 años puedes asomarte al primer equipo."
      : def.minutes >= 1
        ? "Progresivos y bien medidos. Nada regalado, nada quemado."
        : def.minutes >= 0
          ? "Escasos al principio; si convences, el filial está cerca."
          : "Muy difíciles. Antes de ti hay internacionales hechos.";

  const risk =
    def.prestige >= 5
      ? "Si no explotas rápido, te cruzan de la lista sin una sola explicación."
      : def.tier === 2
        ? `El club es inestable: un descenso o un cambio de dueño lo altera todo en ${def.city}.`
        : def.prestige >= 4
          ? "La presión del entorno es enorme: un mal mes se nota en la calle."
          : "Poca red de seguridad: si sales, sales a Segunda B y a empezar otra vez.";

  return {
    id: def.id,
    name: def.name,
    short: def.short,
    city: def.city,
    colors: def.colors,
    development,
    competition,
    minutes,
    risk,
    devBonus: def.dev - 2,
    minutesBonus: def.minutes,
    prestige: def.prestige,
  };
}

/* ======================= Ofertas iniciales variables ======================= */

export interface ClubOffer {
  clubId: string;
  role: "elite" | "cantera" | "camino" | "alternativa";
  pitch: string;
}

const ROLE_LABEL: Record<ClubOffer["role"], string[]> = {
  elite: [
    "Te quieren en una casa donde nadie te va a esperar, pero donde todo el mundo mira.",
    "Oferta de las grandes: ficha alta, exigencia máxima y cero garantías de jugar.",
  ],
  cantera: [
    "Proyecto formativo serio: te ven como jugador de club, no como cromo.",
    "Quieren firmarte tres años y llevarte de la mano hasta el filial.",
  ],
  camino: [
    "Camino corto al primer equipo: si rindes, este año ya entrenas con los mayores.",
    "Te ofrecen minutos de verdad muy pronto, aunque el club viva al límite.",
  ],
  alternativa: [
    "No es la oferta más brillante, pero el entrenador ha venido en persona a verte.",
    "Una apuesta distinta: menos ruido, más paciencia contigo.",
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function regionOfCity(city: string): Region | null {
  const c = city.trim().toLowerCase();
  const def = CLUB_POOL.find((d) => d.city.toLowerCase() === c);
  if (def) return def.region;
  const map: [string, Region][] = [
    ["sevilla", "andalucia"], ["huelva", "andalucia"], ["jaén", "andalucia"], ["jerez", "andalucia"],
    ["madrid", "madrid"], ["alcalá", "madrid"], ["toledo", "centro"], ["salamanca", "centro"],
    ["murcia", "levante"], ["alicante", "levante"], ["castellón", "levante"],
    ["bilbao", "norte"], ["logroño", "norte"], ["pamplona", "norte"],
    ["barcelona", "cataluna"], ["tarragona", "cataluna"], ["lleida", "cataluna"],
    ["lugo", "noroeste"], ["ourense", "noroeste"], ["pontevedra", "noroeste"],
    ["palma", "islas"], ["ibiza", "islas"], ["tenerife", "islas"],
  ];
  for (const [k, r] of map) if (c.includes(k)) return r;
  return null;
}

/**
 * 4 propuestas variables y plausibles. Nunca la misma combinación fija:
 * una grande difícil, una cantera formativa, un camino rápido (Segunda) y
 * una alternativa; con sesgo por la ciudad del jugador.
 */
export function buildOffers(city: string): ClubOffer[] {
  const region = regionOfCity(city);
  const near = (d: ClubDef) => (region && d.region === region ? 1 : 0);

  const elitePool = CLUB_POOL.filter((d) => d.prestige >= 4 && d.tier === 1);
  const canteraPool = CLUB_POOL.filter((d) => d.dev >= 4 && d.prestige <= 4);
  const caminoPool = CLUB_POOL.filter((d) => d.minutes >= 2);
  const restPool = CLUB_POOL.filter((d) => d.prestige <= 3);

  const chosen: ClubOffer[] = [];
  const used = new Set<string>();

  const take = (pool: ClubDef[], role: ClubOffer["role"]) => {
    const sorted = shuffle(pool.filter((d) => !used.has(d.id)))
      .sort((a, b) => near(b) * (Math.random() < 0.7 ? 1 : 0) - near(a) * (Math.random() < 0.7 ? 1 : 0));
    const def = sorted[0];
    if (!def) return;
    used.add(def.id);
    chosen.push({ clubId: def.id, role, pitch: pickBy(ROLE_LABEL[role], Math.floor(Math.random() * 2)) });
  };

  take(elitePool, "elite");
  take(canteraPool, "cantera");
  take(caminoPool, "camino");
  take(restPool, "alternativa");
  while (chosen.length < 4) take(CLUB_POOL, "alternativa");
  return shuffle(chosen);
}

/* ======================= Contexto de partido ======================= */

export function competitionFor(stage: Stage, def: ClubDef): string {
  if (stage === "youth") return "División de Honor Juvenil";
  if (stage === "reserves") return def.prestige >= 4 ? "Primera Federación" : "Segunda Federación";
  return def.tier === 1 ? "LaLiga EA Sports" : "LaLiga Hypermotion";
}

function youthPool(def: ClubDef): ClubDef[] {
  const same = CLUB_POOL.filter((d) => d.region === def.region && d.id !== def.id);
  const others = CLUB_POOL.filter((d) => d.region !== def.region && d.prestige <= 3);
  return same.length >= 5 ? same : [...same, ...shuffle(others).slice(0, 6)];
}

function opponentPool(stage: Stage, def: ClubDef): ClubDef[] {
  if (stage === "youth") return youthPool(def);
  if (stage === "reserves") {
    const pool = CLUB_POOL.filter((d) => d.id !== def.id && d.prestige <= 3);
    return pool.length ? pool : CLUB_POOL.filter((d) => d.id !== def.id);
  }
  const pool = CLUB_POOL.filter((d) => d.id !== def.id && d.tier === def.tier);
  return pool.length ? pool : CLUB_POOL.filter((d) => d.id !== def.id);
}

export function derbyRivalOf(def: ClubDef): ClubDef | null {
  const ids = DERBIES[def.id] ?? [];
  for (const id of shuffle(ids)) {
    const rival = defById(id);
    if (rival) return rival;
  }
  const same = CLUB_POOL.filter((d) => d.region === def.region && d.id !== def.id);
  return same.length ? shuffle(same)[0]! : null;
}

/** Nombre de la ronda coherente con la competición. */
function roundFor(competition: string, tie: boolean, index: number): string {
  if (competition === "Copa del Rey") {
    return pickBy(["Primera eliminatoria", "Segunda eliminatoria", "Dieciseisavos", "Octavos"], index);
  }
  if (tie) return "Eliminatoria a partido único";
  return `Jornada ${1 + (index % 34)}`;
}

export interface BuildCtxInput {
  stage: Stage;
  club: ClubDef;
  slot: Slot;
  index: number;
  /** Nombres de clubes con historia previa (rechazados, exequipo). */
  memoryClubs?: string[];
}

/** Crea un matchContext coherente. Fuente ÚNICA de rival/estadio/competición. */
export function buildMatchContext(input: BuildCtxInput): MatchContext {
  const { stage, club, slot, index } = input;
  const tag = slot.tag ?? null;

  let opponent: ClubDef | null = null;
  let specialTag: string | null = null;
  let derby = false;
  let competition = competitionFor(stage, club);
  const tie = !!slot.tie;

  if (slot.opponentId) opponent = defById(slot.opponentId) ?? null;

  if (!opponent && tag === "derby") {
    opponent = derbyRivalOf(club);
    derby = true;
  }
  if (!opponent && tag === "exclub") {
    const name = (input.memoryClubs ?? []).map((n) => defByName(n)).find((d): d is ClubDef => !!d && d.id !== club.id);
    opponent = name ?? null;
  }
  if (!opponent) {
    const pool = opponentPool(stage, club);
    opponent = shuffle(pool)[0] ?? CLUB_POOL.find((d) => d.id !== club.id)!;
  }
  if (tag === "derby") derby = true;
  if (tag === "cup" || tie) competition = "Copa del Rey";

  const isHome = tag === "derby" ? Math.random() < 0.5 : Math.random() < 0.52;
  const homeDef = isHome ? club : opponent;
  const awayDef = isHome ? opponent : club;

  if (derby) specialTag = `Derbi ante el ${opponent.name}`;
  else if (tag === "exclub") specialTag = `Reencuentro con el ${opponent.name}`;
  else if (tag === "scouts") specialTag = "Ojeadores en la grada";
  else if (tag === "decisive") specialTag = "Jornada decisiva";
  else if (tag === "final") specialTag = "Final";
  else if (tag === "debut") specialTag = "Tu primera oportunidad";

  const storyLabel = derby
    ? `Derbi contra el ${opponent.name}`
    : tag === "exclub"
      ? `Partido ante el ${opponent.name}`
      : tag === "final"
        ? `Final ante el ${opponent.name}`
        : tag === "cup"
          ? `Copa del Rey ante el ${opponent.name}`
          : tag === "debut"
            ? `Tu primera oportunidad ante el ${opponent.name}`
            : tag === "scouts"
              ? `Partido ante el ${opponent.name} con ojeadores en la grada`
              : tag === "decisive"
                ? `Jornada decisiva ante el ${opponent.name}`
                : `${isHome ? "Recibes" : "Visitas"} al ${opponent.name}`;

  const ctx: MatchContext = {
    competition,
    round: roundFor(competition, tie, index),
    homeTeam: homeDef.name,
    awayTeam: awayDef.name,
    opponent: opponent.name,
    opponentShort: opponent.short,
    venue: homeDef.stadium,
    venueCity: homeDef.city,
    isHome,
    specialTag,
    derbyOpponent: derby ? opponent.name : null,
    storyLabel,
    tie,
  };

  return validateMatchContext(ctx, club.name) ? ctx : safeContext(stage, club, opponent, index);
}

function safeContext(stage: Stage, club: ClubDef, opponent: ClubDef, index: number): MatchContext {
  const isHome = true;
  return {
    competition: competitionFor(stage, club),
    round: `Jornada ${1 + (index % 34)}`,
    homeTeam: club.name,
    awayTeam: opponent.name,
    opponent: opponent.name,
    opponentShort: opponent.short,
    venue: club.stadium,
    venueCity: club.city,
    isHome,
    specialTag: null,
    derbyOpponent: null,
    storyLabel: `Recibes al ${opponent.name}`,
    tie: false,
  };
}

/**
 * Invariantes de coherencia. Ninguna escena se renderiza sin pasar por aquí.
 * Nada de "Derbi contra el Sevilla" jugado "en campo del Getafe".
 */
export function validateMatchContext(ctx: MatchContext, myTeam: string): boolean {
  if (!ctx || !ctx.opponent || !ctx.homeTeam || !ctx.awayTeam) return false;
  if (ctx.homeTeam === ctx.awayTeam) return false;
  if (ctx.isHome && (ctx.homeTeam !== myTeam || ctx.awayTeam !== ctx.opponent)) return false;
  if (!ctx.isHome && (ctx.awayTeam !== myTeam || ctx.homeTeam !== ctx.opponent)) return false;

  const homeDef = defByName(ctx.homeTeam);
  if (homeDef && ctx.venue !== homeDef.stadium) return false;
  if (ctx.derbyOpponent && ctx.derbyOpponent !== ctx.opponent) return false;

  // Ningún texto puede nombrar a un club que no sea el rival o el propio.
  for (const text of [ctx.storyLabel, ctx.specialTag ?? ""]) {
    for (const def of CLUB_POOL) {
      if (def.name === ctx.opponent || def.name === myTeam) continue;
      if (text.includes(def.name)) return false;
    }
  }
  if (ctx.competition === "Copa del Rey" && !ctx.round) return false;
  return true;
}
