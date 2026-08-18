import { ACHIEVEMENTS } from "./data";
import type { GameState, LogEntry, Relationships } from "./types";

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function seasonLabel(seasonIndex: number): string {
  const start = 2026 + seasonIndex;
  return `${start}/${String((start + 1) % 100).padStart(2, "0")}`;
}

/**
 * Relaciones: viven de forma natural entre 30 y 85. Pasar de 88 exige historia
 * excepcional (rendimientos y gestos repetidos), no una decisión suelta.
 */
export function rel(s: GameState, key: keyof Relationships, delta: number): void {
  const cur = s.rel[key];
  let d = delta;
  if (d > 0) {
    if (cur >= 88) d *= 0.25;
    else if (cur >= 78) d *= 0.5;
    else if (cur >= 68) d *= 0.75;
    d = Math.min(d, 12);
  } else {
    if (cur <= 20) d *= 0.4;
    else if (cur <= 32) d *= 0.7;
    d = Math.max(d, -14);
  }
  s.rel[key] = clamp(cur + d, 2, 96);
}

/** Regresión suave hacia la media: nada se queda clavado en 99 ni en 0. */
export function decayRelations(s: GameState): void {
  for (const key of Object.keys(s.rel) as (keyof Relationships)[]) {
    if (key === "agent" && !s.agent?.present) continue;
    const cur = s.rel[key];
    if (cur > 82) s.rel[key] = clamp(cur - 1, 2, 96);
    else if (cur < 34) s.rel[key] = clamp(cur + 1, 2, 96);
  }
}

/**
 * FORMA: rango habitual 30-88. Solo crisis extrema o inactividad larga la
 * hunden por debajo de 20. Cada escena la mueve como máximo 12 puntos.
 */
export function adjustForm(s: GameState, delta: number, crisis = false): void {
  const d = Math.max(-14, Math.min(14, delta * 1.4));
  const floor = crisis ? 6 : 30;
  s.form = clamp(Math.max(floor, Math.min(88, s.form + d)), 0, 100);
}

/** Deriva muy suave hacia 52: corrige extremos sin aplanar las rachas. */
export function driftForm(s: GameState): void {
  const target = 52;
  const diff = target - s.form;
  if (Math.abs(diff) <= 8) return;
  s.form = clamp(s.form + Math.sign(diff) * 1.5, 0, 100);
}

export function stat(
  s: GameState,
  key: "form" | "fitness" | "morale" | "discipline" | "fame" | "overall" | "potential",
  delta: number,
): void {
  // La MEDIA nunca sube por una decisión puntual: se convierte en progreso oculto
  // y se materializa al cerrar la temporada. Sí puede bajar (lesión, dejadez).
  if (key === "overall" && delta > 0) {
    s.xp += delta * 26;
    return;
  }
  if (key === "form") {
    adjustForm(s, delta);
    return;
  }
  s[key] = clamp(s[key] + delta, 0, key === "overall" || key === "potential" ? 99 : 100);
}


export function flag(s: GameState, key: string, value = 1): void {
  s.flags[key] = value;
}

export function note(s: GameState, text: string, tone: LogEntry["tone"] = "neutral"): void {
  s.log.unshift({ season: seasonLabel(s.seasonIndex), age: s.age, text, tone });
  if (s.log.length > 200) s.log.pop();
}

export function milestone(s: GameState, text: string): void {
  const current = s.seasons[s.seasons.length - 1];
  if (current && !current.milestones.includes(text)) current.milestones.push(text);
  note(s, text, "gold");
}

export function achieve(s: GameState, id: string): void {
  if (s.achievements.includes(id)) return;
  if (!ACHIEVEMENTS.some((a) => a.id === id)) return;
  s.achievements.push(id);
}

export function injure(s: GameState, matchesOut: number, label: string): void {
  const severity: "minor" | "medium" | "severe" = matchesOut >= 12 ? "severe" : matchesOut >= 5 ? "medium" : "minor";
  s.injury = { label, severity, matchesOut: Math.max(1, Math.round(matchesOut)), treated: false };
  s.fitness = clamp(s.fitness - 18);
  s.form = clamp(s.form - 12);
  note(s, `Lesión: ${label} (baja estimada de ${s.injury.matchesOut} partidos).`, "bad");
}

export function hasTrait(s: GameState, id: string): boolean {
  return s.player.traits.includes(id as never);
}

export function currentSeason(s: GameState) {
  return s.seasons[s.seasons.length - 1];
}

export function seasonRatingAvg(s: GameState): number {
  const cur = currentSeason(s);
  if (!cur || !cur.apps) return 0;
  return Math.round((cur.ratingSum / cur.apps) * 10) / 10;
}

export function totalApps(s: GameState): number {
  return s.seasons.reduce((a, x) => a + x.apps, 0);
}

export function totalGoals(s: GameState): number {
  return s.seasons.reduce((a, x) => a + x.goals, 0);
}

export function avgRating(s: GameState): number {
  const apps = totalApps(s);
  if (!apps) return 0;
  const sum = s.seasons.reduce((a, x) => a + x.ratingSum, 0);
  return Math.round((sum / apps) * 10) / 10;
}
