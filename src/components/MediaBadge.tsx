function mediaColor(value: number) {
  if (value >= 80) return "text-emerald-400 border-emerald-400/60";
  if (value >= 60) return "text-gold border-gold/60";
  if (value >= 45) return "text-amber-400 border-amber-400/60";
  return "text-red-400 border-red-400/60";
}

/** Insignia circular con la media futbolística (estilo videojuego de fútbol), visible siempre junto al nombre del jugador. */
export function MediaBadge({ value }: { value: number }) {
  return (
    <div
      className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 bg-panel leading-none ${mediaColor(value)}`}
      title="Media futbolística"
    >
      <span className="text-lg font-black">{value}</span>
      <span className="text-[8px] font-bold uppercase tracking-wide">Media</span>
    </div>
  );
}
