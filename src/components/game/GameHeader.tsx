import { clubById } from "@/game/data";
import { seasonLabel, stageLabel, statusLabel } from "@/game/engine";
import type { GameState } from "@/game/types";
import { PlayerAvatar } from "./Avatar";
import { StatBar } from "./StatBar";

export function GameHeader({ state }: { state: GameState }) {
  const club = state.clubId ? clubById(state.clubId) : null;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/92 backdrop-blur-xl safe-top">
      <div className="mx-auto max-w-md px-4 pt-3 pb-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar src={state.player.avatar} name={state.player.name} className="h-12 w-12" />
            <div className="min-w-0">
              <p className="truncate font-display text-base leading-tight">
                {state.player.nickname || state.player.name}
              </p>
              <p className="truncate font-cond text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {state.age} años · {club ? club.short : "Sin club"} · {stageLabel(state.stage)}
              </p>
              <p className="truncate font-cond text-xs uppercase tracking-[0.16em] text-gold-soft">
                {seasonLabel(state.seasonIndex)} · {statusLabel(state)}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-kicker">Media</p>
            <p className="gold-text font-display text-4xl leading-none">{state.overall}</p>
            <p className="text-kicker mt-1">Forma</p>
            <p className="font-num text-lg font-semibold leading-none text-accent">{Math.round(state.form)}</p>
          </div>

        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          <StatBar label="Entrenador" value={state.rel.coach} compact />
          <StatBar label="Afición" value={state.rel.fans} tone="pitch" compact />
          <StatBar label="Vestuario" value={state.rel.dressing} tone="pitch" compact />
          <StatBar label="Representante" value={state.rel.agent} compact />
        </div>
      </div>
    </header>
  );
}
