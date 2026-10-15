"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { generatePlayerImage } from "@/lib/images/replicate";
import { uploadGeneratedImage } from "@/lib/images/upload";
import { checkImageGenerationQuota, logImageGeneration } from "@/lib/images/quota";
import { hasImageCredit, consumeImageCredit } from "@/lib/images/credits";
import { recapPhotoPrompt } from "@/lib/images/recap-photo";
import { logAppError } from "@/lib/errorLog";
import { playerAge } from "@/types/career";
import { photoRefs } from "@/lib/images/photo-refs";

type Flags = Record<string, string | boolean>;

/** Rehace la foto del resumen de temporada (cuesta una de tus fotos). Misma generación que al cerrar la temporada. */
export async function regenerateRecapPhoto(careerEventRowId: string): Promise<{ ok: boolean; message: string }> {
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) return { ok: false, message: "Tu sesión ha caducado: vuelve a entrar." };
  if (!player.photo_url) return { ok: false, message: "No hay foto tuya de referencia para generar la imagen." };

  const { data: row } = await supabase.from("career_events").select("event_id").eq("id", careerEventRowId).eq("player_id", player.id).maybeSingle();
  const match = /^preseason-(\d+)$/.exec(String(row?.event_id ?? ""));
  if (!match) return { ok: false, message: "Esta escena no es un cierre de temporada." };
  const season = parseInt(match[1], 10);

  const { data: fresh } = await supabase.from("players").select("id, flags, week, club").eq("id", player.id).maybeSingle();
  const flags = ((fresh?.flags ?? {}) as Flags) ?? {};
  const pendingSince = parseInt(String(flags.recap_photo_pending ?? "").split(":")[1] ?? "0", 10) || 0;
  if (pendingSince > 0 && Date.now() - pendingSince < 4 * 60_000) return { ok: false, message: "La foto ya se está generando. En unos segundos aparecerá." };

  if (!(await hasImageCredit(supabase, player, user.email))) {
    return { ok: false, message: "No te quedan fotos disponibles. Puedes comprar más en la sección de fotos." };
  }
  const quota = await checkImageGenerationQuota(supabase, user.id);
  if (!quota.allowed) return { ok: false, message: "Ahora mismo no se pueden generar más fotos. Inténtalo más tarde." };

  const photoUrl = photoRefs(player);
  const playerId = player.id;
  const userId = user.id;
  const userEmail = user.email;
  const prompt = recapPhotoPrompt(String(fresh?.club ?? player.club), playerAge(Number(fresh?.week ?? player.week)), player.last_name ?? "");

  // La foto vieja se enseña como "revelando…" mientras se genera la nueva
  const { data: marked, error: markError } = await supabase
    .from("players")
    .update({ flags: { ...flags, recap_photo_pending: `${season}:${Date.now()}` } })
    .eq("id", playerId)
    .select("id");
  if (markError || !marked || marked.length !== 1) return { ok: false, message: "No se pudo iniciar la generación. Inténtalo de nuevo." };

  const finish = async (url: string | null) => {
    const { data: cur } = await supabase.from("players").select("flags").eq("id", playerId).maybeSingle();
    const next: Flags = { ...((cur?.flags ?? {}) as Flags) };
    delete next.recap_photo_pending;
    if (url) {
      next.recap_photo = url;
      next.recap_photo_season = String(season);
      // La tarjeta guardada de esta temporada llevaba la foto vieja: se vuelve a montar con la nueva.
      delete next[`recap_c2_${season}`];
    }
    await supabase.from("players").update({ flags: next }).eq("id", playerId);
  };

  after(async () => {
    try {
      const buffer = await generatePlayerImage(photoUrl, prompt);
      if (!buffer) {
        await logAppError(supabase, "regenerateRecapPhoto", "generatePlayerImage returned null", { userId, playerId, detail: { season } });
        await finish(null);
        return;
      }
      await logImageGeneration(supabase, userId);
      await consumeImageCredit(supabase, { id: playerId, flags }, userEmail);
      await finish(await uploadGeneratedImage(supabase, userId, buffer, "look"));
    } catch (err) {
      await logAppError(supabase, "regenerateRecapPhoto", err, { userId, playerId });
      await finish(null).catch(() => {});
    }
  });

  revalidatePath(`/carrera/resultado/${careerEventRowId}`);
  return { ok: true, message: "Generando tu nueva foto: tarda unos segundos." };
}
