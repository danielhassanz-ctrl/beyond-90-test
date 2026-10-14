"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { applyConsequences } from "@/lib/narrative/engine";
import { CLUB_REQUEST_KINDS, requestStatus, resolveClubRequest, type ClubRequestKind } from "@/lib/narrative/club-requests";
import type { Player } from "@/types/player";
import { stepPartner } from "@/lib/narrative/partner";

/**
 * «Hablar con el club»: pedir salir, una cesión, la renovación, una mejora de sueldo, más minutos o el brazalete. El club evalúa en
 * código (club-requests.ts) y contesta; el resultado queda en el historial y se enseña en la pantalla de consecuencias. No avanza
 * la semana ni toca la escena que tengas pendiente.
 */
export async function requestFromClub(formData: FormData) {
  const kind = String(formData.get("kind") ?? "") as ClubRequestKind;
  if (!CLUB_REQUEST_KINDS.includes(kind)) redirect("/carrera");
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) redirect("/login");

  const status = requestStatus(player, kind);
  if (!status.available) redirect("/carrera");

  const result = resolveClubRequest(player, kind);
  // Tu pareja opina de renovar o de irte según cómo lleve la ciudad: sube o baja la relación y lo dice en la reacción.
  const partnerStep = stepPartner(player.flags, {
    club: player.club,
    week: player.week,
    eventId: `club-request-${kind}`,
    optionFlags: result.consequences.flags,
    renewed: kind === "renovacion" && result.ok,
    leaving: (kind === "transferible" || kind === "cesion") && result.ok,
  });
  if (partnerStep.note) result.outcomeText = `${result.outcomeText} ${partnerStep.note}`;
  if (Object.keys(partnerStep.flags).length > 1) result.consequences = { ...result.consequences, flags: { ...result.consequences.flags, ...partnerStep.flags } };
  const patch = applyConsequences(player as Player, result.consequences);
  const flags = { ...(player.flags ?? {}), ...(result.consequences.flags ?? {}) };
  const { data: updated, error } = await supabase.from("players").update({ ...patch, flags }).eq("id", player.id).select("id");
  // Sin error no es éxito: una política que descarta el UPDATE tampoco lo da (ver la nota de RLS del proyecto).
  if (error || !updated || updated.length !== 1) {
    console.error("[requestFromClub] no se pudo guardar:", error?.message);
    redirect("/carrera");
  }

  const { data: inserted } = await supabase
    .from("career_events")
    .insert({
      player_id: player.id,
      week: player.week,
      event_id: `club-request-${kind}-${player.week}`,
      category: "representante",
      title: result.title,
      description: result.description,
      chosen_option_id: kind,
      chosen_option_label: result.label,
      free_text_response: null,
      consequences: result.consequences,
      outcome_text: result.outcomeText,
    })
    .select("id")
    .single();

  revalidatePath("/carrera");
  revalidatePath("/mi-jugador");
  redirect(inserted ? `/carrera/resultado/${inserted.id}` : "/carrera");
}
