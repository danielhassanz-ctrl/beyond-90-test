import { advance } from "./engine";
import type { GameState } from "./types";

const DISALLOWED_DYNAMIC_KINDS = new Set(["agent_check"]);

/**
 * Final guard for narrative cards that must never reach the playable UI.
 *
 * `agent_check` was a legacy generic phone-call card. Once a father/trusted
 * adviser could become the persisted representative, the same generic copy
 * produced nonsense such as "Papá no quiere hablar por WhatsApp" and could
 * recur every few scenes. We skip the consumed scheduler slot without
 * resolving the card, so it changes no relationship/memory state.
 */
export function scrubDisallowedNarrative(state: GameState): GameState {
  let next = state;

  // Opening scenes are deterministic and must never be fast-forwarded by a
  // safety guard. The legacy card cannot be authored there anyway.
  if (next.flags["opening_v1"] === 1 && next.flags["opening_completed"] !== 1) return next;

  for (let guard = 0; guard < 8; guard += 1) {
    if (next.pending?.type !== "dynamic" || !DISALLOWED_DYNAMIC_KINDS.has(next.pending.kind)) return next;

    // Do not "answer" a banned card: that would still alter trust, memories
    // and scene counters for something the player never saw.
    next = advance({ ...next, pending: null });
  }

  // Defensive fallback: never expose the banned card even if a future engine
  // regression emits it repeatedly in one scheduler pass.
  if (next.pending?.type === "dynamic" && DISALLOWED_DYNAMIC_KINDS.has(next.pending.kind)) {
    return { ...next, pending: null };
  }
  return next;
}

export function isDisallowedNarrative(state: GameState): boolean {
  return state.pending?.type === "dynamic" && DISALLOWED_DYNAMIC_KINDS.has(state.pending.kind);
}
