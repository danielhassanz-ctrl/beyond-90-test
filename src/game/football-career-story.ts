import { careerEra, careerStatus, ensureCareerCast, plausibleMoneyScale } from "./career-life";
import { eligibleKeyMatchKinds, majorInternationalTournament } from "./competition-calendar";
import { careerModeConfig, careerModeOf } from "./pacing";
import type { EventCategory, GameState } from "./types";

export type StoryTheme =
  | "adviser"
  | "coach"
  | "captain"
  | "teammate"
  | "physio"
  | "family"
  | "social"
  | "romance"
  | "training"
  | "minutes"
  | "contract"
  | "transfer"
  | "press"
  | "sponsor"
  | "money"
  | "property"
  | "leadership"
  | "legacy"
  | "national_team";

export interface FootballCareerStoryContext {
  era: ReturnType<typeof careerEra>;
  status: ReturnType<typeof careerStatus>;
  moneyScale: ReturnType<typeof plausibleMoneyScale>;
  mode: ReturnType<typeof careerModeOf>;
  seasonDecisionRange: readonly [number, number];
  keyMatchRange: readonly [number, number];
  themes: StoryTheme[];
  keyMatches: ReturnType<typeof eligibleKeyMatchKinds>;
  majorTournament: string | null;
  cast: ReturnType<typeof ensureCareerCast>;
  adviserContactEveryScenes: number;
}

const BASE_THEMES: StoryTheme[] = ["adviser", "coach", "captain", "teammate", "training", "minutes", "contract"];

function themesForCareer(s: GameState): StoryTheme[] {
  const era = careerEra(s);
  const status = careerStatus(s);
  const themes = new Set<StoryTheme>(BASE_THEMES);

  if (era === "academy") {
    themes.add("family");
    themes.add("social");
    if (s.age >= 17 && s.fame >= 18) themes.add("romance");
  }

  if (era === "breakthrough") {
    themes.add("transfer");
    themes.add("press");
    themes.add("family");
    themes.add("social");
    if (s.fame >= 20) themes.add("romance");
    if (s.stage === "first") themes.add("national_team");
  }

  if (era === "established" || era === "prime") {
    themes.add("transfer");
    themes.add("press");
    themes.add("money");
    themes.add("family");
    themes.add("national_team");
    if (status === "star" || status === "elite" || status === "legend") themes.add("sponsor");
    if (s.salary >= 500 || (s.wealth ?? 0) >= 500) themes.add("property");
    if (era === "prime" && (status === "elite" || status === "legend")) themes.add("leadership");
  }

  if (era === "veteran") {
    themes.add("physio");
    themes.add("leadership");
    themes.add("money");
    themes.add("property");
    themes.add("family");
    themes.add("transfer");
    themes.add("national_team");
  }

  if (era === "legacy") {
    themes.add("physio");
    themes.add("leadership");
    themes.add("family");
    themes.add("money");
    themes.add("property");
    themes.add("legacy");
  }

  return [...themes];
}

/**
 * Early careers need frequent guidance; stars still use their adviser but the
 * adviser stops narrating every move. This is cadence, not a random event gate.
 */
export function adviserContactEveryScenes(s: GameState): number {
  const era = careerEra(s);
  if (era === "academy") return 2;
  if (era === "breakthrough") return 3;
  if (era === "established") return 4;
  if (era === "prime") return 5;
  if (era === "veteran") return 4;
  return 3;
}

export function footballCareerStoryContext(s: GameState): FootballCareerStoryContext {
  const mode = careerModeOf(s);
  const config = careerModeConfig(mode);
  return {
    era: careerEra(s),
    status: careerStatus(s),
    moneyScale: plausibleMoneyScale(s),
    mode,
    seasonDecisionRange: config.decisions,
    keyMatchRange: config.keyMatches,
    themes: themesForCareer(s),
    keyMatches: eligibleKeyMatchKinds(s),
    majorTournament: majorInternationalTournament(s),
    cast: ensureCareerCast(s),
    adviserContactEveryScenes: adviserContactEveryScenes(s),
  };
}

/** Maps story themes to the existing event bank without making the bank decide chronology. */
export function categoryForTheme(theme: StoryTheme): EventCategory {
  if (theme === "adviser" || theme === "contract") return "agent";
  if (theme === "transfer") return "market";
  if (theme === "coach" || theme === "captain" || theme === "teammate" || theme === "minutes") return "club";
  if (theme === "training") return "training";
  if (theme === "physio") return "medical";
  if (theme === "press" || theme === "sponsor" || theme === "national_team" || theme === "leadership") return "press";
  if (theme === "social" || theme === "romance") return "gossip";
  if (theme === "family" || theme === "money" || theme === "property" || theme === "legacy") return "life";
  return "story";
}
