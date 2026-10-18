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
  // España (resto)
  "Cádiz CF": "Cádiz", Osasuna: "Pamplona", "CA Osasuna": "Pamplona", "Las Palmas": "Las Palmas", "UD Las Palmas": "Las Palmas", Almería: "Almería", "UD Almería": "Almería",
  "Real Valladolid": "Valladolid", Mallorca: "Palma", "RCD Mallorca": "Palma", "Elche CF": "Elche", "Real Zaragoza": "Zaragoza", "Deportivo de La Coruña": "La Coruña",
  "CD Mirandés": "Miranda de Ebro", "Racing de Ferrol": "Ferrol", "UD Ibiza": "Ibiza", "CD Eldense": "Elda", "SD Ponferradina": "Ponferrada", "Real Unión": "Irún",
  "CD Tenerife": "Santa Cruz de Tenerife", "Cultural Leonesa": "León", "Sporting de Gijón": "Gijón", "Real Oviedo": "Oviedo", "Levante UD": "Valencia",
  // Inglaterra
  "Brighton & Hove Albion": "Brighton", "Wolverhampton Wanderers": "Wolverhampton", Everton: "Liverpool", "Nottingham Forest": "Nottingham", "AFC Bournemouth": "Bournemouth",
  "Leicester City": "Leicester", "Leeds United": "Leeds", Southampton: "Southampton", "Wrexham AFC": "Wrexham", "Stockport County": "Stockport", "Plymouth Argyle": "Plymouth",
  "Preston North End": "Preston", "Lincoln City": "Lincoln", "Burton Albion": "Burton upon Trent", "Sheffield Wednesday": "Sheffield", "Bristol Rovers": "Bristol",
  // Alemania
  "VfB Stuttgart": "Stuttgart", "SC Friburgo": "Friburgo", "VfL Wolfsburgo": "Wolfsburgo", "Borussia Mönchengladbach": "Mönchengladbach", "TSG Hoffenheim": "Sinsheim",
  "Werder Bremen": "Bremen", "FC Augsburgo": "Augsburgo", "Unión Berlín": "Berlín", "Mainz 05": "Maguncia", "FC Schalke 04": "Gelsenkirchen", "Hamburgo SV": "Hamburgo",
  "1. FC Colonia": "Colonia", "VfL Bochum": "Bochum", "SV Elversberg": "Spiesen-Elversberg", "Arminia Bielefeld": "Bielefeld", "Dynamo Dresde": "Dresde",
  "SpVgg Greuther Fürth": "Fürth", "Hansa Rostock": "Rostock", "Preußen Münster": "Münster", "SC Paderborn": "Paderborn", "Holstein Kiel": "Kiel",
  // Italia
  Bolonia: "Bolonia", Udinese: "Údine", Sassuolo: "Sassuolo", Génova: "Génova", Cagliari: "Cagliari", "Hellas Verona": "Verona", "US Lecce": "Lecce", Empoli: "Empoli", Parma: "Parma",
  Monza: "Monza", Como: "Como", Cesena: "Cesena", Carrarese: "Carrara", Südtirol: "Bolzano", Pisa: "Pisa", Cittadella: "Cittadella", Spezia: "La Spezia", Palermo: "Palermo", Catanzaro: "Catanzaro",
  // Francia
  "OGC Niza": "Niza", "Stade Rennais": "Rennes", "RC Lens": "Lens", "Stade de Reims": "Reims", "FC Nantes": "Nantes", "RC Estrasburgo": "Estrasburgo", "Montpellier HSC": "Montpellier",
  "Toulouse FC": "Toulouse", "FC Lorient": "Lorient", "Stade Brestois": "Brest", "Le Havre AC": "Le Havre", "FC Metz": "Metz", "AJ Auxerre": "Auxerre", "US Quevilly": "Rouen",
  "Annecy FC": "Annecy", "Red Star FC": "Saint-Ouen", "FC Versailles": "Versalles", "Rodez AF": "Rodez", "Chamois Niortais": "Niort", Bergerac: "Bergerac", Concarneau: "Concarneau",
  // Arabia Saudí (las que no se conocen con seguridad quedan con el país)
  "Al-Ittihad": "Yeda", "Al-Ahli": "Yeda", "Al-Shabab": "Riad", "Al-Riyadh": "Riad", "Al-Ettifaq": "Dammam", "Al-Taawoun": "Buraida", "Al-Raed": "Buraida", "Al-Wehda": "La Meca", "Abha Club": "Abha",
  "Al-Fateh": "Arabia Saudí", "Al-Fayha": "Arabia Saudí", "Damac FC": "Arabia Saudí", "Al-Khaleej": "Arabia Saudí", "Al-Okhdood": "Arabia Saudí", "Al-Hazem": "Arabia Saudí", "Al-Tai": "Arabia Saudí",
  "Al-Jabalain": "Arabia Saudí", "Al-Qadsiah": "Arabia Saudí", "Al-Najma": "Arabia Saudí", "Al-Orobah": "Arabia Saudí", "Al-Batin": "Arabia Saudí", "Al-Kholood": "Arabia Saudí",
  "Hajer FC": "Arabia Saudí", "Al-Arabi": "Arabia Saudí",
};
export const cityOfClub = (club: string): string => CITY_BY_CLUB[club] ?? club;
