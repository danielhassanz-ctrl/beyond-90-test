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

export interface GameState {
  version: number;
  createdAt: number;
  updatedAt: number;
  player: Player;
  clubId: string;
  stage: Stage;
  age: number;
  seasonIndex: number;
  week: number;
  overall: number;
  potential: number;
  form: number;
  fitness: number;
  morale: number;
  discipline: number;
  fame: number;
  injuryWeeks: number;
  injuryLabel: string | null;
  hasAgent: boolean;
  agentName: string;
  contract: string | null;
  salary: number;
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

export interface Delta {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}

export interface Outcome {
  title: string;
  text: string;
  deltas: Delta[];
  tone: "good" | "bad" | "neutral" | "gold";
}

export interface EventChoice {
  id: string;
  label: string;
  hint?: string;
  outcome: string | ((s: GameState) => string);
  apply: (s: GameState) => void;
}

export interface GameEvent {
  id: string;
  kicker: string;
  title: string;
  image: SceneKey;
  text: string | ((s: GameState) => string);
  priority?: number;
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
}

export type Card =
  | { type: "event"; eventId: string }
  | { type: "match"; match: MatchData }
  | { type: "rest"; title: string; text: string }
  | { type: "season"; summary: Outcome };
