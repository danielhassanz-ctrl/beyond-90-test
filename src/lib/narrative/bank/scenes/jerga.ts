/**
 * La jerga de ahora, en boca de quien la usa: periodistas jóvenes, compañeros, hermanos pequeños y las redes. Aura, prime,
 * FOMO, «soltar un facto»… no como adorno suelto, sino como escenas con decisión: una entrevista, una rueda de prensa,
 * un vestuario que habla otro idioma que el míster.
 */
import { S, o, r } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const ADULTO: BankWhen = { minAge: 18, maxAge: 40 };

export const JERGA: BankScene[] = [
  S("jg-entrevista-aura", "jerga", { ...ADULTO, fama: [35, 100], clubTurns: [3, 400], notFlags: ["jg_aura"] }, "prensa",
    "«¿Cuánta aura tienes ahora mismo?»",
    "El entrevistador es joven, lleva zapatillas en un plató que huele a laca y te suelta la pregunta con una sonrisa de quien sabe que va a ser recorte de redes: «Del uno al diez, ¿cuánta AURA tienes ahora mismo?». Detrás de cámaras, el jefe de prensa del club se agarra la frente con las dos manos.",
    [
      o("a", "Responder en serio: «No lo mido: lo que cuenta es el campo»", "Sin entrar al trapo", { reputacion: 2, fama: 1, moral: 1, flags: { jg_aura: true } }, "Lo dices con calma, mirando a cámara. El entrevistador asiente como si hubiera esperado otra cosa y rellena con una pregunta de táctica. El recorte no se hace viral, pero el míster, al verlo, asiente por primera vez en semanas."),
      r("b", "Entrar al juego: «Mucha. Infinita. Ni me la puedo medir»", "Con humor", 0.55,
        "Se hace el silencio un segundo y luego el plató estalla. El recorte te hace tendencia toda la tarde, con memes de ti con halo y música épica. Tu hermano pequeño te manda un solo mensaje: «aura +10000».", { fama: 3, moral: 4, rel_aficion: 2, flags: { jg_aura: true } },
        "Te sale un chiste que no cuaja. Se oye una risa suelta y la cámara cierra plano en tu cara de «no ha funcionado». En redes, un usuario con avatar de dibujo escribe «aura -500» y se hace viral. Sobrevivirás.", { fama: -1, moral: -3, flags: { jg_aura: true } }, "fama"),
      o("c", "Soltar un facto: «El aura se gana en octubre, no en diciembre»", "Frase con gancho", { fama: 2, moral: 2, reputacion: 1, flags: { jg_aura: true } }, "No sabes muy bien de dónde te ha salido, pero suena a titular. Los chavales lo repiten en el patio del colegio; los mayores no entienden nada y lo citan igual. El jefe de prensa te mira y por fin respira."),
    ]),
  S("jg-prime", "jerga", { ...ADULTO, minAge: 24, maxAge: 33, fama: [45, 100], media: [76, 99], notFlags: ["jg_prime"] }, "prensa",
    "«¿Estás en tu prime?»",
    "Una periodista joven te lo planta en zona mixta, con el micro a un palmo de la cara: «Hay quien dice que estás en tu PRIME. ¿Lo estás? ¿Cuánto te queda?». Detrás, un cámara canoso murmura que en sus tiempos eso se llamaba «estar en forma». Todos esperan una frase para el recorte.",
    [
      o("a", "«Sí, y lo voy a exprimir hasta el último partido»", "Declaración de intenciones", { fama: 2, moral: 4, rel_aficion: 2, flags: { jg_prime: true } }, "La frase sale rotunda y la grada la recibe como una promesa. Los compañeros te la repiten en el vestuario con voz de locutor. Ahora hay que cumplirla."),
      o("b", "«El prime lo decide el campo cada domingo»", "Humildad", { reputacion: 3, rel_entrenador: 2, flags: { jg_prime: true } }, "No sueltas el titular que querían, pero sí uno que el míster te agradece en privado: «Eso es lo que me gusta oírte». La periodista, algo decepcionada, lo publica igual."),
      r("c", "«Yo todavía no he empezado mi prime»", "Todo un reto", 0.5,
        "Se genera un pequeño terremoto en redes: «¿Y esto es SIN prime?». Los rivales leen la frase con cara de mal humor. Tú, desde el vestuario, solo sonríes. Esa semana, cada balón tuyo se mira dos veces.", { fama: 3, moral: 4, rel_aficion: 2, flags: { jg_prime: true } },
        "La frase se convierte en meme en cuanto fallas el primer control del domingo: «Y eso que no estaba en su prime». Sobrevives con deportividad, pero el recorte te acompaña durante días.", { fama: -2, moral: -3, flags: { jg_prime: true } }, "moral"),
    ]),
  S("jg-fomo-vestuario", "jerga", { ...ADULTO, minAge: 18, maxAge: 32, clubTurns: [3, 400], notFlags: ["jg_fomo"] }, "vestuario",
    "FOMO: todos están en el plan, menos tú",
    "El grupo de WhatsApp del vestuario no para de vibrar: fotos de una cena, vídeos de un karaoke, un audio de diez segundos con las risas de media plantilla. Tú estabas en casa, con las piernas en alto y un partido a las doce. Un compañero joven te escribe: «Tío, me da FOMO por ti. ¡Te lo estás perdiendo!».",
    [
      o("a", "Apuntarte al siguiente plan, sea cual sea", "Entrar al grupo", { rel_vestuario: 4, moral: 2, forma: -1, flags: { jg_fomo: true } }, "Dices que sí al siguiente plan sin saber qué es. Resulta ser una cena con quince personas y un concurso de imitaciones del míster. Vuelves a casa a la una con la voz ronca y la sensación de haber ganado algo que no se mide en puntos."),
      o("b", "Mandar un audio gracioso y quedarte a descansar", "Cuidar la forma", { rel_vestuario: 1, forma: 2, moral: 1, flags: { jg_fomo: true } }, "Tu audio de veinte segundos, con voz de documental de naturaleza, se vuelve el sticker del grupo. Descansas, juegas bien y, de paso, te ganas una reputación de profesional con sentido del humor."),
      o("c", "Pasar del grupo: «Yo estoy a lo mío»", "Pasar", { rel_vestuario: -3, forma: 1, moral: -1, flags: { jg_fomo: true } }, "Silencias el grupo. A la semana, en el vestuario, notas que hay bromas que ya no entiendes. El FOMO, al final, lo tienes tú."),
    ]),
  S("jg-facto-rueda", "jerga", { ...ADULTO, fama: [30, 100], clubTurns: [4, 400], notFlags: ["jg_facto"] }, "prensa",
    "El reto del capitán: soltar un facto en rueda de prensa",
    "Antes de salir a la sala, el capitán, que nunca pierde una oportunidad, te propone un reto: «Hoy, en la rueda, sueltas un facto. Uno. Uno solo. Si no lo haces, pagas la cena». El jefe de prensa suspira detrás: «Por favor, que sea uno inofensivo».",
    [
      r("a", "Soltar un facto y mantener la cara de póker", "Cumplir el reto", 0.55,
        "En la rueda, a la pregunta de si el equipo está a la altura, respondes con toda calma: «Facto». Hay un silencio de dos segundos y la sala entera estalla en carcajadas. El recorte tiene un millón de visitas antes de la cena. El capitán paga y llora de risa.", { fama: 3, moral: 5, rel_vestuario: 4, flags: { jg_facto: true } },
        "Sueltas el facto en el peor momento, justo tras una pregunta seria sobre un compañero lesionado. El silencio es de los que duran. El jefe de prensa se tapa la cara y tú pides perdón, pagas la cena y aprendes que hay momentos para todo.", { fama: -1, moral: -3, rel_vestuario: 1, reputacion: -1, flags: { jg_facto: true } }, "reputacion"),
      o("b", "Negarte: «Hoy toca ser serio»", "Con cabeza", { reputacion: 2, rel_vestuario: -2, patrimonio: -300, flags: { jg_facto: true } }, "Pagas la cena de todos sin rechistar. El capitán brinda por «el único profesional del grupo» con una ironía que no se pasa en toda la noche. En la rueda de prensa, nadie te mira raro."),
      o("c", "Convertirlo en un acto benéfico: un euro por cada facto", "Un giro", { reputacion: 3, fama: 2, rel_vestuario: 2, patrimonio: -500, flags: { jg_facto: true } }, "Lo anuncias en redes: un euro de tu bolsillo por cada «facto» que se comente bajo la publicación. Se llena en media hora. Entregas el dinero a un comedor social con una foto de los dos, y el reto se queda en la mejor idea de la semana."),
    ]),
  S("jg-aura-perdida", "jerga", { ...ADULTO, fama: [40, 100], clubTurns: [3, 400], notFlags: ["jg_aura_menos"] }, "prensa",
    "Pierdes aura en redes por un fallo",
    "Fallas un control fácil, resbalas con el balón en los pies y el vídeo ya circula con música de circo. Debajo, el comentario más repetido: «PIERDE AURA». Alguien ha montado una barra de aura que baja con cada error tuyo. Tu móvil vibra con un mensaje de tu agente: «No lo mires. Bueno, míralo, pero con calma».",
    [
      o("a", "Responder con humor: publicar tú mismo la barra de aura, en positivo", "Reírte de ti", { fama: 2, moral: 3, rel_aficion: 2, flags: { jg_aura_menos: true } }, "Subes la imagen con el pie de «recuperando aura al 4 %». La gente se ríe contigo, no de ti. El domingo, con el primer buen pase, la barra sube sola y alguien te dedica un montaje épico."),
      o("b", "Ignorarlo y entrenar", "Con hechos", { forma: 1, moral: -1, rel_entrenador: 1, flags: { jg_aura_menos: true } }, "No contestas ni una vez. El meme pierde fuerza en dos días; entretanto, tus siguientes tres partidos son redondos. Lo borran de los trending sin que nadie lo recuerde."),
      r("c", "Contestar con una jugada: pedir el balón y recuperar aura en el campo", "El campo habla", 0.5,
        "Al siguiente partido, el primer balón es para ti. Un recorte, un pase filtrado y, a los veinte minutos, un gol. Tus fans publican la barra: «+100 AURA». Ya nadie se acuerda del fallo.", { fama: 3, moral: 4, rel_aficion: 3, flags: { jg_aura_menos: true } },
        "Pides el balón con demasiada ansia y el fallo se repite. Los silbidos se mezclan con los comentarios burlones. La barra, en redes, llega a -1000. Tardarás un tiempo en olvidarlo.", { fama: -2, moral: -4, rel_aficion: -2, flags: { jg_aura_menos: true } }, "moral"),
    ]),
  S("jg-mister-no-entiende", "jerga", { ...ADULTO, minAge: 18, maxAge: 30, clubTurns: [4, 400], rel: { entrenador: [30, 100] }, notFlags: ["jg_mister"] }, "vestuario",
    "El míster no entiende lo que dicen los chavales",
    "En la charla técnica, un juvenil de la primera plantilla dice que el míster «tiene mucha aura» y otro que «ha cocinado en la táctica». El entrenador, que lleva treinta años en el fútbol, frunce el ceño y levanta una mano: «A ver, ¿alguien me traduce?». Todos te miran a ti.",
    [
      o("a", "Traducírselo con paciencia, con ejemplos del fútbol", "Mediador", { rel_entrenador: 3, rel_vestuario: 3, moral: 2, flags: { jg_mister: true } }, "Se lo explicas con la pizarra: «Aura es como el respeto, míster, pero con más estilo». El míster asiente, apunta algo en una libreta, y a la semana suelta en el entrenamiento: «Hoy hay mucha aura en este campo». Se hace un silencio, luego una ovación."),
      o("b", "Dejar que lo descubra solo: «Ya lo pillará, míster»", "Humor", { rel_vestuario: 3, rel_entrenador: -1, moral: 2, flags: { jg_mister: true } }, "El vestuario aguanta la risa como puede. Al día siguiente, el míster pregunta si «tener FOMO» es algo médico. Esa frase se queda en el grupo de WhatsApp para siempre."),
      o("c", "Defender al míster: «Estas cosas pasan, déjenlo tranquilo»", "Lealtad", { rel_entrenador: 4, rel_vestuario: -1, flags: { jg_mister: true } }, "Pones orden en la sala con una frase. El míster te lo agradece con una ceja arriba: «Gracias». Algún juvenil te mira con cara de «qué aburrido». El míster, en cambio, te guarda una consideración que durará todo el curso."),
    ]),
  S("jg-hermano-prime", "jerga", { ...ADULTO, minAge: 25, maxAge: 36, notFlags: ["jg_hermano"] }, "vida",
    "Tu hermano pequeño dice que estás en tu prime",
    "Tu hermano, que ahora habla un idioma que tú no hablas, te mira durante la comida y suelta: «Tío, estás en tu prime. Hay que aprovecharlo». Tu madre le pregunta qué es eso y él responde con una paciencia infinita. Tú, de repente, te sientes un poco viejo y un poco orgulloso a la vez.",
    [
      o("a", "Tomártelo en serio: ponerte metas para los próximos años", "Aprovechar el momento", { moral: 4, forma: 1, flags: { jg_hermano: true } }, "Esa tarde, escribes en una libreta tres cosas que quieres conseguir antes de que el prime se acabe. Tu hermano, al verla, dice: «Tío, qué cringe». Y luego, bajito: «Pero mola»."),
      o("b", "Picarle con la edad: «Cuando tú llegues, yo ya seré leyenda»", "Piques", { moral: 3, flags: { jg_hermano: true } }, "Se pica y te reta a una partida de consola. La pierdes. La revancha dura toda la tarde. Tu madre sirve la tarta mirándoos con ese amor que no necesita traducción."),
    ]),
  S("jg-trend-club", "jerga", { ...ADULTO, minAge: 18, maxAge: 30, fama: [30, 100], clubTurns: [3, 400], notFlags: ["jg_trend"] }, "prensa",
    "El club te pide entrar en un trend",
    "El equipo de redes del club te pilla por el pasillo con el móvil en alto: «Hay un trend, el del baile del año, y necesitamos a alguien con aura». Te enseñan el vídeo: unos pasos que, vistos desde fuera, parecen un tratamiento de fisioterapia. El jefe de prensa te mira desde lejos, con cara de «por favor, que no».",
    [
      r("a", "Hacerlo con toda tu alma", "Entrar al trend", 0.5,
        "Te sale mejor de lo que esperabas: el club lo publica y llega a millones de visitas. El míster pregunta qué ha pasado y alguien le enseña el vídeo. Después de verlo dos veces, solo dice: «Mañana, más intensidad en la banda». Es lo más parecido a una aprobación.", { fama: 3, moral: 4, rel_aficion: 3, rel_vestuario: 2, flags: { jg_trend: true } },
        "Te sale peor de lo que esperabas, y el vídeo sale igual. Los comentarios van de «qué mal baila» a «le falta aura». Sobrevives con humor y un par de memes en los que, por suerte, apareces con una sonrisa.", { fama: 1, moral: -2, rel_vestuario: 1, flags: { jg_trend: true } }, "fama"),
      o("b", "Decir que no: «Lo mío es el campo»", "Fuera de foco", { reputacion: 1, rel_entrenador: 1, rel_aficion: -1, flags: { jg_trend: true } }, "No lo haces. El club entiende, pero el vídeo se hace con un juvenil que arrasa. Tu madre te dice al teléfono: «Podrías haberlo hecho, hijo». Piensas en ello durante un buen rato."),
    ]),
];
