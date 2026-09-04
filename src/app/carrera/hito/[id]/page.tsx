import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { seasonLabel } from "@/types/career";
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
    `${milestone.title} — ${player.last_name} (${player.club}). Juégalo en Beyond 90.`,
  );
  const photoUrl = player.current_photo_url ?? player.photo_url;

  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 text-center text-white shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
          Momento destacado
        </p>
        <h1 className="text-2xl font-bold">{milestone.title}</h1>
        {milestone.subtitle && (
          <p className="text-sm text-neutral-300">{milestone.subtitle}</p>
        )}

        {milestone.image_url ? (
          <>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-amber-500/20">
              <Image
                src={milestone.image_url}
                alt={milestone.title}
                fill
                className="object-cover"
              />
            </div>
            <ShareButton imageUrl={milestone.image_url} title="Beyond 90" text={shareText} />
          </>
        ) : (
          <ShareableCard title="Beyond 90" text={shareText}>
            <PlayerCard
              photoUrl={photoUrl}
              name={player.last_name}
              number={player.number}
              position={player.position}
              club={player.club}
              ribbon={milestone.type === "debut" ? "Bienvenido" : "Momento destacado"}
              seasonLabel={`Temporada ${seasonLabel(milestone.week)}`}
            />
          </ShareableCard>
        )}

        <Link
          href={continueHref}
          className="inline-block rounded-md border border-amber-500/40 px-5 py-2 text-sm font-semibold text-amber-400 hover:bg-amber-500/10"
        >
          Continuar
        </Link>
      </div>
    </main>
  );
}
