/**
 * Prepara la escena del turno: elige o genera el siguiente evento y lo deja
 * guardado en players.pending_event. Antes vivía dentro de carrera/page.tsx y
 * solo se ejecutaba al cargar /carrera, así que cada decisión terminaba con
 * una pantalla en blanco de 7-12 s mientras la IA escribía la escena. Ahora
 * también se lanza en segundo plano justo al resolver una decisión
 * (prefetch en actions.ts): la escena ya está lista cuando terminas de leer
 * la reacción — misma llamada, solo que antes, sin coste extra.
 *
 * Para que cargar /carrera a la vez no pague dos llamadas, el turno se
 * "reserva" escribiendo un marcador en pending_event (GEN_LOCK_ID) mientras
 * la IA trabaja; la otra petición espera a que aparezca la escena real.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { playerAnnualGross } from "@/lib/narrative/transfer-terms";
import type { Player } from "@/types/player";
import type { GameEvent } from "@/types/career";
import { pickNextEventDynamic } from "@/lib/narrative/engine";
import {
  buildEleccionRepresentanteEvent,
  buildInicioFichajeEvent,
  buildCasaEvent,
  buildCityHousingEvent,
  buildCityCarEvent,
  cityMoveIds,
  buildMansionEvent,
  buildYachtEvent,
  buildJetEvent,
  buildCarEvent,
  buildOfertaArabiaEvent,
  attachClubOfferDetails,
  isInlandClub,
  getMinHomeDownPayment,
  getMinMansionDownPayment,
} from "@/lib/narrative/events";
import { generateClubOffersEvent } from "@/lib/narrative/ai";
import { NO_CLUB_YET, pickStartingClubOffers } from "@/lib/constants";
import { shouldTriggerBusquedaEquipo, buildBusquedaEquipoEvent, hadViralMoment } from "@/lib/narrative/agente-busqueda";
import { summarizeEffects } from "@/lib/narrative/state-brief";
import { repairCashPurchases } from "@/lib/finance/repair";
import { runWithAiBudget, careerBudgetTotal, currentAiUsed } from "@/lib/narrative/ai-budget";
import { MODE_TARGET_WEEKS } from "@/types/career";

export const GEN_LOCK_ID = "gen-lock";
const LOCK_TTL_MS = 90_000;

export function isGenLock(event: GameEvent | null | undefined): boolean {
  return Boolean(event && event.id === GEN_LOCK_ID);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Reserva el turno: solo gana quien encuentra pending_event vacío. */
async function claimGenLock(supabase: SupabaseClient, playerId: string): Promise<boolean> {
  const lock = { id: GEN_LOCK_ID, category: "vida", title: "", description: "", options: [], ts: Date.now() };
  const { data } = await supabase
    .from("players")
    .update({ pending_event: lock })
    .eq("id", playerId)
    .is("pending_event", null)
    .select("id");
  return Boolean(data && data.length > 0);
}

async function releaseGenLock(supabase: SupabaseClient, playerId: string): Promise<void> {
  await supabase.from("players").update({ pending_event: null }).eq("id", playerId).eq("pending_event->>id", GEN_LOCK_ID);
}

/** Espera a que la otra petición deje la escena real (o a que su reserva caduque). */
async function waitForPendingEvent(supabase: SupabaseClient, playerId: string): Promise<GameEvent | null> {
  const start = Date.now();
  while (Date.now() - start < 80_000) {
    const { data } = await supabase.from("players").select("pending_event").eq("id", playerId).maybeSingle();
    const ev = (data?.pending_event ?? null) as (GameEvent & { ts?: number }) | null;
    if (!ev) return null;
    if (ev.id !== GEN_LOCK_ID) return ev;
    if (Date.now() - (ev.ts ?? 0) > LOCK_TTL_MS) {
      await releaseGenLock(supabase, playerId);
      return null;
    }
    await sleep(1500);
  }
  return null;
}

/**
 * Prepara la escena del turno con el presupuesto de IA de la carrera (ver
 * ai-budget.ts): las llamadas que gaste quedan anotadas en flags.ai_used.
 */
export async function ensureNextEvent(
  supabase: SupabaseClient,
  player: Player,
): Promise<{ event: GameEvent; usedEventIds: string[] }> {
  const { result } = await runWithAiBudget(
    {
      used: parseInt(String(player.flags?.ai_used ?? "0"), 10) || 0,
      total: careerBudgetTotal(player.mode),
      week: player.week,
      targetWeeks: MODE_TARGET_WEEKS[player.mode] ?? 200,
    },
    () => ensureNextEventInner(supabase, player),
  );
  return result;
}

/**
 * Contratos pactados antes de que el sueldo fuera una cifra fija: se guardaba un múltiplo que seguía a tu media, y el
 * sueldo se disparaba cada vez que subías un punto. Se recupera la cifra real que firmaste (o renovaste) leyendo el
 * texto de esa escena en el historial, y se deja fija.
 */
async function migrateSalaryDeal(supabase: SupabaseClient, player: Player): Promise<void> {
  const f = player.flags ?? {};
  // fix_v 2 = la cifra ya es la firmada de verdad (la fijan los propios contratos nuevos o esta recuperación).
  if (f.salary_fix_v === "2") return;
  if (!f.salary_mult || String(f.salary_club ?? "") !== player.club) return;
  const since = parseInt(String(f.club_since ?? "0"), 10) || 0;
  let fixed = 0;
  try {
    const { data } = await supabase
      .from("career_events")
      .select("outcome_text, week, created_at")
      .eq("player_id", player.id)
      .ilike("outcome_text", "%€%al año%")
      .gte("week", Math.max(0, since - 1))
      .order("week", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8);
    for (const row of data ?? []) {
      // Solo lo que se firmó o renovó de verdad (el texto del resultado), no las ofertas que rechazaste.
      const m = String(row.outcome_text ?? "").match(/(\d[\d.]{4,}) € (?:brutos )?al año/);
      if (m) fixed = parseInt(m[1].replace(/\./g, ""), 10) || 0;
      if (fixed > 0) break;
    }
  } catch {
    // sin historial legible: se fija la cifra actual
  }
  if (!(fixed > 0)) fixed = playerAnnualGross({ ...player, flags: { ...f, salary_fixed: "0" } });
  player.flags = { ...f, salary_fixed: String(fixed), salary_fix_v: "2" };
  await supabase.from("players").update({ flags: player.flags }).eq("id", player.id);
}

async function ensureNextEventInner(
  supabase: SupabaseClient,
  player: Player,
): Promise<{ event: GameEvent; usedEventIds: string[] }> {
  await migrateSalaryDeal(supabase, player);
  // Una oferta de fichaje guardada con las cifras antiguas (sueldo que seguía a la media) se descarta y se genera de nuevo.
  const stale = player.pending_event as (GameEvent & { termsV?: number }) | null;
  if (stale && !stale.termsV && /^(oferta-(?!humo|cesion|engano)|arco-salto-3-)/.test(String(stale.id))) {
    await supabase.from("players").update({ pending_event: null }).eq("id", player.id);
    player.pending_event = null;
  }
  // Corrige compras antiguas de coche/yate/jet que no se pagaron enteras (finance/repair.ts).
  await repairCashPurchases(supabase, player);
  let event: GameEvent | null = player.pending_event;
  // Si otra petición está generando la escena de este turno, se espera a que acabe.
  if (isGenLock(event)) event = await waitForPendingEvent(supabase, player.id);

  if (!event && !player.agent_name) {
    // Usar las 15 variantes narrativas de primera firma (sin generar con IA)
    event = buildEleccionRepresentanteEvent();
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  // Antes de las ofertas de verdad, una búsqueda con tensión real: entre
  // 0 y 3 turnos de espera (sorteado por carrera) con noticias de tu
  // agente — nada, un grande que te ha visto, la opción de grabarte y
  // subir vídeos a redes... en vez de que las ofertas llegasen siempre
  // en el turno siguiente a elegir representante, sin ninguna
  // incertidumbre. Ver agente-busqueda.ts.
  if (!event && player.club === NO_CLUB_YET && shouldTriggerBusquedaEquipo(player)) {
    event = buildBusquedaEquipoEvent(player);
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  if (!event && player.club === NO_CLUB_YET) {
    const agentName = player.agent_name ?? "Tu representante";
    // Se sortean los clubes UNA vez y se reparten al mismo sitio: así la
    // IA escribe el texto (varía cada partida) pero el desglose de
    // nivel/desarrollo/competencia/minutos/riesgo sale siempre, no solo
    // cuando la IA falla y se cae al evento de reserva.
    const offers = pickStartingClubOffers(player.agent_name, hadViralMoment(player));
    const aiEvent = await generateClubOffersEvent(agentName, offers);
    event = aiEvent ? attachClubOfferDetails(aiEvent, offers) : buildInicioFichajeEvent(agentName, offers);
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  // Para no repetir nunca un evento fijo, se compara contra TODA la
  // carrera, no solo los últimos turnos.
  const { data: allHistory } = await supabase
    .from("career_events")
    .select("event_id")
    .eq("player_id", player.id);
  const usedEventIds = (allHistory ?? []).map((h) => h.event_id as string);

  // Comprar casa necesita 3 opciones con precios sorteados en el momento,
  // así que no puede vivir como una entrada estática más del pool normal.
  // Exige un mínimo de patrimonio ahorrado: sin esto, el evento aparecía
  // en la semana 8 sin importar cuánto llevara ganado el jugador, ofreciendo
  // entradas de 20-38k€ a alguien recién debutado con 1-2k€ ahorrados —
  // el patrimonio se quedaba clavado en 0 (tiene suelo) mientras el
  // listado de movimientos seguía mostrando el gasto completo, dos
  // números que no cuadraban entre sí. Encontrado jugando una carrera real.
  // El umbral se fijó a mano (15.000€) y el catálogo de HOME_LISTINGS
  // creció después sin volver a comprobrarlo: la vivienda más barata ya
  // pedía 18.000€ de entrada, por encima del propio umbral — un jugador
  // con 15-17k€ podía ver tres casas sin poder pagar la entrada de
  // ninguna. Se deriva ahora del catálogo real en vez de un número suelto.
  // Mudanza a la ciudad de un club nuevo (no el primero, ni una cesión): primero dónde vivir, un par de turnos
  // después el coche. Una escena de cada por cada club al que llegas.
  {
    const clubChanges = parseInt(String(player.flags?.club_changes ?? "0"), 10) || 0;
    const since = parseInt(String(player.flags?.club_since ?? "0"), 10) || 0;
    const here = player.week - since;
    const onLoan = Boolean(player.flags?.loan_active) && !player.flags?.loan_returned;
    const ids = cityMoveIds(player.club);
    if (!event && clubChanges >= 2 && !onLoan && since > 0 && here >= 1 && here <= 14 && player.status === "active") {
      if (!usedEventIds.includes(ids.casa)) {
        event = await buildCityHousingEvent(player, supabase);
        await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
      } else if (!usedEventIds.includes(ids.coche) && here >= 3) {
        event = await buildCityCarEvent(player, supabase);
        await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
      }
    }
  }

  const MIN_PATRIMONIO_FOR_HOME = getMinHomeDownPayment();
  if (
    !event &&
    player.week >= 8 &&
    player.patrimonio >= MIN_PATRIMONIO_FOR_HOME &&
    !usedEventIds.includes("vid-casa")
  ) {
    event = await buildCasaEvent(player, supabase);
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  // El coche deportivo es el primer capricho de verdad, antes que
  // cualquier otro — solo hace falta el primer sueldo serio, no fama ni
  // una carrera consolidada. No es garantizado (probabilístico), para que
  // no le toque a todo el mundo en el mismo momento de la carrera.
  const MIN_PATRIMONIO_FOR_CAR = 30000;
  if (
    !event &&
    player.week >= 12 &&
    player.patrimonio >= MIN_PATRIMONIO_FOR_CAR &&
    !usedEventIds.includes("vid-coche-deportivo") &&
    Math.random() < 0.3
  ) {
    event = await buildCarEvent(player, supabase);
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  // Mismo razonamiento que la primera vivienda, derivado igual del
  // catálogo real: sin esto, se podían ofrecer mansiones de 1,2-3,4M€ a
  // alguien que no las puede pagar ni de lejos.
  const MIN_PATRIMONIO_FOR_MANSION = getMinMansionDownPayment();
  if (
    !event &&
    player.week >= 65 &&
    player.patrimonio >= MIN_PATRIMONIO_FOR_MANSION &&
    !usedEventIds.includes("vid-mansion-lujo")
  ) {
    event = await buildMansionEvent(player, supabase);
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  // Caprichos de "crack": yate y jet privado. Solo tienen sentido con
  // fama y media de estrella de verdad, no solo porque haya pasado el
  // tiempo — y con dinero de sobra para el capricho. El yate además exige
  // un club no-de-interior: no tiene coherencia geográfica ofrecerle un
  // yate a alguien que juega en el Real Madrid o el Atlético.
  if (
    !event &&
    player.week >= 30 &&
    player.fama >= 55 &&
    player.media >= 75 &&
    player.patrimonio >= 100000 &&
    !isInlandClub(player.club) &&
    !usedEventIds.includes("vid-yate") &&
    Math.random() < 0.2
  ) {
    event = await buildYachtEvent(player, supabase);
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  if (
    !event &&
    player.week >= 80 &&
    player.fama >= 75 &&
    player.media >= 85 &&
    player.patrimonio >= 3000000 &&
    !usedEventIds.includes("vid-jet-privado") &&
    Math.random() < 0.15
  ) {
    event = await buildJetEvent(player, supabase);
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  // Igual que la casa: si hay pareja, el texto y las opciones cambian
  // según su nombre, así que necesita construirse en el momento.
  // Oferta Arabia: NO garantizada, solo probabilística (~35% de chance)
  // No todos los jugadores reciben oferta de Arabia — depende de la atracción del mercado
  if (
    !event &&
    player.week >= 155 &&
    player.media >= 60 &&
    !usedEventIds.includes("fork-oferta-arabia") &&
    Math.random() < 0.35  // 35% de probabilidad, no garantizado
  ) {
    event = buildOfertaArabiaEvent(player);
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  // Reserva el turno ANTES de llamar a la IA: la escena siguiente se prepara
  // en segundo plano mientras lees la reacción a tu decisión (ver prefetch en
  // actions.ts), y si además cargas /carrera a la vez, la segunda petición
  // espera a la primera en vez de pagar otra llamada a la API.
  let holdsLock = false;
  if (!event) {
    holdsLock = await claimGenLock(supabase, player.id);
    if (!holdsLock) event = await waitForPendingEvent(supabase, player.id);
  }

  if (!event) {
    // El contexto que le mandamos a la IA sí se limita a lo reciente, para
    // no inflar el prompt.
    const { data: recentHistory } = await supabase
      .from("career_events")
      .select("title, chosen_option_label, free_text_response, category, consequences, outcome_text")
      .eq("player_id", player.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const historyForAi = (recentHistory ?? []).map((h) => ({
      title: h.title as string,
      chosen: (h.chosen_option_label as string | null) ?? "",
      freeText: h.free_text_response as string | null,
      category: h.category as string | null,
      effects: summarizeEffects(h.consequences as Record<string, unknown> | null),
      outcome: (h.outcome_text as string | null) ?? null,
    }));

    try {
      event = await pickNextEventDynamic(player, historyForAi, usedEventIds);
      if (!player.flags) player.flags = {};
      const spent = currentAiUsed();
      if (spent !== null) player.flags.ai_used = String(spent);
    } catch (err) {
      if (holdsLock) await releaseGenLock(supabase, player.id);
      throw err;
    }
    // pickNextEventDynamic muta el propio `player` en memoria: no solo
    // flags (cooldown de adversidades, gol de chilena), sino también
    // forma/media/moral/relaciones vía applyCareerDynamics (degradación
    // natural de forma, declive por edad, deterioro de relaciones,
    // presión mediática). Antes solo se guardaban flags aquí, así que esa
    // dinámica se calculaba en cada turno y se tiraba a la basura sin
    // persistirse jamás — un jugador inactivo nunca perdía forma de
    // verdad. Ver applyCareerDynamics en engine.ts.
    //
    // El `.is("pending_event", null)` es crítico: si dos peticiones para
    // el mismo jugador llegan casi a la vez (una recarga de página de
    // más, un doble clic, un prefetch), ambas ven pending_event=null y
    // generan un evento DISTINTO cada una. Sin esta condición, la
    // segunda escritura pisaba a la primera sin más — y si el jugador ya
    // había recibido en pantalla el evento de la primera generación, su
    // "id" ya no coincidía con lo guardado en la base de datos. Al
    // confirmar su decisión, resolveEvent comprueba ese id exacto y, si
    // no coincide, la descarta en silencio sin aplicar nada y sin
    // avisar — la semana nunca avanzaba y el mismo partido podía volver
    // a aparecer turno tras turno. Visto en vivo jugando (Copa del Rey
    // repitiéndose contra el mismo rival sin motivo).
    const baseUpdate = supabase
      .from("players")
      .update({
        pending_event: event,
        flags: player.flags,
        forma: player.forma,
        media: player.media,
        moral: player.moral,
        // El sueldo y las cuotas de hipoteca también se aplican en
        // applyCareerDynamics: sin guardar el patrimonio aquí se calculaban
        // cada turno y se tiraban (visto en vivo: 8.190 €/mes de sueldo y
        // el dinero siempre en 0 €).
        patrimonio: player.patrimonio,
        rel_entrenador: player.rel_entrenador,
        rel_vestuario: player.rel_vestuario,
        rel_aficion: player.rel_aficion,
      })
      .eq("id", player.id);
    const { data: updatedRows } = await (
      holdsLock ? baseUpdate.eq("pending_event->>id", GEN_LOCK_ID) : baseUpdate.is("pending_event", null)
    ).select("pending_event");

    // Si no se actualizó ninguna fila, otra petición concurrente ganó la
    // carrera y ya escribió su propio evento — hay que usar ESE, no el
    // que acabamos de generar aquí, para que lo que se renderiza
    // coincida siempre con lo que hay realmente guardado.
    if (!updatedRows || updatedRows.length === 0) {
      const { data: currentPlayer } = await supabase
        .from("players")
        .select("pending_event")
        .eq("id", player.id)
        .maybeSingle();
      event = (currentPlayer?.pending_event as typeof event) ?? event;
    }
  }


  // Tras el bloque anterior siempre hay escena: o la preparó otra petición, o la generó esta.
  return { event: event as GameEvent, usedEventIds };
}
