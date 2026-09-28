import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripeClient } from "@/lib/stripe";
import { CREDIT_PACK, getPaidCredits } from "@/lib/images/credits";

/**
 * Stripe llama a esto directamente desde SUS servidores, no desde el
 * navegador del jugador — por eso necesita su PROPIA verificación de
 * identidad (la firma del webhook, con STRIPE_WEBHOOK_SECRET) en vez de
 * depender de la sesión de usuario habitual, y por eso usa el cliente de
 * Supabase con la service role key (ver lib/supabase/service.ts): esta
 * petición no lleva ninguna cookie de sesión de ningún jugador, así que
 * el cliente normal (con RLS atado a auth.uid()) no podría escribir nada.
 *
 * Sin verificar la firma, cualquiera podría llamar a esta URL a mano y
 * regalarse fotos gratis sin pagar — por eso el paso de
 * `constructEvent` no es opcional.
 */
export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    console.error("[stripe webhook] Stripe no está configurado (falta STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET)");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;
  try {
    if (!signature) throw new Error("missing stripe-signature header");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] firma inválida:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const playerId = session.client_reference_id;
    if (!playerId) {
      console.error("[stripe webhook] checkout.session.completed sin client_reference_id, no se puede acreditar a nadie");
      return NextResponse.json({ received: true });
    }

    let supabase;
    try {
      supabase = createServiceClient();
    } catch (err) {
      console.error("[stripe webhook]", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "not configured" }, { status: 503 });
    }

    const { data: player, error: fetchErr } = await supabase
      .from("players")
      .select("id, flags")
      .eq("id", playerId)
      .maybeSingle();

    if (fetchErr || !player) {
      console.error(`[stripe webhook] jugador ${playerId} no encontrado:`, fetchErr?.message);
      return NextResponse.json({ received: true });
    }

    const currentPaid = getPaidCredits({ flags: player.flags ?? {} });
    const newFlags = { ...(player.flags ?? {}), img_paid_credits: String(currentPaid + CREDIT_PACK.images) };

    const { error: updateErr } = await supabase.from("players").update({ flags: newFlags }).eq("id", playerId);
    if (updateErr) {
      console.error(`[stripe webhook] no se pudo acreditar al jugador ${playerId}:`, updateErr.message);
    } else {
      console.log(`[stripe webhook] +${CREDIT_PACK.images} fotos acreditadas a jugador ${playerId}`);
    }
  }

  return NextResponse.json({ received: true });
}
