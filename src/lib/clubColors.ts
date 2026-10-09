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
  "Bayern de Múnich": { primary: "#DC052D", secondary: "#FFFFFF" },
  "Bayer Leverkusen": { primary: "#E32221", secondary: "#000000" },
  "RB Leipzig": { primary: "#DD0741", secondary: "#FFFFFF" },
  "Eintracht Fráncfort": { primary: "#E1000F", secondary: "#000000" },
  "VfB Stuttgart": { primary: "#FFFFFF", secondary: "#E32219" },
  "SC Friburgo": { primary: "#E2001A", secondary: "#000000" },
  "VfL Wolfsburgo": { primary: "#65B32E", secondary: "#FFFFFF" },
  "Borussia Mönchengladbach": { primary: "#FFFFFF", secondary: "#009A3D" },
  "TSG Hoffenheim": { primary: "#1961B5", secondary: "#FFFFFF" },
  "Werder Bremen": { primary: "#1D9053", secondary: "#FFFFFF" },
  "FC Augsburgo": { primary: "#BA3733", secondary: "#FFFFFF" },
  "Unión Berlín": { primary: "#EB1923", secondary: "#FFFFFF" },
  "Mainz 05": { primary: "#C3141E", secondary: "#FFFFFF" },
  "FC Schalke 04": { primary: "#004D9D", secondary: "#FFFFFF" },
  "Hamburgo SV": { primary: "#FFFFFF", secondary: "#0A3A8A" },
  "1. FC Colonia": { primary: "#FFFFFF", secondary: "#ED1C24" },
  "VfL Bochum": { primary: "#005CA9", secondary: "#FFFFFF" },
  "Arsenal": { primary: "#EF0107", secondary: "#FFFFFF" },
  "Chelsea": { primary: "#034694", secondary: "#FFFFFF" },
  "Manchester United": { primary: "#DA291C", secondary: "#FBE122" },
  "Tottenham Hotspur": { primary: "#FFFFFF", secondary: "#132257" },
  "Newcastle United": { primary: "#FFFFFF", secondary: "#000000" },
  "Aston Villa": { primary: "#670E36", secondary: "#95BFE5" },
  "Brighton & Hove Albion": { primary: "#0057B8", secondary: "#FFFFFF" },
  "West Ham United": { primary: "#7A263A", secondary: "#1BB1E7" },
  "Crystal Palace": { primary: "#1B458F", secondary: "#C4122E" },
  "Fulham": { primary: "#FFFFFF", secondary: "#000000" },
  "Brentford": { primary: "#E30613", secondary: "#FFFFFF" },
  "Wolverhampton Wanderers": { primary: "#FDB913", secondary: "#231F20" },
  "Everton": { primary: "#003399", secondary: "#FFFFFF" },
  "Nottingham Forest": { primary: "#DD0000", secondary: "#FFFFFF" },
  "AFC Bournemouth": { primary: "#DA291C", secondary: "#000000" },
  "Leicester City": { primary: "#003090", secondary: "#FDBE11" },
  "Leeds United": { primary: "#FFFFFF", secondary: "#1D428A" },
  "Southampton": { primary: "#D71920", secondary: "#FFFFFF" },
  "Inter de Milán": { primary: "#0068A8", secondary: "#000000" },
  "Juventus": { primary: "#FFFFFF", secondary: "#000000" },
  "AC Milan": { primary: "#FB090B", secondary: "#000000" },
  "SSC Nápoles": { primary: "#12A0D7", secondary: "#FFFFFF" },
  "AS Roma": { primary: "#8E1F2F", secondary: "#F0BC42" },
  "Lazio": { primary: "#87D8F7", secondary: "#FFFFFF" },
  "Fiorentina": { primary: "#5B2A86", secondary: "#FFFFFF" },
  "Bolonia": { primary: "#1A2F48", secondary: "#A21C26" },
  "Torino": { primary: "#8B1E2D", secondary: "#FFFFFF" },
  "Udinese": { primary: "#FFFFFF", secondary: "#000000" },
  "Sassuolo": { primary: "#00A859", secondary: "#000000" },
  "Génova": { primary: "#A5192B", secondary: "#0F2A6B" },
  "Cagliari": { primary: "#A5192B", secondary: "#0F2A6B" },
  "Hellas Verona": { primary: "#FDD835", secondary: "#003DA5" },
  "Empoli": { primary: "#005BAC", secondary: "#FFFFFF" },
  "Parma": { primary: "#FFD400", secondary: "#003DA5" },
  "Monza": { primary: "#E30613", secondary: "#FFFFFF" },
  "Como": { primary: "#0F4C9A", secondary: "#FFFFFF" },
  "Paris Saint-Germain": { primary: "#004170", secondary: "#DA291C" },
  "Olympique de Marsella": { primary: "#2FAEE0", secondary: "#FFFFFF" },
  "AS Mónaco": { primary: "#E30613", secondary: "#FFFFFF" },
  "Olympique de Lyon": { primary: "#FFFFFF", secondary: "#1A3E8F" },
  "LOSC Lille": { primary: "#E01E13", secondary: "#1D2A5B" },
  "OGC Niza": { primary: "#E30613", secondary: "#000000" },
  "Stade Rennais": { primary: "#E30613", secondary: "#000000" },
  "RC Lens": { primary: "#FDD009", secondary: "#E30613" },
  "Stade de Reims": { primary: "#E30613", secondary: "#FFFFFF" },
  "FC Nantes": { primary: "#FCD116", secondary: "#00A650" },
  "RC Estrasburgo": { primary: "#0072BC", secondary: "#FFFFFF" },
  "Montpellier HSC": { primary: "#F26B21", secondary: "#003DA5" },
  "Toulouse FC": { primary: "#6C3E91", secondary: "#FFFFFF" },
  "FC Lorient": { primary: "#F58220", secondary: "#000000" },
  "Stade Brestois": { primary: "#E30613", secondary: "#FFFFFF" },
  "Le Havre AC": { primary: "#5BC4EE", secondary: "#003DA5" },
  "FC Metz": { primary: "#7F1734", secondary: "#FFFFFF" },
  "AJ Auxerre": { primary: "#FFFFFF", secondary: "#0B4EA2" },
  "Al-Nassr FC": { primary: "#FFD400", secondary: "#0B3B8C" },
  "Al-Hilal": { primary: "#1F57A5", secondary: "#FFFFFF" },
  "Al-Ittihad": { primary: "#FFD400", secondary: "#000000" },
  "Al-Ahli": { primary: "#00A651", secondary: "#FFFFFF" },
  "Al-Shabab": { primary: "#FFFFFF", secondary: "#0B3B8C" },
  "Al-Ettifaq": { primary: "#00A651", secondary: "#FFFFFF" },
  "Al-Fateh": { primary: "#00A651", secondary: "#FFFFFF" },
  "Al-Taawoun": { primary: "#F37021", secondary: "#FFFFFF" },
  "Benfica": { primary: "#E30613", secondary: "#FFFFFF" },
  "Sporting CP": { primary: "#00954C", secondary: "#FFFFFF" },
  "Porto": { primary: "#0B3B8C", secondary: "#FFFFFF" },
  "Ajax": { primary: "#FFFFFF", secondary: "#D2122E" },
  "Feyenoord": { primary: "#E30613", secondary: "#FFFFFF" },
  "Girona FC": { primary: "#E30613", secondary: "#FFFFFF" },
  "Athletic Club": { primary: "#E30613", secondary: "#FFFFFF" },
  "Real Sociedad": { primary: "#0067B1", secondary: "#FFFFFF" },
  "Valencia CF": { primary: "#FFFFFF", secondary: "#000000" },
  // Selecciones (torneos Mundial/Eurocopa/Copa América): colores de equipación.
  España: { primary: "#C60B1E", secondary: "#FFC400" },
  Brasil: { primary: "#FFDF00", secondary: "#009C3B" },
  Argentina: { primary: "#75AADB", secondary: "#FFFFFF" },
  Francia: { primary: "#002395", secondary: "#FFFFFF" },
  Alemania: { primary: "#FFFFFF", secondary: "#1A1A1A" },
  Inglaterra: { primary: "#FFFFFF", secondary: "#CF081F" },
  Portugal: { primary: "#C8102E", secondary: "#046A38" },
  "Países Bajos": { primary: "#F36C21", secondary: "#FFFFFF" },
  Italia: { primary: "#0066B2", secondary: "#FFFFFF" },
  Bélgica: { primary: "#E30613", secondary: "#FDDA24" },
  Croacia: { primary: "#E30613", secondary: "#FFFFFF" },
  Uruguay: { primary: "#5CBFEB", secondary: "#1A1A1A" },
  Colombia: { primary: "#FCD116", secondary: "#003893" },
  Chile: { primary: "#D52B1E", secondary: "#0039A6" },
  Marruecos: { primary: "#C1272D", secondary: "#006233" },
  México: { primary: "#006847", secondary: "#FFFFFF" },
  Dinamarca: { primary: "#C60C30", secondary: "#FFFFFF" },
  Suiza: { primary: "#D52B1E", secondary: "#FFFFFF" },
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
  "Bayern de Múnich": "red with white trim",
  "Bayer Leverkusen": "red and black",
  "RB Leipzig": "white with red accents",
  "Eintracht Fráncfort": "black and red",
  "Arsenal": "red with white sleeves",
  "Chelsea": "royal blue",
  "Manchester United": "red",
  "Tottenham Hotspur": "white with navy trim",
  "Newcastle United": "black and white stripes",
  "Aston Villa": "claret with sky blue sleeves",
  "Inter de Milán": "blue and black stripes",
  "Juventus": "black and white stripes",
  "AC Milan": "red and black stripes",
  "SSC Nápoles": "sky blue",
  "AS Roma": "dark red and yellow",
  "Lazio": "sky blue",
  "Fiorentina": "purple",
  "Paris Saint-Germain": "dark navy blue with a red band",
  "Olympique de Marsella": "white with sky blue trim",
  "AS Mónaco": "red and white diagonal split",
  "Olympique de Lyon": "white with red and blue trim",
  "LOSC Lille": "red",
  "Al-Nassr FC": "yellow with blue trim",
  "Al-Hilal": "royal blue",
  "Al-Ittihad": "yellow and black stripes",
  "Al-Ahli": "green and white",
  "Benfica": "red",
  "Sporting CP": "green and white hoops",
  "Ajax": "white with a red band",
};

/**
 * El modelo de edición de imagen (Flux Kontext Pro) no sigue los colores
 * al pie de la letra si solo se le dan como adjetivo suelto ("blue and
 * white football jersey") — en pruebas reales, con un club real pero
 * poco conocido (Málaga CF) generó un jersey oscuro con un patrón que se
 * parecía al del Barcelona en vez de azul y blanco, probablemente porque
 * el modelo rellena con el kit "de fútbol genérico" más representado en
 * sus datos de entrenamiento cuando la instrucción de color es débil.
 * Esta cláusula extra fuerza el color explícitamente y prohíbe que
 * alucine el escudo o patrón de otro club real.
 */
function kitAccuracyClause(colorPhrase: string): string {
  return `${colorPhrase} (the jersey's actual base color MUST be ${colorPhrase}, not any other color — plain simple design, no crest, badge or pattern copied from any other real famous football club)`;
}

export function describeKit(club: string): string {
  const colorPhrase = KIT_DESCRIPTIONS[club] ?? (() => {
    const colors = getClubColors(club);
    return `custom kit colored ${colors.primary} and ${colors.secondary}`;
  })();
  return kitAccuracyClause(colorPhrase);
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
