/** Las chicas de las redes con cara propia (fotos generadas por IA de personas que no existen, en public/chicas). */
const FOTOS: Record<string, string> = {
  "Alma Ferrer": "/chicas/alma.jpg",
  "Nerea Solano": "/chicas/nerea.jpg",
  "Candela Ruiz": "/chicas/candela.jpg",
  "Lola Quintero": "/chicas/lola.jpg",
};

/** La foto de tu pareja si es una de ellas; null para el resto de parejas. */
export const chicaPhoto = (name: string | boolean | null | undefined): string | null =>
  typeof name === "string" && FOTOS[name] ? FOTOS[name] : null;
