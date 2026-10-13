import { withClubSplit } from "@/lib/narrative/off-screen-matches";
import { displayWeek } from "@/lib/calendar/season-display";
import { getEuroProgress } from "@/lib/calendar/competition-progress";
import { getEuropeanCompetitionFor } from "@/lib/calendar/match-calendar";
import { continentalName } from "@/lib/calendar/leagues";
import { headerPhotoUrl } from "@/lib/player/header-photo";
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

import { fetchAllRows } from "@/lib/supabase/fetchAll";
export default async function ClasificacionPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");

  // Mismo criterio que carrera/page.tsx para saber si sigues en el
  // filial o si ya se disputó tu debut oficial con el primer equipo.
  const { data: allHistory } = await fetchAllRows<{ event_id: string }>((from, to) =>
    supabase.from("career_events").select("event_id").eq("player_id", player.id).order("id").range(from, to),
  );
  const usedEventIds = (allHistory ?? []).map((h) => h.event_id as string);

  const torneo = typeof player.flags?.torneo_activo === "string" ? player.flags.torneo_activo : null;
  // Mientras no se viva el cierre de temporada (1 de julio o fin del torneo de verano) se enseña la temporada que acaba de terminar.
  const shownWeek = displayWeek(player.week, usedEventIds);
  const shownPlayer = { ...player, week: shownWeek } as typeof player;
  const matchRecord = await getSeasonMatchRecord(supabase, shownPlayer, {
    onlyLabels: torneo ? ["Partido internacional"] : undefined,
    pendingEvent: player.pending_event,
  });

  const { primary, secondary, copa, euro } = getActiveStandings(shownPlayer, usedEventIds, matchRecord);
  const euroTied = getEuroProgress(player, Math.floor((player.week - 1) / 10)).tied === true;
  const lastClub = String(player.flags?.clubs_history ?? "").split("|").filter(Boolean).pop() ?? "tu club anterior";
  const euroComp = getEuropeanCompetitionFor(player.club);
  const euroName = euroComp ? continentalName(player.club, euroComp.competition) : "competición europea";
  const seasonStats = await getCurrentSeasonStats(supabase, shownPlayer, player.pending_event, player.flags);
  const competitionStats = await getCompetitionStats(supabase, shownPlayer, player.pending_event, player.flags, player.week);
  // Reparto de partidos inferido (cambio de club anterior al registro): se guarda UNA vez para que no cambie al volver.
  if (competitionStats.splitToPersist) {
    const { data: fresh } = await supabase.from("players").select("flags").eq("id", player.id).maybeSingle();
    const freshFlags = (fresh?.flags ?? {}) as Record<string, string | boolean>;
    await supabase.from("players").update({ flags: withClubSplit(freshFlags, competitionStats.splitToPersist) }).eq("id", player.id);
  }

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
              photoUrl={headerPhotoUrl(player)}
              name={displayName(player)}
              seasonLabel={seasonLabel(shownWeek)}
              stats={seasonStats}
            />

            <CompetitionStatsCard
              season={competitionStats.season}
              career={competitionStats.career}
              seasonLabel={seasonLabel(shownWeek)}
              view="season"
              club={player.club}
              previous={competitionStats.previous}
            />

            {euroTied && (
              <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4 text-sm">
                <p className="text-kicker text-gold">Competición europea</p>
                <p className="mt-1 text-foreground">
                  No puedes jugar la {euroName} con {player.club} esta temporada: ya la jugaste con {lastClub} y el reglamento no permite
                  jugarla con dos clubes en el mismo curso. Hasta el año que viene, solo Liga y Copa.
                </p>
              </div>
            )}
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
