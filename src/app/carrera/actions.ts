"use server";

import { simulateOffScreenMatches, addSimSeasonStats } from "@/lib/narrative/off-screen-matches";
import { defaultReaction } from "@/lib/narrative/default-reactions";
import { sponsorshipFlagFor } from "@/lib/finance/sponsorship-income";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { applyConsequences, resolveOption, maybeAddFreeText } from "@/lib/narrative/engine";
import { tickInjury } from "@/lib/narrative/career-dynamics";
import { generatePlayerImage } from "@/lib/images/replicate";
import { personalizeEvent } from "@/lib/narrative/npcs";
import { uploadGeneratedImage } from "@/lib/images/upload";
import { checkImageGenerationQuota, logImageGeneration } from "@/lib/images/quota";
import { hasImageCredit, consumeImageCredit } from "@/lib/images/credits";
import { generateFromTemplate, saveAsTemplateIfMissing } from "@/lib/images/templates";
import { composeWarcaCover } from "@/lib/images/newspaper";
import { addShareBranding } from "@/lib/images/shareBranding";
import { getShareTagline } from "@/lib/shareTaglines";
import { GOL_CHILENA_EVENT_ID } from "@/lib/narrative/gol-chilena";
import { buildMatchContext, NO_CLUB_YET } from "@/lib/constants";
import { describeKit } from "@/lib/clubColors";
import { describeLook } from "@/lib/playerLook";
import { composeDmCard } from "@/lib/images/dmCard";
import { getMilestoneImagePrompt, withSceneGuards } from "@/lib/images/milestonePrompts";
import { generateContractEvent } from "@/lib/narrative/ai";
import { buildFallbackContractEvent } from "@/lib/narrative/events";
import { MODE_TARGET_WEEKS, WEEKS_PER_SEASON, playerAge, COACH_STANCE_TARGET } from "@/types/career";
import { computeWeekAdvance } from "@/lib/narrative/week-advance";
import { buildLedgerEntry, appendLedger } from "@/lib/narrative/ledger";
import { introduceCast, markCastMet } from "@/lib/narrative/cast";
import { pickLowerClub } from "@/lib/narrative/role-events";
import type { Player } from "@/types/player";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { extractStatsFromEvent, applyStatUpdate, recalculateMedia } from "@/lib/player/update-stats";
import { detectNewMilestones, buildMilestoneEvent } from "@/lib/narrative/career-milestones";
import { logAppError } from "@/lib/errorLog";
import { computeStreakUpdate, STREAK_MILESTONES } from "@/lib/player/streak";
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
  const storedEvent = player.pending_event?.id === eventId ? player.pending_event : null;
  // Mismo personalizado que al mostrarlo (npcs.ts): el texto de resultado y el historial
  // guardan también los nombres y apellidos de los personajes.
  const event = storedEvent ? personalizeEvent(storedEvent, player) : null;
  const option = event?.options.find((o) => o.id === optionId);

  if (!event || !option) {
    redirect("/carrera");
  }

  const resolution = resolveOption(option, player);
  // Una opción con tirada de éxito/fracaso puede traer además cambios
  // estructurales propios (un club nuevo, flags de cesión): el resultado de la
  // tirada solo describe el DESENLACE, no puede borrar la decisión. Sin esta
  // fusión, "Aceptar la cesión" contaba la historia de la cesión pero el
  // jugador seguía en su club (visto en una partida de prueba real).
  const baseConsequences = resolution
    ? {
        ...resolution.consequences,
        ...(resolution.consequences.club === undefined && option.consequences.club !== undefined
          ? { club: option.consequences.club }
          : {}),
        ...(option.consequences.flags ? { flags: { ...option.consequences.flags, ...resolution.consequences.flags } } : {}),
      }
    : option.consequences;
  // Si la escena fija la postura del entrenador ("no cuenta contigo"), la
  // relación se lleva a ese valor y encima se suma lo que cambie la opción
  // — así el entorno ("Opinión del entrenador") nunca contradice la
  // escena. Queda en consequences para verse como cambio en la pantalla
  // de resultado, no como un ajuste invisible.
  // Y la postura también manda sobre el RÓL (role.ts): "no cuenta contigo"
  // aparta de verdad unos meses (coach_bench); "cuenta" lo levanta. Las
  // escenas escritas a mano que ya fijan coach_bench por su cuenta se respetan.
  const stanceBench =
    event.coachStance === "no_cuenta" ? "4" : event.coachStance === "cuenta" ? "0" : undefined;
  const consequencesRaw = event.coachStance
    ? {
        ...baseConsequences,
        rel_entrenador:
          COACH_STANCE_TARGET[event.coachStance] - player.rel_entrenador + (baseConsequences.rel_entrenador ?? 0),
        flags:
          stanceBench !== undefined && baseConsequences.flags?.coach_bench === undefined
            ? { ...baseConsequences.flags, coach_bench: stanceBench }
            : baseConsequences.flags,
      }
    : baseConsequences;
  // "@LOWER" en una escena escrita a mano = un club de nivel inferior al del
  // jugador, elegido ahora (la escena no sabe en qué club estás).
  const consequencesClub =
    consequencesRaw.club === "@LOWER" ? { ...consequencesRaw, club: pickLowerClub(player) } : consequencesRaw;
  // "@WEEK" en un flag = la semana actual (las inversiones escritas a mano
  // guardan desde cuándo existen, ver finance/investments.ts).
  const consequencesWeek = consequencesClub.flags
    ? {
        ...consequencesClub,
        flags: Object.fromEntries(
          Object.entries(consequencesClub.flags).map(([k, v]) => [
            k,
            typeof v === "string" ? v.replace('"@WEEK"', String(player.week)) : v,
          ]),
        ),
      }
    : consequencesClub;
  // "Despedirle y fichar a Julia Rovira": las escenas generadas por la IA no
  // traen el cambio de representante en sus consecuencias, así que se deduce
  // de la etiqueta. Sin esto, despedías al agente y la partida seguía con el
  // mismo (visto en una partida de prueba real). La relación con el nuevo
  // empieza en un punto neutro.
  const fireMatch = option.label.match(/despedir.*fichar\s+(?:a\s+)?(\p{Lu}[\p{L}'-]+(?:\s+\p{Lu}[\p{L}'-]+)+)/u);
  const newAgent = fireMatch && consequencesWeek.agent_name === undefined ? fireMatch[1] : null;
  const consequencesAgent = newAgent
    ? { ...consequencesWeek, agent_name: newAgent, rel_representante: 50 - (player.rel_representante ?? 50) }
    : consequencesWeek;
  // Firmar un patrocinio deja un contrato que paga cada turno durante una
  // temporada (ver finance/sponsorship-income.ts), además de la prima inicial.
  const isSponsorDeal = /^(sponsor-|arco-patrocinador)/.test(event.id) && (consequencesAgent.patrimonio ?? 0) > 0;
  const sponsorName = String(
    Object.entries(consequencesAgent.flags ?? {}).find(([k, v]) => k.startsWith("sponsor_") && typeof v === "string")?.[1] ??
      event.title,
  );
  const sponsorFlag = isSponsorDeal
    ? sponsorshipFlagFor(event.id, sponsorName, consequencesAgent.patrimonio ?? 0, player.week)
    : null;
  const consequences = sponsorFlag
    ? { ...consequencesAgent, flags: { ...consequencesAgent.flags, ...sponsorFlag } }
    : consequencesAgent;
  // outcomeText garantizado (sin tirada de éxito/fracaso) para que se vea
  // la reacción de la escena a decisiones sin incertidumbre — ver el
  // comentario junto a EventOption.outcomeText en types/career.ts.
  const outcomeText = resolution ? resolution.text : (option.outcomeText ?? defaultReaction(option, player));

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

  // Cuánto avanza el calendario (y qué partido del mes queda marcado como
  // jugado) lo decide week-advance.ts: misma regla para el motor y las pruebas.
  const { newWeek, matchDoneFlag, weekCounter } = computeWeekAdvance(player as Player, event);
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
  // La baja se cuenta en meses de calendario: solo baja cuando el calendario
  // avanza de verdad (antes descontaba en CADA evento resuelto, y una
  // lesión se evaporaba en un par de partidos).
  const injuryTick = newWeek > player.week ? tickInjury(player.flags) : null;
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

  if (matchDoneFlag || weekCounter) {
    playerUpdate.flags = {
      ...((playerUpdate.flags as Record<string, string | boolean> | undefined) ?? player.flags ?? {}),
      ...(matchDoneFlag ? { match_done_week: matchDoneFlag } : {}),
      wk_count: weekCounter,
    };
  }

  // Partidos que no se viven como escena: sus apariciones, goles y minutos se
  // estiman al avanzar el mes (ver off-screen-matches.ts) y suman a los
  // totales de carrera y a la tarjeta de temporada.
  if (newWeek > player.week && player.status === "active") {
    const off = simulateOffScreenMatches(player as Player, newWeek - player.week);
    if (off.matches > 0) {
      const flagsNow = (playerUpdate.flags as Record<string, string | boolean> | undefined) ?? player.flags ?? {};
      playerUpdate.flags = addSimSeasonStats(flagsNow, Math.floor((player.week - 1) / WEEKS_PER_SEASON), off);
      const base = statsPatch ?? {
        stats_matches_played: player.stats_matches_played ?? 0,
        stats_goals: player.stats_goals ?? 0,
        stats_assists: player.stats_assists ?? 0,
        stats_minutes_played: player.stats_minutes_played ?? 0,
      };
      statsPatch = {
        ...base,
        stats_matches_played: Number(base.stats_matches_played ?? 0) + off.matches,
        stats_goals: Number(base.stats_goals ?? 0) + off.goals,
        stats_assists: Number(base.stats_assists ?? 0) + off.assists,
        stats_minutes_played: Number(base.stats_minutes_played ?? 0) + off.minutes,
      };
    }
  }

  // El entrenador te mantiene fuera durante unos turnos tras una decisión
  // suya (coach_bench, ver role.ts): se descuenta según avanza el calendario.
  const benchLeft = parseInt(String(player.flags?.coach_bench ?? "0"), 10) || 0;
  if (benchLeft > 0 && newWeek > player.week) {
    const flagsBase = (playerUpdate.flags as Record<string, string | boolean> | undefined) ?? player.flags ?? {};
    const remaining = Math.max(0, benchLeft - (newWeek - player.week));
    // Si este mismo evento ya fijó coach_bench (p. ej. una charla con el míster), no se pisa.
    if (consequences.flags?.coach_bench === undefined) {
      playerUpdate.flags = { ...flagsBase, coach_bench: String(remaining) };
    }
  }

  // Los personajes que esta escena acaba de presentar (ver cast.ts) pasan a
  // ser conocidos: a partir de ahora ya se les puede nombrar sin ficha.
  const castCards = introduceCast(event, player as Player);
  if (castCards.length > 0) {
    const flagsBaseC = (playerUpdate.flags as Record<string, string | boolean> | undefined) ?? player.flags ?? {};
    playerUpdate.flags = { ...flagsBaseC, cast_met: markCastMet(flagsBaseC, castCards) };
  }

  // Libro de decisiones (ledger.ts): las decisiones con peso se anotan para
  // que, pasado un tiempo, una escena de eco las cobre.
  const ledgerEntry = buildLedgerEntry(event, option, consequences, outcomeText, freeText, player.week);
  if (ledgerEntry) {
    const flagsBaseL = (playerUpdate.flags as Record<string, string | boolean> | undefined) ?? player.flags ?? {};
    playerUpdate.flags = { ...flagsBaseL, decisiones: appendLedger(flagsBaseL, ledgerEntry) };
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
    // Cuenta de cambios de club (el fichaje inicial cuenta como 1). Varios
    // eventos solo tienen sentido si de verdad hubo un traspaso real
    // ("la prensa repite tu cifra de traspaso", "vuelves al club donde
    // debutaste") y no había forma de saberlo.
    const flagsSoFar = (playerUpdate.flags as Record<string, string | boolean> | undefined) ?? player.flags ?? {};
    // ARCO de carrera: un traspaso reinicia lo que dependía del club anterior. El
    // nuevo míster, vestuario y afición no te conocen (antes el 98 de relación con
    // el míster de tu antiguo club viajaba contigo), se apaga cualquier baja
    // decretada por el entrenador anterior y la competición europea se reevalúa.
    // La trayectoria (A → B → C) se guarda para que la historia la recuerde.
    const previousClubs = String(flagsSoFar.clubs_history ?? "").split("|").filter(Boolean);
    if (player.club && player.club !== NO_CLUB_YET && previousClubs[previousClubs.length - 1] !== player.club) {
      previousClubs.push(player.club);
    }
    playerUpdate.flags = {
      ...flagsSoFar,
      club_changes: String((parseInt(String(flagsSoFar.club_changes ?? "0"), 10) || 0) + 1),
      clubs_history: previousClubs.slice(-12).join("|"),
      club_since: String(newWeek),
      coach_bench: "0",
      bench_streak: "0",
      euro_progress: "",
      capitan_club: false,
    };
    if (player.club && player.club !== NO_CLUB_YET && player.club !== newClub) {
      playerUpdate.rel_entrenador = 50;
      playerUpdate.rel_vestuario = 45;
      playerUpdate.rel_aficion = 40;
    }
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
    // Pretemporada expandida (semanas 4-10, reemplaza los 3 eventos antiguos).
    // bienvenida siempre abre (es el primer día) y amistoso siempre cierra
    // (marca el fin de pretemporada), pero los 5 pasos del medio (físico,
    // competencia, táctica, capitán, pasado) son independientes entre sí
    // y se barajan por carrera — ver getShuffledPreseasonOrder, y el
    // comentario ahí de por qué: antes iban siempre en el mismo orden fijo
    // por código, así que toda carrera nueva se sentía "igual que las
    // anteriores" pese a que cada paso ya tenía su propio texto variado.
    if (event.id.startsWith("contrato-debut")) {
      const { buildPreseasonBienvenidaEvent, getShuffledPreseasonOrder } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      const flagsBase = (playerUpdate.flags as Record<string, string | boolean> | undefined) ?? player.flags ?? {};
      playerUpdate.flags = { ...flagsBase, preseason_order: getShuffledPreseasonOrder(player.id).join(",") };
      playerUpdate.pending_event = maybeAddFreeText(buildPreseasonBienvenidaEvent(player.club, player.id));
    } else if (event.id === "pretemp-bienvenida") {
      const { buildPreseasonMiddleStepByName, buildPreseasonFisicoEvent } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      const order = String(player.flags?.preseason_order ?? "").split(",").filter(Boolean);
      const built = order[0] ? buildPreseasonMiddleStepByName(order[0], player.id) : null;
      // Red de seguridad: si por lo que sea no hay orden guardado (una
      // carrera ya en curso desde antes de este cambio), cae al primer
      // paso de siempre en vez de romper la cadena.
      playerUpdate.pending_event = maybeAddFreeText(built ?? buildPreseasonFisicoEvent(player.id));
    } else if (["pretemp-fisico", "pretemp-competencia", "pretemp-tactica", "pretemp-capitan", "pretemp-pasado"].includes(event.id)) {
      const { buildPreseasonMiddleStepByName, buildPreseasonAmistoso, getPreseasonMiddleStepNameById } = await import(
        "@/lib/narrative/preseason-expanded"
      );
      const order = String(player.flags?.preseason_order ?? "").split(",").filter(Boolean);
      const currentName = getPreseasonMiddleStepNameById(event.id);
      const idx = currentName ? order.indexOf(currentName) : -1;
      const nextName = idx >= 0 ? order[idx + 1] : undefined;
      const built = nextName ? buildPreseasonMiddleStepByName(nextName, player.id) : null;
      playerUpdate.pending_event = maybeAddFreeText(built ?? buildPreseasonAmistoso(player.id));
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
      milestoneImagePrompt =
        contextualPrompt ??
        (event.imageScene
          ? withSceneGuards(event.imageScene, {
              club: newClub,
              age: currentAge,
              nationalTeam: /^(sel-|torneo|matchday-torneo)/.test(event.id),
            })
          : null);
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
    // usuario y global — ver src/lib/images/quota.ts) Y el crédito propio
    // de este jugador (5 fotos gratis por carrera, solo si está entre los
    // primeros 100 jugadores; luego packs de pago — ver
    // src/lib/images/credits.ts). Son dos frenos independientes: quota.ts
    // protege el gasto TOTAL del juego pase lo que pase; credits decide
    // cuándo a ESTE jugador en concreto le toca pagar.
    const isDmEvent = Boolean(event.dm);
    const wouldAttemptImage = !isDmEvent && !isRetirementDecision && Boolean(player.photo_url) && event.id !== "fork-retiro-pro";
    const willAttemptImage = wouldAttemptImage && (await hasImageCredit(supabase, player, user.email));
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
          image_status: willGenerate || isDmEvent ? "pending" : "none",
          // Se guarda aquí (no solo se usa al vuelo) para que
          // regenerateMilestoneImage pueda reconstruir el prompt real y
          // específico de la escena más adelante, en vez de caer a un
          // genérico basado solo en el título — ver migración
          // 20261001_add_milestones_image_scene.sql.
          image_scene: milestoneImagePrompt,
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
    // Captura de mensajes por Instagram: se dibuja en código (dmCard.ts),
    // sin Replicate ni cuota de imágenes.
    if (milestoneId && event.dm) {
      const dmMilestoneId = milestoneId;
      const dmUserId = user.id;
      const dmCard = { ...event.dm, reply: option.dmReply, followUp: option.dmFollowUp };
      after(async () => {
        try {
          const raw = await composeDmCard(dmCard);
          const branded = await addShareBranding(raw, getShareTagline("dm_instagram"));
          const url = await uploadGeneratedImage(supabase, dmUserId, branded, "milestone");
          await supabase
            .from("milestones")
            .update(url ? { image_url: url, image_status: "ready" } : { image_status: "failed" })
            .eq("id", dmMilestoneId);
        } catch (err) {
          console.error("[resolveEvent:after] DM card failed:", err);
          await supabase.from("milestones").update({ image_status: "failed" }).eq("id", dmMilestoneId);
        }
      });
    }

    if (milestoneId && willGenerate) {
      const finalMilestoneId = milestoneId;
      const finalPrompt = milestoneImagePrompt || event.imageScene || "jugador celebrando momento épico";
      const finalPhotoUrl = player.photo_url as string;
      const finalTemplateKey = templateKey;
      const finalUserId = user.id;
      const finalPlayerId = player.id;
      const finalPlayerFlags = player.flags ?? {};
      const finalUserEmail = user.email;
      const finalIsGolChilena = event.id === GOL_CHILENA_EVENT_ID;
      // Solo las escenas pensadas para cambiar el aspecto (barba, pelo, madurez) actualizan la foto de referencia.
      const finalEvolvesLook = Boolean(event.lookEvolution);
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
            await logAppError(supabase, "resolveEvent:milestone-image", "generatePlayerImage/generateFromTemplate returned null", {
              userId: finalUserId,
              playerId: finalPlayerId,
              detail: { milestoneId: finalMilestoneId, templateKey: finalTemplateKey },
            });
            await supabase.from("milestones").update({ image_status: "failed" }).eq("id", finalMilestoneId);
            return;
          }

          await logImageGeneration(supabase, finalUserId);
          await consumeImageCredit(supabase, { id: finalPlayerId, flags: finalPlayerFlags }, finalUserEmail);

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

          // OJO: current_photo_url es la foto de REFERENCIA del jugador (tarjeta de
          // cierre de temporada, base de las siguientes generaciones). Antes la
          // sobrescribía CUALQUIER hito: tras una lesión de rodilla la tarjeta de
          // fin de temporada salía con el jugador en muletas a la puerta de un
          // hospital. Ahora solo la cambian las escenas de evolución de aspecto
          // (lookEvolution) y el retrato de cada 4 temporadas.
          if (evolvedUrl && finalEvolvesLook) {
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
          await logAppError(supabase, "resolveEvent:milestone-image", err, {
            userId: finalUserId,
            playerId: finalPlayerId,
            detail: { milestoneId: finalMilestoneId },
          });
          await supabase.from("milestones").update({ image_status: "failed" }).eq("id", finalMilestoneId);
        }
      });
    }
  }

  // Cada 4 temporadas, empezando por la primera (temporada 1, 5, 9...):
  // pedido explícito del usuario — refresca la foto base del jugador con
  // una generación de IA que refleje el club actual (colores/
  // equipación real) y cómo ha cambiado su aspecto con la edad, para que
  // la tarjeta de cierre de temporada no reutilice siempre la misma foto
  // antigua durante años. Deliberadamente fuera del sistema de hitos (no
  // entra en milestoneAchieved): no genera tarjeta propia ni aparece en
  // Legado, solo actualiza current_photo_url en segundo plano.
  const preseasonSeasonMatch = /^preseason-(\d+)$/.exec(event.id);
  const preseasonSeason = preseasonSeasonMatch ? parseInt(preseasonSeasonMatch[1], 10) : null;
  const isSeasonPhotoRefresh = preseasonSeason !== null && (preseasonSeason - 1) % 4 === 0;

  if (isSeasonPhotoRefresh && player.photo_url && (await hasImageCredit(supabase, player, user.email))) {
    const refreshQuota = await checkImageGenerationQuota(supabase, user.id);
    if (refreshQuota.allowed) {
      const refreshPhotoUrl = player.photo_url as string;
      const refreshUserId = user.id;
      const refreshUserEmail = user.email;
      const refreshPlayerId = player.id;
      const refreshPlayerFlags = player.flags ?? {};
      const refreshAge = playerAge(newWeek);
      const refreshClub = typeof consequences.club === "string" ? consequences.club : player.club;
      const refreshPrompt = `Photorealistic professional portrait of a footballer wearing the ${describeKit(refreshClub)} kit, ${describeLook(refreshAge, player.last_name ?? "")}, confident calm expression, clean training ground or stadium backdrop, natural light, high-end sports photography style`;

      after(async () => {
        try {
          const buffer = await generatePlayerImage(refreshPhotoUrl, refreshPrompt);
          if (!buffer) {
            console.error("[resolveEvent:after] season photo refresh: generation failed");
            await logAppError(supabase, "resolveEvent:season-photo-refresh", "generatePlayerImage returned null", {
              userId: refreshUserId,
              playerId: refreshPlayerId,
              detail: { preseasonSeason },
            });
            return;
          }
          await logImageGeneration(supabase, refreshUserId);
          await consumeImageCredit(supabase, { id: refreshPlayerId, flags: refreshPlayerFlags }, refreshUserEmail);
          const newUrl = await uploadGeneratedImage(supabase, refreshUserId, buffer, "look");
          if (newUrl) {
            await supabase.from("players").update({ current_photo_url: newUrl }).eq("id", refreshPlayerId);
          }
        } catch (err) {
          console.error("[resolveEvent:after] season photo refresh threw:", err);
          await logAppError(supabase, "resolveEvent:season-photo-refresh", err, {
            userId: refreshUserId,
            playerId: refreshPlayerId,
          });
        }
      });
    }
  }

  // Racha de días jugados (ver streak.ts) — cada decisión real cuenta
  // como "hoy has jugado", no cada visita a una página.
  const streakUpdate = computeStreakUpdate(player);

  // Premio de umbral (3/7/14/30 días): bonus pequeño aplicado UNA vez y un
  // aviso narrativo guardado con la semana en la que debe mostrarse — al
  // avanzar la semana desaparece solo, sin tener que borrarlo después. La
  // frase rota por umbral (índice guardado en flags) para no repetirse si
  // el jugador rompe la racha y la vuelve a alcanzar.
  if (streakUpdate.milestone !== null) {
    const reward = STREAK_MILESTONES[streakUpdate.milestone];
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    const current = (key: "forma" | "moral" | "fama") => (playerUpdate[key] as number | undefined) ?? player[key];
    if (reward.bonus.forma) playerUpdate.forma = clamp(current("forma") + reward.bonus.forma);
    if (reward.bonus.moral) playerUpdate.moral = clamp(current("moral") + reward.bonus.moral);
    if (reward.bonus.fama) playerUpdate.fama = clamp(current("fama") + reward.bonus.fama);

    const flagsBase = (playerUpdate.flags as Record<string, string | boolean> | undefined) ?? player.flags ?? {};
    const variantKey = `streak_variant_${streakUpdate.milestone}`;
    const prev = parseInt(String(flagsBase[variantKey] ?? "-1"), 10);
    const nextVariant = (Number.isNaN(prev) ? 0 : prev + 1) % reward.messages.length;
    playerUpdate.flags = {
      ...flagsBase,
      [variantKey]: String(nextVariant),
      streak_toast: reward.messages[nextVariant],
      streak_toast_week: String(newWeek),
    };
  }

  const { error: playerUpdateError } = await supabase
    .from("players")
    .update({
      pending_event: null,
      ...playerUpdate,
      week: newWeek,
      status: isSecondCareerChoice ? "second_life" : isRetirementDecision ? "awaiting_second_life" : willRetire ? "retired" : "active",
      last_active_at: streakUpdate.last_active_at,
      streak_days: streakUpdate.streak_days,
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
