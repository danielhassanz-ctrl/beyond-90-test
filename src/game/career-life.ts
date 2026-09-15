import {
  careerSeed,
  ensureCast,
  hash,
  type AdviserKind as NpcAdviserKind,
  type CareerCast as NpcCareerCast,
  type CastPerson,
} from "./npc";
import type { GameState } from "./types";

export type CareerEra = "academy" | "breakthrough" | "established" | "prime" | "veteran" | "legacy";
export type CareerStatus = "prospect" | "squad" | "starter" | "star" | "elite" | "legend";
export type AdviserKind = NpcAdviserKind;
export type CareerPerson = CastPerson;
export type CareerCast = NpcCareerCast;

export interface LegacyRelationshipHighlight {
  name: string;
  role: string;
  value: number;
}

const PROFESSIONAL_ADVISER_NAMES = [
  "Javier Molina",
  "Sergio Ferrer",
  "Pablo Duarte",
  "Marcos Salas",
  "Álvaro Nieto",
  "Rubén Peralta",
];

const CLUB_SCOPED_NARRATIVE_FLAGS = [
  "people_coach_intro",
  "people_captain_intro",
  "people_captain_callback",
  "people_teammate_intro",
  "people_teammate_callback",
  "teammate_long_term_ally",
  "teammate_rivalry",
  "people_physio_intro",
  "people_physio_injury_callback",
  "physio_intro_listened",
  "physio_intro_ignored",
  "physio_intro_prevention",
  "injury_rehab_patient",
  "injury_rehab_rushed",
  "injury_rehab_informed",
] as const;

function repairProfessionalAdviserIdentity(s: GameState, cast: CareerCast): void {
  if (cast.adviserKind !== "agent") return;
  if (cast.adviser.name !== "Papá" && cast.adviser.name !== "Álex Romero") return;

  const repairedName = PROFESSIONAL_ADVISER_NAMES[hash(careerSeed(s), "professional-adviser-repair") % PROFESSIONAL_ADVISER_NAMES.length]!;
  cast.adviser.name = repairedName;
  cast.adviser.role = "Representante";
  s.agent.name = repairedName;
  s.agentName = repairedName;
  const adviserMemory = s.memory.npcs?.["adviser"];
  if (adviserMemory) {
    adviserMemory.name = repairedName;
    adviserMemory.role = "Representante";
  }
}

function resetClubScopedNarrativeIfNeeded(s: GameState): void {
  const club = typeof s.clubId === "string" && s.clubId ? s.clubId : "unattached";
  const marker = hash(careerSeed(s), `club-narrative-scope|${club}`) || 1;
  const previous = s.flags["club_narrative_scope"];

  if (typeof previous !== "number" || previous <= 0) {
    s.flags["club_narrative_scope"] = marker;
    return;
  }
  if (previous === marker) return;

  for (const key of CLUB_SCOPED_NARRATIVE_FLAGS) delete s.flags[key];
  s.flags["club_narrative_scope"] = marker;
}

export function ensureCareerCast(s: GameState): CareerCast {
  const cast = ensureCast(s);
  resetClubScopedNarrativeIfNeeded(s);
  repairProfessionalAdviserIdentity(s, cast);
  return cast;
}

export function legacyRelationshipHighlight(s: GameState): LegacyRelationshipHighlight {
  const cast = ensureCareerCast(s);
  const candidates: LegacyRelationshipHighlight[] = [
    { name: cast.adviser.name, role: cast.adviser.role, value: cast.adviser.relation },
    { name: cast.coach.name, role: cast.coach.role, value: cast.coach.relation },
    { name: cast.captain.name, role: cast.captain.role, value: cast.captain.relation },
    { name: cast.physio.name, role: cast.physio.role, value: cast.physio.relation },
    { name: cast.teammate.name, role: cast.teammate.role, value: cast.teammate.relation },
  ];

  if (s.flags["partner_active"] === 1) {
    candidates.push({ name: cast.partner.name, role: cast.partner.role, value: cast.partner.relation });
  }

  return candidates.sort((a, b) => b.value - a.value)[0]!;
}

export function careerEra(s: GameState): CareerEra {
  if (s.age <= 18) return "academy";
  if (s.age <= 21) return "breakthrough";
  if (s.age <= 25) return "established";
  if (s.age <= 30) return "prime";
  if (s.age <= 34) return "veteran";
  return "legacy";
}

export function careerStatus(s: GameState): CareerStatus {
  const titles = s.titles?.length ?? 0;
  const awards = s.awards?.length ?? 0;

  // Public attention can amplify what happens on the pitch, but it cannot
  // manufacture football status on its own. This is deliberately stricter than
  // the old fame-only shortcuts: a viral youngster with a low overall remains a
  // prospect/squad player until his football supplies evidence too.
  if (s.age <= 16) {
    if (s.overall >= 78 || (s.overall >= 74 && s.fame >= 55)) return "starter";
    if (s.overall >= 70 || (s.overall >= 67 && s.fame >= 25)) return "squad";
    return "prospect";
  }

  if (s.age <= 18) {
    if (s.overall >= 83 || (s.overall >= 80 && s.fame >= 75) || (awards >= 1 && s.overall >= 79)) return "star";
    if (s.overall >= 76 || (s.overall >= 73 && s.fame >= 45)) return "starter";
    if (s.overall >= 70) return "squad";
    return "prospect";
  }

  if (s.age >= 27 && s.overall >= 89 && (titles >= 4 || awards >= 2)) return "legend";
  if (s.overall >= 88 || (awards >= 1 && s.overall >= 84)) return "elite";
  if (s.overall >= 83 || (s.overall >= 80 && s.fame >= 75)) return "star";
  if (s.overall >= 76 || (s.overall >= 73 && s.fame >= 45)) return "starter";
  if (s.overall >= 70) return "squad";
  return "prospect";
}

export function plausibleMoneyScale(s: GameState): "youth" | "pro" | "star" | "superstar" {
  const status = careerStatus(s);
  if (s.age <= 18 || status === "prospect") return "youth";
  if (status === "squad" || status === "starter") return "pro";
  if (status === "star") return "star";
  return "superstar";
}

export function canReceiveSocialDm(s: GameState): boolean {
  return s.age >= 17 && s.age <= 24 && s.fame >= 18 && !s.flags["social_dm_intro"];
}

export function touch(person: CareerPerson, s: GameState, delta = 0): void {
  person.met = true;
  person.lastContactScene = s.sceneCount;
  person.relation = Math.max(0, Math.min(100, person.relation + delta));
}
