/** La primera escena de quien sigue la saga: el peso del apellido. Ver dynasty.ts. */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { dynastyIntroLines, dynastyGeneration, describeLegacy } from "@/lib/narrative/dynasty";

export { dynastyGeneration };

export function buildDynastyIntroEvent(player: Player): GameEvent {
  const { father, mother, fatherEntry } = dynastyIntroLines(player);
  const name = displayName(player);
  const gen = dynastyGeneration(player.flags);
  const legacy = fatherEntry ? describeLegacy(fatherEntry) : "una carrera de las que se recuerdan";
  const clubLine = fatherEntry?.club ? ` con el ${fatherEntry.club}` : "";
  const momLine = mother ? ` ${mother}, tu madre, te ha planchado la camiseta tres veces y no ha dicho ni una palabra, que es su forma de decir que está nerviosa.` : "";
  return {
    id: `dinastia-intro-${gen}`,
    category: "especial",
    title: "El apellido pesa",
    description: `Tienes 16 años, una maleta y un apellido que abre puertas y las cierra a la vez. Tu padre, ${father}, dejó ${legacy}${clubLine}; en la cantera todo el mundo lo sabe antes de que te presentes, y en las tertulias ya hay un titular escrito: «¿Será tan bueno como su padre?».${momLine} Hoy empieza tu historia. La primera decisión es qué hacer con el nombre que llevas.`,
    options: [
      {
        id: "a",
        label: "Abrazar el apellido: «Soy su hijo, y voy a ser yo»",
        subtitle: "Orgullo, con la presión que trae",
        consequences: { fama: 3, moral: 4, rel_aficion: 2, flags: { dinastia_intro: true, dinastia_actitud: "orgullo" } },
        outcomeText: `Lo dices en tu primera entrevista, con la voz firme y las manos sudando. Los medios lo titulan «${name}: hijo de ${father}, dueño de su camino». Tu padre te escribe un solo mensaje: «Ese es mi chaval».`,
      },
      {
        id: "b",
        label: "Pedir que no lo mencionen: quieres ganarte el sitio solo",
        subtitle: "Menos ruido, más trabajo",
        consequences: { reputacion: 3, moral: 1, rel_entrenador: 2, flags: { dinastia_intro: true, dinastia_actitud: "discreto" } },
        outcomeText: "Pides en la cantera que nadie hable de tu padre. El entrenador asiente con respeto: «Aquí cada uno empieza de cero». Es mentira, porque nadie empieza de cero con ese apellido, pero la frase te da aire.",
      },
      {
        id: "c",
        label: `Hablar con ${father} antes de nada`,
        subtitle: "Un consejo de quien ya lo vivió",
        consequences: { moral: 5, rel_representante: 0, flags: { dinastia_intro: true, dinastia_actitud: "consejo" } },
        outcomeText: `Lo encuentras en el jardín, con el balón que guarda desde su último partido. «Te van a comparar siempre», dice. «No pelees contra eso. Hazlo tuyo». Te lo pasa. Es un balón viejo y pesa más que cualquier trofeo.`,
      },
    ],
    isMilestone: true,
    milestoneType: "carrera",
    imageScene: "Photorealistic photo of a teenage footballer in a youth academy training kit standing in a stadium tunnel next to his father, a retired star in a dark jacket, resting a hand on his shoulder, emotional and proud moment, warm light, no logos or readable text",
  };
}
