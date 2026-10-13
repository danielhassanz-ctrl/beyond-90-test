import { describeKit } from "@/lib/clubColors";
import { describeLook } from "@/lib/playerLook";

/**
 * La foto del resumen de temporada, como la tarjeta compartible del diseño de referencia (panel «Tarjeta compartible
 * B90»): una foto de ACCIÓN en el estadio celebrando, con la camiseta del club bien visible y el público de fondo, no
 * un retrato de cara. Encuadre de cintura para arriba, con el sujeto algo a la derecha y la parte baja más oscura:
 * ahí van el nombre, la media y las cifras de la temporada.
 */
export function recapPhotoPrompt(club: string, age: number, lastName: string): string {
  return (
    `Photorealistic dynamic sports photograph of a footballer celebrating a goal, wearing the ${describeKit(club)} kit with the club crest on the chest, ` +
    `${describeLook(age, lastName)}, mouth wide open shouting with joy, one fist clenched, waist-up framing with the jersey clearly visible, ` +
    `packed stadium at night under bright floodlights with a blurred cheering crowd behind, shallow depth of field, dramatic rim light, ` +
    `subject slightly to the right, darker empty space at the bottom for text, no readable text or sponsor names anywhere, ` +
    `high-end sports magazine cover photography, vertical 3:4 composition`
  );
}
