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

const CATEGORY_LABELS: Record<string, string> = {
  entrenamiento: "Entrenamiento",
  partido: "Partido",
  vestuario: "Vestuario",
  representante: "Representante",
  prensa: "Prensa",
  vida: "Vida Personal",
  especial: "Momento Especial",
  segunda_vida: "Segunda Vida",
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
 *
 * Mejorado con: mejor composición visual, contraste dinámico, efectos de luz,
 * y mejor presentación de información.
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
  const categoryIcon = CATEGORY_ICONS[category] ?? "✨";
  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-xl bg-neutral-900 border border-amber-500/20 shadow-lg">
      {/* Imagen base */}
      {sceneUrl && (
        <Image
          src={sceneUrl}
          alt=""
          fill
          className="object-cover"
          priority
        />
      )}

      {/* Color overlay dinámico basado en colores del club */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}77, ${colors.secondary}77)`,
          mixBlendMode: "overlay",
        }}
      />

      {/* Gradiente oscuro inferior para texto legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />

      {/* Efecto de luz lateral */}
      <div
        className="absolute -right-1/2 top-0 bottom-0 w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.primary}22)`,
          pointerEvents: "none",
        }}
      />

      {/* Categoría badge (arriba izquierda) */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm border border-amber-500/30">
        <span className="text-lg">{categoryIcon}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
          {categoryLabel}
        </span>
      </div>

      {/* Club crest (arriba derecha) */}
      {hasClub && (
        <div className="absolute right-3 top-3 drop-shadow-lg">
          <ClubCrest club={club} size={40} titles={titles} />
        </div>
      )}

      {/* Decoración visual de esquina inferior derecha */}
      <div
        className="absolute bottom-0 right-0 h-16 w-16 opacity-20"
        style={{
          background: `radial-gradient(circle, ${colors.primary}, transparent)`,
          borderRadius: "100% 0 0 0",
        }}
      />
    </div>
  );
}
