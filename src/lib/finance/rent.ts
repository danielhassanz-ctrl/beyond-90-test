/**
 * Alquiler de la vivienda en la ciudad del club. Un contrato vive en player.flags.alquiler como JSON y se paga cada
 * turno (un turno = un mes) hasta que te vas del club (ver el cambio de club en carrera/actions.ts).
 */
export interface Rent {
  name: string;
  monthly: number;
  city: string;
  since: number;
}

export function readRent(flags: Record<string, string | boolean> | null | undefined): Rent | null {
  const raw = flags?.alquiler;
  if (typeof raw !== "string" || !raw) return null;
  try {
    const r = JSON.parse(raw) as Rent;
    return r && typeof r.monthly === "number" ? r : null;
  } catch {
    return null;
  }
}

export const monthlyRent = (flags: Record<string, string | boolean> | null | undefined): number => readRent(flags)?.monthly ?? 0;
