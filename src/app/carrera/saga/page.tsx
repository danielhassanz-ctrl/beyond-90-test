import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { BottomNav } from "@/components/BottomNav";
import { PhotoInput } from "@/components/PhotoInput";
import { childAgeYears } from "@/lib/narrative/children";
import { canContinueDynasty, dynastyChildren, describeLegacy, sagaEntryOf, INHERITANCE } from "@/lib/narrative/dynasty";
import { POSITIONS } from "@/lib/constants";
import { displayName } from "@/types/player";
import { startDynasty } from "./actions";

export default async function SagaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, player } = await getCurrentUserAndPlayer();
  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");
  if (!canContinueDynasty(player)) redirect("/carrera/retiro");

  const params = await searchParams;
  const children = dynastyChildren(player.flags);
  const legacy = sagaEntryOf(player);
  const inherit = Math.round(((player.patrimonio ?? 0) * INHERITANCE) / 1000) * 1000;

  return (
    <main className="flex flex-1 flex-col items-center gap-5 p-6 pb-24">
      <div className="w-full max-w-md space-y-2 text-center">
        <p className="text-4xl">🧬</p>
        <h1 className="font-display text-3xl">La saga continúa</h1>
        <p className="text-sm text-muted-foreground">
          Tu carrera ya es historia. Pero hay alguien en casa que lleva tu apellido y que, cuando se calza unas botas, se parece demasiado a ti.
        </p>
      </div>

      <div className="w-full max-w-md space-y-1 rounded-2xl border border-panel-border bg-surface p-4">
        <p className="text-kicker">Tu legado</p>
        <p className="font-display text-xl">{displayName(player)}</p>
        <p className="text-sm text-muted-foreground">{describeLegacy(legacy)}</p>
      </div>

      {params.error && (
        <p className="w-full max-w-md rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{params.error}</p>
      )}

      <form action={startDynasty} className="w-full max-w-md space-y-5 rounded-2xl border border-gold/40 bg-surface p-5">
        <div className="space-y-2">
          <p className="text-kicker">¿Quién sigue la saga?</p>
          {children.map((c, i) => (
            <label key={c.n} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-input bg-surface-2 px-4 py-3 has-[:checked]:border-gold has-[:checked]:bg-gold/10">
              <span>
                <span className="block font-display text-lg">{c.n}</span>
                <span className="block text-xs text-muted-foreground">Tu hijo · {childAgeYears(c, player.week)} años ahora</span>
              </span>
              <input type="radio" name="child" value={c.n} required defaultChecked={i === 0} className="accent-[var(--gold)]" />
            </label>
          ))}
          <p className="text-xs text-muted-foreground">Su carrera empieza a los 16 años, cuando pasa por las puertas de su primera cantera.</p>
        </div>

        <div className="space-y-2">
          <p className="text-kicker">Demarcación</p>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((pos, i) => (
              <label key={pos} className="cursor-pointer">
                <input type="radio" name="position" value={pos} required defaultChecked={i === 3} className="peer sr-only" />
                <span className="font-cond block rounded-full border border-input bg-surface-2 px-4 py-2 text-sm text-muted-foreground transition-all peer-checked:border-gold peer-checked:bg-gold peer-checked:text-primary-foreground">{pos}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-kicker">Foto (opcional)</p>
          <PhotoInput name="photo" />
          <p className="text-xs text-muted-foreground">Con una foto, las imágenes de sus momentos se le parecen. Sin ella, la saga empieza igual.</p>
        </div>

        <div className="space-y-1 rounded-xl bg-surface-2 p-3 text-xs text-muted-foreground">
          <p>👨‍👦 Hereda tu apellido y parte de tu personalidad.</p>
          <p>💶 Hereda {inherit.toLocaleString("es")} € (el {Math.round(INHERITANCE * 100)} % de tu patrimonio).</p>
          <p>📸 Entra con la fama (y la presión) de ser tu hijo.</p>
          <p>🖼️ Conserva tus fotos de pago y tu cupo gratuito.</p>
        </div>

        <button type="submit" className="gold-fill w-full rounded-full px-6 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground">
          Empezar la saga
        </button>
      </form>

      <Link href="/carrera/retiro" className="font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">‹ Volver</Link>
      <BottomNav active="jugador" />
    </main>
  );
}
