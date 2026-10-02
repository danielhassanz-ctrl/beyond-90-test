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
  const media = player.media || 40;

  // Ascenso: 16-25 años, sea cual sea su media — antes exigía media < 75,
  // así que un canterano precoz con media ya alta (un futuro crack que
  // despunta pronto) no encajaba aquí NI en "pico" (que exige 25+ años),
  // y caía por defecto en "decline" a los 17 años. Encontrado probando el
  // ajuste de forma de abajo: la fase es sobre la EDAD, la media solo
  // describe la intensidad de esa fase.
  if (age < 25) {
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

  // Antes esto era "el rico se hace más rico": -2 de forma cada semana
  // salvo que la media ya estuviera por encima de 75, caso en el que se
  // recuperaba sola. Un jugador todavía normal (la inmensa mayoría de
  // cualquier carrera, sobre todo al principio) sangraba forma sin parar
  // justo en el tramo donde más le costaba llegar a rendir lo bastante
  // bien como para entrar en esa zona de recuperación — un suelo
  // demasiado bajo para un juego pensado para enganchar, no para ser fiel
  // a que en la vida real casi nadie llega arriba. Pedido explícito tras
  // discutirlo: subir el suelo de las carreras normales sin tocar el
  // techo (Balón de Oro, Times Square... siguen exigiendo lo mismo).
  let formaChange = -1;

  if (arc.phase === "decline") {
    // La fase de decline SIEMPRE degrada fuerte, sin importar la media
    // que tengas — es a propósito: ni una leyenda escapa del cuerpo que
    // falla con la edad (ver las 7 escenas de buildReadyToRetireEvent en
    // career-transitions.ts, que cuentan justo esto).
    formaChange = -4;
  } else if (player.media && player.media > 55) {
    // Umbral bajado de 75 a 55: ya no hace falta ser una futura
    // superestrella para entrar en modo recuperación, basta con ser un
    // profesional decente — esto es lo que sube el suelo de verdad.
    formaChange = 2;
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
 * Turnos (meses) de baja que le quedan al jugador por lesión larga, o 0 si
 * está sano. Mientras sea > 0 no juega partidos ni ve jugadas decisivas.
 */
export function getInjuryRemaining(
  flags: Record<string, string | boolean> | null | undefined,
): number {
  if (!flags) return 0;
  const key = Object.keys(flags).find((k) => k.startsWith("injury_duration_"));
  if (!key) return 0;
  return Math.max(0, parseInt(String(flags[key]), 10) || 0);
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
