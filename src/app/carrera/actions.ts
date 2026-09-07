"use server";

import { redirect } from "next/navigation";
import { applyConsequences, nextWeekGap, resolveOption } from "@/lib/narrative/engine";
import { generatePlayerImage } from "@/lib/images/replicate";
import { uploadGeneratedImage } from "@/lib/images/upload";
import { checkImageGenerationQuota, logImageGeneration } from "@/lib/images/quota";
import { describeKit } from "@/lib/clubColors";
import { getContextualImagePrompt } from "@/lib/narrative/contextual-image-prompts";
import { generateContractEvent } from "@/lib/narrative/ai";
import { buildFallbackContractEvent } from "@/lib/narrative/events";
import { MODE_TARGET_WEEKS, playerAge } from "@/types/career";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { extractStatsFromEvent, applyStatUpdate, recalculateMedia } from "@/lib/player/update-stats";
import { buildSecondCareerChoiceEvent } from "@/lib/narrative/second-career-events";

/** Prompts contextuales para tarjetas compartibles — cinematografía deportiva de máximo impacto */
const MILESTONE_IMAGE_PROMPTS: Record<string, string> = {
  "contrato-debut": "Epic cinematic photograph: [AGE] footballer in pristine [CLUB_KIT] football jersey, holding the jersey up with both hands in the center frame, absolutely beaming with pride and emotion. Club president shaking hands in sharp focus beside him. Background: blurred modern club office with floor-to-ceiling windows showing daylight, executive portraits on walls. Professional studio lighting casting perfect key light on face and jersey. Vibrant emerald-green field colors, crisp white jersey accents, golden morning light. Shot composition: dynamic diagonal lines, trophy visible on table behind, newspaper with headline visible on desk. Photojournalism award-winning sports photography, editorial fashion, emotional triumph captured in single frame, cinematic color grading, 8K detail",

  "contrato-fallback": "Golden hour cinematic sports photography: [AGE] footballer clutching his [CLUB_KIT] jersey like a trophy, eyes locked forward with determination and joy, contract papers and pen visible on mahogany table. Director in suit presenting official papers. Office background: expensive wooden panels, large club crest on wall, natural daylight flooding through windows. Warm golden hour light kissing his face, creating dramatic shadows that emphasize emotion. Color palette: deep burgundy, gold accents, crisp white papers. Ultra-sharp focus on expression and jersey details, shallow depth of field background. Professional sports portrait, Getty Images quality, raw emotion of beginning a dream career, cinematic lighting, premium photography",

  "par-hat-trick": "Explosive action photograph at night: [AGE] footballer mid-celebration with three fingers held high in the air, screaming with pure joy and ecstasy. Center frame dominance. Teammates rushing toward him in celebratory pile. Stadium background: dazzling LED lights creating vibrant color palette, massive crowd (thousands visible) creating bokeh of phone flashlights. Soccer ball visible in lower corner. Perfect lighting on face showing sweat, pure adrenaline, and triumph. Motion blur in background emphasizing the intensity. Ultra-vivid colors: neon green field markings, bright stadium whites, electric crowd energy. Sports moment that defines legacy, ESPN highlight reel quality, raw athletic ecstasy, 4K broadcast standards",

  "fork-titulo-liga": "Iconic trophy lift moment in golden stadium light: [AGE] footballer at apex of celebration, massive league trophy held high above head with both hands, pure joy radiating from face. Confetti explosion filling entire frame (photorealistic thick confetti clouds). Teammates surrounding, crowd visible going absolutely insane behind. Stadium floodlights creating perfect dramatic backlighting, golden hour glow, lens flare effects. Ground perspective: packed stadium seats, sea of supporters. Vibrant trophy gold reflections, field green, clear blue sky above stadium rim. This is the moment that wins sports photography awards — pure triumph, legacy-defining, family heirloom quality image. Cinematic sports moment, Getty Images iconic, museum-quality composition",

  "fork-champions": "Cinematic European grandeur: [AGE] footballer holding the enormous European club trophy (Champions League style) with both arms raised high, face glowing with historic achievement. MASSIVE fireworks exploding in sky behind him (real fireworks, not subtle). Confetti cannons firing in foreground. Packed stadium at night with thousands of phone lights creating magical bokeh. International crowd visible going insane. Perfect dramatic lighting: stadium floodlights + fireworks + golden trophy glow. Color palette: deep night blue sky, golden trophy reflections, white fireworks, vibrant crowd energy. This image is ICONIC — the kind that gets printed on sports posters, merchandise, coffee table books. Worldwide legacy moment. Cinematic masterpiece, Academy Awards level sports photography",

  "vid-boda": "Romantic wedding moment with athletic elegance: [AGE] footballer in crisp black tuxedo with white dress shirt, smiling warmly and genuinely. Standing with bride (or partner) by his side in wedding attire. Teammates visible in soft-focus background in formal wear, suggesting brotherhood witness. Elegant wedding venue: cathedral-style architecture, warm candlelight + natural golden hour sunlight streaming through tall windows. Floral arrangements in muted tones. Perfectly balanced lighting that emphasizes the couple's joy. Warm color palette: golden hour amber, champagne tones, white accents, deep blacks. Moment that transcends sport — human connection, love, legacy beyond football. High-fashion wedding photography standards, premium quality, emotional and genuine, sophisticated and timeless",

  "par-mvp-partido-clave": "Triumphant award moment under stadium lights: [AGE] footballer holding the man-of-the-match trophy at chest level, beaming with pride, facing camera directly. On-field setting: grass visible, stadium lights creating dramatic key lighting on face. Teammates applauding in background (some with hands up), coach nodding approvingly. Camera flashes visible (bokeh) creating energy. Pristine [CLUB_KIT] jersey with sweat and effort visible but immaculate. Color palette: emerald field, vibrant stadium lighting, golden trophy accents, white crowd areas. This is the moment every athlete dreams of — individual recognition in team sport. Perfect composition, dynamic diagonal lines, award-winning sports photography, emotional authenticity",

  "rep-renovacion-contrato": "Power moment of commitment: [AGE] footballer in [CLUB_KIT] jersey holding it up with absolute conviction, signing a major contract. Club president or director shaking hand while nodding approvingly. Modern executive office: glass walls, minimalist design, large windows with city skyline visible behind. Dramatic side-lighting emphasizing resolve and determination on face. Mahogany contract on table with visible signatures. Color palette: crisp whites, deep blacks, jewel tones, city lights bokeh through windows. This represents dedication and loyalty — not just money, but legacy commitment. Premium sports business photography, editorial quality, aspirational imagery",

  "fork-ascenso-division": "Celebratory pitch invasion moment: [AGE] footballer with arms raised in pure joy, teammates surrounding in celebratory embrace. Field is packed with celebrating players. Crowd visible going absolutely wild in background. Stadium atmosphere electric. Evening/dusk lighting creating dramatic shadows and warm tones. Grass fresh and vibrant green, white pitch lines sharp. Multiple celebrations happening simultaneously creating kinetic energy. Color palette: natural field greens, blue sky, warm sunset tones, crowd colors. This is about collective triumph — the entire team rising together. Epic cinematic sports moment, documentary photography quality, pure team joy",

  "premio-balon-oro": "Red carpet royalty moment: [AGE] footballer in impeccable black tuxedo with white bow tie, holding the iconic Balón de Oro trophy at waist level, confident and composed smile. Red carpet stretches behind. Professional event photographers visible (bokeh flashes in background). Elegant awards ceremony backdrop with luxury branding. Theatrical stage lighting creating perfect skin tones and highlighting the trophy's gleaming surfaces. Formal audience members in background in evening wear. Color palette: deep blacks and golds, rich burgundy carpet, white dress shirts, golden trophy reflection. This represents the pinnacle of individual achievement — the world's best footballer. Premium fashion and sports photography combined, museum-quality, aspirational and iconic",

  "sel-primera-convocatoria": "Pride and patriotism: [AGE] footballer in pristine national team kit (perfectly clean and tailored), standing tall with hand on heart or fist raised. National flag visible prominently in background (not blurred, clearly visible). Modern national team stadium as backdrop. Patriotic lighting — dramatic and respectful. Fellow players visible in formation behind. Color palette: national colors prominent and vibrant, field green, clear sky. This is about representing your nation — honor, duty, pride. Cinematic national anthem quality, official team photography, emotional and respectful composition",

  "sel-capitania": "Leadership embodied: [AGE] footballer wearing captain's armband prominently (armband large and perfectly visible in frame), holding it proudly with one hand, looking forward with absolute confidence and maturity. National team kit impeccable. Teammates visible behind in formation, showing respect. Stadium background, focused intensity. Dramatic professional lighting emphasizing maturity and responsibility. Color palette: national colors, armband color prominent, field backdrop. This represents the peak of leadership in international football. Premium editorial sports photography, iconic leadership imagery, dignified and inspiring",

  "sel-mundial": "World Cup triumph moment: [AGE] footballer in national team kit jumping with ecstatic celebration, arms spread wide, absolutely screaming with joy. World Cup stadium (iconic) in background. MASSIVE crowd visible going insane, confetti in air. Multiple teammates joining celebration in frame. Incredible stadium lighting creating cinematic atmosphere. Ball visible in frame or goal posts. Color palette: national colors vivid and dominant, stadium greens, crowd colors, night lighting creating dramatic contrast. This is the moment of ultimate international achievement. World-class sports photography, Getty Images iconic, FIFA quality imagery, life-defining moment",

  "sel-eurocopa": "Continental triumph: [AGE] footballer celebrating with intensity on European championship pitch, arms raised, teammates joining. Iconic European stadium architecture visible. European crowd (diverse, colorful). Evening/night lighting creating dramatic European stadium atmosphere. Flag of nation visible. Color palette: national colors vibrant, European stadium architecture tones, diverse crowd colors. This represents continental-level achievement. Premier League/UEFA quality photography, prestigious international moment, emotional and triumphant",

  "sel-copa-america": "Passion and celebration: [AGE] footballer celebrating on South American championship pitch with raw emotion and passion, teammates embracing. Tropical stadium atmosphere (palm trees, warm colors visible). South American crowd energy visible. Warm lighting creating golden tones. Field vibrant green, sky warm. National colors dominant. Color palette: tropical warmth, national pride colors, green field, golden hour tones. This represents continental South American achievement. Dynamic action photography, celebratory intensity, colorful and vibrant composition",

  "premio-pichichi": "Golden scorer's moment: [AGE] footballer holding the Pichichi trophy high with victorious smile, golden trophy gleaming. Stadium background, field visible. Golden hour lighting or theatrical stage lighting creating trophy reflection. Soccer ball visible in composition. Teammates or crowd in soft focus background. Color palette: golden trophy dominant, emerald field, warm lighting, white crowd areas. This represents the pinnacle of individual scoring achievement — the top goal-scorer of the league. Premium sports photography, golden hour cinematography, achievement imagery",

  "premio-mvp-torneo": "Tournament MVP crowning moment: [AGE] footballer on stage holding massive MVP trophy, standing between club officials or ceremony presenters. Stage background with tournament branding visible. Professional event lighting creating perfect visibility of trophy and expression. Audience visible (blurred), creating atmosphere. Formal presentation moment captured. Color palette: stage lighting tones, trophy gold, formal blacks and whites, crowd bokeh. This represents tournament-level individual dominance. Premium award ceremony photography, official tournament imagery, prestige and achievement captured",
};

/**
 * Traduce los milestoneType usados en el motor narrativo a los tipos de
 * escena que sabe dibujar contextual-image-prompts.ts. Cualquier tipo que
 * no aparezca aquí cae al event.imageScene (que la IA ya genera contextual
 * por evento) en vez de forzar un genérico.
 */
const MILESTONE_TYPE_TO_CONTEXT_TYPE: Record<string, string> = {
  representante: "representante_primera_firma",
  fichaje_agente: "representante_primera_firma",
  puja_agente: "representante_primera_firma",
  agencia: "representante_primera_firma",
  contrato: "transferencia_fichaje",
  fichaje_galactico: "transferencia_fichaje",
  oferta_fondo: "transferencia_fichaje",
  cantera: "transferencia_fichaje",
  cantera_propia: "transferencia_fichaje",
  canterano: "transferencia_fichaje",
  filial: "transferencia_fichaje",
  debut: "debut_primer_partido",
  lesion_debut: "debut_primer_partido",
  gol: "gol_celebracion",
  gol_decisivo: "gol_celebracion",
  hat: "gol_celebracion",
  titulo: "trofeo_levantando",
  titulo_presidente: "trofeo_levantando",
  final_champions: "trofeo_levantando",
  copa_america: "trofeo_levantando",
  eurocopa: "trofeo_levantando",
  mundial: "trofeo_levantando",
  capitania: "capitan_brazalete",
  premio: "recordista_marca",
  balon_oro_cliente: "recordista_marca",
  hall_fama: "recordista_marca",
  prensa: "entrevista_prensa",
  fondo_deportivo: "beneficencia_caridad",
  mvp: "victoria_epica",
  tactica: "entrenamiento_intenso",
  pretemp: "entrenamiento_intenso",
  pretemporada: "entrenamiento_intenso",
  seleccion: "debut_internacional",
  presidente_federacion: "debut_internacional",
};

function getMilestoneImagePrompt(
  eventId: string,
  age: number,
  club?: string,
  playerName?: string,
  milestoneType?: string,
  agentName?: string,
): string | null {
  const safePlayerName = playerName || "jugador";

  // 1) Prompts cinematográficos hechos a mano para IDs de evento conocidos
  //    (los más elaborados: fichaje, hat-trick, título, boda, Balón de Oro...)
  const basePrompt = MILESTONE_IMAGE_PROMPTS[eventId];
  if (basePrompt) {
    let prompt = basePrompt;
    const ageContext =
      age < 18
        ? "young 16-17 year old footballer"
        : age < 23
          ? "young 20-23 year old footballer"
          : age < 28
            ? "experienced 25-28 year old footballer"
            : age < 32
              ? "veteran 30-32 year old footballer"
              : "35+ year old experienced veteran footballer";
    prompt = prompt.replace("[AGE]", ageContext);
    if (club && prompt.includes("[CLUB_KIT]")) {
      prompt = prompt.replace("[CLUB_KIT]", describeKit(club));
    }
    return prompt;
  }

  // 2) Sin ID exacto: mapea el milestoneType a un tipo de escena contextual
  //    real (agente, camiseta, gol, trofeo...), nunca al eventId crudo.
  const mappedType = milestoneType ? MILESTONE_TYPE_TO_CONTEXT_TYPE[milestoneType] : undefined;
  if (mappedType) {
    return getContextualImagePrompt(mappedType, safePlayerName, age, {
      clubName: club || "",
      agentName: agentName || "su representante",
    });
  }

  // 3) Sin match conocido: deja que el caller use event.imageScene, que la
  //    IA ya genera específico para ese evento — mejor que un genérico.
  return null;
}

export async function resolveEvent(formData: FormData) {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player) {
    redirect("/login");
  }

  const eventId = formData.get("event_id") as string;
  const optionId = formData.get("option_id") as string;
  const freeText = (formData.get("free_text") as string) || null;

  // El evento vivo se lee siempre de lo que quedó guardado en el servidor
  // (nunca de lo que mande el formulario), así ninguna consecuencia puede
  // falsearse editando el HTML del lado del cliente.
  const event = player.pending_event?.id === eventId ? player.pending_event : null;
  const option = event?.options.find((o) => o.id === optionId);

  if (!event || !option) {
    redirect("/carrera");
  }

  const resolution = resolveOption(option, player);
  const consequences = resolution ? resolution.consequences : option.consequences;
  const outcomeText = resolution ? resolution.text : null;

  const isRetirementDecision =
    (event.id === "fork-retiro-pro" && option.id === "retirarse") ||
    (event.id === "transition-ready-to-retire" && option.id === "retirarse");
  const isSecondCareerChoice = event.id === "fork-segunda-vida-elegir";
  const milestoneAchieved =
    (event.isMilestone && (!resolution || resolution.success)) || isRetirementDecision;

  const patch = applyConsequences(player, consequences);

  // La secuencia garantizada de arranque (elegir representante, ofertas,
  // firma del contrato, pretemporada, filial hasta el debut oficial) es
  // TODA pretemporada narrativamente — no debe adelantar el calendario real,
  // o la edad (que es una función pura de la semana) sube antes de que el
  // jugador llegue siquiera a debutar. Solo dos saltos deliberados de una
  // semana: al cerrar la pretemporada con el amistoso, y al debutar de
  // verdad, que es cuando entra la temporada real (Liga desde semana 3).
  const CALENDAR_LOCKED_EVENT_IDS = new Set([
    "inicio-fichaje-agente",
    "pretemp-bienvenida",
    "pretemp-fisico",
    "pretemp-competencia",
    "pretemp-tactica",
    "pretemp-capitan",
    "pretemp-pasado",
    "rookie-reserva-introduccion",
    "rookie-reserva-partido",
    "rookie-tactica-mister",
    "rookie-debut-anuncio",
  ]);
  const SEASON_CHECKPOINT_EVENT_IDS = new Set(["pretemp-amistoso", "rookie-debut-oficial"]);
  const isCalendarLocked =
    CALENDAR_LOCKED_EVENT_IDS.has(event.id) ||
    event.id.startsWith("first-signing-") ||
    event.id.startsWith("contrato-debut");
  const isSeasonCheckpoint = SEASON_CHECKPOINT_EVENT_IDS.has(event.id);
  const newWeek = isCalendarLocked
    ? player.week
    : isSeasonCheckpoint
      ? player.week + 1
      : player.week + nextWeekGap(player.media, player.mode);
  const targetWeeks = MODE_TARGET_WEEKS[player.mode];
  const willRetire = !isRetirementDecision && player.mode !== "pro" && newWeek > targetWeeks;

  // Imágenes generadas (opcional): solo si el jugador subió una foto y el
  // evento las pide. Se generan en background sin bloquear la respuesta.
  // Usa prompts contextuales de la skill cartas-compartibles.
  let milestoneImagePrompt: string | null = null;

  const playerUpdate: Record<string, unknown> = { ...patch };

  // Si es elección de segunda carrera, guardar la carrera elegida
  if (isSecondCareerChoice) {
    const secondCareerMap: Record<string, string> = {
      entrenador: "entrenador",
      comentarista: "comentarista",
      empresario: "empresario",
      embajador: "embajador",
      alejarse: "privado",
    };
    playerUpdate.second_career = secondCareerMap[option.id] || null;
  }

  // Actualizar estadísticas del jugador basándose en el evento. Van en un
  // update SEPARADO del resto (más abajo): si alguna columna stats_* no
  // existe todavía en la tabla, Supabase rechaza la query entera — no debe
  // poder tumbar el avance de semana, el cambio de club o la foto, que son
  // el update crítico del turno.
  const statUpdate = extractStatsFromEvent(event);
  let statsPatch: Record<string, unknown> | null = null;
  if (Object.keys(statUpdate).length > 0) {
    const updatedPlayer = applyStatUpdate(player, statUpdate);
    playerUpdate.media = recalculateMedia(updatedPlayer, statUpdate); // esto sí es crítico

    statsPatch = {
      stats_matches_played: updatedPlayer.stats_matches_played,
      stats_goals: updatedPlayer.stats_goals,
      stats_assists: updatedPlayer.stats_assists,
      stats_minutes_played: updatedPlayer.stats_minutes_played,
      stats_red_cards: updatedPlayer.stats_red_cards,
      stats_yellow_cards: updatedPlayer.stats_yellow_cards,
      stats_titles: updatedPlayer.stats_titles,
    };
  }

  if (consequences.flags || event.memorableThread) {
    playerUpdate.flags = {
      ...player.flags,
      ...consequences.flags,
      ...(event.memorableThread ? { [`hilo_${Date.now()}`]: event.memorableThread } : {}),
    };
  }

  if (consequences.agent_name) {
    playerUpdate.agent_name = consequences.agent_name;
  }

  // Cada vez que hay un fichaje (el inicial o cualquier traspaso), la
  // siguiente pantalla es la firma del contrato con el míster, el
  // presidente y el representante — nunca se vuelve al pool normal
  // directamente después de cambiar de club.
  const isFirstSigning = event.id === "inicio-fichaje-agente";
  if (typeof consequences.club === "string" && !willRetire) {
    const newClub = consequences.club;
    const agentName = (playerUpdate.agent_name as string | undefined) ?? player.agent_name ?? "tu representante";
    const aiContractEvent = await generateContractEvent(
      { ...player, club: newClub, agent_name: agentName },
      newClub,
      isFirstSigning,
    );
    const contractEvent = aiContractEvent
      ? {
          ...aiContractEvent,
          isMilestone: true,
          milestoneType: "contrato",
          imageScene: `Photorealistic photo of the photographed man holding up a ${describeKit(newClub)} football jersey with both hands at an official club unveiling event, a club president in a suit next to him extending a handshake, camera flashes, stadium or press room backdrop, official club photo style`,
        }
      : buildFallbackContractEvent(newClub, agentName, isFirstSigning);
    playerUpdate.pending_event = contractEvent;
  }

  // SECUENCIA COMPLETA DE CARRERA ROOKIE (semanas 4-11)
  // Pretemporada expandida (7 eventos) + Progresión hacia debut garantizado
  if (!willRetire) {
    // Pretemporada expandida (semanas 4-10, reemplaza los 3 eventos antiguos)
    if (event.id.startsWith("contrato-debut")) {
      const { buildPreseasonBienvenidaEvent } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = buildPreseasonBienvenidaEvent(player.club);
    } else if (event.id === "pretemp-bienvenida") {
      const { buildPreseasonFisicoEvent } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = buildPreseasonFisicoEvent();
    } else if (event.id === "pretemp-fisico") {
      const { buildPreseasonCompetenciaEvent } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = buildPreseasonCompetenciaEvent();
    } else if (event.id === "pretemp-competencia") {
      const { buildPreseasonTacticaEvent } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = buildPreseasonTacticaEvent();
    } else if (event.id === "pretemp-tactica") {
      const { buildPreseasonCapitan } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = buildPreseasonCapitan();
    } else if (event.id === "pretemp-capitan") {
      const { buildPreseasonPasado } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = buildPreseasonPasado();
    } else if (event.id === "pretemp-pasado") {
      const { buildPreseasonAmistoso } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = buildPreseasonAmistoso();
    }
    // Cadena de rookie: filial → tactica → debut oficial (semanas 11-15)
    else if (event.id === "pretemp-amistoso") {
      const { buildReservaIntroduccionEvent } = await import(
        "@/lib/narrative/rookie-progression"
      );
      playerUpdate.pending_event = buildReservaIntroduccionEvent();
    } else if (event.id === "rookie-reserva-introduccion") {
      const { buildReservaPartidoEvent } = await import(
        "@/lib/narrative/rookie-progression"
      );
      playerUpdate.pending_event = buildReservaPartidoEvent();
    } else if (event.id === "rookie-reserva-partido") {
      const { buildTacticaMisterEvent } = await import(
        "@/lib/narrative/rookie-progression"
      );
      playerUpdate.pending_event = buildTacticaMisterEvent();
    } else if (event.id === "rookie-tactica-mister") {
      const { buildDebutAnuncioEvent } = await import(
        "@/lib/narrative/rookie-progression"
      );
      playerUpdate.pending_event = buildDebutAnuncioEvent();
    } else if (event.id === "rookie-debut-anuncio") {
      const { buildDebutOficialEvent } = await import(
        "@/lib/narrative/rookie-progression"
      );
      playerUpdate.pending_event = buildDebutOficialEvent(player.club);
    }
    // Después de rookie-debut-oficial, cae en el pool normal pero YA HA DEBUTADO
  }

  const { data: insertedEvent, error: careerEventError } = await supabase
    .from("career_events")
    .insert({
      player_id: player.id,
      week: player.week,
      event_id: event.id,
      category: event.category,
      title: event.title,
      description: event.description,
      chosen_option_id: option.id,
      chosen_option_label: option.label,
      free_text_response: freeText,
      consequences,
      outcome_text: outcomeText,
    })
    .select("id")
    .single();

  if (careerEventError) {
    console.error("[resolveEvent] career_events insert failed:", careerEventError.message);
  }

  let milestoneId: string | null = null;
  if (milestoneAchieved) {
    // Crea el milestone sin imagen (responde rápido)
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .insert({
        player_id: player.id,
        week: player.week,
        type: isRetirementDecision ? "retiro_jugador" : (event.milestoneType ?? "hito"),
        title: isRetirementDecision ? "Cuelga las botas" : event.title,
        subtitle: isRetirementDecision
          ? `Después de ${player.week} semanas como profesional`
          : (outcomeText ?? option.subtitle),
        image_url: null, // Sin imagen por ahora (se genera en background)
      })
      .select("id")
      .single();
    if (milestoneError) {
      console.error("[resolveEvent] milestones insert failed:", milestoneError.message);
    }
    milestoneId = milestone?.id ?? null;

    // Prepara para generar imagen en background (solo si hay contexto)
    if (milestoneId && !isRetirementDecision) {
      const newClub = typeof consequences.club === "string" ? consequences.club : player.club;
      const currentAge = playerAge(player.week);
      const currentAgentName = (playerUpdate.agent_name as string | undefined) ?? player.agent_name ?? undefined;
      const contextualPrompt = getMilestoneImagePrompt(event.id, currentAge, newClub, player.last_name, event.milestoneType, currentAgentName);
      milestoneImagePrompt = contextualPrompt ?? event.imageScene ?? null;
    }

    // Solo generar imagen en momentos épicos (milestones). Una sola llamada
    // a Replicate por hito: la misma imagen sirve para la foto que evoluciona
    // al jugador y para la tarjeta compartible del hito (antes se generaban
    // dos veces la misma escena, y la de la tarjeta iba a un fetch con URL
    // relativa que siempre fallaba en el server action — la tarjeta nunca
    // tuvo imagen).
    //
    // Antes de gastar en Replicate, comprueba el freno de gasto (por usuario
    // y global — ver src/lib/images/quota.ts). Si no hay hueco, el hito se
    // crea igual, solo sin milestoneImageUrl: la página de hito ya tiene un
    // fallback con la foto propia del jugador sin editar, así que nadie ve
    // un error, el juego nunca se rompe por esto.
    const quota = milestoneId && player.photo_url ? await checkImageGenerationQuota(supabase, user.id) : null;
    if (quota && !quota.allowed) {
      console.warn(`[resolveEvent] Image generation skipped (${quota.reason}) for milestone ${milestoneId}`);
    }

    if (
      milestoneId &&
      player.photo_url &&
      quota?.allowed &&
      (event.id !== "fork-retiro-pro" || isRetirementDecision)
    ) {
      const imagePrompt = milestoneImagePrompt || event.imageScene || "jugador celebrando momento épico";
      const buffer = await generatePlayerImage(player.photo_url as string, imagePrompt as string);
      if (buffer) {
        await logImageGeneration(supabase, user.id);
        const [evolvedUrl, milestoneImageUrl] = await Promise.all([
          uploadGeneratedImage(supabase, user.id, buffer, "look"),
          uploadGeneratedImage(supabase, user.id, buffer, "milestone"),
        ]);
        if (evolvedUrl) {
          playerUpdate.current_photo_url = evolvedUrl;
        }
        if (milestoneImageUrl) {
          const { error: milestoneImageError } = await supabase
            .from("milestones")
            .update({ image_url: milestoneImageUrl })
            .eq("id", milestoneId);
          if (milestoneImageError) {
            console.error("[resolveEvent] milestone image_url update failed:", milestoneImageError.message);
          }
        }
      } else {
        console.error(`[resolveEvent] Image generation failed for milestone ${milestoneId} (prompt: ${imagePrompt.slice(0, 120)}...)`);
      }
    }
  }

  const { error: playerUpdateError } = await supabase
    .from("players")
    .update({
      pending_event: null,
      ...playerUpdate,
      week: newWeek,
      status: isSecondCareerChoice ? "second_life" : isRetirementDecision ? "awaiting_second_life" : willRetire ? "retired" : "active",
    })
    .eq("id", player.id);

  if (playerUpdateError) {
    console.error("[resolveEvent] players update failed:", playerUpdateError.message);
  }

  // Update de stats aparte y best-effort: si falta alguna columna stats_*
  // en la tabla, que se quede corta la estadística, no la partida entera.
  if (statsPatch) {
    const { error: statsUpdateError } = await supabase
      .from("players")
      .update(statsPatch)
      .eq("id", player.id);
    if (statsUpdateError) {
      console.error("[resolveEvent] stats update failed (non-blocking):", statsUpdateError.message);
    }
  }

  if (milestoneId) {
    redirect(`/carrera/hito/${milestoneId}`);
  }

  if (outcomeText && insertedEvent) {
    redirect(`/carrera/resultado/${insertedEvent.id}`);
  }

  if (willRetire) {
    redirect("/carrera/retiro");
  }

  // Redirect siempre fuerza el navegador a recarga el servidor
  redirect("/carrera");
}
