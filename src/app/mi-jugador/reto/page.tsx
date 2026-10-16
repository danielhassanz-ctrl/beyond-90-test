import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { BottomNav } from "@/components/BottomNav";
import { ShareableCard } from "@/components/ShareableCard";
import { withShareLink } from "@/lib/constants";
import { challengeOfDay, challengeState, madridDay, playedText, shareText } from "@/lib/narrative/daily-challenge";
import { jugarReto } from "./actions";
import type { Player } from "@/types/player";

export default async function RetoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, player } = await getCurrentUserAndPlayer();
  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");

  const params = await searchParams;
  const p = player as Player;
  const day = madridDay();
  const challenge = challengeOfDay(day, p);
  const state = challengeState(p, day);
  const text = playedText(p, day);
  const share = shareText(p, day);
  const chosen = challenge.options.find((o) => o.id === state.optionId);

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-6 pb-24">
      <div className="w-full max-w-md space-y-1 text-center">
        <p className="text-4xl">🎯</p>
        <h1 className="font-display text-2xl">Reto del día #{day + 1}</h1>
        <p className="text-sm text-muted-foreground">La misma jugada para todos. Una decisión, un minuto.</p>
        <Link href="/mi-jugador" className="inline-block pt-1 font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">‹ Mi jugador</Link>
      </div>

      {params.error && (
        <p className="w-full max-w-md rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{params.error}</p>
      )}

      <div className="grid w-full max-w-md grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-panel-border bg-surface p-3">
          <p className="text-kicker">Racha</p>
          <p className="font-display text-xl text-gold">{state.streak}</p>
        </div>
        <div className="rounded-2xl border border-panel-border bg-surface p-3">
          <p className="text-kicker">Mejor</p>
          <p className="font-display text-xl">{state.best}</p>
        </div>
        <div className="rounded-2xl border border-panel-border bg-surface p-3">
          <p className="text-kicker">Aciertos</p>
          <p className="font-display text-xl">{state.wins}/{state.played}</p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
        <p className="text-kicker text-gold">{challenge.stage}</p>
        <h2 className="font-display text-xl leading-tight">{challenge.title}</h2>
        <p className="text-sm leading-relaxed text-foreground/90">{challenge.setup}</p>
      </div>

      {state.playedToday && text && share ? (
        <ShareableCard title="Beyond 90" text={withShareLink(share)}>
          <div className={`w-full max-w-md space-y-2 rounded-2xl border p-4 ${state.win ? "border-pitch/60 bg-pitch/10" : "border-destructive/50 bg-destructive/10"}`}>
            <p className={`font-cond text-xs font-bold uppercase tracking-wide ${state.win ? "text-pitch" : "text-destructive"}`}>
              {state.win ? "Salió bien" : "Salió mal"} · «{chosen?.label}»
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
            <p className="text-xs text-muted-foreground">
              {state.streak > 1 ? `Racha de ${state.streak} días. ` : ""}Vuelve mañana: habrá otra jugada para todos.
            </p>
          </div>
        </ShareableCard>
      ) : (
        <div className="w-full max-w-md space-y-3">
          <p className="text-kicker">¿Qué haces?</p>
          {challenge.options.map((o) => (
            <form key={o.id} action={jugarReto}>
              <input type="hidden" name="option" value={o.id} />
              <button type="submit" className="w-full rounded-2xl border border-panel-border bg-surface px-4 py-3 text-left active:border-gold/60">
                <span className="block font-display text-base leading-tight">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.subtitle}</span>
              </button>
            </form>
          ))}
          {state.streakAlive && <p className="text-center text-xs text-gold-soft">Tienes una racha de {state.streak}: juega hoy para no perderla.</p>}
        </div>
      )}
      <BottomNav active="jugador" />
    </main>
  );
}
