/* ======================= CONSECUENCIAS REALES =======================
 * Las relaciones extremas no se quedan en una barra: provocan hechos.
 * Cada tarjeta cambia el mundo (lista de convocados, minutos, agente,
 * pareja, entorno) y deja memoria para escenas futuras.
 */
import { who } from "./npc";
import { clubById } from "./data";
import { clamp, milestone, note, rel, stat } from "./mutate";
import { ensureFinance, netWorth, totalDebt } from "./finance";
import type { DynamicCard, GameState } from "./types";
import type { DynamicResult, DynamicView } from "./dynamic";

function remember(s: GameState, text: string): void {
  if (!s.agent.memories.includes(text)) s.agent.memories.unshift(text);
  s.agent.memories = s.agent.memories.slice(0, 10);
  if (!s.memory.conflicts.includes(text)) s.memory.conflicts.unshift(text);
  s.memory.conflicts = s.memory.conflicts.slice(0, 12);
}

type Kind =
  | "cons_bench"
  | "cons_isolation"
  | "cons_agent_break"
  | "cons_family_break"
  | "cons_fans_war"
  | "cons_financial_pressure"
  | "cons_coach_backing"
  | "cons_dressing_backing"
  | "cons_agent_loyalty"
  | "cons_family_support"
  | "cons_fans_chant";

interface Rule {
  kind: Kind;
  flag: string;
  fires: (s: GameState) => boolean;
}

const NEGATIVE_RULES: Rule[] = [
  { kind: "cons_bench", flag: "cons_bench_done", fires: (s) => s.rel.coach <= 16 && s.stage !== "youth" },
  { kind: "cons_isolation", flag: "cons_iso_done", fires: (s) => s.rel.dressing <= 15 },
  { kind: "cons_agent_break", flag: "cons_agent_done", fires: (s) => s.agent.present && (s.agent.trust <= 14 || s.rel.agent <= 12) },
  { kind: "cons_family_break", flag: "cons_family_done", fires: (s) => s.rel.family <= 14 },
  { kind: "cons_fans_war", flag: "cons_fans_done", fires: (s) => s.rel.fans <= 14 && s.stage === "first" },
  {
    kind: "cons_financial_pressure",
    flag: "cons_financial_pressure_done",
    fires: (s) => {
      if (s.age < 20) return false;
      const f = ensureFinance(s);
      const debt = totalDebt(s);
      const net = Math.max(1, netWorth(s));
      const yearly = f.commitments.reduce((sum, c) => sum + c.yearly, 0);
      const salary = Math.max(1, f.annualSalary || s.salary || 1);
      return debt >= 300 && (debt / net > 0.65 || yearly / salary > 0.45);
    },
  },
];

const POSITIVE_RULES: Rule[] = [
  { kind: "cons_coach_backing", flag: "cons_coach_backing_done", fires: (s) => s.rel.coach >= 86 && s.stage !== "youth" },
  { kind: "cons_dressing_backing", flag: "cons_dressing_backing_done", fires: (s) => s.rel.dressing >= 88 && s.stage === "first" },
  { kind: "cons_agent_loyalty", flag: "cons_agent_loyalty_done", fires: (s) => s.agent.present && s.rel.agent >= 86 && s.agent.trust >= 70 },
  { kind: "cons_family_support", flag: "cons_family_support_done", fires: (s) => s.rel.family >= 90 && s.age >= 18 },
  { kind: "cons_fans_chant", flag: "cons_fans_chant_done", fires: (s) => s.rel.fans >= 90 && s.stage === "first" && s.fame >= 40 },
];

/** Devuelve la consecuencia pendiente más importante, si alguna se ha desencadenado. */
export function consequenceCard(s: GameState): DynamicCard | null {
  const scene = s.sceneCount ?? 0;
  if (scene - (s.flags["cons_last"] ?? -99) < 6) return null;

  // Primero se resuelven los incendios. Una relación rota debe sentirse antes
  // que cualquier premio por otra barra alta.
  for (const r of NEGATIVE_RULES) {
    if ((s.flags[r.flag] ?? 0) === 1) continue;
    if (!r.fires(s)) continue;
    s.flags[r.flag] = 1;
    s.flags["cons_last"] = scene;
    return { type: "dynamic", kind: r.kind, data: {} };
  }

  // Las relaciones excelentes también cambian la carrera. Así las barras no
  // son únicamente medidores de castigo: ganarse a alguien abre protección,
  // confianza, oportunidades y momentos que dejan huella.
  for (const r of POSITIVE_RULES) {
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
          { id: "limites", label: "Seguir juntos, pero renegociar límites", hint: "No rompes ni compras la paz" },
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
          { id: "reordenar", label: "Reordenar la agenda y reservar tiempo fijo", hint: "Intentar sostener ambas vidas" },
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
    case "cons_financial_pressure": {
      const f = ensureFinance(s);
      const debt = totalDebt(s);
      const yearly = f.commitments.reduce((sum, c) => sum + c.yearly, 0);
      return {
        kicker: "Consecuencia · Patrimonio",
        title: "Tu estilo de vida ya manda",
        image: "office",
        category: "life",
        text: `Tu asesor deja dos cifras encima de la mesa: ${debt}.000 € de deuda y ${yearly}.000 € al año ya comprometidos. Una lesión larga o un mal contrato ya no afectarían solo al fútbol. Por primera vez, lo que compraste empieza a decidir por ti.`,
        choices: [
          { id: "vender", label: "Vender el activo que más pesa", hint: "Pierdes estatus, recuperas margen" },
          { id: "renegociar", label: "Renegociar deuda y recortar gastos", hint: "Menos presión, más disciplina" },
          { id: "seguir", label: "Mantener el nivel de vida", hint: "Confías en el próximo contrato" },
        ],
        freeform: { prompt: "¿Qué recortas primero para recuperar control?" },
      };
    }
    case "cons_coach_backing":
      return {
        kicker: "Consecuencia",
        title: "El míster te respalda delante de todos",
        image: "press",
        category: "club",
        text: `Después de una semana incómoda, ${who(s, "coach")} corta una pregunta en rueda de prensa: "Con él no tengo ninguna duda". En el vestuario del ${club} la frase corre antes de que termine la comparecencia.`,
        choices: [
          { id: "agradecer", label: "Agradecérselo en privado", hint: "Refuerzas la confianza" },
          { id: "responder", label: "Responder en el campo", hint: "Menos palabras, más presión" },
          { id: "normalizar", label: "Restarle importancia públicamente", hint: "Proteges al grupo" },
        ],
        freeform: { prompt: "¿Qué haces después de escuchar al entrenador?" },
      };
    case "cons_dressing_backing":
      return {
        kicker: "Consecuencia",
        title: "El vestuario te elige",
        image: "locker",
        category: "club",
        text: `${who(s, "captain")} te pide que hables antes de un partido complicado. No llevas necesariamente el brazalete, pero cuando empiezas a hablar nadie mira el móvil. Has dejado de ser solo otro jugador del grupo.`,
        choices: [
          { id: "liderar", label: "Hablar claro y asumir liderazgo", hint: "Tu voz pesa más desde hoy" },
          { id: "capitan", label: "Dejar que cierre el capitán", hint: "Liderazgo sin invadir" },
          { id: "humor", label: "Romper la tensión con una broma", hint: "Cohesión antes que épica" },
        ],
        freeform: { prompt: "¿Qué les dices antes de salir?" },
      };
    case "cons_agent_loyalty":
      return {
        kicker: "Consecuencia",
        title: `${s.agent.name} rechaza dinero por ti`,
        image: "agent",
        category: "agent",
        text: `Una agencia grande ofrece llevarse a ${s.agent.name} una operación si te convence para moverte este verano. Te lo cuenta antes de responder y la rechaza delante de ti. "No todo se cobra hoy", dice mientras guarda el móvil.`,
        choices: [
          { id: "confiar", label: "Darle más margen para negociar", hint: "Más confianza, menos control" },
          { id: "premiar", label: "Mejorarle las condiciones", hint: "Reconoces la lealtad" },
          { id: "mantener", label: "Agradecerlo y no cambiar nada", hint: "La relación ya funciona" },
        ],
        freeform: { prompt: "¿Cómo respondes a esa muestra de lealtad?" },
      };
    case "cons_family_support":
      return {
        kicker: "Consecuencia",
        title: "Tu gente aparece cuando peor pinta",
        image: "family",
        category: "life",
        text: `Llegas a casa después de una semana horrible y la mesa está puesta. Nadie pregunta por estadísticas ni por rumores. Durante dos horas vuelves a ser la misma persona que antes de que el fútbol ocupara todas las habitaciones.`,
        choices: [
          { id: "abrirte", label: "Contarles lo que de verdad te preocupa", hint: "Recuperas cabeza" },
          { id: "disfrutar", label: "No hablar de fútbol en toda la noche", hint: "Desconexión limpia" },
          { id: "prometer", label: "Prometer que reservarás más tiempo para ellos", hint: "La promesa quedará" },
        ],
        freeform: { prompt: "¿Qué les cuentas esa noche?" },
      };
    case "cons_fans_chant":
      return {
        kicker: "Consecuencia",
        title: "Tu nombre baja de la grada",
        image: "stadium",
        category: "press",
        text: `Minuto 72. El partido está parado y de pronto una zona del estadio empieza a cantar tu apellido. Se contagia a la grada entera. No has marcado hoy: esto ya no va solo de un partido.`,
        choices: [
          { id: "saludar", label: "Girar y agradecerlo", hint: "Momento compartible" },
          { id: "seguir", label: "Seguir concentrado como si no lo oyeras", hint: "Mentalidad competitiva" },          { id: "escudo", label: "Besarte el escudo", hint: "Te vinculas públicamente al club" },
        ],
        freeform: { prompt: "¿Cómo reaccionas a la grada?" },
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
        return { title: "Peor todavía", text: "Te escucha con los brazos cruzados y responde con una frase: «Aquí se juega por lo que se entrena». Sigues fuera.", tone: "bad" };
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
        return { title: "Uno basta", text: "Te acercas al que menos habla del vestuario. Come contigo. En dos semanas ya sois tres.", tone: "good" };
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
        return { title: "Sin representante", text: "Cuelgas y se acabó. Mañana el teléfono estará más tranquilo y las ofertas también.", tone: "bad" };
      }
      if (choiceId === "limites") {
        s.agent.trust = clamp(s.agent.trust + 14);
        rel(s, "agent", 10);
        stat(s, "discipline", 3);
        remember(s, `Renegociaste los límites profesionales con ${s.agent.name}`);
        return { title: "Nuevas reglas", text: "No hay abrazo ni ruptura. Escribís qué decide cada uno y qué debe consultar. La relación sigue, esta vez con fronteras.", tone: "good" };
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
      if (choiceId === "reordenar") {
        rel(s, "family", 14);
        stat(s, "discipline", 4);
        stat(s, "morale", 4);
        remember(s, "Reordenaste tu agenda para recuperar a tu familia sin abandonar la temporada");
        return { title: "Hacer sitio", text: "No solucionas tres meses en una llamada. Pero reservas días, cumples el primero y en casa vuelven a contestar.", tone: "good" };
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
    case "cons_financial_pressure": {
      const f = ensureFinance(s);
      if (choiceId === "vender") {
        const ranked = [...f.properties].sort((a, b) => (b.debt / Math.max(1, b.value)) - (a.debt / Math.max(1, a.value)));
        const target = ranked[0];
        if (target) {
          const equity = Math.max(0, Math.round(target.value - target.debt));
          f.cash += equity;
          f.properties = f.properties.filter((p) => p !== target);
          s.wealth = netWorth(s);
          stat(s, "morale", -3);
          stat(s, "discipline", 5);
          remember(s, `Vendiste ${target.name} para recuperar control de tus finanzas`);
          return { title: "Recortas a tiempo", text: `Vendes ${target.name}. No es una foto bonita, pero la deuda desaparece de esa línea y vuelves a respirar. Tu patrimonio queda en ${netWorth(s)}.000 €.`, tone: "good" };
        }
        stat(s, "discipline", 4);
        return { title: "No hay nada que liquidar", text: "Tu problema no está en un gran activo, sino en gastos pequeños que se convirtieron en costumbre. Toca recortar de otra forma.", tone: "neutral" };
      }
      if (choiceId === "renegociar") {
        for (const p of f.properties) p.debt = Math.max(0, Math.round(p.debt * 0.9));
        for (const c of f.commitments) c.yearly = Math.max(0, Math.round(c.yearly * 0.85));
        stat(s, "discipline", 7);
        stat(s, "morale", 2);
        s.wealth = netWorth(s);
        remember(s, "Renegociaste tus deudas cuando el patrimonio empezó a condicionar tu carrera");
        return { title: "Menos ruido fuera del campo", text: "Una tarde entera de llamadas, refinanciación y recortes. No te haces más rico, pero dejas de necesitar que cada renovación salga perfecta.", tone: "good" };
      }
      stat(s, "morale", -8);
      stat(s, "discipline", -4);
      s.flags["vida_por_encima"] = 1;
      remember(s, "Decidiste mantener tu nivel de vida pese a la presión financiera");
      return { title: "Doblas la apuesta", text: "No vendes nada. Confías en que el próximo contrato tape el agujero. Desde ahora, una mala temporada también se juega en la cuenta corriente.", tone: "bad" };
    }
    case "cons_coach_backing": {
      if (choiceId === "agradecer") {
        rel(s, "coach", 7);
        stat(s, "morale", 4);
        remember(s, `${who(s, "coach")} te respaldó públicamente cuando podía haberte dejado solo`);
        return { title: "Confianza devuelta", text: "Esperas a que se vacíe el despacho y se lo agradeces sin discurso. Desde ese día te corrige más y te protege mejor.", tone: "good" };
      }
      if (choiceId === "responder") {
        stat(s, "form", 7);
        stat(s, "discipline", 4);
        return { title: "Que hable el campo", text: "No publicas nada. Entrenas como si el respaldo fuera una deuda que quieres pagar el domingo.", tone: "good" };
      }
      rel(s, "dressing", 5);
      rel(s, "coach", 3);
      return { title: "Todo queda dentro", text: "En público dices que el entrenador habría hecho lo mismo por cualquiera. El vestuario entiende el mensaje.", tone: "good" };
    }
    case "cons_dressing_backing": {
      if (choiceId === "liderar") {
        rel(s, "dressing", 7);
        stat(s, "morale", 5);
        s.flags["lider_vestuario"] = 1;
        remember(s, "El vestuario te pidió que hablaras antes de un partido importante");
        return { title: "Tu voz ya cuenta", text: "No gritas. Dices tres cosas concretas y cuando terminas el capitán abre la puerta del vestuario. Nadie necesita añadir nada.", tone: "gold" };
      }
      if (choiceId === "capitan") {
        rel(s, "dressing", 5);
        stat(s, "discipline", 3);
        return { title: "Liderar también es medir", text: "Hablas poco y le devuelves el cierre al capitán. Él lo recuerda.", tone: "good" };
      }
      rel(s, "dressing", 8);
      stat(s, "morale", 4);
      return { title: "Se rompe la tensión", text: "La primera carcajada llega desde el fondo. Treinta segundos después salís al túnel mucho menos rígidos.", tone: "good" };
    }
    case "cons_agent_loyalty": {
      if (choiceId === "confiar") {
        s.agent.trust = clamp(s.agent.trust + 10);
        rel(s, "agent", 6);
        s.flags["agent_mas_margen"] = 1;
        remember(s, `Le diste más margen a ${s.agent.name} después de que rechazara una operación por ti`);
        return { title: "Más cuerda", text: "Le dices que la próxima llamada importante puede filtrarla sin consultarte primero. Es una pequeña cesión de control y una gran señal de confianza.", tone: "good" };
      }
      if (choiceId === "premiar") {
        s.agent.commission = Math.min(15, s.agent.commission + 1);
        s.agent.trust = clamp(s.agent.trust + 12);
        rel(s, "agent", 7);
        return { title: "Lealtad reconocida", text: "No conviertes todo en dinero, pero mejoras un punto su comisión. Él intenta negarse una vez y acepta a la segunda.", tone: "good" };
      }
      s.agent.trust = clamp(s.agent.trust + 6);
      rel(s, "agent", 4);
      return { title: "No hace falta tocar nada", text: "Le das las gracias y seguís. Precisamente porque funciona, no necesitáis convertirlo en una ceremonia.", tone: "good" };
    }
    case "cons_family_support": {
      if (choiceId === "abrirte") {
        rel(s, "family", 6);
        stat(s, "morale", 12);
        remember(s, "Tu familia te sostuvo cuando estabas atravesando una semana difícil");
        return { title: "Sin personaje", text: "Dices en voz alta lo que llevabas semanas escondiendo. Nadie intenta arreglarlo. Duermes mejor por eso.", tone: "good" };
      }
      if (choiceId === "prometer") {
        rel(s, "family", 8);
        stat(s, "discipline", 3);
        remember(s, "Prometiste reservar tiempo fijo para tu familia incluso en plena temporada");
        return { title: "Una promesa concreta", text: "No prometes estar siempre. Prometes dos fechas al mes y las apuntas delante de ellos. Ahora habrá que cumplirlas.", tone: "good" };
      }
      rel(s, "family", 5);
      stat(s, "morale", 9);
      return { title: "Dos horas sin fútbol", text: "El móvil se queda boca abajo. Cuando vuelves a mirarlo, el problema sigue ahí, pero tú no estás exactamente igual.", tone: "good" };
    }
    case "cons_fans_chant": {
      if (choiceId === "saludar") {
        rel(s, "fans", 6);
        stat(s, "morale", 6);
        milestone(s, "El estadio canta tu nombre por primera vez.");
        remember(s, `La grada del ${clubById(s.clubId).short} cantó tu nombre`);
        return { title: "Lo escuchas", text: "Te giras un segundo, levantas la mano y vuelves a colocarte. La segunda vez cantan todavía más fuerte.", tone: "gold" };
      }
      if (choiceId === "escudo") {
        rel(s, "fans", 9);
        stat(s, "fame", 5);
        s.flags["gesto_escudo"] = 1;
        milestone(s, `Te besas el escudo del ${clubById(s.clubId).short} ante la grada.`);
        return { title: "Una imagen que queda", text: "El gesto dura un segundo y mañana estará en todas partes. También dentro de cualquier negociación futura.", tone: "gold" };
      }
      stat(s, "discipline", 4);
      stat(s, "form", 3);
      return { title: "Sigues jugando", text: "Lo oyes, claro que lo oyes. Pero no te giras. El siguiente balón te llega a los diez segundos.", tone: "good" };
    }
    default:
      return null;
  }
}