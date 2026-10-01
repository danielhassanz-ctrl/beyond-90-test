import Image from "next/image";
import Link from "next/link";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { ensurePublicCareerCard, getPublicCareerCard, type PublicCareerCard } from "@/lib/player/shareCard";
import { ClubCrest } from "@/components/ClubCrest";
import { getAppUrlLine } from "@/lib/constants";

/**
 * Página pública (sin login) para comparar dos carreras — pedido tras la
 * auditoría: el juego no tenía ningún bucle social que convirtiera "me
 * gusta esta foto" en "me traigo a un amigo a jugar". Quien recibe el
 * enlace ve la carrera de quien lo compartió; si además tiene su propia
 * partida activa, se ve lado a lado. Si no tiene ninguna, hay un botón
 * directo para crear la suya.
 */
function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-panel-border bg-surface-2 px-2 py-2 text-center">
      <p className="font-num text-lg font-bold text-foreground">{value}</p>
      <p className="text-kicker text-[9px]">{label}</p>
    </div>
  );
}

function CareerCard({ card, highlight }: { card: PublicCareerCard; highlight: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 bg-neutral-900 ${
        highlight ? "border-amber-400" : "border-panel-border"
      }`}
    >
      <div className="relative aspect-square w-full bg-surface-2">
        {card.photo_url ? (
          <Image src={card.photo_url} alt={card.display_name} fill className="object-cover object-top" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ClubCrest club={card.club} size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-x-0 top-2 flex justify-center">
          <ClubCrest club={card.club} size={28} />
        </div>
        <div className="absolute inset-x-0 bottom-2 text-center">
          <p className="truncate px-2 text-sm font-black uppercase text-white drop-shadow">{card.display_name}</p>
          <p className="text-[10px] text-amber-200/90">
            {card.club} · {card.age} años
          </p>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="rounded-lg bg-amber-400 py-1.5 text-center text-neutral-950">
          <span className="text-[9px] font-bold uppercase">Media</span>{" "}
          <span className="text-xl font-black">{card.media}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <StatBox label="Goles" value={card.stats_goals} />
          <StatBox label="Asist." value={card.stats_assists} />
          <StatBox label="Partidos" value={card.stats_matches_played} />
          <StatBox label="Títulos" value={card.stats_titles} />
        </div>
      </div>
    </div>
  );
}

export default async function CompararPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  const sharedCard = await getPublicCareerCard(supabase, code);

  if (!sharedCard) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-4xl">🔍</p>
        <h1 className="font-display text-xl">Enlace no encontrado</h1>
        <p className="text-sm text-muted-foreground">Puede que el jugador haya borrado su carrera.</p>
        <Link href="/" className="gold-fill rounded-full px-6 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground">
          Ir a Beyond 90
        </Link>
      </main>
    );
  }

  // Si quien ve el enlace ya tiene su propia carrera activa (y no es la
  // misma que la compartida), se genera/actualiza su propia tarjeta al
  // vuelo para la comparación — así siempre está con sus datos de hoy.
  const viewerCard =
    user && player && player.id !== sharedCard.player_id ? await ensurePublicCareerCard(supabase, player, user.id) : null;
  const viewerPublicCard = viewerCard ? await getPublicCareerCard(supabase, viewerCard) : null;

  const isOwnLink = player?.id === sharedCard.player_id;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
      <div className="w-full max-w-md space-y-1 text-center">
        <p className="text-4xl">⚔️</p>
        <h1 className="font-display text-2xl">
          {viewerPublicCard ? "Comparación de carreras" : `La carrera de ${sharedCard.display_name}`}
        </h1>
        {!viewerPublicCard && <p className="text-sm text-muted-foreground">Beyond 90 — simulador de carrera de futbolista</p>}
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <CareerCard
          card={sharedCard}
          highlight={!viewerPublicCard || sharedCard.media >= (viewerPublicCard?.media ?? 0)}
        />
        {viewerPublicCard && (
          <CareerCard card={viewerPublicCard} highlight={viewerPublicCard.media > sharedCard.media} />
        )}
      </div>

      {!player && (
        <div className="w-full max-w-md space-y-3 rounded-2xl border border-gold/50 bg-gold/10 p-5 text-center">
          <p className="text-sm text-foreground/90">¿Crees que puedes hacerlo mejor? Crea tu propio jugador y compáralo.</p>
          <Link
            href="/crear-jugador"
            className="gold-fill block w-full rounded-full px-4 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
          >
            Crear mi jugador
          </Link>
        </div>
      )}

      {isOwnLink && (
        <p className="w-full max-w-md text-center text-xs text-muted-foreground">
          Este es tu propio enlace — compártelo para retar a alguien. {getAppUrlLine()}
        </p>
      )}

      <Link href="/" className="text-sm text-muted-foreground hover:text-gold hover:underline">
        Volver a Beyond 90
      </Link>
    </main>
  );
}
