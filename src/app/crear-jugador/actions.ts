"use server";

import { redirect } from "next/navigation";
import { friendlyError } from "@/lib/supabase/friendly-errors";
import { createClient } from "@/lib/supabase/server";
import { NO_CLUB_YET, POSITIONS, FEET, PERSONALITIES } from "@/lib/constants";
import { MODE_TARGET_WEEKS } from "@/types/career";
import { canonicalNation } from "@/lib/nations";
import { photoExtension, validatePhotoFile } from "@/lib/images/upload-guards";

export async function createPlayer(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Todo lo que llega del formulario se valida aquí: el HTML se puede editar.
  const cleanName = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/[^\p{L}\p{M}\s'.-]/gu, "").replace(/\s+/g, " ").trim().slice(0, max);
  const lastName = cleanName(formData.get("last_name"), 40);
  const nickname = cleanName(formData.get("nickname"), 30) || null;
  const number = Math.trunc(Number(formData.get("number")));
  const foot = formData.get("foot") as string;
  const nation = canonicalNation(cleanName(formData.get("nation"), 40));
  const position = formData.get("position") as string;
  const personality1 = formData.get("personality") as string;
  const personality2 = formData.get("personality_2") as string;
  const mode = formData.get("mode") as string;
  const photo = formData.get("photo") as File | null;
  const photo2 = formData.get("photo2") as File | null;

  const invalid =
    !lastName ||
    !nation ||
    !Number.isInteger(number) ||
    number < 1 ||
    number > 99 ||
    !(FEET as readonly string[]).includes(foot) ||
    !(POSITIONS as readonly string[]).includes(position) ||
    !(PERSONALITIES as readonly string[]).includes(personality1) ||
    !(PERSONALITIES as readonly string[]).includes(personality2) ||
    !Object.hasOwn(MODE_TARGET_WEEKS, mode);
  if (invalid) {
    redirect(`/crear-jugador?error=${encodeURIComponent("Revisa los datos del jugador: algún campo no es válido.")}`);
  }

  if (personality1 === personality2) {
    redirect(
      `/crear-jugador?error=${encodeURIComponent("Elige dos rasgos de personalidad distintos.")}`,
    );
  }

  const personality = `${personality1}, ${personality2}`;

  let photoUrl: string | null = null;

  if (photo && photo.size > 0) {
    const bad = validatePhotoFile(photo);
    if (bad) redirect(`/crear-jugador?error=${encodeURIComponent(bad)}`);
    try {
      const ext = photoExtension(photo);
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("player-photos")
        .upload(path, photo, { upsert: true });

      if (uploadError) {
        redirect(`/crear-jugador?error=${encodeURIComponent(friendlyError(uploadError.message, "No se pudo subir la foto."))}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("player-photos").getPublicUrl(path);

      photoUrl = publicUrl;
    } catch (err) {
      if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
      console.error("[createPlayer] photo upload failed:", err);
      redirect(
        `/crear-jugador?error=${encodeURIComponent("No se pudo subir la foto. Inténtalo de nuevo o rellena el formulario sin foto.")}`,
      );
    }
  }

  // Segunda foto de referencia opcional (flags.photo_ref2): ver images/photo-refs.ts.
  let photoRef2: string | null = null;
  if (photoUrl && photo2 && photo2.size > 0 && !validatePhotoFile(photo2)) {
    try {
      const ext2 = photoExtension(photo2);
      const path2 = `${user.id}/ref2-${Date.now()}.${ext2}`;
      const { error: upErr } = await supabase.storage.from("player-photos").upload(path2, photo2, { upsert: true });
      if (!upErr) photoRef2 = supabase.storage.from("player-photos").getPublicUrl(path2).data.publicUrl;
    } catch (err) {
      console.error("[createPlayer] second photo upload failed:", err);
    }
  }

  const { error: insertError } = await supabase.from("players").insert({
    user_id: user.id,
    last_name: lastName,
    nickname,
    number,
    foot,
    nation,
    position,
    personality,
    club: NO_CLUB_YET,
    mode,
    photo_url: photoUrl,
    ...(photoRef2 ? { flags: { photo_ref2: photoRef2 } } : {}),
  });

  if (insertError) {
    redirect(`/crear-jugador?error=${encodeURIComponent(friendlyError(insertError.message, "No se pudo crear al jugador. Inténtalo de nuevo."))}`);
  }

  redirect("/mi-jugador");
}
