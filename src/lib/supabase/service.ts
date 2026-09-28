import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la SERVICE ROLE KEY: salta las políticas de RLS
 * por completo. Solo debe usarse en sitios que no tienen (ni pueden
 * tener) una sesión de usuario real detrás — como el webhook de Stripe,
 * que Stripe llama directamente desde sus propios servidores — nunca en
 * una Server Action normal invocada desde el navegador de un jugador.
 *
 * STRIPE_SECRET_KEY es del proyecto de Stripe; SUPABASE_SERVICE_ROLE_KEY
 * es un secreto totalmente distinto, del panel de Supabase (Project
 * Settings → API → service_role). Ninguna de las dos claves debe pegarse
 * nunca en el chat — se añaden directamente como variables de entorno en
 * Vercel.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada — no se puede usar el cliente de administrador todavía");
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
