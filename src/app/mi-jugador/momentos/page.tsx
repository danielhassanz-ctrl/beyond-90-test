import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { seasonLabel } from "@/types/career";
import { ClubCrest } from "@/components/ClubCrest";
import { BottomNav } from "@/components/BottomNav";

export default async function MomentosPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  if (!player) {
    redirect("/crear-jugador");
  }

  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
      <div className="w-full max-w-sm space-y-1">
        <Link href="/mi-jugador" className="text-sm text-neutral-400 hover:text-gold">
          ‹ Mi jugador
        </Link>
        <h1 className="text-xl font-bold text-gold">Mis momentos</h1>
        <p className="text-sm text-neutral-400">
          Todos los momentos destacados de tu carrera, listos para volver a compartir.
        </p>
      </div>

      {!milestones || milestones.length === 0 ? (
        <p className="pt-8 text-center text-sm text-neutral-500">
          Todavía no tienes ningún momento destacado. Va a ir apareciendo con tus decisiones.
        </p>
      ) : (
        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          {milestones.map((m) => (
            <Link
              key={m.id}
              href={`/carrera/hito/${m.id}`}
              className="group overflow-hidden rounded-lg border border-panel-border bg-panel hover:border-gold/50"
            >
              <div className="relative aspect-square w-full bg-neutral-900">
                {m.image_url ? (
                  <Image
                    src={m.image_url}
                    alt={m.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ClubCrest club={player.club} size={40} />
                  </div>
                )}
              </div>
              <div className="space-y-0.5 p-2">
                <p className="line-clamp-2 text-xs font-semibold text-neutral-100">{m.title}</p>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">
                  Temporada {seasonLabel(m.week)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BottomNav active="jugador" />
    </main>
  );
}
