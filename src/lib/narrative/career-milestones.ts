/**
 * Sistema de milestones de carrera: eventos que se disparan cuando
 * el jugador alcanza números históricos (10 goles, 100 partidos, etc).
 *
 * Estos eventos son NARRATIVOS y EMOCIONALES, no solo estadísticas.
 * Ejemplo: primer gol → evento especial (ya cubierto aparte, ver
 *          isFirstGoalEver en carrera/actions.ts)
 *          10 goles → artículo de prensa
 *          100 partidos → reconocimiento del club
 *          hat-trick → portada
 *
 * Este archivo llevaba escrito sin que ningún camino activo del juego lo
 * recorriera — detectNewMilestones devolvía siempre un array vacío
 * ("esto se implementa conectando con el tracking real"), así que ni el
 * contenido ya escrito (goal_10, goal_50, match_100...) llegaba nunca a
 * verse. update-stats.ts sí lleva la cuenta real desde hace tiempo
 * (stats_goals, stats_matches_played, stats_assists) — solo faltaba
 * comparar el antes/después de cada turno contra estos umbrales.
 */

import type { Player } from "@/types/player";
import type { GameEvent } from "@/types/career";

export type MilestoneType =
  | "goal_10"
  | "goal_25"
  | "goal_50"
  | "goal_100"
  | "match_50"
  | "match_100"
  | "match_200"
  | "assist_10"
  | "assist_25";

interface StatsSnapshot {
  goals: number;
  matches: number;
  assists: number;
}

const GOAL_THRESHOLDS: [number, MilestoneType][] = [
  [100, "goal_100"],
  [50, "goal_50"],
  [25, "goal_25"],
  [10, "goal_10"],
];
const MATCH_THRESHOLDS: [number, MilestoneType][] = [
  [200, "match_200"],
  [100, "match_100"],
  [50, "match_50"],
];
const ASSIST_THRESHOLDS: [number, MilestoneType][] = [
  [25, "assist_25"],
  [10, "assist_10"],
];

/**
 * Detecta qué umbrales redondos se cruzaron ESTE turno, comparando las
 * estadísticas de antes y después de aplicar el statUpdate del evento
 * recién resuelto. Como mucho un hito por turno (el de mayor peso, si
 * por lo que sea se cruzara más de uno a la vez con un statUpdate raro)
 * — celebrar dos milestones en la misma pantalla no tiene sentido.
 */
export function detectNewMilestones(previous: StatsSnapshot, current: StatsSnapshot): MilestoneType[] {
  for (const [threshold, type] of GOAL_THRESHOLDS) {
    if (previous.goals < threshold && current.goals >= threshold) return [type];
  }
  for (const [threshold, type] of MATCH_THRESHOLDS) {
    if (previous.matches < threshold && current.matches >= threshold) return [type];
  }
  for (const [threshold, type] of ASSIST_THRESHOLDS) {
    if (previous.assists < threshold && current.assists >= threshold) return [type];
  }
  return [];
}

/**
 * Genera evento narrativo para un milestone específico.
 */
export function buildMilestoneEvent(type: MilestoneType, player: Player): GameEvent | null {
  const milestoneEvents: Record<MilestoneType, () => GameEvent> = {
    goal_10: () => ({
      id: `milestone-goal-10-${player.week}`,
      category: "prensa",
      title: `Diez goles: ${player.last_name} se consolida como delantero`,
      description: `La prensa local hace cuenta: ya son 10 goles esta temporada. No es Mbappé ni Lewandowski, pero para alguien de tu edad y en tu nivel, es destacable. "Está en buena racha", dicen. "Si continúa así, clubes grandes lo vigilarán."`,
      isMilestone: true,
      milestoneType: "prensa",
      options: [
        {
          id: "humilde",
          label: "Restar importancia: 'Aún hay mucho por mejorar'",
          subtitle: "Humildad",
          consequences: { media: 1, rel_entrenador: 2 },
        },
        {
          id: "confianza",
          label: "Sentir confianza: 'Quiero ser Pichichi'",
          subtitle: "Ambición",
          consequences: { media: 3, forma: 2, moral: 4 },
        },
      ],
    }),

    goal_25: () => ({
      id: `milestone-goal-25-${player.week}`,
      category: "prensa",
      title: `25 goles en la cuenta de ${player.last_name}`,
      description: `Ya no es una racha, es una tendencia. 25 goles con esta camiseta y los rivales empiezan a marcarte doble en el área. "Hay que tenerlo controlado siempre", dice el analista táctico del próximo rival en una entrevista. Te has convertido en un problema para los demás.`,
      isMilestone: true,
      milestoneType: "prensa",
      options: [
        {
          id: "confianza",
          label: "Usar la marca extra a tu favor: abrir espacio para otros",
          subtitle: "Juego colectivo",
          consequences: { media: 2, rel_vestuario: 3, moral: 3 },
        },
        {
          id: "obsesion",
          label: "Obsesionarte con seguir anotando pese a la marca",
          subtitle: "Ambición individual",
          consequences: { media: 3, forma: -1, fama: 3 },
        },
      ],
    }),

    goal_50: () => ({
      id: `milestone-goal-50-${player.week}`,
      category: "especial",
      title: `50 GOLES`,
      description: `Alcanzas los 50 goles en tu carrera profesional. Es un número histórico para un jugador de tu nivel. El club organiza una ceremonia en el próximo partido para reconocerte. "Eres leyenda en este club", te dice el presidente.`,
      isMilestone: true,
      milestoneType: "hito",
      imageScene: `Photorealistic Getty Images photo of the player on the pitch during a ceremony, receiving recognition from club officials, emotional proud expression, 50 GOALS displayed on stadium screens, packed enthusiastic crowd, bright daylight`,
      options: [
        {
          id: "emocionado",
          label: "Reconocer emocionalmente a quienes te ayudaron",
          subtitle: "Gratitud",
          consequences: { moral: 8, rel_entrenador: 4, rel_vestuario: 3 },
        },
        {
          id: "hambre",
          label: "Prometer 50 más antes de los 30",
          subtitle: "Ambición desatada",
          consequences: { media: 4, moral: 6, forma: 2 },
        },
      ],
    }),

    goal_100: () => ({
      id: `milestone-goal-100-${player.week}`,
      category: "especial",
      title: "CIEN GOLES COMO PROFESIONAL",
      description: `El marcador del estadio lo anuncia en cuanto pita el árbitro: 100 goles en tu carrera. El club prepara un vídeo homenaje con tus mejores tantos para el descanso del próximo partido. Es el tipo de número que separa a los buenos jugadores de los que la afición no olvida nunca.`,
      isMilestone: true,
      milestoneType: "hito",
      imageScene: `Photorealistic Getty Images photo of a footballer applauding the crowd after scoring, "100 GOALS" displayed on the stadium big screen behind him, emotional proud expression, teammates applauding nearby, golden stadium lighting, historic career moment`,
      options: [
        {
          id: "legado",
          label: "Pensar en tu legado en este club",
          subtitle: "Perspectiva histórica",
          consequences: { moral: 8, fama: 5, rel_aficion: 5 },
        },
        {
          id: "siguiente",
          label: "Ya estás pensando en el gol 101",
          subtitle: "Nunca satisfecho",
          consequences: { media: 3, forma: 2 },
        },
      ],
    }),

    match_50: () => ({
      id: `milestone-match-50-${player.week}`,
      category: "vida",
      title: "50 partidos con esta camiseta",
      description: `Cumples 50 partidos oficiales con el club. Todavía no eres un veterano de la casa, pero ya has dejado de ser "el nuevo" — los aficionados empiezan a cantar tu nombre sin dudar, y el utillero ya sabe tu talla de memoria.`,
      isMilestone: false,
      options: [
        {
          id: "pertenencia",
          label: "Sentir que este club ya es tu casa",
          subtitle: "Arraigo",
          consequences: { rel_aficion: 4, moral: 4 },
        },
        {
          id: "ambicion",
          label: "Ver esto como un peldaño hacia algo más grande",
          subtitle: "Mirar más lejos",
          consequences: { fama: 2, media: 1 },
        },
      ],
    }),

    match_100: () => ({
      id: `milestone-match-100-${player.week}`,
      category: "vida",
      title: `100 PARTIDOS CON EL CLUB`,
      description: `Juegas tu partido número 100 con esta camiseta. Es un logro silencioso pero importante: 100 veces has saltado al campo, 100 veces has sudado por estos colores. El capitán te abraza en el túnel antes del partido. "Eres un veterano ya", bromea.`,
      isMilestone: true,
      milestoneType: "hito",
      imageScene: `Photorealistic Getty Images photo of a footballer being embraced by his team captain in the tunnel before a match, "100 MATCHES" displayed on a stadium screen in the background, warm mutual respect, genuine smile, stadium pre-match atmosphere, professional sports photography`,
      options: [
        {
          id: "orgullo",
          label: "Sentir verdadero orgullo por la lealtad",
          subtitle: "Pertenencia",
          consequences: { rel_vestuario: 5, rel_aficion: 4, moral: 7 },
        },
        {
          id: "sed",
          label: "Pensar en cómo podrías haber jugado más",
          subtitle: "Reflexión crítica",
          consequences: { media: 2, forma: 1, moral: 1 },
        },
      ],
    }),

    match_200: () => ({
      id: `milestone-match-200-${player.week}`,
      category: "especial",
      title: "DOSCIENTOS PARTIDOS CON EL CLUB",
      description: `200 partidos con esta camiseta. Ya eres historia viva del club, de esos nombres que los aficionados más jóvenes solo conocen de oídas hasta que te ven jugar en persona. El club anuncia que tu nombre entrará en el muro de socios históricos.`,
      isMilestone: true,
      milestoneType: "hito",
      imageScene: `Photorealistic Getty Images photo of a veteran footballer being honored on the pitch, "200 MATCHES" displayed on stadium screens, applauding crowd standing, emotional respectful expression, club officials presenting a commemorative plaque, warm stadium lighting`,
      options: [
        {
          id: "veterano",
          label: "Aceptar el peso de ser ya un referente del club",
          subtitle: "Responsabilidad",
          consequences: { reputacion: 6, rel_aficion: 6, moral: 5 },
        },
        {
          id: "seguir",
          label: "Quitarle solemnidad: 'Todavía me quedan partidos'",
          subtitle: "Sin mirar atrás",
          consequences: { moral: 4, forma: 2 },
        },
      ],
    }),

    assist_10: () => ({
      id: `milestone-assist-10-${player.week}`,
      category: "prensa",
      title: "Diez asistencias: el que las prepara",
      description: `Diez pases de gol en lo que va de temporada. Los compañeros ya buscan tu posición cuando el partido se atasca — sabes que a veces el mejor gol es el que le regalas a otro. Un compañero te lo agradece delante de los micrófonos.`,
      isMilestone: false,
      options: [
        {
          id: "compartir",
          label: "Disfrutar siendo el que da, no solo el que anota",
          subtitle: "Visión de equipo",
          consequences: { rel_vestuario: 4, moral: 4 },
        },
        {
          id: "reconocimiento",
          label: "Pedir que también se hable más de esto en la prensa",
          subtitle: "Quieres tu mérito",
          consequences: { fama: 2, moral: -1 },
        },
      ],
    }),

    assist_25: () => ({
      id: `milestone-assist-25-${player.week}`,
      category: "prensa",
      title: "25 asistencias: el mejor pase de la liga",
      description: `Un analista lo dice en televisión: "Si hubiera un Pichichi de asistencias, sería suyo sin discusión." 25 goles que no son tuyos pero que no existirían sin ti. Es un tipo de fama distinto al de los goleadores, y también se siente bien.`,
      isMilestone: true,
      milestoneType: "prensa",
      options: [
        {
          id: "orgullo",
          label: "Reivindicar el pase como arte, no solo el gol",
          subtitle: "Filosofía de juego",
          consequences: { fama: 4, rel_vestuario: 3, moral: 5 },
        },
        {
          id: "ambicion",
          label: "Ahora quieres también los goles: 'Puedo con las dos cosas'",
          subtitle: "Más hambre",
          consequences: { media: 2, forma: 1, fama: 2 },
        },
      ],
    }),
  };

  return milestoneEvents[type]?.() ?? null;
}
