/**
 * LA PAREJA COMO SISTEMA. Tener pareja no es solo una bandera: hay una relación (0-100) que sube y baja con lo que
 * decides, y ella tiene su propia vida: a unas ciudades se adapta enseguida y de otras quiere irse. Eso cambia lo que
 * pasa después: opina de los fichajes (y se nota en la relación y en la escena), te pone las cosas difíciles si
 * quiere volver a casa, se enfría si la descuidas y, si llega a cero, se va.
 *
 *   pareja            nombre completo de la pareja ("" = sin pareja)
 *   pareja_rel        relación 0-100 (empieza en 70)
 *   pareja_rel_de     de quién es esa relación (para empezar de cero con una pareja nueva)
 *   pareja_last_week  último turno en que le dedicaste algo (si pasa mucho, se enfría sola)
 *   pareja_delta      efecto de UNA escena sobre la relación (lo consume resolveEvent)
 *   pareja_baja / pareja_rota_ya / pareja_reacia / pareja_encantada   estados que desbloquean escenas
 */
import { canonicalClub } from "@/lib/calendar/leagues";
import type { GameEvent } from "@/types/career";

type Flags = Record<string, string | boolean>;

export const PARTNER_START_REL = 70;
/** Cada cuántos turnos sin dedicarle nada se enfría un poco la relación. */
const DRIFT_EVERY = 12;

export type CityStance = "encantada" | "neutral" | "reacia";

export function partnerOf(flags: Flags | null | undefined): string | null {
  const p = flags?.pareja;
  return typeof p === "string" && p ? p : null;
}

export const partnerFirstName = (partner: string) => partner.split(" ")[0];

export function partnerRel(flags: Flags | null | undefined): number {
  const partner = partnerOf(flags);
  if (!partner || flags?.pareja_rel_de !== partner) return PARTNER_START_REL;
  const n = parseInt(String(flags?.pareja_rel ?? ""), 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : PARTNER_START_REL;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % 100;
}

/** Cómo lleva ELLA vivir en esa ciudad: fijo para cada pareja y club (a unas ciudades se adapta y a otras no). */
export function cityStance(partner: string, club: string): CityStance {
  const v = hash(`${partner}|${canonicalClub(club)}`);
  return v < 35 ? "encantada" : v < 65 ? "neutral" : "reacia";
}

export function describeRel(rel: number): string {
  if (rel >= 85) return "Os queréis a rabiar";
  if (rel >= 65) return "Muy bien";
  if (rel >= 45) return "Normal, con sus altibajos";
  if (rel >= 25) return "Fría: hay distancia";
  return "Al borde de la ruptura";
}

export function describeCity(partner: string, club: string): string {
  const name = partnerFirstName(partner);
  switch (cityStance(partner, club)) {
    case "encantada":
      return `${name} está encantada con la vida en ${club}.`;
    case "reacia":
      return `${name} no acaba de adaptarse a ${club} y echa de menos su casa.`;
    default:
      return `${name} lleva bien lo de vivir en ${club}, sin más.`;
  }
}

export interface MoveReaction {
  delta: number;
  text: string;
}

/** Qué le parece a tu pareja que cambies de {fromClub} a {toClub}: cuánto cambia la relación y qué dice. */
export function moveReaction(partner: string, fromClub: string, toClub: string): MoveReaction | null {
  if (canonicalClub(fromClub) === canonicalClub(toClub)) return null;
  const name = partnerFirstName(partner);
  const from = cityStance(partner, fromClub);
  const to = cityStance(partner, toClub);
  if (to === "encantada" && from === "reacia") return { delta: 12, text: `${name} se echa a llorar de alegría: por fin se va de una ciudad que se le hacía cuesta arriba, y ${toClub} le encanta.` };
  if (to === "reacia" && from === "encantada") return { delta: -14, text: `${name} no dice nada en toda la cena. Dejar ${fromClub} le parte el alma y ${toClub} no le entusiasma nada.` };
  if (to === "reacia") return { delta: -9, text: `${name} asiente, pero se le nota el nudo en la garganta: ${toClub} no es la ciudad en la que se ve viviendo.` };
  if (from === "reacia") return { delta: 6, text: `${name} respira aliviada: cambiar de aires le viene bien después de lo que le costó adaptarse en ${fromClub}.` };
  if (to === "encantada") return { delta: 5, text: `${name} sonríe: ${toClub} le gusta y ya se imagina allí.` };
  return { delta: -2, text: `${name} lo acepta sin pegas, aunque otra mudanza más le cansa.` };
}

/** Lo que opina ANTES de decidir (se añade al texto de las ofertas): "tu pareja, de {club}...". */
export function partnerOpinionLine(partner: string, fromClub: string, toClub: string): string | null {
  const r = moveReaction(partner, fromClub, toClub);
  if (!r) return null;
  const name = partnerFirstName(partner);
  const to = cityStance(partner, toClub);
  const from = cityStance(partner, fromClub);
  if (to === "reacia" && from === "encantada") return `${name} te ha dejado claro lo que piensa: es feliz aquí y no quiere irse a ${toClub}.`;
  if (to === "reacia") return `${name} duda de ${toClub}: no se ve viviendo allí.`;
  if (from === "reacia") return `${name} lleva meses pidiendo un cambio de aires: con esto, se le ilumina la cara.`;
  if (to === "encantada") return `${name} ya ha mirado fotos de ${toClub} y le encanta la idea.`;
  return `${name} te apoyará, aunque otra mudanza le pesa.`;
}

export interface PartnerStepInput {
  club: string;
  /** Club al que te cambias con esta decisión (si la hay). */
  newClub?: string | null;
  week: number;
  eventId: string;
  moral?: number;
  /** Banderas que deja la opción elegida. */
  optionFlags?: Flags | null;
}

/**
 * Actualiza la relación tras una decisión. Devuelve las banderas que hay que fusionar y, si procede, una frase que
 * se añade a la reacción de la escena (lo que ella dice de la mudanza).
 */
export function stepPartner(flags: Flags | null | undefined, input: PartnerStepInput): { flags: Flags; note: string | null } {
  const merged: Flags = { ...(flags ?? {}), ...(input.optionFlags ?? {}) };
  const partner = partnerOf(merged);
  const clean: Flags = { pareja_delta: "" };
  if (!partner) {
    if (flags?.pareja_rel_de || flags?.pareja_baja || flags?.pareja_rota_ya || flags?.pareja_reacia || flags?.pareja_encantada) {
      return { flags: { ...clean, pareja_rel: "", pareja_rel_de: "", pareja_last_week: "", pareja_baja: false, pareja_rota_ya: false, pareja_reacia: false, pareja_encantada: false }, note: null };
    }
    return { flags: clean, note: null };
  }

  const isNew = merged.pareja_rel_de !== partner;
  let rel = isNew ? PARTNER_START_REL : partnerRel(merged);
  let last = isNew ? input.week : parseInt(String(merged.pareja_last_week ?? ""), 10) || input.week;
  let delta = 0;
  let note: string | null = null;

  const explicit = parseInt(String(input.optionFlags?.pareja_delta ?? ""), 10);
  if (Number.isFinite(explicit) && explicit !== 0) delta += explicit;
  else if (/^bank-(pa|p2|p3|p4)-/.test(input.eventId)) delta += Math.round((input.moral ?? 0) * 0.8);

  if (input.newClub && canonicalClub(input.newClub) !== canonicalClub(input.club)) {
    const react = moveReaction(partner, input.club, input.newClub);
    if (react) {
      delta += react.delta;
      note = react.text;
    }
  }

  if (delta !== 0) last = input.week;
  else if (input.week - last >= DRIFT_EVERY) {
    delta -= 2;
    last = input.week;
  }
  rel = Math.max(0, Math.min(100, rel + delta));

  const stance = cityStance(partner, input.newClub ?? input.club);
  return {
    flags: {
      ...clean,
      pareja_rel: String(rel),
      pareja_rel_de: partner,
      pareja_last_week: String(last),
      pareja_baja: rel <= 30,
      pareja_rota_ya: rel <= 10,
      pareja_reacia: stance === "reacia",
      pareja_encantada: stance === "encantada",
    },
    note,
  };
}

/**
 * Si la escena ofrece cambiar de club y tienes pareja, el texto recoge lo que ELLA opina de cada destino antes de
 * que decidas (y al elegir, la relación y la reacción lo reflejan: ver stepPartner).
 */
export function addPartnerOpinion(event: GameEvent, player: { club: string; flags?: Flags | null }): GameEvent {
  const partner = partnerOf(player.flags);
  if (!partner) return event;
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const option of event.options ?? []) {
    const dest = option.consequences?.club;
    if (typeof dest !== "string" || !dest || seen.has(canonicalClub(dest))) continue;
    seen.add(canonicalClub(dest));
    const line = partnerOpinionLine(partner, player.club, dest);
    if (line) lines.push(line);
  }
  return lines.length === 0 ? event : { ...event, description: `${event.description}

${lines.join(" ")}` };
}
