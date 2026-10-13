import { requestFromClub } from "@/app/carrera/club/actions";
import type { ClubRequestKind } from "@/lib/narrative/club-requests";

export interface ClubRequestItem {
  kind: ClubRequestKind;
  label: string;
  icon: string;
  hint: string;
  available: boolean;
  reason?: string;
}

/** «Hablar con el club»: los movimientos que puedes hacer tú, siempre a mano (plegado para no ocupar la pantalla). */
export function ClubRequests({ items }: { items: ClubRequestItem[] }) {
  return (
    <details className="group rounded-2xl border border-panel-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
        <span className="text-kicker">🤝 Hablar con el club</span>
        <span className="font-cond text-xs uppercase tracking-wide text-gold group-open:hidden">Pedir algo ›</span>
      </summary>
      <div className="space-y-2 px-4 pb-4">
        <p className="text-xs text-muted-foreground">
          Tú también puedes mover ficha: el club lo valora y te contesta. A veces dice que sí, a veces que no y a veces que ahora no.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((it) => (
            <form key={it.kind} action={requestFromClub}>
              <input type="hidden" name="kind" value={it.kind} />
              <button
                type="submit"
                disabled={!it.available}
                className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-xl border border-input bg-surface-2 px-3 py-2.5 text-left transition-colors hover:border-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="font-display text-sm text-foreground">
                  {it.icon} {it.label}
                </span>
                <span className="text-[11px] text-muted-foreground">{it.available ? it.hint : it.reason}</span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </details>
  );
}
