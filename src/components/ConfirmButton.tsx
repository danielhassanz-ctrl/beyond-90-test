"use client";

import { useFormStatus } from "react-dom";

/**
 * «Confirmar decisión» que se desactiva al pulsar: en el móvil un doble toque lanzaba la misma decisión dos veces
 * (el servidor también lo impide, pero así el jugador ve que se está procesando).
 */
export function ConfirmButton({ children = "Confirmar decisión" }: { children?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="gold-fill w-full cursor-pointer rounded-full px-4 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Procesando…" : children}
    </button>
  );
}
