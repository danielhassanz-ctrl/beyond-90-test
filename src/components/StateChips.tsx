import { activeStates } from "@/lib/narrative/states";

/** Complicaciones y rachas en curso (ver states.ts): lo que está afectando a tu rendimiento ahora mismo. */
export function StateChips({ flags, week, detailed = false }: { flags: Record<string, string | boolean> | null | undefined; week: number; detailed?: boolean }) {
  const list = activeStates(flags, week);
  if (list.length === 0) return null;
  return (
    <div className={detailed ? "space-y-2" : "flex flex-wrap gap-2"}>
      {list.map(({ def, until }) => {
        const left = Math.max(1, until - week + 1);
        const tone = def.tone === "bad" ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-pitch/50 bg-pitch/10 text-pitch";
        return detailed ? (
          <div key={def.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${tone}`}>
            <span className="text-xl">{def.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {def.label} <span className="font-normal opacity-80">· {left} {left === 1 ? "mes" : "meses"}</span>
              </p>
              <p className="text-xs opacity-80">{def.hint}</p>
            </div>
          </div>
        ) : (
          <span key={def.id} className={`font-cond rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
            {def.icon} {def.label}
          </span>
        );
      })}
    </div>
  );
}
