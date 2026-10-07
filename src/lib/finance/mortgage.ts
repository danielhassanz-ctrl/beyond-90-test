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
  /** Plazo del préstamo en meses (por defecto 300 = 25 años, como una hipoteca). */
  termMonths?: number;
  /** Interés anual (por defecto 3,5 %). */
  rate?: number;
  /** Qué es: casa, mansion, coche, yate o jet (para nombrar la cuota: hipoteca o préstamo). */
  kind?: "casa" | "mansion" | "coche" | "yate" | "jet";
}

/** Financiación de los caprichos (coche, yate, jet): entrada, plazo e interés. Las casas siguen su propio camino. */
export const VEHICLE_FINANCING = {
  coche: { down: 0.2, months: 96, rate: 0.06 },
  yate: { down: 0.25, months: 180, rate: 0.05 },
  jet: { down: 0.3, months: 120, rate: 0.05 },
} as const;

export function vehicleFinancing(kind: keyof typeof VEHICLE_FINANCING, price: number) {
  const f = VEHICLE_FINANCING[kind];
  const step = kind === "coche" ? 500 : 5000;
  return { down: Math.round((price * f.down) / step) * step, termMonths: f.months, rate: f.rate, kind };
}

const DEFAULT_ANNUAL_RATE = 0.035;
const DEFAULT_MONTHS = 300; // 25 años

/** Parámetros de amortización de una propiedad (cada tipo de compra puede tener los suyos). */
function terms(p: Pick<PropertyRecord, "termMonths" | "rate">) {
  const n = p.termMonths ?? DEFAULT_MONTHS;
  const r = (p.rate ?? DEFAULT_ANNUAL_RATE) / 12;
  const factor = (r * (1 + r) ** n) / ((1 + r) ** n - 1);
  return { n, r, factor };
}

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
  return Math.round((loan * terms(p).factor * (p.paymentFactor ?? 1)) / 10) * 10;
}

/** Deuda pendiente tras los pagos hechos desde la compra. */
export function remainingLoan(p: PropertyRecord, week: number): number {
  const loan = originalLoan(p);
  if (loan <= 0) return 0;
  const { n, r } = terms(p);
  const k = Math.max(0, Math.min(n, week - (p.since ?? week)));
  const growth = (1 + r) ** n;
  const balance = (loan * (growth - (1 + r) ** k)) / (growth - 1);
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
