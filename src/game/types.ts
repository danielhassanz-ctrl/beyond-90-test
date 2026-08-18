export type Position = "POR" | "DFC" | "LAT" | "MC" | "MCO" | "EXT" | "DC";

export type TraitId =
  | "ambicioso"
  | "leal"
  | "rebelde"
  | "familiar"
  | "profesional"
  | "carismatico";

export type Stage = "youth" | "reserves" | "first";

export interface ClubInfo {
  id: string;
  name: string;
  short: string;
  city: string;
  colors: string;
  development: string;
  competition: string;
  minutes: string;
  risk: string;
  devBonus: number;
  minutesBonus: number;
  prestige: number;
}

export interface SeasonRecord {
  season: string;
  age: number;
  club: string;
  stage: Stage;
  overall: number;
  apps: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  ratingSum: number;
  wins: number;
  draws: number;
  losses: number;
  milestones: string[];
}

export interface LogEntry {
  season: string;
  age: number;
  text: string;
  tone: "neutral" | "good" | "bad" | "gold";
}

export interface Relationships {
  coach: number;
  fans: number;
  dressing: number;
  agent: number;
  family: number;
}

export interface Player {
  name: string;
  nickname: string;
  position: Position;
  nationality: string;
  city: string;
  avatar: string | null;
  traits: TraitId[];
}

/* ======================= Texto libre ======================= */

export type Intent =
  | "professional"
  | "aggressive"
  | "defiant"
  | "conciliatory"
  | "humorous"
  | "evasive"
  | "ambitious"
  | "loyal"
  | "empty";

export interface Interpretation {
  intent: Intent;
  label: string;
  tone: "good" | "bad" | "neutral";
  intensity: number; // 0..1
  matched: string[];
}

/* ======================= Agente y memoria ======================= */

export interface AgentState {
  name: string;
  present: boolean;
  trust: number;
  commission: number;
  memories: string[];
  teaser: string | null;
  firedCount: number;
}

export interface NarrativeMemory {
  rejectedClubs: string[];
  conflicts: string[];
  promises: string[];
  threads: Record<string, number>;
  npcs: Record<string, { name: string; role: string; mood: number }>;
}

/* ======================= Ritmo de temporada ======================= */

export type SlotKind = "match" | "event" | "sim" | "agent" | "life";

export interface Slot {
  kind: SlotKind;
  /** Etiqueta narrativa del partido clave (debut, derbi, final…). */
  label?: string;
  /** Tipo de partido clave: derby, cup, final, exclub, scouts, decisive, debut. */
  tag?: "derby" | "cup" | "final" | "exclub" | "scouts" | "decisive" | "debut" | null;
  /** Rival forzado (id del banco de clubes). */
  opponentId?: string;
  /** Nº de partidos que se simulan en segundo plano. */
  matches?: number;
  /** Categoría preferida para la escena narrativa. */
  category?: EventCategory;
  tie?: boolean;
}

export interface MatchContext {
  competition: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  opponent: string;
  opponentShort: string;
  venue: string;
  venueCity: string;
  isHome: boolean;
  specialTag: string | null;
  derbyOpponent: string | null;
  storyLabel: string;
  tie: boolean;
}

export interface RecentResult {
  opponent: string;
  gf: number;
  ga: number;
  res: "W" | "D" | "L";
  played: boolean;
  goals: number;
  assists: number;
}

export interface Thread {
  id: string;
  kind: string;
  teaser: string;
  dueScene: number;
  payload: Record<string, string | number>;
}


export interface AutoBlock {
  title: string;
  text: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  apps: number;
  goals: number;
  assists: number;
  rating: number;
  position: number;
  formRun: ("W" | "D" | "L" | "-")[];
  missed: number;
}

export interface Injury {
  label: string;
  severity: "minor" | "medium" | "severe";
  matchesOut: number;
  treated: boolean;
}

/* ======================= Narrativa ======================= */

export interface Delta {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}

export interface ShareData {
  headline: string;
  kicker: string;
  lines: { label: string; value: string }[];
}

export interface Outcome {
  title: string;
  text: string;
  deltas: Delta[];
  tone: "good" | "bad" | "neutral" | "gold";
  share?: ShareData;
}

export interface FreeFormSpec {
  prompt: string;
  placeholder?: string;
  /** Reacciones por intención; si falta, se usa un texto genérico. */
  reactions?: Partial<Record<Intent, string>>;
}

export interface EventChoice {
  id: string;
  label: string;
  hint?: string;
  outcome: string | ((s: GameState) => string);
  apply: (s: GameState) => void;
}

export type EventCategory = "story" | "training" | "life" | "press" | "agent" | "gossip" | "medical";

export interface GameEvent {
  id: string;
  kicker: string;
  title: string;
  image: SceneKey;
  text: string | ((s: GameState) => string);
  priority?: number;
  category?: EventCategory;
  freeform?: FreeFormSpec;
  /** Aplica la respuesta libre interpretada localmente. */
  applyFree?: (s: GameState, i: Interpretation) => void;
  requires: (s: GameState) => boolean;
  choices: EventChoice[];
}

export type SceneKey =
  | "training"
  | "locker"
  | "match"
  | "agent"
  | "injury"
  | "family"
  | "tunnel";

export interface MatchMoment {
  minute: number;
  text: string;
  tone: "good" | "bad" | "neutral";
}

export interface KeyMoment {
  prompt: string;
  minute: number;
  options: { id: string; label: string; success: number; note: string }[];
}

export interface MatchData {
  /** Contexto ÚNICO del partido: rival, estadio, competición, etiqueta. */
  ctx: MatchContext;
  label: string;
  competition: string;
  home: boolean;
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  minutes: number;
  goals: number;
  assists: number;
  rating: number;
  moments: MatchMoment[];
  keyMoment?: KeyMoment | undefined;
  benchOnly: boolean;
  unused: boolean;
  tie: boolean;
  shootout?: { us: number; them: number } | undefined;
  debut: boolean;
}

/** Tarjeta dinámica generada por el motor (agente, lesión, oferta, regreso…). */
export interface DynamicCard {
  type: "dynamic";
  kind: string;
  data: Record<string, string | number | boolean | null>;
}

export type Card =
  | { type: "event"; eventId: string }
  | { type: "match"; match: MatchData }
  | { type: "season"; summary: Outcome }
  | DynamicCard;

export interface EventLogEntry {
  id: string;
  category: EventCategory;
  scene: number;
}

export interface ClubOfferRef {
  clubId: string;
  role: "elite" | "cantera" | "camino" | "alternativa";
  pitch: string;
}

export interface GameState {
  version: number;
  createdAt: number;
  updatedAt: number;
  player: Player;
  clubId: string;
  stage: Stage;
  age: number;
  seasonIndex: number;
  /** Índice de escena dentro de la temporada (informativo). */
  beat: number;
  /** Contador global de escenas: base de cooldowns y de los hilos pendientes. */
  sceneCount: number;
  queue: Slot[];
  /** Ofertas iniciales de cantera generadas para esta carrera. */
  offers: ClubOfferRef[];
  /** Resultados recientes (incluye simulados en segundo plano). */
  recent: RecentResult[];
  /** Hilos narrativos abiertos: teaser hoy, resolución en 1-4 escenas. */
  threads: Thread[];
  /** Historial de eventos vistos con categoría y escena, para anti-repetición. */
  eventHistory: EventLogEntry[];
  overall: number;
  potential: number;
  xp: number;
  form: number;
  fitness: number;
  morale: number;
  discipline: number;
  fame: number;
  injury: Injury | null;
  hasAgent: boolean;
  agentName: string;
  agent: AgentState;
  memory: NarrativeMemory;
  contract: string | null;
  salary: number;
  tablePosition: number;
  rel: Relationships;
  seenEvents: string[];
  flags: Record<string, number>;
  seasons: SeasonRecord[];
  log: LogEntry[];
  achievements: string[];
  onboarded: boolean;
  pending: Card | null;
  lastOutcome: Outcome | null;
}

