"use server";

import { getCurrentUserAndPlayer } from "@/lib/player";
import { createServiceClient } from "@/lib/supabase/service";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const validEndpoint = (e: unknown): e is string => typeof e === "string" && e.length < 600 && /^https:\/\//.test(e);

/** Guarda el dispositivo del usuario de la sesión. El user_id sale de la sesión, nunca del formulario. */
export async function guardarSuscripcion(input: PushSubscriptionInput, userAgent: string): Promise<{ ok: boolean; error?: string }> {
  const { user } = await getCurrentUserAndPlayer();
  if (!user) return { ok: false, error: "Inicia sesión de nuevo." };
  if (!input || !validEndpoint(input.endpoint) || typeof input.keys?.p256dh !== "string" || typeof input.keys?.auth !== "string" || input.keys.p256dh.length > 200 || input.keys.auth.length > 100) {
    return { ok: false, error: "Suscripción no válida." };
  }
  try {
    const service = createServiceClient();
    // Un mismo dispositivo con otra cuenta: la suscripción pasa a la cuenta actual.
    const { error } = await service
      .from("push_subscriptions")
      .upsert({ user_id: user.id, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth, user_agent: String(userAgent ?? "").slice(0, 200) }, { onConflict: "endpoint" });
    if (error) {
      console.error("[guardarSuscripcion]", error.message);
      return { ok: false, error: "Los avisos todavía no están activados en el servidor." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[guardarSuscripcion]", (e as Error).message);
    return { ok: false, error: "No se pudo guardar el aviso." };
  }
}

export async function quitarSuscripcion(endpoint: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await getCurrentUserAndPlayer();
  if (!user || !validEndpoint(endpoint)) return { ok: false };
  // Con la sesión del usuario: la política de RLS solo deja borrar sus propias filas.
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { ok: !error };
}
