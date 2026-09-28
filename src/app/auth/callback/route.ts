import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Punto de entrada único para cualquier enlace de un solo uso que manda
 * Supabase por email (recuperar contraseña, confirmar cuenta con "magic
 * link"): el enlace trae un `code` que hay que intercambiar por una
 * sesión real ANTES de poder hacer nada (poner contraseña nueva,
 * confirmar el email...). Sin esta ruta, el enlace del email no tenía
 * ningún sitio del propio dominio del juego donde aterrizar.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/mi-jugador";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Ese enlace ya no es válido o ha caducado. Pide uno nuevo.")}`,
  );
}
