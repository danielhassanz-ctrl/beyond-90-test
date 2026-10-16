/**
 * EL RETO DEL DÍA. Cada día (hora de Madrid) hay una situación que es la misma para todos los jugadores: una decisión de un minuto
 * (el penalti del 89, la pregunta capciosa, la oferta que no se repite…). Eliges entre tres salidas con distinto riesgo y el resultado
 * sale de tu nivel y tu forma, con una tirada fija para ese día (si recargas, no cambia). Ganar da un pequeño premio a tu carrera
 * (fama, moral, algo de dinero), y jugar días seguidos crea una racha con premios mayores. El resultado es una tarjeta compartible
 * («Reto del día #214: ganado, racha de 7»). Todo en código, sin IA, sin imágenes de pago.
 *
 * Flags: dc_last (número de día del último reto jugado), dc_opt (opción elegida), dc_win (true/false), dc_streak, dc_best, dc_wins, dc_played.
 */
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";

type Flags = Record<string, string | boolean>;

export interface ChallengeOption {
  id: "a" | "b" | "c";
  label: string;
  subtitle: string;
  /** Probabilidad base de que salga bien (antes de tu nivel). */
  chance: number;
  win: string;
  lose: string;
}

export interface Challenge {
  day: number;
  key: string;
  stage: string;
  title: string;
  setup: string;
  options: ChallengeOption[];
}

interface Ctx {
  name: string;
  rival: string;
  city: string;
  coach: string;
}

const RIVALS = ["Atlético Valdemar", "Racing de Ribera", "Unión Costa Verde", "Real Sierra Alta", "Deportivo Montealto", "CD Peña Blanca", "Athletic de la Vega", "Sporting Llanura"];
const CITIES = ["Valdemar", "Ribera", "Costa Verde", "Sierra Alta", "Montealto", "Peña Blanca", "la Vega", "Llanura"];
const COACHES = ["Don Ernesto", "el míster Alcalde", "Quique Villar", "el profe Castaño", "Pablo Iriarte"];

interface Tpl {
  key: string;
  stage: string;
  title: string;
  setup: (c: Ctx) => string;
  options: (c: Ctx) => [ChallengeOption, ChallengeOption, ChallengeOption];
}

const o = (id: "a" | "b" | "c", label: string, subtitle: string, chance: number, win: string, lose: string): ChallengeOption => ({ id, label, subtitle, chance, win, lose });

const TEMPLATES: Tpl[] = [
  {
    key: "penalti-89",
    stage: "Final de Copa · minuto 89",
    title: "El penalti de la final",
    setup: (c) => `Empate a uno ante el ${c.rival}. Penalti en el minuto 89 y el balón, de pronto, es tuyo. Los once mil que han venido a verte guardan silencio como si respiraran todos a la vez. El portero rival, muy joven, no te quita los ojos de encima. ${c.name}, tienes diez segundos.`,
    options: (c) => [
      o("a", "Fuerte y a la escuadra", "Todo o nada", 0.5, `La pelota entra rozando el palo, a una velocidad que el portero ni ve. El estadio se viene abajo. Besas el escudo con los ojos cerrados y ya no recuerdas nada más.`, `Te sale demasiado cerca del palo y se va fuera por medio palmo. Te quedas de rodillas. El portero ni se mueve. El silencio duele más que el grito.`),
      o("b", "Raso y colocado a la derecha", "El camino seguro", 0.68, `Lo has ensayado cien veces. El portero se tira bien y llega tarde. Gol. Corres a abrazarte con el banquillo.`, `El portero adivina el lado y atrapa con las dos manos. Te quedas mirando el suelo mientras el estadio respira.`),
      o("c", "Una Panenka como en las películas", "La locura", 0.35, `Esperas a que se tire, picas la pelota y la ves caer en el centro con una lentitud eterna. Hay una ola de silencio y de pronto el rugido más grande de tu vida. Dicen que ha sido el penalti del año.`, `El portero, listísimo, espera. La pelota llega a sus manos como una paloma torpe. Se ríen en las gradas rivales. Mañana serás meme.`),
    ],
  },
  {
    key: "tanda",
    stage: "Semifinal · tanda de penaltis",
    title: "El quinto lanzador",
    setup: (c) => `${c.coach} te mira a la cara en el círculo central: «Eres el quinto». Se decide la tanda ante el ${c.rival}, 4-4, y si marcas, a la final. Tienes las piernas de plomo y las manos sudadas. El árbitro pita y camináis, tú y el portero, como dos boxeadores.`,
    options: () => [
      o("a", "Mirar al portero a los ojos hasta que se mueva", "Guerra psicológica", 0.58, `Aguantas la mirada, él parpadea, y pones la pelota en el otro lado. Gol. Tus compañeros se te echan encima y no vuelves a tocar el suelo en diez minutos.`, `Lo miras tanto que se te olvida a dónde ibas a tirar. La pelota sale blanda y centrada. Te cubres la cara con la camiseta.`),
      o("b", "Cerrar los ojos y pegarle con rabia", "Instinto", 0.42, `La pelota sale como una bala. Abres los ojos justo a tiempo de ver cómo la red se hincha. ¡Final!`, `La pelota se va a las nubes. Tu cuerpo no te ha obedecido. Alguien te pasa el brazo por el hombro y no dice nada.`),
      o("c", "Respirar, contar hasta tres y colocarla raso", "Cabeza fría", 0.66, `Cuentas hasta tres mirando el césped. El portero se tira al lado que no es. Gol, sin dramatismo, con una paz absoluta.`, `Todo sale como lo has planeado menos la pelota, que se estrella en el palo. Fallas con la conciencia tranquila, que es poco consuelo.`),
    ],
  },
  {
    key: "falta-descuento",
    stage: "Derbi · descuento",
    title: "La falta en el descuento",
    setup: (c) => `Minuto 93, 1-1 en el derbi de ${c.city}. Falta a veinticinco metros, algo escorada. Hay cuatro especialistas en el campo y todos te miran a ti. «Tuya», dice el capitán. La barrera se estira diez centímetros por encima de lo reglamentario y el árbitro lo sabe.`,
    options: () => [
      o("a", "Rosca por encima de la barrera al segundo palo", "Lo clásico", 0.45, `La pelota sube, se queda en el aire un segundo de más y cae como un paracaídas junto al palo. El portero, que ya sabía que no llegaba, se queda de pie. Gol de leyenda.`, `Se te va un poco larga: el balón pasa rozando el larguero y la grada gime. El árbitro pita el final.`),
      o("b", "Raso por debajo de la barrera, rápido", "Picardía", 0.4, `Aprovechas que los de la barrera saltan y pasas la pelota por debajo. Entra pegada al palo y el portero llega a rozarla. Locura.`, `Los de la barrera no saltan y el balón se queda en sus piernas. El rebote sale lejos y el partido acaba.`),
      o("c", "Pasarla corta a un compañero para ganar un córner", "Seguro", 0.62, `La pelota llega a un compañero, que centra de primeras. Un cabezazo en el área, un rebote, otro, y gol. A veces ganas sin que te toque.`, `El córner no sale y el rival despeja largo. Es el final. Ni mérito ni culpa: solo un partido más.`),
    ],
  },
  {
    key: "uno-contra-uno",
    stage: "Liga · minuto 78",
    title: "Solo ante el portero",
    setup: (c) => `Un pase largo te deja solo ante el portero del ${c.rival}, que sale a medio camino con los brazos abiertos. Tienes tres segundos y diez ideas. Oyes a tu lado la respiración de un defensa que no llega. Si marcas, cierras el partido.`,
    options: () => [
      o("a", "Regatearle y empujarla a puerta vacía", "Elegancia", 0.5, `Lo amagas, él se lanza a por la nada y tú, con una sonrisa, metes la pelota a puerta vacía. La grada rompe en risas y aplausos.`, `El regate sale largo y el portero te quita la pelota de los pies. La grada rival lo celebra como un gol.`),
      o("b", "Picarla por encima de su cabeza", "Con arte", 0.48, `La pelota sube y baja justo en el momento en que él se da la vuelta. Es la clase de gol que se enseña en las escuelas.`, `La pelota va alta, demasiado. Pasa sobre el larguero con una lentitud insultante.`),
      o("c", "Disparar fuerte al primer palo", "Directo", 0.6, `Un cañonazo seco, a la altura de la cadera. El portero apenas llega a mover las manos. Gol.`, `El portero se agranda y le da con la pierna. La pelota se va a córner.`),
    ],
  },
  {
    key: "entrevista",
    stage: "Tras la derrota · zona mixta",
    title: "La pregunta capciosa",
    setup: (c) => `Acabáis de caer ante el ${c.rival} con un penalti dudoso en el último minuto. En la zona mixta te cercan seis micrófonos. Uno, el más insistente, pregunta: «¿El árbitro os ha robado el partido?». Hay cámaras y no hay salida de emergencia.`,
    options: (c) => [
      o("a", "Asumir la derrota y no hablar del árbitro", "Madurez", 0.72, `«Hemos perdido porque ellos han sido mejores en los últimos diez minutos». Ningún titular explosivo, pero un montón de elogios: «Qué adulto».`, `Lo que dices es sensato, pero tu cara lo desmiente. Al día siguiente, el titular es «${c.name} sonríe como si no le importara».`),
      o("b", "Decir lo que piensas sobre el árbitro", "Sin filtros", 0.3, `Dices lo que piensas, con datos y sin gritar. Medio país opina lo mismo y te lo agradece. La federación guarda silencio.`, `Se te va la lengua y llega la multa de la federación. La prensa se divierte, el club no tanto.`),
      o("c", "Una broma que desactive la bomba", "Humor", 0.5, `«Si el árbitro quería ver el partido, que se compre una entrada». Se ríe toda la sala y el mal rato desaparece.`, `La broma suena fatal fuera de contexto. Alguien la recorta y la sube sin audio. Mañana, mal día.`),
    ],
  },
  {
    key: "oferta",
    stage: "Mercado · último día",
    title: "La oferta que no se repite",
    setup: (c) => `Es el último día del mercado. Un club de otra liga ofrece más dinero, más minutos y un proyecto nuevo. Tu club, ${c.coach} a la cabeza, te ofrece cariño, la capitanía y una renovación sin sorpresas. Tu representante lleva una hora con el móvil en la oreja. El tiempo corre.`,
    options: () => [
      o("a", "Firmar con el nuevo club", "Un salto al vacío", 0.5, `Sales de allí con una maleta nueva y una llamada tuya a tu madre. La primera semana lo pasas mal, la segunda mejor, y a la tercera ya eres titular. Acertaste.`, `La adaptación es dura: idioma, ciudad, vestuario. Acabas añorando lo que dejaste. No es un error, pero cuesta.`),
      o("b", "Quedarte y renovar", "Lealtad", 0.7, `La afición te recibe con una pancarta enorme. La renovación es mejor de lo que esperabas y la capitanía llega antes de lo previsto.`, `Te quedas, y en seis meses el club ficha a alguien en tu puesto. Quizá debiste irte, o quizá no.`),
      o("c", "Pedir una hora más para decidir", "Ganar tiempo", 0.45, `Esa hora lo cambia todo: el club mejora su oferta y el otro acepta dejarte decidir sin presión. Ganas por las dos vías.`, `Pasa la hora, el mercado cierra y las dos ofertas se evaporan. Te quedas con una renovación peor. Eso pasa por jugar con el reloj.`),
    ],
  },
  {
    key: "lesion-companero",
    stage: "Pretemporada · vestuario",
    title: "El compañero que juega lesionado",
    setup: (c) => `A diez minutos del partido clave, ${c.coach} te llama aparte. «Fulano está tocado, pero dice que juega. Tú eres el capitán del día. Dime qué hacemos». Fulano, desde el otro lado del vestuario, hace el gesto de que está bien con una cara que dice lo contrario.`,
    options: () => [
      o("a", "Dejarle jugar, es su decisión", "Confiar", 0.45, `Juega los noventa minutos y marca un gol que no olvidará nadie. Su cara después del partido, de puro alivio, es una foto para enmarcar.`, `A los veinte minutos se hace daño de verdad y sale en camilla. Pasarás semanas pensando si debiste decir otra cosa.`),
      o("b", "Sacarle del once y hablar con él", "Prudencia", 0.75, `Se enfada un par de horas y después te lo agradece: «Tenías razón». El equipo gana sin él y la unión del grupo sube un escalón.`, `Se lo toma mal y la relación se enfría. Aunque tenías razón, a veces tener razón sale caro.`),
      o("c", "Pactar que juegue cuarenta y cinco minutos", "Término medio", 0.6, `Cuarenta y cinco minutos perfectos. En el descanso, el fisio le saca del campo y el equipo gana igual. Todos contentos, nadie herido.`, `A los cuarenta minutos se resiente y no se atreve a decirlo. El equipo juega con diez en la práctica.`),
    ],
  },
  {
    key: "ultimo-partido-idolo",
    stage: "Homenaje · último partido de un ídolo",
    title: "El penalti del ídolo",
    setup: (c) => `Es el último partido de la leyenda del club, ${c.coach} lo ha avisado: va a jugar quince minutos y el estadio entero lo sabe. En el minuto 80 hay penalti y la grada pide que lo tire él. Tú eres el lanzador habitual. Él te mira, tú lo miras, y la grada murmura.`,
    options: () => [
      o("a", "Cederle el penalti", "Un gesto bonito", 0.6, `Lo tira y marca, y se echa a llorar sin vergüenza. El estadio se pone en pie. Es la foto del año. A ti te cae una ovación que te acompañará siempre.`, `Lo tira y lo para el portero, y el estadio, en lugar de abuchear, le aplaude más fuerte. Él te da un abrazo. Fue bonito igual.`),
      o("b", "Tirarlo tú y dedicarle el gol", "Profesional", 0.65, `Marcas, corres a abrazarle y le dedicas el gol. Él, con los ojos mojados, te dice al oído: «Ahora es tuyo».`, `Fallas. La grada se queda fría y tu ídolo te consuela con una frase: «A mí me pasó cuatro veces». Tampoco estuvo mal.`),
      o("c", "Pedirle que lo tire con otro compañero al lado", "Un pacto", 0.5, `Lo tiráis a medias: tú preparas, él chuta. El gol es tan bonito que parece ensayado. Los fotógrafos no paran.`, `La jugada se enreda y el árbitro pita falta en ataque. Salís del paso con una sonrisa.`),
    ],
  },
  {
    key: "var",
    stage: "Champions · minuto 88",
    title: "El gol que anula el VAR",
    setup: (c) => `Has marcado en el minuto 88 ante el ${c.rival} y has celebrado como nunca. Pero el árbitro se lleva el dedo a la oreja: revisan el gol. El estadio, de pronto, cuenta los segundos. Tus compañeros te miran, tú miras al árbitro, y el árbitro mira la pantalla.`,
    options: () => [
      o("a", "Quedarte quieto y sin protestar", "Calma", 0.55, `El árbitro valida el gol tras un minuto interminable. Cuando el estadio vuelve a rugir, ya habías cerrado los ojos. Tu calma se hace viral.`, `Anulan el gol por una milimétrica posición. Te quedas inmóvil, con las manos en la cintura. Ni una queja. La prensa lo aplaude igual.`),
      o("b", "Pedir que lo revisen con calma, con educación", "Diálogo", 0.5, `El árbitro, agradecido, se toma su tiempo. El gol es válido. Cuando lo anuncia, te guiña un ojo a distancia.`, `El árbitro no te hace caso. Le has pedido educadamente que se tome su tiempo y ha decidido que no. Gol anulado.`),
      o("c", "Seguir celebrando como si nada", "Chulería", 0.3, `Tu actitud descoloca al árbitro, que valida el gol. «Ese chico tiene un par de huevos», dicen en la grada. Ha sido pura suerte.`, `El árbitro te enseña la amarilla por provocar. Gol anulado y tarjeta. Te vuelves a casa con la lección aprendida.`),
    ],
  },
  {
    key: "mensaje-ex-entrenador",
    stage: "Vida · un mensaje a medianoche",
    title: "El mensaje de tu primer entrenador",
    setup: (c) => `Son las doce y media y te llega un mensaje de ${c.coach}, el que te hizo debutar en el barrio con doce años. «Estoy en el hospital, nada grave, pero me gustaría verte. Mañana tienes partido, lo sé, no te preocupes». Dudas con el móvil en la mano.`,
    options: () => [
      o("a", "Ir a verle esta noche", "Lo primero es lo primero", 0.7, `Llegas a las dos de la mañana con una bolsa de fruta y el pelo revuelto. Se ríe, os abrazáis, hablan del primer partido. Al día siguiente juegas cansado, pero con el corazón lleno.`, `Llegas, pero el partido del día siguiente te sale flojo. Aun así, no cambiarías la visita por nada.`),
      o("b", "Llamarle ahora y verle después del partido", "Equilibrio", 0.6, `Habláis una hora por teléfono y al día siguiente marcas un gol que le dedicas desde el centro del campo. Lo ve desde la cama del hospital y llora de orgullo.`, `La llamada es larga y duermes mal. Al día siguiente, el partido te cuesta, pero cuando acaba, vas directo a verle.`),
      o("c", "Responderle por mensaje y descansar", "Cabeza", 0.4, `Le mandas cuatro frases de cariño y duermes. El partido sale perfecto, pero la sensación de haberte quedado en el sofá te acompaña.`, `Duermes mal con la conciencia a medias. El partido es regular y lo que más recuerdas es no haber ido.`),
    ],
  },
  {
    key: "barro",
    stage: "Copa · campo embarrado",
    title: "El campo es una piscina",
    setup: (c) => `Ha llovido toda la noche y el campo del ${c.rival} es un barrizal. Los balones largos se quedan cortos, el césped se come las piernas. ${c.coach} te pregunta antes de salir cómo quieres jugarlo. Se nota que no tiene ni idea de qué decir.`,
    options: () => [
      o("a", "Jugar largo y pelear cada segunda jugada", "Rudo", 0.55, `Os adaptáis mejor que ellos. El partido es una batalla y la ganáis con un gol de rebote en el minuto 60. Terminas negro de barro y feliz.`, `La estrategia no funciona: perdéis el centro del campo y el rival os contiene. Pierdes diez balones largos.`),
      o("b", "Insistir en jugar por abajo, con calma", "Terco", 0.4, `Os creéis más que ellos y cuajáis un fútbol precioso en medio del barro. Gol de ensueño y afición encantada.`, `La pelota se frena, perdéis dos balones en salida y os marcan. Tu empeño en jugar bonito te cuesta caro.`),
      o("c", "Defender atrás y esperar un contraataque", "Paciencia", 0.6, `Os replegáis, aguantáis y en un contraataque a quince segundos del final marcáis el único gol del partido.`, `El rival no se cansa de atacar y acaba metiendo el gol del desempate. Te acuerdas de tus botas llenas de lodo.`),
    ],
  },
  {
    key: "cambio-posicion",
    stage: "Entrenamiento · propuesta del míster",
    title: "Te piden jugar en otro sitio",
    setup: (c) => `${c.coach} te llama al despacho: «Necesito que juegues de otra cosa. Dos semanas, con la espalda cubierta. Te veo ahí». Es un puesto que no te gusta nada, pero el equipo lo necesita y hay un partido grande el domingo. Te pide que decidas antes de salir del despacho.`,
    options: (c) => [
      o("a", "Aceptar sin rechistar", "Equipo ante todo", 0.65, `Juegas de lo que te pide y descubres cosas de ti mismo que no conocías. El domingo haces el mejor partido de la temporada. ${c.coach} sonríe sin mirarte.`, `El puesto te queda grande. Cumples, pero sin brillar. Te quedas con un aprendizaje, no con un partido.`),
      o("b", "Aceptar pero poniendo condiciones", "Negociador", 0.55, `Pactas dos partidos y que te dejen elegir entre dos. El míster lo respeta, tú rindes y, de paso, ganas puntos de confianza.`, `Te dice que no está para negociaciones. Te sientas en el banquillo un par de semanas. Aprendes lo del tono.`),
      o("c", "Decir que no y pedir otra solución", "Con firmeza", 0.4, `Tu firmeza gusta: el míster busca otra solución y te quedas donde mejor rindes. Una conversación incómoda, pero con final feliz.`, `Se queda con mala cara y te mira distinto en los entrenamientos. Has ganado el pulso y perdido el cariño.`),
    ],
  },
  {
    key: "rueda-fichaje",
    stage: "Presentación · primer día",
    title: "La primera pregunta del club nuevo",
    setup: (c) => `Es tu presentación. Hay trescientos aficionados en el estadio, tu camiseta nueva todavía huele a planchado y el presidente te ha dado un balón firmado. Un niño, desde el fondo, grita: «¡Dinos algo en el micrófono!». El jefe de prensa palidece. Todo el estadio se vuelve hacia ti. ${c.name}, este es tu momento.`,
    options: () => [
      o("a", "«Vengo a ganarlo todo con vosotros»", "Ambición", 0.5, `La grada ruge. «¡Todo, todo!», corean. Vas a tener que cumplirlo, pero esa tarde eres el rey.`, `La frase suena grande y vacía. Alguien en la grada murmura «ya veremos» y el eco llega hasta la tertulia de la noche.`),
      o("b", "«Vengo a trabajar y a aprender de los mejores»", "Humildad", 0.7, `La afición aplaude la sencillez. El capitán, en el palco, asiente despacio. Primera victoria sin jugar.`, `Suena demasiado correcto, un poco soso. Nadie protesta, pero la grada esperaba otra cosa.`),
      o("c", "Besar el escudo y no decir nada", "Gesto", 0.6, `Sin palabras, con el escudo entre los labios, se hace un silencio sagrado y después una ovación. Los fotógrafos no paran.`, `El gesto sale forzado y se ve. Aplauden por educación y tú sientes que no era el momento.`),
    ],
  },
];

/* ───────────── El día ───────────── */

const EPOCH = Date.UTC(2026, 0, 1);

/** Número de día de hoy en Madrid (0 = 1 de enero de 2026). Sirve de semilla: el reto es el mismo para todos ese día. */
export function madridDay(now: Date = new Date()): number {
  const s = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" }); // AAAA-MM-DD
  const [y, m, d] = s.split("-").map((n) => parseInt(n, 10));
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86_400_000);
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return h >>> 0;
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;

/** El reto de un día: la misma plantilla y los mismos rivales para todos. Solo el nombre es del jugador. */
export function challengeOfDay(day: number, player: Pick<Player, "last_name" | "nickname">): Challenge {
  // Dos días seguidos nunca repiten plantilla: se baraja por bloques de N días y, si el bloque empieza por la plantilla con la que acabó el anterior, se intercambian las dos primeras.
  const n = TEMPLATES.length;
  const block = Math.floor(day / n);
  const shuffle = (blk: number) => TEMPLATES.map((_, i) => ({ i, k: hash(`dc:${blk}:${i}`) })).sort((x, y) => x.k - y.k).map((x) => x.i);
  const order = shuffle(block);
  if (order[0] === shuffle(block - 1)[n - 1]) [order[0], order[1]] = [order[1], order[0]];
  const idx = order[((day % n) + n) % n];
  const tpl = TEMPLATES[idx];
  const ctx: Ctx = {
    name: displayName(player),
    rival: RIVALS[hash(`dc:rival:${day}`) % RIVALS.length],
    city: CITIES[hash(`dc:city:${day}`) % CITIES.length],
    coach: COACHES[hash(`dc:coach:${day}`) % COACHES.length],
  };
  return { day, key: tpl.key, stage: tpl.stage, title: tpl.title, setup: tpl.setup(ctx), options: tpl.options(ctx) };
}

/* ───────────── Jugarlo ───────────── */

export interface ChallengeState {
  playedToday: boolean;
  win: boolean | null;
  optionId: string | null;
  streak: number;
  best: number;
  wins: number;
  played: number;
  /** Si hoy no juegas, la racha corre peligro (jugaste ayer: la racha sigue viva hasta medianoche). */
  streakAlive: boolean;
}

export function challengeState(player: Pick<Player, "flags">, day: number = madridDay()): ChallengeState {
  const f = (player.flags ?? {}) as Flags;
  const last = f.dc_last !== undefined ? num(f.dc_last) : -99;
  const playedToday = last === day;
  return {
    playedToday,
    win: playedToday ? Boolean(f.dc_win) : null,
    optionId: playedToday ? String(f.dc_opt ?? "") : null,
    streak: last >= day - 1 ? num(f.dc_streak) : 0,
    best: num(f.dc_best),
    wins: num(f.dc_wins),
    played: num(f.dc_played),
    streakAlive: last === day - 1,
  };
}

export function winChance(player: Pick<Player, "media" | "forma">, base: number): number {
  return clamp(base + ((player.media ?? 60) - 70) * 0.004 + ((player.forma ?? 60) - 60) * 0.002, 0.15, 0.9);
}

export interface ChallengeResult {
  win: boolean;
  chance: number;
  text: string;
  streak: number;
  /** Premio ya calculado sobre la carrera. */
  fama: number;
  moral: number;
  rel_aficion: number;
  patrimonio: number;
  streakBonus: string | null;
  flags: Flags;
}

const STREAK_REWARDS: Record<number, { fama: number; rel_aficion: number; patrimonio: number; text: string }> = {
  3: { fama: 1, rel_aficion: 1, patrimonio: 500, text: "Tres días seguidos: tu patrocinador de barrio te regala unas botas." },
  7: { fama: 2, rel_aficion: 2, patrimonio: 2500, text: "Una semana seguida: la afición ya te espera cada día." },
  14: { fama: 3, rel_aficion: 3, patrimonio: 6000, text: "Dos semanas seguidas: un periodista te dedica un reportaje a la constancia." },
  30: { fama: 5, rel_aficion: 5, patrimonio: 20000, text: "Un mes seguido: dicen de ti que no fallas ni a las citas." },
};

export function playChallenge(player: Player, optionId: string, now: Date = new Date()): ChallengeResult | { error: string } {
  const day = madridDay(now);
  const state = challengeState(player, day);
  if (state.playedToday) return { error: "Ya has jugado el reto de hoy. Vuelve mañana." };
  const challenge = challengeOfDay(day, player);
  const opt = challenge.options.find((x) => x.id === optionId);
  if (!opt) return { error: "Esa opción no existe." };
  const chance = winChance(player, opt.chance);
  // Tirada fija para ese día y esa opción: recargar la página no cambia el resultado.
  const roll = (hash(`dc:roll:${player.id}:${day}:${opt.id}`) % 10_000) / 10_000;
  const win = roll < chance;
  const streak = state.streak + 1;
  // Más riesgo, más premio: la opción de menos probabilidad paga más.
  const risk = clamp(0.7 - opt.chance, 0, 0.4);
  const fama = win ? 1 + Math.round(risk * 5) : 0;
  const moral = win ? 3 + Math.round(risk * 6) : -1;
  const patrimonio = win ? 300 + Math.round(risk * 2000) : 0;
  const bonus = STREAK_REWARDS[streak];
  const f = (player.flags ?? {}) as Flags;
  return {
    win,
    chance,
    text: win ? opt.win : opt.lose,
    streak,
    fama: fama + (bonus?.fama ?? 0),
    moral,
    rel_aficion: bonus?.rel_aficion ?? 0,
    patrimonio: patrimonio + (bonus?.patrimonio ?? 0),
    streakBonus: bonus?.text ?? null,
    flags: {
      dc_last: String(day),
      dc_opt: opt.id,
      dc_win: win,
      dc_streak: String(streak),
      dc_best: String(Math.max(num(f.dc_best), streak)),
      dc_wins: String(num(f.dc_wins) + (win ? 1 : 0)),
      dc_played: String(num(f.dc_played) + 1),
    },
  };
}

/** El texto del desenlace ya jugado (para enseñarlo otra vez al volver a la página). */
export function playedText(player: Pick<Player, "flags" | "last_name" | "nickname">, day: number = madridDay()): string | null {
  const s = challengeState(player, day);
  if (!s.playedToday) return null;
  const opt = challengeOfDay(day, player).options.find((x) => x.id === s.optionId);
  if (!opt) return null;
  return s.win ? opt.win : opt.lose;
}

export function shareText(player: Pick<Player, "flags" | "last_name" | "nickname">, day: number = madridDay()): string | null {
  const s = challengeState(player, day);
  if (!s.playedToday) return null;
  const c = challengeOfDay(day, player);
  const opt = c.options.find((x) => x.id === s.optionId);
  return `Reto del día #${day + 1} de Beyond 90: «${c.title}». Elegí «${opt?.label ?? "mi jugada"}» y ${s.win ? "salió bien ✅" : "salió mal ❌"}. Racha: ${s.streak} ${s.streak === 1 ? "día" : "días"}. ¿Qué harías tú?`;
}
