/**
 * Chicas de las redes: personajes fijos (con cara) que te escriben por Instagram o TikTok, se cruzan en tu vida y,
 * según lo que hagas, acaban en pareja o se quedan en un "casi". Cada una tiene su carácter y su propia cadena de
 * cinco escenas: mensaje, primera cita, rumor en la prensa o las redes, "¿qué somos?" y una escena ya en pareja.
 *
 * Solo hay una historia en curso a la vez (bandera ch_en_curso) y ninguna se activa si ya tienes pareja. Las fotos
 * son caras generadas por IA de personas que no existen (public/chicas).
 *
 *   ch_en_curso   nombre corto de la chica con la que hay historia abierta ("" = ninguna)
 *   ch_<x>        progreso de esa historia (vacío = terminada o sin empezar)
 *   ch_<x>_no     ya no volverá a salir
 *   pareja_foto   ruta de la foto de tu pareja, para Vida y las escenas
 */
import { S, o, r, after } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const LIBRE: BankWhen = { notFlags: ["pareja", "ch_en_curso"], minAge: 18, maxAge: 36 };
const viva = (x: string): BankWhen => ({ flags: [`ch_${x}`], notFlags: ["pareja", `ch_${x}_no`], minAge: 18 });
const fin = (x: string) => ({ [`ch_${x}`]: "", [`ch_${x}_no`]: true, ch_en_curso: "" });

export const CHICAS: BankScene[] = [
  // ───────────────────────── ALMA FERRER · actriz ─────────────────────────
  S("ch-alma-dm", "chicas", { ...LIBRE, notFlags: ["pareja", "ch_en_curso", "ch_alma_no"], fama: [45, 100] } as BankWhen, "vida",
    "Una actriz de series te escribe",
    "Llega un mensaje de una cuenta con tick azul. Es Alma Ferrer, la actriz de esa serie que medio país ve en el sofá. No te pide nada: te cuenta que su madre le dijo, viendo tu partido, que «ese chico tiene cara de no saber perder», que se ha reído una hora y que a lo mejor te debe un café por la frase.",
    [
      o("a", "Responder con humor y proponerle el café", "Entrar al juego", { moral: 4, fama: 2, flags: { ch_en_curso: "alma", ch_alma: "dm" } }, "Le dices que tu madre opina lo mismo y que, para disimular, invitas tú. Tres puntos suspensivos durante un minuto entero. Luego: «Jueves. Sin fotógrafos. O con uno solo, el mío»."),
      o("b", "Enseñárselo al vestuario antes de contestar", "Que el grupo opine", { rel_vestuario: 3, moral: 3, flags: { ch_en_curso: "alma", ch_alma: "dm" } }, "En diez minutos el mensaje está en el chat del equipo con quince emojis de fuego. El capitán dicta la respuesta, el lateral la corrige, el portero la anula. Al final contestas tú, con tus palabras. Ella responde: «Ya veo que tienes asesores»."),
      o("c", "Darle las gracias y no seguir la conversación", "Prudencia", { moral: -1, flags: { ch_alma_no: true } }, "Le agradeces el detalle con cuatro líneas educadas. Ella manda un pulgar y un «mucha suerte esta temporada». No vuelve a escribirte. Una puerta que se cierra sin hacer ruido.", {}),
    ], { weight: 2, dm: { handle: "almaferrer", name: "Alma Ferrer", platform: "instagram", avatar: "/chicas/alma.jpg", message: "Mi madre dice que tienes cara de no saber perder. Me he reído una hora. Creo que te debo un café por la frase." } }),
  S("ch-alma-cena", "chicas", { ...viva("alma"), after: [after("ch-alma-dm", undefined, 1, 8)] }, "vida",
    "La cena con Alma, sin fotógrafos",
    "Ha elegido un restaurante con la luz justa y un camarero que se hace el sordo. Alma llega con gafas de sol, se las quita y resulta ser mucho menos actriz de lo que esperabas: se come el pan antes de que lo sirvan, se queja de sus propios diálogos y te pregunta por tus rutinas con un interés raro. A mitad de postre, una mesa de cuatro chicas empieza a cuchichear y a levantar el móvil.",
    [
      o("a", "Pedir la cuenta y salir por la cocina con ella", "Protegerla", { moral: 6, reputacion: 1, flags: { ch_alma: "cena" } }, "Cruzáis la cocina entre cazos y risas. El cocinero os da una bolsa de croquetas «para el camino». Acabáis cenando en un banco de la calle de atrás, con el mejor postre posible: ninguno."),
      o("b", "Dejar que se hagan la foto y sonreír", "Naturalidad", { fama: 3, moral: 3, flags: { ch_alma: "cena" } }, "Una foto, dos, cinco. Alma firma una servilleta con un garabato elegante. Cuando se van, te mira: «No ha sido tan terrible, ¿verdad?». Las fotos estarán en redes antes de que llegue el café."),
      o("c", "Pedirles que lo dejen: es una cena privada", "Marcar el territorio", { moral: -1, rel_aficion: -2, flags: { ch_alma: "cena" } }, "Lo dices con educación pero sin rodeos. Una de las chicas lo cuenta después como «el futbolista borde». Alma, en cambio, te aprieta la mano bajo la mesa: «Eso me ha gustado»."),
    ]),
  S("ch-alma-rumor", "chicas", { ...viva("alma"), after: [after("ch-alma-cena", undefined, 1, 6)] }, "prensa",
    "«Alma Ferrer, nuevo amor futbolístico»",
    "La portada de una revista del corazón os muestra saliendo del restaurante, borrosos pero reconocibles. El titular es una mezcla de entusiasmo y mala baba: «¿Hay un nuevo equipo en la vida de Alma?». En el vestuario te han colgado la portada en la taquilla. Tu agente llama con la voz de quien ve billetes pasar. Ella te escribe: «Yo ya estoy acostumbrada. ¿Tú?».",
    [
      o("a", "Confirmarlo con una sonrisa ante los micrófonos", "Ir de cara", { fama: 5, rel_aficion: 2, moral: 4, flags: { ch_alma: "rumor" } }, "«Es una persona maravillosa y no digo más». Te basta eso para que lo repitan en todos los programas durante tres días. Alma te manda una captura del titular con una sola palabra: «Elegante»."),
      o("b", "Negarlo todo: «somos amigos»", "Mantener la privacidad", { fama: 1, moral: -3, flags: { ch_alma: "rumor" } }, "Tu desmentido dura seis horas. Una foto de vuestras manos entrelazadas lo tumba. Alma, cuando por fin habláis, no te lo reprocha. Pero tampoco sonríe tanto."),
      o("c", "No decir nada y esperar a que pase", "Dejar que se apague", { moral: 1, flags: { ch_alma: "rumor" } }, "El silencio es el idioma que mejor entienden los programas de cotilleo: se pasan una semana inventando por ti. Cuando acaban, la historia sigue ahí, más pequeña y más vuestra."),
    ]),
  S("ch-alma-formal", "chicas", { ...viva("alma"), after: [after("ch-alma-rumor", undefined, 2, 10)] }, "vida",
    "Alma se va a rodar cuatro meses",
    "La encuentras sentada en el sofá de su casa con un guion lleno de subrayados. Se va cuatro meses a rodar a otro país. Lo dice con la voz firme y los ojos grandes. «No sé qué somos, y creo que quiero saberlo antes de irme. Pero no quiero que lo decidas por pena. Decídelo por lo que sientas».",
    [
      o("a", "Decirle que quieres estar con ella, aunque haya kilómetros", "Apostar por los dos", { moral: 9, fama: 2, flags: { pareja: "Alma Ferrer", pareja_foto: "/chicas/alma.jpg", ch_en_curso: "", ch_alma: "pareja" } }, "No lo piensas más de dos segundos. Ella se ríe, llora, tira el guion al suelo y dice: «Menos mal. Tenía preparado un discurso para el caso contrario, y era horrible»."),
      o("b", "Pedirle que lo dejéis en pausa hasta que vuelva", "Ir despacio", { moral: -2, flags: { ch_alma: "pausa" } }, "Lo aceptáis con una sonrisa triste. Os escribís algunas noches. Cuando vuelve, la conversación continúa, pero algo se ha enfriado: ya no es el mismo momento."),
      o("c", "Decirle que ahora no puedes con una relación así", "Cortar", { moral: -4, flags: fin("alma") }, "Alma asiente, recoge el guion y te acompaña a la puerta sin dramas. «Gracias por decírmelo a la cara». Te quedas en el rellano con la sensación de haberte equivocado y de haber hecho lo correcto, las dos cosas a la vez."),
    ]),
  S("ch-alma-alfombra", "chicas", { notFlags: ["ch_alma_alfombra"], after: [after("ch-alma-formal", undefined, 6, 30)], flags: ["pareja", "ch_alma"], minAge: 18 }, "especial",
    "Tu primera alfombra roja junto a Alma",
    "El estreno de su nueva serie. Te prestan un traje que te queda mejor de lo que querrías admitir. Cuando bajáis del coche, el sonido de las cámaras es como lluvia dura sobre un techo de uralita. Alma te coge del brazo y susurra: «Sonríe y no hables con los de los micrófonos largos. Esos te sacan lo que no quieres decir». A lo lejos, un periodista grita tu nombre.",
    [
      o("a", "Posar a su lado y dejar que brille ella", "Dar un paso atrás", { moral: 7, fama: 4, reputacion: 2, flags: { ch_alma_alfombra: true } }, "Posáis veinte segundos. Ella, radiante; tú, tranquilo. Las fotos son un éxito: «La pareja de la noche». Alma, al entrar, te aprieta el brazo: «Se te da mejor de lo que dices»."),
      o("b", "Responder a las preguntas del periodista", "Atreverte", { fama: 5, moral: 3, rel_vestuario: -1, flags: { ch_alma_alfombra: true } }, "Dices algo de la temporada, algo del cariño, y una frase que se hace viral sin que sepas por qué. El míster te escribe: «Más goles y menos alfombras». Alma se ríe en el coche de vuelta."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a young footballer in a dark suit on a red carpet at a premiere, photographers flashing behind him, elegant night lighting, confident calm expression, no logos or readable text" }),

  // ───────────────────────── NEREA SOLANO · influencer ─────────────────────────
  S("ch-nerea-dm", "chicas", { ...LIBRE, notFlags: ["pareja", "ch_en_curso", "ch_nerea_no"], fama: [55, 100], minAge: 20 } as BankWhen, "vida",
    "Una influencer te escribe con total sinceridad",
    "El mensaje es directo hasta el desparpajo. Nerea Solano, tres millones de seguidores y una marca de cosmética propia, te cuenta que su agencia le ha sugerido salir con un futbolista «para el engagement». Ella les ha dicho que prefiere conocerte antes. Lo primero es verdad, te jura, y lo segundo también.",
    [
      o("a", "Responderle con la misma franqueza y quedar", "Jugar limpio", { moral: 4, fama: 2, flags: { ch_en_curso: "nerea", ch_nerea: "dm" } }, "Le dices que valoras la sinceridad y que, a cambio, cenas tú, sin cámaras. Contesta con un audio de diez segundos riéndose: «Trato hecho. Pero el postre lo grabo yo»."),
      o("b", "Preguntarle cuánto hay de agencia y cuánto de ella", "Poner condiciones", { reputacion: 2, flags: { ch_en_curso: "nerea", ch_nerea: "dm" } }, "Se lo preguntas tal cual. Tarda en contestar. Cuando lo hace, es un párrafo largo y raro, de esos que solo escribe quien ha pensado de verdad la respuesta. Algo ahí te convence, o te inquieta."),
      o("c", "Ignorar el mensaje: huele a marketing", "Prudencia", { moral: 0, flags: { ch_nerea_no: true } }, "Lo dejas sin leer. Dos días después aparece una historia suya con el texto «a veces pierdes por no contestar». Es un mensaje para ti, o para sus seguidores. Nunca lo sabrás."),
    ], { weight: 2, dm: { handle: "nerea.solano", name: "Nerea Solano", platform: "instagram", avatar: "/chicas/nerea.jpg", message: "Mi agencia me ha dicho que salga con un futbolista para la marca. Yo les he dicho que prefiero conocerte antes. Lo primero es verdad. Lo segundo también, te lo juro." } }),
  S("ch-nerea-cena", "chicas", { ...viva("nerea"), after: [after("ch-nerea-dm", undefined, 1, 8)] }, "vida",
    "La cena con Nerea y su fotógrafo «de casualidad»",
    "Llegas al restaurante y, en la mesa de al lado, hay un chico con cámara profesional que juega a no mirar. Nerea te saluda con dos besos y un «no lo he traído yo, te lo juro, pero lo conozco». La cena es un baile continuo entre lo íntimo y lo fotografiable. Se ríe de verdad cuando dices algo gracioso, y entonces se acuerda de que la están viendo y se ríe otra vez, mejor.",
    [
      o("a", "Decirle que prefieres que el fotógrafo se vaya", "Poner límites", { moral: 3, reputacion: 2, flags: { ch_nerea: "cena" } }, "Se lo dices sin acritud. Ella duda un segundo y le hace una seña al fotógrafo, que se va sin discutir. «Nadie me había pedido eso. Qué raro. Qué bien»."),
      o("b", "Seguirle el juego y salir guapo en las fotos", "Dejarte llevar", { fama: 5, moral: 2, flags: { ch_nerea: "cena" } }, "Posas con tu mejor perfil, sacas la sonrisa de entrevista y aguantas cuarenta flashes. Nerea te aprieta la mano: «Eres un profesional». No sabes si es un cumplido."),
      o("c", "Levantarte y marcharte: no estás aquí para esto", "Cortar el show", { moral: -3, rel_aficion: 1, flags: fin("nerea") }, "Dejas veinte euros en la mesa y te vas con la mandíbula apretada. Ella te escribe esa noche: «Tenías razón. Y yo también la tenía. Esto no va a funcionar». Para una vez que estáis de acuerdo."),
    ]),
  S("ch-nerea-rumor", "chicas", { ...viva("nerea"), after: [after("ch-nerea-cena", undefined, 1, 6)] }, "prensa",
    "Nerea sube una historia con tu mano",
    "Despiertas con cien mensajes. Nerea ha subido una historia: un café, dos manos sobre una mesa, una de ellas con tu reloj. Sin nombre, sin etiqueta, con un corazoncito. Ya ha dado la vuelta a todas las cuentas de cotilleo. Tu representante te llama: «Te quieren en tres programas esta semana». Nerea te escribe: «Perdón. O no. Todavía no lo sé».",
    [
      o("a", "Escribirle: «La próxima vez, pregúntame»", "Poner un límite claro", { reputacion: 2, moral: 2, flags: { ch_nerea: "rumor" } }, "Se lo dices sin enfado. Ella tarda en responder, y cuando lo hace es con una disculpa larga y cuidada, sin emoji. «Lo haré. Prometido». Esta vez parece que de verdad lo piensa."),
      o("b", "Reírte y subir tú otra historia de vuelta", "Entrar en el juego", { fama: 6, moral: 3, flags: { ch_nerea: "rumor" } }, "Subes una foto de tu café con otra mano: la tuya, sola. Pie de foto: «Esperando». El mundo de las redes se vuelve loco. Nerea responde con un sticker de fuegos artificiales."),
      o("c", "Desaparecer de redes unos días", "Poner distancia", { moral: -2, forma: 1, flags: { ch_nerea: "rumor" } }, "Apagas el móvil y entrenas. El caos digital pasa sin ti. Cuando vuelves, Nerea te ha dejado seis mensajes, ninguno sobre fotos."),
    ]),
  S("ch-nerea-formal", "chicas", { ...viva("nerea"), after: [after("ch-nerea-rumor", undefined, 2, 10)] }, "vida",
    "Nerea te propone un trato… o algo más",
    "Os citáis en la azotea de su casa. Nerea está sin maquillar, algo que no has visto nunca, y lo anuncia: «Tengo dos cosas que decirte. La primera es un trato de la agencia: salir juntos en público, los dos ganamos. La segunda no es de la agencia: me gustas, de verdad, y no sé cómo separar las dos». Hay silencio. Un ventilador gira muy lento.",
    [
      o("a", "Decirle que sí, pero sin trato: solo vosotros", "Ir en serio", { moral: 9, fama: 2, flags: { pareja: "Nerea Solano", pareja_foto: "/chicas/nerea.jpg", ch_en_curso: "", ch_nerea: "pareja" } }, "Dices que no firmarás ningún papel, pero que quieres intentarlo de verdad. Se lleva las manos a la cara. «Esto no estaba en el guion». Y te besa."),
      o("b", "Aceptar el trato de cara a la galería", "Negocio", { fama: 8, patrimonio: 15000, moral: -4, flags: { ch_en_curso: "", ch_nerea: "trato" } }, "Firmáis un papel con un anagrama de agencia. Salís juntos en público, sonreís cuando toca. Os llevaréis mejor que muchas parejas de verdad, y eso es lo más triste. Las dos primeras semanas las fotos arrasan."),
      o("c", "Decirle que no a las dos cosas", "Cortar con elegancia", { moral: -3, flags: fin("nerea") }, "Lo explicas con calma: no sabes separar tampoco tú las dos cosas, y prefieres no averiguarlo. Ella asiente muy despacio. «Una pena. Habría sido una buena historia». Se levanta, recoge su bolso, y le sale una sonrisa pequeña y sincera."),
    ]),
  S("ch-nerea-sin-filtro", "chicas", { notFlags: ["ch_nerea_sinfiltro"], after: [after("ch-nerea-formal", undefined, 6, 26)], flags: ["pareja", "ch_nerea"], minAge: 18 }, "vida",
    "Nerea sube una foto tuya sin filtro",
    "Una mañana abres el móvil y ahí estás: recién levantado, pelo imposible, camiseta vieja del equipo, desayunando con cara de sueño. Nerea la ha subido con un texto breve: «Él, de verdad». Tiene un millón de me gusta en dos horas. El comentario más repetido es «qué ternura». En el vestuario, el lateral ya te ha puesto de fondo de pantalla.",
    [
      o("a", "Reírte y compartirla en tus propias redes", "Aceptarlo con humor", { fama: 4, rel_vestuario: 2, moral: 5, flags: { ch_nerea_sinfiltro: true } }, "La compartes con la frase «Esta es mi cara real». Gana el doble de me gusta que cualquier foto tuya del año. Nerea, al leerlo, te manda un audio de cinco segundos que solo contiene una risa."),
      o("b", "Pedirle que la borre: no quieres esa imagen", "Cuidar tu imagen", { moral: -2, reputacion: 1, flags: { ch_nerea_sinfiltro: true } }, "La borra enseguida, sin protestar, aunque se nota que le ha dolido: «Lo hice con cariño». Entiendes que a veces el cariño y la exposición no caben en la misma foto."),
    ]),

  // ───────────────────────── CANDELA RUIZ · viajera ─────────────────────────
  S("ch-candela-dm", "chicas", { ...LIBRE, notFlags: ["pareja", "ch_en_curso", "ch_candela_no"], fama: [25, 100] } as BankWhen, "vida",
    "Una viajera te escribe desde un aeropuerto",
    "El mensaje llega por TikTok, con un audio de fondo que parece una sala de embarque. Se llama Candela, hace vídeos de viajes y lleva tres semanas sin hablar con nadie que no sea un taxista. Vio una entrevista tuya en el aeropuerto de Lisboa y se quedó pensando en lo que dijiste del miedo antes de los partidos. «Te escribo porque me sentó bien. Nada más. Bueno, un poco más».",
    [
      o("a", "Contestarle con otro audio, contándole lo del miedo", "Abrirte un poco", { moral: 5, flags: { ch_en_curso: "candela", ch_candela: "dm" } }, "Grabas un audio de un minuto con el coche aparcado delante del campo de entrenamiento. Le hablas de la garganta seca, de la rutina del calcetín derecho primero. Ella responde con una foto de un atardecer en Tiflis: «Gracias. Esto es para ti»."),
      o("b", "Pedirle que te cuente el viaje más raro que ha hecho", "Hacerle preguntas", { moral: 3, flags: { ch_en_curso: "candela", ch_candela: "dm" } }, "Te envía una historia delirante sobre un autobús, una cabra y un monasterio. Te ríes solo en el sofá. Nada de lo que cuenta parece inventado, y todo parece de película."),
      o("c", "Agradecérselo y no seguir", "Mantener el foco", { moral: -1, flags: { ch_candela_no: true } }, "Le contestas con un «gracias, qué detalle». Ella manda un corazón pequeño y desaparece de tu bandeja. A veces el silencio también es un viaje."),
    ], { weight: 2, dm: { handle: "cande.sinmaleta", name: "Candela", platform: "tiktok", avatar: "/chicas/candela.jpg", message: "Vi tu entrevista en el aeropuerto de Lisboa y me quedé pensando en lo que dijiste del miedo. Llevo tres semanas sin hablar con nadie que no sea un taxista. Te escribo porque me sentó bien. Nada más. Bueno, un poco más." } }),
  S("ch-candela-picnic", "chicas", { ...viva("candela"), after: [after("ch-candela-dm", undefined, 1, 8)] }, "vida",
    "Un picnic con Candela, recién aterrizada",
    "Aparece en el parque con una mochila enorme, el pelo despeinado y una sonrisa de quien lleva doce horas sin dormir. Acaba de aterrizar desde Tiflis y ha decidido que lo primero es sentarse contigo en el césped. Saca de la mochila pan, queso, una botella de un vino georgiano que huele a madera y una cámara con un montón de fotos que no ha revelado. «Elige una. La que te guste, es tuya».",
    [
      o("a", "Elegir la foto de una calle vacía al amanecer", "Quedarte con la quietud", { moral: 6, flags: { ch_candela: "picnic" } }, "Es una calle de piedra, una ventana abierta, un gato en un portal. «Es mi favorita», dice ella, bajito. Esa foto acabará enmarcada en tu casa, aunque aún no lo sabes."),
      o("b", "Elegir la única foto en la que ella sale riéndose", "Ser directo", { moral: 7, flags: { ch_candela: "picnic" } }, "Se sonroja hasta las orejas. «Esa no. Esa es del taxista, que me contó un chiste». Insistes. Cede. Cuando la mira, se pone seria: «Ostras. Sí que me estoy riendo»."),
      o("c", "Dejar que decida ella cuál te llevas", "Confiar en ella", { moral: 4, flags: { ch_candela: "picnic" } }, "Duda, saca tres, las baraja. Al final te da una de un puente colgante. «Para que pierdas el miedo». Es tan Candela que no puedes evitar sonreír."),
    ]),
  S("ch-candela-viral", "chicas", { ...viva("candela"), after: [after("ch-candela-picnic", undefined, 1, 6)] }, "prensa",
    "Un vídeo de vosotros dos en el parque se hace viral",
    "Un desconocido os grabó desde lejos en el picnic: tú, ella, un trozo de queso en el aire y una carcajada. El vídeo lleva doscientas mil reproducciones en un día y un montón de comentarios del estilo «yo quiero esto». Alguien os ha puesto nombre de pareja. Un periodista deportivo, con retranca, titula su pieza: «El delantero que dejó la presión para otro día».",
    [
      o("a", "Compartirlo y ponerle un pie de foto con cariño", "Presumir un poco", { fama: 4, moral: 5, rel_aficion: 2, flags: { ch_candela: "viral" } }, "Escribes «Algunas pausas valen más que un gol». Es lo más compartido de tu semana. Candela te escribe desde otro huso horario: «No sabía que eras poeta»."),
      o("b", "No decir nada: que el vídeo se enfríe solo", "Dejarlo estar", { moral: 2, flags: { ch_candela: "viral" } }, "Se enfría en cuatro días, como todo en internet. A ella le hace gracia el ruido, y a ti te hace gracia que a ella le haga gracia."),
      o("c", "Pedirle que lo borre de su cuenta", "Proteger tu imagen", { moral: -3, flags: { ch_candela: "viral" } }, "Lo borra al instante. «Perdona, no pensé». Pero esa noche, en un hotel de Estambul, te manda una sola frase: «Entiendo que pesa más para ti que para mí»."),
    ]),
  S("ch-candela-formal", "chicas", { ...viva("candela"), after: [after("ch-candela-viral", undefined, 2, 10)] }, "vida",
    "Candela se va a Japón y te pregunta si te vas con ella",
    "Llama desde un hostal con el wifi a punto de rendirse. Candela tiene un billete a Japón para dos meses y una pregunta que ha pospuesto tres semanas. «No te voy a decir que dejes todo, no soy tan loca. Solo quería saber si, cuando vuelva, sigues en mi mapa». La conexión se corta, vuelve, y ella repite, más bajito, la última frase.",
    [
      o("a", "Decirle que sí, que la esperas y que será algo serio", "Ir en serio", { moral: 9, flags: { pareja: "Candela Ruiz", pareja_foto: "/chicas/candela.jpg", ch_en_curso: "", ch_candela: "pareja" } }, "«Sigues en mi mapa», dices. Del otro lado del móvil se oye un silencio y luego un grito de alegría que despierta a medio hostal. Os pasáis una hora hablando sin que se corte ni una vez."),
      o("b", "Pedirle que lo hablemos a su vuelta, cara a cara", "Ir despacio", { moral: 1, flags: { ch_candela: "pausa" } }, "Lo dices con cariño. Ella te manda cada día una foto distinta de Japón. A la vuelta, la conversación tiene otra textura, más tímida, pero sigue ahí."),
      o("c", "Decirle que lo vuestro es mejor dejarlo en una bonita anécdota", "Cortar", { moral: -4, flags: fin("candela") }, "Lo entiende o finge entenderlo. «Gracias por el queso». Se oye una risita triste y un clic. Te quedas con la foto del puente colgante y con la sensación de que en algún sitio alguien sigue viajando sin ti."),
    ]),
  S("ch-candela-postal", "chicas", { notFlags: ["ch_candela_postal"], after: [after("ch-candela-formal", undefined, 5, 26)], flags: ["pareja", "ch_candela"], minAge: 18 }, "vida",
    "Una postal de Candela llega a la taquilla",
    "En el vestuario, alguien silba al sacar de tu taquilla un sobre con sello extranjero. Es una postal con un paisaje de arrozales y una frase escrita a mano con letra torcida: «Hoy he pensado en ti tres veces. La segunda ha sido en un tren. La tercera, ahora». El lateral se atraganta con el agua. El portero lee en voz alta, con voz de teatro, y alguien aplaude.",
    [
      o("a", "Quitarle la postal de las manos y leerla en silencio", "Guardártela", { moral: 8, rel_vestuario: 1, flags: { ch_candela_postal: true } }, "La guardas en el bolsillo de la chaqueta. El resto del día, cada vez que te tocas el bolsillo, se te escapa una sonrisa que ningún compañero deja de notar."),
      o("b", "Leerla tú también en voz alta, con más teatro", "Seguirles el juego", { rel_vestuario: 4, moral: 5, flags: { ch_candela_postal: true } }, "Das un recital con gestos, pausas y una lagrimilla fingida. Cuando acabas, el vestuario entero se pone en pie. Es el mejor momento de la semana, y de paso cierras la boca a los bromistas."),
    ]),

  // ───────────────────────── LOLA QUINTERO · ilustradora y camarera ─────────────────────────
  S("ch-lola-dm", "chicas", { ...LIBRE, notFlags: ["pareja", "ch_en_curso", "ch_lola_no"], fama: [20, 100] } as BankWhen, "vida",
    "Una chica te dibuja con tres piernas",
    "Te escribe una desconocida con un dibujo adjunto: eres tú, celebrando un gol, con tres piernas y una cara de loco. «Te he dibujado así porque corres como si tuvieras tres. Es cariño, te lo juro». Se llama Lola, es ilustradora y, de momento, también camarera en un restaurante de barrio. Pregunta si puede imprimir el dibujo para venderlo en un mercadillo. Te ofrece, a cambio, una cerveza.",
    [
      o("a", "Decirle que sí y pedirle una copia firmada", "Meterte en la broma", { moral: 5, fama: 1, flags: { ch_en_curso: "lola", ch_lola: "dm" } }, "Contesta con un emoji de tres piernas y un «hecho». A los dos días recibes en el club un tubo con tu dibujo enmarcado y una nota: «Para tu taquilla». El utillero lo cuelga con chinchetas antes de que puedas protestar."),
      o("b", "Preguntarle cuánto vale el dibujo en el mercadillo", "Ir al negocio", { moral: 2, flags: { ch_en_curso: "lola", ch_lola: "dm" } }, "Te dice un precio ridículamente bajo y le contestas que lo suba. Se queda sin palabras. «Nunca me habían dicho eso». Empieza una conversación muy larga sobre lo que valen las cosas."),
      o("c", "Dar las gracias, pero que no use tu imagen", "Cuidar tu imagen", { moral: -1, flags: { ch_lola_no: true } }, "Lo respeta sin protestar: «Claro, tranquilo». Un tiempo después ves el dibujo, con la cara cambiada, en un mercadillo. Alguien lo compra. Piensas que no te habría molestado."),
    ], { weight: 2, dm: { handle: "lolaquintero.dibuja", name: "Lola Quintero", platform: "instagram", avatar: "/chicas/lola.jpg", message: "Te he dibujado con tres piernas porque corres como si tuvieras tres. Es cariño, te lo juro. ¿Puedo imprimirlo para el mercadillo? A cambio te invito a una cerveza." } }),
  S("ch-lola-restaurante", "chicas", { ...viva("lola"), after: [after("ch-lola-dm", undefined, 1, 8)] }, "vida",
    "Aparecer en el restaurante donde trabaja Lola",
    "Entras en el restaurante un martes por la noche, con gorra y la intención de pasar desapercibido. No dura ni un minuto: Lola te ve desde la barra, suelta la bandeja y grita «¡las tres piernas!» ante cuarenta comensales. El dueño se asoma de la cocina con los ojos como platos. Te sientan en la mejor mesa, te traen croquetas que no has pedido y, por un momento, el barrio entero te mira como a un vecino que vuelve a casa.",
    [
      o("a", "Quedarte a cenar y pagar la cuenta de la mesa de al lado", "Ser generoso", { moral: 6, rel_aficion: 3, patrimonio: -120, flags: { ch_lola: "restaurante" } }, "La mesa de al lado, una familia de seis, no entiende nada hasta que el camarero les dice quién ha pagado. Cuando te vas, la abuela te da dos besos y te dice: «Tú tienes buen corazón». Lola lo ve todo desde la barra, con las orejas rojas."),
      o("b", "Pedir que te sienten en la barra, con ella", "Estar cerca", { moral: 7, flags: { ch_lola: "restaurante" } }, "Os pasáis la noche hablando entre pedidos, ella con una mano en la caja y la otra dibujando en una servilleta. Antes de irte, te la regala: eres tú, de pie, mirando el atardecer con tres piernas. «Para la próxima»."),
      o("c", "Irte discretamente: hoy no es noche de foco", "Ser prudente", { moral: -1, flags: { ch_lola: "restaurante" } }, "Pagas y te vas por la puerta de atrás con la sensación de haber desaprovechado algo. Lola te manda un mensaje: «Entiendo que no quieras cenar entre cuarenta móviles. Tengo una mesa en la cocina, por si acaso»."),
    ]),
  S("ch-lola-fama", "chicas", { ...viva("lola"), after: [after("ch-lola-restaurante", undefined, 1, 6)] }, "prensa",
    "«La camarera del dibujo» sale en la prensa",
    "Un periodista local se ha enterado de lo de las tres piernas y ha publicado una pieza larga: «La camarera que dibuja al delantero». El restaurante tiene cola. Los dibujos de Lola se han agotado en dos horas. Su dueño le ha subido el sueldo y te ha mandado una botella de vino con una nota que dice: «Gracias por traerla de la sombra». Lola te escribe: «Esto es una locura. ¿Qué hago?».",
    [
      o("a", "Decirle que acepte las entrevistas y que lo disfrute", "Animarla", { moral: 5, fama: 2, flags: { ch_lola: "fama" } }, "Le dices que la gente tarda toda la vida en tener un día así. Lola da tres entrevistas en la radio local y sale feliz de todas. Cuando te escribe, el mensaje tiene tantos signos de exclamación que parece un incendio."),
      o("b", "Aconsejarle prudencia: la fama a veces cambia a la gente", "Cuidarla", { moral: 2, reputacion: 2, flags: { ch_lola: "fama" } }, "Te escucha en silencio. «Gracias por decírmelo. Tengo miedo de acabar pareciéndome a alguien que no soy». Os pasáis una hora hablando de eso y, sin querer, os conocéis más."),
      o("c", "No meterte: es su momento", "Dejarla brillar", { moral: 1, flags: { ch_lola: "fama" } }, "Lo respetas. Ella lo siente como una ausencia. «Pensaba que me dirías algo». Te das cuenta de que tu silencio dijo más que cualquier consejo."),
    ]),
  S("ch-lola-formal", "chicas", { ...viva("lola"), after: [after("ch-lola-fama", undefined, 2, 10)] }, "vida",
    "Lola tiene una oferta para irse a otra ciudad",
    "Te cita en el banco donde se sentó el día del mercadillo. Lleva un sobre en la mano y los ojos hinchados. Una editorial le ofrece ilustrar un libro en otra ciudad, a cuatrocientos kilómetros. Si acepta, tendrá que dejar el restaurante y el barrio. Si no, se quedará donde está, con su caja y su bandeja y sus tres piernas. «No quiero decidirlo por ti. Pero tampoco sin ti».",
    [
      o("a", "Decirle que acepte, y que te tendrá a un tren de distancia", "Apostar por ella", { moral: 8, reputacion: 2, flags: { pareja: "Lola Quintero", pareja_foto: "/chicas/lola.jpg", ch_en_curso: "", ch_lola: "pareja" } }, "Se queda mirándote un rato largo y luego se echa a reír con el sobre en alto. «Eres tonto». Y te abraza fuerte, de esas veces en las que sabes que algo va a cambiar para bien."),
      o("b", "Pedirle que se quede, por lo menos un tiempo", "Egoísta pero sincero", { moral: 3, flags: { pareja: "Lola Quintero", pareja_foto: "/chicas/lola.jpg", ch_en_curso: "", ch_lola: "pareja" } }, "Dudas, lo dices, y ella asiente. «Es la primera vez que alguien me pide que me quede en vez de que me vaya». No sabes si es un cumplido o una advertencia."),
      o("c", "Decirle que haga lo que sea mejor para su carrera, y nada más", "Dejarla ir", { moral: -4, flags: fin("lola") }, "Es lo correcto y lo más cobarde a la vez. Lola asiente despacio y se guarda el sobre. «Gracias por no mentirme». Se levanta y se va sin mirar atrás. Te quedas solo en el banco, con una servilleta dibujada y un frío raro."),
    ]),
  S("ch-lola-vestuario", "chicas", { notFlags: ["ch_lola_vestuario"], after: [after("ch-lola-formal", undefined, 5, 26)], flags: ["pareja", "ch_lola"], minAge: 18 }, "vestuario",
    "Un dibujo de Lola en el vestuario",
    "Alguien ha colgado en la pared del vestuario un dibujo nuevo. Eres tú, de pie en el centro del campo, con una cara de felicidad bobalicona y los brazos abiertos. Alrededor, todos tus compañeros dibujados con sus defectos: el portero con guantes gigantes, el capitán con cara de padre, el lateral con el móvil pegado. Firma: «Lola Q.». El míster se detiene delante: «Esto es mejor que mis charlas».",
    [
      o("a", "Decir que lo enmarquen y lo dejen siempre ahí", "Hacerlo vuestro", { rel_vestuario: 5, moral: 6, flags: { ch_lola_vestuario: true } }, "El utillero lo enmarca esa misma tarde. A partir de ese día, antes de cada partido, el capitán le da un golpecito al marco. Es una cábala nueva y la más bonita que has visto."),
      o("b", "Pedir que lo cuelguen en un sitio más discreto", "Evitar el cachondeo", { rel_vestuario: -2, moral: 1, flags: { ch_lola_vestuario: true } }, "Lo mueven a un rincón. El lateral murmura que «te lo tienes creído». El dibujo, ahora entre dos taquillas, parece más tímido. Lola, cuando se entera, se ríe: «Es el sitio de los tesoros»."),
    ]),
  S("ch-alma-vuelta", "chicas", { ...viva("alma"), after: [after("ch-alma-formal", undefined, 8, 26)] }, "vida",
    "Alma Ferrer vuelve a escribirte",
    "Han pasado los meses de rodaje y, una noche, sin avisar, aparece un mensaje suyo: una foto de un aeropuerto y tres palabras. «Ya he vuelto». No dice nada más. Entiendes que ahora te toca a ti decidir qué hacer con lo que dejasteis en pausa.",
    [
      o("a", "Ir a buscarla al aeropuerto con un cartel absurdo", "Retomarlo", { moral: 8, flags: { pareja: "Alma Ferrer", pareja_foto: "/chicas/alma.jpg", ch_en_curso: "", ch_alma: "pareja" } }, "Llegas con un cartel que pone «ALMA FERRER, ACTRIZ (PERO SOBRE TODO MI CAFÉ)». Hay una cola de turistas y un guardia de seguridad que lo lee con cara de póker. Ella se ríe tanto que tiene que sentarse en su maleta. Lo retomáis allí mismo."),
      o("b", "Contestarle con cariño, pero dejarlo como estaba", "Cerrar", { moral: -2, flags: fin("alma") }, "Le contestas con calidez, sin dramatismo, y le deseas lo mejor. Ella lo entiende. «Gracias por no hacerme esperar más». Os dais un abrazo virtual y cada uno sigue con su vida, con una cicatriz pequeña y limpia."),
    ]),
  S("ch-nerea-vuelta", "chicas", { ...viva("nerea"), after: [after("ch-nerea-formal", undefined, 8, 26)] }, "vida",
    "Nerea Solano vuelve a escribirte",
    "Nerea te manda un mensaje largo, sin emojis y sin filtro: ha dejado la agencia, ha cambiado de representante y ha decidido que lo que publica lo decide ella. Termina con una frase: «Si todavía te apetece conocerme sin pantallas de por medio, esta vez sí».",
    [
      o("a", "Proponerle una cena sin móviles", "Darle otra oportunidad", { moral: 8, flags: { pareja: "Nerea Solano", pareja_foto: "/chicas/nerea.jpg", ch_en_curso: "", ch_nerea: "pareja" } }, "Quedáis en su casa, los dos con el móvil apagado en un cajón. Cenáis pasta mala, hablando hasta las dos de la mañana. Nerea, sin cámara, es otra persona: mucho más graciosa y mucho más real. Es una buena noche para empezar."),
      o("b", "Agradecerle el gesto, pero cerrar la historia", "Dejarlo atrás", { moral: -2, flags: fin("nerea") }, "Le dices que valoras el cambio, pero que ya no puedes fiarte del todo. Ella lo acepta con dignidad. «Me lo merezco». Te desea suerte y borra, un rato después, todas las fotos tuyas de su cuenta. Es un gesto bonito y definitivo."),
    ]),
  S("ch-candela-vuelta", "chicas", { ...viva("candela"), after: [after("ch-candela-formal", undefined, 8, 26)] }, "vida",
    "Candela Ruiz vuelve a escribirte",
    "Un domingo por la noche, tu teléfono vibra con una videollamada. Candela, sin maleta, en un portal conocido, con el pelo mojado de lluvia: «He aterrizado hace una hora. No he ido a casa. He venido aquí. Solo quería ver si el mapa seguía igual».",
    [
      o("a", "Bajar corriendo al portal sin ponerte los zapatos", "Abrirle la puerta", { moral: 8, flags: { pareja: "Candela Ruiz", pareja_foto: "/chicas/candela.jpg", ch_en_curso: "", ch_candela: "pareja" } }, "Bajas con calcetines y la camiseta del equipo. Está calada hasta los huesos y sonriendo. «Sigues en el mapa». «Sigo». Subís los dos con un charco detrás, y esa noche el piso huele a lluvia y a café."),
      o("b", "Decirle que ya no es buen momento", "Dejarlo pasar", { moral: -2, flags: fin("candela") }, "Se lo dices en voz baja y con la verdad por delante. Candela asiente, sonríe un poco, se levanta la capucha. «Entonces seguiré andando». Te quedas mirándola alejarse por la calle, con la sensación de que alguien acaba de cerrar un mapa."),
    ]),
  S("ch-lola-vuelta", "chicas", { ...viva("lola"), after: [after("ch-lola-formal", undefined, 8, 26)] }, "vida",
    "Lola Quintero vuelve a escribirte",
    "A las pocas semanas de que Lola se marchara, llega un paquete sin remitente: dentro hay un cuaderno de dibujos. Eres tú en todas las páginas, dormido en un autobús, sentado en un banquillo, comiendo una tostada con los ojos cerrados. En la última hoja hay una frase escrita con letra apretada: «Todavía no me he ido del todo».",
    [
      o("a", "Coger un tren al día siguiente con el cuaderno bajo el brazo", "Ir a por ella", { moral: 8, flags: { pareja: "Lola Quintero", pareja_foto: "/chicas/lola.jpg", ch_en_curso: "", ch_lola: "pareja" } }, "Compras un billete sin pensarlo y te presentas en su portal con el cuaderno y una caja de croquetas. Lola abre la puerta con un lápiz en el pelo. «Eres idiota», dice, y te abraza con tanta fuerza que se te cae la caja. Las croquetas sobreviven."),
      o("b", "Responder con una nota amable y no ir", "Respetar su camino", { moral: -2, flags: fin("lola") }, "Le escribes una nota cálida y se la mandas por correo. Lola contesta con un dibujo tuyo con una sola pierna, saludando. «Hasta pronto, tres piernas». Entiendes que algunas historias son bonitas justo por quedarse así."),
    ]),
];
