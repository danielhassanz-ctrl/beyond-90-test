import type { Player } from "@/types/player";

/**
 * Racha de días jugados — gancho de vuelta diaria, pedido explícito tras
 * una auditoría real: el juego engancha turno a turno pero no tenía
 * ningún motivo para volver MAÑANA. Nada de notificaciones push todavía
 * (eso necesita infraestructura aparte: service worker, permisos, claves
 * VAPID) — esto es la base más simple que ya genera el hábito: contar
 * los días seguidos que el jugador vuelve a jugar.
 *
 * Margen de 20h (no 24h en punto) para que jugar un poco más tarde o más
 * temprano un día no rompa la racha por minutos — igual de generoso que
 * el resto de umbrales de tiempo ya usados en el proyecto.
 */
const SAME_DAY_HOURS = 20;
const STREAK_BROKEN_HOURS = 48;

export interface StreakUpdate {
  streak_days: number;
  last_active_at: string;
  /** true si esto es un día nuevo de verdad (no una segunda decisión el mismo día) — para saber si merece celebrarse en la UI. */
  isNewDay: boolean;
}

export function computeStreakUpdate(player: Pick<Player, "last_active_at" | "streak_days">): StreakUpdate {
  const now = new Date();
  const last = player.last_active_at ? new Date(player.last_active_at) : null;

  if (!last) {
    return { streak_days: 1, last_active_at: now.toISOString(), isNewDay: true };
  }

  const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

  if (hoursSince < SAME_DAY_HOURS) {
    // Sigue siendo "hoy" — no se toca la racha, solo se actualiza la marca de actividad.
    return { streak_days: player.streak_days ?? 1, last_active_at: now.toISOString(), isNewDay: false };
  }

  if (hoursSince <= STREAK_BROKEN_HOURS) {
    return { streak_days: (player.streak_days ?? 0) + 1, last_active_at: now.toISOString(), isNewDay: true };
  }

  // Más de 48h sin jugar: la racha se rompe, empieza de nuevo en 1.
  return { streak_days: 1, last_active_at: now.toISOString(), isNewDay: true };
}
