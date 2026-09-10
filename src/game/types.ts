export type Position = "POR" | "DFC" | "LAT" | "MC" | "MCO" | "EXT" | "DC";
export type CareerMode = "express" | "standard" | "pro";

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

export interface Relationships { coach: number; fans: number; dressing: number; agent: number; family: number; }

export interface Player {
  name: string; nickname: string; position: Position; nationality: string; city: string; avatar: string | null; traits: TraitId[];
}

export type Intent = "professional" | "aggressive" | "defiant" | "conciliatory" | "humorous" | "evasive" | "ambitious" | "loyal" | "empty";
export interface Interpretation { intent: Intent; label: string; tone: "good" | "bad" | "neutral"; intensity: number; matched: string[]; }

export interface AgentState { name: string; present: boolean; trust: number; commission: number; memories: string[]; teaser: string | null; firedCount: number; }

export interface NarrativeMemory {
  rejectedClubs: string[];
  conflicts: string[];
  promises: string[];
  threads: Record<string, number>;
  npcs: Record<string, { name: string; role: string; mood: number }>;
  lastInjuryLabel?: string | null;
  /** Reparto persistente de la biografía: representante/entorno, míster, fisio, capitán, compañero y contacto social. */
  careerCast?: import("./career-life").CareerCast;
}

export type SlotKind = "match" | "event" | "sim" | "agent" | "life";
export interface Slot {
  kind: SlotKind;
  label?: string;
  tag?: "derby" | "cup" | "final" | "exclub" | "scouts" | "decisive" | "debut" | "euro" | null;
  competition?: string;
  opponentId?: string;
  matches?: number;
  category?: EventCategory;
  tie?: boolean;
}

export interface MatchContext { competition: string; round: string; homeTeam: string; awayTeam: string; opponent: string; opponentShort: string; venue: string; venueCity: string; isHome: boolean; specialTag: string | null; derbyOpponent: string | null; storyLabel: string; tie: boolean; }
export interface RecentResult { opponent: string; gf: number; ga: number; res: "W" | "D" | "L"; played: boolean; goals: number; assists: number; }
export interface Thread { id: string; kind: string; teaser: string; dueScene: number; payload: Record<string, string | number>; }
export interface AutoBlock { title: string; text: string; matches: number; wins: number; draws: number; losses: number; apps: number; goals: number; assists: number; rating: number; position: number; formRun: ("W" | "D" | "L" | "-")[]; missed: number; }
export interface Injury { label: string; severity: "minor" | "medium" | "severe"; matchesOut: number; treated: boolean; }

export interface Delta { label: string; value: string; tone: "good" | "bad" | "neutral"; }
export interface ShareData { headline: string; kicker: string; lines: { label: string; value: string }[]; }
export interface Outcome { title: string; text: string; deltas: Delta[]; tone: "good" | "bad" | "neutral" | "gold"; share?: ShareData; }
export interface FreeFormSpec { prompt: string; placeholder?: string; reactions?: Partial<Record<Intent, string>>; }
export interface EventChoice { id: string; label: string; hint?: string; outcome: string | ((s: GameState) => string); apply: (s: GameState) => void; }

export type EventCategory = "story" | "training" | "life" | "press" | "agent" | "gossip" | "medical" | "preseason" | "club" | "market";
export interface GameEvent { id: string; kicker: string; title: string; image: SceneKey; text: string | ((s: GameState) => string); priority?: number; category?: EventCategory; family?: string; rare?: boolean; freeform?: FreeFormSpec; applyFree?: (s: GameState, i: Interpretation) => void; requires: (s: GameState) => boolean; choices: EventChoice[]; }
export type SceneKey = "training" | "locker" | "match" | "agent" | "injury" | "family" | "tunnel" | "press" | "stadium" | "office" | "gym" | "travel" | "celebration";
export interface MatchMoment { minute: number; text: string; tone: "good" | "bad" | "neutral"; }
export interface KeyMoment { prompt: string; minute: number; options: { id: string; label: string; success: number; note: string }[]; }
export interface MatchData { ctx: MatchContext; label: string; competition: string; home: boolean; opponent: string; goalsFor: number; goalsAgainst: number; minutes: number; goals: number; assists: number; rating: number; moments: MatchMoment[]; keyMoment?: KeyMoment | undefined; keyResult?: { minute: number; verdict: string; text: string; tone: "good" | "bad" | "neutral" } | undefined; benchOnly: boolean; unused: boolean; tie: boolean; shootout?: { us: number; them: number } | undefined; debut: boolean; }
export interface DynamicCard { type: "dynamic"; kind: string; data: Record<string, string | number | boolean | null>; }
export type Card = { type: "event"; eventId: string } | { type: "match"; match: MatchData } | { type: "season"; summary: Outcome } | DynamicCard;
export interface EventLogEntry { id: string; category: EventCategory; scene: number; }
export interface ClubOfferRef { clubId: string; role: "elite" | "cantera" | "camino" | "alternativa"; pitch: string; }

export interface GameState {
  version: number;
  careerSeed?: number;
  /** Ritmo elegido al crear la carrera; saves antiguos migran a Standard. */
  careerMode: CareerMode;
  storyRoute?: string;
  director?: import("./director").DirectorState;
  createdAt: number; updatedAt: number; player: Player; clubId: string; stage: Stage; age: number; seasonIndex: number; beat: number; sceneCount: number; queue: Slot[]; offers: ClubOfferRef[]; recent: RecentResult[]; threads: Thread[]; eventHistory: EventLogEntry[];
  overall: number; potential: number; xp: number; form: number; fitness: number; morale: number; discipline: number; fame: number; injury: Injury | null;
  hasAgent: boolean; agentName: string; agent: AgentState; memory: NarrativeMemory; contract: string | null; salary: number;
  contractYears?: number; wealth?: number; titles?: string[]; awards?: string[]; pendingMarket?: Card | null; finance?: import("./finance").Finance | null; lastMatch?: MatchData | null; retired?: boolean;
  tablePosition: number; rel: Relationships; seenEvents: string[]; flags: Record<string, number>; seasons: SeasonRecord[]; log: LogEntry[]; achievements: string[]; onboarded: boolean; pending: Card | null; lastOutcome: Outcome | null;
}
