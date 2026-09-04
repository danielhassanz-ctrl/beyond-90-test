import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/types/player";
import { playerAge } from "@/types/career";
import { StatBar } from "@/components/StatBar";
import { LifeThreads } from "@/components/LifeThreads";
import { BottomNav } from "@/components/BottomNav";
import { CareerStatCard } from "@/components/CareerStatCard";
import { ShareableCard } from "@/components/ShareableCard";
import { MediaBadge } from "@/components/MediaBadge";
import { withShareLink } from "@/lib/constants";
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
      <div className="flex w-full max-w-sm justify-end">
        <form action={logout}>
          <button type="submit" className="text-sm text-neutral-500 hover:text-gold">
            Cerrar sesión
          </button>
        </form>
      </div>

      {!player ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-neutral-400">Todavía no creaste tu jugador.</p>
          <Link
            href="/crear-jugador"
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-gold-soft"
          >
            Crear jugador
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <div className="overflow-hidden rounded-xl border border-panel-border bg-panel shadow-sm">
            <div className="relative h-56 w-full bg-neutral-900">
              {player.current_photo_url || player.photo_url ? (
                <Image
                  src={player.current_photo_url ?? player.photo_url ?? ""}
                  alt={player.last_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-500">
                  Sin foto
                </div>
              )}
              <span className="absolute right-3 top-3 rounded-full bg-gold px-3 py-1 text-lg font-bold text-neutral-950">
                #{player.number}
              </span>
              <div className="absolute left-3 top-3">
                <MediaBadge value={player.media} />
              </div>
            </div>
            <div className="space-y-2 p-4">
              <h1 className="text-xl font-bold text-gold">{player.last_name}</h1>
              <p className="text-sm text-neutral-400">
                {player.club} · {playerAge(player.week)} años
              </p>
              <dl className="grid grid-cols-2 gap-y-1 pt-2 text-sm">
                <dt className="text-neutral-500">Posición</dt>
                <dd className="text-right text-neutral-200">{player.position}</dd>
                <dt className="text-neutral-500">Representante</dt>
                <dd className="text-right text-neutral-200">{player.agent_name ?? "Sin definir"}</dd>
                <dt className="text-neutral-500">Pie hábil</dt>
                <dd className="text-right text-neutral-200">{player.foot}</dd>
                <dt className="text-neutral-500">Nacionalidad</dt>
                <dd className="text-right text-neutral-200">{player.nation}</dd>
                <dt className="text-neutral-500">Personalidad</dt>
                <dd className="text-right text-neutral-200">{player.personality}</dd>
              </dl>
            </div>
          </div>

          <ShareableCard
            title="Beyond 90"
            text={withShareLink(
              `Así va mi carrera en Beyond 90: ${player.last_name} (${player.club}). ¿Cómo sería la tuya?`,
            )}
          >
            <CareerStatCard player={player} />
          </ShareableCard>

          <div className="grid grid-cols-3 gap-3 rounded-lg border border-panel-border bg-panel p-4">
            <StatBar label="Forma" value={player.forma} />
            <StatBar label="Moral" value={player.moral} />
            <StatBar label="Fama" value={player.fama} />
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-panel-border bg-panel p-4">
            <StatBar label="Entrenador" value={player.rel_entrenador} />
            <StatBar label="Afición" value={player.rel_aficion} />
            <StatBar label="Vestuario" value={player.rel_vestuario} />
            <StatBar label="Representante" value={player.rel_representante} />
          </div>

          <Link
            href="/mi-jugador/patrimonio"
            className="flex items-center justify-between rounded-lg border border-panel-border bg-panel px-4 py-3 hover:border-gold/50"
          >
            <span className="text-xs uppercase tracking-wide text-neutral-400">Patrimonio</span>
            <span className="flex items-center gap-1 text-lg font-bold text-gold">
              {player.patrimonio.toLocaleString("es")} €
              <span className="text-neutral-500">›</span>
            </span>
          </Link>

          <Link
            href="/mi-jugador/momentos"
            className="flex items-center justify-between rounded-lg border border-panel-border bg-panel px-4 py-3 hover:border-gold/50"
          >
            <span className="text-xs uppercase tracking-wide text-neutral-400">Mis momentos</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-gold">
              Ver galería
              <span className="text-neutral-500">›</span>
            </span>
          </Link>

          <LifeThreads flags={player.flags} />

          {player.status === "retired" && (
            <Link
              href="/carrera/retiro"
              className="block w-full rounded-md border border-panel-border px-4 py-2 text-center text-sm font-medium text-neutral-200 hover:bg-panel"
            >
              Ver resumen de carrera
            </Link>
          )}
          {player.status === "active" && (
            <Link
              href="/carrera"
              className="block w-full rounded-md bg-gold px-4 py-2 text-center text-sm font-semibold text-neutral-950 hover:bg-gold-soft"
            >
              Continuar carrera
            </Link>
          )}
          {player.status === "awaiting_second_life" && (
            <Link
              href="/carrera/segunda-vida/elegir"
              className="block w-full rounded-md bg-gold px-4 py-2 text-center text-sm font-semibold text-neutral-950 hover:bg-gold-soft"
            >
              Elegir tu segunda vida
            </Link>
          )}
          {player.status === "second_life" && (
            <Link
              href="/carrera/segunda-vida"
              className="block w-full rounded-md bg-gold px-4 py-2 text-center text-sm font-semibold text-neutral-950 hover:bg-gold-soft"
            >
              Continuar como {player.second_career}
            </Link>
          )}

          <Link
            href="/mi-jugador/borrar"
            className="block w-full text-center text-xs text-neutral-600 hover:text-red-400"
          >
            Borrar jugador y empezar de nuevo
          </Link>
        </div>
      )}
      {player && <BottomNav active="jugador" />}
    </main>
  );
}
