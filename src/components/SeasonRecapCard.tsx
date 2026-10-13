import Image from "next/image";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import type { SeasonStats } from "@/lib/player/update-stats";
import { ClubCrest } from "@/components/ClubCrest";

/**
 * Tarjeta compartible del cierre de temporada, como la «Tarjeta compartible B90» del diseño de referencia: la foto de
 * acción a sangre, el nombre y la MEDIA enormes a la izquierda con la posición, la nacionalidad y la edad, y abajo una
 * fila con el valor de mercado, el patrimonio, la temporada y el club, más las cifras de la temporada que se cierra.
 *
 * La foto es la foto resumen propia del cierre (flags.recap_photo); si todavía no existe, la de referencia del jugador
 * (nunca la de cabecera, que sigue al último hito). Mientras se genera (`pending`) se enseña un "revelando…".
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
  marketValue,
  netWorth,
  titles = 0,
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
  /** Valor de mercado y patrimonio ya formateados ("44 M€", "6.351.000 €"). */
  marketValue?: string;
  netWorth?: string;
  /** Títulos de equipo ganados en la temporada que se cierra. */
  titles?: number;
}) {
  const photoUrl = pending ? null : (photoOverride ?? player.photo_url);
  const hasSeason = stats.matches_played > 0 || stats.goals > 0 || stats.assists > 0;
  const seasonEntries: [string, string | number][] = [
    ["Partidos", stats.matches_played],
    ["Goles", stats.goals],
    ["Asist.", stats.assists],
    ["Títulos", titles],
    ["Minutos", stats.minutes_played.toLocaleString("es")],
  ];
  const infoEntries: { label: string; value: string }[] = [
    ...(marketValue ? [{ label: "Valor de mercado", value: marketValue }] : []),
    ...(netWorth ? [{ label: "Patrimonio", value: netWorth }] : []),
    { label: "Temporada", value: seasonLabel },
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
      {/* Degradados: oscuro a la izquierda (nombre y media) y abajo (cifras), la cara libre a la derecha */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

      {/* Cabecera */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 px-4 pt-4">
        <div className="leading-tight">
          <p className="text-[15px] font-black uppercase tracking-[0.18em] text-amber-300 drop-shadow">Beyond 90</p>
          <p className="text-[8px] font-bold uppercase tracking-widest text-amber-200/80">Temporada {seasonLabel} cerrada</p>
        </div>
        <span className="shrink-0 drop-shadow-md">
          <ClubCrest club={player.club} size={30} />
        </span>
      </div>

      {/* Nombre y media enormes, a la izquierda */}
      <div className="absolute left-4 top-[17%] max-w-[62%]">
        <p className="text-[26px] font-black uppercase leading-[1.02] tracking-wide text-white drop-shadow-lg">{displayName(player)}</p>
        <div className="mt-1 flex items-end gap-1.5 leading-none">
          <span className="text-[68px] font-black leading-[0.85] text-amber-400 drop-shadow-lg">{player.media}</span>
          <span className="pb-1 text-[11px] font-bold uppercase tracking-widest text-amber-200/70">Media</span>
        </div>
        <p className="mt-2 text-[12px] font-bold uppercase tracking-wide text-white/90">{player.position}</p>
        <p className="text-[11px] uppercase tracking-wide text-white/70">
          {player.nation ? `${player.nation} · ` : ""}
          {age} años
        </p>
      </div>

      {/* Cifras */}
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${infoEntries.length + 1}, minmax(0, 1fr))` }}>
          {infoEntries.map((e) => (
            <div key={e.label} className="rounded-lg border border-amber-500/30 bg-black/55 px-1.5 py-2 text-center backdrop-blur">
              <p className="truncate text-[12px] font-black text-white">{e.value}</p>
              <p className="text-[7.5px] font-semibold uppercase tracking-wide text-amber-200/80">{e.label}</p>
            </div>
          ))}
          <div className="flex flex-col items-center justify-center rounded-lg border border-amber-500/30 bg-black/55 px-1.5 py-1.5 backdrop-blur">
            <ClubCrest club={player.club} size={20} />
            <p className="mt-0.5 max-w-full truncate text-[7.5px] font-semibold uppercase tracking-wide text-amber-200/80">{player.club}</p>
          </div>
        </div>

        {hasSeason && (
          <div className="grid grid-cols-5 gap-1.5">
            {seasonEntries.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-black/50 px-1 py-1.5 text-center backdrop-blur">
                <p className="text-[14px] font-black text-white">{value}</p>
                <p className="text-[7.5px] font-semibold uppercase tracking-wide text-amber-200/80">{label}</p>
              </div>
            ))}
          </div>
        )}

        {(tagline || linkLine) && (
          <div className="border-t border-white/10 pt-1.5 text-center">
            {tagline && <p className="text-[10px] text-neutral-300">{tagline}</p>}
            {linkLine && <p className="text-[10px] font-semibold text-amber-200/90">{linkLine}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
