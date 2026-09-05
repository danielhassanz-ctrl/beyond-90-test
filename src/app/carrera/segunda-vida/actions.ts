"use server";

import { redirect } from "next/navigation";
import { applyConsequences, nextWeekGap, resolveOption } from "@/lib/narrative/engine";
import { SECOND_LIFE_TARGET_WEEKS } from "@/types/career";
import { getCurrentUserAndPlayer } from "@/lib/player";

export async function resolveSecondLifeEvent(formData: FormData) {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player || !player.second_career) {
    redirect("/login");
  }

  const eventId = formData.get("event_id") as string;
  const optionId = formData.get("option_id") as string;
  const freeText = (formData.get("free_text") as string) || null;

  // Igual que en la carrera principal: el evento vivo se lee de lo que
  // quedó guardado en el servidor, nunca del formulario.
  const event = player.pending_event?.id === eventId ? player.pending_event : null;
  const option = event?.options.find((o) => o.id === optionId);

  if (!event || !option) {
    redirect("/carrera/segunda-vida");
  }

  const resolution = resolveOption(option, player);
  const consequences = resolution ? resolution.consequences : option.consequences;
  const outcomeText = resolution ? resolution.text : null;
  const milestoneAchieved = event.isMilestone && (!resolution || resolution.success);

  const patch: Record<string, unknown> = applyConsequences(player, consequences);
  if (event.memorableThread) {
    patch.flags = { ...player.flags, [`hilo_${Date.now()}`]: event.memorableThread };
  }
  const newSecondWeek = player.second_week + nextWeekGap();
  const willFinish = newSecondWeek > SECOND_LIFE_TARGET_WEEKS;

  const { data: insertedEvent } = await supabase
    .from("career_events")
    .insert({
      player_id: player.id,
      week: player.second_week,
      event_id: event.id,
      category: event.category,
      title: event.title,
      description: event.description,
      chosen_option_id: option.id,
      chosen_option_label: option.label,
      free_text_response: freeText,
      consequences,
      outcome_text: outcomeText,
    })
    .select("id")
    .single();

  let milestoneId: string | null = null;
  if (milestoneAchieved) {
    const { data: milestone } = await supabase
      .from("milestones")
      .insert({
        player_id: player.id,
        week: player.second_week,
        type: event.milestoneType ?? "hito",
        title: event.title,
        subtitle: outcomeText ?? option.subtitle,
      })
      .select("id")
      .single();
    milestoneId = milestone?.id ?? null;
  }

  await supabase
    .from("players")
    .update({
      ...patch,
      pending_event: null,
      second_week: newSecondWeek,
      status: willFinish ? "retired" : "second_life",
    })
    .eq("id", player.id);

  if (milestoneId) {
    redirect(`/carrera/hito/${milestoneId}`);
  }

  if (outcomeText && insertedEvent) {
    redirect(`/carrera/resultado/${insertedEvent.id}`);
  }

  if (willFinish) {
    redirect("/carrera/retiro");
  }

  redirect("/carrera/segunda-vida");
}
