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

export type Confederation = "UEFA" | "CONMEBOL";

export function getConfederation(nation: string): Confederation | null {
  const normalized = normalize(nation);
  if (UEFA_NATIONS.includes(normalized)) return "UEFA";
  if (CONMEBOL_NATIONS.includes(normalized)) return "CONMEBOL";
  return null;
}
