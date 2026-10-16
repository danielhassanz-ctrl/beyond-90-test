import webpush from "web-push";

export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** ¿Están las claves VAPID? (NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en Vercel.) */
export function pushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let configured = false;
function configure() {
  if (configured) return;
  // El «subject» de VAPID es la web (no un correo personal): lo ven los servicios de push.
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://beyond-90.vercel.app", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
}

/** "ok", "gone" (el dispositivo ya no existe: hay que borrarlo) o "error" (se reintentará otro día). */
export async function sendPush(sub: StoredSubscription, payload: { title: string; body: string; url: string; tag: string }): Promise<"ok" | "gone" | "error"> {
  if (!pushConfigured()) return "error";
  configure();
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 6 * 3600, urgency: "low" });
    return "ok";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    return status === 404 || status === 410 ? "gone" : "error";
  }
}
