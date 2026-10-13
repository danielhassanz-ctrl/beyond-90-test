/** La ciudad de cada club (para mudanzas, pareja y escenas que hablan de «vivir en…», no del equipo). */
const CITY_BY_CLUB: Record<string, string> = {
  "Bayern de Múnich": "Múnich", "Borussia Dortmund": "Dortmund", "Bayer Leverkusen": "Leverkusen", "RB Leipzig": "Leipzig", "Eintracht Fráncfort": "Fráncfort",
  "Manchester City": "Mánchester", "Manchester United": "Mánchester", "Liverpool FC": "Liverpool", Arsenal: "Londres", Chelsea: "Londres", "Tottenham Hotspur": "Londres",
  "West Ham United": "Londres", Fulham: "Londres", Brentford: "Londres", "Crystal Palace": "Londres", "Newcastle United": "Newcastle", "Aston Villa": "Birmingham",
  "Paris Saint-Germain": "París", "Olympique de Marsella": "Marsella", "AS Mónaco": "Mónaco", "Olympique de Lyon": "Lyon", "LOSC Lille": "Lille",
  Juventus: "Turín", Torino: "Turín", "Inter de Milán": "Milán", "AC Milan": "Milán", "AS Roma": "Roma", Lazio: "Roma", "SSC Nápoles": "Nápoles", Atalanta: "Bérgamo", Fiorentina: "Florencia",
  "Al-Nassr FC": "Riad", "Al-Hilal": "Riad", "Real Madrid": "Madrid", "Atlético de Madrid": "Madrid", "Getafe CF": "Madrid", "Rayo Vallecano": "Madrid", "FC Barcelona": "Barcelona",
  "Sevilla FC": "Sevilla", "Real Betis": "Sevilla", "Valencia CF": "Valencia", "Villarreal CF": "Villarreal", "Athletic Club": "Bilbao", "Real Sociedad": "San Sebastián",
  "Girona FC": "Girona", "Celta de Vigo": "Vigo", "Málaga CF": "Málaga",
};
export const cityOfClub = (club: string): string => CITY_BY_CLUB[club] ?? club;
