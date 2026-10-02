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

/**
 * Premios por umbral de racha. Solo saltan UNA vez al llegar a ese día
 * exacto (no cada día) y varias frases por umbral para no repetirse. Los
 * bonus son pequeños a propósito: el premio real es sentir que la
 * constancia se nota en la historia, no una ventaja que desequilibre la
 * carrera. Las fotos gratis de racha NO están todavía — cuestan dinero
 * real por foto y requieren tope por carrera, queda para una segunda fase.
 */
export const STREAK_MILESTONES: Record<number, { bonus: { forma?: number; moral?: number; fama?: number }; messages: string[] }> = {
  3: {
    bonus: { forma: 5, moral: 5 },
    messages: [
      "Tres días seguidos entrenando con ganas: llegas fino al campo y se te nota en las piernas.",
      "El míster lo comenta de pasada: \"Últimamente te veo con otra cara.\" Tres días de constancia.",
      "Tu cuerpo agradece la rutina: duermes mejor y entrenas con más chispa.",
    ],
  },
  7: {
    bonus: { moral: 8, forma: 4 },
    messages: [
      "Una semana entera sin fallar. En el vestuario ya te llaman \"el del reloj suizo\".",
      "Siete días seguidos: el preparador físico te pone de ejemplo delante del grupo.",
      "Una semana de disciplina. Dicen que el talento se nota, pero la constancia se huele.",
    ],
  },
  14: {
    bonus: { fama: 3, moral: 6 },
    messages: [
      "Dos semanas sin perder el ritmo. Un periodista local escribe sobre tu \"profesionalidad de manual\".",
      "Catorce días de constancia: la afición empieza a hablar de ti como alguien en quien confiar.",
      "Quincena perfecta. Alguien del club filtra que eres de los más serios de la plantilla.",
    ],
  },
  30: {
    bonus: { fama: 5, moral: 10 },
    messages: [
      "Un mes entero sin fallar un día. Esto ya no es racha, es identidad: así se hacen las leyendas.",
      "Treinta días seguidos. El club lo nota, la prensa lo nota y tú también: eres otro jugador.",
      "Un mes de constancia total. Tu nombre empieza a asociarse a la palabra \"fiable\".",
    ],
  },
};

export interface StreakUpdateWithReward extends StreakUpdate {
  /** Umbral alcanzado hoy (3/7/14/30) o null si hoy no toca premio. */
  milestone: number | null;
}

export function computeStreakUpdate(player: Pick<Player, "last_active_at" | "streak_days">): StreakUpdateWithReward {
  const now = new Date();
  const last = player.last_active_at ? new Date(player.last_active_at) : null;

  const finish = (streak_days: number, isNewDay: boolean): StreakUpdateWithReward => ({
    streak_days,
    last_active_at: now.toISOString(),
    isNewDay,
    milestone: isNewDay && STREAK_MILESTONES[streak_days] ? streak_days : null,
  });

  if (!last) return finish(1, true);

  const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

  // Sigue siendo "hoy" — no se toca la racha, solo se actualiza la marca de actividad.
  if (hoursSince < SAME_DAY_HOURS) return finish(player.streak_days ?? 1, false);

  if (hoursSince <= STREAK_BROKEN_HOURS) return finish((player.streak_days ?? 0) + 1, true);

  // Más de 48h sin jugar: la racha se rompe, empieza de nuevo en 1.
  return finish(1, true);
}
