/**
 * QUÉ AVISO MANDAR A QUIÉN. Función pura (sin red): dado un jugador y el momento, decide si toca un aviso y cuál. Un aviso como mucho
 * cada 20 horas por dispositivo, nunca a quien lleva más de dos semanas sin entrar (no hay que ser pesado) y con textos distintos
 * según lo que de verdad está en juego: la racha del reto del día, el reto de hoy o una carrera que lleva días parada.
 */
import { challengeOfDay, challengeState, madridDay } from "@/lib/narrative/daily-challenge";
import { displayName } from "@/types/player";

export interface ReminderPlayer {
  last_name: string;
  nickname: string | null;
  status: string;
  flags: Record<string, string | boolean> | null;
  last_active_at: string | null;
}

export interface Reminder {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export const MIN_HOURS_BETWEEN_PUSHES = 20;
export const MAX_DAYS_INACTIVE = 14;

export function reminderFor(player: ReminderPlayer, lastSentAt: string | null, now: Date = new Date()): Reminder | null {
  if (player.status === "retired") return null;
  if (lastSentAt && now.getTime() - new Date(lastSentAt).getTime() < MIN_HOURS_BETWEEN_PUSHES * 3_600_000) return null;
  // Entrar a jugar la carrera o el reto cuenta como actividad: quien solo juega el reto cada día no se queda sin avisos.
  const dc = player.flags?.dc_last !== undefined ? Date.UTC(2026, 0, 1) + (parseInt(String(player.flags.dc_last), 10) || 0) * 86_400_000 : 0;
  const active = Math.max(player.last_active_at ? new Date(player.last_active_at).getTime() : 0, dc);
  const daysAway = active ? (now.getTime() - active) / 86_400_000 : 99;
  if (daysAway > MAX_DAYS_INACTIVE) return null;
  const day = madridDay(now);
  const state = challengeState({ flags: player.flags ?? {} }, day);
  const name = displayName(player);

  if (!state.playedToday) {
    const c = challengeOfDay(day, player);
    if (state.streakAlive && state.streak >= 2) {
      return { title: `🔥 Tu racha de ${state.streak} días está en juego`, body: `Hoy: «${c.title}». Una decisión, un minuto.`, url: "/mi-jugador/reto", tag: "reto" };
    }
    // Quien lleva mucho sin entrar recibe uno de cada tres días, no uno al día.
    if (daysAway >= 4 && day % 3 !== 0) return null;
    if (daysAway >= 2) {
      return { title: `${name} te echa de menos`, body: `Tu carrera lleva ${Math.floor(daysAway)} días parada. Y hoy hay un reto nuevo: «${c.title}».`, url: "/carrera", tag: "vuelta" };
    }
    return { title: "🎯 Reto del día", body: `«${c.title}» · ${c.stage}. Es la misma jugada para todos.`, url: "/mi-jugador/reto", tag: "reto" };
  }
  // Ya jugó el reto: solo se le avisa si la carrera lleva días parada.
  if (daysAway >= 3 && day % 3 === 0) {
    return { title: `${name} tiene decisiones pendientes`, body: "Tu carrera sigue esperando: cada escena cuenta.", url: "/carrera", tag: "vuelta" };
  }
  return null;
}
