/** Escenas fijas del juego, parte 3 de 6 (antes vivían en events.ts; el orden del conjunto no ha cambiado). */
import type { GameEvent } from "@/types/career";

export const EVENTS_3: GameEvent[] = [
  {
    id: "fama-podcast-estrella",
    category: "prensa",
    title: "Un podcast deportivo te quiere como entrevistado estrella",
    description:
      "Uno de los podcasts de deporte más escuchados del país te pide una entrevista de más de una hora, sin límite de temas.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué tema quieres tocar tú mismo en la entrevista?",
    options: [
      {
        id: "a",
        label: "Ir y hablar con total sinceridad",
        subtitle: "+Fama, te expones de verdad",
        consequences: { fama: 9, moral: 3 },
        outcomeText: "Los presentadores se quedan sorprendidos de lo sincero que eres — el episodio se convierte en uno de los más comentados del podcast en meses.",
      },
      {
        id: "b",
        label: "Ir con respuestas medidas y prudentes",
        subtitle: "Seguro pero menos memorable",
        consequences: { fama: 4 },
        outcomeText: "El episodio sale correcto, educado, y se olvida casi tan rápido como se publicó.",
      },
    ],
    minWeek: 38,
  },
  {
    id: "fama-actor-foto",
    category: "especial",
    title: "Un actor de cine te pide una foto",
    description:
      "En un evento, un actor conocido —de esos que salen en las carteleras de todo el mundo— se acerca él primero a pedirte una foto contigo. El mundo al revés.",
    imageScene:
      "Photorealistic candid photo of the photographed man posing for a photo with a generic well-dressed celebrity figure at an elegant event, camera flashes, warm ambient lighting",
    options: [
      {
        id: "a",
        label: "Aceptar encantado, es surrealista",
        subtitle: "+Fama, momento para enmarcar",
        consequences: { fama: 7, moral: 5 },
        outcomeText: "Te haces la foto con una sonrisa de oreja a oreja. Cuando se la enseñas a tu familia, tu hermano pequeño no te cree hasta que ve la firma.",
      },
      {
        id: "b",
        label: "Aceptarlo con timidez, sin darle más vueltas",
        subtitle: "",
        consequences: { fama: 3, moral: 2 },
        outcomeText: "Posas con cara de susto. En la foto sales rígido como un maniquí, pero el actor te da una palmada: 'No pasa nada, yo también me pongo nervioso con vosotros'.",
      },
    ],
    minWeek: 47,
  },
  {
    id: "fama-coche-lujo",
    category: "representante",
    title: "Una marca de coches te regala un modelo de lujo",
    description:
      "A cambio de que lo enseñes de vez en cuando en tus redes, una marca de coches de alta gama te cede un modelo exclusivo durante toda la temporada.",
    minMedia: 55,
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic photo of the photographed man leaning against a gleaming luxury sports car parked in front of a modern building, one hand on the open car door, confident smile, golden hour lighting, automotive campaign photography style",
    options: [
      {
        id: "a",
        label: "Aceptar el coche",
        subtitle: "+Patrimonio simbólico, +Fama",
        consequences: { patrimonio: 5000, fama: 4 },
        outcomeText: "Te entregan las llaves en una ceremonia con cámaras. La primera vez que arrancas, el motor ronronea de una forma que no habías oído nunca.",
      },
      {
        id: "b",
        label: "Rechazarlo, prefieres pasar desapercibido",
        subtitle: "",
        consequences: { moral: 1 },
        outcomeText: "Rechazas con educación y sigues con tu coche de siempre. En el vestuario, alguien te mira alucinado: '¿En serio?'.",
      },
    ],
    minWeek: 24,
  },
  {
    id: "fama-portada-revista",
    category: "prensa",
    title: "Portada de una revista deportiva importante",
    description:
      "Te llaman para protagonizar la portada de una de las revistas deportivas más leídas del país, con un reportaje a fondo sobre tu progresión.",
    imageScene:
      "Photorealistic magazine cover style photo of the photographed man in his club kit, dramatic studio lighting, confident pose, professional sports magazine aesthetic",
    options: [
      {
        id: "a",
        label: "Aprovechar para hablar de tus objetivos a largo plazo",
        subtitle: "+Fama, ambicioso",
        consequences: { fama: 10, rel_representante: 4 },
        outcomeText: "Tu representante enmarca la portada literalmente — la ambición que muestras en el reportaje da pie a un par de llamadas interesadas esa misma semana.",
      },
      {
        id: "b",
        label: "Mantener un tono humilde en toda la entrevista",
        subtitle: "+Afición, +Vestuario",
        consequences: { fama: 6, rel_aficion: 6, rel_vestuario: 4 },
        outcomeText: "La afición y el vestuario lo valoran: una portada así y sigues hablando como uno más. Un compañero te lo dice directamente al día siguiente.",
      },
    ],
    minWeek: 44,
  },
  {
    id: "fama-parodia-humor",
    category: "especial",
    title: "Un programa de humor quiere parodiarte",
    description:
      "Un programa de humor muy popular te invita a participar en una parodia sobre ti mismo, riéndose con cariño de tus manías más conocidas.",
    options: [
      {
        id: "a",
        label: "Participar y reírte de ti mismo",
        subtitle: "+Fama, +Afición, te ganas al público",
        consequences: { fama: 8, rel_aficion: 7, moral: 4 },
        outcomeText: "Te maquillan, te dan un guion absurdo y te ríes como nunca. Cuando se emite, tu madre te llama: 'Has estado graciosísimo'.",
      },
      {
        id: "b",
        label: "Declinar la invitación",
        subtitle: "Prefieres no exponerte así",
        consequences: { moral: 1 },
        outcomeText: "Declinas la invitación. El programa hace igualmente la parodia, con un actor que te imita sin parecerse en nada. Aun así, la gente la comparte.",
      },
    ],
    minWeek: 53,
  },
  {
    id: "fama-borrar-publicacion",
    category: "representante",
    title: "Un patrocinador te pide borrar una publicación",
    description:
      'Subes algo espontáneo a tus redes y, a los pocos minutos, uno de tus patrocinadores te llama pidiendo que lo borres porque "no encaja con la marca".',
    options: [
      {
        id: "a",
        label: "Borrarlo, prioriza el contrato",
        subtitle: "+Relación con el patrocinador, -Autenticidad",
        consequences: { rel_representante: 4, moral: -3 },
        outcomeText: "Lo borras en cinco minutos. El patrocinador te lo agradece con un mensaje seco, aunque tú te quedas con la sensación de haber callado algo que sentías.",
      },
      {
        id: "b",
        label: "Dejarlo publicado, es tu vida",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "fama",
          success: {
            text: "El patrocinador acaba entendiéndolo y no pasa nada.",
            consequences: { moral: 5, fama: 2 },
          },
          fail: {
            text: "El patrocinador se lo toma mal y la relación se enfría notablemente.",
            consequences: { rel_representante: -8, patrimonio: -2000 },
          },
        },
      },
    ],
    minWeek: 36,
  },
  {
    id: "fama-merchandising-falso",
    category: "prensa",
    title: "Aparece merchandising falsificado con tu nombre",
    description:
      "En los alrededores del estadio, unos vendedores ambulantes ofrecen camisetas y bufandas falsificadas con tu nombre y dorsal, sin ningún permiso.",
    options: [
      {
        id: "a",
        label: "Denunciarlo ante el club",
        subtitle: "Protege tu marca",
        consequences: { patrimonio: 1000, rel_representante: 2 },
        outcomeText: "El club retira los puestos ambulantes esa misma semana. Tu representante lo celebra: \"Así se protege la marca.\"",
      },
      {
        id: "b",
        label: "Dejarlo pasar, son aficionados humildes",
        subtitle: "+Afición",
        consequences: { rel_aficion: 6 },
        outcomeText: "Los vendedores siguen ahí los días de partido. Varios aficionados lo comentan como un gesto que no olvidan.",
      },
    ],
    minWeek: 20,
  },
  {
    id: "fama-cena-empresarios",
    category: "vida",
    title: "Te invitan a cenar con grandes empresarios",
    description:
      "Un grupo de empresarios influyentes de la ciudad te invita a una cena privada, buscando más una conexión de imagen que una conversación real.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices cuando te preguntan por tus planes de futuro?",
    options: [
      {
        id: "a",
        label: "Ir y hacer contactos con cabeza",
        subtitle: "+Patrimonio a futuro, +Fama",
        consequences: { fama: 4, patrimonio: 2000 },
        outcomeText: "Escuchas más de lo que hablas y tomas nota de todo. Al final de la cena, un empresario te da su tarjeta: 'Cuando dejes el fútbol, llámame'.",
      },
      {
        id: "b",
        label: "Rechazar la invitación",
        subtitle: "Prefieres mantenerte al margen",
        consequences: { moral: 1 },
        outcomeText: "Rechazas con una excusa elegante. Tu representante te mira con algo parecido a la decepción: 'Una conexión así no se improvisa luego'.",
      },
    ],
    minWeek: 57,
  },
  {
    id: "fama-streamer-directo",
    category: "vida",
    title: "El streamer más visto del país te invita a un directo",
    description:
      'Ibán Gómez, el streamer con más audiencia del país, te invita a su plató para un directo con casi un millón de personas conectadas a la vez. Antes de empezar te avisa: "Aquí hacemos retos, ¿eh? Nada de venir solo a hablar bien de ti mismo."',
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic photo of the photographed man sitting at a colorful gaming streaming desk full of monitors and RGB lighting, headset around his neck, laughing mid-conversation, a young streamer visible beside him, energetic studio lighting",
    options: [
      {
        id: "a",
        label: "Aceptar cualquier reto que proponga",
        subtitle: "Jugada arriesgada, pero el público lo adora",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "fama",
          success: {
            text: 'Encajas el reto (comer algo carísimo y carísimamente picante frente a cámara) sin pestañear. El clip se hace viral en horas: "El futbolista que no tiene miedo a nada".',
            consequences: { fama: 9, media: 2, moral: 4 },
          },
          fail: {
            text: "Terminas escupiendo agua por la nariz en directo. Es humillante, pero también el meme de la semana.",
            consequences: { fama: 5, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Ir a lo seguro, hablar del equipo y nada más",
        subtitle: "Perfil profesional",
        consequences: { fama: 2, rel_representante: 2 },
        outcomeText: "Hablas del equipo y poco más. El streamer intenta sacarte de tu zona de confort, pero tú te mantienes firme y el chat acaba aplaudiendo tu seriedad.",
      },
    ],
    minWeek: 25,
  },
  {
    id: "fama-streamer-fichaje-broma",
    category: "prensa",
    title: '"Te ficho para mi equipo", dice el streamer en directo',
    description:
      'En pleno directo, Ibán suelta de broma: "Este fichaje lo hago yo, te quiero en mi equipo amateur el finde que viene." Lo dice de coña, pero los clips ya están circulando como si fuera un fichaje real. Tu móvil empieza a arder.',
    options: [
      {
        id: "a",
        label: "Seguirle la broma y apuntarte al partido amateur",
        subtitle: "Contenido puro, la afición lo va a flipar",
        consequences: { fama: 7, media: 1, rel_aficion: 5, moral: 3 },
        outcomeText: "Te presentas de verdad al partido amateur y el vídeo del \"fichaje\" se hace viral — Ibán no se lo cree ni cuando te ve aparecer.",
      },
      {
        id: "b",
        label: "Aclarar rápido que es broma antes de que se líe más",
        subtitle: "Evitar el malentendido con tu club",
        consequences: { fama: 2, rel_entrenador: 2 },
        outcomeText: "Tu aclaración corta el rumor de raíz. El entrenador agradece que no le llegue ninguna llamada rara preguntando por una cesión.",
      },
    ],
    minWeek: 28,
  },
  {
    id: "fama-leyenda-vestuario",
    category: "vestuario",
    title: "Una leyenda visita el vestuario antes del partido",
    description:
      "Emiliano Rosso, el mejor futbolista de su generación ya retirado, aparece de improviso en el túnel de vestuarios antes del calentamiento. Se para justo delante de ti y te mira de arriba abajo un segundo eterno.",
    imageScene:
      "Photorealistic photo of the photographed man in a stadium tunnel shaking hands with an older distinguished football legend figure, respectful atmosphere, warm stadium lighting",
    options: [
      {
        id: "a",
        label: 'Pedirle un consejo sin rodeos',
        subtitle: "Aprovechar el momento",
        consequences: {},
        resolve: {
          baseChance: 0.7,
          statModifier: "moral",
          success: {
            text: 'Te pone la mano en el hombro: "Disfrútalo, chaval, esto dura menos de lo que crees." Sales al campo con otra cabeza.',
            consequences: { moral: 8, media: 2, fama: 3 },
          },
          fail: {
            text: 'Te suelta un "ya veremos" seco y se va a saludar a otro. Te quedas con las ganas.',
            consequences: { moral: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Quedarte callado, demasiado impresionado para hablar",
        subtitle: "El momento te supera",
        consequences: { moral: 2 },
        outcomeText: "Te quedas mudo mientras la leyenda saluda a tus compañeros. Cuando se va, un veterano te susurra: 'Te lo juro, a todos nos pasó'.",
      },
    ],
    minWeek: 40,
  },
  {
    id: "fama-leyenda-confusion",
    category: "prensa",
    title: "La leyenda te confunde con otro jugador",
    description:
      'En un evento benéfico, Emiliano Rosso se acerca sonriente, te da un abrazo y te dice: "Qué golazo el del otro día contra el Espanyol." El problema: tú no jugaste ese partido, ni siquiera estabas convocado. Hay veinte cámaras apuntando.',
    options: [
      {
        id: "a",
        label: "Seguirle la corriente para no dejarle mal delante de todos",
        subtitle: "Gesto noble, pero raro si alguien se entera",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: {
            text: "Nadie se entera del lío y las fotos con él inundan tus redes igualmente. Un golpe de fama fácil.",
            consequences: { fama: 6, media: 1, moral: 2 },
          },
          fail: {
            text: 'Un periodista graba el intercambio y sale el titular: "Momento incómodo: la leyenda confunde al canterano." Te ríes, pero escuece.',
            consequences: { fama: 3, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Corregirle con humor, sin darle importancia",
        subtitle: "Más honesto, menos arriesgado",
        consequences: { moral: 2, fama: 2 },
        outcomeText: "Emiliano Rosso suelta una carcajada al darse cuenta: \"Mi memoria ya no es lo que era, perdona.\" Las cámaras capturan igual la escena, con buen rollo de por medio.",
      },
    ],
    minWeek: 40,
  },
  {
    id: "fama-reto-viral-vendado",
    category: "especial",
    title: "El reto viral: marcar a portería vacía con los ojos vendados",
    description:
      'Una cuenta con millones de seguidores te propone participar en su reto de moda: marcar tres veces con los ojos vendados y solo guiado por la voz de tus compañeros. Han montado cámaras por todo el campo de entrenamiento.',
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic photo of the photographed man on a training pitch wearing a blindfold, mid-shot in front of an empty goal, several cameras and tripods set up around the pitch filming, teammates visible shouting directions from the sideline, dramatic action lighting",
    options: [
      {
        id: "a",
        label: "Grabarlo y subirlo tal cual salga",
        subtitle: "Sin red, lo que pase se publica",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "fama",
          success: {
            text: "Encajas los tres disparos entre gritos de tus compañeros. El vídeo supera los diez millones de vistas en dos días.",
            consequences: { fama: 10, media: 2, moral: 5 },
          },
          fail: {
            text: "Te chocas con un poste que ni sabías que estaba ahí. También se hace viral, pero por otro motivo.",
            consequences: { fama: 6, moral: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Grabarlo pero pedir quedarte con el derecho de no publicarlo si sale mal",
        subtitle: "Cabeza fría",
        consequences: { fama: 2, moral: 1 },
        outcomeText: "Grabas el reto con una condición clara en el contrato. Cuando por fin lo intentas, fallas dos veces antes de acertar, y agradeces no haber prometido publicarlo.",
      },
    ],
    minWeek: 22,
  },
  {
    id: "fama-doble-viral",
    category: "prensa",
    title: "Aparece un doble tuyo haciendo el ridículo en un centro comercial",
    description:
      "Un vídeo se vuelve viral: un hombre que se parece muchísimo a ti monta un pollo en un centro comercial por no encontrar aparcamiento, gritando tu apellido a los de seguridad para colarse. Media ciudad cree que eres tú.",
    allowFreeText: true,
    freeTextPrompt: "¿Cómo lo desmientes en redes?",
    options: [
      {
        id: "a",
        label: "Responder con humor y compartir el vídeo tú mismo",
        subtitle: "Convertirlo en broma antes de que se te escape de las manos",
        consequences: { fama: 6, media: 1, moral: 3 },
        outcomeText: "Tu publicación bautizando al doble como \"mi hermano separado al nacer\" se hace más viral que el vídeo original.",
      },
      {
        id: "b",
        label: "Ignorarlo por completo y dejar que se aclare solo",
        subtitle: "Perfil bajo, riesgo de que quede la duda",
        consequences: { moral: -1 },
        outcomeText: "Pasan semanas y todavía hay gente que jura haberte visto montar aquel pollo en el centro comercial.",
      },
    ],
    minWeek: 33,
  },
  {
    id: "fama-anuncio-surreal",
    category: "vida",
    title: "Te ofrecen protagonizar el anuncio más absurdo del año",
    description:
      "Una marca de colonia te propone un anuncio a caballo entre lo épico y lo ridículo: apareces surgiendo de una piscina de pétalos vestido de gladiador mientras suena música orquestal. El guion es, literalmente, así.",
    imageScene:
      "Photorealistic photo of the photographed man dressed as a gladiator emerging dramatically from a pool of flower petals, cinematic lighting, over-the-top commercial photoshoot atmosphere",
    options: [
      {
        id: "a",
        label: "Grabarlo con toda la seriedad del mundo",
        subtitle: "+Patrimonio, se convierte en meme instantáneo",
        consequences: { fama: 8, media: 1, patrimonio: 4000, moral: 2 },
        outcomeText: "Surges de una piscina de colonia con cara de héroe griego. En cuanto se emite, el vídeo se convierte en meme y tu madre te pide que no lo vea tu abuela.",
      },
      {
        id: "b",
        label: "Rechazar el guion, es demasiado ridículo",
        subtitle: "Dignidad intacta, oportunidad perdida",
        consequences: { moral: 1 },
        outcomeText: "Rechazas el guion con un 'esto no, gracias'. La marca lo reescribe y contrata a otro. En redes, la gente bromea con lo que habría sido.",
      },
    ],
    minWeek: 35,
  },
  {
    id: "fama-mascota-viral",
    category: "vida",
    title: "Tu nueva mascota se hace más famosa que tú",
    description:
      'Adoptas una iguana como mascota más por capricho que por otra cosa, y a la semana tiene más seguidores en redes que tú. Tu representante te llama entre risas: "Nos están pidiendo colaboraciones... para ella."',
    options: [
      {
        id: "a",
        label: "Dejar que la iguana tenga su propia cuenta y sacarle partido",
        subtitle: "Contenido gracioso, +Fama compartida",
        consequences: { fama: 5, media: 1, patrimonio: 800, moral: 3 , flags: { iguana: true } },
        outcomeText: "La iguana tiene su cuenta, con gafas de sol y todo. En una semana, tus seguidores te piden más fotos de ella que de ti.",
      },
      {
        id: "b",
        label: "Mantenerla lejos de las cámaras, es solo tu mascota",
        subtitle: "Vida privada por delante",
        consequences: { moral: 2 , flags: { iguana: true } },
        outcomeText: "Mantienes a la iguana lejos de las cámaras. Los fans te piden fotos en comentarios y tú sonríes: 'Es mi vida privada'.",
      },
    ],
    minWeek: 30,
  },
  {
    id: "fama-cancion-dedicada",
    category: "prensa",
    title: "Un cantante de moda te dedica una canción sin avisar",
    description:
      'Yeimy Rosales, que arrasa en las listas, saca un tema nuevo con tu apellido metido en el estribillo. No te ha pedido permiso ni avisado. La canción ya suena en todas las radios y los aficionados la cantan en la grada.',
    options: [
      {
        id: "a",
        label: "Aprovechar el momento y aparecer en su videoclip",
        subtitle: "Sinergia total, aunque algo forzada",
        consequences: {},
        resolve: {
          baseChance: 0.6,
          statModifier: "fama",
          success: {
            text: "El videoclip es un éxito y la canción se convierte en el himno extraoficial de la afición.",
            consequences: { fama: 8, media: 2, rel_aficion: 6 },
          },
          fail: {
            text: "El resultado queda forzado y hasta un poco vergonzoso. Los memes tardan poco en llegar.",
            consequences: { fama: 3, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "No mezclarte con eso, que la canción vaya por su lado",
        subtitle: "Distancia prudente",
        consequences: { moral: 1 },
        outcomeText: "La canción sigue sonando igual en la grada sin que tú tengas nada que ver — y, de algún modo, eso también te hace gracia.",
      },
    ],
    minWeek: 38,
  },
  {
    id: "fama-hackeo-cuenta",
    category: "prensa",
    title: "Hackean tu cuenta y publican una locura",
    description:
      'Te despiertas con cien notificaciones: alguien ha entrado en tu cuenta esta noche y ha publicado que fichas por el eterno rival "por amor de verdad". La captura ya la tiene medio país. Tu representante no contesta al teléfono, está literalmente corriendo hacia tu casa.',
    options: [
      {
        id: "a",
        label: "Salir en directo de inmediato a aclararlo con humor",
        subtitle: "Rápido y transparente",
        consequences: { fama: 5, media: 1, moral: 2 },
        outcomeText: "Tu directo de madrugada, todavía en pijama, se hace tan viral como el hackeo mismo. Tu representante llega a casa y te encuentra ya riéndote del susto.",
      },
      {
        id: "b",
        label: "Publicar un comunicado formal y cambiar la contraseña sin más",
        subtitle: "Más serio, menos viral",
        consequences: { fama: 2, moral: -1 },
        outcomeText: "El comunicado cierra el tema oficialmente, aunque sin la gracia que habría tenido contarlo tú mismo en caliente.",
      },
    ],
    minWeek: 24,
  },
  {
    id: "fama-reality-cocina",
    category: "especial",
    title: "Te apuntas a un reality de cocina para famosos",
    description:
      "Entre risas aceptaste hace semanas participar en un programa de cocina para famosos, y hoy toca grabar en directo delante de un jurado exigente. Tu plato: una tortilla de patatas que tiene que decidir si eres de las que llevan cebolla.",
    imageScene:
      "Photorealistic photo of the photographed man wearing a chef apron in a TV cooking show set, cameras and studio lights around, playful competitive atmosphere",
    options: [
      {
        id: "a",
        label: "Arriesgarte con una receta ambiciosa",
        subtitle: "Todo o nada delante de las cámaras",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "fama",
          success: {
            text: 'El jurado se queda boquiabierto: "Nunca pensé que un futbolista me sorprendería así en una cocina." Titular asegurado.',
            consequences: { fama: 9, media: 2, moral: 6 },
          },
          fail: {
            text: "El plato termina literalmente quemado y el jurado no se corta al decírtelo en directo. Es incómodo, pero divertido para todos menos para ti.",
            consequences: { fama: 4, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "Ir a lo seguro con la tortilla de siempre",
        subtitle: "Sin sorpresas",
        consequences: { fama: 3, moral: 1 },
        outcomeText: "Haces tu tortilla de siempre, sin florituras. El jurado la prueba, asiente y suelta: 'Cumple, pero aquí venimos a arriesgar'.",
      },
    ],
    minWeek: 45,
  },
  {
    id: "fama-fiesta-piscina",
    category: "vida",
    title: "La fiesta en la piscina de un famoso se descontrola",
    description:
      "Te invitan a la fiesta de cumpleaños de Ibán Gómez, junto a una piscina rodeada de gente que no para de sacar el móvil. A medianoche, alguien decide que es buena idea tirar al agua a todo el que se acerque al borde, empezando por ti.",
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic candid nighttime photo of the photographed man caught mid-air being thrown into a lit swimming pool at a party, laughing, string lights and guests with phones out visible around the pool, festive nightlife atmosphere",
    options: [
      {
        id: "a",
        label: "Reírte y unirte al caos",
        subtitle: "Contenido para todos, riesgo de titular ridículo",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "moral",
          success: {
            text: "El vídeo de la fiesta se hace viral por lo divertido que sales en él. Ganas simpatía a raudales.",
            consequences: { fama: 6, media: 1, moral: 5 },
          },
          fail: {
            text: 'Sales empapado justo cuando un fotógrafo capta el peor ángulo posible. Al día siguiente eres el titular de cotilleos: "Noche loca."',
            consequences: { fama: 3, moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Salir discretamente antes de que la fiesta se te vaya de las manos",
        subtitle: "Prudencia ante todo",
        consequences: { moral: 1 },
        outcomeText: "Te escabulles por una puerta lateral justo cuando alguien se lanza a la piscina vestido. Al día siguiente, el vídeo es viral... y tú no sales.",
      },
    ],
    minWeek: 26,
  },
  {
    id: "fama-paparazzi-cena",
    category: "prensa",
    title: "Cazado por los paparazzi",
    description:
      "Cenas tranquilo con alguien especial en un restaurante discreto de la ciudad. Al día siguiente, una revista publica las fotos: os habían fotografiado desde la calle durante toda la cena sin que os dierais cuenta.",
    imageScene:
      "Photorealistic paparazzi-style photo taken through a restaurant window at night, the photographed man having a candlelit dinner with a blurred anonymous companion, grainy telephoto lens look, tabloid magazine aesthetic",
    options: [
      {
        id: "a",
        label: "No hacer ninguna declaración",
        subtitle: "Dejar que se apague solo",
        consequences: { fama: 5, moral: -2 },
        outcomeText: "Sin palabras tuyas de por medio, la revista sigue especulando unos días más de lo que te gustaría.",
      },
      {
        id: "b",
        label: "Confirmarlo con humor en redes",
        subtitle: "+Fama, quitarle hierro",
        consequences: { fama: 8, moral: 3 },
        outcomeText: "Tu respuesta le quita hierro al asunto al instante — hasta la revista acaba citando tu comentario con una sonrisa.",
      },
      {
        id: "c",
        label: "Quejarte públicamente de la falta de privacidad",
        subtitle: "Postura seria",
        consequences: { fama: 2, moral: 1 },
        outcomeText: "Tu queja genera debate sobre el acoso mediático a futbolistas, aunque de la cena original ya casi nadie se acuerda.",
      },
    ],
    minWeek: 22,
  },
  {
    id: "fama-post-viral-propio",
    category: "prensa",
    title: "Tu propia publicación se vuelve viral",
    description:
      "Subes una foto random a tus redes, sin pensarlo demasiado, y por algún motivo que no llegas a entender del todo se convierte en el contenido más comentado del día en todo el país.",
    imageScene:
      "Photorealistic photo styled as a phone screen showing a social media post going viral, the photographed man casually smiling in a selfie-style photo, likes and comments counters visible but blurred/illegible, warm natural lighting",
    options: [
      {
        id: "a",
        label: "Aprovechar el momento y publicar más",
        subtitle: "+Fama, arriesgas sobreexposición",
        consequences: { fama: 9, moral: 2 },
        outcomeText: "Encadenas publicaciones mientras el algoritmo te favorece — por un par de días, tu cuenta no para de crecer.",
      },
      {
        id: "b",
        label: "Dejar que hable por sí sola, sin insistir",
        subtitle: "Perfil más comedido",
        consequences: { fama: 5, moral: 3 },
        outcomeText: "No insistes en nada más, y la publicación se apaga sola con su propio encanto intacto.",
      },
    ],
    minWeek: 12,
  },
  {
    id: "fama-portada-warca",
    category: "prensa",
    title: "Portada de Warca",
    description:
      'El diario deportivo más leído del país te pone en portada bajo un titular enorme. Tu representante te manda la foto de la portada antes incluso de que salga a los quioscos: "Esto no tiene precio."',
    imageScene:
      "Photorealistic photo of a sports newspaper front cover on a newsstand, the photographed man featured in a dramatic action pose, bold generic headline text, tabloid sports press style, other blurred magazines around it",
    options: [
      {
        id: "a",
        label: "Enmarcar la portada para casa",
        subtitle: "Momento para guardar",
        consequences: { fama: 6, moral: 5 },
        outcomeText: "Cuelgas la portada en el pasillo de casa. Tu familia se para a mirarla cada vez que entra, aunque lleven semanas viéndola.",
      },
      {
        id: "b",
        label: "Restarle importancia ante la prensa",
        subtitle: "Perfil humilde",
        consequences: { fama: 4, rel_vestuario: 2 },
        outcomeText: "\"Es solo un periódico\", dices sin darle más vueltas. En el vestuario, varios compañeros lo valoran más de lo que esperabas.",
      },
    ],
    minWeek: 30,
  },
  {
    id: "fama-leyenda-dorsal",
    category: "vestuario",
    title: "La leyenda te pide que lleves su número",
    description:
      'Coincides de nuevo con Emiliano Rosso, esta vez en una cena de homenaje. Te suelta, medio en broma medio en serio: "Deberías llevar mi número algún día, a ver si le sacas más partido del que le saqué yo." La prensa que hay alrededor lo apunta todo.',
    isMilestone: true,
    milestoneType: "fama",
    imageScene:
      "Photorealistic photo of the photographed man in a suit at an elegant tribute dinner, standing face to face with a veteran footballer legend also in formal wear, both smiling warmly mid-conversation, press photographers with cameras visible nearby, warm banquet hall lighting",
    options: [
      {
        id: "a",
        label: 'Decir que sí, sin pensarlo, delante de todos',
        subtitle: "Promesa pública con mucho peso encima",
        consequences: { fama: 7, media: 1, rel_aficion: 4, moral: 3 },
        outcomeText: "Lo dices alto, delante de todos, y la sala rompe en aplausos. La leyenda te mira con una sonrisa seria: 'Ahora tienes que merecerlo'.",
      },
      {
        id: "b",
        label: "Reírte y quitarle hierro al comentario",
        subtitle: "No comprometerte a nada todavía",
        consequences: { moral: 2, fama: 2 },
        outcomeText: "Te ríes y le quitas hierro. La leyenda sonríe, pero en sus ojos queda algo que te hace pensar durante días.",
      },
    ],
    minWeek: 42,
  },

  // ── MOMENTOS DE TENSIÓN (resultado incierto) ──────────────────────
  {
    id: "ent-mister-pretemporada",
    category: "entrenamiento",
    title: "El entrenador recorre el campo",
    description:
      "En la pretemporada el míster se pasea entre los grupos de trabajo. No sabes si te vio o no.",
    options: [
      {
        id: "a",
        label: "Buscar que te vea, subir la intensidad",
        subtitle: "Puede notarlo o pasar de largo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: {
            text: "El míster se detiene, te mira jugar un par de minutos y asiente. \"Sigue así\", te dice antes de irse.",
            consequences: { rel_entrenador: 8, moral: 4 },
          },
          fail: {
            text: "El míster pasa de largo sin mirarte, con la cabeza en otra cosa.",
            consequences: { moral: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Seguir tu rutina sin forzar nada",
        subtitle: "Profesionalidad silenciosa",
        consequences: { forma: 2 },
        outcomeText: "Sigues tu rutina sin mirar al míster. Cuando el grupo se disuelve, él te lanza una mirada fugaz y asiente, apenas imperceptible.",
      },
    ],
  },
  {
    id: "par-mano-a-mano",
    category: "partido",
    priority: true,
    title: "Solo ante el portero",
    description: "Recibes el pase filtrado y quedas mano a mano con el portero. El estadio contiene la respiración.",
    options: [
      {
        id: "a",
        label: "Rematar fuerte al primer palo",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "forma",
          success: {
            text: "¡GOOOL! El balón entra pegado al palo. El estadio explota con tu nombre.",
            consequences: { fama: 8, rel_aficion: 10, moral: 6, media: 4 },
          },
          fail: {
            text: "El portero la ataja sin problemas. Te llevas las manos a la cabeza.",
            consequences: { moral: -4, rel_aficion: -2, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Amagar y definir cruzado",
        subtitle: "Más elegante, más riesgo de resbalar",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "forma",
          success: {
            text: "El amague deja al portero tirado. Definición cruzada, gol de categoría.",
            consequences: { fama: 10, rel_aficion: 8, moral: 7, media: 5 },
          },
          fail: {
            text: "Se te va largo el balón tras el amague. Ocasión perdida.",
            consequences: { moral: -5, media: -2 },
          },
        },
      },
      {
        id: "c",
        label: "Pasarla al compañero mejor posicionado",
        subtitle: "Menos gloria, más seguro",
        consequences: { rel_vestuario: 6, moral: 2 },
        outcomeText: "Tu compañero marca y viene corriendo a abrazarte antes de celebrarlo con nadie más: \"Ese gol es tan tuyo como mío.\"",
      },
    ],
    minWeek: 6,
  },
  {
    id: "par-penal",
    category: "partido",
    priority: true,
    title: "Penalti a favor en el último minuto",
    description: "El árbitro señala el punto de penalti. El resultado del partido depende de este balón. ¿Lo tiras tú?",
    options: [
      {
        id: "a",
        label: "Pedirlo y tirarlo",
        subtitle: "Te la juegas",
        consequences: {},
        resolve: {
          baseChance: 0.65,
          statModifier: "moral",
          success: {
            text: "¡GOL! Lo clavas en la escuadra. Eres el héroe de la noche.",
            consequences: { fama: 10, rel_aficion: 12, moral: 8, media: 4 },
          },
          fail: {
            text: "El portero adivina el lado y lo ataja. Silencio total en el estadio.",
            consequences: { moral: -8, rel_aficion: -4, rel_vestuario: -2, media: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Cedérsela al pateador habitual",
        subtitle: "No arriesgas tu momento",
        consequences: { rel_vestuario: 4 },
        outcomeText: "Le cedes el balón sin dudarlo. Marca, y en la celebración te señala a ti antes que a nadie — todos han visto el gesto.",
      },
    ],
    minWeek: 8,
  },
  {
    id: "par-roja-injusta",
    category: "partido",
    priority: true,
    title: "Expulsión injusta",
    description:
      "El árbitro te enseña la roja directa tras una entrada que ni siquiera tocó al rival. Te quedas mirando la tarjeta sin poder creerlo, con diez compañeros que ahora tienen que remar sin ti.",
    options: [
      {
        id: "a",
        label: "Protestar la decisión con todo",
        subtitle: "Riesgo de sanción extra",
        consequences: {},
        resolve: {
          baseChance: 0.3,
          statModifier: "moral",
          success: {
            text: "El cuarto árbitro te frena a tiempo, pero el vídeo demuestra después que tenías razón. La federación no actúa, pero la prensa sí te respalda.",
            consequences: { fama: 4, moral: 2, media: -1 },
          },
          fail: {
            text: "Te ganas una segunda amonestación y una sanción extra de partidos por tus protestas.",
            consequences: { moral: -6, rel_entrenador: -4, media: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Salir del campo en silencio, tragándotelo",
        subtitle: "+Relación entrenador",
        consequences: { rel_entrenador: 5, moral: -5, media: -1 },
        outcomeText: "Te vas sin decir una palabra, apretando los puños. Desde la banda, el entrenador asiente: sabe que no era fácil callarse.",
      },
    ],
    minWeek: 12,
  },
  {
    id: "par-hat-trick",
    category: "partido",
    priority: true,
    title: "Noche de hat-trick",
    description:
      "Llevas dos goles en el marcador y el partido sigue abierto. En el descuento, un balón suelto en el área te deja solo con la portería vacía para completar el triplete.",
    milestoneType: "gol_decisivo",
    imageScene:
      "Photorealistic sports photography of the photographed man celebrating a goal on the pitch, arms raised, teammates running to embrace him, stadium crowd roaring in the background, dramatic floodlights",
    options: [
      {
        id: "a",
        label: "Rematar a la portería vacía sin pensarlo",
        subtitle: "El hat-trick está ahí",
        consequences: {},
        resolve: {
          baseChance: 0.7,
          statModifier: "forma",
          success: {
            text: "¡Hat-trick! El estadio entero corea tu nombre. Es una noche que no vas a olvidar.",
            consequences: { fama: 15, rel_aficion: 12, moral: 10, media: 6 },
          },
          fail: {
            text: "En el último segundo, un defensa aparece de la nada y despeja sobre la línea. Te quedas con dos goles, que ya está muy bien, pero se queda la espina.",
            consequences: { fama: 5, moral: -2, media: 3 },
          },
        },
      },
      {
        id: "b",
        label: "Pasarla a un compañero que pide el balón a gritos",
        subtitle: "Generosidad, menos protagonismo",
        consequences: { rel_vestuario: 8, moral: 3, media: 2 },
        outcomeText: "Te quedas sin el hat-trick, pero tu compañero te levanta en brazos tras marcar: \"No se me olvida esto en la vida.\"",
      },
    ],
    minWeek: 65,
  },
  {
    id: "par-etiqueta-fichaje-caro",
    category: "partido",
    priority: true,
    title: "El peso del dorsal",
    description:
      "El club pagó una cifra enorme por ti y todo el mundo lo sabe. Sales de titular en un partido cualquiera de Liga y notas que cada balón que tocas se juzga con otra vara: no basta con jugar bien, hay que parecer que vales lo que costaste.",
    options: [
      {
        id: "a",
        label: "Jugar simple, sin intentar justificar el precio en una sola jugada",
        subtitle: "Paciencia con el proceso",
        consequences: { rel_entrenador: 5, moral: 3 },
        outcomeText: "Juegas simple y sin florituras. La prensa no pierde la ocasión de apuntar que 'no ha brillado'... pero tu míster, en el vestuario, te da las gracias.",
      },
      {
        id: "b",
        label: "Forzar la jugada vistosa para callar bocas",
        subtitle: "Todo o nada con la presión encima",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "media",
          success: {
            text: "La jugada sale perfecta. Por primera vez sientes que el vestuario y la grada dejan de mirarte como \"el fichaje\" y empiezan a verte como uno más.",
            consequences: { fama: 8, media: 5, rel_aficion: 6 },
          },
          fail: {
            text: "La jugada se tuerce y el error se magnifica por lo que costaste. Un titular al día siguiente lo deja claro: \"otra vez el fichaje caro\".",
            consequences: { moral: -6, media: -4, fama: -2 },
          },
        },
      },
    ],
    minWeek: 20,
    minMedia: 60,
  },
  {
    id: "par-cesion-revancha",
    category: "partido",
    priority: true,
    // Antes exigía el flag "cedido_antes", que solo ponía fork-cesion — un
    // evento igualmente huérfano, sin ningún selector que lo llamara nunca
    // (ver el mismo hallazgo en la auditoría de esta sesión). El sistema
    // de cesión real y en uso es loan-fork.ts, que marca `loan_active` con
    // el club de origen — justo lo que necesita este evento ("el club que
    // te dejó marchar").
    requiresFlag: "loan_active",
    title: "El club que te dejó marchar, enfrente",
    description:
      "El sorteo del calendario te pone cara a cara contra el club que te cedió sin apenas darte una oportunidad. Nadie lo dice en voz alta en la rueda de prensa previa, pero todos en el vestuario saben que este partido es distinto para ti.",
    imageScene:
      "Photorealistic sports photography of the photographed man celebrating an emotional goal with a restrained, pointed celebration, looking toward the opposing bench, stadium atmosphere, dramatic lighting",
    options: [
      {
        id: "a",
        label: "Guardarte las ganas de revancha y jugar con la cabeza fría",
        subtitle: "Profesionalidad por delante de todo",
        consequences: { moral: 4, rel_entrenador: 4 },
        outcomeText: "No sueltas prenda en ningún momento, y el equipo gana con un partido tuyo discreto pero sólido. El entrenador lo nota más que nadie.",
      },
      {
        id: "b",
        label: "Salir a demostrarles exactamente lo que se perdieron",
        subtitle: "Motivación extra, riesgo de precipitarte",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: {
            text: "Marcas y decides no celebrarlo por respeto, aunque el mensaje llega alto y claro a todo el estadio. La prensa habla de tu partido durante días.",
            consequences: { fama: 10, media: 5, moral: 8 },
          },
          fail: {
            text: "Las ganas te pueden y terminas forzando decisiones que no son propias de tu juego. El partido se te escapa de las manos.",
            consequences: { moral: -5, media: -3 },
          },
        },
      },
    ],
    minWeek: 25,
  },

  // ── VESTUARIO Y PRENSA (momentos guionados) ───────────────────────
  {
    id: "ves-conflicto-capitan",
    category: "vestuario",
    priority: true,
    title: "Choque con el capitán",
    description:
      "El capitán te corta en pleno entrenamiento delante de todos: cree que juegas para la grada, no para el equipo. No es la primera vez que lo piensa, solo la primera que lo dice en voz alta.",
    options: [
      {
        id: "a",
        label: "Responderle ahí mismo, sin bajar la cabeza",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "moral",
          success: {
            text: "El vestuario se pone de tu lado — llevabas razón y todos lo sabían.",
            consequences: { rel_vestuario: 8, moral: 5 },
          },
          fail: {
            text: "Se arma una discusión fea que dos compañeros tienen que cortar. El entrenador se entera.",
            consequences: { rel_vestuario: -8, rel_entrenador: -3, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Hablarlo con él en privado más tarde",
        subtitle: "+Relación vestuario, sin escándalo",
        consequences: { rel_vestuario: 5, moral: 1 },
        outcomeText: "El capitán te escucha con los brazos cruzados y al final suaviza el gesto: \"Vale. La próxima vez dímelo así y ya está.\"",
      },
    ],
    minWeek: 25,
  },
];
