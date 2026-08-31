import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/components/game/GameShell";
import { StatBar } from "@/components/game/StatBar";
import { npc } from "@/game/npc";
import type { GameState } from "@/game/types";

export const Route = createFileRoute("/relaciones")({
  head: () => ({
    meta: [
      { title: "Relaciones — BEYOND 90" },
      { name: "description", content: "Entrenador, afición, vestuario, representante y familia: el entorno que sostiene o hunde tu carrera." },
      { property: "og:title", content: "Relaciones — BEYOND 90" },
      { property: "og:description", content: "Gestiona tu entorno: cuerpo técnico, grada, vestuario, representante y casa." },
    ],
  }),
  component: () => <GameShell>{({ state }) => <Relations state={state} />}</GameShell>,
});

function describe(value: number, good: string, mid: string, bad: string): string {
  return value >= 70 ? good : value >= 45 ? mid : bad;
}

function Relations({ state }: { state: GameState }) {
  const rows = [
    {
      label: "Entrenador",
      value: state.rel.coach,
      tone: "gold" as const,
      text: describe(
        state.rel.coach,
        "Confía en ti y te defiende en público.",
        "Te ve como una opción, no como una certeza.",
        "No cuenta contigo y no lo disimula.",
      ),
    },
    {
      label: "Afición",
      value: state.rel.fans,
      tone: "pitch" as const,
      text: describe(
        state.rel.fans,
        "Cantan tu nombre y te perdonan los malos días.",
        "Te conocen, aún no te quieren.",
        "Impacientes contigo: cada error se oye.",
      ),
    },
    {
      label: "Vestuario",
      value: state.rel.dressing,
      tone: "pitch" as const,
      text: describe(
        state.rel.dressing,
        "Eres del grupo; te cubren cuando hace falta.",
        "Te respetan sin más.",
        "Estás solo en el vestuario, y eso pesa.",
      ),
    },
    {
      label: "Representante",
      value: state.rel.agent,
      tone: "gold" as const,
      text: state.hasAgent
        ? describe(
            state.rel.agent,
            `${state.agentName} mueve cielo y tierra por ti.`,
            `${state.agentName} trabaja tu caso sin obsesionarse.`,
            `${state.agentName} está perdiendo el interés.`,
          )
        : "Todavía negocias solo. Ventaja: control. Riesgo: contratos peores.",
    },
    {
      label: "Familia",
      value: state.rel.family,
      tone: "pitch" as const,
      text: describe(
        state.rel.family,
        "En casa te sostienen sin pedir nada.",
        "Hay apoyo, pero también preguntas incómodas.",
        "La relación está tensa desde hace meses.",
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <p className="text-kicker">Estado personal</p>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <StatBar label="Ánimo" value={state.morale} />
          <StatBar label="Forma" value={state.form} tone="pitch" />
          <StatBar label="Físico" value={state.fitness} tone="pitch" />
          <StatBar label="Notoriedad" value={state.fame} />
        </div>
        {!!state.injury && (
          <p className="mt-3 text-sm text-destructive">
            {state.injury?.label} · {state.injury?.matchesOut ?? 0} partidos de baja estimados.
          </p>
        )}
      </section>

      <section className="panel p-4">
        <p className="text-kicker">Tu entorno</p>
        <ul className="mt-3 space-y-2">
          {([
            ["coach", "Entrenador"],
            ["captain", "Capitán"],
            ["rival", "Competencia por el puesto"],
            ["physio", "Fisioterapeuta"],
            ["press", "Prensa"],
            ["partner", "Pareja"],
          ] as const).map(([role, label]) => {
            const person = npc(state, role);
            return (
              <li key={role} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  <span className="truncate font-display text-sm">{person.name}</span>
                  <span className="ml-2 font-cond text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
                </span>
                <span className="font-num text-xs text-foreground/70">
                  {person.mood >= 66 ? "De tu lado" : person.mood >= 40 ? "Neutral" : "En tu contra"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="panel p-4">
            <StatBar label={r.label} value={r.value} tone={r.tone} />
            <p className="mt-2 text-sm leading-snug text-foreground/80">{r.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
