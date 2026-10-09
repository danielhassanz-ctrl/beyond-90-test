import Image from "next/image";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import type { SeasonStats } from "@/lib/player/update-stats";
import { ClubCrest } from "@/components/ClubCrest";

/**
 * Tarjeta compartible del cierre de temporada — pedido explícito del
 * usuario, con una captura de referencia de estilo "carta de cromo" (foto
 * dramática a sangre + media grande + stats reales encima, no una tarjeta
 * de texto plano). Rediseñada para seguir el mismo lenguaje visual que
 * PlayerCard (hitos sin imagen propia) en vez de ser una carta de stats
 * aparte sin foto — antes esta tarjeta no llevaba ninguna foto del
 * jugador, solo números.
 *
 * La foto es la foto resumen propia del cierre (flags.recap_photo, generada
 * en la primera temporada y renovada cada 4); si todavía no existe, la de
 * perfil. Mientras se genera (`pending`) se enseña un "revelando…" en vez
 * de la foto de perfil.
 */
export function SeasonRecapCard({
  player,
  seasonLabel,
  age,
  stats,
  tagline,
  linkLine,
  photoUrl: photoOverride,
  pending,
}: {
  player: Player;
  seasonLabel: string;
  age: number;
  stats: SeasonStats;
  /** Frase gancho tipo "esta es mi carrera, ¿cuál es la tuya?" — ver lib/shareTaglines.ts. */
  tagline?: string;
  /** URL del juego sin protocolo (ver lib/constants.ts getAppUrl). */
  linkLine?: string | null;
  /** Foto resumen del cierre (flags.recap_photo). */
  photoUrl?: string | null;
  /** Se está generando la foto resumen. */
  pending?: boolean;
}) {
  const photoUrl = pending ? null : (photoOverride ?? player.current_photo_url ?? player.photo_url);
  const statEntries: [string, number][] = [
    ["Partidos", stats.matches_played],
    ["Goles", stats.goals],
    ["Asistencias", stats.assists],
  ];

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 border-amber-400/80 bg-neutral-900 shadow-[0_0_50px_-10px_rgba(245,183,64,0.35)]">
      {photoUrl ? (
        <Image src={photoUrl} alt={displayName(player)} fill className="object-cover object-top" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <ClubCrest club={player.club} size={140} />
        </div>
      )}
      {pending && (
        <div className="absolute inset-x-0 top-1/3 flex flex-col items-center gap-2 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">Revelando tu foto de temporada…</p>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-4 pt-4">
        <span className="whitespace-nowrap rounded-full border border-amber-400/60 bg-black/50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-300 backdrop-blur">
          Temporada {seasonLabel} cerrada
        </span>
        <span className="shrink-0 drop-shadow-md">
          <ClubCrest club={player.club} size={28} />
        </span>
      </div>

      <div className="absolute left-4 top-16 flex flex-col items-start leading-none">
        <div className="flex items-baseline gap-1 rounded-lg bg-amber-400 px-2.5 py-1 text-neutral-950">
          <span className="text-[9px] font-bold uppercase">Media</span>
          <span className="text-3xl font-black">{player.media}</span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 space-y-3 p-5">
        {statEntries.some(([, v]) => v > 0) && (
          <div className="grid grid-cols-3 gap-2">
            {statEntries.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-amber-500/30 bg-black/50 px-2 py-2 text-center backdrop-blur">
                <p className="text-lg font-black text-white">{value}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-200/80">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="text-center">
          <p className="text-2xl font-black uppercase tracking-wide text-white drop-shadow-lg">{displayName(player)}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/90">
            {player.club} · {age} años
          </p>
        </div>

        {(tagline || linkLine) && (
          <div className="border-t border-white/10 pt-2 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-300">Beyond 90</p>
            {tagline && <p className="text-[10px] text-neutral-300">{tagline}</p>}
            {linkLine && <p className="text-[10px] font-semibold text-amber-200/90">{linkLine}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
