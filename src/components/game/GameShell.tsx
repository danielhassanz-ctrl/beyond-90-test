import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useGame } from "@/game/store";
import { BottomNav } from "./BottomNav";
import { GameHeader } from "./GameHeader";

export function GameShell({ children }: { children: (args: { state: NonNullable<ReturnType<typeof useGame>["state"]> }) => ReactNode }) {
  const { state, ready, error, clearError, next } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!state) void navigate({ to: "/" });
    else if (!state.clubId) void navigate({ to: "/cantera" });
  }, [ready, state, navigate]);

  if (!ready) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background px-6">
        <p className="text-kicker animate-pulse">Cargando carrera…</p>
      </div>
    );
  }

  if (!state || !state.clubId) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background px-6 text-center">
        <div>
          <p className="text-kicker">{!state ? "Volviendo a portada…" : "Preparando tu cantera…"}</p>
          <button
            onClick={() => void navigate({ to: !state ? "/" : "/cantera" })}
            className="mt-4 rounded-lg border border-gold/60 px-4 py-3 font-cond text-xs font-bold uppercase tracking-[0.14em] text-gold"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <GameHeader state={state} />
      <main className="mx-auto max-w-md px-4 pt-4 safe-bottom">
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/50 bg-surface-2 p-3">
            <p className="text-sm text-destructive">{error}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  clearError();
                  next();
                }}
                className="rounded-lg border border-gold/60 px-3 py-2 font-cond text-xs font-bold uppercase tracking-[0.14em] text-gold"
              >
                Reintentar escena
              </button>
              <button
                onClick={clearError}
                className="rounded-lg border border-border px-3 py-2 font-cond text-xs uppercase tracking-[0.14em] text-muted-foreground"
              >
                Ocultar
              </button>
            </div>
          </div>
        )}
        {children({ state })}
      </main>
      <BottomNav />
    </div>
  );
}
