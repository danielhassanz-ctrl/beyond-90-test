/**
 * Escenas de emoción: el correo de odio que duele, la carta al yo del futuro que se abre diez años
 * después, la paz con quien fue tu rival en el vestuario, el primer lleno. Son pocas y no bromean:
 * dejan huella y, varias, tienen una segunda parte mucho más tarde.
 */
import { S, o, th, after } from "../dsl";
import type { BankScene } from "../types";

export const EMOCION: BankScene[] = [
  S("em-correo-odio", "emocion", { minAge: 17, moral: [0, 52], fama: [20, 100], clubTurns: [3, 400], notFlags: ["em_odio"] }, "prensa",
    "Un correo de odio llega a tu bandeja y no puedes dejar de leerlo",
    "Lo ha escrito alguien con tiempo y energía: tres párrafos de insultos, un resumen cruel de tus peores partidos y una frase final que duele más de lo que quisieras: «No mereces estar ahí». Lo has leído cinco veces. Sabes que es una tontería, que no te conoce, que habrá escrito lo mismo a otros. Pero te acompaña a todas partes, como una piedra en la bota.",
    [
      o("a", "Compartirlo con tu agente o tu familia para quitarle poder", "Sacarlo fuera", { moral: 5, rel_representante: 2, reputacion: 2, flags: { em_odio: "comparto" } }, "Se lo enseñas a tu madre. Lo lee en silencio, lo cierra y dice: «Ese chico necesita una buena comida». Os reís los dos. Y el correo, de golpe, pesa menos."),
      o("b", "Contestarle con calma y sin rencor", "Responder desde arriba", { reputacion: 4, moral: 3, flags: { em_odio: "respondo" } }, "Le escribes tres líneas: «Gracias por el mensaje. Seguiré trabajando». Tardas veinte minutos en enviarlas. A los dos días, el remitente te pide perdón, avergonzado. No lo esperabas."),
      o("c", "Borrarlo y no pensar más en ello", "Cortar", { moral: -2, flags: { em_odio: "borro" } }, "Lo borras. Esa noche, sueñas con la frase final. A la mañana siguiente, la has olvidado casi del todo. Casi. Hay frases que se quedan un poco más de lo que querrías."),
    ]),
  S("em-racha-mala", "emocion", { minAge: 17, moral: [0, 45], forma: [0, 70], clubTurns: [3, 400], notFlags: ["em_racha"] }, "vida",
    "Una racha de partidos sin acertar y una conversación a la salida del vestuario",
    "Llevas cinco partidos sin tocar un balón con sentido. Las piernas pesan, la cabeza está en otro sitio y, cada vez que recibes, notas la tensión de la grada. Un día, tras el entrenamiento, el utillero, que lleva cuarenta años en el club, te para en la puerta del vestuario: «Siéntate un momento». Te alcanza un café. «Yo he visto a los mejores pasar por esto. Y a los peores también».",
    [
      o("a", "Escucharle y quedarte media hora más", "Aceptar la ayuda", { moral: 6, forma: 2, rel_vestuario: 3, flags: { em_racha: "escucho" } }, "Te cuenta historias de leyendas del club que, en su día, dudaron. «La duda es parte de ser bueno», dice. Sales a las ocho de la tarde con un alivio inesperado. Esa semana, marcas."),
      o("b", "Decir que estás bien y marcharte", "Aguantar solo", { moral: -2, flags: { em_racha: "solo" } }, "Le das las gracias con una sonrisa apresurada. El utillero asiente y se queda mirando cómo te marchas. «Cuando quieras», murmura. Esa noche, en casa, piensas que quizá deberías haberte quedado."),
      o("c", "Pedirle que te cuente su peor recuerdo en el club", "Hacer preguntas", { moral: 4, reputacion: 2, rel_vestuario: 2, flags: { em_racha: "pregunto" } }, "Su peor recuerdo es una final perdida en 1989. Lo cuenta con una calma que da escalofríos. Al terminar, dice: «Y aun así vine al día siguiente a las ocho». Se te queda esa frase en la cabeza."),
    ]),
  S("em-carta-futuro", "emocion", { minAge: 16, maxAge: 24, clubTurns: [1, 100], notFlags: ["em_carta_futuro"] }, "vida",
    "Escribes una carta a tu yo del futuro y la guardas en un cajón",
    "Es una noche tranquila, con el móvil apagado y un cuaderno nuevo. Escribes: «Querido yo, si estás leyendo esto, espero que hayas sido valiente. Que hayas cuidado a tu madre. Que te sigas riendo con tus amigos. Que el fútbol te haya dado más de lo que te ha quitado». Firmas, doblas el papel en cuatro y lo pones en un sobre con la fecha de hoy.",
    [
      o("a", "Guardarla en una caja con una nota: «Abrir cuando sea leyenda»", "Soñar a lo grande", { moral: 5, flags: { em_carta_futuro: "leyenda" } }, "La caja se queda en el último cajón de tu mesilla. Cada vez que cambias de casa, la llevas contigo. A veces la miras, sin abrirla. Es un compromiso silencioso contigo mismo."),
      o("b", "Dársela a tu madre y pedirle que te la devuelva dentro de diez años", "Una cita con el tiempo", { moral: 6, flags: { em_carta_futuro: "madre" } }, "Tu madre la guarda en el cajón de la mesita, junto a su rosario. «La abriremos juntos», dice. No sabes aún lo que significará ese día. Pero te hace sonreír la idea."),
    ]),
  S("em-carta-abre", "emocion", { after: [after("em-carta-futuro", undefined, 60, 220)], minAge: 26 }, "vida",
    "Abres la carta que escribiste hace una década",
    "La caja sigue en su sitio, con el cartón gastado y la tinta algo desvaída. La abres un domingo por la tarde, solo, con un café. Reconoces la letra: más redonda, más ingenua. Lees despacio. Cada frase es una pregunta que has respondido sin saberlo. Cuando llegas al final, ves que has hecho casi todo lo que prometiste. Y que lo que no has hecho también te enseña algo.",
    [
      o("a", "Escribir una carta de respuesta para tu yo de entonces", "Cerrar el círculo", { moral: 9, reputacion: 3, flags: { em_carta_respondida: true } }, "Escribes: «Fuiste valiente, aunque no siempre lo parecía. Tu madre está bien. Tus amigos, también. Y el fútbol te ha dado todo lo que querías y alguna cosa más». Guardas ambas cartas juntas. Algún día, alguien las encontrará."),
      o("b", "Enseñársela a quien más quieres y leerla en voz alta", "Compartirla", { moral: 8, reputacion: 2, rel_vestuario: 1, flags: { em_carta_respondida: true } }, "Se la lees a tu madre, o a tu pareja, o a un amigo. En la tercera línea, se os humedecen los ojos. «Qué niño más lindo», dice quien escucha. «Pues sigue aquí», contestas."),
    ]),
  S("em-nino-llora", "emocion", { minAge: 18, clubTurns: [2, 400], notFlags: ["em_nino_llora"] }, "vida",
    "Un niño llora desconsolado en la puerta del estadio tras una derrota",
    "Es una escena de las que parten el alma: un niño de ocho años, con la camiseta del equipo, sentado en un bordillo y llorando sin disimulo. Su padre, a su lado, intenta consolarlo con una mano en el hombro. Pasas por delante con el coche, ves la escena y frenas. Dudas. Nadie te ha pedido nada. Pero tú sabes lo que se siente.",
    [
      o("a", "Bajarte y sentarte con él unos minutos", "Estar ahí", { moral: 7, rel_aficion: 6, reputacion: 5, flags: { em_nino_llora: "sentado" } }, "Te sientas en el bordillo, sin decir mucho. «Yo también he llorado así», dices. El niño levanta la cara, te mira y se queda con la boca abierta. «¿De verdad?». «De verdad». El padre se lleva la mano a la cara."),
      o("b", "Firmarle la camiseta y darle un abrazo", "Un gesto cálido", { moral: 5, rel_aficion: 5, reputacion: 3, flags: { em_nino_llora: "abrazo" } }, "Le firmas la camiseta, justo encima del escudo. El niño la abraza como si fuera un peluche. «Gracias —susurra—. Pero igual hay que ganar». «Hay que ganar», respondes. Y lo piensas de verdad."),
      o("c", "Seguir tu camino con el nudo en la garganta", "No poder", { moral: -3, flags: { em_nino_llora: "paso" } }, "Aceleras. Por el retrovisor, ves al niño cada vez más pequeño. Durante días, tendrás esa imagen. La próxima vez, te prometes, pararás."),
    ]),
  S("em-amigo-lejos", "emocion", { minAge: 18, clubTurns: [3, 400], notFlags: ["em_amigo_lejos"] }, "vida",
    "Una videollamada con tu mejor amigo, que ahora vive a miles de kilómetros",
    "Hace años que no os veis en persona. Él se fue por trabajo a otro continente, y tú, por fútbol, vives en una maleta. Esta noche habláis por videollamada, con una pantalla borrosa y un retraso de dos segundos. Os contáis todo y nada. Os reís con las mismas bromas. Y en un momento dado, él dice: «Te echo de menos». Ninguno de los dos habla durante cinco segundos.",
    [
      o("a", "Prometerle que irás a verle a final de temporada", "Una promesa", { moral: 6, reputacion: 2, flags: { em_amigo_lejos: "promesa" } }, "Lo apuntas en el calendario. Pasan tres meses. En el avión, con la mochila en las rodillas, no te lo crees: vas a verle. Cuando os abrazáis en el aeropuerto, no hace falta decir nada."),
      o("b", "Mandarle algo especial por correo, con una nota", "Un detalle a distancia", { moral: 5, patrimonio: -100, flags: { em_amigo_lejos: "paquete" } }, "Le envías la camiseta de tu primer partido con una dedicatoria. Tarda dos semanas en llegar. Su respuesta, un vídeo emocionado, te acompaña durante toda la temporada."),
      o("c", "Quitar importancia con una broma para no emocionarte", "Disimular", { moral: 2, flags: { em_amigo_lejos: "broma" } }, "Haces un chiste malo. Él se ríe. Colgáis. Te quedas mirando la pantalla negra. Sabes que podrías haberle dicho algo más. Pero algunas cosas se dicen mejor con los hechos."),
    ]),
  S("em-paz-rival", "emocion", { after: [after("rv-peer-bronca", "b", 10, 80)], minAge: 20 }, "vestuario",
    "Te cruzas con el compañero con el que estuviste enemistado y todo ha cambiado",
    "Fue hace tiempo: una entrada de más, una discusión, un silencio que se enquistó. Esta mañana, en el pasillo de un hotel de concentración, os cruzáis y os quedáis parados. Él, con una expresión nueva, algo más madura, dice: «Oye. Me debo una disculpa». Le miras. Te das cuenta de que la rabia que sentías hace tiempo que se fue de tu cuerpo. No sabes exactamente cuándo.",
    [
      o("a", "Aceptar la disculpa y proponerle tomar algo", "Hacer las paces", { moral: 8, rel_vestuario: 7, reputacion: 4, flags: { rv_peer: "tregua" } }, "Os sentáis en el bar del hotel. Hablaréis de todo, menos de lo que pasó. Tres horas después, os despedís con un abrazo largo. Dentro, ya no hay rencor, solo un respeto extraño."),
      o("b", "Responder con una broma y dejar que lo demás fluya", "Quitar tensión", { moral: 5, rel_vestuario: 4, flags: { rv_peer: "tregua" } }, "«Yo también —dices—. Pero cobro intereses». Os reís. En el siguiente entrenamiento, os pasáis el balón sin mirar. El resto del vestuario, a lo lejos, respira."),
    ]),
  S("em-primer-lleno", "emocion", { minAge: 17, fama: [25, 100], clubTurns: [2, 400], clubLevels: ["modesto", "europeo"], notFlags: ["em_lleno"] }, "especial",
    "Por primera vez en años, el estadio se llena hasta la bandera",
    "Lo ves desde el túnel: no queda ni un hueco. Hay gente de pie en los pasillos, niños subidos a los hombros, abuelos con cojines. El speaker, con una voz que se quiebra, anuncia: «Lleno total, la primera vez en once años». Un viejo directivo, a tu lado, se limpia una lágrima con el dorso de la mano. El capitán te agarra del brazo: «Disfrútalo. No pasa todos los días».",
    [
      o("a", "Salir al campo con los brazos abiertos, empapándote de ruido", "Vivirlo con todo", { moral: 10, rel_aficion: 8, forma: 2, flags: { em_lleno: "disfrute" } }, "Sales mirando las gradas, una a una. Es un rugido que se te mete en el pecho. Ese día juegas con una fuerza que nadie esperaba. El resultado casi no importa: es la noche en que el estadio volvió a creer."),
      o("b", "Concentrarte en el partido y dejar el ruido para después", "Mantener la cabeza", { forma: 3, moral: 4, rel_entrenador: 2, flags: { em_lleno: "cabeza" } }, "Respiras hondo. Miras al frente. Cuando suena el pitido inicial, dejas de oír. Solo oyes el balón. Al acabar, en el vestuario, un compañero te dice: «Estabas en otro mundo»."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a footballer walking out of a tunnel into a completely packed stadium roaring, arms slightly open, emotional, dusk light, no logos or readable text" }),
  S("em-ducha-llanto", "emocion", { minAge: 17, clubTurns: [3, 400], notFlags: ["em_ducha"] }, "vestuario",
    "Lloras en la ducha después de un partido enorme y alguien lo ve",
    "Ha sido una noche de las que no se repiten. Un partido de un nivel emocional que te ha dejado vacío. Has aguantado el abrazo del capitán, las fotos, las bromas. Pero en la ducha, a solas, con el agua cayéndote por la cara, algo se rompe. Lloras sin ruido. De pronto, notas una presencia: el utillero, con una toalla, te mira desde la puerta. No dice nada.",
    [
      o("a", "Aceptar la toalla y contarle por qué lloras", "Abrirte", { moral: 6, rel_vestuario: 3, reputacion: 2, flags: { em_ducha: "cuento" } }, "Le cuentas que no sabes por qué, solo que es mucho. Él asiente. «Es normal. Lo mejor es cuando no sabes por qué», dice. Y se marcha, dejándote solo con la toalla y una sensación rara de paz."),
      o("b", "Disimular y decir que es el agua", "Fingir", { moral: 1, flags: { em_ducha: "agua" } }, "«Es el champú», murmuras. El utillero asiente, sin creerte, y deja la toalla en el banco. Te seca los ojos y respiras. Nadie lo contará, y es un alivio."),
      o("c", "Pedirle que no cuente nada a nadie", "Pedir discreción", { moral: 3, reputacion: 1, flags: { em_ducha: "secreto" } }, "«Entre tú y yo», dice, con un guiño. Cuarenta años de club le han enseñado qué se cuenta y qué no. Nunca más hablaréis de ello. Pero cuando te retires, será el primero en abrazarte."),
    ]),
  S("em-aniversario-debut", "emocion", { minAge: 20, clubTurns: [10, 400], notFlags: ["em_aniv_debut"] }, "vida",
    "Se cumplen cinco años de tu debut y nadie se acuerda… salvo tu madre",
    "Te lo recuerda al teléfono, sin darle importancia: «Hoy hace cinco años que te vi salir al campo». Tú lo habías olvidado. Hablas con ella un rato, cuelgas, y te quedas mirando por la ventana. Piensas en el chaval que fuiste aquel día: nervios, rodillas flojas, un balón que no te obedecía. Cinco años. Y todo lo que cabe en cinco años.",
    [
      o("a", "Mandarle flores a tu madre con una nota sencilla", "Devolver el gesto", { patrimonio: -60, moral: 7, reputacion: 2, flags: { em_aniv_debut: "flores" } }, "La nota dice: «Gracias por acordarte siempre». Tu madre te llama llorando de alegría. «Si no fuera por ti, no sé qué haría con tanta camiseta», dice. Ríes y sientes el nudo."),
      o("b", "Revisar el vídeo de tu debut con calma", "Mirar atrás", { moral: 5, forma: 1, flags: { em_aniv_debut: "video" } }, "Te ves joven, torpe, entusiasmado. Hay un pase que fallaste y una carrera que no diste. También un gol que no marcaste y que ahora recuerdas como si lo hubieras hecho. Sonríes. Cualquier tiempo pasado, aunque torpe, fue importante."),
    ]),
  S("em-despedida-amigo", "emocion", { minAge: 19, clubTurns: [4, 400], notFlags: ["em_desp_amigo"] }, "vestuario",
    "Tu mejor amigo del vestuario se va a otro club y no sabes cómo despedirte",
    "Te lo dice en el aparcamiento, con las llaves en la mano y los ojos en el suelo: «Me voy. Es lo mejor para mi carrera». Os habéis ayudado en lo bueno y en lo malo, habéis reído en los hoteles y llorado en los autobuses. Ahora, con la maleta en el coche, intentas buscar la frase perfecta. No la encuentras. Os abrazáis en silencio.",
    [
      o("a", "Regalarle algo con un significado compartido", "Un detalle", { patrimonio: -80, moral: 5, reputacion: 2, flags: { em_desp_amigo: "regalo", amigo_vestuario_se_fue: true }, }, "Le das la libreta donde apuntabais las bromas del vestuario. Él la abre, lee dos líneas y se ríe y llora a la vez. «Te llamo mañana», dice. Y lo cumple, a las ocho en punto."),
      o("b", "Prometer que seguiréis en contacto y cumplirlo", "Un compromiso", { moral: 4, flags: { em_desp_amigo: "contacto", amigo_vestuario_se_fue: true }, }, "Quedáis en hablar cada domingo. Al principio, lo hacéis. Con los años, menos. Pero siempre que alguno cuelga, se queda con una sonrisa de oreja a oreja."),
      o("c", "Decirle que sin él nada será igual", "Ser sincero", { moral: 2, rel_vestuario: 2, flags: { em_desp_amigo: "sincero", amigo_vestuario_se_fue: true }, }, "Lo dices con la voz rota. Él te abraza más fuerte. «Tú serás el que cuide el vestuario», murmura. Y así será: serás, a partir de ahora, el que guarde sus historias.", { thread: th("promesa", "tu amigo del vestuario", "Os prometisteis cenar juntos cuando coincidierais de nuevo.") }),
    ]),
];
