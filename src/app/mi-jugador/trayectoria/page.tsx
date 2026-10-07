import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { ClubCrest } from "@/components/ClubCrest";
import { BottomNav } from "@/components/BottomNav";
import { getCompetitionStats, type SeasonHistoryRow } from "@/lib/player/competition-stats";
import { allTrofeos, INDIVIDUAL, TROFEO_ICON, TROFEO_LABEL, type Trofeo, type TrofeoKind } from "@/lib/honours";
import { repairTrophies } from "@/lib/honours-repair";
import { NO_CLUB_YET } from "@/lib/constants";

interface ClubStint {
  club: string;
  rows: SeasonHistoryRow[];
}

/** Agrupa las temporadas consecutivas en un mismo club (volver a un club antiguo abre otra etapa). */
function groupByClub(rows: SeasonHistoryRow[], fallback: string): ClubStint[] {
  const stints: ClubStint[] = [];
  for (const row of rows) {
    const club = row.club || fallback;
    const last = stints[stints.length - 1];
    if (last && last.club === club) last.rows.push(row);
    else stints.push({ club, rows: [row] });
  }
  return stints;
}

const sum = (rows: SeasonHistoryRow[], k: "matches" | "goals" | "assists" | "titles") => rows.reduce((n, r) => n + r[k], 0);
const seasonName = (s: number) => `${2026 + s}/${String(2027 + s).slice(2)}`;

function KindCard({ kind, list }: { kind: TrofeoKind; list: Trofeo[] }) {
  return (
    <div className="rounded-2xl border border-gold/40 bg-gradient-to-b from-amber-900/20 to-surface px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-3xl">{TROFEO_ICON[kind]}</span>
        <span className="font-display text-3xl text-gold">×{list.length}</span>
      </div>
      <p className="mt-2 font-display text-lg text-foreground">{TROFEO_LABEL[kind]}</p>
      <p className="mt-1 text-xs text-muted-foreground">{list.map((t) => `${seasonName(t.s)}${t.c ? ` · ${t.c}` : ""}`).join(" · ")}</p>
    </div>
  );
}

export default async function TrayectoriaPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");

  await repairTrophies(supabase, player);
  const { history } = await getCompetitionStats(supabase, player, player.pending_event, player.flags);
  const trofeos = allTrofeos(player);
  const stints = groupByClub(history, player.club === NO_CLUB_YET ? "" : player.club);
  const titleCount = trofeos.filter((t) => !INDIVIDUAL.has(t.k)).length;

  const byKind = new Map<TrofeoKind, Trofeo[]>();
  for (const t of trofeos) byKind.set(t.k, [...(byKind.get(t.k) ?? []), t]);
  const teamKinds = [...byKind.keys()].filter((k) => !INDIVIDUAL.has(k));
  const individualKinds = [...byKind.keys()].filter((k) => INDIVIDUAL.has(k));

  return (
    <main className="flex flex-1 justify-center p-6 pb-24">
      <div className="w-full max-w-lg space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl">
            <span className="gold-text">Trayectoria</span>
          </h1>
          <Link href="/mi-jugador" className="font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">
            Mi jugador
          </Link>
        </div>

        <section className="space-y-3">
          <p className="text-kicker text-gold">Palmarés</p>
          {trofeos.length === 0 ? (
            <div className="rounded-2xl border border-panel-border bg-surface px-4 py-6 text-center">
              <p className="text-3xl">🏆</p>
              <p className="mt-2 font-display text-lg">La vitrina está vacía</p>
              <p className="mt-1 text-xs text-muted-foreground">El primer título se recuerda para siempre. Cada Liga, Copa o Champions ganada aparecerá aquí.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-panel-border bg-surface px-4 py-3 text-center">
                <p className="text-kicker">Títulos de equipo</p>
                <p className="gold-text font-display text-4xl">{titleCount}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {teamKinds.map((k) => (
                  <KindCard key={k} kind={k} list={byKind.get(k)!} />
                ))}
              </div>
              {individualKinds.length > 0 && (
                <>
                  <p className="pt-2 text-kicker text-gold">Premios individuales</p>
                  <div className="grid grid-cols-2 gap-3">
                    {individualKinds.map((k) => (
                      <KindCard key={k} kind={k} list={byKind.get(k)!} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>

        <section className="space-y-3">
          <p className="text-kicker text-gold">Tu camino, club a club</p>
          {stints.length === 0 ? (
            <p className="rounded-2xl border border-panel-border bg-surface px-4 py-5 text-center text-sm text-muted-foreground">
              Aún no hay temporadas que contar. Cuando juegues, tu camino aparecerá aquí.
            </p>
          ) : (
            stints.map((st, i) => {
              const first = st.rows[0];
              const last = st.rows[st.rows.length - 1];
              const years = first.idx === last.idx ? first.label : `${first.label.split("/")[0]} – ${last.label}`;
              const titles = sum(st.rows, "titles");
              return (
                <div key={`${st.club}-${i}`} className="overflow-hidden rounded-2xl border border-panel-border bg-surface">
                  <div className="flex items-center gap-3 border-b border-panel-border px-4 py-3">
                    <ClubCrest club={st.club} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg text-foreground">{st.club || "Sin club"}</p>
                      <p className="text-xs text-muted-foreground">{years}</p>
                    </div>
                    {titles > 0 && (
                      <span className="font-cond rounded-full border border-gold/50 bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold">🏆 {titles}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-panel-border text-center">
                    {(
                      [
                        ["Partidos", sum(st.rows, "matches")],
                        ["Goles", sum(st.rows, "goals")],
                        ["Asist.", sum(st.rows, "assists")],
                      ] as [string, number][]
                    ).map(([label, value]) => (
                      <div key={label} className="py-3">
                        <p className="font-num text-2xl font-bold text-foreground">{value}</p>
                        <p className="text-kicker text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                  <ul className="divide-y divide-panel-border border-t border-panel-border text-sm">
                    {st.rows.map((r) => {
                      const [rank] = String(player.flags?.[`liga_pos_${r.idx}`] ?? "").split("|");
                      return (
                        <li key={r.idx} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <span className="font-num text-xs text-muted-foreground">{r.label}</span>
                          <span className="font-num flex-1 text-xs text-foreground/90">
                            {r.matches} PJ · {r.goals} G · {r.assists} A{rank ? ` · ${rank}º en Liga` : ""}
                          </span>
                          <span className="text-base">{r.trophies.map((k) => TROFEO_ICON[k]).join(" ")}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </section>

        <section className="rounded-2xl border border-panel-border bg-surface px-4 py-4">
          <p className="text-kicker text-gold">Toda tu carrera</p>
          <div className="mt-2 grid grid-cols-4 text-center">
            {(
              [
                ["PJ", player.stats_matches_played ?? 0],
                ["Goles", player.stats_goals ?? 0],
                ["Asist.", player.stats_assists ?? 0],
                ["Títulos", titleCount],
              ] as [string, number][]
            ).map(([label, value]) => (
              <div key={label}>
                <p className="font-num text-2xl font-bold text-foreground">{value}</p>
                <p className="text-kicker text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <BottomNav active="jugador" />
    </main>
  );
}
