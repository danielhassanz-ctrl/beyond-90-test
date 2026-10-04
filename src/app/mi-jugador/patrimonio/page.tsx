import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { seasonLabel, WEEKS_PER_SEASON } from "@/types/career";
import { getGameDateLabel } from "@/lib/calendar/season";
import { BottomNav } from "@/components/BottomNav";
import { weeklySalary } from "@/lib/narrative/engine";
import { findPropertyPrompt } from "@/lib/narrative/events";
import { readProperties, monthlyPayment, remainingLoan, totalMonthlyPayments } from "@/lib/finance/mortgage";
import { getOrCreatePropertyPhoto } from "@/lib/images/property-photos";
import { NO_CLUB_YET } from "@/lib/constants";

/**
 * Nivel de "presión financiera" — inspirado en el prototipo de
 * referencia, que mostraba deuda/patrimonio y compromisos/ficha. Este
 * juego no modela deuda ni ficha anual como campos propios, así que se
 * adapta a lo que sí tenemos: el patrimonio actual frente a la etapa de
 * la carrera, con un mensaje honesto en vez de inventar porcentajes de
 * datos que no existen.
 */
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
    .select("id, week, title, category, consequences, created_at")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false });

  const movimientos = (allEvents ?? [])
    .map((e) => {
      const consequences = e.consequences as { patrimonio?: number } | null;
      const monto = consequences?.patrimonio;
      if (!monto) return null;
      // Los eventos de segunda vida (ver segundaVida.ts) guardan
      // "week" como second_week (empieza en 1 de nuevo), no la semana
      // real de la carrera — pasarlo a seasonLabel (pensada para la
      // semana de jugador) daba una temporada inventada.
      const isSecondLife = e.category === "segunda_vida";
      return { id: e.id, week: e.week as number, title: e.title as string, monto, isSecondLife };
    })
    .filter((m): m is { id: string; week: number; title: string; monto: number; isSecondLife: boolean } => m !== null);

  // "Decisiones que te definen": los movimientos grandes de verdad, no
  // cada pequeño ingreso o gasto — igual que el prototipo de referencia,
  // que reservaba esta sección para lo que de verdad marca una carrera.
  const bigDecisions = movimientos.filter((m) => Math.abs(m.monto) >= 10000).slice(0, 4);

  // Resumen separando lo que entra de lo que sale — pedido explícito: "no
  // se entiende los ingresos y los pagos". El sueldo no se guarda como
  // movimiento (se suma solo en cada turno, ver applyCareerDynamics), así
  // que aquí solo van los ingresos y gastos que salieron de decisiones.
  // Cada turno de juego equivale a un mes y una temporada tiene 10.
  const currentSeason = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const sumBy = (rows: typeof movimientos) => ({
    ingresos: rows.filter((m) => m.monto > 0).reduce((acc, m) => acc + m.monto, 0),
    gastos: rows.filter((m) => m.monto < 0).reduce((acc, m) => acc + Math.abs(m.monto), 0),
  });
  const playerMovs = movimientos.filter((m) => !m.isSecondLife);
  const seasonTotals = sumBy(playerMovs.filter((m) => Math.floor((m.week - 1) / WEEKS_PER_SEASON) === currentSeason));
  const careerTotals = sumBy(movimientos);
  const monthlySalary = player.club !== NO_CLUB_YET ? weeklySalary(player.media) : 0;

  // Las casas/mansiones se registran como flags "propiedad_..." (ver
  // buildCasaEvent / buildMansionEvent) — antes no se guardaban en
  // ningún sitio y esta sección estaba siempre vacía, comprases lo que
  // comprases.
  const propiedadesSinFoto = readProperties(player.flags);
  // Si la foto no llegó a guardarse al comprar (fallo puntual de generación),
  // se genera ahora UNA sola vez por listado y queda cacheada para siempre
  // (getOrCreatePropertyPhoto mira primero image_templates) — cuesta ~0,003 €.
  const propiedades = await Promise.all(
    propiedadesSinFoto.map(async (p) => {
      if (p.photoUrl) return p;
      const prompt = findPropertyPrompt(p.name);
      if (!prompt) return p;
      const photoUrl = await getOrCreatePropertyPhoto(supabase, user.id, p.name, prompt);
      return { ...p, photoUrl };
    }),
  );

  // Patrimonio NETO de verdad: el dinero en la cuenta + lo que valen las
  // propiedades − lo que aún debes de hipoteca. Antes solo se enseñaba el
  // efectivo, así que comprar una casa de 400.000 € con 80.000 de entrada
  // hacía parecer que habías perdido 80.000 € (y no que tenías una casa).
  const propertyValue = propiedades.reduce((acc, p) => acc + p.price, 0);
  const mortgageDebt = propiedades.reduce((acc, p) => acc + remainingLoan(p, player.week), 0);
  const mortgageMonthly = totalMonthlyPayments(player.flags);
  const netWorth = player.patrimonio + propertyValue - mortgageDebt;

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

        <div className="rounded-2xl border border-panel-border bg-surface px-4 py-5 text-center">
          <p className="text-kicker">Patrimonio neto</p>
          <p className="gold-text font-display text-4xl">{netWorth.toLocaleString("es")} €</p>
          <p className="mt-1 font-cond text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {player.club} · {player.agent_name ?? "sin representante"}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-2.5">
              <p className="font-num text-sm font-bold text-foreground">{player.patrimonio.toLocaleString("es")} €</p>
              <p className="text-kicker text-[9px]">Dinero</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-2.5">
              <p className="font-num text-sm font-bold text-pitch">+{propertyValue.toLocaleString("es")} €</p>
              <p className="text-kicker text-[9px]">Propiedades</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-2.5">
              <p className="font-num text-sm font-bold text-destructive">-{mortgageDebt.toLocaleString("es")} €</p>
              <p className="text-kicker text-[9px]">Hipotecas</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Neto = dinero + propiedades − hipotecas pendientes.</p>
        </div>

        <div className="space-y-3">
          <p className="text-kicker">Tus propiedades</p>
          {propiedades.length === 0 ? (
            <p className="rounded-2xl border border-panel-border bg-surface p-4 text-xs text-muted-foreground">
              Aún no tienes ninguna. Cuando tu representante te proponga una casa o una inversión y la compres, aparecerá aquí con su foto.
            </p>
          ) : (
            propiedades.map((p) => (
              <div key={p.key} className="overflow-hidden rounded-2xl border border-panel-border bg-surface">
                <div className="relative aspect-[16/10] w-full bg-surface-2">
                  {p.photoUrl ? (
                    <Image src={p.photoUrl} alt={p.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-surface-2 to-surface text-5xl">🏠</div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="font-display text-base text-foreground">{p.name}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-surface-2 p-2">
                      <p className="font-num text-sm font-bold text-gold">{p.price.toLocaleString("es")} €</p>
                      <p className="text-kicker text-[9px]">Valor</p>
                    </div>
                    <div className="rounded-xl bg-surface-2 p-2">
                      <p className="font-num text-sm font-bold text-foreground">{p.downPayment.toLocaleString("es")} €</p>
                      <p className="text-kicker text-[9px]">Entrada pagada</p>
                    </div>
                    <div className="rounded-xl bg-surface-2 p-2">
                      <p className="font-num text-sm font-bold text-destructive">
                        {remainingLoan(p, player.week).toLocaleString("es")} €
                      </p>
                      <p className="text-kicker text-[9px]">Hipoteca pendiente</p>
                    </div>
                  </div>
                  {monthlyPayment(p) > 0 && (
                    <p className="text-center text-xs text-muted-foreground">
                      Cuota: <span className="font-num font-semibold text-destructive">{monthlyPayment(p).toLocaleString("es")} €</span> al mes,
                      que se descuenta sola cada turno.
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {player.club !== NO_CLUB_YET && (
          <div className="space-y-3 rounded-2xl border border-panel-border bg-surface p-4">
            <p className="text-kicker">Sueldo del club</p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-surface-2 p-3">
                <p className="font-num text-lg font-bold text-pitch">+{monthlySalary.toLocaleString("es")} €</p>
                <p className="text-kicker text-[9px]">Al mes</p>
              </div>
              <div className="rounded-xl bg-surface-2 p-3">
                <p className="font-num text-lg font-bold text-pitch">
                  +{(monthlySalary * WEEKS_PER_SEASON).toLocaleString("es")} €
                </p>
                <p className="text-kicker text-[9px]">Por temporada</p>
              </div>
            </div>
            {mortgageMonthly > 0 && (
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="font-num text-lg font-bold text-destructive">-{mortgageMonthly.toLocaleString("es")} €</p>
                  <p className="text-kicker text-[9px]">Cuotas de hipotecas al mes</p>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className={`font-num text-lg font-bold ${monthlySalary - mortgageMonthly >= 0 ? "text-pitch" : "text-destructive"}`}>
                    {monthlySalary - mortgageMonthly >= 0 ? "+" : ""}
                    {(monthlySalary - mortgageMonthly).toLocaleString("es")} €
                  </p>
                  <p className="text-kicker text-[9px]">Balance mensual</p>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Se ingresa solo en cada turno, sin que hagas nada. Sube con tu media.
              {mortgageMonthly > monthlySalary && " Ojo: las cuotas ya superan tu sueldo y el dinero de la cuenta se irá agotando."}
            </p>
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-panel-border bg-surface p-4">
          <p className="text-kicker">Ingresos y gastos de tus decisiones</p>
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 text-sm">
            <span />
            <span className="text-kicker text-[9px]">Esta temporada</span>
            <span className="text-kicker text-[9px]">Toda la carrera</span>
            <span className="text-foreground/90">Ingresos extra</span>
            <span className="font-num text-right font-semibold text-pitch">+{seasonTotals.ingresos.toLocaleString("es")} €</span>
            <span className="font-num text-right font-semibold text-pitch">+{careerTotals.ingresos.toLocaleString("es")} €</span>
            <span className="text-foreground/90">Gastos</span>
            <span className="font-num text-right font-semibold text-destructive">-{seasonTotals.gastos.toLocaleString("es")} €</span>
            <span className="font-num text-right font-semibold text-destructive">-{careerTotals.gastos.toLocaleString("es")} €</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Aquí no entra el sueldo: son los patrocinios, compras e inversiones que has decidido tú.
          </p>
        </div>

        <div className="space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
          <p className="text-kicker">Presión financiera</p>
          <p className={`font-display text-lg ${pressure.tone}`}>{pressure.label}</p>
          <p className="text-xs text-muted-foreground">{pressure.description}</p>
        </div>

        <div className="space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
          <p className="text-kicker">Decisiones que ya te definen</p>
          {bigDecisions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aún no has tomado una decisión económica grande. Cuando llegue, quedará aquí y seguirá pesando en tu carrera.
            </p>
          ) : (
            <ul className="space-y-2">
              {bigDecisions.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/90">{m.title}</span>
                  <span className={`font-num font-semibold ${m.monto >= 0 ? "text-pitch" : "text-destructive"}`}>
                    {m.monto >= 0 ? "+" : ""}
                    {m.monto.toLocaleString("es")} €
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-kicker">Historial económico</p>
          {movimientos.length === 0 ? (
            <p className="rounded-2xl border border-panel-border bg-surface p-4 text-xs text-muted-foreground">
              Todavía no hubo ningún movimiento de dinero en tu carrera.
            </p>
          ) : (
            <ul className="space-y-2">
              {movimientos.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-2xl border border-panel-border bg-surface px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.isSecondLife
                        ? `Semana ${m.week} de tu segunda vida`
                        : `${getGameDateLabel(m.week)} · Temporada ${seasonLabel(m.week)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-num text-sm font-bold ${m.monto >= 0 ? "text-pitch" : "text-destructive"}`}
                    >
                      {m.monto >= 0 ? "+" : ""}
                      {m.monto.toLocaleString("es")} €
                    </span>
                    <p className="text-kicker text-[9px]">{m.monto >= 0 ? "Ingreso" : "Gasto"}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <BottomNav active="patrimonio" />
    </main>
  );
}
