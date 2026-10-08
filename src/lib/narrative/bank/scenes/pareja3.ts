/**
 * La pareja a lo largo del tiempo: la discusión por el móvil, la distancia entre ciudades, los
 * amigos que no la soportan, las vacaciones de las que nadie vuelve igual. Más cotidiano y menos
 * épico que las otras: son las escenas que, sumadas, deciden si una relación dura. Todas
 * requieren que tengas pareja ("pareja") y varias la ponen a prueba.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const PAREJA3: BankScene[] = [
  S("p3-movil", "pareja", { flags: ["pareja"], minAge: 19, clubTurns: [3, 400], notFlags: ["p3_movil"] }, "vida",
    "{pareja} te dice que pasas más tiempo con el móvil que con ella",
    "No lo dice con enfado, sino con cansancio, en el sofá, con las rodillas dobladas contra el pecho. «Cuando cenamos, miras la pantalla. Cuando hablamos, miras la pantalla. Si me desmayo, probablemente me hagas una foto». Te ríes por reflejo, y ella no. Te das cuenta de que lleva semanas esperando que levantes la vista. El móvil, en la mesa, vibra. Los dos lo miráis. Ninguno se mueve.",
    [
      o("a", "Apagar el móvil y proponer una cena sin pantallas esa misma noche", "Dejarlo a un lado", { moral: 6, flags: { p3_movil: "apago" } }, "Cenáis a la luz de una vela, sin móviles, con una pasta mediocre y una conversación excelente. A las once, os damos cuenta de que no habéis mirado la pantalla ni una vez. Prometéis repetirlo cada viernes."),
      o("b", "Prometer que lo cuidarás y poner límites con una aplicación", "Una solución práctica", { moral: 3, forma: 1, flags: { p3_movil: "limites" } }, "Instalas una aplicación que te cierra el móvil a las nueve. Los primeros días, la odias. A la semana, descubres que tienes más tiempo para leer y para hablar. {pareja} te regala un libro con una dedicatoria: «Gracias por volver»."),
      o("c", "Quitarle importancia: es parte de tu trabajo", "Defenderte", { moral: -3, flags: { p3_movil: "defiendo" } }, "Dices que, con tu fama, el móvil es una obligación. {pareja} asiente, con los ojos bajos. «Entiendo». No añade nada más. Esa noche, el sofá te parece muy grande."),
    ]),
  S("p3-movil-vuelve", "pareja", { after: [after("p3-movil", "c", 6, 50)], flags: ["pareja"] }, "vida",
    "{pareja} se va unos días con su hermana y la casa te parece enorme",
    "Se ha ido con una maleta pequeña y una nota: «Necesito pensar. No es el fin. Es una pausa». Los dos primeros días, te alegras del silencio. Al tercero, empiezas a oír cosas: el frigorífico, el reloj de pared, tus propios pasos. Al cuarto, te sorprendes buscando su taza en la cocina. En el móvil, ni una llamada. Esta vez, no es porque nadie escriba.",
    [
      o("a", "Escribirle una carta larga, a mano, contándole lo que sientes", "Poner el corazón en papel", { moral: 5, reputacion: 2, flags: { p3_movil_carta: true } }, "Tardas una tarde. La entregas a mano en casa de su hermana. {pareja}, al leerla, te llama esa misma noche. Hablaréis hasta las tres. Al día siguiente, vuelve con una sonrisa que, por fin, es la de antes."),
      o("b", "Dejarle espacio y esperar a que sea ella quien dé el paso", "Respetar la pausa", { moral: -3, flags: { p3_movil_carta: "espero" } }, "Pasan nueve días. Una tarde, abre la puerta con la maleta. «He pensado —dice—. Y quiero que cambiemos algunas cosas». Se sienta frente a ti y empieza una lista. La escuchas con atención y sin móvil."),
      o("c", "Salir a buscarla a la puerta de su trabajo con un ramo de flores", "Un gesto de película", { moral: 6, patrimonio: -100, flags: { p3_movil_carta: "flores" } }, "{pareja} sale del trabajo con el abrigo puesto, te ve y se queda inmóvil. «Eres un cursi», dice, con los ojos brillantes. La abrazas. Os vais a cenar sin móviles. A partir de ese día, hay una norma en casa."),
    ]),
  S("p3-distancia", "pareja", { flags: ["pareja"], minAge: 20, clubTurns: [1, 6], notFlags: ["p3_distancia_ciudad", "convivencia"] }, "vida",
    "Te traspasan a otra ciudad y {pareja} se queda donde está, por trabajo",
    "Es la primera vez que os separan más de quinientos kilómetros. La despedida es en la estación, con las maletas, las lágrimas y la frase de siempre: «Nos veremos cada semana». Pero los billetes son caros, los entrenamientos largos y los horarios, imposibles. Las videollamadas se alargan hasta las doce, y los fines de semana, a veces, uno de los dos no puede viajar. Se instala una distancia que no es solo geográfica.",
    [
      o("a", "Comprarte un billete cada quince días y organizar visitas con ilusión", "Hacer el esfuerzo", { patrimonio: -300, moral: 4, forma: -1, flags: { p3_distancia_ciudad: "esfuerzo" } }, "Los viajes se convierten en rituales: la bufanda en el tren, la cena en la estación, el abrazo largo en la puerta. A los seis meses, ella te dice: «Estoy pensando en mudarme». Es la mejor frase del año."),
      o("b", "Proponerle que se mude contigo y buscarle trabajo allí", "Dar el paso grande", { patrimonio: -800, moral: 5, rel_representante: 2, flags: { p3_distancia_ciudad: "mudanza", convivencia: true } }, "{pareja} lo piensa tres días. Luego dice: «Vale». Se muda con una maleta, un cactus y una colección de libros. La casa, de golpe, huele distinto. El primer mes es un caos precioso."),
      o("c", "Dejar que el tiempo decida y confiar en que lo aguantaréis", "Fiarte del destino", { moral: -2, flags: { p3_distancia_ciudad: "tiempo" } }, "Las llamadas se espacian. Los viajes, también. A los cinco meses, os dais cuenta de que os habéis dejado de buscar. La ruptura es suave, casi cortés, y la lamentáis más de lo que decís."),
    ]),
  S("p3-amigos", "pareja", { flags: ["pareja"], minAge: 19, clubTurns: [3, 400], notFlags: ["p3_amigos"] }, "vida",
    "Tus amigos de siempre no soportan a {pareja} y te lo dicen sin anestesia",
    "Fue en una cena, con las cervezas a medias y un silencio incómodo cuando {pareja} se levantó al baño. «Tío, no te lo tomes a mal —dijo el de siempre—. Pero esa tía te cambia». Los demás asintieron, sin atreverse a mirarte. Sientes cómo te sube el calor por el cuello. Quieres defenderla y, al mismo tiempo, quieres entender qué ven ellos que tú no ves.",
    [
      o("a", "Defenderla con firmeza y explicar por qué la quieres", "Poner el pie en el suelo", { moral: 3, reputacion: 3, flags: { p3_amigos: "defiendo" } }, "Dices que la elegiste, que la conoces y que no hay más que hablar. Se hace un silencio, luego una disculpa torpe. A la semana siguiente, uno de ellos te escribe: «Perdona. Me pasé». La amistad se salva, pero cambia."),
      o("b", "Escuchar sus motivos y ponerlos en la balanza", "Reflexionar", { moral: 1, flags: { p3_amigos: "reflexiono" } }, "Les pides que te lo expliquen, con calma. Hay cosas ciertas y cosas exageradas. Esa noche, en casa, le cuentas a {pareja} lo que dijeron. Ella llora un poco. Luego, empiezan una conversación honesta que os acerca."),
      o("c", "Dejar de ver a esos amigos por un tiempo", "Distanciarte", { moral: -3, rel_vestuario: -1, flags: { p3_amigos: "distancia" } }, "El grupo se silencia. Al principio, no lo notas. A los seis meses, descubres que te faltan los chistes malos, las pachangas, las cenas de los jueves. Algo se ha roto, y no sabes si merece la pena arreglarlo."),
    ]),
  S("p3-vacaciones-mal", "pareja", { flags: ["pareja"], minAge: 20, turn: [1, 2], patrimonio: [2500, 100000000], notFlags: ["p3_vacaciones"] }, "vida",
    "Las vacaciones de pareja salen fatal: lluvia, un hotel con goteras y una discusión por un mapa",
    "Fue idea de {pareja}: un viaje sorpresa a un pueblo de montaña con un hotel «con encanto». El encanto era una gotera sobre la cama, una calefacción que no funcionaba y un camarero que no hablaba ningún idioma que conocierais. A la segunda noche, después de pelearos con un mapa de papel en medio de la lluvia, os quedáis en silencio, empapados, con los zapatos llenos de barro. Y entonces, ella se ríe.",
    [
      o("a", "Reírte con ella y convertir el desastre en una aventura", "Disfrutar del caos", { moral: 8, flags: { p3_vacaciones: "risa" } }, "Os pasáis la noche jugando a las cartas con una linterna, compartiendo una tableta de chocolate. A la mañana, el sol sale. Es la mejor mala semana de vuestras vidas. Cada vez que llueve, hay una canción: «el hotel de la gotera»."),
      o("b", "Cambiar de hotel por la mañana, pagando lo que haga falta", "Resolverlo con dinero", { patrimonio: -900, moral: 3, flags: { p3_vacaciones: "dinero" } }, "El nuevo hotel es cómodo, anodino, perfecto. El resto del viaje es agradable pero sin historia. Cuando volváis a casa, nadie recordará ese hotel. Todo el mundo recordará el de la gotera."),
      o("c", "Volver a casa antes de tiempo por el mal humor", "Abandonar", { moral: -3, flags: { p3_vacaciones: "vuelvo" } }, "Os pasáis el viaje de vuelta sin hablar. En casa, os acostáis en lados distintos de la cama. A la mañana siguiente, ella te dice: «No quería acabar así». Lo repetís en el desayuno. Pero queda algo pendiente."),
    ]),
  S("p3-celos-compañera", "pareja", { flags: ["pareja"], minAge: 20, fama: [40, 100], clubTurns: [3, 400], notFlags: ["p3_celos"] }, "vida",
    "Una compañera del club de comunicación te trata con una complicidad que {pareja} nota enseguida",
    "No hay nada. Lo sabes tú, lo sabe ella, lo sabe el club. Pero cuando la encargada de prensa, una chica de tu edad, te manda mensajes de trabajo con emojis y un humor ágil, {pareja} lo ve en la pantalla y se queda callada. En la cena, remueve la sopa. «Es muy simpática», dice. Con una frase tan breve, flota todo un debate.",
    [
      o("a", "Hablarlo con calma y enseñarle el chat sin que lo pida", "Transparencia", { moral: 5, reputacion: 2, flags: { p3_celos: "transparencia" } }, "Le pasas el móvil. Ella lo mira sin leer. «No hacía falta», dice. Luego sonríe: «Pero gracias». Esa noche, con una confianza renovada, os quedáis charlando de todo menos de eso."),
      o("b", "Quitarle importancia con una broma y seguir cenando", "Evitar el drama", { moral: -1, flags: { p3_celos: "broma" } }, "La broma queda a medias. {pareja} sonríe sin ganas. Dos días después, la veis en el pasillo del club y se saludan con una cortesía helada. Tú sufres la escena como espectador de una obra que no entiendes."),
      o("c", "Hablar con la encargada de prensa y pedirle que mantenga un tono más profesional", "Poner límites", { moral: 2, reputacion: 3, rel_vestuario: -1, flags: { p3_celos: "limites" } }, "La encargada, un poco sorprendida, accede con tacto. «Perdón, no quise incomodar», dice. A la semana, os dedica una frase amistosa en una nota de prensa. Todo se normaliza, pero con una distancia sana."),
    ]),
  S("p3-regalo-aniversario", "pareja", { flags: ["pareja"], minAge: 19, patrimonio: [1500, 100000000], clubTurns: [3, 400], notFlags: ["p3_regalo"] }, "vida",
    "Se te ha olvidado el aniversario y solo se te ocurre una cosa",
    "Son las seis de la tarde y {pareja} acaba de enviarte un mensaje con corazones: «Nos vemos esta noche. Tengo una sorpresa». Te quedas helado. El calendario, que habías ignorado durante semanas, muestra una fecha subrayada en rojo. No tienes regalo, ni reserva, ni excusa. Un compañero, desde el banco, ve tu cara y pregunta: «¿Qué pasa?». «Nada —murmuras—. Una emergencia».",
    [
      o("a", "Confesarlo con humor y pedir ayuda al vestuario para improvisar algo", "Pedir socorro", { rel_vestuario: 5, moral: 4, patrimonio: -150, flags: { p3_regalo: "socorro" } }, "En media hora, el vestuario aporta ideas absurdas. Compras flores, un chocolate y una tarjeta con letra torcida. {pareja}, al verte llegar corriendo, sonríe: «Se te ha olvidado, ¿verdad?». «Sí», admites. Y por eso mismo, os reís."),
      o("b", "Improvisar una cena en casa con lo que haya en la nevera", "Cocinar con cariño", { moral: 6, flags: { p3_regalo: "cocina" } }, "La cena es un desastre magnífico: pasta recocida, ensalada de bolsa, una vela de cumpleaños. {pareja} se ríe, se emociona y se come hasta las migas. «Es el mejor aniversario», dice. Mientras tú piensas que has salvado el pellejo."),
      o("c", "Reservar el restaurante más caro de la ciudad y comprar la joya más cara", "Remediarlo con dinero", { patrimonio: -2200, moral: 2, flags: { p3_regalo: "caro" } }, "La cena es perfecta; el regalo, impresionante. {pareja} lo agradece con una sonrisa cortés. Al volver a casa, te dice: «Preferiría algo más tuyo». Te da vueltas toda la noche."),
    ]),
  S("p3-vivir-juntos-lio", "pareja", { flags: ["pareja", "convivencia"], minAge: 20, clubTurns: [3, 400], notFlags: ["p3_hogar"] }, "vida",
    "El primer gran desacuerdo de la convivencia: la colocación de los platos",
    "Parece una tontería, pero no lo es: ella los coloca de arriba abajo, tú de izquierda a derecha. Ella los lava al momento, tú al día siguiente. A la tercera discusión, el escurreplatos se convierte en un campo de batalla. Un compañero que os visita, al ver la tensión, bromea: «¿Qué es esto, la guerra de las dos Rosas?». Ni {pareja} ni tú os reís. Dentro de ti, sabes que no son los platos.",
    [
      o("a", "Proponer un pacto: una semana lavas tú, otra ella", "Negociar", { moral: 4, flags: { p3_hogar: "pacto" } }, "El pacto, escrito en un papel pegado en la nevera, incluye una cláusula: «Quien rompa un plato, paga la cena». Se cumple con una exactitud casi religiosa. En seis meses, el papel se llena de dibujos de ambos."),
      o("b", "Ceder en todo y dejar que ella organice la cocina", "Rendirte con elegancia", { moral: 1, flags: { p3_hogar: "cedo" } }, "Los platos, de repente, están siempre limpios. Pero un día, al abrir el armario, ves una disposición que no entiendes. «Lo de la derecha a la izquierda —dice ella—. No es por ti». Te rindes de nuevo. Y empiezas a sentir que la casa ya no es tuya."),
      o("c", "Hablar con ella de lo que de verdad os preocupa, más allá de los platos", "Ir al fondo", { moral: 6, reputacion: 2, flags: { p3_hogar: "fondo" } }, "Te dice que se siente sola cuando viajas. Tú, que tienes miedo de perderla. Os quedáis hablando hasta las tantas. Los platos, esa noche, los lava ella. Y los coloca como quiera. Es la última discusión por ese tema."),
    ]),
  S("p3-hijos-decision", "pareja", { flags: ["pareja"], minAge: 24, clubTurns: [4, 400], notFlags: ["hijos", "p3_hijos"] }, "vida",
    "Hablar de tener hijos con {pareja} en medio de una temporada complicada",
    "Es un domingo por la tarde, con el balcón abierto y un silencio cómodo. {pareja} deja el libro y dice, sin preámbulo: «¿Has pensado en ser padre?». Te quedas mirando el techo. Hay partidos, viajes, concentraciones, una carrera que no admite pausas. Pero también hay una mirada franca a tu lado. «Sí», dices al fin. «Y me da miedo». Ella sonríe: «A mí, también».",
    [
      o("a", "Proponer empezar a intentarlo en la próxima temporada", "Dar el paso", { moral: 7, flags: { p3_hijos: "si", embarazo_deseado: true } }, "Hacéis un calendario, con fechas y reglas. A los pocos meses, las dos rayitas aparecen. Os abrazáis en la cocina, sin palabras, como dos niños que han hecho una travesura enorme."),
      o("b", "Dejarlo para dentro de unos años, cuando la carrera lo permita", "Posponer", { moral: 1, flags: { p3_hijos: "luego" } }, "Se lo decís el uno al otro con una paz tranquila. Pero con el tiempo, el «después» se hace largo, y en cada cena familiar, los primos sin hijos recogen preguntas con tacto. Hay decisiones que no se toman, se aplazan."),
      o("c", "Reconocer que no lo tienes claro y pedirle que sea paciente", "Ser sincero", { moral: -1, reputacion: 1, flags: { p3_hijos: "dudo" } }, "{pareja} asiente, con una sombra de tristeza. «Lo entiendo —dice—. Pero que no sea eterno». Os quedáis callados un rato. Luego, abrazados. Algunas conversaciones no tienen final."),
    ]),
];
