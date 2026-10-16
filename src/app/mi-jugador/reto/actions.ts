"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { applyConsequences } from "@/lib/narrative/engine";
import { playChallenge } from "@/lib/narrative/daily-challenge";
import { mergeFlagsForWrite } from "@/lib/supabase/flags";
import type { Player } from "@/types/player";

/**
 * Juega el reto de hoy con la opción elegida. Una vez por día (hora de Madrid), con tirada fija: recargar o reenviar no cambia
 * el resultado. El premio se aplica a la carrera. No avanza la semana ni toca la escena pendiente.
 */
export async function jugarReto(formData: FormData) {
  const optionId = String(formData.get("option") ?? "");
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) redirect("/login");

  const result = playChallenge(player as Player, optionId);
  if ("error" in result) redirect("/mi-jugador/reto?error=" + encodeURIComponent(result.error));

  const consequences = { fama: result.fama, moral: result.moral, rel_aficion: result.rel_aficion, patrimonio: result.patrimonio, flags: result.flags };
  const patch = applyConsequences(player as Player, consequences);
  const start = (player.flags ?? {}) as Record<string, string | boolean>;
  const flags = await mergeFlagsForWrite(supabase, player.id, start, { ...start, ...result.flags });
  const { data: updated, error } = await supabase.from("players").update({ ...patch, flags }).eq("id", player.id).select("id");
  if (error || !updated || updated.length !== 1) {
    console.error("[jugarReto] no se pudo guardar:", error?.message);
    redirect("/mi-jugador/reto?error=" + encodeURIComponent("No se pudo guardar. Inténtalo de nuevo."));
  }

  revalidatePath("/mi-jugador/reto");
  revalidatePath("/mi-jugador");
  redirect("/mi-jugador/reto");
}
