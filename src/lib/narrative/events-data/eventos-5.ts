/** Escenas fijas del juego, parte 5 de 6 (antes vivían en events.ts; el orden del conjunto no ha cambiado). */
import type { GameEvent } from "@/types/career";
import { PRO_RETIREMENT_MIN_WEEK } from "@/types/career";
import { investmentFlag } from "@/lib/finance/investments";

export const EVENTS_5: GameEvent[] = [
  {
    id: "esp-guino-saludo-leyenda",
    category: "partido",
    title: "El saludo antes del partido",
    description:
      "Antes de un amistoso de estrellas, un delantero con acento portugués y un gesto ya famoso te busca para saludarte. Contigo se para dos segundos de más: 'Sigue así'. No hace falta que diga su nombre.",
    priority: true,
    isMilestone: true,
    milestoneType: "guino-leyenda",
    imageScene:
      "Photorealistic sports photo of the photographed man on the pitch before a friendly match, shaking hands with a rival forward of generic athletic build (not a real, identifiable person, no distinctive tattoos or signature pose), stadium floodlights, warm-up kits, candid photojournalism style",
    options: [
      {
        id: "a",
        label: "Guardarte el momento, sin decir nada",
        subtitle: "Disfrutarlo en privado",
        consequences: { moral: 5 },
        outcomeText: "Te guardas ese momento solo para ti. Esa noche, sentado en la cama del hotel, miras la foto y sonríes sin decir nada.",
      },
      {
        id: "b",
        label: "Compartirlo al momento en redes",
        subtitle: "Que lo vea todo el mundo",
        consequences: { fama: 6, moral: 3, rel_aficion: 3 },
        outcomeText: "Subes la foto y en minutos supera el millón de me gusta. Tu madre, desde casa, te escribe: 'Y yo que decía que no eras nadie'.",
      },
    ],
    minWeek: 60,
    minMedia: 78,
  },
  {
    id: "esp-guino-rondo-imposible",
    category: "entrenamiento",
    title: "El rondo imposible",
    description:
      "En un entrenamiento conjunto con la absoluta, un argentino bajito te roba el balón tres veces sin ni mirarte. A la cuarta te deja pasar, te guiña un ojo, y el grupo entero se ríe contigo.",
    priority: true,
    isMilestone: true,
    milestoneType: "guino-leyenda",
    options: [
      {
        id: "a",
        label: "Reírte y pedirle que te enseñe el truco",
        subtitle: "Humildad ante un maestro",
        consequences: { moral: 6, rel_vestuario: 2 },
        outcomeText: "Le pides que te enseñe el truco y él sonríe, se agacha y te lo muestra tres veces despacio. Al terminar, te dice: 'Ahora te toca a ti'.",
      },
      {
        id: "b",
        label: "Tomártelo como una lección para mejorar",
        subtitle: "Competitividad sana",
        consequences: { moral: 3, forma: 3 },
        outcomeText: "Te quedas una hora más trabajando ese control. El día siguiente, en el rondo, el argentino te mira de reojo y levanta una ceja.",
      },
    ],
    minWeek: 90,
    minMedia: 80,
  },
  {
    id: "esp-guino-comparacion-prensa",
    category: "prensa",
    title: "La comparación",
    description:
      "Un periodista veterano te para en zona mixta: 'Llevo 25 años cubriendo esto. Ese control orientado no lo veía desde 2009, en Wembley. El que lo hacía entonces ahora entrena a gente como tú.'",
    priority: true,
    isMilestone: true,
    milestoneType: "guino-leyenda",
    options: [
      {
        id: "a",
        label: "Quitarle importancia: 'Aún me queda mucho'",
        subtitle: "Humildad calculada",
        consequences: { moral: 3, reputacion: 3 },
        outcomeText: "'Aún me queda mucho', dices con una sonrisa. El periodista asiente, apunta algo y te despide con un apretón de manos largo.",
      },
      {
        id: "b",
        label: "Aceptar el cumplido con orgullo",
        subtitle: "Confianza pública",
        consequences: { fama: 5, moral: 4 },
        outcomeText: "Aceptas el cumplido con una sonrisa segura. La frase va directa al titular del día siguiente: 'Se sabe bueno'.",
      },
    ],
    minWeek: 70,
    minMedia: 82,
  },
  {
    id: "esp-guino-capitan-eterno",
    category: "vestuario",
    title: "El veterano eterno",
    description:
      "Tu primer día en el vestuario nuevo, el jugador con más partidos en la historia del club se levanta a darte la mano. 'Aquí se suda como en ningún sitio', dice, con la voz rota de mil batallas.",
    priority: true,
    isMilestone: true,
    milestoneType: "guino-leyenda",
    imageScene:
      "Photorealistic photo of the photographed man in a club dressing room, shaking hands with a veteran teammate of generic appearance (not a real, identifiable person), generic murals and trophy photos on the walls with no real club crests or real faces, warm documentary lighting",
    options: [
      {
        id: "a",
        label: "Agradecerle el gesto sin más",
        subtitle: "Respeto discreto",
        consequences: { moral: 4, rel_vestuario: 4 },
        outcomeText: "Le das las gracias con un asentimiento y él te da una palmada seca en el hombro. Es su manera de decirte que ya eres uno más.",
      },
      {
        id: "b",
        label: "Prometerle que estarás a la altura",
        subtitle: "Asumir el peso del escudo",
        consequences: { moral: 5, rel_vestuario: 2, fama: 2 },
        outcomeText: "Se lo prometes mirándole a los ojos. El veterano sonríe con una mezcla de ternura y exigencia: 'Eso espero, chaval'.",
      },
    ],
    minWeek: 100,
    minMedia: 85,
  },
  /**
   * Momentos "te cuelas donde no tocas" con opciones fijas y garantizadas
   * — inspirados en el patrón real de cuentas de humor futbolero (el
   * jugador que acaba en una boda o un reality por error), pero con
   * personajes y club 100% inventados (nunca un jugador real, ni con el
   * nombre cambiado — misma regla que esp-guino-*). A diferencia de las
   * variantes de funny-surreal.ts (semillas sueltas que la IA expande
   * libremente), aquí las opciones están escritas a mano para asegurar
   * el beat concreto que se pidió: el jugador termina pidiendo días
   * libres / quedarse más tiempo por su propio malentendido.
   */
  {
    id: "rep-consejo-inversion",
    category: "representante",
    title: "Tu agente te habla de invertir",
    description:
      "Tu agente te sienta a hablar de números, no de fútbol: 'Estás ganando más de lo que puedes gastar sensatamente. Antes de que se te vaya en tonterías, mete 5.000 € en algo que trabaje por ti. Tengo dos opciones sobre la mesa: un fondo indexado global — una cartera con cientos de empresas del mundo, sin sobresaltos, alrededor de un 6 % al año — o una participación en un local comercial del centro, ya alquilado a una panadería, que rinde un 4 % fijo y no depende de la bolsa.'",
    priority: true,
    options: [
      {
        id: "invertir",
        label: "Fondo indexado global — 5.000 €",
        subtitle: "Cartera de cientos de empresas · ~6 % anual",
        consequences: {
          patrimonio: -5000,
          reputacion: 3,
          rel_representante: 2,
          flags: investmentFlag("fondo_indexado", {
            name: "Fondo indexado global",
            detail: "Cartera de cientos de empresas de todo el mundo. Sube con la bolsa a largo plazo, ~6 % anual.",
            amount: 5000,
            annualRate: 0.06,
          }),
        },
        outcomeText: "Firmas la orden de compra del fondo sin discutir. Tu representante lo anota en una libreta: 'Esto te lo agradecerás a los treinta'.",
      },
      {
        id: "local",
        label: "Participación en un local alquilado — 5.000 €",
        subtitle: "Una panadería del centro te paga alquiler · ~4 % anual",
        consequences: {
          patrimonio: -5000,
          reputacion: 2,
          rel_representante: 2,
          flags: investmentFlag("local_panaderia", {
            name: "Local comercial alquilado a una panadería",
            detail: "Un trocito de un local del centro, alquilado a una panadería. Rinde un alquiler fijo, ~4 % anual.",
            amount: 5000,
            annualRate: 0.04,
          }),
        },
        outcomeText: "Firmas ante notario y, por primera vez, eres 'propietario' de algo. El panadero te manda un pan de regalo con una nota: 'Gracias por el local, crack'.",
      },
      {
        id: "gastar",
        label: "Preferir disfrutar el dinero ahora",
        subtitle: "Ya invertirás cuando ganes más",
        consequences: { moral: 3, rel_representante: -1 },
        outcomeText: "Esa semana te regalas lo que te apetece. Tu representante suspira, pero también sonríe: 'Disfruta, que para eso lo ganas'.",
      },
      {
        id: "informarme",
        label: "Pedirle que te lo explique bien antes de decidir nada",
        subtitle: "No firmar nada a ciegas",
        consequences: { reputacion: 1, rel_representante: 1 },
        outcomeText: "Pasas una tarde entera con él, con papeles y una calculadora. Sales sin firmar nada, pero con la sensación de entender por primera vez dónde está tu dinero.",
      },
    ],
    minWeek: 20,
    minMedia: 55,
  },
  {
    id: "rep-consejo-vivienda",
    category: "representante",
    title: "Tu agente te sugiere dónde vivir",
    description:
      "'Deberías dejar de vivir como si esto fuera temporal', te dice tu agente. 'Con lo que ganas ya, plantéate algo tuyo — una casa es patrimonio real, no un alquiler que no te devuelve nada.'",
    priority: true,
    options: [
      {
        id: "buscar",
        label: "Empezar a mirar opciones en serio",
        subtitle: "Hacerle caso",
        consequences: { moral: 2, rel_representante: 2 },
        outcomeText: "Empiezas a mirar pisos con tu representante, entre risas y cálculos. Un agente inmobiliario te enseña una terraza con vistas que te quita el aire.",
      },
      {
        id: "esperar",
        label: "Preferir esperar a estar más asentado en un club",
        subtitle: "Todavía no toca",
        consequences: { rel_representante: -1 },
        outcomeText: "Decides esperar a estar más asentado. Tu representante asiente sin presionar: 'Cuando quieras, aquí estoy'.",
      },
    ],
    minWeek: 15,
    minMedia: 50,
  },
  {
    id: "esp-boda-equivocada",
    category: "vida",
    title: "La boda equivocada",
    description:
      "Sales del hotel con prisa y te confundes de salón: acabas en la boda de dos desconocidos, en la ciudad donde jugáis fuera. Antes de que puedas explicarte, ya te han sentado en la mesa presidencial confundiéndote con un invitado VIP. Te quedas 'por educación'.",
    priority: true,
    isMilestone: true,
    milestoneType: "boda_equivocada",
    imageScene:
      "Photorealistic photo of the photographed man at a wedding reception, wearing a suit, raising a toast with generic guests (not real, identifiable people), festive string lights and floral decor, joyful candid photography style",
    options: [
      {
        id: "a",
        label: "Pedirle al club días libres extra para ir a tu boda de verdad",
        subtitle: "La que sí tenías planeada ese fin de semana",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          success: {
            text: "El club se ríe del despiste pero te concede el favor — 'una vez en la vida', te dicen. Llegas a tiempo a la boda que de verdad tenías planeada.",
            consequences: { moral: 6, rel_entrenador: 1, fama: 3 },
          },
          fail: {
            text: "El club no está para bromas esta semana y te lo niega. Te toca elegir entre el entrenamiento y perderte la boda de verdad — una decisión que no le vas a poder explicar bien a nadie.",
            consequences: { moral: -3, rel_entrenador: -1, fama: 2 },
          },
        },
      },
      {
        id: "b",
        label: "Quedarte un rato por cortesía y desaparecer discretamente",
        subtitle: "La opción prudente",
        consequences: { moral: 2, reputacion: 1 },
        outcomeText: "Te quedas un rato por cortesía, aplaudes en el momento justo y te escabulles. Los novios nunca sabrán que el padrino del brindis fue un futbolista.",
      },
      {
        id: "c",
        label: "Aprovechar y hacerte fotos con los novios para las redes",
        subtitle: "Que el error se convierta en contenido",
        consequences: { fama: 5, moral: 3, rel_aficion: 2 },
        outcomeText: "Los novios te piden una foto con ellos encantados. La imagen se hace viral con el pie 'El mejor invitado sorpresa'.",
      },
    ],
    minWeek: 30,
  },
  {
    id: "esp-reality-error",
    category: "vida",
    title: "El reality por error",
    description:
      "Un casting de un reality de supervivencia graba cerca de tu hotel de concentración. Te confunden con un concursante apuntado, te suben a la furgoneta con el resto del grupo, y antes de darte cuenta ya estás firmando papeles y poniéndote un micrófono.",
    priority: true,
    isMilestone: true,
    milestoneType: "reality_error",
    imageScene:
      "Photorealistic photo of the photographed man wearing an outdoor survival-show contestant outfit and microphone pack, standing in a jungle-like set with generic crew and cameras in the background (not real, identifiable people or an existing real TV show branding), adventurous documentary lighting",
    options: [
      {
        id: "a",
        label: "Pedir permiso al club para quedarte hasta acabar el rodaje",
        subtitle: "Total, ya has firmado",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          success: {
            text: "El club, entre risas, te da un par de días — 'esto va a dar más publicidad gratis que cualquier rueda de prensa'. Terminas el rodaje como uno más del reality.",
            consequences: { fama: 10, moral: 5, rel_aficion: 4 },
          },
          fail: {
            text: "El entrenador no se lo toma tan bien: 'esto es una plantilla profesional, no un plató'. Tienes que volver de inmediato, dejando el rodaje a medias.",
            consequences: { moral: -3, rel_entrenador: -2, fama: 3 },
          },
        },
      },
      {
        id: "b",
        label: "Aclarar el malentendido enseguida y volver a la concentración",
        subtitle: "Lo correcto, aunque menos divertido",
        consequences: { rel_entrenador: 2, reputacion: 1 },
        outcomeText: "Aclaras el malentendido con una sonrisa y vuelves. En el hotel, tus compañeros se parten de risa con el vídeo del casting.",
      },
      {
        id: "c",
        label: "Seguir la corriente sin decir nada, a ver hasta dónde llega",
        subtitle: "Improvisar sobre la marcha",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          success: {
            text: "Nadie del programa se entera de que no estabas apuntado hasta que sale en redes — para entonces ya eres el fichaje sorpresa favorito de la temporada del reality.",
            consequences: { fama: 8, moral: 4 },
          },
          fail: {
            text: "Te descubren a mitad de una prueba y el numerito se vuelve viral por el motivo equivocado — más vergüenza ajena que otra cosa.",
            consequences: { fama: 2, moral: -2, reputacion: -1 },
          },
        },
      },
    ],
    minWeek: 30,
  },
  {
    id: "sel-clasificacion-mundial",
    category: "especial",
    priority: true,
    requiresMajorTournament: { type: "mundial", timing: "season_before" },
    title: "Partido decisivo de clasificación al Mundial",
    description:
      "Última jornada de clasificación. Tu selección se juega el billete al Mundial en un partido que no admite errores. El estadio entero sabe lo que hay en juego esta noche.",
    isMilestone: true,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al grupo antes de saltar al campo?",
    imageScene:
      "Photorealistic sports photography of the photographed man in his national team kit, intense moment on the pitch during a decisive qualifying match, huge tension in the stadium, dramatic lighting",
    minMedia: 65,
    options: [
      {
        id: "a",
        label: "Pedir responsabilidad y salir a por el partido",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "fama",
          success: {
            text: "¡Clasificados! El campo entero explota. Habrá Mundial, y tú vas a estar en él.",
            consequences: { fama: 14, moral: 12, media: 4 },
          },
          fail: {
            text: "El partido se escapa y la clasificación queda en el aire. La selección necesitará un milagro en otro lado.",
            consequences: { moral: -10, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con cabeza, sin asumir riesgos innecesarios",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, fama: 2 },
        outcomeText: "Juegas con cabeza y tu selección se acerca al billete. En el vestuario, el seleccionador te agradece que no hayas forzado de más.",
      },
    ],
    minWeek: 85,
  },
  {
    id: "sel-clasificacion-eurocopa",
    category: "especial",
    priority: true,
    requiresMajorTournament: { type: "eurocopa", timing: "season_before" },
    title: "Partido decisivo de clasificación a la Eurocopa",
    description:
      "Tu selección necesita puntuar sí o sí para asegurar la plaza en la Eurocopa. Es el partido más tenso de toda la fase de clasificación.",
    isMilestone: true,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al grupo antes de saltar al campo?",
    imageScene:
      "Photorealistic sports photography of the photographed man in his national team kit, intense moment on the pitch during a decisive European qualifying match, huge tension in the stadium, dramatic lighting",
    requiresConfederation: ["UEFA"],
    minMedia: 65,
    options: [
      {
        id: "a",
        label: "Pedir responsabilidad y salir a por el partido",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "fama",
          success: {
            text: "¡Clasificados a la Eurocopa! El vestuario se viene abajo de la emoción.",
            consequences: { fama: 12, moral: 10, media: 3 },
          },
          fail: {
            text: "El resultado no llega y la clasificación se complica muchísimo de cara a la última jornada.",
            consequences: { moral: -8, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con cabeza, sin asumir riesgos innecesarios",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, fama: 2 },
        outcomeText: "Manejas los tiempos con inteligencia. Cuando acaba el partido, tu país entero respira aliviado y tú, por fin, también.",
      },
    ],
    minWeek: 85,
  },
  {
    id: "sel-clasificacion-copa-america",
    category: "especial",
    priority: true,
    requiresMajorTournament: { type: "copa_america", timing: "season_before" },
    title: "Partido decisivo de clasificación a la Copa América",
    description:
      "La selección se juega la clasificación a la Copa América en un partido que puede definir toda la campaña. La presión en el vestuario es máxima.",
    isMilestone: true,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al grupo antes de saltar al campo?",
    imageScene:
      "Photorealistic sports photography of the photographed man in his national team kit, intense moment on the pitch during a decisive South American qualifying match, huge tension in the stadium, dramatic lighting",
    requiresConfederation: ["CONMEBOL"],
    minMedia: 65,
    options: [
      {
        id: "a",
        label: "Pedir responsabilidad y salir a por el partido",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "fama",
          success: {
            text: "¡Clasificados a la Copa América! La afición celebra en las calles de todo el país.",
            consequences: { fama: 12, moral: 10, media: 3 },
          },
          fail: {
            text: "El resultado no llega y la clasificación se complica muchísimo de cara a la última jornada.",
            consequences: { moral: -8, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con cabeza, sin asumir riesgos innecesarios",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, fama: 2 },
        outcomeText: "Mantienes la calma mientras el estadio ruge. Al final, el seleccionador te da un abrazo corto y silencioso: lo ha visto todo.",
      },
    ],
    minWeek: 85,
  },
  {
    id: "sel-eurocopa",
    category: "especial",
    title: "Arranca la Eurocopa",
    description:
      "Se abre la Eurocopa y estás en la lista final de tu selección. Semanas de convivencia, presión mediática constante y un torneo entero por delante con todo un continente mirando.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué dices en la rueda de prensa previa al torneo?",
    options: [
      {
        id: "a",
        label: "Salir a jugar cada partido a todo o nada",
        subtitle: "Asumir riesgos para liderar al equipo",
        consequences: { fama: 2, moral: 2, flags: { torneo_activo: "eurocopa", torneo_style: "riesgo" } },
        outcomeText: "Lo dices sin vacilar ante las cámaras: no vas a especular. Los titulares del día siguiente son tuyos.",
      },
      {
        id: "b",
        label: "Jugar con la cabeza, priorizando no arriesgar de más",
        subtitle: "Gestión de la presión",
        consequences: { moral: 3, reputacion: 2, flags: { torneo_activo: "eurocopa", torneo_style: "cabeza" } },
        outcomeText: "Tu respuesta es serena y medida. El seleccionador asiente desde la mesa: es justo lo que necesitaba oír.",
      },
      {
        id: "c",
        label: "Asumir el papel de líder del vestuario",
        subtitle: "Sostener al grupo, no solo a ti mismo",
        consequences: { rel_vestuario: 3, moral: 2, flags: { torneo_activo: "eurocopa", torneo_style: "lider" } },
        outcomeText: "Hablas del grupo antes que de ti. En el vestuario, esa misma tarde, alguien repite tus palabras en voz alta.",
      },
    ],
    minWeek: 30,
  },
  {
    id: "sel-copa-america",
    category: "especial",
    title: "Arranca la Copa América",
    description:
      "Se abre la Copa América y estás en la lista final. Todo un continente pendiente del torneo, y tú en medio de él, con la camiseta de tu país.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué dices en la rueda de prensa previa al torneo?",
    options: [
      {
        id: "a",
        label: "Salir a jugar cada partido a todo o nada",
        subtitle: "Asumir riesgos para liderar al equipo",
        consequences: { fama: 2, moral: 2, flags: { torneo_activo: "copa_america", torneo_style: "riesgo" } },
        outcomeText: "Lo dices sin vacilar ante las cámaras: no vas a especular. Los titulares del día siguiente son tuyos.",
      },
      {
        id: "b",
        label: "Jugar con la cabeza, priorizando no arriesgar de más",
        subtitle: "Gestión de la presión",
        consequences: { moral: 3, reputacion: 2, flags: { torneo_activo: "copa_america", torneo_style: "cabeza" } },
        outcomeText: "Tu respuesta es serena y medida. El seleccionador asiente desde la mesa: es justo lo que necesitaba oír.",
      },
      {
        id: "c",
        label: "Asumir el papel de líder del vestuario",
        subtitle: "Sostener al grupo, no solo a ti mismo",
        consequences: { rel_vestuario: 3, moral: 2, flags: { torneo_activo: "copa_america", torneo_style: "lider" } },
        outcomeText: "Hablas del grupo antes que de ti. En el vestuario, esa misma tarde, alguien repite tus palabras en voz alta.",
      },
    ],
    minWeek: 30,
  },

  // ── VIDA TEMPRANA (primeros meses de carrera) ──────────────────
  {
    id: "vid-primer-coche",
    category: "vida",
    title: "Tu padre te regala un coche",
    description:
      "Tu padre entra a casa con las llaves de un coche nuevo. 'Dijiste que querías uno desde que tenías diez años', te dice con una sonrisa. Es un modesto, pero es tuyo, y significa que algo has conseguido ya.",
    minWeek: 6,
    options: [
      {
        id: "emocionado",
        label: "Emocionarte de verdad y darle un abrazo",
        subtitle: "Un momento de sinceridad",
        consequences: { moral: 8, patrimonio: -8000 },
        outcomeText: "Abrazas a tu padre con fuerza, sin importarte lo que piense nadie. Por una vez, él no dice nada, solo te aprieta el hombro con la mano.",
      },
      {
        id: "practico",
        label: "Darle las gracias pero pensar en cómo mantenerlo",
        subtitle: "Responsabilidad del futbolista",
        consequences: { moral: 4, patrimonio: -5000 },
        outcomeText: "Le das las gracias y empiezas a hablar de seguros y revisiones. Tu padre se ríe: 'Qué serio te has vuelto'.",
      },
    ],
  },
  {
    id: "vid-fiesta-familia",
    category: "vida",
    title: "Fiesta familiar en una discoteca",
    description:
      "Tu familia quiere celebrar que ya eres jugador profesional. Reservan una mesa en la mejor discoteca de la ciudad. Amigos, primos, tíos... todos quieren verte.",
    minWeek: 7,
    options: [
      {
        id: "celebrar",
        label: "Disfrutar la noche sin frenar",
        subtitle: "+Moral, -Forma (cansancio)",
        consequences: { moral: 10, forma: -4, patrimonio: -3000 },
        outcomeText: "Bailas hasta que se encienden las luces. Al día siguiente, en el entrenamiento, el preparador físico te mira con ojos como platos y no dice nada.",
      },
      {
        id: "moderado",
        label: "Estar pero no trasnochar, mañana entreno",
        subtitle: "Disciplina",
        consequences: { moral: 6, forma: 2, rel_entrenador: 3 },
        outcomeText: "Te quedas un rato y te despides pronto. Tus primos te chinchan por 'ser un viejo', pero tu madre te guiña un ojo desde la mesa.",
      },
    ],
  },
  {
    id: "vid-charla-entrenador",
    category: "vestuario",
    title: "El entrenador te cita en su despacho",
    description:
      "Después del entrenamiento te llama. Entra en su despacho sin saber si es bueno o malo. Se sienta, te mira a los ojos: 'Eres joven, tienes hambre, eso se ve. Pero aquí no basta. ¿Qué quieres conseguir realmente?'",
    minWeek: 8,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al entrenador? (Tu ambición en una frase)",
    options: [
      {
        id: "ambicioso",
        label: "Dile que quieres ser una leyenda",
        subtitle: "+Relación entrenador, +Moral",
        consequences: { rel_entrenador: 8, moral: 6 },
        outcomeText: "El míster te mira unos segundos, serio, y luego sonríe: 'Eso pensaba yo a tu edad'. Sales del despacho con una ambición nueva.",
      },
      {
        id: "modesto",
        label: "Di que solo quieres aprender y jugar",
        subtitle: "Pragmático",
        consequences: { rel_entrenador: 5, moral: 3 },
        outcomeText: "Dices que solo quieres aprender y jugar. El míster asiente, algo desconcertado, y anota algo en una libreta.",
      },
    ],
  },
  {
    id: "vid-compañeros-colegio",
    category: "vida",
    title: "Compañeros de clase te reconocen en la calle",
    description:
      "Salías del colegio (todavía vas a clase cuando no hay entrenos) y un grupo de compañeros te rodea. 'Eh, ¿es verdad que fichaste por el equipo? ¡Tío, qué pasada!' Todos quieren fotos, autógrafos.",
    minWeek: 5,
    options: [
      {
        id: "accesible",
        label: "Tomarte fotos y hablar con todos",
        subtitle: "+Fama, +Moral",
        consequences: { fama: 6, moral: 5 },
        outcomeText: "Te haces fotos con cada uno y escuchas historias del cole. Un profesor, desde la ventana, te saluda con la mano sin dar crédito.",
      },
      {
        id: "distante",
        label: "Ser amable pero estar ocupado",
        subtitle: "Mantener el enfoque",
        consequences: { fama: 2, forma: 3 },
        outcomeText: "Saludas con una sonrisa y sigues tu camino. Algunos compañeros lo entienden; otros comentan en voz baja que 'se le han subido los humos'.",
      },
    ],
  },

  // ── PREMIOS Y TROFEOS INDIVIDUALES ────────────────────────────
  {
    id: "premio-pichichi",
    category: "especial",
    priority: true,
    title: "Pichichi: máximo goleador",
    description:
      "Terminada la temporada, los números hablan por sí solos. Eres el máximo goleador de la liga. 40 goles en 38 partidos. Los periodistas lo confirman antes incluso de que se haga oficial.",
    isMilestone: true,
    milestoneType: "premio",
    minWeek: 50,
    options: [
      {
        id: "a",
        label: "Celebrarlo con el equipo",
        subtitle: "+Rel_vestuario, +Fama",
        consequences: { fama: 16, rel_vestuario: 10, moral: 10 },
        outcomeText: "Lo celebras con todo el vestuario, con cava y una tarta con forma de balón. Sin tus compañeros, ese premio no existiría, y lo sabes.",
      },
      {
        id: "b",
        label: "Mantenerlo discreto, ya hay Champions",
        subtitle: "Pragmático",
        consequences: { fama: 8, forma: 3 },
        outcomeText: "Lo recibes con discreción y vuelves a pensar en la Champions. El míster te nota la cabeza en otra parte... y lo agradece.",
      },
    ],
  },
  {
    id: "premio-mvp-torneo",
    category: "especial",
    priority: true,
    title: "MVP de la Copa del Rey",
    description:
      "Después de jugar toda la Copa del Rey y llegar a la final, los votos están claros: eres el mejor jugador del torneo. El trofeo de MVP y una placa con tu nombre en el museo.",
    isMilestone: true,
    milestoneType: "premio",
    minWeek: 45,
    options: [
      {
        id: "a",
        label: "Agradecer públicamente y dedicar el premio al equipo",
        subtitle: "+Moral, +Rel_vestuario",
        consequences: { fama: 12, moral: 12, rel_vestuario: 8 },
        outcomeText: "Agradeces públicamente al equipo y dedicas el premio. Tu capitán te lanza un guiño: 'Qué bien hablas, chaval'.",
      },
      {
        id: "b",
        label: "Reconocer que fue un esfuerzo colectivo",
        subtitle: "Humildad",
        consequences: { fama: 8, moral: 8 },
        outcomeText: "Dices que fue un esfuerzo colectivo. Los periodistas lo repiten en titulares y el vestuario te regala una camiseta firmada por todos.",
      },
    ],
  },

  // ── RETIRO (solo modo Pro) ─────────────────────────────────────
  {
    id: "fork-retiro-pro",
    category: "especial",
    priority: true,
    title: "¿Cuándo parar?",
    description:
      "Ya no eres el mismo de los primeros años. La pregunta dejó de ser dónde jugar para pasar a ser cuánto más te queda.",
    lookEvolution:
      "Same person, distinguished older look, greying hair and beard, elegant retired athlete portrait, natural light, photorealistic, keep facial identity and skin tone unchanged",
    modes: ["pro"],
    minWeek: PRO_RETIREMENT_MIN_WEEK,
    // Ver el mismo comentario en buildReadyToRetireEvent
    // (career-transitions.ts): el documento de referencia cierra la
    // carrera con un mensaje de despedida escrito por el propio jugador,
    // no solo con una tabla de estadísticas.
    allowFreeText: true,
    freeTextPrompt: "Si hoy fuera tu último día como profesional, ¿qué mensaje de despedida dejarías?",
    options: [
      {
        id: "jugar_mas",
        label: "Jugar una temporada más",
        subtitle: "Exprimir un poco más la carrera",
        consequences: { forma: -3, moral: 3 },
        outcomeText: "Decides una temporada más. En el vestuario te aplauden, y por la noche, en casa, te preguntas cuánto tiempo más aguantará la rodilla.",
      },
      {
        id: "retirarse",
        label: "Colgar las botas",
        subtitle: "Cerrar la etapa de jugador para siempre",
        consequences: {},
        outcomeText: "Lo anuncias en una rueda de prensa con la voz firme. El estadio entero se pone en pie y, durante cinco minutos, no se oye nada más que tu nombre.",
      },
    ],
  },

  // ── Patrones reales de carrera (skill narrativas-futbol) ──────────────
  // Arquetipos que pasan constantemente en el fútbol de verdad (fichaje
  // caro que no cuaja, choque cultural, lesión de rodilla, marginado por
  // cambio de entrenador, suplente que explota tarde, veterano que
  // vuelve a su debut) más varias escenas graciosas/surrealistas de
  // vestuario y prensa — cortas y con gancho concreto, no descripción
  // atmosférica larga.
  {
    id: "esp-fichaje-caro-presion",
    category: "especial",
    title: "El precio pesa",
    description: "La prensa lleva semanas repitiendo tu cifra de traspaso. Empiezas flojo y la grada ya te pita el primer control malo.",
    minWeek: 20,
    minMedia: 60,
    options: [
      {
        id: "a",
        label: "Ignorar el ruido y trabajar",
        subtitle: "Paciencia",
        consequences: { moral: -2, forma: 2 },
        outcomeText: "Ignoras los pitidos y trabajas en silencio. Tu entrenador, al verlo, te da una palmada: 'Tarde o temprano, la grada cambia de opinión'.",
      },
      {
        id: "b",
        label: "Salir a dar la cara en rueda de prensa",
        subtitle: "Riesgo público",
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: { text: "La sinceridad conecta con la afición. Te aplauden en el siguiente entrenamiento a puerta abierta.", consequences: { fama: 3, rel_aficion: 4 } },
          fail: { text: "Tus palabras se recortan y se malinterpretan. El ruido crece en vez de apagarse.", consequences: { fama: -2, moral: -3 } },
        },
        consequences: {},
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices a la prensa sobre el precio de tu fichaje?",
  },
  {
    id: "vid-choque-cultural-extranjero",
    category: "vida",
    title: "La luna de miel se acaba",
    description: "Los primeros meses fuera fueron ilusión pura. Ahora el idioma sigue costando, comes solo casi cada noche y empiezas a echar de menos hasta lo que no soportabas de casa.",
    minWeek: 15,
    options: [
      {
        id: "a",
        label: "Apuntarte a clases intensivas del idioma",
        subtitle: "Invertir en adaptarte",
        consequences: { patrimonio: -1500, rel_vestuario: 4, moral: 2 },
        outcomeText: "Cada tarde, tu profesor te hace repetir frases hasta que sale el acento. Un día, el panadero te sonríe: 'Ya hablas como uno de aquí'.",
      },
      {
        id: "b",
        label: "Aislarte y centrarte solo en el fútbol",
        subtitle: "Cabeza en el trabajo",
        consequences: { forma: 3, moral: -4, rel_vestuario: -2 },
        outcomeText: "Te encierras en el campo, el gimnasio y la habitación. Funcionas, pero las noches se hacen largas y el silencio del piso pesa.",
      },
      {
        id: "c",
        label: "Llamar a casa más de lo habitual",
        subtitle: "Buscar ancla emocional",
        consequences: { moral: 4, forma: -1 },
        outcomeText: "Hablas con tu madre cada noche una hora entera. Al colgar, sientes que tu casa no está tan lejos como parecía.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué es lo que más echas de menos de casa esta semana?",
  },
  {
    id: "ent-marginado-nuevo-entrenador",
    category: "entrenamiento",
    title: "El nuevo técnico no cuenta contigo",
    description: "Cambia el entrenador. Con el anterior eras fijo; con este ni calientas. No te ha dado ninguna explicación todavía.",
    coachStance: "no_cuenta",
    minWeek: 20,
    minMedia: 58,
    options: [
      {
        id: "a",
        label: "Pedirle una charla cara a cara",
        subtitle: "Ir directo al grano",
        resolve: {
          baseChance: 0.45,
          statModifier: "reputacion",
          success: { text: "Te da una razón concreta y una oportunidad para demostrarlo: vuelves a la convocatoria de inmediato.", consequences: { rel_entrenador: 5, moral: 3, flags: { coach_bench: "0" } } },
          fail: { text: "La charla es fría y genérica. Sigues sin saber por qué no cuenta contigo, y no te convoca en los próximos partidos.", consequences: { moral: -4, flags: { coach_bench: "5" } } },
        },
        consequences: {},
      },
      {
        id: "b",
        label: "Callar y trabajar el doble en cada entrenamiento",
        subtitle: "Convencer con hechos",
        consequences: { forma: 4, moral: -2, flags: { coach_bench: "4" } },
        outcomeText: "Entrenas el doble, sin una queja. Aun así, de momento, ni calientas: el míster quiere ver cuánto aguantas.",
      },
      {
        id: "c",
        label: "Pedirle a tu representante que mueva un traspaso ya",
        subtitle: "Salir cuanto antes",
        // bench_streak ya en 2: el club activa de inmediato la escena de
        // salida (role-events.ts) con ofertas reales de otros clubes.
        consequences: { rel_representante: 2, moral: 1, flags: { coach_bench: "5", bench_streak: "2" } },
        outcomeText: "Tu representante recibe el mensaje y no hace preguntas. En el club, la noticia corre más rápido que tú.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "Si le pides explicaciones al entrenador, ¿qué le dices exactamente?",
  },
  {
    id: "rep-cesion-exito-sin-hueco",
    category: "representante",
    title: "Vuelves mejor, pero sigues sin hueco",
    description: "Vuelves de la cesión siendo un jugador distinto. Tu club de origen te lo reconoce en la reunión... y en la misma frase te dice que en el once no hay sitio para ti.",
    requiresFlag: "loan_active",
    minMedia: 62,
    options: [
      {
        id: "a",
        label: "Exigir que te dejen salir de nuevo, esta vez con opción de compra",
        subtitle: "No repetir la misma situación",
        consequences: { rel_representante: 3, fama: 2 },
        outcomeText: "Se lo exiges al club con tu representante a tu lado. El director deportivo, tras unos segundos tensos, asiente: 'Lo estudiaremos'.",
      },
      {
        id: "b",
        label: "Quedarte a forzar la situación desde dentro",
        subtitle: "Última bala en tu club de origen",
        consequences: { moral: -3, forma: 1 },
        outcomeText: "Decides quedarte a pelear. En el primer entrenamiento, el míster te mira un segundo de más y vuelves a sentir que tienes algo que demostrar.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al director deportivo cuando te dice que sigue sin haber hueco?",
  },
  {
    id: "ves-suplente-explota-tarde",
    category: "vestuario",
    title: "Años de banquillo, un minuto de gloria",
    description: "Llevas temporadas siendo suplente fijo. Hoy entras en el minuto 70 por una lesión ajena y decides que no vas a desaprovecharlo.",
    minWeek: 30,
    maxMedia: 68,
    options: [
      {
        id: "a",
        label: "Jugar sin miedo a equivocarte",
        subtitle: "Todo o nada",
        resolve: {
          baseChance: 0.4,
          statModifier: "media",
          success: { text: "Apareces decisivo justo cuando nadie lo esperaba. El vestuario entero te lo reconoce.", consequences: { media: 5, fama: 4, rel_vestuario: 5 } },
          fail: { text: "Los nervios te pueden y desaprovechas el momento. Vuelves al banquillo la semana siguiente.", consequences: { moral: -5 } },
        },
        consequences: {},
      },
      {
        id: "b",
        label: "Jugar seguro, sin arriesgar nada",
        subtitle: "No estropearlo",
        consequences: { forma: 1, rel_entrenador: 1 },
        outcomeText: "Juegas seguro, sin arriesgar. Cuando acaba el partido, el míster te da la mano con respeto y tú entiendes que ha sido suficiente.",
      },
    ],
  },
  {
    id: "esp-veterano-vuelve-debut",
    category: "especial",
    title: "Vuelves a donde empezó todo",
    description: "Después de años fuera, firmas por el club donde debutaste. Nada es exactamente igual: ni el vestuario, ni la grada, ni tú.",
    minWeek: 140,
    isMilestone: true,
    imageScene: "Photorealistic photo of the photographed man in his boyhood club's home kit, standing alone in the middle of the pitch looking up at the stands, emotional nostalgic expression, golden hour light, wide shot",
    options: [
      {
        id: "a",
        label: "Asumir un rol de líder veterano",
        subtitle: "Guiar a los jóvenes",
        consequences: { rel_vestuario: 6, moral: 5, fama: 3 },
        outcomeText: "En la primera charla de grupo, los jóvenes te escuchan en silencio. Alguno anota lo que dices en el móvil, y tú sonríes.",
      },
      {
        id: "b",
        label: "Centrarte solo en aportar en el campo",
        subtitle: "Perfil bajo",
        consequences: { forma: 3, rel_aficion: 2 },
        outcomeText: "Te centras en aportar en el campo. Los jóvenes te observan de lejos, con respeto, y aprenden más de lo que crees sin que tengas que decir una palabra.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué sientes al volver a pisar el campo donde debutaste, años después?",
  },
  {
    id: "ves-corte-pelo-obsesivo",
    category: "vestuario",
    title: "La noche antes, obsesionado con el pelo",
    description: "La noche antes de un partido grande te obsesionas con cortarte el pelo. Terminas rapándote entero a las dos de la madrugada y casi llegas tarde a la concentración.",
    options: [
      {
        id: "a",
        label: "Presentarte igual, calvo y sin dormir",
        subtitle: "Da igual, a jugar",
        consequences: { forma: -1, fama: 3, moral: 2 },
        outcomeText: "Sales al campo calvo y ojeroso. El estadio entero ríe, pero marcas en la primera mitad y desde ese día lo llaman 'el corte de la suerte'.",
      },
      {
        id: "b",
        label: "Ponerte gorra y esperar que nadie lo note",
        subtitle: "Disimular",
        consequences: { moral: 1, rel_vestuario: 2 },
        outcomeText: "Te pones una gorra que nadie se cree. En el túnel, el capitán te la quita de golpe: '¿De verdad?'. Se ríe media plantilla.",
      },
    ],
  },
  {
    id: "ves-equipacion-prestada",
    category: "vestuario",
    title: "La equipación no ha llegado",
    description: "Un fallo de logística: la nueva equipación se queda en la aduana. Toca salir a un partido con camisetas prestadas del filial, sin tu nombre ni tu dorsal.",
    options: [
      {
        id: "a",
        label: "Reírte del percance en redes",
        subtitle: "Convertirlo en algo simpático",
        consequences: { fama: 4, rel_aficion: 3 },
        outcomeText: "Subes una foto con la camiseta de otro equipo y un 'hoy toca ser otro'. La gente se ríe y el club lo agradece.",
      },
      {
        id: "b",
        label: "Quejarte formalmente al club",
        subtitle: "Que no vuelva a pasar",
        consequences: { rel_entrenador: -1, fama: -1 },
        outcomeText: "Mandas una queja formal con voz firme. El club promete investigar y, desde ese día, la logística es impecable.",
      },
    ],
  },
  {
    id: "ves-guerra-bromas-vestuario",
    category: "vestuario",
    title: "La guerra de bromas se descontrola",
    description: "Llevabais semanas de bromas cruzadas en el vestuario. Hoy alguien se ha pasado tres pueblos justo antes de un entrenamiento importante y el ambiente se ha tensado de golpe.",
    options: [
      {
        id: "a",
        label: "Cortarlo con humor antes de que vaya a más",
        subtitle: "Rebajar la tensión",
        consequences: { rel_vestuario: 4, moral: 1 },
        outcomeText: "Sueltas un chiste justo a tiempo. El vestuario ríe de golpe, la tensión se rompe y alguien te lanza un balón de cortesía.",
      },
      {
        id: "b",
        label: "Devolvérsela el doble de fuerte",
        subtitle: "Escalar la broma",
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: { text: "La respuesta es tan buena que hasta el afectado se ríe. Se convierte en anécdota del vestuario.", consequences: { rel_vestuario: 5, fama: 2 } },
          fail: { text: "Se lo toma mal de verdad. El ambiente queda raro varios días.", consequences: { rel_vestuario: -6 } },
        },
        consequences: {},
      },
    ],
  },
  {
    id: "ves-supersticion-ridicula",
    category: "vestuario",
    title: "La superstición que ya es ridícula",
    description: "Un compañero lleva ganando desde que se pone las botas en un orden exacto y ahora exige que todo el vestuario siga su ritual antes de cada partido, por absurdo que sea.",
    options: [
      {
        id: "a",
        label: "Seguirle la corriente sin cuestionarlo",
        subtitle: "Por si acaso",
        consequences: { rel_vestuario: 3, moral: 1 },
        outcomeText: "Sigues el orden exacto de botas sin rechistar. Ganáis, y el compañero te mira con una gratitud casi religiosa.",
      },
      {
        id: "b",
        label: "Negarte y reírte de la superstición",
        subtitle: "No entrar al juego",
        consequences: { rel_vestuario: -2, moral: 2 },
        outcomeText: "Te ríes abiertamente y te pones las botas al revés. El compañero se santigua y, aunque ganáis, no te vuelve a dirigir la palabra en dos días.",
      },
    ],
  },
  {
    id: "pre-rueda-prensa-surrealista",
    category: "prensa",
    title: "La pregunta más rara de tu carrera",
    description: "En plena rueda de prensa, un periodista te hace una pregunta que no tiene nada que ver con el fútbol y espera una respuesta seria delante de todas las cámaras.",
    options: [
      {
        id: "a",
        label: "Seguirle el juego con humor",
        subtitle: "Momento viral asegurado",
        consequences: { fama: 5, moral: 2 },
        outcomeText: "Respondes con una chorrada magistral y la sala estalla en risas. El vídeo se convierte en la comidilla del día y el club, de reojo, aprueba.",
      },
      {
        id: "b",
        label: "Redirigir con educación hacia el fútbol",
        subtitle: "Profesional hasta el final",
        consequences: { rel_entrenador: 2, fama: 1 },
        outcomeText: "Redirigis la pregunta con elegancia hacia el partido. El periodista asiente, algo decepcionado, y apunta tu respuesta con resignación.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes exactamente a esa pregunta tan rara?",
  },

  // ── Tu entrenador te habla, vestuario y familia (salseo cotidiano) ─────
];
