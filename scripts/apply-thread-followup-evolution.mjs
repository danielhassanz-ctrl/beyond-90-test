import fs from "node:fs";

const dynamicPath = "src/game/dynamic.ts";
const threadsPath = "src/game/threads.ts";
let dynamic = fs.readFileSync(dynamicPath, "utf8");
let threads = fs.readFileSync(threadsPath, "utf8");

const marker = `};\n\nexport function renderDynamic(s: GameState, card: DynamicCard): DynamicView {`;
if (!dynamic.includes(marker)) throw new Error("dynamic THREAD_VIEWS marker not found");

const followups = `};

// A relationship may return once in a later season, but it must advance the
// story rather than replaying the same card with a new teaser. These second
// chapters deliberately change title, stakes and visible choice wording.
const THREAD_FOLLOWUPS: Record<string, ThreadView> = {
  club_interest: {
    kicker: "El interés avanza",
    title: "Esta vez quieren sentarse",
    image: "agent",
    category: "agent",
    text: "Ya no piden vídeos ni informes: quieren una reunión, condiciones y una respuesta antes de que termine la temporada.",
    choices: [
      { id: "afrontar", label: "Aceptar una reunión con condiciones", hint: "Conviertes el rumor en negociación" },
      { id: "evitar", label: "Cerrar la puerta antes de hablar", hint: "Priorizas tu proyecto actual" },
      { id: "aplazar", label: "Responder al acabar la temporada", hint: "Proteges el vestuario, arriesgas la oferta" },
    ],
    free: "¿Qué cambia ahora que el interés ya es una negociación?",
  },
  coach_upset: {
    kicker: "Una conversación que vuelve",
    title: "El míster reabre aquel acuerdo",
    image: "office",
    category: "club",
    text: "La primera charla no quedó en el aire: el entrenador trae datos, minutos y una promesa anterior. Esta vez quiere una decisión sobre tu papel.",
    choices: [
      { id: "afrontar", label: "Exigir un rol medible", hint: "Pones objetivos concretos sobre la mesa" },
      { id: "evitar", label: "Aceptar el rol y ganarlo entrenando", hint: "Evitas otro pulso directo" },
      { id: "aplazar", label: "Revisarlo tras el próximo bloque de partidos", hint: "Te das margen con una fecha concreta" },
    ],
    free: "¿Qué le respondes ahora que ya existe un antecedente entre los dos?",
  },
  teammate_jealous: {
    kicker: "Vestuario · capítulo dos",
    title: "La tregua del vestuario se acaba",
    image: "locker",
    category: "gossip",
    text: "Aquella tensión no desapareció: cambió de forma. Ahora el conflicto afecta al grupo y el capitán ya no puede fingir que es una broma entre dos.",
    choices: [
      { id: "afrontar", label: "Sentarte con él y el capitán", hint: "Buscas cerrar el conflicto de verdad" },
      { id: "evitar", label: "Separar lo personal del campo", hint: "No habrá amistad, sí reglas" },
      { id: "aplazar", label: "Pedir al capitán una semana de margen", hint: "Bajas la temperatura sin resolverlo" },
    ],
    free: "¿Cómo manejas un conflicto que el vestuario ya recuerda?",
  },
  press_digging: {
    kicker: "La historia crece",
    title: "Ya no quieren contar al chico de cantera",
    image: "press",
    category: "press",
    text: "El nuevo reportaje parte de lo que ya publicaron y busca contradicciones: decisiones, dinero, entorno y cómo has cambiado desde entonces.",
    choices: [
      { id: "afrontar", label: "Hablar y corregir el relato anterior", hint: "Más exposición, más control de tu versión" },
      { id: "evitar", label: "No alimentar una segunda historia", hint: "Cortas el ciclo mediático" },
      { id: "aplazar", label: "Ofrecer una entrevista al final de curso", hint: "Negocias momento y límites" },
    ],
    free: "¿Qué parte de tu historia sí estás dispuesto a contar esta vez?",
  },
  sponsor_call: {
    kicker: "La marca insiste",
    title: "La segunda oferta ya compra más que tu imagen",
    image: "agent",
    category: "life",
    text: "La propuesta nueva incluye exclusividad, actos y meses de compromiso. La cifra sube, pero también lo que la marca quiere decidir por ti.",
    choices: [
      { id: "afrontar", label: "Negociar dinero y límites juntos", hint: "Aceptas crecer sin entregar todo el control" },
      { id: "evitar", label: "Rechazar la exclusividad", hint: "Proteges tu libertad comercial" },
      { id: "aplazar", label: "Pedir un acuerdo puente de seis meses", hint: "Menos dinero, menos ataduras" },
    ],
  },
  national_call: {
    kicker: "Selección · nuevo escalón",
    title: "La selección llama con otro papel",
    image: "tunnel",
    category: "story",
    text: "Ya no eres el chico que iba a probar: ahora esperan que asumas responsabilidad y llegas con más minutos, más foco y más que perder.",
    choices: [
      { id: "afrontar", label: "Aceptar el nuevo peso", hint: "Sube la exigencia y el escaparate" },
      { id: "evitar", label: "Priorizar el momento de tu club", hint: "Proteges carga y jerarquía actual" },
      { id: "aplazar", label: "Coordinar un plan de carga entre técnicos", hint: "Intentas no elegir un solo frente" },
    ],
  },
  family_worry: {
    kicker: "Casa · otra etapa",
    title: "En casa vuelven a necesitarte, pero ya no eres el mismo",
    image: "family",
    category: "life",
    text: "El problema nuevo llega después de una decisión que todos recuerdan. Ahora tienes más recursos, menos tiempo y una familia que sabe qué prometiste la otra vez.",
    choices: [
      { id: "afrontar", label: "Ayudar con un límite claro", hint: "Te implicas sin asumirlo todo" },
      { id: "evitar", label: "Pedir que esta vez lo resuelvan sin ti", hint: "Proteges tu carrera, tensionas la relación" },
      { id: "aplazar", label: "Sentaros con números y repartir responsabilidades", hint: "Conviertes la urgencia en un plan" },
    ],
    free: "¿Qué haces distinto respecto a la primera vez?",
  },
};

function threadViewFor(s: GameState, kind: string): ThreadView | undefined {
  const uses = Object.keys(s.memory?.threads ?? {}).filter((key) => key.startsWith("thread-season:") && key.endsWith(\`:\${kind}\`) && (s.memory.threads[key] ?? 0) > 0).length;
  return uses >= 2 ? (THREAD_FOLLOWUPS[kind] ?? THREAD_VIEWS[kind]) : THREAD_VIEWS[kind];
}

export function renderDynamic(s: GameState, card: DynamicCard): DynamicView {`;
dynamic = dynamic.replace(marker, followups);

const oldView = `      const view = THREAD_VIEWS[kind];`;
const newView = `      const view = threadViewFor(s, kind);`;
if (!dynamic.includes(oldView)) throw new Error("thread render lookup not found");
dynamic = dynamic.replace(oldView, newView);

const oldUsed = `function kindAlreadyUsed(s: GameState, kind: ThreadKind): boolean {
  const key = seasonKindKey(kind, s.seasonIndex);
  if ((s.memory.threads?.[key] ?? 0) > 0) return true;
  if ((s.memory.threads?.[kind] ?? 0) > 0) {
    s.memory.threads[key] = 1;
    delete s.memory.threads[kind];
    return true;
  }
  return false;
}`;
const newUsed = `function kindAlreadyUsed(s: GameState, kind: ThreadKind): boolean {
  const key = seasonKindKey(kind, s.seasonIndex);
  if ((s.memory.threads?.[key] ?? 0) > 0) return true;
  if ((s.memory.threads?.[kind] ?? 0) > 0) {
    s.memory.threads[key] = 1;
    delete s.memory.threads[kind];
    return true;
  }
  // One authored follow-up is enough to prove that a relationship evolves.
  // A third pass would turn the mechanism back into renewable filler.
  const careerUses = Object.keys(s.memory.threads ?? {}).filter((usedKey) =>
    usedKey.startsWith("thread-season:") && usedKey.endsWith(\`:\${kind}\`) && (s.memory.threads[usedKey] ?? 0) > 0
  ).length;
  return careerUses >= 2;
}`;
if (!threads.includes(oldUsed)) throw new Error("kindAlreadyUsed block not found");
threads = threads.replace(oldUsed, newUsed);

fs.writeFileSync(dynamicPath, dynamic);
fs.writeFileSync(threadsPath, threads);
console.log("Applied authored second-chapter thread views and two-chapter career cap.");
