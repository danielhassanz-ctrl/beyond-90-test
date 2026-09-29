import type { GameEvent } from "@/types/career";
import { MODE_TARGET_WEEKS } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getPersonName } from "@/lib/narrative/npcs";

/**
 * Arco narrativo de varios capítulos: el compañero con el que debutas en
 * tu primer club de verdad, que sigue su propio camino y, años después,
 * sin buscarlo, os volvéis a encontrar en el mismo vestuario — esta vez
 * como compañeros otra vez. Patrón real del fútbol tan reconocible como
 * el de arco-rival.ts, pero de reencuentro, no de rivalidad: pedido
 * explícito tras aclarar que el reencuentro NO tiene que ser en un club
 * grande — puede ser de vuelta en tu primer club o en cualquier otro,
 * simplemente el que te toque en ese momento de la carrera.
 *
 * 4 capítulos:
 *   0. Debutáis juntos en tu primer club — se establece el vínculo.
 *   1. Se marcha: cada uno tira para un lado.
 *   2. El reencuentro — fichas (o te fichan) donde está él, o viceversa,
 *      sin que ninguno de los dos lo planeara.
 *   3. Un momento juntos en el campo, ya como compañeros de nuevo — cierre,
 *      hito compartible.
 *
 * A diferencia de arco-rival.ts, la fase 2 NO exige fama ni un club
 * concreto — solo que tu club actual sea distinto de aquel primer club
 * donde os conocisteis, sea cual sea. El reencuentro puede ser en
 * cualquier sitio, incluso de vuelta en el primero si algún día regresas.
 */

const FASE_MAX = 4;

function getFase(player: Player): number {
  return Number(player.flags?.arco_reencuentro_fase ?? 0);
}

function getFriendName(player: Player): string {
  return getPersonName(player, "arco-reencuentro-identidad", "m");
}

function targetWeek(player: Player, fraction: number): number {
  return Math.round(MODE_TARGET_WEEKS[player.mode] * fraction);
}

export function shouldTriggerArcoReencuentro(player: Player): boolean {
  if (player.club === NO_CLUB_YET) return false;
  // Igual que arco-rival: un arco de 4 capítulos necesita margen real
  // entre cada uno, y en modo Express casi nunca llegaría a cerrarse.
  if (player.mode === "express") return false;
  const fase = getFase(player);
  if (fase >= FASE_MAX) return false;

  const lastWeek = Number(player.flags?.arco_reencuentro_last_week ?? 0);
  const minGap = Math.max(4, Math.round(MODE_TARGET_WEEKS[player.mode] * 0.15));
  if (lastWeek > 0 && player.week - lastWeek < minGap) return false;

  if (fase === 0) {
    // Solo en la primera etapa real de la carrera (tu primer club de
    // verdad) — pasado ese margen, ya no tendría sentido "debutar juntos".
    if (player.week > targetWeek(player, 0.15)) return false;
    return Math.random() < 0.18;
  }

  if (fase === 1) {
    if (player.week < targetWeek(player, 0.22)) return false;
    return Math.random() < 0.16;
  }

  if (fase === 2) {
    // El corazón del arco: tu club actual ya no es aquel en el que os
    // conocisteis — no importa si es "mejor" o "peor", grande o pequeño,
    // solo que sea distinto. Así el reencuentro puede tocar en cualquier
    // punto de la carrera, no solo al llegar a un club grande.
    const clubOrigen = String(player.flags?.arco_reencuentro_club0 ?? "");
    if (!clubOrigen || player.club === clubOrigen) return false;
    if (player.week < targetWeek(player, 0.35)) return false;
    return Math.random() < 0.14;
  }

  // Fase 3: capítulo de cierre, algo más espaciado tras el reencuentro.
  if (player.week - lastWeek < minGap * 1.5) return false;
  return Math.random() < 0.2;
}

export function buildArcoReencuentroEvent(player: Player): GameEvent {
  const fase = getFase(player);
  const week = player.week;
  const friend = getFriendName(player);
  const flags: Record<string, string> = { arco_reencuentro_fase: String(fase + 1), arco_reencuentro_last_week: String(week) };

  if (fase === 0) {
    flags.arco_reencuentro_club0 = player.club;
    return {
      id: `arco-reencuentro-1-${week}`,
      category: "vestuario",
      title: "El compañero con el que empezaste todo",
      description: `${friend} y tú debutáis casi el mismo mes en el primer equipo. Compartís vestuario, viajes y la misma sensación de vértigo — de esas amistades que se forjan rápido porque los dos entendéis exactamente por lo que está pasando el otro.`,
      options: [
        { id: "0", label: "Volveros inseparables dentro y fuera del campo", subtitle: "Amistad de verdad", consequences: { moral: 3, rel_vestuario: 3, flags } },
        { id: "1", label: "Llevaros bien, sin más, cada uno a su ritmo", subtitle: "Compañerismo normal", consequences: { rel_vestuario: 2, flags } },
        { id: "2", label: "Verlo también como competencia sana por minutos", subtitle: "Motivación extra", consequences: { forma: 2, flags } },
      ],
    };
  }

  if (fase === 1) {
    return {
      id: `arco-reencuentro-2-${week}`,
      category: "vida",
      title: "Cada uno tira para un lado",
      description: `${friend} firma por otro club: la primera gran decisión que os separa después de tanto tiempo juntos. La despedida es sincera, sin dramas, con la promesa hueca de "seguimos hablando" que casi nunca se cumple del todo.`,
      options: [
        { id: "0", label: "Prometerle que seguiréis en contacto, y cumplirlo", subtitle: "Cuidar la amistad", consequences: { moral: 2, reputacion: 1, flags } },
        { id: "1", label: "Despedida cordial, sabiendo que la vida sigue", subtitle: "Sin forzar nada", consequences: { moral: 1, flags } },
        { id: "2", label: "Sentir que se rompe algo, aunque no lo digas", subtitle: "Nostalgia real", consequences: { moral: -1, flags } },
      ],
      allowFreeText: true,
      freeTextPrompt: `Le escribes a ${friend} un último mensaje antes de que se marche. ¿Qué le dices?`,
    };
  }

  if (fase === 2) {
    return {
      id: `arco-reencuentro-3-${week}`,
      category: "vestuario",
      title: "Sin buscarlo, os volvéis a encontrar",
      description: `Entras en el vestuario del ${player.club} el primer día y ahí está: ${friend}, con la misma cara de sorpresa que tú. Ninguno de los dos planeó esto — simplemente el fútbol os ha vuelto a poner en el mismo sitio.`,
      isMilestone: true,
      milestoneType: "reencuentro",
      imageScene:
        "Photorealistic photo of the photographed man in a club dressing room, laughing and embracing a teammate of generic appearance (not a real, identifiable person) in surprise and joy, casual training kits, warm candid documentary lighting",
      options: [
        { id: "0", label: "Abrazarlo como si no hubiera pasado el tiempo", subtitle: "La amistad sigue intacta", consequences: { moral: 5, rel_vestuario: 4, flags } },
        { id: "1", label: "Bromear sobre lo pequeño que es el mundo del fútbol", subtitle: "Con humor", consequences: { moral: 3, rel_vestuario: 2, flags } },
        { id: "2", label: "Ponerte serio: 'esta vez vamos a aprovecharlo de verdad'", subtitle: "Ambición compartida", consequences: { forma: 2, moral: 2, flags } },
      ],
    };
  }

  // Fase 3: capítulo de cierre.
  return {
    id: `arco-reencuentro-4-${week}`,
    category: "partido",
    title: "El gol que os debíais desde hace años",
    description: `Un partido cualquiera se convierte en algo más: ${friend} te pone el balón en bandeja, o tú a él, para el gol que decide el resultado. El abrazo de celebración dura más de lo normal — los dos sabéis exactamente cuánto camino hay detrás de ese gesto.`,
    isMilestone: true,
    milestoneType: "reencuentro_gol",
    imageScene:
      "Photorealistic photo of the photographed man celebrating a goal on the pitch with a teammate of generic appearance (not a real, identifiable person), tight embrace, stadium crowd blurred in the background, photorealistic sports photography",
    options: [
      {
        id: "0",
        label: "Dedicarle el gol delante de todos",
        subtitle: "Reconocer el camino compartido",
        consequences: { flags },
        resolve: {
          baseChance: 0.6,
          statModifier: "forma",
          success: {
            text: `El gesto se hace viral: dos amigos de la cantera, años después, celebrando juntos en la élite. La prensa lo convierte en la historia bonita de la jornada.`,
            consequences: { fama: 7, moral: 6, rel_vestuario: 3, flags },
            isWin: true,
          },
          fail: {
            text: `El gesto pasa casi desapercibido para la prensa, pero entre vosotros dos no hace falta que nadie más lo entienda.`,
            consequences: { moral: 4, rel_vestuario: 2, flags },
          },
        },
      },
      { id: "1", label: "Vivirlo en privado, sin necesidad de explicarlo a nadie", subtitle: "Es solo vuestro", consequences: { moral: 4, rel_vestuario: 2, flags } },
    ],
  };
}
