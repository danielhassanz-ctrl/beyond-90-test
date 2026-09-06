"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { applyConsequences, nextWeekGap, resolveOption } from "@/lib/narrative/engine";
import { generatePlayerImage } from "@/lib/images/replicate";
import { uploadGeneratedImage } from "@/lib/images/upload";
import { describeKit } from "@/lib/clubColors";
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

/** Prompts contextuales para tarjetas compartibles — SIN [FACE], deja que IA genere cara envejecida */
const MILESTONE_IMAGE_PROMPTS: Record<string, string> = {
  "contrato-debut": "Photorealistic professional portrait of [AGE] footballer holding up a [CLUB_KIT] football jersey with both hands at an official club unveiling event, a club president in a suit next to him extending a handshake, camera flashes, official club office backdrop, professional sports photography style, facial details clear and identifiable",
  "contrato-fallback": "Photorealistic professional portrait of [AGE] footballer holding up a [CLUB_KIT] football jersey with both hands at an official club unveiling event, a club director in a suit next to him, official contract on table, camera moment, official club photography, clear facial expression",
  "par-hat-trick": "Photorealistic sports photography of [AGE] footballer on a professional football pitch celebrating a goal, holding up three fingers proudly, teammates in background, stadium lights and crowd, dramatic moment, photojournalism style, face visible and clear",
  "fork-titulo-liga": "Photorealistic sports photography of [AGE] footballer lifting a large league trophy above his head on the pitch after winning, confetti falling around him, teammates and crowd in the background, stadium floodlights, triumphant moment, professional sports photography, happy expression",
  "fork-champions": "Photorealistic sports photography of [AGE] footballer lifting a large European club trophy on the pitch after winning a continental final, fireworks and confetti in the background, massive crowd, dramatic stadium lighting, celebratory moment, international sports photography, triumphant expression",
  "vid-boda": "Photorealistic wedding photo of [AGE] footballer in a formal suit, smiling warmly, with a few teammates and a coach figure visible in the background, elegant wedding venue, warm golden hour light, joyful celebration atmosphere, wedding photography style, clear facial features",
  "par-mvp-partido-clave": "Photorealistic sports photography of [AGE] footballer receiving a man-of-the-match award trophy on the pitch after a game, holding the trophy proudly, stadium lights, teammates applauding in the background, camera flashes, professional sports moment, proud expression",
  "rep-renovacion-contrato": "Photorealistic professional portrait of [AGE] footballer holding up a [CLUB_KIT] football jersey with both hands in a professional club office, a club director in a suit next to him, official contract on table, camera moment, official club photography, confident expression",
  "fork-ascenso-division": "Photorealistic sports photography of [AGE] footballer celebrating on the pitch after his team wins promotion, arms raised in joy, teammates joining the celebration, crowd visible in background, stadium atmosphere, triumphant moment, joyful expression",
  "premio-balon-oro": "Photorealistic photo of [AGE] footballer on a red carpet in a formal tuxedo at an award show gala, holding the Balón de Oro award, award show lighting, flashes from photographers, elegant awards ceremony atmosphere, sports awards ceremony style, proud expression",
  "sel-primera-convocatoria": "Photorealistic sports photography of [AGE] footballer in his national team kit on a professional football pitch, proud expression, national flag visible in background, stadium atmosphere, professional sports moment, clear facial features",
  "sel-capitania": "Photorealistic sports photography of [AGE] footballer wearing the captain's armband of his national team, holding the armband proudly, national team kit, stadium background, leadership moment, professional sports photography, confident look",
  "sel-mundial": "Photorealistic sports photography of [AGE] footballer in his national team kit celebrating passionately on a World Cup stadium pitch, huge crowd and confetti in the background, dramatic stadium lighting, momentous occasion, international tournament atmosphere, ecstatic expression",
  "sel-eurocopa": "Photorealistic sports photography of [AGE] footballer in his national team kit on a European championship pitch, celebrating with intensity, European stadium atmosphere, crowd in background, continental tournament moment, emotional expression",
  "sel-copa-america": "Photorealistic sports photography of [AGE] footballer in his national team kit celebrating on a South American stadium pitch, tropical atmosphere, crowd visible, continental tournament moment, joyful expression",
  "premio-pichichi": "Photorealistic sports photography of [AGE] footballer holding a trophy awarded for being the league's top scorer, trophy held high, stadium background, golden moment of recognition, professional sports photography, proud expression",
  "premio-mvp-torneo": "Photorealistic photo of [AGE] footballer on a stage with a large MVP trophy, holding it proudly, standing next to club officials and the trophy presentation table, award ceremony lighting, official moment of recognition, confident look",
};

function getMilestoneImagePrompt(eventId: string, age: number, club?: string): string | null {
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
      const contextualPrompt = getMilestoneImagePrompt(event.id, currentAge, newClub);
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
