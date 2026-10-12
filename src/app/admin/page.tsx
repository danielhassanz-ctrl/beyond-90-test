import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { isOwnerEmail } from "@/lib/images/credits";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { computeMetrics, type MetricPlayer, type Metrics } from "@/lib/admin/metrics";

// Reloj fuera del render: la página se calcula en el servidor en cada petición.
const nowMs = () => Date.now();

/** Todas las carreras (solo las columnas necesarias), con la service role: RLS solo deja ver las propias. */
async function loadMetrics(): Promise<{ metrics: Metrics | null; problem: string | null }> {
  let service;
  try {
    service = createServiceClient();
  } catch {
    return { metrics: null, problem: "Falta SUPABASE_SERVICE_ROLE_KEY en este entorno (en producción sí está)." };
  }
  const { data, error } = await fetchAllRows<MetricPlayer>((from, to) =>
    service.from("players").select("created_at, last_active_at, streak_days, week, mode, status, flags").order("id").range(from, to),
  );
  if (error) return { metrics: null, problem: `No se pudieron leer los jugadores: ${error.message}` };
  return { metrics: computeMetrics(data, nowMs()), problem: null };
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-panel-border bg-surface p-3">
      <p className="font-num text-2xl font-bold text-foreground">{value}</p>
      <p className="text-kicker text-[10px]">{label}</p>
      {hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Panel mínimo para ver los errores registrados por logAppError sin
 * necesitar tirar de la CLI de Vercel ni del SQL Editor — pedido tras una
 * auditoría real: varios bugs graves de esta sesión estuvieron fallando
 * en silencio semanas sin que nadie se enterase. Gated por email del
 * dueño, igual que el resto del proyecto (isOwnerEmail).
 */
export default async function AdminPage() {
  const { supabase, user } = await getCurrentUserAndPlayer();

  if (!user || !isOwnerEmail(user.email)) {
    redirect("/mi-jugador");
  }

  const { metrics, problem } = await loadMetrics();

  const { data: errors, error } = await supabase
    .from("app_errors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
      <div className="w-full max-w-2xl space-y-3">
        <h1 className="font-display text-2xl">Negocio</h1>
        {problem && <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{problem}</p>}
        {metrics && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Kpi label="Jugadores" value={metrics.total} hint="incluye tus pruebas" />
              <Kpi label="Nuevos 24 h / 7 d" value={`${metrics.new24h} / ${metrics.new7d}`} hint={`${metrics.new30d} en 30 días`} />
              <Kpi label="Activos 24 h / 7 d" value={`${metrics.active24h} / ${metrics.active7d}`} />
              <Kpi label="Activación" value={metrics.activation === null ? "—" : `${metrics.activation} %`} hint="tomó alguna decisión" />
            </div>
            <div className="rounded-xl border border-panel-border bg-surface p-3">
              <p className="text-kicker mb-2 text-[10px]">Siguen jugando pasados N días (retención aproximada)</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {metrics.survival.map((s) => (
                  <div key={s.days}>
                    <p className="font-num text-xl font-bold text-gold">{s.pct === null ? "—" : `${s.pct} %`}</p>
                    <p className="text-[10px] text-muted-foreground">día {s.days} · {s.returned}/{s.cohort}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Kpi label="Turno mediano" value={metrics.medianWeek} />
              <Kpi label="Llegan al turno 30 / 100" value={`${metrics.reachedWeek30 ?? "—"} % / ${metrics.reachedWeek100 ?? "—"} %`} />
              <Kpi label="Racha media" value={`${metrics.avgStreak} días`} />
              <Kpi label="Estados" value={Object.entries(metrics.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Kpi label="Packs de fotos vendidos" value={metrics.photos.packsSold} hint={`${metrics.photos.payers} pagadores`} />
              <Kpi label="Ingresos (estimados)" value={`${metrics.photos.revenueEur.toLocaleString("es")} €`} hint="packs × 2,99 €" />
              <Kpi label="Llamadas de IA" value={metrics.ai.totalCalls} hint={`${metrics.ai.avgPerPlayer} por jugador`} />
              <Kpi label="Coste IA (estimado)" value={`${metrics.ai.estimatedCostUsd.toLocaleString("es")} US$`} hint="0,011 US$ por llamada" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Fotos gratis usadas: {metrics.photos.freeUsedTotal} · fuera del cupo gratuito: {metrics.photos.outOfFreeTier}. Los ingresos y el coste son
              estimaciones; el dato real está en Stripe y en platform.claude.com/cost.
            </p>
          </>
        )}
      </div>

      <div className="w-full max-w-2xl space-y-1">
        <h1 className="font-display text-2xl">Errores recientes</h1>
        <p className="text-sm text-muted-foreground">
          Últimos 100 errores registrados por el juego, más recientes primero.
        </p>
      </div>

      {error && (
        <p className="w-full max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          No se pudo leer app_errors: {error.message}
        </p>
      )}

      {!error && (!errors || errors.length === 0) && (
        <p className="text-sm text-muted-foreground">Sin errores registrados. Buena señal.</p>
      )}

      {errors && errors.length > 0 && (
        <div className="w-full max-w-2xl space-y-2">
          {errors.map((e) => (
            <div key={e.id as string} className="rounded-xl border border-panel-border bg-surface p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-cond text-xs font-semibold uppercase tracking-wide text-gold">
                  {e.context as string}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.created_at as string).toLocaleString("es")}
                </span>
              </div>
              <p className="mt-1 text-foreground/90">{e.message as string}</p>
              {e.detail != null && (
                <pre className="mt-1 overflow-x-auto rounded bg-surface-2 p-2 text-xs text-muted-foreground">
                  {JSON.stringify(e.detail, null, 2)}
                </pre>
              )}
              <p className="mt-1 text-[10px] text-muted-foreground">
                player: {(e.player_id as string | null) ?? "-"} · user: {(e.user_id as string | null) ?? "-"}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
