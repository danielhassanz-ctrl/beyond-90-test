/**
 * Métricas de negocio del juego a partir de la tabla de jugadores, sin ninguna herramienta de analítica de terceros
 * (no hay cookies ni nada que declarar en la política de privacidad). Solo las ve el dueño en /admin.
 *
 * "Supervivencia a N días" = qué parte de los jugadores creados hace al menos N días ha vuelto a tomar una decisión
 * N días o más después de crear su carrera (last_active_at - created_at >= N). Es una aproximación honesta de la
 * retención clásica: no sabe qué días exactos entró, pero sí si seguía jugando pasado ese día.
 */

export interface MetricPlayer {
  created_at: string | null;
  last_active_at: string | null;
  streak_days: number | null;
  week: number | null;
  mode: string | null;
  status: string | null;
  flags: Record<string, string | boolean> | null;
}

const DAY = 24 * 60 * 60 * 1000;
/** Coste medio por llamada de IA medido el 12-oct-2026 (0,82 US$ / 74 llamadas, a tarifa Haiku). */
export const AI_COST_PER_CALL_USD = 0.011;
/** Precio del pack de fotos (céntimos → euros), ver CREDIT_PACK en images/credits.ts. */
export const PACK_PRICE_EUR = 2.99;

const ms = (iso: string | null) => (iso ? new Date(iso).getTime() : NaN);
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;

export interface Metrics {
  total: number;
  new24h: number;
  new7d: number;
  new30d: number;
  active24h: number;
  active7d: number;
  /** % que llegó a tomar al menos una decisión. */
  activation: number | null;
  /** Supervivencia a 1, 3, 7 y 14 días: { días, cohorte, volvieron, pct }. */
  survival: { days: number; cohort: number; returned: number; pct: number | null }[];
  medianWeek: number;
  reachedWeek30: number | null;
  reachedWeek100: number | null;
  byStatus: Record<string, number>;
  byMode: Record<string, number>;
  avgStreak: number;
  photos: { freeUsedTotal: number; payers: number; packsSold: number; revenueEur: number; outOfFreeTier: number };
  ai: { totalCalls: number; avgPerPlayer: number; estimatedCostUsd: number };
}

export function computeMetrics(players: MetricPlayer[], now: number = Date.now()): Metrics {
  const total = players.length;
  const created = (p: MetricPlayer) => ms(p.created_at);
  const last = (p: MetricPlayer) => ms(p.last_active_at);

  const within = (t: number, days: number) => !Number.isNaN(t) && now - t <= days * DAY;

  const survival = [1, 3, 7, 14].map((days) => {
    const cohort = players.filter((p) => !Number.isNaN(created(p)) && now - created(p) >= days * DAY);
    const returned = cohort.filter((p) => !Number.isNaN(last(p)) && last(p) - created(p) >= days * DAY).length;
    return { days, cohort: cohort.length, returned, pct: pct(returned, cohort.length) };
  });

  const weeks = players.map((p) => p.week ?? 0).sort((a, b) => a - b);
  const medianWeek = weeks.length ? weeks[Math.floor(weeks.length / 2)] : 0;

  const count = (key: "status" | "mode") =>
    players.reduce<Record<string, number>>((acc, p) => {
      const k = p[key] ?? "desconocido";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

  const sessions = (p: MetricPlayer) => String(p.flags?.img_paid_sessions ?? "").split(",").filter(Boolean).length;
  const packsSold = players.reduce((n, p) => n + sessions(p), 0);
  const aiCalls = players.reduce((n, p) => n + num(p.flags?.ai_used), 0);

  return {
    total,
    new24h: players.filter((p) => within(created(p), 1)).length,
    new7d: players.filter((p) => within(created(p), 7)).length,
    new30d: players.filter((p) => within(created(p), 30)).length,
    active24h: players.filter((p) => within(last(p), 1)).length,
    active7d: players.filter((p) => within(last(p), 7)).length,
    activation: pct(players.filter((p) => !Number.isNaN(last(p))).length, total),
    survival,
    medianWeek,
    reachedWeek30: pct(players.filter((p) => (p.week ?? 0) >= 30).length, total),
    reachedWeek100: pct(players.filter((p) => (p.week ?? 0) >= 100).length, total),
    byStatus: count("status"),
    byMode: count("mode"),
    avgStreak: total ? Math.round((players.reduce((n, p) => n + (p.streak_days ?? 0), 0) / total) * 10) / 10 : 0,
    photos: {
      freeUsedTotal: players.reduce((n, p) => n + num(p.flags?.img_free_used), 0),
      payers: players.filter((p) => sessions(p) > 0).length,
      packsSold,
      revenueEur: Math.round(packsSold * PACK_PRICE_EUR * 100) / 100,
      outOfFreeTier: players.filter((p) => p.flags?.free_tier_eligible === "no").length,
    },
    ai: {
      totalCalls: aiCalls,
      avgPerPlayer: total ? Math.round((aiCalls / total) * 10) / 10 : 0,
      estimatedCostUsd: Math.round(aiCalls * AI_COST_PER_CALL_USD * 100) / 100,
    },
  };
}
