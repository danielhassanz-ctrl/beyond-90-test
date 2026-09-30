"use client";

import { useFormStatus } from "react-dom";

/**
 * El bloqueo optimista en el servidor (ver regenerateMilestoneImage)
 * evita que dos clics rápidos lancen dos generaciones a la vez para el
 * mismo hito, pero el jugador seguía pudiendo enviar el formulario varias
 * veces en segundos sin ver ningún cambio — nada en pantalla decía "ya
 * está en marcha", así que la reacción natural era volver a pulsar.
 * `useFormStatus` desactiva el botón en cuanto se envía la primera vez,
 * sin esperar a la respuesta del servidor.
 */
export function RegenerateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded-full border border-gold/50 px-5 py-2 font-cond text-xs font-bold uppercase tracking-wide text-gold disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Enviando…" : "✨ Generar la foto de este momento"}
    </button>
  );
}
