"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { canRent, propertyRentMonthly, readProperties, saleProceeds, serializeProperty, propertyValue } from "@/lib/finance/mortgage";

export interface PropertyActionResult {
  ok: boolean;
  message: string;
}

const eur = (n: number) => `${Math.round(n).toLocaleString("es")} €`;

/**
 * Lee el jugador y la propiedad pedida con el estado MÁS RECIENTE de la base de datos (no el de la página, que puede
 * estar desfasado) y comprueba que la clave es de una propiedad del propio jugador.
 */
async function loadProperty(key: string) {
  const { supabase, user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) return { ok: false as const, message: "Tu sesión ha caducado: vuelve a entrar." };
  if (!/^propiedad_[\w-]+$/.test(key)) return { ok: false as const, message: "Propiedad no válida." };
  const { data: fresh, error } = await supabase.from("players").select("id, week, patrimonio, flags").eq("id", player.id).maybeSingle();
  if (error || !fresh) return { ok: false as const, message: "No se pudo leer tu carrera. Inténtalo de nuevo." };
  const flags = (fresh.flags ?? {}) as Record<string, string | boolean>;
  const property = readProperties(flags).find((p) => p.key === key);
  if (!property) return { ok: false as const, message: "Esa propiedad ya no está en tu patrimonio." };
  return { ok: true as const, supabase, player: fresh as { id: string; week: number; patrimonio: number }, flags, property };
}

/** Poner una casa en alquiler (cada turno entra una renta neta) o dejar de alquilarla. */
export async function toggleRent(key: string): Promise<PropertyActionResult> {
  const loaded = await loadProperty(key);
  if (!loaded.ok) return { ok: false, message: loaded.message };
  const { supabase, player, flags, property } = loaded;
  if (!canRent(property)) return { ok: false, message: "Esto no se puede alquilar: solo las casas generan renta." };

  const rented = !property.rented;
  const next = { ...flags, [key]: serializeProperty({ ...property, rented }) };
  const { data, error } = await supabase.from("players").update({ flags: next }).eq("id", player.id).select("id");
  // Supabase no da error si RLS descarta el UPDATE: se comprueba que de verdad cambió una fila.
  if (error || !data || data.length !== 1) return { ok: false, message: "No se pudo guardar el cambio. Inténtalo de nuevo." };

  revalidatePath("/mi-jugador/patrimonio");
  const rent = propertyRentMonthly({ ...property, rented: true }, player.week);
  return {
    ok: true,
    message: rented ? `${property.name} está en alquiler: te entran unos ${eur(rent)} netos cada mes.` : `${property.name} deja de estar en alquiler.`,
  };
}

/** Vender una propiedad: cobras su valor menos gastos y menos lo que aún debes al banco. */
export async function sellProperty(key: string): Promise<PropertyActionResult> {
  const loaded = await loadProperty(key);
  if (!loaded.ok) return { ok: false, message: loaded.message };
  const { supabase, player, flags, property } = loaded;

  const proceeds = saleProceeds(property, player.week);
  // Si lo que debes supera lo que sacas, hay que poner la diferencia de tu cuenta.
  if (player.patrimonio + proceeds < 0) {
    return { ok: false, message: `Aún debes más de lo que sacarías: necesitas ${eur(-proceeds)} en tu cuenta para cancelar la deuda y no los tienes.` };
  }

  const next = { ...flags, [key]: "" };
  const newCash = Math.max(0, player.patrimonio + proceeds);
  const { data, error } = await supabase.from("players").update({ patrimonio: newCash, flags: next }).eq("id", player.id).select("id");
  if (error || !data || data.length !== 1) return { ok: false, message: "No se pudo completar la venta. Inténtalo de nuevo." };

  // Queda en el historial de Ingresos / Pagos de Patrimonio como cualquier otra operación.
  const value = propertyValue(property, player.week);
  const { error: ledgerError } = await supabase.from("career_events").insert({
    player_id: player.id,
    week: player.week,
    event_id: `vid-casa-venta-${key}`,
    category: "vida",
    title: `Venta de ${property.name}`,
    description: `Vendes ${property.name}${property.city ? ` (${property.city})` : ""}. Tasada en ${eur(value)}.`,
    chosen_option_id: "venta",
    chosen_option_label: `Vender ${property.name}`,
    consequences: { patrimonio: proceeds },
    outcome_text: `Cobras ${eur(proceeds)} tras gastos y deuda pendiente.`,
  });
  if (ledgerError) console.error("[sellProperty] no se pudo anotar en el historial:", ledgerError.message);

  revalidatePath("/mi-jugador/patrimonio");
  return { ok: true, message: proceeds >= 0 ? `Vendida: ${eur(proceeds)} a tu cuenta.` : `Vendida: has puesto ${eur(-proceeds)} de tu cuenta para cerrar la deuda.` };
}
