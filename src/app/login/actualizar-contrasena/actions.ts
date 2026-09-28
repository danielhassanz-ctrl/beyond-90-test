"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Solo funciona con la sesión temporal de recuperación que deja el
 * intercambio de código en /auth/callback — sin esa sesión activa,
 * updateUser falla con un error de Supabase que se muestra tal cual.
 */
export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (password !== confirm) {
    redirect(`/login/actualizar-contrasena?error=${encodeURIComponent("Las dos contraseñas no coinciden.")}`);
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/login/actualizar-contrasena?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/mi-jugador");
}
