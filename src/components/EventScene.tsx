import Image from "next/image";
import { getClubColors } from "@/lib/clubColors";
import { NO_CLUB_YET } from "@/lib/constants";
import { ClubCrest } from "./ClubCrest";

const CATEGORY_ICONS: Record<string, string> = {
  entrenamiento: "⚽",
  partido: "🏟️",
  vestuario: "👕",
  representante: "🤝",
  prensa: "🎙️",
  vida: "❤️",
  especial: "✨",
  segunda_vida: "📋",
};

/**
 * Una foto base por categoría (entrenamiento, vestuario, despacho del
 * agente...), generada una única vez y reutilizada para siempre: cero
 * coste y cero espera por turno. Lo único que cambia por partida son los
 * colores del club (degradado) y el escudo, no la foto en sí.
 */
const CATEGORY_SCENES: Record<string, string> = {
  entrenamiento: "/scenes/entrenamiento.jpg",
  partido: "/scenes/partido.jpg",
  vestuario: "/scenes/vestuario.jpg",
  representante: "/scenes/representante.jpg",
  prensa: "/scenes/prensa.jpg",
  vida: "/scenes/vida.jpg",
  especial: "/scenes/especial.jpg",
  segunda_vida: "/scenes/segunda_vida.jpg",
};

/**
 * Imagen de ambiente para cada evento de la carrera: una foto genérica de
 * la situación (misma para todo el mundo, sin generar nada nuevo con IA en
 * cada turno) teñida con los colores reales del club actual, más el
 * escudo del club y un icono de categoría. Los momentos "hito" siguen
 * teniendo su propia imagen generada con la cara real del jugador.
 */
export function EventScene({
  club,
  category,
  titles = 0,
}: {
  club: string;
  category: string;
  titles?: number;
}) {
  const hasClub = club && club !== NO_CLUB_YET;
  const colors = hasClub ? getClubColors(club) : { primary: "#D4AF37", secondary: "#111111" };
  const sceneUrl = CATEGORY_SCENES[category];

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-lg bg-neutral-900">
      {sceneUrl && <Image src={sceneUrl} alt="" fill className="object-cover" />}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          mixBlendMode: "color",
          opacity: 0.75,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur">
        <span>{CATEGORY_ICONS[category] ?? "✨"}</span>
      </span>
      {hasClub && (
        <span className="absolute right-2 top-2 drop-shadow-md">
          <ClubCrest club={club} size={34} titles={titles} />
        </span>
      )}
    </div>
  );
}
