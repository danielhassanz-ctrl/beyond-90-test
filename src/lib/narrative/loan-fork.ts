import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";

/**
 * La decisión de la cesión — quedarte a pelear el sitio en tu club o
 * salir cedido para jugar de verdad en otro — es uno de los momentos que
 * de verdad definen una carrera joven (ver el documento de referencia
 * "Beyond 90 · Partida Original · Día a Día": la cesión al Zaragoza es
 * uno de los grandes puntos de inflexión de esa carrera). El juego no
 * tenía NADA parecido: un jugador joven sin minutos simplemente seguía
 * generando eventos de vestuario/entrenamiento genéricos para siempre,
 * sin que su situación deportiva real (no juega, no progresa) llegara
 * nunca a convertirse en una decisión de verdad.
 *
 * A diferencia de un "fichaje más" cualquiera, esto NO siempre sale bien:
 * una cesión puede convertirte en titular indiscutible en otro sitio, o
 * puede ser un año perdido en un equipo que tampoco te da minutos. Ganar
 * siempre sería justo el problema que ya se reportó de la carrera.
 */

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const LOAN_DESTINATIONS = [
  "Real Zaragoza",
  "CD Tenerife",
  "Deportivo de La Coruña",
  "SD Eibar",
  "Racing de Santander",
  "Real Sporting de Gijón",
  "CD Mirandés",
  "Burgos CF",
] as const;

export function shouldTriggerLoanFork(player: Player): boolean {
  if (player.club === NO_CLUB_YET) return false;
  if (player.flags?.loan_fork_seen) return false;
  const age = 16 + Math.floor(player.week / 10);
  if (age < 17 || age > 21) return false;
  // Solo tiene sentido si todavía no es indiscutible en su club: una
  // media ya alta significa que ha superado esta etapa sin necesitar
  // salir a jugar a otro sitio.
  if (player.media >= 68) return false;
  return Math.random() < 0.3;
}

export function markLoanForkTriggered(player: Player): void {
  if (!player.flags) player.flags = {};
  player.flags.loan_fork_seen = true;
}

export function buildLoanForkEvent(player: Player): GameEvent {
  const seed = hashString(`${player.id}:loan-destination`);
  const originalClub = player.club;
  const destinationPool = LOAN_DESTINATIONS.filter((c) => c !== originalClub);
  const destination = destinationPool[seed % destinationPool.length];

  return {
    id: `fork-cesion-${Date.now()}`,
    category: "representante",
    title: "La carrera pide minutos",
    description: `Llevas meses sin apenas jugar en el ${originalClub}: entrenas bien, el técnico te lo reconoce en privado, pero en el once siempre hay alguien por delante de ti. Tu representante te plantea la pregunta directa: "¿Te quedas a pelear el sitio, o salimos cedido a algún lado donde de verdad vayas a jugar?" Ha llegado ya una posibilidad concreta: el ${destination}.`,
    isMilestone: true,
    imageScene: `Photorealistic photo of the photographed young man in training kit sitting alone on a stadium bench, looking at the empty pitch, thoughtful and slightly frustrated expression, overcast natural light, wide shot emphasizing solitude`,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices a tu representante sobre lo que de verdad quieres?",
    options: [
      {
        id: "quedarse",
        label: `Quedarse en el ${originalClub} y pelear el sitio`,
        subtitle: "Apostar por ganarte minutos aquí",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "media",
          success: {
            text: `Tu insistencia da resultado: una lesión del titular y varios entrenamientos notables te abren un hueco real en el once del ${originalClub}. Empiezas a asomar en las convocatorias importantes.`,
            consequences: { media: 4, forma: 3, moral: 5, rel_entrenador: 4 },
          },
          fail: {
            text: `Los meses pasan y el hueco nunca llega. Sigues siendo suplente del ${originalClub}, y en algún entrenamiento se te nota la frustración acumulada.`,
            consequences: { moral: -6, forma: -2, rel_entrenador: -1 },
          },
        },
      },
      {
        id: "cesion-segura",
        label: `Aceptar la cesión al ${destination}`,
        subtitle: "Salir a jugar, aunque sea en un proyecto más humilde",
        consequences: { club: destination, flags: { loan_active: originalClub, loan_start_week: String(player.week) } },
        resolve: {
          baseChance: 0.62,
          statModifier: "media",
          success: {
            text: `La cesión sale redonda: te conviertes en titular indiscutible del ${destination} casi desde el primer día, y tu nombre empieza a sonar de vuelta en el ${originalClub} con otra credibilidad.`,
            consequences: { media: 6, forma: 5, fama: 4, moral: 6, rel_representante: 3 },
          },
          fail: {
            text: `El ${destination} tampoco te da la continuidad que esperabas — otro entrenador, otra pelea por el puesto, casi el mismo problema en otro sitio distinto. El año se siente perdido.`,
            consequences: { moral: -5, forma: -1, rel_representante: -2 },
          },
        },
      },
      {
        id: "cesion-ambiciosa",
        label: "Buscar la cesión más ambiciosa posible, aunque sea más arriesgada",
        subtitle: "Todo o nada: un proyecto más exigente, menos garantías",
        consequences: { club: destination, flags: { loan_active: originalClub, loan_start_week: String(player.week) } },
        resolve: {
          baseChance: 0.38,
          statModifier: "media",
          success: {
            text: `El riesgo sale bien: te ganas un puesto en un proyecto exigente de verdad, y el salto de nivel se nota en cada partido. Vuelves de la cesión siendo un jugador distinto.`,
            consequences: { media: 9, forma: 6, fama: 6, moral: 8, rel_representante: 5 },
          },
          fail: {
            text: `El nivel te supera por ahora: apenas sumas minutos en un vestuario mucho más competitivo del que esperabas. Vuelves del año de cesión con menos rodaje del que necesitabas.`,
            consequences: { moral: -8, forma: -4, media: -2 },
          },
        },
      },
    ],
  };
}

/**
 * Antes la cesión no tenía final: el jugador se quedaba en el club de
 * destino para siempre (con el calendario y las ofertas de ESE club) y
 * "el club que te cedió" nunca volvía a aparecer. El documento de
 * referencia lo cuenta como un año: sales, juegas, y al terminar hay que
 * decidir — volver, quedarte o esperar algo mejor.
 */
export function shouldEndLoan(player: Player): boolean {
  const origin = player.flags?.loan_active;
  if (typeof origin !== "string" || !origin || player.flags?.loan_returned) return false;
  const start = parseInt(String(player.flags?.loan_start_week ?? "0"), 10) || 0;
  return start > 0 && player.week - start >= 10;
}

export function buildLoanEndEvent(player: Player): GameEvent {
  const origin = String(player.flags?.loan_active);
  return {
    id: `fork-fin-cesion-${Date.now()}`,
    category: "representante",
    title: "Se acaba la cesión",
    description: `Un año en el ${player.club} y el ${origin} vuelve a llamar. Tu representante lo resume rápido: "Puedes volver, puedes pelear por quedarte aquí o puedes esperar a ver quién más se mueve."`,
    allowFreeText: true,
    freeTextPrompt: `¿Qué le dices al ${origin} y qué le dices al ${player.club}?`,
    options: [
      {
        id: "volver",
        label: `Volver al ${origin}`,
        subtitle: "Otra oportunidad de ganarte el sitio",
        consequences: { club: origin, moral: 2, flags: { loan_returned: true } },
      },
      {
        id: "quedarme",
        label: `Quedarte en el ${player.club} de forma definitiva`,
        subtitle: "Ser importante donde ya lo eres",
        consequences: { rel_aficion: 6, moral: 3, flags: { loan_returned: true } },
      },
      {
        id: "esperar",
        label: "Esperar a ver qué otras ofertas llegan",
        subtitle: "Jugar tus cartas con calma",
        consequences: { fama: 2, rel_representante: 2, flags: { loan_returned: true } },
      },
    ],
  };
}
