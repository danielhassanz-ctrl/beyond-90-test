import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { withShareLink } from "@/lib/constants";
import { ShareButton } from "@/components/ShareButton";

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player) {
    redirect("/login");
  }

  const { data: careerEvent } = await supabase
    .from("career_events")
    .select("*")
    .eq("id", id)
    .eq("player_id", player.id)
    .maybeSingle();

  if (!careerEvent) {
    redirect("/carrera");
  }

  const continueHref = player.status === "second_life" ? "/carrera/segunda-vida" : "/carrera";
  const shareText = withShareLink(
    `${careerEvent.title}. "${careerEvent.outcome_text}" — ${player.last_name} (${player.club}), en Beyond 90.`,
  );

  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 text-center text-white shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
          {careerEvent.title}
        </p>
        <p className="text-xl font-bold leading-relaxed text-neutral-100">
          {careerEvent.outcome_text}
        </p>

        <ShareButton title="Beyond 90" text={shareText} />

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
