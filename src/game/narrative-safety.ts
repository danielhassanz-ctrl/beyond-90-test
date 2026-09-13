import { advance } from "./engine";
import { eventById } from "./events";
import type { GameEvent, GameState } from "./types";

const DISALLOWED_DYNAMIC_KINDS = new Set(["agent_check", "match_flash"]);
const INJURED_ON_FIELD_COPY = /(calienta(?:s)?\b|entras? t[uú]\b|sales? de titular|entras? al campo|debut(?:as?| oficial)|minuto \d{1,3}\b|partidillo|dos actuaciones|rivales? te preparan|te silban al cambiarte|te cambian en|marcas? (?:un )?gol|gol decisivo|doble marca|faltas t[aá]cticas|tarjeta roja|roja directa|expulsi[oó]n|sustituci[oó]n|duelo t[aá]ctico)/i;

function eventCopy(event: GameEvent, state: GameState): string {
  let text = "";
  try {
    text = typeof event.text === "function" ? event.text(state) : event.text;
  } catch {
    // A broken renderer is never a reason to weaken the injury chronology gate.
  }
  return `${event.title} ${text}`;
}

function isInjuredParticipationEvent(state: GameState): boolean {
  if (!state.injury || state.pending?.type !== "event") return false;
  const event = eventById(state.pending.eventId);
  if (!event) return false;

  // Medical/rehab scenes are the explicit exception while unavailable.
  if (event.category === "medical" || event.image === "injury") return false;

  // Normal training and match-presentational cards are not playable while the
  // player is unavailable. This intentionally prefers no decision to filler.
  if (event.category === "training" || event.image === "training" || event.image === "match") return true;

  // Some old youth/debut cards use neutral artwork (for example a tunnel) even
  // though the copy requires the player to enter the pitch. Guard semantics too.
  return INJURED_ON_FIELD_COPY.test(eventCopy(event, state));
}

function isDisallowedPending(state: GameState): boolean {
  const pending = state.pending;
  if (!pending) return false;
  if (pending.type === "dynamic") return DISALLOWED_DYNAMIC_KINDS.has(pending.kind);
  if (state.injury && pending.type === "match") return true;
  return isInjuredParticipationEvent(state);
}

/**
 * Final guard for narrative cards that must never reach the playable UI.
 *
 * Besides legacy generic cards, this guard enforces player availability across
 * the older event bank. A diagnosed injury may coexist with medical, rehab,
 * family, agent, contract or other genuinely off-field scenes, but never with
 * a playable match/training/debut/red-card scene. Skipped cards are not
 * answered, so the player receives no hidden relationship or memory effects.
 */
export function scrubDisallowedNarrative(state: GameState): GameState {
  let next = state;

  // Opening scenes are deterministic and must never be fast-forwarded by a
  // safety guard. Injury state is not authored during the mandatory opening.
  if (next.flags["opening_v1"] === 1 && next.flags["opening_completed"] !== 1) return next;

  for (let guard = 0; guard < 8; guard += 1) {
    if (!isDisallowedPending(next)) return next;

    // Do not "answer" a banned card: that would still alter trust, memories
    // and scene counters for something the player never saw.
    next = advance({ ...next, pending: null });
  }

  // Defensive fallback: never expose a banned card even if a future engine
  // regression emits one repeatedly in a scheduler pass.
  return isDisallowedPending(next) ? { ...next, pending: null } : next;
}

export function isDisallowedNarrative(state: GameState): boolean {
  return isDisallowedPending(state);
}
