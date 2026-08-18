import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { SCENES } from "@/game/data";
import { eventById } from "@/game/events";
import { useGame } from "@/game/store";
import type { GameState, MatchData, Outcome } from "@/game/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/historia")({
  head: () => ({
    meta: [
      { title: "Historia — BEYOND 90" },
      { name: "description", content: "Escenas, decisiones y partidos: avanza semana a semana en la carrera de tu futbolista." },
      { property: "og:title", content: "Historia — BEYOND 90" },
      { property: "og:description", content: "Cada semana una escena cinematográfica y decisiones que cambian tu carrera." },
    ],
  }),
  component: () => <GameShell>{({ state }) => <Story state={state} />}</GameShell>,
});

function Story({ state }: { state: GameState }) {
  const { answerEvent, playMatch, next } = useGame();
  const [phase, setPhase] = useState<"pre" | "key">("pre");
  const [lastMatch, setLastMatch] = useState<MatchData | null>(null);

  const outcome = state.lastOutcome;
  const pending = state.pending;

  if (outcome) {
    return (
      <OutcomeCard
        outcome={outcome}
        match={lastMatch}
        onNext={() => {
          setLastMatch(null);
          setPhase("pre");
          next();
        }}
      />
    );
  }

  if (!pending) {
    return (
      <div className="panel p-6 text-center">
        <p className="text-kicker">Semana {state.week}</p>
        <h2 className="mt-2 font-display text-2xl">Sigue la temporada</h2>
        <PrimaryButton onClick={() => next()}>Avanzar</PrimaryButton>
      </div>
    );
  }

  if (pending.type === "rest") {
    return (
      <Scene image={SCENES.injury} kicker="Enfermería" title={pending.title}>
        <p className="text-sm leading-relaxed text-foreground/85">{pending.text}</p>
        <PrimaryButton onClick={() => next()}>Continuar</PrimaryButton>
      </Scene>
    );
  }

  if (pending.type === "season") {
    return (
      <Scene image={SCENES.tunnel} kicker="Fin de temporada" title={pending.summary.title}>
        <p className="text-sm leading-relaxed text-foreground/85">{pending.summary.text}</p>
        <Deltas outcome={pending.summary} />
        <PrimaryButton onClick={() => next()}>Nueva temporada</PrimaryButton>
      </Scene>
    );
  }

  if (pending.type === "event") {
    const event = eventById(pending.eventId);
    if (!event) {
      return (
        <div className="panel p-6 text-center">
          <PrimaryButton onClick={() => next()}>Continuar</PrimaryButton>
        </div>
      );
    }
    const text = typeof event.text === "function" ? event.text(state) : event.text;
    return (
      <Scene image={SCENES[event.image]} kicker={event.kicker} title={event.title}>
        <p className="text-[0.95rem] leading-relaxed text-foreground/85">{text}</p>
        <div className="mt-5 space-y-2.5">
          {event.choices.map((c) => (
            <button
              key={c.id}
              onClick={() => answerEvent(event.id, c.id)}
              className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-left transition-colors active:border-gold/70"
            >
              <span className="block font-cond text-base font-semibold uppercase tracking-[0.08em]">
                {c.label}
              </span>
              {c.hint && <span className="mt-0.5 block text-xs text-muted-foreground">{c.hint}</span>}
            </button>
          ))}
        </div>
      </Scene>
    );
  }

  const match = pending.match;
  const km = match.keyMoment;

  if (phase === "key" && km) {
    return (
      <Scene image={SCENES.match} kicker={`Minuto ${km.minute}'`} title="Jugada clave">
        <p className="text-[0.95rem] leading-relaxed text-foreground/85">{km.prompt}</p>
        <div className="mt-5 space-y-2.5">
          {km.options.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setLastMatch(match);
                playMatch(match, o.id);
              }}
              className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-left transition-colors active:border-gold/70"
            >
              <span className="block font-cond text-base font-semibold uppercase tracking-[0.08em]">{o.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{o.note}</span>
            </button>
          ))}
        </div>
      </Scene>
    );
  }

  return (
    <Scene image={SCENES.match} kicker={match.competition} title={`${match.home ? "vs" : "en"} ${match.opponent}`}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {match.unused
          ? "No estás en la lista. Toca ver el partido desde fuera."
          : match.benchOnly
            ? "Estás en la convocatoria, pero el once ya está decidido."
            : match.minutes >= 60
              ? "Sales de titular."
              : "Empiezas en el banquillo, con opciones de entrar."}
      </p>
      <PrimaryButton
        onClick={() => {
          if (km && match.minutes > 0) {
            setPhase("key");
            return;
          }
          setLastMatch(match);
          playMatch(match);
        }}
      >
        {match.unused ? "Ver el partido" : "Salir al campo"}
      </PrimaryButton>
    </Scene>
  );
}

function Scene({
  image,
  kicker,
  title,
  children,
}: {
  image: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="panel overflow-hidden">
      <div className="relative">
        <img src={image} alt="" loading="lazy" width={1280} height={720} className="h-48 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-kicker">{kicker}</p>
          <h2 className="mt-1 font-display text-2xl leading-tight">{title}</h2>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </article>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="gold-fill mt-5 w-full rounded-xl px-5 py-3.5 font-cond text-base font-bold uppercase tracking-[0.18em] active:scale-[0.99]"
    >
      {children}
    </button>
  );
}

function Deltas({ outcome }: { outcome: Outcome }) {
  if (outcome.deltas.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {outcome.deltas.map((d) => (
        <li
          key={d.label + d.value}
          className={cn(
            "font-num rounded-lg border px-2 py-1 text-xs",
            d.tone === "good" ? "border-accent/50 text-accent" : "border-destructive/50 text-destructive",
          )}
        >
          {d.label} {d.value}
        </li>
      ))}
    </ul>
  );
}

function OutcomeCard({
  outcome,
  match,
  onNext,
}: {
  outcome: Outcome;
  match: MatchData | null;
  onNext: () => void;
}) {
  return (
    <Scene
      image={match ? SCENES.match : SCENES.locker}
      kicker={match ? `${match.competition} · ${match.home ? "casa" : "fuera"}` : "Consecuencias"}
      title={outcome.title}
    >
      {match && (
        <div className="mb-4 rounded-xl border border-border bg-surface-2 p-4 text-center">
          <p className="text-kicker">{match.home ? "Tu equipo" : match.opponent}</p>
          <p className="font-num mt-1 text-4xl font-bold text-gold">
            {match.goalsFor} - {match.goalsAgainst}
          </p>
          <p className="mt-1 font-cond text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {match.home ? `vs ${match.opponent}` : "a domicilio"}
          </p>
        </div>
      )}
      <p className="text-[0.95rem] leading-relaxed text-foreground/85">{outcome.text}</p>
      {match && match.moments.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {match.moments.map((m, i) => (
            <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm">
              <span className="font-num text-gold-soft">{m.minute}'</span>
              <span
                className={cn(
                  "min-w-0",
                  m.tone === "good" ? "text-accent" : m.tone === "bad" ? "text-destructive" : "text-foreground/80",
                )}
              >
                {m.text}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Deltas outcome={outcome} />
      <PrimaryButton onClick={onNext}>Siguiente semana</PrimaryButton>
    </Scene>
  );
}
