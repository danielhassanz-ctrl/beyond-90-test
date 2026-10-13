import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { withShareLink, getAppUrlLine } from "@/lib/constants";
import { ShareButton } from "@/components/ShareButton";
import { ShareableCard } from "@/components/ShareableCard";
import { SeasonRecapCard } from "@/components/SeasonRecapCard";
import { RecapPhotoWatcher } from "@/components/RecapPhotoWatcher";
import { RegenerateRecapButton } from "@/components/RegenerateRecapButton";
import { netWorth } from "@/lib/finance/net-worth";
import { marketValueM, eur, eurFee } from "@/lib/narrative/transfer-terms";
import { allTrofeos, INDIVIDUAL } from "@/lib/honours";
import { CONSEQUENCE_LABELS, WEEKS_PER_SEASON, seasonLabel, playerAge } from "@/types/career";
import { displayName } from "@/types/player";
import { EventScene } from "@/components/EventScene";
import { getCurrentSeasonStats } from "@/lib/player/update-stats";
import { getGameDateLabel } from "@/lib/calendar/season";
import { composeRecapCard } from "@/lib/images/recapCard";
import { uploadGeneratedImage } from "@/lib/images/upload";
import { clubAtSeasonEnd, type ClubChange } from "@/lib/player/club-timeline";
import { fetchAllRows } from "@/lib/supabase/fetchAll";

/** "6,35 M€", "420 mil €" o "8.500 €": cabe en una casilla pequeña de la tarjeta. */
function compactEur(n: number): string {
  const v = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (v >= 1_000_000) return `${sign}${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2).replace(".", ",")} M€`;
  if (v >= 100_000) return `${sign}${Math.round(v / 1000)} mil €`;
  return `${sign}${Math.round(v).toLocaleString("es")} €`;
}

// Reloj fuera del render: la página se calcula en el servidor en cada petición.
const nowMs = () => Date.now();

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
  // Solo el cierre real ("preseason-12"): las escenas de vida de pretemporada ("preseason-ev-...") no cierran nada.
  const isSeasonRecap = /^preseason-\d+$/.test(careerEvent.event_id ?? "");
  const closedSeasonWeek = Math.max(1, careerEvent.week - WEEKS_PER_SEASON);
  // Para la temporada que se acaba de cerrar, no la nueva que ya empezó —
  // player.week ya ha avanzado a la temporada siguiente para cuando se ve
  // esta pantalla, así que hay que pedir las stats con la semana de cierre.
  const seasonStats = isSeasonRecap
    ? await getCurrentSeasonStats(supabase, { id: player.id, week: closedSeasonWeek }, null, player.flags)
    : null;

  // Foto resumen propia del cierre (se genera en segundo plano al confirmar la decisión, ver resolveEvent):
  // mientras tarda se enseña "revelando…" y la página se refresca sola hasta que está lista.
  // Títulos de equipo ganados en la temporada que se cierra (los premios individuales no cuentan).
  const closedSeasonIdx = Math.floor((closedSeasonWeek - 1) / WEEKS_PER_SEASON);
  const closedSeasonTitles = allTrofeos(player).filter((t) => t.s === closedSeasonIdx && !INDIVIDUAL.has(t.k)).length;
  const recapFlags = (player.flags ?? {}) as Record<string, string | boolean>;
  const recapPendingSince = parseInt(String(recapFlags.recap_photo_pending ?? "").split(":")[1] ?? "0", 10) || 0;
  const recapPending = isSeasonRecap && recapPendingSince > 0 && nowMs() - recapPendingSince < 4 * 60_000;
  const recapPhoto = typeof recapFlags.recap_photo === "string" && recapFlags.recap_photo ? recapFlags.recap_photo : null;

  // La tarjeta de cada temporada se guarda ya montada (foto + cifras de AQUEL momento) la primera vez que se ve con la
  // foto lista; así conserva su foto y sus cifras aunque cambien después. Si se rehace la foto de esa temporada, se
  // borra y se vuelve a montar.
  const recapSeason = isSeasonRecap ? parseInt(/^preseason-(\d+)$/.exec(careerEvent.event_id ?? "")![1], 10) : null;
  const cardKey = recapSeason !== null ? `recap_c2_${recapSeason}` : null;
  let recapCardUrl = cardKey && typeof recapFlags[cardKey] === "string" && recapFlags[cardKey] ? String(recapFlags[cardKey]) : null;

  // Cómo estabas al cerrar ESA temporada: la foto fija que se guarda al cerrarla (recap_snap_N) o, en los cierres
  // anteriores a ese registro, lo que se puede reconstruir (club por tus fichajes, media deshaciendo los cambios
  // posteriores). El patrimonio de entonces no se puede reconstruir: en esos cierres no se enseña.
  let cardClub = player.club;
  let cardMedia = player.media;
  let cardValueM = marketValueM(player);
  let cardNetWorth: number | null = netWorth(player);
  if (isSeasonRecap && recapSeason !== null && !recapCardUrl) {
    let snap: { m?: number; c?: string; v?: number; n?: number } | null = null;
    try {
      const raw = recapFlags[`recap_snap_${recapSeason}`];
      snap = typeof raw === "string" && raw ? JSON.parse(raw) : null;
    } catch {
      snap = null;
    }
    if (snap && typeof snap.m === "number" && snap.c) {
      cardClub = snap.c;
      cardMedia = snap.m;
      cardValueM = typeof snap.v === "number" ? snap.v : marketValueM({ media: snap.m, week: careerEvent.week });
      cardNetWorth = typeof snap.n === "number" ? snap.n : null;
    } else {
      const { data: evs } = await fetchAllRows<{ week: number; consequences: Record<string, unknown> | null }>((from, to) =>
        supabase.from("career_events").select("week, consequences").eq("player_id", player.id).order("id").range(from, to),
      );
      const changes: ClubChange[] = [];
      let mediaAfter = 0;
      for (const e of evs ?? []) {
        const c = e.consequences;
        if (c && typeof c.club === "string" && c.club) changes.push({ week: e.week, club: c.club });
        if (c && typeof c.media === "number" && e.week >= careerEvent.week) mediaAfter += c.media;
      }
      cardClub = clubAtSeasonEnd(recapFlags, closedSeasonIdx, changes, player.club);
      cardMedia = Math.max(40, Math.min(99, player.media - mediaAfter));
      cardValueM = marketValueM({ media: cardMedia, week: careerEvent.week });
      cardNetWorth = null;
    }
  }
  if (isSeasonRecap && cardKey && !recapCardUrl && !recapPending && seasonStats) {
    try {
      const buffer = await composeRecapCard({
        name: displayName(player),
        media: cardMedia,
        position: player.position,
        nation: player.nation ?? "",
        age: playerAge(careerEvent.week),
        club: cardClub,
        seasonLabel: seasonLabel(closedSeasonWeek),
        marketValue: eurFee(cardValueM),
        netWorth: cardNetWorth === null ? undefined : compactEur(cardNetWorth),
        stats: {
          matches: seasonStats.matches_played,
          goals: seasonStats.goals,
          assists: seasonStats.assists,
          titles: closedSeasonTitles,
          minutes: seasonStats.minutes_played,
        },
        photoUrl: recapPhoto ?? player.photo_url,
        tagline: "Así cerré la temporada. ¿Cómo vas tú?",
        linkLine: getAppUrlLine(),
      });
      const url = await uploadGeneratedImage(supabase, user.id, buffer, "recapcard");
      if (url) {
        const { data: cur } = await supabase.from("players").select("flags").eq("id", player.id).maybeSingle();
        const next = { ...((cur?.flags ?? {}) as Record<string, string | boolean>), [cardKey]: url };
        const { data: saved } = await supabase.from("players").update({ flags: next }).eq("id", player.id).select("id");
        if (saved && saved.length === 1) recapCardUrl = url;
      }
    } catch (err) {
      console.error("[resultado] no se pudo montar la tarjeta de resumen:", err instanceof Error ? err.message : err);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-background p-4">
      {recapPending && <RecapPhotoWatcher />}
      <div className="w-full max-w-2xl space-y-4">
        <div className="overflow-hidden rounded-2xl border border-panel-border bg-surface">
          <EventScene club={player.club} category={careerEvent.category} />

          <div className="space-y-4 p-6">
            <p className="text-kicker">
              Consecuencias
              {player.status !== "second_life" && player.status !== "awaiting_second_life"
                ? ` · ${getGameDateLabel(careerEvent.week)}`
                : ""}
            </p>
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
          <div className="space-y-3">
          {recapCardUrl ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={recapCardUrl} alt={`Resumen de la temporada ${seasonLabel(closedSeasonWeek)}`} className="w-full rounded-2xl" />
              <ShareButton imageUrl={recapCardUrl} title="Beyond 90" text={shareText} />
            </div>
          ) : (
          <ShareableCard title="Beyond 90" text={shareText}>
            <SeasonRecapCard
              player={{ ...player, club: cardClub, media: cardMedia }}
              seasonLabel={seasonLabel(closedSeasonWeek)}
              age={playerAge(careerEvent.week)}
              stats={seasonStats!}
              tagline="Así cerré la temporada. ¿Cómo vas tú?"
              linkLine={getAppUrlLine()}
              photoUrl={recapPhoto}
              pending={recapPending}
              marketValue={eurFee(cardValueM)}
              netWorth={cardNetWorth === null ? undefined : compactEur(cardNetWorth)}
              titles={closedSeasonTitles}
            />
          </ShareableCard>
          )}
          {!recapPending && <RegenerateRecapButton careerEventId={id} />}
          </div>
        ) : (
          <ShareButton title="Beyond 90" text={shareText} />
        )}
      </div>
    </main>
  );
}
