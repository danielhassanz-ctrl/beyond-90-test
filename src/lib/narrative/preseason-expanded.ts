import type { GameEvent } from "@/types/career";
import { describeKit } from "@/lib/clubColors";

/**
 * Secuencia expandida de pretemporada (semanas 4-6 actuales)
 * Reemplaza los 3 eventos cortos con 7 eventos narrativamente ricos
 * que cubren: bienvenida, equipo, entrenador, competencia, tácica, físico, y mentales
 */

export function buildPreseasonBienvenidaEvent(club: string): GameEvent {
  return {
    id: "pretemp-bienvenida",
    category: "entrenamiento",
    title: "Bienvenido al club",
    description: `Tu primer día en las instalaciones del ${club}. El director deportivo te recibe personalmente. 'Bienvenido', te dice. 'Sabemos que vienes de un buen proceso. Aquí queremos que continúes creciendo. La pretemporada es para adaptarte al ritmo, al grupo y a nuestras ideas. Trabaja duro, aprende rápido, y las oportunidades llegarán.'`,
    isMilestone: true,
    milestoneType: "pretemp",
    imageScene: `Photorealistic photo of a young footballer arriving at a professional football club, modern training facility entrance, club crest visible, welcoming atmosphere, nervous excitement`,
    options: [
      {
        id: "humilde",
        label: "Escuchar con humildad: 'Gracias, voy a aprovechar cada momento'",
        subtitle: "Mentalidad de aprendiz",
        consequences: { moral: 4, rel_entrenador: 3, forma: 1 },
      },
      {
        id: "confiado",
        label: "Confiado: 'Estoy listo para competir desde ya'",
        subtitle: "Seguridad en tus capacidades",
        consequences: { moral: 3, rel_entrenador: 1, forma: 2 },
      },
    ],
  };
}

export function buildPreseasonFisicoEvent(): GameEvent {
  return {
    id: "pretemp-fisico",
    category: "entrenamiento",
    title: "Pruebas físicas de inicio",
    description:
      "El preparador físico te evalúa: sprint de 40m, salto vertical, resistencia anaeróbica. Tus números son sólidos para tu edad, pero claramente estás 'a mitad de ritmo' comparado con los veterans que llevan meses en preparación. 'Tranquilo', te dice, 'en dos semanas estarás al nivel de todos.' Es un recordatorio: hay mucho trabajo por delante.",
    options: [
      {
        id: "disciplinado",
        label: "Comprometerte a los entrenamientos extra sin quejar",
        subtitle: "Trabajo silencioso",
        consequences: { forma: 4, moral: 2, rel_entrenador: 2 },
      },
      {
        id: "competitivo",
        label: "Presionarte a ti mismo: 'Voy a estar al nivel en una semana'",
        subtitle: "Ambición pero riesgo",
        consequences: { forma: 3, moral: 3, rel_entrenador: 1 },
      },
    ],
  };
}

export function buildPreseasonCompetenciaEvent(): GameEvent {
  return {
    id: "pretemp-competencia",
    category: "vestuario",
    title: "Conocer a tu competencia",
    description:
      "En el vestuario te presentan a los jugadores de tu posición. Hay dos: uno de 27 años, experimentado y 'indiscutible', y otro de 22, joven pero ya con experiencia. Los dos te saludan fríamente pero correctamente. Es claro: tienes que ganarles el puesto. No va a ser fácil.",
    options: [
      {
        id: "respeto",
        label: "Respetarlos: 'Tengo mucho que aprender de ustedes'",
        subtitle: "Construir relación",
        consequences: { moral: 2, rel_vestuario: 3, forma: 1 },
      },
      {
        id: "desafiante",
        label: "Ver la competencia como motivación: 'Voy a quitarles el puesto'",
        subtitle: "Actitud de competidor",
        consequences: { moral: 4, rel_vestuario: -1, forma: 2 },
      },
    ],
  };
}

export function buildPreseasonTacticaEvent(): GameEvent {
  return {
    id: "pretemp-tactica",
    category: "representante",
    title: "Primera charla de táctica",
    description:
      "El asistente del técnico te reúne con otros 3 jugadores de tu zona para explicar el sistema de juego: '4-3-3 de transición rápida. Aquí defendemos en bloque, contraatacamos verticalizados. Tu posición es clave para romper líneas en salida. Estudiamos video de tus entrenamientos: tienes velocidad, pero a veces pierdes posición. Eso no puede pasar aquí.'",
    options: [
      {
        id: "atento",
        label: "Tomar notas mentales: 'Entiendo, voy a trabajar en eso'",
        subtitle: "Profesionalismo",
        consequences: { rel_entrenador: 4, forma: 1, moral: 2 },
      },
      {
        id: "seguro",
        label: "Confiado en tu instinto: 'Mi posición es mi fortaleza'",
        subtitle: "Confianza defensiva",
        consequences: { rel_entrenador: 1, forma: 3, moral: 2 },
      },
    ],
  };
}

export function buildPreseasonCapitan(): GameEvent {
  return {
    id: "pretemp-capitan",
    category: "vestuario",
    title: "El capitán te toma bajo su ala",
    description:
      "Después del entrenamientos, el capitán (30 años, veterano absoluto) se te acerca. 'Oye, conozco la tensión que sientes. Yo estuve donde estás hace años. Mi consejo: no intentes demostrar todo el primer mes. Aprende el sistema, entiende a tus compañeros, gana su respeto. El fútbol es un equipo.' Te invita a comer con algunos jugadores. Es un gesto.",
    isMilestone: true,
    milestoneType: "pretemp",
    options: [
      {
        id: "agradecido",
        label: "Agradecerle sinceramente y aprender de su experiencia",
        subtitle: "Humildad valorada",
        consequences: { moral: 5, rel_vestuario: 5, forma: 0 },
      },
      {
        id: "independiente",
        label: "Valorar el gesto pero preferir enfocarte solo en jugar",
        subtitle: "Mentalidad de lobo solitario",
        consequences: { moral: 2, rel_vestuario: 1, forma: 2 },
      },
    ],
  };
}

export function buildPreseasonPasado(): GameEvent {
  return {
    id: "pretemp-pasado",
    category: "vida",
    title: "Llamada de casa",
    description:
      "Tu madre te llama. 'Cariño, ¿cómo estás? ¿Todo bien en el equipo?' Hablan 20 minutos. Te pregunta si echas de menos casa, si la comida es buena, si los compañeros te tratan bien. Es simple pero necesario: te recuerda de dónde vienes. Luego de colgar, te sientes extrañamente motivado.",
    options: [
      {
        id: "nostalgico",
        label: "Extrañar un poco pero sentir que estás en el lugar correcto",
        subtitle: "Emoción controlada",
        consequences: { moral: 3, forma: 0 },
      },
      {
        id: "determinado",
        label: "Usar esa llamada como motivación: 'Voy a hacerlo por ellos'",
        subtitle: "Propósito familiar",
        consequences: { moral: 5, forma: 1 },
      },
    ],
  };
}

export function buildPreseasonAmistoso(): GameEvent {
  return {
    id: "pretemp-amistoso",
    category: "partido",
    title: "Primer amistoso de pretemporada",
    description:
      "Juega un equipo de tercera división. Tú entras en el minuto 45. Nota: 6.2/10. Goles: 0. Asistencias: 0. Marcador final: 3-1 a favor. No fue brillante pero tampoco malo. Es tu primer toque real de competición con estos compañeros. El técnico después: 'Bien, eso es lo que necesitaba ver. Sigue así.'",
    rivalClub: "Equipo de pretemporada",
    isMilestone: true,
    milestoneType: "pretemp",
    imageScene: `Photorealistic photo of a young footballer playing in a friendly preseason match, focused on the ball, teammates and opponents around, stadium or training ground backdrop, professional match action`,
    options: [
      {
        id: "satisfecho",
        label: "Satisfecho: 'Sólido, sin errores. La próxima busco más'",
        subtitle: "Evaluación realista",
        consequences: { moral: 3, forma: 1, rel_entrenador: 2 },
      },
      {
        id: "hambriento",
        label: "Sentir que pudiste haber hecho más y prometer esfuerzo extra",
        subtitle: "Mentalidad ganadora",
        consequences: { moral: 2, forma: 2, rel_entrenador: 3 },
      },
    ],
  };
}
