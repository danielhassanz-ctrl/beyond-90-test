import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { ClubCrest } from "@/components/ClubCrest";
import { BottomNav } from "@/components/BottomNav";
import { CompetitionStatsCard } from "@/components/CompetitionStatsCard";
import { TrophyIcon } from "@/components/TrophyIcon";
import { getCompetitionStats, type SeasonHistoryRow } from "@/lib/player/competition-stats";
import { allTrofeos, INDIVIDUAL, TROFEO_LABEL, type Trofeo, type TrofeoKind } from "@/lib/honours";
import { repairTrophies } from "@/lib/honours-repair";
import { NO_CLUB_YET } from "@/lib/constants";

interface Stint {
  club: string;
  rows: SeasonHistoryRow[];
}

/** Agrupa temporadas consecutivas en el mismo equipo (volver a un club antiguo abre otra etapa). */
function groupByTeam(rows: SeasonHistoryRow[], fallback: string): Stint[] {
  const stints: Stint[] = [];
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

/** Cabecera de las columnas de números, siempre a la derecha y con el mismo ancho en todas las tablas. */
function ColumnHeads({ first }: { first: string }) {
  return (
    <div className="flex items-center gap-1 border-b border-panel-border bg-black/20 px-4 py-2 text-kicker text-muted-foreground">
      <span className="flex-1">{first}</span>
      <span className="w-9 text-center">PJ</span>
      <span className="w-11 text-center">Goles</span>
      <span className="w-11 text-center">Asist.</span>
      <span className="w-16 text-right">Títulos</span>
    </div>
  );
}

function NumCells({ pj, g, a, trophies }: { pj: number; g: number; a: number; trophies: TrofeoKind[] }) {
  return (
    <>
      <span className="font-num w-9 text-center text-sm text-foreground">{pj}</span>
      <span className="font-num w-11 text-center text-sm text-foreground">{g}</span>
      <span className="font-num w-11 text-center text-sm text-foreground">{a}</span>
      <span className="flex w-16 items-center justify-end gap-0.5">
        {trophies.length > 0 ? trophies.map((k, i) => <TrophyIcon key={`${k}-${i}`} kind={k} size={26} />) : <span className="text-muted-foreground">—</span>}
      </span>
    </>
  );
}

function StintCard({ stint, ligaPos, accent }: { stint: Stint; ligaPos: (idx: number) => string | null; accent?: string }) {
  const first = stint.rows[0];
  const last = stint.rows[stint.rows.length - 1];
  const years = first.idx === last.idx ? first.label : `${first.label.split("/")[0]} – ${last.label}`;
  const titles = sum(stint.rows, "titles");
  return (
    <div className="overflow-hidden rounded-2xl border border-panel-border bg-surface">
      <div className="flex items-center gap-3 px-4 py-3">
        <ClubCrest club={stint.club.replace(/ B$/, "")} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight text-foreground">{stint.club || "Sin club"}</p>
          <p className="text-xs text-muted-foreground">{accent ? `${accent} · ` : ""}{years}</p>
        </div>
        {titles > 0 && <span className="font-cond rounded-full border border-gold/50 bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold">{titles} {titles === 1 ? "título" : "títulos"}</span>}
      </div>
      <ColumnHeads first="Temporada" />
      <ul className="divide-y divide-panel-border">
        {stint.rows.map((r) => {
          const pos = ligaPos(r.idx);
          return (
            <li key={`${r.idx}-${r.team}`} className="flex items-center gap-1 px-4 py-2.5">
              <span className="flex-1">
                <span className="font-num block text-sm text-foreground">{r.label}</span>
                {pos && r.team === "club" && <span className="block text-[11px] text-muted-foreground">{pos}º en Liga</span>}
              </span>
              <NumCells pj={r.matches} g={r.goals} a={r.assists} trophies={r.trophies} />
            </li>
          );
        })}
        <li className="flex items-center gap-1 bg-gold/5 px-4 py-2.5">
          <span className="font-cond flex-1 text-xs font-bold uppercase tracking-wide text-gold">Total</span>
          <span className="font-num w-9 text-center text-sm font-bold text-gold">{sum(stint.rows, "matches")}</span>
          <span className="font-num w-11 text-center text-sm font-bold text-gold">{sum(stint.rows, "goals")}</span>
          <span className="font-num w-11 text-center text-sm font-bold text-gold">{sum(stint.rows, "assists")}</span>
          <span className="font-num w-16 text-right text-sm font-bold text-gold">{titles || "—"}</span>
        </li>
      </ul>
    </div>
  );
}

function KindCard({ kind, list }: { kind: TrofeoKind; list: Trofeo[] }) {
  return (
    <div className="rounded-2xl border border-gold/40 bg-gradient-to-b from-amber-900/25 via-surface to-surface px-4 py-4">
      <div className="flex items-end justify-between">
        <TrophyIcon kind={kind} size={78} />
        <span className="font-display text-4xl leading-none text-gold">×{list.length}</span>
      </div>
      <p className="mt-3 font-display text-lg leading-tight text-foreground">{TROFEO_LABEL[kind]}</p>
      <p className="mt-1 text-xs text-muted-foreground">{list.map((t) => seasonName(t.s)).join(" · ")}</p>
    </div>
  );
}

export default async function TrayectoriaPage() {
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user) redirect("/login");
  if (!player) redirect("/crear-jugador");

  await repairTrophies(supabase, player);
  const { season, career, history } = await getCompetitionStats(supabase, player, player.pending_event, player.flags);
  const trofeos = allTrofeos(player);
  const titleCount = trofeos.filter((t) => !INDIVIDUAL.has(t.k)).length;
  const fallbackClub = player.club === NO_CLUB_YET ? "" : player.club;

  const filialRows = history.filter((r) => r.team === "filial");
  const clubRows = history.filter((r) => r.team === "club");
  const selRows = history.filter((r) => r.team === "seleccion");
  const filialStints = groupByTeam(filialRows, "Filial");
  const clubStints = groupByTeam(clubRows, fallbackClub);
  const ligaPos = (idx: number) => {
    const [rank] = String(player.flags?.[`liga_pos_${idx}`] ?? "").split("|");
    return rank || null;
  };

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

        {/* Resumen de carrera */}
        <section className="grid grid-cols-4 overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-b from-amber-900/20 to-surface py-4 text-center">
          {(
            [
              ["Partidos", player.stats_matches_played ?? 0],
              ["Goles", player.stats_goals ?? 0],
              ["Asist.", player.stats_assists ?? 0],
              ["Títulos", titleCount],
            ] as [string, number][]
          ).map(([label, value]) => (
            <div key={label}>
              <p className="gold-text font-display text-3xl">{value}</p>
              <p className="text-kicker text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        {/* Palmarés */}
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

        {/* Club a club */}
        <section className="space-y-3">
          <p className="text-kicker text-gold">Tu camino, equipo a equipo</p>
          {filialStints.length + clubStints.length === 0 ? (
            <p className="rounded-2xl border border-panel-border bg-surface px-4 py-5 text-center text-sm text-muted-foreground">
              Aún no hay temporadas que contar. Cuando juegues, tu camino aparecerá aquí.
            </p>
          ) : (
            <>
              {filialStints.map((st, i) => (
                <StintCard key={`f-${i}`} stint={st} ligaPos={ligaPos} accent="Filial" />
              ))}
              {clubStints.map((st, i) => (
                <StintCard key={`c-${i}`} stint={st} ligaPos={ligaPos} />
              ))}
            </>
          )}
        </section>

        {/* Toda la carrera, competición a competición */}
        <section className="space-y-3">
          <p className="text-kicker text-gold">Por competición</p>
          <CompetitionStatsCard season={season} career={career} seasonLabel="" view="career" />
        </section>

        {/* Selección: aparte, con la camiseta de tu país */}
        {selRows.length > 0 && (
          <section className="space-y-3">
            <p className="text-kicker text-gold">Con tu selección</p>
            {selRows.length > 0 && <StintCard stint={{ club: player.nation, rows: selRows }} ligaPos={() => null} accent="Selección" />}
          </section>
        )}
      </div>
      <BottomNav active="jugador" />
    </main>
  );
}
