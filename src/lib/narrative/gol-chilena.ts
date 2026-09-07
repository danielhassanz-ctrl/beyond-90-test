import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";

/**
 * Gol de chilena: momento único por carrera, hecho a mano (no generado
 * por IA) porque necesita disparar la portada "WARCA" — una composición
 * de imagen especial (ver src/lib/images/newspaper.ts) que no encaja en
 * el sistema normal de fotos contextuales.
 */
export const GOL_CHILENA_EVENT_ID = "gol-chilena";

/**
 * Solo tiene sentido que un gol de chilena sea portada si el jugador ya
 * tiene algo de nombre — nadie hace primera plana con 16 años recién
 * debutando. Fama/media moderadas como umbral razonable, y una
 * probabilidad baja para que sea un momento raro y especial, no algo que
 * se repita cada pocas semanas.
 */
export function shouldTriggerGolChilena(player: Player, alreadyUsed: boolean): boolean {
  if (alreadyUsed) return false;
  if ((player.media ?? 0) < 60) return false;
  if ((player.fama ?? 0) < 20) return false;
  return Math.random() < 0.05;
}

export function buildGolChilenaEvent(club: string): GameEvent {
  return {
    id: GOL_CHILENA_EVENT_ID,
    category: "partido",
    title: "Una chilena para la historia",
    description: `Balón que llega alto por la izquierda. Das la espalda a la portería, saltas, y conectas una chilena perfecta que se cuela por la escuadra. El estadio entero se levanta de golpe. Ni tú mismo te lo crees todavía cuando tus compañeros te sepultan en la celebración. Al día siguiente, tu cara está en la portada de todos los periódicos deportivos.`,
    isMilestone: true,
    milestoneType: "gol_chilena",
    imageScene: `Dynamic action photograph: footballer executing a perfect bicycle kick (overhead kick) mid-air, full extension, ball just leaving the boot toward goal, ${club} kit, stadium lights, dramatic athletic pose frozen mid-motion, professional sports photography, Getty Images quality`,
    options: [
      {
        id: "humilde",
        label: "Quitarle importancia: 'Fue instinto, salió así'",
        subtitle: "Modestia ante el momento",
        consequences: { moral: 8, fama: 6, media: 2 },
      },
      {
        id: "disfrutar",
        label: "Disfrutar el momento a fondo: es un gol de una vez en la vida",
        subtitle: "Dejar que el mundo lo celebre contigo",
        consequences: { moral: 10, fama: 10, media: 1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué piensas mientras el estadio sigue en pie, coreando tu nombre?",
  };
}
