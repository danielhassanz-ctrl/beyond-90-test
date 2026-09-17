import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { seasonLabel, playerAge, SECOND_CAREER_LABELS } from "@/types/career";
import { displayName } from "@/types/player";
import { withShareLink } from "@/lib/constants";

/**
 * Tipos de milestoneType que solo se generan en la segunda vida (ver
 * src/lib/narrative/segundaVida.ts). `milestone.week` para estos hitos es
 * en realidad `second_week` (empieza en 1 al iniciar la segunda vida),
 * no la semana de la carrera como jugador — pasarlo tal cual a
 * playerAge/seasonLabel (pensadas para la semana de jugador) daba una
 * edad y temporada completamente inventadas (p.ej. "16 años" al ganar la
 * Champions como entrenador a los 50).
 */
const SECOND_LIFE_MILESTONE_TYPES = new Set([
  "ascenso_entrenador",
  "canterano",
  "seleccion",
  "final_champions",
  "fichaje_agente",
  "puja_agente",
  "agencia",
  "cantera",
  "oferta_fondo",
  "fichaje_galactico",
  "titulo_presidente",
  "inversor",
  "cantera_propia",
  "autobiografia",
  "hall_fama",
  "balon_oro_cliente",
  "fondo_deportivo",
  "presidente_federacion",
]);
import { ShareButton } from "@/components/ShareButton";
import { PlayerCard } from "@/components/PlayerCard";
import { ShareableCard } from "@/components/ShareableCard";
import { MilestonePendingPoller } from "@/components/MilestonePendingPoller";

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

  const isSecondLifeMilestone = SECOND_LIFE_MILESTONE_TYPES.has(milestone.type);
  const age = isSecondLifeMilestone ? null : playerAge(milestone.week);
  const timeLabel = isSecondLifeMilestone
    ? `Semana ${milestone.week} de tu vida como ${player.second_career ? SECOND_CAREER_LABELS[player.second_career] : "profesional"}`
    : `Semana ${milestone.week} • Temporada ${seasonLabel(milestone.week)} • ${age} años`;
  const shareText = withShareLink(
    isSecondLifeMilestone
      ? `${milestone.title} — ${displayName(player)} (${player.second_club ?? player.club}). Juégalo en Beyond 90.`
      : `${milestone.title} — ${displayName(player)}, ${age} años (${player.club}). Juégalo en Beyond 90.`,
  );
  const photoUrl = player.current_photo_url ?? player.photo_url;

  // Mapeo de tipos de hito a etiquetas y emoji
  const milestoneMetadata: Record<string, { label: string; emoji: string }> = {
    debut: { label: "Debut profesional", emoji: "🌟" },
    contrato: { label: "Fichaje importante", emoji: "⚽" },
    title_liga: { label: "Campeón", emoji: "🏆" },
    title_champions: { label: "Europa", emoji: "👑" },
    gol_historico: { label: "Momento de gloria", emoji: "⚡" },
    premio: { label: "Reconocimiento", emoji: "🎖️" },
    sponsor: { label: "Patrocinio", emoji: "💎" },
    retiro_jugador: { label: "Retirada", emoji: "🎬" },
    hito: { label: "Momento destacado", emoji: "✨" },
  };

  const meta = milestoneMetadata[milestone.type] || milestoneMetadata.hito;

  // Si un hito lleva "pending" más tiempo del que puede tardar de verdad
  // una generación (ver replicate.ts: ~280s en el peor caso), el trabajo
  // en segundo plano ha muerto de forma huérfana — un reinicio del
  // servidor a medio generar, un timeout de la plataforma — y ya no va a
  // terminar nunca. Antes esta pantalla se quedaba con el spinner para
  // siempre pase lo que pase (el aviso de MilestonePendingPoller decía
  // "está tardando más de lo normal" pero la propia pantalla nunca
  // dejaba de mostrar el spinner, ni siquiera después de eso). Visto en
  // vivo jugando: un hito real se quedó en pending sin ningún intento de
  // generación registrado en los logs del servidor. Pasado este umbral,
  // se trata igual que si no hubiera imagen — cae a la tarjeta compartible
  // sin foto, en vez de dejar al jugador mirando un spinner roto.
  const STALE_PENDING_MS = 5 * 60_000;
  const pendingSince = milestone.created_at ? Date.now() - new Date(milestone.created_at).getTime() : 0;
  const isStalePending = milestone.image_status === "pending" && pendingSince > STALE_PENDING_MS;

  return (
    <main className="flex flex-1 items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header con metadata */}
        <div className="text-center space-y-2">
          <p className="text-3xl">{meta.emoji}</p>
          <p className="text-kicker">{meta.label}</p>
          <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
            {milestone.title}
          </h1>
          {milestone.subtitle && (
            <p className="mx-auto max-w-xl text-base text-muted-foreground">
              {milestone.subtitle}
            </p>
          )}
          <p className="pt-2 text-xs text-muted-foreground/70">{timeLabel}</p>
        </div>

        {/* Imagen o tarjeta compartible */}
        <div className="overflow-hidden rounded-2xl border border-panel-border bg-surface shadow-2xl">
          {milestone.image_status === "pending" && !isStalePending ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Preparando tu foto de este momento — puede tardar un par de minutos.
                <br />
                Sigue jugando, te avisamos en cuanto esté lista.
              </p>
              <MilestonePendingPoller milestoneId={milestone.id} />
            </div>
          ) : milestone.image_url ? (
            <>
              <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden">
                <Image
                  src={milestone.image_url}
                  alt={milestone.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="space-y-4 bg-gradient-to-t from-background via-surface/50 to-transparent p-6">
                <ShareButton
                  imageUrl={milestone.image_url}
                  title="Beyond 90"
                  text={shareText}
                />
              </div>
            </>
          ) : (
            <div className="space-y-6 bg-gradient-to-br from-surface to-background p-6">
              <ShareableCard title="Beyond 90" text={shareText}>
                <PlayerCard
                  photoUrl={photoUrl}
                  name={displayName(player)}
                  number={player.number}
                  position={player.position}
                  club={isSecondLifeMilestone ? (player.second_club ?? player.club) : player.club}
                  ribbon={meta.label}
                  seasonLabel={timeLabel}
                />
              </ShareableCard>
            </div>
          )}
        </div>

        {/* Estadísticas o contexto del momento */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-panel-border bg-surface p-3 text-center">
            <p className="gold-text font-display text-2xl">{player.media}</p>
            <p className="text-kicker mt-1">Media</p>
          </div>
          <div className="rounded-2xl border border-panel-border bg-surface p-3 text-center">
            <p className="gold-text font-display text-2xl">{player.fama}</p>
            <p className="text-kicker mt-1">Fama</p>
          </div>
          <div className="rounded-2xl border border-panel-border bg-surface p-3 text-center">
            <p className="gold-text font-display text-2xl">{player.week}w</p>
            <p className="text-kicker mt-1">Semanas</p>
          </div>
          <div className="rounded-2xl border border-panel-border bg-surface p-3 text-center">
            <p className="gold-text font-display text-2xl">{age}</p>
            <p className="text-kicker mt-1">Años</p>
          </div>
        </div>

        {/* Botón continuar */}
        <Link
          href={continueHref}
          className="gold-fill block w-full rounded-full px-6 py-3 text-center font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
        >
          Continuar tu carrera
        </Link>
      </div>
    </main>
  );
}
