import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { BottomNav } from "@/components/BottomNav";
import { NO_CLUB_YET } from "@/lib/constants";
import { followers, followersText, getPress, pressActionBlocked, pressClimate, pressNarrative, PRESS_ACTIONS, type PressActionId } from "@/lib/narrative/press-system";
import { moverPrensa } from "./actions";
import type { Player } from "@/types/player";

const TONE = { good: "text-pitch border-pitch/60 bg-pitch/10", neutral: "text-gold border-gold/60 bg-gold/10", bad: "text-destructive border-destructive/50 bg-destructive/10" } as const;
const SOCIAL: PressActionId[] = ["foto_entreno", "video_vestuario", "mensaje_aficion", "responder_critico"];

function relWord(rel: number): string {
  if (rel >= 78) return "Te adoran";
  if (rel >= 60) return "Te tratan bien";
  if (rel >= 42) return "Neutral";
  if (rel >= 28) return "Desconfían";
  return "Te la tienen jurada";
}

export default async function PrensaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, player } = await getCurrentUserAndPlayer();
  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");
  if (player.club === NO_CLUB_YET) redirect("/carrera");

  const params = await searchParams;
  const p = player as Player;
  const press = getPress(p);
  const climate = pressClimate(p);
  const story = pressNarrative(p);
  const seg = followers(p);

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-6 pb-24">
      <div className="w-full max-w-md space-y-1 text-center">
        <p className="text-4xl">📰</p>
        <h1 className="font-display text-2xl">Prensa y redes</h1>
        <p className="text-sm text-muted-foreground">Quién te escribe, quién te persigue y cuánta gente te sigue.</p>
        <Link href="/mi-jugador/vida" className="inline-block pt-1 font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">‹ Vida</Link>
      </div>

      {params.error && (
        <p className="w-full max-w-md rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{params.error}</p>
      )}

      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <div className={`space-y-1 rounded-2xl border p-3 text-center ${TONE[climate.tone]}`}>
          <p className="text-kicker">Clima mediático</p>
          <p className="font-display text-lg">{climate.label}</p>
        </div>
        <div className="space-y-1 rounded-2xl border border-panel-border bg-surface p-3 text-center">
          <p className="text-kicker">Seguidores</p>
          <p className="font-display text-lg text-gold">{followersText(seg)}</p>
        </div>
      </div>
      <p className="w-full max-w-md text-center text-sm text-foreground/90">{climate.line}</p>

      <div className="w-full max-w-md space-y-1 rounded-2xl border border-panel-border bg-surface p-4">
        <p className="text-kicker">Cómo te cuentan</p>
        <p className="font-display text-lg leading-tight">{story.label}</p>
        <p className="text-sm text-muted-foreground">{story.line}</p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <p className="text-kicker">Tus medios</p>
        {press.map((o) => {
          const blocked = pressActionBlocked(p, "exclusiva", o.key);
          return (
            <div key={o.key} className="space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight">{o.name}</p>
                  <p className="text-xs text-muted-foreground">{o.kindLabel} · {o.journalist}</p>
                </div>
                <span className="shrink-0 font-cond text-xs font-bold uppercase tracking-wide text-gold">{relWord(o.rel)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-gold" style={{ width: `${o.rel}%` }} />
              </div>
              <p className="text-xs italic text-muted-foreground">{o.blurb}</p>
              <form action={moverPrensa}>
                <input type="hidden" name="action" value="exclusiva" />
                <input type="hidden" name="outlet" value={o.key} />
                <button
                  type="submit"
                  disabled={Boolean(blocked)}
                  title={blocked ?? PRESS_ACTIONS.exclusiva.hint}
                  className="rounded-full border border-gold/50 px-3 py-1.5 font-cond text-xs font-bold uppercase tracking-wide text-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {o.key === "hostil" ? "Hablar con ellos (arriesgado)" : "Darles una exclusiva"}
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-md space-y-3">
        <p className="text-kicker">Tus redes</p>
        <div className="grid gap-2">
          {SOCIAL.map((a) => {
            const blocked = pressActionBlocked(p, a);
            return (
              <form key={a} action={moverPrensa}>
                <input type="hidden" name="action" value={a} />
                <button
                  type="submit"
                  disabled={Boolean(blocked)}
                  title={blocked ?? PRESS_ACTIONS[a].hint}
                  className="w-full rounded-xl border border-panel-border bg-surface px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="block font-cond text-sm font-bold uppercase tracking-wide text-gold">{PRESS_ACTIONS[a].label}</span>
                  <span className="block text-xs text-muted-foreground">{blocked ?? PRESS_ACTIONS[a].hint}</span>
                </button>
              </form>
            );
          })}
        </div>
      </div>
      <p className="w-full max-w-md text-center text-xs text-muted-foreground">Máximo dos movimientos por turno. Lo que haces con un medio lo notan los demás.</p>
      <BottomNav active="jugador" />
    </main>
  );
}
