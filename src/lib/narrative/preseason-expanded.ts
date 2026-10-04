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

/**
 * Los 5 pasos "de pretemporada" del medio (todo menos bienvenida, que
 * siempre es el primer día, y amistoso, que siempre cierra la
 * pretemporada) son narrativamente independientes entre sí — no hay
 * ninguna razón real para que el físico tenga que ir siempre antes que
 * la charla táctica. Pero antes de esto, la cadena en carrera/actions.ts
 * los encolaba en un orden fijo por código (if/else if), así que TODA
 * carrera nueva vivía exactamente la misma secuencia de beats en el
 * mismo orden — reportado en vivo como "iguales que las otras partidas"
 * incluso con el texto de cada paso ya variado por semilla. Con esto, el
 * ORDEN en sí también varía por carrera, no solo las palabras de cada
 * paso.
 */
export const PRESEASON_MIDDLE_STEPS = [
  { name: "fisico", id: "pretemp-fisico", build: buildPreseasonFisicoEvent },
  { name: "competencia", id: "pretemp-competencia", build: buildPreseasonCompetenciaEvent },
  { name: "tactica", id: "pretemp-tactica", build: buildPreseasonTacticaEvent },
  { name: "capitan", id: "pretemp-capitan", build: buildPreseasonCapitan },
  { name: "pasado", id: "pretemp-pasado", build: buildPreseasonPasado },
] as const;

/** Orden barajado y determinista de los 5 pasos intermedios, único por carrera. */
export function getShuffledPreseasonOrder(seed: string): string[] {
  const names: string[] = PRESEASON_MIDDLE_STEPS.map((s) => s.name);
  for (let i = names.length - 1; i > 0; i--) {
    const j = hashString(`${seed}:orden-pretemp:${i}`) % (i + 1);
    [names[i], names[j]] = [names[j], names[i]];
  }
  return names;
}

export function buildPreseasonMiddleStepByName(name: string, seed: string): GameEvent | null {
  const step = PRESEASON_MIDDLE_STEPS.find((s) => s.name === name);
  return step ? step.build(seed) : null;
}

export function getPreseasonMiddleStepNameById(id: string): string | null {
  const step = PRESEASON_MIDDLE_STEPS.find((s) => s.id === id);
  return step ? step.name : null;
}

export function buildPreseasonBienvenidaEvent(club: string, seed: string): GameEvent {
  const quotes = [
    `Primer día en las instalaciones del ${club}. El director deportivo te recibe: 'Bienvenido. La pretemporada es para adaptarte. Trabaja duro y las oportunidades llegarán.'`,
    `Llegas a la ciudad deportiva del ${club} con la maleta aún en la mano. 'No hago esto con todos', te dice el entrenador. 'No prometo minutos, prometo una oportunidad justa.'`,
    `El vestuario del ${club} está medio vacío — la mayoría sigue de vacaciones. Un utillero te enseña tu taquilla, ya con tu nombre puesto. 'Bienvenido a casa', sonríe.`,
    `Rueda de prensa de presentación: un periodista pregunta si te sientes preparado. Contestas lo que se espera, con los nervios reales por dentro.`,
    `Nadie te recibe con discursos: solo un chándal del ${club} en la taquilla y una nota a mano. 'A las 9 en el gimnasio, no llegues tarde'. Y, de algún modo, eso te tranquiliza más.`,
    `Charla de bienvenida colectiva, junto a otros dos fichajes que tampoco conoces de nada. Mismo discurso para los tres: aquí empiezas igual que cualquiera.`,
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
        outcomeText: "Tu respuesta llega rápido a oídos del cuerpo técnico. El preparador físico te lo dice más tarde: 'Con esa cabeza, vas a llegar lejos'.",
      },
      {
        id: "confiado",
        label: "Confiado: 'Estoy listo para competir desde ya'",
        subtitle: "Seguridad en tus capacidades",
        consequences: { moral: 3, rel_entrenador: 1, forma: 2 },
        outcomeText: "Lo dices alto y claro, con una sonrisa. En el grupo, unos te miran con simpatía y otros con una ceja arqueada: ya te están tomando la medida.",
      },
    ],
  };
}

export function buildPreseasonFisicoEvent(seed: string): GameEvent {
  const scenes = [
    "Sprint, salto vertical, resistencia: el preparador físico revisa tus números. 'Vas a mitad de ritmo de los veteranos, pero tranquilo. En dos semanas estarás al nivel de todos.'",
    "Test de VO2 máx en la cinta, mascarilla puesta, hasta que las piernas dicen basta. 'Capacidad aeróbica bien', dice el preparador físico. 'La fuerza en tren inferior necesita trabajo.'",
    "Pesaje el primer día: el preparador físico anota cada dato en silencio. 'Físicamente estás donde debes. La diferencia con los veteranos es la lectura del partido, y eso solo lo da jugar.'",
    "En el gimnasio, un veterano te reta a sentadillas sin avisar que es la broma habitual con los nuevos. Aguantas más de lo esperado, y el preparador físico apunta algo con media sonrisa.",
    "Escáner de movimiento en 3D: analizan cada zancada buscando asimetrías. 'Cargas de más el lado derecho al frenar', señala el preparador físico. 'Lo corregimos antes de que sea lesión.'",
    "Press de banca junto a dos veteranos del club: tus números no están mal, pero se nota la diferencia de kilos acumulados. Uno comenta, sin maldad: 'este necesita un año entero de gimnasio.'",
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
        outcomeText: "Te quedas una hora más cada tarde sin una queja. El resto del equipo se va, y tú sigues con las cuerdas y los conos.",
      },
      {
        id: "competitivo",
        label: "Presionarte a ti mismo: 'Voy a estar al nivel en una semana'",
        subtitle: "Ambición pero riesgo",
        consequences: { forma: 3, moral: 3, rel_entrenador: 1 },
        outcomeText: "Te marcas una semana de plazo ante el espejo y entrenas como si cada sesión fuera un partido. Al quinto día, el míster se queda mirándote desde la banda.",
      },
    ],
  };
}

export function buildPreseasonCompetenciaEvent(seed: string): GameEvent {
  const scenes = [
    "En el vestuario te presentan a los dos jugadores de tu posición: uno de 27, indiscutible, y otro de 22, con hambre. Los dos te saludan correctamente. El mensaje es claro: toca ganarles el puesto.",
    "En el primer entrenamiento táctico descubres a tres jugadores más peleando por tu posición, uno recién llegado en un traspaso mucho más caro que el tuyo. El orden en la pizarra no engaña.",
    "Un veterano de tu posición se acerca en el descanso, no a saludarte sino a medirte: '¿Tú eres el nuevo? He visto tus vídeos.' No dice si le gustó. Sientes sus ojos encima todo el entreno.",
    "El entrenador junta a los cuatro jugadores de tu posición: 'Competencia sana. El que mejor entrene, juega.' Suena justo, pero las miradas que cruzas dejan claro que nadie te lo va a poner fácil.",
    "Te enteras por un compañero, no por el club, de que el titular de tu posición pidió salir hace semanas. Si aguantas la pretemporada sin fallar, el sitio podría quedar libre antes de lo esperado.",
    "En la lista del primer amistoso aparecéis dos de tu posición: tú, y un canterano de 18 años del que todos hablan como 'el próximo crack'. Nadie lo dice en alto, pero sabéis a qué habéis venido.",
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
        outcomeText: "El veterano del equipo te mira un segundo y asiente: 'Pregunta lo que quieras'. Desde ese día, te sientas a su lado en la comida.",
      },
      {
        id: "desafiante",
        label: "Ver la competencia como motivación: 'Voy a quitarles el puesto'",
        subtitle: "Actitud de competidor",
        consequences: { moral: 4, rel_vestuario: -1, forma: 2 },
        outcomeText: "Lo dices bajito, para ti. Pero un compañero que te oye de reojo sonríe: 'Bienvenido a la guerra'.",
      },
    ],
  };
}

export function buildPreseasonTacticaEvent(seed: string): GameEvent {
  const scenes = [
    "El técnico reúne a tu zona del campo: '4-3-3 de transición rápida, defendemos en bloque. Tienes velocidad, pero a veces pierdes posición. Eso aquí no puede pasar.'",
    "Charla de pizarra con todo el equipo: el técnico dibuja un 4-2-3-1 y señala tu zona. 'Aquí se gana o se pierde el partido.' Luego, aparte: 'Entiende el espacio antes de tener el balón.'",
    "Vídeo de la pretemporada pasada explicando el nuevo 3-5-2: 'Este sistema exige mucho recorrido y mucha lectura', dice el técnico mirando en tu dirección. 'Tú vas a tener que entenderlo rápido.'",
    "En la sala de vídeo, pausan un fotograma de tu entrenamiento: 'Aquí. Esta es la posición que nos interesa que ocupes.' Toda la sala mira la pantalla, y luego te mira a ti.",
    "El técnico cambia el sistema a mitad de charla, sin avisar: '4-3-3... no, 3-4-3. Vosotros ahí.' Te señala a ti y a otro para una posición que ninguno ha jugado nunca. 'A ver cómo os las apañáis.'",
    "Te entregan una carpeta con tu nombre en la portada: análisis en vídeo de cada partido de tu temporada pasada, anotado a mano. 'Hemos hecho los deberes antes de que llegaras. Ahora te toca a ti.'",
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
        outcomeText: "El técnico asiente, satisfecho, y sigue con la pizarra sin decir más — pero apunta algo en su libreta justo después de mirarte, y eso no te pasa desapercibido.",
      },
      {
        id: "seguro",
        label: "Confiado en tu instinto: 'Mi posición es mi fortaleza'",
        subtitle: "Confianza defensiva",
        consequences: { rel_entrenador: 1, forma: 3, moral: 2 },
        outcomeText: "El técnico levanta una ceja, ni convencido ni molesto. 'Ya veremos', dice, con el tono de quien reserva su opinión para cuando de verdad importe: los partidos.",
      },
    ],
  };
}

export function buildPreseasonCapitan(seed: string): GameEvent {
  const scenes = [
    "Después del entrenamiento, el capitán se te acerca: 'Conozco la tensión que sientes, yo estuve ahí. No intentes demostrarlo todo el primer mes. Gana el respeto del vestuario.' Te invita a comer con el grupo.",
    "El capitán te espera junto al coche al salir: 'Súbete, te llevo a comer.' Habla más de su primer año en el club que de fútbol. Al despedirse: 'Lo que necesites, me buscas a mí primero, no a la prensa.'",
    "En una cena de equipo, el capitán te sienta deliberadamente a su lado. 'Aquí las jerarquías se ganan en el campo, pero el respeto se construye en momentos como este', dice, brindando con el grupo.",
    "Te sorprende que sea el capitán, no el entrenador, quien te corrige en un rondo: 'Ese control, ábrelo al primer toque, aquí jugamos rápido.' No suena a bronca. Suena a alguien que ya invirtió en ti.",
    "El capitán te manda llamar al gimnasio pequeño. Te espera solo, con dos botellas de agua: 'No hago discursos delante de todos. Prefiero conocer a la gente uno a uno. Cuéntame de dónde vienes.'",
    "En el autobús de vuelta de un amistoso, el capitán se sienta a tu lado y se queda dormido en cinco minutos. Al despertar, sin disculparse: 'Contigo me siento tranquilo, no sé por qué', dice medio en broma.",
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
        outcomeText: "El capitán sonríe y te da un apretón de manos que dice más que cualquier discurso. Desde ese día, cuando habla el vestuario, también te mira a ti para ver cómo reaccionas.",
      },
      {
        id: "independiente",
        label: "Valorar el gesto pero preferir enfocarte solo en jugar",
        subtitle: "Mentalidad de lobo solitario",
        consequences: { moral: 2, rel_vestuario: 1, forma: 2 },
        outcomeText: "El capitán asiente, sin ofenderse. 'Respeto', dice solamente, y vuelve a lo suyo — pero en los días siguientes lo notas un poco más distante, como quien no insiste dos veces.",
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
    {
      texto:
        "Un amigo de la infancia te manda un audio riéndose de un vídeo tuyo entrenando que ya circula por el grupo del barrio: 'Tío, pareces de verdad un futbolista.' No es burla, es orgullo disfrazado de broma — el mismo que os teníais de niños cuando jugabais en el descampado con las porterías hechas con jerséis.",
      prompt: "Le contestas al grupo del barrio. ¿Qué les dices?",
    },
    {
      texto:
        "Tu abuelo, que apenas usa el móvil, consigue que alguien le ayude a mandarte un mensaje de texto de una sola línea, sin acentos ni mayúsculas: 'orgulloso de ti hijo, a por todas'. No dice nada más, pero es la primera vez que te escribe algo así en la vida.",
      prompt: "¿Cómo le respondes a tu abuelo?",
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
        outcomeText: "Cuelgas con un nudo pequeño en el pecho, pero también con la certeza tranquila de que esto es justo donde tienes que estar ahora mismo.",
      },
      {
        id: "determinado",
        label: "Usar esa llamada como motivación: 'Voy a hacerlo por ellos'",
        subtitle: "Propósito familiar",
        consequences: { moral: 5, forma: 1 },
        outcomeText: "Cuelgas con una energía distinta, casi física — la clase de motivación que no se explica con palabras, solo se nota al día siguiente en el campo.",
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
        outcomeText: "El míster no te dice nada, pero al pasar a tu lado te da una palmada rápida en el hombro. Para él, eso es un elogio.",
      },
      {
        id: "hambriento",
        label: "Sentir que pudiste haber hecho más y prometer esfuerzo extra",
        subtitle: "Mentalidad ganadora",
        consequences: { moral: tramo.consequences.moral - 1, forma: tramo.consequences.forma + 1, rel_entrenador: tramo.consequences.rel_entrenador + 1 },
        outcomeText: "Prometes más esfuerzo y lo cumples: al día siguiente llegas antes que nadie. El míster levanta la vista desde su despacho y lo anota.",
      },
      {
        id: "relativizar",
        label: "Quitarle hierro delante de la prensa: 'es solo un amistoso'",
        subtitle: "Gestión de imagen",
        consequences: { fama: 1, rel_aficion: 1, forma: Math.max(0, tramo.consequences.forma - 1) },
        outcomeText: "'Es solo un amistoso', dices con una sonrisa. En la rueda de prensa, algún periodista asiente, otros no pueden evitar apuntar la frase.",
      },
    ],
  };
}
