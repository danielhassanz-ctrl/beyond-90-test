"use server";

import { redirect } from "next/navigation";
import { friendlyError } from "@/lib/supabase/friendly-errors";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { canContinueDynasty, dynastyChildren, newGenerationPlayer } from "@/lib/narrative/dynasty";
import type { Player } from "@/types/player";
import { photoExtension, validatePhotoFile } from "@/lib/images/upload-guards";
import { patchFlagsFresh } from "@/lib/supabase/flags";

/**
 * Empieza la carrera de uno de tus hijos: una fila nueva en players (la más reciente es la que se juega), con tu apellido, parte de
 * tu patrimonio y la saga guardada en sus banderas. Tu carrera queda como estaba, retirada, y se ve en el Legado.
 */
export async function startDynasty(formData: FormData) {
  const { user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) redirect("/login");
  if (!canContinueDynasty(player)) redirect("/carrera/retiro");

  const childName = String(formData.get("child") ?? "");
  const child = dynastyChildren(player.flags).find((c) => c.n === childName);
  if (!child) redirect("/carrera/saga?error=" + encodeURIComponent("Elige a uno de tus hijos."));
  const position = String(formData.get("position") ?? "");

  // Dos envíos a la vez (doble toque) crearían dos hijos, cada uno con los créditos comprados: se reserva la saga antes de nada.
  const lock = createServiceClient();
  let claimed = false;
  await patchFlagsFresh(lock, player.id, (f) => {
    const last = parseInt(String(f.saga_lock ?? "0"), 10) || 0;
    if (Date.now() - last > 60_000) {
      f.saga_lock = String(Date.now());
      claimed = true;
    }
  });
  if (!claimed) redirect("/carrera/saga?error=" + encodeURIComponent("Ya se está creando a tu hijo. Espera un momento."));

  const supabase = await createClient();
  // Foto opcional del hijo (sirve de referencia para las fotos de sus momentos).
  let photoUrl: string | null = null;
  const photo = formData.get("photo") as File | null;
  if (photo && photo.size > 0 && !validatePhotoFile(photo)) {
    try {
      const ext = photoExtension(photo);
      const path = `${user.id}/${Date.now()}-hijo.${ext}`;
      const { error } = await supabase.storage.from("player-photos").upload(path, photo, { upsert: true });
      if (!error) photoUrl = supabase.storage.from("player-photos").getPublicUrl(path).data.publicUrl;
    } catch (err) {
      console.error("[startDynasty] foto no subida:", err instanceof Error ? err.message : err);
    }
  }

  const { row, flags, carry } = newGenerationPlayer(player as Player, child, { position, photoUrl });
  const { data: inserted, error } = await supabase.from("players").insert({ ...row, flags }).select("id").single();
  if (error || !inserted) {
    redirect("/carrera/saga?error=" + encodeURIComponent(friendlyError(error?.message, "No se pudo crear a tu hijo. Inténtalo de nuevo.")));
  }

  // Créditos de fotos y cupo gratis: son de la cuenta, no del personaje (solo la service role puede escribirlos).
  if (Object.keys(carry).length > 0) {
    try {
      const service = createServiceClient();
      const { data: fresh } = await service.from("players").select("flags").eq("id", inserted.id).maybeSingle();
      await service.from("players").update({ flags: { ...(fresh?.flags ?? {}), ...carry } }).eq("id", inserted.id);
      // Los créditos pasan al hijo: el padre se queda sin ellos (si no, se duplicaban al borrar y repetir la saga).
      if (carry.img_paid_credits !== undefined) await patchFlagsFresh(service, player.id, (f) => { f.img_paid_credits = "0"; });
    } catch (err) {
      console.error("[startDynasty] no se pudieron copiar los créditos:", err instanceof Error ? err.message : err);
    }
  }
  redirect("/mi-jugador");
}
