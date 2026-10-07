/**
 * Pareja: cómo se conoce a alguien (cuatro historias distintas, de tres
 * escenas cada una, que acaban —o no— en pareja) y cómo se vive una vez que la
 * hay: suegros, mudanza, viajes, celos, trabajo propio, crisis, ruptura y lo
 * que viene después. Todo cambia el estado de verdad: la bandera "pareja"
 * aparece y desaparece, y el resto del juego (IA, segunda vida, escenas)
 * lo nota.
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const SOLO: BankWhen = { notFlags: ["pareja"], minAge: 18, maxAge: 40 };

export const PAREJA: BankScene[] = [
  // ───── Conocer a alguien: Carla (un mensaje) ─────
  S("ro-carla-mensaje", "pareja", { ...SOLO, fama: [20, 100], notFlags: ["pareja", "ro_carla_no"] }, "vida",
    "Una desconocida con buen gusto te escribe",
    "Llega un mensaje privado de una chica llamada Carla: no pide un autógrafo, ni una foto, ni una camiseta. Te dice que vio tu partido del domingo, que no entiende de fútbol pero que se rio con tu forma de reaccionar a la tarjeta amarilla. Hay un emoji de un perro. Y una última frase: «Si algún día te apetece un café, lo pagas tú».",
    [
      o("a", "Contestarle con un chiste y quedar a tomar algo", "Dar el paso", { moral: 4, fama: 1 }, "Le escribes tres líneas con un chiste sobre tu amarilla. Contesta en dos minutos. En cuatro, ya tenéis cita: un café de barrio, el sábado a las once."),
      o("b", "Contestarle educadamente y dejarlo ahí", "Ser prudente", { moral: 0 }, "Le agradeces el mensaje con una frase amable. Carla responde con un emoji de pulgar y un «cuando quieras». No vuelve a escribirte."),
      o("c", "Ignorar el mensaje: no es el momento", "Mantener el foco", { forma: 1, moral: -1 }, "Dejas el mensaje sin contestar. A los tres días, sin querer, lo vuelves a abrir y lo cierras otra vez. Algo, muy dentro, se queda en pausa."),
    ]),
  S("ro-carla-cafe", "pareja", { after: [after("ro-carla-mensaje", "a", 1, 8)], ...SOLO }, "vida",
    "El café con Carla",
    "Carla lleva una gorra, un jersey enorme y el pelo recogido sin cuidado. Pide un cortado con azúcar y una tostada con tomate, y mientras la prepara el camarero te mira con cara de ver un fantasma. Hablan de todo menos de fútbol: de su trabajo en una editorial, de su abuela con el móvil, de un viaje a Lisboa que hizo con dos euros. A los veinte minutos, has olvidado quién eres.",
    [
      o("a", "Proponerle otra cita esa misma tarde", "Lanzarte", { moral: 5, fama: 1, flags: { ro_carla: "cita" } }, "Le propones ir a ver el atardecer a un mirador. Carla sonríe. «Dos euros», dice, tendiéndote la mano. «Es lo que tengo para el autobús». Y se ríe de tu cara."),
      o("b", "Dejar que lo proponga ella y esperar", "Ir despacio", { moral: 2, flags: { ro_carla: "cita" } }, "Terminas el café con calma. Cuando te levantas, Carla te mira y dice: «Mañana hay un mercadillo». Y ya está: has sido invitado."),
      o("c", "Quedar en escribiros y dejarlo en el aire", "Sin presión", { moral: -1, flags: { ro_carla_no: true } }, "Os despedís con un abrazo cordial. Los mensajes se van espaciando, hasta que un día dejáis de escribiros sin que nadie lo decida."),
    ]),
  S("ro-carla-formal", "pareja", { after: [after("ro-carla-cafe", undefined, 4, 24)], flags: ["ro_carla"], ...SOLO }, "vida",
    "Carla quiere saber qué sois",
    "Lleváis un par de meses viéndoos sin etiqueta. Hoy, en la terraza de siempre, Carla deja la taza sobre el plato con mucha delicadeza y dice: «Necesito saber una cosa. Lo digo ya y luego pedimos otra tostada». Se cruza de brazos. No hay nada más importante en el mundo ahora mismo que esa pregunta.",
    [
      o("a", "Decirle que sí, que quieres estar con ella", "Dar el paso definitivo", { moral: 9, fama: 1, rel_vestuario: 1, flags: { pareja: "Carla" } }, "Se lo dices sin florituras, con la voz un poco rota. Carla se ríe, llora un poco y dice: «Qué bobo». Pide otra tostada. Esa noche, el móvil no deja de vibrar con mensajes suyos."),
      o("b", "Pedirle un poco más de tiempo", "Ser sincero", { moral: -1 }, "Se lo dices con cariño. Carla lo entiende, pero sus ojos se apagan un poco. Los mensajes continúan, aunque menos. Algo se ha enfriado."),
      o("c", "Decirle que ahora no puedes comprometerte", "Cortar con elegancia", { moral: -3, flags: { ro_carla_no: true } }, "Se lo dices con respeto. Carla asiente muy despacio, paga su parte del café y se va sin dramas. Hay despedidas que duelen más cuanto más limpias son."),
    ]),
  // ───── Irene (una cita a ciegas) ─────
  S("ro-irene-ciegas", "pareja", { ...SOLO, notFlags: ["pareja", "ro_irene_no"] }, "vida",
    "Tu hermana te organiza una cita a ciegas",
    "Es el tercer domingo que tu hermana pequeña te lleva a comer y el postre llega con un nombre: «Se llama Irene, trabaja de arquitecta, ha leído tres libros tuyos». «Yo no tengo libros», dices. «Pues los ha leído igual», responde tu hermana con una sonrisa que no admite recursos. La cita es mañana a las nueve.",
    [
      o("a", "Ir a la cita con buena disposición", "Darle una oportunidad", { moral: 3, flags: { ro_irene: "cita" } }, "Vas con camisa limpia y una colonia que no sabes cuándo compraste. Irene, que no sabe de fútbol, te pregunta por tus primeros recuerdos con un balón. Te quedas sin respuesta durante unos segundos."),
      o("b", "Inventarte una excusa para no ir", "Evitar la presión", { moral: -1, flags: { ro_irene_no: true } }, "Dices que tienes una concentración inventada. Tu hermana te manda un audio de ocho minutos que empieza con «¿en serio?» y termina con «ya hablaremos»."),
      o("c", "Ir con tu hermana de acompañante", "Un plan loco", { moral: 4, rel_vestuario: 0, flags: { ro_irene: "cita" } }, "Tu hermana aparece en el restaurante en la mesa de al lado, con un periódico del revés. Irene se ríe tanto que se atraganta con el agua. Aquello rompe cualquier hielo."),
    ]),
  S("ro-irene-obra", "pareja", { after: [after("ro-irene-ciegas", undefined, 2, 12)], flags: ["ro_irene"], ...SOLO }, "vida",
    "Irene te enseña su obra",
    "Irene te cita un sábado por la mañana en una obra, con casco, chaleco amarillo y una sonrisa de niña. Te enseña una vivienda en la que lleva dos años trabajando: «Aquí iba un tabique y lo quité. Aquí iba una ventana y la hice más grande». No te pregunta por fútbol ni una vez. Y por primera vez en meses, escuchas a alguien con los ojos abiertos de verdad.",
    [
      o("a", "Admirar su trabajo y preguntar cosas", "Interesarte en serio", { moral: 5, reputacion: 1, flags: { ro_irene: "obra" } }, "Preguntas por vigas, por luz natural, por qué elige un tipo de madera. Irene te mira con una media sonrisa: «Nadie me había preguntado eso». El casco te queda de pena y no importa."),
      o("b", "Hacerte el graciosillo con el casco", "Humor", { moral: 3, flags: { ro_irene: "obra" } }, "Te pones el casco al revés y haces un discurso inaugural. Irene se ríe a carcajadas. «Eres un caso», dice. Y a ti te suena a un cumplido."),
      o("c", "Sacar el móvil y mirar los mensajes", "Distraerte", { moral: -2, flags: { ro_irene_no: true } }, "Te encuentras mirando una conversación sin importancia en plena obra. Irene guarda sus cosas en silencio. Cuando te despides, dice «ya hablaremos». Y no lo harás."),
    ]),
  S("ro-irene-formal", "pareja", { after: [after("ro-irene-obra", undefined, 3, 20)], flags: ["ro_irene"], ...SOLO }, "vida",
    "Irene te da la llave",
    "En la puerta del piso que reformó para sí misma, Irene te da una llave pequeña con un llavero en forma de casco amarillo. «No es una declaración. Es que me cansé de abrirte yo la puerta». Se muerde el labio. En el fondo del salón hay una caja de cartón con tu nombre, medio vacía, y una nota: «Tus cosas, por si aceptas».",
    [
      o("a", "Aceptar la llave con una sonrisa", "Ir en serio", { moral: 9, rel_vestuario: 1, flags: { pareja: "Irene" } }, "Coges la llave y la guardas en el bolsillo del pecho. Esa noche cocináis juntos una pasta que sale mal. Lo recordarás como una de las mejores cenas de tu vida."),
      o("b", "Aceptar la llave pero pedir ir despacio", "Con calma", { moral: 4, flags: { pareja: "Irene" } }, "Te quedas con la llave pero le dices que necesitas tiempo. Ella asiente sin dramas: «Aquí estará». Y la llave, en tu llavero, hace un ruido nuevo cada vez que caminas."),
      o("c", "Devolverla: no estás preparado", "Ser honesto", { moral: -3, flags: { ro_irene_no: true } }, "Se la devuelves con cariño. Irene la guarda sin una palabra y la mira un rato. «Cuando quieras», dice. Pero ambos sabéis que no hay segunda llave."),
    ]),
  // ───── Paula (en el club) ─────
  S("ro-paula-nutri", "pareja", { ...SOLO, clubTurns: [4, 400], notFlags: ["pareja", "ro_paula_no"] }, "vida",
    "La nutricionista del club te lleva la contraria",
    "Paula llegó hace un mes al club y ya ha vaciado los armarios de la sala de descanso de bollería industrial. Te ha pasado un plan de comidas con nombre y apellidos que parece escrito por una profesora de latín. Hoy te pilla comiendo una napolitana y levanta una ceja con mucha elegancia. «Se come lo que dice el plan», dice. «Y luego, si te portas bien, tomas un café conmigo».",
    [
      o("a", "Tirar la napolitana y aceptar el café", "Ser buen paciente", { forma: 1, moral: 4, flags: { ro_paula: "cafe" } }, "Tiras la napolitana con una teatralidad que le arranca una carcajada. El café es de máquina y tibio, pero la conversación es de las que cuestan terminar."),
      o("b", "Seguir con la napolitana y retarla con humor", "Desafiarla", { moral: 3, forma: -1, flags: { ro_paula: "cafe" } }, "Te comes la napolitana con una lentitud ceremonial. Paula, cruzada de brazos, te anota la sanción: «Una sesión extra de gimnasio, y cena con verdura». Se te escapa una risa."),
      o("c", "Decirle que te dejes de tonterías: tú sabes lo que haces", "Cortar el rollo", { moral: -2, flags: { ro_paula_no: true } }, "Se lo dices con sequedad. Paula se va con una expresión neutra y un «de acuerdo». Desde entonces, tu plan de comidas llega por correo, sin emoticonos."),
    ]),
  S("ro-paula-cena", "pareja", { after: [after("ro-paula-nutri", undefined, 3, 18)], flags: ["ro_paula"], ...SOLO }, "vida",
    "Paula cocina en tu casa",
    "Llega con tres bolsas de tela, un delantal y una lista de ingredientes que has ido a comprar tú con una puntualidad militar. En media hora, tu cocina huele a algo que nunca había olido: limpieza, hierbas y calma. Paula te manda cortar cebolla sin llorar y tú lloras con dignidad. «Esto no es un plan de comidas. Es una cena», dice. «No se cuenta».",
    [
      o("a", "Ayudarla en la cocina y brindar con agua con gas", "Entregarte", { moral: 6, forma: 1, flags: { ro_paula: "cena" } }, "Cortáis, remováis, probáis. La cena dura tres horas y en ningún momento miras el móvil. Al despedirte, Paula te da un beso en la mejilla que dura un segundo más."),
      o("b", "Mirar mientras ella cocina y charlar", "Dejarte cuidar", { moral: 4, flags: { ro_paula: "cena" } }, "Te sientas en la encimera con una copa mientras ella canta bajito sobre el hornillo. Es la primera vez que alguien cocina para ti en mucho tiempo."),
      o("c", "Recibir una llamada de tu agente y cortar la velada", "El trabajo es el trabajo", { rel_representante: 2, moral: -2, flags: { ro_paula_no: true } }, "Atiendes una llamada de media hora. Cuando vuelves, Paula ha recogido y lo ha dejado todo en tuppers etiquetados. «Que lo disfrutes», escribe una nota. Y se va."),
    ]),
  S("ro-paula-formal", "pareja", { after: [after("ro-paula-cena", undefined, 3, 20)], flags: ["ro_paula"], ...SOLO }, "vida",
    "Paula te dice que se quedaría",
    "Han pasado tres meses y todavía no os habéis dicho nada. Una mañana, mientras te prepara el zumo, Paula suelta con voz bajita: «Me han ofrecido un trabajo fuera del club. Sería un buen paso para mí. Pero si me pides que me quede, me quedo». Deja el vaso con cuidado. «Es la única vez que lo diré».",
    [
      o("a", "Pedirle que se quede contigo", "Decirle que la quieres cerca", { moral: 9, flags: { pareja: "Paula" } }, "Se lo pides sin pensar. Paula se queda inmóvil un segundo, sonríe y dice: «Entonces, claro». Esa tarde rechaza el trabajo. Tú ni sabes cuánto has ganado ni cuánto has hecho perder."),
      o("b", "Decirle que haga lo mejor para ella", "Ser generoso", { moral: -2, reputacion: 2, flags: { ro_paula_no: true } }, "Se lo dices con la voz dulce y las manos frías. Paula asiente con los ojos húmedos y acepta el trabajo. Os despedís en la puerta del club, sin escándalo, con una promesa de llamarse que ambos sabéis difícil."),
      o("c", "Callar y que decida ella", "No mojarte", { moral: -3, flags: { ro_paula_no: true } }, "Te quedas en silencio. Ella espera. Pasan treinta segundos eternos. Después acepta el trabajo. En su último día, deja una nota en tu taquilla: «Debiste decir algo»."),
    ]),
  // ───── Sofía (vacaciones) ─────
  S("ro-sofia-playa", "pareja", { ...SOLO, turn: [1, 2], notFlags: ["pareja", "ro_sofia_no"] }, "vida",
    "Una conversación en la playa que dura toda la tarde",
    "Estás en la orilla con un libro que no lees y un gorro de pescador que te ha prestado tu primo. Una chica llamada Sofía se sienta a tu lado para recoger una concha, y se queda tres horas hablando de las mareas, de su gato y de sus clases de natación. No te pregunta quién eres. Y tú, por primera vez en meses, no tienes ganas de aclararlo.",
    [
      o("a", "Seguir con la conversación y proponerle cenar", "Aprovechar el momento", { moral: 6, flags: { ro_sofia: "playa" } }, "Os vais a cenar a un chiringuito donde el pescado cuesta menos que la cerveza. Cuando te preguntan qué haces, dices «jugar a fútbol, un poco», y ella te mira con una sonrisa que no sabe nada."),
      o("b", "Despedirte con cordialidad al caer la tarde", "Prudencia", { moral: 1 }, "Recoges la toalla con una sonrisa. «Ha sido un placer», dices. Sofía se queda con la concha en la mano y una mirada que dice «un placer a medias»."),
      o("c", "Decirle quién eres para ver cómo reacciona", "Poner a prueba", { moral: -1, flags: { ro_sofia_no: true } }, "Se lo cuentas con la voz más natural posible. Sofía asiente y dice: «Ah». Después, empieza a mirarte distinto, con un respeto que no te gusta. Se acabó la conversación."),
    ]),
  S("ro-sofia-carta", "pareja", { after: [after("ro-sofia-playa", "a", 2, 14)], ...SOLO }, "vida",
    "Sofía te escribe una carta de las de antes",
    "En el buzón del club hay un sobre con un matasellos de un pueblo de la costa. Es una carta escrita a mano, con una letra redonda y una concha pegada con celo en la esquina. «No sé si has pensado en mí. Yo sí. He pensado dos o tres veces que lo mejor sería no escribirte. Pero soy muy cabezota». Hay un número de teléfono, escrito despacio.",
    [
      o("a", "Llamarla esa misma noche", "No esperar", { moral: 8, flags: { ro_sofia: "carta" } }, "Marcas el número con las manos temblorosas. Sofía contesta al primer tono. «Sabía que eras de los que llaman», dice. Y se pasan tres horas hablando de nada."),
      o("b", "Contestarle con otra carta escrita a mano", "Un gesto bonito", { moral: 6, reputacion: 1, flags: { ro_sofia: "carta" } }, "Le escribes cuatro líneas. Tardas tres horas. Sofía responde con otra carta y un cartón con un dibujo de un faro. Es una conversación lenta, de las que no existen ya."),
      o("c", "Guardar la carta sin contestar", "Dejarlo pasar", { moral: -2, flags: { ro_sofia_no: true } }, "La carta se queda en la gaveta de la mesilla. A veces la lees, a veces no. Con los años, la concha pierde el brillo, pero no el recuerdo."),
    ]),
  S("ro-sofia-formal", "pareja", { after: [after("ro-sofia-carta", undefined, 4, 24)], flags: ["ro_sofia"], ...SOLO }, "vida",
    "Sofía viene a verte a un partido",
    "La buscas con la mirada en la grada antes del pitido inicial y la encuentras en la quinta fila, con una bufanda del club que le queda enorme y la cara de quien no entiende nada de lo que pasa. Cuando suena el himno, canta un verso equivocado con total convicción. Cuando marcas, se levanta tarde, aplaude despacio y mira a su vecino de asiento: «Ese es el mío».",
    [
      o("a", "Mirarla tras el gol y dedicarle una celebración", "Un gesto público", { moral: 9, fama: 2, flags: { pareja: "Sofía" } }, "Corres hacia la grada con la mano en el corazón. Sofía, avergonzada y feliz, esconde la cara entre las manos. Cuando termina el partido, ya sois pareja en las redes."),
      o("b", "Celebrar con el equipo y buscarla luego con un abrazo", "Más íntimo", { moral: 7, flags: { pareja: "Sofía" } }, "Celebras con el equipo y, al salir, la encuentras con la bufanda en la mano. Te abrazas a ella en mitad del túnel con medio vestuario a tu espalda silbando."),
      o("c", "Después del partido, decirle que no puede ser", "La carrera, primero", { moral: -3, flags: { ro_sofia_no: true } }, "Se lo dices en el aparcamiento. Sofía te mira con los ojos muy abiertos, asiente y se quita la bufanda: «Entonces, que te vaya bien». Esa noche, el partido te parece mucho más grande."),
    ]),
  // ───── Vida en pareja ─────
  S("pa-suegros", "pareja", { flags: ["pareja"], minAge: 19, clubTurns: [1, 400], turn: [1, 10], notFlags: ["pa_suegros"] }, "vida",
    "La cena con los padres de {pareja}",
    "Te citan en su casa un domingo a las dos. Llegas con un ramo de flores que huele a florista de domingo y una botella de vino que has elegido con un asesoramiento telefónico de tu madre. La madre de {pareja} abre la puerta, te mira de arriba abajo y dice: «Eres más alto en la tele». El padre, desde el salón, grita: «¿Es del Madrid?». Y no sabes qué respuesta es la correcta.",
    [
      o("a", "Responder con la verdad y reír", "Ser tú mismo", { moral: 5, flags: { pa_suegros: "bien" } }, "Dices tu club con la cabeza alta. El padre arquea una ceja, sonríe de medio lado y dice: «Pues siéntate, que hay croquetas». A los diez minutos, ya os estáis discutiendo la alineación."),
      o("b", "Responder con diplomacia y fingir que no sabes", "Salir del paso", { moral: 2, flags: { pa_suegros: "diplomacia" } }, "Dices que lo importante es el fútbol. El padre lo toma como una evasiva y te sirve el doble de vino. Sales con una resaca moral y una tarta."),
      o("c", "Llevar un regalo para cada uno, con cuidado", "Preparado", { patrimonio: -150, moral: 4, reputacion: 2, flags: { pa_suegros: "regalos" } }, "Un pañuelo de seda para la madre, una camiseta firmada para el padre, un libro para la abuela. La abuela lo abre y dice con voz clara: «Este chico es de los buenos»."),
    ]),
  S("pa-mudanza", "pareja", { flags: ["pareja"], notFlags: ["convivencia"], minAge: 20, patrimonio: [3000, 100000000] }, "vida",
    "{pareja} y tú, bajo el mismo techo",
    "Lleváis un tiempo hablando de «cuando vivamos juntos» como quien habla de ganar un Mundial. Hoy, entre cajas de cartón y una escalera que no cabe en el ascensor, empezáis a mezclar vuestras cosas. {pareja} abre un armario y se queda mirando tu colección de camisetas de equipos de otros países. «¿Esto es una colección o una sentencia?», dice con la cara muy seria.",
    [
      o("a", "Hacerle hueco y que ponga lo suyo con calma", "Convivir de verdad", { moral: 7, patrimonio: -400, flags: { convivencia: true } }, "Dedicáis la tarde a decidir qué cuelga y qué se dobla. Os lleváis tres bolsas de ropa a la beneficencia y una discusión sobre toallas que durará dos años."),
      o("b", "Defender cada camiseta como si fuera tuya la vida", "Mantener tu santuario", { moral: 2, flags: { convivencia: true } }, "Negociáis con una seriedad de diplomáticos. Os quedáis con ocho camisetas en el armario y otras cien en una caja de cartón en el trastero, «de por vida»."),
      o("c", "Quedaros cada uno en su casa y ver cómo va", "Mantener la independencia", { moral: 0 }, "Decidís esperar un tiempo. {pareja} lo entiende con una sonrisa que dice «claro». Y se siente, aunque no se diga, un pequeño paso hacia atrás."),
    ]),
  S("pa-viajes", "pareja", { flags: ["pareja"], minAge: 19, clubTurns: [4, 400], notFlags: ["pa_viajes"] }, "vida",
    "{pareja} se queja de lo poco que os veis",
    "No lo dice con enfado. Lo dice con una mirada triste y un plato de pasta frío a medianoche. «Esta semana has dormido tres noches fuera, dos concentrado y una en casa con los auriculares puestos». Hay una pausa. «No te lo echo en cara. Pero te echo de menos». Es el tipo de frase contra la que no hay táctica posible.",
    [
      o("a", "Prometer sacar tiempo y cumplirlo con un plan concreto", "Un compromiso con fecha", { moral: 5, rel_entrenador: -1, flags: { pa_viajes: "plan" } }, "Pones una cita semanal en el calendario y una alarma en el móvil. El míster te pregunta por qué tienes un recordatorio que dice «cena con la persona más importante». «Para no olvidarme», contestas. Él calla y lo apunta."),
      o("b", "Explicarle que la carrera es corta y pedirle paciencia", "Ser sincero", { moral: 1, flags: { pa_viajes: "paciencia" } }, "Se lo explicas con calma. {pareja} asiente, pero algo en su mirada se queda cojo. «Lo entiendo», dice. Y dice la verdad. Pero entender no es lo mismo que sentirse acompañado."),
      o("c", "Llevarla de viaje contigo en el próximo desplazamiento", "Compartir el camino", { patrimonio: -300, moral: 6, rel_vestuario: 1, flags: { pa_viajes: "viaje" } }, "El utillero le consigue un asiento en el autobús, el lateral le cuenta chistes durante dos horas y el portero le da un regalo de bienvenida. En el hotel, {pareja} te mira con los ojos brillantes: «Esto no es tan aburrido»."),
    ]),
  S("pa-celos-redes", "pareja", { flags: ["pareja"], fama: [30, 100], minAge: 19, notFlags: ["pa_celos"] }, "vida",
    "Una foto tuya con otra persona se hace viral",
    "Es una foto inocente: tú, sonriente, con una fan que te abraza tras un partido. Pero el pie de foto, escrito por un perfil malintencionado, dice «el crack y su nueva amiga». En una hora hay doce mil comentarios. {pareja} te llama a los ocho minutos, con voz neutra: «Sé que no es nada. Pero necesito oírtelo decir».",
    [
      o("a", "Contárselo todo con calma y sin enfado", "La verdad por delante", { moral: 4, reputacion: 2, flags: { pa_celos: "calma" } }, "Le cuentas el momento exacto de la foto, con nombres y minutos. {pareja} te escucha sin interrumpir y al final dice: «Gracias. Ya me quedo tranquila»."),
      o("b", "Subir un mensaje público aclarando la situación", "Zanjar el asunto", { fama: 2, moral: 3, flags: { pa_celos: "publico" } }, "Subes una foto con {pareja} y la frase «La única persona que me abraza como debe». El comentario de la fan que posó contigo es un corazón. El bulo muere en una hora."),
      o("c", "Quitarle importancia: «Son cosas de la fama»", "Pasar del tema", { moral: -2, flags: { pa_celos: "frio" } }, "Le restas importancia. {pareja} se queda callada. «Si lo dices tú…», murmura. Y el resto de la noche, una distancia nueva se sienta entre los dos en el sofá."),
    ]),
  S("pa-aniversario", "pareja", { flags: ["pareja"], minAge: 19, clubTurns: [3, 400], turn: [3, 9], notFlags: ["pa_aniversario"] }, "vida",
    "El aniversario cae en semana de partido grande",
    "Es la fecha que no puedes olvidar y que tu calendario, por supuesto, ha olvidado. Esa noche juegas un partido de los importantes, con concentración desde el día anterior y un míster que no admite excusas. {pareja} no ha dicho nada. Pero esta mañana, en la nevera, había un papel con una sola palabra: «Tranquilo».",
    [
      o("a", "Mandarle flores al restaurante donde cenasteis la primera vez", "Un detalle a distancia", { patrimonio: -120, moral: 4, flags: { pa_aniversario: "flores" } }, "Las flores llegan a su trabajo a las diez de la mañana, con una nota de una línea. {pareja} la guarda en la cartera. Esa noche juegas mejor que nunca."),
      o("b", "Pedirle al míster una hora para cenar con ella", "Jugarte la bronca", { rel_entrenador: -3, moral: 6, flags: { pa_aniversario: "cena" } }, "El míster levanta la vista de la pizarra, te mira un segundo largo y dice: «Una hora». No te lo cree. Pero te lo concede."),
      o("c", "Posponerlo para el día siguiente y explicárselo", "La carrera, esta vez", { moral: -2, flags: { pa_aniversario: "pospuesto" } }, "Se lo dices con tacto. {pareja} lo entiende, pero cuando sales de casa te dice: «Mañana lo celebraremos. Pero hoy me hacía ilusión». Y se te queda dentro como una piedra pequeña."),
    ]),
  S("pa-lesion-cuidados", "pareja", { flags: ["pareja"], injured: true, minAge: 18 }, "vida",
    "{pareja} te cuida en la baja",
    "Con la pierna en alto y la cabeza llena de ruido, {pareja} se ha convertido en tu fisio, tu cocinera y tu psicóloga. Te lleva el desayuno a la cama, te recuerda los ejercicios con post-it por toda la casa y esta mañana ha anulado una reunión para ir contigo al médico. Se acerca, te tapa con una manta y dice con total naturalidad: «No hace falta que me lo agradezcas».",
    [
      o("a", "Agradecérselo con un detalle que le sorprenda", "Devolverle algo", { moral: 8, patrimonio: -250, flags: { pa_cuidados: true } }, "Le preparas una escapada para el fin de semana siguiente a tu recuperación. Con una nota: «El fisio que más he querido». {pareja} llora un poco y lo guarda en el bolsillo de la chaqueta."),
      o("b", "Decirle lo mucho que significa para ti, con palabras", "Un momento sincero", { moral: 9, flags: { pa_cuidados: true } }, "Se lo dices sin florituras, mirándola a los ojos. {pareja} te escucha con las manos en las rodillas. «Yo también», dice. Y se hace un silencio que no incomoda."),
      o("c", "Pedirle que descanse un poco: te las apañas", "Cuidar tú también", { moral: 3, flags: { pa_cuidados: true } }, "Insistes en que se vaya a dormir. {pareja} se resiste, finalmente cede y duerme doce horas seguidas. Cuando se despierta, tiene cara de otra persona."),
    ]),
  S("pa-trabajo", "pareja", { flags: ["pareja"], minAge: 20, clubTurns: [6, 400], notFlags: ["pa_trabajo"] }, "vida",
    "{pareja} recibe una oferta en otra ciudad",
    "Llega a casa con el móvil en la mano y los ojos muy abiertos. Le han ofrecido un puesto que lleva años soñando: un proyecto propio, un sueldo digno y una ciudad que no es la tuya. Se sienta a tu lado y dice con una voz muy pequeña: «No quiero que esto sea un problema, pero tampoco quiero que dejes de mirarme mientras lo pienso». Hay un silencio de los que pesan.",
    [
      o("a", "Animarla a aceptar y buscar la forma de seguir juntos", "Apoyarla de verdad", { moral: 3, reputacion: 3, flags: { pa_trabajo: "apoyo" } }, "Le dices que merece ese puesto. {pareja} llora de alivio. Los meses siguientes serán de aviones, de mensajes y de domingos largos, pero sabéis que valía la pena."),
      o("b", "Pedirle que lo piense bien antes de decidir", "Cuidar la relación", { moral: 0, flags: { pa_trabajo: "duda" } }, "Le pides tiempo. {pareja} lo entiende, pero la oferta caduca el viernes. Esa semana, los dos pensáis lo mismo y ninguno lo dice."),
      o("c", "Pedirle que se quede contigo", "Poner la relación primero", { moral: -2, rel_aficion: 0, flags: { pa_trabajo: "quedarse", pa_crisis_latente: true } }, "Se lo pides con la voz rota. {pareja} te abraza, dice que sí, y se queda. Pero en su mirada algo se ha encogido, como un sueño que no se puede decir en voz alta."),
    ]),
  S("pa-crisis", "pareja", { after: [after("pa-viajes", undefined, 6, 80)], flags: ["pareja"], minAge: 19 }, "vida",
    "Una discusión de las que no se olvidan",
    "No empezó siendo grande: un plato en el fregadero, un mensaje sin contestar, una frase en el tono equivocado. Pero ha escalado en media hora hasta el borde del abismo. {pareja} te mira desde la puerta con los ojos llenos y una maleta en el pasillo. «No sé si esto va a salir bien. Y no sé si quiero seguir fingiendo que sí». Se hace un silencio de los que duelen.",
    [
      r("a", "Pedirle que se quede y hablarlo toda la noche", "Luchar por lo vuestro", 0.58, "Os pasáis la noche sentados en el suelo del pasillo, con una botella de agua y mil cosas que decir. Cuando amanece, los dos estáis agotados y de la mano. «Esto lo arreglamos», dice. Y por primera vez, lo creéis.", { moral: 7, reputacion: 2, flags: { pa_reconciliacion: true } }, "Habláis hasta las cuatro de la madrugada, pero no llegáis a nada. {pareja} coge la maleta antes de que amanezca. «Necesito tiempo», dice. Y se va con una dignidad que te rompe.", { moral: -8, forma: -3, flags: { pareja: "", ex_pareja: true } }, "moral"),
      o("b", "Dejarla ir sin discutir más", "Aceptar lo que venga", { moral: -6, forma: -2, flags: { pareja: "", ex_pareja: true } }, "No dices nada. {pareja} coge la maleta y cierra la puerta con un cuidado excesivo. Esa noche, la casa suena distinto: demasiado grande, demasiado silenciosa."),
      o("c", "Proponerle una pausa de una semana", "Ni sí ni no", { moral: -2, flags: { pa_pausa: true } }, "Pactáis una semana de distancia. Os escribís dos veces. Después, la vida sigue. A la semana, os encontráis en una cafetería a medio camino y os sentáis sin decir nada, con dos cafés y una verdad: no habéis dejado de quereros."),
    ]),
  S("pa-ex-duelo", "pareja", { flags: ["ex_pareja"], notFlags: ["pareja", "pa_duelo"], minAge: 18 }, "vida",
    "Los primeros días después de la ruptura",
    "La casa suena distinto: el frigorífico hace más ruido, la cama es demasiado grande y en el cajón del baño sigue un cepillo de dientes que no es el tuyo. Un compañero te pregunta en el vestuario si estás bien y tú dices «claro», con la voz de quien miente por hábito. Esa noche, cuando ya no puedes más, te das cuenta de que has escrito su nombre en el móvil siete veces y lo has borrado siete.",
    [
      o("a", "Hablar con alguien de confianza y desahogarte", "Pedir compañía", { moral: 5, rel_vestuario: 2, flags: { pa_duelo: true } }, "Llamas a tu hermana. Hablas dos horas sin parar y, al final, se hace un silencio largo. «Ahora duele, pero se pasa», dice. Y tiene razón: se va pasando poco a poco."),
      o("b", "Volcarte en el trabajo para no pensar", "Cabeza en el campo", { forma: 3, moral: -2, media: 1, flags: { pa_duelo: true } }, "Entrenas más que nunca. El míster te mira con una mezcla de sorpresa y preocupación. «¿Todo bien?», pregunta. «Todo perfecto», mientes. Y los resultados, ironías, mejoran."),
      o("c", "Aislarte unos días con el móvil apagado", "Dejarte llevar", { moral: -4, forma: -2, flags: { pa_duelo: true } }, "Pasas tres días en el sofá con series que ni sigues. Al cuarto, el míster llama a la puerta con una bolsa de comida y la frase «hoy sales de aquí»."),
    ]),
];
