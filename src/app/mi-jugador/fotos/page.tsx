import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { BottomNav } from "@/components/BottomNav";
import { FREE_IMAGES_PER_CAREER, CREDIT_PACK, getFreeImagesUsed, getFreeImagesRemaining, getPaidCredits, isEligibleForFreeTier } from "@/lib/images/credits";
import { createCreditCheckout } from "./actions";

export default async function FotosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; comprado?: string }>;
}) {
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");

  const params = await searchParams;
  const eligibleForFree = await isEligibleForFreeTier(supabase, player, user.email);
  const freeUsed = getFreeImagesUsed(player);
  const freeLeft = eligibleForFree ? getFreeImagesRemaining(player) : 0;
  const paid = getPaidCredits(player);
  const totalLeft = freeLeft + paid;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
      <div className="w-full max-w-md space-y-1 text-center">
        <p className="text-4xl">📸</p>
        <h1 className="font-display text-2xl">Fotos de tus hitos</h1>
        <p className="text-sm text-muted-foreground">
          Cada momento importante de tu carrera puede tener su propia foto generada con IA.
        </p>
      </div>

      {params.comprado && (
        <p className="w-full max-w-md rounded-lg border border-gold/50 bg-gold/10 px-3 py-2 text-center text-sm text-gold-soft">
          ¡Pago recibido! En unos segundos tus fotos nuevas estarán disponibles.
        </p>
      )}
      {params.error && (
        <p className="w-full max-w-md rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {params.error}
        </p>
      )}

      <div className="w-full max-w-md space-y-3 rounded-2xl border border-panel-border bg-surface p-5">
        {eligibleForFree ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-kicker">Fotos gratis usadas</span>
              <span className="font-num text-lg font-bold text-foreground">
                {freeUsed} / {FREE_IMAGES_PER_CAREER}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${Math.min(100, (freeUsed / FREE_IMAGES_PER_CAREER) * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Este jugador no tiene fotos gratis (el cupo gratuito es solo para los primeros jugadores del juego) — puedes comprar un pack cuando quieras.
          </p>
        )}
        {paid > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-kicker">Fotos compradas disponibles</span>
            <span className="font-num text-lg font-bold text-gold">{paid}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {totalLeft > 0
            ? `Te quedan ${totalLeft} fotos disponibles para tus próximos hitos.`
            : "No te quedan fotos disponibles. Compra un pack para seguir generando fotos de tus momentos."}
        </p>
      </div>

      <form action={createCreditCheckout} className="w-full max-w-md">
        <button
          type="submit"
          className="gold-fill block w-full cursor-pointer rounded-full px-4 py-3 text-center font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
        >
          Comprar {CREDIT_PACK.images} fotos más — {(CREDIT_PACK.priceCents / 100).toLocaleString("es", { style: "currency", currency: "EUR" })}
        </button>
      </form>

      <Link href="/mi-jugador" className="text-sm text-muted-foreground hover:text-gold hover:underline">
        Volver
      </Link>

      <BottomNav active="jugador" />
    </main>
  );
}
