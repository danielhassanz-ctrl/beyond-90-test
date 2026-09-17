import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { CONSEQUENCE_LABELS } from "@/types/career";
import { ClubCrest } from "@/components/ClubCrest";

/**
 * Tarjeta compartible del cierre de temporada — mismo estilo de "carta de
 * stats" que CareerStatCard (colores planos, sin variables CSS/oklch) a
 * propósito: html-to-image captura este nodo para generar el PNG, y esa
 * ruta de exportación no está probada con los tokens del rediseño nuevo.
 */
export function SeasonRecapCard({
  player,
  seasonLabel,
  age,
  consequences,
  tagline,
  linkLine,
}: {
  player: Player;
  seasonLabel: string;
  age: number;
  consequences: [string, number][];
  /** Frase gancho tipo "esta es mi carrera, ¿cuál es la tuya?" — ver lib/shareTaglines.ts. */
  tagline?: string;
  /** URL del juego sin protocolo (ver lib/constants.ts getAppUrl). */
  linkLine?: string | null;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-900/20 via-neutral-900 to-black p-5 shadow-[0_0_50px_-10px_rgba(245,183,64,0.35)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Fin de temporada</p>
          <p className="text-xl font-black text-white">Temporada {seasonLabel} cerrada</p>
        </div>
        <ClubCrest club={player.club} size={40} />
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-amber-500/20 pt-4">
        <div className="flex flex-col items-center justify-center rounded-lg bg-amber-400 px-3 py-1.5 leading-none text-neutral-950">
          <span className="text-[9px] font-bold uppercase">Media</span>
          <span className="text-2xl font-black">{player.media}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{displayName(player)}</p>
          <p className="truncate text-xs text-neutral-400">
            {player.club} · {age} años
          </p>
        </div>
      </div>

      {consequences.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {consequences.map(([key, value]) => {
            const isPositive = value > 0;
            return (
              <div
                key={key}
                className={`rounded-lg border px-3 py-2 text-center ${
                  isPositive
                    ? "border-green-500/30 bg-green-500/10 text-green-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                <p className="text-lg font-black">
                  {isPositive ? "+" : ""}
                  {value}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wide">
                  {CONSEQUENCE_LABELS[key as keyof typeof CONSEQUENCE_LABELS] || key}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-amber-500/20 pt-3 text-[10px] text-neutral-500">
        <span>Beyond 90</span>
        <span className="font-semibold uppercase text-amber-300">Nueva temporada</span>
      </div>
      {(tagline || linkLine) && (
        <div className="mt-2 text-center">
          {tagline && <p className="text-[10px] text-neutral-300">{tagline}</p>}
          {linkLine && <p className="text-[10px] font-semibold text-amber-200/90">{linkLine}</p>}
        </div>
      )}
    </div>
  );
}
