"use server";

import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";

export async function deletePlayer() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  // Antes esto solo borraba la fila de "players" — la foto original y
  // todas las generadas por IA (mismo bucket "player-photos", siempre
  // bajo la ruta `${user.id}/...`, ver crear-jugador/actions.ts y
  // upload.ts) se quedaban huérfanas para siempre en el storage, pese a
  // que el jugador pidió expresamente borrar sus datos. list()+remove()
  // van con el cliente normal (con sesión), no con el de administrador:
  // funciona porque las políticas de storage ya restringen cada carpeta
  // a su propio dueño, igual que las subidas.
  const { data: files } = await supabase.storage.from("player-photos").list(user.id);
  if (files && files.length > 0) {
    await supabase.storage.from("player-photos").remove(files.map((f) => `${user.id}/${f.name}`));
  }

  if (player) {
    await supabase.from("players").delete().eq("id", player.id);
  }

  // NOTA para cuando exista SUPABASE_SERVICE_ROLE_KEY en el entorno: esto
  // borra los DATOS del jugador (personaje + fotos), pero no la cuenta de
  // acceso en sí (auth.users) — esa parte solo se puede borrar con la
  // API de administrador de Supabase (`supabase.auth.admin.deleteUser`),
  // que exige la service role key. Esa clave es un secreto de producción
  // real: no se pide ni se pega aquí. Si en algún momento se añade como
  // variable de entorno en Vercel, esta función es el sitio donde llamar
  // a esa API para completar el borrado de cuenta de verdad.

  redirect("/crear-jugador");
}
