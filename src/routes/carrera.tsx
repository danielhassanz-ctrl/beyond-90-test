import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/components/game/GameShell";
import { careerTotals, stageLabel } from "@/game/engine";
import type { GameState } from "@/game/types";

export const Route = createFileRoute("/carrera")({
  head: () => ({
    meta: [
      { title: "Carrera — BEYOND 90" },
      { name: "description", content: "Temporadas, clubes, media, partidos jugados, goles, asistencias e hitos de tu futbolista." },
      { property: "og:title", content: "Carrera — BEYOND 90" },
      { property: "og:description", content: "El historial completo de tu carrera: temporada a temporada." },
    ],
  }),
  component: () => <GameShell>{({ state }) => <Career state={state} />}</GameShell>,
});

function Career({ state }: { state: GameState }) {
  const totals = careerTotals(state);
  const isKeeperish = state.player.position === "POR" || state.player.position === "DFC";

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <p className="text-kicker">Totales de carrera</p>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <Stat label="PJ" value={totals.apps} />
          <Stat label={isKeeperish ? "Porterías 0" : "Goles"} value={isKeeperish ? totals.cleanSheets : totals.goals} />
          <Stat label="Asist." value={totals.assists} />
          <Stat label="Nota" value={totals.rating || "—"} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Potencial estimado por el club: <span className="font-num text-gold">{state.potential}</span> · Físico{" "}
          <span className="font-num">{state.fitness}</span> · Forma <span className="font-num">{state.form}</span>
          {state.contract ? ` · Contrato: ${state.contract}` : " · Sin contrato profesional"}
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-kicker">Temporadas</p>
        {[...state.seasons].reverse().map((s) => (
          <article key={s.season + s.club} className="panel p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg">{s.season}</h2>
                <p className="truncate font-cond text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {s.club} · {stageLabel(s.stage)} · {s.age} años
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-kicker">Media</p>
                <p className="font-num text-2xl font-bold text-gold">{s.overall}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <Stat label="PJ" value={s.apps} small />
              <Stat label={isKeeperish ? "Port. 0" : "Goles"} value={isKeeperish ? s.cleanSheets : s.goals} small />
              <Stat label="Asist." value={s.assists} small />
              <Stat label="Nota" value={s.apps ? Math.round((s.ratingSum / s.apps) * 10) / 10 : "—"} small />
            </div>
            {s.milestones.length > 0 && (
              <ul className="mt-3 space-y-1">
                {s.milestones.map((m) => (
                  <li key={m} className="text-sm text-accent">
                    · {m}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 py-2">
      <p className={small ? "font-num text-lg font-semibold" : "font-num text-2xl font-bold"}>{value}</p>
      <p className="text-kicker">{label}</p>
    </div>
  );
}
