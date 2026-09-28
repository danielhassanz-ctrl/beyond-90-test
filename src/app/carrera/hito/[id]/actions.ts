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
  // Trazas paso a paso: el botón se quedaba en "Enviando…" sin ningún
  // rastro en los logs porque esta función, hasta ahora, no tenía NI UN
  // SOLO console.log antes de llegar a after() — cualquier cuelgue en la
  // parte síncrona (lecturas/escrituras de Supabase) era invisible por
  // completo. Con esto, el próximo intento dice exactamente en qué línea
  // se queda parado, en vez de tener que adivinarlo.
  const milestoneId = String(formData.get("milestone_id") ?? "");
  console.log(`[regenerateMilestoneImage] START milestoneId=${milestoneId}`);

  const { supabase, user, player } = await getCurrentUserAndPlayer();
  console.log(`[regenerateMilestoneImage] got user/player: user=${!!user} player=${!!player}`);
  if (!user || !player || !milestoneId) redirect("/login");

  const { data: milestone, error: fetchErr } = await supabase
    .from("milestones")
    .select("id, week, type, title, image_url, image_status, created_at")
    .eq("id", milestoneId)
    .eq("player_id", player.id)
    .maybeSingle();
  console.log(`[regenerateMilestoneImage] fetched milestone: found=${!!milestone} status=${milestone?.image_status} error=${fetchErr?.message}`);
  if (!milestone) redirect("/mi-jugador/legado");

  const regenStart = parseInt(String(player.flags?.[`regen_${milestoneId}`] ?? "0"), 10) || 0;
  const startedAt = Math.max(regenStart, milestone.created_at ? new Date(milestone.created_at).getTime() : 0);
  const pendingAge = startedAt ? Date.now() - startedAt : Infinity;
  const isFreshPending = milestone.image_status === "pending" && pendingAge < STALE_PENDING_MS;
  console.log(`[regenerateMilestoneImage] guard check: image_url=${!!milestone.image_url} isFreshPending=${isFreshPending} pendingAge=${pendingAge} hasPhoto=${!!player.photo_url}`);
  if (milestone.image_url || isFreshPending || !player.photo_url) {
    console.log(`[regenerateMilestoneImage] EARLY EXIT via guard, redirecting back`);
    redirect(`/carrera/hito/${milestoneId}`);
  }

  // Marca el hito como "pending" antes de arrancar nada — el propio botón
  // (ver RegenerateButton, useFormStatus) ya se desactiva en cuanto se
  // envía una vez, que es lo que de verdad evita los clics repetidos por
  // impaciencia vistos en vivo (varias peticiones al mismo hito en pocos
  // segundos).
  //
  // ANTES había aquí un `.eq("image_status", milestone.image_status)`
  // como bloqueo optimista extra (para el caso más raro de dos pestañas
  // a la vez) — pero esa condición hacía que `.select().maybeSingle()`
  // devolviera SIEMPRE `null` incluso cuando la fila sí se actualizaba
  // (visto en vivo con logs paso a paso: claimed=false en cada intento,
  // sin excepción, incluso en el primer intento limpio de un hito que
  // nunca se había tocado). Sin saber la causa exacta (huele a cómo las
  // políticas de RLS reevalúan el RETURNING de un UPDATE), el efecto neto
  // era que el botón NUNCA lograba arrancar una generación — mucho peor
  // que el problema que pretendía evitar. Se quita hasta poder investigar
  // esa condición con más calma.
  await supabase.from("milestones").update({ image_status: "pending" }).eq("id", milestoneId);

  const quota = await checkImageGenerationQuota(supabase, user.id);
  console.log(`[regenerateMilestoneImage] quota check: allowed=${quota.allowed}`);
  if (!quota.allowed) {
    // Ya lo habíamos marcado "pending" al reclamarlo — si la cuota lo
    // frena aquí, hay que revertirlo a "failed" o se quedaría "pending"
    // colgado para siempre sin que nada lo esté generando de verdad.
    await supabase.from("milestones").update({ image_status: "failed" }).eq("id", milestoneId);
    redirect(`/carrera/hito/${milestoneId}`);
  }

  // La marca de inicio va en los flags del jugador, NO en created_at: esa columna
  // ordena la línea temporal del retiro y no debe moverse al regenerar una foto.
  await supabase
    .from("players")
    .update({ flags: { ...(player.flags ?? {}), [`regen_${milestoneId}`]: String(Date.now()) } })
    .eq("id", player.id);
  console.log(`[regenerateMilestoneImage] flags updated, about to schedule after() and redirect`);

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
    console.log(`[regenerateMilestoneImage:after] background job started for ${milestoneId}`);
    try {
      const buffer = await generatePlayerImage(photoUrl, prompt);
      console.log(`[regenerateMilestoneImage:after] generatePlayerImage returned buffer=${!!buffer}`);
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
  console.log(`[regenerateMilestoneImage] redirecting back to hito page now`);
  redirect(`/carrera/hito/${milestoneId}`);
}
