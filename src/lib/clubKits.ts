/**
 * Camisetas de los clubes que faltaban en clubColors.ts (la mayoría salía como «custom kit colored #E30613…»: los modelos de imagen
 * no entienden los hexadecimales y dibujaban colores al azar). Primera equipación, en inglés y con el patrón (rayas, mitades, mangas):
 * es lo que más diferencia a un club de otro. Sin escudos ni marcas: nunca se pide un logo real.
 */
export const EXTRA_KIT_DESCRIPTIONS: Record<string, string> = {
  "Al-Hilal": "blue jersey with white sleeves, white shorts, blue socks",
  "Chelsea": "royal blue jersey with white trim, blue shorts, white socks",
  "LOSC Lille": "deep red jersey with navy blue trim, navy shorts, red socks",
  "Manchester United": "red jersey with a black collar and white trim, white shorts, black socks",
  "Lazio": "pale sky blue jersey with white sleeve trim, white shorts, white socks",
  "SSC Nápoles": "bright azure blue jersey, azure shorts, azure socks",
  "Manchester City": "sky blue jersey with navy blue trim, white shorts, sky blue socks",
  "Juventus": "narrow black and white vertical stripes, white shorts, black socks",
  "Newcastle United": "wide black and white vertical stripes, black shorts, black socks with white tops",
  "Deportivo de La Coruña": "royal blue and white vertical stripes, blue shorts, blue socks",
  "Real Zaragoza": "white jersey with royal blue trim, blue shorts, white socks",
  // España
  "Valencia CF": "white jersey with black trim on the collar and cuffs, black shorts, black socks",
  "Real Sociedad": "wide royal blue and white vertical stripes, white shorts, blue socks",
  "Athletic Club": "thick red and white vertical stripes, black shorts, red socks",
  "Getafe CF": "deep royal blue jersey with darker navy trim, navy shorts",
  Osasuna: "deep red jersey with navy blue sleeves cuffs and collar, navy shorts",
  "Girona FC": "bright red jersey with white shoulders and a subtle white trim, royal blue shorts",
  "Las Palmas": "bright yellow jersey with royal blue trim and blue shorts",
  Almería: "red jersey with white sleeves, white shorts and red socks",
  "Celta de Vigo": "sky blue jersey with white trim, white shorts, sky blue socks",
  Mallorca: "bright red jersey with black sleeves, black shorts, red socks",
  "Elche CF": "white jersey with a green diagonal sash across the chest, green shorts",
  "CD Mirandés": "red jersey with black collar and cuffs, black shorts, black socks",
  "Racing de Ferrol": "light green jersey with white trim, white shorts",
  "UD Ibiza": "sky blue jersey with white sleeves, white shorts",
  "CD Eldense": "blue jersey with white vertical thin stripes, white shorts",
  "SD Ponferradina": "white jersey with blue trim, blue shorts, white socks",
  "Real Unión": "white jersey with a black chest band, black shorts",
  "CD Tenerife": "white jersey with royal blue sleeves and trim, blue shorts",
  "Cultural Leonesa": "white jersey with a wide red band, red shorts",
  // Inglaterra
  "Brighton & Hove Albion": "blue and white vertical stripes, white shorts, blue socks",
  "West Ham United": "claret jersey with sky blue sleeves, white shorts, claret socks",
  "Crystal Palace": "red and blue vertical stripes, red shorts, blue socks",
  Fulham: "white jersey with thin black trim, black shorts, white socks",
  "Brentford": "red and white vertical stripes with a black collar, black shorts, red socks",
  "Wolverhampton Wanderers": "old gold jersey with black trim, black shorts, gold socks",
  "Everton": "royal blue jersey with white collar and cuffs, white shorts, blue socks",
  "Nottingham Forest": "deep red jersey with white trim, white shorts, red socks",
  "AFC Bournemouth": "red and black vertical stripes, black shorts, black socks",
  "Leicester City": "royal blue jersey with gold trim, blue shorts, blue socks",
  "Leeds United": "all white jersey with yellow and navy trim, white shorts",
  Southampton: "red and white vertical stripes, black shorts, red socks",
  "Wrexham AFC": "deep red jersey with white trim, red shorts, red socks",
  "Stockport County": "royal blue jersey with white trim, white shorts",
  "Plymouth Argyle": "dark green jersey with white trim, green shorts, green socks",
  "Preston North End": "white jersey with navy blue sleeves cuffs, navy shorts",
  "Lincoln City": "wide red and white vertical stripes with a red collar, black shorts, red socks with white tops",
  "Burton Albion": "yellow jersey with a black collar, black shorts, yellow socks",
  "Sheffield Wednesday": "blue and white vertical stripes, black shorts, blue socks",
  "Bristol Rovers": "blue and white quartered jersey, white shorts, blue socks",
  // Alemania
  "VfB Stuttgart": "white jersey with a bold red horizontal chest band, white shorts",
  "SC Friburgo": "red jersey with white shoulder trim, white shorts, red socks",
  "VfL Wolfsburgo": "bright lime green jersey with white trim, white shorts",
  "Borussia Mönchengladbach": "white jersey with thin green and black trim, black shorts",
  "TSG Hoffenheim": "bright blue jersey with white shoulder trim, white shorts, blue socks",
  "Werder Bremen": "deep emerald green jersey with white trim, white shorts, green socks",
  "FC Augsburgo": "red jersey with green and white stripes on the sleeves, white shorts",
  "Unión Berlín": "all red jersey with white trim, red shorts, red socks",
  "Mainz 05": "red jersey with white trim and white sleeve bands, white shorts",
  "FC Schalke 04": "royal blue jersey with a thin white pinstripe, white shorts, white socks",
  "Hamburgo SV": "white jersey with thin black and blue trim, white shorts, blue socks",
  "1. FC Colonia": "white jersey with red trim, white shorts, red socks",
  "VfL Bochum": "royal blue jersey with white sleeves cuffs, white shorts",
  "SV Elversberg": "black jersey with white trim, black shorts, black socks",
  "Arminia Bielefeld": "royal blue jersey with black trim, blue shorts",
  "Dynamo Dresde": "yellow jersey with black sleeves, black shorts, black socks",
  "SpVgg Greuther Fürth": "white jersey with green trim, white shorts, green socks",
  "Hansa Rostock": "white jersey with a blue chest stripe and blue trim, blue shorts",
  "Preußen Münster": "black jersey with green trim, white shorts, black socks",
  "SC Paderborn": "royal blue jersey with black sleeves, black shorts",
  "Holstein Kiel": "navy blue jersey with white and red trim, navy shorts, red socks",
  // Italia
  Bolonia: "red and deep navy vertical stripes, white shorts",
  Torino: "deep granate (maroon) jersey with white trim, maroon shorts, maroon socks",
  Udinese: "black and white vertical stripes, black shorts, white socks",
  Sassuolo: "green and black vertical stripes, black shorts, green socks",
  Génova: "red jersey with deep navy blue sleeves cuffs, navy shorts, red socks",
  Cagliari: "red and navy blue vertical stripes, navy shorts, red socks",
  "Hellas Verona": "yellow jersey with navy blue trim, navy shorts, yellow socks",
  Empoli: "bright azure jersey with white trim, white shorts, blue socks",
  Parma: "white jersey with a yellow and blue chest cross, white shorts",
  Monza: "red and white vertical stripes with a wide white chest band, red shorts",
  "Como": "dark royal blue jersey with a white collar, dark blue shorts, white socks",
  Cesena: "white jersey with black trim and a black chest band, black shorts",
  Carrarese: "yellow jersey with blue trim, blue shorts, yellow socks",
  Südtirol: "white jersey with red trim, red shorts, white socks",
  Pisa: "black and royal blue vertical stripes, black shorts, black socks",
  Cittadella: "burgundy jersey with white trim, white shorts, burgundy socks",
  Spezia: "all white jersey with thin black trim, white shorts",
  Palermo: "pink jersey with black trim, black shorts, pink socks",
  Catanzaro: "red and yellow vertical stripes, red shorts",
  // Francia
  "OGC Niza": "red and black vertical stripes, black shorts, red socks",
  "Stade Rennais": "red jersey with black sleeves, black shorts, red socks",
  "RC Lens": "bright yellow jersey with red trim, red shorts, yellow socks",
  "Stade de Reims": "red jersey with white collar and cuffs, red shorts, white socks",
  "FC Nantes": "bright yellow jersey with green trim, green shorts, yellow socks",
  "RC Estrasburgo": "royal blue jersey with fine white pinstripes, blue shorts, blue socks",
  "Montpellier HSC": "navy blue jersey with orange trim, navy shorts, orange socks",
  "Toulouse FC": "deep purple jersey with white trim, purple shorts, purple socks",
  "FC Lorient": "bright orange jersey with a black collar, white shorts, orange socks",
  "Stade Brestois": "red jersey with white trim, white shorts, red socks and white sleeve stripes",
  "Le Havre AC": "sky blue jersey with dark navy trim, navy shorts, sky blue socks",
  "FC Metz": "garnet red jersey with white trim, garnet shorts, garnet socks",
  "AJ Auxerre": "white jersey with a thin blue trim, white shorts, white socks",
  "US Quevilly": "red jersey with black trim, black shorts, red socks and black cuffs",
  "Annecy FC": "red jersey with white details, white shorts, red socks and white collar",
  "Red Star FC": "green and white horizontal hoops, white shorts, green socks",
  "FC Versailles": "navy blue jersey with gold trim, navy shorts, gold socks",
  "Rodez AF": "red and yellow vertical stripes with black trim, black shorts, red socks",
  "Chamois Niortais": "mid blue jersey with white shoulders and a white collar, navy shorts, blue socks",
  "Bergerac": "deep wine-red jersey with a white chest band, white shorts, wine-red socks",
  Concarneau: "dark navy blue jersey with light blue trim, navy shorts",
  // Arabia Saudí
  "Al-Shabab": "all white jersey with a green trim, white shorts",
  "Al-Ettifaq": "green jersey with white trim, green shorts, green socks",
  "Al-Fateh": "green jersey with black trim, green shorts and green socks",
  "Al-Taawoun": "orange jersey with black sleeves, black shorts, black socks",
  "Al-Raed": "red jersey with a white vertical stripe on the chest, white shorts, red socks",
  "Al-Fayha": "light blue jersey with white trim, blue shorts, light blue socks",
  "Damac FC": "royal blue jersey with white trim, blue shorts, royal blue socks",
  "Al-Khaleej": "bright yellow jersey with white trim, white shorts, yellow socks",
  "Al-Okhdood": "deep red jersey with black trim, black shorts, red socks",
  "Al-Riyadh": "navy blue jersey with gold trim, navy shorts, navy socks",
  "Al-Wehda": "red and white vertical stripes with white sleeves, white shorts",
  "Abha Club": "all royal blue jersey with white trim, blue shorts",
  "Al-Hazem": "dark green jersey with yellow trim, green shorts, yellow socks",
  "Al-Tai": "yellow jersey with green trim, green shorts, yellow socks",
  "Al-Jabalain": "white jersey with a purple trim, purple shorts, white socks",
  "Al-Qadsiah": "yellow jersey with a black chest band, black shorts, yellow socks",
  "Al-Najma": "royal blue jersey with a red chest band, red shorts",
  "Al-Orobah": "white jersey with green sleeves, green shorts, white socks",
  "Al-Batin": "maroon jersey with white trim, white shorts, maroon socks",
  "Al-Kholood": "white jersey with black trim and a red chest stripe, white shorts",
  "Hajer FC": "yellow jersey with red trim, red shorts, yellow socks",
  "Al-Arabi": "all white jersey with red trim, red shorts",
};

const NAMED_COLORS: [string, [number, number, number]][] = [
  ["white", [255, 255, 255]], ["black", [0, 0, 0]], ["red", [200, 16, 46]], ["dark red", [128, 0, 32]], ["orange", [255, 120, 0]], ["yellow", [253, 225, 0]], ["gold", [212, 160, 23]],
  ["light green", [120, 200, 80]], ["green", [0, 140, 70]], ["dark green", [0, 80, 40]], ["sky blue", [108, 171, 221]], ["royal blue", [0, 61, 165]], ["navy blue", [0, 32, 91]],
  ["purple", [110, 30, 120]], ["pink", [240, 130, 170]], ["grey", [130, 130, 130]], ["brown", [110, 70, 40]], ["teal", [0, 128, 128]],
];

/** Un color en palabras («royal blue»): los modelos de imagen no entienden «#003DA5». */
export function colorName(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "neutral";
  const n = parseInt(m[1], 16);
  const rgb: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  let best = NAMED_COLORS[0];
  let bestD = Infinity;
  for (const c of NAMED_COLORS) {
    const d = (c[1][0] - rgb[0]) ** 2 + (c[1][1] - rgb[1]) ** 2 + (c[1][2] - rgb[2]) ** 2;
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best[0];
}
