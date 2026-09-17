import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { seasonLabel } from "@/types/career";
import { ClubCrest } from "@/components/ClubCrest";
import { BottomNav } from "@/components/BottomNav";

const SECOND_LIFE_MILESTONE_TYPES = new Set([
  "ascenso_entrenador", "canterano", "seleccion", "final_champions",
  "fichaje_agente", "puja_agente", "agencia", "cantera", "oferta_fondo",
  "fichaje_galactico", "titulo_presidente", "inversor", "cantera_propia",
  "autobiografia", "hall_fama", "balon_oro_cliente", "fondo_deportivo",
  "presidente_federacion",
]);

/**
 * Checklist de hitos de toda la carrera, inspirado en el "Legado" de un
 * prototipo de referencia que el usuario pidió replicar: le da al
 * jugador un mapa claro de qué queda por conseguir, no solo la lista de
 * lo que ya ha pasado. Cada `check` se apoya en datos que el juego ya
 * guarda (stats_*, flags, tipos de milestone) — no añade ningún tracking
 * nuevo.
 */
function buildAchievements(
  player: NonNullable<Awaited<ReturnType<typeof getCurrentUserAndPlayer>>["player"]>,
  milestoneTypes: Set<string>,
): { title: string; description: string; done: boolean }[] {
  return [
    { title: "Primer paso", description: "Empezar tu carrera en una cantera.", done: true },
    { title: "Con quien confiar", description: "Firmar con un representante.", done: Boolean(player.agent_name) },
    {
      title: "Debut profesional",
      description: "Jugar tu primer partido oficial.",
      done: (player.stats_matches_played ?? 0) > 0 || milestoneTypes.has("debut"),
    },
    {
      title: "El primero",
      description: "Marcar tu primer gol como profesional.",
      done: (player.stats_goals ?? 0) > 0,
    },
    { title: "Media 70", description: "Alcanzar una media de 70.", done: player.media >= 70 },
    {
      title: "Internacional",
      description: "Ser convocado por tu selección.",
      // Antes comprobaba también "debut_internacional", un valor que
      // nunca se guarda como milestoneType real (solo existe como clave
      // interna de imagen en MILESTONE_TYPE_TO_CONTEXT_TYPE) — y de paso,
      // por precedencia de operadores (&& liga más fuerte que ||), la
      // condición dependía de NO tener "presidente_federacion" (un logro
      // de segunda vida sin relación con haber sido internacional). El
      // logro real es "seleccion", el único milestoneType que de verdad
      // se guarda para la primera convocatoria.
      done: milestoneTypes.has("seleccion"),
    },
    { title: "Capitán", description: "Llevar el brazalete de tu equipo.", done: milestoneTypes.has("capitania") },
    {
      title: "Primer título",
      description: "Ganar tu primer título colectivo.",
      done: (player.stats_titles ?? 0) > 0,
    },
    {
      title: "Distinguido",
      description: "Ganar un premio individual.",
      done: milestoneTypes.has("premio") || milestoneTypes.has("balon_oro_cliente"),
    },
    { title: "Media 85", description: "Alcanzar una media de 85.", done: player.media >= 85 },
    {
      title: "Balón de Oro",
      description: "Ser reconocido como el mejor jugador del mundo.",
      done: Boolean(player.flags?.title_balon_oro),
    },
    {
      title: "Segunda vida",
      description: "Empezar una nueva etapa tras colgar las botas.",
      done: Boolean(player.second_career),
    },
    {
      title: "Fin del camino",
      description: "Retirarte del fútbol profesional.",
      done: player.status === "retired" || player.status === "second_life" || player.status === "awaiting_second_life",
    },
  ];
}

export default async function LegadoPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  if (!player) {
    redirect("/crear-jugador");
  }

  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false });

  const milestoneTypes = new Set((milestones ?? []).map((m) => m.type as string));
  const achievements = buildAchievements(player, milestoneTypes);
  const doneCount = achievements.filter((a) => a.done).length;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
      <div className="w-full max-w-md space-y-1">
        <Link href="/mi-jugador" className="font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">
          ‹ Mi jugador
        </Link>
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-2xl">
            <span className="gold-text">Legado</span>
          </h1>
          <span className="font-num text-xs font-semibold text-muted-foreground">
            {doneCount}/{achievements.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          El mapa de tu carrera: lo que ya has logrado y lo que todavía te queda.
        </p>
      </div>

      <div className="w-full max-w-md space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
        {achievements.map((a) => (
          <div key={a.title} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                a.done
                  ? "gold-fill border-transparent text-primary-foreground"
                  : "border-border text-muted-foreground/50"
              }`}
            >
              {a.done ? "✓" : ""}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${a.done ? "text-foreground" : "text-muted-foreground"}`}>{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md space-y-1">
        <p className="text-kicker">Tus momentos</p>
        <p className="text-xs text-muted-foreground">Cada hito desbloqueado, con su foto, listo para volver a compartir.</p>
      </div>

      {!milestones || milestones.length === 0 ? (
        <p className="pt-4 text-center text-sm text-muted-foreground">
          Todavía no tienes ningún momento destacado. Va a ir apareciendo con tus decisiones.
        </p>
      ) : (
        <div className="grid w-full max-w-md grid-cols-2 gap-3">
          {milestones.map((m) => (
            <Link
              key={m.id}
              href={`/carrera/hito/${m.id}`}
              className="group overflow-hidden rounded-2xl border border-panel-border bg-surface hover:border-gold/50"
            >
              <div className="relative aspect-square w-full bg-surface-2">
                {m.image_url ? (
                  <Image
                    src={m.image_url}
                    alt={m.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : player.photo_url ? (
                  // Sin foto de IA propia para este hito: mejor tu foto real
                  // de fondo que un cuadro casi vacío con solo un escudo
                  // pequeño en negro — antes era lo único que se veía aquí.
                  <>
                    <Image
                      src={player.photo_url}
                      alt={m.title}
                      fill
                      className="object-cover object-top transition group-hover:scale-105"
                    />
                    <div className="absolute right-1.5 top-1.5 drop-shadow-md">
                      <ClubCrest club={SECOND_LIFE_MILESTONE_TYPES.has(m.type) ? (player.second_club ?? player.club) : player.club} size={24} />
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ClubCrest club={SECOND_LIFE_MILESTONE_TYPES.has(m.type) ? (player.second_club ?? player.club) : player.club} size={40} />
                  </div>
                )}
              </div>
              <div className="space-y-0.5 p-2">
                <p className="line-clamp-2 text-xs font-semibold text-foreground">{m.title}</p>
                <p className="font-cond text-[10px] uppercase tracking-wide text-muted-foreground">
                  {SECOND_LIFE_MILESTONE_TYPES.has(m.type) ? `Semana ${m.week} de tu segunda vida` : `Temporada ${seasonLabel(m.week)}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BottomNav active="legado" />
    </main>
  );
}
