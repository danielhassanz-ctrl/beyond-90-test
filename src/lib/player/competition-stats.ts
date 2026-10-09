/**
 * Estadísticas desglosadas por competición (Liga, Champions, Europa League,
 * Copa y selección — con Mundial, Eurocopa y Copa América aparte), tanto de
 * la temporada en curso como de toda la carrera. Igual que
 * getCurrentSeasonStats, no hay columnas nuevas en la base de datos: se
 * reconstruye releyendo career_events y pasando cada partido por
 * extractStatsFromEvent, el mismo análisis de texto que ya alimenta los
 * totales — así los números no pueden desincronizarse.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import type { GameEvent } from "@/types/career";
import { WEEKS_PER_SEASON, seasonLabel } from "@/types/career";
import { extractStatsFromEvent, statSeasonOf } from "@/lib/player/update-stats";
import { readAllSim, sumSim, type SimComp } from "@/lib/narrative/off-screen-matches";
import { allTrofeos, INDIVIDUAL, type TrofeoKind } from "@/lib/honours";

export interface CompStat {
  matches: number;
  goals: number;
  assists: number;
  minutes: number;
}

export type TournamentKey = "mundial" | "eurocopa" | "copa_america" | "otros";

export interface CompetitionStats {
  liga: CompStat;
  champions: CompStat;
  europa: CompStat;
  copa: CompStat;
  seleccion: CompStat;
  /** Desglose de la selección por torneo ("otros" = clasificatorios, amistosos y demás). */
  torneos: Record<TournamentKey, CompStat>;
}

const empty = (): CompStat => ({ matches: 0, goals: 0, assists: 0, minutes: 0 });

/** Una fila del historial: lo que hiciste en cada temporada. */
export interface SeasonHistoryRow {
  /** Número de temporada (0 = la primera). */
  idx: number;
  /** Con qué camiseta: tu club, el filial de tus inicios o la selección. */
  team: "club" | "filial" | "seleccion";
  /** Club (o selección) de esa fila, si se conoce. */
  club?: string;
  /** Trofeos ganados esa temporada. */
  trophies: TrofeoKind[];
  label: string;
  matches: number;
  goals: number;
  assists: number;
  minutes: number;
  titles: number;
}

function newRow(idx: number, team: SeasonHistoryRow["team"] = "club"): SeasonHistoryRow {
  return { idx, team, trophies: [], label: seasonLabel(idx * WEEKS_PER_SEASON + 1), matches: 0, goals: 0, assists: 0, minutes: 0, titles: 0 };
}

export function emptyCompetitionStats(): CompetitionStats {
  return {
    liga: empty(),
    champions: empty(),
    europa: empty(),
    copa: empty(),
    seleccion: empty(),
    torneos: { mundial: empty(), eurocopa: empty(), copa_america: empty(), otros: empty() },
  };
}

type Classified = { comp: "liga" | "champions" | "europa" | "copa" | "seleccion"; torneo?: TournamentKey };

/**
 * A qué competición pertenece un partido. Las crónicas generadas siguen el
 * formato "Ante X en {competición}, jugaste…" (ver generateMatchDayEvent),
 * así que se mira primero esa frase; si no está (partidos escritos a mano),
 * se buscan las palabras clave por orden de especificidad.
 */
export function classifyMatch(title: string, description: string): Classified {
  const text = `${title} ${description}`.toLowerCase();
  const framed = text.match(/\ben (la liga|copa del rey|champions league|europa league|partido internacional|el mundial|la eurocopa|la copa am[eé]rica)/);
  const key = framed ? framed[1] : text;

  const torneo = (): TournamentKey =>
    /mundial/.test(text) ? "mundial" : /eurocopa/.test(text) ? "eurocopa" : /copa am[eé]rica/.test(text) ? "copa_america" : "otros";

  if (/champions league/.test(key)) return { comp: "champions" };
  if (/europa league/.test(key)) return { comp: "europa" };
  if (/copa del rey/.test(key)) return { comp: "copa" };
  if (/partido internacional|mundial|eurocopa|copa am[eé]rica/.test(key)) return { comp: "seleccion", torneo: torneo() };
  return { comp: "liga" };
}

function add(stat: CompStat, u: { goals?: number; assists?: number; minutes_played?: number }) {
  stat.matches += 1;
  stat.goals += u.goals ?? 0;
  stat.assists += u.assists ?? 0;
  stat.minutes += u.minutes_played ?? 0;
}

export async function getCompetitionStats(
  supabase: SupabaseClient,
  player: Pick<Player, "id" | "week"> & { nation?: string },
  pendingEvent?: GameEvent | null,
  /** flags del jugador: traen los partidos estimados que no se viven como escena (off-screen-matches.ts). */
  flags?: Record<string, string | boolean> | null,
): Promise<{ season: CompetitionStats; career: CompetitionStats; history: SeasonHistoryRow[] }> {
  const season = emptyCompetitionStats();
  const career = emptyCompetitionStats();
  const bySeason = new Map<string, SeasonHistoryRow>();
  const currentSeasonIdx = Math.floor((player.week - 1) / WEEKS_PER_SEASON);

  try {
    const { data, error } = await supabase
      .from("career_events")
      .select("title, description, category, event_id, week")
      .eq("player_id", player.id)
      .neq("category", "segunda_vida")
      .lte("week", player.week);
    if (error || !data) return { season, career, history: [] };

    const rows: { event_id: string; category: string; title: string; description: string; week: number }[] = data.map((r) => ({
      event_id: (r.event_id as string) ?? "",
      category: (r.category as string) ?? "",
      title: (r.title as string) ?? "",
      description: (r.description as string) ?? "",
      week: (r.week as number) ?? 0,
    }));

    // El partido que estás leyendo ahora mismo (aún no está en
    // career_events) ya se cuenta, solo si trae marcador.
    if (pendingEvent && /marcador[^0-9]{0,20}\d{1,2}\s*-\s*\d{1,2}/i.test(`${pendingEvent.title} ${pendingEvent.description}`)) {
      rows.push({
        event_id: pendingEvent.id,
        category: pendingEvent.category,
        title: pendingEvent.title,
        description: pendingEvent.description,
        week: player.week,
      });
    }

    // Los partidos de la cadena de debut (antes de "rookie-debut-oficial") son del filial.
    const filialUntil = rows.find((r) => r.event_id === "rookie-debut-oficial")?.week ?? 0;
    for (const row of rows) {
      const u = extractStatsFromEvent({
        id: row.event_id,
        category: row.category as GameEvent["category"],
        title: row.title,
        description: row.description,
        options: [],
      } as GameEvent);
      if (!u.matches_played) continue;
      const idx = statSeasonOf(row.week, row.event_id);
      const { comp, torneo } = classifyMatch(row.title, row.description);
      const teamOf: SeasonHistoryRow["team"] = comp === "seleccion" ? "seleccion" : filialUntil > 0 && row.week <= filialUntil ? "filial" : "club";
      const hKey = `${idx}:${teamOf}`;
      const hist = bySeason.get(hKey) ?? newRow(idx, teamOf);
      hist.matches += 1;
      hist.goals += u.goals ?? 0;
      hist.assists += u.assists ?? 0;
      hist.minutes += u.minutes_played ?? 0;
      bySeason.set(hKey, hist);
      const targets = idx >= currentSeasonIdx ? [career, season] : [career];
      for (const t of targets) {
        add(t[comp], u);
        if (comp === "seleccion" && torneo) add(t.torneos[torneo], u);
      }
    }
  } catch (err) {
    console.error("[getCompetitionStats] threw:", err instanceof Error ? err.message : err);
  }

  // Partidos estimados (los que no se viven como escena): misma cuenta que la
  // cabecera de la tarjeta, así que todo suma lo mismo.
  for (const [idx, sim] of readAllSim(flags)) {
    const total = sumSim(sim);
    if (total.matches === 0) continue;
    for (const k of Object.keys(sim) as SimComp[]) {
      const c = sim[k];
      career[k].matches += c.matches;
      career[k].goals += c.goals;
      career[k].assists += c.assists;
      career[k].minutes += c.minutes;
      if (idx === currentSeasonIdx) {
        season[k].matches += c.matches;
        season[k].goals += c.goals;
        season[k].assists += c.assists;
        season[k].minutes += c.minutes;
      }
    }
    const hist = bySeason.get(`${idx}:club`) ?? newRow(idx, "club");
    hist.matches += total.matches;
    hist.goals += total.goals;
    hist.assists += total.assists;
    hist.minutes += total.minutes;
    bySeason.set(`${idx}:club`, hist);
  }

  // Palmarés real: los trofeos los decide el código (ver honours.ts), no el texto de las crónicas.
  const trofeos = allTrofeos({ flags: flags ?? {} });
  for (const tr of trofeos) {
    // Mundial, Eurocopa, Copa América y Juegos son de la selección; el resto, del club.
    const team: SeasonHistoryRow["team"] = ["mundial", "eurocopa", "copa_america", "olimpico"].includes(tr.k) ? "seleccion" : "club";
    const row = bySeason.get(`${tr.s}:${team}`) ?? newRow(tr.s, team);
    row.trophies.push(tr.k);
    if (!INDIVIDUAL.has(tr.k)) row.titles += 1;
    bySeason.set(`${tr.s}:${team}`, row);
  }
  // Club de cada temporada: el que quedó anotado al jugarla; las anteriores a ese registro, el primero conocido.
  const clubIdxs = [...bySeason.values()].filter((r) => r.team === "club").map((r) => r.idx);
  const knownClubs = clubIdxs.map((i) => String(flags?.[`club_s${i}`] ?? ""));
  const firstKnown = knownClubs.find(Boolean) || String(flags?.clubs_history ?? "").split("|").filter(Boolean)[0] || undefined;
  for (const row of bySeason.values()) {
    const c = String(flags?.[`club_s${row.idx}`] ?? "") || firstKnown;
    row.club = row.team === "seleccion" ? player.nation : row.team === "filial" ? (c ? `${c} B` : "Filial") : c;
  }
  const order = { filial: 0, club: 1, seleccion: 2 } as const;
  const history = [...bySeason.values()].sort((x, y) => x.idx - y.idx || order[x.team] - order[y.team]);
  return { season, career, history };
}
