/**
 * Guardas de las fotos que sube el jugador. El bucket ya limita tamaño y tipo (migración 20261016), pero no todas las instalaciones
 * la tienen aplicada: se valida también en el servidor y la extensión sale del tipo, nunca del nombre del archivo (que puede traer «/»).
 */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" };

export function validatePhotoFile(file: { type: string; size: number }): string | null {
  if (!Object.hasOwn(EXT, file.type)) return "La foto tiene que ser JPG, PNG, WebP o HEIC.";
  if (file.size > MAX_PHOTO_BYTES) return "La foto pesa demasiado (máximo 10 MB).";
  return null;
}

export function photoExtension(file: { type: string }): string {
  return EXT[file.type] ?? "jpg";
}

/**
 * ¿Es una imagen servida por nuestro almacenamiento (cualquier bucket público) o por la propia web? Es lo único que el servidor
 * descarga para dibujar tarjetas: una URL cualquiera escrita en la fila del jugador haría que el servidor pidiera direcciones ajenas.
 */
export function isTrustedImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 800) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : null;
    if (supabase && u.origin === supabase && u.pathname.startsWith("/storage/v1/object/public/")) return true;
    const app = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : "https://beyond-90.vercel.app";
    return u.origin === app;
  } catch {
    return false;
  }
}

/**
 * ¿Es una foto del propio jugador en nuestro almacenamiento? Las rutas del servidor que descargan una URL para dibujar una tarjeta
 * (recapCard, dmCard) solo deben tocar esto: si no, cualquiera que edite su fila haría que el servidor pida direcciones cualesquiera.
 */
export function isOwnPhotoUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 600) return false;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  try {
    const u = new URL(url);
    const origin = new URL(base).origin;
    return u.origin === origin && u.pathname.startsWith("/storage/v1/object/public/player-photos/");
  } catch {
    return false;
  }
}
