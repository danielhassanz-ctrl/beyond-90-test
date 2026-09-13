/* ============================ PATRIMONIO ============================
 * Economía ligera pero real: caja, salario, primas, patrocinio, propiedades
 * y compromisos. Todas las cifras están en MILES de euros.
 * El dinero ganado y gastado persiste y se muestra en la retirada.
 */
import { clubById } from "./data";
import { moneyOfferAllowed, sponsorshipAllowed } from "./money-gating";
import { note } from "./mutate";
import type { DynamicCard, GameState } from "./types";
import type { DynamicResult, DynamicView } from "./dynamic";

export interface Property {
  name: string;
  value: number;
  debt: number;
}

export interface Commitment {
  name: string;
  yearly: number;
  seasonsLeft: number;
}

export interface FinanceLine {
  season: string;
  text: string;
  amount: number;
}

export interface Finance {
  cash: number;
  annualSalary: number;
  bonuses: number;
  sponsorName: string | null;
  sponsorIncome: number;
  properties: Property[];
  commitments: Commitment[];
  history: FinanceLine[];
  lastOfferScene: number;
  boughtIds: string[];
}

/**
 * UI money values are stored in thousands of euros. `toLocaleString("es-ES")`
 * intentionally leaves some four-digit values ungrouped (for example 1734),
 * which produced ambiguous strings such as `1734.000 €`. Keep grouping
 * deterministic across Safari/WebKit and Chromium instead of delegating this
 * display rule to each browser's locale heuristics.
 */
export function formatGroupedInteger(value: number): string {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function emptyFinance(salary = 0): Finance {
  return {
    cash: 0,
    annualSalary: salary,
    bonuses: 0,
    sponsorName: null,
    sponsorIncome: 0,
    properties: [],
    commitments: [],
    history: [],
    lastOfferScene: -99,
    boughtIds: [],
  };
}

export function ensureFinance(s: GameState): Finance {
  const raw = s.finance;
  const f: Finance = raw && typeof raw === "object" ? { ...emptyFinance(s.salary), ...raw } : emptyFinance(s.salary);
  if (!Array.isArray(f.properties)) f.properties = [];
  if (!Array.isArray(f.commitments)) f.commitments = [];
  if (!Array.isArray(f.history)) f.history = [];
  if (!Array.isArray(f.boughtIds)) f.boughtIds = [];
  for (const k of ["cash", "annualSalary", "bonuses", "sponsorIncome", "lastOfferScene"] as const) {
    if (typeof f[k] !== "number" || !Number.isFinite(f[k])) (f[k] as number) = 0;
  }
  f.annualSalary = Math.max(f.annualSalary, s.salary);
  s.finance = f;
  return f;
}

export function netWorth(s: GameState): number {
  const f = ensureFinance(s);
  const equity = f.properties.reduce((a, p) => a + Math.max(0, p.value - p.debt), 0);
  return Math.round(f.cash + equity);
}

export function totalDebt(s: GameState): number {
  const f = ensureFinance(s);
  return Math.round(f.properties.reduce((a, p) => a + Math.max(0, p.debt), 0));
}

/** Cierre económico de la temporada. Devuelve el desglose para el resumen. */
export function seasonFinance(s: GameState, seasonTitleCount = 0): { income: number; spend: number; net: number; text: string } {
  const f = ensureFinance(s);
  const season = s.seasons[s.seasons.length - 1];
  const apps = season?.apps ?? 0;
  const goals = season?.goals ?? 0;

  f.annualSalary = Math.max(0, s.salary);
  const bonuses = Math.round(apps * (2 + s.overall / 40) + goals * 4 + Math.max(0, seasonTitleCount) * 15);
  f.bonuses = bonuses;

  if (f.sponsorName) f.sponsorIncome = Math.round(20 + s.fame * 1.8 + s.overall * 0.6);
  else f.sponsorIncome = 0;

  const gross = f.annualSalary + bonuses + f.sponsorIncome;
  const taxes = Math.round(gross * 0.42);
  const agentCut = s.agent.present ? Math.round(gross * (s.agent.commission / 100)) : 0;
  const living = Math.round(18 + gross * 0.08 + f.properties.length * 12);
  const commitments = f.commitments.reduce((a, c) => a + (c.seasonsLeft > 0 ? c.yearly : 0), 0);

  // Hipotecas: se amortiza cada temporada lo que se pueda.
  let mortgage = 0;
  for (const p of f.properties) {
    if (p.debt <= 0) continue;
    const pay = Math.min(p.debt, Math.max(20, Math.round(p.value * 0.09)));
    p.debt = Math.max(0, p.debt - pay);
    mortgage += pay;
  }

  const spend = taxes + agentCut + living + commitments + mortgage;
  const net = gross - spend;
  f.cash = Math.max(0, Math.round(f.cash + net));
  for (const c of f.commitments) if (c.seasonsLeft > 0) c.seasonsLeft -= 1;
  f.commitments = f.commitments.filter((c) => c.seasonsLeft > 0);

  const label = season?.season ?? `Temporada ${s.seasonIndex}`;
  const text = `Ingresos ${gross}.000 € · gastos ${spend}.000 € · saldo ${f.cash}.000 €`;
  f.history.unshift({ season: label, text, amount: net });
  f.history = f.history.slice(0, 20);
  return { income: gross, spend, net, text };
}

/* ... rest of file unchanged below ... */
