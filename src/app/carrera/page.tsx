import { redirect } from "next/navigation";

// Necesario para que la generación de imagen en segundo plano (after() en
// resolveEvent, en actions.ts) tenga tiempo de terminar: Flux Kontext Pro
// puede tardar hasta ~3 minutos en un arranque en frío (medido en pruebas
// reales). Si el plan de Vercel tiene un tope menor, Vercel lo recorta
// solo — no falla el build por pedir más de lo permitido.
export const maxDuration = 300;
import { getCurrentUserAndPlayer } from "@/lib/player";
import { whatIsAtStake } from "@/lib/narrative/engine";
import { ensureNextEvent } from "@/lib/narrative/ensure-event";
import { NO_CLUB_YET } from "@/lib/constants";
import { CONSEQUENCE_LABELS, MODE_TARGET_WEEKS, playerAge, seasonLabel } from "@/types/career";
import { displayName } from "@/types/player";
import { BottomNav } from "@/components/BottomNav";
import { PlayerHeaderCard } from "@/components/PlayerHeaderCard";
import { EventScene } from "@/components/EventScene";
import { MatchScene } from "@/components/MatchScene";
import { getPressQuote, getCoachOpinion } from "@/lib/narrative/pressQuotes";
import { resolveEvent } from "./actions";
import { personalizeEvent, detectMentionedRoles, NPC_ROLE_LABELS } from "@/lib/narrative/npcs";
import { getOrCreateNpcFace, hasMetNpc, markNpcSeen, NPC_FACE_ROLES } from "@/lib/images/npcFaces";
import { getGameDateLabel } from "@/lib/calendar/season";
import { introduceCast } from "@/lib/narrative/cast";
import { computeRole, ROLE_LABELS } from "@/lib/narrative/role";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";
import { NpcAvatarRow } from "@/components/NpcAvatarRow";
import { DmPreview } from "@/components/DmPreview";

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

  const ensured = await ensureNextEvent(supabase, player);
  let event = ensured.event;
  const usedEventIds = ensured.usedEventIds;

  // Personajes con nombre y apellidos (el míster, el capitán, tu madre...): ver npcs.ts.
  if (event) event = personalizeEvent(event, player);

  // Fichas de los personajes que salen nombrados por primera vez en esta
  // escena (ver cast.ts): "quién es" antes de que actúe, poco a poco.
  const castCards = event ? introduceCast(event, player) : [];

  // Cara del personaje que aparece en esta escena (entrenador, capitán,
  // agente, madre, padre, pareja — ver npcFaces.ts). Como máximo 2 por
  // turno: rarísima vez habla más de uno en la misma escena, y así
  // ningún turno dispara de golpe un montón de generaciones nuevas si
  // coincidieran varios roles sin cara todavía.
  //
  // La PRIMERA vez que se menciona un rol no se le pone cara, solo
  // nombre (ver personalizeEvent más arriba) — pedido explícito: "los
  // personajes siguen apareciendo sin tan siquiera conocerlos, lo ideal
  // es que vayan apareciendo conforme los conozcas". Se vio en vivo: la
  // escena de elegir representante, la primerísima de cualquier carrera,
  // menciona "tu padre" solo de pasada ("tu padre lo echaría, pero...")
  // y aun así aparecía su cara ahí mismo. A partir de la segunda mención
  // (hasMetNpc ya en true) el personaje ya pesa algo de verdad en la
  // carrera y sí se le pone cara.
  const mentionedRoles = event ? detectMentionedRoles(event, player).filter((r) => NPC_FACE_ROLES.includes(r)) : [];
  const npcFacesRaw = await Promise.all(
    mentionedRoles.slice(0, 2).map(async (role) => {
      if (!hasMetNpc(player, role)) {
        await markNpcSeen(supabase, player, role);
        return null;
      }
      return {
        role,
        label: NPC_ROLE_LABELS[role],
        url: await getOrCreateNpcFace(supabase, player, role, user.id),
      };
    }),
  );
  const npcFaces = npcFacesRaw.filter((f): f is NonNullable<typeof f> => f !== null);

  const clubTitleCount = [player.flags?.title_liga, player.flags?.title_champions].filter(Boolean).length;

  // Antes esto era literalmente el texto fijo "Titular" siempre, aunque el
  // jugador estuviera en plena cadena de debut con el filial (semanas
  // 11-15 de cualquier carrera nueva, ver rookie-progression.ts) — el
  // propio usuario lo reportó: "titular sin apenas hacer goles con el
  // filial... con 16/17 años, un poco raro". Se deriva del progreso real
  // de esa cadena en vez de darlo por hecho siempre.
  const rookieChainStarted = usedEventIds.includes("pretemp-amistoso");
  const rookieChainFinished = usedEventIds.includes("rookie-debut-oficial");
  const statusLine =
    player.club === NO_CLUB_YET ? "Sin equipo" : rookieChainStarted && !rookieChainFinished ? "Con el filial" : ROLE_LABELS[computeRole(player).role];

  return (
    <main className="flex flex-1 justify-center p-4 pb-24">
      <div className="w-full max-w-lg space-y-4 pb-8">
        {typeof player.flags?.streak_toast === "string" &&
          String(player.flags?.streak_toast_week ?? "") === String(player.week) && (
            <div className="rounded-2xl border border-orange-400/50 bg-orange-500/10 p-4">
              <p className="font-cond text-xs font-bold uppercase tracking-wide text-orange-400">
                🔥 Racha de {player.streak_days} días
              </p>
              <p className="mt-1 text-sm text-foreground/90">{player.flags.streak_toast}</p>
            </div>
          )}
        <div className="rounded-2xl border border-panel-border bg-surface p-4">
          <PlayerHeaderCard
            photoUrl={player.current_photo_url ?? player.photo_url}
            name={displayName(player)}
            age={playerAge(player.week)}
            club={player.club}
            categoryLabel={seasonLabel(player.week)}
            statusLine={statusLine}
            media={player.media}
            forma={player.forma}
            relEntrenador={player.club !== NO_CLUB_YET ? player.rel_entrenador : null}
            relAficion={player.club !== NO_CLUB_YET ? player.rel_aficion : null}
            relVestuario={player.club !== NO_CLUB_YET ? player.rel_vestuario : null}
            relRepresentante={player.agent_name ? player.rel_representante : null}
            streakDays={player.streak_days}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-panel-border bg-surface p-4">
          <MiniStat label="Moral" value={player.moral} />
          <MiniStat label="Fama" value={player.fama} />
        </div>

        <div className="space-y-3 overflow-hidden rounded-2xl border border-panel-border bg-surface">
          {event.category === "partido" && event.rivalClub ? (
            <MatchScene club={event.ownTeam ?? player.club} rivalClub={event.rivalClub} titles={event.ownTeam ? 0 : clubTitleCount} />
          ) : (
            <EventScene club={player.club} category={event.category} titles={clubTitleCount} />
          )}
          <div className="space-y-3 px-4 pb-4">
            <p className="text-kicker">
              {CATEGORY_LABELS[event.category]} · {getGameDateLabel(player.week)}
              {getInjuryRemaining(player.flags) > 0 && ` · 🩹 Baja: ${getInjuryRemaining(player.flags)} ${getInjuryRemaining(player.flags) === 1 ? "mes" : "meses"}`}
            </p>
            <NpcAvatarRow faces={npcFaces} />
            <h2 className="font-display text-xl text-foreground leading-tight">{event.title}</h2>
            {event.dm && <DmPreview dm={event.dm} />}
            <p className="text-sm text-muted-foreground">{event.description}</p>
            {castCards.length > 0 && (
              <div className="space-y-2 rounded-xl border border-gold/30 bg-gold/5 p-3">
                <p className="text-kicker text-gold">Quién es</p>
                {castCards.map((c) => (
                  <div key={c.name}>
                    <p className="text-sm font-semibold text-foreground">
                      {c.name} <span className="text-xs font-normal text-muted-foreground">· {c.role}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{c.blurb}</p>
                  </div>
                ))}
              </div>
            )}

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
                className="gold-fill w-full cursor-pointer rounded-full px-4 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
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
