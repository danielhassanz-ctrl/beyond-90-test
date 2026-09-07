import type { GameEvent } from "@/types/career";

/**
 * Progresión garantizada de un jugador novel (rookie) desde semana 7 hasta primer partido.
 * Esta cadena reemplaza el pool aleatorio para jugadores que acaban de firmar.
 *
 * Estructura:
 * W7-W8: Fase de reservas (adaptación, entrenamientos con filial)
 * W9: Reunión táctica con primer entrenador
 * W10: Anuncio de debut
 * W11: Primer partido garantizado
 */

export function buildReservaIntroduccionEvent(): GameEvent {
  return {
    id: "rookie-reserva-introduccion",
    category: "entrenamiento",
    title: "Bienvenida al equipo B",
    description:
      "Tu primer día con el equipo B. El preparador físico te explica el plan de trabajo: durante las próximas 2-3 semanas jugarás con el filial para ganar ritmo y confianza. 'Es normal empezar aquí', te dice. 'Todos pasan por esto. Luego ya veremos cómo evolucionas.'",
    isMilestone: true,
    milestoneType: "filial",
    imageScene:
      "Photorealistic Getty Images photo of a young footballer in a reserve team training session, receiving instructions from coaching staff, modern training facility, focused determined expression",
    options: [
      {
        id: "aceptar",
        label: "Entrenar duro y demostrar que mereces el primer equipo",
        subtitle: "Mentalidad de profesional",
        consequences: { moral: 5, forma: 3, rel_entrenador: 2 },
      },
      {
        id: "frustracion",
        label: "Aceptar el plan pero frustrado por no jugar ya con el primero",
        subtitle: "Ambición legítima",
        consequences: { moral: 0, forma: 1, rel_entrenador: -1 },
      },
    ],
  };
}

export function buildReservaPartidoEvent(): GameEvent {
  return {
    id: "rookie-reserva-partido",
    category: "partido",
    title: "Tu primer partido en el filial",
    description:
      "Juegas tu primer partido oficial con el equipo B contra otro filial. Eres titular, 90 minutos. Nota: 6.5/10. Goles: 0. Asistencias: 0. Marcador: 2-2. No fue malo, pero tampoco espectacular. Normal para alguien que recién empieza a ritmo competitivo.",
    rivalClub: "Filial rival",
    isMilestone: true,
    milestoneType: "filial",
    imageScene:
      "Photorealistic Getty Images photo of a young footballer playing during a reserve team match, in action on the field, wearing reserve team colors, stadium or training ground background",
    options: [
      {
        id: "positivo",
        label: "Ver el empate como aprendizaje positivo",
        subtitle: "Mentalidad de crecimiento",
        consequences: { moral: 4, forma: 2, rel_entrenador: 3 },
      },
      {
        id: "autocritica",
        label: "Sentir que pudiste haber hecho más",
        subtitle: "Exigencia personal",
        consequences: { moral: 1, forma: 1, rel_entrenador: 2 },
      },
    ],
  };
}

export function buildTacticaMisterEvent(): GameEvent {
  return {
    id: "rookie-tactica-mister",
    category: "representante",
    title: "Primera charla táctica con el míster",
    description:
      "Te llama el entrenador del primer equipo a su despacho después del entrenamiento. 'He visto el vídeo del filial', te dice. 'Tienes cualidades. Aquí en el primer equipo es diferente: ritmo más alto, táctico más exigente. Jugas de [tu posición]. Tienes competencia, pero con trabajo puedes ganarte minutos. De aquí a dos semanas quiero verte listo para entrenar con nosotros como titular.'",
    isMilestone: true,
    milestoneType: "tactica",
    imageScene:
      "Photorealistic Getty Images photo of a young footballer sitting across from the coach in the coach's office, serious tactical discussion, modern football club setting, focused attention",
    options: [
      {
        id: "motivado",
        label: "Salir motivado: 'Voy a demostrarle que valgo'",
        subtitle: "Confianza en ti mismo",
        consequences: { moral: 6, forma: 2, rel_entrenador: 4 },
      },
      {
        id: "presion",
        label: "Sentir la presión pero listo para el reto",
        subtitle: "Nerviosismo productivo",
        consequences: { moral: 2, forma: 1, rel_entrenador: 2 },
      },
    ],
  };
}

export function buildDebutAnuncioEvent(): GameEvent {
  return {
    id: "rookie-debut-anuncio",
    category: "representante",
    title: "Se acerca tu debut oficial",
    description:
      "Dos semanas de entrenamientos intensos con el primer equipo. El míster te convoca para el próximo partido: 'Vas en la lista, probablemente entre en el segundo tiempo si todo va bien. Prepárate.' Es oficial: dentro de 4 días debutas con el primer equipo.",
    isMilestone: true,
    milestoneType: "debut",
    imageScene:
      "Photorealistic Getty Images photo of the footballer receiving the squad list for the upcoming match, excited focused expression, modern football club announcement, official club setting",
    options: [
      {
        id: "nervioso",
        label: "Nervioso pero listo. Llevas esperando esto toda la vida",
        subtitle: "Emoción controlada",
        consequences: { moral: 5, forma: -1, rel_entrenador: 2 },
      },
      {
        id: "confiado",
        label: "Totalmente confiado. 'Voy a demostrar por qué me ficharon'",
        subtitle: "Seguridad en uno mismo",
        consequences: { moral: 3, forma: 2, rel_entrenador: 1 },
      },
    ],
  };
}

export function buildDebutOficialEvent(club: string, rivalry: string = "rival local"): GameEvent {
  return {
    id: "rookie-debut-oficial",
    category: "partido",
    title: `Tu primer partido con el ${club}`,
    description:
      `Debut oficial en La Liga. Entras en el minuto 67 por la banda. El equipo gana 1-0. Nota personal: 6.8/10. Goles: 0. Asistencias: 0. Marcador: 2-0 final. No fue espectacular pero tampoco cometiste errores. Hiciste lo que pidieron: estar en posición, no meter la pata. Es un debut sólido.`,
    rivalClub: rivalry,
    isMilestone: true,
    milestoneType: "debut",
    imageScene: `Photorealistic Getty Images quality photo of a young footballer celebrating during his professional league debut, running on the field with determination and pride, stadium atmosphere, wearing the club colors`,
    options: [
      {
        id: "satisfecho",
        label: "Satisfecho: cumpliste tu objetivo sin errores",
        subtitle: "Debut profesional consumado",
        consequences: { media: 1, moral: 5, forma: 1, rel_entrenador: 3 },
      },
      {
        id: "hambre",
        label: "Empezar a exigirte más minutos. Una entrada no es suficiente",
        subtitle: "Ambición de protagonismo",
        consequences: { media: 0, moral: 4, forma: 2, rel_entrenador: 1 },
      },
    ],
  };
}
