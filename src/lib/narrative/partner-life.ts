/**
 * LA VIDA EN PAREJA, DE VERDAD. Antes tu pareja era una bandera y unas cuantas escenas únicas perdidas entre cientos
 * del banco: pasaban temporadas enteras sin que apareciera más que para subir una foto. Ahora, con pareja, cada pocos
 * turnos toca algo con ella: una cena, un día duro, una visita de su madre, un cumpleaños, una conversación pendiente…
 * Lo que sale depende de CÓMO vais (la relación 0-100), de la ciudad donde vivís y de cómo le sienta, de cómo estás tú
 * (ánimo, forma, lesión), de si hay hijos y del momento del año. Todo en código, sin llamadas a la IA.
 *
 * Cada escena mueve la relación con `pareja_delta` (lo consume stepPartner) y deja anotadas las últimas que salieron
 * (`pa_recent`) para no repetir y, si es de las que solo pasan una vez, `pa_done_<clave>`.
 */
import type { EventOption, GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { cityOfClub } from "@/lib/narrative/cities";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";
import { cityStance, partnerFirstName, partnerOf, partnerRel, type CityStance } from "@/lib/narrative/partner";
import { readChildren } from "@/lib/narrative/children";

type Flags = Record<string, string | boolean>;

/** Turnos mínimos entre dos escenas de pareja. */
const GAP = 3;

interface Ctx {
  name: string;
  full: string;
  city: string;
  club: string;
  rel: number;
  stance: CityStance;
  kid: string | null;
  kids: number;
  married: boolean;
  injured: boolean;
  moral: number;
  forma: number;
  fama: number;
  media: number;
  age: number;
  turn: number;
  money: number;
}

type Opt = Omit<EventOption, "id"> & { id?: string };

interface Tpl {
  key: string;
  /** Solo puede pasar una vez por carrera. */
  once?: boolean;
  weight?: number;
  when?: (c: Ctx) => boolean;
  title: (c: Ctx) => string;
  desc: (c: Ctx) => string;
  opts: (c: Ctx) => Opt[];
  milestone?: string;
}

const eur = (n: number) => `${Math.round(n).toLocaleString("es")} €`;
const d = (n: number) => String(n);

const TEMPLATES: Tpl[] = [
  {
    key: "cena-casa",
    title: (c) => `Cena en casa con ${c.name}`,
    desc: (c) => `Llegas del entrenamiento con las piernas pesadas y la cabeza en otro sitio. ${c.name} ha puesto la mesa a su manera: dos velas, un mantel que no combina con nada y una pasta que huele mejor que cualquier menú del club. «Hoy no se habla de fútbol», dice. Lo decía en serio.`,
    opts: (c) => [
      { label: "Cocinar tú el postre y dejarte llevar", subtitle: "Una noche sin fútbol", consequences: { moral: 4, forma: 1, flags: { pareja_delta: d(4) } }, outcomeText: `El postre te sale regular, la noche te sale perfecta. ${c.name} se ríe de tu cara de concentración con la batidora y, por una vez, el móvil se queda apagado en el cajón.` },
      { label: "Contarle cómo te ha ido el día de verdad", subtitle: "Abrirte un poco", consequences: { moral: 3, flags: { pareja_delta: d(5) } }, outcomeText: `Le cuentas lo que no cuentas a nadie: las dudas, el míster, el miedo a fallar. ${c.name} no te interrumpe ni una vez. Cuando acabas, te coge la mano. «Gracias por decírmelo».` },
      { label: "Cenar con el partido de fondo", subtitle: "Un ojo en la tele", consequences: { moral: 1, flags: { pareja_delta: d(-2) } }, outcomeText: `Tu ojo se te va a la pantalla en cada jugada. ${c.name} recoge la mesa sin decir nada y, al pasar, apaga la tele. No dice nada. Con eso ya ha dicho lo suficiente.` },
    ],
  },
  {
    key: "domingo-libre",
    title: () => "Un domingo sin nada que hacer",
    desc: (c) => `Es raro: ni entrenamiento, ni viaje, ni compromiso. Un domingo entero para ti y para ${c.name}. Ella ya ha sacado dos planes de la manga: una excursión a las afueras de ${c.city} y una tarde de sofá y manta.`,
    opts: (c) => [
      { label: "La excursión: aire, caminar y comer en un pueblo", subtitle: "Plan de los dos", consequences: { moral: 5, forma: 2, flags: { pareja_delta: d(5) } }, outcomeText: `Acabáis en un pueblo con una plaza sin turistas y un camarero que no sabe quién eres. ${c.name} no se ríe tanto desde hace meses. Tú tampoco.` },
      { label: "El sofá y la manta", subtitle: "Descanso de verdad", consequences: { moral: 3, forma: 3, flags: { pareja_delta: d(3) } }, outcomeText: `Veis una serie que ninguno de los dos entiende y os quedáis dormidos a la vez. A las siete de la tarde sois dos personas distintas.` },
      { label: "Aprovechar para entrenar un extra", subtitle: "Un poco más de trabajo", consequences: { forma: 2, moral: -1, flags: { pareja_delta: d(-4) } }, outcomeText: `Sales a correr con la mejor de tus excusas. ${c.name} te ve cerrar la puerta y vuelve al sofá sola. Cuando regresas, el domingo ya ha pasado.` },
    ],
  },
  {
    key: "te-nota-apagado",
    when: (c) => c.moral < 58 || c.forma < 50,
    title: (c) => `${c.name} te nota apagado`,
    desc: (c) => `No has dicho ni diez palabras en toda la cena, y ${c.name} lo ha contado. Deja los cubiertos, te mira y pregunta sin rodeos: «¿Qué te pasa?». Sabes que no vale un «nada».`,
    opts: (c) => [
      { label: "Contárselo todo, sin guardarte nada", subtitle: "Dejar que te cuide", consequences: { moral: 6, flags: { pareja_delta: d(6) } }, outcomeText: `Sale todo de golpe, como el agua de una presa. ${c.name} escucha, asiente y al final solo dice: «Vamos a pasarlo juntos». No arregla nada, pero cambia el peso de todo.` },
      { label: "Quitarle importancia: «Cosas del trabajo»", subtitle: "No cargarla con tus problemas", consequences: { moral: -2, flags: { pareja_delta: d(-5) } }, outcomeText: `Ella no insiste. Esa es precisamente la peor señal. Duerme de lado, con la espalda hacia ti, y tú te quedas mirando el techo.` },
      { label: "Hacerle reír para cambiar de tema", subtitle: "Humor en vez de palabras", consequences: { moral: 2, flags: { pareja_delta: d(1) } }, outcomeText: `Logras que se ría con una imitación del míster. Funciona esta noche. ${c.name} te mira un segundo más de lo normal: sabe que le has esquivado la pregunta.` },
    ],
  },
  {
    key: "racha-celebrar",
    when: (c) => c.moral >= 75 && c.forma >= 70,
    title: () => "Una buena racha que se celebra en casa",
    desc: (c) => `Los goles caen, el míster sonríe y hasta la prensa se ha puesto amable. ${c.name} lo ha notado antes que nadie: «Estás insoportable de contento», te dice, claramente encantada. Quiere celebrarlo, pero a su manera.`,
    opts: (c) => [
      { label: "Invitarla a cenar fuera, sin móviles", subtitle: `${eur(250)}`, consequences: { patrimonio: -250, moral: 5, flags: { pareja_delta: d(5) } }, outcomeText: `Una mesa pequeña en un restaurante donde nadie te pide fotos. ${c.name} pide postre sin mirar los precios y brinda por «el chico que no se cree lo bueno que es».` },
      { label: "Dedicarle el próximo gol", subtitle: "Un gesto público", consequences: { moral: 4, fama: 2, rel_aficion: 1, flags: { pareja_delta: d(4) } }, outcomeText: `Se lo dices al oído antes de salir al campo. Cuando llega el gol, el tuyo, haces un corazón con las manos hacia la grada. ${c.name}, en el palco, se tapa la cara de vergüenza y de orgullo.` },
      { label: "Salir con los del vestuario a celebrarlo", subtitle: "Noche de equipo", consequences: { moral: 4, rel_vestuario: 3, flags: { pareja_delta: d(-3) } }, outcomeText: `La noche es larga y alegre. Vuelves cuando ya se ha dormido, con una sonrisa y un poco de culpa. A la mañana siguiente, el desayuno es más silencioso de lo normal.` },
    ],
  },
  {
    key: "ciudad-echa-de-menos",
    when: (c) => c.stance === "reacia",
    title: (c) => `${c.name} echa de menos su casa`,
    desc: (c) => `${c.city} es una ciudad preciosa. Eso dice ${c.name} cada vez que alguien le pregunta, pero a ti no te lo dice: a ti te mira por la ventana y suspira. Hoy ha pasado una hora al teléfono con su madre y tiene los ojos hinchados.`,
    opts: (c) => [
      { label: "Organizar un viaje para que vea a su familia", subtitle: `${eur(600)}`, consequences: { patrimonio: -600, moral: 3, flags: { pareja_delta: d(6) } }, outcomeText: `Le compras los billetes sin decir nada y se los enseñas por la noche. ${c.name} se pone a llorar y a reír a la vez. «No me lo esperaba».` },
      { label: "Pedirle paciencia: «Es solo un tiempo»", subtitle: "Sin ofrecer nada concreto", consequences: { moral: -2, flags: { pareja_delta: d(-4) } }, outcomeText: `«Un tiempo». Ella repite la frase despacio y no dice nada más. Sabéis los dos lo largo que puede ser un tiempo.` },
      { label: "Invitar a su familia a pasar unos días aquí", subtitle: "Que la casa huela a casa", consequences: { moral: 4, patrimonio: -300, flags: { pareja_delta: d(5) } }, outcomeText: `Llegan con maletas de comida y de refranes. La casa se llena de ruido y de olor a guiso. ${c.name} está radiante, como si de pronto ${c.city} fuera su sitio.` },
    ],
  },
  {
    key: "ciudad-feliz",
    when: (c) => c.stance === "encantada",
    weight: 0.7,
    title: (c) => `${c.name} ya tiene su rincón en ${c.city}`,
    desc: (c) => `Te lo cuenta con la emoción de quien ha descubierto un secreto: un café pequeño donde ya la conocen, una librería con silla para leer y un mercado donde le guardan lo mejor. ${c.name} se ha hecho dueña de un trocito de ${c.city} y quiere enseñártelo.`,
    opts: (c) => [
      { label: "Ir con ella un sábado por la mañana", subtitle: "Que te lo enseñe", consequences: { moral: 5, flags: { pareja_delta: d(5) } }, outcomeText: `Te lleva de la mano por calles que no sabías que existían. Los del café te ponen el cortado sin preguntar. Por primera vez, ${c.city} te parece también tuya.` },
      { label: "Decirle que está genial, pero que hoy no puedes", subtitle: "Agenda apretada", consequences: { flags: { pareja_delta: d(-2) } }, outcomeText: `Ella sonríe, comprensiva, y guarda el entusiasmo para otro día. La próxima vez que habla del sitio, ya no lo hace con la misma emoción.` },
      { label: "Proponer que vivís allí «de verdad»: más raíces", subtitle: "Pensar en el largo plazo", consequences: { moral: 3, flags: { pareja_delta: d(6) } }, outcomeText: `Lo dices medio en broma y ella te toma en serio. «¿Sabes lo que acabas de decir?». Sí lo sabes. Esa noche habláis de plantas, de una casa con jardín y de un futuro con más detalles.` },
    ],
  },
  {
    key: "su-madre-visita",
    title: (c) => `La madre de ${c.name} viene de visita`,
    desc: (c) => `Llega con dos maletas, una bolsa de tortilla y la costumbre de reorganizar la cocina a su gusto. «Solo unos días», dice. Lleva ya tres horas hablando de lo flaco que estás y de cómo tendrías que alimentarte. ${c.name} te mira con los ojos muy abiertos: «Ayúdame».`,
    opts: (c) => [
      { label: "Hacerte el encantador y ganártela", subtitle: "Que te adopte", consequences: { moral: 3, forma: 1, flags: { pareja_delta: d(5) } }, outcomeText: `Le pides la receta de la tortilla y te dedica quince minutos de explicación con gestos. Al irse, te da un abrazo de oso: «Cuídala». Esa frase vale más que cualquier titular.` },
      { label: "Escaparte «por el entrenamiento»", subtitle: "Dejarla sola con el tema", consequences: { forma: 1, flags: { pareja_delta: d(-3) } }, outcomeText: `Sales con la bolsa de deporte como quien huye de un incendio. ${c.name} te manda un mensaje con una sola palabra: «Cobarde». Pero con un emoji que sonríe.` },
      { label: "Llevaros a las dos a comer por ahí", subtitle: `${eur(180)}`, consequences: { patrimonio: -180, moral: 3, flags: { pareja_delta: d(4) } }, outcomeText: `El camarero te reconoce y ella lo disimula con orgullo de madre. Cuando llega la cuenta, insiste en pagar. Tú le dejas ganar, porque hay batallas que no se ganan.` },
    ],
  },
  {
    key: "cumple-ella",
    once: true,
    title: (c) => `El cumpleaños de ${c.name}`,
    desc: (c) => `Faltan dos días y todavía no has decidido nada. ${c.name} jura que no quiere regalos, que con una cena sencilla basta. Y tú sabes lo que significa un «no quiero nada» dicho con esa cara.`,
    opts: (c) => [
      { label: "Prepararle una sorpresa con sus amigas", subtitle: `${eur(500)}`, consequences: { patrimonio: -500, moral: 5, flags: { pareja_delta: d(8) } }, outcomeText: `Aparecen todos con globos en un local que has llenado de luces. ${c.name} se queda en la puerta, con la mano en la boca. «¿Cuánto tiempo llevabas planeándolo?». «Dos días, pero me ha costado años de nervios».` },
      { label: "Regalarle algo caro: una joya", subtitle: `${eur(2200)}`, consequences: { patrimonio: -2200, moral: 3, flags: { pareja_delta: d(5) } }, outcomeText: `Abre la caja con una sonrisa educada que se va ensanchando. Le queda perfecta. «Es demasiado», dice, y se la pone sin quitársela en toda la noche.` },
      { label: "Una carta escrita a mano y una cena sencilla", subtitle: "Sin gastar casi nada", consequences: { moral: 5, flags: { pareja_delta: d(7) } }, outcomeText: `Te cuesta tres borradores y media hora de silencio. Cuando ella lee la última línea, no dice nada. Solo se levanta y te abraza. Esa carta, años después, seguirá guardada en el cajón de su mesilla.` },
    ],
  },
  {
    key: "titulares-celos",
    when: (c) => c.fama >= 40,
    title: () => "Un titular que no ha gustado en casa",
    desc: (c) => `Una revista del corazón ha publicado una foto tuya saliendo de un acto, con una desconocida al lado. Es una compañera de trabajo del patrocinador, pero el titular dice otra cosa. ${c.name} ha leído la noticia antes de que despertaras y te espera en la cocina, tranquila de una manera inquietante.`,
    opts: (c) => [
      { label: "Explicárselo con calma, con pruebas", subtitle: "La verdad, sin dramas", consequences: { moral: 2, flags: { pareja_delta: d(4) } }, outcomeText: `Le enseñas el mensaje del patrocinador y el programa del acto. ${c.name} lo lee todo en silencio. «Ya lo sabía», admite. «Pero era bonito oírtelo decir».` },
      { label: "Desmentirlo públicamente con una foto con ella", subtitle: "Una respuesta en redes", consequences: { fama: 2, moral: 3, flags: { pareja_delta: d(5) } }, outcomeText: `Subís una foto de los dos en la cocina, con la revista de fondo y una sonrisa burlona. La afición lo celebra con memes. El titular del día siguiente es ya otro.` },
      { label: "Enfadarte con la prensa y no hablar del tema", subtitle: "Cerrarte", consequences: { moral: -3, reputacion: -1, flags: { pareja_delta: d(-5) } }, outcomeText: `Te encierras en el silencio y en el móvil. ${c.name} entiende que le ocultas algo, aunque no sea así, y esa idea se queda flotando en la casa varios días.` },
    ],
  },
  {
    key: "su-dia-duro",
    title: (c) => `${c.name} ha tenido un día horrible`,
    desc: (c) => `Entra en casa sin decir nada, deja el bolso en el suelo y se sienta en las escaleras. Tiene los zapatos puestos y los ojos rojos. Ha sido uno de esos días en los que todo se tuerce, y tú, esta vez, no estás en la tele ni en el campo: estás aquí.`,
    opts: (c) => [
      { label: "Sentarte a su lado y escuchar, sin consejos", subtitle: "Solo estar", consequences: { moral: 2, flags: { pareja_delta: d(6) } }, outcomeText: `No dices nada durante diez minutos. Luego ella empieza a hablar y no para. Cuando termina, te apoya la cabeza en el hombro: «Gracias por no arreglarlo».` },
      { label: "Prepararle un baño y una cena", subtitle: "Cuidarla un rato", consequences: { moral: 3, flags: { pareja_delta: d(6) } }, outcomeText: `Subes la música suave, enciendes una vela y le preparas lo único que sabes cocinar. ${c.name} sale del baño con otra cara. «Me has devuelto el día».` },
      { label: "Distraerte con el móvil mientras habla", subtitle: "Un descuido", consequences: { flags: { pareja_delta: d(-6) } }, outcomeText: `Te das cuenta demasiado tarde: llevas un minuto mirando una notificación. Ella lo ha visto. «No pasa nada», dice. Y esa frase pesa más que cualquier reproche.` },
    ],
  },
  {
    key: "cita-perdida",
    when: (c) => c.fama >= 20,
    title: () => "Una cita que se queda esperando",
    desc: (c) => `Habíais reservado mesa a las nueve, pero el entrenamiento se alarga, el míster quiere hablar y una televisión te pide diez minutos que son cuarenta. A las nueve y veinte, ${c.name} te manda un mensaje: «Estoy en la puerta». A las nueve y media, otro: «Voy entrando».`,
    opts: (c) => [
      { label: "Salir corriendo y llegar con flores", subtitle: "Disculpas con pétalos", consequences: { patrimonio: -40, moral: 1, flags: { pareja_delta: d(2) } }, outcomeText: `Llegas con el pelo mojado y un ramo que has comprado en una gasolinera. ${c.name} intenta mantener la cara seria. Dura tres segundos.` },
      { label: "Llamarla y pedirle que cenéis otro día", subtitle: "La honestidad primero", consequences: { moral: -2, flags: { pareja_delta: d(-3) } }, outcomeText: `Lo entiende, o dice que lo entiende. La mesa se queda vacía y ella cena sola con una copa de vino que no quería. Al día siguiente no te lo reprocha. Eso es peor.` },
      { label: "Cancelar la entrevista y salir ya", subtitle: "Prioridades", consequences: { fama: -1, moral: 3, flags: { pareja_delta: d(5) } }, outcomeText: `Le dices a la televisión que no puedes y sales sin mirar atrás. ${c.name} no sabe nada de la entrevista; solo sabe que has llegado. Esa noche, la cena sabe distinto.` },
    ],
  },
  {
    key: "escapada-sorpresa",
    once: true,
    when: (c) => c.rel >= 70 && c.money >= 4000,
    title: () => "Una escapada sorpresa",
    desc: (c) => `El míster te ha dado dos días libres y se te ocurre una locura: no decirle nada a ${c.name} y presentarte en casa con una maleta hecha. Billetes, hotel, un restaurante en una azotea y un plan sin horarios. Solo falta decidir si te atreves.`,
    milestone: "Photorealistic candid photo of the photographed man and a woman walking hand in hand along a beach at golden hour, seen from behind, warm light, soft focus on the horizon, no text",
    opts: (c) => [
      { label: "Hacerlo: maleta, billetes y a la aventura", subtitle: `${eur(2500)}`, consequences: { patrimonio: -2500, moral: 8, forma: 2, fama: 1, flags: { pareja_delta: d(10) } }, outcomeText: `Cuando ella abre la puerta, tú sostienes dos billetes y una cara de pánico. ${c.name} tarda un segundo en entenderlo. Después, se pone a hacer la maleta riéndose. Esa noche cenáis en una azotea con vistas a una ciudad que no es la vuestra. Es una de esas noches que se recuerdan toda la vida.` },
      { label: "Una versión pequeña: un fin de semana en un pueblo", subtitle: `${eur(400)}`, consequences: { patrimonio: -400, moral: 5, forma: 1, flags: { pareja_delta: d(6) } }, outcomeText: `Una casa rural, chimenea y mantas. No hay lujo, pero sí tiempo. ${c.name} dice que le gusta más así. Tú sospechas que es verdad.` },
      { label: "Dejarlo para otro momento", subtitle: "Ahora no", consequences: { flags: { pareja_delta: d(-1) } }, outcomeText: `Guardas la idea para «cuando haya hueco». El hueco no llega nunca, y la idea se va apagando sin que nadie la mencione.` },
    ],
  },
  {
    key: "conversacion-pendiente",
    when: (c) => c.rel < 48,
    weight: 2.2,
    title: () => "Una conversación que lleváis semanas aplazando",
    desc: (c) => `Los silencios se han hecho más largos y los «estoy bien» más cortantes. Hoy, en el coche, ${c.name} pone una mano en la radio y la apaga. «Tenemos que hablar. No ahora, esta noche, pero tenemos que hacerlo». Se te hace un nudo en el estómago.`,
    opts: (c) => [
      { label: "Hablar esa noche, sin móvil y sin prisas", subtitle: "Afrontarlo", consequences: { moral: 2, flags: { pareja_delta: d(9) } }, outcomeText: `Habláis hasta las tantas. Hay reproches y silencios, pero también cosas que no os habíais dicho nunca. Al final, ${c.name} apoya la frente en tu hombro: «Quiero seguir intentándolo». Y tú también.` },
      { label: "Pedirle que lo dejéis para después del partido", subtitle: "Ganar tiempo", consequences: { flags: { pareja_delta: d(-5) } }, outcomeText: `Un «después» que se alarga y se alarga. ${c.name} asiente despacio, como quien ya sabía la respuesta. La conversación sigue pendiente, pero ahora pesa más.` },
      { label: "Proponerle una terapia de pareja", subtitle: `${eur(120)} por sesión`, consequences: { patrimonio: -120, moral: -1, flags: { pareja_delta: d(6) } }, outcomeText: `Lo dices con miedo a que suene a rendición. Ella te mira largo rato y dice que sí. En la primera sesión lloráis los dos. Cuando salís, caminas a su lado sin saber si ha ido bien, pero con la certeza de que ha sido real.` },
    ],
  },
  {
    key: "ella-te-ve-en-grada",
    when: (c) => c.forma >= 55 && !c.injured,
    title: (c) => `${c.name} te ve jugar desde la grada`,
    desc: (c) => `Hoy ${c.name} ha venido al estadio. Se sienta en el palco con una bufanda del club que le queda enorme y una cara de no entender el fuera de juego. Antes de salir al campo, la ves en la grada y se te encoge el pecho.`,
    opts: (c) => [
      { label: "Dedicarle un gesto si marcas", subtitle: "Un guiño desde el césped", consequences: { moral: 4, fama: 1, flags: { pareja_delta: d(4) } }, outcomeText: `Cuando entra el gol, buscas su cara entre cuarenta mil. Levantas el dedo hacia el palco. ${c.name} se tapa la boca con las dos manos. La cámara los enfoca a los dos, uno al lado del otro, a distancia.` },
      { label: "Concentrarte: lo que cuenta es el partido", subtitle: "Cabeza fría", consequences: { forma: 1, moral: 1, flags: { pareja_delta: d(0) } }, outcomeText: `No la miras ni una vez. Haces tu partido sin florituras. Después, ella te dice que ha estado muy orgullosa: «Parecías un robot, pero muy guapo».` },
      { label: "Pedirle que no venga más: te pone nervioso", subtitle: "Un poco de espacio", consequences: { moral: -3, flags: { pareja_delta: d(-6) } }, outcomeText: `Lo dices con torpeza. ${c.name} asiente sin discutir, pero la próxima vez que habla del estadio lo hace como quien habla de un sitio al que ya no tiene derecho a entrar.` },
    ],
  },
  {
    key: "su-carrera-oferta",
    once: true,
    when: (c) => c.age >= 21,
    title: (c) => `${c.name} recibe una oferta de trabajo`,
    desc: (c) => `Lleva meses con su proyecto en la cabeza y hoy ha llegado la oportunidad: un trabajo que le gusta, bien pagado, en otra ciudad. «No es una decisión que tome sola», dice. Pero por dentro ya la ha tomado, y tú lo notas.`,
    opts: (c) => [
      { label: "Animarla a aceptarlo y buscar cómo encajarlo", subtitle: "Su carrera también cuenta", consequences: { moral: 2, reputacion: 1, flags: { pareja_delta: d(7) } }, outcomeText: `Le dices que va a ser la mejor del equipo, que ya verás cómo os organizáis. ${c.name} llora un poco, sonríe mucho y te abraza hasta que se te cae el móvil.` },
      { label: "Pedirle que lo piense: tu carrera os mueve", subtitle: "Ir a lo tuyo", consequences: { moral: -2, flags: { pareja_delta: d(-7) } }, outcomeText: `Se lo dices con cuidado, pero no hay manera elegante de decirlo. ${c.name} baja la mirada: «Tu carrera siempre está primero». Y lo peor es que no tiene del todo la razón, pero tampoco del todo la sinrazón.` },
      { label: "Proponer que lo hagáis a distancia unos meses", subtitle: "Una solución difícil", consequences: { moral: 1, flags: { pareja_delta: d(3) } }, outcomeText: `Acordáis un calendario de vuelos, videollamadas y escapadas. Es complicado, pero es vuestro. En la estación, antes de irse, ${c.name} te deja una nota en el bolsillo: «Vuelve rápido».` },
    ],
  },
  {
    key: "mascota",
    once: true,
    when: (c) => !c.kid || c.kids <= 1,
    title: () => "Un cachorro en casa",
    desc: (c) => `${c.name} llega con una caja de cartón y una cara de no haber hecho nada. De dentro sale un llanto agudo. Es un cachorro de ojos enormes que alguien dejó en la puerta de la clínica de su amiga. «Solo hasta que le encontremos casa». Los dos sabéis que no es verdad.`,
    opts: (c) => [
      { label: "Quedároslo: ya tiene nombre", subtitle: "Un miembro más", consequences: { moral: 6, patrimonio: -150, flags: { pareja_delta: d(7), mascota_perro: true } }, outcomeText: `Lo llamáis como un jugador al que ninguno de los dos se atreve a admirar en voz alta. Esa noche el cachorro duerme entre vosotros, y ${c.name} dice, en voz baja, que nunca ha sido tan feliz en un lunes.` },
      { label: "Buscarle una familia con cariño", subtitle: "Ser razonables", consequences: { moral: 1, flags: { pareja_delta: d(-1) } }, outcomeText: `Encontráis una familia con jardín en dos semanas. Cuando se lo lleva, ${c.name} se despide con un nudo en la garganta. Sois razonables. Eso no hace que duela menos.` },
    ],
  },
  {
    key: "decorar-casa",
    once: true,
    when: (c) => c.money >= 3000,
    title: () => "Convertir la casa en un hogar",
    desc: (c) => `Hasta ahora la casa parece un anuncio: muebles buenos, paredes blancas y ni una sola foto. ${c.name} lo dice sin rodeos: «No vivo en un hogar, vivo en un catálogo». Hoy ha traído muestras de pintura, tres revistas y un plan que da miedo.`,
    opts: (c) => [
      { label: "Dejar que decida ella casi todo", subtitle: `${eur(2500)}`, consequences: { patrimonio: -2500, moral: 4, flags: { pareja_delta: d(6) } }, outcomeText: `Una pared verde, otra azul y un sofá que no sabes si es de este siglo. Es completamente distinto de lo que habrías elegido, y por primera vez la casa huele a alguien. ${c.name} no deja de sonreír.` },
      { label: "Decidirlo juntos, discutiendo por cada cosa", subtitle: `${eur(1800)}`, consequences: { patrimonio: -1800, moral: 3, flags: { pareja_delta: d(5) } }, outcomeText: `Discutís por una lámpara durante veinte minutos y acabáis comprando las dos. Lo mejor del día es la pintura en la nariz de ${c.name}.` },
      { label: "Dejarlo como está: «Estoy poco en casa»", subtitle: "Ahorrar", consequences: { moral: -1, flags: { pareja_delta: d(-4) } }, outcomeText: `Se encoge de hombros. En la pared sigue sin haber nada. Con los días, ${c.name} empieza a pasar menos tiempo en casa, y tú notas el eco.` },
    ],
  },
  {
    key: "navidad",
    when: (c) => c.turn === 6,
    title: () => "¿La Navidad con tu familia o con la suya?",
    desc: (c) => `Diciembre, luces en las calles y la eterna pregunta: ¿dónde se cena el día 24? Tu madre ya ha llamado dos veces. La madre de ${c.name} ha llamado tres. Hay un tablero de ajedrez con piezas de sangre y de cariño.`,
    opts: (c) => [
      { label: "Con tu familia, y a la suya en Año Nuevo", subtitle: "Dividir el calendario", consequences: { moral: 3, flags: { pareja_delta: d(2) } }, outcomeText: `La cena es ruidosa y larga. ${c.name} aguanta con una sonrisa fija y una copa que se rellena más de lo que debería. Cuando volvéis a casa, solo dice: «Tu tía no ha parado de preguntarme cuándo nos casamos».` },
      { label: "Con la suya: este año les toca", subtitle: "Un gesto grande", consequences: { moral: 2, flags: { pareja_delta: d(6) } }, outcomeText: `Te reciben como a un hijo. Su padre te enseña una foto de ${c.name} a los ocho años, con un balón de fútbol bajo el brazo. Te lo cuenta con orgullo de abuelo. Es la mejor Navidad en años.` },
      { label: "Los dos solos, con una cena tranquila", subtitle: "Una Navidad vuestra", consequences: { moral: 4, flags: { pareja_delta: d(4) } }, outcomeText: `Dos platos, una vela y una canción que ninguno de los dos admitiría que le gusta. Las llamadas de las madres se responden con cariño y cobardía. Es la cena más tranquila de vuestra vida.` },
    ],
  },
  {
    key: "san-valentin",
    when: (c) => c.turn === 8,
    title: () => "San Valentín en plena temporada",
    desc: (c) => `El calendario no perdona: el 14 de febrero cae en semana de partido. ${c.name} dice que no le importa, que «es un invento comercial». Pero la has visto mirar el escaparate de una pastelería durante demasiado rato.`,
    opts: (c) => [
      { label: "Una cena especial después del partido", subtitle: `${eur(200)}`, consequences: { patrimonio: -200, moral: 4, flags: { pareja_delta: d(5) } }, outcomeText: `Reservas en un sitio que cierra tarde y llegas con el pelo aún húmedo. ${c.name} fingía que le daba igual, y ahora no puede disimular. Pide el postre más caro.` },
      { label: "Una nota escondida en su bolso", subtitle: "Pequeño y bonito", consequences: { moral: 3, flags: { pareja_delta: d(4) } }, outcomeText: `Ella la encuentra en el metro, o en el coche, o en la oficina: cada uno de sus planes tiene una versión. Te manda una foto de la nota con un solo emoji. Basta.` },
      { label: "Olvidarte: se te pasa el día", subtitle: "Un descuido", consequences: { moral: -3, flags: { pareja_delta: d(-8) } }, outcomeText: `Te das cuenta a las once de la noche, mirando el móvil. En la cocina hay una pastelería a medio abrir y una nota que no es para ti. Qué mal día.` },
    ],
  },
  {
    key: "vacaciones-pareja",
    when: (c) => c.turn <= 2 && c.money >= 3000,
    title: () => "¿Adónde vamos de vacaciones?",
    desc: (c) => `Los días libres de verano son pocos y ${c.name} ha traído tres folletos: una isla griega, una casa en la montaña y un viaje a su pueblo. Cada uno viene con su argumentación de abogada.`,
    opts: (c) => [
      { label: "La isla griega: sol y calas", subtitle: `${eur(3200)}`, consequences: { patrimonio: -3200, moral: 7, forma: 2, flags: { pareja_delta: d(7) } }, outcomeText: `Una semana de agua azul y de móvil en modo avión. ${c.name} vuelve más morena y tú más tranquilo. En el avión de vuelta, os cogéis de la mano sin decir nada.` },
      { label: "La casa en la montaña: silencio y chimenea", subtitle: `${eur(900)}`, consequences: { patrimonio: -900, moral: 5, forma: 3, flags: { pareja_delta: d(6) } }, outcomeText: `Sin cobertura, con paseos largos y comida de la tierra. Os reís de tonterías y dormís diez horas seguidas. Volvéis con otra cara.` },
      { label: "Su pueblo: con su familia y sus amigos", subtitle: "Con raíces", consequences: { patrimonio: -300, moral: 4, flags: { pareja_delta: d(7) } }, outcomeText: `Nadie te trata como a un futbolista, y eso es un regalo. ${c.name} está en su sitio, y tú, por primera vez, estás en el suyo.` },
    ],
  },
  {
    key: "ella-te-cuida-lesion",
    when: (c) => c.injured,
    title: (c) => `${c.name} se convierte en tu fisio particular`,
    desc: (c) => `La lesión te tiene en casa más tiempo del que querrías, y ${c.name} ha asumido el cargo de enfermera, fisioterapeuta y psicóloga sin pedir permiso. Te trae el hielo, te lleva a las sesiones y te regaña cuando intentas bajar las escaleras sin muletas.`,
    opts: (c) => [
      { label: "Dejarte cuidar, sin quejas", subtitle: "Aprender a aceptar ayuda", consequences: { moral: 4, flags: { pareja_delta: d(6) } }, outcomeText: `No es fácil dejarse cuidar para alguien que siempre ha sido el fuerte. ${c.name} lo sabe, y no lo menciona nunca. Cuando te quiten las muletas, vas a echar de menos algunas de esas tardes.` },
      { label: "Quejarte de cada cosa y mandar a todos a paseo", subtitle: "Mal humor", consequences: { moral: -2, flags: { pareja_delta: d(-5) } }, outcomeText: `El día que le contestas mal, ${c.name} deja el hielo en la mesa y se va a otra habitación. Pasa una hora hasta que te atreves a pedirle perdón, y otra hasta que lo acepta.` },
    ],
  },
  {
    key: "hijo-resfriado",
    when: (c) => c.kids >= 1,
    title: (c) => `${c.kid ?? "El peque"} tiene fiebre`,
    desc: (c) => `A las tres de la madrugada, ${c.name} te zarandea con suavidad. ${c.kid ?? "El pequeño"} tiene fiebre y llora sin parar. Mañana tienes entrenamiento a las nueve y partido el domingo, pero esas dos cosas, ahora mismo, son nada.`,
    opts: (c) => [
      { label: "Quedarte despierto toda la noche con ellos", subtitle: "Aunque mañana duelan los ojos", consequences: { moral: 4, forma: -3, flags: { pareja_delta: d(7) } }, outcomeText: `Con el pequeño dormido sobre tu pecho, descubres un tipo de cansancio que nunca habías sentido. ${c.name} te mira desde la puerta, sin decir nada. Esa mirada vale la sesión de entrenamiento que perderás.` },
      { label: "Turnos: tú la primera mitad, ella la segunda", subtitle: "Organizarse", consequences: { moral: 2, forma: -1, flags: { pareja_delta: d(4) } }, outcomeText: `Os repartís la noche como un cuadrante. A las siete, el pediatra confirma que es solo un virus. Os reís de los nervios entre dos cafés con cara de zombi.` },
      { label: "Dejárselo a ella: necesitas descansar", subtitle: "Tu cuerpo es tu trabajo", consequences: { forma: 2, moral: -3, flags: { pareja_delta: d(-7) } }, outcomeText: `Te das la vuelta y duermes. Por la mañana, ${c.name} tiene unas ojeras que hablan solas. No dice ni una palabra, y eso es lo que más te cae encima.` },
    ],
  },
  {
    key: "hijo-colegio-fiesta",
    when: (c) => c.kids >= 1 && c.kid !== null,
    title: (c) => `La función de ${c.kid ?? "tu hijo"} en el cole`,
    desc: (c) => `Hay función de fin de curso y ${c.kid ?? "tu hijo"} hace de árbol. Tiene una frase. ${c.name} ya ha ensayado con él cuarenta veces. Coincide con un entrenamiento importante, y el míster ya ha insinuado que «hay quien se va de rositas».`,
    opts: (c) => [
      { label: "Ir a la función y dar explicaciones al míster", subtitle: "Una prioridad clara", consequences: { moral: 6, rel_entrenador: -2, flags: { pareja_delta: d(7) } }, outcomeText: `Ves al pequeño recitar su frase con la seriedad de un actor shakesperiano. ${c.name} te aprieta la mano. El míster te echa la bronca al día siguiente. Y tú, de verdad, no lo cambiarías.` },
      { label: "Entrenar, y verlo en el vídeo", subtitle: "El trabajo es el trabajo", consequences: { forma: 1, rel_entrenador: 2, moral: -3, flags: { pareja_delta: d(-6) } }, outcomeText: `El vídeo es bonito. Pero no es lo mismo. ${c.name} no te lo reprocha: solo te lo manda con un «le hubiera gustado verte allí». Esa frase pesa.` },
    ],
  },
  {
    key: "amigas-vestuario",
    when: (c) => c.fama >= 25,
    title: () => "Una cena con las parejas del vestuario",
    desc: (c) => `El capitán ha organizado una cena con los compañeros y sus parejas. Es una de esas cenas en las que se compara el coche, las vacaciones y la cuenta. ${c.name} no está segura de querer ir: «Esa gente siempre pregunta cuándo nos vamos a vivir a otra ciudad más grande».`,
    opts: (c) => [
      { label: "Ir juntos y pasarlo bien a pesar de todo", subtitle: "Un esfuerzo compartido", consequences: { rel_vestuario: 3, moral: 2, flags: { pareja_delta: d(3) } }, outcomeText: `Acabáis riéndoos de las mismas bromas que habíais prometido no reír. ${c.name} descubre que la mujer del portero es insoportable de un modo adorable. Salís los últimos, cogidos del brazo.` },
      { label: "Ir tú solo y poner una excusa por ella", subtitle: "Evitarle el mal trago", consequences: { rel_vestuario: 1, flags: { pareja_delta: d(-3) } }, outcomeText: `Vuelves con un tupper de sobras y la sensación de que te has perdido tu casa. ${c.name} no ha cenado. Ni siquiera te pregunta cómo ha ido.` },
      { label: "Decir que no vais: preferís vuestra noche", subtitle: "Pasar de todo", consequences: { rel_vestuario: -3, moral: 3, flags: { pareja_delta: d(4) } }, outcomeText: `Os quedáis en casa con una pizza y una película mala. Al día siguiente, el capitán te lanza una ceja levantada. Ella, en cambio, tararea por toda la casa.` },
    ],
  },
  {
    key: "terapia-psico",
    when: (c) => c.moral < 50,
    once: true,
    title: (c) => `${c.name} te propone hablar con un psicólogo`,
    desc: (c) => `Lleva semanas observándote. Ve cómo te cuesta dormir, cómo estás distraído, cómo el campo se te ha vuelto pesado. Una noche te lo dice con ternura: «Creo que necesitas hablar con alguien que no sea yo». No es una acusación. Es un regalo, aunque se parezca a un reproche.`,
    opts: (c) => [
      { label: "Aceptarlo y pedir cita esta misma semana", subtitle: `${eur(120)} por sesión`, consequences: { patrimonio: -120, moral: 7, flags: { pareja_delta: d(6) } }, outcomeText: `La primera sesión es incómoda, la segunda más fácil, la tercera casi un alivio. Cuando le cuentas a ${c.name} que has llorado frente a un desconocido, ella se echa a llorar también.` },
      { label: "Decirle que estás bien y que no hace falta", subtitle: "Aguantarte", consequences: { moral: -3, flags: { pareja_delta: d(-4) } }, outcomeText: `Ella no insiste, pero deja un folleto en la mesilla. Lo ves cada noche, pegado a la lámpara, esperando.` },
    ],
  },
  {
    key: "fans-acoso",
    when: (c) => c.fama >= 55,
    title: (c) => `Una admiradora se pasa de la raya con ${c.name}`,
    desc: (c) => `Una seguidora, de esas que se saben tu vida mejor que tú, ha reconocido a ${c.name} en el supermercado y le ha soltado delante de todos que «no se merece a alguien como tú». Ella ha salido con el carro a medias y la voz temblorosa. Lo cuenta con humor, pero se le nota.`,
    opts: (c) => [
      { label: "Pedirle a la afición, en redes, respeto para ella", subtitle: "Un mensaje claro", consequences: { fama: 1, rel_aficion: -1, moral: 2, flags: { pareja_delta: d(6) } }, outcomeText: `Publicas un mensaje corto y firme. La mayoría de los aficionados te aplaude. La seguidora borra su cuenta. ${c.name}, al leerlo, te manda un corazón y una frase: «Gracias por plantarte».` },
      { label: "Quitarle hierro: «Son cosas de la fama»", subtitle: "Que pase", consequences: { moral: -1, flags: { pareja_delta: d(-5) } }, outcomeText: `Lo dices para tranquilizarla, pero ella oye otra cosa: «no es importante». ${c.name} asiente y no habla más del tema. Pero lo recuerda.` },
      { label: "Contratar algo de seguridad para sus salidas", subtitle: `${eur(900)} al mes`, consequences: { patrimonio: -900, moral: 2, flags: { pareja_delta: d(3) } }, outcomeText: `Aparece un escolta discreto con gafas de sol y expresión amable. ${c.name} lo lleva con humor al principio, y con alivio después.` },
    ],
  },
  {
    key: "ella-te-sorprende",
    when: (c) => c.rel >= 60,
    weight: 1.2,
    title: (c) => `${c.name} te prepara una sorpresa`,
    desc: (c) => `Vuelves de entrenar y hay una luz tenue en el salón. Sobre la mesa hay tu comida favorita, una camiseta antigua del club de tu infancia enmarcada y una nota: «Para que no se te olvide de dónde vienes». ${c.name} te mira desde la puerta, nerviosa como si fuera ella quien debutara.`,
    opts: (c) => [
      { label: "Abrazarla y contarle lo que significa", subtitle: "Dejarte llevar", consequences: { moral: 7, flags: { pareja_delta: d(5) } }, outcomeText: `Lloras un poco, o te lo pareces. ${c.name} te dice que lo ha buscado durante semanas con la ayuda de tu madre. Cuelgas la camiseta en el salón, donde no puedes dejar de verla.` },
      { label: "Hacerle una broma para quitar tensión", subtitle: "Humor", consequences: { moral: 4, flags: { pareja_delta: d(3) } }, outcomeText: `«¿Y si ahora me haces tú la cena?», dices. Ella te lanza un cojín. Os reís. La camiseta queda en el marco y el cojín, en el suelo.` },
      { label: "Agradecerlo rápido y volver al móvil", subtitle: "Cansancio", consequences: { moral: -2, flags: { pareja_delta: d(-6) } }, outcomeText: `Dices «gracias, preciosa» y miras el móvil. Ella espera algo más. Algo que no llega. Esa noche se guarda la sorpresa en el fondo del corazón.` },
    ],
  },
  {
    key: "mudanza-de-ciudad-pareja",
    when: (c) => c.rel >= 40 && c.age >= 22,
    once: true,
    title: () => "¿Y si nos vamos a vivir más lejos?",
    desc: (c) => `Alguien en el club ha comentado que el interés de un grande es serio. ${c.name} lo ha oído en la cola de la panadería y te lo planta en la cena: «¿Es verdad? Si hay algo, quiero saberlo ya. No a través de un periódico».`,
    opts: (c) => [
      { label: "Contarle todo y decidirlo juntos", subtitle: "Sin secretos", consequences: { moral: 3, flags: { pareja_delta: d(7) } }, outcomeText: `Le cuentas lo que sabes, que es poco, y lo que temes, que es mucho. Habláis hasta tarde. No decidís nada, pero decidís cómo decidir. Eso es lo importante.` },
      { label: "Decirle que son rumores sin importancia", subtitle: "No preocuparla", consequences: { moral: -1, flags: { pareja_delta: d(-4) } }, outcomeText: `Le dices que no hay nada. Ella te cree, o finge que lo hace. Cuando se publique la noticia, se acordará de esta noche.` },
    ],
  },
];

function ctxOf(player: Player): Ctx | null {
  const flags = (player.flags ?? {}) as Flags;
  const partner = partnerOf(flags);
  if (!partner) return null;
  const kids = readChildren(flags);
  const weekInSeason = ((player.week - 1) % 10) + 1;
  return {
    name: partnerFirstName(partner),
    full: partner,
    city: cityOfClub(player.club),
    club: player.club,
    rel: partnerRel(flags),
    stance: cityStance(partner, player.club),
    kid: kids.length > 0 ? kids[kids.length - 1].n : null,
    kids: Math.max(kids.length, parseInt(String(flags.hijos_n ?? "0"), 10) || 0, flags.hijos ? 1 : 0),
    married: Boolean(flags.casados),
    injured: getInjuryRemaining(flags) > 0,
    moral: player.moral ?? 60,
    forma: player.forma ?? 60,
    fama: player.fama ?? 0,
    media: player.media ?? 60,
    age: playerAge(player.week),
    turn: weekInSeason,
    money: player.patrimonio ?? 0,
  };
}

/** ¿Toca una escena con tu pareja? Cada pocos turnos, sin pisar la vida de un partido. */
export function shouldTriggerPartnerLife(player: Player, rng: () => number = Math.random): boolean {
  if (player.club === NO_CLUB_YET || player.status !== "active" || player.club.startsWith("SELECCIÓN:")) return false;
  const flags = (player.flags ?? {}) as Flags;
  if (!partnerOf(flags) || playerAge(player.week) < 17) return false;
  const last = parseInt(String(flags.pa_scene_last ?? "0"), 10) || 0;
  if (last > 0 && player.week - last < GAP) return false;
  return rng() < 0.72;
}

function eligible(c: Ctx, flags: Flags): Tpl[] {
  const recent = String(flags.pa_recent ?? "").split(",").filter(Boolean);
  return TEMPLATES.filter((t) => !recent.includes(t.key) && !(t.once && flags[`pa_done_${t.key}`]) && (!t.when || t.when(c)));
}

/** La escena de pareja de este turno (o null si no queda ninguna que encaje). */
export function buildPartnerLifeEvent(player: Player, rng: () => number = Math.random): GameEvent | null {
  const c = ctxOf(player);
  if (!c) return null;
  const flags = (player.flags ?? {}) as Flags;
  const pool = eligible(c, flags);
  const options = pool.length > 0 ? pool : TEMPLATES.filter((t) => !(t.once && flags[`pa_done_${t.key}`]) && (!t.when || t.when(c)));
  if (options.length === 0) return null;
  const total = options.reduce((n, t) => n + (t.weight ?? 1), 0);
  let r = rng() * total;
  let tpl = options[options.length - 1];
  for (const t of options) {
    r -= t.weight ?? 1;
    if (r <= 0) {
      tpl = t;
      break;
    }
  }
  const recent = [...String(flags.pa_recent ?? "").split(",").filter(Boolean), tpl.key].slice(-5).join(",");
  const stamp: Flags = { pa_scene_last: String(player.week), pa_recent: recent, ...(tpl.once ? { [`pa_done_${tpl.key}`]: true } : {}) };
  const opts = tpl.opts(c).map((o, i) => ({
    ...o,
    id: o.id ?? String.fromCharCode(97 + i),
    consequences: { ...o.consequences, flags: { ...(o.consequences?.flags ?? {}), ...stamp } },
  })) as EventOption[];
  return {
    id: `pareja-vida-${tpl.key}-${player.week}`,
    category: "vida",
    title: tpl.title(c),
    description: tpl.desc(c),
    options: opts,
    ...(tpl.milestone ? { isMilestone: true, milestoneType: "pareja", imageScene: tpl.milestone } : {}),
  };
}

/** Nombres de las escenas (para tests). */
export const PARTNER_LIFE_KEYS = TEMPLATES.map((t) => t.key);
