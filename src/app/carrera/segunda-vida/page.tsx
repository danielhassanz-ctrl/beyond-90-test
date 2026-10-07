import Link from "next/link";
import { redirect } from "next/navigation";

// Igual que en carrera/page.tsx: sin esto, la generación de imagen en
// segundo plano (after() en resolveSecondLifeEvent) queda sujeta al
// límite de duración por defecto de la ruta en un despliegue real — se
// cortaría a medias, siempre, sin excepción. Se puso en /carrera cuando
// se creó ese pipeline, pero nunca se replicó aquí al cablear el mismo
// mecanismo para la segunda vida.
export const maxDuration = 300;
import { getCurrentUserAndPlayer } from "@/lib/player";
import { pickNextEvent, maybeAddFreeText, whatIsAtStake } from "@/lib/narrative/engine";
import { getSecondLifeEvents } from "@/lib/narrative/segundaVida";
import { generateSecondLifeEvent, generateSecondLifeThreadPayoff } from "@/lib/narrative/ai";
import { openThreads, consumeThread, shouldTriggerSecondLifePayoff } from "@/lib/narrative/threads";
import { runWithAiBudget, SECOND_LIFE_BUDGET } from "@/lib/narrative/ai-budget";
import { SECOND_CAREER_LABELS, CONSEQUENCE_LABELS, SECOND_LIFE_TARGET_WEEKS } from "@/types/career";
import { displayName } from "@/types/player";
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
      .select("title, chosen_option_label, free_text_response, description")
      .eq("player_id", player.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const historyForAi = (history ?? []).map((h) => ({
      title: h.title as string,
      chosen: (h.chosen_option_label as string | null) ?? "",
      freeText: h.free_text_response as string | null,
      scene: h.description as string | null,
    }));

    const { data: allHistory } = await supabase
      .from("career_events")
      .select("event_id")
      .eq("player_id", player.id);
    const usedEventIds = (allHistory ?? []).map((h) => h.event_id as string);

    // Un asunto pendiente de su carrera como futbolista vuelve a cobrarse
    // (hilos abiertos, ver narrative/threads.ts): ahora lo trae su nueva vida.
    // Con presupuesto de IA propio y pequeño (ai-budget.ts); sin él, escenas escritas a mano.
    const dueThread = openThreads(player.flags)[0];
    const { result: ai, used: slUsed } = await runWithAiBudget(
      {
        used: parseInt(String(player.flags?.ai_used_sl ?? "0"), 10) || 0,
        total: SECOND_LIFE_BUDGET,
        week: player.second_week,
        targetWeeks: SECOND_LIFE_TARGET_WEEKS,
      },
      async () => {
        let payoff: Awaited<ReturnType<typeof generateSecondLifeThreadPayoff>> = null;
        let consumedThread = false;
        if (dueThread && shouldTriggerSecondLifePayoff(player)) {
          payoff = await generateSecondLifeThreadPayoff(player, player.second_career!, dueThread, historyForAi);
          consumedThread = Boolean(payoff);
        }
        const generated = payoff ?? (await generateSecondLifeEvent(player, player.second_career!, historyForAi));
        return { generated, consumedThread };
      },
    );

    event = maybeAddFreeText(
      ai.generated ??
        pickNextEvent(getSecondLifeEvents(player.second_career, player.second_club), player.second_week, usedEventIds),
    );
    const flagsAfter: Record<string, string | boolean> = {
      ...(player.flags ?? {}),
      ai_used_sl: String(slUsed),
      ...(ai.consumedThread && dueThread
        ? { hilos: consumeThread(player.flags, dueThread), thread_last_second_week: String(player.second_week) }
        : {}),
    };
    await supabase.from("players").update({ pending_event: event, flags: flagsAfter }).eq("id", player.id);
  }

  const clubTitleCount = [player.flags?.title_liga, player.flags?.title_champions].filter(Boolean).length;

  return (
    <main className="flex flex-1 justify-center p-4 pb-24">
      <div className="w-full max-w-lg space-y-4 pb-8">
        <div className="flex items-center justify-between rounded-2xl border border-panel-border bg-surface p-4">
          <div className="min-w-0">
            <p className="text-kicker">
              {SECOND_CAREER_LABELS[player.second_career]}
              {player.second_club ? ` · ${player.second_club}` : ""}
            </p>
            <h1 className="truncate font-display text-xl text-foreground">{displayName(player)}</h1>
          </div>
          <Link href="/mi-jugador" className="shrink-0 font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">
            Mi jugador
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-panel-border bg-surface p-4">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-kicker">Reputación</span>
              <span className="font-num text-sm font-semibold text-foreground/90">{player.reputacion}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="gold-fill h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(100, player.reputacion))}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-kicker">Patrimonio</p>
            <p className="font-num text-lg font-bold text-gold">
              {player.patrimonio.toLocaleString("es")} €
            </p>
          </div>
        </div>

        <div className="space-y-3 overflow-hidden rounded-2xl border border-panel-border bg-surface">
          <EventScene club={player.second_club ?? player.club} category={event.category} titles={clubTitleCount} />
          <div className="space-y-3 px-4 pb-4">
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

            <form action={resolveSecondLifeEvent} className="space-y-2 pt-1">
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
                      <span className="min-w-0 flex-1">
                        <span className="font-display text-sm text-foreground">{option.label}</span>
                        <span className="mt-0.5 block text-xs italic text-muted-foreground">{option.subtitle}</span>
                      </span>
                    </span>
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
                className="gold-fill w-full cursor-pointer rounded-full px-4 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
              >
                Confirmar decisión
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
