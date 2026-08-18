import { clubById } from "@/game/data";
import { stageLabel, statusLabel, tierLabel } from "@/game/engine";
import { currentSeason } from "@/game/mutate";
import { openTeasers } from "@/game/threads";
import type { GameState } from "@/game/types";
import { cn } from "@/lib/utils";

function nextSporting(state: GameState): string {
  const slot = state.queue.find((q) => q.kind === "match");
  if (state.injury) return `Baja: ${state.injury.matchesOut} partidos`;
  return slot?.label ?? "Cierre de temporada";
}

function headline(state: GameState): string {
  const club = clubById(state.clubId).short;
  const name = state.player.nickname || state.player.name;
  if (state.injury) return `"${name} se pierde las próximas jornadas por ${state.injury.label.toLowerCase()}"`;
  if (state.form >= 78) return `"${name}, el chico del que habla toda la ciudad"`;
  if (state.form <= 32) return `"Dudas con ${name}: el ${club} busca alternativas"`;
  if (state.rel.coach <= 30) return `"Frialdad entre el técnico del ${club} y ${name}"`;
  if (state.fame >= 45) return `"${name} entra en las listas de futuras estrellas de LaLiga"`;
  return `"El ${club} protege a ${name}: paciencia y minutos medidos"`;
}

function criticalRel(state: GameState): { label: string; value: number } {
  const entries: { label: string; value: number }[] = [
    { label: "Entrenador", value: state.rel.coach },
    { label: "Vestuario", value: state.rel.dressing },
    { label: "Afición", value: state.rel.fans },
    { label: "Familia", value: state.rel.family },
  ];
  return entries.sort((a, b) => a.value - b.value)[0]!;
}

export function ContextFeed({ state }: { state: GameState }) {
  const season = currentSeason(state);
  const rating = season && season.apps ? Math.round((season.ratingSum / season.apps) * 10) / 10 : 0;
  const results = (state.recent ?? []).slice(0, 5);
  const teasers = openTeasers(state);
  const pts = results.reduce((a, r) => a + (r.res === "W" ? 3 : r.res === "D" ? 1 : 0), 0);
  const resGoals = results.reduce((a, r) => a + r.goals, 0);
  const critical = criticalRel(state);
  const prev = state.seasons.length > 1 ? state.seasons[state.seasons.length - 2]!.overall : null;
  const trend = prev !== null ? state.overall - prev : 0;

  return (
    <section className="mt-4 space-y-3 pb-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="panel p-3">
          <p className="text-kicker">Próxima cita</p>
          <p className="mt-1 font-cond text-sm font-semibold leading-snug">{nextSporting(state)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{statusLabel(state)}</p>
        </div>
        <div className="panel p-3">
          <p className="text-kicker">Clasificación</p>
          <p className="font-num mt-1 text-2xl font-bold text-gold">{state.tablePosition}º</p>
          <p className="text-xs text-muted-foreground">{stageLabel(state.stage)}</p>
        </div>
      </div>

      <div className="panel p-3">
        <p className="text-kicker">Temporada en curso</p>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          <Mini label="PJ" value={season?.apps ?? 0} />
          <Mini label="G" value={season?.goals ?? 0} />
          <Mini label="A" value={season?.assists ?? 0} />
          <Mini label="Nota" value={rating || "—"} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-kicker">Media · {tierLabel(state.overall)}</p>
            <p className="font-num text-xl font-bold text-gold">
              {state.overall}
              {trend !== 0 && (
                <span className={cn("ml-2 text-xs", trend > 0 ? "text-accent" : "text-destructive")}>
                  {trend > 0 ? "+" : ""}
                  {trend}
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-kicker">Forma</p>
            <p className="font-num text-xl font-bold">{Math.round(state.form)}</p>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="panel p-3">
          <div className="flex items-baseline justify-between">
            <p className="text-kicker">Últimos {results.length}</p>
            <p className="font-num text-xs text-muted-foreground">
              {pts} pts · {resGoals} {resGoals === 1 ? "gol" : "goles"} tuyos
            </p>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {results.map((r, i) => (
              <span
                key={i}
                className={cn(
                  "font-num grid h-6 w-6 place-items-center rounded text-[0.65rem] font-bold",
                  r.res === "W"
                    ? "bg-accent/25 text-accent"
                    : r.res === "L"
                      ? "bg-destructive/25 text-destructive"
                      : "bg-surface-2 text-foreground/70",
                )}
              >
                {r.res}
              </span>
            ))}
          </div>
          <ul className="mt-2 space-y-1 text-xs text-foreground/70">
            {results.slice(0, 3).map((r, i) => (
              <li key={i} className="truncate">
                · {r.gf}-{r.ga} {r.opponent}
                {r.played ? (r.goals ? ` · ${r.goals}G` : "") : " · sin minutos"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {teasers.length > 0 && (
        <div className="panel border-gold/30 p-3">
          <p className="text-kicker text-gold-soft">Algo se está cociendo</p>
          <ul className="mt-1 space-y-1 text-sm leading-snug text-foreground/85">
            {teasers.slice(0, 2).map((t) => (
              <li key={t.id}>· {t.teaser}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel p-3">
        <p className="text-kicker">Prensa</p>
        <p className="mt-1 text-sm italic leading-snug text-foreground/80">{headline(state)}</p>
      </div>

      {state.agent.present && (
        <div className="panel p-3">
          <p className="text-kicker">{state.agent.name} · {state.agent.commission}% comisión</p>
          <p className="mt-1 text-sm leading-snug text-foreground/80">
            {state.agent.teaser
              ? `"${state.agent.teaser}. Te llamo cuando tenga algo firme."`
              : state.agent.memories[0]
                ? `Recuerda: ${state.agent.memories[0].toLowerCase()}.`
                : "Sin novedades. Trabaja y deja que el teléfono suene."}
          </p>
        </div>
      )}

      {state.memory.rejectedClubs.length + state.memory.conflicts.length > 0 && (
        <div className="panel p-3">
          <p className="text-kicker">Memoria de carrera</p>
          <ul className="mt-1 space-y-1 text-xs text-foreground/70">
            {state.memory.rejectedClubs.slice(0, 2).map((c) => (
              <li key={c}>· Rechazaste al {c}.</li>
            ))}
            {state.memory.conflicts.slice(0, 2).map((c) => (
              <li key={c}>· {c}.</li>
            ))}
            {state.memory.promises.slice(0, 1).map((c) => (
              <li key={c} className="text-gold-soft">· {c}.</li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel p-3">
        <p className="text-kicker">Relación a vigilar</p>
        <p className="mt-1 font-cond text-sm font-semibold uppercase tracking-[0.1em]">
          {critical.label} · <span className="font-num">{Math.round(critical.value)}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {critical.value < 30
            ? "Situación delicada: una decisión más en falso y se rompe."
            : critical.value < 55
              ? "Terreno frío. Conviene un gesto pronto."
              : "Bajo control, pero no lo descuides."}
        </p>
      </div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 py-1.5">
      <p className="font-num text-base font-semibold">{value}</p>
      <p className="text-kicker">{label}</p>
    </div>
  );
}
