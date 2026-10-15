/**
 * Catálogo de jugadas decisivas de partido: situaciones y conjuntos de opciones por posición (delantero, centrocampista, defensa,
 * portero). Antes vivía dentro de engine.ts (1.500 líneas de datos); el motor solo elige de aquí.
 */
import type { Consequences, EventOption } from "@/types/career";

/**
 * Antes, la situación (frase de arriba) y el conjunto de opciones (más
 * abajo) se elegían al azar COMPLETAMENTE independientes entre sí — con
 * 13 situaciones × 8 conjuntos, muchas combinaciones no tenían sentido:
 * "el portero sale mal y te queda la portería vacía desde fuera del
 * área" podía tocar junto a opciones como "bajar el balón de pecho antes
 * de decidir", que da por hecho que te ha llegado un balón por alto — no
 * es lo que acaba de pasar en la situación. Reportado jugando una
 * carrera real. Cada situación ahora lleva su `mode` ("suelo" — el balón
 * ya está contigo a ras de césped, o "aereo" — te llega por alto, de
 * centro o córner) y solo se combina con conjuntos de opciones del mismo
 * modo (ver ATTACKER_OPTION_SETS).
 */
export type Mode = "suelo" | "aereo";
export interface Situation {
  text: string;
  mode: Mode;
}

export const ATTACKER_DECISION_SITUATIONS: Situation[] = [
  { text: "Recibes un balón filtrado y te plantas solo ante el portero.", mode: "suelo" },
  { text: "Un rechace te cae a los pies dentro del área, con la portería a tiro.", mode: "suelo" },
  { text: "Roban el balón: contragolpe, dos contra uno, la pelota es tuya.", mode: "suelo" },
  { text: "Te llega un centro raso al segundo palo, sin marca encima.", mode: "suelo" },
  { text: "Recibes de espaldas a la portería, con un defensa pegado a ti.", mode: "suelo" },
  { text: "Ganas la posición en el área pequeña tras un córner en el último minuto.", mode: "aereo" },
  { text: "Un compañero te deja un balón de tacón en plena área pequeña.", mode: "suelo" },
  { text: "El portero rival sale mal y te queda la portería medio vacía desde fuera del área.", mode: "suelo" },
  { text: "Recibes en carrera por banda, con el lateral rival ya tarde para cubrirte.", mode: "suelo" },
  { text: "Un rebote en el larguero te cae de nuevo a los pies, con todo el mundo caído.", mode: "aereo" },
  { text: "Recibes un pase al hueco entre el lateral y el central, con solo el portero por delante.", mode: "suelo" },
  { text: "El balón te llega botando en el área, en un ángulo incómodo para rematar.", mode: "suelo" },
  { text: "Te quedas mano a mano con el central que te marca, dentro del área pequeña.", mode: "suelo" },
  { text: "Controlas un pase largo en carrera, con el central rival pegado a ti a un metro.", mode: "suelo" },
  { text: "El balón te llega al borde del área con el defensa de espaldas: tienes medio segundo para decidir.", mode: "suelo" },
  { text: "Un compañero te asiste desde la banda y te quedas solo contra el lateral.", mode: "suelo" },
  { text: "Recoges un despeje rival en la frontal con toda la defensa descolocada.", mode: "suelo" },
  { text: "Recibes dentro del área con dos defensas encima y un compañero libre al segundo palo.", mode: "suelo" },
  { text: "Te quedas con el balón en la esquina del área, con el portero un paso adelantado.", mode: "suelo" },
  { text: "Un centro desde la derecha te llega a la altura del punto de penalti, con un central saltando contigo.", mode: "aereo" },
  { text: "Un córner cerrado te cae en la cabeza, rodeado de tres defensas que no te sueltan.", mode: "aereo" },
];

export const MIDFIELDER_DECISION_SITUATIONS = [
  "Recibes entre líneas con el área rival a un pase de distancia.",
  "Ves un hueco para filtrar el balón a tu delantero, si el pase sale bien.",
  "Robas el balón en el centro del campo con espacio para lanzar la contra.",
  "El rival te presiona en salida de balón, pegado a tu área.",
  "Te llega un balón dividido justo en la frontal del área.",
  "Un córner a favor te deja solo en el borde del área para rematar de primeras.",
  "El equipo pide un cambio de ritmo y tú tienes el balón para decidirlo.",
  "Recibes de espaldas con dos rivales cerrándote las dos únicas líneas de pase.",
  "Ves a tu lateral desmarcado por banda, pero el pase tiene que ser perfecto.",
  "Recibes un balón suelto tras un rechace, a 25 metros de la portería rival.",
  "El equipo lleva minutos sin ocasión y tú tienes que inventar algo desde el centro.",
  "Ganas un balón dividido en el círculo central con el partido apretado.",
  "Recibes un pase largo en el pico del área con espacio y tiempo para pensar.",
  "Un compañero te cede el balón en el balcón del área con dos delanteros desmarcándose.",
  "Cortas un pase rival en tres cuartos de campo y tienes el campo abierto por delante.",
  "El balón está en tu banda izquierda y el equipo necesita cambiar de lado para respirar.",
  "El rival se repliega en bloque y te deja un metro de espacio a treinta metros de la portería.",
  "El míster te grita desde la banda que aceleres: el reloj aprieta y el marcador no ayuda.",
  "Recibes de cara en el círculo central, pero tus dos compañeros de ataque están muy marcados.",
  "Un pase atrás te llega con el rival encima y apenas tiempo para decidir qué hacer.",
  "Un rebote te cae en el pico del área y los dos delanteros te piden el balón a gritos.",
  "Se para el juego: tienes la pelota en los pies y todo el estadio espera que te la juegues.",
];

export const DEFENDER_DECISION_SITUATIONS = [
  "El extremo rival te encara en velocidad, uno contra uno, cerca de tu área.",
  "Un balón dividido cae entre tú y el delantero rival dentro del área.",
  "El equipo rival sale a la contra y solo tú puedes evitarlo.",
  "Ganan un balón por alto en el área y el rechace te queda a ti, con un rival encima.",
  "Es el último minuto: un centro peligroso cruza tu área con dos rivales al acecho.",
  "El delantero rival se prepara para rematar un penalti y tú eres el capitán en el campo.",
  "Un compañero pierde el balón en salida y el rival encara tu área con ventaja numérica.",
  "Te llega un balón suelto en tu propia área, con el portero adelantado y fuera de posición.",
  "El árbitro deja seguir una jugada dudosa y el rival avanza hacia tu área.",
  "Un rival se planta en el área pequeña tras un pase filtrado que nadie cortó.",
  "El extremo rival centra desde la línea de fondo con varios compañeros esperando el remate.",
  "Recibes bajo presión en tu propia área, con dos rivales cerrándote las salidas.",
  "Un delantero rápido se te cuela a la espalda y llega con ventaja hacia tu área.",
  "El rival lanza un balón largo y tienes que decidir entre cortar o ir al choque.",
  "Un córner del rival: te toca marcar al mejor rematador de su equipo.",
  "Un pase al hueco deja a un rival mano a mano contigo por el pasillo interior.",
  "Tu portero sale a destiempo y deja la meta vacía con un rival a punto de rematar.",
  "Un rival te encara dentro de tu propia área con un compañero libre al segundo palo.",
  "Tu equipo gana por la mínima y el rival lo juega todo a un centro lateral en el descuento.",
  "Un contragolpe veloz te obliga a retroceder veinte metros corriendo con un rival al lado.",
  "El rival saca una falta lateral peligrosa y tú eres el responsable de la marca.",
  "El balón sobrevuela tu área y el delantero rival salta contigo con el brazo extendido.",
];

export const GOALKEEPER_DECISION_SITUATIONS = [
  "Un delantero rival se planta solo ante ti tras un error de tu defensa.",
  "Un disparo lejano viene ajustado a la escuadra, casi sin tiempo de reacción.",
  "Pitan un penalti a favor del rival en un momento clave del partido.",
  "Un centro raso cruza tu área pequeña con dos rivales al acecho.",
  "Sale un balón dividido fuera del área y un rival llega primero a por él.",
  "Un córner cerrado al primer palo te obliga a decidir en una décima de segundo.",
  "Un rechace de tu propio compañero te deja el balón suelto dentro del área pequeña.",
  "El rival remata de volea desde la frontal, sin apenas ángulo de reacción para ti.",
  "Un rival se queda solo tras un rechace en el área pequeña, con la portería medio vacía.",
  "El balón te llega con efecto en un centro cerrado, difícil de calcular.",
  "Quedan segundos de partido y un córner final pone toda tu área patas arriba.",
  "Un delantero te encara tras driblar a tu último central, con el estadio entero conteniendo la respiración.",
  "Un tiro libre directo desde veintidós metros, con la barrera mal colocada.",
  "Un balón largo te deja mano a mano con el delantero en tu propio campo.",
  "El rival lanza un contraataque tres contra dos y eres la última línea.",
  "Un pase atrás mal medido de tu defensa te pone en un compromiso con un rival encima.",
  "Un cabezazo picado a bocajarro desde el punto de penalti, sin tiempo ni para parpadear.",
  "Un balón colgado al segundo palo y tu defensa, dormida.",
  "El rival pisa tu área con el balón controlado y un solo defensa entre vosotros.",
  "Sale un disparo cruzado desde la banda, esquinado y raso.",
  "Un rechace cae en la frontal y un rival lo toma de primeras, sin pensarlo.",
];

/**
 * Antes cada posición tenía exactamente UNA terna de opciones fija — la
 * escena (arriba) variaba, pero las tres decisiones en sí eran siempre
 * las mismas tres, partido tras partido (reportado en vivo: "las mismas
 * opciones siempre" en dos partidos de Liga distintos). Ahora cada
 * posición tiene varios conjuntos de opciones y se elige uno al azar,
 * independiente de qué escena tocó — mismo mecanismo `resolve` y mismo
 * vocabulario de resultados que ya lee generateMatchDayEvent (save/
 * concede/penalty_conceded, clean_tackle/foul_committed/contained/beaten,
 * goal/assist/wondergoal/miss/miss_bad), solo cambia CÓMO se llega ahí.
 */
export type DecisionFlagsFn = (outcome: string, style: string) => { [key: string]: string };

/**
 * Opción de jugada decisiva con tirada (éxito/fallo) y su resultado ya
 * etiquetado para la crónica — mismo patrón que las opciones escritas a mano
 * de más abajo, sin repetir el boilerplate en cada una.
 */
export function rollOpt(
  flags: DecisionFlagsFn,
  id: string,
  label: string,
  subtitle: string,
  baseChance: number,
  ok: [text: string, outcome: string],
  fail: [text: string, outcome: string],
  okExtra: Consequences = {},
): EventOption {
  const style = id.replace(/-/g, "_");
  return {
    id,
    label,
    subtitle,
    consequences: {},
    resolve: {
      baseChance,
      statModifier: "media",
      success: { text: ok[0], consequences: { ...okExtra, flags: flags(ok[1], style) } },
      fail: { text: fail[0], consequences: { flags: flags(fail[1], style) } },
    },
  };
}

export const GOALKEEPER_OPTION_SETS: ((flags: DecisionFlagsFn) => EventOption[])[] = [
  (flags) => [
    {
      id: "salir",
      label: "Salir a cerrar el ángulo",
      subtitle: "Agresivo: o paras el gol o dejas la portería vacía",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Achicas el ángulo a la perfección — el rival no tiene hueco. ¡Paradón!", consequences: { fama: 2, flags: flags("save", "salida") } },
        fail: { text: "Sales, pero te la pica por encima. Gol rival.", consequences: { flags: flags("concede", "salida") } },
      },
    },
    {
      id: "linea",
      label: "Quedarte en la línea y cubrir el palo corto",
      subtitle: "Más seguro, menos espectacular",
      consequences: {},
      resolve: {
        baseChance: 0.55,
        statModifier: "media",
        success: { text: "Te mantienes firme y sacas el disparo con una buena estirada.", consequences: { flags: flags("save", "linea") } },
        fail: { text: "El disparo pasa ajustado a tu palo. No llegas.", consequences: { flags: flags("concede", "linea") } },
      },
    },
    {
      id: "puños",
      label: "Anticipar y despejar con los puños",
      subtitle: "Todo o nada en el choque aéreo",
      consequences: {},
      resolve: {
        baseChance: 0.32,
        statModifier: "media",
        success: { text: "Sales a por todas y despejas el peligro con autoridad total.", consequences: { fama: 2, flags: flags("save", "puños") } },
        fail: { text: "Falla el cálculo: derribas al rival. El árbitro señala el punto de penalti.", consequences: { forma: -2, flags: flags("penalty_conceded", "puños") } },
      },
    },
  ],
  (flags) => [
    {
      id: "primer-palo",
      label: "Tirarte al primer palo, anticipando el remate cruzado",
      subtitle: "Apuestas por dónde va a chutar",
      consequences: {},
      resolve: {
        baseChance: 0.38,
        statModifier: "media",
        success: { text: "Lees la intención perfectamente y sacas el disparo con el cuerpo.", consequences: { fama: 2, flags: flags("save", "primer_palo") } },
        fail: { text: "Adivinas mal el lado — el disparo va al palo contrario. Gol.", consequences: { flags: flags("concede", "primer_palo") } },
      },
    },
    {
      id: "centrado",
      label: "Quedarte centrado, sin comprarte el amago",
      subtitle: "Paciencia: esperar a que decida el rival",
      consequences: {},
      resolve: {
        baseChance: 0.52,
        statModifier: "media",
        success: { text: "No te mueves antes de tiempo y reaccionas justo cuando dispara. Gran parada.", consequences: { flags: flags("save", "centrado") } },
        fail: { text: "El rival espera tu reacción y te la coloca por el otro lado.", consequences: { flags: flags("concede", "centrado") } },
      },
    },
    {
      id: "salida-desesperada",
      label: "Salir en estirada desesperada a cortar el centro",
      subtitle: "Todo o nada antes de que remate",
      consequences: {},
      resolve: {
        baseChance: 0.3,
        statModifier: "media",
        success: { text: "Llegas justo a tiempo y despejas el centro antes del remate. Salvada providencial.", consequences: { fama: 2, flags: flags("save", "salida_desesperada") } },
        fail: { text: "No llegas a tiempo y derribas al rival en la salida. Penalti señalado.", consequences: { forma: -2, flags: flags("penalty_conceded", "salida_desesperada") } },
      },
    },
  ],
  (flags) => [
    {
      id: "rechazar-corto",
      label: "Rechazar el balón lejos, sin arriesgar el control",
      subtitle: "Despejar como sea, sin dárselas de listo",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "Despejas con contundencia. El peligro queda lejos de tu portería.", consequences: { flags: flags("save", "rechazar_corto") } },
        fail: { text: "El rechace le cae de rebote a un rival que no perdona.", consequences: { flags: flags("concede", "rechazar_corto") } },
      },
    },
    {
      id: "jugar-corto",
      label: "Jugar corto con el central en vez de despejar",
      subtitle: "Confiar en tu equipo bajo presión",
      consequences: {},
      resolve: {
        baseChance: 0.45,
        statModifier: "media",
        success: { text: "El pase corto sale limpio y el equipo sube jugando desde atrás sin sobresaltos.", consequences: { flags: flags("save", "jugar_corto") } },
        fail: { text: "El rival presiona bien y te roba el pase. Ocasión clarísima en contra.", consequences: { flags: flags("concede", "jugar_corto") } },
      },
    },
    {
      id: "gritar-linea",
      label: "Gritar para adelantar la línea defensiva en vez de intervenir",
      subtitle: "Confiar en el fuera de juego",
      consequences: {},
      resolve: {
        baseChance: 0.34,
        statModifier: "media",
        success: { text: "La defensa sube a tiempo. Fuera de juego señalado, peligro anulado sin ni rozar el balón.", consequences: { flags: flags("save", "gritar_linea") } },
        fail: { text: "La línea no sube a tiempo: el rival queda solo y no perdona.", consequences: { flags: flags("concede", "gritar_linea") } },
      },
    },
  ],
  (flags) => [
    {
      id: "blocaje-seguro",
      label: "Blocar el balón contra el cuerpo, sin arriesgar el rechace",
      subtitle: "Seguridad ante todo, aunque pierdas tiempo de reacción",
      consequences: {},
      resolve: {
        baseChance: 0.58,
        statModifier: "media",
        success: { text: "El balón se queda pegado a tu cuerpo. Peligro totalmente controlado.", consequences: { flags: flags("save", "blocaje_seguro") } },
        fail: { text: "El balón se te escapa de las manos en el peor momento posible.", consequences: { flags: flags("concede", "blocaje_seguro") } },
      },
    },
    {
      id: "cortar-centro-aereo",
      label: "Salir a por el centro por alto antes de que remate nadie",
      subtitle: "Anticiparte al choque en el área",
      consequences: {},
      resolve: {
        baseChance: 0.36,
        statModifier: "media",
        success: { text: "Ganas la posición por arriba y despejas el peligro con autoridad.", consequences: { fama: 1, flags: flags("save", "cortar_centro_aereo") } },
        fail: { text: "No llegas al balón y un rival remata libre de marca.", consequences: { flags: flags("concede", "cortar_centro_aereo") } },
      },
    },
    {
      id: "achicar-poco-a-poco",
      label: "Achicar distancia poco a poco, sin comprometerte",
      subtitle: "Esperar al último instante para moverte",
      consequences: {},
      resolve: {
        baseChance: 0.46,
        statModifier: "media",
        success: { text: "Le robas tiempo y espacio hasta que el disparo sale débil y lo atajas sin problema.", consequences: { flags: flags("save", "achicar_poco_a_poco") } },
        fail: { text: "El rival dispara antes de lo esperado y te pilla a medio camino.", consequences: { flags: flags("concede", "achicar_poco_a_poco") } },
      },
    },
  ],
  (flags) => [
    {
      id: "farolillo",
      label: "Quedarte plantado, sin tirarte antes de tiempo",
      subtitle: "Paciencia total: que decida él primero",
      consequences: {},
      resolve: {
        baseChance: 0.42,
        statModifier: "media",
        success: { text: "No te compras el amague y reaccionas justo cuando dispara de verdad.", consequences: { flags: flags("save", "farolillo") } },
        fail: { text: "Esperas demasiado y el disparo te sorprende sin reacción.", consequences: { flags: flags("concede", "farolillo") } },
      },
    },
    {
      id: "reflejos-cerca",
      label: "Cerrar distancias al máximo antes del disparo",
      subtitle: "Reducir el ángulo aunque te la puedan picar",
      consequences: {},
      resolve: {
        baseChance: 0.44,
        statModifier: "media",
        success: { text: "Le tapas todo el ángulo posible. Al final dispara fuera, sin espacio.", consequences: { flags: flags("save", "reflejos_cerca") } },
        fail: { text: "Te la pica por encima con la portería casi vacía. Gol rival.", consequences: { flags: flags("concede", "reflejos_cerca") } },
      },
    },
    {
      id: "despeje-cualquier-forma",
      label: "Despejar como sea, sin importar la forma",
      subtitle: "Feo pero efectivo: sacar el peligro de en medio",
      consequences: {},
      resolve: {
        baseChance: 0.53,
        statModifier: "media",
        success: { text: "El despeje sale feo pero efectivo. El peligro queda completamente resuelto.", consequences: { flags: flags("save", "despeje_cualquier_forma") } },
        fail: { text: "El despeje sale mal y el balón le cae de nuevo a un rival solo.", consequences: { flags: flags("concede", "despeje_cualquier_forma") } },
      },
    },
  ],
  (flags) => [
    {
      id: "leer-trayectoria",
      label: "Leer la trayectoria y colocarte antes del disparo",
      subtitle: "Todo depende de acertar la posición",
      consequences: {},
      resolve: {
        baseChance: 0.48,
        statModifier: "media",
        success: { text: "Te colocas exactamente donde tenía que ir el balón. Parada cómoda.", consequences: { flags: flags("save", "leer_trayectoria") } },
        fail: { text: "Te colocas mal y el disparo va justo al lado contrario.", consequences: { flags: flags("concede", "leer_trayectoria") } },
      },
    },
    {
      id: "gritar-cambio-marca",
      label: "Gritar el cambio de marca en vez de intervenir tú",
      subtitle: "Confiar en que un compañero llegue antes",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Tu grito llega a tiempo: un compañero corta el peligro antes de que llegue a ti.", consequences: { flags: flags("save", "gritar_cambio_marca") } },
        fail: { text: "Nadie reacciona a tiempo y el rival remata sin oposición.", consequences: { flags: flags("concede", "gritar_cambio_marca") } },
      },
    },
    {
      id: "reves-instintivo",
      label: "Reaccionar de puro instinto, sin pensarlo",
      subtitle: "Todo o nada: fiarlo todo a los reflejos",
      consequences: {},
      resolve: {
        baseChance: 0.36,
        statModifier: "media",
        success: { text: "El instinto te sale perfecto: una parada felina que nadie esperaba.", consequences: { fama: 2, flags: flags("save", "reves_instintivo") } },
        fail: { text: "El instinto falla esta vez y el balón se cuela sin que puedas hacer nada.", consequences: { flags: flags("concede", "reves_instintivo") } },
      },
    },
  ],
  (flags) => [
    {
      id: "cortar-pase-clave",
      label: "Adelantarte varios metros para cortar el pase clave",
      subtitle: "Salir de tu área, arriesgando quedarte sin portería",
      consequences: {},
      resolve: {
        baseChance: 0.34,
        statModifier: "media",
        success: { text: "Llegas primero al balón, lejos de tu portería. Peligro cortado de raíz.", consequences: { fama: 2, flags: flags("save", "cortar_pase_clave") } },
        fail: { text: "No llegas a tiempo y dejas la portería completamente vacía.", consequences: { flags: flags("concede", "cortar_pase_clave") } },
      },
    },
    {
      id: "cuerpo-a-tierra",
      label: "Tirarte a bloquear el balón raso, cuerpo a tierra",
      subtitle: "Sacrificio total para no dejar rechace",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "Te tiras al suelo y bloqueas el disparo raso sin dejar ningún rechace peligroso.", consequences: { flags: flags("save", "cuerpo_a_tierra") } },
        fail: { text: "El balón se te escapa entre las piernas. Gol evitable.", consequences: { flags: flags("concede", "cuerpo_a_tierra") } },
      },
    },
  ],
  (flags) => [
    {
      id: "calma-bajo-presion",
      label: "Mantener la calma y esperar el remate sin precipitarte",
      subtitle: "Confiar en tus reflejos hasta el último instante",
      consequences: {},
      resolve: {
        baseChance: 0.47,
        statModifier: "media",
        success: { text: "Tu calma se nota: reaccionas justo cuando remata, sin haberte movido antes de tiempo.", consequences: { flags: flags("save", "calma_bajo_presion") } },
        fail: { text: "Esperas demasiado y el disparo te sorprende sin reacción posible.", consequences: { flags: flags("concede", "calma_bajo_presion") } },
      },
    },
    {
      id: "juego-de-pies",
      label: "Resolver con los pies en vez de con las manos",
      subtitle: "Arriesgado, pero evita el rechace suelto",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Despejas con los pies con más precisión de la esperada. Peligro resuelto sin rechace.", consequences: { fama: 1, flags: flags("save", "juego_de_pies") } },
        fail: { text: "El control con los pies te sale mal y regalas el balón al rival dentro del área.", consequences: { flags: flags("concede", "juego_de_pies") } },
      },
    },
  ],
  (flags) => [
    rollOpt(flags, "palo-lejano", "Tirarte al palo lejano por instinto", "Sin pensarlo, a ciegas", 0.4,
      ["La punta de tus dedos desvía el balón en el último instante. ¡Paradón!", "save"],
      ["Llegas tarde y el disparo entra raso. Gol rival.", "concede"], { fama: 1 }),
    rollOpt(flags, "pies-por-delante", "Achicar con los pies por delante", "Rápido y arriesgado", 0.42,
      ["Sacas el balón con el pie en el último momento y el estadio ruge.", "save"],
      ["El pie llega un segundo tarde y el rival marca sin oposición.", "concede"]),
    rollOpt(flags, "esperar-decision", "Esperar a que el rival decida primero", "Paciencia de portero", 0.5,
      ["No te mueves y el rival tira a tus manos: parada tranquila.", "save"],
      ["Te la coloca al otro lado mientras sigues clavado. Gol.", "concede"]),
  ],
  (flags) => [
    rollOpt(flags, "salir-por-alto", "Salir a achicar por alto", "Valiente, con el área detrás", 0.38,
      ["Sales con decisión y atrapas el balón en el aire, delante de dos rivales.", "save"],
      ["Sales a destiempo y derribas a un rival: penalti.", "penalty_conceded"]),
    rollOpt(flags, "primer-palo-defensa", "Cubrir el primer palo y fiarte de tu defensa", "Confianza en el equipo", 0.5,
      ["Tu defensa cierra el segundo palo y tú cubres el primero: el balón sale fuera.", "save"],
      ["Tu defensa se despista y el remate entra por el palo que no cubrías.", "concede"]),
    rollOpt(flags, "tirarse-antes", "Lanzarte al suelo antes de que dispare", "Apuesta valiente", 0.32,
      ["Adivinas el lado y desvías el disparo con una mano. ¡Parada de campeón!", "save"],
      ["Te lanzas al lado equivocado y el balón entra por el otro.", "concede"], { fama: 2 }),
  ],
  (flags) => [
    rollOpt(flags, "despejar-corner", "Despejar a córner sin pensarlo", "Seguro, aunque regalas una jugada", 0.55,
      ["Mandas el balón a córner con un manotazo seco. Peligro conjurado.", "save"],
      ["El despeje sale flojo y el rival aprovecha el rechace. Gol.", "concede"]),
    rollOpt(flags, "centro-porteria", "Colocarte en el centro de la portería", "Cubrir los dos lados", 0.45,
      ["El disparo llega a tus guantes sin que tengas que moverte.", "save"],
      ["El balón entra por un ángulo que no llegabas a cubrir desde el centro.", "concede"]),
    rollOpt(flags, "palma-mano", "Sacar el balón con la palma de la mano", "Preciso, con riesgo", 0.4,
      ["La palma desvía el disparo al larguero y el balón sale fuera. ¡Qué reflejos!", "save"],
      ["La palma llega tarde y el balón se cuela por debajo.", "concede"]),
  ],
];

export const DEFENDER_OPTION_SETS: ((flags: DecisionFlagsFn) => EventOption[])[] = [
  (flags) => [
    {
      id: "entrada",
      label: "Entrar fuerte al balón",
      subtitle: "Alto riesgo de falta, pero robo limpio si sale bien",
      consequences: {},
      resolve: {
        baseChance: 0.42,
        statModifier: "media",
        success: { text: "Entrada perfecta: te llevas el balón limpio y cortas el peligro de raíz.", consequences: { fama: 1, flags: flags("clean_tackle", "entrada") } },
        fail: { text: "Llegas tarde. El árbitro no duda: falta y tarjeta.", consequences: { forma: -2, flags: flags("foul_committed", "entrada") } },
      },
    },
    {
      id: "contener",
      label: "Contener sin arriesgar, llevarlo hacia fuera",
      subtitle: "Menos vistoso, pero mucho más seguro",
      consequences: {},
      resolve: {
        baseChance: 0.58,
        statModifier: "media",
        success: { text: "Le quitas los espacios con paciencia hasta que pierde el balón por su cuenta.", consequences: { flags: flags("contained", "contener") } },
        fail: { text: "Te desborda igualmente. El peligro sigue vivo.", consequences: { flags: flags("beaten", "contener") } },
      },
    },
    {
      id: "anticipar",
      label: "Anticipar con lectura de juego",
      subtitle: "Todo o nada: adelantarte al pase antes de que llegue",
      consequences: {},
      resolve: {
        baseChance: 0.3,
        statModifier: "media",
        success: { text: "Lees la jugada a la perfección y te llevas el balón antes de que nadie lo espere.", consequences: { fama: 2, flags: flags("clean_tackle", "anticipar") } },
        fail: { text: "Fallas el cálculo y te quedas completamente fuera de la jugada.", consequences: { forma: -2, flags: flags("beaten", "anticipar") } },
      },
    },
  ],
  (flags) => [
    {
      id: "cabezazo",
      label: "Despejar de cabeza como sea, sin filigranas",
      subtitle: "Simplicidad ante todo: fuera de tu área",
      consequences: {},
      resolve: {
        baseChance: 0.6,
        statModifier: "media",
        success: { text: "Despejas con contundencia. Balón lejos de tu portería, peligro cortado.", consequences: { flags: flags("clean_tackle", "cabezazo") } },
        fail: { text: "El despeje sale mal calculado y el balón le cae de nuevo al rival dentro del área.", consequences: { flags: flags("beaten", "cabezazo") } },
      },
    },
    {
      id: "cortar-pase",
      label: "Cortar la línea de pase antes de que llegue el balón",
      subtitle: "Anticiparte a la jugada, no al rival",
      consequences: {},
      resolve: {
        baseChance: 0.45,
        statModifier: "media",
        success: { text: "Interceptas el pase justo a tiempo. Ni siquiera necesitas entrar al choque.", consequences: { fama: 1, flags: flags("clean_tackle", "cortar_pase") } },
        fail: { text: "Calculas mal la trayectoria y el balón pasa por delante de ti.", consequences: { flags: flags("beaten", "cortar_pase") } },
      },
    },
    {
      id: "carga",
      label: "Cargar con el hombro dentro del reglamento",
      subtitle: "Físico, al límite de la falta",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "La carga es limpia y reglamentaria: el rival pierde el equilibrio y el balón.", consequences: { flags: flags("clean_tackle", "carga") } },
        fail: { text: "El árbitro interpreta que te pasas de fuerte. Falta señalada.", consequences: { forma: -1, flags: flags("foul_committed", "carga") } },
      },
    },
  ],
  (flags) => [
    {
      id: "marcaje-hombre",
      label: "Pegarte al rival al hombre, sin dejarle un centímetro",
      subtitle: "Marcaje estrecho, riesgo de que te gane la espalda",
      consequences: {},
      resolve: {
        baseChance: 0.44,
        statModifier: "media",
        success: { text: "No le dejas ni girarse. Robas el balón pegado a su cuerpo.", consequences: { flags: flags("clean_tackle", "marcaje_hombre") } },
        fail: { text: "Te gana la espalda con un cambio de ritmo y te deja completamente atrás.", consequences: { forma: -1, flags: flags("beaten", "marcaje_hombre") } },
      },
    },
    {
      id: "cubrir-espacio",
      label: "Cubrir el espacio en vez de marcar al jugador",
      subtitle: "Prioridad: que no llegue el balón, no el hombre",
      consequences: {},
      resolve: {
        baseChance: 0.56,
        statModifier: "media",
        success: { text: "Tapas la línea de pase y el rival no encuentra ningún hueco.", consequences: { flags: flags("contained", "cubrir_espacio") } },
        fail: { text: "El rival encuentra el hueco que dejaste libre. Peligro real.", consequences: { flags: flags("beaten", "cubrir_espacio") } },
      },
    },
    {
      id: "salir-jugando",
      label: "Salir jugando desde atrás en vez de despejar",
      subtitle: "Arriesgar con el balón en tu propia área",
      consequences: {},
      resolve: {
        baseChance: 0.35,
        statModifier: "media",
        success: { text: "El pase sale limpio bajo presión y tu equipo sale jugando con ventaja.", consequences: { fama: 1, flags: flags("contained", "salir_jugando") } },
        fail: { text: "Te presionan y pierdes el balón en tu propia área. Ocasión clarísima en contra.", consequences: { forma: -2, flags: flags("beaten", "salir_jugando") } },
      },
    },
  ],
  (flags) => [
    {
      id: "barrida",
      label: "Ir a la barrida como último recurso",
      subtitle: "Todo o nada: o robas limpio o dejas al rival solo",
      consequences: {},
      resolve: {
        baseChance: 0.33,
        statModifier: "media",
        success: { text: "La barrida sale perfecta: te llevas solo el balón, ni rozas al rival.", consequences: { fama: 1, flags: flags("clean_tackle", "barrida") } },
        fail: { text: "Llegas tarde a la barrida y el árbitro no duda: tarjeta y falta peligrosa.", consequences: { forma: -2, flags: flags("foul_committed", "barrida") } },
      },
    },
    {
      id: "retrasar-linea",
      label: "Retrasar tu posición para no dejar espacio a la espalda",
      subtitle: "Priorizar la cobertura sobre el robo inmediato",
      consequences: {},
      resolve: {
        baseChance: 0.6,
        statModifier: "media",
        success: { text: "Cierras bien el espacio y el rival no encuentra ningún hueco para progresar.", consequences: { flags: flags("contained", "retrasar_linea") } },
        fail: { text: "El rival aprovecha igualmente el hueco y te supera con un pase entre líneas.", consequences: { flags: flags("beaten", "retrasar_linea") } },
      },
    },
    {
      id: "achique-lateral",
      label: "Achicar por fuera, obligándole a ir hacia dentro",
      subtitle: "Dirigir la jugada hacia donde tienes ayuda",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "Le cierras la banda y un compañero le roba el balón nada más entrar hacia dentro.", consequences: { flags: flags("clean_tackle", "achique_lateral") } },
        fail: { text: "Se va por dentro con más facilidad de la esperada y genera peligro real.", consequences: { flags: flags("beaten", "achique_lateral") } },
      },
    },
  ],
  (flags) => [
    {
      id: "doblar-marca",
      label: "Pedir ayuda y doblar la marca entre dos",
      subtitle: "No ir solo: cerrarle todas las salidas",
      consequences: {},
      resolve: {
        baseChance: 0.55,
        statModifier: "media",
        success: { text: "Entre los dos no le dejáis ni un hueco. Pierde el balón sin remedio.", consequences: { flags: flags("clean_tackle", "doblar_marca") } },
        fail: { text: "Se revuelve entre los dos y sale limpio de la doble marca.", consequences: { flags: flags("beaten", "doblar_marca") } },
      },
    },
    {
      id: "despejar-como-sea",
      label: "Despejar como sea, sin pensarlo dos veces",
      subtitle: "Prioridad absoluta: sacar el balón de tu área",
      consequences: {},
      resolve: {
        baseChance: 0.62,
        statModifier: "media",
        success: { text: "Despejas con contundencia. El peligro queda completamente resuelto.", consequences: { flags: flags("clean_tackle", "despejar_como_sea") } },
        fail: { text: "El despeje sale mal calculado y el balón le cae de nuevo a un rival.", consequences: { flags: flags("beaten", "despejar_como_sea") } },
      },
    },
    {
      id: "leer-intencion",
      label: "Leer la intención del pase antes de que salga",
      subtitle: "Anticiparte al pase, no al balón",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Lees la jugada perfectamente y cortas el pase antes de que llegue a nadie.", consequences: { fama: 1, flags: flags("clean_tackle", "leer_intencion") } },
        fail: { text: "Te adelantas mal y dejas un hueco enorme a tu espalda.", consequences: { forma: -1, flags: flags("beaten", "leer_intencion") } },
      },
    },
  ],
  (flags) => [
    {
      id: "empujon-reglamentario",
      label: "Usar el cuerpo para sacarlo de la jugada, sin pasarte",
      subtitle: "Físico dentro del límite del reglamento",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "El cuerpo a cuerpo es limpio: el rival pierde el equilibrio y el balón.", consequences: { flags: flags("clean_tackle", "empujon_reglamentario") } },
        fail: { text: "El árbitro interpreta que ha sido empujón. Falta señalada.", consequences: { forma: -1, flags: flags("foul_committed", "empujon_reglamentario") } },
      },
    },
    {
      id: "esperar-error",
      label: "No entrar, esperar a que el rival se equivoque solo",
      subtitle: "Paciencia total, cero riesgo de falta",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "El rival se precipita y pierde el balón él solo, sin que hayas arriesgado nada.", consequences: { flags: flags("contained", "esperar_error") } },
        fail: { text: "El rival no se precipita y te supera con calma, sin ni un roce.", consequences: { flags: flags("beaten", "esperar_error") } },
      },
    },
    {
      id: "salida-rapida",
      label: "Salir rápido de tu posición a cortar antes de que controle",
      subtitle: "Anticiparte al control, no al disparo",
      consequences: {},
      resolve: {
        baseChance: 0.37,
        statModifier: "media",
        success: { text: "Llegas antes de que controle y te llevas el balón limpio.", consequences: { fama: 1, flags: flags("clean_tackle", "salida_rapida") } },
        fail: { text: "Calculas mal el tiempo y le dejas controlar con ventaja.", consequences: { flags: flags("beaten", "salida_rapida") } },
      },
    },
  ],
  (flags) => [
    {
      id: "recorte-propio",
      label: "Salir jugando con un recorte antes de que te presionen",
      subtitle: "Arriesgar en tu propio campo para romper líneas",
      consequences: {},
      resolve: {
        baseChance: 0.33,
        statModifier: "media",
        success: { text: "El recorte deja a dos rivales atrás y tu equipo sale jugando con ventaja.", consequences: { fama: 1, flags: flags("contained", "recorte_propio") } },
        fail: { text: "Te presionan y pierdes el balón en tu propio campo. Ocasión clara en contra.", consequences: { forma: -2, flags: flags("beaten", "recorte_propio") } },
      },
    },
    {
      id: "sacrificio-cuerpo",
      label: "Meter el cuerpo al disparo, sacrificándote",
      subtitle: "Bloquear como sea, cueste lo que cueste",
      consequences: {},
      resolve: {
        baseChance: 0.55,
        statModifier: "media",
        success: { text: "Bloqueas el disparo con el cuerpo. Duele, pero el peligro queda resuelto.", consequences: { flags: flags("clean_tackle", "sacrificio_cuerpo") } },
        fail: { text: "El bloqueo sale mal y el balón se desvía justo hacia la portería.", consequences: { flags: flags("beaten", "sacrificio_cuerpo") } },
      },
    },
  ],
  (flags) => [
    {
      id: "vigilar-espalda",
      label: "Quedarte atrás vigilando el espacio a tu espalda",
      subtitle: "Prioridad: no dejar que te ganen la posición",
      consequences: {},
      resolve: {
        baseChance: 0.52,
        statModifier: "media",
        success: { text: "No te ganan la espalda en ningún momento. Peligro controlado sin sobresaltos.", consequences: { flags: flags("contained", "vigilar_espalda") } },
        fail: { text: "Te ganan la posición justo cuando bajas la guardia. Ocasión clara en contra.", consequences: { flags: flags("beaten", "vigilar_espalda") } },
      },
    },
    {
      id: "salto-anticipado",
      label: "Saltar antes de tiempo para ganar el primer cabezazo",
      subtitle: "Todo o nada en el juego aéreo",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Ganas el salto con claridad y despejas el peligro de cabeza.", consequences: { fama: 1, flags: flags("clean_tackle", "salto_anticipado") } },
        fail: { text: "Saltas antes de tiempo y el rival te gana la posición en el aire.", consequences: { flags: flags("beaten", "salto_anticipado") } },
      },
    },
  ],
  (flags) => [
    rollOpt(flags, "robo-limpio", "Intentar el robo por detrás con limpieza", "Sin tocarle, solo el balón", 0.45,
      ["Le robas el balón sin tocarle: entrada de manual y aplauso de la grada.", "clean_tackle"],
      ["Llegas tarde, le haces falta y el árbitro saca amarilla.", "foul_committed"]),
    rollOpt(flags, "acompanar", "Acompañar sin abalanzarte", "Aguantar hasta que se equivoque", 0.55,
      ["Le acompañas hasta la línea de fondo y se queda sin ángulo.", "contained"],
      ["Se te va con un cambio de ritmo y te deja atrás.", "beaten"]),
    rollOpt(flags, "falta-tactica", "Hacer una falta táctica antes de que arranque", "Frenar la contra a cualquier precio", 0.5,
      ["El árbitro la pita sin tarjeta y cortas la contra.", "contained"],
      ["Amarilla directa, pero cortas el peligro.", "foul_committed"]),
  ],
  (flags) => [
    rollOpt(flags, "anticipar-rebote", "Anticipar el rebote en el área", "Estar donde cae el balón", 0.45,
      ["Llegas primero al rechace y lo mandas lejos del peligro.", "clean_tackle"],
      ["El rebote te sorprende y el rival se queda con el balón.", "beaten"]),
    rollOpt(flags, "tapar-tiro", "Tapar la línea de tiro con el cuerpo", "Sacrificio sin balón", 0.5,
      ["Bloqueas el disparo con el muslo y el balón sale a córner.", "contained"],
      ["Se cuela entre tus piernas y el portero ya no llega.", "beaten"]),
    rollOpt(flags, "empujon-disimulado", "Empujar al rival sin que se note", "Picardía defensiva", 0.35,
      ["Le desequilibras justo lo necesario y el árbitro no ve nada.", "contained"],
      ["El árbitro lo ve todo: falta y amarilla.", "foul_committed"]),
  ],
  (flags) => [
    rollOpt(flags, "cabeza-dividido", "Entrar de cabeza al balón dividido", "Sin miedo al choque", 0.45,
      ["Ganas el cabezazo y despejas lejos del área.", "clean_tackle"],
      ["El rival gana la posición y se queda con la segunda jugada.", "beaten"]),
    rollOpt(flags, "cerrar-por-dentro", "Cerrar al atacante por dentro", "Obligarle a ir hacia fuera", 0.5,
      ["Le cierras el camino y el rival acaba mandando el centro a la grada.", "contained"],
      ["Se cuela por el pasillo interior y encara al portero.", "beaten"]),
    rollOpt(flags, "reorganizar-linea", "Dar un grito y reorganizar la línea", "Liderar sin balón", 0.55,
      ["Tu grito coloca a toda la defensa justo a tiempo: el rival se queda sin hueco.", "contained"],
      ["Tus compañeros no te oyen y se abre un hueco enorme.", "beaten"]),
  ],
];

export const MIDFIELDER_OPTION_SETS: ((flags: DecisionFlagsFn) => EventOption[])[] = [
  (flags) => [
    {
      id: "disparo",
      label: "Probar el disparo lejano",
      subtitle: "Vas a por el gol directo desde fuera del área",
      consequences: {},
      resolve: {
        baseChance: 0.32,
        statModifier: "media",
        success: { text: "El balón se cuela pegado a la escuadra. ¡Golazo desde fuera del área!", consequences: { fama: 2, flags: flags("goal", "disparo") } },
        fail: { text: "El disparo se marcha alto, por encima del larguero.", consequences: { flags: flags("miss", "disparo") } },
      },
    },
    {
      id: "pase",
      label: "Filtrar el pase al delantero",
      subtitle: "Menos gloria, más seguro",
      consequences: {},
      resolve: {
        baseChance: 0.55,
        statModifier: "media",
        success: { text: "El pase es perfecto: tu compañero no perdona.", consequences: { flags: flags("assist", "pase") } },
        fail: { text: "El pase se queda corto y el rival despeja el peligro.", consequences: { flags: flags("miss", "pase") } },
      },
    },
    {
      id: "proteger",
      label: "Proteger el balón y reiniciar la jugada",
      subtitle: "Sin riesgo: mantener la posesión del equipo",
      consequences: {},
      resolve: {
        baseChance: 0.7,
        statModifier: "media",
        success: { text: "Proteges el balón con inteligencia y das tiempo a que el equipo suba.", consequences: { flags: flags("contained", "proteger") } },
        fail: { text: "Te presionan entre dos rivales y pierdes el balón en una zona comprometida.", consequences: { forma: -1, flags: flags("beaten", "proteger") } },
      },
    },
  ],
  (flags) => [
    {
      id: "cambio-orientacion",
      label: "Cambiar la orientación del juego al otro costado",
      subtitle: "Paciencia: mover el balón, no el riesgo",
      consequences: {},
      resolve: {
        baseChance: 0.68,
        statModifier: "media",
        success: { text: "El cambio de orientación pilla desubicado al rival y abre space por el otro lado.", consequences: { flags: flags("contained", "cambio_orientacion") } },
        fail: { text: "El pase largo se va directo al rival: pérdida de balón peligrosa.", consequences: { forma: -1, flags: flags("beaten", "cambio_orientacion") } },
      },
    },
    {
      id: "conduccion",
      label: "Encarar en conducción vertical hacia el área",
      subtitle: "Ir tú mismo, todo o nada",
      consequences: {},
      resolve: {
        baseChance: 0.36,
        statModifier: "media",
        success: { text: "Encaras a los centrales, aguantas el equilibrio y bates al portero desde la frontal.", consequences: { fama: 2, flags: flags("goal", "conduccion") } },
        fail: { text: "Te cierran bien los espacios y pierdes el balón en la conducción.", consequences: { flags: flags("miss", "conduccion") } },
      },
    },
    {
      id: "pase-espacio",
      label: "Buscar el pase al espacio entre líneas",
      subtitle: "Pase de riesgo con mucha recompensa",
      consequences: {},
      resolve: {
        baseChance: 0.48,
        statModifier: "media",
        success: { text: "El balón pasa entre dos rivales justo a la carrera de tu compañero. Asistencia de manual.", consequences: { flags: flags("assist", "pase_espacio") } },
        fail: { text: "El pase se intercepta antes de llegar a su destino.", consequences: { flags: flags("miss", "pase_espacio") } },
      },
    },
  ],
  (flags) => [
    {
      id: "regate-central",
      label: "Intentar el regate corto en el centro del campo",
      subtitle: "Romper líneas tú mismo, riesgo de pérdida",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "El regate sale limpio y dejas a dos rivales atrás en la misma jugada.", consequences: { fama: 1, flags: flags("contained", "regate_central") } },
        fail: { text: "Te roban el balón en zona peligrosa y el rival sale a la contra.", consequences: { forma: -1, flags: flags("beaten", "regate_central") } },
      },
    },
    {
      id: "pase-muerte",
      label: "Buscar el pase de la muerte al área",
      subtitle: "Todo o nada por la asistencia",
      consequences: {},
      resolve: {
        baseChance: 0.42,
        statModifier: "media",
        success: { text: "El pase raso cruza el área y tu compañero solo tiene que empujarla. Asistencia clara.", consequences: { flags: flags("assist", "pase_muerte") } },
        fail: { text: "El pase se marcha directo a un defensa rival. Jugada cortada.", consequences: { flags: flags("miss", "pase_muerte") } },
      },
    },
    {
      id: "temporizar",
      label: "Temporizar y esperar a que suban tus compañeros",
      subtitle: "Sin riesgo: no perder la posesión",
      consequences: {},
      resolve: {
        baseChance: 0.68,
        statModifier: "media",
        success: { text: "Manejas los tiempos con calma y el equipo se reorganiza en ataque.", consequences: { flags: flags("contained", "temporizar") } },
        fail: { text: "El rival te presiona entre varios y pierdes el balón sin ni siquiera intentarlo.", consequences: { forma: -1, flags: flags("beaten", "temporizar") } },
      },
    },
  ],
  (flags) => [
    {
      id: "un-dos",
      label: "Buscar el uno-dos con el delantero",
      subtitle: "Pared rápida para entrar solo al área",
      consequences: {},
      resolve: {
        baseChance: 0.38,
        statModifier: "media",
        success: { text: "La pared sale perfecta: entras solo al área y defines con calma. ¡Gol!", consequences: { fama: 2, flags: flags("goal", "un_dos") } },
        fail: { text: "El rival lee la pared y corta la jugada antes de que se complete.", consequences: { flags: flags("miss", "un_dos") } },
      },
    },
    {
      id: "disparo-cruzado",
      label: "Buscar el disparo cruzado desde la media distancia",
      subtitle: "Sorprender antes de que se cierre el hueco",
      consequences: {},
      resolve: {
        baseChance: 0.3,
        statModifier: "media",
        success: { text: "El disparo cruzado se cuela lejos del alcance del portero. ¡Golazo!", consequences: { fama: 2, flags: flags("goal", "disparo_cruzado") } },
        fail: { text: "El disparo se marcha fuera, lejos del marco.", consequences: { flags: flags("miss", "disparo_cruzado") } },
      },
    },
    {
      id: "recular",
      label: "Recular con el balón controlado, sin forzar nada",
      subtitle: "Renunciar al riesgo, mantener el orden",
      consequences: {},
      resolve: {
        baseChance: 0.72,
        statModifier: "media",
        success: { text: "Manejas el balón con calma y das tiempo a que el equipo se reorganice sin sobresaltos.", consequences: { flags: flags("contained", "recular") } },
        fail: { text: "Dudas demasiado y el rival te quita el balón sin apenas esfuerzo.", consequences: { forma: -1, flags: flags("beaten", "recular") } },
      },
    },
  ],
  (flags) => [
    {
      id: "pase-largo-diagonal",
      label: "Buscar el pase largo en diagonal al espacio",
      subtitle: "Cambio de ritmo repentino, todo o nada",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "El pase llega perfecto al espacio: tu compañero se planta solo ante el portero.", consequences: { flags: flags("assist", "pase_largo_diagonal") } },
        fail: { text: "El pase se pasa de largo y termina en fuera de banda.", consequences: { flags: flags("miss", "pase_largo_diagonal") } },
      },
    },
    {
      id: "doble-contacto",
      label: "Amagar con el cuerpo y salir por el otro lado",
      subtitle: "Ganarte el espacio con un solo gesto",
      consequences: {},
      resolve: {
        baseChance: 0.35,
        statModifier: "media",
        success: { text: "El amago deja sentado al defensa. Espacio libre para definir. ¡Gol!", consequences: { fama: 2, flags: flags("goal", "doble_contacto") } },
        fail: { text: "El defensa no se la compra y te cierra el hueco a tiempo.", consequences: { flags: flags("miss", "doble_contacto") } },
      },
    },
    {
      id: "bajar-a-recibir",
      label: "Bajar a recibir de espaldas para conectar con el equipo",
      subtitle: "Sacrificar posición por sumar al juego colectivo",
      consequences: {},
      resolve: {
        baseChance: 0.66,
        statModifier: "media",
        success: { text: "Enlazas el juego con sencillez y das tiempo a que el equipo suba en bloque.", consequences: { flags: flags("contained", "bajar_a_recibir") } },
        fail: { text: "Te presionan nada más recibir y pierdes el balón de espaldas a portería.", consequences: { forma: -1, flags: flags("beaten", "bajar_a_recibir") } },
      },
    },
  ],
  (flags) => [
    {
      id: "doble-paso",
      label: "Doble paso para ganar la línea de fondo",
      subtitle: "Ir directo a por el fondo, sin mirar atrás",
      consequences: {},
      resolve: {
        baseChance: 0.44,
        statModifier: "media",
        success: { text: "Ganas la línea de fondo con un doble paso limpio y centras al corazón del área.", consequences: { flags: flags("assist", "doble_paso") } },
        fail: { text: "El lateral rival te corta antes de llegar a la línea de fondo.", consequences: { flags: flags("miss", "doble_paso") } },
      },
    },
    {
      id: "disparo-primer-toque",
      label: "Disparar de primer toque, sin controlar antes",
      subtitle: "No dar tiempo a que se cierre el defensa",
      consequences: {},
      resolve: {
        baseChance: 0.3,
        statModifier: "media",
        success: { text: "El disparo de primeras sorprende a todos, portero incluido. ¡Gol!", consequences: { fama: 2, flags: flags("goal", "disparo_primer_toque") } },
        fail: { text: "El disparo sale descontrolado, muy desviado.", consequences: { flags: flags("miss", "disparo_primer_toque") } },
      },
    },
    {
      id: "buscar-penalti",
      label: "Encarar buscando el contacto dentro del área",
      subtitle: "Arriesgar la caída para forzar el penalti",
      consequences: {},
      resolve: {
        baseChance: 0.32,
        statModifier: "media",
        success: { text: "El contacto es claro y el árbitro no duda: penalti a tu favor.", consequences: { fama: 1, flags: flags("assist", "buscar_penalti") } },
        fail: { text: "El árbitro no ve nada claro y sigue el juego. Ocasión perdida.", consequences: { flags: flags("miss", "buscar_penalti") } },
      },
    },
  ],
  (flags) => [
    {
      id: "pase-diagonal-corto",
      label: "Buscar el triángulo corto con el interior",
      subtitle: "Paciencia: progresar metro a metro",
      consequences: {},
      resolve: {
        baseChance: 0.6,
        statModifier: "media",
        success: { text: "El triángulo funciona a la perfección y el equipo avanza con el balón controlado.", consequences: { flags: flags("contained", "pase_diagonal_corto") } },
        fail: { text: "El rival lee el triángulo y corta el pase antes de completarlo.", consequences: { flags: flags("beaten", "pase_diagonal_corto") } },
      },
    },
    {
      id: "disparo-parabola",
      label: "Probar el globo por encima del portero adelantado",
      subtitle: "Sorprender con la parábola exacta",
      consequences: {},
      resolve: {
        baseChance: 0.26,
        statModifier: "media",
        success: { text: "La parábola cae justo bajo el larguero. El portero solo puede mirar. ¡Golazo!", consequences: { fama: 3, flags: flags("wondergoal", "disparo_parabola") } },
        fail: { text: "El globo se pasa de largo y sale por encima del larguero.", consequences: { flags: flags("miss_bad", "disparo_parabola") } },
      },
    },
  ],
  (flags) => [
    {
      id: "cambio-frente-largo",
      label: "Buscar el cambio de frente con un pase largo",
      subtitle: "Sorprender al rival atacando por el otro lado",
      consequences: {},
      resolve: {
        baseChance: 0.46,
        statModifier: "media",
        success: { text: "El cambio de frente pilla mal colocado al rival y genera peligro inmediato.", consequences: { flags: flags("assist", "cambio_frente_largo") } },
        fail: { text: "El pase se va largo y termina directamente en fuera de banda.", consequences: { flags: flags("miss", "cambio_frente_largo") } },
      },
    },
    {
      id: "faltar-al-choque",
      label: "Entrar al choque con decisión para recuperar el balón",
      subtitle: "Físico, sin miedo a la tarjeta",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "Ganas el choque con contundencia y te llevas el balón limpio.", consequences: { flags: flags("clean_tackle", "faltar_al_choque") } },
        fail: { text: "El árbitro interpreta que ha sido falta. Amarilla para ti.", consequences: { forma: -1, flags: flags("foul_committed", "faltar_al_choque") } },
      },
    },
  ],
  (flags) => [
    rollOpt(flags, "conducir-disparar", "Conducir cinco metros y disparar", "Ganar espacio y probar", 0.38,
      ["Te acomodas la pelota y sacas un disparo seco que se cuela por la escuadra. ¡Gol!", "goal"],
      ["El disparo sale demasiado alto y se pierde por encima del larguero.", "miss"]),
    rollOpt(flags, "pase-exterior", "Pasar al hueco con el exterior", "Elegancia y riesgo", 0.45,
      ["El pase con el exterior deja a tu delantero solo y no perdona.", "assist"],
      ["El pase sale demasiado largo y el portero lo recoge sin apuros.", "miss"]),
    rollOpt(flags, "proteger-cuerpo", "Proteger la pelota con el cuerpo", "No perder nunca el control", 0.6,
      ["Aguantas el balón hasta que sube todo el equipo.", "contained"],
      ["Te quitan el balón por detrás en un descuido.", "beaten"]),
  ],
  (flags) => [
    rollOpt(flags, "balon-largo-palo", "Lanzar el balón largo al segundo palo", "Una apuesta aérea", 0.4,
      ["El balón cae al segundo palo y tu compañero remata a placer.", "assist"],
      ["El balón se pasa de largo y sale por la línea de fondo.", "miss"]),
    rollOpt(flags, "pausa-cabeza", "Hacer una pausa y levantar la cabeza", "Pensar antes de actuar", 0.55,
      ["La pausa descoloca al rival y el equipo recupera el aire.", "contained"],
      ["Te quedas pensando demasiado y te roban el balón.", "beaten"]),
    rollOpt(flags, "pierna-mala", "Disparar con la pierna menos hábil", "Atrevimiento", 0.28,
      ["Sale una vaselina preciosa que se cuela. ¡Gol, y con la mala!", "goal"],
      ["El disparo sale blando y el portero lo ataja sin problemas.", "miss"], { fama: 2 }),
  ],
  (flags) => [
    rollOpt(flags, "presionar-perder", "Presionar al rival tras perder el balón", "Recuperar arriba", 0.5,
      ["Presionas con rabia y recuperas el balón en campo contrario.", "contained"],
      ["Te superan con un pase y el rival sale a la contra.", "beaten"]),
    rollOpt(flags, "abrir-banda-interior", "Abrir a banda con el interior", "Ensanchar el campo", 0.5,
      ["El pase abre el campo y el extremo se planta en el área.", "assist"],
      ["El pase se queda corto y el lateral rival lo intercepta.", "miss"]),
    rollOpt(flags, "pase-pie-delantero", "Buscar al delantero con un pase al pie", "Directo y limpio", 0.52,
      ["El delantero controla, gira y marca. ¡Qué pase!", "assist"],
      ["El pase llega con demasiada fuerza y el delantero no puede controlar.", "miss"]),
  ],
];

/**
 * Cada conjunto lleva su `mode`, emparejado con el de Situation de
 * arriba: "suelo" para conjuntos que dan por hecho que el balón ya está
 * a tus pies (disparo, regate, pase raso...), "aereo" para los que dan
 * por hecho que te llega por alto (cabezazo, palomita, chilena...).
 */
export interface OptionSet {
  mode: Mode;
  build: (flags: DecisionFlagsFn) => EventOption[];
}

export const ATTACKER_OPTION_SETS: OptionSet[] = [
  { mode: "suelo", build: (flags) => [
    {
      id: "disparo",
      label: "Disparar a puerta",
      subtitle: "Vas a por el gol directo",
      consequences: {},
      resolve: {
        baseChance: 0.42,
        statModifier: "media",
        success: { text: "El balón entra pegado al palo. ¡Gol!", consequences: { flags: flags("goal", "disparo") } },
        fail: { text: "El portero saca una mano providencial. No hay gol.", consequences: { flags: flags("miss", "disparo") } },
      },
    },
    {
      id: "pase",
      label: "Pasar a un compañero mejor colocado",
      subtitle: "Menos gloria, más seguro",
      consequences: {},
      resolve: {
        baseChance: 0.55,
        statModifier: "media",
        success: { text: "El pase es perfecto: tu compañero no perdona.", consequences: { flags: flags("assist", "pase") } },
        fail: { text: "El pase se queda corto y el rival despeja el peligro.", consequences: { flags: flags("miss", "pase") } },
      },
    },
    {
      id: "floritura",
      label: "Intentar una jugada de calidad (regate, túnel, sombrero...)",
      subtitle: "Todo o nada, para la galería",
      consequences: {},
      resolve: {
        baseChance: 0.28,
        statModifier: "media",
        success: { text: "Sale perfecta. El estadio entero se levanta de sus asientos.", consequences: { fama: 3, flags: flags("wondergoal", "floritura") } },
        fail: { text: "No sale — pierdes el balón y el rival sale a la contra.", consequences: { forma: -2, flags: flags("miss_bad", "floritura") } },
      },
    },
  ] },
  { mode: "suelo", build: (flags) => [
    {
      id: "primer-toque",
      label: "Rematar de primeras sin controlar",
      subtitle: "No le das tiempo al portero a colocarse",
      consequences: {},
      resolve: {
        baseChance: 0.38,
        statModifier: "media",
        success: { text: "El remate de primeras sale ajustado, sin que el portero pueda reaccionar. ¡Gol!", consequences: { fama: 2, flags: flags("goal", "primer_toque") } },
        fail: { text: "El control-remate te sale mal y el balón se marcha desviado.", consequences: { flags: flags("miss", "primer_toque") } },
      },
    },
    {
      id: "linea-fondo",
      label: "Ganar la línea de fondo y centrar atrás",
      subtitle: "Buscar el pase de la muerte en vez del gol propio",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "Te vas de tu marcador y pones un centro atrás perfecto que remata un compañero.", consequences: { flags: flags("assist", "linea_fondo") } },
        fail: { text: "El centro se marcha directo al portero rival. Jugada cortada.", consequences: { flags: flags("miss", "linea_fondo") } },
      },
    },
    {
      id: "aguantar",
      label: "Aguantar el balón de espaldas y pedir apoyo",
      subtitle: "Sin riesgo: dar tiempo a que suba el equipo",
      consequences: {},
      resolve: {
        baseChance: 0.65,
        statModifier: "media",
        success: { text: "Proteges el balón de espaldas hasta que llega apoyo y reinicias la jugada con calma.", consequences: { flags: flags("contained", "aguantar") } },
        fail: { text: "El central rival te roba el balón limpiamente por la espalda.", consequences: { forma: -1, flags: flags("beaten", "aguantar") } },
      },
    },
  ] },
  { mode: "aereo", build: (flags) => [
    {
      id: "cabezazo",
      label: "Rematar de cabeza al primer palo",
      subtitle: "Anticiparte al central en el salto",
      consequences: {},
      resolve: {
        baseChance: 0.36,
        statModifier: "media",
        success: { text: "Ganas el salto y el remate de cabeza se cuela ajustado al palo. ¡Gol!", consequences: { flags: flags("goal", "cabezazo") } },
        fail: { text: "El central salta más alto y despeja el peligro con autoridad.", consequences: { flags: flags("miss", "cabezazo") } },
      },
    },
    {
      id: "abrir-lateral",
      label: "Abrir el balón para el lateral que sube por banda",
      subtitle: "Ceder el protagonismo, buscar el centro después",
      consequences: {},
      resolve: {
        baseChance: 0.52,
        statModifier: "media",
        success: { text: "El balón llega perfecto a la carrera del lateral, que centra para el segundo palo.", consequences: { flags: flags("assist", "abrir_lateral") } },
        fail: { text: "El pase se queda corto y el rival corta la jugada antes de que llegue.", consequences: { flags: flags("miss", "abrir_lateral") } },
      },
    },
    {
      id: "recorte-interior",
      label: "Recortar hacia dentro buscando el ángulo de disparo",
      subtitle: "Todo o nada, sin pasar el balón",
      consequences: {},
      resolve: {
        baseChance: 0.3,
        statModifier: "media",
        success: { text: "El recorte deja sin sitio al defensa y el disparo se cuela ajustado. ¡Gol!", consequences: { fama: 2, flags: flags("wondergoal", "recorte_interior") } },
        fail: { text: "El recorte no sale limpio y pierdes el balón en el intento.", consequences: { forma: -1, flags: flags("miss_bad", "recorte_interior") } },
      },
    },
  ] },
  { mode: "suelo", build: (flags) => [
    {
      id: "vaselina",
      label: "Probar la vaselina por encima del portero adelantado",
      subtitle: "Todo o nada, para la galería",
      consequences: {},
      resolve: {
        baseChance: 0.27,
        statModifier: "media",
        success: { text: "La vaselina sale perfecta y el balón cae justo bajo el larguero. ¡Golazo!", consequences: { fama: 3, flags: flags("wondergoal", "vaselina") } },
        fail: { text: "Se te va larga, por encima del larguero. Ocasión desperdiciada.", consequences: { flags: flags("miss_bad", "vaselina") } },
      },
    },
    {
      id: "ceder-atras",
      label: "Cederla atrás para el que llega desde segunda línea",
      subtitle: "Confiar en que remate mejor colocado",
      consequences: {},
      resolve: {
        baseChance: 0.58,
        statModifier: "media",
        success: { text: "El compañero que llega desde atrás la manda dentro sin oposición. Asistencia perfecta.", consequences: { flags: flags("assist", "ceder_atras") } },
        fail: { text: "El pase atrás sale débil y el rival despeja antes de que llegue nadie.", consequences: { flags: flags("miss", "ceder_atras") } },
      },
    },
    {
      id: "proteger-esquina",
      label: "Proteger el balón pegado a la banda hasta ganar la falta",
      subtitle: "Sin riesgo: buscar los segundos, no el gol",
      consequences: {},
      resolve: {
        baseChance: 0.62,
        statModifier: "media",
        success: { text: "Proteges el balón con el cuerpo hasta que el rival comete falta. Buena gestión del tiempo.", consequences: { flags: flags("contained", "proteger_esquina") } },
        fail: { text: "Te presionan entre dos y pierdes el balón cerca de tu propio campo.", consequences: { forma: -1, flags: flags("beaten", "proteger_esquina") } },
      },
    },
  ] },
  { mode: "suelo", build: (flags) => [
    {
      id: "definicion-rasa",
      label: "Definir raso, pegado al palo contrario",
      subtitle: "Buscar la precisión antes que la potencia",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "El disparo raso se cuela pegado al palo, sin opción para el portero. ¡Gol!", consequences: { flags: flags("goal", "definicion_rasa") } },
        fail: { text: "El portero llega justo para desviar el disparo a córner.", consequences: { flags: flags("miss", "definicion_rasa") } },
      },
    },
    {
      id: "bajar-la-pelota",
      label: "Controlarla con calma antes de decidir",
      subtitle: "Ganar un segundo extra pensando la jugada",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "media",
        success: { text: "Controlas con calma y sirves un pase preciso a un compañero mejor colocado.", consequences: { flags: flags("assist", "bajar_la_pelota") } },
        fail: { text: "El control se te escapa un poco y el defensa aprovecha para despejar.", consequences: { flags: flags("miss", "bajar_la_pelota") } },
      },
    },
    {
      id: "simular-centro",
      label: "Amagar el centro y quedarte con el balón",
      subtitle: "Sorprender a la defensa con un cambio de idea",
      consequences: {},
      resolve: {
        baseChance: 0.33,
        statModifier: "media",
        success: { text: "El amago desconcierta a toda la defensa y te deja mano a mano con el portero. ¡Gol!", consequences: { fama: 2, flags: flags("wondergoal", "simular_centro") } },
        fail: { text: "Nadie se la compra y el rival corta la jugada sin problema.", consequences: { flags: flags("miss_bad", "simular_centro") } },
      },
    },
  ] },
  { mode: "suelo", build: (flags) => [
    {
      id: "picar-al-hueco",
      label: "Picar al hueco entre los dos centrales",
      subtitle: "Buscar el desmarque justo antes del pase",
      consequences: {},
      resolve: {
        baseChance: 0.38,
        statModifier: "media",
        success: { text: "Te vas al hueco justo a tiempo y te plantas solo ante el portero. ¡Gol!", consequences: { flags: flags("goal", "picar_al_hueco") } },
        fail: { text: "El linier levanta el banderín: fuera de juego.", consequences: { flags: flags("miss", "picar_al_hueco") } },
      },
    },
    {
      id: "bicicleta",
      label: "Intentar la chilena si el balón te queda en el aire",
      subtitle: "Todo o nada, jugada para el recuerdo",
      consequences: {},
      resolve: {
        baseChance: 0.22,
        statModifier: "media",
        success: { text: "La chilena sale perfecta. El estadio entero enmudece antes de explotar en gritos. ¡Golazo histórico!", consequences: { fama: 4, flags: flags("wondergoal", "bicicleta") } },
        fail: { text: "No conectas bien y el balón se marcha muy desviado. El banquillo se lleva las manos a la cabeza.", consequences: { forma: -2, flags: flags("miss_bad", "bicicleta") } },
      },
    },
    {
      id: "tocar-atras-primero",
      label: "Tocar atrás para reiniciar antes de atacar de nuevo",
      subtitle: "Sin riesgo: guardar la posesión del equipo",
      consequences: {},
      resolve: {
        baseChance: 0.7,
        statModifier: "media",
        success: { text: "El toque atrás es sencillo y el equipo reorganiza el ataque con calma.", consequences: { flags: flags("contained", "tocar_atras_primero") } },
        fail: { text: "El pase atrás sale mal y el rival roba el balón en una zona peligrosa.", consequences: { forma: -1, flags: flags("beaten", "tocar_atras_primero") } },
      },
    },
  ] },
  { mode: "aereo", build: (flags) => [
    {
      id: "remate-palomita",
      label: "Rematar en palomita, estirándote al máximo",
      subtitle: "Todo o nada por llegar al balón",
      consequences: {},
      resolve: {
        baseChance: 0.34,
        statModifier: "media",
        success: { text: "Te estiras al límite y conectas el remate. ¡Gol de palomita!", consequences: { fama: 2, flags: flags("goal", "remate_palomita") } },
        fail: { text: "No llegas por poco y el balón pasa rozando el larguero.", consequences: { flags: flags("miss", "remate_palomita") } },
      },
    },
    {
      id: "bajar-para-compañero",
      label: "Bajar a por el balón y servirlo de espaldas al área",
      subtitle: "Sacrificar tu ocasión por la de un compañero",
      consequences: {},
      resolve: {
        baseChance: 0.54,
        statModifier: "media",
        success: { text: "El taco de espaldas sale perfecto y un compañero remata solo. Asistencia de lujo.", consequences: { flags: flags("assist", "bajar_para_companero") } },
        fail: { text: "El taco se va desviado y el rival despeja sin problemas.", consequences: { flags: flags("miss", "bajar_para_companero") } },
      },
    },
  ] },
  { mode: "suelo", build: (flags) => [
    {
      id: "buscar-rebote",
      label: "Quedarte cerca esperando un posible rebote",
      subtitle: "Paciencia: estar en el sitio correcto",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "media",
        success: { text: "El rechace te cae perfecto y no perdonas desde cerca. ¡Gol!", consequences: { flags: flags("goal", "buscar_rebote") } },
        fail: { text: "El rechace se va lejos de ti, hacia un defensa rival.", consequences: { flags: flags("miss", "buscar_rebote") } },
      },
    },
    {
      id: "simular-quiebro",
      label: "Amagar el cuerpo hacia un lado y salir por el otro",
      subtitle: "Ganarte medio metro con un solo gesto",
      consequences: {},
      resolve: {
        baseChance: 0.37,
        statModifier: "media",
        success: { text: "El quiebro deja completamente sentado al defensa. Definición con toda tranquilidad. ¡Gol!", consequences: { fama: 2, flags: flags("goal", "simular_quiebro") } },
        fail: { text: "El defensa no se la compra y te cierra el disparo justo a tiempo.", consequences: { flags: flags("miss", "simular_quiebro") } },
      },
    },
  ] },
  { mode: "suelo", build: (flags) => [
    rollOpt(flags, "pica-portero", "Picar el balón por encima del portero", "Delicadeza con riesgo", 0.36,
      ["La pelota dibuja una parábola preciosa y se cuela por encima del guardameta. ¡Gol!", "goal"],
      ["El balón se queda corto y el portero lo atrapa sin esfuerzo.", "miss"]),
    rollOpt(flags, "cruzar-palo-largo", "Cruzar el disparo al palo largo", "Colocación antes que fuerza", 0.45,
      ["Lo colocas en el palo largo, lejos del alcance del portero. ¡Gol!", "goal"],
      ["Se te va ajustado, pero por fuera: el balón besa el poste y sale.", "miss"]),
    rollOpt(flags, "esperar-llegada", "Esperar a que llegue un compañero por detrás", "Un pase en el momento justo", 0.5,
      ["Esperas el desmarque justo y lo filtras: tu compañero marca sin oposición.", "assist"],
      ["Esperas demasiado: la defensa cierra y el pase llega tarde.", "miss"]),
  ] },
  { mode: "suelo", build: (flags) => [
    rollOpt(flags, "fingir-disparo", "Fingir el disparo y regatear al portero", "Sangre fría", 0.3,
      ["Tragas al portero con un amago de cine y empujas el balón a la red. ¡Qué clase!", "wondergoal"],
      ["El portero no pica y te arrebata el balón de los pies.", "miss_bad"], { fama: 3 }),
    rollOpt(flags, "zurda-obligada", "Disparar con la pierna que no es la tuya", "Sin tiempo para cambiar", 0.33,
      ["Sacas un zurdazo seco que el portero ni ve. ¡Gol!", "goal"],
      ["El golpeo sale flojo y el portero atrapa el balón.", "miss"]),
    rollOpt(flags, "ceder-derecha", "Ceder al compañero de la derecha", "Mejor posicionado que tú", 0.52,
      ["Se la cedes sin dudar y él define a placer.", "assist"],
      ["La cesión llega con retraso y el defensa la corta.", "miss"]),
  ] },
  { mode: "suelo", build: (flags) => [
    rollOpt(flags, "volea-botando", "Rematar de volea el balón botando", "Todo o nada", 0.35,
      ["La volea sale seca, imparable y se mete por la escuadra. ¡Golazo!", "goal"],
      ["Golpeas mal el bote y el balón se va muy alto.", "miss"]),
    rollOpt(flags, "pisar-hueco", "Pisar la pelota y buscar el hueco", "Una pausa que descoloca", 0.4,
      ["Pisas la pelota, el defensa se queda clavado y defines con calma.", "goal"],
      ["Pierdes un segundo y el defensa te cierra el ángulo.", "miss"]),
    rollOpt(flags, "girar-pase-muerte", "Girarte rápido y buscar el pase de la muerte", "Servir en lugar de rematar", 0.48,
      ["Te giras y pones un pase atrás perfecto; tu compañero no falla.", "assist"],
      ["El giro te deja sin ángulo y el pase sale mal.", "miss"]),
  ] },
  { mode: "suelo", build: (flags) => [
    rollOpt(flags, "raso-primer-palo", "Disparo raso al primer palo", "Rápido y directo", 0.44,
      ["Raso, seco y pegado al palo: el portero no llega. ¡Gol!", "goal"],
      ["El portero cierra el primer palo con el pie y evita el gol.", "miss"]),
    rollOpt(flags, "pared-compañero", "Hacer una pared con el compañero", "Juego combinado", 0.5,
      ["La pared sale redonda: te devuelven el balón dentro del área y asistes al segundo.", "assist"],
      ["La pared sale mal y el rival recupera el balón.", "miss"]),
    rollOpt(flags, "sombrero-defensa", "Intentar un sombrero al defensa", "Para la galería", 0.26,
      ["Sombrero perfecto: el defensa se queda mirando al cielo y tú marcas. ¡Genialidad!", "wondergoal"],
      ["El balón se te va largo y el defensa se queda con él.", "miss_bad"], { fama: 3 }),
  ] },
  { mode: "aereo", build: (flags) => [
    rollOpt(flags, "cabeza-picado", "Cabecear picado hacia el suelo", "Que bote antes del portero", 0.4,
      ["El cabezazo bota delante del portero y se cuela. ¡Gol!", "goal"],
      ["El cabezazo sale alto y se va por encima del larguero.", "miss"]),
    rollOpt(flags, "prolongar-cabeza", "Prolongar de cabeza para el compañero", "Servir en lugar de rematar", 0.5,
      ["Prolongas con inteligencia y tu compañero marca a placer.", "assist"],
      ["La prolongación se te va larga y sale por la línea de fondo.", "miss"]),
    rollOpt(flags, "atacar-balon-cuerpo", "Atacar el balón con todo el cuerpo", "Sin miedo al choque", 0.3,
      ["Te lanzas con todo, golpeas el balón con la frente y la mandas dentro. ¡Qué valor!", "goal"],
      ["El choque con el central te frena y el balón se va fuera.", "miss_bad"], { fama: 2 }),
  ] },
];

/**
 * El momento decisivo dentro del partido: antes esto no existía en
 * absoluto — el partido se resolvía entero de golpe y el jugador solo
 * podía reaccionar DESPUÉS (rueda de prensa, redes), nunca decidir algo
 * mientras el balón todavía estaba en juego. No hace falta IA aquí: son
 * siempre decisiones futbolísticas de verdad, con su propio riesgo/
 * recompensa vía el mecanismo `resolve` que ya usa el resto del juego.
 * El resultado se guarda en un flag y generateMatchDayEvent lo lee justo
 * después para que la crónica del partido sea coherente con lo que de
 * verdad pasó en esa jugada, no algo inventado aparte.
 *
 * Antes esto era SIEMPRE la misma terna (disparar/pasar/floritura),
 * fuera cual fuera la posición del jugador — un central o un portero
 * recibían literalmente "te plantas solo ante el portero" como si
 * fueran delanteros, partido tras partido. Visto en vivo jugando: con
 * varios partidos por temporada, esto se sentía como "el mismo evento
 * una y otra vez" mucho antes de lo que debería. Ahora la escena y las
 * tres opciones dependen de la posición real.
 */
