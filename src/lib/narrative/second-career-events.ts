/**
 * Sistema completo de segunda vida post-retiro.
 * Cuando un jugador se retira, puede elegir: Entrenador, Comentarista, Empresario, Embajador, etc.
 * Cada carrera tiene narrativas, eventos, y progresión propia.
 */

import type { GameEvent, SecondCareerRole } from "@/types/career";
import type { Player } from "@/types/player";
import { playerAge } from "@/types/career";

/**
 * Evento para elegir la segunda carrera (aparece cuando se retira).
 */
export function buildSecondCareerChoiceEvent(player: Player): GameEvent {
  const age = playerAge(player.week);
  const careerLength = player.week / 10; // Aproximación de temporadas jugadas

  return {
    id: "fork-segunda-vida-elegir",
    category: "especial",
    title: "Tu vida después del fútbol",
    description: `Has jugado ${careerLength.toFixed(0)} temporadas. Tu cuerpo está cansado, pero tu mente está activa. Es hora de elegir qué hacer ahora. ¿Seguir ligado al fútbol en otra rol? ¿Alejarte completamente? ¿Comenzar un negocio? Tienes opciones.`,
    isMilestone: true,
    milestoneType: "retiro",
    imageScene: `Photorealistic Getty Images photo of a ${age}-year-old retired footballer standing at a crossroads, thoughtful expression, stadium visible but blurred in background, sunlit contemplative moment, decisive peaceful look, bright natural light, future ahead`,
    options: [
      {
        id: "entrenador",
        label: "Convertirte en ENTRENADOR",
        subtitle: "Transmitir tu experiencia a jóvenes",
        consequences: { second_career: "entrenador", reputacion: 5 },
      },
      {
        id: "comentarista",
        label: "Ser COMENTARISTA/ANALISTA en TV",
        subtitle: "Vivir el fútbol desde otro ángulo",
        consequences: { second_career: "comentarista", fama: 3 },
      },
      {
        id: "empresario",
        label: "Convertirte en EMPRESARIO",
        subtitle: "Negocios, inversiones, imperio personal",
        consequences: { second_career: "empresario", patrimonio: 50000 },
      },
      {
        id: "embajador",
        label: "Ser EMBAJADOR de tu club",
        subtitle: "Vivir la leyenda, eventos, caridad",
        consequences: { second_career: "embajador", fama: 5, rel_aficion: 10 },
      },
      {
        id: "alejarse",
        label: "ALEJARTE del fútbol completamente",
        subtitle: "Vivir una vida privada, lejos del spotlight",
        consequences: { second_career: "privado", moral: 8, fama: -5 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué sientes al colgar las botas?",
  };
}

/**
 * Eventos para la carrera de ENTRENADOR.
 */
export function buildCoachEvents(player: Player, week: number): GameEvent | null {
  const reputacion = player.reputacion || 50;
  const isNewCoach = week < 20; // Primeras semanas como entrenador

  if (isNewCoach) {
    return {
      id: `coach-debut-${week}`,
      category: "entrenamiento",
      title: "Tu primer equipo como entrenador",
      description: `Te ofrecen un equipo de división inferior. Tienes que demostrar que sabes entrenar, no solo jugar. Tu primer entreno: los jugadores te miran con respeto pero también con curiosidad. '¿Qué nos va a enseñar este?' se preguntan. Tienés que ganarte su respeto.`,
      isMilestone: true,
      milestoneType: "segunda_vida",
      options: [
        {
          id: "duro",
          label: "Ser duro, exigente, Sin concesiones",
          subtitle: "Respeto por autoridad",
          consequences: { reputacion: 5, rel_vestuario: -2 },
        },
        {
          id: "cercano",
          label: "Ser cercano, como un amigo que comprende",
          subtitle: "Confianza por experiencia",
          consequences: { reputacion: 3, rel_vestuario: 5 },
        },
      ],
    };
  }

  // Después de las primeras semanas: eventos de logros/fracasos
  if (reputacion > 70) {
    return {
      id: `coach-ascenso-${week}`,
      category: "especial",
      title: "Ascenso a un club grande",
      description: `Tu equipo ha ganado más de lo esperado. Un club de Liga hace oferta. Quieren que lleves al equipo a la élite. Es tu oportunidad de demostrare como entrenador, no solo como ex-jugador. ¿Aceptas el desafío?`,
      isMilestone: true,
      milestoneType: "segunda_vida",
      options: [
        {
          id: "si",
          label: "Aceptar: Es el momento",
          subtitle: "Ambición de gloria",
          consequences: { reputacion: 10, moral: 8 },
        },
        {
          id: "esperar",
          label: "Esperar una oferta mejor",
          subtitle: "Paciencia estratégica",
          consequences: { reputacion: 3, moral: 2 },
        },
      ],
    };
  }

  return null;
}

/**
 * Eventos para COMENTARISTA.
 */
export function buildCommentatorEvents(player: Player, week: number): GameEvent | null {
  const fama = player.fama || 50;

  return {
    id: `comentarista-debut-${week}`,
    category: "prensa",
    title: "Tu debut como comentarista en TV",
    description: `Estás frente a una cámara por primera vez sin jugar. Los nervios son raros: no hay balón, no hay rival, solo palabras. Tienes que explicar el juego, analizar decisiones, entretener. Tu experiencia vale, pero ¿sabrás comunicarla?`,
    isMilestone: true,
    milestoneType: "segunda_vida",
    options: [
      {
        id: "tecnico",
        label: "Ser muy técnico y detallado",
        subtitle: "Para expertos",
        consequences: { fama: 2, reputacion: 5 },
      },
      {
        id: "entretenido",
        label: "Ser entretenido y directo",
        subtitle: "Conectar con masas",
        consequences: { fama: 5, reputacion: 2 },
      },
    ],
  };
}

/**
 * Eventos para EMPRESARIO.
 */
export function buildEntrepreneurEvents(player: Player, week: number): GameEvent | null {
  const patrimonio = player.patrimonio || 100000;

  return {
    id: `empresario-startup-${week}`,
    category: "vida",
    title: "Tu primer negocio: startup deportiva",
    description: `Tuviste una idea: una academia de fútbol con metodología innovadora, o un app de entrenamiento, o una línea de ropa deportiva. Necesitas invertir tu dinero. Es riesgoso, pero si funciona, podrías cambiar la industria.`,
    isMilestone: true,
    milestoneType: "segunda_vida",
    options: [
      {
        id: "invertir",
        label: "Invertir fuerte: todo o nada",
        subtitle: "Ambición empresarial",
        consequences: { patrimonio: -patrimonio * 0.3, moral: 5, reputacion: 5 },
      },
      {
        id: "conservador",
        label: "Invertir poco: prueba de concepto",
        subtitle: "Riesgo calculado",
        consequences: { patrimonio: -patrimonio * 0.1, moral: 2 },
      },
    ],
  };
}

/**
 * Eventos para EMBAJADOR.
 */
export function buildAmbassadorEvents(player: Player, week: number): GameEvent | null {
  const fama = player.fama || 50;

  return {
    id: `embajador-caridad-${week}`,
    category: "vida",
    title: "Evento de caridad: tu nombre da valor",
    description: `Te piden participar en un evento benéfico. Tu nombre atrae gente. Puedes ayudar a causas sociales. Es gratificante, pero también expone tu vida privada. ¿Cuánto de ti quieres compartir?`,
    isMilestone: true,
    milestoneType: "segunda_vida",
    options: [
      {
        id: "activo",
        label: "Ser muy activo en caridad",
        subtitle: "Propósito social",
        consequences: { fama: 5, moral: 8, rel_aficion: 5 },
      },
      {
        id: "distante",
        label: "Limitarte a apoyo económico",
        subtitle: "Ayudar sin exponerse",
        consequences: { fama: 1, moral: 3 },
      },
    ],
  };
}

/**
 * Eventos para vida PRIVADA (alejado del fútbol).
 */
export function buildPrivateLifeEvents(player: Player, week: number): GameEvent | null {
  const edad = playerAge(player.week);

  return {
    id: `privado-familia-${week}`,
    category: "vida",
    title: "Construir una vida normal",
    description: `Lejos de los reflectores. Tienes tiempo para la familia, para viajes, para cosas que postergaste durante ${(player.week / 10).toFixed(0)} temporadas. Tu pareja está feliz. Tus hijos crecen sin presión mediática. ¿Es esto la felicidad verdadera?`,
    isMilestone: true,
    milestoneType: "segunda_vida",
    options: [
      {
        id: "feliz",
        label: "Estar en paz: elegiste bien",
        subtitle: "Serenidad",
        consequences: { moral: 10, fama: -2 },
      },
      {
        id: "extrañar",
        label: "Extrañar los reflectores",
        subtitle: "Nostalgia del protagonismo",
        consequences: { moral: 3, fama: 0 },
      },
    ],
  };
}
