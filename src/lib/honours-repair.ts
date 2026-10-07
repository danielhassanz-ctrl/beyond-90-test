/**
 * Reparación única del palmarés para partidas anteriores a la lista de trofeos:
 * un título ganado entonces pudo no dejar rastro. Se recuperan (1) las banderas
 * antiguas de Liga/Champions/Balón de Oro y (2) las finales de Champions/Europa/Copa
 * ganadas que están en el historial de partidos.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import { WEEKS_PER_SEASON } from "@/types/career";
import { allTrofeos, INDIVIDUAL, withTrofeo, writeTrofeos, type Trofeo, type TrofeoKind } from "@/lib/honours";

export async function repairTrophies(supabase: SupabaseClient, player: Player): Promise<boolean> {
  if (player.flags?.fix_trofeos_v1) return false;
  let list: Trofeo[] = allTrofeos(player);
  let changed = false;
  try {
    const { data } = await supabase
      .from("career_events")
      .select("title, description, category, week")
      .eq("player_id", player.id)
      .eq("category", "partido")
      .lte("week", player.week);
    for (const r of (data ?? []) as { title: string; description: string; week: number }[]) {
      const text = `${r.title} ${r.description}`.toLowerCase();
      if (!/\bfinal\b/.test(text) || /semifinal(?!.*\bfinal\b)/.test(text)) continue;
      const won = /te proclamas|levantas|campe[oó]n(?:es)? de|tu equipo gana|gana (?:a|en)|victoria/.test(text) && !/pierde|derrota|subcampe/.test(text);
      if (!won) continue;
      const kind: TrofeoKind | null = /champions league/.test(text) ? "champions" : /europa league/.test(text) ? "europa" : /copa del rey/.test(text) ? "copa" : null;
      if (!kind) continue;
      const next = withTrofeo(list, { s: Math.floor((r.week - 1) / WEEKS_PER_SEASON), k: kind, c: player.club });
      if (next) {
        list = next;
        changed = true;
      }
    }
  } catch (err) {
    console.error("[repairTrophies] falló:", err instanceof Error ? err.message : err);
  }
  const flags = { ...(player.flags ?? {}), fix_trofeos_v1: "1", ...(list.length > 0 ? { trofeos: writeTrofeos(list) } : {}) };
  const titles = list.filter((t) => !INDIVIDUAL.has(t.k)).length;
  const patch: Record<string, unknown> = { flags };
  if (titles > (player.stats_titles ?? 0)) patch.stats_titles = titles;
  const { error } = await supabase.from("players").update(patch).eq("id", player.id);
  if (error) return false;
  player.flags = flags;
  if (patch.stats_titles !== undefined) player.stats_titles = titles;
  return changed;
}
