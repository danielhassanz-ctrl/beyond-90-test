import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { SECOND_CAREER_LABELS, seasonLabel, playerAge, WEEKS_PER_SEASON } from "@/types/career";
import { displayName } from "@/types/player";
import { withShareLink } from "@/lib/constants";
import { CareerStatCard } from "@/components/CareerStatCard";
import { ShareableCard } from "@/components/ShareableCard";
import { beginSecondLife } from "./actions";

/**
 * Mismos tipos de segunda vida que en carrera/hito/[id]/page.tsx — su
 * "week" es en realidad second_week (empieza en 1), no la semana de la
 * carrera como jugador.
 */
const SECOND_LIFE_MILESTONE_TYPES = new Set([
  "ascenso_entrenador", "canterano", "seleccion", "final_champions",
  "fichaje_agente", "puja_agente", "agencia", "cantera", "oferta_fondo",
  "fichaje_galactico", "titulo_presidente", "inversor", "cantera_propia",
  "autobiografia", "hall_fama", "balon_oro_cliente", "fondo_deportivo",
  "presidente_federacion",
]);

export default async function RetiroPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player) {
    redirect("/login");
  }

  if (player.status !== "retired") {
    await supabase.from("players").update({ status: "retired" }).eq("id", player.id);
  }

  // Ordenar por "week" mezclaba mal los hitos de segunda vida: esa
  // columna vale second_week para ellos (empieza en 1 de nuevo), así que
  // un hito de años después de retirarse podía colarse en medio de la
  // carrera como jugador. created_at es un timestamp real, siempre en
  // orden cronológico de verdad pase lo que pase con los contadores.
  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("player_id", player.id)
    .order("created_at", { ascending: true });

  const heroImage = [...(milestones ?? [])].reverse().find((m) => m.image_url)?.image_url as
    | string
    | undefined;

  const totalWeeks = player.week;
  // Antes dividía por 38 (las jornadas de una Liga real de 20 equipos),
  // pero este juego no funciona así: una temporada aquí son 10 semanas
  // (ver WEEKS_PER_SEASON) — con 38 el número de temporadas mostrado en
  // la tarjeta de retiro salía muy por debajo del real (una carrera Pro
  // de 200 semanas mostraba "6 temporadas" en vez de las 20 reales).
  const seasons = Math.ceil(totalWeeks / WEEKS_PER_SEASON);
  const shareText = withShareLink(
    `${displayName(player)} colgó las botas. Carrera de ${seasons} temporadas, ${milestones?.length ?? 0} momentos épicos, ${player.fama} de fama. ¿La tuya será mayor? Juega en Beyond 90.`,
  );

  return (
    <main className="flex flex-1 justify-center bg-gradient-to-b from-background via-background to-surface p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-6 pb-12">
        {/* Header épico */}
        <div className="space-y-4 text-center">
          <p className="text-6xl">👑</p>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground">
            Leyenda <span className="gold-text">{displayName(player)}</span>
          </h1>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground">
            Tu carrera ha terminado. Ahora eres parte de la historia del fútbol.
          </p>
        </div>

        {/* Imagen héroe */}
        {heroImage && (
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-panel-border shadow-2xl">
            <Image src={heroImage} alt={displayName(player)} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        )}

        {/* Shareable card */}
        <ShareableCard title="Beyond 90" text={shareText}>
          <CareerStatCard player={player} />
        </ShareableCard>

        {/* Stats principales */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-panel-border bg-surface p-4 text-center">
            <p className="gold-text font-display text-2xl">{seasons}</p>
            <p className="text-kicker mt-1">Temporadas</p>
          </div>
          <div className="rounded-2xl border border-panel-border bg-surface p-4 text-center">
            <p className="gold-text font-display text-2xl">{player.fama}</p>
            <p className="text-kicker mt-1">Fama</p>
          </div>
          <div className="rounded-2xl border border-panel-border bg-surface p-4 text-center">
            <p className="gold-text font-display text-2xl">{player.patrimonio.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
            <p className="text-kicker mt-1">€ Patrimonio</p>
          </div>
          <div className="rounded-2xl border border-panel-border bg-surface p-4 text-center">
            <p className="gold-text font-display text-2xl">{milestones?.length ?? 0}</p>
            <p className="text-kicker mt-1">Momentos épicos</p>
          </div>
        </div>

        {/* Info carrera */}
        <div className="space-y-4 rounded-2xl border border-panel-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Club actual</span>
            <span className="font-cond text-sm font-bold text-gold">{player.club}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Edad al retiro</span>
            <span className="font-cond text-sm font-bold text-gold">{playerAge(player.week)} años</span>
          </div>
          {player.second_career && (
            <div className="flex items-center justify-between border-t border-panel-border pt-4">
              <span className="text-sm text-muted-foreground">Tu nueva vida</span>
              <span className="font-cond text-sm font-bold text-pitch">{SECOND_CAREER_LABELS[player.second_career]}</span>
            </div>
          )}
          {player.second_career && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reputación</span>
              <span className="font-cond text-sm font-bold text-gold">{player.reputacion}</span>
            </div>
          )}
        </div>

        {/* Timeline de momentos */}
        {milestones && milestones.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <h2 className="font-display text-xl text-foreground">Tu historia en {seasons} actos</h2>
            </div>
            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="flex gap-4 rounded-2xl border border-panel-border bg-surface p-4"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-gold bg-background font-cond text-sm font-bold text-gold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{m.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {SECOND_LIFE_MILESTONE_TYPES.has(m.type)
                        ? `📆 Semana ${m.week} de tu segunda vida`
                        : `📆 Temporada ${seasonLabel(m.week)}`}
                      {m.subtitle ? ` · ${m.subtitle}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cierre */}
        <div className="space-y-4 py-6 text-center">
          <div className="space-y-2">
            <p className="font-display text-2xl">
              <span className="gold-text">Fin de la carrera</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Tu legado vivirá para siempre en Beyond 90
            </p>
          </div>

          {/* Segunda vida button: pasa por beginSecondLife() para dejar el
              status en awaiting_second_life -- sin eso, /carrera/segunda-vida
              devolvía al jugador aquí mismo en bucle. */}
          {!player.second_career && (
            <form action={beginSecondLife}>
              <button
                type="submit"
                className="pitch-fill mt-4 inline-block rounded-full px-6 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
              >
                🚀 Comienza tu segunda vida
              </button>
            </form>
          )}

          {player.second_career && (
            <Link
              href="/carrera"
              className="gold-fill mt-4 inline-block rounded-full px-6 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
            >
              📚 Ver mi legado en carrera
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
