import type { Player } from "@/types/player";
import { computeCareerStats } from "@/lib/careerStats";

const POSITION_ABBR: Record<string, string> = {
  Portero: "POR",
  Defensa: "DEF",
  Centrocampista: "CEN",
  Delantero: "DEL",
};

const TITLE_ICONS: Record<string, string> = {
  Liga: "🏆",
  "Champions League": "🏆",
  "Balón de Oro": "🥇",
};

const NATION_FLAGS: Record<string, string> = {
  España: "🇪🇸",
  Francia: "🇫🇷",
  Portugal: "🇵🇹",
  Italia: "🇮🇹",
  Alemania: "🇩🇪",
  Inglaterra: "🏴",
  Brasil: "🇧🇷",
  Argentina: "🇦🇷",
  Marruecos: "🇲🇦",
  "Países Bajos": "🇳🇱",
};

function flagFor(nation: string): string {
  return NATION_FLAGS[nation] ?? "🌍";
}

function groupTitles(titles: string[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of titles) counts.set(t, (counts.get(t) ?? 0) + 1);
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}

/** Tarjeta-resumen de carrera al estilo "carta de stats" (OVR, valor, PJ/GLS/AST, títulos) para compartir de un vistazo. */
export function CareerStatCard({ player }: { player: Player }) {
  const stats = computeCareerStats(player);
  const grouped = groupTitles(stats.titles);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-900/20 via-neutral-900 to-black p-5 shadow-[0_0_50px_-10px_rgba(245,183,64,0.35)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-col items-center justify-center rounded-lg bg-amber-400 px-3 py-1.5 leading-none text-neutral-950">
          <span className="text-[9px] font-bold uppercase">OVR</span>
          <span className="text-2xl font-black">{stats.ovr}</span>
        </div>
        <span className="rounded-full border border-amber-400/50 bg-black/40 px-2.5 py-1.5 text-lg leading-none">
          {flagFor(player.nation)}
        </span>
        <span className="rounded-full border border-amber-400/50 bg-black/40 px-3 py-1.5 text-xs font-bold text-amber-200">
          Valor €{stats.valueM}M
        </span>
        <span className="rounded-full border border-amber-400/50 bg-black/40 px-3 py-1.5 text-xs font-bold text-amber-200">
          #{player.number}
        </span>
        <span className="rounded-full border border-amber-400/50 bg-black/40 px-3 py-1.5 text-xs font-bold text-amber-200">
          {POSITION_ABBR[player.position] ?? player.position}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-amber-500/20 bg-black/30 p-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">PJ</p>
          <p className="text-xl font-black text-white">{stats.games}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">GLS</p>
          <p className="text-xl font-black text-white">{stats.goals}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">AST</p>
          <p className="text-xl font-black text-white">{stats.assists}</p>
        </div>
      </div>

      <div className="mt-5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          Trayectoria
        </p>
        <p className="mt-2 text-sm font-bold uppercase tracking-wide text-amber-200">
          {player.club}
        </p>
      </div>

      {grouped.length > 0 && (
        <div className="mt-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            Títulos
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {grouped.map((t) => (
              <span key={t.name} className="relative text-2xl leading-none" title={t.name}>
                {TITLE_ICONS[t.name] ?? "🏆"}
                {t.count > 1 && (
                  <span className="absolute -bottom-1.5 -right-2 rounded-full bg-amber-400 px-1 text-[9px] font-bold text-neutral-950">
                    x{t.count}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-amber-500/20 pt-3 text-[10px] text-neutral-500">
        <span>Beyond 90</span>
        <span className="font-semibold uppercase text-amber-300">{player.last_name}</span>
      </div>
    </div>
  );
}
