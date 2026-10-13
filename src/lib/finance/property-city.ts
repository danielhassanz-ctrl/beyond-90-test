/**
 * La ciudad de cada propiedad. Se guarda al comprarla, pero las compras antiguas no la traían y se deducía «la de tu club
 * actual»: al cambiar de club, la casa o el yate de Liverpool pasaban a «ubicación sin registrar». Ahora (1) al irte de un
 * club se anota la ciudad de lo que compraste allí y (2) las propiedades sin ciudad se recuperan una vez con los fichajes
 * guardados (en qué club estabas la semana de la compra).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import { cityOfClub } from "@/lib/narrative/cities";
import { readProperties, serializeProperty } from "@/lib/finance/mortgage";
import { fetchAllRows } from "@/lib/supabase/fetchAll";

type Flags = Record<string, string | boolean>;

/** Al dejar un club: las propiedades sin ciudad compradas mientras estabas en él se quedan con la de ese club. */
export function stampPropertyCities(flags: Flags | null | undefined, leavingClub: string): Flags {
  const clubSince = parseInt(String(flags?.club_since ?? "0"), 10) || 0;
  const patch: Flags = {};
  for (const p of readProperties(flags)) {
    if (p.city || (p.since ?? 0) < clubSince) continue;
    patch[p.key] = serializeProperty({ ...p, city: cityOfClub(leavingClub) });
  }
  return patch;
}

/** Recupera la ciudad de las propiedades que no la tienen, según el club en el que estabas al comprarlas. */
export async function repairPropertyCities(supabase: SupabaseClient, player: Pick<Player, "id" | "club" | "flags">): Promise<boolean> {
  const missing = readProperties(player.flags).filter((p) => !p.city && (p.since ?? 0) > 0);
  if (missing.length === 0) return false;
  const { data } = await fetchAllRows<{ week: number; consequences: Record<string, unknown> | null }>((from, to) =>
    supabase.from("career_events").select("week, consequences").eq("player_id", player.id).order("id").range(from, to),
  );
  const changes = (data ?? [])
    .filter((e) => e.consequences && typeof e.consequences.club === "string" && e.consequences.club)
    .map((e) => ({ week: e.week as number, club: String(e.consequences!.club) }))
    .sort((a, b) => a.week - b.week);
  const first = String(player.flags?.clubs_history ?? "").split("|").filter(Boolean)[0] ?? player.club;
  const patch: Flags = {};
  for (const p of missing) {
    const at = changes.filter((c) => c.week <= (p.since ?? 0));
    const club = at.length > 0 ? at[at.length - 1].club : first;
    patch[p.key] = serializeProperty({ ...p, city: cityOfClub(club) });
  }
  const { data: cur } = await supabase.from("players").select("flags").eq("id", player.id).maybeSingle();
  const next = { ...((cur?.flags ?? player.flags ?? {}) as Flags), ...patch };
  const { data: saved } = await supabase.from("players").update({ flags: next }).eq("id", player.id).select("id");
  if (saved && saved.length === 1) {
    player.flags = next;
    return true;
  }
  return false;
}
