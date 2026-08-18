import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  tone?: "gold" | "pitch";
  compact?: boolean;
}

export function StatBar({ label, value, tone = "gold", compact = false }: Props) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("text-kicker truncate", compact && "text-[0.6rem]")}>{label}</span>
        <span className="font-num text-sm font-semibold text-foreground/90">{Math.round(value)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full transition-all duration-700", tone === "gold" ? "gold-fill" : "pitch-fill")}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
