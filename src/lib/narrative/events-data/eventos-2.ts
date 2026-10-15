/** Escenas fijas del juego, parte 2 de 6 (antes vivían en events.ts; el orden del conjunto no ha cambiado). */
import type { GameEvent } from "@/types/career";

export const EVENTS_2: GameEvent[] = [
  {
    id: "esp-doble",
    category: "especial",
    title: "Aparece un sosías tuyo en otro país",
    description: "Se viraliza un video de alguien idéntico a ti jugando en una liga amateur al otro lado del mundo.",
    options: [
      {
        id: "a",
        label: "Compartirlo en tus redes",
        subtitle: "Lo conviertes en chiste propio",
        consequences: { fama: 6, moral: 3 },
        outcomeText: "Compartes el vídeo con un 'ya me están copiando'. Tu doble te responde con un emoji de gol y la historia da la vuelta al mundo.",
      },
      {
        id: "b",
        label: "No hacerle ni caso",
        subtitle: "Perfil bajo",
        consequences: { moral: 1 },
        outcomeText: "No dices nada y el vídeo se apaga en unos días. Tus amigos, por supuesto, te lo siguen mandando durante semanas.",
      },
    ],
    minWeek: 3,
  },
  {
    id: "esp-anuncio",
    category: "especial",
    title: "Te ofrecen protagonizar un anuncio surrealista",
    description: "Una marca de bebidas te propone una publicidad absurda: apareces jugando al fútbol en el espacio.",
    options: [
      {
        id: "a",
        label: "Aceptar, total es una locura divertida",
        subtitle: "+Patrimonio, +Fama",
        consequences: { patrimonio: 8000, fama: 6 },
        outcomeText: "Grabas el anuncio colgado de unos arneses, con una escafandra sobre el uniforme. Es la tarde más ridícula de tu carrera y, con diferencia, una de las mejor pagadas.",
      },
      {
        id: "b",
        label: "Rechazarlo, no encaja con tu imagen",
        subtitle: "Cuidas tu marca",
        consequences: { rel_representante: -2 },
        outcomeText: "Rechazas con elegancia. Tu representante suspira mientras tacha una línea en su libreta: 'Con lo que hubiéramos reído'.",
      },
    ],
    minWeek: 8,
  },
  {
    id: "esp-paloma",
    category: "entrenamiento",
    title: "La paloma que no se va",
    description:
      "Una paloma se instala en mitad del círculo central durante el calentamiento y se niega a moverse ni con balones cerca. El cuerpo técnico, muy serio, decide reorganizar el rondo alrededor de ella.",
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic candid photo of the photographed man and teammates standing in a circle on the training pitch around a single pigeon in the middle of the grass, everyone looking down at it with amused, serious expressions, training cones and footballs visible, natural daylight",
    options: [
      {
        id: "a",
        label: "Intentar ahuyentarla tú mismo, como sea",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "moral",
          success: {
            text: "Consigues que se vaya tras una persecución ridícula que graban tres móviles. Te aplauden como si hubieras metido un gol.",
            consequences: { fama: 3, rel_vestuario: 5, moral: 4 },
          },
          fail: {
            text: "La paloma esquiva todos tus intentos y hasta parece burlarse. El vestuario no te va a dejar olvidarlo en semanas.",
            consequences: { rel_vestuario: 2, moral: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Dejarla en paz y entrenar alrededor",
        subtitle: "Aceptar lo inevitable",
        consequences: { rel_vestuario: 3, moral: 1 },
        outcomeText: "Entrenáis alrededor de la paloma durante toda la sesión. Al acabar, ella se va volando como si nada y todo el vestuario aplaude.",
      },
    ],
    minWeek: 15,
  },
  {
    id: "esp-confusion-identidad",
    category: "prensa",
    title: "Te confunden con otro jugador",
    description:
      "Un cámara de televisión te para en la calle emocionadísimo pidiendo una entrevista — y te llama por el nombre de otro futbolista durante los primeros veinte segundos, sin que nadie lo corrija.",
    options: [
      {
        id: "a",
        label: "Seguirle la corriente un rato, total qué más da",
        subtitle: "Situación absurda, +Fama",
        consequences: { fama: 3, moral: 2 },
        outcomeText: "El cámara se da cuenta del error a mitad de la entrevista y se pone colorado. El clip termina circulando por redes como \"el crossover que nadie pidió\".",
      },
      {
        id: "b",
        label: "Sacarlo de su error enseguida",
        subtitle: "Menos gracioso, más honesto",
        consequences: { moral: -1 },
        outcomeText: "Se disculpa mil veces, avergonzado, y la entrevista arranca con un ambiente bastante más incómodo del esperado.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al cámara cuando se da cuenta del error?",
    minWeek: 30,
  },
  {
    id: "esp-nino-sincero",
    category: "vida",
    title: "El niño sincero",
    description:
      'En una clínica de fútbol para chavales, un crío de ocho años te mira fijamente y suelta, delante de todos los padres: "Mi padre dice que ya no eres tan bueno como antes." Se hace un silencio muy largo.',
    options: [
      {
        id: "a",
        label: "Reírte y preguntarle qué más dice su padre",
        subtitle: "Le quitas hierro, +Fama",
        consequences: { fama: 4, moral: 3 },
        outcomeText: "Te agachas y le preguntas qué más dice su padre. El niño enumera cosas con total seriedad y los padres no pueden parar de reír.",
      },
      {
        id: "b",
        label: "Cambiar de tema rápido",
        subtitle: "Momento incómodo",
        consequences: { moral: -1 },
        outcomeText: "Cambias de tema, pero el niño no te suelta con la mirada. Los padres se miran incómodos y el silencio dura un poco más de lo que debería.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes al crío?",
    minWeek: 25,
  },
  {
    id: "esp-camiseta-pirata",
    category: "prensa",
    title: "Tu nombre, mal escrito",
    description:
      "Un puesto callejero cerca del estadio vende camisetas piratas con tu apellido... con una letra de más. Alguien te manda la foto por privado con cuarenta emojis de risa.",
    options: [
      {
        id: "a",
        label: "Comprarte una y colgarla en redes",
        subtitle: "Le sacas partido al fallo, +Fama",
        consequences: { fama: 6, moral: 4 },
        outcomeText: "La foto con la camiseta mal escrita se hace viral en horas — hasta el vendedor ambulante te manda un mensaje de agradecimiento.",
      },
      {
        id: "b",
        label: "Ignorarlo, no darle más bombo",
        subtitle: "Perfil bajo",
        consequences: {},
        outcomeText: "No dices nada, pero la foto sigue circulando por el grupo de WhatsApp del vestuario durante toda la semana.",
      },
    ],
    minWeek: 35,
  },
  {
    id: "esp-meme",
    category: "especial",
    title: "Te conviertes en meme",
    description:
      "Una foto tuya con una cara rarísima en pleno festejo de gol se hace viral. En menos de un día, la gente la usa para hablar de absolutamente cualquier cosa menos de fútbol.",
    imageScene:
      "Photorealistic candid sports photo of the photographed man mid-celebration with an exaggerated, funny facial expression, stadium crowd blurred in the background, flash photography style",
    options: [
      {
        id: "a",
        label: "Reírte tú también y compartirlo",
        subtitle: "+Fama, cae bien",
        consequences: { fama: 8, rel_aficion: 5, moral: 3 },
        outcomeText: "Compartes tu propia cara de festejo con un comentario irónico. La gente te adora un poco más cada día que el meme sigue circulando.",
      },
      {
        id: "b",
        label: "Que no te haga ni pizca de gracia",
        subtitle: "Se nota que te molesta",
        consequences: { fama: 2, moral: -3 },
        outcomeText: "Se nota que no te hace gracia. Eso, por supuesto, le da más combustible al meme durante toda una semana.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "Si lo compartes tú también, ¿qué pie de foto le pones?",
    minWeek: 40,
  },
  {
    id: "esp-patrocinio-chorizo",
    category: "representante",
    title: "Una oferta de patrocinio de lo más rara",
    description:
      'Una fábrica de embutidos de un pueblo pequeño te ofrece ser la imagen de su nueva línea de chorizo "edición futbolista". El cheque no está nada mal para lo poco que piden.',
    options: [
      {
        id: "a",
        label: "Aceptar, totalmente en serio",
        subtitle: "+Patrimonio, +Fama rara",
        consequences: { patrimonio: 4000, fama: 3, moral: 2 , flags: { patrocinio_chorizo: true } },
        outcomeText: "Posas con un chorizo en la mano frente a un cartel gigante. Al día siguiente, la fábrica vende más que en todo el año y te manda una caja de regalo.",
      },
      {
        id: "b",
        label: "Rechazar educadamente, no pega con tu imagen",
        subtitle: "Cuidas tu marca",
        consequences: { rel_representante: 2 },
        outcomeText: "Rechazas con educación. La fábrica lo entiende y te desea suerte, pero el dueño te manda de todas formas un chorizo por mensajería.",
      },
    ],
    minWeek: 20,
  },
  {
    id: "vid-dorsal-homenaje",
    category: "vestuario",
    title: "El dorsal que vas a llevar",
    description:
      "El utillero te pregunta qué número quieres llevar esta temporada. Es tu oportunidad de convertirlo en algo con significado, no solo un número más en la espalda.",
    allowFreeText: true,
    freeTextPrompt: "¿A quién se lo dedicas, si es que se lo dedicas a alguien?",
    options: [
      {
        id: "a",
        label: "Elegir el número de un ídolo de tu infancia",
        subtitle: "Carga emocional, expectativas altas",
        consequences: { moral: 5, fama: 2 , flags: { dorsal_homenaje: true } },
        outcomeText: "Cuando el utillero te entrega la camiseta con ese número, se te hace un nudo en la garganta. Esa noche, mandas una foto a tu padre sin escribir nada.",
      },
      {
        id: "b",
        label: "Pedir un número libre, sin dedicarlo a nadie",
        subtitle: "Empezar tu propia historia desde cero",
        consequences: { moral: 2 },
        outcomeText: "Escoges un número libre y el utillero asiente. Es el primer paso para escribir algo que sea tuyo y de nadie más.",
      },
      {
        id: "c",
        label: "No darle ninguna importancia al número",
        subtitle: "Indiferente",
        consequences: {},
        outcomeText: "'Lo que me toque', dices encogiéndote de hombros. El utillero te mira un segundo, anota un número y sigue con su faena.",
      },
    ],
    minWeek: 2,
  },
  {
    id: "esp-broma-vestuario",
    category: "vestuario",
    title: "La broma del vestuario",
    description:
      "Llegas a tu taquilla y la encuentras completamente forrada de papel de aluminio, botas incluidas. Los veteranos observan de reojo, aguantando la risa, esperando tu reacción.",
    options: [
      {
        id: "a",
        label: "Reírte y devolverles la broma la semana que viene",
        subtitle: "+Vestuario",
        consequences: { rel_vestuario: 8, moral: 4 },
        outcomeText: "Te ríes con ganas y los veteranos aplauden. La semana siguiente, la venganza llega: les llenas sus botas de confeti.",
      },
      {
        id: "b",
        label: "Fingir que te ha sentado mal, solo para preocuparlos",
        subtitle: "Contrabroma",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "moral",
          success: {
            text: "Te lo tomas tan en serio que el vestuario entero se disculpa avergonzado, hasta que revelas que era broma. Los tienes comiendo de tu mano.",
            consequences: { rel_vestuario: 10, fama: 2, moral: 6 },
          },
          fail: {
            text: "Se lo creen tanto que la cosa se pone tensa de verdad y cuesta arreglarlo.",
            consequences: { rel_vestuario: -5, moral: -3 },
          },
        },
      },
    ],
    minWeek: 10,
  },
  {
    id: "esp-excompanero-negocio",
    category: "vida",
    title: "Tu excompañero de clase tiene un plan",
    description:
      'Un chico con el que ibas a clase en el instituto, con el que no hablas desde hace años, te escribe de la nada: tiene "la oportunidad de tu vida", algo entre criptomonedas y un local de hamburguesas. Solo necesita un empujón inicial.',
    options: [
      {
        id: "a",
        label: "Escuchar la propuesta, aunque sea por curiosidad",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.35,
          statModifier: "fama",
          success: {
            text: "Sorprendentemente, el negocio funciona mejor de lo esperado y recuperas la inversión con creces.",
            consequences: { patrimonio: 6000, moral: 3 },
          },
          fail: {
            text: "Como te temías, el dinero desaparece en menos de un año sin explicación clara.",
            consequences: { patrimonio: -5000, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "Decir que no, con educación",
        subtitle: "Prudente",
        consequences: { moral: 1 },
        outcomeText: "Le dices que no, con educación. Él responde con un 'sin problema' que suena más a reproche que a otra cosa.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes?",
    minWeek: 30,
  },

  // ── FAMOSEO (el mundo de la fama, más allá del fútbol) ──────────────
  {
    id: "fama-revista-corazon",
    category: "prensa",
    title: 'La revista del corazón te "caza"',
    description:
      'Una revista de cotilleos publica una foto tuya comiendo en una terraza con alguien que no identifican, con el titular "¿Nuevo amor a la vista?". El móvil no para de vibrar.',
    options: [
      {
        id: "a",
        label: "Aclararlo tú mismo en redes",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: {
            text: "Tu aclaración calma las aguas y hasta te ríes del titular en una entrevista.",
            consequences: { fama: 6, moral: 3 },
          },
          fail: {
            text: "Tu respuesta alimenta aún más el rumor. La revista saca una segunda portada.",
            consequences: { fama: 2, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "No decir nada y dejar que se apague solo",
        subtitle: "Perfil bajo",
        consequences: { moral: 1 },
        outcomeText: "Sin ninguna declaración tuya, la revista no tiene con qué alimentar una segunda portada y el rumor se apaga en un par de días.",
      },
    ],
    minWeek: 20,
  },
  {
    id: "fama-gala-benefica",
    category: "especial",
    title: "Te piden ser padrino de una gala benéfica",
    description:
      "Una fundación local te propone ser la cara visible de su gala anual contra el hambre infantil. Alfombra roja, esmoquin, fotos con la alta sociedad de la ciudad.",
    imageScene:
      "Photorealistic photo of the photographed man on a charity gala red carpet, wearing a tuxedo, camera flashes, elegant evening atmosphere",
    options: [
      {
        id: "a",
        label: "Aceptar e implicarte de verdad",
        subtitle: "+Fama, +Reputación pública",
        consequences: { fama: 8, rel_aficion: 5, patrimonio: -500 },
        outcomeText: "Pasas la tarde con los voluntarios y los niños. Al final de la gala, una madre se te acerca a darte las gracias con lágrimas en los ojos.",
      },
      {
        id: "b",
        label: "Aceptar solo la foto, sin más compromiso",
        subtitle: "Cínico pero cómodo",
        consequences: { fama: 4, moral: -2 },
        outcomeText: "Posas para la foto y te marchas pronto. Nadie lo dice en voz alta, pero alguien de la organización anota quién se quedó y quién no.",
      },
      {
        id: "c",
        label: "Rechazar, no es lo tuyo",
        subtitle: "Perfil bajo",
        consequences: { moral: 2 },
        outcomeText: "Rechazas la propuesta con educación. La fundación busca otra cara, y tú te quedas con una pequeña punzada de culpa.",
      },
    ],
    minWeek: 35,
  },
  {
    id: "fama-influencer-unboxing",
    category: "prensa",
    title: "Un influencer te etiqueta sin avisar",
    description:
      'Marta Diass sube un vídeo abriendo una caja de regalos "de tu parte" que tú nunca le mandaste, etiquetándote como si fuerais íntimos.',
    options: [
      {
        id: "a",
        label: "Seguirle el rollo en los comentarios",
        subtitle: "+Fama, algo surrealista",
        consequences: { fama: 5, moral: 2 },
        outcomeText: "Comentas el vídeo con una broma y Marta Diass te responde al instante con cinco emojis de corazón. Sus seguidores enloquecen pensando que sois amigos de toda la vida.",
      },
      {
        id: "b",
        label: "Pedirle en privado que lo quite",
        subtitle: "Prudente",
        consequences: { moral: 1 },
        outcomeText: "Lo borra sin problema y te pide disculpas por privado. Nadie fuera se entera de nada.",
      },
      {
        id: "c",
        label: "Ignorarlo del todo",
        subtitle: "No alimentar el ruido",
        consequences: {},
        outcomeText: "El vídeo sigue circulando un par de días hasta que el algoritmo se olvida de él, como de casi todo.",
      },
    ],
    minWeek: 25,
  },
  {
    id: "fama-reality-show",
    category: "representante",
    title: "Un reality show quiere ficharte",
    description:
      "La productora de un programa de telerrealidad muy popular te ofrece una cantidad importante por participar como concursante durante el parón de pretemporada.",
    minMedia: 45,
    options: [
      {
        id: "a",
        label: "Aceptar, la exposición merece la pena",
        subtitle: "+Patrimonio, +Fama, riesgo de imagen",
        consequences: { patrimonio: 12000, fama: 10, rel_entrenador: -5 },
        outcomeText: "Entras en la casa con la maleta y una sonrisa. Los primeros días son un espectáculo, pero el míster no tarda en llamarte para 'hablar de tus prioridades'.",
      },
      {
        id: "b",
        label: "Rechazar, prioriza el fútbol",
        subtitle: "Perfil serio",
        consequences: { rel_entrenador: 4 },
        outcomeText: "Dices que no sin dudar. Tu entrenador, al saberlo, te da una palmada en la espalda: 'Aquí las prioridades están claras'.",
      },
    ],
    minWeek: 45,
  },
  {
    id: "fama-videoclip",
    category: "especial",
    title: "Un artista te quiere en su videoclip",
    description:
      "Malume Baby te propone un cameo de pocos segundos en el videoclip de su próximo single: aparecer marcando un gol imaginario en un escenario surrealista.",
    imageScene:
      "Photorealistic photo of the photographed man on a colorful music video set, dramatic stage lighting, mid football celebration pose, surreal artistic backdrop",
    options: [
      {
        id: "a",
        label: "Aceptar y meterte en el papel",
        subtitle: "+Fama, momento surrealista",
        consequences: { fama: 9, moral: 5 },
        outcomeText: "Marcas un gol imaginario sobre un fondo de neones y un portero con cabeza de pescado. Al verlo editado, no puedes parar de reír.",
      },
      {
        id: "b",
        label: "Rechazar, prefieres mantener perfil futbolístico",
        subtitle: "Serio",
        consequences: { rel_entrenador: 2 },
        outcomeText: "Declinas con una sonrisa. El artista te manda un mensaje: 'Cuando quieras, el cameo es tuyo'.",
      },
    ],
    minWeek: 30,
  },
  {
    id: "fama-relojes-lujo",
    category: "representante",
    title: "Una marca de relojes de lujo te quiere de imagen",
    description:
      "Un fabricante de relojes suizo de gama muy alta ofrece un contrato de varios años a cambio de llevar sus piezas en cada aparición pública.",
    minMedia: 60,
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic close-up photo of the photographed man in a tailored suit adjusting his cuff to show off an exquisite luxury wristwatch, elegant minimalist studio backdrop, dramatic side lighting, high-end watch campaign photography style",
    options: [
      {
        id: "a",
        label: "Firmar el contrato",
        subtitle: "+Patrimonio alto, exclusividad total",
        consequences: { patrimonio: 20000, fama: 5, rel_representante: 3 },
        outcomeText: "Firmas el contrato en una sala forrada de madera con un café carísimo. Cuando te colocan el reloj en la muñeca, pesa más de lo que esperabas.",
      },
      {
        id: "b",
        label: "Negociar sin exclusividad",
        subtitle: "Menos dinero, más libertad",
        consequences: { patrimonio: 9000, rel_representante: 5 },
        outcomeText: "Tras una negociación tensa, consigues cláusulas más libres. El director de la marca se levanta, te estrecha la mano y reconoce: 'Eres duro'.",
      },
      {
        id: "c",
        label: "Rechazar, no te representa",
        subtitle: "Fiel a tu estilo",
        consequences: { moral: 2 },
        outcomeText: "Dices que esa imagen no va contigo. La marca lo acepta con elegancia suiza: no hay ni un reproche, solo un 'pues otra vez será'.",
      },
    ],
    minWeek: 60,
  },
  {
    id: "fama-reportaje-hogar",
    category: "prensa",
    title: "Una revista quiere fotografiar tu casa",
    description:
      'Una revista de estilo de vida te propone un reportaje a página completa mostrando tu casa por dentro: "así vive la nueva promesa del fútbol".',
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al periodista sobre enseñar tu vida privada?",
    options: [
      {
        id: "a",
        label: "Aceptar, con algunas zonas fuera de cámara",
        subtitle: "+Fama, algo de exposición",
        consequences: { fama: 6, moral: -1 },
        outcomeText: "El reportaje sale precioso, aunque te incomoda un poco ver tu salón en manos de miles de desconocidos.",
      },
      {
        id: "b",
        label: "Rechazar, la casa es sagrada",
        subtitle: "Privacidad ante todo",
        consequences: { moral: 3 },
        outcomeText: "La revista se lo toma bien y te propone, en su lugar, una entrevista en un estudio. Tu casa se queda como siempre, solo tuya.",
      },
    ],
    minWeek: 50,
  },
  {
    id: "fama-rumor-falso",
    category: "prensa",
    title: "Un rumor falso se hace viral",
    description:
      'Un perfil anónimo asegura tener "pruebas" de que estás saliendo con una persona famosa a la que ni conoces. El rumor se hace tendencia en un par de horas.',
    options: [
      {
        id: "a",
        label: "Desmentirlo con humor en redes",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "fama",
          success: {
            text: "Tu respuesta se hace viral por lo ingeniosa que es. Sales ganando fama.",
            consequences: { fama: 8, moral: 4 },
          },
          fail: {
            text: "Nadie te cree del todo y el rumor sigue circulando semanas.",
            consequences: { fama: 1, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "No decir nada, que se apague solo",
        subtitle: "Perfil bajo",
        consequences: { moral: -1 },
        outcomeText: "Sin ninguna reacción tuya, el rumor pierde fuelle en un par de días como todos los anteriores.",
      },
    ],
    minWeek: 40,
  },
  {
    id: "fama-fan-club",
    category: "vida",
    title: "Un fan club se organiza sin tu permiso",
    description:
      'Un grupo de aficionados crea una cuenta "oficial" en tu nombre con miles de seguidores, sin haberte preguntado nunca. Empiezan a vender merchandising con tu cara.',
    options: [
      {
        id: "a",
        label: "Contactarles y darles tu bendición",
        subtitle: "+Afición, gesto generoso",
        consequences: { rel_aficion: 8, moral: 3 , flags: { fan_club_oficial: true } },
        outcomeText: "Los fans se quedan sin palabras cuando les escribes en persona. Te mandan una caja con pancartas y una carta de agradecimiento escrita a mano.",
      },
      {
        id: "b",
        label: "Pedir que lo cierren por temas legales",
        subtitle: "Jugada fría",
        consequences: { rel_aficion: -6, patrimonio: 1000 },
        outcomeText: "La cuenta desaparece en 48 horas. En redes, algunos aficionados lo comentan con rabia: 'Qué poco corazón'.",
      },
      {
        id: "c",
        label: "Ignorarlo, no le das importancia",
        subtitle: "",
        consequences: {},
        outcomeText: "Lo ignoras. El fan club sigue creciendo y empiezan a vender camisetas con tu cara que ni siquiera se parecen a ti.",
      },
    ],
    minWeek: 22,
  },
  {
    id: "fama-videojuego",
    category: "representante",
    title: "Un videojuego de fútbol quiere tu cara",
    description:
      "Los desarrolladores de un popular videojuego de fútbol te piden licencia para incluir tu imagen y tus estadísticas reales en la próxima edición.",
    minMedia: 55,
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic dynamic photo of the photographed man in his club kit posing in an explosive action stance against a dramatic studio backdrop with light streaks and particle effects, video game cover shoot style, intense confident expression",
    options: [
      {
        id: "a",
        label: "Firmar la licencia",
        subtitle: "+Patrimonio, +Fama entre gamers",
        consequences: { patrimonio: 7000, fama: 7 },
        outcomeText: "Firmas la licencia y semanas después te escanean la cara en una sala llena de cámaras. Millones de chavales jugarán contigo sin enterarse de lo que costó.",
      },
      {
        id: "b",
        label: "Pedir condiciones mejores antes de firmar",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: {
            text: "Consigues mejores condiciones de las esperadas.",
            consequences: { patrimonio: 15000, fama: 6 },
          },
          fail: {
            text: "Pierdes margen de negociación y el trato queda peor de lo que esperabas.",
            consequences: { patrimonio: 4000 },
          },
        },
      },
    ],
    minWeek: 55,
  },
  {
    id: "fama-coleccion-ropa",
    category: "representante",
    title: "Una marca urbana te propone una colección cápsula",
    description:
      "Una marca de ropa urbana en auge te ofrece diseñar junto a ellos una pequeña colección con tu nombre.",
    minMedia: 50,
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic editorial photo of the photographed man wearing urban streetwear from his own capsule clothing collection, standing against a graffiti-covered wall, confident relaxed pose, natural street-style lighting, fashion campaign photography",
    options: [
      {
        id: "a",
        label: "Involucrarte de verdad en el diseño",
        subtitle: "+Fama, +Patrimonio, tiempo invertido",
        consequences: { fama: 6, patrimonio: 6000, forma: -2 },
        outcomeText: "Pasas tardes enteras escogiendo colores y tejidos con los diseñadores. Cuando ves la primera prenda terminada, sientes algo parecido al orgullo.",
      },
      {
        id: "b",
        label: "Dejar que usen solo tu nombre e imagen",
        subtitle: "Menos esfuerzo, menos autenticidad",
        consequences: { patrimonio: 4000 },
        outcomeText: "Dejas que usen tu nombre y poco más. La colección sale bien, pero en una entrevista alguien te pregunta qué diseñaste tú. Te quedas callado.",
      },
    ],
    minWeek: 48,
  },
  {
    id: "fama-desfile-moda",
    category: "especial",
    title: "Primera fila en la semana de la moda",
    description:
      "Una firma de moda te invita a sentarte en primera fila de su desfile durante la semana de la moda. Cámaras por todas partes, un mundo que no es el tuyo.",
    imageScene:
      "Photorealistic photo of the photographed man seated front row at a fashion week runway show, camera flashes, elegant outfit, runway blurred in background",
    options: [
      {
        id: "a",
        label: "Ir y disfrutarlo a fondo",
        subtitle: "+Fama, mundo nuevo",
        consequences: { fama: 7, moral: 4 },
        outcomeText: "Te sientas en primera fila entre actores y modelos. Un fotógrafo te grita '¡Por aquí!' y, por primera vez, no te sientes un intruso.",
      },
      {
        id: "b",
        label: "Ir por compromiso, sin más",
        subtitle: "Neutral",
        consequences: { fama: 3 },
        outcomeText: "Cumples en primera fila con cara de póquer. Un modelo, al pasar, te susurra: 'Relájate, que no muerde nadie'.",
      },
      {
        id: "c",
        label: "Rechazar la invitación",
        subtitle: "No es tu ambiente",
        consequences: { moral: 1 },
        outcomeText: "Declinas la invitación y pasas la tarde en casa. Mientras tanto, tu representante te manda fotos del desfile con un 'te lo perdiste'.",
      },
    ],
    minWeek: 65,
  },
  {
    id: "fama-tiktok-trend",
    category: "prensa",
    title: "Un trend viral usa tu nombre",
    description:
      "De la noche a la mañana, miles de vídeos usan un sonido que imita tu forma de celebrar los goles. El trend se vuelve masivo y ni tú entiendes bien por qué.",
    imageScene:
      "Photorealistic candid photo of the photographed man laughing while looking at his phone, casual setting, warm natural lighting",
    options: [
      {
        id: "a",
        label: "Subir tu propio vídeo sumándote al trend",
        subtitle: "+Fama, te ríes de ti mismo",
        consequences: { fama: 10, moral: 5 },
        outcomeText: "Tu versión del trend se convierte en la definitiva de la noche a la mañana — hasta otros futbolistas empiezan a imitar la tuya.",
      },
      {
        id: "b",
        label: "No participar, dejar que siga solo",
        subtitle: "Perfil bajo",
        consequences: { fama: 3 },
        outcomeText: "El trend sigue circulando sin ti, con decenas de imitaciones de tu celebración que ni tú reconoces del todo.",
      },
    ],
    minWeek: 18,
  },
  {
    id: "fama-periodista-finanzas",
    category: "prensa",
    title: "Un periodista pregunta por tus finanzas",
    description:
      "Un periodista de investigación te aborda con preguntas incómodas sobre en qué inviertes tu dinero y si es verdad lo que se rumorea sobre tus gastos.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes?",
    options: [
      {
        id: "a",
        label: "Responder con transparencia total",
        subtitle: "Arriesgado pero honesto",
        consequences: { fama: 4, patrimonio: -1 },
        outcomeText: "El periodista se queda algo descolocado por tanta sinceridad — no es lo que suele conseguir en este tipo de preguntas.",
      },
      {
        id: "b",
        label: "Remitirle a tu representante",
        subtitle: "Evitas el tema",
        consequences: { rel_representante: 3 },
        outcomeText: "Tu representante se pone al teléfono encantado de encargarse: \"Para eso me pagas\", bromea después.",
      },
      {
        id: "c",
        label: "Negarte a responder ahí mismo",
        subtitle: "Tensión inmediata",
        consequences: { fama: -3, moral: -2 },
        outcomeText: "El periodista anota tu silencio como respuesta en sí misma. El titular del día siguiente no te deja muy bien parado.",
      },
    ],
    minWeek: 58,
  },
  {
    id: "fama-cancelacion-injusta",
    category: "representante",
    title: "Una marca cancela tu contrato por una polémica ajena",
    description:
      'Una marca con la que trabajas rescinde tu contrato de imagen tras la polémica de otro deportista al que también patrocinan, "por precaución", aunque tú no tengas nada que ver.',
    options: [
      {
        id: "a",
        label: "Denunciarlo públicamente como injusto",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "fama",
          success: {
            text: "Tu queja pública gana apoyo y la marca acaba pidiendo disculpas.",
            consequences: { fama: 8, patrimonio: 3000 },
          },
          fail: {
            text: "Tu queja no cala y quedas como alguien conflictivo.",
            consequences: { fama: -5, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "Aceptarlo con elegancia y seguir adelante",
        subtitle: "Profesional",
        consequences: { moral: 2, rel_representante: 2 },
        outcomeText: "Aceptas la decisión con elegancia y sin pronunciar una queja pública. Tu representante lo valora más de lo que dice, y un par de marcas toman nota de tu madurez.",
      },
    ],
    minWeek: 52,
  },
  {
    id: "fama-documental",
    category: "especial",
    title: "Una plataforma quiere hacer un documental sobre ti",
    description:
      "Una plataforma de streaming te propone un documental de varios capítulos contando tu historia, desde la cantera hasta ahora. Acceso total a tu vida durante meses.",
    minMedia: 65,
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic photo of the photographed man being filmed by a documentary crew, cameras and boom microphone visible, candid behind-the-scenes atmosphere",
    options: [
      {
        id: "a",
        label: "Aceptar y abrir las puertas de verdad",
        subtitle: "+Fama enorme, cero privacidad",
        consequences: { fama: 15, patrimonio: 10000, moral: -3 },
        outcomeText: "Las cámaras te siguen hasta la cocina de casa. Una noche, un productor te dice: 'Ya no recuerdo qué cosa no hemos grabado'. Tú tampoco.",
      },
      {
        id: "b",
        label: "Aceptar con condiciones muy limitadas",
        subtitle: "Control sobre tu imagen",
        consequences: { fama: 8, patrimonio: 5000 },
        outcomeText: "Pones límites claros y los productores los respetan. El documental sale menos íntimo, pero te deja más tranquilo.",
      },
      {
        id: "c",
        label: "Rechazar la propuesta",
        subtitle: "Tu vida es tuya",
        consequences: { moral: 3 },
        outcomeText: "Rechazas la propuesta. Tu madre, que ya había soñado con aparecer en pantalla, suspira con una sonrisa triste.",
      },
    ],
    minWeek: 75,
  },
  {
    id: "fama-indirectas-rival",
    category: "prensa",
    title: "Un rival te tira indirectas en redes",
    description:
      "Un jugador de otro equipo, conocido por su lengua afilada en redes, publica una indirecta que todo el mundo interpreta como dirigida a ti.",
    options: [
      {
        id: "a",
        label: "Responder con otra indirecta ingeniosa",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: {
            text: "Tu respuesta gana la batalla de las redes por goleada. Los memes son todos a tu favor.",
            consequences: { fama: 9, rel_aficion: 5 },
          },
          fail: {
            text: "Tu respuesta no termina de aterrizar y la cosa se vuelve incómoda.",
            consequences: { fama: -2, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "No entrar al trapo",
        subtitle: "Perfil maduro",
        consequences: { moral: 2 },
        outcomeText: "No respondes nada y, sin leña nueva, la polémica se apaga sola en un par de días.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "Si respondes con una indirecta, ¿cuál exactamente?",
    minWeek: 33,
  },
  {
    id: "fama-cantar-himno",
    category: "vida",
    title: "Te piden cantar el himno antes de un partido especial",
    description:
      "Antes de un partido conmemorativo, el club te pide que seas tú quien entone el himno del equipo frente a todo el estadio, micrófono en mano.",
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic photo of the photographed man standing at the center circle holding a microphone, singing with eyes closed and one hand on his chest, the packed stadium and crowd blurred behind him, dramatic stadium lighting, emotional pre-match ceremony atmosphere",
    options: [
      {
        id: "a",
        label: "Aceptar y lanzarte, cantes bien o mal",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "moral",
          success: {
            text: "Te sale mejor de lo que esperabas y el estadio entero canta contigo.",
            consequences: { fama: 8, rel_aficion: 10, moral: 6 },
          },
          fail: {
            text: "Desafinas bastante, pero la grada lo celebra con cariño y risas.",
            consequences: { fama: 3, rel_aficion: 4, moral: -1 },
          },
        },
      },
      {
        id: "b",
        label: "Rechazar educadamente, no es lo tuyo",
        subtitle: "Evitas el ridículo",
        consequences: { moral: 1 },
        outcomeText: "Declinas con educación. El presidente asiente comprensivo y la megafonía pone el himno grabado, que, eso sí, suena mucho mejor de lo que hubieras cantado tú.",
      },
    ],
    minWeek: 15,
  },
  {
    id: "fama-fiesta-exclusiva",
    category: "vida",
    title: "Fiesta exclusiva de fin de temporada",
    description:
      "Te invitan a una fiesta muy exclusiva tras el último partido de la temporada, de esas donde se junta gente del deporte, la música y el cine. Ambiente de tentación total.",
    options: [
      {
        id: "a",
        label: "Ir con cabeza, disfrutar con medida",
        subtitle: "+Fama, +Ánimo",
        consequences: { fama: 5, moral: 6 },
        outcomeText: "Te quedas un par de horas, hablas con quien toca y te marchas antes de que la noche se tuerza. Al día siguiente, amanecer fresco y un par de contactos nuevos en la agenda.",
      },
      {
        id: "b",
        label: "Ir a saco, vivirlo sin frenos",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "moral",
          success: {
            text: "Vives una noche legendaria sin que pase factura al día siguiente.",
            consequences: { fama: 8, moral: 10 },
          },
          fail: {
            text: "Al día siguiente pagas caro los excesos de la noche anterior.",
            consequences: { forma: -8, moral: -5 },
          },
        },
      },
      {
        id: "c",
        label: "No ir, prioriza el descanso",
        subtitle: "Responsable",
        consequences: { forma: 3 },
        outcomeText: "Te quedas en casa con una película y una pizza. Al día siguiente, tu representante te cuenta las anécdotas de la fiesta y piensas: 'No me he perdido nada'.",
      },
    ],
    minWeek: 42,
  },
  {
    id: "fama-camiseta-nino",
    category: "vida",
    title: "Le regalas tu camiseta a un niño",
    description:
      "A la salida del estadio, un niño con un hospital bordado en la manga de la sudadera te espera junto a su padre. No pide autógrafo, solo verte de cerca un segundo.",
    imageScene:
      "Photorealistic photo of the photographed man kneeling down to hand his match jersey to a child outside a stadium, warm emotional moment, soft evening light",
    options: [
      {
        id: "a",
        label: "Quitarte la camiseta y dársela ahí mismo",
        subtitle: "+Fama, +Afición, momento viral",
        consequences: { fama: 12, rel_aficion: 10, moral: 8 },
        outcomeText: "Te quitas la camiseta ahí mismo y se la pones al niño por encima de la sudadera. Su padre se tapa la cara con las manos y alguien lo graba todo.",
      },
      {
        id: "b",
        label: "Prometerle una camiseta firmada para más adelante",
        subtitle: "Más discreto, igual de sincero",
        consequences: { rel_aficion: 5, moral: 4 },
        outcomeText: "Se lo prometes mirándole a los ojos. Una semana después, le mandas la camiseta firmada con una nota. Su padre te escribe: 'No sabes lo que has hecho'.",
      },
    ],
    minWeek: 28,
  },
  {
    id: "fama-perfil-falso",
    category: "prensa",
    title: "Un perfil falso se hace pasar por ti",
    description:
      'Una cuenta con tu nombre y tus fotos empieza a pedir dinero a fans a cambio de "videollamadas exclusivas". Varios caen en la estafa antes de que nadie se dé cuenta.',
    options: [
      {
        id: "a",
        label: "Denunciarlo públicamente cuanto antes",
        subtitle: "+Fama, proteges a tus fans",
        consequences: { fama: 5, rel_aficion: 6, patrimonio: -500 },
        outcomeText: "Tu aviso llega a tiempo de salvar a varios fans más de caer en la estafa. La afición lo agradece de corazón.",
      },
      {
        id: "b",
        label: "Dejar que el club se encargue en privado",
        subtitle: "Más lento, menos ruido",
        consequences: { rel_representante: 3 },
        outcomeText: "El club tarda unos días en tumbar la cuenta falsa, pero al final lo consigue sin que salte a ningún titular.",
      },
    ],
    minWeek: 26,
  },
  {
    id: "fama-fragancia-propia",
    category: "representante",
    title: "Una marca de perfumes te ofrece tu propia fragancia",
    description:
      "Una casa de perfumes reconocida propone lanzar un perfume con tu nombre y tu cara en el frasco.",
    minMedia: 62,
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic close-up campaign photo of the photographed man holding an elegant perfume bottle with his own name on the label up towards the camera, dramatic black studio backdrop, moody cinematic lighting, luxury fragrance advertisement style",
    options: [
      {
        id: "a",
        label: "Aceptar e implicarte en el proceso creativo",
        subtitle: "+Fama, +Patrimonio, tiempo invertido",
        consequences: { fama: 6, patrimonio: 9000, forma: -1 },
        outcomeText: "Pasas tardes olfateando frascos con un perfumista que te mira con paciencia infinita. Cuando eliges por fin la nota final, sientes que el perfume ya es tuyo.",
      },
      {
        id: "b",
        label: "Aceptar solo cediendo la imagen",
        subtitle: "Más rápido, menos personal",
        consequences: { patrimonio: 6000 },
        outcomeText: "Cedes tu imagen y te olvidas. Cuando sale a la venta, el frasco tiene tu cara y un nombre que ni elegiste. Te hace gracia... y algo de vergüenza.",
      },
      {
        id: "c",
        label: "Rechazar, no encaja contigo",
        subtitle: "",
        consequences: { moral: 1 },
        outcomeText: "Declinas la propuesta. La casa de perfumes lo entiende con elegancia y te manda un frasco de cortesía que acaba en la estantería del baño.",
      },
    ],
    minWeek: 62,
  },
];
