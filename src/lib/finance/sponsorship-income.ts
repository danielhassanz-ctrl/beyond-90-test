/**
 * Un patrocinio firmado no es un ingreso de una sola vez: además de la prima
 * de la firma, la marca paga una cantidad cada turno (un turno = un mes)
 * durante una temporada. Antes firmar con una marca daba un único pago y la
 * marca desaparecía de la partida.
 *
 * Cada contrato vive en player.flags.patrocinio_* como JSON.
 */
export interface SponsorshipRecord {
  key: string;
  name: string;
  /** Lo que ingresa cada turno mientras dura. */
  monthly: number;
  since: number;
  /** Semana hasta la que paga (incluida). */
  until: number;
}

/** Turnos que dura un contrato de patrocinio (una temporada). */
export const SPONSORSHIP_TURNS = 10;

export function readSponsorships(flags: Record<string, string | boolean> | null | undefined): SponsorshipRecord[] {
  const out: SponsorshipRecord[] = [];
  for (const [key, value] of Object.entries(flags ?? {})) {
    if (!key.startsWith("patrocinio_") || typeof value !== "string" || !value) continue;
    try {
      const s = JSON.parse(value) as Omit<SponsorshipRecord, "key">;
      if (s && typeof s.monthly === "number") out.push({ key, ...s });
    } catch {
      // contrato corrupto: se ignora
    }
  }
  return out;
}

export function activeSponsorships(flags: Record<string, string | boolean> | null | undefined, week: number): SponsorshipRecord[] {
  return readSponsorships(flags).filter((s) => week >= s.since && week <= s.until);
}

export function monthlySponsorshipIncome(flags: Record<string, string | boolean> | null | undefined, week: number): number {
  return activeSponsorships(flags, week).reduce((n, s) => n + s.monthly, 0);
}

/** Flag del contrato a partir de la prima de la firma (el pago mensual es un 12 % de la prima). */
export function sponsorshipFlagFor(
  eventId: string,
  name: string,
  signingBonus: number,
  week: number,
): Record<string, string> | null {
  const monthly = Math.round((signingBonus * 0.12) / 50) * 50;
  if (monthly <= 0) return null;
  const rec: Omit<SponsorshipRecord, "key"> = { name, monthly, since: week + 1, until: week + SPONSORSHIP_TURNS };
  return { [`patrocinio_${eventId.replace(/[^a-z0-9]+/gi, "_")}`]: JSON.stringify(rec) };
}
