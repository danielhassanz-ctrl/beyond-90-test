import Anthropic from "@anthropic-ai/sdk";
import type { Consequences, EventCategory, GameEvent, SecondCareerRole } from "@/types/career";
import type { Player } from "@/types/player";
import { SECOND_CAREER_LABELS, playerAge } from "@/types/career";
import { STARTING_AGENTS, pickStartingClubOffers } from "@/lib/constants";
import { getSeasonContext, formatTournamentContext } from "@/lib/calendar/season";
import { getCareerContext, shouldHaveClubOpportunity, shouldSuggestLifeEvent } from "@/lib/narrative/career-arc";
import {
  getSecondaryCharacters,
  pickCharacterToReappear,
  describeCharacterReappearance,
  updateCharacterLastSeen,
} from "@/lib/narrative/secondary-characters";
import { NarrativeContent } from "@/lib/narrative/narrative-content";

const MODEL = "claude-sonnet-5";

/**
 * Genera ideas narrativas para inyectar en prompts según contexto del jugador.
 * Asegura variedad y riqueza emocional.
 */
function generateNarrativeHints(player: Player): string {
  const hints: string[] = [];
  const age = playerAge(player.week);

  // Sugerir momentos emocionales según etapa
  if (age < 20) {
    hints.push("Juventud, debut, ansiedad de pertenecer");
    const youthMoments = NarrativeContent.emotions.gol_decisivo;
    if (youthMoments) hints.push(`Inspiración: ${youthMoments[0]}`);
  } else if (age < 25) {
    hints.push("Consolidación, rivalidad, primeros éxitos");
    hints.push(`Idea: conflicto con entrenador o momento de reconocimiento`);
  } else if (age < 30) {
    hints.push("Pico de carrera, presión máxima, dilemas personales");
    hints.push(`Idea: propuesta personal (matrimonio, hijo) o gran oferta`);
  } else if (age < 35) {
    hints.push("Veteranía, legado, últimas oportunidades");
    hints.push(`Idea: homenaje, oferta exótica o reflexión sobre retiro`);
  } else {
    hints.push("Declive, cierre, preparación para segunda vida");
    hints.push(`Idea: últimos partidos, reconocimiento, transición`);
  }

  // Sugerir tipos de momento según stats
  if (player.moral < 40) {
    hints.push("Momento crítico: conflicto, lesión, fracaso público");
  } else if (player.fama > 80) {
    hints.push("Moment de spotlight: presión mediática, escándalo, o gloria");
  } else if (player.media > 85) {
    hints.push("Elite mundial: ofertas de gigantes, presión, momentos históricos");
  }

  // Sugerir variación de tipo de evento
  const roll = Math.random();
  if (roll < 0.3) {
    hints.push("Tipo: momento de gol o asistencia memorable");
  } else if (roll < 0.5) {
    hints.push("Tipo: conflicto o dilema personal/profesional");
  } else if (roll < 0.7) {
    hints.push("Tipo: cambio de vida (familia, dinero, relaciones)");
  } else {
    hints.push("Tipo: presión, escándalo, o momento de reconocimiento");
  }

  return hints.join("\n");
}

/**
 * Mejora un prompt de imagen para hacerlo más visual, específico y compartible.
 * Asegura que incluya: pose, expresión, ropa, luz, contexto, detalles emocionales.
 */
function enhanceImagePrompt(basePrompt: string, context: string = ""): string {
  // Si el prompt ya es bueno (incluye luz, expresión, pose), no tocarlo
  if (basePrompt.includes("light") && basePrompt.includes("expression") && basePrompt.length > 100) {
    return basePrompt;
  }

  // Agregar elementos visuales específicos si faltan
  const enhancements: Record<string, string> = {
    firma: "shaking hands firmly with club director, official executive office with marble, warm morning light from window, determined confident expression, official club crest visible on wall behind",
    debut: "young player in white kit, hands on hips, determined focused expression, stadium in background with fans, afternoon sunlight, intense but proud moment",
    gol: "celebrating with both arms raised, genuine joy and pride on face, teammates running towards, stadium crowd blurred celebrating, golden hour light",
    lesión: "sitting on medical bench, ice pack on leg, pensive concerned expression, medical staff blurred in background, gym indoor lighting",
    boda: "formal suit, bride in white dress, couple smiling together, intimate moment, warm soft lighting, church or venue interior",
    hijo: "holding baby carefully, tender loving expression, soft intimate indoor lighting, genuine family moment",
    trofeo: "holding trophy above head, genuine joy and pride on face, teammates celebrating in background, stadium lighting",
    despedida: "veteran player, contemplative expression, walking from stadium, sunset lighting, nostalgic emotional mood",
  };

  // Detectar el tipo de evento
  let enhancement = "";
  for (const [key, value] of Object.entries(enhancements)) {
    if (basePrompt.toLowerCase().includes(key) || context.toLowerCase().includes(key)) {
      enhancement = value;
      break;
    }
  }

  // Si encontramos una mejora, combinarla con el prompt base
  if (enhancement) {
    const cleaned = basePrompt
      .replace(/photorealistic|professional|high quality/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length < 50) {
      return `Photorealistic professional scene: ${enhancement}. Emotional, shareable moment.`;
    } else {
      return `${cleaned}. Enhanced with: ${enhancement}. Photorealistic, shareable moment.`;
    }
  }

  // Si no hay mejora específica, agregar elementos genéricos
  if (!basePrompt.includes("expression") && !basePrompt.includes("light")) {
    return `${basePrompt}. Photorealistic, emotional expression on face, professional dynamic lighting, shareable social moment.`;
  }

  return basePrompt;
}

const FLAVOR_CATEGORIES: EventCategory[] = [
  "entrenamiento",
  "vestuario",
  "representante",
  "prensa",
  "vida",
  "especial",
];

/**
 * Traduce los flags acumulados (pareja, hijos, títulos, apodos ganados...)
 * a una lista legible para el prompt. Sin esto, la IA genera cada escena
 * en el vacío, sin memoria real de la vida que el jugador ya construyó —
 * la causa principal de que la narrativa se sienta "plantilla con los
 * nombres cambiados" en vez de una historia que de verdad continúa.
 */
function describePersonalLife(flags: Record<string, string | boolean> | null | undefined): string {
  if (!flags) return "(todavía no tiene ningún hilo de vida personal establecido)";
  const lines: string[] = [];
  if (flags.pareja) lines.push(`- Pareja: ${flags.pareja}`);
  if (flags.convivencia) lines.push(`- Vive junto a su pareja`);
  if (flags.hijos) lines.push(`- Hijos: ${flags.hijos === true ? "sí" : flags.hijos}`);
  if (flags.title_liga) lines.push(`- Ya ganó la Liga con su club`);
  if (flags.title_champions) lines.push(`- Ya ganó la Champions League`);
  if (flags.title_balon_oro) lines.push(`- Ya ganó el Balón de Oro`);
  if (flags.en_premier) lines.push(`- Juega actualmente en la Premier League`);
  for (const [key, value] of Object.entries(flags)) {
    if (
      ["pareja", "convivencia", "hijos", "title_liga", "title_champions", "title_balon_oro", "en_premier"].includes(
        key,
      )
    )
      continue;
    lines.push(`- ${key}: ${value}`);
  }
  return lines.length > 0 ? lines.join("\n") : "(todavía no tiene ningún hilo de vida personal establecido)";
}

export interface HistoryItem {
  title: string;
  chosen: string;
  /** Lo que el jugador escribió con sus propias palabras en la opción libre, si la usó. */
  freeText?: string | null;
}

function pickCategory(): EventCategory {
  return FLAVOR_CATEGORIES[Math.floor(Math.random() * FLAVOR_CATEGORIES.length)];
}

const EVENT_TOOL: Anthropic.Tool = {
  name: "emit_event",
  description: "Devuelve el próximo evento narrativo de la carrera del jugador.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      allow_free_text: { type: "boolean" },
      free_text_prompt: { type: "string" },
      is_milestone: { type: "boolean" },
      image_scene: { type: "string" },
      rival_club: {
        type: "string",
        description: "Solo para eventos de partido: nombre corto y real del club rival (ej. 'Villarreal CF'), igual al usado en la descripción.",
      },
      memorable_thread: {
        type: "string",
        description:
          "Solo si esta escena presenta o resuelve un vínculo personal que merece recordarse mucho más adelante en la carrera (un personaje nuevo con nombre, una promesa, un rencor, algo pendiente): resume en una frase corta quién es y qué pasó, en tercera persona (ej. 'Iker, un canterano al que dio la espalda cuando le pidió consejo'). Si la escena no crea ni resuelve nada memorable, no incluyas este campo.",
      },
      options: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            subtitle: { type: "string" },
            consequences: {
              type: "object",
              properties: {
                forma: { type: "integer" },
                moral: { type: "integer" },
                fama: { type: "integer" },
                media: {
                  type: "integer",
                  description:
                    "Media futbolística (tipo videojuego, escala 40-99). Solo inclúyela si la escena tiene relación directa con el rendimiento como jugador: sube con goles, actuaciones destacadas o títulos; baja si te quedas en el banquillo, rindes mal o hay conflicto serio con el entrenador. En escenas sin relación con el juego (fama, vida personal, patrocinios), no la incluyas.",
                },
                patrimonio: { type: "integer" },
                rel_entrenador: { type: "integer" },
                rel_vestuario: { type: "integer" },
                rel_aficion: { type: "integer" },
                rel_representante: { type: "integer" },
              },
              additionalProperties: false,
            },
          },
          required: ["label", "subtitle", "consequences"],
        },
      },
    },
    required: ["title", "description", "options"],
  },
};

function clamp(value: number | undefined, min: number, max: number) {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function sanitizeConsequences(raw: Consequences): Consequences {
  return {
    forma: clamp(raw.forma, -15, 15),
    moral: clamp(raw.moral, -15, 15),
    fama: clamp(raw.fama, -15, 15),
    media: clamp(raw.media, -6, 8),
    patrimonio: clamp(raw.patrimonio, -30000, 40000),
    rel_entrenador: clamp(raw.rel_entrenador, -15, 15),
    rel_vestuario: clamp(raw.rel_vestuario, -15, 15),
    rel_aficion: clamp(raw.rel_aficion, -15, 15),
    rel_representante: clamp(raw.rel_representante, -15, 15),
  };
}

const COMMON_RULES = `- Escribe en castellano de España (tú, nunca vos/tenés/vení; nada de vocabulario rioplatense o latinoamericano como "plata", "auto", "computadora", "celular", "plantel", "cancha", "vidriera", "afuera", "chico/a" con el sentido de "pequeño" — usa "dinero", "coche", "ordenador", "móvil", "plantilla", "campo", "exposición", "fuera", "pequeño/a"). Tono corto y directo: 2-3 frases en la descripción, como una escena de un simulador de carrera, no un narrador literario.
- Las opciones deben ser entre 2 y 4 — varía la cantidad de una escena a otra, no pongas siempre el mismo número. Cada una con una etiqueta de acción corta y un subtítulo que adelante la consecuencia (ej. "+Vestuario", "Jugada de riesgo").
- Las consecuencias numéricas deben ser sutiles para stats/relaciones (entre -10 y +10). El patrimonio puede moverse más si la escena lo justifica (ej. una prima de fichaje, un contrato nuevo).
- Cualquier persona famosa que aparezca (cantante, influencer, otro futbolista) debe ser CLARAMENTE FICTICIA — nunca un nombre real.`;

export async function callEventTool(
  prompt: string,
  category: EventCategory,
  idPrefix: string,
): Promise<GameEvent | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(`[callEventTool:${idPrefix}] FATAL: no ANTHROPIC_API_KEY set`);
    return null;
  }

  try {
    console.log(`[callEventTool:${idPrefix}] calling Claude API with category=${category}...`);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 1.2, // Temperatura alta para garantizar variación - cada partida diferente
      tools: [EVENT_TOOL],
      tool_choice: { type: "tool", name: "emit_event" },
      messages: [{ role: "user", content: prompt }],
    });

    console.log(`[callEventTool:${idPrefix}] API response received, analyzing...`);

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      console.error(
        `[callEventTool:${idPrefix}] FAIL: no tool_use block in response. response.content=${JSON.stringify(response.content).slice(0, 200)}`
      );
      return null;
    }

    const data = toolUse.input as {
      title?: string;
      description?: string;
      allow_free_text?: boolean;
      free_text_prompt?: string;
      is_milestone?: boolean;
      image_scene?: string;
      rival_club?: string;
      memorable_thread?: string;
      options?: Array<{ label?: string; subtitle?: string; consequences?: Consequences }>;
    };

    if (!data.title || !data.description || !data.options || data.options.length < 2) {
      console.error(
        `[callEventTool:${idPrefix}] FAIL: incomplete tool input. title=${!!data.title}, description=${!!data.description}, options.length=${data.options?.length ?? 0}`
      );
      return null;
    }

    const options = data.options
      .filter((o) => o.label && o.subtitle)
      .map((o, i) => ({
        id: String(i),
        label: o.label as string,
        subtitle: o.subtitle as string,
        consequences: sanitizeConsequences(o.consequences ?? {}),
      }));

    if (options.length < 2) {
      console.error(`[callEventTool:${idPrefix}] FAIL: only ${options.length} valid options after filtering`);
      return null;
    }

    const isMilestone = Boolean(data.is_milestone);
    const result = {
      id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category,
      title: data.title,
      description: data.description,
      allowFreeText: Boolean(data.allow_free_text),
      freeTextPrompt: data.free_text_prompt,
      isMilestone,
      milestoneType: isMilestone ? "escena" : undefined,
      imageScene: isMilestone ? data.image_scene : undefined,
      rivalClub: data.rival_club || undefined,
      memorableThread: data.memorable_thread || undefined,
      options,
    };

    console.log(`[callEventTool:${idPrefix}] SUCCESS: "${result.title}" (${options.length} options, milestone=${isMilestone})`);
    return result;
  } catch (err) {
    console.error(
      `[callEventTool:${idPrefix}] EXCEPTION: ${err instanceof Error ? err.message : JSON.stringify(err).slice(0, 200)}`
    );
    return null;
  }
}

/**
 * Genera TODOS los eventos con IA, nunca repitiendo premisa.
 * Contextualizado a: edad/etapa, posición, club, vida personal, historia previa.
 * ~40-50% eventos de vida real, ~50-60% futbolísticos según posición.
 */
export async function generateNextEventDynamic(
  player: Player,
  history: HistoryItem[],
): Promise<GameEvent | null> {
  const age = playerAge(player.week);

  // Determina la etapa de carrera
  const stage = age < 19 ? "Canterano" : age < 25 ? "Ascenso" : age < 29 ? "Pico" : "Veterano";

  // Categoría: ~40% vida, ~60% fútbol
  const lifeChance = Math.random();
  const category: EventCategory = lifeChance < 0.4
    ? (["vida"] as const)[0] // 40% vida real
    : (["entrenamiento", "partido", "vestuario", "representante", "prensa", "especial"] as const)[
        Math.floor(Math.random() * 6)
      ]; // 60% fútbol

  console.log(`[generateNextEventDynamic] Generating for ${player.last_name}, age ${age} (${stage}), category: ${category}`);

  const historyText = history.length
    ? history
        .map(
          (h) =>
            `- "${h.title}" → eligió: "${h.chosen}"` +

            (h.freeText ? ` — y escribió: "${h.freeText}"` : ""),
        )
        .join("\n")
    : "(todavía no vivió ningún evento)";

  // Context de posición para eventos futbolísticos
  let positionContext = "";
  if (category !== "vida") {
    switch (player.position) {
      case "Delantero":
        positionContext =
          "Este jugador es DELANTERO — énfasis en goles, Pichichi, jugadas individuales, presión de anotar, referencias a hat-tricks o momentos clave del área.";
        break;
      case "Centrocampista":
        positionContext =
          "Este jugador es CENTROCAMPISTA — énfasis en control del medio, pases clave, visión de juego, defensa/ataque, liderazgo del juego.";
        break;
      case "Defensa":
        positionContext =
          "Este jugador es DEFENSA — énfasis en duelos, robos, liderazgo defensivo, tarjetas, decisiones de riesgo en el área.";
        break;
      case "Portero":
        positionContext =
          "Este jugador es PORTERO — énfasis en penaltis, atajadas, distribución de balón, liderazgo de área, decisiones bajo presión.";
        break;
    }
  }

  // Obtén el contexto del calendario (época de la temporada)
  const seasonContext = getSeasonContext(player.week, player.nation);
  const tournamentNote = seasonContext.hasMajorTournament
    ? `\n⭐ CONTEXTO ESPECIAL: ${formatTournamentContext(seasonContext.majorTournament)}`
    : "";

  // Obtén el contexto de carrera y oportunidades narrativas
  const careerContext = getCareerContext(player);
  const clubOpportunity = shouldHaveClubOpportunity(player);
  const lifeEvent = shouldSuggestLifeEvent(player);

  const clubContext =
    clubOpportunity.club && Math.random() < 0.4 // Solo 40% de chance de incluir en prompt
      ? `⚠️ OPORTUNIDAD DE FICHAJE: ${clubOpportunity.club} — ${clubOpportunity.reason}`
      : "";

  const lifeEventContext =
    lifeEvent.suggestion && Math.random() < 0.3 // Solo 30% de chance de incluir
      ? `💝 OPORTUNIDAD NARRATIVA: ${lifeEvent.context}`
      : "";

  const narrativeHints = generateNarrativeHints(player);

  const prompt = `Eres el director narrativo de "Beyond 90", simulador de carrera de futbolista.
Genera el PRÓXIMO evento ÚNICO para este jugador. **NUNCA repitas la premisa de los últimos eventos.**

💡 PISTAS NARRATIVAS PARA VARIEDAD:
${narrativeHints}

JUGADOR:
- Apellido: ${player.last_name}
- Nacionalidad: ${player.nation}
- Edad: ${age} años (ETAPA: ${stage})
- Club: ${player.club}
- Posición: ${player.position}
- Personalidad: ${player.personality}
- Representante: ${player.agent_name ?? "sin definir"}
- Forma: ${player.forma}/100, Moral: ${player.moral}/100, Fama: ${player.fama}/100, Media: ${player.media}/99
- Patrimonio: ${player.patrimonio} €

SU VIDA PERSONAL (ya existe — úsala):
${describePersonalLife(player.flags)}

ÚLTIMOS EVENTOS (no repitas estos temas):
${historyText}

CONTEXTO DE CARRERA:
- Tipo: ${careerContext.stage.toUpperCase()}
- ${careerContext.description}
- Focos narrativos típicos: ${careerContext.eventFocus.join(", ")}
${clubContext ? `\n${clubContext}` : ""}
${lifeEventContext ? `\n${lifeEventContext}` : ""}

CONTEXTO TEMPORAL:
- Período de temporada: ${seasonContext.period.toUpperCase()} (${seasonContext.monthApprox})
- ${seasonContext.description}${tournamentNote}

TIPO DE EVENTO AHORA: ${category === "vida" ? "VIDA REAL (fiestas, pareja, familia, dinero, vacaciones)" : `FUTBOLÍSTICO en categoría "${category}"`}
${positionContext}

RESTRICCIONES POR ESTADO DEL JUGADOR:
${
  player.fama < 25
    ? "⚠️ FAMA MUY BAJA (${player.fama}/100) — NO generes eventos donde celebridades/influencers lo mencionan. Solo eventos sobre su vida personal y carrera local. Las celebridades NUNCA saben quién es."
    : player.fama < 50
      ? "Fama media (${player.fama}/100) — Puede haber algo en prensa local/regional, pero NO celebridades internacionales ni influencers aún."
      : "Fama alta (${player.fama}/100) — Puede haber celebridades, influencers, redes sociales. Genera eventos donde otros lo reconocen."
}

CONTEXTO DE EDAD/ETAPA (${stage}):
${
  stage === "Canterano"
    ? "Joven sin experiencia. Pretemporada: entrenamientos duros, rivalidad con otros canteranos, descubrimiento por agentes. Fiestas con compañeros, primeras novias, padres presionan, amigos de barrio, competencia interna, cedencias."
    : stage === "Ascenso"
      ? "Ganando experiencia. Pretemporada: entrenamientos de verdad, rivales nuevos, competencia por titularidad. Primeros goles/éxitos, lesiones leves, selección sub-21, presión aumenta, pareja importante, transferencia a club mayor."
      : stage === "Pico"
        ? "Eres una estrella. Pretemporada: presión de ser figura, rivalidades en el equipo, preparación para Champions. Champions, fichaje a club gigante, boda, hijo, portadas, oferta Arabia, presión mediática, lesiones serias."
        : "Veterano. Pretemporada: compitiendo con jóvenes por minutos, últimas oportunidades. Últimas oportunidades, mentoring joven, lesiones cuestionan futuro, divorcio posible, hijo adulto, retiro cerca, nostalgia."
}

REGLAS CRÍTICAS:
${COMMON_RULES}
- **OBLIGATORIO: NUNCA REPITAS PREMISA EXACTA**: Mira los títulos en "ÚLTIMOS EVENTOS". Si ves:
  * "Presión del entrenador" → NO hagas otra escena de "entrenador presiona"
  * "Pareja te reclama tiempo" + "Momento con pareja" → NO repitas pareja
  * "Un cantante te menciona" + cualquier celebridad → NO generes otra celebridad mencionándote
  * "Lesión leve en el tobillo" → NO hagas otra lesión sin importar qué parte del cuerpo

- Esta ES su historia real, no una plantilla. Si ya tiene pareja/hijos/títulos (mira "SU VIDA PERSONAL"), tráelos PERO como parte de una NUEVA premisa, no repetida.
- Si es evento futbolístico: incluye contexto de su posición específica (${player.position}).
- Si es evento de vida: incluye dilemas reales (carrera vs. familia, gastar vs. ahorrar, diversión vs. enfoque).
- Las decisiones deben tener consecuencias que se recuerden más adelante (si ignora a un amigo ahora, reaparece resentido luego).
- PERSONAJES SECUNDARIOS: De vez en cuando (10-15% de eventos), menciona personas del pasado del jugador: amigos de infancia, rivales de cantera, entrenadores viejos, expartejas, compañeros de primeros años. Son formas naturales de anclar la carrera en momentos emocionales (un amigo se casa, un rival lo felicita en redes, un entrenador viejo lo ve en TV). Inventa nombres realistas y hazlos reales — estos personajes pueden reaparece años después.
- is_milestone en true SOLO si es visualmente memorable (1 de cada 4-5 eventos). Si true, image_scene en inglés describiendo una escena que ALGUIEN QUERRÍA COMPARTIR EN REDES.
- Nunca repitas ni referencias genéricas — nombres específicos, situaciones concretas.
- image_scene DEBE SER VISUAL Y ESPECÍFICO: incluir pose, expresión facial, ropa exacta (camiseta, marca), contexto preciso (dónde exactamente), LUZ CLARA (nunca oscura: evitar "dim", "dark", "red", "shadows"; usar "bright", "daylight", "golden hour", "stadium lights", "natural light"), otros personajes con roles (no genéricos), detalles que hacen memorable (balón, trofeo, camiseta nueva, bandera, estadio lleno, etc). IMPORTANTE: specificar colores alegres/vibrantes (verde del campo, dorado del trofeo, blanco de camiseta, azul cielo). Ejemplo: NO "player signing contract" SÍ "young player in white Real Madrid kit smiling brightly while firmly shaking hands with club director in team's bright marble executive office with official club crest on wall, natural daylight from large windows, sunlit happy expression".

IMPORTANTE - EMOCIÓN Y COMPARTIBILIDAD:
- DE VEZ EN CUANDO (10% de eventos): genera una escena GRACIOSA o ABSURDA (ej. se queda dormido en una conferencia de prensa, el árbitro confunde nombres, una anécdota rara en el hotel, su mascotas hace algo inesperado durante un evento, un entrenador dice algo ridículo).
- Las mejores escenas son las que hacen SENTIR: rabia, risa, esperanza, tristeza, sorpresa. Busca emoción pura, no descripciones técnicas.
- Si es momento importante (fichaje, gol decisivo, boda, primer hijo, Balón de Oro, retiro, nominación a premios, muerte familiar), ESCENA VISUAL Y MEMORABLE que merezca foto. Marca is_milestone TRUE.
- Los dilemas tienen que tener PESO y opciones REALES: ¿Dejo a mi pareja por ir a Arabia? ¿Me retiro honorable o juego con lesión? ¿Pongo la carrera o la familia primero? ¿Dinero seguro vs. gloria? No plantees elecciones planas — cada opción tiene consecuencias vívidas.
- EL AGENTE/REPRESENTANTE: A veces aparece dando consejo o presentando opciones (oportunidades de fichaje, ofertas, dilemas). PERO a veces NO aparece — tomas decisiones por tu cuenta (con pareja, familia, o iniciativa propia) sin consultarle. Que sea natural: no todas las decisiones requieren agente.
- VARIACIÓN Y RIQUEZA: nunca repitas situaciones. Si fue "gol en minuto 90", la próxima escena de gol debe ser muy distinta (hat-trick, asistencia clave, gol tras regate imposible, gol en final, gol tras lesión recuperada). Cada momento debe sentirse ÚNICO e IRREPETIBLE en esa carrera.

- ESTRUCTURA VARIADA: Alterna entre:
  * Momentos donde ÉL toma decisiones (oportunidad, presión externa)
  * Momentos donde OTROS lo presionan (pareja, entrenador, representante)
  * Momentos sobre CONSECUENCIAS (amigo reaparece, promesa se cumple/falla)`;

  const result = await callEventTool(prompt, category, "dynamic");
  if (result) {
    console.log(`[generateNextEventDynamic] FINAL: Generated event "${result.title}" for ${player.last_name}`);
  } else {
    console.error(`[generateNextEventDynamic] FINAL: Event generation FAILED for ${player.last_name}, returning null`);
  }
  return result;
}

export async function generateAiEvent(
  player: Player,
  history: HistoryItem[],
): Promise<GameEvent | null> {
  const category = pickCategory();
  const age = playerAge(player.week);

  const historyText = history.length
    ? history
        .map(
          (h) =>
            `- "${h.title}" → eligió: "${h.chosen}"` +
            (h.freeText ? ` — y escribió con sus propias palabras: "${h.freeText}"` : ""),
        )
        .join("\n")
    : "(todavía no vivió ningún evento)";

  // Obtén contexto completo para la narración
  const seasonContext = getSeasonContext(player.week, player.nation);
  const tournamentNote = seasonContext.hasMajorTournament
    ? `\n⭐ CONTEXTO ESPECIAL: ${formatTournamentContext(seasonContext.majorTournament)}`
    : "";

  const careerContext = getCareerContext(player);
  const clubOpportunity = shouldHaveClubOpportunity(player);
  const lifeEvent = shouldSuggestLifeEvent(player);

  const clubContext =
    clubOpportunity.club && Math.random() < 0.4
      ? `⚠️ OPORTUNIDAD PROBABLE: ${clubOpportunity.club} — ${clubOpportunity.reason}`
      : "";

  const lifeEventContext =
    lifeEvent.suggestion && Math.random() < 0.3
      ? `💝 NARRATIVA PERSONAL: ${lifeEvent.context}`
      : "";

  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera el PRÓXIMO evento de la carrera para este jugador. Categoría de este evento: ${category}.

JUGADOR:
- Apellido: ${player.last_name}
- Nacionalidad: ${player.nation}
- Edad: ${age} años
- Club actual: ${player.club}
- Posición: ${player.position}
- Personalidad: ${player.personality}
- Representante: ${player.agent_name ?? "sin definir"}
- Forma: ${player.forma}/100, Moral: ${player.moral}/100, Fama: ${player.fama}/100
- Media futbolística: ${player.media}/99
- Patrimonio: ${player.patrimonio} €
- Relación con el entrenador: ${player.rel_entrenador}/100, con el vestuario: ${player.rel_vestuario}/100, con la afición: ${player.rel_aficion}/100, con el representante: ${player.rel_representante}/100

SU VIDA PERSONAL HASTA AHORA (esto ya pasó de verdad en su historia — no lo ignores ni inventes uno nuevo si ya existe):
${describePersonalLife(player.flags)}

ÚLTIMOS EVENTOS DE SU CARRERA (no repitas el tema ni la premisa):
${historyText}

CONTEXTO DE CARRERA:
- Tipo: ${careerContext.stage.toUpperCase()}
- ${careerContext.description}
- Eventos típicos: ${careerContext.eventFocus.join(", ")}
${clubContext ? `\n${clubContext}` : ""}
${lifeEventContext ? `\n${lifeEventContext}` : ""}

CONTEXTO TEMPORAL:
- Período de temporada: ${seasonContext.period.toUpperCase()} (${seasonContext.monthApprox})
- ${seasonContext.description}${tournamentNote}

REGLAS:
${COMMON_RULES}
- El evento tiene que encajar con el club, la edad, la posición y el momento actual del jugador — nada genérico que podría pasar en cualquier carrera. Si tiene solo ${age} años y acaba de llegar a un club modesto, no debería sonar a superestrella todavía.
- OBLIGATORIO: esta es SU historia concreta, no una plantilla. Si ya tiene pareja, hijos o títulos ganados (mira "SU VIDA PERSONAL HASTA AHORA"), tráelos a la escena cuando tenga sentido en vez de inventar personajes nuevos sin conexión — que su pareja aparezca por su nombre, que un hijo ya nacido condicione una decisión, que un título ganado se lo recuerden en la calle. Si no tiene todavía ningún hilo personal, es buen momento para que empiece uno (pero no en cada turno).
- Si el evento trata sobre la selección nacional, la familia en su país de origen, o cualquier tema ligado a su nacionalidad, usa SIEMPRE ${player.nation} (nunca asumas España si no es esa la nacionalidad del jugador). El idioma de la narración sigue siendo castellano de España en cualquier caso.
- Si la escena trata sobre su rendimiento como jugador (se queda en el banquillo, discute con el entrenador por minutos, destaca en un entrenamiento, etc.), incluye un cambio de media coherente: banquillo prolongado o mal rendimiento → media hacia abajo; destacar de verdad → media hacia arriba. Si la escena no tiene que ver con el rendimiento futbolístico, no toques la media.
- Si el evento amerita una respuesta propia del jugador (algo que él mismo diría en una entrevista o discusión), marca allow_free_text en true y escribe free_text_prompt.
- Si en "ÚLTIMOS EVENTOS" alguna entrada incluye algo que el jugador escribió con sus propias palabras, es texto real suyo, no una opción de una lista — léelo de verdad y, cuando encaje, haz que tenga eco más adelante (alguien le repite lo que dijo, una promesa que hizo se le vuelve en contra o a favor, una idea suya que mencionó reaparece). No lo repitas literalmente ni lo cites entre comillas, solo dale continuidad.
- OBLIGATORIO también con las decisiones normales (no solo lo escrito a mano libre): mira qué eligió en "ÚLTIMOS EVENTOS" y, de vez en cuando (no siempre, pero sí con regularidad), haz que una elección pasada tenga una consecuencia real más adelante — si pasó de un canterano que le pedía consejo, ese chaval puede reaparecer ya asentado o resentido; si ignoró a alguien que le escribió, puede notarse la distancia después; si le faltó al respeto a un entrenador o a un compañero, esa relación puede tensarse en una escena futura sin que se lo esperara. Las decisiones de este jugador tienen que pesar, no ser anecdóticas.
- "ÚLTIMOS EVENTOS" solo cubre los últimos turnos: para vínculos que deben recordarse mucho más adelante (pasada ya esa ventana), usa memorable_thread cuando esta escena presente o resuelva algo así (un personaje nuevo con nombre, una promesa, un rencor). Y revisa siempre "SU VIDA PERSONAL HASTA AHORA": ahí aparecerán esos hilos antiguos aunque ya no salgan en el historial reciente — tráelos de vuelta cuando encajen, igual que con la pareja o los hijos.
- No repitas la premisa de ningún evento del historial reciente.
- Marca is_milestone en true SOLO si esta escena es visualmente memorable y merece una FOTO PARA REDES (un momento que alguien querría screenshot y compartir). Esto debería ser 1 de cada 4-5 eventos. El resto, is_milestone en false.
- Cuando is_milestone sea true, escribe image_scene: descripción INGLÉS fotorrealista para recrear desde foto real del jugador. OBLIGATORIO incluir: (1) pose específica (shaking hands, arms raised, holding something, embracing, sitting, etc), (2) expresión facial exacta (joy, determination, concern, pride, etc), (3) ropa/vestuario específico, (4) luz (morning light, sunset, stadium lights, etc), (5) contexto visual (office, stadium, field, church, etc), (6) otros personajes con roles (club director, coach, family, teammates), (7) detalles emocionales que hacen memorable (trofeo, camiseta, balón, uniformes). Ejemplo BUENO: "young player in white home kit shaking hands firmly with club director in marble executive office, official club crest on wall, warm morning sunlight through window, focused determined expression, proud moment". Ejemplo MALO: "player signing contract".

MEMORABILIDAD Y REDES SOCIALES:
- DE VEZ EN CUANDO (10% eventos): genera una escena DIVERTIDA O ABSURDA que haga reír (se duerme en conferencia, árbitro confunde nombres, mascota interfiere en evento, entrenador dice algo ridículo, anécdota rara del viaje, momentos "WTF" pero reales en fútbol).
- Los mejores momentos generan EMOCIÓN PURA: rabia, risa, esperanza, nostalgia, sorpresa. No redacción técnica sin alma.
- Los dilemas TIENEN QUE DOLER: ¿Dejo pareja por Arabia? ¿Juego con lesión? ¿Carrera o familia? ¿Traicion o lealtad? Decisiones que el jugador va a recordar.
- Milestone = momento que el jugador querría congelar y compartir. No es solo "consigo gol", es "gol de taquicardias en el derbi en el minuto 93".`;

  return callEventTool(prompt, category, "ai");
}

/**
 * Escena de firma de contrato: se dispara automáticamente cada vez que el
 * jugador cambia de club (fichaje inicial o cualquier traspaso). Reúne al
 * míster, el presidente y el representante para cerrar los términos.
 */
/**
 * El modelo tiende a "convergir" siempre en la misma cifra (900€/mes en
 * casi cualquier contrato de debut) si se le deja elegir el número él
 * mismo. Para que el sueldo varíe de verdad de una carrera a otra, se
 * sortea en código y se le pasa como dato obligatorio, no como sugerencia.
 */
function randomSalaryFigure(isFirstSigning: boolean, fama: number): string {
  if (isFirstSigning) {
    const monthly = Math.round((600 + Math.random() * 1900) / 50) * 50;
    return `${monthly.toLocaleString("es")} € al mes`;
  }
  const base = 12000 + fama * 300 + Math.random() * 35000;
  const weekly = Math.round(base / 500) * 500;
  return `${weekly.toLocaleString("es")} € a la semana`;
}

export async function generateContractEvent(
  player: Player,
  club: string,
  isFirstSigning: boolean,
): Promise<GameEvent | null> {
  const age = playerAge(player.week);
  const agent = player.agent_name ?? "tu representante";
  const salaryFigure = randomSalaryFigure(isFirstSigning, player.fama);

  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
El jugador acaba de fichar por un nuevo club. Genera la escena de la firma del contrato: se sienta con el entrenador, el presidente del club y ${agent} para cerrar los términos.

JUGADOR:
- Apellido: ${player.last_name}
- Nacionalidad: ${player.nation}
- Edad: ${age} años
- Club nuevo: ${club}
- Posición: ${player.position}
- Personalidad: ${player.personality}
- Representante: ${agent}
- Patrimonio actual: ${player.patrimonio} €
- Fama: ${player.fama}/100
- ¿Es su primer contrato profesional?: ${isFirstSigning ? "Sí, viene de la cantera/amateur, es su debut" : "No, ya es profesional y viene de otro club"}

SU VIDA PERSONAL HASTA AHORA:
${describePersonalLife(player.flags)}

REGLAS:
${COMMON_RULES}
- OBLIGATORIO: el salario ya está decidido, usa EXACTAMENTE esta cifra en la descripción, sin cambiarla ni redondearla de otra forma: "${salaryFigure}". Sobre los minutos, no siempre tiene que haber una promesa concreta — a veces el club directamente NO garantiza nada ("tendrás que ganarte el puesto", "sin promesas de minutos") y eso también es válido y realista; no fuerces una cifra de minutos si no encaja con la escena.
- Las opciones son sobre cómo negociar o reaccionar en la firma (aceptar tal cual, pedir más minutos garantizados, pedir una cláusula, dejar que ${agent} lleve la voz cantante, etc.), no sobre elegir otro club.
- Si ya tiene pareja o hijos y no es su primer contrato (implica mudanza de ciudad o de país), puede mencionarse de pasada cómo afecta el cambio a su vida fuera del campo — no en cada fichaje, pero sí cuando aporte algo.
- Al menos una opción debe modificar el patrimonio (prima de fichaje, o coste de contratar un abogado, etc.) con una cifra distinta a la del salario.`;

  const event = await callEventTool(prompt, "representante", isFirstSigning ? "contrato-debut" : "contrato");

  // Marcar como milestone: la firma del contrato es un momento visual y memorable
  if (event) {
    const imageScene = enhanceImagePrompt(
      `${age}-year-old footballer in formal corporate boardroom shaking hands firmly with club director in business suit, ${agent} visible watching in background, official contract on polished wooden table, team crest on wall, professional photography, warm office lighting from windows, genuine determined expression, proud moment, shareable social media moment`,
      "firma"
    );
    return {
      ...event,
      isMilestone: true,
      milestoneType: "contrato",
      imageScene,
    };
  }

  return null;
}

/**
 * Ficha de un partido jugado: rival, competición, marcador final y el
 * rendimiento personal del jugador (minutos, nota, goles, asistencias),
 * con una decisión corta sobre cómo reaccionar al resultado. Sustituye a
 * las escenas de partido genéricas por algo con datos reales.
 */
export async function generateMatchResult(
  player: Player,
  history: HistoryItem[],
): Promise<GameEvent | null> {
  const age = playerAge(player.week);

  const historyText = history.length
    ? history.map((h) => `- "${h.title}" → eligió: "${h.chosen}"`).join("\n")
    : "(todavía no vivió ningún evento)";

  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera la ficha de un partido que el jugador acaba de disputar con su club: un rival (puede ser un club real de la misma liga/nivel, o de una competición europea si corresponde), el marcador final y su rendimiento personal.

JUGADOR:
- Apellido: ${player.last_name}
- Nacionalidad: ${player.nation}
- Edad: ${age} años
- Club: ${player.club}
- Posición: ${player.position}
- Forma: ${player.forma}/100, Moral: ${player.moral}/100, Fama: ${player.fama}/100
- Media futbolística: ${player.media}/99
- Relación con el entrenador: ${player.rel_entrenador}/100

ÚLTIMOS EVENTOS (no repitas rival ni marcador si ya salieron):
${historyText}

REGLAS:
${COMMON_RULES}
- OBLIGATORIO en la descripción: nombre del rival, competición, marcador final (ej. "2-1"), y la línea personal del jugador con cifras concretas: minutos jugados, nota del partido (escala 0-10, con un decimal, ej. "7.4"), goles y asistencias. Todo en 3-4 frases, como una crónica corta, no una lista.
- OBLIGATORIO: rellena también rival_club con el nombre corto del club rival, exactamente igual a como aparece en la descripción (ej. "Villarreal CF"), para poder mostrar su escudo.
- El resultado y el rendimiento tienen que ser coherentes con la forma (${player.forma}/100) y con si es titular habitual o no — no siempre gana el equipo, no siempre juega bien, a veces ni siquiera suma minutos relevantes.
- OBLIGATORIO: cada opción debe incluir un cambio de media coherente con el rendimiento narrado en la descripción (no con la reacción elegida). Nota alta (8+) o gol/asistencia decisiva → media +2 a +5. Nota floja (por debajo de 6) o pocos/ningún minuto → media -1 a -3. Partido discreto sin nada destacable → sin cambio o un +1 simbólico. Esta media debe ser la MISMA en todas las opciones del evento, porque el partido ya pasó y no depende de cómo reacciones.
- Las opciones son sobre cómo reaccionar al resultado (declaraciones, actitud en el vestuario, redes sociales), no sobre el partido en sí (eso ya pasó).
- Marca is_milestone en true si el partido fue especialmente bueno, malo o decisivo, y en ese caso escribe image_scene (en inglés, fotorrealista) mostrando al jugador celebrando o reaccionando en el campo con el estadio de fondo.`;

  return callEventTool(prompt, "partido", "partido");
}

/**
 * Los beats de arranque de carrera (elegir representante, primeras ofertas,
 * pretemporada) antes vivían como texto 100% fijo. Se generan con IA para
 * que cada carrera nueva se sienta distinta de verdad — pero el "id" se
 * fuerza siempre al mismo valor estable, porque el resto del código
 * (actions.ts, la lógica de no gastar semanas en el arranque) depende de
 * comparar ese id exacto.
 */
export async function generateEleccionRepresentanteEvent(): Promise<GameEvent | null> {
  const agent = STARTING_AGENTS[Math.floor(Math.random() * STARTING_AGENTS.length)];

  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera la escena de apertura de toda la carrera: el jugador tiene 16 años y tiene que decidir quién va a negociar los contratos en su nombre a partir de ahora. Es su primera gran decisión fuera del campo.

REGLAS:
${COMMON_RULES}
- Debe haber EXACTAMENTE 2 opciones, en este orden:
  1. Que su padre lleve las negociaciones (confianza total, pero sin experiencia en el mundo del fútbol).
  2. Firmar con ${agent.name}, ${agent.article} en la cantera: ${agent.pitch}. Usa este nombre EXACTO, no lo cambies ni inventes otro.
- Ninguna de las dos opciones debe mover el patrimonio en las consecuencias (eso ya está decidido aparte); solo ánimo y, como mucho, relación con el representante.
- Ambienta la escena de forma distinta cada vez (una charla en la cocina, una llamada, camino del entrenamiento...) — que no suene siempre igual.`;

  const event = await callEventTool(prompt, "representante", "eleccion-representante");
  if (!event || event.options.length < 2) return null;

  return {
    ...event,
    id: "eleccion-representante",
    options: [
      {
        ...event.options[0],
        consequences: { ...event.options[0].consequences, patrimonio: undefined, agent_name: "Tu padre" },
      },
      {
        ...event.options[1],
        consequences: { ...event.options[1].consequences, agent_name: agent.name, patrimonio: -agent.fee },
      },
    ],
  };
}

export async function generateClubOffersEvent(agentName: string): Promise<GameEvent | null> {
  const clubs = pickStartingClubOffers();
  const hasGiant = clubs.some((c) => c.club === "Real Madrid" || c.club === "FC Barcelona");

  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
${agentName} se reúne con el jugador (16 años, recién salido de la cantera) para presentarle sus primeras ofertas profesionales.${
    hasGiant
      ? " Esta vez hay una sorpresa entre las opciones: uno de los clubes es un auténtico gigante (Real Madrid o FC Barcelona) que se ha fijado en él para su cantera — un golpe de suerte enorme, algo que casi nunca pasa. Los otros dos siguen siendo clubes modestos, puertas de entrada normales."
      : " Tres clubes modestos, ninguno un gigante, pero cada uno una puerta de entrada distinta."
  }

Los tres clubes, EN ESTE ORDEN EXACTO, son: ${clubs.map((c) => c.club).join(", ")}. Usa estos nombres tal cual, no los cambies ni añadas otros ni cambies el orden.

REGLAS:
${COMMON_RULES}
- Debe haber EXACTAMENTE 3 opciones, una por cada club en el orden dado, con una etiqueta tipo "Firmar por el/la [club]" y un subtítulo que venda ese club con una razón distinta cada vez (afición, proyecto, presión, minutos, historia del club...).${
    hasGiant
      ? ' Para el club grande, el subtítulo y la descripción deben transmitir que es una oportunidad excepcional y también más presión ("cantera brutal", "hay que demostrar mucho más").'
      : ""
  }
- Las consecuencias de las 3 opciones deben tocar solo ánimo, nada de patrimonio ni fama todavía.
- Ambienta la escena de forma distinta cada vez (una cafetería, una videollamada, el salón de casa...) — que no suene siempre igual.`;

  const event = await callEventTool(prompt, "representante", "inicio-fichaje-agente");
  if (!event || event.options.length < 3) return null;

  return {
    ...event,
    id: "inicio-fichaje-agente",
    isMilestone: true,
    milestoneType: "debut",
    options: event.options.slice(0, 3).map((option, i) => ({
      ...option,
      id: clubs[i].club,
      consequences: { ...option.consequences, club: clubs[i].club },
    })),
  };
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Cada hueco de la secuencia garantizada de pretemporada tiene un banco de
 * temas posibles en vez de uno solo fijo: si no se sortea, cada carrera
 * nueva vive literalmente la misma escena en el mismo orden (agobio en el
 * primer entrenamiento, lesión leve con el fisio, mensaje del pasado),
 * solo con los nombres cambiados — que es justo lo que se siente repetido.
 */
const DEBUT_PRETEMP1_THEMES = [
  "el primer entrenamiento del jugador con el primer equipo, recién fichado a los 16 años, todavía sin ganarse un sitio entre los mayores, sintiendo que el ritmo es muchísimo más alto de lo que esperaba",
  "la presentación oficial del jugador ante los medios del club, nervioso, sin saber muy bien qué se espera de él en su primera rueda de prensa",
  "el primer día en el vestuario del primer equipo, donde un par de veteranos le hacen una novatada o una broma pesada para ver cómo reacciona",
  "una charla táctica del entrenador el primer día, donde queda claro en voz alta que todavía no cuenta para nada y tiene que ganarse cada minuto",
  "el momento de recibir la equipación oficial del club con su nombre en la espalda por primera vez, algo que debería ser un sueño cumplido pero que se mezcla con los nervios de no estar a la altura",
];

const DEBUT_PRETEMP2_THEMES = [
  "un contratiempo físico leve (una molestia, una sobrecarga, nada grave) que hace que conozca al fisio o preparador físico del club, que le atiende",
  "un roce o choque de caracteres con un veterano de la plantilla que no se toma bien que un chaval de 16 años ya esté entrenando con el primer equipo",
  "una decisión del cuerpo técnico de hacerle jugar fuera de su posición habitual durante la pretemporada, para probar su versatilidad",
  "la primera vez que se queda claramente el último en un ejercicio físico de pretemporada, delante de toda la plantilla",
  "una llamada de su representante contándole que el club ya está recibiendo preguntas de la prensa sobre él, antes de haber debutado siquiera",
];

const DEBUT_PRETEMP3_THEMES = [
  "recibe un mensaje inesperado de alguien de su vida de antes del fútbol (un amigo de la infancia, un profesor, un excompañero de instituto, un antiguo entrenador de la cantera, una expareja...) reaccionando a la noticia de que ha fichado",
  "un periodista local, del pueblo o barrio donde creció, le pide una entrevista corta para el periódico de la zona, orgulloso de que uno de los suyos haya llegado tan lejos",
  "se cruza sin buscarlo con un excompañero de la cantera que se quedó fuera del fútbol profesional, y la conversación se vuelve más incómoda de lo esperado",
  "su familia organiza una pequeña celebración por la firma, y alguien de la familia dice, sin mala intención, algo que le toca la fibra",
];

export async function generateDebutPretemp1(club: string): Promise<GameEvent | null> {
  const theme = pickOne(DEBUT_PRETEMP1_THEMES);
  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera esta escena de pretemporada en el ${club}: ${theme}.

REGLAS:
${COMMON_RULES}
- 2 opciones sobre cómo afrontar la escena, coherentes con el tema descrito arriba.
- Marca allow_free_text en true con una pregunta corta que te hace un veterano o el cuerpo técnico.
- No marques is_milestone.`;

  const event = await callEventTool(prompt, "entrenamiento", "debut-pretemp-1");
  return event ? { ...event, id: "debut-pretemp-1" } : null;
}

export async function generateDebutPretemp2(club: string): Promise<GameEvent | null> {
  const theme = pickOne(DEBUT_PRETEMP2_THEMES);
  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera esta escena de pretemporada en el ${club}, pocos días después del fichaje: ${theme}.

REGLAS:
${COMMON_RULES}
- 2 opciones sobre cómo afrontar la escena, coherentes con el tema descrito arriba.
- Marca is_milestone en true (es un momento memorable de la pretemporada) y escribe image_scene.`;

  const event = await callEventTool(prompt, "entrenamiento", "debut-pretemp-2");
  if (!event) return null;

  // Mejorar image_scene si es necesario: debe ser visual, específico, compartible
  if (event.imageScene) {
    event.imageScene = enhanceImagePrompt(event.imageScene, theme);
  }

  return { ...event, id: "debut-pretemp-2", isMilestone: true, milestoneType: "lesion_debut" };
}

export async function generateDebutPretemp3(): Promise<GameEvent | null> {
  const theme = pickOne(DEBUT_PRETEMP3_THEMES);
  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera esta escena en plena pretemporada tras fichar como profesional: el jugador ${theme}.

REGLAS:
${COMMON_RULES}
- 2 o 3 opciones sobre cómo responder o reaccionar.
- Marca allow_free_text en true con la pregunta "¿Qué le respondes?" o similar.
- No marques is_milestone.`;

  const event = await callEventTool(prompt, "vida", "debut-pretemp-3");
  return event ? { ...event, id: "debut-pretemp-3" } : null;
}

const PRESEASON_THEMES = [
  "se encuentra con ex compañeros de sus años en la cantera y uno le cuenta cómo le va en otro club",
  "el cuerpo técnico lo reta a competir por la titularidad con un refuerzo que acaba de fichar",
  "vuelve a trabajar en el estadio después del descanso y siente la adrenalina del regreso",
  "tiene una lesión menor en pretemporada que lo hace cuestionarse si está al 100%",
  "el vestuario ha cambiado mucho: nuevas caras, nuevos liderazgos, tiene que encontrar su lugar",
  "gana un amistoso de forma destacada y el entrenador le da un voto de confianza directo",
  "sufre un enfrentamiento físico en un entrenamiento táctico que refleja la tensión del verano",
  "la pareja o la familia cuestionan el nivel de dedicación que requiere la pretemporada",
  "negocia una renovación de contrato antes de que arranque la temporada oficial",
];

export async function generatePreseasoneEvent(
  player: Player,
  season: number,
  history: HistoryItem[],
): Promise<GameEvent | null> {
  const theme = pickOne(PRESEASON_THEMES);
  const historyText = history.length
    ? history
        .slice(-5)
        .map(
          (h) =>
            `- "${h.title}" → eligió: "${h.chosen}"` +
            (h.freeText ? ` — y escribió: "${h.freeText}"` : ""),
        )
        .join("\n")
    : "(últimos eventos de su carrera)";

  const seasonContext = getSeasonContext(player.week, player.nation);
  const tournamentNote = seasonContext.hasMajorTournament
    ? `\n⭐ CONTEXTO ESPECIAL: ${formatTournamentContext(seasonContext.majorTournament)}`
    : "";

  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera una escena de PRETEMPORADA para esta temporada (verano de ${2026 + season}). La escena es: ${theme}.

JUGADOR:
- Apellido: ${player.last_name}
- Edad: ${playerAge(player.week)} años
- Club: ${player.club}
- Posición: ${player.position}
- Personalidad: ${player.personality}
- Media: ${player.media}/99, Moral: ${player.moral}/100

ÚLTIMOS EVENTOS:
${historyText}

CONTEXTO TEMPORAL:
- Período de temporada: ${seasonContext.period.toUpperCase()} (${seasonContext.monthApprox})
- ${seasonContext.description}${tournamentNote}

INSTRUCCIONES:
- Escena de PRETEMPORADA: entrenamientos, amistosos, adaptación a nuevos compañeros, presión del verano.
- Debe ser un momento visual/memorable (es decir, marca is_milestone en true).
- 2 opciones sobre cómo afrontar este momento de pretemporada.
- Escribe image_scene en inglés describiendo la escena (estadio, vestuario, o área de entrenamientos).
- allow_free_text: true con una pregunta corta.
- Haz que refleje la etapa de su carrera: a mayor media/fama, más presión; a menor, más competencia por hacerse un hueco.`;

  const event = await callEventTool(prompt, "entrenamiento", `preseason-${season}`);
  return event
    ? {
        ...event,
        id: `preseason-${season}`,
        isMilestone: true,
        milestoneType: "pretemporada",
      }
    : null;
}

const SECOND_LIFE_CONTEXT: Record<SecondCareerRole, string> = {
  entrenador: "dirige un equipo desde el banquillo: decisiones tácticas, vestuario, presión de la directiva por resultados",
  agente: "representa a jugadores: negociaciones, comisiones, clientes que van y vienen, presión mediática",
  presidente: "gestiona un club entero: fichajes, presupuesto, socios, presión institucional",
};

const SECOND_LIFE_STYLE: Record<SecondCareerRole, string> = {
  entrenador:
    "Con el tiempo, inclina la carrera hacia banquillos de peso: Champions League, presión de ganarlo todo, plantillas con egos grandes, nada de fútbol modesto una vez consolidado.",
  agente:
    "Los clientes más memorables son perlas de cantera (de cualquier gran academia española) que están a punto de explotar, o antiguos compañeros de vestuario del propio personaje que ahora confían en él para dar el salto. Dales nombre y contexto propio, nunca genéricos.",
  presidente:
    "Inspírate libremente (sin nombrarlos ni citarlos) en arquetipos reales de presidentes históricos: el que ficha galácticos cada verano sea cual sea la necesidad táctica, el dueño con fortuna personal que financia gastos sin límite a cambio de control, el candidato carismático que gana una asamblea de socios con promesas ambiciosas. Usa esos arquetipos como inspiración de tono, no como personajes reales.",
};

/**
 * Eventos de la "segunda vida" (después de retirarse como jugador): igual
 * que el resto de la carrera, se generan con IA para que no sea siempre el
 * mismo puñado de escenas fijas, con el pool escrito a mano como reserva.
 */
export async function generateSecondLifeEvent(
  player: Player,
  role: SecondCareerRole,
  history: HistoryItem[],
): Promise<GameEvent | null> {
  const historyText = history.length
    ? history
        .map(
          (h) =>
            `- "${h.title}" → eligió: "${h.chosen}"` +
            (h.freeText ? ` — y escribió con sus propias palabras: "${h.freeText}"` : ""),
        )
        .join("\n")
    : "(todavía no vivió ningún evento en esta segunda vida)";

  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
El jugador ya se retiró como futbolista y ahora vive su segunda vida como ${SECOND_CAREER_LABELS[role]}: ${SECOND_LIFE_CONTEXT[role]}.

PERSONAJE:
- Apellido: ${player.last_name}
- Nacionalidad: ${player.nation}
- Fue futbolista en el ${player.club}, ahora es ${SECOND_CAREER_LABELS[role].toLowerCase()}${(role === "presidente" || role === "entrenador") && player.second_club ? ` del ${player.second_club}` : ""}
${role === "agente" && player.flags?.agente_especialidad ? `- Especialización como agente: ${player.flags.agente_especialidad}\n` : ""}- Reputación en este nuevo rol: ${player.reputacion}/100
- Patrimonio: ${player.patrimonio} €

ÚLTIMOS EVENTOS DE ESTA SEGUNDA VIDA (no repitas el tema ni la premisa):
${historyText}

REGLAS:
${COMMON_RULES}
- El evento tiene que encajar con el rol de ${SECOND_CAREER_LABELS[role].toLowerCase()}, nada relacionado con jugar partidos como futbolista (eso ya se acabó).
- ${SECOND_LIFE_STYLE[role]}
- Las consecuencias numéricas solo pueden tocar patrimonio y reputacion (no forma, moral, fama ni relaciones — esas ya no aplican en la segunda vida).
- Si el evento amerita una respuesta propia del personaje, marca allow_free_text en true y escribe free_text_prompt.
- Si en el historial alguna entrada incluye algo que el personaje escribió con sus propias palabras, léelo de verdad y dale continuidad cuando encaje, sin citarlo literalmente.
- Marca is_milestone en true solo si es un momento memorable (más o menos 1 de cada 4-5 eventos), y en ese caso escribe image_scene en inglés, fotorrealista, mostrando al personaje en su nuevo rol (traje de entrenador, despacho, palco directivo...), nunca con equipación de jugador.`;

  const event = await callEventTool(prompt, "segunda_vida", "segunda-vida");
  if (!event) return null;

  return {
    ...event,
    options: event.options.map((option) => ({
      ...option,
      consequences: {
        patrimonio: option.consequences.patrimonio,
        reputacion: option.consequences.reputacion,
      },
    })),
  };
}
