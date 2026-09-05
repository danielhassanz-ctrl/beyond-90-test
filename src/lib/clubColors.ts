/**
 * Colores reales de camiseta/identidad de los clubes que pueden aparecer en
 * el juego, usados solo para teñir degradados y una insignia con iniciales
 * (nunca el escudo oficial: los modelos de IA no lo reproducen bien y usar
 * el logo exacto de un club real es terreno legal delicado). Es información
 * de color pública, igual que usar el nombre del club en el texto.
 */
const CLUB_COLORS: Record<string, { primary: string; secondary: string }> = {
  "Real Betis": { primary: "#00954C", secondary: "#FFFFFF" },
  "Real Betis Juvenil A": { primary: "#00954C", secondary: "#FFFFFF" },
  "Villarreal CF": { primary: "#FDB913", secondary: "#003DA5" },
  "Málaga CF": { primary: "#0C67A8", secondary: "#FFFFFF" },
  "Real Valladolid": { primary: "#6E1E78", secondary: "#FFFFFF" },
  "Cádiz CF": { primary: "#FFD100", secondary: "#003DA5" },
  "Sporting de Gijón": { primary: "#E30613", secondary: "#FFFFFF" },
  "Levante UD": { primary: "#00205B", secondary: "#6B0F1A" },
  "Rayo Vallecano": { primary: "#E30613", secondary: "#FFFFFF" },
  "Real Zaragoza": { primary: "#003DA5", secondary: "#FFFFFF" },
  "UD Almería": { primary: "#D2001C", secondary: "#FFFFFF" },
  "Real Oviedo": { primary: "#0057A8", secondary: "#003DA5" },
  "Real Madrid": { primary: "#FFFFFF", secondary: "#FEBE10" },
  "FC Barcelona": { primary: "#A50044", secondary: "#004D98" },
  "Deportivo de La Coruña": { primary: "#005BAC", secondary: "#FFFFFF" },
  "US Lecce": { primary: "#FFD700", secondary: "#C8102E" },
  "Sevilla FC": { primary: "#D2001C", secondary: "#FFFFFF" },
  "Atlético de Madrid": { primary: "#C8102E", secondary: "#002D62" },
  Atalanta: { primary: "#1E3D59", secondary: "#000000" },
  "Borussia Dortmund": { primary: "#FDE100", secondary: "#000000" },
  "Liverpool FC": { primary: "#C8102E", secondary: "#F6EB61" },
  "Manchester City": { primary: "#6CABDD", secondary: "#1C2C5B" },
};

/** Paleta de reserva para clubes sin entrada (fichajes inventados por la IA en el mercado europeo). */
const FALLBACK_PALETTE: { primary: string; secondary: string }[] = [
  { primary: "#B08D57", secondary: "#1a1a1a" },
  { primary: "#2E7D32", secondary: "#FFFFFF" },
  { primary: "#1565C0", secondary: "#FFFFFF" },
  { primary: "#6A1B9A", secondary: "#FFFFFF" },
  { primary: "#EF6C00", secondary: "#1a1a1a" },
  { primary: "#00838F", secondary: "#FFFFFF" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getClubColors(club: string): { primary: string; secondary: string } {
  if (CLUB_COLORS[club]) return CLUB_COLORS[club];
  return FALLBACK_PALETTE[hashString(club) % FALLBACK_PALETTE.length];
}

/** Descripción en inglés de la camiseta, para meter en prompts de generación de imagen. */
const KIT_DESCRIPTIONS: Record<string, string> = {
  "Real Betis": "green and white striped",
  "Real Betis Juvenil A": "green and white striped",
  "Villarreal CF": "yellow with navy blue trim",
  "Málaga CF": "blue and white",
  "Real Valladolid": "purple and white",
  "Cádiz CF": "yellow and navy blue striped",
  "Sporting de Gijón": "red and white striped",
  "Levante UD": "navy blue and dark red",
  "Rayo Vallecano": "white with a red diagonal sash",
  "Real Zaragoza": "royal blue and white",
  "UD Almería": "red and white",
  "Real Oviedo": "blue",
  "Real Madrid": "all white with gold trim",
  "FC Barcelona": "blue and dark red striped",
  "Deportivo de La Coruña": "royal blue and white",
  "US Lecce": "yellow and red striped",
  "Sevilla FC": "white and red",
  "Atlético de Madrid": "red and white striped with dark blue shorts",
  Atalanta: "dark blue and black",
  "Borussia Dortmund": "yellow and black",
  "Liverpool FC": "all red",
  "Manchester City": "sky blue",
};

export function describeKit(club: string): string {
  if (KIT_DESCRIPTIONS[club]) return KIT_DESCRIPTIONS[club];
  const colors = getClubColors(club);
  return `custom kit colored ${colors.primary} and ${colors.secondary}`;
}

export function clubInitials(club: string): string {
  const words = club.replace(/^(CF|CD|UD|US|FC)\s+/i, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
