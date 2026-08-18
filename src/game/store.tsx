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
import type { DynamicCard, GameState, MatchData, Player } from "./types";

interface GameContextValue {
  state: GameState | null;
  ready: boolean;
  hasSave: boolean;
  start: (player: Player) => void;
  pickClub: (clubId: string) => void;
  answerEvent: (eventId: string, choiceId: string) => void;
  answerFree: (eventId: string, text: string) => void;
  answerDynamic: (card: DynamicCard, choiceId: string, text?: string) => void;
  finishBlock: (block: AutoBlock) => void;
  playMatch: (match: MatchData, keyChoiceId?: string) => void;
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
        next = fn(prev);
      } catch {
        return prev;
      }
      write(next);
      return next;
    });
  }, []);

  const start = useCallback((player: Player) => commit(createGame(player)), [commit]);
  const pickClub = useCallback((clubId: string) => apply((prev) => chooseClub(prev, clubId)), [apply]);
  const answerEvent = useCallback(
    (eventId: string, choiceId: string) => apply((prev) => resolveEvent(prev, eventId, choiceId)),
    [apply],
  );
  const answerFree = useCallback(
    (eventId: string, text: string) => apply((prev) => resolveEventFree(prev, eventId, text)),
    [apply],
  );
  const answerDynamic = useCallback(
    (card: DynamicCard, choiceId: string, text?: string) =>
      apply((prev) => resolveDynamicCard(prev, card, choiceId, text)),
    [apply],
  );
  const finishBlock = useCallback((block: AutoBlock) => apply((prev) => resolveBlock(prev, block)), [apply]);
  const playMatch = useCallback(
    (match: MatchData, keyChoiceId?: string) =>
      apply((prev) => (keyChoiceId ? resolveMatch(prev, match, keyChoiceId) : resolveMatch(prev, match))),
    [apply],
  );
  const next = useCallback(() => apply((prev) => advance(prev)), [apply]);
  const reset = useCallback(() => commit(null), [commit]);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      ready,
      hasSave: !!state,
      start,
      pickClub,
      answerEvent,
      answerFree,
      answerDynamic,
      finishBlock,
      playMatch,
      next,
      reset,
    }),
    [state, ready, start, pickClub, answerEvent, answerFree, answerDynamic, finishBlock, playMatch, next, reset],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame debe usarse dentro de GameProvider");
  return ctx;
}
