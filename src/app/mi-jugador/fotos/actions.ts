"use server";

import { redirect } from "next/navigation";
import { friendlyError } from "@/lib/supabase/friendly-errors";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { getStripeClient } from "@/lib/stripe";
import { CREDIT_PACK } from "@/lib/images/credits";
import { getAppUrl } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { photoExtension, validatePhotoFile } from "@/lib/images/upload-guards";

/**
 * Crea una sesión de pago único de Stripe Checkout para un pack de fotos
 * extra. No usamos un Precio predefinido del panel de Stripe (`price_id`)
 * para no obligar a crear ningún producto a mano antes de lanzar — el
 * precio se manda "en línea" (price_data) en la propia llamada, así que
 * lo único que hace falta configurar es la clave secreta.
 *
 * El id del jugador va en `client_reference_id`: es lo que el webhook
 * (ver api/stripe/webhook/route.ts) lee para saber a quién darle las
 * fotos cuando el pago se confirma — Stripe no sabe nada de nuestras
 * cuentas, así que este es el único hilo que conecta el pago con el
 * jugador correcto.
 */
export async function createCreditCheckout() {
  const { user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) redirect("/login");

  const stripe = getStripeClient();
  if (!stripe) {
    // Todavía no se ha configurado STRIPE_SECRET_KEY (cuenta de Stripe
    // sin crear o clave sin añadir en Vercel) — nunca debe verse como un
    // error 500 genérico, es un estado esperado antes de tener pagos
    // activados.
    redirect("/mi-jugador/fotos?error=Los pagos todavía no están activados en este juego.");
  }

  const appUrl = getAppUrl() ?? "https://beyond-90.vercel.app";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: player.id,
    line_items: [
      {
        price_data: {
          currency: CREDIT_PACK.currency,
          product_data: { name: `Beyond 90 — ${CREDIT_PACK.label}` },
          unit_amount: CREDIT_PACK.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/mi-jugador/fotos?comprado=1`,
    cancel_url: `${appUrl}/mi-jugador/fotos`,
  });

  if (!session.url) {
    redirect("/mi-jugador/fotos?error=No se pudo iniciar el pago. Inténtalo de nuevo.");
  }

  redirect(session.url);
}

/** Cambia la bandera photo_ref2 sin pisar el resto de banderas (se lee la fila fresca) y comprueba que se escribió. */
async function setSecondRef(playerId: string, url: string | null): Promise<boolean> {
  const supabase = await createClient();
  const { data: fresh } = await supabase.from("players").select("flags").eq("id", playerId).maybeSingle();
  const flags = { ...((fresh?.flags ?? {}) as Record<string, string | boolean>) };
  if (url) flags.photo_ref2 = url;
  else delete flags.photo_ref2;
  const { data: rows } = await supabase.from("players").update({ flags }).eq("id", playerId).select("id");
  return Boolean(rows && rows.length > 0);
}

/** Segunda foto de referencia (otro ángulo u otra luz): las fotos generadas se parecen más con dos referencias. */
export async function saveSecondPhoto(formData: FormData) {
  const { user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) redirect("/login");
  const file = formData.get("photo2") as File | null;
  if (!file || file.size === 0) redirect("/mi-jugador/fotos?error=" + encodeURIComponent("Elige una foto primero."));
  const bad = validatePhotoFile(file);
  if (bad) redirect("/mi-jugador/fotos?error=" + encodeURIComponent(bad));
  const supabase = await createClient();
  const ext = photoExtension(file);
  const path = `${user.id}/ref2-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("player-photos").upload(path, file, { upsert: true });
  if (error) redirect("/mi-jugador/fotos?error=" + encodeURIComponent(friendlyError(error.message, "No se pudo subir la foto.")));
  const { data } = supabase.storage.from("player-photos").getPublicUrl(path);
  const ok = await setSecondRef(player.id, data.publicUrl);
  if (!ok) redirect("/mi-jugador/fotos?error=" + encodeURIComponent("No se pudo guardar la foto. Inténtalo de nuevo."));
  redirect("/mi-jugador/fotos?segunda=ok");
}

export async function removeSecondPhoto() {
  const { user, player } = await getCurrentUserAndPlayer();
  if (!user || !player) redirect("/login");
  await setSecondRef(player.id, null);
  redirect("/mi-jugador/fotos");
}
