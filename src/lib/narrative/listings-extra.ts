/**
 * Más catálogo de propiedades y caprichos: casas, mansiones, coches, motos, yates y jets privados. Cada entrada lleva su
 * rango de precio y el prompt de su foto; events.ts los añade a los catálogos de siempre, y cada ciudad enseña una selección
 * distinta (ver pickSeeded en events.ts). Los precios respetan el suelo de cada catálogo para no cambiar cuándo se puede pagar.
 */
interface Listing {
  name: string;
  min: number;
  max: number;
  prompt: string;
}
interface MansionListing extends Listing {
  coastal: boolean;
}

const home = (name: string, min: number, max: number, desc: string): Listing => ({
  name,
  min,
  max,
  prompt: `Real estate photography, ${desc}, daylight, professional listing photo, photorealistic, no people`,
});
const mansion = (name: string, min: number, max: number, coastal: boolean, desc: string): MansionListing => ({
  name,
  min,
  max,
  coastal,
  prompt: `Real estate photography, ${desc}, bright daylight, professional listing photo, photorealistic, no people`,
});
const car = (name: string, min: number, max: number, desc: string): Listing => ({
  name,
  min,
  max,
  prompt: `Automotive photography, ${desc}, daylight, professional listing photo, photorealistic, no people, no visible brand logos`,
});
const boat = (name: string, min: number, max: number, desc: string): Listing => ({
  name,
  min,
  max,
  prompt: `Real estate photography, ${desc}, bright daylight, professional listing photo, photorealistic, no people`,
});
const moto = (name: string, min: number, max: number, desc: string): Listing => ({
  name,
  min,
  max,
  prompt: `Motorcycle photography, ${desc}, daylight, professional listing photo, photorealistic, no people, no visible brand logos`,
});

export const EXTRA_HOMES: Listing[] = [
  home("Casa de pueblo reformada con bodega", 95000, 140000, "renovated stone village house with a wooden door and a small vineyard, warm light"),
  home("Piso con terraza interior en un edificio con patio", 92000, 132000, "bright apartment with an inner courtyard terrace full of plants in an old city building"),
  home("Casa con vistas a la montaña", 120000, 170000, "mountain-view house with a large porch and pine trees, clear sky"),
  home("Estudio de diseño en un edificio nuevo", 90000, 125000, "compact design studio apartment in a brand-new glass building, minimalist balcony"),
  home("Ático dúplex con claraboya", 150000, 200000, "duplex penthouse with a skylight and a rooftop terrace, modern building"),
  home("Casa baja con jardín trasero y barbacoa", 100000, 148000, "single-storey house with a back garden and a built-in barbecue area"),
  home("Piso en un edificio modernista", 125000, 175000, "apartment in an art-nouveau building with a decorated facade and tall windows"),
  home("Apartamento a cinco minutos de la playa", 105000, 150000, "light apartment building near a beach with palm trees and sea air"),
  home("Chalet adosado en una urbanización con pista de pádel", 118000, 165000, "terraced villa in a residential complex with a padel court and shared pool"),
  home("Piso reformado con cocina de isla", 112000, 158000, "freshly renovated apartment building exterior with large windows and warm lighting"),
  home("Casa de dos plantas en una calle arbolada", 115000, 160000, "two-storey house on a quiet tree-lined street with a garden fence"),
  home("Loft con altillo cerca de la universidad", 92000, 130000, "loft building with large factory windows near a university campus"),
  home("Piso con vistas al estadio", 98000, 138000, "apartment building whose balconies overlook a football stadium at dusk"),
  home("Bajo con patio y limonero", 96000, 136000, "ground-floor home with a whitewashed patio and a lemon tree"),
  home("Casa pareada con garaje doble", 128000, 178000, "semi-detached house with a double garage and a neat front garden"),
  home("Ático con solárium y vistas al puerto", 148000, 202000, "penthouse with a sun deck and a view over a harbour, golden light"),
  home("Piso en la última planta con ascensor panorámico", 135000, 185000, "top-floor apartment in a building with a glass panoramic lift, city view"),
  home("Casa de piedra rehabilitada junto a un río", 108000, 156000, "restored stone house beside a river with a small wooden bridge"),
  home("Apartamento con gimnasio y coworking en el edificio", 118000, 168000, "modern apartment tower with a gym and a coworking lounge on the ground floor"),
  home("Piso exterior luminoso con tres balcones", 100000, 142000, "bright exterior apartment with three balconies full of flowers on a lively street"),
  home("Chalet con porche y huerto", 122000, 172000, "family villa with a wooden porch and a vegetable garden"),
  home("Estudio con vistas al puerto deportivo", 94000, 134000, "small apartment building overlooking a marina with sailing boats"),
  home("Piso con techos altos en un antiguo edificio de oficinas", 118000, 166000, "converted office building apartment with very high ceilings and big arched windows"),
  home("Dúplex con terraza y vistas al río", 140000, 190000, "duplex with a large terrace overlooking a river and old bridges"),
  home("Casa blanca con patio y bugambilias", 110000, 155000, "whitewashed house with a courtyard and bougainvillea flowers"),
  home("Piso nuevo en una torre con piscina en la azotea", 150000, 214000, "new residential tower with a rooftop swimming pool and city skyline"),
];

export const EXTRA_MANSIONS: MansionListing[] = [
  mansion("Villa blanca de diseño frente al mar", 2400000, 3600000, true, "white contemporary villa with infinity pool facing the sea and glass railings"),
  mansion("Mansión con pista de pádel y spa", 2000000, 3000000, false, "large mansion with a padel court, a spa wing and a long swimming pool"),
  mansion("Casa de campo con cuadras y caballos", 1600000, 2600000, false, "countryside estate with horse stables, paddocks and a stone main house"),
  mansion("Villa con embarcadero propio", 2800000, 4200000, true, "waterfront villa with a private wooden jetty and a boat moored in front"),
  mansion("Palacete urbano rehabilitado", 2200000, 3400000, false, "restored urban palace with a stone facade, a courtyard fountain and tall windows"),
  mansion("Casa de montaña con vistas a las pistas de esquí", 1500000, 2400000, false, "luxury chalet in the mountains with wooden balconies, snow and ski slopes behind"),
  mansion("Cortijo de lujo con olivar", 1400000, 2200000, false, "luxury Andalusian farmhouse with whitewashed walls, olive groves and a pool"),
  mansion("Ático de dos plantas con piscina privada", 2000000, 3200000, false, "two-floor penthouse with a private rooftop pool and a skyline view at golden hour"),
  mansion("Villa en un acantilado con piscina infinita", 3000000, 4800000, true, "cliff-top villa with an infinity pool above the sea at sunset"),
  mansion("Mansión minimalista de hormigón y cristal", 2400000, 3800000, false, "minimalist concrete and glass mansion with a reflecting pool and a lawn"),
  mansion("Casa colonial con jardín tropical", 1800000, 2800000, true, "colonial-style house with white columns and a lush tropical garden near the coast"),
  mansion("Castillo pequeño reformado", 3500000, 5500000, false, "small renovated castle with a tower, stone walls and a manicured garden"),
  mansion("Villa con campo de golf privado", 3200000, 5000000, false, "grand villa overlooking a private golf course with a clubhouse feel"),
  mansion("Residencia con helipuerto en lo alto de una colina", 4000000, 6500000, false, "hilltop residence with a helipad, a long pool and a panoramic valley view"),
];

export const EXTRA_CARS: Listing[] = [
  car("Berlina eléctrica de lujo", 90000, 140000, "sleek luxury electric saloon parked in front of a glass office building"),
  car("Familiar deportivo con maletero enorme", 70000, 105000, "fast estate car with a roof rack parked on a tree-lined street"),
  car("Cupé italiano de motor central", 220000, 330000, "mid-engine Italian-style coupe in red parked on a stone plaza"),
  car("Todoterreno de expedición preparado", 85000, 130000, "expedition-ready off-road vehicle with a roof tent and big tyres on a dirt road"),
  car("Descapotable alemán de cuatro plazas", 95000, 150000, "four-seat German-style convertible with the roof down on a coastal road"),
  car("Hatchback eléctrico urbano de diseño", 38000, 52000, "compact designer electric hatchback in a bright city street"),
  car("Furgoneta camperizada de lujo", 70000, 110000, "luxury camper van with a pop-up roof parked at a scenic viewpoint"),
  car("Muscle car americano de edición especial", 80000, 130000, "American muscle car with racing stripes parked at a diner at dusk"),
  car("Coupé japonés de tracción total", 60000, 95000, "Japanese-style all-wheel-drive coupe with a big rear wing on a mountain road"),
  car("Limusina con chófer a tiempo parcial", 150000, 230000, "long black limousine parked outside a grand hotel entrance"),
  car("Berlina clásica de los sesenta restaurada", 110000, 170000, "restored 1960s luxury saloon in cream with chrome details parked in front of a villa"),
  car("SUV coupé de altas prestaciones", 100000, 160000, "high-performance coupe SUV with sharp lines parked in an underground garage"),
  car("Deportivo de pista homologado", 170000, 260000, "track-focused road-legal sports car with an aerodynamic body parked in a pit lane"),
  car("Réplica de rally de homologación", 55000, 80000, "rally-inspired hatchback with mud flaps and fog lights parked at a forest stage"),
  car("Cabrio vintage inglés de dos plazas", 75000, 120000, "vintage British two-seat convertible in dark green parked beside a stone wall"),
  car("Monovolumen de lujo para toda la familia", 85000, 125000, "luxury people carrier with sliding doors parked in front of a family home"),
  car("Gran turismo de motor delantero", 160000, 240000, "front-engine grand tourer in silver on an empty mountain road"),
  car("Eléctrico de aceleración brutal", 120000, 190000, "very fast electric performance car on a night street with blue light reflections"),
  car("Buggy de playa personalizado", 45000, 70000, "customised dune buggy with oversized tyres on a sandy beach"),
  car("Todoterreno blindado discreto", 180000, 260000, "discreet armoured SUV in dark grey parked outside a private residence"),
  car("Deportivo compacto de edición numerada", 90000, 130000, "numbered limited-edition compact sports car with special paint in a modern showroom"),
  car("Berlina de representación con matrícula especial", 100000, 150000, "formal executive saloon in black parked in front of a stadium VIP entrance"),
  car("Coche de carreras de los ochenta para coleccionistas", 300000, 500000, "1980s collector racing car with bold livery displayed in an old garage"),
  car("Pickup eléctrica de diseño", 90000, 135000, "futuristic electric pickup truck with angular design parked at a modern ranch"),
  car("Mini clásico retocado", 38000, 60000, "classic small British hatchback customised with racing stripes on a cobbled street"),
  car("Hiperdeportivo de serie numerada", 500000, 800000, "numbered-series hypercar with a carbon body in a dramatic dark studio"),
];

export const EXTRA_YACHTS: Listing[] = [
  boat("Lancha rápida deportiva de 9 metros", 85000, 140000, "fast 9-metre sport boat on calm blue water with a white wake"),
  boat("Velero de crucero de 12 metros", 180000, 300000, "12-metre cruising sailboat with white sails in a bay"),
  boat("Catamarán de recreo de 11 metros", 250000, 420000, "11-metre cruising catamaran anchored near a beach"),
  boat("Yate clásico de madera restaurado", 380000, 620000, "restored classic wooden motor yacht with varnished decks in a harbour"),
  boat("Superyate de 24 metros", 2200000, 3500000, "24-metre luxury motor yacht with a flybridge anchored near a rocky coast"),
  boat("Yate de pesca deportiva", 220000, 380000, "sport-fishing yacht with outriggers cruising on open sea"),
  boat("Velero de regatas", 300000, 520000, "sleek racing sailboat leaning into the wind with carbon mast"),
  boat("Barco de recreo con cubierta de teca", 130000, 210000, "elegant day boat with a teak deck and cream cushions in a marina"),
  boat("Yate de 30 metros con helipuerto", 5000000, 8000000, "30-metre superyacht with a small helipad on the bow at anchor"),
  boat("Catamarán de lujo con piscina en popa", 1100000, 1800000, "luxury catamaran with a stern pool and sundeck anchored in turquoise water"),
  boat("Goleta clásica de dos palos", 900000, 1500000, "classic two-mast schooner with dark hull and white sails at sunset"),
  boat("Neumática de lujo con motor doble", 60000, 95000, "luxury rigid inflatable boat with twin engines skimming over the water"),
  boat("Yate de expedición con clase polar", 3500000, 5500000, "expedition yacht with a strong steel hull and a crane, cold blue sea"),
  boat("Superyate de 40 metros con cine a bordo", 9000000, 14000000, "40-metre superyacht with several decks, anchored in a Mediterranean bay"),
];

export const EXTRA_JETS: Listing[] = [
  boat("Turbohélice privado para pistas cortas", 2200000, 3200000, "private turboprop airplane parked on a small grass airfield"),
  boat("Jet ligero de seis plazas", 3000000, 4500000, "light six-seat private jet parked in front of a hangar"),
  boat("Jet ejecutivo de cabina ancha", 8000000, 13000000, "wide-body business jet on a tarmac with stairs lowered at sunrise"),
  boat("Jet de largo alcance con dormitorio", 12000000, 19000000, "large long-range private jet with a polished fuselage on a tarmac at dusk"),
  boat("Jet de lujo con salón y ducha", 14000000, 22000000, "ultra-luxury private jet parked beside a VIP terminal, glossy white paint"),
  boat("Jet ejecutivo clásico, muy cuidado", 3500000, 5500000, "classic business jet with a well-kept fuselage on a quiet airfield"),
  boat("Helicóptero privado de lujo", 2500000, 4000000, "luxury private helicopter on a helipad at the edge of a city rooftop"),
  boat("Jet de cabina media con cocina y wifi", 7000000, 10000000, "midsize private jet with big oval windows on a sunny tarmac"),
  boat("Avión de entrenamiento restaurado", 2400000, 3400000, "restored vintage jet trainer in bright paint on a runway"),
];

export const MOTO_LISTINGS: Listing[] = [
  moto("Naked deportiva de 800 cc", 15000, 22000, "sporty naked motorcycle parked on a city street, angular lights"),
  moto("Superbike de pista", 28000, 45000, "high-performance superbike with a carbon fairing in a pit garage"),
  moto("Custom de estilo clásico", 22000, 38000, "classic custom cruiser with chrome details parked on a desert road"),
  moto("Trail de aventura de gran cilindrada", 18000, 30000, "large adventure motorcycle with panniers on a gravel mountain road"),
  moto("Café racer artesanal", 20000, 35000, "handmade café racer with a leather seat in front of an old brick garage"),
  moto("Scrambler retro", 14000, 22000, "retro scrambler motorcycle with knobbly tyres leaning against a wooden fence"),
  moto("Moto de enduro de competición", 14000, 22000, "competition enduro motorcycle covered in mud on a forest trail"),
  moto("Gran turismo de largo recorrido", 24000, 38000, "long-distance touring motorcycle with a large windscreen on a coastal road"),
  moto("Moto eléctrica de altas prestaciones", 22000, 36000, "high-performance electric motorcycle with futuristic lines in a clean studio"),
  moto("Cruiser americana de edición limitada", 26000, 42000, "limited-edition American cruiser with chrome pipes on an open highway"),
  moto("Moto de carreras de homologación", 40000, 70000, "race-bred homologated motorcycle with a tricolour livery in a paddock"),
  moto("Supermotard urbana", 14000, 20000, "agile supermotard with small wheels on a sunny city street"),
  moto("Moto clásica italiana restaurada", 30000, 55000, "restored classic Italian motorcycle with polished tank in a cobbled square"),
  moto("Hiper-naked de 200 CV", 25000, 40000, "aggressive hyper-naked motorcycle with exposed frame on a mountain pass"),
  moto("Sidecar vintage restaurado", 28000, 48000, "restored vintage motorcycle with a sidecar on a country lane"),
  moto("Moto de colección de los años cincuenta", 45000, 90000, "collectable 1950s motorcycle with fine chrome and leather, displayed in a classic garage"),
];
