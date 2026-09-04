import Image from "next/image";
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

  const shareText = withShareLink(
    `${player.last_name} colgó las botas en el ${player.club}, después de ${milestones?.length ?? 0} momentos clave y una carrera que ya es leyenda. Juega la tuya en Beyond 90.`,
  );

  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 text-white shadow-xl">
        {heroImage && (
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-amber-500/20">
            <Image src={heroImage} alt={player.last_name} fill className="object-cover" />
          </div>
        )}

        <ShareableCard title="Beyond 90" text={shareText}>
          <CareerStatCard player={player} />
        </ShareableCard>

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Fin de la carrera
          </p>
          <h1 className="text-2xl font-bold">{player.last_name}</h1>
          <p className="text-sm text-neutral-400">
            {player.club} · Última temporada como jugador {seasonLabel(player.week)}
          </p>
          {player.second_career && (
            <p className="text-sm text-amber-400">
              Después: {SECOND_CAREER_LABELS[player.second_career]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-amber-500/20 bg-black/30 p-3 text-center text-sm">
          <div>
            <p className="text-lg font-bold">{player.fama}</p>
            <p className="text-xs text-neutral-400">Fama</p>
          </div>
          <div>
            <p className="text-lg font-bold">{player.patrimonio.toLocaleString("es")} €</p>
            <p className="text-xs text-neutral-400">Patrimonio</p>
          </div>
          <div>
            <p className="text-lg font-bold">{milestones?.length ?? 0}</p>
            <p className="text-xs text-neutral-400">Momentos clave</p>
          </div>
        </div>

        {player.second_career && (
          <div className="rounded-lg border border-amber-500/20 bg-black/30 p-3 text-center text-sm">
            <p className="text-lg font-bold">{player.reputacion}</p>
            <p className="text-xs text-neutral-400">
              Reputación como {SECOND_CAREER_LABELS[player.second_career].toLowerCase()}
            </p>
          </div>
        )}

        {milestones && milestones.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Tu historia
            </p>
            <ul className="space-y-2">
              {milestones.map((m) => (
                <li key={m.id} className="rounded-md border border-amber-500/10 bg-black/20 p-3 text-sm">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-neutral-400">
                    Temporada {seasonLabel(m.week)}
                    {m.subtitle ? ` · ${m.subtitle}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-xs text-neutral-500">
          Tu carrera terminó aquí. Gracias por jugarla.
        </p>
      </div>
    </main>
  );
}
