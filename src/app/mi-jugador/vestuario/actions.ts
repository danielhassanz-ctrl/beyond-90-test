"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { applyConsequences } from "@/lib/narrative/engine";
import { doMateAction, type MateActionId, type MateRole } from "@/lib/narrative/locker-room";
import { mergeFlagsForWrite } from "@/lib/supabase/flags";
import type { Player } from "@/types/player";

/**
 * Dedica tiempo a un compañero del vestuario (charlar, cenar, pedir consejo, tender la mano). Se decide en código
 * (narrative/locker-room.ts); queda en el historial y se enseña en la pantalla de consecuencias. No avanza la semana ni toca la escena pendiente.
 */
export async function dedicarTiempo(formData: FormData) {
  const key = String(formData.get("key") ?? "") as MateRole;
  const action = String(formData.get("action") ?? "") as MateActionId;
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) redirect("/login");

  const result = doMateAction(player as Player, key, action);
  if ("error" in result) redirect("/mi-jugador/vestuario?error=" + encodeURIComponent(result.error));

  const consequences = { moral: result.moral, rel_vestuario: result.rel_vestuario, patrimonio: result.patrimonio, flags: result.flags };
  const patch = applyConsequences(player as Player, consequences);
  const start = (player.flags ?? {}) as Record<string, string | boolean>;
  const flags = await mergeFlagsForWrite(supabase, player.id, start, { ...start, ...result.flags });
  const { data: updated, error } = await supabase.from("players").update({ ...patch, flags }).eq("id", player.id).select("id");
  if (error || !updated || updated.length !== 1) {
    console.error("[dedicarTiempo] no se pudo guardar:", error?.message);
    redirect("/mi-jugador/vestuario?error=" + encodeURIComponent("No se pudo guardar. Inténtalo de nuevo."));
  }

  const { data: inserted } = await supabase
    .from("career_events")
    .insert({
      player_id: player.id,
      week: player.week,
      event_id: `vestuario-${action}-${key}-${player.week}`,
      category: "vestuario",
      title: "Tiempo con un compañero",
      description: "Aprovechas para estar con alguien del vestuario.",
      chosen_option_id: action,
      chosen_option_label: action,
      free_text_response: null,
      consequences,
      outcome_text: result.text,
    })
    .select("id")
    .single();

  revalidatePath("/mi-jugador/vestuario");
  revalidatePath("/mi-jugador/vida");
  redirect(inserted ? `/carrera/resultado/${inserted.id}` : "/mi-jugador/vestuario");
}
