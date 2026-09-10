import { careerStatus } from "./career-life";
import { clubDef } from "./data";
import type { GameState } from "./types";

export type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";

const NORMALIZED: Record<string, string> = {
  espana: "España", spain: "España", argentina: "Argentina", brasil: "Brasil", brazil: "Brasil",
  portugal: "Portugal", francia: "Francia", france: "Francia", alemania: "Alemania", germany: "Alemania",
  italia: "Italia", italy: "Italia", inglaterra: "Inglaterra", england: "Inglaterra", paisesbajos: "Países Bajos",
  netherlands: "Países Bajos", mexico: "México", mejico: "México", usa: "Estados Unidos", estadosunidos: "Estados Unidos",
  uruguay: "Uruguay", colombia: "Colombia", chile: "Chile", peru: "Perú", ecuador: "Ecuador",
  marruecos: "Marruecos", morocco: "Marruecos", senegal: "Senegal", nigeria: "Nigeria", japon: "Japón", japan: "Japón",
  coreadelsur: "Corea del Sur", southkorea: "Corea del Sur", australia: "Australia", nuevazelanda: "Nueva Zelanda",
};

const CONMEBOL = new Set(["Argentina", "Brasil", "Uruguay", "Colombia", "Chile", "Perú", "Ecuador", "Paraguay", "Bolivia", "Venezuela"]);
const CONCACAF = new Set(["México", "Estados Unidos", "Canadá", "Costa Rica", "Panamá", "Jamaica"]);
const CAF = new Set(["Marruecos", "Senegal", "Nigeria", "Ghana", "Camerún", "Costa de Marfil", "Argelia", "Egipto", "Túnez"]);
const AFC = new Set(["Japón", "Corea del Sur", "Australia", "Arabia Saudí", "Irán", "Qatar", "Emiratos Árabes Unidos"]);
const OFC = new Set(["Nueva Zelanda", "Fiyi", "Tahití"]);

function clean(v: string): string {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
}

export function normalizedNationality(value: string): string {
  const key = clean(value || "España");
  return NORMALIZED[key] ?? value.trim() || "España";
}

export function confederationFor(nationality: string): Confederation {
  const n = normalizedNationality(nationality);
  if (CONMEBOL.has(n)) return "CONMEBOL";
  if (CONCACAF.has(n)) return "CONCACAF";
  if (CAF.has(n)) return "CAF";
  if (AFC.has(n)) return "AFC";
  if (OFC.has(n)) return "OFC";
  return "UEFA";
}

export function continentalTournament(nationality: string): string {
  switch (confederationFor(nationality)) {
    case "CONMEBOL": return "Copa América";
    case "CONCACAF": return "Copa Oro";
    case "CAF": return "Copa Africana de Naciones";
    case "AFC": return "Copa Asiática";
    case "OFC": return "Copa de Naciones de la OFC";
    default: return "Eurocopa";
  }
}

/** Calendar years are derived from 2026/27 as season zero. */
export function seasonStartYear(s: GameState): number { return 2026 + s.seasonIndex; }

/** Major international competitions only appear on their real four-year rhythm. */
export function majorInternationalTournament(s: GameState): string | null {
  const year = seasonStartYear(s) + 1;
  if (year >= 2030 && (year - 2030) % 4 === 0) return "Copa Mundial de la FIFA";
  const confed = confederationFor(s.player.nationality);
  if (confed === "UEFA" && year >= 2028 && (year - 2028) % 4 === 0) return "Eurocopa";
  if (confed === "CONMEBOL" && year >= 2028 && (year - 2028) % 4 === 0) return "Copa América";
  if (confed === "CONCACAF" && year >= 2027 && (year - 2027) % 4 === 0) return "Copa Oro";
  if (confed === "CAF" && year >= 2027 && (year - 2027) % 2 === 0) return "Copa Africana de Naciones";
  if (confed === "AFC" && year >= 2027 && (year - 2027) % 4 === 0) return "Copa Asiática";
  if (confed === "OFC" && year >= 2028 && (year - 2028) % 4 === 0) return "Copa de Naciones de la OFC";
  return null;
}

/** Merit gate: no major senior tournament for an unknown academy player. */
export function seniorInternationalEligible(s: GameState): boolean {
  const status = careerStatus(s);
  if (s.stage !== "first" || s.age < 18 || s.overall < 77) return false;
  if (status === "prospect" || status === "squad") return false;
  return s.fame >= 35 || s.overall >= 81;
}

/** European nights require a first-team player at a genuinely qualifying club. */
export function europeanStoryEligible(s: GameState): boolean {
  if (s.stage !== "first" || s.age < 18) return false;
  const club = clubDef(s.clubId);
  if (club.tier !== 1 || club.prestige < 3) return false;
  if (club.prestige >= 5) return true;
  if (club.prestige === 4) return s.tablePosition <= 7;
  return s.tablePosition <= 6;
}

export type KeyMatchKind = "debut" | "derby" | "cup" | "europe" | "title_decider" | "exclub" | "international" | "major_tournament";

/** Ordered narrative menu; the engine can sample from this without inventing implausible finals. */
export function eligibleKeyMatchKinds(s: GameState): KeyMatchKind[] {
  const out: KeyMatchKind[] = ["debut", "derby", "cup", "title_decider"];
  if (europeanStoryEligible(s)) out.push("europe");
  if (s.memory.rejectedClubs.length || s.memory.conflicts.length) out.push("exclub");
  if (seniorInternationalEligible(s)) {
    out.push("international");
    if (majorInternationalTournament(s)) out.push("major_tournament");
  }
  return out;
}
