/**
 * Evolución del look del jugador con la edad: pedido explícitamente por el
 * usuario ("que la cara evolucione con la edad, salga barba, se deje
 * coleta, se rape") y que se había quedado sin implementar. Cada tramo de
 * edad tiene varias variantes posibles; cuál le toca a cada jugador se
 * decide con un hash de su semilla (normalmente el nombre), así que:
 * - Dentro de una misma carrera, el look es estable mientras esté en el
 *   mismo tramo de edad (no cambia de golpe entre dos fotos seguidas).
 * - Al cruzar de tramo, el look cambia — eso es la "evolución".
 * - Entre partidas distintas, dos jugadores en el mismo tramo de edad
 *   pueden tener looks distintos, aportando variedad extra.
 */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const LOOK_BRACKETS: { maxAge: number; variants: string[] }[] = [
  {
    maxAge: 18,
    variants: [
      "clean-shaven face, short neat rookie haircut",
      "clean-shaven face, short buzzed haircut",
    ],
  },
  {
    maxAge: 23,
    variants: [
      "light stubble, short modern fade haircut",
      "clean-shaven face, slightly longer textured haircut",
    ],
  },
  {
    maxAge: 28,
    variants: [
      "well-groomed short beard, modern fade haircut",
      "clean-shaven face, hair styled back",
    ],
  },
  {
    maxAge: 32,
    variants: [
      "fuller beard, hair pulled back into a short ponytail",
      "well-groomed beard, fully shaved head",
    ],
  },
  {
    maxAge: Infinity,
    variants: [
      "greying full beard, fully shaved head, showing the wear of a long veteran career",
      "greying beard, hair pulled back into a ponytail, veteran look",
      "clean-shaven weathered face, closely shaved greying hair, veteran look",
    ],
  },
];

export function describeLook(age: number, seed: string): string {
  const bracketIndex = LOOK_BRACKETS.findIndex((b) => age <= b.maxAge);
  const bracket = LOOK_BRACKETS[bracketIndex === -1 ? LOOK_BRACKETS.length - 1 : bracketIndex];
  // Se mete el índice del tramo en el hash para que cambiar de tramo
  // pueda cambiar también de variante dentro del nuevo tramo, no solo
  // heredar la misma posición por casualidad.
  const variant = bracket.variants[hashString(`${seed}:${bracketIndex}`) % bracket.variants.length];
  return variant;
}
