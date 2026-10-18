/**
 * LA PLAZA EUROPEA SALE DE LA LIGA. Antes cada club tenía su competición europea fija (el Betis jugaba siempre la Europa League; un Real Madrid
 * decimoquinto seguía en Champions; el campeón de Liga con el Cádiz nunca jugaba en Europa). Ahora, si se conoce cómo acabó tu club la Liga de la
 * temporada anterior (flag liga_pos_<temporada>, «puesto|puntos»), manda eso: los cuatro primeros, Champions; quinto a séptimo, Europa League; el
 * resto, nada. Sin ese dato (primeras temporadas, partidas antiguas) se mantiene la plaza habitual del club.
 */
type Flags = Record<string, string | boolean> | null | undefined;

export type EuroSpot = "champions" | "europa" | "none" | null;

export function euroSpotFor(flags: Flags, season: number, club?: string): EuroSpot {
  if (season < 1) return null;
  // La plaza es del club con el que acabaste esa Liga: si te has ido a otro, no te la llevas.
  const was = flags?.[`club_s${season - 1}`];
  if (club && typeof was === "string" && was && was !== club) return null;
  const raw = flags?.[`liga_pos_${season - 1}`];
  if (typeof raw !== "string" || !raw) return null;
  const rank = parseInt(raw.split("|")[0], 10);
  if (!Number.isFinite(rank) || rank < 1) return null;
  if (rank <= 4) return "champions";
  if (rank <= 7) return "europa";
  return "none";
}
