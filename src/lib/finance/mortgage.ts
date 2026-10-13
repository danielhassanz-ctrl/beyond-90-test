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
  /** Multiplicador de valor por reformas (1 = sin reformas). */
  valueAdj?: number;
  /** Ciudad donde está (la del club con el que vivías al comprarla). */
  city?: string;
  /** Puesta en alquiler: cada turno entra una renta neta. */
  rented?: boolean;
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

/**
 * Lo que vale hoy una propiedad. Antes valía siempre lo que costó. Las casas se revalorizan ~4 % anual; los
 * vehículos pierden valor con los años (coche -15 %, yate -7 %, jet -6 % al año, con un suelo). Un turno = un mes.
 */
export function propertyValue(p: PropertyRecord, week: number): number {
  const months = Math.max(0, week - (p.since ?? week));
  const kind = p.kind ?? "casa";
  let factor: number;
  if (kind === "coche") factor = Math.max(0.25, (1 - 0.15 / 12) ** months);
  else if (kind === "yate") factor = Math.max(0.4, (1 - 0.07 / 12) ** months);
  else if (kind === "jet") factor = Math.max(0.4, (1 - 0.06 / 12) ** months);
  else factor = (1 + 0.04 / 12) ** months * (p.valueAdj ?? 1);
  return Math.round((p.price * factor) / 100) * 100;
}

export function totalPropertyValue(flags: Record<string, string | boolean> | null | undefined, week: number): number {
  return readProperties(flags).reduce((n, p) => n + propertyValue(p, week), 0);
}

/** Renta anual neta de un inmueble alquilado (tras gastos, impuestos y periodos vacíos), sobre su valor. */
export const RENT_YIELD_NET = 0.032;
/** Gastos de una venta (agencia, impuestos, traspaso) sobre el valor. */
export const SALE_COST = 0.05;

/** Solo las casas se pueden alquilar; un coche, un yate o un jet no. */
export const canRent = (p: PropertyRecord): boolean => (p.kind ?? "casa") === "casa" || p.kind === "mansion";

/** Lo que entra cada turno si el inmueble está en alquiler. */
export function propertyRentMonthly(p: PropertyRecord, week: number): number {
  if (!p.rented || !canRent(p)) return 0;
  return Math.round((propertyValue(p, week) * RENT_YIELD_NET) / 12 / 10) * 10;
}

export function totalRentalIncome(flags: Record<string, string | boolean> | null | undefined, week: number): number {
  return readProperties(flags).reduce((n, p) => n + propertyRentMonthly(p, week), 0);
}

/** Lo que te queda al venderlo: valor menos gastos menos lo que aún debes al banco (puede ser negativo). */
export function saleProceeds(p: PropertyRecord, week: number): number {
  return Math.round(propertyValue(p, week) * (1 - SALE_COST)) - remainingLoan(p, week);
}

export function totalMonthlyPayments(flags: Record<string, string | boolean> | null | undefined): number {
  return readProperties(flags).reduce((n, p) => n + monthlyPayment(p), 0);
}

export function serializeProperty(p: PropertyRecord): string {
  const { key: _key, ...rest } = p;
  void _key;
  return JSON.stringify(rest);
}
