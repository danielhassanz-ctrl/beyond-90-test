/**
 * La memoria de los clubes por los que has pasado: cómo te llevabas con el míster y con el vestuario al irte
 * (flags.ex_ties), para enseñar en Vida a la gente con la que compartiste vestuario y para que, si vuelves, el juego lo
 * recuerde ("¿qué hay de nuevo, viejo?").
 */
import type { Player } from "@/types/player";
import { canonicalClub } from "@/lib/calendar/leagues";
import { readTrofeos, INDIVIDUAL } from "@/lib/honours";
import { getNpcName } from "@/lib/narrative/npcs";

export interface ExTie {
  c: string;
  w: number;
  re: number;
  rv: number;
}

type Flags = Record<string, string | boolean>;

export function readExTies(flags: Flags | null | undefined): ExTie[] {
  const raw = flags?.ex_ties;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as ExTie[];
    return Array.isArray(parsed) ? parsed.filter((t) => t && typeof t.c === "string") : [];
  } catch {
    return [];
  }
}

/** Los clubes anteriores (sin repetir y sin el actual), el más reciente primero. */
export function previousClubs(player: Pick<Player, "club" | "flags">): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const list = String(player.flags?.clubs_history ?? "").split("|").filter(Boolean).reverse();
  for (const c of list) {
    const key = canonicalClub(c);
    if (seen.has(key) || key === canonicalClub(player.club)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/** ¿Vuelves a un club en el que ya jugaste? */
export function isReturningTo(player: Pick<Player, "club" | "flags">): boolean {
  const key = canonicalClub(player.club);
  return String(player.flags?.clubs_history ?? "").split("|").filter(Boolean).some((c) => canonicalClub(c) === key);
}

/** Lo que se sabe de tu etapa anterior en ese club: temporadas, títulos ganados allí y cómo os despedisteis. */
export function pastStint(player: Pick<Player, "club" | "flags">) {
  const flags = player.flags ?? {};
  const key = canonicalClub(player.club);
  const seasons = Object.entries(flags).filter(([k, v]) => /^club_s\d+$/.test(k) && typeof v === "string" && canonicalClub(v) === key).length;
  const titles = readTrofeos(flags).filter((t) => !INDIVIDUAL.has(t.k) && t.c && canonicalClub(t.c) === key);
  const tie = readExTies(flags).find((t) => canonicalClub(t.c) === key);
  return { seasons, titles, tie };
}

export interface ExMember {
  key: string;
  name: string;
  label: string;
  detail: string;
  value?: number;
}

/** El míster y el capitán de cada club anterior, con cómo te llevabas con ellos al irte. */
export function exClubMembers(player: Player, max = 8): ExMember[] {
  const ties = readExTies(player.flags);
  const out: ExMember[] = [];
  for (const club of previousClubs(player)) {
    const tie = ties.find((t) => canonicalClub(t.c) === canonicalClub(club));
    const asClub = { ...player, club };
    const coach = getNpcName(asClub, "entrenador");
    const captain = getNpcName(asClub, "capitan");
    const warm = (n: number) => (n >= 70 ? "Os llevabais de maravilla." : n >= 45 ? "Buena relación, sin más." : "Os despedisteis con frialdad.");
    out.push({
      key: `ex-ent-${club}`,
      name: coach,
      label: `Entrenador en ${club}`,
      detail: tie ? warm(tie.re) : `Te dirigió en ${club}.`,
      value: tie?.re,
    });
    out.push({
      key: `ex-cap-${club}`,
      name: captain,
      label: `Capitán en ${club}`,
      detail: tie ? (tie.rv >= 70 ? "Fue de los que más te echó de menos." : tie.rv >= 45 ? "Compartisteis vestuario, buen trato." : "Nunca terminasteis de conectar.") : `Compañero de vestuario en ${club}.`,
      value: tie?.rv,
    });
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}
