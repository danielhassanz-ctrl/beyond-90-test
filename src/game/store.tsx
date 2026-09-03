import { rememberBeat } from "./archetype";
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
import { choosePostCareerPath, choosePostCareerStyle, type PostCareerPath, type PostCareerStyle } from "./postcareer";
import type { DynamicCard, GameState, MatchData, Player } from "./types";

interface GameContextValue {
  state: GameState | null;
  ready: boolean;
  hasSave: boolean;
  error: string | null;
  clearError: () => void;
  start: (player: Player) => void;
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

function read(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

function write(state: GameState | null) {
  try {
    if (!state) localStorage.removeItem(SAVE_KEY);
    else localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento lleno o bloqueado: la partida sigue en memoria */
  }
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
        next = fn(prev);
      } catch {
        setError("Esa acción no se pudo aplicar. Pulsa \u00abReintentar escena\u00bb para seguir tu carrera.");
        return prev;
      }
      write(next);
      return next;
    });
  }, []);

  const start = useCallback((player: Player) => commit(createGame(player)), [commit]);
  const pickClub = useCallback((clubId: string) => apply((prev) => chooseClub(prev, clubId)), [apply]);
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
  const next = useCallback(() => apply((prev) => advance(prev)), [apply]);
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
