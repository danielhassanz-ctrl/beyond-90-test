/**
 * Palmarés: la lista real de trofeos de la carrera, decidida en CÓDIGO. Antes
 * un título solo contaba si el texto de una escena decía "campeón", así que
 * ganar una Liga o una Champions podía no dejar ni rastro. Ahora cada trofeo
 * se anota aquí (flags.trofeos) con su temporada, y de esta lista salen el
 * contador de títulos, la tarjeta de carrera y la página de palmarés.
 */
import type { Player } from "@/types/player";
import { leagueOf } from "@/lib/calendar/leagues";

export type TrofeoKind =
  | "liga"
  | "copa"
  | "champions"
  | "europa"
  | "mundial"
  | "eurocopa"
  | "copa_america"
  | "olimpico"
  | "balon_oro"
  | "golden_boy";

export interface Trofeo {
  /** Temporada (0 = la primera). */
  s: number;
  k: TrofeoKind;
  /** Club o selección con el que se ganó. */
  c: string;
  /** Detalle opcional: "2-1 al Inter", "a un punto del Barça"... */
  d?: string;
}

/** Los premios individuales no suman al contador de títulos de equipo. */
export const INDIVIDUAL: ReadonlySet<TrofeoKind> = new Set(["balon_oro", "golden_boy"]);

export const TROFEO_LABEL: Record<TrofeoKind, string> = {
  liga: "Liga",
  copa: "Copa del Rey",
  champions: "Champions League",
  europa: "Europa League",
  mundial: "Mundial",
  eurocopa: "Eurocopa",
  copa_america: "Copa América",
  olimpico: "Juegos Olímpicos",
  balon_oro: "Balón de Oro",
  golden_boy: "Golden Boy",
};

/** Nombre del título según con qué club se ganó: la Liga y la Copa son las del país de ese club (ver leagues.ts). */
export function trofeoLabel(t: { k: TrofeoKind; c?: string }): string {
  if (t.c && t.k === "copa") return leagueOf(t.c).cup;
  if (t.c && t.k === "liga") {
    const lg = leagueOf(t.c);
    return lg.id === "es" ? "Liga" : lg.name;
  }
  return TROFEO_LABEL[t.k];
}

export const TROFEO_ICON: Record<TrofeoKind, string> = {
  liga: "🏆",
  copa: "🥇",
  champions: "👑",
  europa: "🌟",
  mundial: "🌍",
  eurocopa: "🇪🇺",
  copa_america: "🌎",
  olimpico: "🏅",
  balon_oro: "⚽",
  golden_boy: "✨",
};

type Flags = Record<string, string | boolean>;

export function readTrofeos(flags: Flags | null | undefined): Trofeo[] {
  const raw = flags?.trofeos;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as Trofeo[];
    return Array.isArray(parsed) ? parsed.filter((t) => t && typeof t.k === "string") : [];
  } catch {
    return [];
  }
}

/** Devuelve la lista con el trofeo añadido, o null si ya estaba (misma temporada y competición). */
export function withTrofeo(list: Trofeo[], t: Trofeo): Trofeo[] | null {
  if (list.some((x) => x.s === t.s && x.k === t.k)) return null;
  return [...list, t].sort((a, b) => a.s - b.s);
}

export const writeTrofeos = (list: Trofeo[]): string => JSON.stringify(list);

/** Trofeos de equipo (los que cuentan como "títulos"). */
export function teamTitleCount(list: Trofeo[]): number {
  return list.filter((t) => !INDIVIDUAL.has(t.k)).length;
}

/**
 * ¿De qué competición habla este texto de título? Se mira en orden de
 * importancia: una crónica de Champions puede nombrar también la Liga.
 */
export function detectTrofeoKind(text: string): TrofeoKind | null {
  const t = text.toLowerCase();
  if (/champions/.test(t)) return "champions";
  if (/europa league/.test(t)) return "europa";
  if (/copa del rey|final de copa|\bcopa\b/.test(t) && !/copa am[eé]rica/.test(t)) return "copa";
  if (/copa am[eé]rica/.test(t)) return "copa_america";
  if (/mundial/.test(t)) return "mundial";
  if (/eurocopa/.test(t)) return "eurocopa";
  if (/liga/.test(t)) return "liga";
  return null;
}

export function legacyTrofeos(player: Pick<Player, "flags">): Trofeo[] {
  // Partidas anteriores al palmarés: lo que había en las banderas antiguas.
  const out: Trofeo[] = [];
  if (player.flags?.title_liga) out.push({ s: 0, k: "liga", c: "" });
  if (player.flags?.title_champions) out.push({ s: 0, k: "champions", c: "" });
  if (player.flags?.title_balon_oro) out.push({ s: 0, k: "balon_oro", c: "" });
  return out;
}

/** Palmarés efectivo: la lista nueva, o las banderas antiguas si aún no hay ninguna. */
export function allTrofeos(player: Pick<Player, "flags">): Trofeo[] {
  const list = readTrofeos(player.flags);
  return list.length > 0 ? list : legacyTrofeos(player);
}
