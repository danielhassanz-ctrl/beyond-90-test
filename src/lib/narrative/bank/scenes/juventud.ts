/**
 * Los primeros años (16-23): primer sueldo, residencia, exámenes, la primera roja, el chaval que te
 * pide un autógrafo y que algún día aparecerá en el vestuario. Cosas pequeñas con raíces largas.
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene } from "../types";

export const JUVENTUD: BankScene[] = [
  S("jv-primer-sueldo", "juventud", { minAge: 16, maxAge: 22, clubTurns: [1, 30], notFlags: ["primer_sueldo"] }, "vida",
    "Tu primer sueldo de verdad",
    "Es un ingreso en el banco con un número que no se parece a nada de lo que has visto en tu vida. Lo ves en la aplicación, a las ocho de la mañana, antes de entrenar, con el café en la mano. Lo miras tres veces para comprobar que no es un error. Tu madre, desde la cocina, pregunta: «¿Qué te pasa en la cara?».",
    [
      o("a", "Gastar una parte en regalarle algo grande a tu madre", "Agradecer", { patrimonio: -1800, moral: 8, reputacion: 2, flags: { primer_sueldo: "madre" } }, "Le compras la lavadora que lleva diez años pidiendo, con un lazo enorme en la puerta. Tu madre se queda mirándola y llora de risa. «Era la tuya la que no se podía arreglar», dice."),
      o("b", "Comprarte las botas más caras del mercado", "Un capricho", { patrimonio: -700, moral: 5, forma: 1, flags: { primer_sueldo: "botas" } }, "Pagas las botas con una sonrisa. Te las pones y no quieres quitártelas ni para dormir. Un compañero te mira los pies y dice: «Tienes pinta de crack». Tú aún no te lo crees."),
      o("c", "Guardarlo todo y no tocar ni un euro", "Ahorrar", { patrimonio: 1500, moral: 1, reputacion: 2, flags: { primer_sueldo: "ahorro" } }, "Pones el dinero en una cuenta y no lo miras. Tu padre, que no habla mucho, te da una palmada en el hombro: «Eso es de hombre mayor». No sabes si es un elogio o una advertencia."),
    ]),
  S("jv-madre-recuerda", "juventud", { after: [after("jv-primer-sueldo", "a", 25, 150)], minAge: 20 }, "vida",
    "Tu madre sigue usando la lavadora del primer sueldo",
    "Han pasado los años y la lavadora, que debería haber muerto hace mucho, sigue en el mismo sitio, brillante, con un trapo encima. Tu madre la limpia cada domingo. Le preguntas por qué no se compra una nueva, con todo lo que ganas ahora. Se encoge de hombros: «Esta me la regaló mi hijo cuando tenía diecisiete años. ¿Qué voy a querer yo otra?».",
    [
      o("a", "Quedarte con ella a tomar un café y escucharla", "Estar presente", { moral: 8, reputacion: 3, flags: { madre_lavadora: true } }, "Pasas la tarde en la cocina. Te cuenta cómo fue aquel día, cómo guardó el lazo y cómo lo enseñó a todas las vecinas. Tienes veinte años y por primera vez entiendes qué significa «agradecer»."),
      o("b", "Prometerle una casa nueva con lavadora incluida", "Hacer una promesa", { moral: 4, patrimonio: -500, flags: { madre_casa: "promesa" } }, "«Algún día te compraré una casa con jardín», le dices. Tu madre sonríe sin creérselo del todo: «Con que vengas a comer los domingos, me vale». Pero la promesa se queda en su memoria."),
    ]),
  S("jv-estudios", "juventud", { minAge: 16, maxAge: 21, clubTurns: [1, 60], notFlags: ["estudios"] }, "vida",
    "El examen de matemáticas cae el día del entrenamiento",
    "Tu entrenador del filial no admite faltas. Tu profesora de matemáticas, tampoco. Los dos te miran con la misma expresión de «aquí hay algo que no cuadra». Tienes el examen a las cinco y el entrenamiento a las cinco y cuarto. Tu madre te llama: «Hijo, el fútbol es temporal; las matemáticas, para toda la vida». Y es verdad. Pero el fútbol es ahora.",
    [
      o("a", "Ir al examen y llegar tarde al entrenamiento", "Los estudios primero", { moral: 3, rel_entrenador: -3, reputacion: 2, flags: { estudios: "sigo" } }, "Haces el examen como puedes y llegas veinte minutos tarde al campo. El entrenador te mira, no dice nada y te manda a correr. Cuando acabas, te deja una nota en la taquilla: «Respeto lo que haces»."),
      o("b", "Pedir al entrenador que te deje ir al examen", "Hablarlo antes", { rel_entrenador: 2, moral: 2, reputacion: 1, flags: { estudios: "sigo" } }, "Le explicas tu situación con la voz más seria que tienes. El entrenador te mira, mira el reloj, y dice: «Ve. Pero vuelve». Sales corriendo con la mochila al hombro. Apruebas con un siete."),
      o("c", "Saltarte el examen y quedarte a entrenar", "El fútbol manda", { forma: 2, rel_entrenador: 3, moral: -2, flags: { estudios: "dejo" } }, "Entrenas como nunca, pero por la noche, en casa, tu madre te mira con una tristeza que no se explica. Esa nota, esa calificación, ya no la podrás arreglar. Te acostarás con el estómago encogido."),
    ]),
  S("jv-estudios-titulo", "juventud", { after: [after("jv-estudios", "a", 40, 200)], minAge: 23 }, "vida",
    "Un título que llevas años posponiendo",
    "Una tarde, ordenando papeles en casa, encuentras el sobre de la facultad que dejaste a medias. Lo abres con curiosidad y te encuentras una carta: te quedan solo dos asignaturas para acabar la carrera. Dos. Después de tantos viajes, tantas concentraciones, tantos partidos. Piensas en el día en que dejes el fútbol y en lo que querrías tener en la mano.",
    [
      o("a", "Matricularte en las dos asignaturas que te quedan", "Acabar lo que empezaste", { moral: 6, reputacion: 4, forma: -1, flags: { titulado: true } }, "Entre entrenamientos y viajes, haces los trabajos en aviones y hoteles. Un compañero te ve con un libro de economía y exclama: «¡Un futbolista que lee!». Diez meses después, recibes el título. Tu madre lo enmarca."),
      o("b", "Volver a guardar el sobre en el cajón", "Otra vez, más adelante", { moral: -1, flags: { titulado: "luego" } }, "Lo dejas en el cajón. Sabes que no es una decisión definitiva, pero también que cada año que pasa es un año más difícil. Una voz muy pequeña, dentro de ti, murmura: «Te lo dije»."),
    ]),
  S("jv-residencia", "juventud", { minAge: 16, maxAge: 20, clubTurns: [1, 20], notFlags: ["amigo_residencia"] }, "vida",
    "Tu compañero de habitación ronca como un tractor",
    "Se llama Ismael, viene de un pueblo pequeño, tiene un balón firmado por alguien que no sabe nombrar y una costumbre que te saca de quicio: ronca. Ronca con una constancia que merecería un premio. A las tres de la mañana, tu techo vibra. A las seis, tienes ojeras de villano de dibujos. Él duerme feliz, con la boca abierta, sonriendo en sueños.",
    [
      o("a", "Aceptarlo con humor y ponerle tapones de oídos a la cama", "Adaptarte", { moral: 3, rel_vestuario: 3, flags: { amigo_residencia: "amigo" } }, "Le dejas tapones sobre la almohada con una nota: «Para ti. Y para mí». Ismael lo lee, se ríe, y a partir de esa noche, ronca más bajito. O eso crees tú, con tus tapones puestos."),
      o("b", "Hablarlo con el encargado y pedir el cambio", "Buscar solución", { forma: 2, moral: -1, flags: { amigo_residencia: "cambio" } }, "Te cambian a una habitación al fondo del pasillo, silenciosa. Duermes mejor, pero echas de menos las tonterías de Ismael. Una semana después, te lo encuentras triste en el comedor. Le haces sitio."),
      o("c", "Gastarle una broma para que deje de roncar", "Una venganza", { rel_vestuario: 4, moral: 4, reputacion: -1, flags: { amigo_residencia: "bromista" } }, "Le pones un silbato en el bolsillo del pijama. A las tres de la mañana suena un pitido eterno. Ismael se despierta, te mira y ruge de risa. «Esto te va a costar caro», dice. Y te cuesta, sí, dos semanas de lavar sus calcetines."),
    ]),
  S("jv-residencia-boda", "juventud", { after: [after("jv-residencia", undefined, 30, 200)], minAge: 24 }, "vida",
    "Ismael te pide que seas el padrino de su boda",
    "Después de tantos años desde la residencia, Ismael ha encontrado a alguien que ronca todavía más que él, y se casa en un pueblo de la sierra. Te llama con voz de nervios: «Quiero que seas mi padrino. Con tapones de oídos incluidos, por supuesto». Tú, que has jugado finales con millones mirando, sientes un nudo en el estómago que reconoces enseguida.",
    [
      o("a", "Decir que sí y preparar un discurso", "Ser su padrino", { moral: 9, reputacion: 4, rel_vestuario: 3, flags: { padrino_ismael: true } }, "Preparas un discurso lleno de anécdotas y lo lees con las manos temblorosas. Cuando llegas a la parte de los ronquidos, la sala estalla. Ismael llora, su novia llora, tú lloras. Es la mejor boda a la que has ido."),
      o("b", "Aceptar, pero rogarle que no haya discursos largos", "Aceptar con condiciones", { moral: 6, reputacion: 2, flags: { padrino_ismael: true } }, "Dices que sí, pero con una condición: nada de micrófonos. Ismael lo acepta… y luego, en la boda, te lo pasa a escondidas. Acabas improvisando tres frases torpes y preciosas."),
    ]),
  S("jv-primer-fan", "juventud", { minAge: 16, maxAge: 24, fama: [10, 100], clubTurns: [1, 80], notFlags: ["primer_fan"] }, "vida",
    "Un crío te pide el primer autógrafo de tu vida",
    "Es a la salida del entrenamiento, bajo una llovizna fina. Un niño de diez años, con un gorro de lana y una libreta, se coloca delante de ti con la mirada muy seria: «¿Me firmas aquí? Voy a ser como tú». Tu mano duda. Todavía no has firmado nada, ni una servilleta. El niño espera con el bolígrafo, tiritando.",
    [
      o("a", "Firmarle y escribirle una dedicatoria con su nombre", "Un buen gesto", { moral: 6, rel_aficion: 3, reputacion: 2, flags: { primer_fan: "dedicado" } }, "Escribes: «Para Hugo, que algún día será mejor que yo». El niño lo lee con los labios, sonríe y sale corriendo. Mientras se aleja, descubres que te tiembla la mano. Es la primera vez que alguien cree en ti sin que le hayas dado motivos.", { thread: th("promesa", "Hugo", "Un niño te pidió un autógrafo y te prometió que sería mejor que tú.") }),
      o("b", "Firmarle rápido y seguir hacia el coche", "Con prisa", { moral: 1, flags: { primer_fan: "prisa" } }, "Firmas con un garabato y sigues tu camino. El niño, con la libreta en la mano, se queda mirándote hasta que desapareces. Te sientes un poco ridículo, sin saber por qué."),
      o("c", "Decirle que no hay tiempo y marcharte", "No parar", { moral: -3, reputacion: -2, flags: { primer_fan: "no" } }, "No te giras. Todo el trayecto en coche se te hace largo, con la imagen del niño bajo la lluvia. Esa noche no consigues dormir. Mañana volverás a mirar, por si acaso, esa esquina."),
    ]),
  S("jv-primer-fan-vuelve", "juventud", { after: [after("jv-primer-fan", "a", 30, 200)], minAge: 24 }, "vestuario",
    "El crío del autógrafo debuta en el primer equipo",
    "Ha pasado una década y el niño del gorro de lana ahora mide un metro ochenta, tiene unas piernas como dos columnas y un dorsal en la espalda. Se llama Hugo. En el túnel, antes de salir al campo para su debut, te mira de reojo, sonríe con timidez y saca una libreta vieja del bolsillo de la chaqueta. Está desgastada, con una firma que reconoces.",
    [
      o("a", "Tomar la libreta y firmarle otra dedicatoria en el mismo sitio", "Cerrar un círculo", { moral: 10, reputacion: 6, rel_vestuario: 4, flags: { hugo_debuta: true } }, "Escribes debajo de la antigua: «Ya eres mejor que yo». Hugo se echa a llorar. El árbitro, que lo ve desde el pasillo, finge mirar su reloj. Cuando sale al campo, tiene la mirada de quien ha ganado ya algo grande."),
      o("b", "Chocarle la mano y decirle que dé lo mejor", "Sencillo", { moral: 6, reputacion: 3, rel_vestuario: 2 }, "Chocáis las manos. «Gracias por la libreta», murmuras. «Gracias por el autógrafo», dice él. Salís los dos a un campo lleno. Esa noche piensas en cuántos niños con libretas hay en las gradas."),
    ]),
  S("jv-roja", "juventud", { minAge: 16, maxAge: 23, clubTurns: [2, 100], notFlags: ["jv_roja"] }, "partido",
    "Tu primera tarjeta roja, por una tontería",
    "Fue un instante: un rival que te lleva provocando veinte minutos, un empujón fuera del campo de visión del árbitro y una reacción tuya, instintiva, de las que no se piensan. El árbitro saca la roja con una frialdad que da miedo. El banquillo se queda en silencio. Al salir del campo, ves a tu entrenador con la cabeza entre las manos.",
    [
      o("a", "Pedir perdón al equipo y al rival en cuanto acabe el partido", "Dar la cara", { reputacion: 4, rel_vestuario: 3, rel_entrenador: 2, moral: -2, flags: { jv_roja: "disculpa" } }, "Esperas al rival en el túnel y le tiendes la mano. Él duda, luego la estrecha. «Me pasé yo también», admite. En el vestuario, el capitán te da una palmada en la espalda: «Se aprende a golpes»."),
      o("b", "Defenderte: «Me provocó y el árbitro no lo vio»", "Dar tu versión", { rel_vestuario: 1, rel_entrenador: -3, moral: -3, flags: { jv_roja: "queja" } }, "Tu versión es cierta, pero el entrenador la recibe con los brazos cruzados. «Eso no importa —dice—. Lo que importa es que has dejado a diez compañeros tirados». Duele porque tiene razón."),
      o("c", "Encerrarte en ti mismo y no hablar con nadie", "Rumiarlo", { moral: -5, forma: -1, flags: { jv_roja: "encierro" } }, "En la ducha, solo, te quedas mirando los azulejos. Uno de los veteranos entra, te pone la mano en el hombro y se va sin decir nada. Se agradece más de lo que parece."),
    ]),
  S("jv-roja-leccion", "juventud", { after: [after("jv-roja", undefined, 3, 14)] }, "entrenamiento",
    "El míster te cita para hablar de la roja",
    "No es una bronca: es una conversación a solas en su despacho, con dos cafés y una pizarra apoyada contra la pared. El míster no empieza por la roja. Empieza por lo que él hizo a los veinte años, cuando le expulsaron de una final y perdió un título. «Aquello me costó una temporada de insomnio —dice—. Y entonces entendí que el fútbol es sobre todo cabeza».",
    [
      o("a", "Escuchar sin interrumpir y dar las gracias", "Aprender", { rel_entrenador: 6, moral: 3, reputacion: 2, flags: { leccion_roja: true } }, "Sales del despacho con una carpeta con dos ejercicios de autocontrol y una frase en la cabeza: «No dejes que otro decida cuándo te enfadas». La usarás muchas veces, en muchos partidos."),
      o("b", "Aprovechar para contarle cómo te sentiste", "Abrirte", { rel_entrenador: 5, moral: 5, flags: { mister_confidente: true } }, "Le cuentas que te sentías muy solo, y que llevas semanas sin dormir bien. El míster guarda silencio, asiente, y escribe un número de teléfono en una nota: «Es de un psicólogo del club. Úsalo»."),
    ]),
  S("jv-entrenador-infancia", "juventud", { minAge: 18, maxAge: 26, clubTurns: [2, 200], notFlags: ["entrenador_infancia"] }, "vida",
    "Tu entrenador de la infancia viene a verte entrenar",
    "Está en la grada, con el abrigo de siempre, el pelo más blanco y la misma libreta en el bolsillo. Cuando acaba el entrenamiento, te hace una señal desde la valla. «No vengo a darte consejos —dice—. Vengo a comprobar que haces lo que te enseñé». Sonríe. «Por cierto, te pitan fuera de juego más de lo que deberían».",
    [
      o("a", "Invitarle a comer y repasar la infancia", "Un homenaje privado", { moral: 7, reputacion: 3, flags: { entrenador_infancia: "comida" } }, "Le llevas a un restaurante pequeño, de los que huelen a fritura. Os pasáis tres horas contando historias de los partidos de barro. El camarero, que os conoce, os pone postre gratis. «Por los viejos tiempos», dice."),
      o("b", "Presentarlo al míster del club", "Hacerlo valer", { rel_entrenador: 2, reputacion: 3, moral: 5, flags: { entrenador_infancia: "presentado" } }, "Los dos entrenadores se encierran en un despacho una hora. Sales y te encuentras con un abrazo de cada uno. «El chaval es bueno», dice el viejo. «Tiene a quien parecerse», contesta el míster."),
      o("c", "Darle las gracias pero explicar que hoy tienes prisa", "Con la agenda llena", { moral: -1, reputacion: -1, flags: { entrenador_infancia: "prisa" } }, "Quedas en llamarle. Pasan seis meses. Una tarde, ves un mensaje de su hija: «Papá está regular. Pregunta por ti». Te quedas mirando la pantalla. Marcas su número."),
    ]),
  S("jv-conducir", "juventud", { minAge: 17, maxAge: 21, clubTurns: [1, 40], notFlags: ["jv_conducir"] }, "vida",
    "Aprobar el carnet de conducir a la tercera",
    "El examinador ya te conoce por el nombre. En la primera vuelta, te comiste un cono; en la segunda, dejaste el coche en un sitio que no era un sitio. Hoy, a la tercera, llevas una camiseta de la suerte, un rosario que te dio tu abuela y un bocadillo de chorizo en el bolsillo. El examinador respira hondo y dice: «Arranque, por favor».",
    [
      r("a", "Concentrarte y hacerlo bien, sin florituras", "Con calma", 0.6, "Aprobado con un solo fallo: pisaste una línea continua. «Casi perfecto», dice el examinador, que parece más aliviado que tú. Te dan el carnet y el bocadillo de chorizo se queda en el bolsillo para celebrarlo.", { moral: 6, rel_vestuario: 2, flags: { jv_conducir: "aprobado" } }, "Suspendes por un error de aparcamiento, el cuarto de la serie. El examinador te mira, te da un pañuelo y dice: «Mejor quedarse en el campo». Se lo cuentas al vestuario y se parten de risa durante tres semanas.", { moral: -3, rel_vestuario: 3, flags: { jv_conducir: "suspendido" } }, "moral"),
      o("b", "Hablar mucho con el examinador para ablandarlo", "Ser simpático", { moral: 1, rel_vestuario: 2, flags: { jv_conducir: "labia" } }, "Le cuentas la historia de tu vida durante veinte minutos. El examinador te escucha con la cara de quien ya ha oído cosas peores. Al final dice: «Aprobado. Por favor, no me hable más»."),
    ]),
  S("jv-agente-falso", "juventud", { minAge: 16, maxAge: 19, clubTurns: [1, 30], notFlags: ["agente_falso"] }, "representante",
    "Un «agente» te promete un fichaje millonario",
    "Aparece a la salida de un partido, con un traje brillante, un maletín y una sonrisa muy ancha. «Tengo un club de Primera interesado en ti. Pero tengo que adelantarlo todo yo. Solo necesito que me des un adelanto de tres mil euros y me firmes aquí». Tu padre, a tu lado, ha dejado de sonreír. Tu madre, desde el coche, toca el claxon tres veces.",
    [
      o("a", "Pedir su número y consultarlo con tu club", "Con cabeza", { rel_entrenador: 2, reputacion: 2, moral: 2, flags: { agente_falso: "descubierto" } }, "El club investiga y descubre que el traje brillante es de alquiler y el maletín está vacío. «Se llama Manolo y lo hemos visto con otros chavales», te dicen. Te lo agradecen con una camiseta firmada."),
      o("b", "Rechazar con firmeza y pedir que se marche", "Plantar cara", { reputacion: 3, rel_vestuario: 1, moral: 3, flags: { agente_falso: "plantado" } }, "Tu padre da un paso adelante, con los brazos cruzados. El falso agente retrocede, sonríe nervioso, y desaparece entre la gente. Esa noche, tu padre dice: «A veces, el mejor consejo es no escuchar»."),
      o("c", "Dudar un segundo, dejarte llevar y casi firmar", "Caer en la tentación", { patrimonio: -300, moral: -3, reputacion: -1, flags: { agente_falso: "casi" } }, "Llegas a coger el bolígrafo. Un compañero, que pasa por casualidad, grita: «¡Es el del chándal!». El falso agente huye con los tres mil euros que le habías adelantado… de los tuyos, que son trescientos. Aprendes más rápido que nunca."),
    ]),
  S("jv-pelo", "juventud", { minAge: 16, maxAge: 23, clubTurns: [1, 80], notFlags: ["jv_pelo"] }, "vestuario",
    "El míster te manda cortarte el pelo",
    "Te lo ha dicho delante de todos, con esa voz suya que no admite discusión: «Esto es un club, no una peluquería de moda». Lo que él llama «una melena» es tu peinado de toda la vida, el que se hizo viral tras un gol. El vestuario se ha quedado callado, esperando tu reacción. Alguien tose para disimular una risa.",
    [
      o("a", "Cortártelo esa misma tarde, sin protestar", "Obedecer", { rel_entrenador: 4, reputacion: 2, moral: -2, flags: { jv_pelo: "corto" } }, "Vas a la peluquería con la cabeza gacha. Sales con un corte de recluta. En el vestuario, nadie dice nada. Al día siguiente, el míster te mira, asiente y comenta: «Te hace más mayor». No sabes si es un elogio."),
      o("b", "Negociar: «Me lo recojo y no se verá»", "Buscar una salida", { rel_entrenador: 1, moral: 1, flags: { jv_pelo: "recogido" } }, "Te haces una coleta con gomina. El míster te mira con una ceja levantada, pero no dice nada. A la semana siguiente, tres compañeros llevan coleta. Una moda nace en tu vestuario."),
      o("c", "Plantarte y defender tu estilo", "Rebelarte", { fama: 3, rel_aficion: 3, rel_entrenador: -4, moral: 3, flags: { jv_pelo: "rebelde" } }, "«Mi pelo no juega, pero me hace jugar mejor», dices. El vestuario estalla. El míster te mira durante un minuto entero. Luego dice: «Dos semanas sin sorpresas». Y te multa con diez euros, que pagas con una sonrisa."),
    ]),
];
