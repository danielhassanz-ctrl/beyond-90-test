/**
 * Hipotecas de verdad. Antes comprar una casa solo descontaba la entrada y
 * dejaba una "hipoteca" que nunca se pagaba ni pesaba en nada. Ahora cada
 * propiedad financiada tiene una cuota mensual (un turno = un mes) que se
 * descuenta sola junto al sueldo, con una deuda pendiente que baja según
 * pagas — y si no llegas, el banco llama (ver finance-events.ts).
 *
 * Cada propiedad vive en player.flags.propiedad_* como JSON.
 */
export interface PropertyRecord {
  key: string;
  name: string;
  price: number;
  downPayment: number;
  photoUrl?: string | null;
  /** Semana de la compra (para calcular lo que ya has amortizado). */
  since?: number;
  /** 1 = cuota normal; <1 tras renegociarla con el banco. */
  paymentFactor?: number;
}

const ANNUAL_RATE = 0.035;
const MONTHS = 300; // 25 años
const R = ANNUAL_RATE / 12;
const FACTOR = (R * (1 + R) ** MONTHS) / ((1 + R) ** MONTHS - 1); // ≈ 0,5 % del capital al mes

export function readProperties(flags: Record<string, string | boolean> | null | undefined): PropertyRecord[] {
  const out: PropertyRecord[] = [];
  for (const [key, value] of Object.entries(flags ?? {})) {
    if (!key.startsWith("propiedad_") || typeof value !== "string" || !value) continue;
    try {
      const p = JSON.parse(value) as Omit<PropertyRecord, "key">;
      if (p && typeof p.price === "number") out.push({ key, ...p });
    } catch {
      // propiedad corrupta: se ignora
    }
  }
  return out;
}

export function originalLoan(p: PropertyRecord): number {
  return Math.max(0, p.price - p.downPayment);
}

/** Cuota mensual de una propiedad (0 si se pagó entera al contado). */
export function monthlyPayment(p: PropertyRecord): number {
  const loan = originalLoan(p);
  if (loan <= 0) return 0;
  return Math.round((loan * FACTOR * (p.paymentFactor ?? 1)) / 10) * 10;
}

/** Deuda pendiente tras los pagos hechos desde la compra. */
export function remainingLoan(p: PropertyRecord, week: number): number {
  const loan = originalLoan(p);
  if (loan <= 0) return 0;
  const k = Math.max(0, Math.min(MONTHS, week - (p.since ?? week)));
  const growth = (1 + R) ** MONTHS;
  const balance = (loan * (growth - (1 + R) ** k)) / (growth - 1);
  return Math.max(0, Math.round(balance));
}

export function totalMonthlyPayments(flags: Record<string, string | boolean> | null | undefined): number {
  return readProperties(flags).reduce((n, p) => n + monthlyPayment(p), 0);
}

export function serializeProperty(p: PropertyRecord): string {
  const { key: _key, ...rest } = p;
  void _key;
  return JSON.stringify(rest);
}
