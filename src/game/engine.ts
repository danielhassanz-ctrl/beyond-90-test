import { ACHIEVEMENTS, AGENT_NAMES, clubById } from "./data";
import { randomSuitor, resolveDynamic } from "./dynamic";
import { eventById, pickEvent } from "./events";
import { interpretFree, INTENT_FEEDBACK } from "./interpret";
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
import { baselineOverall, computeRole, pick, simulateBlock, simulateMatch, validateMatch } from "./match";
import type {
  AgentState,
  AutoBlock,
  Card,
  Delta,
  DynamicCard,
  GameState,
  Injury,
  MatchData,
  NarrativeMemory,
  Outcome,
  Player,
  Position,
  SeasonRecord,
  ShareData,
  Slot,
  Stage,
  TraitId,
} from "./types";

export const SAVE_KEY = "beyond90:save:v1";
export const STATE_VERSION = 2;
/** Partidos "reales" de una temporada, repartidos entre claves y bloques. */
export const MATCHES_PER_SEASON = 34;

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

export const AGENT_MAIN_NAME = "Álvaro Montes";

/* =============================== Creación =============================== */

function startingOverall(position: Position, traits: TraitId[]): number {
  // 16 años: normalmente 55-65; promesa excepcional 65-68.
  let base = 55 + Math.floor(Math.random() * 9); // 55-63
  if (traits.includes("profesional")) base += 1;
  if (position === "POR") base += 1;
  if (Math.random() < 0.07) base = 65 + Math.floor(Math.random() * 4);
  return Math.min(68, base);
}

/** Techo oculto calibrado con la distribución de carreras pedida. */
function rollPotential(overall: number, traits: TraitId[]): number {
  const r = Math.random();
  let pot: number;
  if (r < 0.08) pot = 58 + Math.floor(Math.random() * 7); // truncada / modesta
  else if (r < 0.27) pot = 65 + Math.floor(Math.random() * 7); // profesional modesto
  else if (r < 0.65) pot = 72 + Math.floor(Math.random() * 8); // buen jugador de Primera
  else if (r < 0.87) pot = 80 + Math.floor(Math.random() * 6); // gran jugador
  else if (r < 0.97) pot = 86 + Math.floor(Math.random() * 6); // estrella mundial
  else pot = 92 + Math.floor(Math.random() * 6); // leyenda
  if (traits.includes("ambicioso")) pot += 2;
  return Math.max(overall + 4, Math.min(99, pot));
}

function emptyAgent(): AgentState {
  return {
    name: Math.random() < 0.7 ? AGENT_MAIN_NAME : pick(AGENT_NAMES),
    present: false,
    trust: 40,
    commission: 8,
    memories: [],
    teaser: null,
    firedCount: 0,
  };
}

function emptyMemory(): NarrativeMemory {
  return { rejectedClubs: [], conflicts: [], promises: [], threads: {}, npcs: {} };
}

export function createGame(player: Player): GameState {
  const overall = startingOverall(player.position, player.traits);
  return {
    version: STATE_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    player,
    clubId: "",
    stage: "youth",
    age: 16,
    seasonIndex: 0,
    beat: 0,
    queue: [],
    overall,
    potential: rollPotential(overall, player.traits),
    xp: 0,
    form: 50,
    fitness: 74,
    morale: 60,
    discipline: player.traits.includes("profesional") ? 68 : 55,
    fame: 3,
    injury: null,
    hasAgent: false,
    agentName: AGENT_MAIN_NAME,
    agent: emptyAgent(),
    memory: emptyMemory(),
    contract: null,
    salary: 0,
    tablePosition: 6 + Math.floor(Math.random() * 8),
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
}

export function chooseClub(state: GameState, clubId: string): GameState {
  const s = clone(state);
  const club = clubById(clubId);
  s.clubId = clubId;
  s.potential = Math.min(99, s.potential + club.devBonus);
  s.rel.coach = clamp(s.rel.coach + (club.minutesBonus > 0 ? 6 : -2));
  s.rel.fans = clamp(s.rel.fans + club.prestige);
  s.seasons = [newSeasonRecord(s)];
  s.queue = makeSeasonPlan(s);
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
    wins: 0,
    draws: 0,
    losses: 0,
    milestones: [],
  };
}

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/* =============================== Migración =============================== */

export function migrate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const old = raw as Partial<GameState> & Record<string, unknown>;
  if (!old.player || typeof old.player !== "object") return null;
  const s = old as GameState;

  s.version = STATE_VERSION;
  s.beat = typeof s.beat === "number" ? s.beat : 0;
  s.xp = typeof s.xp === "number" ? s.xp : 0;
  s.tablePosition = typeof s.tablePosition === "number" && s.tablePosition > 0 ? s.tablePosition : 8;
  s.agent = s.agent && typeof s.agent === "object" ? { ...emptyAgent(), ...s.agent } : emptyAgent();
  if (s.hasAgent) s.agent.present = true;
  s.agentName = s.agent.name;
  s.memory = s.memory && typeof s.memory === "object" ? { ...emptyMemory(), ...s.memory } : emptyMemory();
  s.seenEvents = Array.isArray(s.seenEvents) ? s.seenEvents : [];
  s.achievements = Array.isArray(s.achievements) ? s.achievements : [];
  s.log = Array.isArray(s.log) ? s.log : [];
  s.flags = s.flags && typeof s.flags === "object" ? s.flags : {};
  s.seasons = Array.isArray(s.seasons) ? s.seasons : [];
  for (const season of s.seasons) {
    season.wins = typeof season.wins === "number" ? season.wins : 0;
    season.draws = typeof season.draws === "number" ? season.draws : 0;
    season.losses = typeof season.losses === "number" ? season.losses : 0;
    season.milestones = Array.isArray(season.milestones) ? season.milestones : [];
  }
  if (s.seasons.length === 0 && s.clubId) s.seasons = [newSeasonRecord(s)];

  // Lesiones antiguas por semanas -> nuevo modelo por partidos.
  const legacyWeeks = typeof old["injuryWeeks"] === "number" ? (old["injuryWeeks"] as number) : 0;
  const legacyLabel = typeof old["injuryLabel"] === "string" ? (old["injuryLabel"] as string) : null;
  if (!s.injury && legacyWeeks > 0) {
    s.injury = { label: legacyLabel ?? "Lesión", severity: legacyWeeks >= 8 ? "severe" : legacyWeeks >= 4 ? "medium" : "minor", matchesOut: legacyWeeks, treated: true };
  }
  if (s.injury && typeof s.injury.matchesOut !== "number") s.injury = null;
  const bag = s as unknown as Record<string, unknown>;
  delete bag["injuryWeeks"];
  delete bag["injuryLabel"];
  delete bag["week"];

  for (const k of ["overall", "potential", "form", "fitness", "morale", "discipline", "fame", "age", "seasonIndex"] as const) {
    if (typeof s[k] !== "number" || !Number.isFinite(s[k])) {
      (s[k] as number) = k === "age" ? 16 : k === "seasonIndex" ? 0 : 50;
    }
  }
  if (s.potential <= s.overall) s.potential = Math.min(99, s.overall + 6);
  if (!s.rel || typeof s.rel !== "object") s.rel = { coach: 45, fans: 30, dressing: 45, agent: 0, family: 60 };

  // Estructura de ritmo nueva: si el save es antiguo, se replanifica la temporada.
  if (!Array.isArray(s.queue) || s.queue.length === 0) {
    s.queue = s.clubId ? makeSeasonPlan(s) : [];
    s.pending = null;
    s.lastOutcome = null;
  }
  const validCards = ["event", "match", "block", "season", "dynamic"];
  if (s.pending && !validCards.includes(s.pending.type)) s.pending = null;
  return s;
}

/* ============================ Plan de temporada ============================ */

function keyMatchLabels(s: GameState): { label: string; tie?: boolean }[] {
  const debut = !s.achievements.includes(s.stage === "first" ? "debut_pro" : "debut_juvenil");
  const derbyRival = s.clubId === "sevilla" ? "Betis" : s.clubId === "betis" ? "Sevilla" : s.clubId === "malaga" ? "Granada" : "Valencia";
  const base: { label: string; tie?: boolean }[] = [
    { label: debut ? "Tu primera oportunidad" : "Primera jornada" },
    { label: `Derbi contra el ${derbyRival}` },
    { label: "Duelo directo por la parte alta" },
    { label: "Eliminatoria de Copa", tie: true },
    { label: "Partido con ojeadores en la grada" },
    { label: "Jornada decisiva de la temporada" },
  ];
  if (s.memory.rejectedClubs.length > 0 && Math.random() < 0.6) {
    base.splice(3, 0, { label: `Partido ante el ${s.memory.rejectedClubs[0]}` });
  } else if (Math.random() < 0.5) {
    base.push({ label: "Final de fase de ascenso", tie: true });
  }
  return base.slice(0, 6 + (Math.random() < 0.5 ? 1 : 0));
}

/**
 * Una temporada = 6-7 escenas deportivas clave + bloques auto-simulados
 * + 9-13 escenas de vida/carrera. Nunca partido→semana→partido.
 */
export function makeSeasonPlan(s: GameState): Slot[] {
  const keys = keyMatchLabels(s);
  const blocks = keys.length; // un bloque tras cada partido clave
  const totalBlockMatches = Math.max(0, MATCHES_PER_SEASON - keys.length);
  const per = Math.max(3, Math.floor(totalBlockMatches / blocks));
  const slots: Slot[] = [];

  keys.forEach((k, idx) => {
    const lifeBefore = idx === 0 ? 2 : 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let i = 0; i < lifeBefore; i++) slots.push({ kind: idx % 2 === 0 ? "event" : "life" });
    if (idx === 2 || idx === 4) slots.push({ kind: "agent" });
    slots.push(k.tie ? { kind: "match", label: k.label, tie: true } : { kind: "match", label: k.label });
    const remainder = idx === blocks - 1 ? totalBlockMatches - per * (blocks - 1) : per;
    slots.push({ kind: "block", matches: Math.max(2, remainder) });
    if (Math.random() < 0.6) slots.push({ kind: "event" });
  });
  slots.push({ kind: "life" });
  return slots;
}

/* =============================== Deltas =============================== */

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
    if (d !== 0) deltas.push({ label, value: `${d > 0 ? "+" : ""}${d}`, tone: d > 0 ? "good" : "bad" });
  }
  for (const key of Object.keys(s.rel) as (keyof typeof s.rel)[]) {
    const d = s.rel[key] - before.rel[key];
    if (d !== 0) {
      deltas.push({ label: REL_LABELS[key] ?? key, value: `${d > 0 ? "+" : ""}${d}`, tone: d > 0 ? "good" : "bad" });
    }
  }
  return deltas;
}

function touch(s: GameState): GameState {
  s.updatedAt = Date.now();
  return s;
}

function dyn(kind: string, data: DynamicCard["data"] = {}): DynamicCard {
  return { type: "dynamic", kind, data };
}

/* =============================== Avance =============================== */

function agentEligible(s: GameState): boolean {
  if (s.agent.present) return false;
  if (s.flags["agente_aplazado"] === 1 && Math.random() < 0.5) return false;
  return s.age >= 17 || s.fame >= 22 || s.overall >= 64;
}

/** Elige la siguiente escena y la deja en state.pending. */
export function advance(state: GameState): GameState {
  const s = clone(state);
  s.lastOutcome = null;
  s.beat += 1;

  // 1. Lesión sin diagnosticar: siempre manda.
  if (s.injury && !s.injury.treated) {
    s.pending = dyn("injury_diagnosis", {
      label: s.injury.label,
      severity: s.injury.severity,
      matchesOut: s.injury.matchesOut,
    });
    return touch(s);
  }

  // 2. Regreso pendiente.
  if (!s.injury && s.flags["volvio_pendiente"] === 1) {
    s.flags["volvio_pendiente"] = 0;
    s.pending = dyn("return", { label: s.flags["ultima_lesion_label"] ? String(s.flags["ultima_lesion_label"]) : "La lesión" });
    return touch(s);
  }

  // 3. Fin de temporada.
  if (s.queue.length === 0) {
    s.pending = { type: "season", summary: closeSeason(s) };
    return touch(s);
  }

  const slot = s.queue.shift()!;

  // Lesionado: los partidos clave se convierten en bloques que absorben la baja.
  if (s.injury && slot.kind === "match") {
    s.pending = { type: "block", block: buildBlock(s, 3) };
    return touch(s);
  }

  switch (slot.kind) {
    case "match":
      s.pending = { type: "match", match: simulateMatch(s, slot) };
      return touch(s);
    case "block":
      s.pending = { type: "block", block: buildBlock(s, slot.matches ?? 4) };
      return touch(s);
    case "agent": {
      const card = agentCard(s);
      if (card) {
        s.pending = card;
        return touch(s);
      }
      break;
    }
    default:
      break;
  }

  // Contrato profesional cuando toca.
  if (
    s.stage !== "youth" &&
    !s.contract &&
    s.age >= 17 &&
    s.overall >= baselineOverall(s) - 3 &&
    s.flags["contrato_aplazado"] !== 1
  ) {
    s.pending = dyn("contract", { years: 3, salary: s.stage === "first" ? 220 : 90 });
    return touch(s);
  }

  const event = pickEvent(s);
  if (event) {
    s.pending = { type: "event", eventId: event.id };
    return touch(s);
  }

  // Sin eventos disponibles: bloque corto para no dejar la escena vacía.
  s.pending = { type: "block", block: buildBlock(s, 3) };
  return touch(s);
}

function agentCard(s: GameState): Card | null {
  if (agentEligible(s)) return dyn("agent_intro", { commission: 8 + Math.floor(Math.random() * 3) });
  if (!s.agent.present) return null;
  if (s.agent.teaser) {
    const suitor = randomSuitor(s);
    s.agent.teaser = null;
    return dyn("agent_offer", { clubName: suitor, salary: 150 + Math.floor(Math.random() * 500) });
  }
  if (s.fame >= 35 && Math.random() < 0.55) {
    const teaser = pick([
      "Ha llamado un club importante preguntando por ti",
      "Hay un ojeador que ha pedido tus últimos tres partidos en vídeo",
      "Me han preguntado por tu cláusula desde fuera de España",
    ]);
    s.agent.teaser = teaser;
    return dyn("agent_teaser", { teaser });
  }
  if (s.agent.trust >= 50 && Math.random() < 0.35) {
    return dyn("agent_commission", { commission: Math.min(15, s.agent.commission + 2) });
  }
  return null;
}

function buildBlock(s: GameState, count: number): AutoBlock {
  const missed = s.injury ? Math.min(count, s.injury.matchesOut) : 0;
  return simulateBlock(s, count, missed);
}

/* ========================= Resolución de escenas ========================= */

export function resolveEvent(state: GameState, eventId: string, choiceId: string): GameState {
  const s = clone(state);
  const event = eventById(eventId);
  if (!event) return advance(s);
  const choice = event.choices.find((c) => c.id === choiceId) ?? event.choices[0]!;
  const before = snapshot(s);
  const outcomeText = typeof choice.outcome === "function" ? choice.outcome(s) : choice.outcome;
  try {
    choice.apply(s);
  } catch {
    /* nunca romper la partida por un evento */
  }
  if (!s.seenEvents.includes(eventId)) s.seenEvents.push(eventId);
  finishScene(s, event.title, outcomeText, before);
  return touch(s);
}

export function resolveEventFree(state: GameState, eventId: string, text: string): GameState {
  const s = clone(state);
  const event = eventById(eventId);
  if (!event) return advance(s);
  const before = snapshot(s);
  const interp = interpretFree(text ?? "");
  const reaction = event.freeform?.reactions?.[interp.intent] ?? INTENT_FEEDBACK[interp.intent];
  try {
    if (event.applyFree) event.applyFree(s, interp);
    else event.choices[0]?.apply(s);
  } catch {
    /* respuesta libre nunca debe romper el juego */
  }
  if (!s.seenEvents.includes(eventId)) s.seenEvents.push(eventId);
  finishScene(s, event.title, `${reaction} (${interp.label})`, before);
  return touch(s);
}

export function resolveDynamicCard(
  state: GameState,
  card: DynamicCard,
  choiceId: string,
  freeText?: string,
): GameState {
  const s = clone(state);
  const before = snapshot(s);
  let result;
  try {
    result = resolveDynamic(s, card, choiceId, freeText);
  } catch {
    result = { title: "Sigues adelante", text: "La semana pasa sin más.", tone: "neutral" as const };
  }
  if (card.kind === "injury_diagnosis" && s.injury) {
    s.flags["ultima_lesion_label"] = 0;
    s.flags["volvio_pendiente"] = 1;
  }
  s.pending = null;
  const deltas = diff(before, s);
  s.lastOutcome = { title: result.title, text: result.text, deltas, tone: result.tone, ...(result.share ? { share: result.share } : {}) };
  checkAchievements(s);
  note(s, `${result.title}: ${result.text}`, result.tone === "gold" ? "gold" : result.tone);
  return touch(s);
}

function finishScene(s: GameState, title: string, text: string, before: ReturnType<typeof snapshot>) {
  checkAchievements(s);
  const deltas = diff(before, s);
  s.pending = null;
  s.lastOutcome = {
    title,
    text,
    deltas,
    tone: deltas.some((d) => d.tone === "bad") && !deltas.some((d) => d.tone === "good") ? "bad" : "good",
  };
  note(s, `${title}: ${text}`, "neutral");
}

export function resolveBlock(state: GameState, block: AutoBlock): GameState {
  const s = clone(state);
  const before = snapshot(s);
  const season = currentSeason(s);
  if (season) {
    season.apps += block.apps;
    season.goals += block.goals;
    season.assists += block.assists;
    season.ratingSum += block.rating * block.apps;
    season.wins += block.wins;
    season.draws += block.draws;
    season.losses += block.losses;
  }

  if (block.apps > 0) {
    const perf = block.rating - 6.2;
    s.form = clamp(s.form + perf * 8);
    s.morale = clamp(s.morale + perf * 4 + (block.wins > block.losses ? 4 : -2));
    s.fitness = clamp(s.fitness - Math.min(10, block.apps));
    s.rel.coach = clamp(s.rel.coach + perf * 3);
    s.rel.fans = clamp(s.rel.fans + perf * 2 + block.goals * 2);
    s.fame = clamp(s.fame + block.goals + (s.stage === "first" ? 2 : 1));
    s.xp += block.apps * 2 + block.goals * 3 + Math.max(0, perf * 6);
  } else if (!s.injury) {
    s.form = clamp(s.form - 6);
    s.morale = clamp(s.morale - 5);
    s.fitness = clamp(s.fitness + 5);
    s.rel.coach = clamp(s.rel.coach - 2);
  }

  // Recuperación de lesión absorbida por el bloque.
  if (s.injury) {
    s.injury.matchesOut -= block.missed || block.matches;
    s.fitness = clamp(s.fitness + 6);
    if (s.injury.matchesOut <= 0) {
      s.flags["volvio_pendiente"] = 1;
      note(s, `Alta médica: ${s.injury.label} superada.`, "good");
      s.injury = null;
    }
  }

  s.tablePosition = clamp(
    (s.tablePosition || 8) + (block.wins > block.losses ? -1 : block.losses > block.wins ? 1 : 0),
    1,
    20,
  );

  // Lesión nueva por acumulación de partidos.
  if (!s.injury && s.fitness < 42 && Math.random() < 0.22) {
    const severe = s.flags["riesgo_recaida"] === 1 && Math.random() < 0.4;
    s.injury = {
      label: severe ? "Recaída muscular grave" : "Sobrecarga muscular",
      severity: severe ? "severe" : "minor",
      matchesOut: severe ? 10 + Math.floor(Math.random() * 6) : 2 + Math.floor(Math.random() * 3),
      treated: false,
    };
    s.flags["riesgo_recaida"] = 0;
  }

  checkAchievements(s);
  const deltas = diff(before, s);
  s.pending = null;
  s.lastOutcome = {
    title: block.title,
    text: block.text,
    deltas,
    tone: block.wins > block.losses ? "good" : block.losses > block.wins ? "bad" : "neutral",
  };
  note(s, `${block.matches} jornadas: ${block.wins}V ${block.draws}E ${block.losses}D · ${block.goals}G ${block.assists}A`, "neutral");
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
      if (success) m.goalsFor += 1;
      s.rel.dressing = clamp(s.rel.dressing + 8);
      keyText = success
        ? "Cedes el penalti y tu compañero lo transforma."
        : "Cedes el penalti y tu compañero lo falla. Nadie te culpa, pero duele.";
    } else if (option.id === "pase") {
      if (success) {
        m.goalsFor += 1;
        m.assists += 1;
        m.rating += 0.7;
        keyText = "Tu pase acaba en gol. Asistencia decisiva.";
      } else {
        m.rating -= 0.2;
        keyText = "El pase es bueno, la definición no.";
      }
    } else if (option.id === "obedecer" || option.id === "proteger" || option.id === "falta") {
      if (success) {
        s.rel.coach = clamp(s.rel.coach + 7);
        m.rating += 0.4;
        keyText = `${option.note} El míster lo agradece el lunes.`;
      } else {
        m.goalsAgainst += 1;
        m.rating -= 0.4;
        keyText = "Haces lo correcto y el rival encuentra el hueco igual.";
      }
    } else if (option.id === "quedarte" || option.id === "tiro" || option.id === "meter") {
      if (success) {
        if (option.id === "tiro") {
          m.goalsFor += 1;
          m.goals += 1;
        }
        m.rating += 1;
        s.rel.fans = clamp(s.rel.fans + 8);
        keyText = "Sale. Y cuando sale, se te recuerda.";
      } else {
        m.rating -= 0.9;
        s.rel.coach = clamp(s.rel.coach - 6);
        if (option.id === "meter" && Math.random() < 0.35) {
          s.injury = { label: "Golpe fuerte en el tobillo", severity: "minor", matchesOut: 3, treated: false };
        } else if (option.id === "quedarte") {
          m.goalsAgainst += 1;
        }
        keyText = "No sale. El míster no disimula el gesto.";
      }
    } else {
      if (success) {
        m.goalsFor += 1;
        m.goals += 1;
        m.rating += 1.1;
        s.rel.fans = clamp(s.rel.fans + (option.id === "panenka" ? 14 : 7));
        keyText = option.id === "panenka"
          ? "Panenka. El portero se sienta y la grada estalla."
          : "Gol de penalti. Frío, limpio, sin celebración exagerada.";
      } else {
        m.rating -= 1;
        s.rel.fans = clamp(s.rel.fans - (option.id === "panenka" ? 12 : 5));
        s.morale = clamp(s.morale - 8);
        keyText = option.id === "panenka"
          ? "El portero no se mueve. Ridículo absoluto."
          : "Penalti fallado. Vas a revivirlo mil veces esta noche.";
      }
    }
    if (keyText) {
      m.moments.push({
        minute: m.keyMoment.minute,
        text: keyText,
        tone: keyText.startsWith("No sale") || keyText.includes("fallado") || keyText.includes("Ridículo") ? "bad" : "good",
      });
    }
  }

  // Fuente única de verdad: se validan invariantes antes de mostrar nada.
  const final = validateMatch(m);

  const season = currentSeason(s);
  const won = final.shootout ? final.shootout.us > final.shootout.them : final.goalsFor > final.goalsAgainst;
  const drew = !final.shootout && final.goalsFor === final.goalsAgainst;
  if (season) {
    if (final.minutes > 0) {
      season.apps += 1;
      season.goals += final.goals;
      season.assists += final.assists;
      season.ratingSum += final.rating;
      if (final.goalsAgainst === 0) season.cleanSheets += 1;
    }
    if (won) season.wins += 1;
    else if (drew) season.draws += 1;
    else season.losses += 1;
    season.overall = s.overall;
    season.stage = s.stage;
  }

  let share: ShareData | undefined;

  if (final.minutes === 0) {
    s.form = clamp(s.form - (final.benchOnly ? 2 : 5));
    s.morale = clamp(s.morale - (final.benchOnly ? 2 : 5));
    s.fitness = clamp(s.fitness + 3);
    s.rel.coach = clamp(s.rel.coach - 1);
  } else {
    const perf = final.rating - 6.2;
    s.form = clamp(s.form + perf * 7);
    s.morale = clamp(s.morale + perf * 4 + (won ? 4 : drew ? 0 : -3));
    s.fitness = clamp(s.fitness - Math.round(final.minutes / 20));
    s.rel.coach = clamp(s.rel.coach + perf * 2.5);
    s.rel.fans = clamp(s.rel.fans + perf * 2 + final.goals * 3);
    s.rel.dressing = clamp(s.rel.dressing + (perf > 0 ? 1 : 0));
    s.fame = clamp(s.fame + Math.max(0, Math.round(perf * 2)) + final.goals * 3 + (s.stage === "first" ? 3 : 0));
    // La MEDIA no sube por partido: se acumula progreso oculto.
    s.xp += 6 + Math.max(0, perf * 8) + final.goals * 5 + final.assists * 3;

    if (s.stage === "first" && !s.achievements.includes("debut_pro")) {
      achieve(s, "debut_pro");
      milestone(s, "Debut con el primer equipo.");
      share = shareCard(s, "DEBUT PROFESIONAL", final);
    } else if (!s.achievements.includes("debut_juvenil")) {
      achieve(s, "debut_juvenil");
      milestone(s, "Primer partido oficial.");
    }
    if (final.goals >= 3) {
      milestone(s, `Hat-trick ante el ${final.opponent}.`);
      share = shareCard(s, "HAT-TRICK", final);
    } else if (final.goals > 0 && !s.achievements.includes("primer_gol")) {
      achieve(s, "primer_gol");
      milestone(s, "Primer gol oficial.");
      share = shareCard(s, "PRIMER GOL OFICIAL", final);
    }
    if (
      final.goalsAgainst === 0 &&
      (s.player.position === "POR" || s.player.position === "DFC") &&
      !s.achievements.includes("primer_gol")
    ) {
      achieve(s, "primer_gol");
      milestone(s, "Primera portería a cero como titular.");
    }
  }

  s.tablePosition = clamp((s.tablePosition || 8) + (won ? -1 : drew ? 0 : 1), 1, 20);
  checkAchievements(s);
  const deltas = diff(before, s);
  const label = final.shootout
    ? `${won ? "Pasas" : "Eliminado"} en penaltis (${final.shootout.us}-${final.shootout.them})`
    : `${won ? "Victoria" : drew ? "Empate" : "Derrota"} ${final.goalsFor}-${final.goalsAgainst}`;

  s.pending = null;
  s.lastOutcome = {
    title: label,
    text: final.unused
      ? "No entras en la convocatoria. Ves el partido desde la grada con la sensación de estar de sobra."
      : final.benchOnly
        ? "Noventa minutos en el banquillo, calentando dos veces sin llegar a entrar."
        : `${final.minutes}' disputados · valoración ${final.rating.toFixed(1)}${final.goals ? ` · ${final.goals} gol${final.goals > 1 ? "es" : ""}` : ""}${final.assists ? ` · ${final.assists} asistencia${final.assists > 1 ? "s" : ""}` : ""}.`,
    deltas,
    tone: won ? "good" : drew ? "neutral" : "bad",
    ...(share ? { share } : {}),
  };
  note(
    s,
    `${final.competition} · ${final.home ? "vs" : "en"} ${final.opponent} ${final.goalsFor}-${final.goalsAgainst}${final.minutes ? ` (${final.minutes}', ${final.rating.toFixed(1)})` : " (sin minutos)"}`,
    won ? "good" : drew ? "neutral" : "bad",
  );
  return touch(s);
}

function shareCard(s: GameState, headline: string, m?: MatchData): ShareData {
  const lines: { label: string; value: string }[] = [
    { label: "Edad", value: `${s.age} años` },
    { label: "Media", value: String(s.overall) },
    { label: "Club", value: clubById(s.clubId).short },
  ];
  if (m) lines.push({ label: "Partido", value: `${m.goalsFor}-${m.goalsAgainst} vs ${m.opponent}` });
  return { headline, kicker: `${seasonLabel(s.seasonIndex)} · ${stageLabel(s.stage)}`, lines };
}

/* ============================ Fin de temporada ============================ */

function seasonGrowth(s: GameState): number {
  const season = currentSeason(s);
  const apps = season?.apps ?? 0;
  const rating = apps ? (season!.ratingSum / apps) : 0;
  const room = s.potential - s.overall;
  const ageFactor = s.age <= 18 ? 1.3 : s.age <= 21 ? 1.1 : s.age <= 26 ? 0.8 : s.age <= 29 ? 0.4 : 0;

  // +1 de MEDIA debe notarse: el crecimiento por temporada es contenido.
  let g = Math.min(2.6, s.xp / 95);
  g += rating >= 7.2 ? 1.3 : rating >= 6.6 ? 0.8 : rating >= 6 ? 0.35 : rating > 0 ? 0.1 : 0;
  g += clubById(s.clubId).devBonus * 0.2;
  g += s.discipline >= 65 ? 0.3 : 0;
  g += s.player.traits.includes("ambicioso") ? 0.2 : 0;
  g -= s.injury?.severity === "severe" ? 1.4 : 0;
  g -= apps === 0 ? 1.2 : 0;
  g *= ageFactor;

  if (room <= 0) return s.age >= 30 ? -1 : Math.random() < 0.15 ? 1 : 0;
  const cap = s.age <= 21 ? 5 : 3;
  return Math.max(apps === 0 ? -1 : 0, Math.round(Math.min(g, cap, room * 0.3)));
}

function evaluatePromotion(s: GameState): { stage: Stage; title: string; text: string } | null {
  if (s.stage === "youth") {
    if (s.age >= 17 && (s.overall >= 62 || (s.age >= 18 && s.overall >= 58)) && s.rel.coach >= 34) {
      return {
        stage: "reserves",
        title: "Subes al filial",
        text: `El club te sube al filial. Hombres hechos, codos en las costillas y un baremo nuevo: aquí tu media ya no destaca.`,
      };
    }
    return null;
  }
  if (s.stage === "reserves") {
    const ready = s.overall >= 68 || (s.overall >= 66 && clubById(s.clubId).minutesBonus > 0);
    if (s.age >= 18 && ready && s.rel.coach >= 42) {
      return {
        stage: "first",
        title: "Ficha del primer equipo",
        text: `Te dan dorsal del primer equipo para la pretemporada. Vestuario nuevo, focos nuevos, cero garantías.`,
      };
    }
    return null;
  }
  return null;
}

function closeSeason(s: GameState): Outcome {
  const season = currentSeason(s);
  const before = snapshot(s);
  const apps = season?.apps ?? 0;
  const rating = apps ? (season!.ratingSum / apps) : 0;

  const growth = seasonGrowth(s);
  s.overall = clamp(s.overall + growth, 0, 100);
  s.xp = 0;
  s.age += 1;
  s.seasonIndex += 1;
  s.fitness = clamp(s.fitness + 12);
  s.form = clamp(50 + (rating - 6.2) * 5);
  s.tablePosition = 6 + Math.floor(Math.random() * 8);
  if (season) season.overall = s.overall;

  // Deriva del potencial: la irregularidad y las lesiones graves lo recortan.
  if (apps === 0 && Math.random() < 0.5) s.potential = Math.max(s.overall + 2, s.potential - 2);
  if (s.injury?.severity === "severe") s.potential = Math.max(s.overall + 1, s.potential - 3);
  if (rating >= 7.2 && Math.random() < 0.35) s.potential = Math.min(100, s.potential + 2);

  const promo = evaluatePromotion(s);
  if (promo) {
    s.stage = promo.stage;
    s.flags["status"] = 0;
    milestone(s, promo.title);
    achieve(s, promo.stage === "first" ? "filial" : "filial");
  }

  s.seasons.push(newSeasonRecord(s));
  s.queue = makeSeasonPlan(s);
  s.beat = 0;
  checkAchievements(s);
  const deltas = diff(before, s);
  note(
    s,
    `Fin de temporada ${season?.season}: ${apps} partidos, ${season?.goals ?? 0} goles, ${season?.assists ?? 0} asistencias. Media ${s.overall}.`,
    "gold",
  );

  const promoText = promo ? ` ${promo.text}` : "";
  return {
    title: `Temporada ${season?.season ?? ""} cerrada`,
    text: apps
      ? `${apps} partidos, ${season?.goals ?? 0} goles y ${season?.assists ?? 0} asistencias con valoración media ${rating.toFixed(1)}. Cumples ${s.age} años y tu media pasa a ${s.overall}.${promoText}`
      : `Temporada sin minutos oficiales. Cumples ${s.age} años y el curso que viene no admite excusas.${promoText}`,
    deltas,
    tone: "gold",
    ...(promo ? { share: shareCard(s, promo.title.toUpperCase()) } : {}),
  };
}

/* =============================== Utilidades =============================== */

export function checkAchievements(s: GameState): void {
  if (s.overall >= 70) achieve(s, "media_70");
  if (s.rel.fans >= 80) achieve(s, "idolo");
  if (s.agent.present) achieve(s, "representante");
  if (s.contract) achieve(s, "primer_contrato");
  if (s.stage === "reserves" || s.stage === "first") achieve(s, "filial");
  if (s.stage === "first") achieve(s, "entreno_mayores");
}

export function achievementList(s: GameState) {
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: s.achievements.includes(a.id) }));
}

export function statusLabel(s: GameState): string {
  if (s.injury) return `Lesionado · ${s.injury.label}`;
  const role = computeRole(s);
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

export function tierLabel(overall: number): string {
  if (overall >= 95) return "Histórico";
  if (overall >= 90) return "Élite mundial";
  if (overall >= 85) return "Estrella";
  if (overall >= 80) return "Jugador importante";
  if (overall >= 72) return "Consolidado en Primera";
  if (overall >= 66) return "Promesa avanzada";
  return "En formación";
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

export { seasonLabel, flag };
