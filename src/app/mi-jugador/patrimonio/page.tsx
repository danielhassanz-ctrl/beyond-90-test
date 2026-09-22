import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { seasonLabel } from "@/types/career";
import { BottomNav } from "@/components/BottomNav";
import { weeklySalary } from "@/lib/narrative/engine";
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

  // Las casas/mansiones se registran como flags "propiedad_..." (ver
  // buildCasaEvent / buildMansionEvent) — antes no se guardaban en
  // ningún sitio y esta sección estaba siempre vacía, comprases lo que
  // comprases.
  const propiedades = Object.entries(player.flags ?? {})
    .filter(([key]) => key.startsWith("propiedad_"))
    .map(([key, value]) => {
      try {
        const parsed = JSON.parse(String(value)) as { name: string; price: number; downPayment: number };
        return { key, ...parsed };
      } catch {
        return null;
      }
    })
    .filter((p): p is { key: string; name: string; price: number; downPayment: number } => p !== null);

  const pressure = getFinancialPressure(player.patrimonio);

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
          <p className="gold-text font-display text-4xl">{player.patrimonio.toLocaleString("es")} €</p>
          <p className="mt-1 font-cond text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {player.club} · {player.agent_name ?? "sin representante"}
          </p>
          {player.club !== NO_CLUB_YET && (
            <p className="mt-2 text-xs text-muted-foreground">
              Cobras tu sueldo cada semana sin que tengas que hacer nada — ahora mismo, unos{" "}
              <span className="text-gold">{weeklySalary(player.media).toLocaleString("es")} €</span> por semana según tu nivel.
            </p>
          )}
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

        <div className="rounded-2xl border border-panel-border bg-surface p-4">
          <p className="mb-3 text-kicker">Propiedades e inversiones</p>
          {propiedades.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Todavía no hay nada que registrar aquí — las casas, coches e inversiones que vayas
              comprando en tu carrera van a aparecer en esta sección.
            </p>
          ) : (
            <ul className="space-y-2">
              {propiedades.map((p) => (
                <li key={p.key} className="flex items-center justify-between text-xs">
                  <span className="text-foreground/90">{p.name}</span>
                  <span className="font-num font-semibold text-gold">{p.price.toLocaleString("es")} €</span>
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
                      {m.isSecondLife ? `Semana ${m.week} de tu segunda vida` : `Temporada ${seasonLabel(m.week)}`}
                    </p>
                  </div>
                  <span
                    className={`font-num text-sm font-bold ${m.monto >= 0 ? "text-pitch" : "text-destructive"}`}
                  >
                    {m.monto >= 0 ? "+" : ""}
                    {m.monto.toLocaleString("es")} €
                  </span>
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
