/**
 * El club, el cuerpo técnico, tu representante y la prensa: conflictos y oportunidades del día a día profesional, con
 * consecuencias en el banquillo, la relación con el míster, el dinero y los estados temporales (states.ts).
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const EQUIPO: BankWhen = { minAge: 17, roles: ["titular", "rotacion", "suplente"], clubTurns: [3, 400] };
const LIBRE = ["estado_castigo", "estado_escandalo"];

export const CLUB3: BankScene[] = [
  // ───────────── Cuerpo técnico ─────────────
  S("c3-fisio-molestia", "cuerpo", { ...EQUIPO, roles: ["titular", "rotacion"], notFlags: ["c3_fisio", "estado_fisico"], clubTurns: [3, 400] }, "entrenamiento",
    "Ocultas una molestia para no perderte el partido",
    "Es un pinchazo en el abductor que llevas tres días disimulando. No es grave, piensas. Pero el fisio, que te conoce de memoria, te ha visto cojear al bajar del autobús y te sigue con la mirada. Mañana es el partido más importante de la temporada y el míster ha dicho que cuenta contigo. «No me pasa nada», repites. El fisio no insiste: anota algo.",
    [
      o("a", "Contárselo al fisio: mejor ahora que en el minuto 20", "Ser sincero", { forma: 2, rel_entrenador: 1, moral: -1, flags: { c3_fisio: true } }, "El fisio te mira con cara de «por fin». Te trata dos horas, te pone un vendaje y te dice que juegas con control. No es la verdad que querías, pero te salva de un mes de baja. El míster te lo agradece con una palmada."),
      r("b", "Jugar a pesar de la molestia, sin avisar a nadie", "Jugártela", 0.45,
        "El abductor aguanta. Juegas, marcas, celebras y te vas al vestuario sin cojear, y en el hotel te metes en hielo hasta las orejas. A veces la suerte te cuida.", { moral: 4, fama: 2, flags: { c3_fisio: true } },
        "Al minuto 30 el pinchazo se convierte en un tirón. Sales cojeando y el diagnóstico es peor de lo que habías disimulado. Seis semanas de baja y un fisio que no te dirige la palabra durante dos.", { forma: -8, moral: -5, rel_entrenador: -3, flags: { c3_fisio: true, estado_bache: "@WEEK+4" } }, "forma"),
      o("c", "Pedirle al médico que lo mire de forma discreta", "Doble vía", { forma: 1, moral: 0, flags: { c3_fisio: true } }, "El médico te hace una ecografía rápida y detecta una microrrotura mínima. Tratamiento, un descanso corto y un informe que no llega al míster. Os guardáis el secreto, pero a la vuelta, el fisio te mira con un ceño que ni un abrazo borraría."),
    ]),
  S("c3-preparador-duro", "cuerpo", { ...EQUIPO, notFlags: ["c3_duro", "estado_fisico"], clubTurns: [2, 12] }, "entrenamiento",
    "El nuevo preparador físico te exprime",
    "Llega con un maletín, un cronómetro y un plan de trabajo que no admite preguntas. Las primeras semanas son un infierno: dobles sesiones, ejercicios que no sabías que existían y una voz que repite «un poco más, un poco más» como una sentencia. En el vestuario, los veteranos le llaman en voz baja «el sargento». Tú ya no sientes las piernas.",
    [
      o("a", "Aguantar y seguir el plan sin quejarte", "Confiar", { forma: -3, moral: -1, rel_entrenador: 1, flags: { c3_duro: true, estado_fisico: "@WEEK+6" } }, "Las dos primeras semanas son de órdago. A la tercera, algo cambia: subes los últimos metros de la cuesta sin parar. A la sexta, el míster te dice que te ve «de otra pasta». El sargento sonríe por primera vez."),
      o("b", "Hablar con él y pedirle un plan más ajustado a ti", "Negociar", { forma: 1, moral: 2, flags: { c3_duro: true, estado_fisico: "@WEEK+3" } }, "Te escucha, anota, y te da la razón en la mitad de las cosas. «El que más protesta, más me preocupa. El que más pregunta, más me gusta». Ajusta las series y las pausas. Con ese plan te sientes casi un atleta."),
      o("c", "Quejarte con el míster de lo duro que es", "Protestar", { rel_entrenador: -2, moral: -2, flags: { c3_duro: true } }, "El míster te escucha con el gesto de quien ya ha oído esa queja tres veces esa semana. «Dale tiempo. Y dale cuerpo». Sales con la sensación de haber perdido un pequeño crédito."),
    ]),
  S("c3-no-cuentan", "club", { ...EQUIPO, roles: ["rotacion", "suplente"], notFlags: ["c3_nocuentan", ...LIBRE], clubTurns: [6, 400] }, "representante",
    "El director deportivo te dice que no cuentan contigo",
    "Te cita en su despacho, con las persianas medio bajadas y una carpeta cerrada. Habla con voz amable y con las palabras cuidadosamente elegidas, de las que se usan cuando se va a decir algo malo: «Vamos a reforzar tu puesto. Tú eres un chaval con futuro, pero este año no vas a tener los minutos que mereces». En el pasillo, el utillero te mira de reojo, con cara de lo sabía.",
    [
      o("a", "Pedir salir cedido a un club donde juegues", "Buscar minutos", { moral: 2, rel_entrenador: 1, flags: { c3_nocuentan: true, quiere_salir: true } }, "El director asiente: «Era lo que iba a proponer». En una semana, tu representante tiene tres ofertas de clubes donde serías titular. Te despides de los compañeros con una mezcla de pena y alivio."),
      o("b", "Quedarte y pelear tu puesto con todo", "Pelear", { forma: 2, rel_entrenador: 2, moral: -1, flags: { c3_nocuentan: true, estado_confianza: "@WEEK+2" } }, "Le dices que vas a demostrarle lo contrario. Él sonríe con suavidad: «Me encantaría que lo hicieras». Esa semana, llegas el primero al campo y te vas el último. El míster no dice nada, pero te mira."),
      o("c", "Pedir un traspaso definitivo, sin más vueltas", "Cortar", { moral: 1, rel_entrenador: -2, flags: { c3_nocuentan: true, quiere_salir: true, estado_preocupado: "@WEEK+2" } }, "Tu representante se frota las manos: «Esto lo arreglo en un mes». El club acepta con una frialdad educada. Esa tarde, caminando por el túnel, tienes la sensación rara de estar dejando un lugar sin haberlo cerrado."),
    ]),
  S("c3-palco", "club", { ...EQUIPO, fama: [45, 100], notFlags: ["c3_palco"], clubTurns: [4, 400] }, "especial",
    "El presidente te invita a su palco",
    "Después de un partido en casa, el presidente te hace llamar. No es una reunión: es una invitación al palco, con un grupo de empresarios, un jamón ibérico y una copa de vino que cuesta más que tu primer sueldo. Te presentan a tres personas que te miran como se mira un caballo de carreras. Al fondo, el míster, de pie junto a la pared, observa la escena sin sonreír.",
    [
      o("a", "Ser cortés, charlar un rato y marcharte pronto", "Medida", { reputacion: 3, rel_entrenador: 1, flags: { c3_palco: true } }, "Charlas diez minutos, das las gracias y te vas con el pretexto del descanso. El presidente, al despedirse, te da un apretón largo: «Eso es profesionalidad». El míster, sin decir nada, te hace un leve gesto de aprobación."),
      o("b", "Quedarte y aprovechar para hacer contactos", "Aprovechar", { patrimonio: 4000, fama: 2, rel_entrenador: -2, flags: { c3_palco: true } }, "Una de las personas del palco, dueña de una cadena de hoteles, se interesa por ti como imagen de marca. Dos semanas después, tu representante tiene una propuesta sobre la mesa. El míster, eso sí, te recuerda con un aire seco que «los partidos se juegan en el césped»."),
      o("c", "Rechazar la invitación: prefieres irte a casa", "Con humildad", { moral: 2, rel_entrenador: 2, reputacion: 1, flags: { c3_palco: true } }, "Lo dices con una excusa y una sonrisa. El presidente, que ya ha visto de todo, no se ofende. Esa noche, el míster te escribe un mensaje muy corto: «Buena decisión»."),
    ]),
  S("c3-utillero", "club", { ...EQUIPO, clubTurns: [10, 400], notFlags: ["c3_utillero"] }, "vestuario",
    "El utillero se jubila tras cuarenta años en el club",
    "Todo el vestuario lo sabe menos él: esta noche le preparan una despedida sorpresa. Lleva cuarenta años doblando camisetas, afilando tacos, ordenando botas y escuchando secretos de generaciones. Hay una tarta, una camiseta enmarcada y un pequeño discurso que alguien tiene que dar. El capitán te mira y señala con la barbilla: «Tú».",
    [
      o("a", "Dar el discurso con el corazón, sin papeles", "Hablar", { rel_vestuario: 5, moral: 4, flags: { c3_utillero: true } }, "Dices lo que sientes: que fue el primero en saludarte, que te dobló las camisetas como si fueras un rey, que te dio consejos que no estaban en ningún manual. El utillero llora en silencio. Sales del vestuario con los ojos húmedos y la sensación de haber dicho algo importante."),
      o("b", "Dejar que lo haga el capitán y acompañar con un regalo", "Acompañar", { patrimonio: -500, rel_vestuario: 3, moral: 2, flags: { c3_utillero: true } }, "Le regalas un par de botas de tu primera titularidad, firmadas por todo el equipo. El utillero las mira un buen rato y las guarda en una caja. «Estas no las limpio, que se quedan como están»."),
    ]),

  // ───────────── Representante y negocios ─────────────
  S("c3-agente-presion", "negocio", { ...EQUIPO, fama: [35, 100], notFlags: ["c3_agente", ...LIBRE], clubTurns: [6, 400], minAge: 19 }, "representante",
    "Tu representante te presiona para cambiar de club",
    "Lleva semanas con una frase nueva en cada llamada: «Estás por encima de este club». Te manda vídeos de otros clubes, notas de prensa sobre rumores, un correo con «tres opciones muy interesantes». Hoy ha ido más lejos: «Si no te mueves este verano, el mercado se te olvida». No es mala persona; el cuarenta por ciento de su comisión depende de que te vayas.",
    [
      o("a", "Decirle que estás a gusto y que no te presione más", "Plantarte", { rel_representante: -3, moral: 2, flags: { c3_agente: true } }, "«Si quiero irme, te lo diré yo». Se hace un silencio incómodo. «Entendido». No vuelve a insistir con tanto ahínco, pero algo en vuestra relación se vuelve más profesional y menos cálido."),
      o("b", "Escuchar las opciones y valorarlas con calma", "Abierto", { moral: 1, flags: { c3_agente: true, quiere_salir: true } }, "Te sientas con él y repasáis una por una. Dos son interesantes, una es un espejismo. Al final decides esperar al mercado de invierno. Tu representante sonríe, convencido de haber ganado. Tú, de haberte guardado una carta."),
      r("c", "Pedirle que te enseñe sus comisiones antes de seguir", "Transparencia", 0.5,
        "El representante palidece un poco y luego sonríe: «Me gusta que lo preguntes». Te enseña las cifras y, con ellas, un poco de tu confianza. A partir de entonces trabaja con más honestidad.", { rel_representante: 2, reputacion: 2, flags: { c3_agente: true } },
        "Se ofende. «Llevo años cuidándote y me preguntas por mis comisiones». Se niega a enseñarlas y desde entonces su tono contigo es de mucha cortesía y poca confianza.", { rel_representante: -5, moral: -2, flags: { c3_agente: true } }, "reputacion"),
    ]),
  S("c3-documental", "negocio", { ...EQUIPO, fama: [60, 100], notFlags: ["c3_documental", ...LIBRE], clubTurns: [6, 400], minAge: 19 }, "especial",
    "Una plataforma quiere hacer un documental sobre ti",
    "Un productor con un portátil lleno de pegatinas y una paciencia de cirujano te ofrece una serie de seis capítulos sobre tu vida: cámaras en casa, en el vestuario, en la comida con tu madre. «Contamos tu historia de verdad». Tu representante se frota las manos y menciona una cifra con un cero de más. Tu madre, al saberlo, se ha puesto a limpiar la casa.",
    [
      o("a", "Aceptar y abrirles las puertas de todo", "Todo", { patrimonio: 12000, fama: 6, rel_entrenador: -2, flags: { c3_documental: true, estado_escandalo: "@WEEK+2" } }, "El rodaje dura tres meses. Hay momentos hermosos y otros que te incomodan: las cámaras te filman en una discusión con tu pareja y en una mala tarde en el vestuario. El resultado es un éxito, y tú te ves reflejado en la pantalla con un poco de vértigo."),
      o("b", "Aceptar, con condiciones: sin cámaras en casa", "Con límites", { patrimonio: 8000, fama: 4, flags: { c3_documental: true } }, "Se quejan, regatean, y al final aceptan. La serie es más modesta que la que habían imaginado, pero tiene algo que la hace sincera. Tu madre la ve cuatro veces. Tú, sólo dos."),
      o("c", "Rechazarlo: no quieres que te filmen tanto", "Privacidad", { reputacion: 2, moral: 1, flags: { c3_documental: true } }, "Lo rechazas con cariño. El productor lo entiende y te deja su tarjeta. Esa noche, al cenar, sientes un alivio raro: la sensación de que, de momento, aún eres dueño de tu historia."),
    ]),

  // ───────────── Prensa ─────────────
  S("c3-rueda-prensa", "prensa", { ...EQUIPO, fama: [35, 100], notFlags: ["c3_rueda", ...LIBRE], clubTurns: [3, 400] }, "prensa",
    "Una pregunta trampa en rueda de prensa",
    "Es tras un partido que perdisteis, con el mini-podio de las preguntas. Un periodista que no te cae bien levanta la mano y pregunta con una sonrisa: «¿Es cierto que el míster no cuenta contigo para el próximo partido?». No es cierto. Pero si lo niegas, parece que lo dices a la fuerza; si lo confirmas, harás una polémica. Todas las cámaras te apuntan.",
    [
      o("a", "Responder con calma: «Eso se lo tendrá que preguntar al míster»", "Esquivar con elegancia", { rel_entrenador: 1, reputacion: 2, flags: { c3_rueda: true } }, "La sala se desinfla. Algunos periodistas sonríen con respeto. El míster, que ve la rueda de prensa en su despacho, apunta algo en su libreta y sonríe apenas."),
      o("b", "Devolverle la pregunta con ironía", "Contraatacar", { fama: 3, rel_entrenador: -2, flags: { c3_rueda: true, estado_escandalo: "@WEEK+2" } }, "«Qué casualidad que usted sepa eso antes que yo». La sala estalla en risas y el periodista se pone rojo. Tu frase es titular en todos los medios. El club te pide, por favor, más prudencia."),
      o("c", "Salirte de la rueda de prensa", "Abandonar", { rel_entrenador: -4, fama: 1, multa: 1, flags: { c3_rueda: true } }, "Te levantas y te marchas sin decir nada. El club se entera por la tele y te multa por incumplimiento de obligaciones de prensa. Tu representante te llama con una frase seca: «Hay formas más elegantes»."),
    ]),
  S("c3-meme", "prensa", { ...EQUIPO, fama: [30, 100], notFlags: ["c3_meme"], clubTurns: [3, 400] }, "prensa",
    "Un meme tuyo se hace viral",
    "Es una foto de tu cara en el instante exacto de un fallo. No es una foto bonita: tus ojos van en dos direcciones, la lengua asoma un milímetro y el balón sale rebotado como un animal asustado. Alguien le ha puesto una frase y lo ha subido. En cuatro horas, tienes tu cara en todas las conversaciones, camisetas incluidas. Hay gente que te lo manda con cariño y gente que no.",
    [
      o("a", "Reírte de ti mismo y compartirlo con humor", "Aceptarlo", { fama: 4, rel_aficion: 4, moral: 2, flags: { c3_meme: true } }, "Subes el meme con un pie de foto: «Cuando te dicen que la próxima vez llegue antes». Se hace más viral aún. Un chaval te manda un dibujo de ti en versión cómic. Tu marca de ropa te manda una caja con tu cara estampada."),
      o("b", "Pedir a tu equipo de redes que lo retire", "Retirar", { moral: -1, flags: { c3_meme: true } }, "Intentan retirarlo y, como pasa siempre, se multiplica. Cuando por fin se enfría, un amigo de la infancia te escribe un mensaje: «Habrías ganado más riéndote»."),
      o("c", "Ignorarlo", "Pasar", { flags: { c3_meme: true } }, "Lo ignoras con una calma que no sientes. En el siguiente partido, la grada te canta algo burlón durante la primera media hora. En la segunda, ya no."),
    ]),
  S("c3-podcast", "prensa", { ...EQUIPO, fama: [50, 100], notFlags: ["c3_podcast", ...LIBRE], clubTurns: [4, 400] }, "prensa",
    "Te invitan a un podcast y te sueltas demasiado",
    "Era una conversación en una sala pequeña, con dos micros, un café y un entrevistador muy simpático. A los cuarenta minutos, entre risas, dices un comentario sobre la plantilla, sobre un compañero y sobre tus ganas de «probar algo más grande». Es solo una charla. Pero cuando el podcast sale, un titular de un medio deportivo lo resume así: «Quiere irse».",
    [
      o("a", "Aclarar en redes que has sido malinterpretado", "Aclarar", { fama: 1, rel_entrenador: -2, moral: -1, flags: { c3_podcast: true } }, "Subes un mensaje aclaratorio. Unos te creen, otros no. El míster te llama para saber qué pasó. «Lo sé, no lo has dicho así. Pero sabes cómo funciona esto»."),
      o("b", "Hablar con el míster antes de que lo lea en la prensa", "Anticiparte", { rel_entrenador: 2, moral: 1, flags: { c3_podcast: true } }, "Llegas antes que el titular. Se lo cuentas con las palabras exactas. El míster se echa a reír: «Podías haber dicho cosas peores». Os guardáis la anécdota en el cajón de las cosas inofensivas."),
      o("c", "Dejarlo estar: «Que digan lo que quieran»", "Pasar", { rel_aficion: -3, rel_entrenador: -3, flags: { c3_podcast: true, estado_escandalo: "@WEEK+3" } }, "El titular crece. Los compañeros te miran con otros ojos y la afición te cuestiona. Cuando por fin lo aclaras, ya lleva semanas deformando la historia."),
    ]),
];
