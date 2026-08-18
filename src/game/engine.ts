import { ACHIEVEMENTS, AGENT_NAMES, clubById } from "./data";
import { eventById, pickEvent } from "./events";
import {
  achieve,
  avgRating,
  clamp,
  currentSeason,
  flag,
  milestone,
  note,
  seasonLabel,
  totalApps,
} from "./mutate";
import { baselineOverall, computeRole, pick, simulateMatch } from "./match";
import type {
  Card,
  Delta,
  GameState,
  MatchData,
  Outcome,
  Player,
  Position,
  SeasonRecord,
  TraitId,
} from "./types";

export const WEEKS_PER_SEASON = 14;
export const SAVE_KEY = "beyond90:save:v1";
export const STATE_VERSION = 1;

const TRACKED = [
  ["overall", "Media"],
  ["form", "Forma"],
  ["fitness", "Físico"],
  ["morale", "Ánimo"],
  ["fame", "Notoriedad"],
  ["discipline", "Disciplina"],
] as const;

const REL_LABELS: Record<string, string> = {
  coach: "Entrenador",
  fans: "Afición",
  dressing: "Vestuario",
  agent: "Representante",
  family: "Familia",
};

function startingOverall(position: Position, traits: TraitId[]): number {
  let base = 48 + Math.floor(Math.random() * 5);
  if (traits.includes("profesional")) base += 1;
  if (position === "POR") base += 1;
  return base;
}

export function createGame(player: Player): GameState {
  const potential = 68 + Math.floor(Math.random() * 20) + (player.traits.includes("ambicioso") ? 3 : 0);
  const state: GameState = {
    version: STATE_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    player,
    clubId: "",
    stage: "youth",
    age: 16,
    seasonIndex: 0,
    week: 1,
    overall: startingOverall(player.position, player.traits),
    potential: Math.min(94, potential),
    form: 50,
    fitness: 72,
    morale: 60,
    discipline: player.traits.includes("profesional") ? 68 : 55,
    fame: 3,
    injuryWeeks: 0,
    injuryLabel: null,
    hasAgent: false,
    agentName: pick(AGENT_NAMES),
    contract: null,
    salary: 0,
    rel: {
      coach: 45,
      fans: 30,
      dressing: player.traits.includes("carismatico") ? 58 : 45,
      agent: 0,
      family: player.traits.includes("familiar") ? 78 : 62,
    },
    seenEvents: [],
    flags: {},
    seasons: [],
    log: [],
    achievements: [],
    onboarded: true,
    pending: null,
    lastOutcome: null,
  };
  return state;
}

export function chooseClub(state: GameState, clubId: string): GameState {
  const s = clone(state);
  const club = clubById(clubId);
  s.clubId = clubId;
  s.potential = Math.min(97, s.potential + club.devBonus);
  s.rel.coach = clamp(s.rel.coach + (club.minutesBonus > 0 ? 6 : -2));
  s.rel.fans = clamp(s.rel.fans + club.prestige);
  s.seasons = [newSeasonRecord(s)];
  achieve(s, "elige_cantera");
  note(s, `Entras en la cantera del ${club.name}.`, "gold");
  return advance(s);
}

function newSeasonRecord(s: GameState): SeasonRecord {
  return {
    season: seasonLabel(s.seasonIndex),
    age: s.age,
    club: clubById(s.clubId).name,
    stage: s.stage,
    overall: s.overall,
    apps: 0,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    ratingSum: 0,
    milestones: [],
  };
}

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function snapshot(s: GameState) {
  return {
    overall: s.overall,
    form: s.form,
    fitness: s.fitness,
    morale: s.morale,
    fame: s.fame,
    discipline: s.discipline,
    rel: { ...s.rel },
  };
}

function diff(before: ReturnType<typeof snapshot>, s: GameState): Delta[] {
  const deltas: Delta[] = [];
  for (const [key, label] of TRACKED) {
    const d = s[key] - before[key];
    if (d !== 0) {
      deltas.push({ label, value: `${d > 0 ? "+" : ""}${d}`, tone: d > 0 ? "good" : "bad" });
    }
  }
  for (const key of Object.keys(s.rel) as (keyof typeof s.rel)[]) {
    const d = s.rel[key] - before.rel[key];
    if (d !== 0) {
      deltas.push({
        label: REL_LABELS[key] ?? key,
        value: `${d > 0 ? "+" : ""}${d}`,
        tone: d > 0 ? "good" : "bad",
      });
    }
  }
  return deltas;
}

/** Elige el siguiente acontecimiento y lo deja en state.pending. */
export function advance(state: GameState): GameState {
  const s = clone(state);
  s.lastOutcome = null;

  if (s.week > WEEKS_PER_SEASON) {
    s.pending = { type: "season", summary: closeSeason(s) };
    return touch(s);
  }

  if (s.injuryWeeks > 0) {
    s.injuryWeeks -= 1;
    s.fitness = clamp(s.fitness + 4);
    s.form = clamp(s.form - 2);
    s.week += 1;
    const label = s.injuryLabel ?? "Lesión";
    if (s.injuryWeeks === 0) {
      s.injuryLabel = null;
      flag(s, "volvio_pendiente");
      s.pending = {
        type: "rest",
        title: "Alta médica",
        text: `${label}: el fisio te da el alta. Vuelves al grupo esta semana.`,
      };
    } else {
      s.pending = {
        type: "rest",
        title: "Semana en la enfermería",
        text: `${label}. Quedan ${s.injuryWeeks} semanas: gimnasio, piscina y ver los partidos desde la grada.`,
      };
    }
    return touch(s);
  }

  const forced = pickEvent(s);
  const forcedPriority = forced?.priority ?? 0;
  if (forced && (forcedPriority >= 100 || Math.random() < 0.45)) {
    s.pending = { type: "event", eventId: forced.id };
    return touch(s);
  }

  s.pending = { type: "match", match: simulateMatch(s) };
  return touch(s);
}

function touch(s: GameState): GameState {
  s.updatedAt = Date.now();
  return s;
}

export function resolveEvent(state: GameState, eventId: string, choiceId: string): GameState {
  const s = clone(state);
  const event = eventById(eventId);
  if (!event) return advance(s);
  const choice = event.choices.find((c) => c.id === choiceId) ?? event.choices[0]!;
  const before = snapshot(s);
  const outcomeText = typeof choice.outcome === "function" ? choice.outcome(s) : choice.outcome;
  choice.apply(s);
  if (!s.seenEvents.includes(eventId)) s.seenEvents.push(eventId);
  s.week += 1;
  checkAchievements(s);
  const deltas = diff(before, s);
  s.pending = null;
  s.lastOutcome = {
    title: event.title,
    text: outcomeText,
    deltas,
    tone: deltas.some((d) => d.tone === "bad") && !deltas.some((d) => d.tone === "good") ? "bad" : "good",
  };
  note(s, `${event.title}: ${outcomeText}`, "neutral");
  return touch(s);
}

export function resolveMatch(state: GameState, match: MatchData, keyChoiceId?: string): GameState {
  const s = clone(state);
  const before = snapshot(s);
  const m: MatchData = clone(match);
  let keyText = "";

  if (m.keyMoment && keyChoiceId) {
    const option = m.keyMoment.options.find((o) => o.id === keyChoiceId) ?? m.keyMoment.options[0]!;
    const success = Math.random() < option.success;
    if (option.id === "ceder") {
      m.goalsFor += success ? 1 : 0;
      s.rel.dressing = clamp(s.rel.dressing + 8);
      keyText = success
        ? "Cedes el penalti y tu compañero lo transforma. El vestuario lo nota."
        : "Cedes el penalti y tu compañero lo falla. Nadie te culpa, pero duele.";
    } else if (option.id === "pase") {
      if (success) {
        m.assists += 1;
        m.goalsFor += 1;
        m.rating += 0.7;
        keyText = "Tu pase acaba en gol. Asistencia decisiva.";
      } else {
        m.rating -= 0.2;
        keyText = "El pase es bueno, la definición no. Se queda en nada.";
      }
    } else if (option.id === "obedecer" || option.id === "proteger" || option.id === "falta") {
      if (success) {
        s.rel.coach = clamp(s.rel.coach + 7);
        m.rating += 0.4;
        keyText = `${option.note} El míster lo agradece en la charla del lunes.`;
      } else {
        m.goalsAgainst += 1;
        m.rating -= 0.4;
        keyText = "Haces lo correcto, pero el rival encuentra el hueco igual.";
      }
    } else if (option.id === "quedarte" || option.id === "tiro" || option.id === "meter") {
      if (success) {
        if (option.id === "tiro") m.goals += 1;
        m.goalsFor += option.id === "tiro" ? 1 : 0;
        m.rating += 1;
        s.rel.fans = clamp(s.rel.fans + 8);
        keyText = "Sale. Y cuando sale, se te recuerda.";
      } else {
        m.rating -= 0.9;
        s.rel.coach = clamp(s.rel.coach - 6);
        if (option.id === "meter" && Math.random() < 0.35) {
          s.injuryWeeks = 3;
          s.injuryLabel = "Golpe en el tobillo";
        } else {
          m.goalsAgainst += option.id === "quedarte" ? 1 : 0;
        }
        keyText = "No sale. El míster no disimula el gesto.";
      }
    } else {
      // penaltis: izq / der / fuerte / panenka
      if (success) {
        m.goals += 1;
        m.goalsFor += 1;
        m.rating += 1.1;
        s.rel.fans = clamp(s.rel.fans + (option.id === "panenka" ? 14 : 7));
        keyText = option.id === "panenka"
          ? "Panenka. El portero se sienta, la grada estalla y el míster se tapa la cara."
          : "Gol de penalti. Fría, limpia, sin celebración exagerada.";
      } else {
        m.rating -= 1;
        s.rel.fans = clamp(s.rel.fans - (option.id === "panenka" ? 12 : 5));
        s.morale = clamp(s.morale - 8);
        keyText = option.id === "panenka"
          ? "El portero no se mueve. Ridículo absoluto y silencio en el estadio."
          : "Penalti fallado. Vas a revivirlo mil veces esta noche.";
      }
    }
    m.rating = Math.max(3.5, Math.min(9.6, Math.round(m.rating * 10) / 10));
    if (keyText) m.moments.push({ minute: m.keyMoment.minute, text: keyText, tone: keyText.includes("no sale") ? "bad" : "neutral" });
    m.moments.sort((a, b) => a.minute - b.minute);
  }

  const season = currentSeason(s);
  if (season) {
    if (m.minutes > 0) {
      season.apps += 1;
      season.goals += m.goals;
      season.assists += m.assists;
      season.ratingSum += m.rating;
      if (m.goalsAgainst === 0) season.cleanSheets += 1;
    }
    season.overall = s.overall;
    season.stage = s.stage;
  }

  if (m.minutes === 0) {
    s.form = clamp(s.form - (m.benchOnly ? 2 : 5));
    s.morale = clamp(s.morale - (m.benchOnly ? 2 : 5));
    s.fitness = clamp(s.fitness + 3);
    s.rel.coach = clamp(s.rel.coach - 1);
  } else {
    const perf = m.rating - 6.2;
    s.form = clamp(s.form + perf * 6);
    s.morale = clamp(s.morale + perf * 4 + (m.goalsFor > m.goalsAgainst ? 3 : -2));
    s.fitness = clamp(s.fitness - Math.round(m.minutes / 22));
    s.rel.coach = clamp(s.rel.coach + perf * 2.5);
    s.rel.fans = clamp(s.rel.fans + perf * 2 + m.goals * 3);
    s.rel.dressing = clamp(s.rel.dressing + (perf > 0 ? 1 : 0));
    s.fame = clamp(s.fame + Math.max(0, Math.round(perf * 2)) + m.goals * 2 + (s.stage === "first" ? 3 : 0));
    if (m.rating >= 7.6) s.overall = clamp(s.overall + 1, 0, 99);
    if (m.rating <= 4.6 && Math.random() < 0.4) s.overall = clamp(s.overall - 1, 0, 99);
    if (s.fitness < 40 && Math.random() < 0.25 && s.injuryWeeks === 0) {
      s.injuryWeeks = 2 + Math.floor(Math.random() * 3);
      s.injuryLabel = "Sobrecarga muscular";
    }
    if (m.goals > 0 && !s.achievements.includes("primer_gol")) {
      achieve(s, "primer_gol");
      milestone(s, "Primer gol oficial.");
    }
    if (
      m.goalsAgainst === 0 &&
      (s.player.position === "POR" || s.player.position === "DFC") &&
      !s.achievements.includes("primer_gol")
    ) {
      achieve(s, "primer_gol");
      milestone(s, "Primera portería a cero como titular.");
    }
  }

  s.week += 1;
  checkAchievements(s);
  const deltas = diff(before, s);
  const result = m.goalsFor > m.goalsAgainst ? "Victoria" : m.goalsFor === m.goalsAgainst ? "Empate" : "Derrota";
  s.pending = null;
  s.lastOutcome = {
    title: `${result} ${m.goalsFor}-${m.goalsAgainst}`,
    text: m.unused
      ? "No entras en la convocatoria. Semana larga."
      : m.benchOnly
        ? "Noventa minutos en el banquillo."
        : `${m.minutes}' disputados · valoración ${m.rating.toFixed(1)}${m.goals ? ` · ${m.goals} gol${m.goals > 1 ? "es" : ""}` : ""}${m.assists ? ` · ${m.assists} asistencia${m.assists > 1 ? "s" : ""}` : ""}.`,
    deltas,
    tone: result === "Victoria" ? "good" : result === "Derrota" ? "bad" : "neutral",
  };
  note(
    s,
    `${m.competition} · ${m.home ? "vs" : "en"} ${m.opponent} ${m.goalsFor}-${m.goalsAgainst}${m.minutes ? ` (${m.minutes}', ${m.rating.toFixed(1)})` : " (sin minutos)"}`,
    result === "Victoria" ? "good" : result === "Derrota" ? "bad" : "neutral",
  );
  return touch(s);
}

function closeSeason(s: GameState): Outcome {
  const season = currentSeason(s);
  const before = snapshot(s);
  const apps = season?.apps ?? 0;
  const rating = apps ? (season!.ratingSum / apps) : 0;

  let growth = 0;
  growth += apps >= 10 ? 3 : apps >= 5 ? 2 : 1;
  growth += rating >= 7 ? 3 : rating >= 6.3 ? 2 : rating > 0 ? 1 : 0;
  growth += clubById(s.clubId).devBonus * 0.5;
  growth += s.player.traits.includes("ambicioso") ? 1 : 0;
  growth += s.discipline >= 65 ? 1 : 0;
  growth -= s.injuryWeeks > 0 ? 1 : 0;
  const room = Math.max(0, s.potential - s.overall);
  growth = Math.round(Math.min(growth, Math.max(1, room * 0.45)));

  s.overall = clamp(s.overall + growth, 0, 99);
  s.age += 1;
  s.seasonIndex += 1;
  s.week = 1;
  s.fitness = clamp(s.fitness + 12);
  s.form = clamp(50 + (rating - 6.2) * 5);
  if (season) season.overall = s.overall;
  s.seasons.push(newSeasonRecord(s));

  checkAchievements(s);
  const deltas = diff(before, s);
  note(
    s,
    `Fin de temporada ${season?.season}: ${apps} partidos, ${season?.goals ?? 0} goles, ${season?.assists ?? 0} asistencias. Media ${s.overall}.`,
    "gold",
  );

  return {
    title: `Temporada ${season?.season ?? ""} cerrada`,
    text: apps
      ? `${apps} partidos, ${season?.goals ?? 0} goles y ${season?.assists ?? 0} asistencias con una valoración media de ${rating.toFixed(1)}. Cumples ${s.age} años.`
      : `Temporada sin minutos oficiales. Cumples ${s.age} años y el curso que viene no admite excusas.`,
    deltas,
    tone: "gold",
  };
}

export function checkAchievements(s: GameState): void {
  if (s.overall >= 70) achieve(s, "media_70");
  if (s.rel.fans >= 80) achieve(s, "idolo");
  if (s.hasAgent) achieve(s, "representante");
  if (s.contract) achieve(s, "primer_contrato");
  if (s.stage === "reserves" || s.stage === "first") achieve(s, "filial");
  if (s.stage === "first") achieve(s, "debut_pro");
}

export function achievementList(s: GameState) {
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: s.achievements.includes(a.id) }));
}

export function statusLabel(s: GameState): string {
  const role = computeRole(s);
  if (s.injuryWeeks > 0) return "Lesionado";
  if (role === 0) return "Fuera de convocatoria";
  if (role === 1) return "Banquillo";
  if (role === 2) return "Suplente con minutos";
  return "Titular";
}

export function stageLabel(stage: GameState["stage"]): string {
  if (stage === "youth") return "Juvenil";
  if (stage === "reserves") return "Filial";
  return "Primer equipo";
}

export function careerTotals(s: GameState) {
  return {
    apps: totalApps(s),
    goals: s.seasons.reduce((a, x) => a + x.goals, 0),
    assists: s.seasons.reduce((a, x) => a + x.assists, 0),
    cleanSheets: s.seasons.reduce((a, x) => a + x.cleanSheets, 0),
    rating: avgRating(s),
    baseline: baselineOverall(s),
  };
}

export { seasonLabel };
