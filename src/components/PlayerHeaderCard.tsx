import Image from "next/image";

/**
 * Cabecera compacta del jugador — calcada estructuralmente del prototipo
 * de referencia que pidió replicar el usuario: avatar + nombre a la
 * izquierda, Media/Forma grandes a la derecha, y debajo las 4 barras de
 * relación (Entrenador/Afición en un color, Vestuario/Representante
 * alternando), con las mismas clases de tipografía (font-display,
 * font-cond, text-kicker) y el mismo relleno degradado (gold-fill /
 * pitch-fill) en vez de un color plano.
 */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Bar({ label, value, fill }: { label: string; value: number; fill: "gold-fill" | "pitch-fill" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-kicker truncate text-[0.6rem]">{label}</span>
        <span className="font-num text-sm font-semibold text-foreground/90">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full transition-all duration-700 ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function PlayerHeaderCard({
  photoUrl,
  name,
  age,
  club,
  categoryLabel,
  statusLine,
  media,
  forma,
  relEntrenador,
  relAficion,
  relVestuario,
  relRepresentante,
}: {
  photoUrl?: string | null;
  name: string;
  age: number;
  club: string;
  categoryLabel: string;
  statusLine: string;
  media: number;
  forma: number;
  // null cuando el jugador todavía no tiene a quién referirse (sin club
  // todavía no hay entrenador/afición/vestuario reales; sin representante
  // todavía no hay relación con nadie que negocie por ti) — antes se
  // pasaban siempre los números por defecto (50) y la barra salía llena
  // como si esa relación ya existiera, aunque el jugador acabara de
  // crearse sin haber firmado con nadie todavía.
  relEntrenador: number | null;
  relAficion: number | null;
  relVestuario: number | null;
  relRepresentante: number | null;
}) {
  const bars = [
    { label: "Entrenador", value: relEntrenador, fill: "gold-fill" as const },
    { label: "Afición", value: relAficion, fill: "pitch-fill" as const },
    { label: "Vestuario", value: relVestuario, fill: "pitch-fill" as const },
    { label: "Representante", value: relRepresentante, fill: "gold-fill" as const },
  ].filter((b): b is { label: string; value: number; fill: "gold-fill" | "pitch-fill" } => b.value !== null);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-gold/40 bg-surface-2">
            {photoUrl ? (
              <Image src={photoUrl} alt={name} width={96} height={96} className="h-full w-full object-cover" />
            ) : (
              <span className="font-cond text-2xl font-bold text-gold">{initialsOf(name)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base leading-tight">{name}</p>
            <p className="truncate font-cond text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {age} años · {club} · {categoryLabel}
            </p>
            <p className="truncate font-cond text-xs uppercase tracking-[0.16em] text-gold-soft">{statusLine}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-kicker">Media</p>
          <p className="gold-text font-display text-4xl leading-none">{media}</p>
          <p className="text-kicker mt-1">Forma</p>
          <p className="font-num text-lg font-semibold leading-none text-accent">{forma}</p>
        </div>
      </div>
      {bars.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {bars.map((b) => (
            <Bar key={b.label} label={b.label} value={b.value} fill={b.fill} />
          ))}
        </div>
      )}
    </div>
  );
}
