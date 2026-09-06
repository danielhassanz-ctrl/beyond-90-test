import { ClubCrest } from "./ClubCrest";
import { getClubColors } from "@/lib/clubColors";

/**
 * Cabecera tipo marcador para eventos de partido: escudo propio vs escudo rival.
 * Mejorado con: efectos visuales dinámicos, colores del club, mejor composición.
 */
export function MatchScene({
  club,
  rivalClub,
  titles = 0,
}: {
  club: string;
  rivalClub: string;
  titles?: number;
}) {
  const clubColors = getClubColors(club);
  const rivalColors = getClubColors(rivalClub);

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/20 shadow-lg">
      {/* Fondo degradado con colores de ambos equipos */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${clubColors.primary}33, ${clubColors.secondary}22, ${rivalColors.secondary}22, ${rivalColors.primary}33)`,
        }}
      />

      {/* Contenedor principal */}
      <div className="relative flex items-center justify-between gap-2 px-4 py-5 sm:gap-4">
        {/* Equipo local */}
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <div className="relative">
            <div
              className="absolute inset-0 blur-xl opacity-30 rounded-full"
              style={{ background: clubColors.primary }}
            />
            <div className="relative">
              <ClubCrest club={club} size={52} titles={titles} />
            </div>
          </div>
          <div className="min-w-0">
            <span className="block max-w-[7rem] truncate text-xs font-bold uppercase tracking-widest text-white drop-shadow-sm">
              {club}
            </span>
            {titles > 0 && (
              <span className="text-[10px] text-amber-300 font-semibold">
                {titles} título{titles !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Separador VS */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 border-l border-r border-amber-500/50" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-amber-300 drop-shadow-md">
            VS
          </span>
          <div className="h-8 border-l border-r border-amber-500/50" />
        </div>

        {/* Equipo rival */}
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <div className="relative">
            <div
              className="absolute inset-0 blur-xl opacity-30 rounded-full"
              style={{ background: rivalColors.primary }}
            />
            <div className="relative">
              <ClubCrest club={rivalClub} size={52} />
            </div>
          </div>
          <div className="min-w-0">
            <span className="block max-w-[7rem] truncate text-xs font-bold uppercase tracking-widest text-white drop-shadow-sm">
              {rivalClub}
            </span>
            <span className="text-[10px] text-neutral-400 font-semibold">Rival</span>
          </div>
        </div>
      </div>

      {/* Decoración inferior */}
      <div className="h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
    </div>
  );
}
