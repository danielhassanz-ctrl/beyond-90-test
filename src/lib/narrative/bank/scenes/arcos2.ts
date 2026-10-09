/**
 * Dos historias largas que se cuentan a lo largo de varias temporadas, con ramas según cómo te portes:
 *   A) El chaval que viene a por tu puesto (un canterano que crece a tu sombra, y qué haces con él).
 *   B) El periodista que no te suelta (una pieza dura, un enemigo, una oportunidad de reconciliación).
 * Lo que decides en cada capítulo cambia el siguiente y el desenlace; algunos desenlaces dejan hilos y estados.
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const EQ: BankWhen = { minAge: 20, roles: ["titular", "rotacion"], clubTurns: [4, 400] };

export const ARCOS2: BankScene[] = [
  // ───────────── A) El chaval ─────────────
  S("ar-chaval-1", "arco_chaval", { ...EQ, notFlags: ["ar_chaval"], clubLevels: ["grande", "europeo"], minAge: 22 }, "vestuario",
    "Un canterano de diecisiete años entrena con el primer equipo",
    "Aparece un martes, con el pelo mojado, una mochila más grande que él y la mirada de quien no ha dormido de puro nervio. Es un chaval de la cantera del que todos hablan bajito: juega en tu puesto, con una zurda que ya no se enseña, y el míster lo mira con una atención que a ti te resulta familiar. En el vestuario, el capitán se te acerca: «Ese viene a por ti, ¿lo sabes?».",
    [
      o("a", "Tomarlo bajo tu ala: enseñarle lo que sabes", "Ser su mentor", { rel_vestuario: 3, reputacion: 2, flags: { ar_chaval: "mentor", ar_chaval_amigo: true, estado_mentor: "@WEEK+3" } }, "Le haces un sitio en el rondo, le explicas dónde mirar, le prestas unas botas que le quedan grandes. El chaval te mira con una gratitud que casi duele. «Gracias por no tratarme como un estorbo», te dice. Te das cuenta de que lo has dicho en serio cuando le contestas: «No lo eres. Aún.»", { thread: th("favor", "el chaval de la cantera", "Le enseñaste cuando nadie más quería hacerlo.") }),
      o("b", "Tratarlo con frialdad: que se gane su sitio solo", "Distancia", { rel_vestuario: 0, flags: { ar_chaval: "frio" } }, "No lo ayudas ni lo estorbas. En el rondo le pasas el balón lo justo. El chaval aprende rápido a no pedirte nada, y esa es, a su manera, una lección. A los pocos días, ya habla con otros compañeros y a ti te saluda con respeto, nada más."),
      o("c", "Ponerlo a prueba a base de entradas duras en los entrenamientos", "Probarlo", { rel_vestuario: -2, rel_entrenador: -1, flags: { ar_chaval: "duro" } }, "Le haces la entrada más dura de la semana y esperas a ver qué hace. Se levanta, se sacude y vuelve a pedir el balón. Algún compañero murmura que te has pasado; otro sonríe con la admiración de quien reconoce a un competidor de los de verdad."),
    ]),
  S("ar-chaval-2a", "arco_chaval", { ...EQ, after: [after("ar-chaval-1", "a", 2, 8)], notFlags: ["ar_chaval_2"] }, "partido",
    "El chaval debuta y marca, y te dedica el gol",
    "El míster lo mete en el minuto 70, con el partido encarrilado. A los diez minutos, un pase tuyo, un control orientado y un derechazo seco que se mete por la escuadra. El chaval corre hacia ti, no hacia la grada, y te abraza con una fuerza que no sabe medir. «¡Esto es tuyo!», grita. Las cámaras lo captan: «El maestro y el alumno» será el titular de mañana.",
    [
      o("a", "Disfrutarlo con él y quitarte importancia", "Compartirlo", { moral: 5, rel_vestuario: 3, fama: 2, flags: { ar_chaval_2: true, estado_racha: "@WEEK+2" } }, "Le revuelves el pelo y dices a las cámaras: «Hoy no hay maestro. Hay un chaval que ha hecho un golazo». El vestuario te lo agradece con una ovación de cariño y el míster, desde la banda, te mira con un orgullo que no sabe esconder."),
      o("b", "Aprovechar para ganar protagonismo mediático tú también", "Subirte a la ola", { fama: 4, rel_vestuario: -2, flags: { ar_chaval_2: true } }, "Das tres entrevistas en tres horas y todas empiezan con «yo le he enseñado». El chaval lo ve en la tele y no dice nada. En el siguiente entrenamiento, hay algo distinto: una cortesía fría en la que antes había complicidad."),
    ]),
  S("ar-chaval-2b", "arco_chaval", { ...EQ, after: [after("ar-chaval-1", "b", 2, 8)], notFlags: ["ar_chaval_2"] }, "partido",
    "El chaval marca en su debut y la prensa te compara con él",
    "El míster lo mete en el minuto 70. A los diez minutos, un derechazo seco que se mete por la escuadra y una grada que se levanta. La prensa se vuelve loca: «El heredero». Alguien del periódico local pone dos fotos juntas: la tuya a su edad y la suya hoy. El titular, con la sutileza de un martillo: «¿Fin de ciclo?». Un compañero te mira de reojo.",
    [
      o("a", "Felicitarlo públicamente y restarle presión", "Elegante", { reputacion: 3, rel_vestuario: 2, flags: { ar_chaval_2: true } }, "Subes un mensaje sencillo: «Orgullo de club. Disfruta, chaval». El vestuario lo aprecia. El chaval te escribe un privado de agradecimiento que contiene una sola frase: «No me lo esperaba»."),
      o("b", "Responder en el campo: marcar tú también el siguiente partido", "Con hechos", { forma: 2, moral: 2, flags: { ar_chaval_2: true, estado_racha: "@WEEK+2" } }, "Esa semana entrenas como si te fuera la vida en ello. El sábado marcas, sin celebrar, mirando a la grada. La prensa titula: «Aún queda cuerda». El míster no dice nada, pero aprieta los labios en un gesto de aprobación."),
    ]),
  S("ar-chaval-2c", "arco_chaval", { ...EQ, after: [after("ar-chaval-1", "c", 2, 8)], notFlags: ["ar_chaval_2"] }, "vestuario",
    "El chaval te planta cara en el vestuario",
    "Tras otro entrenamiento en que le has hecho una entrada de las que se recuerdan, el chaval se planta delante de ti con los puños apretados y una voz que no le tiembla: «Si quieres que me vaya, dímelo a la cara. Pero no me pegues más». Todo el vestuario se queda en silencio. Quien más tiene que perder en esta conversación eres tú.",
    [
      o("a", "Pedirle perdón y reconocerle el mérito delante de todos", "Rectificar", { rel_vestuario: 4, reputacion: 3, flags: { ar_chaval_2: true, ar_chaval_amigo: true } }, "«Tienes razón. Te estaba probando y me he pasado. Eres bueno, chaval». El vestuario suelta el aire. Él asiente con la cara roja y las manos sueltas. A partir de ese día, te mira con una mezcla de respeto y de «no me vuelvas a tocar»."),
      o("b", "Mantenerte duro: «El campo no es un colegio»", "Sin ceder", { rel_vestuario: -3, rel_entrenador: -1, flags: { ar_chaval_2: true, estado_mal_ambiente: "@WEEK+3" } }, "Le dices que el que no sepa aguantar, que no se siente en esa mesa. Algunos te dan la razón con un gruñido; otros miran al suelo. El chaval, con los ojos brillantes de rabia, sale del vestuario sin responder. Es un enemigo menos y un rival más."),
    ]),
  S("ar-chaval-3", "arco_chaval", { ...EQ, flags: ["ar_chaval", "ar_chaval_2"], after: [after("ar-chaval-1", undefined, 8, 24)], notFlags: ["ar_chaval_3"] }, "entrenamiento",
    "El míster empieza a alternarte con el chaval",
    "Un sábado miras el once y no estás. Después, un martes, tampoco. El míster te lo explica con las palabras más correctas del mundo: «Es una rotación. Los dos jugáis. Lo que pasa es que él está en un momento de forma increíble». Te lo creerías si no vieras sus ojos al hablar. En el banquillo, el chaval te saluda con una timidez que ya no sabes si es sincera.",
    [
      o("a", "Aceptarlo y seguir trabajando: ya te tocará", "Paciencia", { rel_entrenador: 3, moral: -2, flags: { ar_chaval_3: true, coach_bench: "1" } }, "Haces lo que tienes que hacer: entrenar, apoyar, esperar. El míster lo valora con un gesto breve. Un domingo, el chaval falla un pase y tú, desde el banquillo, le gritas ánimo. Es un detalle que no se olvida."),
      o("b", "Pedirle al míster que te diga la verdad: ¿cuenta contigo o no?", "Ir de frente", { rel_entrenador: 1, moral: 1, flags: { ar_chaval_3: true, estado_confianza: "@WEEK+3" } }, "El míster se ríe con tristeza: «Qué buenos sois cuando preguntáis eso». Te dice que cuenta contigo y que tendrás tus minutos. La charla, dura y limpia, te devuelve algo que no sabías que habías perdido."),
      o("c", "Hacerle la vida imposible al chaval en los entrenos", "Guerra fría", { rel_entrenador: -4, rel_vestuario: -3, flags: { ar_chaval_3: true, estado_mal_ambiente: "@WEEK+4", estado_castigo: "@WEEK+2" } }, "Cada balón dividido es una guerra. El míster los ve y no dice nada, pero cuando acaba la sesión, te pide un minuto: «Tienes talento para ganarle en el campo. No necesitas hacerlo en los pasillos»."),
    ]),
  S("ar-chaval-4", "arco_chaval", { ...EQ, flags: ["ar_chaval_3"], after: [after("ar-chaval-3", undefined, 5, 20)], notFlags: ["ar_chaval_4"], minAge: 22 }, "representante",
    "El chaval quiere irse a un grande y te pide consejo",
    "Te lo dice en el aparcamiento, después del entrenamiento, con las llaves del coche en la mano. Un club enorme lo quiere. Su representante le dice que sí. Su madre, que no. Él, dudando. «No sé si es el momento. Tú has estado en esta situación. ¿Qué harías?». Está mirándote como se mira a alguien que tiene una respuesta que no existe.",
    [
      o("a", "Decirle la verdad: que se quede un año más y madure", "Con cabeza", { moral: 3, reputacion: 3, flags: { ar_chaval_4: true, ar_chaval_amigo: true } }, "Le cuentas lo que tú habrías querido que te dijeran. Que nadie se hace grande de golpe, que un año más aquí vale diez allí, que el sitio al que va no se va a mover. El chaval te escucha con atención y te da las gracias con un abrazo corto de aparcamiento."),
      o("b", "Animarlo a irse: la vida es corta y hay que aprovechar las oportunidades", "Que vuele", { moral: 2, rel_entrenador: -1, flags: { ar_chaval_4: true, ar_chaval_se_va: true } }, "Lo apoyas con entusiasmo. A las dos semanas, el chaval ficha por el gran club. Te manda un mensaje desde el aeropuerto con una foto y una frase: «Gracias por creer en mí». Sonríes, y por dentro piensas que quizá te has quedado sin un rival, y sin un amigo."),
      o("c", "Decirle que haga lo que quiera: no es asunto tuyo", "Quitarte de en medio", { moral: -1, flags: { ar_chaval_4: true } }, "Te encoges de hombros. «No me preguntes a mí». Él asiente despacio, con una decepción que intenta disimular. Esa noche, en casa, piensas que aquel chaval te pidió una mano y tú le diste la espalda, y la idea te pesa más de lo que esperabas."),
    ]),
  S("ar-chaval-5a", "arco_chaval", { ...EQ, flags: ["ar_chaval_amigo"], after: [after("ar-chaval-4", undefined, 12, 60)], notFlags: ["ar_chaval_5"], minAge: 24 }, "especial",
    "El chaval ya es una estrella y te dedica su Balón de Plata",
    "Años después, el chaval es otro. Hombros más anchos, una mirada que ya no baja, un contrato que haría llorar a su abuelo. Esta noche, en una gala, sube a recoger un premio y, antes de las gracias de rigor, mira a la sala y dice en voz alta: «A uno de aquí, que me hizo un hueco en el rondo cuando nadie me lo hacía». Y te nombra a ti. Se te nubla la vista.",
    [
      o("a", "Levantarte y aplaudirle de pie", "Con el corazón", { moral: 8, fama: 3, reputacion: 4, flags: { ar_chaval_5: true } }, "Te pones en pie y aplaudes con las manos y con el pecho. Él te busca con la mirada y te dedica un gesto de cabeza. Te acuerdas de aquel martes con el pelo mojado y la mochila enorme y te das cuenta de que hay cosas que se hacen sin saber que valen una vida."),
      o("b", "Hacerte el humilde y esconderte detrás de la copa", "Con humor", { moral: 6, flags: { ar_chaval_5: true } }, "Sonríes, haces un gesto de «¿yo?» y finges buscar a otra persona. La gala se ríe y él, en el escenario, también. Más tarde, mientras cenáis, te dice en voz baja: «Lo decía de verdad, ¿eh?». Sí. Lo sabes."),
    ]),
  S("ar-chaval-5b", "arco_chaval", { ...EQ, after: [after("ar-chaval-4", undefined, 12, 60)], notFlags: ["ar_chaval_amigo", "ar_chaval_5"], minAge: 24 }, "especial",
    "El chaval te pasa por encima: ya es el mejor del equipo",
    "Lo ves venir desde hace meses. Hoy, tras el partido, el míster lo señala en rueda de prensa como «el mejor jugador del equipo». El chaval, que ya no es chaval, te mira con una mezcla de respeto y de inevitabilidad. «Algún día te tocaba a ti ser mi referente», dice con una sonrisa que no sabes si es cariño o es ironía. Ahora el que mira de frente eres tú.",
    [
      o("a", "Asumirlo con deportividad y seguir peleando", "Como un profesional", { reputacion: 3, moral: 1, forma: 1, flags: { ar_chaval_5: true } }, "Le tiendes la mano y le dices: «Enhorabuena. Pero ojo, que aún te queda trabajo». Os reís los dos. Esa tarde, entrenas con un hambre que no sentías desde hace años."),
      o("b", "Pedir salir a un club donde vuelvas a ser el protagonista", "Buscar tu sitio", { moral: 1, rel_entrenador: -1, flags: { ar_chaval_5: true, quiere_salir: true } }, "Se lo cuentas a tu representante con la voz serena de quien ya lo ha pensado. «Quiero ser el primero en algún sitio». Él sonríe: «Hay un par de clubes que te adoran»."),
    ]),

  // ───────────── B) El periodista ─────────────
  S("ar-periodista-1", "arco_periodista", { ...EQ, fama: [40, 100], notFlags: ["ar_per"], minAge: 20 }, "prensa",
    "Un periodista publica una pieza muy dura sobre ti",
    "Se llama Gonzalo, firma en un diario con tirada y escribe con la crueldad de quien sabe lo que duele. La pieza sale el domingo: «El talento que no llegó», con una colección de datos selectivos y una frase que te hiere de verdad: «Prometía más». Tu representante la ha leído y lo resume con una mueca: «Es una pieza hecha para hacer ruido».",
    [
      o("a", "Ignorarla y centrarte en jugar", "Pasar", { moral: -2, forma: 1, flags: { ar_per: "ignora" } }, "No contestas a nada. Entrenas más, juegas con rabia y marcas en el siguiente partido. El periodista, en su siguiente pieza, no menciona el gol. Es su manera de cobrar."),
      o("b", "Responder en redes con datos que desmientan la pieza", "Dar la cara", { fama: 3, reputacion: 2, moral: -1, flags: { ar_per: "responde", estado_escandalo: "@WEEK+2" } }, "Subes un hilo breve con cuatro datos, sin insultos. Se hace viral. El periodista responde con otro artículo. Durante diez días, vuestra discusión llena las tertulias."),
      o("c", "Escribirle un mensaje privado para quedar a hablar", "Cara a cara", { moral: 1, reputacion: 1, flags: { ar_per: "habla" } }, "Le escribes sin rencor. Tarda tres días en contestar. «Acepto. Una cerveza, sin grabadora». Es un principio."),
    ]),
  S("ar-periodista-2", "arco_periodista", { ...EQ, flags: ["ar_per"], after: [after("ar-periodista-1", undefined, 3, 12)], notFlags: ["ar_per_2"] }, "prensa",
    "Gonzalo, el periodista, te espera a la salida del entrenamiento",
    "Está en la acera, con una libreta y una sonrisa de gato que se acaba de comer al canario. Te hace una pregunta que no te esperas: «¿Quieres que escriba la verdad sobre tu carrera?». No sabes si es una amenaza o un ofrecimiento. Detrás de él, otros dos compañeros periodistas miran la escena con cara de saber que algo va a pasar.",
    [
      o("a", "Concederle una entrevista larga, sin filtros", "Abrirte", { fama: 4, reputacion: 3, rel_entrenador: -1, flags: { ar_per_2: "abre" } }, "Le dedicas una tarde entera, en una cafetería tranquila. Hablas de tus miedos, de tus fallos, de lo que nunca cuentas. Cuando se publica, dos meses después, es lo mejor que se ha escrito sobre ti. Gonzalo, al enviarte el enlace, escribe una sola frase: «Perdona la primera pieza»."),
      o("b", "Decirle que no tienes nada que contarle", "Cerrado", { moral: 1, flags: { ar_per_2: "cierra" } }, "Se encoge de hombros con teatralidad y se marcha silbando. A las dos semanas, aparece otra pieza donde se refiere a ti como «el jugador que no habla». Cuesta menos de lo que parecía."),
      o("c", "Enseñarle los números reales de tus partidos y tu rendimiento", "Datos", { reputacion: 4, flags: { ar_per_2: "datos" } }, "Le pasas el informe del club con todas tus estadísticas, partido a partido. Gonzalo lo estudia con atención, hace tres preguntas muy buenas y, al cabo de una semana, publica una rectificación elegante. Es la primera vez que ves a un periodista pedir perdón con datos."),
    ]),
  S("ar-periodista-3", "arco_periodista", { ...EQ, flags: ["ar_per_2"], after: [after("ar-periodista-2", undefined, 6, 24)], notFlags: ["ar_per_3"], fama: [40, 100] }, "prensa",
    "Gonzalo investiga a tu representante",
    "Una mañana, tu representante te llama con una voz ahogada: «Gonzalo ha estado preguntando por mis cuentas, mis comisiones, mis clientes». Es el mismo periodista. La noticia no es sobre ti, pero si publica algo, te salpicará. «No hay nada que esconder», añade tu representante con una seguridad que a ti no te convence del todo.",
    [
      o("a", "Defender a tu representante públicamente", "Lealtad", { rel_representante: 5, reputacion: 1, fama: 2, flags: { ar_per_3: true } }, "Sales a defenderlo en una rueda de prensa. El periodista lo ve y se limita a decir: «Lo anotaré». Tu representante te lo agradecerá con una lealtad que dura años."),
      o("b", "Pedirle a tu representante que se lo cuente todo a ti primero", "Transparencia", { rel_representante: 1, reputacion: 3, flags: { ar_per_3: true } }, "Se sienta frente a ti con una carpeta y te cuenta todo, con la cara de quien vive un examen. Nada ilegal; algún detalle incómodo. Te lo tomas con calma. «No me escondas nada más». «Prometido»."),
      o("c", "Mantenerte al margen: es su problema", "Distancia", { rel_representante: -3, flags: { ar_per_3: true, estado_preocupado: "@WEEK+2" } }, "Te desmarcas con una frase ensayada. Tu representante lo recibe con un silencio digno. A partir de entonces, vuestra relación tiene un termómetro invisible: te mide cada llamada."),
    ]),
  S("ar-periodista-4", "arco_periodista", { ...EQ, flags: ["ar_per_3"], after: [after("ar-periodista-3", undefined, 8, 30)], notFlags: ["ar_per_4"], minAge: 22 }, "especial",
    "Gonzalo publica un libro sobre tu generación y quiere un capítulo contigo",
    "Hace tres años te criticó con crudeza. Hoy te propone un capítulo entero en un libro sobre tu generación de futbolistas: «Quiero que seas el centro». Te manda un adelanto, con un pasaje que te hace parar de leer: habla de tus primeros años con una ternura que no esperabas. «Me equivoqué contigo», termina. «Dime si quieres que lo cuente».",
    [
      o("a", "Aceptar y colaborar con él en el libro", "Reconciliarte", { fama: 4, reputacion: 5, moral: 5, flags: { ar_per_4: true } }, "Pasas dos tardes con él, repasando la vida de un futbolista que ya no es el que era. El libro sale en Navidad y es un éxito. En la presentación, Gonzalo te señala entre el público y dice: «Hay personas que merecen que se les pida perdón en público»."),
      o("b", "Rechazarlo con educación", "Dejar el pasado", { moral: 1, flags: { ar_per_4: true } }, "Le das las gracias y le dices que prefieres dejarlo así. Él lo entiende y no insiste. El libro sale sin tu capítulo, y tú te quedas con la sensación rara de haber cerrado una puerta con cortesía."),
      o("c", "Pedirle que te enseñe el capítulo antes de decidir", "Condición", { reputacion: 2, flags: { ar_per_4: true } }, "Gonzalo te manda el texto con una nota: «No tocaré ni una coma sin tu permiso». Lo lees una noche entera. A la mañana siguiente, le escribes un solo mensaje: «Adelante»."),
    ]),
];
