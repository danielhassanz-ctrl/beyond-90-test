import { createFileRoute } from "@tanstack/react-router";
import { BriefcaseBusiness, Landmark, Lock, Trophy, Users } from "lucide-react";
import { GameShell } from "@/components/game/GameShell";
import { ShareButton } from "@/components/game/ShareButton";
import { careerPhase, careerSummary, PHASE_LABEL } from "@/game/career";
import { achievementList } from "@/game/engine";
import { postCareerStatus, type PostCareerPath, type PostCareerStyle } from "@/game/postcareer";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/legado")({
  head: () => ({
    meta: [
      { title: "Legado — BEYOND 90" },
      { name: "description", content: "Logros, diario y la vida que empieza después de tu carrera como futbolista." },
      { property: "og:title", content: "Legado — BEYOND 90" },
      { property: "og:description", content: "Todo lo que has conseguido y qué haces cuando se apagan los focos del jugador." },
    ],
  }),
  component: () => <GameShell>{({ state }) => <Legacy state={state} />}</GameShell>,
});

function Legacy({ state }: { state: GameState }) {
  const { choosePostCareer, choosePostCareerStyle } = useGame();
  const list = achievementList(state);
  const unlocked = list.filter((a) => a.unlocked).length;
  const summary = careerSummary(state);
  const phase = state.retired ? "Retirado" : PHASE_LABEL[careerPhase(state.age)];
  const post = postCareerStatus(state);

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-kicker">Legado · {phase}</p>
            <h1 className="truncate font-display text-2xl">{state.player.name}</h1>
          </div>
          <p className="font-num shrink-0 text-2xl font-bold text-gold">{unlocked}/{list.length}</p>
        </div>
      </section>

      {state.retired && (
        <section className="panel overflow-hidden border border-gold/35">
          <div className="border-b border-border bg-surface-2/70 p-4">
            <p className="text-kicker">Después del fútbol</p>
            <h2 className="mt-1 font-display text-2xl">{post.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">{post.text}</p>
          </div>
          <div className="space-y-2.5 p-4">
            {post.options.map((option) => {
              const path = option.id === "coach" || option.id === "agent" || option.id === "president" ? option.id : null;
              return (
                <button
                  key={option.id}
                  onClick={() => path ? choosePostCareer(path as PostCareerPath) : choosePostCareerStyle(option.id as PostCareerStyle)}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-left active:border-gold/70"
                >
                  {path === "coach" ? <Users className="h-5 w-5 text-gold" aria-hidden /> : path === "agent" ? <BriefcaseBusiness className="h-5 w-5 text-gold" aria-hidden /> : path === "president" ? <Landmark className="h-5 w-5 text-gold" aria-hidden /> : <Trophy className="h-5 w-5 text-gold" aria-hidden />}
                  <span className="min-w-0">
                    <span className="block font-cond text-sm font-bold uppercase tracking-[0.12em]">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
                  </span>
                </button>
              );
            })}
            {post.complete && (
              <div className="rounded-xl border border-gold/35 bg-gold/5 p-3">
                <p className="text-xs leading-relaxed text-foreground/80">
                  Esta decisión queda guardada en tu diario. Tu segunda carrera ya forma parte del legado de esta partida.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="panel p-4">
        <p className="text-kicker">Balance de carrera</p>
        <p className="mt-1 font-display text-lg text-gold">{summary.tier}</p>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
          {[
            { k: "Partidos", v: summary.apps },
            { k: "Goles", v: summary.goals },
            { k: "Asist.", v: summary.assists },
            { k: "Media máx.", v: summary.peakOverall },
            { k: "Títulos", v: summary.titles.length },
            { k: "Patrimonio", v: `${summary.wealth}k €` },
          ].map((x) => (
            <div key={x.k} className="rounded-lg border border-border bg-surface-2 p-2">
              <dd className="font-num text-lg font-bold">{x.v}</dd>
              <dt className="font-cond text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">{x.k}</dt>
            </div>
          ))}
        </dl>
        {summary.clubs.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Clubes: {summary.clubs.join(" · ")}</p>}
        {summary.titles.length > 0 && <p className="mt-1 text-xs text-accent">Palmarés: {summary.titles.join(" · ")}</p>}
        {summary.awards.length > 0 && <p className="mt-1 text-xs text-gold">Premios: {summary.awards.join(" · ")}</p>}
        <ShareButton
          state={state}
          label={state.retired ? "Compartir carrera" : "Compartir mi carrera"}
          share={{
            headline: state.retired ? `Carrera cerrada: ${summary.tier}` : `Mi carrera: ${summary.tier}`,
            kicker: phase,
            lines: [
              { label: "Media máx.", value: String(summary.peakOverall) },
              { label: "Partidos", value: String(summary.apps) },
              { label: "Goles", value: String(summary.goals) },
              { label: "Títulos", value: String(summary.titles.length) },
              { label: "Premios", value: String(summary.awards.length) },
            ],
          }}
        />
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
            {a.unlocked ? <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden /> : <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />}
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
              <span className={cn("absolute -left-[1.32rem] top-1.5 h-2 w-2 rounded-full", l.tone === "gold" ? "bg-gold" : l.tone === "good" ? "bg-accent" : l.tone === "bad" ? "bg-destructive" : "bg-muted-foreground")} />
              <p className="font-cond text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">{l.season} · {l.age} años</p>
              <p className="text-sm leading-snug text-foreground/85">{l.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
