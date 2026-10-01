import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Registro de errores en base de datos — pedido explícito tras una
 * auditoría real: varios bugs graves de esta sesión (la política RLS que
 * bloqueaba todas las fotos, el prompt al que le faltaba una regla
 * compartida) estuvieron fallando en silencio, sin que nadie se enterase
 * hasta que un jugador real lo notaba. `console.error` solo es visible
 * tirando de los logs de Vercel a mano (y con retención corta) — esto
 * deja un rastro permanente y consultable desde dentro de la propia app.
 *
 * Nunca debe poder romper el flujo que la llama: si el propio registro
 * falla, se traga el error y sigue (ver mismo patrón que logImageGeneration
 * en quota.ts).
 */
export async function logAppError(
  supabase: SupabaseClient,
  context: string,
  error: unknown,
  opts?: { userId?: string; playerId?: string; detail?: Record<string, unknown> },
): Promise<void> {
  try {
    const message = error instanceof Error ? error.message : String(error);
    await supabase.from("app_errors").insert({
      context,
      message,
      detail: opts?.detail ?? null,
      user_id: opts?.userId ?? null,
      player_id: opts?.playerId ?? null,
    });
  } catch (err) {
    console.error("[logAppError] no se pudo registrar el error:", err instanceof Error ? err.message : err);
  }
}
