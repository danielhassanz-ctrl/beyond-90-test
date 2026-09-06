import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";

/**
 * Eventos de declive emocional y reflexión sobre el retiro.
 * A partir de los 32-34 años, la carrera entra en su fase final.
 * No es solo "dejar de jugar" — es una transición narrativa con peso emocional.
 */

export interface DeclineSignal {
  type: "physical_decline" | "youth_pressure" | "offer_new_life" | "injury_limits" | "coach_conflict" | "renewal_failure";
  description: string;
  emotionalWeight: number; // 0-1, cuánto peso emocional tiene
}

/**
 * Detecta signos de declive en el perfil del jugador.
 */
export function detectDeclineSignals(player: Player): DeclineSignal[] {
  const age = playerAge(player.week);
  const signals: DeclineSignal[] = [];

  // Señal 1: Declive físico natural (edad 32+)
  if (age >= 32) {
    signals.push({
      type: "physical_decline",
      description: "Tu cuerpo no responde como antes. Los entrenamiento cuestan más. Los rivales son más jóvenes.",
      emotionalWeight: 0.6,
    });
  }

  // Señal 2: Presión de jóvenes (media baja o forma baja con edad 30+)
  if (age >= 30 && (player.media < 65 || player.forma < 50)) {
    signals.push({
      type: "youth_pressure",
      description: "Eres veterano pero no indiscutible. Hay un joven en tu puesto que corre más, salta más alto. La competencia es real.",
      emotionalWeight: 0.7,
    });
  }

  // Señal 3: Oferta de Arabia o segunda vida (edad 33+)
  if (age >= 33 && player.media >= 60) {
    signals.push({
      type: "offer_new_life",
      description: "Te ofrecen un rol diferente: dirección técnica, scouts, análisis. Una segunda carrera profesional.",
      emotionalWeight: 0.5,
    });
  }

  // Señal 4: Limitaciones por lesión anterior (si ha tenido muchas)
  const injuryCount = Object.entries(player.flags || {})
    .filter(([k]) => k.includes("injury") || k.includes("lesion"))
    .length;
  if (injuryCount >= 2 && age >= 31) {
    signals.push({
      type: "injury_limits",
      description: "Las lesiones previas pesan. Tu cuerpo ya no se recupera igual. Cada partido es un riesgo.",
      emotionalWeight: 0.8,
    });
  }

  // Señal 5: Conflicto con entrenador (rel_entrenador bajo)
  if (player.rel_entrenador < 40 && age >= 31) {
    signals.push({
      type: "coach_conflict",
      description: "El entrenador nuevo no cuenta contigo. Eres una reliquia del régimen anterior. Entrenador joven, equipo joven.",
      emotionalWeight: 0.6,
    });
  }

  // Señal 6: Renovación fallida (después de week 200+)
  if (player.week >= 200 && !player.flags?.renewal_recent) {
    signals.push({
      type: "renewal_failure",
      description: "El club no quiere renovarte. Los números hablan: eres caro y rendidor en decline. Nadie te espera.",
      emotionalWeight: 0.9,
    });
  }

  return signals;
}

/**
 * Genera un prompt para un evento de reflexión sobre el declive/retiro.
 */
export function buildDeclinePrompt(player: Player, signals: DeclineSignal[]): string {
  const age = playerAge(player.week);
  const career_years = Math.floor(player.week / 52);
  const signalDescriptions = signals.map((s) => `- ${s.description}`).join("\n");

  const emotionalTone = signals.reduce((sum, s) => sum + s.emotionalWeight, 0) / signals.length;
  const toneName = emotionalTone > 0.7 ? "sombrío" : emotionalTone > 0.5 ? "reflexivo" : "esperanzador";

  return `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.

JUGADOR EN DECLIVE:
- Nombre: ${player.last_name}
- Edad: ${age} años (carrera de ${career_years} años)
- Media: ${player.media}
- Moral: ${player.moral}
- Club: ${player.club}
- Estado mental: ${toneName}

SEÑALES DE DECLIVE:
${signalDescriptions}

CONTEXTO:
El jugador está en la recta final de su carrera como futbolista profesional. Este es un momento de reflexión sobre:
- Legado deportivo
- Transición a segunda vida
- Aceptación del paso del tiempo
- Nuevas prioridades (familia, negocios, coaching)

REGLAS:
- Evento EMOCIONAL y reflexivo, no técnico
- 2-3 opciones que representen diferentes caminos: seguir luchando, aceptar el declive, preparar transición
- Consecuencias pueden incluir cambios en rol (ej: pasar a suplente, entrenar)
- allow_free_text en true con pregunta profunda ("¿Qué legado quieres dejar?" o "¿Qué es lo más importante ahora?")
- Marcar is_milestone en true — este es un momento histórico en la carrera
- Tono: noble, reflexivo, realista pero no depresivo — es natural envejecer, hay belleza en el cierre`;
}

/**
 * Describe el contexto emocional del declive para la IA.
 */
export function describeDeclineContext(player: Player): string {
  const age = playerAge(player.week);
  const yearsPlayed = Math.floor(player.week / 52);

  if (age < 30) {
    return "Aún eres joven pero empiezas a notar que el paso imparable del fútbol no espera.";
  } else if (age < 33) {
    return `Llevas ${yearsPlayed} años en el fútbol profesional. Ya no eres joven talento — eres veterano. El reloj marca.`;
  } else if (age < 36) {
    return `A los ${age} años y ${yearsPlayed} de carrera, el final empieza a ser visible. Otros toman tu rol. Otros sueñan lo que tú ya viviste.`;
  } else {
    return `${age} años. Casi cuarto de siglo en el fútbol. Cualquier día puede ser el último. La pregunta ahora es: ¿qué viene después?`;
  }
}
