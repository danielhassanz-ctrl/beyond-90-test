import type { Player } from "@/types/player";
import type { GameEvent } from "@/types/career";

/**
 * Personajes fijos del entorno del jugador — todos con nombre y un
 * apellido y con el MISMO nombre en cada escena de la carrera (el míster
 * no se llama distinto cada vez que sale). A diferencia de
 * secondary-characters.ts (personajes episódicos que la IA introduce),
 * estos existen desde el minuto uno.
 *
 * El nombre se deriva de un hash del id del jugador (y del club, para el
 * personal del club: cuando fichas, el míster, el capitán y el presidente
 * cambian; la familia y los amigos no) — determinista, sin guardar nada
 * ni gastar una escritura. Un solo apellido a propósito (pedido explícito
 * tras probar la versión con dos: "Iván Roca Solera" se lee más lento y
 * más "de repartidor de reparto de serie" que "Iván Roca" — un futbolista
 * de verdad casi nunca se nombra con los dos apellidos en el día a día).
 */
export type NpcRole =
  | "entrenador"
  | "capitan"
  | "rival_puesto"
  | "fisio"
  | "prensa"
  | "director_deportivo"
  | "presidente"
  | "utillero"
  | "preparador"
  | "madre"
  | "padre"
  | "hermano"
  | "amigo"
  | "pareja"
  | "ex"
  | "cunado"
  | "agente";

export const NPC_ROLE_LABELS: Record<NpcRole, string> = {
  entrenador: "Entrenador",
  capitan: "Capitán",
  rival_puesto: "Competencia por el puesto",
  fisio: "Fisioterapeuta",
  prensa: "Prensa",
  director_deportivo: "Director deportivo",
  presidente: "Presidente",
  utillero: "Utillero",
  preparador: "Preparador físico",
  madre: "Tu madre",
  padre: "Tu padre",
  hermano: "Tu hermano pequeño",
  amigo: "Amigo de la infancia",
  pareja: "Tu pareja",
  ex: "Tu ex",
  cunado: "Tu cuñado",
  agente: "Representante",
};

const FIRST_M = [
  "Paco", "Julián", "Ernesto", "Ramón", "Tomás", "Fermín", "Óscar", "Rubén", "Ignacio", "Adrián", "Marcos", "Gonzalo",
  "Manuel", "Antonio", "Javier", "Sergio", "Alberto", "Andrés", "Emilio", "Joaquín", "Álvaro", "Raúl", "Iván", "Nacho",
  "Vicente", "Gaspar", "Lorenzo", "Hugo", "Mateo", "Arturo", "Rafael", "Bruno", "Kike", "Toni", "Nico", "Dani",
  "Fernando", "Cristóbal", "Ángel", "Saúl", "Diego", "Pablo", "Carlos", "David", "Jorge", "Miguel", "Luis", "Enrique",
  "Alejandro", "Ricardo", "Guillermo", "Ismael", "Borja", "Pedro", "Xavi", "Asier", "Unai", "Jon", "Iker", "Aitor",
  "Marc", "Jordi", "Pol", "Roberto", "Eduardo", "Félix", "Gabriel", "Héctor", "Ismael", "Leandro", "Mario", "Samuel",
];
const FIRST_F = [
  "Marta", "Elena", "Cristina", "Lourdes", "Alicia", "Silvia", "Carmen", "Pilar", "Rosa", "Inés", "Beatriz", "Lucía",
  "Nuria", "Irene", "Teresa", "Paula", "Raquel", "Esther", "Amparo", "Mercedes", "Sara", "Laura", "Patricia", "Julia",
  "Claudia", "Sofía", "Alba", "Andrea", "Carla", "Noelia", "Verónica", "Rocío", "Marina", "Natalia", "Adriana", "Eva",
  "Miriam", "Ainhoa", "Leire", "Aitana", "Olga", "Gloria", "Susana", "Yolanda", "Belén", "Cayetana", "Emma", "Valeria",
  "Nerea", "Daniela", "Manuela", "Isabel", "Ana", "María", "Lidia", "Fátima", "Ángela", "Celia", "Berta", "Vega",
];
const SURNAMES = [
  "Mendoza", "Roldán", "Vallejo", "Aguirre", "Bilbao", "Casares", "Barragán", "Castilla", "Solera", "Fuentes", "Iribar",
  "Peña", "Almenara", "Segarra", "Roca", "Bassa", "Verdejo", "Bermejo", "Sagasta", "Zubillaga", "Roig", "Torreblanca",
  "Nadales", "Cazorla", "Ibarra", "Prats", "Rovira", "Uranga", "Montoro", "Ferreiro", "Olmedo", "Quintana", "Salcedo",
  "Sáez", "Ferrer", "Lozano", "Navarro", "Cabrera", "Domínguez", "Herrera", "Molina", "Ortega", "Palacios", "Rivas",
  "Santamaría", "Tejada", "Valverde", "Villalba", "Zamora", "Arroyo", "Bustamante", "Carrasco", "Delgado", "Espinosa",
  "Galindo", "Ibáñez", "Jiménez", "Lara", "Maldonado", "Nieto", "Ojeda", "Pastor", "Quiroga", "Robledo", "Serrano",
  "Toledo", "Urbano", "Vidal", "Yebra", "Cordero", "Beltrán", "Escudero", "Gallego", "Hidalgo", "Ledesma",
];

/** Roles del club: cambian al cambiar de equipo. Familia, amigos y prensa te acompañan. */
const CLUB_BOUND = new Set<NpcRole>([
  "entrenador", "capitan", "rival_puesto", "fisio", "director_deportivo", "presidente", "utillero", "preparador",
]);

/** "m" / "f" / "any": el género de cada rol para elegir un nombre de pila coherente. */
const ROLE_GENDER: Record<NpcRole, "m" | "f" | "any"> = {
  entrenador: "m", capitan: "m", rival_puesto: "m", fisio: "any", prensa: "any", director_deportivo: "m",
  presidente: "m", utillero: "m", preparador: "m", madre: "f", padre: "m", hermano: "m", amigo: "m", pareja: "f", ex: "f", cunado: "m", agente: "any",
};

/** Hash de 32 bits con buena mezcla (murmur-like), para sacar varios índices independientes. */
function mix(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * El campo `last_name` del jugador en realidad guarda TODO lo que puso en
 * "Nombre y apellidos" (no hay un campo de nombre de pila separado — ver
 * types/player.ts), así que puede llevar más de una palabra ("Dani
 * Hassan"). Para dar apellido a un familiar solo hace falta el ÚLTIMO
 * apellido real, no la cadena entera — si no, "tu padre" salía con el
 * nombre de pila del jugador pegado en medio ("Ismael Dani Hassan" en vez
 * de "Ismael Hassan"), reportado en vivo por el usuario.
 */
function surnameOf(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1];
}

/** Nombre + un apellido a partir de una semilla; el apellido nunca coincide con `own`. */
function buildName(seed: string, gender: "m" | "f", own = ""): string {
  const firstPool = gender === "f" ? FIRST_F : FIRST_M;
  const first = firstPool[mix(seed + ":n") % firstPool.length];
  const ownLower = own.toLowerCase();
  let s1 = SURNAMES[mix(seed + ":a") % SURNAMES.length];
  if (s1.toLowerCase() === ownLower) s1 = SURNAMES[(SURNAMES.indexOf(s1) + 1) % SURNAMES.length];
  return `${first} ${s1}`;
}

function pickGender(seed: string, gender: "m" | "f" | "any"): "m" | "f" {
  return gender === "any" ? (mix(seed + ":g") % 2 === 0 ? "m" : "f") : gender;
}

export function getNpcName(player: Player, role: NpcRole): string {
  // Cambios de cara en el entorno: cada vez que el entrenador, el capitán... del club
  // cambia (flag gen_<rol>), el personaje es otro, con otro nombre, no el mismo para siempre.
  const gen = parseInt(String(player.flags?.[`gen_${role}`] ?? "0"), 10) || 0;
  const genSuffix = gen > 0 ? `:g${gen}` : "";
  const seed = (CLUB_BOUND.has(role) ? `${player.id}:${role}:${player.club}` : `${player.id}:${role}`) + genSuffix;
  const gender = pickGender(seed, ROLE_GENDER[role]);
  // Tu padre y tu hermano comparten tu apellido — no hace falta generar uno propio.
  if ((role === "padre" || role === "hermano") && player.last_name) {
    const firstPool = gender === "f" ? FIRST_F : FIRST_M;
    const first = firstPool[mix(seed + ":n") % firstPool.length];
    return `${first} ${surnameOf(player.last_name)}`;
  }
  return buildName(seed, gender, surnameOf(player.last_name));
}

/** Un nombre completo al azar (p. ej. el nuevo representante cuando despides al anterior). */
export function randomPersonName(gender: "m" | "f" | "any" = "any"): string {
  const seed = `${Math.random()}:${Math.random()}`;
  return buildName(seed, pickGender(seed, gender));
}

/**
 * Personajes episódicos que se han nombrado en esta petición (nombre → pista
 * de quién es, sacada de la semilla con que se generó). cast.ts los usa para
 * poder presentar con una ficha a cualquiera que salga nombrado en una escena
 * sin haber sido presentado. Se acota para no crecer sin límite.
 */
export const episodicNames = new Map<string, string>();
function rememberEpisodic(name: string, hint: string): string {
  if (episodicNames.size > 600) episodicNames.clear();
  episodicNames.set(name, hint);
  return name;
}

/** Compañeros de equipo: cambian con el club, distintos entre sí según la `salt`. */
export function getTeammateName(player: Player, salt: string): string {
  const name = buildName(`${player.id}:${player.club}:mate:${salt}`, "m", surnameOf(player.last_name));
  return rememberEpisodic(name, `compañero de equipo ${salt}`);
}

/** Cualquier otra persona que aparece (un veterano, un periodista, un aficionado...). */
export function getPersonName(player: Player, salt: string, gender: "m" | "f" | "any" = "any"): string {
  const seed = `${player.id}:person:${salt}`;
  const name = buildName(seed, pickGender(seed, gender), surnameOf(player.last_name));
  return rememberEpisodic(name, salt);
}

/**
 * Famosos e influencers: nombres artísticos INVENTADOS (regla del proyecto:
 * cualquier famoso que aparezca debe ser claramente ficticio, nunca un
 * calco de una persona real, porque en el juego les pasan cosas
 * inventadas — un escándalo, un anuncio, una colaboración). Suenan a nombre
 * de artista o de "creador de contenido" de aquí, pero no imitan a nadie.
 */
const STAGE_F = [
  "Kiara", "Nayara", "Bianca", "Zoe", "Jenny", "Vanesa", "Naomi", "Sasha", "Yara", "Brisa", "Candela", "Dafne",
  "Ariadna", "Melody", "Luna", "Tamara", "Xenia", "Ivana", "Gala", "Olivia", "Elsa", "Noa", "Abril", "Estrella",
  "Aura", "Cleo", "Dana", "Fedra", "Greta", "Helena", "Indira", "Jade", "Kenia", "Leyre", "Mara", "Nadia", "Perla",
  "Rebeca", "Selena", "Thais", "Uma", "Violeta", "Wendy", "Yasmina", "Zaira", "Alma", "Bárbara", "Coral",
];
const STAGE_M = [
  "Nico", "Yeray", "Kevin", "Jairo", "Luken", "Adán", "Hugo", "Rayan", "Ícaro", "Dylan", "Bastian", "Eros", "Milo",
  "Thiago", "Dídac", "Kilian", "Neo", "Fabio", "Ezequiel", "Ciro", "Lucas", "Gael", "Otto", "Rocco",
  "Aarón", "Brais", "Cosme", "Dorian", "Elías", "Fausto", "Gonzalo", "Hernán", "Iván", "Joel", "Kike", "Lisandro",
  "Marlon", "Nahuel", "Orión", "Piero", "Quique", "Ramsés", "Salva", "Tarik", "Ulises", "Valentín", "Xabi", "Yago",
];
const STAGE_SURNAMES = [
  "Lux", "Vega", "Montenegro", "Solaris", "Del Río", "Ferrari", "Bravo", "Nocturno", "Neón", "Dorado", "Roca",
  "Luján", "Sirena", "Quesada", "Beltrán", "Marlowe", "Wilde", "Zafiro", "Escarlata", "Montiel", "Alborán",
  "Camaleón", "Delgado Blanco", "Fénix", "Iglesias Roy", "Kaos", "Lobo", "Mistral", "Nácar", "Osuna Park",
  "Aranda Vip", "Bengala", "Cárdenas Music", "Diamante", "Eclipse", "Fortuna", "Galaxia", "Halcón", "Índigo Sur",
  "Jaguar", "Kalima", "Lunares", "Magnate", "Nébula", "Oasis Rey", "Pantera", "Quimera", "Relámpago", "Sultana",
  "Tormenta", "Urbano Rey", "Vertigo", "Zenit", "Alcázar Pop", "Brillo", "Cometa", "Dorado Reyes", "Esmeralda",
];
export type CelebrityKind = "cantante" | "influencer" | "streamer" | "actor" | "presentador" | "chef" | "humorista";

export function getCelebrityName(player: Player, kind: CelebrityKind, salt: string, gender: "m" | "f"): string {
  const seed = `${player.id}:celeb:${kind}:${salt}:${gender}`;
  const firstPool = gender === "f" ? STAGE_F : STAGE_M;
  const first = firstPool[mix(seed + ":n") % firstPool.length];
  const last = STAGE_SURNAMES[mix(seed + ":s") % STAGE_SURNAMES.length];
  return rememberEpisodic(`${first} ${last}`, `famoso ${kind}`);
}

/** Nombres de agentes de arranque escritos a mano (siempre los mismos en toda carrera): se sustituyen por uno del jugador. */
const FIXED_AGENT_NAMES = [
  "Adrián Prieto", "Bruno Cabrera", "Diego Marín", "Fabio Reyes", "Gonzalo Prieto", "Iñaki Zubiaurre",
  "Julián Contreras", "Marta Ochoa", "Pablo Mendive", "Ramón Elizalde", "Rubén Castell", "Sergio Falcón",
  "Teodoro Vidal", "Valeria Sáenz", "Álvaro Montes", "Nuria Ibáñez", "Fran Cortés", "Marina Roldán",
];

/**
 * Descripción cualitativa corta de una relación numérica (0-100), en el
 * mismo tono que las que ya usa el juego en otros sitios.
 */
export function describeRelationshipLevel(value: number): string {
  if (value >= 75) return "Confía en ti sin fisuras.";
  if (value >= 55) return "La relación es buena, sin más.";
  if (value >= 35) return "Te ve como una opción, no como una certeza.";
  if (value >= 15) return "Terreno frío. Conviene un gesto pronto.";
  return "La relación está rota. Toca reconstruir desde cero.";
}

/**
 * El reparto fijo, en texto, para pasárselo a la IA: sin esto inventaba
 * "el míster" o un nombre distinto en cada escena.
 */
export function describeCast(player: Player): string {
  const lines = [
    `- Entrenador del club: ${getNpcName(player, "entrenador")}`,
    `- Capitán: ${getNpcName(player, "capitan")}`,
    `- Competencia por su puesto: ${getNpcName(player, "rival_puesto")}`,
    `- Fisioterapeuta: ${getNpcName(player, "fisio")}`,
    `- Preparador físico: ${getNpcName(player, "preparador")}`,
    `- Director deportivo: ${getNpcName(player, "director_deportivo")}`,
    `- Presidente del club: ${getNpcName(player, "presidente")}`,
    `- Utillero: ${getNpcName(player, "utillero")}`,
    `- Periodista de cabecera: ${getNpcName(player, "prensa")}`,
    `- Compañeros de vestuario (usa estos cuando necesites un compañero con nombre): ${[1, 2, 3, 4, 5, 6]
      .map((i) => getTeammateName(player, `squad${i}`))
      .join("; ")}`,
    `- Su madre: ${getNpcName(player, "madre")}`,
    `- Su padre: ${getNpcName(player, "padre")}`,
    `- Su hermano pequeño: ${getNpcName(player, "hermano")}`,
    `- Su cuñado: ${getNpcName(player, "cunado")}`,
    `- Su mejor amigo de la infancia: ${getNpcName(player, "amigo")}`,
    `- Famosos INVENTADOS del mundo del jugador (cantante, influencer, streamer, actor, presentadora; nunca uses personas reales): ${[
      getCelebrityName(player, "cantante", "cast", "f"),
      getCelebrityName(player, "influencer", "cast", "m"),
      getCelebrityName(player, "streamer", "cast", "m"),
      getCelebrityName(player, "actor", "cast", "m"),
      getCelebrityName(player, "presentador", "cast", "f"),
    ].join("; ")}`,
  ];
  if (player.agent_name) lines.push(`- Su representante: ${player.agent_name}`);
  if (typeof player.flags?.pareja === "string" && player.flags.pareja) {
    const partner = player.flags.pareja === FIXED_NAMES.pareja ? getNpcName(player, "pareja") : player.flags.pareja;
    lines.push(`- Su pareja: ${partner}`);
  }
  return lines.join("\n");
}

/**
 * Algunos eventos escritos a mano llevan un personaje con nombre de pila
 * fijo ("Lucía", la pareja; "Carla", una ex; "Diego", el amigo de la
 * infancia) o un representante con nombre fijo: en todas las carreras eran
 * la misma persona (y "Klaus Brandt" sigue siendo alemán a propósito).
 * Se sustituyen por el personaje de ESTE jugador (nombre y apellidos),
 * también dentro de las consecuencias — así la pareja y el representante
 * que quedan guardados ya llevan nombre completo. Los representantes se
 * cambian primero (uno se llama "Diego Marín" y no debe romperse).
 */
const FIXED_NAMES: Partial<Record<NpcRole, string>> = { pareja: "Lucía", ex: "Carla", amigo: "Diego" };

function replaceWord(text: string, word: string, replacement: string): string {
  return text.replace(new RegExp("(?<![\\p{L}])" + word + "(?![\\p{L}])", "gu"), replacement);
}

function replaceFixedNames<V>(value: V, player: Player): V {
  if (typeof value === "string") {
    let out: string = value;
    for (const agent of FIXED_AGENT_NAMES) {
      // un guardado antiguo conserva su representante de siempre
      if (out.includes(agent) && agent !== player.agent_name) out = out.split(agent).join(getNpcName(player, "agente"));
    }
    for (const [role, fixed] of Object.entries(FIXED_NAMES) as [NpcRole, string][]) {
      if (out.includes(fixed)) out = replaceWord(out, fixed, getNpcName(player, role));
    }
    return out as unknown as V;
  }
  if (Array.isArray(value)) return value.map((v) => replaceFixedNames(v, player)) as unknown as V;
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) next[k] = replaceFixedNames(v, player);
    return next as V;
  }
  return value;
}

const NOT_NAMED = "(?!\\s+(?:de|del|rival|nacional|asistente|ayudante|llamad[oa]|[A-ZÁÉÍÓÚÑ]))";
const L = "(?<![\\p{L}])";
const E = "(?![\\p{L}])";

interface MentionRule {
  key: string;
  re: RegExp;
  /** Detecta que esta mención YA lleva nombre (idempotencia). */
  namedRe: RegExp;
  /** Devuelve el nombre, o null si no procede (p. ej. el representante es tu padre). */
  name: (player: Player, salt: string) => string | null;
  /** "append": «tu madre Carmen Ruiz»; "llamado": «un compañero llamado Iván Roca». */
  style: "append" | "llamado";
}

/** Adjetivos que suelen ir pegados al sustantivo: el nombre va DESPUÉS ("un actor conocido llamado X"). */
const ADJ = "(?: (?:reconocido|reconocida|conocido|conocida|famoso|famosa|joven|directo|directa|local|veterano|veterana|anónimo|anónima|mayor|de moda))?";

const role = (r: NpcRole) => (player: Player) => getNpcName(player, r);

function makeRule(
  key: string,
  noun: string,
  name: MentionRule["name"],
  style: MentionRule["style"],
  opts: { adj?: boolean; extraExclusion?: string } = {},
): MentionRule {
  const n = opts.adj ? `${noun}${ADJ}` : noun;
  const exclusion = opts.extraExclusion ?? NOT_NAMED;
  return {
    key,
    re: new RegExp(`${L}(${n})${E}${exclusion}`, "u"),
    namedRe: new RegExp(
      style === "llamado"
        ? `${L}(?:${n})${E}\\s+llamad[oa]\\s+[A-ZÁÉÍÓÚÑ]`
        : `${L}(?:${n})${E}\\s+[A-ZÁÉÍÓÚÑ]`,
      "u",
    ),
    name,
    style,
  };
}

const MENTION_RULES: MentionRule[] = [
  makeRule("entrenador", "(?:[Ee]l|[Tt]u) (?:míster|entrenador|técnico)", role("entrenador"), "append"),
  makeRule("capitan", "[Ee]l capitán", role("capitan"), "append"),
  makeRule("fisio", "(?:[Ee]l|[Tt]u) (?:fisio|fisioterapeuta|masajista)", role("fisio"), "append"),
  makeRule("preparador", "[Ee]l preparador físico", role("preparador"), "append"),
  makeRule("utillero", "[Ee]l utillero", role("utillero"), "append"),
  makeRule("director_deportivo", "[Ee]l director deportivo", role("director_deportivo"), "append"),
  makeRule("presidente", "[Ee]l presidente", role("presidente"), "append", {
    extraExclusion: "(?!\\s+(?:de|del|federativo|llamad[oa]|[A-ZÁÉÍÓÚÑ]))",
  }),
  makeRule("madre", "[Tt]u madre", role("madre"), "append"),
  makeRule("padre", "[Tt]u padre", role("padre"), "append"),
  makeRule("hermano", "[Tt]u hermano pequeño", role("hermano"), "append"),
  makeRule("cunado", "[Tt]u cuñado", role("cunado"), "append"),
  makeRule("amigo", "[Tt]u mejor amigo(?: de la infancia)?", role("amigo"), "append"),
  makeRule(
    "agente",
    "(?:[Ee]l|[Tt]u) (?:representante|agente)",
    (player) => {
      const a = player.agent_name ?? "";
      return a && !/^(Tu |Sin |Nueva )/.test(a) ? a : null;
    },
    "append",
  ),
  // Compañeros de equipo y gente que aparece sin nombre
  makeRule("companero", "[Uu]n compañero", (p, salt) => getTeammateName(p, salt), "llamado", { adj: true }),
  makeRule("veterano", "[Uu]n veterano", (p, salt) => getTeammateName(p, salt + "v"), "llamado", { adj: true }),
  makeRule("canterano", "[Uu]n (?:canterano|juvenil)", (p, salt) => getTeammateName(p, salt + "c"), "llamado", { adj: true }),
  makeRule("rival", "[Uu]n rival", (p, salt) => getPersonName(p, salt + "r", "m"), "llamado", { adj: true }),
  makeRule("periodista", "[Uu]n periodista", (p, salt) => getPersonName(p, salt + "p", "m"), "llamado", { adj: true }),
  makeRule("periodista_f", "[Uu]na periodista", (p, salt) => getPersonName(p, salt + "pf", "f"), "llamado", { adj: true }),
  makeRule("aficionado", "[Uu]n aficionado", (p, salt) => getPersonName(p, salt + "a", "m"), "llamado", { adj: true }),
  makeRule("empresario", "[Uu]n (?:empresario|directivo)", (p, salt) => getPersonName(p, salt + "e", "m"), "llamado", { adj: true }),
  makeRule("nino", "[Uu]n niño", (p, salt) => getPersonName(p, salt + "n", "m"), "llamado"),
  // Famosos e influencers (nombres artísticos inventados)
  makeRule("cantante", "[Uu]n cantante", (p, salt) => getCelebrityName(p, "cantante", salt, "m"), "llamado", { adj: true }),
  makeRule("cantante_f", "[Uu]na cantante", (p, salt) => getCelebrityName(p, "cantante", salt, "f"), "llamado", { adj: true }),
  makeRule("influencer", "[Uu]n influencer", (p, salt) => getCelebrityName(p, "influencer", salt, "m"), "llamado", { adj: true }),
  makeRule("influencer_f", "[Uu]na influencer", (p, salt) => getCelebrityName(p, "influencer", salt, "f"), "llamado", { adj: true }),
  makeRule("streamer", "[Uu]n streamer", (p, salt) => getCelebrityName(p, "streamer", salt, "m"), "llamado", { adj: true }),
  makeRule("actor", "[Uu]n actor", (p, salt) => getCelebrityName(p, "actor", salt, "m"), "llamado", { adj: true }),
  makeRule("actriz", "[Uu]na actriz", (p, salt) => getCelebrityName(p, "actor", salt, "f"), "llamado", { adj: true }),
  makeRule("presentador", "[Uu]n presentador", (p, salt) => getCelebrityName(p, "presentador", salt, "m"), "llamado", { adj: true }),
  makeRule("presentadora", "[Uu]na presentadora", (p, salt) => getCelebrityName(p, "presentador", salt, "f"), "llamado", { adj: true }),
  makeRule("chef", "[Uu]n chef", (p, salt) => getCelebrityName(p, "chef", salt, "m"), "llamado", { adj: true }),
];

/** Menciones que YA llevan nombre en un texto (para no volver a nombrarlas). */
function alreadyNamedKeys(text: string): Set<string> {
  const found = new Set<string>();
  for (const rule of MENTION_RULES) if (rule.namedRe.test(text)) found.add(rule.key);
  return found;
}

/** Pone nombre y apellidos a la PRIMERA mención de cada personaje dentro de un bloque de texto. */
function nameFirstMentions(texts: string[], player: Player, done: Set<string>, salt: string): string[] {
  return texts.map((text) => {
    let out = text;
    for (const rule of MENTION_RULES) {
      if (done.has(rule.key)) continue;
      const match = out.match(rule.re);
      if (!match || match.index === undefined) continue;
      // "Nadia Solaris, una influencer...": ya viene nombrada justo delante
      if (rule.style === "llamado" && /[A-ZÁÉÍÓÚÑ]\p{L}+ [A-ZÁÉÍÓÚÑ]\p{L}+,\s*$/u.test(out.slice(0, match.index))) {
        done.add(rule.key);
        continue;
      }
      const name = rule.name(player, `${salt}:${rule.key}`);
      if (!name) continue;
      out = out.replace(rule.re, rule.style === "llamado" ? `$1 llamad${/^[Uu]na /.test(match[1]) ? "a" : "o"} ${name}` : `$1 ${name}`);
      done.add(rule.key);
    }
    return out;
  });
}

/**
 * Da nombre y apellidos a los personajes que salen en un evento ("el
 * míster" → "el míster Tomás Bilbao Roca", "un compañero" → "un
 * compañero llamado Iván Roca Solera"). Se aplica al MOSTRAR y al
 * RESOLVER un evento (no al generarlo): así vale para cualquier origen
 * (eventos escritos a mano, de código o de la IA) sin tocar cada texto.
 * Es idempotente: una mención ya seguida de un nombre no se toca. La
 * primera mención se busca primero en la escena (no en el título, que
 * queda mejor corto) y cada texto de resultado, que se lee en otra
 * pantalla, se nombra por separado. La semilla incluye el id del evento:
 * "un compañero" es alguien distinto en cada escena, pero el mismo si se
 * recarga la página.
 */
/** Las escenas de la IA llevan id "<prefijo>-<timestamp>-<aleatorio>": ya traen sus propios nombres con apellidos. */
const AI_EVENT_ID = /-\d{10,}-[a-z0-9]{4,}$/;

export function personalizeEvent<T extends GameEvent>(rawEvent: T, player: Player): T {
  const event = replaceFixedNames(rawEvent, player);
  // Una escena de IA ya nombró a sus personajes (COMMON_RULES): ponerles además
  // "llamado X" daba dos nombres distintos para la misma persona en el título y
  // en el texto (visto en una partida de prueba: "Un veterano llamado Ismael
  // Roca..." cuyo texto hablaba de Gaspar Espinosa).
  if (AI_EVENT_ID.test(event.id)) return event;
  const salt = event.id;
  const done = alreadyNamedKeys(JSON.stringify(event));

  const optionTexts = event.options.flatMap((o) => [o.label ?? "", o.subtitle ?? ""]);
  const [description, freeTextPrompt, ...optOut] = nameFirstMentions(
    [event.description, event.freeTextPrompt ?? "", ...optionTexts],
    player,
    done,
    salt,
  );
  const [title] = nameFirstMentions([event.title], player, done, salt);

  const options = event.options.map((o, i) => {
    const next = { ...o, label: optOut[i * 2] ?? o.label, subtitle: optOut[i * 2 + 1] ?? o.subtitle };
    if (o.resolve) {
      const succText = o.resolve.success.text;
      const failText = o.resolve.fail.text;
      const [succ] = nameFirstMentions([succText], player, alreadyNamedKeys(succText), `${salt}:${o.id}:s`);
      const [fail] = nameFirstMentions([failText], player, alreadyNamedKeys(failText), `${salt}:${o.id}:f`);
      next.resolve = {
        ...o.resolve,
        success: { ...o.resolve.success, text: succ },
        fail: { ...o.resolve.fail, text: fail },
      };
    }
    return next;
  });

  return { ...event, title, description, freeTextPrompt: event.freeTextPrompt ? freeTextPrompt : event.freeTextPrompt, options };
}

/**
 * Qué roles del reparto fijo aparecen mencionados en un texto YA
 * personalizado (título + descripción de un evento) — reutiliza los
 * mismos patrones que ponen nombre a "el míster"/"tu madre", así que un
 * personaje solo se detecta si de verdad habla o aparece en la escena, no
 * en cualquier evento al azar. Pensado para decidir qué cara mostrar
 * junto al evento (ver npcFaces.ts); no todo rol devuelto aquí tiene cara
 * asignada, eso lo filtra quien llama a esta función.
 */
export function detectMentionedRoles(event: Pick<GameEvent, "title" | "description">, player: Player): NpcRole[] {
  const text = `${event.title} ${event.description}`;
  const found = new Set<NpcRole>();
  for (const rule of MENTION_RULES) {
    if (rule.re.test(text) || rule.namedRe.test(text)) found.add(rule.key as NpcRole);
  }
  const parejaName = typeof player.flags?.pareja === "string" ? player.flags.pareja : null;
  if (parejaName && text.includes(parejaName)) found.add("pareja");
  return [...found];
}
