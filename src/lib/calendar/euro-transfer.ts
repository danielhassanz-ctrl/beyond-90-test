/**
 * Cambiar de club a mitad de temporada y la competición europea: el club te inscribe en su lista y entras en la fase en la que
 * está el equipo (antes solo se contaba si llegabas a un club que sigue vivo en Europa).
 *     Antes el progreso europeo se ponía a cero al fichar y, si llegabas después de la fase de grupos (enero), te quedabas
 *     «en la fase de grupos» para siempre: ni un partido de Champions hasta mayo.
 * Es una lógica de código (sin IA): el resultado queda en flags.euro_progress y, si procede, una frase en la reacción.
 */
import { getEuropeanCompetitionFor, EURO_GROUP_WEEKS, getClubLevel } from "@/lib/calendar/match-calendar";
import type { CupProgress } from "@/lib/calendar/competition-progress";
import { readSimSeason } from "@/lib/narrative/off-screen-matches";
import { continentalName } from "@/lib/calendar/leagues";

type Flags = Record<string, string | boolean>;

const lastGroupWeek = Math.max(...EURO_GROUP_WEEKS);

export function euroPlayedKey(season: number): string {
  return `euro_played_${season}`;
}

/** ¿Ha jugado ya una competición europea esta temporada con su club actual? */
export function hasPlayedEuropeThisSeason(flags: Flags | null | undefined, season: number): boolean {
  if (flags?.[euroPlayedKey(season)]) return true;
  const sim = readSimSeason(flags, season);
  return sim.champions.matches + sim.europa.matches > 0;
}

export function euroOnTransfer(
  flags: Flags | null | undefined,
  oldClub: string,
  newClub: string,
  week: number,
  media: number,
): { flagsPatch: Flags; note: string | null } {
  const season = Math.floor((week - 1) / 10);
  const weekInSeason = ((week - 1) % 10) + 1;
  const newComp = getEuropeanCompetitionFor(newClub);
  if (!newComp) return { flagsPatch: { euro_progress: "" }, note: null };
  const compName = continentalName(newClub, newComp.competition);

  // Un jugador fichado a mitad de temporada se puede inscribir en la competición europea del club nuevo (el club lo registra en la
  // lista): no hay límite por haberla jugado con otro club.
  void oldClub;

  // Llegas antes de que acabe la fase de grupos: juegas lo que quede con el equipo, sin cambios.
  if (weekInSeason <= lastGroupWeek) return { flagsPatch: { euro_progress: "" }, note: null };

  // Llegas con la fase de grupos ya jugada: entras en la ronda en la que está el equipo (se decide en código).
  const level = getClubLevel(newClub);
  const base = level === "grande" ? 0.88 : level === "europeo" ? 0.65 : 0.4;
  const mediaBonus = Math.min(0.08, Math.max(-0.08, (media - 65) / 300));
  const qualified = Math.random() < base + mediaBonus;
  const round = qualified ? Math.max(1, Math.min(4, weekInSeason >= 10 ? 3 : weekInSeason >= 9 ? 2 : 1)) : 0;
  const progress: CupProgress = { season, round, alive: qualified };
  return {
    flagsPatch: { euro_progress: JSON.stringify(progress) },
    note: qualified
      ? `${newClub} sigue vivo en ${compName} y llegas a tiempo de jugar las eliminatorias.`
      : `${newClub} ya se despidió de ${compName} en la fase de grupos: este año no habrá noches europeas.`,
  };
}

/**
 * Partidas que ficharon a mitad de temporada ANTES de esta regla: su progreso europeo se puso a cero y se quedaban «en la
 * fase de grupos» sin jugar nada hasta mayo. Se aplica una sola vez por temporada con lo que se sabe del traspaso.
 */
export async function repairEuroAfterTransfer(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  player: { id: string; club: string; week: number; media: number; flags: Flags | null },
): Promise<void> {
  const flags = player.flags ?? {};
  const season = Math.floor((player.week - 1) / 10);
  if (flags[`euro_fix2_${season}`]) return;
  const since = parseInt(String(flags.club_since ?? "0"), 10) || 0;
  if (since <= 0 || Math.floor((since - 1) / 10) !== season) return;
  const oldClub = String(flags.clubs_history ?? "").split("|").filter(Boolean).pop();
  if (!oldClub || oldClub === player.club) return;
  // Si ya hay progreso europeo guardado esta temporada, se respeta.
  try {
    const raw = flags.euro_progress;
    const parsed = typeof raw === "string" && raw ? (JSON.parse(raw) as CupProgress) : null;
    // Una inscripción exclusiva guardada por la regla anterior (tied) se deshace; cualquier otro progreso se respeta.
    if (parsed && parsed.season === season && !parsed.tied) return;
  } catch {
    // JSON corrupto: se recalcula
  }
  const move = euroOnTransfer(flags, oldClub, player.club, since, player.media);
  const next = { ...flags, ...move.flagsPatch, [`euro_fix2_${season}`]: "1" };
  const { data } = await supabase.from("players").update({ flags: next }).eq("id", player.id).select("id");
  if (data && data.length === 1) player.flags = next;
}
