/**
 * Humor y vida social, quinta tanda: la sala de escape con todo el equipo, el concurso de
 * televisión, el sastre que no te toma medidas, la cabra del jardín del club, el mago del
 * cumpleaños. Pocas condiciones, mucha risa y un hilo pequeño que alguna otra escena recoge.
 */
import { S, o, r } from "../dsl";
import type { BankScene } from "../types";

export const HUMOR5: BankScene[] = [
  S("h5-escape-room", "humor", { minAge: 17, clubTurns: [3, 400], notFlags: ["h5_escape"] }, "vestuario",
    "El míster os encierra en una sala de escape y te toca descifrar un acertijo con el capitán",
    "Es un sótano de ladrillo con una puerta de hierro y un reloj que cuenta hacia atrás desde sesenta minutos. El míster, al otro lado del cristal, ríe con una mueca de villano. En la pared, un cuadro con símbolos, una caja con tres candados y una nota: «El único modo de salir es trabajar juntos». El portero tira de un cajón. El capitán, concentrado, lee un libro con el ceño fruncido. Tú localizas un detalle extraño en el suelo.",
    [
      o("a", "Resolver el acertijo con una idea que los demás no ven", "Ser el cerebro", { moral: 6, rel_vestuario: 5, reputacion: 3, flags: { h5_escape: "cerebro" } }, "Descubres que los símbolos son las posiciones de una táctica del míster. Encajas la clave y la puerta se abre con diez segundos de margen. Los compañeros te lanzan al aire. El míster, al otro lado, aplaude con admiración: «Qué bien me conoces»."),
      o("b", "Dejar que otro lidere y colaborar con las manos", "Ser el apoyo", { rel_vestuario: 6, moral: 4, flags: { h5_escape: "apoyo" } }, "El capitán coordina, el portero tira de las cajas, tú pasas las llaves. Salís con tres minutos de sobra. «Sois un equipo», dice el míster. Os miráis sin saber si es un elogio o una amenaza."),
      o("c", "Intentar romper la cerradura a patadas", "Fuerza bruta", { rel_vestuario: 4, moral: 3, rel_entrenador: -1, flags: { h5_escape: "patada" } }, "La cerradura aguanta. Tu tobillo, menos. Os sacan a los cuarenta minutos, entre carcajadas. El míster, con las manos en la cintura, comenta: «Siempre igual: mucha pierna y poca cabeza»."),
    ]),
  S("h5-concurso", "humor", { minAge: 18, fama: [40, 100], clubTurns: [3, 400], notFlags: ["h5_concurso"] }, "prensa",
    "Te invitan a un concurso de televisión de preguntas y descubres lo poco que sabes",
    "El plató es una sala dorada con luces de colores y un presentador con una americana brillante. Tienes tres comodines, una pantalla gigante y una pregunta de mil euros: «¿Cuál es la capital de Mongolia?». Te quedas en blanco. Entre el público, tu madre se tapa la cara. El presentador, con una sonrisa de dentista, te dice: «Tienes treinta segundos». Piensas en tu profesor de Geografía. Lo maldices en silencio.",
    [
      o("a", "Usar el comodín del público y fiarte de la gente", "Pedir ayuda", { fama: 3, rel_aficion: 4, moral: 3, flags: { h5_concurso: "publico" } }, "Un ochenta por ciento vota por «Ulán Bator». Aciertas. El público aplaude como si hubieras marcado un gol. El presentador, rendido, te regala una taza con el logo del programa. «Me han salvado», dices. Y tu madre, desde la grada, respira."),
      o("b", "Arriesgar con tu intuición y decir «Pekín»", "Fiarte del instinto", { fama: 4, moral: 2, flags: { h5_concurso: "pekin" } }, "Fallas por unos mil kilómetros. El presentador contiene la risa. El público, con cariño, te aplaude. Alguien, en redes, escribe: «El 9 de la selección de Geografía». Una editorial te manda un atlas con una dedicatoria."),
      o("c", "Retirarte con elegancia y quedarte con lo ganado", "Plantarte a tiempo", { patrimonio: 500, moral: 3, flags: { h5_concurso: "retiro" } }, "Te retiras con quinientos euros y una sonrisa. «Un gran jugador sabe cuándo parar», dice el presentador. Tu madre, entre el público, asiente con aprobación. Y tú, por primera vez, te sientes inteligente."),
    ]),
  S("h5-sastre", "humor", { minAge: 18, patrimonio: [2000, 100000000], clubTurns: [3, 400], notFlags: ["h5_sastre"] }, "vida",
    "Un sastre de toda la vida te hace un traje a medida y te mide con una cinta de cuarenta años",
    "Se llama don Aurelio, tiene el pelo blanco, un chaleco con relojes y una voz tranquila que hace que todo parezca importante. Te pone frente a un espejo, saca una cinta métrica de otro siglo y empieza a murmurar números. «Hombro: 48. Pecho: 102. Cintura: un respeto». Te explica que un buen traje no se compra, se «construye». Con cada medida, te sientes más importante. Al final, te ofrece un café.",
    [
      o("a", "Dejarle total libertad y confiar en su criterio", "Fiarte del maestro", { patrimonio: -1200, moral: 5, reputacion: 3, flags: { h5_sastre: "libertad" } }, "El traje es perfecto. Cuando lo estrenas en un acto, te dicen: «Qué bien te sienta». Don Aurelio, al saberlo, te manda una nota: «El traje es la mitad. La otra mitad, eres tú»."),
      o("b", "Pedirle un diseño más moderno y arriesgado", "Atreverte", { patrimonio: -1300, fama: 3, moral: 4, flags: { h5_sastre: "moderno" } }, "El resultado, con un forro naranja y botones de nácar, es polémico. En redes, algunos lo adoran, otros lo detestan. Don Aurelio, al enterarse, sonríe: «Todo traje que no deja indiferente es un buen traje»."),
      o("c", "Pedir una versión barata y rápida", "Buscar lo práctico", { patrimonio: -400, moral: 0, flags: { h5_sastre: "barato" } }, "Don Aurelio, algo dolido, accede. El traje es correcto. En la primera lluvia, se encoge un poco. «Siempre se aprende», dice cuando se lo cuentas. Y te hace uno mejor, con descuento, esa misma semana."),
    ]),
  S("h5-cabra", "humor", { minAge: 16, clubLevels: ["modesto", "europeo"], clubTurns: [3, 400], notFlags: ["h5_cabra"] }, "vida",
    "Una cabra se instala en el jardín de la ciudad deportiva y el club la adopta como mascota",
    "Apareció una mañana, mordisqueando el seto de la entrada. Lleva una campanilla, una mirada de reina y una determinación indomable. Nadie sabe de dónde ha salido. El jardinero, que la odia, la ha llamado «Aurora». El utillero, que la adora, la ha llamado «Maradona». La cabra, indiferente, se ha comido el segundo pantalón de un compañero. El presidente, en la puerta, reflexiona: «Quizás es un símbolo».",
    [
      o("a", "Proponer que sea la mascota oficial y hacerle una camiseta", "Adoptarla", { rel_aficion: 6, rel_vestuario: 5, moral: 4, flags: { h5_cabra: "adopto" } }, "La camiseta, con el número 1, le queda enorme. El club la presenta en un acto oficial. La cabra, nerviosa, se come el micrófono. Desde entonces, es la imagen del club en tres campañas publicitarias. Es, sin duda, el fichaje más mediático del año."),
      o("b", "Contactar con un granjero de la zona por si es suya", "Buscar al dueño", { reputacion: 4, moral: 2, flags: { h5_cabra: "dueno" } }, "Aparece un granjero con un lazo y cara de resignación. «Se escapa cada primavera», dice. Pero ante las lágrimas del utillero, accede a cederla en préstamo los fines de semana. Es un acuerdo que ningún club había firmado."),
      o("c", "Pedir que la lleven a una granja y no darle más vueltas", "Ser práctico", { moral: 0, flags: { h5_cabra: "granja" } }, "Una tarde, un camión se la lleva. El utillero, con los ojos húmedos, la despide con un pan. Una semana después, recibe un vídeo: la cabra, feliz, rodeada de otras cabras. «Está bien», dice. Y se le pasa la pena."),
    ]),
  S("h5-mago", "humor", { minAge: 16, clubTurns: [3, 400], notFlags: ["h5_mago"] }, "vida",
    "Un mago contratado para el cumpleaños de un compañero te hace desaparecer el reloj",
    "Es una fiesta infantil, con globos, pastel y niños gritando. El mago, con un sombrero de copa torcido, pide un voluntario. Todos te señalan. Subes con la cara colorada. El mago te pide que le prestes un objeto de valor. Le das tu reloj. Lo envuelve en un pañuelo, lo golpea con una varita y, ¡puf!, desaparece. Los niños aplauden. El mago te mira, sonríe y dice: «Ahora, a buscarlo».",
    [
      o("a", "Seguirle el juego con entusiasmo y buscar el reloj entre los niños", "Entrar en el truco", { moral: 6, rel_vestuario: 4, fama: 2, flags: { h5_mago: "juego" } }, "Los niños te ayudan a buscar. A los diez minutos, el reloj aparece dentro de una tarta, con una nota: «Feliz cumpleaños». El mago, tras una reverencia, te lo devuelve. El niño del cumpleaños te abraza. Es un truco que nadie olvidará."),
      o("b", "Mostrar tu desconfianza y pedirle que lo devuelva ya", "Ser el aguafiestas", { moral: -1, rel_vestuario: -1, flags: { h5_mago: "desconfianza" } }, "El mago, algo ofendido, lo devuelve de inmediato. Los niños te miran con decepción. Un compañero, entre risas, susurra: «Eres el que más se ha tomado en serio un truco»."),
      o("c", "Subir al escenario para ayudar al mago con un cambio de truco", "Ser su cómplice", { rel_vestuario: 5, fama: 3, moral: 5, flags: { h5_mago: "complice" } }, "Con una complicidad inesperada, haces desaparecer un balón. Los niños gritan. El mago, entusiasmado, te propone un trabajo a tiempo parcial. «Eres un natural», dice. Lo dejas pasar, pero te queda la duda."),
    ]),
  S("h5-quiz-vestuario", "humor", { minAge: 17, clubTurns: [3, 400], notFlags: ["h5_quiz"] }, "vestuario",
    "El vestuario organiza un concurso de preguntas sobre la historia del club y tú no sabes ni una",
    "El utillero ha montado un panel con tarjetas, un timbre y un premio: una camiseta firmada de un ídolo. La primera pregunta: «¿Quién marcó el gol del ascenso en el 87?». Silencio. La segunda: «¿Cuántos títulos tiene la Copa?». Silencio. El capitán, que es de los de casa, responde a todo con una precisión escalofriante. Tú, con la cara de un alumno que no ha estudiado, miras al portero. Él, también.",
    [
      o("a", "Confesarlo con humor y proponer que el que menos sepa pague el café", "Aceptar la derrota", { rel_vestuario: 5, moral: 4, patrimonio: -30, flags: { h5_quiz: "cafe" } }, "Pierdes por goleada. Pagas el café. El capitán, sorprendido, te regala un libro de historia del club con una dedicatoria: «Para que sepas por quién juegas». Lo lees en dos semanas. Te cambia la forma de pisar el campo."),
      o("b", "Hacer trampas con el móvil escondido", "Jugar sucio", { rel_vestuario: 2, reputacion: -2, moral: 2, flags: { h5_quiz: "trampa" } }, "Ganas tres preguntas con el móvil bajo la mesa. El utillero, que lo ve, no dice nada. Al final, el capitán te mira: «¿Seguro que sabías lo de la Copa del 62?». Te rindes con una sonrisa. Pierdes la camiseta y ganas un mote: «Wikipedia»."),
      o("c", "Pedir una segunda ronda con preguntas más generales", "Cambiar las reglas", { rel_vestuario: 3, moral: 2, flags: { h5_quiz: "ronda" } }, "El utillero accede. Las preguntas son sobre cine, música y comida. Ganas tú. El capitán, resignado, te entrega la camiseta. «Sabes más de lo que parece», dice. Y tú: «Pero menos de lo que debería»."),
    ]),
  S("h5-flash-mob", "humor", { minAge: 16, clubTurns: [3, 400], notFlags: ["h5_flash"] }, "vida",
    "Un flash mob en un centro comercial te sorprende bailando sin querer",
    "Estás en la cola de una tienda de deportes, con una bolsa en la mano, cuando de repente suena una música. Un grupo de gente empieza a bailar. Una chica, a tu lado, te sonríe y te agarra de la muñeca. En dos segundos, estás en el centro del círculo, con cincuenta personas imitando una coreografía que no conoces. Un fotógrafo, entusiasmado, dispara. El video, esa noche, recorre las redes.",
    [
      o("a", "Entregarte al baile con la mayor seriedad posible", "Dejarte llevar", { fama: 5, rel_aficion: 5, moral: 6, flags: { h5_flash: "baile" } }, "Improvisas pasos de jota, zumba y robot. El centro comercial estalla en aplausos. El video, titulado «El delantero que bailó sin querer», tiene cuatro millones de visualizaciones. Una marca de calzado te ofrece una campaña de «movimiento libre»."),
      o("b", "Salir del círculo con una sonrisa y esperar a que pase", "Retirada digna", { moral: 1, flags: { h5_flash: "retiro" } }, "Te escabulles entre la gente. Al llegar a casa, tu madre te enseña el video: sales con cara de pánico. «Eres el más guapo del baile», dice. Te ríes, resignado."),
      o("c", "Subirte a una escalera y dirigir el baile con una escoba", "Hacerte el director", { fama: 6, rel_aficion: 5, moral: 5, flags: { h5_flash: "director" } }, "Con una escoba como batuta, marcas los ritmos. Los bailarines, entusiasmados, te obedecen. El video, con la etiqueta #ElDirector, se convierte en meme. Un coreógrafo te propone un cameo. Lo dejas en el tintero."),
    ]),
  S("h5-fotocopias", "humor", { minAge: 16, clubTurns: [3, 400], notFlags: ["h5_fotocopias"] }, "vestuario",
    "El fisio descubre que alguien ha fotocopiado su mano en la fotocopiadora y la ha pegado en su taquilla",
    "La imagen es perfecta: cinco dedos, líneas de la palma, una cicatriz que solo él tiene. Debajo, una frase: «Aquí se tocan los músculos con respeto». El fisio, que había pasado por delante diez veces sin verla, se detiene, se queda helado y murmura: «Esto es una obra maestra». Luego, con una sospecha seria, se gira hacia el vestuario. «¿Quién ha sido?». Nadie contesta. Todos tienen las orejas rojas.",
    [
      o("a", "Confesar con orgullo que fuiste tú", "Dar la cara", { rel_vestuario: 6, moral: 5, reputacion: 1, flags: { h5_fotocopias: "confieso" } }, "El fisio te mira, serio, durante unos segundos. Luego, se echa a reír. «Qué bueno». Te regala un masaje de diez minutos «de castigo». Salís los dos, con un chiste nuevo. El vestuario te aplaude."),
      o("b", "Acusar al lateral para desviar la sospecha", "Cargar la culpa", { rel_vestuario: -2, moral: 2, flags: { h5_fotocopias: "acuso" } }, "El lateral, injustamente señalado, se defiende con un teatro magistral. A los dos días, el fisio descubre al culpable: el portero. Todos se parten. Tú, con un nudo en la conciencia, pides disculpas al lateral."),
      o("c", "Colaborar en la investigación con un aire detectivesco", "Seguir la corriente", { rel_vestuario: 4, moral: 3, flags: { h5_fotocopias: "detective" } }, "Interrogas a todos con una libreta. Al final, concluyes que fue «una conspiración colectiva». El fisio, resignado, cuelga el dibujo en su despacho. «Cada vez que lo miro, pienso que somos una familia rara»."),
    ]),
  S("h5-ajedrez", "humor", { minAge: 17, clubTurns: [3, 400], notFlags: ["h5_ajedrez"] }, "vestuario",
    "El portero te reta a una partida de ajedrez con apuesta de un mes de masajes",
    "Lo hace desde la ducha, con una voz de gladiador. «Te reto, 9. Ajedrez. A tres partidas. Quien pierda, un mes de masajes al otro». Te ríes, hasta que descubres que lo dice en serio. A las cinco de la tarde, en una mesa del vestuario con un tablero de plástico, os encontráis cara a cara. El capitán, de árbitro, sirve de testigo. En el aire, un silencio de final de Mundial.",
    [
      r("a", "Jugar con estrategia y fiarte de lo que recuerdas de tu abuelo", "Competir con cabeza", 0.5, "Ganas dos partidas de tres con un jaque pastor que tu abuelo te enseñó cuando tenías ocho años. El portero, abatido, te ofrece su mano: «Eres un tramposo con clase». Pasas un mes recibiendo masajes de manos de portero, que son sorprendentemente profesionales.", { moral: 6, rel_vestuario: 6, forma: 1, flags: { h5_ajedrez: "gano" } }, "Pierdes por un error absurdo con la dama. El portero celebra con un baile ridículo. Pasas un mes dándole masajes en la espalda, con una dignidad herida y una sonrisa discreta. Al final, te agradece con una botella de vino.", { moral: 2, rel_vestuario: 7, flags: { h5_ajedrez: "pierdo" } }, "moral"),
      o("b", "Proponer cambiar la apuesta por una cena entre los dos", "Rebajar la tensión", { rel_vestuario: 4, moral: 3, flags: { h5_ajedrez: "cena" } }, "El portero acepta. Cenáis en una pizzería, discutiendo sobre aperturas y gambitos con una pasión casi religiosa. Al final, sois amigos. Y el ajedrez, para vosotros, se convierte en un ritual de los miércoles."),
    ]),
];
