"use server";

import { redirect } from "next/navigation";
import { applyConsequences, nextWeekGap, resolveOption } from "@/lib/narrative/engine";
import { generatePlayerImage } from "@/lib/images/replicate";
import { uploadGeneratedImage } from "@/lib/images/upload";
import { describeKit } from "@/lib/clubColors";
import { getContextualImagePrompt } from "@/lib/narrative/contextual-image-prompts";
import {
  generateContractEvent,
  generateDebutPretemp1,
  generateDebutPretemp2,
  generateDebutPretemp3,
} from "@/lib/narrative/ai";
import {
  buildDebutPretemp1,
  buildDebutPretemp2,
  buildDebutPretemp3,
  buildFallbackContractEvent,
} from "@/lib/narrative/events";
import { MODE_TARGET_WEEKS, playerAge } from "@/types/career";
import { getCurrentUserAndPlayer } from "@/lib/player";

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

function getMilestoneImagePrompt(eventId: string, age: number, club?: string, playerName?: string): string | null {
  // Primero intenta usar prompts contextuales específicos
  const safePlayerName = playerName || "jugador";
  const contextualPrompt = getContextualImagePrompt(eventId, safePlayerName, age, {
    clubName: club || "",
    agentName: "agente",
  });
  if (contextualPrompt) return contextualPrompt;

  // Fallback a milestone prompts existentes
  const basePrompt = MILESTONE_IMAGE_PROMPTS[eventId];
  if (!basePrompt) return null;

  let prompt = basePrompt;

  // Reemplaza [AGE] con descripción de edad
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

  // Reemplaza [CLUB_KIT] si el evento incluye información de club
  if (club && prompt.includes("[CLUB_KIT]")) {
    prompt = prompt.replace("[CLUB_KIT]", describeKit(club));
  }

  return prompt;
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

  const isRetirementDecision = event.id === "fork-retiro-pro" && option.id === "retirarse";
  const milestoneAchieved =
    (event.isMilestone && (!resolution || resolution.success)) || isRetirementDecision;

  const patch = applyConsequences(player, consequences);

  // La secuencia de bienvenida (elegir representante, primeras ofertas,
  // firma del contrato, pretemporada) es parte del mismo arranque de la
  // carrera: no debe "gastar" calendario, o el modo Express se termina
  // antes de que el jugador llegue a jugar nada.
  const ONBOARDING_EVENT_IDS = new Set(["eleccion-representante", "inicio-fichaje-agente", "debut-pretemp-1", "debut-pretemp-2", "debut-pretemp-3"]);
  const isOnboarding = ONBOARDING_EVENT_IDS.has(event.id) || event.id.startsWith("contrato-debut");
  const newWeek = player.week + (isOnboarding ? 1 : nextWeekGap(player.media, player.mode));
  const targetWeeks = MODE_TARGET_WEEKS[player.mode];
  const willRetire = !isRetirementDecision && player.mode !== "pro" && newWeek > targetWeeks;

  // Imágenes generadas (opcional): solo si el jugador subió una foto y el
  // evento las pide. Se generan en background sin bloquear la respuesta.
  // Usa prompts contextuales de la skill cartas-compartibles.
  let imagePromptForBackground: string | null = null;

  const playerUpdate: Record<string, unknown> = { ...patch };

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

  const evolveLookNow =
    event.lookEvolution && player.photo_url && (event.id !== "fork-retiro-pro" || isRetirementDecision);
  if (evolveLookNow) {
    const buffer = await generatePlayerImage(player.photo_url as string, event.lookEvolution as string);
    if (buffer) {
      const evolvedUrl = await uploadGeneratedImage(supabase, user.id, buffer, "look");
      if (evolvedUrl) {
        playerUpdate.current_photo_url = evolvedUrl;
      }
    }
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

  // Secuencia de pretemporada garantizada tras el primer contrato: se
  // encadena un beat detrás de otro antes de caer en el pool normal, para
  // que el arranque de la carrera se sienta narrado. Cada beat se genera
  // con IA (para que no suene siempre igual) con la versión escrita a mano
  // como reserva si la IA falla.
  if (!willRetire) {
    if (event.id.startsWith("contrato-debut")) {
      playerUpdate.pending_event =
        (await generateDebutPretemp1(player.club)) ?? buildDebutPretemp1(player.club);
    } else if (event.id === "debut-pretemp-1") {
      playerUpdate.pending_event =
        (await generateDebutPretemp2(player.club)) ?? buildDebutPretemp2();
    } else if (event.id === "debut-pretemp-2") {
      playerUpdate.pending_event = (await generateDebutPretemp3()) ?? buildDebutPretemp3();
    }
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
      const contextualPrompt = getMilestoneImagePrompt(event.id, currentAge, newClub, player.last_name);
      imagePromptForBackground = contextualPrompt ?? event.imageScene ?? null;
    }
  }

  const { error: playerUpdateError } = await supabase
    .from("players")
    .update({
      pending_event: null,
      ...playerUpdate,
      week: newWeek,
      status: isRetirementDecision ? "awaiting_second_life" : willRetire ? "retired" : "active",
    })
    .eq("id", player.id);

  if (playerUpdateError) {
    console.error("[resolveEvent] players update failed:", playerUpdateError.message);
  }

  // Genera imagen en background sin bloquear (fire-and-forget)
  if (milestoneId && imagePromptForBackground && player.photo_url) {
    fetch("/api/generate-milestone-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        milestoneId,
        photoUrl: player.photo_url,
        imagePrompt: imagePromptForBackground,
        userId: user.id,
      }),
    }).catch((err) => console.error("[background image gen]", err));
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
