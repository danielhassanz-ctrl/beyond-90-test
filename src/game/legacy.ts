import { netWorth, totalDebt } from "./finance";
import type { GameState } from "./types";

export type LegacyTier = "local" | "respected" | "icon" | "legend";

export interface LegacySnapshot {
  score: number;
  tier: LegacyTier;
  title: string;
  summary: string;
  pillars: { football: number; people: number; wealth: number; identity: number };
}

const clamp100 = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

export function legacySnapshot(s: GameState): LegacySnapshot {
  const titles = s.titles?.length ?? 0;
  const achievements = s.achievements?.length ?? 0;
  const seasons = s.seasons?.length ?? 0;
  const worth = Math.max(0, netWorth(s));
  const debt = Math.max(0, totalDebt(s));

  const football = clamp100((s.overall - 55) * 1.45 + Math.min(26, titles * 4) + Math.min(18, achievements * 1.5) + Math.min(10, seasons * 0.45) + s.fame * 0.12);
  const people = clamp100((s.rel.family + s.rel.dressing + s.rel.fans + s.rel.coach) / 4 + (s.flags["familia_ayudada"] === 1 ? 8 : 0) + (s.flags["lobo_solitario"] === 1 ? -8 : 0) + (s.flags["guerra_grada"] === 1 ? -10 : 0));
  const wealth = clamp100(Math.min(82, Math.log10(Math.max(10, worth + 10)) * 22) - Math.min(24, Math.log10(Math.max(10, debt + 10)) * 8) + (s.flags["fondo"] === 1 ? 5 : 0) + (s.flags["restaurante"] === 1 || s.flags["negocio_amigo"] === 1 ? 3 : 0));
  const identity = clamp100(s.discipline * 0.34 + s.morale * 0.14 + s.fame * 0.16 + people * 0.24 + (s.flags["patrocinio_rechazado"] === 1 ? 5 : 0) + (s.flags["coche_absurdo"] === 1 ? -2 : 0));
  const score = clamp100(football * 0.48 + people * 0.22 + wealth * 0.12 + identity * 0.18);

  let tier: LegacyTier = "local";
  if (score >= 86) tier = "legend";
  else if (score >= 72) tier = "icon";
  else if (score >= 55) tier = "respected";

  const title = tier === "legend" ? "Leyenda" : tier === "icon" ? "Icono" : tier === "respected" ? "Carrera respetada" : "Nombre de vestuario";
  const strengths = [
    { value: football, text: "lo que hiciste en el césped" },
    { value: people, text: "cómo trataste a la gente" },
    { value: wealth, text: "lo que construiste fuera del campo" },
    { value: identity, text: "la identidad que dejaste" },
  ].sort((a, b) => b.value - a.value);
  const weak = [...strengths].sort((a, b) => a.value - b.value)[0]!;
  const summary = `Te recuerdan sobre todo por ${strengths[0]!.text}. Tu punto más discutido fue ${weak.text}. Patrimonio neto final: ${worth}.000 €${debt > 0 ? `, con ${debt}.000 € pendientes` : ""}.`;

  return { score, tier, title, summary, pillars: { football, people, wealth, identity } };
}

export function postCareerFit(s: GameState, path: "coach" | "agent" | "president"): number {
  const l = legacySnapshot(s);
  if (path === "coach") return clamp100(l.pillars.football * 0.55 + l.pillars.people * 0.25 + s.discipline * 0.2);
  if (path === "agent") return clamp100(l.pillars.people * 0.35 + l.pillars.identity * 0.25 + l.pillars.wealth * 0.2 + s.fame * 0.2);
  return clamp100(l.pillars.wealth * 0.35 + l.pillars.people * 0.25 + l.pillars.identity * 0.2 + s.fame * 0.2);
}
