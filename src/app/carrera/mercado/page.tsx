import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { BottomNav } from "@/components/BottomNav";
import { NO_CLUB_YET } from "@/lib/constants";
import { exploreClubs, marketStatus } from "@/lib/narrative/market-explorer";
import { eurFee } from "@/lib/narrative/transfer-terms";
import { sondearClub } from "./actions";
import type { Player } from "@/types/player";

const BAND_STYLE = {
  Alta: "border-pitch/60 bg-pitch/10 text-pitch",
  Media: "border-gold/60 bg-gold/10 text-gold",
  Baja: "border-panel-border bg-surface-2 text-muted-foreground",
} as const;

const DIRECTION = { sube: "▲ Un escalón más arriba", igual: "● Mismo nivel", baja: "▼ Un escalón más abajo" } as const;

export default async function MercadoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, player } = await getCurrentUserAndPlayer();
  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");
  if (player.club === NO_CLUB_YET) redirect("/carrera");

  const params = await searchParams;
  const p = player as Player;
  const status = marketStatus(p);
  const clubs = exploreClubs(p);
  const contractYears = Math.floor(status.contractLeft / 10);

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-6 pb-24">
      <div className="w-full max-w-md space-y-1 text-center">
        <p className="text-4xl">🔎</p>
        <h1 className="font-display text-2xl">Mercado</h1>
        <p className="text-sm text-muted-foreground">Mira qué se mueve, cuánto vales y a quién puede llamar tu representante.</p>
        <Link href="/carrera" className="inline-block pt-1 font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">‹ Carrera</Link>
      </div>

      {params.error && (
        <p className="w-full max-w-md rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{params.error}</p>
      )}

      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <div className="rounded-2xl border border-panel-border bg-surface p-3 text-center">
          <p className="text-kicker">Ventana</p>
          <p className="font-display text-lg">{status.window === "verano" ? "Verano" : status.window === "enero" ? "Invierno" : "Cerrada"}</p>
          <p className="text-xs text-muted-foreground">
            {status.window ? `${status.windowTurnsLeft > 1 ? `${status.windowTurnsLeft} turnos` : "último turno"} para cerrar` : "Se abre en verano y en enero"}
          </p>
        </div>
        <div className="rounded-2xl border border-panel-border bg-surface p-3 text-center">
          <p className="text-kicker">Tu valor</p>
          <p className="font-display text-lg text-gold">{eurFee(status.valueM)}</p>
          <p className="text-xs text-muted-foreground">Cláusula: {eurFee(status.clauseM)}</p>
        </div>
        <div className="rounded-2xl border border-panel-border bg-surface p-3 text-center">
          <p className="text-kicker">Contrato</p>
          <p className="font-display text-lg">{contractYears >= 1 ? `${contractYears} ${contractYears === 1 ? "año" : "años"}` : `${status.contractLeft} turnos`}</p>
          <p className="text-xs text-muted-foreground">{status.contractLeft <= 10 ? "Último año: el club puede perderte gratis" : "restante con tu club"}</p>
        </div>
        <div className="rounded-2xl border border-panel-border bg-surface p-3 text-center">
          <p className="text-kicker">Sondeos</p>
          <p className="font-display text-lg">{status.probesLeft}</p>
          <p className="text-xs text-muted-foreground">en esta ventana</p>
        </div>
      </div>

      {status.interest && (
        <div className="w-full max-w-md space-y-1 rounded-2xl border border-gold/50 bg-gold/10 p-4">
          <p className="text-kicker text-gold">Interés actual</p>
          <p className="text-sm text-foreground/90">
            <strong>{status.interest.club}</strong>{" "}
            {status.interest.source === "listado" ? "está estudiando tu caso por la gestión de tu representante: espera su llamada." : "ha preguntado por ti. Si el mercado está abierto, la oferta puede llegar en cualquier momento."}
          </p>
        </div>
      )}

      {status.blocked && (
        <p className="w-full max-w-md rounded-2xl border border-panel-border bg-surface p-4 text-sm text-muted-foreground">{status.blocked}</p>
      )}

      <div className="w-full max-w-md space-y-3">
        <p className="text-kicker">Clubes que se pueden tantear</p>
        {clubs.map((c) => (
          <div key={c.club} className="space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight">{c.club}</p>
                <p className="text-xs text-muted-foreground">{c.league} · {c.city}</p>
                <p className="text-xs text-muted-foreground">{DIRECTION[c.direction]}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-3 py-1 font-cond text-xs font-bold uppercase tracking-wide ${BAND_STYLE[c.band]}`}>
                {c.band} · {Math.round(c.probability * 100)} %
              </span>
            </div>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p>🎽 Papel esperado: <span className="text-foreground/90">{c.roleLabel}</span></p>
              <p>💶 {c.annualText} · {c.feeText}</p>
              {c.partnerLine && <p>💞 {c.partnerLine}</p>}
            </div>
            <form action={sondearClub}>
              <input type="hidden" name="club" value={c.club} />
              <button
                type="submit"
                disabled={Boolean(status.blocked)}
                className="w-full rounded-full border border-gold/50 px-4 py-2 font-cond text-xs font-bold uppercase tracking-wide text-gold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Que mi representante lo tantee
              </button>
            </form>
          </div>
        ))}
        {clubs.length === 0 && <p className="text-sm text-muted-foreground">De momento no hay clubes con opciones realistas para tu perfil.</p>}
      </div>
      <BottomNav active="carrera" />
    </main>
  );
}
