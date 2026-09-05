"use server";

import { redirect } from "next/navigation";
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
import { MODE_TARGET_WEEKS } from "@/types/career";
import { getCurrentUserAndPlayer } from "@/lib/player";

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
  const newWeek = player.week + (isOnboarding ? 1 : nextWeekGap(player.media));
  const targetWeeks = MODE_TARGET_WEEKS[player.mode];
  const willRetire = !isRetirementDecision && player.mode !== "pro" && newWeek > targetWeeks;

  // Imágenes generadas (opcional): solo si el jugador subió una foto y el
  // evento las pide. Si falla por lo que sea, seguimos sin imagen.
  let milestoneImageUrl: string | null = null;
  if (milestoneAchieved && event.imageScene && player.photo_url) {
    const buffer = await generatePlayerImage(player.photo_url, event.imageScene);
    if (buffer) {
      milestoneImageUrl = await uploadGeneratedImage(supabase, user.id, buffer, "hito");
    }
  }

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
        image_url: milestoneImageUrl,
      })
      .select("id")
      .single();
    if (milestoneError) {
      console.error("[resolveEvent] milestones insert failed:", milestoneError.message);
    }
    milestoneId = milestone?.id ?? null;
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

  if (milestoneId) {
    redirect(`/carrera/hito/${milestoneId}`);
  }

  if (outcomeText && insertedEvent) {
    redirect(`/carrera/resultado/${insertedEvent.id}`);
  }

  if (willRetire) {
    redirect("/carrera/retiro");
  }

  redirect("/carrera");
}
