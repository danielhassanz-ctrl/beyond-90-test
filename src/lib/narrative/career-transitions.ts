/**
 * Eventos que se disparan automáticamente en transiciones de carrera.
 * Detecta: "Entrando en pico", "Saliendo del pico", "Comenzando decline", "Momento de retiro".
 */

import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { playerAge } from "@/types/career";
import { calculateCareerArc } from "./career-dynamics";

export type TransitionType = "entering_peak" | "exiting_peak" | "entering_decline" | "ready_to_retire";

/**
 * Detecta transiciones de carrera.
 */
export function detectCareerTransition(player: Player, previousArc?: any): TransitionType | null {
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
      },
      {
        id: "disfrutar",
        label: "Disfrutar: vivir plenamente, no solo ganar",
        subtitle: "Balance vida-carrera",
        consequences: { moral: 10, media: 1 },
      },
    ],
  };
}

/**
 * Evento: "Saliendo del PICO"
 */
export function buildExitingPeakEvent(): GameEvent {
  return {
    id: "transition-exiting-peak",
    category: "especial",
    title: "Notaste un cambio: ya no eres tan rápido",
    description: `Es sutil al principio. Un paso menos de velocidad. Una recuperación que tarda un día más. La realidad: acabas de salir de tu pico. A los 31 años, empiezas el lento descenso. No es fin del mundo — tienes 2-3 años buenos todavía. Pero tienes que ser más inteligente, no más rápido. Adaptar tu juego. O terminarás en la banca.`,
    isMilestone: true,
    milestoneType: "carrera",
    imageScene: `Photorealistic Getty Images photo of a 31-year-old footballer looking slightly tired after match, breathing heavily, more mature experienced expression, stadium evening light, showing signs of age but still professional, introspection moment`,
    options: [
      {
        id: "adaptarse",
        label: "Adaptarte: jugar más inteligente",
        subtitle: "Madurez táctica",
        consequences: { media: 1, moral: 5, forma: -2 },
      },
      {
        id: "luchar",
        label: "Luchar por mantener el pico",
        subtitle: "Negación",
        consequences: { media: -1, forma: -3, moral: 2 },
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
      },
      {
        id: "pelear",
        label: "Pelear contra el tiempo: probar tratamientos, más entrenamiento",
        subtitle: "Desesperación",
        consequences: { moral: 2, forma: -5, media: -2 },
      },
    ],
  };
}

/**
 * Evento: "TIEMPO DE RETIRARSE"
 */
export function buildReadyToRetireEvent(): GameEvent {
  return {
    id: "transition-ready-to-retire",
    category: "especial",
    title: "¿Hasta cuándo vas a jugar?",
    description: `Tu cuerpo pide parar. O tu media está en caída libre. O tienes 35 años. La realidad: tu época como futbolista profesional está terminando. Puedes intentar jugar un par años más, pero ¿vale la pena? ¿No sería mejor retirarte ahora, mientras eres recordado como jugador, y comenzar tu segunda vida?`,
    isMilestone: true,
    milestoneType: "carrera",
    imageScene: `Photorealistic Getty Images photo of a mature footballer at crossroads, contemplative older expression, empty stadium background, soft twilight light, reflective moment of end of era, peaceful but serious`,
    options: [
      {
        id: "retirarse",
        label: "Retirarte ahora: fin digno",
        subtitle: "Leyenda",
        consequences: { moral: 8, status: "retired" },
      },
      {
        id: "continuar",
        label: "Continuar un par de años más",
        subtitle: "Exprimir el final",
        consequences: { moral: 2, forma: -3 },
      },
    ],
  };
}
