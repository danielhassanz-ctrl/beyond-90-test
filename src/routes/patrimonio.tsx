import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/components/game/GameShell";
import { ensureFinance, netWorth, totalDebt } from "@/game/finance";
import { clubById } from "@/game/data";
import type { GameState } from "@/game/types";

export const Route = createFileRoute("/patrimonio")({
  head: () => ({
    meta: [
      { title: "Patrimonio — BEYOND 90" },
      {
        name: "description",
        content: "Saldo, salario, patrocinios, propiedades y patrimonio neto de tu futbolista temporada a temporada.",
      },
      { property: "og:title", content: "Patrimonio — BEYOND 90" },
      { property: "og:description", content: "Cuánto ganas, cuánto gastas y qué queda cuando se apagan los focos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <GameShell>{({ state }) => <Wealth state={state} />}</GameShell>,
});

const k = (n: number) => `${Math.round(n).toLocaleString("es-ES")}.000 €`;

const DECISION_LABELS: Record<string, string> = {
  piso_alquiler: "Te independizaste",
  coche: "Compraste tu primer coche",
  piso_propio: "Compraste tu primera vivienda",
  ayuda_familia: "Ayudaste económicamente a tu familia",
  negocio_amigo: "Entraste en el negocio de un amigo",
  casa_grande: "Compraste una casa grande",
  mansion: "Diste el salto a una mansión",
  coche_absurdo: "Te diste un capricho de estrella",
  restaurante: "Invertiste en restauración",
  fondo: "Empezaste una cartera a largo plazo",
};

function Wealth({ state }: { state: GameState }) {
  const f = ensureFinance(state);
  const net = netWorth(state);
  const debt = totalDebt(state);
  const annualCommitments = f.commitments.reduce((sum, c) => sum + c.yearly, 0);
  const committedShare = f.annualSalary > 0 ? annualCommitments / f.annualSalary : 0;
  const debtShare = net > 0 ? debt / net : debt > 0 ? 1 : 0;
  const pressure = debtShare > 0.65 || committedShare > 0.45
    ? { label: "Alta", text: "Tu estilo de vida ya condiciona las próximas decisiones. Una mala temporada puede doler fuera del campo." }
    : debtShare > 0.3 || committedShare > 0.25
      ? { label: "Media", text: "Tienes margen, pero parte de lo que ganas ya está comprometido antes de empezar la temporada." }
      : { label: "Controlada", text: "Tu economía tiene aire. Puedes asumir oportunidades sin que cada decisión dependa del siguiente contrato." };
  const careerDecisions = f.boughtIds.map((id) => DECISION_LABELS[id] ?? id).slice(-5).reverse();

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <p className="text-kicker">Patrimonio neto</p>
        <p className="gold-text font-display text-4xl leading-none">{k(net)}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {clubById(state.clubId).short} · {state.age} años
          {debt > 0 ? ` · deuda pendiente ${k(debt)}` : " · sin deudas"}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Cell label="Saldo" value={k(f.cash)} />
          <Cell label="Ficha anual" value={k(f.annualSalary)} />
          <Cell label="Patrocinio" value={f.sponsorName ? k(f.sponsorIncome) : "—"} />
        </div>
        {f.sponsorName && (
          <p className="mt-3 font-cond text-xs uppercase tracking-[0.16em] text-accent">Marca: {f.sponsorName}</p>
        )}
      </section>

      <section className="panel p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-kicker">Presión financiera</p>
            <p className="mt-1 font-display text-2xl">{pressure.label}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Deuda / patrimonio: {Math.round(debtShare * 100)}%</p>
            <p>Compromisos / ficha: {Math.round(committedShare * 100)}%</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pressure.text}</p>
      </section>

      <section className="panel p-4">
        <p className="text-kicker">Decisiones que ya te definen</p>
        {careerDecisions.length === 0 && !f.sponsorName ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aún no has tomado una decisión económica grande. Cuando llegue, quedará aquí y seguirá pesando en tu carrera.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {f.sponsorName && (
              <li className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                Firmaste con <span className="font-semibold text-foreground">{f.sponsorName}</span>.
              </li>
            )}
            {careerDecisions.map((decision) => (
              <li key={decision} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-muted-foreground">
                {decision}.
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel p-4">
        <p className="text-kicker">Propiedades e inversiones</p>
        {f.properties.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no tienes nada a tu nombre. Las decisiones de dinero aparecerán en tu historia cuando la cuenta lo permita.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {f.properties.map((p) => (
              <li key={p.name} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate font-cond text-sm font-semibold">{p.name}</span>
                  <span className="font-num text-sm text-gold">{k(p.value)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.debt > 0 ? `Pendiente de pago: ${k(p.debt)}` : "Pagada"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {f.commitments.length > 0 && (
        <section className="panel p-4">
          <p className="text-kicker">Compromisos anuales</p>
          <ul className="mt-2 space-y-1">
            {f.commitments.map((c) => (
              <li key={c.name} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {c.name} · {c.seasonsLeft} temporada{c.seasonsLeft === 1 ? "" : "s"}
                </span>
                <span className="font-num">{k(c.yearly)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <p className="text-kicker">Historial económico</p>
        {f.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">El primer cierre económico llegará al final de la temporada.</p>
        ) : (
          f.history.map((h) => (
            <article key={h.season + h.text} className="panel p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-sm">{h.season}</span>
                <span className={h.amount >= 0 ? "font-num text-sm text-accent" : "font-num text-sm text-destructive"}>
                  {h.amount >= 0 ? "+" : ""}
                  {k(h.amount)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{h.text}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 py-2">
      <p className="font-num text-sm font-semibold">{value}</p>
      <p className="text-kicker">{label}</p>
    </div>
  );
}
