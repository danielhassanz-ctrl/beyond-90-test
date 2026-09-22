"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { applyConsequences, nextWeekGap, resolveOption, maybeAddFreeText } from "@/lib/narrative/engine";
import { tickInjury } from "@/lib/narrative/career-dynamics";
import { generatePlayerImage } from "@/lib/images/replicate";
import { uploadGeneratedImage } from "@/lib/images/upload";
import { checkImageGenerationQuota, logImageGeneration } from "@/lib/images/quota";
import { generateFromTemplate, saveAsTemplateIfMissing } from "@/lib/images/templates";
import { composeWarcaCover } from "@/lib/images/newspaper";
import { addShareBranding } from "@/lib/images/shareBranding";
import { getShareTagline } from "@/lib/shareTaglines";
import { GOL_CHILENA_EVENT_ID } from "@/lib/narrative/gol-chilena";
import { buildMatchContext } from "@/lib/constants";
import { describeKit } from "@/lib/clubColors";
import { getMilestoneImagePrompt } from "@/lib/images/milestonePrompts";
import { generateContractEvent } from "@/lib/narrative/ai";
import { buildFallbackContractEvent } from "@/lib/narrative/events";
import { MODE_TARGET_WEEKS, playerAge } from "@/types/career";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { extractStatsFromEvent, applyStatUpdate, recalculateMedia } from "@/lib/player/update-stats";
import { detectNewMilestones, buildMilestoneEvent } from "@/lib/narrative/career-milestones";
import { displayName } from "@/types/player";

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

  // Los "primeros" de verdad (primer gol, primer título) no dependen de
  // que la IA decida marcar el partido como memorable — se detectan por
  // las estadísticas reales del jugador, así siempre generan su momento
  // especial pase lo que pase con el resto del evento.
  const statUpdate = extractStatsFromEvent(event);
  const isFirstGoalEver = (player.stats_goals ?? 0) === 0 && (statUpdate.goals ?? 0) > 0;
  const isFirstHatTrickDebut = isFirstGoalEver && (statUpdate.goals ?? 0) >= 3;
  const isFirstTitleEver = (player.stats_titles ?? 0) === 0 && (statUpdate.titles ?? 0) > 0;

  const milestoneAchieved =
    (event.isMilestone && (!resolution || resolution.success)) ||
    isRetirementDecision ||
    isFirstGoalEver ||
    isFirstTitleEver;

  const patch = applyConsequences(player, consequences);

  // patrimonio tiene suelo en 0 (ver applyConsequences): si un gasto pedía
  // más de lo que había, el patrimonio final se recorta pero el registro
  // de movimientos guardaba el gasto completo pedido, no el que realmente
  // se aplicó — dos cifras que no cuadraban entre sí en la pantalla de
  // Patrimonio. Se guarda aparte el delta real para el ledger, sin tocar
  // `consequences` (que otras partes del código siguen leyendo tal cual).
  const ledgerConsequences =
    patch.patrimonio !== undefined && consequences.patrimonio !== undefined
      ? { ...consequences, patrimonio: patch.patrimonio - player.patrimonio }
      : consequences;

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
    event.id.startsWith("contrato-debut") ||
    // El momento decisivo (rematar/pasar/floritura) es parte del MISMO
    // partido que se resuelve justo después — no puede avanzar la
    // semana él solo, o el partido en sí saltaría a la jornada
    // siguiente sin haberse jugado nunca.
    event.id.startsWith("match-decision-");
  // Un partido resuelto (matchday-*) TIENE que avanzar la semana siempre:
  // si se deja al avance probabilístico normal, cuando sale 0 el jugador
  // vuelve a caer en la misma jornada y el partido se narra dos veces con
  // el mismo marcador — encontrado jugando una carrera real.
  const isSeasonCheckpoint = SEASON_CHECKPOINT_EVENT_IDS.has(event.id) || event.id.startsWith("matchday-");
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

  // Aplica los cambios de stats (statUpdate ya se calculó arriba, para
  // poder detectar "primer gol"/"primer título" antes de decidir si este
  // evento es un hito). Van en un update SEPARADO del resto (más abajo):
  // si alguna columna stats_* no existe todavía en la tabla, Supabase
  // rechaza la query entera — no debe poder tumbar el avance de semana,
  // el cambio de club o la foto, que son el update crítico del turno.
  // Hito de número redondo (10/25/50/100 goles, 50/100/200 partidos,
  // 10/25 asistencias) que este turno pueda haber cruzado — ver
  // career-milestones.ts. Se calcula aquí (con las stats de antes y
  // después de este turno) pero solo se encola más abajo, después de la
  // secuencia de rookie/fichaje, para que nunca le quite el sitio a algo
  // más importante que ya estuviera en camino.
  let roundNumberMilestone: ReturnType<typeof buildMilestoneEvent> = null;

  let statsPatch: Record<string, unknown> | null = null;
  if (Object.keys(statUpdate).length > 0) {
    const updatedPlayer = applyStatUpdate(player, statUpdate);
    const [crossedMilestone] = detectNewMilestones(
      {
        goals: player.stats_goals ?? 0,
        matches: player.stats_matches_played ?? 0,
        assists: player.stats_assists ?? 0,
      },
      {
        goals: updatedPlayer.stats_goals ?? 0,
        matches: updatedPlayer.stats_matches_played ?? 0,
        assists: updatedPlayer.stats_assists ?? 0,
      },
    );
    if (crossedMilestone) {
      roundNumberMilestone = buildMilestoneEvent(crossedMilestone, updatedPlayer);
    }
    // Los eventos de partido (generateMatchDayEvent) ya traen su propio
    // cambio de media en consequences.media, calibrado con la nota real
    // del partido (nota 8+ → +2 a +5, nota <6 → -1 a -3...) — mucho más
    // fino que este heurístico, que solo mira goles/asistencias/tarjeta
    // roja sin saber si jugaste bien o mal. Antes esta línea lo pisaba
    // SIEMPRE que hubiera stats que actualizar (o sea, en todo partido
    // real), tirando a la basura ese ajuste por nota y dejando el mismo
    // empujón de media a un partidazo sin gol que a una actuación gris:
    // recalculateMedia ahora solo entra como red de seguridad cuando el
    // propio evento no trae ya un cambio de media explícito.
    if (playerUpdate.media === undefined) {
      playerUpdate.media = recalculateMedia(updatedPlayer, statUpdate);
    }

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

  // Cuenta atrás de una lesión larga en curso (si la hay): se lee de
  // player.flags de ANTES de este turno, así que el flag que este mismo
  // evento acabe de crear (si es el que dispara la lesión) no se
  // descuenta hasta el turno siguiente. Se aplica encima de lo que ya
  // haya en playerUpdate.flags para no perder lo que puso el bloque de
  // arriba. Ver tickInjury en career-dynamics.ts.
  const injuryTick = tickInjury(player.flags);
  if (injuryTick) {
    const flagsBase = {
      ...((playerUpdate.flags as Record<string, string | boolean> | undefined) ?? player.flags ?? {}),
    };
    if (injuryTick.newValue === null) {
      delete flagsBase[injuryTick.flagKey];
    } else {
      flagsBase[injuryTick.flagKey] = injuryTick.newValue;
    }
    playerUpdate.flags = flagsBase;
    const formaBase = (patch.forma as number | undefined) ?? player.forma;
    playerUpdate.forma = Math.max(0, Math.min(100, Math.round(formaBase + injuryTick.formaDelta)));
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
    playerUpdate.pending_event = maybeAddFreeText(contractEvent);
  }

  // SECUENCIA COMPLETA DE CARRERA ROOKIE (semanas 4-11)
  // Pretemporada expandida (7 eventos) + Progresión hacia debut garantizado
  if (!willRetire) {
    // Pretemporada expandida (semanas 4-10, reemplaza los 3 eventos antiguos)
    if (event.id.startsWith("contrato-debut")) {
      const { buildPreseasonBienvenidaEvent } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildPreseasonBienvenidaEvent(player.club));
    } else if (event.id === "pretemp-bienvenida") {
      const { buildPreseasonFisicoEvent } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildPreseasonFisicoEvent());
    } else if (event.id === "pretemp-fisico") {
      const { buildPreseasonCompetenciaEvent } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildPreseasonCompetenciaEvent());
    } else if (event.id === "pretemp-competencia") {
      const { buildPreseasonTacticaEvent } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildPreseasonTacticaEvent());
    } else if (event.id === "pretemp-tactica") {
      const { buildPreseasonCapitan } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildPreseasonCapitan());
    } else if (event.id === "pretemp-capitan") {
      const { buildPreseasonPasado } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildPreseasonPasado());
    } else if (event.id === "pretemp-pasado") {
      const { buildPreseasonAmistoso } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildPreseasonAmistoso());
    }
    // Cadena de rookie: filial → tactica → debut oficial (semanas 11-15)
    else if (event.id === "pretemp-amistoso") {
      const { buildReservaIntroduccionEvent } = await import(
        "@/lib/narrative/rookie-progression"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildReservaIntroduccionEvent());
    } else if (event.id === "rookie-reserva-introduccion") {
      const { buildReservaPartidoEvent } = await import(
        "@/lib/narrative/rookie-progression"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildReservaPartidoEvent());
    } else if (event.id === "rookie-reserva-partido") {
      const { buildTacticaMisterEvent } = await import(
        "@/lib/narrative/rookie-progression"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildTacticaMisterEvent(player.position));
    } else if (event.id === "rookie-tactica-mister") {
      const { buildDebutAnuncioEvent } = await import(
        "@/lib/narrative/rookie-progression"
      );
      playerUpdate.pending_event = maybeAddFreeText(buildDebutAnuncioEvent());
    } else if (event.id === "rookie-debut-anuncio") {
      const { buildDebutOficialEvent } = await import(
        "@/lib/narrative/rookie-progression"
      );
      // Sin el rival real, esto se quedaba en el valor por defecto de la
      // función ("rival local"), un nombre de relleno que salía tal cual
      // en la ficha del partido — con escudo genérico y todo, en el
      // debut más importante de la carrera. Visto en vivo jugando.
      const { rival } = buildMatchContext(player.club, player.media);
      playerUpdate.pending_event = maybeAddFreeText(buildDebutOficialEvent(player.club, rival));
    }
    // Después de rookie-debut-oficial, cae en el pool normal pero YA HA DEBUTADO
  }

  // Si nada más importante reclamó ya el siguiente turno (fichaje, secuencia
  // de rookie...), y este turno cruzó un número redondo de verdad, esa es
  // la siguiente pantalla que ve el jugador.
  if (roundNumberMilestone && !playerUpdate.pending_event && !willRetire) {
    playerUpdate.pending_event = maybeAddFreeText(roundNumberMilestone);
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
      consequences: ledgerConsequences,
      outcome_text: outcomeText,
    })
    .select("id")
    .single();

  if (careerEventError) {
    console.error("[resolveEvent] career_events insert failed:", careerEventError.message);
  }

  let milestoneId: string | null = null;
  if (milestoneAchieved) {
    const currentAge = playerAge(player.week);
    const newClub = typeof consequences.club === "string" ? consequences.club : player.club;
    const currentAgentName = (playerUpdate.agent_name as string | undefined) ?? player.agent_name ?? undefined;

    // Título/tipo especiales para los "primeros" reales del jugador: no
    // dependen de cómo tituló la IA el partido, se imponen porque son
    // hechos objetivos de la carrera (ver detección más arriba).
    const overrideTitle = isFirstHatTrickDebut
      ? "¡Debut con HAT-TRICK!"
      : isFirstGoalEver
        ? "¡Tu primer gol como profesional!"
        : isFirstTitleEver
          ? "¡Tu primer título!"
          : null;
    const overrideMilestoneType = isFirstHatTrickDebut
      ? "primer_hat_trick"
      : isFirstGoalEver
        ? "primer_gol"
        : isFirstTitleEver
          ? "primer_titulo"
          : null;

    if (!isRetirementDecision) {
      const contextualPrompt = getMilestoneImagePrompt(
        event.id,
        currentAge,
        newClub,
        player.last_name,
        overrideMilestoneType ?? event.milestoneType,
        currentAgentName,
      );
      milestoneImagePrompt = contextualPrompt ?? event.imageScene ?? null;
    }

    // Los momentos garantizados de toda carrera (firma con el primer
    // equipo, debut oficial, primer gol/hat-trick, primer título) usan
    // una plantilla reutilizable + face-swap en vez de generar la escena
    // de cero cada vez: mismo club, misma composición — solo cambia la
    // cara del jugador. Ver src/lib/images/templates.ts.
    //
    // Con una única plantilla por club, TODOS los jugadores del juego que
    // fichasen por el mismo club acababan compartiendo literalmente la
    // misma foto (mismo encuadre, misma pose) con solo la cara distinta —
    // justo lo contrario de "cada partida es única" en el momento que más
    // se comparte. TEMPLATE_VARIANTS_PER_KEY hace que cada combinación
    // club+hito tenga varias composiciones posibles en vez de una sola: se
    // sigue ahorrando (el face-swap barato sigue haciendo la mayoría del
    // trabajo), pero un jugador nuevo tiene varias fotos distintas con las
    // que puede tocarle en vez de una fija para siempre.
    const TEMPLATE_VARIANTS_PER_KEY = 4;
    let templateKey: string | null = null;
    if (event.id.startsWith("contrato-debut")) {
      templateKey = `primera-firma:${newClub}`;
    } else if (event.id === "rookie-debut-oficial") {
      templateKey = `debut-liga:${newClub}`;
    } else if (isFirstHatTrickDebut) {
      templateKey = `primer-hat-trick:${newClub}`;
    } else if (isFirstGoalEver) {
      templateKey = `primer-gol:${newClub}`;
    } else if (isFirstTitleEver) {
      templateKey = `primer-titulo:${newClub}`;
    } else if (event.id === GOL_CHILENA_EVENT_ID) {
      templateKey = `gol-chilena:${newClub}`;
    }
    if (templateKey) {
      const variant = Math.floor(Math.random() * TEMPLATE_VARIANTS_PER_KEY);
      templateKey = `${templateKey}:v${variant}`;
    }

    // Antes de gastar en Replicate, comprueba el freno de gasto (por
    // usuario y global — ver src/lib/images/quota.ts).
    const willAttemptImage = !isRetirementDecision && Boolean(player.photo_url) && event.id !== "fork-retiro-pro";
    const quota = willAttemptImage ? await checkImageGenerationQuota(supabase, user.id) : null;
    if (quota && !quota.allowed) {
      console.warn(`[resolveEvent] Image generation will be skipped (${quota.reason}) for this milestone`);
    }
    const willGenerate = willAttemptImage && quota?.allowed === true;

    // Crea el milestone al instante, sin esperar a ninguna imagen — el
    // turno del jugador no debe bloquearse por una llamada a Replicate
    // que puede tardar minutos. image_status dice si hay foto en camino.
    //
    // Esto corre en el camino PRINCIPAL de resolveEvent (antes de
    // responder al jugador), no en segundo plano — sin el try/catch, un
    // fallo de red aquí (no un error normal de Supabase) podía tirar la
    // Server Action entera y perder la jugada del turno, no solo el
    // hito. Un hito es "nice to have" (la carrera sigue igual sin él, ver
    // el resto de esta función); nunca debería poder romper el turno.
    const milestoneType = isRetirementDecision ? "retiro_jugador" : (overrideMilestoneType ?? event.milestoneType ?? "hito");
    try {
      const { data: milestone, error: milestoneError } = await supabase
        .from("milestones")
        .insert({
          player_id: player.id,
          week: player.week,
          type: milestoneType,
          title: isRetirementDecision ? "Cuelga las botas" : (overrideTitle ?? event.title),
          subtitle: isRetirementDecision
            ? `Después de ${player.week} semanas como profesional`
            : overrideTitle
              ? event.title
              : (outcomeText ?? option.subtitle),
          image_url: null,
          image_status: willGenerate ? "pending" : "none",
        })
        .select("id")
        .single();
      if (milestoneError) {
        console.error("[resolveEvent] milestones insert failed:", milestoneError.message);
      }
      milestoneId = milestone?.id ?? null;
    } catch (err) {
      console.error("[resolveEvent] milestones insert threw:", err instanceof Error ? err.message : err);
      milestoneId = null;
    }

    // La generación real ocurre DESPUÉS de responder al jugador (after()),
    // así que ni la más lenta llamada a Kontext Pro (~3 min en frío,
    // medido) le bloquea el turno. Cuando termine, un pequeño componente
    // en la app avisa de que la foto está lista.
    if (milestoneId && willGenerate) {
      const finalMilestoneId = milestoneId;
      const finalPrompt = milestoneImagePrompt || event.imageScene || "jugador celebrando momento épico";
      const finalPhotoUrl = player.photo_url as string;
      const finalTemplateKey = templateKey;
      const finalUserId = user.id;
      const finalPlayerId = player.id;
      const finalIsGolChilena = event.id === GOL_CHILENA_EVENT_ID;
      const finalClub = newClub;
      const finalMilestoneType = milestoneType;
      // La portada del periódico imprime esto tal cual como titular — un
      // apodo real de futbolista suena más auténtico ahí que el apellido
      // formal ("La Pulga firma una obra de arte" en vez de "Messi").
      const finalPlayerName = displayName(player);

      after(async () => {
        try {
          let buffer: Buffer | null = null;
          let isFreshGeneration = false;

          if (finalTemplateKey) {
            const result = await generateFromTemplate(supabase, finalTemplateKey, finalPhotoUrl, finalPrompt);
            if (result) {
              buffer = result.buffer;
              isFreshGeneration = result.isFreshGeneration;
            }
          } else {
            buffer = await generatePlayerImage(finalPhotoUrl, finalPrompt);
          }

          if (!buffer) {
            console.error(`[resolveEvent:after] Image generation failed for milestone ${finalMilestoneId}`);
            await supabase.from("milestones").update({ image_status: "failed" }).eq("id", finalMilestoneId);
            return;
          }

          await logImageGeneration(supabase, finalUserId);

          // El gol de chilena no comparte una foto de acción tal cual —
          // esa foto se compone dentro de la portada "WARCA" (ver
          // src/lib/images/newspaper.ts). La foto de perfil que evoluciona
          // sí usa la foto de acción normal, no la portada del periódico.
          let milestoneBuffer = buffer;
          if (finalIsGolChilena) {
            try {
              milestoneBuffer = await composeWarcaCover(buffer, finalPlayerName, finalClub);
            } catch (err) {
              console.error("[resolveEvent:after] WARCA cover compositing failed, using plain photo:", err);
            }
          } else {
            // La portada WARCA ya lleva su propia marca ("Beyond 90" en el
            // pie); el resto de fotos de hito salían sin ninguna marca del
            // juego ni enlace para jugar — la mitad de destinos de compartir
            // (Instagram Stories entre ellos) descartan el texto que
            // acompaña a la imagen y solo llega el archivo desnudo.
            try {
              milestoneBuffer = await addShareBranding(buffer, getShareTagline(finalMilestoneType));
            } catch (err) {
              console.error("[resolveEvent:after] share branding compositing failed, using plain photo:", err);
            }
          }

          // allSettled, no all: uploadGeneratedImage ya no debería lanzar
          // (ver upload.ts), pero si algo inesperado lo hiciera igual, con
          // Promise.all un fallo en UNA subida tira también el resultado
          // de la otra que sí había ido bien — con allSettled cada una se
          // procesa por separado pase lo que pase con la otra.
          const [evolvedResult, milestoneResult] = await Promise.allSettled([
            uploadGeneratedImage(supabase, finalUserId, buffer, "look"),
            uploadGeneratedImage(supabase, finalUserId, milestoneBuffer, "milestone"),
          ]);
          const evolvedUrl = evolvedResult.status === "fulfilled" ? evolvedResult.value : null;
          const milestoneImageUrl = milestoneResult.status === "fulfilled" ? milestoneResult.value : null;
          if (evolvedResult.status === "rejected") {
            console.error("[resolveEvent:after] look upload rejected unexpectedly:", evolvedResult.reason);
          }
          if (milestoneResult.status === "rejected") {
            console.error("[resolveEvent:after] milestone upload rejected unexpectedly:", milestoneResult.reason);
          }

          if (evolvedUrl) {
            await supabase.from("players").update({ current_photo_url: evolvedUrl }).eq("id", finalPlayerId);
          }

          if (milestoneImageUrl) {
            await supabase
              .from("milestones")
              .update({ image_url: milestoneImageUrl, image_status: "ready" })
              .eq("id", finalMilestoneId);

            // La plantilla reutilizable siempre es la foto plana (evolvedUrl),
            // nunca la portada WARCA compuesta — el face-swap de la próxima
            // vez opera sobre una foto, no sobre un periódico con texto.
            if (finalTemplateKey && isFreshGeneration && evolvedUrl) {
              await saveAsTemplateIfMissing(supabase, finalTemplateKey, evolvedUrl);
            }
          } else {
            await supabase.from("milestones").update({ image_status: "failed" }).eq("id", finalMilestoneId);
          }
        } catch (err) {
          console.error(`[resolveEvent:after] Exception generating image for milestone ${finalMilestoneId}:`, err);
          await supabase.from("milestones").update({ image_status: "failed" }).eq("id", finalMilestoneId);
        }
      });
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
