import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { pickNextEventDynamic, whatIsAtStake } from "@/lib/narrative/engine";
import {
  buildEleccionRepresentanteEvent,
  buildInicioFichajeEvent,
  buildCasaEvent,
  buildMansionEvent,
  buildOfertaArabiaEvent,
} from "@/lib/narrative/events";
import { generateEleccionRepresentanteEvent, generateClubOffersEvent } from "@/lib/narrative/ai";
import { NO_CLUB_YET } from "@/lib/constants";
import { CONSEQUENCE_LABELS, MODE_TARGET_WEEKS, playerAge, seasonLabel } from "@/types/career";
import { StatBar } from "@/components/StatBar";
import { LifeThreads } from "@/components/LifeThreads";
import { BottomNav } from "@/components/BottomNav";
import { MediaBadge } from "@/components/MediaBadge";
import { EventScene } from "@/components/EventScene";
import { MatchScene } from "@/components/MatchScene";
import { EventDecisionForm } from "@/components/EventDecisionForm";

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
    event = (await generateEleccionRepresentanteEvent()) ?? buildEleccionRepresentanteEvent();
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  if (!event && player.club === NO_CLUB_YET) {
    const agentName = player.agent_name ?? "Tu representante";
    event = (await generateClubOffersEvent(agentName)) ?? buildInicioFichajeEvent(agentName);
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
  if (!event && player.week >= 8 && !usedEventIds.includes("vid-casa")) {
    event = buildCasaEvent(player);
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  if (!event && player.week >= 65 && !usedEventIds.includes("vid-mansion-lujo")) {
    event = buildMansionEvent(player);
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
      .select("title, chosen_option_label, free_text_response")
      .eq("player_id", player.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const historyForAi = (recentHistory ?? []).map((h) => ({
      title: h.title as string,
      chosen: (h.chosen_option_label as string | null) ?? "",
      freeText: h.free_text_response as string | null,
    }));

    event = await pickNextEventDynamic(player, historyForAi);
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  const clubTitleCount = [player.flags?.title_liga, player.flags?.title_champions].filter(Boolean).length;

  return (
    <main className="flex flex-1 justify-center p-4 pb-24">
      <div className="w-full max-w-lg space-y-4 pb-8">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-gold">
              Temporada {seasonLabel(player.week)} · {playerAge(player.week)} años · {player.club}
            </p>
            <h1 className="text-lg font-bold text-neutral-100">{player.last_name}</h1>
          </div>
          <MediaBadge value={player.media} />
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-panel-border bg-panel p-3 text-xs">
          <StatBar label="Forma" value={player.forma} />
          <StatBar label="Moral" value={player.moral} />
          <StatBar label="Fama" value={player.fama} />
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg border border-panel-border bg-panel p-3 text-xs">
          <StatBar label="Entrenador" value={player.rel_entrenador} />
          <StatBar label="Afición" value={player.rel_aficion} />
          <StatBar label="Vestuario" value={player.rel_vestuario} />
          <StatBar label="Representante" value={player.rel_representante} />
        </div>

        <div className="space-y-2 rounded-xl border border-panel-border bg-panel p-4 shadow-sm">
          {event.category === "partido" && event.rivalClub ? (
            <MatchScene club={player.club} rivalClub={event.rivalClub} titles={clubTitleCount} />
          ) : (
            <EventScene club={player.club} category={event.category} titles={clubTitleCount} />
          )}
          <p className="text-xs font-medium uppercase tracking-wide text-gold">
            {CATEGORY_LABELS[event.category]}
          </p>
          <h2 className="text-base font-bold text-neutral-100">{event.title}</h2>
          <p className="text-xs text-neutral-400">{event.description}</p>

          {whatIsAtStake(event).length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              <span className="text-xs text-neutral-500">En juego:</span>
              {whatIsAtStake(event).map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-panel-border px-2 py-0.5 text-xs text-neutral-300"
                >
                  {CONSEQUENCE_LABELS[key] ?? key}
                </span>
              ))}
            </div>
          )}

          <EventDecisionForm>
            <input type="hidden" name="event_id" value={event.id} />

            <div className="space-y-2">
              {event.options.map((option, i) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-panel-border px-3 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10"
                >
                  <input
                    type="radio"
                    name="option_id"
                    value={option.id}
                    required
                    defaultChecked={i === 0}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-neutral-100">{option.label}</span>
                    <span className="block text-xs text-neutral-500">{option.subtitle}</span>
                  </span>
                </label>
              ))}
            </div>

            {event.allowFreeText && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-300">
                  {event.freeTextPrompt ?? "Respuesta libre (opcional)"}
                </label>
                <textarea
                  name="free_text"
                  rows={2}
                  className="w-full rounded-md border border-panel-border bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-gold"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-gold-soft"
            >
              Confirmar decisión
            </button>
          </EventDecisionForm>
        </div>
      </div>
      <BottomNav active="carrera" />
    </main>
  );
}
