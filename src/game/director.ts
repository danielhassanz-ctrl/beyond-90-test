/* =========================================================================
 * NARRATIVE DIRECTOR — único selector de escenas de carrera.
 *
 * Sustituye al selector antiguo (pickEvent + bancos). El flujo principal ya
 * no puede caer en tarjetas antiguas: si no hay capítulo ni escena secundaria
 * válida, el motor avanza tiempo.
 *
 * Estructura: temporada -> 3-5 arcos candidatos -> 2-3 arcos activos ->
 * capítulos 1..final encadenados por requisitos + escenas secundarias
 * contextuales parametrizadas (nunca repetidas) + callbacks.
 * ========================================================================= */

import { clubDef } from "./data";
import { ensureFinance, netWorth } from "./finance";
import { computeRole } from "./match";
import { achieve, clamp, flag, injure, milestone, note, rel, stat, totalApps } from "./mutate";
import { careerSeed, hash, npc, npcMood, who } from "./npc";
import type { DynamicCard, EventCategory, GameState, SceneKey } from "./types";

/* ============================== Estado ============================== */

export interface ActiveArc {
  id: string;
  chapter: number;
  opened: number;
  params: Record<string, string>;
}

export interface DirectorState {
  season: number;
  active: ActiveArc[];
  completed: string[];
  candidates: string[];
  callbacks: { id: string; text: string; dueScene: number }[];
  lastScenes: string[];
  lastFamilies: string[];
  sceneInSeason: number;
  profile: string;
  /** RITMO: escenas narrativas objetivo de esta temporada (4-9). */
  budget?: number;
  /** RITMO: beat del motor en que se mostró el último capítulo de arco. */
  lastArcBeat?: number;
  /** RITMO: beat del motor en que se mostró la última escena secundaria. */
  lastBeatBeat?: number;
  /** RITMO: beat del motor de la última escena narrativa de cualquier tipo. */
  lastAnyBeat?: number;
  /** RITMO: escenas narrativas consumidas en pretemporada. */
  preseasonUsed?: number;
}

type WithDirector = GameState & { director?: DirectorState };

const MONTHS = ["julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre", "enero", "febrero", "marzo", "abril", "mayo", "junio"];

export function directorState(s: GameState): DirectorState {
  const g = s as WithDirector;
  const d = g.director;
  if (!d || typeof d !== "object" || !Array.isArray(d.active)) {
    g.director = {
      season: s.seasonIndex,
      active: [],
      completed: [],
      candidates: [],
      callbacks: [],
      lastScenes: [],
      lastFamilies: [],
      sceneInSeason: 0,
      profile: rollProfile(s),
      budget: seasonBudget(s),
      lastArcBeat: -99,
      lastBeatBeat: -99,
      lastAnyBeat: -99,
      preseasonUsed: 0,
    };
    return g.director;
  }
  if (!Array.isArray(d.callbacks)) d.callbacks = [];
  if (!Array.isArray(d.lastScenes)) d.lastScenes = [];
  if (!Array.isArray(d.lastFamilies)) d.lastFamilies = [];
  if (!Array.isArray(d.completed)) d.completed = [];
  if (!Array.isArray(d.candidates)) d.candidates = [];
  if (typeof d.profile !== "string") d.profile = rollProfile(s);
  if (typeof d.sceneInSeason !== "number") d.sceneInSeason = 0;
  // Saves antiguos: campos de ritmo inicializados de forma defensiva.
  if (typeof d.budget !== "number" || d.budget <= 0) d.budget = seasonBudget(s);
  if (typeof d.lastArcBeat !== "number") d.lastArcBeat = -99;
  if (typeof d.lastBeatBeat !== "number") d.lastBeatBeat = -99;
  if (typeof d.lastAnyBeat !== "number") d.lastAnyBeat = -99;
  if (typeof d.preseasonUsed !== "number") d.preseasonUsed = 0;
  // Regla nueva: un solo arco principal activo. Los saves con varios se poda.
  if (d.active.length > 1) d.active = [d.active[0]!];
  return d;
}

/**
 * RITMO: presupuesto de escenas narrativas por temporada. Reproducible por
 * careerSeed: normalmente 6-8, con temporadas tranquilas (4-5) e intensas (9).
 */
function seasonBudget(s: GameState): number {
  const h = hash(careerSeed(s), `budget${s.seasonIndex}`) % 100;
  if (h < 18) return 4 + (h % 2); // temporada tranquila
  if (h < 82) return 6 + (h % 3); // norma: 6-8
  return 9;
}


/** Perfil de trayectoria oculto: nunca se muestra al usuario. */
function rollProfile(s: GameState): string {
  const h = hash(careerSeed(s), "profile") % 100;
  const pot = s.potential ?? 75;
  if (pot >= 90 && h < 60) return "prodigio";
  if (pot >= 84) return "crecimiento";
  if (pot >= 76) return "solido";
  if (h < 34) return "tardio";
  if (h < 70) return "techo_medio";
  return "lesiones";
}

export function currentMonth(s: GameState): string {
  const d = directorState(s);
  const idx = Math.min(MONTHS.length - 1, Math.floor(d.sceneInSeason / 1.7));
  return MONTHS[idx]!;
}

/* ============================== Contexto ============================== */

interface Ctx {
  s: GameState;
  arc: ActiveArc;
  month: string;
  coach: string;
  captain: string;
  rival: string;
  agent: string;
  club: string;
  role: number;
}

interface Res {
  title: string;
  text: string;
  tone: "good" | "bad" | "neutral" | "gold";
  /** Cierra el arco. */
  end?: boolean;
  /** Salta a un capítulo concreto en vez del siguiente. */
  goto?: number;
}

interface Chapter {
  family: string;
  image: SceneKey;
  category: EventCategory;
  /** Salto temporal narrado antes de la escena. */
  skip?: string;
  kicker: (c: Ctx) => string;
  title: (c: Ctx) => string;
  text: (c: Ctx) => string;
  freeform?: string;
  choices: { id: string; label: string; hint?: string; apply: (c: Ctx) => Res }[];
}

interface Arc {
  id: string;
  label: string;
  family: string;
  /** Puede abrirse ahora mismo. */
  requires: (s: GameState) => boolean;
  weight: (s: GameState) => number;
  chapters: Chapter[];
  /** Parámetros fijados al abrir (rival, destino de cesión…). */
  open?: (s: GameState) => Record<string, string>;
}

const ctxOf = (s: GameState, arc: ActiveArc): Ctx => ({
  s,
  arc,
  month: currentMonth(s),
  coach: who(s, "coach"),
  captain: who(s, "captain"),
  rival: arc.params["rival"] ?? npc(s, "rival").name,
  agent: s.agent.present ? s.agent.name : "tu entorno",
  club: clubDef(s.clubId).name,
  role: computeRole(s),
});

const minutesLow = (s: GameState): boolean => computeRole(s) < 45;
const cash = (s: GameState): number => ensureFinance(s).cash;

function remember(s: GameState, text: string): void {
  if (!Array.isArray(s.memory.promises)) s.memory.promises = [];
  s.memory.promises.unshift(text);
  s.memory.promises = s.memory.promises.slice(0, 24);
}

function callback(s: GameState, id: string, text: string, inScenes = 8): void {
  const d = directorState(s);
  if (d.callbacks.some((c) => c.id === id)) return;
  d.callbacks.push({ id, text, dueScene: (s.sceneCount ?? 0) + Math.max(6, inScenes) });
}


const LOAN_DESTINOS = [
  "Racing de Santander (Segunda)",
  "CD Mirandés (Segunda)",
  "Real Zaragoza (Segunda)",
  "Albacete (Segunda)",
  "Cartagena (Segunda)",
  "Eldense (Primera Federación)",
  "Estoril (Portugal)",
  "Waasland-Beveren (Bélgica)",
];

const BIG_ABROAD = [
  "Ajax", "Benfica", "Brighton", "Olympique de Lyon", "Sporting de Lisboa", "RB Leipzig", "Feyenoord", "Fiorentina",
];

/* ============================== Arcos ============================== */

const ARCS: Arc[] = [
  /* ---------------- 1. PERDER EL PUESTO ---------------- */
  {
    id: "arc_puesto",
    label: "La jerarquía",
    family: "jerarquia",
    open: (s) => ({ rival: npc(s, "rival").name }),
    requires: (s) => s.stage !== "youth" && (minutesLow(s) || s.rel.coach < 55),
    weight: (s) => (minutesLow(s) ? 34 : 14),
    chapters: [
      {
        family: "jerarquia",
        image: "office",
        category: "club",
        kicker: (c) => `Despacho · ${c.month}`,
        title: () => "Cuarto en la lista",
        text: (c) =>
          `${c.coach} dibuja tu posición en una pizarra y coloca cuatro nombres. El tuyo es el último. "No es un castigo, es dónde estás hoy. ${c.rival} está por delante y lo sabes". No hay promesas de minutos, solo un plazo: "hablamos en tres meses".`,
        freeform: "¿Qué le contestas al entrenador?",
        choices: [
          {
            id: "aceptar",
            label: "Aceptar y trabajar sin ruido",
            hint: "El entrenador lo apunta",
            apply: (c) => {
              rel(c.s, "coach", 6);
              stat(c.s, "discipline", 4);
              remember(c.s, `Aceptaste ser cuarto en la jerarquía por detrás de ${c.rival}`);
              return { title: "Sin ruido", text: `Sales del despacho sin discutir. ${c.coach} lo valora más de lo que dice.`, tone: "neutral" };
            },
          },
          {
            id: "pelear",
            label: "Decirle que le vas a quitar el puesto",
            hint: "Riesgo y ambición",
            apply: (c) => {
              rel(c.s, "coach", -3);
              stat(c.s, "form", 5);
              flag(c.s, "pelea_puesto", 1);
              remember(c.s, `Prometiste al entrenador quitarle el puesto a ${c.rival}`);
              return { title: "Aviso", text: `"Me gusta que lo digas. Ahora demuéstralo en el rondo del martes".`, tone: "neutral" };
            },
          },
          {
            id: "agente",
            label: "Avisar de que estudiarás salir",
            hint: "Abre la puerta a una cesión",
            apply: (c) => {
              rel(c.s, "coach", -8);
              flag(c.s, "quiere_salir", 1);
              return { title: "Se toma nota", text: `"Si te quieres ir, dilo con el club, no conmigo". El mensaje llega a la dirección deportiva antes que tú al coche.`, tone: "bad" };
            },
          },
        ],
      },
      {
        family: "jerarquia",
        image: "training",
        category: "training",
        skip: "Dos semanas después",
        kicker: (c) => `Entrenamiento · ${c.month}`,
        title: (c) => `El duelo con ${c.rival}`,
        text: (c) =>
          `Partidillo de los martes: tú contra ${c.rival} en la misma banda. Él lleva 6 partidos de titular; tú llevas 6 de chándal. ${c.captain} arbitra y se ríe: "esto vale más que la Copa".`,
        choices: [
          {
            id: "dominar",
            label: "Ir a por él en cada acción",
            hint: "Rendimiento alto, roce alto",
            apply: (c) => {
              const win = Math.random() < 0.5 + (c.s.overall - 60) / 100;
              if (win) {
                stat(c.s, "form", 9);
                rel(c.s, "coach", 5);
                npcMood(c.s, "rival", -12);
                flag(c.s, "gano_duelo", 1);
                return { title: "Le pasas por encima", text: `Dos regates y un gol. ${c.coach} para el partidillo y dice en voz alta: "así, todos los días".`, tone: "good" };
              }
              stat(c.s, "form", -5);
              npcMood(c.s, "rival", 6);
              return { title: "Te gana el duelo", text: `${c.rival} te come. Nadie dice nada, pero el silencio del vestuario ya lo dice todo.`, tone: "bad" };
            },
          },
          {
            id: "equipo",
            label: "Jugar para el equipo, sin duelos",
            hint: "Vestuario arriba",
            apply: (c) => {
              rel(c.s, "dressing", 7);
              stat(c.s, "form", 2);
              return { title: "Trabajo callado", text: `Das dos asistencias y ninguna entrevista. ${c.captain} te lo agradece con un golpe en el hombro.`, tone: "neutral" };
            },
          },
          {
            id: "hablar",
            label: "Hablar con él después",
            hint: "Puede crear un aliado o un enemigo",
            apply: (c) => {
              const good = npc(c.s, "rival").mood >= 45;
              npcMood(c.s, "rival", good ? 10 : -6);
              rel(c.s, "dressing", good ? 5 : -3);
              return good
                ? { title: "Pacto raro", text: `${c.rival} te invita a comer. "Yo también fui el cuarto. Aprende de mí y luego quítame el sitio".`, tone: "good" }
                : { title: "Frío", text: `${c.rival} te escucha de pie, sin sentarse. "Yo no te tengo que ayudar a ti".`, tone: "bad" };
            },
          },
        ],
      },
      {
        family: "jerarquia",
        image: "tunnel",
        category: "story",
        skip: "Tres semanas después",
        kicker: (c) => `${c.month} · vestuario visitante`,
        title: (c) => (c.s.flags["gano_duelo"] === 1 ? "Se abre la puerta" : "La puerta sigue cerrada"),
        text: (c) =>
          c.s.flags["gano_duelo"] === 1
            ? `${c.rival} se ha roto en el calentamiento. ${c.coach} te busca con la mirada y te tira el peto de titular sin decir palabra. No hay charla motivadora: hay una oportunidad y un rival lesionado.`
            : `${c.rival} sigue jugando todo. ${c.coach} te llama para decirte que la semana que viene irás con el filial "a coger minutos". No es un castigo, es la lista.`,
        choices: [
          {
            id: "asumir",
            label: "Asumirlo y responder en el campo",
            apply: (c) => {
              stat(c.s, "form", 6);
              flag(c.s, "status", c.s.flags["gano_duelo"] === 1 ? 1 : 0);
              callback(c.s, "cb_puesto", `${c.rival} volverá de la lesión y querrá su sitio`, 5);
              return {
                title: c.s.flags["gano_duelo"] === 1 ? "Tu turno" : "Filial y paciencia",
                text: c.s.flags["gano_duelo"] === 1 ? "Sales de inicio y no piensas devolver el puesto." : "Vuelves al filial sin protestar. Es feo y es útil.",
                tone: "neutral",
              };
            },
          },
          {
            id: "cesion",
            label: "Pedir una cesión en enero",
            hint: "Cambia la temporada",
            apply: (c) => {
              flag(c.s, "quiere_salir", 1);
              rel(c.s, "coach", -4);
              return { title: "Petición registrada", text: "El club lo estudiará en el mercado de invierno. Se abre otra historia.", tone: "neutral" };
            },
          },
        ],
      },
      {
        family: "jerarquia",
        image: "locker",
        category: "club",
        skip: "Un mes después",
        kicker: (c) => `Balance · ${c.month}`,
        title: () => "Dónde has quedado",
        text: (c) =>
          `${c.coach} te resume la situación sin adornos: ${c.role >= 60 ? "eres titular y la plantilla lo ha aceptado" : c.role >= 40 ? "eres rotación fija, ni fuera ni dentro" : "sigues siendo el cuarto y el club ya no lo esconde"}. ${c.rival} queda en la memoria del vestuario como la vara de medir.`,
        choices: [
          {
            id: "cerrar",
            label: "Firmar la temporada así",
            apply: (c) => {
              const good = c.role >= 55;
              rel(c.s, "coach", good ? 4 : -2);
              milestone(c.s, good ? `Ganaste el puesto por delante de ${c.rival}` : `Perdiste el pulso con ${c.rival}`);
              return {
                title: good ? "Puesto ganado" : "Puesto perdido",
                text: good ? "Nadie te regaló nada, pero ahora el once empieza por ti." : "No has ganado el pulso. Queda pendiente y eso también es una historia.",
                tone: good ? "good" : "bad",
                end: true,
              };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 2. PRIMERA OPORTUNIDAD ---------------- */
  {
    id: "arc_primera",
    label: "Primera oportunidad",
    family: "debut",
    requires: (s) => s.age <= 20 && totalApps(s) < 12 && s.stage !== "first",
    weight: (s) => (s.age <= 18 ? 40 : 20),
    chapters: [
      {
        family: "debut",
        image: "locker",
        category: "story",
        kicker: (c) => `${c.month} · lista de convocados`
        ,
        title: () => "Tu nombre en el papel",
        text: (c) =>
          `El delegado clava la lista con celo. Lees dos veces tu apellido porque no te lo crees. ${c.captain} pasa por detrás: "no te pongas nervioso, que aún no juegas". En el grupo del filial ya lo saben antes que tu padre.`,
        freeform: "¿A quién llamas primero y qué le dices?",
        choices: [
          {
            id: "familia",
            label: "Llamar a casa",
            hint: "Familia arriba",
            apply: (c) => {
              rel(c.s, "family", 8);
              remember(c.s, "Llamaste a casa el día de tu primera convocatoria");
              callback(c.s, "cb_padre_viaje", "Tu padre quiere estar en tu debut aunque sean seis horas de coche", 3);
              return { title: "Se oye a tu madre gritar", text: "Tu padre pregunta la hora del partido y cuelga rápido, para no llorar al teléfono.", tone: "good" };
            },
          },
          {
            id: "silencio",
            label: "No decir nada a nadie",
            hint: "Cabeza fría",
            apply: (c) => {
              stat(c.s, "discipline", 5);
              rel(c.s, "dressing", 3);
              return { title: "Como si fuera normal", text: "Cenas, duermes ocho horas y llegas al campo como el que va a trabajar.", tone: "neutral" };
            },
          },
        ],
      },
      {
        family: "debut",
        image: "tunnel",
        category: "story",
        skip: "El domingo",
        kicker: (c) => `Minuto 78 · ${c.club}`,
        title: () => "Calienta",
        text: (c) =>
          `${c.coach} grita tu apellido y señala la banda. 0-0, doce minutos por delante y el estadio pidiendo un cambio. El cuarto árbitro te pide el dorsal dos veces porque no te sale la voz.`,
        choices: [
          {
            id: "seguro",
            label: "Jugar seguro: no perder el balón",
            apply: (c) => {
              rel(c.s, "coach", 5);
              stat(c.s, "fame", 4);
              milestone(c.s, "Debut oficial");
              achieve(c.s, "debut");
              return { title: "Doce minutos limpios", text: "Nueve pases, ninguno perdido. En el vestuario el míster te dice: \"así se debuta\".", tone: "good" };
            },
          },
          {
            id: "arriesgar",
            label: "Intentar la jugada de tu vida",
            hint: "Gloria o ridículo",
            apply: (c) => {
              const ok = Math.random() < 0.32 + (c.s.overall - 60) / 120;
              milestone(c.s, "Debut oficial");
              achieve(c.s, "debut");
              if (ok) {
                stat(c.s, "fame", 14);
                rel(c.s, "fans", 10);
                flag(c.s, "debut_brillante", 1);
                return { title: "Ese regate", text: "Un caño en el 84' y el campo se levanta. Doce minutos y ya tienes un vídeo circulando.", tone: "gold" };
              }
              stat(c.s, "form", -4);
              rel(c.s, "coach", -3);
              return { title: "Se te va larga", text: "Pierdes el balón dos veces en zona mala. El míster mira al suelo. Debutaste, pero no como querías.", tone: "bad" };
            },
          },
        ],
      },
      {
        family: "debut",
        image: "office",
        category: "club",
        skip: "El martes siguiente",
        kicker: (c) => `${c.month} · después del debut`,
        title: (c) => (c.s.flags["debut_brillante"] === 1 ? "Todo el mundo quiere hablar contigo" : "Y ahora, al banquillo"),
        text: (c) =>
          c.s.flags["debut_brillante"] === 1
            ? `El club te pide una entrevista, el filial te reclama y ${c.coach} avisa: "doce minutos no son una carrera". Hay gente que ya te llama promesa y eso, dice el capitán, "es lo peor que te pueden llamar".`
            : `Vuelves a la lista pero no al campo. ${c.coach} te lo explica en treinta segundos de pasillo: "has debutado, ya está. Ahora empieza lo difícil".`,
        choices: [
          {
            id: "trabajo",
            label: "Bajar la cabeza y entrenar",
            apply: (c) => {
              stat(c.s, "discipline", 5);
              c.s.xp += 12;
              return { title: "Rutina", text: "Primero en llegar, último en irse. Nadie escribe de esto.", tone: "neutral", end: true };
            },
          },
          {
            id: "reclamar",
            label: "Pedir explicaciones de minutos",
            apply: (c) => {
              rel(c.s, "coach", -6);
              flag(c.s, "pelea_puesto", 1);
              return { title: "Demasiado pronto", text: `"Llevas doce minutos como profesional y ya vienes a pedir. Vuelve cuando lleves doce partidos".`, tone: "bad", end: true };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 3. CESIÓN ---------------- */
  {
    id: "arc_cesion",
    label: "Cesión",
    family: "cesion",
    open: (s) => ({ destino: LOAN_DESTINOS[hash(careerSeed(s), `loan${s.seasonIndex}`) % LOAN_DESTINOS.length]!, alt: LOAN_DESTINOS[hash(careerSeed(s), `loan2${s.seasonIndex}`) % LOAN_DESTINOS.length]! }),
    requires: (s) => s.age >= 17 && s.age <= 24 && (minutesLow(s) || s.flags["quiere_salir"] === 1),
    weight: (s) => (s.flags["quiere_salir"] === 1 ? 38 : 18),
    chapters: [
      {
        family: "cesion",
        image: "agent",
        category: "market",
        kicker: (c) => `Mercado · ${c.month}`,
        title: () => "Dos destinos sobre la mesa",
        text: (c) =>
          `${c.s.agent.present ? `${c.s.agent.name} te enseña el móvil` : `El director deportivo te enseña una carpeta`}: ${c.arc.params["destino"]} quiere cederte con minutos garantizados; ${c.arc.params["alt"]} paga mejor pero no promete nada. Quedarte también es una opción, y significa banquillo hasta abril.`,
        choices: [
          {
            id: "minutos",
            label: "Ir donde te garantizan minutos",
            hint: "Crecimiento real, menos escaparate",
            apply: (c) => {
              c.arc.params["elegido"] = c.arc.params["destino"] ?? "la cesión";
              flag(c.s, "cedido", 1);
              stat(c.s, "morale", 6);
              remember(c.s, `Aceptaste una cesión en ${c.arc.params["elegido"]}`);
              return { title: "Maleta", text: `Firmas la cesión en ${c.arc.params["elegido"]}. Piso nuevo, vestuario nuevo, cero excusas.`, tone: "neutral" };
            },
          },
          {
            id: "dinero",
            label: "Ir al destino que paga mejor",
            hint: "Patrimonio arriba, riesgo deportivo",
            apply: (c) => {
              c.arc.params["elegido"] = c.arc.params["alt"] ?? "la cesión";
              flag(c.s, "cedido", 1);
              const f = ensureFinance(c.s);
              f.cash += 40;
              f.history.unshift({ season: "", text: "Prima de cesión", amount: 40 });
              return { title: "Cuenta y riesgo", text: `${c.arc.params["elegido"]} paga la ficha entera. Nadie te ha prometido jugar.`, tone: "neutral" };
            },
          },
          {
            id: "quedarme",
            label: "Quedarte y pelear aquí",
            hint: "Puede salir muy mal",
            apply: (c) => {
              rel(c.s, "coach", 4);
              rel(c.s, "fans", 3);
              remember(c.s, "Rechazaste una cesión para quedarte a pelear el puesto");
              callback(c.s, "cb_quedarse", "Te quedaste rechazando cesión: alguien te lo recordará", 5);
              return { title: "Te quedas", text: "Dices que no a las dos. El míster levanta una ceja: \"espero que sepas lo que has hecho\".", tone: "neutral", end: true };
            },
          },
        ],
      },
      {
        family: "cesion",
        image: "travel",
        category: "life",
        skip: "Un mes después",
        kicker: (c) => `${c.arc.params["elegido"] ?? "Cesión"} · ${c.month}`,
        title: () => "Adaptación",
        text: (c) =>
          `Nuevo campo, hierba peor, gradas más cerca. En ${c.arc.params["elegido"] ?? "el nuevo club"} el entrenador te llama "el chico del grande" delante de todos. Los veteranos deciden en dos semanas si te aceptan.`,
        choices: [
          {
            id: "humilde",
            label: "Entrar de último, callado",
            apply: (c) => {
              rel(c.s, "dressing", 9);
              stat(c.s, "form", 4);
              return { title: "Uno más", text: "Llevas los balones, pagas el desayuno y a la tercera semana te llaman por tu nombre.", tone: "good" };
            },
          },
          {
            id: "estrella",
            label: "Marcar territorio desde el primer día",
            apply: (c) => {
              rel(c.s, "dressing", -7);
              stat(c.s, "form", 6);
              return { title: "El chico del grande", text: "Juegas bien y caes mal. Aquí eso se paga en los balones que no te llegan.", tone: "neutral" };
            },
          },
        ],
      },
      {
        family: "cesion",
        image: "match",
        category: "story",
        skip: "Tres meses después",
        kicker: (c) => `${c.month} · balance de la cesión`,
        title: () => "Lo que has sacado de aquí",
        text: (c) =>
          `${c.arc.params["elegido"] ?? "La cesión"} termina. ${c.s.form >= 55 ? "Has jugado casi todo y te has hecho mayor a golpes." : "Has jugado menos de lo prometido y el préstamo ha sido un año en blanco."} Tu club te llama para saber qué quieres hacer.`,
        choices: [
          {
            id: "volver",
            label: "Volver y exigir sitio",
            apply: (c) => {
              flag(c.s, "cedido", 0);
              const good = c.s.form >= 55;
              rel(c.s, "coach", good ? 4 : -3);
              c.s.xp += good ? 40 : 8;
              milestone(c.s, good ? `Cesión aprovechada en ${c.arc.params["elegido"]}` : `Cesión fallida en ${c.arc.params["elegido"]}`);
              return {
                title: good ? "Vuelves distinto" : "Vuelves igual",
                text: good ? "Vuelves con 30 partidos en las piernas y con cara de haberlos jugado." : "Vuelves sin argumentos y con la sensación de haber perdido un año.",
                tone: good ? "good" : "bad",
                end: true,
              };
            },
          },
          {
            id: "seguir",
            label: "Pedir seguir aquí otro año",
            apply: (c) => {
              flag(c.s, "cedido", 1);
              rel(c.s, "dressing", 5);
              remember(c.s, `Pediste alargar la cesión en ${c.arc.params["elegido"]}`);
              return { title: "Otro año fuera", text: "Aquí juegas. Es menos glamuroso y más carrera.", tone: "neutral", end: true };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 4. TEMPORADA REVELACIÓN ---------------- */
  {
    id: "arc_revelacion",
    label: "Revelación",
    family: "revelacion",
    requires: (s) => s.form >= 62 && computeRole(s) >= 58 && totalApps(s) >= 14,
    weight: () => 26,
    chapters: [
      {
        family: "revelacion",
        image: "press",
        category: "press",
        kicker: (c) => `Sala de prensa · ${c.month}`,
        title: () => "El nombre que se repite",
        text: (c) =>
          `Tres periódicos te ponen en el once ideal de la jornada. ${npc(c.s, "press").name}, periodista, te pide una entrevista larga: quiere hablar de tu barrio, de tu padre y de "hasta dónde puedes llegar".`,
        freeform: "¿Qué titular quieres dejar?",
        choices: [
          {
            id: "humilde",
            label: "Hablar del equipo, no de ti",
            apply: (c) => {
              rel(c.s, "dressing", 6);
              rel(c.s, "coach", 4);
              stat(c.s, "fame", 5);
              return { title: "Titular aburrido", text: "\"Sin mis compañeros no marco\". El vestuario lo lee y lo aprueba.", tone: "good" };
            },
          },
          {
            id: "ambicion",
            label: "Decir en voz alta a dónde quieres llegar",
            apply: (c) => {
              stat(c.s, "fame", 14);
              rel(c.s, "fans", 6);
              rel(c.s, "dressing", -4);
              flag(c.s, "hablo_alto", 1);
              return { title: "Portada", text: "\"Quiero jugar la Champions antes de los 23\". Mañana lo tendrás recortado en tu taquilla.", tone: "neutral" };
            },
          },
        ],
      },
      {
        family: "revelacion",
        image: "agent",
        category: "agent",
        skip: "Dos semanas después",
        kicker: (c) => `${c.month} · llamadas`,
        title: () => "El teléfono empieza a sonar",
        text: (c) =>
          c.s.agent.present
            ? `${c.s.agent.name} llama a las 23:40: "hay dos clubes preguntando por ti. Uno serio y otro para especular. ¿Quieres saber nombres o prefieres jugar tranquilo?".`
            : `Tres representantes te esperan en el parking. Ninguno se presenta igual, todos dicen conocer al director deportivo.`,
        choices: [
          {
            id: "escuchar",
            label: "Escuchar sin mover nada",
            apply: (c) => {
              stat(c.s, "fame", 6);
              if (c.s.agent.present) c.s.agent.trust = clamp(c.s.agent.trust + 6);
              callback(c.s, "cb_interes", "Hay un club esperando el final de temporada para ir a por ti", 6);
              return { title: "Guardado", text: "Nada se mueve hoy. Pero ya existe una carpeta con tu nombre en otra ciudad.", tone: "neutral" };
            },
          },
          {
            id: "presionar",
            label: "Pedir que se muevan ya",
            apply: (c) => {
              rel(c.s, "agent", -5);
              flag(c.s, "presiono_mercado", 1);
              return { title: "Prisas", text: "Cuando el jugador empuja, el club sube el precio y la operación se complica. Ya está en marcha.", tone: "bad" };
            },
          },
        ],
      },
      {
        family: "revelacion",
        image: "stadium",
        category: "story",
        skip: "Un mes y medio después",
        kicker: (c) => `${c.month} · el precio de destacar`,
        title: () => "Ahora te marcan a ti",
        text: (c) =>
          `Los rivales te preparan: doble marca, faltas tácticas, provocaciones. ${c.coach} te lo dice claro: "esto es la segunda parte de ser bueno. Aguantar cuando ya te conocen".`,
        choices: [
          {
            id: "adaptar",
            label: "Cambiar el juego: soltar antes, moverte más",
            apply: (c) => {
              c.s.xp += 45;
              stat(c.s, "form", 5);
              milestone(c.s, "Temporada revelación consolidada");
              return { title: "Aprendes a jugar marcado", text: "Menos regates, más decisiones. El míster sonríe por primera vez en meses.", tone: "good", end: true };
            },
          },
          {
            id: "insistir",
            label: "Seguir haciendo lo mismo, pero más",
            apply: (c) => {
              stat(c.s, "form", -6);
              stat(c.s, "fitness", -6);
              return { title: "Te secan", text: "Dos partidos sin aparecer y la prensa ya escribe \"se ha apagado\". Es el mismo jugador, otro contexto.", tone: "bad", end: true };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 5. FICHAJE DEMASIADO GRANDE ---------------- */
  {
    id: "arc_salto",
    label: "El salto grande",
    family: "salto",
    open: (s) => ({ club: BIG_ABROAD[hash(careerSeed(s), `big${s.seasonIndex}`) % BIG_ABROAD.length]! }),
    requires: (s) => s.age <= 22 && s.overall >= 68 && s.fame >= 35,
    weight: () => 18,
    chapters: [
      {
        family: "salto",
        image: "office",
        category: "market",
        kicker: (c) => `Oferta · ${c.month}`,
        title: (c) => `${c.arc.params["club"]} pregunta por ti`,
        text: (c) =>
          `Oferta real de ${c.arc.params["club"]}: el triple de sueldo, otro país, otro idioma y una plantilla donde serías el séptimo en tu posición. ${c.s.agent.present ? `${c.s.agent.name} no lo esconde: "es demasiado pronto, pero este dinero no siempre vuelve".` : "No tienes representante que te lo explique: decides solo."}`,
        choices: [
          {
            id: "ir",
            label: "Aceptar el salto",
            hint: "Dinero y riesgo alto",
            apply: (c) => {
              flag(c.s, "salto_grande", 1);
              const f = ensureFinance(c.s);
              f.annualSalary = Math.max(f.annualSalary * 2.4, 900);
              c.s.salary = Math.round(f.annualSalary);
              stat(c.s, "fame", 16);
              remember(c.s, `Aceptaste fichar por ${c.arc.params["club"]} muy joven`);
              return { title: "Avión", text: `Te presentan con una bufanda que no sabes sostener. En la foto sales serio porque no entiendes las preguntas.`, tone: "neutral" };
            },
          },
          {
            id: "esperar",
            label: "Esperar un año más aquí",
            apply: (c) => {
              rel(c.s, "coach", 6);
              rel(c.s, "fans", 8);
              remember(c.s, `Rechazaste ${c.arc.params["club"]} para seguir creciendo`);
              return { title: "Un año más", text: "El club respira. Tú te quedas con la duda de qué habría pasado.", tone: "good", end: true };
            },
          },
        ],
      },
      {
        family: "salto",
        image: "locker",
        category: "club",
        skip: "Seis semanas después",
        kicker: (c) => `${c.arc.params["club"]} · ${c.month}`,
        title: () => "El séptimo de la lista",
        text: (c) =>
          `El vestuario habla tres idiomas y ninguno es el tuyo. Entrenas bien y no juegas. El entrenador te llama "kid" y te da doce minutos en Copa. Los tuyos, desde España, preguntan por qué no sales en la tele.`,
        choices: [
          {
            id: "idioma",
            label: "Ponerte con el idioma y el gimnasio",
            apply: (c) => {
              c.s.xp += 35;
              rel(c.s, "dressing", 6);
              stat(c.s, "fitness", 5);
              return { title: "Trabajo invisible", text: "Tres meses después entiendes las charlas y el vestuario te entiende a ti.", tone: "good" };
            },
          },
          {
            id: "aislarse",
            label: "Encerrarte con tu grupo de siempre",
            apply: (c) => {
              rel(c.s, "dressing", -8);
              stat(c.s, "morale", -8);
              flag(c.s, "aislado", 1);
              return { title: "Nostalgia", text: "Videollamadas hasta las tres. Al día siguiente el míster ve las piernas, no la nostalgia.", tone: "bad" };
            },
          },
        ],
      },
      {
        family: "salto",
        image: "travel",
        category: "market",
        skip: "En enero",
        kicker: (c) => `${c.month} · decisión`,
        title: () => "Aguantar o volver",
        text: (c) =>
          `Balance a mitad de curso: ${c.s.form >= 55 ? "has entrado en rotación y el técnico empieza a fiarse" : "acumulas más minutos de banquillo que de campo"}. Hay una cesión de vuelta a España sobre la mesa.`,
        choices: [
          {
            id: "aguantar",
            label: "Quedarte y pelearlo",
            apply: (c) => {
              const ok = c.s.form >= 55;
              c.s.xp += ok ? 40 : 10;
              milestone(c.s, ok ? `Te hiciste un sitio en ${c.arc.params["club"]}` : `El salto a ${c.arc.params["club"]} llegó pronto`);
              return { title: ok ? "Te quedas y juegas" : "Temporada perdida", text: ok ? "Terminas jugando la última media hora casi siempre. Es un principio." : "Terminas el año sin ritmo y con dudas nuevas.", tone: ok ? "good" : "bad", end: true };
            },
          },
          {
            id: "volver",
            label: "Volver cedido a España",
            apply: (c) => {
              flag(c.s, "cedido", 1);
              stat(c.s, "morale", 5);
              return { title: "Vuelta a casa", text: "Vuelves a un vestuario donde entiendes los chistes. Y eso, ahora, importa.", tone: "neutral", end: true };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 6. CONFLICTO CON EL ENTRENADOR ---------------- */
  {
    id: "arc_conflicto",
    label: "Conflicto con el entrenador",
    family: "conflicto",
    requires: (s) => s.rel.coach <= 38,
    weight: () => 30,
    chapters: [
      {
        family: "conflicto",
        image: "tunnel",
        category: "club",
        kicker: (c) => `${c.month} · después del partido`,
        title: () => "La frase en el túnel",
        text: (c) =>
          `${c.coach} te corrige delante de todos con una frase que sobra: "el que no corre, no juega, y aquí hay uno que no corre". Nadie dice tu nombre y todos lo saben.`,
        freeform: "¿Qué le dices en ese momento?",
        choices: [
          {
            id: "callar",
            label: "Tragarlo delante del grupo",
            apply: (c) => {
              rel(c.s, "dressing", 5);
              stat(c.s, "morale", -6);
              return { title: "Silencio", text: "No respondes. El capitán te para en la puerta: \"has hecho bien, pero habla con él el lunes\".", tone: "neutral" };
            },
          },
          {
            id: "responder",
            label: "Responderle allí mismo",
            apply: (c) => {
              rel(c.s, "coach", -12);
              stat(c.s, "discipline", -8);
              flag(c.s, "conflicto_abierto", 1);
              c.s.memory.conflicts.unshift(`Discusión pública con ${npc(c.s, "coach").name}`);
              return { title: "Se oye en el pasillo", text: "Dos frases y un portazo. Mañana lo sabrá la prensa.", tone: "bad" };
            },
          },
        ],
      },
      {
        family: "conflicto",
        image: "office",
        category: "club",
        skip: "El lunes",
        kicker: (c) => `Despacho · ${c.month}`,
        title: () => "Cara a cara",
        text: (c) =>
          `${c.coach} cierra la puerta. "Voy a ser claro: contigo no me fío en los partidos grandes. Puedes convencerme o puedes buscarte otro sitio. Las dos me valen".`,
        choices: [
          {
            id: "convencer",
            label: "Pedir una oportunidad concreta",
            apply: (c) => {
              rel(c.s, "coach", 8);
              flag(c.s, "prueba_coach", 1);
              remember(c.s, `${npc(c.s, "coach").name} te dio una última oportunidad`);
              return { title: "Un partido", text: "\"El sábado juegas. Si no me convences, no vuelves a preguntar\".", tone: "neutral" };
            },
          },
          {
            id: "romper",
            label: "Decirle que quieres salir",
            apply: (c) => {
              flag(c.s, "quiere_salir", 1);
              rel(c.s, "coach", -6);
              return { title: "Ruptura", text: "Se lo dices sin gritar. Él asiente y descuelga el teléfono delante de ti.", tone: "bad" };
            },
          },
          {
            id: "presidente",
            label: "Ir por encima: hablar con el club",
            apply: (c) => {
              rel(c.s, "coach", -14);
              rel(c.s, "dressing", -6);
              flag(c.s, "conflicto_abierto", 1);
              return { title: "Mal camino", text: "El club escucha y se lo cuenta al míster el mismo día. Ahora sois enemigos con papeles.", tone: "bad" };
            },
          },
        ],
      },
      {
        family: "conflicto",
        image: "match",
        category: "story",
        skip: "Un mes después",
        kicker: (c) => `${c.month} · consecuencias`,
        title: (c) => (c.s.rel.coach >= 45 ? "Se arregla en el campo" : "El club toma partido"),
        text: (c) =>
          c.s.rel.coach >= 45
            ? `Dos actuaciones buenas y ${c.coach} te vuelve a nombrar en la charla. No hay disculpas: hay alineación.`
            : `El vestuario está partido. La directiva mide si cae el entrenador o cae el jugador, y tú llevas menos años que él en el club.`,
        choices: [
          {
            id: "cerrar",
            label: "Aceptar el desenlace",
            apply: (c) => {
              const good = c.s.rel.coach >= 45;
              if (!good) {
                const fired = Math.random() < 0.4;
                if (fired) {
                  npc(c.s, "coach").name = npc(c.s, "coach").name;
                  flag(c.s, "cambio_entrenador", 1);
                  rel(c.s, "coach", 25);
                  return { title: "Cae el entrenador", text: "Lo destituyen en marzo. Llega otro técnico y todo vuelve a empezar de cero contigo.", tone: "neutral", end: true };
                }
                flag(c.s, "quiere_salir", 1);
                return { title: "Fuera de los planes", text: "Terminas el año entrenando aparte los viernes. El club buscará salida en verano.", tone: "bad", end: true };
              }
              milestone(c.s, `Reconciliación con ${npc(c.s, "coach").name}`);
              return { title: "Reconciliación", text: "No os vais a llamar por Navidad, pero jugáis juntos y eso ya es suficiente.", tone: "good", end: true };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 7. LESIÓN Y REGRESO ---------------- */
  {
    id: "arc_lesion",
    label: "Lesión y regreso",
    family: "lesion",
    requires: (s) => !!s.injury || s.flags["riesgo_recaida"] === 1 || s.fitness <= 45,
    weight: (s) => (s.injury ? 40 : 12),
    chapters: [
      {
        family: "lesion",
        image: "injury",
        category: "medical",
        kicker: (c) => `Clínica · ${c.month}`,
        title: () => "Lo que dice la resonancia",
        text: (c) =>
          `El doctor gira la pantalla y señala una sombra. ${c.s.injury ? c.s.injury.label : "Rotura muscular con fibras afectadas"}. Habla de meses, no de semanas, y de "no volver antes de tiempo, que aquí se acaban carreras".`,
        choices: [
          {
            id: "plazos",
            label: "Aceptar los plazos largos",
            apply: (c) => {
              if (!c.s.injury) injure(c.s, 8, "Rotura muscular");
              if (c.s.injury) c.s.injury.treated = true;
              flag(c.s, "riesgo_recaida", 0);
              stat(c.s, "discipline", 5);
              return { title: "Paciencia", text: "Cinco meses de gimnasio, piscina y partidos vistos desde arriba.", tone: "neutral" };
            },
          },
          {
            id: "acortar",
            label: "Buscar un plan para volver antes",
            apply: (c) => {
              if (!c.s.injury) injure(c.s, 5, "Rotura muscular forzada");
              if (c.s.injury) { c.s.injury.treated = true; c.s.injury.matchesOut = Math.max(2, c.s.injury.matchesOut - 3); }
              flag(c.s, "riesgo_recaida", 1);
              return { title: "Contra el reloj", text: "Fisio privado, dos sesiones diarias y una fecha en la cabeza. El club no firma ese plan.", tone: "bad" };
            },
          },
        ],
      },
      {
        family: "lesion",
        image: "gym",
        category: "medical",
        skip: "Diez semanas después",
        kicker: (c) => `Gimnasio · ${c.month}`,
        title: () => "Mientras tú estabas fuera",
        text: (c) =>
          `El chico que ocupó tu sitio lleva cuatro goles. ${npc(c.s, "physio").name}, fisioterapeuta, te tapa el móvil: "no mires la clasificación, mira la rodilla". El vestuario ha seguido sin ti y eso es lo que más duele.`,
        choices: [
          {
            id: "cabeza",
            label: "Centrarte solo en la rehabilitación",
            apply: (c) => {
              stat(c.s, "fitness", 12);
              c.s.xp += 15;
              return { title: "Silencio y hierro", text: "No pisas el campo hasta que el fisio lo dice. Es aburrido y funciona.", tone: "good" };
            },
          },
          {
            id: "vestuario",
            label: "Ir cada día al vestuario aunque no entrenes",
            apply: (c) => {
              rel(c.s, "dressing", 8);
              stat(c.s, "morale", 5);
              stat(c.s, "fitness", 4);
              return { title: "Presente", text: "Estás en cada charla y en cada autobús. Cuando vuelvas, nadie tendrá que presentarte.", tone: "good" };
            },
          },
        ],
      },
      {
        family: "lesion",
        image: "training",
        category: "story",
        skip: "Cuatro meses después",
        kicker: (c) => `${c.month} · alta`,
        title: () => "El primer duelo después",
        text: (c) =>
          `Primer entrenamiento con contacto. Vas a por un balón dividido y el cuerpo te pide frenar medio segundo antes. Eso, dicen los veteranos, es lo que hay que perder.`,
        choices: [
          {
            id: "entrar",
            label: "Entrar sin pensarlo",
            apply: (c) => {
              const bad = Math.random() < 0.22;
              if (bad) {
                injure(c.s, 4, "Recaída en la misma zona");
                return { title: "Otra vez", text: "Crujido y silencio. El fisio no dice nada, solo baja la cabeza.", tone: "bad", end: true };
              }
              stat(c.s, "form", 8);
              milestone(c.s, "Regreso completado");
              return { title: "Miedo superado", text: "Entras fuerte, te levantas y sigues. Ya has vuelto de verdad.", tone: "good", end: true };
            },
          },
          {
            id: "medir",
            label: "Medir el riesgo unas semanas más",
            apply: (c) => {
              stat(c.s, "fitness", 8);
              stat(c.s, "form", -3);
              milestone(c.s, "Regreso prudente tras la lesión");
              return { title: "Con freno", text: "Vuelves entero pero a medio gas. El entrenador lo nota y espera.", tone: "neutral", end: true };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 8. RENOVACIÓN / MERCADO ---------------- */
  {
    id: "arc_renovacion",
    label: "Renovación",
    family: "contrato",
    requires: (s) => !!s.contract && (s.contractYears ?? 3) <= 2 && s.age >= 17,
    weight: () => 24,
    chapters: [
      {
        family: "contrato",
        image: "office",
        category: "market",
        kicker: (c) => `Contrato · ${c.month}`,
        title: () => "Queda un año",
        text: (c) =>
          `El club te ofrece renovar con una subida pequeña y una cláusula grande. ${c.s.agent.present ? `${c.s.agent.name} lo resume: "esto es un candado, no una recompensa".` : "Nadie negocia por ti: la carpeta la lees tú."}`,
        choices: [
          {
            id: "firmar",
            label: "Firmar lo que hay",
            hint: "Seguridad ahora",
            apply: (c) => {
              const f = ensureFinance(c.s);
              f.annualSalary = Math.round(f.annualSalary * 1.25 + 60);
              c.s.salary = Math.round(f.annualSalary);
              c.s.contractYears = 4;
              rel(c.s, "coach", 4);
              rel(c.s, "fans", 5);
              return { title: "Renovado", text: "Foto con el director deportivo y bolígrafo del club. Tranquilidad barata.", tone: "good", end: true };
            },
          },
          {
            id: "negociar",
            label: "Pedir más y esperar",
            apply: (c) => {
              flag(c.s, "negociando", 1);
              rel(c.s, "agent", 4);
              return { title: "Se abre negociación", text: "El club se levanta de la mesa sin cerrar. Hay semanas por delante.", tone: "neutral" };
            },
          },
          {
            id: "publico",
            label: "Dejar caer en prensa que hay ofertas",
            apply: (c) => {
              flag(c.s, "presiono_mercado", 1);
              rel(c.s, "fans", -8);
              stat(c.s, "fame", 8);
              return { title: "Presión pública", text: "Titular fuera de sitio. El palco lo lee y cambia de tono.", tone: "bad" };
            },
          },
        ],
      },
      {
        family: "contrato",
        image: "agent",
        category: "market",
        skip: "Tres semanas después",
        kicker: (c) => `${c.month} · negociación`,
        title: () => "La respuesta del club",
        text: (c) =>
          `El club mejora la mitad de lo pedido y avisa: "si no firma, en enero escuchamos ofertas". ${c.s.flags["presiono_mercado"] === 1 ? "Tu salida en prensa ha endurecido a todo el mundo." : "Nadie ha filtrado nada, lo que ayuda."}`,
        choices: [
          {
            id: "cerrar",
            label: "Cerrar en la cifra intermedia",
            apply: (c) => {
              const f = ensureFinance(c.s);
              f.annualSalary = Math.round(f.annualSalary * 1.5 + 90);
              c.s.salary = Math.round(f.annualSalary);
              c.s.contractYears = 4;
              milestone(c.s, "Renovación firmada");
              return { title: "Firmado", text: "Manos, foto y a entrenar. El sueldo ya no es el de un chaval.", tone: "good", end: true };
            },
          },
          {
            id: "romper",
            label: "Romper la negociación",
            apply: (c) => {
              c.s.contractYears = 1;
              rel(c.s, "fans", -6);
              callback(c.s, "cb_contrato", "Tu contrato acaba y el club ya busca recambio", 5);
              return { title: "Se cae la operación", text: "Vuelves al vestuario con la sensación de que ya eres un tema y no un compañero.", tone: "bad", end: true };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 9. CAPITÁN / VESTUARIO ---------------- */
  {
    id: "arc_capitan",
    label: "Vestuario",
    family: "vestuario",
    requires: (s) => totalApps(s) >= 8,
    weight: () => 16,
    chapters: [
      {
        family: "vestuario",
        image: "locker",
        category: "club",
        kicker: (c) => `Vestuario · ${c.month}`,
        title: (c) => `${npc(c.s, "captain").name} te sienta a su lado`,
        text: (c) =>
          `${c.captain} cambia las taquillas para ponerte al lado de la suya. "Aquí se aprende sentado y callado. Yo te digo lo que nadie te va a decir: cómo se pierde una carrera en dos años".`,
        choices: [
          {
            id: "escuchar",
            label: "Escuchar y preguntar",
            apply: (c) => {
              rel(c.s, "dressing", 8);
              npcMood(c.s, "captain", 12);
              c.s.xp += 20;
              callback(c.s, "cb_capitan", `${npc(c.s, "captain").name} espera algo de ti cuando el equipo caiga`, 6);
              return { title: "Tutela", text: "Dos horas de charla y un consejo concreto sobre cómo dormir la noche antes de jugar.", tone: "good" };
            },
          },
          {
            id: "pasar",
            label: "Agradecer y mantener distancia",
            apply: (c) => {
              npcMood(c.s, "captain", -8);
              stat(c.s, "discipline", 2);
              return { title: "Distancia", text: "\"Tú mismo\", dice, y se gira. En este vestuario eso pesa.", tone: "neutral" };
            },
          },
        ],
      },
      {
        family: "vestuario",
        image: "locker",
        category: "club",
        skip: "Dos meses después",
        kicker: (c) => `${c.month} · crisis de resultados`,
        title: () => "Alguien tiene que hablar",
        text: (c) =>
          `Cuatro partidos sin ganar. ${c.captain} reúne al grupo y pide que hable alguien joven, "porque los de siempre ya no os convencemos". Todas las miradas caen sobre ti.`,
        choices: [
          {
            id: "hablar",
            label: "Hablar delante del grupo",
            apply: (c) => {
              const ok = c.s.rel.dressing >= 50;
              rel(c.s, "dressing", ok ? 10 : -5);
              stat(c.s, "morale", ok ? 6 : -4);
              milestone(c.s, ok ? "Ganaste voz en el vestuario" : "Hablaste sin autoridad en el vestuario");
              return ok
                ? { title: "Te escuchan", text: "Dices tres frases y ninguna es tópica. El sábado se gana y alguien lo recordará.", tone: "good", end: true }
                : { title: "Nadie te sigue", text: "Hablas y notas que sobras. Aún no has jugado lo suficiente para eso.", tone: "bad", end: true };
            },
          },
          {
            id: "callar",
            label: "Callar y responder en el campo",
            apply: (c) => {
              stat(c.s, "form", 5);
              rel(c.s, "dressing", 3);
              return { title: "Respuesta en el campo", text: "No abres la boca y firmas tu mejor partido del año.", tone: "good", end: true };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 10. VIDA Y DINERO ---------------- */
  {
    id: "arc_dinero",
    label: "Dinero",
    family: "dinero",
    requires: (s) => cash(s) >= 45 && (s.salary ?? 0) > 0,
    weight: (s) => (cash(s) >= 200 ? 22 : 12),
    chapters: [
      {
        family: "dinero",
        image: "office",
        category: "market",
        kicker: (c) => `Cuenta · ${c.month}`,
        title: () => "El primer dinero de verdad",
        text: (c) =>
          `Miras el saldo: ${Math.round(cash(c.s))} mil €. Tu padre te ha dicho tres veces "no lo toques". Tu primo tiene una idea. Y en el concesionario ya saben tu nombre.`,
        choices: [
          {
            id: "padres",
            label: "Quitar la hipoteca de tus padres",
            hint: "Familia arriba, saldo abajo",
            apply: (c) => {
              const f = ensureFinance(c.s);
              const amount = Math.min(f.cash, Math.max(30, Math.round(f.cash * 0.4)));
              f.cash -= amount;
              f.history.unshift({ season: "", text: "Ayuda a tus padres", amount: -amount });
              rel(c.s, "family", 14);
              remember(c.s, "Pagaste parte de la hipoteca de tus padres");
              callback(c.s, "cb_padres", "Tu madre quiere devolverte algo de aquel dinero", 8);
              return { title: "Sin deuda en casa", text: `Tu madre llora en la cocina y tu padre solo dice "eso no se hace por obligación". ${amount} mil € menos y otra cosa más.`, tone: "gold" };
            },
          },
          {
            id: "invertir",
            label: "Meter dinero en el negocio de un amigo",
            hint: "Puede triplicar o quebrar",
            apply: (c) => {
              const f = ensureFinance(c.s);
              const amount = Math.min(f.cash, 60);
              f.cash -= amount;
              f.commitments.push({ name: "Negocio de un amigo", yearly: 0, seasonsLeft: 3 });
              f.history.unshift({ season: "", text: "Inversión en negocio", amount: -amount });
              flag(c.s, "negocio_amigo", 1);
              callback(c.s, "cb_negocio", "El negocio en el que invertiste tiene noticias", 10);
              return { title: "Socio", text: `${amount} mil € en un local con el nombre a medias. Te enseñan un plano en una servilleta.`, tone: "neutral" };
            },
          },
          {
            id: "guardar",
            label: "No tocar nada",
            apply: (c) => {
              stat(c.s, "discipline", 5);
              return { title: "Quieto", text: "El dinero se queda donde está. Aburrido y correcto.", tone: "good", end: true };
            },
          },
        ],
      },
      {
        family: "dinero",
        image: "travel",
        category: "life",
        skip: "Meses después",
        kicker: (c) => `${c.month} · consecuencia`,
        title: () => "Lo que hiciste con el dinero",
        text: (c) =>
          c.s.flags["negocio_amigo"] === 1
            ? `Tu amigo aparece con dos carpetas y una cara raras. El local funciona a medias y necesita otra inyección o cierra.`
            : `El dinero que no tocaste ha crecido poco y ha servido para dormir bien. Ahora aparece una decisión más grande: casa propia.`,
        choices: [
          {
            id: "mas",
            label: "Poner más dinero / comprar casa",
            apply: (c) => {
              const f = ensureFinance(c.s);
              const amount = Math.min(f.cash, 90);
              f.cash -= amount;
              if (c.s.flags["negocio_amigo"] === 1) {
                const ok = Math.random() < 0.45;
                flag(c.s, "negocio_amigo", ok ? 2 : 0);
                if (ok) f.history.unshift({ season: "", text: "El negocio arranca", amount: 0 });
                return ok
                  ? { title: "Salva el negocio", text: "Seis meses después hay cola en la puerta y tu apellido en la fachada.", tone: "good", end: true }
                  : { title: "Se lo lleva todo", text: `${amount} mil € que no vuelven y una amistad tocada.`, tone: "bad", end: true };
              }
              f.properties.push({ name: "Casa propia", value: amount * 3, debt: amount * 2 });
              return { title: "Escritura", text: "Primera casa a tu nombre, con hipoteca y con habitación para tus padres.", tone: "good", end: true };
            },
          },
          {
            id: "cortar",
            label: "Cortar por lo sano",
            apply: (c) => {
              if (c.s.flags["negocio_amigo"] === 1) {
                flag(c.s, "negocio_amigo", 0);
                rel(c.s, "family", -4);
                return { title: "Fin del negocio", text: "Cierras el grifo. Tu amigo no lo entiende y dejáis de hablar un año.", tone: "bad", end: true };
              }
              stat(c.s, "discipline", 4);
              return { title: "Sigues de alquiler", text: "Ni casa ni deuda. En este oficio no es mala idea.", tone: "neutral", end: true };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 11. FAMILIA ---------------- */
  {
    id: "arc_familia",
    label: "Familia",
    family: "familia",
    requires: () => true,
    weight: (s) => (s.age <= 20 ? 20 : 12),
    chapters: [
      {
        family: "familia",
        image: "family",
        category: "life",
        kicker: (c) => `${c.month} · casa`,
        title: () => "624 kilómetros",
        text: (c) =>
          `Tu padre ha conducido 624 kilómetros para verte jugar. Está en la grada con el móvil listo. ${c.role < 45 ? "Al final no sales del banquillo." : "Juegas y él no se sienta ni un minuto."} Después te espera en el parking sin decir nada del viaje.`,
        freeform: "¿Qué le dices en el parking?",
        choices: [
          {
            id: "cenar",
            label: "Cenar con él antes de que vuelva",
            apply: (c) => {
              rel(c.s, "family", 12);
              stat(c.s, "morale", 6);
              remember(c.s, "Tu padre condujo 624 km y cenasteis antes de que volviera");
              callback(c.s, "cb_624", "Aquel viaje de 624 km volverá a aparecer", 12);
              return { title: "Menú del día a las once de la noche", text: "\"Yo vengo a verte, no a verte jugar\", dice, y pide postre para los dos.", tone: "gold" };
            },
          },
          {
            id: "prisa",
            label: "Despedirte rápido: hay que descansar",
            apply: (c) => {
              rel(c.s, "family", -6);
              stat(c.s, "discipline", 3);
              remember(c.s, "Tu padre condujo 624 km y te despediste en el parking");
              return { title: "Diez minutos", text: "Se va con el bocadillo que había traído para ti. No se queja.", tone: "bad" };
            },
          },
        ],
      },
      {
        family: "familia",
        image: "family",
        category: "life",
        skip: "Temporadas después",
        kicker: (c) => `${c.month} · los tuyos`,
        title: () => "La distancia",
        text: (c) =>
          `Tres ciudades en cinco años. Tu madre te pregunta si vas a estar en Navidad y tú miras el calendario de competición antes de contestar. ${npc(c.s, "friend").name}, compañero de confianza, te dice que él ya no habla con nadie de su barrio.`,
        choices: [
          {
            id: "traer",
            label: "Traer a tu familia contigo",
            apply: (c) => {
              const f = ensureFinance(c.s);
              const amount = Math.min(f.cash, 70);
              f.cash -= amount;
              rel(c.s, "family", 14);
              stat(c.s, "morale", 8);
              return { title: "Se mudan", text: "Alquilas cerca y tu padre aprende a moverse en otra ciudad a los sesenta.", tone: "good", end: true };
            },
          },
          {
            id: "solo",
            label: "Seguir solo y llamar cada domingo",
            apply: (c) => {
              rel(c.s, "family", 4);
              stat(c.s, "morale", -3);
              return { title: "Domingos de videollamada", text: "Funciona, hasta que un domingo nadie coge el teléfono porque están en una boda.", tone: "neutral", end: true };
            },
          },
        ],
      },
    ],
  },

  /* ---------------- 12. ESTRELLA / LEGADO ---------------- */
  {
    id: "arc_legado",
    label: "Legado",
    family: "legado",
    requires: (s) => s.overall >= 84 && s.fame >= 65 && s.age >= 24,
    weight: () => 22,
    chapters: [
      {
        family: "legado",
        image: "celebration",
        category: "story",
        kicker: (c) => `${c.month} · élite`,
        title: () => "Ya no eres una promesa",
        text: (c) =>
          `Te nombran capitán en la charla y el club pone tu cara en la fachada del estadio. ${c.captain} te pasa el brazalete y una frase: "esto no se lleva, se aguanta".`,
        choices: [
          {
            id: "asumir",
            label: "Asumir el peso",
            apply: (c) => {
              rel(c.s, "dressing", 10);
              rel(c.s, "fans", 10);
              milestone(c.s, "Capitán y referencia del club");
              return { title: "Brazalete", text: "Hablas en la comida de Navidad y todos callan. Se ha hecho tarde y se ha hecho bien.", tone: "gold" };
            },
          },
          {
            id: "rechazar",
            label: "Decir que no te hace falta",
            apply: (c) => {
              rel(c.s, "dressing", -6);
              stat(c.s, "fame", 4);
              return { title: "Sin brazalete", text: "\"Yo lidero jugando\". Medio vestuario lo entiende, el otro medio no.", tone: "neutral" };
            },
          },
        ],
      },
      {
        family: "legado",
        image: "office",
        category: "market",
        skip: "Al final de temporada",
        kicker: (c) => `${c.month} · decisión de carrera`,
        title: () => "La oferta que lo cambia todo",
        text: (c) =>
          `Llega una oferta de Arabia con cifras que no caben en una servilleta y un contrato con cláusulas raras. También está la opción de terminar aquí, ganar menos y quedarte en la historia del club.`,
        choices: [
          {
            id: "dinero",
            label: "Aceptar el contrato enorme",
            apply: (c) => {
              const f = ensureFinance(c.s);
              f.annualSalary = Math.round(f.annualSalary * 3 + 4000);
              c.s.salary = Math.round(f.annualSalary);
              f.cash += 1500;
              rel(c.s, "fans", -12);
              milestone(c.s, "Contrato millonario en Arabia");
              return { title: "Otro fútbol", text: "Estadios llenos a medias y una cuenta que no vuelve a mirar nadie de tu familia.", tone: "neutral", end: true };
            },
          },
          {
            id: "legado",
            label: "Quedarte y cerrar tu historia aquí",
            apply: (c) => {
              rel(c.s, "fans", 18);
              achieve(c.s, "leyenda");
              milestone(c.s, `Leyenda de ${clubDef(c.s.clubId).name}`);
              return { title: "Uno de los suyos", text: `${netWorth(c.s) >= 3000 ? "Ya tienes el dinero hecho." : "No serás el más rico."} Serás el que se quedó.`, tone: "gold", end: true };
            },
          },
        ],
      },
    ],
  },
];

const arcById = (id: string): Arc | undefined => ARCS.find((a) => a.id === id);

/* ==================== Escenas secundarias contextuales ==================== */

interface Beat {
  id: string;
  family: string;
  image: SceneKey;
  category: EventCategory;
  requires: (s: GameState) => boolean;
  build: (s: GameState) => { kicker: string; title: string; text: string; choices: { id: string; label: string; hint?: string; apply: (s: GameState) => Res }[]; freeform?: string };
}

const BEATS: Beat[] = [
  {
    id: "beat_pretemporada_test",
    family: "pretemporada",
    image: "gym",
    category: "preseason",
    requires: (s) => directorState(s).sceneInSeason <= 3,
    build: (s) => ({
      kicker: `Pretemporada · ${currentMonth(s)}`,
      title: "Tests del primer día",
      text: `Básculas, pliegues y un test de resistencia en cuesta. El preparador lee tus números en voz alta delante de todos: ${s.fitness >= 65 ? "estás por encima de la media del grupo" : "estás por debajo y se nota en la segunda serie"}. ${who(s, "coach")} anota sin comentar.`,
      choices: [
        { id: "apretar", label: "Terminar primero cueste lo que cueste", hint: "Impresión alta, físico justo", apply: (st) => { stat(st, "fitness", -4); rel(st, "coach", 6); return { title: "Primero en la cuesta", text: "Llegas sin aire y con el respeto del cuerpo técnico.", tone: "good" }; } },
        { id: "medir", label: "Administrar y no romperte en julio", hint: "Sensato", apply: (st) => { stat(st, "fitness", 7); return { title: "Julio largo", text: "No destacas y llegas entero a septiembre, que es cuando se juega.", tone: "neutral" }; } },
      ],
    }),
  },
  {
    id: "beat_jerarquia_pretemporada",
    family: "pretemporada",
    image: "locker",
    category: "preseason",
    requires: (s) => directorState(s).sceneInSeason <= 4,
    build: (s) => ({
      kicker: `Pretemporada · ${currentMonth(s)}`,
      title: "Dorsales y jerarquías",
      text: `El delegado reparte dorsales. El tuyo es el ${20 + (hash(careerSeed(s), `dorsal${s.seasonIndex}`) % 15)}. ${who(s, "captain")} explica sin ironía cómo funciona el vestuario: sitio en el autobús, turno en el gimnasio y quién habla en los viajes.`,
      choices: [
        { id: "pedir", label: "Pedir un dorsal bajo", hint: "Ambición visible", apply: (st) => { rel(st, "dressing", -4); stat(st, "fame", 4); return { title: "Se ríen", text: "\"El 10 lo tiene alguien que lleva ocho años aquí\". Toca esperar.", tone: "neutral" }; } },
        { id: "aceptar", label: "Quedarte el que te dan", apply: (st) => { rel(st, "dressing", 5); return { title: "Sin ruido", text: "Coges tu camiseta y tu sitio del fondo del autobús.", tone: "good" }; } },
      ],
    }),
  },
  {
    id: "beat_nolist_septiembre",
    family: "convocatoria",
    image: "locker",
    category: "club",
    requires: (s) => computeRole(s) < 50,
    build: (s) => ({
      kicker: `${currentMonth(s)} · lista`,
      title: "No estás en la convocatoria",
      text: `Vuelven a colgar la lista y tu apellido no aparece. Nadie te explica nada; el míster habla del rival. ${who(s, "friend")} te manda un mensaje: "vente al gimnasio el domingo, yo tampoco voy".`,
      choices: [
        { id: "gym", label: "Entrenar el domingo mientras juegan", apply: (st) => { stat(st, "fitness", 6); st.xp += 14; return { title: "Domingo de gimnasio", text: "El estadio se oye desde la sala de pesas. Trabajas igual.", tone: "neutral" }; } },
        { id: "preguntar", label: "Preguntar al entrenador por qué", apply: (st) => { const ok = st.rel.coach >= 50; rel(st, "coach", ok ? 3 : -6); return ok ? { title: "Respuesta honesta", text: "\"Es semana de gente hecha. La siguiente entras\".", tone: "neutral" } : { title: "Mala respuesta", text: "\"Cuando tenga que explicarte algo, te llamo yo\".", tone: "bad" }; } },
      ],
    }),
  },
  {
    id: "beat_grupo_equivocado",
    family: "humor",
    image: "locker",
    category: "gossip",
    requires: (s) => totalApps(s) >= 3,
    build: (s) => ({
      kicker: `${currentMonth(s)} · móvil`,
      title: "Mensaje en el grupo equivocado",
      text: `Querías mandar "este entrenador no tiene idea" a un amigo. Lo has mandado al grupo del vestuario. 27 personas. Nadie escribe durante cuatro minutos y luego ${who(s, "captain")} pone: "borra eso ya".`,
      freeform: "¿Qué escribes a continuación en el grupo?",
      choices: [
        { id: "asumir", label: "Asumirlo y disculparte en el grupo", apply: (st) => { rel(st, "dressing", 4); rel(st, "coach", -5); stat(st, "discipline", 3); return { title: "Cara al frente", text: "Al día siguiente el míster no dice nada, que es peor.", tone: "neutral" }; } },
        { id: "hackeado", label: "Decir que te han cogido el móvil", apply: (st) => { rel(st, "dressing", -8); return { title: "Nadie se lo cree", text: "El chiste dura tres meses y la frase se queda como mote.", tone: "bad" }; } },
      ],
    }),
  },
  {
    id: "beat_malum_a",
    family: "humor",
    image: "celebration",
    category: "gossip",
    requires: (s) => s.fame >= 30,
    build: (s) => ({
      kicker: `${currentMonth(s)} · propuesta rara`,
      title: "Malum-a te quiere en su videoclip",
      text: `Malum-a, cantante de reguetón con 40 millones de oyentes, ofrece 5.000 € por aparecer tres segundos en un videoclip rodado en un aparcamiento. El club no lo prohíbe, pero "preferiría que no".`,
      choices: [
        { id: "ir", label: "Aceptar los 5.000 €", apply: (st) => { const f = ensureFinance(st); f.cash += 5; f.history.unshift({ season: "", text: "Cachet videoclip", amount: 5 }); stat(st, "fame", 16); rel(st, "coach", -5); callback(st, "cb_malum", "El videoclip de Malum-a se estrena y alguien lo comenta", 9); return { title: "Tres segundos de gloria", text: "Sales apoyado en un coche que no es tuyo, con gafas que no te pegan.", tone: "neutral" }; } },
        { id: "no", label: "Decir que no", apply: (st) => { rel(st, "coach", 4); stat(st, "discipline", 3); return { title: "Sin videoclip", text: "El representante de la cantante insiste dos semanas y se rinde.", tone: "neutral" }; } },
      ],
    }),
  },
  {
    id: "beat_fantasy",
    family: "humor",
    image: "locker",
    category: "gossip",
    requires: (s) => totalApps(s) >= 10,
    build: (s) => ({
      kicker: `${currentMonth(s)} · vestuario`,
      title: "Te han fichado en el Fantasy del vestuario",
      text: `${who(s, "friend")} confiesa que te tiene en su equipo del Fantasy y te pide que "hagas algo, aunque sea un córner". La liga del vestuario la lidera el utillero con 940 puntos.`,
      choices: [
        { id: "jugar", label: "Meterte en la liga y picarte", apply: (st) => { rel(st, "dressing", 7); return { title: "Liga interna", text: "Pierdes la jornada y pagas el desayuno de doce personas.", tone: "good" }; } },
        { id: "ignorar", label: "Pasar del tema", apply: (st) => { stat(st, "discipline", 2); return { title: "Sin Fantasy", text: "Te llaman aburrido en tres idiomas.", tone: "neutral" }; } },
      ],
    }),
  },
  {
    id: "beat_prensa_local",
    family: "prensa",
    image: "press",
    category: "press",
    requires: (s) => totalApps(s) >= 5,
    build: (s) => ({
      kicker: `${currentMonth(s)} · sala de prensa`,
      title: `${npc(s, "press").name} pregunta por el entrenador`,
      text: `${npc(s, "press").name}, periodista, te pone la grabadora delante y busca titular: "¿Crees que el míster te está usando mal?". Detrás, el jefe de prensa del club te mira fijamente.`,
      freeform: "¿Qué respondes exactamente?",
      choices: [
        { id: "diplomacia", label: "Contestar sin dar titular", apply: (st) => { rel(st, "coach", 5); stat(st, "fame", 2); return { title: "Nada que rascar", text: "Sales del atril y el jefe de prensa te da una palmada.", tone: "good" }; } },
        { id: "sincero", label: "Decir la verdad aunque duela", apply: (st) => { stat(st, "fame", 9); rel(st, "coach", -8); flag(st, "hablo_alto", 1); return { title: "Titular servido", text: "Mañana está en portada y el míster lo lee en el desayuno.", tone: "bad" }; } },
      ],
    }),
  },
  {
    id: "beat_coche",
    family: "dinero",
    image: "travel",
    category: "market",
    requires: (s) => cash(s) >= 60 && s.age <= 24,
    build: (s) => ({
      kicker: `${currentMonth(s)} · concesionario`,
      title: "El primer coche",
      text: `Saldo: ${Math.round(cash(s))} mil €. Un compañero te lleva a un concesionario donde "hacen precio a los del club". Hay un utilitario sensato y hay algo naranja con 500 caballos.`,
      choices: [
        { id: "sensato", label: "Comprar el coche sensato", apply: (st) => { const f = ensureFinance(st); f.cash -= 25; f.properties.push({ name: "Coche sensato", value: 22, debt: 0 }); return { title: "Coche de gente normal", text: "Nadie te mira en el parking y llegas a los entrenamientos igual.", tone: "good" }; } },
        { id: "absurdo", label: "Comprar el coche absurdo", hint: "Vestuario y entrenador lo verán", apply: (st) => { const f = ensureFinance(st); const price = Math.min(f.cash, 95); f.cash -= price; f.properties.push({ name: "Coche absurdo", value: Math.round(price * 0.7), debt: 0 }); stat(st, "fame", 8); rel(st, "coach", -6); rel(st, "dressing", -3); callback(st, "cb_coche", "Alguien va a opinar de tu coche cuando el equipo pierda", 7); return { title: "Naranja", text: "Suena al arrancar y se oye desde el vestuario. Mala idea preciosa.", tone: "neutral" }; } },
      ],
    }),
  },
  {
    id: "beat_estudios",
    family: "familia",
    image: "family",
    category: "life",
    requires: (s) => s.age <= 18,
    build: (s) => ({
      kicker: `${currentMonth(s)} · casa`,
      title: "Estudios o fútbol",
      text: `Reunión en el instituto: si sigues con los viajes, repites curso. Tu madre habla de "un plan B" y tu padre calla, que es su manera de opinar.`,
      choices: [
        { id: "seguir", label: "Dejar el curso y apostar todo al fútbol", apply: (st) => { rel(st, "family", -6); st.xp += 25; remember(st, "Dejaste los estudios para apostar todo al fútbol"); return { title: "Todo al fútbol", text: "Tu madre firma el papel sin mirarte. Ahora hay una sola puerta.", tone: "neutral" }; } },
        { id: "compaginar", label: "Compaginar aunque cueste", apply: (st) => { rel(st, "family", 10); stat(st, "fitness", -4); stat(st, "discipline", 5); return { title: "Dos frentes", text: "Estudias en autobuses y duermes mal. Tu madre respira.", tone: "good" }; } },
      ],
    }),
  },
  {
    id: "beat_agente_ruido",
    family: "agente",
    image: "agent",
    category: "agent",
    requires: (s) => s.agent.present,
    build: (s) => ({
      kicker: `${currentMonth(s)} · 23:41`,
      title: `${s.agent.name} llama tarde`,
      text: `${s.agent.name} habla desde un coche: "hay un rumor sobre ti que no es verdad. Puedo desmentirlo o dejarlo correr para que el club se ponga nervioso. Tú decides, pero decide ya".`,
      choices: [
        { id: "desmentir", label: "Desmentirlo y jugar limpio", apply: (st) => { st.agent.trust = clamp(st.agent.trust + 8); rel(st, "coach", 4); return { title: "Ruido apagado", text: "A la mañana siguiente nadie habla del tema.", tone: "good" }; } },
        { id: "dejar", label: "Dejarlo correr", apply: (st) => { stat(st, "fame", 7); rel(st, "dressing", -5); flag(st, "presiono_mercado", 1); return { title: "Que corra", text: "El club llama al agente antes de comer. Ha funcionado y ha costado.", tone: "neutral" }; } },
      ],
    }),
  },
  {
    id: "beat_sin_agente",
    family: "agente",
    image: "agent",
    category: "agent",
    requires: (s) => !s.agent.present && s.age >= 17,
    build: (s) => ({
      kicker: `${currentMonth(s)} · parking`,
      title: "Alguien quiere representarte",
      text: `Un hombre con carpeta te espera en el parking del anexo. Dice que ha visto tus tres últimos partidos y que "sin alguien que llame por ti, aquí te comen". Aún no tienes representante.`,
      choices: [
        { id: "escuchar", label: "Escucharle y pedir tiempo", apply: (st) => { flag(st, "agente_aplazado", 1); return { title: "Lo pensarás", text: "Te quedas su número en la nota del móvil, sin nombre.", tone: "neutral" }; } },
        { id: "cortar", label: "Cortarlo: de esto se encarga tu padre", apply: (st) => { rel(st, "family", 6); return { title: "Tu padre lo lleva", text: "Tu padre no sabe de cláusulas, pero sabe cuándo alguien miente.", tone: "neutral" }; } },
      ],
    }),
  },
  {
    id: "beat_afición",
    family: "afición",
    image: "stadium",
    category: "club",
    requires: (s) => s.rel.fans <= 40 && totalApps(s) >= 8,
    build: (s) => ({
      kicker: `${currentMonth(s)} · grada`,
      title: "Te silban al cambiarte",
      text: `Te cambian en el 63' y una parte del fondo silba. En el banquillo nadie te mira. ${who(s, "captain")} se acerca y te dice que "esto se arregla el sábado, no en Twitter".`,
      choices: [
        { id: "aplaudir", label: "Aplaudir a la grada al salir", apply: (st) => { rel(st, "fans", 8); return { title: "Gesto", text: "Los silbidos bajan. La gente perdona el error, no el desprecio.", tone: "good" }; } },
        { id: "responder", label: "Responder con un gesto", apply: (st) => { rel(st, "fans", -14); stat(st, "fame", 6); flag(st, "afición_contra", 1); return { title: "Se lía", text: "El gesto se hace vídeo antes de que llegues al vestuario.", tone: "bad" }; } },
      ],
    }),
  },
  {
    id: "beat_ronald_x",
    family: "rareza",
    image: "training",
    category: "training",
    requires: (s) => s.overall >= 72,
    build: (s) => ({
      kicker: `${currentMonth(s)} · rareza`,
      title: "Cristian Ronald-X aparece en la ciudad deportiva",
      text: `Cristian Ronald-X, leyenda retirada obsesionada con entrenar, ha pedido usar el gimnasio del club a las seis de la mañana. Te invita a su sesión: "una hora conmigo o veinte años de excusas".`,
      choices: [
        { id: "ir", label: "Ir a las seis de la mañana", apply: (st) => { stat(st, "fitness", 8); st.xp += 30; stat(st, "fame", 5); return { title: "Seis de la mañana", text: "Vomitas en la papelera y él se ríe: \"ahora ya eres profesional\".", tone: "good" }; } },
        { id: "dormir", label: "Dormir tus ocho horas", apply: (st) => { stat(st, "morale", 4); return { title: "Duermes", text: "Descansas bien y te enteras por Instagram de lo que te has perdido.", tone: "neutral" }; } },
      ],
    }),
  },
  {
    id: "beat_seleccion",
    family: "seleccion",
    image: "travel",
    category: "story",
    requires: (s) => s.overall >= 70 && s.form >= 55,
    build: (s) => ({
      kicker: `${currentMonth(s)} · federación`,
      title: "Llamada de la selección",
      text: `Convocatoria para la sub-21. Coincide con la semana clave del club y ${who(s, "coach")} deja caer que "el que se va se pierde el once del domingo".`,
      choices: [
        { id: "ir", label: "Ir con la selección", apply: (st) => { stat(st, "fame", 10); rel(st, "coach", -5); milestone(st, "Internacional en categorías inferiores"); return { title: "Camiseta nacional", text: "Debutas con la sub-21 y vuelves con la pierna cargada.", tone: "good" }; } },
        { id: "quedarme", label: "Alegar molestias y quedarte", apply: (st) => { rel(st, "coach", 8); stat(st, "fame", -4); return { title: "Te quedas", text: "Juegas el domingo. En la federación apuntan tu nombre con lápiz.", tone: "neutral" }; } },
      ],
    }),
  },
  {
    id: "beat_derbi_previa",
    family: "partido",
    image: "stadium",
    category: "story",
    requires: (s) => totalApps(s) >= 6,
    build: (s) => ({
      kicker: `${currentMonth(s)} · semana grande`,
      title: "Semana de derbi",
      text: `La ciudad cambia de humor. Los veteranos bajan el tono en los entrenamientos y el club refuerza la seguridad del autobús. ${who(s, "captain")} avisa: "el que pierde esto no come tranquilo en un año".`,
      choices: [
        { id: "concentrarse", label: "Aislarte del ruido", apply: (st) => { stat(st, "form", 5); stat(st, "discipline", 3); return { title: "Semana en silencio", text: "Móvil apagado y dos vídeos del rival al día.", tone: "good" }; } },
        { id: "calentar", label: "Calentar el partido en redes", apply: (st) => { stat(st, "fame", 9); rel(st, "fans", 6); rel(st, "coach", -6); return { title: "Ruido", text: "El rival imprime tu frase y la cuelga en su vestuario.", tone: "neutral" }; } },
      ],
    }),
  },
  {
    id: "beat_mercado_enero",
    family: "mercado",
    image: "office",
    category: "market",
    requires: (s) => directorState(s).sceneInSeason >= 9 && directorState(s).sceneInSeason <= 15,
    build: (s) => ({
      kicker: `enero · mercado`,
      title: "El club ficha en tu posición",
      text: `El club cierra un fichaje en tu puesto: joven, caro y con dos años menos que tú si eres veterano, o dos más si eres el chaval. La rueda de prensa de presentación es mañana y a ti nadie te ha avisado.`,
      choices: [
        { id: "recibir", label: "Recibirle bien y medirte en el campo", apply: (st) => { rel(st, "dressing", 6); stat(st, "form", 4); npc(st, "rival"); return { title: "Bienvenida", text: "Le enseñas el vestuario y le quitas el sitio en el rondo.", tone: "good" }; } },
        { id: "quejarse", label: "Pedir explicaciones al club", apply: (st) => { rel(st, "coach", -6); flag(st, "quiere_salir", 1); return { title: "Mala señal", text: "\"Un club ficha, no pide permiso\". Sales del despacho peor de lo que entraste.", tone: "bad" }; } },
      ],
    }),
  },
  {
    id: "beat_cierre_temporada",
    family: "cierre",
    image: "locker",
    category: "club",
    requires: (s) => directorState(s).sceneInSeason >= 16,
    build: (s) => ({
      kicker: `${currentMonth(s)} · última semana`,
      title: "Lo que queda del curso",
      text: `Última semana. El club hace balance: ${totalApps(s)} partidos oficiales en tu carrera y una media de ${s.overall}. ${who(s, "coach")} pasa por las taquillas diciendo quién sigue y quién no lo sabe.`,
      choices: [
        { id: "preguntar", label: "Preguntarle si cuentas para el año que viene", apply: (st) => { const ok = computeRole(st) >= 50; rel(st, "coach", ok ? 4 : -2); return ok ? { title: "Cuentas", text: "\"Vuelve el 8 de julio con la cabeza en su sitio\".", tone: "good" } : { title: "No cuenta contigo", text: "\"Hablará el club contigo\". Eso, en fútbol, es un no.", tone: "bad" }; } },
        { id: "vacaciones", label: "Irte de vacaciones sin preguntar nada", apply: (st) => { stat(st, "morale", 8); stat(st, "fitness", 6); return { title: "Desconectar", text: "Tres semanas sin balón y una llamada pendiente para agosto.", tone: "neutral" }; } },
      ],
    }),
  },
];

/* ============================== Selección ============================== */

function seen(s: GameState, id: string): boolean {
  return (s.seenEvents ?? []).includes(id);
}

function familyBlocked(s: GameState, family: string): boolean {
  const d = directorState(s);
  return d.lastFamilies.slice(0, 5).includes(family);
}

function markScene(s: GameState, sceneId: string, family: string): void {
  const d = directorState(s);
  d.lastScenes.unshift(sceneId);
  d.lastScenes = d.lastScenes.slice(0, 20);
  d.lastFamilies.unshift(family);
  d.lastFamilies = d.lastFamilies.slice(0, 10);
  d.sceneInSeason += 1;
  if (!Array.isArray(s.seenEvents)) s.seenEvents = [];
  if (!s.seenEvents.includes(sceneId)) s.seenEvents.push(sceneId);
  s.sceneCount = (s.sceneCount ?? 0) + 1;
}

/** Nueva temporada: 3-5 arcos candidatos coherentes con el contexto. */
export function directorNewSeason(s: GameState): void {
  const d = directorState(s);
  d.season = s.seasonIndex;
  d.sceneInSeason = 0;
  d.active = d.active.filter((a) => {
    const arc = arcById(a.id);
    return !!arc && a.chapter < arc.chapters.length;
  });
  const pool = ARCS.filter((a) => !d.completed.includes(a.id) && !d.active.some((x) => x.id === a.id) && a.requires(s));
  // Sorteo ponderado: la misma situación no produce siempre los mismos arcos.
  const bag = pool.map((a) => ({ id: a.id, w: Math.max(1, a.weight(s)) + (hash(careerSeed(s), `${a.id}${s.seasonIndex}${d.profile}`) % 26) }));
  const chosen: string[] = [];
  const target = 3 + (hash(careerSeed(s), `ncand${s.seasonIndex}`) % 3);
  let salt = hash(careerSeed(s), `pickarc${s.seasonIndex}`);
  while (bag.length > 0 && chosen.length < target) {
    const total = bag.reduce((acc, x) => acc + x.w, 0);
    salt = (salt * 1103515245 + 12345) % 2147483647;
    let roll = salt % total;
    let i = 0;
    while (i < bag.length - 1 && roll >= bag[i]!.w) { roll -= bag[i]!.w; i++; }
    chosen.push(bag.splice(i, 1)[0]!.id);
  }
  d.candidates = chosen;
  // Perfil oculto: la trayectoria no es igual para todos.
  if (d.profile === "tardio" && s.age <= 20) s.xp = Math.round(s.xp * 0.85);
  if (d.profile === "prodigio" && s.age <= 21) s.xp = Math.round(s.xp * 1.12);
  if (d.profile === "lesiones" && Math.random() < 0.3) flag(s, "riesgo_recaida", 1);
}

function openArc(s: GameState): ActiveArc | null {
  const d = directorState(s);
  if (d.active.length >= 3) return null;
  const eligible = d.candidates.filter((id) => {
    if (d.active.some((a) => a.id === id) || d.completed.includes(id)) return false;
    const arc = arcById(id);
    return !!arc && arc.requires(s) && !familyBlocked(s, arc.family);
  });
  if (eligible.length > 0) {
    const id = eligible[hash(careerSeed(s), `open${s.sceneCount ?? 0}`) % eligible.length]!;
    const arc = arcById(id)!;
    const active: ActiveArc = { id, chapter: 0, opened: s.sceneCount ?? 0, params: arc.open ? arc.open(s) : {} };
    d.active.push(active);
    d.candidates = d.candidates.filter((c) => c !== id);
    return active;
  }
  return null;
}

const arcCard = (arc: ActiveArc): DynamicCard => ({ type: "dynamic", kind: "arc", data: { arcId: arc.id, chapter: arc.chapter } });

/**
 * Único punto de selección de escena narrativa.
 * Orden: callbacks pendientes -> capítulo de arco activo -> abrir arco nuevo ->
 * escena secundaria contextual NUEVA. Si nada es válido devuelve null y el
 * motor avanza tiempo (jamás recicla una tarjeta antigua).
 */
export function directorCard(s: GameState): DynamicCard | null {
  const d = directorState(s);

  // 1. Callback pendiente que ya vence.
  const cbIdx = d.callbacks.findIndex((c) => (s.sceneCount ?? 0) >= c.dueScene);
  if (cbIdx >= 0) {
    const cb = d.callbacks.splice(cbIdx, 1)[0]!;
    if (!seen(s, `cb_scene_${cb.id}`)) {
      return { type: "dynamic", kind: "arc_callback", data: { cbId: cb.id, text: cb.text } };
    }
  }

  // 2. Capítulo siguiente de un arco activo (si sigue cumpliendo requisitos).
  const ready = d.active.filter((a) => {
    const arc = arcById(a.id);
    if (!arc || a.chapter >= arc.chapters.length) return false;
    const ch = arc.chapters[a.chapter]!;
    if (seen(s, `${a.id}_c${a.chapter}`)) return false;
    // Continuidad: el capítulo 2+ no espera cooldown de familia (es el mismo hilo).
    if (a.chapter === 0 && familyBlocked(s, ch.family)) return false;
    return true;
  });
  if (ready.length > 0) {
    const chosen = ready.sort((x, y) => y.chapter - x.chapter || x.opened - y.opened)[0]!;
    return arcCard(chosen);
  }

  // 3. Abrir un arco nuevo de los candidatos de la temporada.
  const opened = openArc(s);
  if (opened) return arcCard(opened);

  // 4. Escena secundaria contextual nueva, de familia distinta a las últimas.
  const beats = BEATS.filter((b) => !seen(s, b.id) && !familyBlocked(s, b.family) && b.requires(s));
  if (beats.length > 0) {
    const h = hash(careerSeed(s), `beat${s.sceneCount ?? 0}`);
    const beat = beats[h % beats.length]!;
    return { type: "dynamic", kind: "arc_beat", data: { beatId: beat.id } };
  }
  return null;
}

const CALLBACK_TITLES = [
  "Esto ya lo habías empezado tú",
  "Vuelve una conversación pendiente",
  "Alguien te lo recuerda hoy",
  "La factura de una decisión",
  "No se había cerrado",
];

const CALLBACK_WRAP = [
  "En este oficio las decisiones vuelven con retraso y con intereses.",
  "Nadie lo había olvidado, solo estaban esperando el momento.",
  "Aparece un martes cualquiera, cuando ya no lo esperabas.",
  "Te lo sueltan sin aviso, entre dos ejercicios de entrenamiento.",
  "Llega por teléfono, tarde, y te quita el sueño esa noche.",
];

/* ============================== Render ============================== */

export interface DirectorView {
  kicker: string;
  title: string;
  image: SceneKey;
  text: string;
  category: EventCategory;
  choices: { id: string; label: string; hint?: string }[];
  freeform?: { prompt: string; placeholder?: string };
}

function activeOf(s: GameState, arcId: string): ActiveArc {
  const d = directorState(s);
  const found = d.active.find((a) => a.id === arcId);
  if (found) return found;
  const created: ActiveArc = { id: arcId, chapter: 0, opened: s.sceneCount ?? 0, params: arcById(arcId)?.open?.(s) ?? {} };
  d.active.push(created);
  return created;
}

export function renderDirector(s: GameState, card: DynamicCard): DirectorView | null {
  if (card.kind === "arc_beat") {
    const beat = BEATS.find((b) => b.id === card.data["beatId"]);
    if (!beat) return null;
    const built = beat.build(s);
    return {
      kicker: built.kicker,
      title: built.title,
      image: beat.image,
      category: beat.category,
      text: built.text,
      choices: built.choices.map((c) => ({ id: c.id, label: c.label, ...(c.hint ? { hint: c.hint } : {}) })),
      ...(built.freeform ? { freeform: { prompt: built.freeform } } : {}),
    };
  }
  if (card.kind === "arc_callback") {
    const text = typeof card.data["text"] === "string" ? card.data["text"] : "Algo que decidiste vuelve";
    return {
      kicker: `${currentMonth(s)} · vuelve una decisión`,
      title: CALLBACK_TITLES[hash(careerSeed(s), `cbt${s.sceneCount ?? 0}`) % CALLBACK_TITLES.length]!,
      image: "locker",
      category: "story",
      text: `${text}. ${CALLBACK_WRAP[hash(careerSeed(s), `cbw${s.sceneCount ?? 0}`) % CALLBACK_WRAP.length]}`,
      choices: [
        { id: "afrontar", label: "Afrontarlo de frente" },
        { id: "esquivar", label: "Esquivarlo por ahora", hint: "Puede volver peor" },
      ],
    };
  }
  if (card.kind !== "arc") return null;
  const arcId = typeof card.data["arcId"] === "string" ? card.data["arcId"] : "";
  const arc = arcById(arcId);
  if (!arc) return null;
  const active = activeOf(s, arcId);
  const idx = Math.min(arc.chapters.length - 1, typeof card.data["chapter"] === "number" ? card.data["chapter"] : active.chapter);
  const ch = arc.chapters[idx]!;
  const c = ctxOf(s, active);
  const kicker = ch.skip ? `${ch.skip} · ${ch.kicker(c)}` : ch.kicker(c);
  return {
    kicker,
    title: ch.title(c),
    image: ch.image,
    category: ch.category,
    text: ch.text(c),
    choices: ch.choices.map((o) => ({ id: o.id, label: o.label, ...(o.hint ? { hint: o.hint } : {}) })),
    ...(ch.freeform ? { freeform: { prompt: ch.freeform } } : {}),
  };
}

/* ============================== Resolución ============================== */

export interface DirectorResult {
  title: string;
  text: string;
  tone: "good" | "bad" | "neutral" | "gold";
}

export function resolveDirector(s: GameState, card: DynamicCard, choiceId: string): DirectorResult | null {
  const d = directorState(s);

  if (card.kind === "arc_beat") {
    const beat = BEATS.find((b) => b.id === card.data["beatId"]);
    if (!beat) return null;
    const built = beat.build(s);
    const choice = built.choices.find((x) => x.id === choiceId) ?? built.choices[0]!;
    const res = choice.apply(s);
    markScene(s, beat.id, beat.family);
    note(s, res.title, res.tone === "gold" ? "gold" : res.tone);
    return { title: res.title, text: res.text, tone: res.tone };
  }

  if (card.kind === "arc_callback") {
    const id = typeof card.data["cbId"] === "string" ? card.data["cbId"] : "cb";
    markScene(s, `cb_scene_${id}`, "callback");
    if (choiceId === "esquivar") {
      d.callbacks.push({ id: `${id}_bis`, text: typeof card.data["text"] === "string" ? card.data["text"] : "Sigue pendiente", dueScene: (s.sceneCount ?? 0) + 6 });
      stat(s, "morale", -3);
      return { title: "Lo dejas para después", text: "Lo esquivas hoy. Volverá, y no mejor.", tone: "neutral" };
    }
    stat(s, "morale", 4);
    rel(s, "family", 3);
    return { title: "Lo afrontas", text: "Te sientas, escuchas y respondes. Cerrar cosas también es oficio.", tone: "good" };
  }

  if (card.kind !== "arc") return null;
  const arcId = typeof card.data["arcId"] === "string" ? card.data["arcId"] : "";
  const arc = arcById(arcId);
  if (!arc) return null;
  const active = activeOf(s, arcId);
  const idx = Math.min(arc.chapters.length - 1, typeof card.data["chapter"] === "number" ? card.data["chapter"] : active.chapter);
  const ch = arc.chapters[idx]!;
  const c = ctxOf(s, active);
  const choice = ch.choices.find((o) => o.id === choiceId) ?? ch.choices[0]!;
  let res: Res;
  try {
    res = choice.apply(c);
  } catch {
    res = { title: "Decisión registrada", text: "Tu decisión queda anotada por el club.", tone: "neutral" };
  }
  markScene(s, `${arcId}_c${idx}`, ch.family);
  note(s, `${arc.label}: ${res.title}`, res.tone === "gold" ? "gold" : res.tone);

  const nextChapter = typeof res.goto === "number" ? res.goto : idx + 1;
  if (res.end || nextChapter >= arc.chapters.length) {
    d.active = d.active.filter((a) => a.id !== arcId);
    if (!d.completed.includes(arcId)) d.completed.push(arcId);
  } else {
    active.chapter = nextChapter;
  }
  return { title: res.title, text: res.text, tone: res.tone };
}

/** Etiqueta discreta de contexto para la UI (no técnica). */
export function directorTag(s: GameState): string | null {
  const d = directorState(s);
  const first = d.active[0];
  if (!first) return null;
  const arc = arcById(first.id);
  if (!arc) return null;
  return `${arc.label} · capítulo ${first.chapter + 1}`;
}
