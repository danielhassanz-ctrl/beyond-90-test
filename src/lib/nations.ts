/**
 * La nacionalidad se escribe libre al crear el jugador (no es un desplegable
 * fijo), así que para saber si le toca Eurocopa o Copa América hay que
 * normalizar el texto y compararlo contra listas de selecciones conocidas.
 * Si no reconoce el país, no se activan estos torneos continentales (el
 * Mundial, al ser universal, no depende de esto).
 */
const UEFA_NATIONS = [
  "españa",
  "francia",
  "alemania",
  "italia",
  "inglaterra",
  "portugal",
  "paises bajos",
  "holanda",
  "belgica",
  "croacia",
  "suiza",
  "polonia",
  "austria",
  "dinamarca",
  "suecia",
  "noruega",
  "gales",
  "escocia",
  "irlanda",
  "irlanda del norte",
  "serbia",
  "ucrania",
  "rusia",
  "turquia",
  "grecia",
  "rumania",
  "hungria",
  "republica checa",
  "chequia",
  "eslovaquia",
  "eslovenia",
  "bosnia",
  "islandia",
  "finlandia",
  "albania",
  "montenegro",
  "macedonia del norte",
  "georgia",
  "israel",
];

const CONMEBOL_NATIONS = [
  "argentina",
  "brasil",
  "uruguay",
  "colombia",
  "chile",
  "peru",
  "ecuador",
  "paraguay",
  "bolivia",
  "venezuela",
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// Las listas de arriba tienen alguna entrada escrita con tilde/eñe
// ("españa") que nunca coincidía contra el texto YA normalizado del
// jugador ("espana") — comparar "espana" contra "españa" tal cual es
// simplemente falso, letra por letra. Con esto, CUALQUIER jugador con
// nacionalidad "España" (la más común con diferencia, siendo un juego en
// castellano) quedaba excluido para siempre de la Eurocopa y su
// clasificación — el bug más grave posible en este archivo, justo en el
// caso más frecuente. Normalizando también las listas de una vez, este
// tipo de error no puede volver a colarse aunque alguien añada otra
// entrada con acentos en el futuro.
const UEFA_NATIONS_NORMALIZED = UEFA_NATIONS.map(normalize);
const CONMEBOL_NATIONS_NORMALIZED = CONMEBOL_NATIONS.map(normalize);

export type Confederation = "UEFA" | "CONMEBOL";

export function getConfederation(nation: string): Confederation | null {
  const normalized = normalize(nation);
  if (UEFA_NATIONS_NORMALIZED.includes(normalized)) return "UEFA";
  if (CONMEBOL_NATIONS_NORMALIZED.includes(normalized)) return "CONMEBOL";
  return null;
}

/**
 * El nombre «de diccionario» de una selección a partir de lo que escribió el jugador («espana», «Holanda», «EEUU»…): la camiseta
 * de la selección se busca por este nombre exacto. Si no se reconoce, se devuelve el texto tal cual (sin tocar).
 */
const CANONICAL_NATIONS = [
  "España", "Francia", "Alemania", "Italia", "Inglaterra", "Portugal", "Países Bajos", "Bélgica", "Croacia", "Suiza", "Polonia", "Austria", "Dinamarca",
  "Suecia", "Noruega", "Gales", "Escocia", "Irlanda", "Serbia", "Ucrania", "Turquía", "Grecia", "Argentina", "Brasil", "Uruguay", "Colombia", "Chile",
  "Perú", "Ecuador", "Paraguay", "Bolivia", "Venezuela", "México", "Estados Unidos", "Canadá", "Marruecos", "Senegal", "Nigeria", "Egipto", "Japón",
  "Corea del Sur", "Australia", "Costa Rica",
];
const NATION_ALIASES: Record<string, string> = {
  holanda: "Países Bajos", "paises bajos": "Países Bajos", netherlands: "Países Bajos", usa: "Estados Unidos", eeuu: "Estados Unidos", "ee uu": "Estados Unidos",
  "ee.uu.": "Estados Unidos", "estados unidos de america": "Estados Unidos", spain: "España", france: "Francia", germany: "Alemania", italy: "Italia", england: "Inglaterra",
  brazil: "Brasil", belgium: "Bélgica", croatia: "Croacia", switzerland: "Suiza", poland: "Polonia", denmark: "Dinamarca", mexico: "México", japan: "Japón",
  morocco: "Marruecos", peru: "Perú",
};

export function canonicalNation(raw: string | null | undefined): string {
  const text = String(raw ?? "").trim();
  if (!text) return text;
  const key = normalize(text).replace(/\s+/g, " ");
  const alias = NATION_ALIASES[key];
  if (alias) return alias;
  return CANONICAL_NATIONS.find((n) => normalize(n) === key) ?? text;
}
