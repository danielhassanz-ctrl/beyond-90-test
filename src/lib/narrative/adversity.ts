import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import type { GameEvent } from "@/types/career";

export type AdversityType = "injury_long" | "failure_crucial" | "relegation" | "scandal" | "loss_form" | "conflict";

/**
 * Adversidades son momentos donde la carrera se complica: lesiones largas,
 * fracasos cruciales, descensos, escándalos. Son OBLIGATORIOS en una carrera
 * realista - no todos ganan siempre.
 *
 * Frecuencia: ~1 adversidad cada 30-40 semanas para mantener tensión sin saturar.
 */

export interface AdversityTracker {
  lastAdversityWeek: number;
  adversitiesCount: number;
}

/**
 * Obtiene el rastreador de adversidades del jugador.
 */
export function getAdversityTracker(player: Player): AdversityTracker {
  if (!player.flags) player.flags = {};

  const stored = player.flags.adversity_tracker;
  if (typeof stored === "string") {
    try {
      return JSON.parse(stored);
    } catch {
      return { lastAdversityWeek: 0, adversitiesCount: 0 };
    }
  }
  return { lastAdversityWeek: 0, adversitiesCount: 0 };
}

/**
 * Actualiza el rastreador después de una adversidad.
 */
export function updateAdversityTracker(player: Player, tracker: AdversityTracker): Player {
  if (!player.flags) player.flags = {};
  tracker.lastAdversityWeek = player.week;
  tracker.adversitiesCount++;
  player.flags.adversity_tracker = JSON.stringify(tracker);
  return player;
}

/**
 * Determina si debería generarse una adversidad en esta semana.
 * - Necesita al menos 30 semanas desde la última
 * - Probabilidad aumenta con el tiempo
 * - A más media, menos chance (los buenos tienen menos problemas)
 */
export function shouldGenerateAdversity(player: Player): boolean {
  const tracker = getAdversityTracker(player);
  const weeksSinceLastAdversity = player.week - tracker.lastAdversityWeek;

  // No puede haber adversidades más de una cada 25 semanas
  if (weeksSinceLastAdversity < 25) return false;

  // Base: 15% de chance cada semana
  let chance = 0.15;

  // Aumenta con tiempo desde última
  chance += (weeksSinceLastAdversity - 25) * 0.01;

  // Disminuye con media alta (los buenos tienen menos problemas)
  if (player.media >= 80) chance *= 0.5;
  else if (player.media >= 70) chance *= 0.75;

  // Clampar entre 5% y 40%
  chance = Math.max(0.05, Math.min(0.4, chance));

  return Math.random() < chance;
}

/**
 * Elige el tipo de adversidad según contexto del jugador.
 */
export function pickAdversityType(player: Player): AdversityType {
  const types: AdversityType[] = ["injury_long", "failure_crucial", "relegation", "scandal", "loss_form", "conflict"];

  // Jugadores en descenso: más chance de relegación
  if (player.media < 55) {
    types.push("relegation", "relegation");
  }

  // Jugadores con problemas personales: más chance de conflicto
  if (player.fama > 70) {
    types.push("scandal", "scandal");
  }

  // Veteranos: más chance de pérdida de forma
  if (playerAge(player.week) > 32) {
    types.push("loss_form", "loss_form");
  }

  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Describe una adversidad en contexto narrativo.
 */
export function describeAdversity(player: Player, type: AdversityType): string {
  const age = playerAge(player.week);

  const descriptions: Record<AdversityType, string> = {
    injury_long: `Una lesión grave — ligamento roto, fractura, rotura de menisco — te deja fuera de circulación durante meses. No es una molestia de pretemporada. Es un golpe real que frena la carrera justo cuando iba bien.`,

    failure_crucial: `El partido más importante de la temporada. Tu equipo pierde. Y fue culpa tuya — fallo, amarilla tonta, duda en un momento crítico. Los medios no lo van a olvidar. Ni tú tampoco.`,

    relegation: `Tu equipo desciende. Toda la temporada construyendo, y se cae todo en el último mes. Ahora estás en una categoría inferior, alejado de los focos. Es un paso atrás que duele.`,

    scandal: `Un rumor explota en redes. Una foto, una declaración fuera de lugar, un conflicto privado que se hace público. De repente todo el mundo tiene una opinión sobre ti y no es positiva.`,

    loss_form: `De repente no juegas. No es lesión, es que el cuerpo no responde como antes. El joven que ocupa tu puesto corre más. Tus reflejos no son los mismos. Te das cuenta de que la edad está llegando.`,

    conflict: `Conflicto en el vestuario. Con el entrenador, con compañeros, con la afición. El ambiente se tensa. Ya no es solo jugar — es navegar un campo minado cada día.`,
  };

  return descriptions[type];
}

/**
 * Genera el prompt para la IA que cree un evento de adversidad.
 */
export function buildAdversityPrompt(player: Player, type: AdversityType, description: string): string {
  const age = playerAge(player.week);
  const typeName = {
    injury_long: "Lesión Grave",
    failure_crucial: "Fracaso Decisivo",
    relegation: "Descenso",
    scandal: "Escándalo",
    loss_form: "Pérdida de Forma",
    conflict: "Conflicto",
  }[type];

  return `Eres el director narrativo de "Beyond 90", un simulador de carrera de futbolista.

JUGADOR:
- Nombre: ${player.last_name}
- Edad: ${age} años
- Media: ${player.media}
- Club: ${player.club}
- Moral: ${player.moral}
- Forma: ${player.forma}

ADVERSIDAD: ${typeName}
${description}

CONTEXTO:
Este es un momento difícil en la carrera del jugador. No es el fin, pero es un golpe real que requiere resiliencia.

REGLAS:
- Título descriptivo del momento difícil
- 2-3 opciones sobre cómo reaccionar (rabia, rendición, determinación, depresión, rebote, aceptación)
- Consecuencias NEGATIVAS en stats (forma, moral, fama pueden bajar; media puede bajar levemente)
- allow_free_text en true con pregunta sobre qué piensa en este momento
- Tono: serio, emocional, realista — no dramatizar pero tampoco minimizar
- Marcar is_milestone en true si es particularmente significativo (ej: lesión que marca el inicio del declive)`;
}
