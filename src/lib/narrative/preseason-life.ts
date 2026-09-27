import type { Consequences, EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getCelebrityName, getNpcName, getPersonName, getTeammateName } from "@/lib/narrative/npcs";

/**
 * Vida de pretemporada: en cada pretemporada (y, sobre todo, en la primera
 * de la carrera) pasan muchas cosas además de correr: giras, presentación
 * de la camiseta, fichajes que te amenazan el puesto, salidas de
 * compañeros, rumores de traspaso, renovaciones, dorsales, novatadas... y
 * también un puñado de situaciones de humor puro o directamente
 * disparatadas (la mascota escapada, la vidente de concentración, el
 * doble viral, la taquilla maldita) — 38 plantillas en total.
 *
 * Todo en código (cero llamadas a la IA). Ids "preseason-ev-*": el flujo de
 * carrera/actions.ts los trata como eventos que NO avanzan la semana, y el
 * tope por temporada (flag `pre_n_<temporada>`) evita que se encadenen sin
 * fin. Los últimos usados van en `pre_recent` para no repetirse.
 *
 * `tone` es solo una etiqueta interna (no se muestra en el juego) para
 * poder contar cuántos de estos eventos son de humor puro ("gracioso") o
 * directamente disparatados ("surrealista") sin tener que releer los 37
 * a ojo cada vez — pedido explícito: "cuántos eventos graciosos y cuántos
 * surrealistas hay".
 */

const MAX_PER_SEASON = 5;

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
  doppel: string;
  stranger: string;
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
    tone: ["gracioso"],
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
    tone: ["gracioso"],
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
    tone: ["gracioso"],
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
    tone: ["gracioso"],
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
    tone: ["gracioso"],
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
    tone: ["gracioso"],
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
    tone: ["gracioso"],
    desc: (c) => `Alguien te escribe desde el otro lado de la ciudad para decirte que el ${c.club} "no tiene nada que hacer" esta temporada. Se ha hecho viral.`,
    opts: () => [
      { label: "Responder con clase", subtitle: "Nos vemos en el campo", consequences: { fama: 2, reputacion: 2 } },
      { label: "Devolverla con ironía", subtitle: "Un titular más", consequences: { fama: 4, rel_aficion: 2, reputacion: -1 } },
      { label: "No responder", subtitle: "Ruido de fondo", consequences: { moral: 1 } },
    ],
  },
  {
    key: "mascota_fuga",
    title: "La mascota del club se escapa",
    tone: ["gracioso", "surrealista"],
    desc: (c) => `En plena sesión de fotos, la persona disfrazada de mascota del ${c.club} sale corriendo detrás de una paloma y se cuela en pleno pueblo, con el traje de águila puesto y todo el club detrás intentando explicarlo.`,
    opts: (c) => [
      { label: "Unirte a la caza", subtitle: `Con ${c.mate} a perseguirla`, consequences: { rel_vestuario: 4, moral: 3, forma: -1 } },
      { label: "Grabarlo todo", subtitle: "Contenido asegurado", consequences: { fama: 5, rel_vestuario: 1 } },
      { label: "Quedarte al margen", subtitle: "Que se ocupe el utillero", consequences: { moral: 1 } },
    ],
  },
  {
    key: "vidente",
    title: "La vidente de la concentración",
    tone: ["surrealista"],
    desc: (c) => `${c.captain} ha traído a una vidente al hotel de concentración "para que lea el aura del vestuario antes de la temporada". Te toca a ti sentarte primero frente a las cartas.`,
    opts: (c) => [
      { label: "Tomártelo en broma", subtitle: "Y seguirle el juego", consequences: { rel_vestuario: 3, moral: 2 } },
      {
        label: "Preguntarle en serio por la temporada",
        subtitle: "Por si acaso",
        consequences: { moral: 1 },
        resolve: {
          baseChance: 0.5,
          success: { text: `Te dice, muy seria, que "un número par te traerá gloria en primavera". Ni tú ni ${c.mate} volvéis a mirar igual vuestro dorsal.`, consequences: { moral: 4, fama: 1 } },
          fail: { text: "Te suelta una predicción tan siniestra sobre 'un rival de rojo' que no duermes en toda la concentración.", consequences: { moral: -3, forma: -1 } },
        },
      },
      { label: "Negarte a participar", subtitle: "Esto no es serio", consequences: { rel_vestuario: -2, reputacion: 1 } },
    ],
  },
  {
    key: "doble_viral",
    title: "Tu doble se ha hecho viral",
    tone: ["surrealista"],
    desc: (c) => `Un vídeo de ${c.doppel}, un tipo que es tu vivo retrato, haciendo el ridículo en un supermercado se ha vuelto viral con el titular "así es [tu nombre] fuera del campo". Media ciudad ya lo cree de verdad.`,
    opts: (c) => [
      { label: "Desmentirlo con humor", subtitle: "Un vídeo respuesta", consequences: { fama: 5, moral: 2 } },
      {
        label: `Buscar a ${c.doppel} y grabar algo juntos`,
        subtitle: "Sacarle partido a la confusión",
        consequences: { fama: 2 },
        resolve: {
          baseChance: 0.6,
          success: { text: "Grabáis un vídeo de los dos juntos que arrasa: la gente no sabe distinguiros y el club lo comparte encantado.", consequences: { fama: 7, rel_aficion: 3, moral: 3 } },
          fail: { text: `${c.doppel} resulta ser mucho más simpático en redes que tú y te acaba robando parte del cariño de la afición durante semanas.`, consequences: { fama: 1, moral: -2, rel_aficion: -2 } },
        },
      },
      { label: "Ignorarlo", subtitle: "No darle más vueltas", consequences: { moral: 1 } },
    ],
  },
  {
    key: "picor_pica_pica",
    title: "Pica-pica en las botas",
    tone: ["gracioso"],
    desc: (c) => `${c.mate} ha metido pica-pica dentro de tus botas de entrenamiento como venganza por una broma que ni recordabas. Todo el vestuario espera, en silencio, a que te las pongas.`,
    opts: (c) => [
      {
        label: "Ponerte las botas igualmente",
        subtitle: "Aguantar el tirón",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          success: { text: "Aguantas impasible los primeros minutos y el farol te sale gratis: el vestuario aplaude tu sangre fría.", consequences: { rel_vestuario: 5, moral: 3 } },
          fail: { text: "Duras cinco segundos antes de salir dando saltos por el vestuario entero. Vídeo garantizado para el resto de la temporada.", consequences: { rel_vestuario: 2, moral: -1, fama: 2 } },
        },
      },
      { label: "Revisarlas antes", subtitle: "No fías de nadie", consequences: { rel_vestuario: -1, reputacion: 1 } },
      { label: `Devolverle la broma a ${c.mate}`, subtitle: "Ojo por ojo", consequences: { rel_vestuario: 2, moral: 2 } },
    ],
  },
  {
    key: "autobus_averiado",
    title: "El autobús se avería en mitad de la nada",
    tone: ["gracioso", "surrealista"],
    desc: (c) => `Volviendo de un amistoso, el autobús del ${c.club} se avería en un pueblo de trescientos habitantes. Los vecinos, que no tienen ni idea de fútbol, os confunden con los invitados de una boda que se celebra esa misma tarde.`,
    opts: (c) => [
      { label: "Seguirles la corriente", subtitle: "Colarse en la boda", consequences: { rel_vestuario: 5, moral: 4, fama: 2 } },
      { label: "Aclarar el malentendido", subtitle: "Explicar quiénes sois", consequences: { reputacion: 2, rel_aficion: 2 } },
      { label: "Aprovechar para entrenar en la plaza", subtitle: `Con ${c.mate} de balón`, consequences: { forma: 2, rel_aficion: 3, fama: 3 } },
    ],
  },
  {
    key: "maldicion_vestuario",
    title: "La taquilla maldita",
    tone: ["surrealista"],
    desc: (c) => `Un veterano jura que la taquilla del fondo del vestuario "trae mala suerte": el año pasado, todo el que la usó se lesionó. Es la única que queda libre y te toca a ti.`,
    opts: (c) => [
      { label: "Usarla sin darle importancia", subtitle: "Supersticiones aparte", consequences: { rel_entrenador: 1 }, resolve: { baseChance: 0.6, success: { text: "No pasa absolutamente nada, claro. La superstición se apaga sola en un par de semanas.", consequences: { moral: 2, rel_vestuario: 2 } }, fail: { text: "Te tuerces un tobillo la primera semana de nada. El vestuario entero jura que 'ya lo sabía'.", consequences: { forma: -4, moral: -2, rel_vestuario: 1 } } } },
      { label: "Pedir un cambio de taquilla", subtitle: "Mejor no arriesgar", consequences: { rel_vestuario: -1, moral: 1 } },
      { label: "Organizar un ritual con el equipo", subtitle: "Purificarla entre todos", consequences: { rel_vestuario: 4, moral: 3 } },
    ],
  },
  {
    key: "reto_viral_ridiculo",
    title: "El reto de moda te alcanza",
    tone: ["gracioso"],
    desc: (c) => `Todo el vestuario está enganchado a un reto viral absurdo — bailar en equilibrio sobre un balón medicinal mientras cantas el himno. ${c.mate2} ya lo intentó y acabó en el suelo.`,
    opts: (c) => [
      {
        label: "Intentarlo delante de todos",
        subtitle: "Sin red",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          success: { text: "Bordas el equilibrio entre aplausos y móviles grabando. El vídeo se cuelga esa misma noche.", consequences: { fama: 5, rel_vestuario: 4, moral: 3 } },
          fail: { text: "Acabas en el suelo entre risas del vestuario entero, con el himno a medio cantar.", consequences: { rel_vestuario: 3, moral: -1, fama: 1 } },
        },
      },
      { label: "Grabar a los demás en vez de participar", subtitle: "Director de cine por un día", consequences: { rel_vestuario: 2, fama: 1 } },
      { label: "Negarte", subtitle: "Esto es fútbol, no un circo", consequences: { reputacion: 2, rel_vestuario: -2 } },
    ],
  },
  {
    key: "sueno_raro",
    title: "El sueño que no te quitas de la cabeza",
    tone: ["surrealista"],
    desc: (c) => `Llevas tres noches soñando lo mismo: marcas un gol imposible con una bota que no es tuya, en un campo que no reconoces, y al despertar te sabes de memoria la cara de un rival que nunca has visto. Se lo cuentas a ${c.mate} en el desayuno.`,
    opts: (c) => [
      { label: "Reírte y olvidarlo", subtitle: "Solo es un sueño", consequences: { moral: 1 } },
      { label: `Contárselo al fisio ${c.fisio}`, subtitle: "Que te ayude a dormir mejor", consequences: { moral: 2, rel_vestuario: 1 } },
      {
        label: "Tomártelo como una señal",
        subtitle: "Y jugar con esa bota imaginaria en la cabeza",
        consequences: { moral: 2 },
        resolve: {
          baseChance: 0.5,
          success: { text: "Rindes mejor de lo normal toda la semana, como si de verdad llevaras algo especial en la cabeza.", consequences: { forma: 3, moral: 3 } },
          fail: { text: "Te pasas la semana distraído pensando en el sueño y el míster te llama la atención por estar en la luna.", consequences: { rel_entrenador: -2, moral: -1 } },
        },
      },
    ],
  },
  {
    key: "gemelo_perdido",
    title: "El fan que jura ser tu primo perdido",
    tone: ["gracioso", "surrealista"],
    desc: (c) => `${c.stranger} se presenta en la puerta de entrenamientos con un árbol genealógico dibujado a mano y fotos borrosas de una boda de los años 90, convencido de que sois primos separados al nacer.`,
    opts: (c) => [
      { label: "Escucharle la historia entera", subtitle: "Por curiosidad", consequences: { moral: 2, rel_aficion: 2 } },
      { label: "Hacerte una foto con él y seguirle la broma", subtitle: `"Primo, cuánto tiempo"`, consequences: { fama: 3, moral: 2 } },
      { label: "Pedirle amablemente que se vaya", subtitle: "Esto empieza a dar miedo", consequences: { reputacion: 1, moral: -1 } },
    ],
  },
  {
    key: "comida_rara",
    title: "El chef se pone experimental",
    tone: ["gracioso"],
    desc: (c) => `El nuevo chef de concentración presenta el menú de la semana: "algas fermentadas con proteína de grillo, receta del futuro". ${c.mate} ya ha puesto cara de circunstancias.`,
    opts: (c) => [
      {
        label: "Probarlo sin rechistar",
        subtitle: "Confiar en la ciencia",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          success: { text: "Sorprendentemente, no está nada mal. Te conviertes en el defensor oficial del menú del futuro.", consequences: { forma: 2, rel_vestuario: 2, moral: 2 } },
          fail: { text: "Pasas la noche entera sin poder dormir por el estómago. El chef promete 'ajustar la receta'.", consequences: { forma: -3, moral: -2 } },
        },
      },
      { label: "Pedir el menú de siempre", subtitle: "Sin experimentos", consequences: { rel_vestuario: 1 } },
      { label: "Convencer al vestuario de amotinarse", subtitle: "Huelga de tenedores", consequences: { rel_vestuario: 4, rel_entrenador: -2, moral: 2 } },
    ],
  },
  {
    key: "objeto_perdido",
    title: "La maleta perdida en el aeropuerto",
    tone: ["gracioso"],
    desc: (c) => `Vuelves de la gira y tu maleta se ha perdido en el aeropuerto: botas, ropa y hasta tu amuleto de la suerte, desaparecidos. Tienes que entrenar con lo que te presta ${c.mate}, tres tallas más grande.`,
    opts: (c) => [
      { label: "Reírte de la pinta que llevas", subtitle: "Da igual la talla", consequences: { rel_vestuario: 4, moral: 3 } },
      { label: "Ir a comprar equipo nuevo", subtitle: "Solución rápida", consequences: { patrimonio: -600, moral: 1 } },
      { label: "Culpar a la aerolínea en redes", subtitle: "Que se enteren todos", consequences: { fama: 2, reputacion: -1 } },
    ],
  },
  {
    key: "fan_disfrazado",
    title: "El hincha que se viste exactamente igual que tú",
    tone: ["surrealista"],
    desc: (c) => `Llevas semanas viendo, siempre en la misma esquina fuera del campo de entrenamiento, a ${c.stranger}: mismo corte de pelo, mismas botas, hasta el mismo gesto al calentar. Empieza a resultar un poco inquietante.`,
    opts: (c) => [
      { label: "Acercarte a hablar con él", subtitle: "Salir de dudas", consequences: { moral: 2, rel_aficion: 2 } },
      { label: "Hacerte una foto juntos", subtitle: "Convertirlo en broma", consequences: { fama: 3, moral: 1 } },
      { label: "Avisar a seguridad del club", subtitle: "Por si acaso", consequences: { reputacion: 1, moral: -1 } },
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
    doppel: getPersonName(player, `${salt}-doppel`, "any"),
    stranger: getPersonName(player, `${salt}-stranger`, "any"),
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
