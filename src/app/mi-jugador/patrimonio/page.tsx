import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { seasonLabel } from "@/types/career";
import { BottomNav } from "@/components/BottomNav";

export default async function PatrimonioPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  if (!player) {
    redirect("/crear-jugador");
  }

  const { data: allEvents } = await supabase
    .from("career_events")
    .select("id, week, title, consequences, created_at")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false });

  const movimientos = (allEvents ?? [])
    .map((e) => {
      const consequences = e.consequences as { patrimonio?: number } | null;
      const monto = consequences?.patrimonio;
      if (!monto) return null;
      return { id: e.id, week: e.week as number, title: e.title as string, monto };
    })
    .filter((m): m is { id: string; week: number; title: string; monto: number } => m !== null);

  return (
    <main className="flex flex-1 justify-center p-6 pb-24">
      <div className="w-full max-w-lg space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gold">Patrimonio</h1>
          <Link href="/mi-jugador" className="text-sm text-neutral-400 hover:text-gold">
            Mi jugador
          </Link>
        </div>

        <div className="rounded-lg border border-panel-border bg-panel px-4 py-5 text-center">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Total actual</p>
          <p className="text-3xl font-bold text-gold">
            {player.patrimonio.toLocaleString("es")} €
          </p>
        </div>

        <div className="rounded-lg border border-panel-border bg-panel p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-neutral-400">
            Propiedades e inversiones
          </p>
          <p className="text-xs text-neutral-600">
            Todavía no hay nada que registrar aquí — las casas, coches e inversiones que vayas
            comprando en tu carrera van a aparecer en esta sección.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Movimientos</p>
          {movimientos.length === 0 ? (
            <p className="rounded-lg border border-panel-border bg-panel p-4 text-xs text-neutral-600">
              Todavía no hubo ningún movimiento de dinero en tu carrera.
            </p>
          ) : (
            <ul className="space-y-2">
              {movimientos.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-md border border-panel-border bg-panel px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-100">{m.title}</p>
                    <p className="text-xs text-neutral-500">Temporada {seasonLabel(m.week)}</p>
                  </div>
                  <span
                    className={`text-sm font-bold ${m.monto >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {m.monto >= 0 ? "+" : ""}
                    {m.monto.toLocaleString("es")} €
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <BottomNav active="patrimonio" />
    </main>
  );
}
