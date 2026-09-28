import Stripe from "stripe";

/**
 * Cliente de Stripe perezoso: no revienta el arranque de la app si
 * STRIPE_SECRET_KEY todavía no está puesta (antes de crear la cuenta de
 * Stripe, que es un paso manual del propio usuario). Cualquier código que
 * intente cobrar sin la clave configurada recibe null y debe manejarlo
 * con un mensaje claro, no con un error de servidor genérico.
 */
export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
