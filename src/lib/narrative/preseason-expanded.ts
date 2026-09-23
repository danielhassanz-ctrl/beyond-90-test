import type { GameEvent } from "@/types/career";

/**
 * Secuencia expandida de pretemporada (semanas 4-6 actuales)
 * Reemplaza los 3 eventos cortos con 7 eventos narrativamente ricos
 * que cubren: bienvenida, equipo, entrenador, competencia, tácica, físico, y mentales
 *
 * Toda la cadena (contrato-debut → ... → pretemp-amistoso, ver
 * carrera/actions.ts) la vive SIN excepción cada carrera nueva, en el
 * mismo orden — por eso, a diferencia de casi cualquier otro evento del
 * juego, no puede permitirse ser texto 100% fijo: un jugador que empieza
 * dos carreras distintas vería, palabra por palabra, la misma "Llamada de
 * casa" y el mismo amistoso con la misma nota (6.2) y el mismo marcador
 * (3-1), lo cual rompe directamente "ninguna partida igual". Cada función
 * recibe un `seed` (normalmente player.id, único por carrera) y elige de
 * forma determinista entre varias variantes — misma carrera, mismo texto
 * si se recarga la página; carrera distinta, casi seguro que texto
 * distinto. Cero llamadas a IA adicionales.
 */

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick<T>(seed: string, salt: string, pool: readonly T[]): T {
  return pool[hashString(`${seed}:${salt}`) % pool.length];
}

export function buildPreseasonBienvenidaEvent(club: string, seed: string): GameEvent {
  const quotes = [
    `Tu primer día en las instalaciones del ${club}. El director deportivo te recibe personalmente. 'Bienvenido', te dice. 'Sabemos que vienes de un buen proceso. Aquí queremos que continúes creciendo. La pretemporada es para adaptarte al ritmo, al grupo y a nuestras ideas. Trabaja duro, aprende rápido, y las oportunidades llegarán.'`,
    `Llegas a la ciudad deportiva del ${club} con la maleta todavía en la mano. Te recibe el entrenador, no el director deportivo: 'No hago estas cosas con todos, pero quería conocerte en persona. Hemos visto algo en ti. No te prometo minutos, te prometo una oportunidad justa si trabajas.'`,
    `El vestuario del ${club} está medio vacío cuando entras el primer día — la mayoría todavía está de vacaciones. Un utillero te enseña tu taquilla con tu nombre ya puesto. 'Bienvenido a casa', te dice sonriendo. 'Aquí vas a pasar más horas que en tu propia cama, ya lo verás.'`,
    `En rueda de prensa de presentación, un periodista te pregunta si te sientes preparado. Contestas lo que se espera, pero por dentro los nervios son reales. Después, en el vestuario, el capitán te guiña un ojo: 'Todos hemos pasado por esa rueda de prensa. Relájate, esto solo acaba de empezar.'`,
  ];
  return {
    id: "pretemp-bienvenida",
    category: "entrenamiento",
    title: "Bienvenido al club",
    description: pick(seed, "bienvenida", quotes),
    // No es un hito en sí (la firma ya generó su propia tarjeta justo
    // antes) — es el primer día de trabajo, no un momento extraordinario.
    milestoneType: "pretemp",
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

export function buildPreseasonFisicoEvent(seed: string): GameEvent {
  const scenes = [
    "El preparador físico te evalúa: sprint de 40m, salto vertical, resistencia anaeróbica. Tus números son sólidos para tu edad, pero claramente estás 'a mitad de ritmo' comparado con los veteranos que llevan meses en preparación. 'Tranquilo', te dice, 'en dos semanas estarás al nivel de todos.' Es un recordatorio: hay mucho trabajo por delante.",
    "Test de VO2 máx en la cinta: te ponen una mascarilla y corres hasta que las piernas dicen basta. El preparador físico mira los datos en su tablet sin decir nada durante un buen rato. 'Tu capacidad aeróbica está bien', dice al fin, 'pero la fuerza en tren inferior necesita trabajo. Vamos a meterte en el grupo de refuerzo.'",
    "Pesaje y composición corporal el primer día: el preparador físico anota cada dato en silencio. Al terminar, te mira: 'Físicamente estás donde debe estar alguien de tu edad. La diferencia con los veteranos no es el cuerpo, es la lectura de cuándo guardar energía. Eso solo lo da jugar partidos.'",
    "En el gimnasio, uno de los veteranos te reta a una serie de sentadillas sin avisarte que es una broma habitual de pretemporada para calibrar a los nuevos. Aguantas más de lo que esperaban. El preparador físico, que lo estaba observando todo, apunta algo con una sonrisa que no sabes bien cómo interpretar.",
  ];
  return {
    id: "pretemp-fisico",
    category: "entrenamiento",
    title: "Pruebas físicas de inicio",
    description: pick(seed, "fisico", scenes),
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

export function buildPreseasonCompetenciaEvent(seed: string): GameEvent {
  const scenes = [
    "En el vestuario te presentan a los jugadores de tu posición. Hay dos: uno de 27 años, experimentado y 'indiscutible', y otro de 22, joven pero ya con experiencia. Los dos te saludan fríamente pero correctamente. Es claro: tienes que ganarles el puesto. No va a ser fácil.",
    "Descubres en el primer entrenamiento táctico que hay tres jugadores más peleando por tu misma posición, uno de ellos recién llegado en un traspaso mucho más caro que tu fichaje. Nadie te lo dice directamente, pero el orden en que salen los nombres en la pizarra táctica no engaña.",
    "Uno de los veteranos de tu posición se acerca en el primer descanso, no para saludarte sino para medirte: '¿Así que tú eres el nuevo? He visto tus vídeos.' No dice si le gustó lo que vio. El resto del entrenamiento sientes sus ojos encima cada vez que tocas el balón.",
    "El entrenador junta a los cuatro jugadores de tu posición en una charla aparte: 'Va a haber competencia sana. El que mejor entrene, juega.' Suena justo dicho en voz alta, pero las miradas que cruzas con los otros tres dejan claro que nadie se lo va a poner fácil a nadie.",
  ];
  return {
    id: "pretemp-competencia",
    category: "vestuario",
    title: "Conocer a tu competencia",
    description: pick(seed, "competencia", scenes),
    options: [
      {
        id: "respeto",
        label: "Respetarlos: 'Tengo mucho que aprender de vosotros'",
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

export function buildPreseasonTacticaEvent(seed: string): GameEvent {
  const scenes = [
    "El asistente del técnico te reúne con otros 3 jugadores de tu zona para explicar el sistema de juego: '4-3-3 de transición rápida. Aquí defendemos en bloque, contraatacamos verticalizados. Tu posición es clave para romper líneas en salida. Estudiamos vídeo de tus entrenamientos: tienes velocidad, pero a veces pierdes posición. Eso no puede pasar aquí.'",
    "Charla de pizarra con todo el equipo: el técnico dibuja un 4-2-3-1 y señala directamente tu zona del campo. 'Aquí es donde se gana o se pierde el partido', dice sin mirarte a ti en concreto, pero todos entienden el mensaje. Después del vídeo, te llama aparte un segundo: 'Tienes que entender los espacios antes de tener el balón, no después.'",
    "El cuerpo técnico proyecta un vídeo de la pretemporada del año pasado explicando el 3-5-2 que quieren instaurar. 'Este sistema exige mucho recorrido y mucha lectura', explica el segundo entrenador mirando en tu dirección. 'No todos los que llegan lo entienden a la primera. Tú vas a tener que hacerlo.'",
    "En la sala de vídeo, el analista táctico pausa un fotograma exacto de un entrenamiento tuyo de dos días atrás: 'Aquí. Esta es la posición que nos interesa que ocupes en el 4-4-2 rombo.' Toda la sala mira la pantalla, y luego te mira a ti. Es la primera vez que sientes que te están estudiando de verdad.",
  ];
  return {
    id: "pretemp-tactica",
    category: "representante",
    title: "Primera charla de táctica",
    description: pick(seed, "tactica", scenes),
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

export function buildPreseasonCapitan(seed: string): GameEvent {
  const scenes = [
    "Después del entrenamiento, el capitán (30 años, veterano absoluto) se te acerca. 'Oye, conozco la tensión que sientes. Yo estuve donde estás hace años. Mi consejo: no intentes demostrar todo el primer mes. Aprende el sistema, entiende a tus compañeros, gana su respeto. El fútbol es un equipo.' Te invita a comer con algunos jugadores. Es un gesto.",
    "El capitán no dice gran cosa en el vestuario, pero al salir del entrenamiento te espera junto al coche: 'Súbete, te llevo a comer.' Durante el trayecto habla más de su primer año en el club que de fútbol en sí. Al despedirse, solo añade: 'Cualquier cosa que necesites, me buscas a mí primero, no a la prensa.'",
    "En pretemporada, el capitán organiza una cena de equipo y te sienta deliberadamente a su lado, no en la punta de la mesa con el resto de los nuevos. 'Aquí las jerarquías se ganan en el campo, pero el respeto se construye en momentos como este', te dice mientras brinda con el resto del grupo.",
    "Te sorprende que sea el capitán, y no el entrenador, quien te corrige un detalle técnico en un rondo: 'Ese control, ábrelo más al primer toque, aquí jugamos rápido.' No suena a bronca, suena a alguien que ya decidió invertir en ti. Después del entrenamiento te invita a su mesa habitual.",
  ];
  return {
    id: "pretemp-capitan",
    category: "vestuario",
    title: "El capitán te toma bajo su ala",
    description: pick(seed, "capitan", scenes),
    // Un gesto bonito de vestuario, no un hito fotografiable.
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

export function buildPreseasonPasado(seed: string): GameEvent {
  const scenes = [
    {
      texto:
        "Tu madre te llama. 'Cariño, ¿cómo estás? ¿Todo bien en el equipo?' Hablan 20 minutos. Te pregunta si echas de menos casa, si la comida es buena, si los compañeros te tratan bien. Es simple pero necesario: te recuerda de dónde vienes. Luego de colgar, te sientes extrañamente motivado.",
      prompt: "Tu madre te pregunta, de verdad, cómo lo estás llevando. ¿Qué le cuentas?",
    },
    {
      texto:
        "Tu padre te manda un audio de dos minutos que no esperabas: no habla de fútbol ni una sola vez, solo pregunta si estás comiendo bien y si el piso tiene buena calefacción. Al final, casi como quien no quiere la cosa, añade: 'Te vimos en el entrenamiento que subieron a redes. Se te veía bien.'",
      prompt: "Le grabas un audio de vuelta a tu padre. ¿Qué le dices?",
    },
    {
      texto:
        "Tu hermano pequeño te llama en pleno descanso de comida, solo para contarte una tontería del colegio. No pregunta nada de fútbol, ni de si vas a jugar, ni de nada importante — y precisamente por eso la llamada te sienta mejor que cualquier otra conversación seria que hayas tenido esta semana.",
      prompt: "¿Qué le dices a tu hermano antes de colgar?",
    },
    {
      texto:
        "Es tu pareja quien llama esta vez, tarde, cuando ya estás en la cama del piso nuevo que todavía no sientes como propio. No hablan de fútbol: hablan de lo raro que es empezar de cero en una ciudad distinta. Cuelgas con la sensación de que, pase lo que pase esta pretemporada, hay algo sólido esperándote fuera del campo.",
      prompt: "¿Qué le dices a tu pareja sobre cómo te sientes en esta ciudad nueva?",
    },
  ];
  const scene = pick(seed, "pasado", scenes);
  return {
    id: "pretemp-pasado",
    category: "vida",
    title: "Llamada de casa",
    description: scene.texto,
    allowFreeText: true,
    freeTextPrompt: scene.prompt,
    options: [
      {
        id: "nostalgico",
        label: "Echar un poco de menos pero sentir que estás en el lugar correcto",
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

const AMISTOSO_RIVALES = [
  "CD Móstoles",
  "AD Parla",
  "CF Rivas",
  "UD San Sebastián de los Reyes",
  "CD Leganés B",
  "Real Madrid Castilla",
  "Getafe CF B",
] as const;

interface AmistosoTramo {
  minuto: number;
  nota: string;
  golesTexto: string;
  marcador: string;
  cronica: string;
  cita: string;
  consequences: { moral: number; forma: number; rel_entrenador: number };
}

const AMISTOSO_TRAMOS: readonly AmistosoTramo[] = [
  {
    minuto: 45,
    nota: "6.2",
    golesTexto: "Goles: 0. Asistencias: 0.",
    marcador: "3-1 a favor",
    cronica: "No fue brillante pero tampoco malo. Es tu primer toque real de competición con estos compañeros.",
    cita: "'Bien, eso es lo que necesitaba ver. Sigue así.'",
    consequences: { moral: 3, forma: 1, rel_entrenador: 2 },
  },
  {
    minuto: 60,
    nota: "7.1",
    golesTexto: "Goles: 1. Asistencias: 0.",
    marcador: "2-1 a favor",
    cronica: "Entras con el partido igualado y a los diez minutos apareces solo en el segundo palo para marcar. El banquillo entero se levanta a celebrarlo.",
    cita: "'Eso es justo lo que fichamos: instinto en el área. No pares.'",
    consequences: { moral: 5, forma: 2, rel_entrenador: 4 },
  },
  {
    minuto: 20,
    nota: "5.4",
    golesTexto: "Goles: 0. Asistencias: 0.",
    marcador: "1-1 (empate)",
    cronica: "Entras pronto por una molestia de un compañero y el ritmo te cuesta más de lo esperado. Un par de pérdidas feas en zonas peligrosas, nada dramático, pero se nota.",
    cita: "'Primer partido, primeros nervios. Nadie te va a juzgar por esto.'",
    consequences: { moral: -1, forma: 0, rel_entrenador: 0 },
  },
  {
    minuto: 30,
    nota: "6.8",
    golesTexto: "Goles: 0. Asistencias: 1.",
    marcador: "4-2 a favor",
    cronica: "No marcas, pero un pase filtrado tuyo entre dos centrales acaba en el segundo gol del equipo. El compañero que remata viene corriendo a abrazarte.",
    cita: "'Esa visión de juego no se enseña. Sigue buscando ese pase.'",
    consequences: { moral: 4, forma: 1, rel_entrenador: 3 },
  },
  {
    minuto: 55,
    nota: "5.9",
    golesTexto: "Goles: 0. Asistencias: 0.",
    marcador: "0-0 (empate)",
    cronica: "Partido gris de principio a fin, más un ejercicio de rodaje físico que un amistoso de verdad. Tocas pocos balones limpios, pero no cometes ningún error grave.",
    cita: "'Partidos así también forman. La chispa vendrá.'",
    consequences: { moral: 1, forma: 2, rel_entrenador: 1 },
  },
] as const;

export function buildPreseasonAmistoso(seed: string): GameEvent {
  const rival = pick(seed, "amistoso-rival", AMISTOSO_RIVALES);
  const tramo = pick(seed, "amistoso-tramo", AMISTOSO_TRAMOS);

  return {
    id: "pretemp-amistoso",
    category: "partido",
    title: "Primer amistoso de pretemporada",
    description: `Juega el ${rival}. Tú entras en el minuto ${tramo.minuto}. Nota: ${tramo.nota}/10. ${tramo.golesTexto} Marcador final: ${tramo.marcador}. ${tramo.cronica} El técnico después: ${tramo.cita}`,
    rivalClub: rival,
    // Un amistoso de pretemporada con nota discreta no es el debut real
    // — ese es rookie-debut-oficial, que sí es milestone.
    milestoneType: "pretemp",
    allowFreeText: true,
    freeTextPrompt: "Un compañero te pregunta qué te ha parecido tu primer partido con el equipo. ¿Qué le dices?",
    options: [
      {
        id: "satisfecho",
        label: "Satisfecho: 'Sólido, sin errores. La próxima busco más'",
        subtitle: "Evaluación realista",
        consequences: tramo.consequences,
      },
      {
        id: "hambriento",
        label: "Sentir que pudiste haber hecho más y prometer esfuerzo extra",
        subtitle: "Mentalidad ganadora",
        consequences: { moral: tramo.consequences.moral - 1, forma: tramo.consequences.forma + 1, rel_entrenador: tramo.consequences.rel_entrenador + 1 },
      },
    ],
  };
}
