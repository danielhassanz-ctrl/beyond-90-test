/**
 * Más de tu generación: {mega1}, {mega2} y {mega3} (los megacracks de otros clubes) y {peer1} y
 * {peer2} (tus compañeros de edad). Escenas de respeto, de pique, de curiosidad: el premio que se
 * llevó otro, el fichaje que dolió, el mensaje de madrugada. Los mismos nombres durante toda la carrera.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const RIVALES2: BankScene[] = [
  S("rv2-mega-premio", "rival", { minAge: 17, maxAge: 26, fama: [35, 100], clubTurns: [4, 400], notFlags: ["rv2_premio"] }, "prensa",
    "{mega1} se lleva un premio que tú esperabas y las redes se dividen",
    "La gala fue anoche, con focos, trajes de gala y un sobre que se abrió demasiado despacio. {mega1}, de {mega1_club}, subió al escenario con una sonrisa que tú conoces de las portadas. En la sala, tus compañeros te miraron de reojo. Esta mañana, en redes, hay un hilo con tus cifras al lado de las suyas. Algunos te dan la razón. Otros, no. Tu agente, por teléfono, dice: «Hay que responder».",
    [
      o("a", "Felicitarle públicamente con elegancia", "Ser deportista", { reputacion: 7, rel_aficion: 4, moral: -1, flags: { rv2_premio: "felicito", rv_mega_amigo: true } }, "Escribes: «Enhorabuena, {mega1}. Te lo mereces». Es un mensaje breve. {mega1} lo responde con un emoji de abrazo. A los dos días, os cruzáis en un restaurante y os dais la mano. Es el primer paso de un respeto largo."),
      o("b", "Responder con un pique elegante: «El año que viene, me toca a mí»", "Picarle con gracia", { fama: 4, rel_aficion: 5, moral: 3, flags: { rv2_premio: "pique", rv_mega: "pique" } }, "La frase se hace titular. {mega1}, desde su club, contesta con otra: «Te espero». Medio país sigue el duelo por redes. Es el comienzo de una rivalidad que alimentará ambas carreras."),
      o("c", "Callar y entrenar el doble los próximos meses", "Dejar que hable el campo", { forma: 3, moral: -1, flags: { rv2_premio: "callo" } }, "No dices nada. Pero cada tarde, durante tres meses, entrenas una hora más que los demás. Cuando, a final de temporada, las cifras vuelven a compararse, las tuyas ganan. Y no hace falta que lo digas."),
    ]),
  S("rv2-mega-fichaje-dolor", "rival", { minAge: 17, maxAge: 27, clubTurns: [4, 400], market: "abierta", notFlags: ["rv2_fichaje"] }, "prensa",
    "{mega2} firma por tu club soñado y tú te enteras por un titular",
    "Lo cuentan los diarios con letra enorme: {mega2}, el {mega2_pos} de {mega2_club}, ficha por el club al que siempre quisiste ir. Tu agente te llama a las siete de la mañana con una voz medida: «No tenías oferta de ellos, ¿verdad?». Te quedas inmóvil en la cama. Piensas en las veces que te imaginaste con esa camiseta. En la cocina, tu madre, que lo ha oído, apaga la radio con un golpe suave.",
    [
      o("a", "Felicitarle y mandarle tu mejor deseo", "Elegir la generosidad", { reputacion: 6, moral: -2, flags: { rv2_fichaje: "felicito" } }, "«Te lo mereces», le escribes. {mega2} te responde con un «Gracias, de corazón». A los meses, os cruzáis en una final, y os dais un abrazo antes de empezar. Un respeto que no esperabas."),
      o("b", "Convertir la envidia en objetivo y fijarte un plazo", "Usar el dolor", { forma: 3, moral: 2, flags: { rv2_fichaje: "objetivo" } }, "Escribes en la nevera: «Dos años». Entrenas con una rabia nueva. Cada gol que marcas, lo dedicas mentalmente a ese club. A los diecinueve meses, tu agente recibe una llamada que te cambia la vida."),
      o("c", "Dejar que te hunda unos días y llamar a tu psicólogo", "Reconocer el golpe", { moral: -4, forma: -1, reputacion: 2, flags: { rv2_fichaje: "golpe" } }, "Pasas tres días de mal humor. El psicólogo te dice: «Es humano». Te propone un ejercicio de gratitud. A la semana, has escrito una lista de todo lo que tienes. Y casi sonríes."),
    ]),
  S("rv2-mega-mensaje", "rival", { minAge: 17, maxAge: 28, fama: [30, 100], clubTurns: [4, 400], notFlags: ["rv2_mensaje"] }, "vida",
    "{mega3} te manda un mensaje de madrugada: «¿Tú también estás despierto?»",
    "Son las tres de la mañana y el móvil vibra en la mesilla. Es {mega3}, de {mega3_club}, el que el mundo ve como un chico de acero. Su mensaje, escrito sin mayúsculas, dice: «no puedo dormir. mañana juego la final. ¿tú cómo lo llevas?». Te quedas mirando la pantalla, con el corazón acelerado. Detrás de ese nombre famoso, hay alguien tan asustado como tú.",
    [
      o("a", "Responder con sinceridad y quedaros hablando una hora", "Abrirte", { moral: 6, reputacion: 3, flags: { rv2_mensaje: "hablo", rv_mega_amigo: true } }, "Le cuentas que tú, antes de cada partido, repites una frase de tu abuelo. Él te cuenta la suya. A las cuatro y media, os despedís con un «suerte». Al día siguiente, ganáis o perdéis, pero sabéis que hay alguien más en vela."),
      o("b", "Contestar con humor para quitarle tensión", "Un chiste de madrugada", { moral: 4, rel_vestuario: 1, flags: { rv2_mensaje: "chiste" } }, "«Cuenta ovejas con camiseta de tu club», escribes. {mega3} responde con tres emojis de risa. Os quedáis intercambiando bromas malas hasta que os venza el sueño. Es una forma de compañía."),
      o("c", "No contestar para no perder concentración", "Mantener el foco", { moral: 0, flags: { rv2_mensaje: "no" } }, "Dejas el móvil boca abajo. Al día siguiente, lees el mensaje de nuevo. Te arrepientes un poco. Pero cuando, años después, os encontréis, el recuerdo seguirá ahí, como una pregunta sin respuesta."),
    ]),
  S("rv2-mega-final", "rival", { after: [after("rv2-mega-mensaje", "a", 8, 80)], minAge: 20 }, "especial",
    "{mega3} y tú os enfrentáis en una final y os dais la mano antes de empezar",
    "Es la noche más grande de tu temporada. En el túnel, antes de salir, os cruzáis, mirando al frente, con los puños apretados. Hay veinte mil gargantas esperando fuera. Sin girarse, {mega3} murmura: «Hoy no hay amigos». «Hoy no», respondes. Pero cuando salís, os dais un pequeño choque de puños, tan breve que los fotógrafos no lo captan. Es una promesa tácita.",
    [
      r("a", "Salir a ganar con todo y aprovechar cada segundo", "Competir a muerte", 0.5, "Ganas la final con un gol en el 81. Al acabar, {mega3} se acerca y te abraza: «Merecido». Es un abrazo sincero, de los que se dan los que han peleado juntos hasta el último minuto. Y esa noche, en el vestuario, celebras con una sonrisa que parece de otro.", { moral: 12, fama: 6, rel_aficion: 6, reputacion: 5, flags: { rv2_final: "gano" } }, "Pierdes la final por un gol en el 89. {mega3} te busca y te levanta del suelo. «La próxima, es tuya», dice. No sabes si creerle, pero agradeces que alguien te sujete en ese momento.", { moral: -6, rel_aficion: 1, reputacion: 4, flags: { rv2_final: "pierdo" } }, "forma"),
      o("b", "Jugar con calma, respetando al rival, y centrarte en el equipo", "Entregarte al colectivo", { moral: 5, rel_vestuario: 4, reputacion: 4, flags: { rv2_final: "equipo" } }, "No hay jugadas individuales, solo una entrega constante. El resultado, aunque ajustado, os deja satisfechos. En la prensa, alguien escribe: «Esta final fue un ejemplo». Os guardáis la frase."),
    ], { isMilestone: true, milestoneType: "titulo", imageScene: "Photorealistic photo of two young star footballers from rival teams shaking hands in a stadium tunnel just before a final, intense mutual respect, dramatic lighting, no logos or readable text" }),
  S("rv2-peer-fichaje", "rival", { minAge: 17, maxAge: 26, clubTurns: [3, 400], notFlags: ["rv2_peer_fichaje"] }, "vestuario",
    "{peer1} se va del club y te pide un favor antes de marcharse",
    "Es el último día. Con la maleta en la puerta del vestuario, {peer1} se acerca y baja la voz: «Quiero pedirte algo. Cuando me llamen de allí, si te preguntan por mí, ¿qué dirás?». Te quedas mirándole. Habéis competido por el mismo puesto, os habéis peleado y reído, habéis sido rivales y compañeros. Sabes que cualquier cosa que digas puede mejorar o arruinar su fichaje.",
    [
      o("a", "Decir la verdad: que es un gran jugador y mejor persona", "Hablar bien de él", { moral: 4, reputacion: 6, rel_vestuario: 4, flags: { rv2_peer_fichaje: "bien" } }, "{peer1} te abraza. «Tú no tienes por qué», murmura. «Lo sé», respondes. Meses después, en un partido, te marca un gol y no celebra: señala a la grada y luego a ti. Es su forma de decir «gracias»."),
      o("b", "Mantener la neutralidad: «Les diré lo que he visto»", "Ser objetivo", { reputacion: 3, moral: 1, flags: { rv2_peer_fichaje: "neutral" } }, "{peer1} asiente, algo decepcionado. «Tienes razón —dice—. Es lo justo». Al marcharse, se produce un silencio algo tenso. Pero, cuando os veáis, os saludaréis con respeto."),
      o("c", "Pedirle que, a cambio, mande tu nombre a su nuevo club", "Hacer un trato", { moral: 3, rel_representante: 2, reputacion: -1, flags: { rv2_peer_fichaje: "trato", quiere_salir: true } }, "{peer1} sonríe. «Hecho». A los dos meses, recibes una llamada de su nuevo club. No es una promesa, pero es una puerta. Y a partir de ahora, tienes un aliado en otro vestuario."),
    ]),
  S("rv2-peer-reencuentro", "rival", { after: [after("rv2-peer-fichaje", undefined, 8, 80)], minAge: 20 }, "partido",
    "Te enfrentas a {peer1} en su primer partido contra tu club",
    "Al salir, hay un detalle que te llama la atención: {peer1} lleva el mismo número que llevaba cuando era tu compañero. Sus ojos buscan los tuyos al formar. Es un partido de liga corriente, pero para vosotros, no. En el calentamiento, os cruzáis y nadie dice nada. Al final de la primera parte, un choque te lanza al suelo. {peer1}, sin dudarlo, te levanta. «Perdón», dice. «No te vi».",
    [
      o("a", "Responder con un gesto de respeto y seguir jugando", "Jugar con nobleza", { reputacion: 5, moral: 3, rel_vestuario: 2, flags: { rv2_peer_reencuentro: "nobleza" } }, "Al acabar, os dais un abrazo largo. «Estoy contento por ti», dices. «Y yo por ti», responde. Los dos sabéis que estáis donde queríais. Y que, en el fondo, siempre os ayudasteis."),
      o("b", "Marcarle un gol y celebrarlo con un gesto de guasa", "Con pique", { fama: 3, moral: 4, rel_vestuario: 2, flags: { rv2_peer_reencuentro: "pique" } }, "Le haces un caño y marcas. Celebras señalando el número que lleva. {peer1}, entre risas, levanta los brazos. Esa noche, te escribe: «Esto lo cobro en la vuelta». Os escribís hasta las dos."),
    ]),
  S("rv2-todos-juntos", "rival", { minAge: 20, maxAge: 29, flags: ["rv_mega_amigo"], fama: [50, 100], clubTurns: [4, 400], notFlags: ["rv2_cena_todos"] }, "vida",
    "Los tres megacracks de tu generación y tú os juntáis a cenar por primera vez",
    "Fue idea de un patrocinador, o quizá de un periodista, o de la casualidad: una mesa larga en un restaurante discreto, con tres sillas ocupadas por {mega1}, {mega2} y {mega3}, y una cuarta, la tuya. La primera media hora es tensa: todos miran los cubiertos. Luego, alguien cuenta una anécdota de una gira. Alguien ríe. De pronto, ya no sois rivales, sois cuatro chavales que viven lo mismo.",
    [
      o("a", "Proponer repetirlo cada año, con una regla: nada de móviles", "Fundar una tradición", { moral: 8, reputacion: 6, fama: 3, flags: { rv2_cena_todos: "tradicion" } }, "El restaurante se convierte en vuestro sitio. Cada año, el último martes de mayo, os reunís. Con el tiempo, vuestra mesa saldrá en documentales, entrevistas y chistes de vestuario. Es, sin pretenderlo, una pequeña institución."),
      o("b", "Hacer una foto grupal y subirla con una frase irónica", "Compartirlo con el mundo", { fama: 6, rel_aficion: 5, moral: 5, flags: { rv2_cena_todos: "foto" } }, "La foto, con la leyenda «Rivales por contrato, amigos por elección», se comparte un millón de veces. Cuatro patrocinadores quieren aprovechar el tirón. Los cuatro, de común acuerdo, rechazan todas las ofertas."),
      o("c", "Disfrutar de la noche en privado, sin fotos ni anuncios", "Mantener la intimidad", { moral: 7, reputacion: 4, flags: { rv2_cena_todos: "privado" } }, "No hay cámaras, ni redes. Hay cuatro sillas, mucha comida y una conversación que dura hasta las tres. Sales a la calle con la sensación de haber compartido algo que nadie, jamás, sabrá."),
    ]),
  S("rv2-peer-capitan", "rival", { minAge: 19, maxAge: 28, clubTurns: [6, 400], notFlags: ["rv2_peer_cap", "capitan_equipo"] }, "vestuario",
    "{peer2} es elegido capitán y tú no, y el vestuario espera tu reacción",
    "Fue por votación secreta. Cuando el capitán saliente lo anuncia, hay un silencio. {peer2} baja la cabeza, abrumado. Tú, que habías sentido que ese brazalete podía ser tuyo, notas cómo se te tensa la mandíbula. Los compañeros, discretos, te miran de reojo. El míster, desde la puerta, observa. Sabes que tu primera reacción dirá más de ti que cualquier gol.",
    [
      o("a", "Levantarte y ser el primero en felicitarle con un abrazo", "Ser el primero en aplaudir", { reputacion: 8, rel_vestuario: 7, moral: -1, flags: { rv2_peer_cap: "abrazo" } }, "{peer2}, emocionado, te abraza con fuerza. «Cuento contigo», murmura. «Siempre», respondes. El vestuario aplaude. Años después, en una entrevista, dirá que ese abrazo le ayudó a asumir el cargo."),
      o("b", "Aplaudir con los demás y marcharte pronto del vestuario", "Contener el golpe", { moral: -3, reputacion: 2, flags: { rv2_peer_cap: "contengo" } }, "No dices nada. Camino de casa, piensas en lo que sientes: no es rabia, es una especie de duelo por un futuro que no será. Al día siguiente, le llevas un café a {peer2}. Es tu forma de decir «estoy contigo»."),
      o("c", "Pedirle al míster una charla para entender por qué no fuiste elegido", "Buscar claridad", { rel_entrenador: 3, moral: 1, reputacion: 2, flags: { rv2_peer_cap: "charla" } }, "El míster te recibe con una calma inesperada. «Fue una votación del vestuario —explica—. Y creo que te falta algo: hablar más en los momentos difíciles». Es una crítica honesta. La anotas y empiezas a trabajarla."),
    ]),
];
