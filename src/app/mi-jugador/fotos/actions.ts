"use server";

import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { getStripeClient } from "@/lib/stripe";
import { CREDIT_PACK } from "@/lib/images/credits";
import { getAppUrl } from "@/lib/constants";

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
