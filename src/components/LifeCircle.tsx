import Image from "next/image";

export interface LifeMember {
  key: string;
  name: string;
  label: string;
  detail?: string;
  /** Relación numérica 0-100, si el juego la lleva. */
  value?: number;
  face?: string | null;
}

function Avatar({ name, face }: { name: string; face?: string | null }) {
  if (face) {
    return (
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold/40 bg-surface-2">
        <Image src={face} alt={name} width={44} height={44} className="h-full w-full object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-panel-border bg-surface-2 font-display text-base text-gold-soft">
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
}

/** Un cajón desplegable de la pantalla Vida: familia, amigos y compañeros, o club y cuerpo técnico. */
export function LifeCircle({
  icon,
  title,
  subtitle,
  members,
  empty,
  defaultOpen = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  members: LifeMember[];
  empty?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group w-full max-w-md rounded-2xl border border-panel-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <span className="text-2xl">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base text-foreground">{title}</span>
          <span className="block text-xs text-muted-foreground">{subtitle}</span>
        </span>
        <span className="font-num text-xs font-semibold text-muted-foreground">{members.length}</span>
        <span className="text-muted-foreground transition group-open:rotate-90">›</span>
      </summary>
      <div className="space-y-3 border-t border-panel-border/60 p-4">
        {members.length === 0 && <p className="text-xs text-muted-foreground">{empty ?? "Todavía no hay nadie aquí."}</p>}
        {members.map((m) => (
          <div key={m.key} className="flex items-center gap-3">
            <Avatar name={m.name} face={m.face} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
              <p className="font-cond text-[10px] uppercase tracking-wide text-gold-soft">{m.label}</p>
              {m.detail && <p className="text-xs text-muted-foreground">{m.detail}</p>}
              {typeof m.value === "number" && (
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="pitch-fill h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, m.value))}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
