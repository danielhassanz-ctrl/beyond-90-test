/**
 * Los errores de Supabase llegan en inglés («Invalid login credentials»). Al jugador se le enseñan en castellano; el original solo va al registro.
 */
const RULES: [RegExp, string][] = [
  [/invalid login credentials/i, "El correo o la contraseña no son correctos."],
  [/email not confirmed/i, "Aún no has confirmado tu correo. Revisa tu bandeja de entrada (y la carpeta de spam)."],
  [/user already registered|already been registered/i, "Ya existe una cuenta con ese correo. Prueba a iniciar sesión."],
  [/password should be at least|weak password|password is too short/i, "La contraseña es demasiado corta o débil. Usa al menos 8 caracteres."],
  [/unable to validate email|invalid.*email|email address.*invalid/i, "Ese correo no parece válido."],
  [/rate limit|too many requests|over_email_send_rate_limit|security purposes/i, "Has probado demasiadas veces seguidas. Espera un par de minutos y vuelve a intentarlo."],
  [/new password should be different/i, "La contraseña nueva tiene que ser distinta de la anterior."],
  [/token.*expired|otp.*expired|link.*expired|invalid.*token/i, "Ese enlace ya no es válido o ha caducado. Pide uno nuevo."],
  [/duplicate key|already exists/i, "Eso ya existe."],
  [/payload too large|file size|exceeded the maximum/i, "El archivo pesa demasiado."],
  [/mime type|not allowed/i, "Ese tipo de archivo no está permitido."],
  [/jwt|not authenticated|auth session missing/i, "Tu sesión ha caducado. Vuelve a iniciar sesión."],
  [/network|fetch failed|timeout/i, "No hay conexión con el servidor. Inténtalo de nuevo."],
];

export function friendlyError(message: string | null | undefined, fallback = "Algo ha salido mal. Inténtalo de nuevo."): string {
  const text = String(message ?? "");
  for (const [re, es] of RULES) if (re.test(text)) return es;
  // Si ya viene en castellano (nuestros propios mensajes), se deja tal cual.
  if (/[áéíóúñ¿¡]/i.test(text) || /^(No |El |La |Ese |Esa |Elige |Revisa |Inténtalo)/.test(text)) return text;
  return fallback;
}
