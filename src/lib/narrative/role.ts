/**
 * Rol del jugador en su equipo (titular, rotación, suplente, apartado) — el
 * puente entre "lo que decides" y "lo que pasa después". Antes la relación
 * con el entrenador era solo un número que cambiaba el texto de una frase:
 * el míster podía decir "no cuentas conmigo" y el jugador seguía jugando 90
 * minutos como si nada (reportado en vivo). Ahora el rol sale de la media
 * frente al nivel del club, la relación con el entrenador, la forma y el
 * ánimo, y MANDA sobre lo que pasa en cada partido: minutos, jugadas
 * decisivas, escenas de banquillo y la salida del club.
 */
import type { Player } from "@/types/player";
import { getClubLevel } from "@/lib/calendar/match-calendar";

export type PlayerRole = "titular" | "rotacion" | "suplente" | "apartado";

export const ROLE_LABELS: Record<PlayerRole, string> = {
  titular: "Titular",
  rotacion: "Rotación",
  suplente: "Suplente",
  apartado: "Apartado",
};

/** Media que hace falta para ser titular según el nivel del club. */
const CLUB_NEED = { grande: 64, europeo: 58, modesto: 50 } as const;

/** Turnos que el entrenador te mantiene fuera por una decisión suya (ver ent-marginado-nuevo-entrenador). */
export function benchRemaining(flags: Record<string, string | boolean> | null | undefined): number {
  return Math.max(0, parseInt(String(flags?.coach_bench ?? "0"), 10) || 0);
}

export function computeRole(
  player: Pick<Player, "media" | "forma" | "moral" | "rel_entrenador" | "club" | "flags">,
): { role: PlayerRole; score: number } {
  const bench = benchRemaining(player.flags);
  const need = CLUB_NEED[getClubLevel(player.club)];
  const score =
    ((player.media ?? 50) - need) * 0.6 +
    ((player.rel_entrenador ?? 50) - 50) * 0.35 +
    ((player.forma ?? 60) - 60) * 0.1 +
    ((player.moral ?? 60) - 60) * 0.05;

  // Una decisión explícita del entrenador pesa más que la fórmula.
  if (bench >= 4) return { role: "apartado", score };
  if (bench >= 1) return { role: score < -10 ? "apartado" : "suplente", score };

  if (score >= -2) return { role: "titular", score };
  if (score >= -10) return { role: "rotacion", score };
  if (score >= -20) return { role: "suplente", score };
  return { role: "apartado", score };
}

/** Lo que la crónica del partido tiene que respetar según el rol. */
export function roleInstruction(role: PlayerRole, relEntrenador: number): string {
  const coach =
    relEntrenador < 40
      ? " El entrenador cuenta poco contigo y se nota en cómo te trata."
      : relEntrenador > 75
        ? " El entrenador confía en ti."
        : "";
  switch (role) {
    case "titular":
      return `- TU ROL: TITULAR. Sales de inicio y juegas entre 75 y 90 minutos (salvo lesión o cambio de última hora).${coach}`;
    case "rotacion":
      return `- TU ROL: ROTACIÓN. A veces empiezas y te sustituyen pronto, a veces entras en la segunda parte: juegas entre 40 y 70 minutos, nunca el partido completo.${coach}`;
    case "suplente":
      return `- TU ROL: SUPLENTE. Sales desde el banquillo en la segunda parte y juegas entre 8 y 30 minutos. Cualquier gol o asistencia sale de ese tramo corto, y debe notarse que no eres el titular.${coach}`;
    default:
      return "";
  }
}

/** Rango de minutos en que puede caer la jugada decisiva según el rol. */
export function roleMinuteRange(role: PlayerRole): { from: number; to: number } {
  if (role === "suplente") return { from: 62, to: 90 };
  if (role === "rotacion") return { from: 5, to: 82 };
  return { from: 1, to: 90 };
}
