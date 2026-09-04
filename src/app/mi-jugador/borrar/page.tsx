import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { deletePlayer } from "./actions";

export default async function BorrarJugadorPage() {
  const { user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  if (!player) {
    redirect("/crear-jugador");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gold">¿Borrar a {player.last_name}?</h1>
          <p className="text-sm text-neutral-400">
            Se va a borrar toda su carrera: eventos vividos, hitos y estadísticas. Esta acción no
            se puede deshacer.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <form action={deletePlayer}>
            <button
              type="submit"
              className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Sí, borrar y empezar de nuevo
            </button>
          </form>
          <Link
            href="/mi-jugador"
            className="w-full rounded-md border border-panel-border px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-panel"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </main>
  );
}
