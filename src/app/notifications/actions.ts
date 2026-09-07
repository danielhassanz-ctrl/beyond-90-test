"use server";

import { getCurrentUserAndPlayer } from "@/lib/player";

export interface ReadyImageNotification {
  id: string;
  title: string;
}

/**
 * Comprueba si hay hitos con la foto ya lista que el jugador no ha visto
 * todavía (image_status='ready' && notified=false), y los marca como
 * notificados en el mismo paso — "notificado" significa "se le avisó",
 * no "ya la vio", así el aviso no se repite en cada sondeo.
 */
export async function checkReadyMilestoneNotifications(): Promise<ReadyImageNotification[]> {
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) return [];

  const { data, error } = await supabase
    .from("milestones")
    .select("id, title")
    .eq("player_id", player.id)
    .eq("image_status", "ready")
    .eq("notified", false);

  if (error) {
    console.error("[checkReadyMilestoneNotifications] query failed:", error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  const ids = data.map((m) => m.id);
  const { error: updateError } = await supabase.from("milestones").update({ notified: true }).in("id", ids);
  if (updateError) {
    console.error("[checkReadyMilestoneNotifications] mark-notified failed:", updateError.message);
  }

  return data;
}
