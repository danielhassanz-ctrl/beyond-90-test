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
import { readAllSim, sumSim, emptySim, type SimComp, type ClubSplit, readClubSplits, readSimSeason } from "@/lib/narrative/off-screen-matches";
import { allTrofeos, INDIVIDUAL, trofeoLabel, type TrofeoKind } from "@/lib/honours";
import { clubAtSeasonEnd, type ClubChange } from "@/lib/player/club-timeline";

import { fetchAllRows } from "@/lib/supabase/fetchAll";
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
  /** Qué es cada trofeo (misma posición que `trophies`): «Champions League · Real Madrid · 2029/30». */
  trophyLabels: string[];
  /** Fila de un club que dejaste a mitad de esa temporada (la temporada se reparte en una fila por club). */
  fixedClub?: string;
  /** Orden dentro de la temporada: los clubes que dejaste (0, 1…) van antes que el actual. */
  seg?: number;
  label: string;
  matches: number;
  goals: number;
  assists: number;
  minutes: number;
  titles: number;
}

function newRow(idx: number, team: SeasonHistoryRow["team"] = "club"): SeasonHistoryRow {
  return { idx, team, trophies: [], trophyLabels: [], label: seasonLabel(idx * WEEKS_PER_SEASON + 1), matches: 0, goals: 0, assists: 0, minutes: 0, titles: 0 };
}

/** Lo jugado esta temporada con un club que ya dejaste (tras un fichaje a mitad de temporada). */
export interface PreviousClubStats {
  club: string;
  stats: CompetitionStats;
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
  const framed = text.match(/\ben (la liga|la premier league|premier league|la bundesliga|bundesliga|la serie a|serie a|la ligue 1|ligue 1|saudi pro league|copa del rey|copa de inglaterra|copa de alemania|copa de italia|copa de francia|copa de arabia|dfb-pokal|fa cup|champions league|europa league|partido internacional|el mundial|la eurocopa|la copa am[eé]rica)/);
  const key = framed ? framed[1] : text;

  // Un partido de clasificatoria (o Nations League, amistoso) NO es del torneo, aunque el texto nombre la Eurocopa o el Mundial.
  const torneo = (): TournamentKey =>
    /clasificatori|nations league|amistos|eliminatori/.test(text) ? "otros" : /mundial/.test(text) ? "mundial" : /eurocopa/.test(text) ? "eurocopa" : /copa am[eé]rica/.test(text) ? "copa_america" : "otros";

  if (/champions league|liga de campeones de asia/.test(key)) return { comp: "champions" };
  if (/europa league/.test(key)) return { comp: "europa" };
  if (/copa del rey|copa de inglaterra|copa de alemania|copa de italia|copa de francia|copa de arabia|dfb-pokal|fa cup/.test(key)) return { comp: "copa" };
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
  /** Hasta qué semana se leen las escenas (por defecto, la actual): al enseñar la temporada anterior con el verano ya empezado. */
  untilWeek?: number,
): Promise<{ season: CompetitionStats; career: CompetitionStats; history: SeasonHistoryRow[]; previous: PreviousClubStats[]; splitToPersist: ClubSplit | null }> {
  const season = emptyCompetitionStats();
  const career = emptyCompetitionStats();
  const bySeason = new Map<string, SeasonHistoryRow>();
  const currentSeasonIdx = Math.floor((player.week - 1) / WEEKS_PER_SEASON);

  // Si fichaste por otro club esta misma temporada, lo jugado antes del cambio es del club anterior (otra liga, otra
  // clasificación): se cuenta aparte en vez de presentarse como partidos del club nuevo.
  let splits = readClubSplits(flags).filter((x) => x.s === currentSeasonIdx).sort((a, b) => a.w - b.w);
  let splitToPersist: ClubSplit | null = null;
  if (splits.length === 0) {
    // Cambio de club hecho antes de que existiera el registro de cortes: se reparte lo ESTIMADO de la temporada en
    // proporción a las semanas jugadas con cada club y la página guarda ese reparto una sola vez (splitToPersist),
    // para que no cambie cada vez que se vuelve a mirar. Los cambios nuevos ya guardan su corte exacto (actions.ts).
    const f = flags ?? {};
    const since = parseInt(String(f.club_since ?? "0"), 10) || 0;
    const left = String(f.clubs_history ?? "").split("|").filter(Boolean).pop();
    const seasonStart = currentSeasonIdx * WEEKS_PER_SEASON + 1;
    if (left && since > seasonStart && Math.floor((since - 1) / WEEKS_PER_SEASON) === currentSeasonIdx && player.week >= since) {
      const total = readSimSeason(f, currentSeasonIdx);
      const ratio = Math.min(1, (since - seasonStart) / Math.max(1, player.week - seasonStart));
      const snap = emptySim();
      for (const k of Object.keys(snap) as SimComp[]) {
        snap[k] = {
          matches: Math.round(total[k].matches * ratio),
          goals: Math.round(total[k].goals * ratio),
          assists: Math.round(total[k].assists * ratio),
          minutes: Math.round(total[k].minutes * ratio),
        };
      }
      splitToPersist = { s: currentSeasonIdx, club: left, w: since, sim: snap };
      splits = [splitToPersist];
    }
  }
  const segments = splits.map((sp) => ({ sp, stats: emptyCompetitionStats() }));
  /** Los fichajes de la carrera (cada uno deja `club` en sus consecuencias): sirven para saber en qué club estabas cada año. */
  const clubChanges: ClubChange[] = [];
  /** Dónde cuenta un partido de esta temporada según la semana: el club anterior (si fue antes del cambio) o el actual. */
  const seasonTargetFor = (week: number): CompetitionStats => segments.find((g) => week < g.sp.w)?.stats ?? season;

  try {
    const { data, error } = await fetchAllRows<{ title: string; description: string; category: string; event_id: string; week: number; consequences: Record<string, unknown> | null }>((from, to) =>
      supabase
        .from("career_events")
        .select("title, description, category, event_id, week, consequences")
        .eq("player_id", player.id)
        .neq("category", "segunda_vida")
        .lte("week", Math.max(player.week, untilWeek ?? 0))
        .order("id")
        .range(from, to),
    );
    if (error || !data) return { season, career, history: [], previous: [], splitToPersist: null };

    for (const r of data) {
      const c = r.consequences;
      if (c && typeof c.club === "string" && c.club) clubChanges.push({ week: (r.week as number) ?? 0, club: c.club });
    }
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
      let hKey = `${idx}:${teamOf}`;
      // Una temporada en la que cambiaste de club se reparte en una fila por club: lo jugado antes del corte es del anterior.
      const gi = idx === currentSeasonIdx && teamOf === "club" ? segments.findIndex((g) => row.week < g.sp.w) : -1;
      if (gi >= 0) hKey = `${idx}:club@${segments[gi].sp.club}`;
      const hist = bySeason.get(hKey) ?? newRow(idx, teamOf);
      if (gi >= 0) {
        hist.fixedClub = segments[gi].sp.club;
        hist.seg = gi;
      }
      hist.matches += 1;
      hist.goals += u.goals ?? 0;
      hist.assists += u.assists ?? 0;
      hist.minutes += u.minutes_played ?? 0;
      bySeason.set(hKey, hist);
      const targets = idx >= currentSeasonIdx ? [career, seasonTargetFor(row.week)] : [career];
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
    const segSum = segments.map(() => ({ matches: 0, goals: 0, assists: 0, minutes: 0 }));
    const restSum = { matches: 0, goals: 0, assists: 0, minutes: 0 };
    for (const k of Object.keys(sim) as SimComp[]) {
      const c = sim[k];
      career[k].matches += c.matches;
      career[k].goals += c.goals;
      career[k].assists += c.assists;
      career[k].minutes += c.minutes;
      if (idx === currentSeasonIdx) {
        // El corte guardado dice cuánto llevabas al irte de cada club: lo anterior es de ese club, el resto del actual.
        let rest = { ...c };
        segments.forEach((g, i) => {
          const before = i > 0 ? segments[i - 1].sp.sim[k] : { matches: 0, goals: 0, assists: 0, minutes: 0 };
          const part = {
            matches: Math.max(0, g.sp.sim[k].matches - before.matches),
            goals: Math.max(0, g.sp.sim[k].goals - before.goals),
            assists: Math.max(0, g.sp.sim[k].assists - before.assists),
            minutes: Math.max(0, g.sp.sim[k].minutes - before.minutes),
          };
          g.stats[k].matches += part.matches;
          g.stats[k].goals += part.goals;
          g.stats[k].assists += part.assists;
          g.stats[k].minutes += part.minutes;
          segSum[i].matches += part.matches;
          segSum[i].goals += part.goals;
          segSum[i].assists += part.assists;
          segSum[i].minutes += part.minutes;
          if (i === segments.length - 1) {
            rest = {
              matches: Math.max(0, c.matches - g.sp.sim[k].matches),
              goals: Math.max(0, c.goals - g.sp.sim[k].goals),
              assists: Math.max(0, c.assists - g.sp.sim[k].assists),
              minutes: Math.max(0, c.minutes - g.sp.sim[k].minutes),
            };
          }
        });
        season[k].matches += rest.matches;
        season[k].goals += rest.goals;
        season[k].assists += rest.assists;
        season[k].minutes += rest.minutes;
        restSum.matches += rest.matches;
        restSum.goals += rest.goals;
        restSum.assists += rest.assists;
        restSum.minutes += rest.minutes;
      }
    }
    const addTo = (key: string, v: { matches: number; goals: number; assists: number; minutes: number }, fixed?: string, seg?: number) => {
      if (fixed && v.matches === 0) return;
      const h = bySeason.get(key) ?? newRow(idx, "club");
      h.matches += v.matches;
      h.goals += v.goals;
      h.assists += v.assists;
      h.minutes += v.minutes;
      if (fixed) {
        h.fixedClub = fixed;
        h.seg = seg;
      }
      bySeason.set(key, h);
    };
    if (idx === currentSeasonIdx && segments.length > 0) {
      segments.forEach((g, i) => addTo(`${idx}:club@${g.sp.club}`, segSum[i], g.sp.club, i));
      addTo(`${idx}:club`, restSum);
    } else {
      addTo(`${idx}:club`, total);
    }
  }

  // Palmarés real: los trofeos los decide el código (ver honours.ts), no el texto de las crónicas.
  const trofeos = allTrofeos({ flags: flags ?? {} });
  for (const tr of trofeos) {
    // Mundial, Eurocopa, Copa América y Juegos son de la selección; el resto, del club.
    const team: SeasonHistoryRow["team"] = ["mundial", "eurocopa", "copa_america", "olimpico"].includes(tr.k) ? "seleccion" : "club";
    const row = bySeason.get(`${tr.s}:${team}`) ?? newRow(tr.s, team);
    row.trophies.push(tr.k);
    row.trophyLabels.push(trofeoLabel(tr));
    if (!INDIVIDUAL.has(tr.k)) row.titles += 1;
    bySeason.set(`${tr.s}:${team}`, row);
  }
  // Club de cada temporada: el que quedó anotado al jugarla; las anteriores a ese registro, el primero conocido.
  // Orden de fiabilidad: lo anotado turno a turno, el club del trofeo de equipo de esa temporada, y por último los
  // fichajes del historial (antes se asignaba a todas las temporadas sin registro el primer club que constaba).
  const trophyClub = new Map<number, string>();
  for (const tr of trofeos) if (!INDIVIDUAL.has(tr.k) && tr.c && !["mundial", "eurocopa", "copa_america", "olimpico"].includes(tr.k)) trophyClub.set(tr.s, tr.c);
  const lastHistoryClub = String(flags?.clubs_history ?? "").split("|").filter(Boolean).pop() ?? "";
  const firstKnown = clubAtSeasonEnd(flags, -1, clubChanges, lastHistoryClub) || undefined;
  for (const row of bySeason.values()) {
    const c = clubAtSeasonEnd(flags, row.idx, clubChanges, lastHistoryClub, trophyClub.get(row.idx)) || firstKnown;
    row.club = row.fixedClub ?? (row.team === "seleccion" ? player.nation : row.team === "filial" ? (c ? `${c} B` : "Filial") : c);
  }
  const order = { filial: 0, club: 1, seleccion: 2 } as const;
  const history = [...bySeason.values()].sort((x, y) => x.idx - y.idx || order[x.team] - order[y.team] || (x.seg ?? 99) - (y.seg ?? 99));
  const previous: PreviousClubStats[] = segments
    .map((g) => ({ club: g.sp.club, stats: g.stats }))
    .filter((p) => p.stats.liga.matches + p.stats.champions.matches + p.stats.europa.matches + p.stats.copa.matches > 0);
  return { season, career, history, previous, splitToPersist };
}
