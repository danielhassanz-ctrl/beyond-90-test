import type { Consequences, EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getCelebrityName, getNpcName, getPersonName, getTeammateName } from "@/lib/narrative/npcs";

/**
 * Vida de pretemporada: en cada pretemporada (y, sobre todo, en la primera
 * de la carrera) pasan muchas cosas además de correr: giras, presentación
 * de la camiseta, fichajes que te amenazan el puesto, salidas de
 * compañeros, rumores de traspaso, renovaciones, dorsales, novatadas...
 *
 * Todo en código (cero llamadas a la IA). Ids "preseason-ev-*": el flujo de
 * carrera/actions.ts los trata como eventos que NO avanzan la semana, y el
 * tope por temporada (flag `pre_n_<temporada>`) evita que se encadenen sin
 * fin. Los últimos usados van en `pre_recent` para no repetirse.
 */

const MAX_PER_SEASON = 4;

export function isPreseasonLifeWindow(week: number): boolean {
  const season = Math.floor((week - 1) / 10);
  const w = ((week - 1) % 10) + 1;
  // Primera temporada: después de la secuencia guionada de arranque.
  if (season === 0) return w >= 3 && w <= 6;
  return w >= 1 && w <= 4;
}

export function shouldTriggerPreseasonLife(player: Player): boolean {
  if (player.club === NO_CLUB_YET) return false;
  if (!isPreseasonLifeWindow(player.week)) return false;
  const season = Math.floor((player.week - 1) / 10);
  const n = Number(player.flags?.[`pre_n_${season}`] ?? 0);
  if (n >= MAX_PER_SEASON) return false;
  return Math.random() < 0.75;
}

interface Ctx {
  club: string;
  coach: string;
  fisio: string;
  captain: string;
  director: string;
  agent: string;
  mate: string;
  mate2: string;
  rival: string;
  star: string;
  kid: string;
  fame: string;
  city: string;
}

type Opt = Omit<EventOption, "id"> & { id?: string };
interface Tpl {
  key: string;
  title: string;
  desc: (c: Ctx) => string;
  opts: (c: Ctx) => Opt[];
}

const TOURS = ["Estados Unidos", "Japón", "Emiratos Árabes", "China", "Australia", "México"];

const TEMPLATES: Tpl[] = [
  {
    key: "gira",
    title: "Gira de pretemporada",
    desc: (c) => `El ${c.club} viaja de gira a ${TOURS[c.club.length % TOURS.length]}: vuelos largos, estadios enormes y mucho calor. ${c.coach} avisa de que allí también se gana el puesto.`,
    opts: (c) => [
      { label: "Centrarte en cada entreno", subtitle: "Que el míster te vea", consequences: { rel_entrenador: 3, forma: 2 } },
      { label: "Aprovechar para dejarte ver", subtitle: "Fotos, fans y camisetas", consequences: { fama: 4, forma: -2 } },
      {
        label: "Salir de noche con los compañeros",
        subtitle: `Con ${c.mate} y compañía`,
        consequences: { rel_vestuario: 2 },
        resolve: {
          baseChance: 0.5,
          success: { text: "Noche de risas y unión: vuelves con el vestuario a tus pies y sin que nadie se entere.", consequences: { rel_vestuario: 5, moral: 3 } },
          fail: { text: `${c.coach} os pilla llegando de madrugada. Multa, bronca y titulares.`, consequences: { rel_entrenador: -4, moral: -3, patrimonio: -800 } },
        },
      },
    ],
  },
  {
    key: "camiseta",
    title: "Presentación de la camiseta",
    desc: (c) => `El ${c.club} presenta la nueva equipación y te eligen para la sesión de fotos. Focos, maquillaje y un fotógrafo que te pide "cara de ganador".`,
    opts: () => [
      { label: "Posar con orgullo", subtitle: "Una foto que se hace viral", consequences: { fama: 4, moral: 2 } },
      { label: "Hacer el tonto delante de la cámara", subtitle: "Un vídeo divertido para las redes", consequences: { fama: 3, rel_vestuario: 2, rel_aficion: 2 } },
      { label: "Quedarte al fondo", subtitle: "Que brillen los demás", consequences: { rel_vestuario: 2, reputacion: 1 } },
    ],
  },
  {
    key: "rival_puesto",
    title: "Han fichado a alguien en tu puesto",
    desc: (c) => `${c.director} presenta un fichaje en tu demarcación: ${c.rival}, con currículo y hambre. Los periodistas ya preguntan si peligra tu sitio.`,
    opts: (c) => [
      { label: "Ponerte a trabajar el doble", subtitle: "Ganarle el puesto en los entrenos", consequences: { forma: 3, rel_entrenador: 2, moral: -1 } },
      { label: `Hablar con ${c.coach}`, subtitle: "Aclarar cuál es tu papel", consequences: { rel_entrenador: 1 }, resolve: { baseChance: 0.55, success: { text: "El míster te da confianza: seguirás contando y te lo dice a la cara.", consequences: { moral: 4, rel_entrenador: 3 } }, fail: { text: "El míster responde con evasivas: 'aquí se gana todo en el campo'. Te vas con más dudas.", consequences: { moral: -3 } } } },
      { label: `Pedirle a ${c.agent} que mire opciones`, subtitle: "Por si acaso", consequences: { rel_representante: 2, moral: -1 } },
    ],
  },
  {
    key: "salida_compi",
    title: "Se va un compañero del vestuario",
    desc: (c) => `${c.mate} se despide: el club lo traspasa y el vestuario lo nota. Últimas risas en el rondo y un abrazo largo en la puerta del vestuario.`,
    opts: (c) => [
      { label: "Despedirlo con una cena", subtitle: "Todo el equipo, como se merece", consequences: { rel_vestuario: 5, moral: 2, patrimonio: -400 } },
      { label: "Un abrazo y un mensaje", subtitle: "Sin dramatismos", consequences: { moral: 1, rel_vestuario: 1 } },
      { label: `Pedirle su dorsal a ${c.director}`, subtitle: "Un número vacante", consequences: { fama: 1, rel_vestuario: -1 } },
    ],
  },
  {
    key: "sistema",
    title: "El míster cambia el sistema",
    desc: (c) => `${c.coach} reúne al grupo con una pizarra llena de flechas: nuevo dibujo, nuevos roles y mucha presión alta. No todos entienden el plan.`,
    opts: () => [
      { label: "Estudiar el plan por tu cuenta", subtitle: "Vídeo, apuntes y preguntas", consequences: { media: 1, rel_entrenador: 2 } },
      { label: "Discutirlo con el capitán", subtitle: "Buscar tu hueco", consequences: { rel_vestuario: 2 } },
      { label: "Poner mala cara", subtitle: "No lo ves claro", consequences: { rel_entrenador: -3, moral: -1 } },
    ],
  },
  {
    key: "test_fisico",
    title: "Test físico de pretemporada",
    desc: (c) => `El preparador físico te cronometra en el test de resistencia. ${c.mate} y tú lleváis apuesta sobre quién llega más lejos.`,
    opts: () => [
      {
        label: "Darlo todo",
        subtitle: "Hasta vaciarte",
        consequences: { forma: 1 },
        resolve: {
          baseChance: 0.55,
          success: { text: "Marca personal: el preparador lo apunta con una sonrisa y el míster te felicita.", consequences: { forma: 5, moral: 3, rel_entrenador: 2 } },
          fail: { text: "Te dejas la piel pero cierras entre los últimos: calambres y algo de vergüenza.", consequences: { forma: -2, moral: -2 } },
        },
      },
      { label: "Gestionar el esfuerzo", subtitle: "Llegar entero a agosto", consequences: { forma: 2 } },
    ],
  },
  {
    key: "altura",
    title: "Concentración en altura",
    desc: (c) => `El ${c.club} se concentra diez días en la montaña. Aire limpio, móviles sin cobertura y noches de cartas y bromas en la habitación.`,
    opts: (c) => [
      { label: "Ser el alma de las cartas", subtitle: `Con ${c.mate} y ${c.mate2}`, consequences: { rel_vestuario: 4, moral: 2 } },
      { label: "Dormir y recuperar", subtitle: "El cuerpo lo agradece", consequences: { forma: 4 } },
      { label: "Grabar la concentración para tus redes", subtitle: "Contenido diferente", consequences: { fama: 3, rel_entrenador: -1 } },
    ],
  },
  {
    key: "puertas_abiertas",
    title: "Jornada de puertas abiertas",
    desc: (c) => `Miles de aficionados llenan el campo de entrenamiento del ${c.club}. Un niño, ${c.kid}, lleva tu nombre pintado a mano en la camiseta.`,
    opts: () => [
      { label: "Firmarle la camiseta y hacerte una foto", subtitle: "El niño no lo va a olvidar", consequences: { rel_aficion: 5, fama: 2, moral: 3 } },
      { label: "Regalarle tus botas", subtitle: "Un detalle que se recuerda", consequences: { rel_aficion: 6, moral: 4, patrimonio: -200 } },
      { label: "Saludar desde lejos", subtitle: "Estás concentrado", consequences: { rel_aficion: -1 } },
    ],
  },
  {
    key: "renovacion",
    title: "Te hablan de renovar",
    desc: (c) => `${c.director} te cita en su despacho: el club quiere mejorarte el contrato. ${c.agent} llama justo después de colgar: "No firmes nada sin hablar conmigo".`,
    opts: (c) => [
      { label: "Firmar la mejora", subtitle: "Seguridad y más sueldo", consequences: { patrimonio: 3000, moral: 3, rel_representante: -1 } },
      { label: `Dejar que ${c.agent} negocie`, subtitle: "Más tiempo, más cifra", consequences: { rel_representante: 3 }, resolve: { baseChance: 0.55, success: { text: "Sale una mejora mucho mejor de lo previsto y una cláusula que te da poder.", consequences: { patrimonio: 6000, moral: 4, rel_representante: 2 } }, fail: { text: "El club se enfría con la espera y la oferta se queda en menos de lo que te ofrecían.", consequences: { patrimonio: 1000, moral: -2 } } } },
      { label: "Esperar a ver el mercado", subtitle: "No cerrar puertas", consequences: { moral: -1, rel_representante: 1 } },
    ],
  },
  {
    key: "clausula",
    title: "Suenan por tu cláusula",
    desc: (c) => `${c.agent} te lo suelta por teléfono: hay un club grande que ha preguntado por tu cláusula. "No es nada, pero conviene que lo sepas".`,
    opts: () => [
      { label: "Pedirle detalles", subtitle: "Saber cuánto hay de verdad", consequences: { rel_representante: 2, fama: 1 } },
      { label: "Decirle que ni lo mire", subtitle: "Aquí estás bien", consequences: { rel_aficion: 3, moral: 2 } },
      { label: "Filtrarlo sin querer", subtitle: "Que el club se entere", consequences: { fama: 4, rel_aficion: -3, rel_entrenador: -1 } },
    ],
  },
  {
    key: "novato",
    title: "El canterano que te pide consejo",
    desc: (c) => `${c.kid}, un chaval del juvenil que ha subido a entrenar con el primer equipo, se te acerca en el vestuario: "¿Puedo preguntarte una cosa?".`,
    opts: () => [
      { label: "Hacerle de hermano mayor", subtitle: "Como te ayudaron a ti", consequences: { rel_vestuario: 3, moral: 3, reputacion: 2 } },
      { label: "Darle un consejo rápido", subtitle: "Y a lo tuyo", consequences: { rel_vestuario: 1 } },
      { label: "Ponerle a prueba", subtitle: "Que aprenda sufriendo", consequences: { rel_vestuario: -1, moral: 1 } },
    ],
  },
  {
    key: "entrevista",
    title: "Entrevista de pretemporada",
    desc: (c) => `Un periodista de ${c.club} te pregunta: "¿Qué objetivo os ponéis esta temporada?". La grabadora ya está encendida.`,
    opts: () => [
      { label: "Ir a por todo", subtitle: "Ambición, sin miedo", consequences: { fama: 3, rel_aficion: 3, rel_entrenador: -1 } },
      { label: "Ir partido a partido", subtitle: "Prudencia futbolera", consequences: { rel_entrenador: 2, reputacion: 1 } },
      { label: "Bromear con la respuesta", subtitle: "Titular garantizado", consequences: { fama: 4, moral: 1, rel_entrenador: -1 } },
    ],
  },
  {
    key: "cena_novatada",
    title: "Cena de equipo y novatada",
    desc: (c) => `El vestuario del ${c.club} organiza la cena de inicio de temporada y ${c.captain} te señala: "Al nuevo le toca cantar".`,
    opts: () => [
      {
        label: "Cantar sin vergüenza",
        subtitle: "Lo que salga",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          success: { text: "Cantas fatal, pero con tanta gracia que te ovacionan de pie. Ya eres uno más.", consequences: { rel_vestuario: 6, moral: 4 } },
          fail: { text: "Se te va la voz y la letra: el vídeo circula por el grupo del vestuario toda la semana.", consequences: { rel_vestuario: 2, moral: -2, fama: 1 } },
        },
      },
      { label: "Negociar: pagar la ronda", subtitle: "La salida comprada", consequences: { patrimonio: -300, rel_vestuario: 3 } },
      { label: "Escaquearte al baño", subtitle: "Arriesgado", consequences: { rel_vestuario: -3 } },
    ],
  },
  {
    key: "lesion_leve",
    title: "Un pinchazo en el entreno",
    desc: (c) => `Sientes un tirón en el muslo durante el rondo. El fisio ${c.fisio} te mira: "Para si quieres llegar sano al domingo".`,
    opts: () => [
      { label: "Parar y hacer caso", subtitle: "Un par de días en el gimnasio", consequences: { forma: 1, moral: -1 } },
      {
        label: "Seguir como si nada",
        subtitle: "No quieres perder sitio",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          success: { text: "Era solo un susto: el músculo aguanta y el míster ve tu carácter.", consequences: { rel_entrenador: 3, moral: 2 } },
          fail: { text: "El tirón se convierte en molestia y pierdes varios días de trabajo.", consequences: { forma: -6, moral: -3 } },
        },
      },
    ],
  },
  {
    key: "fans_hotel",
    title: "La afición en la puerta del hotel",
    desc: (c) => `Cientos de hinchas del ${c.club} esperan al autobús con bufandas y cánticos. Entre ellos, alguien te grita un ánimo que te llega.`,
    opts: () => [
      { label: "Parar a firmar", subtitle: "Diez minutos que valen oro", consequences: { rel_aficion: 4, fama: 2 } },
      { label: "Saludar desde la ventanilla", subtitle: "Sin retrasar al equipo", consequences: { rel_aficion: 2 } },
      { label: "Pasar de largo", subtitle: "Hoy no es el día", consequences: { rel_aficion: -3 } },
    ],
  },
  {
    key: "famoso",
    title: "Un famoso en el entrenamiento",
    desc: (c) => `El club invita a ${c.fame}, muy conocido por sus redes, a ver el entrenamiento. Al terminar, pide una foto contigo delante de todo el mundo.`,
    opts: (c) => [
      { label: "Hacerte la foto", subtitle: "Una buena publicidad", consequences: { fama: 4, rel_vestuario: -1 } },
      { label: `Presentárselo a ${c.mate}`, subtitle: "Que también salga", consequences: { fama: 2, rel_vestuario: 2 } },
      { label: "Pasar de la foto", subtitle: "Trabajar", consequences: { reputacion: 2, fama: -1 } },
    ],
  },
  {
    key: "dorsal",
    title: "Pelea por el dorsal",
    desc: (c) => `Queda libre un dorsal que a ti te gusta. ${c.mate} también lo quiere y ha ido ya a hablar con el utillero. Quedan dos días para inscribir.`,
    opts: (c) => [
      { label: "Ofrecerle un trato", subtitle: "Cena por dorsal", consequences: { patrimonio: -250, rel_vestuario: 2, fama: 1 } },
      { label: "Ganártelo en un reto", subtitle: "Un penalti, cara o cruz", consequences: {}, resolve: { baseChance: 0.5, success: { text: `Ganas el reto a ${c.mate} y luces tu dorsal con orgullo.`, consequences: { moral: 4, rel_vestuario: 2 } }, fail: { text: `${c.mate} gana y se queda el dorsal. Tú te ríes por fuera.`, consequences: { moral: -1, rel_vestuario: 1 } } } },
      { label: "Dejárselo", subtitle: "No merece la pena", consequences: { rel_vestuario: 3, moral: -1 } },
    ],
  },
  {
    key: "golazo_viral",
    title: "Tu golazo en el amistoso se hace viral",
    desc: (c) => `Un gol de otro planeta en un amistoso del ${c.club} da la vuelta a las redes. Las cuentas de fútbol lo suben con un "¿Quién es este?".`,
    opts: () => [
      { label: "Compartirlo con humildad", subtitle: "Gracias al equipo", consequences: { fama: 4, reputacion: 2, rel_vestuario: 2 } },
      { label: "Subirte al carro", subtitle: "Mensaje a los rivales", consequences: { fama: 5, rel_vestuario: -1 } },
      { label: "No decir nada", subtitle: "Solo fútbol", consequences: { fama: 2, moral: 1 } },
    ],
  },
  {
    key: "abonados",
    title: "Campaña de abonados",
    desc: (c) => `El ${c.club} lanza la campaña de abonos y te pide que salgas en el vídeo con el lema de la temporada. Solo pide una tarde de tu tiempo.`,
    opts: () => [
      { label: "Grabar con ganas", subtitle: "Que la afición se ilusione", consequences: { rel_aficion: 5, fama: 2 } },
      { label: "Grabar rápido", subtitle: "Toma única", consequences: { rel_aficion: 2 } },
      { label: "Pedir algo a cambio", subtitle: "Una prima por imagen", consequences: { patrimonio: 1500, rel_aficion: -2, reputacion: -1 } },
    ],
  },
  {
    key: "vacaciones",
    title: "Vuelves de vacaciones",
    desc: (c) => `El vestuario del ${c.club} vuelve del verano: bronceados, anécdotas y algún kilo de más. ${c.coach} os pesa uno a uno con el cronómetro en la mano.`,
    opts: () => [
      {
        label: "Presentarte en forma",
        subtitle: "Trabajaste en la playa",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          success: { text: "Diez sobre diez en la báscula. El míster te pone de ejemplo delante de todos.", consequences: { forma: 4, rel_entrenador: 3, moral: 3 } },
          fail: { text: "Se te fue la mano con los helados: dos kilos de más y una charla a solas.", consequences: { forma: -3, rel_entrenador: -2 } },
        },
      },
      { label: "Ir despacio y ponerte a punto", subtitle: "Con calma", consequences: { forma: 2 } },
    ],
  },
  {
    key: "despacho",
    title: "El presidente te llama al despacho",
    desc: (c) => `${c.director} te pide que pases por el palco antes del entrenamiento: el presidente quiere enseñarte el proyecto del ${c.club} para los próximos años.`,
    opts: () => [
      { label: "Escuchar con atención", subtitle: "Y decir sí a todo", consequences: { moral: 3, rel_aficion: 1 } },
      { label: "Preguntar por los fichajes", subtitle: "Sin miedo", consequences: { reputacion: 2, moral: 1 } },
      { label: "Preguntar por tu futuro", subtitle: "Y el sueldo", consequences: { rel_representante: 1, patrimonio: 800 } },
    ],
  },
  {
    key: "rumor_te_ofrecen",
    title: "Tu nombre en la lista de transferibles",
    desc: (c) => `Un medio publica que el ${c.club} "escucharía ofertas" por ti. ${c.agent} llama sobresaltado: "No sé de dónde ha salido, pero hay que aclararlo".`,
    opts: (c) => [
      { label: `Ir a hablar con ${c.director}`, subtitle: "Que te lo diga a la cara", consequences: { rel_entrenador: 1 }, resolve: { baseChance: 0.6, success: { text: "Era una filtración interesada de otro club. El director te asegura que cuentan contigo.", consequences: { moral: 4, rel_aficion: 2 } }, fail: { text: "No lo niega del todo: 'si llega una gran oferta, lo hablamos'. Te quedas pensando.", consequences: { moral: -3, rel_representante: 1 } } } },
      { label: "Pedirle a tu agente que lo desmienta", subtitle: "Ruido fuera", consequences: { rel_representante: 2, fama: 1 } },
      { label: "Ignorarlo", subtitle: "El campo hablará", consequences: { moral: -1, reputacion: 1 } },
    ],
  },
  {
    key: "estrella",
    title: "Llega una estrella",
    desc: (c) => `El ${c.club} presenta a ${c.star}, un fichaje bomba para la temporada. Estadio lleno, camisetas por todos lados y el vestuario en modo expectación.`,
    opts: (c) => [
      { label: "Ir a saludarle el primero", subtitle: "Buen rollo y cercanía", consequences: { rel_vestuario: 3, fama: 2 } },
      { label: "Aprender todo lo que puedas", subtitle: `Mirar a ${c.star} entrenar`, consequences: { media: 1, moral: 2 } },
      { label: "Sentirte en peligro", subtitle: "Tu puesto se complica", consequences: { moral: -3, forma: 2 } },
    ],
  },
  {
    key: "boots",
    title: "Nuevo patrocinador de botas",
    desc: (c) => `Una marca de calzado se acerca a ti tras la buena pretemporada. ${c.agent} negocia: "Es poco, pero abre puertas".`,
    opts: () => [
      { label: "Firmar el contrato", subtitle: "Botas nuevas y un dinerillo", consequences: { patrimonio: 2500, fama: 2 } },
      { label: "Esperar una oferta mejor", subtitle: "No regalarte", consequences: { rel_representante: 2 } },
      { label: "Rechazar", subtitle: "Ahora mismo, no", consequences: { reputacion: 1 } },
    ],
  },
  {
    key: "cesion_rumor",
    title: "Se habla de cederte",
    desc: (c) => `Un periodista del entorno del ${c.club} asegura que te pueden ceder para "coger minutos". ${c.coach} lo ha oído y no se ha molestado en desmentirlo.`,
    opts: (c) => [
      { label: `Preguntar a ${c.coach}`, subtitle: "Mirarle a los ojos", consequences: { rel_entrenador: 1, moral: -1 } },
      { label: "Plantear salir con minutos", subtitle: "Te interesa jugar", consequences: { rel_representante: 2, moral: 1 } },
      { label: "Pelear tu sitio aquí", subtitle: "Aquí quieres estar", consequences: { forma: 2, moral: 2, rel_aficion: 1 } },
    ],
  },
  {
    key: "aficionado_rival",
    title: "Un mensaje de un hincha rival",
    desc: (c) => `Alguien te escribe desde el otro lado de la ciudad para decirte que el ${c.club} "no tiene nada que hacer" esta temporada. Se ha hecho viral.`,
    opts: () => [
      { label: "Responder con clase", subtitle: "Nos vemos en el campo", consequences: { fama: 2, reputacion: 2 } },
      { label: "Devolverla con ironía", subtitle: "Un titular más", consequences: { fama: 4, rel_aficion: 2, reputacion: -1 } },
      { label: "No responder", subtitle: "Ruido de fondo", consequences: { moral: 1 } },
    ],
  },
];

export function buildPreseasonLifeEvent(player: Player): GameEvent {
  const week = player.week;
  const season = Math.floor((week - 1) / 10);
  const recent = String(player.flags?.pre_recent ?? "").split(",").filter(Boolean);
  let pool = TEMPLATES.filter((t) => !recent.includes(t.key));
  if (pool.length === 0) pool = TEMPLATES;
  const tpl = pool[Math.floor(Math.random() * pool.length)];

  const salt = `pre-${week}-${tpl.key}`;
  const ctx: Ctx = {
    club: player.club,
    coach: getNpcName(player, "entrenador"),
    fisio: getNpcName(player, "fisio"),
    captain: getNpcName(player, "capitan"),
    director: getNpcName(player, "director_deportivo"),
    agent: player.agent_name ?? getNpcName(player, "agente"),
    mate: getTeammateName(player, `${salt}-a`),
    mate2: getTeammateName(player, `${salt}-b`),
    rival: getTeammateName(player, `${salt}-r`),
    star: getTeammateName(player, `${salt}-star`),
    kid: getPersonName(player, `${salt}-kid`, "m").split(" ")[0],
    fame: getCelebrityName(player, "influencer", salt, "m"),
    city: "",
  };

  const n = Number(player.flags?.[`pre_n_${season}`] ?? 0) + 1;
  const newRecent = [...recent, tpl.key].slice(-10).join(",");
  const flags: Consequences["flags"] = { [`pre_n_${season}`]: String(n), pre_recent: newRecent };
  const withFlags = (c: Consequences): Consequences => ({ ...c, flags: { ...(c.flags ?? {}), ...flags } });

  return {
    id: `preseason-ev-${tpl.key}-${week}`,
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
