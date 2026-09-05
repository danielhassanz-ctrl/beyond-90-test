import { getClubColors, clubInitials } from "@/lib/clubColors";

/**
 * Escudo estilizado del club: blasón con cinta e iniciales + colores
 * reales, generado por código (gratis, instantáneo). No es el escudo
 * oficial del club — es una marca registrada, y clonarlo "para que no se
 * note" no deja de ser una copia no autorizada — pero con una forma de
 * escudo currada, los colores correctos y una cinta con las iniciales,
 * se reconoce el equipo igual sin clonar el diseño de nadie.
 */
export function ClubCrest({ club, size = 40 }: { club: string; size?: number }) {
  const colors = getClubColors(club);
  const initials = clubInitials(club);
  const id = club.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" role="img" aria-label={club}>
      <title>{club}</title>
      <defs>
        <linearGradient id={`fill-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="52%" stopColor={colors.primary} />
          <stop offset="52%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
        <linearGradient id={`sheen-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* contorno exterior dorado */}
      <path
        d="M50 1 L92 14 L92 52 C92 82 74 101 50 112 C26 101 8 82 8 52 L8 14 Z"
        fill="#D9B44A"
      />
      {/* cuerpo del escudo */}
      <path
        d="M50 5 L88 17 L88 52 C88 79 71.5 96.5 50 107 C28.5 96.5 12 79 12 52 L12 17 Z"
        fill={`url(#fill-${id})`}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
      />
      {/* brillo superior */}
      <path
        d="M50 5 L88 17 L88 52 C88 79 71.5 96.5 50 107 C28.5 96.5 12 79 12 52 L12 17 Z"
        fill={`url(#sheen-${id})`}
      />
      {/* cinta con las iniciales */}
      <rect x="18" y="46" width="64" height="24" rx="2" fill="rgba(0,0,0,0.55)" />
      <rect x="18" y="46" width="64" height="2" fill="rgba(255,255,255,0.5)" />
      <rect x="18" y="68" width="64" height="2" fill="rgba(255,255,255,0.35)" />
      <text
        x="50"
        y="64"
        textAnchor="middle"
        fontSize="22"
        fontWeight="900"
        letterSpacing="1"
        fill="#fff"
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        {initials}
      </text>
    </svg>
  );
}
