import { ClubCrest } from "./ClubCrest";

/** Cabecera tipo marcador para eventos de partido: escudo propio vs escudo rival. */
export function MatchScene({
  club,
  rivalClub,
  titles = 0,
}: {
  club: string;
  rivalClub: string;
  titles?: number;
}) {
  return (
    <div className="flex items-center justify-center gap-4 rounded-lg border border-panel-border bg-panel py-4">
      <div className="flex flex-col items-center gap-1">
        <ClubCrest club={club} size={44} titles={titles} />
        <span className="max-w-[6rem] truncate text-center text-xs font-medium text-neutral-300">
          {club}
        </span>
      </div>
      <span className="text-sm font-black uppercase tracking-widest text-neutral-500">vs</span>
      <div className="flex flex-col items-center gap-1">
        <ClubCrest club={rivalClub} size={44} />
        <span className="max-w-[6rem] truncate text-center text-xs font-medium text-neutral-300">
          {rivalClub}
        </span>
      </div>
    </div>
  );
}
