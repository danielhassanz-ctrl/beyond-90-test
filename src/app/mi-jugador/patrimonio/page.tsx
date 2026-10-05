import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { seasonLabel, WEEKS_PER_SEASON } from "@/types/career";
import { getGameDateLabel } from "@/lib/calendar/season";
import { BottomNav } from "@/components/BottomNav";
import { weeklySalary } from "@/lib/narrative/engine";
import { findPropertyPrompt, findPropertyInteriorPrompt } from "@/lib/narrative/events";
import { readProperties, monthlyPayment, remainingLoan, totalMonthlyPayments } from "@/lib/finance/mortgage";
import { readInvestments, investmentValue } from "@/lib/finance/investments";
import { getOrCreatePropertyPhoto } from "@/lib/images/property-photos";
import { NO_CLUB_YET } from "@/lib/constants";

/** Cómo va la economía, en una frase honesta, según el patrimonio neto. */
function getFinancialPressure(patrimonio: number): { label: string; tone: string; description: string } {
  if (patrimonio < 20000) {
    return {
      label: "Ajustada",
      tone: "text-destructive",
      description: "Cada decisión pesa. Todavía no hay margen para asumir un mal mes.",
    };
  }
  if (patrimonio < 300000) {
    return {
      label: "Controlada",
      tone: "text-gold",
      description: "Tu economía tiene aire. Puedes asumir alguna oportunidad sin que todo dependa del siguiente contrato.",
    };
  }
  return {
    label: "Desahogada",
    tone: "text-pitch",
    description: "El dinero ya no es tu problema del día a día. Ahora se trata de no malgastarlo.",
  };
}

// Generar la foto de una propiedad sin foto puede tardar unos segundos la primera vez.
export const maxDuration = 60;

interface Movimiento {
  id: string;
  week: number;
  title: string;
  chosen: string | null;
  monto: number;
  isSecondLife: boolean;
}

const eur = (n: number) => `${Math.abs(n).toLocaleString("es")} €`;

function MovimientoRow({ m, sign }: { m: Movimiento; sign: "+" | "-" }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{m.chosen || m.title}</p>
        <p className="text-xs text-muted-foreground">
          {m.chosen ? `${m.title} · ` : ""}
          {m.isSecondLife ? `Semana ${m.week} de tu segunda vida` : `${getGameDateLabel(m.week)} · Temp. ${seasonLabel(m.week)}`}
        </p>
      </div>
      <span className={`font-num shrink-0 text-sm font-bold ${sign === "+" ? "text-pitch" : "text-destructive"}`}>
        {sign}
        {eur(m.monto)}
      </span>
    </li>
  );
}

export default async function PatrimonioPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  if (!player) {
    redirect("/crear-jugador");
  }

  const { data: allEvents } = await supabase
    .from("career_events")
    .select("id, week, title, category, consequences, chosen_option_label, created_at")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false });

  const movimientos: Movimiento[] = (allEvents ?? []).flatMap((e) => {
    const consequences = e.consequences as { patrimonio?: number } | null;
    const monto = consequences?.patrimonio;
    if (!monto) return [];
    // Los eventos de segunda vida guardan "week" como second_week (empieza
    // en 1 de nuevo), no la semana real de la carrera.
    return [
      {
        id: e.id as string,
        week: e.week as number,
        title: e.title as string,
        chosen: (e.chosen_option_label as string | null) ?? null,
        monto,
        isSecondLife: e.category === "segunda_vida",
      },
    ];
  });

  const ingresos = movimientos.filter((m) => m.monto > 0);
  const pagos = movimientos.filter((m) => m.monto < 0);
  const currentSeason = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const inSeason = (m: Movimiento) => !m.isSecondLife && Math.floor((m.week - 1) / WEEKS_PER_SEASON) === currentSeason;
  const total = (rows: Movimiento[]) => rows.reduce((acc, m) => acc + Math.abs(m.monto), 0);
  const monthlySalary = player.club !== NO_CLUB_YET ? weeklySalary(player.media) : 0;

  // Propiedades: foto exterior + foto interior. Si alguna no llegó a guardarse
  // (fallo puntual o propiedad anterior a las fotos de interior) se genera
  // ahora UNA sola vez por listado y queda cacheada para siempre en
  // image_templates — cuesta ~0,003 € cada una.
  const propiedades = await Promise.all(
    readProperties(player.flags).map(async (p) => {
      const exteriorPrompt = p.photoUrl ? null : findPropertyPrompt(p.name);
      const interiorPrompt = findPropertyInteriorPrompt(p.name);
      const [exterior, interior] = await Promise.all([
        p.photoUrl
          ? Promise.resolve(p.photoUrl)
          : exteriorPrompt
            ? getOrCreatePropertyPhoto(supabase, user.id, p.name, exteriorPrompt)
            : Promise.resolve(null),
        interiorPrompt ? getOrCreatePropertyPhoto(supabase, user.id, p.name, interiorPrompt, "interior") : Promise.resolve(null),
      ]);
      return { ...p, exterior, interior };
    }),
  );
  const inversiones = readInvestments(player.flags);

  // Patrimonio NETO: dinero + propiedades + inversiones − hipotecas pendientes.
  const propertyValue = propiedades.reduce((acc, p) => acc + p.price, 0);
  const investmentsTotal = inversiones.reduce((acc, i) => acc + investmentValue(i, player.week), 0);
  const mortgageDebt = propiedades.reduce((acc, p) => acc + remainingLoan(p, player.week), 0);
  const mortgageMonthly = totalMonthlyPayments(player.flags);
  const netWorth = player.patrimonio + propertyValue + investmentsTotal - mortgageDebt;
  const monthlyBalance = monthlySalary - mortgageMonthly;
  const pressure = getFinancialPressure(netWorth);

  return (
    <main className="flex flex-1 justify-center p-6 pb-24">
      <div className="w-full max-w-lg space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl">
            <span className="gold-text">Patrimonio</span>
          </h1>
          <Link href="/mi-jugador" className="font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">
            Mi jugador
          </Link>
        </div>

        {/* 1 · Cuánto tienes en total */}
        <div className="rounded-2xl border border-panel-border bg-surface px-4 py-5 text-center">
          <p className="text-kicker">Lo que tienes en total</p>
          <p className="gold-text font-display text-4xl">{netWorth.toLocaleString("es")} €</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {player.club} · Tu representante: {player.agent_name ?? "sin representante"}
          </p>
          <div className="mt-4 space-y-1.5 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/90">💶 Dinero en la cuenta</span>
              <span className="font-num font-semibold text-foreground">{player.patrimonio.toLocaleString("es")} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/90">🏠 Lo que valen tus propiedades</span>
              <span className="font-num font-semibold text-pitch">+{propertyValue.toLocaleString("es")} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/90">📈 Lo que valen tus inversiones</span>
              <span className="font-num font-semibold text-pitch">+{investmentsTotal.toLocaleString("es")} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/90">🏦 Lo que aún debes al banco</span>
              <span className="font-num font-semibold text-destructive">-{mortgageDebt.toLocaleString("es")} €</span>
            </div>
          </div>
        </div>

        {/* 2 · Cada mes */}
        {player.club !== NO_CLUB_YET && (
          <div className="space-y-3 rounded-2xl border border-panel-border bg-surface p-4">
            <p className="text-kicker">Cada mes (cada turno)</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/90">Entra: sueldo del {player.club}</span>
                <span className="font-num font-semibold text-pitch">+{monthlySalary.toLocaleString("es")} €</span>
              </div>
              {mortgageMonthly > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground/90">Sale: cuotas de hipoteca</span>
                  <span className="font-num font-semibold text-destructive">-{mortgageMonthly.toLocaleString("es")} €</span>
                </div>
              )}
              <div className="flex justify-between border-t border-panel-border pt-2">
                <span className="font-semibold text-foreground">Te queda cada mes</span>
                <span className={`font-num font-bold ${monthlyBalance >= 0 ? "text-pitch" : "text-destructive"}`}>
                  {monthlyBalance >= 0 ? "+" : "-"}
                  {eur(monthlyBalance)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Se ingresa y se paga solo en cada turno, sin que hagas nada. El sueldo sube con tu media.
              {mortgageMonthly > monthlySalary && " Ojo: las cuotas ya superan tu sueldo y el dinero de la cuenta se irá agotando."}
            </p>
            <div className="border-t border-panel-border pt-2">
              <p className={`font-display text-base ${pressure.tone}`}>Situación: {pressure.label}</p>
              <p className="text-xs text-muted-foreground">{pressure.description}</p>
            </div>
          </div>
        )}

        {/* 3 · Propiedades, con foto de fuera y de dentro */}
        <div className="space-y-3">
          <p className="text-kicker">Tus propiedades</p>
          {propiedades.length === 0 ? (
            <p className="rounded-2xl border border-panel-border bg-surface p-4 text-xs text-muted-foreground">
              Aún no tienes ninguna. Cuando tu representante te proponga una casa, un coche o un capricho y lo compres, aparecerá aquí con fotos de fuera y de dentro.
            </p>
          ) : (
            propiedades.map((p) => {
              const photos = [
                p.interior ? { url: p.interior, label: "Por dentro" } : null,
                p.exterior ? { url: p.exterior, label: "Por fuera" } : null,
              ].filter((x): x is { url: string; label: string } => x !== null);
              return (
                <div key={p.key} className="overflow-hidden rounded-2xl border border-panel-border bg-surface">
                  <div className="flex snap-x snap-mandatory overflow-x-auto bg-surface-2">
                    {photos.length === 0 ? (
                      <div className="flex aspect-[4/3] w-full shrink-0 items-center justify-center bg-gradient-to-br from-surface-2 to-surface text-5xl">
                        🏠
                      </div>
                    ) : (
                      photos.map((ph) => (
                        <div key={ph.label} className="relative aspect-[4/3] w-full shrink-0 snap-center">
                          <Image src={ph.url} alt={`${p.name} · ${ph.label}`} fill className="object-cover" unoptimized />
                          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-0.5 font-cond text-[10px] uppercase tracking-wide text-white">
                            {ph.label}
                          </span>
                          {photos.length > 1 && ph === photos[0] && (
                            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-0.5 font-cond text-[10px] uppercase tracking-wide text-white">
                              Desliza → fuera
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="font-display text-base text-foreground">{p.name}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vale</span>
                        <span className="font-num font-semibold text-gold">{p.price.toLocaleString("es")} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pagaste al comprarla</span>
                        <span className="font-num font-semibold text-foreground">{p.downPayment.toLocaleString("es")} €</span>
                      </div>
                      {monthlyPayment(p) > 0 ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Aún debes al banco</span>
                            <span className="font-num font-semibold text-destructive">{remainingLoan(p, player.week).toLocaleString("es")} €</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cuota al mes</span>
                            <span className="font-num font-semibold text-destructive">{monthlyPayment(p).toLocaleString("es")} €</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-pitch">Pagada al contado: sin hipoteca.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4 · Inversiones */}
        {inversiones.length > 0 && (
          <div className="space-y-3">
            <p className="text-kicker">Tus inversiones</p>
            {inversiones.map((i) => {
              const value = investmentValue(i, player.week);
              const gain = value - i.amount;
              return (
                <div key={i.key} className="space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
                  <p className="font-display text-base text-foreground">📈 {i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.detail}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pusiste</span>
                      <span className="font-num font-semibold text-foreground">{i.amount.toLocaleString("es")} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hoy vale</span>
                      <span className="font-num font-semibold text-gold">{value.toLocaleString("es")} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ganado hasta ahora</span>
                      <span className={`font-num font-semibold ${gain >= 0 ? "text-pitch" : "text-destructive"}`}>
                        {gain >= 0 ? "+" : "-"}
                        {eur(gain)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5 · Ingresos */}
        <div className="space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-kicker text-pitch">⬆ Ingresos</p>
            <p className="font-num text-sm font-bold text-pitch">+{total(ingresos).toLocaleString("es")} € en total</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta temporada: +{total(ingresos.filter(inSeason)).toLocaleString("es")} € extra, además del sueldo.
          </p>
          <ul className="divide-y divide-panel-border">
            {monthlySalary > 0 && (
              <li className="flex items-start justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">Sueldo de {player.club}</p>
                  <p className="text-xs text-muted-foreground">Cada mes, automático</p>
                </div>
                <span className="font-num shrink-0 text-sm font-bold text-pitch">+{monthlySalary.toLocaleString("es")} €</span>
              </li>
            )}
            {ingresos.length === 0 && monthlySalary === 0 ? (
              <li className="py-2.5 text-xs text-muted-foreground">Todavía no has cobrado nada.</li>
            ) : (
              ingresos.slice(0, 8).map((m) => <MovimientoRow key={m.id} m={m} sign="+" />)
            )}
          </ul>
          {ingresos.length > 8 && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-cond uppercase tracking-wide hover:text-gold">Ver los {ingresos.length - 8} anteriores</summary>
              <ul className="divide-y divide-panel-border">
                {ingresos.slice(8).map((m) => (
                  <MovimientoRow key={m.id} m={m} sign="+" />
                ))}
              </ul>
            </details>
          )}
        </div>

        {/* 6 · Pagos */}
        <div className="space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-kicker text-destructive">⬇ Pagos</p>
            <p className="font-num text-sm font-bold text-destructive">-{total(pagos).toLocaleString("es")} € en total</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta temporada: -{total(pagos.filter(inSeason)).toLocaleString("es")} € en compras, inversiones y gastos.
          </p>
          <ul className="divide-y divide-panel-border">
            {propiedades
              .filter((p) => monthlyPayment(p) > 0)
              .map((p) => (
                <li key={p.key} className="flex items-start justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">Hipoteca: {p.name}</p>
                    <p className="text-xs text-muted-foreground">Cada mes, automático</p>
                  </div>
                  <span className="font-num shrink-0 text-sm font-bold text-destructive">-{monthlyPayment(p).toLocaleString("es")} €</span>
                </li>
              ))}
            {pagos.length === 0 && mortgageMonthly === 0 ? (
              <li className="py-2.5 text-xs text-muted-foreground">Todavía no has pagado nada.</li>
            ) : (
              pagos.slice(0, 8).map((m) => <MovimientoRow key={m.id} m={m} sign="-" />)
            )}
          </ul>
          {pagos.length > 8 && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-cond uppercase tracking-wide hover:text-gold">Ver los {pagos.length - 8} anteriores</summary>
              <ul className="divide-y divide-panel-border">
                {pagos.slice(8).map((m) => (
                  <MovimientoRow key={m.id} m={m} sign="-" />
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
      <BottomNav active="patrimonio" />
    </main>
  );
}
