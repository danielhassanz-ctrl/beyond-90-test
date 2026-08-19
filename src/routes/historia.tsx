import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ContextFeed } from "@/components/game/ContextFeed";
import { GameShell } from "@/components/game/GameShell";
import { SCENES, clubById } from "@/game/data";
import { renderDynamic } from "@/game/dynamic";
import { eventById } from "@/game/events";
import { seasonLabel, stageLabel } from "@/game/engine";
import { useGame } from "@/game/store";
import type { DynamicCard, EventCategory, GameState, MatchData, Outcome, ShareData } from "@/game/types";
import { ShareButton } from "@/components/game/ShareButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/historia")({
  head: () => ({
    meta: [
      { title: "Historia — BEYOND 90" },
      { name: "description", content: "Escenas clave, decisiones narrativas y partidos decisivos de la carrera de tu futbolista." },
      { property: "og:title", content: "Historia — BEYOND 90" },
      { property: "og:description", content: "Cada escena una decisión: vestuario, prensa, representante y partidos que marcan una carrera." },
    ],
  }),
  component: () => <GameShell>{({ state }) => <Story state={state} />}</GameShell>,
});

const CATEGORY_STYLE: Record<EventCategory, string> = {
  story: "border-gold/45",
  training: "border-accent/35",
  life: "border-border",
  press: "border-sky-500/35",
  agent: "border-gold/60",
  gossip: "border-fuchsia-500/35",
  medical: "border-destructive/45",
  preseason: "border-accent/45",
  club: "border-gold/30",
  market: "border-emerald-500/40",
};

function Story({ state }: { state: GameState }) {
  const { answerEvent, answerFree, answerDynamic, playMatch, next } = useGame();
  const [phase, setPhase] = useState<"pre" | "key">("pre");
  const [lastMatch, setLastMatch] = useState<MatchData | null>(null);

  const outcome = state.lastOutcome;
  const pending = state.pending;

  let body: React.ReactNode;

  if (outcome) {
    body = (
      <OutcomeCard
        state={state}
        outcome={outcome}
        match={lastMatch}
        onNext={() => {
          setLastMatch(null);
          setPhase("pre");
          next();
        }}
      />
    );
  } else if (!pending) {
    body = (
      <div className="panel p-6 text-center">
        <p className="text-kicker">Escena {state.beat}</p>
        <h2 className="mt-2 font-display text-2xl">Sigue la temporada</h2>
        <PrimaryButton onClick={() => next()}>Avanzar</PrimaryButton>
      </div>
    );
  } else if (pending.type === "season") {
    body = (
      <Scene image={SCENES.celebration} kicker="Fin de temporada" title={pending.summary.title}>
        <p className="text-sm leading-relaxed text-foreground/85">{pending.summary.text}</p>
        <Deltas outcome={pending.summary} />
        {pending.summary.share && <ShareButton state={state} share={pending.summary.share} />}
        <PrimaryButton onClick={() => next()}>Nueva temporada</PrimaryButton>
      </Scene>
    );
  } else if (pending.type === "dynamic") {
    body = <DynamicScene state={state} card={pending} onChoice={answerDynamic} />;
  } else if (pending.type === "event") {
    const event = eventById(pending.eventId);
    if (!event) {
      body = (
        <div className="panel p-6 text-center">
          <PrimaryButton onClick={() => next()}>Continuar</PrimaryButton>
        </div>
      );
    } else {
      const text = typeof event.text === "function" ? event.text(state) : event.text;
      body = (
        <Scene
          image={SCENES[event.image]}
          kicker={event.kicker}
          title={event.title}
          accent={CATEGORY_STYLE[event.category ?? "life"]}
        >
          <p className="text-[0.95rem] leading-relaxed text-foreground/85">{text}</p>
          <div className="mt-5 space-y-2.5">
            {event.choices.map((c) => (
              <ChoiceButton
                key={c.id}
                label={c.label}
                hint={c.hint}
                onClick={() => answerEvent(event.id, c.id)}
              />
            ))}
          </div>
          {event.freeform && (
            <FreeResponse
              prompt={event.freeform.prompt}
              placeholder={event.freeform.placeholder}
              onSubmit={(t) => answerFree(event.id, t)}
            />
          )}
        </Scene>
      );
    }
  } else {
    const match = pending.match;
    const km = match.keyMoment;
    if (phase === "key" && km) {
      body = (
        <Scene image={SCENES.stadium} kicker={`Minuto ${km.minute}'`} title="Jugada clave" accent="border-gold/60">
          <p className="text-[0.95rem] leading-relaxed text-foreground/85">{km.prompt}</p>
          <div className="mt-5 space-y-2.5">
            {km.options.map((o) => (
              <ChoiceButton
                key={o.id}
                label={o.label}
                hint={o.note}
                onClick={() => {
                  setLastMatch(match);
                  playMatch(match, o.id);
                }}
              />
            ))}
          </div>
        </Scene>
      );
    } else {
      body = (
        <Scene
          image={SCENES.match}
          kicker={`${match.ctx.competition} · ${match.ctx.round}`}
          title={match.ctx.storyLabel}
          accent="border-gold/45"
        >
          <div className="mt-1 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-xs">
            <span className="font-cond font-semibold">{match.ctx.homeTeam}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-cond font-semibold">{match.ctx.awayTeam}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {match.ctx.venue} · {match.ctx.venueCity}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {match.unused
              ? "No estás en la lista. Toca ver el partido desde fuera."
              : match.benchOnly
                ? "Estás en la convocatoria, pero el once ya está decidido."
                : match.minutes >= 60
                  ? "Sales de titular."
                  : "Empiezas en el banquillo, con opciones de entrar."}
            {match.ctx.tie ? " Eliminatoria a partido único: si hay empate, penaltis." : ""}
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
  }

  return (
    <div>
      {body}
      <ContextFeed state={state} />
    </div>
  );
}

function DynamicScene({
  state,
  card,
  onChoice,
}: {
  state: GameState;
  card: DynamicCard;
  onChoice: (card: DynamicCard, choiceId: string, text?: string) => void;
}) {
  const view = renderDynamic(state, card);
  return (
    <Scene image={SCENES[view.image]} kicker={view.kicker} title={view.title} accent={CATEGORY_STYLE[view.category]}>
      <p className="text-[0.95rem] leading-relaxed text-foreground/85">{view.text}</p>
      <div className="mt-5 space-y-2.5">
        {view.choices.map((c) => (
          <ChoiceButton key={c.id} label={c.label} hint={c.hint} onClick={() => onChoice(card, c.id)} />
        ))}
      </div>
      {view.freeform && (
        <FreeResponse
          prompt={view.freeform.prompt}
          placeholder={view.freeform.placeholder}
          onSubmit={(t) => onChoice(card, "free", t)}
        />
      )}
    </Scene>
  );
}

function FreeResponse({
  prompt,
  placeholder,
  onSubmit,
}: {
  prompt: string;
  placeholder?: string | undefined;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="mt-5 rounded-xl border border-gold/30 bg-surface-2/60 p-3">
      <p className="text-kicker">{prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 400))}
        placeholder={placeholder ?? "Escribe lo que quieras…"}
        rows={3}
        className="mt-2 w-full resize-none rounded-lg border border-border bg-background/70 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-gold/60"
      />
      <button
        onClick={() => onSubmit(text.trim())}
        className="mt-2 w-full rounded-lg border border-gold/50 px-4 py-2.5 font-cond text-sm font-bold uppercase tracking-[0.16em] text-gold active:scale-[0.99]"
      >
        Responder
      </button>
    </div>
  );
}

function ChoiceButton({ label, hint, onClick }: { label: string; hint?: string | undefined; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-left transition-colors active:border-gold/70"
    >
      <span className="block font-cond text-base font-semibold uppercase tracking-[0.08em]">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
    </button>
  );
}

function Scene({
  image,
  kicker,
  title,
  children,
  accent,
}: {
  image: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
  accent?: string | undefined;
}) {
  return (
    <article className={cn("panel overflow-hidden", accent && `border ${accent}`)}>
      <div className="relative">
        <img src={image} alt="" loading="lazy" width={1280} height={720} className="h-44 w-full object-cover" />
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

function Cell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 py-1.5">
      <p className="font-num text-base font-semibold">{value}</p>
      <p className="text-kicker">{label}</p>
    </div>
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
  state,
  outcome,
  match,
  onNext,
}: {
  state: GameState;
  outcome: Outcome;
  match: MatchData | null;
  onNext: () => void;
}) {
  return (
    <Scene
      image={match ? SCENES.match : SCENES.locker}
      kicker={match ? `${match.ctx.competition} · ${match.ctx.isHome ? "casa" : "fuera"}` : "Consecuencias"}
      title={outcome.title}
      accent={outcome.tone === "gold" ? "border-gold/60" : undefined}
    >
      {match && (
        <div className="mb-4 rounded-xl border border-border bg-surface-2 p-4 text-center">
          <p className="text-kicker">{match.ctx.storyLabel}</p>
          <p className="font-num mt-1 text-4xl font-bold text-gold">
            {match.ctx.isHome ? match.goalsFor : match.goalsAgainst} - {match.ctx.isHome ? match.goalsAgainst : match.goalsFor}
          </p>
          <p className="mt-1 font-cond text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {match.ctx.homeTeam} · {match.ctx.awayTeam} · {match.ctx.venue}
          </p>

          {match.shootout && (
            <p className="mt-1 font-cond text-xs uppercase tracking-[0.14em] text-gold-soft">
              Penaltis {match.shootout.us}-{match.shootout.them}
            </p>
          )}
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
      {outcome.share && <ShareButton state={state} share={outcome.share} />}
      <PrimaryButton onClick={onNext}>Siguiente escena</PrimaryButton>
    </Scene>
  );
}
