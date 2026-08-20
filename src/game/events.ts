import { archetypeMuted, archetypeWeight } from "./archetype";
import { clubById } from "./data";
import {
  achieve,
  avgRating,
  flag,
  hasTrait,
  injure,
  milestone,
  note,
  rel,
  stat,
  totalApps,
  totalGoals,
} from "./mutate";
import { BENCH_IDS, CALL_IDS, DEBUT_IDS, TALK_IDS, TRAIN_IDS, seenAny, storyWeight, variantOf } from "./story";
import type { EventCategory, GameEvent, GameState } from "./types";

const club = (s: GameState) => clubById(s.clubId).name;
const nick = (s: GameState) => s.player.nickname || s.player.name.split(" ")[0] || s.player.name;

/* =========================================================================
 * EVENTOS DE HISTORIA (priority >= 100): la columna vertebral de la carrera.
 * ========================================================================= */
const STORY: GameEvent[] = [
  {
    id: "st_first_training",
    kicker: "Capítulo 1 · 16 años",
    title: "El primer entrenamiento",
    image: "training",
    priority: 300,
    requires: (s) => s.age === 16 && variantOf(s, "train", 3) === 0,
    text: (s) =>
      `Primer día en la ciudad deportiva del ${club(s)}. Botas nuevas que aún hacen daño, veinte chavales que también fueron los mejores de su barrio y un segundo entrenador con una carpeta que apunta todo. Nadie sabe tu nombre todavía.`,
    choices: [
      {
        id: "callar",
        label: "Trabajar en silencio y observar",
        hint: "Cabeza baja, primeras impresiones sólidas",
        outcome: "No brillas, pero el cuerpo técnico apunta 'serio' junto a tu nombre.",
        apply: (s) => {
          rel(s, "coach", 5);
          stat(s, "discipline", 6);
        },
      },
      {
        id: "mostrar",
        label: "Pedir el balón desde el primer rondo",
        hint: "Riesgo alto, atención inmediata",
        outcome: "Pierdes dos balones y ganas un caño. El grupo se ríe contigo, no de ti.",
        apply: (s) => {
          rel(s, "dressing", 7);
          stat(s, "form", 4);
          rel(s, "coach", -2);
        },
      },
      {
        id: "presentarse",
        label: "Presentarte uno a uno a todo el vestuario",
        hint: "Construir grupo desde el minuto cero",
        outcome: "Sales del vestuario con tres números de teléfono y un mote provisional.",
        apply: (s) => {
          rel(s, "dressing", 10);
          stat(s, "morale", 5);
        },
      },
    ],
  },
  {
    id: "st_coach_talk",
    kicker: "Capítulo 1 · 16 años",
    title: "Conversación con el entrenador",
    image: "locker",
    priority: 280,
    requires: (s) => s.age <= 17 && seenAny(s, TRAIN_IDS) && !seenAny(s, TALK_IDS) && variantOf(s, "talk", 3) === 0,
    text: (s) =>
      `El míster del juvenil te llama al despacho. "Aquí nadie juega por lo que hizo en su pueblo, ${nick(s)}. Dime qué quieres ser en seis meses."`,
    choices: [
      {
        id: "titular",
        label: "\"Titular. Aunque haya que esperar.\"",
        outcome: "Asiente. Le gusta la ambición cuando viene con la palabra 'esperar' detrás.",
        apply: (s) => {
          rel(s, "coach", 8);
          stat(s, "morale", 4);
        },
      },
      {
        id: "aprender",
        label: "\"Aprender todo lo que pueda.\"",
        outcome: "\"Buena respuesta. Empieza mañana media hora antes.\"",
        apply: (s) => {
          rel(s, "coach", 5);
          stat(s, "overall", 1);
          stat(s, "discipline", 5);
        },
      },
      {
        id: "mejor",
        label: "\"Ser el mejor de esta cantera.\"",
        outcome: "Levanta una ceja. \"Eso lo dicen todos en septiembre. Te veo en marzo.\"",
        apply: (s) => {
          rel(s, "coach", -3);
          stat(s, "morale", 8);
          stat(s, "fame", 2);
        },
      },
    ],
  },
  {
    id: "st_studies",
    kicker: "Capítulo 1 · Casa",
    title: "Los estudios y la mesa de la cocina",
    image: "family",
    priority: 260,
    requires: (s) => s.age <= 17 && (seenAny(s, TALK_IDS) || seenAny(s, TRAIN_IDS)),
    text: () =>
      `Tu madre pone la carpeta del instituto sobre la mesa. "El fútbol sí, pero el bachillerato también." Tu padre no dice nada, que es su forma de decir que está de acuerdo.`,
    choices: [
      {
        id: "compaginar",
        label: "Prometer compaginar ambos",
        hint: "Cansa, pero la familia respira",
        outcome: "Duermes menos, pero en casa hay paz.",
        apply: (s) => {
          rel(s, "family", 10);
          stat(s, "fitness", -4);
          flag(s, "estudia");
        },
      },
      {
        id: "todo_futbol",
        label: "Apostarlo todo al fútbol",
        hint: "Sin red de seguridad",
        outcome: "Silencio largo. Tu madre recoge la carpeta despacio.",
        apply: (s) => {
          rel(s, "family", -12);
          stat(s, "overall", 1);
          stat(s, "morale", -3);
          flag(s, "sinplanb");
        },
      },
      {
        id: "negociar",
        label: "Negociar: un curso más y ya veremos",
        outcome: "Aplazar también es una decisión, y en tu casa lo saben.",
        apply: (s) => {
          rel(s, "family", 3);
          stat(s, "discipline", 2);
        },
      },
    ],
  },
  {
    id: "st_first_call",
    kicker: "Capítulo 2 · Convocatoria",
    title: "Tu nombre en la lista",
    image: "locker",
    priority: 250,
    requires: (s) =>
      s.stage === "youth" && !s.flags["listed"] && !seenAny(s, CALL_IDS) && variantOf(s, "call", 2) === 0 &&
      (s.rel.coach >= 48 || (s.flags["semanas"] ?? 0) >= 3 || seenAny(s, TALK_IDS)),
    text: (s) =>
      `Papel impreso en la puerta del vestuario. Dieciocho nombres. El tuyo está el último, escrito a mano porque lo añadieron después. ${nick(s)} viaja el sábado.`,
    choices: [
      {
        id: "foto",
        label: "Hacer una foto y mandarla a casa",
        outcome: "Tu madre la imprime. Sigue en la nevera años después.",
        apply: (s) => {
          rel(s, "family", 8);
          stat(s, "morale", 6);
          flag(s, "listed");
          achieve(s, "primera_convocatoria");
          milestone(s, "Primera convocatoria con el juvenil.");
        },
      },
      {
        id: "disimular",
        label: "Disimular delante de los que no están",
        hint: "El vestuario también se gana así",
        outcome: "Dos compañeros que se quedaron fuera te lo agradecen sin decirlo.",
        apply: (s) => {
          rel(s, "dressing", 9);
          stat(s, "morale", 3);
          flag(s, "listed");
          achieve(s, "primera_convocatoria");
          milestone(s, "Primera convocatoria con el juvenil.");
        },
      },
    ],
  },
  {
    id: "st_bench",
    kicker: "Capítulo 2 · Banquillo",
    title: "Noventa minutos sentado",
    image: "match",
    priority: 240,
    requires: (s) => !!s.flags["listed"] && !s.flags["status"] && !seenAny(s, BENCH_IDS) && variantOf(s, "bench", 2) === 0,
    text: () =>
      `Calientas tres veces. A la tercera te quitas el peto convencido, y el míster mira hacia otro lado. Final del partido. Cero minutos y el frío metido en las piernas.`,
    choices: [
      {
        id: "preguntar",
        label: "Preguntarle al míster qué te falta",
        outcome: "\"Ritmo en los últimos veinte metros. Y paciencia, que la tienes justa.\"",
        apply: (s) => {
          rel(s, "coach", 6);
          stat(s, "overall", 1);
        },
      },
      {
        id: "tragar",
        label: "Tragar y quedarte a tirar a puerta después",
        outcome: "El utillero apaga las luces contigo dentro. Eso se cuenta en el club.",
        apply: (s) => {
          stat(s, "overall", 1);
          stat(s, "form", 5);
          rel(s, "coach", 4);
          stat(s, "fitness", -3);
        },
      },
      {
        id: "cabreo",
        label: "Irte al vestuario dando un portazo",
        outcome: "Alguien lo ve. En este club, todo se ve.",
        apply: (s) => {
          rel(s, "coach", -10);
          stat(s, "discipline", -10);
          stat(s, "morale", 4);
          flag(s, "conflictivo");
        },
      },
    ],
  },
  {
    id: "st_youth_debut",
    kicker: "Capítulo 2 · Debut",
    title: "\"Calienta, entras tú\"",
    image: "tunnel",
    priority: 230,
    requires: (s) =>
      s.stage === "youth" && !!s.flags["listed"] && !s.flags["status"] && seenAny(s, BENCH_IDS) &&
      !seenAny(s, DEBUT_IDS) && variantOf(s, "debut", 3) === 0,
    text: (s) =>
      `Minuto 63, 1-0 abajo. El segundo entrenador grita tu apellido mal pronunciado. Te levantas y las piernas no son tuyas. Debut oficial con el juvenil del ${clubById(s.clubId).short}.`,
    choices: [
      {
        id: "simple",
        label: "Jugar sencillo: primer toque y a correr",
        outcome: "Nueve pases, nueve buenos. Nadie te nota, que a veces es el mejor debut.",
        apply: (s) => {
          flag(s, "status", 1);
          rel(s, "coach", 7);
          stat(s, "overall", 2);
          achieve(s, "debut_juvenil");
          milestone(s, "Debut oficial con el juvenil.");
        },
      },
      {
        id: "encarar",
        label: "Encarar en la primera que toques",
        outcome: "Te la quitan, la recuperas y la vuelves a pedir. La grada pequeña se fija.",
        apply: (s) => {
          flag(s, "status", 1);
          rel(s, "fans", 8);
          stat(s, "form", 8);
          rel(s, "coach", -2);
          stat(s, "overall", 2);
          achieve(s, "debut_juvenil");
          milestone(s, "Debut oficial con el juvenil.");
        },
      },
    ],
  },
  {
    id: "st_starter",
    kicker: "Capítulo 3 · Titularidad",
    title: "El once de la pizarra",
    image: "locker",
    priority: 220,
    requires: (s) => s.stage === "youth" && s.flags["status"] === 1 && totalApps(s) >= 6 && s.rel.coach >= 54,
    text: (s) =>
      `El míster dibuja el once en la pizarra y tu apellido aparece arriba, no en la lista de abajo. "${nick(s)} juega. Y juega hasta que me demuestre lo contrario."`,
    choices: [
      {
        id: "asumir",
        label: "Asumir galones y hablar en el corrillo",
        outcome: "Algunos veteranos aprietan la mandíbula. Otros te siguen.",
        apply: (s) => {
          flag(s, "status", 2);
          rel(s, "dressing", 4);
          stat(s, "morale", 8);
          achieve(s, "titular_juvenil");
          milestone(s, "Titular indiscutible en el juvenil.");
        },
      },
      {
        id: "humilde",
        label: "Seguir siendo el que recoge los conos",
        outcome: "El utillero te dice que eres el primer titular que lo hace en años.",
        apply: (s) => {
          flag(s, "status", 2);
          rel(s, "dressing", 10);
          rel(s, "coach", 5);
          achieve(s, "titular_juvenil");
          milestone(s, "Titular indiscutible en el juvenil.");
        },
      },
    ],
  },
  {
    id: "st_agent",
    kicker: "Capítulo 3 · Representante",
    title: "Un café que no pediste",
    image: "agent",
    priority: 210,
    requires: (s) =>
      !s.hasAgent && s.flags["status"] === 2 && (totalApps(s) >= 10 || avgRating(s) >= 6.8) && s.age >= 16,
    text: (s) =>
      `Te espera fuera del aparcamiento. Traje sin corbata, carpeta fina. "${s.agentName}. Llevo a cuatro chicos, ninguno famoso todavía. No te voy a prometer el Bernabéu; te voy a conseguir que no te tomen el pelo con tu primer contrato."`,
    choices: [
      {
        id: "firmar",
        label: "Firmar con él",
        hint: "Mejores contratos, menos control",
        outcome: "Te da la mano y ya está haciendo llamadas antes de llegar a su coche.",
        apply: (s) => {
          s.hasAgent = true;
          rel(s, "agent", 60);
          stat(s, "fame", 4);
          achieve(s, "representante");
          milestone(s, `Firma con el representante ${s.agentName}.`);
        },
      },
      {
        id: "consultar",
        label: "Consultarlo con tu familia primero",
        hint: "Prudente y lento",
        outcome: "Tu padre pide ver papeles. El representante vuelve dos semanas después, con papeles.",
        apply: (s) => {
          s.hasAgent = true;
          rel(s, "agent", 45);
          rel(s, "family", 12);
          achieve(s, "representante");
          milestone(s, `Firma con el representante ${s.agentName}, con la familia delante.`);
        },
      },
      {
        id: "rechazar",
        label: "Rechazarlo: aún no toca",
        hint: "Sin intermediarios, por ahora",
        outcome: "\"Guarda mi número. Lo vas a usar.\"",
        apply: (s) => {
          flag(s, "agente_rechazado");
          rel(s, "agent", 10);
          stat(s, "morale", -2);
        },
      },
    ],
  },
  {
    id: "st_agent_return",
    kicker: "Capítulo 3 · Representante",
    title: "El número que guardaste",
    image: "agent",
    priority: 205,
    requires: (s) => !s.hasAgent && !!s.flags["agente_rechazado"] && (s.age >= 17 || totalApps(s) >= 18),
    text: (s) =>
      `${s.agentName} vuelve, esta vez con una oferta concreta de renovación sobre la mesa y una frase incómoda: "Sin mí, el club te va a ofrecer la mitad de esto."`,
    choices: [
      {
        id: "aceptar",
        label: "Aceptar ahora sí",
        outcome: "Sonríe sin celebrar. Ya lo daba por hecho.",
        apply: (s) => {
          s.hasAgent = true;
          rel(s, "agent", 55);
          achieve(s, "representante");
          milestone(s, `Firma con el representante ${s.agentName}.`);
        },
      },
      {
        id: "solo",
        label: "Seguir solo, con tu padre como asesor",
        outcome: "Es más lento y más barato. Y duermes bien.",
        apply: (s) => {
          rel(s, "family", 10);
          stat(s, "morale", 3);
          flag(s, "sin_agente_definitivo");
        },
      },
    ],
  },
  {
    id: "st_first_contract",
    kicker: "Capítulo 4 · Contrato",
    title: "Primer contrato profesional",
    image: "agent",
    priority: 200,
    requires: (s) => !s.contract && s.age >= 17 && s.flags["status"] === 2,
    text: (s) =>
      `Despacho pequeño, aire acondicionado a tope. El director deportivo del ${clubById(s.clubId).short} desliza tres folios. Contrato hasta los 21, ficha modesta, cláusula que suena a broma pesada.`,
    choices: [
      {
        id: "firmar_largo",
        label: "Firmar largo: seguridad para tu casa",
        outcome: "Tu madre llora en el pasillo. Tú finges que no lo ves.",
        apply: (s) => {
          s.contract = "Hasta los 21";
          s.salary = 1200;
          rel(s, "family", 12);
          rel(s, "coach", 4);
          stat(s, "morale", 8);
          achieve(s, "primer_contrato");
          milestone(s, "Primer contrato profesional firmado.");
        },
      },
      {
        id: "corto",
        label: "Pedir contrato corto y cláusula baja",
        hint: "Más libertad, más riesgo",
        outcome: "El club acepta a regañadientes. Ahora tienes dos años para explotar.",
        apply: (s) => {
          s.contract = "Corto (2 años)";
          s.salary = 900;
          rel(s, "agent", 8);
          rel(s, "coach", -4);
          stat(s, "fame", 3);
          flag(s, "contrato_corto");
          achieve(s, "primer_contrato");
          milestone(s, "Primer contrato profesional, corto y con cláusula baja.");
        },
      },
      {
        id: "mas_dinero",
        label: "Exigir más dinero ahora",
        hint: "Depende mucho de tu representante",
        outcome: (s) =>
          s.hasAgent
            ? "Tu representante entra en la sala y sale con un 40% más. El club no lo olvida."
            : "Sin nadie que negocie por ti, el club se levanta de la mesa un rato. Vuelven con lo mismo.",
        apply: (s) => {
          if (s.hasAgent) {
            s.contract = "Hasta los 21 (mejorado)";
            s.salary = 1900;
            rel(s, "agent", 10);
            rel(s, "coach", -6);
          } else {
            s.contract = "Hasta los 21";
            s.salary = 1100;
            rel(s, "coach", -8);
            stat(s, "morale", -4);
          }
          achieve(s, "primer_contrato");
          milestone(s, "Primer contrato profesional firmado.");
        },
      },
    ],
  },
  {
    id: "st_reserves",
    kicker: "Capítulo 5 · Filial",
    title: "Te suben al filial",
    image: "tunnel",
    priority: 190,
    requires: (s) => s.stage === "youth" && s.age >= 17 && s.overall >= 60 && s.flags["status"] === 2 && totalApps(s) >= 16,
    text: (s) =>
      `Otro vestuario, otro olor. Hombres de 26 años que juegan por la hipoteca y no por el sueño. El filial del ${clubById(s.clubId).short} no perdona los adornos.`,
    choices: [
      {
        id: "adaptar",
        label: "Adaptar tu juego al ritmo de los mayores",
        outcome: "Menos regates, más pases a un toque. Sobrevives, que ya es mucho.",
        apply: (s) => {
          s.stage = "reserves";
          s.flags["status"] = 1;
          stat(s, "overall", 2);
          rel(s, "coach", 5);
          rel(s, "dressing", -5);
          achieve(s, "filial");
          milestone(s, "Ascenso al filial.");
        },
      },
      {
        id: "imponer",
        label: "Imponer tu juego desde el primer día",
        outcome: "Un central de 30 años te deja una marca en el gemelo como bienvenida.",
        apply: (s) => {
          s.stage = "reserves";
          s.flags["status"] = 1;
          stat(s, "form", 6);
          stat(s, "fitness", -8);
          rel(s, "dressing", -10);
          rel(s, "fans", 5);
          achieve(s, "filial");
          milestone(s, "Ascenso al filial.");
        },
      },
    ],
  },
  {
    id: "st_train_first",
    kicker: "Capítulo 6 · Primer equipo",
    title: "Entrenas con los mayores",
    image: "training",
    priority: 180,
    requires: (s) => s.stage === "reserves" && s.overall >= 65 && !s.flags["trained_first"] && totalApps(s) >= 24,
    text: (s) =>
      `Una llamada a las ocho de la mañana: faltan efectivos arriba. Vestuario del primer equipo, taquilla prestada, y un internacional que te dice "buenos días" como si fueras alguien. ${nick(s)}, hoy no la pierdas.`,
    choices: [
      {
        id: "seguro",
        label: "Jugar a lo seguro y no fallar nada",
        outcome: "El entrenador no dice tu nombre, pero pide que vuelvas mañana.",
        apply: (s) => {
          flag(s, "trained_first");
          rel(s, "coach", 8);
          stat(s, "overall", 2);
          achieve(s, "entreno_mayores");
          milestone(s, "Primer entrenamiento con el primer equipo.");
        },
      },
      {
        id: "atrever",
        label: "Atreverte a hacerle un caño al capitán",
        outcome: "Silencio de dos segundos. Luego, carcajada general. Y una patada de recuerdo.",
        apply: (s) => {
          flag(s, "trained_first");
          rel(s, "dressing", 10);
          stat(s, "fame", 6);
          rel(s, "coach", -3);
          achieve(s, "entreno_mayores");
          milestone(s, "Primer entrenamiento con el primer equipo (y un caño al capitán).");
        },
      },
    ],
  },
  {
    id: "st_pro_debut",
    kicker: "Capítulo 6 · Debut",
    title: "Debut profesional",
    image: "tunnel",
    priority: 175,
    requires: (s) => s.stage === "reserves" && !!s.flags["trained_first"] && s.overall >= 66 && s.rel.coach >= 55,
    text: (s) =>
      `Lista del primer equipo. Tu nombre entre veteranos. Minuto 78, el cuarto árbitro levanta el cartel y el estadio del ${clubById(s.clubId).short} hace ese ruido raro que es mitad curiosidad, mitad esperanza.`,
    choices: [
      {
        id: "correr",
        label: "Correr como si te fuera la vida",
        outcome: "Doce minutos, once carreras, una falta forzada. La grada te aplaude al acabar.",
        apply: (s) => {
          s.stage = "first";
          s.flags["status"] = 1;
          rel(s, "fans", 12);
          rel(s, "coach", 6);
          stat(s, "fame", 12);
          stat(s, "overall", 2);
          achieve(s, "debut_pro");
          milestone(s, "DEBUT PROFESIONAL con el primer equipo.");
        },
      },
      {
        id: "jugar",
        label: "Pedir balón y jugar sin miedo",
        outcome: "Dos toques de calidad y una pérdida. La radio local te nombra tres veces.",
        apply: (s) => {
          s.stage = "first";
          s.flags["status"] = 1;
          rel(s, "fans", 8);
          stat(s, "fame", 15);
          stat(s, "form", 6);
          stat(s, "overall", 3);
          achieve(s, "debut_pro");
          milestone(s, "DEBUT PROFESIONAL con el primer equipo.");
        },
      },
    ],
  },
];

/* =========================================================================
 * EVENTOS AMBIENTALES: color, riesgo y humor. Se filtran por requisitos.
 * ========================================================================= */
const AMBIENT: GameEvent[] = [
  {
    id: "am_gym",
    kicker: "Rutina",
    title: "El plan de gimnasio",
    image: "training",
    requires: (s) => s.age <= 19,
    text: () => `El preparador físico te enseña un plan de fuerza. "Sin esto, en dos años te parten en dos."`,
    choices: [
      { id: "seguir", label: "Seguirlo a rajatabla", outcome: "Duele. Funciona.", apply: (s) => { stat(s, "fitness", 10); stat(s, "overall", 1); stat(s, "morale", -2); } },
      { id: "medias", label: "Hacerlo a medias, priorizar el balón", outcome: "Más técnica, cuerpo más frágil.", apply: (s) => { stat(s, "overall", 1); stat(s, "fitness", -6); } },
    ],
  },
  {
    id: "am_broma",
    kicker: "Vestuario",
    title: "La novatada",
    image: "locker",
    requires: (s) => s.rel.dressing >= 40,
    text: (s) =>
      `Alguien ha llenado tus botas de espuma de afeitar y ha escrito "${nick(s)} DEBE CANTAR" en el espejo con desodorante. Veinte tíos esperan de pie encima de los bancos.`,
    choices: [
      { id: "cantar", label: "Cantar de pie sobre el banco", outcome: "Desafinas horrores. Te aplauden de pie. Ya eres del grupo.", apply: (s) => { rel(s, "dressing", 14); stat(s, "morale", 6); } },
      { id: "vengarse", label: "Aceptar y planear venganza", outcome: "Al día siguiente el capitán encuentra su coche envuelto en film transparente.", apply: (s) => { rel(s, "dressing", 8); stat(s, "discipline", -4); stat(s, "morale", 4); } },
      { id: "ignorar", label: "Cambiarte en silencio y salir", outcome: "El vestuario se queda frío. Nadie insiste, pero nadie olvida.", apply: (s) => { rel(s, "dressing", -10); stat(s, "discipline", 3); } },
    ],
  },
  {
    id: "am_bus",
    kicker: "Surrealismo",
    title: "El autobús y la cabra",
    image: "match",
    requires: (s) => s.age <= 18,
    text: () =>
      `El autobús del desplazamiento se para en una carretera comarcal porque hay una cabra en medio que no piensa moverse. El delegado intenta razonar con ella durante once minutos. Alguien lo graba.`,
    choices: [
      { id: "ayudar", label: "Bajarte a ayudar al delegado", outcome: "La cabra te embiste suavemente. El vídeo tiene 40.000 visitas el lunes.", apply: (s) => { rel(s, "dressing", 8); stat(s, "fame", 5); stat(s, "morale", 5); } },
      { id: "dormir", label: "Seguir durmiendo con los cascos puestos", outcome: "Te despiertas ya en el campo, descansado y ajeno a la leyenda.", apply: (s) => { stat(s, "fitness", 5); rel(s, "dressing", -2); } },
    ],
  },
  {
    id: "am_school_exam",
    kicker: "Casa",
    title: "Examen el lunes",
    image: "family",
    requires: (s) => !!s.flags["estudia"] && s.age <= 18,
    text: () => `Examen de historia el lunes, partido el domingo a 300 km. La carpeta te mira desde la mochila.`,
    choices: [
      { id: "estudiar", label: "Estudiar en el autobús", outcome: "Apruebas raspado. Tu madre lo cuenta en el trabajo.", apply: (s) => { rel(s, "family", 8); stat(s, "form", -3); } },
      { id: "dormir", label: "Dormir y centrarte en el partido", outcome: "Suspendes. Juegas bien.", apply: (s) => { rel(s, "family", -8); stat(s, "form", 6); } },
    ],
  },
  {
    id: "am_scout",
    kicker: "Rumores",
    title: "El hombre de la libreta",
    image: "match",
    requires: (s) => s.overall >= 58 && s.age <= 20,
    text: () => `Un tipo con abrigo largo lleva tres partidos en la misma esquina de la grada. No aplaude nunca. Solo apunta.`,
    choices: [
      { id: "ignorar", label: "Ignorarlo y jugar tu partido", outcome: "Buena decisión: sigue viniendo.", apply: (s) => { stat(s, "form", 4); rel(s, "coach", 2); } },
      { id: "impresionar", label: "Intentar impresionarlo", outcome: "Te sales del guion. El míster te cambia en el 60'.", apply: (s) => { stat(s, "form", -6); rel(s, "coach", -5); stat(s, "fame", 4); } },
    ],
  },
  {
    id: "am_gossip",
    kicker: "Prensa rosa",
    title: "Una foto fuera de contexto",
    image: "agent",
    requires: (s) => s.fame >= 35,
    text: (s) =>
      `Una cuenta de cotilleos publica una foto tuya saliendo de una discoteca a las cuatro. En realidad estabas recogiendo a tu prima. Nadie pregunta. 12.000 comentarios sobre ${nick(s)}.`,
    choices: [
      { id: "explicar", label: "Explicarlo con calma en redes", outcome: "Media afición te cree. La otra media ya tenía opinión.", apply: (s) => { rel(s, "fans", 4); stat(s, "morale", -3); } },
      { id: "silencio", label: "No decir nada", outcome: "En cuatro días hay otro escándalo. El fútbol siempre da otro.", apply: (s) => { stat(s, "fame", 4); rel(s, "coach", -2); } },
      { id: "broma", label: "Publicar una foto con tu prima riéndote del tema", outcome: "Se vuelve viral en el buen sentido. El club respira.", apply: (s) => { stat(s, "fame", 8); rel(s, "fans", 8); rel(s, "coach", -3); } },
    ],
  },
  {
    id: "am_injury_small",
    kicker: "Enfermería",
    title: "Un pinchazo en el isquio",
    image: "injury",
    requires: (s) => s.fitness <= 62 && !s.injury,
    text: () => `Notas un pinchazo al acelerar. No es rotura, pero el fisio pone esa cara que ya conoces.`,
    choices: [
      { id: "parar", label: "Parar dos semanas", outcome: "Aburrido, correcto, sano.", apply: (s) => { injure(s, 2, "Sobrecarga en el isquiotibial"); rel(s, "coach", 3); } },
      { id: "infiltrar", label: "Apretar los dientes y jugar", outcome: "Juegas. Y el cuerpo pasa factura.", apply: (s) => { stat(s, "fitness", -12); stat(s, "form", -5); rel(s, "coach", 4); flag(s, "forzo_lesion"); } },
    ],
  },
  {
    id: "am_injury_big",
    kicker: "Enfermería",
    title: "Ruido en la rodilla",
    image: "injury",
    requires: (s) => !s.injury && (s.flags["forzo_lesion"] === 1 || s.fitness <= 45) && s.age >= 17,
    text: () => `Caes mal tras un salto tonto en un entrenamiento cualquiera. No hay contacto. Esas son las peores.`,
    choices: [
      { id: "asumir", label: "Asumir la baja larga y hacer las cosas bien",
        outcome: "Ocho semanas. Gimnasio, piscina, silencio.",
        apply: (s) => { injure(s, 8, "Esguince grave de rodilla"); rel(s, "family", 6); s.flags["forzo_lesion"] = 0; } },
      { id: "atajar", label: "Buscar un atajo con un preparador externo",
        outcome: "Vuelves antes. Tu rodilla no opina lo mismo.",
        apply: (s) => { injure(s, 5, "Esguince grave de rodilla (recuperación exprés)"); stat(s, "fitness", -10); flag(s, "rodilla_fragil"); } },
    ],
  },
  {
    id: "am_return",
    kicker: "Vuelta",
    title: "El primer día sin muletas",
    image: "training",
    requires: (s) => !s.injury && !!s.flags["volvio_pendiente"],
    text: () => `Vuelves al grupo. Todos han seguido sin ti y eso es lo que más duele. El balón pesa distinto.`,
    choices: [
      { id: "paciencia", label: "Ir poco a poco", outcome: "Tres semanas después estás entero.", apply: (s) => { s.flags["volvio_pendiente"] = 0; stat(s, "fitness", 12); achieve(s, "superviviente"); } },
      { id: "prisa", label: "Ir a por todas desde el primer rondo", outcome: "El fisio te grita. Tú sonríes. Aguanta.", apply: (s) => { s.flags["volvio_pendiente"] = 0; stat(s, "form", 8); stat(s, "fitness", -5); achieve(s, "superviviente"); } },
    ],
  },
  {
    id: "am_fans_banner",
    kicker: "Afición",
    title: "Una pancarta con tu nombre",
    image: "match",
    requires: (s) => s.rel.fans >= 62,
    text: (s) => `En el fondo aparece una pancarta pequeña, hecha con una sábana: "${nick(s)}, UNO DE LOS NUESTROS".`,
    choices: [
      { id: "saludar", label: "Ir a saludar al final del partido", outcome: "Se vuelven locos. Eso ya no se te olvida.", apply: (s) => { rel(s, "fans", 10); stat(s, "morale", 8); } },
      { id: "camiseta", label: "Regalarles tu camiseta", outcome: "El utillero te riñe. La afición te adopta.", apply: (s) => { rel(s, "fans", 14); rel(s, "dressing", 3); } },
    ],
  },
  {
    id: "am_fans_whistle",
    kicker: "Afición",
    title: "Pitos en tu cambio",
    image: "match",
    requires: (s) => s.form <= 40 && s.rel.fans <= 55,
    text: () => `Te cambian en el 58' y suenan pitos. No son muchos, pero se oyen todos.`,
    choices: [
      { id: "aplaudir", label: "Aplaudir a la grada al salir", outcome: "Baja el ruido. Alguien empieza a aplaudir.", apply: (s) => { rel(s, "fans", 8); stat(s, "morale", -2); } },
      { id: "gesto", label: "Hacer un gesto de fastidio", outcome: "Mala idea. Mañana está en portada local.", apply: (s) => { rel(s, "fans", -12); stat(s, "fame", 5); rel(s, "coach", -5); } },
      { id: "nada", label: "Sentarte y mirar al suelo", outcome: "Nadie sabe qué piensas. Tú tampoco.", apply: (s) => { stat(s, "morale", -6); stat(s, "form", -3); } },
    ],
  },
  {
    id: "am_capitan",
    kicker: "Vestuario",
    title: "El veterano que ya no juega",
    image: "locker",
    requires: (s) => s.stage !== "youth",
    text: () => `Un compañero de 31 años, al que le has quitado el sitio, se sienta a tu lado y no dice nada durante un minuto largo. Luego: "Disfrútalo. Se acaba antes de lo que crees."`,
    choices: [
      { id: "escuchar", label: "Escucharle y preguntarle por su carrera", outcome: "Te cuenta más en veinte minutos que cualquier curso.", apply: (s) => { rel(s, "dressing", 12); stat(s, "overall", 1); } },
      { id: "incomodo", label: "Cortar la conversación, te incomoda", outcome: "Se levanta. No vuelve a sentarse ahí.", apply: (s) => { rel(s, "dressing", -6); } },
    ],
  },
  {
    id: "am_boots",
    kicker: "Negocio",
    title: "Un contrato de botas",
    image: "agent",
    requires: (s) => s.fame >= 25,
    text: (s) =>
      s.hasAgent
        ? `${s.agentName} llama eufórico: una marca mediana quiere ponerte botas gratis y 400 € al mes por publicar dos veces.`
        : `Un comercial te aborda tras un partido: botas gratis a cambio de publicaciones. No hay papeles, solo una tarjeta.`,
    choices: [
      { id: "aceptar", label: "Aceptar", outcome: "Botas nuevas cada dos meses. Y una obligación más.", apply: (s) => { s.salary += 400; stat(s, "fame", 6); rel(s, "agent", 6); rel(s, "coach", -2); } },
      { id: "rechazar", label: "Rechazar: primero el fútbol", outcome: "El míster se entera y le encanta.", apply: (s) => { rel(s, "coach", 8); stat(s, "discipline", 5); } },
    ],
  },
  {
    id: "am_agent_push",
    kicker: "Representante",
    title: "\"Aquí te vas a pudrir\"",
    image: "agent",
    requires: (s) => s.hasAgent && s.rel.coach <= 45 && s.age >= 17,
    text: (s) => `${s.agentName} es tajante: "Hay un club de Segunda que te quiere cedido. Aquí ese entrenador no te va a poner nunca."`,
    choices: [
      { id: "hacerle_caso", label: "Escucharle y pedir salida", outcome: "El club se molesta. El plan sigue adelante en segundo plano.", apply: (s) => { rel(s, "agent", 10); rel(s, "coach", -10); flag(s, "pide_salida"); } },
      { id: "quedarse", label: "Quedarte y pelear el puesto", outcome: "\"Tú sabrás. Yo cobro igual.\"", apply: (s) => { rel(s, "agent", -8); rel(s, "coach", 6); stat(s, "morale", 4); } },
      { id: "familia", label: "Consultarlo en casa", outcome: "Tu padre: \"Si te vas, que sea a jugar, no a huir.\"", apply: (s) => { rel(s, "family", 8); stat(s, "morale", 3); } },
    ],
  },
  {
    id: "am_coach_criticism",
    kicker: "Entrenador",
    title: "Vídeo en la sala",
    image: "locker",
    requires: (s) => s.form <= 45,
    text: () => `El míster pone tu error en la pantalla grande delante de todos. Cuatro veces. A cámara lenta.`,
    choices: [
      { id: "asumir", label: "Asumirlo delante del grupo", outcome: "\"Bien. Al siguiente.\" El grupo respeta eso.", apply: (s) => { rel(s, "coach", 8); rel(s, "dressing", 6); stat(s, "morale", -4); } },
      { id: "responder", label: "Responderle que el error fue del lateral", outcome: "Silencio incómodo de cinco segundos que dura toda la semana.", apply: (s) => { rel(s, "coach", -12); rel(s, "dressing", -8); stat(s, "morale", 3); } },
      { id: "callar", label: "Callar y hervir por dentro", outcome: "Entrenas con rabia. Funciona a corto plazo.", apply: (s) => { stat(s, "form", 6); stat(s, "morale", -6); } },
    ],
  },
  {
    id: "am_family_money",
    kicker: "Casa",
    title: "La nómina de tu padre",
    image: "family",
    requires: (s) => !!s.contract && s.age >= 17,
    text: () => `En casa las cuentas no salen este mes. Tú ya cobras algo, poco, pero algo.`,
    choices: [
      { id: "ayudar", label: "Dar parte de tu ficha a tus padres", outcome: "Tu padre lo rechaza dos veces y lo acepta a la tercera.", apply: (s) => { rel(s, "family", 16); s.salary = Math.max(300, Math.round(s.salary * 0.7)); stat(s, "morale", 5); } },
      { id: "ahorrar", label: "Ahorrar: nadie sabe cuánto dura esto", outcome: "Frío, sensato, correcto.", apply: (s) => { rel(s, "family", -5); stat(s, "discipline", 6); } },
    ],
  },
  {
    id: "am_night_out",
    kicker: "Tentación",
    title: "Cumpleaños a mitad de semana",
    image: "locker",
    requires: (s) => s.age >= 17,
    text: () => `Cumple de un amigo del barrio, miércoles, y entrenamiento a las 9:30. Te insisten por el grupo cada diez minutos.`,
    choices: [
      { id: "ir", label: "Ir un rato y volver pronto", outcome: "Vuelves a la una. Al día siguiente se nota un poco.", apply: (s) => { stat(s, "morale", 6); stat(s, "fitness", -5); } },
      { id: "quedarse", label: "Quedarte en casa", outcome: "Duermes nueve horas y entrenas como un tiro.", apply: (s) => { stat(s, "fitness", 6); rel(s, "coach", 3); stat(s, "morale", -3); } },
      { id: "liarla", label: "Liarla hasta las cinco", outcome: "El míster huele algo. No dice nada. Lo apunta.", apply: (s) => { stat(s, "morale", 10); stat(s, "fitness", -14); rel(s, "coach", -10); stat(s, "discipline", -10); } },
    ],
  },
  {
    id: "am_captaincy",
    kicker: "Liderazgo",
    title: "El brazalete del filial",
    image: "locker",
    requires: (s) => s.stage !== "youth" && s.rel.dressing >= 65 && s.overall >= 62,
    text: () => `El míster propone que lleves tú el brazalete el domingo. Eres el más joven del vestuario.`,
    choices: [
      { id: "aceptar", label: "Aceptar", outcome: "Pesa más de lo que parece. Te crece la voz.", apply: (s) => { rel(s, "coach", 8); rel(s, "dressing", 6); stat(s, "morale", 8); flag(s, "capitan"); } },
      { id: "ceder", label: "Cedérselo al veterano", outcome: "El vestuario lo agradece. El míster también, en silencio.", apply: (s) => { rel(s, "dressing", 12); rel(s, "coach", 3); } },
    ],
  },
  {
    id: "am_penalty_practice",
    kicker: "Detalle",
    title: "Quedarte a tirar penaltis",
    image: "training",
    requires: (s) => s.age <= 21,
    text: () => `El portero te reta: veinte penaltis. Si metes más de quince, te invita a desayunar un mes.`,
    choices: [
      { id: "aceptar", label: "Aceptar el reto", outcome: "Metes dieciséis. Desayunos gratis y algo más importante: confianza desde los once metros.", apply: (s) => { flag(s, "penaltis"); stat(s, "form", 5); rel(s, "dressing", 6); } },
      { id: "pasar", label: "Pasar, hoy toca descansar", outcome: "El portero te llama flojo durante una semana.", apply: (s) => { stat(s, "fitness", 4); rel(s, "dressing", -3); } },
    ],
  },
  {
    id: "am_rival_talk",
    kicker: "Rival",
    title: "El chaval del otro equipo",
    image: "tunnel",
    requires: (s) => s.age <= 19,
    text: () => `En el túnel, el mejor del rival te reconoce: "Tú eres el que me hizo el 2-0 el año pasado, ¿no?". Lleva un dorsal que en tres años valdrá millones.`,
    choices: [
      { id: "amable", label: "Hablar con él y desearle suerte", outcome: "Os seguís escribiendo. Los contactos también son carrera.", apply: (s) => { rel(s, "dressing", 3); stat(s, "morale", 4); flag(s, "amigo_rival"); } },
      { id: "frio", label: "Mirarle sin contestar", outcome: "Te mete un caño en el 12'. Nunca provoques a un extremo.", apply: (s) => { stat(s, "form", -4); stat(s, "fame", 2); } },
    ],
  },
  {
    id: "am_journalist",
    kicker: "Prensa",
    title: "Primera entrevista",
    image: "agent",
    requires: (s) => s.fame >= 18,
    text: () => `Radio local, cinco minutos. Última pregunta: "¿Te ves en el primer equipo esta temporada?".`,
    choices: [
      { id: "humilde", label: "\"Voy partido a partido\"", outcome: "Aburrido y perfecto. El club te lo agradece.", apply: (s) => { rel(s, "coach", 6); stat(s, "fame", 2); } },
      { id: "ambicioso", label: "\"Me veo, sí. Para eso entreno\"", outcome: "Titular al día siguiente. La grada se ilusiona; el vestuario levanta la ceja.", apply: (s) => { stat(s, "fame", 10); rel(s, "fans", 6); rel(s, "dressing", -5); rel(s, "coach", -4); } },
      { id: "broma", label: "Contar el chiste de la cabra del autobús", outcome: "El programa se cae de risa. Te invitan cada semana.", apply: (s) => { stat(s, "fame", 8); rel(s, "fans", 8); } },
    ],
  },
  {
    id: "am_tactic",
    kicker: "Táctica",
    title: "Cambio de posición",
    image: "training",
    requires: (s) => s.age >= 17 && !s.flags["reposicion"],
    text: (s) => `El míster prueba algo raro: te quiere unos metros más atrás. "Tienes cabeza para ${s.player.position === "DC" ? "jugar de espaldas" : "leer el juego"}. Pruébalo."`,
    choices: [
      { id: "probar", label: "Probarlo con la mente abierta", outcome: "Al principio te pierdes. Luego entiendes el juego mejor que nunca.", apply: (s) => { flag(s, "reposicion"); stat(s, "overall", 3); stat(s, "form", -4); rel(s, "coach", 8); } },
      { id: "negarse", label: "Decirle que tu sitio es el de siempre", outcome: "Respeta la sinceridad, pero se guarda el plan.", apply: (s) => { flag(s, "reposicion"); rel(s, "coach", -6); stat(s, "form", 4); } },
    ],
  },
  {
    id: "am_mascota",
    kicker: "Surrealismo",
    title: "La mascota del club",
    image: "match",
    requires: (s) => s.rel.fans >= 45,
    text: () =>
      `Antes del partido, la mascota del club (un pez espada con pantalón corto, nadie sabe por qué) se cae de espaldas en el círculo central y no puede levantarse sola.`,
    choices: [
      { id: "ayudar", label: "Ir a levantarla en pleno calentamiento", outcome: "La foto sale en tres periódicos. El pez espada te debe una.", apply: (s) => { rel(s, "fans", 10); stat(s, "fame", 6); rel(s, "coach", -2); } },
      { id: "seguir", label: "Seguir calentando como un profesional", outcome: "El utillero la levanta. Tú metes gol en el 20'. Nadie recuerda al pez.", apply: (s) => { stat(s, "form", 4); rel(s, "coach", 3); } },
    ],
  },
  {
    id: "am_derbi",
    kicker: "Partido grande",
    title: "Semana de derbi",
    image: "match",
    requires: (s) => s.stage !== "youth" && s.rel.fans >= 40,
    text: (s) => `Semana rara en ${clubById(s.clubId).city}: pintadas, bocinas de madrugada y gente que te para en el súper para pedirte que ganes el domingo.`,
    choices: [
      { id: "aislar", label: "Aislarte: móvil apagado toda la semana", outcome: "Llegas fresco de cabeza. Se nota.", apply: (s) => { stat(s, "form", 8); stat(s, "morale", 3); } },
      { id: "vivirlo", label: "Vivirlo con la gente del barrio", outcome: "La afición te siente suyo. Duermes fatal el sábado.", apply: (s) => { rel(s, "fans", 12); stat(s, "fitness", -5); } },
    ],
  },
  {
    id: "am_youngster",
    kicker: "Vestuario",
    title: "Ahora el nuevo es otro",
    image: "locker",
    requires: (s) => s.age >= 18 && totalApps(s) >= 20,
    text: () => `Llega un chaval de 16 años con la mirada exacta que tenías tú. Le han puesto la taquilla del fondo, la que no cierra bien.`,
    choices: [
      { id: "acoger", label: "Sentarte con él y echarle una mano", outcome: "Te llamará mentor durante años en cada entrevista.", apply: (s) => { rel(s, "dressing", 10); stat(s, "morale", 5); flag(s, "mentor"); } },
      { id: "ignorar", label: "Ir a lo tuyo, bastante tienes", outcome: "Nadie te lo reprocha. Tampoco nadie te lo agradece.", apply: (s) => { stat(s, "form", 3); rel(s, "dressing", -4); } },
    ],
  },
  {
    id: "am_pisos",
    kicker: "Vida",
    title: "Salir de la residencia",
    image: "family",
    requires: (s) => s.age >= 18 && !!s.contract,
    text: () => `Puedes dejar la residencia del club y alquilar un piso. Libertad total, nevera vacía.`,
    choices: [
      { id: "solo", label: "Piso solo, cerca del centro", outcome: "Independencia. Y muchas cenas de microondas.", apply: (s) => { stat(s, "morale", 8); stat(s, "fitness", -6); rel(s, "family", -4); } },
      { id: "compañero", label: "Compartir con un compañero de equipo", outcome: "Vídeos de partidos hasta las dos y comida decente.", apply: (s) => { rel(s, "dressing", 10); stat(s, "overall", 1); } },
      { id: "quedarse", label: "Quedarte en la residencia", outcome: "Comida medida, sueño medido, vida medida.", apply: (s) => { stat(s, "fitness", 8); stat(s, "morale", -4); } },
    ],
  },
  {
    id: "am_racha_buena",
    kicker: "Estado de forma",
    title: "Todo entra",
    image: "match",
    requires: (s) => s.form >= 72,
    text: (s) => `Tres semanas en las que el balón te busca a ti. En el ${clubById(s.clubId).short} empiezan a decir tu nombre en las previas.`,
    choices: [
      { id: "mantener", label: "No cambiar nada de tu rutina", outcome: "La racha dura un mes más.", apply: (s) => { stat(s, "form", 5); stat(s, "overall", 2); rel(s, "coach", 4); } },
      { id: "disfrutar", label: "Disfrutarlo y soltarte", outcome: "Un caño en el 89' con 3-0. El rival no lo perdona.", apply: (s) => { stat(s, "fame", 8); rel(s, "fans", 8); rel(s, "dressing", -4); stat(s, "form", -3); } },
    ],
  },
  {
    id: "am_racha_mala",
    kicker: "Estado de forma",
    title: "Sequía",
    image: "training",
    requires: (s) => s.form <= 35,
    text: () => `Un mes sin nada. Ni gol, ni asistencia, ni una sola jugada que te haga levantar la cabeza. Empiezas a pensar antes de recibir, que es lo peor que le puede pasar a un futbolista.`,
    choices: [
      { id: "extra", label: "Quedarte a entrenar solo cada tarde", outcome: "Al décimo día, algo se desbloquea.", apply: (s) => { stat(s, "form", 12); stat(s, "fitness", -6); rel(s, "coach", 5); } },
      { id: "psicologo", label: "Pedir hablar con el psicólogo del club", outcome: "Menos ruido en la cabeza. El club lo valora como madurez.", apply: (s) => { stat(s, "morale", 12); stat(s, "form", 7); rel(s, "coach", 4); } },
      { id: "casa", label: "Irte un fin de semana a casa", outcome: "Comida de tu madre y silencio. Vuelves entero.", apply: (s) => { rel(s, "family", 10); stat(s, "morale", 9); stat(s, "form", 4); } },
    ],
  },
  {
    id: "am_loan_offer",
    kicker: "Mercado",
    title: "Una cesión sobre la mesa",
    image: "agent",
    requires: (s) => s.hasAgent && s.stage === "reserves" && s.age >= 18,
    text: (s) => `${s.agentName} trae una cesión a un club de la categoría de plata: minutos garantizados, menos escaparate, más barro.`,
    choices: [
      { id: "aceptar", label: "Aceptar la cesión", outcome: "Preparas la maleta. El barro también enseña.", apply: (s) => { stat(s, "overall", 3); rel(s, "agent", 8); rel(s, "fans", -4); flag(s, "cedido"); milestone(s, "Cesión para buscar minutos."); } },
      { id: "rechazar", label: "Rechazarla: aquí está tu oportunidad", outcome: "El club interpreta que crees en el proyecto.", apply: (s) => { rel(s, "coach", 8); rel(s, "fans", 6); rel(s, "agent", -6); } },
    ],
  },
  {
    id: "am_charity",
    kicker: "Club",
    title: "Visita al hospital",
    image: "family",
    requires: (s) => s.fame >= 20,
    text: () => `El club organiza una visita a la planta infantil del hospital. No hay cámaras, es voluntario y es a las ocho de la mañana de tu día libre.`,
    choices: [
      { id: "ir", label: "Ir", outcome: "Cuatro horas. Sales con la cabeza en otro sitio, en el bueno.", apply: (s) => { rel(s, "fans", 8); stat(s, "morale", 10); rel(s, "coach", 4); } },
      { id: "no", label: "Descansar, el cuerpo lo pide", outcome: "Nadie te dice nada. Tú te acuerdas igual.", apply: (s) => { stat(s, "fitness", 5); stat(s, "morale", -4); } },
    ],
  },
  {
    id: "am_first_team_watch",
    kicker: "Aspiración",
    title: "Ver al primer equipo desde la grada",
    image: "match",
    requires: (s) => s.stage !== "first" && s.age >= 17,
    text: (s) => `Entradas para los canteranos en la última fila del ${clubById(s.clubId).short}. Desde ahí arriba, el césped parece otra cosa.`,
    choices: [
      { id: "estudiar", label: "Estudiar a quien juega en tu puesto", outcome: "Sales con tres cosas apuntadas en el móvil.", apply: (s) => { stat(s, "overall", 2); stat(s, "morale", 3); } },
      { id: "sonar", label: "Imaginarte ahí abajo", outcome: "Se te pone un nudo raro. Bueno, pero raro.", apply: (s) => { stat(s, "morale", 8); stat(s, "form", 3); } },
    ],
  },
];

import { EXTRA_EVENTS } from "./events-extra";
import { STORY_ALT } from "./story-alt";
import { PHASE5_EVENTS, traitAffinity } from "./events-phase5";
import { BANK_CLUB } from "./bank-club";
import { BANK_LIFE } from "./bank-life";
import { careerSeed, hash } from "./npc";

export const ALL_EVENTS: GameEvent[] = [
  ...STORY,
  ...STORY_ALT,
  ...AMBIENT,
  ...EXTRA_EVENTS,
  ...PHASE5_EVENTS,
  ...BANK_CLUB,
  ...BANK_LIFE,
];

/** Familia narrativa de cada evento (plantilla), para evitar repetirla. */
const FAMILY_BY_ID = new Map<string, string>(
  ALL_EVENTS.map((e) => [e.id, e.family ?? `solo:${e.id}`] as const),
);
/** Escenas mínimas antes de repetir la misma familia narrativa. */
const FAMILY_COOLDOWN = 9;

function recentFamilies(s: GameState): Set<string> {
  const history = Array.isArray(s.eventHistory) ? s.eventHistory : [];
  const scene = s.sceneCount ?? 0;
  const out = new Set<string>();
  for (const h of history) {
    if (scene - h.scene > FAMILY_COOLDOWN) break;
    const fam = FAMILY_BY_ID.get(h.id);
    if (fam) out.add(fam);
  }
  return out;
}

export function eventById(id: string): GameEvent | undefined {
  return ALL_EVENTS.find((e) => e.id === id);
}

/** Escenas mínimas antes de que un mismo eventId pueda repetirse. */
const EVENT_COOLDOWN = 26;
/** Una misma categoría puede aparecer como máximo 2 veces en las últimas 5. */
const CATEGORY_WINDOW = 5;
const CATEGORY_MAX = 2;

function safeRequires(e: GameEvent, s: GameState): boolean {
  try {
    return e.requires(s);
  } catch {
    return false;
  }
}

const inPreseason = (s: GameState): boolean => (s.flags["pretemporada"] ?? 0) === 1;

/**
 * Cada carrera silencia una parte del banco ambiental de forma determinista
 * (careerSeed). Así dos partidas distintas ven repartos de historias distintos
 * y no solo un orden distinto.
 */
function mutedInCareer(s: GameState, e: GameEvent): boolean {
  if ((e.priority ?? 0) >= 100) return false;
  if (archetypeMuted(s, e)) return true;
  if (e.category === "preseason") return hash(careerSeed(s), e.id) % 100 < 18;
  return hash(careerSeed(s), `mute:${e.id}`) % 100 < 32;
}

export function eligibleEvents(s: GameState, allowMuted = false): GameEvent[] {
  const history = Array.isArray(s.eventHistory) ? s.eventHistory : [];
  const scene = s.sceneCount ?? 0;
  const lastSeen = (id: string): number | null => {
    const hit = history.find((h) => h.id === id);
    return hit ? hit.scene : null;
  };
  const recentIds = new Set(history.slice(0, 3).map((h) => h.id));
  const fams = recentFamilies(s);
  const pre = inPreseason(s);
  return ALL_EVENTS.filter((e) => {
    // Las escenas de pretemporada solo existen durante la pretemporada.
    if ((e.category === "preseason") !== pre && e.category === "preseason") return false;
    if (pre && (e.priority ?? 0) < 100 && e.category !== "preseason") return false;
    if (!safeRequires(e, s)) return false;
    // Nunca uno de los tres últimos templates.
    if (recentIds.has(e.id)) return false;
    // Nunca la misma familia/plantilla narrativa en una ventana larga.
    if ((e.priority ?? 0) < 100 && fams.has(e.family ?? `solo:${e.id}`)) return false;
    if (!allowMuted && mutedInCareer(s, e)) return false;
    // Los eventos estructurales (prioridad alta) solo se viven una vez.
    if ((e.priority ?? 0) >= 100) return !s.seenEvents.includes(e.id);
    if (!s.seenEvents.includes(e.id)) return true;
    const seen = lastSeen(e.id);
    return seen !== null && scene - seen >= EVENT_COOLDOWN;
  });
}

function categoryBlocked(s: GameState, category: EventCategory | undefined): boolean {
  const history = Array.isArray(s.eventHistory) ? s.eventHistory : [];
  const cat = category ?? "life";
  const recent = history.slice(0, CATEGORY_WINDOW);
  if (recent[0]?.category === cat) return true;
  return recent.filter((h) => h.category === cat).length >= CATEGORY_MAX;
}

/** Peso de un evento: contexto de estado, rasgos, frescura y sesgo de carrera. */
function weightOf(s: GameState, e: GameEvent): number {
  const cat = e.category ?? "life";
  let w = traitAffinity(s, cat) * archetypeWeight(s, e);
  // Sesgo estable por carrera: cada partida tiene sus historias favoritas.
  w *= 0.65 + (hash(careerSeed(s), `w:${e.id}`) % 70) / 100;
  // Frescura: lo nunca visto pesa mucho más que lo repetido.
  if (!s.seenEvents.includes(e.id)) w *= 2.4;
  // Coherencia de contexto.
  if (cat === "gossip") w *= s.fame >= 45 ? 1.2 : 0.7;
  if (cat === "medical" && s.injury) w *= 2.2;
  if (cat === "market" && (s.flags["mercado_abierto"] ?? 0) === 1) w *= 1.8;
  if (cat === "club" && s.stage !== "youth") w *= 1.3;
  if (cat === "press" && s.fame < 20) w *= 0.5;
  // Lo raro/surrealista sorprende justamente porque casi nunca sale.
  if (e.rare) w *= 0.12;
  return Math.max(0.05, w);
}

function weightedPick(s: GameState, pool: GameEvent[]): GameEvent | null {
  if (pool.length === 0) return null;
  const weights = pool.map((e) => weightOf(s, e));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

/**
 * Elige el siguiente evento. Prioriza la categoría pedida por el planificador;
 * si esa categoría está saturada o vacía, CAMBIA de categoría en vez de repetir.
 */
export function pickEvent(s: GameState, preferred?: EventCategory): GameEvent | null {
  let pool = eligibleEvents(s);
  // Si el banco filtrado se queda corto, reabrimos los silenciados antes de repetir.
  if (pool.length < 4) {
    const wide = eligibleEvents(s, true);
    if (wide.length > pool.length) pool = wide;
  }
  if (pool.length === 0) return null;

  const maxPriority = Math.max(...pool.map((e) => e.priority ?? 0));
  if (maxPriority >= 100) {
    // Banda de hitos disponibles: la ruta narrativa y la semilla deciden el
    // orden, no una cadena fija de prioridades.
    const band = pool.filter((e) => (e.priority ?? 0) >= 100 && maxPriority - (e.priority ?? 0) <= 60);
    const weights = band.map((e) => storyWeight(s, e.id) * (1 + ((e.priority ?? 100) - 100) / 90));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < band.length; i++) {
      r -= weights[i]!;
      if (r <= 0) return band[i]!;
    }
    return band[band.length - 1] ?? null;
  }

  const ambient = pool.filter((e) => (e.priority ?? 0) < 100);
  if (ambient.length === 0) return null;

  const fresh = ambient.filter((e) => !categoryBlocked(s, e.category));
  const wanted =
    preferred && !categoryBlocked(s, preferred)
      ? fresh.filter((e) => (e.category ?? "life") === preferred)
      : [];
  const bucket = wanted.length > 0 ? wanted : fresh.length > 0 ? fresh : ambient;
  return weightedPick(s, bucket);
}

export const EVENT_COUNT = ALL_EVENTS.length;
export { totalGoals, hasTrait, note, rel };
