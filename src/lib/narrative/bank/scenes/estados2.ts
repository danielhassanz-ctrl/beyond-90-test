/**
 * Más complicaciones y más cosas buenas, para que la carrera esté llena de altibajos con efecto (ver estados.ts):
 * competencia en tu puesto, cansancio, críticas, contrato a punto de acabar, y del otro lado premios, gestos de la grada,
 * un sistema que te favorece, un patrocinador que cuida de tu físico o tu pareja que te prepara la final.
 */
import { S, o, r } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const JUEGA: BankWhen = { minAge: 17, roles: ["titular", "rotacion"] };
const LIBRE = ["estado_bache", "estado_preocupado", "estado_mal_ambiente", "estado_castigo", "estado_escandalo"];

export const ESTADOS2: BankScene[] = [
  // ───────── Malas ─────────
  S("es-competencia", "estados", { ...JUEGA, clubLevels: ["grande", "europeo"], notFlags: [...LIBRE, "es_competencia"], clubTurns: [4, 400] }, "vestuario",
    "Fichan a otro jugador para tu puesto",
    "El club presenta con bombo a un delantero de veintitrés años por una cifra que te hace cerrar la boca. Lo hacen posar con la camiseta delante de las cámaras y, por un momento, el fotógrafo te mira a ti en segundo plano y piensa lo mismo que tú: ese es tu sitio. El míster, al pasar a tu lado, te dice con el tono de siempre: «Ya hablaremos».",
    [
      o("a", "Tomártelo como un reto y entrenar como nunca", "Competir", { forma: 2, moral: -1, rel_entrenador: 2, flags: { es_competencia: true } }, "Los primeros días es raro: él cae simpático, y tú intentas que no se te note la rabia. Los siguientes, os picáis en cada ejercicio, y el míster, desde la banda, anota nombres sin comentar nada. Los dos mejoráis."),
      r("b", "Hablar con el míster para saber dónde estás", "Ir de frente", 0.55,
        "«Eres titular, y él es una opción. Las dos cosas pueden ser verdad a la vez». No es lo que querías oír, pero es la verdad dicha a la cara. Sales con el pecho más ancho.", { rel_entrenador: 3, moral: 2, flags: { es_competencia: true, estado_confianza: "@WEEK+3" } },
        "El míster responde con una frase hecha y una palmada. Sales sin saber nada más que antes, y el silencio de las siguientes semanas se te va metiendo dentro.", { moral: -3, flags: { es_competencia: true, estado_preocupado: "@WEEK+3" } }, "reputacion"),
      o("c", "Decirle a tu representante que busque otras opciones", "Mirar fuera", { rel_representante: 2, moral: -2, rel_entrenador: -2, flags: { es_competencia: true, quiere_salir: true, estado_preocupado: "@WEEK+2" } }, "Tu representante te mira con una sonrisa de tiburón: «Eso quería oír». Esa semana recibes tres llamadas de clubes que antes no preguntaban."),
    ]),
  S("es-cansancio", "estados", { ...JUEGA, notFlags: [...LIBRE, "estado_fisico"], clubLevels: ["grande", "europeo"], clubTurns: [4, 400] }, "entrenamiento",
    "Semana de tres partidos y dos aviones",
    "Jueves en un avión, domingo en un autobús, miércoles en otro avión. El calendario se ha comido tu sueño y tus tardes. El fisio te mira las piernas como quien mira un coche que lleva demasiados kilómetros. «Tienes la carga de un camionero. Esta semana o paras tú, o te paro yo».",
    [
      o("a", "Pedir descanso y perderte un partido sin importancia", "Descansar", { forma: 5, rel_entrenador: -1, moral: -1 }, "Tu sitio lo ocupa un compañero con un hambre de lobo. Ves el partido desde el sofá con las piernas en alto y un té. Al día siguiente te levantas sin sentir plomo en los muslos por primera vez en un mes."),
      o("b", "Aguantar y jugar los tres: hay que estar", "Apretar los dientes", { forma: -5, moral: 2, rel_entrenador: 2, flags: { estado_bache: "@WEEK+3" } }, "Juegas los tres. En el tercero, tus piernas son de cemento y tu cabeza de algodón. Los compañeros te piden el balón y tú, por primera vez en tu vida, dudas antes de dárselo."),
      r("c", "Pactar con el fisio un plan de recuperación a la medida", "Gestionarlo bien", 0.65,
        "Dos baños de contraste al día, masajes, una cena a las ocho y una siesta de veinte minutos. Es aburrido, pero funciona: el partido del domingo lo juegas con un aire que no te conocías.", { forma: 3, moral: 2, rel_entrenador: 1 },
        "El plan es bueno, pero la agenda no perdona. Llegas al partido a medio gas, y la prensa lo nota antes que tú.", { forma: -2, moral: -1, flags: { estado_bache: "@WEEK+2" } }, "forma"),
    ]),
  S("es-critica-prensa", "estados", { ...JUEGA, fama: [30, 100], notFlags: [...LIBRE, "es_critica"], clubTurns: [3, 400] }, "prensa",
    "Un titular cruel tras un fallo clamoroso",
    "Fallas un penalti a un minuto del final, en casa, delante de una grada que prefiere gritar a rezar. En la portada del día siguiente, tu foto con las manos en la cabeza y una palabra de cuatro letras que, ya, no se te quita de las orejas: «FALLO». Los comentarios en redes son del tipo que no se repiten ni entre amigos.",
    [
      o("a", "Dar la cara en zona mixta: «He fallado yo, nadie más»", "Asumirlo", { rel_aficion: 4, rel_vestuario: 3, moral: -2, flags: { es_critica: true } }, "Lo dices con la voz serena y sin excusas. Esa tarde, un veterano de la grada, de los que silban con ganas, escribe en un foro: «Hoy este chaval ha ganado mi respeto». A ti, ese mensaje te sirve de ancla."),
      o("b", "Desconectar de las redes una semana", "Protegerte", { moral: 2, forma: 1, flags: { es_critica: true } }, "Borras las aplicaciones, apagas las notificaciones y le pides a tu representante que filtre. La semana pasa más rápido de lo esperado. Vuelves con una frase nueva en la cabeza: lo importante no se publica."),
      o("c", "Responder con ironía a los que más te han insultado", "Devolver el golpe", { fama: 3, rel_aficion: -3, moral: -1, flags: { es_critica: true, estado_escandalo: "@WEEK+2" } }, "Una respuesta ocurrente que se hace viral durante veinticuatro horas. Algunos te aplauden; otros, que son más, te lo reprochan. El club te pide por favor que no vuelvas a publicar sin consultarlo."),
    ]),
  S("es-ultimo-ano", "estados", { ...JUEGA, notFlags: [...LIBRE, "es_ultimo_ano"], clubTurns: [10, 400], minAge: 21 }, "representante",
    "Te queda un año de contrato",
    "Tu representante lo dice como quien comenta el tiempo: «Te queda un año». No es una amenaza, pero tampoco una buena noticia. A partir de ahora, cada partido es un escaparate y cada fallo, un dato en el informe de un ojeador. Hasta tu madre te pregunta si tienes las ideas claras. Tú, la verdad, no.",
    [
      o("a", "Pedir renovación cuanto antes, aunque sea con una oferta normal", "Dar certidumbre", { rel_entrenador: 2, moral: 3, flags: { es_ultimo_ano: true } }, "El club te recibe con una sonrisa educada y una cifra que no es la que querías, pero tampoco la que temías. Firmas un año más con cláusula de revisión. Duermes mejor que en meses."),
      o("b", "Esperar al mercado y ver quién llama", "Jugártela", { moral: -1, flags: { es_ultimo_ano: true, estado_preocupado: "@WEEK+4", quiere_salir: true } }, "Cada llamada del móvil se convierte en un acontecimiento. Juegas pendiente de los ojeadores de la grada. Un día fallas un pase fácil y piensas: «Ya está, lo han visto»."),
      r("c", "Dejar que tu representante gestione y centrarte en jugar", "Cada uno a lo suyo", 0.55,
        "Tu representante lleva el asunto con una templanza admirable. Tú, mientras, juegas sin ruido, y ese rendimiento es el mejor argumento.", { moral: 3, rel_representante: 3, flags: { es_ultimo_ano: true, estado_confianza: "@WEEK+3" } },
        "El asunto se alarga y el club empieza a jugar al gato y al ratón. No tienes culpa, pero esa incertidumbre se te mete en el cuerpo.", { moral: -3, flags: { es_ultimo_ano: true, estado_preocupado: "@WEEK+3" } }, "reputacion"),
    ]),
  S("es-sueno", "estados", { minAge: 17, notFlags: [...LIBRE, "es_sueno"], clubTurns: [2, 400] }, "vida",
    "Una semana sin dormir",
    "Los vecinos de arriba tienen una obra que empieza a las siete, el niño de enfrente llora a las cuatro y tu cabeza, a las dos, repasa el partido, el contrato, el mensaje que no contestaste y lo que dirá tu madre. Llevas seis noches durmiendo cuatro horas. En el entrenamiento te sorprendes mirando el balón con la cara de quien intenta recordar su nombre.",
    [
      o("a", "Pedirle al club una habitación en el hotel de concentración unos días", "Aislarte", { forma: 3, moral: 1, rel_entrenador: 1, flags: { es_sueno: true } }, "El club accede sin hacer preguntas. En el hotel, con persianas de las buenas y una almohada de las que se piden, duermes diez horas del tirón. Al despertar tienes la cabeza ligera."),
      o("b", "Aguantar: ya se irán las obras", "Resignarte", { forma: -3, moral: -2, flags: { es_sueno: true, estado_bache: "@WEEK+2" } }, "Aguantas. Las obras duran dos semanas más. Durante esas dos semanas, tus compañeros te ven la cara y te dicen que parecías de otra liga, pero de las inferiores."),
      o("c", "Hablar con el médico del club y pedir consejo", "Buscar ayuda", { forma: 2, moral: 2, flags: { es_sueno: true } }, "El médico te receta lo que no esperas: ni pastillas, ni tés, sino un horario, unas gafas con filtro de luz azul y un cuaderno en la mesilla para vaciar la cabeza antes de dormir. Funciona mejor de lo que debería."),
    ]),

  // ───────── Buenas ─────────
  S("es-premio-mes", "estados", { ...JUEGA, media: [60, 100], notFlags: ["estado_castigo", "es_premio_mes"], clubTurns: [3, 400] }, "especial",
    "Jugador del mes",
    "Un correo del club, un trofeo de plástico dorado y una foto con el presidente: eres el jugador del mes según la afición. Te lo dan en un acto sencillo, con un aplauso largo de los empleados del club y un niño que te trae un dibujo. Tu madre, que lo ha visto por la tele, ya ha llamado a tres tías.",
    [
      o("a", "Dedicárselo a tus compañeros: sin ellos no hay premio", "Humildad", { rel_vestuario: 5, fama: 3, moral: 4, flags: { es_premio_mes: true, estado_racha: "@WEEK+3" } }, "Lo dices con el trofeo en la mano y la voz algo rota. El vestuario, que lo ve en directo, te recibe con una ovación y una lluvia de agua de la botella. El míster, desde el fondo, levanta un pulgar."),
      o("b", "Subir una foto con el trofeo a tus redes y presumir un poco", "Disfrutarlo", { fama: 5, moral: 3, flags: { es_premio_mes: true, estado_racha: "@WEEK+2" } }, "Mil likes en diez minutos, y una cuenta de un amigo de la infancia comentando: «Aún me debes la cena». Te ríes solo en el sofá de casa."),
      o("c", "Quitarle importancia: lo que importa es el siguiente partido", "Cabeza fría", { reputacion: 3, rel_entrenador: 2, moral: 2, flags: { es_premio_mes: true, estado_confianza: "@WEEK+3" } }, "Das las gracias, sonríes para la foto y te vas al campo de entrenamiento. El míster te ve llegar y entiende lo que acabas de hacer sin que digas nada."),
    ]),
  S("es-ninos", "estados", { minAge: 18, fama: [30, 100], notFlags: ["es_ninos", "estado_castigo"], clubTurns: [3, 400] }, "vida",
    "Un niño enfermo te pide que juegues con él",
    "La fundación del club te propone una visita al hospital infantil. En la puerta, una enfermera te advierte: «Hay un niño que lleva tu nombre en la camiseta desde hace dos años». Entras con la bolsa de balones y una sonrisa que te cuesta más de lo que esperabas. En la habitación, un chaval de nueve años sentado en la cama te mira como si no pudiera creerlo.",
    [
      o("a", "Quedarte la tarde entera, jugando y charlando", "Presente", { moral: 8, rel_aficion: 5, fama: 2, flags: { es_ninos: true, estado_racha: "@WEEK+2" } }, "Juegas a las cartas, a la consola, a hacer el payaso con un balón de espuma en el pasillo. Te vas con los ojos cargados y con un propósito claro: ese chaval va a ver tu próximo gol en la tele, desde su cama. Esa noche marcas, y le dedicas el gol."),
      o("b", "Hacerte una foto, dejar un balón firmado y volver al campo", "Lo justo", { moral: 3, rel_aficion: 2, fama: 1, flags: { es_ninos: true } }, "Es bonito y rápido. El niño sonríe, la enfermera te agradece el detalle y tú vuelves a tu rutina con la sensación de haber cumplido, aunque algo en ti te dice que podías haber hecho más."),
      o("c", "Volver con tu familia y los amigos de la infancia a la semana siguiente", "Repetir", { moral: 6, rel_aficion: 4, rel_vestuario: 2, flags: { es_ninos: true } }, "Vuelves con tu madre, tu padre y tu mejor amigo, que aporta una guitarra y un repertorio de canciones malas. Los niños se parten. Los médicos, también. Esa tarde, el hospital huele a risa."),
    ]),
  S("es-sistema", "estados", { ...JUEGA, notFlags: [...LIBRE, "estado_racha", "es_sistema"], clubTurns: [4, 400] }, "entrenamiento",
    "El míster cambia el sistema y te viene como un guante",
    "Después de una semana de pizarra, el míster cambia el dibujo del equipo. Los extremos se cierran, el centro del campo se abre y a ti te da un sitio que parece cortado a medida. En el primer entrenamiento con el sistema nuevo, el balón te busca en zonas donde antes te ahogabas. «Esto es lo que querías, ¿no?», te dice un compañero con una sonrisa.",
    [
      o("a", "Dedicarte a perfeccionar los movimientos de la nueva zona", "Exprimirlo", { forma: 2, media: 1, moral: 3, flags: { es_sistema: true, estado_racha: "@WEEK+4" } }, "Vídeo, pizarra, un compañero de cada línea y quince minutos al día repasando solo posiciones. Para el cuarto partido, tus movimientos son un hábito que se parece mucho a la intuición."),
      o("b", "Agradecérselo al míster con una frase sencilla", "Reconocer", { rel_entrenador: 5, moral: 2, flags: { es_sistema: true, estado_confianza: "@WEEK+4" } }, "«Gracias por el sitio», le dices a la salida del campo. Él no contesta, pero a la mañana siguiente te pone la mano en el hombro durante el calentamiento. Es todo lo que necesitabas."),
      o("c", "Disfrutarlo sin darle más vueltas", "Fluir", { moral: 4, fama: 2, flags: { es_sistema: true, estado_racha: "@WEEK+3" } }, "Juegas, te diviertes, marcas, das una asistencia. En el vestuario te preguntan qué te pasa y respondes con un encogimiento de hombros de quien no se lo cree ni él."),
    ]),
  S("es-pareja-final", "estados", { minAge: 18, flags: ["pareja"], ...{ roles: ["titular", "rotacion"] as ("titular" | "rotacion")[] }, notFlags: [...LIBRE, "es_pareja_final"], clubTurns: [3, 400] }, "vida",
    "{pareja} te prepara una cena sorpresa la víspera de un partido grande",
    "Llegas a casa agotado, con los nervios de la víspera, y encuentras las luces bajas, una mesa puesta y un olor a lo que cocina {pareja} cuando quiere que todo salga bien. No hay discursos ni preguntas sobre el partido: solo una cena sencilla, una película que no has visto y un abrazo que dura cinco minutos más de lo normal.",
    [
      o("a", "Dejar el móvil en otra habitación y quedarte con ella toda la noche", "Presente", { moral: 7, forma: 2, flags: { es_pareja_final: true, estado_racha: "@WEEK+3" } }, "Os reís de tonterías, comes más de lo que deberías y te quedas dormido en el sofá antes de que acabe la película. Al día siguiente, el partido te encuentra con la cabeza fría y el corazón calentito."),
      o("b", "Agradecérselo y pedirle que te deje ver el vídeo del rival un rato", "Cumplir", { moral: 3, rel_entrenador: 1, flags: { es_pareja_final: true } }, "Ella lo entiende, como siempre, y se sienta a tu lado con un cuaderno para anotar las cosas que ve. Terminas la noche con tres jugadas del rival subrayadas y una mirada de gratitud hacia alguien que no pide nada a cambio."),
    ]),
  S("es-patrocinador-fisio", "estados", { ...JUEGA, fama: [45, 100], notFlags: ["estado_fisico", "es_patro_fisio", ...LIBRE], clubTurns: [4, 400] }, "representante",
    "Tu patrocinador te regala un fisio personal",
    "Entre las cláusulas del nuevo contrato con tu patrocinador hay una que no esperabas: un fisioterapeuta personal, una nutricionista y un colchón de los que se anuncian en la tele. «Queremos que estés al cien», te dicen en la comida de presentación. Tú, que venías a firmar unos papeles, sales con un plan de recuperación y el número de móvil de una experta en sueño.",
    [
      o("a", "Aprovecharlo al máximo, con un plan serio desde el primer día", "Exprimirlo", { forma: 5, moral: 2, reputacion: 1, flags: { es_patro_fisio: true, estado_fisico: "@WEEK+6" } }, "A las seis semanas, el preparador del club te pregunta qué estás haciendo. «Sueño, comida, agua y paciencia», respondes. Él anota algo en su libreta y te pide la dirección del colchón."),
      o("b", "Usarlo cuando te venga bien, sin obsesionarte", "A tu ritmo", { forma: 2, moral: 1, flags: { es_patro_fisio: true, estado_fisico: "@WEEK+3" } }, "Aprovechas las sesiones que te encajan y declinas las que no. El fisio, un hombre práctico, no se ofende: «Con la mitad de lo que hacemos, ya notas la diferencia»."),
    ]),
];
