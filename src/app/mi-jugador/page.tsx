import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { playerAge, seasonLabel } from "@/types/career";
import { LifeThreads } from "@/components/LifeThreads";
import { BottomNav } from "@/components/BottomNav";
import { CareerStatCard } from "@/components/CareerStatCard";
import { ShareableCard } from "@/components/ShareableCard";
import { PlayerHeaderCard } from "@/components/PlayerHeaderCard";
import { getPressQuote, getCoachOpinion } from "@/lib/narrative/pressQuotes";
import { withShareLink, getAppUrlLine, NO_CLUB_YET } from "@/lib/constants";
import { logout } from "./actions";

export default async function MiJugadorPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Player>();

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
      <div className="flex w-full max-w-md justify-end">
        <form action={logout}>
          <button type="submit" className="font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">
            Cerrar sesión
          </button>
        </form>
      </div>

      {!player ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-muted-foreground">Todavía no creaste tu jugador.</p>
          <Link
            href="/crear-jugador"
            className="gold-fill rounded-full px-6 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
          >
            Crear jugador
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          <div className="rounded-2xl border border-panel-border bg-surface p-4">
            <PlayerHeaderCard
              photoUrl={player.current_photo_url ?? player.photo_url}
              name={displayName(player)}
              age={playerAge(player.week)}
              club={player.club}
              categoryLabel={seasonLabel(player.week)}
              statusLine={player.position}
              media={player.media}
              forma={player.forma}
              relEntrenador={player.club !== NO_CLUB_YET ? player.rel_entrenador : null}
              relAficion={player.club !== NO_CLUB_YET ? player.rel_aficion : null}
              relVestuario={player.club !== NO_CLUB_YET ? player.rel_vestuario : null}
              relRepresentante={player.agent_name ? player.rel_representante : null}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-panel-border bg-surface p-4">
            <p className="text-kicker">Prensa</p>
            <p className="text-sm italic leading-relaxed text-foreground/90">{getPressQuote(player)}</p>
            {player.club !== NO_CLUB_YET && (
              <>
                <div className="h-px bg-panel-border" />
                <p className="text-kicker">Opinión del entrenador</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{getCoachOpinion(player)}</p>
              </>
            )}
          </div>

          <ShareableCard
            title="Beyond 90"
            text={withShareLink(
              `Así va mi carrera en Beyond 90: ${displayName(player)} (${player.club}). ¿Cómo sería la tuya?`,
            )}
          >
            <CareerStatCard player={player} tagline="¿Cómo sería la tuya?" linkLine={getAppUrlLine()} />
          </ShareableCard>

          <Link
            href="/mi-jugador/patrimonio"
            className="flex items-center justify-between rounded-2xl border border-panel-border bg-surface px-4 py-3 hover:border-gold/50"
          >
            <span className="text-kicker">Patrimonio</span>
            <span className="font-num flex items-center gap-1 text-lg font-bold text-gold">
              {player.patrimonio.toLocaleString("es")} €
              <span className="text-muted-foreground">›</span>
            </span>
          </Link>

          <Link
            href="/mi-jugador/legado"
            className="flex items-center justify-between rounded-2xl border border-panel-border bg-surface px-4 py-3 hover:border-gold/50"
          >
            <span className="text-kicker">Legado</span>
            <span className="flex items-center gap-1 font-cond text-sm font-semibold uppercase tracking-wide text-gold">
              Ver legado
              <span className="text-muted-foreground">›</span>
            </span>
          </Link>
          <Link
            href="/mi-jugador/vida"
            className="flex items-center justify-between rounded-2xl border border-panel-border bg-surface px-4 py-3 hover:border-gold/50"
          >
            <span className="text-kicker">Vida</span>
            <span className="flex items-center gap-1 font-cond text-sm font-semibold uppercase tracking-wide text-gold">
              Ver vida
              <span className="text-muted-foreground">›</span>
            </span>
          </Link>

          <LifeThreads flags={player.flags} />

          {player.status === "retired" && (
            <Link
              href="/carrera/retiro"
              className="block w-full rounded-full border border-panel-border px-4 py-3 text-center font-cond text-sm font-bold uppercase tracking-wide text-foreground hover:border-gold/50"
            >
              Ver resumen de carrera
            </Link>
          )}
          {player.status === "active" && (
            <Link
              href="/carrera"
              className="gold-fill block w-full rounded-full px-4 py-3 text-center font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
            >
              Continuar carrera
            </Link>
          )}
          {player.status === "awaiting_second_life" && (
            <Link
              href="/carrera/segunda-vida/elegir"
              className="gold-fill block w-full rounded-full px-4 py-3 text-center font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
            >
              Elegir tu segunda vida
            </Link>
          )}
          {player.status === "second_life" && (
            <Link
              href="/carrera/segunda-vida"
              className="gold-fill block w-full rounded-full px-4 py-3 text-center font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
            >
              Continuar como {player.second_career}
            </Link>
          )}

          <Link
            href="/mi-jugador/borrar"
            className="block w-full text-center font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-destructive"
          >
            Borrar jugador y empezar de nuevo
          </Link>
        </div>
      )}
      {player && <BottomNav active="jugador" />}
    </main>
  );
}
