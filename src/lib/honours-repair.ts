/**
 * Reparación única del palmarés para partidas anteriores a la lista de trofeos:
 * un título ganado entonces pudo no dejar rastro. Se recuperan (1) las banderas
 * antiguas de Liga/Champions/Balón de Oro y (2) las finales de Champions/Europa/Copa
 * ganadas. Una final se reconoce juntando dos filas de la MISMA semana: la jugada
 * decisiva, que trae la ronda ("Champions League - Final"), y la crónica, que trae
 * el resultado ("tu equipo gana a…"): la crónica sola no dice que era una final.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import { WEEKS_PER_SEASON } from "@/types/career";
import { allTrofeos, INDIVIDUAL, withTrofeo, writeTrofeos, type Trofeo, type TrofeoKind } from "@/lib/honours";

interface Row {
  event_id: string;
  title: string;
  description: string;
  week: number;
}

const FINAL_RE = /(champions league|europa league|copa del rey)[^.\n]{0,40}\bfinal\b|\bfinal (continental|de la champions|de copa)/;
const WIN_RE = /te proclamas|levantas|campe[oó]n(?:es)? de|tu equipo gana|gana (?:a|en|por)|victoria (?:por|ante|sobre)|ganáis|ganasteis/;
const LOSS_RE = /pierde|derrota|subcampe|cae (?:ante|en)|eliminad/;

export async function repairTrophies(supabase: SupabaseClient, player: Player): Promise<boolean> {
  if (player.flags?.fix_trofeos_v3) return false;
  let list: Trofeo[] = allTrofeos(player);
  let changed = false;
  try {
    const { data } = await supabase
      .from("career_events")
      .select("event_id, title, description, week")
      .eq("player_id", player.id)
      .lte("week", player.week);
    const rows = ((data ?? []) as Row[]).map((r) => ({ ...r, text: `${r.title} ${r.description}`.toLowerCase() }));
    const byWeek = new Map<number, typeof rows>();
    for (const r of rows) byWeek.set(r.week, [...(byWeek.get(r.week) ?? []), r]);

    // Trofeos recuperados de banderas antiguas (sin club): se colocan en la temporada en que se vivió
    // el evento que los dio; si no se encuentra, en la temporada actual (no en la primera).
    const legacyEvents: Partial<Record<TrofeoKind, string>> = { liga: "fork-titulo-liga", champions: "fork-champions", balon_oro: "premio-balon-oro" };
    // Al arrancar una temporada (turnos 1-2, p. ej. el verano del Mundial) lo último que se jugó es la anterior.
    const seasonNow = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
    const currentSeason = ((player.week - 1) % WEEKS_PER_SEASON) + 1 <= 2 ? Math.max(0, seasonNow - 1) : seasonNow;
    const relocated: Trofeo[] = [];
    for (const tr of list) {
      if (tr.c !== "") {
        relocated.push(tr);
        continue;
      }
      const evId = legacyEvents[tr.k];
      const evWeek = evId ? rows.find((r) => r.event_id === evId)?.week : undefined;
      const s = evWeek ? Math.floor((evWeek - 1) / WEEKS_PER_SEASON) : currentSeason;
      const next = withTrofeo(relocated, { s, k: tr.k, c: INDIVIDUAL.has(tr.k) ? "" : player.club });
      if (next) relocated.splice(0, relocated.length, ...next);
      changed = true;
    }
    list = relocated;

    for (const [week, group] of byWeek) {
      const finalRow = group.find((r) => FINAL_RE.test(r.text));
      if (!finalRow) continue;
      const kind: TrofeoKind | null = /champions league/.test(finalRow.text)
        ? "champions"
        : /europa league/.test(finalRow.text)
          ? "europa"
          : /copa del rey/.test(finalRow.text)
            ? "copa"
            : null;
      if (!kind) continue;
      // La crónica (ya resuelta) de esa misma semana y competición.
      const chronicle = group.find((r) => !r.event_id.startsWith("match-decision") && /marcador/.test(r.text) && WIN_RE.test(r.text) && !LOSS_RE.test(r.text));
      if (!chronicle) continue;
      const next = withTrofeo(list, { s: Math.floor((week - 1) / WEEKS_PER_SEASON), k: kind, c: player.club });
      if (next) {
        list = next;
        changed = true;
      }
    }
  } catch (err) {
    console.error("[repairTrophies] falló:", err instanceof Error ? err.message : err);
  }
  const flags = { ...(player.flags ?? {}), fix_trofeos_v3: "1", ...(list.length > 0 ? { trofeos: writeTrofeos(list) } : {}) };
  const titles = list.filter((t) => !INDIVIDUAL.has(t.k)).length;
  const patch: Record<string, unknown> = { flags };
  if (titles > (player.stats_titles ?? 0)) patch.stats_titles = titles;
  const { error } = await supabase.from("players").update(patch).eq("id", player.id);
  if (error) return false;
  player.flags = flags;
  if (patch.stats_titles !== undefined) player.stats_titles = titles;
  return changed;
}
