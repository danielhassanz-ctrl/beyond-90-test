/**
 * Reparación de compras antiguas "al contado" que en realidad no se pagaron
 * enteras: antes un coche, yate o jet se ofrecía sin comprobar el dinero, y al
 * pagar más de lo que había en la cuenta solo se descontaba lo que había (el
 * patrimonio no baja de 0). La propiedad quedaba guardada como pagada entera
 * y el resto del precio desaparecía. Aquí se recupera lo que de verdad se pagó
 * (está en el historial de decisiones) y el resto pasa a ser un préstamo con
 * su cuota, como una compra financiada normal.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import { readProperties, serializeProperty, vehicleFinancing } from "@/lib/finance/mortgage";
import { findVehicleKind } from "@/lib/narrative/events";

export async function repairCashPurchases(supabase: SupabaseClient, player: Player): Promise<boolean> {
  if (player.flags?.fix_cash_props_v1) return false;
  const candidates = readProperties(player.flags).filter((p) => p.downPayment >= p.price && p.price >= 30000 && findVehicleKind(p.name));
  if (candidates.length === 0) return false;

  const patch: Record<string, string | boolean> = {};
  for (const p of candidates) {
    const kind = findVehicleKind(p.name)!;
    const { data } = await supabase
      .from("career_events")
      .select("chosen_option_label, consequences")
      .eq("player_id", player.id)
      .ilike("chosen_option_label", `${p.name}%`)
      .limit(1);
    const row = data?.[0] as { consequences?: { patrimonio?: number } } | undefined;
    const paid = Math.abs(row?.consequences?.patrimonio ?? 0);
    if (!row || paid <= 0 || paid >= p.price * 0.9) continue;
    const f = vehicleFinancing(kind, p.price);
    patch[p.key] = serializeProperty({ ...p, downPayment: paid, termMonths: f.termMonths, rate: f.rate, kind });
  }
  const flags = { ...(player.flags ?? {}), ...patch, fix_cash_props_v1: "1" };
  const { error } = await supabase.from("players").update({ flags }).eq("id", player.id);
  if (error) return false;
  player.flags = flags;
  return Object.keys(patch).length > 0;
}
