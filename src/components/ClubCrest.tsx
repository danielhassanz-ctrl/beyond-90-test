import { getClubColors, clubInitials } from "@/lib/clubColors";

/**
 * Escudo estilizado del club: forma de blasón + colores reales + iniciales,
 * generado por código (gratis, instantáneo). No es el escudo oficial del
 * club — eso es una marca registrada y los modelos de IA tampoco lo
 * reproducen bien — pero con la silueta de escudo y los colores correctos
 * se reconoce el equipo igual.
 */
export function ClubCrest({ club, size = 40 }: { club: string; size?: number }) {
  const colors = getClubColors(club);
  const initials = clubInitials(club);
  const gradId = `crest-${club.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" role="img" aria-label={club}>
      <title>{club}</title>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="55%" stopColor={colors.primary} />
          <stop offset="55%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
      </defs>
      <path
        d="M50 2 L94 16 L94 55 C94 88 72 106 50 113 C28 106 6 88 6 55 L6 16 Z"
        fill={`url(#${gradId})`}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="3"
      />
      <circle cx="50" cy="52" r="26" fill="rgba(0,0,0,0.25)" />
      <text
        x="50"
        y="61"
        textAnchor="middle"
        fontSize="26"
        fontWeight="900"
        fill="#fff"
        fontFamily="system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}
