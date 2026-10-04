import type { Consequences, EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import type { TorneoProgress } from "@/lib/narrative/torneo";
import { getPersonName, getTeammateName, getCelebrityName } from "@/lib/narrative/npcs";

/**
 * Vida durante un torneo con la selección (Mundial, Eurocopa, Copa
 * América): mismo mecanismo que preseason-life.ts pero para la
 * concentración — rumores de fichajes que llegan DURANTE el torneo
 * (cualquier club grande mirando cómo rindes ahí), anécdotas del hotel de
 * concentración, y un puñado de situaciones surrealistas o de puro humor
 * (equivocarte de habitación, marearte en el vuelo, el compañero de
 * cuarto que ronca como una moto). Pedido explícito tras ver que
 * sel-mundial/sel-eurocopa/sel-copa-america eran un único evento suelto
 * sin nada de "vida" alrededor, a diferencia de la pretemporada.
 *
 * Se activa vía el flag `torneo_activo` (que sel-mundial/sel-eurocopa/
 * sel-copa-america dejan puesto en events.ts al resolverse) y se apaga
 * solo tras un puñado de apariciones — no depende de contar semanas
 * exactas, así no hace falta que esos eventos (estáticos, sin acceso a
 * player.week en el momento de escribirse) sepan en qué semana concreta
 * ocurre el torneo.
 */

// Cuándo toca la escena de concentración dentro del torneo lo decide el
// motor (ver pickTorneoEvent en engine.ts): una antes del primer partido y
// otra entre cada dos partidos, no al azar.

function torneoLabel(torneo: string): string {
  if (torneo === "mundial") return "el Mundial";
  if (torneo === "eurocopa") return "la Eurocopa";
  if (torneo === "copa_america") return "la Copa América";
  return "el torneo";
}

interface Ctx {
  torneo: string;
  teammate: string;
  teammate2: string;
  roommate: string;
  agent: string;
  journalist: string;
  veteran: string;
  fame: string;
  bigClub: string;
}

type Opt = Omit<EventOption, "id"> & { id?: string };
type Tone = "gracioso" | "surrealista";
interface Tpl {
  key: string;
  title: string;
  /** "arrival" = primera escena del torneo; "final" = víspera de la final; sin valor = cualquier momento. */
  phase?: "arrival" | "final";
  /** Si está presente, la escena es un hito compartible con foto con la camiseta de la selección. */
  milestone?: { type: string; imageScene: string };
  tone?: Tone[];
  desc: (c: Ctx) => string;
  opts: (c: Ctx) => Opt[];
}

const BIG_CLUBS = ["Real Madrid", "FC Barcelona", "Manchester City", "Bayern de Múnich", "Liverpool FC", "Juventus", "Paris Saint-Germain"];

const TEMPLATES: Tpl[] = [
  {
    key: "rumor-fichaje-torneo",
    title: "Un ojeador en la grada",
    desc: (c) =>
      `Tu agente te llama con la voz cambiada: "Un ojeador del ${c.bigClub} lleva dos partidos tuyos en ${c.torneo} apuntando cosas en una libreta." Nada oficial todavía, pero la noticia ya corre por dentro del vestuario.`,
    opts: (c) => [
      { label: "Pedirle a tu agente discreción total", subtitle: "No distraerte del torneo", consequences: { rel_representante: 2, moral: 1 }, outcomeText: "Tu agente promete silencio absoluto. Esa misma noche, desde la ventana del hotel, ves a un hombre con libreta saliendo del campo de entrenamiento." },
      { label: `Dejar que ${c.agent} mueva el contacto en paralelo`, subtitle: "Aprovechar el momento", consequences: { rel_representante: 3, fama: 2 }, outcomeText: `${c.agent} sonríe sin decir palabra y marca un número. Cuando vuelve del pasillo, tiene un asentimiento que te lo dice todo.` },
      { label: "Ignorarlo por completo hasta que acabe el torneo", subtitle: "Cabeza fría", consequences: { forma: 2, moral: 1 }, outcomeText: "Apagas el móvil y te metes en la burbuja del torneo. Al fondo del pasillo, el utillero te guiña un ojo: 'Así se hace'." },
    ],
  },
  {
    key: "club-observa-rendimiento",
    title: "Alguien está mirando",
    desc: () =>
      `Un periodista se te acerca en zona mixta con una pregunta que no es sobre el partido: "¿Es verdad que hay un club de Champions preguntando por tu cláusula?". No tienes ni idea de si es verdad, pero la pregunta ya está hecha.`,
    opts: () => [
      { label: "Responder con una evasiva elegante", subtitle: "No alimentar el rumor", consequences: { reputacion: 2 }, outcomeText: "'Estoy centrado en lo mío', dices con una sonrisa. El periodista apunta la frase y te deja marchar con un asentimiento." },
      { label: "Sonreír sin decir que no", subtitle: "Dejar la puerta entreabierta", consequences: { fama: 3, moral: 1 }, outcomeText: "Sonríes sin confirmar nada. Esa tarde, tu nombre ya está en tres portadas digitales con el pie '¿Rumbo a la Champions?'." },
      { label: "Cortar la pregunta en seco: 'estoy centrado en el torneo'", subtitle: "Profesionalidad ante todo", consequences: { rel_entrenador: 2, reputacion: 1 }, outcomeText: "Cortas la pregunta con una frase seca y te marchas. El míster, desde el fondo, asiente con aprobación." },
    ],
  },
  {
    key: "habitacion-equivocada",
    title: "La habitación equivocada",
    tone: ["surrealista", "gracioso"],
    desc: (c) =>
      `Vuelves de madrugada de la sala de fisio, medio dormido, y entras en la habitación equivocada de la concentración — te metes literalmente en la cama de ${c.teammate}, que se despierta gritando y casi te deja sin cejas del susto.`,
    opts: (c) => [
      { label: "Reíros los dos hasta las lágrimas", subtitle: "Convertirlo en anécdota del grupo", consequences: { rel_vestuario: 4, moral: 3 }, outcomeText: "Os reís tanto que despertáis a medio pasillo. Al día siguiente, la historia ya es leyenda del vestuario." },
      { label: "Pedir disculpas avergonzado y desaparecer", subtitle: "Que no se entere nadie más", consequences: { moral: 1, rel_vestuario: 1 }, outcomeText: "Murmuras una disculpa y sales corriendo. Por la mañana, tu compañero te sirve el desayuno con una sonrisa cómplice: 'Nadie lo sabrá'." },
      { label: `Culpar a ${c.teammate2} del numerito ante el resto`, subtitle: "Salvarte como puedas", consequences: { rel_vestuario: -1, moral: 2 }, outcomeText: `Lo cuentas ante todos acusando a ${c.teammate2}. Él pone cara de falsa inocencia y el grupo lo cree... durante unos veinte minutos.` },
    ],
  },
  {
    key: "vomito-avion",
    title: "El vuelo de la vergüenza",
    tone: ["gracioso"],
    desc: (c) =>
      `El vuelo a la siguiente ciudad del torneo se llena de turbulencias justo después de comer. No lo aguantas: vomitas delante de media expedición, incluido ${c.veteran}, que no deja de reírse el resto del vuelo cada vez que te mira.`,
    opts: (c) => [
      { label: "Reírte de ti mismo antes que nadie", subtitle: "Quitarle hierro", consequences: { rel_vestuario: 3, moral: 2 }, outcomeText: "Haces el chiste antes de que lo haga nadie y todo el avión te aplaude. El veterano se limpia las lágrimas de risa." },
      { label: "Pasar el resto del vuelo escondido tras los auriculares", subtitle: "Que se olvide rápido", consequences: { moral: -1 }, outcomeText: "Te pones los cascos y te hundes en el asiento. Al aterrizar, alguien te alarga una botella de agua con un gesto compasivo." },
      { label: `Retar a ${c.veteran} a aguantar el próximo vuelo igual de mal`, subtitle: "Venganza con humor", consequences: { rel_vestuario: 2, moral: 2 }, outcomeText: `${c.veteran} acepta el reto con una sonrisa y una apuesta de cena. Vuelo siguiente: gana él, y tú pagas encantado.` },
    ],
  },
  {
    key: "ronquidos-compi-cuarto",
    title: "El compañero de habitación ronca como una moto",
    tone: ["gracioso"],
    desc: (c) =>
      `Te toca compartir habitación con ${c.roommate} durante toda la fase de grupos, y descubres la primera noche que ronca tan fuerte que se oye desde el pasillo. Llevas dos noches durmiendo fatal y el torneo apenas empieza.`,
    opts: () => [
      { label: "Pedir un cambio de habitación al cuerpo técnico", subtitle: "Prioridad: descansar bien", consequences: { forma: 2, rel_entrenador: 1 }, outcomeText: "El cuerpo técnico te cambia de habitación sin preguntas. Esa noche duermes de un tirón, y el preparador te sonríe a la mañana siguiente." },
      { label: "Aguantar con tapones y no decir nada", subtitle: "No hacer drama", consequences: { moral: -1, rel_vestuario: 1 }, outcomeText: "Te pones los tapones y aguantas en silencio. Por la mañana, tienes ojeras que nadie menciona, pero que todos ven." },
      { label: `Grabarlo roncando y enseñárselo al grupo`, subtitle: "Venganza en broma", consequences: { rel_vestuario: 3, moral: 2 }, outcomeText: "Pones el vídeo en la pantalla del comedor. Todo el grupo estalla en una carcajada mientras el protagonista se tapa la cara con la servilleta." },
    ],
  },
  {
    key: "comida-concentracion",
    title: "La comida de la concentración no hay quien la aguante",
    tone: ["gracioso"],
    desc: (c) =>
      `El nutricionista de la selección impone un menú tan estricto que todo el vestuario lleva días quejándose en el grupo de WhatsApp. ${c.teammate} llega a proponer un motín pacífico: pedir comida a escondidas por la ventana.`,
    opts: () => [
      { label: "Aguantar el menú sin rechistar", subtitle: "Disciplina ante todo", consequences: { forma: 3, rel_entrenador: 2 }, outcomeText: "Te comes las algas sin pestañear. El nutricionista te mira con orgullo y lo anota en su libreta." },
      { label: "Unirte al plan de comida clandestina", subtitle: "Un capricho no hace daño", consequences: { rel_vestuario: 3, forma: -1 }, outcomeText: "A medianoche, una bolsa de pizzas sube por la ventana. El grupo come en silencio, riendo, con el aroma de la rebelión." },
      { label: "Hablar tú mismo con el nutricionista para pedir un cambio", subtitle: "Solucionarlo por las buenas", consequences: { rel_entrenador: 1, rel_vestuario: 1 }, outcomeText: "Hablas con el nutricionista con calma y argumentos. Al final, os concede un día de menú libre y el grupo te aplaude." },
    ],
  },
  {
    key: "toque-queda-saltado",
    title: "Alguien salta el toque de queda",
    tone: ["surrealista"],
    desc: (c) =>
      `Te despiertas a las 3 de la mañana con ruido en el pasillo: ${c.teammate} y ${c.teammate2} vuelven de escaparse a dar una vuelta por la ciudad, saltándose el toque de queda de la concentración. Te ven justo al salir de tu habitación a mirar.`,
    opts: () => [
      { label: "Hacerte el dormido y no decir nada", subtitle: "No es asunto tuyo", consequences: { rel_vestuario: 1 }, outcomeText: "Cierras la puerta y te metes en la cama. Los dos escapistas se miran, asienten con alivio y se pierden por el pasillo." },
      { label: "Avisarles de que tengan más cuidado la próxima vez", subtitle: "Cubrirles sin sermonear", consequences: { rel_vestuario: 3, moral: 1 }, outcomeText: "Les susurras una advertencia amistosa. Ellos te lo agradecen con un guiño y se ofrecen a invitarte a la próxima." },
      { label: "Contárselo al capitán antes de que se descubra solo", subtitle: "Proteger la disciplina del grupo", consequences: { rel_entrenador: 2, rel_vestuario: -2 }, outcomeText: "El capitán te escucha, asiente y habla con ellos esa misma noche. Al día siguiente, el ambiente es raro y alguien te evita con la mirada." },
    ],
  },
  {
    key: "prenda-perdida",
    title: "Las botas desaparecidas",
    tone: ["surrealista", "gracioso"],
    desc: () =>
      `Llegas al entrenamiento y no encuentras tus botas por ningún lado — alguien las ha escondido como novatada. Todo el vestuario finge no saber nada con una cara de circunstancias que los delata a todos por igual.`,
    opts: (c) => [
      { label: "Entrar en el juego y fingir un ataque de pánico exagerado", subtitle: "Darles el show que quieren", consequences: { rel_vestuario: 4, moral: 2 }, outcomeText: "Montas un drama de ópera por las botas desaparecidas. El vestuario entero se parte de risa y, al final, aparecen en tu taquilla con un lazo." },
      { label: "Entrenar con botas prestadas sin darle más importancia", subtitle: "No morder el anzuelo", consequences: { moral: 1, forma: -1 }, outcomeText: "Entrenas con unas botas prestadas dos tallas grandes. Al acabar, alguien te las devuelve en una caja con un lazo y una nota: 'Perdón'." },
      { label: `Sospechar en voz alta de ${c.teammate}`, subtitle: "Señalar al primer sospechoso", consequences: { rel_vestuario: 1 }, outcomeText: `Señalas a ${c.teammate} y él pone cara de inocente con tanta convicción que nadie sabe si es culpable o no. Las botas aparecen esa tarde.` },
    ],
  },
  {
    key: "entrevista-en-directo-caos",
    title: "Caos en la entrevista en directo",
    tone: ["gracioso"],
    desc: (c) =>
      `Te sacan a una entrevista en directo para televisión justo cuando ${c.teammate} pasa detrás haciendo el tonto para salir en cámara — el reportero intenta seguir la pregunta como si nada, pero se te escapa la risa a media respuesta.`,
    opts: () => [
      { label: "Recomponerte y seguir como un profesional", subtitle: "Salvar la entrevista", consequences: { reputacion: 2, fama: 1 }, outcomeText: "Respiras, sonríes a cámara y acabas la respuesta con calma. El reportero te lo agradece con un guiño profesional." },
      { label: "Reírte abiertamente y señalar lo que ha pasado", subtitle: "Que se vea que sois un grupo unido", consequences: { fama: 3, rel_vestuario: 2 }, outcomeText: "Señalas a tu compañero con una carcajada. El plano sale en directo y se hace viral esa misma tarde." },
      { label: "Cortar la entrevista antes de que vaya a más", subtitle: "Evitar el numerito", consequences: { reputacion: 1 }, outcomeText: "Cortas la entrevista con una sonrisa. El reportero asiente, algo frustrado, y el realizador baja la cámara." },
    ],
  },
  {
    key: "videollamada-familia-torneo",
    title: "Videollamada con casa entre partido y partido",
    desc: () =>
      `Un rato libre entre sesión y sesión, haces videollamada a casa. Te preguntan más por cómo es el hotel y qué comes que por el propio torneo — una tontería que, en medio de tanta presión, te sienta mejor que cualquier otra cosa.`,
    opts: () => [
      { label: "Alargar la llamada todo lo que puedas", subtitle: "Necesitabas ese respiro", consequences: { moral: 4 }, outcomeText: "Hablas con tu familia durante una hora entera, entre risas y noticias del barrio. Al colgar, sientes que respiras mejor." },
      { label: "Colgar pronto para seguir centrado en el torneo", subtitle: "Cabeza en lo importante", consequences: { forma: 1, moral: 1 }, outcomeText: "Cuelgas con un beso rápido y vuelves a tu libro de jugadas. Te repites que habrá tiempo para hablar después, pero te duele un poco." },
    ],
  },
  {
    key: "sorteo-siguiente-rival",
    title: "Se conoce el siguiente rival",
    desc: () =>
      `El sorteo/calendario del torneo deja claro quién viene después: un rival exigente, con nombre propio, del que todo el mundo empieza a hablar en la concentración. El ambiente cambia de golpe, más serio, más tenso.`,
    opts: () => [
      { label: "Ponerte ya a estudiar vídeo del rival", subtitle: "Preparación al detalle", consequences: { rel_entrenador: 2, forma: 1 }, outcomeText: "Pasas la noche viendo vídeos del rival en una tablet. A la mañana, el cuerpo técnico te mira con una ceja levantada y una sonrisa." },
      { label: "Restarle dramatismo delante del grupo", subtitle: "Bajar la tensión ambiente", consequences: { rel_vestuario: 2, moral: 1 }, outcomeText: "Haces un chiste sobre el rival y el vestuario se relaja. El míster te mira de reojo, con una media sonrisa." },
    ],
  },
  {
    key: "fan-imposible-torneo",
    title: "Un aficionado se cuela en el hotel",
    tone: ["surrealista"],
    desc: () =>
      `La seguridad del hotel de concentración pilla a un aficionado que se había colado hasta la planta de las habitaciones solo para pedirte una foto. Cuando te lo cruzas en el pasillo, más que asustado, parece encantado de la vida.`,
    opts: () => [
      { label: "Hacerte la foto de todas formas antes de que se lo lleven", subtitle: "Un gesto con la afición", consequences: { fama: 3, rel_aficion: 3 }, outcomeText: "Te haces el selfie con el fan en tres segundos. Seguridad se lo lleva con una sonrisa y él, entusiasmado, grita tu nombre por el pasillo." },
      { label: "Dejar que seguridad haga su trabajo sin más", subtitle: "Normas son normas", consequences: { reputacion: 1 }, outcomeText: "Seguridad se lo lleva con educación. Él se despide con un gesto de la mano, sin rencor, y tú te quedas con una pizca de culpa." },
      { label: "Reíros juntos del numerito con el resto del grupo", subtitle: "Anécdota para el vestuario", consequences: { rel_vestuario: 2, moral: 2 }, outcomeText: "Lo contáis juntos en la cena. El fan, invitado por el cuerpo técnico, acaba cenando con la expedición entera." },
    ],
  },
  {
    key: "cabra-mascota-torneo",
    title: "La mascota del torneo se cuela en el entreno",
    tone: ["surrealista", "gracioso"],
    desc: () =>
      `La mascota oficial del torneo, suelta un momento por error de organización, se planta en mitad del entrenamiento de la selección. Nadie sabe muy bien si perseguirla o seguir con los ejercicios como si nada.`,
    opts: () => [
      { label: "Unirte a la persecución general entre risas", subtitle: "Rondo improvisado", consequences: { rel_vestuario: 4, moral: 3 }, outcomeText: "Corres detrás de la mascota por el campo con medio vestuario. La imagen aparece en la tele y el míster no sabe si reír o suspirar." },
      { label: "Seguir entrenando ignorando el caos", subtitle: "Profesionalidad ante todo", consequences: { forma: 1, rel_entrenador: 1 }, outcomeText: "Sigues entrenando impasible. La mascota pasa a tu lado, te mira y se marcha, derrotada, entre aplausos de medio equipo." },
    ],
  },
  {
    key: "sorteo-camiseta-torneo",
    title: "El intercambio de camisetas prohibido",
    desc: (c) =>
      `${c.teammate} te propone en secreto intercambiar camiseta con una estrella rival antes de tiempo, algo que el cuerpo técnico prohíbe expresamente hasta que termine el torneo entero — "nadie se va a enterar", te promete.`,
    opts: (c) => [
      { label: "Decir que no, las normas están para cumplirlas", subtitle: "Disciplina de grupo", consequences: { rel_entrenador: 2 }, outcomeText: "Rechazas con una sonrisa. Tu compañero te mira, suspira y se guarda la camiseta. El míster, que lo ha oído todo, te hace un gesto de aprobación." },
      { label: "Hacerlo a escondidas de todas formas", subtitle: "El recuerdo merece el riesgo", consequences: { fama: 2, rel_entrenador: -2, moral: 2 }, outcomeText: "Os cambiáis la camiseta tras un pilar. Funciona... hasta que el míster os ve en la foto del día siguiente." },
      { label: `Convencer a ${c.teammate} de esperar al final del torneo`, subtitle: "Paciencia", consequences: { rel_vestuario: 2 }, outcomeText: `${c.teammate} refunfuña, pero acepta. Cuando acaba el torneo, el intercambio es el primero que hacéis, con un abrazo largo.` },
    ],
  },
  {
    key: "aburrimiento-concentracion",
    title: "El aburrimiento de la concentración aprieta",
    tone: ["gracioso"],
    desc: () =>
      `Entre partido y partido hay más horas muertas de las que nadie esperaba. El grupo entero acaba enganchado a un torneo improvisado de cartas en el salón del hotel que ya dura tres días y que nadie se atreve a dar por terminado.`,
    opts: (c) => [
      { label: "Apuntarte en serio a ganar el torneo de cartas", subtitle: "Competitividad hasta en lo tonto", consequences: { rel_vestuario: 3, moral: 2 } },
      { label: "Aprovechar el rato libre para descansar de verdad", subtitle: "Cuidar el cuerpo", consequences: { forma: 2 } },
      { label: `Retar directamente a ${c.veteran} a la final`, subtitle: "Ir a por el más veterano", consequences: { rel_vestuario: 2, moral: 1 } },
    ],
  },
  // ── Llegada y camiseta (primera escena del torneo) ──────────────────────
  {
    key: "llegada-camiseta-nombre",
    title: "Tu nombre en la camiseta del torneo",
    phase: "arrival",
    milestone: {
      type: "torneo_camiseta",
      imageScene:
        "Photorealistic photo of the photographed man in a national team dressing room, holding up his national team football shirt with his name and number on the back, emotional proud smile, other players blurred in the background, official tournament photo style, no real logos",
    },
    desc: (c) =>
      `El utillero te entrega la camiseta de ${c.torneo} con tu apellido y tu dorsal ya estampados, doblada con un cuidado casi religioso. Nunca habías sentido tanto peso en un trozo de tela. ${c.veteran} te mira desde su taquilla y sonríe sin decir nada: él también pasó por esto.`,
    opts: (c) => [
      { label: "Hacerte la foto con la camiseta y mandarla a casa", subtitle: "Compartirlo con los tuyos", consequences: { moral: 5, rel_aficion: 2, fama: 2 }, outcomeText: "Tu familia responde en segundos con tres emojis llorando y un audio de tu madre que no te atreves a escuchar entero." },
      { label: "Guardarla un momento en silencio antes de ponértela", subtitle: "Un instante solo para ti", consequences: { moral: 4, forma: 1 }, outcomeText: "Cuentas hasta diez, respiras y te la pones. Te queda mejor de lo que imaginabas." },
      { label: `Pedirle a ${c.veteran} un consejo para el primer día`, subtitle: "Aprender del que ya estuvo", consequences: { rel_vestuario: 3, moral: 3 }, outcomeText: `"Disfrútalo, que pasa volando", te dice. Y por primera vez en semanas, se te afloja el nudo del estómago.` },
    ],
  },
  {
    key: "viaje-sede-torneo",
    title: "Un aeropuerto entero esperándote",
    phase: "arrival",
    tone: ["gracioso"],
    desc: () =>
      `La expedición aterriza en la sede del torneo y, al cruzar las puertas de llegadas, hay cientos de aficionados con bufandas y banderas coreando el nombre de tu país. Un niño de unos seis años se abre paso entre la seguridad con una camiseta que le llega hasta las rodillas, gritando tu nombre.`,
    opts: () => [
      { label: "Agacharte, firmarle la camiseta y hacerte la foto", subtitle: "Gesto con la afición", consequences: { fama: 4, rel_aficion: 4 }, outcomeText: "El niño se queda mudo un segundo y luego rompe a llorar de la emoción. Su padre te da las gracias con los ojos rojos." },
      { label: "Saludar desde lejos y seguir al autobús", subtitle: "Cumplir con el protocolo", consequences: { fama: 1 }, outcomeText: "El autobús arranca entre cánticos. Desde la ventanilla ves al niño corriendo detrás unos metros." },
      { label: "Cantar con ellos el himno desde las escaleras", subtitle: "Ponerte a su altura", consequences: { fama: 3, rel_aficion: 3, rel_vestuario: 1 }, outcomeText: "Al segundo verso, medio vestuario se te une. El vídeo corre por las redes antes de que lleguéis al hotel." },
    ],
  },
  // ── Durante el torneo ───────────────────────────────────────────────────
  {
    key: "camiseta-firmada-beso",
    title: "Una camiseta, una firma y una foto que lo cambia todo",
    tone: ["gracioso", "surrealista"],
    desc: () =>
      `Estás firmando camisetas a la salida del hotel cuando una aficionada te alarga la suya, te dice que lleva dos días esperándote y, en el segundo exacto en que te inclinas a firmar, te planta un beso en la mejilla. Un fotógrafo dispara justo ahí. La imagen ya está en tres cuentas de fútbol antes de que llegues a tu habitación.`,
    opts: (c) => [
      { label: "Tomártelo con humor y compartir tú la foto", subtitle: "Dar la vuelta a la historia", consequences: { fama: 5, moral: 3 }, outcomeText: "Tu publicación se hace viral por lo bien que te lo tomas. La aficionada comenta: 'Valió la pena la espera'." },
      { label: "Pedirle al fotógrafo que no la publique", subtitle: "Cuidar tu imagen", consequences: { reputacion: 2, fama: 1 }, outcomeText: "El fotógrafo se encoge de hombros: demasiado tarde, ya la tienen tres agencias. Al menos has dado la cara." },
      { label: `Enseñarle la foto a ${c.teammate} antes de que lo haga la prensa`, subtitle: "Que lo sepa por ti", consequences: { rel_vestuario: 3, moral: 2 }, outcomeText: `${c.teammate} se pasa la cena entera imitando tu cara de susto. Ya sois leyenda del grupo.` },
    ],
  },
  {
    key: "intruso-comedor",
    title: "Un desconocido en la mesa de la selección",
    tone: ["surrealista", "gracioso"],
    desc: (c) =>
      `A mitad de la cena, un señor con acreditación de cartón se sienta con toda naturalidad entre ${c.teammate} y ${c.teammate2}, se sirve una ración de pasta y empieza a explicarle al grupo "cómo lo habría hecho él en el partido de ayer". Nadie sabe quién es. Todos asienten por educación.`,
    opts: (c) => [
      { label: "Seguirle la corriente y pedirle la pizarra", subtitle: "Dejar que se explique", consequences: { rel_vestuario: 4, moral: 3 }, outcomeText: "Dibuja una jugada en una servilleta que, para sorpresa de todos, no es tan mala. El cuerpo técnico se hace el sordo." },
      { label: "Avisar con discreción a seguridad", subtitle: "Resolverlo sin escándalo", consequences: { rel_entrenador: 2, reputacion: 1 }, outcomeText: "Se lo llevan con mucha educación. Al irse, te estrecha la mano: 'Mañana marcas, chaval'." },
      { label: `Preguntarle a ${c.teammate2} si lo conoce, a ver si cuela`, subtitle: "Seguir el juego", consequences: { rel_vestuario: 2 }, outcomeText: "Resulta ser el tío segundo del utillero. Se queda a cenar y a nadie le importa." },
    ],
  },
  {
    key: "ninos-entreno-abierto",
    title: "Entrenamiento a puertas abiertas",
    desc: () =>
      `La federación abre el entrenamiento a diez mil niños de los colegios de la ciudad. Al acabar, te rodean con camisetas, balones y rotuladores. Una niña te enseña un dibujo tuyo marcando un gol, con las piernas más largas que el cuerpo.`,
    opts: () => [
      { label: "Quedarte hasta firmar la última camiseta", subtitle: "Que nadie se vaya sin firma", consequences: { rel_aficion: 5, fama: 3, forma: -1 }, outcomeText: "Llegas el último al autobús con la mano dolorida y una sonrisa que no se te quita. El cuerpo técnico te lo perdona." },
      { label: "Quedarte con el dibujo y prometerle un gol", subtitle: "Una promesa de las serias", consequences: { moral: 5, rel_aficion: 3 }, outcomeText: "Te lo guardas doblado en la bolsa. Ya no hay vuelta atrás: ahora tienes que marcar." },
      { label: "Montar un partidillo improvisado con los niños", subtitle: "Volver a ser un crío", consequences: { moral: 4, rel_vestuario: 2, forma: -1 }, outcomeText: "Te meten tres goles por la escuadra y celebran como si hubieran ganado el torneo." },
    ],
  },
  {
    key: "himno-sesenta-mil",
    title: "El himno, con sesenta mil gargantas",
    milestone: {
      type: "torneo_himno",
      imageScene:
        "Photorealistic photo of the photographed man in a national team kit lined up with teammates in a packed World Cup style stadium during the national anthem, hand on chest, eyes closed, intense emotional expression, dramatic stadium lights, no real logos",
    },
    desc: () =>
      `Suena el himno y el estadio entero lo canta a pleno pulmón. Tienes la mano en el pecho y, en mitad del segundo estribillo, te das cuenta de que te tiembla la voz. Piensas en el patio del colegio donde empezaste a dar patadas a un balón desinflado.`,
    opts: () => [
      { label: "Cantarlo con todas tus fuerzas, aunque se te quiebre", subtitle: "Entregarte al momento", consequences: { moral: 6, rel_aficion: 4, fama: 3 }, outcomeText: "Las cámaras te cogen en primer plano con los ojos brillantes. Ese plano dará la vuelta al país." },
      { label: "Cerrar los ojos y pensar en quienes te trajeron hasta aquí", subtitle: "Un momento íntimo", consequences: { moral: 6, forma: 1 }, outcomeText: "Ves a tu familia sentada en la grada sin necesidad de abrir los ojos. Cuando los abres, el balón ya está rodando." },
      { label: "Mirar a tus compañeros y apretar el brazo del de al lado", subtitle: "Estar juntos", consequences: { rel_vestuario: 5, moral: 3 }, outcomeText: "Hasta el más serio del grupo te devuelve el apretón. Esto ya no es un equipo: es una familia." },
    ],
  },
  {
    key: "mensaje-familia-grada",
    title: "Tu familia en la grada",
    desc: () =>
      `Antes del calentamiento, encuentras en el móvil una foto de tu familia ya sentada en la grada, con bufandas de la selección y tu camiseta puesta, incluida tu abuela, que no había salido nunca de su pueblo. Debajo, un texto de tu padre: "Aquí estamos. Pase lo que pase, ya has ganado".`,
    opts: () => [
      { label: "Contestar con una foto tuya en el túnel", subtitle: "Dedicárselo", consequences: { moral: 6 }, outcomeText: "Tu abuela responde con un audio larguísimo que consiste, básicamente, en llorar. Lo guardas para siempre." },
      { label: "No contestar todavía: guardarlo para después del partido", subtitle: "Concentración total", consequences: { forma: 2, moral: 3 }, outcomeText: "Te guardas el móvil, pero el mensaje te acompaña durante todo el calentamiento." },
    ],
  },
  {
    key: "seleccionador-cena-solo",
    title: "El seleccionador te saca a cenar",
    desc: () =>
      `Al acabar la sesión, el seleccionador te dice que no vayas al comedor: te lleva a cenar a solas a un restaurante del centro. Entre plato y plato te habla del partido, de tu sitio en el equipo y de lo que espera de ti en los próximos días. No te da respuestas fáciles, pero te mira a los ojos todo el rato.`,
    opts: () => [
      { label: "Pedirle claridad: ¿cuál es tu papel?", subtitle: "Directo al grano", consequences: { rel_entrenador: 4, moral: 2 }, outcomeText: "Te lo dice sin rodeos y respiras: sabes exactamente qué se espera de ti." },
      { label: "Escuchar y asentir, sin pedir nada", subtitle: "Dejarle hablar", consequences: { rel_entrenador: 2, reputacion: 2 }, outcomeText: "Sales del restaurante con la sensación de haber pasado un examen que no sabías que estabas haciendo." },
      { label: "Aprovechar para pedirle consejo sobre tu carrera", subtitle: "Mirar más allá del torneo", consequences: { rel_entrenador: 3, reputacion: 3 }, outcomeText: "Te recomienda dos cosas que no esperabas y un contacto que podría cambiarte el futuro." },
    ],
  },
  {
    key: "brazalete-calentamiento",
    title: "El capitán te cede el brazalete",
    milestone: {
      type: "torneo_brazalete",
      imageScene:
        "Photorealistic photo of the photographed man in a national team kit wearing a captain armband during warm-up in a big tournament stadium, serious determined face, teammates behind him, floodlights, no real logos",
    },
    desc: (c) =>
      `${c.veteran}, el capitán, se te acerca en pleno calentamiento, se quita el brazalete y te lo coloca en el brazo durante unos segundos: "Para que lo sientas", te dice. Medio vestuario lo ve y nadie dice nada. Es solo un gesto, pero ya lo has entendido todo.`,
    opts: () => [
      { label: "Devolvérselo con un abrazo", subtitle: "Respeto total", consequences: { rel_vestuario: 5, moral: 4 }, outcomeText: "Te da una palmada en la espalda con más fuerza de la necesaria. Es su forma de decirte que cuenta contigo." },
      { label: "Guardar el recuerdo en la cabeza y salir a jugar", subtitle: "Combustible emocional", consequences: { forma: 2, moral: 5 }, outcomeText: "Sales al campo con el brazo aún caliente de ese momento." },
    ],
  },
  {
    key: "ensayo-penaltis-entreno",
    title: "Ensayo de tanda de penaltis",
    desc: (c) =>
      `El cuerpo técnico organiza un ensayo de tanda de penaltis al final de la sesión. Todo el grupo mira. ${c.teammate} falla el primero y se lleva una ovación burlona. Cuando te toca a ti, el silencio se corta con un cuchillo.`,
    opts: () => [
      { label: "Picarla por el centro, con el pecho por delante", subtitle: "Valentía", consequences: { fama: 1, moral: 3 }, resolve: { baseChance: 0.55, statModifier: "moral", success: { text: "Gol por el centro y rugido del grupo. Hasta el portero aplaude.", consequences: { rel_vestuario: 3, moral: 3 } }, fail: { text: "El portero se queda quieto y la para con el pecho. Risas generales, pero te queda la espinita.", consequences: { rel_vestuario: 1, moral: -2 } } } },
      { label: "Colocarla a la escuadra, sin riesgo de portero", subtitle: "Precisión", consequences: { forma: 1 }, resolve: { baseChance: 0.5, statModifier: "forma", success: { text: "Al ángulo, imposible. El grupo estalla.", consequences: { rel_vestuario: 3, moral: 3 } }, fail: { text: "Se te va por encima del larguero. Eso en el torneo sería carísimo.", consequences: { moral: -3 } } } },
      { label: "Declinar y dejar el turno a otro", subtitle: "No jugártela en un ensayo", consequences: { rel_vestuario: -1 }, outcomeText: "Alguien murmura 'cobarde' en broma. Sabes que lo ha dicho con cariño, pero te escuece un poco." },
    ],
  },
  {
    key: "victoria-noche-vestuario",
    title: "La noche del vestuario",
    desc: (c) =>
      `Volvéis al hotel y nadie quiere acostarse. ${c.teammate} saca un altavoz, alguien apaga las luces del pasillo y, de repente, medio equipo está bailando en calcetines. El cuerpo técnico mira desde el fondo, fingiendo que no ha visto nada.`,
    opts: () => [
      { label: "Unirte y bailar como si nadie mirase", subtitle: "Soltarte", consequences: { rel_vestuario: 5, moral: 4, forma: -1 }, outcomeText: "Alguien te graba. El vídeo del baile dará más de que hablar que el propio gol." },
      { label: "Dar una vuelta y acostarte antes de medianoche", subtitle: "Responsabilidad", consequences: { forma: 2, rel_entrenador: 1 }, outcomeText: "Te despiertas fresco al día siguiente. Los demás, bastante menos." },
    ],
  },
  // ── Víspera de la final ─────────────────────────────────────────────────
  {
    key: "vispera-final",
    title: "La noche antes de la final",
    phase: "final",
    milestone: {
      type: "torneo_vispera_final",
      imageScene:
        "Photorealistic photo of the photographed man in a national team tracksuit sitting alone on an empty stadium pitch at dusk the night before a tournament final, looking up at the stands, quiet emotional atmosphere, no real logos",
    },
    desc: () =>
      `Es la noche anterior a la final. En el hotel nadie habla más alto de lo necesario. Miras el techo de la habitación, repasas cada jugada de los últimos años y sientes que todo el camino —el colegio, la cantera, las lesiones, las dudas— ha servido para estar aquí mañana.`,
    opts: () => [
      { label: "Salir a pasear solo por el jardín del hotel", subtitle: "Despejar la cabeza", consequences: { moral: 5, forma: 2 }, outcomeText: "El aire frío te sienta de maravilla. Vuelves a la habitación con la cabeza clara y el corazón tranquilo." },
      { label: "Escribir una carta a tu yo de dieciséis años", subtitle: "Mirar atrás", consequences: { moral: 6, reputacion: 2 }, outcomeText: "No sabes para qué la escribes, pero al terminar notas un peso que se va." },
      { label: "Reunirte con los veteranos en la sala común", subtitle: "Compartir los nervios", consequences: { rel_vestuario: 5, moral: 3 }, outcomeText: "Nadie dice grandes frases. Solo os quedáis juntos, y eso basta." },
    ],
  },
];

export function buildTorneoLifeEvent(player: Player, progress?: TorneoProgress | null): GameEvent {
  const torneoRaw = progress?.type ?? player.flags?.torneo_activo;
  const torneo = typeof torneoRaw === "string" && torneoRaw ? torneoRaw : "mundial";
  const week = player.week;
  const recent = String(player.flags?.torneo_life_recent ?? "").split(",").filter(Boolean);

  // Primera escena = llegada; víspera de la final = escena especial; el resto, cualquiera.
  const wantedPhase: "arrival" | "final" | undefined =
    progress && progress.lifeCount === 0 ? "arrival" : progress && progress.stage === 6 ? "final" : undefined;
  let pool = TEMPLATES.filter((t) => (wantedPhase ? t.phase === wantedPhase : !t.phase) && !recent.includes(t.key));
  if (pool.length === 0) pool = TEMPLATES.filter((t) => (wantedPhase ? t.phase === wantedPhase : !t.phase));
  const tpl = pool[Math.floor(Math.random() * pool.length)];

  const salt = `torneo-${week}-${tpl.key}`;
  const ctx: Ctx = {
    torneo: torneoLabel(torneo),
    teammate: getTeammateName(player, `${salt}-a`),
    teammate2: getTeammateName(player, `${salt}-b`),
    roommate: getTeammateName(player, `${salt}-room`),
    agent: player.agent_name ?? getPersonName(player, `${salt}-agent`, "m"),
    journalist: getPersonName(player, `${salt}-press`, "any"),
    veteran: getTeammateName(player, `${salt}-vet`),
    fame: getCelebrityName(player, "influencer", salt, "m"),
    bigClub: BIG_CLUBS[(player.id.length + week) % BIG_CLUBS.length],
  };

  const newRecent = [...recent, tpl.key].slice(-8).join(",");
  const flags: Consequences["flags"] = { torneo_life_recent: newRecent };
  const withFlags = (c: Consequences): Consequences => ({ ...c, flags: { ...(c.flags ?? {}), ...flags } });

  return {
    id: `torneo-life-${tpl.key}-${week}-${progress?.stage ?? 0}`,
    category: "vida",
    title: tpl.title,
    description: tpl.desc(ctx),
    ...(tpl.milestone ? { isMilestone: true, milestoneType: tpl.milestone.type, imageScene: tpl.milestone.imageScene } : {}),
    options: tpl.opts(ctx).map((o, i) => ({
      ...o,
      id: String(i),
      consequences: withFlags(o.consequences),
      resolve: o.resolve
        ? {
            ...o.resolve,
            success: { ...o.resolve.success, consequences: withFlags(o.resolve.success.consequences) },
            fail: { ...o.resolve.fail, consequences: withFlags(o.resolve.fail.consequences) },
          }
        : undefined,
    })),
  };
}
