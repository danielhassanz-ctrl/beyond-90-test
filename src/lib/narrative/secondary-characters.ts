import type { Player } from "@/types/player";

export interface SecondaryCharacter {
  id: string;
  name: string;
  type: "amigo_infancia" | "rival_cantera" | "entrenador_viejo" | "expareja" | "compañero_primeros_años";
  introducedWeek: number;
  lastSeenWeek: number;
  relationship: "amistoso" | "neutral" | "competitivo" | "resentido" | "romantico";
  club?: string; // donde está ahora o estaba
}

// Ampliado desde el pool de 6-8 nombres original con el banco más grande
// que ya existía en narrative-content.ts (24 por categoría) pero que
// nunca se conectó aquí — con solo 6-8 nombres, cualquier carrera larga
// empezaba a repetir "Javi" o "Laura" para gente completamente distinta.
const SECONDARY_CHARACTER_NAMES: Record<string, string[]> = {
  amigo_infancia: [
    "Javi", "Carlos", "Miguel", "Sergio", "David", "Pablo", "Álvaro", "Dani",
    "Javier", "Rubén", "Iñaki", "Xabi", "Aitor", "Jon", "Mikel", "Gorka",
    "Edu", "Fran", "Nacho", "Luismi", "Roberto", "Jesús", "Antonio", "Vicente",
  ],
  rival_cantera: [
    "Rafa", "Iñigo", "Adrián", "Jon", "Joselu", "Saúl", "Lucas", "Iker",
    "Borja", "Diego", "Héctor", "Tomás", "Fernando", "Juanma", "Mateo",
    "Raúl", "Enrique", "Óscar", "Marcos",
  ],
  entrenador_viejo: [
    "Don Luis", "Pepe Murcia", "Rafael López", "Miguel Ángel", "Manolo", "Carlos Díaz",
    "Paco González", "Vicente Moreno", "Juan Carlos", "Ernesto", "Jesús Gil", "Paco Jémez",
  ],
  expareja: [
    "Laura", "María", "Andrea", "Elena", "Sofía", "Carolina", "Isabel", "Teresa",
    "Cristina", "Beatriz", "Alejandra", "Natalia", "Victoria", "Patricia", "Lucía", "Marta",
    "Rosa", "Ana", "Esther", "Lorena", "Verónica", "Paloma", "Rocío", "Silvia",
  ],
  compañero_primeros_años: [
    "Borja", "Juanma", "Fernando", "Diego", "Tomás", "Héctor", "Raúl", "Óscar",
    "Mateo", "Enrique", "Roberto", "Javier", "Dani", "Fran", "Nacho", "Pepe",
    "Quique", "Edu", "José", "Vicente", "Rubén",
  ],
};

/**
 * Introduce un personaje secundario en un evento. Usado cuando la IA genera
 * un evento que menciona a alguien del pasado (amigo, rival, entrenador).
 * Se almacena en flags para que reaparezca años después.
 */
export function trackSecondaryCharacter(
  player: Player,
  characterType: SecondaryCharacter["type"],
  characterName: string,
  relationship: SecondaryCharacter["relationship"],
  club?: string,
): Player {
  if (!player.flags) player.flags = {};

  const charKey = `sec_char_${characterType}_${Date.now()}`;
  const char: SecondaryCharacter = {
    id: charKey,
    name: characterName,
    type: characterType,
    introducedWeek: player.week,
    lastSeenWeek: player.week,
    relationship,
    club,
  };

  player.flags[charKey] = JSON.stringify(char);
  return player;
}

/**
 * Lee todos los personajes secundarios del jugador del historial.
 *
 * Antes esto se cacheaba en un Map en memoria del proceso, indexado por
 * player.id (mismo patrón, y mismo bug, que tenía getAdversityTracker en
 * adversity.ts). En un entorno serverless un mismo proceso puede atender
 * varias peticiones seguidas, y encima nada invalidaba la caché al
 * introducir un personaje nuevo (trackSecondaryCharacter nunca la
 * tocaba) — un personaje recién guardado en player.flags podía quedar
 * invisible para pickCharacterToReappear durante el resto de vida de esa
 * instancia caliente, porque getSecondaryCharacters seguía devolviendo
 * la lista vieja cacheada. El JSON.parse de un puñado de flags pequeños
 * no compensa ese riesgo: mejor leer siempre el valor fresco.
 */
export function getSecondaryCharacters(player: Player): SecondaryCharacter[] {
  if (!player.flags) return [];

  const characters: SecondaryCharacter[] = [];
  for (const [key, value] of Object.entries(player.flags)) {
    if (key.startsWith("sec_char_") && typeof value === "string") {
      try {
        characters.push(JSON.parse(value));
      } catch {
        // skip invalid entries
      }
    }
  }

  return characters;
}

/**
 * Elige un personaje al azar para que reaparezca en un evento.
 * Solo considera personajes que no han sido vistos en al menos 20 semanas.
 * Probabilidad aumenta cuanto más tiempo ha pasado desde último encuentro.
 */
export function pickCharacterToReappear(player: Player): SecondaryCharacter | null {
  const characters = getSecondaryCharacters(player);
  if (characters.length === 0) return null;

  // Filtrar: solo personajes que no han sido vistos recientemente
  const oldCharacters = characters.filter((c) => player.week - c.lastSeenWeek >= 20);
  if (oldCharacters.length === 0) return null;

  // Ponderar por tiempo transcurrido: más tiempo = más chance
  const weighted = oldCharacters.map((c) => ({
    char: c,
    weight: Math.min(1, (player.week - c.lastSeenWeek) / 100), // normalizar a [0,1]
  }));

  // Seleccionar según pesos
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  for (const { char, weight } of weighted) {
    random -= weight;
    if (random <= 0) return char;
  }

  return oldCharacters[0];
}

/**
 * Genera una escena narrativa donde reaparece un personaje del pasado.
 * Usado por la IA para crear eventos emocionales.
 */
export function describeCharacterReappearance(
  character: SecondaryCharacter,
  player: Player,
): string {
  const weeksSinceLastSeen = player.week - character.lastSeenWeek;
  // 10 semanas = 1 año en la escala del juego (ver playerAge en
  // types/career.ts), no 52 — con /52 alguien ausente 100 semanas (10
  // años de verdad en esta escala) salía diciendo "ha pasado 1 año".
  const yearsSince = Math.floor(weeksSinceLastSeen / 10);

  const typeDescriptions: Record<string, string> = {
    amigo_infancia:
      `Tu amigo de toda la vida, ${character.name}, de repente aparece en el foco. Lo reconoces al instante, aunque han pasado ${yearsSince} años. Se cruzan en un evento, en redes sociales, o simplemente en la calle. Sigue viviendo en vuestro pueblo — él tomó otros caminos.`,
    rival_cantera:
      `${character.name}, tu rival de cantera, ha reaparecido en el fútbol profesional. Juega en otra liga o categoría, pero sus nombres siguen apareciendo en comparaciones. ¿Quién llegó más lejos? La gente aún se lo pregunta.`,
    entrenador_viejo:
      `Don ${character.name}, tu antiguo entrenador de juveniles, te ve en televisión. Lleva años retirado pero sigue el fútbol desde casa. Se anima a escribirte un mensaje o simplemente se cruzan en un acto. Su mirada te dice que está orgulloso.`,
    expareja:
      `${character.name} reaparece en tu vida. Han pasado ${yearsSince} años. Ahora está en otra parte del mundo, tiene su propia vida, pero por un momento vuelven a conectar — en redes, en un viaje, en una coincidencia.`,
    compañero_primeros_años:
      `${character.name}, con quien compartiste vestuario en tus primeros años, también ha tenido carrera. Se cruzan en un torneo, en un amistoso, o simplemente se encuentran fuera del campo. Ambos sonríen recordando de dónde vinieron.`,
  };

  return typeDescriptions[character.type] || "Reaparece alguien de tu pasado.";
}

/**
 * Actualiza la semana de último encuentro de un personaje después de que reaparece.
 */
export function updateCharacterLastSeen(
  player: Player,
  characterId: string,
): Player {
  if (!player.flags) return player;

  for (const [key, value] of Object.entries(player.flags)) {
    if (key.startsWith("sec_char_") && typeof value === "string") {
      try {
        const char = JSON.parse(value) as SecondaryCharacter;
        if (char.id === characterId) {
          char.lastSeenWeek = player.week;
          player.flags[key] = JSON.stringify(char);
          break;
        }
      } catch {
        // skip
      }
    }
  }

  return player;
}

/**
 * Genera un nombre para un personaje secundario si no se proporciona uno.
 */
export function generateSecondaryCharacterName(type: string): string {
  const names = SECONDARY_CHARACTER_NAMES[type] || SECONDARY_CHARACTER_NAMES.amigo_infancia;
  return names[Math.floor(Math.random() * names.length)];
}
