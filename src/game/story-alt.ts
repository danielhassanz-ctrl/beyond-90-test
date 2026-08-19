import { clubById } from "./data";
import { achieve, flag, injure, milestone, rel, stat } from "./mutate";
import { npcName } from "./npc";
import { BENCH_IDS, CALL_IDS, DEBUT_IDS, TALK_IDS, TRAIN_IDS, seenAny, variantOf } from "./story";
import type { GameEvent, GameState } from "./types";

const short = (s: GameState) => clubById(s.clubId).short;
const nick = (s: GameState) => s.player.nickname || s.player.name.split(" ")[0] || s.player.name;

const listed = (s: GameState) => {
  flag(s, "listed");
  achieve(s, "primera_convocatoria");
  milestone(s, "Primera convocatoria con el juvenil.");
};
const debuted = (s: GameState) => {
  flag(s, "status", 1);
  achieve(s, "debut_juvenil");
  milestone(s, "Debut oficial con el juvenil.");
};

/* =========================================================================
 * VARIANTES DE LA HISTORIA PRINCIPAL. Cada carrera vive UNA variante de cada
 * hito (elegida por careerSeed + ruta) y, además, arcos exclusivos de ruta.
 * ========================================================================= */
export const STORY_ALT: GameEvent[] = [
  /* ---------- Primer contacto con el club ---------- */
  {
    id: "st_train_v2",
    kicker: "Capítulo 1 · 16 años",
    title: "Llegas tarde el primer día",
    image: "travel",
    priority: 300,
    requires: (s) => s.age === 16 && variantOf(s, "train", 3) === 1,
    text: (s) =>
      `El autobús de las siete se te escapa por doce segundos. Llegas a la ciudad deportiva del ${short(s)} con el grupo ya estirando y ${npcName(s, "assistant")} mirando el reloj sin disimular. "Bienvenido. Empiezas con una en contra."`,
    choices: [
      {
        id: "disculpa",
        label: "Disculparte y correr más que nadie",
        outcome: "Acabas vomitando detrás de la portería. Nadie vuelve a mencionar el retraso.",
        apply: (s) => { rel(s, "coach", 6); stat(s, "fitness", -5); stat(s, "discipline", 5); },
      },
      {
        id: "excusa",
        label: "Explicar que el bus no esperó",
        outcome: (s: GameState) => `"Aquí nadie quiere razones", te suelta ${npcName(s, "assistant")} sin levantar la vista.`,
        apply: (s) => { rel(s, "coach", -6); stat(s, "morale", -2); rel(s, "dressing", 4); },
      },
      {
        id: "callar_v2",
        label: "Callar y entrar al rondo sin calentar",
        outcome: "Tres caños en cinco minutos. El grupo se calla; el míster apunta algo.",
        apply: (s) => { rel(s, "dressing", 8); stat(s, "form", 6); stat(s, "fitness", -4); },
      },
    ],
  },
  {
    id: "st_train_v3",
    kicker: "Capítulo 1 · 16 años",
    title: "El chico al que ya conocen",
    image: "locker",
    priority: 300,
    requires: (s) => s.age === 16 && variantOf(s, "train", 3) === 2,
    text: (s) =>
      `En el vestuario del ${short(s)} alguien dice tu nombre antes de que te presentes: te vieron marcar cuatro en un torneo de verano. El capitán del juvenil, ${npcName(s, "captain")}, te lanza una camiseta doblada. "A ver si es verdad lo que cuentan de ti, ${nick(s)}."`,
    choices: [
      {
        id: "cumplir",
        label: "Salir a confirmar la fama",
        outcome: "Marcas dos en el partidillo y fallas todo lo demás. Suficiente para el rumor.",
        apply: (s) => { stat(s, "fame", 5); stat(s, "form", 6); rel(s, "coach", -2); },
      },
      {
        id: "rebajar",
        label: "Quitarle hierro y ponerte a trabajar",
        outcome: "El cuerpo técnico agradece que no vengas con el traje puesto.",
        apply: (s) => { rel(s, "coach", 7); stat(s, "discipline", 5); },
      },
      {
        id: "capitan",
        label: `Devolverle la broma a ${"el capitán"}`,
        outcome: "Risas. Te sientas a su lado el resto del año.",
        apply: (s) => { rel(s, "dressing", 12); stat(s, "morale", 5); },
      },
    ],
  },

  /* ---------- Primera conversación con el técnico ---------- */
  {
    id: "st_talk_v2",
    kicker: "Capítulo 1 · Despacho",
    title: "El míster no cree en ti",
    image: "office",
    priority: 276,
    requires: (s) => s.age <= 17 && seenAny(s, TRAIN_IDS) && !seenAny(s, TALK_IDS) && variantOf(s, "talk", 3) === 1,
    text: (s) =>
      `${npcName(s, "coach")} no te pide que te sientes. "Te han fichado por encima de mi criterio. No voy a regalarte nada. Si juegas, será porque no me quede otra."`,
    choices: [
      {
        id: "aguantar",
        label: "Aguantarle la mirada y decir gracias",
        outcome: "Se queda un segundo desconcertado. Eso vale más que un discurso.",
        apply: (s) => { stat(s, "discipline", 6); stat(s, "morale", -2); rel(s, "coach", 3); },
      },
      {
        id: "responder",
        label: "\"Pues no le va a quedar otra.\"",
        outcome: "Lo cuenta en el cuerpo técnico esa misma tarde, medio molesto, medio impresionado.",
        apply: (s) => { rel(s, "coach", -7); stat(s, "morale", 8); stat(s, "fame", 2); flag(s, "desafio_coach"); },
      },
      {
        id: "puente",
        label: "Preguntarle qué tendrías que mejorar",
        outcome: "Suelta tres defectos concretos. Al menos ahora sabes por dónde.",
        apply: (s) => { rel(s, "coach", 6); stat(s, "overall", 1); },
      },
    ],
  },
  {
    id: "st_talk_v3",
    kicker: "Capítulo 1 · Campo 3",
    title: "Una charla de diez minutos en el banquillo vacío",
    image: "stadium",
    priority: 272,
    requires: (s) => s.age <= 17 && seenAny(s, TRAIN_IDS) && !seenAny(s, TALK_IDS) && variantOf(s, "talk", 3) === 2,
    text: (s) =>
      `Se acaba el entrenamiento y ${npcName(s, "coach")} se sienta contigo en el banquillo del campo 3, con el riego puesto. "He visto a cien como tú. Los que llegan no son los mejores de agosto. Dime tú qué vas a hacer distinto."`,
    choices: [
      {
        id: "trabajo",
        label: "\"Ser el último en irme cada día.\"",
        outcome: "\"Eso se comprueba en enero, no hoy.\" Pero lo apunta.",
        apply: (s) => { rel(s, "coach", 7); stat(s, "discipline", 6); },
      },
      {
        id: "instinto",
        label: "\"Jugar sin miedo, aunque me equivoque.\"",
        outcome: "Sonríe de lado. \"Con eso me vale, si el error es hacia delante.\"",
        apply: (s) => { rel(s, "coach", 4); stat(s, "form", 6); stat(s, "morale", 4); },
      },
      {
        id: "honesto",
        label: "Confesarle que tienes miedo de no valer",
        outcome: "Se queda callado. \"Ese miedo lo tenemos todos. Úsalo.\"",
        apply: (s) => { rel(s, "coach", 9); stat(s, "morale", -3); rel(s, "family", 4); },
      },
    ],
  },

  /* ---------- Convocatoria ---------- */
  {
    id: "st_call_v2",
    kicker: "Capítulo 2 · Convocatoria",
    title: "Una llamada a las diez de la noche",
    image: "family",
    priority: 248,
    requires: (s) => s.stage === "youth" && !s.flags["listed"] && !seenAny(s, CALL_IDS) && variantOf(s, "call", 2) === 1,
    text: (s) =>
      `Suena el teléfono en casa a las diez y cuarto. Es el delegado: se ha caído un lateral y hace falta un chico. "Mañana a las nueve en la puerta. Tráete las botas limpias, ${nick(s)}."`,
    choices: [
      {
        id: "no_dormir",
        label: "Pasar la noche en blanco preparando la mochila",
        outcome: "Llegas nervioso y feliz, con las botas relucientes y cero horas de sueño.",
        apply: (s) => { stat(s, "morale", 8); stat(s, "fitness", -5); listed(s); },
      },
      {
        id: "profesional",
        label: "Cenar, acostarte y dormir ocho horas",
        outcome: "El delegado lo comenta: \"Ese chaval tiene la cabeza vieja.\"",
        apply: (s) => { rel(s, "coach", 6); stat(s, "discipline", 6); listed(s); },
      },
    ],
  },

  /* ---------- Antesala del debut ---------- */
  {
    id: "st_bench_v2",
    kicker: "Capítulo 2 · Grada",
    title: "Ni convocado: a ver el partido desde la grada",
    image: "stadium",
    priority: 238,
    requires: (s) => !!s.flags["listed"] && !s.flags["status"] && !seenAny(s, BENCH_IDS) && variantOf(s, "bench", 2) === 1,
    text: (s) =>
      `Te dejan fuera de la lista del derbi juvenil y te toca verlo con chándal desde la grada, entre padres que comentan tu nombre sin saber que estás dos filas detrás. El ${short(s)} gana sin ti.`,
    choices: [
      {
        id: "aplaudir",
        label: "Bajar al vestuario a felicitarlos",
        outcome: "El capitán te da la mano delante del míster. Eso se ve.",
        apply: (s) => { rel(s, "dressing", 10); rel(s, "coach", 4); stat(s, "morale", -2); },
      },
      {
        id: "gym",
        label: "Irte al gimnasio en el descanso",
        outcome: "El preparador físico te encuentra allí y lo cuenta arriba.",
        apply: (s) => { stat(s, "fitness", 8); stat(s, "overall", 1); rel(s, "dressing", -4); },
      },
      {
        id: "padre",
        label: "Marcharte con tu padre sin ver el segundo tiempo",
        outcome: "En el coche no habláis. Él aprieta el volante por ti.",
        apply: (s) => { rel(s, "family", 6); stat(s, "morale", 4); rel(s, "coach", -6); flag(s, "conflictivo"); },
      },
    ],
  },
  {
    id: "st_alt_freeze",
    kicker: "Capítulo 2 · Nevera",
    title: "Tres semanas sin que te miren",
    image: "training",
    priority: 236,
    requires: (s) => s.stage === "youth" && !s.flags["status"] && !seenAny(s, BENCH_IDS) && s.age <= 18,
    text: (s) =>
      `${npcName(s, "coach")} lleva tres semanas sin dirigirte una frase que no sea "recoge los conos". Entrenas con el grupo de los descartados, en el campo de tierra, sin porteros.`,
    choices: [
      {
        id: "encarar_freeze",
        label: "Plantarte en su despacho a pedir explicaciones",
        outcome: "\"Cuando quiera algo de ti, te lo digo yo.\" Sales peor de lo que entraste.",
        apply: (s) => { rel(s, "coach", -8); stat(s, "morale", 3); flag(s, "conflictivo"); flag(s, "nevera"); },
      },
      {
        id: "doble",
        label: "Entrenar doble turno en silencio",
        outcome: "Nadie te felicita, pero el preparador empieza a contar tus repeticiones.",
        apply: (s) => { stat(s, "overall", 2); stat(s, "fitness", 6); stat(s, "morale", -4); flag(s, "nevera"); },
      },
      {
        id: "salida",
        label: "Pedir salir cedido en enero",
        outcome: "El club apunta tu nombre en una lista distinta a la que esperabas.",
        apply: (s) => { flag(s, "pide_cesion"); rel(s, "coach", -3); stat(s, "fame", 2); flag(s, "nevera"); },
      },
    ],
  },
  {
    id: "st_alt_rival",
    kicker: "Capítulo 2 · Competencia",
    title: "El otro chico de tu puesto",
    image: "training",
    priority: 234,
    requires: (s) => s.stage === "youth" && !s.flags["status"] && !seenAny(s, BENCH_IDS) && s.age <= 18,
    text: (s) =>
      `${npcName(s, "rival")} juega en tu puesto, lleva dos años en la casa y hoy ha marcado en el partidillo mientras tú la perdías dos veces. El cuerpo técnico solo va a subir a uno.`,
    choices: [
      {
        id: "guerra",
        label: "Ir a por él en cada duelo del entrenamiento",
        outcome: "Se acaba en empujones. El míster para el entrenamiento y os separa.",
        apply: (s) => { stat(s, "form", 6); rel(s, "coach", -6); rel(s, "dressing", -6); flag(s, "rivalidad", 2); },
      },
      {
        id: "aprender_rival",
        label: "Estudiarlo y copiarle lo que hace mejor",
        outcome: "Dos semanas después te sale su movimiento de desmarque como si fuera tuyo.",
        apply: (s) => { stat(s, "overall", 2); rel(s, "coach", 4); flag(s, "rivalidad", 1); },
      },
      {
        id: "alianza",
        label: "Hacerte su amigo y competir de frente",
        outcome: "Os quedáis a tirar faltas juntos. Los dos mejoráis; solo sube uno.",
        apply: (s) => { rel(s, "dressing", 10); stat(s, "morale", 5); flag(s, "rivalidad", 1); },
      },
    ],
  },

  /* ---------- Debut juvenil ---------- */
  {
    id: "st_debut_v2",
    kicker: "Capítulo 2 · Debut",
    title: "Titular de urgencia",
    image: "tunnel",
    priority: 228,
    requires: (s) =>
      s.stage === "youth" && !!s.flags["listed"] && !s.flags["status"] && seenAny(s, BENCH_IDS) && !seenAny(s, DEBUT_IDS) && variantOf(s, "debut", 3) === 1,
    text: (s) =>
      `Dos bajas y una gastroenteritis: sales de inicio sin avisar, con la camiseta del ${short(s)} que le sobraba a otro. Noventa minutos por delante y el estómago cerrado.`,
    choices: [
      {
        id: "orden",
        label: "Cumplir la pizarra a rajatabla",
        outcome: "Partido gris y correcto. El míster asiente una vez, que en él es mucho.",
        apply: (s) => { debuted(s); rel(s, "coach", 8); stat(s, "overall", 2); stat(s, "discipline", 4); },
      },
      {
        id: "libertad",
        label: "Jugar como en el barrio",
        outcome: "Una jugada de las tuyas y tres pérdidas tontas. La banda te grita las dos cosas.",
        apply: (s) => { debuted(s); rel(s, "fans", 10); stat(s, "form", 8); rel(s, "coach", -3); stat(s, "overall", 2); },
      },
    ],
  },
  {
    id: "st_debut_v3",
    kicker: "Capítulo 2 · Debut",
    title: "Debut en la nieve, en un campo de tierra",
    image: "match",
    priority: 226,
    requires: (s) =>
      s.stage === "youth" && !!s.flags["listed"] && !s.flags["status"] && !seenAny(s, DEBUT_IDS) && variantOf(s, "debut", 3) === 2,
    text: (s) =>
      `Campo helado en un pueblo a 180 km, treinta personas en la valla y un árbitro con guantes de lana. Entras al descanso con 0-2 en contra. Nadie recordará este partido salvo tú.`,
    choices: [
      {
        id: "pelear",
        label: "Pelear cada balón dividido",
        outcome: "Sales con la cadera morada y el respeto de los mayores del equipo.",
        apply: (s) => { debuted(s); rel(s, "dressing", 12); stat(s, "fitness", -6); stat(s, "overall", 2); },
      },
      {
        id: "recortar",
        label: "Intentar tú solo remontarlo",
        outcome: "Marcas uno, fallas el empate en el 90. Vuelves llorando en el autobús.",
        apply: (s) => { debuted(s); stat(s, "form", 6); stat(s, "morale", -4); rel(s, "fans", 6); stat(s, "overall", 2); },
      },
    ],
  },

  /* ---------- Arcos exclusivos de ruta ---------- */
  {
    id: "st_alt_early_injury",
    kicker: "Capítulo 2 · Enfermería",
    title: "La primera vez que te rompes",
    image: "injury",
    priority: 232,
    requires: (s) => s.age <= 18 && !s.injury && !s.flags["lesion_temprana"] && s.stage === "youth",
    text: (s) =>
      `Un choque tonto en un rondo. ${npcName(s, "physio")} te toca el tobillo y no dice nada durante demasiados segundos. "Nos vamos a hacer pruebas."`,
    choices: [
      {
        id: "bien",
        label: "Hacer la recuperación completa, sin atajos",
        outcome: "Seis semanas fuera. Vuelves entero y más fuerte de arriba.",
        apply: (s) => { flag(s, "lesion_temprana"); injure(s, 6, "Fisura en el tobillo"); rel(s, "family", 6); stat(s, "discipline", 6); },
      },
      {
        id: "prisa_inj",
        label: "Volver a tiempo para la fase final",
        outcome: "Vuelves antes, juegas cojeando y el tobillo te lo recuerda un año entero.",
        apply: (s) => { flag(s, "lesion_temprana"); injure(s, 3, "Fisura en el tobillo (vuelta exprés)"); stat(s, "fitness", -10); flag(s, "forzo_lesion"); },
      },
    ],
  },
  {
    id: "st_alt_loan",
    kicker: "Capítulo 3 · Cesión",
    title: "Un año lejos de casa",
    image: "travel",
    priority: 206,
    requires: (s) => s.age >= 17 && s.stage === "youth" && !s.flags["cedido"] && (!!s.flags["pide_cesion"] || s.rel.coach <= 58),
    text: (s) =>
      `Un club de Tercera a 400 km pregunta por ti para jugarlo todo. Pisos compartidos, autobuses de madrugada y hombres que juegan por 600 euros. El ${short(s)} lo ve bien.`,
    choices: [
      {
        id: "ir",
        label: "Aceptar y jugarlo todo lejos de casa",
        outcome: "Treinta partidos, dos codazos y un cuerpo nuevo. Vuelves siendo otro.",
        apply: (s) => {
          flag(s, "cedido"); s.stage = "reserves"; s.flags["status"] = 2;
          stat(s, "overall", 3); stat(s, "fitness", 6); rel(s, "family", -8); rel(s, "dressing", -4);
          achieve(s, "cesion"); milestone(s, "Cesión: temporada completa lejos de casa.");
        },
      },
      {
        id: "quedarse",
        label: "Quedarte a pelear tu sitio aquí",
        outcome: "El club respeta la decisión. Los minutos, no tanto.",
        apply: (s) => { flag(s, "cedido", 2); rel(s, "coach", 5); rel(s, "family", 8); stat(s, "morale", -3); },
      },
    ],
  },
];
