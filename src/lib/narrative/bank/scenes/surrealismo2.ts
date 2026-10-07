/**
 * Más surrealismo y más cabeza: el pensamiento a las cuatro de la madrugada, el ritual absurdo
 * que acaba funcionando, la mascota con vida propia. Humor, ternura y alguna cosa que da un poco
 * de escalofrío, siempre con una marca que otra escena pueda recoger.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const SURREALISMO2: BankScene[] = [
  S("sr-ritual", "surreal", { minAge: 16, clubTurns: [3, 400], notFlags: ["sr_ritual"] }, "vida",
    "Descubres que tu ritual absurdo se ha convertido en el de todo el vestuario",
    "Entras siempre con el pie derecho, tocas tres veces el marco de la puerta y te pones los calcetines al revés. Lo haces sin pensar desde que eras niño. Pero esta mañana, en el pasillo, ves a cuatro compañeros repetir tu secuencia exacta. El capitán se detiene, te mira y dice: «Es que desde que lo haces tú, ganamos». Se hace un silencio.",
    [
      o("a", "Seguirles el juego y explicar cada paso con solemnidad", "Convertirte en gurú", { rel_vestuario: 6, moral: 5, fama: 1, flags: { sr_ritual: "guru" } }, "Das una clase magistral de supersticiones. Al día siguiente, todo el equipo lleva los calcetines al revés. El rival, al verlo, comenta: «Es una secta». Ganáis 3-0. El ritual queda, para siempre, en la historia del club."),
      o("b", "Confesar que es una tontería y que no tiene efecto", "Ser honesto", { reputacion: 2, moral: 0, flags: { sr_ritual: "honesto" } }, "Les dices que es solo costumbre. Todos asienten con una sonrisa y siguen haciéndolo. «No hace daño», dice el capitán. Y tiene razón. Hay cosas que se creen, sin más."),
      o("c", "Cambiar de ritual en secreto para ver qué pasa", "Experimentar", { moral: 2, rel_vestuario: 3, flags: { sr_ritual: "cambio" } }, "Al día siguiente, entras con el pie izquierdo. El vestuario te copia en cinco minutos. Ganáis igualmente. Desde entonces, hay una discusión eterna sobre «cuál es el pie de la suerte»."),
    ]),
  S("sr-madrugada", "surreal", { minAge: 17, clubTurns: [2, 400], notFlags: ["sr_madrugada"] }, "vida",
    "A las cuatro de la madrugada, te preguntas si todo esto tiene sentido",
    "Estás despierto, mirando el techo, con la cabeza dando vueltas. ¿Para qué tanto entrenamiento, tanta presión, tanto ruido? ¿Es esto lo que querías? En la calle, un camión de la basura hace su ronda. Piensas en tu infancia, en los domingos de barro. La pregunta es enorme y, a las cuatro de la madrugada, no hay respuestas pequeñas.",
    [
      o("a", "Escribir lo que sientes en el móvil y dejarlo ahí", "Soltarlo", { moral: 3, flags: { sr_madrugada: "escribo" } }, "Escribes cinco párrafos sin puntuar. Al releerlos, ves que tu respuesta ya está ahí: «Porque me gusta». Es tan simple como eso. Te duermes con una sonrisa."),
      o("b", "Llamar a un amigo que seguro estará despierto", "Pedir compañía", { moral: 4, rel_vestuario: 1, flags: { sr_madrugada: "llamo" } }, "Descuelga a la tercera. «Estoy aquí», dice. No hablan de fútbol, hablan de nada: de un perro que se perdió, de un vecino que se mudó. Cuando cuelgas, el camión de la basura ya se ha ido."),
      o("c", "Levantarte y salir a correr, aunque sea de madrugada", "Quemar la ansiedad", { forma: 2, moral: 2, flags: { sr_madrugada: "corro" } }, "Corres por calles vacías hasta que sale el sol. Sientes que cada zancada responde una pregunta. Al volver, el café te sabe mejor que nunca."),
    ]),
  S("sr-balon-amuleto", "surreal", { minAge: 16, clubTurns: [2, 400], notFlags: ["sr_amuleto"] }, "vida",
    "Encuentras un balón viejo que lleva tu nombre escrito a lápiz",
    "Estaba en el trastero de tus padres, entre cajas de zapatos y juguetes sin dueño. Es un balón de cuero, medio desinflado, con una costura rota. En la parte de atrás, con una letra infantil, alguien escribió «Del crack». Tardas tres segundos en recordar: eras tú, con ocho años, el día que le dijiste a tu padre que ibas a ser futbolista.",
    [
      o("a", "Llevártelo al vestuario como amuleto", "Convertirlo en tu talismán", { moral: 6, rel_vestuario: 3, flags: { sr_amuleto: "vestuario" } }, "Lo colocas en lo alto de tu taquilla. Cada vez que pasas, lo tocas. Un compañero pregunta: «¿Qué es?». «Mi primer fichaje», contestas. Y nadie se ríe."),
      o("b", "Dárselo a tu hermano pequeño, que empieza a jugar", "Pasar el testigo", { moral: 7, reputacion: 3, flags: { sr_amuleto: "hermano" } }, "Tu hermano lo mira como a un tesoro. «¿De verdad es para mí?», pregunta. «Para que lo estrenes», dices. Lo pateará durante años, hasta que se deshaga. Y será el mejor regalo que le hayas hecho."),
      o("c", "Enmarcarlo y colgarlo en el salón de casa", "Honrarlo", { moral: 5, flags: { sr_amuleto: "marco" } }, "Lo enmarcas con un cristal y una foto de tu padre. Cada visita pregunta. «Es el primer balón que llevó mi nombre», contestas. Y empiezas a creer que algún día alguien lo enmarcará también para ti."),
    ]),
  S("sr-nube", "surreal", { minAge: 17, clubTurns: [3, 400], turn: [3, 9], notFlags: ["sr_nube"] }, "partido",
    "Una nube de pájaros se posa en el área y el árbitro detiene el partido",
    "Una bandada de miles de estorninos aparece de la nada, cubre el cielo y desciende, en una danza hipnótica, sobre el área rival. El árbitro, atónito, pita y levanta los brazos. Los jugadores se miran. Algunos se tumban en el césped para ver el espectáculo. El presidente, en el palco, suspira. En la grada, la gente aplaude como si fuera un gol.",
    [
      o("a", "Tumbarte en el césped a mirar el cielo con tus compañeros", "Disfrutar del momento", { moral: 7, rel_vestuario: 6, rel_aficion: 3, flags: { sr_nube: "cielo" } }, "Cinco minutos de silencio absoluto. Los pájaros giran, se juntan, se separan. Un compañero susurra: «Qué bonito». Nadie le contesta. Cuando se van, el partido continúa y parece más pequeño."),
      o("b", "Aprovechar para calentar y ajustar la táctica con el míster", "Profesionalidad", { forma: 1, rel_entrenador: 3, moral: 1, flags: { sr_nube: "tactica" } }, "El míster reúne al grupo en el banquillo y cambia dos movimientos. En la segunda parte, la jugada sale perfecta. «Lo de los pájaros me dio una idea», dice el míster. Nadie sabe cuál."),
      o("c", "Hacer una broma sobre los pájaros delante de las cámaras", "Dar espectáculo", { fama: 3, rel_aficion: 3, moral: 3, flags: { sr_nube: "broma" } }, "«Esos también juegan en nuestro equipo», dices ante un micro. El vídeo se hace viral. Un periodista bautiza el partido como «el de los estorninos»."),
    ]),
  S("sr-perro-campo", "surreal", { minAge: 16, clubTurns: [3, 400], notFlags: ["sr_perro_campo"] }, "partido",
    "Un perro salta al campo, se hace con el balón y no hay quien lo pille",
    "Pasa en el minuto 34, en un partido de liga sin demasiada historia. Un perro mestizo, de color canela, salta la valla, corre hasta el centro del campo, coge el balón con la boca y empieza a regatear a tres jugadores. El árbitro, con el silbato en la boca, no sabe si pitar. Todo el estadio se pone en pie. Alguien grita: «¡Fichaje!».",
    [
      o("a", "Intentar quitarle el balón con un regate imposible", "Competir con el perro", { fama: 5, rel_aficion: 6, moral: 5, flags: { sr_perro_campo: "regate" } }, "Haces un caño. El perro lo esquiva, te lame la mano y suelta el balón. El estadio estalla. El vídeo hace el recorrido de todos los noticiarios. Al perro lo llaman «Rex, el fichaje del año»."),
      o("b", "Dejar que el perro corra y aprovechar para hacer una broma", "Sumarte al juego", { rel_vestuario: 5, moral: 4, fama: 2, flags: { sr_perro_campo: "juego" } }, "Te unes al perro con otros tres compañeros. Formáis un rondo inesperado, con el perro en el medio. El árbitro, rendido, aplaude. Cuando alguien consigue sacarlo del campo, hay silbidos de disgusto en la grada."),
      o("c", "Ofrecerte a adoptarlo si nadie lo reclama", "Un gesto de corazón", { moral: 8, rel_aficion: 7, reputacion: 5, flags: { sr_perro_campo: "adopto", fm_perro: "mascota" } }, "Nadie lo reclama. A la semana, el perro ya duerme en tu casa. Lo llamas «Penalti». El vestuario lo adopta como mascota. Cada vez que marcas, ladra desde la grada, aunque no sepas cómo ha llegado."),
    ]),
  S("sr-numero-suerte", "surreal", { minAge: 16, clubTurns: [2, 400], notFlags: ["sr_numero"] }, "vida",
    "Todo el mundo te dice que tu número de la suerte es el 7, pero tú juegas con el 9",
    "Una vidente, un amigo de un amigo y tu abuela te lo han dicho por separado: «Tu número es el 7». Tú llevas el 9 desde los diez años. Esta mañana, el utillero te muestra una camiseta recién planchada con el 7. «Por si acaso», murmura. Es tu talla. Tu apellido. Un sueño hecho dorsal. Pero el 9 es el 9.",
    [
      o("a", "Probar con el 7 durante un partido", "Arriesgar", { moral: 3, fama: 1, flags: { sr_numero: "siete" } }, "Juegas un partido con el 7. Falla casi todo: pases, remates, regates. Pero marcas de penalti. Dices que no cambia nada. El utillero te lanza una mirada triunfal y se lleva el 7 de vuelta a la taquilla."),
      o("b", "Quedarte con el 9 y dejar el 7 para quien lo necesite", "Lealtad a tu número", { moral: 4, rel_vestuario: 2, flags: { sr_numero: "nueve" } }, "Le regalas el 7 a un canterano que lo llevaba a escondidas en la bolsa de deporte. El chaval casi llora. Esa tarde, marca su primer gol con el 7. El utillero, con orgullo, te guiña un ojo."),
      o("c", "Pedirle a la vidente que te lo explique con más detalle", "Ir a la fuente", { patrimonio: -40, moral: 2, flags: { sr_numero: "vidente" } }, "La vidente, con una bola de cristal que parece un pisapapeles, te dice: «Tu suerte está en el 4. Y en los lunes». No lo entiendes. Pero cada lunes, de ese año en adelante, juegas con cuidado extra."),
    ]),
  S("sr-espejo", "surreal", { minAge: 16, clubTurns: [2, 400], notFlags: ["sr_espejo"] }, "vida",
    "Hablas con tu yo de diez años frente al espejo del vestuario",
    "No es una experiencia mística. Es solo una mañana en la que, al lavarte los dientes, miras tu reflejo y recuerdas al crío que fuiste. Le preguntas, en voz baja, qué pensaría de ti hoy. Te contesta el silencio y un par de gotas de grifo. Un compañero entra de repente, te ve con el cepillo en la boca y dice: «¿Con quién hablas?».",
    [
      o("a", "Contárselo con total sinceridad", "Abrirte", { rel_vestuario: 5, moral: 5, flags: { sr_espejo: "cuento" } }, "Se sienta a tu lado en el banco. «Yo también lo hago —confiesa—. Con mi yo de doce años. Le pregunto si estaría orgulloso». Os quedáis diez minutos en silencio, con una sonrisa tonta. Es una buena conversación."),
      o("b", "Quitarle importancia con una broma", "Salir del paso", { rel_vestuario: 3, moral: 1, flags: { sr_espejo: "broma" } }, "«Es que me caigo bien», dices. Se ríe y se va. Pero esa tarde, sin saber por qué, entrenas con las manos más sueltas y la cabeza más ligera."),
      o("c", "Quedarte solo y escribirle una carta a tu yo del pasado", "Escribir", { moral: 6, reputacion: 2, flags: { sr_espejo: "carta" } }, "La carta dice: «Lo has conseguido, aunque no como creías». La guardas en un cajón. Años después, en tu despedida, la leerás en voz alta. Y se te quebrará la voz en la segunda línea."),
    ]),
  S("sr-premio-raro", "surreal", { minAge: 17, fama: [30, 100], clubTurns: [3, 400], notFlags: ["sr_premio_raro"] }, "vida",
    "Una peña local te nombra «Hijo adoptivo del bocadillo»",
    "Es una ceremonia en un bar de barrio, con una placa de madera, un cuchillo de plástico y un bocadillo de calamares de un metro de largo. El presidente de la peña, con un delantal bordado, lee un pergamino: «Por sus servicios a la gastronomía y al balompié». Los asistentes aplauden con la boca llena. Tú no sabes si es un honor o una broma. Seguramente, las dos cosas.",
    [
      o("a", "Aceptar el título con un discurso lleno de pan y agradecimiento", "Entrar de lleno", { rel_aficion: 6, moral: 6, fama: 2, flags: { sr_premio_raro: "acepto" } }, "Das un discurso sobre la importancia del calamar en la formación del carácter. Un viejo socio te abraza. «Eres de los nuestros», dice. A partir de ese día, en el bar, tu bocadillo lleva tu nombre."),
      o("b", "Cortar el bocadillo y repartirlo entre todos", "Compartir", { rel_aficion: 5, reputacion: 2, moral: 5, flags: { sr_premio_raro: "reparto" } }, "Cortas con el cuchillo de plástico, con una paciencia de cirujano. Cada uno recibe una porción. Al final, queda un trozo pequeño, que le das al camarero. «Nunca me había pasado esto», murmura."),
      o("c", "Declinar con humor: «Tengo que cuidarme»", "Con cariño", { moral: 2, reputacion: 1, flags: { sr_premio_raro: "no" } }, "Declinas con una carcajada. La peña lo acepta, pero te deja una placa en la puerta de tu taquilla. «Para cuando cambies de opinión», dice. Y cuando lo haces, te están esperando con el bocadillo."),
    ]),
  S("sr-lotero", "surreal", { minAge: 18, patrimonio: [2000, 100000000], clubTurns: [2, 400], notFlags: ["sr_lotero"] }, "vida",
    "Una vendedora de lotería insiste en que el número que te toca lo llevas tatuado",
    "Es en la puerta de un supermercado. Una señora con un chaleco de la ONCE te mira fijamente y dice: «El 25. Lo llevas en la cara». Tú no tienes tatuajes. Ella insiste. «El 25. Y el 13, para los de tu oficio». No sabes si es una táctica de venta o un presagio. Un compañero, a tu lado, se parte de risa. «Cómprale uno por si acaso».",
    [
      r("a", "Comprar un décimo del 25 y esperar al sorteo", "Probar suerte", 0.1, "El décimo sale premiado con el reintegro. «El reintegro es una forma de ganar», concluye la señora cuando se lo cuentas. Te ríes durante todo el día.", { moral: 4, patrimonio: 20, flags: { sr_lotero: "reintegro" } }, "No te toca nada. Rompes el décimo con cariño. A la semana, la señora te devuelve el saludo y te dice: «Para la próxima, el 13». Tú no sabes por qué, pero sonríes.", { moral: 1, patrimonio: -20, flags: { sr_lotero: "nada" } }, "fama"),
      o("b", "Preguntarle por qué cree que llevas ese número", "Ir al fondo", { moral: 3, reputacion: 1, flags: { sr_lotero: "pregunto" } }, "La señora te mira, pensativa. «Tu madre no lo dice, pero lo lleva cosido en tu primera camiseta». No tienes ni idea de qué quiere decir. Esa noche, revisas la camiseta de tu infancia: en el cuello, bordado, un 25."),
    ]),
  S("sr-pared", "surreal", { minAge: 16, clubTurns: [2, 400], notFlags: ["sr_pared"] }, "entrenamiento",
    "Pateas una pared del estadio y se escucha un eco que repite tu nombre",
    "Ocurre después del entrenamiento, con el campo vacío. Tiras un balón a la pared del túnel y, tras el golpe seco, oyes un eco extraño: «…ack… ack…». Te quedas quieto. Lo repites. Esta vez dice: «…ro… ro…». Llamas al utillero, que se acerca con cara de «ya empezamos». «Es el eco de las tuberías», dice. Pero tiene una sonrisa rara.",
    [
      o("a", "Quedarte a descubrirlo con una linterna y un compañero", "Investigar", { rel_vestuario: 4, moral: 3, flags: { sr_pared: "investigo" } }, "Descubrís, tras media hora, que hay un hueco en la pared con un viejo sistema de megafonía del estadio. A través de él, alguien, años atrás, grababa mensajes de ánimo. Encontráis una cinta que dice: «Ánimo, chaval»."),
      o("b", "Dejar el misterio intacto y volver a casa", "Respetar lo misterioso", { moral: 2, flags: { sr_pared: "dejo" } }, "No lo investigas. Cada vez que pasas por el túnel, golpeas el balón y escuchas. A veces, hay eco; otras, no. Eso lo hace aún más bonito."),
      o("c", "Contárselo al club para que lo investiguen", "Cumplir con las normas", { reputacion: 2, rel_entrenador: 1, flags: { sr_pared: "club" } }, "El club envía a un técnico. Descubre que hay un sistema antiguo. Instalan una placa con una frase: «Para los que vengan a jugar». Cuando la lees, entiendes que alguien, en otra época, también escuchó ese eco."),
    ]),
];
