import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { seasonLabel, playerAge } from "@/types/career";
import { withShareLink } from "@/lib/constants";
import { ShareButton } from "@/components/ShareButton";
import { PlayerCard } from "@/components/PlayerCard";
import { ShareableCard } from "@/components/ShareableCard";

export default async function HitoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player) {
    redirect("/login");
  }

  const { data: milestone } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", id)
    .eq("player_id", player.id)
    .maybeSingle();

  if (!milestone) {
    redirect("/carrera");
  }

  const continueHref =
    player.status === "awaiting_second_life"
      ? "/carrera/segunda-vida/elegir"
      : player.status === "second_life"
        ? "/carrera/segunda-vida"
        : player.status === "retired"
          ? "/carrera/retiro"
          : "/carrera";

  const shareText = withShareLink(
    `${milestone.title} — ${player.last_name}, ${playerAge(milestone.week)} años (${player.club}). Juégalo en Beyond 90.`,
  );
  const photoUrl = player.current_photo_url ?? player.photo_url;
  const age = playerAge(milestone.week);

  // Mapeo de tipos de hito a etiquetas y colores
  const milestoneMetadata: Record<string, { label: string; emoji: string; color: string }> = {
    debut: { label: "Debut profesional", emoji: "🌟", color: "text-yellow-300" },
    contrato: { label: "Fichaje importante", emoji: "⚽", color: "text-amber-300" },
    title_liga: { label: "Campeón", emoji: "🏆", color: "text-yellow-400" },
    title_champions: { label: "Europa", emoji: "👑", color: "text-amber-400" },
    gol_historico: { label: "Momento de gloria", emoji: "⚡", color: "text-orange-300" },
    premio: { label: "Reconocimiento", emoji: "🎖️", color: "text-amber-300" },
    sponsor: { label: "Patrocinio", emoji: "💎", color: "text-blue-300" },
    retiro_jugador: { label: "Retirada", emoji: "🎬", color: "text-neutral-400" },
    hito: { label: "Momento destacado", emoji: "✨", color: "text-amber-200" },
  };

  const meta = milestoneMetadata[milestone.type] || milestoneMetadata.hito;

  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header con metadata */}
        <div className="text-center space-y-2">
          <p className="text-3xl">{meta.emoji}</p>
          <p className={`text-sm font-bold uppercase tracking-widest ${meta.color}`}>
            {meta.label}
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            {milestone.title}
          </h1>
          {milestone.subtitle && (
            <p className="text-base text-neutral-300 max-w-xl mx-auto">
              {milestone.subtitle}
            </p>
          )}
          <p className="text-xs text-neutral-500 pt-2">
            Semana {milestone.week} • Temporada {seasonLabel(milestone.week)} • {age} años
          </p>
        </div>

        {/* Imagen o tarjeta compartible */}
        <div className="rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl bg-neutral-900">
          {milestone.image_url ? (
            <>
              <div className="relative w-full max-w-md mx-auto aspect-[4/5] overflow-hidden">
                <Image
                  src={milestone.image_url}
                  alt={milestone.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="p-6 space-y-4 bg-gradient-to-t from-neutral-950 via-neutral-900/50 to-transparent">
                <ShareButton
                  imageUrl={milestone.image_url}
                  title="Beyond 90"
                  text={shareText}
                />
              </div>
            </>
          ) : (
            <div className="p-6 space-y-6 bg-gradient-to-br from-neutral-900 to-neutral-950">
              <ShareableCard title="Beyond 90" text={shareText}>
                <PlayerCard
                  photoUrl={photoUrl}
                  name={player.last_name}
                  number={player.number}
                  position={player.position}
                  club={player.club}
                  ribbon={meta.label}
                  seasonLabel={`Temporada ${seasonLabel(milestone.week)} • ${age} años`}
                />
              </ShareableCard>
            </div>
          )}
        </div>

        {/* Estadísticas o contexto del momento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-neutral-900 p-3 border border-neutral-800 text-center">
            <p className="text-2xl font-black text-amber-300">{player.media}</p>
            <p className="text-[11px] uppercase tracking-wide text-neutral-400 mt-1">Media</p>
          </div>
          <div className="rounded-lg bg-neutral-900 p-3 border border-neutral-800 text-center">
            <p className="text-2xl font-black text-amber-300">{player.fama}</p>
            <p className="text-[11px] uppercase tracking-wide text-neutral-400 mt-1">Fama</p>
          </div>
          <div className="rounded-lg bg-neutral-900 p-3 border border-neutral-800 text-center">
            <p className="text-2xl font-black text-amber-300">{player.week}w</p>
            <p className="text-[11px] uppercase tracking-wide text-neutral-400 mt-1">Semanas</p>
          </div>
          <div className="rounded-lg bg-neutral-900 p-3 border border-neutral-800 text-center">
            <p className="text-2xl font-black text-amber-300">{age}</p>
            <p className="text-[11px] uppercase tracking-wide text-neutral-400 mt-1">Años</p>
          </div>
        </div>

        {/* Botón continuar */}
        <Link
          href={continueHref}
          className="block w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-center font-bold text-neutral-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg hover:shadow-amber-500/50 text-sm uppercase tracking-wide"
        >
          Continuar tu carrera
        </Link>
      </div>
    </main>
  );
}
