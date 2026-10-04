/**
 * Presentación gradual del reparto. Antes todos los personajes existían desde
 * el minuto uno y la IA conocía el reparto entero: salían del tirón y con un
 * nombre sin contexto ("Tomás Bilbao dice...", ¿quién es?). Ahora un
 * personaje solo "existe" para el jugador cuando se le ha PRESENTADO: la
 * primera vez que su nombre sale en una escena, esa escena trae una ficha
 * ("Quién es": rol y un detalle que lo hace memorable), y a partir de ahí ya
 * se le conoce. Como mucho se presentan 2-3 por escena y a la IA solo se le
 * da el reparto ya conocido (más, a lo sumo, uno por presentar).
 *
 * El estado vive en player.flags.cast_met (nombres separados por "|").
 */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import {
  getNpcName,
  getTeammateName,
  getCelebrityName,
  episodicNames,
  type NpcRole,
} from "@/lib/narrative/npcs";

export interface CastCard {
  name: string;
  role: string;
  blurb: string;
}

interface Entry {
  name: string;
  role: string;
  blurb: string;
  /** 1 = familia/representante, 2 = club, 3 = resto. Menor = se presenta antes. */
  priority: number;
  /** Personaje de una sola escena (no del reparto fijo). */
  episodic?: boolean;
}

function mix(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0;
}

const pick = <T,>(arr: readonly T[], seed: string): T => arr[mix(seed) % arr.length];

/** Detalles memorables por rol; la variante se elige por hash del jugador (siempre la misma para esa persona). */
const BLURBS: Record<string, string[]> = {
  entrenador: [
    "52 años, excentral de Segunda que aprendió el oficio en banquillos de tercera. Habla poco y lo apunta todo en una libreta de tapas rojas.",
    "47 años y obsesionado con la presión alta. Dicen que ha visto más vídeo de rivales que cine en toda su vida.",
    "58 años, viejo zorro de mil batallas. Se sabe el nombre de todos los utilleros de Primera y no perdona un retraso.",
    "44 años, el técnico más joven de la plantilla técnica. Viste siempre de chándal y entrena con las mismas zapatillas desde hace años.",
    "55 años, de los que nunca levantan la voz porque no hace falta: cuando se calla, todos saben que algo va mal.",
  ],
  capitan: [
    "34 años, central y capitán desde hace seis temporadas. Es el primero en llegar y el último en irse, y tiene un mote para cada uno.",
    "31 años, el cerebro del centro del campo. Se le tiene por serio, pero organiza las bromas más elaboradas del vestuario.",
    "36 años y a punto de despedirse. Lleva diez años en el club y lo trata como si fuera su casa.",
    "33 años, portero y capitán. Grita más que nadie en el campo y es el más tierno fuera de él.",
  ],
  rival_puesto: [
    "26 años, tu competencia directa en el puesto. Muy bueno, muy callado, y siempre el último en irse del gimnasio.",
    "29 años, veterano de tu demarcación. Tiene la titularidad y no piensa regalarla a nadie.",
    "23 años, fichado hace un año con mucha prensa. Se nota que quiere tu sitio, aunque lo disimula con educación.",
  ],
  fisio: [
    "45 años, fisioterapeuta del club. Cuenta chistes malos mientras te manipula la rodilla para que no pienses en el dolor.",
    "38 años, con manos de hierro y paciencia infinita. Tiene una libreta con la historia clínica de cada jugador desde hace diez años.",
    "50 años, el que sabe todos los secretos del vestuario porque se los cuentan en la camilla.",
  ],
  preparador: [
    "41 años, preparador físico. Cronómetro al cuello y una sonrisa que da miedo cuando dice \"último esfuerzo\".",
    "36 años, exatleta olímpico. Cuando mide tu salto, ya sabe cuánto has dormido.",
    "49 años, con un método propio de cuerdas, conos y respiración que nadie entiende hasta que funciona.",
  ],
  director_deportivo: [
    "55 años, director deportivo. Pasa más horas en un avión que en su despacho y nunca revela dónde ha estado.",
    "48 años, ex jugador del club. Conoce a los agentes mejor que a su familia y negocia siempre con una sonrisa.",
    "60 años, el de los fichajes imposibles. Dicen que ha firmado a medio equipo en un restaurante.",
  ],
  presidente: [
    "63 años, empresario del ladrillo y presidente del club. Se aprende el nombre de cada jugador y lo repite en voz alta para impresionar.",
    "58 años, abogado, con un discurso para cada ocasión. En el palco se le ve más nervioso que a los aficionados.",
    "67 años, el presidente de toda la vida. Las paredes de su despacho son un museo de fotos con leyendas del club.",
  ],
  utillero: [
    "62 años, utillero del club desde hace cuarenta. Dobla la ropa como si fuera sagrada y lo ha visto todo.",
    "55 años, siempre con un silbato colgado y una radio vieja. Sabe qué jugador llegará tarde antes de que aparezca.",
  ],
  prensa: [
    "40 años, periodista de cabecera del club. Pregunta siempre lo único que no quieres que te pregunten, con una sonrisa educada.",
    "35 años, directo y sin rodeos. Escribe titulares que a veces escuecen y a veces te hacen reír.",
    "52 años, cronista de toda la vida. Ha escrito más veces sobre el club que cualquier hincha ha ido al estadio.",
  ],
  madre: [
    "La mujer que te llevó a todos los entrenamientos. Tiene un tupper para cada ocasión y una opinión sobre cada tarjeta amarilla.",
    "Cose, cocina y no se pierde ningún partido, aunque lo vea con los ojos medio cerrados. Para ella, siempre serás un crío.",
  ],
  padre: [
    "Te ha acompañado desde el primer balón. Tiene un cuaderno donde apunta todos tus partidos desde los ocho años.",
    "Trabaja con las manos y habla poco. Lo que no dice con palabras lo dice con la forma de abrazarte después de un partido.",
  ],
  hermano: [
    "Tu hermano pequeño. Tiene tu camiseta del primer equipo, aunque le queda por las rodillas, y jura que va a superarte.",
    "Más listo que tú, aunque no lo admitirá. Te sigue por todas partes con un balón bajo el brazo.",
  ],
  cunado: [
    "Tu cuñado. Entrenador de sofá y especialista en negocios \"infalibles\". Lo quiere todo el mundo y nadie le hace caso.",
    "Tu cuñado. Siempre llega a las comidas familiares con una teoría nueva sobre fútbol, política y rotondas.",
  ],
  amigo: [
    "Tu mejor amigo de la infancia. Dejó el fútbol cuando tú seguiste, y a veces se le nota en la mirada, aunque jamás lo dice.",
    "El que compartía bocadillo contigo en el recreo. Sigue llamándote por tu apodo del colegio delante de cualquiera.",
  ],
  agente: [
    "Tu representante. Siempre con dos móviles y una frase hecha: \"esto es una oportunidad\". Le debes más de lo que parece.",
  ],
  pareja: [
    "Tu pareja. La persona con la que hablas cuando el fútbol deja de tener sentido.",
  ],
  compañero: [
    "Compañero de vestuario. Es de los que siempre tienen un chiste preparado y llegan los primeros al entrenamiento.",
    "Compañero de equipo, callado en el vestuario y terrible con el balón en los pies. Sus bromas llegan siempre con retraso.",
    "Compañero de equipo. Lleva años en el club y conoce todas las historias del vestuario, aunque se las guarda.",
    "Compañero de equipo. Siempre tiene hambre, siempre llega tarde y siempre te saca una sonrisa.",
  ],
  famoso: [
    "Famoso del momento. Más conocido por sus redes que por su trabajo, aunque en persona resulta más sencillo de lo que parece.",
  ],
};

const EPISODIC_HINTS: { match: RegExp; role: string; blurb: string[] }[] = [
  { match: /periodista|press/i, role: "Periodista", blurb: ["Periodista de la zona, con la grabadora siempre encendida y una pregunta incómoda guardada.", "Cronista con mucho oficio. Pregunta como quien no quiere la cosa y siempre acaba sabiendo más de lo que dices."] },
  { match: /vet|veterano/i, role: "Veterano del vestuario", blurb: ["Veterano del vestuario. Lleva más temporadas en el club que casi nadie, y lo ha visto todo.", "Uno de los pesos pesados del equipo. Habla poco, pero cuando lo hace, todos escuchan."] },
  { match: /room|habitaci/i, role: "Compañero de habitación", blurb: ["Compañero de habitación en las concentraciones. Ronca, comenta cada partido en voz alta y es buenísima persona."] },
  { match: /kid|nino|chaval|canter/i, role: "Chaval de la cantera", blurb: ["Chaval del juvenil que sube a entrenar con el primer equipo. Te mira como si fueras un héroe y todavía no sabe esconderlo."] },
  { match: /legend|leyenda/i, role: "Leyenda retirada", blurb: ["Leyenda del club ya retirada. Cuando entra en el vestuario, hasta los veteranos se levantan."] },
  { match: /doppel|doble/i, role: "Tu doble", blurb: ["Alguien idéntico a ti hasta en el gesto al calentar. Se hizo famoso sin quererlo."] },
  { match: /stranger|fan|aficion/i, role: "Aficionado", blurb: ["Aficionado de los de siempre, con bufanda en pleno verano y cánticos a medio memorizar."] },
  { match: /agent|agente/i, role: "Agente", blurb: ["Representante de otra agencia, con traje impecable y demasiadas llamadas perdidas."] },
  { match: /girl|dm|chica/i, role: "Mensaje en redes", blurb: ["Alguien que te escribe por redes con más seguridad de la que parece."] },
  { match: /psych|psic/i, role: "Psicóloga del club", blurb: ["Psicóloga deportiva del club. Hace preguntas que no esperas y escucha sin juzgar."] },
  { match: /director|directiv|sponsor/i, role: "Directivo", blurb: ["Directivo del club, siempre con una carpeta bajo el brazo y una cifra en la cabeza."] },
  { match: /famoso/i, role: "Famoso/a", blurb: BLURBS.famoso },
  { match: /^compañero/i, role: "Compañero de equipo", blurb: BLURBS.compañero },
  { match: /./, role: "Persona de tu entorno", blurb: ["Alguien de tu entorno del que todavía sabes poco, pero que parece tener historia."] },
];

function ageFor(seed: string, min: number, max: number): number {
  return min + (mix(seed) % (max - min + 1));
}

/** El reparto fijo del jugador con ficha: staff del club, familia, representante y 12 compañeros. */
function buildRegistry(player: Player): Entry[] {
  const roles: [NpcRole, string, string, number][] = [
    ["entrenador", "Entrenador", "entrenador", 2],
    ["capitan", "Capitán", "capitan", 2],
    ["rival_puesto", "Compañero que compite por tu puesto", "rival_puesto", 2],
    ["fisio", "Fisioterapeuta", "fisio", 2],
    ["preparador", "Preparador físico", "preparador", 2],
    ["director_deportivo", "Director deportivo", "director_deportivo", 2],
    ["presidente", "Presidente del club", "presidente", 2],
    ["utillero", "Utillero", "utillero", 2],
    ["prensa", "Periodista de cabecera", "prensa", 3],
    ["madre", "Tu madre", "madre", 1],
    ["padre", "Tu padre", "padre", 1],
    ["hermano", "Tu hermano pequeño", "hermano", 1],
    ["cunado", "Tu cuñado", "cunado", 3],
    ["amigo", "Tu mejor amigo de la infancia", "amigo", 3],
  ];
  const entries: Entry[] = roles.map(([role, label, bankKey, priority]) => {
    const name = getNpcName(player, role);
    return { name, role: label, blurb: pick(BLURBS[bankKey], `${player.id}:${role}:${player.club}`), priority };
  });
  for (let i = 1; i <= 12; i++) {
    const name = getTeammateName(player, `squad${i}`);
    const age = ageFor(`${player.id}:squad${i}`, 19, 35);
    entries.push({
      name,
      role: "Compañero de equipo",
      blurb: `${age} años. ${pick(BLURBS.compañero, `${player.id}:squad${i}:${player.club}`)}`,
      priority: 3,
    });
  }
  const celebs: [string, string][] = [
    ["cantante", "Cantante"], ["influencer", "Influencer"], ["streamer", "Streamer"], ["actor", "Actor"], ["presentador", "Presentadora"],
  ];
  for (const [kind, label] of celebs) {
    const gender = kind === "cantante" || kind === "presentador" ? "f" : "m";
    entries.push({
      name: getCelebrityName(player, kind as "cantante", "cast", gender),
      role: `${label} (famoso/a del mundo del jugador)`,
      blurb: pick(BLURBS.famoso, `${player.id}:${kind}`),
      priority: 3,
    });
  }
  return entries;
}

/** Nombres ya presentados (flag cast_met) más los que el jugador ya conoce por otras vías. */
export function metNames(player: Pick<Player, "flags" | "agent_name">): Set<string> {
  const met = new Set(String(player.flags?.cast_met ?? "").split("|").filter(Boolean));
  if (player.agent_name && !/^(Tu |Sin |Nueva )/.test(player.agent_name)) met.add(player.agent_name);
  if (typeof player.flags?.pareja === "string" && player.flags.pareja) met.add(player.flags.pareja);
  return met;
}

function allCandidates(player: Player): Map<string, Entry> {
  const map = new Map<string, Entry>();
  for (const e of buildRegistry(player)) map.set(e.name, e);
  // Personajes episódicos: gente que solo aparece una vez (un periodista, un aficionado...). Ficha
  // genérica pero con detalle, derivada del nombre y del contexto con el que se generó.
  for (const [name, hint] of episodicNames) {
    if (map.has(name)) continue;
    const spec = EPISODIC_HINTS.find((h) => h.match.test(hint))!;
    map.set(name, { name, role: spec.role, blurb: `${ageFor(`${name}:age`, 21, 62)} años. ${pick(spec.blurb, name)}`, priority: 4, episodic: true });
  }
  return map;
}

/**
 * Fichas de los personajes que salen NOMBRADOS en esta escena y el jugador
 * aún no conoce (máximo 3 por escena, familia y club primero).
 */
export function introduceCast(
  event: Pick<GameEvent, "title" | "description" | "options">,
  player: Player,
): CastCard[] {
  const text = [event.title, event.description, ...event.options.flatMap((o) => [o.label ?? "", o.subtitle ?? ""])].join("\n");
  const met = metNames(player);
  const found: { entry: Entry; pos: number }[] = [];
  for (const entry of allCandidates(player).values()) {
    if (met.has(entry.name)) continue;
    const pos = text.indexOf(entry.name);
    if (pos >= 0) found.push({ entry, pos });
  }
  found.sort((a, b) => a.entry.priority - b.entry.priority || a.pos - b.pos);
  // Del reparto fijo, hasta 3 fichas por escena. De la gente de una sola escena
  // (un compañero suelto, un veterano) solo se ficha a UNA, y solo si es del
  // vestuario: el resto ya viene descrito en el propio texto ("un periodista
  // llamado...") y llenar cada escena de fichas era ruido.
  const cast = found.filter((f) => !f.entry.episodic).slice(0, 3);
  const peerHint = /^(Compañero de equipo|Veterano del vestuario|Compañero de habitación)$/;
  const peer = cast.length < 3 ? found.find((f) => f.entry.episodic && peerHint.test(f.entry.role)) : undefined;
  return [...cast, ...(peer ? [peer] : [])].map(({ entry }) => ({ name: entry.name, role: entry.role, blurb: entry.blurb }));
}

/** Valor del flag cast_met tras presentar estas fichas. */
export function markCastMet(flags: Record<string, string | boolean> | null | undefined, cards: CastCard[]): string {
  const met = new Set(String(flags?.cast_met ?? "").split("|").filter(Boolean));
  for (const c of cards) met.add(c.name);
  // evita que el flag crezca sin límite en carreras muy largas
  return [...met].slice(-500).join("|");
}

/**
 * El reparto para la IA: SOLO los personajes ya presentados, más a lo sumo UNO
 * por presentar (con instrucción de describirlo). Antes se le pasaba el
 * reparto entero y la IA mencionaba a gente que el jugador no había visto en
 * su vida.
 */
export function describeKnownCast(player: Player): string {
  const met = metNames(player);
  const registry = buildRegistry(player);
  const known = registry.filter((e) => met.has(e.name));
  const lines: string[] = [];
  const byRole = (role: string) => known.filter((e) => e.role === role).map((e) => e.name);
  const named: [string, string][] = [
    ["Entrenador del club", "Entrenador"],
    ["Capitán", "Capitán"],
    ["Compañero que compite por su puesto", "Compañero que compite por tu puesto"],
    ["Fisioterapeuta", "Fisioterapeuta"],
    ["Preparador físico", "Preparador físico"],
    ["Director deportivo", "Director deportivo"],
    ["Presidente del club", "Presidente del club"],
    ["Utillero", "Utillero"],
    ["Periodista de cabecera", "Periodista de cabecera"],
    ["Su madre", "Tu madre"],
    ["Su padre", "Tu padre"],
    ["Su hermano pequeño", "Tu hermano pequeño"],
    ["Su cuñado", "Tu cuñado"],
    ["Su mejor amigo de la infancia", "Tu mejor amigo de la infancia"],
  ];
  for (const [label, role] of named) {
    const names = byRole(role);
    if (names.length) lines.push(`- ${label}: ${names.join(", ")}`);
  }
  const mates = byRole("Compañero de equipo");
  if (mates.length) lines.push(`- Compañeros de vestuario que ya conoce: ${mates.join("; ")}`);
  if (player.agent_name) lines.push(`- Su representante: ${player.agent_name}`);
  if (typeof player.flags?.pareja === "string" && player.flags.pareja) lines.push(`- Su pareja: ${player.flags.pareja}`);

  const unmet = registry
    .filter((e) => !met.has(e.name) && e.priority <= 2)
    .sort((a, b) => a.priority - b.priority)[0];
  const intro = unmet
    ? `\nPUEDES PRESENTAR A UNO DE ELLOS en esta escena, nunca más de uno: ${unmet.role}, ${unmet.name} (${unmet.blurb}). Si lo haces, en su PRIMERA mención di claramente quién es y qué hace en la vida del jugador, con un detalle concreto.`
    : "";
  return `${lines.join("\n") || "- (el jugador todavía no conoce a nadie de su entorno por su nombre)"}
REGLA SOBRE PERSONAJES: usa SOLO los nombres de esta lista (ya los conoce) y, como mucho, presenta a uno nuevo. Está PROHIBIDO mencionar por su nombre a cualquier otra persona del entorno del jugador (míster, capitán, compañeros, familia...) sin haberla presentado antes. Cualquier persona nueva que inventes (un periodista, un vecino, un directivo...) se presenta SIEMPRE en su primera mención con quién es y un detalle (ej.: "Rubén Cano, un periodista local que le sigue desde juveniles"). Nada de nombres sueltos sin explicar.${intro}`;
}
