"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { applyConsequences } from "@/lib/narrative/engine";
import { doPressAction, PRESS_ACTIONS, type OutletKey, type PressActionId } from "@/lib/narrative/press-system";
import { mergeFlagsForWrite } from "@/lib/supabase/flags";
import type { Player } from "@/types/player";

/**
 * Un movimiento tuyo con la prensa o las redes (exclusiva, publicar, responder a un crítico). Se decide en código
 * (narrative/press-system.ts); queda en el historial y se enseña en la pantalla de consecuencias. No avanza la semana.
 */
export async function moverPrensa(formData: FormData) {
  const action = String(formData.get("action") ?? "") as PressActionId;
  const rawKey = String(formData.get("outlet") ?? "");
  const outlet = (rawKey === "afin" || rawKey === "neutral" || rawKey === "hostil" ? rawKey : undefined) as OutletKey | undefined;
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) redirect("/login");
  if (!Object.hasOwn(PRESS_ACTIONS, action)) redirect("/mi-jugador/prensa");

  const result = doPressAction(player as Player, action, outlet);
  if ("error" in result) redirect("/mi-jugador/prensa?error=" + encodeURIComponent(result.error));

  const consequences = { fama: result.fama, moral: result.moral, rel_aficion: result.rel_aficion, rel_vestuario: result.rel_vestuario, reputacion: result.reputacion, flags: result.flags };
  const patch = applyConsequences(player as Player, consequences);
  const start = (player.flags ?? {}) as Record<string, string | boolean>;
  const flags = await mergeFlagsForWrite(supabase, player.id, start, { ...start, ...result.flags });
  const { data: updated, error } = await supabase.from("players").update({ ...patch, flags }).eq("id", player.id).select("id");
  if (error || !updated || updated.length !== 1) {
    console.error("[moverPrensa] no se pudo guardar:", error?.message);
    redirect("/mi-jugador/prensa?error=" + encodeURIComponent("No se pudo guardar. Inténtalo de nuevo."));
  }

  const { data: inserted } = await supabase
    .from("career_events")
    .insert({
      player_id: player.id,
      week: player.week,
      event_id: `prensa-${action}-${outlet ?? "redes"}-${player.week}`,
      category: "prensa",
      title: PRESS_ACTIONS[action].label,
      description: PRESS_ACTIONS[action].hint,
      chosen_option_id: action,
      chosen_option_label: action,
      free_text_response: null,
      consequences,
      outcome_text: result.text,
    })
    .select("id")
    .single();

  revalidatePath("/mi-jugador/prensa");
  revalidatePath("/mi-jugador/vida");
  redirect(inserted ? `/carrera/resultado/${inserted.id}` : "/mi-jugador/prensa");
}
