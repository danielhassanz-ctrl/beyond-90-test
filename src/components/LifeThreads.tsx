import { openThreads, THREAD_LABELS as OPEN_THREAD_LABELS } from "@/lib/narrative/threads";

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
  // Solo se muestran los hilos pensados para el jugador. El resto de flags
  // (hilo_* de memoria para la IA, títulos, especialidad de agente...) son
  // contexto interno, no algo que deba salir en esta tarjeta.
  const entries = Object.entries(flags ?? {}).filter(
    ([key, v]) => v && key in THREAD_LABELS,
  );

  const pending = openThreads(flags);

  return (
    <>
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
              {THREAD_LABELS[key](value)}
            </span>
          ))}
        </div>
      )}
    </div>
    {pending.length > 0 && (
      <div className="mt-3 rounded-lg border border-panel-border bg-panel p-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-neutral-400">Asuntos pendientes</p>
        <ul className="space-y-2">
          {pending.map((t) => (
            <li key={`${t.k}-${t.who}`} className="text-xs text-neutral-200">
              <span className="font-semibold text-gold">{OPEN_THREAD_LABELS[t.k]}</span> · {t.who}
              <span className="block text-neutral-400">{t.t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-neutral-500">Tarde o temprano, alguien volverá a por esto.</p>
      </div>
    )}
    </>
  );
}
