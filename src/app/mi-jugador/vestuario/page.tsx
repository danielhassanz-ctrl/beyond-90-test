import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { BottomNav } from "@/components/BottomNav";
import { NO_CLUB_YET } from "@/lib/constants";
import { actionBlocked, actionsFor, getLockerRoom, lockerMood, MATE_ACTIONS } from "@/lib/narrative/locker-room";
import { dedicarTiempo } from "./actions";
import type { Player } from "@/types/player";

const TONE = { good: "text-pitch border-pitch/60 bg-pitch/10", neutral: "text-gold border-gold/60 bg-gold/10", bad: "text-destructive border-destructive/50 bg-destructive/10" } as const;

function relWord(rel: number): string {
  if (rel >= 80) return "Uña y carne";
  if (rel >= 62) return "Buena relación";
  if (rel >= 45) return "Correcta";
  if (rel >= 28) return "Fría";
  return "Mala";
}

export default async function VestuarioPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, player } = await getCurrentUserAndPlayer();
  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");
  if (player.club === NO_CLUB_YET) redirect("/carrera");

  const params = await searchParams;
  const p = player as Player;
  const room = getLockerRoom(p);
  const mood = lockerMood(p);

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-6 pb-24">
      <div className="w-full max-w-md space-y-1 text-center">
        <p className="text-4xl">🚪</p>
        <h1 className="font-display text-2xl">Vestuario</h1>
        <p className="text-sm text-muted-foreground">{p.club}: quién manda, quién te quiere y quién te mira de reojo.</p>
        <Link href="/mi-jugador/vida" className="inline-block pt-1 font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">‹ Vida</Link>
      </div>

      {params.error && (
        <p className="w-full max-w-md rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{params.error}</p>
      )}

      <div className={`w-full max-w-md space-y-1 rounded-2xl border p-4 text-center ${TONE[mood.tone]}`}>
        <p className="text-kicker">Ambiente</p>
        <p className="font-display text-2xl">{mood.label}</p>
        <p className="text-sm text-foreground/90">{mood.line}</p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {room.map((m) => (
          <div key={m.key} className="space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.roleLabel} · {m.age} años</p>
              </div>
              <span className="shrink-0 font-cond text-xs font-bold uppercase tracking-wide text-gold">{relWord(m.rel)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-gold" style={{ width: `${m.rel}%` }} />
            </div>
            <p className="text-xs italic text-muted-foreground">{m.blurb}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {actionsFor(m.key).map((a) => {
                const blocked = actionBlocked(p, m.key, a);
                return (
                  <form key={a} action={dedicarTiempo}>
                    <input type="hidden" name="key" value={m.key} />
                    <input type="hidden" name="action" value={a} />
                    <button
                      type="submit"
                      disabled={Boolean(blocked)}
                      title={blocked ?? MATE_ACTIONS[a].hint}
                      className="rounded-full border border-gold/50 px-3 py-1.5 font-cond text-xs font-bold uppercase tracking-wide text-gold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {MATE_ACTIONS[a].label}
                    </button>
                  </form>
                );
              })}
            </div>
            {(() => {
              // En el móvil no hay tooltip: la razón de un botón apagado se escribe debajo.
              const reason = actionsFor(m.key).map((a) => actionBlocked(p, m.key, a)).find(Boolean);
              return reason ? <p className="text-xs text-muted-foreground">{reason}</p> : null;
            })()}
          </div>
        ))}
      </div>
      <p className="w-full max-w-md text-center text-xs text-muted-foreground">Máximo dos compañeros por turno. Lo que ganas con los veteranos lo notan los jóvenes, y al revés.</p>
      <BottomNav active="jugador" />
    </main>
  );
}
