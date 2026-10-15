import type { Attribute } from "@/lib/narrative/attributes";

/** Los seis atributos del jugador con su barra; lo que ha ganado entrenando se marca con «+N». */
export function AttributeBars({ attrs, focus }: { attrs: Attribute[]; focus?: string | null }) {
  return (
    <div className="space-y-3 rounded-2xl border border-panel-border bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-kicker">Atributos</p>
        {focus && <p className="text-xs text-muted-foreground">Plan de esta temporada: {focus}</p>}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {attrs.map((a) => (
          <div key={a.key} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-kicker truncate">{a.label}</span>
              <span className="font-num text-sm font-semibold text-foreground/90">
                {a.value}
                {a.trained > 0 && <span className="ml-1 text-xs text-pitch">+{a.trained}</span>}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="pitch-fill h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, a.value))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
