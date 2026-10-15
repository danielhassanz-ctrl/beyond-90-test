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
    // Con medios de pago diferidos la sesión se "completa" antes de cobrar: solo se acredita lo ya pagado.
    if (session.payment_status !== "paid") {
      console.log(`[stripe webhook] sesión ${session.id} con payment_status=${session.payment_status}, no se acredita todavía`);
      return NextResponse.json({ received: true });
    }
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

    // Stripe repite avisos (reintentos, reenvíos desde el panel): cada sesión de pago acredita UNA sola vez.
    const handled = String(player.flags?.img_paid_sessions ?? "").split(",").filter(Boolean);
    if (handled.includes(session.id)) {
      console.log(`[stripe webhook] sesión ${session.id} ya acreditada, se ignora el aviso repetido`);
      return NextResponse.json({ received: true });
    }

    const currentPaid = getPaidCredits({ flags: player.flags ?? {} });
    const newFlags = {
      ...(player.flags ?? {}),
      img_paid_credits: String(currentPaid + CREDIT_PACK.images),
      img_paid_sessions: [...handled, session.id].slice(-20).join(","),
    };

    const { error: updateErr } = await supabase.from("players").update({ flags: newFlags }).eq("id", playerId);
    if (updateErr) {
      console.error(`[stripe webhook] no se pudo acreditar al jugador ${playerId}:`, updateErr.message);
    } else {
      console.log(`[stripe webhook] +${CREDIT_PACK.images} fotos acreditadas a jugador ${playerId}`);
    }
  }

  // Reembolso completo o disputa (contracargo): las fotos de ese pago se retiran (hasta lo que quede sin usar), una sola vez por sesión.
  if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
    const obj = event.data.object as { payment_intent?: string | { id: string } | null; refunded?: boolean };
    // Un reembolso parcial no retira las fotos: solo el completo (o una disputa).
    if (event.type === "charge.refunded" && obj.refunded !== true) {
      console.log("[stripe webhook] reembolso parcial: no se retiran fotos");
      return NextResponse.json({ received: true });
    }
    const paymentIntent = typeof obj.payment_intent === "string" ? obj.payment_intent : obj.payment_intent?.id;
    if (!paymentIntent) {
      console.error("[stripe webhook] reembolso sin payment_intent, no se puede localizar la compra");
      return NextResponse.json({ received: true });
    }
    let supabase;
    try {
      supabase = createServiceClient();
    } catch (err) {
      console.error("[stripe webhook]", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "not configured" }, { status: 503 });
    }
    const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent, limit: 1 });
    const session = sessions.data[0];
    const playerId = session?.client_reference_id;
    if (!session || !playerId) {
      console.error(`[stripe webhook] no se encontró la sesión del pago ${paymentIntent}`);
      return NextResponse.json({ received: true });
    }
    const { data: player } = await supabase.from("players").select("id, flags").eq("id", playerId).maybeSingle();
    if (!player) return NextResponse.json({ received: true });
    const revoked = String(player.flags?.img_refunded_sessions ?? "").split(",").filter(Boolean);
    if (revoked.includes(session.id)) {
      console.log(`[stripe webhook] sesión ${session.id} ya retirada, se ignora el aviso repetido`);
      return NextResponse.json({ received: true });
    }
    const currentPaid = getPaidCredits({ flags: player.flags ?? {} });
    const newFlags = {
      ...(player.flags ?? {}),
      img_paid_credits: String(Math.max(0, currentPaid - CREDIT_PACK.images)),
      img_refunded_sessions: [...revoked, session.id].slice(-20).join(","),
    };
    const { data: rows, error: updateErr } = await supabase.from("players").update({ flags: newFlags }).eq("id", playerId).select("id");
    if (updateErr || !rows || rows.length === 0) {
      console.error(`[stripe webhook] no se pudieron retirar las fotos del jugador ${playerId}:`, updateErr?.message ?? "ninguna fila actualizada");
    } else {
      console.log(`[stripe webhook] reembolso: retiradas hasta ${CREDIT_PACK.images} fotos al jugador ${playerId}`);
    }
  }

  return NextResponse.json({ received: true });
}
