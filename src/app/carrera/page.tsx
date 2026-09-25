import { redirect } from "next/navigation";

// Necesario para que la generación de imagen en segundo plano (after() en
// resolveEvent, en actions.ts) tenga tiempo de terminar: Flux Kontext Pro
// puede tardar hasta ~3 minutos en un arranque en frío (medido en pruebas
// reales). Si el plan de Vercel tiene un tope menor, Vercel lo recorta
// solo — no falla el build por pedir más de lo permitido.
export const maxDuration = 300;
import { getCurrentUserAndPlayer } from "@/lib/player";
import { pickNextEventDynamic, whatIsAtStake } from "@/lib/narrative/engine";
import {
  buildEleccionRepresentanteEvent,
  buildInicioFichajeEvent,
  buildCasaEvent,
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
import { CONSEQUENCE_LABELS, MODE_TARGET_WEEKS, playerAge, seasonLabel } from "@/types/career";
import { displayName } from "@/types/player";
import { BottomNav } from "@/components/BottomNav";
import { PlayerHeaderCard } from "@/components/PlayerHeaderCard";
import { EventScene } from "@/components/EventScene";
import { MatchScene } from "@/components/MatchScene";
import { getPressQuote, getCoachOpinion } from "@/lib/narrative/pressQuotes";
import { resolveEvent } from "./actions";
import { personalizeEvent } from "@/lib/narrative/npcs";

function MiniStat({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-kicker truncate">{label}</span>
        <span className="font-num text-sm font-semibold text-foreground/90">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="pitch-fill h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  entrenamiento: "Entrenamiento",
  partido: "Partido",
  vestuario: "Vestuario",
  representante: "Representante",
  prensa: "Prensa",
  vida: "Vida personal",
  especial: "Evento especial",
  segunda_vida: "Segunda vida",
};

export default async function CarreraPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  if (!player) {
    redirect("/crear-jugador");
  }

  if (player.status === "retired") {
    redirect("/carrera/retiro");
  }

  if (player.status === "awaiting_second_life") {
    redirect("/carrera/segunda-vida/elegir");
  }

  if (player.status === "second_life") {
    redirect("/carrera/segunda-vida");
  }

  const targetWeeks = MODE_TARGET_WEEKS[player.mode];
  if (player.mode !== "pro" && player.week > targetWeeks) {
    redirect("/carrera/retiro");
  }

  let event = player.pending_event;

  if (!event && !player.agent_name) {
    // Usar las 15 variantes narrativas de primera firma (sin generar con IA)
    event = buildEleccionRepresentanteEvent();
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  if (!event && player.club === NO_CLUB_YET) {
    const agentName = player.agent_name ?? "Tu representante";
    // Se sortean los clubes UNA vez y se reparten al mismo sitio: así la
    // IA escribe el texto (varía cada partida) pero el desglose de
    // nivel/desarrollo/competencia/minutos/riesgo sale siempre, no solo
    // cuando la IA falla y se cae al evento de reserva.
    const offers = pickStartingClubOffers();
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

  if (!event) {
    // El contexto que le mandamos a la IA sí se limita a lo reciente, para
    // no inflar el prompt.
    const { data: recentHistory } = await supabase
      .from("career_events")
      .select("title, chosen_option_label, free_text_response, category")
      .eq("player_id", player.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const historyForAi = (recentHistory ?? []).map((h) => ({
      title: h.title as string,
      chosen: (h.chosen_option_label as string | null) ?? "",
      freeText: h.free_text_response as string | null,
      category: h.category as string | null,
    }));

    event = await pickNextEventDynamic(player, historyForAi, usedEventIds);
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
    const { data: updatedRows } = await supabase
      .from("players")
      .update({
        pending_event: event,
        flags: player.flags,
        forma: player.forma,
        media: player.media,
        moral: player.moral,
        rel_entrenador: player.rel_entrenador,
        rel_aficion: player.rel_aficion,
      })
      .eq("id", player.id)
      .is("pending_event", null)
      .select("pending_event");

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

  // Personajes con nombre y apellidos (el míster, el capitán, tu madre...): ver npcs.ts.
  if (event) event = personalizeEvent(event, player);

  const clubTitleCount = [player.flags?.title_liga, player.flags?.title_champions].filter(Boolean).length;

  return (
    <main className="flex flex-1 justify-center p-4 pb-24">
      <div className="w-full max-w-lg space-y-4 pb-8">
        <div className="rounded-2xl border border-panel-border bg-surface p-4">
          <PlayerHeaderCard
            photoUrl={player.current_photo_url ?? player.photo_url}
            name={displayName(player)}
            age={playerAge(player.week)}
            club={player.club}
            categoryLabel={seasonLabel(player.week)}
            statusLine="Titular"
            media={player.media}
            forma={player.forma}
            relEntrenador={player.club !== NO_CLUB_YET ? player.rel_entrenador : null}
            relAficion={player.club !== NO_CLUB_YET ? player.rel_aficion : null}
            relVestuario={player.club !== NO_CLUB_YET ? player.rel_vestuario : null}
            relRepresentante={player.agent_name ? player.rel_representante : null}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-panel-border bg-surface p-4">
          <MiniStat label="Moral" value={player.moral} />
          <MiniStat label="Fama" value={player.fama} />
        </div>

        <div className="space-y-3 overflow-hidden rounded-2xl border border-panel-border bg-surface">
          {event.category === "partido" && event.rivalClub ? (
            <MatchScene club={player.club} rivalClub={event.rivalClub} titles={clubTitleCount} />
          ) : (
            <EventScene club={player.club} category={event.category} titles={clubTitleCount} />
          )}
          <div className="space-y-3 px-4 pb-4">
            <p className="text-kicker">{CATEGORY_LABELS[event.category]}</p>
            <h2 className="font-display text-xl text-foreground leading-tight">{event.title}</h2>
            <p className="text-sm text-muted-foreground">{event.description}</p>

            {whatIsAtStake(event).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-xs text-muted-foreground">En juego:</span>
                {whatIsAtStake(event).map((key) => (
                  <span
                    key={key}
                    className="font-cond rounded-full border border-input px-2.5 py-0.5 text-xs text-foreground/80"
                  >
                    {CONSEQUENCE_LABELS[key] ?? key}
                  </span>
                ))}
              </div>
            )}

            <form action={resolveEvent} className="space-y-2 pt-1">
              <input type="hidden" name="event_id" value={event.id} />

              <div className="space-y-2">
                {event.options.map((option, i) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-input bg-surface-2 px-4 py-3 has-[:checked]:border-gold has-[:checked]:bg-gold/10"
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="option_id"
                        value={option.id}
                        required
                        defaultChecked={i === 0}
                        className="mt-1 shrink-0"
                      />
                      {option.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={option.imageUrl}
                          alt={option.label}
                          className="h-16 w-24 shrink-0 rounded object-cover"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm text-foreground">{option.label}</span>
                          {option.level !== undefined && (
                            <span className="font-cond shrink-0 rounded-full border border-gold/50 px-2 py-0.5 text-[11px] font-semibold text-gold">
                              Nivel {option.level}/5
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs italic text-muted-foreground">{option.subtitle}</span>
                      </span>
                    </span>

                    {option.details && (
                      <div className="grid grid-cols-1 gap-1.5 border-t border-panel-border/60 pt-2 sm:grid-cols-2">
                        {option.details.map((d) => (
                          <div key={d.label} className="flex items-start gap-1.5 text-xs">
                            <span>{d.icon}</span>
                            <span>
                              <span className="text-kicker mr-1 text-[10px]">{d.label}</span>
                              <span className="text-muted-foreground">{d.text}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </label>
                ))}
              </div>

              {event.allowFreeText && (
                <div className="space-y-2">
                  <label className="text-kicker">
                    {event.freeTextPrompt ?? "Respuesta libre (opcional)"}
                  </label>
                  <textarea
                    name="free_text"
                    rows={2}
                    className="w-full rounded-2xl border border-input bg-surface-2 px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                className="gold-fill w-full rounded-full px-4 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
              >
                Confirmar decisión
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-panel-border bg-surface p-4">
          <div>
            <p className="text-kicker">Prensa</p>
            <p className="mt-1 font-cond text-sm italic text-foreground/90">{getPressQuote(player)}</p>
          </div>
          {player.club !== NO_CLUB_YET && (
            <div>
              <p className="text-kicker">Opinión del entrenador</p>
              <p className="mt-1 text-sm text-muted-foreground">{getCoachOpinion(player)}</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav active="carrera" />
    </main>
  );
}
