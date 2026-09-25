import type { Player } from "@/types/player";
import type { GameEvent } from "@/types/career";

/**
 * Personajes fijos del entorno del jugador — todos con nombre y apellidos
 * y con el MISMO nombre en cada escena de la carrera (el míster no se
 * llama distinto cada vez que sale). A diferencia de
 * secondary-characters.ts (personajes episódicos que la IA introduce),
 * estos existen desde el minuto uno.
 *
 * El nombre se deriva de un hash del id del jugador (y del club, para el
 * personal del club: cuando fichas, el míster, el capitán y el presidente
 * cambian; la familia y los amigos no) — determinista, sin guardar nada
 * ni gastar una escritura. Antes había solo 6 nombres por rol y 5 roles;
 * ahora es una combinación de nombre + dos apellidos (miles de posibles),
 * así que dos carreras casi nunca comparten reparto.
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
  | "ex";

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
  presidente: "m", utillero: "m", preparador: "m", madre: "f", padre: "m", hermano: "m", amigo: "m", pareja: "f", ex: "f",
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

export function getNpcName(player: Player, role: NpcRole): string {
  const seed = CLUB_BOUND.has(role) ? `${player.id}:${role}:${player.club}` : `${player.id}:${role}`;
  const gender = ROLE_GENDER[role] === "any" ? (mix(seed + ":g") % 2 === 0 ? "m" : "f") : ROLE_GENDER[role];
  const firstPool = gender === "f" ? FIRST_F : FIRST_M;
  const first = firstPool[mix(seed + ":n") % firstPool.length];
  const own = (player.last_name ?? "").toLowerCase();
  let s1 = SURNAMES[mix(seed + ":a") % SURNAMES.length];
  if (s1.toLowerCase() === own) s1 = SURNAMES[(SURNAMES.indexOf(s1) + 1) % SURNAMES.length];
  let s2 = SURNAMES[mix(seed + ":b") % SURNAMES.length];
  while (s2 === s1 || s2.toLowerCase() === own) s2 = SURNAMES[(SURNAMES.indexOf(s2) + 1) % SURNAMES.length];
  // Tu padre y tu hermano comparten tu primer apellido.
  if (role === "padre" || role === "hermano") s1 = player.last_name ?? s1;
  return `${first} ${s1} ${s2}`;
}

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
    `- Su madre: ${getNpcName(player, "madre")}`,
    `- Su padre: ${getNpcName(player, "padre")}`,
    `- Su hermano pequeño: ${getNpcName(player, "hermano")}`,
    `- Su mejor amigo de la infancia: ${getNpcName(player, "amigo")}`,
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
 * infancia): en todas las carreras eran la misma persona y sin
 * apellidos. Se sustituyen por el personaje de ESTE jugador (nombre y
 * apellidos), también dentro de las consecuencias — así la pareja que
 * queda guardada en flags.pareja ya lleva nombre completo.
 */
const FIXED_NAMES: Partial<Record<NpcRole, string>> = { pareja: "Lucía", ex: "Carla", amigo: "Diego" };

function replaceFixedNames<V>(value: V, player: Player): V {
  if (typeof value === "string") {
    let out: string = value;
    for (const [role, fixed] of Object.entries(FIXED_NAMES) as [NpcRole, string][]) {
      if (!out.includes(fixed)) continue;
      out = out.replace(new RegExp("(?<![\p{L}])" + fixed + "(?![\p{L}])", "gu"), getNpcName(player, role));
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

/** Cómo se dice cada rol en un texto, y el rol al que corresponde. */
const MENTION_RULES: { role: NpcRole; re: RegExp }[] = [
  { role: "entrenador", re: /(?<![\p{L}])((?:[Ee]l|[Tt]u) (?:míster|entrenador|técnico))(?![\p{L}])(?!\s+(?:de|del|rival|nacional|asistente|ayudante|[A-ZÁÉÍÓÚÑ]))/u },
  { role: "capitan", re: /(?<![\p{L}])([Ee]l capitán)(?![\p{L}])(?!\s+(?:de|del|rival|[A-ZÁÉÍÓÚÑ]))/u },
  { role: "fisio", re: /(?<![\p{L}])((?:[Ee]l|[Tt]u) (?:fisio|fisioterapeuta|masajista))(?![\p{L}])(?!\s+[A-ZÁÉÍÓÚÑ])/u },
  { role: "preparador", re: /(?<![\p{L}])([Ee]l preparador físico)(?![\p{L}])(?!\s+[A-ZÁÉÍÓÚÑ])/u },
  { role: "utillero", re: /(?<![\p{L}])([Ee]l utillero)(?![\p{L}])(?!\s+[A-ZÁÉÍÓÚÑ])/u },
  { role: "director_deportivo", re: /(?<![\p{L}])([Ee]l director deportivo)(?![\p{L}])(?!\s+(?:de|del|rival|[A-ZÁÉÍÓÚÑ]))/u },
  { role: "presidente", re: /(?<![\p{L}])([Ee]l presidente)(?![\p{L}])(?!\s+(?:de|del|federativo|[A-ZÁÉÍÓÚÑ]))/u },
  { role: "madre", re: /(?<![\p{L}])([Tt]u madre)(?![\p{L}])(?!\s+[A-ZÁÉÍÓÚÑ])/u },
  { role: "padre", re: /(?<![\p{L}])([Tt]u padre)(?![\p{L}])(?!\s+[A-ZÁÉÍÓÚÑ])/u },
  { role: "hermano", re: /(?<![\p{L}])([Tt]u hermano pequeño)(?![\p{L}])(?!\s+[A-ZÁÉÍÓÚÑ])/u },
];

/** Roles cuyo nombre completo ya aparece en un texto (para no volver a nombrarlos). */
function rolesAlreadyNamed(text: string, player: Player): Set<NpcRole> {
  const found = new Set<NpcRole>();
  for (const { role } of MENTION_RULES) if (text.includes(getNpcName(player, role))) found.add(role);
  return found;
}

/** Pone nombre y apellidos a la PRIMERA mención de cada personaje dentro de un bloque de texto. */
function nameFirstMentions(texts: string[], player: Player, done: Set<NpcRole>): string[] {
  return texts.map((text) => {
    let out = text;
    for (const { role, re } of MENTION_RULES) {
      if (done.has(role)) continue;
      const match = out.match(re);
      if (!match || match.index === undefined) continue;
      out = out.replace(re, `$1 ${getNpcName(player, role)}`);
      done.add(role);
    }
    return out;
  });
}

/**
 * Da nombre y apellidos a los personajes que salen en un evento ("el
 * míster" → "el míster Tomás Bilbao Roca"). Se aplica al MOSTRAR y al
 * RESOLVER un evento (no al generarlo): así vale para cualquier origen
 * (eventos escritos a mano, de código o de la IA) sin tocar cada texto.
 * Es idempotente: un personaje cuyo nombre ya aparece en el evento no se
 * vuelve a nombrar. La primera mención se busca primero en la escena (no
 * en el título, que queda mejor corto) y cada texto de resultado, que se
 * lee en otra pantalla, se nombra por separado.
 */
export function personalizeEvent<T extends GameEvent>(rawEvent: T, player: Player): T {
  const event = replaceFixedNames(rawEvent, player);
  const done = rolesAlreadyNamed(JSON.stringify(event), player);

  const optionTexts = event.options.flatMap((o) => [o.label ?? "", o.subtitle ?? ""]);
  const [description, freeTextPrompt, ...optOut] = nameFirstMentions(
    [event.description, event.freeTextPrompt ?? "", ...optionTexts],
    player,
    done,
  );
  const [title] = nameFirstMentions([event.title], player, done);

  const options = event.options.map((o, i) => {
    const next = { ...o, label: optOut[i * 2] ?? o.label, subtitle: optOut[i * 2 + 1] ?? o.subtitle };
    if (o.resolve) {
      const succText = o.resolve.success.text;
      const failText = o.resolve.fail.text;
      const [succ] = nameFirstMentions([succText], player, rolesAlreadyNamed(succText, player));
      const [fail] = nameFirstMentions([failText], player, rolesAlreadyNamed(failText, player));
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
