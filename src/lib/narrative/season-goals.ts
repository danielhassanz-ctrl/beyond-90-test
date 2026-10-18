/**
 * OBJETIVOS DE TEMPORADA. Al empezar cada temporada el míster y el director deportivo te fijan tres metas según tu rol, tu nivel y
 * tu club (partidos, goles o porterías a cero, puesto en la Liga y, en un grande, algún título). Puedes aceptarlas, pedir unas más
 * ambiciosas a cambio de una prima o intentar que las rebajen. Durante el año ves el progreso en Vida, y al cerrar la temporada
 * llega el balance: cumplir sube la confianza del míster, el ánimo y (con prima) el dinero; fallar lo contrario. Todo en código.
 */
import type { GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { computeRole } from "@/lib/narrative/role";
import { getClubLevel } from "@/lib/calendar/match-calendar";
import { leagueOf } from "@/lib/calendar/leagues";
import { readTrofeos } from "@/lib/honours";
import { playerMonthlyNet } from "@/lib/narrative/transfer-terms";
import { seasonStats } from "@/lib/narrative/season-awards";
import { getNpcName } from "@/lib/narrative/npcs";

export type GoalKind = "partidos" | "goles" | "porterias" | "liga" | "titulo";

export interface SeasonGoal {
  kind: GoalKind;
  /** Meta numérica (partidos, goles, porterías a cero) o puesto máximo en la Liga. */
  target: number;
  label: string;
}

export interface SeasonGoalsPlan {
  season: number;
  /** "normal" | "ambicioso" (con prima) | "rebajado". */
  mode: "normal" | "ambicioso" | "rebajado";
  goals: SeasonGoal[];
}

export const goalsEventId = (season: number) => `objetivos-${season}`;
export const goalsReviewId = (season: number) => `objetivos-balance-${season}`;

const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function readGoalsPlan(player: Pick<Player, "flags">, season: number): SeasonGoalsPlan | null {
  const raw = player.flags?.[`go_${season}`];
  if (typeof raw !== "string" || !raw) return null;
  try {
    return JSON.parse(raw) as SeasonGoalsPlan;
  } catch {
    return null;
  }
}

const isKeeper = (p: Pick<Player, "position">) => (p.position ?? "").toLowerCase().includes("portero");

/** Las metas base de este jugador esta temporada, antes de pactar nada. */
export function baseGoals(player: Player): SeasonGoal[] {
  const role = computeRole(player).role;
  const level = getClubLevel(player.club);
  const pos = (player.position ?? "").toLowerCase();
  const media = player.media ?? 60;
  const matches = role === "titular" ? 11 : role === "rotacion" ? 7 : role === "suplente" ? 4 : 3;
  const goals: SeasonGoal[] = [{ kind: "partidos", target: matches, label: `Jugar al menos ${matches} partidos importantes` }];

  if (isKeeper(player)) {
    const t = Math.max(2, Math.round(matches * 0.4));
    goals.push({ kind: "porterias", target: t, label: `Dejar la portería a cero en ${t} partidos` });
  } else {
    const rate = pos.includes("delantero") || pos.includes("extremo") ? 0.55 : pos.includes("defensa") || pos.includes("lateral") || pos.includes("central") ? 0.07 : 0.2;
    const t = Math.max(1, Math.round(matches * rate * clamp(media / 80, 0.7, 1.25) * (rate < 0.1 ? 1.5 : 1)));
    goals.push({ kind: "goles", target: t, label: `Marcar ${t} ${t === 1 ? "gol" : "goles"}` });
  }

  const teams = leagueOf(player.club).teams.length || 20;
  const rank = level === "grande" ? 2 : level === "europeo" ? 6 : Math.max(12, Math.round(teams * 0.7));
  goals.push({ kind: "liga", target: rank, label: level === "grande" ? "Terminar entre los dos primeros de la Liga" : level === "europeo" ? "Meter al equipo entre los seis primeros" : `Terminar el equipo entre los ${rank} primeros` });
  if (level === "grande") goals.push({ kind: "titulo", target: 1, label: "Ganar al menos un título (Liga, Copa o Champions)" });
  return goals;
}

/** Aplica el pacto: más ambiciosas (×1,3) o rebajadas (×0,75). */
export function adjustGoals(goals: SeasonGoal[], mode: SeasonGoalsPlan["mode"]): SeasonGoal[] {
  if (mode === "normal") return goals;
  const k = mode === "ambicioso" ? 1.3 : 0.75;
  return goals.map((g) => {
    if (g.kind === "partidos") {
      const t = Math.max(2, Math.round(g.target * (mode === "ambicioso" ? 1.2 : 0.8)));
      return { ...g, target: t, label: `Jugar al menos ${t} partidos importantes` };
    }
    if (g.kind === "goles") {
      const t = Math.max(1, Math.round(g.target * k + (mode === "ambicioso" ? 0.4 : 0)));
      return { ...g, target: t, label: `Marcar ${t} ${t === 1 ? "gol" : "goles"}` };
    }
    if (g.kind === "porterias") {
      const t = Math.max(1, Math.round(g.target * k));
      return { ...g, target: t, label: `Dejar la portería a cero en ${t} partidos` };
    }
    if (g.kind === "liga") {
      const t = mode === "ambicioso" ? Math.max(1, g.target - (g.target <= 2 ? 1 : 2)) : g.target + 2;
      return { ...g, target: t, label: t === 1 ? "Ganar la Liga" : `${g.label.replace(/\d+|dos|seis/, String(t))}` };
    }
    return g;
  });
}

export interface GoalProgress {
  goal: SeasonGoal;
  value: number;
  done: boolean;
  /** Texto del avance («7 de 11 partidos», «puesto 3 (meta: 2)»…). */
  text: string;
}

/** Cómo va cada meta de esa temporada con las estadísticas actuales (o las finales si ya se cerró). */
export function goalsProgress(player: Player, season: number, plan: SeasonGoalsPlan, final = false): GoalProgress[] {
  const st = seasonStats(player, season);
  const titles = readTrofeos(player.flags).filter((t) => t.s === season && ["liga", "copa", "champions", "europa"].includes(t.k)).length;
  const pos = String(player.flags?.[`liga_pos_${season}`] ?? "");
  const rank = pos ? parseInt(pos.split("|")[0], 10) : null;
  return plan.goals.map((g) => {
    switch (g.kind) {
      case "partidos":
        return { goal: g, value: st.matches, done: st.matches >= g.target, text: `${st.matches} de ${g.target} partidos` };
      case "goles":
        return { goal: g, value: st.goals, done: st.goals >= g.target, text: `${st.goals} de ${g.target} goles` };
      case "porterias":
        return { goal: g, value: st.cleanSheets, done: st.cleanSheets >= g.target, text: `${st.cleanSheets} de ${g.target} porterías a cero` };
      case "titulo":
        return { goal: g, value: titles, done: titles >= 1, text: titles >= 1 ? `${titles} ${titles === 1 ? "título" : "títulos"}` : "ningún título todavía" };
      default:
        return rank
          ? { goal: g, value: rank, done: rank <= g.target, text: `puesto ${rank} (meta: ${g.target})` }
          : { goal: g, value: 0, done: false, text: final ? "sin clasificación definitiva" : "se decide al acabar la temporada" };
    }
  });
}

/* ───────────── Escena 1: se fijan los objetivos ───────────── */

export function shouldTriggerSeasonGoals(player: Player, usedEventIds: readonly string[]): boolean {
  if (player.club === NO_CLUB_YET || player.status !== "active" || player.club.startsWith("SELECCIÓN:")) return false;
  const season = Math.floor((player.week - 1) / 10);
  const turn = ((player.week - 1) % 10) + 1;
  if (season < 1 || turn > 5 || turn < 2 || playerAge(player.week) < 17) return false;
  if (usedEventIds.includes(goalsEventId(season)) || player.flags?.[`go_${season}`]) return false;
  // Después del resumen de la temporada anterior (y de sus premios, si los hubo).
  if (!usedEventIds.includes(`preseason-${season}`)) return false;
  return true;
}

export function buildSeasonGoalsEvent(player: Player): GameEvent {
  const season = Math.floor((player.week - 1) / 10);
  const coach = getNpcName(player, "entrenador");
  const goals = baseGoals(player);
  const ambitious = adjustGoals(goals, "ambicioso");
  const easy = adjustGoals(goals, "rebajado");
  const monthly = playerMonthlyNet(player);
  const bonus = Math.max(500, Math.round((monthly * 1.5) / 100) * 100);
  const plan = (mode: SeasonGoalsPlan["mode"], g: SeasonGoal[]): string => JSON.stringify({ season, mode, goals: g } satisfies SeasonGoalsPlan);
  const list = (g: SeasonGoal[]) => g.map((x) => `· ${x.label}`).join("\n");
  const year = `${2026 + season}/${String(2027 + season).slice(2)}`;
  const mark = { [`go_set_${season}`]: true };
  return {
    id: goalsEventId(season),
    category: "especial",
    title: `Objetivos de la temporada ${year}`,
    description: `${coach} y el director deportivo te citan en el despacho antes de que empiece lo serio. Sobre la mesa, una hoja con las metas del año para ti:\n${list(goals)}\n«No es un examen, es una conversación», dice el míster, aunque la hoja tiene pinta de examen. Puedes aceptarlas tal cual, pedir unas más exigentes a cambio de una prima o intentar que las rebajen.`,
    options: [
      {
        id: "a",
        label: "Aceptar los objetivos tal cual",
        subtitle: "Lo normal, sin riesgos añadidos",
        consequences: { moral: 1, rel_entrenador: 1, flags: { ...mark, [`go_${season}`]: plan("normal", goals) } },
        outcomeText: `Firmas la hoja sin discutir. ${coach} asiente: «Con eso, estaremos tranquilos». La fotocopia que te dan acaba pegada a la puerta de tu taquilla.`,
      },
      {
        id: "b",
        label: `Pedir metas más exigentes a cambio de una prima (${bonus.toLocaleString("es")} €)`,
        subtitle: "Más riesgo, más recompensa",
        consequences: { moral: 2, rel_entrenador: 2, flags: { ...mark, [`go_${season}`]: plan("ambicioso", ambitious), [`go_bonus_${season}`]: String(bonus) } },
        outcomeText: `Lo propones tú, y el director deportivo levanta una ceja respetuosa. Redactan una versión más dura de la hoja:\n${list(ambitious)}\nSi la cumples, el club te paga ${bonus.toLocaleString("es")} € de prima. ${coach} sonríe de medio lado: «Así me gusta».`,
      },
      {
        id: "c",
        label: "Intentar que rebajen los objetivos",
        subtitle: "Menos presión, algo de recelo",
        consequences: {},
        resolve: {
          baseChance: clamp(0.35 + (player.rel_entrenador ?? 50) / 250, 0.3, 0.7),
          statModifier: "reputacion",
          success: { text: `${coach} se lo piensa un minuto y cede: «Vale, algo más realistas».\n${list(easy)}\nSales con la sensación de haber negociado bien.`, consequences: { moral: 2, flags: { ...mark, [`go_${season}`]: plan("rebajado", easy) } } },
          fail: { text: `${coach} cierra la carpeta: «Las metas son estas». Se nota que no le ha gustado que las discutas. Te quedas con las originales y con una mirada fría.`, consequences: { moral: -2, rel_entrenador: -3, flags: { ...mark, [`go_${season}`]: plan("normal", goals) } } },
        },
      },
    ],
  };
}

/* ───────────── Escena 2: el balance al cerrar la temporada ───────────── */

export function shouldTriggerGoalsReview(player: Player, usedEventIds: readonly string[]): boolean {
  if (player.club === NO_CLUB_YET || player.status !== "active") return false;
  const season = Math.floor((player.week - 1) / 10);
  const closed = season - 1;
  const turn = ((player.week - 1) % 10) + 1;
  if (closed < 1 || turn > 6) return false;
  if (!readGoalsPlan(player, closed) || usedEventIds.includes(goalsReviewId(closed))) return false;
  if (!usedEventIds.includes(`preseason-${season}`)) return false;
  // Después de los premios (si los hubo) para no atropellar las dos escenas.
  return true;
}

export function buildGoalsReviewEvent(player: Player): GameEvent {
  const season = Math.floor((player.week - 1) / 10);
  const closed = season - 1;
  const plan = readGoalsPlan(player, closed) as SeasonGoalsPlan;
  const coach = getNpcName(player, "entrenador");
  const rows = goalsProgress(player, closed, plan, true);
  const done = rows.filter((r) => r.done).length;
  const total = rows.length;
  const bonus = plan.mode === "ambicioso" ? num(player.flags?.[`go_bonus_${closed}`]) : 0;
  const allDone = done === total;
  const lines = rows.map((r) => `${r.done ? "✓" : "✗"} ${r.goal.label} — ${r.text}`).join("\n");
  const verdict =
    allDone
      ? `${coach} te recibe con una sonrisa: «Has cumplido todo lo pactado. Así da gusto trabajar».`
      : done >= Math.ceil(total / 2)
        ? `${coach} lo resume sin dramatismo: «Una temporada correcta, con cosas por mejorar».`
        : `${coach} cierra la carpeta con cara seria: «Esperaba más. Hay que hablarlo».`;
  const gain = done * 2 - (total - done) * 1.5;
  const base = { moral: Math.round(done * 3 - (total - done) * 2), rel_entrenador: Math.round(gain), fama: allDone ? 2 : 0, ...(allDone && bonus > 0 ? { patrimonio: bonus } : {}) };
  const flags = { [`go_review_${closed}`]: `${done}/${total}` };
  return {
    id: goalsReviewId(closed),
    category: "especial",
    title: `Balance de objetivos ${2026 + closed}/${String(2027 + closed).slice(2)}: ${done} de ${total}`,
    description: `${verdict}\n\n${lines}${allDone && bonus > 0 ? `\n\nPrima cobrada: ${bonus.toLocaleString("es")} €.` : bonus > 0 ? "\n\nLa prima pactada no se cobra: hacía falta cumplirlo todo." : ""}`,
    options: [
      {
        id: "a",
        label: allDone ? "Pedir que lo tengan en cuenta en el próximo contrato" : "Asumirlo y proponer un plan para mejorar",
        subtitle: allDone ? "Aprovechar el buen momento" : "Dar la cara",
        consequences: { ...base, rel_entrenador: (base.rel_entrenador ?? 0) + 1, reputacion: allDone ? 2 : 1, flags },
        outcomeText: allDone ? `${coach} apunta algo en su libreta: «Lo hablaré con el club». Esa semana, tu representante recibe una llamada con otro tono.` : `Le propones un plan concreto, con horarios y trabajo extra. ${coach} lo escucha entero, algo que no esperabas, y asiente: «Hagámoslo».`,
      },
      {
        id: "b",
        label: "Quitarle hierro y mirar a la próxima temporada",
        subtitle: "Cabeza fría",
        consequences: { ...base, moral: (base.moral ?? 0) + 1, flags },
        outcomeText: "Te lo tomas con perspectiva: una temporada no define una carrera. Guardas la hoja en un cajón y pasas página.",
      },
    ],
  };
}
