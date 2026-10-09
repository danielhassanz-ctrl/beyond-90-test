/**
 * Las ligas del juego. Un jugador que ficha por un club de otro país juega SU liga (Premier, Bundesliga, Serie A,
 * Ligue 1...), con sus rivales, su copa nacional, su clasificación y su camino a Europa — no la liga española con
 * el escudo cambiado. Cada liga lista sus clubes, el número de jornadas, los habituales de Champions y de Europa
 * League y la fuerza relativa de cada club (1-5) que alimenta las tablas.
 */
export type LeagueId = "es" | "en" | "de" | "it" | "fr" | "sa";

export interface League {
  id: LeagueId;
  /** "La Liga", "Premier League"... tal como sale en los textos de partido ("en la Premier League" → ver `inLabel`). */
  name: string;
  /** Etiqueta corta para tablas y estadísticas. */
  short: string;
  cup: string;
  jornadas: number;
  teams: string[];
  /** Clubes de nivel Champions habitual / Europa League habitual dentro de esta liga. */
  champions: string[];
  europa: string[];
  /** Rivales de las primeras rondas de la copa: clubes de categorías inferiores. */
  cupEarly: string[];
  /** Fuerza relativa 1-5 por club (por defecto 3). */
  tiers: Record<string, number>;
  /** Derbis y clásicos: pares de clubes y cómo se llama la cita. */
  derbies: { a: string; b: string; name: string; big?: boolean }[];
}

export const LEAGUES: Record<LeagueId, League> = {
  es: {
    id: "es",
    name: "La Liga",
    short: "LaLiga",
    cup: "Copa del Rey",
    jornadas: 38,
    teams: [
      "Real Madrid", "FC Barcelona", "Atlético de Madrid", "Sevilla FC", "Real Betis", "Valencia CF", "Villarreal CF", "Real Sociedad", "Athletic Club",
      "Getafe CF", "Rayo Vallecano", "Cádiz CF", "Osasuna", "Girona FC", "Las Palmas", "Almería", "Celta de Vigo", "Real Valladolid", "Mallorca", "Elche CF",
    ],
    champions: ["Real Madrid", "FC Barcelona", "Atlético de Madrid"],
    europa: ["Sevilla FC", "Real Betis", "Villarreal CF", "Real Sociedad", "Athletic Club", "Valencia CF", "Girona FC", "Real Zaragoza", "Deportivo de La Coruña"],
    cupEarly: ["CD Mirandés", "Racing de Ferrol", "UD Ibiza", "CD Eldense", "SD Ponferradina", "Real Unión", "CD Tenerife", "Cultural Leonesa"],
    tiers: {},
    derbies: [
      { a: "Real Madrid", b: "FC Barcelona", name: "El Clásico", big: true },
      { a: "Real Madrid", b: "Atlético de Madrid", name: "Derbi" },
      { a: "FC Barcelona", b: "Atlético de Madrid", name: "Derbi" },
      { a: "Sevilla FC", b: "Real Betis", name: "Derbi" },
      { a: "Athletic Club", b: "Real Sociedad", name: "Derbi" },
      { a: "Valencia CF", b: "Villarreal CF", name: "Derbi" },
    ],
  },
  en: {
    id: "en",
    name: "Premier League",
    short: "Premier League",
    cup: "Copa de Inglaterra",
    jornadas: 38,
    teams: [
      "Manchester City", "Liverpool FC", "Arsenal", "Chelsea", "Manchester United", "Tottenham Hotspur", "Newcastle United", "Aston Villa",
      "Brighton & Hove Albion", "West Ham United", "Crystal Palace", "Fulham", "Brentford", "Wolverhampton Wanderers", "Everton", "Nottingham Forest",
      "AFC Bournemouth", "Leicester City", "Leeds United", "Southampton",
    ],
    champions: ["Manchester City", "Liverpool FC", "Arsenal", "Chelsea", "Manchester United"],
    europa: ["Tottenham Hotspur", "Newcastle United", "Aston Villa", "Brighton & Hove Albion", "West Ham United"],
    cupEarly: ["Wrexham AFC", "Stockport County", "Plymouth Argyle", "Preston North End", "Lincoln City", "Burton Albion", "Sheffield Wednesday", "Bristol Rovers"],
    tiers: {
      "Manchester City": 5, "Liverpool FC": 5, Arsenal: 5, Chelsea: 4, "Manchester United": 4, "Tottenham Hotspur": 4, "Newcastle United": 4, "Aston Villa": 4,
      "Brighton & Hove Albion": 3, "West Ham United": 3, "Crystal Palace": 3, Fulham: 3, Brentford: 3, Everton: 3, "Wolverhampton Wanderers": 3,
      "Nottingham Forest": 3, "AFC Bournemouth": 2, "Leicester City": 2, "Leeds United": 2, Southampton: 2,
    },
    derbies: [
      { a: "Manchester City", b: "Manchester United", name: "Derbi de Mánchester", big: true },
      { a: "Liverpool FC", b: "Manchester United", name: "El clásico inglés", big: true },
      { a: "Liverpool FC", b: "Everton", name: "Derbi del Mersey" },
      { a: "Arsenal", b: "Tottenham Hotspur", name: "Derbi del norte de Londres" },
      { a: "Chelsea", b: "Tottenham Hotspur", name: "Derbi de Londres" },
      { a: "West Ham United", b: "Arsenal", name: "Derbi de Londres" },
    ],
  },
  de: {
    id: "de",
    name: "Bundesliga",
    short: "Bundesliga",
    cup: "Copa de Alemania",
    jornadas: 34,
    teams: [
      "Bayern de Múnich", "Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig", "Eintracht Fráncfort", "VfB Stuttgart", "SC Friburgo", "VfL Wolfsburgo",
      "Borussia Mönchengladbach", "TSG Hoffenheim", "Werder Bremen", "FC Augsburgo", "Unión Berlín", "Mainz 05", "FC Schalke 04", "Hamburgo SV", "1. FC Colonia", "VfL Bochum",
    ],
    champions: ["Bayern de Múnich", "Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig"],
    europa: ["Eintracht Fráncfort", "VfB Stuttgart", "SC Friburgo", "VfL Wolfsburgo", "FC Schalke 04"],
    cupEarly: ["SV Elversberg", "Arminia Bielefeld", "Dynamo Dresde", "SpVgg Greuther Fürth", "Hansa Rostock", "Preußen Münster", "SC Paderborn", "Holstein Kiel"],
    tiers: {
      "Bayern de Múnich": 5, "Borussia Dortmund": 5, "Bayer Leverkusen": 5, "RB Leipzig": 4, "Eintracht Fráncfort": 4, "VfB Stuttgart": 4, "SC Friburgo": 3,
      "VfL Wolfsburgo": 3, "Borussia Mönchengladbach": 3, "TSG Hoffenheim": 3, "Werder Bremen": 3, "FC Augsburgo": 2, "Unión Berlín": 3, "Mainz 05": 3,
      "FC Schalke 04": 3, "Hamburgo SV": 2, "1. FC Colonia": 2, "VfL Bochum": 2,
    },
    derbies: [
      { a: "Bayern de Múnich", b: "Borussia Dortmund", name: "Der Klassiker", big: true },
      { a: "Borussia Dortmund", b: "FC Schalke 04", name: "Revierderby", big: true },
      { a: "Werder Bremen", b: "Hamburgo SV", name: "Derbi del norte" },
    ],
  },
  it: {
    id: "it",
    name: "Serie A",
    short: "Serie A",
    cup: "Copa de Italia",
    jornadas: 38,
    teams: [
      "Inter de Milán", "Juventus", "AC Milan", "SSC Nápoles", "AS Roma", "Atalanta", "Lazio", "Fiorentina", "Bolonia", "Torino", "Udinese", "Sassuolo",
      "Génova", "Cagliari", "Hellas Verona", "US Lecce", "Empoli", "Parma", "Monza", "Como",
    ],
    champions: ["Inter de Milán", "Juventus", "AC Milan", "SSC Nápoles", "Atalanta"],
    europa: ["AS Roma", "Lazio", "Fiorentina", "Bolonia"],
    cupEarly: ["Cesena", "Carrarese", "Südtirol", "Pisa", "Cittadella", "Spezia", "Palermo", "Catanzaro"],
    tiers: {
      "Inter de Milán": 5, Juventus: 5, "AC Milan": 5, "SSC Nápoles": 5, "AS Roma": 4, Atalanta: 4, Lazio: 4, Fiorentina: 4, Bolonia: 3, Torino: 3, Udinese: 3,
      Sassuolo: 3, Génova: 3, Cagliari: 2, "Hellas Verona": 2, "US Lecce": 2, Empoli: 2, Parma: 2, Monza: 2, Como: 2,
    },
    derbies: [
      { a: "Inter de Milán", b: "AC Milan", name: "Derbi de la Madonnina", big: true },
      { a: "Inter de Milán", b: "Juventus", name: "Derbi de Italia", big: true },
      { a: "AS Roma", b: "Lazio", name: "Derbi de la capital", big: true },
      { a: "Juventus", b: "Torino", name: "Derbi de la Mole" },
    ],
  },
  fr: {
    id: "fr",
    name: "Ligue 1",
    short: "Ligue 1",
    cup: "Copa de Francia",
    jornadas: 34,
    teams: [
      "Paris Saint-Germain", "Olympique de Marsella", "AS Mónaco", "Olympique de Lyon", "LOSC Lille", "OGC Niza", "Stade Rennais", "RC Lens", "Stade de Reims",
      "FC Nantes", "RC Estrasburgo", "Montpellier HSC", "Toulouse FC", "FC Lorient", "Stade Brestois", "Le Havre AC", "FC Metz", "AJ Auxerre",
    ],
    champions: ["Paris Saint-Germain", "AS Mónaco", "Olympique de Marsella", "LOSC Lille"],
    europa: ["Olympique de Lyon", "OGC Niza", "Stade Rennais", "RC Lens"],
    cupEarly: ["US Quevilly", "Annecy FC", "Red Star FC", "FC Versailles", "Rodez AF", "Chamois Niortais", "Bergerac", "Concarneau"],
    tiers: {
      "Paris Saint-Germain": 5, "AS Mónaco": 4, "Olympique de Marsella": 4, "LOSC Lille": 4, "Olympique de Lyon": 4, "OGC Niza": 3, "Stade Rennais": 3, "RC Lens": 3,
      "Stade de Reims": 3, "FC Nantes": 2, "RC Estrasburgo": 3, "Montpellier HSC": 2, "Toulouse FC": 2, "FC Lorient": 2, "Stade Brestois": 3, "Le Havre AC": 2, "FC Metz": 2, "AJ Auxerre": 2,
    },
    derbies: [
      { a: "Paris Saint-Germain", b: "Olympique de Marsella", name: "Le Classique", big: true },
      { a: "Olympique de Lyon", b: "Olympique de Marsella", name: "Choc des Olympiques" },
    ],
  },
  sa: {
    id: "sa",
    name: "Saudi Pro League",
    short: "Liga saudí",
    cup: "Copa de Arabia",
    jornadas: 34,
    teams: [
      "Al-Nassr FC", "Al-Hilal", "Al-Ittihad", "Al-Ahli", "Al-Shabab", "Al-Ettifaq", "Al-Fateh", "Al-Taawoun", "Al-Raed", "Al-Fayha", "Damac FC", "Al-Khaleej",
      "Al-Okhdood", "Al-Riyadh", "Al-Wehda", "Abha Club", "Al-Hazem", "Al-Tai",
    ],
    champions: [],
    europa: [],
    cupEarly: ["Al-Jabalain", "Al-Qadsiah", "Al-Najma", "Al-Orobah", "Al-Batin", "Al-Kholood", "Hajer FC", "Al-Arabi"],
    tiers: { "Al-Nassr FC": 5, "Al-Hilal": 5, "Al-Ittihad": 4, "Al-Ahli": 4, "Al-Shabab": 3, "Al-Ettifaq": 3, "Al-Fateh": 3, "Al-Taawoun": 3 },
    derbies: [{ a: "Al-Nassr FC", b: "Al-Hilal", name: "El clásico saudí", big: true }, { a: "Al-Ittihad", b: "Al-Ahli", name: "Derbi de Yeda" }],
  },
};

const ORDER: LeagueId[] = ["es", "en", "de", "it", "fr", "sa"];

/** Alias con los que el juego ha escrito el mismo club (Bayern Múnich, Bayern Munich...). */
const ALIAS: Record<string, string> = {
  "Bayern Múnich": "Bayern de Múnich", "Bayern Munich": "Bayern de Múnich", PSG: "Paris Saint-Germain", "AC Milán": "AC Milan", "Napoli": "SSC Nápoles",
  "Eintracht Frankfurt": "Eintracht Fráncfort", "Olympique de Marseille": "Olympique de Marsella", "Atlético": "Atlético de Madrid",
};
const norm = (club: string) => ALIAS[club] ?? club;

const BY_CLUB = new Map<string, LeagueId>();
for (const id of ORDER) for (const t of LEAGUES[id].teams) BY_CLUB.set(t, id);
// Clubes de la liga española que el juego escribe de otra forma.
for (const t of ["Osasuna", "CA Osasuna", "RCD Mallorca", "UD Almería", "UD Las Palmas", "Elche CF", "Real Zaragoza", "Deportivo de La Coruña", "Málaga CF", "Levante UD", "Real Oviedo", "Sporting de Gijón", "Real Valladolid"]) BY_CLUB.set(t, "es");

/** La liga en la que juega un club (La Liga por defecto: filiales, clubes inventados, segunda categoría). */
export const leagueOf = (club: string): League => LEAGUES[BY_CLUB.get(norm(club)) ?? "es"];
export const canonicalClub = norm;

/** ¿Es un club de fuera de España que el juego conoce? */
export const isKnownForeignClub = (club: string): boolean => (BY_CLUB.get(norm(club)) ?? "es") !== "es";

/** Fuerza 1-5 de un club para las tablas (3 si no se conoce). */
export function leagueTier(club: string): number | null {
  const c = norm(club);
  for (const id of ORDER) {
    const t = LEAGUES[id].tiers[c];
    if (t !== undefined) return t;
  }
  return null;
}

/** Jornada real de la liga que representa el partido clave de cada semana (1-10), escalada al nº de jornadas. */
export function ligaJornadaByWeek(club: string): Record<number, number> {
  const total = leagueOf(club).jornadas;
  const base: Record<number, number> = { 3: 4, 4: 9, 5: 14, 6: 19, 7: 24, 8: 29, 9: 34, 10: 38 };
  if (total === 38) return base;
  const out: Record<number, number> = {};
  for (const [w, j] of Object.entries(base)) out[Number(w)] = Math.max(1, Math.round((j * total) / 38));
  out[10] = total;
  return out;
}

/** Clubes de Champions y de Europa League habituales de TODAS las ligas (para el nivel del club). */
export const ALL_CHAMPIONS = new Set(ORDER.flatMap((id) => LEAGUES[id].champions));
export const ALL_EUROPA = new Set(ORDER.flatMap((id) => LEAGUES[id].europa));

/** Rivales europeos para un club de esta liga: de otras ligas, nunca de la suya. */
const EURO_TOP = [
  "Real Madrid", "FC Barcelona", "Atlético de Madrid", "Bayern de Múnich", "Manchester City", "Liverpool FC", "Arsenal", "Paris Saint-Germain",
  "Inter de Milán", "Juventus", "Borussia Dortmund", "AC Milan", "SSC Nápoles", "Benfica",
];
const EURO_SECOND = [
  "AS Roma", "Ajax", "Sporting CP", "Feyenoord", "Olympiacos", "Rangers FC", "Fenerbahçe", "Slavia Praga", "Villarreal CF", "Real Sociedad", "Bayer Leverkusen",
  "Atalanta", "Olympique de Lyon", "Tottenham Hotspur", "Eintracht Fráncfort", "Porto",
];
export function europeanRivals(league: League, kind: "champions" | "europa"): string[] {
  const own = new Set(league.teams);
  const pool = (kind === "champions" ? EURO_TOP : EURO_SECOND).filter((c) => !own.has(c));
  return pool.slice(0, 10);
}

/** Frase "en {competición}" para las crónicas de partido. */
export const ligaLabel = (club: string) => leagueOf(club).name;
export const copaLabel = (club: string) => leagueOf(club).cup;
