import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useGame } from "@/game/store";
import { BottomNav } from "./BottomNav";
import { GameHeader } from "./GameHeader";

export function GameShell({ children }: { children: (args: { state: NonNullable<ReturnType<typeof useGame>["state"]> }) => ReactNode }) {
  const { state, ready } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!state) void navigate({ to: "/" });
    else if (!state.clubId) void navigate({ to: "/cantera" });
  }, [ready, state, navigate]);

  if (!ready || !state || !state.clubId) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-kicker animate-pulse">Cargando carrera…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GameHeader state={state} />
      <main className="mx-auto max-w-md px-4 pt-4 safe-bottom">{children({ state })}</main>
      <BottomNav />
    </div>
  );
}
