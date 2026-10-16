/**
 * LA PRENSA Y LAS REDES COMO SISTEMA. Antes la prensa era una frase suelta en la cabecera y las escenas de redes, sueltas. Ahora hay
 * tres medios con nombre y periodista (uno afín, uno neutral y uno hostil), cada uno con su relación contigo; un clima mediático que
 * sale de ellos; una narrativa (cómo te cuentan: promesa, ídolo, polémico…); un número de seguidores que crece con tu fama y con lo
 * que publicas; y acciones tuyas (exclusivas, publicar, responder a un crítico). Las escenas de prensa usan a estos mismos medios y
 * mueven su relación, y la prensa devuelve algo: un medio hostil cuando vas mal te quita afición; uno afín cuando vas bien te da fama.
 * Todo en código, sin IA.
 *
 * Relación con cada medio = base según su papel + efecto de tu fama, tu forma y tu afición + lo vivido (flags pr_<papel>, -40..40).
 * El empuje de redes (rs, en %) multiplica los seguidores.
 */
import type { EventOption, GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { cityOfClub } from "@/lib/narrative/cities";
import { getNpcName, fictionalPlayerName } from "@/lib/narrative/npcs";

type Flags = Record<string, string | boolean>;

export type OutletKey = "afin" | "neutral" | "hostil";

export interface Outlet {
  key: OutletKey;
  name: string;
  kindLabel: string;
  journalist: string;
  blurb: string;
  rel: number;
  personal: number;
}

const KIND: Record<OutletKey, string> = { afin: "Diario deportivo", neutral: "Televisión", hostil: "Tertulia nocturna" };
const BASE: Record<OutletKey, number> = { afin: 60, neutral: 50, hostil: 36 };
const NAMES: Record<OutletKey, string[]> = {
  afin: ["Marcador Diario", "El Diario del Balón", "La Crónica Deportiva", "Gol y Mañana"],
  neutral: ["Canal Fútbol 24", "Estadio TV", "Deportes en Directo", "Línea Deportiva"],
  hostil: ["La Barra de la Grada", "Línea de Fondo", "La Tertulia de Medianoche", "El Córner Caliente"],
};
const BLURBS: Record<OutletKey, string[]> = {
  afin: ["Te cuida: te tratan como a uno de casa.", "Te dan portadas buenas y titulares con cariño.", "Siempre te dan el beneficio de la duda."],
  neutral: ["Cuentan lo que pasa, sin más. Les gusta la audiencia.", "Mandan micrófonos a la salida y no se casan con nadie.", "Dan el partido, el resultado y un buen resumen."],
  hostil: ["Viven de la polémica y te han echado el ojo.", "Un tertuliano te ha declarado la guerra y lo disfruta.", "Cada fallo tuyo es un titular para ellos."],
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
export const outletKey = (k: OutletKey) => `pr_${k}`;

/** Los tres medios que te siguen (estables en la partida). */
export function getPress(player: Player): Outlet[] {
  const flags = (player.flags ?? {}) as Flags;
  const fama = player.fama ?? 0;
  const forma = player.forma ?? 60;
  const aficion = player.rel_aficion ?? 50;
  const city = cityOfClub(player.club);
  return (["afin", "neutral", "hostil"] as OutletKey[]).map((key) => {
    const personal = clamp(num(flags[outletKey(key)]), -40, 40);
    const jitter = (hash(`${player.id}:pr:${key}`) % 9) - 4;
    // El afín se alegra de tu fama; el hostil reacciona a tu forma (si vas mal, aprieta); el neutral sigue a la afición.
    const climate = key === "afin" ? (fama - 40) * 0.08 + (aficion - 50) * 0.1 : key === "neutral" ? (aficion - 50) * 0.12 + (forma - 60) * 0.06 : (forma - 60) * 0.18 + (aficion - 50) * 0.05;
    const rel = clamp(Math.round(BASE[key] + jitter + climate + personal), 0, 100);
    const names = NAMES[key];
    const pick = hash(`${player.id}:pr:${key}:n`);
    const journalist = key === "afin" ? getNpcName(player, "prensa") : fictionalPlayerName(`${player.id}:pr:${key}:j`, player.club, player.last_name);
    const base = names[pick % names.length];
    const name = key === "afin" && city && city !== player.club && pick % 2 ? `${base} de ${city}` : base;
    return { key, name, kindLabel: KIND[key], journalist, blurb: BLURBS[key][pick % BLURBS[key].length], rel, personal };
  });
}

export interface Climate {
  label: "Idolatrado" | "Favorable" | "Dividido" | "Hostil";
  score: number;
  tone: "good" | "neutral" | "bad";
  line: string;
}

/** El clima mediático: media de los tres medios (el afín y el neutral pesan más que el hostil que te persigue). */
export function pressClimate(player: Player): Climate {
  const press = getPress(player);
  const w = { afin: 1.2, neutral: 1, hostil: 0.8 };
  const score = Math.round(press.reduce((n, o) => n + o.rel * w[o.key], 0) / (w.afin + w.neutral + w.hostil));
  if (score >= 68) return { label: "Idolatrado", score, tone: "good", line: "Te tratan como a uno de los suyos: hasta tus fallos salen con cariño." };
  if (score >= 52) return { label: "Favorable", score, tone: "good", line: "La prensa te quiere, con sus peros y sus titulares de ida y vuelta." };
  if (score >= 38) return { label: "Dividido", score, tone: "neutral", line: "Unos te aplauden y otros te esperan en la esquina." };
  return { label: "Hostil", score, tone: "bad", line: "Cada entrevista es un campo de minas y cada fallo, un titular." };
}

/* ───────────── Seguidores ───────────── */

/** Seguidores en redes: crecen de forma exponencial con la fama y se multiplican con lo que publicas (rs, en %). */
export function followers(player: Pick<Player, "fama" | "flags">): number {
  const fama = clamp(player.fama ?? 0, 0, 100);
  const boost = clamp(num((player.flags ?? {}).rs), -50, 150);
  return Math.max(200, Math.round(((1000 * Math.exp(0.095 * fama)) * (1 + boost / 100)) / 100) * 100);
}

export function followersText(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} M`;
  if (n >= 10_000) return `${Math.round(n / 1000).toLocaleString("es-ES")} mil`;
  return n.toLocaleString("es-ES");
}

export const FOLLOWER_STEPS = [100_000, 1_000_000, 5_000_000, 10_000_000];

/** El próximo hito de seguidores pendiente de celebrar (100 mil, 1, 5 y 10 millones). */
export function dueFollowersMilestone(player: Player): number | null {
  const flags = (player.flags ?? {}) as Flags;
  const n = followers(player);
  for (const step of [...FOLLOWER_STEPS].reverse()) {
    if (n >= step) {
      // Si ya se celebró uno mayor, los menores se dan por vistos.
      if (FOLLOWER_STEPS.some((s) => s >= step && flags[`rs_hito_${s}`])) return null;
      return step;
    }
  }
  return null;
}

/* ───────────── La narrativa: cómo te cuentan ───────────── */

export function pressNarrative(player: Player): { label: string; line: string } {
  const flags = (player.flags ?? {}) as Flags;
  const name = displayName(player);
  const age = playerAge(player.week);
  const changes = num(flags.club_changes);
  if ((player.fama ?? 0) < 20 && age < 20) return { label: "La joven promesa", line: `Los medios hablan de ${name} como de un nombre que conviene recordar.` };
  if ((player.rel_aficion ?? 0) >= 82 && (player.fama ?? 0) >= 50) return { label: "El ídolo de la grada", line: `Para la afición, ${name} es de los suyos. Para la prensa, también.` };
  if ((player.reputacion ?? 50) < 38 && (player.fama ?? 0) >= 35) return { label: "El polémico", line: `Cada vez que ${name} habla, hay titular. No siempre bueno.` };
  if (changes >= 4 && (player.rel_aficion ?? 50) < 55) return { label: "El mercenario", line: `Dicen que ${name} se va al que más paga. Hay quien lo dice con sorna y quien con envidia.` };
  if (age >= 31 && (player.reputacion ?? 50) >= 55) return { label: "El veterano respetado", line: `La prensa habla de ${name} con la deferencia que se da a los que han ganado el derecho a ella.` };
  if ((player.media ?? 0) >= 85) return { label: "El crack", line: `${name} ya es de los mejores de su generación, y ya lo dicen todos los medios.` };
  if ((player.fama ?? 0) >= 60) return { label: "La estrella", line: `El nombre de ${name} vende portadas y abre telediarios.` };
  return { label: "El que se hace un nombre", line: `${name} sube peldaño a peldaño; la prensa empieza a fijarse.` };
}

/* ───────────── Acciones tuyas ───────────── */

export type PressActionId = "exclusiva" | "foto_entreno" | "video_vestuario" | "mensaje_aficion" | "responder_critico";

export interface PressAction {
  id: PressActionId;
  label: string;
  hint: string;
  /** Qué medios admite (null = es una acción de redes, sin medio concreto). */
  outlet: boolean;
}

export const PRESS_ACTIONS: Record<PressActionId, PressAction> = {
  exclusiva: { id: "exclusiva", label: "Dar una exclusiva", hint: "Gana a ese medio, enfría un poco a los demás", outlet: true },
  foto_entreno: { id: "foto_entreno", label: "Subir una foto de entrenamiento", hint: "Sin riesgos", outlet: false },
  video_vestuario: { id: "video_vestuario", label: "Subir un vídeo con los compañeros", hint: "Gusta, y el vestuario lo agradece", outlet: false },
  mensaje_aficion: { id: "mensaje_aficion", label: "Escribir a la afición", hint: "Un mensaje honesto después de un partido", outlet: false },
  responder_critico: { id: "responder_critico", label: "Responder a un crítico", hint: "Puede salir muy bien o muy mal", outlet: false },
};

export const MAX_PRESS_ACTS_PER_TURN = 2;
export const PRESS_COOLDOWN = 3;

export function pressActionBlocked(player: Player, action: PressActionId, key?: OutletKey): string | null {
  const flags = (player.flags ?? {}) as Flags;
  if (player.club === NO_CLUB_YET) return "Todavía no te sigue nadie.";
  if (PRESS_ACTIONS[action].outlet && !key) return "Elige un medio.";
  if (num(flags.pr_acts_week) === player.week && num(flags.pr_acts_n) >= MAX_PRESS_ACTS_PER_TURN) return "Ya has hecho dos movimientos este turno: deja respirar a la prensa.";
  const slot = `pr_last_${action}${key ? `_${key}` : ""}`;
  const last = num(flags[slot]);
  if (last > 0 && player.week - last < PRESS_COOLDOWN) return "Acabas de hacerlo: dale unos días.";
  if (action === "video_vestuario" && (player.rel_vestuario ?? 0) < 45) return "El vestuario no está para vídeos de piña.";
  if (action === "exclusiva" && (player.fama ?? 0) < 15) return "Todavía no te piden exclusivas.";
  return null;
}

export interface PressActionResult {
  text: string;
  flags: Flags;
  fama: number;
  moral: number;
  rel_aficion: number;
  rel_vestuario: number;
  reputacion: number;
  ok: boolean;
}

export function doPressAction(player: Player, action: PressActionId, key?: OutletKey, rng: () => number = Math.random): PressActionResult | { error: string } {
  const blocked = pressActionBlocked(player, action, key);
  if (blocked) return { error: blocked };
  const press = getPress(player);
  const flags = (player.flags ?? {}) as Flags;
  const outlet = key ? press.find((o) => o.key === key) : undefined;
  const res: PressActionResult = { text: "", flags: {}, fama: 0, moral: 0, rel_aficion: 0, rel_vestuario: 0, reputacion: 0, ok: true };
  const out: Flags = {};
  const give = (k: OutletKey, n: number) => {
    const o = press.find((x) => x.key === k)!;
    out[outletKey(k)] = String(clamp(o.personal + n, -40, 40));
  };
  const boost = (n: number) => {
    out.rs = String(clamp(num(flags.rs) + n, -50, 150));
  };
  const name = displayName(player);
  switch (action) {
    case "exclusiva": {
      const o = outlet!;
      const first = o.journalist.split(" ")[0];
      if (o.key === "hostil") {
        res.ok = rng() < 0.45;
        give("hostil", res.ok ? 10 : -4);
        res.fama = res.ok ? 2 : 0;
        res.reputacion = res.ok ? 2 : -1;
        res.text = res.ok
          ? `Aceptas hablar con ${first}, de ${o.name}, sin guion y sin esquivar nada. Esperabas un cuchillo y encuentras a un tipo que, por una vez, escucha. El titular no es amable, pero es justo. La tertulia de esa noche baja un par de tonos.`
          : `Hablas con ${first} y salen mal paradas dos frases que sacan de contexto. El titular es el peor posible y la tertulia de la noche lo celebra. Lo has intentado, y eso también cuenta, aunque no se note.`;
      } else {
        give(o.key, 8);
        for (const other of press.filter((x) => x.key !== o.key)) give(other.key, other.key === "hostil" ? -1 : -2);
        res.fama = 2;
        res.moral = 1;
        boost(2);
        res.text = `Le das a ${first}, de ${o.name}, una conversación larga y sin cámaras de por medio. Se nota que se lo ha ganado. La portada del día siguiente lleva tu cara y una frase tuya entre comillas. Los otros medios, que no han sido los elegidos, toman nota.`;
      }
      out[`pr_last_${action}_${o.key}`] = String(player.week);
      break;
    }
    case "foto_entreno":
      give("afin", 1);
      boost(2);
      res.fama = 1;
      res.text = `Subes una foto del entrenamiento de la mañana: el balón, el césped mojado y una frase corta. No inventa nada, pero a los tuyos les gusta verte currar. En una hora, los comentarios se llenan de ánimos.`;
      break;
    case "video_vestuario":
      give("afin", 1);
      give("neutral", 1);
      boost(4);
      res.fama = 1;
      res.rel_vestuario = 1;
      res.moral = 1;
      res.text = `Grabáis un vídeo de veinte segundos en el vestuario con tres compañeros y un cántico que nadie entiende. Se comparte por todas partes. «Así da gusto ver al equipo», escribe un aficionado. El capitán lo comparte desde su cuenta.`;
      break;
    case "mensaje_aficion":
      res.rel_aficion = 2;
      res.moral = 1;
      boost(2);
      give("neutral", 1);
      res.text = `Después del partido escribes unas líneas para la afición: sin florituras, con la verdad. Miles de personas las comparten. Alguien te contesta: «Eso es lo que queríamos oír». Te quedas un rato leyendo respuestas antes de acostarte.`;
      break;
    case "responder_critico": {
      res.ok = rng() < 0.5;
      if (res.ok) {
        give("hostil", 4);
        res.fama = 2;
        res.reputacion = 1;
        boost(5);
        res.text = `Un tertuliano te llama «sobrevalorado» y le contestas con dos frases limpias y un dato que no esperaba. El hilo se llena de gente de tu lado. Al día siguiente, el tertuliano rectifica con la boca pequeña.`;
      } else {
        give("hostil", -6);
        res.reputacion = -2;
        res.moral = -2;
        boost(-3);
        res.text = `Contestas en caliente a un tertuliano y la frase se te va de las manos. Se hace viral, pero por lo malo. Borras el mensaje; ya es tarde, que Internet no olvida. ${name}, la próxima vez, cuenta hasta diez.`;
      }
      break;
    }
  }
  out.pr_acts_week = String(player.week);
  out.pr_acts_n = String(num(flags.pr_acts_week) === player.week ? num(flags.pr_acts_n) + 1 : 1);
  if (!key) out[`pr_last_${action}`] = String(player.week);
  res.flags = out;
  return res;
}

/* ───────────── Cambios desde las escenas (pseudo-bandera pr_delta) ───────────── */

/** «afin:+4,hostil:-6,seg:+5» → flags nuevos (los consume resolveEvent; la bandera pr_delta no se guarda). «seg» mueve los seguidores (%). */
export function applyPressDeltas(player: Pick<Player, "flags">, delta: string | boolean | undefined): Flags {
  if (typeof delta !== "string" || !delta) return {};
  const out: Flags = {};
  const flags = (player.flags ?? {}) as Flags;
  for (const part of delta.split(",")) {
    const [rawKey, rawN] = part.split(":");
    const key = rawKey?.trim();
    const n = parseInt(rawN ?? "", 10);
    if (!Number.isFinite(n)) continue;
    if (key === "seg") {
      out.rs = String(clamp(num(out.rs ?? flags.rs) + n, -50, 150));
    } else if (key === "afin" || key === "neutral" || key === "hostil") {
      const k = outletKey(key);
      out[k] = String(clamp(num(out[k] ?? flags[k]) + n, -40, 40));
    }
  }
  return out;
}

/* ───────────── La prensa devuelve algo cada turno ───────────── */

/**
 * Cada turno la prensa notifica lo que ya estás haciendo: si vas mal y la tertulia aprieta, la grada lo oye (-1 de afición y de moral);
 * si vas bien y la prensa afín te quiere, ganas un poco de fama. Pequeño, pero encadena: lo que haces con los medios cambia el partido.
 */
export function applyPressTick(player: Player): void {
  if (player.club === NO_CLUB_YET || player.status !== "active") return;
  const press = getPress(player);
  const hostil = press.find((o) => o.key === "hostil")!;
  const afin = press.find((o) => o.key === "afin")!;
  if (hostil.rel < 32 && (player.forma ?? 60) < 55) {
    player.rel_aficion = clamp((player.rel_aficion ?? 50) - 1, 0, 100);
    player.moral = clamp((player.moral ?? 50) - 1, 0, 100);
  } else if (afin.rel >= 72 && (player.forma ?? 60) >= 70) {
    player.fama = clamp((player.fama ?? 0) + 1, 0, 100);
  }
}

/* ───────────── Escenas de prensa con estos mismos medios ───────────── */

export function shouldTriggerPressScene(player: Player, rng: () => number = Math.random): boolean {
  if (player.club === NO_CLUB_YET || player.status !== "active" || player.club.startsWith("SELECCIÓN:")) return false;
  if (playerAge(player.week) < 16 || player.week < 12 || (player.fama ?? 0) < 15) return false;
  const last = num(player.flags?.pr_scene_last);
  if (last > 0 && player.week - last < 6) return false;
  return rng() < 0.4;
}

const opt = (id: string, label: string, subtitle: string, c: Record<string, number>, delta: string, text: string): EventOption => ({
  id,
  label,
  subtitle,
  consequences: { ...c, flags: { pr_delta: delta } },
  outcomeText: text,
});

const find = (press: Outlet[], key: OutletKey) => press.find((o) => o.key === key) as Outlet;
const first = (s: string) => s.split(" ")[0];

const SCENES: { key: string; weight: number; when: (p: Player, press: Outlet[], climate: Climate) => boolean; build: (p: Player, press: Outlet[]) => Omit<GameEvent, "id"> }[] = [
  {
    key: "columna-hostil",
    weight: 3,
    when: (_p, press) => find(press, "hostil").rel < 52,
    build: (p, press) => {
      const h = find(press, "hostil");
      return {
        category: "prensa",
        title: `${h.journalist} te dedica una columna entera`,
        description: `En ${h.name}, ${h.journalist} firma una columna de ochocientas palabras sobre ti: «${displayName(p)}, el jugador que cree que ya lo ha hecho todo». No tiene ni un dato falso, pero cada frase está puesta con mala idea. El club la recibe en el correo de la mañana y tu representante te llama dos veces antes de las nueve.`,
        options: [
          opt("a", "Responder con una carta pública, educada pero firme", "La vía alta", { reputacion: 3, moral: 1 }, "hostil:+3,seg:+2", `Escribes cuatro párrafos sin una palabra de más. ${first(h.journalist)} lo publica entero, con una nota breve que lo cambia todo: «El jugador contesta con respeto». Es la primera vez que te trata como a un adulto.`),
          opt("b", "Invitarle a conocer tu día a día", "Una mano tendida", { fama: 1, moral: 1 }, "hostil:+6,afin:-1", `Le abres la puerta del entrenamiento una mañana. ${first(h.journalist)} se queda en el césped con cara de no saber dónde mirar. La siguiente columna es más matizada. Sigue sin ser un homenaje, pero ya se parece a la realidad.`),
          opt("c", "No decir nada: que se canse", "Paciencia", { moral: -1 }, "hostil:-3", `Ni una línea. En redes, tus seguidores lo defienden por su cuenta y la polémica crece un día más. El silencio, esta vez, no te favorece del todo.`),
        ],
      };
    },
  },
  {
    key: "exclusiva-afin",
    weight: 2,
    when: (p, press) => find(press, "afin").rel >= 55 && (p.fama ?? 0) >= 25,
    build: (_p, press) => {
      const a = find(press, "afin");
      return {
        category: "prensa",
        title: `${a.journalist} te pide una exclusiva`,
        description: `${a.journalist}, de ${a.name}, te escribe: «Una hora, sin cámaras y sin agenda. Te lo cuento todo antes de publicar y tú decides qué sale». Es un periodista que te trata bien desde el principio, y lo sabe. En la tertulia, ya se huelen que algo se cuece.`,
        options: [
          opt("a", "Aceptar y contar lo que de verdad piensas", "Confianza", { fama: 3, rel_aficion: 2, moral: 2 }, "afin:+8,hostil:-2,neutral:-1,seg:+3", `Tardáis casi dos horas. ${first(a.journalist)} no mira el móvil una sola vez. La entrevista es, con diferencia, lo mejor que se ha publicado sobre ti. Los otros medios se hacen los distraídos.`),
          opt("b", "Aceptar, pero repartir la exclusiva con los demás", "Equidad", { fama: 2, reputacion: 2 }, "afin:+2,neutral:+3,hostil:+2", `Das las mismas frases a los tres. Nadie se queja, nadie se alegra del todo. Es una jugada de profesional, y lo es de verdad.`),
          opt("c", "Rechazarla con educación", "Distancia", { moral: -1 }, "afin:-4", `Le dices que ahora mismo no. ${first(a.journalist)} lo entiende, o lo aparenta. Su siguiente titular sobre ti es un poco más frío.`),
        ],
      };
    },
  },
  {
    key: "rueda-prensa",
    weight: 3,
    when: () => true,
    build: (p, press) => {
      const n = find(press, "neutral");
      return {
        category: "prensa",
        title: "Una pregunta incómoda en la rueda de prensa",
        description: `Tras el entrenamiento, el club te pone delante del micrófono. ${n.journalist}, de ${n.name}, levanta la mano al final: «¿Es verdad que has hablado con otro club?». Silencio. A tu lado, el jefe de prensa del ${p.club} mira un punto fijo del techo. Hay cámaras, y todo lo que digas va a ser titular.`,
        options: [
          opt("a", "«Estoy centrado en el equipo, y punto»", "Pared", { reputacion: 2, rel_entrenador: 1 }, "neutral:+2,hostil:+1", `La respuesta es plana a propósito. No sale ningún titular salvo «${displayName(p)} se centra en el equipo». Para quien lo escribe, es un aburrimiento. Para ti, es una victoria.`),
          opt("b", "Soltar una media verdad que mantenga el misterio", "Jugar con fuego", { fama: 3, rel_entrenador: -2 }, "neutral:+4,hostil:+3,afin:-2,seg:+3", `«Mi representante habla con muchos clubes. Es su trabajo». Es tan cierto como inútil. Salen doce titulares distintos; el míster te dedica una mirada de las que no se olvidan.`),
          opt("c", "Contestar con una broma y cambiar de tema", "Encanto", { fama: 2, moral: 2 }, "neutral:+3,afin:+2", `«Habló mi madre, que quiere que viva más cerca de casa». La sala se ríe. ${first(n.journalist)} apunta la frase y no insiste. Quizá es la mejor manera de capear algo.`),
        ],
      };
    },
  },
  {
    key: "tuit-antiguo",
    weight: 2,
    when: (p) => (p.fama ?? 0) >= 40,
    build: (p) => ({
      category: "prensa",
      title: "Un mensaje tuyo de hace años vuelve a circular",
      description: `Alguien ha desenterrado un mensaje que escribiste con quince años: una broma sobre un rival, cuando todavía no eras nadie. Está sacado de contexto y suena peor de lo que fue. En dos horas, ${displayName(p)} es tendencia, y no por un gol.`,
      options: [
        opt("a", "Pedir disculpas con naturalidad", "Dar la cara", { reputacion: 4, moral: -1 }, "neutral:+3,hostil:+2,seg:+1", `Escribes tres líneas honestas: lo que fue, lo que pensabas entonces y lo que piensas ahora. El hilo se apaga en horas. Un aficionado del rival te contesta: «Con eso, cero problemas».`),
        opt("b", "Quitarle hierro con humor", "Reírte de ti mismo", { fama: 3, reputacion: -1, moral: 2 }, "neutral:+2,afin:+2,hostil:-2,seg:+6", `Subes un vídeo imitando tu cara de quince años con una frase en tono de «lo siento, era joven». Funciona a medias: se ríe media red y a la otra media le parece frívolo.`),
        opt("c", "Borrarlo todo y no decir nada", "Silencio", { moral: -2 }, "hostil:-3,neutral:-1,seg:-2", `Cierras la cuenta unos días. La polémica no se va, pero se cansa de esperarte. Cuando vuelves, te cuesta dar con el tono.`),
      ],
    }),
  },
  {
    key: "gesto-viral",
    weight: 2,
    when: (_p, _press, climate) => climate.score >= 48,
    build: (p) => ({
      category: "prensa",
      title: "Un gesto tuyo con un niño se hace viral",
      description: `Un padre ha grabado cómo, a la salida del entrenamiento, te agachas para firmar la camiseta de su hijo y le dices algo al oído. No se oye qué. El vídeo da la vuelta a las redes y todo el mundo quiere saber qué le dijiste. ${displayName(p)} se queda sin respuesta y sin cobertura hasta la noche.`,
      options: [
        opt("a", "Contar la verdad: era una tontería, no un discurso", "Naturalidad", { fama: 3, rel_aficion: 4, moral: 3 }, "afin:+3,neutral:+3,seg:+5", `«Le dije que a mí también me temblaban las piernas con su edad». La frase lo cuenta todo: se comparte otras diez mil veces. El niño aparece en un programa de televisión con tu camiseta puesta.`),
        opt("b", "Dejarlo en misterio", "Una sonrisa", { fama: 2, rel_aficion: 3 }, "neutral:+2,seg:+3", `Dices que son cosas entre ellos dos. La gente adora el misterio. Durante tres días, todo el mundo cree saber qué dijiste.`),
      ],
    }),
  },
  {
    key: "filtracion",
    weight: 2,
    when: (p) => (p.fama ?? 0) >= 35 && (p.media ?? 0) >= 66,
    build: (p, press) => {
      const a = find(press, "afin");
      return {
        category: "prensa",
        title: "Se filtra tu conversación con el club",
        description: `Una charla privada con la dirección deportiva del ${p.club} aparece, casi palabra por palabra, en las páginas de ${find(press, "hostil").name}. Alguien del entorno ha hablado. ${a.journalist}, tu contacto de confianza, te escribe: «Te cuento quién ha sido si quieres, pero antes tienes que decirme qué hacemos».`,
        options: [
          opt("a", "Pedir que el club investigue y aclararlo en público", "Responsabilidad", { reputacion: 3, rel_entrenador: 1 }, "afin:+3,neutral:+2,hostil:-2", `Sale un comunicado conjunto y una frase tuya clara. La filtración pierde fuerza. Dentro del club, alguien deja de cenar con quien cenaba.`),
          opt("b", "Desmentirlo todo a la vez", "Negar la mayor", { fama: 1, reputacion: -2 }, "hostil:+2,afin:-3,seg:-2", `Lo niegas todo en una entrevista. Te cuesta mantener la historia cuando aparecen los mensajes. No es tu mejor semana.`),
          opt("c", "Reírte: «Que tengan buena memoria»", "Ironía", { moral: 1, reputacion: -1 }, "hostil:-1,neutral:+1", `Con una sola frase le quitas dramatismo al asunto. La conversación original era más aburrida que el titular y la gente lo nota.`),
        ],
      };
    },
  },
];

export function buildPressScene(player: Player, rng: () => number = Math.random): GameEvent | null {
  if (player.club === NO_CLUB_YET) return null;
  const press = getPress(player);
  const climate = pressClimate(player);
  const recent = String(player.flags?.pr_recent ?? "").split(",").filter(Boolean);
  const eligible = SCENES.filter((s) => s.when(player, press, climate) && !recent.includes(s.key));
  const pool = eligible.length > 0 ? eligible : SCENES.filter((s) => s.when(player, press, climate));
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
  const stamp: Flags = { pr_scene_last: String(player.week), pr_recent: [...recent, scene.key].slice(-3).join(",") };
  const built = scene.build(player, press);
  return {
    id: `prensa-${scene.key}-${player.week}`,
    ...built,
    options: built.options.map((o) => ({ ...o, consequences: { ...o.consequences, flags: { ...(o.consequences.flags ?? {}), ...stamp } } })),
  };
}

/* ───────────── Hitos compartibles: los seguidores y la portada ───────────── */

const STEP_TEXT: Record<number, { title: string; label: string }> = {
  100_000: { title: "Cien mil personas te siguen", label: "cien mil" },
  1_000_000: { title: "Un millón de seguidores", label: "un millón" },
  5_000_000: { title: "Cinco millones de seguidores", label: "cinco millones" },
  10_000_000: { title: "Diez millones de seguidores", label: "diez millones" },
};

export function buildFollowersMilestone(player: Player, step: number): GameEvent {
  const t = STEP_TEXT[step] ?? { title: "Una cifra redonda de seguidores", label: String(step) };
  const mate = getNpcName(player, "capitan");
  const flag = `rs_hito_${step}`;
  const press = getPress(player);
  const a = find(press, "afin");
  return {
    id: `prensa-seguidores-${step}`,
    category: "prensa",
    title: t.title,
    description: `Estás en el autobús de vuelta cuando el móvil se llena de avisos: has pasado de ${t.label} de seguidores. Nadie del vestuario se ha dado cuenta hasta que ${mate} te enseña la pantalla y grita. ${a.journalist}, de ${a.name}, ya te ha escrito: «¿Te acuerdas de cuando eran doscientos y todos tus primos?». Cada número es una persona que ha decidido escucharte.`,
    options: [
      { id: "a", label: "Dar las gracias con un vídeo sin guion", subtitle: "Cercanía", consequences: { fama: 3, rel_aficion: 3, moral: 4, flags: { [flag]: true, pr_delta: "afin:+3,neutral:+2,seg:+3" } }, outcomeText: "Grabas un vídeo de un minuto, sin cortes, con los compañeros dormidos al fondo. «Gracias por estar aquí». Se comparte por todas partes, y no por la cifra, sino por cómo lo has dicho." },
      { id: "b", label: "Sortear camisetas firmadas entre tus seguidores", subtitle: "Un regalo", consequences: { fama: 2, rel_aficion: 5, moral: 3, patrimonio: -800, flags: { [flag]: true, pr_delta: "neutral:+2,seg:+4" } }, outcomeText: "Mil personas participan en una hora. El ganador, un chaval de un pueblo pequeño, te escribe llorando. Ese mensaje, de los miles que lees, es el que guardas." },
      { id: "c", label: "No hacer ruido: tú sigues a lo tuyo", subtitle: "Discreción", consequences: { reputacion: 2, moral: 2, flags: { [flag]: true } }, outcomeText: "Apagas la pantalla y sonríes para dentro. Hay números que se celebran en silencio, con el cuerpo cansado y el pecho lleno." },
    ],
    isMilestone: true,
    milestoneType: "seguidores",
    imageScene: "Photorealistic candid photo of a footballer in a team bus seat looking at his phone with a stunned happy smile, teammates leaning over his shoulders cheering and pointing at the screen, warm interior light, night city blurred through the window, emotional proud moment, no readable text",
  };
}

/** ¿Toca la portada de revista? Una vez por carrera: con algo de fama, con un medio afín que te quiere y sin escándalos. */
export function shouldTriggerCover(player: Player, rng: () => number = Math.random): boolean {
  const flags = (player.flags ?? {}) as Flags;
  if (flags.pr_portada || player.club === NO_CLUB_YET || player.status !== "active") return false;
  if ((player.fama ?? 0) < 58 || (player.reputacion ?? 50) < 45 || player.week < 30) return false;
  if (find(getPress(player), "afin").rel < 55) return false;
  return rng() < 0.25;
}

export function buildCoverEvent(player: Player): GameEvent {
  const press = getPress(player);
  const a = find(press, "afin");
  const name = displayName(player);
  const flag = { pr_portada: true };
  return {
    id: "prensa-portada",
    category: "prensa",
    title: "Tu primera portada de revista",
    description: `${a.journalist} y ${a.name} te llaman con una noticia que no esperabas: la revista del mes quiere que seas la portada. Una sesión de fotos de ocho horas, un estilista que te mira de arriba abajo y una frase del director: «${name} ya es algo más que un jugador». Tu madre ha comprado doce ejemplares antes de que salga.`,
    options: [
      { id: "a", label: "Posar serio, con el balón bajo el brazo", subtitle: "Imagen de leyenda", consequences: { fama: 5, reputacion: 3, rel_aficion: 3, moral: 4, flags: { ...flag, pr_delta: "afin:+4,neutral:+3,seg:+5" } }, outcomeText: "El fotógrafo no hace más de cuatro disparos. La portada sale con tu mirada fija en la cámara, y se convierte en el póster de miles de habitaciones. Tu padre la enmarca en el salón." },
      { id: "b", label: "Reírte a carcajadas, sin ensayar", subtitle: "Naturalidad", consequences: { fama: 6, rel_aficion: 5, moral: 5, flags: { ...flag, pr_delta: "afin:+3,neutral:+4,seg:+7" } }, outcomeText: "A la décima hora te sale una risa de verdad: el fotógrafo se da cuenta y no suelta el gatillo. La portada sale con ese gesto, y la gente escribe que nunca te había visto tan tú." },
      { id: "c", label: "Pedir que salgan también los chavales de tu escuela", subtitle: "Compartir el foco", consequences: { fama: 4, reputacion: 6, rel_aficion: 6, moral: 4, flags: { ...flag, pr_delta: "afin:+5,neutral:+3,hostil:+2,seg:+5" } }, outcomeText: "La revista duda un momento y acepta. La portada tiene a diez chavales con camisetas viejas y a ti, riendo en medio. La compran en medio país, y los periodistas escriben de «un modelo para los chicos»." },
    ],
    isMilestone: true,
    milestoneType: "portada_revista",
    imageScene: "Photorealistic editorial magazine cover shoot of a footballer in a studio with dramatic soft lighting, holding a football against his hip, confident intense gaze to camera, plain dark backdrop, premium fashion-magazine look, no logos and no readable text anywhere",
  };
}
