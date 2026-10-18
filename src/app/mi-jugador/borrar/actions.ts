"use server";

import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";

/**
 * Borra el personaje. Las fotos (bucket "player-photos", siempre bajo `${user.id}/...`) son de la CUENTA y las comparten todos sus personajes (la saga de
 * un hijo reutiliza las del padre): solo se borran cuando ya no queda ningún personaje. list() devuelve como mucho 100 archivos por llamada, así que se
 * pagina (antes, una carrera con más de 100 fotos dejaba el resto huérfano pese a haber pedido borrar los datos).
 */
export async function deletePlayer() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  if (player) {
    await supabase.from("players").delete().eq("id", player.id);
  }

  const { count } = await supabase.from("players").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count ?? 0) === 0) {
    try {
      for (let round = 0; round < 50; round++) {
        const { data: files } = await supabase.storage.from("player-photos").list(user.id, { limit: 100 });
        if (!files || files.length === 0) break;
        const { error } = await supabase.storage.from("player-photos").remove(files.map((f) => `${user.id}/${f.name}`));
        if (error) break;
        if (files.length < 100) break;
      }
    } catch (err) {
      console.error("[deletePlayer] no se pudieron borrar todas las fotos:", err instanceof Error ? err.message : err);
    }
  }

  // NOTA: esto borra los DATOS del jugador (personaje + fotos), pero no la cuenta de acceso (auth.users): eso solo se puede con la API de administrador
  // de Supabase (service role).

  redirect("/crear-jugador");
}
