function barColor(value: number) {
  if (value >= 66) return "bg-emerald-500";
  if (value >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function StatBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-400">
        <span>{label}</span>
        <span className="font-semibold text-neutral-200">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full rounded-full ${barColor(pct)} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
