import { clubById } from "./data";
import { interpretFree } from "./interpret";
import { achieve, clamp, milestone, note, rel, stat } from "./mutate";
import type { DynamicCard, EventCategory, GameState, Interpretation, SceneKey, ShareData } from "./types";

export interface DynamicView {
  kicker: string;
  title: string;
  image: SceneKey;
  text: string;
  category: EventCategory;
  choices: { id: string; label: string; hint?: string }[];
  freeform?: { prompt: string; placeholder?: string };
}

export interface DynamicResult {
  title: string;
  text: string;
  tone: "good" | "bad" | "neutral" | "gold";
  share?: ShareData;
}

const str = (d: DynamicCard["data"], k: string, fb = ""): string => (typeof d[k] === "string" ? (d[k] as string) : fb);
const num = (d: DynamicCard["data"], k: string, fb = 0): number => (typeof d[k] === "number" && Number.isFinite(d[k]) ? (d[k] as number) : fb);

const RIVAL_CLUBS = [
  "Atlético de Madrid", "Valencia CF", "Real Sociedad", "Athletic Club", "Girona FC",
  "Sporting de Lisboa", "Ajax", "Brighton", "Olympique de Lyon", "Benfica",
];

const FLASH_TITLES: Record<string, string> = {
  goal: "Un gol que cambia el tramo",
  red: "Roja y silencio en el autobús",
  bench: "Tres partidos sin salir del banquillo",
  injury: "Algo se ha roto por el camino",
  streak: "El equipo se ha soltado",
  slump: "Racha mala y ruido alrededor",
  form: "El calendario ha pasado por encima",
};

const AGENT_TOPICS: Record<string, string> = {
  minutos:
    "Va directo: \"¿Te ha dicho el míster por qué juegas de rotación o te lo estás inventando tú?\". Hay ruido de bar detrás.",
  prensa:
    "\"Ha salido una frase tuya recortada. Ni la desmientas ni la repitas. Pero quiero saber qué dijiste exactamente\".",
  dinero:
    "\"Tu contrato está desfasado para lo que juegas. Puedo pedir mejora ahora o esperar a que valgas más. Decide tú\".",
  vida:
    "\"Te voy a preguntar una cosa como si fuera tu tío: ¿estás durmiendo bien? Porque en el vídeo se te ven las piernas cansadas\".",
};

interface ThreadView {
  kicker: string;
  title: string;
  image: SceneKey;
  category: EventCategory;
  text: string;
  choices: { id: string; label: string; hint?: string }[];
  free?: string;
}

const THREAD_VIEWS: Record<string, ThreadView> = {
  club_interest: {
    kicker: "Se confirma",
    title: "El club que preguntaba tiene nombre",
    image: "agent",
    category: "agent",
    text: "Era un sondeo real: quieren verte de cerca la próxima temporada.",
    choices: [
      { id: "afrontar", label: "Mostrar interés y escuchar", hint: "Ambición, ruido en el vestuario" },
      { id: "evitar", label: "Cortarlo: aquí estás creciendo", hint: "Club y afición lo valoran" },
    ],
    free: "¿Qué dices cuando te preguntan por ese club?",
  },
  coach_upset: {
    kicker: "Despacho",
    title: "El míster te esperaba sentado",
    image: "locker",
    category: "story",
    text: "No grita. Dice que te ve fuera del plan y que quiere oírte a ti antes de decidir.",
    choices: [
      { id: "afrontar", label: "Pedirle una oportunidad clara", hint: "Puede ganarte minutos" },
      { id: "evitar", label: "Callar y trabajar en silencio", hint: "Nada cambia hoy" },
    ],
    free: "¿Qué le contestas al entrenador?",
  },
  teammate_jealous: {
    kicker: "Vestuario",
    title: "El pique tiene cara concreta",
    image: "locker",
    category: "gossip",
    text: "El veterano que te dejó de saludar suelta una pulla delante de todos en la charla.",
    choices: [
      { id: "afrontar", label: "Responderle delante del grupo", hint: "Respeto o guerra" },
      { id: "evitar", label: "Aguantar y hablarlo aparte", hint: "Cabeza" },
    ],
    free: "¿Qué respondes en el vestuario?",
  },
  press_digging: {
    kicker: "Prensa",
    title: "El periodista ya tiene el reportaje",
    image: "tunnel",
    category: "press",
    text: "Quiere hablar de tu barrio, tu familia y del dinero que se mueve alrededor de un chico de tu edad.",
    choices: [
      { id: "afrontar", label: "Dar la entrevista", hint: "Notoriedad, exposición" },
      { id: "evitar", label: "Declinar por el club", hint: "Perfil bajo" },
    ],
    free: "¿Qué le dices al periodista?",
  },
  sponsor_call: {
    kicker: "Dinero",
    title: "Primera oferta de patrocinio",
    image: "agent",
    category: "life",
    text: "Botas, dos publicaciones al mes y una cifra que en tu casa nunca se ha visto junta.",
    choices: [
      { id: "afrontar", label: "Firmar el acuerdo", hint: "Dinero y ruido" },
      { id: "evitar", label: "Aparcarlo hasta consolidarte", hint: "Foco en el campo" },
    ],
  },
  national_call: {
    kicker: "Selección",
    title: "Lista publicada",
    image: "tunnel",
    category: "story",
    text: "Tu nombre aparece en la convocatoria de tu categoría. Cinco días fuera en pleno curso.",
    choices: [
      { id: "afrontar", label: "Ir y jugártela allí", hint: "Escaparate" },
      { id: "evitar", label: "Alegar cansancio y quedarte", hint: "El club lo agradece" },
    ],
  },
  family_worry: {
    kicker: "Casa",
    title: "Lo que no te contaban",
    image: "family",
    category: "life",
    text: "Es un problema de dinero en casa que llevaban meses tapando para no distraerte.",
    choices: [
      { id: "afrontar", label: "Implicarte y ayudar", hint: "Familia arriba, cabeza ocupada" },
      { id: "evitar", label: "Delegarlo y centrarte en jugar", hint: "Rendimiento primero" },
    ],
    free: "¿Qué dices en casa?",
  },
};

export function renderDynamic(s: GameState, card: DynamicCard): DynamicView {

  const d = card.data;
  const agentName = s.agent.name;
  switch (card.kind) {
    case "injury_diagnosis": {
      const sev = str(d, "severity", "minor");
      const out = num(d, "matchesOut", 3);
      return {
        kicker: "Parte médico",
        title: str(d, "label", "Lesión"),
        image: "injury",
        category: "medical",
        text:
          sev === "severe"
            ? `La resonancia no deja lugar a dudas: ${str(d, "label")}. El doctor habla de unos ${out} partidos fuera y de "no correr riesgos con un chico de tu edad". Nadie te mira a los ojos en el pasillo.`
            : sev === "medium"
              ? `${str(d, "label")}. Entre ${Math.max(2, out - 2)} y ${out + 1} partidos fuera según cómo responda la zona. El fisio ya te ha reservado la piscina.`
              : `${str(d, "label")}. Cosa menor: ${out} partido${out === 1 ? "" : "s"} de precaución si se hace bien.`,
        choices: [
          { id: "protocolo", label: "Seguir el protocolo del club", hint: "Plazos reales, cero riesgos" },
          { id: "arriesgar", label: "Forzar y volver antes de tiempo", hint: "Menos partidos fuera, riesgo de recaída" },
          { id: "segunda", label: "Pedir una segunda opinión", hint: "Puede cambiar el diagnóstico" },
          { id: "rehab", label: "Rehabilitación intensiva con preparador propio", hint: "Cuesta dinero y esfuerzo" },
        ],
      };
    }
    case "return":
      return {
        kicker: "Regreso",
        title: "Alta médica",
        image: "training",
        category: "medical",
        text: `${str(d, "label", "La lesión")} es pasado. Vuelves al grupo y el balón pesa distinto: todos han seguido sin ti y eso es lo que peor sienta.`,
        choices: [
          { id: "prudente", label: "Reaparecer con cabeza", hint: "Físico primero" },
          { id: "hambre", label: "Salir con hambre desde el primer rondo", hint: "Forma arriba, riesgo físico" },
        ],
      };
    case "agent_intro":
      return {
        kicker: "Representación",
        title: `${agentName} quiere hablar contigo`,
        image: "agent",
        category: "agent",
        text: `Café en una gasolinera de la A-92. ${agentName} llega con carpeta, reloj gordo y una frase preparada: "Llevo tres meses viéndote. No vengo a prometerte Europa, vengo a que no te coman". Te habla de un ${num(d, "commission", 8)}% de comisión.`,
        choices: [
          { id: "firmar", label: "Firmar con él", hint: "Ganas un aliado con memoria" },
          { id: "negociar", label: "Negociar la comisión", hint: "Menos porcentaje, algo menos de confianza" },
          { id: "esperar", label: "Decirle que aún no", hint: "Sigues solo, con tus padres decidiendo" },
        ],
        freeform: {
          prompt: `¿Qué le dices a ${agentName}?`,
          placeholder: "Escribe lo que quieras…",
        },
      };
    case "agent_teaser":
      return {
        kicker: "Mensaje",
        title: `${agentName}: "ha llamado un club"`,
        image: "agent",
        category: "agent",
        text: `Mensaje a las 23:41: "${str(d, "teaser", "Ha llamado un club importante preguntando por ti")}. No te digo quién todavía. Tú sigue como si no supieras nada y no se lo cuentes a NADIE del vestuario".`,
        choices: [
          { id: "confiar", label: "Confiar y seguir a lo tuyo", hint: "Disciplina" },
          { id: "presionar", label: "Exigirle que te diga qué club es", hint: "Puede sentar mal" },
          { id: "contar", label: "Contárselo a un compañero de confianza", hint: "El vestuario habla" },
        ],
      };
    case "agent_offer":
      return {
        kicker: "Rumor confirmado",
        title: `Interés del ${str(d, "clubName", "un club")}`,
        image: "agent",
        category: "agent",
        text: `${agentName} lo suelta por fin: el ${str(d, "clubName")} pregunta por ti. No es una oferta firmada, es un sondeo con números: ficha de ${num(d, "salary", 200)}.000 € y promesa de minutos en el filial o rotación. Tu club diría que no de entrada.`,
        choices: [
          { id: "escuchar", label: "Escuchar y dejar avanzar la operación", hint: "Ambición y ruido" },
          { id: "rechazar", label: "Cerrar la puerta: aquí estás bien", hint: "Vestuario y afición lo valoran" },
          { id: "usar", label: "Usarla para pedir mejora en tu club", hint: "Jugada de riesgo" },
        ],
        freeform: {
          prompt: "¿Qué le respondes a tu representante?",
          placeholder: "Habla claro con él…",
        },
      };
    case "agent_commission":
      return {
        kicker: "Números",
        title: "La comisión sobre la mesa",
        image: "agent",
        category: "agent",
        text: `${agentName} quiere subir su comisión al ${num(d, "commission", 10)}% alegando el trabajo con tu club y "lo que viene". Tu padre dice que es un robo. Él dice que es el mercado.`,
        choices: [
          { id: "aceptar", label: "Aceptar sin discutir", hint: "Confianza total" },
          { id: "bajar", label: "Ofrecer la mitad de la subida", hint: "Negociación limpia" },
          { id: "romper", label: "Romper la relación", hint: "Te quedas sin representante" },
        ],
        freeform: {
          prompt: "¿Qué le dices sobre el dinero?",
          placeholder: "Negocia como quieras…",
        },
      };
    case "contract":
      return {
        kicker: "Despacho",
        title: "Primer contrato profesional",
        image: "tunnel",
        category: "story",
        text: `Mesa larga, secretaría técnica y una carpeta con tu nombre mal escrito. ${num(d, "years", 3)} temporadas, ${num(d, "salary", 120)}.000 € por curso y una cláusula que suena a mucho. ${s.agent.present ? `${agentName} te toca la rodilla por debajo de la mesa: "Espera".` : "Estás solo con tus padres al otro lado del teléfono."}`,
        choices: [
          { id: "firmar", label: "Firmar ya", hint: "Seguridad inmediata" },
          { id: "mejorar", label: "Pedir mejora y cláusula de minutos", hint: "Riesgo de enfriar al club" },
          { id: "esperar", label: "Esperar a final de temporada", hint: "Apuestas por ti mismo" },
        ],
      };
    case "promotion":
      return {
        kicker: "Ascenso interno",
        title: str(d, "title", "Subes de categoría"),
        image: "tunnel",
        category: "story",
        text: str(d, "text", "El club te sube de equipo."),
        choices: [{ id: "ok", label: "Asumirlo", hint: "Nuevo escalón, nuevo baremo" }],
      };
    case "growth":
      return {
        kicker: "Progreso",
        title: "Has dado un salto",
        image: "training",
        category: "training",
        text: str(d, "text", "El cuerpo técnico ve un cambio real en tu juego."),
        choices: [{ id: "ok", label: "Seguir" }],
      };
    case "match_flash": {
      const flashKind = str(d, "kind", "form");
      return {
        kicker: `${num(d, "matches", 3)} jornadas en segundo plano`,
        title: FLASH_TITLES[flashKind] ?? "Algo ha pasado sin ti",
        image: flashKind === "injury" ? "injury" : "match",
        category: "story",
        text: `${str(d, "text", "El equipo ha seguido su camino.")} Balance del tramo: ${num(d, "wins")}V ${num(d, "draws")}E ${num(d, "losses")}D.`,
        choices: [
          { id: "asumir", label: "Asumirlo y mirar adelante", hint: "Cabeza fría" },
          { id: "hablar", label: "Hablarlo con el míster", hint: "Puede salir bien o mal" },
        ],
      };
    }
    case "agent_check":
      return {
        kicker: `Llamada · ${str(d, "hour", "23:17")}`,
        title: `${agentName} no quiere hablar por WhatsApp`,
        image: "agent",
        category: "agent",
        text: AGENT_TOPICS[str(d, "topic", "minutos")] ?? "Quiere saber cómo estás de verdad.",
        choices: [
          { id: "sincero", label: "Contarle la verdad", hint: "Confianza" },
          { id: "cerrar", label: "Quitarle importancia", hint: "Te guardas el problema" },
        ],
        freeform: { prompt: `¿Qué le contestas a ${agentName}?`, placeholder: "Escribe lo que quieras…" },
      };
    case "thread": {
      const kind = str(d, "threadKind", "club_interest");
      const view = THREAD_VIEWS[kind];
      return {
        kicker: view?.kicker ?? "Se resuelve",
        title: view?.title ?? "Aquello de lo que se hablaba",
        image: view?.image ?? "locker",
        category: view?.category ?? "story",
        text: `${str(d, "teaser", "Se hablaba de algo.")} ${view?.text ?? "Hoy tiene nombre y apellidos."}`,
        choices: view?.choices ?? [
          { id: "afrontar", label: "Afrontarlo de frente" },
          { id: "evitar", label: "Dejarlo pasar" },
        ],
        ...(view?.free ? { freeform: { prompt: view.free, placeholder: "Escribe lo que quieras…" } } : {}),
      };
    }
    default:

      return {
        kicker: "Carrera",
        title: "Semana de trabajo",
        image: "training",
        category: "training",
        text: "Rutina, gimnasio y vídeo. No todo es épica.",
        choices: [{ id: "ok", label: "Continuar" }],
      };
  }
}

export function resolveDynamic(
  s: GameState,
  card: DynamicCard,
  choiceId: string,
  freeText?: string,
): DynamicResult {
  const d = card.data;
  const interp: Interpretation | null = freeText !== undefined ? interpretFree(freeText) : null;

  switch (card.kind) {
    case "injury_diagnosis":
      return resolveInjury(s, card, choiceId);
    case "return": {
      s.flags["volvio_pendiente"] = 0;
      achieve(s, "superviviente");
      if (choiceId === "hambre") {
        stat(s, "form", 10);
        stat(s, "fitness", -6);
        return { title: "Vuelta con hambre", text: "El fisio te grita, tú sonríes. La primera semana vuelas y la segunda lo pagas.", tone: "neutral" };
      }
      stat(s, "fitness", 14);
      stat(s, "form", 3);
      return { title: "Vuelta con cabeza", text: "Cargas de trabajo medidas. Tres semanas después estás entero otra vez.", tone: "good" };
    }
    case "agent_intro":
      return resolveAgentIntro(s, card, choiceId, interp);
    case "agent_teaser": {
      if (choiceId === "presionar") {
        s.agent.trust = clamp(s.agent.trust - 8);
        rel(s, "agent", -4);
        return { title: "Impaciencia", text: `${s.agent.name} se molesta: "Cuando haya algo, lo sabrás". Pero suelta un dato: es un club de Primera.`, tone: "neutral" };
      }
      if (choiceId === "contar") {
        rel(s, "dressing", -6);
        stat(s, "fame", 5);
        remember(s, "El vestuario sabe que hay clubes preguntando por ti");
        return { title: "Se corre la voz", text: "A los dos días medio vestuario lo sabe y el míster te mira distinto en el rondo.", tone: "bad" };
      }
      s.agent.trust = clamp(s.agent.trust + 8);
      stat(s, "discipline", 3);
      return { title: "Silencio profesional", text: "No dices nada a nadie. Tu representante lo nota y lo agradece.", tone: "good" };
    }
    case "agent_offer":
      return resolveAgentOffer(s, card, choiceId, interp);
    case "agent_commission":
      return resolveCommission(s, card, choiceId, interp);
    case "contract":
      return resolveContract(s, card, choiceId);
    case "promotion":
      return { title: str(d, "title", "Nuevo escalón"), text: "Nuevo vestuario, nuevo baremo: aquí tu media pesa menos que ayer.", tone: "gold" };
    case "growth":
      return { title: "Salto de nivel", text: str(d, "text", "Tu media sube."), tone: "gold" };
    case "match_flash": {
      if (choiceId === "hablar") {
        const ok = s.rel.coach >= 45 ? Math.random() < 0.6 : Math.random() < 0.3;
        rel(s, "coach", ok ? 5 : -5);
        stat(s, "morale", ok ? 5 : -5);
        return ok
          ? { title: "Conversación útil", text: "El míster te explica qué quiere de ti y te da un plan concreto.", tone: "good" }
          : { title: "Portazo suave", text: "\"Cuando toque, jugarás\". Sales del despacho igual que entraste.", tone: "bad" };
      }
      stat(s, "discipline", 2);
      return { title: "Cabeza fría", text: "Guardas el enfado para el campo.", tone: "neutral" };
    }
    case "agent_check": {
      if (interp) {
        const good = interp.intent === "professional" || interp.intent === "loyal" || interp.intent === "conciliatory";
        s.agent.trust = clamp(s.agent.trust + (good ? 7 : -5));
        rel(s, "agent", good ? 4 : -4);
        remember(s, `Hablasteis de ${str(d, "topic", "todo")} por teléfono de noche`);
        return {
          title: good ? "Se queda tranquilo" : "Cuelga raro",
          text: good
            ? `${s.agent.name} apunta lo que le dices y promete moverse con cabeza.`
            : `${s.agent.name} no le gusta el tono. "Ya hablamos otro día".`,
          tone: good ? "good" : "bad",
        };
      }
      if (choiceId === "sincero") {
        s.agent.trust = clamp(s.agent.trust + 6);
        rel(s, "agent", 4);
        return { title: "Todo sobre la mesa", text: `${s.agent.name} escucha veinte minutos sin interrumpir. Sirve.`, tone: "good" };
      }
      s.agent.trust = clamp(s.agent.trust - 3);
      return { title: "Te lo guardas", text: "\"Como quieras. Pero yo me entero igual\".", tone: "neutral" };
    }
    case "thread":
      return resolveThread(s, card, choiceId, interp);
    default:
      return { title: "Semana cerrada", text: "Sigues.", tone: "neutral" };

  }
}

function remember(s: GameState, text: string) {
  if (!s.agent.memories.includes(text)) s.agent.memories.unshift(text);
  s.agent.memories = s.agent.memories.slice(0, 12);
}

function resolveInjury(s: GameState, card: DynamicCard, choiceId: string): DynamicResult {
  const inj = s.injury;
  if (!inj) return { title: "Recuperado", text: "El parte era mejor de lo que parecía.", tone: "good" };
  inj.treated = true;
  switch (choiceId) {
    case "arriesgar":
      inj.matchesOut = Math.max(1, Math.round(inj.matchesOut * 0.55));
      stat(s, "fitness", -8);
      s.flags["riesgo_recaida"] = 1;
      return {
        title: "Vuelta acelerada",
        text: `Acortas plazos a ${inj.matchesOut} partidos. El médico firma con reservas y tu cuerpo se guarda la factura para más adelante.`,
        tone: "neutral",
      };
    case "segunda": {
      const better = Math.random() < 0.5;
      if (better) {
        inj.matchesOut = Math.max(1, inj.matchesOut - 2);
        return { title: "Segunda opinión", text: `Un especialista en Barcelona ve la lesión menos grave: ${inj.matchesOut} partidos y un plan claro.`, tone: "good" };
      }
      inj.matchesOut += 1;
      stat(s, "morale", -6);
      return { title: "Segunda opinión", text: "El especialista es más pesimista que el club. Un partido más de baja y una noche mala.", tone: "bad" };
    }
    case "rehab":
      stat(s, "fitness", 8);
      stat(s, "discipline", 5);
      s.salary = Math.max(0, s.salary - 5);
      return { title: "Rehabilitación intensiva", text: "Dos sesiones diarias, pagadas de tu bolsillo. Vuelves más fuerte de lo que te fuiste.", tone: "good" };
    default:
      rel(s, "coach", 3);
      stat(s, "discipline", 3);
      return { title: "Protocolo del club", text: `Plazos reales: ${inj.matchesOut} partidos. Gimnasio, piscina y ver los partidos desde arriba.`, tone: "neutral" };
  }
}

function resolveAgentIntro(s: GameState, card: DynamicCard, choiceId: string, i: Interpretation | null): DynamicResult {
  const commission = num(card.data, "commission", 8);
  if (i) {
    if (i.intent === "aggressive") {
      s.agent.present = false;
      remember(s, "Le hablaste mal en la primera reunión");
      return { title: "Reunión rota", text: `${s.agent.name} deja el café a medias: "Suerte, chaval". Sigues sin representante y con fama de difícil.`, tone: "bad" };
    }
    if (i.intent === "professional" || i.intent === "loyal" || i.intent === "conciliatory") {
      s.agent.present = true;
      s.hasAgent = true;
      s.agent.commission = commission;
      s.agent.trust = clamp(s.agent.trust + 20, 0, 100);
      rel(s, "agent", 25);
      achieve(s, "representante");
      remember(s, "Primera reunión seria: te tomó en serio desde el minuto uno");
      milestone(s, `${s.agent.name} pasa a ser tu representante.`);
      return { title: "Tienes representante", text: `${s.agent.name} apunta todo lo que dices en una libreta pequeña. "Esto lo firmamos hoy".`, tone: "gold" };
    }
    if (i.intent === "defiant" || i.intent === "ambitious") {
      s.agent.present = true;
      s.hasAgent = true;
      s.agent.commission = Math.max(5, commission - 1);
      s.agent.trust = clamp(s.agent.trust + 10);
      rel(s, "agent", 15);
      achieve(s, "representante");
      remember(s, "Le dejaste claro que quieres llegar arriba");
      return { title: "Acuerdo con carácter", text: `Le pones condiciones y le rebajas la comisión al ${s.agent.commission}%. "Me gusta que sepas lo que vales".`, tone: "good" };
    }
    s.agent.present = true;
    s.hasAgent = true;
    s.agent.commission = commission;
    rel(s, "agent", 10);
    achieve(s, "representante");
    return { title: "Acuerdo tibio", text: `Firmáis sin entusiasmo. ${s.agent.name} se guarda tu falta de claridad para otro día.`, tone: "neutral" };
  }

  if (choiceId === "esperar") {
    s.flags["agente_aplazado"] = 1;
    return { title: "Todavía no", text: `Le dices que aún no. ${s.agent.name} se levanta sin dramatismo: "Llámame cuando el teléfono empiece a sonar".`, tone: "neutral" };
  }
  if (choiceId === "negociar") {
    s.agent.present = true;
    s.hasAgent = true;
    s.agent.commission = Math.max(5, commission - 2);
    s.agent.trust = clamp(s.agent.trust + 8);
    rel(s, "agent", 14);
    achieve(s, "representante");
    remember(s, "Le negociaste la comisión desde el primer día");
    return { title: "Comisión negociada", text: `Cierras un ${s.agent.commission}%. Él se ríe: "Vas a ser de los complicados. Mejor".`, tone: "good" };
  }
  s.agent.present = true;
  s.hasAgent = true;
  s.agent.commission = commission;
  s.agent.trust = clamp(s.agent.trust + 15);
  rel(s, "agent", 22);
  achieve(s, "representante");
  milestone(s, `${s.agent.name} pasa a ser tu representante.`);
  return { title: "Tienes representante", text: `Firmas en una servilleta y luego en papel de verdad. Ya no estás solo en esto.`, tone: "gold" };
}

function resolveAgentOffer(s: GameState, card: DynamicCard, choiceId: string, i: Interpretation | null): DynamicResult {
  const clubName = str(card.data, "clubName", "un club");
  const decision = i
    ? i.intent === "loyal" || i.intent === "conciliatory"
      ? "rechazar"
      : i.intent === "ambitious" || i.intent === "defiant"
        ? "escuchar"
        : i.intent === "aggressive"
          ? "romper"
          : "usar"
    : choiceId;

  s.agent.teaser = null;
  if (decision === "rechazar") {
    s.memory.rejectedClubs.push(clubName);
    rel(s, "fans", 10);
    rel(s, "dressing", 6);
    s.agent.trust = clamp(s.agent.trust - 10);
    remember(s, `Rechazaste al ${clubName}`);
    note(s, `Rechazas el interés del ${clubName}.`, "gold");
    return { title: `No al ${clubName}`, text: `Le dices que no. ${s.agent.name} resopla: "Estos no vuelven a llamar dos veces… aunque a veces sí".`, tone: "good" };
  }
  if (decision === "romper") {
    s.agent.trust = clamp(s.agent.trust - 25);
    rel(s, "agent", -15);
    remember(s, "Le gritaste cuando trajo una oferta");
    return { title: "Bronca con tu representante", text: `Le contestas fatal por teléfono. La operación se cae y la relación queda tocada.`, tone: "bad" };
  }
  if (decision === "usar") {
    const ok = Math.random() < 0.55 + (s.rel.coach - 50) / 300;
    if (ok) {
      s.salary += 40;
      s.contract = s.contract ?? "Renovación con mejora";
      rel(s, "coach", 3);
      remember(s, `Usaste al ${clubName} para mejorar tu contrato`);
      return { title: "Jugada redonda", text: `Tu club mejora tu ficha para blindarte. El ${clubName} se queda con las ganas y tú con el dinero.`, tone: "good" };
    }
    rel(s, "coach", -8);
    rel(s, "fans", -5);
    s.memory.conflicts.push(`El club se enfadó por el coqueteo con el ${clubName}`);
    return { title: "Jugada fallida", text: `El club se lo toma como un chantaje. "Aquí nadie es imprescindible con tu edad".`, tone: "bad" };
  }
  s.flags["ventana_salida"] = 1;
  stat(s, "fame", 8);
  rel(s, "fans", -4);
  s.agent.trust = clamp(s.agent.trust + 8);
  remember(s, `Dejaste avanzar la operación con el ${clubName}`);
  note(s, `La operación con el ${clubName} avanza.`, "neutral");
  return {
    title: "Puerta abierta",
    text: `Autorizas a tu representante a negociar con el ${clubName}. Ahora cada partido tuyo se mira con lupa desde dos ciudades.`,
    tone: "neutral",
  };
}

function resolveCommission(s: GameState, card: DynamicCard, choiceId: string, i: Interpretation | null): DynamicResult {
  const asked = num(card.data, "commission", 10);
  const decision = i
    ? i.intent === "aggressive"
      ? "romper"
      : i.intent === "conciliatory" || i.intent === "professional"
        ? "bajar"
        : i.intent === "defiant"
          ? "romper"
          : "aceptar"
    : choiceId;

  if (decision === "romper") {
    s.agent.present = false;
    s.hasAgent = false;
    s.agent.firedCount += 1;
    rel(s, "agent", -25);
    remember(s, "Le despediste por una discusión de comisión");
    note(s, `Rompes con ${s.agent.name}.`, "bad");
    return { title: "Sin representante", text: `Cortas la relación. Te quedas libre y solo, con el teléfono más silencioso.`, tone: "bad" };
  }
  if (decision === "bajar") {
    s.agent.commission = Math.round((s.agent.commission + asked) / 2);
    s.agent.trust = clamp(s.agent.trust + 6);
    return { title: "Trato justo", text: `Cerráis en un ${s.agent.commission}%. Los dos os quedáis medio satisfechos, que es lo que suele significar un buen acuerdo.`, tone: "good" };
  }
  s.agent.commission = asked;
  s.agent.trust = clamp(s.agent.trust + 12);
  rel(s, "agent", 8);
  return { title: "Comisión aceptada", text: `Firmas el ${asked}% sin discutir. Él te devuelve lealtad y llamadas a horas imposibles.`, tone: "neutral" };
}

function resolveContract(s: GameState, card: DynamicCard, choiceId: string): DynamicResult {
  const years = num(card.data, "years", 3);
  const salary = num(card.data, "salary", 120);
  if (choiceId === "esperar") {
    s.flags["contrato_aplazado"] = 1;
    return { title: "Sin firmar", text: "Decides esperar a final de temporada. Si va bien, ganas; si te lesionas, lo pagas.", tone: "neutral" };
  }
  if (choiceId === "mejorar") {
    const ok = Math.random() < (s.agent.present ? 0.62 : 0.4) + (s.rel.coach - 50) / 400;
    if (ok) {
      s.contract = `${years} temporadas · cláusula de minutos`;
      s.salary = salary + 40;
      achieve(s, "primer_contrato");
      milestone(s, "Firmas tu primer contrato profesional con cláusula de minutos.");
      return {
        title: "Contrato mejorado",
        text: `El club cede: ${years} temporadas, ${s.salary}.000 € y una cláusula que te garantiza minutos si el equipo está salvado.`,
        tone: "gold",
        share: shareContract(s, years, s.salary),
      };
    }
    s.contract = `${years} temporadas`;
    s.salary = salary;
    rel(s, "coach", -4);
    achieve(s, "primer_contrato");
    milestone(s, "Firmas tu primer contrato profesional.");
    return { title: "Contrato firmado", text: `Aprietas, no cede nadie y acabas firmando lo mismo con peor ambiente.`, tone: "neutral", share: shareContract(s, years, salary) };
  }
  s.contract = `${years} temporadas`;
  s.salary = salary;
  achieve(s, "primer_contrato");
  milestone(s, "Firmas tu primer contrato profesional.");
  rel(s, "coach", 3);
  return {
    title: "Primer contrato profesional",
    text: `Firmas ${years} temporadas y ${salary}.000 € por curso. Tu padre guarda el bolígrafo.`,
    tone: "gold",
    share: shareContract(s, years, salary),
  };
}

function shareContract(s: GameState, years: number, salary: number): ShareData {
  return {
    headline: "PRIMER CONTRATO PROFESIONAL",
    kicker: clubById(s.clubId).name,
    lines: [
      { label: "Edad", value: `${s.age} años` },
      { label: "Media", value: String(s.overall) },
      { label: "Duración", value: `${years} temporadas` },
      { label: "Ficha", value: `${salary}.000 €` },
    ],
  };
}

export function randomSuitor(s: GameState): string {
  const pool = RIVAL_CLUBS.filter((c) => c !== clubById(s.clubId).name);
  const returning = s.memory.rejectedClubs.find(() => Math.random() < 0.35);
  return returning ?? pool[Math.floor(Math.random() * pool.length)]!;
}
