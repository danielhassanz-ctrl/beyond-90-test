import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Clock, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { clubById } from "@/game/data";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/cantera")({
  head: () => ({
    meta: [
      { title: "Elige tu cantera — BEYOND 90" },
      { name: "description", content: "Betis, Villarreal, Sevilla o Málaga: cuatro propuestas de cantera con desarrollo, competencia, minutos y riesgo distintos." },
      { property: "og:title", content: "Elige tu cantera — BEYOND 90" },
      { property: "og:description", content: "Con 16 años, cuatro clubes te quieren. Tu elección define el camino al filial y al primer equipo." },
    ],
  }),
  component: Academy,
});

function Academy() {
  const { state, ready, pickClub } = useGame();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const offers = useMemo(
    () => (state?.offers ?? []).map((o) => ({ ...clubById(o.clubId), pitch: o.pitch })),
    [state?.offers],
  );

  useEffect(() => {
    if (ready && !state) void navigate({ to: "/onboarding" });
    if (ready && state?.clubId) void navigate({ to: "/historia" });
  }, [ready, state, navigate]);

  const confirm = () => {
    if (!selected) return;
    pickClub(selected);
    void navigate({ to: "/historia" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-8 safe-top">
        <p className="text-kicker">Verano · 16 años</p>
        <h1 className="mt-2 font-display text-3xl leading-tight">Cuatro canteras te quieren</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nadie te asigna un club. Lee bien: cada casa te ofrece un futuro distinto, y ninguna te ofrece garantías.
        </p>

        <ul className="mt-6 space-y-4">
          {offers.map((c) => {

            const active = selected === c.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition-all",
                    active
                      ? "border-gold/70 bg-surface-2 shadow-[var(--shadow-gold)]"
                      : "border-border bg-surface",
                  )}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-xl">{c.name}</h2>
                      <p className="font-cond text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {c.city} · {c.colors}
                      </p>
                    </div>
                    <span className="font-num shrink-0 rounded-lg border border-gold/40 px-2 py-1 text-xs text-gold">
                      Nivel {c.prestige}/5
                    </span>
                  </div>

                  <p className="mt-2 text-sm italic leading-snug text-foreground/70">{c.pitch}</p>


                  <dl className="mt-3 space-y-2 text-sm">
                    <Row Icon={TrendingUp} label="Desarrollo" text={c.development} />
                    <Row Icon={Users} label="Competencia" text={c.competition} />
                    <Row Icon={Clock} label="Minutos" text={c.minutes} />
                    <Row Icon={AlertTriangle} label="Riesgo" text={c.risk} tone="warn" />
                  </dl>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          onClick={confirm}
          disabled={!selected}
          className="gold-fill mt-6 w-full rounded-xl px-5 py-4 font-cond text-lg font-bold uppercase tracking-[0.18em] disabled:opacity-35"
        >
          Firmar en la cantera
        </button>
        <div className="h-10" />
      </div>
    </div>
  );
}

function Row({
  Icon,
  label,
  text,
  tone = "normal",
}: {
  Icon: typeof Users;
  label: string;
  text: string;
  tone?: "normal" | "warn";
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "warn" ? "text-destructive" : "text-accent")}
        aria-hidden
      />
      <div className="min-w-0">
        <dt className="text-kicker">{label}</dt>
        <dd className="text-sm leading-snug text-foreground/85">{text}</dd>
      </div>
    </div>
  );
}
