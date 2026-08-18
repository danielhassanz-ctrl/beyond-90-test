import { ACHIEVEMENTS } from "./data";
import type { GameState, LogEntry, Relationships } from "./types";

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function seasonLabel(seasonIndex: number): string {
  const start = 2026 + seasonIndex;
  return `${start}/${String((start + 1) % 100).padStart(2, "0")}`;
}

export function rel(s: GameState, key: keyof Relationships, delta: number): void {
  s.rel[key] = clamp(s.rel[key] + delta);
}

export function stat(
  s: GameState,
  key: "form" | "fitness" | "morale" | "discipline" | "fame" | "overall" | "potential",
  delta: number,
): void {
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

export function injure(s: GameState, weeks: number, label: string): void {
  s.injuryWeeks = weeks;
  s.injuryLabel = label;
  s.fitness = clamp(s.fitness - 18);
  s.form = clamp(s.form - 12);
  note(s, `Lesión: ${label} (${weeks} semanas fuera).`, "bad");
}

export function hasTrait(s: GameState, id: string): boolean {
  return s.player.traits.includes(id as never);
}

export function currentSeason(s: GameState) {
  return s.seasons[s.seasons.length - 1];
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
