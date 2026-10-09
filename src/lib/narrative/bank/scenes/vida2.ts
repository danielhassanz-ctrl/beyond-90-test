/**
 * Familia, pareja y cabeza: lo que ocurre en casa cuando el fútbol te cambia la vida. Cada escena deja una huella (relaciones,
 * estados con efecto, hilos que vuelven) y algunas se encadenan con otras.
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const ADULTO: BankWhen = { minAge: 18, maxAge: 40 };
const LIBRE = ["estado_preocupado", "estado_castigo"];

export const VIDA2: BankScene[] = [
  // ───────────── Familia ─────────────
  S("v2-padre-grada", "familia", { ...ADULTO, fama: [30, 100], notFlags: ["v2_padre_grada"], clubTurns: [3, 400] }, "vida",
    "Tu padre discute con otros aficionados en la grada",
    "Te lo cuentan en el descanso: tu padre, que lleva toda la vida diciendo que el fútbol no se grita, ha estado a punto de pegarse con un aficionado que te insultaba tres filas más abajo. La seguridad ha tenido que intervenir. Sale en las redes en un vídeo de dieciocho segundos con un título sin piedad: «Padre de crack, a los puños».",
    [
      o("a", "Llamarlo y pedirle que no se meta en peleas por ti", "Con cariño", { moral: -1, reputacion: 2, flags: { v2_padre_grada: true } }, "Lo llamas después del partido. Al otro lado, un silencio de padre pillado. «Es que no podía dejarlo pasar, hijo». «Lo sé. Pero déjame a mí, que para eso tengo botas». Os reís los dos. A partir de entonces, se sienta con una bufanda y una botella de agua y cuenta hasta diez."),
      o("b", "Hacer un gesto público de cariño hacia él en el siguiente partido", "Sacar pecho", { rel_aficion: 3, moral: 3, flags: { v2_padre_grada: true } }, "Marcas, corres hacia el córner y le señalas en la grada con las dos manos. El estadio le aplaude, él se pone rojo y se levanta con un gesto torpe. Alguien lo sube a las redes: «El padre de la afición»."),
      o("c", "Ignorarlo: es cosa suya", "No meterte", { moral: -1, rel_aficion: -1, flags: { v2_padre_grada: true } }, "Dejas que pase. Pero cada vez que sales a calentar, miras la grada buscando su cara. No saber si hoy se contiene te distrae más de lo que querrías."),
    ]),
  S("v2-hermano-estudios", "familia", { ...ADULTO, fama: [30, 100], notFlags: ["v2_hermano"], clubTurns: [3, 400] }, "vida",
    "Tu hermano pequeño quiere dejar los estudios para ser como tú",
    "Tu madre te lo cuenta con la voz de quien lleva una semana dándole vueltas: tu hermano pequeño quiere dejar el instituto para dedicarse al fútbol. Tiene catorce años, una camiseta tuya y la absoluta seguridad de que «a mí me van a fichar». Te pregunta con ojos de héroe qué piensas. Tú sabes que la mayoría de los chavales no llegan.",
    [
      o("a", "Explicarle de verdad lo difícil que es y pedirle que no deje los estudios", "Con la verdad", { moral: 2, reputacion: 2, flags: { v2_hermano: true } }, "Te sientas con él una tarde entera, le cuentas todo: las lesiones, las noches de miedo, los compañeros que se quedaron por el camino. Se queda callado. «¿Y tú volverías a hacerlo?». Dices que sí. Él también, pero con el instituto de por medio."),
      o("b", "Apuntarlo a una buena academia y a la vez a una tutoría", "Un plan", { patrimonio: -2500, moral: 3, flags: { v2_hermano: true } }, "Pagas la academia y una tutora para que no pierda el curso. Los dos primeros meses se queja de todo; el tercero se levanta solo a las siete para ir. Tu madre te agradece el plan con una llamada de media hora."),
      o("c", "Decirle que sí, que si le gusta tanto, lo intente", "Apoyarlo", { moral: 1, rel_representante: -1, flags: { v2_hermano: true, estado_preocupado: "@WEEK+3" } }, "Se pone a saltar de alegría. Tu madre, desde la cocina, te mira con una ceja levantada que dice mucho. A las pocas semanas, empiezas a sentir esa mezcla rara de orgullo y miedo que solo conocen los hermanos mayores."),
    ]),
  S("v2-abuela", "familia", { ...ADULTO, notFlags: [...LIBRE, "v2_abuela"], clubTurns: [2, 400] }, "vida",
    "Tu abuela ingresa en el hospital",
    "Tu madre te llama en medio de una sesión de vídeo: la abuela, la que lleva viéndote jugar desde el patio del colegio, ha tenido una caída y está en el hospital. «No es grave, pero pregunta por ti». Tienes dos entrenamientos y un partido por delante. Y la abuela, en una cama de hospital, preguntando por ti.",
    [
      o("a", "Ir a verla hoy mismo, aunque te pierdas un entrenamiento", "Ir ya", { rel_entrenador: -1, moral: 5, flags: { v2_abuela: true } }, "Pasas tres horas con ella en la habitación, con la mano entre las tuyas. Le cuentas tus partidos, le enseñas vídeos. «Qué guapo estás en la tele, hijo». Sale del hospital a los diez días con las mismas ganas de regañarte de siempre."),
      o("b", "Llamarla desde el club y visitarla el fin de semana", "Equilibrio", { moral: 2, flags: { v2_abuela: true } }, "La llamas cada noche. El sábado, con el partido ya jugado, te plantas en el hospital con un ramo de flores y una camiseta firmada. La abuela se la pone encima del camisón: «Para que me traten bien»."),
      o("c", "Quedarte con el equipo: es semana de partido importante", "El club primero", { moral: -3, rel_entrenador: 1, flags: { v2_abuela: true, estado_preocupado: "@WEEK+4" } }, "Haces lo que tienes que hacer, y cada noche, en el hotel de concentración, miras el móvil con el pulgar sobre el nombre de tu madre. La abuela se recupera, pero tú te quedas con una pregunta pegada a las costillas que no te abandonará hasta mucho después."),
    ]),
  S("v2-madre-boda", "familia", { ...ADULTO, minAge: 22, flags: ["pareja"], notFlags: ["v2_madre_boda"], clubTurns: [3, 400] }, "vida",
    "Tu madre pregunta cuándo vais a casaros",
    "En la comida del domingo, entre el segundo plato y el postre, tu madre lo deja caer con una naturalidad que no engaña a nadie: «Lleváis mucho tiempo juntos. ¿Os lo estáis pensando?». {pareja} se atraganta con el agua. Tu padre mira al techo. Hay un silencio largo, de los que parecen de película.",
    [
      o("a", "Decir que sí, que lo estáis hablando", "Con ilusión", { moral: 4, flags: { v2_madre_boda: true, pareja_compromiso: true } }, "{pareja} te mira de reojo, sonríe, y bajo la mesa te aprieta la mano. Tu madre rompe a llorar con un trozo de pan en la mano. Esa tarde, entre postre y café, se decide una fecha tentativa y se descartan seis restaurantes."),
      o("b", "Decir que aún no es el momento, y que se tranquilice", "Con calma", { moral: -1, flags: { v2_madre_boda: true } }, "«Mamá, cuando llegue, os avisamos los primeros». Ella se encoge de hombros, ofendida de forma muy teatral. {pareja} te lo agradece con una mirada. Algo se ha quedado dicho sin decirse."),
      o("c", "Cambiar de tema con un chiste", "Esquivar", { moral: 0, flags: { v2_madre_boda: true } }, "Funciona. Pero al volver a casa, {pareja} te pregunta con una media sonrisa qué habrías contestado si no hubieras hecho el chiste. No tienes una respuesta que te guste."),
    ]),
  S("v2-padre-jubila", "familia", { ...ADULTO, patrimonio: [30000, 100000000], notFlags: ["v2_padre_jubila"], clubTurns: [3, 400] }, "vida",
    "Tu padre se resiste a dejar de trabajar",
    "Tu padre lleva cuarenta años en el mismo taller, con las mismas manos y la misma espalda cada vez más encorvada. Tú ya podrías permitírtelo: que lo deje, que vaya a pescar, que cuide a tu madre. Pero cada vez que se lo propones, te responde con la frase de siempre: «Yo no vivo de lo que ganas tú». Hoy se ha torcido una muñeca y se ha puesto de peor humor que nunca.",
    [
      o("a", "Comprarle el taller para que lo lleve a su ritmo", "Respetando su orgullo", { patrimonio: -9000, moral: 5, flags: { v2_padre_jubila: true } }, "Le dices que es una inversión, que no lo regalas: que lo compras y se lo dejas llevar. Él lo piensa una semana y acepta, con una condición: que le dejes pagarte alquiler simbólico. Cada fin de mes te manda un euro por transferencia. Lo guardas como un tesoro."),
      o("b", "Insistir en que se retire y se dedique a descansar", "Cuidarlo", { moral: -1, flags: { v2_padre_jubila: true } }, "Lo discutís durante dos semanas. Al final cede, y se jubila con la cara de quien ha perdido una batalla. Los primeros meses son raros: hay un hombre en casa que no sabe qué hacer con las manos. Luego descubre la pesca y empieza a sonreír otra vez."),
      o("c", "No decir nada: es su vida", "Respetar", { moral: 1, flags: { v2_padre_jubila: true } }, "Lo dejas ser. Sigue yendo al taller cada mañana a las siete. Cuando te lo cruzas, con los hombros cargados y una sonrisa, entiendes que algunas personas no se jubilan: se desgastan con orgullo."),
    ]),

  // ───────────── Pareja ─────────────
  S("v2-celos-redes", "pareja", { ...ADULTO, flags: ["pareja"], fama: [40, 100], notFlags: ["v2_celos"], clubTurns: [2, 400] }, "vida",
    "{pareja} se pone celosa de una seguidora",
    "Todo empieza con un comentario: una seguidora que te escribe «guapo» en cada foto. Luego, un like de hace tres meses a una foto de otra chica. Luego, una conversación a las dos de la mañana en la cocina. «No es que no me fíe. Es que tu móvil es un campo minado y yo no sé desactivarlo». Tiene los ojos rojos y una voz muy tranquila.",
    [
      o("a", "Enseñarle el móvil y hablarlo todo con tranquilidad", "Transparencia", { moral: 2, flags: { v2_celos: true } }, "Le tiendes el móvil. Ella lo mira, lo deja sobre la mesa sin abrirlo. «No hace falta. Solo quería que me lo ofrecieras». Os abrazáis, y esa noche el móvil se queda cargando en la cocina."),
      o("b", "Decirle que exagera y que eso no es nada", "Quitarle hierro", { moral: -3, flags: { v2_celos: true, dc_pareja_dolida: true } }, "Lo dices con tono ligero, y el tono es peor que el contenido. Ella cierra la conversación con un «vale» seco que sabes interpretar. Pasan dos semanas con una frialdad doméstica de la que no sabes salir."),
      o("c", "Borrar las cuentas que molestan y pedirle perdón", "Reparar", { moral: 1, fama: -1, flags: { v2_celos: true } }, "Bloqueas a tres cuentas y limitas los comentarios. Ella te lo agradece con un gesto que sabes que no dice todo. «No hacía falta», murmura. Sí que hacía falta, y los dos lo sabéis."),
    ]),
  S("v2-pareja-mudanza", "pareja", { ...ADULTO, flags: ["pareja"], notFlags: ["v2_pareja_mudanza"], clubTurns: [1, 4] }, "vida",
    "{pareja} duda si mudarse contigo a la ciudad nueva",
    "Fichar por un club de otra ciudad es la parte fácil. La difícil es la cena en que {pareja} te mira y te dice que no sabe si es capaz de dejar su trabajo, su familia, su gente. «Te quiero. Pero no sé si quiero ser la novia del futbolista de otra ciudad». No es un ultimátum: es una verdad dicha con demasiado cariño.",
    [
      o("a", "Proponerle una temporada de prueba y volver juntos si no funciona", "Un plan", { moral: 3, flags: { v2_pareja_mudanza: true } }, "Dices que podéis intentarlo seis meses, con la puerta de vuelta abierta. Ella sonríe, aliviada. El primer mes echa de menos su ciudad; el tercero, ya te enseña dónde se toma el mejor café."),
      o("b", "Aceptar que se quede y mantener la relación a distancia", "Respetar", { moral: -3, flags: { v2_pareja_mudanza: true, estado_preocupado: "@WEEK+4" } }, "Os veis los fines de semana libres, con vuelos de última hora. Los primeros meses es romántico. Luego es cansado. A veces te pasas la noche mirando el móvil con una videollamada abierta y nadie en pantalla."),
      o("c", "Pedirle que lo piense bien: si no, mejor cortar ahora", "Ultimátum", { moral: -4, flags: { v2_pareja_mudanza: true, pareja: "", estado_preocupado: "@WEEK+3" } }, "Se queda callada. Pasa una semana sin escribirte. Una noche, desde un número desconocido, recibes una frase corta: «Gracias por todo». Cuando la lees, comprendes que lo has perdido todo para ganar un poco de tranquilidad que no te dura ni un día."),
    ]),
  S("v2-pareja-gala", "pareja", { ...ADULTO, flags: ["pareja"], fama: [50, 100], notFlags: ["v2_gala"], clubTurns: [3, 400] }, "especial",
    "{pareja} te acompaña a una gala y roba todas las miradas",
    "La alfombra roja es un túnel de flashes y gritos. {pareja}, con un vestido que ha elegido ella sola, cruza a tu lado con una seguridad que no tenías ni tú el día del debut. Un fotógrafo grita su nombre; otro, el tuyo; un tercero, los dos a la vez. Por un momento, os miráis, y os parece que no hay nadie más. Ella, bajito: «Esto es más divertido de lo que pensaba».",
    [
      o("a", "Posar con ella y dejar que sea ella quien brille", "Dejarla brillar", { moral: 5, fama: 3, rel_aficion: 1, flags: { v2_gala: true } }, "Das un paso atrás y le dejas el centro. Las fotos son una sensación: «La pareja de la noche». Ella, al volver a casa, se quita los zapatos y te dice que ha sido la mejor noche de su vida."),
      o("b", "Aprovechar para lanzar una frase para los medios", "Un gesto", { fama: 4, moral: 2, flags: { v2_gala: true } }, "Dices con una sonrisa: «Aquí, el único que no sale bien en las fotos soy yo». Los medios sacan la frase en todos los titulares, y ella te dedica una mirada de reproche cariñoso: «Qué morro tienes»."),
    ]),

  // ───────────── La cabeza ─────────────
  S("v2-ansiedad-final", "mente", { ...ADULTO, roles: ["titular", "rotacion"], notFlags: [...LIBRE, "estado_bache", "v2_ansiedad"], clubTurns: [4, 400], moral: [0, 85] }, "vida",
    "El miedo a fallar antes de un partido grande",
    "No es nervio normal. Es un nudo en el estómago que no se va con el desayuno, una voz que repite en bucle los fallos de la semana pasada, y unas piernas que, en el calentamiento, no sientes del todo tuyas. En el vestuario, mientras te atas las botas, una mano tiembla y no sabes si es la tuya. Faltan cuarenta minutos para el partido más importante del año.",
    [
      o("a", "Respirar, cerrar los ojos y repetir la rutina de siempre", "Rutina", { forma: 2, moral: 2, flags: { v2_ansiedad: true } }, "Calcetín derecho, calcetín izquierdo, una canción, cuatro respiraciones. El nudo se afloja un poco, y la voz se hace un poco más pequeña. Cuando sales al campo, el estadio te parece enorme y hermoso en lugar de amenazante."),
      o("b", "Hablar con el capitán y contarle cómo te sientes", "Abrirte", { rel_vestuario: 4, moral: 3, flags: { v2_ansiedad: true } }, "El capitán, con cara de padre, te pone la mano en el hombro. «A mí también me pasa, todos los partidos. El truco es que se te note menos». Es la mejor charla técnica que te han dado."),
      o("c", "Tragártelo y salir a jugar como si no pasara nada", "Aguantar", { forma: -2, moral: -2, flags: { v2_ansiedad: true, estado_bache: "@WEEK+3" } }, "Sales al campo con la espalda recta y la cabeza llena de ruido. Dos errores seguidos en los primeros diez minutos te hunden. La grada, que huele el miedo, te lo devuelve con un murmullo."),
    ]),
  S("v2-fantasma-lesion", "mente", { ...ADULTO, roles: ["titular", "rotacion"], notFlags: [...LIBRE, "v2_fantasma"], clubTurns: [3, 400] }, "entrenamiento",
    "El miedo a volver a lesionarte",
    "Estás recuperado. Los médicos lo dicen, las pruebas lo confirman, el fisio sonríe. Pero cada vez que ves a un defensa venir a por ti, tus piernas hacen una micro-pausa de medio segundo que nadie más ve y que a ti te quema por dentro. En el último rondo, has frenado una carrera por puro miedo. El míster no ha dicho nada, pero ha tomado nota.",
    [
      o("a", "Hablar con el psicólogo del club sobre ese miedo", "Buscar ayuda", { moral: 3, forma: 1, flags: { v2_fantasma: true } }, "El psicólogo no te dice que no tengas miedo: te enseña a mirarlo. Una semana después, en un choque limpio, no frenas. Ese día, sin saberlo, has vuelto."),
      o("b", "Forzar los contactos en el entrenamiento hasta que se pase", "A la brava", { forma: -1, moral: 1, rel_entrenador: 1, flags: { v2_fantasma: true } }, "Te lanzas a todos los balones divididos. Te das dos golpes. El miedo disminuye a la tercera caída, y a la sexta ya no tiene voz. Tu cuerpo, que había aprendido a protegerse, reaprende a confiar."),
      o("c", "No decir nada y esperar a que se pase solo", "Callar", { moral: -2, flags: { v2_fantasma: true, estado_bache: "@WEEK+3" } }, "Va y viene como una marea. Algunos días lo olvidas; otros, te frena en seco. Cuando el míster, por fin, te pregunta qué te pasa, ya llevas un mes sin atreverte a jugar con el pie entero."),
    ]),
];
