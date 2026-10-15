/**
 * Escritura segura de players.flags. El juego lee la fila, trabaja con ella (a veces 10-15 s esperando a la IA) y luego escribe el
 * objeto ENTERO: si mientras tanto otra cosa había cambiado una bandera (una foto que acaba de generarse, un pago de Stripe, el
 * gasto de un crédito), esa escritura la pisaba con el valor viejo. Aquí se escribe solo lo que ESTA petición ha cambiado, encima de
 * lo que haya ahora en la base de datos.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type Flags = Record<string, string | boolean>;

export interface FlagsDelta {
  set: Flags;
  del: string[];
}

/** Qué ha cambiado entre dos versiones de las banderas: lo añadido o modificado y lo borrado. */
export function diffFlags(before: Flags | null | undefined, after: Flags | null | undefined): FlagsDelta {
  const b = before ?? {};
  const a = after ?? {};
  const set: Flags = {};
  const del: string[] = [];
  for (const [k, v] of Object.entries(a)) {
    if (!(k in b) || b[k] !== v) set[k] = v;
  }
  for (const k of Object.keys(b)) {
    if (!(k in a)) del.push(k);
  }
  return { set, del };
}

/** Aplica ese cambio sobre otra versión de las banderas (la más reciente de la base de datos). */
export function applyFlagsDelta(base: Flags | null | undefined, delta: FlagsDelta): Flags {
  const out: Flags = { ...(base ?? {}), ...delta.set };
  for (const k of delta.del) delete out[k];
  return out;
}

/**
 * Banderas listas para escribir: lo que esta petición ha cambiado (`start` → `final`) aplicado sobre las banderas actuales de la
 * base de datos. Si no se puede leer la fila, se devuelve `final` tal cual (el comportamiento de siempre).
 */
export async function mergeFlagsForWrite(supabase: SupabaseClient, playerId: string, start: Flags | null | undefined, final: Flags): Promise<Flags> {
  try {
    const { data } = await supabase.from("players").select("flags").eq("id", playerId).maybeSingle();
    if (!data) return final;
    return applyFlagsDelta((data.flags ?? {}) as Flags, diffFlags(start, final));
  } catch {
    return final;
  }
}

/** Lee las banderas actuales, las modifica y las guarda enseguida (ventana de milisegundos, no de segundos). */
export async function patchFlagsFresh(supabase: SupabaseClient, playerId: string, mutate: (flags: Flags) => void): Promise<Flags | null> {
  try {
    const { data } = await supabase.from("players").select("flags").eq("id", playerId).maybeSingle();
    if (!data) return null;
    const next: Flags = { ...((data.flags ?? {}) as Flags) };
    mutate(next);
    const { data: rows } = await supabase.from("players").update({ flags: next }).eq("id", playerId).select("id");
    return rows && rows.length > 0 ? next : null;
  } catch {
    return null;
  }
}
