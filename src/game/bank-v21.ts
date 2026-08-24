import { clubById } from "./data";
import { flag, injure, milestone, note, rel, stat } from "./mutate";
import { npcMood, who } from "./npc";
import type { GameEvent, GameState } from "./types";

/* =========================================================================
 * BANCO NARRATIVO V2.1 (build de prueba)
 * Paquete representativo: escenas sueltas + mini-arcos de 2-3 capítulos
 * encadenados por flags. Parodias ficticias (Malum-a, Cristian Ronald-X…),
 * NPCs siempre con rol explícito y respuestas propias de cada escena.
 * ========================================================================= */

const nick = (s: GameState) => s.player.nickname || s.player.name.split(" ")[0] || s.player.name;
const club = (s: GameState) => clubById(s.clubId).name;
const short = (s: GameState) => clubById(s.clubId).short;
const agent = (s: GameState) => `${s.agentName}, tu representante`;
const money = (s: GameState, d: number) => {
  s.wealth = Math.max(0, (s.wealth ?? 0) + d);
};
const conflict = (s: GameState, t: string) => {
  if (!s.memory.conflicts.includes(t)) s.memory.conflicts.push(t);
};
const promise = (s: GameState, t: string) => {
  if (!s.memory.promises.includes(t)) s.memory.promises.push(t);
};
const on = (s: GameState, k: string) => (s.flags[k] ?? 0) === 1;

export const BANK_V21: GameEvent[] = [
  /* ------------------------------------------------------------------ *
   * ARCO 1 · MALUM-A (parodia de estrella del pop)
   * ------------------------------------------------------------------ */
  {
    id: "v21_maluma_1",
    kicker: "Fama · Capítulo 1",
    title: "Un mensaje de Malum-a",
    image: "office",
    category: "gossip",
    family: "arc_maluma",
    requires: (s) => s.fame >= 18 && !on(s, "maluma_1"),
    text: (s) =>
      `Tres de la mañana. Una cuenta verificada con nueve millones de seguidores te escribe: "buen gol, ${nick(s)} 👀". Es Malum-a, la cantante que suena en todos los altavoces del vestuario del ${short(s)}. Tienes el móvil en la mano y el corazón a ciento veinte.`,
    choices: [
      {
        id: "responder",
        label: "Responder al momento",
        hint: "Sin pensarlo demasiado",
        outcome: "Dos horas de conversación y un 'nos vemos cuando toque en tu ciudad'.",
        apply: (s) => { flag(s, "maluma_1"); stat(s, "fame", 8); stat(s, "morale", 8); stat(s, "fitness", -4); },
      },
      {
        id: "manana",
        label: "Dejarlo en visto y contestar por la mañana",
        hint: "Dormir primero",
        outcome: "Contestas a las diez. Ella tarda tres días. El juego ya ha empezado.",
        apply: (s) => { flag(s, "maluma_1"); stat(s, "fame", 4); stat(s, "discipline", 5); },
      },
      {
        id: "captura",
        label: "Hacer captura y enseñársela al vestuario",
        hint: "Riesgo de filtración",
        outcome: "Aplausos, gritos y una captura que ya no controlas.",
        apply: (s) => { flag(s, "maluma_1"); flag(s, "maluma_filtrado"); rel(s, "dressing", 8); stat(s, "fame", 10); },
      },
    ],
  },
  {
    id: "v21_maluma_2",
    kicker: "Fama · Capítulo 2",
    title: "La foto del reservado",
    image: "press",
    category: "gossip",
    family: "arc_maluma",
    requires: (s) => on(s, "maluma_1") && !on(s, "maluma_2"),
    text: (s) =>
      `Cena discreta, reservado al fondo, gorra. A las ocho de la mañana la foto abre el programa del corazón y ${who(s, "coach")} la ve en la tele de la ciudad deportiva mientras desayuna.`,
    choices: [
      {
        id: "asumir",
        label: "Entrar al vestuario de frente y asumirlo",
        outcome: "\"Al menos no mientes\", te dice tu entrenador sin levantar la vista.",
        apply: (s) => { flag(s, "maluma_2"); rel(s, "coach", 4); stat(s, "fame", 8); rel(s, "dressing", 5); },
      },
      {
        id: "negar",
        label: "Negar que fueras tú",
        outcome: "La gorra es tuya. El club lo sabe. Tú también.",
        apply: (s) => { flag(s, "maluma_2"); flag(s, "mentira_club"); rel(s, "coach", -8); stat(s, "fame", 5); conflict(s, "Mentiste al club por la foto con Malum-a"); },
      },
      {
        id: "cortar",
        label: "Cortar la relación para centrarte",
        outcome: "Un audio de cuarenta segundos y se acaba antes de empezar.",
        apply: (s) => { flag(s, "maluma_2"); flag(s, "maluma_cortado"); stat(s, "morale", -8); stat(s, "form", 5); rel(s, "coach", 6); },
      },
    ],
  },
  {
    id: "v21_maluma_3",
    kicker: "Fama · Capítulo 3",
    title: "La canción",
    image: "press",
    category: "gossip",
    family: "arc_maluma",
    requires: (s) => on(s, "maluma_2") && !on(s, "maluma_3"),
    text: (s) =>
      `Malum-a estrena tema. Segundo verso: "un nueve del sur que no contesta". Media España lo canta y en el rondo del ${short(s)} lo silban entero, con coreografía.`,
    choices: [
      {
        id: "reir",
        label: "Salir a entrenar cantándola tú primero",
        outcome: "Desactivas la broma haciéndola tuya. El vestuario te adopta.",
        apply: (s) => { flag(s, "maluma_3"); rel(s, "dressing", 12); stat(s, "morale", 8); stat(s, "fame", 6); },
      },
      {
        id: "silencio",
        label: "No decir una palabra en ninguna rueda de prensa",
        outcome: "Aguantas dos semanas de preguntas. Después ya nadie insiste.",
        apply: (s) => { flag(s, "maluma_3"); stat(s, "discipline", 8); stat(s, "fame", 3); rel(s, "coach", 5); },
      },
      {
        id: "responder",
        label: "Contestar públicamente",
        outcome: "Un tuit tuyo, cuarenta mil capturas y un patrocinador nervioso.",
        apply: (s) => { flag(s, "maluma_3"); stat(s, "fame", 12); rel(s, "coach", -5); stat(s, "morale", -3); money(s, 1); },
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * ARCO 2 · EL PADRE Y LOS 624 KM
   * ------------------------------------------------------------------ */
  {
    id: "v21_padre_1",
    kicker: "Familia · Capítulo 1",
    title: "624 kilómetros",
    image: "family",
    category: "life",
    family: "arc_padre",
    requires: (s) => s.age <= 22 && !on(s, "padre_1"),
    text: (s) =>
      `Tu padre hace 624 kilómetros cada quince días para verte quince minutos en el campo del ${club(s)}. Sale a las cinco de la mañana, come un bocadillo en el arcén y vuelve la misma noche porque el lunes trabaja.`,
    choices: [
      {
        id: "pedirle",
        label: "Pedirle que no venga tanto",
        outcome: "\"Ya conduciré yo cuando tú decidas\", te responde, y no vuelve a discutirlo.",
        apply: (s) => { flag(s, "padre_1"); rel(s, "family", -6); stat(s, "morale", -4); },
      },
      {
        id: "hotel",
        label: "Pagarle el hotel con tu primera ficha",
        outcome: "Le cuesta aceptarlo más que a ti pagarlo.",
        apply: (s) => { flag(s, "padre_1"); flag(s, "padre_hotel"); rel(s, "family", 12); money(s, -1); stat(s, "morale", 6); },
      },
      {
        id: "dedicar",
        label: "Prometerle que el primer gol es suyo",
        outcome: "Se le queda la cara rara y se va a fumar fuera.",
        apply: (s) => { flag(s, "padre_1"); flag(s, "padre_promesa"); rel(s, "family", 8); promise(s, "Prometiste a tu padre dedicarle el primer gol"); stat(s, "form", 3); },
      },
    ],
  },
  {
    id: "v21_padre_2",
    kicker: "Familia · Capítulo 2",
    title: "El arcén de la A-4",
    image: "travel",
    category: "life",
    family: "arc_padre",
    requires: (s) => on(s, "padre_1") && !on(s, "padre_2"),
    text: () =>
      `Llamada de tu madre a las dos de la mañana: tu padre se ha quedado dormido al volante volviendo del partido. Está bien. El coche, en un talud, no.`,
    choices: [
      {
        id: "coche",
        label: "Comprarle un coche y un chófer para los viajes largos",
        outcome: "Orgullo herido, pero acepta \"solo hasta que te asientes\".",
        apply: (s) => { flag(s, "padre_2"); flag(s, "padre_coche"); money(s, -2); rel(s, "family", 14); stat(s, "morale", 6); },
      },
      {
        id: "prohibir",
        label: "Prohibirle venir hasta que juegues en casa cerca",
        outcome: "Cumple. Y en cada partido notas el hueco en la grada.",
        apply: (s) => { flag(s, "padre_2"); rel(s, "family", -4); stat(s, "morale", -8); stat(s, "form", -3); },
      },
      {
        id: "viajar",
        label: "Ir tú a casa cada vez que haya dos días libres",
        outcome: "Duermes en el sofá de siempre y vuelves con la cabeza limpia.",
        apply: (s) => { flag(s, "padre_2"); rel(s, "family", 10); stat(s, "fitness", -3); stat(s, "morale", 8); },
      },
    ],
  },
  {
    id: "v21_padre_3",
    kicker: "Familia · Capítulo 3",
    title: "La grada de siempre, vacía",
    image: "stadium",
    category: "life",
    family: "arc_padre",
    requires: (s) => on(s, "padre_2") && s.age >= 20 && !on(s, "padre_3"),
    text: (s) =>
      `Primer partido grande de la temporada y el asiento 14 de la fila 22 está vacío: a tu padre le han puesto turno doble. Te enteras calentando, mirando arriba como haces siempre.`,
    choices: [
      {
        id: "comprar",
        label: "Pagarle el sueldo del mes para que deje el turno",
        outcome: "Se lo tomas como una ofensa media hora. Luego llora al teléfono.",
        apply: (s) => { flag(s, "padre_3"); money(s, -1); rel(s, "family", 12); stat(s, "morale", 10); milestone(s, "Sacaste a tu padre de los turnos dobles."); },
      },
      {
        id: "camara",
        label: "Pedir al club que le graben tu calentamiento",
        outcome: "El community manager lo convierte en el vídeo de la semana.",
        apply: (s) => { flag(s, "padre_3"); rel(s, "fans", 8); stat(s, "fame", 6); rel(s, "family", 6); },
      },
      {
        id: "jugar",
        label: "Jugar como si estuviera arriba igualmente",
        outcome: "Partidazo. Lo ve en el móvil del vestuario del almacén.",
        apply: (s) => { flag(s, "padre_3"); stat(s, "form", 8); rel(s, "family", 4); },
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * ARCO 3 · EL DOBLE VIRAL
   * ------------------------------------------------------------------ */
  {
    id: "v21_doble_1",
    kicker: "Surrealismo · Capítulo 1",
    title: "Alguien firma autógrafos con tu cara",
    image: "press",
    category: "gossip",
    family: "arc_doble",
    rare: true,
    requires: (s) => s.fame >= 25 && !on(s, "doble_1"),
    text: (s) =>
      `Un tío que se te parece un 80% está firmando camisetas del ${short(s)} en un centro comercial de otra provincia. Cobra por foto. Tiene más carisma que tú y lo sabe todo el mundo en el grupo del vestuario.`,
    choices: [
      {
        id: "denunciar",
        label: "Pasarlo a los abogados del club",
        outcome: "Carta certificada y fin del espectáculo. También del meme.",
        apply: (s) => { flag(s, "doble_1"); stat(s, "fame", -2); rel(s, "coach", 3); },
      },
      {
        id: "seguir",
        label: "Seguirle el juego en redes",
        outcome: "Le contestas 'trabaja bien esa zurda' y explota internet.",
        apply: (s) => { flag(s, "doble_1"); flag(s, "doble_juego"); stat(s, "fame", 10); rel(s, "dressing", 6); },
      },
      {
        id: "ignorar",
        label: "Ignorarlo por completo",
        outcome: "Dos semanas después sigue firmando. Ya son tres provincias.",
        apply: (s) => { flag(s, "doble_1"); flag(s, "doble_juego"); stat(s, "discipline", 4); },
      },
    ],
  },
  {
    id: "v21_doble_2",
    kicker: "Surrealismo · Capítulo 2",
    title: "Cara a cara con tu doble",
    image: "office",
    category: "gossip",
    family: "arc_doble",
    requires: (s) => on(s, "doble_juego") && !on(s, "doble_2"),
    text: () =>
      `Le citas en una cafetería. Se llama Rubén, es repartidor, y trae un álbum con todas las fotos que ha firmado. "Con esto pagué la fisio de mi madre", te dice, sin pizca de vergüenza.`,
    choices: [
      {
        id: "contratar",
        label: "Ficharle para eventos oficiales tuyos",
        outcome: "Ahora tienes un doble legal y una historia que contarás toda la vida.",
        apply: (s) => { flag(s, "doble_2"); stat(s, "fame", 8); stat(s, "morale", 8); money(s, -1); },
      },
      {
        id: "parar",
        label: "Pedirle que pare, con dinero de por medio",
        outcome: "Coge el sobre y no vuelves a saber de él. Casi te da pena.",
        apply: (s) => { flag(s, "doble_2"); money(s, -1); stat(s, "morale", -3); },
      },
      {
        id: "video",
        label: "Grabar un vídeo juntos y subirlo",
        outcome: "Ocho millones de reproducciones y una marca de refrescos llamando.",
        apply: (s) => { flag(s, "doble_2"); stat(s, "fame", 14); money(s, 1); rel(s, "coach", -3); },
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * ARCO 4 · EL PENALTI DEL COMPAÑERO
   * ------------------------------------------------------------------ */
  {
    id: "v21_penalti_1",
    kicker: "Fútbol · Capítulo 1",
    title: "Balón en el punto, dos manos encima",
    image: "match",
    category: "club",
    family: "arc_penalti",
    requires: (s) => s.age >= 17 && !on(s, "penalti_1"),
    text: (s) =>
      `Minuto 88, empate, penalti para el ${short(s)}. ${who(s, "captain")} coge el balón. Tú llevas tres partidos sin marcar y el banquillo mira hacia otro lado.`,
    choices: [
      {
        id: "ceder",
        label: "Cederle el balón sin discutir",
        outcome: "Lo marca. Te busca en la celebración antes que a nadie.",
        apply: (s) => { flag(s, "penalti_1"); flag(s, "penalti_cedido"); rel(s, "dressing", 10); npcMood(s, "captain", 12); stat(s, "form", 2); },
      },
      {
        id: "quitarselo",
        label: "Quitárselo delante de veinte mil personas",
        outcome: "Lo tiras tú. El estadio contiene la respiración.",
        apply: (s) => { flag(s, "penalti_1"); flag(s, "penalti_tomado"); rel(s, "dressing", -8); npcMood(s, "captain", -14); stat(s, "form", 6); stat(s, "fame", 6); conflict(s, "Le quitaste un penalti al capitán"); },
      },
      {
        id: "hablar",
        label: "Discutirlo diez segundos y decidir entre los dos",
        outcome: "Lo tira él y te señala antes de chutar. Pacto sellado.",
        apply: (s) => { flag(s, "penalti_1"); flag(s, "penalti_pacto"); rel(s, "dressing", 6); npcMood(s, "captain", 6); },
      },
    ],
  },
  {
    id: "v21_penalti_2",
    kicker: "Fútbol · Capítulo 2",
    title: "El penalti fallado",
    image: "match",
    category: "club",
    family: "arc_penalti",
    requires: (s) => on(s, "penalti_1") && !on(s, "penalti_2"),
    text: (s) =>
      `Vuelve a pasar y esta vez el balón se va al segundo anfiteatro. ${who(s, "captain")} se queda sentado en el césped mientras el estadio se vacía en silencio.`,
    choices: [
      {
        id: "levantar",
        label: "Ir a levantarle delante de las cámaras",
        outcome: "La foto sale en todos los periódicos. Nadie recuerda quién falló.",
        apply: (s) => { flag(s, "penalti_2"); rel(s, "dressing", 12); npcMood(s, "captain", 18); rel(s, "fans", 6); stat(s, "fame", 4); },
      },
      {
        id: "asumir",
        label: "Asumirlo tú en zona mixta: \"lo teníamos hablado\"",
        outcome: "Te comes el titular. El vestuario se entera y no lo olvida.",
        apply: (s) => { flag(s, "penalti_2"); rel(s, "dressing", 14); rel(s, "fans", -5); npcMood(s, "captain", 14); },
      },
      {
        id: "pedirlos",
        label: "Pedir en el vestuario ser tú el lanzador a partir de ahora",
        outcome: "Silencio incómodo y una mirada muy larga del capitán.",
        apply: (s) => { flag(s, "penalti_2"); flag(s, "penalti_lanzador"); rel(s, "dressing", -6); npcMood(s, "captain", -10); stat(s, "morale", 6); },
      },
    ],
  },
  {
    id: "v21_penalti_3",
    kicker: "Fútbol · Capítulo 3",
    title: "Otra vez, y ahora decides tú",
    image: "stadium",
    category: "club",
    family: "arc_penalti",
    requires: (s) => on(s, "penalti_2") && !on(s, "penalti_3"),
    text: (s) =>
      `Final de temporada, penalti que vale Europa. Todo el ${short(s)} te mira a ti: seas o no el lanzador oficial, esto ya es tuyo.`,
    choices: [
      {
        id: "tirar",
        label: "Cogerlo tú",
        outcome: "Palo, dentro. Te quedas en el punto de penalti sin celebrar.",
        apply: (s) => { flag(s, "penalti_3"); stat(s, "form", 10); rel(s, "fans", 12); stat(s, "fame", 10); milestone(s, "Penalti decisivo transformado."); },
      },
      {
        id: "devolver",
        label: "Dárselo al capitán para cerrar la herida",
        outcome: "Lo mete. Se abraza a ti y no dice nada durante un minuto entero.",
        apply: (s) => { flag(s, "penalti_3"); rel(s, "dressing", 14); npcMood(s, "captain", 20); rel(s, "coach", 6); milestone(s, "Devolviste el penalti al capitán."); },
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * ARCO 5 · LA COPA ABOLLADA
   * ------------------------------------------------------------------ */
  {
    id: "v21_copa_1",
    kicker: "Club · Capítulo 1",
    title: "La copa abollada",
    image: "celebration",
    category: "club",
    family: "arc_copa",
    requires: (s) => s.age >= 19 && !on(s, "copa_1"),
    text: (s) =>
      `Celebración en el vestuario, cerveza en el suelo y la copa rodando. Cuando la levantas tiene un bollo del tamaño de un puño. ${who(s, "assistant")} palidece: mañana hay foto oficial con el presidente.`,
    choices: [
      {
        id: "confesar",
        label: "Confesarlo antes de que salga en la prensa",
        outcome: "Bronca corta, respeto largo.",
        apply: (s) => { flag(s, "copa_1"); flag(s, "copa_confesada"); rel(s, "coach", 6); stat(s, "discipline", 6); rel(s, "fans", -2); },
      },
      {
        id: "girar",
        label: "Girar el bollo hacia atrás para la foto",
        outcome: "Funciona doce horas. Luego llega el zoom de internet.",
        apply: (s) => { flag(s, "copa_1"); flag(s, "copa_tapada"); stat(s, "fame", 5); rel(s, "dressing", 8); },
      },
      {
        id: "pagar",
        label: "Pagar la restauración de tu bolsillo, en silencio",
        outcome: "El utillero jura que no dirá nada. Los utilleros siempre dicen algo.",
        apply: (s) => { flag(s, "copa_1"); flag(s, "copa_tapada"); money(s, -1); rel(s, "dressing", 5); },
      },
    ],
  },
  {
    id: "v21_copa_2",
    kicker: "Club · Capítulo 2",
    title: "El museo del club llama",
    image: "office",
    category: "club",
    family: "arc_copa",
    requires: (s) => on(s, "copa_1") && !on(s, "copa_2"),
    text: (s) =>
      `El responsable del museo del ${club(s)} quiere exponer la copa tal cual, bollo incluido, con una placa: "así se celebra aquí". El presidente no lo tiene claro.`,
    choices: [
      {
        id: "apoyar",
        label: "Defender el bollo en la junta",
        outcome: "La placa se queda. La afición la fotografía más que al trofeo.",
        apply: (s) => { flag(s, "copa_2"); rel(s, "fans", 12); stat(s, "fame", 6); rel(s, "dressing", 6); },
      },
      {
        id: "restaurar",
        label: "Pedir que la restauren y se olvide el tema",
        outcome: "Vuelve perfecta y aburrida. Como casi todo lo institucional.",
        apply: (s) => { flag(s, "copa_2"); rel(s, "coach", 4); stat(s, "discipline", 5); },
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * ARCO 6 · CRISTIAN RONALD-X
   * ------------------------------------------------------------------ */
  {
    id: "v21_crx_1",
    kicker: "Ídolos · Capítulo 1",
    title: "Cristian Ronald-X te empieza a seguir",
    image: "office",
    category: "press",
    family: "arc_crx",
    requires: (s) => s.fame >= 20 && !on(s, "crx_1"),
    text: () =>
      `Cristian Ronald-X, 41 años, siete ligas en cuatro países y una marca de perfumes, te sigue en redes y comenta tu último gol con tres emojis de cabra. El grupo del vestuario arde.`,
    choices: [
      {
        id: "escribir",
        label: "Escribirle para pedirle consejo",
        outcome: "Contesta con un audio de cuatro minutos sobre descanso y hielo.",
        apply: (s) => { flag(s, "crx_1"); flag(s, "crx_contacto"); stat(s, "overall", 2); stat(s, "morale", 8); },
      },
      {
        id: "callar",
        label: "No decir nada y seguir a lo tuyo",
        outcome: "Tu entrenador lo agradece más de lo que dice.",
        apply: (s) => { flag(s, "crx_1"); rel(s, "coach", 5); stat(s, "discipline", 6); },
      },
      {
        id: "presumir",
        label: "Enseñarlo en el vestuario cada día durante una semana",
        outcome: "Al tercer día ya te tiran calcetines cuando abres el móvil.",
        apply: (s) => { flag(s, "crx_1"); flag(s, "crx_contacto"); rel(s, "dressing", -4); stat(s, "fame", 6); stat(s, "morale", 5); },
      },
    ],
  },
  {
    id: "v21_crx_2",
    kicker: "Ídolos · Capítulo 2",
    title: "Una semana entrenando con él",
    image: "gym",
    category: "training",
    family: "arc_crx",
    requires: (s) => on(s, "crx_contacto") && !on(s, "crx_2"),
    text: () =>
      `Te invita a su búnker privado: cámara hiperbárica, cocinero y sesiones a las seis de la mañana. Sus vacaciones son más duras que tu pretemporada.`,
    choices: [
      {
        id: "todo",
        label: "Seguir su plan al milímetro",
        outcome: "Vuelves reventado y dos kilos más fuerte.",
        apply: (s) => { flag(s, "crx_2"); stat(s, "overall", 3); stat(s, "fitness", -6); stat(s, "discipline", 10); },
      },
      {
        id: "medio",
        label: "Adaptarlo a tu cuerpo y descansar de verdad",
        outcome: "Menos épica, mejor decisión para tus rodillas.",
        apply: (s) => { flag(s, "crx_2"); stat(s, "overall", 1); stat(s, "fitness", 10); stat(s, "morale", 5); },
      },
      {
        id: "irse",
        label: "Marcharte a mitad de semana",
        outcome: "\"El talento sin obsesión se pierde\", te escribe. No respondes.",
        apply: (s) => { flag(s, "crx_2"); flag(s, "crx_ofendido"); stat(s, "morale", -5); stat(s, "fitness", 6); },
      },
    ],
  },
  {
    id: "v21_crx_3",
    kicker: "Ídolos · Capítulo 3",
    title: "Te critica en directo",
    image: "press",
    category: "press",
    family: "arc_crx",
    requires: (s) => on(s, "crx_2") && !on(s, "crx_3"),
    text: (s) =>
      `Cristian Ronald-X, ahora comentarista, dice en prime time: "${nick(s)} tiene todo menos hambre". Al día siguiente lo repiten en bucle en la radio de la ciudad.`,
    choices: [
      {
        id: "responder",
        label: "Responderle en rueda de prensa",
        outcome: "Titular gigante. Guerra abierta con un icono.",
        apply: (s) => { flag(s, "crx_3"); stat(s, "fame", 12); rel(s, "coach", -4); stat(s, "form", 4); conflict(s, "Guerra pública con Cristian Ronald-X"); },
      },
      {
        id: "campo",
        label: "Contestar solo en el campo",
        outcome: "Dos goles el domingo y una cámara buscándote la cara.",
        apply: (s) => { flag(s, "crx_3"); stat(s, "form", 9); rel(s, "coach", 6); stat(s, "fame", 6); },
      },
      {
        id: "darle",
        label: "Reconocer que tiene razón",
        outcome: "Nadie sabe qué titular poner. Tú duermes tranquilo.",
        apply: (s) => { flag(s, "crx_3"); stat(s, "discipline", 8); rel(s, "fans", 5); stat(s, "morale", 3); },
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * ARCO 7 · EL UTILLERO Y LAS APUESTAS
   * ------------------------------------------------------------------ */
  {
    id: "v21_apuestas_1",
    kicker: "Vestuario · Capítulo 1",
    title: "El utillero apuesta",
    image: "locker",
    category: "club",
    family: "arc_apuestas",
    requires: (s) => s.age >= 18 && !on(s, "apuestas_1"),
    text: () =>
      `Manolo, el utillero desde hace veintitrés años, te pregunta con demasiado interés si vas a ser titular. Luego ves su móvil abierto en una casa de apuestas.`,
    choices: [
      {
        id: "avisar",
        label: "Avisarle a solas de que pare",
        outcome: "Se le llenan los ojos. Promete dejarlo.",
        apply: (s) => { flag(s, "apuestas_1"); flag(s, "apuestas_aviso"); rel(s, "dressing", 6); stat(s, "morale", -3); },
      },
      {
        id: "reportar",
        label: "Contárselo al club",
        outcome: "Lo apartan en 48 horas. El vestuario te mira distinto.",
        apply: (s) => { flag(s, "apuestas_1"); rel(s, "coach", 8); rel(s, "dressing", -10); conflict(s, "Denunciaste al utillero"); },
      },
      {
        id: "callar",
        label: "Hacer como que no has visto nada",
        outcome: "Sigues pasando por su cuarto todos los días.",
        apply: (s) => { flag(s, "apuestas_1"); flag(s, "apuestas_aviso"); stat(s, "morale", -5); },
      },
    ],
  },
  {
    id: "v21_apuestas_2",
    kicker: "Vestuario · Capítulo 2",
    title: "Integridad pregunta por ti",
    image: "office",
    category: "club",
    family: "arc_apuestas",
    requires: (s) => on(s, "apuestas_aviso") && !on(s, "apuestas_2"),
    text: () =>
      `Dos personas de la unidad de integridad de la liga, un despacho pequeño y una pregunta: "¿Alguien del club le preguntó alguna vez por alineaciones?".`,
    choices: [
      {
        id: "verdad",
        label: "Contar exactamente lo que viste",
        outcome: "Declaración firmada. Manolo se jubila anticipadamente.",
        apply: (s) => { flag(s, "apuestas_2"); rel(s, "coach", 6); rel(s, "dressing", -6); stat(s, "discipline", 8); },
      },
      {
        id: "vago",
        label: "Ser vago sin llegar a mentir",
        outcome: "Sales del despacho con una sensación pegajosa.",
        apply: (s) => { flag(s, "apuestas_2"); stat(s, "morale", -6); rel(s, "dressing", 4); },
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * ARCO 8 · EL BAILE DEL VESTUARIO
   * ------------------------------------------------------------------ */
  {
    id: "v21_baile_1",
    kicker: "Humor · Capítulo 1",
    title: "El baile que no querías bailar",
    image: "locker",
    category: "club",
    family: "arc_baile",
    requires: (s) => s.age <= 26 && !on(s, "baile_1"),
    text: (s) =>
      `Los tres más jóvenes graban un baile en el vestuario y te meten en el encuadre sin avisar. ${who(s, "captain")} ya está apuntándose a la coreografía.`,
    choices: [
      {
        id: "bailar",
        label: "Bailar peor que nadie, a conciencia",
        outcome: "Dos millones de visitas y un mote nuevo para toda la temporada.",
        apply: (s) => { flag(s, "baile_1"); flag(s, "baile_viral"); rel(s, "dressing", 12); stat(s, "fame", 8); },
      },
      {
        id: "salir",
        label: "Salirte del plano sin cortar el rollo",
        outcome: "Nadie te lo reprocha, pero tampoco te incluyen en la siguiente.",
        apply: (s) => { flag(s, "baile_1"); stat(s, "discipline", 5); rel(s, "dressing", -2); },
      },
      {
        id: "prohibir",
        label: "Pedirles que borren el vídeo",
        outcome: "Lo borran. Y te llaman 'el delegado' durante meses.",
        apply: (s) => { flag(s, "baile_1"); rel(s, "dressing", -8); rel(s, "coach", 4); },
      },
    ],
  },
  {
    id: "v21_baile_2",
    kicker: "Humor · Capítulo 2",
    title: "Una marca quiere el baile",
    image: "agent",
    category: "agent",
    family: "arc_baile",
    requires: (s) => on(s, "baile_viral") && !on(s, "baile_2"),
    text: (s) =>
      `${agent(s)} llega con una oferta de una marca de refrescos: repetir el baile en un anuncio nacional. Pagan bien y quieren rodar en la ciudad deportiva.`,
    choices: [
      {
        id: "firmar",
        label: "Firmar y meter al vestuario en el reparto",
        outcome: "Cobran todos. Eso no se olvida en años.",
        apply: (s) => { flag(s, "baile_2"); money(s, 2); rel(s, "dressing", 12); rel(s, "agent", 8); stat(s, "fame", 8); },
      },
      {
        id: "solo",
        label: "Firmar tú solo",
        outcome: "Más dinero, menos gracia cuando llegas al vestuario.",
        apply: (s) => { flag(s, "baile_2"); money(s, 3); rel(s, "dressing", -10); rel(s, "agent", 10); stat(s, "fame", 8); },
      },
      {
        id: "no",
        label: "Rechazarlo: el vestuario no es un plató",
        outcome: "Tu representante tarda tres días en contestarte un mensaje.",
        apply: (s) => { flag(s, "baile_2"); rel(s, "agent", -10); rel(s, "coach", 6); stat(s, "discipline", 6); },
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * ARCO 9 · LA CLÁUSULA DEL ABUELO
   * ------------------------------------------------------------------ */
  {
    id: "v21_clausula_1",
    kicker: "Agente · Capítulo 1",
    title: "Una cláusula rara en el contrato",
    image: "agent",
    category: "agent",
    family: "arc_clausula",
    requires: (s) => s.age >= 17 && !on(s, "clausula_1"),
    text: (s) =>
      `${agent(s)} te enseña el borrador. Página siete, letra pequeña: una comisión del 12% sobre cualquier traspaso futuro, incluso si cambias de representante.`,
    choices: [
      {
        id: "firmar",
        label: "Firmar sin discutir para no romper la relación",
        outcome: "Sonríe mucho. Demasiado.",
        apply: (s) => { flag(s, "clausula_1"); flag(s, "clausula_firmada"); rel(s, "agent", 12); money(s, 1); },
      },
      {
        id: "negociar",
        label: "Negociar bajarla al 6%",
        outcome: "Discusión de dos horas y un 7% final.",
        apply: (s) => { flag(s, "clausula_1"); flag(s, "clausula_negociada"); rel(s, "agent", -4); stat(s, "discipline", 6); },
      },
      {
        id: "abogado",
        label: "Llevarlo a un abogado independiente",
        outcome: "Le sienta fatal que dudes de él. El abogado encuentra dos cosas más.",
        apply: (s) => { flag(s, "clausula_1"); flag(s, "clausula_abogado"); rel(s, "agent", -12); money(s, -1); conflict(s, "Revisaste el contrato de tu representante con abogados"); },
      },
    ],
  },
  {
    id: "v21_clausula_2",
    kicker: "Agente · Capítulo 2",
    title: "La letra pequeña reaparece",
    image: "office",
    category: "agent",
    family: "arc_clausula",
    requires: (s) => on(s, "clausula_1") && s.age >= 20 && !on(s, "clausula_2"),
    text: (s) =>
      `Llega una oferta seria y con ella la factura: aquella cláusula se activa entera. ${agent(s)} dice que "es lo pactado" y no le falta razón legal.`,
    choices: [
      {
        id: "pagar",
        label: "Pagar y seguir juntos",
        outcome: "Caro, pero tienes a alguien que coge el teléfono a las tres de la mañana.",
        apply: (s) => { flag(s, "clausula_2"); money(s, on(s, "clausula_firmada") ? -3 : -1); rel(s, "agent", 10); },
      },
      {
        id: "romper",
        label: "Romper con él y pelear la comisión",
        outcome: "Meses de burofax y una agenda de contactos que ya no es tuya.",
        apply: (s) => { flag(s, "clausula_2"); rel(s, "agent", -20); stat(s, "morale", -6); money(s, -1); conflict(s, "Ruptura con tu representante"); },
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * ESCENAS SUELTAS
   * ------------------------------------------------------------------ */
  {
    id: "v21_s_botas",
    kicker: "Fútbol",
    title: "Las botas del utillero",
    image: "locker",
    category: "club",
    family: "kit_gear",
    requires: (s) => s.age <= 20,
    text: (s) => `Tus botas se han roto en el calentamiento y las de repuesto son un número más. ${who(s, "assistant")} te ofrece unas del filial con el nombre de otro escrito en la lengüeta.`,
    choices: [
      { id: "usar", label: "Jugar con el nombre de otro en los pies", outcome: "Marcas. El dueño de las botas te las regala después.", apply: (s) => { stat(s, "form", 6); rel(s, "dressing", 6); } },
      { id: "apretar", label: "Apretar las tuyas con esparadrapo", outcome: "Aguantan 70 minutos y una ampolla de campeonato.", apply: (s) => { stat(s, "fitness", -6); stat(s, "discipline", 6); } },
    ],
  },
  {
    id: "v21_s_cinco_am",
    kicker: "Entrenador",
    title: "Las cinco de la mañana",
    image: "training",
    category: "training",
    family: "extra_work",
    requires: (s) => s.age <= 24,
    text: (s) => `${who(s, "coach")} te ofrece abrirte el gimnasio a las cinco y media, antes que nadie, tres días por semana. "No se lo cuentes a nadie o me lo piden todos."`,
    choices: [
      { id: "aceptar", label: "Aceptar los tres días", outcome: "Duermes seis horas y creces por dentro.", apply: (s) => { stat(s, "overall", 3); stat(s, "fitness", -6); rel(s, "coach", 10); } },
      { id: "uno", label: "Negociar un solo día", outcome: "\"Un día es mejor que ninguno\", concede.", apply: (s) => { stat(s, "overall", 1); rel(s, "coach", 4); stat(s, "fitness", -2); } },
      { id: "no", label: "Decir que prefieres descansar bien", outcome: "Lo respeta y no vuelve a ofrecértelo.", apply: (s) => { stat(s, "fitness", 8); rel(s, "coach", -5); } },
    ],
  },
  {
    id: "v21_s_wifi",
    kicker: "Surrealismo",
    title: "El hotel sin wifi",
    image: "travel",
    category: "life",
    family: "away_hotel",
    rare: true,
    requires: (s) => s.age >= 17,
    text: () => `Concentración en un hotel rural sin cobertura, con una vaca mirando por la ventana del comedor y un televisor con dos canales. Veinticinco futbolistas y ninguna pantalla.`,
    choices: [
      { id: "cartas", label: "Organizar un torneo de cartas", outcome: "Nace una tradición que durará años.", apply: (s) => { rel(s, "dressing", 12); stat(s, "morale", 8); } },
      { id: "dormir", label: "Dormir once horas seguidas", outcome: "Te levantas nuevo. Ganáis 0-2.", apply: (s) => { stat(s, "fitness", 12); stat(s, "form", 5); } },
      { id: "vaca", label: "Hacerte una foto con la vaca", outcome: "El club la sube. La vaca tiene más 'me gusta' que tú.", apply: (s) => { stat(s, "fame", 5); rel(s, "fans", 6); stat(s, "morale", 5); } },
    ],
  },
  {
    id: "v21_s_barrio",
    kicker: "Familia",
    title: "El campo de tierra del barrio",
    image: "family",
    category: "life",
    family: "roots",
    requires: (s) => s.fame >= 15,
    text: () => `El club de tu barrio va a perder el campo de tierra donde aprendiste. Necesitan 40.000 euros y tu apellido en un cartel.`,
    choices: [
      { id: "pagar", label: "Pagarlo entero y sin cartel", outcome: "Nadie lo sabe. Tú pasas por delante y sonríes.", apply: (s) => { money(s, -2); stat(s, "morale", 12); rel(s, "family", 10); } },
      { id: "cartel", label: "Pagarlo con tu nombre en la puerta", outcome: "El barrio entero va a la inauguración.", apply: (s) => { money(s, -2); stat(s, "fame", 8); rel(s, "fans", 10); } },
      { id: "gestion", label: "Buscar patrocinadores en vez de poner dinero", outcome: "Tardas tres meses y consigues el doble.", apply: (s) => { rel(s, "agent", 6); rel(s, "fans", 8); stat(s, "discipline", 5); } },
    ],
  },
  {
    id: "v21_s_arbitro",
    kicker: "Fútbol",
    title: "El árbitro te reconoce",
    image: "match",
    category: "club",
    family: "referee",
    requires: (s) => s.age >= 18,
    text: (s) => `Antes del saque, el árbitro te dice bajito: "jugué contra tu padre en juveniles". Luego te pita dos faltas dudosas en contra en diez minutos.`,
    choices: [
      { id: "ironia", label: "Recordárselo con ironía", outcome: "Amarilla al minuto siguiente. Mereció la pena a medias.", apply: (s) => { stat(s, "discipline", -6); stat(s, "morale", 4); rel(s, "dressing", 4); } },
      { id: "callar", label: "Morderte la lengua todo el partido", outcome: "Al final te pita un penalti clarísimo a favor.", apply: (s) => { stat(s, "discipline", 8); stat(s, "form", 4); } },
    ],
  },
  {
    id: "v21_s_periodista",
    kicker: "Prensa",
    title: "La periodista que te avisa",
    image: "press",
    category: "press",
    family: "press_deal",
    requires: (s) => s.fame >= 22,
    text: (s) => `${who(s, "press")} te llama antes de publicar: tiene una información sobre tu renovación y te da cuatro horas para confirmarla o desmentirla.`,
    choices: [
      { id: "confirmar", label: "Confirmársela en off", outcome: "Publica bien y te debe una para siempre.", apply: (s) => { npcMood(s, "press", 15); stat(s, "fame", 6); rel(s, "coach", -4); } },
      { id: "desmentir", label: "Desmentirla aunque sea cierta", outcome: "Publica igual. Y ya no vuelve a avisarte.", apply: (s) => { npcMood(s, "press", -18); rel(s, "coach", 5); conflict(s, "Desmentiste una información cierta a la prensa"); } },
      { id: "nada", label: "No coger el teléfono", outcome: "Sale sin tu versión y con un titular más duro.", apply: (s) => { stat(s, "fame", 4); rel(s, "fans", -4); } },
    ],
  },
  {
    id: "v21_s_rival_amigo",
    kicker: "Vestuario",
    title: "Tu amigo firma por el rival",
    image: "locker",
    category: "club",
    family: "friend_rival",
    requires: (s) => s.age >= 19,
    text: (s) => `${who(s, "friend")} se va al eterno rival del ${short(s)} y te lo cuenta la noche antes de que sea oficial, en el aparcamiento.`,
    choices: [
      { id: "abrazo", label: "Abrazarle y desearle lo mejor", outcome: "Os veréis en el derbi. Y os saludaréis.", apply: (s) => { rel(s, "dressing", 6); stat(s, "morale", -4); npcMood(s, "friend", 15); } },
      { id: "frio", label: "Cortar la conversación en seco", outcome: "Nunca más habláis de eso. Ni de nada.", apply: (s) => { stat(s, "morale", -6); npcMood(s, "friend", -20); rel(s, "fans", 4); } },
      { id: "publico", label: "Publicar una foto vuestra de canteranos", outcome: "La afición se divide entre la ternura y el insulto.", apply: (s) => { stat(s, "fame", 6); rel(s, "fans", -3); npcMood(s, "friend", 10); } },
    ],
  },
  {
    id: "v21_s_gemelo_lesion",
    kicker: "Médico",
    title: "El gemelo que avisa",
    image: "injury",
    category: "medical",
    family: "hidden_pain",
    requires: (s) => !s.injury && s.age >= 18,
    text: () => `Notas un pinchazo en el gemelo en el último ejercicio. El fisio no ha visto nada y mañana hay partido grande. Solo lo sabes tú.`,
    choices: [
      { id: "decir", label: "Decírselo al fisio ahora mismo", outcome: "Te dejan fuera un partido y te ahorran seis.", apply: (s) => { stat(s, "fitness", 10); rel(s, "coach", -3); stat(s, "form", -3); } },
      { id: "jugar", label: "Callarte y jugar", outcome: "Aguantas 55 minutos. Luego el gemelo dice basta.", apply: (s) => { injure(s, 4, "Rotura fibrilar en el gemelo"); rel(s, "coach", -4); } },
      { id: "infiltrar", label: "Pedir infiltración sin contar el detalle", outcome: "Juegas sin dolor y con una deuda con tu cuerpo.", apply: (s) => { stat(s, "form", 6); stat(s, "fitness", -12); flag(s, "abuso_infiltraciones"); } },
    ],
  },
  {
    id: "v21_s_tiktok_nino",
    kicker: "Fama",
    title: "El niño que te imita",
    image: "stadium",
    category: "gossip",
    family: "fan_kid",
    requires: (s) => s.fame >= 25,
    text: (s) => `Un niño de nueve años se hace viral imitando tu forma de celebrar, tu peinado y hasta tu manera de atarte las botas. Su madre te escribe pidiendo una videollamada.`,
    choices: [
      { id: "llamar", label: "Hacer la videollamada esa misma noche", outcome: "Diez minutos que le cambian el año a alguien.", apply: (s) => { rel(s, "fans", 10); stat(s, "morale", 10); } },
      { id: "invitar", label: "Invitarle al entrenamiento", outcome: "Sale del campo con tus botas y la boca abierta.", apply: (s) => { rel(s, "fans", 14); stat(s, "fame", 6); rel(s, "coach", 3); } },
      { id: "nada", label: "No responder: hoy no puedes con nada", outcome: "Te acuerdas dos semanas después, a destiempo.", apply: (s) => { stat(s, "morale", -5); } },
    ],
  },
  {
    id: "v21_s_multa",
    kicker: "Entrenador",
    title: "La multa por dos minutos",
    image: "office",
    category: "club",
    family: "discipline_fine",
    requires: (s) => s.age >= 17,
    text: (s) => `${who(s, "coach")} multa a todo el grupo porque tú llegaste dos minutos tarde por un atasco. Nadie dice nada, pero todos lo saben.`,
    choices: [
      { id: "pagar", label: "Pagar la multa de todos de tu bolsillo", outcome: "El vestuario cambia el gesto en cuanto lo anuncias.", apply: (s) => { money(s, -1); rel(s, "dressing", 12); rel(s, "coach", 4); } },
      { id: "discutir", label: "Discutirlo con el míster delante del grupo", outcome: "Ganas la discusión y pierdes tres partidos de titularidad.", apply: (s) => { rel(s, "coach", -12); rel(s, "dressing", 6); stat(s, "form", -4); conflict(s, "Discutiste una multa delante del vestuario"); } },
      { id: "asumir", label: "Asumirlo en silencio y llegar el primero un mes", outcome: "Nadie lo comenta. Todos lo notan.", apply: (s) => { stat(s, "discipline", 12); rel(s, "coach", 8); } },
    ],
  },
  {
    id: "v21_s_influencer",
    kicker: "Fama",
    title: "Una cita a ciegas de una marca",
    image: "office",
    category: "gossip",
    family: "brand_stunt",
    requires: (s) => s.fame >= 30,
    text: (s) => `Una marca de ropa quiere montarte una "cita sorpresa" grabada con una influencer. ${agent(s)} dice que es dinero fácil y una semana de tendencia.`,
    choices: [
      { id: "aceptar", label: "Aceptar el paripé", outcome: "Cobras, gustas y te sientes un poco producto.", apply: (s) => { money(s, 2); stat(s, "fame", 12); stat(s, "morale", -5); rel(s, "agent", 8); } },
      { id: "rechazar", label: "Rechazarlo de plano", outcome: "Tu representante lo apunta en su libreta de 'oportunidades perdidas'.", apply: (s) => { rel(s, "agent", -8); stat(s, "discipline", 6); stat(s, "morale", 4); } },
      { id: "contra", label: "Proponer otra campaña con tu barrio", outcome: "La marca acepta a medias y sale mejor de lo esperado.", apply: (s) => { money(s, 1); rel(s, "fans", 10); stat(s, "fame", 6); } },
    ],
  },
  {
    id: "v21_s_capitan_borracho",
    kicker: "Vestuario",
    title: "El capitán te pide un favor raro",
    image: "locker",
    category: "club",
    family: "captain_secret",
    requires: (s) => s.age >= 19,
    text: (s) => `${who(s, "captain")} te pide que le cubras: quiere saltarse la concentración dos horas por un tema familiar que no explica.`,
    choices: [
      { id: "cubrir", label: "Cubrirle sin preguntar", outcome: "Vuelve a tiempo. Y desde ese día te defiende en todas partes.", apply: (s) => { npcMood(s, "captain", 20); rel(s, "dressing", 8); flag(s, "favor_capitan"); } },
      { id: "preguntar", label: "Cubrirle, pero exigiendo saber por qué", outcome: "Te cuenta algo que no esperabas y te pide silencio.", apply: (s) => { npcMood(s, "captain", 10); stat(s, "morale", -3); flag(s, "favor_capitan"); } },
      { id: "negar", label: "Negarte: no quieres líos", outcome: "Se va igual. Y ahora hay una distancia.", apply: (s) => { npcMood(s, "captain", -15); rel(s, "dressing", -6); stat(s, "discipline", 6); } },
    ],
  },
  {
    id: "v21_s_favor_devuelto",
    kicker: "Callback",
    title: "El capitán devuelve el favor",
    image: "locker",
    category: "club",
    family: "callback_v21",
    requires: (s) => on(s, "favor_capitan"),
    text: (s) => `Reunión con el cuerpo técnico sobre minutos. ${who(s, "captain")} entra sin que nadie le llame y habla de ti durante cuatro minutos seguidos.`,
    choices: [
      { id: "gracias", label: "Agradecérselo después, a solas", outcome: "\"Estamos en paz\", dice, y se va a la ducha.", apply: (s) => { rel(s, "coach", 8); npcMood(s, "captain", 8); stat(s, "morale", 8); s.flags["favor_capitan"] = 0; } },
      { id: "aprovechar", label: "Aprovechar el momento para pedir titularidad", outcome: "Al míster no le gusta la encerrona.", apply: (s) => { rel(s, "coach", -6); stat(s, "morale", 5); s.flags["favor_capitan"] = 0; } },
    ],
  },
  {
    id: "v21_s_mentira_paga",
    kicker: "Callback",
    title: "La gorra reaparece",
    image: "press",
    category: "press",
    family: "callback_v21",
    requires: (s) => on(s, "mentira_club"),
    text: (s) => `Un programa recupera la foto del reservado con un zoom brutal a tu gorra, la misma que llevas en el vídeo oficial del ${short(s)}. Te llaman del club.`,
    choices: [
      { id: "disculpa", label: "Pedir perdón al vestuario y al club", outcome: "Multa interna y asunto cerrado. Casi.", apply: (s) => { s.flags["mentira_club"] = 0; money(s, -1); rel(s, "coach", 6); stat(s, "discipline", 6); } },
      { id: "doble", label: "Sostener la mentira hasta el final", outcome: "Ya nadie te cree cuando dices la verdad.", apply: (s) => { s.flags["mentira_club"] = 0; rel(s, "coach", -10); rel(s, "fans", -8); stat(s, "fame", 6); } },
    ],
  },
  {
    id: "v21_s_infiltra_factura",
    kicker: "Callback",
    title: "La factura de las infiltraciones",
    image: "injury",
    category: "medical",
    family: "callback_v21",
    requires: (s) => on(s, "abuso_infiltraciones"),
    text: (s) => `${who(s, "physio")} pone la resonancia sobre la mesa sin decir nada durante diez segundos. "Esto no se cura con una aguja."`,
    choices: [
      { id: "parar", label: "Parar tres semanas y hacerlo bien", outcome: "Te pierdes partidos y salvas la temporada.", apply: (s) => { s.flags["abuso_infiltraciones"] = 0; stat(s, "fitness", 16); stat(s, "form", -5); rel(s, "coach", -3); note(s, "Frenaste a tiempo una lesión crónica.", "good"); } },
      { id: "seguir", label: "Seguir jugando con parches", outcome: "Dos meses después, el cuerpo pasa factura entera.", apply: (s) => { injure(s, 9, "Tendinopatía crónica"); s.flags["abuso_infiltraciones"] = 0; } },
    ],
  },
  {
    id: "v21_s_promesa_gol",
    kicker: "Callback",
    title: "El gol prometido",
    image: "celebration",
    category: "club",
    family: "callback_v21",
    requires: (s) => on(s, "padre_promesa") && s.age >= 18,
    text: () => `Marcas. Y lo primero que haces es buscar la fila 22 con la mirada, como llevas prometiendo desde hace dos años.`,
    choices: [
      { id: "senalar", label: "Señalar a la grada y quedarte quieto", outcome: "La foto acaba enmarcada en el salón de tus padres.", apply: (s) => { s.flags["padre_promesa"] = 0; rel(s, "family", 14); stat(s, "morale", 12); milestone(s, "Dedicaste tu gol a tu padre."); } },
      { id: "equipo", label: "Celebrarlo con el equipo primero", outcome: "Tu padre lo entiende. Igual demasiado bien.", apply: (s) => { s.flags["padre_promesa"] = 0; rel(s, "dressing", 8); rel(s, "family", 3); } },
    ],
  },
  {
    id: "v21_s_maluma_eco",
    kicker: "Callback",
    title: "Suena su canción en el estadio",
    image: "stadium",
    category: "gossip",
    family: "callback_v21",
    requires: (s) => on(s, "maluma_3") && s.fame >= 30,
    text: (s) => `El equipo rival pincha el tema de Malum-a en el calentamiento del derbi. Veinte mil personas cantándote el verso a la cara antes de empezar.`,
    choices: [
      { id: "aplaudir", label: "Aplaudir a la grada rival", outcome: "Se ríen y aplauden. Luego marcas y se callan.", apply: (s) => { stat(s, "form", 8); rel(s, "fans", 6); stat(s, "fame", 6); } },
      { id: "tapones", label: "Ponerte los cascos y no mirar", outcome: "Partido gris. La canción gana esta vez.", apply: (s) => { stat(s, "form", -5); stat(s, "morale", -4); } },
    ],
  },
  {
    id: "v21_s_agente_hermano",
    kicker: "Agente",
    title: "Tu hermano quiere ser tu representante",
    image: "agent",
    category: "agent",
    family: "family_business",
    requires: (s) => s.age >= 20,
    text: (s) => `Tu hermano mayor ha hecho un curso online y quiere llevarte él. ${agent(s)} se entera antes de que se lo cuentes.`,
    choices: [
      { id: "familia", label: "Darle una parcela pequeña (imagen y redes)", outcome: "Funciona. De momento.", apply: (s) => { rel(s, "family", 10); rel(s, "agent", -6); flag(s, "hermano_equipo"); } },
      { id: "no", label: "Decirle que no y explicarle por qué", outcome: "Cena tensa en Navidad. Y una relación salvada.", apply: (s) => { rel(s, "family", -6); rel(s, "agent", 6); stat(s, "discipline", 6); } },
      { id: "todo", label: "Dejarlo todo en sus manos", outcome: "Aprende sobre la marcha, y tú pagas las clases.", apply: (s) => { rel(s, "family", 14); rel(s, "agent", -20); money(s, -1); flag(s, "hermano_equipo"); } },
    ],
  },
  {
    id: "v21_s_mister_despedido",
    kicker: "Entrenador",
    title: "Van a echar al míster que te dio el debut",
    image: "office",
    category: "club",
    family: "coach_exit",
    requires: (s) => s.age >= 19 && s.rel.coach >= 55,
    text: (s) => `Tres derrotas y la directiva ya tiene sustituto. ${who(s, "coach")}, el que te puso cuando nadie te conocía, se juega el puesto el domingo.`,
    choices: [
      { id: "publico", label: "Defenderle públicamente en rueda de prensa", outcome: "El club no lo agradece. Él, para siempre.", apply: (s) => { rel(s, "coach", 12); npcMood(s, "coach", 20); stat(s, "fame", 5); flag(s, "defendi_mister"); } },
      { id: "campo", label: "Ganar el domingo y salvarle sin hablar", outcome: "Partidazo. Sigue una jornada más.", apply: (s) => { stat(s, "form", 8); rel(s, "coach", 8); } },
      { id: "nada", label: "No mojarte: los entrenadores pasan", outcome: "Frío y probablemente inteligente.", apply: (s) => { stat(s, "discipline", 4); npcMood(s, "coach", -10); } },
    ],
  },
  {
    id: "v21_s_apagon",
    kicker: "Surrealismo",
    title: "Apagón en el minuto 70",
    image: "stadium",
    category: "club",
    family: "weird_match",
    rare: true,
    requires: (s) => s.age >= 17,
    text: () => `Se va la luz del estadio con 1-1. Cuarenta minutos a oscuras, la afición encendiendo linternas del móvil y un speaker poniendo cumbia.`,
    choices: [
      { id: "cantar", label: "Salir al césped a animar a la grada", outcome: "Vídeo del año. Cuando vuelve la luz, ganáis.", apply: (s) => { rel(s, "fans", 14); stat(s, "fame", 8); stat(s, "form", 5); } },
      { id: "concentrado", label: "Quedarte en el vestuario concentrado", outcome: "Sales frío. Empate y a casa.", apply: (s) => { stat(s, "discipline", 6); stat(s, "form", -3); } },
    ],
  },
  {
    id: "v21_s_traduccion",
    kicker: "Humor",
    title: "La entrevista mal traducida",
    image: "press",
    category: "press",
    family: "lost_translation",
    requires: (s) => s.fame >= 28,
    text: (s) => `Un medio extranjero traduce tu entrevista y publica que quieres jugar "en un club de verdad". Tú dijiste "en un club de barrio de verdad". Media afición del ${short(s)} está encendida.`,
    choices: [
      { id: "audio", label: "Publicar el audio original completo", outcome: "Se desmonta en dos horas. El medio ni se disculpa.", apply: (s) => { rel(s, "fans", 8); stat(s, "discipline", 5); } },
      { id: "humor", label: "Contestar con humor y una foto en el bar del barrio", outcome: "Se convierte en la mejor jugada de comunicación del año.", apply: (s) => { rel(s, "fans", 12); stat(s, "fame", 8); stat(s, "morale", 6); } },
      { id: "nada", label: "No entrar al trapo", outcome: "Dura cuatro días. Cuatro días largos.", apply: (s) => { rel(s, "fans", -6); stat(s, "discipline", 6); } },
    ],
  },
  {
    id: "v21_s_deuda_amigo",
    kicker: "Vida",
    title: "El grupo de siempre y la cuenta de siempre",
    image: "family",
    category: "life",
    family: "old_crew",
    requires: (s) => s.age >= 19 && s.fame >= 18,
    text: () => `Cena con los amigos del barrio. Cuando llega la cuenta, todos miran el móvil a la vez. Van cuatro cenas seguidas.`,
    choices: [
      { id: "pagar", label: "Pagar y no decir nada nunca", outcome: "Tú lo puedes pagar. La sensación no se paga.", apply: (s) => { money(s, -1); stat(s, "morale", -4); } },
      { id: "hablar", label: "Decirlo en voz alta, con calma", outcome: "Incómodo diez minutos, sano diez años.", apply: (s) => { stat(s, "morale", 8); stat(s, "discipline", 5); } },
      { id: "mitad", label: "Proponer bote fijo para las próximas", outcome: "Funciona. Y hasta se ríen del tema.", apply: (s) => { stat(s, "morale", 5); rel(s, "family", 4); } },
    ],
  },
  {
    id: "v21_s_ojeador_falso",
    kicker: "Mercado",
    title: "Un ojeador que nadie conoce",
    image: "office",
    category: "market",
    family: "fake_scout",
    requires: (s) => s.age >= 18,
    text: (s) => `Un hombre con acreditación caducada dice representar a un club de la Premier y te ofrece una reunión sin ${s.agentName} delante.`,
    choices: [
      { id: "ir", label: "Ir a la reunión solo", outcome: "Café de dos horas y ninguna llamada después.", apply: (s) => { rel(s, "agent", -10); stat(s, "morale", -4); flag(s, "reunion_oculta"); } },
      { id: "agente", label: "Pasárselo a tu representante", outcome: "Lo comprueba en veinte minutos: era mentira.", apply: (s) => { rel(s, "agent", 10); stat(s, "discipline", 5); } },
      { id: "club", label: "Informar al club directamente", outcome: "Seguridad del club le retira la acreditación.", apply: (s) => { rel(s, "coach", 6); rel(s, "agent", 3); } },
    ],
  },
  {
    id: "v21_s_reunion_filtrada",
    kicker: "Callback",
    title: "Alguien te vio en aquella cafetería",
    image: "press",
    category: "market",
    family: "callback_v21",
    requires: (s) => on(s, "reunion_oculta"),
    text: (s) => `Sale una foto tuya con el falso ojeador. El titular habla de "reuniones secretas" y en el ${short(s)} nadie te pregunta a la cara.`,
    choices: [
      { id: "explicar", label: "Explicarlo todo en el vestuario", outcome: "Se ríen del personaje y del titular.", apply: (s) => { s.flags["reunion_oculta"] = 0; rel(s, "dressing", 8); rel(s, "coach", 4); } },
      { id: "silencio", label: "No dar explicaciones a nadie", outcome: "La duda se queda flotando toda la temporada.", apply: (s) => { s.flags["reunion_oculta"] = 0; rel(s, "coach", -8); rel(s, "fans", -5); } },
    ],
  },
  {
    id: "v21_s_canterano_mira",
    kicker: "Club",
    title: "Un canterano te mira como tú mirabas",
    image: "training",
    category: "training",
    family: "next_gen",
    requires: (s) => s.age >= 23,
    text: (s) => `Un chaval de 16 años sube a entrenar con vosotros en el ${club(s)} y no despega los ojos de ti. Se coloca detrás en cada rondo, imitando tu control.`,
    choices: [
      { id: "adoptar", label: "Adoptarle: vestuario, hielo y consejos", outcome: "Años después contará esto en su primera entrevista.", apply: (s) => { rel(s, "dressing", 10); rel(s, "coach", 6); stat(s, "morale", 8); } },
      { id: "exigir", label: "Exigirle duro desde el primer día", outcome: "Llora un martes y agradece un mayo.", apply: (s) => { rel(s, "coach", 8); stat(s, "discipline", 6); } },
      { id: "ignorar", label: "Ir a lo tuyo: bastante tienes", outcome: "Nadie te lo reprocha. Nadie te lo agradece.", apply: (s) => { stat(s, "fitness", 4); } },
    ],
  },
  {
    id: "v21_s_dorsal",
    kicker: "Club",
    title: "El dorsal del mito",
    image: "locker",
    category: "club",
    family: "shirt_number",
    requires: (s) => s.age >= 20 && s.fame >= 25,
    text: (s) => `El club te ofrece el dorsal de la última leyenda del ${short(s)}. La peña más ruidosa ya ha dicho en redes que "ese número no se toca".`,
    choices: [
      { id: "cogerlo", label: "Cogerlo y asumir la presión", outcome: "Cada partido se mide contra un fantasma.", apply: (s) => { stat(s, "fame", 10); rel(s, "fans", -4); stat(s, "form", 4); flag(s, "dorsal_mito"); } },
      { id: "rechazar", label: "Rechazarlo por respeto", outcome: "La grada te canta el nombre en el minuto uno.", apply: (s) => { rel(s, "fans", 12); stat(s, "morale", 6); } },
      { id: "pedir", label: "Pedir permiso al mito por teléfono", outcome: "Te dice que sí y sale a la foto contigo.", apply: (s) => { rel(s, "fans", 10); stat(s, "fame", 8); flag(s, "dorsal_mito"); } },
    ],
  },
  {
    id: "v21_s_avion",
    kicker: "Surrealismo",
    title: "Avión con turbulencias",
    image: "travel",
    category: "life",
    family: "flight_fear",
    rare: true,
    requires: (s) => s.age >= 18,
    text: (s) => `Vuelo europeo, veinte minutos de turbulencias serias. ${who(s, "captain")} reza en voz alta y el míster reparte caramelos como si eso arreglara algo.`,
    choices: [
      { id: "calmar", label: "Ponerte a hacer bromas para calmar al grupo", outcome: "Aterrizáis y todos te aplauden a ti, no al piloto.", apply: (s) => { rel(s, "dressing", 12); stat(s, "morale", 6); } },
      { id: "miedo", label: "Reconocer que te ha dado pánico", outcome: "Media plantilla admite lo mismo. Se rompe una tontería.", apply: (s) => { rel(s, "dressing", 8); stat(s, "morale", 4); } },
      { id: "dormir", label: "Fingir que duermes", outcome: "Nadie se lo cree, pero funciona para ti.", apply: (s) => { stat(s, "fitness", 5); } },
    ],
  },
  {
    id: "v21_s_pretemporada_calor",
    kicker: "Pretemporada",
    title: "Doble sesión a 39 grados",
    image: "training",
    category: "preseason",
    family: "hot_camp",
    requires: (s) => s.age >= 17,
    text: (s) => `Segunda sesión del día, 39 grados y ${who(s, "assistant")} contando series con el cronómetro en la mano. Dos compañeros ya han vomitado detrás de la portería.`,
    choices: [
      { id: "tirar", label: "Tirar del grupo hasta el final", outcome: "Acabas el último ejercicio marcando el ritmo.", apply: (s) => { rel(s, "coach", 10); rel(s, "dressing", 8); stat(s, "fitness", -8); stat(s, "overall", 2); } },
      { id: "dosificar", label: "Dosificar para no romperte", outcome: "Llegas entero a agosto. El míster lo apunta igual.", apply: (s) => { stat(s, "fitness", 8); rel(s, "coach", -4); } },
      { id: "parar", label: "Pedir parar por el grupo", outcome: "El míster corta la sesión y pierde diez minutos de discurso.", apply: (s) => { rel(s, "dressing", 12); rel(s, "coach", -8); } },
    ],
  },
  {
    id: "v21_s_pretemporada_gira",
    kicker: "Pretemporada",
    title: "Gira comercial en Asia",
    image: "travel",
    category: "preseason",
    family: "tour_asia",
    requires: (s) => s.stage === "first" || s.fame >= 30,
    text: () => `Doce mil kilómetros, tres partidos en seis días y cuatro actos comerciales. El cuerpo médico avisa: esto no es pretemporada, es marketing.`,
    choices: [
      { id: "profesional", label: "Cumplir con todo sin una queja", outcome: "El club te marca como jugador de confianza.", apply: (s) => { rel(s, "coach", 8); stat(s, "fitness", -10); stat(s, "fame", 8); money(s, 1); } },
      { id: "priorizar", label: "Saltarte dos actos para descansar", outcome: "Marketing se enfada, tus piernas te lo agradecen.", apply: (s) => { stat(s, "fitness", 8); rel(s, "coach", -5); stat(s, "fame", -3); } },
    ],
  },
  {
    id: "v21_s_filial_puente",
    kicker: "Club",
    title: "Bajar al filial una semana",
    image: "training",
    category: "club",
    family: "reserve_drop",
    requires: (s) => s.stage !== "youth" && s.age <= 22,
    text: (s) => `${who(s, "coach")} te propone bajar al filial una semana para jugar 90 minutos en vez de calentar en Primera. "Es una decisión tuya, y me la vas a decir hoy."`,
    choices: [
      { id: "bajar", label: "Bajar y jugar noventa minutos", outcome: "Dos goles en un campo con tres cámaras. Y ritmo real.", apply: (s) => { stat(s, "overall", 3); stat(s, "form", 8); stat(s, "fame", -3); } },
      { id: "quedarse", label: "Quedarte arriba aunque no juegues", outcome: "Ves el partido desde el banquillo con la mandíbula apretada.", apply: (s) => { stat(s, "fame", 3); stat(s, "form", -4); rel(s, "coach", -3); } },
    ],
  },
  {
    id: "v21_s_debut_pequeno",
    kicker: "Fútbol",
    title: "Cinco minutos y una jugada",
    image: "match",
    category: "club",
    family: "few_minutes",
    requires: (s) => s.age <= 21,
    text: (s) => `Sales en el 88 con 2-1 a favor. El míster solo te pide una cosa: "no la pierdas". Y en tu segunda acción tienes un dos contra uno claro.`,
    choices: [
      { id: "arriesgar", label: "Encarar y buscar el gol", outcome: "Te la quitan en el borde del área. Nadie olvida esas cosas.", apply: (s) => { stat(s, "form", -4); rel(s, "coach", -6); stat(s, "fame", 3); } },
      { id: "pasar", label: "Pasarla y jugar el reloj", outcome: "El míster te aplaude desde la banda.", apply: (s) => { rel(s, "coach", 10); stat(s, "discipline", 6); } },
      { id: "falta", label: "Provocar una falta lejos de tu área", outcome: "Listo. Se acaba el partido con el balón en la esquina.", apply: (s) => { rel(s, "coach", 8); rel(s, "dressing", 6); } },
    ],
  },
  {
    id: "v21_s_pareja_carrera",
    kicker: "Vida",
    title: "Su trabajo o tu traspaso",
    image: "family",
    category: "life",
    family: "partner_career",
    requires: (s) => s.age >= 22,
    text: (s) => `${who(s, "partner")} acaba de conseguir el trabajo por el que llevaba años peleando. Y a ti te llaman de un club a 900 kilómetros.`,
    choices: [
      { id: "quedarse", label: "Frenar la salida esta temporada", outcome: "Renuncias a dinero y ganas una casa que funciona.", apply: (s) => { npcMood(s, "partner", 20); rel(s, "family", 12); rel(s, "agent", -10); flag(s, "freno_traspaso"); } },
      { id: "irse", label: "Aceptar y buscar la fórmula a distancia", outcome: "Aviones, vídeollamadas y silencios raros los domingos.", apply: (s) => { npcMood(s, "partner", -15); rel(s, "family", -8); rel(s, "agent", 10); money(s, 2); } },
      { id: "hablar", label: "Decidirlo juntos, sin prisa, aunque caiga la oferta", outcome: "La oferta se enfría. La relación no.", apply: (s) => { npcMood(s, "partner", 12); stat(s, "morale", 6); rel(s, "agent", -5); } },
    ],
  },
  {
    id: "v21_s_grada_insulto",
    kicker: "Afición",
    title: "El insulto desde primera fila",
    image: "stadium",
    category: "club",
    family: "stand_abuse",
    requires: (s) => s.age >= 18,
    text: () => `Un tipo de primera fila lleva media hora insultando a tu madre con nombre y apellidos. Los compañeros lo han oído. El árbitro no.`,
    choices: [
      { id: "parar", label: "Parar el partido y señalarlo",  outcome: "Protocolo activado. Le sacan del estadio entre aplausos.", apply: (s) => { rel(s, "fans", 10); stat(s, "fame", 8); stat(s, "form", -3); } },
      { id: "tragar", label: "Tragar y seguir jugando", outcome: "Te lo llevas puesto a casa esa noche.", apply: (s) => { stat(s, "morale", -8); stat(s, "discipline", 6); } },
      { id: "encarar", label: "Encararte con él", outcome: "Amarilla, foto y debate de dos días en las tertulias.", apply: (s) => { stat(s, "discipline", -8); stat(s, "fame", 8); rel(s, "dressing", 6); } },
    ],
  },
  {
    id: "v21_s_renovacion_baja",
    kicker: "Mercado",
    title: "Renovar a la baja para que fichen a otro",
    image: "office",
    category: "market",
    family: "wage_cut",
    requires: (s) => s.age >= 21 && s.stage === "first",
    text: (s) => `El ${short(s)} te pide bajarte el sueldo un 15% para poder fichar a un delantero de garantías. ${agent(s)} dice que ni loco.`,
    choices: [
      { id: "aceptar", label: "Aceptar la rebaja", outcome: "El vestuario se entera. Y el club también, para siempre.", apply: (s) => { money(s, -1); rel(s, "coach", 10); rel(s, "dressing", 10); rel(s, "agent", -12); flag(s, "rebaja_sueldo"); } },
      { id: "negociar", label: "Aceptar solo con variables por objetivos", outcome: "Se firma en dos días y todos salvan la cara.", apply: (s) => { rel(s, "agent", 4); rel(s, "coach", 6); stat(s, "discipline", 5); } },
      { id: "no", label: "Negarte: no es tu problema", outcome: "El fichaje no llega. Y algunos te miran raro.", apply: (s) => { rel(s, "agent", 10); rel(s, "dressing", -6); money(s, 1); } },
    ],
  },
];
