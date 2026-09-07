/**
 * Sistema de rastreo de eventos para prevenir repeticiones.
 * Mantiene historial de los últimos N eventos para evitar que salgan
 * el mismo evento o situaciones muy similares en corto plazo.
 */

import type { GameEvent } from "@/types/career";

export interface EventHistory {
  eventId: string;
  category: string;
  title: string;
  week: number;
}

/**
 * Filtra eventos que NO deberían aparecer basándose en:
 * 1. Ya apareció recientemente (últimas 10 semanas)
 * 2. Mismo category 3 veces en últimas 15 semanas
 * 3. Es un evento "especial" que solo debe pasar una vez
 */
export function shouldExcludeEvent(
  eventId: string,
  category: string,
  history: EventHistory[],
  currentWeek: number,
): boolean {
  // Eventos que solo deben pasar una vez en toda la carrera
  const SINGLETON_EVENTS = new Set([
    "vid-casa",
    "vid-mansion-lujo",
    "fork-oferta-arabia",
    "fork-retiro-pro",
  ]);

  if (SINGLETON_EVENTS.has(eventId)) {
    // Si ya pasó, no puede volver a pasar
    return history.some((h) => h.eventId === eventId);
  }

  // Evitar que el mismo evento salga en las últimas 10 semanas
  const recentSameEvent = history.filter(
    (h) => h.eventId === eventId && currentWeek - h.week <= 10,
  );
  if (recentSameEvent.length > 0) {
    return true;
  }

  // Evitar que la misma categoría salga 3+ veces en 15 semanas
  const recentCategory = history.filter(
    (h) => h.category === category && currentWeek - h.week <= 15,
  );
  if (recentCategory.length >= 3) {
    return true;
  }

  return false;
}

/**
 * Diversifica categorías para que no sea monótono.
 * Favorece categorías que NO han salido recientemente.
 */
export function weirdEventByRarity(
  candidates: GameEvent[],
  history: EventHistory[],
  currentWeek: number,
): GameEvent | null {
  if (candidates.length === 0) return null;

  // Score cada candidato por "rareza" (cuánto tiempo hace que no sale esa categoría)
  const scored = candidates
    .map((event) => {
      const lastSeen = history
        .filter((h) => h.category === event.category)
        .sort((a, b) => b.week - a.week)[0];

      const weeksSinceCategory = lastSeen ? currentWeek - lastSeen.week : 999;
      const score = weeksSinceCategory + Math.random() * 5; // Random tiebreaker

      return { event, score };
    })
    .sort((a, b) => b.score - a.score);

  // Retorna el más raro (pero con 70% de chance; 30% de sorpresa)
  const picked = Math.random() < 0.7 ? scored[0] : scored[Math.floor(Math.random() * Math.min(3, scored.length))];

  return picked?.event ?? candidates[0];
}

/**
 * Recomendaciones estratégicas de qué tipo de evento debería aparecer después.
 * Basado en el estado del jugador y el historial reciente.
 */
export function suggestNextEventType(
  player: { media: number; moral: number; forma: number; age: number },
  history: EventHistory[],
  currentWeek: number,
): string[] {
  const suggestions: string[] = [];

  // Si moral está baja, priorizar eventos de "vida real" para boost
  if (player.moral < 40) {
    suggestions.push("vida", "vestuario");
  }

  // Si forma está muy baja, priorizar entrenamiento
  if (player.forma < 30) {
    suggestions.push("entrenamiento");
  }

  // Cada 10 semanas, un partido
  const weeksSinceMatch = currentWeek - (history.filter((h) => h.category === "partido").pop()?.week ?? 0);
  if (weeksSinceMatch > 10 || weeksSinceMatch === currentWeek) {
    suggestions.push("partido");
  }

  // Si edad >= 30, empezar a traer eventos de "reflexión" sobre retiro
  if (player.age >= 30) {
    suggestions.push("vida", "prensa");
  }

  // Agregar aleatoriedad
  if (Math.random() < 0.3) {
    suggestions.push("especial");
  }

  return suggestions.length > 0 ? suggestions : ["partido", "entrenamiento", "vida"];
}
