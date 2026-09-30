import type { TableStandings, KnockoutStandings } from "@/lib/narrative/standings";
import { ClubCrest } from "@/components/ClubCrest";

export function StandingsTable({ standings }: { standings: TableStandings }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-panel-border bg-surface">
      <div className="border-b border-panel-border px-4 py-3">
        <p className="text-kicker text-gold">{standings.label}</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-kicker text-muted-foreground">
            <th className="w-8 py-2 pl-4 text-left">#</th>
            <th className="py-2 text-left">Equipo</th>
            <th className="w-10 py-2 text-center">PJ</th>
            <th className="w-10 py-2 pr-4 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.rows.map((row, i) => (
            <tr
              key={row.club}
              className={row.isPlayer ? "bg-gold/10 font-bold text-gold" : "text-foreground/90"}
            >
              <td className="py-2 pl-4 font-num">{i + 1}</td>
              <td className="py-2 pr-2">
                <div className="flex items-center gap-2">
                  <ClubCrest club={row.club} size={20} />
                  <span className="truncate">{row.club}</span>
                </div>
              </td>
              <td className="py-2 text-center font-num">{row.played}</td>
              <td className="py-2 pr-4 text-right font-num">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KnockoutBox({ knockout }: { knockout: KnockoutStandings }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-panel-border bg-surface px-4 py-4">
      <div>
        <p className="text-kicker text-gold">{knockout.label}</p>
        <p className="mt-1 font-display text-lg text-foreground">{knockout.roundLabel}</p>
      </div>
      <span className="font-cond rounded-full border border-pitch/50 bg-pitch/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pitch">
        Sigues vivo
      </span>
    </div>
  );
}
