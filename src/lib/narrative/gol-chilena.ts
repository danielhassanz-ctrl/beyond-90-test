import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";

/**
 * Gol de chilena: momento que puede repetirse a lo largo de la carrera
 * (no es un "una vez y ya" — cuanto más grande te haces, más natural que
 * te vuelva a pasar), hecho a mano porque dispara la portada "WARCA" —
 * una composición de imagen especial (ver src/lib/images/newspaper.ts)
 * que no encaja en el sistema normal de fotos contextuales.
 */
export const GOL_CHILENA_EVENT_ID = "gol-chilena";

interface ChilenaTracker {
  lastWeek: number;
}

function getTracker(player: Player): ChilenaTracker {
  const stored = player.flags?.gol_chilena_tracker;
  if (typeof stored === "string") {
    try {
      return JSON.parse(stored);
    } catch {
      // sigue con el valor por defecto
    }
  }
  return { lastWeek: 0 };
}

/** Se llama cuando el evento realmente se dispara, para anotar el cooldown. */
export function markGolChilenaTriggered(player: Player): void {
  if (!player.flags) player.flags = {};
  player.flags.gol_chilena_tracker = JSON.stringify({ lastWeek: player.week } satisfies ChilenaTracker);
}

/**
 * Solo tiene sentido que un gol de chilena sea portada si el jugador ya
 * tiene algo de nombre. A partir de ahí, cuanto más figura eres (media y
 * fama más altas), más probable que te vuelva a pasar — un fenómeno de
 * verdad acumula varios goles así en su carrera, no solo uno.
 */
export function shouldTriggerGolChilena(player: Player): boolean {
  const media = player.media ?? 0;
  const fama = player.fama ?? 0;
  if (media < 55 || fama < 20) return false;

  const { lastWeek } = getTracker(player);
  const weeksSinceLast = player.week - lastWeek;
  // Cooldown mínimo de 12 semanas: no se amontonan aunque la tirada salga
  if (lastWeek > 0 && weeksSinceLast < 12) return false;

  // De ~1%/turno para alguien recién llegado al umbral, hasta ~8%/turno
  // para una superestrella (media 99, fama 100).
  const starFactor = Math.min(1, Math.max(0, (media - 55) / 45));
  const famaFactor = Math.min(1, Math.max(0, (fama - 20) / 80));
  const chance = 0.01 + (starFactor * 0.5 + famaFactor * 0.5) * 0.07;

  return Math.random() < chance;
}

export function buildGolChilenaEvent(club: string): GameEvent {
  return {
    id: GOL_CHILENA_EVENT_ID,
    category: "partido",
    title: "Una chilena para la historia",
    // "Metes un gol" (no solo "se cuela por la escuadra") a propósito:
    // extractStatsFromEvent (update-stats.ts) busca esa frase exacta para
    // sumar el gol a tus estadísticas de carrera — sin ella, tu categoría
    // es "partido" (cuenta como partido jugado) pero el gol en sí, uno de
    // los más vistosos posibles, no llegaba nunca a stats_goals.
    description: `Balón que llega alto por la izquierda. Das la espalda a la portería, saltas, y conectas una chilena perfecta: metes un gol que se cuela por la escuadra. El estadio entero se levanta de golpe. Ni tú mismo te lo crees todavía cuando tus compañeros te sepultan en la celebración. Al día siguiente, tu cara está en la portada de todos los periódicos deportivos.`,
    isMilestone: true,
    milestoneType: "gol_chilena",
    imageScene: `Dynamic action photograph: footballer executing a perfect bicycle kick (overhead kick), body fully horizontal in mid-air, back arched, both legs scissoring above his head with one leg striking the ball at the peak of the motion, back to the goal, falling backward, ${club} kit, stadium lights, frozen dramatic mid-air moment, professional sports photography, Getty Images quality`,
    options: [
      {
        id: "humilde",
        label: "Quitarle importancia: 'Fue instinto, salió así'",
        subtitle: "Modestia ante el momento",
        consequences: { moral: 8, fama: 6, media: 2 },
      },
      {
        id: "disfrutar",
        label: "Disfrutar el momento a fondo: es un golazo de los que hacen historia",
        subtitle: "Dejar que el mundo lo celebre contigo",
        consequences: { moral: 10, fama: 10, media: 1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué piensas mientras el estadio sigue en pie, coreando tu nombre?",
  };
}
