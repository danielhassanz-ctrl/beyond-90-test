/**
 * Sistema de dinámica de carrera futbolística REALISTA.
 * Modela: forma que degrada, presión mediática, momento de pico, lesiones que duran,
 * relaciones que se deterioran, edad que afecta rendimiento.
 */

import type { Player } from "@/types/player";
import { playerAge } from "@/types/career";

/**
 * Calcula el "career arc" - en qué momento de la carrera está.
 * Los futbolistas tienen: ascenso, pico, decline.
 */
export interface CareerArc {
  phase: "ascenso" | "pico" | "decline";
  intensity: number; // 0-100: qué tan pronunciado el cambio
  yearsInPhase: number;
  expectedDuration: number; // Semanas esperadas en esta fase
}

export function calculateCareerArc(player: Player): CareerArc {
  const age = playerAge(player.week);
  const matches = player.stats_matches_played || 1;
  const media = player.media || 40;

  // Ascenso: 16-25 años, media creciendo
  if (age < 25 && media < 75) {
    return {
      phase: "ascenso",
      intensity: Math.max(0, media / 75),
      yearsInPhase: age - 16,
      expectedDuration: 10, // Típicamente 2-3 temporadas
    };
  }

  // Pico: 25-32 años, media máxima
  if (age >= 25 && age < 32) {
    return {
      phase: "pico",
      intensity: media > 80 ? 1 : media / 80,
      yearsInPhase: age - 25,
      expectedDuration: 7, // ~2-3 temporadas en pico
    };
  }

  // Decline: 32+ años
  return {
    phase: "decline",
    intensity: Math.max(0, 1 - (age - 32) / 10),
    yearsInPhase: age - 32,
    expectedDuration: 3, // Decline típicamente 2-4 años
  };
}

/**
 * Degrada forma naturalmente cada semana si no juega.
 * Mejora si juega bien (media sube).
 */
export function naturalFormaDegradation(player: Player): number {
  const arc = calculateCareerArc(player);
  const formaBefore = player.forma || 50;

  // Forma degrada -2 a -5 por semana sin competición
  let formaChange = -2;

  // Si es fase decline, degrada más rápido
  if (arc.phase === "decline") {
    formaChange = -4;
  }

  // Si acaba de jugar bien (media subió recientemente), forma sube
  if (player.media && player.media > 75) {
    formaChange = 2; // Recuperación por buen desempeño
  }

  // Forma se mueve en escala 10-100, igual que el resto de barras del
  // juego — sin el techo, la rama de "recuperación" (+2 con media alta)
  // podía dejarla en 101+ una vez la media rondaba el máximo (visto en
  // vivo jugando: Forma 101).
  return Math.max(10, Math.min(100, formaBefore + formaChange));
}

/**
 * Presión mediática que aumenta con fama.
 * Afecta moral y puede causar eventos especiales.
 */
export function calculateMediaPressure(player: Player): {
  level: "baja" | "media" | "alta" | "extrema";
  mortalAfect: number;
} {
  const fama = player.fama || 50;
  const media = player.media || 50;

  // Presión baja: fama baja, media baja
  if (fama < 30 && media < 60) {
    return { level: "baja", mortalAfect: 0 };
  }

  // Presión media: fama 30-60, media 60-75
  if (fama < 60 && media < 75) {
    return { level: "media", mortalAfect: -1 };
  }

  // Presión alta: fama 60-85, o media >80
  if (fama < 85 || media > 80) {
    return { level: "alta", mortalAfect: -3 };
  }

  // Presión extrema: fama 85+, media 90+
  return { level: "extrema", mortalAfect: -5 };
}

/**
 * Relaciones que se deterioran si las ignoras.
 * Ejemplo: rel_entrenador baja si moral baja constantemente.
 */
export function deteriorateRelationships(player: Player): Record<string, number> {
  const updates: Record<string, number> = {};

  // Si moral es muy baja, relación con entrenador sufre
  if (player.moral < 30) {
    updates.rel_entrenador = (player.rel_entrenador || 50) - 2;
  }

  // Si forma es muy baja, afición se decepciona
  if (player.forma < 30) {
    updates.rel_aficion = (player.rel_aficion || 50) - 3;
  }

  // Si cambias de club (club differs from second_club?), algunos relacionan deterioran
  // Esto se maneja en events, not aquí

  return updates;
}

/**
 * Determina si el jugador DEBE enfrentar un evento de decline/reflexión.
 * Encía es rutina, deprimido, o ha pasado pico.
 */
export function shouldTriggerDeclineReflection(player: Player): boolean {
  const arc = calculateCareerArc(player);
  const age = playerAge(player.week);

  // Si es fase decline y lleva >2 años decline, reflexión
  if (arc.phase === "decline" && arc.yearsInPhase > 2) {
    return true;
  }

  // Si edad >34 y media está bajando consistentemente
  if (age > 34 && (player.media || 50) < 60) {
    return true;
  }

  // Si forma está cronicamente baja (<25) y moral está bajo (<40)
  if (player.forma < 25 && player.moral < 40) {
    return true;
  }

  return false;
}

/**
 * Cuenta atrás real de una lesión larga: cada turno resuelto después de
 * que empieza (ver INJURY_LONG_DURATION_WEEKS en engine.ts, que crea el
 * flag "injury_duration_*" cuando se dispara la adversidad injury_long)
 * descuenta una semana y resta forma, con penalización más fuerte al
 * principio que se suaviza según se acerca la vuelta. Antes de esto, el
 * flag existía en el tipo pero ningún camino activo lo creaba ni lo leía
 * de forma persistente: toda lesión era un golpe de un solo turno, nunca
 * una baja real de varias semanas.
 */
export function tickInjury(
  flags: Record<string, string | boolean> | null | undefined,
): { flagKey: string; newValue: string | null; formaDelta: number } | null {
  if (!flags) return null;

  const injuryKey = Object.keys(flags).find((k) => k.startsWith("injury_duration_"));
  if (!injuryKey) return null;

  const remaining = parseInt(String(flags[injuryKey]), 10) || 0;

  if (remaining <= 1) {
    // Última semana de baja: se cura, sin penalización adicional.
    return { flagKey: injuryKey, newValue: null, formaDelta: 0 };
  }

  const formaDelta = -Math.max(2, Math.round(remaining * 1.3));
  return { flagKey: injuryKey, newValue: String(remaining - 1), formaDelta };
}

/**
 * Peak performance: en el pico (edad 26-30, media 85+), todo es óptimo.
 * Pequeñas mejoras tienen grandes impactos.
 */
export function isPeakPerformance(player: Player): boolean {
  const age = playerAge(player.week);
  const media = player.media || 50;

  return age >= 26 && age <= 30 && media >= 80;
}

/**
 * Declive natural por edad: después de 32 años.
 * Cada año: media baja 1-2 puntos naturalmente.
 */
export function ageBasedMediaDecline(player: Player): number {
  const age = playerAge(player.week);
  const media = player.media || 50;

  // Sin declive por edad: devuelve la media TAL CUAL, no 0 — un 0 aquí se
  // interpretaba en el caller como "la media después del declive es 0" y
  // machacaba la media real de cualquier jugador menor de 32 años. Este
  // bug llevaba dormido desde siempre porque nada guardaba el resultado
  // de esta función hasta esta misma sesión (ver applyCareerDynamics en
  // engine.ts) — al conectar la persistencia, el bug se volvió real y
  // visible: media a 0 en un jugador de 16 años, visto en vivo jugando.
  if (age < 32) return media;

  // 1-2 puntos por año después de 32, con el mismo suelo de 40 que usa
  // el resto del juego para la media (ver clampMedia en engine.ts).
  const yearsAfter32 = age - 32;
  const decline = yearsAfter32 * 1.5;

  return Math.max(40, media - decline);
}
