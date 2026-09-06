import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";

export type CareerStage = "promesa" | "consolidación" | "buena_carrera" | "estrella" | "veterano" | "declive";

export interface CareerArc {
  stage: CareerStage;
  mediaRange: [number, number];
  description: string;
  typicalClubs: string[];
  eventFocus: string[];
}

const CAREER_STAGES: Record<CareerStage, CareerArc> = {
  promesa: {
    stage: "promesa",
    mediaRange: [40, 55],
    description: "Joven en cantera o club modesto. Intenta hacerse un nombre.",
    typicalClubs: ["Real Betis", "Villarreal", "Real Sociedad", "Sporting Gijón", "Deportivo", "Levante"],
    eventFocus: ["Debut", "Primeros goles", "Competencia", "Atención de agentes"],
  },
  consolidación: {
    stage: "consolidación",
    mediaRange: [55, 75],
    description: "Jugador consolidado en su club o en proceso de crecimiento. Etapa de decisiones importantes.",
    typicalClubs: [
      "Atalanta",
      "Sevilla",
      "Villarreal",
      "Napoli",
      "Real Betis",
      "Valencia",
      "Sociedad",
      "Athletic",
    ],
    eventFocus: [
      "Salto a equipo más exigente",
      "Primeros títulos",
      "Selección nacional",
      "Vida personal",
      "Lesiones",
    ],
  },
  buena_carrera: {
    stage: "buena_carrera",
    mediaRange: [60, 80],
    description:
      "Carrera exitosa en un buen club (Betis histórico, Deportivo con presupuesto, Manchester United, Atlético, etc.). No es élite mundial pero es respetado.",
    typicalClubs: [
      "Deportivo de La Coruña",
      "Manchester United",
      "Arsenal",
      "Atlético de Madrid",
      "Valencia",
      "Schalke",
      "Sampdoria",
      "Juventus (rol de veterano)",
    ],
    eventFocus: [
      "Consolidación en club ambicioso",
      "Títulos nacionales posibles",
      "Paternidad",
      "Patrimonio",
      "Rol de veterano/mentor",
      "Últimas oportunidades internacionales",
    ],
  },
  estrella: {
    stage: "estrella",
    mediaRange: [78, 99],
    description: "Elite mundial. Real Madrid, Liverpool, City, Bayern, Barcelona. Balón de Oro posible.",
    typicalClubs: [
      "Real Madrid",
      "Barcelona",
      "Liverpool",
      "Manchester City",
      "Bayern Munich",
      "PSG",
      "Juventus",
    ],
    eventFocus: [
      "Champions League",
      "Balón de Oro",
      "Selección: capitán",
      "Presión máxima",
      "Ofertas Arabia",
      "Patrimonio masivo",
    ],
  },
  veterano: {
    stage: "veterano",
    mediaRange: [50, 75],
    description: "Jugador con experiencia. Últimos años rentables. Arabia, Serie A, La Liga modesta, o regreso emocional.",
    typicalClubs: [
      "Al Hilal",
      "Al Nassr",
      "Serie A veterano",
      "La Liga veterano",
      "Real Betis",
      "Regreso al primer club",
    ],
    eventFocus: ["Arabia o regreso", "Mentoring", "Preparación retiro", "Familia adulta"],
  },
  declive: {
    stage: "declive",
    mediaRange: [40, 55],
    description: "Fase final. Retirada próxima. Segunda vida (entrenador, agente, presidente).",
    typicalClubs: ["Segunda División", "Retirada"],
    eventFocus: ["Retirada", "Legado", "Segunda vida", "Homenajes"],
  },
};

export function getCareerStage(player: Player): CareerStage {
  const age = playerAge(player.week);

  // Por media principalmente, edad como contexto
  if (player.media < 55) {
    return age <= 19 ? "promesa" : age <= 32 ? "consolidación" : "declive";
  }

  if (player.media < 75) {
    return age <= 24 ? "consolidación" : age <= 32 ? "buena_carrera" : "veterano";
  }

  if (player.media < 85) {
    return age <= 32 ? "buena_carrera" : "veterano";
  }

  // Media >= 85
  return age <= 36 ? "estrella" : "veterano";
}

export function getCareerContext(player: Player): CareerArc {
  const stage = getCareerStage(player);
  return CAREER_STAGES[stage];
}

/**
 * Genera una oportunidad de fichaje probabilística basada en media actual.
 * NO es determinista: respetar que muchos jugadores pasan carreras enteras
 * en buenos equipos medianos, sin llegar a gigantes.
 */
export function shouldHaveClubOpportunity(player: Player): { club?: string; reason?: string } {
  const stage = getCareerStage(player);
  const context = CAREER_STAGES[stage];

  // Oportunidades basadas en media, no en edad
  if (player.media >= 75 && player.media < 85 && Math.random() < 0.15) {
    // Chance pequeña de pasar a buena carrera incluso con media OK
    const bigClubs = [
      "Atlético de Madrid",
      "Manchester United",
      "Arsenal",
      "Juventus",
      "Valencia",
      "Napoli",
    ];
    const filtered = bigClubs.filter((c) => c !== player.club);
    if (filtered.length > 0) {
      return {
        club: filtered[Math.floor(Math.random() * filtered.length)],
        reason: "Proyecto ambicioso en club respetado",
      };
    }
  }

  if (player.media >= 85 && Math.random() < 0.2) {
    // Chance de gigante para media muy alta
    const gigantes = ["Real Madrid", "Barcelona", "Liverpool", "Manchester City", "Bayern"];
    const filtered = gigantes.filter((c) => c !== player.club);
    if (filtered.length > 0) {
      return {
        club: filtered[Math.floor(Math.random() * filtered.length)],
        reason: "Interés de gigante europeo",
      };
    }
  }

  if (player.media >= 65 && player.media < 78 && Math.random() < 0.1) {
    // Pequeña chance de Arabia incluso con media media-alta
    return { club: "Al Hilal", reason: "Proyecto económico importante" };
  }

  return {};
}

/**
 * Vida personal: NO determinista. Respetar que algunos jugadores no quieren
 * pareja/hijos, o los quieren a diferentes edades.
 * Solo sugerir SI el jugador ya ha mostrado inclinación (pareja anterior, etc.)
 */
export function shouldSuggestLifeEvent(
  player: Player,
): { suggestion?: string; context?: string; probability: number } {
  const hasPartner = Boolean(player.flags?.pareja);
  const hasChild = Boolean(player.flags?.hijo_1);
  const hasChild2 = Boolean(player.flags?.hijo_2);
  const age = playerAge(player.week);

  // Si ya tiene pareja, chance de primer hijo (pero respetando su edad preferida)
  if (hasPartner && !hasChild) {
    // Puede ser a cualquier edad: 22, 28, 32. No es predecible.
    const randomChance = Math.random();
    if (randomChance < 0.1) {
      return {
        suggestion: "primer_hijo",
        context: "Los dos lo han estado considerando",
        probability: 0.4,
      };
    }
  }

  // Si tiene hijo y pareja, pequeña chance de segundo (pero muy eventual)
  if (hasPartner && hasChild && !hasChild2 && Math.random() < 0.05) {
    return {
      suggestion: "segundo_hijo",
      context: "Quizás ampliar la familia",
      probability: 0.25,
    };
  }

  // Si NO tiene pareja, chance ínfima de conocer a alguien (pero PODRÍA)
  if (!hasPartner && Math.random() < 0.08) {
    return {
      suggestion: "pareja",
      context: "Conoce a alguien especial",
      probability: 0.2,
    };
  }

  return { probability: 0 };
}
