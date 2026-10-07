import type { CompetitionStats, CompStat, SeasonHistoryRow } from "@/lib/player/competition-stats";

const CLUB_ROWS: { key: "liga" | "champions" | "europa" | "copa"; label: string; icon: string }[] = [
  { key: "liga", label: "LaLiga", icon: "🏆" },
  { key: "champions", label: "Champions League", icon: "⭐" },
  { key: "europa", label: "Europa League", icon: "🟠" },
  { key: "copa", label: "Copa del Rey", icon: "🥇" },
];

const TORNEO_ROWS: { key: "mundial" | "eurocopa" | "copa_america" | "otros"; label: string }[] = [
  { key: "mundial", label: "Mundial" },
  { key: "eurocopa", label: "Eurocopa" },
  { key: "copa_america", label: "Copa América" },
  { key: "otros", label: "Clasificatorios y otros" },
];

function Row({ label, icon, stat, sub = false }: { label: string; icon?: string; stat: CompStat; sub?: boolean }) {
  const dim = stat.matches === 0;
  return (
    <tr className={dim ? "text-muted-foreground/70" : "text-foreground/90"}>
      <td className={`py-2 pr-2 ${sub ? "pl-6 text-xs" : "pl-4"}`}>
        <span className="mr-1.5">{icon}</span>
        {label}
      </td>
      <td className="py-2 text-center font-num text-xs">{stat.matches}</td>
      <td className="py-2 text-center font-num text-xs">{stat.goals}</td>
      <td className="py-2 text-center font-num text-xs">{stat.assists}</td>
      <td className="py-2 pr-4 text-right font-num text-xs">{stat.minutes}</td>
    </tr>
  );
}

function Table({ title, stats }: { title: string; stats: CompetitionStats }) {
  const totalMatches = CLUB_ROWS.reduce((n, r) => n + stats[r.key].matches, 0) + stats.seleccion.matches;
  const showTorneos = stats.seleccion.matches > 0;
  return (
    <div className="overflow-hidden rounded-2xl border border-panel-border bg-surface">
      <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
        <p className="text-kicker text-gold">{title}</p>
        <p className="text-kicker text-muted-foreground">{totalMatches} partidos jugados</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-kicker text-muted-foreground">
            <th className="py-2 pl-4 text-left">Competición</th>
            <th className="w-9 py-2 text-center text-[10px]">PJ</th>
            <th className="w-9 py-2 text-center text-[10px]">G</th>
            <th className="w-9 py-2 text-center text-[10px]">A</th>
            <th className="w-14 py-2 pr-4 text-right text-[10px]">Min</th>
          </tr>
        </thead>
        <tbody>
          {CLUB_ROWS.map((r) => (
            <Row key={r.key} label={r.label} icon={r.icon} stat={stats[r.key]} />
          ))}
          <Row label="Selección" icon="🌍" stat={stats.seleccion} />
          {showTorneos &&
            TORNEO_ROWS.filter((t) => stats.torneos[t.key].matches > 0).map((t) => (
              <Row key={t.key} label={t.label} stat={stats.torneos[t.key]} sub />
            ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "season": lo de esta temporada (va en Clasificación). "career": todo lo de la
 * carrera por competición (va en Trayectoria, junto al palmarés y el camino equipo a equipo).
 */
export function CompetitionStatsCard({
  season,
  career,
  seasonLabel,
  view = "season",
}: {
  season: CompetitionStats;
  career: CompetitionStats;
  seasonLabel: string;
  view?: "season" | "career";
  history?: SeasonHistoryRow[];
}) {
  return (
    <div className="space-y-4">
      {view === "season" ? <Table title={`Esta temporada · ${seasonLabel}`} stats={season} /> : <Table title="Toda la carrera, por competición" stats={career} />}
      <p className="text-center text-[11px] text-muted-foreground">
        Suman todos tus partidos: los que juegas como escena y los que se disputan entre medias, estimados según tu rol, tu posición y tu nivel.
        {view === "season" ? " La clasificación de abajo es la del equipo entero (todas las jornadas), así que ahí salen más partidos que a ti." : ""}
      </p>
    </div>
  );
}
