/**
 * Los partidos que tu equipo juega sin ti (lesión larga, fuera de la convocatoria) también cuentan: la Copa y la
 * competición europea siguen su curso. Antes esas semanas eran una escena de «lo ves desde la grada» con un marcador
 * inventado que no movía nada: si estabas lesionado en el último partido de grupos de la Champions, el juego nunca decidía
 * si tu equipo pasaba, no había octavos ni cuartos, y la clasificación se quedaba en la fase de grupos para siempre.
 */
import type { Player } from "@/types/player";
import type { MatchWeek } from "@/lib/calendar/match-calendar";
import { getClubLevel } from "@/lib/calendar/match-calendar";
import { advanceCupProgress, decideKnockoutResult, resolveEuroGroupStage } from "@/lib/calendar/competition-progress";

export interface OffscreenOutcome {
  /** Marcador del partido de eliminatoria (solo Copa y eliminatorias europeas). */
  scoreLine?: string;
  win?: boolean;
  /** Una frase sobre lo que implica el resultado (pasa de ronda, se clasifica, cae eliminado…). */
  note: string | null;
  /** Si el equipo gana la final de Copa o de Europa sin ti. */
  trophy?: "copa" | "champions" | "europa";
}

/** Decide en código el partido que el jugador se pierde y actualiza el progreso de la competición. */
export function settleOffscreenMatch(player: Player, match: MatchWeek): OffscreenOutcome {
  const season = match.season;
  const media = player.media ?? 60;
  // Las mismas probabilidades que cuando juegas el partido (engine.ts): la ronda real y el nivel del club. Antes siempre «ronda 2» y sin bonus.
  const level = getClubLevel(player.club);
  const levelBonus = level === "grande" ? 0.1 : level === "europeo" ? 0.04 : -0.06;
  if (match.cupRound) {
    const res = decideKnockoutResult(media, match.cupRound, levelBonus);
    advanceCupProgress(player, "copa_progress", season, match.cupRound, res.win, { opp: match.rivalClub, score: res.scoreLine });
    const final = match.cupRound === 5;
    return {
      scoreLine: res.scoreLine,
      win: res.win,
      note: res.win ? (final ? "Tu equipo gana la final de Copa." : "Tu equipo pasa a la siguiente ronda de la Copa.") : "Tu equipo queda eliminado de la Copa.",
      ...(final && res.win ? { trophy: "copa" as const } : {}),
    };
  }
  if (match.euroKoRound) {
    const res = decideKnockoutResult(media, match.euroKoRound + 1, levelBonus);
    advanceCupProgress(player, "euro_progress", season, match.euroKoRound, res.win, { opp: match.rivalClub, score: res.scoreLine });
    const final = match.euroKoRound === 4;
    return {
      scoreLine: res.scoreLine,
      win: res.win,
      note: res.win ? (final ? "Tu equipo gana la final europea." : "Tu equipo pasa a la siguiente ronda europea.") : "Tu equipo queda eliminado de la competición europea.",
      ...(final && res.win ? { trophy: match.competition === "champions" ? ("champions" as const) : ("europa" as const) } : {}),
    };
  }
  if (match.euroGroupIndex === 2) {
    const qualified = resolveEuroGroupStage(player, season, getClubLevel(player.club));
    return { note: qualified ? "Con este resultado tu equipo se clasifica para las eliminatorias." : "Con este resultado tu equipo queda eliminado de la competición europea." };
  }
  return { note: null };
}
