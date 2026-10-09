/**
 * Jugar contra un antiguo club. Se nota en la crónica (la grada que fue tuya, los antiguos compañeros) y, si marcas,
 * no lo celebras: es un momento que merece su propia foto compartible.
 */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { extractStatsFromEvent } from "@/lib/player/update-stats";

/** ¿El rival es un club en el que ya jugaste? */
export function isExClub(player: Pick<Player, "flags" | "club">, rival: string): boolean {
  if (rival === player.club) return false;
  return String(player.flags?.clubs_history ?? "").split("|").filter(Boolean).includes(rival);
}

export const EX_CLUB_GOAL_SCENE =
  "Photorealistic photo of a footballer standing motionless on the pitch right after scoring, arms down by his sides and one hand raised toward the stands in a respectful gesture, refusing to celebrate against his former club, mixed emotions on his face, stadium floodlights, teammates running toward him blurred in the background, no readable text";

/** Añade a la crónica de un partido contra un ex club el peso que merece, y el hito si marcas. */
export function applyExClubTouch(event: GameEvent, player: Player, rival: string): GameEvent {
  if (!isExClub(player, rival)) return event;
  const goals = extractStatsFromEvent(event).goals ?? 0;
  const already = /antiguo club|ex club|tu casa de antes/i.test(event.description);
  const intro = already ? "" : ` Enfrente está tu antiguo club, el ${rival}: la grada que fue tuya te recibe con una mezcla de aplausos y algún silbido, y en el túnel te saludan viejos compañeros.`;
  const goalLine = goals > 0 && !/celebr/i.test(event.description) ? " Marcas, y no lo celebras: levantas una mano hacia la grada que te vio crecer, en señal de respeto." : "";
  // La mención va justo tras los datos del partido ("... Tu equipo gana a X."), antes del resto de la narración.
  const head = event.description.match(/^[sS]*?Marcador:[^]*?Tu equipo [^.]*./);
  const description = head
    ? `${head[0]}${intro}${event.description.slice(head[0].length)}${goalLine}`
    : `${event.description}${intro}${goalLine}`;
  const next: GameEvent = { ...event, description };
  if (goals > 0) {
    return { ...next, isMilestone: true, milestoneType: "gol_ex_club", imageScene: EX_CLUB_GOAL_SCENE };
  }
  return next;
}
