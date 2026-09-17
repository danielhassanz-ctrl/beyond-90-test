import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * Generación de imágenes vía webhook de Replicate, en vez de esperar
 * dentro del propio servidor sondeando 2-3 minutos.
 *
 * Por qué: la documentación oficial de Next.js solo garantiza que after()
 * complete su trabajo pendiente al apagarse en `next start` (producción),
 * con un periodo de gracia explícito — para `next dev` no hay ninguna
 * garantía equivalente documentada. Encaja con lo observado en pruebas
 * reales: una llamada aislada en un script normal siempre terminaba bien;
 * la misma llamada dentro de after() en desarrollo se perdía sin avisar
 * pasados unos minutos. En vez de depender de que el servidor "aguante
 * despierto", se le pide a Replicate que avise por HTTP cuando termine —
 * la petición original responde casi al instante y no depende de que
 * ningún proceso siga vivo mientras se genera la imagen.
 *
 * Necesita dos variables de entorno que hoy no existen en este proyecto:
 * - NEXT_PUBLIC_APP_URL: la URL pública donde Replicate puede llamar de
 *   vuelta. En local (sin túnel) esto no existe, así que el sistema cae
 *   automáticamente al método antiguo (sondeo síncrono dentro de after()).
 * - SUPABASE_SERVICE_ROLE_KEY: el webhook lo llama Replicate sin sesión
 *   de usuario, así que necesita saltarse las políticas de seguridad
 *   normales (RLS) para leer qué hacer con esa predicción y subir la
 *   imagen al Storage del jugador correcto.
 *
 * Mientras no estén configuradas, todo sigue funcionando exactamente
 * igual que antes — esto es una vía adicional más robusta, no un
 * reemplazo obligatorio.
 */
export function canUseWebhookPipeline(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_APP_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getWebhookUrl(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/replicate-webhook`;
}

/**
 * Cliente con permisos elevados, solo para el propio endpoint de webhook
 * (nunca se expone al navegador). Necesario porque Replicate llama sin
 * ninguna sesión de usuario — sin esto, ni podría leer qué hacer con la
 * predicción ni subir la imagen al Storage del jugador (cuya política
 * exige que la ruta empiece por el uid del usuario autenticado).
 */
export function getServiceRoleClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

/**
 * Verifica que el webhook viene de verdad de Replicate, no de cualquiera
 * que adivine la URL. Sigue el esquema compatible con Svix que usa
 * Replicate: firma HMAC-SHA256 de "id.timestamp.cuerpo" con el secreto de
 * la cuenta (formato "whsec_...", solo la parte tras el prefijo se usa
 * como clave, en base64).
 *
 * Si no hay secreto configurado (REPLICATE_WEBHOOK_SECRET), se deja pasar
 * sin verificar — no ideal para producción, pero mejor que romper el
 * pipeline por completo mientras se configura. El peor caso de abuso es
 * que alguien fuerce a procesar una URL de imagen falsa, no un acceso a
 * datos sensibles.
 */
export function verifyReplicateWebhook(
  body: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
): boolean {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[verifyReplicateWebhook] REPLICATE_WEBHOOK_SECRET no configurado, aceptando sin verificar");
    return true;
  }
  if (!headers.id || !headers.timestamp || !headers.signature) return false;

  const secretKey = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${headers.id}.${headers.timestamp}.${body}`;
  const expected = crypto.createHmac("sha256", secretKey).update(signedContent).digest("base64");

  const received = headers.signature
    .split(" ")
    .map((part) => part.split(",")[1])
    .filter(Boolean);

  return received.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}
