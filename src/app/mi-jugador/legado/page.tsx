import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { seasonLabel } from "@/types/career";
import { ClubCrest } from "@/components/ClubCrest";
import { BottomNav } from "@/components/BottomNav";
import { ShareableCard } from "@/components/ShareableCard";
import { repairTrophies } from "@/lib/honours-repair";
import { readSaga, describeLegacy } from "@/lib/narrative/dynasty";
import { ACHIEVEMENTS, TIER_LABEL, newAchievements, optionalAchievements, pathAchievements, unlockedIds, type Category, type Tier } from "@/lib/narrative/achievements";
import { displayName } from "@/types/player";
import { withShareLink } from "@/lib/constants";

const SECOND_LIFE_MILESTONE_TYPES = new Set([
  "ascenso_entrenador", "canterano", "seleccion", "final_champions",
  "fichaje_agente", "puja_agente", "agencia", "cantera", "oferta_fondo",
  "fichaje_galactico", "titulo_presidente", "inversor", "cantera_propia",
  "autobiografia", "hall_fama", "balon_oro_cliente", "fondo_deportivo",
  "presidente_federacion",
]);

const TIER_STYLE: Record<Tier, string> = {
  bronce: "border-amber-700/60 bg-amber-700/10 text-amber-500",
  plata: "border-slate-400/60 bg-slate-400/10 text-slate-300",
  oro: "border-gold/70 bg-gold/10 text-gold",
};

const ORDER: Category[] = ["Carrera", "Títulos", "Premios", "Dinero", "Vida", "Club", "Superación"];

const TABS = [
  { key: "camino", label: "Camino" },
  { key: "logros", label: "Logros" },
  { key: "momentos", label: "Momentos" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// Reloj fuera del render: la página se calcula en el servidor en cada petición.
const nowMs = () => Date.now();

/**
 * LEGADO: el mapa de toda la carrera en una sola pantalla. Antes eran dos (Legado con 13 casillas y Logros con 57 metas) que repetían
 * las mismas metas con nombres distintos. Ahora hay una sola lista de logros (narrative/achievements.ts): trece forman «el camino»
 * (de la cantera al retiro), el resto son opcionales, y los momentos con foto van en su pestaña.
 */
export default async function LegadoPage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  if (!player) {
    redirect("/crear-jugador");
  }
  await repairTrophies(supabase, player);

  const params = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === params.v) ? (params.v as TabKey) : "camino";

  // Lo que ya se cumple pero el motor todavía no ha anotado (se anota en el siguiente turno): se muestra igual.
  const pending = new Set(newAchievements(player).map((a) => a.id));
  const done = new Set([...unlockedIds(player), ...pending]);
  const byTier = (t: Tier) => ACHIEVEMENTS.filter((a) => a.tier === t && done.has(a.id)).length;
  const name = displayName(player);
  const path = pathAchievements();
  const nextStep = path.find((a) => !done.has(a.id));
  const wonAt = (id: string) => {
    const w = parseInt(String(player.flags?.[`logro_${id}`] ?? "0"), 10) || 0;
    return w > 0 ? seasonLabel(w) : null;
  };

  const { data: milestones } = tab === "momentos"
    ? await supabase.from("milestones").select("*").eq("player_id", player.id).order("created_at", { ascending: false })
    : { data: null };

  return (
    <main className="flex flex-1 flex-col items-center gap-5 p-6 pb-24">
      <div className="w-full max-w-md space-y-1">
        <Link href="/mi-jugador" className="font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">
          ‹ Mi jugador
        </Link>
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-2xl">
            <span className="gold-text">Legado</span>
          </h1>
          <span className="font-num text-xs font-semibold text-muted-foreground">
            {done.size}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">El mapa de tu carrera: lo que ya has logrado y lo que todavía te queda.</p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="gold-fill h-full rounded-full" style={{ width: `${Math.min(100, Math.round((done.size / ACHIEVEMENTS.length) * 100))}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {byTier("oro")} de oro · {byTier("plata")} de plata · {byTier("bronce")} de bronce
        </p>
      </div>

      <nav className="grid w-full max-w-md grid-cols-3 gap-1 rounded-full border border-panel-border bg-surface p-1" aria-label="Secciones del legado">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "camino" ? "/mi-jugador/legado" : `/mi-jugador/legado?v=${t.key}`}
            className={`rounded-full px-3 py-2 text-center font-cond text-xs font-bold uppercase tracking-wide ${
              tab === t.key ? "gold-fill text-primary-foreground" : "text-muted-foreground hover:text-gold"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "camino" && (
        <>
          {readSaga(player.flags).length > 0 && (
            <div className="w-full max-w-md space-y-2 rounded-2xl border border-gold/40 bg-surface p-4">
              <p className="text-kicker text-gold">La saga de tu apellido</p>
              {readSaga(player.flags).map((e, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="font-num mt-0.5 text-xs font-bold text-gold">{i + 1}ª</span>
                  <div className="min-w-0">
                    <p className="font-display text-base">{e.n}{e.club ? <span className="text-sm text-muted-foreground"> · {e.club}</span> : null}</p>
                    <p className="text-xs text-muted-foreground">{describeLegacy(e)}</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Tú eres la {readSaga(player.flags).length + 1}ª generación.</p>
            </div>
          )}

          <ol className="w-full max-w-md">
            {path.map((a, i) => {
              const isDone = done.has(a.id);
              const isNext = nextStep?.id === a.id;
              const when = isDone ? wonAt(a.id) : null;
              return (
                <li key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < path.length - 1 && (
                    <span aria-hidden className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${isDone && done.has(path[i + 1].id) ? "bg-gold/70" : "bg-panel-border"}`} />
                  )}
                  <span
                    className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-base ${
                      isDone ? "gold-fill border-transparent" : isNext ? "border-gold bg-surface text-gold" : "border-border bg-surface text-muted-foreground/50"
                    }`}
                    aria-hidden
                  >
                    {isDone ? a.icon : isNext ? a.icon : "·"}
                  </span>
                  <div className={`min-w-0 flex-1 rounded-xl border px-3 py-2 ${isNext ? "border-gold/60 bg-gold/5" : "border-transparent"}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`font-display text-base leading-tight ${isDone ? "text-foreground" : isNext ? "text-gold" : "text-muted-foreground"}`}>{a.name}</p>
                      {isNext && <span className="shrink-0 font-cond text-[10px] font-bold uppercase tracking-wide text-gold">Siguiente</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                    {when && <p className="mt-0.5 font-cond text-[10px] uppercase tracking-wide text-gold-soft">Temporada {when}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {tab === "logros" &&
        ORDER.map((cat) => {
          const list = optionalAchievements().filter((a) => a.category === cat);
          if (list.length === 0) return null;
          return (
            <section key={cat} className="w-full max-w-md space-y-2">
              <p className="text-kicker">
                {cat} · {list.filter((a) => done.has(a.id)).length}/{list.length}
              </p>
              <div className="space-y-2">
                {list.map((a) =>
                  done.has(a.id) ? (
                    <ShareableCard key={a.id} title="Beyond 90" text={withShareLink(`${a.icon} Logro desbloqueado en Beyond 90: ${a.name} (${name}).`)}>
                      <div className={`flex items-center gap-3 rounded-2xl border p-3 ${TIER_STYLE[a.tier]}`}>
                        <span className="text-3xl" aria-hidden>{a.icon}</span>
                        <div className="min-w-0">
                          <p className="font-display text-base text-foreground">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.description}</p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide">{TIER_LABEL[a.tier]}</p>
                        </div>
                      </div>
                    </ShareableCard>
                  ) : (
                    <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-panel-border bg-surface p-3 opacity-60">
                      <span className="text-3xl grayscale" aria-hidden>🔒</span>
                      <div className="min-w-0">
                        <p className="font-display text-base text-foreground/80">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{TIER_LABEL[a.tier]}</p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>
          );
        })}

      {tab === "momentos" && (
        <>
          <div className="w-full max-w-md space-y-1">
            <p className="text-xs text-muted-foreground">Cada hito desbloqueado, con su foto, listo para volver a compartir.</p>
          </div>

          {!milestones || milestones.length === 0 ? (
            <p className="pt-4 text-center text-sm text-muted-foreground">
              Todavía no tienes ningún momento destacado. Va a ir apareciendo con tus decisiones.
            </p>
          ) : (
            <div className="grid w-full max-w-md grid-cols-2 gap-3">
              {milestones.map((m) => {
                // Mismo umbral que /carrera/hito/[id]: pasados 5 minutos, un "pending" ya no es "está en camino", es un trabajo en
                // segundo plano que la plataforma mató a medio hacer y que nunca va a terminar por su cuenta.
                const regenStartedAt = parseInt(String(player.flags?.[`regen_${m.id}`] ?? "0"), 10) || 0;
                const startedAt = Math.max(regenStartedAt, m.created_at ? new Date(m.created_at).getTime() : 0);
                const isStalePending = m.image_status === "pending" && startedAt > 0 && nowMs() - startedAt > 5 * 60_000;
                const crestClub = SECOND_LIFE_MILESTONE_TYPES.has(m.type) ? (player.second_club ?? player.club) : player.club;

                return (
                  <Link key={m.id} href={`/carrera/hito/${m.id}`} className="group overflow-hidden rounded-2xl border border-panel-border bg-surface hover:border-gold/50">
                    <div className="relative aspect-square w-full bg-surface-2">
                      {m.image_url ? (
                        <Image src={m.image_url} alt={m.title} fill className="object-cover transition group-hover:scale-105" />
                      ) : player.photo_url ? (
                        // Sin foto de IA propia para este hito (en camino, saltada por el límite de gasto, o fallida): tu foto real de fondo.
                        <>
                          <Image src={player.photo_url} alt={m.title} fill className="object-cover object-top transition group-hover:scale-105" />
                          <div className="absolute right-1.5 top-1.5 drop-shadow-md">
                            <ClubCrest club={crestClub} size={24} />
                          </div>
                          {m.image_status === "pending" && !isStalePending && (
                            <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-1">
                              <p className="font-cond text-[9px] uppercase tracking-wide text-gold">Generando foto…</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ClubCrest club={crestClub} size={40} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5 p-2">
                      <p className="line-clamp-2 text-xs font-semibold text-foreground">{m.title}</p>
                      <p className="font-cond text-[10px] uppercase tracking-wide text-muted-foreground">
                        {SECOND_LIFE_MILESTONE_TYPES.has(m.type) ? `Semana ${m.week} de tu segunda vida` : `Temporada ${seasonLabel(m.week)}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      <BottomNav active="legado" />
    </main>
  );
}
