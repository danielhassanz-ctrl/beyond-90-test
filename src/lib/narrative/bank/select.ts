/**
 * Selector del banco de escenas: ofrece SOLO lo que encaja con el estado real
 * del jugador y prioriza lo encadenado (una decisión anterior que ya toca
 * cobrar) sobre lo suelto. Ver types.ts.
 */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { playerAge } from "@/types/career";
import { computeRole } from "@/lib/narrative/role";
import { getClubLevel } from "@/lib/calendar/match-calendar";
import { hasMajorTournament } from "@/lib/calendar/season";
import { getMarketWindow } from "@/lib/narrative/market-window";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";
import { openThreads } from "@/lib/narrative/threads";
import { getRivals } from "@/lib/narrative/rivals";
import { NO_CLUB_YET } from "@/lib/constants";
import { BANK_SCENES } from "./scenes";
import { bankFlagKey, type BankScene, type BankWhen, type Range } from "./types";

type Flags = Record<string, string | boolean>;

const inRange = (value: number | undefined, r: Range | undefined): boolean =>
  !r || (value !== undefined && value >= r[0] && value <= r[1]);

/** Lo que decidiste en una escena del banco: { opción, semana } o null si no se ha vivido. */
export function readBankChoice(flags: Flags | null | undefined, sceneId: string): { option: string; week: number } | null {
  const raw = flags?.[bankFlagKey(sceneId)];
  if (typeof raw !== "string" || !raw) return null;
  const [option, week] = raw.split(":");
  return { option, week: parseInt(week, 10) || 0 };
}

function fits(player: Player, when: BankWhen): { ok: boolean; chained: boolean } {
  const flags = (player.flags ?? {}) as Flags;
  const age = playerAge(player.week);
  if (when.minWeek !== undefined && player.week < when.minWeek) return { ok: false, chained: false };
  if (when.maxWeek !== undefined && player.week > when.maxWeek) return { ok: false, chained: false };
  if (when.minAge !== undefined && age < when.minAge) return { ok: false, chained: false };
  if (when.maxAge !== undefined && age > when.maxAge) return { ok: false, chained: false };

  const injured = getInjuryRemaining(player.flags) > 0;
  if (Boolean(when.injured) !== injured) return { ok: false, chained: false };
  const onLoan = Boolean(flags.loan_active) && !flags.loan_returned;
  if (Boolean(when.loan) !== onLoan) return { ok: false, chained: false };

  if (when.roles && !when.roles.includes(computeRole(player).role as never)) return { ok: false, chained: false };
  if (when.clubLevels && !when.clubLevels.includes(getClubLevel(player.club))) return { ok: false, chained: false };
  if (when.positions && !when.positions.some((p) => (player.position ?? "").toLowerCase().includes(p.toLowerCase()))) return { ok: false, chained: false };
  if (!inRange(player.media, when.media) || !inRange(player.fama, when.fama) || !inRange(player.moral, when.moral)) return { ok: false, chained: false };
  if (!inRange(player.forma, when.forma) || !inRange(player.patrimonio, when.patrimonio)) return { ok: false, chained: false };
  if (when.rel) {
    const rel: Record<string, number> = {
      entrenador: player.rel_entrenador,
      vestuario: player.rel_vestuario,
      aficion: player.rel_aficion,
      representante: player.rel_representante,
    };
    for (const [k, r] of Object.entries(when.rel)) if (!inRange(rel[k], r as Range)) return { ok: false, chained: false };
  }
  for (const f of when.flags ?? []) if (!flags[f]) return { ok: false, chained: false };
  for (const f of when.notFlags ?? []) if (flags[f]) return { ok: false, chained: false };
  if (when.hasThread && !openThreads(player.flags).some((t) => t.k === when.hasThread)) return { ok: false, chained: false };

  if (when.turn || when.clubTurns) {
    const t = ((player.week - 1) % 10) + 1;
    if (!inRange(t, when.turn)) return { ok: false, chained: false };
    const since = parseInt(String(flags.club_since ?? "0"), 10) || 10;
    if (!inRange(player.week - since, when.clubTurns)) return { ok: false, chained: false };
  }
  if (when.market) {
    const w = getMarketWindow(player.week);
    if (!w || (when.market !== "abierta" && when.market !== w)) return { ok: false, chained: false };
  }
  const season = Math.floor((player.week - 1) / 10);
  const turn = ((player.week - 1) % 10) + 1;
  if (when.olimpicos) {
    const startYear = 2026 + season;
    if (when.olimpicos === "ano") {
      if (startYear % 4 !== 0 || flags[`torneo_started_${season}`]) return { ok: false, chained: false };
    } else if ((startYear + 1) % 4 !== 0) {
      return { ok: false, chained: false };
    }
  }
  if (when.torneo) {
    const types = when.torneo.type === "any" ? ["mundial", "eurocopa", "copa_america"] : [when.torneo.type];
    const hit = types.some((t) => {
      const v = flags[`torneo_result_${t}_${season}`];
      return typeof v === "string" && v !== "" && (!when.torneo!.outcomes || (when.torneo!.outcomes as string[]).includes(v));
    });
    if (!hit) return { ok: false, chained: false };
  }
  if (when.torneoProx) {
    if (turn < 7) return { ok: false, chained: false };
    const next = hasMajorTournament(season + 1, age, player.nation ?? "");
    if (!next.has || (when.torneoProx !== "any" && next.type !== when.torneoProx)) return { ok: false, chained: false };
  }

  let chained = false;
  for (const a of when.after ?? []) {
    const choice = readBankChoice(flags, a.scene);
    if (!choice) return { ok: false, chained: false };
    if (a.option && choice.option !== a.option) return { ok: false, chained: false };
    const gap = player.week - choice.week;
    if (gap < (a.minGap ?? 2)) return { ok: false, chained: false };
    if (a.maxGap !== undefined && gap > a.maxGap) return { ok: false, chained: false };
    chained = true;
  }
  return { ok: true, chained };
}

function specificity(when: BankWhen): number {
  return Object.values(when).filter((v) => v !== undefined && !(Array.isArray(v) && v.length === 0)).length;
}

const FEMININE_CLUBS = new Set(["Real Sociedad", "Atalanta", "Juventus", "AS Roma"]);
export function clubWithArticle(club: string): string {
  if (club === "Las Palmas") return "Las Palmas";
  if (club === "AS Roma") return "la Roma";
  return FEMININE_CLUBS.has(club) ? `la ${club}` : `el ${club}`;
}

/** Sustituye los marcadores {club}, {el_club} y {apellido} en todos los textos de la escena. */
export function fillBankEvent<T extends Omit<GameEvent, "id">>(event: T, player: Player): T {
  const club = player.club && player.club !== NO_CLUB_YET ? player.club : "tu club";
  const f = (player.flags ?? {}) as Flags;
  const interes = typeof f.transfer_interest === "string" && f.transfer_interest ? f.transfer_interest : "un club importante";
  const history = String(f.clubs_history ?? "").split("|").filter(Boolean);
  const exClub = history.length > 0 ? history[history.length - 1] : "tu antiguo club";
  const withArt = (c: string, fallback: string) => (c === fallback ? c : clubWithArticle(c));
  const rivals = getRivals(player);
  const fillRivals = (s: string) => {
    if (!s.includes("{peer") && !s.includes("{mega")) return s;
    let out = s;
    for (const r of rivals) {
      out = out.split(`{${r.key}_club}`).join(r.club).split(`{${r.key}_pos}`).join(r.position.toLowerCase()).split(`{${r.key}}`).join(r.name);
    }
    return out;
  };
  const fill = (t: string) =>
    fillRivals(t)
      .replace(/\{el_club\}/g, club === "tu club" ? "tu club" : clubWithArticle(club))
      .replace(/\{club\}/g, club)
      .replace(/\{el_interes\}/g, withArt(interes, "un club importante"))
      .replace(/\{interes\}/g, interes)
      .replace(/\{el_ex_club\}/g, withArt(exClub, "tu antiguo club"))
      .replace(/\{ex_club\}/g, exClub)
      .replace(/\{pareja\}/g, typeof f.pareja === "string" && f.pareja ? f.pareja : "tu pareja")
      .replace(/\{nacion\}/g, player.nation ?? "tu país")
      .replace(/\{apellido\}/g, player.last_name ?? "");
  const text = (t: string | undefined) => (t === undefined ? t : fill(t));
  return {
    ...event,
    title: fill(event.title),
    description: fill(event.description),
    freeTextPrompt: text(event.freeTextPrompt),
    options: event.options.map((o) => ({
      ...o,
      label: fill(o.label),
      subtitle: fill(o.subtitle),
      outcomeText: text(o.outcomeText),
      resolve: o.resolve
        ? { ...o.resolve, success: { ...o.resolve.success, text: fill(o.resolve.success.text) }, fail: { ...o.resolve.fail, text: fill(o.resolve.fail.text) } }
        : undefined,
      thread: o.thread ? { ...o.thread, who: fill(o.thread.who), text: fill(o.thread.text) } : undefined,
    })),
  } as T;
}

export interface BankCandidate {
  scene: BankScene;
  chained: boolean;
  weight: number;
}

/** Escenas del banco que encajan ahora con el estado del jugador y no se han vivido. */
export function eligibleBankScenes(player: Player, usedIds: string[], scenes: BankScene[] = BANK_SCENES): BankCandidate[] {
  const used = new Set(usedIds);
  const out: BankCandidate[] = [];
  for (const scene of scenes) {
    if (used.has(scene.id)) continue;
    const { ok, chained } = fits(player, scene.when);
    if (!ok) continue;
    // Una escena sin ninguna condición de contexto no es del banco "personal": sale con peso bajo.
    const weight = (scene.weight ?? 1) * (1 + 0.15 * specificity(scene.when)) * (chained ? 5 : 1);
    out.push({ scene, chained, weight });
  }
  return out;
}

/**
 * Elige una escena del banco para este turno, o null (se sigue con el resto
 * del motor). Lo encadenado que ya toca cobrar sale casi siempre; lo suelto,
 * con menos frecuencia, nunca dos temas seguidos y con una pausa mínima entre
 * escenas del banco.
 */
export function pickBankScene(player: Player, usedIds: string[], scenes: BankScene[] = BANK_SCENES): GameEvent | null {
  if (player.club === NO_CLUB_YET) return null;
  const flags = (player.flags ??= {}) as Flags;
  const lastWeek = parseInt(String(flags.bank_last_week ?? "0"), 10) || 0;
  const lastFamily = String(flags.bank_last_family ?? "");
  // Registro de familias recientes ("familia:semana,..."): un mismo tema no vuelve en menos de 6 turnos salvo encadenado.
  const famLog = String(flags.bank_fam_log ?? "").split(",").filter(Boolean).map((e) => {
    const [fam, wk] = e.split(":");
    return { fam, wk: parseInt(wk, 10) || 0 };
  });
  const recentFams = new Set(famLog.filter((e) => player.week - e.wk < 6).map((e) => e.fam));

  let pool = eligibleBankScenes(player, usedIds, scenes);
  if (pool.length === 0) return null;
  const anyChained = pool.some((c) => c.chained);
  // No encadenar dos escenas sueltas seguidas del mismo tema.
  const noSameFamily = pool.filter((c) => c.chained || (c.scene.family !== lastFamily && !recentFams.has(c.scene.family)));
  if (noSameFamily.length > 0) pool = noSameFamily;
  else if (!anyChained) return null;
  if (!anyChained && lastWeek > 0 && player.week - lastWeek < 2) return null;
  if (Math.random() >= (anyChained ? 0.85 : 0.5)) return null;

  // Los encadenados que ya tocan compiten solo entre sí.
  const chainedPool = pool.filter((c) => c.chained);
  const finalPool = chainedPool.length > 0 ? chainedPool : pool;
  const total = finalPool.reduce((n, c) => n + c.weight, 0);
  let r = Math.random() * total;
  let chosen = finalPool[finalPool.length - 1];
  for (const c of finalPool) {
    r -= c.weight;
    if (r <= 0) {
      chosen = c;
      break;
    }
  }
  flags.bank_last_week = String(player.week);
  flags.bank_last_family = chosen.scene.family;
  flags.bank_fam_log = [...famLog.filter((e) => player.week - e.wk < 12), { fam: chosen.scene.family, wk: player.week }].map((e) => `${e.fam}:${e.wk}`).join(",");
  return { ...fillBankEvent(chosen.scene.event, player), id: chosen.scene.id } as GameEvent;
}
