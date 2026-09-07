import type { GameEvent } from "@/types/career";

/**
 * 18 eventos narrativos adicionales para la carrera principal.
 * Temáticas: conflictos, lesiones, escándalos, presión, oportunidades inesperadas.
 */
export const EXTRA_EVENTS: GameEvent[] = [
  // Conflictos y dinámicas de equipo
  {
    id: "conflicto-compañero",
    category: "equipo",
    title: "Un compañero quiere tu puesto",
    description:
      "Un suplente de tu posición ha empezado a meter goles en los entrenamientos. El entrenador empieza a darle minutos. Él ha dejado claro en la prensa que ve tu lugar como suyo.",
    options: [
      {
        id: "competir",
        label: "Competir directamente: subir intensidad en entrenamientos",
        subtitle: "Demostrar en el campo que eres el mejor",
        consequences: { forma: 5, rel_entrenador: 3, moral: 2 },
      },
      {
        id: "mentor",
        label: "Mentor mental: ayudarle a crecer (y a calmarse)",
        subtitle: "Sorprendentemente podrías haceros amigos",
        consequences: { moral: 5, rel_entrenador: 2, fama: 1 },
      },
      {
        id: "desairar",
        label: "Ignorarlo completamente en el vestuario",
        subtitle: "Que se sienta invisible",
        consequences: { forma: -2, moral: -3, rel_entrenador: -2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Algo que quieras decirle directamente?",
  },

  {
    id: "lesion-seria",
    category: "salud",
    title: "Una lesión te deja fuera meses",
    description:
      "En un entrenamiento un contrario te toca feo. Los médicos del club dicen que son 4 meses de baja mínimo. Tu carrera se detiene en seco. Tus compañeros avanzan sin ti.",
    options: [
      {
        id: "recuperar-fuerte",
        label: "Usar el tiempo para entrenar mental y recuperación extrema",
        subtitle: "Vuelves más fuerte",
        consequences: { forma: -8, moral: -4, fama: -2, rel_entrenador: 1 },
      },
      {
        id: "depresión",
        label: "Caer en la depresión de no jugar",
        subtitle: "La inactividad duele más que la lesión",
        consequences: { forma: -15, moral: -8, fama: -3 },
      },
      {
        id: "reinvencion",
        label: "Prepararse para jugar una posición diferente al volver",
        subtitle: "Quizás esto te abre nuevas puertas",
        consequences: { forma: -5, moral: 2, fama: -1, entrenador_opinion: "flexible" },
      },
    ],
  },

  {
    id: "escandalo-personal",
    category: "escandalo",
    title: "Un secreto tuyo sale a la luz",
    description:
      "Un tabloid publica fotos tuyas en una situación comprometida (una fiesta salvaje, un romance inesperado, algo que dijiste hace años sin pensar). El foco mediático es brutal.",
    options: [
      {
        id: "negar",
        label: "Negar rotundamente todo",
        subtitle: "Estrategia legal y sin dar más leña",
        consequences: { fama: -5, moral: -3, rel_prensa: -4 },
      },
      {
        id: "asumir",
        label: "Asumir, pedir perdón público y seguir adelante",
        subtitle: "La gente respeta la honestidad",
        consequences: { fama: -2, moral: 4, rel_prensa: 2 },
      },
      {
        id: "ignorar",
        label: "No decir nada y dejar que el escándalo se disipe solo",
        subtitle: "A veces el silencio es más poderoso",
        consequences: { fama: -3, moral: 1, rel_prensa: -2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Cómo responderías a la prensa?",
  },

  {
    id: "triple-jornada",
    category: "presión",
    title: "Liga, Copa y Champions el mismo mes",
    description:
      "Tu equipo avanza en todas las competiciones. De repente hay 3 partidos cada 5 días. El cuerpo técnico rota pero quieren que juegues todos los partidos importantes.",
    options: [
      {
        id: "jugar-siempre",
        label: "Jugar cada partido: demostrar que aguantas todo",
        subtitle: "Riesgo de agotamiento pero visibilidad máxima",
        consequences: { forma: 3, fama: 5, moral: 2, injury_risk: 1 },
      },
      {
        id: "gestionar",
        label: "Pedirle al entrenador que te dose estratégicamente",
        subtitle: "Que juegues los más importantes",
        consequences: { forma: 1, fama: 2, moral: 3, rel_entrenador: 2 },
      },
      {
        id: "rotura",
        label: "Forzar cada partido sabiendo que puedes romperte",
        subtitle: "Todo o nada",
        consequences: { forma: 2, fama: 6, moral: 4, injury_risk: 3 },
      },
    ],
  },

  {
    id: "oferta-rival-ciudad",
    category: "transferencia",
    title: "Tu rival de ciudad quiere ficharte",
    description:
      "El equipo rival de la misma ciudad hace una oferta récord por ti. Tu actual club intenta retener porque saben lo que significa perder ante el rival. La decisión es entre dinero, gloria local o lealtad.",
    options: [
      {
        id: "aceptar",
        label: "Aceptar la oferta y convertirte en 'traidor' local",
        subtitle: "Dinero récord pero enemistad eterna",
        consequences: { patrimonio: 25000, fama: 3, moral: -5, club: "Rival de ciudad" },
      },
      {
        id: "rechazar",
        label: "Rechazar y convertirte en héroe del club actual",
        subtitle: "Lealtad que la afición nunca olvidará",
        consequences: { fama: 6, moral: 6, rel_entrenador: 5, patrimonio: 5000 },
      },
      {
        id: "negociar",
        label: "Usarla para presionar a tu club actual por mejores términos",
        subtitle: "Jugar al póker con dos gigantes",
        consequences: { fama: 2, moral: -1, patrimonio: 10000, rel_entrenador: -2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué significa este club para ti?",
  },

  {
    id: "amistad-rival",
    category: "relaciones",
    title: "Te haces amigo íntimo de un jugador rival",
    description:
      "En una gira internacional conoces a un tipo que juega para vuestro rival de liga. Os caéis genial. Empezáis a hablar por teléfono, a cenar juntos entre partidos. Vuestros clubs se enteran y no les gusta nada.",
    options: [
      {
        id: "continuar",
        label: "Seguir viéndote con él, sin importar lo que digan",
        subtitle: "La amistad es más importante que el fútbol",
        consequences: { moral: 5, rel_entrenador: -3, fama: 2, forma: -1 },
      },
      {
        id: "alejarse",
        label: "Distanciarte para no crear conflictos internos",
        subtitle: "Profesionalidad por encima de todo",
        consequences: { moral: -2, rel_entrenador: 3, fama: 1, forma: 1 },
      },
      {
        id: "discreto",
        label: "Seguir siendo amigos pero en secreto, solo fuera del fútbol",
        subtitle: "Lo mejor de ambos mundos",
        consequences: { moral: 2, rel_entrenador: 1, fama: 0 },
      },
    ],
  },

  {
    id: "cambio-entrenador-radical",
    category: "equipo",
    title: "Nuevo entrenador llega con visión radicalmente distinta",
    description:
      "El club cambia de entrenador. El nuevo es famoso por su estilo agresivo e impredecible. Tu posición en el equipo es incierta. Algunos de tus aliados están siendo marginados.",
    options: [
      {
        id: "adaptarse",
        label: "Aprender rápido su sistema y convertirte en su favorito",
        subtitle: "Flexibilidad extrema",
        consequences: { forma: 3, rel_entrenador: 5, fama: 2, moral: 1 },
      },
      {
        id: "resistir",
        label: "Mantener tu estilo y demostrar que es superior al suyo",
        subtitle: "Confrontación directa",
        consequences: { forma: 2, rel_entrenador: -4, fama: -1, moral: 3 },
      },
      {
        id: "salida",
        label: "Pedir salida si no crees que encajas en su proyecto",
        subtitle: "Buscar otro club",
        consequences: { moral: 2, rel_entrenador: -3, fama: -2 },
      },
    ],
  },

  {
    id: "descubrimiento-talento",
    category: "equipo",
    title: "Un jovencito llega a tu equipo y es increíble",
    description:
      "Un chaval de la cantera sube al primer equipo. Es joven, hambriento, rápido, técnicamente perfecto. Todos ven en él el futuro. Tú ves la amenaza.",
    options: [
      {
        id: "guiar",
        label: "Convertirte en su mentor: enséñale todo lo que sabes",
        subtitle: "Dejar legado es más que recordados de goles",
        consequences: { moral: 6, rel_entrenador: 4, fama: 4, forma: -1 },
      },
      {
        id: "bloquearlo",
        label: "Hacerle la vida difícil en entrenamientos y vestidor",
        subtitle: "Mantén tu posición por la fuerza",
        consequences: { moral: -5, rel_entrenador: -4, forma: 2, fama: -2 },
      },
      {
        id: "ignorar",
        label: "Actuar como si no existiera, que se busque la vida",
        subtitle: "Neutral pero distante",
        consequences: { moral: 0, rel_entrenador: 0, fama: -1 },
      },
    ],
  },

  {
    id: "oferta-hollywood",
    category: "oportunidad",
    title: "Te ofrecen un papel en una película de acción",
    description:
      "Un productor de cine te ve en la tele y quiere ficharte para un papel secundario en una gran producción. Filmaría durante la pretemporada. Tu club dice que no, que es un distracción.",
    options: [
      {
        id: "aceptar-directo",
        label: "Aceptar directo, negocia después con el club",
        subtitle: "Carrera paralela potencial",
        consequences: { fama: 8, patrimonio: 5000, forma: -2, rel_entrenador: -3 },
      },
      {
        id: "rechazar",
        label: "Rechazarlo para enfocarte en la carrera futbolística",
        subtitle: "El fútbol es lo primero",
        consequences: { fama: 1, moral: 3, rel_entrenador: 3 },
      },
      {
        id: "esperar",
        label: "Decirles que quizás después de la temporada",
        subtitle: "No cerrar puerta pero tampoco saltar",
        consequences: { fama: 2, rel_entrenador: 1 },
      },
    ],
  },

  {
    id: "decision-moral",
    category: "responsabilidad",
    title: "Una ONGt te pide que lidera una campaña de caridad",
    description:
      "Una organización internacional quiere que seas la cara de una campaña contra la pobreza infantil. Significaría 10-15 horas de trabajo por mes: viajes, fotos, entrevistas. Tu club es ambivalente.",
    options: [
      {
        id: "comprometerse",
        label: "Decir que sí, aunque afecte tu tiempo de recuperación",
        subtitle: "Tu voz puede cambiar vidas",
        consequences: { fama: 7, moral: 8, forma: -1, patrimonio: -2000 },
      },
      {
        id: "superficial",
        label: "Participar pero de forma ligera: solo tu nombre y foto",
        subtitle: "El apoyo sin el sacrificio",
        consequences: { fama: 3, moral: 2, forma: 0 },
      },
      {
        id: "rehusar",
        label: "Declinar educadamente: ahora no tienes energía mental",
        subtitle: "Tu carrera deportiva necesita todo tu foco",
        consequences: { moral: 1, forma: 1 },
      },
    ],
  },

  {
    id: "gol-de-ultimo-aliento",
    category: "drama",
    title: "Anotas el gol más importante en el derbi más salvaje",
    description:
      "Último minuto, empate, tu rival está haciendo toda la ley. Robes la pelota, llegas a la línea de gol y definís con la cabeza. El estadio literalmente se desmorona. Tu nombre entra en la historia.",
    options: [
      {
        id: "celebracion-animal",
        label: "Celebración descontrolada: sin camiseta, saltando a los aficionados",
        subtitle: "Que recuerden tu emoción pura",
        consequences: { fama: 9, moral: 10, forma: 0, tarjeta_roja: 0.3 },
      },
      {
        id: "profesional",
        label: "Celebración elegante: una rodilla al suelo, puño al aire",
        subtitle: "Respeto al rival, respeto a la historia",
        consequences: { fama: 8, moral: 8, forma: 0 },
      },
      {
        id: "humilde",
        label: "Gesto humilde: punto al cielo, abrazo con compañeros",
        subtitle: "Que sepan que no todo es mérito tuyo",
        consequences: { fama: 7, moral: 9, forma: 0 },
      },
    ],
  },

  {
    id: "acoso-aficiones",
    category: "presión",
    title: "Aficionados acosan a tu familia",
    description:
      "Por una mala racha de forma, algunos aficionados radicales empiezan a acosar a tu familia: insultos en redes, apariciones en tu calle. Tu mujer/pareja tiene miedo. La policía dice que puede ser difícil de parar.",
    options: [
      {
        id: "publico",
        label: "Responder públicamente: llamada a la tolerancia, identidad de acosadores",
        subtitle: "Confrontación directa",
        consequences: { moral: 3, fama: -2, forma: -2, rel_prensa: 2 },
      },
      {
        id: "privado",
        label: "Ir a la policía en privado, cambiar rutinas, proteger tu hogar",
        subtitle: "Acción directa sin spotlight",
        consequences: { moral: 1, fama: -1, forma: 1 },
      },
      {
        id: "salida",
        label: "Pedir salida del club: la gente aquí no te quiere, punto",
        subtitle: "Priorizar paz mental sobre carrera",
        consequences: { moral: 5, fama: -4, forma: 0, club_change: true },
      },
    ],
  },

  {
    id: "dopaje-acusacion-falsa",
    category: "escandalo",
    title: "Te acusan falsamente de dopaje",
    description:
      "Un análisis sale positivo en una sustancia que no has tomado. Alguien en el cuerpo técnico teme sabotaje. Tienes que demostrar inocencia pero el daño reputacional es inmediato.",
    options: [
      {
        id: "batalla-legal",
        label: "Batalla legal abierta: contratar mejores abogados, demandar de vuelta",
        subtitle: "Gastar tiempo y dinero pero limpiar tu nombre totalmente",
        consequences: { fama: -5, patrimonio: -8000, moral: 4, forma: -3 },
      },
      {
        id: "apoyo-club",
        label: "Confiar en el club para que defienda tu inocencia",
        subtitle: "Menos visible mediáticamente",
        consequences: { fama: -2, rel_entrenador: 5, moral: 2, forma: -1 },
      },
      {
        id: "silencio",
        label: "Decir poco, dejar que las pruebas hablen",
        subtitle: "Misterioso pero arriesgado",
        consequences: { fama: -3, moral: 0, forma: 0 },
      },
    ],
  },

  {
    id: "regadera-loca",
    category: "surreal",
    title: "El árbitro hace un cambio de reglas completamente surrealista",
    description:
      "En pleno partido, el árbitro decide que se juega sin fuera de juego el resto del segundo tiempo 'para igualar el juego'. Otras locuras similares. Tu equipo se beneficia pero es absurdo.",
    options: [
      {
        id: "aprovecharse",
        label: "Explotar sin piedad: anotarás 2 goles con eso",
        subtitle: "Una vez la suerte te sonríe",
        consequences: { fama: 5, moral: -1, forma: 2 },
      },
      {
        id: "protestar",
        label: "Caminar hacia el árbitro y protestar públicamente",
        subtitle: "Defender la integridad del juego",
        consequences: { moral: 6, fama: 2, tarjeta_roja: 0.5 },
      },
      {
        id: "humor",
        label: "Aceptar la locura con humor: reírte con compañeros",
        subtitle: "Uno de esos días raros que recordarás siempre",
        consequences: { moral: 4, fama: 3, forma: 1 },
      },
    ],
  },

  {
    id: "video-viral-gracioso",
    category: "fama",
    title: "Un vídeo tuyo haciendo algo ridículo se hace viral",
    description:
      "Una cámara de seguridad o un aficionado captura un momento tuyo off-field completamente fuera de lugar: bailando mal, cocinando un desastre, hablando en idiomas raros. Explota en redes.",
    options: [
      {
        id: "abrazar",
        label: "Abrazar la viralidad: hacer más vídeos así",
        subtitle: "Convertirte en meme es rentable",
        consequences: { fama: 8, patrimonio: 3000, moral: 2, forma: -1 },
      },
      {
        id: "reír",
        label: "Reírte de ti mismo públicamente: 'soy terrible' video completo",
        subtitle: "La autoirronía te hace humano",
        consequences: { fama: 5, moral: 5, forma: 0 },
      },
      {
        id: "ignorar",
        label: "Preguntar a redes sociales que se enfoquen en fútbol, no en tonterías",
        subtitle: "Mantener la línea profesional",
        consequences: { fama: -1, moral: 2, forma: 1 },
      },
    ],
  },

  {
    id: "entrenador-personalizado",
    category: "mejora",
    title: "Oportunidad de entrenador personal de élite internacional",
    description:
      "El prestigioso entrenador de un campeón del mundo quiere trabajar contigo personalmente. Costaría 50.000 € al año. Tu actual club no lo sabría.",
    options: [
      {
        id: "secreto",
        label: "Hacerlo en secreto: sesiones en tus vacaciones",
        subtitle: "Mejora clandestina",
        consequences: { forma: 6, fama: 1, rel_entrenador: -2, patrimonio: -50000 },
      },
      {
        id: "consenso",
        label: "Proponer al club: lo comparten para mejorar aún más",
        subtitle: "Transparencia que beneficia a todos",
        consequences: { forma: 4, rel_entrenador: 3, patrimonio: -25000 },
      },
      {
        id: "rechazar",
        label: "Rechazar: confías en el actual cuerpo técnico",
        subtitle: "Lealtad total",
        consequences: { rel_entrenador: 5, moral: 4 },
      },
    ],
  },

  {
    id: "reunion-oscura",
    category: "misterio",
    title: "Un intermediario misterioso te aborda con una 'oportunidad especial'",
    description:
      "Un tipo vago en un bar te dice que sabe de clubs árabes con dinero infinito que te quieren. No dice exactamente cómo, ni con detalles. Suena oscuro. Podría ser verdad o una estafa completa.",
    options: [
      {
        id: "evitar",
        label: "Cortar de raíz: 'No me interesa, adiós'",
        subtitle: "Las cosas turbias nunca terminan bien",
        consequences: { moral: 3, forma: 0 },
      },
      {
        id: "escuchar",
        label: "Escucharlo pero con tu agente presente en la siguiente reunión",
        subtitle: "Curiosidad protegida",
        consequences: { fama: 1, forma: -1, moral: 0 },
      },
      {
        id: "ignorar_publico",
        label: "Contarlo en la prensa como intento de soborno",
        subtitle: "Exponerlo antes de que te comprometa",
        consequences: { moral: 7, fama: 3, rel_prensa: 3 },
      },
    ],
  },

  {
    id: "final-carrera-cercano",
    category: "reflexion",
    title: "Empiezas a sentir que la carrera toca a su fin",
    description:
      "Ya no recuperas tan rápido. Los jovencitos te adelantan en velocidad. Tu rodilla duele después de cada partido. El entrenador empieza a considerarte 'veterano' en tono protector. La realidad duele.",
    options: [
      {
        id: "pelear",
        label: "Dar la batalla total: operaciones, gimnasios especializados, dieta extrema",
        subtitle: "Gastar todo para alargar 2-3 años más",
        consequences: { forma: 3, patrimonio: -15000, moral: 4, fama: 1 },
      },
      {
        id: "aceptar",
        label: "Aceptar la realidad: prepárate mentalmente para el retiro próximo",
        subtitle: "Transición con dignidad",
        consequences: { forma: -1, moral: 8, fama: 2 },
      },
      {
        id: "negar",
        label: "Actuar como si nada hubiera cambiado: mismo ritmo, sin adaptación",
        subtitle: "Ilusión peligrosa",
        consequences: { forma: -3, moral: -2, fama: -1, injury_risk: 1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué significa el fútbol para ti en este momento?",
  },
];
