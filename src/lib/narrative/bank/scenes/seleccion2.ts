/**
 * Con la selección, más allá de los partidos: el hotel, el himno con la familia en la grada, el
 * día que te dejan fuera de la lista y el día que te vuelven a llamar. Solo salen si ya has debutado.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const SELECCION2: BankScene[] = [
  S("s2-hotel", "seleccion", { flags: ["sel_debut"], minAge: 18, notFlags: ["s2_hotel"] }, "vestuario",
    "El hotel de la concentración: veinticinco estrellas del fútbol compartiendo un pasillo",
    "El hotel es enorme, con una sala de juegos, una piscina que nadie usa y un pasillo de habitaciones donde se oyen risas, ronquidos y partidas de cartas. A tu lado duerme un portero mítico que ronca como una tormenta y, al fondo, un delantero legendario que, por increíble que parezca, tiene miedo a los ascensores. El primer día, el seleccionador pide silencio. A las once, alguien monta una timba.",
    [
      o("a", "Unirte a la timba y jugar las cartas con los veteranos", "Entrar en el grupo", { rel_vestuario: 6, moral: 5, patrimonio: -150, flags: { s2_hotel: "timba" } }, "Pierdes cuarenta euros y ganas amigos. Un delantero legendario te cuenta anécdotas que nadie sabe. A las dos de la madrugada, el seleccionador asoma la cabeza, ve el panorama y dice: «Tarde. Mañana, entrenamiento»."),
      o("b", "Quedarte en tu habitación estudiando al rival", "Profesionalidad", { forma: 2, rel_entrenador: 3, rel_vestuario: -1, flags: { s2_hotel: "estudio" } }, "Revisas vídeos hasta que se te cierran los ojos. Al día siguiente, el seleccionador comenta delante de todos tus apuntes. Algunos te lo reconocen, otros te llaman «el empollón»."),
      o("c", "Visitar al portero que ronca y preguntarle cómo duerme", "Un gesto curioso", { rel_vestuario: 4, moral: 3, flags: { s2_hotel: "portero" } }, "El portero, medio dormido, te responde: «Soy un hombre de costumbres. Y de ruidos». Te regala unos tapones de oídos y la frase: «Para ganar, hay que descansar. Y para descansar, hay que callarse»."),
    ]),
  S("s2-descartado", "seleccion", { flags: ["sel_debut"], minAge: 19, notFlags: ["s2_descartado"] }, "prensa",
    "El seleccionador te deja fuera de la lista",
    "Te enteras por una notificación del móvil: una lista de veintitrés nombres sin el tuyo. Ni un mensaje, ni una llamada. Tu agente te escribe: «Esto pasa. No es personal». Pero lo es. Las cámaras ya han llegado a la puerta de tu casa para preguntarte «cómo te sientes». Tu madre, desde la cocina, ha puesto la radio a todo volumen para no escucharlo.",
    [
      o("a", "Dar la cara y decir que trabajarás para volver", "Responder con humildad", { reputacion: 5, rel_aficion: 3, moral: -2, flags: { s2_descartado: "humilde" } }, "Dices ante las cámaras que respetas la decisión y que volverás más fuerte. Al día siguiente, el seleccionador te manda un mensaje: «Me ha gustado cómo has reaccionado»."),
      o("b", "Entrenar con una rabia nueva y no hablar con la prensa", "Callar y trabajar", { forma: 3, moral: 1, flags: { s2_descartado: "callo" } }, "Te encierras en el gimnasio y en el campo. Durante tres semanas, el míster te mira con admiración y un poco de miedo. Cuando sale la siguiente lista, tu nombre vuelve a estar."),
      o("c", "Quejarte públicamente: «Hay jugadores peores que yo»", "Desahogarte", { fama: 3, rel_aficion: 2, reputacion: -4, moral: 2, flags: { s2_descartado: "queja" } }, "La frase es el titular del día. La mitad del país te da la razón, la otra mitad te llama soberbio. El seleccionador no responde. Un periodista dice: «Qué difícil es perder con elegancia»."),
    ]),
  S("s2-vuelta", "seleccion", { after: [after("s2-descartado", undefined, 5, 40)], flags: ["sel_debut"] }, "especial",
    "El seleccionador vuelve a llamarte",
    "No es una llamada protocolaria. Es un mensaje largo, escrito a mano y fotografiado: «Me equivoqué. Te necesito». Tu madre llora al leerlo; tu agente se queda sin palabras. En la lista, tu nombre está en cuarto lugar. La prensa lo celebra con la frase «El hijo pródigo vuelve a casa». Tú te limitas a llamar a quien te acompañó en los días malos.",
    [
      o("a", "Llamar al seleccionador para agradecérselo", "Con humildad", { reputacion: 5, moral: 8, rel_entrenador: 2, flags: { s2_vuelta: "gracias" } }, "Hablas dos minutos. Él te dice: «No me agradezcas nada. Te lo has ganado». Te sientas a escribir una nota para tu taquilla: «Vuelvo»."),
      o("b", "Hacer una celebración discreta con tu familia", "Compartirlo", { moral: 9, reputacion: 3, flags: { s2_vuelta: "familia" } }, "Cenas con tus padres en el comedor de siempre. Nadie brinda, nadie habla de fútbol. Tu madre te pone una segunda ración y dice: «Estás muy delgado»."),
    ]),
  S("s2-himno-grada", "seleccion", { flags: ["sel_debut"], minAge: 18, notFlags: ["s2_himno"] }, "especial",
    "Escuchas el himno con tu familia en la grada",
    "Es la primera vez que tu madre, tu padre y tu hermano pequeño van a verte con la selección. Los has localizado en la tercera fila, con unas bufandas que se compraron hace dos días. Cuando suena el himno, tú miras hacia ellos, y ellos, que cantan con una voz que no les conocías, te devuelven la mirada. Se te hace un nudo en la garganta. Y todavía no ha empezado el partido.",
    [
      o("a", "Cantar el himno con todas tus fuerzas, mirándoles", "Con el corazón", { moral: 9, rel_aficion: 5, reputacion: 3, flags: { s2_himno: "canto" } }, "Cantas y lloras a la vez, sin disimular. El equipo, a tu lado, te da una palmada. Tu madre, en la grada, se tapa la boca con las dos manos. Ese es el momento que, dentro de cuarenta años, recordarás con más claridad."),
      o("b", "Concentrarte y mantener la compostura", "Controlar la emoción", { forma: 2, moral: 3, flags: { s2_himno: "calma" } }, "Respiras hondo. Miras al frente. Cuando acaba, descubres que has apretado los dientes tanto que te duele la mandíbula. Pero juegas con una serenidad que sorprende a tus compañeros."),
    ], { isMilestone: true, milestoneType: "seleccion", imageScene: "Photorealistic photo of a young footballer singing the national anthem with hand on chest, eyes wet, family visible in the stands behind him, stadium at dusk, emotional, no logos or readable text" }),
  S("s2-capitan-leyenda", "seleccion", { flags: ["sel_debut"], minAge: 19, notFlags: ["s2_cap_leyenda"] }, "vestuario",
    "El capitán de la selección te lleva aparte antes del entrenamiento",
    "Es un tipo callado, con cuatro Mundiales a la espalda y unas manos de pianista. Te lleva a un rincón del vestuario, sin hablar, y te pasa su brazalete para que lo sostengas un instante. «Pesa, ¿verdad?», dice. «Parece que no, pero pesa». Te mira a los ojos. «Algún día lo llevarás tú. Cuando llegue, acuérdate de este peso».",
    [
      o("a", "Decirle que lo cuidarás cuando llegue el día", "Aceptar el relevo", { moral: 8, rel_vestuario: 4, reputacion: 4, flags: { s2_cap_leyenda: "relevo", capitan_futuro: true } }, "Se lo devuelves con las dos manos. Él asiente, con la solemnidad de quien ha dejado algo atrás. «Cuando llegues, te dolerá. Pero te hará mejor», dice. Esa frase te acompañará mucho tiempo."),
      o("b", "Responder con humor para quitarle solemnidad", "Bromear", { moral: 4, rel_vestuario: 2, flags: { s2_cap_leyenda: "broma" } }, "«Lo llevaré mejor que tú, por lo menos con la camiseta limpia», dices. El capitán se queda inmóvil un segundo y estalla en una risa grave. «Me caes bien, chaval»."),
    ]),
  S("s2-autobus", "seleccion", { flags: ["sel_debut"], minAge: 18, notFlags: ["s2_autobus"] }, "especial",
    "Una multitud recibe al autobús de la selección",
    "Es un tramo corto, de dos kilómetros, pero parece una procesión. Miles de personas con banderas, bufandas y pancartas lo han tomado todo: balcones, farolas, tejados. Los niños corren junto al autobús, golpeando los cristales con las palmas. Alguien lanza una bengala de colores. Uno de tus compañeros, que lleva quince años en esto, dice en voz baja: «Esto nunca se acostumbra».",
    [
      o("a", "Bajar la ventanilla y saludar a todos", "Disfrutarlo", { fama: 3, rel_aficion: 6, moral: 7, flags: { s2_autobus: "saludo" } }, "Sacas el brazo y chocas la mano de todos los que alcanzas. Un niño te grita su nombre y el tuyo a la vez. Cuando el autobús entra al hotel, tienes la mano roja y la sensación de haber sido parte de algo enorme."),
      o("b", "Observarlo en silencio desde tu asiento", "Guardarlo en la memoria", { moral: 5, reputacion: 2, flags: { s2_autobus: "silencio" } }, "No dices nada. Solo miras: las caras, las lágrimas, las pancartas torcidas. Más tarde, en el hotel, escribirás una nota en el móvil con una sola línea: «Esto es lo que significa jugar por tu país»."),
    ]),
  S("s2-penalti-seleccionador", "seleccion", { flags: ["sel_debut"], minAge: 19, notFlags: ["s2_penalti"] }, "entrenamiento",
    "El seleccionador te reta a una tanda de penaltis, él contra ti",
    "Al final de un entrenamiento de calor insoportable, el seleccionador se calza unos guantes de portero de otro siglo y dice: «A ver, el crack. Cinco penaltis. Si paro tres, hoy no te ducha nadie». El vestuario, que sabe que no hay escapatoria, se sienta a mirar con una sonrisa preventiva. Es un ex portero retirado. Pero tiene unos reflejos que asustan.",
    [
      r("a", "Tirar con fuerza al ángulo", "Ir al grano", 0.5, "Le marcas cuatro de cinco. El seleccionador, con las manos en la cintura, resopla y te estrecha la mano. «Hoy se ducha todo el mundo —dice—. Y tú, el primero». El vestuario te aplaude como si hubieras ganado una final.", { moral: 7, rel_entrenador: 4, rel_vestuario: 3, flags: { s2_penalti: "gano" } }, "Falla tres. El seleccionador celebra cada parada con un gesto teatral. «El crack no es tan crack», dice, riendo. Pasas la tarde bajo la mirada burlona de todos. Pero te ríes a la vez.", { moral: 2, rel_vestuario: 4, flags: { s2_penalti: "pierdo" } }, "forma"),
      o("b", "Proponer un trato: el que pierde invita al café", "Negociar", { moral: 3, rel_vestuario: 2, rel_entrenador: 1, flags: { s2_penalti: "cafe" } }, "El seleccionador sonríe: «Trato». Marcas tres y paras dos. Quedáis empatados. Pagáis los dos. La charla de café que sigue es la más honesta que has tenido con un entrenador."),
    ]),
  S("s2-vuelo", "seleccion", { flags: ["sel_debut"], minAge: 18, notFlags: ["s2_vuelo"] }, "vestuario",
    "El vuelo de catorce horas con toda la selección",
    "Veinticinco jugadores, doce miembros del cuerpo técnico y una azafata que ya ha perdido la paciencia. Las primeras tres horas son un desfile de bromas, partidas de cartas y competiciones de sueño. A la sexta, alguien canta. A la novena, un portero se queda dormido en el hombro de un delantero. A la duodécima, el seleccionador, con unas ojeras de película, pide silencio.",
    [
      o("a", "Montar un concurso de chistes con premio de un bocadillo", "Animar el vuelo", { rel_vestuario: 6, moral: 5, fama: 1, flags: { s2_vuelo: "chistes" } }, "El ganador es el utillero, con un chiste sobre un pingüino y una lavadora que hace llorar de risa a la azafata. El premio, un bocadillo de jamón, se lo disputan a cuatro bandas. Es, probablemente, lo más cohesionador que se haya hecho en la selección."),
      o("b", "Dormir con antifaz y tapones", "Aislarte", { forma: 3, moral: 1, flags: { s2_vuelo: "duermo" } }, "Duermes ocho horas seguidas. Cuando te despiertas, el avión ha aterrizado y tus compañeros te saludan con ojos de zombis. «Qué suerte tienes», murmuran. No dices que es entrenamiento."),
      o("c", "Pasar el vuelo estudiando el siguiente partido", "Concentrarte", { rel_entrenador: 3, forma: 1, flags: { s2_vuelo: "estudio" } }, "Subrayas cada jugada en el portátil. El seleccionador te ve y levanta el pulgar. Pero a mitad del vuelo, un compañero te pone en el hombro un peluche gigante de un ave. «Para que no te agobies»."),
    ]),
  S("s2-capitan-adios", "seleccion", { flags: ["sel_debut"], minAge: 24, media: [75, 99], notFlags: ["s2_cap_adios"] }, "especial",
    "El capitán de la selección anuncia su retirada y te pide un favor",
    "Lo dice en el vestuario, tras un entrenamiento, con una voz tranquila: «Este será mi último torneo». Sin dramatismos. Los más veteranos asienten, los jóvenes miran al suelo. Luego, cuando todos se han ido, te pide que te quedes un segundo: «Cuando lo dejé, el seleccionador me dijo que tú serías el siguiente. Cuida a los chavales».",
    [
      o("a", "Prometer que cuidarás del grupo", "Aceptar el testigo", { moral: 7, reputacion: 6, rel_vestuario: 6, flags: { s2_cap_adios: "acepto", capitan_futuro: true } }, "Se lo dices con firmeza. Él te da un abrazo corto y se marcha sin mirar atrás. A la mañana siguiente, el brazalete aparece en tu taquilla, con una nota: «Aún no. Pero pronto»."),
      o("b", "Pedirle que se quede un año más", "Aferrarte a él", { moral: 2, rel_vestuario: 3, flags: { s2_cap_adios: "pido" } }, "Se lo pides con la voz rota. Él sonríe: «Lo he pensado, de verdad». Pero su decisión está tomada. Esa noche, tu móvil suena: es él, con un mensaje de voz de treinta segundos. «Gracias por pedírmelo»."),
    ]),
];
