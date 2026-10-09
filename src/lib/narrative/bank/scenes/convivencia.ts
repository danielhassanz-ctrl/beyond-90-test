/**
 * Convivencia: lo que pasa con tus compañeros, con sus parejas, con tus amigos de siempre y con tu entorno cuando la
 * fama cambia las reglas. Peleas, secretos, bromas que se pasan, chats que se filtran, dinero y amistad. Todo con
 * consecuencias (vestuario, míster, estados, hilos abiertos que vuelven) y encadenado.
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const EQUIPO: BankWhen = { minAge: 17, roles: ["titular", "rotacion", "suplente"], clubTurns: [3, 400] };
const SANO = ["estado_castigo", "estado_mal_ambiente"];

export const CONVIVENCIA: BankScene[] = [
  // ───────────── Pelea en el vestuario ─────────────
  S("cv-pelea", "convivencia", { ...EQUIPO, notFlags: [...SANO, "cv_pelea"] }, "vestuario",
    "Te pegas con un compañero después del partido",
    "Perdéis un partido que se podía ganar. En el túnel, un compañero te suelta, delante de todos, que «vas de estrella y no corres». Respondes con algo peor. Se acercan, se empujan, vuelan dos puñetazos y el utillero, con una botella de agua, os separa antes de que llegue más gente. Hay un silencio de iglesia. El míster está en la puerta del vestuario con la cara que se pone cuando algo se ha roto de verdad.",
    [
      o("a", "Pedirle perdón delante de todos y darle la mano", "Rectificar", { rel_vestuario: 3, rel_entrenador: -2, multa: 1, moral: -2, flags: { cv_pelea: true, coach_bench: "1" } }, "Es lo más difícil que has hecho en un vestuario, y sale mejor de lo que esperabas. Él duda, te mira, y al final te estrecha la mano con un gruñido. El míster, sin decir nada, os pone en el mismo rondo al día siguiente. «Aquí se arreglan las cosas jugando», dice."),
      o("b", "No ceder: «Me ha provocado él»", "Mantenerte", { rel_vestuario: -5, rel_entrenador: -5, multa: 2, flags: { cv_pelea: true, coach_bench: "2", estado_mal_ambiente: "@WEEK+4", estado_castigo: "@WEEK+3" } }, "El vestuario se parte en dos grupos: quien te da la razón en voz baja y quien te evita en los pasillos. El club os multa a los dos y el míster os aparta del siguiente partido. Durante semanas, el ambiente es un cable pelado.", { thread: th("rencor", "tu compañero", "Os pegasteis y ninguno pidió perdón.") }),
      r("c", "Dejar que el capitán medie entre los dos", "Un mediador", 0.55,
        "El capitán os sienta, uno a cada lado de una mesa del comedor, y os impone una regla: nadie se levanta hasta que se pidan perdón de verdad. Tarda una hora. Salís del comedor riéndoos de lo ridículo que ha sido todo.", { rel_vestuario: 5, rel_entrenador: 1, moral: 1, flags: { cv_pelea: true } },
        "El capitán lo intenta, pero el otro no se deja convencer y la mediación acaba con tres personas enfadadas en vez de dos. El míster, que se entera, os cita a los tres.", { rel_vestuario: -3, rel_entrenador: -3, multa: 1, flags: { cv_pelea: true, estado_mal_ambiente: "@WEEK+3" } }, "reputacion"),
    ]),
  S("cv-reconcilia", "convivencia", { ...EQUIPO, after: [after("cv-pelea", "a", 3, 12)], notFlags: ["cv_reconcilia"] }, "vestuario",
    "El compañero con el que te peleaste te invita a cenar",
    "Llegó el mensaje un domingo por la noche, sin preámbulos: «Te invito a cenar. Sin cámaras ni vestuario». Es el compañero con el que te pegaste. Te lo piensas diez minutos. Hay mucho orgullo y un poco de miedo, pero hay también una sensación tonta de que, si no vas, será peor.",
    [
      o("a", "Ir con una botella de vino y las manos limpias", "Dar el paso", { rel_vestuario: 6, moral: 4, flags: { cv_reconcilia: true, estado_racha: "@WEEK+2" } }, "Cenáis en un restaurante pequeño, hablando de lo que os pasó. Él te confiesa que estaba pasando un mal momento en casa; tú que llevabas tres partidos sin tocar bola. Salís del local abrazados. A partir de esa noche, os pasáis el balón con los ojos cerrados."),
      o("b", "Responder que en el campo ya se verá", "Sin prisa", { rel_vestuario: 1, flags: { cv_reconcilia: true } }, "Contestas con una frase educada y distante. Él lo entiende y no insiste. En el siguiente entrenamiento os miráis, os saludáis con un gesto y seguís cada uno a lo suyo. No es amistad, pero es respeto."),
    ]),

  // ───────────── La novia de un compañero ─────────────
  S("cv-novia", "convivencia", { ...EQUIPO, fama: [20, 100], notFlags: [...SANO, "cv_novia", "estado_escandalo"], maxAge: 38 }, "vida",
    "La novia de un compañero se te insinúa",
    "En la cena de equipo, la novia de un compañero —simpatiquísima, risueña, siempre en medio de todas las conversaciones— se sienta a tu lado y, en un momento en que los demás se ríen de un chiste, te roza el brazo y te susurra algo al oído que no es del todo inocente. Sonríe como si nada. Su novio, a dos sillas, te está hablando de la selección.",
    [
      o("a", "Cortarlo en seco y alejarte del sitio", "Lealtad", { rel_vestuario: 2, moral: -1, flags: { cv_novia: "no" } }, "Te levantas con una excusa del baño, y a la vuelta te cambias de silla. Ella se da cuenta y no vuelve a intentarlo. Esa noche, en casa, te preguntas si se lo debes contar a tu compañero. Decides que no hace falta: ya está zanjado."),
      o("b", "Contárselo a tu compañero al día siguiente", "Ser honesto", { rel_vestuario: -3, moral: -2, flags: { cv_novia: "contado", estado_mal_ambiente: "@WEEK+3" } }, "Se lo cuentas en un aparte, con cuidado y con mucha vergüenza. Él se queda callado, se pasa la mano por la cara y te dice: «Ya lo sospechaba». Os dais un abrazo que es mitad agradecimiento y mitad pena. Durante unas semanas, el ambiente de la pareja y del equipo se resiente.", { thread: th("favor", "tu compañero", "Le contaste lo que no quería saber.") }),
      o("c", "Callarte y dejar que pase", "No decir nada", { moral: -1, flags: { cv_novia: "calla" } }, "No dices nada, a nadie. Ella tampoco lo comenta. Pero sabes que algo se ha quedado ahí, como una piedra en una bota. Cada vez que te cruzas con su novio, sientes un ligero cosquilleo de culpa que no tiene sentido.", { thread: th("secreto", "tu compañero", "Su novia se te insinuó y no se lo dijiste.") }),
      o("d", "Seguirle el juego: es una cena y no pasa nada", "Dejarte llevar", { moral: 3, rel_vestuario: -4, flags: { cv_novia: "cede" } }, "Hay una complicidad, unos mensajes, una tarde que se alarga más de lo prudente. No pasa nada que no pueda explicarse, pero tampoco nada que quieras explicar. Esa semana, en el entrenamiento, evitas la mirada de tu compañero sin saber muy bien por qué.", { thread: th("secreto", "tu compañero", "Algo pasó con su novia y él no lo sabe.") }),
    ]),
  S("cv-novia-descubierto", "convivencia", { ...EQUIPO, flags: ["cv_novia"], after: [after("cv-novia", undefined, 3, 14)], notFlags: ["cv_novia_fin"] }, "vestuario",
    "Tu compañero se entera de lo de su novia",
    "Alguien que estaba en aquella cena se va de la lengua. Cuando llegas al vestuario, el silencio es inconfundible. Tu compañero está sentado en el banco, con la mirada clavada en el suelo, y el resto del equipo finge muy mal que mira el móvil. El capitán se te acerca despacio. «Tienes que hablar con él. Ahora».",
    [
      r("a", "Sentarte a su lado y contarle todo tal cual pasó", "Decirle la verdad", 0.55,
        "Lo cuentas todo: lo que dijo ella, lo que hiciste tú, lo que callaste. Él escucha en silencio. «Te agradezco que me lo digas a la cara», murmura. No te perdona, pero tampoco te pega. Es un principio.", { rel_vestuario: 2, moral: -2, flags: { cv_novia_fin: true, estado_mal_ambiente: "@WEEK+3" } },
        "Lo cuentas todo, pero lo que oye es otra cosa: que lo sabías y no se lo dijiste. Se levanta, te mira con unos ojos que nunca le habías visto y se va. Durante semanas no te dirige la palabra, y el vestuario se divide.", { rel_vestuario: -7, rel_entrenador: -3, moral: -5, flags: { cv_novia_fin: true, estado_mal_ambiente: "@WEEK+6", estado_castigo: "@WEEK+3" } }, "reputacion"),
      o("b", "Negarlo todo: «Es un invento de alguien que me odia»", "Negar", { rel_vestuario: -4, moral: -3, flags: { cv_novia_fin: true, estado_mal_ambiente: "@WEEK+5" } }, "Te agarras a una versión que no cuela. Él te mira, no dice nada, y se levanta. Al día siguiente, un mensaje del capitán: «No vamos a volver a hablar de esto, pero no se te olvide cómo has quedado»."),
      o("c", "Pedirle al míster que hable con él", "Pedir ayuda", { rel_entrenador: -3, rel_vestuario: -3, flags: { cv_novia_fin: true, estado_mal_ambiente: "@WEEK+4" } }, "El míster lo recibe en el despacho y sale con cara de cansancio. «No es mi trabajo hacer de psicólogo, pero lo haré». La conversación sale razonablemente bien, pero tú quedas marcado como alguien que no da la cara."),
    ]),

  // ───────────── Dentro del vestuario ─────────────
  S("cv-capitan-bronca", "convivencia", { ...EQUIPO, roles: ["titular", "rotacion"], notFlags: [...SANO, "cv_capitan_bronca"], minAge: 17 }, "vestuario",
    "El capitán te echa la bronca delante de todos",
    "En el descanso, el capitán te agarra de la camiseta, te pega un empujón suave contra la pared y te suelta en voz alta, sin importarle quién lo oiga: «Llevas veinte minutos sin correr. ¡Si vas a jugar, juega!». El vestuario entero se queda mirando. Tú, con la cara colorada, ni siquiera tienes tiempo para decidir cómo reaccionar.",
    [
      o("a", "Asumirlo y pedirle perdón al grupo", "Humildad", { rel_vestuario: 4, moral: -1, forma: 2, flags: { cv_capitan_bronca: true } }, "«Tienes razón. Voy a por todo». Lo dices con una voz que sorprende hasta a ti. En la segunda parte corres como si te hubieran cambiado las piernas. Al acabar, el capitán te da un golpe en el pecho: «Eso es lo que quería»."),
      o("b", "Responderle con la misma energía: «No me hables así»", "Plantarte", { rel_vestuario: -4, rel_entrenador: -2, moral: -1, flags: { cv_capitan_bronca: true, estado_mal_ambiente: "@WEEK+3" } }, "Os miráis a un palmo de distancia. El míster interviene antes de que se complique. Pero las cosas han quedado dichas, y el capitán, que lleva diez años en ese vestuario, no olvida estas frases."),
      o("c", "Callarte, salir a jugar y demostrarlo con el balón", "Con hechos", { moral: 2, forma: 1, rel_vestuario: 2, flags: { cv_capitan_bronca: true } }, "No dices nada. Pero en la segunda parte vas a por cada balón con una rabia silenciosa. Marcas, o das una asistencia, o ganas un duelo imposible. El capitán, al final, no te dice una palabra. Solo te choca el puño."),
    ]),
  S("cv-novatada", "convivencia", { ...EQUIPO, notFlags: ["cv_novatada"], minAge: 19 }, "vestuario",
    "Una novatada se pasa de la raya con un canterano",
    "Es una tradición: el primer día con el primer equipo, el chaval canta delante de todos. Pero esta vez alguien ha ido más lejos: le han atado a una silla en el vestuario, le han llenado la mochila de agua y, cuando llegas, hay un grupo grabando con el móvil y un chaval de dieciocho años intentando no llorar. Un compañero te mira y levanta una ceja: «Es solo una broma».",
    [
      o("a", "Desatarlo tú mismo y pedirles que lo dejen", "Plantarte", { rel_vestuario: -2, reputacion: 4, moral: 2, flags: { cv_novatada: true } }, "Lo desatas sin una palabra. Alguien suelta un bufido; otro, un «qué serio». El chaval te mira con unos ojos que no olvidarás. Años después, cuando sea titular, te escribirá: «Aquel día fuiste el único»."),
      o("b", "Unirte a la broma, pero sin pasarte", "Seguir el juego", { rel_vestuario: 2, reputacion: -2, flags: { cv_novatada: true } }, "Te ríes, haces un par de bromas y esperas a que se acabe. El chaval aguanta como puede. No ha pasado nada que no pase en cualquier vestuario, pero esa noche te sientes un poco peor de lo que te gustaría."),
      o("c", "Avisar discretamente al capitán para que lo pare", "Pedir intervención", { rel_vestuario: 1, reputacion: 2, flags: { cv_novatada: true } }, "El capitán, que no estaba, llega con paso lento y mirada seria. Con una frase corta, la broma se acaba. «Aquí las cosas se hacen bien». El chaval te da las gracias con un gesto discreto."),
    ]),
  S("cv-filtracion", "convivencia", { ...EQUIPO, notFlags: [...SANO, "cv_filtracion"], fama: [25, 100] }, "prensa",
    "Alguien filtra a la prensa lo que se dijo en el vestuario",
    "Lees el titular en el móvil, en el autobús: «Bronca en el vestuario: el míster se encara con la plantilla». Contiene frases literales de una charla a puerta cerrada. Alguien ha hablado. El míster, cuando entra en el autobús, reparte miradas largas, y por un instante, se detiene un poco más en la tuya. Tú no has sido, pero nadie lo sabe.",
    [
      o("a", "Decirle al míster que no has sido tú y ofrecerte a ayudar a encontrar al culpable", "Colaborar", { rel_entrenador: 2, rel_vestuario: -2, flags: { cv_filtracion: true } }, "El míster te escucha en silencio y asiente. «Te creo». Una semana después, un compañero con la cara de quien lleva dormidas tres noches se presenta en su despacho. No se te nota, pero respiras por primera vez."),
      o("b", "No decir nada: quien es culpable acabará cayendo", "Callar", { moral: -2, flags: { cv_filtracion: true, estado_mal_ambiente: "@WEEK+2" } }, "Pasan los días sin que nadie hable. El ambiente se llena de sospechas y de miradas de reojo. Cuando por fin se sabe quién fue, tu inocencia ya no le importa a nadie: la desconfianza ha dejado un olor en el aire."),
      o("c", "Quedar con el periodista y preguntarle quién le pasó la información", "Investigar", { reputacion: -3, rel_entrenador: -3, fama: 1, flags: { cv_filtracion: true, estado_escandalo: "@WEEK+2" } }, "El periodista, que no es tonto, no suelta prenda y, en cambio, escribe un artículo sobre tu «curiosidad». El club se entera del encuentro y se pregunta, ahora sí, quién habla con quién."),
    ]),
  S("cv-chat", "convivencia", { ...EQUIPO, notFlags: [...SANO, "cv_chat"], fama: [25, 100] }, "vestuario",
    "El chat del vestuario se filtra y sale un comentario tuyo",
    "Una captura del chat del vestuario circula por los grupos de aficionados. Entre mensajes de memes y quedadas, hay uno tuyo: un comentario sobre el míster, hecho a las dos de la mañana y con un gif de por medio, que en su contexto era una broma y fuera de él es una falta de respeto. El míster lo ha visto. No ha dicho nada. Eso es lo peor.",
    [
      o("a", "Pedirle perdón al míster en persona", "Cara a cara", { rel_entrenador: -1, moral: -2, flags: { cv_chat: true } }, "Llamas a su puerta con el comentario impreso en la mano. «Tienes razón en enfadarte. No me creo que lo pensara, pero lo escribí». El míster te mira, sonríe apenas y contesta: «A mí también me gustaba gastar bromas». Se acabó la conversación y la tensión."),
      o("b", "Negar que fuera en serio y quitarle importancia", "Defenderte", { rel_entrenador: -5, rel_vestuario: -1, multa: 1, flags: { cv_chat: true, estado_castigo: "@WEEK+2" } }, "Lo defiendes como una broma, y el míster, sin enfadarse, te responde: «Las bromas se hacen a la cara». Te multa y te pone en la lista de suplentes el siguiente partido. Mensaje recibido."),
      o("c", "Pedirle al capitán que lo hable con el míster", "Intermediario", { rel_entrenador: -1, rel_vestuario: 1, flags: { cv_chat: true } }, "El capitán, que es listo, convierte el asunto en una broma de vestuario y logra que el míster lo deje correr. Te debe una cerveza a ti; tú, un favor a él."),
    ]),
  S("cv-celos", "convivencia", { ...EQUIPO, fama: [50, 100], notFlags: [...SANO, "cv_celos"], clubTurns: [6, 400] }, "vestuario",
    "Un veterano se pica con tu fama",
    "Llevas semanas notando que el veterano del equipo, ese que era la cara del club antes de que llegaras, deja de pasarte el balón en los entrenamientos y comenta, casi sin querer, que «ahora los chavales ya llegan siendo famosos». Hoy, en el rondo, te ha hecho una entrada que no era de entrenamiento. Alguien se ha reído por lo bajo.",
    [
      o("a", "Invitarlo a comer y hablarlo con calma", "Hablar", { rel_vestuario: 4, moral: 2, flags: { cv_celos: true } }, "Lo invitas a comer en un restaurante tranquilo, sin móviles. «Me gusta cómo llevas esto, y quiero aprender de ti», le dices. No es del todo verdad ni del todo mentira. El veterano se ablanda, te cuenta una anécdota de su debut y cambia el tono. A partir de ahí, el balón vuelve a llegar."),
      o("b", "Ignorarlo y seguir a lo tuyo", "Pasar", { rel_vestuario: -2, moral: -1, flags: { cv_celos: true, estado_mal_ambiente: "@WEEK+3" } }, "Haces como si no lo notaras. Pero el resto del vestuario sí lo nota, y empieza a repartir sus simpatías. Con los días, la tensión se instala, sin que nadie la nombre."),
      o("c", "Responderle en el campo con más agresividad", "Pelear", { rel_vestuario: -4, rel_entrenador: -2, forma: 1, flags: { cv_celos: true, estado_mal_ambiente: "@WEEK+4" } }, "Le devuelves la entrada. Ya no es entrenamiento: es una guerra fría con muslos de por medio. El míster los mira a los dos y manda parar el ejercicio: «A ver si os acordáis de que jugáis en el mismo equipo»."),
    ]),

  // ───────────── Amigos, familia y entorno ─────────────
  S("cv-prestamo", "convivencia", { minAge: 18, fama: [30, 100], patrimonio: [20000, 100000000], notFlags: ["cv_prestamo"], clubTurns: [2, 400] }, "vida",
    "Un amigo de toda la vida te pide dinero otra vez",
    "Es el mismo amigo de siempre, con la misma sonrisa y la misma mano en el hombro. Esta vez pide más: «Un pequeño préstamo, para un negocio que no puede fallar». Es la tercera vez este año. La primera te pareció un favor; la segunda, una molestia; la tercera, una pregunta que no sabes cómo contestar. Hay una cifra en la mesa y, detrás de la cifra, una amistad de veinte años.",
    [
      o("a", "Dárselo, sin hacer preguntas", "Generoso", { patrimonio: -6000, moral: 2, flags: { cv_prestamo: true } }, "Se lo transfieres esa tarde. Te da un abrazo larguísimo y un «te lo devuelvo, ya verás». Pasan tres meses y no lo ves. A los seis, te saluda por redes con un «cuánto tiempo». Aprendes qué cosas cuestan más de lo que parecen."),
      o("b", "Darle la mitad y hablarle claro", "Con límites", { patrimonio: -3000, moral: 1, reputacion: 1, flags: { cv_prestamo: true } }, "«Esto es lo que puedo. Y la próxima vez, me enseñas el plan». No se enfada, aunque la sonrisa le dura menos de lo habitual. Se lleva el dinero con una frase de gratitud medida. Desde entonces os veis menos, pero con más sinceridad."),
      o("c", "Decirle que no, con todo el cariño que puedas", "Negarte", { moral: -3, flags: { cv_prestamo: true, estado_preocupado: "@WEEK+2" } }, "Se lo dices mirándole a los ojos. Él asiente, se encoge de hombros y cambia de tema. Pero algo se ha enfriado: le notas la voz más lejos, y tu amistad de siempre, de repente, tiene un precio.", { thread: th("rencor", "tu amigo de toda la vida", "Le dijiste que no a un préstamo.") }),
    ]),
  S("cv-ex", "convivencia", { minAge: 18, fama: [30, 100], notFlags: ["cv_ex"], clubTurns: [2, 400] }, "vida",
    "Tu ex te escribe después de un golazo",
    "El gol se ha repetido veinte veces en todos los programas. A las once de la noche, tu móvil vibra con un mensaje de un nombre que no veías desde hacía un año: tu ex. «Enhorabuena. Te lo mereces». Y un segundo mensaje, tres minutos después: «A veces pienso en lo que habríamos podido ser». Es un clásico: llega cuando todo va bien.",
    [
      o("a", "Contestarle con educación y cerrar el tema", "Elegante", { moral: 1, reputacion: 1, flags: { cv_ex: true } }, "Le das las gracias, le deseas lo mejor y apagas el móvil. Duermes tranquilo. Lo bonito de las cosas pasadas es que ya no necesitan explicación."),
      o("b", "Quedar con ella a tomar un café para hablar", "Revisitar", { moral: 3, rel_aficion: -1, flags: { cv_ex: true, estado_escandalo: "@WEEK+2" } }, "Os veis en una cafetería tranquila. La conversación es mejor de lo que esperabas, y peor de lo que prometías. Alguien os fotografía a través del cristal. A la mañana siguiente, ya hay hipótesis."),
      o("c", "No contestar", "Silencio", { moral: -1, flags: { cv_ex: true } }, "Lees el mensaje cuatro veces y lo dejas en el móvil, sin responder. A los dos días, desaparece del chat. Tú, por si acaso, no borras la conversación."),
    ]),
  S("cv-seguidor", "convivencia", { minAge: 18, fama: [50, 100], notFlags: ["cv_seguidor"], clubTurns: [3, 400] }, "vida",
    "Un aficionado te espera todas las noches en la puerta de tu casa",
    "Al principio era un chaval con camiseta y ganas de selfie. Después, el mismo chaval en el mismo sitio, todas las noches, con la misma frase: «Solo quería saludar». Hoy ha llegado con un regalo envuelto y una nota de seis páginas. Te quedas mirando por la mirilla con el corazón en el pecho. No ha hecho nada malo, pero tampoco se va.",
    [
      o("a", "Hablar con él con amabilidad y poner un límite claro", "Con cariño y firmeza", { moral: 1, reputacion: 2, flags: { cv_seguidor: true } }, "Sales y le firmas la camiseta. Le agradeces la nota y le explicas que, en casa, necesitas privacidad. Se queda pálido, se disculpa mucho y no vuelve. Un tiempo después, te escribe una carta pidiendo perdón. La guardas."),
      o("b", "Avisar a seguridad del club y que lo gestione", "Profesional", { moral: 2, rel_entrenador: 1, flags: { cv_seguidor: true } }, "Seguridad habla con él, con tacto. El chaval, que no es peligroso, se asusta mucho y desaparece. Te quedas con una sensación incómoda: ni querías hacerle daño ni querías esto."),
      o("c", "Ignorarlo y esperar a que se canse", "Aguantar", { moral: -3, forma: -1, flags: { cv_seguidor: true, estado_preocupado: "@WEEK+3" } }, "Se cansa a los quince días, pero tú pasas ese tiempo con una mano en el picaporte y la cabeza al revés. Sales a la calle mirando a ambos lados. Es un precio de la fama que nadie te contó."),
    ]),
  S("cv-familiar-dinero", "convivencia", { minAge: 19, fama: [40, 100], patrimonio: [50000, 100000000], notFlags: ["cv_familiar"], clubTurns: [3, 400] }, "vida",
    "Un familiar lejano quiere que lo metas en un «negocio seguro»",
    "En la comida familiar de Navidad, un tío que solo veías en las bodas te acorrala junto al turrón: tiene un restaurante, un socio y un plan. «Con lo que ganas tú, esto es calderilla». Tu madre te mira de reojo desde la cocina; tu padre se ha puesto a lavar platos para no oír. Todos saben que no es un buen negocio. Nadie quiere ser quien lo diga.",
    [
      o("a", "Decirle que no, con una sonrisa y una excusa elegante", "Diplomacia", { moral: -1, flags: { cv_familiar: true } }, "Dices que tu representante gestiona todas las inversiones y que tú no tienes voz en eso. Se queda un poco mohíno, pero se lo traga. Tu madre, desde la cocina, te levanta el pulgar."),
      o("b", "Meter un poco de dinero por no discutir en Navidad", "Pagar la paz", { patrimonio: -8000, moral: 1, flags: { cv_familiar: true } }, "Le firmas un cheque para que se calle. El restaurante abre y cierra en cuatro meses, y tu tío te escribe en Reyes un mensaje lleno de agradecimiento hacia ti y de reproches hacia el mundo."),
      o("c", "Pedirle que te enseñe los números antes de decidir", "Racional", { moral: 2, reputacion: 2, flags: { cv_familiar: true } }, "Cuando te enseña un papel con garabatos y ninguna previsión, sonríes con la tranquilidad de quien ya sabía lo que ibas a ver. «Aprende a hacer un Excel, tío, y volvemos a hablar». Se ríe, y esa semana se apunta a un curso."),
    ]),
  S("cv-vecino", "convivencia", { minAge: 18, fama: [25, 100], notFlags: ["cv_vecino"], clubTurns: [3, 400] }, "vida",
    "Un vecino denuncia las fiestas en tu piso",
    "No son fiestas, o no lo eran: son una cena con tres amigos que se alargó hasta las dos. Pero tu vecino de abajo, un señor jubilado con una libreta y una paciencia de ajedrecista, ha apuntado cada una de las veces y ahora presenta una queja formal con tu nombre y tu club. El presidente de tu comunidad te cita. Dos periodistas ya han preguntado.",
    [
      o("a", "Hablar con él en persona y pedirle perdón", "Cercano", { reputacion: 2, moral: 1, flags: { cv_vecino: true } }, "Bajas con una caja de bombones. El vecino te recibe con desconfianza y acaba enseñándote su colección de camisetas antiguas de tu club. Os hacéis amigos, de esas amistades raras de ascensor."),
      o("b", "Pagar un aislamiento acústico y dar el asunto por zanjado", "Dinero", { patrimonio: -3500, moral: 1, flags: { cv_vecino: true } }, "Pagas la obra sin discutir. El vecino, que quería más una disculpa que un ruido, sigue con su queja, pero ya sin fuerza. Todo se archiva con un correo tan educado que te da vergüenza."),
      o("c", "Ignorarlo: «Es mi casa»", "Plantarte", { rel_aficion: -2, fama: 2, flags: { cv_vecino: true, estado_escandalo: "@WEEK+2" } }, "Sale en prensa con un titular que no te gusta: «El futbolista que no deja dormir». La grada lo comenta, el club te pide por favor que lo arregles, y al final acabas bajando con los bombones, dos semanas tarde."),
    ]),
  S("cv-amigo-trabajo", "convivencia", { minAge: 19, fama: [35, 100], notFlags: ["cv_amigo_trabajo"], clubTurns: [3, 400] }, "vida",
    "Tu mejor amigo te pide trabajo",
    "Lo llevas pensando una semana: tu mejor amigo de la infancia ha perdido el empleo y no te lo ha pedido, pero se lo notas en cada conversación. Hoy lo ha dicho sin rodeos: «Si necesitas alguien de confianza, aquí estoy». Tienes cosas que hacer: conducir, organizar agenda, gestionar la casa. Pero también sabes que mezclar amistad y trabajo es una cosa que no sale gratis.",
    [
      o("a", "Contratarlo con un contrato en regla", "Formal", { patrimonio: -1500, moral: 3, flags: { cv_amigo_trabajo: true } }, "Firmáis un contrato claro, con horarios, sueldo y límites. Funciona mejor de lo que pensabas. Al principio te da vergüenza darle órdenes; a los dos meses, es el único que te dice «hoy no has dormido bien»."),
      o("b", "Echarle una mano con otros contactos, sin contratarlo tú", "Indirecta", { moral: 1, reputacion: 1, flags: { cv_amigo_trabajo: true } }, "Llamas a un conocido que conoce a otro conocido. A las dos semanas, tu amigo tiene entrevista en una empresa de verdad. Te manda una foto con el logotipo de la entrada y un mensaje que no sabes cómo contestar."),
      o("c", "Decirle que ahora no es buen momento", "Negar", { moral: -2, flags: { cv_amigo_trabajo: true, estado_preocupado: "@WEEK+2" } }, "Le explicas, con la mejor intención del mundo, que no quieres mezclar las cosas. Él lo entiende y no se enfada. Pero desde entonces, os llamáis menos, y un día te das cuenta de que hace tres semanas que no sabes de él."),
    ]),
];
