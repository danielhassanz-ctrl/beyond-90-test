"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { applyConsequences, nextWeekGap, resolveOption } from "@/lib/narrative/engine";
import { SECOND_LIFE_TARGET_WEEKS } from "@/types/career";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { generatePlayerImage } from "@/lib/images/replicate";
import { uploadGeneratedImage } from "@/lib/images/upload";
import { checkImageGenerationQuota, logImageGeneration } from "@/lib/images/quota";

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
  const newSecondWeek = player.second_week + nextWeekGap(player.media, player.mode);
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

  // La segunda vida (entrenador/agente/presidente) tiene una docena de
  // hitos con su propia imageScene ya escrita (fichaje galáctico, título
  // como presidente, Salón de la Fama...) pero nunca se generaba ninguna
  // foto para ellos — solo la carrera principal tenía el pipeline de
  // imagen conectado. Se cablea aquí el mismo mecanismo (cuota, foto en
  // segundo plano con after(), estado pending/ready/failed).
  let milestoneId: string | null = null;
  const willAttemptImage = milestoneAchieved && Boolean(player.photo_url) && Boolean(event.imageScene);
  const quota = willAttemptImage ? await checkImageGenerationQuota(supabase, user.id) : null;
  const willGenerate = willAttemptImage && quota?.allowed === true;

  if (milestoneAchieved) {
    const { data: milestone } = await supabase
      .from("milestones")
      .insert({
        player_id: player.id,
        week: player.second_week,
        type: event.milestoneType ?? "hito",
        title: event.title,
        subtitle: outcomeText ?? option.subtitle,
        image_url: null,
        image_status: willGenerate ? "pending" : "none",
      })
      .select("id")
      .single();
    milestoneId = milestone?.id ?? null;

    if (milestoneId && willGenerate) {
      const finalMilestoneId = milestoneId;
      const finalPrompt = event.imageScene as string;
      const finalPhotoUrl = player.photo_url as string;
      const finalUserId = user.id;
      const finalPlayerId = player.id;

      after(async () => {
        try {
          const buffer = await generatePlayerImage(finalPhotoUrl, finalPrompt);
          if (!buffer) {
            await supabase.from("milestones").update({ image_status: "failed" }).eq("id", finalMilestoneId);
            return;
          }

          await logImageGeneration(supabase, finalUserId);

          const [evolvedUrl, milestoneImageUrl] = await Promise.all([
            uploadGeneratedImage(supabase, finalUserId, buffer, "look"),
            uploadGeneratedImage(supabase, finalUserId, buffer, "milestone"),
          ]);

          if (evolvedUrl) {
            await supabase.from("players").update({ current_photo_url: evolvedUrl }).eq("id", finalPlayerId);
          }

          if (milestoneImageUrl) {
            await supabase
              .from("milestones")
              .update({ image_url: milestoneImageUrl, image_status: "ready" })
              .eq("id", finalMilestoneId);
          } else {
            await supabase.from("milestones").update({ image_status: "failed" }).eq("id", finalMilestoneId);
          }
        } catch (err) {
          console.error(`[resolveSecondLifeEvent:after] Exception generating image for milestone ${finalMilestoneId}:`, err);
          await supabase.from("milestones").update({ image_status: "failed" }).eq("id", finalMilestoneId);
        }
      });
    }
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
