/**
 * Después de un Mundial, una Eurocopa o una Copa América: el desfile, el pueblo que se echa a la
 * calle, la resaca del campeón, la espina del subcampeón, el aeropuerto silencioso de quien cae
 * pronto. Solo salen si el torneo de esta temporada acabó así. Algunas dejan marcas que vuelven
 * muchos años después.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const TORNEOS2: BankScene[] = [
  S("t2-desfile", "torneo", { torneo: { type: "any", outcomes: ["campeon"] }, notFlags: ["t2_desfile"] }, "especial",
    "El desfile del campeón: todo un país en la calle",
    "Es un autobús de dos pisos, descubierto, que avanza por una avenida que no se ve: solo se ve gente. Hay bengalas, banderas, niños subidos a hombros, abuelas llorando con una bufanda y una orquesta que toca en un balcón. Arriba, el capitán levanta el trofeo y todos os arrodilláis. Tú, con la camiseta empapada de champán, intentas grabar en la memoria cada cara.",
    [
      o("a", "Cantar con la gente y levantar el trofeo con tu familia", "Compartirlo con los tuyos", { moral: 15, fama: 8, rel_aficion: 8, reputacion: 6, flags: { t2_desfile: "familia" } }, "Subes a tus padres al autobús durante unos metros. Tu madre agarra el trofeo con las dos manos y no quiere soltarlo. Tu padre canta el himno, desafinando, sin pudor. Se acaban las palabras. Quedan las lágrimas, que no necesitan traducción."),
      o("b", "Quedarte en un rincón del autobús, mirando todo", "Absorberlo en silencio", { moral: 12, reputacion: 4, flags: { t2_desfile: "silencio" } }, "Te agarras a la barandilla y miras. Los rostros, las pancartas, la manera en que la ciudad entera te mira. Piensas en el niño que fuiste, en el campo de tierra, en el primer balón. Sientes que ese niño, por fin, ha llegado."),
      o("c", "Lanzar tu camiseta a un niño que lleva dos horas siguiendo el autobús", "Un gesto para recordar", { moral: 12, rel_aficion: 9, fama: 5, flags: { t2_desfile: "camiseta" } }, "Te quitas la camiseta, firmada, y se la lanzas a un crío que corre sin zapatillas. El niño la atrapa con los dientes. Un fotógrafo lo capta. La imagen del año: un niño sonriente con una camiseta que le llega a los tobillos."),
    ], { isMilestone: true, milestoneType: "titulo", imageScene: "Photorealistic photo of footballers celebrating on an open-top bus parade through a packed avenue at dusk, raising a golden trophy, confetti and flares, a crowd of thousands, emotional joy, no logos or readable text" }),
  S("t2-pueblo", "torneo", { after: [after("t2-desfile", undefined, 1, 4)], notFlags: ["t2_pueblo"] }, "vida",
    "Tu pueblo te recibe con una fiesta que no habías pedido",
    "Entras en el pueblo a las siete de la mañana, en un coche prestado, y no hay nadie en la calle. Das la vuelta a la plaza. Y entonces, al doblar la esquina, se enciende una luz. Y otra. Y otra. Todo el pueblo, vestido de gala, con una pancarta que dice «El campeón es de aquí», te espera con una orquesta, una paella de cien raciones y el alcalde con una llave de plata.",
    [
      o("a", "Bajarte del coche y abrazar a todo el que puedas", "Saludar a todos", { moral: 12, rel_aficion: 6, reputacion: 5, flags: { t2_pueblo: "abrazos" } }, "Tardas una hora en llegar a la paella. Todos quieren tocarte, darte un beso, contarte un recuerdo de cuando eras niño. Un hombre de noventa años, el sacristán, te dice: «Siempre supe que llegarías». Te lo dice con un guiño."),
      o("b", "Pedir que la paella sea para toda la comarca, a tu cargo", "Invitar al pueblo", { patrimonio: -2500, moral: 10, reputacion: 7, rel_aficion: 5, flags: { t2_pueblo: "invito" } }, "Pagas la paella, la bebida y la orquesta. Al final del día, el alcalde te regala una placa que dice: «Hijo predilecto». Tu madre, orgullosa, la cuelga en el pasillo, junto a la foto del bautizo."),
    ]),
  S("t2-resaca", "torneo", { after: [after("t2-desfile", undefined, 4, 16)], notFlags: ["t2_resaca"] }, "vida",
    "La resaca del campeón: ¿y ahora qué?",
    "Han pasado semanas. Los mensajes de enhorabuena se han apagado, el trofeo está en una vitrina y el calendario vuelve a llenarse de entrenamientos. Una mañana, en el espejo del baño, te ves con una cara que no reconoces: sin hambre. Has ganado lo que soñabas. Y no sabes qué quieres ahora. Tu agente, por teléfono, nota algo raro: «¿Todo bien?».",
    [
      o("a", "Fijarte un reto nuevo y concreto", "Buscar otra montaña", { moral: 5, forma: 3, reputacion: 2, flags: { t2_resaca: "reto" } }, "Escribes en un papel: «Ganar con mi club». Lo pegas en la nevera. Al día siguiente, entrenas dos horas más. Descubres que el hambre no se había ido: solo estaba esperando una meta."),
      o("b", "Hablarlo con el psicólogo del club", "Pedir ayuda", { moral: 6, reputacion: 3, flags: { t2_resaca: "psico", terapia: true } }, "El psicólogo te explica que es habitual: «El vacío después de la cima». Te propone ejercicios sencillos. Y tres citas. A la tercera, sonríes. Y escribes un nombre nuevo en tu lista de metas."),
      o("c", "Tomarte unas vacaciones inesperadas y desconectar", "Parar", { moral: 4, forma: -2, rel_entrenador: -2, flags: { t2_resaca: "paro" } }, "Te desapareces diez días en una isla sin cobertura. Vuelves con la piel morena y la cabeza en orden. El míster, de brazos cruzados, te mira: «Ya era hora de que descansaras. Ahora, a trabajar»."),
    ]),
  S("t2-sub-consuelo", "torneo", { torneo: { type: "any", outcomes: ["subcampeon"] }, notFlags: ["t2_sub"] }, "especial",
    "Una final perdida y un abrazo que no esperabas",
    "Estás sentado en el césped, con la medalla de plata colgando del cuello y la mirada perdida. A tu alrededor, los rivales celebran, los fotógrafos se arremolinan y alguien llora a gritos. De repente, una mano te toca el hombro. Es un jugador del equipo campeón, el que te marcó el gol decisivo. Te tiende la mano y dice: «Habéis estado enormes». No sabes si agradecérselo o llorar.",
    [
      o("a", "Levantarte, estrecharle la mano y felicitarle", "Ser deportista", { reputacion: 7, rel_aficion: 5, moral: -4, flags: { t2_sub: "felicito" } }, "Le das un abrazo corto. «Os lo merecéis», dices, y se te rompe la voz. Esa imagen —los dos, sudados, con el estadio de fondo— se hace icónica. Es la forma más digna de perder."),
      o("b", "Quedarte en el suelo, sin hablar con nadie", "Dejarte llevar por el dolor", { moral: -8, forma: -2, flags: { t2_sub: "dolor" } }, "No te mueves. Un compañero te trae una botella de agua. El capitán se sienta a tu lado, sin hablar. Pasáis diez minutos en silencio, con el estadio vaciándose. Es el rato más largo de tu vida."),
      o("c", "Gritarle a la cámara que vas a volver", "Prometer la revancha", { moral: -2, fama: 3, rel_aficion: 4, flags: { t2_sub: "revancha" } }, "«Volveremos», dices, con los ojos húmedos. La frase, repetida en todos los telediarios, se convierte en el lema del país. Pero, en el fondo, tú sabes que es una deuda."),
    ]),
  S("t2-sub-espina", "torneo", { after: [after("t2-sub-consuelo", undefined, 20, 160)], minAge: 24 }, "vida",
    "La medalla de plata sigue en el cajón, y todavía duele",
    "Años después, buscando unos papeles, te encuentras con ella: la medalla de plata de aquella final, envuelta en un trapo, en el fondo de un cajón. Te quedas mirándola. Notas, de golpe, el olor del césped, el ruido de la gente, el momento exacto del penalti. Tu pareja, tu madre o un amigo te preguntan qué pasa. Respondes: «Nada». No es verdad.",
    [
      o("a", "Colgarla en la pared con una frase", "Convertirla en motivación", { moral: 5, forma: 2, reputacion: 3, flags: { t2_espina: "colgada" } }, "La cuelgas en tu gimnasio, con una frase debajo: «Aún no». Cada mañana, al verla, entrenas un poco más fuerte. Una espina bien puesta puede ser un faro."),
      o("b", "Dársela a un niño de tu barrio que juega bien", "Darle un uso", { moral: 6, reputacion: 5, rel_aficion: 3, flags: { t2_espina: "regalo" } }, "Se la entregas a un chaval que juega descalzo en el campo de tierra. «No es oro —dices—, pero es mejor que nada». El niño la sostiene como si pesara cien kilos. Te quedas con una sonrisa que te dura una semana."),
      o("c", "Volver a guardarla y no pensar más en ello", "Dejarlo atrás", { moral: -2, flags: { t2_espina: "guardada" } }, "La envuelves en el trapo y la dejas en el fondo del cajón. A veces, el tiempo no cura, solo cubre. Por la noche, sin saber por qué, sueñas con un penalti."),
    ]),
  S("t2-grupos-aeropuerto", "torneo", { torneo: { type: "any", outcomes: ["fase_de_grupos"] }, notFlags: ["t2_aeropuerto"] }, "especial",
    "El aeropuerto tras caer en la fase de grupos",
    "Vuelves sin trofeo, sin gloria y sin ganas de hablar. En el aeropuerto, un grupo de aficionados espera con carteles. Algunos dicen «Gracias por intentarlo». Otros, con mala cara, gritan cosas que prefieres no oír. Un guardia de seguridad te hace de escudo. Un niño, tras una valla, te levanta el pulgar. Es lo único que recordarás de ese día.",
    [
      o("a", "Parar a saludar al niño y firmarle la camiseta", "Un gesto en medio de la ola", { reputacion: 5, moral: 3, rel_aficion: 3, flags: { t2_aeropuerto: "nino" } }, "Te acercas con la cabeza gacha. El niño te dice: «Eres el mejor». «Todavía no», respondes. Pero cuando te vas, caminas distinto: no con orgullo, sino con deseo de merecerlo."),
      o("b", "Pasar rápido sin mirar a nadie", "Protegerte", { moral: -3, rel_aficion: -2, flags: { t2_aeropuerto: "paso" } }, "Aceleras el paso, con los auriculares puestos, sin levantar la vista. En el coche, te echas a llorar sin ruido. El conductor, discreto, sube un poco la música."),
      o("c", "Responder a los que gritan con calma y mirándoles a los ojos", "Dar la cara", { reputacion: 4, moral: -2, rel_aficion: 2, flags: { t2_aeropuerto: "cara" } }, "Te acercas a ellos y les dices: «Os entiendo. Yo también estoy dolido». Se hace un silencio. Uno de los que gritaban baja la cabeza. «Perdona», murmura. Es una pequeña victoria."),
    ]),
  S("t2-grupos-carta", "torneo", { after: [after("t2-grupos-aeropuerto", undefined, 3, 20)], notFlags: ["t2_carta"] }, "vida",
    "Una carta de una aficionada te cambia el humor",
    "Llega a la puerta del club, escrita con una letra temblorosa y un papel con olor a lavanda. Es de una señora de ochenta y cuatro años que ha visto todos los Mundiales desde 1966. «Perdimos, pero tú corriste por todos nosotros. Mi marido, que en paz descanse, habría dicho lo mismo». Al pie, un dibujo con un balón y un corazón.",
    [
      o("a", "Contestarle con una carta escrita a mano", "Responder con cariño", { moral: 7, reputacion: 4, rel_aficion: 4, flags: { t2_carta: "respondo" } }, "Tardas tres horas en escribirla. La señora te contesta con una postal de su pueblo: «Ya sabía yo que eras de los buenos». Te la guardas en la cartera, donde antes guardabas los recibos."),
      o("b", "Enmarcarla y colgarla en el vestuario", "Compartirla con el equipo", { moral: 5, rel_vestuario: 5, flags: { t2_carta: "vestuario" } }, "La carta se lee en voz alta antes del siguiente entrenamiento. Los compañeros bajan la cabeza, conmovidos. El capitán dice: «Eso es lo que significa vestir esta camiseta»."),
    ]),
  S("t2-ko-orgullo", "torneo", { torneo: { type: "any", outcomes: ["octavos", "cuartos", "semifinal"] }, notFlags: ["t2_orgullo"] }, "vestuario",
    "El vestuario de la selección tras la eliminación: nadie se mueve",
    "Pasan veinte minutos desde el pitido final y nadie se ha quitado las botas. Los jóvenes lloran. Los veteranos, con la mirada fija en el suelo, mastican un silencio de plomo. El seleccionador entra, se pone en medio y dice: «Hemos hecho un buen torneo». Nadie lo acepta. Hasta que uno de los veteranos, con voz ronca, empieza a aplaudir. Uno a uno, todos le siguen.",
    [
      o("a", "Levantarte y abrazar a tus compañeros uno por uno", "Cerrar filas", { moral: -2, rel_vestuario: 8, reputacion: 4, flags: { t2_orgullo: "abrazos" } }, "Pasas por cada taquilla, abrazas y dices «gracias». A algunos les sale una voz rota. Cuando sales del vestuario, sabes que has perdido una Copa pero has ganado un grupo. Esa sensación te acompañará años."),
      o("b", "Quedarte en tu sitio, con la cabeza entre las manos", "Dejar que pase", { moral: -5, flags: { t2_orgullo: "silencio" } }, "No te mueves. El utillero te pone una toalla en los hombros. «Mañana saldrá el sol», murmura. Lo dice con una suavidad que te duele. En el autobús, nadie habla."),
      o("c", "Dar un pequeño discurso de agradecimiento al grupo", "Hablar por todos", { moral: 3, reputacion: 6, rel_vestuario: 6, flags: { t2_orgullo: "discurso" } }, "Te pones en pie, con la voz entrecortada: «No hemos ganado, pero nadie me va a quitar lo que he vivido con vosotros». El vestuario aplaude. El seleccionador, apoyado en la puerta, asiente con los ojos húmedos."),
    ]),
  S("t2-vacaciones", "torneo", { torneo: { type: "any" }, turn: [1, 3], notFlags: ["t2_vacaciones"] }, "vida",
    "Las vacaciones más raras de tu vida, tras un torneo",
    "No tienes pretemporada ni calendario fijo: el torneo ha terminado y el cuerpo, de golpe, no sabe qué hacer. Te despiertas a las siete de la mañana con ganas de entrenar. Tu madre, en la cocina, te dice: «Quédate un rato, hijo». Es la primera vez en meses que no hay un plan escrito. Tienes dos semanas y ninguna idea.",
    [
      o("a", "Irte con tus amigos de siempre a un camping", "Volver a lo sencillo", { moral: 9, rel_vestuario: 0, forma: 1, flags: { t2_vacaciones: "camping" } }, "Dormís en una tienda de campaña con goteras, cocináis en un hornillo y os reís del olor de los calcetines. Un día, juegas un partido con críos de una granja y marcas siete goles. El mejor entrenamiento del verano."),
      o("b", "Hacer el viaje que siempre has pospuesto", "Cumplir un sueño", { patrimonio: -2000, moral: 8, reputacion: 1, flags: { t2_vacaciones: "viaje" } }, "Te vas a un país que siempre habías querido ver, con una mochila y un cuaderno. Nadie te reconoce, salvo un taxista que sabe más de tu carrera que tú. Vuelves renovado y con un tatuaje que te prometiste no hacerte."),
      o("c", "Quedarte en casa, descansar y no hacer nada", "Aprender a parar", { forma: 3, moral: 5, flags: { t2_vacaciones: "casa" } }, "Duermes, lees, ves películas, te pierdes por el barrio. Descubres que hay un parque cerca de tu casa que nunca habías pisado. Al final de la segunda semana, te sientes persona otra vez."),
    ]),
  S("t2-camisetas", "torneo", { torneo: { type: "any" }, notFlags: ["t2_camisetas"] }, "vestuario",
    "Intercambias camisetas con un ídolo de tu infancia",
    "Fue en el túnel, tras el partido. Lo buscaste con la mirada sin querer: es el delantero rival, un tipo con veinte años más que tú, el que tenías en un póster de tu habitación cuando eras niño. Te acercas sin saber qué decir. Él, con una media sonrisa, se quita la camiseta: «Me han dicho que eres bueno». Te tiende la suya.",
    [
      o("a", "Darle la tuya con una dedicatoria emocionada", "Un cambio simbólico", { moral: 10, reputacion: 4, fama: 2, flags: { t2_camisetas: "idolo" } }, "Le escribes: «Gracias por enseñarme a soñar». Él lee la frase, te mira, y dice: «Qué cosas». Te abraza como si te conociera. Esa camiseta, la suya, queda enmarcada en tu pasillo, junto a tu primera camiseta del colegio."),
      o("b", "Aceptarla con sencillez y marcharte antes de emocionarte", "Con el corazón en la mano", { moral: 7, flags: { t2_camisetas: "sencillo" } }, "Te la llevas bajo el brazo, sin decir nada, con la cara roja. En el hotel, la abres y la hueles. Es la camiseta de tu infancia, la de verdad. Te quedas dormido con ella en las manos."),
    ]),
];
