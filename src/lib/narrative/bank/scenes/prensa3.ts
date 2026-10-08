/**
 * Prensa, tecnología y la vida moderna del futbolista: el VAR que te anula un gol de cuatro
 * milímetros, la app del club que se cuelga, el videojuego que te pone una media que no mereces,
 * el podcast, el documental. Humor y un poco de vértigo.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const PRENSA3: BankScene[] = [
  S("pr-var", "prensa", { minAge: 17, clubTurns: [3, 400], notFlags: ["pr_var"] }, "prensa",
    "Te anulan un gol por cuatro milímetros y todo el país hace de ingeniero",
    "Es un gol precioso, de los de enmarcar: control orientado, recorte y disparo al ángulo. Lo celebras corriendo hacia la esquina. Y entonces, el árbitro se lleva la mano a la oreja, camina hacia una pantalla y levanta el brazo: «Fuera de juego, por una punta de la bota». Aparecen líneas, gráficos, un recuadro azul. Cuatro milímetros. El estadio, mudo.",
    [
      o("a", "Aceptarlo con deportividad y felicitar al árbitro del VAR", "Con elegancia", { reputacion: 5, moral: -2, rel_aficion: 3, flags: { pr_var: "elegancia" } }, "Levantas el pulgar al árbitro, con una sonrisa triste. La grada, que esperaba una pataleta, te aplaude. En redes, alguien escribe: «Así se pierde un gol». Y tienes ganas de llorar, pero te aguantas."),
      o("b", "Hacer una broma sobre los milímetros ante las cámaras", "Quitar hierro", { fama: 4, moral: 2, rel_aficion: 4, flags: { pr_var: "broma" } }, "Ante el micro, dices: «Prometo crecer un centímetro menos la próxima vez». El vídeo se hace viral. Un fabricante de reglas te manda un regalo con tu nombre grabado."),
      o("c", "Protestar con vehemencia y ganarte una amarilla", "Perder los papeles", { moral: -3, rel_entrenador: -2, fama: 2, flags: { pr_var: "protesta" } }, "Te acercas al árbitro con gestos largos. Te saca una tarjeta, y el vídeo de tu cara es el más compartido de la noche. «El delantero que se enfadó con una línea», titulan."),
    ]),
  S("pr-videojuego", "prensa", { minAge: 18, fama: [30, 100], clubTurns: [3, 400], notFlags: ["pr_videojuego"] }, "vida",
    "Te enteras por redes de la media que te han puesto en un videojuego… y no te gusta",
    "Es un 79. A ti, que has marcado catorce goles esta temporada, te parece una ofensa. Los compañeros se burlan. Alguien ha hecho un vídeo comparando tus números con los de un lateral de segunda. Tu agente, por teléfono, suspira: «No te lo tomes a pecho». Tú ya te lo has tomado. Y has escrito, y borrado, tres tuits.",
    [
      o("a", "Responder con humor y proponer un reto: «Que me pongan el rendimiento real»", "Hacer un desafío", { fama: 5, rel_aficion: 4, moral: 3, flags: { pr_videojuego: "reto" } }, "Subes un vídeo marcando tres goles seguidos con la camiseta del club. Los desarrolladores, al día siguiente, anuncian una actualización con tu media a 84. Los hinchas te dedican una canción: «Ochenta y cuatro, ni uno menos»."),
      o("b", "Ignorarlo y dejar que hablen los goles", "Calma", { moral: 0, forma: 1, flags: { pr_videojuego: "calma" } }, "Marcas dos goles en el siguiente partido. Un periodista, al verte, bromea: «Eso no está en el juego». Esa semana, tu media sube de verdad. En el videojuego, no."),
      o("c", "Quejarte públicamente de la injusticia de los números", "Protestar", { fama: 3, reputacion: -2, moral: -1, flags: { pr_videojuego: "queja" } }, "Tu queja se hace viral por las razones equivocadas. «Se enfada por un juego», dice un tertuliano. Tu agente se lleva las manos a la cabeza. La próxima vez, bajará la cabeza."),
    ]),
  S("pr-app-club", "prensa", { minAge: 17, clubTurns: [2, 400], notFlags: ["pr_app"] }, "vida",
    "La aplicación oficial del club se cuelga el día que sales en la portada",
    "Es la hora de la presentación del nuevo patrocinador y, por error del equipo digital, la app envía una notificación a todos los socios: «¡Bienvenido, [NOMBRE]! Estás pagando de más». Se hace un silencio digital. A los diez minutos, el hashtag #BienvenidoNOMBRE es tendencia. Tu foto, con un cartel que dice «PAGANDO DE MÁS», ya circula. El director de comunicación llora detrás de una puerta.",
    [
      o("a", "Subir una foto con el cartel y reírte del fallo", "Sumarte a la broma", { fama: 5, rel_aficion: 6, moral: 5, flags: { pr_app: "broma" } }, "Tu foto sonriente con el cartel es la más compartida de la semana. El club, por una vez, también se ríe. «Fue un error afortunado», dice el presidente. El director de comunicación recupera el color."),
      o("b", "Mandar un mensaje de ánimo al equipo digital", "Un gesto con los técnicos", { reputacion: 4, rel_aficion: 2, moral: 3, flags: { pr_app: "animo" } }, "Les escribes: «Todos nos equivocamos. Esta tarde invito a pizzas». Llegan treinta pizzas a la oficina. Los técnicos, agradecidos, te nombran «socio de honor del equipo digital»."),
      o("c", "Hacer como que no ha pasado nada", "Evitar el ruido", { moral: 0, flags: { pr_app: "nada" } }, "No dices nada. A la semana, se olvida. Pero en el vestuario, un compañero te gasta la broma de decirte «Estás pagando de más» cada vez que pide un café."),
    ]),
  S("pr-documental", "prensa", { minAge: 22, fama: [60, 100], clubTurns: [6, 400], notFlags: ["pr_doc"] }, "prensa",
    "Una plataforma quiere rodar un documental sobre tu vida y te pide acceso total",
    "Llegan con un equipo de diez personas, tres cámaras, una grúa y una directora de mirada penetrante. «No queremos el relato de siempre —explica—. Queremos lo que no se ve». Te enseñan un guion con escenas que ya has vivido y otras que, dicen, «pasarán». Tu agente hace cuentas. Tu madre, desde la puerta, pregunta si pueden grabar la cocina.",
    [
      o("a", "Aceptar con total apertura y dejarles entrar en todo", "Abrirte del todo", { fama: 7, rel_aficion: 5, reputacion: 3, patrimonio: 6000, flags: { pr_doc: "total" } }, "Durante un año, una cámara te acompaña a todas partes. Se filma lo hermoso y lo feo. Cuando se estrena, lloras con el montaje de tu madre cocinando. La crítica lo llama «una pequeña joya»."),
      o("b", "Aceptar con límites: sin familia, sin salud", "Poner reglas", { fama: 4, reputacion: 3, patrimonio: 3500, flags: { pr_doc: "limites" } }, "El documental es elegante, algo distante. A la directora le habría gustado más. A ti, menos aún. Pero cuando lo ves, piensas que hay cosas que son solo tuyas."),
      o("c", "Rechazar: prefieres que la vida pase sin cámaras", "Decir que no", { reputacion: 2, moral: 2, flags: { pr_doc: "no" } }, "Tu agente lo lamenta. La plataforma rueda uno sobre otro jugador. Cuando lo ves, piensas por un instante que podrías ser tú. Y apagas la tele con una mezcla de alivio y duda."),
    ]),
  S("pr-doc-escena", "prensa", { after: [after("pr-documental", "a", 5, 30)], minAge: 23 }, "prensa",
    "En el estreno del documental ves una escena que no recordabas haber dado",
    "Es una pausa en una conversación con tu madre, en la cocina, donde sin darte cuenta dices algo que nunca habías dicho. «A veces tengo miedo de perderlo todo». No lo recordabas. Se te hiela la sangre. Los asistentes, en la sala, lloran en silencio. Alguien, detrás de ti, murmura: «Qué valiente». Y tú te das cuenta de que, quizá, sí lo fuiste.",
    [
      o("a", "Quedarte hasta el final y hablar con el público", "Dar la cara", { moral: 7, reputacion: 6, rel_aficion: 5, flags: { pr_doc_charla: true } }, "En el coloquio, alguien pregunta si tienes miedo. «Sí —respondes—. Y juego igual». Hay un silencio. Luego, un aplauso largo. Sales del cine con una sonrisa que no sabías que necesitabas."),
      o("b", "Irte en silencio sin hablar con nadie", "Salir de puntillas", { moral: -2, flags: { pr_doc_charla: "no" } }, "No puedes con la emoción. En el coche, con las luces de la ciudad pasando por la ventanilla, lloras a solas. No lo cuentas. Pero esa noche, tu madre te manda un mensaje: «Estuve orgullosa»."),
    ]),
  S("pr-podcast", "prensa", { minAge: 18, fama: [35, 100], clubTurns: [3, 400], notFlags: ["pr_podcast"] }, "prensa",
    "Te invitan a un podcast de tres horas donde nadie sabe de fútbol",
    "Es un estudio en un sótano con una alfombra de lana, cuatro micrófonos y un presentador con camiseta de grupo de rock. Te sientan en un sillón de cuero y te sirven un café con leche de avena. «Hoy hablaremos de la vida —dice—. Del fútbol, solo si surge». A los veinte minutos, ya habéis hablado de la soledad, de los gatos y de un libro que no has leído.",
    [
      o("a", "Soltarte y hablar con total sinceridad durante horas", "Ser tú mismo", { fama: 5, reputacion: 5, moral: 6, flags: { pr_podcast: "sincero" } }, "Hablas de tu miedo, de tu madre, de la pasión que te quita el sueño. Cuando acabas, el presentador, emocionado, dice: «Esto es lo que nadie cuenta». El episodio tiene dos millones de escuchas. Medio vestuario lo escucha en el autobús."),
      o("b", "Responder con frases cortas y esperar a que acabe", "Aguantar", { fama: 1, moral: -1, flags: { pr_podcast: "corto" } }, "Cuentas nada. El presentador lo nota, y acaba preguntando por su gato. El episodio pasa sin pena ni gloria, pero la anécdota del gato te la recuerdan semanas."),
      o("c", "Proponer un reto: que el presentador intente hacer diez toques", "Cambiar el ritmo", { fama: 4, moral: 5, rel_aficion: 3, flags: { pr_podcast: "toques" } }, "El presentador hace tres toques y se cae. Os reís durante cinco minutos. El episodio se titula «Cuando el fútbol se mezcla con la filosofía». Es el mejor de la temporada."),
    ]),
  S("pr-hashtag", "prensa", { minAge: 17, fama: [25, 100], clubTurns: [3, 400], notFlags: ["pr_hashtag"] }, "prensa",
    "Un hashtag con tu apellido se hace tendencia y nadie sabe por qué",
    "Te despiertas con cuarenta mensajes. #ApellidoPresidente es tendencia en tres países. Hay memes, dibujos, canciones de TikTok y una teoría de que vas a fichar por un club que ni existe. Tu agente te llama con la voz de quien ha visto un fantasma: «No sé de qué va, pero sale hasta en la tele». Tú, en pijama, intentas averiguar de qué se trata.",
    [
      o("a", "Entrar en la conversación con un tuit ingenioso", "Subirte a la ola", { fama: 6, rel_aficion: 5, moral: 4, flags: { pr_hashtag: "ola" } }, "Escribes: «Aún no soy presidente, pero acepto sugerencias». Tu tuit tiene doscientos mil likes. A la tarde, el club saca un comunicado serio y gracioso. Descubres, por fin, que todo fue por un meme sobre un sorteo."),
      o("b", "Investigar el origen y aclarar el malentendido", "Poner orden", { reputacion: 4, moral: 2, flags: { pr_hashtag: "aclaro" } }, "Resulta que un aficionado, jugando, escribió el hashtag en un foro. Subes un hilo explicando la verdad, con humor. El aficionado, emocionado, te escribe: «Soy yo». Quedáis a tomar un café."),
      o("c", "Apagar el móvil y esperar a que pase", "No hacer caso", { moral: 1, flags: { pr_hashtag: "apago" } }, "Desconectas un día entero. Cuando vuelves a encender, todo se ha olvidado. Una única persona sigue escribiéndote: tu madre. «Hijo, ¿eres presidente de algo?»."),
    ]),
  S("pr-libro", "prensa", { minAge: 24, fama: [55, 100], clubTurns: [6, 400], notFlags: ["pr_libro"] }, "prensa",
    "Una editorial te propone escribir tu biografía y no sabes por dónde empezar",
    "Son unos cuarenta mil euros por adelantado, un escritor fantasma y un prólogo firmado por alguien importante. Te sientan en una mesa con una grabadora y una taza de té. «Cuéntenos su infancia», dice el escritor, con un cuaderno de tapa dura. Tú te quedas mirando por la ventana, buscando una frase. «Hubo un balón», dices. Y se hace un silencio largo.",
    [
      o("a", "Decir que sí y contar todo, incluso lo difícil", "Un libro honesto", { patrimonio: 15000, fama: 5, reputacion: 6, moral: 4, flags: { pr_libro: "honesto" } }, "Pasas seis meses de conversaciones largas. El libro se titula «Hubo un balón». Vende doscientos mil ejemplares y una lectora te escribe: «Me hiciste llorar en la página 90». Tu madre pide diez ejemplares para repartir."),
      o("b", "Aceptar con un tono más ligero y lleno de anécdotas", "Un libro de humor", { patrimonio: 10000, fama: 4, rel_aficion: 4, moral: 5, flags: { pr_libro: "humor" } }, "El libro es una colección de historias de vestuario y de familia. Se vende en las gasolineras y hace reír en los aviones. Alguien dice: «Es el libro más divertido de un futbolista». Lo tomas como un cumplido."),
      o("c", "Declinar: aún te queda mucho por vivir", "Esperar", { reputacion: 2, moral: 1, flags: { pr_libro: "no" } }, "Dices que lo harás cuando cuelgues las botas. El escritor, resignado, te deja su tarjeta. Años después, cuando la encuentres en un cajón, descubrirás que todavía tienes cosas que contar."),
    ]),
  S("pr-estatua-cera", "prensa", { minAge: 20, fama: [70, 100], clubTurns: [6, 400], notFlags: ["pr_cera"] }, "vida",
    "Un museo de cera te hace una estatua y se parece a otro",
    "Te llevan a la inauguración con un traje, una alfombra y un periodista local. Cuando se descorre la cortina, la estatua revela un rostro algo hinchado, una sonrisa de dentífrico y una melena que no es la tuya. Hay quien se ríe, hay quien aplaude. El director del museo, orgulloso, dice: «Es idéntico». Tu madre, en primera fila, no está tan convencida.",
    [
      o("a", "Posar junto a la estatua y alabar al escultor", "Ser amable", { fama: 3, rel_aficion: 3, reputacion: 3, flags: { pr_cera: "amable" } }, "Te haces una foto abrazando a tu «gemelo». «Le falta pelo», dices en voz baja. El escultor, a su lado, sonríe, y al acabar, te regala un molde de tu mano. Será la pieza más rara de tu casa."),
      o("b", "Pedir con humor que le arreglen la nariz", "Bromear", { fama: 4, rel_aficion: 4, moral: 3, flags: { pr_cera: "nariz" } }, "El director te mira, estupefacto, y te hace un guiño: «Todo se puede». A la semana, la estatua tiene la nariz corregida. Y la sonrisa más grande. Es, por fin, un poco más tú."),
      o("c", "Escabullirte antes de que la foto se haga viral", "Evitar el ridículo", { moral: -1, flags: { pr_cera: "escapo" } }, "Te marchas por la puerta de atrás. Al día siguiente, la foto de tu madre, con los ojos entornados frente a la estatua, es la más compartida. «Mi madre dice que no se parece», cuentas a tu agente."),
    ]),
];
