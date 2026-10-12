/** Prueba: las métricas de negocio (altas, actividad, supervivencia a N días, fotos, coste de IA) salen bien de una lista de jugadores. */
import { computeMetrics, type MetricPlayer } from "../src/lib/admin/metrics";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const DAY = 86_400_000;
const NOW = Date.parse("2026-10-20T12:00:00Z");
const at = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();
const P = (o: Partial<MetricPlayer>): MetricPlayer => ({ created_at: at(10), last_active_at: at(10), streak_days: 0, week: 5, mode: "pro", status: "active", flags: {}, ...o });

const players: MetricPlayer[] = [
  P({ created_at: at(0.5), last_active_at: at(0.2), week: 3 }),                                       // nuevo hoy, jugando
  P({ created_at: at(2), last_active_at: null, week: 1 }),                                             // se registró pero no decidió nada
  P({ created_at: at(10), last_active_at: at(1), week: 120, streak_days: 4, flags: { ai_used: "60", img_free_used: "5", img_paid_sessions: "cs_1,cs_2", free_tier_eligible: "yes" } }), // veterano y pagador
  P({ created_at: at(10), last_active_at: at(9.5), week: 12 }),                                        // volvió el mismo día, no al día 1
  P({ created_at: at(20), last_active_at: at(5), week: 40, status: "retired", flags: { ai_used: "40", free_tier_eligible: "no" } }),
];
const m = computeMetrics(players, NOW);

console.log("Altas y actividad");
ok(m.total === 5, `total ${m.total}`);
ok(m.new24h === 1 && m.new7d === 2 && m.new30d === 5, `nuevos 24h/7d/30d = ${m.new24h}/${m.new7d}/${m.new30d}`);
ok(m.active24h === 2 && m.active7d === 3, `activos 24h/7d = ${m.active24h}/${m.active7d}`);
ok(m.activation === 80, `activación ${m.activation} % (4 de 5 tomaron una decisión)`);

console.log("Supervivencia");
const s1 = m.survival.find((s) => s.days === 1)!;
const s7 = m.survival.find((s) => s.days === 7)!;
ok(s1.cohort === 4 && s1.returned === 2, `día 1: ${s1.returned}/${s1.cohort} (el de ayer-mismo-día y el sin decisiones no cuentan)`);
ok(s7.cohort === 3 && s7.returned === 2 && s7.pct === 67, `día 7: ${s7.returned}/${s7.cohort} = ${s7.pct} %`);

console.log("Profundidad y negocio");
ok(m.reachedWeek100 === 20 && m.reachedWeek30 === 40, `llegan a semana 30: ${m.reachedWeek30} % · a la 100: ${m.reachedWeek100} %`);
ok(m.byStatus.retired === 1 && m.byStatus.active === 4, `estados ${JSON.stringify(m.byStatus)}`);
ok(m.photos.packsSold === 2 && m.photos.payers === 1 && m.photos.revenueEur === 5.98, `packs ${m.photos.packsSold}, ingresos ${m.photos.revenueEur} €`);
ok(m.photos.outOfFreeTier === 1 && m.photos.freeUsedTotal === 5, "fuera del cupo gratuito y fotos gratis usadas");
ok(m.ai.totalCalls === 100 && m.ai.avgPerPlayer === 20 && m.ai.estimatedCostUsd === 1.1, `IA: ${m.ai.totalCalls} llamadas, ${m.ai.estimatedCostUsd} US$`);

console.log("Sin jugadores no rompe");
const e = computeMetrics([], NOW);
ok(e.total === 0 && e.activation === null && e.survival.every((s) => s.pct === null) && e.medianWeek === 0, "todo a cero y porcentajes nulos");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
