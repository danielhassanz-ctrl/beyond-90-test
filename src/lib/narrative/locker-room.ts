/**
 * EL VESTUARIO COMO SISTEMA. Antes el vestuario era un número (rel_vestuario). Ahora es un grupo de personas: seis compañeros con
 * nombre, papel y manera de ser (el capitán, un veterano, un amigo, un joven de la cantera, el rival por tu puesto y un
 * polémico), cada uno con su relación contigo, repartidos en grupos (veteranos y jóvenes) que se miran entre sí. De todo eso sale el
 * ambiente del vestuario. Puedes dedicarles tiempo (charlar, cenar, pedir consejo, tender la mano) y las escenas de vestuario usan
 * a estas mismas personas y mueven su relación. Todo en código, sin IA.
 *
 * La relación de cada uno = una base (según su papel) + lo que sube o baja tu relación general con el vestuario + lo vivido
 * personalmente con él (flags vr_<club>_<clave>, un número que va de -40 a +40).
 */
import type { EventOption, GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getNpcName, fictionalPlayerName } from "@/lib/narrative/npcs";

type Flags = Record<string, string | boolean>;

export type MateRole = "capitan" | "veterano" | "amigo" | "joven" | "rival" | "polemico";
export type MateGroup = "veteranos" | "jovenes";

export interface Mate {
  key: MateRole;
  name: string;
  role: MateRole;
  roleLabel: string;
  group: MateGroup;
  age: number;
  blurb: string;
  /** Relación contigo, de 0 a 100. */
  rel: number;
  /** Lo vivido personalmente con él (-40..40). */
  personal: number;
}

const ROLE_LABEL: Record<MateRole, string> = {
  capitan: "Capitán",
  veterano: "Veterano",
  amigo: "Tu amigo en el vestuario",
  joven: "Joven de la cantera",
  rival: "Rival por tu puesto",
  polemico: "El polémico",
};

const BASE: Record<MateRole, number> = { capitan: 55, veterano: 55, amigo: 68, joven: 55, rival: 42, polemico: 47 };
const GROUP: Record<MateRole, MateGroup> = { capitan: "veteranos", veterano: "veteranos", amigo: "jovenes", joven: "jovenes", rival: "jovenes", polemico: "veteranos" };

const BLURBS: Record<MateRole, string[]> = {
  capitan: ["Habla poco y cuando habla, el vestuario escucha.", "Lleva el brazalete como si pesara menos de lo que pesa.", "El que apaga los incendios antes de que lleguen a la prensa."],
  veterano: ["Veterano de mil batallas: mete la mano en el fuego por quien se lo gana.", "Ha visto pasar a tres entrenadores y sigue de pie.", "Guarda un consejo para cada situación, y casi todos funcionan."],
  amigo: ["Con él es fácil: la conversación llega sola.", "El primero en reírse de tus chistes y el último en cotillear.", "Se conoce todos los bares de la ciudad que no salen en las guías."],
  joven: ["Ha subido de la cantera con hambre y la mochila a medio hacer.", "Te mira entrenar como quien estudia para un examen.", "Tiene un talento enorme y la cabeza todavía a pájaros."],
  rival: ["Juega en tu misma demarcación y se nota en cada rondo.", "Cordial por fuera, competitivo hasta el hueso por dentro.", "Quiere tu sitio, y no lo disimula demasiado."],
  polemico: ["Siempre tiene una opinión y casi nunca la guarda.", "Donde él está, algo pasa; casi nunca bueno.", "Talentoso, listo y con un don para meterse en líos."],
};

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return h >>> 0;
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;

const clubSlug = (club: string) => club.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export const personalKey = (club: string, key: MateRole) => `vr_${clubSlug(club)}_${key}`;

/** Los seis compañeros de tu club actual (estables para esa partida y ese club). */
export function getLockerRoom(player: Player): Mate[] {
  if (player.club === NO_CLUB_YET) return [];
  const flags = (player.flags ?? {}) as Flags;
  const age = playerAge(player.week);
  const general = player.rel_vestuario ?? 50;
  const ageOf: Record<MateRole, number> = { capitan: 30 + (hash(`${player.id}:${player.club}:ca`) % 5), veterano: 34 + (hash(`${player.id}:${player.club}:ve`) % 4), amigo: clamp(age + (hash(`${player.id}:${player.club}:am`) % 3) - 1, 18, 38), joven: 17 + (hash(`${player.id}:${player.club}:jo`) % 3), rival: clamp(age + (hash(`${player.id}:${player.club}:ri`) % 5) - 2, 18, 38), polemico: 26 + (hash(`${player.id}:${player.club}:po`) % 6) };
  return (Object.keys(ROLE_LABEL) as MateRole[]).map((role) => {
    const name = role === "capitan" ? getNpcName(player, "capitan") : fictionalPlayerName(`${player.id}:${player.club}:vr:${role}`, player.club, player.last_name);
    const personal = clamp(num(flags[personalKey(player.club, role)]), -40, 40);
    const jitter = (hash(`${player.id}:${player.club}:${role}:b`) % 11) - 5;
    const rel = clamp(Math.round(BASE[role] + jitter + (general - 50) * 0.6 + personal), 0, 100);
    const blurbs = BLURBS[role];
    return { key: role, name, role, roleLabel: ROLE_LABEL[role], group: GROUP[role], age: ageOf[role], blurb: blurbs[hash(`${player.id}:${player.club}:${role}:t`) % blurbs.length], rel, personal };
  });
}

export interface Mood {
  label: "Unido" | "Estable" | "Tenso" | "Roto";
  score: number;
  tone: "good" | "neutral" | "bad";
  line: string;
}

/** El ambiente del vestuario: la relación media (con más peso del capitán) y la distancia entre los dos grupos. */
export function lockerMood(player: Player): Mood {
  const room = getLockerRoom(player);
  if (room.length === 0) return { label: "Estable", score: 50, tone: "neutral", line: "Todavía no tienes vestuario." };
  const weight = (m: Mate) => (m.role === "capitan" ? 2 : 1);
  const total = room.reduce((n, m) => n + m.rel * weight(m), 0) / room.reduce((n, m) => n + weight(m), 0);
  const avg = (g: MateGroup) => {
    const l = room.filter((m) => m.group === g);
    return l.reduce((n, m) => n + m.rel, 0) / Math.max(1, l.length);
  };
  const gap = Math.abs(avg("veteranos") - avg("jovenes"));
  const score = Math.round(clamp(total - Math.max(0, gap - 12) * 0.5, 0, 100));
  if (score >= 70) return { label: "Unido", score, tone: "good", line: "Hay piña: se nota en los entrenamientos y en el autobús." };
  if (score >= 50) return { label: "Estable", score, tone: "neutral", line: "Sin problemas gordos, con sus corrillos de siempre." };
  if (score >= 32) return { label: "Tenso", score, tone: "bad", line: "Se nota el aire cargado: cada roce se vuelve una discusión." };
  return { label: "Roto", score, tone: "bad", line: "El vestuario está partido y todo el mundo lo sabe." };
}

/* ───────────── Dedicar tiempo a un compañero ───────────── */

export type MateActionId = "charlar" | "cenar" | "consejo" | "tender_mano";

export interface MateAction {
  id: MateActionId;
  label: string;
  hint: string;
  cost: number;
}

export const MATE_ACTIONS: Record<MateActionId, MateAction> = {
  charlar: { id: "charlar", label: "Charlar un rato", hint: "Gratis, sin riesgos", cost: 0 },
  cenar: { id: "cenar", label: "Invitarle a cenar", hint: "150 € · gana más, pero puede salir raro", cost: 150 },
  consejo: { id: "consejo", label: "Pedirle consejo", hint: "A los mayores les encanta", cost: 0 },
  tender_mano: { id: "tender_mano", label: "Tenderle la mano", hint: "Para limar una rivalidad", cost: 0 },
};

/** Qué acciones tiene sentido hacer con cada papel. */
export function actionsFor(role: MateRole): MateActionId[] {
  switch (role) {
    case "capitan":
    case "veterano":
      return ["charlar", "consejo", "cenar"];
    case "rival":
    case "polemico":
      return ["tender_mano", "charlar"];
    default:
      return ["charlar", "cenar"];
  }
}

export const MAX_ACTS_PER_TURN = 2;
export const MATE_COOLDOWN = 3;

export function actionBlocked(player: Player, key: MateRole, action: MateActionId): string | null {
  const flags = (player.flags ?? {}) as Flags;
  if (player.club === NO_CLUB_YET) return "Todavía no tienes vestuario.";
  if (!actionsFor(key).includes(action)) return "Esa no es una opción con él.";
  if (num(flags.vr_acts_week) === player.week && num(flags.vr_acts_n) >= MAX_ACTS_PER_TURN) return "Hoy ya has dedicado tiempo a dos compañeros: no se puede abarcar más.";
  const last = num(flags[`vr_last_${key}`]);
  if (last > 0 && player.week - last < MATE_COOLDOWN) return "Acabas de estar con él: dale unos días.";
  if (MATE_ACTIONS[action].cost > (player.patrimonio ?? 0)) return "No te llega para invitarle.";
  return null;
}

export interface MateActionResult {
  text: string;
  flags: Flags;
  /** Efectos sobre el jugador. */
  rel_vestuario: number;
  moral: number;
  patrimonio: number;
  ok: boolean;
}

/** Los dos grupos se miran entre sí: ganarte a un veterano enfría un poco a los jóvenes, y al revés. */
const GROUP_PENALTY = 1;

export function doMateAction(player: Player, key: MateRole, action: MateActionId, rng: () => number = Math.random): MateActionResult | { error: string } {
  const blocked = actionBlocked(player, key, action);
  if (blocked) return { error: blocked };
  const room = getLockerRoom(player);
  const mate = room.find((m) => m.key === key);
  if (!mate) return { error: "Ese compañero no está en tu vestuario." };
  const flags = (player.flags ?? {}) as Flags;
  const first = mate.name.split(" ")[0];
  let gain = 0;
  let ok = true;
  let text = "";
  let moral = 0;
  switch (action) {
    case "charlar":
      gain = 3 + Math.floor(rng() * 3);
      text = `Te sientas un rato con ${first} en el banco del vestuario. Habláis de nada y de todo: de la liga, de una serie, de lo mal que cocina el del catering. Cuando os levantáis, algo ha cambiado un poco.`;
      break;
    case "cenar":
      ok = rng() < 0.7;
      gain = ok ? 7 : 2;
      moral = ok ? 2 : 0;
      text = ok
        ? `Cenáis en un sitio pequeño, sin cámaras. ${first} acaba contando cosas que no cuenta a nadie y tú, otras. Pagas tú y no te deja pagar el postre. Salís siendo más amigos de lo que entrasteis.`
        : `La cena se tuerce: un tema espinoso, un silencio largo y una cuenta que llega antes de lo que querríais. ${first} se va educado y frío. No ha sido un desastre, pero tampoco lo que buscabas.`;
      break;
    case "consejo":
      gain = 4 + Math.floor(rng() * 3);
      moral = 2;
      text = `Le pides consejo a ${first} sobre cómo gestionar los malos momentos. Se toma un segundo, sonríe y te suelta tres frases que no olvidarás. A cambio, se le nota orgulloso de que le preguntes.`;
      break;
    case "tender_mano":
      ok = rng() < (mate.role === "rival" ? 0.62 : 0.55);
      gain = ok ? 6 : -2;
      text = ok
        ? `Te acercas a ${first} antes del entrenamiento y le dices que lo vuestro es de campo, no de personas. Se queda un segundo desconcertado y luego te da la mano. «Vale. Pero el puesto lo gano yo», dice, y sonríe. Es un principio.`
        : `Le tiendes la mano a ${first} y se queda mirándola un segundo de más. «Ahora no», dice, y se va. Quizá has llegado en mal momento. Quizá no.`;
      break;
  }
  const out: Flags = {
    [personalKey(player.club, key)]: String(clamp(mate.personal + gain, -40, 40)),
    [`vr_last_${key}`]: String(player.week),
    vr_acts_week: String(player.week),
    vr_acts_n: String(num(flags.vr_acts_week) === player.week ? num(flags.vr_acts_n) + 1 : 1),
  };
  // Política de grupos: lo que ganas con uno, lo notan los del otro lado.
  if (gain > 0 && (action === "cenar" || action === "consejo")) {
    for (const other of room.filter((m) => m.group !== mate.group && m.key !== key)) out[personalKey(player.club, other.key)] = String(clamp(other.personal - GROUP_PENALTY, -40, 40));
  }
  return { text, flags: out, rel_vestuario: gain >= 6 ? 1 : 0, moral, patrimonio: -MATE_ACTIONS[action].cost, ok };
}

/* ───────────── Cambios de relación desde las escenas (pseudo-bandera vr_delta) ───────────── */

/** «capitan:+4,rival:-6» → flags personales nuevos (los consume resolveEvent; la bandera vr_delta no se guarda). */
export function applyLockerDeltas(player: Pick<Player, "club" | "flags">, delta: string | boolean | undefined): Flags {
  if (typeof delta !== "string" || !delta) return {};
  const out: Flags = {};
  const flags = (player.flags ?? {}) as Flags;
  for (const part of delta.split(",")) {
    const [rawKey, rawN] = part.split(":");
    const key = rawKey?.trim() as MateRole;
    const n = parseInt(rawN ?? "", 10);
    if (!(key in ROLE_LABEL) || !Number.isFinite(n)) continue;
    const k = personalKey(player.club, key);
    out[k] = String(clamp(num(out[k] ?? flags[k]) + n, -40, 40));
  }
  return out;
}

/* ───────────── Escenas de vestuario con estas mismas personas ───────────── */

export function shouldTriggerLockerScene(player: Player, rng: () => number = Math.random): boolean {
  if (player.club === NO_CLUB_YET || player.status !== "active" || player.club.startsWith("SELECCIÓN:")) return false;
  if (playerAge(player.week) < 16 || player.week < 14) return false;
  const last = num(player.flags?.vr_scene_last);
  if (last > 0 && player.week - last < 7) return false;
  // Recién llegado: primero se conoce a la gente (escena de presentación del club).
  const since = num(player.flags?.club_since);
  if (since > 0 && player.week - since < 3) return false;
  return rng() < 0.45;
}

const opt = (id: string, label: string, subtitle: string, c: Record<string, number>, delta: string, text: string): EventOption => ({
  id,
  label,
  subtitle,
  consequences: { ...c, flags: { vr_delta: delta } },
  outcomeText: text,
});

const find = (room: Mate[], role: MateRole) => room.find((m) => m.key === role) as Mate;

const SCENES: { key: string; when: (room: Mate[], mood: Mood) => boolean; weight: number; build: (p: Player, room: Mate[]) => Omit<GameEvent, "id"> }[] = [
  {
    key: "pisa-rival",
    weight: 3,
    when: (room) => find(room, "rival").rel < 52,
    build: (_p, room) => {
      const r = find(room, "rival");
      const c = find(room, "capitan");
      const first = r.name.split(" ")[0];
      return {
        category: "vestuario",
        title: `${r.name} te pisa en pleno rondo`,
        description: `En el rondo de la mañana, ${r.name} (${r.age} años, tu rival por el puesto) llega tarde a un balón y te barre los tobillos con una sonrisa de «perdona». Es la tercera vez esta semana. Todo el vestuario mira. ${c.name}, el capitán, finge atarse la bota.`,
        options: [
          opt("a", "Pararle los pies delante de todos", "Un órdago", { rel_vestuario: -2, moral: 3, rel_entrenador: -1 }, "rival:-7,capitan:-2", `Le dices, bajito pero claro, que la próxima vez habrá otra conversación. ${first} se ríe, pero se le va la sonrisa. El rondo se enfría un segundo y luego continúa. Todos han tomado nota.`),
          opt("b", `Hablarlo con ${c.name.split(" ")[0]}, el capitán`, "Dejar que medie", { rel_vestuario: 2, moral: 1 }, "capitan:+4,rival:-1", `Esperas a la salida y se lo cuentas al capitán. Asiente despacio: «Déjalo de mi mano». Al día siguiente, ${first} te saluda con un cabeceo seco: ha recibido el mensaje.`),
          opt("c", "Ignorarlo y responderle en el campo", "Cabeza fría", { moral: -1, forma: 1 }, "rival:+2", `No contestas. Entrenas más fuerte y, en el siguiente rondo, le robas tres balones seguidos. Nadie dice nada, pero ${first} te mira distinto: con respeto, o con rabia, depende del día.`),
        ],
      };
    },
  },
  {
    key: "capitan-voz",
    weight: 2,
    when: (room) => find(room, "capitan").rel >= 58,
    build: (_p, room) => {
      const c = find(room, "capitan");
      const j = find(room, "joven");
      return {
        category: "vestuario",
        title: `${c.name} te pide que le ayudes con los jóvenes`,
        description: `${c.name}, el capitán, te retiene al salir del gimnasio: «Los chavales te miran. ${j.name}, el de la cantera, no abre la boca en el vestuario y se está comiendo la presión solo. Necesito alguien que no sea yo». Es un encargo, y es un halago.`,
        options: [
          opt("a", "Aceptar y tomar a los jóvenes bajo tu ala", "Un papel nuevo", { rel_vestuario: 3, moral: 2, rel_entrenador: 1 }, "capitan:+5,joven:+7,veterano:-1", `Empiezas por invitar a ${j.name.split(" ")[0]} a sentarse a tu lado en el autobús. Al segundo viaje ya te cuenta sus miedos. ${c.name.split(" ")[0]} te guiña un ojo desde el asiento de delante.`),
          opt("b", "Decir que prefieres ir a lo tuyo", "Sin responsabilidades", { moral: -1 }, "capitan:-4", `Lo agradeces, pero no. El capitán asiente sin enfadarse: «Cada uno elige su sitio». Pero algo se queda en el aire, como una puerta entornada que ya no se abre del todo.`),
        ],
      };
    },
  },
  {
    key: "cena-equipo",
    weight: 2,
    when: (_room, mood) => mood.score >= 52,
    build: (_p, room) => {
      const a = find(room, "amigo");
      const v = find(room, "veterano");
      return {
        category: "vestuario",
        title: "Cena de equipo: ¿dónde vamos?",
        description: `${a.name}, tu amigo en el vestuario, propone una cena del equipo antes del próximo parón. Los veteranos, con ${v.name} a la cabeza, quieren un asador tranquilo; los jóvenes, un sitio de moda con música. Alguien te mira a ti: «Tú decides, que eres de los dos bandos».`,
        options: [
          opt("a", "Un asador clásico, como quieren los veteranos", "Tradición", { rel_vestuario: 2, patrimonio: -300 }, "veterano:+5,capitan:+3,joven:-2,amigo:+1", `La cena es larga y sabrosa. ${v.name.split(" ")[0]} brinda por ti y los jóvenes aguantan con paciencia el segundo plato de cordero. Sales con la sensación de haber ganado a los mayores y haber decepcionado un poco a los pequeños.`),
          opt("b", "El sitio de moda de los jóvenes", "Aire nuevo", { rel_vestuario: 2, patrimonio: -450 }, "joven:+6,amigo:+4,veterano:-3", `El sitio es ruidoso y las raciones, diminutas. Los jóvenes están eufóricos. ${v.name.split(" ")[0]} pide otra cerveza en silencio. A los postres, alguien pone una canción y hasta el capitán mueve el pie.`),
          opt("c", "Dividir el equipo por la mitad con dos cenas", "Un lío de logística", { rel_vestuario: -1, moral: -1, patrimonio: -200 }, "capitan:-3", "Montas dos cenas en dos sitios. Acabáis corriendo de uno a otro con las chaquetas en la mano. Se arma una foto de equipo a medias y un chiste que durará semanas: «el que divide, no gana».")
        ],
      };
    },
  },
  {
    key: "polemico-lio",
    weight: 2,
    when: (room) => find(room, "polemico").rel < 65,
    build: (_p, room) => {
      const p = find(room, "polemico");
      const c = find(room, "capitan");
      const first = p.name.split(" ")[0];
      return {
        category: "vestuario",
        title: `${p.name} se mete en un lío y te mira a ti`,
        description: `${p.name} ha soltado en una entrevista algo que no debía sobre el míster, y el club ha convocado una reunión de urgencia. En el vestuario, nadie sabe de qué lado estar. ${first} te busca con la mirada: «Tú me entiendes, ¿no?».`,
        options: [
          opt("a", "Defenderle delante del equipo", "Lealtad", { rel_vestuario: 1, rel_entrenador: -3, moral: 1 }, "polemico:+8,capitan:-3", `Dices que cualquiera pierde los papeles alguna vez. ${first} te aprieta el hombro. El míster, al enterarse, te mira con la ceja levantada: te has puesto del lado de quien no debías.`),
          opt("b", "Pedirle que rectifique y pida perdón", "Responsabilidad", { rel_vestuario: 2, rel_entrenador: 2, moral: 1 }, `polemico:-5,capitan:+5`, `Se lo dices a solas y sin rodeos. ${first} bufa, pero ${c.name.split(" ")[0]} le respalda la idea y acaba escribiendo una nota de disculpa. El míster lo valora. ${first}, menos.`),
          opt("c", "Mantenerte al margen", "Prudencia", { moral: 0 }, "polemico:-2", `Dices que no sabes nada y que mejor que lo resuelvan ellos. Es verdad, y ${first} lo nota. Se aleja con gesto de «gracias por nada».`),
        ],
      };
    },
  },
  {
    key: "joven-ayuda",
    weight: 2,
    when: (room) => find(room, "joven").rel >= 45,
    build: (_p, room) => {
      const j = find(room, "joven");
      const first = j.name.split(" ")[0];
      return {
        category: "vestuario",
        title: `${j.name} te pide ayuda con un problema`,
        description: `${j.name}, el chaval de la cantera, te intercepta en el aparcamiento con la cara de quien no ha dormido. Se le ha complicado la vida fuera del fútbol (un piso, un agente que no le contesta, una novia que ya no aguanta los horarios) y no sabe a quién acudir. Tú eres, de pronto, el mayor que tiene a mano. Tienes diez minutos antes del entrenamiento.`,
        options: [
          opt("a", "Escucharle y ayudarle de verdad", "Tiempo y cabeza", { rel_vestuario: 3, moral: 2, forma: -1 }, "joven:+9,veterano:+1", `Os sentáis en el coche con el motor apagado. Escuchas y, cuando toca, le das el nombre de tu representante. ${first} sale del coche más ligero. Llega tarde al entrenamiento y tú, también, pero el míster no dice nada.`),
          opt("b", "Darle un consejo rápido y salir corriendo", "Poco tiempo", { moral: 0 }, "joven:+2", `Le sueltas dos frases de manual, le das una palmada y entras al campo. ${first} asiente, agradecido a medias. Al menos se ha sentido escuchado un minuto.`),
          opt("c", "Decirle que lo hable con el capitán", "Derivar", { rel_vestuario: 1 }, `joven:+1,capitan:+2`, `Lo mandas con ${find(room, "capitan").name.split(" ")[0]}. El capitán lo atiende con paciencia y luego te lo agradece: «Esas cosas me gusta saberlas». ${first} no lo olvida, aunque habría preferido que fueras tú.`),
        ],
      };
    },
  },
  {
    key: "veterano-consejo",
    weight: 1,
    when: (room) => find(room, "veterano").rel >= 50,
    build: (_p, room) => {
      const v = find(room, "veterano");
      const first = v.name.split(" ")[0];
      return {
        category: "vestuario",
        title: `${v.name} te cuenta cómo sobrevivió a su peor racha`,
        description: `En el viaje de vuelta, ${v.name} (${v.age} años) se sienta a tu lado sin que nadie se lo pida. Te cuenta, con esa voz baja de los que ya no tienen nada que demostrar, cómo estuvo seis meses sin marcar y estuvo a punto de dejarlo. Nunca se lo había contado a nadie del equipo. Te pregunta si quieres oírlo entero.`,
        options: [
          opt("a", "Escucharlo entero, sin mirar el móvil", "Aprender", { moral: 3, forma: 1, rel_vestuario: 1 }, "veterano:+8,capitan:+1", `Te lo cuenta todo: las noches sin dormir, la llamada a su padre, el entrenador que confió. Termina con una sola frase: «Lo único que de verdad importa es seguir apareciendo». Te la apuntas en el móvil esa misma noche.`),
          opt("b", "Contarle tú también lo que te pasa", "Abrirte", { moral: 2, rel_vestuario: 2 }, `veterano:+10`, `Le cuentas algo que no habías dicho a nadie. ${first} no te interrumpe. Al bajar del autobús te pone una mano en el hombro: «Aquí cuentas conmigo». Es una frase corta y vale más que cualquier mensaje de la directiva.`),
        ],
      };
    },
  },
];

export function buildLockerScene(player: Player, rng: () => number = Math.random): GameEvent | null {
  const room = getLockerRoom(player);
  if (room.length === 0) return null;
  const mood = lockerMood(player);
  const recent = String(player.flags?.vr_recent ?? "").split(",").filter(Boolean);
  // Cada plantilla sale como mucho 3 veces por carrera (la «Cena de equipo» llegaba a salir cinco veces).
  const uses = (k: string) => num((player.flags ?? {})[`vr_n_${k}`]);
  const fresh = SCENES.filter((s) => s.when(room, mood) && uses(s.key) < 3);
  const eligible = fresh.filter((s) => !recent.includes(s.key));
  const pool = eligible.length > 0 ? eligible : fresh;
  if (pool.length === 0) return null;
  const total = pool.reduce((n, s) => n + s.weight, 0);
  let r = rng() * total;
  let scene = pool[pool.length - 1];
  for (const s of pool) {
    r -= s.weight;
    if (r <= 0) {
      scene = s;
      break;
    }
  }
  const stamp: Flags = { vr_scene_last: String(player.week), vr_recent: [...recent, scene.key].slice(-3).join(","), [`vr_n_${scene.key}`]: String(uses(scene.key) + 1) };
  const built = scene.build(player, room);
  return {
    id: `vestuario-${scene.key}-${player.week}`,
    ...built,
    options: built.options.map((o) => ({ ...o, consequences: { ...o.consequences, flags: { ...(o.consequences.flags ?? {}), ...stamp } } })),
  };
}
