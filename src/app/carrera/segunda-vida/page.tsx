import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { pickNextEvent, maybeAddFreeText } from "@/lib/narrative/engine";
import { getSecondLifeEvents } from "@/lib/narrative/segundaVida";
import { generateSecondLifeEvent } from "@/lib/narrative/ai";
import { SECOND_CAREER_LABELS } from "@/types/career";
import { StatBar } from "@/components/StatBar";
import { EventScene } from "@/components/EventScene";
import { resolveSecondLifeEvent } from "./actions";

export default async function SegundaVidaPage() {
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

  if (player.status !== "second_life" || !player.second_career) {
    redirect("/mi-jugador");
  }

  let event = player.pending_event;

  if (!event) {
    const { data: history } = await supabase
      .from("career_events")
      .select("title, chosen_option_label, free_text_response")
      .eq("player_id", player.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const historyForAi = (history ?? []).map((h) => ({
      title: h.title as string,
      chosen: (h.chosen_option_label as string | null) ?? "",
      freeText: h.free_text_response as string | null,
    }));

    const { data: allHistory } = await supabase
      .from("career_events")
      .select("event_id")
      .eq("player_id", player.id);
    const usedEventIds = (allHistory ?? []).map((h) => h.event_id as string);

    event = maybeAddFreeText(
      (await generateSecondLifeEvent(player, player.second_career, historyForAi)) ??
        pickNextEvent(
          getSecondLifeEvents(player.second_career, player.second_club),
          player.second_week,
          usedEventIds,
        ),
    );
    await supabase.from("players").update({ pending_event: event }).eq("id", player.id);
  }

  const clubTitleCount = [player.flags?.title_liga, player.flags?.title_champions].filter(Boolean).length;

  return (
    <main className="flex flex-1 justify-center p-6">
      <div className="w-full max-w-lg space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gold">
              {SECOND_CAREER_LABELS[player.second_career]}
              {player.second_club ? ` · ${player.second_club}` : ""}
            </p>
            <h1 className="text-xl font-bold text-neutral-100">{player.last_name}</h1>
          </div>
          <Link href="/mi-jugador" className="text-sm text-neutral-400 hover:text-gold">
            Mi jugador
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-panel-border bg-panel p-4">
          <StatBar label="Reputación" value={player.reputacion} />
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-neutral-400">Patrimonio</div>
            <div className="text-lg font-bold text-gold">
              {player.patrimonio.toLocaleString("es")} €
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-panel-border bg-panel p-5 shadow-sm">
          <EventScene club={player.second_club ?? player.club} category={event.category} titles={clubTitleCount} />
          <h2 className="text-lg font-bold text-neutral-100">{event.title}</h2>
          <p className="text-sm text-neutral-400">{event.description}</p>

          <form action={resolveSecondLifeEvent} className="space-y-3 pt-2">
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
          </form>
        </div>
      </div>
    </main>
  );
}
