/**
 * Llegar a un club nuevo, vivido desde dentro: el primer día en el vestuario, el dorsal que ya
 * es de otro, el míster que no te mira, el apodo que te ponen antes de que sepas tu taquilla.
 * Solo salen en tus primeros turnos en un club nuevo (clubTurns pequeño) y casi todas dejan una
 * marca que decide cómo te tratan los meses siguientes.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const FICHAJES_VIDA: BankScene[] = [
  S("fv-primer-dia", "llegada", { minAge: 17, clubTurns: [0, 2], notFlags: ["fv_primer_dia"] }, "vestuario",
    "Tu primer día en el vestuario nuevo: nadie te mira y todos te están mirando",
    "Entras con una bolsa nueva, una camiseta que aún huele a plástico y una sonrisa que has ensayado en el espejo. Hay veinte taquillas, veinte pares de ojos y un silencio que pesa. El capitán, con una toalla al hombro, te señala una al fondo: «Esa es la tuya». Alguien se ríe bajito. Al abrirla, descubres una nota pegada con celo: «Bienvenido. Cuidado con el del 7».",
    [
      o("a", "Entrar con una broma sobre la nota y presentarte a todos", "Romper el hielo", { rel_vestuario: 6, moral: 5, flags: { fv_primer_dia: "broma" } }, "«Ya me han avisado del del 7», dices, mirando alrededor. Un tipo con barba levanta la mano y todos se parten. Os dais la mano. El del 7, desde ese día, es tu mejor amigo. La nota, por supuesto, era suya."),
      o("b", "Saludar con educación, dejar tus cosas y esperar", "Mantener la discreción", { rel_vestuario: 3, moral: 2, flags: { fv_primer_dia: "discreto" } }, "Cuelgas la ropa, te sientas, miras al suelo. Poco a poco, uno a uno, se acercan a decirte hola. A las dos semanas, ya tienes un apodo. La discreción, con paciencia, también funciona."),
      o("c", "Demostrar de inmediato quién eres: el primero en llegar al campo, el último en irte", "Entrar con fuerza", { forma: 2, rel_entrenador: 3, rel_vestuario: -1, flags: { fv_primer_dia: "fuerza" } }, "Entrenas con una intensidad que sorprende. El míster asiente. El vestuario, más cauto, murmura: «Este viene con prisa». Tardarás un mes en que te lo perdonen."),
    ]),
  S("fv-dorsal", "llegada", { minAge: 17, clubTurns: [0, 3], notFlags: ["fv_dorsal"] }, "vestuario",
    "Tu dorsal de siempre ya lo lleva un veterano con mucha historia",
    "Lo has llevado desde los quince años. En tu club anterior, era tu marca. Aquí, el 9 lo luce un delantero que lleva doce años en el escudo y una estatua en el vestíbulo. Cuando preguntas al utillero, sonríe: «Tienes el 19, el 29 o el 39. Aquí, por respeto, nadie toca el 9». Alguien, desde el fondo, murmura: «Y si lo toca, lo pagará». Se hace un silencio.",
    [
      o("a", "Aceptar el 19 con una sonrisa y pedirle un consejo al veterano", "Respetar la historia", { rel_vestuario: 6, reputacion: 4, moral: 2, flags: { fv_dorsal: "respeto" } }, "Le pides al veterano que te firme una camiseta, con una frase. «El 9 es mío, el 19 es tuyo —escribe—. Hónralo». Te lo tomas muy en serio. Con los años, ese 19 tendrá un peso propio."),
      o("b", "Insistir en el 9 con la promesa de ganártelo", "Ir a por el puesto", { moral: 2, rel_vestuario: -3, rel_entrenador: -1, flags: { fv_dorsal: "insisto" } }, "El club te lo deniega con educación. El veterano, al enterarse, te mira con una frialdad nueva. En cada entrenamiento, te lo recordará con un gesto. Tardarás un año en que te pase un balón sin sarcasmo."),
      o("c", "Elegir un número sin historia, como el 33, para empezar de cero", "Hacerte tu propio dorsal", { moral: 4, reputacion: 2, flags: { fv_dorsal: "nuevo" } }, "El 33 es un número raro. Por eso lo recordarán. Dos temporadas después, un canterano pedirá ese dorsal por homenaje. «Es el de un crack», dirá."),
    ]),
  S("fv-mister-frio", "llegada", { minAge: 17, clubTurns: [0, 4], notFlags: ["fv_mister_frio"] }, "entrenamiento",
    "El míster nuevo te mira como si fueras un fichaje que no ha pedido",
    "En tu primera semana, no te dirige ni una palabra. En los ejercicios, te sitúa siempre en el equipo B. En la charla táctica, te señala en la pizarra con el dedo, sin nombrarte. En el pasillo, un ayudante te susurra: «Es que a ti te ha fichado el presidente. Él quería otro». Te quedas inmóvil. La frase te cala como un cubo de agua fría.",
    [
      o("a", "Pedir una reunión con el míster y hablar con claridad", "Dar la cara", { rel_entrenador: 5, reputacion: 4, moral: 1, flags: { fv_mister_frio: "hablo" } }, "El míster te recibe con los brazos cruzados. «Dime». Le explicas que sabes que no era su elección, pero que vas a trabajar el doble. Se queda callado. Luego, dice: «Eso me vale». Al día siguiente, entras en el equipo A."),
      o("b", "Hacer méritos en silencio y esperar tu oportunidad", "Dejar que hable el campo", { forma: 3, rel_entrenador: 2, moral: -1, flags: { fv_mister_frio: "trabajo" } }, "Entrenas con una intensidad silenciosa. A las tres semanas, un compañero se lesiona y te toca. Marcas. El míster, con una expresión impenetrable, apunta algo en su libreta. Es su manera de decir «Vale»."),
      o("c", "Quejarte a tu agente y pedir que te saque del club", "Buscar la salida", { rel_representante: 1, rel_entrenador: -4, moral: -3, flags: { fv_mister_frio: "salida", quiere_salir: true } }, "Tu agente, alarmado, empieza a moverse. A las dos semanas, te llegan tres ofertas. Pero el míster se entera por un periodista. Su mirada, desde ese día, es helada. Te quedas con la sensación de haber tirado la toalla demasiado pronto."),
    ]),
  S("fv-mister-vuelta", "llegada", { after: [after("fv-mister-frio", "a", 6, 60)], minAge: 18 }, "entrenamiento",
    "El míster te confiesa que se equivocó contigo",
    "Una tarde, tras un entrenamiento largo, te llama al despacho. Hay un café frío, un ordenador con vídeos y una mirada franca. «Quiero decirte algo —empieza—. Al principio pensé que eras un capricho del presidente. Me equivoqué». Se rasca la cabeza. «Eres el que más corre y el que mejor entiende. Lo he visto en tres semanas. Lo he visto en tres meses». Hay un silencio. «Disculpa».",
    [
      o("a", "Agradecerle la sinceridad y prometer devolver la confianza", "Aceptar con elegancia", { rel_entrenador: 7, reputacion: 4, moral: 6, flags: { fv_mister_aliado: true } }, "Se levanta, te da un apretón largo y dice: «Cuento contigo». Desde ese día, el míster es tu mayor valedor. Cuando tengas una mala racha, será el primero en defenderte."),
      o("b", "Responder con una broma sobre el presidente", "Quitar peso", { rel_entrenador: 4, moral: 4, flags: { fv_mister_aliado: "broma" } }, "«Si el presidente se equivoca tanto, me encantaría que me fichara más veces». El míster ríe, por primera vez desde que llegaste. Es el inicio de una relación de bromas y respeto."),
    ]),
  S("fv-apodo", "llegada", { minAge: 17, clubTurns: [0, 6], notFlags: ["fv_apodo"] }, "vestuario",
    "Te ponen un apodo antes de que sepas el nombre de todos",
    "Fue por una anécdota de segundos: tropezaste con un cono, dijiste una palabra en tu dialecto y el portero soltó una carcajada. «El Cono», proclamó. Todo el vestuario lo repitió. A los dos días, el utillero te había hecho una pegatina para la taquilla. A la semana, el apodo estaba en el grupo de WhatsApp, en la grada y en la boca de los niños que esperaban en la puerta.",
    [
      o("a", "Aceptarlo con humor y hacerlo tuyo", "Ser «El Cono»", { rel_vestuario: 7, rel_aficion: 4, fama: 2, moral: 4, flags: { fv_apodo: "acepto" } }, "Subes una foto con un cono en la cabeza. Un patrocinador te manda una línea de conos de entrenamiento firmados. La grada te corea «¡Cono, Cono!» como a un ídolo. Es, quizá, el apodo más absurdo y más querido del club."),
      o("b", "Pedir con simpatía otro apodo mejor", "Negociar", { rel_vestuario: 3, moral: 2, flags: { fv_apodo: "negocio" } }, "Propones «El Rayo». El vestuario se parte: «El Cono, le gusta más». Pasa el tiempo y, sin darte cuenta, firmas un papel con «Cono». Hay apodos que te eligen."),
      o("c", "Pedir que no te llamen así: no te gusta", "Poner un límite", { moral: -2, rel_vestuario: -3, flags: { fv_apodo: "rechazo" } }, "El vestuario lo respeta durante tres días. Al cuarto, alguien te llama «Cono» desde la puerta, medio en broma. Al quinto, medio vestuario. Al final, te rindes con una sonrisa."),
    ]),
  S("fv-casa-nueva", "llegada", { minAge: 17, clubTurns: [0, 4], patrimonio: [1500, 100000000], notFlags: ["fv_casa"] }, "vida",
    "El club te enseña tres pisos y los tres tienen un problema",
    "El primero está en un barrio precioso, pero la calefacción es de otro siglo. El segundo, con vistas al mar, tiene una vecina que cuelga calzoncillos en el balcón. El tercero es perfecto en todo, salvo en que está encima de una discoteca. El agente inmobiliario, con una sonrisa de venta, repite: «Esto es lo que hay». Tu agente, a tu lado, resopla. «Elige y ya».",
    [
      o("a", "Elegir el de la vecina de los calzoncillos y vivir con humor", "Con vistas", { moral: 5, rel_aficion: 2, flags: { fv_casa: "vecina" } }, "La vecina, doña Remedios, es la mejor persona del mundo. Te trae pasteles y te regaña por tus horarios. Los calzoncillos, con el tiempo, se convierten en una referencia horaria: «Si están tendidos, son las diez»."),
      o("b", "Elegir el de la discoteca y comprar tapones de oídos", "Aguantar el ruido", { forma: -1, moral: 2, patrimonio: -150, flags: { fv_casa: "disco" } }, "Los viernes son una fiesta. Duermes con tapones y una máquina de ruido blanco. Al mes, te acostumbras. Al año, bailas en el balcón con los vecinos. Todo es una cuestión de actitud."),
      o("c", "Elegir el de la calefacción antigua y comprar una estufa", "Resignarte", { moral: 1, patrimonio: -250, flags: { fv_casa: "estufa" } }, "Pasas un invierno entre mantas, con un termo y tres capas de ropa. Una noche, el casero aparece con una calefacción nueva: «Para el crack del equipo». Aprendes que a veces, aguantar tiene recompensa."),
    ]),
  S("fv-rival-ex", "llegada", { minAge: 18, clubTurns: [0, 10], notFlags: ["fv_rival_ex"] }, "partido",
    "Juegas contra tu antiguo club y la afición te silba con cariño",
    "Es el partido que llevabas semanas temiendo: el estadio donde creciste, la camiseta que ya no llevas, los hinchas que antes te cantaban. En el calentamiento, un grupo de ultras te lanza una pancarta: «Gracias por todo. Pero hoy, no». Te dedican un cántico lleno de afecto y de amenaza. Tu antiguo compañero, el capitán rival, te abraza en el centro del campo. «Que gane el mejor», dice.",
    [
      o("a", "Saludar a la grada con la mano en el pecho antes de empezar", "Rendir homenaje", { rel_aficion: 6, reputacion: 6, moral: 4, flags: { fv_rival_ex: "saludo" } }, "Los ultras, al verte, bajan los brazos. El estadio, entre silbidos y aplausos, te despide con un cariño medido. Marcas en el 70 y no celebras. Al final, los ultras te aplauden desde su fondo. Es una despedida bonita."),
      o("b", "Marcar y celebrarlo con rabia, como cualquier otro gol", "Ser profesional", { fama: 3, moral: 4, rel_aficion: -2, reputacion: -1, flags: { fv_rival_ex: "celebro" } }, "Celebras con los puños. En la grada, silbidos. Tu antiguo capitán, al verte, levanta una ceja. Al terminar, te escribe: «Podías haberte contenido». Es su manera de decirte que te duele."),
      o("c", "Pedir al míster que no te ponga en ese partido", "Evitar el trance", { rel_entrenador: -3, moral: -2, flags: { fv_rival_ex: "evito" } }, "El míster te mira largo rato. «No eres un niño». Te pone igual. Juegas sin ganas y el partido lo notas tuyo en lo malo. Aprendes que huir de lo que duele no lo hace desaparecer."),
    ]),
  S("fv-amigo-vestuario", "llegada", { minAge: 17, clubTurns: [0, 12], notFlags: ["fv_amigo"] }, "vestuario",
    "Encuentras a tu mejor amigo en el club nuevo, sin saberlo",
    "Fue por casualidad: en una charla de bienvenida, un compañero cuenta una anécdota de un campo de barro, de un partido con una gallina y de un delantero que se llamaba igual que tú. Te quedas mirándole. Él, a mitad de frase, se detiene. Os miráis. «Tú eres…». «¿Y tú eres…?». Hace diez años jugabais en categorías infantiles. Os habíais perdido la pista. Es el mejor reencuentro de tu vida.",
    [
      o("a", "Abrazarle ante todo el vestuario y contar la historia completa", "Celebrarlo", { moral: 9, rel_vestuario: 6, flags: { fv_amigo: "abrazo" } }, "Os abrazáis entre aplausos. Toda la tarde, el vestuario escucha vuestras anécdotas. Al final, el capitán dice: «Esto parece una película». Desde entonces, sois inseparables dentro y fuera del campo."),
      o("b", "Quedar con él después del entrenamiento y hablar de lo vivido", "Una charla íntima", { moral: 7, reputacion: 2, flags: { fv_amigo: "charla" } }, "Pasáis la noche en una cafetería. Cuenta lo que le pasó: una lesión, un traspaso, una boda. Tú cuentas lo tuyo. A las dos, el camarero os echa. Os quedáis un rato más en la calle, con la bruma de la ciudad."),
    ]),
  S("fv-despedida-club", "llegada", { minAge: 19, clubTurns: [10, 60], flags: ["quiere_salir"], notFlags: ["fv_despedida"] }, "vida",
    "Dejas atrás tu club de toda la vida y tu último día es un torbellino de abrazos",
    "Has firmado en secreto, y ahora, con la maleta en el maletero, dices adiós. En el vestuario, el utillero te regala un álbum de fotos de tu etapa. En el túnel, el capitán te abraza sin hablar. En la puerta, una treintena de aficionados te esperan con bufandas y carteles. Alguien llora. Alguien aplaude. Alguien, por fin, grita: «¡Vuelve cuando quieras!». Se te quiebra la voz.",
    [
      o("a", "Quedarte una hora firmando camisetas y abrazando a todos", "Darlo todo", { moral: 6, rel_aficion: 9, reputacion: 6, flags: { fv_despedida: "todo" } }, "Tardas dos horas en salir del parking. El álbum del utillero se convierte en tu objeto más querido. Cuando, años después, regreses de visita, la afición te recibirá con la misma bufanda."),
      o("b", "Marcharte rápido para no llorar y escribir una carta de despedida en redes", "Despedida breve", { moral: 3, rel_aficion: 5, reputacion: 3, flags: { fv_despedida: "carta" } }, "La carta tiene veinte líneas y un «gracias» al final. La afición la comparte con cariño. Alguien escribe: «Se fue como vino: con humildad». Es el mejor elogio de tu etapa."),
    ]),
];
