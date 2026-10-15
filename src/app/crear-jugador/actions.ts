"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NO_CLUB_YET } from "@/lib/constants";

export async function createPlayer(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const lastName = formData.get("last_name") as string;
  const nickname = ((formData.get("nickname") as string) || "").trim() || null;
  const number = Number(formData.get("number"));
  const foot = formData.get("foot") as string;
  const nation = formData.get("nation") as string;
  const position = formData.get("position") as string;
  const personality1 = formData.get("personality") as string;
  const personality2 = formData.get("personality_2") as string;
  const mode = formData.get("mode") as string;
  const photo = formData.get("photo") as File | null;
  const photo2 = formData.get("photo2") as File | null;

  if (personality1 === personality2) {
    redirect(
      `/crear-jugador?error=${encodeURIComponent("Elige dos rasgos de personalidad distintos.")}`,
    );
  }

  const personality = `${personality1}, ${personality2}`;

  let photoUrl: string | null = null;

  if (photo && photo.size > 0) {
    try {
      const ext = photo.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("player-photos")
        .upload(path, photo, { upsert: true });

      if (uploadError) {
        redirect(`/crear-jugador?error=${encodeURIComponent(uploadError.message)}`);
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
  if (photoUrl && photo2 && photo2.size > 0) {
    try {
      const ext2 = photo2.name.split(".").pop() ?? "jpg";
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
    redirect(`/crear-jugador?error=${encodeURIComponent(insertError.message)}`);
  }

  redirect("/mi-jugador");
}
