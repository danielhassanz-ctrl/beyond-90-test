function barColor(value: number) {
  if (value >= 66) return { bg: "bg-emerald-500", glow: "shadow-lg shadow-emerald-500/50" };
  if (value >= 40) return { bg: "bg-amber-500", glow: "shadow-lg shadow-amber-500/50" };
  return { bg: "bg-red-500", glow: "shadow-lg shadow-red-500/50" };
}

function getStatEmoji(label: string): string {
  const emojiMap: Record<string, string> = {
    Forma: "💪",
    Moral: "🧠",
    Fama: "⭐",
    Entrenador: "👨‍🏫",
    Afición: "👥",
    Vestuario: "👕",
    Representante: "🤝",
  };
  return emojiMap[label] || "📊";
}

export function StatBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colorInfo = barColor(pct);
  const emoji = getStatEmoji(label);
  const isCritical = pct < 25;
  const isGood = pct >= 66;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm">{emoji}</span>
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-300">
            {label}
          </span>
        </div>
        <span className={`text-sm font-black tabular-nums ${
          isGood ? "text-emerald-300" : isCritical ? "text-red-300" : "text-amber-300"
        }`}>
          {value}
        </span>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-900 border border-neutral-800">
        <div
          className={`h-full rounded-full ${colorInfo.bg} transition-all duration-500 ease-out relative ${colorInfo.glow}`}
          style={{
            width: `${pct}%`,
          }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 opacity-60 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
        </div>
        {/* Background indicator */}
        <div
          className="absolute top-0 h-full border-r border-neutral-700/50"
          style={{ left: "33.33%" }}
        />
        <div
          className="absolute top-0 h-full border-r border-neutral-700/50"
          style={{ left: "66.66%" }}
        />
      </div>
    </div>
  );
}
