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

export interface MilestoneImageStatus {
  status: string;
  imageUrl: string | null;
}

/**
 * Comprueba el estado de la foto de UN hito concreto. La página del hito
 * se renderiza una sola vez en el servidor: si en ese momento la imagen
 * seguía "pending", la pantalla se quedaba con el spinner para siempre
 * aunque la foto ya hubiera terminado de generarse segundos después —
 * el único aviso de que ya estaba lista era el toast flotante global
 * (ImageReadyNotifier), fácil de no ver si el jugador se queda mirando
 * fijamente esta pantalla. Esto permite que la propia pantalla del hito
 * se refresque sola en cuanto cambia el estado.
 */
export async function getMilestoneImageStatus(milestoneId: string): Promise<MilestoneImageStatus | null> {
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) return null;

  const { data, error } = await supabase
    .from("milestones")
    .select("image_status, image_url")
    .eq("id", milestoneId)
    .eq("player_id", player.id)
    .maybeSingle();

  if (error || !data) return null;
  return { status: data.image_status, imageUrl: data.image_url };
}
