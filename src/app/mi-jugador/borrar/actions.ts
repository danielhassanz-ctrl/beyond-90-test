"use server";

import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";

export async function deletePlayer() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  if (player) {
    await supabase.from("players").delete().eq("id", player.id);
  }

  redirect("/crear-jugador");
}
