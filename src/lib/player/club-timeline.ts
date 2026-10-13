/**
 * En qué club estabas al cerrar cada temporada. Lo normal es que lo diga flags.club_s<n> (se anota turno a turno);
 * para temporadas anteriores a ese registro se reconstruye con los fichajes guardados en el historial de decisiones
 * (cada fichaje deja `club` en sus consecuencias) y con la lista de clubes anteriores (flags.clubs_history).
 */
import { WEEKS_PER_SEASON } from "@/types/career";

export interface ClubChange {
  week: number;
  club: string;
}


export function clubAtSeasonEnd(
  flags: Record<string, string | boolean> | null | undefined,
  seasonIdx: number,
  changes: ClubChange[],
  currentClub: string,
): string {
  const stored = String(flags?.[`club_s${seasonIdx}`] ?? "");
  if (stored) return stored;
  const end = (seasonIdx + 1) * WEEKS_PER_SEASON;
  const sorted = [...changes].sort((a, b) => a.week - b.week);
  const upTo = sorted.filter((c) => c.week <= end);
  if (upTo.length > 0) return upTo[upTo.length - 1].club;
  // Ningún fichaje hasta entonces: el primer club que tuviste (si has cambiado alguna vez) o el actual.
  const first = String(flags?.clubs_history ?? "").split("|").filter(Boolean)[0];
  return first || currentClub;
}
