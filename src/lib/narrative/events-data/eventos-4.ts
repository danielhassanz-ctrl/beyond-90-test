/** Escenas fijas del juego, parte 4 de 6 (antes vivían en events.ts; el orden del conjunto no ha cambiado). */
import type { GameEvent } from "@/types/career";
import { investmentFlag } from "@/lib/finance/investments";

export const EVENTS_4: GameEvent[] = [
  {
    id: "prensa-polemica",
    category: "prensa",
    priority: true,
    title: "Una frase que se hace viral",
    description:
      "Una frase tuya en zona mixta, sacada de contexto, se convierte en trending topic en minutos. Los titulares dicen que criticaste al club; tú solo hablabas de la presión mediática en general.",
    options: [
      {
        id: "a",
        label: "Aclararlo tú mismo en redes, sin filtros",
        subtitle: "Jugada de riesgo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "fama",
          success: {
            text: "Tu aclaración se entiende bien y hasta gana simpatías por lo directa que fue.",
            consequences: { fama: 8, rel_aficion: 4 },
          },
          fail: {
            text: "Tu respuesta suena defensiva y aviva más la polémica.",
            consequences: { fama: -4, rel_aficion: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Dejar que el club emita un comunicado oficial",
        subtitle: "Perfil bajo, el control queda en otras manos",
        consequences: { rel_representante: 3, fama: -1 },
        outcomeText: "El club emite un comunicado oficial a las pocas horas. Notas cómo el ruido baja, pero también que no has tenido tu propia voz.",
      },
    ],
    minWeek: 35,
  },

  // ── DECISIONES DE CLUB (elección directa, no azar) ────────────────
  {
    id: "fork-cesion",
    category: "representante",
    priority: true,
    title: "¿Pelear tu lugar o salir a jugar?",
    description:
      "No estás teniendo los minutos que esperabas. Tu representante te trae una alternativa: salir a préstamo a un club donde serías titular.",
    lookEvolution:
      "Same person, a bit older now, slightly more defined jawline, still young and fresh-faced, natural light, photorealistic athlete portrait, keep facial identity and skin tone unchanged",
    options: [
      {
        id: "a",
        label: "Quedarte y pelear tu lugar",
        subtitle: "Apuesta a largo plazo en el mismo club",
        consequences: { rel_vestuario: 6, moral: -2, media: -2 },
        outcomeText: "Decides quedarte a pelear. Cuando se lo dices al míster, solo contesta: 'Pues a demostrarlo'. Desde ese día, cada entrenamiento es un examen.",
      },
      {
        id: "b",
        label: "Salir cedido para jugar todos los minutos",
        subtitle: "Menos exposición, más minutos",
        consequences: {
          club: "Real Zaragoza",
          forma: 10,
          fama: -3,
          moral: 5,
          media: 4,
          flags: { cedido_antes: "Real Zaragoza" },
        },
        outcomeText: "Haces la maleta con una mezcla de emoción y nostalgia. En el nuevo club, el entrenador te recibe con un 'aquí cuentas con minutos' que suena a música.",
      },
    ],
    minWeek: 15,
  },
  {
    id: "fork-fuera-de-planes",
    category: "representante",
    priority: true,
    coachStance: "no_cuenta",
    title: "El entrenador ya no cuenta contigo",
    description:
      "Te lo dice sin rodeos en su despacho: no entras en sus planes, ni ahora ni la temporada que viene. El club prefiere que salgas cedido o traspasado antes de que se cumpla tu contrato sin jugar.",
    imageScene:
      "Photorealistic photo of the photographed man sitting across a desk from a coach in a small, sparse office, tense body language, harsh overhead lighting, difficult conversation atmosphere",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al entrenador en ese despacho?",
    options: [
      {
        id: "a",
        label: "Aceptar la salida a un club más modesto",
        subtitle: "Bajar el nivel para volver a jugar",
        consequences: {},
        resolve: {
          baseChance: 0.6,
          statModifier: "media",
          success: {
            text: "El cambio de aires te sienta bien: vuelves a disfrutar del fútbol en un club que sí cuenta contigo.",
            consequences: { moral: 6, media: 3, club: "@LOWER", flags: { coach_bench: "0", bench_streak: "0" } },
          },
          fail: {
            text: "El nuevo club tampoco te da lo que buscabas, y la sensación de estancamiento vuelve enseguida.",
            consequences: { moral: -5, media: -3, club: "@LOWER", flags: { coach_bench: "0", bench_streak: "0" } },
          },
        },
      },
      {
        id: "b",
        label: "Quedarte a pelear tu sitio pese a todo",
        subtitle: "Orgullo, riesgo de pudrirte en el banquillo",
        consequences: { moral: -4, rel_entrenador: -3, media: -3, flags: { coach_bench: "5" } },
        outcomeText: "Aguantas la mirada y te quedas. En el club nadie te lo agradece: a partir de ahora te toca ganarte cada minuto desde cero.",
      },
    ],
    minWeek: 30,
    maxMedia: 52,
  },
  {
    id: "fork-no-renovacion",
    category: "representante",
    priority: true,
    title: "El club no te renueva",
    description:
      "Termina la temporada y, con ella, tu contrato. El club te comunica que no va a renovarte: los números no acompañan, y hay jugadores más jóvenes esperando el sitio. Te quedas libre, sin garantías de nada.",
    allowFreeText: true,
    freeTextPrompt: "¿Cómo te tomas la noticia, en tus propias palabras?",
    options: [
      {
        id: "a",
        label: "Aceptar la primera oferta modesta que llegue",
        subtitle: "Seguir jugando, cueste lo que cueste",
        consequences: { club: "UD Almería", moral: -2, media: -2, patrimonio: -2000 },
        outcomeText: "Firmas con la primera que llega, sin regatear. Tu representante te mira con pena: 'Podrías haber esperado'. Tú respondes: 'Necesito jugar'.",
      },
      {
        id: "b",
        label: "Esperar una oferta mejor, aunque tarde meses sin equipo",
        subtitle: "Riesgo de quedarte mucho tiempo sin jugar",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "media",
          success: {
            text: "La espera merece la pena: un club con más ambición se fija en ti al final del mercado.",
            consequences: { club: "Real Valladolid", moral: 5, media: 2 },
          },
          fail: {
            text: "Nadie más llama. Terminas firmando meses después por un club modesto, muy por debajo de donde creías que estarías a estas alturas.",
            consequences: { club: "Sporting de Gijón", moral: -8, media: -5, patrimonio: -5000 },
          },
        },
      },
    ],
    minWeek: 70,
    maxMedia: 50,
  },
  {
    id: "vid-aceptar-la-realidad",
    category: "vida",
    title: "Hacer las paces con la carrera que tienes",
    description:
      "Una noche cualquiera te das cuenta de que la superestrella que soñabas ser a los 16 años no va a llegar. No has fracasado, pero tampoco es la carrera de las revistas. Toca decidir con qué te quedas de todo esto.",
    allowFreeText: true,
    freeTextPrompt: "Si tuvieras que explicárselo a tu yo de 16 años, ¿qué le dirías?",
    options: [
      {
        id: "a",
        label: "Encontrar orgullo en lo que sí has construido",
        subtitle: "+Moral, paz con tu propia historia",
        consequences: { moral: 10 },
        outcomeText: "Esa noche paseas por la ciudad con calma. Reconoces cada logro, cada gol, cada amigo hecho, y por primera vez en años, no sientes que te falta algo.",
      },
      {
        id: "b",
        label: "Empezar ya a pensar en tu vida después del fútbol",
        subtitle: "Mirar hacia delante en vez de hacia atrás",
        consequences: { moral: 4, patrimonio: 2000 },
        outcomeText: "Abres una libreta y escribes tres cosas que te gustaría hacer después del fútbol. Es la primera vez que piensas en ello sin que te duela.",
      },
    ],
    minWeek: 90,
    maxMedia: 58,
  },
  {
    id: "esp-espiral-alcohol",
    category: "vida",
    priority: true,
    title: "Lo que empezó como una copa de más",
    description:
      "Llevas meses sin apenas jugar y las noches de fiesta para desconectar se han convertido en algo casi diario. Tu representante te lo dice a la cara, muy serio: la gente del club ya habla de ello, y no en buen sentido.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le respondes a tu representante?",
    options: [
      {
        id: "a",
        label: "Reconocerlo y pedir ayuda profesional",
        subtitle: "El camino difícil, pero real",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "moral",
          success: {
            text: "Cuesta un mundo, pero sales adelante. Meses después vuelves a sentirte dueño de tu vida, aunque el club ya no cuenta contigo como antes.",
            consequences: { moral: 12, rel_vestuario: 5, media: 2 },
          },
          fail: {
            text: "Lo intentas, pero recaes más de una vez. El club decide no arriesgar más contigo y empieza a buscarte salida.",
            consequences: { moral: -6, media: -6, rel_entrenador: -8 },
          },
        },
      },
      {
        id: "b",
        label: "Negarlo todo, tú controlas la situación",
        subtitle: "Jugada de alto riesgo",
        consequences: { moral: -10, media: -8, rel_entrenador: -10, rel_vestuario: -5 },
        outcomeText: "Dices que lo controlas. Tu pareja te mira en silencio, sin creerte, y tu representante deja el móvil sobre la mesa con un golpe seco.",
      },
    ],
    minWeek: 60,
    maxMedia: 55,
  },
  {
    id: "fork-salto-internacional",
    category: "representante",
    priority: true,
    title: "Una liga distinta te llama",
    description:
      "Terminaste destacando y aparece la chance de dar el salto fuera de tu país por primera vez.",
    lookEvolution:
      "Same person, now with light short stubble beard, slightly more mature confident look, natural light, photorealistic athlete portrait, keep facial identity and skin tone unchanged",
    options: [
      {
        id: "a",
        label: "Quedarte donde ya eres importante",
        subtitle: "Comodidad conocida",
        consequences: { rel_aficion: 5, rel_vestuario: 4 },
        outcomeText: "Rechazas la oferta con cariño al club. La afición te lo agradece con una ovación, aunque en tu cabeza queda la pregunta: '¿Y si hubiera ido?'.",
      },
      {
        id: "b",
        label: "Aceptar el salto a Italia",
        subtitle: "Empezar de nuevo, fuera",
        consequences: { club: "Atalanta", fama: 6, moral: 3, rel_vestuario: -5 },
        outcomeText: "Aterrizas en Italia con una maleta y mil nervios. En la puerta del aeropuerto, un grupo de aficionados ya sabe tu nombre.",
      },
    ],
    minWeek: 40,
    minMedia: 62,
  },
  {
    id: "fork-gigante-europeo",
    category: "representante",
    priority: true,
    title: "Llama un gigante europeo",
    description:
      "Tu nombre ya suena en toda Europa. Un club histórico presenta una oferta que puede cambiar tu carrera para siempre.",
    lookEvolution:
      "Same person, now with a fuller well-groomed beard, confident mature elite footballer look, natural light, photorealistic athlete portrait, keep facial identity and skin tone unchanged",
    options: [
      {
        id: "a",
        label: "Quedarte como figura del proyecto actual",
        subtitle: "Ser el líder de un equipo más modesto",
        consequences: { rel_vestuario: 8, rel_aficion: 8 },
        outcomeText: "Te quedas como líder de tu proyecto. En el vestuario, un joven te mira con admiración: 'Gracias por quedarte, mister'.",
      },
      {
        id: "b",
        label: "Fichar por el gigante",
        subtitle: "Máxima exigencia, máxima exposición",
        consequences: { club: "Real Madrid", fama: 15, patrimonio: 20000, rel_vestuario: -6 },
        outcomeText: "Presentación ante miles de personas, la camiseta nueva, el escudo en el pecho. Por primera vez sientes que has llegado... y que ahora empieza lo más difícil.",
      },
    ],
    minWeek: 80,
    minMedia: 78,
  },
  {
    id: "fork-nuevo-reto",
    category: "representante",
    priority: true,
    title: "¿Ya lo ganaste todo aquí?",
    description:
      "Después de años en la élite, tu carrera corre el riesgo de volverse previsible. Aparece un reto distinto en otra liga.",
    lookEvolution:
      "Same person, veteran elite footballer look, some grey hairs starting to show in the beard, more weathered mature face, natural light, photorealistic athlete portrait, keep facial identity and skin tone unchanged",
    options: [
      {
        id: "a",
        label: "Quedarte donde ya eres leyenda",
        subtitle: "Legado asegurado",
        consequences: { rel_aficion: 10 },
        outcomeText: "Declinas la oferta. La afición lo celebra con una pancarta gigante: 'Leyenda, quédate'. Esa tarde, el presidente te regala una réplica del estadio.",
      },
      {
        id: "b",
        label: "Ir a la Premier League con el Liverpool FC",
        subtitle: "Volver a demostrar todo desde cero",
        consequences: {
          club: "Liverpool FC",
          fama: 10,
          moral: 5,
          rel_vestuario: -8,
          flags: { en_premier: true },
        },
        outcomeText: "Aterrizas en Liverpool con la lluvia fina de siempre y un abrigo que no te sirve de nada. En Anfield, el estadio entero canta tu nombre desde el primer día.",
      },
      {
        id: "c",
        label: "Ir a la Premier League con el Manchester City",
        subtitle: "Un proyecto ganador desde el primer día",
        consequences: {
          club: "Manchester City",
          fama: 10,
          moral: 5,
          rel_vestuario: -8,
          flags: { en_premier: true },
        },
        outcomeText: "Llegas a Mánchester y el club te recibe con un recibimiento más frío y profesional. Al entrar en el vestuario, te saluda un hilo de estrellas, uno a uno.",
      },
    ],
    minWeek: 130,
    minMedia: 82,
  },
  {
    id: "fork-premier-segundo-club",
    category: "representante",
    priority: true,
    title: "Otro gigante de la Premier pregunta por ti",
    description:
      "Tras consolidarte en Inglaterra, un rival directo de tu club se interesa en ti para pelear el título la próxima temporada.",
    options: [
      {
        id: "a",
        label: "Seguir en tu club actual",
        subtitle: "Lealtad al proyecto",
        consequences: { rel_aficion: 8, rel_vestuario: 5 },
        outcomeText: "Dices que sigues en tu club. Tu entrenador, al saberlo, te estrecha la mano con los ojos brillantes: 'Eso es lealtad'.",
      },
      {
        id: "b",
        label: "Cambiar de aires dentro de la Premier",
        subtitle: "Nuevo reto, mismo país",
        consequences: {
          club: "Manchester City",
          fama: 8,
          moral: 4,
          rel_aficion: -10,
          rel_vestuario: -5,
        },
        outcomeText: "Cruzas la ciudad para firmar con el eterno rival. En tu antiguo estadio, la grada te despide con una mezcla de silbidos y aplausos tímidos.",
      },
    ],
    minWeek: 150,
    requiresFlag: "en_premier",
    minMedia: 84,
  },
  {
    id: "especial-mentor-joven",
    category: "especial",
    priority: true,
    title: "El chaval que te recuerda a ti",
    description:
      "Un canterano de dieciocho años llega al primer equipo con la misma hambre que tenías tú a su edad. El club te pide, sin decirlo del todo, que lo ayudes a asentarse — sabiendo que en unos años puede quitarte el sitio.",
    options: [
      {
        id: "a",
        label: "Volcarte en enseñarle todo lo que sabes",
        subtitle: "Legado por encima del ego",
        consequences: { reputacion: 8, rel_vestuario: 6, moral: 4 },
        outcomeText: "Pasas tardes enteras enseñándole cada rincón de la profesión. Un día, el chaval te mira: 'Quiero ser como tú'. Y tú sonríes, con un nudo en la garganta.",
      },
      {
        id: "b",
        label: "Ayudarlo lo justo, sin ponérselo demasiado fácil",
        subtitle: "Sigues siendo tú quien compite por el puesto",
        consequences: { moral: 2, rel_vestuario: -2 },
        outcomeText: "Le ayudas lo justo, lo suficiente para que aprenda, no para que te quite el puesto. El chaval lo nota y entiende que aquí nadie regala nada.",
      },
    ],
    minWeek: 145,
  },

  // ── VIDA ADULTA Y CARRERA MAYOR ────────────────────────────────
  {
    id: "rep-patrocinio-marca",
    category: "representante",
    title: "Puma o Adidas",
    description:
      "Las dos marcas se pelean por tus botas. Puma ofrece un contrato menor pero con libertad total de imagen; Adidas ofrece más dinero y más exposición, pero exige exclusividad total.",
    options: [
      {
        id: "puma",
        label: "Firmar con Puma",
        subtitle: "Menos dinero, más libertad",
        consequences: { patrimonio: 15000, fama: 3 , flags: { sponsor_botas: "Puma" } },
        outcomeText: "Firmas con Puma con la libertad que querías. El director de la marca te regala un par de zapatillas hechas a medida y un apretón de manos sincero.",
      },
      {
        id: "adidas",
        label: "Firmar con Adidas",
        subtitle: "Más dinero, exclusividad total",
        consequences: { patrimonio: 35000, fama: 6, rel_representante: 3 , flags: { sponsor_botas: "Adidas" } },
        outcomeText: "Firmas con Adidas en una sala llena de directivos. Cuando sales, tienes la cuenta mucho más gorda y la sensación de que ya no te pertenece del todo tu imagen.",
      },
      {
        id: "esperar",
        label: "Esperar, todavía puede aparecer algo mejor",
        subtitle: "Apuesta a futuro",
        consequences: { moral: -1 },
        outcomeText: "Dices que esperas. Las dos marcas se miran entre sí con recelo y tu representante tamborilea con los dedos sobre la mesa.",
      },
    ],
    minWeek: 25,
  },
  {
    id: "pat-bota-firma",
    category: "representante",
    title: "Adidas quiere una bota con tu nombre",
    description:
      "Tu representante entra por videollamada casi sin aliento: Adidas quiere ir más allá del contrato de imagen y sacar un modelo de bota firmado por ti, con tu nombre grabado en el talón y edición limitada en tiendas de medio mundo.",
    imageScene:
      "Photorealistic product photo of a premium signature football boot with the player's surname embroidered on the heel, dramatic studio lighting, sponsor-style advertising shot",
    options: [
      {
        id: "a",
        label: "Involucrarte en el diseño, aunque lleve tiempo",
        subtitle: "+Patrimonio alto, +Fama",
        consequences: { patrimonio: 40000, fama: 8, moral: 4 , flags: { sponsor_botas: "Adidas", bota_firma: true } },
        outcomeText: "Pasas meses con los diseñadores, probando colores y suelas. Cuando ves la primera bota con tu nombre en el talón, algo cambia dentro de ti.",
      },
      {
        id: "b",
        label: "Firmar rápido y dejarles el diseño a ellos",
        subtitle: "Menos esfuerzo, algo menos de dinero",
        consequences: { patrimonio: 22000, fama: 4 , flags: { sponsor_botas: "Adidas", bota_firma: true } },
        outcomeText: "Firmas rápido y te olvidas. Meses después, la bota sale al mercado con un diseño que, sinceramente, no te convence del todo.",
      },
      {
        id: "c",
        label: "Rechazarlo, no quieres tu nombre en un producto",
        subtitle: "Prioridad: la imagen, no el dinero",
        consequences: { rel_representante: -2, moral: 1 },
        outcomeText: "Rechazas. Adidas se queda sin palabras unos segundos y después te dice: 'Respetamos tu decisión'. Tu representante tose para disimular.",
      },
    ],
    minWeek: 55,
  },
  {
    id: "rep-inversion-startup",
    category: "representante",
    title: "Tu representante te habla de una startup",
    description:
      'Tu representante te presenta a los fundadores de una startup tecnológica: "He visto muchos jugadores meter dinero en tonterías. Esta gente tiene cabeza, y entrar ahora, a este precio, no se va a repetir." Piden una cantidad seria para las siguientes rondas.',
    imageScene:
      "Photorealistic photo of a business magazine cover feature, the photographed man in smart casual clothing photographed in a modern tech office, generic bold headline text about a successful investment, financial press style, confident pose",
    options: [
      {
        id: "a",
        label: "Invertir fuerte, confiando en tu representante",
        subtitle: "Riesgo alto, recompensa alta",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "reputacion",
          success: {
            text: "La startup despega mucho más rápido de lo esperado y una ronda posterior multiplica tu inversión por varias veces. La prensa económica se hace eco de la operación.",
            consequences: {
              patrimonio: -18000,
              moral: 5,
              rel_representante: 4,
              flags: investmentFlag("startup_semilla", {
                name: "Startup tecnológica (ronda semilla)",
                detail: "Una participación en una startup que ha despegado. Ha multiplicado su valor varias veces.",
                amount: 18000,
                annualRate: 2.2,
              }),
            },
          },
          fail: {
            text: "La startup no llega a levantar la siguiente ronda y cierra dos años después. El dinero no vuelve.",
            consequences: {
              patrimonio: -18000,
              moral: -4,
              flags: investmentFlag("startup_semilla", {
                name: "Startup tecnológica (en pérdidas)",
                detail: "La startup no despegó. Lo invertido se ha ido desvalorizando.",
                amount: 18000,
                annualRate: -0.8,
              }),
            },
          },
        },
      },
      {
        id: "b",
        label: "Entrar solo con una cantidad simbólica",
        subtitle: "Riesgo bajo, recompensa baja",
        consequences: {
          patrimonio: -3000,
          rel_representante: 2,
          flags: investmentFlag("startup_simbolica", {
            name: "Participación simbólica en una startup",
            detail: "Una pequeña participación en una startup de un cliente de tu representante. Rentabilidad incierta, ~10 % anual.",
            amount: 3000,
            annualRate: 0.1,
          }),
        },
        outcomeText: "Pones una cantidad simbólica, casi como un gesto. Los fundadores te dan las gracias con una sonrisa, aunque se nota que esperaban más.",
      },
      {
        id: "c",
        label: "No invertir, el fútbol ya es suficiente riesgo",
        subtitle: "Conservador",
        consequences: { moral: 1 },
        outcomeText: "Dices que no, con amabilidad. Tu representante asiente: 'Prefiero un cliente prudente que uno arruinado'.",
      },
    ],
    minWeek: 40,
  },
  {
    id: "vid-lucia-conoce",
    category: "vida",
    title: "Lucía",
    description:
      "La conoces en la presentación de un patrocinador, casi por casualidad. No tiene nada que ver con el fútbol y eso, de entrada, te gusta. Seguís hablando semanas después.",
    options: [
      {
        id: "a",
        label: "Dejar que la relación avance con calma",
        subtitle: "+Moral",
        consequences: { moral: 6, flags: { pareja: "Lucía" } },
        outcomeText: "Lucía se ríe cuando le cuentas algo de tu vida que nunca le habías contado a nadie fuera del fútbol. Empieza algo que no tiene pinta de ser pasajero.",
      },
      {
        id: "b",
        label: "Mantenerlo en privado, sin prisa por definir nada",
        subtitle: "Prudente",
        consequences: { moral: 3 },
        outcomeText: "Lucía lo entiende sin preguntar más — tampoco a ella le apetece verse en ningún titular todavía.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le cuentas de tu vida cuando pregunta?",
    minWeek: 20,
  },
  {
    id: "vid-lucia-formalizar",
    category: "vida",
    title: "Un año con Lucía",
    description:
      "Lleváis un año juntos y la pregunta empieza a rondar la relación: ¿os vais a vivir juntos, ahora que tu contrato ya te lo permite? Lucía no presiona, pero tampoco lo esconde.",
    requiresFlag: "pareja",
    options: [
      {
        id: "a",
        label: "Proponerle irse a vivir juntos",
        subtitle: "+Moral, la vida se estabiliza",
        consequences: { moral: 8, patrimonio: -8000, flags: { convivencia: true } },
        outcomeText: "Lucía se le llenan los ojos antes de poder contestar con palabras. Esa misma semana ya estáis mirando pisos juntos.",
      },
      {
        id: "b",
        label: "Pedir un poco más de tiempo",
        subtitle: "La carrera sigue siendo la prioridad",
        consequences: { moral: -2 },
        outcomeText: "Lucía asiente, pero algo en su mirada se queda más frío de lo que esperabas. \"Vale. Cuando tú digas\", dice, sin sonar del todo convencida.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Cómo se lo explicas a Lucía?",
    minWeek: 45,
  },
  {
    id: "vid-embarazo",
    category: "vida",
    title: "Una noticia que lo cambia todo",
    description:
      "Lucía te lo dice una noche cualquiera, sin previo aviso: está embarazada. Te quedas en silencio unos segundos que a ella se le hacen eternos.",
    requiresFlag: "pareja",
    options: [
      {
        id: "a",
        label: "Reorganizar tu vida en torno a la familia que empieza",
        subtitle: "+Moral a largo plazo",
        consequences: { moral: 10, forma: -2, flags: { hijos: "en camino" } },
        outcomeText: "Lucía suelta el aire que llevaba conteniendo y te abraza fuerte. \"Pensaba que ibas a asustarte\", te confiesa entre risas y lágrimas.",
      },
      {
        id: "b",
        label: "Intentar que nada cambie en tu rutina como profesional",
        subtitle: "Riesgo de distancia en casa",
        consequences: { moral: 2, rel_representante: -1 },
        outcomeText: "Lucía dice que lo entiende, pero el abrazo que esperabas no llega del todo igual. Algo en casa se queda pendiente de hablar.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué es lo primero que le dices?",
    minWeek: 70,
  },
  {
    id: "vid-boda",
    category: "vida",
    title: "El día de la boda",
    description:
      "Después de años juntos, hoy te casas con Lucía. Media plantilla está entre los invitados, tu entrenador incluido, y hay más cámaras fuera esperando la salida que en la puerta de algunos estadios.",
    isMilestone: true,
    milestoneType: "boda",
    imageScene:
      "Photorealistic wedding photo of the photographed man in a formal suit, smiling, with a few teammates and a coach figure visible in the background, elegant wedding venue, warm golden hour light, joyful atmosphere",
    allowFreeText: true,
    freeTextPrompt: "¿Qué dices en tu discurso?",
    options: [
      {
        id: "a",
        label: "Un discurso emotivo delante de todos",
        subtitle: "+Moral, momento para el recuerdo",
        consequences: { moral: 12, fama: 4 },
        outcomeText: "Se te quiebra la voz a mitad del discurso y todo el salón se queda en silencio. Hasta tu entrenador, que no es de emocionarse fácilmente, aplaude de pie.",
      },
      {
        id: "b",
        label: "Una celebración discreta, sin grandes gestos",
        subtitle: "Perfil bajo, igual de especial en privado",
        consequences: { moral: 10 },
        outcomeText: "Nada de discursos ni focos — solo un brindis corto y una mirada con Lucía que dice más que cualquier palabra.",
      },
    ],
    requiresFlag: "convivencia",
    minWeek: 55,
  },
  {
    id: "fork-ascenso-division",
    category: "partido",
    priority: true,
    title: "Partido de ascenso",
    description:
      "Última jornada de la temporada regular: ganar significa subir de categoría con el club, algo que la afición lleva años esperando. El ambiente en la ciudad no habla de otra cosa desde hace una semana.",
    isMilestone: true,
    milestoneType: "ascenso",
    imageScene:
      "Photorealistic sports photography of the photographed man celebrating promotion on the pitch, teammates jumping together, fans invading the field in the background, confetti, dramatic stadium lighting",
    options: [
      {
        id: "a",
        label: "Jugar el partido de tu vida por el ascenso",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: {
            text: "¡Ascenso conseguido! La afición invade el campo al pitido final. Llevarán tu nombre en la memoria de este club durante años.",
            consequences: { fama: 14, rel_aficion: 15, moral: 12, media: 6 },
          },
          fail: {
            text: "El ascenso se escapa en el último suspiro. El vestidero queda en silencio; habrá que intentarlo otra temporada más.",
            consequences: { moral: -8, rel_aficion: -3 },
          },
        },
      },
      {
        id: "b",
        label: "Jugar con cabeza, sin forzar de más",
        subtitle: "Gestión de la presión",
        consequences: { moral: 2, rel_entrenador: 4 },
        outcomeText: "Juegas con cabeza, sin forzar. A los noventa, el estadio entero explota de alegría: el ascenso es una realidad y tú has sido parte de ello.",
      },
    ],
    minWeek: 30,
    maxMedia: 70,
  },
  {
    id: "par-mvp-partido-clave",
    category: "partido",
    priority: true,
    title: "El mejor sobre el campo",
    description:
      "Terminas el partido más importante de la temporada como la gran figura: decisivo de principio a fin. Al pitido final, el speaker del estadio anuncia tu nombre como el mejor jugador del partido.",
    isMilestone: true,
    milestoneType: "mvp",
    imageScene:
      "Photorealistic sports photography of the photographed man receiving a man-of-the-match award trophy on the pitch after a game, stadium lights, teammates applauding in the background, camera flashes",
    options: [
      {
        id: "a",
        label: "Dedicar el premio a la afición",
        subtitle: "+Relación con la afición",
        consequences: { rel_aficion: 8, fama: 6, moral: 6 },
        outcomeText: "Levantas el premio hacia la grada y el estadio entero se pone en pie. Un aficionado llora abrazado a su padre con tu camiseta puesta.",
      },
      {
        id: "b",
        label: "Dedicarlo al vestuario, fue un trabajo de equipo",
        subtitle: "+Vestuario",
        consequences: { rel_vestuario: 8, fama: 4, moral: 4 },
        outcomeText: "Dedicas el premio al vestuario. Tus compañeros te levantan en brazos en el túnel, y el capitán te dice al oído: 'Eres de los nuestros'.",
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué dices al recoger el premio?",
    minWeek: 30,
    minMedia: 62,
  },
  {
    id: "vid-hermano-pequeno",
    category: "vida",
    title: "Tu hermano pequeño quiere ser como tú",
    description:
      "Tu hermano pequeño se ha apuntado a fútbol en el colegio y no para de repetir que quiere llegar donde has llegado tú. Tus padres te piden, entre risas, que le bajes un poco las expectativas... o que le eches una mano de verdad.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices cuando te pregunta cómo hacerlo?",
    options: [
      {
        id: "a",
        label: "Involucrarte de verdad: llevarlo a entrenar contigo un día",
        subtitle: "+Moral, momento familiar bonito",
        consequences: { moral: 7, patrimonio: -500 },
        outcomeText: "Tu hermano no para de hablar del día en el coche de vuelta a casa. Tus padres te lo agradecen con una mirada que vale más que cualquier palabra.",
      },
      {
        id: "b",
        label: "Darle ánimo desde la distancia, sin más",
        subtitle: "Cariño con límites",
        consequences: { moral: 3 },
        outcomeText: "Le mandas un audio animándole. Se conforma, aunque en el fondo esperaba algo un poco más grande de ti.",
      },
    ],
    minWeek: 15,
  },
  {
    id: "vid-diego-reaparece",
    category: "vida",
    title: "Diego reaparece",
    description:
      "Años después de aquel mensaje de felicitación, Diego —tu mejor amigo de la infancia, el que dejó el fútbol cuando tú seguiste— te escribe otra vez. No pide nada al principio, solo pregunta cómo estás de verdad, no la versión de las entrevistas.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le cuentas a Diego que no le contarías a nadie más?",
    options: [
      {
        id: "a",
        label: "Abrirte del todo, como cuando erais chavales",
        subtitle: "+Moral, recuperas una amistad real",
        consequences: { moral: 8 },
        outcomeText: "Habláis hasta la madrugada, como cuando erais críos. Cuando cuelgas, te das cuenta de que echabas de menos esa conversación mucho más de lo que creías.",
      },
      {
        id: "b",
        label: "Responder con cariño pero sin bajar la guardia",
        subtitle: "Prudente",
        consequences: { moral: 3 },
        outcomeText: "Respondes con cariño, pero sin abrirte del todo. Diego lo nota y lo respeta, y hay entre los dos una distancia nueva, amable pero real.",
      },
    ],
    minWeek: 60,
  },
  {
    id: "vid-llamada-madre",
    category: "vida",
    title: "La llamada de tu madre",
    description:
      "Te llama un domingo cualquiera, sin motivo especial. Pregunta si comes bien, si duermes, si estás cuidándote... y, al final, sin poder evitarlo, si has visto lo que dicen de ti en la televisión.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué le cuentas de verdad?",
    options: [
      {
        id: "a",
        label: "Contarle todo tal cual está pasando",
        subtitle: "+Moral, te desahogas de verdad",
        consequences: { moral: 6 },
        outcomeText: "Se queda callada un momento y luego dice lo de siempre: \"Pase lo que pase, para mí ya lo has conseguido todo.\" Cuelgas con un nudo en la garganta, pero mejor.",
      },
      {
        id: "b",
        label: "Tranquilizarla y quitarle importancia a lo malo",
        subtitle: "Protegerla a ella antes que a ti",
        consequences: { moral: 3 },
        outcomeText: "\"Vale, hijo, pero sabes que puedes contarme lo que sea\", dice antes de colgar, no del todo convencida de que esté todo bien.",
      },
    ],
    minWeek: 8,
  },
  {
    id: "sel-primera-convocatoria",
    category: "especial",
    title: "La selección te llama por primera vez",
    description:
      "El seleccionador nacional marca tu número personalmente. No es una entrevista ni un rumor: es una convocatoria oficial para la próxima ventana internacional.",
    priority: true,
    isMilestone: true,
    milestoneType: "seleccion",
    options: [
      {
        id: "a",
        label: "Vivirlo como la confirmación de que vas por buen camino",
        subtitle: "+Moral, +Fama",
        consequences: { moral: 8, fama: 6 },
        outcomeText: "Cuelgas el teléfono y te quedas un minuto mirando la pared. Después llamas a casa: tu madre llora y tu padre dice que ya lo sabía.",
      },
      {
        id: "b",
        label: "Quitarle importancia hasta debutar de verdad",
        subtitle: "Cautela",
        consequences: { moral: 3, fama: 2 },
        outcomeText: "'Hasta que no debute, nada', dices con una media sonrisa. Pero esa noche, en la cama, repasas la lista de convocados una y otra vez.",
      },
    ],
    minWeek: 50,
    minMedia: 58,
  },
  {
    id: "especial-lesion-grave",
    category: "especial",
    priority: true,
    title: "La lesión que lo para todo",
    description:
      "Un mal apoyo en un partido cualquiera y sientes que la rodilla cede. La resonancia lo confirma esa misma noche: lesión de ligamento, hasta tres meses fuera. De un momento a otro, tu carrera se detiene.",
    isMilestone: true,
    imageScene:
      "Photorealistic photo of the photographed man sitting on a hospital bed or physio table wearing a knee brace, using crutches nearby, somber lighting, medical clinic setting, realistic and emotional but not graphic",
    options: [
      {
        id: "a",
        label: "Afrontar la recuperación con toda la disciplina posible",
        subtitle: "El camino largo, pero seguro",
        consequences: { forma: -15, moral: -4, rel_entrenador: 3 },
        outcomeText: "Te sientas con el fisio y aceptas el calendario sin discutir. Es una larga cuenta atrás, pero por primera vez tienes claro hacia dónde caminas.",
      },
      {
        id: "b",
        label: "Buscar una segunda opinión médica, aunque tarde más en operarte",
        subtitle: "Jugada de riesgo con tu cuerpo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: {
            text: "El segundo especialista encuentra un tratamiento alternativo que acorta el plazo. Vuelves antes de lo previsto.",
            consequences: { forma: -8, moral: 2 },
          },
          fail: {
            text: "La segunda opinión no cambia nada, y perder esas semanas retrasa aún más la vuelta.",
            consequences: { forma: -18, moral: -6 },
          },
        },
      },
    ],
    minWeek: 55,
  },
  {
    id: "premio-balon-oro",
    category: "especial",
    title: "Nominado al Balón de Oro",
    description:
      "Tu nombre está entre los finalistas del premio individual más importante del fútbol mundial. La gala es en unas semanas, en París.",
    priority: true,
    isMilestone: true,
    milestoneType: "premio",
    imageScene:
      "Photorealistic photo of the photographed man on a red carpet in a formal tuxedo, award show lighting, flashes from photographers, elegant gala atmosphere, sports awards ceremony style",
    options: [
      {
        id: "a",
        label: "Ir a la gala a jugármela",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.35,
          statModifier: "fama",
          success: {
            text: "Dicen tu nombre. Te quedas en blanco un segundo antes de levantarte: has ganado el Balón de Oro.",
            consequences: { fama: 20, moral: 15, patrimonio: 10000, media: 10, flags: { title_balon_oro: true } },
          },
          fail: {
            text: "El premio se lo lleva otro. Aplaudes de pie, sonríes para las cámaras, y por dentro ya estás pensando en el año que viene.",
            consequences: { fama: 5, moral: -4 },
          },
        },
      },
      {
        id: "b",
        label: "Restarle importancia: los títulos colectivos son lo que cuenta",
        subtitle: "Perfil bajo",
        consequences: { moral: 3, rel_vestuario: 4 },
        outcomeText: "Dices en la alfombra roja que lo colectivo vale más. Los periodistas lo aplauden... aunque en la grada alguien murmura que no te lo crees ni tú.",
      },
    ],
    minWeek: 90,
    minMedia: 90,
  },
  {
    id: "fork-titulo-liga",
    category: "partido",
    priority: true,
    title: "Se decide la Liga",
    description:
      "Última jornada. Vuestro equipo depende de sí mismo: ganar y sois campeones. El estadio lleva toda la semana sin hablar de otra cosa.",
    isMilestone: true,
    milestoneType: "titulo",
    imageScene:
      "Photorealistic sports photography of the photographed man celebrating winning a league title on the pitch, confetti falling, teammates and trophy nearby, huge crowd, dramatic stadium lighting",
    options: [
      {
        id: "a",
        label: "Pedir el balón en cada jugada decisiva",
        subtitle: "Quieres cargar con la responsabilidad",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "forma",
          success: {
            text: "¡Sois campeones de Liga! El campo se llena de gente, confeti y lágrimas. Nada se parece a esto.",
            consequences: { fama: 18, rel_aficion: 15, moral: 15, media: 8, flags: { title_liga: true } },
          },
          fail: {
            text: "El título se escapa en los últimos minutos. El vestuario queda en silencio bajo la ducha.",
            consequences: { moral: -10, rel_aficion: -3, media: -2 },
          },
        },
      },
      {
        id: "b",
        label: "Confiar en el plan del entrenador, sin forzar de más",
        subtitle: "Menos protagonismo, más disciplina táctica",
        consequences: { rel_entrenador: 6, moral: 2 },
        outcomeText: "Confías en el plan y juegas tu papel con disciplina. Cuando suena el pitido final, el estadio entero estalla en un solo grito.",
      },
    ],
    minWeek: 40,
    minMedia: 66,
  },
  {
    id: "fork-champions",
    category: "partido",
    priority: true,
    title: "Final continental",
    description:
      "La final del torneo más grande de clubes de Europa. Millones de personas en todo el mundo viendo el mismo partido que vas a jugar tú.",
    isMilestone: true,
    milestoneType: "titulo",
    imageScene:
      "Photorealistic sports photography of the photographed man lifting a large European club trophy on the pitch after winning a continental final, fireworks and confetti, massive stadium crowd, dramatic lighting",
    options: [
      {
        id: "a",
        label: "Jugar el partido de tu vida, sin miedo a fallar",
        subtitle: "Todo o nada en el escenario más grande",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "forma",
          success: {
            text: "¡Campeones de Europa! Levantas el trofeo más grande del continente. Este momento te acompaña para siempre.",
            consequences: { fama: 25, rel_aficion: 18, moral: 20, patrimonio: 15000, media: 10, flags: { title_champions: true } },
          },
          fail: {
            text: "La final se pierde en la tanda de penaltis. El silencio en el vestuario dura horas.",
            consequences: { moral: -12, fama: 5, media: -1 },
          },
        },
      },
      {
        id: "b",
        label: "Priorizar no cometer errores, jugar con la cabeza fría",
        subtitle: "Gestión de la presión",
        consequences: { moral: 3, rel_entrenador: 5 },
        outcomeText: "Juegas con la cabeza fría y cada balón lo tratas como si fuera el último. En el túnel, el capitán te agarra del brazo: 'Gracias por no temblar'.",
      },
    ],
    minWeek: 95,
    minMedia: 74,
  },
  {
    id: "sel-capitania",
    category: "especial",
    title: "El brazalete",
    description:
      "El seleccionador te reúne aparte del grupo antes del próximo partido. Quiere que seas tú quien lleve el brazalete de capitán a partir de ahora.",
    priority: true,
    isMilestone: true,
    milestoneType: "capitania",
    options: [
      {
        id: "a",
        label: "Aceptar y asumir el liderazgo de lleno",
        subtitle: "Responsabilidad total",
        consequences: { moral: 8, fama: 8, rel_aficion: 6 , flags: { capitan_seleccion: true } },
        outcomeText: "Te colocan el brazalete en el túnel y el vestuario guarda silencio un segundo. Después, uno a uno, todos te chocan la mano.",
      },
      {
        id: "b",
        label: "Aceptar, pero liderar desde el ejemplo y no desde los discursos",
        subtitle: "Perfil bajo",
        consequences: { moral: 5, rel_vestuario: 6 , flags: { capitan_seleccion: true } },
        outcomeText: "Aceptas, pero sin discursos. El primer día de concentración, no dices una palabra de más, y sin embargo todos te siguen en el primer rondo.",
      },
    ],
    minWeek: 100,
    minMedia: 72,
  },
  {
    id: "sel-mundial",
    category: "especial",
    title: "Arranca el Mundial",
    description:
      "Se abre el Mundial y tu nombre está en la lista final. Maletas, concentración, la camiseta, el himno: todo lo que has construido se mide ahora también aquí. Cada partido va a contar, y el país entero está pendiente.",
    allowFreeText: true,
    freeTextPrompt: "¿Qué dices en la rueda de prensa previa al torneo?",
    options: [
      {
        id: "a",
        label: "Salir a jugar cada partido a todo o nada",
        subtitle: "Asumir riesgos para liderar al equipo",
        consequences: { fama: 2, moral: 2, flags: { torneo_activo: "mundial", torneo_style: "riesgo" } },
        outcomeText: "Lo dices sin vacilar ante las cámaras: no vas a especular. Los titulares del día siguiente son tuyos.",
      },
      {
        id: "b",
        label: "Jugar con la cabeza, priorizando no arriesgar de más",
        subtitle: "Gestión de la presión",
        consequences: { moral: 3, reputacion: 2, flags: { torneo_activo: "mundial", torneo_style: "cabeza" } },
        outcomeText: "Tu respuesta es serena y medida. El seleccionador asiente desde la mesa: es justo lo que necesitaba oír.",
      },
      {
        id: "c",
        label: "Asumir el papel de líder del vestuario",
        subtitle: "Sostener al grupo, no solo a ti mismo",
        consequences: { rel_vestuario: 3, moral: 2, flags: { torneo_activo: "mundial", torneo_style: "lider" } },
        outcomeText: "Hablas del grupo antes que de ti. En el vestuario, esa misma tarde, alguien repite tus palabras en voz alta.",
      },
    ],
    minWeek: 30,
  },
  /**
   * Guiños a leyendas reales sin nombrarlas ni recrear su cara — pedido
   * explícito del usuario tras descartar usar nombres/caras casi
   * idénticas a jugadores reales (riesgo de derecho a la imagen: ver
   * conversación de producto). El gancho vive en el TEXTO: la escena
   * describe rasgos y contexto reconocibles (acento, gesto, cifra de
   * partidos) sin decir nunca quién es, y es el propio jugador quien hace
   * la broma al compartir la tarjeta. Solo "el capitán eterno" lleva
   * imagen (genérica, sin rasgos identificables de nadie real); "la
   * comparación" es pura prensa, sin imagen, precisamente para no correr
   * ningún riesgo visual.
   */
];
