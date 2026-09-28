"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/constants";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/mi-jugador");
}

/**
 * Antes no existía ninguna forma de recuperar el acceso: el login era
 * solo email+contraseña, sin "¿olvidaste tu contraseña?" ni alternativa
 * — quien la olvidara se quedaba fuera de su carrera para siempre, sin
 * ningún camino de vuelta. Usa el flujo estándar de Supabase (enlace de
 * un solo uso por email → /auth/callback intercambia el código por una
 * sesión temporal de recuperación → /login/actualizar-contrasena deja
 * poner una nueva).
 *
 * Por seguridad (no revelar qué emails existen registrados), Supabase no
 * distingue en la respuesta si el email existe o no — el mensaje al
 * jugador es siempre el mismo genérico, a propósito.
 */
export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const appUrl = getAppUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl ?? ""}/auth/callback?next=${encodeURIComponent("/login/actualizar-contrasena")}`,
  });

  if (error) {
    redirect(`/login/recuperar?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/login?message=${encodeURIComponent("Si ese email tiene una cuenta, te hemos enviado un enlace para recuperar el acceso.")}`,
  );
}

export async function signup(formData: FormData) {
  // El checkbox de la pantalla de login NO lleva `required` en el HTML
  // (ese <form> también manda "Iniciar sesión", y `required` habría
  // bloqueado el login de cualquiera por no marcar una casilla pensada
  // solo para crear cuenta nueva). El bloqueo real está aquí: sin esto,
  // se podía crear una cuenta y empezar a subir fotos sin haber aceptado
  // nunca los términos ni el aviso de que la foto se manda a una IA.
  if (formData.get("accept_terms") !== "yes") {
    redirect(
      `/login?error=${encodeURIComponent("Tienes que aceptar los Términos de uso y la Política de privacidad para crear una cuenta.")}`,
    );
  }

  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent(
        "Te enviamos un email de confirmación. Confirma tu cuenta y después inicia sesión.",
      )}`,
    );
  }

  revalidatePath("/", "layout");
  redirect("/mi-jugador");
}
