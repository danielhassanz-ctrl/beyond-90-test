/* ======================= CONSECUENCIAS REALES =======================
 * Las relaciones extremas no se quedan en una barra: provocan hechos.
 * Cada tarjeta cambia el mundo (lista de convocados, minutos, agente,
 * pareja, entorno) y deja memoria para escenas futuras.
 */
import { who } from "./npc";
import { clubById } from "./data";
import { clamp, milestone, note, rel, stat } from "./mutate";
import type { DynamicCard, GameState } from "./types";
import type { DynamicResult, DynamicView } from "./dynamic";

function remember(s: GameState, text: string): void {
  if (!s.agent.memories.includes(text)) s.agent.memories.unshift(text);
  s.agent.memories = s.agent.memories.slice(0, 10);
  if (!s.memory.conflicts.includes(text)) s.memory.conflicts.unshift(text);
  s.memory.conflicts = s.memory.conflicts.slice(0, 12);
}

type Kind = "cons_bench" | "cons_isolation" | "cons_agent_break" | "cons_family_break" | "cons_fans_war";

interface Rule {
  kind: Kind;
  flag: string;
  fires: (s: GameState) => boolean;
}

const RULES: Rule[] = [
  { kind: "cons_bench", flag: "cons_bench_done", fires: (s) => s.rel.coach <= 16 && s.stage !== "youth" },
  { kind: "cons_isolation", flag: "cons_iso_done", fires: (s) => s.rel.dressing <= 15 },
  { kind: "cons_agent_break", flag: "cons_agent_done", fires: (s) => s.agent.present && (s.agent.trust <= 14 || s.rel.agent <= 12) },
  { kind: "cons_family_break", flag: "cons_family_done", fires: (s) => s.rel.family <= 14 },
  { kind: "cons_fans_war", flag: "cons_fans_done", fires: (s) => s.rel.fans <= 14 && s.stage === "first" },
];

/** Devuelve la consecuencia pendiente más grave, si alguna se ha desencadenado. */
export function consequenceCard(s: GameState): DynamicCard | null {
  const scene = s.sceneCount ?? 0;
  if (scene - (s.flags["cons_last"] ?? -99) < 6) return null;
  for (const r of RULES) {
    if ((s.flags[r.flag] ?? 0) === 1) continue;
    if (!r.fires(s)) continue;
    s.flags[r.flag] = 1;
    s.flags["cons_last"] = scene;
    return { type: "dynamic", kind: r.kind, data: {} };
  }
  return null;
}

export function renderConsequence(s: GameState, card: DynamicCard): DynamicView | null {
  const club = clubById(s.clubId).short;
  switch (card.kind as Kind) {
    case "cons_bench":
      return {
        kicker: "Consecuencia",
        title: "Fuera de la lista",
        image: "locker",
        category: "club",
        text: `${who(s, "coach")} no te incluye en la convocatoria y lo explica en rueda de prensa con dos frases. En el vestuario del ${club} ya nadie te pregunta si juegas.`,
        choices: [
          { id: "hablar", label: "Pedirle una reunión cara a cara", hint: "Puede salir muy bien o muy mal" },
          { id: "trabajar", label: "Callar y ser el primero cada mañana", hint: "Lento, pero limpio" },
          { id: "salir", label: "Decirle al club que quieres salir", hint: "Rompes el vínculo" },
        ],
        freeform: { prompt: "¿Qué haces con tu situación?", placeholder: "Escribe cómo lo afrontas…" },
      };
    case "cons_isolation":
      return {
        kicker: "Consecuencia",
        title: "El grupo te ha soltado",
        image: "locker",
        category: "club",
        text: `Comida de equipo y una silla vacía a tu lado. ${who(s, "captain")} ni te mira. Los rondos se hacen sin ti y el míster lo ve todo.`,
        choices: [
          { id: "disculpa", label: "Pedir perdón delante de todos", hint: "Tragar orgullo" },
          { id: "aliado", label: "Buscar a un solo aliado", hint: "Reconstruir poco a poco" },
          { id: "solo", label: "Ir a lo tuyo y rendir", hint: "Individualismo con precio" },
        ],
        freeform: { prompt: "¿Qué dices en el vestuario?" },
      };
    case "cons_agent_break":
      return {
        kicker: "Consecuencia",
        title: `${s.agent.name} se planta`,
        image: "agent",
        category: "agent",
        text: `Te llama a las once de la noche: "O confías en mí, o esto se acaba hoy". Lleva razón en algo y tú lo sabes.`,
        choices: [
          { id: "romper", label: "Romper la relación", hint: "Te quedas sin representante" },
          { id: "recomponer", label: "Recomponerlo cediendo comisión", hint: "Pagas la paz" },
        ],
        freeform: { prompt: "¿Qué le contestas?" },
      };
    case "cons_family_break":
      return {
        kicker: "Consecuencia",
        title: "En casa se ha roto algo",
        image: "family",
        category: "life",
        text: `Tres meses sin aparecer por casa. Tu madre deja de llamar y ${who(s, "partner")} te dice lo que nadie del club se atreve a decirte.`,
        choices: [
          { id: "volver", label: "Cortar la semana y volver a casa", hint: "Cuerpo y cabeza" },
          { id: "seguir", label: "Seguir enfocado en el fútbol", hint: "Coste personal real" },
        ],
        freeform: { prompt: "¿Qué dices en casa?" },
      };
    case "cons_fans_war":
      return {
        kicker: "Consecuencia",
        title: "Silbado al salir",
        image: "stadium",
        category: "press",
        text: `Cambio en el 63' y el estadio te despide con una pitada. En la puerta del campo alguien deja una pancarta con tu apellido tachado.`,
        choices: [
          { id: "aplaudir", label: "Aplaudir a la grada al salir", hint: "Humildad pública" },
          { id: "señalar", label: "Señalarte el escudo", hint: "Guerra abierta" },
          { id: "callar", label: "Salir mirando al suelo", hint: "Nada cambia" },
        ],
        freeform: { prompt: "¿Qué gesto haces?" },
      };
    default:
      return null;
  }
}

export function resolveConsequence(s: GameState, card: DynamicCard, choiceId: string): DynamicResult | null {
  switch (card.kind as Kind) {
    case "cons_bench": {
      if (choiceId === "hablar") {
        const ok = s.discipline >= 55 || Math.random() < 0.45;
        if (ok) {
          rel(s, "coach", 22);
          s.flags["nolist"] = 0;
          remember(s, "Diste la cara ante el entrenador cuando estabas fuera de la lista");
          return { title: "Cara a cara", text: "Cuarenta minutos en su despacho. Sales con una condición y con el dorsal otra vez en la lista.", tone: "good" };
        }
        rel(s, "coach", -8);
        s.flags["nolist"] = 1;
        return { title: "Peor todavía", text: "Te escucha con los brazos cruzados y responde con una frase: \u00abAquí se juega por lo que se entrena\u00bb. Sigues fuera.", tone: "bad" };
      }
      if (choiceId === "trabajar") {
        rel(s, "coach", 10);
        stat(s, "discipline", 8);
        stat(s, "fitness", 6);
        s.flags["nolist"] = 0;
        remember(s, "Te ganaste el regreso a la lista trabajando en silencio");
        return { title: "Sin ruido", text: "Cinco semanas de primer en llegar y último en irse. Un martes cualquiera vuelves a aparecer en la pizarra.", tone: "good" };
      }
      s.flags["pedir_salida"] = 1;
      s.flags["nolist"] = 1;
      rel(s, "coach", -12);
      rel(s, "fans", -10);
      remember(s, `Pediste salir del ${clubById(s.clubId).short}`);
      note(s, "Pides salir del club.", "bad");
      return { title: "Pides salir", text: "El club acepta escuchar ofertas. A partir de hoy entrenas con el grupo, pero ya no eres de la casa.", tone: "bad" };
    }
    case "cons_isolation": {
      if (choiceId === "disculpa") {
        rel(s, "dressing", 20);
        stat(s, "morale", 6);
        return { title: "Delante de todos", text: "Hablas de pie, en medio del círculo, sin excusas. El capitán asiente y el jueves vuelves a jugar rondos.", tone: "good" };
      }
      if (choiceId === "aliado") {
        rel(s, "dressing", 11);
        s.flags["aliado_vestuario"] = 1;
        return { title: "Uno basta", text: `Te acercas al que menos habla del vestuario. Come contigo. En dos semanas ya sois tres.`, tone: "good" };
      }
      stat(s, "form", 6);
      rel(s, "dressing", -6);
      s.flags["lobo_solitario"] = 1;
      return { title: "Solo", text: "Rindes. Vas al campo, cumples y te vas. Cuando llegue el mal momento no habrá nadie para taparte.", tone: "neutral" };
    }
    case "cons_agent_break": {
      if (choiceId === "romper") {
        s.agent.present = false;
        s.hasAgent = false;
        s.agent.firedCount += 1;
        s.agent.teaser = null;
        rel(s, "agent", -20);
        remember(s, `Rompiste con ${s.agent.name}`);
        note(s, `Rompes con ${s.agent.name}.`, "bad");
        return { title: "Sin representante", text: `Cuelgas y se acabó. Mañana el teléfono estará más tranquilo y las ofertas también.`, tone: "bad" };
      }
      s.agent.commission = Math.min(15, s.agent.commission + 2);
      s.agent.trust = clamp(s.agent.trust + 26);
      rel(s, "agent", 18);
      return { title: "Paz pagada", text: `Dos puntos más de comisión y una lista de cosas que no volverás a hacer sin avisarle. ${s.agent.name} vuelve a coger el teléfono a la primera.`, tone: "neutral" };
    }
    case "cons_family_break": {
      if (choiceId === "volver") {
        rel(s, "family", 24);
        stat(s, "morale", 10);
        stat(s, "form", -5);
        remember(s, "Paraste la semana para volver a casa");
        return { title: "Volver", text: "Tres días de cocina de casa y silencio. El sábado juegas peor y duermes mejor que en meses.", tone: "good" };
      }
      rel(s, "family", -8);
      stat(s, "morale", -8);
      s.flags["familia_roto"] = 1;
      return { title: "El precio", text: "Sigues. Marcas dos la jornada siguiente y no hay nadie de los tuyos en la grada para verlo.", tone: "bad" };
    }
    case "cons_fans_war": {
      if (choiceId === "aplaudir") {
        rel(s, "fans", 18);
        return { title: "Aplaudir a quien te pita", text: "Levantas las manos y aplaudes. La pitada baja de golpe: el fondo respeta eso más que un gol.", tone: "good" };
      }
      if (choiceId === "señalar") {
        rel(s, "fans", -14);
        stat(s, "fame", 8);
        s.flags["guerra_grada"] = 1;
        milestone(s, "Te enfrentas públicamente a tu propia grada.");
        return { title: "Guerra abierta", text: "Te señalas el escudo mirando al fondo. Mañana es portada y el club te multa. Ya no hay marcha atrás.", tone: "bad" };
      }
      stat(s, "morale", -6);
      return { title: "Al vestuario", text: "Bajas la cabeza y cruzas el túnel. Nada se arregla y nada empeora.", tone: "neutral" };
    }
    default:
      return null;
  }
}
