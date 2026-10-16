"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { applyConsequences } from "@/lib/narrative/engine";
import { probeClub } from "@/lib/narrative/market-explorer";
import type { Player } from "@/types/player";

/**
 * Pide a tu representante que tantee a un club. Se decide en código (market-explorer.ts); el resultado queda en el historial y se
 * enseña en la pantalla de consecuencias. Si cuaja, la oferta formal llega como siempre. No avanza la semana ni toca la escena pendiente.
 */
export async function sondearClub(formData: FormData) {
  const club = String(formData.get("club") ?? "");
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) redirect("/login");

  const result = probeClub(player as Player, club);
  if ("error" in result) redirect("/carrera/mercado?error=" + encodeURIComponent(result.error));

  const consequences = { moral: result.moral, flags: result.flags };
  const patch = applyConsequences(player as Player, consequences);
  const flags = { ...(player.flags ?? {}), ...result.flags };
  const { data: updated, error } = await supabase.from("players").update({ ...patch, flags }).eq("id", player.id).select("id");
  if (error || !updated || updated.length !== 1) {
    console.error("[sondearClub] no se pudo guardar:", error?.message);
    redirect("/carrera/mercado?error=" + encodeURIComponent("No se pudo guardar el sondeo. Inténtalo de nuevo."));
  }

  const { data: inserted } = await supabase
    .from("career_events")
    .insert({
      player_id: player.id,
      week: player.week,
      event_id: `mercado-sondeo-${player.week}-${club.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
      category: "representante",
      title: result.title,
      description: result.description,
      chosen_option_id: "sondeo",
      chosen_option_label: result.label,
      free_text_response: null,
      consequences,
      outcome_text: result.outcomeText,
    })
    .select("id")
    .single();

  revalidatePath("/carrera");
  revalidatePath("/carrera/mercado");
  redirect(inserted ? `/carrera/resultado/${inserted.id}` : "/carrera/mercado");
}
