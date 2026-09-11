import { rememberBeat } from "./archetype";
import { ensureCareerCast } from "./career-life";
import { eventById } from "./events";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  SAVE_KEY,
  advance,
  chooseClub,
  createGame,
  migrate,
  resolveDynamicCard,
  resolveEvent,
  resolveEventFree,
  resolveMatch,
} from "./engine";
import { applyCareerPacing, DEFAULT_CAREER_MODE, setCareerMode, type CareerMode } from "./pacing";
import { choosePostCareerPath, choosePostCareerStyle, type PostCareerPath, type PostCareerStyle } from "./postcareer";
import type { AdviserKind } from "./npc";
import type { DynamicCard, GameState, MatchData, Player } from "./types";

export interface OpeningSetup {
  familyChoice: "support" | "grounded" | "study";
  adviserKind: AdviserKind;
  contractChoice: "minutes" | "development" | "security";
}

interface GameContextValue {
  state: GameState | null;
  ready: boolean;
  hasSave: boolean;
  error: string | null;
  clearError: () => void;
  start: (player: Player, mode?: CareerMode) => void;
  pickClub: (clubId: string, opening?: OpeningSetup) => void;
  answerEvent: (eventId: string, choiceId: string) => void;
  answerFree: (eventId: string, text: string) => void;
  answerDynamic: (card: DynamicCard, choiceId: string, text?: string) => void;
  playMatch: (match: MatchData, keyChoiceId?: string) => void;
  choosePostCareer: (path: PostCareerPath) => void;
  choosePostCareerStyle: (style: PostCareerStyle) => void;
  next: () => void;
  reset: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);
const BACKUP_SAVE_KEY = `${SAVE_KEY}:backup`;

function parseSave(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const decoded = JSON.parse(raw) as { careerMode?: CareerMode };
    const state = migrate(decoded);
    if (state) {
      setCareerMode(state, decoded.careerMode ?? DEFAULT_CAREER_MODE);
      ensureCareerCast(state);
      applyCareerPacing(state);
    }
    return state;
  } catch {
    return null;
  }
}

function read(): GameState | null {
  try {
    const primaryRaw = localStorage.getItem(SAVE_KEY);
    const primary = parseSave(primaryRaw);
    if (primary) {
      const backupRaw = localStorage.getItem(BACKUP_SAVE_KEY);
      if (backupRaw !== primaryRaw) {
        try {
          localStorage.setItem(BACKUP_SAVE_KEY, primaryRaw as string);
        } catch {
          /* Best-effort backup healing for Safari/private storage. */
        }
      }
      return primary;
    }

    const backupRaw = localStorage.getItem(BACKUP_SAVE_KEY);
    const backup = parseSave(backupRaw);
    if (!backup) return null;

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(backup));
    } catch {
      /* Safari/private storage can reject writes; recovered game stays playable in memory. */
    }
    return backup;
  } catch {
    return null;
  }
}

function write(state: GameState | null) {
  if (!state) {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    try { localStorage.removeItem(BACKUP_SAVE_KEY); } catch {}
    return;
  }

  let nextRaw: string;
  try {
    nextRaw = JSON.stringify(state);
  } catch {
    return;
  }

  let primaryWritten = false;
  try {
    localStorage.setItem(SAVE_KEY, nextRaw);
    primaryWritten = true;
  } catch {
    /* Storage blocked/full: the current session remains playable in memory. */
  }

  if (primaryWritten) {
    try {
      localStorage.setItem(BACKUP_SAVE_KEY, nextRaw);
    } catch {
      /* Backup is best effort; a failed backup write must never invalidate the newer primary save. */
    }
  }
}

function withRuntime(next: GameState): GameState {
  ensureCareerCast(next);
  applyCareerPacing(next);
  return next;
}

function applyOpeningSetup(state: GameState, opening: OpeningSetup): GameState {
  const cast = ensureCareerCast(state);
  cast.adviserKind = opening.adviserKind;
  cast.adviser.name = opening.adviserKind === "father"
    ? "Papá"
    : opening.adviserKind === "friend"
      ? "Álex"
      : "Álvaro Montes";
  cast.adviser.role = opening.adviserKind === "father"
    ? "Padre y asesor"
    : opening.adviserKind === "friend"
      ? "Amigo y asesor"
      : "Representante";
  cast.adviser.met = true;
  cast.adviser.lastContactScene = state.sceneCount ?? 0;
  state.hasAgent = true;
  state.agent.present = true;
  state.agent.name = cast.adviser.name;
  state.agentName = cast.adviser.name;
  state.rel.agent = Math.max(state.rel.agent, 50);
  state.flags["opening_family_done"] = 1;
  state.flags[`opening_family_${opening.familyChoice}`] = 1;
  state.flags["people_adviser_intro"] = 1;
  state.flags["opening_adviser_chosen"] = 1;
  state.flags[`opening_adviser_${opening.adviserKind}`] = 1;
  state.flags["opening_contract_done"] = 1;
  state.flags[`opening_contract_${opening.contractChoice}`] = 1;
  state.memory.promises.unshift(
    opening.contractChoice === "minutes"
      ? `${cast.adviser.name} y tú priorizasteis minutos en el primer acuerdo de cantera.`
      : opening.contractChoice === "development"
        ? `${cast.adviser.name} y tú priorizasteis desarrollo deportivo en el primer acuerdo de cantera.`
        : `${cast.adviser.name} y tú priorizasteis estabilidad en el primer acuerdo de cantera.`,
  );
  state.memory.promises = state.memory.promises.slice(0, 24);
  state.agent.memories = [
    `adviser:${opening.adviserKind}`,
    `opening-family:${opening.familyChoice}`,
    `opening-contract:${opening.contractChoice}`,
    ...state.agent.memories.filter((m) => !m.startsWith("adviser:") && !m.startsWith("opening-")),
  ].slice(0, 12);
  state.pending = { type: "event", eventId: "people_coach_intro" };
  return state;
}

function forceOpeningContinuation(state: GameState, eventId: string): GameState {
  if (state.age > 18 || state.seasonIndex > 0) return state;
  if (eventId === "people_coach_intro" && state.flags["people_coach_intro"] === 1) {
    state.pending = { type: "event", eventId: "people_captain_intro" };
  } else if (eventId === "people_captain_intro" && state.flags["people_captain_intro"] === 1) {
    state.pending = { type: "event", eventId: "people_teammate_intro" };
  }
  return state;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  const commit = useCallback((next: GameState | null) => {
    setState(next);
    write(next);
  }, []);

  const apply = useCallback((fn: (prev: GameState) => GameState) => {
    setState((prev) => {
      if (!prev) return prev;
      let next: GameState;
      try {
        setError(null);
        next = withRuntime(fn(prev));
      } catch {
        setError("Esa acción no se pudo aplicar. Pulsa \u00abReintentar escena\u00bb para seguir tu carrera.");
        return prev;
      }
      write(next);
      return next;
    });
  }, []);

  const start = useCallback((player: Player, mode: CareerMode = DEFAULT_CAREER_MODE) => {
    const game = createGame(player);
    setCareerMode(game, mode);
    ensureCareerCast(game);
    commit(game);
  }, [commit]);

  const pickClub = useCallback((clubId: string, opening?: OpeningSetup) => {
    apply((prev) => {
      const next = chooseClub(prev, clubId);
      return opening ? applyOpeningSetup(next, opening) : next;
    });
  }, [apply]);

  const answerEvent = useCallback(
    (eventId: string, choiceId: string) =>
      apply((prev) => {
        const next = resolveEvent(prev, eventId, choiceId);
        const label = eventById(eventId)?.choices.find((c) => c.id === choiceId)?.label;
        if (label) rememberBeat(next, label);
        return forceOpeningContinuation(next, eventId);
      }),
    [apply],
  );

  const answerFree = useCallback(
    (eventId: string, text: string) => apply((prev) => resolveEventFree(prev, eventId, text)),
    [apply],
  );

  const answerDynamic = useCallback(
    (card: DynamicCard, choiceId: string, text?: string) =>
      apply((prev) => {
        const next = resolveDynamicCard(prev, card, choiceId, text);
        rememberBeat(next, text?.trim() || choiceId.replace(/_/g, " "));
        return next;
      }),
    [apply],
  );

  const playMatch = useCallback(
    (match: MatchData, keyChoiceId?: string) =>
      apply((prev) => (keyChoiceId ? resolveMatch(prev, match, keyChoiceId) : resolveMatch(prev, match))),
    [apply],
  );

  const choosePostCareer = useCallback(
    (path: PostCareerPath) => apply((prev) => choosePostCareerPath(prev, path)),
    [apply],
  );

  const choosePostCareerStyleAction = useCallback(
    (style: PostCareerStyle) => apply((prev) => choosePostCareerStyle(prev, style)),
    [apply],
  );

  const next = useCallback(() => apply((prev) => {
    // During the mandatory rookie opening, answerEvent already queued the next
    // named person. OutcomeCard still calls `next()`: clear only the outcome so
    // that advance() cannot overwrite that forced coach/captain/teammate scene.
    if (prev.lastOutcome && prev.pending) {
      const nextState = { ...prev, lastOutcome: null };
      return nextState;
    }
    return advance(prev);
  }), [apply]);
  const reset = useCallback(() => commit(null), [commit]);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      ready,
      hasSave: !!state,
      error,
      clearError: () => setError(null),
      start,
      pickClub,
      answerEvent,
      answerFree,
      answerDynamic,
      playMatch,
      choosePostCareer,
      choosePostCareerStyle: choosePostCareerStyleAction,
      next,
      reset,
    }),
    [state, ready, error, start, pickClub, answerEvent, answerFree, answerDynamic, playMatch, choosePostCareer, choosePostCareerStyleAction, next, reset],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame debe usarse dentro de GameProvider");
  return ctx;
}
