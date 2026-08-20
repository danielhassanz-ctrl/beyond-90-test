import { clubById } from "./data";
import { flag, injure, milestone, note, rel, stat } from "./mutate";
import { npcMood, npcName, who } from "./npc";
import type { GameEvent, GameState } from "./types";

/* =========================================================================
 * BANCO NARRATIVO NUEVO · BLOQUE 2
 * Vida personal · emoción · humor · surrealismo plausible · mercado ·
 * carrera madura. Todas las escenas son nuevas, con respuestas propias.
 * ========================================================================= */

const nick = (s: GameState) => s.player.nickname || s.player.name.split(" ")[0] || s.player.name;
const short = (s: GameState) => clubById(s.clubId).short;
const club = (s: GameState) => clubById(s.clubId).name;

function promise(s: GameState, text: string) {
  if (!s.memory.promises.includes(text)) s.memory.promises.push(text);
}
function conflict(s: GameState, text: string) {
  if (!s.memory.conflicts.includes(text)) s.memory.conflicts.push(text);
}

/* ------------------------------ VIDA PERSONAL ---------------------------- */
const LIFE: GameEvent[] = [
  {
    id: "nb_l_mudanza",
    kicker: "Casa",
    title: "Cajas en el suelo",
    image: "family",
    category: "life",
    family: "moving",
    requires: (s) => s.age >= 18 && !s.flags["mudado"],
    text: (s) => `Primer piso solo, en ${clubById(s.clubId).city}. Nevera vacía, wifi sin instalar y una cama en medio del salón porque no cabía por la puerta del dormitorio.`,
    choices: [
      { id: "solo", label: "Aprender a vivir solo del todo", outcome: "Tres semanas de comida quemada y una independencia que se nota en el campo.", apply: (s) => { flag(s, "mudado"); stat(s, "morale", 5); stat(s, "discipline", 6); rel(s, "family", -3); } },
      { id: "madre", label: "Pedirle a tu madre que se venga un mes", outcome: "Vuelves a comer bien y a discutir por la calefacción.", apply: (s) => { flag(s, "mudado"); rel(s, "family", 12); stat(s, "fitness", 6); stat(s, "morale", 3); } },
      { id: "companero", label: "Compartir piso con un compañero del filial", outcome: "Menos silencio, más PlayStation y horarios peligrosos.", apply: (s) => { flag(s, "mudado"); rel(s, "dressing", 10); stat(s, "fitness", -3); } },
    ],
  },
  {
    id: "nb_l_pareja_horarios",
    kicker: "Pareja",
    title: "\"Nunca estás\"",
    image: "family",
    category: "life",
    family: "partner",
    requires: (s) => s.age >= 19,
    text: (s) => `${who(s, "partner")} lo dice sin gritar, que es lo que más asusta: "No me quejo del fútbol. Me quejo de que cuando estás en casa tampoco estás".`,
    choices: [
      { id: "escuchar", label: "Sentarte y escuchar hasta el final", outcome: "Dos horas. No se arregla, pero se abre una puerta.", apply: (s) => { npcMood(s, "partner", 12); stat(s, "morale", 6); rel(s, "family", 6); } },
      { id: "viaje", label: "Reservar tres días juntos en el parón", outcome: "Funciona. Vuelves con la cabeza limpia.", apply: (s) => { npcMood(s, "partner", 14); stat(s, "morale", 9); s.wealth = Math.max(0, (s.wealth ?? 0) - 1); stat(s, "fitness", -2); } },
      { id: "defender", label: "Defenderte: \"esto es mi trabajo\"", outcome: "Tiene razón y tú también. Eso nunca acaba bien.", apply: (s) => { npcMood(s, "partner", -12); stat(s, "morale", -6); conflict(s, "Discusión seria con tu pareja"); } },
    ],
  },
  {
    id: "nb_l_amigo_interesado",
    kicker: "Pueblo",
    title: "El amigo que vuelve con un proyecto",
    image: "office",
    category: "life",
    family: "old_friends",
    requires: (s) => s.age >= 19 && s.fame >= 22,
    text: () => `Un amigo del barrio al que no ves desde hace cuatro años aparece con un dossier plastificado. Franquicia de hamburguesas. "Solo necesito que pongas la cara. Y un poco de entrada."`,
    choices: [
      { id: "invertir", label: "Poner el dinero", outcome: "Puede salir bien. Puede ser la última vez que le veas.", apply: (s) => { s.wealth = Math.max(0, (s.wealth ?? 0) - 2); flag(s, "inversion_amigo"); stat(s, "morale", 3); } },
      { id: "cara", label: "Poner la cara, no el dinero", outcome: "Se le tuerce el gesto. Acepta.", apply: (s) => { stat(s, "fame", 4); stat(s, "morale", 2); } },
      { id: "no", label: "Decir que no y pagar la comida", outcome: "Silencio hasta el postre. Y un mensaje raro por la noche.", apply: (s) => { stat(s, "morale", -4); stat(s, "discipline", 4); } },
    ],
  },
  {
    id: "nb_l_inversion_falla",
    kicker: "Callback",
    title: "La franquicia cierra",
    image: "office",
    category: "life",
    family: "callback",
    requires: (s) => (s.flags["inversion_amigo"] ?? 0) === 1,
    text: () => `Tres locales, ninguno abierto y un amigo que no coge el teléfono. La gestoría te manda un correo con la palabra "disolución" en el asunto.`,
    choices: [
      { id: "denunciar", label: "Ponerlo en manos de abogados", outcome: "Recuperas algo de dinero y pierdes al amigo del todo.", apply: (s) => { s.wealth = (s.wealth ?? 0) + 1; stat(s, "morale", -5); s.flags["inversion_amigo"] = 0; conflict(s, "Demandaste a un amigo de la infancia"); } },
      { id: "asumir", label: "Asumir la pérdida y cerrar el tema", outcome: "Caro como aprendizaje. Barato como paz mental.", apply: (s) => { stat(s, "morale", 4); stat(s, "discipline", 6); s.flags["inversion_amigo"] = 0; } },
    ],
  },
  {
    id: "nb_l_cumple",
    kicker: "Cumpleaños",
    title: "Cumples años en concentración",
    image: "travel",
    category: "life",
    family: "birthday",
    requires: (s) => s.age >= 18,
    text: (s) => `Hotel a 400 kilómetros, tarta de la cocina del hotel y treinta tíos cantándote fatal. ${who(s, "captain")} te regala unas chanclas usadas envueltas en papel de periódico.`,
    choices: [
      { id: "reir", label: "Ponerte las chanclas para cenar", outcome: "Cena histórica. Foto que acaba en el museo del club.", apply: (s) => { rel(s, "dressing", 10); stat(s, "morale", 8); } },
      { id: "llamar", label: "Escaparte a llamar a casa", outcome: "Tres minutos de nostalgia bien invertidos.", apply: (s) => { rel(s, "family", 9); stat(s, "morale", 5); } },
    ],
  },
  {
    id: "nb_l_nacimiento",
    kicker: "Vida",
    title: "Vas a ser padre",
    image: "family",
    category: "life",
    family: "parenthood",
    requires: (s) => s.age >= 24 && !s.flags["hijo"],
    text: (s) => `${who(s, "partner")} te lo dice en el coche, parados en un semáforo. El semáforo cambia dos veces y no arrancas.`,
    choices: [
      { id: "todo", label: "Prometer estar en todo lo que puedas", outcome: "Cambia tu forma de entrenar y de discutir.", apply: (s) => { flag(s, "hijo"); rel(s, "family", 16); npcMood(s, "partner", 15); stat(s, "morale", 12); promise(s, "Prometiste estar presente como padre"); milestone(s, "Vas a ser padre."); } },
      { id: "miedo", label: "Reconocer que te da pánico", outcome: "Sinceridad incómoda que os une más que una promesa fácil.", apply: (s) => { flag(s, "hijo"); rel(s, "family", 10); npcMood(s, "partner", 8); stat(s, "morale", 5); milestone(s, "Vas a ser padre."); } },
    ],
  },
  {
    id: "nb_l_dinero_familia",
    kicker: "Dinero",
    title: "La hipoteca de tus padres",
    image: "family",
    category: "life",
    family: "money_family",
    requires: (s) => s.age >= 20 && (s.wealth ?? 0) >= 2,
    text: () => `Tu padre no pide nada, nunca. Por eso cuando dice "este mes ha sido complicado" y cambia de tema rápido, tú te quedas mirando el móvil con la app del banco abierta.`,
    choices: [
      { id: "cancelar", label: "Cancelarles la hipoteca sin avisar", outcome: "Llamada de tu madre a las once de la noche, llorando. Merece la pena.", apply: (s) => { s.wealth = Math.max(0, (s.wealth ?? 0) - 3); rel(s, "family", 18); stat(s, "morale", 12); milestone(s, "Le quitaste la hipoteca a tu familia."); } },
      { id: "mensual", label: "Mandarles una cantidad fija cada mes", outcome: "Discreto y sostenible.", apply: (s) => { s.wealth = Math.max(0, (s.wealth ?? 0) - 1); rel(s, "family", 10); } },
      { id: "esperar", label: "Esperar a tener el próximo contrato", outcome: "Es razonable. Y te da rabia que lo sea.", apply: (s) => { stat(s, "morale", -5); } },
    ],
  },
  {
    id: "nb_l_vacaciones",
    kicker: "Verano",
    title: "Tres semanas sin balón",
    image: "travel",
    category: "life",
    family: "holiday",
    requires: (s) => s.age >= 18,
    text: () => `Fin de temporada. El preparador físico te da un plan de mantenimiento en un PDF que ya sabe que no vas a abrir del todo.`,
    choices: [
      { id: "cumplir", label: "Cumplirlo a rajatabla", outcome: "Vuelves el primer día siendo el que mejor está. Se nota todo el año.", apply: (s) => { stat(s, "fitness", 12); stat(s, "overall", 2); stat(s, "morale", -2); } },
      { id: "desconectar", label: "Desconectar del todo", outcome: "Vuelves feliz y pesado. Se arregla en dos semanas.", apply: (s) => { stat(s, "morale", 12); stat(s, "fitness", -8); } },
      { id: "medio", label: "Mitad playa, mitad gimnasio", outcome: "Ni lo uno ni lo otro. Suficiente.", apply: (s) => { stat(s, "fitness", 5); stat(s, "morale", 6); } },
    ],
  },
];

/* --------------------------------- EMOCIÓN -------------------------------- */
const EMOTION: GameEvent[] = [
  {
    id: "nb_e_miedo_volver",
    kicker: "Rehabilitación",
    title: "Miedo a apoyar la pierna",
    image: "injury",
    category: "medical",
    family: "injury_fear",
    requires: (s) => !!s.injury || (s.flags["volviendo"] ?? 0) === 1,
    text: (s) => `Primer entrenamiento con el grupo desde ${s.memory.lastInjuryLabel ?? "la lesión"}. El cuerpo está listo según los tests. La cabeza frena medio segundo antes de cada disputa y ese medio segundo lo ve todo el mundo.`,
    choices: [
      { id: "forzar", label: "Meter la pierna en la primera disputa fuerte", outcome: "Duele el golpe y desaparece el miedo. Riesgo asumido.", apply: (s) => { stat(s, "form", 8); stat(s, "morale", 8); stat(s, "fitness", -4); } },
      { id: "psicologo", label: "Hablarlo con el psicólogo del club", outcome: "Dos sesiones y un plan. Menos épico, más eficaz.", apply: (s) => { stat(s, "morale", 10); stat(s, "form", 5); rel(s, "coach", 4); } },
      { id: "ocultar", label: "Disimular y no contárselo a nadie", outcome: "Aguantas semanas jugando al 70%.", apply: (s) => { stat(s, "form", -5); stat(s, "morale", -6); flag(s, "miedo_oculto"); } },
    ],
  },
  {
    id: "nb_e_mentor",
    kicker: "Noticia",
    title: "Se retira el que te enseñó",
    image: "locker",
    category: "life",
    family: "mentor",
    requires: (s) => s.age >= 19,
    text: (s) => `${who(s, "captain")} anuncia que lo deja al final de temporada. Fue el primero que te dijo tu nombre en este vestuario, cuando aún no lo sabía nadie.`,
    choices: [
      { id: "carta", label: "Escribirle una carta a mano", outcome: "La lee en el autobús y no habla en veinte minutos.", apply: (s) => { npcMood(s, "captain", 18); rel(s, "dressing", 8); stat(s, "morale", 6); } },
      { id: "homenaje", label: "Organizar un homenaje del vestuario", outcome: "Vídeo, camiseta firmada y una cena que se recuerda años.", apply: (s) => { rel(s, "dressing", 14); stat(s, "fame", 3); npcMood(s, "captain", 12); } },
      { id: "brazalete", label: "Pedirle que te enseñe a llevar el vestuario", outcome: "\"Empieza por callarte más y mirar más.\" Empiezas ese día.", apply: (s) => { stat(s, "discipline", 8); rel(s, "dressing", 9); flag(s, "aprendiz_capitan"); } },
    ],
  },
  {
    id: "nb_e_despedida",
    kicker: "Último día",
    title: "Se va tu mejor amigo del vestuario",
    image: "locker",
    category: "life",
    family: "farewell",
    requires: (s) => s.age >= 19,
    text: (s) => `${who(s, "friend")} ha firmado por otro club. Vacía la taquilla de al lado en once minutos y de repente ese hueco es lo más ruidoso del vestuario.`,
    choices: [
      { id: "llevar", label: "Llevarle tú al aeropuerto", outcome: "Hora y media de coche y una amistad que sobrevive al traslado.", apply: (s) => { npcMood(s, "friend", 15); stat(s, "morale", 5); rel(s, "dressing", 4); } },
      { id: "grupo", label: "Montarle una despedida rápida", outcome: "Bocadillos, cerveza y llantos mal disimulados.", apply: (s) => { rel(s, "dressing", 10); stat(s, "morale", 6); } },
      { id: "frio", label: "Un abrazo corto y a entrenar", outcome: "Profesional. Frío. Los dos lo notáis.", apply: (s) => { npcMood(s, "friend", -8); stat(s, "discipline", 5); } },
    ],
  },
  {
    id: "nb_e_volver_estadio",
    kicker: "Regreso",
    title: "Vuelves al campo donde empezaste",
    image: "stadium",
    category: "life",
    family: "homecoming",
    requires: (s) => s.age >= 21 && s.seasons.length >= 3,
    text: (s) => `Partido de Copa en un campo pequeño con la valla pintada a mano. Aquí ${nick(s)} debutó en juveniles delante de cuarenta personas, y una de ellas todavía está sentada en el mismo sitio.`,
    choices: [
      { id: "saludar", label: "Saludar uno a uno a los del club", outcome: "Media hora de fotos y una placa improvisada.", apply: (s) => { rel(s, "fans", 10); stat(s, "morale", 10); } },
      { id: "material", label: "Dejarles material y equipaciones", outcome: "Cuarenta chavales con tu nombre en la espalda.", apply: (s) => { s.wealth = Math.max(0, (s.wealth ?? 0) - 1); rel(s, "fans", 12); stat(s, "fame", 4); milestone(s, "Ayudaste al club donde empezaste."); } },
      { id: "concentrado2", label: "Centrarte solo en el partido", outcome: "Ganáis. Y te quedas con una espina pequeña.", apply: (s) => { stat(s, "form", 5); rel(s, "fans", -2); } },
    ],
  },
  {
    id: "nb_e_seleccion",
    kicker: "Llamada",
    title: "Prefijo desconocido",
    image: "office",
    category: "club",
    family: "national_call",
    requires: (s) => s.overall >= 72 && s.age >= 19 && !s.flags["seleccion_abs"],
    text: (s) => `Número raro, dos intentos. Es el seleccionador. Habla treinta segundos, dice "te quiero en la lista" y cuelga. ${nick(s)} se queda mirando la pantalla apagada del móvil.`,
    choices: [
      { id: "familia", label: "Llamar a tu padre antes que a nadie", outcome: "No dice nada durante ocho segundos. Luego sí.", apply: (s) => { flag(s, "seleccion_abs"); rel(s, "family", 15); stat(s, "morale", 14); stat(s, "fame", 10); milestone(s, "Primera llamada de la selección absoluta."); } },
      { id: "agente", label: "Llamar a tu agente para exprimirlo", outcome: "Dos marcas llaman esa semana.", apply: (s) => { flag(s, "seleccion_abs"); rel(s, "agent", 10); s.wealth = (s.wealth ?? 0) + 2; stat(s, "fame", 12); milestone(s, "Primera llamada de la selección absoluta."); } },
      { id: "callar", label: "No decírselo a nadie hasta que sea oficial", outcome: "Veinticuatro horas guardando el secreto mejor de tu vida.", apply: (s) => { flag(s, "seleccion_abs"); stat(s, "discipline", 8); stat(s, "morale", 10); milestone(s, "Primera llamada de la selección absoluta."); } },
    ],
  },
  {
    id: "nb_e_lesion_seria",
    kicker: "Consulta",
    title: "La resonancia",
    image: "injury",
    category: "medical",
    family: "injury_serious",
    requires: (s) => !s.injury && s.age >= 18 && s.fitness <= 70,
    text: () => `El doctor gira la pantalla y señala una mancha blanca. Habla en un idioma técnico durante dos minutos y luego resume: "Meses, no semanas".`,
    choices: [
      { id: "operar", label: "Operarte ya, la vía larga y segura", outcome: "Quirófano el jueves. Empieza la parte aburrida.", apply: (s) => { injure(s, 14, "rotura de ligamento"); stat(s, "morale", -8); rel(s, "coach", 3); } },
      { id: "conservador", label: "Tratamiento conservador para volver antes", outcome: "Vuelves antes. Con un porcentaje de recaída que nadie dice en voz alta.", apply: (s) => { injure(s, 8, "rotura parcial tratada sin cirugía"); flag(s, "riesgo_recaida"); stat(s, "morale", -3); } },
      { id: "segunda", label: "Pedir una segunda opinión fuera del club", outcome: "El club se molesta. El diagnóstico se confirma.", apply: (s) => { injure(s, 12, "rotura confirmada por segunda opinión"); rel(s, "coach", -5); stat(s, "discipline", 5); s.wealth = Math.max(0, (s.wealth ?? 0) - 1); } },
    ],
  },
];

/* ---------------------------------- HUMOR --------------------------------- */
const HUMOR: GameEvent[] = [
  {
    id: "nb_h_autobus",
    kicker: "Ups",
    title: "El autobús se va sin ti",
    image: "travel",
    category: "life",
    family: "comedy_late",
    requires: (s) => s.age >= 16,
    text: (s) => `Te has quedado dormido. Cuando llegas a la ciudad deportiva solo queda el humo del autobús y ${who(s, "physio")} fumando a escondidas, que te mira y se ríe.`,
    choices: [
      { id: "taxi", label: "Pagarte un taxi de 180 euros", outcome: "Llegas a tiempo, arruinado y con el taxista pidiéndote foto.", apply: (s) => { s.wealth = Math.max(0, (s.wealth ?? 0) - 1); rel(s, "coach", 2); stat(s, "morale", -2); } },
      { id: "llamar", label: "Llamar al delegado y confesar", outcome: "Multa interna y una bronca legendaria por el manos libres.", apply: (s) => { rel(s, "coach", -6); rel(s, "dressing", 5); stat(s, "discipline", 3); } },
      { id: "excusa", label: "Inventarte un problema familiar", outcome: "Cuela. Hasta que alguien publica tu ubicación en un vídeo.", apply: (s) => { rel(s, "coach", -10); stat(s, "fame", 3); conflict(s, "Mentiste al cuerpo técnico"); } },
    ],
  },
  {
    id: "nb_h_rapado",
    kicker: "Novatada",
    title: "Te rapan medio a medio",
    image: "locker",
    category: "life",
    family: "comedy_prank",
    requires: (s) => s.age <= 21,
    text: () => `Te despiertas de la siesta en la concentración con dos compañeros, una maquinilla y un dibujo en el pelo que solo se puede describir como "un rayo, pero mal".`,
    choices: [
      { id: "asumir", label: "Salir así a rueda de prensa", outcome: "Icono instantáneo. Tres marcas de barbería te escriben.", apply: (s) => { stat(s, "fame", 10); rel(s, "dressing", 12); s.wealth = (s.wealth ?? 0) + 1; } },
      { id: "cero", label: "Raparte al cero entero", outcome: "Digno y triste. El vestuario aplaude igual.", apply: (s) => { rel(s, "dressing", 6); stat(s, "morale", 2); } },
      { id: "venganza", label: "Planear la venganza durante semanas", outcome: "Cuando llega, es desproporcionada y perfecta.", apply: (s) => { rel(s, "dressing", 9); stat(s, "morale", 6); flag(s, "guerra_bromas"); } },
    ],
  },
  {
    id: "nb_h_nombre_mister",
    kicker: "Directo",
    title: "Confundes el nombre del entrenador",
    image: "press",
    category: "press",
    family: "comedy_public",
    requires: (s) => s.fame >= 15,
    text: (s) => `En directo, nervioso, agradeces la confianza a "el míster... eh... Manolo". El míster se llama ${npcName(s, "coach")}. La entrevista sigue doce segundos más en silencio absoluto.`,
    choices: [
      { id: "reir", label: "Reírte de ti mismo ahí mismo", outcome: "Se hace viral como \"el momento Manolo\". Hasta el míster lo usa.", apply: (s) => { stat(s, "fame", 8); rel(s, "coach", 3); rel(s, "fans", 6); } },
      { id: "disculpar", label: "Disculparte cinco veces seguidas", outcome: "Peor. Mucho peor. Adorable, pero peor.", apply: (s) => { stat(s, "fame", 5); stat(s, "morale", -3); rel(s, "coach", 5); } },
      { id: "tatuar", label: "Aparecer al día siguiente con su nombre escrito en la muñeca", outcome: "El vestuario no se recupera en una semana.", apply: (s) => { rel(s, "dressing", 12); rel(s, "coach", 8); stat(s, "fame", 6); } },
    ],
  },
  {
    id: "nb_h_vecino",
    kicker: "Comunidad",
    title: "El vecino del tercero",
    image: "family",
    category: "life",
    family: "comedy_neighbour",
    requires: (s) => (s.flags["mudado"] ?? 0) === 1,
    text: () => `Nota en el ascensor: "Al FUTBOLISTA del 5ºB: celebrar goles saltando a las 00:40 es una falta de respeto. Firmado: la comunidad (mayoría)".`,
    choices: [
      { id: "disculpa2", label: "Bajar a disculparte con una camiseta firmada", outcome: "El vecino resulta ser socio desde 1974. Ahora es tu mayor defensor.", apply: (s) => { rel(s, "fans", 8); stat(s, "morale", 5); } },
      { id: "nota", label: "Contestar con otra nota más graciosa", outcome: "Guerra de notas que acaba en el grupo del barrio y en Twitter.", apply: (s) => { stat(s, "fame", 6); stat(s, "morale", 4); } },
      { id: "alfombra", label: "Comprar alfombras y no celebrar en casa", outcome: "Silencio total. Y unas alfombras horribles.", apply: (s) => { s.wealth = Math.max(0, (s.wealth ?? 0) - 1); stat(s, "discipline", 4); } },
    ],
  },
  {
    id: "nb_h_regalo_patrocinador",
    kicker: "Patrocinio",
    title: "Un regalo absurdo",
    image: "office",
    category: "gossip",
    family: "comedy_sponsor",
    requires: (s) => s.fame >= 25,
    text: () => `Una marca de colchones te manda a casa un colchón con tu cara serigrafiada a tamaño real. No cabe por la puerta y el repartidor quiere hacerse una foto contigo encima.`,
    choices: [
      { id: "foto", label: "Hacerte la foto y subirla", outcome: "Contrato de un año con la marca del colchón.", apply: (s) => { s.wealth = (s.wealth ?? 0) + 2; stat(s, "fame", 8); } },
      { id: "regalar", label: "Regalárselo al utillero", outcome: "El utillero duerme sobre tu cara. Nadie lo supera.", apply: (s) => { rel(s, "dressing", 10); stat(s, "morale", 5); } },
      { id: "devolver", label: "Devolverlo educadamente", outcome: "La marca se ofende una semana y lo olvida.", apply: (s) => { stat(s, "discipline", 4); } },
    ],
  },
  {
    id: "nb_h_maleta",
    kicker: "Aeropuerto",
    title: "Maleta perdida antes de un partido",
    image: "travel",
    category: "life",
    family: "comedy_travel",
    requires: (s) => s.stage !== "youth",
    text: () => `Tu maleta ha volado a otra ciudad con tus botas dentro. Quedan cuatro horas para el partido y el utillero te ofrece unas botas dos números más grandes y unas plantillas.`,
    choices: [
      { id: "prestadas", label: "Jugar con botas prestadas", outcome: "Dos ampollas y una asistencia. Historia para siempre.", apply: (s) => { stat(s, "fitness", -5); stat(s, "form", 6); rel(s, "dressing", 6); } },
      { id: "tienda", label: "Salir corriendo a comprar unas nuevas", outcome: "Botas sin domar. Resbalas dos veces en el calentamiento.", apply: (s) => { s.wealth = Math.max(0, (s.wealth ?? 0) - 1); stat(s, "form", -3); } },
      { id: "companero2", label: "Pedirle las de repuesto a un compañero", outcome: "Te las deja con una condición: gol o le invitas un mes.", apply: (s) => { rel(s, "dressing", 8); stat(s, "form", 3); } },
    ],
  },
  {
    id: "nb_h_perro",
    kicker: "Entrenamiento",
    title: "Un perro invade el entrenamiento",
    image: "training",
    category: "training",
    family: "comedy_animal",
    requires: () => true,
    text: (s) => `Un galgo se cuela por el hueco de la valla, roba el balón de ${npcName(s, "coach")}, tu entrenador, y se pasea con él por el círculo central. Nadie consigue quitárselo en once minutos.`,
    choices: [
      { id: "perseguir", label: "Lanzarte a perseguirlo", outcome: "El vídeo tiene más visitas que tu mejor gol.", apply: (s) => { stat(s, "fame", 8); rel(s, "dressing", 8); stat(s, "fitness", -2); } },
      { id: "adoptar", label: "Acabar adoptándolo", outcome: "Se llama Balón. Duerme en el sofá. Te ha cambiado la vida.", apply: (s) => { stat(s, "morale", 12); rel(s, "fans", 5); flag(s, "perro"); } },
      { id: "seguir", label: "Seguir con el rondo como si nada", outcome: "El míster te señala: \"este sí está concentrado\".", apply: (s) => { rel(s, "coach", 6); stat(s, "discipline", 5); } },
    ],
  },
];

/* ---------------------- SURREALISMO PLAUSIBLE (raro) ---------------------- */
const SURREAL: GameEvent[] = [
  {
    id: "nb_s_videojuego",
    kicker: "Videojuego",
    title: "Tu media en el videojuego",
    image: "office",
    category: "gossip",
    family: "surreal_game",
    rare: true,
    requires: (s) => s.fame >= 30,
    text: (s) => `Sale el juego. Tu media es seis puntos más baja de lo que esperabas y tu regate está por debajo del portero suplente. En el grupo del vestuario llevan 200 mensajes riéndose.`,
    choices: [
      { id: "quejarse", label: "Quejarte públicamente a la desarrolladora", outcome: "Te suben dos puntos en el parche y te ganas un mote nuevo.", apply: (s) => { stat(s, "fame", 8); rel(s, "dressing", -3); stat(s, "morale", 3); } },
      { id: "usarlo", label: "Usarlo como motivación", outcome: "Pegas la captura en la taquilla toda la temporada.", apply: (s) => { stat(s, "form", 7); stat(s, "morale", 5); } },
      { id: "cachondeo", label: "Retar al vestuario a ganarte usándote a ti", outcome: "Torneo interno de tres días. Pierdes en cuartos contra el fisio.", apply: (s) => { rel(s, "dressing", 10); stat(s, "morale", 6); } },
    ],
  },
  {
    id: "nb_s_doble",
    kicker: "Viral",
    title: "Alguien se hace pasar por ti",
    image: "press",
    category: "gossip",
    family: "surreal_double",
    rare: true,
    requires: (s) => s.fame >= 35,
    text: (s) => `Hay un tío en otra ciudad firmando autógrafos como ${nick(s)}. Se parece un 40%, cobra copas gratis y ya ha dado dos entrevistas a una radio local diciendo cosas rarísimas.`,
    choices: [
      { id: "buscarle", label: "Presentarte donde está y saludarle", outcome: "La foto de los dos juntos es el contenido del año.", apply: (s) => { stat(s, "fame", 14); rel(s, "fans", 8); stat(s, "morale", 6); } },
      { id: "abogados", label: "Denunciarle", outcome: "Se acaba en dos semanas. Y quedas de estirado.", apply: (s) => { rel(s, "fans", -6); stat(s, "fame", 3); } },
      { id: "aprovechar2", label: "Contratarle para eventos que no te apetecen", hint: "Idea terrible", outcome: "Funciona tres meses. Luego, obviamente, no.", apply: (s) => { s.wealth = (s.wealth ?? 0) + 1; stat(s, "fame", 6); conflict(s, "El doble que contrataste te metió en un lío"); } },
    ],
  },
  {
    id: "nb_s_presidente",
    kicker: "Palco",
    title: "El presidente y su idea",
    image: "office",
    category: "club",
    family: "surreal_president",
    rare: true,
    requires: (s) => s.stage !== "youth",
    text: (s) => `El presidente del ${short(s)} te llama a su despacho para enseñarte una maqueta: quiere que el equipo salga al campo con capas. Capas de verdad. "Es identidad, chaval."`,
    choices: [
      { id: "seguirle", label: "Decirle que te parece genial", outcome: "Sales con capa un partido. La capa se engancha en el banquillo.", apply: (s) => { stat(s, "fame", 8); rel(s, "dressing", -4); stat(s, "morale", 4); } },
      { id: "sincero", label: "Decirle honestamente que es horrible", outcome: "Se ríe. \"Por eso te fiché.\" No vuelve a mencionarlo.", apply: (s) => { rel(s, "coach", 4); stat(s, "discipline", 5); flag(s, "presi_te_aprecia"); } },
      { id: "negociar2", label: "Cambiar el sí por una mejora de contrato", outcome: "Aceptáis los dos. Nadie sale limpio.", apply: (s) => { s.wealth = (s.wealth ?? 0) + 2; rel(s, "dressing", -5); } },
    ],
  },
  {
    id: "nb_s_influencer",
    kicker: "Bulo",
    title: "Un influencer inventa tu fichaje",
    image: "press",
    category: "gossip",
    family: "surreal_hoax",
    rare: true,
    requires: (s) => s.fame >= 28,
    text: (s) => `Un chaval de 19 años con dos millones de seguidores publica que estás firmado por otro club "aquí mañana". No es verdad. La afición del ${short(s)} ya está en la puerta de la ciudad deportiva.`,
    choices: [
      { id: "video2", label: "Grabar un vídeo desmintiéndolo con humor", outcome: "Le dejas retratado sin insultarle. Perfecto.", apply: (s) => { rel(s, "fans", 12); stat(s, "fame", 8); } },
      { id: "salir", label: "Salir a hablar con los aficionados de la puerta", outcome: "Cuarenta personas, una hora, cero titulares malos.", apply: (s) => { rel(s, "fans", 14); stat(s, "morale", 6); } },
      { id: "silencio2", label: "No decir nada", outcome: "El bulo se hace medio verdad en la cabeza de la gente.", apply: (s) => { rel(s, "fans", -8); flag(s, "quiere_salir"); } },
    ],
  },
  {
    id: "nb_s_tatuaje",
    kicker: "Fans",
    title: "Un aficionado con una petición rara",
    image: "stadium",
    category: "gossip",
    family: "surreal_fan",
    rare: true,
    requires: (s) => s.fame >= 30,
    text: (s) => `Un señor de unos cincuenta te enseña el antebrazo: tiene tatuada tu celebración. Ahora quiere que le firmes justo debajo para tatuarse también la firma. Y que le pongas nombre a su perro.`,
    choices: [
      { id: "firmar2", label: "Firmar y bautizar al perro", outcome: "El perro se llama como tú. Sale en el periódico local.", apply: (s) => { rel(s, "fans", 12); stat(s, "fame", 5); stat(s, "morale", 5); } },
      { id: "foto2", label: "Foto sí, firma para tatuar no", outcome: "Lo entiende a medias. Se va contento igual.", apply: (s) => { rel(s, "fans", 5); } },
    ],
  },
  {
    id: "nb_s_supersticion",
    kicker: "Vestuario",
    title: "La superstición del grupo",
    image: "locker",
    category: "life",
    family: "surreal_ritual",
    rare: true,
    requires: (s) => s.stage !== "youth",
    text: (s) => `Desde que ganasteis con ${npcName(s, "physio")}, el fisioterapeuta, poniendo la misma canción horrible, nadie deja que se cambie. Hoy el reproductor se ha roto y hay tres tíos hechos polvo de verdad.`,
    choices: [
      { id: "cantar2", label: "Cantarla tú a capela", outcome: "Ridículo absoluto. Ganáis. Ahora la cantas tú siempre.", apply: (s) => { rel(s, "dressing", 12); stat(s, "morale", 8); } },
      { id: "romper2", label: "Decir que eso es una tontería", outcome: "Perdéis. Te miran raro un mes.", apply: (s) => { rel(s, "dressing", -8); stat(s, "discipline", 4); } },
    ],
  },
  {
    id: "nb_s_paparazzi",
    kicker: "Portada",
    title: "Paparazzi y un rumor falso",
    image: "press",
    category: "gossip",
    family: "surreal_gossip",
    rare: true,
    requires: (s) => s.fame >= 32,
    text: (s) => `Una revista publica fotos tuyas saliendo de un restaurante con una presentadora que no conoces de nada: erais dos mesas distintas. ${who(s, "partner")} lo ha visto antes que tú.`,
    choices: [
      { id: "explicar", label: "Explicárselo con pruebas y calma", outcome: "Te cree. La revista no rectifica.", apply: (s) => { npcMood(s, "partner", 8); rel(s, "family", 4); stat(s, "fame", 5); } },
      { id: "publico2", label: "Salir públicamente a desmentirlo", outcome: "Le das el doble de recorrido a la historia.", apply: (s) => { stat(s, "fame", 12); npcMood(s, "partner", -6); rel(s, "fans", -2); } },
      { id: "broma2", label: "Contestar con un chiste en redes", outcome: "Funciona con la gente, no en casa.", apply: (s) => { rel(s, "fans", 8); npcMood(s, "partner", -10); } },
    ],
  },
];

/* --------------------------- MERCADO Y CONTRATOS -------------------------- */
const MARKET: GameEvent[] = [
  {
    id: "nb_k_ultimo_dia",
    kicker: "31 de agosto",
    title: "Último día de mercado",
    image: "office",
    category: "market",
    family: "deadline_day",
    requires: (s) => s.age >= 19 && s.stage !== "youth",
    text: (s) => `23:04. Quedan 56 minutos. Un club de arriba pregunta por ti, el ${short(s)} no coge el teléfono a propósito y tu agente te manda audios de dos segundos cada treinta.`,
    choices: [
      { id: "forzar2", label: "Presionar al club para que te deje salir", outcome: "Sales. Y en la ciudad no te lo perdonan del todo.", apply: (s) => { rel(s, "fans", -12); rel(s, "coach", -8); rel(s, "agent", 12); flag(s, "forzo_salida"); } },
      { id: "quedarse2", label: "Apagar el móvil y quedarte", outcome: "A las 00:01 el club publica una foto tuya con el pulgar arriba.", apply: (s) => { rel(s, "fans", 12); rel(s, "coach", 8); rel(s, "agent", -8); promise(s, "Prometiste quedarte cuando pudiste salir"); } },
      { id: "esperar2", label: "No hacer nada y dejar que decidan ellos", outcome: "No pasa nada. Y eso también decide.", apply: (s) => { stat(s, "morale", -4); rel(s, "agent", -4); } },
    ],
  },
  {
    id: "nb_k_cesion_dura",
    kicker: "Cesión",
    title: "Segunda B, barro y minutos",
    image: "travel",
    category: "market",
    family: "loan_offer",
    requires: (s) => s.age >= 18 && s.age <= 23 && !(s.flags["status"] === 1),
    text: () => `La opción no es glamurosa: un equipo modesto, campo pequeño, vestuario con goteras y la promesa de jugarlo todo. La alternativa es seguir calentando en un sitio bonito.`,
    choices: [
      { id: "ir2", label: "Irte a jugar aunque sea al barro", outcome: "Doce meses de patadas que te convierten en futbolista.", apply: (s) => { stat(s, "overall", 4); flag(s, "cedido"); rel(s, "agent", 8); stat(s, "morale", 3); note(s, "Cesión para jugar y crecer.", "neutral"); } },
      { id: "quedarse3", label: "Quedarte y pelear tu sitio aquí", outcome: "Valiente. Puede salir muy bien o muy mal.", apply: (s) => { rel(s, "coach", 6); rel(s, "fans", 4); stat(s, "form", 3); } },
      { id: "condicion2", label: "Aceptar solo con cláusula de regreso en enero", outcome: "El club lo firma sin discutir. Buena jugada.", apply: (s) => { flag(s, "cedido"); flag(s, "regreso_enero"); rel(s, "agent", 5); stat(s, "overall", 3); } },
    ],
  },
  {
    id: "nb_k_proyecto_o_dinero",
    kicker: "Decisión",
    title: "Proyecto o dinero",
    image: "office",
    category: "market",
    family: "big_choice",
    requires: (s) => s.age >= 21 && s.overall >= 70,
    text: () => `Dos carpetas. Una: un club que pelea por todo y donde serías el cuarto en su puesto. Otra: el triple de dinero en una liga menor donde serías la estrella y nadie te vería.`,
    choices: [
      { id: "proyecto", label: "Elegir el proyecto deportivo", outcome: "Menos ceros, más noches de nervios buenos.", apply: (s) => { stat(s, "overall", 3); rel(s, "fans", 8); rel(s, "agent", -6); flag(s, "elegi_proyecto"); } },
      { id: "dinero", label: "Elegir el dinero", outcome: "Te aseguras la vida. Y algo se apaga.", apply: (s) => { s.wealth = (s.wealth ?? 0) + 4; rel(s, "agent", 12); rel(s, "fans", -8); stat(s, "morale", -3); flag(s, "elegi_dinero"); } },
      { id: "tercera", label: "Rechazar las dos y esperar algo mejor", hint: "Riesgo real", outcome: "Puede no llegar nada. Es tu carrera.", apply: (s) => { rel(s, "agent", -10); stat(s, "morale", 5); s.memory.rejectedClubs.push("dos ofertas firmes"); } },
    ],
  },
  {
    id: "nb_k_clausula",
    kicker: "Cláusula",
    title: "Pagan tu cláusula",
    image: "press",
    category: "market",
    family: "release_clause",
    requires: (s) => s.overall >= 76 && s.age >= 21,
    text: (s) => `Alguien ha ido a la Liga con un cheque por tu cláusula. El ${short(s)} no puede hacer nada legalmente y todo el mundo espera a ver qué dices tú.`,
    choices: [
      { id: "irse2", label: "Irte: es tu momento", outcome: "Adiós con carta pública. La mitad la comparte, la otra mitad la critica.", apply: (s) => { stat(s, "fame", 12); rel(s, "fans", -5); flag(s, "forzo_salida"); } },
      { id: "quedarse4", label: "Rechazar el traspaso y quedarte", outcome: "Te conviertes en leyenda de la ciudad en una tarde.", apply: (s) => { rel(s, "fans", 20); rel(s, "coach", 10); milestone(s, "Rechazaste una salida millonaria por quedarte."); promise(s, "Prometiste públicamente quedarte"); } },
    ],
  },
  {
    id: "nb_k_traicion",
    kicker: "Callback",
    title: "Prometiste quedarte",
    image: "stadium",
    category: "press",
    family: "callback",
    requires: (s) => (s.flags["forzo_salida"] ?? 0) === 1 && s.memory.promises.some((p) => p.includes("quedarte")),
    text: (s) => `En la grada del ${short(s)} hay una pancarta con tu frase de hace ocho meses, la de "yo de aquí no me muevo", escrita en letras de tres metros y una palabra debajo que no se puede repetir.`,
    choices: [
      { id: "carta2", label: "Escribir una carta abierta explicándote", outcome: "Algunos lo entienden. Nunca todos.", apply: (s) => { rel(s, "fans", 6); stat(s, "fame", 4); stat(s, "morale", -3); } },
      { id: "ignorar2", label: "No entrar al trapo", outcome: "El tiempo lo tapa a medias.", apply: (s) => { rel(s, "fans", -4); stat(s, "discipline", 4); } },
      { id: "aplaudir2", label: "Aplaudir a esa grada al salir al campo", outcome: "Se convierte en la imagen del fin de semana.", apply: (s) => { rel(s, "fans", 10); stat(s, "fame", 6); } },
    ],
  },
];

/* ---------------------------- CARRERA MADURA ------------------------------ */
const MATURE: GameEvent[] = [
  {
    id: "nb_x_brazalete",
    kicker: "Capitanía",
    title: "El brazalete",
    image: "tunnel",
    category: "club",
    family: "leadership",
    requires: (s) => s.age >= 26 && s.rel.dressing >= 60 && !s.flags["capitan"],
    text: (s) => `${who(s, "coach")} te da el brazalete en el túnel, sin ceremonia: "A partir de hoy, cuando hables tú, hablo yo".`,
    choices: [
      { id: "aceptar2", label: "Aceptarlo y cambiar de rol", outcome: "Menos ego, más reuniones, más responsabilidad.", apply: (s) => { flag(s, "capitan"); rel(s, "dressing", 10); rel(s, "coach", 8); stat(s, "discipline", 8); milestone(s, "Te dieron el brazalete de capitán."); } },
      { id: "compartir", label: "Proponer compartirlo con un veterano", outcome: "Gesto que el vestuario no olvida.", apply: (s) => { flag(s, "capitan"); rel(s, "dressing", 15); stat(s, "morale", 6); milestone(s, "Capitán compartido: el vestuario contigo."); } },
      { id: "rechazar2", label: "Rechazarlo: no es tu momento", outcome: "Lo respeta. Y se lo da a otro para siempre.", apply: (s) => { rel(s, "coach", -4); stat(s, "morale", 2); } },
    ],
  },
  {
    id: "nb_x_joven",
    kicker: "Relevo",
    title: "El chaval que viene a por tu puesto",
    image: "training",
    category: "training",
    family: "generational",
    requires: (s) => s.age >= 28,
    text: (s) => `Tiene 18 años, corre lo que tú corrías, y hoy en el rondo te ha hecho un caño que ha celebrado medio grupo. ${who(s, "coach")} sonríe como no te sonríe a ti desde hace tiempo.`,
    choices: [
      { id: "ayudar2", label: "Adoptarle y enseñarle todo", outcome: "Te sustituye antes. Y te lo agradece toda la vida.", apply: (s) => { rel(s, "dressing", 12); rel(s, "coach", 8); stat(s, "morale", 5); flag(s, "mentor_joven"); } },
      { id: "competir", label: "Competir sin piedad", outcome: "Vuelves a entrenar como a los veinte. El cuerpo se queja.", apply: (s) => { stat(s, "form", 8); stat(s, "fitness", -6); rel(s, "dressing", -4); } },
      { id: "apartarle", label: "Hacerle la vida imposible en el vestuario", outcome: "Funciona un mes. Luego eres el malo de una historia que ya está escrita.", apply: (s) => { rel(s, "dressing", -14); rel(s, "coach", -8); conflict(s, "Hiciste la vida imposible a un canterano"); } },
    ],
  },
  {
    id: "nb_x_banquillo",
    kicker: "Declive",
    title: "Aceptar el banquillo",
    image: "locker",
    category: "club",
    family: "decline",
    requires: (s) => s.age >= 30 && s.overall < (s.seasons[0]?.overall ?? 0) + 20 && s.form < 62,
    text: (s) => `${who(s, "coach")} te lo dice sin rodeos: vas a jugar 20 minutos por partido, y esos 20 minutos van a ser importantes. Es la primera vez en catorce años que alguien te plantea esto.`,
    choices: [
      { id: "aceptar3", label: "Aceptar el rol y ser el mejor suplente de la liga", outcome: "Ocho goles decisivos entrando desde el banquillo.", apply: (s) => { rel(s, "coach", 12); rel(s, "dressing", 8); stat(s, "form", 6); flag(s, "rol_revulsivo"); } },
      { id: "pelear", label: "Negarte y pelear la titularidad", outcome: "Entrenas como un animal. Tu cuerpo tiene otra opinión.", apply: (s) => { stat(s, "form", 5); stat(s, "fitness", -8); rel(s, "coach", -5); } },
      { id: "salir2", label: "Pedir salir a un club donde seas titular", outcome: "Menos foco, más minutos, dos años más de carrera.", apply: (s) => { flag(s, "busca_titularidad"); rel(s, "agent", 10); rel(s, "fans", -4); } },
    ],
  },
  {
    id: "nb_x_volver_casa",
    kicker: "Regreso",
    title: "El club de tu vida te llama",
    image: "office",
    category: "market",
    family: "homecoming",
    requires: (s) => s.age >= 30 && s.seasons.length >= 8,
    text: (s) => `Te llama el club donde te hiciste futbolista. No pueden pagarte ni la mitad. Lo que ofrecen es una despedida en casa, con tu gente, y un puesto después si quieres.`,
    choices: [
      { id: "volver", label: "Volver y bajarte el sueldo", outcome: "Estadio lleno el día de tu presentación, en pleno mes de julio.", apply: (s) => { rel(s, "fans", 18); stat(s, "morale", 14); s.wealth = Math.max(0, (s.wealth ?? 0) - 1); milestone(s, "Volviste al club de tu vida."); flag(s, "vuelta_casa"); } },
      { id: "despues", label: "Prometer volver, pero al retirarte", outcome: "Un apretón de manos que vale más que un contrato.", apply: (s) => { promise(s, "Prometiste volver al club de tu vida"); stat(s, "morale", 6); } },
      { id: "no2", label: "Decir que no: tu carrera sigue arriba", outcome: "Profesional hasta el final. Frío también.", apply: (s) => { stat(s, "form", 4); rel(s, "fans", -3); } },
    ],
  },
  {
    id: "nb_x_contrato_final",
    kicker: "Último contrato",
    title: "La firma del final",
    image: "office",
    category: "market",
    family: "last_deal",
    requires: (s) => s.age >= 32,
    text: () => `Encima de la mesa hay un contrato de dos años con una condición: el segundo año solo se activa si juegas 20 partidos. Tu cuerpo lleva un año diciéndote cosas por las mañanas.`,
    choices: [
      { id: "firmar3", label: "Firmar los dos años y apostar por ti", outcome: "Presión autoimpuesta. Combustible puro.", apply: (s) => { s.contractYears = 2; stat(s, "form", 6); stat(s, "morale", 6); } },
      { id: "uno", label: "Negociar solo un año limpio", outcome: "Tranquilidad y una temporada para decidir con calma.", apply: (s) => { s.contractYears = 1; stat(s, "discipline", 6); rel(s, "agent", -3); } },
      { id: "cuerpo", label: "Pedir un año más un puesto en el club después", outcome: "Aceptan. El futuro deja de dar miedo.", apply: (s) => { s.contractYears = 1; stat(s, "morale", 10); rel(s, "coach", 6); flag(s, "futuro_club"); } },
    ],
  },
  {
    id: "nb_x_liderazgo",
    kicker: "Crisis",
    title: "El vestuario mira al capitán",
    image: "locker",
    category: "club",
    family: "leadership",
    requires: (s) => (s.flags["capitan"] ?? 0) === 1 && s.form < 58,
    text: (s) => `Cuatro derrotas seguidas y un vestuario que ha dejado de hablar. Como capitán, ${nick(s)} tiene treinta segundos y ninguna frase preparada.`,
    choices: [
      { id: "verdad", label: "Decir la verdad incómoda", outcome: "Dos se ofenden. Nueve se despiertan.", apply: (s) => { rel(s, "dressing", 6); stat(s, "form", 8); conflict(s, "Señalaste al grupo como capitán"); } },
      { id: "arropar", label: "Arropar y quitar presión", outcome: "Se relaja el ambiente. El siguiente partido se gana feo.", apply: (s) => { rel(s, "dressing", 12); stat(s, "form", 4); } },
      { id: "ejemplo", label: "No hablar y ser el primero en cada carrera", outcome: "El silencio, esta vez, es un discurso.", apply: (s) => { rel(s, "dressing", 8); stat(s, "fitness", -4); stat(s, "form", 7); rel(s, "coach", 6); } },
    ],
  },
];

export const BANK_LIFE: GameEvent[] = [...LIFE, ...EMOTION, ...HUMOR, ...SURREAL, ...MARKET, ...MATURE];
export { club };
