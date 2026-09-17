import Image from "next/image";
import { getClubColors } from "@/lib/clubColors";
import { ClubCrest } from "./ClubCrest";

/**
 * Tarjeta de jugador estilo "carta de cromo" (FIFA/FUT): foto a sangre,
 * dorsal grande, nombre en placa inferior. Se usa como visual por defecto
 * para los hitos que no tienen una imagen generada por IA propia — así
 * siempre hay algo bonito que compartir, con o sin foto. El color del
 * club se queda en el borde, la cinta y el escudo — la foto real del
 * jugador se ve tal cual, sin teñirla. Antes llevaba un degradado de los
 * colores del club de fondo MÁS mix-blend-luminosity sobre la foto (para
 * que combinaran), pero el resultado era una foto irreconocible bajo un
 * lavado de color — pedido explícito de quitarlo.
 */
export function PlayerCard({
  photoUrl,
  name,
  number,
  position,
  club,
  ribbon,
  seasonLabel,
}: {
  photoUrl?: string | null;
  name: string;
  number: number;
  position?: string;
  club: string;
  ribbon: string;
  seasonLabel: string;
}) {
  const colors = getClubColors(club);

  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 bg-neutral-900 shadow-[0_0_50px_-10px_rgba(245,183,64,0.35)]"
      style={{ borderColor: `${colors.primary}CC` }}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill className="object-cover object-top" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <ClubCrest club={club} size={140} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-3 pt-3">
        <span className="whitespace-nowrap rounded-full border border-amber-400/60 bg-black/50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-300 backdrop-blur">
          {ribbon}
        </span>
        <span className="shrink-0 drop-shadow-md">
          <ClubCrest club={club} size={28} />
        </span>
      </div>

      <div className="absolute left-4 top-14 flex flex-col items-start leading-none">
        <span className="text-5xl font-black text-amber-300 drop-shadow-lg">{number}</span>
        {position && (
          <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-amber-100/90">
            {position}
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-5 text-center">
        <p className="text-2xl font-black uppercase tracking-wide text-white drop-shadow-lg">{name}</p>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/90">{club}</p>
        <p className="text-[11px] text-neutral-400">{seasonLabel}</p>
      </div>
    </div>
  );
}
