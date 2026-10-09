/**
 * Complicaciones y rachas buenas con efecto real: un bache de forma, la cabeza en casa, un vestuario enfrentado... y,
 * al otro lado, una racha, un mentor, un físico a tope, la confianza del míster. Cada una deja un estado temporal
 * (states.ts) que suma o resta cada turno y empuja las jugadas decisivas, y lo que haces para afrontarlo lo acorta o
 * lo alarga.
 */
import { S, o, r } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const JUEGA: BankWhen = { minAge: 17, roles: ["titular", "rotacion"] };
const SIN_ESTADO = ["estado_bache", "estado_preocupado", "estado_mal_ambiente", "estado_castigo", "estado_escandalo"];

export const ESTADOS: BankScene[] = [
  // ───────────────────────── Complicaciones ─────────────────────────
  S("es-bache", "estados", { ...JUEGA, notFlags: [...SIN_ESTADO, "estado_racha"], clubTurns: [3, 400] }, "partido",
    "Tres partidos sin acertar",
    "Hay rachas en el fútbol que no se explican: remates que se van un palmo, controles que se te escapan, un pase fácil que sale al lateral. Llevas tres partidos así, y lo peor no es el rendimiento, es el ruido: un tertuliano ha dicho que «se te ha acabado la gasolina» y tu cabeza no deja de repetirlo mientras calientas.",
    [
      r("a", "Quedarte cada tarde a tirar a puerta, con paciencia", "Trabajo extra", 0.6,
        "Dos semanas de tarde extra, cien tiros por sesión, un preparador con la libreta y un cono a cada lado de la portería. El tercer día, un remate te sale limpio. El cuarto, otro. Vuelves a notar el balón como una cosa amiga.", { forma: 3, moral: 3, rel_entrenador: 2 },
        "Te dejas la piel y el balón no responde: cuanto más lo intentas, más rígido te quedas. El míster te ve y te hace parar: «Ya está bien por hoy. Descansa la cabeza». Tienes razón en una cosa: la cabeza es lo que más pesa.", { forma: -2, moral: -2, flags: { estado_bache: "@WEEK+3" } }, "forma"),
      r("b", "Hablar con el psicólogo del club", "Buscar ayuda", 0.65,
        "No es lo que esperabas: no hay diván ni preguntas sobre tu infancia. Hay una libreta, una respiración de cuatro segundos y una pregunta muy simple: «¿Qué te dice la voz que te grita?». Escribirlo hace que ya no grite tanto. Sales más ligero.", { moral: 4, forma: 1 },
        "La conversación es útil, pero tarda en dar fruto. Esa semana sigues peleado con el balón y, por si fuera poco, un periodista se entera de que has visitado al psicólogo y lo convierte en titular.", { moral: -1, fama: 1, flags: { estado_bache: "@WEEK+3" } }, "moral"),
      o("c", "Ignorarlo y esperar a que pase", "Dejar que pase solo", { moral: -2, forma: -2, flags: { estado_bache: "@WEEK+4" } }, "Pasa un partido, pasa otro, pasa un tercero. La racha, lejos de irse sola, se instala. Los compañeros empiezan a pasarte el balón con un ojo puesto en ti, el míster apunta cosas en la libreta y tú te das cuenta de que ignorarlo era la manera más cara de arreglarlo."),
    ]),
  S("es-preocupado", "estados", { minAge: 17, notFlags: [...SIN_ESTADO, "es_susto_casa"], clubTurns: [2, 400] }, "vida",
    "Un susto de salud en casa",
    "Tu madre te llama un martes por la noche con esa voz tranquila de las malas noticias: tu padre ha tenido un mareo, lo están viendo los médicos, «no es nada, hijo, pero ya sabes cómo es». Se te cae el móvil del susto. Mañana hay entrenamiento y, dentro de tres días, partido. Estás a quinientos kilómetros y con un nudo en el estómago que no se deshace.",
    [
      o("a", "Pedir permiso al míster y coger el primer vuelo", "Estar con los tuyos", { rel_entrenador: -2, moral: 5, flags: { es_susto_casa: true, estado_preocupado: "@WEEK+1" } }, "El míster no lo duda ni un segundo: «Vete. Aquí no hay nada más importante». Pasas dos días en la sala de espera del hospital con tu madre y un café de máquina. Tu padre sale con un susto, unas pruebas y un chiste malo. Vuelves con la cabeza ligera."),
      o("b", "Quedarte a entrenar y estar pendiente del teléfono", "Aguantar", { moral: -3, forma: -1, flags: { es_susto_casa: true, estado_preocupado: "@WEEK+4" } }, "Haces la sesión como un autómata. Cada vez que vibra el móvil en la taquilla, se te para el corazón. Tu padre está bien, pero tú no: la semana entera te pasas mirando el reloj, y en el partido no estás en ninguna parte."),
      r("c", "Hablar con el capitán y pedir que te cubra un día", "Pedir ayuda al grupo", 0.55,
        "El capitán te mira como si hubieras dicho una tontería: «¿Cubrirte? Te llevo yo al aeropuerto». En diez minutos tienes billete, maleta hecha y mensajes de todo el vestuario. El vestuario, en las malas, es una familia.", { moral: 4, rel_vestuario: 5, flags: { es_susto_casa: true } },
        "El capitán lo intenta pero el club no autoriza el viaje. Te quedas, con el teléfono pegado a la mano, esperando noticias que no llegan hasta la noche. Todo sale bien, pero esa tarde has jugado con el cuerpo en el campo y la cabeza en otra parte.", { moral: -2, rel_vestuario: 2, flags: { es_susto_casa: true, estado_preocupado: "@WEEK+3" } }, "reputacion"),
    ]),
  S("es-mal-ambiente", "estados", { ...JUEGA, notFlags: [...SIN_ESTADO], clubTurns: [4, 400], rel: { vestuario: [0, 75] } }, "vestuario",
    "Dos compañeros se enfrentan y te piden bando",
    "Todo empieza con una frase en el rondo («qué poco corres») y termina con dos compañeros agarrados por la camiseta, el utillero separándoles y todo el vestuario mirándote, porque tú eres el único al que los dos escuchan. «Tú qué dices», pregunta uno. «Tú qué piensas», pregunta el otro. En el campo, las cosas se han vuelto raras: nadie se pasa el balón sin mirar antes quién lo recibe.",
    [
      r("a", "Hablar con los dos en privado y obligarles a hacer las paces", "Mediar", 0.55,
        "Les sientas en una esquina del vestuario, con un café cada uno y una regla muy simple: uno habla, el otro escucha, y luego al revés. Salen del vestuario riéndose del motivo de la pelea. El grupo recupera el aire.", { rel_vestuario: 6, moral: 3 },
        "Lo intentas con la mejor voluntad, pero uno de los dos se siente traicionado por la mediación y te lo dice a la cara. Ahora hay tres personas enfadadas en lugar de dos.", { rel_vestuario: -4, moral: -2, flags: { estado_mal_ambiente: "@WEEK+4" } }, "reputacion"),
      o("b", "Mantenerte al margen: no es tu pelea", "Distancia", { rel_vestuario: -1, moral: -1, flags: { estado_mal_ambiente: "@WEEK+3" } }, "Te encoges de hombros y te vas a la ducha. La pelea queda sin resolver y el ambiente, espeso. Durante tres semanas, el vestuario se divide en dos grupos que apenas se saludan, y tú, que estabas en medio, no estás con ninguno."),
      o("c", "Tomar partido por el que lleva razón, aunque sea el menos popular", "Ser justo", { rel_vestuario: -2, reputacion: 4, moral: 2, flags: { estado_mal_ambiente: "@WEEK+2" } }, "Dices lo que piensas, sin adornos. El que tenía razón te lo agradece con una mirada. El otro, no tanto. Al día siguiente, en el rondo, el balón te llega con un poco menos de ganas, pero más de respeto."),
    ]),

  // ───────────────────────── Cosas buenas ─────────────────────────
  S("es-racha", "estados", { ...JUEGA, moral: [65, 100], forma: [70, 100], notFlags: [...SIN_ESTADO, "estado_racha"], clubTurns: [3, 400] }, "partido",
    "Entras en racha: todo te sale",
    "No sabes explicarlo: en los últimos partidos, el balón te busca. Controlas sin mirar, el pase sale con el peso exacto, el remate encuentra el rincón. Un compañero lo resume en el vestuario con cariño: «Estás en la zona». En la zona se está tan a gusto que da miedo mover una sola pieza, por si se rompe el hechizo.",
    [
      o("a", "Mantener las rutinas exactas, hasta los calcetines", "Supersticioso", { moral: 3, forma: 1, flags: { estado_racha: "@WEEK+4" } }, "Calcetín derecho primero, la misma canción en los auriculares, el mismo bocadillo antes del partido. Es una tontería, pero funciona. Los compañeros empiezan a imitarte sin decírtelo, y tú finges no darte cuenta."),
      o("b", "Disfrutarlo sin pensar demasiado: ya llegará el día malo", "Fluir", { moral: 4, fama: 2, flags: { estado_racha: "@WEEK+3" } }, "Juegas como en el patio del colegio: sin cálculo, sin miedo, riéndote cuando te sale algo que no pensabas. Los aficionados lo notan: hay una pancarta nueva con tu nombre, y un niño con tu camiseta en el pecho."),
      o("c", "Aprovecharlo para pedirle al míster más responsabilidad", "Dar un paso", { rel_entrenador: 3, reputacion: 2, flags: { estado_racha: "@WEEK+4", estado_confianza: "@WEEK+3" } }, "Después del entrenamiento le dices que estás listo para más: balones parados, la banda contraria, lo que haga falta. Te mira de arriba abajo. «Si lo pides con esos ojos…». El sábado, el brazalete de capitán no es para ti, pero te toca lanzar la falta."),
    ]),
  S("es-mentor", "estados", { minAge: 17, maxAge: 23, roles: ["titular", "rotacion", "suplente"], notFlags: ["estado_mentor", "es_mentor", "estado_castigo"], clubTurns: [3, 400] }, "vestuario",
    "Un veterano te toma bajo su ala",
    "Lleva doce años en el club, tiene las rodillas de un abuelo y una libreta donde apunta todo lo que le han enseñado y todo lo que aprendió solo. Un día, al acabar el entrenamiento, te dice sin mirarte: «Tú pierdes el balón siempre en el mismo sitio. ¿Te lo enseño?». No te pide nada a cambio, salvo que te quedes media hora más.",
    [
      o("a", "Aceptar y quedarte todas las tardes", "Aprender", { moral: 2, forma: -1, media: 1, flags: { es_mentor: true, estado_mentor: "@WEEK+8" } }, "Cada tarde, media hora de conos, giros, perfiles y charlas sobre cosas que no se ven en la tele: dónde mirar antes de recibir, cómo hablar con un árbitro, qué decir cuando te sustituyen. En dos meses, tus compañeros te preguntan qué has cambiado. Tú no sabes explicarlo."),
      o("b", "Aceptar, pero solo una o dos veces por semana", "Con calma", { moral: 1, flags: { es_mentor: true, estado_mentor: "@WEEK+5" } }, "Vais poco a poco, sin agobios, entre la sesión y la cena. El veterano no se queja; sabe que la paciencia también es una lección. De vez en cuando te suelta un consejo que te acuerdas años después."),
      o("c", "Decir que prefieres arreglártelas solo", "Orgullo", { rel_vestuario: -2, moral: -1, flags: { es_mentor: true } }, "El veterano asiente con una media sonrisa: «Como quieras, chaval». No se enfada; lleva demasiados años en esto. Pero esa noche, al volver a casa, tienes la sensación incómoda de haber dejado pasar algo que no volverá."),
    ]),
  S("es-fisico", "estados", { minAge: 17, notFlags: ["estado_fisico", "es_fisico", ...SIN_ESTADO], clubTurns: [3, 400] }, "entrenamiento",
    "El preparador físico te cambia la rutina",
    "El preparador te enseña un papel con tres columnas: lo que comes, lo que duermes y lo que entrenas. En la primera hay más verde del que te gusta. En la segunda, un número que te parece una broma: ocho horas. En la tercera, un cronograma que da miedo. «Dame seis semanas y te devuelvo un físico que no sabías que tenías».",
    [
      o("a", "Seguirlo a rajatabla", "Disciplina total", { forma: 4, moral: 1, flags: { es_fisico: true, estado_fisico: "@WEEK+6" } }, "Durante seis semanas, tu vida es un horario: cena a las nueve, cama a las diez y media, el móvil lejos de la almohada. Al cuarto sábado te sorprendes llegando a un balón que antes dabas por perdido. Al sexto, el míster te dice que ya no te reconoce, y es un cumplido."),
      o("b", "Seguirlo a medias, con alguna cena libre", "Equilibrio", { forma: 2, flags: { es_fisico: true, estado_fisico: "@WEEK+3" } }, "Haces lo que puedes, con alguna cena de más y alguna noche tarde. No es el plan perfecto, pero es mejor que ninguno: el preparador asiente con la sonrisa de quien sabe que es un buen punto de partida."),
      o("c", "Pasar: ya tienes tu manera de hacerlo", "Ir a tu aire", { moral: -1, rel_entrenador: -1, flags: { es_fisico: true } }, "Doblas el papel, lo guardas en el bolsillo y te olvidas de él. El preparador no insiste. Tres semanas después, vuelve a mirarte las piernas en un sprint y toma una nota en su libreta. Tú no la ves, pero se te nota en la cara cuando te cruzas con él."),
    ]),
  S("es-confianza", "estados", { ...JUEGA, rel: { entrenador: [65, 100] }, notFlags: [...SIN_ESTADO, "estado_confianza", "es_confianza"], clubTurns: [4, 400] }, "entrenamiento",
    "El míster te dice que cuenta contigo",
    "Al acabar el entrenamiento, el míster te pide un minuto y no te cita en el despacho: te habla de pie, junto a la línea de banda, mirando al campo. «No lo voy a repetir. Tú juegas. Aunque falles, aunque salga mal una semana. Quiero que lo sepas para que juegues sin miedo». Se va sin esperar respuesta, como quien ya ha dicho lo importante.",
    [
      o("a", "Darle las gracias y devolver la confianza en el campo", "Responder jugando", { rel_entrenador: 3, moral: 4, flags: { es_confianza: true, estado_confianza: "@WEEK+6" } }, "No dices nada, solo asientes. El sábado juegas como si te hubieran quitado un peso de encima: sin mirar de reojo al banquillo, sin temer el error. Cuando fallas un control, te sacudes el polvo y vas a por el siguiente."),
      o("b", "Aprovechar para pedirle más minutos en las jugadas importantes", "Pedir más", { rel_entrenador: 1, reputacion: 2, moral: 2, flags: { es_confianza: true, estado_confianza: "@WEEK+4" } }, "Le dices que estás listo para balones parados y para las jugadas decisivas. Te mira con una media sonrisa. «Cuidado con lo que pides». El sábado te toca el primer penalti de tu carrera con ese equipo."),
    ]),
];
