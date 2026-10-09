/**
 * Estados temporales: complicaciones y rachas buenas que duran unos turnos y se notan de verdad. Un escándalo, un bache
 * de forma o una preocupación en casa restan en cada turno y empeoran las jugadas decisivas; una racha, un mentor o
 * un míster que confía en ti suman. Se guardan en player.flags como estado_<id> = semana en la que terminan, y se
 * limpian solos al caducar.
 */
import type { Player } from "@/types/player";

export interface StateDef {
  id: string;
  label: string;
  tone: "bad" | "good";
  icon: string;
  /** Empujón (±) a la probabilidad de acertar las jugadas con tirada. */
  roll: number;
  /** Cambios por turno. */
  forma: number;
  moral: number;
  rel_entrenador?: number;
  rel_vestuario?: number;
  rel_aficion?: number;
  /** Frase corta que explica el efecto al jugador. */
  hint: string;
}

export const STATES: Record<string, StateDef> = {
  bache: { id: "bache", label: "Bache de forma", tone: "bad", icon: "📉", roll: -0.08, forma: -2, moral: -1, hint: "Fallas más de lo normal y las piernas pesan." },
  escandalo: { id: "escandalo", label: "En el foco por un escándalo", tone: "bad", icon: "📸", roll: -0.05, forma: 0, moral: -2, rel_aficion: -1, hint: "La prensa y la grada no te sueltan." },
  preocupado: { id: "preocupado", label: "Con la cabeza en casa", tone: "bad", icon: "💭", roll: -0.06, forma: -1, moral: -2, hint: "Te cuesta concentrarte en el campo." },
  castigo: { id: "castigo", label: "Castigado por el míster", tone: "bad", icon: "🚫", roll: -0.03, forma: 0, moral: -1, rel_entrenador: -1, hint: "Tienes que ganarte otra vez su confianza." },
  mal_ambiente: { id: "mal_ambiente", label: "Mal ambiente en el vestuario", tone: "bad", icon: "⚡", roll: -0.04, forma: 0, moral: -1, rel_vestuario: -1, hint: "Nadie te pasa el balón con ganas." },
  racha: { id: "racha", label: "En racha", tone: "good", icon: "🔥", roll: 0.08, forma: 1, moral: 2, hint: "Todo te sale: más confianza, mejores jugadas." },
  mentor: { id: "mentor", label: "Con un mentor", tone: "good", icon: "🧭", roll: 0.04, forma: 1, moral: 1, hint: "Un veterano te enseña los detalles que no se ven." },
  fisico: { id: "fisico", label: "A tope físicamente", tone: "good", icon: "💪", roll: 0.03, forma: 2, moral: 1, hint: "Llegas a todo y recuperas rápido." },
  confianza: { id: "confianza", label: "Con la confianza del míster", tone: "good", icon: "🤝", roll: 0.05, forma: 0, moral: 1, rel_entrenador: 1, hint: "El míster cuenta contigo y se nota." },
};

const KEY = "estado_";

export interface ActiveState {
  def: StateDef;
  until: number;
}

export function activeStates(flags: Record<string, string | boolean> | null | undefined, week: number): ActiveState[] {
  const out: ActiveState[] = [];
  for (const [k, v] of Object.entries(flags ?? {})) {
    if (!k.startsWith(KEY)) continue;
    const def = STATES[k.slice(KEY.length)];
    const until = parseInt(String(v), 10);
    if (def && Number.isFinite(until) && until >= week) out.push({ def, until });
  }
  return out;
}

/** Cuánto se empuja la probabilidad de acertar una jugada con tirada según los estados activos. */
export function stateRollNudge(flags: Record<string, string | boolean> | null | undefined, week: number): number {
  return activeStates(flags, week).reduce((n, s) => n + s.def.roll, 0);
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Aplica el efecto de un turno de cada estado activo y limpia los caducados. Se llama una vez por turno. */
export function applyStateTick(player: Player): void {
  const flags = (player.flags ??= {});
  for (const [k, v] of Object.entries(flags)) {
    if (!k.startsWith(KEY)) continue;
    const until = parseInt(String(v), 10);
    if (!Number.isFinite(until) || until < player.week) flags[k] = "";
  }
  for (const { def } of activeStates(flags, player.week)) {
    player.forma = clamp((player.forma ?? 70) + def.forma);
    player.moral = clamp((player.moral ?? 70) + def.moral);
    if (def.rel_entrenador) player.rel_entrenador = clamp((player.rel_entrenador ?? 50) + def.rel_entrenador);
    if (def.rel_vestuario) player.rel_vestuario = clamp((player.rel_vestuario ?? 50) + def.rel_vestuario);
    if (def.rel_aficion) player.rel_aficion = clamp((player.rel_aficion ?? 50) + def.rel_aficion);
  }
}

/** ¿Hay algún estado activo de este tipo ("bad"/"good")? */
export const hasState = (flags: Record<string, string | boolean> | null | undefined, week: number, tone?: "bad" | "good"): boolean =>
  activeStates(flags, week).some((s) => !tone || s.def.tone === tone);
