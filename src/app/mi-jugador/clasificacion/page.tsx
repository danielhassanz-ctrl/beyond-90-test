import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { BottomNav } from "@/components/BottomNav";
import { StandingsTable, KnockoutBox } from "@/components/StandingsTable";
import { SeasonStatsCard } from "@/components/SeasonStatsCard";
import { CompetitionStatsCard } from "@/components/CompetitionStatsCard";
import { getCompetitionStats } from "@/lib/player/competition-stats";
import { getActiveStandings, getSeasonMatchRecord } from "@/lib/narrative/standings";
import { getCurrentSeasonStats } from "@/lib/player/update-stats";
import { displayName } from "@/types/player";
import { seasonLabel } from "@/types/career";
import { NO_CLUB_YET } from "@/lib/constants";

export default async function ClasificacionPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");

  // Mismo criterio que carrera/page.tsx para saber si sigues en el
  // filial o si ya se disputó tu debut oficial con el primer equipo.
  const { data: allHistory } = await supabase
    .from("career_events")
    .select("event_id")
    .eq("player_id", player.id);
  const usedEventIds = (allHistory ?? []).map((h) => h.event_id as string);

  const torneo = typeof player.flags?.torneo_activo === "string" ? player.flags.torneo_activo : null;
  const matchRecord = await getSeasonMatchRecord(supabase, player, {
    onlyLabels: torneo ? ["Partido internacional"] : undefined,
    pendingEvent: player.pending_event,
  });

  const { primary, secondary, copa, euro } = getActiveStandings(player, usedEventIds, matchRecord);
  const seasonStats = await getCurrentSeasonStats(supabase, player, player.pending_event);
  const competitionStats = await getCompetitionStats(supabase, player, player.pending_event);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
      <div className="w-full max-w-md space-y-1 text-center">
        <p className="text-4xl">📊</p>
        <h1 className="font-display text-2xl">Clasificación</h1>
        <p className="text-sm text-muted-foreground">Dónde estás ahora mismo, temporada a temporada.</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        {player.club === NO_CLUB_YET ? (
          <div className="rounded-2xl border border-panel-border bg-surface p-6 text-center text-sm text-muted-foreground">
            Todavía no has fichado por ningún club — aquí aparecerá tu clasificación en cuanto tengas equipo.
          </div>
        ) : (
          <>
            <SeasonStatsCard
              photoUrl={player.current_photo_url ?? player.photo_url}
              name={displayName(player)}
              seasonLabel={seasonLabel(player.week)}
              stats={seasonStats}
            />

            <CompetitionStatsCard
              season={competitionStats.season}
              career={competitionStats.career}
              seasonLabel={seasonLabel(player.week)}
            />

            {primary && <StandingsTable standings={primary} />}
            {secondary && <StandingsTable standings={secondary} />}
            {copa && <KnockoutBox knockout={copa} />}
            {euro && <KnockoutBox knockout={euro} />}

            <p className="text-center text-xs text-muted-foreground">
              Clasificación orientativa, no un resultado jornada a jornada de cada rival — lo importante es dónde
              estás tú y cómo cambia según rindes.
            </p>
          </>
        )}
      </div>

      <BottomNav active="clasificacion" />
    </main>
  );
}
