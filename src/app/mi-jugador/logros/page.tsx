import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { BottomNav } from "@/components/BottomNav";
import { ShareableCard } from "@/components/ShareableCard";
import { ACHIEVEMENTS, TIER_LABEL, newAchievements, unlockedIds, type Category, type Tier } from "@/lib/narrative/achievements";
import { displayName } from "@/types/player";
import { withShareLink } from "@/lib/constants";

const TIER_STYLE: Record<Tier, string> = {
  bronce: "border-amber-700/60 bg-amber-700/10 text-amber-500",
  plata: "border-slate-400/60 bg-slate-400/10 text-slate-300",
  oro: "border-gold/70 bg-gold/10 text-gold",
};

const ORDER: Category[] = ["Carrera", "Títulos", "Premios", "Dinero", "Vida", "Club", "Superación"];

export default async function LogrosPage() {
  const { user, player } = await getCurrentUserAndPlayer();
  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");

  // Lo que ya se cumple pero el motor todavía no ha anotado (se anota en el siguiente turno): se muestra igual.
  const pending = new Set(newAchievements(player).map((a) => a.id));
  const done = new Set([...unlockedIds(player), ...pending]);
  const byTier = (t: Tier) => ACHIEVEMENTS.filter((a) => a.tier === t && done.has(a.id)).length;
  const name = displayName(player);

  return (
    <main className="flex flex-1 flex-col items-center gap-5 p-6 pb-24">
      <div className="w-full max-w-md space-y-1 text-center">
        <p className="text-4xl">🏅</p>
        <h1 className="font-display text-2xl">Logros</h1>
        <p className="text-sm text-muted-foreground">
          {done.size} de {ACHIEVEMENTS.length} desbloqueados · {byTier("oro")} de oro · {byTier("plata")} de plata · {byTier("bronce")} de bronce
        </p>
        <div className="mx-auto mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-2">
          <div className="gold-fill h-full rounded-full" style={{ width: `${Math.round((done.size / ACHIEVEMENTS.length) * 100)}%` }} />
        </div>
        <Link href="/mi-jugador" className="inline-block pt-2 font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">
          ‹ Mi jugador
        </Link>
      </div>

      {ORDER.map((cat) => {
        const list = ACHIEVEMENTS.filter((a) => a.category === cat);
        return (
          <section key={cat} className="w-full max-w-md space-y-2">
            <p className="text-kicker">
              {cat} · {list.filter((a) => done.has(a.id)).length}/{list.length}
            </p>
            <div className="space-y-2">
              {list.map((a) =>
                done.has(a.id) ? (
                  <ShareableCard key={a.id} title="Beyond 90" text={withShareLink(`${a.icon} Logro desbloqueado en Beyond 90: ${a.name} (${name}).`)}>
                    <div className={`flex items-center gap-3 rounded-2xl border p-3 ${TIER_STYLE[a.tier]}`}>
                      <span className="text-3xl" aria-hidden>{a.icon}</span>
                      <div className="min-w-0">
                        <p className="font-display text-base text-foreground">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide">{TIER_LABEL[a.tier]}</p>
                      </div>
                    </div>
                  </ShareableCard>
                ) : (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-panel-border bg-surface p-3 opacity-60">
                    <span className="text-3xl grayscale" aria-hidden>🔒</span>
                    <div className="min-w-0">
                      <p className="font-display text-base text-foreground/80">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{TIER_LABEL[a.tier]}</p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        );
      })}
      <BottomNav active="jugador" />
    </main>
  );
}
