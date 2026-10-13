import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { BottomNav } from "@/components/BottomNav";
import { WEEKS_PER_SEASON, seasonLabel } from "@/types/career";

/** Los cierres de temporada ya vividos: cada uno abre su tarjeta resumen (para verla, compartirla o rehacer la foto). */
export default async function ResumenesPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");

  const { data: rows } = await supabase
    .from("career_events")
    .select("id, event_id, week, title, outcome_text")
    .eq("player_id", player.id)
    .like("event_id", "preseason-%")
    .order("week", { ascending: false });
  const closes = (rows ?? []).filter((r) => /^preseason-\d+$/.test(r.event_id ?? ""));

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
      <div className="w-full max-w-md space-y-1 text-center">
        <p className="text-4xl">🗓️</p>
        <h1 className="font-display text-2xl">Resúmenes de temporada</h1>
        <p className="text-sm text-muted-foreground">
          La tarjeta de cada temporada cerrada, con su foto y sus cifras. Ábrela para compartirla o para rehacer la foto.
        </p>
      </div>

      {closes.length === 0 ? (
        <p className="w-full max-w-md rounded-2xl border border-panel-border bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
          Todavía no has cerrado ninguna temporada. La primera tarjeta llegará el 1 de julio.
        </p>
      ) : (
        <ul className="w-full max-w-md space-y-3">
          {closes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/carrera/resultado/${c.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-panel-border bg-surface px-4 py-3 hover:border-gold/50"
              >
                <span className="min-w-0">
                  <span className="text-kicker block">Temporada {seasonLabel(Math.max(1, c.week - WEEKS_PER_SEASON))}</span>
                  <span className="block truncate font-display text-base text-foreground">{c.title}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 font-cond text-sm font-semibold uppercase tracking-wide text-gold">
                  Ver tarjeta
                  <span className="text-muted-foreground">›</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/mi-jugador" className="font-cond text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
        ‹ Volver a mi jugador
      </Link>
      <BottomNav active="jugador" />
    </main>
  );
}
