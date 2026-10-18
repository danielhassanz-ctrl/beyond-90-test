/**
 * TEMAS REPETIDOS ENTRE BOLSAS. El juego tiene varias bolsas de escenas (events-data, el banco, los módulos de código) y el mismo tema
 * existía en dos o tres: el documental, el podcast, el paparazzi, el tuit antiguo… Cada bolsa vigilaba solo sus propios ids, así que
 * un jugador podía vivir «el documental» tres veces con otro título. Aquí se agrupan: si ya salió UNA escena de un grupo, las demás se
 * dan por vividas. Un id que termina en «*» es un prefijo (las escenas de código llevan la semana al final).
 */
export const THEME_GROUPS: string[][] = [
  ["fama-documental", "bank-pr-documental", "bank-c3-documental"],
  ["fama-podcast-estrella", "bank-pr-podcast", "bank-c3-podcast"],
  ["fama-portada-revista", "prensa-portada"],
  ["fama-videojuego", "bank-pr-videojuego"],
  ["pre-paparazzi", "vid-paparazzi-cita", "fama-paparazzi-cena", "bank-dc-paparazzi", "bank-dc-paparazzi-pareja"],
  ["esp-doble", "bank-sr-doble"],
  ["fama-fan-club", "bank-ca-fan-club"],
  ["bank-rd-tuit-viejo", "bank-dc-redes-polemica", "prensa-tuit-antiguo*"],
  ["bank-tr-dorsal", "bank-fv-dorsal"],
  ["ent-bronca-tarde", "bank-dc-tarde-entreno"],
];

const matches = (entry: string, id: string) => (entry.endsWith("*") ? id.startsWith(entry.slice(0, -1)) : id === entry);

/** Los ids ya vividos más, por cada grupo con una escena vivida, todas las demás del grupo (para que no vuelvan con otro título). */
export function expandThemeUsed(used: readonly string[]): string[] {
  const out = new Set(used);
  for (const group of THEME_GROUPS) {
    if (used.some((id) => group.some((entry) => matches(entry, id)))) {
      for (const entry of group) if (!entry.endsWith("*")) out.add(entry);
    }
  }
  return [...out];
}
