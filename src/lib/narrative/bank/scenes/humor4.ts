/**
 * Humor y surrealismo, cuarta tanda: el árbitro que se vuelve hincha, el altavoz con voz propia,
 * el sueño colectivo, la liga de bailes, el hechizo del utillero. Pocas condiciones, mucha risa y
 * pequeñas marcas que alguna otra escena podrá recoger.
 */
import { S, o, r } from "../dsl";
import type { BankScene } from "../types";

export const HUMOR4: BankScene[] = [
  S("h4-arbitro-hincha", "humor", { minAge: 17, clubTurns: [3, 400], notFlags: ["h4_arbitro"] }, "partido",
    "El árbitro del domingo te pide un autógrafo en pleno partido",
    "Es el minuto 63, con el balón fuera por la banda, y el árbitro se acerca a ti con una libreta. «Perdona —susurra con voz de niño—, ¿me lo firmas? Es para mi sobrino». Los jugadores rivales se quedan mudos. El capitán rival, desde atrás, murmura: «No me lo puedo creer». El árbitro, rojo hasta las orejas, te ofrece un bolígrafo. «Si no es mucho pedir».",
    [
      o("a", "Firmarlo con una dedicatoria divertida y seguir jugando", "Seguirle el juego", { fama: 3, rel_aficion: 4, moral: 4, flags: { h4_arbitro: "firmo" } }, "Escribes: «Para el sobrino del árbitro. Que algún día me pite menos faltas». El árbitro lo lee, se ríe y lo guarda. Esa noche, cuando se ve la jugada en la tele, el vídeo se hace viral. «El día que el árbitro pidió un autógrafo», titulan."),
      o("b", "Decirle con humor que lo harás al terminar el partido", "Respetar el juego", { reputacion: 4, moral: 2, flags: { h4_arbitro: "despues" } }, "«Cuando acabe, jefe». El árbitro, algo avergonzado, asiente. Al final del partido, te espera en el túnel con la libreta. Le firmas dos. Y te lo agradece con un apretón de manos eterno."),
      o("c", "Quejarte al capitán de que esto no es serio", "Poner orden", { moral: -1, rel_vestuario: -1, flags: { h4_arbitro: "queja" } }, "El capitán se encoge de hombros. El árbitro, avergonzado, guarda su libreta y se disculpa. Pasa el resto del partido sin mirarte. En el 85, te señala falta. Y no parece casualidad."),
    ]),
  S("h4-altavoz", "humor", { minAge: 16, clubTurns: [2, 400], notFlags: ["h4_altavoz"] }, "vestuario",
    "El altavoz del vestuario empieza a poner solo canciones tristes tras las derrotas",
    "Nadie lo ha programado. Nadie lo ha tocado. Pero tras cada derrota, a los cinco minutos exactos, el altavoz arranca con una balada melancólica. Hoy, un bolero. Ayer, una canción de despecho. El utillero, convencido, asegura: «Tiene alma». El capitán, supersticioso, ha prohibido desenchufarlo. «Es parte del equipo», declara. Tú, observando el aparato en silencio, no sabes si reír.",
    [
      o("a", "Investigar el misterio y descubrir una aplicación del móvil del portero", "Desmontar el mito", { rel_vestuario: 4, moral: 3, flags: { h4_altavoz: "desmonto" } }, "Descubres que el portero, aprovechando un fallo, ha programado el altavoz desde su teléfono. «Era una broma», confiesa. El vestuario, entre carcajadas, pide mantener el invento. Desde entonces, hay una playlist oficial de derrotas."),
      o("b", "Seguir creyendo que el altavoz tiene alma", "Dejar que el misterio crezca", { rel_vestuario: 5, moral: 3, flags: { h4_altavoz: "alma" } }, "Le pones un nombre: «Cándido». Cada vez que se enciende, el vestuario le dedica un aplauso. El día que ganáis un título, el altavoz toca «Aquí no hay quien viva». Nadie ríe tanto en toda la temporada."),
      o("c", "Desenchufarlo con una excusa técnica", "Cortar el rollo", { rel_vestuario: -2, moral: 0, flags: { h4_altavoz: "corto" } }, "El vestuario te mira con reproche. Al día siguiente, el altavoz está enchufado de nuevo. Nadie sabe quién. «Alguien sabe lo que hace», murmura el capitán. Y tú, por primera vez, dudas."),
    ]),
  S("h4-sueno-colectivo", "humor", { minAge: 17, clubTurns: [3, 400], notFlags: ["h4_sueno"] }, "vestuario",
    "Medio vestuario sueña con lo mismo la noche antes del partido",
    "Durante el desayuno, el portero cuenta que soñó con una gallina gigante que organizaba el córner. El central, que había soñado con un loro con corbata. El lateral, con un pulpo árbitro. A los diez minutos, se hace evidente: ocho jugadores han tenido sueños con animales en puestos de responsabilidad. El míster, que lo escucha todo en silencio, concluye: «Esto es culpa de la cena». Pero tiene los ojos cansados.",
    [
      o("a", "Contar tu propio sueño, que incluye un delfín entrenador", "Sumarte a la fiesta", { rel_vestuario: 6, moral: 5, flags: { h4_sueno: "delfin" } }, "Tu sueño es el más disparatado: un delfín con silbato que te manda hacer abdominales. El vestuario se desmorona. A partir de ese día, hay una pizarra con los sueños de la semana. El míster la mira con desconfianza. Y apunta uno suyo."),
      o("b", "Pedir al cocinero que cambie el menú de la víspera", "Buscar la causa", { rel_vestuario: 3, moral: 2, flags: { h4_sueno: "cena" } }, "El cocinero, indignado, sostiene que «el pimentón no hace estos efectos». Cambiáis el menú. Esa noche, nadie sueña con nada. Y os aburrís. Al día siguiente, devuelves el pimentón al plato."),
      o("c", "Callarte y apuntar los sueños en un cuaderno", "Estudiar el fenómeno", { moral: 3, reputacion: 1, flags: { h4_sueno: "cuaderno" } }, "Tu cuaderno se convierte en un tesoro: doce páginas de sueños con animales. Años después, lo enseñarás a un psicólogo que, entre risas, concluirá: «Esto es lo más sano que he leído»."),
    ]),
  S("h4-baile-liga", "humor", { minAge: 16, clubTurns: [3, 400], notFlags: ["h4_baile"] }, "vestuario",
    "El vestuario organiza una liga de bailes y tú tienes que defender el honor del equipo",
    "Es una iniciativa del utillero, que ha puesto tablas de puntuación, un jurado improvisado y una caja de premios: un cartel, un calcetín de oro y un abrazo del capitán. Cada semana, un jugador debe interpretar un baile. Esta semana, te toca a ti, en la ceremonia final, contra el lateral derecho, que ha ensayado seis horas con una coreógrafa. El jurado, formado por el nutricionista, el fisio y el míster, se sienta con cara de gravedad.",
    [
      r("a", "Bailar con una entrega total y sin vergüenza", "Dejarte la piel", 0.4, "Tu baile, una mezcla de breakdance, jota y zumba, cautiva al jurado. El míster, con un cartel de «Diez», se levanta para aplaudirte. Ganas el calcetín de oro. Lo colgarás de tu taquilla durante años.", { moral: 8, rel_vestuario: 7, fama: 2, flags: { h4_baile: "gano" } }, "Pierdes frente al lateral derecho, que te supera con una sincronía cinematográfica. Pero la ovación que recibes por la valentía iguala la del ganador. El utillero, con lágrimas, te entrega un abrazo de consuelo.", { moral: 4, rel_vestuario: 6, flags: { h4_baile: "pierdo" } }, "fama"),
      o("b", "Hacer una parodia del baile del lateral derecho", "Ir por la risa", { rel_vestuario: 8, moral: 6, flags: { h4_baile: "parodia" } }, "Imitas cada gesto con una exageración sublime. El lateral derecho, desarmado, se parte de risa. El jurado, entre lágrimas, otorga el premio ex aequo. Hay una foto con los dos abrazados en el centro de la sala que se convierte en un clásico del club."),
      o("c", "Renunciar y dejar que gane quien más ha ensayado", "Retirarte con dignidad", { moral: -1, rel_vestuario: 1, flags: { h4_baile: "renuncio" } }, "Te retiras con una reverencia. El lateral derecho gana por incomparecencia. En el pasillo, un compañero te susurra: «Eres un cobarde». Te ríes. Y prometes entrenar para el año próximo."),
    ]),
  S("h4-hechizo", "humor", { minAge: 16, clubTurns: [3, 400], notFlags: ["h4_hechizo"] }, "vida",
    "El utillero jura que alguien le ha hecho un hechizo a la taquilla del portero",
    "Todo empezó el lunes: una vela verde en la puerta, un puñado de sal en el suelo y un nombre escrito en un papel doblado. El portero, supersticioso, entra en pánico. El utillero, con un delantal manchado de grasa, jura haber visto una sombra con capa. El capitán, escéptico, propone llamar al médico del club. «Para ver si le han echado algo en el café», dice. Todos se ríen. El portero, no.",
    [
      o("a", "Proponer una «contramaldición» con velas, sal y una canción", "Armar un ritual", { rel_vestuario: 7, moral: 5, flags: { h4_hechizo: "ritual" } }, "El vestuario entero participa en un ritual absurdo, con velas de cumpleaños, sal de cocina y una canción del Cola Cao. El portero, al acabar, siente que algo se ha liberado. Tres partidos sin encajar gol. El utillero declara: «Funciona»."),
      o("b", "Descubrir al «hechicero» y gastarle una broma a su vez", "Buscar al culpable", { rel_vestuario: 5, moral: 4, flags: { h4_hechizo: "culpable" } }, "El autor es un lateral suplente con ganas de bromear. Al ser descubierto, el vestuario lo condena a lavar las botas de todos durante un mes. Él, orgulloso, acepta. Y vuelve a hacerlo en el siguiente trimestre."),
      o("c", "Quitarle importancia con un chiste y que se calme el portero", "Calmar a la tropa", { moral: 3, rel_vestuario: 2, flags: { h4_hechizo: "calma" } }, "«Si te han echado mal de ojo, te he echado buen café», dices, ofreciéndole una taza. El portero la acepta con una sonrisa temblorosa. Esa tarde, marca un gol en el rondo. Los milagros, a veces, empiezan con un café."),
    ]),
  S("h4-cartel-gato", "humor", { minAge: 17, clubTurns: [3, 400], notFlags: ["h4_cartel"] }, "vida",
    "Un cartel en el barrio ofrece una recompensa por tu gato… que no tienes",
    "Está en una farola de la plaza, con una foto de un gato atigrado y un texto escrito en rojo: «SE BUSCA. Responde al nombre de “Míster”. Recompensa: 300 € y una camiseta firmada». Hay un número de teléfono. Es el tuyo. Llamas desde tu móvil y suena en tu bolsillo. Una voz de niño, al otro lado: «¿Es usted el dueño?». Te quedas mudo.",
    [
      o("a", "Contestar con humor y proponer buscarlo juntos", "Seguir la corriente", { fama: 3, rel_aficion: 5, moral: 5, flags: { h4_cartel: "juego" } }, "Pasáis la tarde recorriendo el barrio con una linterna y un bote de atún. A las nueve, un gato idéntico al del cartel aparece en un balcón. «Es él», grita el niño. El gato, desde luego, no te reconoce. Pero vuelves a casa con un amigo más."),
      o("b", "Descubrir quién ha puesto el cartel y hablarle", "Resolver el misterio", { moral: 3, reputacion: 2, flags: { h4_cartel: "autor" } }, "Era una broma de tres vecinos adolescentes con mucho tiempo y poca vergüenza. Les ofreces una pizza si arrancan el cartel y se disculpan. Aceptan, con ojos de cachorro. Uno de ellos acabará siendo canterano de tu club."),
      o("c", "Arrancar los carteles y no darle más importancia", "Quitar el rastro", { moral: 1, flags: { h4_cartel: "arranco" } }, "Los quitas todos. Al día siguiente, aparecen otros. La broma se hace fenómeno local. Medio barrio busca gato por ti. Terminas comprando uno, por no desmentirlo."),
    ]),
  S("h4-fantasma-mensaje", "humor", { minAge: 17, clubTurns: [3, 400], notFlags: ["h4_mensaje"] }, "vida",
    "Recibes mensajes de un número desconocido que predice tus goles con una precisión rara",
    "El primero llega el viernes: «Mañana marcas de cabeza en el minuto 71». Lo ignoras. El sábado, marcas de cabeza en el minuto 71. El segundo mensaje dice: «El domingo, de penalti». Marcas de penalti. Tu pareja, tu madre o tu mejor amigo lo ven y se quedan inmóviles. Un tercero, esta mañana: «Hoy no marcas. Hoy das dos pases de gol». Tu agente, desconcertado, pide que lo investigue la policía.",
    [
      o("a", "Responder al número y preguntar quién es", "Pedir explicaciones", { moral: 2, flags: { h4_mensaje: "respondo" } }, "Respondes. A las dos horas, llega: «Soy tu abuelo. Me han enseñado a mandar mensajes y estoy probando». Te quedas riendo en el sofá. Tu abuelo, que ve todos tus partidos, lleva años apostando contigo por lo bajo. Es el mejor fan que tienes."),
      o("b", "Mantener el misterio y seguir recibiendo los mensajes", "Disfrutar del enigma", { moral: 4, rel_vestuario: 2, flags: { h4_mensaje: "misterio" } }, "Cada semana, un nuevo mensaje. Algunos aciertan, otros no. El vestuario se convierte en tu comité de investigación. La conclusión final: nadie sabe. Pero cuando se cae el servicio, echas de menos al vidente."),
      o("c", "Bloquear el número y avisar a seguridad", "Con prudencia", { moral: 0, reputacion: 1, flags: { h4_mensaje: "bloqueo" } }, "Bloqueas, avisas a seguridad. Al cabo de tres días, descubren que es un aficionado analista con un algoritmo muy bueno. Te escribe una carta con su estudio: «Perdona. Fue una locura». Años después, será analista de tu equipo."),
    ]),
  S("h4-cumple-portero", "humor", { minAge: 16, clubTurns: [3, 400], notFlags: ["h4_cumple_porte"] }, "vestuario",
    "El vestuario prepara una broma de cumpleaños al portero y se les va de las manos",
    "Es una idea del lateral: llenar su taquilla de globos, esconder su guante izquierdo y atar un cartel con la frase «Feliz cumpleaños, viejo». Todo va bien hasta que alguien, con exceso de entusiasmo, añade harina a los globos. A las nueve y diez, el portero abre su taquilla. Hay una explosión blanca, un grito y una nube que cubre medio vestuario. Cuando se despeja, el portero, cubierto de harina, parece un fantasma con barba.",
    [
      o("a", "Estallar en carcajadas y pedir una foto para la posteridad", "Reírte con ganas", { rel_vestuario: 7, moral: 6, flags: { h4_cumple_porte: "foto" } }, "La foto del portero, blanco como la nieve, es la imagen oficial del vestuario durante años. Él, tras un minuto de indignación, se ríe. «Os voy a pillar —murmura—. Un día, cuando menos lo esperéis»."),
      o("b", "Ayudar a limpiarlo y pedirle disculpas por los excesos", "Ser el sensato", { rel_vestuario: 4, reputacion: 3, moral: 3, flags: { h4_cumple_porte: "limpio" } }, "Os pasáis una hora con escobas y trapos. El portero, algo avergonzado, agradece la ayuda. A la semana, te regala un guante firmado: «Para el más educado de los cómplices»."),
      o("c", "Huir antes de que descubra quién fue", "Escapar", { moral: 1, rel_vestuario: -1, flags: { h4_cumple_porte: "huyo" } }, "Sales por la puerta de atrás con una excusa. El portero, harina y rabia, investiga. A los dos días, te descubre. «Eres un cobarde», dice. Y te devuelve la broma con un cubo de agua en la cabeza."),
    ]),
  S("h4-reloj-pared", "humor", { minAge: 16, clubTurns: [2, 400], notFlags: ["h4_reloj"] }, "entrenamiento",
    "El reloj del campo de entrenamiento va cinco minutos adelantado desde hace años y nadie lo arregla",
    "Es una tradición silenciosa: todos saben que el reloj de la entrada marca cinco minutos más de la cuenta, y todos llegan a su hora «real». Los nuevos, que no lo saben, llegan cinco minutos antes y se creen unos héroes. Hoy, el director técnico, tras comprobar su reloj de muñeca, descubre el desfase. «¡Esto hay que arreglarlo ya!», proclama. Un suspiro colectivo recorre el vestuario.",
    [
      o("a", "Defender el reloj como parte de la historia del club", "Salvar la tradición", { rel_vestuario: 7, moral: 4, reputacion: 2, flags: { h4_reloj: "tradicion" } }, "Con un discurso ante el director, explicas que el reloj es parte del alma del club. El director, desarmado, concede. «Pero que conste en acta». El reloj sigue adelantado. Los nuevos, a los que se les explica el secreto, lo guardan como un juramento."),
      o("b", "Dejar que lo arreglen y adaptarte al horario real", "Aceptar el cambio", { moral: 0, rel_entrenador: 2, flags: { h4_reloj: "arreglo" } }, "El reloj se arregla en una tarde. Por primera vez, todos llegan puntuales. Pero a las dos semanas, el vestuario echa de menos esa ligera distancia con la realidad. Alguien, por la noche, lo vuelve a desajustar."),
      o("c", "Proponer retrasar el reloj en lugar de adelantarlo", "Una solución creativa", { rel_vestuario: 4, moral: 3, flags: { h4_reloj: "retraso" } }, "Ahora el reloj va cinco minutos atrasado. «Así nadie llega tarde», argumentas. El capitán te mira con dudas. A la semana, todos llegan cinco minutos tarde, con una sonrisa. El director, vencido, lo deja como está."),
    ]),
  S("h4-ficha-error", "humor", { minAge: 17, clubTurns: [3, 400], notFlags: ["h4_ficha"] }, "prensa",
    "Un error en la web del club te presenta como «el nuevo portero» durante todo un día",
    "Alguien, en el departamento digital, cambió una etiqueta, y ahora tu ficha dice «Portero» con tu foto de delantero. Los medios lo recogen con alborozo: «El 9 se pasa a la portería». Las casas de apuestas abren una cuota. Tu agente te escribe: «Esto es una pesadilla». El míster, desde su despacho, te pide que subas. Tiene una cara indescifrable.",
    [
      o("a", "Seguir la broma y pedir los guantes en el siguiente entrenamiento", "Convertirte en portero un día", { fama: 4, rel_vestuario: 6, moral: 5, flags: { h4_ficha: "portero" } }, "Te pones los guantes, te cuelgas del larguero y paras tres penaltis. El míster, asombrado, murmura: «Por si acaso». Esa tarde, la grada te corea «¡Portero! ¡Portero!». Es el mejor error de la temporada."),
      o("b", "Pedir al club que lo corrija y lo disculpe con un comunicado", "Cumplir el protocolo", { reputacion: 3, moral: 1, flags: { h4_ficha: "corrijo" } }, "El comunicado, de dos líneas, dice: «Error de edición». Los medios, decepcionados, pasan página. Pero esa noche, un aficionado te manda un meme con tu cara sobre un portero de ficción. Te ríes en la oscuridad."),
      o("c", "Subir una foto con guantes y la leyenda «Me han fichado»", "Aprovechar el viral", { fama: 5, rel_aficion: 5, moral: 4, flags: { h4_ficha: "viral" } }, "La foto se comparte quinientas veces por hora. Una marca de guantes te ofrece un patrocinio simbólico. El míster, al verte, te dice con una media sonrisa: «Me lo estás poniendo difícil»."),
    ]),
];
