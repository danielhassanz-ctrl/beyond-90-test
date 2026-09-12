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
import { scrubDisallowedNarrative } from "./narrative-safety";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening } from "./opening";
import { applyCareerPacing, DEFAULT_CAREER_MODE, setCareerMode, type CareerMode } from "./pacing";
import { choosePostCareerPath, choosePostCareerStyle, type PostCareerPath, type PostCareerStyle } from "./postcareer";
import type { DynamicCard, GameState, MatchData, Player } from "./types";

interface GameContextValue {
  state: GameState | null;
  ready: boolean;
  hasSave: boolean;
  error: string | null;
  clearError: () => void;
  start: (player: Player, mode?: CareerMode) => void;
  pickClub: (clubId: string) => void;
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

      // `migrate()` is deliberately allowed to rebuild an empty/legacy season
      // queue, and that legacy path clears `pending`. During the mandatory
      // opening this used to make Safari/WebKit reloads lose the exact scene
      // the player was reading (notably the first agreement) even though the
      // persisted opening phase was correct. Reconstruct the deterministic
      // opening card from the persisted phase, without advancing narrative
      // time, so a reload resumes the same decision instead of skipping it.
      const beat = state.beat;
      const opening = forceOpeningPending(state);
      if (opening) {
        opening.beat = beat;
        return opening;
      }
      return scrubDisallowedNarrative(state);
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
      // The primary slot is canonical whenever it parses successfully. Keep the
      // recovery slot byte-for-byte aligned even when an older backup is still
      // valid, otherwise a later primary corruption can silently roll a player
      // back to an earlier career state.
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

  try {
    localStorage.setItem(SAVE_KEY, nextRaw);
  } catch {
    /* Storage can reject one slot while another remains writable. */
  }

  // Persist recovery independently. On Safari/private storage a key-specific
  // primary write failure must not make an otherwise writable backup useless.
  try {
    localStorage.setItem(BACKUP_SAVE_KEY, nextRaw);
  } catch {
    /* Both slots unavailable: keep the current session playable in memory. */
  }
}

function withRuntime(next: GameState): GameState {
  ensureCareerCast(next);
  applyCareerPacing(next);
  return scrubDisallowedNarrative(next);
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
    initializeOpening(game);
    commit(game);
  }, [commit]);
  const pickClub = useCallback(
    (clubId: string) => apply((prev) => afterOpeningClubChoice(chooseClub(prev, clubId))),
    [apply],
  );
  const answerEvent = useCallback(
    (eventId: string, choiceId: string) =>
      apply((prev) => {
        const next = resolveEvent(prev, eventId, choiceId);
        const label = eventById(eventId)?.choices.find((c) => c.id === choiceId)?.label;
        if (label) rememberBeat(next, label);
        return next;
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
  const next = useCallback(
    () => apply((prev) => forceOpeningPending(prev) ?? advance(prev)),
    [apply],
  );
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
