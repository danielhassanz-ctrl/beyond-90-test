/**
 * EVENTOS DE VIDA DETALLADOS
 * Más específico, más emocional, más variado
 */

import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";

export const LIFE_EVENT_SCENARIOS = {
  // ROMANCE
  romance_meet: [
    "Conoces a alguien en un evento. Al principio es flirteo. Luego es serio.",
    "Tu amigo te presenta a alguien. Te dice que es 'como tu tipo'. Tiene razón.",
    "Vacaciones de verano. Una chica en la playa. Destino vacacional. Buena química.",
    "Redes sociales. Ella te sigue. Luego DM. Luego café. Luego... todo.",
  ],

  romance_conflict: [
    "Ella quiere que pares de viajar tanto. Tu carrera viaja. Conflicto real.",
    "Descubre una infidelidad. Tuya. Te atrapó. Ahora debe decidir si se va.",
    "Presión de casarse. Tú quieres esperar. Ella no. Padres de ella no ayudan.",
    "Ella está celosa de tu expareja. Ve una foto antigua. Arma escándalo.",
  ],

  romance_proposal: [
    "Propuesta en la cancha después de ganar. Anillo de diamantes. Todo el estadio lo ve.",
    "Cena elegante. Reserva todo meses antes. Ella se da cuenta. Dice sí llorando.",
    "Cae de rodillas en el coche. Anillo falso de broma. Luego el real. Ella grita.",
    "Viaje sorpresa a París. Torre Eiffel al atardecer. Anillo antigua de familia.",
  ],

  romance_breakup: [
    "Ella se va con alguien más. Descubres en redes que está con otro. Duele de verdad.",
    "Vosotros termináis porque tu carrera no la permite estar cerca. Ambos lloráis.",
    "Ella pide que elijas: ella o el fútbol. Elegiste el fútbol ayer. Hoy se va.",
    "10 años juntos. De repente todo cambia. No sabes qué pasó. Ella tampoco.",
  ],

  // PATERNIDAD
  hijo_nacimiento: [
    "Te llama la matrona: 'Es un niño'. Cuelgas y gritas en el vestuario. Todos saben.",
    "Estás en un partido. Te pasan una nota: 'Es una niña, 3kg 200g'. Juegas como poseso.",
    "Nace prematuro. Miedo real. UCIN. Hospital. Tú ahí rezando aunque no creas.",
    "Gemelos. Anuncian en el estadio. Todos aplauden. Es tu mejor día.",
  ],

  hijo_conflict: [
    "Tu hijo quiere jugar al fútbol pero no lo ves en el. Él quiere complacerte. Presión.",
    "Tu hija te pide estar más tiempo en casa. Tú estás 200 días fuera. Culpa.",
    "Escuela: 'Tu hijo dice que su papá siempre está en la tele'. Él te señala así.",
    "Nacimiento de hijo coincide con final de Champions. Pierdes. Eres abuelo y he fracasado.",
  ],

  // DINERO
  dinero_ganancia: [
    "Primer salario grande (100k€/mes). Transferencia. No lo puedes creer. Lloras.",
    "Bono de fichaje. 500k€. Lo metes en la cuenta. Tu familia sale de pobreza.",
    "Patrocinios. Acuerdos publicitarios. De repente ganas sin jugar. Patrimonio +1M.",
    "Casa vendida a mayor precio de lo esperado. Gana 200k€. Inesperado. Suerte.",
  ],

  dinero_perdida: [
    "Inversión en negocio de 'amigos'. Dinero desaparece. Aprendes lección cara.",
    "Agente te roba. Descubres años después. Has perdido millones. Juicio eterno.",
    "Crisis inmobiliaria. Casa vale mitad. Crédito sigue igual. Atrapado.",
    "Demanda de expareja. Dinero para la custodia. Millones. Duele más que dinero.",
  ],

  dinero_luxury: [
    "Compras mansión de ensueño. Hecha a tu medida. Coches. Piscina olímpica.",
    "Jet privado compartido con otros futbolistas. Primera vez viajas así. Vicio.",
    "Evento benéfico. Subastas de caridad. Compras un viaje a la Luna (no existe aún). Por risa.",
    "Tu hija pide un caballo de carrera. Tienes dinero. Lo compras. Ella es feliz.",
  ],

  // FAMILIA
  muerte_familiar: [
    "Tu padre muere. Es repentino. Funeral. Tú en el campo. No puedes estar ahí.",
    "Abuela con cáncer. Visitas. Sabe que se muere. Te dice qué hacer. Consejos finales.",
    "Hermano muere en accidente de coche. Carretera mojada. Estabas en concentración.",
    "Madre tiene infarto leve. Recupera. Te hace prometer que visitarás más. Culpa.",
  ],

  muerte_shock: [
    "Muere un compañero de equipo. Joven. Aneurisma. Nadie esperaba. Equipo en duelo.",
    "Muere un rival que era tu amigo. Accidente de entrenamiento. Cierra ojos cada noche pensando en él.",
    "Muere un aficionado que SIEMPRE iba. Te pedía autógrafos. Años viéndolo. Un día no está.",
  ],

  // TRAICIÓN
  traicion_amigo: [
    "Tu mejor amigo duerme con tu pareja. Te enteras por redes. Bloques a los dos.",
    "Amigo íntimo vende historias de ti a la prensa. Privacidad violada. Nunca más hablas.",
    "Compañero de cuarto hablaba mal de ti en entrevistas. Media descubre. Conflicto abierto.",
  ],

  traicion_representante: [
    "Tu agente te roba en contrato. Clausulas ocultas. Descubres 5 años después.",
    "Representante vende tus datos a las apuestas. Conflicto de intereses. Juicio.",
    "Agente hace acuerdo secreto con otro club para que te transfieran. Te usa.",
  ],

  // RECONOCIMIENTO
  premio_individual: [
    "Balón de Oro. Tu nombre grita en París. Sueño de toda la infancia realidad.",
    "Mejor jugador de la liga. Foto en portada de revistas. Leyenda ya.",
    "Premio a la Sportsmanship. Por carácter y ética. Orgullo diferente.",
  ],

  reconocimiento_club: [
    "Retire tu número. Nunca nadie más lo usará. Eternidad en el estadio.",
    "Estatua tuya en la entrada. Bronce. Tú viendo la inauguración.",
    "Hall of Fame. Nombre en la pared con los mejores. Para siempre.",
  ],

  // ESCÁNDALO
  escandalo_privado: [
    "Video privado se filtra en redes. Íntimo. Viral. Humillación pública. Borran tras 12h pero el daño hecho.",
    "Foto tuya en fiesta sin mascarilla durante confinamiento. Hipocresía expuesta. Media ataca.",
    "Ex publica fotos de desnudos. Dichos años atrás. Consentidos pero ella enojada. Imagen dañada.",
  ],

  escandalo_pelea: [
    "Pelea en la calle. Paparazzis la captan. Viral. Ese vídeo tuyo peleándote existe para siempre.",
    "Conflicto verbal con aficionado. Lo insultas. Video en Twitter. Suspenso de 3 partidos.",
    "Agresión en el vestuario a un compañero. Investigación. Noticia nacional.",
  ],

  escandalo_politico: [
    "Tuiteas algo sin pensar. Es interpretado como sexista/racista. Tormenta media. Disculpa pública.",
    "Apoyas candidato polémico. Mitad del país te odia. 6 meses de crítica.",
  ],

  // INSTITUTO — a los 16-18 años todavía se compagina el fútbol con
  // clases de verdad; antes el juego saltaba directo de "cantera" a
  // "profesional consolidado" sin ningún roce con la vida de estudiante
  // normal que cualquier chaval de esa edad sigue teniendo.
  instituto_examen: [
    "Suspendes un examen importante. Entre entrenamientos y viajes no llegaste a estudiar. El profesor no hace ninguna excepción por ser futbolista.",
    "Entregas tarde un trabajo de clase por coincidir con un partido fuera de casa. La profesora lo acepta, pero con nota más baja.",
    "Un examen sorpresa te pilla con la cabeza en el partido del fin de semana. Sales del aula sabiendo que no ha ido bien.",
  ],

  instituto_dormido: [
    "Te quedas dormido tras la concentración de la noche anterior. Llegas tarde a clase — o directamente no llegas.",
    "El despertador no suena después de un viaje largo del equipo. Te pierdes la primera hora entera.",
    "Te duermes literalmente en clase, agotado del doble entrenamiento. El profesor te despierta delante de todos.",
  ],

  instituto_felicitacion: [
    "El director del instituto te para por el pasillo: se ha enterado de tu debut con el primer equipo y quiere felicitarte delante de un par de profesores.",
    "En la megafonía del centro anuncian tu debut como si fuera un logro del propio instituto. Aplausos torpes en clase cuando entras.",
    "Un profesor que nunca habla de fútbol te dice, casi avergonzado, que vio el partido y que está orgulloso de ti.",
  ],

  instituto_dilema: [
    "El mismo día del examen final hay un partido decisivo. No puedes estar en los dos sitios. Tienes que elegir, y alguien se va a llevar un disgusto.",
    "Tus compañeros de clase te invitan a una excursión de fin de curso que coincide con una concentración. Es la primera vez que sientes que te pierdes algo por el fútbol.",
    "Un profesor te ofrece adaptar el horario de exámenes si el club se lo pide por escrito. Depende de ti pedirlo — o no.",
  ],

  // FAMILIA — consejo directo de padre/madre, no del representante. El
  // agente ya tiene su propio hueco de llamadas de gestión
  // (generateAgentGuidanceCall); esto es la voz de casa, más personal y
  // menos profesional.
  familia_consejo: [
    "Tu padre te sienta a hablar, serio: 'No quiero que esto te cambie. Sigues siendo el mismo de siempre para nosotros.'",
    "Tu madre te nota distinto — más callado, más nervioso — y te pregunta directamente si todo esto te está pesando más de lo que dices.",
    "Un hermano o hermana menor te confiesa que en el colegio ya no lo tratan igual, 'por ser tu hermano'. No sabías que también les afectaba a ellos.",
    "En una comida familiar, un tío o abuelo te suelta el típico consejo exagerado de quien no sabe nada de fútbol profesional pero opina con total seguridad.",
  ],

  // PRENSA MENOR — una mención puntual, más pequeña que un premio o un
  // hito, pero el tipo de cosa real que sí pasa pronto en una carrera:
  // un periódico local o una contraportada te nombra antes de ser nadie.
  prensa_contraportada: [
    "Un periódico local te dedica unas líneas en la contraportada: 'la próxima perla de la cantera'. Recortas la página, aunque no lo admitas.",
    "Una revista deportiva de la ciudad te hace tu primera foto 'de verdad', con cámara profesional y todo, para un reportaje de una página.",
    "Un programa de radio local menciona tu nombre por primera vez en antena. Alguien de tu familia lo graba con el móvil.",
  ],
};

export const LIFE_EVENTS_BY_AGE = {
  "16-20": [
    "romance_meet",
    "dinero_ganancia",
    "reconocimiento_club",
    "instituto_examen",
    "instituto_dormido",
    "instituto_felicitacion",
    "instituto_dilema",
    "familia_consejo",
    "prensa_contraportada",
  ],
  "21-25": ["romance_proposal", "hijo_nacimiento", "traicion_amigo", "familia_consejo", "prensa_contraportada"],
  "26-30": ["hijo_conflict", "dinero_luxury", "escandalo_privado", "familia_consejo"],
  "31-35": ["dinero_perdida", "muerte_familiar", "premio_individual", "familia_consejo"],
  "36+": ["dinero_ganancia", "traicion_representante", "reconocimiento_club", "familia_consejo"],
};

export const LIFE_EVENTS_BY_STATS = {
  high_fama: ["escandalo_privado", "escandalo_pelea", "premio_individual"],
  low_moral: ["traicion_amigo", "romance_breakup", "muerte_familiar"],
  high_patrimonio: ["dinero_luxury", "dinero_perdida"],
  low_rel_representante: ["traicion_representante", "dinero_perdida"],
};

type LifeEventCategory = keyof typeof LIFE_EVENT_SCENARIOS;

/**
 * Algunas categorías son un momento que de verdad pasa una sola vez en una
 * vida (pedir matrimonio, que el club te retire el dorsal) — no tendría
 * sentido futbolístico ni emocional que se repitieran. El resto puede
 * volver a pasar con los años (otra traición, otro escándalo, otro hijo),
 * pero con un enfriamiento largo para que no se amontonen.
 */
const ONCE_PER_CAREER = new Set<LifeEventCategory>(["romance_proposal", "reconocimiento_club"]);
const LONG_COOLDOWN_WEEKS = 60; // ~6 temporadas: nacimientos, muertes, premios grandes
const NORMAL_COOLDOWN_WEEKS = 25; // ~2.5 temporadas: el resto
const LONG_COOLDOWN_CATEGORIES = new Set<LifeEventCategory>([
  "hijo_nacimiento",
  "muerte_familiar",
  "muerte_shock",
  "premio_individual",
]);

interface DetailedLifeTracker {
  usedOnce: string[];
  lastByCategory: Record<string, number>;
}

function getTracker(player: Player): DetailedLifeTracker {
  const stored = player.flags?.detailed_life_tracker;
  if (typeof stored === "string") {
    try {
      return JSON.parse(stored);
    } catch {
      // cae al valor por defecto de abajo
    }
  }
  return { usedOnce: [], lastByCategory: {} };
}

function ageKeyFor(age: number): keyof typeof LIFE_EVENTS_BY_AGE {
  if (age <= 20) return "16-20";
  if (age <= 25) return "21-25";
  if (age <= 30) return "26-30";
  if (age <= 35) return "31-35";
  return "36+";
}

/**
 * Elige una categoría y una escena concreta del banco de vida detallada,
 * combinando lo que toca por edad con lo que toca por estadísticas
 * actuales (alta fama arriesga escándalo, patrimonio alto abre lujo o
 * pérdidas, mala relación con el representante abre traición). Devuelve
 * null si no hay ninguna categoría elegible ahora mismo (todas usadas o
 * en su enfriamiento) — deja sitio para que la IA improvise como siempre.
 */
export function pickDetailedLifeScenario(player: Player): { category: LifeEventCategory; scenario: string } | null {
  const tracker = getTracker(player);
  const age = playerAge(player.week);

  const ageCategories = LIFE_EVENTS_BY_AGE[ageKeyFor(age)] ?? [];
  const statCategories: string[] = [];
  if (player.fama >= 70) statCategories.push(...LIFE_EVENTS_BY_STATS.high_fama);
  if (player.moral < 40) statCategories.push(...LIFE_EVENTS_BY_STATS.low_moral);
  if (player.patrimonio >= 1_000_000) statCategories.push(...LIFE_EVENTS_BY_STATS.high_patrimonio);
  if (player.rel_representante < 40) statCategories.push(...LIFE_EVENTS_BY_STATS.low_rel_representante);

  const candidates = Array.from(new Set([...ageCategories, ...statCategories])) as LifeEventCategory[];

  const eligible = candidates.filter((category) => {
    if (ONCE_PER_CAREER.has(category) && tracker.usedOnce.includes(category)) return false;
    const cooldown = LONG_COOLDOWN_CATEGORIES.has(category) ? LONG_COOLDOWN_WEEKS : NORMAL_COOLDOWN_WEEKS;
    const lastWeek = tracker.lastByCategory[category] ?? 0;
    if (lastWeek > 0 && player.week - lastWeek < cooldown) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  const category = eligible[Math.floor(Math.random() * eligible.length)];
  const scenarios = LIFE_EVENT_SCENARIOS[category];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  return { category, scenario };
}

/** Anota que esta categoría ya se usó, para el enfriamiento/bloqueo de arriba. */
export function markDetailedLifeUsed(player: Player, category: LifeEventCategory): void {
  const tracker = getTracker(player);
  tracker.lastByCategory[category] = player.week;
  if (ONCE_PER_CAREER.has(category)) tracker.usedOnce.push(category);
  if (!player.flags) player.flags = {};
  player.flags.detailed_life_tracker = JSON.stringify(tracker);
}
