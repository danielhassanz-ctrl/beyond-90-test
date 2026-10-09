/**
 * Mercado y contratos con más sabor: la renovación que se complica, la oferta que llega por un
 * canal absurdo, el club que te sigue con un ojeador en una gabardina, el agente que te regala una
 * corbata antes de contarte una mala noticia. Con ventana de fichajes abierta y varias marcas
 * que vuelven más adelante (la cláusula, la promesa, la corbata).
 */
import { S, o, th } from "../dsl";
import type { BankScene } from "../types";

export const MERCADO4: BankScene[] = [
  S("m4-ojeador", "mercado", { minAge: 17, market: "abierta", clubTurns: [3, 400], notFlags: ["m4_ojeador"] }, "vida",
    "Un ojeador con gabardina te sigue durante tres partidos sin disimular",
    "Primero lo ves en la grada, con un cuaderno. Luego, a la puerta del entrenamiento, con una cámara de mano. Después, en la cafetería donde desayunas, leyendo un periódico del revés. Es un hombre alto, con un abrigo largo y una expresión de espía de película. El portero, que lo ha visto, te susurra: «Es del Dortmund. O de la policía». Cuando salgas, lo encontrarás en tu portal.",
    [
      o("a", "Acercarte con una sonrisa y ofrecerle un café", "Dar la bienvenida", { moral: 4, reputacion: 3, flags: { m4_ojeador: "cafe" } }, "El ojeador, descubierto, se ruboriza. «Me has pillado», murmura. Charláis una hora. Te cuenta que lo que más valora de un jugador es cómo trata al utillero. Te pregunta por el tuyo. Hay conversaciones que son entrevistas disfrazadas."),
      o("b", "Hacerte el distraído y jugar mejor que nunca", "Dejar que hable el campo", { forma: 2, moral: 3, rel_entrenador: 2, flags: { m4_ojeador: "campo" } }, "Esa tarde, tu partido es una obra maestra. Marcas, asistes, presionas. Al acabar, el ojeador aplaude desde la grada y se marcha sin hablar. Una semana después, tu agente recibe una llamada interesante."),
      o("c", "Avisar a tu agente para que investigue quién es", "Pedir información", { rel_representante: 3, moral: 1, flags: { m4_ojeador: "agente" } }, "Tu agente, tras tres llamadas, descubre que es un ojeador independiente que trabaja para dos clubes. «Es de los buenos», dice. «Si te ficha, será porque le caes bien»."),
    ]),
  S("m4-corbata", "mercado", { minAge: 17, market: "abierta", clubTurns: [3, 400], notFlags: ["m4_corbata"] }, "representante",
    "Tu agente te regala una corbata antes de contarte que no hay ofertas",
    "Es un detalle raro: una corbata de seda, azul marino, con un pequeño escudo bordado. Tu agente, de pie en la puerta de tu casa, la entrega con una solemnidad de ofrenda. «Te sentará bien para la próxima rueda de prensa», dice. Hay una pausa. «Y, por cierto, el mercado ha estado más flojo de lo previsto». Te quedas mirando la corbata. Es una disculpa con forma de prenda.",
    [
      o("a", "Agradecerle el gesto y preguntarle cómo vamos a trabajar el resto del mercado", "Mantener la calma", { rel_representante: 3, moral: 1, flags: { m4_corbata: "calma" } }, "Se sienta en tu sofá, con una carpeta, y repasáis los próximos pasos. Al final, dice: «Eres el cliente más tranquilo que tengo». «Y tú, el agente con peores noticias y mejores corbatas», respondes."),
      o("b", "Quejarte por la falta de ofertas y pedir más movimiento", "Exigir resultados", { rel_representante: -2, moral: -2, flags: { m4_corbata: "queja" } }, "Tu agente baja la mirada. «Haré lo que pueda». Esa semana, llama a veinte contactos. A los diez días, aparece una oferta tímida. No la quieres. Pero ya sabes quién trabaja."),
      o("c", "Ponerte la corbata, hacerte un selfi y mandarle la foto con un «gracias»", "Quitar peso con humor", { rel_representante: 4, moral: 3, flags: { m4_corbata: "selfi" } }, "El selfi se convierte en un meme entre vosotros. Cada vez que cierra un trato, te lo manda con un emoji de corbata. Es vuestra manera de decir «hoy sí»."),
    ]),
  S("m4-renovar-dudas", "mercado", { minAge: 19, roles: ["titular", "rotacion"], clubTurns: [8, 400], notFlags: ["m4_renovar"] }, "representante",
    "El club tarda tanto en renovarte que empiezas a pensar que no te quieren",
    "Lleva tres meses sin llamar. En el despacho del director, las puertas están cerradas. En la prensa, empiezan a especular con tu salida. Tu agente, con voz de funeral, dice: «Es normal. Pero esta vez, tarda demasiado». Una mañana, en el pasillo, el presidente te saluda con una sonrisa vaga: «Ya hablaremos». Esas tres palabras te taladran la cabeza. En casa, empiezas a repasar las posibilidades.",
    [
      o("a", "Pedir una reunión directa con el director para aclarar todo", "Poner las cartas sobre la mesa", { rel_entrenador: 1, reputacion: 3, moral: 2, flags: { m4_renovar: "reunion" } }, "El director, algo incómodo, te explica que hay un problema de presupuesto. «Te queremos, pero hay que ordenar las cuentas». Te propone un plazo. A las dos semanas, la renovación está firmada. Hablar es más barato que especular."),
      o("b", "Dejar que tu agente lo lleve y no pensar más", "Confiar en el proceso", { moral: 0, rel_representante: 2, flags: { m4_renovar: "agente" } }, "Pasa un mes. Una tarde, tu agente te llama: «Está hecho». Firmas sin discutir un euro. A veces, la tranquilidad compra más que la presión."),
      o("c", "Filtrar a la prensa que tienes ofertas para presionar", "Jugar la carta mediática", { rel_aficion: -2, reputacion: -3, rel_representante: -1, moral: 2, flags: { m4_renovar: "filtro" } }, "El titular sale al día siguiente. La afición, dolida, te silba en el siguiente partido. El club, sorprendido, acelera la negociación. Renuevas, pero con un precio emocional: la grada no olvida."),
    ]),
  S("m4-promesa-clausula", "mercado", { minAge: 20, fama: [50, 100], clubTurns: [6, 400], notFlags: ["m4_promesa"] }, "representante",
    "Un presidente te promete una cláusula de salida «cuando llegue una oferta de verdad»",
    "Fue en un almuerzo, sin papeles, entre un plato de pescado y una copa de vino. «Tranquilo —dijo el presidente—. Si llega un grande, te dejo marchar. Palabra». Tu agente, a tu lado, frunció el ceño. «Eso conviene escribirlo». El presidente, con una sonrisa, golpeó la mesa con la palma abierta: «Entre caballeros». Ahora, meses después, esa frase pesa como un contrato invisible.",
    [
      o("a", "Pedirle que lo ponga por escrito y firmarlo ambos", "Formalizar", { rel_representante: 3, reputacion: 2, moral: 1, flags: { m4_promesa: "escrito" } }, "El presidente, algo ofendido, lo firma. «Qué poca fe tienes». Meses después, cuando llegue una oferta, el papel será el que decida. A veces, la confianza necesita tinta."),
      o("b", "Confiar en su palabra y no pedirle nada más", "Fiarte de un caballero", { moral: 2, rel_aficion: 2, flags: { m4_promesa: "palabra" } }, "Pasa un año. Cuando llega una oferta, el presidente pone mil excusas. «No me acuerdo de haber dicho eso», murmura. Te quedas helado. Aprendes que un apretón de manos vale lo que valga quien lo da.", { thread: th("promesa", "el presidente", "Te prometió una cláusula de salida y nunca la escribió.") }),
      o("c", "Pedir a tu agente que negocie otras garantías a cambio", "Buscar otro camino", { rel_representante: 4, patrimonio: 2500, flags: { m4_promesa: "agente" } }, "Tu agente consigue una mejora salarial y un aumento de la prima de fichaje por futura venta. El presidente, aliviado, ve que no habrá guerra. Y tú, que ganas algo más seguro, duermes mejor."),
    ]),
  S("m4-mensaje-mal", "mercado", { minAge: 17, market: "abierta", clubTurns: [3, 400], notFlags: ["m4_mensaje"] }, "prensa",
    "Un mensaje tuyo sobre un club rival se filtra por error al chat del equipo",
    "Fue un fallo de dedo: querías mandárselo a tu agente y lo mandaste al grupo del vestuario. «Si me llama el Barça, me voy mañana. Este club ya no da más de sí». Veinticinco compañeros lo han leído. Unos ríen, otros fruncen el ceño. El capitán, desde su móvil, escribe una sola palabra: «¿?». Tu pulgar tiembla sobre el teclado. Tu cara, en el espejo, es la de un delincuente.",
    [
      o("a", "Pedir perdón al grupo y aclarar que fue un error, con humor", "Dar la cara", { rel_vestuario: 3, reputacion: 2, moral: 1, flags: { m4_mensaje: "perdon" } }, "Escribes: «Perdón. Era para mi agente. Aun así, mis disculpas a las gallinas del gallinero». Hay carcajadas. El capitán, sin embargo, te mira en el entrenamiento con una expresión dura. «Hablaremos luego», murmura."),
      o("b", "Borrar el mensaje y hacer como si no hubiera pasado nada", "Negar la evidencia", { rel_vestuario: -4, moral: -2, flags: { m4_mensaje: "borro" } }, "Alguien ya había hecho una captura. El mensaje circula por el vestuario durante semanas. Tu credibilidad se resiente. «El que se quería ir», te llaman en voz baja."),
      o("c", "Reconocer la verdad y decir que, en el fondo, piensas en tu futuro", "Ser honesto", { rel_vestuario: -2, reputacion: 3, moral: 1, flags: { m4_mensaje: "verdad", quiere_salir: true } }, "Lo explicas con calma. «Es verdad. Estoy pensando en el futuro. Pero hoy, sigo aquí». El vestuario respeta la franqueza, aunque no la comparta. Tu relación con el capitán, sin embargo, se enfría."),
    ]),
  S("m4-cedido-vuelta", "mercado", { minAge: 17, maxAge: 24, market: "abierta", clubTurns: [1, 6], notFlags: ["m4_cedido"] }, "vida",
    "Vuelves de una cesión y descubres que tu taquilla ya es de otro",
    "La encuentras con un nombre distinto en la placa, una camiseta que no es la tuya y una taza con el escudo de un club que ni conoces. El utillero, con cara de culpa, murmura: «Te la cambiaron. Mala suerte». Dentro, tu foto de la infancia sigue pegada con un trozo de celo. La han dejado ahí por error o por respeto. Alguien, desde el fondo, tose.",
    [
      o("a", "Recoger tus cosas con una sonrisa y pedir un hueco nuevo", "Empezar de cero", { rel_vestuario: 4, moral: 3, flags: { m4_cedido: "cero" } }, "Te dan una taquilla junto a la ventana. La estrenas con un cartel de «Reservado». Los compañeros, al verlo, se ríen. Es el comienzo de un nuevo vínculo con un viejo club."),
      o("b", "Quejarte al míster por el trato y pedir explicaciones", "Reclamar", { rel_entrenador: -2, moral: 1, flags: { m4_cedido: "queja" } }, "El míster, de brazos cruzados, te dice: «Aquí nadie tiene nada asegurado». Es una frase fría pero cierta. Te llevas la taquilla nueva con un sabor agrio."),
      o("c", "Preguntarle al nuevo dueño de tu taquilla cómo se llama y presentarte", "Ser un buen compañero", { rel_vestuario: 6, reputacion: 3, moral: 3, flags: { m4_cedido: "presento" } }, "Se llama Teo, es un canterano de diecinueve años y se ruboriza al verte. «Perdón, no sabía». Ríes: «Está bien, la cuidas». Os hacéis amigos esa misma tarde."),
    ]),
  S("m4-traspaso-tardio", "mercado", { minAge: 17, market: "abierta", turn: [2, 2], clubTurns: [3, 400], notFlags: ["m4_tardio"] }, "representante",
    "En el último día del mercado te llega una oferta que no puedes ignorar y no puedes aceptar",
    "Son las 23:15 y suena el teléfono. Es tu agente, con la voz atropellada. «Hay una oferta increíble. Pero hay un problema: no podemos firmar sin el visto bueno de tu club, y el presidente no coge el teléfono». Miras el reloj. Quedan cuarenta y cinco minutos. En tu cabeza, un mapa de posibilidades, sustos y arrepentimientos. En tu piso, el silencio es total. Tu agente, al otro lado, espera una decisión.",
    [
      o("a", "Llamar tú mismo al presidente y pedirle que te escuche", "Dar el paso personal", { moral: 3, rel_representante: 2, flags: { m4_tardio: "llamo" } }, "Marcas cinco veces. A la sexta, descuelga. «Dime», dice, con voz dormida. Le cuentas todo. Tras un silencio larguísimo, murmura: «Déjame que lo piense… no, que lo firmen». El trato se cierra a las 23:57."),
      o("b", "Dejar que tu agente lo intente solo y esperar con las uñas mordidas", "Delegar", { rel_representante: 2, moral: -2, flags: { m4_tardio: "espero" } }, "A las doce, el mercado cierra. Tu agente llama: «Casi». «¿Casi qué?», preguntas. «Casi lo hacemos». Te quedas sin respuesta. Esa noche no duermes."),
      o("c", "Decirle a tu agente que lo dejáis estar: no quieres forzar nada", "Renunciar con calma", { moral: 1, rel_aficion: 3, rel_entrenador: 2, flags: { m4_tardio: "renuncio" } }, "Esperas al cierre. Al día siguiente, el míster te llama: «Me ha dicho el presidente que querías irte». «No», dices. «Me quedo». Hay un silencio. Luego, un apretón de manos que dura cinco segundos más de lo normal."),
    ]),
];
