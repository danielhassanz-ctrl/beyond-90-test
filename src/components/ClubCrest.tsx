import { getClubColors, clubInitials } from "@/lib/clubColors";

const STAR_PATH = "M0,-6 L1.76,-1.85 6,-1.85 2.6,0.7 3.9,5 0,2.3 -3.9,5 -2.6,0.7 -6,-1.85 -1.76,-1.85 Z";

/**
 * Escudo estilizado del club: blasón con cinta e iniciales + colores
 * reales, generado por código (gratis, instantáneo). No es el escudo
 * oficial del club — es una marca registrada, y clonarlo "para que no se
 * note" no deja de ser una copia no autorizada — pero con una forma de
 * escudo currada, los colores correctos y una cinta con las iniciales,
 * se reconoce el equipo igual sin clonar el diseño de nadie.
 *
 * `titles` (0-3) añade estrellas doradas encima del escudo, como hacen
 * muchos clubes reales para presumir de palmarés — un detalle propio del
 * jugador (title_liga / title_champions en sus flags), no una copia de
 * cómo lo representa ningún club en concreto.
 */
export function ClubCrest({
  club,
  size = 40,
  titles = 0,
}: {
  club: string;
  size?: number;
  titles?: number;
}) {
  const colors = getClubColors(club);
  const initials = clubInitials(club);
  const id = club.replace(/[^a-zA-Z0-9]/g, "");
  const starCount = Math.max(0, Math.min(3, titles));
  const starSpacing = 12;
  const starsStartX = 50 - ((starCount - 1) * starSpacing) / 2;

  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 100 125" role="img" aria-label={club}>
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

      {starCount > 0 && (
        <g transform={`translate(${starsStartX}, 9)`}>
          {Array.from({ length: starCount }).map((_, i) => (
            <path key={i} d={STAR_PATH} transform={`translate(${i * starSpacing}, 0)`} fill="#F0C94A" />
          ))}
        </g>
      )}

      {/* contorno exterior dorado */}
      <path
        d="M50 11 L92 24 L92 62 C92 92 74 111 50 122 C26 111 8 92 8 62 L8 24 Z"
        fill="#D9B44A"
      />
      {/* cuerpo del escudo */}
      <path
        d="M50 15 L88 27 L88 62 C88 89 71.5 106.5 50 117 C28.5 106.5 12 89 12 62 L12 27 Z"
        fill={`url(#fill-${id})`}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
      />
      {/* brillo superior */}
      <path
        d="M50 15 L88 27 L88 62 C88 89 71.5 106.5 50 117 C28.5 106.5 12 89 12 62 L12 27 Z"
        fill={`url(#sheen-${id})`}
      />
      {/* cinta con las iniciales */}
      <rect x="18" y="56" width="64" height="24" rx="2" fill="rgba(0,0,0,0.55)" />
      <rect x="18" y="56" width="64" height="2" fill="rgba(255,255,255,0.5)" />
      <rect x="18" y="78" width="64" height="2" fill="rgba(255,255,255,0.35)" />
      <text
        x="50"
        y="74"
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
