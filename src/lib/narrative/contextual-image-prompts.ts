import { describeKit } from "@/lib/clubColors";
import { describeLook } from "@/lib/playerLook";

/**
 * Prompts contextuales para generación de imágenes según el tipo de evento.
 * Cada tipo de evento genera una imagen acorde a la narrativa, no solo la cara del jugador.
 */

/**
 * Poses de celebración de gol real — arquetipos genéricos de la cultura
 * futbolística (rodillas al césped, mano en la oreja al público, beso al
 * escudo...), no la marca personal de ningún jugador identificable en
 * concreto. Antes había una única frase fija ("arms raised, fist pump")
 * para CUALQUIER gol de cualquier carrera — el primer gol de un chaval
 * de 16 años se veía exactamente igual que el gol 200 de una leyenda.
 * Pedido explícito: que la gente pueda compartir una celebración que se
 * sienta tan icónica como la de sus ídolos, no siempre la misma pose.
 */
const GOAL_CELEBRATION_POSES = [
  "sliding on his knees across the grass with both arms out wide, mouth open in a roar of pure joy",
  "cupping a hand to his ear, looking up at the crowd as if daring them to get louder",
  "kissing the crest on his jersey with his eyes closed, one hand pressed over his heart",
  "sprinting toward the corner flag with his shirt pulled up over his face in disbelief, teammates chasing him",
  "pointing both index fingers to the sky in dedication, head tilted back, tears of emotion visible",
  "being mobbed and lifted by a pile of teammates, his face barely visible under the celebration",
  "doing a trademark leaping fist pump mid-air, body fully extended, stadium lights flaring behind him",
  "running along the touchline with arms spread like wings, sprinting past the advertising boards",
  "on his knees with both fists driven into the turf, head down, releasing weeks of pressure in one moment",
  "spinning around with his arms out, disbelief turning into a wide grin as teammates close in",
];

function pickCelebrationPose(): string {
  return GOAL_CELEBRATION_POSES[Math.floor(Math.random() * GOAL_CELEBRATION_POSES.length)];
}

export const CONTEXTUAL_IMAGE_PROMPTS: Record<string, (playerName: string, contextValue: string | number) => string> = {
  // REPRESENTANTE - Primera firma
  representante_primera_firma: (playerName: string, agentName: string | number) =>
    `Professional photograph: young footballer ${playerName} and agent ${String(agentName)} shaking hands and signing contract, modern office with desk, warm lighting, formal business setting, Getty Images quality, high resolution`,

  // TRANSFERENCIA - Fichaje por nuevo equipo
  //
  // El club llega aquí en texto plano ("Málaga CF") sin más — con un club
  // real pero poco representado en los datos de entrenamiento del modelo,
  // este alucinaba el kit "genérico" más visto (en pruebas reales, un
  // patrón azulgrana calcado al del Barça para el Málaga). describeKit ya
  // resuelve esto en los prompts escritos a mano con el marcador
  // [CLUB_KIT]; aquí hacía falta el mismo forzado de color explícito.
  transferencia_fichaje: (playerName: string, clubName: string | number) =>
    `Official team photo: young footballer ${playerName} posing with ${String(clubName)} jersey over shoulders (${describeKit(String(clubName))}), smiling confidently, stadium background, professional club photography style, Getty Images quality`,

  // GOL - Celebración (pose distinta cada vez, ver GOAL_CELEBRATION_POSES)
  gol_celebracion: (playerName: string, clubName: string | number) =>
    `Action photograph: footballer ${playerName} in ${describeKit(String(clubName))} mid-celebration right after scoring, ${pickCelebrationPose()}, teammates visible closing in, night match stadium lights, packed roaring stadium in background, motion and raw emotion frozen mid-action, Getty Images sports photography style`,

  // LESIÓN - Momento dramático
  lesion_grave: (playerName: string) =>
    `Dramatic photograph: young footballer ${playerName} on ground, injured, medical staff approaching, pitch, emotional moment, serious atmosphere, professional sports photography`,

  // TROFEO - Levantando títulos
  trofeo_levantando: (playerName: string, trophyName: string | number) =>
    `Victory photograph: footballer ${playerName} lifting ${String(trophyName)} trophy, joy and pride, teammates around, confetti, stadium lights, professional sports photography, Getty Images quality`,

  // DEBUT - Primer partido
  debut_primer_partido: (playerName: string, clubName: string | number) =>
    `Professional action shot: young footballer ${playerName} in ${String(clubName)} kit (${describeKit(String(clubName))}) during match, focused concentration, running with ball, match action, professional sports photography`,

  // CAPITÁN - Armband ceremony
  capitan_brazalete: (playerName: string, clubName: string | number) =>
    `Ceremonial photograph: footballer ${playerName} receiving captain's armband, coach or captain emeritus placing it, emotional moment, teammates watching, stadium background, professional photography`,

  // ESCÁNDALO - Confrontación
  escandalo_confrontacion: (playerName: string) =>
    `Dramatic photograph: young footballer ${playerName} in tense confrontation, emotional turmoil, serious facial expression, dimmed lighting, intense atmosphere, dramatic sports photography`,

  // RECORDISTA - Breaking record
  recordista_marca: (playerName: string, recordName: string | number) =>
    `Celebratory photograph: footballer ${playerName} breaking record for ${String(recordName)}, pointing at scoreboard, emotion and achievement, stadium lights, professional sports photography`,

  // ENTREVISTA - Media attention
  entrevista_prensa: (playerName: string) =>
    `Professional photograph: young footballer ${playerName} in formal interview setting, microphones, cameras, serious and focused expression, professional journalism setting, Getty Images quality`,

  // BENEFICENCIA - Charity work
  beneficencia_caridad: (playerName: string) =>
    `Warm photograph: footballer ${playerName} with children at charity event, smiling, genuine connection, helping others, community setting, humanitarian focus, warm natural lighting`,

  // VICTORIA_ÉPICA - Championship moment
  victoria_epica: (playerName: string, competition: string | number) =>
    `Triumphant photograph: footballer ${playerName} celebrating ${String(competition)} victory, arms raised, teammates embracing, trophy visible, confetti, emotional intensity, professional sports photography`,

  // ENTRENAMIENTO - Determination
  entrenamiento_intenso: (playerName: string, clubName: string | number) =>
    `Training ground photograph: footballer ${playerName} focused during intense training session, ${String(clubName)} facilities, determination visible, professional athletic photography`,

  // RIVALES - Duel moment
  rivales_confrontacion: (playerName: string, rivalClubName: string | number) =>
    `Action photograph: intense duel between footballer ${playerName} and ${String(rivalClubName)} player, physical confrontation, focus and determination, match setting, professional sports photography`,

  // DEBUT_INTERNACIONAL - First national team
  debut_internacional: (playerName: string, countryFlag: string | number) =>
    `Official photograph: young footballer ${playerName} in national team jersey ${String(countryFlag)}, proud and honored expression, national stadium background, professional sports photography`,

  // REGRESO_LESIÓN - Comeback from injury
  regreso_lesion: (playerName: string) =>
    `Triumphant photograph: footballer ${playerName} returning to field after injury, determined expression, warm welcome from teammates, emotional comeback moment, professional sports photography`,

  // RÉCORD_JOVEN - Youth record breaker
  record_joven: (playerName: string, achievement: string | number) =>
    `Celebratory photograph: young footballer ${playerName} achieving youngest ${String(achievement)}, pride and emotion, professional sports photography, achievement focus`,

  // CONTRATO_RENOVACIÓN - New deal
  contrato_renovacion: (playerName: string, clubName: string | number) =>
    `Professional photograph: footballer ${playerName} signing contract renewal with ${String(clubName)}, smiling and confident, club representatives present, office setting, professional business photography`,

  // DEFAULT - Generic if nothing matches
  default: (playerName: string, age: string | number) =>
    `Professional portrait: young footballer ${playerName}, age ${age}, confident expression, sports lighting, Getty Images quality professional photography`,
};

/**
 * Cada plantilla espera un tipo concreto de segundo dato (nombre de club,
 * de agente, de trofeo...). Sin este mapa, un extraContext con varios
 * campos a la vez (agentName Y clubName, que es el caso normal) coleaba
 * el que ganara por orden de prioridad, sin mirar qué pide la plantilla
 * — así una foto de "camiseta nueva" podía acabar con el nombre del
 * agente en vez del club.
 */
const EVENT_TYPE_CONTEXT_KEY: Record<string, keyof ReturnType<typeof buildExtraContextDefaults>> = {
  representante_primera_firma: "agentName",
  transferencia_fichaje: "clubName",
  gol_celebracion: "clubName",
  trofeo_levantando: "trophyName",
  debut_primer_partido: "clubName",
  capitan_brazalete: "clubName",
  recordista_marca: "recordName",
  victoria_epica: "competition",
  entrenamiento_intenso: "clubName",
  rivales_confrontacion: "rivalClubName",
  debut_internacional: "countryFlag",
  record_joven: "achievement",
  contrato_renovacion: "clubName",
};

function buildExtraContextDefaults(extraContext: Record<string, string>) {
  return {
    agentName: extraContext.agentName ?? "",
    clubName: extraContext.clubName ?? "",
    trophyName: extraContext.trophyName ?? "",
    recordName: extraContext.recordName ?? "",
    competition: extraContext.competition ?? "",
    rivalClubName: extraContext.rivalClubName ?? "",
    countryFlag: extraContext.countryFlag ?? "",
    achievement: extraContext.achievement ?? "",
  };
}

/**
 * Get the appropriate image prompt for an event type
 */
export function getContextualImagePrompt(
  eventType: string,
  playerName: string,
  playerAge: number,
  extraContext?: Record<string, string>
): string {
  const key = eventType.toLowerCase();
  const promptFn = CONTEXTUAL_IMAGE_PROMPTS[key as keyof typeof CONTEXTUAL_IMAGE_PROMPTS];

  // El look (barba, peinado) evoluciona con la edad del jugador — casi
  // todas estas plantillas dicen "young footballer" tal cual, sin mirar
  // la edad real, así que sin esto un veterano de 36 años seguía saliendo
  // descrito como joven en la propia foto. Se añade como cláusula aparte
  // en vez de tocar cada plantilla una por una.
  const lookClause = `${playerAge} year old footballer, ${describeLook(playerAge, playerName)}`;

  if (!promptFn) {
    return `${CONTEXTUAL_IMAGE_PROMPTS.default(playerName, playerAge)}, ${lookClause}`;
  }

  if (!extraContext) {
    return `${promptFn(playerName, "")}, ${lookClause}`;
  }

  const values = buildExtraContextDefaults(extraContext);
  const wantedKey = EVENT_TYPE_CONTEXT_KEY[key];
  const contextValue = wantedKey ? values[wantedKey] : "";

  return `${promptFn(playerName, contextValue || playerName)}, ${lookClause}`;
}
