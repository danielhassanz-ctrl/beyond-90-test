import { ACHIEVEMENTS, AGENT_NAMES, clubById, clubDef } from "./data";
import { buildOffers, derbyRivalOf } from "./clubs";
import {
  ageDecline,
  ageGrowthFactor,
  buildMarketProposal,
  careerSummary,
  europeanCompetition,
  nationalCallup,
  overallCeiling,
  seasonHonours,
  shouldRetire,
} from "./career";
import { randomSuitor, resolveDynamic } from "./dynamic";
import { eventById } from "./events";
import { directorCard, directorNewSeason } from "./director";
import { interpretFree, INTENT_FEEDBACK } from "./interpret";
import { applyFreeFallback } from "./events-extra";
import {
  achieve,
  adjustForm,
  avgRating,
  clamp,
  currentSeason,
  decayRelations,
  driftForm,
  flag,
  milestone,
  note,
  rel as relSoft,
  seasonLabel,
  totalApps,
} from "./mutate";
import { closeThread, dueThread, maybeSpawnThreads } from "./threads";
import { baselineOverall, computeRole, pick, simulateMatch, simulateRun, validateMatch, type SimRun } from "./match";
import { ensureFinance, moneyCard, netWorth, seasonFinance } from "./finance";
import { consequenceCard } from "./consequences";
import type {
  AgentState,
  Card,
  Delta,
  DynamicCard,
  EventCategory,
  GameState,
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
  const careerSeed = Math.floor(Math.random() * 1_000_000) + 1;
  return {
    version: STATE_VERSION,
    careerSeed,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    player,
    clubId: "",
    stage: "youth",
    age: 16,
    seasonIndex: 0,
    beat: 0,
    sceneCount: 0,
    queue: [],
    offers: buildOffers(player.city, careerSeed),
    recent: [],
    threads: [],
    eventHistory: [],

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

  // Campos nuevos de Fase 3.
  ensureRuntime(s);

  // Estructura de ritmo nueva: si el save es antiguo, se replanifica la temporada.
  if (!Array.isArray(s.queue) || s.queue.length === 0 || s.queue.some((q) => (q.kind as string) === "block")) {
    s.queue = s.clubId ? makeSeasonPlan(s) : [];
    s.pending = null;
    s.lastOutcome = null;
  }
  const validCards = ["event", "match", "season", "dynamic"];
  if (s.pending && !validCards.includes(s.pending.type)) s.pending = null;
  if (s.pending?.type === "match" && !s.pending.match?.ctx) s.pending = null;
  return s;
}

/** Inicializa las estructuras de Fase 3 en partidas antiguas o corruptas. */
export function ensureRuntime(s: GameState): void {
  ensureFinance(s);
  if (s.lastMatch === undefined) s.lastMatch = null;
  if (typeof s.sceneCount !== "number" || !Number.isFinite(s.sceneCount)) s.sceneCount = 0;
  if (!Array.isArray(s.recent)) s.recent = [];
  if (!Array.isArray(s.threads)) s.threads = [];
  if (!Array.isArray(s.eventHistory)) s.eventHistory = [];
  if (!Array.isArray(s.offers) || s.offers.length < 4) s.offers = buildOffers(s.player?.city ?? "");
  if (!s.memory.threads || typeof s.memory.threads !== "object") s.memory.threads = {};
  if (!s.memory.npcs || typeof s.memory.npcs !== "object") s.memory.npcs = {};
  if (typeof s.careerSeed !== "number" || !Number.isFinite(s.careerSeed)) {
    s.careerSeed = Math.floor(Math.random() * 1_000_000) + 1;
  }
  // FASE 6: campos de carrera profesional (saves antiguos incluidos).
  if (!Array.isArray(s.titles)) s.titles = [];
  if (!Array.isArray(s.awards)) s.awards = [];
  if (typeof s.wealth !== "number" || !Number.isFinite(s.wealth)) s.wealth = 0;
  if (typeof s.contractYears !== "number" || !Number.isFinite(s.contractYears)) s.contractYears = s.contract ? 2 : 0;
  if (s.retired !== true) s.retired = false;
  if (s.pendingMarket === undefined) s.pendingMarket = null;
}

/* ============================ Plan de temporada ============================ */

type KeySpec = { tag: NonNullable<Slot["tag"]>; tie?: boolean; opponentId?: string; competition?: string };

/**
 * Una final solo es plausible si el jugador está en un equipo competitivo, ya
 * es profesional y ha ganado eliminatorias esta temporada. Si no, el partido
 * clave es una eliminatoria o una jornada decisiva, nunca una final regalada.
 */
function finalPlausible(s: GameState): boolean {
  if (s.stage !== "first") return false;
  const club = clubDef(s.clubId);
  if (club.prestige < 4) return false;
  if (s.overall < 70) return false;
  return (s.flags["copa_rondas"] ?? 0) >= 2;
}

function keyMatchSpecs(s: GameState): KeySpec[] {
  const debut = !s.achievements.includes(s.stage === "first" ? "debut_pro" : "debut_juvenil");
  const derby = derbyRivalOf(clubDef(s.clubId));
  const specs: KeySpec[] = [
    { tag: debut ? "debut" : "scouts" },
    ...(derby ? [{ tag: "derby" as const, opponentId: derby.id }] : []),
    { tag: "decisive" },
    { tag: "cup", tie: true },
    { tag: "scouts" },
    { tag: "decisive" },
  ];
  // FASE 6: si el club juega competición europea, uno de los partidos clave lo es.
  const euro = europeanCompetition(s);
  if (euro) specs.splice(2, 0, { tag: "euro", tie: true, competition: euro });
  if (s.memory.rejectedClubs.length > 0 && Math.random() < 0.6) specs.splice(3, 0, { tag: "exclub" });
  else if (finalPlausible(s) && Math.random() < 0.6) specs.push({ tag: "final", tie: true });
  else specs.push({ tag: "cup", tie: true });
  return specs.slice(0, 7);
}

const NARRATIVE_ROTATION: EventCategory[] = ["life", "training", "press", "story", "gossip", "life", "agent", "press"];

/**
 * Una temporada = 6-7 escenas deportivas clave + jornadas simuladas en segundo
 * plano + 10-14 escenas narrativas interactivas. Nunca dos pantallas
 * informativas seguidas y nunca dos partidos seguidos (salvo eliminatoria).
 */
export function makeSeasonPlan(s: GameState): Slot[] {
  directorNewSeason(s);
  const keys = keyMatchSpecs(s);
  const totalSim = Math.max(0, MATCHES_PER_SEASON - keys.length);
  const per = Math.max(2, Math.floor(totalSim / keys.length));
  const slots: Slot[] = [];
  let rotation = 0;
  const narrative = (): Slot => ({ kind: "event", category: NARRATIVE_ROTATION[rotation++ % NARRATIVE_ROTATION.length]! });

  // PRETEMPORADA: 1-2 huecos narrativos como máximo (el director dosifica).
  const preCount = 1 + (Math.floor(Math.random() * 2));
  for (let i = 0; i < preCount; i++) slots.push({ kind: "event", category: "preseason" });
  if (s.agent.present && Math.random() < 0.35) slots.push({ kind: "agent" });

  keys.forEach((k, idx) => {
    const before = idx === 0 ? 1 : 1 + (Math.random() < 0.4 ? 1 : 0);
    for (let i = 0; i < before; i++) slots.push(narrative());
    if (idx === 3) slots.push({ kind: "agent" });

    slots.push({
      kind: "match",
      tag: k.tag,
      ...(k.tie ? { tie: true } : {}),
      ...(k.opponentId ? { opponentId: k.opponentId } : {}),
      ...(k.competition ? { competition: k.competition } : {}),
    });
    const remainder = idx === keys.length - 1 ? totalSim - per * (keys.length - 1) : per;
    slots.push({ kind: "sim", matches: Math.max(2, remainder) });
    slots.push(narrative());
  });
  slots.push(narrative());
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

/**
 * Elige la siguiente escena y la deja en state.pending.
 * Nunca deja como escena principal una pantalla puramente informativa: los
 * partidos que el jugador no disputa se resuelven en segundo plano y solo
 * generan escena si ha ocurrido algo digno de contar.
 */
export function advance(state: GameState): GameState {
  const s = clone(state);
  s.lastOutcome = null;
  s.beat += 1;
  ensureRuntime(s);

  // FASE 6 · 0. Carrera terminada: solo queda el balance final.
  if (s.retired) {
    const sum = careerSummary(s);
    s.pending = dyn("career_end", {
      tier: sum.tier,
      apps: sum.apps,
      goals: sum.goals,
      titles: sum.titles.length,
      awards: sum.awards.length,
      peak: sum.peakOverall,
      wealth: sum.wealth,
    });
    return touch(s);
  }

  // FASE 6 · 0b. Mercado o retirada pendientes tras el cierre de temporada.
  if (s.pendingMarket) {
    s.pending = s.pendingMarket;
    s.pendingMarket = null;
    return touch(s);
  }

  // FASE 6 · 0c. Cambio de club: replanifica la temporada con el club nuevo.
  if (s.flags["replan"] === 1) {
    s.flags["replan"] = 0;
    s.queue = makeSeasonPlan(s);
  }

  for (let guard = 0; guard < 16; guard++) {
    // 1. Lesión sin diagnosticar: siempre manda.
    if (s.injury && !s.injury.treated) {
      s.pending = dyn("injury_diagnosis", {
        label: s.injury.label,
        severity: s.injury.severity,
        matchesOut: s.injury.matchesOut,
      });
      return touch(s);
    }

    // 1b. Consecuencia de una relación en el límite: el mundo reacciona.
    const cons = consequenceCard(s);
    if (cons) {
      s.pending = cons;
      return touch(s);
    }

    // 2. Regreso pendiente.
    if (!s.injury && s.flags["volvio_pendiente"] === 1) {
      s.flags["volvio_pendiente"] = 0;
      s.pending = dyn("return", { label: s.memory.lastInjuryLabel || "La lesión" });
      return touch(s);
    }

    // 3. Hilo narrativo que vence: resolución de una anticipación previa.
    const thread = dueThread(s);
    if (thread) {
      s.pending = dyn("thread", {
        threadId: thread.id,
        threadKind: thread.kind,
        teaser: thread.teaser,
        clubName: typeof thread.payload["clubName"] === "string" ? thread.payload["clubName"] : null,
      });
      return touch(s);
    }

    // 4. Fin de temporada.
    if (s.queue.length === 0) {
      s.pending = { type: "season", summary: closeSeason(s) };
      return touch(s);
    }

    const slot = s.queue.shift()!;

    if (slot.kind === "sim") {
      const run = applyRun(s, slot.matches ?? 3);
      if (run.notable) {
        // Lo simulado nunca es una pantalla informativa: solo abre escena si la
        // consecuencia es interactiva (conflicto, expulsión, ostracismo, crisis).
        const interactive = ["red", "snub", "crisis", "bad", "injury"].includes(run.notable.kind);
        note(s, run.notable.text, interactive ? "bad" : "good");
        if (interactive) {
          s.pending = dyn("match_flash", {
            kind: run.notable.kind,
            text: run.notable.text,
            opponent: run.notable.opponent,
            wins: run.wins,
            draws: run.draws,
            losses: run.losses,
            goals: run.goals,
            matches: run.matches,
          });
          return touch(s);
        }
      }
      continue; // sin escena: el siguiente clic lleva a una decisión real
    }

    if (slot.kind === "match") {
      if (s.injury) {
        applyRun(s, 3);
        continue;
      }
      s.pending = { type: "match", match: simulateMatch(s, slot, s.beat) };
      return touch(s);
    }

    if (slot.kind === "agent") {
      const card = agentCard(s);
      if (card) {
        s.pending = card;
        return touch(s);
      }
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

    // Decisiones de dinero: solo cuando la economía las justifica.
    if (slot.kind === "life" || slot.kind === "event") {
      const money = moneyCard(s);
      if (money) {
        s.pending = money;
        return touch(s);
      }
    }

    s.flags["pretemporada"] = slot.category === "preseason" ? 1 : 0;

    // NARRATIVE DIRECTOR: única fuente de escenas de carrera. No hay fallback
    // al selector antiguo; si no hay escena válida, se avanza tiempo.
    const dirCard = directorCard(s);
    if (dirCard) {
      s.pending = dirCard;
      return touch(s);
    }

    const card = agentCard(s);
    if (card) {
      s.pending = card;
      return touch(s);
    }

    // Nada narrativo válido: avanzamos semanas de calendario.
    applyRun(s, 2);
  }

  // RITMO: con el director dosificado, muchos huecos son rutina. Si tras el
  // recorrido no ha salido escena y la temporada sigue viva, contamos el
  // tramo de calendario en vez de cerrar la temporada por agotamiento.
  if (s.queue.length > 0) {
    const run = applyRun(s, 3);
    s.pending = dyn("match_flash", {
      kind: run.notable?.kind ?? "run",
      text: run.notable?.text ?? "Semanas de rutina: entrenar, viajar, competir.",
      opponent: run.notable?.opponent ?? "",
      wins: run.wins,
      draws: run.draws,
      losses: run.losses,
      goals: run.goals,
      matches: run.matches,
    });
    return touch(s);
  }

  s.pending = { type: "season", summary: closeSeason(s) };
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
  if (s.fame >= 30 && Math.random() < 0.5) {
    const teaser = pick([
      "Ha llamado un club importante preguntando por ti",
      "Hay un ojeador que ha pedido tus últimos tres partidos en vídeo",
      "Me han preguntado por tu cláusula desde fuera de España",
    ]);
    s.agent.teaser = teaser;
    return dyn("agent_teaser", { teaser });
  }
  if (s.agent.trust >= 50 && Math.random() < 0.3) {
    return dyn("agent_commission", { commission: Math.min(15, s.agent.commission + 2) });
  }
  if (Math.random() < 0.3) {
    return dyn("agent_check", {
      topic: pick(["minutos", "prensa", "dinero", "vida"]),
      hour: pick(["23:17", "07:40", "14:05", "22:58"]),
    });
  }
  return null;
}

/* ============ Partidos resueltos en SEGUNDO PLANO (sin pantalla) ============ */

function applyRun(s: GameState, count: number): SimRun {
  const run = simulateRun(s, count);
  const season = currentSeason(s);
  if (season) {
    season.apps += run.apps;
    season.goals += run.goals;
    season.assists += run.assists;
    season.ratingSum += run.ratingSum;
    season.cleanSheets += run.cleanSheets;
    season.wins += run.wins;
    season.draws += run.draws;
    season.losses += run.losses;
  }

  s.recent = [...run.results, ...(s.recent ?? [])].slice(0, 8);

  if (run.apps > 0) {
    const perf = run.ratingSum / run.apps - 6.2;
    adjustForm(s, perf * 7);
    s.morale = clamp(s.morale + perf * 4 + (run.wins > run.losses ? 3 : -2));
    s.fitness = clamp(s.fitness - Math.min(9, run.apps * 2));
    relSoft(s, "coach", perf * 3);
    relSoft(s, "fans", perf * 2 + run.goals * 2);
    s.fame = clamp(s.fame + run.goals + (s.stage === "first" ? 2 : 1));
    s.xp += run.apps * 2 + run.goals * 3 + Math.max(0, perf * 6);
  } else if (!s.injury) {
    adjustForm(s, -4);
    s.morale = clamp(s.morale - 4);
    s.fitness = clamp(s.fitness + 5);
    relSoft(s, "coach", -1);
  }

  if (s.injury) {
    s.injury.matchesOut -= count;
    s.fitness = clamp(s.fitness + 5);
    if (s.injury.matchesOut <= 0) {
      s.flags["volvio_pendiente"] = 1;
      note(s, `Alta médica: ${s.injury.label} superada.`, "good");
      s.injury = null;
    }
  }

  s.tablePosition = clamp(
    (s.tablePosition || 8) + (run.wins > run.losses ? -1 : run.losses > run.wins ? 1 : 0),
    1,
    20,
  );

  if (!s.injury && s.fitness < 42 && Math.random() < 0.2) {
    const severe = s.flags["riesgo_recaida"] === 1 && Math.random() < 0.4;
    s.injury = {
      label: severe ? "Recaída muscular grave" : "Sobrecarga muscular",
      severity: severe ? "severe" : "minor",
      matchesOut: severe ? 10 + Math.floor(Math.random() * 6) : 2 + Math.floor(Math.random() * 3),
      treated: false,
    };
    s.flags["riesgo_recaida"] = 0;
  }

  note(
    s,
    `${run.matches} jornadas en segundo plano: ${run.wins}V ${run.draws}E ${run.losses}D · ${run.goals}G ${run.assists}A`,
    run.wins > run.losses ? "good" : run.losses > run.wins ? "bad" : "neutral",
  );
  return run;
}


/* ========================= Resolución de escenas ========================= */

function logEvent(s: GameState, id: string, category: EventCategory | undefined): void {
  if (!Array.isArray(s.eventHistory)) s.eventHistory = [];
  s.eventHistory.unshift({ id, category: category ?? "life", scene: s.sceneCount ?? 0 });
  s.eventHistory = s.eventHistory.slice(0, 60);
}

export function resolveEvent(state: GameState, eventId: string, choiceId: string): GameState {
  const s = clone(state);
  ensureRuntime(s);
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
  logEvent(s, eventId, event.category);
  finishScene(s, event.title, outcomeText, before);
  return touch(s);
}

export function resolveEventFree(state: GameState, eventId: string, text: string): GameState {
  const s = clone(state);
  ensureRuntime(s);
  const event = eventById(eventId);
  if (!event) return advance(s);
  const before = snapshot(s);
  const interp = interpretFree(text ?? "");
  const reaction = event.freeform?.reactions?.[interp.intent] ?? INTENT_FEEDBACK[interp.intent];
  try {
    if (event.applyFree) event.applyFree(s, interp);
    else applyFreeFallback(s, interp);
  } catch {
    /* respuesta libre nunca debe romper el juego */
  }
  if (!s.seenEvents.includes(eventId)) s.seenEvents.push(eventId);
  logEvent(s, eventId, event.category);
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
  ensureRuntime(s);
  const before = snapshot(s);
  let result;
  try {
    result = resolveDynamic(s, card, choiceId, freeText);
  } catch {
    result = { title: "Sigues adelante", text: "La semana pasa sin más.", tone: "neutral" as const };
  }
  if (card.kind === "injury_diagnosis" && s.injury) {
    // Se conserva el nombre real de la lesión para la escena de regreso.
    s.memory.lastInjuryLabel = s.injury.label;
    // Una lesión menor no genera arco: se resuelve sin escena de regreso extra.
    s.flags["volvio_pendiente"] = s.injury.severity === "minor" ? 0 : 1;
  }
  if (card.kind === "thread") {
    const id = typeof card.data["threadId"] === "string" ? card.data["threadId"] : "";
    if (id) closeThread(s, id);
  }
  s.pending = null;
  const deltas = diff(before, s);
  s.lastOutcome = { title: result.title, text: result.text, deltas, tone: result.tone, ...(result.share ? { share: result.share } : {}) };
  afterScene(s);
  checkAchievements(s);
  note(s, `${result.title}: ${result.text}`, result.tone === "gold" ? "gold" : result.tone);
  return touch(s);
}

/** Cierre común de cualquier escena: contador, derivas y hilos nuevos. */
function afterScene(s: GameState): void {
  s.sceneCount = (s.sceneCount ?? 0) + 1;
  driftForm(s);
  if (s.sceneCount % 3 === 0) decayRelations(s);
  maybeSpawnThreads(s);
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
  afterScene(s);
  note(s, `${title}: ${text}`, "neutral");
}


export function resolveMatch(state: GameState, match: MatchData, keyChoiceId?: string): GameState {
  const s = clone(state);
  const before = snapshot(s);
  const m: MatchData = clone(match);
  let keyText = "";
  let keyOk: boolean | null = null;
  let keyId = "";

  if (m.keyMoment && keyChoiceId) {
    const option = m.keyMoment.options.find((o) => o.id === keyChoiceId) ?? m.keyMoment.options[0]!;
    const success = Math.random() < option.success;
    keyOk = success;
    keyId = option.id;

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
      const tone: "good" | "bad" =
        keyText.startsWith("No sale") || keyText.includes("fallado") || keyText.includes("Ridículo") || keyText.includes("lo falla")
          ? "bad"
          : "good";
      m.moments.push({ minute: m.keyMoment.minute, text: keyText, tone });
      const penalty = keyId === "panenka" || keyId === "tiro_penalti" || keyId === "penalti" || keyId === "ceder";
      const verdict = penalty
        ? keyId === "ceder"
          ? keyOk
            ? "GOL DE TU COMPAÑERO"
            : "PENALTI FALLADO"
          : keyOk
            ? "¡GOL!"
            : "PARADA / FUERA"
        : keyOk
          ? "SALE BIEN"
          : "NO SALE";
      m.keyResult = { minute: m.keyMoment.minute, verdict, text: keyText, tone };
    }
  }


  // Fuente única de verdad: se validan invariantes antes de mostrar nada.
  const final = validateMatch(m);
  s.lastMatch = final;

  const season = currentSeason(s);
  const won = final.shootout ? final.shootout.us > final.shootout.them : final.goalsFor > final.goalsAgainst;
  const drew = !final.shootout && final.goalsFor === final.goalsAgainst;
  // Progreso real de copa: una final solo puede existir tras superar rondas.
  if (final.ctx.competition === "Copa del Rey") {
    s.flags["copa_rondas"] = won ? (s.flags["copa_rondas"] ?? 0) + 1 : 0;
  }
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
    adjustForm(s, final.benchOnly ? -2 : -4);
    s.morale = clamp(s.morale - (final.benchOnly ? 2 : 5));
    s.fitness = clamp(s.fitness + 3);
    relSoft(s, "coach", -1);
  } else {
    const perf = final.rating - 6.2;
    adjustForm(s, perf * 7);
    s.morale = clamp(s.morale + perf * 4 + (won ? 4 : drew ? 0 : -3));
    s.fitness = clamp(s.fitness - Math.round(final.minutes / 20));
    relSoft(s, "coach", perf * 2.5);
    relSoft(s, "fans", perf * 2 + final.goals * 3);
    relSoft(s, "dressing", perf > 0 ? 1 : 0);
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
  s.recent = [
    {
      opponent: final.ctx.opponentShort,
      gf: final.goalsFor,
      ga: final.goalsAgainst,
      res: (won ? "W" : drew ? "D" : "L") as "W" | "D" | "L",
      played: final.minutes > 0,
      goals: final.goals,
      assists: final.assists,
    },
    ...(s.recent ?? []),
  ].slice(0, 8);
  checkAchievements(s);
  const deltas = diff(before, s);
  const label = final.shootout
    ? `${won ? "Pasas" : "Eliminado"} en penaltis (${final.shootout.us}-${final.shootout.them})`
    : `${won ? "Victoria" : drew ? "Empate" : "Derrota"} ${final.goalsFor}-${final.goalsAgainst}`;

  s.pending = null;
  s.lastOutcome = {
    title: label,
    text: final.unused
      ? `No entras en la convocatoria para ${final.ctx.isHome ? "el partido en casa" : `viajar a ${final.ctx.venueCity}`}. Lo ves con la sensación de estar de sobra.`
      : final.benchOnly
        ? `Noventa minutos en el banquillo de ${final.ctx.venue}, calentando dos veces sin llegar a entrar.`
        : `${final.minutes}' disputados en ${final.ctx.venue} · valoración ${final.rating.toFixed(1)}${final.goals ? ` · ${final.goals} gol${final.goals > 1 ? "es" : ""}` : ""}${final.assists ? ` · ${final.assists} asistencia${final.assists > 1 ? "s" : ""}` : ""}.`,
    deltas,
    tone: won ? "good" : drew ? "neutral" : "bad",
    ...(share ? { share } : {}),
  };
  afterScene(s);
  note(
    s,
    `${final.ctx.competition} · ${final.ctx.homeTeam} ${final.ctx.isHome ? final.goalsFor : final.goalsAgainst}-${final.ctx.isHome ? final.goalsAgainst : final.goalsFor} ${final.ctx.awayTeam}${final.minutes ? ` (${final.minutes}', ${final.rating.toFixed(1)})` : " (sin minutos)"}`,
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
  const ceiling = overallCeiling(s);
  const room = ceiling - s.overall;
  const ageFactor = ageGrowthFactor(s.age);
  const decline = ageDecline(s);

  // +1 de MEDIA debe notarse: el crecimiento por temporada es contenido.
  let g = Math.min(2.6, s.xp / 95);
  g += rating >= 7.2 ? 1.3 : rating >= 6.6 ? 0.8 : rating >= 6 ? 0.35 : rating > 0 ? 0.1 : 0;
  g += clubById(s.clubId).devBonus * 0.2;
  g += s.discipline >= 65 ? 0.3 : 0;
  g += s.player.traits.includes("ambicioso") ? 0.2 : 0;
  g -= s.injury?.severity === "severe" ? 1.4 : 0;
  g -= apps === 0 ? 1.2 : 0;
  g *= ageFactor;

  // Declive: a partir de los 31 la edad pesa más que el trabajo.
  if (decline > 0) return -decline;
  if (room <= 0) return Math.random() < 0.15 && ageFactor > 0 ? 1 : 0;
  const cap = s.age <= 21 ? 5 : 3;
  return Math.max(apps === 0 ? -1 : 0, Math.round(Math.min(g, cap, room * 0.35)));
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

  // FASE 6: títulos, premios, selección y economía antes de cambiar de curso.
  const honours = seasonHonours(s);
  const euro = europeanCompetition(s);
  if (euro) note(s, `El club jugará ${euro} la próxima temporada.`, "good");
  if (nationalCallup(s) && !s.achievements.includes("internacional")) {
    achieve(s, "internacional");
    milestone(s, "Primera convocatoria con la selección absoluta.");
    note(s, "El seleccionador te llama por primera vez.", "gold");
  }
  const fin = seasonFinance(s);
  const earned = Math.max(0, fin.net);

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

  // FASE 6: contrato, mercado y retirada. La escena se muestra tras el resumen.
  if (s.contractYears && s.contractYears > 0) s.contractYears -= 1;
  s.pendingMarket = null;
  if (shouldRetire(s)) {
    s.pendingMarket = dyn("retirement", { age: s.age, tier: careerSummary(s).tier });
  } else {
    const proposal = buildMarketProposal(s);
    if (proposal && (proposal.kind !== "renewal" || (s.contractYears ?? 0) <= 1)) {
      s.pendingMarket = dyn("market_offer", {
        kind: proposal.kind,
        clubId: proposal.clubId,
        clubName: proposal.clubName,
        salary: proposal.salary,
        years: proposal.years,
        reason: proposal.reason,
      });
    }
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
  const honourText = honours.titles.length || honours.awards.length
    ? ` Palmarés del curso: ${[...honours.titles, ...honours.awards].join(", ")}.`
    : "";
  const moneyText = ` Balance económico: ${fin.income}.000 € ingresados, ${fin.spend}.000 € de gastos${earned > 0 ? `, ${earned}.000 € ahorrados` : ""}. Patrimonio neto: ${netWorth(s)}.000 €.`;
  return {
    title: `Temporada ${season?.season ?? ""} cerrada`,
    text: apps
      ? `${apps} partidos, ${season?.goals ?? 0} goles y ${season?.assists ?? 0} asistencias con valoración media ${rating.toFixed(1)}. Cumples ${s.age} años y tu media pasa a ${s.overall}.${honourText}${moneyText}${promoText}`
      : `Temporada sin minutos oficiales. Cumples ${s.age} años y el curso que viene no admite excusas.${moneyText}${promoText}`,
    deltas,
    tone: "gold",
    ...(promo
      ? { share: shareCard(s, promo.title.toUpperCase()) }
      : honours.titles.length || honours.awards.length
        ? { share: shareCard(s, [...honours.titles, ...honours.awards][0]!.toUpperCase()) }
        : {}),
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
  if ((s.titles ?? []).length >= 1) achieve(s, "primer_titulo");
  if ((s.awards ?? []).length >= 1) achieve(s, "premio_individual");
  if (s.overall >= 85) achieve(s, "media_85");
  if ((s.awards ?? []).includes("Balón de Oro")) achieve(s, "balon_oro");
  if (s.retired) achieve(s, "retirada");
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
