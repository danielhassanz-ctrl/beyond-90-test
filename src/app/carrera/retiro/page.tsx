import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { SECOND_CAREER_LABELS, seasonLabel } from "@/types/career";
import { withShareLink } from "@/lib/constants";
import { CareerStatCard } from "@/components/CareerStatCard";
import { ShareableCard } from "@/components/ShareableCard";

export default async function RetiroPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player) {
    redirect("/login");
  }

  if (player.status !== "retired") {
    await supabase.from("players").update({ status: "retired" }).eq("id", player.id);
  }

  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("player_id", player.id)
    .order("week", { ascending: true });

  const heroImage = [...(milestones ?? [])].reverse().find((m) => m.image_url)?.image_url as
    | string
    | undefined;

  const totalWeeks = player.week;
  const seasons = Math.ceil(totalWeeks / 38);
  const shareText = withShareLink(
    `${player.last_name} colgó las botas. Carrera de ${seasons} temporadas, ${milestones?.length ?? 0} momentos épicos, ${player.fama} de fama. ¿La tuya será mayor? Juega en Beyond 90.`,
  );

  return (
    <main className="flex flex-1 justify-center bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-8 pb-12">
        {/* Header épico */}
        <div className="space-y-4 text-center">
          <p className="text-6xl">👑</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white">
            Leyenda <span className="text-gold">{player.last_name}</span>
          </h1>
          <p className="text-sm text-neutral-400 max-w-lg mx-auto">
            Tu carrera ha terminado. Ahora eres parte de la historia del fútbol.
          </p>
        </div>

        {/* Imagen héroe */}
        {heroImage && (
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-amber-500/30 shadow-2xl shadow-amber-500/10">
            <Image src={heroImage} alt={player.last_name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
          </div>
        )}

        {/* Shareable card */}
        <ShareableCard title="Beyond 90" text={shareText}>
          <CareerStatCard player={player} />
        </ShareableCard>

        {/* Stats principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-4 text-center">
            <p className="text-2xl font-black text-gold">{seasons}</p>
            <p className="text-xs text-neutral-400 mt-1">Temporadas</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-4 text-center">
            <p className="text-2xl font-black text-gold">{player.fama}</p>
            <p className="text-xs text-neutral-400 mt-1">Fama</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-4 text-center">
            <p className="text-2xl font-black text-gold">{player.patrimonio.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-neutral-400 mt-1">€ Patrimonio</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-4 text-center">
            <p className="text-2xl font-black text-gold">{milestones?.length ?? 0}</p>
            <p className="text-xs text-neutral-400 mt-1">Momentos épicos</p>
          </div>
        </div>

        {/* Info carrera */}
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-neutral-300">Club actual</span>
            <span className="font-bold text-gold">{player.club}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-300">Edad al retiro</span>
            <span className="font-bold text-gold">{player.age} años</span>
          </div>
          {player.second_career && (
            <div className="flex items-center justify-between pt-4 border-t border-amber-500/20">
              <span className="text-neutral-300">Tu nueva vida</span>
              <span className="font-bold text-emerald-400">{SECOND_CAREER_LABELS[player.second_career]}</span>
            </div>
          )}
          {player.second_career && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Reputación</span>
              <span className="font-bold text-gold">{player.reputacion}</span>
            </div>
          )}
        </div>

        {/* Timeline de momentos */}
        {milestones && milestones.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <h2 className="text-xl font-bold text-white">Tu historia en {seasons} actos</h2>
            </div>
            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent p-4 flex gap-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gold bg-black flex items-center justify-center font-bold text-gold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{m.title}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      📆 Temporada {seasonLabel(m.week)}
                      {m.subtitle ? ` · ${m.subtitle}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cierre */}
        <div className="space-y-4 text-center py-6">
          <div className="space-y-2">
            <p className="text-2xl font-black text-gold">Fin de la carrera</p>
            <p className="text-sm text-neutral-400">
              Tu legado vivirá para siempre en Beyond 90
            </p>
          </div>

          {/* Segunda vida button */}
          {!player.second_career && (
            <Link
              href="/carrera/segunda-vida"
              className="inline-block mt-4 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/50"
            >
              🚀 Comienza tu segunda vida
            </Link>
          )}

          {player.second_career && (
            <Link
              href="/carrera"
              className="inline-block mt-4 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-gold text-neutral-950 font-bold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg hover:shadow-amber-500/50"
            >
              📚 Ver mi legado en carrera
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
