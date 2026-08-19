/* =========================================================================
 * FASE 6 · Carrera profesional completa: etapas por edad, mercado y contratos,
 * competiciones, títulos y premios, economía ligera y retirada.
 * Módulo puro: no importa engine (evita ciclos). Reutiliza clubs/mutate/data.
 * ========================================================================= */
import { CLUB_POOL, defById, type ClubDef } from "./clubs";
import { clubDef } from "./data";
import { clamp, currentSeason, milestone, note, totalApps, totalGoals } from "./mutate";
import type { GameState } from "./types";

export type CareerPhase = "formacion" | "eclosion" | "consolidacion" | "prime" | "veterano" | "declive";

export function careerPhase(age: number): CareerPhase {
  if (age <= 18) return "formacion";
  if (age <= 21) return "eclosion";
  if (age <= 24) return "consolidacion";
  if (age <= 29) return "prime";
  if (age <= 32) return "veterano";
  return "declive";
}

export const PHASE_LABEL: Record<CareerPhase, string> = {
  formacion: "Formación",
  eclosion: "Eclosión",
  consolidacion: "Consolidación",
  prime: "Plenitud",
  veterano: "Veteranía",
  declive: "Últimos años",
};

/** Factor de crecimiento por edad: sube, se estabiliza y cae. */
export function ageGrowthFactor(age: number): number {
  if (age <= 18) return 1.3;
  if (age <= 21) return 1.15;
  if (age <= 24) return 0.9;
  if (age <= 27) return 0.55;
  if (age <= 29) return 0.3;
  if (age <= 31) return 0.12;
  return 0;
}

/**
 * Desgaste por edad, lesiones y falta de minutos. Se aplica al cerrar la
 * temporada y es lo que hace que una carrera tenga final, no meseta eterna.
 */
export function ageDecline(s: GameState): number {
  if (s.age <= 30) return 0;
  let d = s.age >= 35 ? 3 : s.age >= 33 ? 2 : 1;
  const season = currentSeason(s);
  const apps = season?.apps ?? 0;
  const rating = apps ? season!.ratingSum / apps : 0;
  if (rating >= 7.2 && apps >= 20) d -= 1;
  if (apps < 10) d += 1;
  if (s.injury?.severity === "severe") d += 1;
  if ((s.flags["lesiones_graves"] ?? 0) >= 2) d += 1;
  return Math.max(0, d);
}

/** Techo por edad: una media de 90+ solo es posible en la plenitud y con élite. */
export function overallCeiling(s: GameState): number {
  const club = clubDef(s.clubId);
  const phase = careerPhase(s.age);
  let cap = s.potential;
  if (phase === "formacion") cap = Math.min(cap, 70);
  else if (phase === "eclosion") cap = Math.min(cap, 78);
  else if (phase === "consolidacion") cap = Math.min(cap, 85);
  if (cap >= 88 && club.prestige < 4) cap = 87;
  if (cap >= 90 && club.prestige < 5) cap = 89;
  return Math.min(99, cap);
}

/* ============================ Economía ligera ============================ */

/** Ahorro neto de la temporada (miles de €). Reutiliza salary y patrocinios. */
export function accrueWealth(s: GameState): number {
  const sponsor = (s.flags["patrocinio"] ?? 0) > 0 ? 40 + Math.round(s.fame * 1.5) : 0;
  const gained = Math.round((s.salary + sponsor) * 0.55);
  s.wealth = Math.max(0, Math.round((s.wealth ?? 0) + gained));
  return gained;
}

/* ==================== Competiciones y grandes hitos ==================== */

export function europeanCompetition(s: GameState): string | null {
  if (s.stage !== "first") return null;
  const club = clubDef(s.clubId);
  if (club.tier !== 1) return null;
  if (club.prestige >= 5) return "UEFA Champions League";
  if (club.prestige === 4) return s.tablePosition <= 4 ? "UEFA Champions League" : "UEFA Europa League";
  if (club.prestige === 3 && s.tablePosition <= 6) return "UEFA Europa League";
  return null;
}

/** Selección nacional: solo con nivel y minutos que lo justifiquen. */
export function nationalCallup(s: GameState): boolean {
  if (s.stage !== "first" || s.age < 18) return false;
  const season = currentSeason(s);
  const apps = season?.apps ?? 0;
  const rating = apps ? season!.ratingSum / apps : 0;
  if (clubDef(s.clubId).tier !== 1) return false;
  return s.overall >= 78 && apps >= 20 && rating >= 6.9;
}

const ATTACKERS = ["DC", "EXT", "MCO"];

/**
 * Títulos y premios de la temporada con criterios exigentes.
 * El Balón de Oro exige élite mundial, títulos y suerte: es extraordinario.
 */
export function seasonHonours(s: GameState): { titles: string[]; awards: string[] } {
  const titles: string[] = [];
  const awards: string[] = [];
  if (s.stage !== "first") return { titles, awards };
  const club = clubDef(s.clubId);
  const season = currentSeason(s);
  const apps = season?.apps ?? 0;
  const goals = season?.goals ?? 0;
  const rating = apps ? season!.ratingSum / apps : 0;
  const euro = europeanCompetition(s);
  const elite = club.prestige >= 4;

  if (club.tier === 1 && s.tablePosition === 1 && elite) titles.push("LaLiga");
  if (club.tier === 2 && s.tablePosition <= 2) titles.push("Ascenso a Primera");
  if ((s.flags["copa_rondas"] ?? 0) >= 4 && Math.random() < (elite ? 0.45 : 0.2)) titles.push("Copa del Rey");
  if (euro === "UEFA Champions League" && club.prestige === 5 && s.tablePosition <= 3 && Math.random() < 0.15) {
    titles.push("UEFA Champions League");
  } else if (euro === "UEFA Europa League" && s.tablePosition <= 6 && Math.random() < 0.18) {
    titles.push("UEFA Europa League");
  }

  if (apps >= 25 && club.tier === 1) {
    if (ATTACKERS.includes(s.player.position) && goals >= 20) awards.push("Pichichi");
    if (s.player.position === "POR" && (season?.cleanSheets ?? 0) >= 15) awards.push("Trofeo Zamora");
    if (s.age <= 21 && rating >= 7.3) awards.push("Mejor jugador joven de LaLiga");
    if (rating >= 7.5 && s.overall >= 85) awards.push("Once ideal de LaLiga");
  }
  if (
    s.overall >= 90 &&
    rating >= 7.7 &&
    apps >= 28 &&
    club.prestige === 5 &&
    titles.some((t) => t === "UEFA Champions League" || t === "LaLiga") &&
    Math.random() < 0.25
  ) {
    awards.push("Balón de Oro");
  }

  s.titles = [...(s.titles ?? []), ...titles];
  s.awards = [...(s.awards ?? []), ...awards];
  for (const t of titles) milestone(s, `Título: ${t}.`);
  for (const a of awards) milestone(s, `Premio individual: ${a}.`);
  return { titles, awards };
}

/* ========================== Mercado y contratos ========================== */

/** Media mínima para que un club se plantee ficharte. */
export function requiredOverall(def: ClubDef): number {
  return def.tier === 1 ? 60 + def.prestige * 3 : 52 + def.prestige * 2;
}

export interface MarketProposal {
  kind: "transfer" | "renewal" | "loan";
  clubId: string;
  clubName: string;
  salary: number;
  years: number;
  reason: string;
}

/**
 * Ofertas coherentes: nadie regala un gigante a un jugador mediocre y un
 * veterano en declive solo recibe llamadas de clubes menores o cesiones.
 */
export function buildMarketProposal(s: GameState): MarketProposal | null {
  if (s.stage === "youth") return null;
  const club = clubDef(s.clubId);
  const season = currentSeason(s);
  const apps = season?.apps ?? 0;
  const rating = apps ? season!.ratingSum / apps : 0;
  const phase = careerPhase(s.age);

  // 1. Cesión: joven con ficha del primer equipo y sin minutos.
  if (s.stage === "first" && s.age <= 22 && apps < 10 && club.prestige >= 4) {
    const dest = pickClubForLevel(s, s.overall - 4, 2, club.id);
    if (dest) {
      return {
        kind: "loan",
        clubId: dest.id,
        clubName: dest.name,
        salary: Math.max(60, Math.round(s.salary * 0.8)),
        years: 1,
        reason: `${dest.name} te quiere cedido una temporada para que juegues cada domingo.`,
      };
    }
  }

  const bueno = rating >= 6.7 && apps >= 15;
  const malo = apps < 12 || rating < 6.3;

  // 2. Declive o irregularidad: ofertas a la baja.
  if ((phase === "declive" || (phase === "veterano" && malo)) && Math.random() < 0.55) {
    const dest = pickClubForLevel(s, s.overall - 6, club.tier === 1 && s.overall >= 72 ? 1 : 2, club.id);
    if (dest) {
      return {
        kind: "transfer",
        clubId: dest.id,
        clubName: dest.name,
        salary: Math.max(50, Math.round(s.salary * 0.7)),
        years: s.age >= 34 ? 1 : 2,
        reason: `${dest.name} ofrece minutos y galones, aunque con menos ficha.`,
      };
    }
  }

  // 3. Rendimiento alto: interés de clubes de más nivel.
  if (bueno && Math.random() < 0.7) {
    const better = CLUB_POOL.filter(
      (d) =>
        d.id !== club.id &&
        d.prestige >= club.prestige &&
        requiredOverall(d) <= s.overall + 1 &&
        !(d.prestige === 5 && (s.overall < 80 || s.fame < 55)),
    );
    const dest = better.length ? better[Math.floor(Math.random() * better.length)]! : null;
    if (dest && (dest.prestige > club.prestige || dest.tier < club.tier)) {
      return {
        kind: "transfer",
        clubId: dest.id,
        clubName: dest.name,
        salary: Math.max(s.salary + 80, Math.round(s.salary * 1.6) + dest.prestige * 60),
        years: 4,
        reason: `${dest.name} ha presentado una oferta formal por ti.`,
      };
    }
    // 4. Sin salto de nivel: renovación al alza.
    return {
      kind: "renewal",
      clubId: club.id,
      clubName: club.name,
      salary: Math.round(s.salary * 1.35) + 40,
      years: 3,
      reason: `El ${club.name} quiere renovarte y subirte la ficha antes de que llamen de fuera.`,
    };
  }
  return null;
}

function pickClubForLevel(s: GameState, level: number, tier: 1 | 2, excludeId: string): ClubDef | null {
  const pool = CLUB_POOL.filter(
    (d) => d.id !== excludeId && d.tier === tier && requiredOverall(d) <= level + 3 && requiredOverall(d) >= level - 12,
  );
  if (!pool.length) return null;
  const seed = (s.careerSeed ?? 1) + s.seasonIndex * 31 + Math.floor(Math.random() * 997);
  return pool[seed % pool.length]!;
}

/** Aplica un cambio de club manteniendo coherencia de etapa y plantilla. */
export function moveToClub(s: GameState, clubId: string, salary: number, years: number, loan = false): void {
  const dest = defById(clubId);
  if (!dest) return;
  const old = clubDef(s.clubId).name;
  if (!s.memory.rejectedClubs.includes(old)) s.memory.conflicts = s.memory.conflicts ?? [];
  s.clubId = clubId;
  s.stage = "first";
  s.salary = salary;
  s.contract = `${years} temporada${years > 1 ? "s" : ""} · ${salary}.000 €${loan ? " (cedido)" : ""}`;
  s.contractYears = years;
  s.flags["cedido"] = loan ? 1 : 0;
  s.flags["status"] = 0;
  s.flags["replan"] = 1;
  s.rel.fans = clamp(loan ? 40 : 45);
  s.rel.coach = clamp(48);
  s.rel.dressing = clamp(46);
  s.tablePosition = dest.prestige >= 4 ? 3 + Math.floor(Math.random() * 5) : 8 + Math.floor(Math.random() * 9);
  const season = currentSeason(s);
  if (season) season.club = dest.name;
  note(s, `${loan ? "Cesión" : "Fichaje"}: dejas el ${old} y firmas por el ${dest.name}.`, "gold");
  milestone(s, `${loan ? "Cedido al" : "Fichas por el"} ${dest.name}.`);
}

/* ============================== Retirada ============================== */

export function shouldRetire(s: GameState): boolean {
  if (s.retired) return false;
  if (s.age >= 40) return true;
  if (s.age < 32) return false;
  const season = currentSeason(s);
  const apps = season?.apps ?? 0;
  if (s.age >= 38) return true;
  if (s.age >= 34 && apps < 8) return true;
  if (s.age >= 33 && s.overall < 62 && Math.random() < 0.5) return true;
  if ((s.flags["lesiones_graves"] ?? 0) >= 3 && s.age >= 32) return true;
  return s.age >= 36 && Math.random() < 0.5;
}

export interface CareerSummary {
  clubs: string[];
  apps: number;
  goals: number;
  assists: number;
  seasons: number;
  peakOverall: number;
  titles: string[];
  awards: string[];
  wealth: number;
  tier: string;
}

export function careerTier(s: GameState): string {
  const peak = peakOverall(s);
  const awards = s.awards ?? [];
  const titles = s.titles ?? [];
  if (awards.includes("Balón de Oro") || (peak >= 90 && titles.length >= 3)) return "Leyenda mundial";
  if (peak >= 85 && titles.length >= 1) return "Top mundial";
  if (peak >= 80) return "Gran profesional";
  if (peak >= 72) return "Carrera profesional sólida";
  if (peak >= 65) return "Carrera modesta";
  return "Carrera truncada";
}

export function peakOverall(s: GameState): number {
  return Math.max(s.overall, ...s.seasons.map((x) => x.overall), 0);
}

export function careerSummary(s: GameState): CareerSummary {
  const clubs: string[] = [];
  for (const season of s.seasons) if (!clubs.includes(season.club)) clubs.push(season.club);
  return {
    clubs,
    apps: totalApps(s),
    goals: totalGoals(s),
    assists: s.seasons.reduce((a, b) => a + b.assists, 0),
    seasons: s.seasons.length,
    peakOverall: peakOverall(s),
    titles: s.titles ?? [],
    awards: s.awards ?? [],
    wealth: s.wealth ?? 0,
    tier: careerTier(s),
  };
}
