/**
 * Disciplina y escándalos: las cosas que haces fuera del campo pasan factura DENTRO. Una noche de más, un retraso, un
 * tuit: el míster se enfada, hay multa, te quedas en el banquillo, la prensa se ceba, y si reincides, el club te lo
 * apunta. Todo con consecuencias reales (relación con el míster, banquillo, dinero, estados temporales con efecto en
 * las jugadas) y encadenado: lo que haces hoy cambia lo que pasa en las próximas semanas.
 *
 *   dc_paparazzi / dc_discoteca / dc_despacho / dc_tardes   huellas que dejan las escenas (y que endurecen las siguientes)
 *   estado_escandalo / estado_castigo / estado_bache        estados temporales (ver states.ts)
 */
import { S, o, r, after } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const ADULTO: BankWhen = { minAge: 18, maxAge: 40 };

/** El míster te cita tras un escándalo: las tres respuestas y lo que cuestan (compartido por las dos variantes). */
const despacho = (id: string, variante: string, quien: string): BankScene =>
  S(id, "disciplina", { ...ADULTO, after: [after(variante, undefined, 1, 3)], notFlags: ["dc_despacho"] }, "entrenamiento",
    "El míster quiere hablar contigo",
    `Te espera en su despacho antes del entrenamiento, con ${quien} abierto sobre la mesa y la puerta cerrada. No grita: es peor. «Yo no te pago para que me salgas en las portadas. Te pago para que me ganes partidos». Habla despacio, como quien ya ha decidido y solo te da la oportunidad de elegir cómo lo cuentas.`,
    [
      o("a", "Aceptar la sanción sin discutir: multa y banquillo este fin de semana", "Dar la cara", { multa: 1, rel_entrenador: 3, moral: -2, flags: { coach_bench: "1", dc_despacho: true, estado_castigo: "@WEEK+2" } }, "Asientes y firmas el papel. El domingo ves el partido desde el banquillo, con el chándal puesto y la cabeza gacha. En el descanso, el capitán se sienta a tu lado y no dice nada: es su manera de decir que te perdona."),
      r("b", "Defender que tu vida privada es tuya", "Plantarte", 0.3,
        "Le sostienes la mirada y le hablas con respeto, sin levantar la voz. Se hace un silencio largo. «Tienes razón en una cosa: es tu vida. Y en otra tengo razón yo: es mi equipo». Cierra la carpeta. Se queda en un aviso, pero queda claro quién manda.", { multa: 1, rel_entrenador: 1, moral: 1, flags: { dc_despacho: true } },
        "No era el momento de ponerse digno. El míster te escucha en silencio, asiente y dicta sentencia: multa doble y fuera de la convocatoria tres partidos. En el vestuario nadie te mira cuando sales con la cabeza baja.", { multa: 2, rel_entrenador: -8, moral: -5, flags: { coach_bench: "3", dc_despacho: true, estado_castigo: "@WEEK+4" } }, "reputacion"),
      o("c", "Pedir perdón al grupo delante de todos", "Dar ejemplo", { multa: 1, rel_vestuario: 4, rel_entrenador: 4, moral: -1, flags: { coach_bench: "1", dc_despacho: true } }, "Lo haces antes del entrenamiento, de pie, sin excusas: «La he liado y os pido perdón». El portero rompe el silencio con un «ya era hora de que alguien más la liara aparte de mí». Se ríen. El míster sonríe por primera vez en una semana, aunque no te lo diga."),
    ]);

export const DISCIPLINA: BankScene[] = [
  // ───────── Paparazzi: la cena de madrugada ─────────
  S("dc-paparazzi", "disciplina", { ...ADULTO, fama: [30, 100], notFlags: ["pareja", "dc_paparazzi", "estado_escandalo", "estado_castigo"], clubTurns: [2, 400] }, "prensa",
    "Un fotógrafo te pilla cenando de madrugada con una chica",
    "Son las dos y diez de la madrugada de un martes y estás en un restaurante con la luz tenue, delante de una chica que ríe demasiado con tus bromas. En la acera de enfrente, un fotógrafo con un teleobjetivo de medio metro espera con la paciencia de un cazador. A las nueve de la mañana, tu cara en la portada digital de un diario: «CENA SECRETA DEL FUTBOLISTA». Y el entrenamiento es a las diez.",
    [
      o("a", "Dar la cara: «Era una cena con una amiga»", "Sin dramas", { fama: 3, rel_entrenador: -3, moral: -1, flags: { dc_paparazzi: "@WEEK", estado_escandalo: "@WEEK+3" } }, "Lo dices en zona mixta, con tono tranquilo y sin mirar a cámara. La grada lo olvida en dos días; el míster, no del todo: esa mañana te mira sin decir nada y, en el rondo, te pone de pareja con el que peor pasa."),
      r("b", "Negarlo todo y echarle la culpa al fotógrafo", "Todo o nada", 0.35,
        "Funciona de milagro: la chica resulta ser la hermana de un compañero y él mismo sale a desmentirlo en redes. El asunto se desinfla en una tarde. Aun así, esa semana duermes con un ojo abierto.", { moral: 2, flags: { dc_paparazzi: "@WEEK" } },
        "Mala idea: sale un segundo vídeo, esta vez con audio, que te desmiente a ti. La noticia ya no es la cena: es que has mentido. En el club se enteran por la tele.", { fama: 4, rel_entrenador: -9, rel_aficion: -5, rel_vestuario: -2, multa: 1, flags: { dc_paparazzi: "@WEEK", estado_escandalo: "@WEEK+5", coach_bench: "2" } }, "reputacion"),
      r("c", "Llamar a tu representante para que lo frene", "Que lo arregle él", 0.5,
        "Tu representante hace magia: un par de llamadas, un favor devuelto y la foto desaparece de las portadas antes del mediodía. Te cuesta unos euros y una conversación incómoda sobre horarios.", { patrimonio: -4000, rel_representante: 2, flags: { dc_paparazzi: "@WEEK" } },
        "El intento de silenciarlo se filtra y es peor que la foto: «El futbolista que quiso comprar el silencio». El club se entera y el míster lee la prensa con mucha más atención que de costumbre.", { fama: 2, rel_representante: -3, rel_entrenador: -4, flags: { dc_paparazzi: "@WEEK", estado_escandalo: "@WEEK+4" } }, "reputacion"),
    ]),
  despacho("dc-despacho-a", "dc-paparazzi", "el periódico del día"),

  S("dc-paparazzi-pareja", "disciplina", { ...ADULTO, fama: [30, 100], flags: ["pareja"], notFlags: ["dc_paparazzi", "estado_escandalo", "estado_castigo"], clubTurns: [2, 400] }, "prensa",
    "Un fotógrafo te pilla cenando de madrugada con otra chica",
    "Son las dos y diez de la madrugada y estás en un restaurante con una chica que no es {pareja}. Es una amiga, o eso piensas explicar. En la acera de enfrente, un fotógrafo con un teleobjetivo hace su trabajo. A las nueve de la mañana, tu cara en portada digital con un titular que no deja lugar a dudas, y tu teléfono con once llamadas perdidas de {pareja}.",
    [
      o("a", "Llamar a {pareja} y contárselo todo antes de que lo vea más gente", "Dar la cara", { moral: -4, rel_entrenador: -2, fama: 2, flags: { dc_paparazzi: "@WEEK", estado_escandalo: "@WEEK+3", dc_pareja_dolida: true } }, "Se lo cuentas a primera hora, con la voz rota. Silencio largo al otro lado. «Eso no es lo que me duele. Me duele enterarme por una portada». Cuelga con un «ya hablaremos» que pesa como una losa."),
      r("b", "Decir que es un montaje y esperar que cuele", "Negar", 0.3,
        "Cuela: la chica sale a decir que es una vieja amiga de la infancia y {pareja}, que quiere creerte, decide creerte. Esa noche cenáis en casa sin móviles y sin preguntas. Sabes que has tenido suerte.", { moral: 1, flags: { dc_paparazzi: "@WEEK" } },
        "No cuela: un segundo vídeo os muestra saliendo juntos del restaurante. {pareja} lo ve en directo, en el móvil de una amiga, delante de todos. La llamada que recibes después dura cuatro segundos.", { fama: 3, moral: -7, rel_entrenador: -5, rel_aficion: -3, flags: { dc_paparazzi: "@WEEK", estado_escandalo: "@WEEK+5", dc_pareja_dolida: true } }, "reputacion"),
      o("c", "Presentarte en su casa con flores y una explicación bien preparada", "Ir a por ella", { moral: -2, patrimonio: -150, flags: { dc_paparazzi: "@WEEK", estado_escandalo: "@WEEK+2", dc_pareja_dolida: true } }, "Te abre la puerta con los brazos cruzados y no te deja pasar del recibidor. Escucha la explicación entera, sin interrumpir. Cuando acabas, coge las flores y dice: «Esto no arregla nada, pero se agradece». Es lo más amable que te dirá en una semana."),
    ]),
  despacho("dc-despacho-b", "dc-paparazzi-pareja", "el móvil con la portada"),
  S("dc-pareja-explicaciones", "disciplina", { ...ADULTO, flags: ["pareja", "dc_pareja_dolida"], after: [after("dc-paparazzi-pareja", undefined, 2, 8)], notFlags: ["dc_pareja_resuelta"] }, "vida",
    "{pareja} te pide que hablemos en serio",
    "Te cita en el parque donde os conocisteis, sin mensajes previos y con una frase corta: «Necesito mirarte a la cara». Llega puntual, con el abrigo abrochado hasta el cuello. No hay lágrimas, y eso es lo que más te asusta. «No sé si es la foto o si es que no me fío de lo que hay detrás de la foto».",
    [
      r("a", "Prometerle que no volverá a pasar y demostrarlo con hechos", "Reconstruir la confianza", 0.55,
        "Se queda callada un minuto largo y luego te coge la mano. «Voy a creerte. Una vez». Las siguientes semanas, tus horarios son de monje: casa, entrenamiento, cena, sofá. A ella le hace gracia la disciplina nueva, y a ti, un poco de miedo.", { moral: 5, flags: { dc_pareja_resuelta: true, dc_pareja_dolida: "" } },
        "Quiere creerte, pero no puede. «Te lo dije: me duele no fiarme». Pasa un mes de silencios y conversaciones a medias, y al final, un domingo cualquiera, os sentáis y os decís que ya no. Os abrazáis sin rencor, con la tristeza limpia de las cosas que no han salido bien.", { moral: -8, flags: { pareja: "", dc_pareja_resuelta: true, dc_pareja_dolida: "", estado_preocupado: "@WEEK+4" } }, "moral"),
      o("b", "Reconocer que no estás en el momento de una relación y dejarlo", "Cortar", { moral: -6, flags: { pareja: "", dc_pareja_resuelta: true, dc_pareja_dolida: "", estado_preocupado: "@WEEK+3" } }, "Se lo dices con la verdad por delante y, aun así, te sale peor de lo que habías ensayado. Ella asiente muy despacio. «Gracias por no mentirme otra vez». Camina hacia la salida del parque sin girarse, y tú te quedas en el banco mirando los patos como si fueran el único plan posible."),
    ]),

  // ───────── Llegar tarde a los entrenamientos (y que se acumule) ─────────
  S("dc-tarde-entreno", "disciplina", { ...ADULTO, roles: ["titular", "rotacion", "suplente"], notFlags: ["estado_castigo"], clubTurns: [2, 400] }, "entrenamiento",
    "Llegas tarde al entrenamiento",
    "El despertador sonó, lo apagaste, y la siguiente vez que abres un ojo son las diez y veinte. El entrenamiento era a las diez. Entras en el vestuario con el pelo de recién levantado y la camiseta del revés. En el pasillo, el utillero te mira con la ceja arqueada: «Ya están en el campo. Y el míster ha preguntado por ti dos veces».",
    [
      o("a", "Pedir perdón al míster y asumir la multa", "Cara a cara", { multa: 0.5, rel_entrenador: -2, moral: -1, flags: { dc_tardes: "@+1" } }, "Sales al campo, te colocas delante de él y dices solo: «Llego tarde y no tengo excusa». Te mira un segundo largo. «La multa te la pone el club. La tarde, te la pongo yo: harás de portero en el rondo». Pasas la mañana comiéndote balonazos, y nadie en el grupo te lo echa en cara."),
      r("b", "Inventar una excusa: un atasco, el despertador, tu abuela", "Probar suerte", 0.4,
        "Lo del atasco cuela: el míster también ha tardado media hora en llegar y le comprende. Entrenas con una sonrisa de culpable y la promesa íntima de poner dos alarmas.", { moral: 1, flags: { dc_tardes: "@+1" } },
        "Lo del atasco no cuela: tu compañero de piso confirma por el vestuario que te vio dormido a las diez menos cuarto. El míster no dice nada hasta el final del entrenamiento, cuando te pide un minuto: «Tolero muchas cosas. Que me mientan, no».", { multa: 1, rel_entrenador: -7, moral: -3, flags: { coach_bench: "1", dc_tardes: "@+1" } }, "reputacion"),
      o("c", "Entrar corriendo y entrenar el doble para compensar", "Con hechos", { forma: -2, rel_entrenador: 1, moral: 1, flags: { dc_tardes: "@+1" } }, "Te cambias en cuarenta segundos y sales al campo a una velocidad que no tenías ni el día del debut. Haces la sesión entera sin parar. El míster no dice nada, pero cuando acabas te tiende una botella de agua con el gesto de quien aprecia el esfuerzo sin comprometerse."),
    ]),
  S("dc-tarde-segunda", "disciplina", { ...ADULTO, flags: ["dc_tardes"], after: [after("dc-tarde-entreno", undefined, 3, 20)], notFlags: ["estado_castigo"] }, "entrenamiento",
    "Otra vez tarde, y esta vez con testigos",
    "Segunda vez en pocas semanas. Esta vez no es el despertador: es que has salido de una cena que se alargó y has dormido tres horas. Llegas al campo con diez minutos de retraso y el míster está de pie junto a la puerta, con el reloj en la mano. «Lo mío con los horarios no es una sugerencia».",
    [
      o("a", "Aceptar el castigo sin una palabra", "Humildad", { multa: 1, rel_entrenador: -3, moral: -2, flags: { coach_bench: "1", dc_tardes: "@+1", estado_castigo: "@WEEK+2" } }, "Te sientas en el banquillo ese fin de semana, con el chándal del club y una taza de té que ni te apetece. Desde allí ves cómo tu suplente aprovecha el hueco con un gol de cabeza que celebra mirándote."),
      r("b", "Pedirle al capitán que intervenga por ti", "Una mano amiga", 0.5,
        "El capitán habla con el míster en privado. Salen del despacho con la misma cara de siempre. «Os conozco a los jóvenes, pero a mí no me pase una más», te dice después. Es un aviso, no una sentencia, y respiras.", { multa: 0.5, rel_vestuario: 3, rel_entrenador: -1, flags: { dc_tardes: "@+1" } },
        "El capitán lo intenta y le sale el tiro por la culata: el míster interpreta que te escondes detrás del grupo. Esa tarde, en el rondo, te pone de portero y no te ceba ni un balón. Todos lo ven.", { multa: 1, rel_entrenador: -6, rel_vestuario: -2, flags: { coach_bench: "2", dc_tardes: "@+1", estado_castigo: "@WEEK+3" } }, "reputacion"),
    ]),
  S("dc-tarde-tercera", "disciplina", { ...ADULTO, flags: ["dc_tardes"], after: [after("dc-tarde-segunda", undefined, 3, 20)], notFlags: ["dc_expediente"] }, "entrenamiento",
    "El míster pierde la paciencia",
    "A la tercera, el míster ya no te llama a su despacho: te lo dice delante del grupo. «Hay jugadores que tienen talento y hay jugadores que tienen talento y horarios. De los primeros me sobran». Se hace un silencio de colegio. Nadie respira. Luego señala la puerta del campo: «Hoy entrenas con el filial».",
    [
      o("a", "Ir al filial y trabajar como si no pasara nada", "Tragar y trabajar", { rel_entrenador: -5, moral: -4, forma: 2, flags: { coach_bench: "3", dc_expediente: true, estado_castigo: "@WEEK+4" } }, "Pasas tres días entrenando con chavales de dieciocho años que te miran como a un fantasma. El segundo día, un juvenil te pregunta qué hay que hacer para llegar al primer equipo. «Llegar a tiempo», contestas. Se ríe. Tú, no tanto."),
      o("b", "Plantarte: «Así no voy a seguir»", "Orgullo", { rel_entrenador: -12, moral: -6, multa: 3, fama: 2, flags: { coach_bench: "5", dc_expediente: true, estado_castigo: "@WEEK+6", quiere_salir: true } }, "Lo dices más alto de lo que querías. El míster te mira como quien ya sabía lo que ibas a decir. El club te abre expediente, te multa y te baja de la convocatoria. Esa noche, tu representante te llama con una voz que no es la de siempre: «Tenemos que hablar de qué quieres hacer»."),
    ]),

  // ───────── La víspera de un partido ─────────
  S("dc-discoteca", "disciplina", { ...ADULTO, fama: [30, 100], notFlags: ["dc_discoteca", "estado_castigo", "estado_bache"], clubTurns: [2, 400], roles: ["titular", "rotacion"] }, "vida",
    "Te ven en una discoteca la víspera de un partido",
    "Es viernes, el partido es el sábado a las nueve y estás en una discoteca del centro con tres amigos y un vaso en la mano que dice «sin alcohol» pero que alguien ha cambiado. Hay móviles por todas partes. Te das cuenta de que alguien lleva diez minutos grabándote con la cara de quien acaba de ganar la lotería.",
    [
      o("a", "Irte ahora mismo, antes de que acabe el vídeo", "Cortar a tiempo", { moral: -1, forma: -1, flags: { dc_discoteca: true } }, "Dices que mañana madrugas y te marchas con una excusa que nadie cree. Alguien sube un vídeo corto: apareces en el fondo, de espaldas, con la capucha puesta. Nada del otro mundo. Mañana juegas con un poco de sueño, pero con la conciencia limpia."),
      o("b", "Quedarte hasta que cierren: una noche es una noche", "Disfrutar", { forma: -8, moral: 4, fama: 3, rel_entrenador: -4, flags: { dc_discoteca: true, estado_bache: "@WEEK+2" } }, "Duermes tres horas, llegas justo al desayuno de concentración y el míster te mira la cara sin decir nada. En el partido corres como si llevaras plomo en las botas. En el descanso, el capitán te dice al oído: «Esto lo sabemos todos»."),
      r("c", "Pedirle a un amigo que borre los vídeos y marcharte", "Tapar el rastro", 0.45,
        "Tu amigo, que es de fiar, convence a los chavales de que borren los vídeos con una ronda de copas pagada. Para el desayuno, no queda ni rastro en internet. Tu amigo, eso sí, te pasa la cuenta de la ronda.", { patrimonio: -500, flags: { dc_discoteca: true } },
        "Se te va de las manos: lo que intentabas tapar acaba en un canal de cotilleos con título propio. Esa mañana, el fotógrafo del club te pregunta, por lo bajo, si estás bien.", { fama: 3, rel_entrenador: -5, moral: -3, flags: { dc_discoteca: true, estado_escandalo: "@WEEK+3" } }, "reputacion"),
    ]),
  S("dc-mister-bronca", "disciplina", { ...ADULTO, after: [after("dc-discoteca", "b", 1, 2)], notFlags: ["dc_bronca"] }, "entrenamiento",
    "La bronca del míster tras el partido",
    "Después del partido, con el vestuario ya casi vacío, el míster te señala una silla. No levanta la voz. «Hoy has corrido la mitad que el resto. Y lo sé por qué. Aquí hay muchos chavales que se matan por una oportunidad como la tuya. No me hagas pensar que la desprecias».",
    [
      o("a", "Asumirlo y prometer que no se repite", "Dar la cara", { rel_entrenador: 2, moral: -2, multa: 0.5, flags: { dc_bronca: true } }, "Le miras a los ojos y dices la frase que sabes que quiere oír, y la dices en serio. Asiente despacio. «Eso espero». En el campo de entrenamiento, el lunes, vuelves a ser el primero en llegar."),
      o("b", "Contestarle que fuera del campo haces lo que quieres", "Desafiar", { rel_entrenador: -9, moral: -3, multa: 2, flags: { coach_bench: "2", dc_bronca: true, estado_castigo: "@WEEK+3" } }, "Se lo dices con menos tacto del que sentías. El míster se levanta, recoge la tablet y suelta: «Pues fuera del campo vas a estar tú los próximos dos partidos». Y se va, sin cerrar la puerta, que es lo que más te escuece."),
    ]),

  // ───────── Redes: un tuit antiguo sale a la luz ─────────
  S("dc-redes-polemica", "disciplina", { ...ADULTO, fama: [35, 100], notFlags: ["dc_tuit", "estado_escandalo"], clubTurns: [2, 400] }, "prensa",
    "Un tuit antiguo tuyo sale a la luz",
    "Alguien ha desenterrado un tuit tuyo de cuando tenías catorce años. Un chiste tonto sobre un rival que entonces te pareció muy gracioso y que hoy, con tu cara y tu fama detrás, suena a lo que nunca quisiste decir. Lo han compartido cuatro mil veces en una hora. Tu club ha puesto un comunicado seco: «Estamos al tanto».",
    [
      o("a", "Pedir perdón en público, con nombre y apellidos", "Asumirlo", { fama: 1, rel_aficion: 2, moral: -2, flags: { dc_tuit: true, estado_escandalo: "@WEEK+2" } }, "Subes un mensaje largo, sin hashtags, sin excusas. Alguien lo comparte con un «a esto se le llama crecer». Un periodista de fútbol que no te caía bien escribe un artículo sorprendentemente amable. El rival, por cierto, te responde con un «tranquilo, éramos críos»."),
      r("b", "Borrar el tuit y no decir nada", "Silencio", 0.4,
        "Funciona: sin combustible, el asunto se enfría en un día. Pero te quedas con la sensación incómoda de que algo ha quedado a medias.", { flags: { dc_tuit: true } },
        "No funciona: la captura circula con la etiqueta «lo borró». Ahora la historia es que lo escondiste. Tu patrocinador te llama con la voz educada de quien pone una distancia de seguridad.", { fama: 2, rel_aficion: -4, reputacion: -3, moral: -3, flags: { dc_tuit: true, estado_escandalo: "@WEEK+4" } }, "reputacion"),
      o("c", "Defenderte: «Tenía catorce años»", "Dar la cara a tu manera", { rel_aficion: -1, fama: 2, moral: -1, flags: { dc_tuit: true, estado_escandalo: "@WEEK+3" } }, "Es verdad, y media gente lo entiende. La otra media no. Durante tres días tu nombre es tendencia con dos bandos y varios memes, de los cuales uno es muy bueno."),
    ]),

  // ───────── Reincidir: el expediente ─────────
  S("dc-expediente", "disciplina", { ...ADULTO, flags: ["dc_despacho", "dc_tardes"], notFlags: ["dc_expediente"], roles: ["titular", "rotacion", "suplente"] }, "representante",
    "El club te abre un expediente disciplinario",
    "Una carta con membrete del club llega a tu casa con acuse de recibo. Tres amonestaciones por conducta, un resumen de todos los episodios y la mención a «conducta reiterada». Tu representante la lee en voz alta, despacio. «Esto es serio. Pueden sancionarte con varios partidos, y si lo pasan al presidente, hablar de rescisión».",
    [
      o("a", "Reunirte con el club y pedir una última oportunidad", "Apelar", { multa: 2, rel_entrenador: -3, moral: -3, flags: { coach_bench: "2", dc_expediente: true, estado_castigo: "@WEEK+5" } }, "El presidente te recibe con las manos cruzadas. «Te quiero ayudar. Pero tienes que ayudarte a ti». Sales con una sanción, una advertencia por escrito y la sensación de haber estado muy cerca del borde."),
      o("b", "Dejar que tu representante busque una salida del club", "Cambio de aires", { rel_entrenador: -6, moral: -2, rel_representante: 2, flags: { dc_expediente: true, quiere_salir: true, estado_castigo: "@WEEK+4" } }, "Tu representante lo toma con una calma profesional. «Hay clubes a los que les gustan los jugadores con carácter. Voy a hacer unas llamadas». Esa noche duermes mal pero con la sensación rara de haber dejado de fingir."),
    ]),
];
