"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sellProperty, toggleRent } from "@/app/mi-jugador/patrimonio/actions";

/**
 * Los dos botones que van debajo de cada propiedad: ponerla en alquiler (o dejar de alquilarla) y venderla. Las cifras
 * ya vienen calculadas por la página para que el jugador sepa qué va a pasar ANTES de pulsar.
 */
export function PropertyActions({
  propertyKey,
  name,
  canRent,
  rented,
  rentText,
  saleText,
}: {
  propertyKey: string;
  name: string;
  canRent: boolean;
  rented: boolean;
  /** Ej.: "+1.480 € al mes". */
  rentText: string;
  /** Ej.: "recibes 412.000 €" o "pones 12.000 € de tu cuenta". */
  saleText: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const r = await fn();
      setMessage({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });

  const onSell = () => {
    if (!window.confirm(`¿Vender ${name}? ${saleText}. Esta decisión no se puede deshacer.`)) return;
    run(() => sellProperty(propertyKey));
  };

  return (
    <div className="space-y-2 border-t border-panel-border pt-3">
      <div className="grid grid-cols-2 gap-2">
        {canRent ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => toggleRent(propertyKey))}
            className="rounded-full border border-panel-border bg-surface-2 px-3 py-2.5 font-cond text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-gold disabled:opacity-50"
          >
            {rented ? "Dejar de alquilar" : `Alquilar · ${rentText}`}
          </button>
        ) : (
          <span className="flex items-center justify-center rounded-full border border-dashed border-panel-border px-3 py-2.5 text-center font-cond text-[11px] uppercase tracking-wide text-muted-foreground">
            No se alquila
          </span>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={onSell}
          className="rounded-full border border-destructive/50 bg-destructive/10 px-3 py-2.5 font-cond text-xs font-bold uppercase tracking-wide text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
        >
          Vender
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">Si la vendes: {saleText}.</p>
      {message && (
        <p role="status" className={`text-xs ${message.ok ? "text-pitch" : "text-destructive"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
