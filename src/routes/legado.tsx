import { createFileRoute } from "@tanstack/react-router";
import { Lock, Trophy } from "lucide-react";
import { GameShell } from "@/components/game/GameShell";
import { achievementList } from "@/game/engine";
import type { GameState } from "@/game/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/legado")({
  head: () => ({
    meta: [
      { title: "Legado — BEYOND 90" },
      { name: "description", content: "Logros desbloqueados y bloqueados, más el diario completo de tu carrera futbolística." },
      { property: "og:title", content: "Legado — BEYOND 90" },
      { property: "og:description", content: "Todo lo que has conseguido y todo lo que aún te falta." },
    ],
  }),
  component: () => <GameShell>{({ state }) => <Legacy state={state} />}</GameShell>,
});

function Legacy({ state }: { state: GameState }) {
  const list = achievementList(state);
  const unlocked = list.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-kicker">Legado</p>
            <h1 className="truncate font-display text-2xl">{state.player.name}</h1>
          </div>
          <p className="font-num shrink-0 text-2xl font-bold text-gold">
            {unlocked}/{list.length}
          </p>
        </div>
      </section>

      <ul className="space-y-2">
        {list.map((a) => (
          <li
            key={a.id}
            className={cn(
              "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl border p-3",
              a.unlocked ? "border-gold/50 bg-surface-2" : "border-border bg-surface opacity-60",
            )}
          >
            {a.unlocked ? (
              <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
            ) : (
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="font-cond text-base font-semibold uppercase tracking-[0.1em]">{a.name}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <section>
        <p className="text-kicker">Diario de carrera</p>
        <ol className="mt-3 space-y-2 border-l border-border pl-4">
          {state.log.slice(0, 40).map((l, i) => (
            <li key={i} className="relative">
              <span
                className={cn(
                  "absolute -left-[1.32rem] top-1.5 h-2 w-2 rounded-full",
                  l.tone === "gold"
                    ? "bg-gold"
                    : l.tone === "good"
                      ? "bg-accent"
                      : l.tone === "bad"
                        ? "bg-destructive"
                        : "bg-muted-foreground",
                )}
              />
              <p className="font-cond text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                {l.season} · {l.age} años
              </p>
              <p className="text-sm leading-snug text-foreground/85">{l.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
