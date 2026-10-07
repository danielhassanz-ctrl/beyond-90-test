/**
 * Foto de la cabecera del jugador: la del ÚLTIMO hito generado (flags.header_photo),
 * incluso si es de una lesión, y si todavía no hay ninguna, la de referencia.
 * La foto de REFERENCIA (current_photo_url) no cambia con cada hito: es la base
 * de las siguientes generaciones y mezclarla con escenas puntuales desviaba la cara.
 */
import type { Player } from "@/types/player";

export function headerPhotoUrl(player: Pick<Player, "flags" | "current_photo_url" | "photo_url">): string | null {
  const h = player.flags?.header_photo;
  if (typeof h === "string" && h) return h;
  return (player.current_photo_url ?? player.photo_url) || null;
}
