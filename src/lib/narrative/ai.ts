import Anthropic from "@anthropic-ai/sdk";
import type { Consequences, EventCategory, GameEvent, SecondCareerRole } from "@/types/career";
import type { Player } from "@/types/player";
import { SECOND_CAREER_LABELS, playerAge } from "@/types/career";
import { STARTING_AGENTS, pickStartingClubOffers } from "@/lib/constants";

const MODEL = "claude-sonnet-5";

const FLAVOR_CATEGORIES: EventCategory[] = [
  "entrenamiento",
  "vestuario",
  "representante",
  "prensa",
  "vida",
  "especial",
];

export interface HistoryItem {
  title: string;
  chosen: string;
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
      options: {
        type: "array",
        minItems: 2,
        maxItems: 3,
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
- Las opciones deben ser 2 o 3, con una etiqueta de acción corta y un subtítulo que adelante la consecuencia (ej. "+Vestuario", "Jugada de riesgo").
- Las consecuencias numéricas deben ser sutiles para stats/relaciones (entre -10 y +10). El patrimonio puede moverse más si la escena lo justifica (ej. una prima de fichaje, un contrato nuevo).
- Cualquier persona famosa que aparezca (cantante, influencer, otro futbolista) debe ser CLARAMENTE FICTICIA — nunca un nombre real.`;

async function callEventTool(
  prompt: string,
  category: EventCategory,
  idPrefix: string,
): Promise<GameEvent | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      tools: [EVENT_TOOL],
      tool_choice: { type: "tool", name: "emit_event" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return null;

    const data = toolUse.input as {
      title?: string;
      description?: string;
      allow_free_text?: boolean;
      free_text_prompt?: string;
      is_milestone?: boolean;
      image_scene?: string;
      rival_club?: string;
      options?: Array<{ label?: string; subtitle?: string; consequences?: Consequences }>;
    };

    if (!data.title || !data.description || !data.options || data.options.length < 2) {
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

    if (options.length < 2) return null;

    const isMilestone = Boolean(data.is_milestone);

    return {
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
      options,
    };
  } catch {
    return null;
  }
}

export async function generateAiEvent(
  player: Player,
  history: HistoryItem[],
): Promise<GameEvent | null> {
  const category = pickCategory();
  const age = playerAge(player.week);

  const historyText = history.length
    ? history.map((h) => `- "${h.title}" → eligió: "${h.chosen}"`).join("\n")
    : "(todavía no vivió ningún evento)";

  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera el PRÓXIMO evento de la carrera para este jugador. Categoría de este evento: ${category}.

JUGADOR:
- Apellido: ${player.last_name}
- Edad: ${age} años
- Club actual: ${player.club}
- Posición: ${player.position}
- Personalidad: ${player.personality}
- Representante: ${player.agent_name ?? "sin definir"}
- Forma: ${player.forma}/100, Moral: ${player.moral}/100, Fama: ${player.fama}/100
- Media futbolística: ${player.media}/99
- Patrimonio: ${player.patrimonio} €
- Relación con el entrenador: ${player.rel_entrenador}/100, con el vestuario: ${player.rel_vestuario}/100, con la afición: ${player.rel_aficion}/100, con el representante: ${player.rel_representante}/100

ÚLTIMOS EVENTOS DE SU CARRERA (no repitas el tema ni la premisa):
${historyText}

REGLAS:
${COMMON_RULES}
- El evento tiene que encajar con el club, la edad, la posición y el momento actual del jugador — nada genérico que podría pasar en cualquier carrera. Si tiene solo ${age} años y acaba de llegar a un club modesto, no debería sonar a superestrella todavía.
- Si la escena trata sobre su rendimiento como jugador (se queda en el banquillo, discute con el entrenador por minutos, destaca en un entrenamiento, etc.), incluye un cambio de media coherente: banquillo prolongado o mal rendimiento → media hacia abajo; destacar de verdad → media hacia arriba. Si la escena no tiene que ver con el rendimiento futbolístico, no toques la media.
- Si el evento amerita una respuesta propia del jugador (algo que él mismo diría en una entrevista o discusión), marca allow_free_text en true y escribe free_text_prompt.
- No repitas la premisa de ningún evento del historial reciente.
- Marca is_milestone en true SOLO si esta escena es visualmente memorable y merece una foto (ej. el entrenador te echa una bronca delante de todo el vestuario, una cena romántica, una reunión tensa con tu representante, un momento en el túnel de vestuarios) — esto debería pasar en más o menos 1 de cada 4-5 eventos, no siempre. El resto de las veces, is_milestone en false y no incluyas image_scene.
- Cuando is_milestone sea true, escribe también image_scene: una descripción en INGLÉS, estilo prompt de generación de imagen, fotorrealista, describiendo la escena concreta (dónde está, quién más aparece, la luz, el encuadre) para recrearla a partir de una foto real del jugador. Cualquier otra persona en la escena debe describirse genérica (nunca un nombre real).`;

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
- Edad: ${age} años
- Club nuevo: ${club}
- Posición: ${player.position}
- Personalidad: ${player.personality}
- Representante: ${agent}
- Patrimonio actual: ${player.patrimonio} €
- Fama: ${player.fama}/100
- ¿Es su primer contrato profesional?: ${isFirstSigning ? "Sí, viene de la cantera/amateur, es su debut" : "No, ya es profesional y viene de otro club"}

REGLAS:
${COMMON_RULES}
- OBLIGATORIO: el salario ya está decidido, usa EXACTAMENTE esta cifra en la descripción, sin cambiarla ni redondearla de otra forma: "${salaryFigure}". Sobre los minutos, no siempre tiene que haber una promesa concreta — a veces el club directamente NO garantiza nada ("tendrás que ganarte el puesto", "sin promesas de minutos") y eso también es válido y realista; no fuerces una cifra de minutos si no encaja con la escena.
- Las opciones son sobre cómo negociar o reaccionar en la firma (aceptar tal cual, pedir más minutos garantizados, pedir una cláusula, dejar que ${agent} lleve la voz cantante, etc.), no sobre elegir otro club.
- Al menos una opción debe modificar el patrimonio (prima de fichaje, o coste de contratar un abogado, etc.) con una cifra distinta a la del salario.`;

  return callEventTool(prompt, "representante", isFirstSigning ? "contrato-debut" : "contrato");
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

export async function generateDebutPretemp1(club: string): Promise<GameEvent | null> {
  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera la escena del primer entrenamiento del jugador con el primer equipo del ${club}, recién fichado a los 16 años, todavía sin ganarse un sitio entre los mayores.

REGLAS:
${COMMON_RULES}
- 2 opciones sobre cómo afrontar este primer entrenamiento (por ejemplo, entregarte al máximo aunque no puedas seguir el ritmo, frente a ir con cabeza y observar antes de forzar) — no tienen que ser exactamente estas, invéntate variaciones.
- Marca allow_free_text en true con una pregunta corta que te hace un veterano o el cuerpo técnico.
- No marques is_milestone.`;

  const event = await callEventTool(prompt, "entrenamiento", "debut-pretemp-1");
  return event ? { ...event, id: "debut-pretemp-1" } : null;
}

export async function generateDebutPretemp2(club: string): Promise<GameEvent | null> {
  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera una escena de pretemporada en el ${club}, pocos días después del fichaje: el jugador sufre un contratiempo físico leve (una molestia, una sobrecarga, nada grave) y conoce al fisio o al preparador físico del club, que le atiende.

REGLAS:
${COMMON_RULES}
- 2 opciones sobre cómo afrontar la recuperación (con calma y disciplina, frente a con prisa por no perderse nada de la pretemporada).
- Marca is_milestone en true (es un momento memorable de la pretemporada) y escribe image_scene.`;

  const event = await callEventTool(prompt, "entrenamiento", "debut-pretemp-2");
  if (!event) return null;
  return { ...event, id: "debut-pretemp-2", isMilestone: true, milestoneType: "lesion_debut" };
}

export async function generateDebutPretemp3(): Promise<GameEvent | null> {
  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
Genera una escena en la que el jugador, en plena pretemporada tras fichar como profesional, recibe un mensaje inesperado de alguien de su vida de antes del fútbol (un amigo de la infancia, un profesor, un excompañero de instituto, un antiguo entrenador de la cantera, una expareja...) reaccionando a la noticia de que ha fichado.

REGLAS:
${COMMON_RULES}
- 2 o 3 opciones sobre cómo responder a ese mensaje.
- Marca allow_free_text en true con la pregunta "¿Qué le respondes?" o similar.
- No marques is_milestone.`;

  const event = await callEventTool(prompt, "vida", "debut-pretemp-3");
  return event ? { ...event, id: "debut-pretemp-3" } : null;
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
    ? history.map((h) => `- "${h.title}" → eligió: "${h.chosen}"`).join("\n")
    : "(todavía no vivió ningún evento en esta segunda vida)";

  const prompt = `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.
El jugador ya se retiró como futbolista y ahora vive su segunda vida como ${SECOND_CAREER_LABELS[role]}: ${SECOND_LIFE_CONTEXT[role]}.

PERSONAJE:
- Apellido: ${player.last_name}
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
