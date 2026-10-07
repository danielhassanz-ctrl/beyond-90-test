/**
 * El día a día de un futbolista: entrenamientos con sorpresa, pretemporadas absurdas, viajes
 * de ida y vuelta. Casi todo con humor y con pequeñas marcas que el resto de la carrera recoge.
 */
import { S, o } from "../dsl";
import type { BankScene } from "../types";

export const DIA_A_DIA: BankScene[] = [
  // ───── Entrenamiento ─────
  S("dd-rondo-eterno", "dia", { minAge: 16, clubTurns: [2, 400], notFlags: ["dd_rondo"] }, "entrenamiento",
    "El rondo que no termina nunca",
    "Empezó a las diez y media, con un rondo de «cinco minutos» para calentar. Es la una menos veinte y nadie ha conseguido que el del medio toque el balón. El míster, con el silbato apretado entre los dientes, no tiene intención de parar hasta que alguien cometa un error. Los veteranos, con la lengua fuera, murmuran: «Esto es el infierno con conos».",
    [
      o("a", "Concentrarte hasta que se te ponga la cabeza en blanco", "Aguantar", { forma: 3, moral: 2, rel_entrenador: 2, flags: { dd_rondo: "aguanto" } }, "Pasas el balón como un autómata. A los cuarenta minutos, ya no piensas, solo tocas. El míster, de repente, pita el final y dice: «Eso es lo que quería ver». Te caes sobre el césped, feliz."),
      o("b", "Fallar adrede para poner fin al castigo", "Una huida estratégica", { rel_vestuario: 4, rel_entrenador: -2, moral: 3, flags: { dd_rondo: "fallo" } }, "Mandas el balón a la grada. El míster te mira, con los ojos entornados, y pita: «Quien lo ha hecho a propósito lo pagará mañana». Tienes treinta kilómetros de cardio en el futuro, pero los compañeros te aplauden."),
      o("c", "Gritar «¡Que alguien se equivoque!» y reírte", "Quitar hierro", { rel_vestuario: 5, moral: 4, flags: { dd_rondo: "risa" } }, "Se te escapa un grito desesperado. El capitán se parte de risa y falla a propósito. El míster, sonriendo, silba: «Está bien, ya está». Ese día, el rondo gana en leyenda."),
    ]),
  S("dd-conos", "dia", { minAge: 16, clubTurns: [2, 400], notFlags: ["dd_conos"] }, "entrenamiento",
    "Alguien ha cambiado de sitio todos los conos",
    "Llevas diez minutos corriendo en zigzag y algo no cuadra: los conos están más cerca de lo normal. Más cerca, y en un orden sospechosamente caótico. En el centro del campo, el utillero, con las manos en la espalda y una sonrisa de culpa, silba una canción. El míster tiene una expresión que oscila entre la indignación y la admiración: «¿Quién ha sido?».",
    [
      o("a", "Confesar que fuiste tú, aunque no lo seas", "Cargar con el muerto", { rel_vestuario: 6, rel_entrenador: -2, moral: 4, flags: { dd_conos: "culpable" } }, "Levantas la mano. El míster te lanza una mirada, resopla y dice: «Dos vueltas al campo». Tras la carrera, el utillero te regala un bocadillo. «Tú sí que eres de los míos», murmura."),
      o("b", "Señalar con el dedo al utillero con una sonrisa", "Delatar", { rel_vestuario: 3, moral: 3, flags: { dd_conos: "delato" } }, "El utillero, al ser descubierto, hace una reverencia. El vestuario se parte. El míster le pone una multa de un café por semana durante tres meses. Y se lo toma con humor."),
      o("c", "Hacer como que no te has enterado y seguir corriendo", "Mantener el tipo", { forma: 1, moral: 1, flags: { dd_conos: "paso" } }, "Sigues el zigzag sin inmutarte. Al acabar, el míster te dice: «Eres el único que no ha preguntado». Para él, es un elogio. Para ti, un misterio."),
    ]),
  S("dd-fisico", "dia", { minAge: 17, clubTurns: [3, 400], notFlags: ["dd_fisico"] }, "entrenamiento",
    "El nuevo preparador físico cree que el domingo se entrena con pesas de tres kilos",
    "Llegó hace una semana con un portátil, una bata blanca y una frase de bienvenida: «Esto va a ser ciencia». Desde entonces, os hace hacer sentadillas con un balón entre las piernas, estiramientos con música clásica y respiración abdominal en círculo. El capitán, tumbado en el suelo, murmura: «No sé si esto es entrenamiento o terapia de grupo».",
    [
      o("a", "Tomártelo en serio y hacer todo al pie de la letra", "Confiar en el método", { forma: 3, rel_entrenador: 2, moral: 1, flags: { dd_fisico: "creo" } }, "A las tres semanas, tu resistencia ha mejorado un diez por ciento. El preparador, orgulloso, te regala un cuaderno con tu progreso. El capitán, de mala gana, admite: «Lo del balón entre las piernas funciona»."),
      o("b", "Hacer los ejercicios con humor para entretener al grupo", "Animar el ambiente", { rel_vestuario: 6, moral: 4, forma: 1, flags: { dd_fisico: "humor" } }, "Respiras con tanta teatralidad que el vestuario se desternilla. El preparador, desconcertado, se ríe también. «Veo que tenemos un artista», dice. A la semana, hay clases opcionales de «respiración de ópera»."),
      o("c", "Preguntarle por el estudio científico detrás del ejercicio", "Poner a prueba su método", { reputacion: 2, rel_entrenador: -1, flags: { dd_fisico: "pregunto" } }, "El preparador tarda tres minutos en contestar y cuatro en citar la fuente. «Está en una revista de Estonia», concluye. Te quedas con cara de póker. Pero, por si acaso, haces los ejercicios."),
    ]),
  S("dd-nutri", "dia", { minAge: 17, clubTurns: [3, 400], notFlags: ["dd_nutri"] }, "vestuario",
    "El nutricionista descubre tu cajón de gominolas",
    "Era un secreto de Estado, escondido bajo tres capas de calcetines. El nutricionista, con la lupa de quien lleva una vida en esto, lo encuentra durante una inspección rutinaria de taquillas. Levanta la bolsa a media altura, como una prueba judicial. En el vestuario, todos guardan silencio. El míster, desde la puerta, pregunta: «¿De quién es?».",
    [
      o("a", "Asumir la culpa y prometer enmendarte", "Dar la cara", { rel_entrenador: 3, reputacion: 2, forma: 1, moral: -1, flags: { dd_nutri: "culpa" } }, "Levantas la mano. El nutricionista suspira y te da un plan de dieta de dos folios con una frase: «Las gominolas, solo en Nochevieja». Tú lo acatas con una sonrisa y, a escondidas, tres gominolas en un calcetín."),
      o("b", "Negar que sean tuyas con una convicción absoluta", "Mantener tu inocencia", { moral: 2, rel_entrenador: -2, flags: { dd_nutri: "niego" } }, "«Nunca las había visto», dices. El nutricionista te mira con compasión. Tu compañero de taquilla, a tu lado, murmura: «Qué grande eres». Esa tarde, en la ducha, encuentras gominolas dentro de tu zapatilla. Como regalo."),
      o("c", "Proponer que todo el vestuario ponga una gominola en una caja común", "Una solución social", { rel_vestuario: 6, moral: 4, flags: { dd_nutri: "caja" } }, "La «caja de las gominolas» se convierte en una institución del vestuario: una vez por semana, cada uno puede coger una. El nutricionista, sorprendido, la declara «medida terapéutica». Todos ganan."),
    ]),
  S("dd-lluvia", "dia", { minAge: 16, clubTurns: [2, 400], turn: [4, 8], notFlags: ["dd_lluvia"] }, "entrenamiento",
    "Entrenamiento bajo un diluvio, con el míster feliz",
    "Cae agua a cántaros. El césped es un barrizal, la visibilidad es mínima y los balones pesan el doble. El míster, sin embargo, está radiante: «¡Esto es fútbol de verdad!». Mientras los demás miran al cielo con ojos suplicantes, él se quita el chubasquero y se queda en camiseta, empapado, con una sonrisa que da miedo. Alguien murmura: «Ha perdido la cabeza».",
    [
      o("a", "Unirte con entusiasmo y jugar como un niño en el barro", "Disfrutarlo", { forma: 2, moral: 6, rel_entrenador: 3, rel_vestuario: 3, flags: { dd_lluvia: "disfruto" } }, "Patinas, te caes, marcas un gol con la cara. Acabas de barro de la cabeza a los pies. El míster te señala con orgullo: «¡Ese es mi hombre!». Esa tarde, os cambia la vida a todos: el barro une."),
      o("b", "Hacer lo mínimo para no resfriarte", "Cuidarte", { forma: 1, moral: -1, rel_entrenador: -1, flags: { dd_lluvia: "minimo" } }, "Entrenas con la capucha puesta, con cara de pocos amigos. El míster, al verlo, te pregunta: «¿Qué, un poco de agua?». Murmuras algo. Al día siguiente, tienes un resfriado de campeonato."),
      o("c", "Proponer ir a los vestuarios y entrenar cubierto", "Plantear una alternativa", { rel_entrenador: -2, moral: 1, flags: { dd_lluvia: "cubierto" } }, "El míster te mira, atónito: «¿Cubierto? ¿Estamos en el siglo XXI o en un parvulario?». Terminas haciendo flexiones bajo la lluvia, de castigo. Pero te quedas con una frase: «El agua no mata, el miedo sí»."),
    ]),
  S("dd-lesion-mascota", "dia", { minAge: 16, clubTurns: [2, 400], notFlags: ["dd_mascota_lesion"] }, "entrenamiento",
    "El míster entrena al equipo con una voz ronca y nadie le entiende",
    "Se levantó con una laringitis espectacular y decidió, por orgullo, que eso no le impediría dirigir. Desde la banda, hace gestos con las manos, silba, gruñe y lanza señales incomprensibles. Los jugadores, desconcertados, ejecutan jugadas al azar. Un lateral, al verlo hacer una mímica extraña, corre hacia la grada. «¡Ha dicho que subas!», grita alguien.",
    [
      o("a", "Intentar descifrarlo y hacer de traductor", "Ayudar al jefe", { rel_entrenador: 5, rel_vestuario: 4, moral: 3, flags: { dd_mascota_lesion: "traductor" } }, "Le explicas al equipo lo que quiere decir con cada gesto. Aciertas el sesenta por ciento. El míster, agradecido, anota tu nombre en su libreta con un círculo. Esa tarde, el entrenamiento sale mejor que ninguno."),
      o("b", "Fingir que lo entiendes y hacer lo que te parezca", "Improvisar", { moral: 2, rel_vestuario: 3, rel_entrenador: -1, flags: { dd_mascota_lesion: "improviso" } }, "Haces lo que te parece. El míster, mudo, te señala con el dedo, luego a la banda. Tú vas al banquillo, sin saber por qué. Una hora después, descubres que quería un vaso de agua."),
      o("c", "Pedir al ayudante que tome el mando", "Poner orden", { rel_entrenador: -1, moral: 0, flags: { dd_mascota_lesion: "ayudante" } }, "El ayudante, con alivio, toma la dirección. El míster se retira a su despacho con una infusión de miel. Al día siguiente, vuelve con la voz recuperada y una manta de abuelita sobre los hombros."),
    ]),
  // ───── Pretemporada ─────
  S("dd-pretemporada-castillo", "dia", { minAge: 17, clubTurns: [2, 400], turn: [1, 2], notFlags: ["dd_castillo"] }, "vida",
    "Pretemporada en un castillo medieval sin calefacción",
    "El club ha alquilado un castillo del siglo XIII para «la concentración», con paredes de piedra, un foso con patos y una cocina donde un cocinero con delantal de cuero prepara pucheros. Por las noches hace un frío siberiano. Alguien afirma haber visto el fantasma de un caballero con armadura. El utillero, que cree en todo, ha llenado el pasillo de ajos.",
    [
      o("a", "Aprovechar para organizar una noche de leyendas a la luz de las velas", "Animar el castillo", { rel_vestuario: 7, moral: 5, flags: { dd_castillo: "leyendas" } }, "Cuentas la historia del caballero sin cabeza que busca un balón perdido. A medianoche, alguien golpea una ventana y todo el vestuario sale chillando. Es el viento. Y el utillero, que se ha escondido tras una armadura."),
      o("b", "Dormir con dos pares de calcetines y esperar a la mañana", "Resignación", { forma: 1, moral: 0, flags: { dd_castillo: "calcetines" } }, "Pasas la noche temblando. Por la mañana, tienes la nariz roja y la sensación de haberte congelado en 1250. Pero entrenáis con vistas a una colina espectacular, y se te olvida."),
      o("c", "Probar el pucherito del cocinero y pedirle la receta", "Gastronomía medieval", { moral: 4, forma: -1, flags: { dd_castillo: "puchero" } }, "El puchero es una delicia indescifrable: carne, legumbres y un secreto que él no revela. Te deja la receta en un pergamino con letras góticas. Cuando intentas hacerlo en casa, queda como un guiso de abuela, pero con más pasión."),
    ]),
  S("dd-amistoso-pueblo", "dia", { minAge: 17, clubTurns: [2, 400], turn: [1, 2], notFlags: ["dd_amistoso_pueblo"] }, "partido",
    "Un amistoso de pretemporada contra el equipo de un pueblo de doscientos habitantes",
    "El campo es un prado con una portería de hierro oxidado, un banquillo que es un tronco y un público compuesto por cuarenta vecinos, dos vacas y un perro. El árbitro es el cura del pueblo. Uno de los jugadores rivales, un hombre de cincuenta años con barba, te hace una entrada que parece sacada de otro siglo. El míster, desde la banda, tiene una sonrisa ancha.",
    [
      o("a", "Jugar con todo el respeto y la diversión posibles", "Disfrutar del partido", { moral: 7, rel_aficion: 4, rel_vestuario: 3, flags: { dd_amistoso_pueblo: "disfrute" } }, "Ganáis 14-0, pero la ovación se la lleva el rival que logra el único gol de honor, con un remate de rodilla. Al acabar, os invitan a un guiso en la plaza. Es de las tardes más bonitas de la temporada."),
      o("b", "Dejar ganar a los del pueblo con elegancia", "Un gesto de grandeza", { reputacion: 4, rel_aficion: 5, moral: 5, flags: { dd_amistoso_pueblo: "dejo" } }, "Finges un tropiezo, aflojas en defensa y concedes tres goles. El pueblo celebra como si fuera una final. El cura, con el silbato en la boca, te guiña un ojo: «El cielo premia a los que saben perder»."),
      o("c", "Pedir a un chaval del pueblo que juegue unos minutos con vosotros", "Hacer sitio", { reputacion: 3, moral: 6, flags: { dd_amistoso_pueblo: "chaval" } }, "El niño, de doce años, entra con la camiseta de tu equipo, le queda a mitad de pierna. Marca un gol de chilena. El pueblo estalla. Años después, lo recordarás como «el crack del prado»."),
    ]),
  S("dd-tienda-regalos", "dia", { minAge: 17, clubTurns: [2, 400], turn: [1, 2], notFlags: ["dd_tienda"] }, "vida",
    "En la gira de pretemporada, el club te obliga a firmar camisetas en una tienda de souvenirs",
    "Es un local diminuto en el centro de una ciudad extranjera, con un cartel que dice «MEJORES PRECIOS» y un dueño con bigote que te recibe como un hijo. Te sientan frente a una pila de doscientas camisetas y te ponen un rotulador en la mano. Cada cinco minutos entra un grupo de turistas, se hace una foto y se va. El dueño sonríe: «Dicen que traes suerte. A mi negocio, desde luego».",
    [
      o("a", "Firmar sin quejarte y hacerte una foto con cada cliente", "Entregarte", { fama: 3, rel_aficion: 4, moral: 2, flags: { dd_tienda: "entrego" } }, "Pasas tres horas firmando. El dueño te regala una bufanda con tu nombre mal escrito: «Gonzalez». Te la llevas con una sonrisa. En el hotel, tus compañeros se burlan: «Gonzalez, el crack»."),
      o("b", "Hacer una broma firmando con otro nombre", "Humor con rotulador", { rel_vestuario: 4, fama: 2, moral: 3, flags: { dd_tienda: "broma" } }, "En cien camisetas escribes «Crack Hernández». El dueño se lleva las manos a la cabeza. Una semana después, esas camisetas valen el doble en una web de coleccionistas. Algo se te escapa de las manos."),
      o("c", "Pedirle al dueño que reparta lo recaudado entre una escuela local", "Un gesto solidario", { reputacion: 5, rel_aficion: 4, moral: 4, flags: { dd_tienda: "escuela" } }, "El dueño duda, se rasca el bigote y accede. Con lo recaudado, la escuela local compra balones y redes. Años después, un chaval de allí llegará al primer equipo y te enviará un mensaje con una foto de aquella tienda."),
    ]),
  // ───── Viajes ─────
  S("dd-autobus-cantar", "dia", { minAge: 17, clubTurns: [3, 400], notFlags: ["dd_autobus"] }, "vestuario",
    "El autobús del equipo se queda sin gasolina a diez kilómetros del estadio",
    "El chófer pone cara de póker y murmura: «Esto no estaba en los planes». Veintidós jugadores, un cuerpo técnico y cuatro maletas con el material se quedan parados en una carretera comarcal. Faltan cuarenta minutos para el partido. El míster, con una calma aterradora, pregunta: «¿Alguien tiene ganas de correr?». Nadie se atreve a contestar.",
    [
      o("a", "Proponer caminar los diez kilómetros en equipo", "Hacerlo una aventura", { forma: -2, rel_vestuario: 8, moral: 5, rel_entrenador: 3, flags: { dd_autobus: "camino" } }, "Caminan por la cuneta, cantando canciones de su infancia. Un camionero les ofrece lonas para llevar el material. Llegan a media hora de empezar, sudados y felices. Jugáis fatal, pero la historia se repetirá durante años."),
      o("b", "Llamar a un taxi y pedir un viaje por jugadores", "Buscar soluciones", { patrimonio: -200, moral: 3, rel_vestuario: 3, flags: { dd_autobus: "taxi" } }, "Llegan cuatro taxis, tres furgonetas y una grúa. El último en llegar lo hace en moto, con el portero detrás. «Eso no se ve todos los días», comenta un periodista, sacando una foto."),
      o("c", "Ver cómo se organiza el míster y esperar", "Dejarse llevar", { moral: 0, flags: { dd_autobus: "espera" } }, "Miras cómo el míster resuelve la crisis con una llamada. En veinte minutos, aparece un autobús de repuesto. Al subir, el míster te guiña un ojo: «Siempre hay un plan B»."),
    ]),
  S("dd-hotel-sabana", "dia", { minAge: 17, clubTurns: [3, 400], notFlags: ["dd_hotel"] }, "vestuario",
    "Una broma con sábanas en el hotel de concentración sale mal",
    "Es una tradición: cuando el compañero de habitación sale a cenar, le haces la cama «de cajón». Esta vez, la broma sube de nivel: alguien ha atado las sábanas con un nudo marinero, ha metido un pez de goma entre los cojines y ha puesto una nota con una amenaza fingida. El que lo recibe, el capitán, sale del baño en pijama y se queda inmóvil. Todo el pasillo contiene la respiración.",
    [
      o("a", "Confesar que has sido tú y pedir perdón con una sonrisa", "Dar la cara", { rel_vestuario: 6, moral: 3, rel_entrenador: 0, flags: { dd_hotel: "confieso" } }, "El capitán te mira con un silencio largo. Luego, con un rugido, te persigue por el pasillo. Os parte de risa el mismo cuarto de hora. Después, te hace dormir en su cama «de cajón». Es tu castigo."),
      o("b", "Dejar que otro cargue con la culpa", "Mirar hacia otro lado", { rel_vestuario: -2, moral: 1, flags: { dd_hotel: "dejo" } }, "Un compañero joven, el más cándido, es señalado. Tú te callas. Al día siguiente, el capitán lo humilla con una bromita. Esa noche, en la cama, tu conciencia no te deja dormir. Al amanecer, confiesas."),
      o("c", "Ayudar al capitán a vengarse de otro", "Cambiar de bando", { rel_vestuario: 7, moral: 4, flags: { dd_hotel: "bando" } }, "Planeáis una venganza con globos y agua fría. Es un éxito. En el comedor, el capitán te hace un brindis: «Por los traidores con sentido del humor». Ese día, te ganas un amigo para toda la vida."),
    ]),
  S("dd-maleta-perdida", "dia", { minAge: 17, clubTurns: [2, 400], notFlags: ["dd_maleta"] }, "vida",
    "La aerolínea pierde tu maleta la víspera de un partido europeo",
    "Llegas al hotel sin botas, sin chándal y sin tu amuleto. Un empleado del aeropuerto, con una sonrisa tranquila, repite: «Seguro que aparece mañana». Tu agente, al teléfono, grita desde otro continente. El utillero te ofrece unas botas de repuesto del número 44, tú calzas un 42. El masajista te pasa un chándal con el escudo del club de otro equipo.",
    [
      o("a", "Jugar con las botas prestadas y salir adelante", "Adaptarte", { forma: -1, moral: 3, rel_vestuario: 3, flags: { dd_maleta: "adapto" } }, "Juegas con las botas prestadas, dos tallas grandes. Con una plantilla extra, aguantas noventa minutos. Marcas en el 72. Un compañero dice: «Con las botas del utillero, eres otro». El utillero se lleva el mérito."),
      o("b", "Ir a la tienda a comprarte unas nuevas a las diez de la noche", "Solucionarlo ya", { patrimonio: -250, moral: 2, forma: 1, flags: { dd_maleta: "tienda" } }, "Encuentras una tienda de deportes abierta, con un dependiente que te reconoce al instante. Sales con unas botas rojas llamativas que, dice, «te sientan fenomenal». Al día siguiente, las llevas puestas. Tu madre, por televisión, comenta: «¿Estás mal de la vista?»."),
      o("c", "Pedir que retrasen el partido por tu maleta", "Probar suerte", { rel_entrenador: -3, moral: -1, flags: { dd_maleta: "retraso" } }, "El delegado te mira con una ceja levantada. «¿Retrasar la Champions por una maleta?». No te lo dice con maldad, pero te quedas sin palabras. Aprendes que no todo se puede negociar."),
    ]),
  S("dd-pasaporte", "dia", { minAge: 17, clubTurns: [2, 400], notFlags: ["dd_pasaporte"] }, "vida",
    "Te das cuenta en el aeropuerto de que tienes el pasaporte caducado",
    "Es un vuelo de cuatro horas, una convocatoria europea y un pasaporte que caducó hace dos días. La empleada de la puerta, con la voz neutra de quien ha visto todo, te lo devuelve con una sonrisa: «Lo siento, no puede embarcar». Tu agente, a tu lado, se pone blanco. El avión espera, el míster te mira desde la puerta con cara de «esto no ha pasado».",
    [
      o("a", "Llamar a un contacto en el consulado y pedir un milagro", "Mover hilos", { rel_representante: 3, moral: 3, flags: { dd_pasaporte: "consulado" } }, "Un amigo de tu agente, funcionario de guardia, te saca un salvoconducto en una hora. Llegas al partido en el minuto 5. Marcas en el 89. Esa noche, tu agente tiene que contarse a sí mismo cómo salvó la vida."),
      o("b", "Viajar en otro vuelo y llegar justo al partido", "Plan B", { forma: -2, moral: -1, rel_entrenador: -3, flags: { dd_pasaporte: "planb" } }, "Llegas con dos horas de retraso, sin calentar, corriendo desde el taxi. Juegas el último cuarto de hora. El míster, enfurecido, te dice: «Revisa los papeles». Tienes esa frase tatuada en la cabeza."),
      o("c", "Perderte el partido y aceptar las consecuencias", "Dar la cara", { reputacion: 2, rel_entrenador: -4, moral: -4, flags: { dd_pasaporte: "pierdo" } }, "No viajas. Ves el partido desde casa, mordiéndote las uñas. Pierde el equipo. Al día siguiente, el míster te recibe sin sonreír: «Estas cosas pasan una vez». Te lo apuntas en un papel y lo pegas en la nevera."),
    ]),
];
