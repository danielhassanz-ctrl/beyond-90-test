/**
 * Prompts contextuales para generación de imágenes según el tipo de evento.
 * Cada tipo de evento genera una imagen acorde a la narrativa, no solo la cara del jugador.
 */

export const CONTEXTUAL_IMAGE_PROMPTS: Record<string, (playerName: string, contextValue: string | number) => string> = {
  // REPRESENTANTE - Primera firma
  representante_primera_firma: (playerName: string, agentName: string | number) =>
    `Professional photograph: young footballer ${playerName} and agent ${String(agentName)} shaking hands and signing contract, modern office with desk, warm lighting, formal business setting, Getty Images quality, high resolution`,

  // TRANSFERENCIA - Fichaje por nuevo equipo
  transferencia_fichaje: (playerName: string, clubName: string | number) =>
    `Official team photo: young footballer ${playerName} posing with ${String(clubName)} jersey over shoulders, smiling confidently, stadium background, team colors dominant, professional club photography style, Getty Images quality`,

  // GOL - Celebración
  gol_celebracion: (playerName: string, clubName: string | number) =>
    `Action photograph: footballer ${playerName} mid-celebration after goal, arms raised, fist pump, intensity and joy, night match stadium lights, packed stadium in background, Getty Images sports photography style`,

  // LESIÓN - Momento dramático
  lesion_grave: (playerName: string) =>
    `Dramatic photograph: young footballer ${playerName} on ground, injured, medical staff approaching, pitch, emotional moment, serious atmosphere, professional sports photography`,

  // TROFEO - Levantando títulos
  trofeo_levantando: (playerName: string, trophyName: string | number) =>
    `Victory photograph: footballer ${playerName} lifting ${String(trophyName)} trophy, joy and pride, teammates around, confetti, stadium lights, professional sports photography, Getty Images quality`,

  // DEBUT - Primer partido
  debut_primer_partido: (playerName: string, clubName: string | number) =>
    `Professional action shot: young footballer ${playerName} in ${String(clubName)} kit during match, focused concentration, running with ball, match action, professional sports photography`,

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

  if (!promptFn) {
    return CONTEXTUAL_IMAGE_PROMPTS.default(playerName, playerAge);
  }

  if (!extraContext) {
    return promptFn(playerName, "");
  }

  const values = buildExtraContextDefaults(extraContext);
  const wantedKey = EVENT_TYPE_CONTEXT_KEY[key];
  const contextValue = wantedKey ? values[wantedKey] : "";

  return promptFn(playerName, contextValue || playerName);
}
