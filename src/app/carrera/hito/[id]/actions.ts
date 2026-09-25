"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { generatePlayerImage } from "@/lib/images/replicate";
import { uploadGeneratedImage } from "@/lib/images/upload";
import { checkImageGenerationQuota, logImageGeneration } from "@/lib/images/quota";
import { addShareBranding } from "@/lib/images/shareBranding";
import { getMilestoneImagePrompt } from "@/lib/images/milestonePrompts";
import { describeKit } from "@/lib/clubColors";
import { getShareTagline } from "@/lib/shareTaglines";
import { playerAge } from "@/types/career";

const STALE_PENDING_MS = 5 * 60_000;

/**
 * Los hitos cuya foto falló (o se quedó "pendiente" para siempre) se
 * quedaban con la foto de perfil sin remedio: no había forma de volver a
 * intentarlo. Este botón regenera la foto de UN hito concreto — solo si de
 * verdad no tiene imagen, respetando la cuota mensual y sin lanzar una
 * segunda generación si ya hay una en marcha.
 */
export async function regenerateMilestoneImage(formData: FormData) {
  const milestoneId = String(formData.get("milestone_id") ?? "");
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player || !milestoneId) redirect("/login");

  const { data: milestone } = await supabase
    .from("milestones")
    .select("id, week, type, title, image_url, image_status, created_at")
    .eq("id", milestoneId)
    .eq("player_id", player.id)
    .maybeSingle();
  if (!milestone) redirect("/mi-jugador/legado");

  const regenStart = parseInt(String(player.flags?.[`regen_${milestoneId}`] ?? "0"), 10) || 0;
  const startedAt = Math.max(regenStart, milestone.created_at ? new Date(milestone.created_at).getTime() : 0);
  const pendingAge = startedAt ? Date.now() - startedAt : Infinity;
  const isFreshPending = milestone.image_status === "pending" && pendingAge < STALE_PENDING_MS;
  if (milestone.image_url || isFreshPending || !player.photo_url) {
    redirect(`/carrera/hito/${milestoneId}`);
  }

  const quota = await checkImageGenerationQuota(supabase, user.id);
  if (!quota.allowed) redirect(`/carrera/hito/${milestoneId}`);

  // La marca de inicio va en los flags del jugador, NO en created_at: esa columna
  // ordena la línea temporal del retiro y no debe moverse al regenerar una foto.
  await supabase.from("milestones").update({ image_status: "pending" }).eq("id", milestoneId);
  await supabase
    .from("players")
    .update({ flags: { ...(player.flags ?? {}), [`regen_${milestoneId}`]: String(Date.now()) } })
    .eq("id", player.id);

  const age = playerAge(milestone.week ?? player.week);
  const contextual = getMilestoneImagePrompt(String(milestone.type), age, player.club, player.last_name, String(milestone.type), player.agent_name ?? undefined);
  const prompt =
    contextual ??
    `Photorealistic cinematic photo of the photographed man in an emotional football moment: "${milestone.title}". He wears a ${describeKit(player.club)} football jersey, natural stadium light, expressive face, documentary sports photography style`;

  const photoUrl = player.photo_url as string;
  const userId = user.id;
  const playerId = player.id;
  const type = String(milestone.type);

  after(async () => {
    try {
      const buffer = await generatePlayerImage(photoUrl, prompt);
      if (!buffer) {
        await supabase.from("milestones").update({ image_status: "failed" }).eq("id", milestoneId);
        return;
      }
      await logImageGeneration(supabase, userId);
      let finalBuffer = buffer;
      try {
        finalBuffer = await addShareBranding(buffer, getShareTagline(type));
      } catch (err) {
        console.error("[regenerateMilestoneImage] branding failed, using plain photo:", err);
      }
      const [look, ms] = await Promise.allSettled([
        uploadGeneratedImage(supabase, userId, buffer, "look"),
        uploadGeneratedImage(supabase, userId, finalBuffer, "milestone"),
      ]);
      const lookUrl = look.status === "fulfilled" ? look.value : null;
      const msUrl = ms.status === "fulfilled" ? ms.value : null;
      if (lookUrl) await supabase.from("players").update({ current_photo_url: lookUrl }).eq("id", playerId);
      if (msUrl) {
        await supabase.from("milestones").update({ image_url: msUrl, image_status: "ready" }).eq("id", milestoneId);
      } else {
        await supabase.from("milestones").update({ image_status: "failed" }).eq("id", milestoneId);
      }
    } catch (err) {
      console.error(`[regenerateMilestoneImage] exception for ${milestoneId}:`, err);
      await supabase.from("milestones").update({ image_status: "failed" }).eq("id", milestoneId);
    }
  });

  revalidatePath(`/carrera/hito/${milestoneId}`);
  redirect(`/carrera/hito/${milestoneId}`);
}
