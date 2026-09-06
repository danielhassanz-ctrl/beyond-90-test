function mediaColor(value: number) {
  if (value >= 80) return {
    text: "text-emerald-300",
    border: "border-emerald-400/80",
    bg: "from-emerald-500/10 to-emerald-600/10",
    glow: "shadow-lg shadow-emerald-500/40",
  };
  if (value >= 60) return {
    text: "text-gold",
    border: "border-gold/80",
    bg: "from-amber-500/10 to-amber-600/10",
    glow: "shadow-lg shadow-amber-500/40",
  };
  if (value >= 45) return {
    text: "text-amber-300",
    border: "border-amber-400/80",
    bg: "from-amber-500/5 to-orange-600/5",
    glow: "shadow-lg shadow-amber-500/30",
  };
  return {
    text: "text-red-300",
    border: "border-red-400/80",
    bg: "from-red-500/5 to-red-600/5",
    glow: "shadow-lg shadow-red-500/20",
  };
}

/**
 * Insignia circular con la media futbolística (estilo FIFA/FUT), visible siempre
 * junto al nombre del jugador. Con mejor visual, glow effects, y retroalimentación.
 */
export function MediaBadge({ value }: { value: number }) {
  const colors = mediaColor(value);
  const rating = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 leading-none transition-all duration-300 ${colors.border} ${colors.glow}`}
      style={{
        background: `conic-gradient(${colors.border.replace("border-", "").replace("/80", "")} ${rating}%, transparent 0)`,
      }}
      title={`Media futbolística: ${value}/100`}
    >
      {/* Fondo interno */}
      <div className={`absolute inset-1 rounded-full bg-gradient-to-br ${colors.bg} border border-neutral-700/50`} />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center justify-center leading-tight">
        <span className={`text-xl font-black ${colors.text} drop-shadow-md`}>
          {value}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-300 mt-0.5">
          Media
        </span>
      </div>

      {/* Ícono decorativo */}
      <div className="absolute -top-1 -right-1 text-xs">
        {value >= 80 ? "⭐" : value >= 60 ? "✨" : "💫"}
      </div>
    </div>
  );
}
