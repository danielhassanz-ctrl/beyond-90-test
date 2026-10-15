/**
 * LA DINASTÍA. Cuando te retiras y tienes hijos, puedes seguir la saga: empiezas una carrera nueva con uno de ellos, que lleva tu
 * apellido, hereda parte de tu patrimonio, entra al mundo del fútbol con la fama (y la presión) de ser hijo de una leyenda, y
 * tiene a su padre y a su madre de verdad en su vida. Tu carrera queda guardada como un eslabón de la saga y se ve en el Legado.
 */
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { readChildren, type Child } from "@/lib/narrative/children";
import { PERSONALITIES, POSITIONS, FEET, NO_CLUB_YET } from "@/lib/constants";
import { readTrofeos } from "@/lib/honours";

type Flags = Record<string, string | boolean>;

export interface SagaEntry {
  /** Cómo se le conocía («3 patas»). */
  n: string;
  club: string;
  titles: number;
  goals: number;
  matches: number;
  media: number;
  fama: number;
  /** ¿Ganó el Balón de Oro? */
  bo: boolean;
  nation: string;
  position: string;
  /** Temporadas de carrera. */
  seasons: number;
}

/** Fracción del patrimonio que hereda el hijo. */
export const INHERITANCE = 0.35;

export function readSaga(flags: Flags | null | undefined): SagaEntry[] {
  const raw = flags?.saga;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as SagaEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const dynastyGeneration = (flags: Flags | null | undefined): number => parseInt(String(flags?.dinastia_gen ?? "0"), 10) || 0;

/** ¿Puede este jugador seguir la saga? Retirado (o en su segunda vida) y con al menos un hijo. */
export function canContinueDynasty(player: Pick<Player, "status" | "flags">): boolean {
  if (!["retired", "awaiting_second_life", "second_life"].includes(player.status)) return false;
  return dynastyChildren(player.flags).length > 0;
}

/** Los hijos que pueden seguir la saga (el juego solo tiene carreras masculinas: las hijas no entran). */
export function dynastyChildren(flags: Flags | null | undefined): Child[] {
  return readChildren(flags).filter((c) => !c.f);
}

export function sagaEntryOf(player: Player): SagaEntry {
  const trofeos = readTrofeos(player.flags);
  return {
    n: displayName(player),
    club: player.club === NO_CLUB_YET ? "" : player.club,
    titles: Math.max(player.stats_titles ?? 0, trofeos.filter((t) => ["liga", "copa", "champions", "europa", "mundial", "eurocopa", "copa_america", "olimpico"].includes(t.k)).length),
    goals: player.stats_goals ?? 0,
    matches: player.stats_matches_played ?? 0,
    media: player.media ?? 0,
    fama: player.fama ?? 0,
    bo: trofeos.some((t) => t.k === "balon_oro") || Boolean(player.flags?.title_balon_oro),
    nation: player.nation,
    position: player.position,
    seasons: Math.max(1, Math.floor(((player.week ?? 1) - 1) / 10)),
  };
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return h >>> 0;
}

/** Los dos rasgos del hijo: uno heredado de su padre (si tenía) y otro propio, sin repetir. */
export function inheritedPersonality(parent: Pick<Player, "personality" | "id">, child: Child): string {
  const parentTraits = String(parent.personality ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  const first = parentTraits.length > 0 ? parentTraits[hash(`${parent.id}:${child.n}:t`) % parentTraits.length] : PERSONALITIES[hash(`${child.n}:a`) % PERSONALITIES.length];
  const pool = PERSONALITIES.filter((p) => p !== first);
  const second = pool[hash(`${parent.id}:${child.n}:u`) % pool.length];
  return `${first}, ${second}`;
}

export interface NewGenerationOpts {
  position: string;
  photoUrl?: string | null;
}

/** Los datos de la fila del hijo (lo que se inserta en players) y las banderas heredadas. */
export function newGenerationPlayer(parent: Player, child: Child, opts: NewGenerationOpts): { row: Record<string, unknown>; flags: Flags; carry: Flags } {
  const saga = [...readSaga(parent.flags), sagaEntryOf(parent)].slice(-6);
  const gen = dynastyGeneration(parent.flags) + 1;
  const partner = typeof parent.flags?.pareja === "string" && parent.flags.pareja ? parent.flags.pareja : "";
  const parentName = displayName(parent);
  const fatherFull = parent.nickname ? `${parent.nickname} ${parent.last_name}` : parent.last_name;
  const patrimonio = Math.round(((parent.patrimonio ?? 0) * INHERITANCE) / 1000) * 1000;
  // El apellido pesa: hijo de una leyenda entra con algo de fama (y la presión de que lo comparen).
  const fama = Math.max(8, Math.min(40, Math.round((parent.fama ?? 0) * 0.3 + (saga[saga.length - 1].bo ? 8 : 0))));
  const position = (POSITIONS as readonly string[]).includes(opts.position) ? opts.position : POSITIONS[hash(`${child.n}:pos`) % POSITIONS.length];
  const foot = hash(`${parent.id}:${child.n}:foot`) % 10 < 7 ? parent.foot : FEET.find((f) => f !== parent.foot) ?? FEET[0];
  const flags: Flags = {
    saga: JSON.stringify(saga),
    dinastia_gen: String(gen),
    padre_nombre: fatherFull,
    padre_apodo: parentName,
    ...(partner ? { madre_nombre: partner } : {}),
    dinastia_hijo: child.n,
  };
  // Lo que es del jugador de la cuenta y no del personaje: se copia con la service role porque la base de datos no deja
  // que una sesión de jugador cree créditos de fotos (ver supabase/migrations/20261012_harden_rls.sql).
  const carry: Flags = {};
  for (const k of ["img_paid_credits", "img_free_used", "free_tier_eligible"]) if (parent.flags?.[k] !== undefined) carry[k] = parent.flags[k];
  return {
    row: {
      user_id: parent.user_id,
      last_name: parent.last_name,
      nickname: child.n,
      number: parent.number,
      foot,
      nation: parent.nation,
      position,
      personality: inheritedPersonality(parent, child),
      club: NO_CLUB_YET,
      mode: parent.mode,
      photo_url: opts.photoUrl ?? null,
      patrimonio,
      fama,
    },
    flags,
    carry,
  };
}

/** Frases del padre/madre y de la prensa para la primera escena de la nueva generación. */
export function dynastyIntroLines(player: Pick<Player, "flags" | "last_name" | "nickname">): { father: string; mother: string | null; fatherEntry: SagaEntry | null } {
  const saga = readSaga(player.flags);
  const fatherEntry = saga.length > 0 ? saga[saga.length - 1] : null;
  const father = String(player.flags?.padre_nombre ?? "tu padre");
  const mother = typeof player.flags?.madre_nombre === "string" && player.flags.madre_nombre ? player.flags.madre_nombre : null;
  return { father, mother, fatherEntry };
}

export function describeLegacy(e: SagaEntry): string {
  const bits: string[] = [];
  if (e.bo) bits.push("Balón de Oro");
  if (e.titles > 0) bits.push(`${e.titles} ${e.titles === 1 ? "título" : "títulos"}`);
  if (e.goals > 0) bits.push(`${e.goals} goles`);
  bits.push(`media ${e.media}`);
  return bits.join(" · ");
}
