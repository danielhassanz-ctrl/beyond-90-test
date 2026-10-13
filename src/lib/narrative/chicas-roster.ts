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

const NOMBRES: Record<string, string> = { alma: "Alma Ferrer", nerea: "Nerea Solano", candela: "Candela Ruiz", lola: "Lola Quintero" };
const ESTADOS: Record<string, string> = {
  dm: "Os escribís por redes: aún no habéis quedado.",
  cena: "Habéis tenido vuestra primera cita. Lo siguiente depende de ti.",
  rumor: "Salís en la prensa del corazón. Toca decidir qué sois.",
  pausa: "Lo habéis dejado en pausa por ahora.",
};

/** La chica con la que tienes una historia abierta (sin ser pareja todavía), con su foto y cómo va la cosa. */
export function chicaEnCurso(flags: Record<string, string | boolean> | null | undefined): { name: string; photo: string | null; estado: string } | null {
  const key = typeof flags?.ch_en_curso === "string" ? flags.ch_en_curso : "";
  if (!key || !NOMBRES[key] || flags?.pareja) return null;
  const progreso = String(flags?.[`ch_${key}`] ?? "dm");
  return { name: NOMBRES[key], photo: FOTOS[NOMBRES[key]] ?? null, estado: ESTADOS[progreso] ?? ESTADOS.dm };
}
