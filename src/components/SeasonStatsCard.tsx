import Image from "next/image";
import type { SeasonStats } from "@/lib/player/update-stats";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-panel-border bg-surface-2 p-3 text-center">
      <p className="font-num text-xl font-bold text-gold">{value}</p>
      <p className="text-kicker mt-0.5 text-[9px]">{label}</p>
    </div>
  );
}

export function SeasonStatsCard({
  photoUrl,
  name,
  seasonLabel,
  stats,
}: {
  photoUrl: string | null;
  name: string;
  seasonLabel: string;
  stats: SeasonStats;
}) {
  return (
    <div className="rounded-2xl border border-panel-border bg-surface p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gold/40 bg-surface-2">
          {photoUrl && (
            <Image src={photoUrl} alt={name} width={56} height={56} className="h-full w-full object-cover" unoptimized />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base text-foreground">{name}</p>
          <p className="text-kicker text-muted-foreground">{seasonLabel}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Partidos" value={stats.matches_played} />
        <Stat label="Goles" value={stats.goals} />
        <Stat label="Asistencias" value={stats.assists} />
        <Stat label="Minutos" value={stats.minutes_played} />
        <Stat label="Amarillas" value={stats.yellow_cards} />
        <Stat label="Rojas" value={stats.red_cards} />
      </div>
    </div>
  );
}
