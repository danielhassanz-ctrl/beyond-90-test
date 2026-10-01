import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { isOwnerEmail } from "@/lib/images/credits";

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

  const { data: errors, error } = await supabase
    .from("app_errors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
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
              <p className="mt-1 text-[10px] text-muted-foreground/70">
                player: {(e.player_id as string | null) ?? "-"} · user: {(e.user_id as string | null) ?? "-"}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
