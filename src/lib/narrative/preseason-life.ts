import type { Consequences, EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getCelebrityName, getNpcName, getPersonName, getTeammateName } from "@/lib/narrative/npcs";

/**
 * Vida de pretemporada: en cada pretemporada (y, sobre todo, en la primera
 * de la carrera) pasan muchas cosas además de correr: giras, presentación
 * de la camiseta, fichajes que te amenazan el puesto, salidas de
 * compañeros, rumores de traspaso, renovaciones, dorsales, novatadas... y
 * también un puñado de situaciones de humor puro o directamente
 * disparatadas (la mascota escapada, la vidente de concentración, el
 * doble viral, la taquilla maldita, el gurú del arroz) — más de 70
 * plantillas en total.
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

const MAX_PER_SEASON = 7;

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
  name: string;
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
  veteran: string;
  legend: string;
  psych: string;
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

const TOURS = ["Estados Unidos", "Japón", "Emiratos Árabes", "China", "Australia", "México"];
const BIG_CLUBS = ["Real Madrid", "FC Barcelona", "Manchester City", "Bayern de Múnich", "Liverpool FC", "Juventus", "Paris Saint-Germain"];

const TEMPLATES: Tpl[] = [
  {
    key: "gira",
    title: "Gira de pretemporada",
    desc: (c) => `El ${c.club} viaja de gira a ${TOURS[c.club.length % TOURS.length]}: vuelos largos, estadios enormes y mucho calor. ${c.coach} avisa de que allí también se gana el puesto.`,
    opts: (c) => [
      { label: "Centrarte en cada entreno", subtitle: "Que el míster te vea", consequences: { rel_entrenador: 3, forma: 2 }, outcomeText: "En el tercer día de gira, el míster te hace una seña desde la banda y apunta tu nombre en su libreta. Nadie más lo ha visto." },
      { label: "Aprovechar para dejarte ver", subtitle: "Fotos, fans y camisetas", consequences: { fama: 4, forma: -2 }, outcomeText: "Posas con aficionados, firmas camisetas y sonríes a todas las cámaras. Al volver al hotel, tienes más seguidores... y las piernas más cansadas." },
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
      { label: "Posar con orgullo", subtitle: "Una foto que se hace viral", consequences: { fama: 4, moral: 2 }, outcomeText: "El fotógrafo grita '¡Eso es!' y dispara sin parar. La foto, con tu mirada decidida, aparece en la web del club antes de comer." },
      { label: "Hacer el tonto delante de la cámara", subtitle: "Un vídeo divertido para las redes", consequences: { fama: 3, rel_vestuario: 2, rel_aficion: 2 }, outcomeText: "Pones cara de dibujo animado justo cuando se enciende el flash. El vídeo se hace viral y hasta el presidente se ríe." },
      { label: "Quedarte al fondo", subtitle: "Que brillen los demás", consequences: { rel_vestuario: 2, reputacion: 1 }, outcomeText: "Te colocas detrás y dejas que brillen los demás. El fotógrafo te hace un hueco al final de la foto con un guiño: 'Tú también sales'." },
    ],
  },
  {
    key: "rival_puesto",
    title: "Han fichado a alguien en tu puesto",
    desc: (c) => `${c.director} presenta un fichaje en tu demarcación: ${c.rival}, con currículo y hambre. Los periodistas ya preguntan si peligra tu sitio.`,
    opts: (c) => [
      { label: "Ponerte a trabajar el doble", subtitle: "Ganarle el puesto en los entrenos", consequences: { forma: 3, rel_entrenador: 2, moral: -1 }, outcomeText: "Esa tarde te quedas hasta que el campo se vacía. El míster te ve desde la ventana y anota algo en su libreta." },
      { label: `Hablar con ${c.coach}`, subtitle: "Aclarar cuál es tu papel", consequences: { rel_entrenador: 1 }, resolve: { baseChance: 0.55, success: { text: "El míster te da confianza: seguirás contando y te lo dice a la cara.", consequences: { moral: 4, rel_entrenador: 3 } }, fail: { text: "El míster responde con evasivas: 'aquí se gana todo en el campo'. Te vas con más dudas.", consequences: { moral: -3 } } } },
      { label: `Pedirle a ${c.agent} que mire opciones`, subtitle: "Por si acaso", consequences: { rel_representante: 2, moral: -1 }, outcomeText: `${c.agent} toma nota sin preguntar nada: "Tranquilo, solo para tener alternativas". Aun así, esa noche duermes con una duda más en la cabeza.` },
    ],
  },
  {
    key: "salida_compi",
    title: "Se va un compañero del vestuario",
    desc: (c) => `${c.mate} se despide: el club lo traspasa y el vestuario lo nota. Últimas risas en el rondo y un abrazo largo en la puerta del vestuario.`,
    opts: (c) => [
      { label: "Despedirlo con una cena", subtitle: "Todo el equipo, como se merece", consequences: { rel_vestuario: 5, moral: 2, patrimonio: -400 }, outcomeText: "Reservas una mesa larga y el vestuario entero se sienta. Entre brindis y anécdotas, alguien llora de risa y alguien de nostalgia." },
      { label: "Un abrazo y un mensaje", subtitle: "Sin dramatismos", consequences: { moral: 1, rel_vestuario: 1 }, outcomeText: "Un abrazo largo en la puerta y un mensaje corto esa noche. No hace falta más: los dos sabéis lo que habéis compartido." },
      { label: `Pedirle su dorsal a ${c.director}`, subtitle: "Un número vacante", consequences: { fama: 1, rel_vestuario: -1 }, outcomeText: `${c.director} sonríe sorprendido: "No pierdes el tiempo, ¿eh?". En el vestuario, alguien murmura que has sido muy rápido.` },
    ],
  },
  {
    key: "sistema",
    title: "El míster cambia el sistema",
    desc: (c) => `${c.coach} reúne al grupo con una pizarra llena de flechas: nuevo dibujo, nuevos roles y mucha presión alta. No todos entienden el plan.`,
    opts: () => [
      { label: "Estudiar el plan por tu cuenta", subtitle: "Vídeo, apuntes y preguntas", consequences: { media: 1, rel_entrenador: 2 }, outcomeText: "Pasas la noche con la tablet, rebobinando movimientos de la pizarra. Al día siguiente, el míster te pide que se lo expliques a otro compañero." },
      { label: "Discutirlo con el capitán", subtitle: "Buscar tu hueco", consequences: { rel_vestuario: 2 }, outcomeText: "El capitán te escucha con paciencia y te dibuja tu sitio en una servilleta. Es más claro que cualquier pizarra." },
      { label: "Poner mala cara", subtitle: "No lo ves claro", consequences: { rel_entrenador: -3, moral: -1 }, outcomeText: "El gesto no pasa desapercibido. El míster te mira un segundo de más y seguirá recordándolo en la próxima convocatoria." },
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
      { label: "Gestionar el esfuerzo", subtitle: "Llegar entero a agosto", consequences: { forma: 2 }, outcomeText: "Reservas fuerzas y cruzas la línea entero. El preparador asiente: no es la mejor marca, pero sí la más inteligente." },
    ],
  },
  {
    key: "altura",
    title: "Concentración en altura",
    tone: ["gracioso"],
    desc: (c) => `El ${c.club} se concentra diez días en la montaña. Aire limpio, móviles sin cobertura y noches de cartas y bromas en la habitación.`,
    opts: (c) => [
      { label: "Ser el alma de las cartas", subtitle: `Con ${c.mate} y ${c.mate2}`, consequences: { rel_vestuario: 4, moral: 2 }, outcomeText: "Montas un torneo con premios absurdos y reglas inventadas. A la tercera noche, hasta el míster se sienta a perder dinero contigo." },
      { label: "Dormir y recuperar", subtitle: "El cuerpo lo agradece", consequences: { forma: 4 }, outcomeText: "Mientras los demás juegan a las cartas, tú duermes diez horas seguidas. Al despertar, el cuerpo te responde como en tus mejores semanas." },
      { label: "Grabar la concentración para tus redes", subtitle: "Contenido diferente", consequences: { fama: 3, rel_entrenador: -1 }, outcomeText: "Subes un vídeo de la montaña y las partidas de cartas. Gusta tanto que el club te pide que lo repitas, y el míster te ve con el móvil más de lo que le agrada." },
    ],
  },
  {
    key: "puertas_abiertas",
    title: "Jornada de puertas abiertas",
    desc: (c) => `Miles de aficionados llenan el campo de entrenamiento del ${c.club}. Un niño, ${c.kid}, lleva tu nombre pintado a mano en la camiseta.`,
    opts: () => [
      { label: "Firmarle la camiseta y hacerte una foto", subtitle: "El niño no lo va a olvidar", consequences: { rel_aficion: 5, fama: 2, moral: 3 }, outcomeText: "El niño se queda mudo mientras firmas, y luego rompe a llorar de la emoción. Su madre te da las gracias con la voz entrecortada." },
      { label: "Regalarle tus botas", subtitle: "Un detalle que se recuerda", consequences: { rel_aficion: 6, moral: 4, patrimonio: -200 }, outcomeText: "El niño abraza las botas como si fuera un trofeo. Su padre te hace un gesto con la mano en el pecho: no hacen falta palabras." },
      { label: "Saludar desde lejos", subtitle: "Estás concentrado", consequences: { rel_aficion: -1 }, outcomeText: "Levantas la mano y sigues con tu sesión. El niño te sigue con la mirada hasta que desapareces tras la valla." },
    ],
  },
  {
    key: "renovacion",
    title: "Te hablan de renovar",
    desc: (c) => `${c.director} te cita en su despacho: el club quiere mejorarte el contrato. ${c.agent} llama justo después de colgar: "No firmes nada sin hablar conmigo".`,
    opts: (c) => [
      { label: "Firmar la mejora", subtitle: "Seguridad y más sueldo", consequences: { patrimonio: 3000, moral: 3, rel_representante: -1 }, outcomeText: "Firmas con una sonrisa en el despacho del director. El agente, al saberlo, se limita a decir: 'Podríamos haber apretado más'." },
      { label: `Dejar que ${c.agent} negocie`, subtitle: "Más tiempo, más cifra", consequences: { rel_representante: 3 }, resolve: { baseChance: 0.55, success: { text: "Sale una mejora mucho mejor de lo previsto y una cláusula que te da poder.", consequences: { patrimonio: 6000, moral: 4, rel_representante: 2 } }, fail: { text: "El club se enfría con la espera y la oferta se queda en menos de lo que te ofrecían.", consequences: { patrimonio: 1000, moral: -2 } } } },
      { label: "Esperar a ver el mercado", subtitle: "No cerrar puertas", consequences: { moral: -1, rel_representante: 1 }, outcomeText: "Dices que necesitas pensarlo. El club asiente con frialdad educada y el director, al despedirte, deja caer: 'Las ofertas no duran siempre'." },
    ],
  },
  {
    key: "clausula",
    title: "Suenan por tu cláusula",
    desc: (c) => `${c.agent} te lo suelta por teléfono: hay un club grande que ha preguntado por tu cláusula. "No es nada, pero conviene que lo sepas".`,
    opts: () => [
      { label: "Pedirle detalles", subtitle: "Saber cuánto hay de verdad", consequences: { rel_representante: 2, fama: 1 }, outcomeText: "Tu agente te cuenta todo lo que sabe: nombre, cifra y quién lo filtró. Cuando cuelgas, tienes la sensación de haber tocado algo grande." },
      { label: "Decirle que ni lo mire", subtitle: "Aquí estás bien", consequences: { rel_aficion: 3, moral: 2 }, outcomeText: "'Aquí estoy bien', dices. Tu agente suspira, pero lo respeta. Esa tarde, un directivo del club te saluda con una sonrisa distinta." },
      { label: "Filtrarlo sin querer", subtitle: "Que el club se entere", consequences: { fama: 4, rel_aficion: -3, rel_entrenador: -1 }, outcomeText: "El comentario 'se te escapa' en una conversación con un periodista. En una hora, está en todas las webs y el club te mira de reojo." },
    ],
  },
  {
    key: "novato",
    title: "El canterano que te pide consejo",
    desc: (c) => `${c.kid}, un chaval del juvenil que ha subido a entrenar con el primer equipo, se te acerca en el vestuario: "¿Puedo preguntarte una cosa?".`,
    opts: () => [
      { label: "Hacerle de hermano mayor", subtitle: "Como te ayudaron a ti", consequences: { rel_vestuario: 3, moral: 3, reputacion: 2 }, outcomeText: "Pasas la tarde enseñándole dónde dejar las botas, a quién saludar y cómo pedir el balón. Al despedirse, el chaval te mira como a un héroe." },
      { label: "Darle un consejo rápido", subtitle: "Y a lo tuyo", consequences: { rel_vestuario: 1 }, outcomeText: "Le dices tres frases rápidas antes del entrenamiento. Él las apunta en el móvil y tú te vas con una sonrisa a medias." },
      { label: "Ponerle a prueba", subtitle: "Que aprenda sufriendo", consequences: { rel_vestuario: -1, moral: 1 }, outcomeText: "Le dejas un buen rato sin ayuda. El chaval aprende rápido, pero la próxima vez que te ve, ya no sonríe tanto." },
    ],
  },
  {
    key: "entrevista",
    title: "Entrevista de pretemporada",
    desc: (c) => `Un periodista de ${c.club} te pregunta: "¿Qué objetivo os ponéis esta temporada?". La grabadora ya está encendida.`,
    opts: () => [
      { label: "Ir a por todo", subtitle: "Ambición, sin miedo", consequences: { fama: 3, rel_aficion: 3, rel_entrenador: -1 }, outcomeText: "Lo sueltas sin pestañear, con la grabadora encendida. El titular del día siguiente: 'Vamos a por todo'. El míster lo lee con una ceja arqueada." },
      { label: "Ir partido a partido", subtitle: "Prudencia futbolera", consequences: { rel_entrenador: 2, reputacion: 1 }, outcomeText: "Respondes con la frase de siempre. El periodista sonríe: es la respuesta que esperaba. El míster, desde el fondo, asiente." },
      { label: "Bromear con la respuesta", subtitle: "Titular garantizado", consequences: { fama: 4, moral: 1, rel_entrenador: -1 }, outcomeText: "Contestas con un chiste y la sala se ríe. En el titular sale tu broma, no el objetivo. Y al míster no le hace ninguna gracia." },
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
      { label: "Negociar: pagar la ronda", subtitle: "La salida comprada", consequences: { patrimonio: -300, rel_vestuario: 3 }, outcomeText: "Dices que invitas a la ronda y el vestuario aplaude. El capitán sonríe: 'El nuevo ya sabe cómo van las cosas'." },
      { label: "Escaquearte al baño", subtitle: "Arriesgado", consequences: { rel_vestuario: -3 }, outcomeText: "Te escabulles justo cuando señalan tu nombre. Cuando vuelves, te están esperando con el micrófono en alto y una sonrisa que no augura nada bueno." },
    ],
  },
  {
    key: "lesion_leve",
    title: "Un pinchazo en el entreno",
    desc: (c) => `Sientes un tirón en el muslo durante el rondo. El fisio ${c.fisio} te mira: "Para si quieres llegar sano al domingo".`,
    opts: () => [
      { label: "Parar y hacer caso", subtitle: "Un par de días en el gimnasio", consequences: { forma: 1, moral: -1 }, outcomeText: "Te vas al gimnasio con el fisio. Tras dos días de hielo y ejercicios suaves, el músculo vuelve a responder." },
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
      { label: "Parar a firmar", subtitle: "Diez minutos que valen oro", consequences: { rel_aficion: 4, fama: 2 }, outcomeText: "Bajas del autobús y firmas hasta que el entrenador te llama desde la puerta. Algún hincha te lleva en volandas unos metros." },
      { label: "Saludar desde la ventanilla", subtitle: "Sin retrasar al equipo", consequences: { rel_aficion: 2 }, outcomeText: "Levantas la mano desde la ventanilla y la multitud responde con un rugido. No hace falta más." },
      { label: "Pasar de largo", subtitle: "Hoy no es el día", consequences: { rel_aficion: -3 }, outcomeText: "Cruzas el pasillo sin mirar. Una niña te llama por tu nombre y tú no te das la vuelta. Esa noche, en redes, alguien lo comenta." },
    ],
  },
  {
    key: "famoso",
    title: "Un famoso en el entrenamiento",
    tone: ["gracioso"],
    desc: (c) => `El club invita a ${c.fame}, muy conocido por sus redes, a ver el entrenamiento. Al terminar, pide una foto contigo delante de todo el mundo.`,
    opts: (c) => [
      { label: "Hacerte la foto", subtitle: "Una buena publicidad", consequences: { fama: 4, rel_vestuario: -1 }, outcomeText: "Posas con una sonrisa que no ensayas. En redes, el famoso lo comparte con un 'qué crack'. Por un día, tu nombre suena a otro nivel." },
      { label: `Presentárselo a ${c.mate}`, subtitle: "Que también salga", consequences: { fama: 2, rel_vestuario: 2 }, outcomeText: `Llevas al famoso hasta ${c.mate}, que se queda mudo antes de arrancarse a hacerse selfies. A partir de ese día, ${c.mate} te debe un favor.` },
      { label: "Pasar de la foto", subtitle: "Trabajar", consequences: { reputacion: 2, fama: -1 }, outcomeText: "Dices que tienes que entrenar. El famoso asiente, algo confuso. En el vestuario, alguien murmura: 'Qué serio es este'." },
    ],
  },
  {
    key: "dorsal",
    title: "Pelea por el dorsal",
    tone: ["gracioso"],
    desc: (c) => `Queda libre un dorsal que a ti te gusta. ${c.mate} también lo quiere y ha ido ya a hablar con el utillero. Quedan dos días para inscribir.`,
    opts: (c) => [
      { label: "Ofrecerle un trato", subtitle: "Cena por dorsal", consequences: { patrimonio: -250, rel_vestuario: 2, fama: 1 }, outcomeText: "La cena queda pactada y el dorsal, tuyo. Lo celebráis en una pizzería, y ni siquiera se acuerda de por qué discutíais." },
      { label: "Ganártelo en un reto", subtitle: "Un penalti, cara o cruz", consequences: {}, resolve: { baseChance: 0.5, success: { text: `Ganas el reto a ${c.mate} y luces tu dorsal con orgullo.`, consequences: { moral: 4, rel_vestuario: 2 } }, fail: { text: `${c.mate} gana y se queda el dorsal. Tú te ríes por fuera.`, consequences: { moral: -1, rel_vestuario: 1 } } } },
      { label: "Dejárselo", subtitle: "No merece la pena", consequences: { rel_vestuario: 3, moral: -1 }, outcomeText: "Lo dejas ir con una sonrisa. Tu compañero te lo agradece con un abrazo y el vestuario toma nota de tu generosidad." },
    ],
  },
  {
    key: "golazo_viral",
    title: "Tu golazo en el amistoso se hace viral",
    desc: (c) => `Un gol de otro planeta en un amistoso del ${c.club} da la vuelta a las redes. Las cuentas de fútbol lo suben con un "¿Quién es este?".`,
    opts: () => [
      { label: "Compartirlo con humildad", subtitle: "Gracias al equipo", consequences: { fama: 4, reputacion: 2, rel_vestuario: 2 }, outcomeText: "Subes el gol con un 'gracias al equipo'. Los compañeros comentan el vídeo con emojis y cinco aficionados lo comparten con tu nombre." },
      { label: "Subirte al carro", subtitle: "Mensaje a los rivales", consequences: { fama: 5, rel_vestuario: -1 }, outcomeText: "Lo compartes con un mensaje desafiante a los rivales. Los comentarios arden: unos te aplauden y otros te piden que te calles." },
      { label: "No decir nada", subtitle: "Solo fútbol", consequences: { fama: 2, moral: 1 }, outcomeText: "No publicas nada. El vídeo sigue circulando solo, y tú te limitas a sonreír en el entrenamiento cuando alguien lo menciona." },
    ],
  },
  {
    key: "abonados",
    title: "Campaña de abonados",
    desc: (c) => `El ${c.club} lanza la campaña de abonos y te pide que salgas en el vídeo con el lema de la temporada. Solo pide una tarde de tu tiempo.`,
    opts: () => [
      { label: "Grabar con ganas", subtitle: "Que la afición se ilusione", consequences: { rel_aficion: 5, fama: 2 }, outcomeText: "Repites la toma cuatro veces hasta que sale con fuerza. Al estrenarse el vídeo, la cola de abonados da la vuelta a la manzana." },
      { label: "Grabar rápido", subtitle: "Toma única", consequences: { rel_aficion: 2 }, outcomeText: "Haces una toma única, sin florituras. El resultado es correcto, sin más, y el equipo de marketing no se queja." },
      { label: "Pedir algo a cambio", subtitle: "Una prima por imagen", consequences: { patrimonio: 1500, rel_aficion: -2, reputacion: -1 }, outcomeText: "Pides una prima y el club te la da con una sonrisa tensa. En la grada, algún aficionado dice que 'se han subido los humos'." },
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
      { label: "Ir despacio y ponerte a punto", subtitle: "Con calma", consequences: { forma: 2 }, outcomeText: "Sin prisas, vas recuperando el ritmo día a día. El preparador te mira con aprobación: nadie ha perdido una temporada por ir despacio en julio." },
    ],
  },
  {
    key: "despacho",
    title: "El presidente te llama al despacho",
    desc: (c) => `${c.director} te pide que pases por el palco antes del entrenamiento: el presidente quiere enseñarte el proyecto del ${c.club} para los próximos años.`,
    opts: () => [
      { label: "Escuchar con atención", subtitle: "Y decir sí a todo", consequences: { moral: 3, rel_aficion: 1 }, outcomeText: "El presidente despliega un plano del nuevo estadio y tú asientes a cada frase. Al salir, tienes la sensación de formar parte de algo grande." },
      { label: "Preguntar por los fichajes", subtitle: "Sin miedo", consequences: { reputacion: 2, moral: 1 }, outcomeText: "El presidente sonríe: 'Quien pregunta así quiere ganar'. Te adelanta un par de nombres y te hace jurar discreción." },
      { label: "Preguntar por tu futuro", subtitle: "Y el sueldo", consequences: { rel_representante: 1, patrimonio: 800 }, outcomeText: "El presidente carraspea, mira al director y responde con una cifra y una sonrisa. No es un sí, pero tampoco un no." },
    ],
  },
  {
    key: "rumor_te_ofrecen",
    title: "Tu nombre en la lista de transferibles",
    desc: (c) => `Un medio publica que el ${c.club} "escucharía ofertas" por ti. ${c.agent} llama sobresaltado: "No sé de dónde ha salido, pero hay que aclararlo".`,
    opts: (c) => [
      { label: `Ir a hablar con ${c.director}`, subtitle: "Que te lo diga a la cara", consequences: { rel_entrenador: 1 }, resolve: { baseChance: 0.6, success: { text: "Era una filtración interesada de otro club. El director te asegura que cuentan contigo.", consequences: { moral: 4, rel_aficion: 2 } }, fail: { text: "No lo niega del todo: 'si llega una gran oferta, lo hablamos'. Te quedas pensando.", consequences: { moral: -3, rel_representante: 1 } } } },
      { label: "Pedirle a tu agente que lo desmienta", subtitle: "Ruido fuera", consequences: { rel_representante: 2, fama: 1 }, outcomeText: "Tu agente lo desmiente en dos llamadas. La noticia desaparece de las webs en una tarde, aunque el murmullo tarda un poco más." },
      { label: "Ignorarlo", subtitle: "El campo hablará", consequences: { moral: -1, reputacion: 1 }, outcomeText: "Decides no darle importancia. En el entrenamiento, el rumor se cuela en alguna broma de vestuario y tú sigues a lo tuyo." },
    ],
  },
  {
    key: "estrella",
    title: "Llega una estrella",
    desc: (c) => `El ${c.club} presenta a ${c.star}, un fichaje bomba para la temporada. Estadio lleno, camisetas por todos lados y el vestuario en modo expectación.`,
    opts: (c) => [
      { label: "Ir a saludarle el primero", subtitle: "Buen rollo y cercanía", consequences: { rel_vestuario: 3, fama: 2 }, outcomeText: "Te adelantas entre el tumulto y le tiendes la mano. Él sonríe: 'Gracias, me hacía falta una cara amable'." },
      { label: "Aprender todo lo que puedas", subtitle: `Mirar a ${c.star} entrenar`, consequences: { media: 1, moral: 2 }, outcomeText: "Te pasas la sesión mirándole: cómo pide el balón, cómo se coloca, cómo respira. Tomas notas mentales para el resto de tu carrera." },
      { label: "Sentirte en peligro", subtitle: "Tu puesto se complica", consequences: { moral: -3, forma: 2 }, outcomeText: "Se te encoge el estómago en cada pase suyo. Esa noche entrenas con rabia, aunque notas que también eso es energía." },
    ],
  },
  {
    key: "boots",
    title: "Nuevo patrocinador de botas",
    desc: (c) => `Una marca de calzado se acerca a ti tras la buena pretemporada. ${c.agent} negocia: "Es poco, pero abre puertas".`,
    opts: () => [
      { label: "Firmar el contrato", subtitle: "Botas nuevas y un dinerillo", consequences: { patrimonio: 2500, fama: 2 }, outcomeText: "Firmas, y la semana siguiente llega una caja con botas hechas a tu medida. Te las pruebas delante del espejo del vestuario, orgulloso." },
      { label: "Esperar una oferta mejor", subtitle: "No regalarte", consequences: { rel_representante: 2 }, outcomeText: "Dices que no tienes prisa. La marca asiente con educación y tu agente te lanza una mirada que mezcla orgullo y nervios." },
      { label: "Rechazar", subtitle: "Ahora mismo, no", consequences: { reputacion: 1 }, outcomeText: "Rechazas con educación. La marca se despide cordial, y tu agente anota que 'esa puerta queda entreabierta'." },
    ],
  },
  {
    key: "cesion_rumor",
    title: "Se habla de cederte",
    desc: (c) => `Un periodista del entorno del ${c.club} asegura que te pueden ceder para "coger minutos". ${c.coach} lo ha oído y no se ha molestado en desmentirlo.`,
    opts: (c) => [
      { label: `Preguntar a ${c.coach}`, subtitle: "Mirarle a los ojos", consequences: { rel_entrenador: 1, moral: -1 } },
      { label: "Plantear salir con minutos", subtitle: "Te interesa jugar", consequences: { rel_representante: 2, moral: 1 }, outcomeText: "Se lo dices a tu agente y él, sin dramatizar, toma nota. 'Veremos qué se mueve', responde con una media sonrisa." },
      { label: "Pelear tu sitio aquí", subtitle: "Aquí quieres estar", consequences: { forma: 2, moral: 2, rel_aficion: 1 }, outcomeText: "Declaras que aquí quieres estar. El míster lo oye de otra boca y, en el siguiente entrenamiento, te coloca en el primer equipo." },
    ],
  },
  {
    key: "aficionado_rival",
    title: "Un mensaje de un hincha rival",
    tone: ["gracioso"],
    desc: (c) => `Alguien te escribe desde el otro lado de la ciudad para decirte que el ${c.club} "no tiene nada que hacer" esta temporada. Se ha hecho viral.`,
    opts: () => [
      { label: "Responder con clase", subtitle: "Nos vemos en el campo", consequences: { fama: 2, reputacion: 2 }, outcomeText: "Contestas con una frase educada y firme. El mensaje se hace viral por lo contrario: porque no hay ninguna provocación." },
      { label: "Devolverla con ironía", subtitle: "Un titular más", consequences: { fama: 4, rel_aficion: 2, reputacion: -1 }, outcomeText: "Respondes con una ironía que arrasa en redes. La afición propia se parte de risa, y la rival se queda sin respuesta." },
      { label: "No responder", subtitle: "Ruido de fondo", consequences: { moral: 1 }, outcomeText: "Dejas el mensaje sin contestar. En una semana, nadie lo recuerda, salvo el hincha que lo mandó." },
    ],
  },
  {
    key: "mascota_fuga",
    title: "La mascota del club se escapa",
    tone: ["gracioso", "surrealista"],
    desc: (c) => `En plena sesión de fotos, la persona disfrazada de mascota del ${c.club} sale corriendo detrás de una paloma y se cuela en pleno pueblo, con el traje de águila puesto y todo el club detrás intentando explicarlo.`,
    opts: (c) => [
      { label: "Unirte a la caza", subtitle: `Con ${c.mate} a perseguirla`, consequences: { rel_vestuario: 4, moral: 3, forma: -1 }, outcomeText: "Corres detrás de la mascota, que salta una valla con el traje puesto. Os pilla un fotógrafo a los dos, y esa foto da la vuelta al país." },
      { label: "Grabarlo todo", subtitle: "Contenido asegurado", consequences: { fama: 5, rel_vestuario: 1 }, outcomeText: "Grabas la persecución desde tres ángulos. El vídeo suma un millón de visitas antes de que la paloma desaparezca." },
      { label: "Quedarte al margen", subtitle: "Que se ocupe el utillero", consequences: { moral: 1 }, outcomeText: "Te quedas mirando desde la sombra. El utillero acaba atrapando a la mascota y te lanza una mirada de reproche." },
    ],
  },
  {
    key: "vidente",
    title: "La vidente de la concentración",
    tone: ["surrealista"],
    desc: (c) => `${c.captain} ha traído a una vidente al hotel de concentración "para que lea el aura del vestuario antes de la temporada". Te toca a ti sentarte primero frente a las cartas.`,
    opts: (c) => [
      { label: "Tomártelo en broma", subtitle: "Y seguirle el juego", consequences: { rel_vestuario: 3, moral: 2 }, outcomeText: "Pones cara de misterio y le preguntas por el aura del utillero. La vidente se ríe, y el vestuario entero se parte contigo." },
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
      { label: "Negarte a participar", subtitle: "Esto no es serio", consequences: { rel_vestuario: -2, reputacion: 1 }, outcomeText: "Te levantas de la silla con educación. La vidente te mira con una sonrisa enigmática y el capitán murmura algo sobre 'mala energía'." },
    ],
  },
  {
    key: "doble_viral",
    title: "Tu doble se ha hecho viral",
    tone: ["surrealista"],
    desc: (c) => `Un vídeo de ${c.doppel}, alguien que es tu vivo retrato, haciendo el ridículo en un supermercado se ha vuelto viral con el titular "así es ${c.name} fuera del campo". Media ciudad ya lo cree de verdad.`,
    opts: (c) => [
      { label: "Desmentirlo con humor", subtitle: "Un vídeo respuesta", consequences: { fama: 5, moral: 2 }, outcomeText: "Subes un vídeo respuesta con cara de sorpresa y una bolsa de la compra. Esa noche, los comentarios no paran de llegar: '¡Idéntico, pero tú jamás haces el ridículo!'." },
      {
        label: `Buscar a ${c.doppel} y grabar algo juntos`,
        subtitle: "Sacarle partido a la confusión",
        consequences: { fama: 2 },
        resolve: {
          baseChance: 0.6,
          success: { text: "Grabáis un vídeo de los dos juntos que arrasa: la gente no sabe distinguiros y el club lo comparte encantado.", consequences: { fama: 7, rel_aficion: 3, moral: 3 } },
          fail: { text: `${c.doppel} resulta triunfar mucho más en redes que tú y te acaba robando parte del cariño de la afición durante semanas.`, consequences: { fama: 1, moral: -2, rel_aficion: -2 } },
        },
      },
      { label: "Ignorarlo", subtitle: "No darle más vueltas", consequences: { moral: 1 }, outcomeText: "No contestas ni una palabra. El vídeo se enfría en tres días y solo tu madre te llama para preguntar si de verdad compraste ese chándal." },
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
      { label: "Revisarlas antes", subtitle: "No fías de nadie", consequences: { rel_vestuario: -1, reputacion: 1 }, outcomeText: "Las sacudes con cuidado y encuentras un puñado de polvo rojizo. Nadie dice nada, pero todo el mundo sabe que lo sabes." },
      { label: `Devolverle la broma a ${c.mate}`, subtitle: "Ojo por ojo", consequences: { rel_vestuario: 2, moral: 2 }, outcomeText: `Esa misma semana, ${c.mate} abre su taquilla y encuentra todo forrado de papel de cocina. Su gritito se oye desde el pasillo.` },
    ],
  },
  {
    key: "autobus_averiado",
    title: "El autobús se avería en mitad de la nada",
    tone: ["gracioso", "surrealista"],
    desc: (c) => `Volviendo de un amistoso, el autobús del ${c.club} se avería en un pueblo de trescientos habitantes. Los vecinos, que no tienen ni idea de fútbol, os confunden con los invitados de una boda que se celebra esa misma tarde.`,
    opts: (c) => [
      { label: "Seguirles la corriente", subtitle: "Colarse en la boda", consequences: { rel_vestuario: 5, moral: 4, fama: 2 }, outcomeText: "En diez minutos estáis brindando con vecinos que os llaman 'primos de la novia'. Acabáis bailando, y el entrenador os saca de la fiesta arrastrando a los últimos." },
      { label: "Aclarar el malentendido", subtitle: "Explicar quiénes sois", consequences: { reputacion: 2, rel_aficion: 2 }, outcomeText: "Lo explicas con educación y los vecinos, algo confusos, os invitan a un café igualmente. Salís del pueblo con una bolsa de dulces." },
      { label: "Aprovechar para entrenar en la plaza", subtitle: `Con ${c.mate} de balón`, consequences: { forma: 2, rel_aficion: 3, fama: 3 }, outcomeText: "Montáis un partidillo con los críos del pueblo en plena plaza. Cuando se hace de noche, los vecinos aplauden desde sus balcones." },
    ],
  },
  {
    key: "maldicion_vestuario",
    title: "La taquilla maldita",
    tone: ["surrealista"],
    desc: () => `Un veterano jura que la taquilla del fondo del vestuario "trae mala suerte": el año pasado, todo el que la usó se lesionó. Es la única que queda libre y te toca a ti.`,
    opts: () => [
      { label: "Usarla sin darle importancia", subtitle: "Supersticiones aparte", consequences: { rel_entrenador: 1 }, resolve: { baseChance: 0.6, success: { text: "No pasa absolutamente nada, claro. La superstición se apaga sola en un par de semanas.", consequences: { moral: 2, rel_vestuario: 2 } }, fail: { text: "Te tuerces un tobillo la primera semana de nada. El vestuario entero jura que 'ya lo sabía'.", consequences: { forma: -4, moral: -2, rel_vestuario: 1 } } } },
      { label: "Pedir un cambio de taquilla", subtitle: "Mejor no arriesgar", consequences: { rel_vestuario: -1, moral: 1 }, outcomeText: "Cambias a otra y el vestuario te perdona con una carcajada. El veterano asiente con aprobación: 'Los listos viven más'." },
      { label: "Organizar un ritual con el equipo", subtitle: "Purificarla entre todos", consequences: { rel_vestuario: 4, moral: 3 }, outcomeText: "Hacéis un círculo, encendéis una vela con forma de balón y le cantáis a la taquilla. El utillero, desde la puerta, no da crédito." },
    ],
  },
  {
    key: "reto_viral_ridiculo",
    title: "El reto de moda te alcanza",
    tone: ["gracioso"],
    desc: (c) => `Todo el vestuario está enganchado a un reto viral absurdo — bailar en equilibrio sobre un balón medicinal mientras cantas el himno. ${c.mate2} ya lo intentó y acabó en el suelo.`,
    opts: () => [
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
      { label: "Grabar a los demás en vez de participar", subtitle: "Director de cine por un día", consequences: { rel_vestuario: 2, fama: 1 }, outcomeText: "Grabas el desastre desde el mejor ángulo. Tu vídeo es el que acaba en todas las cuentas del club." },
      { label: "Negarte", subtitle: "Esto es fútbol, no un circo", consequences: { reputacion: 2, rel_vestuario: -2 }, outcomeText: "Dices que esto es fútbol y no un circo. El vestuario te mira con respeto... y algún veterano murmura que 'te falta sentido del humor'." },
    ],
  },
  {
    key: "sueno_raro",
    title: "El sueño que no te quitas de la cabeza",
    tone: ["surrealista"],
    desc: (c) => `Llevas tres noches soñando lo mismo: marcas un gol imposible con una bota que no es tuya, en un campo que no reconoces, y al despertar te sabes de memoria la cara de un rival que nunca has visto. Se lo cuentas a ${c.mate} en el desayuno.`,
    opts: (c) => [
      { label: "Reírte y olvidarlo", subtitle: "Solo es un sueño", consequences: { moral: 1 }, outcomeText: "Te ríes y te lo quitas de la cabeza. Esa noche duermes de un tirón, sin sueños, como un bebé." },
      { label: `Contárselo al fisio ${c.fisio}`, subtitle: "Que te ayude a dormir mejor", consequences: { moral: 2, rel_vestuario: 1 }, outcomeText: `${c.fisio} escucha con atención y recomienda un té de tila y apagar el móvil antes de dormir. Esa noche, el sueño se aleja.` },
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
    desc: (c) => `${c.stranger} se presenta en la puerta de entrenamientos con un árbol genealógico dibujado a mano y fotos borrosas de una boda de los años 90, jurando que sois primos separados al nacer.`,
    opts: () => [
      { label: "Escuchar la historia entera", subtitle: "Por curiosidad", consequences: { moral: 2, rel_aficion: 2 }, outcomeText: "Te sientas en el bordillo y escuchas una hora de apellidos, bodas y primos segundos. Al final, te regala una copia del árbol genealógico dibujada a mano." },
      { label: "Hacerte una foto y seguirle la broma", subtitle: `"Primo, cuánto tiempo"`, consequences: { fama: 3, moral: 2 }, outcomeText: "Posas con un abrazo exagerado y el pie de foto 'Primo, cuánto tiempo'. La foto se vuelve viral y él acaba firmando camisetas." },
      { label: "Pedir amablemente que se vaya", subtitle: "Esto empieza a dar miedo", consequences: { reputacion: 1, moral: -1 }, outcomeText: "Le pides con educación que se marche. Él asiente, un poco dolido, y deja el árbol genealógico en la puerta." },
    ],
  },
  {
    key: "comida_rara",
    title: "El chef se pone experimental",
    tone: ["gracioso"],
    desc: (c) => `El nuevo chef de concentración presenta el menú de la semana: "algas fermentadas con proteína de grillo, receta del futuro". ${c.mate} ya ha puesto cara de circunstancias.`,
    opts: () => [
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
      { label: "Pedir el menú de siempre", subtitle: "Sin experimentos", consequences: { rel_vestuario: 1 }, outcomeText: "Pides un plato de pasta y el chef te mira con la ceja levantada. 'Te lo pierdes', murmura mientras te sirve." },
      { label: "Convencer al vestuario de amotinarse", subtitle: "Huelga de tenedores", consequences: { rel_vestuario: 4, rel_entrenador: -2, moral: 2 }, outcomeText: "Lanzas el mensaje en el grupo y, a la hora de comer, nadie toca el plato. El chef sale de la cocina con las manos en alto: 'De acuerdo, pasta'." },
    ],
  },
  {
    key: "objeto_perdido",
    title: "La maleta perdida en el aeropuerto",
    tone: ["gracioso"],
    desc: (c) => `Vuelves de la gira y tu maleta se ha perdido en el aeropuerto: botas, ropa y hasta tu amuleto de la suerte, desaparecidos. Tienes que entrenar con lo que te presta ${c.mate}, tres tallas más grande.`,
    opts: () => [
      { label: "Reírte de la pinta que llevas", subtitle: "Da igual la talla", consequences: { rel_vestuario: 4, moral: 3 }, outcomeText: "Sales al entreno con una camiseta que te llega a las rodillas. El vestuario entero te aplaude y alguien te saca una foto que llegará a la prensa." },
      { label: "Ir a comprar equipo nuevo", subtitle: "Solución rápida", consequences: { patrimonio: -600, moral: 1 }, outcomeText: "Pasas la tarde en una tienda de deporte comprando todo lo que te falta. Pagas, ahorras tiempo y sales con una bolsa enorme." },
      { label: "Culpar a la aerolínea en redes", subtitle: "Que se enteren todos", consequences: { fama: 2, reputacion: -1 }, outcomeText: "Publicas un mensaje indignado y la aerolínea te responde en una hora con una disculpa. Algunos seguidores lo comparten, otros te llaman exagerado." },
    ],
  },
  {
    key: "fan_disfrazado",
    title: "El hincha que se viste exactamente igual que tú",
    tone: ["surrealista"],
    desc: (c) => `Llevas semanas viendo, siempre en la misma esquina fuera del campo de entrenamiento, a ${c.stranger}: mismo corte de pelo, mismas botas, hasta el mismo gesto al calentar. Empieza a resultar un poco inquietante.`,
    opts: () => [
      { label: "Acercarte a preguntar qué pasa", subtitle: "Salir de dudas", consequences: { moral: 2, rel_aficion: 2 }, outcomeText: "Te acercas y le preguntas con tacto. Resulta ser un chaval tímido que admira tu juego; al despedirse, te regala una carta escrita a mano." },
      { label: "Hacerte una foto juntos", subtitle: "Convertirlo en broma", consequences: { fama: 3, moral: 1 }, outcomeText: "Os hacéis una foto, calcados. La subes con un 'ya tengo gemelo' y la gente te pide que le firmes unas botas iguales." },
      { label: "Avisar a seguridad del club", subtitle: "Por si acaso", consequences: { reputacion: 1, moral: -1 }, outcomeText: "El personal de seguridad se encarga con discreción. El chaval no vuelve, y tú te quedas con una sensación rara: ¿era para tanto?" },
    ],
  },
  {
    key: "amistoso_gigante",
    title: "Amistoso contra un gigante",
    desc: (c) => `La pretemporada trae un amistoso de gala contra el ${c.bigClub}. Estadio a reventar y cámaras de medio mundo para un partido que, sobre el papel, "no vale nada".`,
    opts: () => [
      { label: "Salir a disfrutarlo", subtitle: "Sin presión, sin miedo", consequences: { moral: 3, forma: 1 }, outcomeText: "Entras al campo sin presión y con una sonrisa. Cuando suena el himno, sientes que es uno de esos partidos que recordarás siempre." },
      { label: "Pedirle la camiseta a un rival", subtitle: "Para el recuerdo", consequences: { fama: 2, moral: 2 }, outcomeText: "Al pitido final le pides la camiseta a un rival del otro lado. Él sonríe y te la intercambia: ya tienes un recuerdo para siempre." },
      { label: "Tomártelo como una final", subtitle: "Demostrar que puedes competir ahí", consequences: { forma: 2, moral: 2, fama: 1 }, outcomeText: "Juegas cada balón como una final. El rival nota tu intensidad y, al acabar, te felicita con un abrazo seco." },
    ],
  },
  {
    key: "exjugador_visita",
    title: "Una leyenda visita el entrenamiento",
    desc: (c) => `${c.legend}, un histórico retirado del ${c.club}, se pasa por la ciudad deportiva a saludar al grupo. Se sienta a ver un rondo y, al terminar, te llama aparte.`,
    opts: (c) => [
      { label: "Escuchar su consejo con atención", subtitle: "Aprender de quien ya lo vivió", consequences: { media: 2, moral: 3, reputacion: 1 }, outcomeText: "La leyenda te habla sin prisas, con una voz tranquila. Cuando termina, te da una palmada en el hombro: 'Esto no se aprende de golpe'." },
      { label: "Pedirle una foto para tus redes", subtitle: `Con ${c.legend}`, consequences: { fama: 3, moral: 1 }, outcomeText: "Te haces la foto con la leyenda y, esa tarde, la imagen supera el millón de me gusta. Él, sonriendo, te deja claro que no es la última." },
      { label: "Preguntarle sin filtro qué haría en tu lugar", subtitle: "Ir al grano", consequences: { moral: 2, rel_entrenador: 1 }, outcomeText: "Le preguntas a bocajarro. Él se ríe y responde con una frase corta que no olvidarás: 'Menos pensar, más correr'." },
    ],
  },
  {
    key: "capitan_brazalete",
    title: "El capitán te ofrece el brazalete",
    desc: (c) => `Para el próximo amistoso, ${c.captain} tiene que descansar y le dice al míster que quiere que lo lleves tú. Es solo un amistoso, pero se nota que para ti no lo es.`,
    opts: () => [
      { label: "Aceptar con orgullo", subtitle: "Un primer paso de liderazgo", consequences: { moral: 4, reputacion: 3, rel_vestuario: 2 }, outcomeText: "Te colocas el brazalete en el túnel con las manos temblando. Tus compañeros te miran en silencio y, al salir, alguien te da una palmada en la espalda." },
      { label: "Proponer que lo lleve otro veterano", subtitle: "No quieres precipitarte", consequences: { rel_vestuario: 3, reputacion: 1 }, outcomeText: "Propones a otro compañero con respeto. El capitán asiente y a ti te gana el aprecio del grupo, pero esa noche te preguntas si has dejado pasar algo." },
      { label: "Aceptarlo sin darle importancia", subtitle: "Un brazalete es solo tela", consequences: { moral: 1 }, outcomeText: "Te lo pones con una media sonrisa y sales a jugar. En el vestuario nadie dice nada, pero todos han visto cómo se te ha iluminado la cara." },
    ],
  },
  {
    key: "medico_revision",
    title: "Revisión médica anual",
    desc: () => `El chequeo médico de pretemporada sale casi perfecto, pero el doctor se detiene un momento de más mirando una prueba: "Nada grave, pero vamos a vigilarlo de cerca este año".`,
    opts: () => [
      { label: "Pedir que te lo expliquen todo", subtitle: "Prefieres saberlo bien", consequences: { moral: 1, forma: 1 }, outcomeText: "El doctor te lo explica con gráficos y paciencia. Sales con un plan de revisiones y la tranquilidad de saber exactamente qué vigilar." },
      { label: "No darle más vueltas", subtitle: "Confiar en el cuerpo médico", consequences: { moral: -1 }, outcomeText: "Decides confiar y no preguntar. Durante días, el pequeño detalle del doctor sigue dando vueltas en tu cabeza sin que te des cuenta." },
      { label: "Pedir una segunda opinión por tu cuenta", subtitle: "Tranquilidad extra", consequences: { patrimonio: -400, moral: 2 }, outcomeText: "Un especialista externo revisa todo y confirma el diagnóstico: nada grave. Pagas con gusto por esa tranquilidad." },
    ],
  },
  {
    key: "sponsor_evento",
    title: "Evento con el patrocinador principal",
    desc: () => `El club te lleva a un evento con el patrocinador de la camiseta: cóctel, ejecutivos de traje y un directivo que insiste en enseñarte fotos de su hijo, que "también juega muy bien".`,
    opts: () => [
      { label: "Ser encantador toda la noche", subtitle: "Relaciones públicas", consequences: { fama: 3, reputacion: 2, forma: -1 }, outcomeText: "Sonríes, brindas y charlas con todos. Al final de la noche, el directivo te da su tarjeta: 'Cuando quieras algo, llámame'." },
      { label: "Cumplir lo justo y volver pronto", subtitle: "Descansar es lo primero", consequences: { forma: 1, reputacion: -1 }, outcomeText: "Saludas, posas, comes algo y te marchas a la hora prevista. El directivo no lo olvida, pero tú duermes como un lirón." },
      { label: "Invitar al hijo del directivo a un entreno", subtitle: "Un gesto que se agradece", consequences: { reputacion: 3, fama: 1, moral: 2 }, outcomeText: "El chaval se pasa la tarde con una sonrisa radiante, firmando balones con tu equipo. Su padre te lo agradecerá durante meses." },
    ],
  },
  {
    key: "photocall_incomodo",
    title: "La foto oficial no sale como esperabas",
    tone: ["gracioso"],
    desc: () => `En el photocall oficial de la plantilla te toca justo el segundo en el que estornudas. La foto, con los ojos cerrados y cara rarísima, se cuela en la web oficial antes de que nadie se dé cuenta.`,
    opts: () => [
      { label: "Reírte de la foto en tus redes", subtitle: "Autocrítica ganadora", consequences: { fama: 4, moral: 3, rel_aficion: 2 }, outcomeText: "La compartes con un 'así saldré en el Mundial'. La gente se ríe contigo y hasta el club la repite en sus historias." },
      { label: "Pedir que la repitan", subtitle: "Salvar el honor", consequences: { reputacion: 1 }, outcomeText: "Te colocas de nuevo con la mejor sonrisa. El fotógrafo, sudando, te saca diez disparos y esta vez sales perfecto." },
      { label: "Dejarlo estar", subtitle: "Que corra su suerte", consequences: { fama: 2, moral: -1 }, outcomeText: "Dejas que la foto se quede como está. En redes, alguien te apoda 'el estornudo' y el apodo tarda semanas en irse." },
    ],
  },
  {
    key: "bus_karaoke",
    title: "Karaoke improvisado en el autobús",
    tone: ["gracioso"],
    desc: (c) => `Vuelta larga en autobús tras un amistoso: alguien conecta un altavoz y ${c.mate} empieza un karaoke por turnos. Te toca el micro con una canción que no te sabes.`,
    opts: (c) => [
      { label: "Inventarte la letra sobre la marcha", subtitle: "Con toda la cara del mundo", consequences: { rel_vestuario: 4, moral: 3 }, outcomeText: "Improvisas versos absurdos sobre tus compañeros. A la segunda estrofa, todo el autobús canta contigo y el conductor sube el volumen." },
      { label: "Pasarle el turno a otro", subtitle: "Hoy no toca", consequences: { rel_vestuario: 1 }, outcomeText: "Pasas el micro y te retiras al fondo entre silbidos. Todos te perdonan al instante: el siguiente cantante es peor." },
      { label: "Elegir tú la siguiente canción", subtitle: `Para pillar a ${c.mate2}`, consequences: { rel_vestuario: 3, moral: 2 }, outcomeText: "Eliges una canción imposible para tu rival. Él la canta fatal, y tú lloras de risa hasta llegar al hotel." },
    ],
  },
  {
    key: "paseo_playa",
    title: "Día de piña en la playa",
    tone: ["gracioso"],
    desc: () => `El cuerpo técnico organiza una tarde libre en la playa como premio tras una semana dura: fútbol descalzo en la arena, bañador y cero tácticas por unas horas.`,
    opts: (c) => [
      { label: "Organizar un partidillo en la arena", subtitle: `Contigo y ${c.mate} de capitanes`, consequences: { rel_vestuario: 5, moral: 4 }, outcomeText: "Dividís la playa en dos campos y el partido acaba con diez goles absurdos, un bañador roto y un balón en el mar." },
      { label: "Desconectar del todo", subtitle: "Sin balón ni pantallas", consequences: { moral: 3, forma: 1 }, outcomeText: "Pasas la tarde sin móvil, con los pies en el agua. Al caer el sol, notas por primera vez en semanas que respiras hondo." },
      { label: "Aprovechar para hablar con el míster", subtitle: "Fuera del contexto formal", consequences: { rel_entrenador: 3, moral: 1 }, outcomeText: "Os sentáis en la arena con una cerveza sin alcohol y hablas con él sin traje ni pizarra. Entiendes mejor lo que pide de ti." },
    ],
  },
  {
    key: "profe_ingles",
    title: "Clases de inglés obligatorias",
    tone: ["gracioso"],
    desc: (c) => `El club ficha a un profesor de inglés para toda la plantilla, de cara a la gira internacional. ${c.mate} confunde "boots" con "boats" delante de todo el grupo y el profesor no sabe si reírse.`,
    opts: () => [
      { label: "Tomártelo en serio", subtitle: "Te puede servir en el futuro", consequences: { media: 2, reputacion: 1 }, outcomeText: "Haces los deberes y tomas apuntes. El profesor te pone de ejemplo y tú, de reojo, ves cómo el resto te mira con una mezcla de envidia y respeto." },
      { label: "Reíros juntos del desastre", subtitle: "Ambiente relajado", consequences: { rel_vestuario: 3, moral: 2 }, outcomeText: "La clase se convierte en un espectáculo. El profesor, rendido, acaba riéndose con vosotros mientras la clase aprende, por fin, 'boots' y 'boats'." },
      { label: "Saltarte la clase", subtitle: "Ya te las apañarás con gestos", consequences: { rel_entrenador: -1 }, outcomeText: "Te escabulles a la sala de juegos. Al día siguiente, el míster te ve con la cara de quien sabe todo y no dice nada." },
    ],
  },
  {
    key: "hijo_entrenador",
    title: "El hijo del entrenador te tiene manía",
    desc: (c) => `El hijo pequeño de ${c.coach}, que anda siempre por la ciudad deportiva, ha decidido que tú eres su jugador favorito y te sigue a todas partes con un balón bajo el brazo.`,
    opts: () => [
      { label: "Entrenar un rato con él", subtitle: "Diez minutos que valen mucho", consequences: { rel_entrenador: 4, moral: 3 }, outcomeText: "Le haces un rondo de diez minutos. El niño casi llora de alegría, y su padre te mira desde la banda con un gesto de agradecimiento." },
      { label: "Regalarle una camiseta firmada", subtitle: "Un detalle bonito", consequences: { rel_entrenador: 3, patrimonio: -100, moral: 2 }, outcomeText: "Le das la camiseta firmada y el niño la lleva puesta durante tres días seguidos. Su padre te lo agradece con una sonrisa serena." },
      { label: "Pedirle a otro compañero que se ocupe", subtitle: "Ahora mismo no puedes", consequences: { rel_entrenador: -1 }, outcomeText: "Pasas el testigo a un compañero. El niño se queda mirándote con tristeza, y el míster, de lejos, ha visto la escena entera." },
    ],
  },
  {
    key: "reportero_incomodo",
    title: "Una pregunta que se pasa de la raya",
    desc: () => `En rueda de prensa, un periodista te pregunta directamente por tu vida privada, algo que nunca has compartido. Se hace un silencio incómodo en la sala.`,
    opts: () => [
      { label: "Responder con firmeza y educación", subtitle: "Marcar el límite sin dramas", consequences: { reputacion: 3, moral: 1 }, outcomeText: "Marcas el límite con calma y un 'esa pregunta no toca'. La sala asiente y varios periodistas toman nota de tu madurez." },
      { label: "Levantarte y salir", subtitle: "No vas a permitirlo", consequences: { fama: 2, reputacion: -1, moral: -1 }, outcomeText: "Te levantas y sales sin decir nada. Las cámaras graban tu espalda; esa imagen será el titular del día." },
      { label: "Contestar con humor", subtitle: "Quitarle hierro", consequences: { fama: 3, moral: 1 }, outcomeText: "Respondes con una broma que desarma al periodista y arranca risas. El tema queda zanjado sin que nadie se atreva a insistir." },
    ],
  },
  {
    key: "viaje_retrasado",
    title: "Retraso eterno en el aeropuerto",
    tone: ["gracioso"],
    desc: () => `El vuelo de vuelta de la gira se retrasa seis horas. La plantilla entera acampa en la sala de espera, entre partidas de cartas, siestas en el suelo y quejas al de la aerolínea.`,
    opts: (c) => [
      { label: "Organizar juegos para matar el tiempo", subtitle: `Con ${c.mate} de árbitro`, consequences: { rel_vestuario: 4, moral: 3 }, outcomeText: "Montas un torneo de piedra-papel-tijera con eliminatorias y premios absurdos. Seis horas pasan volando, y ni se nota el retraso." },
      { label: "Aprovechar para dormir", subtitle: "Recuperar horas de sueño", consequences: { forma: 2 }, outcomeText: "Te tumbas en un banco con la sudadera de almohada. Cuando despiertas, te toca embarcar con una sonrisa y el cuello algo tieso." },
      { label: "Quejarte en redes de la aerolínea", subtitle: "Que se enteren", consequences: { fama: 2, reputacion: -1 }, outcomeText: "Tu publicación se llena de comentarios de gente que pasó por lo mismo. La aerolínea contesta con un cupón de descuento." },
    ],
  },
  {
    key: "helado_apuesta",
    title: "Apuesta de helados por el resultado",
    tone: ["gracioso"],
    desc: (c) => `${c.mate} te reta: si el equipo marca más de dos goles en el amistoso del sábado, le invitas a helados a todo el vestuario. Si no, invita él. El vestuario entero sigue la apuesta con lupa.`,
    opts: () => [
      { label: "Aceptar el reto", subtitle: "Con confianza en el equipo", consequences: { rel_vestuario: 3, moral: 2 }, outcomeText: "Cerráis la apuesta con un apretón de manos solemne. El vestuario lo sigue como si fuera una final." },
      { label: "Subir la apuesta", subtitle: "Doble o nada", consequences: { rel_vestuario: 4, moral: 3 }, outcomeText: "Subes la apuesta y el vestuario ruge. A partir de ese momento, el amistoso es lo menos importante del fin de semana." },
      { label: "Declinar con educación", subtitle: "No te van las apuestas", consequences: { rel_vestuario: -1 }, outcomeText: "Declinas con una sonrisa. El vestuario te llama 'aburrido', aunque más de uno respeta que no apuestes por apostar." },
    ],
  },
  {
    key: "veterano_retirada",
    title: "Un veterano se plantea colgar las botas",
    desc: (c) => `${c.veteran}, uno de los pesos pesados del vestuario, te confiesa en petit comité que esta puede ser su última pretemporada. "No se lo he dicho a nadie más todavía".`,
    opts: () => [
      { label: "Animarle a seguir un año más", subtitle: "El equipo lo necesita", consequences: { rel_vestuario: 4, moral: 3 }, outcomeText: "Le dices que sin él el vestuario no es lo mismo. Él sonríe sin responder, pero esa noche te manda un mensaje: 'Lo pensaré'." },
      { label: "Respetar su decisión en silencio", subtitle: "No es tu lugar para opinar", consequences: { rel_vestuario: 2, reputacion: 2 }, outcomeText: "Asientes y le das un abrazo. No hacen falta palabras: los dos sabéis lo que significa." },
      { label: "Proponerle organizar un homenaje", subtitle: "Que se vaya como se merece", consequences: { rel_vestuario: 5, moral: 4, patrimonio: -300 }, outcomeText: "Organizáis un homenaje sorpresa con vídeos de sus mejores goles. El veterano llora delante de todo el estadio, y no lo disimula." },
    ],
  },
  {
    key: "exigencia_aficion",
    title: "La afición pide explicaciones",
    desc: (c) => `Un grupo de aficionados del ${c.club} organiza una concentración a las puertas de la ciudad deportiva tras una pretemporada floja. Piden hablar con algún jugador.`,
    opts: () => [
      { label: "Salir a dar la cara", subtitle: "Escuchar sus quejas", consequences: { rel_aficion: 4, reputacion: 3, moral: -1 }, outcomeText: "Sales a hablar con ellos con la cabeza alta. Escuchas las quejas sin interrumpir, y al despedirte alguien te aplaude." },
      { label: "Dejar que hable el capitán", subtitle: "No es tu papel", consequences: { rel_vestuario: 1 }, outcomeText: "El capitán sale a hablar con la afición. Tú te quedas dentro, mirando por la ventana, con la certeza de que podrías haber salido." },
      { label: "Ignorarlo y centrarte en trabajar", subtitle: "El campo dará la respuesta", consequences: { rel_aficion: -3, forma: 2 }, outcomeText: "Entras por la puerta de atrás y entrenas con el doble de intensidad. Fuera, los cánticos suenan sin parar hasta que se hace de noche." },
    ],
  },
  {
    key: "crisis_directiva",
    title: "Ruido en el despacho",
    desc: (c) => `Se filtra una discusión entre ${c.director} y el presidente sobre el presupuesto de fichajes. La plantilla lo comenta en voz baja: nadie sabe si va a llegar el refuerzo prometido.`,
    opts: () => [
      { label: "No meterte en líos de despacho", subtitle: "A lo tuyo", consequences: { moral: 1 }, outcomeText: "Haces como que no oyes y sigues con tu rutina. Un compañero te mira con envidia: 'Qué sano es no enterarse'." },
      { label: "Preguntar directamente al director", subtitle: "Prefieres saber a qué atenerte", consequences: { reputacion: 1, moral: -1 }, outcomeText: "El director te mira, resopla y responde con evasivas: 'Todo irá bien'. Sales de su despacho igual de preocupado que entraste." },
      { label: "Hablar con el vestuario para calmar ánimos", subtitle: "Liderar en la sombra", consequences: { rel_vestuario: 3, reputacion: 2 }, outcomeText: "Reúnes al grupo en el vestuario y pides calma. Funciona: esa tarde el ambiente cambia y el míster te lo agradece con un asentimiento." },
    ],
  },
  {
    key: "fisio_nuevo",
    title: "Llega un fisio con métodos distintos",
    desc: () => `El club ficha a un nuevo fisioterapeuta con técnicas que nadie del vestuario ha probado antes: agujas, hielo extremo y estiramientos que duelen más de lo que ayudan al principio.`,
    opts: () => [
      { label: "Confiar en el método nuevo", subtitle: "Darle una oportunidad real", consequences: { forma: 3, rel_vestuario: 1 }, outcomeText: "Tras tres sesiones de hielo extremo y agujas, notas la musculatura más suelta que nunca. El fisio te sonríe: 'Te lo dije'." },
      { label: "Pedir seguir con lo de siempre", subtitle: "Lo conocido da seguridad", consequences: { forma: 1, rel_entrenador: -1 }, outcomeText: "El nuevo fisio asiente con educación, pero con un deje de decepción. El viejo método sigue funcionando, aunque ya no es el mismo." },
      { label: "Preguntarle todo con curiosidad", subtitle: "Aprender algo nuevo", consequences: { media: 1, moral: 1 }, outcomeText: "Le haces veinte preguntas seguidas y él te responde a todas con entusiasmo. Al final, te regala un libro sobre el método." },
    ],
  },
  {
    key: "utillero_despedida",
    title: "Se jubila el utillero histórico",
    desc: (c) => `Después de treinta años doblando camisetas, el utillero del ${c.club} se jubila. El vestuario entero le prepara una sorpresa el último día de pretemporada.`,
    opts: () => [
      { label: "Organizar una colecta para su regalo", subtitle: "Que se note el cariño", consequences: { rel_vestuario: 5, moral: 4, patrimonio: -200 }, outcomeText: "Todo el vestuario echa dinero en una bolsa y le regalan un reloj grabado. El utillero abre el paquete y no puede hablar." },
      { label: "Pedirle que se quede a alguna charla suelta", subtitle: "No perder el contacto", consequences: { rel_vestuario: 3, moral: 2 }, outcomeText: "Le propones aparecer de vez en cuando por el vestuario. Él sonríe y asiente: 'Eso es lo que más echaré de menos'." },
      { label: "Un abrazo rápido y ya", subtitle: "Sin dramas", consequences: { rel_vestuario: 1 }, outcomeText: "Le das un abrazo corto y un 'gracias por todo'. Treinta años dan para mucho más, pero él lo recibe con una sonrisa cansada." },
    ],
  },
  {
    key: "estadio_obras",
    title: "Las obras del estadio se retrasan",
    desc: (c) => `Las obras de reforma del estadio del ${c.club} no llegan a tiempo: la presentación oficial de la plantilla toca hacerse en el campo de entrenamiento, sin grada ni gran boato.`,
    opts: () => [
      { label: "Restarle importancia", subtitle: "Lo que importa es el equipo", consequences: { moral: 1, rel_vestuario: 1 }, outcomeText: "Dices que el equipo es lo que importa. Tu compañero asiente: 'Total, el himno suena igual'." },
      { label: "Proponer llevarla igualmente a la afición", subtitle: "Streaming improvisado", consequences: { rel_aficion: 3, fama: 2 }, outcomeText: "Montas un streaming improvisado desde el campo de entrenamiento. Miles de aficionados lo ven y la presentación acaba siendo más cercana que nunca." },
      { label: "Quejarte por lo bajo", subtitle: "Esperabas algo mejor", consequences: { moral: -1 }, outcomeText: "Murmuras a un compañero lo que piensas de las obras. Él asiente y los dos os reís con resignación." },
    ],
  },
  {
    key: "huelga_transporte",
    title: "Huelga de transporte el día del amistoso",
    tone: ["gracioso"],
    desc: () => `Una huelga general de transporte deja tirado al autobús del club. Al final, toca improvisar: coches particulares, algún taxi y hasta la furgoneta del utillero para llegar a tiempo al amistoso.`,
    opts: () => [
      { label: "Organizar los coches tú mismo", subtitle: "Ponerte al mando", consequences: { rel_vestuario: 3, reputacion: 2 }, outcomeText: "Reparte coches, mapas y horarios con una eficacia que sorprende al míster. Llegáis a tiempo y el utillero te aplaude desde la furgoneta." },
      { label: "Ir de copiloto con el míster", subtitle: "Charla poco habitual", consequences: { rel_entrenador: 3, moral: 1 }, outcomeText: "Pasas una hora de viaje con él, con la radio baja. Hablan de fútbol, de familia y de cosas que nunca se hablan en el vestuario." },
      { label: "Compartir coche con la prensa que cubre el partido", subtitle: "Curioso, cuanto menos", consequences: { fama: 3, reputacion: -1 }, outcomeText: "Compartes coche con dos periodistas que no paran de preguntar. Tienes que medir cada palabra, pero el rato es curioso." },
    ],
  },
  {
    key: "suplente_estrella",
    title: "Un internacional llega cedido... y no está contento",
    desc: (c) => `El club anuncia la cesión de ${c.star}, un internacional acostumbrado a jugar en un club mucho más grande, que llega con cara de estar de paso y poca paciencia con los amistosos de pretemporada.`,
    opts: () => [
      { label: "Hacerle sentir parte del grupo", subtitle: "Sin rencores", consequences: { rel_vestuario: 3, media: 1 }, outcomeText: "Te sientas a su lado en la comida y lo presentas al grupo. Él lo agradece con un asentimiento: 'Aquí se está bien'." },
      { label: "Marcarle distancia hasta que se lo gane", subtitle: "Aquí no hay favores", consequences: { rel_vestuario: -1, reputacion: 1 }, outcomeText: "Lo saludas con frialdad. El internacional lo nota y, a partir de entonces, se ciñe a lo estrictamente profesional." },
      { label: "Pedirle consejo sobre el nivel de arriba", subtitle: "Aprovechar la experiencia", consequences: { media: 2, moral: 1 }, outcomeText: "Le preguntas cómo es entrenar en un club grande. Él te cuenta lo que no sale en la tele, y tú escuchas hasta el final." },
    ],
  },
  {
    key: "terreno_malo",
    title: "El campo del amistoso está fatal",
    desc: (c) => `Llegáis a un amistoso de pretemporada en un campo con más barro que césped. El fisio ${c.fisio} avisa: "Con este terreno, mucho ojo con las entradas".`,
    opts: () => [
      { label: "Jugar con cabeza y sin arriesgar", subtitle: "Prioridad: no lesionarte", consequences: { forma: 1, rel_entrenador: 1 }, outcomeText: "Juegas con cuidado, evitando cada choque dudoso. Al terminar, el fisio te da un pulgar arriba: 'Eso es sentido común'." },
      { label: "Darlo todo igualmente", subtitle: "El resultado también importa", consequences: { forma: 2 }, resolve: { baseChance: 0.6, success: { text: "Sales indemne y con buenas sensaciones pese al estado del campo.", consequences: { forma: 3, moral: 2 } }, fail: { text: "Un resbalón tonto en el barro te deja unos días tocado.", consequences: { forma: -5, moral: -2 } } } },
      { label: "Proponer al árbitro suspenderlo", subtitle: "Es solo un amistoso", consequences: { reputacion: 1, rel_vestuario: -1 }, outcomeText: "El árbitro te escucha y mira el campo con una mueca. 'Es un amistoso, se juega', responde, y tú te encoges de hombros." },
    ],
  },
  {
    key: "prensa_amarilla",
    title: "Un titular inventado sobre tu vida",
    desc: (c) => `Una revista del corazón publica una historia completamente inventada sobre tu vida sentimental. ${c.agent} llama furioso: "Esto no se puede quedar así".`,
    opts: (c) => [
      { label: "Desmentirlo públicamente", subtitle: "Poner los puntos sobre las íes", consequences: { reputacion: 2, fama: 2 }, outcomeText: "Sacas un comunicado corto y seco. En una tarde, la noticia desaparece y la revista publica una rectificación escondida." },
      { label: `Dejar que ${c.agent} lo gestione legalmente`, subtitle: "Por la vía formal", consequences: { rel_representante: 2, patrimonio: -500 }, outcomeText: `${c.agent} se encarga con un abogado. Una semana después, la revista retira el artículo y paga una pequeña indemnización.` },
      { label: "No darle ninguna importancia", subtitle: "Alimentar el ruido es peor", consequences: { moral: -1, reputacion: 1 }, outcomeText: "Dejas que la historia se apague sola. Tu madre, en cambio, te llama dos veces para asegurarse de que no es verdad." },
    ],
  },
  {
    key: "familia_visita",
    title: "Tu familia visita la concentración",
    desc: () => `Tu familia se planta un día en la concentración de pretemporada, sin avisar del todo, solo para verte entrenar de cerca. Verlos ahí, en la grada vacía, te toca algo por dentro.`,
    opts: () => [
      { label: "Presentárselos a todo el vestuario", subtitle: "Que los conozcan", consequences: { rel_vestuario: 3, moral: 5 }, outcomeText: "Tu madre trae una bandeja de empanadillas para todo el grupo. En diez minutos, el vestuario entero la llama 'mamá'." },
      { label: "Pasar la tarde entera con ellos", subtitle: "El fútbol puede esperar unas horas", consequences: { moral: 6, forma: -1 }, outcomeText: "Pasas la tarde con tu familia, entre risas y anécdotas. Cuando se van, el silencio de la habitación del hotel pesa un poco más." },
      { label: "Un saludo rápido entre entrenamientos", subtitle: "El calendario manda", consequences: { moral: 1 }, outcomeText: "Les das un abrazo rápido y vuelves al entreno. Tu madre te lanza un beso desde la grada y tú lo atrapas con una sonrisa." },
    ],
  },
  {
    key: "partido_benefico",
    title: "Partido benéfico de pretemporada",
    desc: (c) => `El ${c.club} organiza un partido benéfico contra veteranos y famosos locales para recaudar fondos para un hospital infantil. Te piden ser el capitán del combinado.`,
    opts: () => [
      { label: "Volcarte al máximo en la causa", subtitle: "Que se note el compromiso", consequences: { reputacion: 4, fama: 3, rel_aficion: 3 }, outcomeText: "Te implicas hasta en la organización de las entradas. Al final, el hospital recibe una cifra récord y una enfermera te abraza con lágrimas en los ojos." },
      { label: "Donar tu prima del partido", subtitle: "Un gesto extra", consequences: { patrimonio: -1000, reputacion: 3, moral: 3 }, outcomeText: "Donas tu prima sin pedir publicidad. Cuando se filtra, la gente te lo agradece más por lo discreto que por la cantidad." },
      { label: "Participar sin más", subtitle: "Cumplir con lo pedido", consequences: { reputacion: 1 }, outcomeText: "Juegas el partido con buena cara y te vas a casa. Cumples, sin florituras, y el club lo agradece con una sonrisa educada." },
    ],
  },
  {
    key: "subasta_camiseta",
    title: "Subasta solidaria de camisetas",
    desc: (c) => `El club subasta las camisetas del amistoso benéfico. La de ${c.mate} está a punto de quedarse sin pujas y él, en broma, te mira esperando que hagas algo.`,
    opts: () => [
      { label: "Pujar tú mismo por su camiseta", subtitle: "Por una buena causa", consequences: { patrimonio: -800, rel_vestuario: 4, reputacion: 2 }, outcomeText: "Levantas la mano y subes la puja. Tu compañero se tapa la cara, riendo, mientras la sala entera aplaude tu gesto." },
      { label: "Animar a la afición a pujar más", subtitle: "Contagiar el ambiente", consequences: { rel_aficion: 3, fama: 1 }, outcomeText: "Te subes a una silla y animas a la grada. La puja se dispara y el hospital recibe más del triple de lo previsto." },
      { label: "Dejar que se resuelva sola", subtitle: "No es tu problema", consequences: { rel_vestuario: -1 }, outcomeText: "Dejas que la camiseta se venda al precio que sea. Tu compañero te lanza una mirada fingidamente ofendida y te olvidas del asunto." },
    ],
  },
  {
    key: "entreno_amanecer",
    title: "Entrenos al amanecer por la ola de calor",
    desc: (c) => `Con las temperaturas disparadas, ${c.coach} mueve los entrenos a las siete de la mañana. El madrugón cuesta, pero se entrena mucho mejor sin el sol a plomo.`,
    opts: () => [
      { label: "Adaptarte sin quejarte", subtitle: "Es lo más sensato", consequences: { forma: 2, rel_entrenador: 2 }, outcomeText: "Llegas a las siete con el termo de café y una sonrisa. El míster te mira desde su coche con una ceja arqueada." },
      { label: "Quejarte del horario", subtitle: "No eres persona de mañanas", consequences: { rel_entrenador: -2, moral: -1 }, outcomeText: "Murmuras algo sobre la hora y el míster lo oye. No dice nada, pero a partir de mañana te toca llegar el primero." },
      { label: "Proponer entrenos nocturnos en su lugar", subtitle: "Una alternativa", consequences: { rel_entrenador: 1 }, outcomeText: "El míster te escucha, medita y responde: 'Lo estudiamos'. Una semana después, los entrenos siguen al amanecer." },
    ],
  },
  {
    key: "amistoso_pica",
    title: "Un amistoso que se calienta más de la cuenta",
    desc: () => `Lo que iba a ser un amistoso tranquilo se convierte en un partido de codazos y protestas contra un rival histórico. El árbitro, de mutuo acuerdo entre clubes, pierde el control del choque.`,
    opts: () => [
      { label: "Mantener la cabeza fría", subtitle: "No entrar al trapo", consequences: { rel_entrenador: 2, reputacion: 2 }, outcomeText: "Respiras hondo, ignoras los codazos y sigues jugando. Al acabar, el míster te dice al oído: 'Eso es madurez'." },
      { label: "Responder a las provocaciones", subtitle: "Que no se confundan", consequences: { fama: 2, rel_vestuario: 2, reputacion: -2 }, outcomeText: "Devuelves el empujón y el árbitro os separa. La grada ruge, el míster se tapa la cara con una mano." },
      { label: "Calmar a tus propios compañeros", subtitle: "Liderazgo silencioso", consequences: { rel_vestuario: 3, rel_entrenador: 2 }, outcomeText: "Vas de uno en uno, hablando bajito. Al final, el equipo vuelve a jugar con cabeza, y el míster te lo agradece con una palmada." },
    ],
  },
  {
    key: "guru_fisico",
    title: "El nuevo gurú de la preparación física",
    tone: ["gracioso", "surrealista"],
    desc: () => `El club contrata a un preparador físico "revolucionario" que os hace entrenar descalzos sobre arroz, meditar antes de cada rondo y respirar "como los lobos". Nadie entiende del todo el método, pero el club insiste en darle una oportunidad.`,
    opts: () => [
      {
        label: "Entregarte al método sin cuestionarlo",
        subtitle: "Confianza ciega",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          success: { text: "Sorprendentemente, te sientes mejor que nunca: más ligero, más despierto, casi zen.", consequences: { forma: 5, moral: 4 } },
          fail: { text: "Te haces daño en un pie caminando sobre el arroz y el vestuario entero se muere de la risa.", consequences: { forma: -3, moral: -1, rel_vestuario: 2 } },
        },
      },
      { label: "Seguirlo con escepticismo", subtitle: "Sin creerte del todo el rollo", consequences: { forma: 1, rel_vestuario: 1 }, outcomeText: "Haces lo que te pide con la ceja arqueada. Algo funciona, aunque nunca lo admitirías en voz alta." },
      { label: "Pedir en privado volver al método de siempre", subtitle: "Esto no es para ti", consequences: { rel_entrenador: -1, moral: 1 }, outcomeText: "Se lo dices al míster en privado. Él asiente con una sonrisa cómplice: 'No eres el primero'." },
    ],
  },
  {
    key: "baile_viral",
    title: "El baile del vestuario se hace viral",
    tone: ["gracioso"],
    desc: (c) => `Al terminar un entrenamiento, ${c.mate} improvisa un baile absurdo y todo el vestuario se suma en cadena. Alguien lo graba y lo sube sin pedir permiso a nadie.`,
    opts: () => [
      { label: "Subirlo tú también con orgullo", subtitle: "Que se vea la unión del grupo", consequences: { fama: 4, rel_vestuario: 3, rel_aficion: 2 }, outcomeText: "Compartes el vídeo con un 'esto es un equipo'. La afición lo adora y el club lo usa en su campaña de abonados." },
      { label: "Pedir que lo bajen", subtitle: "Prefieres discreción", consequences: { rel_vestuario: -1, reputacion: 1 }, outcomeText: "Se lo pides a quien lo subió. El vídeo se borra, pero otro compañero ya lo había guardado y lo reenvía a medio mundo." },
      { label: "Grabar una segunda parte", subtitle: "Darle continuidad", consequences: { fama: 5, rel_vestuario: 4 }, outcomeText: "Montáis una coreografía mucho más ambiciosa. La segunda parte supera a la primera, y el entrenador acaba haciendo un cameo con cara de resignación." },
    ],
  },
  {
    key: "visita_cantera",
    title: "Vuelves a tu antigua cantera",
    desc: () => `El club organiza una visita sorpresa a la cantera de donde salió parte de la plantilla. Pisar de nuevo aquel campo pequeño, con la pintura descascarillada, te trae de golpe todos los recuerdos.`,
    opts: () => [
      { label: "Entrenar un rato con los más pequeños", subtitle: "Devolver algo de lo recibido", consequences: { rel_aficion: 4, moral: 5, reputacion: 2 }, outcomeText: "Pasas una hora corriendo con niños de ocho años que te miran como a un héroe. Al despedirte, uno te regala un dibujo que guardas en la mochila." },
      { label: "Donar material para el club de cantera", subtitle: "Un gesto concreto", consequences: { patrimonio: -1500, reputacion: 3, moral: 3 }, outcomeText: "Entregas balones, petos y botas para toda la cantera. El entrenador te abraza con los ojos húmedos: 'Esto es lo que necesitábamos'." },
      { label: "Recorrerlo en silencio, solo para ti", subtitle: "Un momento íntimo", consequences: { moral: 4 }, outcomeText: "Pasas un rato a solas, tocando la valla, los banquillos viejos, el césped irregular. Es un momento tuyo, sin cámaras, que no olvidarás." },
    ],
  },
  {
    key: "botas_olvidadas",
    title: "Te dejas las botas en casa",
    tone: ["gracioso"],
    desc: (c) => `Llegas al aeropuerto para la gira y te das cuenta: las botas se han quedado en casa. El avión sale en cuarenta minutos y ${c.mate} no para de reírse.`,
    opts: (c) => [
      { label: "Pedir prestadas unas de tu talla al club", subtitle: "Solución de emergencia", consequences: { rel_vestuario: 2, moral: 1 }, outcomeText: "El utillero te trae unas botas de tu talla y tú las agradeces con un abrazo. Resultan ser muy cómodas, para tu sorpresa." },
      { label: "Comprar unas nuevas en destino", subtitle: "Sin dramas", consequences: { patrimonio: -300, moral: 1 }, outcomeText: "Te escapas a una tienda de deportes del aeropuerto y compras unas botas nuevas. No son las tuyas, pero te sirven." },
      { label: `Pedirle a ${c.mate} que se ría menos y ayude`, subtitle: "Menos risa y más soluciones", consequences: { rel_vestuario: -1, moral: 2 }, outcomeText: `${c.mate} se calla de golpe y, avergonzado, te ayuda a buscar unas botas. A partir de ese momento, te debe una.` },
    ],
  },
  {
    key: "terapeuta_mental",
    title: "Sesión con la psicóloga del club",
    desc: (c) => `El departamento médico incorpora este año a ${c.psych}, psicóloga deportiva. En tu primera sesión te hace una pregunta que no esperabas: "¿Qué es lo que más miedo te da de esta temporada?".`,
    opts: () => [
      { label: "Contestar con total sinceridad", subtitle: "Abrirte de verdad", consequences: { moral: 4, forma: 1 }, outcomeText: "Dices en voz alta algo que nunca habías dicho. La psicóloga asiente sin juzgar y tú notas que algo se afloja dentro." },
      { label: "Responder con evasivas", subtitle: "No es tu terreno", consequences: { moral: -1 }, outcomeText: "Sueltas respuestas vagas y la psicóloga lo nota. Sonríe con calma: 'Cuando quieras, aquí estaré'." },
      { label: "Pedir sesiones regulares", subtitle: "Cuidar la cabeza también", consequences: { moral: 3, forma: 1, patrimonio: -200 }, outcomeText: "Agendas sesiones cada dos semanas. Con el paso de los días, notas que duermes mejor y que los partidos pesan menos." },
    ],
  },
  {
    key: "apodo_nuevo",
    title: "El vestuario te pone un mote",
    tone: ["gracioso"],
    desc: (c) => `Después de una anécdota tonta en un entrenamiento, ${c.mate2} empieza a llamarte por un mote ridículo. En dos días, todo el vestuario lo ha adoptado, incluido el propio ${c.coach}.`,
    opts: () => [
      { label: "Abrazar el mote con humor", subtitle: "Total, ya no hay quien lo pare", consequences: { rel_vestuario: 4, moral: 3, fama: 1 }, outcomeText: "Te lo tomas con humor y lo usas hasta tú. En un mes, hasta la afición te corea el mote en el estadio." },
      { label: "Intentar frenarlo", subtitle: "No te convence nada", consequences: { rel_vestuario: -1 }, outcomeText: "Lo intentas, pero el mote ya es imparable. Cuanto más protestas, más gracia le hace al vestuario." },
      { label: "Ponerle tú un mote a quien te lo puso", subtitle: "Venganza justa", consequences: { rel_vestuario: 3, moral: 2 }, outcomeText: "Lo bautizas con un nombre imposible. El vestuario aplaude y, al día siguiente, todos lo llaman así." },
    ],
  },
  {
    key: "sueno_transferencia",
    title: "Un sueño demasiado ambicioso",
    tone: ["surrealista"],
    desc: (c) => `Sueñas con vestir la camiseta del ${c.bigClub} y levantar un trofeo bajo confeti dorado. Te despiertas con el corazón acelerado y, durante todo el desayuno, no puedes dejar de pensar en ello.`,
    opts: (c) => [
      { label: "Contárselo a tu agente entre risas", subtitle: `"Apunta esto, ${c.agent}"`, consequences: { rel_representante: 2, moral: 2 }, outcomeText: `"Apunta esto, ${c.agent}", dices. Él se ríe, pero esa noche, guarda en su libreta el nombre del club con un asterisco.` },
      { label: "Usarlo como motivación en el entreno", subtitle: "Que el sueño empuje", consequences: { forma: 3, moral: 3 }, outcomeText: "En el entreno cierras los ojos en cada sprint y ves el trofeo dorado. Esa semana corres como nunca." },
      { label: "Guardártelo para ti", subtitle: "Algunas cosas mejor no compartirlas", consequences: { moral: 1 }, outcomeText: "No se lo cuentas a nadie. Algunos sueños son más fuertes cuando solo los conoces tú." },
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
    name: displayName(player),
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
    veteran: getTeammateName(player, `${salt}-veteran`),
    legend: getCelebrityName(player, "actor", `${salt}-legend`, "m"),
    psych: getPersonName(player, `${salt}-psych`, "f"),
    bigClub: BIG_CLUBS[(player.id.length + week) % BIG_CLUBS.length],
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
