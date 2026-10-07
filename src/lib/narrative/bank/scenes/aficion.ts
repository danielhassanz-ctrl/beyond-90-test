/**
 * La ciudad y la grada: el taxista que opina, la abuela más ultra del estadio, el niño que te espera
 * cada tarde en la puerta. Casi todo es sencillo y humano; algunas cosas, con los años, vuelven.
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene } from "../types";

export const AFICION: BankScene[] = [
  S("af-taxista", "aficion", { minAge: 17, clubTurns: [2, 400], fama: [15, 100] }, "vida",
    "Un taxista te da su opinión durante todo el trayecto",
    "Te ha reconocido en cuanto has cerrado la puerta. Durante veinte minutos, sin respirar, el taxista te explica por qué el equipo está mal, cómo tendrías que jugar tú y qué le diría él al presidente. No sabe que eres tú: cree que eres «un chaval que se parece». Lo cuenta con una pasión que contagia. Y lo peor: tiene algo de razón.",
    [
      o("a", "Seguirle la corriente y tomar nota", "Escuchar de verdad", { moral: 3, reputacion: 2, rel_aficion: 2 }, "Le dejas hablar. Cuando llegas a tu destino, él se gira, te mira y dice: «¿Eres tú? ¡No me jodas!». Se pone rojo. Te devuelve el dinero de la carrera y una gorra que lleva en el salpicadero. «Gánate el próximo, anda»."),
      o("b", "Revelar quién eres al final del trayecto", "La sorpresa", { fama: 2, rel_aficion: 4, moral: 4 }, "«Soy el del equipo que critica», dices. El taxista suelta una carcajada y se pone a llorar de risa. Se hace una foto contigo y la cuelga, con orgullo, en el retrovisor."),
      o("c", "Defender al equipo, sin decir quién eres", "Discutir un poco", { moral: 1, rel_aficion: 1 }, "Discutís durante diez minutos con pasión. Al bajar, el taxista murmura: «Qué carácter tiene el chaval». No sabe que has jugado con ese mismo carácter media vida."),
    ]),
  S("af-nino-espera", "aficion", { minAge: 17, clubTurns: [3, 400], fama: [25, 100], notFlags: ["nino_espera"] }, "vida",
    "Un niño te espera cada tarde en la puerta del campo",
    "Lleva tres semanas apareciendo a la misma hora, con una camiseta tuya demasiado grande y una mochila con un balón pinchado. No pide nada: solo mira. Cuando sales, levanta la mano. Tú levantas la tuya. Un día, el guardia de seguridad te dice por lo bajo: «Es de aquí. Su madre trabaja de limpiadora en el estadio. Dice que quiere ser como tú».",
    [
      o("a", "Invitarle a un entrenamiento y regalarle un balón nuevo", "Hacerle un hueco", { patrimonio: -80, moral: 6, rel_aficion: 4, reputacion: 3, flags: { nino_espera: "invitado" } }, "El niño pasa la mañana en la banda, con ojos como platos. Al final, le regalas un balón firmado. No dice nada; solo te abraza. Su madre, que mira desde lejos, se seca las lágrimas con el trapo de limpiar."),
      o("b", "Saludarle cada tarde, sin más", "Un gesto cotidiano", { moral: 3, rel_aficion: 2, flags: { nino_espera: "saludo" } }, "Los saludos se convierten en una costumbre. Al cabo de un mes, el niño ya no se corta: te cuenta cómo le ha ido en el cole y cómo ha marcado tres goles en el recreo. Tú le dices: «Cuéntame más»."),
      o("c", "No parar nunca: es tu rutina y no te gusta alterarla", "Pasar de largo", { moral: -2, flags: { nino_espera: "nada" } }, "Sigues tu camino con auriculares y prisa. Un día, el niño deja de estar en la puerta. No sabes por qué. Aprietas el paso y no vuelves la vista."),
    ]),
  S("af-nino-crece", "aficion", { after: [after("af-nino-espera", "a", 20, 140)], minAge: 22 }, "vida",
    "Aquel niño de la puerta entra en la cantera",
    "Te llega un mensaje del guardia de seguridad, que ya es un hombre mayor: «Te acuerdas del niño de la mochila, ¿verdad? Ha pasado las pruebas de la cantera». Una foto: un chaval espigado con una camiseta del club y una sonrisa enorme. Detrás, la madre, con el delantal. «Pregunta por ti todos los días», añade el guardia. «Y sigue sin pedirte nada».",
    [
      o("a", "Ir a verle en persona y firmarle su primera equipación", "Estar en su momento", { moral: 10, reputacion: 6, rel_aficion: 5, flags: { nino_cantera: true } }, "Llegas a la ceremonia sin avisar. Cuando el niño te ve, se queda sin palabras y se le cae el balón. Su madre se echa a llorar, y tú te vas con ese trapo de limpiar guardado en el bolsillo, regalo de ella."),
      o("b", "Enviarle una carta de ánimo y un par de botas", "Un regalo a distancia", { patrimonio: -150, moral: 6, reputacion: 3 }, "Le escribes: «Esto empieza ahora. Disfrútalo». Las botas son del número equivocado, y el niño se las cambia por otro par con una sonrisa. En la carta guardó una foto vuestra, con la camiseta demasiado grande."),
    ]),
  S("af-abuela-ultra", "aficion", { minAge: 17, clubTurns: [2, 400], notFlags: ["abuela_ultra"] }, "vida",
    "La abuela más ultra del estadio",
    "Se llama Concha, tiene ochenta y cuatro años, un abrigo de piel que parece del siglo pasado y un silbato que usa sin piedad. En cada partido, desde la fila 2, increpa al árbitro, a los rivales y a veces a ti: «¡Eh, tú, el del 9, que te duermes!». Hoy, a la salida, se te acerca con un bocadillo envuelto en papel de aluminio: «Cómetelo, que estás muy flaco».",
    [
      o("a", "Aceptar el bocadillo y comerlo con ella en la grada", "Compartir", { moral: 6, rel_aficion: 6, reputacion: 3, flags: { abuela_ultra: "amiga" } }, "Os sentáis juntos en las escaleras. El bocadillo es de tortilla con pimientos y está buenísimo. Concha, con la boca llena, te regaña por tres cosas del último partido. Todas con razón."),
      o("b", "Agradecerlo y guardarlo para después", "Educado", { moral: 2, rel_aficion: 3, flags: { abuela_ultra: "cordial" } }, "Lo guardas en la mochila y se te olvida. Al día siguiente, Concha te pregunta: «¿Qué tal el bocadillo?». «Buenísimo», mientes. «No me mientas, chaval». Te lo come ella."),
      o("c", "Pedirle que no te grite tanto en los partidos", "Poner un límite con cariño", { moral: 1, rel_aficion: -1, flags: { abuela_ultra: "tensa" } }, "Concha te mira con la ceja levantada: «Pues juega mejor». Se va, con paso ligero, sin su bocadillo. La semana siguiente, desde la grada, te grita más. Pero ahora lo hace con una sonrisa."),
    ]),
  S("af-abuela-adios", "aficion", { after: [after("af-abuela-ultra", "a", 25, 160)], minAge: 24 }, "vida",
    "Concha ya no está en la fila 2",
    "Un día, durante el calentamiento, buscas su silbato entre el ruido de la grada y no lo encuentras. Preguntas al utillero, que se encoge de hombros con tristeza: «Concha nos dejó la semana pasada». En su asiento, alguien ha colocado un ramo de claveles rojos, un silbato oxidado y un bocadillo envuelto en aluminio. En el aluminio, escrito a rotulador: «Para el del 9».",
    [
      o("a", "Subir a la grada, coger el bocadillo y comértelo allí", "Despedirte", { moral: -4, rel_aficion: 8, reputacion: 4, flags: { concha_recuerdo: true } }, "Te sientas en su asiento y te lo comes despacio. Es tortilla con pimientos, como siempre. Los aficionados de alrededor guardan silencio. Alguien silba, flojito, con un silbato. Todo el estadio se lo agradece."),
      o("b", "Dedicarle el gol de ese día mirando al cielo", "Un homenaje", { moral: 5, rel_aficion: 7, fama: 2, flags: { concha_recuerdo: true } }, "Marcas en la segunda parte y no celebras corriendo: levantas la vista y señalas la fila 2. El estadio entero se pone en pie. En el borde de la grada, alguien hace sonar un silbato. Te cuesta jugar el resto del partido."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a footballer looking up at the sky and pointing towards an empty seat in the stands after scoring, floodlights, emotional, red carnations on a seat, no logos or readable text" }),
  S("af-ultras", "aficion", { minAge: 18, clubTurns: [3, 400], clubLevels: ["grande", "europeo"], notFlags: ["af_ultras"] }, "vida",
    "Los ultras te piden que subas a cantar con ellos",
    "Son los del fondo norte, los de los tambores, las bengalas y las bufandas hasta el suelo. Tras ganar un derbi, hacen un gesto desde la valla: quieren que subas. Todo el estadio mira. Uno de los capos te grita: «¡Sube, que te dedicamos una canción!». Tu agente, en la distancia, niega con la cabeza. Tú dudas.",
    [
      o("a", "Subir y cantar con ellos", "Compartir el momento", { rel_aficion: 8, fama: 3, moral: 6, reputacion: -2, flags: { af_ultras: "subo" } }, "Subes a la valla y cantas, con la camiseta sudada, un himno que apenas te sabes. Los ultras te levantan en volandas. Al día siguiente, la prensa te critica y la afición te ama. Tu agente te llama: «¿Estabas loco?». Estabas feliz."),
      o("b", "Agradecérselo desde abajo con un gesto", "Mantener la distancia", { rel_aficion: 4, reputacion: 1, moral: 2, flags: { af_ultras: "distancia" } }, "Les aplaudes con las dos manos y les lanzas un beso. Se quedan satisfechos, y los medios no tienen de qué hablar. Pero tú, en la ducha, piensas que podrías haber subido."),
      o("c", "Hacer un gesto de respeto y marcharte al vestuario", "Profesional", { reputacion: 2, rel_aficion: -1, moral: 0, flags: { af_ultras: "paso" } }, "Les saludas y te metes en el túnel. Al día siguiente, una pancarta dice: «El 9 es un señor». No sabes si es un elogio o un reproche."),
    ]),
  S("af-radio", "aficion", { minAge: 18, clubTurns: [2, 400], fama: [25, 100], notFlags: ["af_radio"] }, "prensa",
    "Te llaman a un programa de radio donde un oyente te insulta en directo",
    "Es un programa deportivo local de las diez de la noche, con tertulianos, risas enlatadas y teléfonos abiertos. De repente, un oyente que se hace llamar «Paco de Vallecas» empieza a explicar, con detalles técnicos, por qué eres un fraude. El presentador, sorprendido, te mira por el cristal del estudio. Tienes el micro abierto.",
    [
      o("a", "Responder con humor y elegancia", "Ganar el combate", { fama: 4, reputacion: 4, rel_aficion: 3, moral: 4, flags: { af_radio: "humor" } }, "«Paco, tienes mucha razón en una cosa: me falta mucho por mejorar. Pero el domingo marco por ti». El estudio se desmorona. Paco, abochornado, pide perdón. El domingo, marcas. La radio te dedica un jingle."),
      o("b", "Cortar la llamada con educación y pasar a otro tema", "Evitar el barro", { reputacion: 2, moral: 0, flags: { af_radio: "corto" } }, "Dices «gracias por la opinión» y pides pasar a otro tema. El presentador te lo agradece. Pero a Paco, que sigue en antena, se le oye susurrar: «Qué hombre más educado»."),
      o("c", "Contestar con enfado y pedir respeto", "Perder los papeles", { fama: 2, rel_aficion: -3, reputacion: -3, moral: -3, flags: { af_radio: "enfado" } }, "Levantas la voz. El presentador intenta calmarte, pero ya es tarde: la grabación está en todas las redes con el titular «El delantero que se enfadó con un oyente». Al día siguiente, Paco es el héroe de la ciudad."),
    ]),
  S("af-mural", "aficion", { minAge: 18, fama: [45, 100], clubTurns: [4, 400], notFlags: ["af_mural"] }, "vida",
    "Pintan un mural gigante con tu cara en una pared del barrio",
    "Es un muro enorme, de tres pisos de altura, en la avenida principal. Un artista local ha pintado tu cara con un realismo asombroso, mezclando tu sonrisa con la bandera del club. La noticia ha corrido por todo el barrio: hay turistas que se hacen fotos debajo. Tú no lo sabías y te enteras por un mensaje de tu madre: «Hijo, estás en la calle».",
    [
      o("a", "Ir a conocer al artista y darle las gracias", "Un reconocimiento", { rel_aficion: 6, reputacion: 4, moral: 6, flags: { af_mural: "artista" } }, "El artista, un chaval de veintitrés años, te explica el proceso con ojos brillantes. Le compras un cuadro para tu casa y le abres una cuenta para exponer. Una semana después, otro mural, esta vez tuyo, aparece en otra ciudad."),
      o("b", "Hacerte una foto y publicarla en redes", "Dejarte querer", { fama: 4, rel_aficion: 4, moral: 4, flags: { af_mural: "foto" } }, "La foto bajo el mural tiene tres millones de visualizaciones. El artista te escribe: «Gracias por el empujón». Tú le respondes: «Gracias por la cara»."),
      o("c", "Pedir con timidez que lo retoquen, que sales de lado", "Con humor", { moral: 3, rel_aficion: 2, flags: { af_mural: "retoque" } }, "El artista se ríe, retoca un ángulo y firma debajo: «El 9, con mejor perfil». Y es verdad: tu madre dice que ahora «pareces tú»."),
    ]),
  S("af-derbi-barbero", "aficion", { minAge: 17, clubTurns: [3, 400], clubLevels: ["grande", "europeo", "modesto"], notFlags: ["af_barbero"] }, "vida",
    "Tu barbero es hincha del rival y te lo recuerda cada semana",
    "Es una amistad imposible. Va con la camiseta del rival bajo la bata, tiene un póster de su ídolo junto al espejo y te corta el pelo mientras te explica por qué «vuestra defensa es de papel». Te lo dice con cariño, con tijeras en la mano. Esta semana, antes del derbi, ha bajado la voz: «Hoy no te voy a cobrar. Si ganáis, me debes una cerveza. Si perdéis, me debes dos».",
    [
      o("a", "Aceptar la apuesta con una sonrisa", "Apostar con el barbero", { moral: 4, rel_aficion: 2, flags: { af_barbero: "apuesta" } }, "Cerráis el trato con un apretón de manos. El domingo, tu equipo gana 2-1 y tú marcas. El lunes, el barbero te recibe con las dos cervezas y una bandera blanca en el espejo. «Me has fastidiado el barrio», dice, riéndose."),
      o("b", "Cambiar de barbero esa misma semana", "Evitar el riesgo", { moral: -1, flags: { af_barbero: "cambio" } }, "Buscas otro, de otro equipo. Todo es más soso. Al mes, el viejo barbero te saluda por la calle sin rencor: «El pelo te queda peor». No puedes negárselo."),
      o("c", "Retarle a doble o nada", "Subir la apuesta", { moral: 2, reputacion: 1, flags: { af_barbero: "doble" } }, "«Si ganamos, un año sin cobrarme. Si ganáis, un año sin cortarme el pelo», propones. Él acepta, entusiasmado. Ganáis 1-0 con gol tuyo en el 90. Su cara es un poema. Te cobra desde entonces… con una gran sonrisa."),
    ]),
  S("af-carta-nino", "aficion", { minAge: 18, fama: [30, 100], clubTurns: [3, 400], notFlags: ["af_carta"] }, "vida",
    "Una carta de un niño enfermo cambia tu semana",
    "Llega al club, con tu nombre escrito en letras de colores. Está firmada por un niño de nueve años que pasa meses en un hospital y que se pone tu camiseta para ver los partidos desde la cama. Su madre cuenta que, cuando marcas, el niño levanta los brazos desde el suero. «Solo quería que supieras que te quiere mucho», termina la carta.",
    [
      o("a", "Ir al hospital con una camiseta firmada y pasar la tarde con él", "Estar presente", { moral: 9, reputacion: 6, rel_aficion: 5, flags: { af_carta: "visita" } }, "Pasas la tarde jugando a las cartas en una cama con ruedas. El niño gana todas las partidas. Al irte, te da una carta de despedida con un dibujo de tu cara en forma de balón. Sabes que la guardarás siempre.", { thread: th("promesa", "el niño del hospital", "Le prometiste volver a visitarle cuando marcaras un gol más.") }),
      o("b", "Grabarle un vídeo con un mensaje y enviárselo", "Un mensaje a distancia", { moral: 6, reputacion: 3, rel_aficion: 3, flags: { af_carta: "video" } }, "Grabas un vídeo de un minuto en el vestuario con los compañeros saludando. La madre te manda un audio llorando de emoción. «Lo ha visto doce veces», dice. «Y no quiere que lo apague»."),
      o("c", "Pedirle al club que se encargue del asunto", "Delegar", { moral: 1, reputacion: 1, flags: { af_carta: "delegado" } }, "El club prepara un paquete con camisetas y regalos y lo envía en tu nombre. Te sientes un poco ausente. En el fondo, sabes que la carta pedía otra cosa."),
    ]),
  S("af-carta-reencuentro", "aficion", { after: [after("af-carta-nino", "a", 20, 160)], minAge: 23 }, "vida",
    "El niño del hospital es ahora un chico sano con una pregunta",
    "Años después, un mensaje te llega con un adjunto: una foto de un chico alto, sano, sonriente, con la misma camiseta, ya desteñida. «Soy el del hospital —escribe—. Voy a ser médico. Quería que lo supieras: mientras estuve ingresado, tú eras la razón por la que me levantaba de la cama». Detrás del chico, su madre llora.",
    [
      o("a", "Responderle con una llamada y una invitación al estadio", "Invitarle", { moral: 11, reputacion: 7, rel_aficion: 5, flags: { medico_futuro: true } }, "Le invitas al palco, a la cena de después y al vestuario. En la ducha, le regalas tu camiseta usada. «Esto no se la doy a nadie», dices. «Pues a mí sí», contesta él. Ninguno de los dos dice nada más."),
      o("b", "Escribirle una respuesta larga y sincera", "Una carta de vuelta", { moral: 9, reputacion: 5 }, "Escribes durante dos horas, borras tres veces, y al final mandas una página que dice solo lo importante. El chico la imprime y la enmarca. Años después, la lleva consigo al hospital donde trabaja."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a footballer hugging a young man in a faded football shirt in a stadium tunnel, emotional reunion, warm light, no logos or readable text" }),
  S("af-mascota", "aficion", { minAge: 17, clubTurns: [2, 400], notFlags: ["af_mascota"] }, "vida",
    "La mascota del club te pide un favor muy raro",
    "Es un oso gigante de peluche, de uno ochenta, que nunca habla, con una mirada fija y una sonrisa de plástico. Desde dentro, alguien susurra: «Necesito que me eches una mano. Mi compañero de Valladolid se ha puesto enfermo y me han pedido que haga la mascota del rival en el derbi. Es una traición, pero cobro el doble». Te mira por el hueco de la boca.",
    [
      o("a", "Fingir que no has oído nada y mantener el secreto", "Cómplice", { moral: 3, rel_aficion: 1, flags: { af_mascota: "secreto" } }, "El día del derbi, el oso rival hace un baile extraño y se tropieza con un banderín. Todos se ríen. Tú, desde el banquillo, sabes la verdad. Y la guardarás siempre."),
      o("b", "Delatarlo ante el club", "Cumplir con tu deber", { reputacion: 2, rel_aficion: -2, moral: -1, flags: { af_mascota: "delato" } }, "El club despide al oso al día siguiente. Los aficionados te lo reprochan en redes con la etiqueta #LibertadParaElOso. Por la noche, recibes un mensaje anónimo con una sola foto: un oso llorando."),
      o("c", "Pedirle al oso que te regale un peluche igual", "Sacar partido", { patrimonio: -50, moral: 4, flags: { af_mascota: "peluche" } }, "Una semana después, llega a tu casa un oso enano, con una nota: «De parte del grande». Tu perro lo adopta, tu hermana lo cuelga en su cuarto. Tu madre, que lo ve, dice: «Qué mono». No se lo cuentes al club."),
    ]),
];
