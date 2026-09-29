import type { Consequences, EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
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

const MAX_PER_TORNEO = 3;

export function shouldTriggerTorneoLife(player: Player): boolean {
  const torneo = player.flags?.torneo_activo;
  if (!torneo || typeof torneo !== "string") return false;
  const n = Number(player.flags?.torneo_life_n ?? 0);
  if (n >= MAX_PER_TORNEO) return false;
  return Math.random() < 0.6;
}

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
      { label: "Pedirle a tu agente discreción total", subtitle: "No distraerte del torneo", consequences: { rel_representante: 2, moral: 1 } },
      { label: `Dejar que ${c.agent} mueva el contacto en paralelo`, subtitle: "Aprovechar el momento", consequences: { rel_representante: 3, fama: 2 } },
      { label: "Ignorarlo por completo hasta que acabe el torneo", subtitle: "Cabeza fría", consequences: { forma: 2, moral: 1 } },
    ],
  },
  {
    key: "club-observa-rendimiento",
    title: "Alguien está mirando",
    desc: () =>
      `Un periodista se te acerca en zona mixta con una pregunta que no es sobre el partido: "¿Es verdad que hay un club de Champions preguntando por tu cláusula?". No tienes ni idea de si es verdad, pero la pregunta ya está hecha.`,
    opts: () => [
      { label: "Responder con una evasiva elegante", subtitle: "No alimentar el rumor", consequences: { reputacion: 2 } },
      { label: "Sonreír sin decir que no", subtitle: "Dejar la puerta entreabierta", consequences: { fama: 3, moral: 1 } },
      { label: "Cortar la pregunta en seco: 'estoy centrado en el torneo'", subtitle: "Profesionalidad ante todo", consequences: { rel_entrenador: 2, reputacion: 1 } },
    ],
  },
  {
    key: "habitacion-equivocada",
    title: "La habitación equivocada",
    tone: ["surrealista", "gracioso"],
    desc: (c) =>
      `Vuelves de madrugada de la sala de fisio, medio dormido, y entras en la habitación equivocada de la concentración — te metes literalmente en la cama de ${c.teammate}, que se despierta gritando y casi te deja sin cejas del susto.`,
    opts: (c) => [
      { label: "Reíros los dos hasta las lágrimas", subtitle: "Convertirlo en anécdota del grupo", consequences: { rel_vestuario: 4, moral: 3 } },
      { label: "Pedir disculpas avergonzado y desaparecer", subtitle: "Que no se entere nadie más", consequences: { moral: 1, rel_vestuario: 1 } },
      { label: `Culpar a ${c.teammate2} del numerito ante el resto`, subtitle: "Salvarte como puedas", consequences: { rel_vestuario: -1, moral: 2 } },
    ],
  },
  {
    key: "vomito-avion",
    title: "El vuelo de la vergüenza",
    tone: ["gracioso"],
    desc: (c) =>
      `El vuelo a la siguiente ciudad del torneo se llena de turbulencias justo después de comer. No lo aguantas: vomitas delante de media expedición, incluido ${c.veteran}, que no deja de reírse el resto del vuelo cada vez que te mira.`,
    opts: (c) => [
      { label: "Reírte de ti mismo antes que nadie", subtitle: "Quitarle hierro", consequences: { rel_vestuario: 3, moral: 2 } },
      { label: "Pasar el resto del vuelo escondido tras los auriculares", subtitle: "Que se olvide rápido", consequences: { moral: -1 } },
      { label: `Retar a ${c.veteran} a aguantar el próximo vuelo igual de mal`, subtitle: "Venganza con humor", consequences: { rel_vestuario: 2, moral: 2 } },
    ],
  },
  {
    key: "ronquidos-compi-cuarto",
    title: "El compañero de habitación ronca como una moto",
    tone: ["gracioso"],
    desc: (c) =>
      `Te toca compartir habitación con ${c.roommate} durante toda la fase de grupos, y descubres la primera noche que ronca tan fuerte que se oye desde el pasillo. Llevas dos noches durmiendo fatal y el torneo apenas empieza.`,
    opts: () => [
      { label: "Pedir un cambio de habitación al cuerpo técnico", subtitle: "Prioridad: descansar bien", consequences: { forma: 2, rel_entrenador: 1 } },
      { label: "Aguantar con tapones y no decir nada", subtitle: "No hacer drama", consequences: { moral: -1, rel_vestuario: 1 } },
      { label: `Grabarlo roncando y enseñárselo al grupo`, subtitle: "Venganza en broma", consequences: { rel_vestuario: 3, moral: 2 } },
    ],
  },
  {
    key: "comida-concentracion",
    title: "La comida de la concentración no hay quien la aguante",
    tone: ["gracioso"],
    desc: (c) =>
      `El nutricionista de la selección impone un menú tan estricto que todo el vestuario lleva días quejándose en el grupo de WhatsApp. ${c.teammate} llega a proponer un motín pacífico: pedir comida a escondidas por la ventana.`,
    opts: () => [
      { label: "Aguantar el menú sin rechistar", subtitle: "Disciplina ante todo", consequences: { forma: 3, rel_entrenador: 2 } },
      { label: "Unirte al plan de comida clandestina", subtitle: "Un capricho no hace daño", consequences: { rel_vestuario: 3, forma: -1 } },
      { label: "Hablar tú mismo con el nutricionista para pedir un cambio", subtitle: "Solucionarlo por las buenas", consequences: { rel_entrenador: 1, rel_vestuario: 1 } },
    ],
  },
  {
    key: "toque-queda-saltado",
    title: "Alguien salta el toque de queda",
    tone: ["surrealista"],
    desc: (c) =>
      `Te despiertas a las 3 de la mañana con ruido en el pasillo: ${c.teammate} y ${c.teammate2} vuelven de escaparse a dar una vuelta por la ciudad, saltándose el toque de queda de la concentración. Te ven justo al salir de tu habitación a mirar.`,
    opts: () => [
      { label: "Hacerte el dormido y no decir nada", subtitle: "No es asunto tuyo", consequences: { rel_vestuario: 1 } },
      { label: "Avisarles de que tengan más cuidado la próxima vez", subtitle: "Cubrirles sin sermonear", consequences: { rel_vestuario: 3, moral: 1 } },
      { label: "Contárselo al capitán antes de que se descubra solo", subtitle: "Proteger la disciplina del grupo", consequences: { rel_entrenador: 2, rel_vestuario: -2 } },
    ],
  },
  {
    key: "prenda-perdida",
    title: "Las botas desaparecidas",
    tone: ["surrealista", "gracioso"],
    desc: () =>
      `Llegas al entrenamiento y no encuentras tus botas por ningún lado — alguien las ha escondido como novatada. Todo el vestuario finge no saber nada con una cara de circunstancias que los delata a todos por igual.`,
    opts: (c) => [
      { label: "Entrar en el juego y fingir un ataque de pánico exagerado", subtitle: "Darles el show que quieren", consequences: { rel_vestuario: 4, moral: 2 } },
      { label: "Entrenar con botas prestadas sin darle más importancia", subtitle: "No morder el anzuelo", consequences: { moral: 1, forma: -1 } },
      { label: `Sospechar en voz alta de ${c.teammate}`, subtitle: "Señalar al primer sospechoso", consequences: { rel_vestuario: 1 } },
    ],
  },
  {
    key: "entrevista-en-directo-caos",
    title: "Caos en la entrevista en directo",
    tone: ["gracioso"],
    desc: (c) =>
      `Te sacan a una entrevista en directo para televisión justo cuando ${c.teammate} pasa detrás haciendo el tonto para salir en cámara — el reportero intenta seguir la pregunta como si nada, pero se te escapa la risa a media respuesta.`,
    opts: () => [
      { label: "Recomponerte y seguir como un profesional", subtitle: "Salvar la entrevista", consequences: { reputacion: 2, fama: 1 } },
      { label: "Reírte abiertamente y señalar lo que ha pasado", subtitle: "Que se vea que sois un grupo unido", consequences: { fama: 3, rel_vestuario: 2 } },
      { label: "Cortar la entrevista antes de que vaya a más", subtitle: "Evitar el numerito", consequences: { reputacion: 1 } },
    ],
  },
  {
    key: "videollamada-familia-torneo",
    title: "Videollamada con casa entre partido y partido",
    desc: () =>
      `Un rato libre entre sesión y sesión, haces videollamada a casa. Te preguntan más por cómo es el hotel y qué comes que por el propio torneo — una tontería que, en medio de tanta presión, te sienta mejor que cualquier otra cosa.`,
    opts: () => [
      { label: "Alargar la llamada todo lo que puedas", subtitle: "Necesitabas ese respiro", consequences: { moral: 4 } },
      { label: "Colgar pronto para seguir centrado en el torneo", subtitle: "Cabeza en lo importante", consequences: { forma: 1, moral: 1 } },
    ],
  },
  {
    key: "sorteo-siguiente-rival",
    title: "Se conoce el siguiente rival",
    desc: () =>
      `El sorteo/calendario del torneo deja claro quién viene después: un rival exigente, con nombre propio, del que todo el mundo empieza a hablar en la concentración. El ambiente cambia de golpe, más serio, más tenso.`,
    opts: () => [
      { label: "Ponerte ya a estudiar vídeo del rival", subtitle: "Preparación al detalle", consequences: { rel_entrenador: 2, forma: 1 } },
      { label: "Restarle dramatismo delante del grupo", subtitle: "Bajar la tensión ambiente", consequences: { rel_vestuario: 2, moral: 1 } },
    ],
  },
  {
    key: "fan-imposible-torneo",
    title: "Un aficionado se cuela en el hotel",
    tone: ["surrealista"],
    desc: () =>
      `La seguridad del hotel de concentración pilla a un aficionado que se había colado hasta la planta de las habitaciones solo para pedirte una foto. Cuando te lo cruzas en el pasillo, más que asustado, parece encantado de la vida.`,
    opts: () => [
      { label: "Hacerte la foto de todas formas antes de que se lo lleven", subtitle: "Un gesto con la afición", consequences: { fama: 3, rel_aficion: 3 } },
      { label: "Dejar que seguridad haga su trabajo sin más", subtitle: "Normas son normas", consequences: { reputacion: 1 } },
      { label: "Reíros juntos del numerito con el resto del grupo", subtitle: "Anécdota para el vestuario", consequences: { rel_vestuario: 2, moral: 2 } },
    ],
  },
  {
    key: "cabra-mascota-torneo",
    title: "La mascota del torneo se cuela en el entreno",
    tone: ["surrealista", "gracioso"],
    desc: () =>
      `La mascota oficial del torneo, suelta un momento por error de organización, se planta en mitad del entrenamiento de la selección. Nadie sabe muy bien si perseguirla o seguir con los ejercicios como si nada.`,
    opts: () => [
      { label: "Unirte a la persecución general entre risas", subtitle: "Rondo improvisado", consequences: { rel_vestuario: 4, moral: 3 } },
      { label: "Seguir entrenando ignorando el caos", subtitle: "Profesionalidad ante todo", consequences: { forma: 1, rel_entrenador: 1 } },
    ],
  },
  {
    key: "sorteo-camiseta-torneo",
    title: "El intercambio de camisetas prohibido",
    desc: (c) =>
      `${c.teammate} te propone en secreto intercambiar camiseta con una estrella rival antes de tiempo, algo que el cuerpo técnico prohíbe expresamente hasta que termine el torneo entero — "nadie se va a enterar", te promete.`,
    opts: (c) => [
      { label: "Decir que no, las normas están para cumplirlas", subtitle: "Disciplina de grupo", consequences: { rel_entrenador: 2 } },
      { label: "Hacerlo a escondidas de todas formas", subtitle: "El recuerdo merece el riesgo", consequences: { fama: 2, rel_entrenador: -2, moral: 2 } },
      { label: `Convencer a ${c.teammate} de esperar al final del torneo`, subtitle: "Paciencia", consequences: { rel_vestuario: 2 } },
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
];

export function buildTorneoLifeEvent(player: Player): GameEvent {
  const torneoRaw = player.flags?.torneo_activo;
  const torneo = typeof torneoRaw === "string" && torneoRaw ? torneoRaw : "mundial";
  const week = player.week;
  const recent = String(player.flags?.torneo_life_recent ?? "").split(",").filter(Boolean);
  let pool = TEMPLATES.filter((t) => !recent.includes(t.key));
  if (pool.length === 0) pool = TEMPLATES;
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

  const n = Number(player.flags?.torneo_life_n ?? 0) + 1;
  const newRecent = [...recent, tpl.key].slice(-6).join(",");
  const flags: Consequences["flags"] = { torneo_life_n: String(n), torneo_life_recent: newRecent };
  // Se apaga solo tras MAX_PER_TORNEO apariciones — sin esto seguiría
  // disparándose indefinidamente cada vez que el jugador vuelva a
  // encontrarse en semana de torneo en carreras muy largas.
  if (n >= MAX_PER_TORNEO) flags.torneo_activo = "";
  const withFlags = (c: Consequences): Consequences => ({ ...c, flags: { ...(c.flags ?? {}), ...flags } });

  return {
    id: `torneo-life-${tpl.key}-${week}`,
    category: "vida",
    title: tpl.title,
    description: tpl.desc(ctx),
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
