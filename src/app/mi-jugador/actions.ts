"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { ensurePublicCareerCard } from "@/lib/player/shareCard";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Genera (o reutiliza) el enlace público de comparación y lleva ahí directamente. */
export async function shareAndCompare() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) redirect("/login");

  const code = await ensurePublicCareerCard(supabase, player, user.id);
  if (!code) redirect("/mi-jugador");
  redirect(`/comparar/${code}`);
}
