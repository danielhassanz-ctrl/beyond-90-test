import Link from "next/link";
import Image from "next/image";
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

  const { data: shots } = await supabase
    .from("milestones")
    .select("id, title, image_url")
    .eq("player_id", player.id)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
      <div className="w-full max-w-md space-y-1 text-center">
        <p className="text-4xl">📸</p>
        <h1 className="font-display text-2xl">Fotos de tus hitos</h1>
        <p className="text-sm text-muted-foreground">
          Cada momento importante de tu carrera puede tener su propia foto generada con IA. Aquí están todas y lo que te queda por generar.
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

      <div className="w-full max-w-md space-y-3">
        <p className="text-kicker">Tus fotos{shots && shots.length > 0 ? ` · ${shots.length}` : ""}</p>
        {!shots || shots.length === 0 ? (
          <p className="text-xs text-muted-foreground">Todavía no hay ninguna foto. Cada hito importante generará la suya.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {shots.map((m) => (
              <Link
                key={m.id as string}
                href={`/carrera/hito/${m.id}`}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-panel-border bg-surface-2 hover:border-gold/50"
              >
                <Image src={m.image_url as string} alt={(m.title as string) ?? "Hito"} fill className="object-cover transition group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-6 font-cond text-[10px] uppercase tracking-wide text-white">
                  {m.title as string}
                </span>
              </Link>
            ))}
          </div>
        )}
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
