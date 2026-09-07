"use server";

import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";

/**
 * El jugador puede llegar a "retired" por dos caminos: eligiendo
 * retirarse en el evento de retiro (que ya deja status="awaiting_second_life"),
 * o agotando las semanas de su modo de carrera (que deja status="retired"
 * a secas). /carrera/segunda-vida/elegir solo acepta "awaiting_second_life"
 * — sin este paso, un jugador que llegó por el segundo camino entraba en
 * un bucle: el botón le devolvía siempre a esta misma página de retiro.
 * Encontrado jugando una carrera real hasta el final.
 */
export async function beginSecondLife() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player) {
    redirect("/login");
  }

  if (player.status !== "second_life" && player.status !== "awaiting_second_life") {
    await supabase.from("players").update({ status: "awaiting_second_life" }).eq("id", player.id);
  }

  redirect("/carrera/segunda-vida/elegir");
}
