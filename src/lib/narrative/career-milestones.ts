/**
 * Sistema de milestones de carrera: eventos que se disparan cuando
 * el jugador alcanza números históricos (10 goles, 100 partidos, etc).
 *
 * Estos eventos son NARRATIVOS y EMOCIONALES, no solo estadísticas.
 * Ejemplo: primer gol → evento especial
 *          10 goles → artículo de prensa
 *          100 partidos → reconocimiento del club
 *          hat-trick → portada
 */

import type { Player } from "@/types/player";
import type { GameEvent } from "@/types/career";

export type MilestoneType =
  | "first_goal"
  | "goal_10"
  | "goal_25"
  | "goal_50"
  | "goal_100"
  | "match_50"
  | "match_100"
  | "match_200"
  | "hat_trick"
  | "assist_10"
  | "assist_25"
  | "pichichi_candidate"
  | "record_assist"
  | "100_minutes_played"
  | "championship_win"
  | "record_young_goals";

export interface CareerMilestone {
  type: MilestoneType;
  week: number;
  achieved: boolean;
  narrative: string;
}

/**
 * Detecta milestones basándose en estadísticas del jugador.
 * Retorna array de milestones alcanzados en esta semana.
 */
export function detectNewMilestones(
  player: Player,
  previousStats: { goalsScored?: number; matches?: number; assists?: number }
): MilestoneType[] {
  const milestones: MilestoneType[] = [];

  // Extraer stats del player (asumiendo que existen en flags o algún lado)
  // Por ahora, retornar array vacío - esto se implementa conectando con el tracking real
  // de stats del jugador

  return milestones;
}

/**
 * Genera evento narrativo para un milestone específico.
 */
export function buildMilestoneEvent(type: MilestoneType, player: Player): GameEvent | null {
  const age = Math.floor(player.week / 52) + 16; // Aproximación simple

  const milestoneEvents: Record<MilestoneType, () => GameEvent | null> = {
    first_goal: () => ({
      id: `milestone-first-goal-${player.week}`,
      category: "especial",
      title: "Tu primer gol profesional",
      description: `Es el minuto 67. Recibes un pase de tu compañero en el área, giras rápido y golpeas. El balón se cuela por la escuadra. La afición explota. Tus compañeros te abrazan. Es el momento que llevas soñando desde que eras pequeño. TU primer gol en profesionales. Nunca lo olvidarás.`,
      isMilestone: true,
      milestoneType: "gol",
      imageScene: `Photorealistic Getty Images photo of a young footballer celebrating his first professional goal with genuine emotion, arms raised, teammates hugging him, packed stadium in background, golden afternoon light, pure joy`,
      options: [
        {
          id: "celebrar",
          label: "Celebrar con todo el equipo",
          subtitle: "Momento de unidad",
          consequences: { media: 2, moral: 8, rel_vestuario: 3 },
        },
        {
          id: "cielo",
          label: "Mirar al cielo (dedicárselo a alguien)",
          subtitle: "Momento personal",
          consequences: { media: 1, moral: 10 },
        },
      ],
    }),

    goal_10: () => ({
      id: `milestone-goal-10-${player.week}`,
      category: "prensa",
      title: `Diez goles: ${player.last_name} se consolida como delantero`,
      description: `La prensa local hace cuenta: ya son 10 goles esta temporada. No es Mbappé ni Lewandowski, pero para alguien de tu edad y en tu nivel, es destacable. 'Está en buena racha', dicen. 'Si continúa así, clubes grandes lo vigilarán.'`,
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

    goal_50: () => ({
      id: `milestone-goal-50-${player.week}`,
      category: "especial",
      title: `50 GOLES`,
      description: `Alcanzas los 50 goles en tu carrera profesional. Es un número histórico para un jugador de tu nivel. El club organiza una ceremonia en el próximo partido para reconocerte. 'Eres leyenda en este club', te dice el presidente.`,
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

    match_100: () => ({
      id: `milestone-match-100-${player.week}`,
      category: "vida",
      title: `100 PARTIDOS CON EL CLUB`,
      description: `Juegas tu partido número 100 con esta camiseta. Es un logro silencioso pero importante: 100 veces has saltado al campo, 100 veces has sudado por estos colores. El capitán te abraza en el túnel antes del partido. 'Eres un veterano ya', bromea.`,
      isMilestone: true,
      milestoneType: "hito",
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

    hat_trick: () => ({
      id: `milestone-hat-trick-${player.week}`,
      category: "especial",
      title: `HAT-TRICK - TRES GOLES`,
      description: `Imposible. 45 minutos, 3 goles. El hat-trick de tu carrera. La afición canta tu nombre. Tus compañeros te cargan en hombros. Es el partido más especial de tu vida profesional. Portada de todos los periódicos mañana.`,
      isMilestone: true,
      milestoneType: "hat-trick",
      imageScene: `Photorealistic Getty Images photo of a triumphant footballer holding up three fingers after hat-trick, massive smile, teammates celebrating around him, packed roaring stadium, bright floodlights, champagne spray visible, pure euphoria`,
      options: [
        {
          id: "euforia",
          label: "Celebrar sin control: mejor noche de tu vida",
          subtitle: "Éxtasis puro",
          consequences: { media: 5, moral: 10, fama: 3 },
        },
        {
          id: "profesional",
          label: "Mantener la compostura: 'Es un partido más'",
          subtitle: "Madurez",
          consequences: { media: 2, moral: 7, rel_entrenador: 3 },
        },
      ],
    }),

    championship_win: () => ({
      id: `milestone-championship-${player.week}`,
      category: "especial",
      title: `CAMPEÓN - TÍTULO GANADO`,
      description: `Suena el silbatazo final. ¡CAMPEONES! Has ganado la Liga, la Copa, o las dos. Tu nombre será recordado como parte del equipo histórico que lo logró. La ciudad celebra. Lluvia de confeti en el estadio. Abrazos infinitos.`,
      isMilestone: true,
      milestoneType: "titulo",
      imageScene: `Photorealistic Getty Images photo of a footballer holding the championship trophy high above his head, surrounded by celebrating teammates, confetti falling, packed joyful stadium, golden hour light, pure triumph`,
      options: [
        {
          id: "leyenda",
          label: "Esto es inmortalidad. Eres leyenda",
          subtitle: "Histórico",
          consequences: { media: 10, fama: 10, moral: 10 },
        },
        {
          id: "siguiente",
          label: "Pensar en ganar otro: 'Uno no es suficiente'",
          subtitle: "Ambición infinita",
          consequences: { media: 5, fama: 5, forma: 3 },
        },
      ],
    }),

    // Placeholder para otros milestones
    goal_25: () => null,
    goal_100: () => null,
    match_50: () => null,
    match_200: () => null,
    assist_10: () => null,
    assist_25: () => null,
    pichichi_candidate: () => null,
    record_assist: () => null,
    "100_minutes_played": () => null,
    record_young_goals: () => null,
  };

  return milestoneEvents[type]?.() ?? null;
}
