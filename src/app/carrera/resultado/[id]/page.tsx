import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { withShareLink } from "@/lib/constants";
import { ShareButton } from "@/components/ShareButton";
import { ShareableCard } from "@/components/ShareableCard";
import { SeasonRecapCard } from "@/components/SeasonRecapCard";
import { CONSEQUENCE_LABELS, WEEKS_PER_SEASON, seasonLabel, playerAge } from "@/types/career";
import { displayName } from "@/types/player";
import { EventScene } from "@/components/EventScene";

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
    `${careerEvent.title}. "${careerEvent.outcome_text}" — ${displayName(player)} (${player.club}), en Beyond 90.`,
  );

  // Parsear consecuencias para mostrar visualmente
  const consequences = careerEvent.consequences || {};
  const consequencesList = Object.entries(consequences)
    .filter(([, value]) => typeof value === "number" && value !== 0)
    .sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number))
    .slice(0, 4) as [string, number][];

  // El cierre de temporada (ver generatePreseasoneEvent en ai.ts) es el
  // único momento del año donde de verdad "pasa" algo con el paso del
  // tiempo — merece su propia tarjeta compartible, no solo texto, igual
  // que un hito. Deliberadamente NO se guarda como milestone (ver el "No
  // marques is_milestone" en el prompt): con 15-20 temporadas en una
  // carrera larga, cada cierre de año en Legado saturaría de "momentos
  // destacados" cosas que no lo son. Esta tarjeta se genera al vuelo,
  // sin gastar en Replicate.
  const isSeasonRecap = careerEvent.event_id?.startsWith("preseason-") ?? false;
  const closedSeasonWeek = Math.max(1, careerEvent.week - WEEKS_PER_SEASON);

  return (
    <main className="flex flex-1 items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="overflow-hidden rounded-2xl border border-panel-border bg-surface">
          <EventScene club={player.club} category={careerEvent.category} />

          <div className="space-y-4 p-6">
            <p className="text-kicker">Consecuencias</p>
            <h1 className="font-display text-2xl text-foreground leading-tight">{careerEvent.title}</h1>

            <p className="text-sm text-muted-foreground leading-relaxed">{careerEvent.description}</p>

            {careerEvent.outcome_text && (
              <p className="font-cond text-base italic text-foreground/90 leading-relaxed">
                {careerEvent.outcome_text}
              </p>
            )}

            {careerEvent.chosen_option_label && (
              <div className="space-y-1">
                <p className="text-kicker">Tu decisión</p>
                <p className="text-sm font-medium text-foreground/90">{careerEvent.chosen_option_label}</p>
              </div>
            )}

            {careerEvent.free_text_response && (
              <div className="space-y-1">
                <p className="text-kicker">Tu respuesta</p>
                <p className="text-sm italic text-muted-foreground">&ldquo;{careerEvent.free_text_response}&rdquo;</p>
              </div>
            )}

            {consequencesList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {consequencesList.map(([key, value]) => {
                  const isPositive = (value as number) > 0;
                  return (
                    <span
                      key={key}
                      className={`font-cond rounded-full border px-3 py-1 text-xs font-semibold ${
                        isPositive
                          ? "border-pitch/50 bg-pitch/10 text-pitch"
                          : "border-destructive/50 bg-destructive/10 text-destructive"
                      }`}
                    >
                      {CONSEQUENCE_LABELS[key as keyof typeof CONSEQUENCE_LABELS] || key} {isPositive ? "+" : ""}
                      {value as number}
                    </span>
                  );
                })}
              </div>
            )}

            <Link
              href={continueHref}
              className="gold-fill block w-full rounded-full px-6 py-3 text-center font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
            >
              Siguiente escena
            </Link>
          </div>
        </div>

        {isSeasonRecap ? (
          <ShareableCard title="Beyond 90" text={shareText}>
            <SeasonRecapCard
              player={player}
              seasonLabel={seasonLabel(closedSeasonWeek)}
              age={playerAge(careerEvent.week)}
              consequences={consequencesList}
            />
          </ShareableCard>
        ) : (
          <ShareButton title="Beyond 90" text={shareText} />
        )}
      </div>
    </main>
  );
}
