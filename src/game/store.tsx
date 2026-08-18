import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SAVE_KEY, advance, chooseClub, createGame, resolveEvent, resolveMatch } from "./engine";
import type { GameState, MatchData, Player } from "./types";

interface GameContextValue {
  state: GameState | null;
  ready: boolean;
  hasSave: boolean;
  start: (player: Player) => void;
  pickClub: (clubId: string) => void;
  answerEvent: (eventId: string, choiceId: string) => void;
  playMatch: (match: MatchData, keyChoiceId?: string) => void;
  next: () => void;
  reset: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function read(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed !== "object" || !parsed.player) return null;
    return parsed;
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

  const start = useCallback((player: Player) => commit(createGame(player)), [commit]);

  const pickClub = useCallback(
    (clubId: string) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = chooseClub(prev, clubId);
        write(next);
        return next;
      });
    },
    [],
  );

  const answerEvent = useCallback((eventId: string, choiceId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = resolveEvent(prev, eventId, choiceId);
      write(next);
      return next;
    });
  }, []);

  const playMatch = useCallback((match: MatchData, keyChoiceId?: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = keyChoiceId ? resolveMatch(prev, match, keyChoiceId) : resolveMatch(prev, match);
      write(next);
      return next;
    });
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const updated = advance(prev);
      write(updated);
      return updated;
    });
  }, []);

  const reset = useCallback(() => commit(null), [commit]);

  const value = useMemo<GameContextValue>(
    () => ({ state, ready, hasSave: !!state, start, pickClub, answerEvent, playMatch, next, reset }),
    [state, ready, start, pickClub, answerEvent, playMatch, next, reset],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame debe usarse dentro de GameProvider");
  return ctx;
}
