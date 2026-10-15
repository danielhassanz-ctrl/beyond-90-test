/**
 * Fotos de referencia del jugador para generar sus imágenes. La foto de ficha (photo_url) es la principal; el jugador puede
 * añadir una SEGUNDA foto (otro ángulo, otra luz) en flags.photo_ref2: con dos referencias el modelo ve la cara desde dos
 * puntos de vista y se desvía menos en escenas con poses o luces muy distintas. Se pasan juntas separadas por «|».
 */
export const REF_SEPARATOR = "|";

export function photoRefs(player: { photo_url: string | null; flags?: Record<string, string | boolean> | null }): string {
  const main = player.photo_url ?? "";
  const second = player.flags?.photo_ref2;
  return typeof second === "string" && second && main ? `${main}${REF_SEPARATOR}${second}` : main;
}

/** Separa «principal|segunda» en la lista de URLs que espera el modelo. */
export function splitRefs(refs: string): string[] {
  return refs.split(REF_SEPARATOR).map((u) => u.trim()).filter(Boolean);
}
