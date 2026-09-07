import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { withShareLink } from "@/lib/constants";
import { ShareButton } from "@/components/ShareButton";
import { CONSEQUENCE_LABELS } from "@/types/career";

const CATEGORY_EMOJI: Record<string, string> = {
  entrenamiento: "💪",
  partido: "⚽",
  vestuario: "👥",
  representante: "💼",
  prensa: "📰",
  vida: "🏠",
  especial: "✨",
  segunda_vida: "🎬",
};

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

  // Parsear consecuencias para mostrar visualmente
  const consequences = careerEvent.consequences || {};
  const consequencesList = Object.entries(consequences)
    .filter(([_, value]) => typeof value === "number" && value !== 0)
    .sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number))
    .slice(0, 4);

  const categoryEmoji = CATEGORY_EMOJI[careerEvent.category] || "🎮";

  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-4xl">{categoryEmoji}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
            {careerEvent.category === "entrenamiento"
              ? "Entrenamiento"
              : careerEvent.category === "partido"
                ? "Partido"
                : careerEvent.category === "vestuario"
                  ? "Vestuario"
                  : careerEvent.category === "representante"
                    ? "Representante"
                    : careerEvent.category === "prensa"
                      ? "Prensa"
                      : careerEvent.category === "vida"
                        ? "Vida Personal"
                        : "Momento Especial"}
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            {careerEvent.title}
          </h1>
        </div>

        {/* Contenedor visual principal */}
        <div className="rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 md:p-8">
          {/* Descripción del evento */}
          <div className="space-y-4">
            <p className="text-sm text-neutral-400 leading-relaxed">
              {careerEvent.description}
            </p>

            {/* Resultado/Outcome */}
            {careerEvent.outcome_text && (
              <div className="rounded-lg bg-neutral-950/60 border border-amber-500/10 p-4">
                <p className="text-lg font-bold text-amber-100 leading-relaxed italic">
                  "{careerEvent.outcome_text}"
                </p>
              </div>
            )}

            {/* Opción elegida */}
            {careerEvent.chosen_option_label && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Tu decisión
                </p>
                <div className="rounded-lg border border-neutral-700 bg-neutral-950/40 px-4 py-2">
                  <p className="text-sm font-medium text-neutral-200">
                    {careerEvent.chosen_option_label}
                  </p>
                </div>
              </div>
            )}

            {/* Respuesta libre si la hay */}
            {careerEvent.free_text_response && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Tu respuesta
                </p>
                <div className="rounded-lg border border-neutral-700 bg-neutral-950/40 px-4 py-2">
                  <p className="text-sm text-neutral-300 italic">
                    "{careerEvent.free_text_response}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Consecuencias visuales */}
        {consequencesList.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Consecuencias
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {consequencesList.map(([key, value]) => {
                const isPositive = (value as number) > 0;
                return (
                  <div
                    key={key}
                    className={`rounded-lg px-3 py-2 text-center border ${
                      isPositive
                        ? "bg-green-500/10 border-green-500/30 text-green-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    <p className="text-2xl font-black">
                      {isPositive ? "+" : ""}{value as number}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide font-semibold mt-1">
                      {CONSEQUENCE_LABELS[key as keyof typeof CONSEQUENCE_LABELS] || key}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="space-y-3">
          <ShareButton title="Beyond 90" text={shareText} />
          <Link
            href={continueHref}
            className="block w-full rounded-lg bg-neutral-800 px-6 py-3 text-center font-semibold text-amber-400 hover:bg-neutral-700 transition-colors text-sm uppercase tracking-wide border border-neutral-700 hover:border-amber-500/50"
          >
            Continuar
          </Link>
        </div>
      </div>
    </main>
  );
}
