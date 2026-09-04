const THREAD_ICONS: Record<string, string> = {
  pareja: "❤️",
  convivencia: "🏠",
  hijos: "👶",
};

const THREAD_LABELS: Record<string, (value: string | boolean) => string> = {
  pareja: (v) => `En pareja con ${v}`,
  convivencia: () => "Viven juntos",
  hijos: (v) => (v === true ? "Tienen hijos" : `Familia: ${v}`),
};

export function LifeThreads({ flags }: { flags: Record<string, string | boolean> | null | undefined }) {
  const entries = Object.entries(flags ?? {}).filter(([, v]) => v);

  return (
    <div className="rounded-lg border border-panel-border bg-panel p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-neutral-400">Familia y pareja</p>
      {entries.length === 0 ? (
        <p className="text-xs text-neutral-600">
          Todavía no hay nada que contar aquí. Va a ir apareciendo con tus decisiones.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {entries.map(([key, value]) => (
            <span
              key={key}
              className="flex items-center gap-1.5 rounded-full border border-panel-border bg-neutral-950 px-3 py-1 text-xs text-neutral-200"
            >
              <span>{THREAD_ICONS[key] ?? "•"}</span>
              {THREAD_LABELS[key] ? THREAD_LABELS[key](value) : `${key}: ${value}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
