/**
 * Eventos que se disparan automáticamente en transiciones de carrera.
 * Detecta: "Entrando en pico", "Saliendo del pico", "Comenzando decline", "Momento de retiro".
 */

import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { playerAge } from "@/types/career";
import { calculateCareerArc } from "./career-dynamics";
import { getNpcName, getTeammateName } from "./npcs";

export type TransitionType = "entering_peak" | "exiting_peak" | "entering_decline" | "ready_to_retire";

/**
 * Detecta transiciones de carrera.
 */
export function detectCareerTransition(player: Player): TransitionType | null {
  const arc = calculateCareerArc(player);
  const age = playerAge(player.week);

  // Entrando en pico: edad 25, media >70
  if (age === 25 && arc.phase === "pico" && player.media && player.media > 70) {
    return "entering_peak";
  }

  // Saliendo del pico: edad 31-32, media empieza a bajar
  if (age >= 31 && age <= 32 && arc.phase === "pico" && player.media && player.media < 80) {
    return "exiting_peak";
  }

  // Entrando en decline: edad 32, fase = decline
  if (age === 32 && arc.phase === "decline" && arc.yearsInPhase === 0) {
    return "entering_decline";
  }

  // Listo para retirarse: edad >34 OR (edad 32+ Y media <50)
  if ((age > 34) || (age >= 32 && player.media && player.media < 50)) {
    return "ready_to_retire";
  }

  return null;
}

/**
 * Evento: "Entrando en tu PICO"
 */
export function buildEnteringPeakEvent(): GameEvent {
  return {
    id: "transition-entering-peak",
    category: "especial",
    title: "Tu momento llegó: ERES AHORA UN FUTBOLISTA DE ÉLITE",
    description: `No es suerte. Son años de trabajo. Ahora, a los 25 años, ERES IMPARABLE. Tu cuerpo está en su punto óptimo. Tu experiencia está madura. Tus compañeros te respetan. Los rivales te temen. Este es TU PICO. Tienes 5-6 años para aprovecharlo al máximo. Después, el tiempo no perdona.`,
    isMilestone: true,
    milestoneType: "carrera",
    imageScene: `Photorealistic Getty Images photo of a 25-year-old footballer at absolute peak physical condition, confident powerful expression, stadium backdrop with fans, bright dramatic lighting highlighting athletic form, intense focus, prime years determination, professional sports photography at its finest`,
    options: [
      {
        id: "ambicioso",
        label: "Ambición máxima: ganar TODO en estos años",
        subtitle: "Pensar en historia",
        consequences: { moral: 8, media: 3, forma: 2 },
        outcomeText: "Lo dices en voz alta, delante del espejo del vestuario. A partir de esta noche, cada sesión de entrenamiento tiene un objetivo, y tu preparador lo nota enseguida.",
      },
      {
        id: "disfrutar",
        label: "Disfrutar: vivir plenamente, no solo ganar",
        subtitle: "Balance vida-carrera",
        consequences: { moral: 10, media: 1 },
        outcomeText: "Decides que cada partido va a ser una fiesta. En el siguiente entrenamiento ríes más que nunca, y el vestuario lo agradece más que cualquier gol.",
      },
    ],
  };
}

/**
 * Evento: "Saliendo del PICO"
 */
export function buildExitingPeakEvent(age: number): GameEvent {
  return {
    id: "transition-exiting-peak",
    category: "especial",
    title: "Notaste un cambio: ya no eres tan rápido",
    // La condición que dispara esto vale para 31 O 32 años (ver
    // detectCareerTransition), pero el texto decía "31 años" fijo — a
    // los 32 salía una edad incorrecta. Se recibe la edad real en vez de
    // asumirla.
    description: `Es sutil al principio. Un paso menos de velocidad. Una recuperación que tarda un día más. La realidad: acabas de salir de tu pico. A los ${age} años, empiezas el lento descenso. No es fin del mundo — tienes 2-3 años buenos todavía. Pero tienes que ser más inteligente, no más rápido. Adaptar tu juego. O terminarás en la banca.`,
    isMilestone: true,
    milestoneType: "carrera",
    imageScene: `Photorealistic Getty Images photo of a ${age}-year-old footballer looking slightly tired after match, breathing heavily, more mature experienced expression, stadium evening light, showing signs of age but still professional, introspection moment`,
    options: [
      {
        id: "adaptarse",
        label: "Adaptarte: jugar más inteligente",
        subtitle: "Madurez táctica",
        consequences: { media: 1, moral: 5, forma: -2 },
        outcomeText: "Empiezas a ver el campo de otra forma: menos carreras, más cabeza. El míster te pide que se lo expliques a los jóvenes y tú, casi sin querer, ya estás enseñando.",
      },
      {
        id: "luchar",
        label: "Luchar por mantener el pico",
        subtitle: "Negación",
        consequences: { media: -1, forma: -3, moral: 2 },
        outcomeText: "Duermes mejor, comes mejor, entrenas mejor. Tu cuerpo responde, aunque sabes que cada mes cuesta un poco más que el anterior.",
      },
    ],
  };
}

/**
 * Evento: "DECLINE ha comenzado"
 */
export function buildEnteringDeclineEvent(): GameEvent {
  return {
    id: "transition-entering-decline",
    category: "especial",
    title: "El declive es real",
    description: `A los 32 años, tu cuerpo ya no es lo que era. No es de la noche a la mañana, pero es inevitable. Lesiones que tardaban una semana ahora tardan dos. El ritmo de juego se te escapa. Los jóvenes corren más que tú. Es hora de aceptar: estás en declive. Puedes jugar 4-5 años más, pero ya no serás estrella. Serás veterano, con experiencia pero sin explosión.`,
    isMilestone: true,
    milestoneType: "carrera",
    imageScene: `Photorealistic Getty Images photo of a 32-year-old footballer showing age but experience, standing contemplatively, stadium quiet moment, softer light, weathered but wise expression, veteran footballer moment`,
    options: [
      {
        id: "aceptar",
        label: "Aceptar y disfrutar los últimos años",
        subtitle: "Paz",
        consequences: { moral: 7, forma: 0 },
        outcomeText: "Te sientas en la grada de un entrenamiento y simplemente miras. Hace años que no veías el fútbol así, sin prisa y con una sonrisa.",
      },
      {
        id: "pelear",
        label: "Pelear contra el tiempo: probar tratamientos, más entrenamiento",
        subtitle: "Desesperación",
        consequences: { moral: 2, forma: -5, media: -2 },
        outcomeText: "Tu fisio te mira, resopla y te dice: 'Está bien, probemos'. Al día siguiente ya tienes un plan nuevo en el móvil.",
      },
    ],
  };
}

/**
 * Evento: "TIEMPO DE RETIRARSE"
 */
/**
 * El documento de referencia de la partida original ("Beyond 90 · Partida
 * Original · Día a Día") termina la carrera con Daniel redactando su
 * propio mensaje de despedida: "La partida no termina pulsando
 * simplemente 'retirarse' [...] la carrera termina como una biografía, no
 * como una tabla de estadísticas". La pantalla de retiro (carrera/retiro/
 * page.tsx) sí es una biografía en forma de línea de tiempo de hitos, pero
 * le faltaba justo esa pieza: la propia voz del jugador. `allowFreeText`
 * aquí se recoge en carrera/actions.ts como cualquier otro texto libre
 * (career_events.free_text_response) y carrera/retiro/page.tsx lo busca
 * específicamente para mostrarlo como cita destacada.
 */
function mixRetire(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  return (h >>> 0) % 1000;
}

/**
 * El momento de decidir retirarse es, por diseño, la decisión con más
 * peso emocional de toda la carrera — y hasta ahora tenía un único
 * párrafo fijo y genérico ("Tu cuerpo pide parar. O tu media está en
 * caída libre. O tienes 35 años."), el mismo para cualquier jugador,
 * cualquier posición, cualquier carrera. Contrastaba mal con el resto
 * del juego, donde hasta una prueba física de pretemporada tiene 6
 * variantes. Además, este evento puede reaparecer varias veces (cada ~15
 * semanas si el jugador sigue diciendo que no), así que sin variantes el
 * mismo jugador podía ver el idéntico texto tres o cuatro veces seguidas
 * en los últimos años de su propia carrera.
 */
function buildRetireScene(player: Player, age: number): { desc: string; imageScene: string } {
  const seed = `${player.id}:retire:${player.week}`;
  const variantIdx = mixRetire(seed) % 7;
  const coach = getNpcName(player, "entrenador");
  const young = getTeammateName(player, `${seed}:young`);

  const variants: { desc: string; imageScene: string }[] = [
    {
      desc: `Ya no recuperas entre partidos como antes. El fisio lo sabe, tú lo sabes, y esta mañana, al levantarte, tu cuerpo te lo ha dicho con más claridad que nunca: a los ${age}, cada semana de fútbol se cobra un precio que antes ni notabas.`,
      imageScene: "Photorealistic photo of a mature footballer sitting alone on a treatment table in an empty medical room, head down, contemplative, soft clinical lighting, quiet reflective moment",
    },
    {
      desc: `${coach} te sienta en el banquillo el partido entero. Desde ahí ves a ${young}, con la mitad de tus años, jugar el fútbol que tú jugabas hace una década. No es rabia lo que sientes. Es algo más parecido a reconocerte en un espejo que ya no existe.`,
      imageScene: "Photorealistic photo of a mature footballer sitting on the substitutes' bench, watching the match intently, stadium lights, contemplative expression, photojournalism style",
    },
    {
      desc: `El médico del club no le da vueltas: "Puedes seguir, pero cada año que pase, el riesgo sube y la recuperación baja. La decisión es tuya, no mía." Sales de la consulta con el diagnóstico más honesto que has escuchado en toda tu carrera.`,
      imageScene: "Photorealistic photo of a mature footballer leaving a medical office, corridor lighting, pensive expression, realistic documentary style",
    },
    {
      desc: `Te quedas solo en el túnel de vestuarios después de un partido cualquiera, con el estadio ya vacío y las luces apagándose una a una. A los ${age} años, por primera vez, ese silencio no se siente como paz. Se siente como una pregunta sin responder.`,
      imageScene: "Photorealistic photo of a mature footballer standing alone in an empty stadium tunnel, lights dimming, reflective solitary moment, cinematic documentary lighting",
    },
    {
      desc: `Tu agente te llama con la voz más seria de lo habitual: "Ya no llaman los mismos clubes que llamaban hace tres años. Todavía hay ofertas, pero no las de antes." No hace falta que lo diga más claro para que entiendas lo que de verdad te está contando.`,
      imageScene: "Photorealistic photo of a mature footballer looking out a window while on a phone call, serious expression, soft indoor lighting, quiet dramatic moment",
    },
    {
      desc: `La afición te dedica una ovación completa al ser sustituido, algo que llevaba años sin pasar. Se levanta el estadio entero. Es precioso y, a los ${age} años, también es la primera vez que una ovación así te suena a despedida en vez de a celebración.`,
      imageScene: "Photorealistic photo of a mature footballer being substituted, applauding fans standing in the stadium background, emotional moment, warm stadium lighting, photojournalism style",
    },
    {
      desc: `En casa, alguien te pregunta sin maldad si el año que viene seguirás jugando "con el mismo equipo de siempre". Es la primera vez que no tienes una respuesta clara que dar, y te sorprende lo mucho que te cuesta admitirlo en voz alta.`,
      imageScene: "Photorealistic photo of a mature footballer sitting quietly at home, thoughtful expression, warm domestic lighting, intimate realistic photography",
    },
  ];

  return variants[variantIdx];
}

export function buildReadyToRetireEvent(player: Player): GameEvent {
  const age = playerAge(player.week);
  const scene = buildRetireScene(player, age);
  return {
    id: "transition-ready-to-retire",
    category: "especial",
    title: "¿Hasta cuándo vas a jugar?",
    description: scene.desc,
    isMilestone: true,
    milestoneType: "carrera",
    imageScene: scene.imageScene,
    allowFreeText: true,
    freeTextPrompt: "Si hoy fuera tu último día como profesional, ¿qué mensaje de despedida dejarías?",
    options: [
      {
        id: "retirarse",
        label: "Retirarte ahora: fin digno",
        subtitle: "Leyenda",
        consequences: { moral: 8, status: "retired" },
        outcomeText: "Se lo dices al club con la voz firme y los ojos húmedos. Esa tarde, el estadio guarda un minuto de silencio... y luego un aplauso que dura casi cinco.",
      },
      {
        id: "continuar",
        label: "Continuar un par de años más",
        subtitle: "Exprimir el final",
        consequences: { moral: 2, forma: -3 },
        outcomeText: "Decides seguir un tiempo más. El club lo celebra con alivio y tú, en casa, te preguntas cuánto de ese 'un poco más' es ganas y cuánto miedo a parar.",
      },
    ],
  };
}
